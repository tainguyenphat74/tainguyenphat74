// Apply before styles paint to avoid flashing the wrong theme.
(() => {
  const key = 'portfolio:theme';
  const modes = ['dark', 'light', 'system'];
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = 'system';
  try {
    const saved = window.localStorage.getItem(key);
    if (modes.includes(saved)) mode = saved;
  } catch { /* Themes still work when storage is blocked. */ }

  function apply() {
    const resolved = mode === 'system' ? (system.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#191919' : '#fafafa';
    document.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeMode === mode));
    });
  }

  apply();
  system.addEventListener('change', () => { if (mode === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    mode = modes.includes(event.newValue) ? event.newValue : 'system';
    apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('.theme-dropdown');
    const trigger = dropdown?.querySelector('summary');
    document.addEventListener('click', event => {
      if (dropdown && !dropdown.contains(event.target)) dropdown.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && dropdown?.open) {
        dropdown.open = false;
        trigger?.focus();
      }
    });
    document.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.addEventListener('click', () => {
        mode = button.dataset.themeMode;
        try { window.localStorage.setItem(key, mode); } catch { /* Optional persistence. */ }
        apply();
        if (dropdown) {
          dropdown.open = false;
          trigger?.focus();
        }
      });
    });
    apply();
  });
})();
