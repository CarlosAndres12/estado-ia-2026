/* Estado de la IA 2026 — video timeline (prompt §6.2, §6.5, §6.6, §5.6).
 *
 * PURE and DOM-free at load time: the player, tools/generate-voiceover.mjs and the tests all run this
 * same code (the tools inside a Node vm sandbox), so voice, subtitles and frames agree everywhere.
 *
 *   var tl = EIA.engine.timeline.build(video, opts);
 *
 *   video   one entry of EIA.data.videos (prompt §5.5)
 *   opts    {
 *     manifest        EIA.audioManifest[video.id]: when it matches the video (same scenes, lines and
 *                     checkpoints) its times are the clock and its chunks (texts and times) are used
 *                     as they are, never re-chunked; otherwise it is ignored and tl.manifestMismatch
 *                     says why (the player then estimates and stays off the out-of-sync audio track)
 *     wps             words per second for estimates (C.WPS_RUNTIME = 2.4; dry run: C.WPS_DRY_RUN 2.3)
 *     lineDurations   measured seconds per line, either an array in video line order (scene by
 *                     scene, line by line: the order of tl.lines) or an object keyed
 *                     'sceneId:lineIndex'; a missing or non-positive entry is estimated
 *     durationOf      the same as a function (line, sceneIndex, lineIndex, scene) -> seconds | undefined
 *     chunkOffsets    chunk start offsets per line, in seconds from the line start (from word
 *                     boundaries or bookmarks), same shapes as lineDurations, each entry an array
 *                     with one offset per chunk; invalid entries fall back to character count
 *     chunkOffsetsOf  the same as a function (line, sceneIndex, lineIndex, texts) -> [offsets] | null
 *     chunk           function (text, line) -> [chunk texts] (default: EIA.engine.captions.chunk)
 *     glosario        glossary entries (default EIA.data.glosario; false disables the margin notes)
 *   }
 *
 * A Node tool (tools/generate-voiceover.mjs) loads js/core/namespace.js, js/data/*.js, this file and
 * js/engine/captions.js in one vm sandbox, then:
 *     var texts = EIA.engine.captions.chunk(line.text);           // the subtitle chunks to align
 *     var tl = EIA.engine.timeline.build(video, { lineDurations: [4.21, 3.87, …], chunkOffsets: [[0, 1.9], …] });
 *     var entry = EIA.engine.timeline.toManifest(tl, { file: 'assets/audio/' + video.id + '.mp3' });
 * and writes `entry` as EIA.audioManifest[video.id] (contracts §2). The manifest's `lines[].scene`
 * and `checkpoints[].after` may be scene ids (what toManifest writes) or scene indexes.
 *
 * Rules:
 *   - scene duration = max(min, 0.6 s lead + its lines + 0.5 s between lines + pauses + 1.2 s tail);
 *     any extra time from `min` goes to the tail, lines keep their places after the lead;
 *   - each checkpoint is a fixed, silent 6 s segment right after the scene it follows
 *     (question 4 s + answer 2 s in linear mode);
 *   - chapters start at the scene named in `from` and end where the next chapter starts;
 *   - 0.8 s crossfades are centered on every boundary that enters a scene;
 *   - a line lasts its measured duration (voice-over tool), its manifest duration (player with
 *     generated audio), or an estimate: spoken words / wps / line rate (numbers count as the words
 *     they are read with).
 *
 * The result is plain, acyclic data (tools serialize it with JSON); its methods live on the
 * prototype: segmentAt(t), sceneAt(t), crossfadeAt(t), lineAt(t), lineIndexAt(t), chapterAt(t),
 * state(sceneIndex, localT, out) -> the `s` object of prompt §5.6, posterTime().
 * toManifest(tl, { file }) writes the EIA.audioManifest entry the voice-over tool saves. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.engine = EIA.engine || {};

  var C = {
    FPS: 24,
    LEAD: 0.6,               // silence before the first line of a scene
    GAP: 0.5,                // silence between two lines
    TAIL: 1.2,               // silence after the last line
    CHECKPOINT: 6,           // fixed silent segment
    CHECKPOINT_QUESTION: 4,  // linear card: question with a 3-2-1 countdown
    CHECKPOINT_ANSWER: 2,    // linear card: the answer
    CROSSFADE: 0.8,
    CHAPTER_TITLE: 2,        // lettered chapter title in a corner
    WARNING: 3,              // warning stamp pressed by an `advertencia` line
    INTRO: 1,                // s.intro goes 0 -> 1 over the first second
    OUTRO: 1,                // s.outro goes 0 -> 1 over the last second
    HOLD: 0.35,              // the last subtitle chunk (and a glossary note) stays after its line
    WPS_RUNTIME: 2.4,
    WPS_DRY_RUN: 2.3,
    MIN_LINE: 0.8            // shortest estimated line
  };

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }

  // ---------------------------------------------------------------------------------------------
  // Speech estimates

  // '0%' -> 1, '-5%' -> 0.95, '+10%' -> 1.1; anything else -> 1 (Azure prosody rate syntax).
  function parseRate(rate) {
    if (isNum(rate)) return rate > 0 ? rate : 1;
    var m = /^\s*([+\-−]?\d+(?:[.,]\d+)?)\s*%\s*$/.exec(String(rate == null ? '' : rate));
    if (!m) return 1;
    var v = 1 + parseFloat(m[1].replace('−', '-').replace(',', '.')) / 100;
    return v > 0.2 ? v : 1;
  }

  function speakable(line) {
    return line && line.say ? line.say : (line && line.text) || '';
  }

  // Words a Spanish voice reads for the integer part of a number with `d` digits
  // ("88" -> ochenta y ocho, "2025" -> dos mil veinticinco, "344700" -> six words).
  var INT_WORDS = [0, 1, 2, 3, 3, 4, 5, 6];
  function intWords(d) { return d < INT_WORDS.length ? INT_WORDS[d] : d - 1; }

  function numberWords(token) {
    if (/^\d+\.?º$/.test(token)) return 1;                       // ordinal "4.º" -> cuarto
    var words = 0;
    var parts = token.split(/[–-]/).filter(function (p) { return /\d/.test(p); });
    if (parts.length > 1) words += 2;                             // "12–18" -> de doce a dieciocho
    parts.forEach(function (p) {
      var m = /(\d[\d.]*)(?:,(\d+))?/.exec(p);
      if (!m) return;
      words += intWords(m[1].replace(/\./g, '').length);
      if (m[2]) words += 1 + Math.min(m[2].length, 3);            // "coma tres"
    });
    if (/%/.test(token)) words += 2;                              // "por ciento"
    if (/[×]/.test(token)) words += 1;                            // "veces"
    if (/^[+−-]\d/.test(token)) words += 1;                       // "más" / "menos"
    return Math.max(1, words);
  }

  // Spoken words in a text: plain words count 1, tokens without letters or digits count 0,
  // numbers count as the words they are read with (prompt §8.4).
  function countWords(text) {
    var n = 0;
    String(text == null ? '' : text).split(/\s+/).forEach(function (token) {
      if (!token) return;
      if (/\d/.test(token)) n += numberWords(token);
      else if (/[A-Za-zÀ-ÿ]/.test(token)) n += 1;
    });
    return n;
  }

  function estimateLine(line, video, wps) {
    var rate = parseRate(line.rate != null ? line.rate : video && video.rate);
    return Math.max(C.MIN_LINE, countWords(speakable(line)) / (wps || C.WPS_RUNTIME) / rate);
  }

  function normalizeAdvertencia(adv) {
    if (adv == null || adv === false) return [];
    var list = Array.isArray(adv) ? adv : [adv];
    return list.map(Number).filter(function (n) { return n >= 1 && n <= 4; });
  }

  // Frame-quantized time at 24 fps (what the player and the exporter render).
  function frameTime(t) {
    return Math.floor(t * C.FPS + 1e-6) / C.FPS;
  }

  // ---------------------------------------------------------------------------------------------
  // Glossary detection: whole-word, accent- and case-insensitive.

  function fold(text) {
    if (EIA.util && EIA.util.fold) return EIA.util.fold(text);
    return String(text == null ? '' : text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function termPatterns(entry) {
    var list = [];
    var termino = String(entry.termino || '');
    var bare = termino.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (bare) list.push(bare);
    var paren = /\(([^)]+)\)/.exec(termino);
    if (paren) list.push(paren[1].trim());
    (entry.variantes || []).forEach(function (v) { if (v) list.push(String(v)); });
    var seen = {};
    return list.map(fold).filter(function (p) {
      if (!p || seen[p]) return false;
      seen[p] = true;
      return true;
    }).map(function (p) {
      return new RegExp('(^|[^a-z0-9])' + escapeRe(p).replace(/ /g, '\\s+') + '(?=$|[^a-z0-9])', 'g');
    });
  }

  // True when the match [at, at + len) lies inside one of the entry's `excluir` phrases, where the
  // word means something else (e.g. the verb in «23% escala agentes»), as the page tooltips do.
  function excluded(entry, folded, at, len) {
    var list = entry.excluir || [];
    for (var i = 0; i < list.length; i++) {
      var p = fold(list[i]), from = 0, pos;
      while (p && (pos = folded.indexOf(p, from)) >= 0) {
        if (at >= pos && at + len <= pos + p.length) return true;
        from = pos + 1;
      }
    }
    return false;
  }

  function glossaryMatcher(glosario) {
    var terms = (glosario || []).map(function (entry) {
      return { entry: entry, patterns: termPatterns(entry), used: false };
    });
    // The first unused term the line mentions (by position in the text, skipping excluded uses),
    // marked as used.
    return function (text) {
      var folded = fold(text);
      var best = null, bestAt = Infinity;
      terms.forEach(function (term) {
        if (term.used) return;
        term.patterns.forEach(function (re) {
          re.lastIndex = 0;
          var m;
          while ((m = re.exec(folded))) {
            var at = m.index + m[1].length;
            if (!excluded(term.entry, folded, at, m[0].length - m[1].length)) {
              if (at < bestAt) { bestAt = at; best = term; }
              break;
            }
          }
        });
      });
      if (!best) return null;
      best.used = true;
      return best.entry;
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Manifest validation: the generated audio only drives the clock when it was made for exactly
  // these scenes, lines and checkpoints. Otherwise the player estimates (and stays silent on the
  // audio track, which would be out of sync).

  function usableManifest(video, m) {
    if (!m) return { manifest: null, reason: '' };
    function fail(reason) { return { manifest: null, reason: reason }; }
    var scenes = video.scenes;
    // Scene references may be ids or indexes.
    function sceneId(ref) { return typeof ref === 'number' && scenes[ref] ? scenes[ref].id : ref; }
    if (!Array.isArray(m.scenes) || m.scenes.length !== scenes.length) return fail('scenes');
    for (var i = 0; i < scenes.length; i++) {
      var ms = m.scenes[i];
      if (!ms || sceneId(ms.id != null ? ms.id : i) !== scenes[i].id || !isNum(ms.start) || !isNum(ms.dur)) return fail('scene ' + scenes[i].id);
    }
    var lineMap = {};
    (m.lines || []).forEach(function (l) { lineMap[sceneId(l.scene) + ':' + l.index] = l; });
    for (var s = 0; s < scenes.length; s++) {
      var lines = scenes[s].lines || [];
      for (var li = 0; li < lines.length; li++) {
        var ml = lineMap[scenes[s].id + ':' + li];
        if (!ml || !isNum(ml.start) || !isNum(ml.dur)) return fail('line ' + scenes[s].id + ':' + li);
      }
      if (lineMap[scenes[s].id + ':' + lines.length]) return fail('line ' + scenes[s].id + ':' + lines.length);
    }
    var cps = video.checkpoints || [];
    var mcps = m.checkpoints || [];
    if (mcps.length !== cps.length) return fail('checkpoints');
    for (var k = 0; k < cps.length; k++) {
      if (!mcps[k] || sceneId(mcps[k].after) !== cps[k].after || !isNum(mcps[k].start) || !isNum(mcps[k].dur)) return fail('checkpoint ' + k);
    }
    return { manifest: { scenes: m.scenes, lineMap: lineMap, checkpoints: mcps, duration: m.duration, file: m.file }, reason: '' };
  }

  // ---------------------------------------------------------------------------------------------
  // Chunk texts and times (delegated to EIA.engine.captions when it is loaded).

  function proportional(texts, start, end) {
    var total = 0;
    texts.forEach(function (t) { total += t.length || 1; });
    var acc = 0;
    return texts.map(function (text, i) {
      var a = start + (end - start) * (acc / total);
      acc += text.length || 1;
      var b = i === texts.length - 1 ? end : start + (end - start) * (acc / total);
      return { text: text, start: a, end: b };
    });
  }

  // A per-line value given as an array in video line order (flat index) or an object keyed
  // 'sceneId:lineIndex'.
  function perLine(data, sceneId, li, flat) {
    if (!data) return undefined;
    if (Array.isArray(data)) return data[flat];
    return data[sceneId + ':' + li];
  }

  function chunkLine(line, si, li, flat, sceneId, start, end, opts) {
    var cap = EIA.engine.captions;
    var texts = opts.chunk ? opts.chunk(line.text || '', line) : cap && cap.chunk ? cap.chunk(line.text || '') : [line.text || ''];
    texts = Array.prototype.slice.call(texts || []);
    if (!texts.length) texts = [line.text || ''];
    var offsets = opts.chunkOffsetsOf ? opts.chunkOffsetsOf(line, si, li, texts) : perLine(opts.chunkOffsets, sceneId, li, flat);
    if (cap && cap.timeChunks) return Array.prototype.slice.call(cap.timeChunks(texts, start, end, offsets));
    return proportional(texts, start, end);
  }

  // ---------------------------------------------------------------------------------------------
  // The timeline object

  function Timeline() {}

  function bisect(list, t) { // last index with list[i].start <= t, or -1
    var lo = 0, hi = list.length - 1, ans = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (list[mid].start <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }

  Timeline.prototype.segmentAt = function (t) {
    var i = bisect(this.segments, t);
    return this.segments[i < 0 ? 0 : i];
  };

  // The scene on screen at t: for a checkpoint segment, the scene it follows.
  Timeline.prototype.sceneAt = function (t) {
    var seg = this.segmentAt(t);
    return seg.kind === 'scene' ? seg : this.segments[seg.afterSegment];
  };

  // { from, to, x } while t is inside the 0.8 s crossfade centered on the start of a scene
  // (from/to are segment indexes, x goes 0 -> 1), else null.
  Timeline.prototype.crossfadeAt = function (t, out) {
    var half = C.CROSSFADE / 2;
    var seg = this.segmentAt(t);
    var next = this.segments[seg.index + 1];
    var into = null;
    if (next && next.kind === 'scene' && t < next.start && next.start - t < half) into = next;
    else if (seg.kind === 'scene' && seg.index > 0 && t >= seg.start && t - seg.start < half) into = seg;
    if (!into) return null;
    var r = out || {};
    r.from = into.index - 1;
    r.to = into.index;
    r.x = clamp01((t - (into.start - half)) / C.CROSSFADE);
    return r;
  };

  Timeline.prototype.lineIndexAt = function (t) {
    return bisect(this.lines, t);
  };

  // The line being spoken at t (start <= t < end), or null.
  Timeline.prototype.lineAt = function (t) {
    var i = bisect(this.lines, t);
    if (i < 0) return null;
    var line = this.lines[i];
    return t < line.end ? line : null;
  };

  Timeline.prototype.chapterAt = function (t) {
    var i = bisect(this.chapters, t);
    return i < 0 ? 0 : i;
  };

  Timeline.prototype.posterTime = function () {
    var poster = this.poster;
    if (!poster) return 0;
    var seg = this.scenes[poster.scene];
    return seg ? seg.start + clamp01(poster.p) * seg.dur : 0;
  };

  function makeState(seg) {
    var s = {
      t: 0, p: 0, dur: seg.dur, intro: 0, outro: 0,
      lines: seg.local, line: -1, lineP: 0, at: null,
      rotulos: seg.rotulos, layers: null, state: null
    };
    // at(i): 0 before line i starts, 0 -> 1 while it plays, 1 after.
    s.at = function (i) {
      var L = s.lines[i];
      if (!L) return 0;
      if (s.t <= L.start) return 0;
      if (s.t >= L.end) return 1;
      return (s.t - L.start) / (L.end - L.start);
    };
    return s;
  }

  /* The `s` object of prompt §5.6 for scene `sceneIndex` at scene-local time `localT` (clamped to
   * the scene). Pass the previous result as `out` to reuse it with no allocation. The player fills
   * `s.layers` (what layers[sceneId](env) returned) and `s.state` (what setup(env) returned). */
  Timeline.prototype.state = function (sceneIndex, localT, out) {
    var seg = this.scenes[sceneIndex];
    var s = out || makeState(seg);
    var t = localT <= 0 ? 0 : localT >= seg.dur ? seg.dur : localT;
    s.t = t;
    s.dur = seg.dur;
    s.p = seg.dur > 0 ? t / seg.dur : 1;
    s.intro = clamp01(t / C.INTRO);
    s.outro = clamp01((t - (seg.dur - C.OUTRO)) / C.OUTRO);
    s.lines = seg.local;
    s.rotulos = seg.rotulos;
    var li = -1;
    for (var i = 0; i < seg.local.length; i++) {
      if (seg.local[i].start <= t) li = i; else break;
    }
    s.line = li;
    s.lineP = li < 0 ? 0 : s.at(li);
    return s;
  };

  // ---------------------------------------------------------------------------------------------
  // build

  function build(video, opts) {
    opts = opts || {};
    if (!video || !Array.isArray(video.scenes) || !video.scenes.length) {
      throw new Error('timeline: video "' + (video && video.id) + '" has no scenes');
    }
    var wps = opts.wps || C.WPS_RUNTIME;
    var scenes = video.scenes;
    var sceneIndexById = {};
    scenes.forEach(function (scene, i) {
      if (Object.prototype.hasOwnProperty.call(sceneIndexById, scene.id)) {
        throw new Error('timeline: duplicate scene id "' + scene.id + '" in ' + video.id);
      }
      sceneIndexById[scene.id] = i;
    });

    var checkpoints = video.checkpoints || [];
    var cpsAfter = {};
    checkpoints.forEach(function (cp, k) {
      var si = sceneIndexById[cp.after];
      if (si == null) throw new Error('timeline: checkpoint ' + k + ' of ' + video.id + ' follows unknown scene "' + cp.after + '"');
      (cpsAfter[si] = cpsAfter[si] || []).push(k);
    });

    var chapterDefs = video.chapters && video.chapters.length ? video.chapters : [{ title: video.title || '', from: scenes[0].id }];
    var chapterScene = chapterDefs.map(function (ch) {
      var si = sceneIndexById[ch.from];
      if (si == null) throw new Error('timeline: chapter "' + ch.title + '" of ' + video.id + ' starts at unknown scene "' + ch.from + '"');
      return si;
    });
    function chapterOfScene(si) {
      var c = 0;
      for (var i = 0; i < chapterScene.length; i++) if (chapterScene[i] <= si) c = i;
      return c;
    }

    var checked = usableManifest(video, opts.manifest);
    var manifest = checked.manifest;
    var glossaryOf = opts.glosario === false ? null :
      glossaryMatcher(opts.glosario || (EIA.data && EIA.data.glosario) || []);

    var tl = new Timeline();
    tl.id = video.id;
    tl.slug = video.slug || video.id;
    tl.title = video.title || '';
    tl.wps = wps;
    tl.source = manifest ? 'manifest' : opts.durationOf || opts.lineDurations ? 'measured' : 'estimate';
    tl.manifestMismatch = opts.manifest && !manifest ? checked.reason : '';
    tl.file = manifest ? manifest.file || '' : '';
    tl.segments = [];
    tl.scenes = [];
    tl.checkpoints = [];
    tl.lines = [];
    tl.chapters = [];

    var t = 0;
    scenes.forEach(function (scene, si) {
      var seg = {
        kind: 'scene', index: tl.segments.length, scene: si, id: scene.id,
        chapter: chapterOfScene(si), min: scene.min || 0, seVe: scene.seVe || '',
        rotulos: scene.rotulos || {}, start: t, dur: 0, end: 0, local: [], lines: []
      };
      var sceneLines = scene.lines || [];

      if (manifest) {
        var ms = manifest.scenes[si];
        seg.start = ms.start;
        seg.dur = ms.dur;
      }

      var cursor = C.LEAD;
      sceneLines.forEach(function (line, li) {
        var start, dur, mline = null;
        if (manifest) {
          mline = manifest.lineMap[scene.id + ':' + li];
          start = mline.start;
          dur = mline.dur;
        } else {
          var measured = opts.durationOf ? opts.durationOf(line, si, li, scene) :
            perLine(opts.lineDurations, scene.id, li, tl.lines.length);
          dur = isNum(measured) && measured > 0 ? measured : estimateLine(line, video, wps);
          start = seg.start + cursor;
          cursor += dur + (isNum(line.pause) ? line.pause : 0);
          if (li < sceneLines.length - 1) cursor += C.GAP;
        }
        var L = {
          scene: si, sceneId: scene.id, index: li, flat: tl.lines.length,
          voice: line.voice === 'lectora' ? 'lectora' : 'narrador',
          text: line.text || '', say: line.say || '',
          rate: parseRate(line.rate != null ? line.rate : video.rate),
          start: start, dur: dur, end: start + dur,
          pause: isNum(line.pause) ? line.pause : 0,
          cifras: (line.cifras || []).slice(),
          ilustrativo: !!line.ilustrativo,
          advertencia: normalizeAdvertencia(line.advertencia),
          glossary: glossaryOf ? glossaryOf(line.text || '') : null,
          chunks: null
        };
        if (mline && Array.isArray(mline.chunks) && mline.chunks.length) {
          L.chunks = mline.chunks.map(function (c) { return { text: c.text, start: c.start, end: c.end }; });
        } else {
          L.chunks = chunkLine(line, si, li, L.flat, scene.id, L.start, L.end, opts);
        }
        seg.lines.push(L);
        tl.lines.push(L);
      });

      if (!manifest) {
        cursor += C.TAIL;
        seg.dur = Math.max(scene.min || 0, cursor);
      }
      seg.end = seg.start + seg.dur;
      seg.local = seg.lines.map(function (L) { return { start: L.start - seg.start, end: L.end - seg.start }; });
      tl.segments.push(seg);
      tl.scenes.push(seg);
      t = seg.end;

      (cpsAfter[si] || []).forEach(function (k) {
        var mc = manifest ? manifest.checkpoints[k] : null;
        var start = mc ? mc.start : t;
        var dur = mc ? mc.dur : C.CHECKPOINT;
        var cs = {
          kind: 'checkpoint', index: tl.segments.length, checkpoint: k, after: scene.id,
          afterScene: si, afterSegment: seg.index, chapter: seg.chapter,
          start: start, dur: dur, end: start + dur,
          questionEnd: start + Math.min(C.CHECKPOINT_QUESTION, dur),
          data: checkpoints[k]
        };
        tl.segments.push(cs);
        tl.checkpoints.push(cs);
        t = cs.end;
      });
    });

    tl.duration = manifest && isNum(manifest.duration) && manifest.duration > t ? manifest.duration : t;

    chapterDefs.forEach(function (ch, i) {
      var start = tl.scenes[chapterScene[i]].start;
      tl.chapters.push({ index: i, title: ch.title || '', from: ch.from, scene: chapterScene[i], start: start, end: 0 });
    });
    tl.chapters.forEach(function (ch, i) {
      ch.end = i < tl.chapters.length - 1 ? tl.chapters[i + 1].start : tl.duration;
    });

    var poster = video.poster && sceneIndexById[video.poster.scene] != null ?
      { scene: sceneIndexById[video.poster.scene], p: isNum(video.poster.p) ? video.poster.p : 0.5 } : null;
    tl.poster = poster;
    tl.overlays = buildOverlays(tl);
    return tl;
  }

  // Timed overlays the player draws over the scenes (prompt §6.4–§6.10).
  function buildOverlays(tl) {
    var warnings = [], illustrative = [], glossary = [], chapterTitles = [];
    var lines = tl.lines;
    lines.forEach(function (L, i) {
      var next = lines[i + 1];
      var scene = tl.scenes[L.scene];
      var beatEnd = next && next.scene === L.scene ? next.start : scene.end;
      var holdEnd = Math.min(L.end + C.HOLD, next ? next.start : tl.duration);

      var n = L.advertencia.length;
      L.advertencia.forEach(function (num, k) {
        var start = L.start + (n > 1 ? k * (L.dur / n) : 0);
        warnings.push({ n: num, start: start, end: start + C.WARNING, line: i, slot: 0 });
      });

      if (L.ilustrativo) {
        var last = illustrative[illustrative.length - 1];
        if (last && last.end >= L.start - 1e-9) last.end = Math.max(last.end, beatEnd);
        else illustrative.push({ start: L.start, end: beatEnd, line: i });
      }

      if (L.glossary) glossary.push({ entry: L.glossary, start: L.start, end: Math.max(L.end, holdEnd), line: i });
    });

    // Simultaneous stamps take separate slots so they never cover each other.
    warnings.sort(function (a, b) { return a.start - b.start; });
    warnings.forEach(function (w, i) {
      var taken = {};
      for (var j = 0; j < i; j++) if (warnings[j].end > w.start) taken[warnings[j].slot] = true;
      var slot = 0;
      while (taken[slot]) slot++;
      w.slot = slot;
    });

    tl.chapters.forEach(function (ch) {
      chapterTitles.push({ index: ch.index, title: ch.title, start: ch.start, end: ch.start + C.CHAPTER_TITLE });
    });
    return { warnings: warnings, illustrative: illustrative, glossary: glossary, chapterTitles: chapterTitles };
  }

  // ---------------------------------------------------------------------------------------------
  // Manifest entry, as tools/generate-voiceover.mjs writes it into assets/audio/manifest.js
  // (contracts §2): times in seconds from the start of the video, rounded to milliseconds.

  function r3(x) { return Math.round(x * 1000) / 1000; }

  function toManifest(tl, opts) {
    opts = opts || {};
    return {
      file: opts.file || tl.file || '',
      duration: r3(tl.duration),
      chapters: tl.chapters.map(function (c) { return { title: c.title, from: c.from, start: r3(c.start) }; }),
      scenes: tl.scenes.map(function (s) { return { id: s.id, start: r3(s.start), dur: r3(s.dur) }; }),
      lines: tl.lines.map(function (l) {
        return {
          scene: l.sceneId, index: l.index, start: r3(l.start), dur: r3(l.dur),
          chunks: l.chunks.map(function (c) { return { text: c.text, start: r3(c.start), end: r3(c.end) }; })
        };
      }),
      checkpoints: tl.checkpoints.slice().sort(function (a, b) { return a.checkpoint - b.checkpoint; })
        .map(function (c) { return { after: c.after, start: r3(c.start), dur: r3(c.dur) }; })
    };
  }

  EIA.engine.timeline = {
    C: C,
    build: build,
    toManifest: toManifest,
    parseRate: parseRate,
    speakable: speakable,
    countWords: countWords,
    estimateLine: estimateLine,
    normalizeAdvertencia: normalizeAdvertencia,
    frameTime: frameTime,
    fold: fold
  };
})(typeof window !== 'undefined' ? window : globalThis);
