import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../theme.js', import.meta.url), 'utf8');
function setup(saved, blocked = false) {
  const events = {}, windowEvents = {}, mediaEvents = {};
  const root = { dataset: {} }, meta = {};
  const buttons = ['dark', 'light', 'system'].map(mode => ({ dataset: { themeMode: mode }, setAttribute(k, v) { this[k] = v; }, addEventListener(k, cb) { this[k] = cb; } }));
  const media = { matches: false, addEventListener(k, cb) { mediaEvents[k] = cb; } };
  let stored = saved;
  vm.runInNewContext(source, {
    document: { documentElement: root, querySelector: selector => selector === '.theme-dropdown' ? null : meta, querySelectorAll: () => buttons, addEventListener(k, cb) { events[k] = cb; } },
    window: { matchMedia: () => media, localStorage: { getItem() { if (blocked) throw Error(); return stored; }, setItem(k, v) { if (blocked) throw Error(); stored = v; } }, addEventListener(k, cb) { windowEvents[k] = cb; } },
  });
  events.DOMContentLoaded();
  return { root, meta, buttons, media, mediaEvents, windowEvents, stored: () => stored };
}
test('defaults to system and follows device changes', () => {
  const s = setup();
  assert.equal(s.root.dataset.theme, 'light');
  assert.equal(s.buttons[2]['aria-pressed'], 'true');
  s.media.matches = true; s.mediaEvents.change();
  assert.equal(s.root.dataset.theme, 'dark');
  assert.equal(s.meta.content, '#191919');
});
test('explicit mode persists and ignores device changes', () => {
  const s = setup('dark');
  assert.equal(s.root.dataset.theme, 'dark');
  s.buttons[1].click();
  assert.equal(s.stored(), 'light');
  s.media.matches = true; s.mediaEvents.change();
  assert.equal(s.root.dataset.theme, 'light');
});
test('invalid preferences and blocked storage remain usable', () => {
  for (const s of [setup('invalid'), setup(null, true)]) {
    assert.equal(s.root.dataset.theme, 'light');
    s.buttons[0].click();
    assert.equal(s.root.dataset.theme, 'dark');
  }
});
test('storage changes sync mode and clearing resets to system', () => {
  const s = setup();
  s.windowEvents.storage({ key: 'portfolio:theme', newValue: 'dark' });
  assert.equal(s.root.dataset.theme, 'dark');
  s.windowEvents.storage({ key: null, newValue: null });
  assert.equal(s.root.dataset.theme, 'light');
});
