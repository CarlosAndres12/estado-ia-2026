/* js/videos/v03-frontera.js — V03 «La frontera irregular» (prompt §13, sesión 2; KB §5; láminas D3–D5).
 *
 * Fifteen scenes in four chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Picos y valles                pregunta · cordillera · casi-pico · valles · saturacion
 *   2 De chatbot a agente           chatbot · escalera · empresas
 *   3 Errores que se acumulan       pasos · limites · tendencia
 *   4 Convergencia y concentración  peloton · concentracion · abiertos · cierre
 *
 * The metaphors are the ones of láminas D3–D5 (prompt §12.2): a cordillera of flat biomorphic
 * mountains crossed by a small warm climber (two peaks lit in yellow, two deep ultramarine
 * valleys); the AI as the small ruled lamp moving along a ruled agent loop and climbing a ruled
 * ladder whose top rung is cracked; six identical lamps on thin ruled wheels with plain pennants
 * (patterns only: no names, flags or logos). Every benchmark result (GPQA, MMMU, astrophysics
 * replication, PaperArena, the three saturating benchmarks, OSWorld, Terminal-Bench 2.0 and the
 * task horizon) lives in a ruled navy panel set inside the warm scene; real work is warm and free.
 *
 * Honest marks (prompt §3.7): bars on one zero-based scale per frame (valles, concentracion), the
 * three gains as arc arrows on three dials with ONE shared 0–100 scale, rungs at exact heights,
 * exactly 23 lit windows of 100, the 10% ceiling as a line on a 0–100% track with no bars under it,
 * 59 · 35 · 8 notable models as rows of identical unit cells, 102 cards with 47 marked «API», and
 * the task horizon as a straight line on a doubling grid (its slope is the doubling time) that
 * stops at the present: fog beyond it, no dotted extension. The two methodologies of the horizon
 * sit in separate panels. The step-by-step calculation of «pasos» is an illustrative example (the
 * player stamps «Ejemplo ilustrativo»); its bars are the exact products 0,95^k and 0,99^k.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings
 * it, and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds.
 * A figure lands by the time its subtitle chunk appears and holds, exact and tagged, to the end of
 * its scene. No string, number or source is typed here: copy comes from s.rotulos
 * (js/data/videos.js), values from env.chart.parseValue(rótulo), sources from env.tags. Draw
 * functions are pure functions of (s, env): motion comes from s.t, geometry is built in setup(). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.videos = EIA.videos || {};

  var W = 1280, H = 720, TAU = Math.PI * 2;

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)); }
  // A beat inside a line: like seg on s.at(i), but never before the line starts (a cue at 0).
  function beat(at, a, b) { return at <= 0 ? 0 : seg(at, Math.max(0, a), b); }
  function out3(t) { t = 1 - clamp01(t); return 1 - t * t * t; }
  function inOut3(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function noise(x, seed) { return EIA.engine.rng.noise1(x, seed); }
  function rot(s, key) { var r = s.rotulos && s.rotulos[key]; return r ? r.text : ''; }
  // Scene-local time at share u of line i.
  function lineT(s, i, u) { var L = s.lines[i]; return L ? L.start + (L.end - L.start) * u : s.dur; }
  // Ambient motion that rests at both ends of a scene, so crossfades blend identical frames.
  function calm(s) { return seg(s.t, 0, 1.2) * seg(s.dur - s.t, 0, 1.2); }
  // Value of a data string ("88,2%", "+48,9", "menos de 20%"); 0 when it holds no number.
  function val(env, text) { var v = env.chart.parseValue(text); return v ? v.value : 0; }
  // Pieces of a rótulo split at a separator of its own text («PaperArena: …», «20% … → 77,3% …»).
  function piece(text, sep, i) { var a = String(text).split(sep); return a[i] == null ? '' : a[i].trim(); }
  // Every number of a data string, as the KB writes them ("0,95 elevado a 20 ≈ 0,36" → 0.95, 20,
  // 0.36; "(2019–2025)" → 2019, 2025): counts and exponents the drawing needs come from the copy.
  function numbersIn(text) {
    var out = [], re = /\d+(?:\.\d{3})*(?:,\d+)?/g, mt;
    while ((mt = re.exec(String(text))) !== null) out.push(parseFloat(mt[0].replace(/\./g, '').replace(',', '.')));
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    cordillera: { valles: [0, 'valles profundos', 'word'], referencia: [1, 'la referencia de expertos', 'word'],
      gpqa: [1, 'en preguntas científicas', 'chunk'], mate: [1, 'y alcanzan o superan', 'chunk'] },
    'casi-pico': { cifra: [0, '88,2%', 'chunk'], brecha: [0, '0,4 puntos', 'word'] },
    valles: { astro: [0, 'menos de 20%', 'chunk'], paper: [0, '38,8%', 'chunk'], promedio: [1, 'El promedio', 'chunk'],
      peor: [1, 'del peor resultado', 'word'] },
    saturacion: { cifras: [0, '18,8 puntos', 'chunk'], distinguir: [1, 'deja de distinguir', 'word'],
      t0: [1, 'evaluaciones dinámicas', 'word'], t1: [1, 'tareas no contaminadas', 'word'], t2: [1, 'varios intentos', 'word'],
      t3: [1, 'fuera de distribución', 'word'], t4: [1, 'medición de daños', 'word'] },
    chatbot: { chatbot: [0, 'Un chatbot responde', 'chunk'], agente: [0, 'Un agente persigue', 'chunk'], objetivo: [0, 'un objetivo', 'word'],
      s1: [0, 'planifica,', 'word'], s2: [0, 'usa herramientas', 'word'], s3: [0, 'ejecuta,', 'word'], s4: [0, 'verifica y', 'word'],
      vuelve: [0, 'vuelve a planificar', 'word'] },
    escalera: { osworld: [0, 'En OSWorld', 'chunk'], cifras: [0, 'pasaron de cerca de 12%', 'chunk'], sube: [0, 'a 66,3%', 'word'],
      falla: [0, 'Aún fallan', 'chunk'], sube2: [1, 'a 77,3%', 'word'] },
    empresas: { escala: [0, '23%', 'chunk'], ninguna: [0, 'y en ninguna función', 'chunk'] },
    pasos: { si: [0, 'si cada paso', 'chunk'], tarea: [0, 'una tarea de 20 pasos', 'chunk'], acumulan: [1, 'Los errores se acumulan', 'chunk'] },
    limites: { errores: [0, 'Los errores se acumulan', 'chunk'], observabilidad: [0, 'Hay poca observabilidad', 'chunk'],
      correo: [1, 'correo', 'word'], archivos: [1, 'archivos', 'word'], sistemas: [1, 'o sistemas', 'word'] },
    tendencia: { duracion: [0, 'la duración de las tareas', 'chunk'], duplico: [0, 'Entre 2019 y 2025', 'chunk'],
      dias: [1, 'el tiempo de duplicación', 'chunk'], tendencia: [1, 'es una tendencia', 'word'] },
    peloton: { convergen: [0, 'los modelos convergen', 'word'], brecha: [0, 'Y Stanford considera', 'chunk'],
      w0: [1, 'al costo', 'word'], w1: [1, 'la latencia', 'word'], w2: [1, 'la confiabilidad', 'word'], w3: [1, 'la privacidad', 'word'],
      w4: [1, 'la integración', 'word'], w5: [1, 'la apertura', 'word'] },
    concentracion: { industria: [0, 'más de 90%', 'chunk'], paises: [0, 'Estados Unidos produjo 59', 'chunk'],
      parametros: [1, 'los parámetros', 'word'], datos: [1, 'los datos', 'word'], duracion: [1, 'la duración del entrenamiento', 'word'] },
    abiertos: { proteinas: [0, '111 millones', 'chunk'], api: [1, '47 de 102', 'chunk'], pesos: [1, 'Y ojo', 'chunk'],
      codigo: [1, 'código', 'word'], datos: [1, 'datos y', 'word'], proceso: [1, 'proceso abiertos', 'word'] },
    cierre: { picos: [0, 'dónde están los picos', 'word'], valles: [0, 'dónde los valles', 'word'], error: [0, 'cuánto cuesta un error', 'word'] }
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
  function sceneOf(video, id) {
    return ((video && video.scenes) || []).filter(function (x) { return x.id === id; })[0] || { rotulos: {}, lines: [] };
  }
  function sceneRotulos(video, id) { return sceneOf(video, id).rotulos || {}; }
  function lineText(video, id, i) { var L = (sceneOf(video, id).lines || [])[i]; return L ? L.text : ''; }
  function rotText(video, id, key) { var r = sceneRotulos(video, id)[key]; return r ? r.text : ''; }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function ground(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v03:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14).
  function groundLayer(kind, opts) {
    return function (env) {
      var c = env.canvas(W, H), o = { seed: 'v03:pagina' }, k;
      for (k in opts || {}) o[k] = opts[k];
      env.ink.background(c.getContext('2d'), kind, o);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, colors?]; keep them
  // clear of the subtitle band (y > 570) and of the player's overlays.
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v03:fx' + i) * 9, f[2] + noise(t * 0.8, 'v03:fy' + i) * 7, f[3], {
        seed: 'v03:float' + f[0] + i, colors: f[4] || null, rot: noise(t * 0.6, 'v03:fr' + i) * 0.14, p: p
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
    var img = env.ink.layer(ctx, 'v03:letra|' + key + '|' + size + '|' + (full.color || ''), w, h, function (g) {
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

  // A ruled navy panel revealed from the top, as if slid in under a ruler.
  function panelIn(ctx, env, P, e, cell) {
    if (e <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(P.x - 2, P.y - 2, P.w + 4, (P.h + 4) * e);
    ctx.clip();
    env.fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: cell || 14 });
    ctx.restore();
  }

  // One source tag per figure, at the size the course uses in videos.
  function sourceTag(ctx, env, ids, x, y, anchor, p) {
    if (p <= 0) return null;
    return env.tags.sourceTag(ctx, ids, { x: x, y: y, anchor: anchor, p: p, scale: 1.08 });
  }

  // Polyline sampled by arc length (for walks along a drawn outline).
  function polyPath(xs, ys) {
    var n = xs.length, s = new Float32Array(n);
    for (var i = 1; i < n; i++) s[i] = s[i - 1] + Math.sqrt(Math.pow(xs[i] - xs[i - 1], 2) + Math.pow(ys[i] - ys[i - 1], 2));
    return { x: xs, y: ys, s: s, n: n, len: s[n - 1] || 1 };
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
    outp.nx = -dy / dl; outp.ny = dx / dl;
    return outp;
  }
  var Q1 = {}, Q2 = {};   // scratch points, overwritten by every call (no state across frames)

  // ---------------------------------------------------------------------------------------------
  // The cordillera (D3): fig.cordillera on a 1280×720 stage, filmed by a camera { x, y, k }
  // (screen = cam + k · stage). The camera keeps one zoom per scene (the engine caches the range
  // per scale) and only pans. Two peaks light in yellow; two deep ultramarine valleys, drawn here
  // as V-shaped fields behind the range (only the gap between two slopes shows).

  var BASE = 600;
  var PEAKS = [
    { x: 0.05, h: 0.34 }, { x: 0.20, h: 0.74 }, { x: 0.38, h: 0.68 }, { x: 0.56, h: 0.80 },
    { x: 0.72, h: 0.60 }, { x: 0.86, h: 0.40 }, { x: 0.99, h: 0.30 }
  ];
  var GPQA = 1, MATE = 3, MODESTO = 5;
  // The two valleys: their V field (stage units; its sides hide behind the slopes) and its depth.
  var VALLEYS = [
    { x: 382, y: 360, pts: [258, 228, 310, 240, 372, 256, 440, 254, 494, 252, 410, 470, 382, 482, 356, 470] },
    { x: 846, y: 372, pts: [722, 196, 784, 236, 846, 270, 900, 288, 936, 296, 866, 452, 846, 464, 826, 452] }
  ];

  // fig.cordillera's own peak geometry (stage units).
  function peakGeom(i) {
    var pk = PEAKS[i], px = pk.x * 1280, top = BASE - pk.h * 520, hw = 120 + pk.h * 120;
    return { x: px, top: top, hw: hw, apex: { x: px + 4, y: top },
      pts: [px - hw, BASE, px - hw * 0.45, BASE - pk.h * 300, px - 12, top + 6, px + 8, top, px + hw * 0.5, BASE - pk.h * 280, px + hw, BASE] };
  }

  function stageLayer(dusk) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d'), m = env.pal.mundo, q = env.pal.maquina, mix = env.pal.mix, ink = env.ink;
      if (!dusk) {
        ink.background(g, 'territorio', { seed: 'v03:cordillera', horizon: 0.72, contours: false });
        ink.circle(g, 1186, 88, 34, { fill: m.rojo, line: false, seed: 'v03:sol' });
        return { bg: c };
      }
      // Dusk: a deep sky that warms toward the horizon, a low red sun, a darker ground.
      var hy = H * 0.72, sky = g.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, mix(q.noche, m.azul, 0.35));
      sky.addColorStop(0.55, mix(m.siena, m.rojo, 0.45));
      sky.addColorStop(1, mix(m.amarillo, m.oro, 0.5));
      g.fillStyle = sky;
      g.fillRect(0, 0, W, hy + 2);
      ink.wash(g, 0, 0, W, hy, { colors: [m.rojo, m.amarillo, q.noche], alpha: 0.16, blobs: 7, seed: 'v03:ocaso' });
      ink.circle(g, 1008, 452, 44, { fill: m.rojo, line: false, seed: 'v03:sol-ocaso' });
      g.fillStyle = mix(m.siena, m.tinta, 0.3);
      g.fillRect(0, hy, W, H - hy);
      g.save();
      g.translate(0, hy);
      ink.wash(g, 0, 0, W, H - hy, { colors: [m.tierra, m.siena], alpha: 0.2, blobs: 6, seed: 'v03:ocaso-suelo' });
      g.restore();
      ink.grain(g, 0, 0, W, H, { alpha: 0.9 });
      ink.line(g, ink.wavePoints(-10, hy, W + 10, 3, W * 0.7, 0.4), { w: 4.2, profile: 'blunt', seed: 'v03:horizonte' });
      return { bg: c };
    };
  }

  function stageGround(ctx, s, cam) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, cam.x, cam.y, W * cam.k, H * cam.k);
  }
  // The range over its deep valleys (the valleys first: the slopes cover their sides).
  function range(ctx, env, st, cam, p) {
    env.ink.draw(ctx, st.valleys, cam.x, cam.y, cam.k, { p: p });
    env.fig.cordillera(ctx, cam.x, cam.y, cam.k, { peaks: PEAKS, ground: false, seed: 'v03', p: p });
  }
  function toScreen(cam, x, y, outp) { outp.x = cam.x + x * cam.k; outp.y = cam.y + y * cam.k; return outp; }

  // The wide shot of the range, drifting a few pixels (one cached scale).
  function wideCam(s) {
    var k = 1.03, c = calm(s);
    return { k: k, x: (W - W * k) / 2 + noise(s.t * 0.05, 'v03:camx') * 7 * c, y: (H - H * k) / 2 + noise(s.t * 0.04, 'v03:camy') * 3 * c };
  }

  // A lit summit: the yellow cap of fig.cordillera's lit peaks, blooming over a soft glow.
  function litCap(ctx, env, st, cam, i, e) {
    if (e <= 0) return;
    var g = peakGeom(i);
    env.ink.glow(ctx, cam.x + g.x * cam.k, cam.y + (g.top + 60) * cam.k, 150 * cam.k, env.pal.mundo.amarillo, 0.42 * e);
    env.ink.draw(ctx, st.caps[i], cam.x, cam.y, cam.k, { p: e });
  }

  // Deep ultramarine washes over the valleys (alpha 0..1).
  function deepen(ctx, env, cam, a) {
    if (a <= 0) return;
    var col = env.pal.mix(env.pal.mundo.azul, env.pal.maquina.noche, 0.55);
    for (var i = 0; i < VALLEYS.length; i++) {
      var v = VALLEYS[i];
      env.ink.glow(ctx, cam.x + v.x * cam.k, cam.y + v.y * cam.k, 110 * cam.k, col, 0.75 * a);
    }
  }

  // The small warm climber: feet on the drawn slope, a red rope trailing back to its anchor.
  function climber(ctx, s, env, path, rope, cam, u, p, o) {
    if (p <= 0) return;
    o = o || {};
    pathAt(path, u, Q1);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.k, cam.k);
    ctx.globalAlpha *= p;
    env.ink.line(ctx, rope.pts, { w: 2.4, profile: 'even', seed: 'v03:cuerda', color: env.pal.mundo.rojo, p: clamp01(u / rope.u1) });
    env.ink.circle(ctx, rope.x, rope.y, 3.2, { fill: env.pal.mundo.madera, w: 1.6, seed: 'v03:estaca' });
    env.fig.person(ctx, Q1.x, Q1.y + 1 + Math.abs(Math.sin(s.t * 5)) * -0.8, o.k || 0.4, { role: 'persona', pose: o.pose || 'walking', seed: 'v03:escalador',
      skin: 3, hair: 'curly', facing: 1 });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · pregunta — a ruled path of 20 small steps on a navy grid; the lamp waits at the start; a
  // warm hand stops over a stamp «Confiar»; the lectora asks her question.

  var PREG = {
    panel: { x: 318, y: 100, w: 568, h: 424 },
    tiles: { x0: 432, dx: 100, y0: 456, dy: -94, size: 32, cols: 5 },
    lamp: { x: 364, y: 456, k: 0.56 },
    stamp: { x: 168, y: 552 }, hand: { x: 168, y: 340 },
    lectora: { x: 1100, y: 576, k: 3 }
  };

  function pregunta(ctx, s, env) {
    var st = s.state.preg, ink = env.ink, q = env.pal.maquina, m = env.pal.mundo;
    ground(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['estrella', 978, 150, 34], ['luna', 1196, 150, 38]], intro);
    panelIn(ctx, env, PREG.panel, inOut3(seg(s.t, 0.1, 1.1)), 14);
    // The 20 steps draw on one after another, joined by ruled segments; the goal is doubled.
    var T = PREG.tiles, tiles = st.tiles, half = T.size / 2;
    for (var i = 0; i < tiles.length; i++) {
      var tp = seg(s.t, 0.5 + i * 0.07, 0.8 + i * 0.07);
      if (tp <= 0) continue;
      var tl = tiles[i];
      if (i > 0) {
        var pr = tiles[i - 1], dx = tl.x - pr.x, dy = tl.y - pr.y, dl = Math.sqrt(dx * dx + dy * dy);
        ink.rLine(ctx, pr.x + dx / dl * half, pr.y + dy / dl * half, tl.x - dx / dl * half, tl.y - dy / dl * half, { color: q.linea, w: 1.4, p: tp });
      }
      ink.rRect(ctx, tl.x - half, tl.y - half, T.size, T.size, { color: q.linea, w: 1.5, fill: q.rejilla, fillAlpha: 0.6, p: tp });
      if (i === tiles.length - 1) ink.rRect(ctx, tl.x - half - 6, tl.y - half - 6, T.size + 12, T.size + 12, { color: q.linea, w: 1.2, p: tp });
    }
    // The lamp waits at the start, breathing a little.
    var L = PREG.lamp, lp = seg(s.t, 0.8, 1.6);
    if (lp > 0) {
      ink.rLine(ctx, L.x + 30, L.y, tiles[0].x - half, tiles[0].y, { color: q.brilloVerde, w: 1.2, dash: [3, 3], p: lp });
      env.fig.lamp(ctx, L.x, L.y + Math.sin(s.t * 1.1) * 1.2 * calm(s), L.k, { t: s.t, p: lp });
    }
    // The stamp «Confiar» on the page; the warm hand comes down and stops just over it.
    var sp = beat(a0, 0.2, 0.42);
    if (sp > 0) {
      ink.draw(ctx, st.stamp, PREG.stamp.x, PREG.stamp.y, 1, { p: sp });
      ink.text(ctx, rot(s, 'sello'), PREG.stamp.x, PREG.stamp.y - 49, { size: 25, weight: 700, align: 'center', color: m.lienzo, p: seg(sp, 0.7, 1) });
    }
    var hp = inOut3(beat(a0, 0.42, 0.78));
    if (hp > 0) {
      var hover = Math.sin(s.t * 1.4) * 3 * seg(hp, 0.9, 1);
      ink.draw(ctx, st.hand, lerp(PREG.hand.x - 150, PREG.hand.x, hp), lerp(PREG.hand.y - 330, PREG.hand.y, hp) + hover, 1, {});
    }
    // The lectora answers with her own question.
    var lq = out3(seg(a1, 0, 0.25));
    if (lq > 0) env.fig.lectora(ctx, PREG.lectora.x, PREG.lectora.y, PREG.lectora.k, { pose: 'asking', facing: -1, p: lq });
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · cordillera — the range draws on; two peaks light in yellow, each with its ruled navy panel:
  // GPQA (with the experts' reference, 81,2%, as a ruled bar on a 0–100% track) and competition
  // mathematics; a small warm climber with a rope walks up the ridge.

  var CORD = {
    gpqa: { panel: { x: 30, y: 26, w: 396, h: 160 }, title: { x: 50, y: 38, w: 356 }, track: { x: 50, y: 112, len: 300, h: 18 },
      ref: { x: 50, y: 144 } },
    mate: { panel: { x: 762, y: 38, w: 352, h: 64 }, title: { x: 938, y: 58 } },
    tag: { x: 446, y: 26 }
  };

  function cordillera(ctx, s, env) {
    var C = cuesOf(s, 'cordillera'), st = s.state.cord, ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina;
    var cam = wideCam(s), a0 = s.at(0), a1 = s.at(1);
    var drawP = seg(s.t, 0.15, Math.max(1.6, lineT(s, 0, 0.5)));
    stageGround(ctx, s, cam);
    range(ctx, env, st, cam, drawP);
    deepen(ctx, env, cam, 0.55 * beat(a0, C.valles - 0.04, C.valles + 0.12));
    litCap(ctx, env, st, cam, GPQA, beat(a1, 0, 0.08));
    litCap(ctx, env, st, cam, MATE, beat(a1, C.mate - 0.03, C.mate + 0.06));
    climber(ctx, s, env, st.path, st.rope, cam, lerp(0.06, 0.82, seg(s.t, 1.2, s.dur - 0.4)), seg(drawP, 0.7, 1));

    // GPQA: the panel opens with the line; the experts' reference lands by the time it is said.
    var G = CORD.gpqa, gp = inOut3(beat(a1, 0, 0.06));
    if (gp > 0) {
      var apex = toScreen(cam, peakGeom(GPQA).apex.x, peakGeom(GPQA).apex.y, Q2);
      ink.rLine(ctx, apex.x, G.panel.y + G.panel.h, apex.x, apex.y - 6, { color: q.noche, w: 1.4, p: gp });
      panelIn(ctx, env, G.panel, gp, 12);
      var win = landWindow(C.referencia), T = G.track, sc = chart.scale(100, T.x, T.len);
      ctx.save();
      ctx.globalAlpha *= seg(gp, 0.5, 1);
      ink.rRect(ctx, T.x, T.y, T.len, T.h, { color: q.linea, w: 1.1, dash: [4, 4] });
      ctx.restore();
      chart.baseline(ctx, T.x, T.y - 6, T.y + T.h + 6, { p: seg(gp, 0.5, 1), style: 'ruled' });
      var bp = beat(a1, win[0], win[1]);
      chart.bar(ctx, { text: rot(s, 'referencia'), scale: sc, y: T.y, h: T.h, style: 'ruled', labels: false, seed: 'v03:gpqa', p: bp });
      var rp = seg(a1, win[1], win[1] + 0.04);
      var RL = ink.text(ctx, rot(s, 'referencia'), G.ref.x, G.ref.y, { size: 21, weight: 700, color: m.lienzo, p: rp });
      ink.text(ctx, rot(s, 'picoGpqa'), G.title.x, G.title.y, { size: 21, weight: 700, color: m.lienzo, maxWidth: G.title.w, lineHeight: 1.12,
        p: beat(a1, C.gpqa - 0.02, C.gpqa + 0.05) });
      // The tag comes with the mark, from the moment it starts to grow.
      sourceTag(ctx, env, 'cap-3', CORD.tag.x, CORD.tag.y, { x: G.ref.x + RL.w + 4, y: G.ref.y + 13 }, beat(a1, win[0], win[0] + 0.05));
    }
    // Competition mathematics: its own small panel over the second lit peak.
    var M = CORD.mate, mp = inOut3(beat(a1, C.mate - 0.03, C.mate + 0.04));
    if (mp > 0) {
      var apex2 = toScreen(cam, peakGeom(MATE).apex.x, peakGeom(MATE).apex.y, Q2);
      ink.rLine(ctx, M.panel.x + 40, M.panel.y + M.panel.h, lerp(M.panel.x + 40, apex2.x + 4, mp), lerp(M.panel.y + M.panel.h, apex2.y - 6, mp),
        { color: q.noche, w: 1.4 });
      panelIn(ctx, env, M.panel, mp, 12);
      ink.text(ctx, rot(s, 'picoMatematicas'), M.title.x, M.title.y, { size: 22, weight: 700, color: m.lienzo, align: 'center', p: seg(mp, 0.5, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · casi-pico — close-up of the third summit: it almost reaches a dotted line «mejor experto
  // humano». The exact result lives in a ruled navy panel: a vertical bar to 88,2% on a 0–100%
  // scale, the experts' line 0,4 points above it, a tiny bracket on the gap.

  var CASI = {
    panel: { x: 702, y: 38, w: 530, h: 490 }, zero: 506, H: 384, bar: { x: 752, w: 56 },
    title: { x: 724, y: 50 }, lineLabel: { x: 826, y: 122 }, gapLabel: { x: 846, y: 180 },
    tag: { x: 858, y: 262 }, dotsFrom: 214
  };
  function casiScale(v) { return CASI.zero - v / 100 * CASI.H; }

  function casiPico(ctx, s, env) {
    var C = cuesOf(s, 'casi-pico'), st = s.state.casi, ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env, 'territorio');
    var intro = seg(s.t, 0.05, 1.3), drift = noise(s.t * 0.05, 'v03:casi') * 3 * calm(s);
    ink.draw(ctx, st.back, drift, 0, 1, { p: intro });
    ink.draw(ctx, st.summit, drift, 0, 1, { p: intro });
    var a = s.at(0), P = CASI.panel;
    panelIn(ctx, env, P, inOut3(beat(a, 0, 0.08)), 14);
    var v = val(env, rot(s, 'mmmu')), gap = val(env, rot(s, 'brecha'));
    var yB = casiScale(v), yL = casiScale(v + gap);
    // The 0–100% scale: a ruled axis with ticks every 10 points and the zero line.
    var ap = beat(a, 0.04, 0.14);
    if (ap > 0) {
      var axX = CASI.bar.x - 16;
      ink.rLine(ctx, axX, CASI.zero, axX, lerp(CASI.zero, casiScale(100), ap), { color: q.linea, w: 1.2 });
      for (var k = 0; k <= 10; k++) {
        var ty = casiScale(k * 10);
        if (ty < lerp(CASI.zero, casiScale(100), ap) - 0.5) continue;
        ink.rLine(ctx, axX - (k % 5 === 0 ? 9 : 5), ty, axX, ty, { color: q.linea, w: 1.1 });
      }
      ink.rLine(ctx, axX, CASI.zero, CASI.bar.x + CASI.bar.w + 24, CASI.zero, { color: q.linea, w: 1.4, p: ap });
    }
    // «mejor experto humano»: hand-dotted across the warm side, ruled dashes inside the panel.
    var lp = beat(a, 0.08, 0.3);
    if (lp > 0) {
      ink.dotted(ctx, st.dots, { r: 2.6, gap: 13, p: lp, seed: 'v03:experto' });
      ink.rLine(ctx, P.x + 8, yL, lerp(P.x + 8, P.x + P.w - 14, lp), yL, { color: m.lienzo, w: 1.5, dash: [7, 5] });
      ink.text(ctx, rot(s, 'lineaExperto'), CASI.lineLabel.x, CASI.lineLabel.y, { size: 22, italic: true, color: m.lienzo, p: seg(lp, 0.6, 1) });
    }
    // The bar lands by the chunk that says 88,2%; then the title, the bracket and the tag.
    var win = landWindow(C.cifra), bp = beat(a, win[0], win[1]);
    var gb = chart.bar(ctx, { value: v, scale: chart.scale(100, 0, CASI.H), orient: 'v', x: CASI.bar.x, baseY: CASI.zero, h: CASI.bar.w,
      style: 'ruled', labels: false, seed: 'v03:mmmu', p: bp });
    // The tag comes with the mark (tied to its value edge as it grows); the title once it lands.
    if (bp > 0) sourceTag(ctx, env, 'cap-3', CASI.tag.x, CASI.tag.y, { x: CASI.bar.x + CASI.bar.w, y: gb.y0 + 1 }, beat(a, win[0], win[0] + 0.05));
    var tp = seg(a, win[1], win[1] + 0.04);
    if (tp > 0) ink.text(ctx, rot(s, 'mmmu'), CASI.title.x, CASI.title.y, { size: 32, weight: 700, color: m.lienzo, p: tp });
    var gp = seg(a, win[1] + 0.01, Math.max(win[1] + 0.06, C.brecha));
    if (gp > 0) {
      var bx = CASI.bar.x + CASI.bar.w + 5, G = CASI.gapLabel;
      ctx.save();
      ctx.globalAlpha *= gp;
      ink.rLine(ctx, bx, yB, bx + 9, yB, { color: q.brilloMagenta, w: 1.4 });
      ink.rLine(ctx, bx, yL, bx + 9, yL, { color: q.brilloMagenta, w: 1.4 });
      ink.rLine(ctx, bx + 9, yL, bx + 9, yB, { color: q.brilloMagenta, w: 1.4 });
      ink.rLine(ctx, bx + 9, (yB + yL) / 2, G.x - 6, G.y + 12, { color: q.brilloMagenta, w: 1.1 });
      ctx.restore();
      ink.text(ctx, rot(s, 'brecha'), G.x, G.y, { size: 24, weight: 700, color: m.lienzo, p: gp });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · valles — the camera descends into two dark valleys washed in deep blue (a close-up: the
  // V between two slopes, deep ultramarine). Above them, a ruled navy band holds three bars on ONE
  // 0–100% scale: astrophysics replication (menos de 20%, open arrowhead), PaperArena's best agent
  // (38,8%) and its experts (83,5%); each row is tied to its valley. Then the average hides the
  // tails: a dotted mean line, and the worst result marked at the bottom of the deepest valley.

  var VAL = {
    panel: { x: 30, y: 20, w: 912, h: 228 }, zeroX: 54, len: 360, barH: 20,
    rows: { t1: 32, b1: 62, t2: 98, b2a: 128, b2b: 160 },
    tag5: { x: 646, y: 28 }, tag6: { x: 646, y: 122 },
    descend: 170, bottoms: [{ x: 400, y: 540 }, { x: 800, y: 520 }], wash: [40, 330],
    mean: { y: 318, x0: 40, x1: 884 }
  };

  function valles(ctx, s, env) {
    var C = cuesOf(s, 'valles'), st = s.state.val, ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env, 'territorio');
    var a0 = s.at(0), a1 = s.at(1), i;
    // The descent: the slopes rise past the frame until the valleys fill it.
    var e = inOut3(seg(s.t, 0.15, Math.max(1.8, lineT(s, 0, 0.12))));
    var dy = VAL.descend * (1 - e) + noise(s.t * 0.05, 'v03:vy') * 2 * calm(s);
    // The gap between the outer slopes, washed in deep blue that thickens toward the bottom.
    var deepCol = env.pal.mix(m.azul, m.tinta, 0.35), wash = ctx.createLinearGradient(0, VAL.wash[0] + dy, 0, VAL.wash[1] + dy);
    wash.addColorStop(0, env.pal.rgba(deepCol, 0));
    wash.addColorStop(0.55, env.pal.rgba(deepCol, 0.75));
    wash.addColorStop(1, deepCol);
    ctx.save();
    ctx.fillStyle = wash;
    ctx.beginPath();
    for (i = 0; i < st.gap.length; i += 2) ctx[i ? 'lineTo' : 'moveTo'](st.gap[i], st.gap[i + 1] + dy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    var col = env.pal.mix(m.azul, q.noche, 0.6);
    for (i = 0; i < 2; i++) ink.glow(ctx, VAL.bottoms[i].x, VAL.bottoms[i].y - 90 + dy, 150, col, 0.55 + 0.35 * e);
    ctx.save();
    ctx.translate(0, dy);
    ctx.globalAlpha *= 0.55;
    for (i = 0; i < st.mist.length; i++) {
      ink.line(ctx, st.mist[i], { w: 2.4, profile: 'swell', seed: 'v03:bruma' + i, color: m.celeste, p: seg(s.t, 0.4 + i * 0.1, 1.6 + i * 0.1) });
    }
    ctx.restore();
    ink.draw(ctx, st.slopes, 0, dy, 1, {});
    // The average hides the tails: a dotted mean line over the range, then the worst result.
    var mp = beat(a1, 0, 0.18);
    if (mp > 0) ink.dotted(ctx, st.mean, { r: 2.8, gap: 12, p: mp, seed: 'v03:promedio', color: m.lienzo });
    var wp = beat(a1, C.peor - 0.06, C.peor + 0.06);
    if (wp > 0) {
      var Bw = VAL.bottoms[0], wy = Bw.y - 30 + dy;
      ink.circle(ctx, Bw.x, wy, 14 + 4 * (1 - wp), { line: true, w: 3, seed: 'v03:peor', p: wp, lineColor: m.rojo });
      ink.dot(ctx, Bw.x, wy, 5.5 * wp, m.rojo);
    }

    // The ruled band of results: three bars on one zero-based scale.
    var P = VAL.panel, R = VAL.rows, sc = chart.scale(100, VAL.zeroX, VAL.len);
    panelIn(ctx, env, P, inOut3(beat(a0, 0, 0.05)), 12);
    var astro = rot(s, 'astrofisica'), paper = rot(s, 'paperArena');
    var pairs = piece(paper, ':', 1);
    var agent = piece(pairs, '·', 0), experts = piece(pairs, '·', 1);
    var zp = beat(a0, 0.02, 0.06);
    if (zp > 0) chart.baseline(ctx, VAL.zeroX, R.b1 - 6, lerp(R.b1 - 6, R.b2b + VAL.barH + 6, zp), { style: 'ruled', p: 1 });
    // Row 1: astrophysics, on the screen by the time its chunk shows.
    var w1 = landWindow(C.astro), b1 = beat(a0, w1[0], w1[1]), vAstro = piece(astro, ':', 1);
    ink.text(ctx, piece(astro, ':', 0), VAL.zeroX, R.t1, { size: 20, weight: 700, color: m.lienzo, p: beat(a0, 0, 0.04) });
    chart.bar(ctx, { text: vAstro, scale: sc, y: R.b1, h: VAL.barH, style: 'ruled', labels: false, seed: 'v03:astro', p: b1 });
    // Value labels sit after each bar's final edge; tags come with the marks as they start to grow.
    var x1 = sc(val(env, vAstro)) + 30;
    var L1 = ink.text(ctx, vAstro, x1, R.b1 - 1, { size: 20, weight: 700, color: m.lienzo, p: seg(a0, w1[1], w1[1] + 0.03) });
    sourceTag(ctx, env, 'cap-5', VAL.tag5.x, VAL.tag5.y, { x: x1 + 4 + L1.w, y: R.b1 + 10 }, beat(a0, w1[0], w1[0] + 0.04));
    // Row 2: PaperArena, the agent and the experts on the same scale.
    var w2 = landWindow(C.paper);
    ink.text(ctx, piece(paper, ':', 0), VAL.zeroX, R.t2, { size: 20, weight: 700, color: m.lienzo, p: beat(a0, w2[0] - 0.06, w2[0] - 0.02) });
    chart.bar(ctx, { text: agent, scale: sc, y: R.b2a, h: VAL.barH, style: 'ruled', labels: false, seed: 'v03:agente', p: beat(a0, w2[0], w2[1] - 0.02) });
    chart.bar(ctx, { text: experts, scale: sc, y: R.b2b, h: VAL.barH, style: 'ruled', color: m.amarillo, labels: false, seed: 'v03:expertos',
      p: beat(a0, w2[0] + 0.02, w2[1]) });
    var l2 = seg(a0, w2[1], w2[1] + 0.03), xb = sc(val(env, experts)) + 12;
    ink.text(ctx, agent, sc(val(env, agent)) + 12, R.b2a - 1, { size: 19, weight: 700, color: m.lienzo, p: l2 });
    var LB = ink.text(ctx, experts, xb, R.b2b - 1, { size: 19, weight: 700, color: m.lienzo, p: l2 });
    sourceTag(ctx, env, 'cap-6', VAL.tag6.x, VAL.tag6.y, { x: xb + 4 + LB.w, y: R.b2b + 10 }, beat(a0, w2[0], w2[0] + 0.04));
    // Each row is tied to its valley by a thin ruled leader.
    var lk = [[beat(a0, w1[1], w1[1] + 0.06), 132, 0], [seg(a0, w2[1] + 0.01, w2[1] + 0.08), 420, 1]];
    for (i = 0; i < 2; i++) {
      if (lk[i][0] <= 0) continue;
      var V = VAL.bottoms[lk[i][2]], ty = V.y - 150 + dy;
      ink.rLine(ctx, lk[i][1], P.y + P.h, lerp(lk[i][1], V.x, lk[i][0]), lerp(P.y + P.h, ty, lk[i][0]), { color: q.linea, w: 1.4 });
      if (lk[i][0] >= 1) ink.rCircle(ctx, V.x, ty, 4, { fill: q.linea, stroke: false });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · saturacion — three ruled dials (MMMU, GPQA, SWE-bench) on ONE shared 0–100 scale: on each,
  // an arc arrow grows by exactly its gain. Then a separate dial with every mark filled blurs
  // («ya no distingue») and five new instruments draw on beside it as they are named.

  var GA0 = Math.PI * 5 / 6, GSWEEP = Math.PI * 4 / 3;    // from lower-left, 240° clockwise
  var SAT = {
    panel: { x: 36, y: 30, w: 704, h: 306 }, gy: 166, r: 76,
    gauges: [{ x: 156, name: 'medidorMmmu', value: 'subidaMmmu' }, { x: 388, name: 'medidorGpqa', value: 'subidaGpqa' },
      { x: 620, name: 'medidorSwe', value: 'subidaSwe' }],
    tag: { x: 774, y: 40 },
    sat: { panel: { x: 54, y: 370, w: 160, h: 150 }, x: 134, y: 452, r: 54, label: { y: 528 } },
    tools: { x0: 348, dx: 196, y: 428, half: 40, labelY: 480, keys: ['dinamicas', 'noContaminadas', 'variosIntentos', 'fueraDistribucion', 'danos'] }
  };

  // A ruled dial: 240° arc, a tick every 10 points of the 0–100 scale, a hub. o.full lights every
  // tick (a saturated dial).
  function dial(ctx, env, x, y, r, p, o) {
    if (p <= 0) return;
    o = o || {};
    var q = env.pal.maquina, m = env.pal.mundo;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = q.linea;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, GA0, GA0 + GSWEEP * seg(p, 0, 0.6));
    ctx.stroke();
    ctx.globalAlpha *= seg(p, 0.3, 1);
    ctx.strokeStyle = o.full ? m.lienzo : q.linea;
    ctx.lineWidth = o.full ? 3 : 1.3;
    ctx.beginPath();
    for (var i = 0; i <= 10; i++) {
      var a = GA0 + GSWEEP * i / 10, l = o.full ? 0.66 : i % 5 === 0 ? 0.8 : 0.88;
      ctx.moveTo(x + Math.cos(a) * r * l, y + Math.sin(a) * r * l);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.fillStyle = q.linea;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.07, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // The gain as an arc arrow from 0 to exactly `value` on the 0–100 scale (e grows it from zero).
  function gainArrow(ctx, env, x, y, r, value, e, color) {
    if (e <= 0 || value <= 0) return null;
    var a1 = GA0 + GSWEEP * Math.min(100, value) / 100 * out3(e);
    ctx.save();
    ctx.strokeStyle = color || env.pal.maquina.brilloVerde;
    ctx.lineWidth = 6;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(x, y, r, GA0, a1);
    ctx.stroke();
    // Open chevron whose tip sits on the exact end of the arc.
    var tx = x + Math.cos(a1) * r, ty = y + Math.sin(a1) * r, dx = -Math.sin(a1), dy = Math.cos(a1), hs = 11;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(tx - dx * hs + Math.cos(a1) * hs * 0.7, ty - dy * hs + Math.sin(a1) * hs * 0.7);
    ctx.lineTo(tx, ty);
    ctx.lineTo(tx - dx * hs - Math.cos(a1) * hs * 0.7, ty - dy * hs - Math.sin(a1) * hs * 0.7);
    ctx.stroke();
    ctx.restore();
    return { x: tx, y: ty };
  }

  // The five new instruments: small ruled plaques, each with its own glyph.
  function instrument(ctx, s, env, i, x, y, half, p) {
    if (p <= 0) return;
    var ink = env.ink, q = env.pal.maquina, r, k;
    ink.rRect(ctx, x - half, y - half, half * 2, half * 2, { fill: q.noche, color: q.linea, w: 1.5, p: p });
    var gp = seg(p, 0.4, 1);
    if (gp <= 0) return;
    // Glyphs are drawn for a 64 px plaque, centered, and scaled to this one.
    ctx.save();
    ctx.globalAlpha *= gp;
    ctx.translate(x, y);
    ctx.scale(half / 32, half / 32);
    x = 0;
    y = 0;
    switch (i) {
      case 0:   // dynamic evaluations: a dial whose needle keeps moving
        r = half * 0.62;
        ctx.strokeStyle = q.linea; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(x, y + 4, r, GA0, GA0 + GSWEEP); ctx.stroke();
        var na = GA0 + GSWEEP * (0.5 + 0.38 * Math.sin(s.t * 1.3));
        ink.rLine(ctx, x, y + 4, x + Math.cos(na) * r * 0.9, y + 4 + Math.sin(na) * r * 0.9, { color: q.brilloMagenta, w: 1.8 });
        break;
      case 1:   // uncontaminated tasks: a fresh ruled sheet with a check
        ink.rRect(ctx, x - 13, y - 17, 26, 34, { color: q.linea, w: 1.3 });
        for (k = 0; k < 3; k++) ink.rLine(ctx, x - 8, y - 9 + k * 7, x + 8, y - 9 + k * 7, { color: q.linea, w: 1 });
        ink.rPoly(ctx, [x - 6, y + 10, x - 1, y + 14, x + 8, y + 4], { color: q.brilloVerde, w: 2 });
        break;
      case 2:   // several attempts: three identical trials and a return arrow
        for (k = 0; k < 3; k++) ink.rRect(ctx, x - 20 + k * 14, y - 2, 11, 11, { color: q.linea, w: 1.3, fill: k < 2 ? q.rejilla : null });
        ctx.strokeStyle = q.brilloVerde; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y - 2, 15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ink.rPoly(ctx, [x + 9, y - 18, x + 13, y - 11, x + 6, y - 9], { color: q.brilloVerde, w: 1.4 });
        break;
      case 3:   // out of distribution: a tidy 3×3 grid of points and one point outside it
        ctx.fillStyle = q.linea;
        for (k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x - 14 + (k % 3) * 9, y - 6 + Math.floor(k / 3) * 9, 2.3, 0, TAU); ctx.fill(); }
        ctx.fillStyle = q.brilloMagenta;
        ctx.beginPath(); ctx.arc(x + 15, y - 14, 3, 0, TAU); ctx.fill();
        ink.rCircle(ctx, x + 15, y - 14, 7, { color: q.brilloMagenta, w: 1.2 });
        break;
      case 4:   // harms: a straight zigzag crack measured by a small ruler
        ink.rPoly(ctx, [x - 18, y - 12, x - 6, y - 2, x - 10, y + 2, x + 4, y + 10, x + 1, y + 12, x + 18, y + 18], { color: q.brilloMagenta, w: 1.8 });
        ink.rLine(ctx, x - 20, y - 20, x + 20, y - 20, { color: q.linea, w: 1.2 });
        for (k = 0; k <= 4; k++) ink.rLine(ctx, x - 20 + k * 10, y - 20, x - 20 + k * 10, y - (k % 2 ? 16 : 14), { color: q.linea, w: 1 });
        break;
    }
    ctx.restore();
  }

  function saturacion(ctx, s, env) {
    var C = cuesOf(s, 'saturacion'), ink = env.ink, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), P = SAT.panel;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.1, 1)), 14);
    // The three dials and their names draw on while "los benchmarks se saturan" is said.
    var landEnd = Math.max(0.12, C.cifras), tip = null;
    for (var i = 0; i < SAT.gauges.length; i++) {
      var G = SAT.gauges[i], dp = seg(s.t, 0.5 + i * 0.25, 1.4 + i * 0.25);
      dial(ctx, env, G.x, SAT.gy, SAT.r, dp);
      ink.text(ctx, rot(s, G.name), G.x, SAT.gy + SAT.r + 22, { size: 23, weight: 700, color: m.lienzo, align: 'center', p: seg(dp, 0.5, 1) });
      // Gains on ONE shared scale, landed one after another by the chunk that says them.
      var e0 = landEnd - 0.17 + i * 0.05, e = beat(a0, e0, e0 + 0.07);
      var end = gainArrow(ctx, env, G.x, SAT.gy, SAT.r * 0.76, val(env, rot(s, G.value)), e);
      var vp = beat(a0, e0 + 0.07, e0 + 0.1);
      if (vp > 0) ink.text(ctx, rot(s, G.value), G.x, SAT.gy + SAT.r * 0.6, { size: 22, weight: 700, color: m.lienzo, align: 'center', p: vp });
      if (i === 2 && end && e >= 1) tip = end;
    }
    // One tag for the three gains, from the moment the first arrow starts to grow; its thread ends
    // on the tip of the SWE-bench arrow once that one has landed.
    var tp = beat(a0, landEnd - 0.17, landEnd - 0.12);
    if (tp > 0) sourceTag(ctx, env, 'cap-4', SAT.tag.x, SAT.tag.y, tip || { x: SAT.gauges[2].x + SAT.r * 0.5, y: SAT.gy - SAT.r * 0.6 }, tp);

    // A separate dial with every mark filled: saturated, it blurs and no longer tells systems apart.
    var S = SAT.sat, sp = beat(a1, 0, 0.06);
    if (sp > 0) {
      panelIn(ctx, env, S.panel, inOut3(sp), 10);
      var blur = beat(a1, C.distinguir - 0.04, C.distinguir + 0.1), n = 1 + Math.round(4 * blur);
      for (var b = 0; b < n; b++) {
        var ang = b / n * TAU + 0.6, off = 3.6 * blur;
        ctx.save();
        ctx.globalAlpha *= b === 0 ? 1 - 0.55 * blur : 0.32;
        dial(ctx, env, S.x + Math.cos(ang) * off * (b > 0), S.y + Math.sin(ang) * off * (b > 0), S.r, seg(sp, 0, 1), { full: true });
        gainArrow(ctx, env, S.x + Math.cos(ang) * off * (b > 0), S.y + Math.sin(ang) * off * (b > 0), S.r * 0.76, 100, sp, q.linea);
        ctx.restore();
      }
      ink.text(ctx, rot(s, 'saturado'), S.x, S.label.y, { size: 21, italic: true, weight: 700, align: 'center', p: seg(blur, 0.4, 1) });
    }
    // New instruments draw on as they are named.
    var T = SAT.tools, keys = [C.t0, C.t1, C.t2, C.t3, C.t4];
    for (var j = 0; j < 5; j++) {
      var ip = beat(a1, keys[j] - 0.03, keys[j] + 0.05), x = T.x0 + j * T.dx;
      instrument(ctx, s, env, j, x, T.y, T.half, ip);
      if (ip > 0) ink.text(ctx, rot(s, T.keys[j]), x, T.labelY, { size: 20, weight: 700, align: 'center', maxWidth: 176, lineHeight: 1.1, p: seg(ip, 0.4, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · chatbot — top: a speech bubble goes into the lamp and one answer comes out. Bottom: the
  // same lamp in a ruled loop: «Objetivo» → «Planificar» → «Usar herramientas» → «Ejecutar» →
  // «Verificar», and the return arrow back to «Planificar».

  var CHAT = {
    row: { y: 176, q0: 150, lamp: 640, a1: 948, k: 0.84 },
    panel: { x: 296, y: 286, w: 688, h: 280 },
    st: [{ x: 410, y: 432 }, { x: 560, y: 356 }, { x: 862, y: 356 }, { x: 862, y: 504 }, { x: 560, y: 504 }],
    labelSide: [-1, -1, -1, 1, 1], lampK: 0.42
  };

  function bubbleWith(ctx, env, st, x, y, k, a, seed, tail, n) {
    if (a <= 0 || k <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(k, k);
    env.fig.bubble(ctx, -46, -30, 92, 60, { seed: seed, w: 3.6, tail: tail ? { x: tail * 34, y: 48 } : null });
    for (var i = 0; i < n; i++) env.ink.line(ctx, st.scribbles[i], { w: 2.6, profile: 'even', seed: seed + 's' + i });
    ctx.restore();
  }

  function chatbot(ctx, s, env) {
    var C = cuesOf(s, 'chatbot'), st = s.state.chat, ink = env.ink, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a = s.at(0), R = CHAT.row, intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1140, 130, 40], ['espiral', 130, 300, 36]], intro);
    // Top: the chatbot. The lamp, a question that goes in, one answer that comes out.
    env.fig.lamp(ctx, R.lamp, R.y, R.k, { t: s.t, p: seg(s.t, 0.4, 1.4) });
    var qe = inOut3(beat(a, C.chatbot - 0.02, C.chatbot + 0.08));
    if (qe < 1) bubbleWith(ctx, env, st, lerp(R.q0, R.lamp - 30, qe), R.y - 6 * Math.sin(Math.PI * qe), lerp(1, 0.25, qe),
      seg(s.t, 0.6, 1.2) * (1 - seg(qe, 0.85, 1)), 'v03:pregunta', 1, 2);
    var ae = inOut3(beat(a, C.chatbot + 0.08, C.chatbot + 0.18));
    if (ae > 0) bubbleWith(ctx, env, st, lerp(R.lamp + 30, R.a1, ae), R.y - 6 * Math.sin(Math.PI * ae), lerp(0.25, 1, ae), seg(ae, 0, 0.2),
      'v03:respuesta', -1, 1);
    if (qe > 0) {
      var arr = seg(qe, 0.3, 1);
      ink.arrow(ctx, st.inArrow, { w: 3, seed: 'v03:entra', p: arr, headSize: 12 });
      if (ae > 0) ink.arrow(ctx, st.outArrow, { w: 3, seed: 'v03:sale', p: ae, headSize: 12 });
    }
    // Bottom: the agent loop on its ruled panel.
    var P = CHAT.panel, S = CHAT.st, lp = inOut3(beat(a, C.agente - 0.05, C.agente + 0.03));
    if (lp <= 0) return;
    panelIn(ctx, env, P, lp, 14);
    var labels = rot(s, 'bucle').split('→').map(function (x) { return x.trim(); });
    var back = Math.max(1, labels.indexOf(rot(s, 'regreso')));
    var dp = beat(a, C.agente, C.agente + 0.12);
    // Entry Objetivo → Planificar, then the cycle Planificar → … → Verificar.
    var legs = [[0, 1], [1, 2], [2, 3], [3, 4]];
    for (var i = 0; i < legs.length; i++) {
      var A = S[legs[i][0]], B = S[legs[i][1]], e = seg(dp, i * 0.18, i * 0.18 + 0.3);
      if (e <= 0) continue;
      ink.rLine(ctx, A.x, A.y, lerp(A.x, B.x, e), lerp(A.y, B.y, e), { color: q.linea, w: 1.6 });
      if (e >= 1) ink.rArrow(ctx, lerp(A.x, B.x, 0.48), lerp(A.y, B.y, 0.48), lerp(A.x, B.x, 0.56), lerp(A.y, B.y, 0.56), { color: q.linea, w: 1.6, headSize: 10 });
    }
    // The return arrow, from Verificar back up to Planificar (dashed, green, the loop's own way back).
    var rp = seg(dp, 0.72, 1), vb = beat(a, C.vuelve - 0.02, C.vuelve + 0.06);
    if (rp > 0) {
      var Sb = S[back], Se = S[4];
      ink.rLine(ctx, Se.x, Se.y, Se.x + (Sb.x - Se.x) * rp, lerp(Se.y, Sb.y, rp), { color: q.brilloVerde, w: 1.6 + 1.2 * vb, dash: [6, 5] });
      if (rp >= 1) ink.rArrow(ctx, Sb.x, lerp(Se.y, Sb.y, 0.5), Sb.x, lerp(Se.y, Sb.y, 0.58), { color: q.brilloVerde, w: 1.6 + 1.2 * vb, headSize: 11 });
    }
    // Stations and their labels (from data), lit as the lamp passes.
    var cues = [C.objetivo, C.s1, C.s2, C.s3, C.s4];
    for (i = 0; i < S.length; i++) {
      var sp = seg(dp, i * 0.15, i * 0.15 + 0.25);
      if (sp <= 0) continue;
      var on = beat(a, cues[i] - 0.02, cues[i] + 0.02) > 0;
      ink.rRect(ctx, S[i].x - 11, S[i].y - 11, 22, 22, { fill: q.noche, color: q.linea, w: 1.5, p: sp });
      ink.rRect(ctx, S[i].x - 5, S[i].y - 5, 10, 10, { fill: on ? q.brilloVerde : q.linea, stroke: false, p: sp, fillAlpha: 0.85 });
      var lab = labels[i] || '', side = CHAT.labelSide[i];
      var lay = ink.measureText(ctx, lab, { size: 21, weight: 700 });
      ink.text(ctx, lab, S[i].x, side < 0 ? S[i].y - 22 - lay.h : S[i].y + 20, { size: 21, weight: 700, color: m.lienzo, align: 'center', p: seg(sp, 0.4, 1) });
    }
    // The lamp: it enters at Objetivo, then visits each station on its word and comes back.
    var lampIn = beat(a, C.objetivo - 0.05, C.objetivo + 0.01);
    if (lampIn <= 0) return;
    var pos = S[0], x = pos.x, y = pos.y;
    var hops = [[0, 1, C.s1], [1, 2, C.s2], [2, 3, C.s3], [3, 4, C.s4]];
    for (i = 0; i < hops.length; i++) {
      var he = inOut3(beat(a, hops[i][2] - 0.035, hops[i][2]));
      if (he > 0) { x = lerp(S[hops[i][0]].x, S[hops[i][1]].x, he); y = lerp(S[hops[i][0]].y, S[hops[i][1]].y, he); }
    }
    var re = inOut3(beat(a, C.vuelve - 0.01, C.vuelve + 0.06));
    if (re > 0) { x = lerp(S[4].x, S[back].x, re); y = lerp(S[4].y, S[back].y, re); }
    env.fig.lamp(ctx, x, y - 30 * (1 - lampIn) , CHAT.lampK, { t: s.t, p: lampIn });
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · escalera — OSWorld's ruled ladder: rungs at exactly ~12% and 66,3% on a 0–100% scale, the
  // human reference 72,35% as a dotted line, the top rung cracked: «≈ 1 de cada 3 intentos falla».
  // Then a second ladder, apart, for Terminal-Bench 2.0: 20% → 77,3%.

  var ESC = {
    panels: [{ x: 48, y: 128, w: 568, h: 432 }, { x: 664, y: 128, w: 568, h: 432 }],
    ladders: [{ x: 190 }, { x: 806 }], zero: 530, H: 360, w: 84, lampK: 0.46,
    tags: [{ x: 304, y: 24 }, { x: 952, y: 24 }]
  };
  function escY(v) { return ESC.zero - v / 100 * ESC.H; }

  function ladderLamp(ctx, env, s, x, v, p) {
    if (p <= 0) return;
    env.fig.lamp(ctx, x, escY(v) - 25, ESC.lampK, { t: s.t, p: p });
  }

  // The ladder's scale: a faint ruled rung every 10 points (0–100%), behind the data rungs.
  function ladderScale(ctx, env, x, p) {
    if (p <= 0) return;
    var q = env.pal.maquina, top = escY(100);
    ctx.save();
    ctx.globalAlpha *= 0.3 * p;
    for (var k = 1; k <= 10; k++) {
      var y = escY(k * 10);
      if (y < lerp(ESC.zero, top, p) - 0.5) continue;
      env.ink.rLine(ctx, x - ESC.w / 2, y, x + ESC.w / 2, y, { color: q.linea, w: k % 5 === 0 ? 1.4 : 1 });
    }
    ctx.restore();
  }

  // A hairline crack across a rung: a ruled zigzag and a small gap.
  function crack(ctx, env, x, y, p) {
    if (p <= 0) return;
    var q = env.pal.maquina, c = x + ESC.w * 0.14;
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.fillStyle = q.noche;
    ctx.fillRect(c - 3, y - 3, 6, 6);
    env.ink.rPoly(ctx, [c - 4, y - 13, c + 3, y - 5, c - 3, y + 1, c + 4, y + 7, c - 1, y + 13], { color: q.brilloMagenta, w: 1.8 });
    ctx.restore();
  }

  function escalera(ctx, s, env) {
    var C = cuesOf(s, 'escalera'), ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1);
    // Ladder 1: OSWorld.
    var P = ESC.panels[0], lx = ESC.ladders[0].x;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.1, 1.1)), 12);
    var NL = ink.text(ctx, rot(s, 'escaleraOsworld'), P.x + 22, P.y + 16, { size: 28, weight: 700, color: m.lienzo, p: beat(a0, C.osworld - 0.02, C.osworld + 0.05) });
    var v12 = val(env, rot(s, 'inicio')), v66 = val(env, rot(s, 'final')), vRef = val(env, rot(s, 'referenciaHumana'));
    var win = landWindow(C.cifras), lp = beat(a0, win[0] - 0.12, win[1]);
    ladderScale(ctx, env, lx, seg(lp, 0, 0.5));
    if (lp > 0) fig.ruledLadder(ctx, lx, ESC.zero, 1, { max: 100, h: ESC.H, w: ESC.w, panel: false, p: lp,
      rungs: [{ value: v12 }, { value: v66 }] });
    crack(ctx, env, lx, escY(v66), beat(a0, C.falla - 0.01, C.falla + 0.04));
    var rl = seg(a0, win[1], win[1] + 0.03);
    if (rl > 0) {
      ink.text(ctx, rot(s, 'inicio'), lx + ESC.w / 2 + 14, escY(v12) - 15, { size: 26, weight: 700, color: m.lienzo, p: rl });
      ink.text(ctx, rot(s, 'final'), lx + ESC.w / 2 + 14, escY(v66) - 3, { size: 26, weight: 700, color: m.lienzo, p: rl });
      // The human reference: a dotted line at exactly 72,35%, with its label.
      ink.rLine(ctx, lx - ESC.w, escY(vRef), lerp(lx - ESC.w, P.x + P.w - 18, rl), escY(vRef), { color: q.brilloVerde, w: 1.6, dash: [5, 5] });
      var RL = ink.text(ctx, rot(s, 'referenciaEtiqueta'), lx + ESC.w / 2 + 14, escY(vRef) - 30, { size: 19, italic: true, color: m.lienzo, p: rl });
      ink.text(ctx, rot(s, 'referenciaHumana'), lx + ESC.w / 2 + 22 + RL.w, escY(vRef) - 34, { size: 26, weight: 700, color: m.lienzo, p: rl });
    }
    // The tag comes with the rungs (the marks of the values), tied to the ladder's name.
    sourceTag(ctx, env, 'cap-1', ESC.tags[0].x, ESC.tags[0].y, { x: P.x + 24 + NL.w, y: P.y + 30 }, seg(lp, 0.35, 0.6));
    // The lamp climbs from the first rung to the cracked one while it is said.
    var climb = inOut3(beat(a0, C.sube - 0.06, C.sube + 0.04));
    ladderLamp(ctx, env, s, lx, lerp(v12, v66, climb), seg(lp, 0.6, 1));
    // «≈ 1 de cada 3 intentos falla»: the crack, its label and three trials, one of them failed.
    var fp = beat(a0, C.falla - 0.01, C.falla + 0.06);
    if (fp > 0) {
      var fx = lx + ESC.w / 2 + 14, fy = escY(v66) + 34, grieta = rot(s, 'grieta'), nn = numbersIn(grieta);
      var fails = nn[0] || 0, trials = nn[1] || 0;
      ink.text(ctx, grieta, fx, fy, { size: 21, weight: 700, color: m.lienzo, maxWidth: 300, lineHeight: 1.15, p: fp });
      // «1 de cada 3»: that many trials, the failed one cracked.
      for (var k = 0; k < trials; k++) {
        var tx = fx + k * 26, ty = fy + 62, bad = k >= trials - fails, kp = seg(fp, 0.3 + k * 0.15, 0.6 + k * 0.15);
        ink.rRect(ctx, tx, ty, 18, 18, { color: bad ? q.brilloMagenta : q.linea, w: 1.5, fill: bad ? null : q.rejilla, p: kp });
        if (bad && kp >= 1) ink.rPoly(ctx, [tx + 4, ty + 3, tx + 10, ty + 9, tx + 7, ty + 11, tx + 14, ty + 16], { color: q.brilloMagenta, w: 1.4 });
      }
    }
    // Ladder 2, apart: Terminal-Bench 2.0, from 20% (febrero de 2025) to 77,3% (inicios de 2026).
    var P2 = ESC.panels[1], lx2 = ESC.ladders[1].x, e2 = inOut3(beat(a1, 0, 0.06));
    if (e2 <= 0) return;
    panelIn(ctx, env, P2, e2, 12);
    var tb = rot(s, 'terminalBench'), from = piece(tb, '→', 0), to = piece(tb, '→', 1);
    var v20 = val(env, from), v77 = val(env, to);
    var NL2 = ink.text(ctx, rot(s, 'escaleraTerminal'), P2.x + 22, P2.y + 16, { size: 28, weight: 700, color: m.lienzo, p: seg(e2, 0.5, 1) });
    var lp2 = beat(a1, 0.02, 0.12);
    ladderScale(ctx, env, lx2, seg(lp2, 0, 0.5));
    fig.ruledLadder(ctx, lx2, ESC.zero, 1, { max: 100, h: ESC.H, w: ESC.w, panel: false, p: lp2, rungs: [{ value: v20 }, { value: v77 }] });
    var rl2 = seg(a1, 0.12, 0.16);
    if (rl2 > 0) {
      ink.text(ctx, from, lx2 + ESC.w / 2 + 14, escY(v20) - 15, { size: 24, weight: 700, color: m.lienzo, p: rl2 });
      ink.text(ctx, to, lx2 + ESC.w / 2 + 14, escY(v77) - 15, { size: 24, weight: 700, color: m.lienzo, p: rl2 });
    }
    // Its tag comes with its name («Terminal-Bench 2.0» already carries a number).
    sourceTag(ctx, env, 'cap-2', ESC.tags[1].x, ESC.tags[1].y, { x: P2.x + 24 + NL2.w, y: P2.y + 30 }, seg(e2, 0.5, 1));
    var climb2 = inOut3(beat(a1, C.sube2 - 0.12, C.sube2 + 0.02));
    ladderLamp(ctx, env, s, lx2, lerp(v20, v77, climb2), seg(lp2, 0.6, 1));
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · empresas — back in the warm world: an office building with 100 small windows, exactly 23
  // lit by lamps (in reading order, countable); beside it, a card with the sentence «En ninguna
  // función el escalamiento supera 10%» and its 10% ceiling on a 0–100% track: no bars under it.

  var EMP = {
    building: { x: 78, y: 92, w: 396, h: 478 },
    grid: { x: 106, y: 148, pitch: 34, win: 24, cols: 10 },
    label: { x: 528, y: 70, w: 352 }, tag2: { x: 528, y: 172 },
    card: { x: 516, y: 286, w: 368, h: 258 }, sentence: { x: 540, y: 306, w: 324 },
    track: { x: 540, y: 410, len: 300, h: 24 }, tag3: { x: 590, y: 452 }
  };

  function empresas(ctx, s, env) {
    var C = cuesOf(s, 'empresas'), st = s.state.emp, ink = env.ink, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = s.at(0), intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 1110, 116, 50, { a: m.rojo }], ['pajaro', 1196, 470, 54]], intro);
    ink.draw(ctx, st.building, 0, 0, 1, { p: seg(s.t, 0, 1.2) });
    // 100 windows; 23 light up in reading order by the chunk that says 23%.
    var G = EMP.grid, n = Math.round(val(env, rot(s, 'escalan'))), win = landWindow(C.escala);
    var lit = Math.round(n * out3(beat(a, win[0], win[1])));
    var wp = seg(s.t, 0.6, 1.4);
    for (var i = 0; i < 100; i++) {
      var col = i % G.cols, row = Math.floor(i / G.cols), x = G.x + col * G.pitch, y = G.y + row * G.pitch;
      if (wp <= 0) break;
      if (i < lit) {
        ink.glow(ctx, x + G.win / 2, y + G.win / 2, G.win * 0.9, m.amarillo, 0.5);
        ctx.fillStyle = m.amarillo;
        ctx.fillRect(x, y, G.win, G.win);
        env.fig.lamp(ctx, x + G.win / 2, y + G.win / 2, 0.17, { t: s.t + i * 0.3, stars: false });
      } else {
        ctx.save();
        ctx.globalAlpha *= wp;
        ctx.fillStyle = env.pal.mix(m.azul, m.lienzo, 0.55);
        ctx.fillRect(x, y, G.win, G.win);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha *= wp;
      ctx.strokeStyle = m.tinta;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x, y, G.win, G.win);
      ctx.restore();
    }
    // The label once the windows are lit; the tag from the first lit window on.
    var L = EMP.label, LT = ink.text(ctx, rot(s, 'escalan'), L.x, L.y, { size: 30, weight: 700, maxWidth: L.w, lineHeight: 1.15, p: seg(a, win[1], win[1] + 0.05) });
    sourceTag(ctx, env, 'adop-2', EMP.tag2.x, EMP.tag2.y, { x: L.x + 4, y: L.y + LT.h - 2 }, beat(a, win[0], win[0] + 0.05));
    // The card: the sentence and the 10% ceiling, nothing invented under it.
    var cp = beat(a, C.ninguna - 0.06, C.ninguna + 0.02);
    if (cp <= 0) return;
    var Cd = EMP.card, T = EMP.track, sc = env.chart.scale(100, T.x, T.len);
    ink.card(ctx, Cd.x, Cd.y, Cd.w, Cd.h, { seed: 'v03:tarjeta-10', weight: 4, radius: 12, p: cp, peek: m.verde, peekCorner: 'br' });
    var sp = seg(cp, 0.4, 1);
    ink.text(ctx, rot(s, 'ningunaFuncion'), EMP.sentence.x, EMP.sentence.y, { size: 27, weight: 700, maxWidth: EMP.sentence.w, lineHeight: 1.16, p: sp });
    if (sp > 0) {
      ctx.save();
      ctx.globalAlpha *= sp;
      ctx.fillStyle = env.pal.rgba(m.lienzoOcre, 0.9);
      ctx.fillRect(T.x, T.y, T.len, T.h);
      ink.line(ctx, st.trackEnd, { w: 2.2, profile: 'even', seed: 'v03:pista-fin' });
      ctx.restore();
      env.chart.baseline(ctx, T.x, T.y - 8, T.y + T.h + 8, { p: sp });
    }
    var x10 = sc(val(env, rot(s, 'ningunaFuncion'))), tp = beat(a, C.ninguna, C.ninguna + 0.06);
    if (tp > 0) {
      ctx.save();
      ctx.globalAlpha *= tp;
      ctx.strokeStyle = m.rojo;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x10, T.y - 12);
      ctx.lineTo(x10, T.y + T.h + 12);
      ctx.stroke();
      ctx.restore();
    }
    // The sentence holds the number: its tag comes with it.
    sourceTag(ctx, env, 'adop-3', EMP.tag3.x, EMP.tag3.y, { x: x10, y: T.y + T.h + 12 }, sp);
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · pasos — illustrative example (the player stamps «Ejemplo ilustrativo»): a row of 20 ruled
  // steps; at each one the lamp's glow dims a little (bars of the exact products 0,95^k on a
  // shared scale) and a calligraphic counter marks the step; it ends at «0,95 elevado a 20 ≈ 0,36».
  // A second row, at 99% per step, ends at «≈ 0,82».

  var PAS = {
    panel: { x: 44, y: 104, w: 1192, h: 444 },
    rows: [{ y: 272 }, { y: 462 }],
    x0: 128, dx: 44, tile: 24, barMax: 76, lampK: 0.42
  };
  // The lamp after k steps: its glow is the chance that every step so far went well, q^k (the
  // engine's dim fades the glow linearly to a quarter, so dim = (1 − q^k) / 0.75).
  function rowLamp(ctx, env, s, row, q, k, x, p) {
    var prob = Math.pow(q, k);
    env.fig.lamp(ctx, x, row.y - 2, PAS.lampK, { t: s.t, p: p, dim: clamp01((1 - prob) / 0.75) });
  }

  // One row of the example: per-step success q (from the copy), steps walked so far (0..n).
  function pasoRow(ctx, s, env, st, r, steps, appear, resultP, resultKey) {
    var ink = env.ink, q = env.pal.maquina, m = env.pal.mundo, row = PAS.rows[r], half = PAS.tile / 2;
    var pq = st.q[r], n = st.n;
    for (var i = 0; i < n; i++) {
      var x = PAS.x0 + i * PAS.dx, tp = seg(appear, i * 0.03, i * 0.03 + 0.4);
      if (tp <= 0) continue;
      if (i > 0) ink.rLine(ctx, x - PAS.dx + half, row.y, x - half, row.y, { color: q.linea, w: 1.2, p: tp });
      ink.rRect(ctx, x - half, row.y - half, PAS.tile, PAS.tile, { color: q.linea, w: 1.4, fill: q.rejilla, fillAlpha: 0.5, p: tp });
      // A visited step keeps the glow the lamp had there, and its bar: exactly q^(i+1).
      var visit = clamp01(steps - i);
      if (visit > 0) {
        var prob = Math.pow(pq, i + 1), bh = PAS.barMax * prob;
        ink.glow(ctx, x, row.y, 26, q.linea, 0.75 * prob * visit);
        ctx.save();
        ctx.globalAlpha *= visit * 0.85;
        ctx.fillStyle = q.linea;
        ctx.fillRect(x - 5, row.y - half - 8 - bh, 10, bh);
        ctx.restore();
        ink.line(ctx, st.ticks[r][i], { w: 3, profile: 'swell', seed: 'v03:marca' + r + i, p: visit, color: m.lienzo });
      }
    }
    // The bars' shared baseline and the height of a sure step (1), the same for both rows.
    var base = row.y - half - 8, top = base - PAS.barMax, xEnd = PAS.x0 + (n - 1) * PAS.dx;
    ink.rLine(ctx, PAS.x0 - 22, base, xEnd + 16, base, { color: q.linea, w: 1, p: seg(appear, 0, 0.5), alpha: 0.6 });
    ink.rLine(ctx, PAS.x0 - 22, top, PAS.x0 - 12, top, { color: q.linea, w: 1, p: seg(appear, 0.2, 0.5) });
    ink.rLine(ctx, PAS.x0 - 17, top, PAS.x0 - 17, base, { color: q.linea, w: 1, p: seg(appear, 0.2, 0.5) });
    var k = Math.max(0, Math.min(n, steps));
    var lampX = steps < 1 ? PAS.x0 - PAS.dx + PAS.dx * steps : PAS.x0 + (Math.min(n, steps) - 1) * PAS.dx;
    rowLamp(ctx, env, s, row, pq, k, lampX, seg(appear, 0.3, 0.8));
    if (resultP > 0) {
      ink.text(ctx, rot(s, resultKey), xEnd + 36, row.y - 18, { size: r === 0 ? 30 : 34, weight: 700, color: m.lienzo, maxWidth: 230,
        lineHeight: 1.08, p: resultP });
    }
  }

  function pasos(ctx, s, env) {
    var C = cuesOf(s, 'pasos'), st = s.state.pasos, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1);
    panelIn(ctx, env, PAS.panel, inOut3(seg(s.t, 0.1, 1.1)), 16);
    // Row 1: tiles while the example is introduced; the lamp walks while "si cada paso…" is said.
    var app1 = seg(s.t, 0.6, Math.max(1.8, lineT(s, 0, 0.3)));
    var walk1 = st.n * seg(a0, C.si, C.tarea - 0.03);
    pasoRow(ctx, s, env, st, 0, walk1, app1, beat(a0, C.tarea - 0.03, C.tarea), 'calculo95');
    // Row 2 at 99% per step: its result is said at once, the lamp then walks to it.
    var app2 = beat(a1, 0, 0.05);
    if (app2 > 0) pasoRow(ctx, s, env, st, 1, st.n * beat(a1, 0.08, Math.max(0.2, C.acumulan - 0.08)), app2, beat(a1, 0.02, 0.07), 'calculo99');
    // "Los errores se acumulan": a calligraphic underline under the first result.
    var up = beat(a1, C.acumulan, C.acumulan + 0.12);
    if (up > 0) env.ink.line(ctx, st.under, { w: 4, profile: 'swell', seed: 'v03:subraya', p: up, dot: 'detached', color: m.amarillo });
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · limites — three small cards: «Errores que se acumulan» (a chain with a cracked link),
  // «Poca observabilidad» (a ruled box with its lid closed), «Riesgos de seguridad» (a lamp holding
  // the keys of an envelope, a folder and a door).

  var LIM = { x0: 66, dx: 404, y: 112, w: 340, h: 420, keys: ['errores', 'observabilidad', 'seguridad'], peeks: ['rojo', 'azul', 'amarillo'],
    corners: ['tl', 'br', 'tr'] };

  function limites(ctx, s, env) {
    var C = cuesOf(s, 'limites'), ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1);
    var opens = [beat(a0, C.errores - 0.03, C.errores + 0.06), beat(a0, C.observabilidad - 0.03, C.observabilidad + 0.06), beat(a1, 0, 0.06)];
    for (var i = 0; i < 3; i++) {
      var x = LIM.x0 + i * LIM.dx, y = LIM.y, e = opens[i];
      // "La autonomía tiene tres límites": three empty places first.
      var ghost = seg(s.t, 0.4 + i * 0.25, 1.2 + i * 0.25) * (1 - e);
      if (ghost > 0) {
        ctx.save();
        ctx.globalAlpha *= ghost * 0.6;
        ink.card(ctx, x, y, LIM.w, LIM.h, { seed: 'v03:hueco' + i, weight: 2.4, radius: 14, dashed: true, fill: false });
        ctx.restore();
      }
      if (e <= 0) continue;
      ink.card(ctx, x, y, LIM.w, LIM.h, { seed: 'v03:limite' + i, weight: 4, radius: 14, p: e, peek: m[LIM.peeks[i]], peekCorner: LIM.corners[i] });
      ink.letter(ctx, rot(s, LIM.keys[i]), x + LIM.w / 2, y + 26, { size: 34, align: 'center', maxWidth: LIM.w - 40, maxLines: 2, seed: 'v03:titulo-lim' + i,
        counters: 0.3, stars: false, underline: false, p: seg(e, 0.3, 1) });
      var ip = seg(e, 0.5, 1), cx = x + LIM.w / 2;
      if (i === 0) {
        // The chain, its middle link cracked: a red brush crack and a small break in the ring.
        fig.chain(ctx, cx, y + 280, 1.6, { links: 5, crack: 2, seed: 'v03:cadena', p: ip });
        if (ip >= 1) ink.line(ctx, s.state.lim.crack, { w: 3.4, profile: 'swell', seed: 'v03:grieta', color: m.rojo, dot: 'detached' });
      }
      if (i === 1) fig.weightsBox(ctx, cx - 120, y + 210, 1.1, { lid: 'closed', p: ip });
      if (i === 2 && ip > 0) {
        fig.lamp(ctx, cx, y + 168, 0.62, { t: s.t, p: ip });
        ink.rLine(ctx, cx, y + 200, cx, y + 226, { color: q.noche, w: 1.6, p: ip });
        fig.keyRing(ctx, cx, y + 278, 0.62, { seed: 'v03:llaves', p: ip });
        var items = [['envelope', C.correo, -96], ['folder', C.archivos, 0], ['doorway', C.sistemas, 96]];
        for (var k = 0; k < 3; k++) {
          var op = beat(a1, items[k][1] - 0.03, items[k][1] + 0.06), ix = cx + items[k][2], iy = y + 376;
          if (op <= 0) continue;
          ink.dotted(ctx, s.state.lim.threads[k], { r: 1.8, gap: 9, p: op, seed: 'v03:hilo' + k });
          if (items[k][0] === 'doorway') fig.doorway(ctx, ix, iy + 18, 0.42, { seed: 'v03:puerta', p: op });
          else fig[items[k][0]](ctx, ix, iy - 2, 0.5, { seed: 'v03:' + items[k][0], p: op });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · tendencia — METR's task horizon in a ruled navy panel: a straight line on a doubling grid
  // (one gridline = ×2) whose slope is exactly one doubling per 7 months, from 2019 to the present
  // of that series; beyond it only fog with «Tendencia, no pronóstico» (no dotted extension). The
  // updated methodology (Time Horizon 1.1: ~89 days since 2024) sits in a separate panel, on the
  // same grid units, as its own slope triangle.

  var TEN = {
    panel: { x: 52, y: 108, w: 812, h: 420 }, x0: 112, y0: 488, mpx: 6, g: 26,
    tri: 18, label1: { x: 76, y: 126, w: 270 }, tag: { x: 384, y: 12 },
    fog: { x: 556, y: 110, w: 306, h: 416, ramp: 110 }, fogWords: { x: 748, y: 232, w: 210 },
    inset: { x: 892, y: 108, w: 340, h: 300 }
  };
  // Height on the doubling grid after m months, at one doubling every `per` months.
  function tenY(m, per) { return TEN.y0 - m / per * TEN.g; }

  function tendencia(ctx, s, env) {
    var C = cuesOf(s, 'tendencia'), st = s.state.ten, ink = env.ink, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), P = TEN.panel, per = st.monthsPer, months = st.months;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.1, 1.1)), 16);
    // The doubling grid (each line ×2) and yearly verticals, both ruled.
    var gp = seg(s.t, 0.6, 1.6), x1 = TEN.x0 + months * TEN.mpx;
    if (gp > 0) {
      ctx.save();
      ctx.globalAlpha *= 0.55 * gp;
      for (var k = 0; k * TEN.g <= TEN.y0 - P.y - 30; k++) ink.rLine(ctx, TEN.x0 - 10, TEN.y0 - k * TEN.g, x1, TEN.y0 - k * TEN.g, { color: q.linea, w: 1 });
      for (k = 0; k * 12 <= months; k++) ink.rLine(ctx, TEN.x0 + k * 12 * TEN.mpx, TEN.y0 + 8, TEN.x0 + k * 12 * TEN.mpx, P.y + 24, { color: q.linea, w: 1, dash: [2, 5] });
      ctx.restore();
      ink.rLine(ctx, TEN.x0 - 10, TEN.y0, x1 + 6, TEN.y0, { color: q.linea, w: 1.4, p: gp });
    }
    // The rising ruled line draws while "la duración de las tareas…" is said; it ends at the present.
    var lp = beat(a0, C.duracion, Math.min(0.62, C.duracion + 0.3));
    if (lp > 0) {
      ink.rLine(ctx, TEN.x0, TEN.y0, lerp(TEN.x0, x1, lp), lerp(TEN.y0, tenY(months, per), lp), { color: q.linea, w: 3 });
      if (lp >= 1) ink.rCircle(ctx, x1, tenY(months, per), 5, { fill: q.brilloVerde, stroke: false });
    }
    // Its doubling time: the slope triangle (7 months across, one doubling up), and the label.
    var dp = beat(a0, C.duplico - 0.04, C.duplico + 0.04);
    if (dp > 0) {
      var tm = TEN.tri, tx = TEN.x0 + tm * TEN.mpx, ty = tenY(tm, per), run = per * TEN.mpx;
      ctx.save();
      ctx.globalAlpha *= dp;
      ink.rLine(ctx, tx, ty, tx + run, ty, { color: q.brilloVerde, w: 1.8, dash: [3, 3] });
      ink.rLine(ctx, tx + run, ty, tx + run, ty - TEN.g, { color: q.brilloVerde, w: 1.8 });
      ink.rLine(ctx, TEN.label1.x + 60, TEN.label1.y + 60, tx + run / 2, ty + 4, { color: q.linea, w: 1 });
      ctx.restore();
      var L1 = ink.text(ctx, rot(s, 'duplicacion'), TEN.label1.x, TEN.label1.y, { size: 22, weight: 700, color: m.lienzo, maxWidth: TEN.label1.w,
        lineHeight: 1.14, p: dp });
      sourceTag(ctx, env, 'cap-8', TEN.tag.x, TEN.tag.y, { x: TEN.label1.x + L1.w + 4, y: TEN.label1.y + 12 }, dp);
    }
    // Fog beyond the present: a cream veil that thickens away from the line's end (nothing is drawn
    // into it), soft patches and calligraphic wisps drifting slowly; then the handwritten words.
    var F = TEN.fog, fp = seg(s.t, 0.8, 2.2);
    if (fp > 0) {
      var c = calm(s), veil = ctx.createLinearGradient(F.x, 0, F.x + F.ramp, 0);
      veil.addColorStop(0, env.pal.rgba(m.lienzo, 0));
      veil.addColorStop(1, env.pal.rgba(m.lienzo, 0.9));
      ctx.save();
      ctx.beginPath();
      ctx.rect(F.x, F.y, F.w, F.h);
      ctx.clip();
      ctx.globalAlpha *= fp;
      ctx.fillStyle = veil;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      for (var i = 0; i < st.fog.length; i++) {
        var f = st.fog[i];
        ink.glow(ctx, f.x + noise(s.t * 0.07 + i, 'v03:niebla' + i) * 26 * c, f.y + noise(s.t * 0.05 + i * 3, 'v03:nieblay' + i) * 14 * c, f.r, m.lienzo, f.a);
      }
      for (i = 0; i < st.wisps.length; i++) {
        ctx.save();
        ctx.translate(noise(s.t * 0.06 + i * 5, 'v03:jirones' + i) * 18 * c, 0);
        ink.line(ctx, st.wisps[i], { w: 2.6, profile: 'swell', seed: 'v03:jiron' + i, color: env.pal.mix(m.celeste, m.tinta, 0.25), alpha: 0.45 });
        ctx.restore();
      }
      ctx.restore();
    }
    var wp = beat(a1, C.tendencia - 0.08, C.tendencia + 0.06);
    if (wp > 0) ink.letter(ctx, rot(s, 'niebla'), TEN.fogWords.x, TEN.fogWords.y, { size: 40, align: 'center', maxWidth: TEN.fogWords.w, maxLines: 2,
      seed: 'v03:tendencia', counters: 0.25, stars: false, underline: true, p: wp });
    // The updated methodology, apart: ~89 days per doubling since 2024, on the same grid units.
    var ip = inOut3(beat(a1, C.dias - 0.06, C.dias + 0.02));
    if (ip > 0) {
      var I = TEN.inset;
      panelIn(ctx, env, I, ip, 16);
      var days = val(env, rot(s, 'duplicacionReciente')), runD = days / 30.44 * TEN.mpx;
      var L2 = ink.text(ctx, rot(s, 'duplicacionReciente'), I.x + 18, I.y + 16, { size: 21, weight: 700, color: m.lienzo, maxWidth: I.w - 36,
        lineHeight: 1.14, p: seg(ip, 0.4, 1) });
      var bx = I.x + 60, by = I.y + I.h - 40, sp = seg(ip, 0.5, 1);
      ctx.save();
      ctx.globalAlpha *= 0.55 * sp;
      for (k = 0; k < 5; k++) ink.rLine(ctx, bx - 10, by - k * TEN.g, bx + 120, by - k * TEN.g, { color: q.linea, w: 1 });
      ctx.restore();
      ink.rLine(ctx, bx, by, bx + runD * 4, by - TEN.g * 4, { color: q.linea, w: 3, p: sp });
      ctx.save();
      ctx.globalAlpha *= sp;
      ink.rLine(ctx, bx + runD, by - TEN.g, bx + runD * 2, by - TEN.g, { color: q.brilloVerde, w: 1.8, dash: [3, 3] });
      ink.rLine(ctx, bx + runD * 2, by - TEN.g, bx + runD * 2, by - TEN.g * 2, { color: q.brilloVerde, w: 1.8 });
      ctx.restore();
      void L2;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 12 · peloton — six identical lamps on thin ruled wheels climb a warm hill and bunch up near
  // the top, each trailing a plain pennant with its own pattern (no names, flags or logos). Then
  // the race moves elsewhere: a signpost with cost, latency, reliability, privacy, integration
  // and openness.

  var PEL = {
    hill: { base: 640, h: 400, cx: 760, w: 470 },
    lead: { start: 606, end: 716 }, gap: { start: 112, end: 64 }, k: 0.72,
    // The lamps and their tag appear while "los modelos convergen" is said, once the chapter title
    // (2 s, top-left, where the tag goes) has gone: share of line 0.
    appear: 0.085, tag: { x: 470, y: 30 },
    post: { x: 1010, top: 104, gap: 40 }, words: ['costo', 'latencia', 'confiabilidad', 'privacidad', 'integracion', 'apertura']
  };
  function hillY(x) { var H2 = PEL.hill, u = (x - H2.cx) / H2.w; return H2.base - H2.h * Math.exp(-u * u); }
  function hillSlope(x) { var H2 = PEL.hill, u = (x - H2.cx) / H2.w; return H2.h * Math.exp(-u * u) * 2 * u / H2.w; }

  function peloton(ctx, s, env) {
    var C = cuesOf(s, 'peloton'), st = s.state.pel, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env, 'territorio');
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    floaters(ctx, s, env, [['pajaro', 250, 130, 60], ['estrella', 1180, 80, 34]], intro);
    ink.draw(ctx, st.hillBack, 0, 0, 1, { p: seg(s.t, 0, 1) });
    ink.draw(ctx, st.hill, 0, 0, 1, { p: seg(s.t, 0.1, 1.2) });
    // Six identical lamps converge near the top while it is said; the last ones close the gap.
    var conv = inOut3(seg(s.t, 0.8, lineT(s, 0, Math.min(0.98, C.brecha + 0.2))));
    var pats = env.pal.legend.patterns, rear = null, n = st.n;
    var lead = lerp(PEL.lead.start, PEL.lead.end, conv), gap = lerp(PEL.gap.start, PEL.gap.end, conv);
    for (var i = n - 1; i >= 0; i--) {
      // The pack spreads out behind the leader at first and closes up as the models converge.
      var x = lead - i * gap * (1 + 0.12 * (1 - conv) * i) + Math.sin(s.t * 0.9 + i) * 2 * calm(s), y = hillY(x);
      ctx.save();
      ctx.translate(x, y + 2);
      ctx.rotate(Math.atan(hillSlope(x)));
      fig.lampOnWheels(ctx, 0, 0, PEL.k, { pattern: pats[i % pats.length], t: s.t + i * 0.7, p: beat(a0, PEL.appear + i * 0.012, PEL.appear + 0.06 + i * 0.012) });
      ctx.restore();
      if (i === n - 1) rear = { x: x - 20, y: y - 94 };
    }
    // The six lamps are the six developers of the line: their source tag, tied to the pack.
    var tp = beat(a0, PEL.appear, PEL.appear + 0.06);
    if (tp > 0) sourceTag(ctx, env, 'ctx-modelos-convergen', PEL.tag.x, PEL.tag.y, rear, tp);
    // The signpost beyond the top, one board per word as it is said.
    var Ps = PEL.post, pp = beat(a1, 0, 0.08);
    if (pp <= 0) return;
    ink.line(ctx, st.post, { w: 7, profile: 'blunt', seed: 'v03:poste', p: pp });
    var cues = [C.w0, C.w1, C.w2, C.w3, C.w4, C.w5];
    for (var j = 0; j < 6; j++) {
      var bp = beat(a1, cues[j] - 0.03, cues[j] + 0.04);
      if (bp <= 0) continue;
      var B = st.boards[j];
      ink.shape(ctx, B.pts, { fill: B.color, w: 3.2, seed: 'v03:tabla' + j, p: bp });
      ink.text(ctx, rot(s, PEL.words[j]), B.tx, B.ty, { size: 20, weight: 700, align: 'center', p: seg(bp, 0.5, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 13 · concentracion — a stream of small lamps passes, for the most part, through one gate
  // «industria» (exactly 912 of every 1.000 lamps), with its counter «91,2%» and a ruled bar; then
  // three rows of identical unit cells, 59 · 35 · 8 notable models; at last a ruled box closes its
  // lid over «parámetros», «datos» and «duración del entrenamiento».

  var CON = {
    panel: { x: 36, y: 34, w: 836, h: 214 }, x0: 54, split: 330, gate: 448, x1: 640, laneIn: 140, laneMain: 112, laneSide: 210,
    dt: 0.34, v: 118, lampK: 0.2,
    hero: { x: 664, y: 54 }, bar: { x: 664, y: 178, len: 180, h: 14 }, tag9: { x: 886, y: 50 },
    rows: { x: 56, cells: 250, y0: 280, dy: 50, h: 28, pitch: 9.6 }, tag10: { x: 56, y: 436 },
    box: { x: 922, y: 340, w: 296, h: 176 }
  };
  // Lamp k of the stream goes through the side gate when it carries the next 8,8% of the count, so
  // exactly 912 of every 1.000 lamps pass through «industria».
  function sideLane(k, share) {
    var i = ((k % 1000) + 1000) % 1000;
    return Math.floor((i + 1) * share + 1e-9) > Math.floor(i * share + 1e-9);
  }

  function concentracion(ctx, s, env) {
    var C = cuesOf(s, 'concentracion'), st = s.state.con, ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env, 'datos');
    var a0 = s.at(0), a1 = s.at(1), P = CON.panel;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.1, 1)), 14);
    var share = val(env, rot(s, 'industria')), side = (100 - share) / 100;
    // Gates: the big one «industria», a small unlabeled one for the rest.
    var gp = seg(s.t, 0.5, 1.3), gx = CON.gate;
    if (gp > 0) {
      ink.rRect(ctx, gx - 22, CON.laneMain - 44, 44, 88, { color: q.linea, w: 2, p: gp });
      ink.rLine(ctx, gx - 30, CON.laneMain - 44, gx + 30, CON.laneMain - 44, { color: q.linea, w: 3, p: gp });
      ink.rRect(ctx, gx - 11, CON.laneSide - 16, 22, 32, { color: q.linea, w: 1.4, p: gp });
      ink.text(ctx, rot(s, 'compuerta'), gx, CON.laneMain - 76, { size: 22, weight: 700, color: m.lienzo, align: 'center', p: seg(gp, 0.5, 1) });
    }
    // The stream: lamps spawn at a steady pace and travel at constant speed (pure in s.t).
    var flow = seg(s.t, 0.9, 1.6);
    if (flow > 0) {
      var travel = (CON.x1 - CON.x0) / CON.v, k1 = Math.floor(s.t / CON.dt), k0 = Math.ceil((s.t - travel) / CON.dt);
      for (var k = k0; k <= k1; k++) {
        var x = CON.x0 + CON.v * (s.t - k * CON.dt);
        if (x < CON.x0 || x > CON.x1) continue;
        var lane = sideLane(k, side) ? CON.laneSide : CON.laneMain;
        var y = lerp(CON.laneIn, lane, inOut3(seg(x, CON.split, CON.gate - 40)));
        var fade = seg(x, CON.x0, CON.x0 + 30) * (1 - seg(x, CON.x1 - 60, CON.x1)) * flow;
        if (fade <= 0) continue;
        ctx.save();
        ctx.globalAlpha *= fade;
        env.fig.lamp(ctx, x, y, CON.lampK, { t: s.t + k * 0.37, stars: false });
        ctx.restore();
      }
    }
    // «91,2%»: lands by the first chunk, with a ruled bar on a 0–100% track and its tag.
    var win = landWindow(C.industria), hp = beat(a0, win[0], win[1]);
    if (hp > 0) {
      var B = CON.bar, sc = chart.scale(100, B.x, B.len);
      var HL = hero(ctx, env, rot(s, 'industria'), CON.hero.x, CON.hero.y, 66, { seed: 'v03:912', color: m.lienzo, p: hp });
      ctx.save();
      ctx.globalAlpha *= hp;
      ink.rRect(ctx, B.x, B.y, B.len, B.h, { color: q.linea, w: 1, dash: [3, 3] });
      ctx.restore();
      chart.bar(ctx, { value: share, scale: sc, y: B.y, h: B.h, style: 'ruled', labels: false, seed: 'v03:912bar', p: hp });
      sourceTag(ctx, env, 'cap-9', CON.tag9.x, CON.tag9.y, { x: CON.hero.x + HL.w + 6, y: CON.hero.y + 34 }, hp);
    }
    // Three rows of identical cells: one cell per notable model, all on the same pitch.
    var R = CON.rows, keys = ['eeuu', 'china', 'corea'], w2 = landWindow(C.paises);
    for (var r = 0; r < 3; r++) {
      var rp = beat(a0, w2[0] + r * 0.02, w2[1]), y0 = R.y0 + r * R.dy;
      if (rp <= 0) continue;
      var n = Math.round(val(env, rot(s, keys[r]))), shown = Math.round(n * out3(rp));
      ink.text(ctx, rot(s, keys[r]), R.x, y0 + 1, { size: 23, weight: 700, p: seg(rp, 0, 0.3) });
      for (var c = 0; c < shown; c++) ink.rRect(ctx, R.cells + c * R.pitch, y0, R.pitch - 2, R.h, { fill: q.noche, color: q.linea, w: 1 });
    }
    if (beat(a0, w2[0], w2[1]) > 0) chart.baseline(ctx, R.cells - 4, R.y0 - 8, R.y0 + 2 * R.dy + R.h + 8, { p: beat(a0, w2[0], w2[1]) });
    var tp10 = beat(a0, w2[0], w2[0] + 0.04);
    if (tp10 > 0) sourceTag(ctx, env, 'cap-10', CON.tag10.x, CON.tag10.y, { x: R.x + 2, y: R.y0 + 2 * R.dy + R.h }, tp10);
    // The ruled box: three words go in as they are said; then the lid comes down over them and
    // they sink inside, out of sight.
    var bp = beat(a1, 0, 0.08);
    if (bp <= 0) return;
    var X = CON.box, words = [['parametros', C.parametros], ['datos', C.datos], ['duracion', C.duracion]];
    var close = inOut3(beat(a1, C.duracion + 0.08, Math.min(1, C.duracion + 0.3)));
    for (var j = 0; j < 3; j++) {
      var wp = beat(a1, words[j][1] - 0.03, words[j][1] + 0.05);
      if (wp <= 0) continue;
      var cy = X.y + 2 - j * 42 + 150 * close;
      ink.card(ctx, X.x + 18, cy - 38, X.w - 36, 36, { seed: 'v03:palabra' + j, weight: 2.6, radius: 6, p: wp });
      ink.text(ctx, rot(s, words[j][0]), X.x + X.w / 2, cy - 32, { size: 20, weight: 700, align: 'center', p: seg(wp, 0.4, 1) });
    }
    ink.rRect(ctx, X.x, X.y, X.w, X.h, { fill: q.noche, color: q.linea, w: 1.8, p: bp });
    ctx.save();
    ctx.globalAlpha *= bp;
    for (var g = 1; g < 6; g++) ink.rLine(ctx, X.x + g * X.w / 6, X.y + 8, X.x + g * X.w / 6, X.y + X.h - 8, { color: q.rejilla, w: 1 });
    ctx.restore();
    // The lid hovers above the open box, slightly tilted, and drops onto it.
    ctx.save();
    ctx.translate(X.x - 6, lerp(X.y - 150, X.y, close));
    ctx.rotate(lerp(-0.08, 0, close));
    ink.rRect(ctx, 0, -14, X.w + 12, 14, { fill: q.rejilla, color: q.linea, w: 1.6, p: bp });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 14 · abiertos — a small ruled lamp «111 millones de parámetros» lights a specific task card
  // that a much bigger lamp leaves dark; then 102 small cards, exactly 47 marked «API»; at last a
  // ruled box with a transparent lid shows only a tidy grid of weights while «código», «datos» and
  // «proceso» stay in closed drawers.

  var ABI = {
    small: { x: 170, y: 214, k: 0.46 }, label: { x: 76, y: 268, w: 240 }, tag12: { x: 76, y: 352 },
    card: { x: 360, y: 150, w: 196, h: 150 }, big: { x: 712, y: 236, k: 1.55 },
    grid: { x: 60, y: 150, cols: 17, w: 28, h: 34, gx: 31, gy: 40 }, tag11: { x: 60, y: 62 },
    box: { x: 612, y: 150, k: 1.16 }
  };

  function abiertos(ctx, s, env) {
    var C = cuesOf(s, 'abiertos'), st = s.state.abi, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1170, 500, 34]], intro);
    // Part 1 (line 0): the big lamp and the dark card, the small lamp and its light. It fades out
    // between the lines, with its number and tag.
    var g1 = 1 - seg(s.t, lineT(s, 0, 1) + 0.05, lineT(s, 1, 0) + 0.05);
    if (g1 > 0) {
      ctx.save();
      ctx.globalAlpha *= g1;
      var Cd = ABI.card, light = beat(a0, 0.1, 0.24), Bg = ABI.big;
      fig.lamp(ctx, Bg.x, Bg.y, Bg.k, { t: s.t, p: seg(s.t, 0.3, 1.2) });
      if (light > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.32 * light;
        ctx.fillStyle = m.amarillo;
        ctx.beginPath();
        ctx.moveTo(ABI.small.x + 14, ABI.small.y - 10);
        ctx.lineTo(Cd.x, Cd.y + 6);
        ctx.lineTo(Cd.x, Cd.y + Cd.h - 6);
        ctx.lineTo(ABI.small.x + 14, ABI.small.y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ink.glow(ctx, Cd.x + Cd.w / 2, Cd.y + Cd.h / 2, 150, m.amarillo, 0.55 * light);
      }
      ink.card(ctx, Cd.x, Cd.y, Cd.w, Cd.h, { seed: 'v03:tarea', weight: 4, radius: 10, p: seg(s.t, 0.4, 1.3),
        fill: env.pal.mix(env.pal.mix(m.lienzo, q.noche, 0.55), m.lienzo, light) });
      ink.draw(ctx, st.taskMark, Cd.x + Cd.w / 2, Cd.y + Cd.h / 2, 1, { p: seg(s.t, 0.8, 1.6), alpha: 0.35 + 0.65 * light });
      var sp = beat(a0, 0, 0.06);
      if (sp > 0) {
        fig.lamp(ctx, ABI.small.x, ABI.small.y, ABI.small.k, { t: s.t, p: sp });
        var Lb = ABI.label, LT = ink.text(ctx, rot(s, 'modeloPequeno'), Lb.x, Lb.y, { size: 25, weight: 700, maxWidth: Lb.w, lineHeight: 1.12, p: sp });
        sourceTag(ctx, env, 'cap-12', ABI.tag12.x, ABI.tag12.y, { x: Lb.x + 2, y: Lb.y + LT.h - 4 }, sp);
      }
      ctx.restore();
    }
    // Part 2: 102 cards, 47 «API», on screen as the chunk that says them appears.
    var G = ABI.grid, n = st.total, napi = st.api;
    var ge = seg(s.t, lineT(s, 0, 1) + 0.1, lineT(s, 1, 0.04));
    if (ge > 0) {
      for (var i = 0; i < n; i++) {
        var cp = seg(ge, i / n * 0.6, i / n * 0.6 + 0.4);
        if (cp <= 0) continue;
        var x = G.x + (i % G.cols) * G.gx, y = G.y + Math.floor(i / G.cols) * G.gy, api = i < napi;
        ink.rRect(ctx, x, y, G.w, G.h, { fill: api ? q.noche : env.pal.mix(q.noche, m.lienzo, 0.86), color: api ? q.linea : q.rejilla, w: 1.2, p: cp });
        if (api && cp >= 1) ink.text(ctx, rot(s, 'api'), x + G.w / 2, y + G.h / 2 - 7, { size: 11, weight: 700, color: m.lienzo, align: 'center' });
      }
      sourceTag(ctx, env, 'cap-11', ABI.tag11.x, ABI.tag11.y, { x: G.x + 2, y: G.y - 2 }, seg(ge, 0, 0.3));
    }
    // Part 3: open weights are not open code, data or process.
    var bp = beat(a1, C.pesos - 0.04, C.pesos + 0.04);
    if (bp <= 0) return;
    var X = ABI.box, box = fig.weightsBox(ctx, X.x, X.y, X.k, { lid: 'transparent', drawers: 3, p: bp });
    var drawers = [['codigo', C.codigo], ['datos', C.datos], ['proceso', C.proceso]];
    for (var d = 0; d < box.drawers.length; d++) {
      var dp = beat(a1, drawers[d][1] - 0.02, drawers[d][1] + 0.04), D = box.drawers[d];
      if (dp <= 0) continue;
      ink.rRect(ctx, D.x + 10, D.y + 6, 22, D.h - 12, { color: q.linea, w: 1.2 });
      ink.rLine(ctx, D.x + 14, D.y + D.h / 2, D.x + 28, D.y + D.h / 2, { color: q.linea, w: 1.2 });
      ink.text(ctx, rot(s, drawers[d][0]), D.x + D.w - 16, D.y + D.h / 2 - 11, { size: 20, weight: 700, color: m.lienzo, align: 'right', p: dp });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 15 · cierre — back to the cordillera at dusk: the climber plants a small flag on a modest,
  // well-mapped peak (contour loops); the final title writes itself; slow fade to night.

  function cierre(ctx, s, env) {
    var C = cuesOf(s, 'cierre'), st = s.state.cord, ink = env.ink, m = env.pal.mundo;
    var cam = wideCam(s), a0 = s.at(0), a1 = s.at(1);
    stageGround(ctx, s, cam);
    range(ctx, env, st, cam, 1);
    // A dusk light over the range.
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = m.siena;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    litCap(ctx, env, st, cam, GPQA, beat(a0, C.picos - 0.03, C.picos + 0.08));
    litCap(ctx, env, st, cam, MATE, beat(a0, C.picos - 0.01, C.picos + 0.1));
    deepen(ctx, env, cam, 0.6 * beat(a0, C.valles - 0.03, C.valles + 0.1));
    // The modest peak is mapped: contour loops and a dotted path to its top.
    var g = peakGeom(MODESTO), mp = seg(s.t, 0.3, 1.6);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.k, cam.k);
    ink.contours(ctx, Math.round(g.x + 6), Math.round(g.top + 92), 66, 34, { n: 4, seed: 'v03:mapa', w: 1.6, p: mp, color: m.tinta, alpha: 0.7 });
    ink.dotted(ctx, st.mapPath, { r: 2, gap: 10, p: mp, seed: 'v03:sendero' });
    ctx.restore();
    // The climber reaches the top as the line ends and plants the flag on the second line.
    var u = inOut3(seg(s.t, 0.4, lineT(s, 0, 0.95)));
    climber(ctx, s, env, st.peakPath, st.peakRope, cam, lerp(0.05, 1, u), seg(s.t, 0, 0.8), { pose: u >= 1 ? 'standing' : 'walking' });
    var fp = beat(a1, 0, 0.12);
    if (fp > 0) {
      var top = toScreen(cam, st.peakPath.x[st.peakPath.n - 1] + 12, st.peakPath.y[st.peakPath.n - 1] + 2, Q2);
      ctx.save();
      ctx.translate(top.x, top.y);
      ctx.scale(cam.k, cam.k);
      ink.draw(ctx, st.flag, 0, 0, 1, { p: fp });
      ctx.restore();
    }
    ink.letter(ctx, rot(s, 'titulo'), W / 2, 34, { size: 52, align: 'center', maxWidth: 1160, maxLines: 1, seed: 'v03:titulo-final', color: m.lienzo,
      counters: 0.25, counterColors: [m.amarillo, m.rojo, m.celeste], stars: false, p: beat(a1, 0, 0.7) });
    // Slow fade to night once the title has been read.
    var f = seg(s.t, s.dur - 1.1, s.dur);
    if (f > 0) {
      ctx.save();
      ctx.globalAlpha = inOut3(f);
      ctx.fillStyle = env.pal.maquina.noche;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  // A walk up the left slope of peak i, on its drawn outline (fig.cordillera's points, smoothed).
  function slopeWalk(env, i, fromY, toApex) {
    var g = peakGeom(i), sp = env.ink.smoothPath(g.pts, true, 3), xs = [], ys = [];
    for (var k = 0; k < sp.n; k++) {
      var x = sp.x[k], y = sp.y[k];
      if (x > g.apex.x - toApex) break;
      if (y > fromY) continue;
      xs.push(x);
      ys.push(y);
    }
    return polyPath(xs, ys);
  }
  // The climber's rope: the walk lifted to hand height, from the anchor to the end of the walk.
  function ropeOf(path, lift, u1) {
    var pts = [], q = {};
    for (var i = 0; i <= 24; i++) {
      pathAt(path, u1 * i / 24, q);
      pts.push(q.x, q.y - lift);
    }
    return { pts: pts, u1: u1, x: path.x[0], y: path.y[0] - 2 };
  }

  function setup(env) {
    var ink = env.ink, m = env.pal.mundo, q = env.pal.maquina, video = findVideo(env.id || 'v03'), i, k;
    var st = {};

    // pregunta: the task's steps (the count of its line, «una tarea de 20 pasos»), laid out as a
    // serpentine path; the stamp and the warm hand.
    var T = PREG.tiles, tiles = [], nSteps = numbersIn(lineText(video, 'pregunta', 0))[0] || 0;
    for (i = 0; i < nSteps; i++) {
      var r = Math.floor(i / T.cols), c = i % T.cols, cc = r % 2 ? T.cols - 1 - c : c;
      tiles.push({ x: T.x0 + cc * T.dx, y: T.y0 + r * T.dy });
    }
    var sb = ink.drawing('v03:sello', { w: 4, jitter: 0.5 });
    sb.circle(0, -126, 24, { fill: m.rojo, w: 3.8 });
    sb.shape([-13, -104, 13, -104, 15, -60, -15, -60], { fill: m.tierra, w: 3.4 });
    sb.shape([-96, -62, 96, -62, 100, -12, -100, -12], { fill: m.madera, w: 4.2 });
    sb.shape([-90, -12, 90, -12, 88, 4, -88, 4], { fill: m.tinta, w: 2.6 });
    var hb = ink.drawing('v03:mano', { w: 4, jitter: 0.6 });
    hb.shape([-30, -72, -118, -250, -206, -430, -152, -458, -66, -270, 22, -82], { fill: m.azul, w: 4.2, fillJitter: 2, fillScale: 0.01 });
    hb.stroke([-38, -96, 16, -106], { w: 3, profile: 'even' });
    hb.shape([-34, -74, -30, -48, -50, -40, -64, -24, -56, -12, -36, -16, -30, 8, -14, 30, 10, 36, 32, 22, 40, -6, 34, -40, 26, -78],
      { fill: env.pal.pieles[2], w: 4 });
    hb.stroke([-12, 6, -6, 28], { w: 2.2, profile: 'hair' });
    hb.stroke([6, 4, 11, 32], { w: 2.2, profile: 'hair' });
    hb.stroke([22, 0, 27, 22], { w: 2.2, profile: 'hair' });
    st.preg = { tiles: tiles, stamp: sb.done(), hand: hb.done() };

    // cordillera, valles, cierre: lit caps, the climber's walk and rope, the mean line, the mapped peak.
    var caps = {};
    [GPQA, MATE].forEach(function (pi) {
      var g = peakGeom(pi), cb = ink.drawing('v03:cumbre' + pi, { w: 3.6, jitter: 0.8 });
      cb.shape([g.x - 52, g.top + 96, g.x - 12, g.top + 8, g.x + 8, g.top + 2, g.x + 50, g.top + 92, g.x, g.top + 110], { fill: m.amarillo, w: 3.6 });
      caps[pi] = cb.done();
    });
    var walk = slopeWalk(env, GPQA, 470, 26);
    var peak = slopeWalk(env, MODESTO, 520, 8);
    var gm = peakGeom(MODESTO);
    var fb = ink.drawing('v03:bandera', { w: 3, jitter: 0.4 });
    fb.stroke([0, 0, 0, -46], { w: 3.4, profile: 'blunt' });
    fb.shape([0, -46, 30, -38, 0, -28], { fill: m.rojo, w: 2.6 });
    var deepCol = env.pal.mix(m.azul, m.tinta, 0.35);
    var vd = ink.drawing('v03:valles', { w: 3.6, jitter: 0.6 });
    VALLEYS.forEach(function (v, k) {
      vd.shape(v.pts, { fill: deepCol, w: 3.6, fillJitter: 1.5, fillScale: 0.005 });
      vd.stroke(ink.wavePoints(v.x - 30, v.y + 18 + k * 6, v.x + 24, 3, 30, 0.4), { w: 2, profile: 'swell', color: m.celeste, alpha: 0.6 });
    });
    st.cord = {
      caps: caps, path: walk, rope: ropeOf(walk, 18, 0.82), valleys: vd.done(),
      peakPath: peak, peakRope: ropeOf(peak, 18, 1), flag: fb.done(),
      mapPath: [gm.x - 120, BASE - 40, gm.x - 70, gm.top + 150, gm.x - 30, gm.top + 70, gm.x + 2, gm.top + 6]
    };

    // valles: the close-up — three slopes, two deep V fields behind them, mist, the mean line.
    // The dark field fills the whole gap between the two outer slopes; the middle peak, drawn over
    // it, splits it into two V valleys.
    var sl = ink.drawing('v03:laderas', { w: 5, jitter: 0.8 });
    sl.shape([-90, 820, -80, 100, 60, -100, 160, -120, 250, 140, 336, 380, 400, 540, 450, 820], { fill: m.tierra, w: 5.2, fillJitter: 3, fillScale: 0.006 });
    sl.shape([760, 820, 800, 520, 876, 330, 972, 140, 1060, -40, 1200, -80, 1370, -60, 1370, 820],
      { fill: env.pal.mix(m.verde, m.amarillo, 0.3), w: 5.2, fillJitter: 3, fillScale: 0.006 });
    sl.shape([350, 820, 400, 540, 470, 420, 548, 324, 590, 298, 622, 302, 690, 382, 760, 470, 800, 520, 850, 820],
      { fill: m.siena, w: 5.2, fillJitter: 3, fillScale: 0.006 });
    var meanPts = [];
    for (i = 0; i <= 14; i++) meanPts.push(lerp(VAL.mean.x0, VAL.mean.x1, i / 14), VAL.mean.y + Math.sin(i * 1.7) * 1.5);
    st.val = {
      slopes: sl.done(), gap: [180, -160, 1120, -160, 1100, 260, 800, 570, 400, 590, 200, 260], mean: meanPts,
      mist: [ink.wavePoints(362, 420, 452, 3, 38, 0.2), ink.wavePoints(382, 482, 428, 2.5, 30, 1.1),
        ink.wavePoints(716, 400, 832, 3, 40, 0.7), ink.wavePoints(762, 460, 814, 2.5, 30, 1.6), ink.wavePoints(560, 262, 640, 3, 40, 2.2)]
    };

    // casi-pico: the third summit, its apex just under the bar's top; the dotted experts' line.
    var casiRot = sceneRotulos(video, 'casi-pico');
    var vM = val(env, casiRot.mmmu ? casiRot.mmmu.text : ''), gapM = val(env, casiRot.brecha ? casiRot.brecha.text : '');
    var yA = casiScale(vM) + 4, yL = casiScale(vM + gapM);
    var back = ink.drawing('v03:casi-fondo', { w: 4.6, jitter: 1 });
    back.shape([-60, 760, -40, 470, 60, 330, 120, 300, 200, 360, 300, 560, 330, 760], { fill: m.verde, w: 4.6 });
    back.shape([560, 760, 640, 420, 760, 300, 820, 290, 900, 380, 1100, 640, 1120, 760], { fill: m.siena, w: 4.6 });
    var summit = ink.drawing('v03:casi-cumbre', { w: 5, jitter: 0 });
    summit.shape([60, 780, 150, 560, 260, yA + 170, 352, yA + 48, 398, yA + 8, 420, yA, 442, yA + 9, 490, yA + 60, 560, yA + 200, 640, 560, 720, 780],
      { fill: m.azul, w: 5.2 });
    summit.stroke([396, yA + 46, 412, yA + 92], { w: 2, profile: 'hair', color: m.celeste });
    var dots = [];
    for (i = 0; i <= 8; i++) dots.push(lerp(CASI.dotsFrom, CASI.panel.x, i / 8), yL);
    st.casi = { back: back.done(), summit: summit.done(), dots: dots };

    // chatbot: bubble scribbles and the arrows in and out of the lamp.
    var R = CHAT.row;
    st.chat = {
      scribbles: [[-26, -8, -12, -11, 4, -7, 26, -10], [-26, 9, -10, 6, 8, 10, 20, 8]],
      inArrow: [R.q0 + 70, R.y + 2, (R.q0 + R.lamp) / 2, R.y - 10, R.lamp - 48, R.y],
      outArrow: [R.lamp + 48, R.y, (R.lamp + R.a1) / 2, R.y - 10, R.a1 - 70, R.y + 2]
    };

    // empresas: the warm building around the window grid, and the end of the 0–100% track.
    // A warm office building: straight hand-drawn walls (points along every edge keep them from
    // bowing), a flat roof slab, a door.
    var E = EMP.building, eb = ink.drawing('v03:edificio', { w: 4.4, jitter: 1 });
    var x0 = E.x, x1 = E.x + E.w, y0 = E.y + 26, y1 = E.y + E.h;
    var wall = [], f;
    for (f = 0; f <= 4; f++) wall.push(x0 + f * 0.6, lerp(y1 - 10, y0 + 12, f / 4));
    wall.push(x0 + 10, y0, lerp(x0, x1, 0.33), y0 + 1, lerp(x0, x1, 0.66), y0, x1 - 10, y0 + 1);
    for (f = 0; f <= 4; f++) wall.push(x1 - (4 - f) * 0.6, lerp(y0 + 12, y1 - 10, f / 4));
    wall.push(x1 - 12, y1, lerp(x1, x0, 0.33), y1 + 1, lerp(x1, x0, 0.66), y1, x0 + 12, y1 + 1);
    eb.shape(wall, { fill: m.tierra, w: 4.6, fillJitter: 2, fillScale: 0.004 });
    eb.shape([x0 - 18, y0 + 4, lerp(x0, x1, 0.5), y0 + 2, x1 + 18, y0 + 4, x1 + 16, E.y - 2, lerp(x0, x1, 0.5), E.y, x0 - 16, E.y - 2],
      { fill: m.siena, w: 4, fillJitter: 1.5, fillScale: 0.004 });
    eb.shape([lerp(x0, x1, 0.5) - 34, y1, lerp(x0, x1, 0.5) - 34, y1 - 44, lerp(x0, x1, 0.5) + 34, y1 - 44, lerp(x0, x1, 0.5) + 34, y1],
      { fill: m.madera, w: 3.4, fillJitter: 1 });
    eb.stroke([x0 - 40, y1, x1 + 50, y1 + 2], { w: 5, profile: 'blunt' });
    var Tr = EMP.track;
    st.emp = { building: eb.done(), trackEnd: [Tr.x + Tr.len, Tr.y - 6, Tr.x + Tr.len, Tr.y + Tr.h + 6] };

    // pasos: the example's numbers come from its copy: «0,95 elevado a 20 ≈ 0,36» gives the success
    // per step and the number of steps; the second line («Con 99% de éxito por paso…») the other
    // rate. One calligraphic tally mark under every step; the underline of the first result.
    var c95 = numbersIn(rotText(video, 'pasos', 'calculo95')), n99 = numbersIn(lineText(video, 'pasos', 1));
    var nP = c95[1] || 0, ticks = [[], []];
    for (var rr = 0; rr < 2; rr++) {
      var rs = env.rng('v03:marcas' + rr), ry = PAS.rows[rr].y + PAS.tile / 2 + 12;
      for (i = 0; i < nP; i++) {
        var tx = PAS.x0 + i * PAS.dx;
        ticks[rr].push([tx - 3 + rs.jitter(1.5), ry, tx + rs.jitter(1.5), ry + 9, tx + 3 + rs.jitter(1.5), ry + 18]);
      }
    }
    var ux = PAS.x0 + (nP - 1) * PAS.dx + 36;
    st.pasos = { n: nP, q: [c95[0] || 0, (n99[0] || 0) / 100], ticks: ticks, under: ink.wavePoints(ux, PAS.rows[0].y + 62, ux + 210, 3, 70, 0.5) };

    // limites: dotted threads from the key ring to the envelope, the folder and the door.
    var cx = LIM.x0 + 2 * LIM.dx + LIM.w / 2, ky = LIM.y + 300, ccx = LIM.x0 + LIM.w / 2, ccy = LIM.y + 280;
    st.lim = {
      threads: [[cx - 18, ky, cx - 60, ky + 34, cx - 96, ky + 58], [cx, ky + 8, cx + 2, ky + 34, cx, ky + 56], [cx + 18, ky, cx + 60, ky + 32, cx + 96, ky + 50]],
      crack: [ccx - 6, ccy - 30, ccx + 4, ccy - 12, ccx - 4, ccy - 2, ccx + 6, ccy + 12]
    };

    // tendencia: the doubling time and the years of the series come from the rótulo «se duplicó
    // cada ~7 meses (2019–2025)»; the fog's soft veils.
    var dup = numbersIn(rotText(video, 'tendencia', 'duplicacion'));
    var fr = env.rng('v03:niebla'), fog = [], wisps = [];
    for (i = 0; i < 7; i++) fog.push({ x: TEN.fog.x + fr.range(110, TEN.fog.w), y: TEN.fog.y + fr.range(0, TEN.fog.h), r: fr.range(110, 170), a: fr.range(0.35, 0.6) });
    for (i = 0; i < 6; i++) {
      var wy = TEN.fog.y + 40 + i * 64 + fr.range(-10, 10), wx = TEN.fog.x + 70 + fr.range(0, 60);
      wisps.push(ink.wavePoints(wx, wy, wx + fr.range(120, 200), fr.range(4, 7), fr.range(60, 90), fr() * 6));
    }
    st.ten = { fog: fog, wisps: wisps, monthsPer: dup[0] || 1, months: ((dup[2] || 0) - (dup[1] || 0)) * 12 };

    // peloton: the hill (and a farther one), the signpost and its boards sized to their words.
    var hill = [-40, 760], hb2 = [];
    for (var x = -40; x <= 1320; x += 40) hill.push(x, hillY(x));
    hill.push(1320, 760);
    for (x = 560; x <= 1320; x += 60) hb2.push(x, PEL.hill.base - 120 - 150 * Math.exp(-Math.pow((x - 1080) / 260, 2)));
    var hillD = ink.drawing('v03:colina', { w: 5, jitter: 0.6 });
    hillD.shape(hill, { fill: env.pal.mix(m.verde, m.amarillo, 0.25), w: 5, fillJitter: 2.5, fillScale: 0.004 });
    var backD = ink.drawing('v03:colina-lejos', { w: 4, jitter: 0.6 });
    backD.shape(hb2.concat([1320, 760, 560, 760]), { fill: env.pal.mix(m.verde, m.lienzoOcre, 0.55), w: 4, fillJitter: 2.5, fillScale: 0.004 });
    var pelRot = sceneRotulos(video, 'peloton'), mctx = env.canvas(8, 8).getContext('2d'), boards = [];
    var Ps = PEL.post, groundY = hillY(Ps.x);
    var boardColors = [m.amarillo, m.lienzoOcre, m.amarillo, m.lienzoOcre, m.amarillo, m.lienzoOcre];
    for (i = 0; i < 6; i++) {
      var word = pelRot[PEL.words[i]] ? pelRot[PEL.words[i]].text : '';
      var bw = ink.measureText(mctx, word, { size: 20, weight: 700 }).w + 44, by = Ps.top + i * Ps.gap, right = i % 2 === 0;
      var x0 = right ? Ps.x + 6 : Ps.x - 6 - bw, x1 = right ? Ps.x + 6 + bw : Ps.x - 6;
      var pts = right ? [x0, by, x1 - 16, by, x1, by + 16, x1 - 16, by + 32, x0, by + 32] : [x1, by, x0 + 16, by, x0, by + 16, x0 + 16, by + 32, x1, by + 32];
      boards.push({ pts: pts, color: boardColors[i], tx: (x0 + x1) / 2 + (right ? -6 : 6), ty: by + 4 });
    }
    st.pel = { hill: hillD.done(), hillBack: backD.done(), post: [Ps.x, groundY + 6, Ps.x - 2, Ps.top - 10], boards: boards };

    // concentracion: nothing to precompute beyond constants.
    st.con = {};

    // abiertos: «47 de 102» from the figure itself (cap-11: «Acceso por API: 47 de 102 modelos
    // notables»); the specific task drawn on its card (a small spiral of the human vocabulary).
    var api = numbersIn(env.cifra('cap-11').cifra);
    var tm = ink.drawing('v03:tarea-signo', { w: 3, jitter: 0.6 });
    var spiral = [];
    for (k = 0; k <= 22; k++) { var ang = k * 0.55, rad = 4 + k * 1.6; spiral.push(Math.cos(ang) * rad - 30, Math.sin(ang) * rad - 6); }
    tm.stroke(spiral, { w: 3, profile: 'swell', dot: true });
    tm.stroke([22, -26, 66, -26], { w: 2.4, profile: 'even' });
    tm.stroke([22, -6, 70, -6], { w: 2.4, profile: 'even' });
    tm.stroke([22, 14, 58, 14], { w: 2.4, profile: 'even' });
    st.abi = { taskMark: tm.done(), api: api[0] || 0, total: api[1] || 0 };

    // peloton: as many lamps as the lámina D5 counts for the converging developers (its datos).
    var d05 = ((EIA.data && EIA.data.deck) || []).filter(function (d) { return d.id === 'd05'; })[0];
    st.pel.n = d05 && d05.datos && d05.datos.lamparas ? d05.datos.lamparas.valor : env.pal.legend.patterns.length;
    void q;
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v03 = {
    setup: setup,
    layers: {
      pregunta: groundLayer('personas', {}),
      cordillera: stageLayer(false),
      'casi-pico': groundLayer('territorio', { seed: 'v03:cielo', horizon: 0.9, contours: false }),
      valles: stageLayer(false),
      saturacion: groundLayer('personas', {}),
      chatbot: groundLayer('personas', {}),
      escalera: groundLayer('personas', {}),
      empresas: groundLayer('personas', {}),
      pasos: groundLayer('personas', {}),
      limites: groundLayer('personas', {}),
      tendencia: groundLayer('personas', {}),
      peloton: groundLayer('territorio', { seed: 'v03:colinas', horizon: 0.62, contours: false }),
      concentracion: groundLayer('datos', {}),
      abiertos: groundLayer('personas', {}),
      cierre: stageLayer(true)
    },
    scenes: {
      pregunta: pregunta,
      cordillera: cordillera,
      'casi-pico': casiPico,
      valles: valles,
      saturacion: saturacion,
      chatbot: chatbot,
      escalera: escalera,
      empresas: empresas,
      pasos: pasos,
      limites: limites,
      tendencia: tendencia,
      peloton: peloton,
      concentracion: concentracion,
      abiertos: abiertos,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
