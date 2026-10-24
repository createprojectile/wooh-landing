/**
 * Landing entry point. Modules are intentionally tiny and side-effect free
 * until their init() is called.
 */
import { initCurtain } from './modules/curtain.js';
import { initMobileMenu } from './modules/mobile-menu.js';
import { initCopy } from './modules/copy.js';
import { initCountdown } from './modules/countdown.js';
import { initRules } from './modules/rules.js';
import { initStats } from './modules/stats.js';
import { initReveal } from './modules/reveal.js';
import { initScrollEffects } from './modules/scroll-effects.js';
import { initChart } from './modules/chart.js';
import { initLive } from './modules/live.js';

function boot() {
  window.__woohBooted = true;
  document.documentElement.classList.remove('no-modules');

  initCurtain();
  initMobileMenu();
  initCopy();
  initCountdown();
  initRules();
  initStats();
  initScrollEffects();
  initReveal();

  const chart = initChart();
  initLive({ onReady: () => chart.refresh() });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
