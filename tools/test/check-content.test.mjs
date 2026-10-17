// Tests for tools/check-content.mjs. Run: node --test tools/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, BANNED } from '../check-content.mjs';

const banned = (sentence) => BANNED.map((b) => [b.name, b.test(sentence)]).filter(([, level]) => level);

test('the real data passes with zero errors', async () => {
  const { report } = await run();
  assert.deepEqual(report.errors.map((e) => e.where + ': ' + e.msg), []);
});

test('banned AI Act claim: flagged as a claim, allowed when called an error or negated', () => {
  assert.equal(banned('La Ley de IA se aplica completa desde agosto de 2026.').length, 1);
  assert.deepEqual(banned('Entonces, decir que la ley se aplica completa desde agosto de 2026 es un error.'), []);
  assert.deepEqual(banned('La ley no se aplica completa desde agosto de 2026.'), []);
  assert.deepEqual(banned('2 de agosto de 2026: se aplica la mayoría de las reglas'), []);
});

test('other banned versions', () => {
  assert.equal(banned('UNESCO: 34% con experiencias positivas').length, 1);
  assert.equal(banned('Marketing hasta +50%').length, 1);
  assert.equal(banned('Colombia es pionera en IA').length, 1);
  assert.deepEqual(banned('Colombia es «adoptante», no «pionero»'), []);
  assert.equal(banned('4 de cada 5 estudiantes usan IA').length, 1);
  assert.deepEqual(banned('En Estados Unidos, cuatro de cada cinco estudiantes usan IA'), []);
  assert.equal(banned('El 2,4% de los 258 dispositivos').length, 1);
  assert.equal(banned('479.000 millones y más de 100 acciones').length, 1);
  assert.equal(banned('Ingreso por empleado: 27% vs 9%').length, 1);
  assert.deepEqual(banned('Ingreso por empleado: 27,0% vs 8,5%'), []);
});

test('videos fixture: numbers, banned versions and series are checked over the prompt §5.5 shape', async () => {
  const { report } = await run({ extra: ['tools/test/fixtures/videos.fixture.js'] });
  // The fixture holds only v99, so the sessions' v01–v09 references are expected errors here.
  const errs = report.errors.map((e) => e.where + ': ' + e.msg).filter((e) => !/^sesiones\.\d\.videos: unknown video v0\d/.test(e));
  const warns = report.warnings.map((e) => e.where + ': ' + e.msg);
  // Unbacked number in a line.
  assert.ok(errs.some((e) => e.startsWith('videos.v99.scenes.unbacked.lines[0]') && e.includes('«77%»')), errs.join('\n'));
  // Banned claim without negation; the lectora line that calls it an error passes.
  assert.ok(errs.some((e) => e.includes('scenes[1].lines[1]') && e.includes('AI Act')), errs.join('\n'));
  assert.ok(!errs.some((e) => e.includes('scenes[0].lines[3]')), errs.join('\n'));
  // Illustrative and backed lines pass; a rótulo without ids falls back to its scene with a warning.
  assert.ok(!errs.some((e) => e.includes('scenes.backed.lines')), errs.join('\n'));
  assert.ok(warns.some((w) => w.startsWith('videos.v99.scenes.backed.rotulos.sinIds')), warns.join('\n'));
  // adop-1 and adop-7 in one scene: flagged for review.
  assert.ok(warns.some((w) => w.startsWith('videos.v99.scenes.serie') && w.includes('adop-7')), warns.join('\n'));
  // Numbers report backs each number with its figure.
  assert.ok(report.numbers.some((n) => n.where === 'videos.v99.scenes.backed.lines[0]' && n.by === 'adop-1'));
  assert.equal(errs.length, 2, errs.join('\n'));
});
