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

test('every 100vh calc in the layout has a dvh fallback pair and the class video never collapses', () => {
  for (const file of ['css/layout.css', 'css/components.css']) {
    const lines = read(file).split('\n');
    lines.forEach((line, i) => {
      // real :fullscreen rules need no dvh: no browser toolbar is shown there
      if (!/calc\(\(?100vh/.test(line) || /:fullscreen/.test(line + lines[i - 1])) return;
      const next = line.replace(/100vh/g, '100dvh');
      const pair = lines.slice(i, i + 3).join('\n');
      assert.ok(pair.includes('100dvh'), file + ':' + (i + 1) + ' lacks a dvh pair: ' + next.trim());
    });
  }
  const css = read('css/components.css');
  assert.match(css, /\.clase-video\s*\{[^}]*max\(\s*280px,\s*calc\(\(100dvh - 420px\)/);
});
