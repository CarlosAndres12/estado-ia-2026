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
const EIA = await loadData({ root, extra: ['js/core/markup.js', 'js/ui/quiz.js', 'js/ui/games.js', 'js/ui/worksheets.js', 'js/ui/rubrica.js'] });
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

// -------------------------------------------------------------------------------------------------
// «Cuaderno del equipo» (prompt §10.7): the gentle personal-data check never blocks; it only says
// when a text looks like it names or identifies someone. Export and import keep everything.

test('the personal-data check spots names, long numbers, emails and phone numbers', () => {
  const { detect } = EIA.ui.cuaderno;
  assert.deepEqual(plain(detect('La atendió Ana María Pérez en la ventanilla')), ['nombre']);
  assert.deepEqual(plain(detect('Luego Pedro Gómez revisó la salida')), ['nombre']);
  assert.deepEqual(plain(detect('Escribir a ana.perez@universidad.edu.co')), ['correo']);
  assert.deepEqual(plain(detect('Llamar al +57 300 123 4567')), ['telefono']);
  assert.deepEqual(plain(detect('Teléfono 300 123 4567')), ['telefono']);
  assert.deepEqual(plain(detect('Cédula 1.020.304.050')), ['numero']);
  assert.deepEqual(plain(detect('Radicado 20261017001')), ['numero']);
});

test('the personal-data check stays quiet on ordinary case descriptions', () => {
  const { detect } = EIA.ui.cuaderno;
  for (const text of [
    '',
    'La IA sugiere y la persona decide.',
    'El Ministerio de Educación revisa las solicitudes.',
    'Tiempo por tarea: 25 minutos; meta 15 minutos.',
    'Costo de licencias: $ 25.000.000 al año',
    'Plan 2026-2028 con tres hitos.',
    'Usamos la API de un proveedor y el EBIT no cambió.'
  ]) {
    assert.deepEqual(plain(detect(text)), [], text);
  }
});

test('a notebook survives export and import unchanged', () => {
  const C = EIA.ui.cuaderno;
  const nb = C.blank({ id: 'c-prueba', now: '2026-10-17T10:00:00.000Z' });
  nb.campos.equipo = 'Equipo Cóndor';
  nb.campos.caso = 'Clasificación de solicitudes «PQRS» en la alcaldía';
  nb.hojas['s1-ficha'] = { ficha: { tarea: 'La IA clasifica; una persona revisa.', usuarios: 'Ciudadanía y funcionarios' } };
  nb.hojas['s2-picos'] = {
    subtareas: [{ subtarea: 'Leer la solicitud', tipo: 'pico', pasos: '', costo: 'bajo', autonomia: 'la-ia-sugiere' }],
    criterios: { elegidos: ['costo', 'privacidad'], porque: { costo: 'Presupuesto fijo', privacidad: 'Datos sensibles' } }
  };
  nb.hojas['s3-linea-base'] = { costo: { licencias: { marcado: true, monto: 1200, unidad: 'USD/año' } } };
  nb.hojas['fuentes-ia'] = { cifras: ['adop-1', 'prod-5'], declaracion: 'Usamos IA para revisar la ortografía.' };
  nb.notas.push({ sesion: 1, pregunta: '¿Qué cifra sobre IA escuchó recientemente?', respuesta: 'La del 88%.' });
  nb.rubrica.niveles = { evidencia: 4, capacidad: 3 };
  nb.rubrica.retro = { evidencia: { evidencia: 'Cada cifra con fuente', accion: 'Precisar el tipo' } };
  const text = C.serialize(nb);
  assert.equal(typeof text, 'string');
  const back = C.parse(text);
  assert.equal(back.ok, true);
  assert.deepEqual(plain(back.cuaderno), plain(nb));
  assert.equal(C.serialize(back.cuaderno), text);
});

test('importing rejects files that are not a team notebook and fills in missing parts', () => {
  const C = EIA.ui.cuaderno;
  assert.equal(C.parse('no es json').ok, false);
  assert.equal(C.parse('{"formato":"otra-cosa","version":1}').ok, false);
  assert.equal(C.parse('[1, 2, 3]').ok, false);
  const r = C.parse('{"formato":"eia-cuaderno","version":1,"id":"c-x","campos":{"equipo":"Equipo Jaguar","extra":5},' +
    '"hojas":{"s1-ficha":{"ficha":{"tarea":"Revisar","rara":{"f":null}}}}}');
  assert.equal(r.ok, true);
  assert.equal(r.cuaderno.campos.equipo, 'Equipo Jaguar');
  assert.equal(r.cuaderno.campos.caso, '');
  assert.equal(r.cuaderno.campos.extra, undefined);
  assert.equal(r.cuaderno.hojas['s1-ficha'].ficha.tarea, 'Revisar');
  assert.deepEqual(plain(r.cuaderno.notas), []);
  assert.deepEqual(plain(r.cuaderno.rubrica), { niveles: {}, retro: {} });
});

test('the notebook copies as plain text with its sheet titles and labels', () => {
  const C = EIA.ui.cuaderno;
  const nb = C.blank({ id: 'c-texto', now: '2026-10-17T10:00:00.000Z' });
  nb.campos.equipo = 'Equipo Colibrí';
  nb.hojas['s1-ficha'] = { ficha: { tarea: 'La IA resume; la persona decide.' } };
  const text = C.toText(nb);
  assert.match(text, /Equipo Colibrí/);
  assert.match(text, /Ficha del caso de uso/);
  assert.match(text, /La tarea que hace la IA y la que sigue haciendo una persona\./);
  assert.match(text, /La IA resume; la persona decide\./);
});

// -------------------------------------------------------------------------------------------------
// Rubric (prompt §10.9, KB §11): Σ peso × fracción del nivel (4 = 100%, 3 = 75%, 2 = 50%, 1 = 25%).

test('the rubric score adds each weight times the fraction of the chosen level', () => {
  const R = EIA.ui.rubrica;
  const ids = EIA.data.rubrica.criterios.map((c) => c.id);
  const all = (n) => Object.fromEntries(ids.map((id) => [id, n]));
  assert.equal(R.score(all(4)), 100);
  assert.equal(R.score(all(3)), 75);
  assert.equal(R.score(all(2)), 50);
  assert.equal(R.score(all(1)), 25);
  assert.equal(R.score({}), 0);
  // evidencia 20×1 + capacidad 15×0,75 + valor 20×0,5 + personas 15×0,25 + gobernanza 20×1 + defensa 10×0,75
  assert.equal(R.score({ evidencia: 4, capacidad: 3, valor: 2, personas: 1, gobernanza: 4, defensa: 3 }), 72.5);
});

test('the rubric ignores levels and criteria it does not know', () => {
  const R = EIA.ui.rubrica;
  assert.equal(R.score({ evidencia: 5, capacidad: 0, valor: 'x', otra: 4, gobernanza: 2 }), 10);
});

test('the rubric writes its score in Spanish format, out of 100', () => {
  const R = EIA.ui.rubrica;
  assert.equal(R.formato(72.5), '72,5');
  assert.equal(R.formato(86.25), '86,25');
  assert.equal(R.formato(100), '100');
  assert.equal(R.texto({ evidencia: 4, capacidad: 3, valor: 2, personas: 1, gobernanza: 4, defensa: 3 }), 'Puntaje de la rúbrica: 72,5/100');
});
