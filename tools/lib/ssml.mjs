/* tools/lib/ssml.mjs — SSML for the two speech engines of the voice-over tools (prompt §8.3 step 3).
 *
 * Dev-only (Node >= 20, built-ins only).
 *
 *   edgeSsml({ voice, text, rate, pitch, volume })
 *       The only shape the Edge read-aloud endpoint accepts: <speak><voice><prosody>escaped text
 *       </prosody></voice></speak>, with no bookmarks, breaks, say-as or sub. The edge-tts package
 *       builds this document itself from (text, voice, rate, pitch, volume); the tools build the same
 *       string to key the clip cache, so any change of text, voice or prosody makes a new clip.
 *   azureSsml({ voice, chunks, rate, pitch, style, lang, breakMs })
 *       Azure AI Speech (optional engine): the line's subtitle chunks separated by
 *       <bookmark mark="c1"/>, <bookmark mark="c2"/>… (bookmark "cN" marks the start of chunk N, so its
 *       audio offset is that chunk's start), ellipses as short <break>s, optional mstts style.
 *   escapeXml(text)          & < > " '
 *   signedPercent('0%')      '+0%'  (Edge needs an explicit sign and whole numbers)
 *   signedHz('0Hz')          '+0Hz'
 */

export const BOOKMARK_PREFIX = 'c';

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export function escapeXml(text) {
  return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

function signed(value, unit, name) {
  if (value == null || value === '') return '+0' + unit;
  const re = new RegExp(String.raw`^\s*([+\-−]?)\s*(\d+(?:[.,]\d+)?)\s*${unit}\s*$`, 'i');
  const m = re.exec(String(value));
  if (!m) throw new TypeError(`ssml: invalid ${name} "${value}" (expected e.g. "-5${unit}")`);
  const amount = Math.round(Number(m[2].replace(',', '.')));
  return (m[1] && m[1] !== '+' && amount !== 0 ? '-' : '+') + amount + unit;
}

/** '0%' -> '+0%', '-5%' / '−5%' -> '-5%', '+10%' -> '+10%'. */
export function signedPercent(value) {
  return signed(value, '%', 'rate');
}

/** '0Hz' -> '+0Hz', '-2Hz' -> '-2Hz'. */
export function signedHz(value) {
  return signed(value, 'Hz', 'pitch');
}

/**
 * The SSML document the Edge endpoint receives for one line (plain voice + prosody).
 * @param {{ voice: string, text: string, rate?: string, pitch?: string, volume?: string }} opts
 */
export function edgeSsml({ voice, text, rate, pitch, volume }) {
  if (!voice) throw new TypeError('ssml: a voice name is required');
  return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es-MX'>" +
    `<voice name='${escapeXml(voice)}'>` +
    `<prosody pitch='${signedHz(pitch)}' rate='${signedPercent(rate)}' volume='${signedPercent(volume)}'>` +
    escapeXml(text) +
    '</prosody></voice></speak>';
}

/**
 * The Azure SSML document for one line: chunks separated by bookmarks c1, c2… (chunk 0 starts at 0).
 * @param {{ voice: string, chunks: string[], rate?: string, pitch?: string, style?: string,
 *           lang?: string, breakMs?: number }} opts
 */
export function azureSsml({ voice, chunks, rate = '0%', pitch = '0%', style = '', lang = 'es-MX', breakMs = 250 }) {
  if (!voice) throw new TypeError('ssml: a voice name is required');
  const body = (chunks || []).map((chunk, i) => {
    const text = escapeXml(String(chunk).trim()).replace(/…/g, `<break time="${breakMs}ms"/>`);
    return (i > 0 ? `<bookmark mark="${BOOKMARK_PREFIX}${i}"/>` : '') + text;
  }).join(' ');
  const prosody = `<prosody rate="${escapeXml(rate)}" pitch="${escapeXml(pitch)}">${body}</prosody>`;
  const inner = style ? `<mstts:express-as style="${escapeXml(style)}">${prosody}</mstts:express-as>` : prosody;
  return '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ' +
    `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${escapeXml(lang)}">` +
    `<voice name="${escapeXml(voice)}">${inner}</voice></speak>`;
}
