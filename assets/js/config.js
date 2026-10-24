/**
 * Central project configuration.
 *
 * Content that is edited often lives here (servers, periods, API contract).
 * Section copy lives in index.html; visual tokens live in assets/css/base.css.
 */

/** Game servers shown in the hero, cards and chart. */
export const SERVERS = [
  { id: 'main', monitorId: '11252685', max: 200, fallback: 128 },
  { id: 'combat', monitorId: '11487742', max: 50, fallback: 19 },
];

/** Chart periods. `span` and `step` are milliseconds. */
export const RANGES = {
  '30d': { label: '30д', title: 'за месяц', span: 720 * 3600000, step: 300 * 60000 },
  '14d': { label: '14д', title: 'за 2 недели', span: 336 * 3600000, step: 120 * 60000 },
  '7d': { label: '7д', title: 'за неделю', span: 168 * 3600000, step: 60 * 60000 },
  '3d': { label: '3д', title: 'за 3 дня', span: 72 * 3600000, step: 30 * 60000 },
  '24h': { label: '24ч', title: 'за сутки', span: 24 * 3600000, step: 10 * 60000 },
  '12h': { label: '12ч', title: 'за 12 часов', span: 12 * 3600000, step: 5 * 60000 },
  '6h': { label: '6ч', title: 'за 6 часов', span: 6 * 3600000, step: 5 * 60000 },
};

/** Shown when every server API is unavailable. */
export const DEMO_LIVE = {
  main: { online: true, players: 128, queued: 0, max: 200, demo: true },
  combat: { online: true, players: 19, queued: 0, max: 50, demo: true },
};

/** Live-status polling and cache. */
export const LIVE = {
  endpoint: '/api/servers',
  fallback: (monitorId) => `https://api.gamemonitoring.ru/servers/${monitorId}`,
  refreshMs: 10000,
  cacheKey: 'wooh_live',
  cacheTtlMs: 10 * 60 * 1000,
};

/** Site statistics polling. */
export const STATS = {
  refreshMs: 60000,
};

/** Wipe schedule: every Friday at 13:00 UTC (16:00 MSK). */
export const WIPE = {
  utcDay: 5,
  utcHour: 13,
};

/** Below this width the servers gallery becomes a vertical list. Keep in sync with responsive.css. */
export const MOBILE_BREAKPOINT = 760;
