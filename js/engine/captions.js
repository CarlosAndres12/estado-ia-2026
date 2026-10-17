/* Estado de la IA 2026 — subtitles and canvas cards (prompt §6.4, §6.5, §6.6).
 *
 * DOM-free at load time (tools/generate-voiceover.mjs evaluates it in a Node vm sandbox to cut the
 * same subtitle chunks the player shows). Drawing functions take a 2D context and draw in the
 * 1280×720 logical space of the videos.
 *
 *   chunk(text) -> [string]
 *   chunk(text, { measure, maxWidth, maxLines, minChars }) -> [string]
 *       PURE and deterministic: splits one voice line (its display text, figures exactly as the KB
 *       writes them) into subtitle chunks of at most 2 lines, at punctuation and phrase boundaries,
 *       never after a function word and never between a number and its unit. The default budget
 *       is K.CHARS_PER_LINE characters per line (spaces included) × K.MAX_LINES lines, which fits
 *       the 34 px subtitle sans on the 1280 px canvas with room to spare; no font metrics are
 *       used, so Node tools and the browser cut exactly the same chunks. `measure(text) -> units`
 *       and `maxWidth` (same units) can be injected to chunk by another budget.
 *       When the audio manifest carries chunks, the player shows those texts and times as they
 *       are and never re-chunks (see timeline.js).
 *   timeChunks(texts, start, end, offsets?) -> [{ text, start, end }]
 *       Chunk times from start offsets (seconds from the line start: bookmarks or word-boundary
 *       alignment) when they are valid, else by character count.
 *   cueAt(tl, t, out?) -> { line, chunk, chunkIndex, text, voice, alpha, band } | null
 *   drawSubtitle(ctx, cue, { env })                 bottom band, lectora lines start with her sign
 *   drawCheckpoint(ctx, checkpoint, localT, { env, copy, dur })   linear card: 4 s question with a
 *                                                   3-2-1 countdown, then the answer for 2 s
 *   drawChapterTitle(ctx, title, localT, { env })   lettered in the top-left corner for 2 s
 *   drawSign(ctx, name, cx, cy, size, { env, p, seed })   'libreta' | 'estrella-exito' | 'espiral'
 *
 * Text drawn here comes from the data (voice lines, checkpoints, chapter titles) or from the copy
 * passed in `opts.copy` (EIA.data.course.ui.player.checkpoint); nothing is typed in this file. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.engine = EIA.engine || {};

  var K = {
    FONT_PX: 34,          // subtitles: large sans, never under 30 px
    MIN_FONT_PX: 30,
    LINE_HEIGHT: 1.3,
    MAX_LINES: 2,
    CHARS_PER_LINE: 50,   // chunking budget; 50 characters of real script text measure ≤ ~900 px at 34 px
    TEXT_WIDTH: 1080,     // widest drawn subtitle line (real metrics); leaves room for the lectora sign
    MIN_CHARS: 20,        // shortest chunk worth its own subtitle
    FADE_IN: 0.12,
    FADE_OUT: 0.12,
    HOLD: 0.35,           // the last chunk stays this long after the voice, never into the next line
    MARGIN_BOTTOM: 26,
    PAD_X: 28,
    PAD_Y: 12,
    SIGN: 32,             // lectora notebook sign
    SIGN_GAP: 14,
    BAND_ALPHA: 0.8,
    RADIUS: 16,
    QUESTION: 4,
    ANSWER: 2,
    CHAPTER: 2,
    SANS: '"EIA Sans", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
    DISPLAY: '"EIA Display", "Noto Serif Display", Georgia, serif'
  };

  var W = 1280, H = 720;

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }

  function font(px, weight, family, style) {
    return (style ? style + ' ' : '') + (weight || 400) + ' ' + px + 'px ' + (family || K.SANS);
  }

  function fold(text) {
    return String(text == null ? '' : text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function toSet(words) {
    var out = {};
    words.split(' ').forEach(function (w) { out[w] = true; });
    return out;
  }

  // Default chunking measure: characters, spaces included (pure, no font metrics).
  function charCount(text) { return String(text == null ? '' : text).length; }

  // ---------------------------------------------------------------------------------------------
  // Line wrapping

  function splitWords(text) {
    return String(text == null ? '' : text).trim().split(/\s+/).filter(Boolean);
  }

  // Greedy wrap: as many words per line as fit in maxWidth.
  function wrap(text, measure, maxWidth) {
    var words = splitWords(text);
    var lines = [];
    var cur = '';
    words.forEach(function (w) {
      var next = cur ? cur + ' ' + w : w;
      if (!cur || measure(next) <= maxWidth) cur = next;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // Balanced wrap for display: the 2-line split with the narrowest longest line. Falls back to the
  // greedy wrap when the text needs more than maxLines lines.
  function balance(text, measure, maxWidth, maxLines) {
    maxLines = maxLines || K.MAX_LINES;
    var greedy = wrap(text, measure, maxWidth);
    if (greedy.length <= 1 || greedy.length > maxLines || maxLines < 2) return greedy;
    var words = splitWords(text);
    var best = null, bestW = Infinity;
    for (var k = 1; k < words.length; k++) {
      var a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
      var wa = measure(a), wb = measure(b);
      if (wa > maxWidth || wb > maxWidth) continue;
      var m = Math.max(wa, wb);
      if (m < bestW) { bestW = m; best = [a, b]; }
    }
    return best || greedy;
  }

  // ---------------------------------------------------------------------------------------------
  // Chunking

  var STRONG = 3, MEDIUM = 2, WEAK = 1, PLAIN = 0, BAD = -1;
  // Cost of ending a chunk before a word, by the quality of that break.
  var BREAK_COST = {};
  BREAK_COST[STRONG] = 0; BREAK_COST[MEDIUM] = 25; BREAK_COST[WEAK] = 55; BREAK_COST[PLAIN] = 90; BREAK_COST[BAD] = 2000;
  var CHUNK_COST = 30;      // every extra chunk costs a little: no splitting without a reason
  var TINY_COST = 300;      // a chunk shorter than minChars (unless it is the whole line)
  var FILL_COST = 40;       // × (1 − fill)²: balanced chunks over a full one plus an orphan
  // A sentence end left inside a chunk although both sides could stand alone. Higher than the most a
  // split can cost (2 × (CHUNK_COST + FILL_COST) − CHUNK_COST), so subtitles follow the voice
  // sentence by sentence whenever the sentences are long enough.
  var SENTENCE_COST = 120;
  // A chunk that ends with the first words of a new sentence, or starts with the short tail of the
  // previous one ("… no impacto. McKinsey" / "47 de 102. Y ojo: …").
  var DANGLING_COST = 150;

  // Never end a chunk with these (folded, punctuation stripped).
  var FUNCTION_WORDS = toSet('el la los las lo un una unos unas al del de a en y e o u ni que con por para sin ' +
    'sobre entre hacia hasta desde segun su sus mi mis tu tus se le les me te nos no es son ha han hay muy mas ' +
    'menos tan cada como cuando donde si pero porque aunque sino ya fue era');
  // Good words to start a chunk with.
  var CONNECTORS = toSet('y e o u ni pero que porque aunque sino mientras cuando donde como para sin con segun ' +
    'frente hasta desde entre si pues');
  // Abbreviations that never end a chunk ("EE. UU.", "cap. 2", "feb. 2025").
  var ABBREVIATIONS = toSet('ee cap caps feb ene mar abr jun jul ago sep sept oct nov dic num pag sr sra dr dra vs aprox ej');

  // Quality of a break between `prev` and `next` (`after` is the word that follows `next`).
  function breakQuality(prev, next, after) {
    var bare = fold(prev).replace(/[^a-z0-9]/g, '');
    if (/\.$/.test(prev) && ABBREVIATIONS[bare]) return BAD;
    if (/[.!?…:;]["»”’')\]]*$/.test(prev)) return STRONG;
    if (/[,)\]»”—–]$/.test(prev)) return MEDIUM;
    if (/\d/.test(prev) && /^[A-Za-zÀ-ÿ]/.test(next)) return BAD;   // "344.700 | millones"
    if (FUNCTION_WORDS[bare]) return BAD;
    if (/^[(«“¿¡—–]/.test(next)) return MEDIUM;
    // "Europa | y Asia Central", "McKinsey | y Microsoft": a pair of names stays together.
    if (/^(y|e|o|u|ni)$/.test(next) && /^[A-ZÁÉÍÓÚÑ]/.test(prev) && after && /^[A-ZÁÉÍÓÚÑ]/.test(after)) return BAD;
    if (CONNECTORS[fold(next).replace(/[^a-z]/g, '')]) return WEAK;
    return PLAIN;
  }

  function chunk(text, opts) {
    opts = opts || {};
    var measure = opts.measure || charCount;
    var maxWidth = opts.maxWidth || (opts.measure ? Infinity : K.CHARS_PER_LINE);
    var maxLines = opts.maxLines || K.MAX_LINES;
    var minChars = opts.minChars != null ? opts.minChars : K.MIN_CHARS;
    var words = splitWords(text);
    var n = words.length;
    if (!n) return [];

    var widths = words.map(function (w) { return measure(w); });
    var space = measure(' ');
    var pre = [0];
    for (var p = 0; p < n; p++) pre.push(pre[p] + words[p].length);
    var quality = [BAD];
    var sentenceEnd = [false];
    for (var q = 1; q < n; q++) {
      quality.push(breakQuality(words[q - 1], words[q], words[q + 1]));
      // ":" and ";" are good places to break, but only ". ? ! …" end a sentence.
      sentenceEnd.push(quality[q] === STRONG && /[.!?…]["»”’')\]]*$/.test(words[q - 1]));
    }

    function chars(i, j) { return pre[j] - pre[i] + Math.max(0, j - i - 1); }

    // Sentence ends inside words i..j-1 where both sides could be chunks of their own.
    function innerSentences(i, j) {
      var count = 0;
      for (var s = i + 1; s < j; s++) {
        if (sentenceEnd[s] && chars(i, s) >= minChars && chars(s, j) >= minChars) count++;
      }
      return count;
    }

    // Short sentence fragments glued to a chunk that starts or ends mid-sentence.
    function dangling(i, j) {
      var first = -1, last = -1;
      for (var s = i + 1; s < j; s++) {
        if (sentenceEnd[s]) { if (first < 0) first = s; last = s; }
      }
      if (first < 0) return 0;
      var count = 0;
      if (i > 0 && !sentenceEnd[i] && chars(i, first) < minChars) count++;
      if (j < n && !sentenceEnd[j] && chars(last, j) < minChars) count++;
      return count;
    }

    // Dynamic program over break positions: best[j] is the lowest cost of chunking words 0..j-1,
    // where every chunk fits in maxLines lines (greedy wrap) and costs its break, its fill and the
    // sentence ends it swallows. Deterministic: ties keep the earliest solution.
    var cap = maxLines * maxWidth;
    var best = [0], from = [-1];
    for (var z = 1; z <= n; z++) { best.push(Infinity); from.push(-1); }
    for (var i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      var lines = 1, w = 0, total = 0;
      for (var j = i + 1; j <= n; j++) {
        var ww = widths[j - 1];
        if (w === 0) w = ww;
        else if (w + space + ww <= maxWidth) w += space + ww;
        else { lines++; w = ww; }
        if (lines > maxLines) break;
        total += (j > i + 1 ? space : 0) + ww;
        var cost = (j === n ? 0 : BREAK_COST[quality[j]]) + CHUNK_COST;
        if (!(i === 0 && j === n)) {
          cost += chars(i, j) < minChars ? TINY_COST : FILL_COST * Math.pow(1 - Math.min(1, total / cap), 2);
        }
        cost += SENTENCE_COST * innerSentences(i, j) + DANGLING_COST * dangling(i, j);
        if (best[i] + cost < best[j] - 1e-9) { best[j] = best[i] + cost; from[j] = i; }
      }
    }

    var cuts = [];
    for (var at = n; at > 0; at = from[at]) cuts.push(at);
    cuts.reverse();
    var out = [];
    var start = 0;
    cuts.forEach(function (end) {
      out.push(words.slice(start, end).join(' '));
      start = end;
    });
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Chunk times

  function validOffsets(offsets, count, span) {
    if (!offsets || offsets.length !== count) return false;
    for (var i = 0; i < count; i++) {
      var o = offsets[i];
      if (typeof o !== 'number' || !isFinite(o) || o < 0 || o >= span) return false;
      if (i > 0 && o <= offsets[i - 1]) return false;
    }
    return true;
  }

  function timeChunks(texts, start, end, offsets) {
    texts = Array.prototype.slice.call(texts || []);
    var span = Math.max(0, end - start);
    var out = [];
    if (!texts.length) return out;
    if (validOffsets(offsets, texts.length, span)) {
      texts.forEach(function (text, i) {
        out.push({
          text: text,
          start: i === 0 ? start : start + offsets[i],
          end: i === texts.length - 1 ? end : start + offsets[i + 1]
        });
      });
      return out;
    }
    var total = 0;
    texts.forEach(function (t) { total += t.length || 1; });
    var acc = 0;
    texts.forEach(function (text, i) {
      var a = start + span * (acc / total);
      acc += text.length || 1;
      out.push({ text: text, start: a, end: i === texts.length - 1 ? end : start + span * (acc / total) });
    });
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Active subtitle at t

  function cueAt(tl, t, out) {
    if (!tl || !tl.lines || !tl.lines.length) return null;
    var i = tl.lineIndexAt(t);
    if (i < 0) return null;
    var line = tl.lines[i];
    var next = tl.lines[i + 1];
    var showEnd = Math.min(line.end + K.HOLD, next ? next.start : Infinity);
    if (t >= showEnd) return null;
    var chunks = line.chunks && line.chunks.length ? line.chunks : [{ text: line.text, start: line.start, end: line.end }];
    var k = 0;
    for (var c = 0; c < chunks.length; c++) if (chunks[c].start <= t) k = c;
    var ch = chunks[k];
    var chEnd = k < chunks.length - 1 ? chunks[k + 1].start : showEnd;
    var r = out || {};
    r.line = line;
    r.chunk = ch;
    r.chunkIndex = k;
    r.text = ch.text;
    r.voice = line.voice;
    r.alpha = clamp01(Math.min((t - ch.start) / K.FADE_IN, (chEnd - t) / K.FADE_OUT));
    r.band = clamp01(Math.min((t - line.start) / K.FADE_IN, (showEnd - t) / K.FADE_OUT));
    return r;
  }

  // ---------------------------------------------------------------------------------------------
  // Shared drawing helpers

  // Palette colors (prompt §3.9, js/engine/palette.js).
  function colors(env) {
    var pal = (env && env.pal) || EIA.engine.palette;
    return {
      lienzo: pal.mundo.lienzo,
      tinta: pal.mundo.tinta,
      amarillo: pal.mundo.amarillo,
      rojo: pal.mundo.rojo,
      noche: pal.maquina.noche
    };
  }

  function engine(env, name) {
    return (env && env[name]) || EIA.engine[name === 'fig' ? 'figures' : name];
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // A cream paper card with a thick, slightly irregular ink outline.
  function paperCard(ctx, x, y, w, h, opts) {
    opts = opts || {};
    engine(opts.env, 'ink').card(ctx, x, y, w, h, {
      seed: opts.seed || 'card', weight: opts.weight || 5, radius: opts.radius || 18, peek: opts.peek, peekCorner: opts.peekCorner
    });
  }

  /* Small course signs (figures.sign, centered on cx, cy): 'libreta' (the lectora's notebook),
   * 'estrella-exito' (a right answer: a bursting yellow star), 'espiral' (another try). */
  function drawSign(ctx, name, cx, cy, size, opts) {
    opts = opts || {};
    engine(opts.env, 'fig').sign(ctx, name, cx, cy, size, { p: opts.p == null ? 1 : opts.p, seed: opts.seed || name });
  }

  // Text layouts are measured once per string and font (prompt §14: no per-frame measuring).
  var layoutCache = new Map();
  function cached(key, make) {
    var hit = layoutCache.get(key);
    if (hit) return hit;
    hit = make();
    if (layoutCache.size > 600) layoutCache.clear();
    layoutCache.set(key, hit);
    return hit;
  }

  function ctxMeasure(ctx, fontStr) {
    return function (s) { ctx.font = fontStr; return ctx.measureText(s).width; };
  }

  // ---------------------------------------------------------------------------------------------
  // Subtitle band

  function layoutCue(ctx, text, voice) {
    return cached('sub|' + voice + '|' + text, function () {
      var signSpace = voice === 'lectora' ? K.SIGN + K.SIGN_GAP : 0;
      var maxW = K.TEXT_WIDTH - signSpace;
      var size = K.FONT_PX, lines, measure;
      for (;;) {
        measure = ctxMeasure(ctx, font(size));
        lines = balance(text, measure, maxW, K.MAX_LINES);
        if (lines.length <= K.MAX_LINES || size <= K.MIN_FONT_PX) break;
        size -= 2;
      }
      var widths = lines.map(measure);
      var textW = Math.max.apply(null, widths.concat([0]));
      var lh = Math.round(size * K.LINE_HEIGHT);
      return {
        size: size, lines: lines, widths: widths, textW: textW, lh: lh, signSpace: signSpace,
        w: Math.ceil(textW + signSpace + 2 * K.PAD_X), h: lines.length * lh + 2 * K.PAD_Y
      };
    });
  }

  function drawSubtitle(ctx, cue, opts) {
    if (!cue || !(cue.band > 0)) return;
    opts = opts || {};
    var col = colors(opts.env);
    var L = layoutCue(ctx, cue.text, cue.voice);
    var x = Math.round((W - L.w) / 2);
    var y = H - K.MARGIN_BOTTOM - L.h;
    ctx.save();
    ctx.globalAlpha = cue.band * K.BAND_ALPHA;
    ctx.fillStyle = col.tinta;
    roundRect(ctx, x, y, L.w, L.h, K.RADIUS);
    ctx.fill();
    ctx.globalAlpha = Math.min(cue.alpha, cue.band);
    ctx.fillStyle = col.lienzo;
    ctx.font = font(L.size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var tx = x + K.PAD_X + L.signSpace;
    for (var i = 0; i < L.lines.length; i++) {
      ctx.fillText(L.lines[i], tx, y + K.PAD_Y + i * L.lh + L.lh / 2);
    }
    if (cue.voice === 'lectora') {
      drawSign(ctx, 'libreta', x + K.PAD_X + K.SIGN / 2, y + K.PAD_Y + L.lh / 2, K.SIGN, { env: opts.env, seed: 'lectora' });
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // Linear checkpoint card (recording, export, "Preguntas interactivas" off)

  function countdownAt(localT) {
    if (!(localT >= 1 && localT < K.QUESTION)) return 0;
    return K.QUESTION - Math.floor(localT);
  }

  function layoutCard(ctx, cp, answer, copy) {
    var key = 'cp|' + (answer ? 'a' : 'q') + '|' + cp.question + '|' + (cp.options || []).join('|') + '|' + (cp.explain || '');
    return cached(key, function () {
      var CW = 1000, PAD = 44, IW = CW - 2 * PAD;
      var sizes = [[34, 30, 28], [32, 28, 26], [30, 27, 25], [28, 26, 24]];
      var out = null;
      for (var s = 0; s < sizes.length; s++) {
        var qs = sizes[s][0], os = sizes[s][1], es = sizes[s][2];
        var head = 30;
        var qFont = font(qs, 700), oFont = font(os), eFont = font(es, 400, null, 'italic');
        var qLines = wrap(cp.question || '', ctxMeasure(ctx, qFont), IW - 96);
        var qLh = Math.round(qs * 1.25);
        var oLh = Math.round(os * 1.25);
        var opts = (cp.options || []).map(function (o) { return wrap(String(o), ctxMeasure(ctx, oFont), IW - 60); });
        var eLines = answer && cp.explain ? wrap(cp.explain, ctxMeasure(ctx, eFont), IW) : [];
        var eLh = Math.round(es * 1.3);
        var h = PAD + head + 18 + qLines.length * qLh + 20;
        opts.forEach(function (lines) { h += lines.length * oLh + 12; });
        if (eLines.length) h += 14 + eLines.length * eLh;
        h += PAD - 12;
        out = {
          CW: CW, PAD: PAD, IW: IW, h: h, head: head, headFont: font(22, 700),
          qFont: qFont, qLines: qLines, qLh: qLh, oFont: oFont, oFontBold: font(os, 700), opts: opts, oLh: oLh,
          eFont: eFont, eLines: eLines, eLh: eLh
        };
        if (h <= 660) break;
      }
      return out;
    });
  }

  function drawCheckpoint(ctx, cp, localT, opts) {
    opts = opts || {};
    if (!cp) return;
    var copy = opts.copy || {};
    var dur = opts.dur || K.QUESTION + K.ANSWER;
    var answer = localT >= K.QUESTION;
    var alpha = clamp01(Math.min(localT / 0.35, (dur - localT) / 0.35));
    if (alpha <= 0) return;
    var col = colors(opts.env);
    var L = layoutCard(ctx, cp, answer, copy);
    var x = (W - L.CW) / 2;
    var y = Math.round((H - L.h) / 2);
    var rise = (1 - clamp01(localT / 0.35)) * 16;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, rise);
    paperCard(ctx, x, y, L.CW, L.h, { env: opts.env, seed: 'checkpoint-card', peek: col.amarillo, peekCorner: 'bl' });

    var cx = x + L.PAD;
    var cy = y + L.PAD;
    ctx.fillStyle = col.tinta;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = L.headFont;
    ctx.fillText(answer ? (copy.respuesta || '') : (copy.lineal || ''), cx, cy + L.head / 2);
    // The figure the question quotes keeps its source tag on the card (prompt §3.8), in the header
    // row left of the countdown. While the question asks, the tag leaves out its evidence chip:
    // the type may be the very answer.
    var tagApi = engine(opts.env, 'tags');
    if (cp.cifras && cp.cifras.length && tagApi && tagApi.sourceTag) {
      var to = { scale: 0.92, scope: false, chip: answer };
      var tm = tagApi.measureTag(ctx, cp.cifras, to);
      to.x = x + L.CW - L.PAD - 96 - tm.w;
      to.y = y + 14;
      tagApi.sourceTag(ctx, cp.cifras, to);
      ctx.fillStyle = col.tinta;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
    }
    cy += L.head + 18;

    ctx.font = L.qFont;
    L.qLines.forEach(function (line, i) { ctx.fillText(line, cx, cy + i * L.qLh + L.qLh / 2); });
    cy += L.qLines.length * L.qLh + 20;

    L.opts.forEach(function (lines, i) {
      var right = answer && i === cp.answer;
      ctx.save();
      if (answer && !right) ctx.globalAlpha = alpha * 0.45;
      var mx = cx + 20, my = cy + L.oLh / 2;
      if (right) {
        drawSign(ctx, 'estrella-exito', mx, my, 58, { env: opts.env, seed: 'checkpoint-right' });
      } else {
        ctx.beginPath();
        ctx.arc(mx, my, 11, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = col.tinta;
        ctx.stroke();
      }
      ctx.fillStyle = col.tinta;
      ctx.font = right ? L.oFontBold : L.oFont;
      lines.forEach(function (line, j) { ctx.fillText(line, cx + 52, cy + j * L.oLh + L.oLh / 2); });
      ctx.restore();
      cy += lines.length * L.oLh + 12;
    });

    if (L.eLines.length) {
      cy += 14;
      ctx.font = L.eFont;
      ctx.fillStyle = col.tinta;
      L.eLines.forEach(function (line, i) { ctx.fillText(line, cx, cy + i * L.eLh + L.eLh / 2); });
    }

    var n = countdownAt(localT);
    if (n > 0) {
      var rx = x + L.CW - L.PAD - 34, ry = y + L.PAD + 34;
      var frac = localT - Math.floor(localT);
      ctx.beginPath();
      ctx.arc(rx, ry, 34, 0, Math.PI * 2);
      ctx.fillStyle = col.amarillo;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = col.tinta;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, ry, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = col.tinta;
      ctx.font = font(40, 700);
      ctx.textAlign = 'center';
      ctx.fillText(String(n), rx, ry + 2);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // Chapter title: lettered in the top-left corner for 2 s when a chapter starts

  function drawChapterTitle(ctx, title, localT, opts) {
    if (!title || !(localT >= 0 && localT < K.CHAPTER)) return;
    opts = opts || {};
    var ink = engine(opts.env, 'ink');
    var col = colors(opts.env);
    var lo = { size: 30, maxWidth: 620, maxLines: 1, fit: true, minSize: 22, underline: false, seed: 'chapter:' + title };
    var L = ink.measureLetter(ctx, title, lo);
    var pad = 16, x = 28, y = 24;
    var w = Math.ceil(L.w + 2 * pad), h = Math.ceil(L.h + 2 * pad - 8);
    ctx.save();
    ctx.globalAlpha = clamp01(Math.min(localT / 0.15, (K.CHAPTER - localT) / 0.4));
    ink.card(ctx, x, y, w, h, { seed: 'chapter-card', weight: 3, radius: 12, p: clamp01(localT / 0.35), peek: col.rojo, peekCorner: 'tr' });
    lo.p = clamp01((localT - 0.1) / 0.9);
    lo.color = col.tinta;
    ink.letter(ctx, title, x + pad, y + pad - 4, lo);
    ctx.restore();
  }

  EIA.engine.captions = {
    K: K,
    font: font,
    wrap: wrap,
    balance: balance,
    chunk: chunk,
    breakQuality: breakQuality,
    timeChunks: timeChunks,
    cueAt: cueAt,
    countdownAt: countdownAt,
    colors: colors,
    roundRect: roundRect,
    paperCard: paperCard,
    drawSign: drawSign,
    drawSubtitle: drawSubtitle,
    drawCheckpoint: drawCheckpoint,
    drawChapterTitle: drawChapterTitle,
    layout: function (ctx, text, fontStr, maxWidth) {
      return cached('txt|' + fontStr + '|' + maxWidth + '|' + text, function () { return wrap(text, ctxMeasure(ctx, fontStr), maxWidth); });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
