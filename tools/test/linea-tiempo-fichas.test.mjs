// Tests for the fichas of sesión 0 (js/ui/linea-tiempo-fichas.js): one lámina-style 1280×720 page per
// milestone, registered as a page provider of the láminas viewer (js/ui/laminas-viewer.js).
// Run from the repository root:  node --test tools/test/linea-tiempo-fichas.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadData } from '../lib/load-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EIA = await loadData({
  root: ROOT,
  extra: ['js/engine/rng.js', 'js/engine/palette.js', 'js/engine/ink.js', 'js/engine/figures.js',
    'js/ui/linea-tiempo-arte.js', 'js/ui/linea-tiempo-fichas.js', 'js/ui/laminas-viewer.js']
});
const LT = EIA.data.lineaTiempo;
const F = EIA.ui.lineaTiempoFichas;
const plain = (v) => JSON.parse(JSON.stringify(v));
const digits = (s) => String(s || '').match(/\d+/g) || [];

/* A measuring stand-in for a 2D context: every glyph is 0.6 em wide (wider than the course fonts'
 * average), so a layout that fits here fits the real fonts too. */
function stubCtx() {
  return {
    font: '18px sans',
    measureText(s) {
      const m = /(\d+(?:\.\d+)?)px/.exec(this.font);
      return { width: String(s).length * (m ? Number(m[1]) : 18) * 0.6 };
    }
  };
}

test('one ficha per milestone, in milestone order, resolved by the viewer', () => {
  const ids = plain(F.ids());
  assert.equal(ids.length, 24);
  assert.deepEqual(ids, plain(LT.hitos.map((h) => 's0-' + h.id)));
  for (const id of ids) assert.equal(F.hitoOf(id).id, id.slice(3));
  assert.equal(F.hitoOf('d01'), null);
  const viewer = EIA.ui.laminasViewer;
  for (const id of ids) assert.ok(viewer.page(id), id + ' has a page provider');
  assert.equal(viewer.page('d01'), null, 'deck láminas keep the default path');
});

test('hosts() names the sites of a "Fuente de verificación" cell once each', () => {
  assert.deepEqual(plain(F.hosts('https://www.anthropic.com/news/a ; https://openai.com/x ; https://openai.com/y')), ['anthropic.com', 'openai.com']);
  assert.deepEqual(plain(F.hosts('https://doi.org/10.1093/mind/LIX.236.433')), ['doi.org']);
  assert.deepEqual(plain(F.hosts('')), []);
});

test('every word of a ficha comes from its own row, the era title or the UI copy', () => {
  const uiStrings = [];
  (function walk(o) { for (const v of Object.values(o)) { if (typeof v === 'string') uiStrings.push(v); else if (v && typeof v === 'object') walk(v); } })(LT.ui);
  LT.hitos.forEach((h, i) => {
    const era = LT.eras.find((e) => e.id === h.era);
    const row = [h.fecha, h.hito, h.actores, h.lugar, h.avance, h.importancia, h.fuente, h.nota];
    const rowDigits = digits(row.join(' '));
    const hosts = plain(F.hosts(h.fuente));
    const texts = plain(F.texts(h));
    assert.ok(texts.length >= 10, h.id);
    for (const piece of texts) {
      if (piece.chrome) {
        // Chrome: the kicker, the field labels and "Hito n de 24".
        const ok = uiStrings.includes(piece.text) || piece.text === F.position(i);
        assert.ok(ok, h.id + ': chrome «' + piece.text + '»');
        continue;
      }
      const ok = row.includes(piece.text) || piece.text === era.titulo || hosts.includes(piece.text);
      assert.ok(ok, h.id + ': «' + piece.text + '» is not a field of its row');
      if (piece.text !== era.titulo) for (const n of digits(piece.text)) assert.ok(rowDigits.includes(n), h.id + ': «' + n + '»');
    }
    for (const key of ['fecha', 'hito', 'actores', 'lugar', 'avance', 'importancia', 'nota']) {
      assert.ok(texts.some((p) => p.text === h[key]), h.id + ' shows ' + key);
    }
  });
});

test('every ficha fits its page: no zone overflows, nothing leaves 1280×720 or overlaps', () => {
  const ctx = stubCtx();
  const inside = (r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= 1280 + 0.5 && r.y + r.h <= 720 + 0.5;
  const apart = (a, b) => a.x + a.w <= b.x + 0.5 || b.x + b.w <= a.x + 0.5 || a.y + a.h <= b.y + 0.5 || b.y + b.h <= a.y + 0.5;
  for (const h of LT.hitos) {
    const z = F.layout(ctx, h);
    assert.equal(z.overflow, false, h.id + ' overflows: ' + plain(z.overflowing).join(', '));
    const zones = ['kicker', 'titular', 'badge', 'fecha', 'campos', 'arte', 'fuente', 'idea', 'pie'];
    for (const k of zones) assert.ok(z[k] && inside(z[k]), h.id + ' ' + k + ' inside the page');
    for (let a = 0; a < zones.length; a++) {
      for (let b = a + 1; b < zones.length; b++) {
        if (zones[a] === 'arte' && zones[b] === 'fuente') continue; // the source tag sits on the card's corner
        assert.ok(apart(z[zones[a]], z[zones[b]]), h.id + ': ' + zones[a] + ' overlaps ' + zones[b]);
      }
    }
    assert.ok(z.campos.size >= 14, h.id + ' field text stays readable');
  }
});

test('the ficha provider describes its page and labels the viewer chrome', () => {
  const p = EIA.ui.laminasViewer.page('s0-eliza');
  const h = LT.hitos.find((x) => x.id === 'eliza');
  const d = p.describe('s0-eliza');
  for (const s of [h.hito, h.fecha, h.actores, h.avance, h.importancia]) assert.ok(d.includes(s.replace(/[.\s]+$/, '')), s);
  assert.equal(p.title('s0-eliza'), h.fecha + ' · ' + h.hito);
  assert.equal(p.copy('anterior'), LT.ui.ficha.anterior);
  assert.ok(LT.ui.verFicha);
});
