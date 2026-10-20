#!/usr/bin/env node
/* tools/check-content.mjs — traceability checker (prompt §5.8). MUST pass with zero errors.
 *
 *   node tools/check-content.mjs            errors + warnings, exit 1 on any error
 *   node tools/check-content.mjs --verbose  also every number with the figure that backs it (step 7)
 *   node tools/check-content.mjs --root <dir> --extra <file.js>   (extra scripts, e.g. test fixtures)
 *
 * Steps
 *   1 Load      js/data/*.js via lib/load-data.mjs; the KB via lib/kb-parse.mjs
 *   2 KB match  §13 rows, link URLs, glossary, FAQ, corrections, quizzes, session texts, slide scripts,
 *               activities, assistant instructions and course texts match the KB (normalized
 *               whitespace, site-only {{id|texto}} stripped); only ALLOWED_CORRECTIONS may differ
 *   3 Refs      every figure id, source key, lámina, video and activity id resolves; every ctx-*
 *               figure quotes a KB sentence; videos follow the prompt §5.5 shape
 *   4 Numbers   every number in voice lines, rótulos, checkpoints, lámina text and drawn activity data
 *               appears in a referenced figure (or is illustrative, a plain year or structural)
 *   5 Banned    the KB §14 versions are errors outside the places that warn against them
 *   6 Series    adop-1…6 next to adop-7 is flagged for review (separate panels)
 *   7 Timeline  js/data/linea-tiempo.js (sesión 0) matches its CSV row by row and field by field; ids are
 *               unique deep-link ids; every number in a narration appears in that row's own text
 *   8 Report    errors, warnings, allowed corrections and (--verbose) every number with its figure
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as P from './lib/kb-parse.mjs';
import { loadData } from './lib/load-data.mjs';
import { parseCsv } from './lib/csv.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(HERE, '..');

// -------------------------------------------------------------------------------------------------
// The only allowed differences from the KB: the corrected versions the prompt asks for.

export const ALLOWED_CORRECTIONS = [
  {
    name: 'S1 game card PwC, corrected per KB §14 (prompt §10.3)',
    where: 'actividades.s1-que-mide.cards[pwc].cifra',
    kb: 'Ingreso por empleado: 27% vs 9%',
    site: 'Ingreso por empleado: 27,0% vs 8,5%'
  },
  {
    name: 'D8 PwC figure, corrected per KB §14 (prompt §12.1)',
    where: 'deck.d08.cifras[0].valor',
    kb: '27% vs 9%',
    site: '27,0% vs 8,5%'
  },
  {
    name: 'D15 CONPES 4144 amount, corrected per KB §14 (prompt §12.1)',
    where: 'deck.d15.cifras[2].valor',
    kb: '479.000',
    site: '479.273'
  },
  {
    name: 'D15 CONPES 4144 actions, corrected per KB §14 (prompt §12.1)',
    where: 'deck.d15.cifras[2].etiqueta',
    kb: 'millones de pesos y más de 100 acciones hasta 2030 en el CONPES 4144',
    site: 'millones de pesos y 106 acciones hasta 2030 en el CONPES 4144'
  },
  {
    name: 'D7 caution line from its speaker note (prompt §12.1)',
    where: 'deck.d07.rotulos.cautela.text',
    kb: null,
    site: 'Cada barra sale de una pregunta distinta de la misma encuesta.'
  }
];

// Context figures the video scripts use (contracts §2).
export const REQUIRED_CTX = ['modelos-convergen', 'ley-vigor', 'ley-prohibiciones', 'ilia-indicadores', 'colombia-quinto', 'medicos-experiencia'];

// Structural numbers (prompt §5.8 step 4): whitelisted by the phrase they sit in.
export const STRUCTURAL_NUMBERS = [
  { name: 'source chapter (cap. N)', re: /\bcap\.\s*\d{1,2}\b/giu },
  { name: 'session number', re: /\bsesi(?:ón|ones)\s+\d(?:\s*(?:,|y)\s*\d)*/giu },
  { name: 'slide number', re: /\b(?:diapositivas?|láminas?)\s+\d{1,2}(?:\s*(?:–|,|y)\s*\d{1,2})*/giu },
  { name: 'course warning number', re: /\badvertencia\s+[1-4]\b/giu },
  { name: 'course hours (24/14/10)', re: /\b(?:24|14|10)\s+(?:horas|en sesión|de trabajo autónomo)\b/giu },
  { name: 'course length (7 sesiones de 2 horas)', re: /\b7\s+sesiones\b|\bsesiones\s+de\s+2\s+horas\b|\btaller\s+de\s+4\s+horas\b/giu },
  { name: 'agenda minutes', re: /\b\d{1,3}\s*(?:–\s*\d{1,3}\s*)?(?:min|minutos)\b/giu },
  { name: 'contenido point', re: /\bcontenido\s+\d{1,2}\b/giu },
  { name: 'evidence ladder rung', re: /\bescal[oó]n(?:es)?\s+\d\b|\bal\s+[1-6]\b(?=\s*\()/giu },
  { name: 'D2 route station', re: /^\s*[1-5]\s+(?=\p{Lu})/gu },
  { name: 'indicator levels (nine)', re: /\b9\s+niveles\b/giu },
  { name: 'cycle steps (six)', re: /\b6\s+pasos\b/giu }
];

// Course dates that are metadata, not figures: KB version/verification date and report cut-off.
export const COURSE_DATES = ['17 de octubre de 2026', '14 de octubre de 2026'];

// Banned versions (KB §14, prompt §5.8 step 5). `test(sentence)` -> 'error' | 'warning' | null.
const NEG = /\b(?:no|nunca|ni|jamás)\b/iu;
export const BANNED = [
  {
    name: 'UNESCO "34%"',
    test: (s) => (/(?<![\d,.])34\s?%/u.test(s) && /UNESCO/iu.test(s) ? 'error' : null)
  },
  { name: 'marketing "hasta 50%"', test: (s) => (/\bhasta\s+\+?50\s?%/iu.test(s) ? 'error' : null) },
  {
    name: '"3 clústeres" for Latin America',
    test: (s) => {
      if (!/(?<![\d,.])3\s+clústeres\b/iu.test(s)) return null;
      return /(América Latina|Latinoamérica|\bALC\b|Caribe|la región)/iu.test(s) ? 'error' : 'warning';
    }
  },
  {
    name: '"pionero/pionera" applied to Colombia',
    test: (s) => (/\bpioner[oa]s?\b/iu.test(s) && /Colombia/u.test(s) && !NEG.test(s) ? 'error' : null)
  },
  {
    name: '"4 de cada 5" without Estados Unidos',
    test: (s) => (/\b(?:4 de cada 5|cuatro de cada cinco)\b/iu.test(s) && !/(Estados Unidos|EE\. UU\.)/u.test(s) ? 'error' : null)
  },
  { name: '"2,4%" next to "258"', test: (s) => (/2,4\s?%/u.test(s) && /(?<![\d.,])258(?![\d.,]\d)/u.test(s) ? 'error' : null) },
  { name: 'CONPES 4144 rounded ("más de 100 acciones" / "479.000")', test: (s) => (/más de 100 acciones|(?<![\d.])479\.000(?![\d.])/iu.test(s) ? 'error' : null) },
  { name: 'PwC "27% vs 9%"', test: (s) => (/(?<![\d,.])27\s?%\s*(?:vs\.?|frente a)\s*9\s?%/iu.test(s) ? 'error' : null) },
  {
    name: 'AI Act "applies in full from August 2026"',
    test: (s) => {
      const claim = /(?:se aplica|aplica|rige|entra en vigor|vigente|aplicará)[^.;]{0,40}\b(?:complet[ao]|en su totalidad|plenamente|íntegr[ao]|totalmente|por completo)\b/iu.test(s);
      if (!claim || !/(agosto(?: de)? 2026|ago\.? 2026)/iu.test(s)) return null;
      return /\b(?:no|error|falso|equivocad\w*|incorrect\w*|aplaz\w*)\b/iu.test(s) ? null : 'error';
    }
  }
];

// Places where the KB names a banned version only to warn against it (prompt §5.8 step 5).
export const BANNED_EXEMPT = [
  { name: 'cifras.js', re: /^cifras\b/ },
  { name: 'correcciones.js', re: /^correcciones\b/ },
  { name: 'KB §0 text in asistente.js', re: /^asistente\.kb0\b/ },
  { name: '"Errores de lectura frecuentes" lists', re: /^sesiones\.\d\.errores\b/ },
  { name: 'lámina notes', re: /^deck(?:\.d\d\d|\[\d+\])\.notas\b|^sesiones\.\d\.facilitador\.laminas\b/ },
  { name: 'lámina KB script (verbatim reference shown with the notes)', re: /^deck(?:\.d\d\d|\[\d+\])\.kb\b/ }
];

// -------------------------------------------------------------------------------------------------
// Report

export function createReport() {
  const r = { errors: [], warnings: [], infos: [], numbers: [], corrections: [], steps: {} };
  let step = '1';
  r.step = (s) => {
    step = s;
    r.steps[s] = r.steps[s] || { errors: 0, warnings: 0 };
  };
  r.error = (where, msg) => {
    r.errors.push({ step, where, msg });
    r.steps[step].errors++;
  };
  r.warn = (where, msg) => {
    r.warnings.push({ step, where, msg });
    r.steps[step].warnings++;
  };
  r.info = (where, msg) => r.infos.push({ step, where, msg });
  r.step('1');
  return r;
}

// -------------------------------------------------------------------------------------------------
// Helpers

const cmp = (s) => P.comparable(s);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Walks every string of a value: cb(path, string). */
export function walkStrings(value, base, cb) {
  if (typeof value === 'string') cb(base, value);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, base + '[' + i + ']', cb));
  else if (isObj(value)) for (const k of Object.keys(value)) walkStrings(value[k], base ? base + '.' + k : k, cb);
}

/** Walks every object of a value: cb(path, object). */
export function walkObjects(value, base, cb) {
  if (Array.isArray(value)) value.forEach((v, i) => walkObjects(v, base + '[' + i + ']', cb));
  else if (isObj(value)) {
    cb(base, value);
    for (const k of Object.keys(value)) walkObjects(value[k], base ? base + '.' + k : k, cb);
  }
}

function sameText(a, b) {
  return cmp(a) === cmp(b);
}

function expectEq(report, where, field, site, kbValue) {
  if (!sameText(site == null ? '' : site, kbValue == null ? '' : kbValue)) {
    report.error(where, field + ' differs from the KB\n      site: ' + JSON.stringify(site) + '\n      KB:   ' + JSON.stringify(kbValue));
    return false;
  }
  return true;
}

function expectList(report, where, field, site, kbList) {
  if (!Array.isArray(site)) {
    report.error(where, field + ' must be an array (KB has ' + kbList.length + ' items)');
    return;
  }
  if (site.length !== kbList.length) report.error(where, field + ': ' + site.length + ' items, KB has ' + kbList.length);
  kbList.forEach((k, i) => {
    if (i < site.length) expectEq(report, where, field + '[' + i + ']', site[i], k);
  });
}

function allowedCorrection(where, site, kbValue) {
  return ALLOWED_CORRECTIONS.find((c) => c.where === where && sameText(site, c.site) && (c.kb === null || kbValue === undefined || sameText(kbValue, c.kb)));
}

function cifraIndex(EIA) {
  const out = {};
  for (const c of EIA.data.cifras || []) out[c.id] = c;
  return out;
}

// -------------------------------------------------------------------------------------------------
// Step 2 · KB match

const TEMA_IDS = {
  'Adopción y valor': 'adopcion',
  'Capacidad técnica': 'capacidad',
  'Economía e infraestructura': 'economia',
  'Productividad': 'productividad',
  'Trabajo': 'trabajo',
  'Educación': 'educacion',
  'Ciencia': 'ciencia',
  'Medicina': 'medicina',
  'Riesgo y regulación': 'riesgo',
  'América Latina y Colombia': 'america-latina'
};

const CLASE_OK = ['capacidad', 'uso', 'resultado', 'expectativa', 'proyeccion', 'neutral', 'ninguno'];

function claseDeTipo(EIA, tipo) {
  return EIA.util && EIA.util.claseDeTipo ? EIA.util.claseDeTipo(tipo) : null;
}

export function checkCifras(EIA, kb, report) {
  const cifras = EIA.data.cifras || [];
  const kbRows = kb.banco.flatMap((g) => g.rows.map((r) => ({ ...r, heading: g.heading })));
  const byId = cifraIndex(EIA);
  const banco = cifras.filter((c) => !String(c.id).startsWith('ctx-'));
  if (banco.length !== kbRows.length) report.error('cifras', banco.length + ' §13 rows in cifras.js, KB §13 has ' + kbRows.length);
  kbRows.forEach((row, i) => {
    const c = byId[row.id];
    const where = 'cifras ' + row.id;
    if (!c) {
      report.error(where, 'missing (KB §13 «' + row.heading + '» row ' + row.id.split('-')[1] + ': ' + row.cifra + ')');
      return;
    }
    if (banco[i] && banco[i].id !== row.id) report.error(where, 'out of KB order: position ' + i + ' holds ' + banco[i].id);
    expectEq(report, where, 'cifra', c.cifra, row.cifra);
    expectEq(report, where, 'alcance', c.alcance, row.alcance);
    expectEq(report, where, 'tipo', c.tipo, row.tipo);
    expectEq(report, where, 'estado', c.estado, row.estado);
    if (row.alcanceCompleto) expectEq(report, where, 'alcanceCompleto (resolved "Ídem")', c.alcanceCompleto, row.alcanceCompleto);
    else if (c.alcanceCompleto && !sameText(c.alcanceCompleto, row.alcance)) report.error(where, 'alcanceCompleto set but the KB alcance is not "Ídem"');
    if (JSON.stringify(c.fuentes) !== JSON.stringify(row.fuentes)) report.error(where, 'fuentes ' + JSON.stringify(c.fuentes) + ' differ from the KB links ' + JSON.stringify(row.fuentes));
    if (c.tema !== TEMA_IDS[row.heading]) report.error(where, 'tema "' + c.tema + '" should be "' + TEMA_IDS[row.heading] + '" (KB §13 «' + row.heading + '»)');
    const clase = claseDeTipo(EIA, row.tipo);
    if (clase && c.clase !== clase) report.error(where, 'clase "' + c.clase + '" should be "' + clase + '" for tipo «' + row.tipo + '»');
    if (c.enBanco !== true) report.error(where, 'enBanco must be true for KB §13 rows');
    checkSesionesField(report, where, c.sesiones, { allowEmpty: true });
  });
  banco.forEach((c) => {
    if (!kbRows.some((r) => r.id === c.id)) report.error('cifras ' + c.id, 'not a KB §13 row id (context figures use the ctx- prefix)');
  });
  const seen = new Set();
  cifras.forEach((c) => {
    if (seen.has(c.id)) report.error('cifras ' + c.id, 'duplicate id');
    seen.add(c.id);
    if (!CLASE_OK.includes(c.clase)) report.error('cifras ' + c.id, 'unknown clase "' + c.clase + '"');
  });
  // Context figures.
  const ctx = cifras.filter((c) => String(c.id).startsWith('ctx-'));
  const firstCtx = cifras.findIndex((c) => String(c.id).startsWith('ctx-'));
  if (firstCtx >= 0 && cifras.slice(firstCtx).some((c) => !String(c.id).startsWith('ctx-'))) report.error('cifras', 'context figures must come after every KB §13 row');
  for (const slug of REQUIRED_CTX) if (!byId['ctx-' + slug]) report.error('cifras ctx-' + slug, 'required context figure is missing (contracts §2)');
  for (const c of ctx) {
    const where = 'cifras ' + c.id;
    if (!/^ctx-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id)) report.error(where, 'context ids are ctx-<slug>');
    if (c.enBanco !== false) report.error(where, 'context figures have enBanco: false');
    if (c.estado !== '') report.error(where, 'context figures carry no KB estado (estado: "")');
    if (!Array.isArray(c.fuentes) || !c.fuentes.length) report.error(where, 'fuentes: the source the KB cites at that spot');
    if (!c.tipo) report.error(where, 'tipo is required ("—" when the KB gives none)');
    if (c.tipo === '—' && c.clase !== 'ninguno') report.error(where, 'tipo "—" needs clase "ninguno"');
    if (!c.alcance) report.error(where, 'alcance is empty: EIA.util.citation would print "()"');
    if (/[.;]$/.test(String(c.cifra).trim())) report.error(where, 'cifra ends with "' + String(c.cifra).trim().slice(-1) + '": citation text appends " (alcance)."');
    checkSesionesField(report, where, c.sesiones);
  }
  // Temas list.
  const temas = EIA.data.temas || [];
  const kbTemas = kb.banco.map((g) => g.heading);
  if (temas.length !== kbTemas.length) report.error('temas', temas.length + ' temas, KB §13 has ' + kbTemas.length + ' headings');
  kbTemas.forEach((h, i) => {
    const t = temas[i];
    if (!t) return;
    expectEq(report, 'temas[' + i + ']', 'titulo', t.titulo, h);
    if (t.id !== TEMA_IDS[h]) report.error('temas[' + i + ']', 'id "' + t.id + '" should be "' + TEMA_IDS[h] + '"');
    if (t.prefijo !== P.DEFAULT_PREFIXES[h]) report.error('temas[' + i + ']', 'prefijo "' + t.prefijo + '" should be "' + P.DEFAULT_PREFIXES[h] + '"');
  });
}

function checkSesionesField(report, where, sesiones, { allowEmpty = false } = {}) {
  if (!Array.isArray(sesiones)) report.error(where, 'sesiones must be an array of the sessions whose KB text uses the figure');
  else if (!sesiones.length) {
    if (allowEmpty) report.info(where, 'no session text uses this figure (sesiones: [])');
    else report.error(where, 'sesiones must list the sessions whose KB text uses the figure');
  }
  else if (sesiones.some((n) => !Number.isInteger(n) || n < 1 || n > 7)) report.error(where, 'sesiones holds a value outside 1–7');
  else if (sesiones.some((n, i) => i && n <= sesiones[i - 1])) report.error(where, 'sesiones must be ascending and unique');
}

/** Short labels the KB uses for a link key (citations anywhere in the KB). */
function kbLabelsByKey(kb) {
  const out = {};
  for (const c of P.parseCitations(kb.text)) (out[c.key] = out[c.key] || new Set()).add(c.label);
  return out;
}

export function checkFuentes(EIA, kb, report) {
  const fuentes = EIA.data.fuentes || {};
  const keys = Object.keys(kb.linkDefs);
  const refs = P.referenceItems(kb);
  keys.forEach((key, i) => {
    const f = fuentes[key];
    const where = 'fuentes ' + key;
    if (!f) {
      report.error(where, 'missing (KB link [' + key + ']: ' + kb.linkDefs[key] + ')');
      return;
    }
    if (f.url !== kb.linkDefs[key]) report.error(where, 'url differs from the KB\n      site: ' + f.url + '\n      KB:   ' + kb.linkDefs[key]);
    if (!f.etiqueta) report.error(where, 'etiqueta is empty');
    const ref = refs.find((r) => r.citas.some((c) => c.key === key));
    if (!ref) report.error(where, 'not listed in KB §16');
    else {
      expectEq(report, where, 'grupo', f.grupo, ref.grupo);
      expectEq(report, where, 'titulo', f.titulo, ref.citas.find((c) => c.key === key).label);
    }
    if (Object.keys(fuentes)[i] !== key) report.warn(where, 'not in KB link-definition order');
  });
  for (const key of Object.keys(fuentes)) if (!kb.linkDefs[key]) report.error('fuentes ' + key, 'not a KB link key');
  // Short labels: any label the KB uses, or the specific "<Report> <edition>, cap. N" form.
  const labels = kbLabelsByKey(kb);
  for (const key of keys) {
    const f = fuentes[key];
    if (f && labels[key] && !labels[key].has(f.etiqueta)) report.info('fuentes ' + key, 'etiqueta «' + f.etiqueta + '» is a specific form; KB labels: ' + [...labels[key]].map((l) => '«' + l + '»').join(', '));
  }
  // §16 as structured references.
  const refsData = EIA.data.referencias || [];
  const grupos = kb.s16.grupos;
  if (refsData.length !== grupos.length) report.error('referencias', refsData.length + ' groups, KB §16 has ' + grupos.length);
  grupos.forEach((g, i) => {
    const d = refsData[i];
    if (!d) return;
    expectEq(report, 'referencias[' + i + ']', 'grupo', d.grupo, g.grupo);
    expectList(report, 'referencias[' + i + ']', 'items', d.items, g.items);
  });
}

export function checkGlosario(EIA, kb, report) {
  const g = EIA.data.glosario || [];
  const rows = kb.s12.table.rows;
  if (g.length !== rows.length) report.error('glosario', g.length + ' terms, KB §12 has ' + rows.length);
  rows.forEach(([termino, definicion], i) => {
    const d = g[i];
    const where = 'glosario[' + i + '] ' + termino;
    if (!d) return report.error(where, 'missing');
    expectEq(report, where, 'termino', d.termino, termino);
    expectEq(report, where, 'definicion', d.definicion, definicion);
    if (d.id !== P.slug(termino)) report.error(where, 'id "' + d.id + '" should be "' + P.slug(termino) + '"');
    if (!Array.isArray(d.variantes) || !d.variantes.length) report.error(where, 'variantes must list the lowercase forms that detect the term');
    else if (d.variantes.some((v) => v !== v.toLowerCase())) report.error(where, 'variantes must be lowercase');
  });
}

export function checkFaq(EIA, kb, report) {
  const f = EIA.data.faq || [];
  const items = kb.s15.items;
  if (f.length !== items.length) report.error('faq', f.length + ' questions, KB §15 has ' + items.length);
  items.forEach((q, i) => {
    const d = f[i];
    const where = 'faq[' + i + ']';
    if (!d) return report.error(where, 'missing: ' + q.pregunta);
    if (d.n !== q.n) report.error(where, 'n ' + d.n + ' should be ' + q.n);
    expectEq(report, where, 'pregunta', d.pregunta, q.pregunta);
    expectEq(report, where, 'respuesta', d.respuesta, q.respuesta);
  });
}

export function checkCorrecciones(EIA, kb, report) {
  const c = EIA.data.correcciones || {};
  const filas = c.filas || [];
  const rows = kb.s14.correcciones.rows;
  expectEq(report, 'correcciones', 'titulo', c.titulo, kb.s14.correccionesTitulo);
  expectList(report, 'correcciones', 'columnas', c.columnas, kb.s14.correcciones.header);
  if (filas.length !== rows.length) report.error('correcciones', filas.length + ' rows, KB §14 has ' + rows.length);
  rows.forEach(([antes, ahora, fuente], i) => {
    const d = filas[i];
    const where = 'correcciones.filas[' + i + ']';
    if (!d) return report.error(where, 'missing: ' + antes);
    expectEq(report, where, 'antes', d.antes, antes);
    expectEq(report, where, 'ahora', d.ahora, ahora);
    expectEq(report, where, 'fuente', d.fuente, fuente);
    if (JSON.stringify(d.fuentes) !== JSON.stringify(P.citationKeys(fuente))) report.error(where, 'fuentes must be the link keys of the KB "Fuente" cell');
    if (!d.id) report.error(where, 'id is required ("Ver corrección" links)');
    if (!Array.isArray(d.cifras) || !d.cifras.length) report.error(where, 'cifras: the figure ids this correction touches');
  });
  const act = c.actualizaciones || [];
  expectEq(report, 'correcciones', 'actualizacionesTitulo', c.actualizacionesTitulo, kb.s14.actualizacionesTitulo);
  if (act.length !== kb.s14.actualizaciones.length) report.error('correcciones.actualizaciones', act.length + ' items, KB §14 has ' + kb.s14.actualizaciones.length);
  kb.s14.actualizaciones.forEach((u, i) => {
    const d = act[i];
    const where = 'correcciones.actualizaciones[' + i + ']';
    if (!d) return report.error(where, 'missing: ' + u.titulo);
    expectEq(report, where, 'titulo', d.titulo, u.titulo);
    expectEq(report, where, 'texto', d.texto, u.texto);
    if (JSON.stringify(d.fuentes) !== JSON.stringify(P.citationKeys(u.texto))) report.error(where, 'fuentes must be the link keys of the KB text');
  });
}

// Session data that does not come from a KB §4–§10 field (prompt §11 table, contracts).
export const SESSION_MAP = {
  1: { laminas: ['d01', 'd02'], videos: ['v01', 'v02'], signo: 'iceberg' },
  2: { laminas: ['d03', 'd04', 'd05'], videos: ['v03'], signo: 'cordillera' },
  3: { laminas: ['d06', 'd07', 'd08'], videos: ['v04'], signo: 'puente' },
  4: { laminas: ['d09', 'd10'], videos: ['v05', 'v06'], signo: 'escalera' },
  5: { laminas: ['d11', 'd12'], videos: ['v07'], signo: 'microscopio' },
  6: { laminas: ['d13', 'd14'], videos: ['v08'], signo: 'volante' },
  7: { laminas: ['d15', 'd16', 'd17'], videos: ['v09'], signo: 'faro' }
};

export function checkSesiones(EIA, kb, report) {
  const mapa = kb.s2.table.rows;
  for (let n = 1; n <= 7; n++) {
    const s = (EIA.data.sesiones || {})[n];
    const k = kb.sesiones[n];
    const where = 'sesiones.' + n;
    if (!s) {
      report.error(where, 'missing (KB §' + k.kbSection + ' Sesión ' + n + ')');
      continue;
    }
    if (s.n !== n) report.error(where, 'n should be ' + n);
    expectEq(report, where, 'titulo', s.titulo, k.titulo);
    expectEq(report, where, 'tesis', s.tesis, k.tesis);
    expectEq(report, where, 'diapositivas', s.diapositivas, k.diapositivas);
    expectEq(report, where, 'productoSesion', s.productoSesion, k.producto);
    const row = mapa[n - 1];
    expectEq(report, where, 'tema (KB §2)', s.tema, row[1]);
    expectEq(report, where, 'diapositivasMapa (KB §2)', s.diapositivasMapa, row[2]);
    expectEq(report, where, 'pregunta (KB §2)', s.pregunta, row[3]);
    expectEq(report, where, 'producto (KB §2)', s.producto, row[4]);
    expectList(report, where, 'resultados', s.resultados, k.resultados);
    expectEq(report, where, 'agendaTitulo', s.agendaTitulo, k.agendaTitulo);
    if (!Array.isArray(s.agenda) || s.agenda.length !== k.agenda.length) report.error(where, 'agenda: ' + (s.agenda || []).length + ' blocks, KB has ' + k.agenda.length);
    k.agenda.forEach((a, i) => {
      const d = (s.agenda || [])[i];
      if (!d) return;
      for (const f of ['minutos', 'bloque', 'recurso']) expectEq(report, where + '.agenda[' + i + ']', f, d[f], a[f]);
      if (d.desde !== a.desde || d.hasta !== a.hasta) report.error(where + '.agenda[' + i + ']', 'desde/hasta should be ' + a.desde + '/' + a.hasta);
    });
    expectList(report, where, 'bloques', s.bloques || [], k.bloques);
    if (!Array.isArray(s.contenido) || s.contenido.length !== k.contenido.length) report.error(where, 'contenido: ' + (s.contenido || []).length + ' points, KB has ' + k.contenido.length);
    k.contenido.forEach((p, i) => {
      const d = (s.contenido || [])[i];
      if (!d) return;
      const w = where + '.contenido[' + i + ']';
      if (d.n !== p.n) report.error(w, 'n should be ' + p.n);
      expectEq(report, w, 'titulo', d.titulo, p.titulo);
      expectEq(report, w, 'complemento', d.complemento || '', p.complemento);
      expectEq(report, w, 'cuerpo', d.cuerpo, p.cuerpo);
      if ((d.bloque || '') !== (p.bloque || '')) report.error(w, 'bloque "' + (d.bloque || '') + '" should be "' + (p.bloque || '') + '"');
    });
    if (n === 7) {
      if ('errores' in s) report.error(where, 'sesión 7 has no "Errores de lectura frecuentes" (prompt §9.5): leave the key out');
      if ('quiz' in s) report.error(where, 'sesión 7 has no quiz (prompt §9.5): leave the key out');
    } else {
      expectList(report, where, 'errores', s.errores, k.errores);
      checkQuiz(report, where, s.quiz, k.quiz);
    }
    expectEq(report, where, 'discusionTitulo', s.discusionTitulo, k.discusion.label);
    expectList(report, where, 'discusion', s.discusion, k.discusion.items);
    expectList(report, where, 'lecturas', s.lecturas, k.lecturas);
    const guionIds = k.guion.map((d) => d.id);
    if (JSON.stringify(s.laminas) !== JSON.stringify(guionIds)) report.error(where, 'laminas ' + JSON.stringify(s.laminas) + ' should be ' + JSON.stringify(guionIds) + ' (KB "Guion de diapositivas")');
    const map = SESSION_MAP[n];
    if (JSON.stringify(s.videos) !== JSON.stringify(map.videos)) report.error(where, 'videos should be ' + JSON.stringify(map.videos) + ' (prompt §11)');
    if (s.signo !== map.signo) report.error(where, 'signo should be "' + map.signo + '" (prompt §4.4)');
    // Facilitator notes repeat the lámina notes of deck.js, verbatim.
    const fl = (s.facilitador || {}).laminas || {};
    for (const d of k.guion) {
      const f = fl[d.id];
      const decir = (d.bullets.find((b) => b.label === 'Qué decir') || {}).text || '';
      const nota = (d.bullets.find((b) => b.label === 'Nota') || {}).text || '';
      if (!f) report.error(where + '.facilitador.laminas', d.id + ' is missing');
      else {
        expectEq(report, where + '.facilitador.laminas.' + d.id, 'decir', f.decir, decir);
        expectEq(report, where + '.facilitador.laminas.' + d.id, 'nota', f.nota, nota);
      }
    }
    // "Actualización" markers point at a paragraph that cites that source.
    for (const a of s.actualizaciones || []) {
      const p = (s.contenido || []).find((c) => c.n === a.contenido);
      if (!p || !String(p.cuerpo).includes('][' + a.fuente + ']')) report.error(where + '.actualizaciones', 'contenido ' + a.contenido + ' has no paragraph citing [' + a.fuente + ']');
    }
  }
}

function checkQuiz(report, where, quiz, kbQuiz) {
  if (!Array.isArray(quiz) || quiz.length !== kbQuiz.length) {
    report.error(where, 'quiz: ' + (quiz || []).length + ' questions, KB has ' + kbQuiz.length);
    return;
  }
  kbQuiz.forEach((q, i) => {
    const d = quiz[i];
    const w = where + '.quiz[' + i + ']';
    expectEq(report, w, 'pregunta', d.pregunta, q.pregunta);
    expectList(report, w, 'opciones', d.opciones, q.opciones);
    if (d.respuesta !== q.respuesta) report.error(w, 'respuesta ' + d.respuesta + ' should be ' + q.respuesta + ' (KB "Respuesta: ' + q.letra + '")');
    expectEq(report, w, 'explicacion', d.explicacion, q.explicacion);
    if (!d.pista || typeof d.pista !== 'string') report.error(w, 'pista: one written hint per question (prompt §10.8)');
    else {
      const ans = P.fold(q.opciones[q.respuesta]);
      if (ans.length > 3 && P.fold(d.pista).includes(ans)) report.error(w, 'pista names the answer («' + q.opciones[q.respuesta] + '»)');
      if (/^pista:/i.test(d.pista)) report.error(w, 'pista is stored without the "Pista:" prefix (the UI adds "Casi. Pista: …")');
    }
  });
}

// KB text of each lámina field, for "drawn text is verbatim from the Guion de diapositivas".
function slideSources(kbSlide) {
  const raw = kbSlide.bullets.flatMap((b) => [P.joinSlideBullet(b), ...b.items]);
  const variants = raw.flatMap((t) => [P.plainText(t), P.plainText(t, { keepCitationLabels: true })]);
  return variants.map((t) => t.replace(/[«»]/g, ''));
}

function containedIn(text, sources) {
  const t = P.plainText(text).replace(/[«»]/g, '');
  if (!t) return true;
  const f = P.fold(t);
  return sources.some((s) => s.includes(t) || P.fold(s).includes(f));
}

export function checkDeck(EIA, kb, report) {
  const deck = EIA.data.deck || [];
  const kbSlides = Object.values(kb.sesiones).flatMap((s) => s.guion.map((d) => ({ ...d, sesion: s.n, contenido: s.contenido })));
  if (deck.length !== 17) report.error('deck', deck.length + ' láminas, the KB "Guion de diapositivas" has ' + kbSlides.length);
  kbSlides.forEach((k, i) => {
    const d = deck[i];
    const where = 'deck.' + k.id;
    if (!d) return report.error(where, 'missing (KB D' + k.n + ' · ' + k.titulo + ')');
    if (d.id !== k.id || d.n !== k.n || d.sesion !== k.sesion) report.error(where, 'id/n/sesion should be ' + k.id + '/' + k.n + '/' + k.sesion);
    expectEq(report, where, 'titulo', d.titulo, k.titulo);
    const titular = k.bullets.find((b) => b.label === 'Titular');
    const kbTitular = titular ? P.unquote(titular.text.split(/\.\s+Subtítulo:/)[0]) : k.titulo;
    expectEq(report, where, 'titular', d.titular, kbTitular);
    const sub = titular && /Subtítulo:\s*(.*)$/.exec(titular.text);
    expectEq(report, where, 'subtitulo', d.subtitulo, sub ? P.unquote(sub[1]) : '');
    // Verbatim KB script.
    if (!Array.isArray(d.kb) || d.kb.length !== k.bullets.length) report.error(where, 'kb: ' + (d.kb || []).length + ' bullets, KB has ' + k.bullets.length);
    k.bullets.forEach((b, j) => {
      const x = (d.kb || [])[j];
      if (!x) return;
      expectEq(report, where + '.kb[' + j + ']', 'label', x.label, b.label);
      expectEq(report, where + '.kb[' + j + ']', 'text', x.text, b.text);
      expectList(report, where + '.kb[' + j + ']', 'items', x.items || [], b.items);
    });
    // Notes are the KB fields, verbatim.
    const field = (label) => (k.bullets.find((b) => b.label === label) || {}).text || '';
    const notas = d.notas || {};
    expectEq(report, where, 'notas.decir', notas.decir, field('Qué decir'));
    expectEq(report, where, 'notas.nota', notas.nota, field('Nota'));
    expectEq(report, where, 'notas.metafora', notas.metafora, field('Metáfora'));
    // Drawn text: verbatim from the slide script (or its "Contenido" points), except named corrections.
    const sources = slideSources(k);
    const pointSources = (d.contenido || [])
      .map((n) => (k.contenido.find((c) => c.n === n) || {}).cuerpo || '')
      .flatMap((c) => c.split('\n').map((l) => P.plainText(l.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))));
    const drawn = [];
    const push = (p, text) => text && drawn.push([p, text]);
    if (d.titular !== k.titulo) push('titular', d.titular); // D3–D17: the KB heading, compared above
    push('subtitulo', d.subtitulo);
    (d.cifras || []).forEach((c, j) => {
      push('cifras[' + j + '].valor', c.valor);
      push('cifras[' + j + '].etiqueta', c.etiqueta);
    });
    if (d.diagrama) {
      push('diagrama.titulo', d.diagrama.titulo);
      (d.diagrama.items || []).forEach((it, j) => {
        push('diagrama.items[' + j + '].text', it.text);
        push('diagrama.items[' + j + '].carril', it.carril);
      });
      if (d.diagrama.enlace) push('diagrama.enlace', d.diagrama.enlace);
      (d.diagrama.hitos || []).forEach((h, j) => push('diagrama.hitos[' + j + ']', h));
    }
    if (d.ideaCentral) push('ideaCentral.text', d.ideaCentral.text);
    if (d.pie) push('pie.text', d.pie.text);
    for (const [p, text] of drawn) {
      const full = where + '.' + p;
      if (containedIn(text, sources) || containedIn(text, pointSources)) continue;
      const corr = allowedCorrection(full, text);
      if (corr) report.corrections.push({ where: full, name: corr.name, site: text, kb: corr.kb });
      else report.error(full, 'drawn text is not verbatim from the KB slide script: ' + JSON.stringify(text));
    }
    for (const [key, r] of Object.entries(d.rotulos || {})) {
      const full = where + '.rotulos.' + key + '.text';
      if (!r || typeof r.text !== 'string') {
        report.error(where + '.rotulos.' + key, 'rótulo needs { text }');
        continue;
      }
      if (containedIn(r.text, sources) || containedIn(r.text, pointSources) || containedIn(r.text, [P.kbPlain(kb)])) continue;
      const corr = allowedCorrection(full, r.text);
      if (corr) report.corrections.push({ where: full, name: corr.name, site: r.text, kb: corr.kb });
      else report.warn(full, 'rótulo not found in the KB (prompt §12.2 copy?): ' + JSON.stringify(r.text));
    }
    if ((d.cifras || []).length > 3) report.error(where, 'cifras: at most 3 big figures (prompt §12.1)');
    const tipos = ['flujo', 'embudo', 'causal', 'columnas', 'pasos', 'ciclo', 'semaforo', 'linea', 'tarjetas', 'barras'];
    if (d.diagrama && !tipos.includes(d.diagrama.tipo)) report.error(where, 'diagrama.tipo "' + d.diagrama.tipo + '" is not one of ' + tipos.join(', '));
    for (const n of d.contenido || []) if (!k.contenido.some((c) => c.n === n)) report.error(where, 'contenido ' + n + ' does not exist in sesión ' + k.sesion);
  });
}

export function checkActividades(EIA, kb, report) {
  const A = EIA.data.actividades || {};
  // KB "Actividad" blocks -> activity ids.
  const kbMap = {
    1: ['s1-que-mide', 's1-ficha-caso'],
    2: ['s2-picos-valles'],
    3: ['s3-linea-base'],
    4: ['s4-tareas', 's4-evaluacion'],
    5: ['s5-semaforo'],
    6: ['s6-ciclo'],
    7: []
  };
  for (let n = 1; n <= 7; n++) {
    kb.sesiones[n].actividades.forEach((ka, i) => {
      const id = kbMap[n][i];
      const a = A[id];
      const where = 'actividades.' + id;
      if (!a) return report.error(where, 'missing (KB ' + ka.label + ')');
      const k = a.kb || {};
      expectEq(report, where, 'kb.titulo', k.titulo, ka.titulo);
      expectEq(report, where, 'kb.duracion', k.duracion, ka.duracion);
      expectEq(report, where, 'kb.consigna', k.consigna, ka.consigna);
      expectList(report, where, 'kb.pasos', k.pasos || [], ka.pasos);
      if (ka.tabla && id !== 's1-que-mide') {
        expectList(report, where, 'kb.tabla.header', (k.tabla || {}).header || [], ka.tabla.header);
        expectList(report, where, 'kb.tabla.filas (first column)', ((k.tabla || {}).rows || []).map((r) => r[0]), ka.tabla.rows.map((r) => r[0]));
      }
      if (ka.clave) {
        expectEq(report, where, 'kb.clave.titulo', (k.clave || {}).titulo, ka.clave.titulo);
        expectList(report, where, 'kb.clave.items', (k.clave || {}).items || [], ka.clave.items);
      }
    });
    for (const id of (EIA.data.sesiones || {})[n] ? EIA.data.sesiones[n].actividades || [] : []) {
      if (!A[id]) report.error('sesiones.' + n + '.actividades', 'unknown activity id ' + id);
      else if (A[id].sesion !== n) report.error('actividades.' + id, 'sesion should be ' + n);
    }
  }
  // S1 game: the 8 cards of Actividad 1, with the named correction.
  const game = A['s1-que-mide'];
  const kt = kb.sesiones[1].actividades[0].tabla;
  if (game) {
    const cards = game.cards || [];
    if (cards.length !== kt.rows.length) report.error('actividades.s1-que-mide', cards.length + ' cards, KB Actividad 1 has ' + kt.rows.length);
    kt.rows.forEach(([cifra, fuente, clave], i) => {
      const c = cards[i];
      if (!c) return;
      const w = 'actividades.s1-que-mide.cards[' + (c.id || i) + ']';
      if (!sameText(c.cifra, cifra)) {
        const corr = allowedCorrection('actividades.s1-que-mide.cards[' + c.id + '].cifra', c.cifra, cifra);
        if (corr) report.corrections.push({ where: w + '.cifra', name: corr.name, site: c.cifra, kb: cifra });
        else expectEq(report, w, 'cifra', c.cifra, cifra);
      }
      expectEq(report, w, 'fuente', c.fuente, fuente);
      expectEq(report, w, 'claveKB', c.claveKB, clave);
      const m = /^(.*?)\s*(?:\((.*)\))?$/.exec(clave);
      expectEq(report, w, 'tipo', c.tipo, m[1]);
      expectEq(report, w, 'nota', c.nota || '', m[2] || '');
      if (c.clase !== claseDeTipo(EIA, m[1])) report.error(w, 'clase should be "' + claseDeTipo(EIA, m[1]) + '"');
    });
  }
  // S5 ladder and key.
  const esc = A['s5-escalera'];
  const s5 = kb.sesiones[5];
  if (esc) {
    const c6 = s5.contenido.find((c) => c.n === 6);
    const rungs = c6.cuerpo.split('\n').filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s+/, ''));
    expectList(report, 'actividades.s5-escalera', 'peldanos', esc.peldanos, rungs);
    expectList(report, 'actividades.s5-escalera', 'afirmaciones[].clave', (esc.afirmaciones || []).map((a) => a.clave), s5.actividades[0].clave.items);
    expectEq(report, 'actividades.s5-escalera', 'claveTitulo', esc.claveTitulo, s5.actividades[0].clave.titulo);
  } else report.error('actividades.s5-escalera', 'missing');
  // S7 indicator framework and scenarios.
  const s7 = kb.sesiones[7];
  const ind = A['s7-indicadores'];
  const t8 = P.parseTable(s7.contenido.find((c) => c.n === 8).cuerpo.split('\n'));
  if (ind) {
    expectList(report, 'actividades.s7-indicadores', 'columnas', ind.columnas, t8.header);
    const niveles = ind.niveles || [];
    if (niveles.length !== t8.rows.length) report.error('actividades.s7-indicadores', niveles.length + ' levels, KB has ' + t8.rows.length);
    t8.rows.forEach(([nivel, indicadores, pregunta], i) => {
      const d = niveles[i] || {};
      expectEq(report, 'actividades.s7-indicadores.niveles[' + i + ']', 'nivel', d.nivel, nivel);
      expectEq(report, 'actividades.s7-indicadores.niveles[' + i + ']', 'indicadores', d.indicadores, indicadores);
      expectEq(report, 'actividades.s7-indicadores.niveles[' + i + ']', 'pregunta', d.pregunta, pregunta);
    });
  } else report.error('actividades.s7-indicadores', 'missing');
  const esce = A['s7-escenarios'];
  const c7 = P.parseList(s7.contenido.find((c) => c.n === 7).cuerpo.split('\n'));
  if (esce) {
    const items = esce.escenarios || [];
    if (items.length !== c7.length) report.error('actividades.s7-escenarios', items.length + ' scenarios, KB has ' + c7.length);
    c7.forEach((it, i) => {
      const m = /^\*(.+?):\*\s*(.*)$/.exec(it.text);
      const d = items[i] || {};
      expectEq(report, 'actividades.s7-escenarios.escenarios[' + i + ']', 'titulo', d.titulo, m[1]);
      expectEq(report, 'actividades.s7-escenarios.escenarios[' + i + ']', 'texto', d.texto, m[2]);
    });
  } else report.error('actividades.s7-escenarios', 'missing');
  // Rubric (KB §11).
  const rub = EIA.data.rubrica || {};
  const rt = kb.s11.tables[1];
  expectList(report, 'rubrica', 'columnas', rub.columnas, rt.header);
  const crit = rub.criterios || [];
  if (crit.length !== rt.rows.length) report.error('rubrica', crit.length + ' criteria, KB §11 has ' + rt.rows.length);
  rt.rows.forEach(([criterio, peso, n4, n3, n2, n1], i) => {
    const d = crit[i] || {};
    const w = 'rubrica.criterios[' + i + ']';
    expectEq(report, w, 'criterio', d.criterio, criterio);
    if (d.peso !== parseInt(peso, 10)) report.error(w, 'peso ' + d.peso + ' should be ' + parseInt(peso, 10));
    expectList(report, w, 'niveles [4,3,2,1]', [4, 3, 2, 1].map((l) => (d.niveles || {})[l]), [n4, n3, n2, n1]);
  });
  const total = crit.reduce((a, c) => a + (c.peso || 0), 0);
  if (total !== 100) report.error('rubrica', 'weights add up to ' + total + ', not 100');
  const fr = rub.fracciones || {};
  if (fr[4] !== 1 || fr[3] !== 0.75 || fr[2] !== 0.5 || fr[1] !== 0.25) report.error('rubrica', 'fracciones should be 4 = 1, 3 = 0.75, 2 = 0.5, 1 = 0.25 (KB §11)');
}

export function checkAsistente(EIA, kb, report) {
  const a = EIA.data.asistente || {};
  expectEq(report, 'asistente', 'kb0.texto (KB §0)', (a.kb0 || {}).texto, kb.s0.text);
  const tpl = a.plantillas || [];
  if (tpl.length !== 6) report.error('asistente.plantillas', tpl.length + ' templates, prompt §9.9 has 6');
  tpl.forEach((t, i) => {
    const blanks = (t.texto.match(/\[[^\]]+\]/g) || []).map((b) => b.slice(1, -1));
    if (JSON.stringify(blanks) !== JSON.stringify(t.blancos)) report.error('asistente.plantillas[' + i + ']', 'blancos must list the [blanks] of texto in order: ' + JSON.stringify(blanks));
  });
}

// course.js sub-objects that hold KB text (verbatim containment in the KB section).
export const COURSE_KB_PARTS = { kb: null, ficha: 1, mapa: 2, marco: 3, evaluacion: 11, banco: 13 };
// course.js strings inside those parts that are prompt copy, by path.
export const COURSE_PROMPT_COPY = [/^mapa\.hilo\b/, /^mapa\.versiones\b/, /^mapa\.trabajoAutonomo\.texto$/, /\.hojas\[\d+\]$/, /\.(?:id|clase|key|signo|href|archivo|lamina)$/, /\.cifras\[\d+\]$/];

export function checkCourse(EIA, kb, report) {
  const c = EIA.data.course || {};
  const plain = P.fold(P.kbPlain(kb));
  for (const part of Object.keys(COURSE_KB_PARTS)) {
    if (!c[part]) {
      report.error('course.' + part, 'missing');
      continue;
    }
    walkStrings(c[part], part, (p, s) => {
      if (!s.trim() || COURSE_PROMPT_COPY.some((re) => re.test(p))) return;
      const t = P.fold(P.plainText(s).replace(/[«»]/g, ''));
      if (!plain.replace(/[«»]/g, '').includes(t)) report.error('course.' + p, 'not found verbatim in the KB: ' + JSON.stringify(s));
    });
  }
  const res = (((c.ficha || {}).resultados || {}).items || []).length;
  if (res !== 8) report.error('course.ficha.resultados', res + ' learning outcomes, KB §1 has 8');
  const filas = ((c.mapa || {}).filas || []).length;
  if (filas !== 7) report.error('course.mapa.filas', filas + ' rows, KB §2 has 7');
  if (!c.ui) report.error('course.ui', 'missing');
  if (!c.footer || !/Revisado por (\[nombre del facilitador\]|[^.\s][^.]*)\.\s*$/.test(c.footer.texto || '')) report.error('course.footer', 'texto must end with "Revisado por <facilitator name or [nombre del facilitador]>." (prompt §9.10)');
}

export function checkKbMatch(EIA, kb, report) {
  report.step('2');
  checkCifras(EIA, kb, report);
  checkFuentes(EIA, kb, report);
  checkGlosario(EIA, kb, report);
  checkFaq(EIA, kb, report);
  checkCorrecciones(EIA, kb, report);
  checkSesiones(EIA, kb, report);
  checkDeck(EIA, kb, report);
  checkActividades(EIA, kb, report);
  checkAsistente(EIA, kb, report);
  checkCourse(EIA, kb, report);
}

// -------------------------------------------------------------------------------------------------
// Step 3 · References

export function checkReferences(EIA, kb, report) {
  report.step('3');
  const byId = cifraIndex(EIA);
  const fuentes = EIA.data.fuentes || {};
  const deckIds = new Set((EIA.data.deck || []).map((d) => d.id));
  const videos = EIA.data.videos || [];
  const videoIds = new Set(videos.map((v) => v.id));
  const data = EIA.data;
  // Figure ids in every `cifras` array and every {{id|texto}}; source keys in every citation.
  for (const key of Object.keys(data)) {
    if (key === 'cifras') continue;
    walkObjects(data[key], key, (p, o) => {
      if (Array.isArray(o.cifras)) for (const id of o.cifras) if (typeof id === 'string' && !byId[id]) report.error(p + '.cifras', 'unknown figure id ' + id);
    });
    walkStrings(data[key], key, (p, s) => {
      for (const m of P.parseFigureMarkup(s)) if (!byId[m.id]) report.error(p, 'unknown figure id in {{' + m.id + '|…}}');
      for (const c of P.parseCitations(s)) if (!fuentes[c.key]) report.error(p, 'unknown source key [' + c.label + '][' + c.key + ']');
    });
  }
  for (const c of data.cifras || []) for (const k of c.fuentes || []) if (!fuentes[k]) report.error('cifras ' + c.id, 'unknown source key ' + k);
  // ctx-* figures quote a KB sentence (and a KB scope).
  const plain = P.kbPlain(kb);
  for (const c of (data.cifras || []).filter((x) => String(x.id).startsWith('ctx-'))) {
    const t = P.plainText(c.cifra);
    if (!plain.includes(t)) report.error('cifras ' + c.id, 'cifra is not a sentence of the KB: ' + JSON.stringify(c.cifra));
    if (c.alcance && !plain.includes(P.plainText(c.alcance))) report.error('cifras ' + c.id, 'alcance is not KB text: ' + JSON.stringify(c.alcance));
  }
  // Sessions -> láminas, videos, activities; deck -> sessions.
  for (const [n, s] of Object.entries(data.sesiones || {})) {
    for (const id of s.laminas || []) if (!deckIds.has(id)) report.error('sesiones.' + n + '.laminas', 'unknown lámina ' + id);
    for (const id of s.videos || []) {
      if (videoIds.has(id)) continue;
      if (videos.length) report.error('sesiones.' + n + '.videos', 'unknown video ' + id);
      else report.warn('sesiones.' + n + '.videos', 'video ' + id + ' is not in js/data/videos.js yet');
    }
  }
  for (const c of (data.correcciones || {}).filas || []) for (const id of c.cifras || []) if (!byId[id]) report.error('correcciones ' + c.id, 'unknown figure ' + id);
  checkVideoShape(EIA, report);
}

/** Prompt §5.5 + contracts §2 shape of js/data/videos.js. */
export function checkVideoShape(EIA, report) {
  const videos = EIA.data.videos || [];
  const deckIds = new Set((EIA.data.deck || []).map((d) => d.id));
  const seen = new Set();
  videos.forEach((v, vi) => {
    const where = 'videos.' + (v.id || '[' + vi + ']');
    if (!/^v\d\d$/.test(v.id || '')) report.error(where, 'id must be vNN');
    if (seen.has(v.id)) report.error(where, 'duplicate video id');
    seen.add(v.id);
    for (const f of ['slug', 'title']) if (!v[f] || typeof v[f] !== 'string') report.error(where, f + ' is required');
    if (!Number.isInteger(v.sesion) || v.sesion < 1 || v.sesion > 7) report.error(where, 'sesion must be 1–7');
    for (const id of v.laminas || []) if (!deckIds.has(id)) report.error(where + '.laminas', 'unknown lámina ' + id);
    if (!Array.isArray(v.target) || v.target.length !== 2 || !(v.target[0] < v.target[1])) report.error(where, 'target must be [minSeconds, maxSeconds]');
    const scenes = v.scenes || [];
    if (!scenes.length) report.error(where, 'has no scenes');
    const sceneIds = new Set();
    scenes.forEach((s, si) => {
      const w = where + '.scenes.' + (s.id || '[' + si + ']');
      if (!s.id) report.error(w, 'scene id is required');
      if (sceneIds.has(s.id)) report.error(w, 'duplicate scene id');
      sceneIds.add(s.id);
      if (!(s.min > 0)) report.error(w, 'min (seconds) is required');
      if (!s.seVe) report.error(w, 'seVe is required');
      for (const [k, r] of Object.entries(s.rotulos || {})) if (!r || typeof r.text !== 'string') report.error(w + '.rotulos.' + k, 'rótulo needs { text }');
      (s.lines || []).forEach((l, li) => {
        const lw = w + '.lines[' + li + ']';
        if (l.voice !== 'narrador' && l.voice !== 'lectora') report.error(lw, 'voice must be "narrador" or "lectora"');
        if (!l.text) report.error(lw, 'text is required');
        const adv = l.advertencia;
        if (adv != null && ![].concat(adv).every((a) => Number.isInteger(a) && a >= 1 && a <= 4)) report.error(lw, 'advertencia must be 1–4 or an array of them');
      });
    });
    if (v.poster && !sceneIds.has(v.poster.scene)) report.error(where + '.poster', 'unknown scene ' + v.poster.scene);
    for (const c of v.chapters || []) if (!sceneIds.has(c.from)) report.error(where + '.chapters', 'chapter «' + c.title + '» starts at unknown scene ' + c.from);
    (v.checkpoints || []).forEach((c, ci) => {
      const w = where + '.checkpoints[' + ci + ']';
      if (!sceneIds.has(c.after)) report.error(w, 'after: unknown scene ' + c.after);
      if (!Array.isArray(c.options) || c.options.length < 2 || c.options.length > 4) report.error(w, 'options: 2–4');
      else if (!Number.isInteger(c.answer) || c.answer < 0 || c.answer >= c.options.length) report.error(w, 'answer must be an option index');
      if (!c.hint) report.error(w, 'hint is required (contracts §2)');
      if (!c.explain) report.error(w, 'explain is required');
    });
  });
}

// -------------------------------------------------------------------------------------------------
// Step 4 · Numbers

function structuralSpans(text) {
  const spans = [];
  for (const s of STRUCTURAL_NUMBERS) {
    s.re.lastIndex = 0;
    let m;
    while ((m = s.re.exec(text)) !== null) {
      spans.push([m.index, m.index + m[0].length, s.name]);
      if (!m[0].length) s.re.lastIndex++;
    }
  }
  return spans;
}

/** Checks the numbers of one display string. `ids` back it; `ilustrativo` exempts it; `fallback`
 *  ids (e.g. the scene's lines) only produce a warning. */
export function checkTextNumbers(EIA, report, where, text, { ids = [], ilustrativo = false, fallback = [] } = {}) {
  const byId = cifraIndex(EIA);
  const src = P.stripCitations(P.stripFigureMarkup(String(text)));
  const spans = structuralSpans(src);
  const valuesOf = (list) => {
    const out = new Map();
    for (const id of list) {
      const c = byId[id];
      if (!c) continue;
      for (const f of [c.cifra, c.alcance, c.alcanceCompleto]) for (const v of P.numberValues(f || '')) if (!out.has(v)) out.set(v, id);
    }
    return out;
  };
  const own = valuesOf(ids);
  const extra = valuesOf(fallback);
  for (const t of P.tokenizeNumbers(src)) {
    if (t.kind === 'year' || t.kind === 'year-range') continue;
    const sp = spans.find(([a, b]) => t.index >= a && t.index < b);
    if (sp) {
      report.numbers.push({ where, value: t.raw, by: 'structural: ' + sp[2] });
      continue;
    }
    if (t.kind === 'date' && COURSE_DATES.includes(t.value)) {
      report.numbers.push({ where, value: t.raw, by: 'course date' });
      continue;
    }
    if (ilustrativo) {
      report.numbers.push({ where, value: t.raw, by: 'ilustrativo' });
      continue;
    }
    const find = (vals) => {
      if (vals.has(t.value)) return vals.get(t.value);
      if (t.kind === 'date' && !t.year && vals.has(t.value)) return vals.get(t.value);
      if (t.parts.length && t.parts.every((p) => vals.has(p))) return t.parts.map((p) => vals.get(p)).join('+');
      return null;
    };
    const hit = find(own);
    if (hit) {
      report.numbers.push({ where, value: t.raw, by: hit });
      continue;
    }
    const near = find(extra);
    if (near) {
      report.numbers.push({ where, value: t.raw, by: near + ' (scene)' });
      report.warn(where, '«' + t.raw + '» is backed by ' + near + ' of its scene, not by ids of its own');
      continue;
    }
    report.error(where, '«' + t.raw + '» is not in the cifra or alcance of ' + (ids.length ? ids.join(', ') : 'any referenced figure') + ': ' + JSON.stringify(String(text)));
  }
}

const DRAWN_KEYS = ['text', 'valor', 'etiqueta', 'cifra', 'titulo', 'label', 'texto', 'fecha', 'carril', 'nota', 'resultado'];

export function checkNumbers(EIA, kb, report) {
  report.step('4');
  // Videos (prompt §5.5 shape).
  for (const v of EIA.data.videos || []) {
    const vw = 'videos.' + v.id;
    for (const s of v.scenes || []) {
      const sw = vw + '.scenes.' + s.id;
      const sceneIds = [...new Set((s.lines || []).flatMap((l) => l.cifras || []))];
      (s.lines || []).forEach((l, i) => {
        checkTextNumbers(EIA, report, sw + '.lines[' + i + ']', l.text, { ids: l.cifras || [], ilustrativo: !!l.ilustrativo });
      });
      for (const [k, r] of Object.entries(s.rotulos || {})) {
        checkTextNumbers(EIA, report, sw + '.rotulos.' + k, r.text, { ids: r.cifras || [], ilustrativo: !!r.ilustrativo, fallback: sceneIds });
      }
    }
    (v.checkpoints || []).forEach((c, i) => {
      const cw = vw + '.checkpoints[' + i + ']';
      const scene = (v.scenes || []).find((s) => s.id === c.after) || {};
      const fallback = [...new Set((scene.lines || []).flatMap((l) => l.cifras || []))];
      const opts = { ids: c.cifras || [], ilustrativo: !!c.ilustrativo, fallback };
      checkTextNumbers(EIA, report, cw + '.question', c.question, opts);
      if (Array.isArray(c.options) && c.options[c.answer] != null) checkTextNumbers(EIA, report, cw + '.options[' + c.answer + ']', c.options[c.answer], opts);
      checkTextNumbers(EIA, report, cw + '.explain', c.explain, opts);
      (c.options || []).forEach((o, j) => {
        if (j !== c.answer) report.info(cw + '.options[' + j + ']', 'wrong option (glance): ' + o);
      });
    });
  }
  // Láminas: every drawn string.
  for (const d of EIA.data.deck || []) {
    const w = 'deck.' + d.id;
    checkTextNumbers(EIA, report, w + '.titular', d.titular);
    checkTextNumbers(EIA, report, w + '.subtitulo', d.subtitulo);
    (d.cifras || []).forEach((c, i) => {
      checkTextNumbers(EIA, report, w + '.cifras[' + i + '].valor', c.valor, { ids: c.cifras || [] });
      checkTextNumbers(EIA, report, w + '.cifras[' + i + '].etiqueta', c.etiqueta, { ids: c.cifras || [] });
    });
    if (d.diagrama) {
      const dg = d.diagrama;
      const all = [...(dg.cifras || []), ...(dg.items || []).flatMap((it) => it.cifras || [])];
      checkTextNumbers(EIA, report, w + '.diagrama.titulo', dg.titulo, { ids: dg.cifras || [] });
      (dg.items || []).forEach((it, i) => {
        for (const k of ['text', 'carril', 'fecha']) if (it[k]) checkTextNumbers(EIA, report, w + '.diagrama.items[' + i + '].' + k, it[k], { ids: it.cifras || dg.cifras || [] });
      });
      for (const h of dg.hitos || []) checkTextNumbers(EIA, report, w + '.diagrama.hitos', h, { ids: all });
      if (dg.enlace) checkTextNumbers(EIA, report, w + '.diagrama.enlace', dg.enlace);
      if (dg.nota) checkTextNumbers(EIA, report, w + '.diagrama.nota', dg.nota.text, { ids: dg.nota.cifras || [] });
    }
    if (d.ideaCentral) checkTextNumbers(EIA, report, w + '.ideaCentral', d.ideaCentral.text, { ids: d.ideaCentral.cifras || [] });
    if (d.pie) checkTextNumbers(EIA, report, w + '.pie', d.pie.text, { ids: d.pie.cifras || [] });
    for (const [k, r] of Object.entries(d.rotulos || {})) checkTextNumbers(EIA, report, w + '.rotulos.' + k, r.text, { ids: r.cifras || [], ilustrativo: !!r.ilustrativo });
  }
  // Drawn activity data and the hero: any object that declares cifras or ilustrativo.
  const scan = (root, base) =>
    walkObjects(root, base, (p, o) => {
      const ids = Array.isArray(o.cifras) ? o.cifras : null;
      if (!ids && !o.ilustrativo) return;
      for (const k of DRAWN_KEYS) if (typeof o[k] === 'string') checkTextNumbers(EIA, report, p + '.' + k, o[k], { ids: ids || [], ilustrativo: !!o.ilustrativo });
    });
  scan(EIA.data.actividades || {}, 'actividades');
  scan((EIA.data.course || {}).hero || {}, 'course.hero');
}

// -------------------------------------------------------------------------------------------------
// Step 5 · Banned versions

export function checkBanned(EIA, kb, report) {
  report.step('5');
  const data = EIA.data;
  for (const key of Object.keys(data)) {
    walkStrings(data[key], key, (p, s) => {
      if (BANNED_EXEMPT.some((e) => e.re.test(p))) return;
      for (const sentence of P.splitSentences(P.stripFigureMarkup(P.renderCitations(s)))) {
        for (const b of BANNED) {
          const level = b.test(sentence);
          if (level === 'error') report.error(p, 'banned version (' + b.name + '): ' + JSON.stringify(sentence));
          else if (level === 'warning') report.warn(p, 'check (' + b.name + '): ' + JSON.stringify(sentence));
        }
      }
    });
  }
}

// -------------------------------------------------------------------------------------------------
// Step 6 · Series

const SERIES_2025 = ['adop-1', 'adop-2', 'adop-3', 'adop-4', 'adop-5', 'adop-6'];

function idsIn(value) {
  const out = new Set();
  walkObjects(value, '', (p, o) => (o.cifras || []).forEach((id) => out.add(id)));
  walkStrings(value, '', (p, s) => P.parseFigureMarkup(s).forEach((m) => out.add(m.id)));
  return out;
}

export function checkSeries(EIA, kb, report) {
  report.step('6');
  const flag = (where, value) => {
    const ids = idsIn(value);
    const old = SERIES_2025.filter((id) => ids.has(id));
    if (!ids.has('adop-7') || !old.length) return;
    let separated = false;
    walkObjects(value, '', (p, o) => {
      if (o.panel && idsIn(o).has('adop-7') && !SERIES_2025.some((id) => idsIn(o).has(id))) separated = true;
    });
    report.warn(where, 'references ' + old.join(', ') + ' and adop-7 (McKinsey 2025 vs 2026): review that they sit on separate panels, never one axis' + (separated ? ' (data declares a separate panel)' : ''));
  };
  for (const d of EIA.data.deck || []) flag('deck.' + d.id, d);
  for (const v of EIA.data.videos || []) {
    for (const s of v.scenes || []) flag('videos.' + v.id + '.scenes.' + s.id, s);
    (v.checkpoints || []).forEach((c, i) => flag('videos.' + v.id + '.checkpoints[' + i + ']', c));
  }
  for (const [id, a] of Object.entries(EIA.data.actividades || {})) flag('actividades.' + id, a);
}

// -------------------------------------------------------------------------------------------------
// Step 7 · Timeline (sesión 0): the data is the CSV, verbatim

// CSV column → data field, in file order.
export const TIMELINE_COLUMNS = [
  ['Fecha', 'fecha'], ['Hito', 'hito'], ['Organización/personas', 'actores'], ['Lugar/contexto', 'lugar'],
  ['Descripción del avance técnico', 'avance'], ['Importancia histórica', 'importancia'],
  ['Fuente de verificación', 'fuente'], ['Nota de verificación', 'nota']
];
const TIMELINE_ID = /^[a-z0-9][a-z0-9-]*$/; // js/core/router.js BLOCK_RE: #s0/<id> must survive parse()

/** Digit runs of a text ("4–1" -> ['4', '1'], "3.5" -> ['3', '5']). */
const digitRuns = (text) => String(text || '').match(/\d+/g) || [];

export function checkLineaTiempo(EIA, csvText, report) {
  report.step('7');
  const lt = EIA.data.lineaTiempo;
  if (!lt) return report.error('lineaTiempo', 'missing: js/data/linea-tiempo.js is not loaded by index.html');
  if (csvText == null) return report.error('lineaTiempo', 'cannot read the CSV ' + lt.csv);
  const [header, ...rows] = parseCsv(csvText);
  const expected = TIMELINE_COLUMNS.map(([col]) => col);
  if (JSON.stringify(header) !== JSON.stringify(expected)) report.error('lineaTiempo.csv', 'header ' + JSON.stringify(header) + ' should be ' + JSON.stringify(expected));
  const hitos = lt.hitos || [];
  if (hitos.length !== rows.length) report.error('lineaTiempo.hitos', hitos.length + ' milestones, the CSV has ' + rows.length + ' rows');
  const eras = new Set((lt.eras || []).map((e) => e.id));
  const seen = new Set();
  rows.forEach((row, i) => {
    const h = hitos[i];
    const where = 'lineaTiempo.hitos[' + i + ']';
    if (!h) return report.error(where, 'missing (CSV row ' + (i + 2) + ': ' + row[1] + ')');
    TIMELINE_COLUMNS.forEach(([col, key], k) => {
      if (h[key] !== row[k]) report.error(where + '.' + key, 'differs from the CSV column «' + col + '»\n      site: ' + JSON.stringify(h[key]) + '\n      CSV:  ' + JSON.stringify(row[k]));
    });
    if (!TIMELINE_ID.test(h.id || '')) report.error(where, 'id ' + JSON.stringify(h.id) + ' is not a deep-link id (a-z, 0-9, -)');
    if (seen.has(h.id)) report.error(where, 'duplicate id ' + h.id);
    seen.add(h.id);
    if (!eras.has(h.era)) report.error(where, 'unknown era ' + JSON.stringify(h.era));
    if (!h.narracion) report.error(where, 'narracion is empty');
    const rowText = row.join(' ');
    for (const n of digitRuns(h.narracion)) {
      if (!digitRuns(rowText).includes(n)) report.error(where + '.narracion', 'the number «' + n + '» is not in the CSV row');
    }
  });
  if (!lt.intro || !lt.intro.narracion) report.error('lineaTiempo.intro', 'narracion is empty');
}

// -------------------------------------------------------------------------------------------------
// Step 8 · Report

export function formatReport(report, { verbose = false, kbMeta = {}, files = [] } = {}) {
  const out = [];
  const titles = { 1: 'Load', 2: 'KB match', 3: 'References', 4: 'Numbers', 5: 'Banned versions', 6: 'Series', 7: 'Timeline' };
  out.push('check-content · Estado de la IA 2026');
  if (kbMeta['Versión']) out.push('KB ' + P.KB_FILE + ' · versión ' + kbMeta['Versión']);
  if (files.length) out.push('Data: ' + files.length + ' scripts loaded in a vm sandbox');
  out.push('');
  for (const s of Object.keys(titles)) {
    const st = report.steps[s] || { errors: 0, warnings: 0 };
    out.push('  [' + s + '] ' + (titles[s] + ' ').padEnd(18, '.') + ' ' + (st.errors ? st.errors + ' error(s)' : 'ok') + (st.warnings ? ', ' + st.warnings + ' warning(s)' : ''));
  }
  const list = (title, items, mark) => {
    if (!items.length) return;
    out.push('', title + ' (' + items.length + ')');
    for (const e of items) out.push('  ' + mark + ' [' + e.step + '] ' + e.where + ': ' + e.msg);
  };
  list('Errors', report.errors, '✗');
  list('Warnings', report.warnings, '!');
  if (report.corrections.length) {
    out.push('', 'Allowed corrections applied (' + report.corrections.length + ')');
    for (const c of report.corrections) out.push('  ✓ ' + c.where + ': ' + c.name + (c.kb ? ' — KB «' + c.kb + '» → site «' + c.site + '»' : ' — «' + c.site + '»'));
  }
  if (verbose) {
    list('Notes', report.infos, '·');
    out.push('', 'Numbers and the figures that back them (' + report.numbers.length + ')');
    for (const n of report.numbers) out.push('  ' + n.where + ': «' + n.value + '» ← ' + n.by);
  } else if (report.numbers.length) {
    out.push('', report.numbers.length + ' numbers checked (run with --verbose to list each with its figure).');
  }
  out.push('', 'Result: ' + report.errors.length + ' error(s), ' + report.warnings.length + ' warning(s).');
  return out.join('\n');
}

// -------------------------------------------------------------------------------------------------
// Run

export async function run({ root = DEFAULT_ROOT, extra = [] } = {}) {
  const report = createReport();
  report.step('1');
  let EIA = null;
  let kb = null;
  try {
    kb = P.parseKB(P.readKB(path.join(root, P.KB_FILE)));
  } catch (err) {
    report.error(P.KB_FILE, 'cannot parse the KB: ' + err.message);
  }
  try {
    EIA = await loadData({ root, extra });
  } catch (err) {
    report.error('load-data', err.message);
  }
  if (EIA && kb) {
    for (const [name, fn] of [
      ['2', checkKbMatch],
      ['3', checkReferences],
      ['4', checkNumbers],
      ['5', checkBanned],
      ['6', checkSeries]
    ]) {
      try {
        fn(EIA, kb, report);
      } catch (err) {
        report.step(name);
        report.error('checker', 'step ' + name + ' crashed: ' + (err.stack || err.message));
      }
    }
  }
  if (EIA) {
    const csvFile = EIA.data.lineaTiempo && EIA.data.lineaTiempo.csv;
    let csvText = null;
    try { if (csvFile) csvText = fs.readFileSync(path.join(root, csvFile), 'utf8'); } catch { /* reported by the step */ }
    try {
      checkLineaTiempo(EIA, csvText, report);
    } catch (err) {
      report.step('7');
      report.error('checker', 'step 7 crashed: ' + (err.stack || err.message));
    }
  }
  return { report, EIA, kb };
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const root = opt('--root') ? path.resolve(opt('--root')) : DEFAULT_ROOT;
  const extra = args.flatMap((a, i) => (a === '--extra' ? [args[i + 1]] : []));
  const { report, EIA, kb } = await run({ root, extra });
  console.log(formatReport(report, { verbose, kbMeta: kb ? kb.meta : {}, files: EIA ? EIA.__files : [] }));
  process.exitCode = report.errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
