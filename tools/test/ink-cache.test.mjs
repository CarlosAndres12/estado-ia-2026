// Tests for the bounded ink canvas caches (odd/tasks/ios-safari-fixes.md, I04): iOS WebKit caps the
// total canvas memory of a page, so evicted canvases are shrunk to 0x0 once the frame is drawn.
// Run from the repository root:  node --test tools/test/ink-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadData } from '../lib/load-data.mjs';

const root = new URL('../../', import.meta.url).pathname;
const read = (file) => readFileSync(root + file, 'utf8');
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('the ink LRU releases evicted canvases after the current frame', async () => {
  const EIA = await loadData({ root, files: [], extra: ['js/engine/rng.js', 'js/engine/palette.js', 'js/engine/ink.js'] });
  const released = [];
  const lru = new EIA.engine.ink.LRU(2, null, (v) => released.push(v));
  const a = { width: 10, height: 10 }, b = { width: 10, height: 10 }, c = { width: 10, height: 10 };
  lru.set('a', a);
  lru.set('b', b);
  lru.set('c', c);
  assert.equal(a.width, 10, 'not released synchronously: the frame may still draw it');
  await flush();
  assert.deepEqual(released, [a]);
  assert.equal(lru.map.size, 2);
  const ink = read('js/engine/ink.js');
  assert.match(ink, /var counterCache = new LRU\(\s*COUNTER_LIMIT/);
  assert.match(ink, /var layerCache = new LRU\(.*, releaseCanvas\);/);
});
