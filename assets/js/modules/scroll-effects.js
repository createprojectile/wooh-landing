import { $, $$, clamp, prefersReducedMotion } from '../lib/dom.js';
import { MOBILE_BREAKPOINT } from '../config.js';

/**
 * Scroll-driven visuals:
 *  - pinned horizontal servers track on desktop;
 *  - descending feature cards (scale + brightness).
 * Both update synchronously; no rAF dependency (works in throttled tabs).
 */
export function initScrollEffects() {
  const servers = $('#servers');
  const track = $('#serversTrack');
  const bar = $('#serversBar');
  const cards = $$('[data-stack]');

  function updateServers() {
    if (!servers || !track) return;

    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      track.style.transform = '';
      if (bar) bar.style.transform = 'scaleX(0)';
      return;
    }

    const rect = servers.getBoundingClientRect();
    const max = servers.offsetHeight - window.innerHeight;
    if (max <= 0) return;

    const progress = clamp(-rect.top / max);
    const distance = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.transform = `translate3d(${-distance * progress}px,0,0)`;
    if (bar) bar.style.transform = `scaleX(${progress})`;
  }

  function updateStack() {
    if (prefersReducedMotion() || !cards.length) return;

    cards.forEach((card, index) => {
      const next = cards[index + 1];
      if (!next) {
        card.style.transform = '';
        card.style.filter = '';
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const k = clamp((cardRect.bottom - nextRect.top) / cardRect.height);
      card.style.transform = `scale(${1 - k * 0.06})`;
      card.style.filter = `brightness(${1 - k * 0.35})`;
    });
  }

  function update() {
    updateServers();
    updateStack();
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
