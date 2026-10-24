/** Small DOM and value helpers shared by every module. */

export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const pad = (value) => String(value).padStart(2, '0');

/** Read the preference on demand so it also reacts to OS changes. */
export const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Russian plural form: plural(3, 'игрок', 'игрока', 'игроков') → 'игрока'. */
export function plural(n, one, few, many) {
  const a = n % 100;
  const b = n % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b > 1 && b < 5) return few;
  return many;
}

/** Safe textContent write for optional nodes. */
export function setText(node, value) {
  if (node) node.textContent = value;
}
