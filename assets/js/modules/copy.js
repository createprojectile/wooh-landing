import { $$ } from '../lib/dom.js';
import { showToast } from './toast.js';

let labelTimer;

/**
 * Copy any element's `data-copy` value. Elements may contain one or more
 * `.copy-label` nodes; they are swapped to a confirmation label temporarily.
 */
function copyText(text, button) {
  const labels = $$('.copy-label', button);
  const originals = labels.map((label) => label.textContent);

  const done = () => {
    labels.forEach((label) => { label.textContent = 'Скопировано ✓'; });
    clearTimeout(labelTimer);
    labelTimer = window.setTimeout(() => {
      labels.forEach((label, index) => { label.textContent = originals[index]; });
    }, 1800);
    showToast('Скопировано в буфер');
  };

  const fallback = () => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      done();
    } catch {
      showToast('Не удалось скопировать');
    }
    textarea.remove();
  };

  if (!text) {
    showToast('Нечего копировать');
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

/** Delegated listener: works for hero, server cards and the footer command. */
export function initCopy() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest && event.target.closest('[data-copy]');
    if (!button) return;
    copyText(button.dataset.copy || '', button);
  });
}
