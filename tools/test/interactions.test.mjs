// Tests for the pure logic of the interactive tools (prompt §10): the step calculator of sesión 2,
// the team notebook (personal-data check, export/import round trip) and the rubric score.
// Run from the repository root:  node --test tools/test/interactions.test.mjs
//
// The tools are classic scripts that must not touch the DOM at load time: they are evaluated in a
// Node vm sandbox (window === globalThis, no document) after js/core/namespace.js and the data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../lib/load-data.mjs';

const root = new URL('../../', import.meta.url).pathname;
const EIA = await loadData({ root, extra: ['js/core/markup.js', 'js/ui/quiz.js', 'js/ui/games.js'] });
// Values created inside the vm carry another realm's prototypes; compare them as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));

// -------------------------------------------------------------------------------------------------
// Sesión 2 · «Pasos que se acumulan» (prompt §10.4): P = p^n, illustrative.

test('the step calculator computes P = p^n from a percentage and a number of steps', () => {
  const pasos = EIA.ui.games.pasos;
  assert.ok(Math.abs(pasos.prob(95, 20) - 0.95 ** 20) < 1e-12);
  assert.ok(Math.abs(pasos.prob(99, 20) - 0.99 ** 20) < 1e-12);
  assert.equal(pasos.prob(80, 1), 0.8);
  assert.equal(pasos.prob(95, 0), 1);
  assert.deepEqual(plain(pasos.serie(95, 3)).map((v) => Math.round(v * 1e6) / 1e6), [0.95, 0.9025, 0.857375]);
  assert.equal(pasos.serie(90, 50).length, 50);
});

test('the step calculator writes the presets exactly as the KB-derived data does', () => {
  const pasos = EIA.ui.games.pasos;
  const a = EIA.data.actividades['s2-pasos'];
  assert.ok(a.presets.length >= 2);
  for (const preset of a.presets) {
    assert.equal(pasos.formato(pasos.prob(preset.p, preset.n)).texto, preset.resultado, preset.label);
  }
});

test('the step calculator never rounds a probability to a certainty or to zero', () => {
  const { formato } = EIA.ui.games.pasos;
  assert.equal(formato(0.999).texto, '0,999 · 99,9%');
  assert.equal(formato(0.5).texto, '0,50 · 50%');
  assert.equal(formato(0.8 ** 50).texto, '< 0,0001 · < 0,01%');
  assert.equal(formato(0.95).porcentaje, '95%');
  assert.equal(formato(0.95 ** 2).texto, '≈ 0,90 · 90%');
});

test('the step calculator clamps its inputs to the sliders of the data', () => {
  const pasos = EIA.ui.games.pasos;
  assert.equal(pasos.prob(150, 2), 1);
  assert.equal(pasos.prob(-5, 2), 0);
  assert.equal(pasos.prob(50, 2.6), 0.125);
});
