/* tools/lib/kb-parse.mjs — parser for the course knowledge base (contenido/base-estado-ia-2026.md).
 *
 * Dev-only (Node >= 20, built-ins only). The KB is the single source of truth: check-content.mjs uses
 * these functions to compare js/data/*.js with it, and they were used to transcribe it in the first
 * place, so every structure here keeps the KB text verbatim (inline markup included).
 *
 * Layers, from generic to KB-specific:
 *   1. Text helpers ........ normalizeWS, citations ([Etiqueta][clave]), inline markup, plain text
 *   2. Markdown subset ..... headings tree, bold-label blocks, nested lists, pipe tables, link defs
 *   3. Numbers ............. tokenizeNumbers ("1.993", "66,3%", "−38%", "2026–2028", "4.º", dates)
 *   4. KB sections ......... parseKB(text) -> { meta, s0 … s16, sesiones, banco, linkDefs, … }
 */

import { readFileSync } from 'node:fs';

export const KB_FILE = 'contenido/base-estado-ia-2026.md';

/** Reads the KB file as UTF-8 text. */
export function readKB(file = KB_FILE) {
  return readFileSync(file, 'utf8');
}

// =================================================================================================
// 1. Text helpers

/** Collapses every whitespace run to one space and trims. */
export function normalizeWS(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
}

/** Accent- and case-insensitive form (same rule as EIA.util.fold in js/core/namespace.js). */
export function fold(text) {
  return String(text == null ? '' : text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Same rule as EIA.util.slug: "Adopción y valor" -> "adopcion-y-valor". */
export function slug(text) {
  return fold(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const CITE_SRC = '\\[([^\\[\\]]+)\\]\\[([^\\[\\]]+)\\]';
const CITE_RE = () => new RegExp(CITE_SRC, 'g');
// "([McKinsey, 2025][mck25])" or "([Stanford, cap. 4][hai4]; [cap. 1][hai1])": a parenthesis that holds
// only citations separated by ";".
const CITE_GROUP_RE = () => new RegExp('\\s*\\(\\s*' + CITE_SRC + '(?:\\s*;\\s*' + CITE_SRC + ')*\\s*\\)', 'g');

/** Every citation "[Etiqueta][clave]" in order: [{ label, key, raw, index }]. */
export function parseCitations(text) {
  const out = [];
  const re = CITE_RE();
  let m;
  while ((m = re.exec(String(text))) !== null) out.push({ label: m[1], key: m[2], raw: m[0], index: m.index });
  return out;
}

/** Unique citation keys in order of first appearance. */
export function citationKeys(text) {
  return [...new Set(parseCitations(text).map((c) => c.key))];
}

/** "[Etiqueta][clave]" -> "Etiqueta". */
export function renderCitations(text) {
  return String(text).replace(CITE_RE(), '$1');
}

/** Removes parenthesized citation groups, then renders any remaining citation as its label. */
export function stripCitations(text) {
  return renderCitations(String(text).replace(CITE_GROUP_RE(), ''));
}

/** Removes the site-only figure markup: "{{adop-1|88%}}" -> "88%". */
export function stripFigureMarkup(text) {
  return String(text).replace(/\{\{([a-z0-9-]+)\|([^{}]*)\}\}/g, '$2');
}

/** Figure markup occurrences: [{ id, text, raw, index }]. */
export function parseFigureMarkup(text) {
  const out = [];
  const re = /\{\{([a-z0-9-]+)\|([^{}]*)\}\}/g;
  let m;
  while ((m = re.exec(String(text))) !== null) out.push({ id: m[1], text: m[2], raw: m[0], index: m.index });
  return out;
}

/** Removes **bold** and *italic* markers and the figure markup, keeping their text. */
export function stripEmphasis(text) {
  return stripFigureMarkup(text)
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/(^|[^*\p{L}\d])\*([^*\n]+?)\*(?=[^*\p{L}\d]|$)/gu, '$1$2');
}

/** Display text without any markup: citations removed (or rendered), emphasis removed, WS normalized. */
export function plainText(text, { keepCitationLabels = false } = {}) {
  const t = keepCitationLabels ? renderCitations(text) : stripCitations(text);
  return normalizeWS(stripEmphasis(t));
}

/** Text compared by the checker: whitespace normalized, site-only figure markup stripped. */
export function comparable(text) {
  return normalizeWS(stripFigureMarkup(text));
}

/** Removes Spanish angle quotes and straight quotes around a whole string: "«Hola»." -> "Hola". */
export function unquote(text) {
  let t = normalizeWS(text).replace(/[.;]+$/, '');
  if (/^«[^«»]*»$/.test(t)) t = t.slice(1, -1);
  return t;
}

/** Splits text at top level (outside (), [], «») on a separator such as "; ". */
export function splitTopLevel(text, sep = ';') {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of String(text)) {
    if (ch === '(' || ch === '[' || ch === '«') depth++;
    else if (ch === ')' || ch === ']' || ch === '»') depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) {
      out.push(buf);
      buf = '';
    } else buf += ch;
  }
  out.push(buf);
  return out.map((s) => s.trim()).filter(Boolean);
}

// Abbreviations whose period never ends a sentence (protected before splitting).
const ABBREVIATIONS = ['EE. UU.', 'cap.', 'feb.', 'Ago.', 'p. ej.', 'etc.', 'núm.', 'art.', 'aprox.'];

/** Splits a string into sentences at ".", ";", "·" (followed by space/end) and line breaks. */
export function splitSentences(text) {
  let t = String(text);
  const marks = [];
  ABBREVIATIONS.forEach((abbr, i) => {
    t = t.split(abbr).join('\u0001' + i + '\u0002');
    marks.push(abbr);
  });
  return t
    .split(/(?:[.;·](?=\s|$|[»")\]])|\n)+/)
    .map((s) => s.replace(/\u0001(\d+)\u0002/g, (m, i) => marks[Number(i)]).trim())
    .filter(Boolean);
}

// =================================================================================================
// 2. Markdown subset

/** Heading tree: [{ level, title, line, end, children }] with `line` the heading line index and
 *  `end` the index of the first line after the section (exclusive). */
export function headingTree(lines) {
  const flat = [];
  lines.forEach((line, i) => {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) flat.push({ level: m[1].length, title: m[2].trim(), line: i, end: lines.length, children: [] });
  });
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[j].level <= flat[i].level) {
        flat[i].end = flat[j].line;
        break;
      }
    }
  }
  const roots = [];
  const stack = [];
  for (const h of flat) {
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
    (stack.length ? stack[stack.length - 1].children : roots).push(h);
    stack.push(h);
  }
  return roots;
}

/** Depth-first search of the heading tree. */
export function findHeading(tree, predicate) {
  for (const node of tree) {
    if (predicate(node)) return node;
    const hit = findHeading(node.children, predicate);
    if (hit) return hit;
  }
  return null;
}

/** Lines of a section body (after its heading, up to its first child heading when `own` is true). */
export function sectionBody(lines, node, { own = false } = {}) {
  const end = own && node.children.length ? node.children[0].line : node.end;
  return lines.slice(node.line + 1, end);
}

/** "[key]: url" reference definitions, in KB order: { key: url }. */
export function parseLinkDefs(text) {
  const out = {};
  for (const line of String(text).split('\n')) {
    const m = /^\[([^\]]+)\]:\s*(\S+)\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/** Splits a pipe-table row into trimmed cells (inline markup kept). */
export function splitTableRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

/** Parses consecutive pipe-table lines: { header: [...], rows: [[...]] }. */
export function parseTable(lines) {
  const rows = lines.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (!rows.length) return null;
  const header = splitTableRow(rows[0]);
  const body = rows.slice(1).filter((l) => !/^\|?\s*:?-{3,}/.test(l)).map(splitTableRow);
  return { header, rows: body };
}

/** Returns the pipe-table lines of a block of lines, grouped into tables. */
export function findTables(lines) {
  const tables = [];
  let cur = null;
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      if (!cur) {
        cur = [];
        tables.push(cur);
      }
      cur.push(line);
    } else cur = null;
  }
  return tables.map(parseTable);
}

const LIST_ITEM_RE = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

/** Parses a nested list (indentation-based) from lines that may include blank lines and indented
 *  continuation paragraphs. Returns items: { marker, ordered, n, indent, text, children, paras }.
 *  `paras` are continuation paragraphs that belong to the item (indented, after a blank line). */
export function parseList(lines) {
  const roots = [];
  const stack = []; // { item, indent, contentIndent }
  let pendingBlank = false;
  for (const raw of lines) {
    if (!raw.trim()) {
      pendingBlank = true;
      continue;
    }
    const m = LIST_ITEM_RE.exec(raw);
    if (m && !raw.trim().startsWith('|')) {
      const indent = m[1].length;
      const item = {
        marker: m[2],
        ordered: /\d/.test(m[2]),
        n: /\d/.test(m[2]) ? parseInt(m[2], 10) : null,
        indent,
        text: m[3].trim(),
        children: [],
        paras: []
      };
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      (stack.length ? stack[stack.length - 1].item.children : roots).push(item);
      stack.push({ item, indent, contentIndent: indent + m[2].length + 1 });
      pendingBlank = false;
      continue;
    }
    // Continuation: attach to the deepest item whose content column is at or before this line.
    const ind = raw.length - raw.trimStart().length;
    while (stack.length && stack[stack.length - 1].contentIndent > ind && stack.length > 1) stack.pop();
    const top = stack[stack.length - 1];
    if (!top) {
      roots.push({ marker: '', ordered: false, n: null, indent: ind, text: raw.trim(), children: [], paras: [], paragraph: true });
      continue;
    }
    if (pendingBlank || top.item.children.length) top.item.paras.push(raw.trim());
    else top.item.text += ' ' + raw.trim();
    pendingBlank = false;
  }
  return roots;
}

/** Splits lines into blocks that start with a bold label at column 0 ("**Tesis.** …",
 *  "**Contenido**", "**Diapositivas:** 1 y 2. **Producto:** …"). Lines before the first label form a
 *  block with label null. Each block: { label, sep, rest, lines, line } where `label` is the bold text
 *  without its final "." or ":", `sep` that final character, `rest` the text after the label on the
 *  same line and `lines` the following lines up to the next label. */
export function splitLabelBlocks(lines, offset = 0) {
  const blocks = [];
  let cur = { label: null, sep: '', rest: '', lines: [], line: offset };
  lines.forEach((line, i) => {
    const m = /^\*\*(.+?)\*\*(.*)$/.exec(line);
    if (m) {
      blocks.push(cur);
      let label = m[1].trim();
      let sep = '';
      if (/[.:]$/.test(label)) {
        sep = label.slice(-1);
        label = label.slice(0, -1).trim();
      }
      cur = { label, sep, rest: m[2].trim(), lines: [], line: offset + i };
    } else cur.lines.push(line);
  });
  blocks.push(cur);
  return blocks.filter((b) => b.label !== null || b.lines.some((l) => l.trim()));
}

/** Re-serializes a parsed list as markup lines ("- ", "1. ", two spaces per nesting level). */
export function listToMarkup(items, depth = 0) {
  const out = [];
  for (const it of items) {
    const pad = '  '.repeat(depth);
    out.push(pad + (it.ordered ? it.n + '. ' : '- ') + it.text);
    if (it.children.length) out.push(...listToMarkup(it.children, depth + 1));
    for (const p of it.paras) out.push('', pad + p);
  }
  return out;
}

/** Item text without its list marker, for flat lists of strings. */
export function listTexts(items) {
  return items.map((it) => it.text);
}

// =================================================================================================
// 3. Numbers

const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
// One number: thousands groups ("1.993"), decimal comma ("66,3"), version ("2.0"), or digits.
const NUM = '\\d{1,3}(?:\\.\\d{3})+(?![\\d.]*\\d)|\\d+,\\d+|\\d+\\.\\d{1,2}(?!\\d)|\\d+';
const NUMBER_RE = new RegExp(
  '(?<![\\p{L}\\d.,])' + // not glued to a word or another number
    '(?<pre>[~≈<>+−-]{0,2})' +
    '(?<a>' + NUM + ')(?<pa>\\s?%)?' +
    '(?:(?<ord>\\.º|º|\\.ª|ª)|' +
    '(?<rng>\\s?[–]\\s?(?<rpre>[~≈<>+−-]?)(?<b>' + NUM + ')(?<pb>\\s?%)?)|' +
    '(?<frac>/(?<den>\\d+)))?' +
    '(?<times>×)?' +
    '(?![\\p{L}\\d])',
  'gu'
);
const DATE_RE = new RegExp('(?<![\\p{L}\\d])(\\d{1,2}) de (' + MONTHS + ')(?: de (\\d{4}))?(?![\\p{L}\\d])', 'giu');

/** True for a plain year in the exempt range (2010–2030). */
export function isPlainYear(value) {
  return /^\d{4}$/.test(value) && Number(value) >= 2010 && Number(value) <= 2030;
}

/**
 * Number tokens of a display text (citations and figure markup are removed first).
 * Each token: { raw, value, kind, sign, parts, index }:
 *   kind  'number' | 'percent' | 'ordinal' | 'range' | 'fraction' | 'date' | 'year' | 'year-range'
 *   value the comparison form: number as the KB writes it, "%" kept, "×", "~", "≈", "<", ">", "+", "−"
 *         dropped ("−38%" -> "38%", "23×" -> "23", "4.º" -> "4.º", "2 de agosto de 2026" -> same text)
 *   parts for ranges, the two endpoint values ("14–15%" -> ["14", "15%"])
 * Dates ("2 de agosto de 2026") are single tokens; their year is not reported separately.
 */
export function tokenizeNumbers(text) {
  const src = stripCitations(stripFigureMarkup(String(text == null ? '' : text)));
  const tokens = [];
  const taken = [];
  let m;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(src)) !== null) {
    const value = (m[1] + ' de ' + m[2].toLowerCase() + (m[3] ? ' de ' + m[3] : '')).replace('setiembre', 'septiembre');
    tokens.push({ raw: m[0], value, kind: 'date', sign: '', parts: [], index: m.index, day: m[1], month: m[2].toLowerCase(), year: m[3] || '' });
    taken.push([m.index, m.index + m[0].length]);
  }
  NUMBER_RE.lastIndex = 0;
  while ((m = NUMBER_RE.exec(src)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (taken.some(([a, b]) => start < b && end > a)) continue;
    const g = m.groups;
    const pa = g.pa ? '%' : '';
    let kind = pa ? 'percent' : 'number';
    let value = g.a + pa;
    let parts = [];
    if (g.ord) {
      kind = 'ordinal';
      value = g.a + (g.ord.includes('ª') ? '.ª' : '.º');
    } else if (g.rng) {
      const pb = g.pb ? '%' : '';
      parts = [g.a + pa, g.b + pb];
      value = g.a + pa + '–' + g.b + pb;
      kind = isPlainYear(g.a) && isPlainYear(g.b) ? 'year-range' : 'range';
    } else if (g.frac) {
      kind = 'fraction';
      value = g.a + '/' + g.den;
    } else if (!pa && isPlainYear(g.a) && !g.times) {
      kind = 'year';
    }
    tokens.push({ raw: m[0], value, kind, sign: g.pre || '', parts, index: start });
  }
  return tokens.sort((x, y) => x.index - y.index);
}

/** Comparison values a figure text offers: every token value, plus range endpoints ("5,8–8,8%" also
 *  offers "5,8%", because the percent sign of a range applies to both ends) and the day-month of dates. */
export function numberValues(text) {
  const out = new Set();
  for (const t of tokenizeNumbers(text)) {
    out.add(t.value);
    t.parts.forEach((p) => out.add(p));
    if (t.parts.length === 2 && t.parts[1].endsWith('%') && !t.parts[0].endsWith('%')) out.add(t.parts[0] + '%');
    if (t.kind === 'date' && t.year) out.add(t.day + ' de ' + t.month);
  }
  return out;
}

// =================================================================================================
// 4. KB sections

function headingNumber(title) {
  const m = /^(\d+)\.\s+(.*)$/.exec(title);
  return m ? { n: Number(m[1]), title: m[2].trim() } : null;
}

function nonBlank(lines) {
  return lines.filter((l) => l.trim());
}

/** "**Diapositivas:** 1 y 2. **Producto:** ficha del caso de uso." */
function parseDiapositivasLine(rest) {
  const m = /^(.*?)\.\s+\*\*Producto:\*\*\s+(.*?)\.?$/.exec(rest);
  return m ? { diapositivas: m[1].trim(), producto: m[2].trim() } : { diapositivas: rest, producto: '' };
}

// Placeholder-protected search for the end of the first sentence (outside citations and parentheses).
function firstSentenceEnd(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '«') depth++;
    else if (ch === ')' || ch === ']' || ch === '»') depth = Math.max(0, depth - 1);
    else if (ch === '.' && depth === 0 && (i === text.length - 1 || /\s/.test(text[i + 1]))) return i;
  }
  return -1;
}

/** Splits the first line of a "Contenido" point: "**Título.** resto" or "**Título** (nota). resto".
 *  Returns { titulo, complemento, resto }. */
export function splitPointTitle(text) {
  const m = /^\*\*(.+?)\*\*(.*)$/.exec(text.trim());
  if (!m) return { titulo: '', complemento: '', resto: text.trim() };
  const bold = m[1].trim();
  const after = m[2];
  if (/[.:?!]$/.test(bold)) {
    return { titulo: bold.replace(/[.:]$/, ''), complemento: '', resto: after.trim() };
  }
  const tail = after.trim();
  const end = firstSentenceEnd(tail);
  if (end < 0) return { titulo: bold, complemento: tail, resto: '' };
  return { titulo: bold, complemento: tail.slice(0, end).trim(), resto: tail.slice(end + 1).trim() };
}

/** Parses the numbered points of a "Contenido" block. Tables and paragraphs that follow a point at
 *  column 0 belong to it. Returns [{ n, titulo, complemento, cuerpo }] where `cuerpo` is markup. */
export function parseContenido(lines) {
  const points = [];
  let cur = null;
  for (const line of lines) {
    const m = /^(\d+)\.\s+(.*)$/.exec(line);
    if (m) {
      cur = { n: Number(m[1]), head: m[2], contentIndent: m[1].length + 2, lines: [] };
      points.push(cur);
    } else if (cur) cur.lines.push(line);
  }
  return points.map((p) => {
    const { titulo, complemento, resto } = splitPointTitle(p.head);
    const body = p.lines.map((l) => {
      const ind = l.length - l.trimStart().length;
      return ind >= p.contentIndent ? l.slice(p.contentIndent) : l.trimStart();
    });
    const cuerpo = normalizeMarkup([resto, ...body].join('\n'));
    return { n: p.n, titulo, complemento, cuerpo };
  });
}

/** Normalizes a markup block: list indentation to two spaces per level, one blank line between
 *  paragraphs, trailing spaces removed. Pipe tables pass through unchanged. */
export function normalizeMarkup(text) {
  const lines = String(text).split('\n');
  const out = [];
  const levels = []; // indentation stack of list markers
  let blank = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      blank = true;
      continue;
    }
    const m = LIST_ITEM_RE.exec(line);
    if (m && !line.trim().startsWith('|')) {
      const ind = m[1].length;
      while (levels.length && levels[levels.length - 1] > ind) levels.pop();
      if (!levels.length || levels[levels.length - 1] < ind) levels.push(ind);
      const depth = levels.length - 1;
      if (blank && out.length) out.push('');
      out.push('  '.repeat(depth) + m[2] + ' ' + m[3].trim());
    } else {
      const ind = line.length - line.trimStart().length;
      if (ind === 0 || !levels.length) levels.length = 0;
      if (blank && out.length) out.push('');
      out.push(line.trim());
    }
    blank = false;
  }
  return out.join('\n').trim();
}

/** Parses a quiz block: [{ n, pregunta, opciones, letra, respuesta, explicacion, raw }]. */
export function parseQuiz(lines) {
  const items = parseList(lines);
  return items.map((it) => {
    const raw = it.text;
    const m = /^(.*?)\s*\*\*Respuesta:\s*([a-d])\.?\*\*\s*(.*)$/.exec(raw);
    const qa = m ? m[1] : raw;
    const letra = m ? m[2] : '';
    const explicacion = m ? m[3].trim() : '';
    const firstOpt = qa.search(/(?:^|\s)a\)\s/);
    const pregunta = qa.slice(0, firstOpt).trim();
    const optText = qa.slice(firstOpt).trim();
    const opciones = optText
      .split(/(?:^|;\s*|\s+)(?=[a-d]\)\s)/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^[a-d]\)\s*/, '').replace(/[;.]$/, '').trim());
    return { n: it.n, pregunta, opciones, letra, respuesta: 'abcd'.indexOf(letra), explicacion, raw };
  });
}

/** Parses an agenda table into rows: [{ minutos, desde, hasta, bloque, recurso }]. */
export function parseAgenda(lines) {
  const t = parseTable(lines);
  if (!t) return [];
  return t.rows.map(([minutos, bloque, recurso]) => {
    const m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(minutos);
    return { minutos, desde: m ? Number(m[1]) : null, hasta: m ? Number(m[2]) : null, bloque, recurso };
  });
}

/** Splits a "Guion de diapositivas" bullet into { label, text }: "Idea central: «…»." ->
 *  { label: 'Idea central', text: '«…».' }. Bullets that introduce sub-items or carry no short
 *  label keep label ''. */
export function splitSlideBullet(text) {
  const m = /^([^:«»()[\]]{1,40}?)(\s«[^»]+»)?:(?:\s+(.*))?$/.exec(text.trim());
  if (m) return { label: (m[1] + (m[2] || '')).trim(), text: (m[3] || '').trim() };
  return { label: '', text: text.trim() };
}

/** Inverse of splitSlideBullet: the KB bullet text. */
export function joinSlideBullet({ label, text }) {
  if (!label) return text;
  return text ? label + ': ' + text : label + ':';
}

/** Parses a "Guion de diapositivas" block: [{ id, n, heading, titulo, bullets: [{ label, text, items }] }]. */
export function parseGuion(lines) {
  return parseList(lines).map((it) => {
    const m = /^\*\*D(\d+)\s*·\s*(.+?)\*\*\s*$/.exec(it.text);
    const n = m ? Number(m[1]) : null;
    const heading = m ? m[2].trim() : it.text;
    return {
      id: n ? 'd' + String(n).padStart(2, '0') : '',
      n,
      heading,
      titulo: heading.replace(/\.$/, ''),
      bullets: it.children.map((b) => ({ ...splitSlideBullet(b.text), items: b.children.map((c) => c.text) }))
    };
  });
}

/** Parses one session section (KB §4–§10). */
export function parseSession(lines, node) {
  const h = headingNumber(node.title);
  const mt = /^Sesión\s+(\d+)\s*·\s*(.*)$/.exec(h.title);
  const blocks = splitLabelBlocks(sectionBody(lines, node), node.line + 1);
  const s = {
    n: Number(mt[1]),
    kbSection: h.n,
    titulo: mt[2].trim(),
    tesis: '',
    diapositivas: '',
    producto: '',
    resultados: [],
    agenda: [],
    contenido: [],
    bloques: [],
    guion: [],
    errores: [],
    actividades: [],
    discusion: { label: '', items: [] },
    quiz: [],
    lecturas: [],
    otros: []
  };
  let bloqueContenido = '';
  let lastActividad = null;
  for (const b of blocks) {
    const label = b.label || '';
    if (label === 'Tesis') s.tesis = normalizeWS([b.rest, ...b.lines].join(' '));
    else if (label === 'Diapositivas') Object.assign(s, parseDiapositivasLine(b.rest));
    else if (label === 'Resultados de aprendizaje') s.resultados = listTexts(parseList(b.lines));
    else if (/^Agenda/.test(label)) {
      s.agendaTitulo = label;
      s.agenda = parseAgenda(b.lines);
    } else if (/^Contenido/.test(label)) {
      const sub = /^Contenido\s*·\s*(.*)$/.exec(label);
      bloqueContenido = sub ? sub[1].trim() : '';
      if (bloqueContenido) s.bloques.push(bloqueContenido);
      for (const p of parseContenido(b.lines)) s.contenido.push(bloqueContenido ? { ...p, bloque: bloqueContenido } : p);
    } else if (label === 'Guion de diapositivas') s.guion = parseGuion(b.lines);
    else if (label === 'Errores de lectura frecuentes') s.errores = listTexts(parseList(b.lines));
    else if (/^Actividad/.test(label)) {
      lastActividad = parseActividad(b);
      s.actividades.push(lastActividad);
    } else if (/^Discusión/.test(label)) s.discusion = { label, items: listTexts(parseList(b.lines)) };
    else if (label === 'Quiz') s.quiz = parseQuiz(b.lines);
    else if (label === 'Lecturas') s.lecturas = splitTopLevel(b.rest.replace(/\.$/, ''), ';');
    else if (label) s.otros.push(b);
  }
  return s;
}

/** Parses an activity block: { label, titulo, duracion, consigna, pasos, tabla, clave, lines }. */
export function parseActividad(block) {
  const label = block.label + (block.sep === '.' ? '' : '');
  const md = /^(.*?)(?:\s*\((\d+\s*min)\))?$/.exec(block.label);
  const lines = block.lines;
  // "Clave orientativa para el docente:" splits the trailing key list from the steps.
  const keyIdx = lines.findIndex((l) => /^Clave orientativa para el docente:/.test(l.trim()));
  const main = keyIdx >= 0 ? lines.slice(0, keyIdx) : lines;
  const keyLines = keyIdx >= 0 ? lines.slice(keyIdx + 1) : [];
  const listLines = main.filter((l) => !l.trim().startsWith('|'));
  const pasos = parseList(listLines).filter((it) => !it.paragraph).map((it) => it.text);
  const tables = findTables(main);
  return {
    label,
    titulo: md[1].trim(),
    duracion: md[2] || '',
    consigna: block.rest,
    pasos,
    tabla: tables[0] || null,
    clave: keyIdx >= 0 ? { titulo: lines[keyIdx].trim().replace(/:$/, ''), items: listTexts(parseList(keyLines)) } : null
  };
}

/** Parses the KB §13 tables into [{ heading, tema, prefix, rows: [{ id, cifra, alcance, alcanceCompleto?,
 *  tipo, fuente, citas, fuentes, estado }] }], resolving "Ídem" alcances. */
export function parseBanco(lines, node, prefixes = DEFAULT_PREFIXES) {
  const groups = [];
  for (const child of node.children) {
    const table = parseTable(sectionBody(lines, child));
    const prefix = prefixes[child.title] || slug(child.title).split('-')[0];
    groups.push({
      heading: child.title,
      prefix,
      rows: table.rows.map((cells, i) => {
        const [cifra, alcance, tipo, fuente, estado] = cells;
        const citas = parseCitations(fuente);
        return {
          id: prefix + '-' + (i + 1),
          cifra,
          alcance,
          tipo,
          fuente,
          citas,
          fuentes: citas.map((c) => c.key),
          estado,
          line: child.line
        };
      })
    });
  }
  resolveIdem(groups);
  return groups;
}

/** KB §13 heading -> id prefix (prompt §5.4). */
export const DEFAULT_PREFIXES = {
  'Adopción y valor': 'adop',
  'Capacidad técnica': 'cap',
  'Economía e infraestructura': 'eco',
  'Productividad': 'prod',
  'Trabajo': 'trab',
  'Educación': 'edu',
  'Ciencia': 'cien',
  'Medicina': 'med',
  'Riesgo y regulación': 'ries',
  'América Latina y Colombia': 'alc'
};

/**
 * Resolves "Ídem" alcances in place (prompt §5.4): "Ídem" is the alcance of the nearest earlier row from
 * the same source (first citation key); "Ídem X" (e.g. "Ídem DEC") is the nearest earlier row whose
 * source key or label matches X. Searches the same heading first, then earlier headings. Chains of
 * "Ídem" resolve to the first concrete alcance. Sets `alcanceCompleto` on each resolved row.
 */
export function resolveIdem(groups) {
  const all = groups.flatMap((g) => g.rows.map((r) => ({ r, g })));
  all.forEach(({ r }, idx) => {
    const m = /^Ídem(?:\s+(.+))?$/.exec(r.alcance.trim());
    if (!m) return;
    const qualifier = m[1] ? fold(m[1]) : '';
    const sameSource = (o) =>
      qualifier
        ? o.citas.some((c) => fold(c.key) === qualifier || fold(c.label).startsWith(qualifier))
        : o.fuentes[0] === r.fuentes[0];
    let resolved = '';
    for (let j = idx - 1; j >= 0; j--) {
      const o = all[j].r;
      if (!sameSource(o)) continue;
      resolved = o.alcanceCompleto || o.alcance;
      if (!/^Ídem/.test(resolved)) break;
      resolved = '';
    }
    if (resolved) r.alcanceCompleto = resolved;
  });
  return groups;
}

/** Parses the whole KB: { lines, tree, linkDefs, meta, s0, s1, s2, s3, sesiones, s11, s12, banco,
 *  estados, s14, s15, s16 }. */
export function parseKB(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const tree = headingTree(lines);
  const top = (n) => findHeading(tree, (h) => h.level === 2 && (headingNumber(h.title) || {}).n === n);
  const kb = { text, lines, tree, linkDefs: parseLinkDefs(text) };

  // Front matter: "## Base de conocimiento del curso" with its "- **Versión:** …" list.
  const front = tree[0];
  const meta = {};
  for (const it of parseList(sectionBody(lines, front).filter((l) => /^\s*-\s/.test(l)))) {
    const m = /^\*\*(.+?):\*\*\s*(.*)$/.exec(it.text);
    if (m) meta[m[1]] = m[2].trim();
  }
  kb.meta = meta;

  // §0 Instrucciones para el agente.
  const n0 = top(0);
  kb.s0 = { title: headingNumber(n0.title).title, body: trimBlank(sectionBody(lines, n0)).filter((l) => l.trim() !== '---') };
  kb.s0.text = trimBlank(kb.s0.body).join('\n');
  kb.s0.blocks = splitLabelBlocks(kb.s0.body);

  // §1 Ficha del curso.
  const n1 = top(1);
  kb.s1 = { title: headingNumber(n1.title).title, blocks: splitLabelBlocks(stripRule(sectionBody(lines, n1))) };

  // §2 Mapa del curso.
  const n2 = top(2);
  const b2 = stripRule(sectionBody(lines, n2));
  kb.s2 = {
    title: headingNumber(n2.title).title,
    table: parseTable(b2),
    trabajoAutonomo: nonBlank(b2).filter((l) => !l.trim().startsWith('|')).join(' ').trim()
  };

  // §3 Marco transversal, with its ### subsections.
  const n3 = top(3);
  kb.s3 = { title: headingNumber(n3.title).title, subs: {} };
  for (const c of n3.children) {
    const hn = /^(\d+\.\d+)\s+(.*)$/.exec(c.title);
    const body = stripRule(sectionBody(lines, c));
    kb.s3.subs[hn[1]] = { title: hn[2], body, blocks: splitLabelBlocks(body), tables: findTables(body) };
  }

  // §4–§10 Sesiones.
  kb.sesiones = {};
  for (let k = 4; k <= 10; k++) {
    const node = top(k);
    const s = parseSession(lines, node);
    kb.sesiones[s.n] = s;
  }

  // §11 Evaluación y proyecto final.
  const n11 = top(11);
  const b11 = stripRule(sectionBody(lines, n11));
  kb.s11 = { title: headingNumber(n11.title).title, blocks: splitLabelBlocks(b11), tables: findTables(b11) };

  // §12 Glosario.
  const n12 = top(12);
  kb.s12 = { title: headingNumber(n12.title).title, table: parseTable(sectionBody(lines, n12)) };

  // §13 Banco de cifras.
  const n13 = top(13);
  kb.estados = parseList(sectionBody(lines, n13, { own: true }).filter((l) => /^\s*-\s/.test(l))).map((it) => {
    const m = /^\*\*(.+?):\*\*\s*(.*)$/.exec(it.text);
    return { label: m[1], texto: m[2] };
  });
  kb.estadosTitulo = 'Estado de cada cifra';
  kb.banco = parseBanco(lines, n13);
  kb.s13 = { title: headingNumber(n13.title).title };

  // §14 Correcciones y actualizaciones.
  const n14 = top(14);
  const corr = n14.children[0];
  const upd = n14.children[1];
  kb.s14 = {
    title: headingNumber(n14.title).title,
    correccionesTitulo: corr.title,
    correcciones: parseTable(sectionBody(lines, corr)),
    actualizacionesTitulo: upd.title,
    actualizaciones: parseList(stripRule(sectionBody(lines, upd))).map((it) => {
      const m = /^\*\*(.+?):\*\*\s*(.*)$/.exec(it.text);
      return { titulo: m[1], texto: m[2] };
    })
  };

  // §15 Preguntas frecuentes.
  const n15 = top(15);
  kb.s15 = { title: headingNumber(n15.title).title, items: [] };
  for (const b of splitLabelBlocks(stripRule(sectionBody(lines, n15)))) {
    if (!b.label) continue;
    const m = /^(\d+)\.\s+(.*)$/.exec(b.label + b.sep);
    kb.s15.items.push({ n: Number(m[1]), pregunta: m[2].trim(), respuesta: normalizeWS(b.lines.join(' ')) });
  }

  // §16 Referencias (groups of bullets; link definitions are parsed into kb.linkDefs).
  const n16 = top(16);
  const b16 = sectionBody(lines, n16).filter((l) => !/^\[[^\]]+\]:\s/.test(l));
  kb.s16 = {
    title: headingNumber(n16.title).title,
    grupos: splitLabelBlocks(b16)
      .filter((b) => b.label)
      .map((b) => ({ grupo: b.label, items: listTexts(parseList(b.lines)) }))
  };
  return kb;
}

function trimBlank(lines) {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
}

function stripRule(lines) {
  return trimBlank(lines.filter((l) => l.trim() !== '---'));
}

/** Every bullet of KB §16 with the link keys it holds: [{ grupo, item, citas }]. */
export function referenceItems(kb) {
  const out = [];
  for (const g of kb.s16.grupos) for (const item of g.items) out.push({ grupo: g.grupo, item, citas: parseCitations(item) });
  return out;
}

/** Plain text of the whole KB (citations removed, emphasis removed, list markers removed), for
 *  "does this sentence exist in the KB" checks. */
export function kbPlain(kb, { keepCitationLabels = false } = {}) {
  return normalizeWS(
    kb.lines
      .filter((l) => !/^\[[^\]]+\]:\s/.test(l) && !/^\|?\s*-{3,}/.test(l.trim()))
      .map((l) => l.replace(LIST_ITEM_RE, '$3').replace(/^#{1,6}\s+/, ''))
      .map((l) => plainText(l, { keepCitationLabels }))
      .join(' ')
  );
}
