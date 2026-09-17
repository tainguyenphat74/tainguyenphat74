// Page-view counter. Count once per browser/device (a refresh or a later
// session does not inflate it); later opens read the total. Fails silently if
// the endpoint or browser storage is unavailable.
(async function views() {
  const el = document.getElementById('views');
  if (!el) return;

  const VIEW_COUNT_KEY = 'portfolio:view-counted';
  let counted = false;
  try {
    counted = window.localStorage.getItem(VIEW_COUNT_KEY) === '1';
  } catch { /* storage may be blocked by privacy settings */ }

  try {
    const res = await fetch('/api/views', { method: counted ? 'GET' : 'POST' });
    if (!res.ok) return;
    const { count } = await res.json();
    if (typeof count !== 'number') return;

    try {
      window.localStorage.setItem(VIEW_COUNT_KEY, '1');
    } catch { /* storage may be blocked by privacy settings */ }
    el.textContent = `👀 ${count.toLocaleString('en-US')} views`;
    el.hidden = false;
  } catch { /* offline or endpoint down — leave the line hidden */ }
})();
