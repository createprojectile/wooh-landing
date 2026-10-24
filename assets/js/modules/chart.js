import { RANGES, SERVERS } from '../config.js';
import { $, $$, clamp } from '../lib/dom.js';
import { fmtFull, fmtTick } from '../lib/format.js';
import { getJSON } from '../lib/http.js';
import { getPlayers } from './live.js';

const state = {
  server: 'main',
  range: '24h',
  points: [],
  yMax: 100,
  demo: true,
  key: '',
  hover: -1,
};

const el = {
  chart: $('#chart'),
  overlay: $('#chartOverlay'),
  grid: $('#chartGrid'),
  line: $('#chartLine'),
  area: $('#chartArea'),
  ticks: $('#chartTicks'),
  cross: $('#chartCross'),
  dot: $('#chartDot'),
  empty: $('#chartEmpty'),
  note: $('#chartNote'),
  rangeTitle: $('#chartRangeTitle'),
  peak: $('#chartPeak'),
  peakAt: $('#chartPeakAt'),
  avg: $('#chartAvg'),
  readLabel: $('#readLabel'),
  readValue: $('#readValue'),
  readTime: $('#readTime'),
  root: $('#online'),
};

function makeDemoPoints(rangeId, base) {
  const range = RANGES[rangeId];
  const count = 49;
  const step = range.span / (count - 1);
  const end = Math.floor(Date.now() / range.step) * range.step;

  return Array.from({ length: count }, (_, index) => {
    const t = end - (count - 1 - index) * step;
    const hours = t / 3600000;
    const daily = 0.9 + 0.35 * Math.sin(((hours % 24) / 24) * Math.PI * 2 - Math.PI / 2);
    const weekly = 0.08 * Math.sin((hours / 168) * Math.PI * 2);
    const noise = 0.05 * Math.sin(index * 1.7 + base) + 0.03 * Math.sin(index * 0.53);
    const v = Math.max(3, Math.round(base * (daily + weekly + noise)));
    return { t, v, p: v };
  });
}

function currentOnline() {
  return getPlayers(state.server);
}

function setReadout(label, value, time) {
  if (el.readLabel) el.readLabel.textContent = label;
  if (el.readValue) el.readValue.textContent = value;
  if (el.readTime) el.readTime.textContent = time;
}

function resetReadout() {
  if (!state.points.length) {
    setReadout('Сейчас', '—', '—');
    return;
  }
  const last = state.points[state.points.length - 1];
  setReadout('Сейчас', String(currentOnline() ?? last.v), fmtFull(Date.now()));
}

function buildPath() {
  const points = state.points;
  const count = points.length;
  const samples = 168;
  const coords = [];

  for (let k = 0; k < samples; k++) {
    let value = 0;
    if (count) {
      const position = (k / (samples - 1)) * (count - 1);
      const index = Math.floor(position);
      const fraction = position - index;
      value = points[index].v * (1 - fraction) + points[Math.min(index + 1, count - 1)].v * fraction;
    }
    const x = ((k / (samples - 1)) * 1000).toFixed(1);
    const y = (300 - (value / state.yMax) * 300).toFixed(1);
    coords.push(`${x},${y}`);
  }

  const line = `M${coords.join(' L')}`;
  if (el.line) el.line.setAttribute('d', line);
  if (el.area) el.area.setAttribute('d', `${line} L1000,300 L0,300 Z`);
}

function renderChart() {
  const points = state.points;
  const count = points.length;
  const range = RANGES[state.range];

  if (el.rangeTitle) el.rangeTitle.textContent = range.title;

  if (!count) {
    if (el.empty) el.empty.hidden = false;
    resetReadout();
    return;
  }
  if (el.empty) el.empty.hidden = true;

  const peak = Math.max(...points.map((point) => point.p));
  const peakPoint = points.find((point) => point.p === peak);
  const avg = Math.round(points.reduce((sum, point) => sum + point.v, 0) / count);

  const max = Math.max(5, peak * 1.15);
  const step = max <= 10 ? 2 : max <= 40 ? 10 : max <= 100 ? 20 : 50;
  state.yMax = Math.ceil(max / step) * step;

  buildPath();

  if (el.grid) {
    el.grid.innerHTML = [1, 2, 3, 4].map((k) => {
      const label = Math.round((state.yMax * k) / 4);
      return `<div class="chart__grid-line" style="bottom:${k * 25}%"><span>${label}</span></div>`;
    }).join('');
  }

  if (el.ticks) {
    el.ticks.innerHTML = [0, 1, 2, 3, 4, 5].map((k) => {
      const index = Math.round((k * (count - 1)) / 5);
      const shift = k === 0 ? '0' : k === 5 ? '-100%' : '-50%';
      const left = `${(index / (count - 1)) * 100}%`;
      return `<span style="left:${left};transform:translateX(${shift})">${fmtTick(points[index].t, state.range)}</span>`;
    }).join('');
  }

  if (el.peak) el.peak.textContent = String(peak);
  if (el.peakAt) el.peakAt.textContent = peakPoint ? fmtFull(peakPoint.t) : '—';
  if (el.avg) el.avg.textContent = String(avg);

  if (el.note) {
    el.note.textContent = state.demo
      ? 'Демо-график для предпросмотра. В продакшене — /api/online-history, время МСК.'
      : 'Онлайн записывается каждые 5 минут. Время — МСК.';
  }

  if (state.hover < 0) resetReadout();
}

async function loadChart() {
  const key = `${state.server}:${state.range}`;
  state.key = key;

  let points = null;
  try {
    const json = await getJSON(`/api/online-history?server=${state.server}&range=${state.range}`);
    if (json && json.success && Array.isArray(json.points) && json.points.length >= 3) {
      points = json.points.map((point) => ({
        t: point.t,
        v: point.v ?? 0,
        p: point.p ?? point.v ?? 0,
      }));
    }
  } catch {
    /* Static preview — demo chart below. */
  }

  // A newer request (other server/range) has already started.
  if (state.key !== key) return;

  state.demo = !points;
  if (!points) {
    const base = currentOnline()
      || SERVERS.find((server) => server.id === state.server)?.fallback
      || 100;
    points = makeDemoPoints(state.range, base);
  }

  state.points = points;
  state.hover = -1;
  if (el.cross) el.cross.style.opacity = '0';
  if (el.dot) el.dot.style.opacity = '0';
  renderChart();
}

function select(index) {
  if (!state.points.length) return;
  const i = clamp(Math.round(index), 0, state.points.length - 1);
  const point = state.points[i];
  const left = `${(i / (state.points.length - 1)) * 100}%`;

  if (el.cross) {
    el.cross.style.left = left;
    el.cross.style.opacity = '.35';
  }
  if (el.dot) {
    el.dot.style.left = left;
    el.dot.style.bottom = `${(point.v / state.yMax) * 100}%`;
    el.dot.style.opacity = '1';
  }

  if (i !== state.hover) {
    state.hover = i;
    setReadout('Выбрано', String(point.v), fmtFull(point.t));
  }
}

function leaveChart() {
  state.hover = -1;
  if (el.cross) el.cross.style.opacity = '0';
  if (el.dot) el.dot.style.opacity = '0';
  resetReadout();
}

function bindControls() {
  const root = el.root || document;

  $$('[data-server]', root).forEach((button) => {
    button.addEventListener('click', () => {
      state.server = button.dataset.server;
      $$('[data-server]', root).forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });
      loadChart();
    });
  });

  $$('[data-range]', root).forEach((button) => {
    button.addEventListener('click', () => {
      state.range = button.dataset.range;
      $$('[data-range]', root).forEach((other) => {
        other.classList.toggle('is-active', other === button);
      });
      loadChart();
    });
  });

  if (!el.overlay) return;

  el.overlay.addEventListener('pointermove', (event) => {
    if (!state.points.length) return;
    const rect = el.overlay.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width);
    select(ratio * (state.points.length - 1));
  });
  el.overlay.addEventListener('pointerleave', leaveChart);
  el.overlay.addEventListener('pointercancel', leaveChart);

  // Keyboard access: arrows / Home / End / Escape.
  el.overlay.addEventListener('keydown', (event) => {
    if (!state.points.length) return;
    const last = state.points.length - 1;
    let next = state.hover < 0 ? Math.round(last / 2) : state.hover;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (event.key === 'Escape') {
      leaveChart();
      return;
    } else {
      return;
    }

    event.preventDefault();
    select(next);
  });

  el.overlay.addEventListener('focus', () => {
    if (!state.points.length) return;
    select(state.hover < 0 ? Math.round((state.points.length - 1) / 2) : state.hover);
  });
  el.overlay.addEventListener('blur', leaveChart);
}

/** Wire controls and return the public refresh hook. */
export function initChart() {
  bindControls();
  return { refresh: loadChart };
}
