/* tools/lib/normalize-es.mjs — Spanish display text -> speakable text (prompt §8.4).
 *
 * Dev-only (Node >= 20, built-ins only). Subtitles keep the figures exactly as the KB writes them
 * ("66,3%", "344.700 millones", "2026–2028", "4.º"); the voice says them in words. This module turns
 * one display string (a subtitle chunk or a whole line) into the plain text a Spanish voice reads.
 * The result is plain text, never markup: Edge TTS accepts no say-as, sub or phoneme tags.
 *
 *   import { normalize, analyze, numberToWords, LEXICON } from './lib/normalize-es.mjs';
 *   normalize('El 88% usa IA')          -> 'El ochenta y ocho por ciento usa i a'
 *   analyze(text, opts)                 -> { text, terms: [{ kind, display, spoken }], warnings: [{ code, match, message }] }
 *   numberToWords(21, { gender: 'f' })  -> 'veintiuna'      ({ apocope: true } -> 'veintiún')
 *
 *   opts.lexicon   overrides of LEXICON (tools/voice.config.json "lexicon"): a string replaces or adds
 *                  an entry, null removes it.
 *
 * `terms` lists what a listener should audit (tools/check-voiceover.mjs): kind 'lexicon',
 * 'abbreviation', 'number', 'year', 'date', 'ordinal', 'fraction', 'roman', or 'acronym' (capitals the
 * voice reads on its own, e.g. UNESCO). `warnings`: 'needs-say' (an a/b other than 1/3, 2/3, 1/2: the
 * line needs an explicit `say`), 'pause-marker' (a stray "(pausa N s)"; use the line's `pause`),
 * 'digits' (digits glued to a name, such as "G20", left for the voice), 'symbol' (a sign the voice may
 * read oddly).
 *
 * Passes, in order: pause markers; quotes and ellipses; lexicon; abbreviations; dashes and hyphens next
 * to words; Roman numerals after "anexo", "capítulo"…; ordinals; dates; signs before numbers;
 * fractions; numbers (thousands ".", decimal ",", versions, %, ×, ranges, years, gender); tidy-up.
 */

// -------------------------------------------------------------------------------------------------
// Lexicon (prompt §8.4 starting proposals). Keys with capitals match with their exact case; lowercase
// keys match in any case, plural included ("Benchmarks" -> "bénchmarks").

export const LEXICON = Object.freeze({
  EBIT: 'ébit',
  API: 'a pe i',
  OIT: 'o i te',
  FDA: 'efe de a',
  CONPES: 'cónpes',
  ILIA: 'ilia',
  CEPAL: 'cepal',
  CENIA: 'cenia',
  METR: 'méter',
  McKinsey: 'mackínsi',
  PwC: 'pe doble ve ce',
  'AI Index': 'ei ai índex',
  OSWorld: 'ou es uórld',
  'Terminal-Bench': 'términal bench',
  GPQA: 'ge pe cu a',
  MMMU: 'eme eme eme u',
  'SWE-bench': 'suí bench',
  PaperArena: 'péiper arena',
  ChemBench: 'kem bench',
  'AI Incident Database': 'ei ai íncident déitabeis',
  'Digital Education Council': 'díyital ediukéishon cáunsil',
  xAI: 'equis a i',
  OpenAI: 'open ei ai',
  DeepSeek: 'dipsík',
  Anthropic: 'anzrópic',
  MiniMax: 'mini max',
  'Z.ai': 'zeta a i',
  Gemini: 'yémini',
  'Sharp HealthCare': 'sharp jélzker',
  'reward hacking': 'riuórd jáking',
  deepfakes: 'dipféiks',
  sandbox: 'sándbox',
  benchmark: 'bénchmark'
});

// -------------------------------------------------------------------------------------------------
// Cardinals

const SMALL = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
  'setecientos', 'ochocientos', 'novecientos'];

// Forms of a final "uno" and of the hundreds:
//   FULL     uno, veintiuno, doscientos   a number said on its own, before "de", "%", "coma"…
//   APOCOPE  un, veintiún, doscientos     before a masculine noun, "mil" or "millones"
//   FEM      una, veintiuna, doscientas   before a feminine noun
const FULL = 'full';
const APOCOPE = 'apocope';
const FEM = 'fem';

function oneWord(n, form) { // n is 1 or 21
  if (n === 1) return form === FEM ? 'una' : form === APOCOPE ? 'un' : 'uno';
  return form === FEM ? 'veintiuna' : form === APOCOPE ? 'veintiún' : 'veintiuno';
}

function below100(n, form) {
  if (n === 1 || n === 21) return oneWord(n, form);
  if (n < 30) return SMALL[n];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (!unit) return TENS[tens];
  return TENS[tens] + ' y ' + (unit === 1 ? oneWord(1, form) : SMALL[unit]);
}

function below1000(n, form) {
  if (n === 100) return 'cien';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundreds) parts.push(form === FEM && hundreds > 1 ? HUNDREDS[hundreds].replace(/os$/, 'as') : HUNDREDS[hundreds]);
  if (rest) parts.push(below100(rest, form));
  return parts.join(' ');
}

// Below a million. Before "mil" a masculine or neutral number takes the apocope ("veintiún mil") and a
// feminine one agrees ("doscientas mil personas").
function belowMillion(n, form) {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts = [];
  if (thousands) parts.push(thousands === 1 ? 'mil' : below1000(thousands, form === FEM ? FEM : APOCOPE) + ' mil');
  if (rest) parts.push(below1000(rest, form));
  return parts.join(' ');
}

// "millón" and "billón" are masculine nouns: the count before them is always masculine.
function cardinal(n, form) {
  if (n === 0) return 'cero';
  const billions = Math.floor(n / 1e12);
  const millions = Math.floor((n % 1e12) / 1e6);
  const rest = n % 1e6;
  const parts = [];
  if (billions) parts.push(billions === 1 ? 'un billón' : belowMillion(billions, APOCOPE) + ' billones');
  if (millions) parts.push(millions === 1 ? 'un millón' : belowMillion(millions, APOCOPE) + ' millones');
  if (rest) parts.push(belowMillion(rest, form));
  return parts.join(' ');
}

/**
 * Spanish cardinal words for an integer 0 <= n < 10^15.
 * @param {number} n
 * @param {{ gender?: 'm' | 'f', apocope?: boolean }} [opts]  gender 'f' -> una, doscientas; apocope -> un, veintiún
 */
export function numberToWords(n, opts = {}) {
  if (!Number.isSafeInteger(n) || n < 0 || n >= 1e15) throw new RangeError('numberToWords: unsupported number ' + n);
  return cardinal(n, opts.gender === 'f' ? FEM : opts.apocope ? APOCOPE : FULL);
}

// Decimal digits keep their leading zeros ("08" -> "cero ocho"); long tails are read digit by digit.
function decimalWords(digits) {
  const zeros = /^0*/.exec(digits)[0].length;
  const rest = digits.slice(zeros);
  const words = new Array(zeros).fill('cero');
  if (rest.length > 3) for (const d of rest) words.push(SMALL[Number(d)]);
  else if (rest) words.push(cardinal(Number(rest), FULL));
  return words.join(' ');
}

// -------------------------------------------------------------------------------------------------
// Ordinals

const ORDINALS = ['', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno',
  'décimo', 'undécimo', 'duodécimo', 'decimotercero', 'decimocuarto', 'decimoquinto', 'decimosexto',
  'decimoséptimo', 'decimoctavo', 'decimonoveno', 'vigésimo'];

/** Ordinal words for 1-20 ("cuarto", "cuarta", "primer" with apocope), or null. */
export function ordinalWords(n, { gender = 'm', apocope = false } = {}) {
  const word = ORDINALS[n];
  if (!word) return null;
  if (gender === 'f') return word.replace(/o$/, 'a');
  return apocope ? word.replace(/(prim|terc)ero$/, '$1er') : word;
}

// -------------------------------------------------------------------------------------------------
// Gender of the word after a number

// Words that are not the noun a number counts: "21 de 30", "1 en 5", "41, y…".
const NOT_NOUNS = new Set((
  'a al ante bajo con contra de del desde durante en entre hacia hasta mediante para por según segun sin ' +
  'sobre tras versus vs el la los las lo un una unos unas y e o u ni que pero sino aunque porque pues como ' +
  'si cuando donde mientras más mas menos muy ya aún aun también tampoco solo sólo casi cerca apenas hoy no ' +
  'sí mucho poco bien mal así antes después luego todavía siempre nunca aproximadamente se le les me te nos ' +
  'su sus mi mis tu tus este esta estos estas ese esa esos esas es son fue fueron era eran será serán está ' +
  'están ha han hay había tiene tienen tuvo puede pueden'
).split(' '));

const FEMININE_WORDS = new Set((
  'vez veces red redes ley leyes mujer mujeres imagen imágenes fuente fuentes parte partes clase clases base ' +
  'bases noche noches frase frases llave llaves calle calles mente mentes muerte muertes suerte suertes torre ' +
  'torres nave naves flor flores sede sedes serie series especie especies superficie superficies nube nubes ' +
  'costumbre costumbres cumbre cumbres gente fase fases clave claves carne carnes mano manos foto fotos moto ' +
  'motos tesis crisis dosis síntesis hipótesis cruz cruces voz voces luz luces paz nariz raíz raíces matriz ' +
  'matrices actriz actrices piel pieles cárcel cárceles'
).split(' '));

const MASCULINE_WORDS = new Set((
  'día días mapa mapas problema problemas sistema sistemas programa programas tema temas idioma idiomas clima ' +
  'climas planeta planetas poema poemas esquema esquemas dilema dilemas teorema teoremas síntoma síntomas ' +
  'diploma diplomas drama dramas panorama panoramas diagrama diagramas paradigma paradigmas camión camiones ' +
  'avión aviones sofá sofás papá papás tranvía tranvías mediodía cometa cometas pie pies análisis énfasis ' +
  'paréntesis oasis'
).split(' '));

function isFeminine(word) {
  if (FEMININE_WORDS.has(word)) return true;
  if (MASCULINE_WORDS.has(word)) return false;
  if (/istas?$/.test(word)) return false; // epicene "especialistas": generic masculine
  return /(?:a|as|ión|iones|dad|dades|tad|tades|tud|tudes|umbre|umbres|ie|ies|sis|itis|triz|trices)$/.test(word);
}

// The form of a number from the text that follows it (only a word right after it counts).
function formForNext(after) {
  const m = /^[ \t ]*(\p{L}+)(?:[ \t ]+(\p{L}+))?/u.exec(after);
  if (!m) return FULL;
  const word = m[1].toLowerCase();
  if (word === 'millón' || word === 'millones' || word === 'billón' || word === 'billones') return APOCOPE;
  if (word === 'mil') return m[2] && isFeminine(m[2].toLowerCase()) ? FEM : APOCOPE;
  if (NOT_NOUNS.has(word)) return FULL;
  return isFeminine(word) ? FEM : APOCOPE;
}

function lastWord(before) {
  const m = /(\p{L}+)[ \t ]+$/u.exec(before);
  return m ? m[1].toLowerCase() : '';
}

// -------------------------------------------------------------------------------------------------
// Helpers

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// An abbreviation's final period doubles as the sentence period only before a new sentence.
function sentenceDot(string, end) {
  return /^\s+\p{Lu}/u.test(string.slice(end)) ? '.' : '';
}

function romanValue(s) {
  if (!/^(?=[IVXLC])C{0,3}(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/.test(s)) return 0;
  const value = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const a = value[s[i]];
    const b = value[s[i + 1]] || 0;
    total += a < b ? -a : a;
  }
  return total;
}

const isYear = (s) => /^(?:19|20)\d\d$/.test(s);

// One number as written in the KB: "1.993", "344.700", "66,3", "0,4", "2.0" (a version).
function speakNumber(s, form) {
  if (s.includes('.') && !s.includes(',') && !/^\d{1,3}(?:\.\d{3})+$/.test(s)) {
    const [first, ...rest] = s.split('.');
    return [cardinal(Number(first), FULL), ...rest.map(decimalWords)].join(' punto ');
  }
  const [int, dec] = s.split(',');
  const n = Number(int.replace(/\./g, ''));
  if (dec != null) return cardinal(n, FULL) + ' coma ' + decimalWords(dec);
  return cardinal(n, isYear(s) ? FULL : form);
}

const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

// A KB-format number: thousands "." groups (with an optional decimal ","), a version "2.5", or an
// integer with an optional decimal ",".
const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?!\d)(?:,\d+)?|\d+\.\d+(?:\.\d+)*|\d+(?:,\d+)?`;
const NUMBER_RE = new RegExp(
  String.raw`(?<![\p{L}\p{N}.,])(${NUM})([  ]?%)?(?:([  ]?[–-][  ]?)(${NUM})([  ]?%)?)?(×)?(?![\p{L}\p{N}])`,
  'gu'
);

const FRACTIONS = { '1/3': 'un tercio', '2/3': 'dos tercios', '1/2': 'un medio' };

const ROMAN_TRIGGERS = 'anexos?|cap[íi]tulos?|t[íi]tulos?|art[íi]culos?|fases?|partes?|siglos?|tomos?|' +
  'vol[úu]men(?:es)?|libros?|niveles?|grupos?|tipos?';

// -------------------------------------------------------------------------------------------------
// Passes

function lexiconPass(text, lexicon, addTerm) {
  const entries = Object.entries(lexicon).filter(([key, value]) => key && typeof value === 'string');
  const byLength = (a, b) => b[0].length - a[0].length;
  const exact = entries.filter(([key]) => /\p{Lu}/u.test(key)).sort(byLength);
  const loose = entries.filter(([key]) => !/\p{Lu}/u.test(key)).sort(byLength);
  if (exact.length) {
    const map = new Map(exact);
    const re = new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${exact.map(([k]) => escapeRe(k)).join('|')})(?![\p{L}\p{N}])`, 'gu');
    text = text.replace(re, (match) => {
      const spoken = map.get(match);
      addTerm('lexicon', match, spoken);
      return spoken;
    });
  }
  if (loose.length) {
    const map = new Map(loose.map(([key, value]) => [key.toLowerCase(), value]));
    const re = new RegExp(String.raw`(?<![\p{L}\p{N}])(${loose.map(([k]) => escapeRe(k)).join('|')})(s|es)?(?![\p{L}\p{N}])`, 'giu');
    text = text.replace(re, (match, key, plural) => {
      const spoken = map.get(key.toLowerCase()) + (plural || '');
      addTerm('lexicon', match, spoken);
      return spoken;
    });
  }
  return text;
}

function abbreviationPass(text, addTerm) {
  const rules = [
    [/(?<![\p{L}\p{N}])EE\.\s?UU\./gu, (m, at, s) => 'Estados Unidos' + sentenceDot(s, at + m.length)],
    [/(?<![\p{L}\p{N}])etc\./gu, (m, at, s) => 'etcétera' + sentenceDot(s, at + m.length)],
    [/(?<![\p{L}\p{N}])I\+D\+i(?![\p{L}\p{N}])/gu, () => 'investigación, desarrollo e innovación'],
    [/(?<![\p{L}\p{N}])I\+D(?![\p{L}\p{N}+])/gu, () => 'investigación y desarrollo'],
    [/(?<![\p{L}\p{N}])UE(?![\p{L}\p{N}])/gu, () => 'Unión Europea'],
    [/(?<![\p{L}\p{N}])IA(?![\p{L}\p{N}])/gu, () => 'i a']
  ];
  for (const [re, speak] of rules) {
    text = text.replace(re, (match, at, string) => {
      const spoken = speak(match, at, string);
      addTerm('abbreviation', match, spoken.replace(/\.$/, ''));
      return spoken;
    });
  }
  // Gigawatts: singular only after exactly "1".
  text = text.replace(/(?<![\p{L}\p{N}.,])(\d+(?:[.,]\d+)*)[  ]?GW(?![\p{L}\p{N}])/gu, (match, num) => {
    const unit = num === '1' ? 'gigavatio' : 'gigavatios';
    addTerm('abbreviation', 'GW', unit);
    return num + ' ' + unit;
  });
  return text.replace(/(?<![\p{L}\p{N}])GW(?![\p{L}\p{N}])/gu, () => {
    addTerm('abbreviation', 'GW', 'gigavatios');
    return 'gigavatios';
  });
}

function numberPass(text, addTerm) {
  return text.replace(NUMBER_RE, (match, a, pa, dash, b, pb, times, offset, string) => {
    const after = string.slice(offset + match.length);
    const form = pa || pb ? FULL : times ? FEM : formForNext(after);
    let spoken;
    try {
      if (b) {
        const A = speakNumber(a, form) + (pa ? ' por ciento' : '');
        const B = speakNumber(b, form) + (pb ? ' por ciento' : '');
        const prev = lastWord(string.slice(0, offset));
        if (prev === 'entre') spoken = A + ' y ' + B;
        else if (prev === 'de') spoken = A + ' a ' + B;
        else if (prev === 'del') spoken = A + ' al ' + B;
        else if (prev === 'desde') spoken = A + ' hasta ' + B;
        else if (!pa && !pb && isYear(a) && isYear(b)) spoken = A + ' a ' + B;
        else spoken = 'de ' + A + ' a ' + B;
      } else {
        spoken = speakNumber(a, form) + (pa ? ' por ciento' : '');
      }
    } catch {
      return match; // beyond numberToWords: left as digits (reported by the 'digits' warning)
    }
    if (times) spoken += !b && a === '1' ? ' vez' : ' veces';
    const year = !pa && !pb && !times && isYear(a) && (!b || isYear(b));
    addTerm(year ? 'year' : 'number', match.trim(), spoken);
    return spoken;
  });
}

// -------------------------------------------------------------------------------------------------
// Public API

/**
 * Normalizes one display string and reports what it changed.
 * @param {string} input
 * @param {{ lexicon?: Record<string, string | null> }} [opts]
 * @returns {{ text: string, terms: { kind: string, display: string, spoken: string }[],
 *             warnings: { code: string, match: string, message: string }[] }}
 */
export function analyze(input, opts = {}) {
  const terms = [];
  const warnings = [];
  const seen = new Set();
  const addTerm = (kind, display, spoken) => {
    const key = kind + '\u0000' + display + '\u0000' + spoken;
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({ kind, display, spoken });
  };
  const warn = (code, match, message) => warnings.push({ code, match, message });

  const lexicon = { ...LEXICON };
  for (const [key, value] of Object.entries(opts.lexicon || {})) {
    if (value === null) delete lexicon[key];
    else if (typeof value === 'string') lexicon[key] = value;
  }

  let text = String(input == null ? '' : input);

  // 1. Stray pause markers: silence belongs in the line's `pause` field.
  text = text.replace(/\s*\((?:pausa|pause)\s+\d+(?:[.,]\d+)?\s*(?:s|seg|segundos?)\)/giu, (match) => {
    warn('pause-marker', match.trim(), 'pause marker removed from the spoken text; use the line `pause` field');
    return '';
  });

  // 2. Quotes are not spoken; "..." is the ellipsis, a short pause.
  text = text.replace(/[«»“”„‟"]/gu, '').replace(/(?<!\p{L})[‘’]|[‘’](?!\p{L})/gu, '');
  text = text.replace(/\.{3}/g, '…');

  // 3. Lexicon, then 4. abbreviations.
  text = lexiconPass(text, lexicon, addTerm);
  text = abbreviationPass(text, addTerm);

  // 5. Dashes between words ("humano–IA") and hyphens between a name and digits ("COVID-19").
  text = text.replace(/(\p{L})[–—](?=\p{L})/gu, '$1 ');
  text = text.replace(/(\p{L})-(?=\d)/gu, '$1 ').replace(/(\d)-(?=\p{L})/gu, '$1 ');

  // 6. Roman numerals after "anexo", "capítulo", "siglo"…
  text = text.replace(new RegExp(String.raw`(?<![\p{L}])(${ROMAN_TRIGGERS})[  ]+([IVXLC]{1,7})(?![\p{L}\p{N}])`, 'giu'),
    (match, word, roman) => {
      const value = /^[IVXLC]+$/.test(roman) ? romanValue(roman) : 0;
      if (!value) return match;
      const spoken = cardinal(value, FULL);
      addTerm('roman', roman, spoken);
      return word + ' ' + spoken;
    });

  // 7. Ordinals: "4.º" -> cuarto, "4.ª" -> cuarta, "1.er" -> primer.
  text = text.replace(/(?<![\p{L}\p{N}.,])(\d{1,2})\.?(?:([º°])|(ª)|(er)(?!\p{L}))/gu, (match, num, masc, fem, er, offset, string) => {
    const n = Number(num);
    const after = string.slice(offset + match.length);
    const spoken = ordinalWords(n, { gender: fem ? 'f' : 'm', apocope: Boolean(er) || (masc && formForNext(after) === APOCOPE) });
    if (!spoken) return match;
    addTerm('ordinal', match, spoken);
    return spoken;
  });

  // 8. Dates: "1 de agosto" -> primero de agosto, "2 de agosto" -> dos de agosto.
  text = text.replace(new RegExp(String.raw`(?<![\p{L}\p{N}.,])(\d{1,2})(?=[  ]+de[  ]+(${MONTHS})(?!\p{L}))`, 'giu'),
    (match, day, month) => {
      const n = Number(day);
      if (n < 1 || n > 31) return match;
      const spoken = n === 1 ? 'primero' : cardinal(n, FULL);
      addTerm('date', day + ' de ' + month, spoken + ' de ' + month);
      return spoken;
    });

  // 9. Signs before numbers.
  text = text
    .replace(/(?<![\p{L}\p{N}])~[  ]?(?=\d)/gu, 'cerca de ')
    .replace(/(?<![\p{L}\p{N}])≈[  ]?(?=\d)/gu, 'aproximadamente ')
    .replace(/(?<![\p{L}\p{N}])<[  ]?(?=\d)/gu, 'menos de ')
    .replace(/(?<![\p{L}\p{N}])>[  ]?(?=\d)/gu, 'más de ')
    .replace(/(^|[\s([¿¡])\+(?=\d)/gu, '$1más ')
    .replace(/(^|[\s([¿¡])[−-](?=\d)/gu, '$1menos ')
    .replace(/(\d)[  ]+×[  ]+(?=\d)/gu, '$1 por ');

  // 10. Fractions: only 1/3, 2/3 and 1/2 are read as fractions.
  text = text.replace(/(?<![\p{L}\p{N}.,/])(\d+)\/(\d+)(?![\p{L}\p{N}/])/gu, (match, a, b) => {
    if (FRACTIONS[match]) {
      addTerm('fraction', match, FRACTIONS[match]);
      return FRACTIONS[match];
    }
    warn('needs-say', match, `"${match}" is not read as a fraction; give the line an explicit \`say\``);
    try {
      return cardinal(Number(a), FULL) + ' barra ' + cardinal(Number(b), FULL);
    } catch {
      return match;
    }
  });

  // 11. Numbers, percentages, ranges and years.
  text = numberPass(text, addTerm);

  // 12. Tidy-up.
  text = text
    .replace(/%/g, ' por ciento')
    .replace(/×/g, ' por ')
    .replace(/[ \t \r\n]+/g, ' ')
    .replace(/ ([,.;:?!…)\]])/g, '$1')
    .replace(/([([¿¡]) /g, '$1')
    .replace(/([?!])\.+/g, '$1')
    .replace(/,{2,}/g, ',')
    .trim();

  for (const m of text.matchAll(/(?<![\p{L}\p{N}])\p{Lu}{2,}(?![\p{L}\p{N}])/gu)) addTerm('acronym', m[0], m[0]);
  for (const m of text.matchAll(/\S*\d\S*/gu)) {
    warn('digits', m[0], `"${m[0]}" keeps its digits; the voice reads them on its own`);
  }
  for (const m of text.matchAll(/[^\p{L}\p{N}\s.,;:¿?¡!…()'’\-–—]/gu)) {
    warn('symbol', m[0], `"${m[0]}" may be read oddly; rewrite it or give the line a \`say\``);
  }
  return { text, terms, warnings };
}

/** The speakable text of one display string (see analyze()). */
export function normalize(input, opts) {
  return analyze(input, opts).text;
}

/** Spoken words in a normalized text (dry-run duration estimates). */
export function countWords(spoken) {
  return (String(spoken == null ? '' : spoken).match(/[\p{L}\p{N}]+/gu) || []).length;
}
