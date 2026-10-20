// Static checks for the iOS Safari layout fixes (odd/tasks/ios-safari-fixes.md, I02-I03): the
// pseudo-fullscreen fallback of the player and the dvh fallbacks of the 100vh panels.
// Run from the repository root:  node --test tools/test/ios-layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url).pathname;
const read = (file) => readFileSync(root + file, 'utf8');

test('the player falls back to a pseudo-fullscreen class without the Fullscreen API', () => {
  const src = read('js/engine/player.js');
  assert.match(src, /is-pseudo-fullscreen/);
  assert.match(src, /eia-pseudo-fullscreen/);
  assert.match(src, /'Escape'/);
  const css = read('css/components.css');
  assert.match(css, /\.player__frame\.is-pseudo-fullscreen\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /html\.eia-pseudo-fullscreen/);
});
