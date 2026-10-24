import { $$ } from '../lib/dom.js';

/**
 * Rules tabs. The panels are real HTML (crawlable, readable without JS),
 * so this module only toggles `hidden` / active classes.
 */
export function initRules() {
  const tabs = $$('#ruleTabs [role="tab"]');
  const panels = $$('#rulesPanels [role="tabpanel"]');
  if (!tabs.length || tabs.length !== panels.length) return;

  function activate(index, moveFocus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
      if (active && moveFocus) tab.focus();
    });
  }

  const initial = Math.max(0, tabs.findIndex((tab) => tab.classList.contains('is-active')));
  activate(initial);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let next = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else return;

      event.preventDefault();
      activate(next, true);
    });
  });
}
