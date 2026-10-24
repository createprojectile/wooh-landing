import { $ } from '../lib/dom.js';

let timer;

/** Bottom toast used by copy actions and errors. */
export function showToast(text) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(timer);
  timer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}
