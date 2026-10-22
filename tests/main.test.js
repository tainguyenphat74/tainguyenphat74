import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

async function runPage(storage, calls) {
  const views = { hidden: true, textContent: '' };
  const number = { textContent: '' };
  const context = {
    document: { getElementById(id) { return id === 'views' ? views : id === 'view-count' ? number : null; } },
    window: { matchMedia() { return { matches: false }; }, localStorage: storage },
    localStorage: storage,
    sessionStorage: makeStorage(),
    fetch: async (url, options) => {
      calls.push({ url, method: options.method });
      return { ok: true, async json() { return { count: 10 }; } };
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(number.textContent, '10');
  assert.equal(views.hidden, false);
}

test('counts the first visit and reads on later visits using persistent localStorage', async () => {
  const storage = makeStorage();
  const calls = [];

  await runPage(storage, calls);
  await runPage(storage, calls);

  assert.deepEqual(calls.map(call => call.method), ['POST', 'GET']);
  assert.equal(storage.getItem('portfolio:view-counted'), '1');
});
