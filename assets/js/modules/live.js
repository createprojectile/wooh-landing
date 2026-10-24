import { DEMO_LIVE, LIVE, SERVERS } from '../config.js';
import { $, prefersReducedMotion } from '../lib/dom.js';
import { getJSON } from '../lib/http.js';

/** Current live data, keyed by server id. */
const state = { live: {}, demo: false };
let displayedTotal = 0;

export const getLive = () => state.live;
export const isDemo = () => state.demo;

export function getPlayers(serverId) {
  const server = state.live[serverId];
  return server && typeof server.players === 'number' ? server.players : null;
}

export function getTotal() {
  return SERVERS.reduce((sum, server) => sum + (state.live[server.id]?.players || 0), 0);
}

export function hasLiveData() {
  return SERVERS.some((server) => typeof state.live[server.id]?.players === 'number');
}

function animateTotal(target) {
  const el = $('#onlineTotal');
  if (!el) return;

  if (target == null) {
    el.textContent = '—';
    return;
  }
  if (prefersReducedMotion()) {
    el.textContent = String(target).padStart(2, '0');
    displayedTotal = target;
    return;
  }

  const from = displayedTotal;
  const start = performance.now();
  let finished = false;

  const frame = (now) => {
    const progress = Math.min(1, (now - start) / 1400);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(from + (target - from) * eased)).padStart(2, '0');
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      finished = true;
      displayedTotal = target;
    }
  };

  requestAnimationFrame(frame);

  // rAF is throttled in background tabs; guarantee the final value.
  window.setTimeout(() => {
    if (finished) return;
    el.textContent = String(target).padStart(2, '0');
    displayedTotal = target;
  }, 1700);
}

function render() {
  animateTotal(hasLiveData() ? getTotal() : null);

  SERVERS.forEach((server) => {
    const live = state.live[server.id];
    const status = $(`[data-status="${server.id}"]`);
    const players = $(`[data-players="${server.id}"]`);
    const queue = $(`[data-queue="${server.id}"]`);

    if (!live) {
      if (status) {
        status.textContent = 'Нет данных';
        status.classList.remove('is-online');
      }
      if (players) players.textContent = '— / —';
      if (queue) queue.hidden = true;
      return;
    }

    if (status) {
      status.textContent = live.online ? '● Online' : 'Offline';
      status.classList.toggle('is-online', !!live.online);
    }
    if (players) {
      const shown = Math.max(0, (live.players ?? 0) - (live.queued || 0));
      players.textContent = `${shown} / ${live.max || server.max}`;
    }
    if (queue) {
      const queued = live.queued || 0;
      queue.hidden = queued <= 0;
      queue.textContent = queued > 0 ? `+${queued} в очереди` : '';
    }
  });
}

/** Ask the backend first, then the public monitor, then a 10-minute cache. */
async function fetchLive() {
  const next = {};

  try {
    const json = await getJSON(LIVE.endpoint);
    SERVERS.forEach((server) => {
      const row = json && json[server.id];
      if (row && row.success && typeof row.players === 'number') {
        next[server.id] = {
          online: true,
          players: row.players,
          queued: row.queued || 0,
          max: row.maxPlayers || server.max,
        };
      }
    });
  } catch {
    /* Static preview or backend is down — use the public monitor below. */
  }

  await Promise.all(SERVERS.filter((server) => !next[server.id]).map(async (server) => {
    try {
      const json = await getJSON(LIVE.fallback(server.monitorId));
      const row = json && json.response;
      if (!row) return;
      next[server.id] = {
        online: !!row.status,
        players: typeof row.numplayers === 'number' ? row.numplayers : null,
        queued: row.queueplayers || 0,
        max: row.maxplayers || server.max,
      };
    } catch {
      /* Ignore a single failed monitor. */
    }
  }));

  if (!Object.keys(next).length) {
    try {
      const saved = JSON.parse(localStorage.getItem(LIVE.cacheKey) || 'null');
      if (saved && Date.now() - saved.t < LIVE.cacheTtlMs && saved.live) {
        Object.assign(next, saved.live);
      }
    } catch {
      /* Corrupt cache — ignore. */
    }
  }

  return next;
}

/**
 * Start polling. `onReady` fires once after the first attempt (successful,
 * cached or demo) so the chart can build with the right base value.
 */
export function initLive({ onReady } = {}) {
  let ready = false;
  let inFlight = false;

  async function tick() {
    if (inFlight) return;
    inFlight = true;
    try {
      const next = await fetchLive();
      state.demo = !Object.keys(next).length;
      state.live = state.demo ? DEMO_LIVE : next;

      try {
        localStorage.setItem(LIVE.cacheKey, JSON.stringify({ t: Date.now(), live: state.live }));
      } catch {
        /* Storage can be full or blocked. */
      }

      render();

      if (!ready) {
        ready = true;
        onReady?.();
      }
    } finally {
      inFlight = false;
    }
  }

  tick();
  window.setInterval(tick, LIVE.refreshMs);
}
