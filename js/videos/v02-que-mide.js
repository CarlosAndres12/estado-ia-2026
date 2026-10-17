/* js/videos/v02-que-mide.js — V02 «¿Qué mide esta cifra?» (prompt §13, sesión 1; KB §3).
 *
 * Eleven scenes in three chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Cinco tipos de evidencia   titulares · capacidad · uso · resultado · expectativa · proyeccion ·
 *                                cinco-tipos. A meaning zone (prompt §4.1): the five types appear as
 *                                chips (sign + label, in their colors) and every floating sign is black.
 *   2 Leer la fuente             fuentes · muestra
 *   3 Cuatro advertencias        advertencias (this scene presses the stamps itself) · cierre
 *
 * Every type scene shows its example figure of KB §3.1 with its source tag, from the line that says
 * it to the end of the scene; the benchmark result lives inside a ruled navy panel (§3.5, §6.9);
 * the AI is only the small ruled lamp; people and places are warm and free.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings
 * it. Inside a line, a cue places a beat where the subtitles put its words (EIA.engine.captions:
 * chunks timed by their characters), so the visuals stay in sync when the voice is regenerated. A
 * figure lands by the time its subtitle chunk appears (prompt §6.8) and holds, exact and still,
 * to the end of the scene. No string, number or source is typed here: copy comes from s.rotulos
 * (js/data/videos.js), values from env.chart.parseValue(rótulo), sources from env.tags. Draw
 * functions are pure functions of (s, env): motion comes from s.t, geometry is built in setup(). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.videos = EIA.videos || {};

  var W = 1280, H = 720;
  var CHIP = { x: 64, y: 40, size: 26 };   // where each type scene writes its chip
  var TAU = Math.PI * 2;

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)); }
  // A beat inside a line: like seg on s.at(i), but never before the line starts (a cue at 0).
  function beat(at, a, b) { return at <= 0 ? 0 : seg(at, Math.max(0, a), b); }
  function out3(t) { t = 1 - clamp01(t); return 1 - t * t * t; }
  function inOut3(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function noise(x, seed) { return EIA.engine.rng.noise1(x, seed); }
  function rot(s, key) { var r = s.rotulos && s.rotulos[key]; return r ? r.text : ''; }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    capacidad: { osworld: [1, 'OSWorld', 'word'], cifras: [1, '12%', 'chunk'] },
    uso: { tipo: [0, 'el uso declarado', 'word'], cifra: [0, '88%', 'chunk'] },
    resultado: { cifra: [1, '19%', 'chunk'], metr: [1, 'METR', 'chunk'] },
    expectativa: { plazo: [0, '12 a 18', 'chunk'] },
    proyeccion: { cifra: [0, '39%', 'chunk'] },
    'cinco-tipos': { t0: [0, 'Capacidad técnica', 'word'], t1: [0, 'uso declarado', 'word'], t2: [0, 'resultado observado', 'word'],
      t3: [0, 'expectativa', 'word'], t4: [0, 'proyección', 'word'], cada: [0, 'Cada tipo', 'chunk'] },
    fuentes: { lim0: [0, 'pero muchas', 'word'], lim1: [1, 'pero miden', 'word'], mck: [1, 'McKinsey', 'word'], lim2: [1, 'con autoinforme', 'word'],
      lim3: [2, 'y muestra', 'word'], bench: [2, 'Y los benchmarks', 'word'], lim4: [2, 'se saturan', 'word'] },
    muestra: { censo: [0, 'no un censo', 'word'], cobertura: [0, 'Una cobertura', 'chunk'] },
    advertencias: { a1: [0, 'Uso no es valor', 'word'], a2: [0, 'Benchmark no es', 'word'], a3: [1, 'Exposición', 'word'], a4: [1, 'asociación', 'word'] },
    cierre: { fuente: [0, 'su fuente', 'word'], evidencia: [0, 'evidencia', 'word'], asi: [0, 'Así empieza', 'chunk'] }
  };

  // Share of a line at which `needle` shows in its subtitles: chunks are timed by their characters
  // (captions.timeChunks without word offsets), so this follows the subtitle timing.
  function cueShare(text, needle, kind) {
    var i = text.indexOf(needle);
    if (i < 0 || !text.length) return null;
    var cap = EIA.engine.captions, chunks = cap && cap.chunk ? cap.chunk(text) : [text];
    var total = 0, acc = 0, from = 0, k;
    for (k = 0; k < chunks.length; k++) total += chunks[k].length || 1;
    for (k = 0; k < chunks.length; k++) {
      var c = chunks[k], at = text.indexOf(c, from), len = c.length || 1;
      if (at < 0) at = from;
      if (i >= at && i < at + c.length) return kind === 'chunk' ? acc / total : (acc + (i - at)) / total;
      from = at + c.length;
      acc += len;
    }
    return i / text.length;
  }

  function resolveCues(video) {
    var out = {};
    Object.keys(CUES).forEach(function (sceneId) {
      var scene = null;
      ((video && video.scenes) || []).forEach(function (sc) { if (sc.id === sceneId) scene = sc; });
      out[sceneId] = {};
      Object.keys(CUES[sceneId]).forEach(function (key) {
        var spec = CUES[sceneId][key], line = scene && scene.lines[spec[0]];
        var v = line ? cueShare(line.text, spec[1], spec[2]) : null;
        out[sceneId][key] = v == null ? 0.5 : v;
      });
    });
    return out;
  }

  // A figure grows over a short window that ends when its subtitle chunk appears (or early in the
  // line when the number is in its first chunk); its value label then fades in.
  function landWindow(cs) {
    var a = Math.max(0.02, cs - 0.1);
    return [a, Math.max(a + 0.07, cs)];
  }

  function findVideo(id) {
    var list = (EIA.data && EIA.data.videos) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function bg(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v02:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus static drawing.
  function groundLayer(kind, opts, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d');
      var o = { seed: 'v02:pagina' };
      for (var k in opts) o[k] = opts[k];
      env.ink.background(g, kind, o);
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. Black only in the meaning zone (mono).
  // f = [name, x, y, size, color?]; keep them clear of the subtitle band (y > 570).
  function floaters(ctx, s, env, list, o) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v02:fx' + i) * 9, f[2] + noise(t * 0.8, 'v02:fy' + i) * 7, f[3], {
        seed: 'v02:float' + f[0] + i, mono: !!o.mono, colors: f[4] ? { a: f[4] } : null, rot: noise(t * 0.6, 'v02:fr' + i) * 0.14, p: o.p
      });
    }
  }

  function typeChip(ctx, env, clase, label, p) {
    return env.tags.chip(ctx, clase, label, { x: CHIP.x, y: CHIP.y, size: CHIP.size, pill: true, p: p });
  }

  // Hero numbers are lettered without colored counters or stars, so every digit reads clearly.
  function hero(ctx, env, text, x, y, size, o) {
    return env.ink.letter(ctx, text, x, y, {
      size: size, align: o.align || 'left', counters: 0, stars: false, underline: false, seed: o.seed, p: o.p,
      color: o.color, maxWidth: o.maxWidth, maxLines: 1
    });
  }

  // Point at share u of a sampled path, with its unit normal and heading.
  function pathAt(g, u, outp) {
    var d = clamp01(u) * g.len, lo = 0, hi = g.n - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (g.s[mid] <= d) lo = mid; else hi = mid - 1;
    }
    var i = Math.min(lo, g.n - 2), sl = g.s[i + 1] - g.s[i] || 1, f = clamp01((d - g.s[i]) / sl);
    var dx = g.x[i + 1] - g.x[i], dy = g.y[i + 1] - g.y[i], dl = Math.sqrt(dx * dx + dy * dy) || 1;
    outp.x = g.x[i] + dx * f; outp.y = g.y[i] + dy * f;
    outp.nx = -dy / dl; outp.ny = dx / dl; outp.a = Math.atan2(dy, dx);
    return outp;
  }
  function samplePath(ink, ctrl, step) {
    var p = ink.smoothPath(ctrl, false, step || 5), acc = new Float32Array(p.n);
    for (var i = 1; i < p.n; i++) acc[i] = acc[i - 1] + Math.sqrt(Math.pow(p.x[i] - p.x[i - 1], 2) + Math.pow(p.y[i] - p.y[i - 1], 2));
    return { x: p.x, y: p.y, s: acc, n: p.n, len: acc[p.n - 1] || 1 };
  }
  // Control points of a curve that follows path g from u0 to u1, offset by d across it.
  function alongPath(g, u0, u1, d, n) {
    var out = [], q = {};
    for (var i = 0; i <= n; i++) {
      pathAt(g, lerp(u0, u1, i / n), q);
      out.push(q.x + q.nx * d, q.y + q.ny * d);
    }
    return out;
  }
  function quad(x0, y0, cx, cy, x1, y1, t, outp) {
    var a = 1 - t;
    outp.x = a * a * x0 + 2 * a * t * cx + t * t * x1;
    outp.y = a * a * y0 + 2 * a * t * cy + t * t * y1;
    return outp;
  }
  function insidePoly(pts, x, y) {
    var inside = false;
    for (var i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      var xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  var Q1 = {}, Q2 = {};   // scratch points, overwritten by every call (no state across frames)

  // ---------------------------------------------------------------------------------------------
  // 1 · titulares — headlines blow across the page like leaves; the lectora catches one.

  var TIT = { lectora: { x: 930, y: 568, k: 3.3 }, speed: 1 / 17 };
  var TIT_FLOAT = [['estrella', 176, 160, 50], ['espiral', 360, 420, 46], ['luna', 610, 200, 46]];

  function setupTitulares(env) {
    var ink = env.ink, m = env.pal.mundo, r = env.rng('v02:titulares');
    var gust = samplePath(ink, [-220, 500, 10, 370, 210, 250, 440, 190, 640, 250, 660, 400, 520, 460, 370, 390, 390, 250, 540, 160,
      780, 120, 1020, 140, 1520, 20], 5);
    var heads = [m.rojo, null, m.amarillo, null, m.azul, m.rojo, null, m.amarillo, null];
    var items = [];
    for (var i = 0; i < 9; i++) {
      items.push({ u0: i / 9 + r.jitter(0.02), lane: r.jitter(48), k: r.range(0.72, 1.12), spin: r.range(0.25, 0.6) * r.sign(),
        tilt: r.jitter(0.5), ph: r() * 6, seed: 'v02:titular' + (i % 4), masthead: heads[i] });
    }
    return {
      gust: gust, items: items,
      winds: [alongPath(gust, 0.04, 0.36, -76, 8), alongPath(gust, 0.34, 0.6, 70, 7), alongPath(gust, 0.62, 0.92, -60, 7)],
      pct: [{ u0: 0.17, lane: 34, size: 92 }, { u0: 0.5, lane: -40, size: 76 }, { u0: 0.83, lane: 20, size: 104 }]
    };
  }

  // Position on the gust at time t; after the lectora's line starts (T1) every leaf is blown off
  // the page along the rest of the gust as `away` goes 0 → 1.
  function leafAt(st, u0, lane, ph, t, T1, away, outp) {
    var u;
    if (t < T1 || away <= 0) {
      u = u0 + TIT.speed * t;
      u -= Math.floor(u);
    } else {
      var u1 = u0 + TIT.speed * T1;
      u1 -= Math.floor(u1);
      u = lerp(u1 + TIT.speed * (t - T1), 1.08, inOut3(away));
    }
    pathAt(st.gust, u, outp);
    outp.x += outp.nx * lane + (u > 1 ? (u - 1) * 2400 : 0);
    outp.y += outp.ny * lane + noise(t * 0.5 + ph, 'v02:tb') * 10 - (u > 1 ? (u - 1) * 600 : 0);
    outp.u = u;
    return outp;
  }

  function titulares(ctx, s, env) {
    var st = s.state.titulares, ink = env.ink, fig = env.fig;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    var T1 = s.lines[1] ? s.lines[1].start : s.dur;
    var away = beat(s.at(1), 0.04, 0.5);
    // Once the gust has gone, a few black signs drift on the quiet page (meaning zone: black only).
    if (away > 0) floaters(ctx, s, env, TIT_FLOAT, { mono: true, p: seg(away, 0.4, 1) });
    // Wind strokes of the gust: thin, black, ending in a dot; they settle when the wind drops.
    for (var w = 0; w < st.winds.length; w++) {
      ink.line(ctx, st.winds[w], { w: 2.6, profile: 'hair', seed: 'v02:wind' + w, dot: 'detached', p: seg(s.intro, w * 0.15, 0.6 + w * 0.15),
        alpha: 0.7 * (1 - away) });
    }
    // The headline she catches: the one nearest the middle of the swirl when her line starts.
    var caught = 0, best = 9, i;
    for (i = 0; i < st.items.length; i++) {
      var ui = st.items[i].u0 + TIT.speed * T1;
      ui -= Math.floor(ui);
      if (Math.abs(ui - 0.5) < best) { best = Math.abs(ui - 0.5); caught = i; }
    }
    for (var j = 0; j < st.pct.length; j++) {
      var pc = st.pct[j];
      leafAt(st, pc.u0, pc.lane, j * 3, s.t, T1, away, Q1);
      if (Q1.u > 1.06) continue;
      ctx.save();
      ctx.translate(Q1.x, Q1.y);
      ctx.rotate(noise(s.t * 0.3 + j, 'v02:pr') * 0.5);
      hero(ctx, env, rot(s, 'signoPorcentaje'), 0, -pc.size * 0.6, pc.size, { align: 'center', seed: 'v02:pct' + j, p: intro });
      ctx.restore();
    }
    for (i = 0; i < st.items.length; i++) {
      if (i === caught && s.t >= T1) continue;
      var it = st.items[i];
      leafAt(st, it.u0, it.lane, it.ph, s.t, T1, away, Q1);
      if (Q1.u > 1.06) continue;
      fig.headline(ctx, Q1.x, Q1.y, it.k, { seed: it.seed, masthead: it.masthead, rot: it.tilt + Math.sin(s.t * it.spin + it.ph) * 0.45, p: intro });
    }

    var L = TIT.lectora;
    var lp = out3(beat(s.at(0), 0.75, 1));
    if (lp > 0) fig.lectora(ctx, L.x, L.y, L.k, { pose: 'catching', facing: -1, p: lp });
    if (s.t >= T1) {
      // It leaves the swirl where it was and lands in her open notebook.
      var c = st.items[caught];
      leafAt(st, c.u0, c.lane, c.ph, T1, T1, 0, Q2);
      var e = inOut3(seg(s.at(1), 0, 0.4));
      var nx = L.x - 16 * L.k, ny = L.y - 72 * L.k;
      quad(Q2.x, Q2.y, lerp(Q2.x, nx, 0.5), Math.min(Q2.y, ny) - 140, nx, ny, e, Q1);
      var r0 = c.tilt + Math.sin(T1 * c.spin + c.ph) * 0.45;
      fig.headline(ctx, Q1.x, Q1.y, lerp(c.k, 0.56, e), { seed: c.seed, masthead: c.masthead, rot: lerp(r0, -0.16, e) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · capacidad — a small ruled navy test panel on the page: the lamp reads a test sheet; a ruled
  // bar goes from its ~12% mark to 66,3% on one zero-based scale (0–100%).

  var CAPA = {
    panel: { x: 84, y: 126, w: 664, h: 384 },
    sheet: { x: 116, y: 158, w: 150, h: 132, rows: 5 },
    track: { x: 124, y: 404, len: 560, h: 42 },
    tag: { x: 776, y: 428 }
  };

  function capacidad(ctx, s, env) {
    var C = s.state.cues.capacidad, ink = env.ink, fig = env.fig, chart = env.chart, q = env.pal.maquina, m = env.pal.mundo;
    var P = CAPA.panel, S = CAPA.sheet, T = CAPA.track;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1188, 112, 46], ['espiral', 548, 78, 40]], { mono: true, p: out3(s.intro) });
    typeChip(ctx, env, 'capacidad', rot(s, 'chip'), out3(seg(s.at(0), 0, 0.3)));

    // The panel slides in under a ruler (revealed top to bottom).
    var pr = inOut3(s.intro);
    if (pr > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(P.x - 2, P.y - 2, P.w + 4, (P.h + 4) * pr);
      ctx.clip();
      fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 14 });
      ctx.restore();
    }
    // The test sheet, and the lamp working down its rows.
    var a0 = s.at(0), sp = seg(a0, 0.05, 0.3);
    ink.rRect(ctx, S.x, S.y, S.w, S.h, { color: q.linea, w: 1.4, fill: q.noche, p: sp });
    ink.rLine(ctx, S.x, S.y + 26, S.x + S.w, S.y + 26, { color: q.linea, w: 1.2, p: seg(sp, 0.5, 1) });
    var read = seg(a0, 0.3, 1) * S.rows, i;
    for (i = 0; i < S.rows; i++) {
      var ry = S.y + 46 + i * 20, rp = seg(a0, 0.12 + i * 0.03, 0.22 + i * 0.03);
      if (rp <= 0) continue;
      ink.rRect(ctx, S.x + 12, ry - 5, 10, 10, { color: q.linea, w: 1.1, p: rp });
      ctx.save();
      ctx.globalAlpha *= read > i + 0.5 ? 1 : 0.45;
      ink.rLine(ctx, S.x + 32, ry, S.x + S.w - 14, ry, { color: q.linea, w: 1.1, p: rp });
      ctx.restore();
    }
    var lampY = S.y + 46 + Math.min(S.rows - 1, Math.max(0, read - 0.5)) * 20;
    var lampP = seg(a0, 0.12, 0.32);
    if (lampP > 0) {
      ink.rLine(ctx, S.x + S.w - 8, lampY, S.x + S.w + 30, lampY, { color: q.brilloVerde, w: 1.2, p: lampP });
      fig.lamp(ctx, S.x + S.w + 56, lampY, 0.44, { t: s.t, p: lampP });
    }

    // Line 2: the bar on one zero-based scale, 0 → ~12% → 66,3%. Both numbers are in the line's
    // first subtitle chunk, so both land early and hold, exact and still, while they are said.
    var a1 = s.at(1), cs = C.cifras;
    var win = [cs + 0.03, cs + 0.34];
    var tp = out3(seg(a1, 0, 0.08));
    if (tp > 0) {
      ctx.save();
      ctx.globalAlpha *= tp;
      ink.rRect(ctx, T.x, T.y, T.len, T.h, { color: q.linea, w: 1.1, dash: [5, 5] });
      ctx.restore();
      chart.baseline(ctx, T.x, T.y - 12, T.y + T.h + 12, { p: tp, style: 'ruled' });
      ink.text(ctx, rot(s, 'etiqueta'), T.x, T.y - 62, { size: 26, weight: 700, color: m.lienzo, p: seg(a1, Math.min(C.osworld, 0.2) - 0.04, Math.min(C.osworld, 0.2) + 0.06) });
    }
    var sc = chart.scale(100, T.x, T.len);
    var v0 = chart.parseValue(rot(s, 'inicio')), v1 = chart.parseValue(rot(s, 'final'));
    var mid = lerp(win[0], win[1], 0.3);
    var g1 = out3(seg(a1, win[0], mid)), g2 = out3(seg(a1, mid + 0.05, win[1]));
    var value = g2 > 0 ? lerp(v0.value, v1.value, g2) : v0.value * g1;
    var cap = g2 > 0 ? 'exact' : g1 >= 1 ? 'approx' : 'exact';
    if (value > 0) chart.bar(ctx, { value: value, scale: sc, y: T.y, h: T.h, style: 'ruled', labels: false, cap: cap, seed: 'v02:capbar', p: 1 });
    var x12 = sc(v0.value), x66 = sc(v1.value);
    var l12 = seg(a1, mid, mid + 0.04);
    if (l12 > 0) {
      // The ~12% mark stays on the track (dotted: approximate), its label below it.
      ctx.save();
      ctx.globalAlpha *= l12;
      ink.rLine(ctx, x12, T.y - 10, x12, T.y + T.h + 10, { color: m.lienzo, w: 1.6, dash: [3, 4] });
      ctx.restore();
      ink.text(ctx, rot(s, 'inicio'), x12, T.y + T.h + 16, { size: 30, weight: 700, align: 'center', color: m.lienzo, p: l12 });
    }
    var l66 = seg(a1, win[1], win[1] + 0.04);
    if (l66 > 0) ink.text(ctx, rot(s, 'final'), x66, T.y - 66, { size: 46, weight: 700, align: 'center', color: m.lienzo, p: l66 });
    // One tag for both numbers (cap-1), tied to the bar's value edge, from the first number on.
    var tagP = seg(a1, win[0] + 0.02, mid + 0.04);
    if (tagP > 0 && value > 0) env.tags.sourceTag(ctx, 'cap-1', { x: CAPA.tag.x, y: CAPA.tag.y, anchor: { x: sc(value), y: T.y + T.h / 2 }, p: tagP, scale: 1.08 });
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · uso — a warm office; speech bubbles rise and merge into one big bubble «88%».

  var USO = {
    people: [
      { role: 'directiva', x: 206, pose: 'presenting', facing: 1, skin: 3, hair: 'bun', seed: 'v02:uso0' },
      { role: 'servidor', x: 342, pose: 'asking', facing: 1, skin: 0, hair: 'short', seed: 'v02:uso1' },
      { role: 'docente', x: 944, pose: 'presenting', facing: -1, skin: 4, hair: 'curly', seed: 'v02:uso2' },
      { role: 'desarrollador', x: 1076, pose: 'asking', facing: -1, skin: 1, hair: 'long', seed: 'v02:uso3' }
    ],
    feet: 574, k: 1.95,
    big: { x: 640, y: 182, w: 410, h: 244 },
    tag: { x: 866, y: 66 }
  };

  function smallBubble(ctx, env, x, y, k, a, seed, p, tail) {
    if (a <= 0 || k <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(k, k);
    env.fig.bubble(ctx, -38, -26, 76, 52, { seed: seed, p: p, w: 3.6, tail: tail ? { x: -26, y: 44 } : null });
    for (var i = 0; i < SCRIBBLES.length; i++) {
      env.ink.line(ctx, SCRIBBLES[i], { w: 2.4, profile: 'even', seed: seed + 's' + i, p: seg(p, 0.5 + i * 0.2, 0.9 + i * 0.1) });
    }
    ctx.restore();
  }
  var SCRIBBLES = [[-24, -7, -10, -10, 4, -6, 24, -9], [-24, 8, -8, 5, 10, 9, 18, 7]];

  function uso(ctx, s, env) {
    var C = s.state.cues.uso, ink = env.ink, fig = env.fig;
    fig.oficina(ctx, 0, 0, 1, { seed: 'v02:oficina', p: out3(s.intro) });
    typeChip(ctx, env, 'uso', rot(s, 'chip'), out3(seg(s.at(0), C.tipo - 0.04, C.tipo + 0.08)));
    var a = s.at(0), B = USO.big, win = landWindow(C.cifra), merge = win[0];
    for (var i = 0; i < USO.people.length; i++) {
      var pp = USO.people[i];
      fig.person(ctx, pp.x, USO.feet, USO.k, { role: pp.role, pose: pp.pose, facing: pp.facing, skin: pp.skin, hair: pp.hair, seed: pp.seed,
        height: 1, p: out3(seg(s.intro, i * 0.1, 0.6 + i * 0.1)) });
    }
    // Two bubbles from each person rise and merge into the big one.
    for (var k = 0; k < 8; k++) {
      var who = USO.people[k % 4], born = 0.03 + k * 0.042;
      var e = seg(a, born, merge + 0.02);
      if (e <= 0 || e >= 1) continue;
      var hx = who.x + who.facing * 24, hy = USO.feet - 212 - (k >= 4 ? 16 : 0);
      var ee = inOut3(e);
      quad(hx, hy, lerp(hx, B.x, 0.25) + (k % 2 ? 40 : -40), lerp(hy, B.y, 0.75), B.x + ((k % 4) - 1.5) * 50, B.y + 30, ee, Q1);
      var pop = out3(seg(e, 0, 0.18));
      smallBubble(ctx, env, Q1.x + Math.sin(s.t * 1.3 + k) * 6 * (1 - ee), Q1.y, lerp(1, 0.5, ee) * (0.6 + 0.4 * pop), 1 - seg(e, 0.86, 1), 'v02:sb' + (k % 3), pop, true);
    }
    var be = out3(seg(a, merge - 0.02, win[1] - 0.04));
    if (be > 0) {
      ctx.save();
      ctx.translate(B.x, B.y);
      ctx.scale(0.55 + 0.45 * be, 0.55 + 0.45 * be);
      fig.bubble(ctx, -B.w / 2, -B.h / 2, B.w, B.h, { seed: 'v02:grande', p: be, w: 4.6 });
      ctx.restore();
      var np = seg(a, win[1] - 0.05, win[1]);
      hero(ctx, env, rot(s, 'cifra'), B.x, B.y - 104, 112, { align: 'center', seed: 'v02:88', p: np });
      ink.text(ctx, rot(s, 'etiqueta'), B.x, B.y + 30, { size: 23, weight: 700, maxWidth: 300, align: 'center', lineHeight: 1.12, p: seg(a, win[1] - 0.02, win[1] + 0.04) });
      env.tags.sourceTag(ctx, 'adop-1', { x: USO.tag.x, y: USO.tag.y, anchor: { x: B.x + 150, y: B.y - 52 }, p: seg(a, win[1] - 0.04, win[1] + 0.05), scale: 1.08 });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · resultado — beside a developer's desk, two stopwatches on one clock: the run with AI (the
  // small lamp marks it) takes exactly 1,19 times as long (+19%, parsed from the rótulo).

  var RES = {
    floor: 584, dev: { x: 262, k: 2.55 }, desk: { x: 262, k: 0.62 },
    wA: { x: 640, y: 292 }, wB: { x: 928, y: 292 }, wk: 1.36,
    base: 0.7,                // share of a turn the run without AI fills: the shared unit of both dials
    label: { x: 928, y: 390 }, tag: { x: 800, y: 454 },
    note: { x: 936, y: 58, w: 296, h: 98 }
  };

  function resultado(ctx, s, env) {
    var C = s.state.cues.resultado, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['espiral', 556, 104, 40], ['estrella', 1200, 520, 34]], { mono: true, p: out3(s.intro) });
    typeChip(ctx, env, 'resultado', rot(s, 'chip'), out3(seg(s.at(0), 0, 0.3)));
    var intro = out3(s.intro);
    fig.desk(ctx, RES.desk.x, RES.floor - 6, RES.desk.k, { p: intro });
    fig.person(ctx, RES.dev.x, RES.floor, RES.dev.k, { role: 'desarrollador', pose: 'reading', prop: 'laptop', seed: 'v02:dev', hair: 'short', skin: 3,
      height: 1, glasses: true, facing: 1, p: intro });

    // One clock for both runs: the hands sweep together; A stops at the base, B at base × (1 + 19/100).
    var pv = env.chart.parseValue(rot(s, 'cifra'));
    var ratio = 1 + (pv ? pv.value : 0) / 100, end = RES.base * ratio;
    var a1 = s.at(1), win = landWindow(C.cifra), wp = seg(s.at(0), 0.25, 0.6);
    var sweep = seg(a1, win[0], win[1] + 0.12) * end;
    fig.stopwatch(ctx, RES.wA.x, RES.wA.y, RES.wk, { elapsed: Math.min(sweep, RES.base), p: wp, seed: 'a' });
    fig.stopwatch(ctx, RES.wB.x, RES.wB.y, RES.wk, { elapsed: sweep, mark: RES.base, p: wp, seed: 'b' });
    fig.lamp(ctx, RES.wB.x + 98, RES.wB.y - 76, 0.3, { t: s.t, p: seg(s.at(0), 0.45, 0.7) });
    var landed = seg(a1, win[1] + 0.12, win[1] + 0.16);

    // The magnifier looks at one watch, then the other, and rests on the extra time.
    var lp = seg(s.at(0), 0.35, 0.6);
    if (lp > 0) {
      var aB = -Math.PI / 2 + TAU * (RES.base + end) / 2;
      var restX = RES.wB.x + Math.cos(aB) * 30 * RES.wk, restY = RES.wB.y + Math.sin(aB) * 30 * RES.wk;
      var look = inOut3(seg(s.at(0), 0.55, 0.9));
      var mx = lerp(lerp(1240, RES.wA.x + 20, out3(lp)), RES.wB.x - 10, look), my = lerp(RES.wA.y - 12, RES.wB.y - 12, look);
      var settle = inOut3(seg(a1, win[0], win[1] + 0.12));
      mx = lerp(mx, restX, settle) + Math.sin(s.t * 0.7) * 3 * (1 - settle);
      my = lerp(my, restY, settle) + Math.cos(s.t * 0.6) * 3 * (1 - settle);
      ink.draw(ctx, s.state.lupa, mx, my, 0.74, { p: lp });
    }
    if (landed > 0) {
      var LB = ink.text(ctx, rot(s, 'cifra'), RES.label.x, RES.label.y, { size: 38, weight: 700, align: 'center', p: landed });
      // The thread leaves the number's lower-left corner, so it never crosses the tag's text.
      env.tags.sourceTag(ctx, 'prod-3', { x: RES.tag.x, y: RES.tag.y, anchor: { x: RES.label.x - LB.w / 2 + 10, y: RES.label.y + LB.h - 4 }, p: landed, scale: 1.08 });
    }
    // The pinned note: METR itself marks the study as outdated.
    var np = seg(a1, C.metr - 0.02, C.metr + 0.08);
    if (np > 0) {
      var N = RES.note;
      ctx.save();
      ctx.translate(N.x + N.w / 2, N.y + N.h / 2);
      ctx.rotate(0.035);
      ink.card(ctx, -N.w / 2, -N.h / 2, N.w, N.h, { seed: 'v02:nota', weight: 3, radius: 8, p: np, peek: m.amarillo, peekCorner: 'tr' });
      ink.text(ctx, rot(s, 'nota'), -N.w / 2 + 22, -N.h / 2 + 20, { size: 23, italic: true, maxWidth: N.w - 40, lineHeight: 1.22, p: seg(np, 0.3, 1) });
      ink.circle(ctx, 0, -N.h / 2 + 2, 7, { fill: m.rojo, w: 2.2, seed: 'v02:chincheta', p: seg(np, 0, 0.5) });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · expectativa — a manager looks through a spyglass at small lamps lining up on the horizon;
  // the expected time is a band from month 12 to month 18 on a calendar strip of 24 months.

  var EXP = {
    horizon: 0.46,
    directiva: { x: 168, y: 578, k: 2.75 },
    lamps: { x: 700, y: 312, gap: 104, n: 5, k: 0.3 },
    strip: { x: 330, y: 474, cell: 24, h: 48, months: 24 },
    label: { y: 414 },
    tag: { x: 940, y: 456 }
  };

  function expectativa(ctx, s, env) {
    var C = s.state.cues.expectativa, st = s.state.expectativa, ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo;
    bg(ctx, s, env, 'territorio');
    floaters(ctx, s, env, [['estrella', 1180, 92, 40], ['estrella', 980, 170, 26]], { mono: true, p: out3(s.intro) });
    typeChip(ctx, env, 'expectativa', rot(s, 'chip'), out3(seg(s.at(0), 0, 0.25)));
    var a = s.at(0), D = EXP.directiva, win = landWindow(C.plazo);
    fig.person(ctx, D.x, D.y, D.k, { role: 'directiva', pose: 'pointing', prop: 'spyglass', seed: 'v02:directiva', skin: 4, hair: 'bun', height: 1, p: out3(s.intro) });
    ink.dotted(ctx, st.sight, { r: 2.2, gap: 14, p: seg(a, 0.06, 0.25), seed: 'v02:mirada' });
    for (var i = 0; i < EXP.lamps.n; i++) {
      var lpi = seg(a, 0.08 + i * 0.04, 0.16 + i * 0.04);
      if (lpi > 0) fig.lamp(ctx, EXP.lamps.x + i * EXP.lamps.gap, EXP.lamps.y + Math.sin(s.t * 0.8 + i) * 1.5, EXP.lamps.k, { t: s.t + i, p: lpi });
    }
    // The calendar strip: 24 months from now; the band 12–18 grows from its start when it is said.
    var S = EXP.strip, len = S.cell * S.months, sp = seg(a, win[0] - 0.12, win[0]);
    if (sp > 0) {
      ink.card(ctx, S.x - 12, S.y - 12, len + 24, S.h + 24, { seed: 'v02:calendario', weight: 3.4, radius: 10, p: sp });
      for (i = 0; i < 6; i++) ink.circle(ctx, S.x + 24 + i * (len - 48) / 5, S.y - 12, 6, { line: true, w: 2.4, seed: 'v02:anillo' + i, p: seg(sp, 0.4, 1) });
      for (i = 0; i < st.ticks.length; i++) ink.line(ctx, st.ticks[i], { w: i % 6 === 0 ? 2.4 : 1.6, profile: 'even', seed: 'v02:mes' + i, p: seg(sp, 0.3 + i * 0.02, 0.5 + i * 0.02) });
      var pv = chart.parseValue(rot(s, 'plazo'));
      var sc = chart.scale(S.months, S.x, len);
      chart.band(ctx, { lo: pv.lo, hi: pv.value, scale: sc, y: S.y + 4, h: S.h - 8, color: m.rojo, zeroLine: false, p: seg(a, win[0], win[1]) });
      var lab = seg(a, win[1], win[1] + 0.05);
      if (lab > 0) {
        ink.text(ctx, rot(s, 'plazo'), sc((pv.lo + pv.value) / 2), EXP.label.y, { size: 38, weight: 700, align: 'center', p: lab });
        env.tags.sourceTag(ctx, 'adop-8', { x: EXP.tag.x, y: EXP.tag.y, anchor: { x: sc(pv.value), y: S.y + S.h / 2 }, p: lab, scale: 1.08 });
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · proyeccion — a comet with a dotted tail crosses the sky toward a small road sign «2030».

  var PRO = {
    horizon: 0.7,
    sign: { x: 1098, y: 520, k: 0.84 },
    number: { x: 150, y: 190 }, label: { x: 384, y: 214, w: 380 }, tag: { x: 164, y: 330 },
    flight: 0.82               // share of the arc flown before the figure shows; the rest drifts slowly
  };

  function proyeccion(ctx, s, env) {
    var C = s.state.cues.proyeccion, st = s.state.proyeccion, ink = env.ink, fig = env.fig;
    bg(ctx, s, env, 'territorio');
    floaters(ctx, s, env, [['estrella', 640, 410, 30], ['estrella', 1040, 84, 28], ['estrella', 880, 450, 22], ['estrella', 1214, 236, 24]],
      { mono: true, p: out3(s.intro) });
    typeChip(ctx, env, 'proyeccion', rot(s, 'chip'), out3(seg(s.at(0), 0, 0.25)));
    var a = s.at(0), win = landWindow(C.cifra);
    fig.roadSign(ctx, PRO.sign.x, PRO.sign.y, PRO.sign.k, { text: rot(s, 'senal'), p: out3(seg(s.intro, 0.2, 1)), seed: 'v02:senal' });
    // The comet flies most of its arc before the figure shows, then drifts on toward the sign.
    var u = PRO.flight * inOut3(beat(a, 0, win[0])) + (1 - PRO.flight) * beat(a, win[0], 1);
    if (u > 0) {
      // The sign's own tail trails ~170 px behind its head; the path keeps a longer, fading trail.
      var g = st.path, per = 22 / g.len;
      for (var i = 16; i >= 7; i--) {
        var ub = u - i * per;
        if (ub <= 0) continue;
        pathAt(g, ub, Q2);
        var tw = 0.8 + 0.2 * Math.sin(s.t * 2.2 + i);
        ink.dot(ctx, Q2.x, Q2.y, Math.max(1.3, 5.6 - (i - 7) * 0.45) * tw, env.pal.mundo.tinta);
      }
      pathAt(g, u, Q1);
      var ro = Q1.a + 0.686, hx = 44 * Math.cos(ro) + 36 * Math.sin(ro), hy = 44 * Math.sin(ro) - 36 * Math.cos(ro);
      fig.sign(ctx, 'cometa', Q1.x - hx, Q1.y - hy + Math.sin(s.t * 0.9) * 3, 200, { seed: 'v02:cometa', mono: true, rot: ro });
    }
    var np = beat(a, win[0], win[1]);
    if (np > 0) {
      var N = PRO.number, LB = PRO.label;
      var L = hero(ctx, env, rot(s, 'cifra'), N.x, N.y, 98, { seed: 'v02:39', p: np });
      ink.text(ctx, rot(s, 'etiqueta'), LB.x, LB.y, { size: 27, weight: 700, maxWidth: LB.w, lineHeight: 1.18, p: seg(np, 0.3, 1) });
      env.tags.sourceTag(ctx, 'trab-5', { x: PRO.tag.x, y: PRO.tag.y, anchor: { x: N.x + 12, y: N.y + L.h - 18 }, p: np, scale: 1.08 });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · cinco-tipos — the five chips settle into a legend row; the bar, the bubble, the stopwatch,
  // the spyglass and the comet each fly to their chip as it is named; then a headline mixes them.

  var CINCO = {
    chip: 20, gap: 18, y: 236, iconY: 148, que: { size: 18, gap: 10 },
    keys: ['queCapacidad', 'queUso', 'queResultado', 'queExpectativa', 'queProyeccion'],
    headline: { x: 560, y: 494, k: 1.12 }, lectora: { x: 1136, y: 576, k: 2.05 }
  };
  var CINCO_FROM = [[-160, 120], [640, -140], [1440, 120], [-160, 520], [1440, 520]];

  function cincoIcon(ctx, env, k) {
    var ink = env.ink, fig = env.fig, q = env.pal.maquina;
    switch (k) {
      case 0:   // the ruled bar of a benchmark, in its navy panel (an icon: it encodes no value)
        fig.panel(ctx, -70, -42, 140, 84, { cell: 10, construction: false });
        ink.rRect(ctx, -54, -11, 108, 22, { color: q.linea, w: 1.1, dash: [3, 3] });
        ink.rRect(ctx, -54, -11, 68, 22, { color: q.linea, w: 1.3, fill: q.linea, fillAlpha: 0.85 });
        break;
      case 1:
        smallBubble(ctx, env, 0, -4, 1.5, 1, 'v02:icono-bocadillo', 1, true);
        break;
      case 2:
        fig.stopwatch(ctx, 0, 6, 0.74, { turn: 0.3, seed: 'v02:icono' });
        break;
      case 3:
        fig.spyglass(ctx, 0, 0, 0.7, { seed: 'v02:icono' });
        break;
      case 4:
        fig.sign(ctx, 'cometa', 0, 0, 132, { seed: 'v02:icono-cometa', mono: true, rot: 0.2 });
        break;
    }
  }

  function cincoTipos(ctx, s, env) {
    var C = s.state.cues['cinco-tipos'], st = s.state.cinco, ink = env.ink, fig = env.fig;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 990, 500, 40], ['espiral', 96, 104, 40], ['luna', 196, 470, 40]], { mono: true, p: out3(s.intro) });
    var a0 = s.at(0), a1 = s.at(1);
    var cue = [C.t0, C.t1, C.t2, C.t3, C.t4];
    // Chips fly from where each type scene wrote them into the legend row, one by one.
    for (var i = 0; i < st.row.length; i++) {
      var c = st.row[i], e = inOut3(beat(a0, i * 0.035, 0.12 + i * 0.035));
      if (e <= 0) continue;
      env.tags.chip(ctx, c.clase, c.label, { x: lerp(CHIP.x, c.x, e), y: lerp(CHIP.y, c.y, e), size: lerp(CHIP.size, CINCO.chip, e), pill: true });
    }
    // Each icon lands above its chip as the type is named (never before its chip is in the row).
    for (i = 0; i < st.row.length; i++) {
      var chipEnd = 0.12 + i * 0.035;
      var f = inOut3(beat(a0, Math.max(cue[i] - 0.12, chipEnd - 0.06), Math.max(cue[i] + 0.04, chipEnd + 0.04)));
      if (f <= 0) continue;
      var fr = CINCO_FROM[i], tx = st.row[i].cx, ty = CINCO.iconY + Math.sin(s.t * 0.9 + i * 1.3) * 3 * f;
      quad(fr[0], fr[1], lerp(fr[0], tx, 0.5), Math.min(fr[1], ty) - 80, tx, ty, f, Q1);
      ctx.save();
      ctx.translate(Q1.x, Q1.y);
      ctx.rotate((1 - f) * (i % 2 ? 0.8 : -0.8));
      cincoIcon(ctx, env, i);
      ctx.restore();
    }
    // "Cada tipo responde a una pregunta distinta": under each chip, what it measures (KB §3.1).
    for (i = 0; i < st.row.length; i++) {
      var qp = beat(a0, C.cada + i * 0.04, C.cada + 0.1 + i * 0.04);
      if (qp > 0) ink.text(ctx, rot(s, CINCO.keys[i]), st.row[i].cx, st.row[i].y + st.row[i].h + CINCO.que.gap,
        { size: CINCO.que.size, italic: true, maxWidth: st.row[i].qw, lineHeight: 1.18, align: 'center', p: qp });
    }
    // The lectora: headlines mix them as if they were the same — five threads into one «%».
    var lp = out3(seg(a1, 0, 0.22));
    if (lp > 0) fig.lectora(ctx, CINCO.lectora.x, CINCO.lectora.y, CINCO.lectora.k, { pose: 'asking', facing: -1, p: lp });
    var hp = inOut3(seg(a1, 0.02, 0.3));
    if (hp > 0) {
      var Hd = CINCO.headline;
      for (i = 0; i < st.threads.length; i++) {
        ink.dotted(ctx, st.threads[i], { r: 2.4, gap: 11, seed: 'v02:hilo' + i, p: seg(a1, 0.25 + i * 0.05, 0.6 + i * 0.05) });
      }
      fig.headline(ctx, lerp(-140, Hd.x, hp), Hd.y, Hd.k, { seed: 'v02:mezcla', masthead: env.pal.mundo.rojo, rot: lerp(-0.6, -0.06, hp) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · fuentes — five paper cards open in a fan, each with its source family and, below it, its
  // limit (KB §3.2) writing itself as it is said. Benchmarks are a ruled navy card.

  var FUE = {
    keys: [['stanford', 'limiteStanford'], ['oitCepal', 'limiteOitCepal'], ['mckinseyMicrosoft', 'limiteMckinseyMicrosoft'], ['pwc', 'limitePwc'],
      ['benchmarks', 'limiteBenchmarks']],
    w: 226, h: 300, x0: 162, step: 239, y: 312,
    // A flat shape peeks from behind one corner of each paper card; corners next to a later card
    // are tucked under it (no shape ever covers an earlier card).
    peeks: [['rojo', 'tl'], ['amarillo', 'br'], ['azul', 'tr'], ['verde', 'br']]
  };

  // When card i opens, writes its limit, and is the one being read.
  function fuentesTimes(s, C) {
    var l1 = s.line === 1, l2 = s.line === 2;
    return [
      { open: seg(s.at(0), 0, 0.08), write: seg(s.at(0), C.lim0, C.lim0 + 0.3), active: s.line <= 0 },
      { open: seg(s.at(1), 0, 0.08), write: seg(s.at(1), C.lim1, C.lim1 + 0.22), active: l1 && s.at(1) < C.mck },
      { open: beat(s.at(1), C.mck - 0.03, C.mck + 0.05), write: seg(s.at(1), C.lim2, C.lim2 + 0.2), active: l1 && s.at(1) >= C.mck },
      { open: seg(s.at(2), 0, 0.08), write: seg(s.at(2), C.lim3, C.lim3 + 0.2), active: l2 && s.at(2) < C.bench },
      { open: beat(s.at(2), C.bench - 0.03, C.bench + 0.05), write: seg(s.at(2), C.lim4, C.lim4 + 0.2), active: l2 && s.at(2) >= C.bench }
    ];
  }

  function fuenteCard(ctx, s, env, i, tm, st) {
    var ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    var e = inOut3(tm.open), w = FUE.w, h = FUE.h;
    var fx = FUE.x0 + i * FUE.step, fy = FUE.y + Math.abs(i - 2) * 16, fr = (i - 2) * 0.05;
    var x = lerp(FUE.x0 + i * 4, fx, e), y = lerp(FUE.y + 20 - i * 3, fy, e), r = lerp(-0.12 + i * 0.018, fr, e);
    var lift = tm.active ? 1 : 0, navy = i === 4;
    ctx.save();
    ctx.translate(x, y - lift * 8);
    ctx.rotate(r);
    if (lift) ctx.scale(1.03, 1.03);
    if (navy) {
      fig.panel(ctx, -w / 2, -h / 2, w, h, { cell: 12, construction: false });
      ink.rRect(ctx, -w / 2, -h / 2, w, h, { color: q.linea, w: 1.6 });
    } else {
      // The flat shape behind a corner blooms once the card has opened (stacked cards show none).
      var pk = FUE.peeks[i], right = pk[1].charAt(1) === 'r', bottom = pk[1].charAt(0) === 'b', pr = 64;
      var bp = seg(e, 0.6, 1);
      if (bp > 0) {
        ink.blob(ctx, (right ? 1 : -1) * (w / 2 - 6 + pr * 0.35), (bottom ? 1 : -1) * (h / 2 - 4 + pr * 0.3), pr, pr * 0.8,
          { fill: m[pk[0]], line: false, seed: 'v02:asoma' + i, irr: 0.22, n: 8, p: bp });
      }
      ink.card(ctx, -w / 2, -h / 2, w, h, { seed: 'v02:fuente' + i, weight: 4, radius: 12, p: out3(s.intro) });
    }
    var col = navy ? m.lienzo : m.tinta;
    var np = seg(e, 0.35, 1);
    if (np > 0) {
      var L = ink.letter(ctx, rot(s, FUE.keys[i][0]), 0, -h / 2 + 22, { size: 31, align: 'center', maxWidth: w - 34, maxLines: 2, minSize: 22,
        counters: navy ? 0 : 0.3, stars: false, underline: false, seed: 'v02:familia' + i, color: col, p: np });
      ctx.save();
      ctx.translate(0, -h / 2 + 36 + L.h);
      if (navy) ink.rLine(ctx, -56, 0, 56, 0, { color: q.linea, w: 1.4, p: np });
      else ink.line(ctx, st.divider, { w: 3, profile: 'swell', seed: 'v02:divisor' + i, p: np, dot: 'detached' });
      ctx.restore();
      if (tm.write > 0) {
        ink.letter(ctx, rot(s, FUE.keys[i][1]), -w / 2 + 20, -h / 2 + 60 + L.h, { font: 'sans', weight: 400, size: 23, maxWidth: w - 40, maxLines: 5,
          align: 'left', counters: 0, stars: false, underline: false, brush: false, jitter: 0.5, lineHeight: 1.2, seed: 'v02:limite' + i, color: col, p: tm.write });
      }
    }
    ctx.restore();
  }

  function fuentes(ctx, s, env) {
    var C = s.state.cues.fuentes, st = s.state.fuentes;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['pajaro', 1150, 92, 64], ['estrella', 640, 76, 36], ['sol', 1214, 540, 40]], { p: out3(s.intro) });
    var tms = fuentesTimes(s, C), i;
    // Closed cards first (the stack), then the open fan from left to right.
    for (i = FUE.keys.length - 1; i >= 0; i--) if (tms[i].open <= 0) fuenteCard(ctx, s, env, i, tms[i], st);
    for (i = 0; i < FUE.keys.length; i++) if (tms[i].open > 0) fuenteCard(ctx, s, env, i, tms[i], st);
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · muestra — a big net in a sea of dots (organizations): only some fall inside; a wider net
  // still sits over one kind of dot. «Cobertura no es representatividad».

  // The sea: a biomorphic field of organizations; filled dots dominate the left, rings the right.
  function seaGeometry(env) {
    var ink = env.ink, rs = env.rng('v02:muestra');
    var shore = ink.blobPoints(env.rng('v02:orilla'), 640, 340, 566, 198, 14, 0.07, 0);
    var dots = [];
    for (var gy = 0; gy < 17; gy++) {
      for (var gx = 0; gx < 40; gx++) {
        var x = 64 + gx * 29 + (gy % 2) * 14.5 + rs.jitter(9), y = 128 + gy * 26 + rs.jitter(8);
        var keep = rs(), kind = rs();
        if (!insidePoly(shore, x, y) || keep < 0.12 + 0.18 * (noise(x * 0.01 + y * 0.004, 'v02:densidad') + 1) / 2) continue;
        // One kind fills the left of the sea, the other the right; they mix in a band between.
        var bias = clamp01(0.94 - 0.84 * (x - 560) / 260) + 0.1 * noise(x * 0.008 - y * 0.01, 'v02:clase');
        dots.push({ x: x, y: y, r: rs.range(4, 6.2), filled: kind < bias });
      }
    }
    return { shore: shore, dots: dots };
  }

  function seaLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), m = env.pal.mundo;
    env.ink.background(g, 'personas', { seed: 'v02:pagina' });
    var sea = seaGeometry(env);
    env.ink.shape(g, sea.shore, { fill: m.celeste, fillAlpha: 0.42, w: 3.2, seed: 'v02:orilla', offset: 4 });
    g.fillStyle = m.tinta;
    g.strokeStyle = m.tinta;
    g.lineWidth = 2;
    sea.dots.forEach(function (d) {
      g.beginPath();
      g.arc(d.x, d.y, d.filled ? d.r : d.r * 0.9, 0, TAU);
      if (d.filled) g.fill(); else g.stroke();
    });
    return { bg: c };
  }

  function muestra(ctx, s, env) {
    var C = s.state.cues.muestra, st = s.state.muestra, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    var a = s.at(0);
    var e1 = out3(seg(a, 0.03, Math.min(0.3, Math.max(0.12, C.censo)))), e2 = inOut3(seg(a, C.cobertura, C.cobertura + 0.2));
    var k = lerp(lerp(0.9, 1.18, e1), 1.6, e2);
    var cx = lerp(360, 448, e2), cy = lerp(lerp(140, 330, e1), 338, e2);
    if (e1 > 0) {
      // Dots inside the net are the sample: a yellow field behind each, never a new dot.
      var lit = seg(e1, 0.8, 1);
      if (lit > 0) {
        ctx.save();
        ctx.globalAlpha *= lit;
        for (var i = 0; i < st.dots.length; i++) {
          var d = st.dots[i];
          if (!insidePoly(st.rim, (d.x - cx) / k, (d.y - cy) / k)) continue;
          ctx.fillStyle = m.amarillo;
          ctx.beginPath();
          ctx.arc(d.x + 1.5, d.y + 1, d.r + 5, 0, TAU);
          ctx.fill();
          ctx.fillStyle = m.tinta;
          ctx.strokeStyle = m.tinta;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.filled ? d.r : d.r * 0.9, 0, TAU);
          if (d.filled) ctx.fill(); else ctx.stroke();
        }
        ctx.restore();
      }
      env.fig.net(ctx, cx, cy, k, { p: seg(a, 0.02, 0.16) });
    }
    ink.letter(ctx, rot(s, 'idea'), W / 2, 28, { size: 54, align: 'center', maxWidth: 1120, maxLines: 1, seed: 'v02:cobertura',
      p: seg(a, C.cobertura, C.cobertura + 0.3) });
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · advertencias — the four stamps press onto the page one by one, on the words that name
  // them (this scene draws them itself: drawsWarnings below); the lectora will use them.

  var ADV = {
    size: 250,
    stamps: [{ n: 1, x: 296, y: 206 }, { n: 2, x: 600, y: 206 }, { n: 3, x: 296, y: 462 }, { n: 4, x: 600, y: 462 }],
    lectora: { x: 1012, y: 574, k: 3 }
  };

  function advertencias(ctx, s, env) {
    var C = s.state.cues.advertencias, st = s.state.advertencias, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1186, 96, 46], ['luna', 840, 130, 50], ['espiral', 78, 470, 40]], { p: out3(s.intro) });
    var cues = [[0, C.a1], [0, C.a2], [1, C.a3], [1, C.a4]];
    var ring = env.pal.mix(m.tinta, m.lienzo, 0.45);
    for (var i = 0; i < ADV.stamps.length; i++) {
      var A = ADV.stamps[i], c = cues[i], press = beat(s.at(c[0]), c[1] - 0.02, c[1] + 0.16);
      if (press < 0.35) {
        ctx.save();
        ctx.globalAlpha *= 1 - press / 0.35;
        ink.dotted(ctx, st.slots[i], { closed: true, r: 2.2, gap: 13, seed: 'v02:hueco' + i, p: seg(s.at(0), 0, 0.16 + i * 0.04), color: ring });
        ctx.restore();
      }
      if (press > 0) env.tags.warningStamp(ctx, A.n, A.x, A.y, ADV.size, press);
    }
    var L = ADV.lectora, lp = out3(seg(s.at(1), 0.5, 1));
    if (lp > 0) env.fig.lectora(ctx, L.x, L.y, L.k, { pose: 'writing', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · cierre — the lectora ties a paper tag «Fuente · Alcance · Tipo de evidencia» to a big
  // number on the notebook page (a handwritten, illegible number: any figure); final title.

  var CIERRE = {
    page: { x: 90, y: 150, w: 720, h: 410 },
    num: { x: 176, y: 330 }, pct: { x: 500, y: 214, size: 178 },
    tag: { x: 664, y: 382 },
    lectora: { x: 1060, y: 574, k: 3.05 },
    title: { y: 30, size: 66 }
  };

  function cierre(ctx, s, env) {
    var C = s.state.cues.cierre, st = s.state.cierre, ink = env.ink, fig = env.fig;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1196, 176, 40], ['sol', 70, 110, 44]], { p: out3(s.intro) });
    var a = s.at(0), P = CIERRE.page;
    fig.notebookPage(ctx, P.x, P.y, P.w, P.h, { seed: 'v02:pagina-final', p: out3(s.intro) });
    ink.line(ctx, st.loops, { w: 10, profile: 'swell', seed: 'v02:numero', p: seg(a, 0, 0.14) });
    hero(ctx, env, rot(s, 'signo'), CIERRE.pct.x, CIERRE.pct.y, CIERRE.pct.size, { seed: 'v02:signo', p: seg(a, 0.06, 0.18) });
    var L = CIERRE.lectora;
    fig.lectora(ctx, L.x, L.y, L.k, { pose: 'tying', facing: -1, p: out3(s.intro) });
    var tp = seg(a, C.fuente - 0.04, C.evidencia + 0.06);
    if (tp > 0) {
      env.tags.labelTag(ctx, rot(s, 'etiqueta'), { x: CIERRE.tag.x, y: CIERRE.tag.y, anchor: { x: CIERRE.pct.x + 150, y: CIERRE.pct.y + 128 }, p: tp, scale: 1.25,
        maxWidth: 250, seed: 'v02:plantilla', tilt: -0.05 });
    }
    ink.letter(ctx, rot(s, 'titulo'), W / 2, CIERRE.title.y, { size: CIERRE.title.size, align: 'center', maxWidth: 1180, maxLines: 1, seed: 'v02:titulo-final',
      p: seg(a, C.asi - 0.06, Math.min(1, C.asi + 0.26)) });
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, video = findVideo(env.id || 'v02'), i;
    var st = { cues: resolveCues(video), titulares: setupTitulares(env) };

    // resultado: a magnifier with a clear lens (the "lupa" of measured results).
    var lb = ink.drawing('v02:lupa', { w: 6, jitter: 0.4 });
    lb.circle(0, 0, 56, { fill: '@a', fillAlpha: 0.2, w: 9, tex: false });
    lb.stroke([-34, -26, -22, -40, -4, -46], { w: 5, profile: 'swell', color: '@paper' });
    lb.stroke([40, 40, 64, 64, 92, 92], { w: 17, profile: 'blunt' });
    st.lupa = lb.done({ colors: { a: env.pal.mundo.celeste, paper: env.pal.mundo.lienzo } });

    // expectativa: month ticks of the strip and the line of sight from the spyglass.
    var ticks = [];
    for (i = 0; i <= EXP.strip.months; i++) {
      var tx = EXP.strip.x + i * EXP.strip.cell, long = i % 6 === 0;
      ticks.push([tx, EXP.strip.y + (long ? 2 : 10), tx + 0.6, EXP.strip.y + EXP.strip.h - (long ? 2 : 10)]);
    }
    st.expectativa = { ticks: ticks, sight: [252, 326, 470, 318, 690, 310] };

    // proyeccion: the comet's arc across the sky.
    st.proyeccion = { path: samplePath(ink, [-160, 210, 150, 110, 480, 66, 780, 110, 990, 256], 4) };

    // cinco-tipos: the legend row (chip boxes measured once) and the threads of the lectora's line.
    var mctx = env.canvas(8, 8).getContext('2d');
    var row = [], total = 0;
    env.pal.legend.tipos.forEach(function (t) {
      var m = env.tags.measureChip(mctx, t.clase, t.label, { size: CINCO.chip, pill: true });
      row.push({ clase: t.clase, label: t.label, w: m.w, h: m.h });
      total += m.w;
    });
    total += CINCO.gap * (row.length - 1);
    var x = W / 2 - total / 2, scene = null;
    ((video && video.scenes) || []).forEach(function (sc) { if (sc.id === 'cinco-tipos') scene = sc; });
    row.forEach(function (c, k) {
      c.x = x; c.y = CINCO.y; c.cx = x + c.w / 2; x += c.w + CINCO.gap;
      // What each type measures is written under its chip; the threads start below that text.
      var r = scene && scene.rotulos[CINCO.keys[k]];
      c.qw = Math.max(c.w, 200);
      c.qh = r ? ink.measureText(mctx, r.text, { size: CINCO.que.size, italic: true, maxWidth: c.qw, lineHeight: 1.18 }).h : 0;
    });
    var Hd = CINCO.headline, hx = Hd.x + 43 * Hd.k, hy = Hd.y + 8 * Hd.k;
    st.cinco = {
      row: row,
      threads: row.map(function (c, k) {
        var x0 = c.cx, y0 = c.y + c.h + CINCO.que.gap + c.qh + 10;
        return [x0, y0, lerp(x0, hx, 0.45) + (k - 2) * 14, lerp(y0, hy, 0.5) + 24, hx, hy];
      })
    };

    // fuentes: the divider under each card name.
    st.fuentes = { divider: ink.wavePoints(-60, 0, 60, 2.4, 44, 0.6) };

    // muestra: the sea and the net's rim in its own units (the same seeded rim fig.net draws).
    var sea = seaGeometry(env);
    st.muestra = { dots: sea.dots, rim: ink.blobPoints(EIA.engine.rng.create('net'), 0, 0, 180, 120, 12, 0.08) };

    // advertencias: the four empty stamp places, drawn before the stamps press.
    st.advertencias = { slots: ADV.stamps.map(function (a) { return ink.ellipsePoints(a.x, a.y, ADV.size * 0.46, ADV.size * 0.46, 28, 0); }) };

    // cierre: an illegible handwritten number (cursive loops) before the big percent sign.
    var loops = [];
    for (i = 0; i <= 26; i++) {
      var u = i / 26, ang = u * TAU * 4.2;
      loops.push(CIERRE.num.x + u * 300 + Math.sin(ang) * 22, CIERRE.num.y - Math.cos(ang) * 34 - Math.sin(u * 9) * 6);
    }
    st.cierre = { loops: loops };
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v02 = {
    setup: setup,
    drawsWarnings: { advertencias: true },
    layers: {
      titulares: groundLayer('personas', {}),
      capacidad: groundLayer('personas', {}),
      resultado: groundLayer('personas', {}),
      expectativa: groundLayer('territorio', { seed: 'v02:horizonte', horizon: EXP.horizon, contours: false }),
      proyeccion: groundLayer('territorio', { seed: 'v02:cielo', horizon: PRO.horizon, contours: false }),
      'cinco-tipos': groundLayer('personas', {}),
      fuentes: groundLayer('personas', {}),
      muestra: seaLayer,
      advertencias: groundLayer('personas', {}),
      cierre: groundLayer('personas', {})
    },
    scenes: {
      titulares: titulares,
      capacidad: capacidad,
      uso: uso,
      resultado: resultado,
      expectativa: expectativa,
      proyeccion: proyeccion,
      'cinco-tipos': cincoTipos,
      fuentes: fuentes,
      muestra: muestra,
      advertencias: advertencias,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
