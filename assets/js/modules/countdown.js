import { $, pad } from '../lib/dom.js';
import { WIPE } from '../config.js';

/** Next wipe: the configured UTC weekday/hour, always in the future. */
function nextWipe() {
  const now = new Date();
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    WIPE.utcHour,
    0,
    0,
  ));
  target.setUTCDate(target.getUTCDate() + ((WIPE.utcDay - target.getUTCDay() + 7) % 7));
  if (target <= now) target.setUTCDate(target.getUTCDate() + 7);
  return target;
}

/** Live countdown in the hero: "6д 01:08:58". */
export function initCountdown() {
  const el = $('#wipeTimer');
  if (!el) return;

  function tick() {
    let seconds = Math.max(0, Math.floor((nextWipe() - Date.now()) / 1000));
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    el.textContent = `${days}д ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  tick();
  window.setInterval(tick, 1000);
}
