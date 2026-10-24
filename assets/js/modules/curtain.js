/**
 * Page curtain: slides away on load and covers internal navigation.
 * Also works without the rest of the JS thanks to the inline fail-safe
 * in each HTML file (adds .is-done/.is-hidden after 2.5s).
 */
export function initCurtain() {
  const curtain = document.getElementById('curtain');
  if (!curtain) return;

  const hide = () => {
    curtain.classList.add('is-done');
    window.setTimeout(() => curtain.classList.add('is-hidden'), 900);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(hide, 120);
  } else {
    window.addEventListener('load', () => window.setTimeout(hide, 120), { once: true });
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    let url;
    try {
      url = new URL(link.href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (/\.(exe|zip|rar|7z|txt|png|jpe?g|pdf)$/i.test(url.pathname)) return;

    event.preventDefault();
    curtain.classList.remove('is-hidden');
    curtain.classList.remove('is-done');
    window.setTimeout(() => { location.href = url.href; }, 700);
  }, true);
}
