import { $, $$ } from '../lib/dom.js';

/**
 * Mobile menu with focus return and a simple focus trap.
 * Hidden on desktop via CSS; the handlers are harmless there.
 */
export function initMobileMenu() {
  const menu = $('#mobileMenu');
  const openButton = $('#menuOpen');
  const closeButton = $('#menuClose');
  if (!menu || !openButton) return;

  let previousFocus = null;
  const focusables = () => $$('a[href], button:not([disabled])', menu);

  function setOpen(open) {
    openButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);

    if (open) {
      previousFocus = document.activeElement;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      // Force a style flush: the panel is visibility:hidden until .is-open
      // is applied, and hidden elements cannot take focus.
      void menu.offsetWidth;
      const first = focusables()[0] || menu;
      first.focus({ preventScroll: true });
    } else {
      // Move focus out before hiding, otherwise browsers warn about
      // aria-hidden on a focused subtree.
      const target = previousFocus && previousFocus !== document.body ? previousFocus : openButton;
      target.focus({ preventScroll: true });
      previousFocus = null;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
    }
  }

  openButton.addEventListener('click', () => setOpen(true));
  if (closeButton) closeButton.addEventListener('click', () => setOpen(false));

  $$('a', menu).forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;

    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
