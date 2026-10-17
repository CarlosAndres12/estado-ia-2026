// Unit tests for tools/lib/kb-parse.mjs. Run: node --test tools/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as P from '../lib/kb-parse.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const kb = P.parseKB(P.readKB(path.join(ROOT, P.KB_FILE)));

const values = (text) => P.tokenizeNumbers(text).map((t) => t.value);
const kinds = (text) => P.tokenizeNumbers(text).map((t) => t.kind);

test('tokenizes KB number formats as whole tokens', () => {
  assert.deepEqual(values('Encuesta a 1.993 participantes de 105 países'), ['1.993', '105']);
  assert.deepEqual(values('de cerca de 12% a 66,3%'), ['12%', '66,3%']);
  assert.deepEqual(values('344.700 millones de dólares (+127,5%)'), ['344.700', '127,5%']);
  assert.deepEqual(values('aumento de 26,08% en las tareas'), ['26,08%']);
  assert.deepEqual(values('referencia humana de 72,35%'), ['72,35%']);
});

test('keeps the sign out of the comparison value', () => {
  const [a, b, c] = P.tokenizeNumbers('−18% de tiempo (IC 95%: −38% a +9%)').slice(0, 1).concat(P.tokenizeNumbers('IC 95%: −38% a +9%').slice(1));
  assert.equal(a.value, '18%');
  assert.equal(a.sign, '−');
  assert.equal(b.value, '38%');
  assert.equal(b.sign, '−');
  assert.equal(c.value, '9%');
  assert.equal(c.sign, '+');
  assert.deepEqual(values('~1/3 sí; ≈1 de cada 3; <20%; >90%'), ['1/3', '1', '3', '20%', '90%']);
});

test('ranges, year ranges, ordinals, fractions and multipliers', () => {
  const [r] = P.tokenizeNumbers('Soporte al cliente +14–15%');
  assert.equal(r.kind, 'range');
  assert.equal(r.value, '14–15%');
  assert.deepEqual(r.parts, ['14', '15%']);
  const [yr] = P.tokenizeNumbers('Agenda 2026–2028');
  assert.equal(yr.kind, 'year-range');
  assert.equal(yr.value, '2026–2028');
  assert.deepEqual(values('Colombia: 4.º de 19'), ['4.º', '19']);
  assert.deepEqual(kinds('Colombia: 4.º de 19'), ['ordinal', 'number']);
  assert.deepEqual(values('9,6%–22,6% del cómputo'), ['9,6%–22,6%']);
  assert.deepEqual(values('«23×» (EE. UU. frente a China) y 23,1×'), ['23', '23,1']);
  assert.deepEqual(values('Reglamento (UE) 2026/1744'), ['2026/1744']);
  assert.deepEqual(values('2/3 de las instituciones'), ['2/3']);
});

test('thousands groups are not versions, and versions are not thousands', () => {
  assert.deepEqual(values('Terminal-Bench 2.0 y Gemini 2.5 Pro; Time Horizon 1.1'), ['2.0', '2.5', '1.1']);
  assert.deepEqual(values('cerca de 1.400 en total; 1.016 autorizaciones; ~80.150'), ['1.400', '1.016', '80.150']);
});

test('years are plain tokens of kind year; dates are single tokens', () => {
  const t = P.tokenizeNumbers('Entró en vigor el 1 de agosto de 2024; en 2025 y desde el 2 de diciembre de 2026');
  assert.deepEqual(t.map((x) => [x.kind, x.value]), [
    ['date', '1 de agosto de 2024'],
    ['year', '2025'],
    ['date', '2 de diciembre de 2026']
  ]);
  assert.ok(P.isPlainYear('2010') && P.isPlainYear('2030') && !P.isPlainYear('2031') && !P.isPlainYear('4144'));
  assert.deepEqual(values('CONPES 4144'), ['4144']);
  assert.deepEqual(kinds('CONPES 4144'), ['number']);
});

test('ignores digits glued to words and citation labels', () => {
  assert.deepEqual(values('UNU C3, lámina D7, Sesión 2 ([Stanford, cap. 2][hai2])'), ['2']);
  assert.deepEqual(values('{{adop-1|88%}} de las organizaciones'), ['88%']);
});

test('numberValues adds range endpoints and day-month of dates', () => {
  const v = P.numberValues('Desarrolladores de 22 a 25 años; 12–18 meses; el 2 de agosto de 2026; 5,8–8,8%');
  for (const x of ['22', '25', '12–18', '12', '18', '2 de agosto de 2026', '2 de agosto', '5,8–8,8%', '5,8', '5,8%', '8,8%']) assert.ok(v.has(x), x);
});

test('splits sentences without breaking "EE. UU." or decimals', () => {
  assert.deepEqual(P.splitSentences('4 de cada 5 estudiantes de EE. UU. usan IA. Otra frase; y otra · la última'), [
    '4 de cada 5 estudiantes de EE. UU. usan IA',
    'Otra frase',
    'y otra',
    'la última'
  ]);
  assert.deepEqual(P.splitSentences('1.993 participantes\n66,3% de éxito'), ['1.993 participantes', '66,3% de éxito']);
});

test('citations: parse, render and strip', () => {
  const t = 'El 88% la usa ([McKinsey, 2025][mck25]; [PDF][mck25pdf]) y cita [Campus Technology][ct].';
  assert.deepEqual(P.citationKeys(t), ['mck25', 'mck25pdf', 'ct']);
  assert.equal(P.stripCitations(t), 'El 88% la usa y cita Campus Technology.');
  assert.equal(P.plainText('**Tesis.** El *ensayo* ([METR, 2025][metr-rct]).'), 'Tesis. El ensayo.');
});

test('KB §13 has 61 rows with the prompt §5.4 ids', () => {
  const rows = kb.banco.flatMap((g) => g.rows);
  assert.equal(rows.length, 61);
  assert.equal(rows[0].id, 'adop-1');
  assert.match(rows[0].cifra, /^88% usa IA regularmente/);
  assert.equal(rows.find((r) => r.id === 'cap-1').cifra.slice(0, 7), 'OSWorld');
  assert.match(rows.find((r) => r.id === 'eco-7').cifra, /^Clústeres de supercomputación/);
  assert.match(rows.find((r) => r.id === 'alc-4').cifra, /^CONPES 4144/);
  assert.deepEqual(rows.find((r) => r.id === 'cap-8').fuentes, ['metr-th', 'metr-th11']);
});

test('resolves "Ídem" to the nearest earlier row from the same source, and "Ídem DEC" to the DEC row', () => {
  const rows = Object.fromEntries(kb.banco.flatMap((g) => g.rows).map((r) => [r.id, r]));
  const mck = 'Encuesta a 1.993 participantes de 105 países, del 25 de junio al 29 de julio de 2025';
  for (const id of ['adop-2', 'adop-3', 'adop-4', 'adop-5', 'adop-6']) {
    assert.equal(rows[id].alcance, 'Ídem');
    assert.equal(rows[id].alcanceCompleto, mck);
  }
  assert.equal(rows['cap-10'].alcanceCompleto, 'Conteo del AI Index');
  assert.equal(rows['trab-3'].alcanceCompleto, 'Índice de exposición'); // chain: trab-3 -> trab-2 -> trab-1
  assert.equal(rows['edu-3'].alcance, 'Ídem DEC');
  assert.equal(rows['edu-3'].alcanceCompleto, '3.839 estudiantes de 16 países'); // skips edu-2 (Campus Technology)
  assert.equal(rows['adop-7'].alcanceCompleto, undefined);
});

test('resolveIdem on a synthetic table', () => {
  const g = [{ rows: [
    { alcance: 'A', citas: [{ key: 'x', label: 'X' }], fuentes: ['x'] },
    { alcance: 'B', citas: [{ key: 'y', label: 'DEC, 2024' }], fuentes: ['y'] },
    { alcance: 'Ídem', citas: [{ key: 'x', label: 'X' }], fuentes: ['x'] },
    { alcance: 'Ídem DEC', citas: [{ key: 'z', label: 'Z' }], fuentes: ['z'] }
  ] }];
  P.resolveIdem(g);
  assert.equal(g[0].rows[2].alcanceCompleto, 'A');
  assert.equal(g[0].rows[3].alcanceCompleto, 'B');
});

test('nested lists, tables and label blocks', () => {
  const items = P.parseList(['- a', '  - a1', '  - a2', '- b', '', '  para of b', '1. one', '   - one.a']);
  assert.equal(items.length, 3);
  assert.deepEqual(items[0].children.map((c) => c.text), ['a1', 'a2']);
  assert.deepEqual(items[1].paras, ['para of b']);
  assert.equal(items[2].ordered, true);
  assert.equal(items[2].children[0].text, 'one.a');
  const t = P.parseTable(['| A | B |', '|---|---|', '| [x][k] | **y** |']);
  assert.deepEqual(t, { header: ['A', 'B'], rows: [['[x][k]', '**y**']] });
  const blocks = P.splitLabelBlocks(['**Tesis.** Texto.', '**Contenido**', '1. **Uno.** cuerpo']);
  assert.deepEqual(blocks.map((b) => [b.label, b.sep, b.rest]), [['Tesis', '.', 'Texto.'], ['Contenido', '', '']]);
});

test('session parsing keeps points, sub-blocks, quizzes and slide scripts', () => {
  const s4 = kb.sesiones[4];
  assert.deepEqual(s4.bloques, ['Trabajo', 'Educación superior']);
  assert.equal(s4.contenido.length, 11);
  assert.equal(s4.contenido[5].bloque, 'Educación superior');
  const c5 = kb.sesiones[5].contenido.find((c) => c.n === 5);
  assert.equal(c5.titulo, 'El semáforo clínico');
  assert.equal(c5.complemento, '([Stanford, cap. 6][hai6])');
  assert.match(c5.cuerpo, /\n {2}- De más de 500 estudios/);
  const q = kb.sesiones[2].quiz[1];
  assert.deepEqual(q.opciones, ['cerca de la mitad', 'más de 90%', '23%']);
  assert.equal(q.respuesta, 1);
  assert.equal(q.explicacion, '(91,2%).');
  assert.equal(kb.sesiones[7].quiz.length, 0);
  assert.equal(kb.sesiones[7].discusion.label, 'Discusión de cierre');
  const d15 = kb.sesiones[7].guion.find((d) => d.id === 'd15');
  assert.equal(d15.bullets[0].label, 'Cifras');
  assert.equal(d15.bullets[0].items.length, 3);
  assert.equal(kb.sesiones.length, undefined);
  assert.equal(Object.keys(kb.sesiones).length, 7);
});

test('link definitions and references', () => {
  assert.equal(Object.keys(kb.linkDefs).length, 63);
  assert.equal(kb.linkDefs.mck25, 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025');
  assert.equal(kb.s16.grupos[0].grupo, 'Informe base');
  const keys = new Set(P.referenceItems(kb).flatMap((r) => r.citas.map((c) => c.key)));
  for (const key of Object.keys(kb.linkDefs)) assert.ok(keys.has(key), 'listed in §16: ' + key);
});
