# Архитектура

## 1. Цели

- Статический сайт без сборки и зависимостей, который можно выложить копированием файлов.
- Мгновенная загрузка: только self-hosted шрифты, 5 изображений контента + логотип, без JS-фреймворков.
- Живые данные при наличии backend и корректная деградация без него.
- Читаемый и индексируемый контент (правила и тексты — в HTML).
- Доступность: клавиатура, фокус, ARIA, reduced motion.

## 2. Дерево и зоны ответственности

```
index.html                  разметка + SEO + inline fail-safe
privacy/, terms/            отдельные документы, минимум JS
assets/css/fonts.css        @font-face (2 семейства × 2 подмножества)
assets/css/base.css         токены, reset, типографика, общие классы
assets/css/components.css   переиспользуемые компоненты
assets/css/sections/*.css   стили секций (изолированы по префиксам)
assets/css/legal.css        юридические страницы
assets/css/responsive.css   медиазапросы, reduced motion
assets/js/config.js         единственный источник данных
assets/js/lib/*.js          утилиты без побочных эффектов
assets/js/modules/*.js      поведение, каждый модуль = init()
assets/js/main.js           boot лендинга
assets/js/legal.js          boot юр. страниц
```

## 3. Загрузка страницы

1. Браузер читает `<head>`: meta, canonical, Open Graph, JSON-LD.
2. Preconnect к `api.gamemonitoring.ru`, preload двух кириллических шрифтов.
3. Подключаются CSS в фиксированном порядке (см. ниже).
4. Inline-скрипт добавляет `html.js` и запускает таймер 2,5 с.
5. `<script type="module" src="assets/js/main.js">` загружается отложенно.
6. `main.js` ждёт `DOMContentLoaded` (или запускается сразу), вызывает `init*()`.
7. После первого ответа live-модуля вызывается `chart.refresh()` — график получает актуальную базовую величину.

### Fail-safe

Если модули не загрузились (например, `file://`), через 2,5 с:

- `html` получает `.no-modules`;
- занавес получает `is-done is-hidden`;
- CSS `.no-modules` принудительно показывает все `[data-reveal]` и `.line-mask > span`;
- вкладки правил скрываются, а все четыре панели показываются подряд — текст остаётся доступным.

Это позволяет читать контент без JS, но live-данные, график и вкладки остаются неактивными.

## 4. CSS-архитектура

Порядок подключения — часть контракта:

```
fonts.css
base.css
components.css
sections/hero.css
sections/servers.css
sections/online.css
sections/features.css
sections/updates.css
sections/reviews.css
sections/download.css
sections/rules.css
sections/final.css
responsive.css        ← всегда последним
```

Правила:

- `base.css` содержит только токены, reset, типографику и общие helper-классы (`.section`, `.section-title`, `.section-head`).
- `components.css` — только переиспользуемое: занавес, кнопки, чипы, бренд, мобильное меню, тост, reveal-примитивы.
- Каждая секция имеет свой префикс (`.hero`, `.servers`, `.online`, `.feature-card`, `.update-row`, `.review`, `.download`, `.rules`, `.final`).
- Медиазапросы живут только в `responsive.css` и `legal.css`. Не добавляй их в секции — иначе каскад станет непредсказуемым.
- Цвета и отступы берутся из `:root`. Хардкод допустим только для единичных декоративных значений.

### Наследование и каскад

- `body { overflow-x: clip }` защищает от случайного горизонтального скролла, но не заменяет адаптив.
- `body.is-locked { overflow: hidden }` блокирует скролл при открытом меню.
- `:focus-visible` задан глобально; компоненты не должны его отключать.
- `[hidden] { display: none !important }` — важно для панелей правил и счётчика очереди.

## 5. JavaScript-архитектура

### Граф модулей

```
main.js
├─ modules/curtain.js
├─ modules/mobile-menu.js
├─ modules/copy.js ──────────→ modules/toast.js
├─ modules/countdown.js
├─ modules/rules.js
├─ modules/stats.js
├─ modules/scroll-effects.js
├─ modules/reveal.js
├─ modules/chart.js
└─ modules/live.js

legal.js
└─ modules/curtain.js

config.js ← читают live, chart, countdown, stats, scroll-effects
lib/*     ← читают почти все модули
```

- Модули не имеют побочных эффектов при импорте: экспортируют `init*()`.
- Общее состояние живёт внутри модуля (например, `state` в `chart.js` и `live.js`).
- Связь `live → chart` — через колбэк `onReady`, без глобальных событий.
- `window.__woohBooted` — единственный глобальный флаг, нужен fail-safe.

### Live-данные

```
GET /api/servers
   ↓ (если сервер не ответил)
GET https://api.gamemonitoring.ru/servers/{monitorId}
   ↓ (если всё недоступно)
localStorage['wooh_live'] (TTL 10 мин)
   ↓
DEMO_LIVE из config.js
```

- Опрос каждые 10 секунд, защита от параллельных запросов (`inFlight`).
- Рендер: `#onlineTotal` (сумма), `[data-status]`, `[data-players]`, `[data-queue]`.
- Показ игроков: `players - queued`, чтобы очередь не раздувала онлайн.
- Анимация числа отключается при `prefers-reduced-motion`; есть таймер-страховка на 1,7 с для фоновых вкладок.

### График

- `chart.js` хранит `server`, `range`, `points`, `yMax`, `hover`.
- Запрос: `/api/online-history?server=...&range=...`.
- Валидный ответ: `success: true` и ≥3 точки.
- Иначе — `makeDemoPoints()` на основе текущего онлайна/fallback.
- SVG: 168 сэмплов, линейная интерполяция; ось Y округляется до «красивого» шага.
- Взаимодействие: pointer, стрелки, Home/End, Escape; readout с `aria-live="polite"`.
- Защита от гонок: `state.key` сравнивается после `await`.

### Таймер вайпа

- `nextWipe()` считает следующий `WIPE.utcDay` в `WIPE.utcHour` UTC.
- Отображение: `Nд ЧЧ:ММ:СС`, обновление раз в секунду.

### Счётчики

- `POST /api/visit` и `GET /api/site-stats` каждые 60 секунд.
- `POST /api/launcher-download` при клике по `[data-download]` (keepalive).
- Ошибки глушатся: на статике счётчики просто не появляются.

### Скролл-эффекты

- Серверы: секция высотой `320vh`, внутри sticky-экран; прогресс = `-rect.top / (height - viewport)`, трек сдвигается на `scrollWidth - viewport`.
- Карточки фич: масштаб и яркость зависят от перекрытия со следующей карточкой.
- Всё считается синхронно в обработчике `scroll` (passive), без rAF — так работает в throttled-вкладках.
- На ≤760 px горизонтальный сдвиг отключается.

## 6. Доступность

- Вкладки правил: `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`, roving `tabindex`, стрелки/Home/End.
- График: `tabindex="0"`, `role="group"`, `aria-describedby`, управление стрелками, live-регион.
- Мобильное меню: `aria-expanded`, `aria-hidden`, focus trap, Escape, возврат фокуса.
- Изображения контента имеют `alt`; декоративные — `alt=""`.
- Reduced motion: отключаются transition/animation, reveal показывается сразу, занавес скрыт.
- Все интерактивные элементы доступны с клавиатуры и имеют видимый `:focus-visible`.

## 7. Производительность

- Нет JS-фреймворка и сборки: 1 HTML, 14 CSS, 17 JS-файлов, 4 шрифта, 6 изображений.
- Шрифты: `font-display: swap`, preload только кириллицы (основной трафик).
- Изображения: явные `width`/`height`, `loading="lazy"` ниже первого экрана, `decoding="async"`.
- Анимации только `transform`/`opacity`/`filter`.
- API: preconnect к внешнему монитору, `cache: 'no-store'` для актуальности.
- Кэш live-данных снижает нагрузку и спасает при недоступном API.

## 8. Осознанные решения

| Решение | Причина |
| --- | --- |
| Нет сборки | Простота деплоя и поддержки; сайт небольшой |
| ES-модули | Изоляция, явные зависимости, нет глобальной области |
| CSS по секциям | Локальные изменения не задевают остальные блоки |
| Правила в HTML | SEO, чтение без JS, меньше JS-кода |
| `config.js` | Одна точка правки данных |
| Демо-график | Сайт не выглядит сломанным без backend |
| Inline fail-safe | Предпросмотр с диска остаётся читаемым |

## 9. Ограничения

- Требуется HTTP(S) для модулей.
- Нет полифилов для старых браузеров.
- Все API-пути абсолютные (`/api/...`): при деплое в подкаталог нужен reverse proxy или правка путей.
- Backend не входит в эту папку; контракты описаны в `docs/API.md`.
