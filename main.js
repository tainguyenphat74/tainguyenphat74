// Count once per browser/device; later visits read the total.
// Leave the counter hidden if the endpoint or browser storage is unavailable.
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
    if (!Number.isSafeInteger(count) || count < 0) return;

    try {
      window.localStorage.setItem(VIEW_COUNT_KEY, '1');
    } catch { /* storage may be blocked by privacy settings */ }
    const number = document.getElementById('view-count');
    if (!number) return;
    number.textContent = count.toLocaleString('en-US');
    el.hidden = false;
  } catch { /* offline or endpoint down — leave the line hidden */ }
})();
