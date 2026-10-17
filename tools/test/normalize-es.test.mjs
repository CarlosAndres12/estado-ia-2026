// Tests for tools/lib/normalize-es.mjs: every example of prompt §8.4, then real course lines.
// Run: node --test tools/test/normalize-es.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalize, analyze, numberToWords, LEXICON } from '../lib/normalize-es.mjs';

function check(cases) {
  for (const [input, expected] of cases) {
    assert.equal(normalize(input), expected, `normalize(${JSON.stringify(input)})`);
  }
}

test('§8.4 numbers in KB format: "." separates thousands, "," marks decimals', () => {
  check([
    ['1.993', 'mil novecientos noventa y tres'],
    ['344.700 millones', 'trescientos cuarenta y cuatro mil setecientos millones'],
    ['66,3%', 'sesenta y seis coma tres por ciento'],
    ['72,35%', 'setenta y dos coma treinta y cinco por ciento'],
    ['26,08%', 'veintiséis coma cero ocho por ciento'],
  ]);
});

test('§8.4 version numbers: a point is a thousands separator only before exactly three digits', () => {
  check([
    ['Terminal-Bench 2.0', 'términal bench dos punto cero'],
    ['Gemini 2.5 Pro', 'yémini dos punto cinco Pro'],
    ['Time Horizon 1.1', 'Time Horizon uno punto uno'],
  ]);
});

test('§8.4 signs and ranges', () => {
  check([
    ['50%', 'cincuenta por ciento'],
    ['~12%', 'cerca de doce por ciento'],
    ['≈ 1/3', 'aproximadamente un tercio'],
    ['≈33%', 'aproximadamente treinta y tres por ciento'],
    ['23×', 'veintitrés veces'],
    ['+127,5%', 'más ciento veintisiete coma cinco por ciento'],
    ['−4%', 'menos cuatro por ciento'],
    ['-4%', 'menos cuatro por ciento'],
    ['12–18 meses', 'de doce a dieciocho meses'],
    ['2026–2028', 'dos mil veintiséis a dos mil veintiocho'],
  ]);
});

test('§8.4 years and dates', () => {
  check([
    ['2025', 'dos mil veinticinco'],
    ['CONPES 4144', 'cónpes cuatro mil ciento cuarenta y cuatro'],
    ['2 de agosto de 2026', 'dos de agosto de dos mil veintiséis'],
    ['1 de agosto', 'primero de agosto'],
  ]);
});

test('§8.4 ordinals', () => {
  check([
    ['4.º', 'cuarto'],
    ['5.º', 'quinto'],
  ]);
});

test('§8.4 fractions: only 1/3, 2/3 and 1/2', () => {
  check([
    ['1/3', 'un tercio'],
    ['2/3', 'dos tercios'],
    ['1/2', 'un medio'],
  ]);
  const other = analyze('2026/1744');
  assert.doesNotMatch(other.text, /tercio|medio|avos?\b/);
  assert.ok(other.warnings.some((w) => w.code === 'needs-say' && w.match === '2026/1744'),
    'a non-listed a/b must ask for a `say`');
});

test('§8.4 abbreviations', () => {
  check([
    ['EE. UU.', 'Estados Unidos'],
    ['UE', 'Unión Europea'],
    ['I+D', 'investigación y desarrollo'],
    ['GW', 'gigavatios'],
    ['29,6 GW', 'veintinueve coma seis gigavatios'],
    ['IA', 'i a'],
  ]);
});

test('§8.4 lexicon: every proposed entry', () => {
  const expected = {
    EBIT: 'ébit', API: 'a pe i', OIT: 'o i te', FDA: 'efe de a', CONPES: 'cónpes', ILIA: 'ilia',
    CEPAL: 'cepal', CENIA: 'cenia', METR: 'méter', McKinsey: 'mackínsi', PwC: 'pe doble ve ce',
    'AI Index': 'ei ai índex', OSWorld: 'ou es uórld', 'Terminal-Bench': 'términal bench',
    GPQA: 'ge pe cu a', MMMU: 'eme eme eme u', 'SWE-bench': 'suí bench', PaperArena: 'péiper arena',
    ChemBench: 'kem bench', 'AI Incident Database': 'ei ai íncident déitabeis',
    'Digital Education Council': 'díyital ediukéishon cáunsil', xAI: 'equis a i', OpenAI: 'open ei ai',
    DeepSeek: 'dipsík', Anthropic: 'anzrópic', MiniMax: 'mini max', 'Z.ai': 'zeta a i', Gemini: 'yémini',
    'Sharp HealthCare': 'sharp jélzker', 'reward hacking': 'riuórd jáking', deepfakes: 'dipféiks',
    sandbox: 'sándbox', benchmark: 'bénchmark',
  };
  for (const [display, spoken] of Object.entries(expected)) {
    assert.equal(normalize(display), spoken, display);
    assert.equal(LEXICON[display], spoken, `LEXICON[${display}]`);
  }
  // Plurals and sentence-initial capitals of common words.
  check([
    ['los llamados benchmarks', 'los llamados bénchmarks'],
    ['Benchmark no es desempeño real.', 'bénchmark no es desempeño real.'],
  ]);
});

test('lexicon entries can be overridden from voice.config.json', () => {
  assert.equal(normalize('PwC', { lexicon: { PwC: 'pi dábliu si' } }), 'pi dábliu si');
  assert.equal(normalize('Gemini', { lexicon: { Gemini: null } }), 'Gemini');
});

test('§8.4 quotes are dropped and "…" stays as a pause', () => {
  check([
    ['«¿usó IA?»', '¿usó i a?'],
    ['“hola”, dijo', 'hola, dijo'],
    ['"hola"', 'hola'],
    ['Y entonces… nada.', 'Y entonces… nada.'],
    ['Y entonces... nada.', 'Y entonces… nada.'],
  ]);
});

test('real course lines', () => {
  check([
    ['Según la encuesta de McKinsey de 2025, el 88% de las organizaciones usa IA de forma regular en al menos una función.',
      'Según la encuesta de mackínsi de dos mil veinticinco, el ochenta y ocho por ciento de las organizaciones usa i a de forma regular en al menos una función.'],
    ['En Terminal-Bench 2.0, el éxito pasó de 20% en febrero de 2025 a 77,3% a inicios de 2026.',
      'En términal bench dos punto cero, el éxito pasó de veinte por ciento en febrero de dos mil veinticinco a setenta y siete coma tres por ciento a inicios de dos mil veintiséis.'],
    ['9,6% en OpenAI en 2024, 22,6% en MiniMax y 12,3% en Z.ai.',
      'nueve coma seis por ciento en open ei ai en dos mil veinticuatro, veintidós coma seis por ciento en mini max y doce coma tres por ciento en zeta a i.'],
    ['Colombia obtuvo 55,84 puntos en el ILIA 2025 y subió del quinto al cuarto lugar entre 19 países, con 3,2 puntos más.',
      'Colombia obtuvo cincuenta y cinco coma ochenta y cuatro puntos en el ilia dos mil veinticinco y subió del quinto al cuarto lugar entre diecinueve países, con tres coma dos puntos más.'],
    ['Brasil, 67,39, y Uruguay, 62,32.', 'Brasil, sesenta y siete coma treinta y nueve, y Uruguay, sesenta y dos coma treinta y dos.'],
    ['La pregunta cambia: ya no es «¿usó IA?», sino «¿qué aprendió?».', 'La pregunta cambia: ya no es ¿usó i a?, sino ¿qué aprendió?'],
    ['diseñar flujos humano–IA', 'diseñar flujos humano i a'],
    ['las del anexo III, al 2 de diciembre de 2027', 'las del anexo tres, al dos de diciembre de dos mil veintisiete'],
    ['en 2025. Si la demanda crece', 'en dos mil veinticinco. Si la demanda crece'],
    ['El valor en EE. UU. Luego, en la UE.', 'El valor en Estados Unidos. Luego, en la Unión Europea.'],
    ['Estados Unidos invirtió 23 veces más capital privado', 'Estados Unidos invirtió veintitrés veces más capital privado'],
  ]);
});

test('decimals keep zeros and integers keep "uno" before "coma"', () => {
  check([
    ['apenas 0,4', 'apenas cero coma cuatro'],
    ['27,0% en las', 'veintisiete coma cero por ciento en las'],
    ['76,01 en gobernanza', 'setenta y seis coma cero uno en gobernanza'],
    ['21,5%', 'veintiuno coma cinco por ciento'],
    ['11,8–14,6', 'de once coma ocho a catorce coma seis'],
    ['−0,5 puntos', 'menos cero coma cinco puntos'],
  ]);
});

test('gender agreement and apocope with the following noun', () => {
  check([
    ['21 médicos', 'veintiún médicos'],
    ['21 personas', 'veintiuna personas'],
    ['246 tareas', 'doscientas cuarenta y seis tareas'],
    ['500 estudios revisados', 'quinientos estudios revisados'],
    ['200 millones', 'doscientos millones'],
    ['21 millones', 'veintiún millones'],
    ['1 millón', 'un millón'],
    ['200.000 personas', 'doscientas mil personas'],
    ['2.500.000 personas', 'dos millones quinientas mil personas'],
    ['21 veces', 'veintiuna veces'],
    ['1 GW', 'un gigavatio'],
    ['1%', 'uno por ciento'],
    ['100%', 'cien por ciento'],
    ['100 expertos', 'cien expertos'],
    ['101 países', 'ciento un países'],
    ['47 de 102', 'cuarenta y siete de ciento dos'],
    ['21 de 30', 'veintiuno de treinta'],
    ['31 días', 'treinta y un días'],
  ]);
});

test('larger numbers, thousands and counts', () => {
  check([
    ['1.400 en total', 'mil cuatrocientos en total'],
    ['479.273 millones', 'cuatrocientos setenta y nueve mil doscientos setenta y tres millones'],
    ['80.150 en 2025, 63.547 en 2024', 'ochenta mil ciento cincuenta en dos mil veinticinco, sesenta y tres mil quinientos cuarenta y siete en dos mil veinticuatro'],
    ['1.000.000', 'un millón'],
    ['14 a 15%', 'catorce a quince por ciento'],
  ]);
});

test('more ranges, dates, ordinals and signs', () => {
  check([
    ['entre 12–18 meses', 'entre doce y dieciocho meses'],
    ['de 12–18 meses', 'de doce a dieciocho meses'],
    ['del 5–10%', 'del cinco al diez por ciento'],
    ['entre 2026–2028', 'entre dos mil veintiséis y dos mil veintiocho'],
    ['3 de febrero de 2026', 'tres de febrero de dos mil veintiséis'],
    ['1.º de agosto', 'primero de agosto'],
    ['la 4.ª edición', 'la cuarta edición'],
    ['3 × 4', 'tres por cuatro'],
    ['<5%', 'menos de cinco por ciento'],
    ['+19% de tiempo', 'más diecinueve por ciento de tiempo'],
  ]);
});

test('names glued to digits are left alone, hyphens between letters and digits become spaces', () => {
  check([
    ['COVID-19', 'COVID diecinueve'],
    ['el G20 y el 5G', 'el G20 y el 5G'],
    ['etc.', 'etcétera'],
  ]);
});

test('whitespace and stray punctuation are tidied', () => {
  check([
    ['  dos  espacios  ', 'dos espacios'],
    ['¿Qué mide?.', '¿Qué mide?'],
  ]);
});

test('analyze() reports the terms a listener should audit', () => {
  const out = analyze('La UNESCO y McKinsey: 66,3% en EE. UU.');
  assert.equal(out.text, 'La UNESCO y mackínsi: sesenta y seis coma tres por ciento en Estados Unidos');
  const kinds = new Set(out.terms.map((t) => t.kind));
  for (const kind of ['acronym', 'lexicon', 'number', 'abbreviation']) assert.ok(kinds.has(kind), kind);
  assert.ok(out.terms.some((t) => t.kind === 'acronym' && t.display === 'UNESCO'));
  assert.ok(out.terms.some((t) => t.kind === 'number' && t.display === '66,3%' && t.spoken === 'sesenta y seis coma tres por ciento'));
});

test('a stray "(pausa N s)" marker is removed and reported', () => {
  const out = analyze('¿Con qué controles? (pausa 3 s)');
  assert.equal(out.text, '¿Con qué controles?');
  assert.ok(out.warnings.some((w) => w.code === 'pause-marker'));
});

test('numberToWords() covers the Spanish cardinal system', () => {
  const cases = [
    [0, 'cero'], [1, 'uno'], [15, 'quince'], [16, 'dieciséis'], [21, 'veintiuno'], [22, 'veintidós'],
    [30, 'treinta'], [31, 'treinta y uno'], [99, 'noventa y nueve'], [100, 'cien'], [101, 'ciento uno'],
    [115, 'ciento quince'], [200, 'doscientos'], [500, 'quinientos'], [700, 'setecientos'], [900, 'novecientos'],
    [1000, 'mil'], [1001, 'mil uno'], [2000, 'dos mil'], [21000, 'veintiún mil'], [100000, 'cien mil'],
    [1000000, 'un millón'], [2000000, 'dos millones'], [21000000, 'veintiún millones'],
    [1000000000, 'mil millones'], [2500000000, 'dos mil quinientos millones'],
  ];
  for (const [n, words] of cases) assert.equal(numberToWords(n), words, String(n));
  assert.equal(numberToWords(21, { gender: 'f' }), 'veintiuna');
  assert.equal(numberToWords(200, { gender: 'f' }), 'doscientas');
  assert.equal(numberToWords(1, { apocope: true }), 'un');
  assert.equal(numberToWords(21, { apocope: true }), 'veintiún');
  assert.equal(numberToWords(1, { gender: 'f' }), 'una');
});
