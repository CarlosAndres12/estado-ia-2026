/* tools/lib/align.mjs — subtitle chunk times from word boundaries (prompt §6.4, §8.3 step 4).
 *
 * Dev-only (Node >= 20, built-ins only). Edge TTS cannot place SSML bookmarks, so the start of each
 * subtitle chunk inside a line's clip comes from the WordBoundary events the voice reports: the words
 * the voice said are aligned with the words of the chunks' speakable text, and each chunk starts where
 * its first aligned word starts.
 *
 *   alignChunks(chunks, words, { duration })
 *     chunks    speakable text of each subtitle chunk of the line, in order (lib/normalize-es.mjs)
 *     words     [{ text, start, dur? }] word boundaries in seconds from the clip start, in order
 *     duration  clip length in seconds (bounds the interpolation of chunks at the end)
 *   -> { offsets, missing, matched, expected, heard, valid }
 *     offsets   one start per chunk in seconds from the clip start; offsets[0] is always 0 (the first
 *               subtitle shows when the line starts), the rest strictly increasing
 *     missing   indexes of chunks none of whose words were heard (their offsets are interpolated by
 *               word count between the neighbours: the report lists them as missing bookmarks)
 *     matched / expected / heard   exact word matches, chunk words, boundary words
 *     valid     false when the offsets could not be made strictly increasing inside the clip (the
 *               caller then times the chunks by character count)
 *
 * The alignment is a word-level edit distance (Levenshtein with backtrace) on folded words: case,
 * accents and punctuation are ignored, so "Según," matches "segun". It tolerates a `say` text that
 * differs from the display text ("humano–IA" said as "entre personas e i a").
 */

/** Folded words of a text: lowercase, no accents, no punctuation. */
export function words(text) {
  return String(text == null ? '' : text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .split(/[^a-z0-9]+/).filter(Boolean);
}

// Word-level alignment: pairs [i, j] of expected token i heard as boundary token j, plus whether the
// pair is an exact match. Ties prefer matches, then the diagonal.
function editAlign(a, b) {
  const n = a.length;
  const m = b.length;
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  for (let i = 1; i <= n; i++) cost[i][0] = i;
  for (let j = 1; j <= m; j++) cost[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = cost[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      cost[i][j] = Math.min(sub, cost[i - 1][j] + 1, cost[i][j - 1] + 1);
    }
  }
  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const same = a[i - 1] === b[j - 1];
    if (cost[i][j] === cost[i - 1][j - 1] + (same ? 0 : 1)) {
      pairs.push({ i: i - 1, j: j - 1, exact: same });
      i--; j--;
    } else if (cost[i][j] === cost[i - 1][j] + 1) {
      i--;
    } else {
      j--;
    }
  }
  return pairs.reverse();
}

/**
 * @param {string[]} chunks
 * @param {{ text: string, start: number, dur?: number }[]} heardWords
 * @param {{ duration?: number }} [opts]
 */
export function alignChunks(chunks, heardWords, { duration } = {}) {
  const expected = [];
  chunks.forEach((chunk, k) => { for (const w of words(chunk)) expected.push({ w, chunk: k }); });
  const heard = [];
  (heardWords || []).forEach((word, index) => {
    for (const w of words(word.text)) heard.push({ w, index });
  });

  const pairs = editAlign(expected.map((e) => e.w), heard.map((h) => h.w));
  const exactIn = new Array(chunks.length).fill(false);
  const firstAligned = new Array(chunks.length).fill(-1); // heard word index of the chunk's first aligned token
  let matched = 0;
  for (const { i, j, exact } of pairs) {
    const k = expected[i].chunk;
    if (exact) { exactIn[k] = true; matched++; }
    if (firstAligned[k] < 0) firstAligned[k] = heard[j].index;
  }

  const last = heardWords && heardWords.length ? heardWords[heardWords.length - 1] : null;
  const end = Number.isFinite(duration) && duration > 0 ? duration :
    last ? last.start + (last.dur || 0) : 0;

  const offsets = new Array(chunks.length).fill(null);
  const missing = [];
  chunks.forEach((_, k) => {
    if (k === 0) { offsets[0] = 0; return; }
    if (exactIn[k] && firstAligned[k] >= 0) offsets[k] = heardWords[firstAligned[k]].start;
    else missing.push(k);
  });

  // Interpolate missing chunks by word count between the known neighbours.
  const size = chunks.map((chunk) => Math.max(1, words(chunk).length));
  for (let k = 1; k < chunks.length; k++) {
    if (offsets[k] != null) continue;
    let next = k;
    while (next < chunks.length && offsets[next] == null) next++;
    const from = offsets[k - 1];
    const to = next < chunks.length ? offsets[next] : end;
    let total = 0;
    for (let x = k - 1; x < next; x++) total += size[x];
    let acc = size[k - 1];
    for (let x = k; x < next; x++) {
      offsets[x] = from + (to - from) * (acc / total);
      acc += size[x];
    }
  }

  let valid = chunks.length > 0;
  for (let k = 1; k < chunks.length; k++) {
    if (!(offsets[k] > offsets[k - 1]) || (end > 0 && offsets[k] >= end)) valid = false;
  }
  return { offsets, missing, matched, expected: expected.length, heard: heard.length, valid };
}
