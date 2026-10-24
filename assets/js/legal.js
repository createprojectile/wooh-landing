/** Legal pages only need the page transition; no live data or chart. */
import { initCurtain } from './modules/curtain.js';

window.__woohBooted = true;
document.documentElement.classList.remove('no-modules');
initCurtain();
