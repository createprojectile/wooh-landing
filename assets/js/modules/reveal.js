import { $$, prefersReducedMotion } from '../lib/dom.js';

/**
 * Reveal-on-scroll for `.line-mask` and `[data-reveal]`.
 * Includes a safety net for background tabs / headless previews where
 * IntersectionObserver may be throttled.
 */
export function initReveal() {
  const targets = $$('.line-mask, [data-reveal]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach((el) => {
    const delay = el.dataset.delay || (el.querySelector('[data-delay]')?.dataset.delay);
    if (delay) el.style.setProperty('--delay', `${delay}ms`);
    observer.observe(el);
  });

  window.setTimeout(() => {
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
        el.classList.add('is-in');
        observer.unobserve(el);
      }
    });
  }, 1100);
}
