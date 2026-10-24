import { $, plural } from '../lib/dom.js';
import { getJSON, postJSON } from '../lib/http.js';
import { STATS } from '../config.js';

const downloads = $('#downloadsNum');
const visitors = $('#visitors');
const visitorsNum = $('#visitorsNum');
const visitorsWord = $('#visitorsWord');

function applyStats(json) {
  if (!json || !json.success) return;

  if (typeof json.downloads === 'number' && downloads) {
    downloads.textContent = json.downloads.toLocaleString('ru-RU');
  }

  if (typeof json.visitors24h === 'number' && visitors && visitorsNum && visitorsWord) {
    visitors.hidden = false;
    visitorsNum.textContent = json.visitors24h.toLocaleString('ru-RU');
    visitorsWord.textContent = plural(json.visitors24h, 'человек был', 'человека были', 'человек были');
  }
}

/** Downloads / visitors counters. All calls fail silently on a static preview. */
export function initStats() {
  async function tick() {
    try {
      applyStats(await postJSON('/api/visit'));
    } catch {
      /* no backend */
    }
    try {
      applyStats(await getJSON('/api/site-stats'));
    } catch {
      /* no backend */
    }
  }

  tick();
  window.setInterval(tick, STATS.refreshMs);

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('[data-download]');
    if (!link) return;
    postJSON('/api/launcher-download', { keepalive: true })
      .then(applyStats)
      .catch(() => {});
  });
}
