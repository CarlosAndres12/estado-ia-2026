/* js/videos/v06-aprendizaje.js — V06 «Evaluar el aprendizaje, no el texto» (prompt §13, sesión 4;
 * KB §7, «Contenido · Educación superior», points 6–11; lámina D10).
 *
 * Nine scenes in three chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Uso masivo                campus · lancha
 *   2 Uso no es preparación     preparacion · profesorado
 *   3 Rediseñar la evaluación   evaluar · piezas · riesgos · cinco-frentes · cierre
 *
 * The metaphor is lámina D10's (prompt §12.2): a fast warm boat full of students pushed by a small
 * ruled motor — the lamp, bolted to the stern by a short ruled bracket as D10 does, because
 * fig.boat draws the motor a little apart from the hull — with no compass and no map, its wake
 * looping instead of keeping a course, and a lighthouse far away. It comes back in «riesgos»
 * (between a warm current and a dark eddy of identical shapes), in «cinco-frentes» (the lighthouse
 * lights the campus with five labelled beams) and in «cierre» (the boat now carries a compass and
 * turns toward the lighthouse). The AI is only ever the small ruled lamp; students, academics and
 * places are warm and free.
 *
 * Honest marks (prompt §3.7): «campus» draws 86 · 54 · 24 as three bars on ONE zero-based scale
 * (0–100%); the 24% (press coverage only, estado «Con matiz») sits below a dotted divider with its
 * own Campus Technology tag, apart from the Digital Education Council tag of 86 and 54. «Cuatro de
 * cada cinco» is only ever shown with «Estados Unidos» (edu-4): exactly four lamps beside five
 * students, with the sentence and its tag. «preparacion» draws 58 · 48 · 80 on one zero-based
 * scale. «profesorado» counts exactly nine lamps among ten academics, writes «más de la mitad» on
 * a text card (no person-by-person count) and stamps exactly four of six guideline documents (two
 * thirds); the edu-5 tag carries the survey's scope. No «34%» is drawn anywhere (prompt §1.3).
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings it,
 * and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds. A
 * figure lands by the time its subtitle chunk appears and holds, exact and tagged, to the end of
 * its scene (or of its line, where the next line clears the page). No string, number or source is
 * typed here: copy comes from s.rotulos (js/data/videos.js), values from env.chart.parseValue,
 * sources from env.tags. Draw functions are pure functions of (s, env): motion comes from s.t,
 * geometry is built in setup(). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.videos = EIA.videos || {};

  var W = 1280, H = 720, TAU = Math.PI * 2;
  var TAG = { scale: 1.08, maxWidth: 340 };   // video tags; wide enough that no source label overflows

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)); }
  // A beat inside a line: like seg on s.at(i), but never before the line starts (a cue at 0), and
  // always complete by the end of the line (s.at(i) stops at 1).
  function beat(at, a, b) {
    if (at <= 0) return 0;
    b = Math.min(1, b);
    return seg(at, Math.max(0, Math.min(a, b - 0.01)), b);
  }
  function out3(t) { t = 1 - clamp01(t); return 1 - t * t * t; }
  function inOut3(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function noise(x, seed) { return EIA.engine.rng.noise1(x, seed); }
  function rot(s, key) { var r = s.rotulos && s.rotulos[key]; return r ? r.text : ''; }
  function wrapTo(v, m) { return ((v % m) + m) % m; }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    campus: { eeuu: [0, 'En Estados Unidos', 'chunk'], dec: [1, 'con 3.839', 'chunk'], diario: [1, 'Según la cobertura', 'chunk'] },
    lancha: { motor: [0, 'un motor potente', 'word'], sin: [0, 'sin brújula', 'word'] },
    preparacion: { c58: [0, 'el 58%', 'chunk'], c48: [0, 'y el 48%', 'chunk'], c80: [1, 'el 80%', 'chunk'] },
    profesorado: { unesco: [0, 'En una encuesta', 'chunk'], nueve: [0, 'nueve de cada diez', 'chunk'], mitad: [0, 'más de la mitad', 'word'],
      tercios: [1, 'Dos tercios', 'chunk'] },
    evaluar: { sostenible: [0, 'no es sostenible', 'word'], p0: [0, 'el producto auténtico', 'word'], p1: [0, 'la bitácora de proceso', 'word'],
      p2: [0, 'la defensa oral', 'word'], p3: [0, 'el uso declarado de IA', 'word'], uso: [1, '«¿usó IA?»', 'word'], sino: [1, 'sino', 'chunk'] },
    piezas: { claridad: [0, 'Y conviene', 'chunk'], r0: [0, 'qué usos de IA', 'word'], r1: [0, 'cómo se declaran', 'word'], r2: [0, 'qué parte se hace', 'word'] },
    riesgos: { h0: [0, 'la tutoría', 'word'], h1: [0, 'la retroalimentación', 'word'], h2: [0, 'la accesibilidad', 'word'],
      d0: [0, 'dependencia cognitiva', 'word'], d1: [0, 'respuestas homogéneas', 'word'], d2: [0, 'aprendizaje superficial', 'word'],
      advierte: [1, 'advierte', 'word'], preservar: [1, 'Conviene preservar', 'chunk'] },
    'cinco-frentes': { cinco: [0, 'cinco frentes', 'word'], f0: [0, 'Gobernanza', 'word'], f1: [0, 'Currículo', 'word'], f2: [0, 'Evaluación', 'word'],
      f3: [1, 'Infraestructura', 'word'], f4: [1, 'investigación', 'word'] }
  };

  // The scene's cues as shares of their lines, read from the player's s.cue (subtitle timing: the
  // audio manifest's chunk times when it has them, else the character estimate). Memoized per
  // scene state object, which the player keeps for the life of its timeline (a pure cache: same
  // timeline, same shares). Words missing from a line fall back to the middle of the line.
  var cueMemo = new WeakMap();
  function cuesOf(s, sceneId) {
    var c = cueMemo.get(s);
    if (c) return c;
    c = {};
    var spec = CUES[sceneId] || {};
    Object.keys(spec).forEach(function (k) {
      var v = s.cue ? s.cue(spec[k][0], spec[k][1], spec[k][2]) : null;
      c[k] = v == null ? 0.5 : v;
    });
    cueMemo.set(s, c);
    return c;
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
  function rotText(video, sceneId, key) {
    var sc = ((video && video.scenes) || []).filter(function (x) { return x.id === sceneId; })[0];
    var r = sc && sc.rotulos && sc.rotulos[key];
    return r ? r.text : '';
  }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function ground(ctx, s, env) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, 'personas', { seed: 'v06:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus any static drawing.
  function groundLayer(kind, opts, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d'), o = { seed: 'v06:pagina' }, k;
      for (k in opts || {}) o[k] = opts[k];
      env.ink.background(g, kind, o);
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, colors?]; kept clear
  // of the subtitle band (y > 570) and of the player's overlays.
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v06:fx' + i) * 9, f[2] + noise(t * 0.8, 'v06:fy' + i) * 7, f[3], {
        seed: 'v06:float' + f[0] + i, colors: f[4] || null, rot: noise(t * 0.6, 'v06:fr' + i) * 0.14, p: p
      });
    }
  }

  // Brush lettering that fades as one image: drawn glyph by glyph with a low alpha, the fill and
  // the brush stroke overlap and show dark outlines (and a number would pass through in-between
  // numbers). alpha 1 draws it directly, still writing on with lo.p.
  function letterFade(ctx, env, text, x, y, lo, alpha, key) {
    if (alpha <= 0) return env.ink.measureLetter(ctx, text, lo);
    if (alpha >= 1) return env.ink.letter(ctx, text, x, y, lo);
    var full = {}, k;
    for (k in lo) full[k] = lo[k];
    full.p = 1;
    var L = env.ink.measureLetter(ctx, text, full), size = L.size;
    var pad = Math.ceil(size * 0.5), w = Math.ceil(L.w + pad * 2), h = Math.ceil(L.h + pad * 2);
    var cx = full.align === 'center' ? w / 2 : full.align === 'right' ? w - pad : pad;
    var img = env.ink.layer(ctx, 'v06:letra|' + key + '|' + size + '|' + (full.color || ''), w, h, function (g) {
      env.ink.letter(g, text, cx, pad, full);
    });
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, x - cx, y - pad, w, h);
    ctx.restore();
    return L;
  }

  // Hero numbers: lettered without colored counters or stars, so every digit reads clearly, and
  // faded in whole (prompt §3.7: no in-between number is ever shown).
  function hero(ctx, env, text, x, y, size, o) {
    var lo = { size: size, align: o.align || 'left', counters: 0, stars: false, underline: false, seed: o.seed, color: o.color,
      maxLines: 1, p: 1 };
    return letterFade(ctx, env, text, x, y, lo, o.p == null ? 1 : clamp01(o.p), 'hero|' + text + '|' + o.seed);
  }

  // A data rótulo split into its value token and the words after it: «86% usa IA» → «86%», «usa IA»;
  // «80%: la integración…» → «80%», «la integración…».
  function splitFigure(env, text) {
    var pv = env.chart.parseValue(text);
    if (!pv) return { value: 0, raw: '', rest: String(text) };
    return { value: pv.value, raw: pv.raw, rest: String(text).slice(pv.index + pv.raw.length).replace(/^[\s:·]+/, '') };
  }

  // The full 0–100% length behind a bar: a pale flat field, exact at both ends.
  function track(ctx, env, sc, y, h, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a * 0.55;
    ctx.fillStyle = env.pal.mundo.lienzoOcre;
    ctx.fillRect(sc(0), y + 3, sc(100) - sc(0), h - 6);
    ctx.restore();
  }

  // Point at share u of a sampled path, with its unit normal and heading.
  function samplePath(ink, ctrl, step) {
    var p = ink.smoothPath(ctrl, false, step || 5), acc = new Float32Array(p.n);
    for (var i = 1; i < p.n; i++) acc[i] = acc[i - 1] + Math.sqrt(Math.pow(p.x[i] - p.x[i - 1], 2) + Math.pow(p.y[i] - p.y[i - 1], 2));
    return { x: p.x, y: p.y, s: acc, n: p.n, len: acc[p.n - 1] || 1 };
  }
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
  // Control points of a curve that follows path g from u0 to u1, offset by d across it.
  function alongPath(g, u0, u1, d, n) {
    var out = [], q = {};
    for (var i = 0; i <= n; i++) {
      pathAt(g, lerp(u0, u1, i / n), q);
      out.push(q.x + q.nx * d, q.y + q.ny * d);
    }
    return out;
  }
  var Q1 = {}, Q2 = {};   // scratch points, overwritten by every call (no state across frames)

  // ---------------------------------------------------------------------------------------------
  // The sea of lámina D10: a cream page with a soft sky wash, a flat celeste gouache sea with rows of
  // cream brush waves, one calligraphic horizon. Shared by lancha, riesgos and cierre.

  function seaField(env, horizon, seed) {
    var b = env.ink.drawing('v06:mar:' + seed, { w: 4, jitter: 0.6 }), m = env.pal.mundo, r = env.rng('v06:olas:' + seed), x, i;
    var pts = [];
    for (x = -30; x <= W + 30; x += 40) pts.push(x, horizon + 2 + Math.sin(x / 70) * 1.2);
    pts.push(W + 30, H + 30, -30, H + 30);
    b.fill(pts, { fill: m.celeste, fillScale: 0, fillJitter: 1.2, poly: true });
    var rows = Math.round((H - horizon) / 58);
    for (i = 0; i < rows; i++) {
      var y = horizon + 34 + i * 58 + r.range(-6, 6), x0 = r.range(-60, 260), x1 = W - r.range(-60, 320);
      b.stroke(env.ink.wavePoints(x0, y, x1, r.range(2.6, 4.2), r.range(58, 84), r() * 6), { w: r.range(2.2, 3), profile: 'swell', color: m.lienzo });
    }
    return b.done();
  }

  function seaLayer(horizon, seed, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink;
      ink.background(g, 'territorio', { seed: 'v06:cielo:' + seed, horizon: horizon / H, contours: false });
      ink.draw(g, seaField(env, horizon, seed), 0, 0, 1, { offset: 3 });
      ink.line(g, [-10, horizon, 420, horizon + 2, 860, horizon - 1, W + 10, horizon + 1], { w: 4.2, profile: 'blunt', seed: 'v06:horizonte:' + seed });
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // A small wooden pier at the right edge, for the lectora to stand on.
  function pierInto(g, env, x0, y) {
    var b = env.ink.drawing('v06:muelle' + x0, { w: 3.4, jitter: 0.6 }), m = env.pal.mundo;
    b.shape([x0, y - 6, W + 20, y - 8, W + 20, y + 10, x0 + 4, y + 12], { fill: m.madera, w: 3.6, fillScale: 0, fillJitter: 0.6 });
    for (var px = x0 + 26; px < W; px += 74) b.stroke([px, y + 10, px - 1, y + 60], { w: 6, profile: 'blunt' });
    env.ink.draw(g, b.done(), 0, 0, 1, { offset: 3 });
  }

  // The distant lighthouse on its island, with a slowly sweeping beam (null: none).
  function lighthouse(ctx, env, L, beam, p) {
    env.ink.blob(ctx, L.x, L.y + 2, 54 * L.k / 0.42, 12 * L.k / 0.42, { fill: env.pal.mundo.tierra, w: 3.2, seed: 'v06:isla', irr: 0.15, n: 9, p: p });
    env.fig.lighthouse(ctx, L.x, L.y, L.k, { beam: beam, p: p });
  }

  // The boat of D10: fig.boat with its ruled motor (the lamp) bolted to the stern by a short ruled
  // bracket, four students on board; optionally a compass on a short mast at the bow whose north
  // dot points at (o.toward.x, o.toward.y). (x, y) = waterline center.
  var MAST = [128, -38, 127, -98];
  function boatWith(ctx, env, s, x, y, k, o) {
    var q = env.pal.maquina, p = o.p == null ? 1 : o.p, r = o.rot || 0;
    ctx.save();
    ctx.translate(x, y);
    if (r) ctx.rotate(r);
    var b = env.fig.boat(ctx, 0, 0, k, { motor: true, compass: false, passengers: 4, t: s.t, p: p });
    env.ink.rRect(ctx, b.motor.x - 2 * k, b.motor.y - 16 * k, -146 * k - (b.motor.x - 2 * k), 7 * k, { fill: q.noche, color: q.linea, w: 1.2, p: p });
    if (o.compass > 0) {
      ctx.save();
      ctx.scale(k, k);
      env.ink.line(ctx, MAST, { w: 4.4, profile: 'blunt', seed: 'v06:mastil', p: o.compass });
      ctx.restore();
      var cx = 128 * k, cy = -124 * k;
      var ang = o.toward ? Math.atan2(o.toward.y - (y + cy), o.toward.x - (x + cx)) - r : -Math.PI / 2;
      env.fig.sign(ctx, 'brujula', cx, cy, 66 * k, { seed: 'v06:brujula', rot: ang + Math.PI / 2, p: o.compass });
    }
    ctx.restore();
    // Screen position of the motor's lamp (the rotation is small: ignored).
    return { lamp: { x: x - 185 * k, y: y - 46 * k } };
  }

  // Cream foam strokes streaming past (the boat is fast): built at the origin in setup, translated.
  function foam(ctx, s, env, list, speedK) {
    var m = env.pal.mundo;
    for (var i = 0; i < list.length; i++) {
      var f = list[i], x = wrapTo(f.x0 - s.t * f.speed * speedK, W + 520) - 360;
      ctx.save();
      ctx.translate(x, f.y);
      env.ink.line(ctx, f.pts, { w: f.w, profile: 'swell', seed: 'v06:espuma' + (i % 4), color: m.lienzo, alpha: 0.9 });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // The four pieces of a redesigned assessment (KB §7, contenido 9; Actividad B), drawn in a
  // 100-unit box centered on (0, 0): an authentic product (a model on its board), a process logbook
  // (an open notebook whose entries carry date tabs, no digits), an oral defense (two speech
  // bubbles) and a declared use of AI (a short signed sheet; its lamp is fig.lamp at PIECE_LAMP).

  var PIECE_LAMP = { x: -13, y: -23, k: 0.2 };

  function buildPieces(env) {
    var ink = env.ink, m = env.pal.mundo, out = [], b, i;
    b = ink.drawing('v06:pieza-producto', { w: 3.6, jitter: 0.5 });
    b.shape([-48, 30, 48, 30, 50, 42, -50, 42], { fill: m.madera, w: 3.4, fillScale: 0 });
    b.shape([-30, 30, -30, -8, 30, -8, 30, 30], { fill: m.amarillo, w: 3.6, fillScale: 0 });
    b.shape([-40, -5, 0, -40, 40, -5], { fill: m.rojo, w: 3.6, fillScale: 0 });
    b.shape([-9, 30, -9, 7, 9, 7, 9, 30], { fill: m.azul, w: 3, fillScale: 0 });
    b.circle(19, 9, 5.5, { fill: m.celeste, w: 2.4 });
    b.stroke([24, -16, 24, -50], { w: 3, profile: 'blunt' });
    b.shape([24, -50, 46, -44, 24, -37], { fill: m.verde, w: 2.6, fillScale: 0 });
    out.push(b.done());

    b = ink.drawing('v06:pieza-bitacora', { w: 3.4, jitter: 0.5 });
    b.shape([-50, -32, -3, -28, -3, 38, -50, 34], { fill: m.lienzo, w: 3.4, fillScale: 0 });
    b.shape([3, -28, 50, -32, 50, 34, 3, 38], { fill: m.lienzo, w: 3.4, fillScale: 0 });
    var tabs = [m.rojo, m.azul, m.verde, m.amarillo];
    for (i = 0; i < 4; i++) {
      var ex = i < 2 ? -44 : 9, ey = -18 + (i % 2) * 30;
      b.shape([ex, ey - 5, ex + 9, ey - 5, ex + 9, ey + 4, ex, ey + 4], { fill: tabs[i], w: 2, fillScale: 0 });
      b.stroke([ex + 14, ey - 2, ex + 26, ey - 3, ex + 36, ey - 1], { w: 2, profile: 'even' });
      b.stroke([ex + 14, ey + 7, ex + 24, ey + 6, ex + 31, ey + 7], { w: 2, profile: 'even' });
    }
    for (i = 0; i < 5; i++) b.dot(0, -22 + i * 14, 2.6);
    out.push(b.done());

    b = ink.drawing('v06:pieza-defensa', { w: 3.4, jitter: 0.5 });
    b.blob(-18, -16, 30, 19, { fill: m.amarillo, w: 3.4, irr: 0.08, n: 11 });
    b.stroke([-34, 0, -42, 14, -46, 22], { w: 3, profile: 'lift' });
    b.stroke([-32, -20, -12, -22, 2, -19], { w: 2.4, profile: 'even' });
    b.stroke([-30, -10, -16, -11, -6, -9], { w: 2.4, profile: 'even' });
    b.blob(20, 22, 28, 17, { fill: m.celeste, w: 3.4, irr: 0.08, n: 11 });
    b.stroke([34, 36, 42, 46, 48, 52], { w: 3, profile: 'lift' });
    b.stroke([6, 18, 22, 16, 36, 19], { w: 2.4, profile: 'even' });
    b.stroke([8, 28, 20, 27, 30, 29], { w: 2.4, profile: 'even' });
    out.push(b.done());

    b = ink.drawing('v06:pieza-declaracion', { w: 3.4, jitter: 0.5 });
    b.shape([-31, -44, 31, -44, 31, 44, -31, 44], { fill: m.lienzo, w: 3.6, fillScale: 0 });
    b.stroke([2, -27, 21, -28], { w: 2.2, profile: 'even' });
    b.stroke([2, -18, 17, -18], { w: 2.2, profile: 'even' });
    for (i = 0; i < 3; i++) b.stroke([-21, -2 + i * 11, 21 - i * 6, -3 + i * 11], { w: 2.2, profile: 'even' });
    b.stroke([-20, 34, -12, 26, -6, 34, 0, 27, 8, 35, 18, 30], { w: 2.6, profile: 'lift' });
    out.push(b.done());
    return out;
  }

  function drawPiece(ctx, env, s, st, i, x, y, k, p) {
    if (p <= 0) return;
    env.ink.draw(ctx, st.pieces[i], x, y, k, { p: p });
    if (i === 3 && p > 0.4) env.fig.lamp(ctx, x + PIECE_LAMP.x * k, y + PIECE_LAMP.y * k, PIECE_LAMP.k * k, { t: s.t, p: seg(p, 0.4, 1) });
  }

  // =============================================================================================
  // 1 · campus — a warm courtyard with five students; beside exactly four of them a small lamp, as
  // the line says «En Estados Unidos, cuatro de cada cinco…» (the sentence, on a card, with the
  // edu-4 tag: EE. UU. only). Line 2: a card with three bars on one 0–100% scale: 86 and 54 (DEC,
  // one tag) and, below a dotted divider, 24 (press coverage, its own «Con matiz» tag).

  var CAMPUS = {
    feet: 560, k: 1.72, lampK: 0.34,
    people: [
      { x: 258, pose: 'reading', prop: 'phone', skin: 1, hair: 'curly', facing: 1, lamp: true },
      { x: 440, pose: 'writing', prop: 'notebook', skin: 4, hair: 'braids', facing: 1, lamp: true },
      { x: 622, pose: 'reading', prop: 'book', skin: 0, hair: 'ponytail', facing: -1, lamp: false },
      { x: 804, pose: 'presenting', prop: null, skin: 3, hair: 'short', facing: -1, lamp: true },
      { x: 986, pose: 'reading', prop: 'phone', skin: 2, hair: 'bun', facing: -1, lamp: true }
    ],
    note: { x: 64, y: 36, w: 600, size: 26, pad: 20 },
    tag4: { x: 694, y: 46 },
    card: { x: 70, y: 70, w: 1140, h: 470 },
    bars: { x0: 150, len: 480, h: 50, size: 46, desc: 27, rows: { uso: 128, semanal: 228, diario: 392 }, divider: 330 },
    tag1: { x: 846, y: 112 }, tag2: { x: 846, y: 374 }
  };
  var CAMPUS_FLOAT = [['pajaro', 1126, 56, 54], ['sol', 1214, 120, 58]];

  // One bar row: the 100% track, the gouache bar grown from zero on the shared scale, its value
  // (lettered, faded in whole) right after the bar end and the words of its rótulo after the value.
  // Returns where the label ends (a tag's thread ties there).
  function barRow(ctx, env, text, sc, y, h, o) {
    var f = splitFigure(env, text), ink = env.ink;
    track(ctx, env, sc, y, h, o.track);
    if (o.p > 0) env.chart.bar(ctx, { text: text, scale: sc, y: y, h: h, color: o.color, labels: false, seed: o.seed, p: o.p });
    var x = sc(f.value) + 18, size = o.size;
    var L = hero(ctx, env, f.raw, x, y + h / 2 - size * 0.66, size, { seed: o.seed + ':valor', p: o.label });
    var D = ink.text(ctx, f.rest, x + L.w + 12, y + h / 2 - o.desc * 0.62, { size: o.desc, weight: 700, p: seg(o.label, 0.35, 1) });
    return { x: x + L.w + 12 + D.w, y: y + h / 2 };
  }

  function campus(ctx, s, env) {
    var C = cuesOf(s, 'campus'), fig = env.fig, ink = env.ink, m = env.pal.mundo, i;
    ground(ctx, s, env);
    floaters(ctx, s, env, CAMPUS_FLOAT, out3(s.intro));
    var a0 = s.at(0), a1 = s.at(1), lw = landWindow(C.eeuu);
    var gone = seg(a1, 0, 0.05);   // line 2 clears the US sentence, its tag and its lamps together
    var lampN = 0;
    for (i = 0; i < CAMPUS.people.length; i++) {
      var P = CAMPUS.people[i];
      var pr = fig.person(ctx, P.x, CAMPUS.feet, CAMPUS.k, { role: 'estudiante', seed: 'v06:estudiante' + i, pose: P.pose, prop: P.prop, skin: P.skin,
        hair: P.hair, facing: P.facing, p: out3(seg(s.t, 0.15 + i * 0.2, 1.3 + i * 0.2)) });
      if (!P.lamp) continue;
      var lp = beat(a0, lw[0] + lampN * 0.018, lw[0] + 0.05 + lampN * 0.018);
      lampN++;
      if (lp <= 0 || gone >= 1) continue;
      ctx.save();
      ctx.globalAlpha *= 1 - gone;
      fig.lamp(ctx, pr.head.x + P.facing * (pr.head.r + 36), pr.head.y + 6 + Math.sin(s.t * 1.1 + i) * 2, CAMPUS.lampK,
        { t: s.t + i, p: lp, stars: gone <= 0 });
      ctx.restore();
    }
    // «En Estados Unidos, cuatro de cada cinco…»: the sentence on a card, tied to its tag (EE. UU.).
    var np = beat(a0, lw[0], lw[0] + 0.05);
    if (np > 0 && gone < 1) {
      var N = CAMPUS.note, txt = rot(s, 'eeuu');
      var L = ink.measureText(ctx, txt, { size: N.size, weight: 700, maxWidth: N.w - 2 * N.pad, lineHeight: 1.22 });
      var nh = L.h + 2 * N.pad;
      ctx.save();
      ctx.globalAlpha *= 1 - gone;
      ink.card(ctx, N.x, N.y, N.w, nh, { seed: 'v06:eeuu', weight: 3.6, radius: 10, p: np, peek: m.azul, peekCorner: 'bl' });
      ink.text(ctx, txt, N.x + N.pad, N.y + N.pad, { size: N.size, weight: 700, maxWidth: N.w - 2 * N.pad, lineHeight: 1.22,
        p: beat(a0, lw[0] + 0.03, lw[1]) });
      env.tags.sourceTag(ctx, 'edu-4', { x: CAMPUS.tag4.x, y: CAMPUS.tag4.y, anchor: { x: N.x + N.w - 8, y: N.y + nh * 0.45 },
        p: beat(a0, lw[0] + 0.02, lw[1]), scale: TAG.scale, maxWidth: TAG.maxWidth });
      ctx.restore();
    }
    // Line 2: the card with the three bars slides up over the courtyard.
    var ce = inOut3(beat(a1, 0, 0.1));
    if (ce > 0) {
      var K = CAMPUS.card;
      ctx.save();
      ctx.translate(0, (1 - ce) * 640);
      ink.card(ctx, K.x, K.y, K.w, K.h, { seed: 'v06:tarjeta-barras', weight: 4.2, radius: 14, peek: m.amarillo, peekCorner: 'tr' });
      campusBars(ctx, s, env, C, a1);
      ctx.restore();
    }
  }

  function campusBars(ctx, s, env, C, a1) {
    var B = CAMPUS.bars, chart = env.chart, m = env.pal.mundo, R = B.rows, sc = chart.scale(100, B.x0, B.len);
    var w1 = landWindow(C.dec), w2 = landWindow(C.diario);
    chart.baseline(ctx, sc(0), R.uso - 18, R.diario + B.h + 18, { p: beat(a1, 0.06, 0.14) });
    var r1 = barRow(ctx, env, rot(s, 'uso'), sc, R.uso, B.h, { seed: 'v06:uso', color: m.azul, track: beat(a1, 0.08, 0.14),
      p: beat(a1, w1[0], w1[1] - 0.03), label: beat(a1, w1[1] - 0.03, w1[1] + 0.02), size: B.size, desc: B.desc });
    barRow(ctx, env, rot(s, 'semanal'), sc, R.semanal, B.h, { seed: 'v06:semanal', color: m.azul, track: beat(a1, 0.09, 0.15),
      p: beat(a1, w1[0] + 0.03, w1[1]), label: beat(a1, w1[1], w1[1] + 0.04), size: B.size, desc: B.desc });
    // The same survey as reported by the press: below a dotted divider, with its own tag.
    env.ink.dotted(ctx, s.state.campus.divider, { r: 2.3, gap: 13, seed: 'v06:divisor', p: beat(a1, w2[0] - 0.08, w2[0]) });
    var r3 = barRow(ctx, env, rot(s, 'diario'), sc, R.diario, B.h, { seed: 'v06:diario', color: m.celeste, track: beat(a1, w2[0] - 0.06, w2[0]),
      p: beat(a1, w2[0], w2[1]), label: beat(a1, w2[1], w2[1] + 0.04), size: B.size, desc: B.desc });
    var t1 = beat(a1, w1[1] - 0.03, w1[1] + 0.03), t2 = beat(a1, w2[1], w2[1] + 0.05);
    if (t1 > 0) env.tags.sourceTag(ctx, 'edu-1', { x: CAMPUS.tag1.x, y: CAMPUS.tag1.y, anchor: { x: r1.x + 6, y: r1.y }, p: t1, scale: TAG.scale, maxWidth: TAG.maxWidth });
    if (t2 > 0) env.tags.sourceTag(ctx, 'edu-2', { x: CAMPUS.tag2.x, y: CAMPUS.tag2.y, anchor: { x: r3.x + 6, y: r3.y }, p: t2, scale: TAG.scale, maxWidth: TAG.maxWidth });
  }

  // =============================================================================================
  // 2 · lancha — lámina D10's metaphor: the fast warm boat full of students, pushed by the small
  // ruled motor (the lamp), no compass and no map; its wake loops («sin brújula ni mapa»); a
  // lighthouse far away. The lectora asks from the pier.

  var LANCHA = {
    horizon: 236,
    light: { x: 1088, y: 244, k: 0.42 },
    boat: { x0: 300, x: 584, y: 448, k: 1.55 },
    pier: { x: 1036, y: 566 },
    lectora: { x: 1150, y: 562, k: 2.3 }
  };

  function lancha(ctx, s, env) {
    var C = cuesOf(s, 'lancha'), st = s.state.lancha, ink = env.ink, m = env.pal.mundo, B = LANCHA.boat;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    lighthouse(ctx, env, LANCHA.light, Math.PI + 0.1 + Math.sin(s.t * 0.45) * 0.1, intro);
    floaters(ctx, s, env, [['pajaro', 870, 120, 50], ['pajaro', 960, 92, 34]], intro);
    foam(ctx, s, env, st.foam, 1);
    var bx = lerp(B.x0, B.x, out3(seg(s.t, 0, 2.6))) + noise(s.t * 0.3, 'v06:lancha-x') * 6;
    var by = B.y + Math.sin(s.t * 1.7) * 2.5, rk = Math.sin(s.t * 1.7 + 0.8) * 0.018;
    // The wake: a short foam trail, then — «sin brújula ni mapa» — it loops instead of keeping a course.
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(B.k, B.k);
    ink.dotted(ctx, st.trail, { r: 2.2, gap: 10, seed: 'v06:estela-espuma', color: m.lienzo });
    ink.line(ctx, st.wake, { w: 3, profile: 'swell', seed: 'v06:estela', p: beat(a0, C.sin - 0.08, C.sin + 0.22) });
    ctx.restore();
    var bt = boatWith(ctx, env, s, bx, by, B.k, { rot: rk, p: intro });
    // «un motor potente»: the lamp's glow swells once.
    var pulse = Math.sin(Math.PI * beat(a0, C.motor - 0.05, C.motor + 0.25));
    if (pulse > 0) ink.glow(ctx, bt.lamp.x, bt.lamp.y, 120, env.pal.maquina.linea, 0.6 * pulse);
    // Spray at the bow.
    for (var i = 0; i < 6; i++) {
      var u = wrapTo(s.t * 1.4 + i / 6, 1);
      ink.dot(ctx, bx + 262 + u * 70, by - 52 - Math.sin(u * Math.PI) * 34 + i * 3, 3.2 * (1 - u), m.lienzo);
    }
    var lp = out3(beat(a1, 0, 0.35));
    if (lp > 0) env.fig.lectora(ctx, LANCHA.lectora.x, LANCHA.lectora.y, LANCHA.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  // =============================================================================================
  // 3 · preparacion — «Uso no es preparación»: three calligraphic bars on one 0–100% scale, 58 ·
  // 48 · 80, each under its words, one DEC tag (edu-3, its scope). A student with a phone and the
  // lamp beside her wonders (a spiral in a thought bubble).

  var PREP = {
    x0: 110, len: 640, h: 46, size: 50, desc: 24, descWidth: 860, descGap: 10,
    rows: [{ key: 'conocimientos', y: 112 }, { key: 'mercadoLaboral', y: 250 }, { key: 'expectativas', y: 388 }],
    tag: { x: 876, y: 132 },
    student: { x: 1148, y: 560, k: 1.62 }
  };

  function preparacion(ctx, s, env) {
    var C = cuesOf(s, 'preparacion'), ink = env.ink, chart = env.chart, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1206, 64, 40], ['espiral', 1040, 470, 34]], out3(s.intro));
    var a0 = s.at(0), a1 = s.at(1), sc = chart.scale(100, PREP.x0, PREP.len);
    var wins = [landWindow(C.c58), landWindow(C.c48), landWindow(C.c80)], ats = [a0, a0, a1];
    // The student who uses it (the lamp) and is not sure (a spiral in a thought bubble).
    var S = PREP.student, sp = out3(seg(s.t, 0.2, 1.6));
    var pr = fig.person(ctx, S.x, S.y, S.k, { role: 'estudiante', seed: 'v06:prep-estudiante', pose: 'reading', prop: 'phone', skin: 3, hair: 'long',
      facing: -1, p: sp });
    fig.lamp(ctx, pr.hand.right.x - 44, pr.hand.right.y - 26 + Math.sin(s.t * 1.1) * 2, 0.3, { t: s.t, p: beat(a0, 0, 0.08) });
    var tb = beat(a0, 0.03, 0.12);
    if (tb > 0) {
      fig.bubble(ctx, S.x - 128, S.y - 262, 112, 74, { thought: true, tail: { x: S.x - 22, y: S.y - 176 }, seed: 'v06:duda', p: tb });
      fig.sign(ctx, 'espiral', S.x - 72, S.y - 225, 50, { seed: 'v06:duda-espiral', p: seg(tb, 0.4, 1), mono: true });
    }
    var y0 = PREP.rows[0].y, rowsAt = [], i;
    for (i = 0; i < 3; i++) {
      var R = PREP.rows[i], text = rot(s, R.key), f = splitFigure(env, text);
      var D = ink.measureText(ctx, f.rest, { size: PREP.desc, weight: 700, maxWidth: PREP.descWidth, lineHeight: 1.2 });
      rowsAt.push({ R: R, f: f, text: text, by: R.y + D.h + PREP.descGap, dh: D.h });
    }
    var last = rowsAt[2];
    chart.baseline(ctx, sc(0), rowsAt[0].by - 14, last.by + PREP.h + 14, { p: beat(a0, 0.0, 0.08) });
    var anchor = null;
    for (i = 0; i < 3; i++) {
      var r = rowsAt[i], w = wins[i], at = ats[i];
      var dp = beat(at, w[0] - 0.05, w[0] + 0.01);
      ink.text(ctx, r.f.rest, PREP.x0, r.R.y, { size: PREP.desc, weight: 700, maxWidth: PREP.descWidth, lineHeight: 1.2, p: dp });
      track(ctx, env, sc, r.by, PREP.h, dp);
      var bp = beat(at, w[0], w[1]);
      if (bp > 0) chart.bar(ctx, { text: r.text, scale: sc, y: r.by, h: PREP.h, color: [m.rojo, m.rojo, m.azul][i], labels: false, seed: 'v06:prep' + i, p: bp });
      var vx = sc(r.f.value) + 18;
      var L = hero(ctx, env, r.f.raw, vx, r.by + PREP.h / 2 - PREP.size * 0.66, PREP.size, { seed: 'v06:prep-valor' + i, p: beat(at, w[1], w[1] + 0.04) });
      if (i === 0) anchor = { x: vx + L.w + 8, y: r.by + PREP.h / 2 };
    }
    // One tag for the three figures (edu-3), from the first number to the end of the scene.
    var tp = beat(a0, wins[0][1] - 0.02, wins[0][1] + 0.05);
    if (tp > 0) env.tags.sourceTag(ctx, 'edu-3', { x: PREP.tag.x, y: PREP.tag.y, anchor: anchor, p: tp, scale: TAG.scale, maxWidth: TAG.maxWidth });
  }

  // =============================================================================================
  // 4 · profesorado — ten academics around a long table (eight behind it, one at each end); nine
  // hold a small lamp. A text card: «más de la mitad: insegura o dubitativa…» (no count by person).
  // Line 2: a pile of six guideline documents; exactly four (two thirds) get a red seal. One edu-5
  // tag with the survey's scope.

  var PROF = {
    note: { x: 64, y: 40, w: 640, size: 27, pad: 20 },
    tag: { x: 972, y: 172 },
    table: { x: 515, y: 552, w: 760, h: 92 },
    behind: { x0: 180, dx: 96, feet: 520, k: 1.48 },
    endFeet: 562, endK: 1.55,
    lampK: 0.22,
    stack: { x: 1000, y: 360, w: 106, h: 132, dx: 27, n: 6 },
    side: { x: 1114, y: 562, w: 240, h: 70 }
  };
  // Ten academics: the left end, eight behind the table, the right end. Index 6 holds a book, no lamp.
  var ACAD = [
    { role: 'docente', skin: 2, hair: 'bun', pose: 'presenting', facing: 1, end: 92 },
    { role: 'investigadora', skin: 0, hair: 'short', glasses: true },
    { role: 'docente', skin: 4, hair: 'curly' },
    { role: 'investigadora', skin: 1, hair: 'long' },
    { role: 'docente', skin: 3, hair: 'bald', glasses: true },
    { role: 'investigadora', skin: 2, hair: 'braids' },
    { role: 'docente', skin: 0, hair: 'bob', prop: 'book' },
    { role: 'investigadora', skin: 4, hair: 'ponytail' },
    { role: 'docente', skin: 1, hair: 'short', glasses: true },
    { role: 'investigadora', skin: 3, hair: 'curly', pose: 'presenting', facing: -1, end: 946 }
  ];

  function profesorado(ctx, s, env) {
    var C = cuesOf(s, 'profesorado'), st = s.state.profesorado, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    floaters(ctx, s, env, [['pajaro', 1200, 70, 46], ['estrella', 760, 70, 30]], out3(s.intro));
    var a0 = s.at(0), a1 = s.at(1), lw = landWindow(C.nueve), Bh = PROF.behind, i;
    var people = [], lampAt = [];
    // Behind the table first (the table hides their legs), then the table, then the two ends.
    for (i = 1; i <= 8; i++) {
      var A = ACAD[i], x = Bh.x0 + (i - 1) * Bh.dx;
      people[i] = fig.person(ctx, x, Bh.feet, Bh.k, { role: A.role, seed: 'v06:academica' + i, pose: 'reading', prop: A.prop || null, skin: A.skin,
        hair: A.hair, glasses: !!A.glasses, facing: i < 5 ? 1 : -1, p: out3(seg(s.t, 0.2 + i * 0.12, 1.3 + i * 0.12)) });
    }
    var T = PROF.table;
    fig.table(ctx, T.x, T.y, 1, { w: T.w, h: T.h, seed: 'v06:mesa-larga', p: out3(seg(s.t, 0, 1.2)) });
    [0, 9].forEach(function (j) {
      var A = ACAD[j];
      people[j] = fig.person(ctx, A.end, PROF.endFeet, PROF.endK, { role: A.role, seed: 'v06:academica' + j, pose: A.pose, skin: A.skin, hair: A.hair,
        facing: A.facing, p: out3(seg(s.t, 0.1 + j * 0.08, 1.2 + j * 0.08)) });
    });
    // Nine of the ten hold a small lamp («nueve de cada diez»).
    var n = 0;
    for (i = 0; i < 10; i++) {
      var Pi = people[i], A2 = ACAD[i], lx, ly;
      if (A2.prop === 'book') continue;
      if (A2.end) { var hd = Pi.hand.right; lx = hd.x + A2.facing * 12; ly = hd.y - 16; }
      else { lx = (Pi.hand.right.x + Pi.hand.left.x) / 2; ly = (Pi.hand.right.y + Pi.hand.left.y) / 2 - 15; }
      lampAt[i] = { x: lx, y: ly };
      var lp = beat(a0, lw[0] + n * 0.009, lw[0] + 0.03 + n * 0.009);
      n++;
      if (lp > 0) fig.lamp(ctx, lx, ly + Math.sin(s.t * 1.2 + i * 0.9) * 1.5, PROF.lampK, { t: s.t + i * 0.37, p: lp });
    }
    // «más de la mitad: insegura o dubitativa…» — a text card, never a count of people.
    var cp = beat(a0, C.mitad - 0.06, C.mitad + 0.01);
    if (cp > 0) {
      var N = PROF.note, txt = rot(s, 'inseguridad');
      var L = ink.measureText(ctx, txt, { size: N.size, weight: 700, maxWidth: N.w - 2 * N.pad, lineHeight: 1.22 });
      ink.card(ctx, N.x, N.y, N.w, L.h + 2 * N.pad, { seed: 'v06:mitad', weight: 3.6, radius: 10, p: cp, peek: m.rojo, peekCorner: 'tr' });
      ink.text(ctx, txt, N.x + N.pad, N.y + N.pad, { size: N.size, weight: 700, maxWidth: N.w - 2 * N.pad, lineHeight: 1.22, p: seg(cp, 0.45, 1) });
    }
    // Line 2: the guideline documents on a side table; four of six get a seal (two thirds).
    var Sd = PROF.side;
    fig.table(ctx, Sd.x, Sd.y, 1, { w: Sd.w, h: Sd.h, seed: 'v06:mesita', p: out3(seg(s.t, 0.4, 1.4)) });
    var S = PROF.stack, sw = beat(a1, 0, 0.07);
    for (i = 0; i < S.n && sw > 0; i++) {
      var dp = seg(sw, i * 0.1, 0.5 + i * 0.1);
      if (dp <= 0) continue;
      var sx = S.x + i * S.dx, sy = S.y + (i % 2) * 3;
      ctx.save();
      ctx.translate(sx + S.w / 2, sy + S.h / 2);
      ctx.rotate(-0.05 + i * 0.018);
      ink.card(ctx, -S.w / 2, -S.h / 2, S.w, S.h, { seed: 'v06:lineamiento' + i, weight: 2.8, radius: 5, p: dp });
      ctx.save();
      ctx.globalAlpha *= seg(dp, 0.5, 1);
      for (var r = 0; r < 4; r++) ink.line(ctx, st.docLines[r], { w: 2, profile: 'even', seed: 'v06:doc-linea' + r });
      ctx.restore();
      if (i < st.sealed) {
        var press = beat(a1, 0.05 + i * 0.024, 0.075 + i * 0.024);
        if (press > 0) {
          ctx.save();
          ctx.translate(-S.w / 2 + 14, -S.h / 2 + 19);
          ctx.scale(1 + 0.6 * (1 - out3(press)), 1 + 0.6 * (1 - out3(press)));
          ctx.globalAlpha *= out3(press);
          ink.circle(ctx, 0, 0, 9.5, { fill: m.rojo, w: 1.8, seed: 'v06:sello' + i });
          fig.sign(ctx, 'estrella', 0, 0, 13, { seed: 'v06:sello-estrella', mono: true });
          ctx.restore();
        }
      }
      ctx.restore();
    }
    // One tag for the survey (edu-5), with its scope, from the moment it is named.
    var tp = beat(a0, C.unesco, C.unesco + 0.06);
    if (tp > 0) {
      var an = lampAt[8] || { x: 852, y: 430 };
      env.tags.sourceTag(ctx, 'edu-5', { x: PROF.tag.x, y: PROF.tag.y, anchor: { x: an.x + 10, y: an.y - 10 }, p: tp, scale: TAG.scale, maxWidth: TAG.maxWidth });
    }
  }

  // =============================================================================================
  // 5 · evaluar — a ruled sieve under a page of generated text tries to catch the letters falling
  // from it and lets most of them through; at «no es sostenible» it is set aside. Four pieces draw
  // on along a calligraphic path as they are named: «Producto auténtico → Bitácora de proceso →
  // Defensa oral → Uso declarado de IA». Line 2: «¿usó IA?» is struck out and the new question is
  // lettered.

  var EVAL = {
    page: { x: 296, y: 100, w: 336, h: 148 },
    sieve: { x: 464, y: 352, k: 1.45 },
    aside: { x: 124, y: 168, k: 0.66, rot: -0.42 },
    fall: { top: 244, bottom: 560, period: 2.2, n: 26 },
    pathY: 488, stations: [0.1, 0.37, 0.63, 0.9], iconK: 0.78, iconDy: -60,
    label: { dy: 24, size: 24, w: 236 },
    q0: { y: 92, size: 66 }, q1: { y: 200, size: 50, w: 1080 }
  };

  function evaluar(ctx, s, env) {
    var C = cuesOf(s, 'evaluar'), st = s.state.evaluar, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina, i;
    ground(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 830, 96, 34], ['luna', 1210, 520, 40]], out3(s.intro));
    var a0 = s.at(0), a1 = s.at(1);
    var aside = inOut3(beat(a0, C.sostenible - 0.02, C.sostenible + 0.1));
    // The page of generated text: rows of identical ruled marks (the machine's letters).
    var Pg = EVAL.page, pageA = (1 - seg(aside, 0, 0.6)) * out3(seg(s.t, 0.3, 1.4));
    if (pageA > 0) {
      ctx.save();
      ctx.globalAlpha *= pageA;
      ink.card(ctx, Pg.x, Pg.y, Pg.w, Pg.h, { seed: 'v06:pagina-generada', weight: 3.4, radius: 8 });
      ctx.fillStyle = q.noche;
      for (i = 0; i < st.glyphs.length; i += 3) ctx.fillRect(st.glyphs[i], st.glyphs[i + 1], st.glyphs[i + 2], 4);
      ctx.restore();
    }
    // Letters fall through the sieve; a few stay caught in its mesh.
    var Sv = EVAL.sieve, fallA = 1 - seg(aside, 0, 0.35), F = EVAL.fall;
    if (fallA > 0 && s.t > 0.8) {
      ctx.save();
      ctx.globalAlpha *= fallA;
      ctx.fillStyle = q.noche;
      for (i = 0; i < st.letters.length; i++) {
        var Lt = st.letters[i], u = wrapTo(s.t / F.period + Lt.phase, 1);
        var ly = lerp(F.top, F.bottom, u), la = Math.sin(Math.PI * u);
        if (Lt.caught) {
          var since = s.t - Lt.at;
          if (since < 0) continue;
          ly = Math.min(lerp(F.top, Sv.y + Lt.dy, since / (F.period * 0.45)), Sv.y + Lt.dy);
          la = 1;
        }
        ctx.globalAlpha = fallA * la;
        ctx.fillRect(Lt.x - 4, ly - 1.5, 8, 3);
        ctx.fillRect(Lt.x - 1.5, ly - 4, 3, 8);
      }
      ctx.restore();
    }
    var sx = lerp(Sv.x, EVAL.aside.x, aside), sy = lerp(Sv.y, EVAL.aside.y, aside), sk = lerp(Sv.k, EVAL.aside.k, aside);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(EVAL.aside.rot * aside);
    ctx.globalAlpha *= 1 - 0.35 * aside;
    fig.ruledSieve(ctx, 0, 0, sk, { t: s.t, letters: false, p: out3(seg(s.t, 0.4, 1.6)) });
    ctx.restore();

    // The four pieces along the path, each as it is named.
    var cue = [C.p0, C.p1, C.p2, C.p3], names = st.names, U = EVAL.stations;
    var reach = U[0] * beat(a0, cue[0] - 0.1, cue[0]);
    for (i = 1; i < 4; i++) reach += (U[i] - U[i - 1]) * beat(a0, cue[i] - 0.08, cue[i]);
    reach += (1 - U[3]) * beat(a0, cue[3], cue[3] + 0.03);
    if (reach > 0) ink.line(ctx, st.pathPts, { w: 4.2, profile: 'swell', seed: 'v06:camino', p: reach, dot: 'detached' });
    for (i = 0; i < 4; i++) {
      var ip = beat(a0, cue[i] - 0.03, cue[i] + 0.05);
      if (ip <= 0) continue;
      pathAt(st.path, U[i], Q1);
      if (i > 0) {
        pathAt(st.path, (U[i] + U[i - 1]) / 2, Q2);
        ctx.save();
        ctx.translate(Q2.x, Q2.y);
        ctx.rotate(Q2.a);
        ink.line(ctx, st.chevron, { w: 3.6, profile: 'press', seed: 'v06:flecha' + i, p: ip });
        ctx.restore();
      }
      drawPiece(ctx, env, s, st, i, Q1.x, Q1.y + EVAL.iconDy, EVAL.iconK, ip);
      ink.dot(ctx, Q1.x, Q1.y, 6 * ip, m.tinta);
      ink.text(ctx, names[i], Q1.x, Q1.y + EVAL.label.dy, { size: EVAL.label.size, weight: 700, maxWidth: EVAL.label.w, align: 'center', lineHeight: 1.12,
        p: beat(a0, cue[i], cue[i] + 0.04) });
    }

    // Line 2: the question changes.
    var q0p = beat(a1, C.uso - 0.14, C.uso + 0.02);
    if (q0p > 0) {
      ink.letter(ctx, rot(s, 'preguntaAntes'), W / 2, EVAL.q0.y, { size: EVAL.q0.size, align: 'center', maxLines: 1, seed: 'v06:pregunta-antes', underline: false, p: q0p });
      ink.line(ctx, st.strike, { w: 7, profile: 'swell', seed: 'v06:tachado', p: beat(a1, C.sino - 0.03, C.sino + 0.08), color: m.rojo });
    }
    var q1p = beat(a1, C.sino, C.sino + 0.42);
    if (q1p > 0) ink.letter(ctx, rot(s, 'preguntaAhora'), W / 2, EVAL.q1.y, { size: EVAL.q1.size, align: 'center', maxWidth: EVAL.q1.w, maxLines: 2,
      seed: 'v06:pregunta-ahora', p: q1p });
  }

  // =============================================================================================
  // 6 · piezas — the four pieces leave the path and become four cards on a desk, each with what it
  // collects. Then three rules are written, each with its box ticked as it is said.

  var PIEZ = {
    cards: { x0: 64, w: 262, h: 300, gap: 30, y: 96 },
    iconK: 1.55, title: { size: 26, pad: 18 },
    strip: { x: 64, y: 430, w: 1152, h: 100, size: 25, box: 26 }
  };

  function piezas(ctx, s, env) {
    var C = cuesOf(s, 'piezas'), st = s.state.evaluar, ink = env.ink, m = env.pal.mundo, i;
    ground(ctx, s, env);
    var a0 = s.at(0), Cd = PIEZ.cards, peeks = [m.rojo, m.azul, m.amarillo, m.verde];
    var move = inOut3(beat(a0, 0, 0.16));
    for (i = 0; i < 4; i++) {
      var cx = Cd.x0 + i * (Cd.w + Cd.gap), cp = beat(a0, 0.04 + i * 0.025, 0.16 + i * 0.025);
      if (cp > 0) {
        ctx.save();
        ctx.translate(cx + Cd.w / 2, Cd.y + Cd.h / 2);
        ctx.rotate((i % 2 ? 0.018 : -0.022) * cp);
        ink.card(ctx, -Cd.w / 2, -Cd.h / 2, Cd.w, Cd.h, { seed: 'v06:pieza-tarjeta' + i, weight: 4, radius: 12, p: cp, peek: peeks[i], peekCorner: i % 2 ? 'tr' : 'tl' });
        var tl = ink.text(ctx, st.names[i], 0, -Cd.h / 2 + PIEZ.title.pad, { size: PIEZ.title.size, weight: 700, align: 'center', maxWidth: Cd.w - 36,
          lineHeight: 1.12, p: seg(cp, 0.5, 1) });
        ctx.save();
        ctx.translate(0, -Cd.h / 2 + PIEZ.title.pad + tl.h + 12);
        ink.line(ctx, st.divider, { w: 3, profile: 'swell', seed: 'v06:pieza-divisor' + i, p: seg(cp, 0.6, 1), dot: 'detached' });
        ctx.restore();
        ctx.restore();
      }
      // The piece itself flies from its station on the path into its card.
      pathAt(st.path, EVAL.stations[i], Q1);
      var ix = lerp(Q1.x, cx + Cd.w / 2, move), iy = lerp(Q1.y + EVAL.iconDy, Cd.y + Cd.h - 108, move), ik = lerp(EVAL.iconK, PIEZ.iconK, move);
      drawPiece(ctx, env, s, st, i, ix, iy, ik, 1);
    }
    // «qué usos de IA están permitidos, cómo se declaran y qué parte se hace sin IA».
    var Sp = PIEZ.strip, spP = beat(a0, C.claridad - 0.02, C.claridad + 0.06);
    if (spP > 0) {
      ink.card(ctx, Sp.x, Sp.y, Sp.w, Sp.h, { seed: 'v06:reglas', weight: 3.4, radius: 10, p: spP });
      var keys = ['permitidos', 'declaran', 'sinIA'], cues = [C.r0, C.r1, C.r2], widths = [], total = 0;
      for (i = 0; i < 3; i++) {
        widths[i] = Sp.box + 14 + ink.measureText(ctx, rot(s, keys[i]), { size: Sp.size, weight: 700 }).w;
        total += widths[i];
      }
      var gap = (Sp.w - 60 - total) / 2, x = Sp.x + 30, cy = Sp.y + Sp.h / 2;
      for (i = 0; i < 3; i++) {
        var ap = beat(a0, cues[i] - 0.04, cues[i] + 0.03);
        if (ap > 0) {
          ctx.save();
          ctx.translate(x, cy - Sp.box / 2);
          ink.shape(ctx, st.box, { w: 3, seed: 'v06:casilla', p: ap });
          ink.line(ctx, st.tick, { w: 4.4, profile: 'press', seed: 'v06:visto' + i, p: beat(a0, cues[i] + 0.01, cues[i] + 0.07), color: m.rojo });
          ctx.restore();
          ink.text(ctx, rot(s, keys[i]), x + Sp.box + 14, cy - Sp.size * 0.62, { size: Sp.size, weight: 700, p: ap });
        }
        x += widths[i] + gap;
      }
    }
  }

  // =============================================================================================
  // 7 · riesgos — the boat passes between a warm current with helpful signs (tutoría,
  // retroalimentación, accesibilidad) and a dark eddy of identical repeated shapes (dependencia
  // cognitiva, respuestas homogéneas, aprendizaje superficial). Line 2: a warning buoy by the eddy,
  // then a sheltered cove where students row on their own («actividades sin IA»). Line 3: the
  // lectora asks from the pier.

  var RIES = {
    horizon: 150,
    band: [-60, 262, 260, 236, 620, 258, 980, 230, 1340, 250], bandW: 28,
    helpers: [{ u: 0.21, sign: 'estrella', key: 'tutoria' }, { u: 0.5, sign: 'espiral', key: 'retroalimentacion' }, { u: 0.79, sign: 'escalera', key: 'accesibilidad' }],
    eddy: { x: 1046, y: 452, r: 94, n: 30 },
    dark: { x: 926, y: 400, gap: 36, size: 23, keys: ['dependencia', 'homogeneas', 'superficial'] },
    boat: { x0: 372, x1: 444, y: 404, k: 1.25 },
    buoy: { x: 902, y: 336 },
    cove: { x: 132, y: 500 },
    pier: { x: 1112, y: 566 },
    lectora: { x: 1208, y: 562, k: 2.05 }
  };

  function riesgos(ctx, s, env) {
    var C = cuesOf(s, 'riesgos'), st = s.state.riesgos, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina, i;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), a2 = s.at(2), intro = out3(s.intro);
    floaters(ctx, s, env, [['pajaro', 640, 70, 44], ['sol', 1180, 70, 54]], intro);
    // The warm current: a flat yellow band with red flecks flowing along it.
    var bp = beat(a0, C.h0 - 0.16, C.h0 - 0.02);
    if (bp > 0) {
      ink.draw(ctx, st.band, 0, 0, 1, { p: bp, offset: 3 });
      ctx.save();
      ctx.globalAlpha *= seg(bp, 0.6, 1);
      for (i = 0; i < 22; i++) {
        pathAt(st.bandPath, wrapTo(i / 22 + s.t * 0.018, 1), Q1);
        var off = Math.sin(i * 2.3) * 12;
        ink.dot(ctx, Q1.x + Q1.nx * off, Q1.y + Q1.ny * off, 3, i % 3 ? m.rojo : m.tierra);
      }
      ctx.restore();
    }
    var hc = [C.h0, C.h1, C.h2];
    for (i = 0; i < 3; i++) {
      var hp = beat(a0, hc[i] - 0.04, hc[i] + 0.04);
      if (hp <= 0) continue;
      var Hh = RIES.helpers[i];
      pathAt(st.bandPath, Hh.u, Q1);
      var bob = Math.sin(s.t * 1.3 + i * 2) * 3;
      fig.sign(ctx, Hh.sign, Q1.x, Q1.y + bob, 58, { seed: 'v06:ayuda' + i, p: hp });
      ink.text(ctx, rot(s, Hh.key), Q1.x, Q1.y - 68, { size: 24, weight: 700, align: 'center', p: seg(hp, 0.4, 1) });
    }
    // The dark eddy: identical ruled shapes turning around one point, on a dark wash.
    var E = RIES.eddy, dc = [C.d0, C.d1, C.d2], ep = beat(a0, C.d0 - 0.12, C.d0);
    if (ep > 0) {
      ink.glow(ctx, E.x, E.y, E.r * 1.55, q.noche, 0.85 * ep);
      for (i = 0; i < E.n; i++) {
        if (i > E.n * ep) break;
        var f = i / E.n, ang = -s.t * 0.5 + f * TAU * 2.6, rr = E.r * (0.12 + 0.88 * f);
        var px = E.x + Math.cos(ang) * rr, py = E.y + Math.sin(ang) * rr * 0.82;
        ink.rRect(ctx, px - 6, py - 6, 12, 12, { fill: q.noche, color: q.linea, w: 1.2 });
      }
    }
    var D = RIES.dark;
    for (i = 0; i < 3; i++) {
      var dp = beat(a0, dc[i] - 0.03, dc[i] + 0.05);
      if (dp > 0) ink.text(ctx, rot(s, D.keys[i]), D.x, D.y + i * D.gap, { size: D.size, weight: 700, align: 'right', p: dp });
    }
    // Line 2: a warning buoy rocks by the eddy; then the cove where students row without the lamp.
    var wp = beat(a1, C.advierte - 0.04, C.advierte + 0.06);
    if (wp > 0) ink.draw(ctx, st.buoy, RIES.buoy.x, RIES.buoy.y + Math.sin(s.t * 1.6) * 3, 1, { p: wp, rot: Math.sin(s.t * 1.6 + 0.6) * 0.08 });
    var cp = beat(a1, C.preservar - 0.04, C.preservar + 0.1);
    if (cp > 0) {
      var Cv = RIES.cove, pull = Math.sin(s.t * 2.2);
      ink.draw(ctx, st.cove, 0, 0, 1, { p: cp, offset: 3 });
      ctx.save();
      ctx.translate(Cv.x + Math.sin(s.t * 0.4) * 6, Cv.y + Math.sin(s.t * 1.3) * 1.5);
      fig.person(ctx, -22, -2, 0.72, { role: 'estudiante', seed: 'v06:remo0', pose: 'standing', skin: 4, hair: 'curly', facing: 1, p: cp });
      fig.person(ctx, 24, -2, 0.72, { role: 'estudiante', seed: 'v06:remo1', pose: 'standing', skin: 1, hair: 'bun', facing: -1, p: cp });
      ink.draw(ctx, st.rowboat, 0, 0, 1, { p: cp });
      // Two oars pivot at the gunwale and pull: no motor, no lamp.
      for (var o = 0; o < 2; o++) {
        ctx.save();
        ctx.translate(o ? 36 : -36, -8);
        ctx.rotate((o ? -1 : 1) * (0.55 + 0.2 * pull));
        ink.line(ctx, st.oar, { w: 3.2, profile: 'blunt', seed: 'v06:remo' + o, p: cp });
        ctx.restore();
      }
      ctx.restore();
      ink.text(ctx, rot(s, 'sinIA'), Cv.x, Cv.y - 112, { size: 24, weight: 700, align: 'center', p: seg(cp, 0.5, 1) });
    }
    // The boat drifts on between the two currents.
    var bx = lerp(RIES.boat.x0, RIES.boat.x1, s.p), by = RIES.boat.y + Math.sin(s.t * 1.5) * 2.5, bk = RIES.boat.k;
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(bk, bk);
    ink.dotted(ctx, st.trail, { r: 2.2, gap: 11, seed: 'v06:ries-espuma', color: m.lienzo });
    ctx.restore();
    boatWith(ctx, env, s, bx, by, bk, { rot: Math.sin(s.t * 1.5 + 0.8) * 0.016, p: intro });
    var lp = out3(beat(a2, 0, 0.18));
    if (lp > 0) fig.lectora(ctx, RIES.lectora.x, RIES.lectora.y, RIES.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  // =============================================================================================
  // 8 · cinco-frentes — at dusk the lighthouse lights up; five beams sweep the campus, each ending
  // on its card as the front is named.

  var FREN = {
    horizon: 560,
    light: { x: 190, y: 566, k: 1.12 },
    cards: { x: 846, w: 300, h: 64, ys: [92, 184, 276, 368, 460] },
    keys: ['gobernanza', 'curriculo', 'evaluacion', 'infraestructura', 'investigacion']
  };

  function cincoFrentes(ctx, s, env) {
    var C = cuesOf(s, 'cinco-frentes'), ink = env.ink, fig = env.fig, m = env.pal.mundo, i;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), L = FREN.light;
    floaters(ctx, s, env, [['estrella', 380, 72, 30, { a: m.amarillo }], ['estrella', 560, 150, 22, { a: m.amarillo }], ['luna', 680, 64, 46]], out3(s.intro));
    var lx = L.x, ly = L.y - 237.6 * L.k;
    var lit = beat(a0, 0, Math.max(0.08, C.cinco));
    var cues = [[a0, C.f0], [a0, C.f1], [a0, C.f2], [a1, C.f3], [a1, C.f4]], Cd = FREN.cards;
    for (i = 0; i < 5; i++) {
      var at = cues[i][0], cu = cues[i][1], e = inOut3(beat(at, cu - 0.08, cu + 0.01));
      if (e <= 0) continue;
      var ty = Cd.ys[i] + Cd.h / 2, target = Math.atan2(ty - ly, Cd.x - lx), from = i ? Math.atan2(Cd.ys[i - 1] + Cd.h / 2 - ly, Cd.x - lx) : 0.6;
      var a = lerp(from, target, e) + Math.sin(s.t * 0.7 + i) * 0.006 * e;
      var len = Math.sqrt(Math.pow(Cd.x - lx, 2) + Math.pow(ty - ly, 2)) * lerp(0.6, 1, e);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a);
      var g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, env.pal.rgba(m.amarillo, 0.8));
      g.addColorStop(1, env.pal.rgba(m.amarillo, 0.32));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(len, -30);
      ctx.lineTo(len, 30);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      var cp = seg(e, 0.55, 1);
      if (cp > 0) {
        ink.card(ctx, Cd.x, Cd.ys[i], Cd.w, Cd.h, { seed: 'v06:frente' + i, weight: 3.6, radius: 10, p: cp });
        ink.letter(ctx, rot(s, FREN.keys[i]), Cd.x + 22, Cd.ys[i] + 10, { size: 36, maxWidth: Cd.w - 40, maxLines: 1, seed: 'v06:frente-titulo' + i,
          underline: false, p: beat(at, cu, cu + 0.12) });
      }
    }
    if (lit > 0) ink.glow(ctx, lx, ly, 70 + 14 * Math.sin(s.t * 1.4), m.amarillo, 0.8 * lit);
    fig.lighthouse(ctx, L.x, L.y, L.k, { beam: null, p: out3(seg(s.t, 0, 1.2)) });
  }

  // =============================================================================================
  // 9 · cierre — the boat now carries a compass and turns toward the lighthouse; final title.

  var CIERRE = {
    horizon: 236, light: { x: 1088, y: 244, k: 0.42 },
    boat: { x0: 470, y0: 474, k0: 1.5, x1: 760, y1: 396, k1: 1.08, rot0: 0.05, rot1: -0.06 },
    title: { y: 26, size: 62 }
  };

  function cierre(ctx, s, env) {
    var st = s.state.lancha, ink = env.ink, m = env.pal.mundo, B = CIERRE.boat, Lh = CIERRE.light;
    ground(ctx, s, env);
    var a0 = s.at(0), intro = out3(s.intro);
    lighthouse(ctx, env, Lh, Math.PI + 0.06, 1);
    floaters(ctx, s, env, [['pajaro', 930, 110, 46]], intro);
    foam(ctx, s, env, st.foam, 0.6);
    var e = inOut3(seg(s.t, 0.5, s.dur - 1));
    var bx = lerp(B.x0, B.x1, e), by = lerp(B.y0, B.y1, e) + Math.sin(s.t * 1.6) * 2, k = lerp(B.k0, B.k1, e);
    // A straight wake now: the boat keeps its course.
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(k, k);
    ink.line(ctx, st.course, { w: 3, profile: 'swell', seed: 'v06:rumbo', p: out3(seg(s.t, 0.4, 3)) });
    ink.dotted(ctx, st.trail, { r: 2.2, gap: 10, seed: 'v06:cierre-espuma', color: m.lienzo });
    ctx.restore();
    boatWith(ctx, env, s, bx, by, k, { rot: lerp(B.rot0, B.rot1, e) + Math.sin(s.t * 1.6 + 0.8) * 0.012, p: 1, compass: out3(seg(s.t, 0.1, 1.2)),
      toward: { x: Lh.x, y: Lh.y - 237.6 * Lh.k } });
    ink.letter(ctx, rot(s, 'titulo'), W / 2, CIERRE.title.y, { size: CIERRE.title.size, align: 'center', maxWidth: 1180, maxLines: 1, seed: 'v06:titulo-final',
      p: beat(a0, 0.02, 0.62) });
  }

  // =============================================================================================
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, m = env.pal.mundo, video = findVideo(env.id || 'v06'), i, r;
    var st = { pieces: buildPieces(env) };

    st.campus = { divider: ink.wavePoints(110, CAMPUS.bars.divider, 1170, 1.6, 140, 0.4) };

    // lancha / cierre: foam strokes at the origin, the looping wake and the straight course (boat
    // units, waterline center at the origin, motor at x ≈ −200).
    r = env.rng('v06:espuma');
    var foamList = [];
    for (i = 0; i < 9; i++) {
      var len = r.range(70, 150);
      foamList.push({ pts: ink.wavePoints(0, 0, len, r.range(1.6, 3), r.range(40, 70), r() * 6), y: 290 + i * 34 + r.range(-8, 8),
        x0: r.range(0, W + 500), speed: r.range(70, 150), w: r.range(2.2, 3.2) });
    }
    st.lancha = {
      foam: foamList,
      trail: [-204, 12, -250, 18, -300, 16, -350, 20],
      wake: [-204, 10, -262, 16, -318, 8, -352, -14, -336, -40, -300, -38, -292, -14, -322, 10, -384, 22, -446, 14, -486, -8, -478, -32,
        -440, -30, -434, -6, -474, 18, -546, 28, -630, 22],
      course: [-204, 12, -300, 20, -420, 30, -560, 44, -700, 60]
    };

    // profesorado: the scribbled lines of a guideline document (card-centered units) and how many of
    // the six documents are sealed: two thirds of them («Dos tercios», edu-5), exactly four.
    st.profesorado = {
      sealed: Math.round(PROF.stack.n * 2 / 3),
      docLines: [[-30, -30, 34, -31], [-38, -12, 36, -13], [-38, 6, 30, 5], [-38, 24, 22, 23]]
    };

    // evaluar: the generated page (rows of identical marks), the falling letters, the path, the
    // chevrons between pieces, the strike over the old question and the piece names (rótulo
    // «camino», split at its arrows).
    var Pg = EVAL.page, glyphs = [];
    r = env.rng('v06:texto-generado');
    for (var row = 0; row < 5; row++) {
      var gx = Pg.x + 26, gy = Pg.y + 30 + row * 22, end = Pg.x + Pg.w - (row === 4 ? 120 : 26);
      while (gx < end) {
        var ww = Math.round(r.range(3, 7)) * 6;
        if (gx + ww > end) break;
        glyphs.push(gx, gy, ww);
        gx += ww + 8;
      }
    }
    var letters = [], F = EVAL.fall;
    r = env.rng('v06:letras');
    for (i = 0; i < F.n; i++) {
      var caught = i % 7 === 3;
      letters.push({ x: EVAL.sieve.x + r.range(-96, 96), phase: r(), caught: caught, at: 1.2 + i * 0.22, dy: r.range(-10, 6) });
    }
    var path = samplePath(ink, [70, EVAL.pathY + 6, 340, EVAL.pathY - 22, 640, EVAL.pathY + 10, 930, EVAL.pathY - 18, 1210, EVAL.pathY + 4], 4);
    var pathPts = [];
    for (i = 0; i < path.n; i += 3) pathPts.push(path.x[i], path.y[i]);
    var names = rotText(video, 'evaluar', 'camino').split('→').map(function (t) { return t.trim(); });
    var mctx = env.canvas(8, 8).getContext('2d');
    var q0 = rotText(video, 'evaluar', 'preguntaAntes');
    var qw = ink.measureLetter(mctx, q0, { size: EVAL.q0.size, align: 'center', maxLines: 1, seed: 'v06:pregunta-antes', underline: false }).w;
    st.evaluar = {
      glyphs: glyphs, letters: letters, path: path, pathPts: pathPts, names: names, pieces: st.pieces,
      chevron: [-12, -11, 2, 0, -12, 11],
      strike: [W / 2 - qw / 2 - 22, EVAL.q0.y + EVAL.q0.size * 0.62, W / 2, EVAL.q0.y + EVAL.q0.size * 0.5, W / 2 + qw / 2 + 24, EVAL.q0.y + EVAL.q0.size * 0.4],
      divider: ink.wavePoints(-62, 0, 62, 2.4, 44, 0.6),
      box: [0, 0, PIEZ.strip.box, 0, PIEZ.strip.box, PIEZ.strip.box, 0, PIEZ.strip.box],
      tick: [4, 13, 11, 22, 30, -6]
    };
    st.evaluar.pieces = st.pieces;

    // riesgos: the warm band, the buoy, the cove and its rowboat.
    var bandPath = samplePath(ink, RIES.band, 5);
    var bb = ink.drawing('v06:corriente-calida', { w: 3.4, jitter: 0.6 });
    var top = alongPath(bandPath, 0, 1, -RIES.bandW, 24);
    var band = top.concat(alongPath(bandPath, 1, 0, RIES.bandW, 24));
    bb.fill(band, { fill: m.amarillo, fillScale: 0, fillJitter: 1.4 });
    bb.stroke(top, { w: 3, profile: 'swell' });
    bb.stroke(alongPath(bandPath, 0, 1, RIES.bandW, 24), { w: 2.4, profile: 'swell' });
    var buoy = ink.drawing('v06:boya', { w: 3, jitter: 0.4 });
    buoy.shape([-16, 6, 16, 6, 12, 22, -12, 22], { fill: m.rojo, w: 3, fillScale: 0 });
    buoy.shape([-12, 6, 12, 6, 8, -16, -8, -16], { fill: m.lienzo, w: 3, fillScale: 0 });
    buoy.stroke([0, -16, 0, -54], { w: 3, profile: 'blunt' });
    buoy.shape([0, -54, 26, -46, 0, -38], { fill: m.rojo, w: 2.6, fillScale: 0 });
    var cove = ink.drawing('v06:cala', { w: 3.6, jitter: 0.6 });
    var Cv = RIES.cove;
    cove.shape([-40, 520, 30, 470, 120, 446, 230, 452, 300, 492, 300, 740, -40, 740], { fill: m.lienzoOcre, w: 3.6, fillScale: 0, fillJitter: 1 });
    cove.blob(Cv.x + 12, Cv.y + 26, 120, 32, { fill: env.pal.mix(m.celeste, m.lienzo, 0.45), w: 2.6, irr: 0.1, n: 12 });
    var rowboat = ink.drawing('v06:bote', { w: 3.2, jitter: 0.5 });
    rowboat.shape([-58, -10, 58, -10, 44, 12, -44, 12], { fill: m.tierra, w: 3.4, fillScale: 0 });
    st.riesgos = {
      band: bb.done(), bandPath: bandPath, buoy: buoy.done(), cove: cove.done(), rowboat: rowboat.done(),
      oar: [0, 0, 0, 48], trail: [-204, 12, -250, 18, -300, 16, -350, 20]
    };
    return st;
  }

  // ---------------------------------------------------------------------------------------------
  // Static grounds of the scenes (prompt §14).

  function patioLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d');
    env.fig.patio(g, 0, 0, 1, { seed: 'v06:patio' });
    return { bg: c };
  }

  function duskLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo, q = env.pal.maquina, hz = FREN.horizon;
    ink.background(g, 'territorio', { seed: 'v06:atardecer', horizon: hz / H, contours: false });
    var sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, env.pal.mix(q.noche, m.azul, 0.55));
    sky.addColorStop(1, env.pal.mix(m.azul, m.celeste, 0.55));
    g.save();
    g.globalAlpha = 0.92;
    g.fillStyle = sky;
    g.fillRect(0, 0, W, hz + 2);
    g.restore();
    ink.wash(g, 0, 0, W, hz, { seed: 'v06:atardecer-lavado', colors: [m.azul, q.noche], alpha: 0.2 });
    // The campus: an arcade, a tower and a domed hall in warm flat shapes along the horizon.
    var b = ink.drawing('v06:campus', { w: 4, jitter: 0.8 });
    b.shape([420, hz, 420, 420, 760, 420, 760, hz], { fill: m.lienzoOcre, w: 4, fillScale: 0 });
    for (var i = 0; i < 5; i++) {
      var ax = 452 + i * 66;
      b.shape([ax - 22, hz, ax - 22, 470, ax - 12, 452, ax, 446, ax + 12, 452, ax + 22, 470, ax + 22, hz], { fill: m.tierra, w: 3, fillScale: 0 });
    }
    b.shape([400, 420, 590, 380, 780, 420], { fill: m.rojo, w: 3.6, fillScale: 0 });
    b.shape([800, hz, 800, 330, 870, 330, 870, hz], { fill: m.lienzoOcre, w: 4, fillScale: 0 });
    b.shape([790, 334, 835, 290, 880, 334], { fill: m.azul, w: 3.4, fillScale: 0 });
    b.circle(835, 372, 14, { fill: m.amarillo, w: 3 });
    b.shape([900, hz, 900, 452, 1220, 452, 1220, hz], { fill: m.lienzoOcre, w: 4, fillScale: 0 });
    b.shape([960, 452, 990, 392, 1060, 366, 1130, 392, 1160, 452], { fill: m.verde, w: 3.6, fillScale: 0 });
    for (i = 0; i < 6; i++) b.shape([930 + i * 48, 500, 930 + i * 48, 476, 952 + i * 48, 476, 952 + i * 48, 500], { fill: m.amarillo, w: 2.6, fillScale: 0 });
    ink.draw(g, b.done(), 0, 0, 1, { offset: 3 });
    // The rock under the lighthouse.
    ink.blob(g, FREN.light.x, FREN.light.y + 4, 120, 26, { fill: m.siena, w: 3.6, seed: 'v06:roca', irr: 0.18, n: 10 });
    return { bg: c };
  }

  function deskLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo;
    ink.background(g, 'personas', { seed: 'v06:pagina' });
    var b = ink.drawing('v06:escritorio', { w: 4.4, jitter: 0.8 });
    b.shape([24, 150, 640, 132, 1256, 146, 1262, 600, 640, 612, 18, 598], { fill: env.pal.mix(m.tierra, m.lienzoOcre, 0.4), w: 4.4, fillScale: 0, fillJitter: 1.2 });
    b.stroke([60, 590, 600, 596, 1220, 588], { w: 2.4, profile: 'swell', alpha: 0.5 });
    ink.draw(g, b.done(), 0, 0, 1, { offset: 3 });
    return { bg: c };
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v06 = {
    setup: setup,
    layers: {
      campus: patioLayer,
      lancha: seaLayer(LANCHA.horizon, 'lancha', function (g, env) { pierInto(g, env, LANCHA.pier.x, LANCHA.pier.y); }),
      preparacion: groundLayer('datos', {}),
      profesorado: groundLayer('personas', {}),
      evaluar: groundLayer('personas', {}),
      piezas: deskLayer,
      riesgos: seaLayer(RIES.horizon, 'riesgos', function (g, env) { pierInto(g, env, RIES.pier.x, RIES.pier.y); }),
      'cinco-frentes': duskLayer,
      cierre: seaLayer(CIERRE.horizon, 'cierre')
    },
    scenes: {
      campus: campus,
      lancha: lancha,
      preparacion: preparacion,
      profesorado: profesorado,
      evaluar: evaluar,
      piezas: piezas,
      riesgos: riesgos,
      'cinco-frentes': cincoFrentes,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
