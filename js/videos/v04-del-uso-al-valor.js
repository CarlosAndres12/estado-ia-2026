/* js/videos/v04-del-uso-al-valor.js — V04 «Del uso al valor» (prompt §13, sesión 3; KB §6, láminas D6–D8).
 *
 * Sixteen scenes in four chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Capital e infraestructura    capital · paises · cadena · costo-oculto · energia
 *   2 El embudo                    embudo · puente · etapas · actualizacion
 *   3 Productividad                productividad · metr
 *   4 Asociación no es causalidad  pwc · causalidad (presses its stamp itself) · intencion · linea-base · cierre
 *
 * The metaphors are the láminas' (prompt §12.2): D6's river of flat gold coins that flows into a
 * reservoir with one sluice gate, its ruled server tower and its hand-drawn register meter; D7's
 * proportional funnel and the bridge from «Uso» to «Valor» whose last span is still scaffolding;
 * D8's balance (three weights against an hourglass) and its causal diagram with the dotted
 * «asociación» line. Coins and rivers carry no count: they are the metaphor, not data.
 *
 * Every number is an exact mark or a whole reading, with its source tag from the line that says it
 * to the end of its scene: coin piles exactly 23,1 : 1 on one baseline; compute slices exactly
 * 9,6% / 22,6% / 12,3% of identical ruled blocks; dot clusters of exactly 44, 85, 41 and 8; the four
 * funnel bars on one zero-based scale, the narrowest with the «≈» cap; the weights of the balance on
 * one scale (the 14–15% range as a band); the METR interval from −38% to +9% with its point and the
 * zero line; the PwC towers exactly 27,0 : 8,5. Editions never share a page, an axis or a line: the
 * 2026 survey is a separate page with its «Actualización» ribbon, and the 2026 wage premium a
 * separate card. Benchmarks and compute live in ruled navy panels; people and places are warm and
 * free; the AI is only the small ruled lamp.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings
 * it, and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds.
 * No string, number or source is typed here: copy comes from s.rotulos (js/data/videos.js), values
 * from env.chart.parseValue(rótulo), sources from env.tags. Draw functions are pure functions of
 * (s, env): motion comes from s.t, geometry is built in setup(). */
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
  // Ambient motion that rests at both ends of a scene, so crossfades blend calm frames.
  function calm(s) { return seg(s.t, 0, 1.2) * seg(s.dur - s.t, 0, 1.2); }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    capital: { inversion: [0, '344.700', 'chunk'], generativa: [1, 'La IA generativa', 'word'], corporativa: [1, '581.700', 'chunk'] },
    paises: { pilas: [0, '23 veces', 'chunk'], nota: [0, 'subestimada', 'chunk'],
      l0: [1, 'publicaciones', 'word'], l1: [1, 'citaciones', 'word'], l2: [1, 'patentes', 'word'], l3: [1, 'robots', 'word'] },
    cadena: { s0: [0, 'capital,', 'word'], s1: [0, 'cómputo', 'word'], s2: [0, 'modelos', 'word'], s3: [0, 'productos', 'word'] },
    'costo-oculto': { corrida: [0, 'La corrida final', 'chunk'], cifras: [0, '9,6%', 'chunk'], resto: [1, 'El resto', 'chunk'],
      barreras: [1, 'Mirar solo', 'chunk'] },
    energia: { medidor: [0, '29,6', 'chunk'], rebote: [0, 'Si la demanda', 'chunk'], europa: [1, 'Entre 2018', 'chunk'],
      tres: [1, 'de 3 a', 'word'], cuarenta: [1, 'a 44', 'word'], resto: [1, 'China tiene 85', 'chunk'] },
    embudo: { uso: [0, '88%', 'chunk'], agentes: [0, '62%', 'chunk'], escala: [1, 'cerca de un tercio', 'chunk'], impacto: [1, '39%', 'chunk'],
      patron: [3, 'El embudo muestra', 'chunk'] },
    puente: { procesos: [0, 'rediseñar', 'word'], liderazgo: [0, 'liderazgo', 'word'], metricas: [0, 'métricas', 'word'],
      transformacion: [0, 'transformación', 'word'] },
    etapas: { e0: [0, 'acceso', 'word'], e1: [0, 'experimentación,', 'word'], e2: [0, 'integración,', 'word'], e3: [0, 'rediseño', 'word'],
      e4: [0, 'escala', 'word'], e5: [0, 'transformación', 'word'], mayoria: [0, 'La mayoría', 'chunk'] },
    actualizacion: { uso: [0, 'cerca de nueve', 'chunk'], escala: [0, 'el 44%', 'chunk'], curso: [1, 'El curso', 'chunk'],
      series: [1, 'Y no mezclamos', 'chunk'] },
    productividad: { heterogenea: [0, 'Es real', 'chunk'], soporte: [0, '14 a 15%', 'chunk'], software: [0, '26%', 'chunk'],
      marketing: [0, '50%', 'chunk'], experimento: [1, '4.867', 'chunk'] },
    metr: { ensayo: [0, '19%', 'chunk'], nota: [1, 'METR marca', 'chunk'], seguimiento: [1, 'Su seguimiento', 'chunk'],
      intervalo: [1, '18% menos', 'chunk'] },
    pwc: { torres: [0, '27,0%', 'chunk'], prima: [0, '56%', 'chunk'], barometro: [1, '62%', 'chunk'] },
    causalidad: { nube: [0, 'más capital', 'word'], datos: [0, 'datos, capacidad', 'chunk'], sello: [0, 'Asociación no es', 'word'],
      m0: [1, 'adopciones', 'word'], m1: [1, 'experimentos', 'word'], m2: [1, 'discontinuidades', 'word'], m3: [1, 'instrumentos', 'word'] },
    intencion: { integrar: [0, 'el 81%', 'chunk'], contratar: [0, 'el 32%', 'chunk'], expectativas: [0, 'Son expectativas', 'chunk'] },
    'linea-base': { pregunta: [0, '¿cuál es', 'chunk'], base: [0, 'la línea base', 'word'], costo: [0, 'el costo total', 'word'],
      verifica: [0, 'quién verifica', 'word'], todo: [1, 'todo cuenta', 'chunk'] },
    cierre: { construye: [0, 'Se construye', 'chunk'] }
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

  // Every number of a data string in reading order, as the engine parses it ("OpenAI (2024) 9,6%"
  // → 2024, then 9,6 %). Marks take their values from rótulos; drawing code never types one.
  function valuesIn(chart, text) {
    var out = [], rest = String(text || ''), guard = 0;
    while (rest && guard++ < 16) {
      var pv = chart.parseValue(rest);
      if (!pv) break;
      out.push(pv);
      rest = rest.slice(pv.index + Math.max(1, pv.raw.length));
    }
    return out;
  }
  function valueWith(chart, text, unit) {
    var all = valuesIn(chart, text);
    for (var i = 0; i < all.length; i++) if (all[i].unit === unit) return all[i];
    return null;
  }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function bg(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v04:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus static drawing.
  function groundLayer(kind, opts, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d');
      var o = { seed: 'v04:pagina' };
      for (var k in opts) o[k] = opts[k];
      env.ink.background(g, kind, o);
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, color?]; decorative
  // colors only (never the five evidence colors); keep them clear of the subtitle band (y > 570).
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v04:fx' + i) * 9, f[2] + noise(t * 0.8, 'v04:fy' + i) * 7, f[3], {
        seed: 'v04:float' + f[0] + i, colors: f[4] ? { a: f[4] } : null, rot: noise(t * 0.6, 'v04:fr' + i) * 0.14, p: p
      });
    }
  }

  // Brush lettering that fades as one image: drawn glyph by glyph with a low alpha, the fill and
  // the brush stroke overlap and show dark outlines (and a number would pass through in-between
  // numbers). alpha 1 draws it directly.
  function letterFade(ctx, env, text, x, y, lo, alpha, key) {
    if (alpha <= 0) return env.ink.measureLetter(ctx, text, lo);
    if (alpha >= 1) return env.ink.letter(ctx, text, x, y, lo);
    var full = {}, k;
    for (k in lo) full[k] = lo[k];
    full.p = 1;
    var L = env.ink.measureLetter(ctx, text, full), size = L.size;
    var pad = Math.ceil(size * 0.5), w = Math.ceil(L.w + pad * 2), h = Math.ceil(L.h + pad * 2);
    var cx = full.align === 'center' ? w / 2 : full.align === 'right' ? w - pad : pad;
    var img = env.ink.layer(ctx, 'v04:letra|' + key + '|' + size + '|' + (full.color || '') + '|' + (full.maxWidth || ''), w, h, function (g) {
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
      maxLines: o.maxLines || 1, maxWidth: o.maxWidth, fit: !!o.maxWidth, minSize: 18, p: 1 };
    return letterFade(ctx, env, text, x, y, lo, o.p == null ? 1 : clamp01(o.p), 'hero|' + text + '|' + o.seed);
  }

  // A hand-drawn register (the counters of capital, the meter of energia, as in lámina D6): a paper
  // card with a window; the reading appears whole in the window, never digit by digit.
  function register(ctx, env, text, R, o) {
    var ink = env.ink, m = env.pal.mundo;
    ink.card(ctx, R.x, R.y, R.w, R.h, { seed: o.seed, weight: 4.2, radius: 14, p: o.p });
    var win = { x: R.x + 14, y: R.y + 14, w: R.w - 28, h: R.h - 28 - (o.disc ? 34 : 0) };
    var wp = seg(o.p, 0.3, 1);
    if (wp > 0) ink.card(ctx, win.x, win.y, win.w, win.h, { seed: o.seed + ':ventana', weight: 2.6, radius: 6, fill: env.pal.mix(m.lienzo, m.lienzoOcre, 0.35), p: wp });
    var to = { size: o.size || 30, weight: 700, align: 'center', maxWidth: win.w - 22, maxLines: o.maxLines || 1, fit: true, minSize: 16, lineHeight: 1.1 };
    var L = ink.measureText(ctx, text, to);
    var tx = win.x + win.w / 2, ty = win.y + (win.h - L.h) / 2 + 1;
    if (o.textP > 0) {
      to.p = o.textP;
      ink.text(ctx, text, tx, ty, to);
    }
    return { x: tx - L.w / 2, y: ty, w: L.w, h: L.h, win: win };
  }

  // A paper note pinned with a red pin (the «posiblemente subestimada» and «desactualizado» notes).
  function pinnedNote(ctx, env, text, N, p, seed) {
    if (p <= 0) return;
    var ink = env.ink, m = env.pal.mundo;
    ctx.save();
    ctx.translate(N.x + N.w / 2, N.y + N.h / 2);
    ctx.rotate(N.rot == null ? 0.03 : N.rot);
    ink.card(ctx, -N.w / 2, -N.h / 2, N.w, N.h, { seed: seed, weight: 3, radius: 8, p: p, peek: m.amarillo, peekCorner: N.peek || 'tr' });
    ink.text(ctx, text, -N.w / 2 + 20, -N.h / 2 + 18, { size: N.size || 22, italic: true, maxWidth: N.w - 38, lineHeight: 1.2, p: seg(p, 0.3, 1) });
    ink.circle(ctx, 0, -N.h / 2 + 2, 7, { fill: m.rojo, w: 2.2, seed: seed + ':chincheta', p: seg(p, 0, 0.5) });
    ctx.restore();
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
  // A closed band around a sampled path, half width hw0 at its start and hw1 at its end.
  function bandPoints(g, hw0, hw1, n) {
    var left = [], right = [], q = {};
    for (var i = 0; i <= n; i++) {
      var u = i / n, hw = lerp(hw0, hw1, u);
      pathAt(g, u, q);
      left.push(q.x + q.nx * hw, q.y + q.ny * hw);
      right.push(q.x - q.nx * hw, q.y - q.ny * hw);
    }
    for (var j = right.length - 2; j >= 0; j -= 2) left.push(right[j], right[j + 1]);
    return left;
  }
  var Q1 = {}, Q2 = {};   // scratch points, overwritten by every call (no state across frames)

  // Flat gold coins with black outlines drifting down a sampled path; they fade in at the source
  // and out at the mouth. o: n, k (coin scale), speed (path share per second), spread (px across
  // the stream, 0 = on the center line), alpha, phase, seed.
  function coinFlow(ctx, s, env, g, o) {
    var n = o.n, speed = o.speed || 0.016, a0 = o.alpha == null ? 1 : o.alpha;
    if (a0 <= 0) return;
    for (var i = 0; i < n; i++) {
      var u = (i / n + s.t * speed + (o.phase || 0)) % 1;
      var a = Math.min(1, u * 9, (1 - u) * 9) * a0;
      if (a <= 0.01) continue;
      pathAt(g, u, Q1);
      var lane = (((i * 7) % 5) - 2) / 2 * (o.spread || 0);
      ctx.save();
      ctx.globalAlpha *= a;
      env.fig.coin(ctx, Q1.x + Q1.nx * lane, Q1.y + Q1.ny * lane + Math.sin(s.t * 1.7 + i * 2.1) * 1.4, o.k, { seed: (o.seed || 'v04:moneda') + (i % 3) });
      ctx.restore();
    }
  }

  // A person walking from x0 to x1 between scene times t0 and t1 (feet on y), then standing still.
  // o: person options (role, pose while still, prop, seed…); walkPose (pose while moving).
  function walker(ctx, s, env, x0, x1, y, k, t0, t1, o) {
    var e = seg(s.t, t0, t1), moving = e > 0 && e < 1, x = lerp(x0, x1, inOut3(e));
    var bob = moving ? Math.abs(Math.sin((s.t - t0) * 5.2)) * 3 : 0;
    var po = {};
    for (var key in o) po[key] = o[key];
    if (moving && o.walkPose) po.pose = o.walkPose;
    return env.fig.person(ctx, x, y - bob, k, po);
  }

  function findVideo(id) {
    var list = (EIA.data && EIA.data.videos) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // ---------------------------------------------------------------------------------------------
  // The valley of lámina D6 (capital and cadena): hills on the horizon, a river that winds into a
  // reservoir held by a dam with one sluice gate, and the thin channel that leaves through it.

  var VALLE = {
    horizon: 300 / 720,
    river: [-40, 320, 90, 340, 210, 382, 330, 370, 450, 398, 560, 440, 660, 452, 760, 462],
    hw: 19,                                       // half width of the river: private investment
    pool: { cx: 924, cy: 464, rx: 196, ry: 64 },
    // The dam: a wall wider at its foot (straight edges: a polygon field and one stroke per side).
    dam: [1118, 382, 1160, 380, 1174, 544, 1104, 546],
    gate: [1124, 452, 1154, 452, 1155, 506, 1123, 506],
    channel: [1160, 480, 1292, 478, 1292, 494, 1160, 496],
    wheel: { x: 1139, y: 362 },
    poolCoins: [[858, 452], [926, 478], [990, 444], [1046, 474], [800, 482]]
  };

  function valleyLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo, pal = env.pal;
    ink.background(g, 'territorio', { seed: 'v04:valle', horizon: VALLE.horizon, contours: false });
    var b = ink.drawing('v04:colinas', { w: 4.2, jitter: 0.8 });
    b.shape([-30, 302, 40, 238, 150, 206, 280, 212, 380, 250, 440, 302], { fill: m.verde, w: 4.4 });
    b.shape([330, 302, 470, 240, 610, 216, 760, 228, 880, 264, 940, 302], { fill: pal.mix(m.verde, m.amarillo, 0.35), w: 4.2 });
    b.shape([820, 302, 950, 254, 1090, 228, 1230, 238, 1310, 260, 1310, 302], { fill: pal.mix(m.verde, m.tierra, 0.35), w: 4.2 });
    ink.draw(g, b.done(), 0, 0, 1, { offset: 3 });
    return { bg: c };
  }

  // The river, the reservoir, the dam and its gate: one drawing, drawn every frame over the hills
  // (so the wider stream of capital can go under the river and the reservoir can cover both).
  function riverDrawing(env, river) {
    var ink = env.ink, m = env.pal.mundo, V = VALLE;
    var b = ink.drawing('v04:rio', { w: 4.2, jitter: 0.6 });
    b.shape(bandPoints(river, V.hw, V.hw, 44), { fill: m.celeste, w: 3.4 });
    b.blob(V.pool.cx, V.pool.cy, V.pool.rx, V.pool.ry, { fill: m.celeste, w: 4.2, irr: 0.06, n: 12 });
    b.stroke(ink.wavePoints(V.pool.cx - 120, V.pool.cy + 16, V.pool.cx + 40, 3, 52, 0.6), { w: 2.2, profile: 'hair', color: m.lienzo });
    b.shape(V.channel, { fill: m.celeste, w: 2.6 });
    polygonInto(b, V.dam, m.lienzoOcre, 4.4);
    polygonInto(b, V.gate, m.madera, 3.2);
    b.stroke([1128, 470, 1150, 470], { w: 2, profile: 'even', color: m.lienzo });
    b.stroke([1139, 452, 1140, V.wheel.y + 10], { w: 3.4, profile: 'blunt' });
    b.circle(V.wheel.x, V.wheel.y, 9, { fill: m.rojo, w: 2.6 });
    return b.done();
  }

  // A straight-edged shape: a polygon field and one brush stroke per side, so corners stay sharp.
  function polygonInto(b, pts, fill, w) {
    b.fill(pts, { fill: fill, poly: true });
    for (var i = 0; i < pts.length; i += 2) {
      var j = (i + 2) % pts.length;
      b.stroke([pts[i], pts[i + 1], pts[j], pts[j + 1]], { w: w, profile: 'blunt' });
    }
  }

  // Coins resting in the reservoir, and one leaving through the gate every `period` seconds.
  function poolCoins(ctx, s, env, k, period) {
    var V = VALLE;
    for (var i = 0; i < V.poolCoins.length; i++) {
      var pc = V.poolCoins[i];
      env.fig.coin(ctx, pc[0] + Math.sin(s.t * 0.6 + i) * 2, pc[1] + Math.cos(s.t * 0.8 + i * 1.7) * 1.5, k * 0.86, { seed: 'v04:moneda' + (i % 3) });
    }
    var gu = (s.t / period) % 1;
    var gx = lerp(V.gate[0] - 4, 1300, gu), ga = Math.min(1, gu * 6, (1 - gu) * 6);
    ctx.save();
    ctx.globalAlpha *= ga;
    env.fig.coin(ctx, gx, 488, k * 0.62, { seed: 'v04:moneda-compuerta' });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · capital — the river of coins; a counter writes «344.700 millones de dólares · +127,5%»; then
  // a wider stream, «inversión corporativa: 581.700 millones de dólares», exactly as much wider as
  // its value is larger (both widths from the two rótulos, on one scale).

  var CAPITAL = {
    counter1: { x: 520, y: 28, w: 714, h: 92 },
    tag1: { x: 558, y: 136 },
    counter2: { x: 44, y: 118, w: 470, h: 120 },
    tag2: { x: 62, y: 250 },
    coinK: 0.36
  };

  function capital(ctx, s, env) {
    var C = cuesOf(s, 'capital'), st = s.state.capital, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 960, 176, 56, m.rojo], ['pajaro', 196, 70, 60]], intro);
    var a0 = s.at(0), a1 = s.at(1);
    // Line 2: the wider stream blooms around the river (its total width × the ratio of the values).
    var win2 = landWindow(C.corporativa), wide = beat(a1, win2[0] - 0.08, win2[1]);
    if (wide > 0) ink.draw(ctx, st.wide, 0, 0, 1, { p: wide, offset: 3 });
    ink.draw(ctx, st.river, 0, 0, 1, { p: intro, offset: 3 });
    coinFlow(ctx, s, env, st.path, { n: 11, k: CAPITAL.coinK, speed: 0.017, alpha: intro });
    coinFlow(ctx, s, env, st.path, { n: 9, k: CAPITAL.coinK * 0.9, speed: 0.021, phase: 0.37, spread: st.wideHw * 0.62, alpha: seg(wide, 0.5, 1), seed: 'v04:moneda-ancha' });
    poolCoins(ctx, s, env, CAPITAL.coinK, 2.6);

    // Line 1: the counter writes «344.700 millones de dólares · +127,5%» by its subtitle chunk.
    var win1 = landWindow(C.inversion);
    var cp = beat(a0, win1[0] - 0.08, win1[0] + 0.02), np = beat(a0, win1[0], win1[1]);
    if (cp > 0) {
      var B1 = register(ctx, env, rot(s, 'inversionPrivada'), CAPITAL.counter1, { p: cp, textP: np, seed: 'v04:contador', size: 34 });
      if (np > 0) env.tags.sourceTag(ctx, 'eco-1', { x: CAPITAL.tag1.x, y: CAPITAL.tag1.y, anchor: { x: B1.x + 12, y: B1.y + B1.h - 2 }, p: np, scale: 1.04 });
    }
    // Line 2: the corporate counter, with the wider stream.
    var cp2 = beat(a1, win2[0] - 0.08, win2[0] + 0.02), np2 = beat(a1, win2[0], win2[1]);
    if (cp2 > 0) {
      var B2 = register(ctx, env, rot(s, 'inversionCorporativa'), CAPITAL.counter2, { p: cp2, textP: np2, seed: 'v04:contador-corporativo', size: 30, maxLines: 2 });
      if (np2 > 0) env.tags.sourceTag(ctx, 'eco-2', { x: CAPITAL.tag2.x, y: CAPITAL.tag2.y, anchor: { x: B2.x + 8, y: B2.y + B2.h - 4 }, p: np2, scale: 1.04 });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · paises — two coin piles on the two banks, on one baseline, exactly 23,1 : 1 (the ratio
  // parsed from its rótulo); the note pinned to the smaller one; then four small signs of what
  // China leads.

  var PAISES = {
    horizon: 0.3,
    river: [654, 214, 630, 290, 664, 372, 622, 452, 652, 540, 626, 640, 640, 770],
    base: 510,
    us: { x: 440 }, cn: { x: 930 },
    pileW: 112,
    unit: 11.5,                                  // px of China's pile; the other is ratio × unit
    veces: { x: 70, y: 158, size: 40 },
    tag: { x: 70, y: 240 },
    names: { y: 522, size: 32 },
    note: { x: 884, y: 370, w: 320, h: 96 },
    leads: { y: 104, xs: [796, 930, 1064, 1198], size: 64, label: { y: 148, w: 132, size: 17 } }
  };

  function paises(ctx, s, env) {
    var C = cuesOf(s, 'paises'), st = s.state.paises, ink = env.ink, fig = env.fig, m = env.pal.mundo, P = PAISES;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['pajaro', 330, 70, 58]], intro);
    ink.draw(ctx, st.river, 0, 0, 1, { p: intro, offset: 3 });
    coinFlow(ctx, s, env, st.path, { n: 8, k: 0.32, speed: 0.022, alpha: intro });

    // The piles grow from zero on one baseline as the ratio is said, and land exactly.
    var a0 = s.at(0), a1 = s.at(1);
    var ratio = valueWith(env.chart, rot(s, 'veces'), '×');
    var grow = beat(a0, 0.01, Math.max(0.1, C.pilas + 0.1));
    var hCn = P.unit, hUs = ratio ? ratio.value * P.unit : 0;
    if (grow > 0) {
      fig.coinPile(ctx, P.us.x, P.base, 1, { height: hUs, w: P.pileW, p: grow });
      fig.coinPile(ctx, P.cn.x, P.base, 1, { height: hCn, w: P.pileW, p: grow });
    }
    // Names under the piles, written on with the first words.
    var namep = seg(a0, 0, 0.12);
    if (namep > 0) {
      ink.letter(ctx, rot(s, 'eeuu'), P.us.x, P.names.y, { size: P.names.size, align: 'center', seed: 'v04:eeuu', underline: false, stars: false, counters: 0.25, p: namep });
      ink.letter(ctx, rot(s, 'china'), P.cn.x, P.names.y, { size: P.names.size, align: 'center', seed: 'v04:china', underline: false, stars: false, counters: 0.25, p: namep });
    }
    // «23 veces (23,1×)» and its tag, once the piles have landed.
    var lp = seg(a0, Math.max(0.1, C.pilas + 0.1), Math.max(0.16, C.pilas + 0.16));
    if (lp > 0) {
      var V = P.veces;
      var L = hero(ctx, env, rot(s, 'veces'), V.x, V.y, V.size, { seed: 'v04:veces', p: lp });
      env.tags.sourceTag(ctx, 'eco-3', { x: P.tag.x, y: P.tag.y, anchor: { x: V.x + 16, y: V.y + L.h - 8 }, p: lp, scale: 1.04 });
    }
    // The note pinned to the smaller pile.
    var np = beat(a0, C.nota - 0.04, C.nota + 0.1);
    if (np > 0) {
      ink.line(ctx, st.noteThread, { w: 2, profile: 'hair', seed: 'v04:hilo-nota', p: np, dot: 1.6 });
      pinnedNote(ctx, env, rot(s, 'nota'), P.note, np, 'v04:nota-china');
    }
    // Line 2: four small signs of what China leads, each as it is named.
    var keys = ['publicaciones', 'citaciones', 'patentes', 'robots'], cues = [C.l0, C.l1, C.l2, C.l3], Ld = P.leads;
    for (var i = 0; i < keys.length; i++) {
      var sp = beat(a1, cues[i] - 0.05, cues[i] + 0.08);
      if (sp <= 0) continue;
      var x = Ld.xs[i], y = Ld.y + Math.sin(s.t * 0.7 + i * 1.6) * 2.5 * calm(s);
      leadSign(ctx, env, st, i, x, y, Ld.size, sp);
      ink.text(ctx, rot(s, keys[i]), x, Ld.label.y, { size: Ld.label.size, weight: 700, align: 'center', maxWidth: Ld.label.w, lineHeight: 1.15, p: seg(sp, 0.4, 1) });
    }
  }

  // The four signs: a stack of papers, a constellation of citations, a sealed patent, a gear.
  function leadSign(ctx, env, st, i, x, y, size, p) {
    var fig = env.fig, m = env.pal.mundo, k = size / 100;
    ctx.save();
    ctx.translate(x, y);
    switch (i) {
      case 0:
        fig.sheet(ctx, -10 * k, 6 * k, 0.62 * k, { seed: 'v04:hoja0', rot: -0.22, p: p });
        fig.sheet(ctx, 0, 0, 0.62 * k, { seed: 'v04:hoja1', rot: 0.02, p: p });
        fig.sheet(ctx, 10 * k, -5 * k, 0.62 * k, { seed: 'v04:hoja2', rot: 0.2, p: p });
        break;
      case 1:
        fig.sign(ctx, 'constelacion', 0, 0, size * 1.05, { seed: 'v04:citas', colors: { a: m.amarillo }, p: p });
        break;
      case 2:
        fig.sheet(ctx, -4 * k, 0, 0.66 * k, { seed: 'v04:patente', rot: -0.06, p: p });
        env.ink.draw(ctx, st.seal, 14 * k, 18 * k, k, { p: seg(p, 0.4, 1) });
        break;
      default:
        env.ink.draw(ctx, st.gear, 0, 0, k, { p: p, rot: 0.2 });
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · cadena — over the valley, four linked stations «Capital → Cómputo → Modelos → Productos»
  // draw on as they are named; the reservoir's single gate lets the coins out one by one.

  var CADENA = {
    y: 98, xs: [196, 492, 788, 1084], r: 50,
    label: { y: 152, size: 27 },
    queue: [[1060, 470], [1078, 452], [1084, 488], [1098, 468], [1040, 452], [1036, 488]]
  };

  function cadena(ctx, s, env) {
    var C = cuesOf(s, 'cadena'), st = s.state.capital, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    ink.draw(ctx, st.river, 0, 0, 1, { offset: 3 });
    coinFlow(ctx, s, env, st.path, { n: 11, k: CAPITAL.coinK, speed: 0.017 });
    // Coins crowd at the one gate and leave through it one at a time.
    var a0 = s.at(0), narrow = seg(s.t, lineT(s, 0, 0.9), lineT(s, 0, 0.9) + 1.6);
    for (var i = 0; i < CADENA.queue.length; i++) {
      var qp = CADENA.queue[i], pool = VALLE.poolCoins[i % VALLE.poolCoins.length];
      var qx = lerp(pool[0], qp[0], inOut3(narrow)) + Math.sin(s.t * 1.1 + i) * 1.6, qy = lerp(pool[1], qp[1], inOut3(narrow));
      env.fig.coin(ctx, qx, qy, CAPITAL.coinK * 0.86, { seed: 'v04:moneda' + (i % 3) });
    }
    var gu = (s.t / 1.8) % 1, ga = Math.min(1, gu * 6, (1 - gu) * 6);
    ctx.save();
    ctx.globalAlpha *= ga;
    env.fig.coin(ctx, lerp(VALLE.gate[0] - 4, 1300, gu), 488, CAPITAL.coinK * 0.56, { seed: 'v04:moneda-compuerta' });
    ctx.restore();
    if (narrow > 0) ink.line(ctx, st.gateRing, { w: 3.4, profile: 'swell', seed: 'v04:anillo-compuerta', p: narrow, color: m.rojo });

    // The chain of stations, each as it is named, linked by arrows.
    var names = rot(s, 'cadena').split('→').map(function (x) { return x.trim(); });
    var cues = [C.s0, C.s1, C.s2, C.s3];
    for (var k = 0; k < CADENA.xs.length && k < names.length; k++) {
      var sp = beat(a0, cues[k] - 0.06, cues[k] + 0.06);
      if (sp <= 0) continue;
      var x = CADENA.xs[k], y = CADENA.y;
      if (k > 0) ink.arrow(ctx, st.chainArrows[k - 1], { w: 3.4, headSize: 14, seed: 'v04:cadena' + k, p: sp });
      ink.circle(ctx, x, y, CADENA.r, { fill: m.lienzo, w: 4, seed: 'v04:estacion' + k, p: sp });
      stationSign(ctx, s, env, st, k, x, y, seg(sp, 0.3, 1));
      ink.text(ctx, names[k], x, CADENA.label.y, { size: CADENA.label.size, weight: 700, align: 'center', p: seg(sp, 0.5, 1) });
    }
  }

  // What each station holds: a coin; identical ruled cells; identical lamps; a warm parcel.
  function stationSign(ctx, s, env, st, k, x, y, p) {
    if (p <= 0) return;
    var ink = env.ink, q = env.pal.maquina;
    ctx.save();
    ctx.globalAlpha *= p;
    switch (k) {
      case 0:
        env.fig.coin(ctx, x, y, 0.9, { seed: 'v04:moneda-estacion' });
        break;
      case 1:
        ink.rRect(ctx, x - 34, y - 26, 68, 52, { fill: q.noche, color: q.linea, w: 1.3 });
        for (var c = 0; c < 4; c++) for (var r = 0; r < 3; r++) ink.rRect(ctx, x - 28 + c * 14, y - 20 + r * 14, 11, 11, { color: q.linea, w: 1, fill: q.rejilla });
        break;
      case 2:
        env.fig.lamps(ctx, x, y, 0.26, { n: 3, gap: 112, t: s.t });
        break;
      default:
        ink.draw(ctx, st.parcel, x, y, 1, {});
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · costo-oculto — a ruled navy panel with three identical blocks of compute cells; in each,
  // only the slice of the final training run lights up, exactly 9,6%, 22,6% and 12,3% of the block
  // (parsed from the rótulos); the rest is experiments, data, evaluations and iterations.

  var COSTO = {
    panel: { x: 56, y: 54, w: 940, h: 486 },
    keys: ['openai', 'minimax', 'zai'],
    label: { x: 88, size: 25, w: 280 },
    block: { x: 392, cols: 35, rows: 4, cell: 16 },  // 560 × 64 px: every block the same size
    rows: [172, 290, 408],
    corrida: { x: 392, y: 104, size: 22 },
    resto: { y: 494, size: 21 },
    tag: { x: 1012, y: 144 }
  };

  function costoOculto(ctx, s, env) {
    var C = cuesOf(s, 'costo-oculto'), st = s.state.costo, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    var P = COSTO.panel, B = COSTO.block, bw = B.cols * B.cell, bh = B.rows * B.cell;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1150, 470, 40], ['espiral', 1196, 62, 36]], out3(s.intro));
    // The panel slides in under a ruler (revealed top to bottom).
    var pr = inOut3(s.intro);
    if (pr > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(P.x - 2, P.y - 2, P.w + 4, (P.h + 4) * pr);
      ctx.clip();
      fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 16 });
      ctx.restore();
    }
    var a0 = s.at(0), a1 = s.at(1);
    var blocksP = beat(a0, 0.02, 0.14);
    var win = landWindow(C.cifras), corrida = beat(a0, C.corrida - 0.02, C.corrida + 0.08);
    // «corrida final de entrenamiento»: a green key above the blocks.
    if (corrida > 0) {
      ink.rRect(ctx, COSTO.corrida.x, COSTO.corrida.y + 4, 22, 22, { fill: q.brilloVerde, color: q.linea, w: 1.2, p: corrida });
      ink.text(ctx, rot(s, 'corridaFinal'), COSTO.corrida.x + 34, COSTO.corrida.y, { size: COSTO.corrida.size, weight: 700, color: m.lienzo, p: corrida });
      ink.rLine(ctx, COSTO.corrida.x + 11, COSTO.corrida.y + 30, COSTO.corrida.x + 11, COSTO.rows[0] - 6, { color: q.brilloVerde, w: 1.4, dash: [4, 4], p: corrida });
    }
    // The three blocks: identical cells; each slice grows from zero and lands exactly.
    var glowRest = beat(a1, C.barreras - 0.04, C.barreras + 0.12);
    for (var i = 0; i < COSTO.keys.length; i++) {
      var text = rot(s, COSTO.keys[i]), pv = valueWith(env.chart, text, '%');
      var y = COSTO.rows[i];
      var land = beat(a0, win[0] + (i - 2) * 0.03, win[1] + (i - 2) * 0.03);
      if (blocksP > 0) {
        ctx.save();
        ctx.globalAlpha *= blocksP;
        fig.computeBlock(ctx, B.x, y, 1, { cols: B.cols, rows: B.rows, cell: B.cell, fraction: pv ? pv.value / 100 * out3(land) : 0, p: 1 });
        ctx.restore();
        // Line 2: the rest of each block, the cost that is not seen, glows softly.
        if (glowRest > 0 && pv) {
          var lx = B.x + bw * pv.value / 100;
          ctx.save();
          ctx.globalAlpha *= 0.16 * glowRest * (0.85 + 0.15 * Math.sin(s.t * 1.4 + i));
          ctx.fillStyle = q.linea;
          ctx.fillRect(lx + 1, y, B.x + bw - lx - 1, bh);
          ctx.restore();
        }
      }
      var lp = seg(land, 0.85, 1);
      if (lp > 0) ink.text(ctx, text, COSTO.label.x, y + bh / 2 - COSTO.label.size * 0.62, { size: COSTO.label.size, weight: 700, color: m.lienzo, maxWidth: COSTO.label.w, p: lp });
    }
    var tagP = beat(a0, win[0] - 0.04, win[0] + 0.04);
    if (tagP > 0) env.tags.sourceTag(ctx, 'eco-6', { x: COSTO.tag.x, y: COSTO.tag.y, anchor: { x: B.x + bw + 2, y: COSTO.rows[0] + bh / 2 }, p: tagP, scale: 1.04 });
    // Line 2: «experimentos, datos, evaluaciones e iteraciones» under the rest of the blocks.
    var rp = beat(a1, C.resto, C.resto + 0.14);
    if (rp > 0) {
      var last = valueWith(env.chart, rot(s, COSTO.keys[2]), '%'), x0 = B.x + bw * (last ? last.value : 0) / 100;
      var yb = COSTO.rows[2] + bh + 10;
      ink.rLine(ctx, x0 + 4, yb, B.x + bw, yb, { color: m.lienzo, w: 1.6, p: rp });
      ink.rLine(ctx, x0 + 4, yb - 6, x0 + 4, yb + 2, { color: m.lienzo, w: 1.6, p: rp });
      ink.rLine(ctx, B.x + bw, yb - 6, B.x + bw, yb + 2, { color: m.lienzo, w: 1.6, p: rp });
      ink.text(ctx, rot(s, 'resto'), (x0 + B.x + bw) / 2, COSTO.resto.y, { size: COSTO.resto.size, weight: 700, color: m.lienzo, align: 'center', maxWidth: bw, p: rp });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · energia — the ruled server tower and its hand-drawn register meter reading «29,6 GW» (as in
  // lámina D6: no dial, so no invented scale or maximum); then four floating islands with exact dot
  // clusters (one shared pitch: area ∝ count), Europe's three of 2018 as hollow dots beside its 44.

  var ENERGIA = {
    tower: { x: 300, y: 548, k: 1.15 },
    meter: { x: 456, y: 104, w: 236, h: 150 },
    tag4: { x: 456, y: 278 },
    islands: [
      { key: 'europa', x: 170, color: 'celeste' }, { key: 'china', x: 482, color: 'rojo' },
      { key: 'norteamerica', x: 794, color: 'verde' }, { key: 'americaLatina', x: 1106, color: 'amarillo' }
    ],
    islandY: 258, rx: 140, ry: 106,
    pitch: 15,
    hollow: { dx: -96, dy: -62, gap: 15 },
    label: { y: 404, w: 268, size: 21 },
    caption: { y: 482, size: 23 },
    tag7: { x: 300, y: 34 }
  };

  function energia(ctx, s, env) {
    var C = cuesOf(s, 'energia'), st = s.state.energia, ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo, E = ENERGIA;
    bg(ctx, s, env, 'datos');
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    // Line 1: the tower and its meter; the group gives way to the islands when line 2 starts.
    var leave = beat(a1, 0, 0.08);
    if (leave < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - leave;
      floaters(ctx, s, env, [['sol', 820, 120, 60, m.rojo], ['estrella', 760, 470, 36]], intro);
      var T = E.tower, Mt = E.meter;
      var tw = fig.serverTower(ctx, T.x, T.y, T.k, { p: intro });
      ink.line(ctx, st.cable, { w: 3, profile: 'even', seed: 'v04:cable', p: intro });
      // The disc turns; once the rebound is said, faster (total consumption goes up).
      var tR = lineT(s, 0, C.rebote), turn = s.t * 1.1 + Math.max(0, s.t - tR) * 2.6;
      var win = landWindow(C.medidor), np = beat(a0, win[0], win[1]);
      var box = register(ctx, env, rot(s, 'medidor'), Mt, { p: intro, textP: np, seed: 'v04:medidor', size: 40, disc: true });
      meterDisc(ctx, env, Mt, turn);
      ink.draw(ctx, st.bolt, Mt.x + Mt.w - 18, Mt.y - 22, 1, { p: intro });
      if (np > 0) env.tags.sourceTag(ctx, 'eco-4', { x: E.tag4.x, y: E.tag4.y, anchor: { x: box.x + 6, y: box.y + box.h - 4 }, p: np, scale: 1.04 });
      // The rebound: the tower's glow grows with the demand.
      var rb = beat(a0, C.rebote - 0.02, C.rebote + 0.12);
      if (rb > 0) ink.glow(ctx, tw.x + tw.w / 2, tw.y + tw.h * 0.45, tw.h * 0.75, env.pal.maquina.linea, 0.22 * rb * (0.8 + 0.2 * Math.sin(s.t * 2.2)));
      ctx.restore();
    }
    if (a1 <= 0) return;
    // Line 2: the islands rise; the dots of each land by the chunk that says them.
    var winE = landWindow(C.europa), winR = landWindow(C.resto);
    var tagP = beat(a1, winE[0], winE[1]);
    for (var i = 0; i < E.islands.length; i++) {
      var I = E.islands[i], ip = beat(a1, 0.02 + i * 0.03, 0.12 + i * 0.03);
      if (ip <= 0) continue;
      var y = E.islandY + Math.sin(s.t * 0.5 + i * 1.9) * 3 * calm(s);
      ink.draw(ctx, st.islands[i], I.x, y, 1, { p: ip, colors: { a: m[I.color] } });
      var nums = valuesIn(chart, rot(s, I.key));
      var count = nums.length ? nums[0].value : 0;
      var dp = i === 0 ? beat(a1, Math.max(winE[0], C.cuarenta - 0.04), Math.max(winE[1], C.cuarenta + 0.04)) : beat(a1, winR[0] + (i - 1) * 0.02, winR[1]);
      if (dp > 0) chart.dots(ctx, { x: I.x, y: y + 4, count: count, pitch: E.pitch, color: m.tinta, p: dp, seed: 'v04:isla' + i });
      // Europe in 2018: three hollow dots (the label says it: «eran 3 en 2018»).
      if (i === 0 && nums.length > 1) {
        var hp = beat(a1, C.tres - 0.03, C.tres + 0.03);
        for (var h = 0; h < Math.round(nums[1].value) && hp > 0; h++) {
          ctx.save();
          ctx.globalAlpha *= hp;
          ctx.strokeStyle = m.tinta;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(I.x + E.hollow.dx + h * E.hollow.gap, y + E.hollow.dy, E.pitch * 0.3, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      }
      var lp = i === 0 ? seg(dp, 0.9, 1) : seg(dp, 0.9, 1);
      if (lp > 0) ink.text(ctx, rot(s, I.key), I.x, E.label.y, { size: E.label.size, weight: 700, align: 'center', maxWidth: E.label.w, lineHeight: 1.15, p: lp });
    }
    // One tag for the four counts (eco-7), tied to the first island that gets its dots.
    if (tagP > 0) env.tags.sourceTag(ctx, 'eco-7', { x: E.tag7.x, y: E.tag7.y, anchor: { x: E.islands[0].x + 92, y: E.islandY - E.ry + 22 }, p: tagP, scale: 1.04 });
    // What the dots count, written under the islands once the first cluster has landed.
    var cap = beat(a1, winE[1], winE[1] + 0.06);
    if (cap > 0) ink.text(ctx, rot(s, 'clusteres'), W / 2, E.caption.y, { size: E.caption.size, italic: true, align: 'center', p: cap });
  }

  // The register's disc seen edge-on, with a red mark going round (as in lámina D6).
  function meterDisc(ctx, env, R, turn) {
    var m = env.pal.mundo, dcx = R.x + R.w / 2, dcy = R.y + R.h - 26;
    env.ink.blob(ctx, dcx, dcy, 46, 8, { fill: m.lienzoOcre, w: 2.6, irr: 0.02, n: 14, seed: 'v04:disco' });
    if (Math.cos(turn) > 0) {
      ctx.fillStyle = m.rojo;
      ctx.beginPath();
      ctx.arc(dcx + Math.sin(turn) * 40, dcy + 2, 4, 0, TAU);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · embudo — lámina D7's funnel: four bars on one zero-based scale (chart.funnel, one call per
  // bar so each lands by its own subtitle chunk), the narrowest marked «cuello de botella» with the
  // dotted «≈» cap; the lectora looks at them; then each bar is cut apart: four questions.

  var EMBUDO = {
    cx: 430, w: 540, h: 44,
    rows: [{ key: 'uso', y: 66 }, { key: 'agentes', y: 162 }, { key: 'escala', y: 258 }, { key: 'impacto', y: 354 }],
    barDy: 34, labelSize: 22,
    tagScale: 0.86,
    neck: { size: 21, aprox: { dx: 24, dy: 4, size: 30 }, tagDx: 66 },
    lectora: { x: 1110, y: 712, k: 2.95 },
    cautela: { y: 478, size: 25, w: 820 }
  };

  function embudo(ctx, s, env) {
    var C = cuesOf(s, 'embudo'), st = s.state.embudo, ink = env.ink, chart = env.chart, m = env.pal.mundo, F = EMBUDO;
    bg(ctx, s, env, 'datos');
    var a0 = s.at(0), a1 = s.at(1), a3 = s.at(3);
    var wins = [landWindow(C.uso), landWindow(C.agentes), landWindow(C.escala), landWindow(C.impacto)];
    var ats = [a0, a0, a1, a1];
    var split = beat(a3, 0, 0.16);
    for (var i = 0; i < F.rows.length; i++) {
      var R = F.rows[i], text = rot(s, R.key), win = wins[i];
      var rp = beat(ats[i], win[0], win[1]);
      if (rp <= 0) continue;
      var pv = chart.parseValue(text), by = R.y + F.barDy;
      var neck = R.key === 'escala';
      // Line 4: each bar slides apart a little, on its own strip (a pattern, not a cohort).
      var dx = split * (i % 2 ? 12 : -12);
      ctx.save();
      ctx.translate(dx, 0);
      chart.funnel(ctx, { x: F.cx - F.w / 2, y: by, w: F.w, h: F.h, gap: 0, pitch: F.h, mark: neck, tags: false, seed: 'v04:embudo' + i,
        items: [{ text: text, valueText: '', label: '' }], p: rp >= 1 ? 1 : lerp(0.05, 0.45, rp) });
      var half = (pv ? Math.abs(pv.value) : 0) / 100 * F.w / 2, x1 = F.cx + half, x0 = F.cx - half;
      var lp = seg(rp, 0.85, 1);
      if (lp > 0) {
        ink.text(ctx, text, F.cx, R.y, { size: F.labelSize, weight: 700, align: 'center', maxWidth: 640, p: lp });
        if (neck) {
          var Ap = F.neck.aprox;
          hero(ctx, env, rot(s, 'remateAprox'), x1 + Ap.dx, by + Ap.dy, Ap.size, { seed: 'v04:aprox', p: lp });
          ink.text(ctx, rot(s, 'cuelloDeBotella'), x0 - 30, by + F.h / 2 - F.neck.size * 0.62, { size: F.neck.size, italic: true, align: 'right', p: lp });
        }
      }
      ctx.restore();
      if (lp > 0) {
        // The neck's thread leaves from under its «≈», so it never crosses the sign.
        var tx = x1 + dx + (neck ? F.neck.tagDx : 20);
        env.tags.sourceTag(ctx, (s.rotulos[R.key].cifras || [])[0], { near: { x: tx, y: by + F.h / 2, side: 'right', gap: 10 },
          anchor: neck ? { x: x1 + dx + 6, y: by + F.h + 4 } : { x: x1 + dx + 6, y: by + F.h / 2 },
          p: lp, scale: F.tagScale, scope: false });
      }
    }
    // The lectora comes to look at the bars once they have all landed (she is whole before her
    // question, and in the poster frame), puzzled, and asks.
    var lpL = out3(seg(s.t, lineT(s, 1, 0.66), lineT(s, 1, 0.94)));
    if (lpL > 0) env.fig.lectora(ctx, F.lectora.x, F.lectora.y, F.lectora.k, { pose: 'asking', facing: -1, p: lpL });
    // Line 4: cut lines between the bars, and the caution of lámina D7 under the funnel.
    if (split > 0) {
      for (var c = 0; c < st.cuts.length; c++) ink.dotted(ctx, st.cuts[c], { r: 2, gap: 10, seed: 'v04:corte' + c, p: split });
      ink.text(ctx, rot(s, 'cautela'), F.cx, F.cautela.y, { size: F.cautela.size, italic: true, align: 'center', maxWidth: F.cautela.w, p: beat(a3, 0.04, 0.2) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · puente — lámina D7's bridge over an abyss from «Uso» to «Valor», its last span still
  // scaffolding; warm figures carry planks «procesos», «liderazgo», «métricas», «transformación».
  // The small lamp sits on the «Uso» bank: access to the model is already there.

  var PUENTE = {
    horizon: 0.36,
    bridge: { x: 640, y: 394, k: 1.55 },
    built: 0.62,
    title: { x: 64, y: 30, size: 44, w: 980 },
    feet: 382, walkK: 1.2, start: 236,
    stops: [700, 616, 532, 448],
    keys: ['procesos', 'liderazgo', 'metricas', 'transformacion'],
    roles: [['directiva', 3, 'bun'], ['docente', 0, 'curly'], ['servidor', 4, 'short'], ['investigadora', 1, 'long']],
    lamp: { x: 300, y: 366, k: 0.36 }
  };

  function bridgeScene(ctx, s, env, B, built, intro) {
    env.fig.bridge(ctx, B.x, B.y, B.k, { built: built, labels: { left: rot(s, 'orillaUso'), right: rot(s, 'orillaValor') }, p: intro, seed: 'v04:puente' });
  }

  function puente(ctx, s, env) {
    var C = cuesOf(s, 'puente'), ink = env.ink, m = env.pal.mundo, P = PUENTE;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0);
    floaters(ctx, s, env, [['sol', 1170, 268, 60, m.rojo], ['pajaro', 980, 210, 58]], intro);
    bridgeScene(ctx, s, env, P.bridge, P.built, intro);
    env.fig.lamp(ctx, P.lamp.x, P.lamp.y + Math.sin(s.t * 1.2) * 1.2 * calm(s), P.lamp.k, { t: s.t, p: intro });
    // The idea of lámina D7, written on as it is said.
    ink.letter(ctx, rot(s, 'idea'), P.title.x, P.title.y, { size: P.title.size, maxWidth: P.title.w, maxLines: 2, seed: 'v04:idea-puente',
      counters: 0.3, stars: false, p: beat(a0, 0, 0.22) });
    // Four people carry the planks toward the scaffolding, each as its plank is named.
    var cues = [C.procesos, C.liderazgo, C.metricas, C.transformacion];
    for (var i = P.keys.length - 1; i >= 0; i--) {
      var t0 = lineT(s, 0, Math.max(0, cues[i] - 0.05)), t1 = t0 + 2.8;
      if (s.t < t0) continue;
      var r = P.roles[i], pp = seg(s.t, t0, t0 + 0.5);
      var who = walker(ctx, s, env, P.start, P.stops[i], P.feet, P.walkK, t0, t1, {
        role: r[0], skin: r[1], hair: r[2], seed: 'v04:carga' + i, pose: 'carrying', prop: 'plank', facing: 1, p: pp
      });
      // Labels on two staggered rows, so neighbours never overlap once everyone has arrived.
      var ly = who.y - 122 * P.walkK - (i % 2 ? 28 : 0);
      ink.text(ctx, rot(s, P.keys[i]), who.x, ly, { size: 21, weight: 700, align: 'center', p: seg(pp, 0.5, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · etapas — six stepping stones cross a wide river, «Acceso → … → Transformación», each named
  // as it is said; most small figures crowd on the second and third stones.

  var ETAPAS = {
    horizon: 0.42,
    stones: { x: 640, y: 446, k: 1.62 },
    label: { dy: 40, size: 21 },
    crowd: [[1, -50, 0], [1, -17, 1], [1, 16, 2], [1, 48, 3], [2, -32, 4], [2, 2, 5], [2, 34, 6], [0, 0, 7], [3, 0, 8]],
    personK: 0.8
  };

  function etapas(ctx, s, env) {
    var C = cuesOf(s, 'etapas'), st = s.state.etapas, ink = env.ink, fig = env.fig, m = env.pal.mundo, E = ETAPAS;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0);
    floaters(ctx, s, env, [['sol', 176, 132, 64, m.rojo], ['pajaro', 540, 176, 60], ['estrella', 830, 96, 40]], intro);
    ink.draw(ctx, st.water, 0, 0, 1, { p: intro, offset: 3 });
    for (var w = 0; w < st.waves.length; w++) {
      ctx.save();
      ctx.translate(((s.t * 9 + w * 140) % 280) - 140, 0);
      ink.line(ctx, st.waves[w], { w: 2.2, profile: 'hair', seed: 'v04:ola' + w, color: m.lienzo, alpha: 0.8 * intro });
      ctx.restore();
    }
    var names = rot(s, 'etapas').split('→').map(function (x) { return x.trim(); });
    var cues = [C.e0, C.e1, C.e2, C.e3, C.e4, C.e5];
    var stones = st.stones;
    for (var i = 0; i < stones.length; i++) {
      var sp = beat(a0, cues[i] - 0.05, cues[i] + 0.04);
      if (sp <= 0) continue;
      ink.draw(ctx, st.stoneDrawings[i], stones[i].x, stones[i].y, 1, { p: sp });
      if (i > 0) ink.arrow(ctx, st.stoneArrows[i - 1], { w: 2.6, headSize: 10, seed: 'v04:paso' + i, p: sp });
      if (names[i]) ink.text(ctx, names[i], stones[i].x, stones[i].y + E.label.dy, { size: E.label.size, weight: 700, align: 'center', p: seg(sp, 0.4, 1) });
    }
    // Most organizations are between experimenting and integrating.
    var cp = beat(a0, C.mayoria - 0.02, C.mayoria + 0.14);
    for (var k = 0; k < E.crowd.length && cp > 0; k++) {
      var c = E.crowd[k], S = stones[c[0]];
      var pk = seg(cp, k * 0.06, 0.4 + k * 0.06);
      if (pk <= 0) continue;
      fig.person(ctx, S.x + c[1], S.y - 6, E.personK, { role: 'persona', seed: 'v04:etapa' + c[2], pose: k % 3 === 0 ? 'lookingUp' : 'standing',
        facing: c[1] < 0 ? 1 : -1, p: pk });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · actualizacion — the course's notebook page; a second, separate page slides in beside it:
  // «Encuesta 2026 · otra muestra», with the «Actualización» ribbon; its figures write on, whole.
  // No arrow or line joins the pages; «No se compara directamente» stands in the gutter. The 2025
  // figures are not on screen in this scene (editions never share a page, an axis or a line).

  var ACT = {
    page1: { x: 62, y: 62, w: 500, h: 474, tilt: -0.02 },
    page2: { x: 714, y: 56, w: 512, h: 484, tilt: 0.014 },
    title: { size: 34, w: 430 },
    rows: [{ key: 'uso', y: 226 }, { key: 'escala', y: 286 }, { key: 'impacto', y: 398 }],
    rowSize: 27,
    tag: { dx: 34, y: 448 },
    gutter: { x: 638, y: 300 },
    curso: { x: 130, y: 330, size: 36, w: 392 }
  };

  function actualizacion(ctx, s, env) {
    var C = cuesOf(s, 'actualizacion'), st = s.state.act, ink = env.ink, fig = env.fig, m = env.pal.mundo, A = ACT;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['estrella', 640, 70, 34], ['luna', 650, 520, 34, m.amarillo]], intro);
    // The course's page: its session sign and our notes; then the edition the course uses.
    var P1 = A.page1;
    fig.notebookPage(ctx, P1.x, P1.y, P1.w, P1.h, { seed: 'v04:pagina-curso', tilt: P1.tilt, p: intro });
    fig.sign(ctx, 'puente', P1.x + 116, P1.y + 112, 92, { seed: 'v04:sesion3', p: intro });
    for (var n = 0; n < st.notes.length; n++) ink.line(ctx, st.notes[n], { w: 2.6, profile: 'even', seed: 'v04:apunte' + n, p: seg(intro, 0.3 + n * 0.1, 0.8 + n * 0.05) });
    var cp = beat(a1, 0, 0.1);
    if (cp > 0) letterFade(ctx, env, rot(s, 'curso'), A.curso.x, A.curso.y, { size: A.curso.size, maxWidth: A.curso.w, maxLines: 3, seed: 'v04:curso',
      counters: 0, stars: false, underline: false, p: 1 }, cp, 'curso');
    // The 2026 page slides in from the right, apart.
    var P2 = A.page2, sl = inOut3(beat(a0, 0, 0.12));
    if (sl > 0) {
      ctx.save();
      ctx.translate((1 - sl) * 620, 0);
      fig.notebookPage(ctx, P2.x, P2.y, P2.w, P2.h, { seed: 'v04:pagina-2026', tilt: P2.tilt });
      ink.letter(ctx, rot(s, 'pagina'), P2.x + 66, P2.y + 64, { size: A.title.size, maxWidth: A.title.w, maxLines: 2, seed: 'v04:encuesta-2026',
        counters: 0, stars: false, underline: false, p: seg(sl, 0.5, 1) });
      env.tags.updateRibbon(ctx, P2.x + P2.w - 168, P2.y - 14, 1.1, seg(sl, 0.6, 1));
      var winU = landWindow(C.uso), winE = landWindow(C.escala);
      var fp = [beat(a0, winU[0], winU[1]), beat(a0, winE[0], winE[1]), beat(a0, winE[0] + 0.03, winE[1] + 0.03)];
      for (var i = 0; i < A.rows.length; i++) {
        if (fp[i] > 0) ink.text(ctx, rot(s, A.rows[i].key), P2.x + 66, A.rows[i].y, { size: A.rowSize, weight: 700, maxWidth: 420, lineHeight: 1.16, p: fp[i] });
      }
      // One tag for the page's three figures (adop-7), under them; its thread runs up the margin
      // to the first figure, left of the column, so it never crosses a line of text.
      if (fp[0] > 0) {
        env.tags.sourceTag(ctx, 'adop-7', { x: P2.x + A.tag.dx, y: A.tag.y, anchor: { x: P2.x + 54, y: A.rows[0].y + 16 }, p: fp[0], scale: 1.0 });
      }
      ctx.restore();
    }
    // «No se compara directamente», standing in the gutter between the two pages.
    var gp = beat(a1, C.series - 0.02, C.series + 0.1);
    if (gp > 0) {
      ctx.save();
      ctx.translate(A.gutter.x, A.gutter.y);
      ctx.rotate(-Math.PI / 2);
      ink.text(ctx, rot(s, 'nota'), 0, -14, { size: 24, italic: true, weight: 700, align: 'center', maxWidth: 440, p: gp });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · productividad — lámina D8's balance; on its left pan three weights write on, their heights
  // on one shared zero-based scale (the 14–15% range as a band); a separate card for the field
  // experiment.

  var BAL = { x: 560, y: 560, k: 1.55 };            // foot of the balance post
  var PROD = {
    weights: [{ key: 'soporte', dx: -52, color: 'rojo' }, { key: 'software', dx: 0, color: 'azul' }, { key: 'marketing', dx: 52, color: 'amarillo' }],
    ww: 36, px: 1.7,                                  // px per percentage point, shared by the three weights
    labels: { y0: 60, dy: 44, size: 24 },
    tag: { x: 252, y: 404 },
    card: { x: 884, y: 62, w: 356, h: 156 },
    tag2: { x: 894, y: 236 },
    dev: { x: 1176, y: 610, k: 1.9 }
  };

  // The balance (fig.balance) and its pans in screen coordinates.
  function balance(ctx, env, x, p) {
    var a = env.fig.balance(ctx, x, BAL.y, BAL.k, { tilt: 0, p: p, seed: 'v04:balanza' });
    return a;
  }

  // The three weights of the left pan: honest bars on one scale, standing on the pan. vals are the
  // values parsed from the rótulos of productividad (setup keeps them for metr, where the weights
  // stay faint and unlabeled); rp is each weight's growth, alpha their opacity.
  function weights(ctx, env, pan, vals, rp, alpha) {
    var chart = env.chart, m = env.pal.mundo, out = [];
    var sc = chart.scale(1, 0, PROD.px);
    for (var i = 0; i < PROD.weights.length; i++) {
      var Wt = PROD.weights[i], pv = vals[i];
      var x = pan.x + Wt.dx - PROD.ww / 2, p = rp[i];
      out.push({ x: x + PROD.ww / 2, top: pan.y - (pv ? pv.value : 0) * PROD.px, lo: pv && pv.lo != null ? pan.y - pv.lo * PROD.px : null });
      if (!pv || p <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= alpha;
      var lo = pv.lo != null ? pv.lo : pv.value;
      chart.bar(ctx, { value: lo, scale: sc, x: x, baseY: pan.y, h: PROD.ww, orient: 'v', color: m[Wt.color], labels: false, seed: 'v04:pesa' + i, p: p });
      if (pv.lo != null && p >= 1) {
        // The range: a band from its low end to its high end, with end ticks.
        var y0 = pan.y - pv.lo * PROD.px, y1 = pan.y - pv.value * PROD.px;
        ctx.fillStyle = env.pal.rgba(m[Wt.color], 0.45);
        ctx.fillRect(x + 3, y1, PROD.ww - 6, y0 - y1);
        ctx.strokeStyle = m.tinta;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x - 4, y1); ctx.lineTo(x + PROD.ww + 4, y1);
        ctx.stroke();
      }
      ctx.restore();
    }
    return out;
  }

  function productividad(ctx, s, env) {
    var C = cuesOf(s, 'productividad'), st = s.state.prod, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['estrella', 820, 470, 36], ['espiral', 1180, 470, 36]], intro);
    var bal = balance(ctx, env, BAL.x, intro);
    var pan = bal.leftPan;
    // The weights land by their chunks: 14–15% first, then 26% and 50% together.
    var wS = landWindow(C.soporte), wW = landWindow(C.software);
    var rp = [beat(a0, wS[0], wS[1]), beat(a0, wW[0], wW[1]), beat(a0, wW[0] + 0.03, wW[1] + 0.03)];
    var vals = PROD.weights.map(function (Wt) { return env.chart.parseValue(rot(s, Wt.key)); });
    var tops = weights(ctx, env, pan, vals, rp, 1);
    // Labels in a staircase above the weights, each with a dotted leader down to its weight.
    var L0 = null;
    for (var i = 0; i < PROD.weights.length; i++) {
      var lp = seg(rp[i], 0.85, 1);
      if (lp <= 0) continue;
      var lx = tops[i].x - PROD.ww / 2, ly = PROD.labels.y0 + i * PROD.labels.dy;
      var Lb = ink.text(ctx, rot(s, PROD.weights[i].key), lx, ly, { size: PROD.labels.size, weight: 700, p: lp });
      if (i === 0) L0 = Lb;
      ink.dotted(ctx, st.leaders[i], { r: 1.7, gap: 8, seed: 'v04:guia-pesa' + i, p: lp });
    }
    // One tag for the three weights (prod-1), under the pan; its thread rises to the first weight.
    var tp = seg(rp[0], 0.85, 1);
    if (tp > 0) env.tags.sourceTag(ctx, 'prod-1', { x: PROD.tag.x, y: PROD.tag.y, anchor: { x: tops[0].x - PROD.ww / 2 + 2, y: pan.y - 4 }, p: tp, scale: 1.04 });
    // «Es real, pero heterogénea»: the weights differ — the beam stays level, the evidence varies.
    // Line 2: the field experiment, on a separate card with a warm developer beside it.
    var cp = beat(a1, 0, 0.1);
    if (cp > 0) {
      var K = PROD.card;
      ink.card(ctx, K.x, K.y, K.w, K.h, { seed: 'v04:experimento', weight: 4, radius: 12, p: cp });
      var win = landWindow(C.experimento), np = beat(a1, win[0], win[1] + 0.04);
      var Lc = ink.text(ctx, rot(s, 'experimento'), K.x + 24, K.y + 24, { size: 24, weight: 700, maxWidth: K.w - 48, lineHeight: 1.18, p: np });
      if (np > 0) env.tags.sourceTag(ctx, 'prod-2', { x: PROD.tag2.x, y: PROD.tag2.y, anchor: { x: K.x + 30, y: K.y + 24 + Lc.h - 6 }, p: np, scale: 1.04 });
      env.fig.person(ctx, PROD.dev.x, PROD.dev.y, PROD.dev.k, { role: 'desarrollador', pose: 'reading', prop: 'laptop', seed: 'v04:dev', hair: 'curly', skin: 1, facing: -1,
        p: seg(cp, 0.2, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · metr — the camera follows the beam to the other pan: an hourglass «Desarrolladores
  // experimentados: +19% de tiempo» with the pinned note «METR lo marca hoy como desactualizado»;
  // then a separate card for the February 2026 follow-up: the interval from −38% to +9%, its point
  // at −18% and the zero line crossing it, «No concluyente». The left pan keeps its weights, faint
  // and unlabeled (their numbers belong to the previous scene).

  var METR = {
    from: BAL.x, to: 400,
    hourglassK: 0.46,
    label: { x: 548, y: 42, size: 25, w: 520 },
    tag3: { x: 556, y: 122 },
    note: { x: 990, y: 146, w: 250, h: 104 },
    card: { x: 700, y: 268, w: 540, h: 282 },
    domain: [-50, 20], line: { x: 812, len: 400, y: 440 },
    tag4: { x: 1022, y: 280 },
    lectora: { x: 126, y: 704, k: 2.9 }
  };

  function metr(ctx, s, env) {
    var C = cuesOf(s, 'metr'), ink = env.ink, chart = env.chart, m = env.pal.mundo, M = METR;
    bg(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), a2 = s.at(2);
    var bx = lerp(M.from, M.to, inOut3(seg(s.t, 0.2, 1.6)));
    var bal = balance(ctx, env, bx, 1);
    weights(ctx, env, bal.leftPan, s.state.prod.values, [1, 1, 1], 0.3);
    // The hourglass on the other pan: its sand runs slowly through the scene.
    var hp = beat(a0, 0, 0.08), rp = bal.rightPan, hk = M.hourglassK;
    if (hp > 0) {
      var level = 0.86 - 0.6 * clamp01(s.t / s.dur);
      env.fig.hourglass(ctx, rp.x, rp.y - 100 * hk, hk, { level: level, p: hp, seed: 'v04:reloj' });
    }
    var win = landWindow(C.ensayo), np = beat(a0, win[0], win[1]);
    if (np > 0) {
      var Lb = ink.text(ctx, rot(s, 'ensayo'), M.label.x, M.label.y, { size: M.label.size, weight: 700, maxWidth: M.label.w, lineHeight: 1.15, p: np });
      env.tags.sourceTag(ctx, 'prod-3', { x: M.tag3.x, y: M.tag3.y, anchor: { x: M.label.x + 8, y: M.label.y + Lb.h - 6 }, p: np, scale: 1.0 });
    }
    // Line 2: METR's own note, then the follow-up on a separate card.
    var nt = beat(a1, 0, 0.1);
    if (nt > 0) pinnedNote(ctx, env, rot(s, 'nota'), M.note, nt, 'v04:nota-metr');
    var cp = beat(a1, C.seguimiento - 0.03, C.seguimiento + 0.06);
    if (cp > 0) {
      var K = M.card;
      ink.card(ctx, K.x, K.y, K.w, K.h, { seed: 'v04:seguimiento', weight: 4, radius: 12, p: cp });
      ink.text(ctx, rot(s, 'seguimientoTitulo'), K.x + 26, K.y + 22, { size: 25, weight: 700, p: seg(cp, 0.3, 1) });
      var wi = landWindow(C.intervalo), ip = beat(a1, wi[0], wi[1] + 0.04);
      if (ip > 0) {
        ink.text(ctx, rot(s, 'seguimientoFecha'), K.x + 26, K.y + 56, { size: 21, italic: true, p: ip });
        var lo = chart.parseValue(rot(s, 'intervaloBajo')), hi = chart.parseValue(rot(s, 'intervaloAlto')), pt = chart.parseValue(rot(s, 'intervaloPunto'));
        var sc = chart.linear(M.domain[0], M.domain[1], M.line.x, M.line.x + M.line.len);
        var g = chart.interval(ctx, { lo: lo.value, hi: hi.value, point: pt.value, scale: sc, y: M.line.y, p: ip,
          labels: { lo: rot(s, 'intervaloBajo'), hi: rot(s, 'intervaloAlto'), point: rot(s, 'intervaloPunto') } });
        var lp = seg(ip, 0.9, 1);
        if (lp > 0) {
          ink.text(ctx, rot(s, 'intervaloNombre'), g.lo - 22, M.line.y - 12, { size: 19, italic: true, align: 'right', p: lp });
          ink.letter(ctx, rot(s, 'seguimiento'), K.x + K.w - 30, K.y + K.h - 58, { size: 34, align: 'right', seed: 'v04:no-concluyente', counters: 0.3, stars: false, p: lp });
        }
        env.tags.sourceTag(ctx, 'prod-4', { x: M.tag4.x, y: M.tag4.y, anchor: { x: g.point + 4, y: M.line.y - 10 }, p: ip, scale: 0.9 });
      }
    }
    // Line 3: the lectora concludes.
    var lq = out3(beat(a2, 0, 0.3));
    if (lq > 0) env.fig.lectora(ctx, M.lectora.x, M.lectora.y, M.lectora.k, { pose: 'writing', facing: 1, p: lq });
  }

  // ---------------------------------------------------------------------------------------------
  // 12 · pwc — two warm industry towers grow side by side on one zero-based scale, exactly 27,0 :
  // 8,5 («Ingreso por empleado 2018–2024» under their baseline); a coin «Prima salarial media por
  // habilidades de IA: 56% (2024)»; then a separate small card with the «Actualización» ribbon,
  // not joined to the coin: «Barómetro 2026: prima de 62%».

  var PWC = {
    base: 482, px: 11,                                // px per percentage point, shared by both towers
    towers: [{ key: 'masExpuestas', x: 150, color: 'tierra', label: { x: 140, w: 280 } }, { key: 'menosExpuestas', x: 304, color: 'siena', label: { x: 296, w: 210 } }],
    tw: 112,
    eje: { x: 140, y: 494, size: 21 },
    tag5: { x: 470, y: 392 },
    coin: { x: 660, y: 196, k: 2.1 },
    prima: { x: 742, y: 150, w: 360, size: 24 },
    tag6: { x: 742, y: 252 },
    card: { x: 876, y: 358, w: 350, h: 104 },
    tag7: { x: 886, y: 476 },
    lectora: { x: 770, y: 706, k: 2.5 }
  };

  function pwc(ctx, s, env) {
    var C = cuesOf(s, 'pwc'), st = s.state.pwc, ink = env.ink, chart = env.chart, m = env.pal.mundo, P = PWC;
    bg(ctx, s, env, 'datos');
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1), a2 = s.at(2);
    floaters(ctx, s, env, [['estrella', 560, 90, 34], ['sol', 1180, 76, 56, m.rojo]], intro);
    var win = landWindow(C.torres), tp = beat(a0, win[0] - 0.06, win[1]);
    var sc = chart.scale(1, 0, P.px);
    // The shared baseline and the scope of both values.
    var bp = beat(a0, 0, 0.08);
    if (bp > 0) ink.line(ctx, st.baseline, { w: 3.4, profile: 'even', seed: 'v04:base-pwc', p: bp });
    var tops = [];
    for (var i = 0; i < P.towers.length; i++) {
      var T = P.towers[i], pv = valueWith(chart, rot(s, T.key), '%');
      var v = pv ? pv.value : 0, top = P.base - v * P.px;
      tops.push(top);
      if (tp <= 0) continue;
      var g = chart.bar(ctx, { value: v, scale: sc, x: T.x, baseY: P.base, h: P.tw, orient: 'v', color: m[T.color], labels: false, seed: 'v04:torre' + i, p: tp });
      towerWindows(ctx, env, T.x, P.base, P.tw, g.y0, i);
      var lp = seg(tp, 0.9, 1);
      if (lp > 0) {
        var to = { size: 23, weight: 700, maxWidth: T.label.w, lineHeight: 1.12 };
        var L = ink.measureText(ctx, rot(s, T.key), to);
        to.p = lp;
        ink.text(ctx, rot(s, T.key), T.label.x, top - 14 - L.h, to);
      }
    }
    var lp2 = seg(tp, 0.9, 1);
    if (lp2 > 0) {
      ink.text(ctx, rot(s, 'ejeIngreso'), P.eje.x, P.eje.y, { size: P.eje.size, italic: true, p: lp2 });
      env.tags.sourceTag(ctx, 'prod-5', { x: P.tag5.x, y: P.tag5.y, anchor: { x: P.towers[1].x + P.tw + 4, y: tops[1] + 10 }, p: lp2, scale: 1.04 });
    }
    // The coin of the wage premium (a sign, not a measure).
    var winP = landWindow(C.prima), pp = beat(a0, winP[0] - 0.04, winP[1]);
    if (pp > 0) {
      var Cn = P.coin;
      ink.glow(ctx, Cn.x, Cn.y, 120, m.amarillo, 0.5 * pp);
      env.fig.coin(ctx, Cn.x, Cn.y + Math.sin(s.t * 0.8) * 2 * calm(s), Cn.k, { seed: 'v04:prima', p: pp });
      var npp = seg(pp, 0.7, 1);
      var Lp = ink.text(ctx, rot(s, 'prima'), P.prima.x, P.prima.y, { size: P.prima.size, weight: 700, maxWidth: P.prima.w, lineHeight: 1.15, p: npp });
      if (npp > 0) env.tags.sourceTag(ctx, 'prod-6', { x: P.tag6.x, y: P.tag6.y, anchor: { x: P.prima.x + 10, y: P.prima.y + Lp.h - 6 }, p: npp, scale: 1.04 });
    }
    // Line 2: the 2026 barometer, on its own card with the ribbon; nothing joins it to the coin.
    var winB = landWindow(C.barometro), cb = beat(a1, winB[0] - 0.04, winB[1]);
    if (cb > 0) {
      var K = P.card;
      ink.card(ctx, K.x, K.y, K.w, K.h, { seed: 'v04:barometro', weight: 3.6, radius: 10, p: cb });
      env.tags.updateRibbon(ctx, K.x + K.w - 164, K.y - 14, 1.0, seg(cb, 0.4, 1));
      var nb = seg(cb, 0.6, 1);
      var Lb2 = ink.text(ctx, rot(s, 'barometro'), K.x + 22, K.y + 28, { size: 25, weight: 700, maxWidth: K.w - 44, lineHeight: 1.15, p: nb });
      if (nb > 0) env.tags.sourceTag(ctx, 'prod-7', { x: P.tag7.x, y: P.tag7.y, anchor: { x: K.x + 28, y: K.y + 28 + Lb2.h - 6 }, p: nb, scale: 0.96 });
    }
    // Line 3: the lectora asks.
    var lq = out3(beat(a2, 0, 0.3));
    if (lq > 0) env.fig.lectora(ctx, P.lectora.x, P.lectora.y, P.lectora.k, { pose: 'asking', facing: -1, p: lq });
  }

  // Windows on a tower, below its exact top edge (they never reach the value-carrying edge).
  function towerWindows(ctx, env, x, base, w, top, i) {
    var m = env.pal.mundo, rows = Math.floor((base - top - 18) / 30);
    ctx.save();
    ctx.fillStyle = env.pal.rgba(m.lienzo, 0.85);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < 3; c++) {
        var wx = x + 16 + c * ((w - 32) / 3), wy = base - 30 - r * 30;
        ctx.fillRect(wx + 2, wy, (w - 32) / 3 - 10, 15);
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 13 · causalidad — lámina D8's diagram in the warm style: a biomorphic cloud «Capital, datos,
  // gestión» sends two solid arrows to «Exposición a IA» and «Ingreso por empleado»; between those
  // only a dotted line, «asociación»; the stamp of warning 4 presses on its words (this scene draws
  // it: drawsWarnings below); then what attributing causality needs.

  var CAUSA = {
    cloud: { x: 640, y: 150, rx: 230, ry: 86, size: 32 },
    left: { x: 140, y: 296, w: 320, h: 78 }, right: { x: 820, y: 296, w: 320, h: 78 },
    stamp: { x: 1120, y: 140, size: 236 },
    assoc: { y: 356, size: 26 },
    methods: { x: [210, 680], y: [430, 482], size: 24, keys: ['adopciones', 'experimentos', 'discontinuidades', 'instrumentos'] }
  };

  function causalidad(ctx, s, env) {
    var C = cuesOf(s, 'causalidad'), st = s.state.causa, ink = env.ink, m = env.pal.mundo, K = CAUSA;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['dos-pajaros', 150, 120, 80], ['estrella', 1180, 470, 36]], intro);
    // The common cause, then its two solid arrows and the two effects.
    var cp = beat(a0, 0, 0.12);
    if (cp > 0) {
      ink.blob(ctx, K.cloud.x, K.cloud.y, K.cloud.rx, K.cloud.ry, { fill: m.celeste, w: 4, seed: 'v04:nube', irr: 0.14, n: 11, p: cp });
      ink.text(ctx, rot(s, 'nube'), K.cloud.x, K.cloud.y - K.cloud.size * 0.6, { size: K.cloud.size, weight: 700, align: 'center', maxWidth: K.cloud.rx * 1.6, p: seg(cp, 0.5, 1) });
    }
    var boxes = [[K.left, 'exposicion'], [K.right, 'ingreso']];
    for (var i = 0; i < 2; i++) {
      var ep = beat(a0, 0.12 + i * 0.14, 0.3 + i * 0.14);
      if (ep <= 0) continue;
      ink.arrow(ctx, st.arrows[i], { w: 4.4, headSize: 18, seed: 'v04:causa' + i, p: ep });
      var B = boxes[i][0];
      ink.card(ctx, B.x, B.y, B.w, B.h, { seed: 'v04:efecto' + i, weight: 3.6, p: ep, peek: i ? m.amarillo : m.rojo, peekCorner: i ? 'br' : 'bl' });
      ink.text(ctx, rot(s, boxes[i][1]), B.x + B.w / 2, B.y + B.h / 2 - 16, { size: 26, weight: 700, align: 'center', maxWidth: B.w - 30, p: seg(ep, 0.5, 1) });
    }
    // Between the two effects only a dotted line: «asociación».
    var dp = beat(a0, C.datos - 0.02, C.datos + 0.12);
    if (dp > 0) {
      ink.dotted(ctx, st.assoc, { r: 3, gap: 12, seed: 'v04:asociacion', p: dp });
      ink.text(ctx, rot(s, 'asociacion'), K.cloud.x, K.assoc.y, { size: K.assoc.size, italic: true, align: 'center', p: seg(dp, 0.5, 1) });
    }
    // Warning 4 presses on the words that name it, and stays.
    var press = beat(a0, C.sello - 0.02, C.sello + 0.16);
    if (press > 0) env.tags.warningStamp(ctx, 4, K.stamp.x, K.stamp.y, K.stamp.size, press);
    // Line 2: what attributing causality needs, ticked off as it is said.
    var Mm = K.methods, cues = [C.m0, C.m1, C.m2, C.m3];
    for (var k = 0; k < Mm.keys.length; k++) {
      var mp = beat(a1, cues[k] - 0.04, cues[k] + 0.08);
      if (mp <= 0) continue;
      var x = Mm.x[k % 2], y = Mm.y[Math.floor(k / 2)];
      ink.shape(ctx, st.boxes[k], { fill: false, w: 2.6, seed: 'v04:casilla' + k, p: mp });
      ink.line(ctx, st.ticks[k], { w: 3.2, profile: 'lift', seed: 'v04:visto' + k, p: seg(mp, 0.5, 1), color: m.tinta });
      ink.text(ctx, rot(s, Mm.keys[k]), x + 40, y - 2, { size: Mm.size, weight: 700, p: seg(mp, 0.3, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 14 · intencion — a directiva with a spyglass; small lamps on the horizon (the agents); a
  // calendar strip of 24 months with the band from month 12 to 18; three thought bubbles with the
  // expectations; the chip «Expectativa» when the line says it.

  var INT = {
    horizon: 0.46,
    directiva: { x: 168, y: 578, k: 2.75 },
    lamps: { x: 700, y: 312, gap: 104, n: 5, k: 0.3 },
    strip: { x: 330, y: 474, cell: 24, h: 48, months: 24 },
    plazo: { y: 414 },
    bubbles: [{ key: 'integrar', x: 330, y: 52, w: 290, h: 132 }, { key: 'especialistas', x: 650, y: 40, w: 290, h: 140 },
      { key: 'gestores', x: 970, y: 64, w: 290, h: 150 }],
    chip: { x: 64, y: 40, size: 26 },
    tag: { x: 936, y: 456 }
  };

  function intencion(ctx, s, env) {
    var C = cuesOf(s, 'intencion'), st = s.state.intencion, ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo, I = INT;
    bg(ctx, s, env);
    var a = s.at(0), intro = out3(s.intro);
    var D = I.directiva;
    fig.person(ctx, D.x, D.y, D.k, { role: 'directiva', pose: 'pointing', prop: 'spyglass', seed: 'v04:directiva', skin: 2, hair: 'bun', height: 1, p: intro });
    ink.dotted(ctx, st.sight, { r: 2.2, gap: 14, p: seg(a, 0.02, 0.12), seed: 'v04:mirada' });
    for (var i = 0; i < I.lamps.n; i++) {
      var lpi = seg(a, 0.04 + i * 0.02, 0.1 + i * 0.02);
      if (lpi > 0) fig.lamp(ctx, I.lamps.x + i * I.lamps.gap, I.lamps.y + Math.sin(s.t * 0.8 + i) * 1.5, I.lamps.k, { t: s.t + i, p: lpi });
    }
    // The calendar strip: 24 months from now; the band 12–18 grows from its start when it is said.
    var winI = landWindow(C.integrar), S = I.strip, len = S.cell * S.months, sp = beat(a, winI[0] - 0.08, winI[0]);
    if (sp > 0) {
      ink.card(ctx, S.x - 12, S.y - 12, len + 24, S.h + 24, { seed: 'v04:calendario', weight: 3.4, radius: 10, p: sp });
      for (i = 0; i < st.ticks.length; i++) ink.line(ctx, st.ticks[i], { w: i % 6 === 0 ? 2.4 : 1.6, profile: 'even', seed: 'v04:mes' + i, p: seg(sp, 0.3 + i * 0.02, 0.5 + i * 0.02) });
      var pv = chart.parseValue(rot(s, 'plazo')), sc = chart.scale(S.months, S.x, len);
      chart.band(ctx, { lo: pv.lo, hi: pv.value, scale: sc, y: S.y + 4, h: S.h - 8, color: m.rojo, zeroLine: false, p: beat(a, winI[0], winI[1]) });
      var lab = beat(a, winI[1], winI[1] + 0.04);
      if (lab > 0) {
        ink.text(ctx, rot(s, 'plazo'), sc((pv.lo + pv.value) / 2), I.plazo.y, { size: 36, weight: 700, align: 'center', p: lab });
        env.tags.sourceTag(ctx, 'adop-8', { x: I.tag.x, y: I.tag.y, anchor: { x: sc(pv.value), y: S.y + S.h / 2 }, p: lab, scale: 1.04 });
      }
    }
    // Thought bubbles: the expectations, each whole by its chunk.
    var winC = landWindow(C.contratar);
    var bp = [beat(a, winI[0], winI[1] + 0.03), beat(a, winC[0], winC[1]), beat(a, winC[0] + 0.03, winC[1] + 0.03)];
    for (var b = 0; b < I.bubbles.length; b++) {
      if (bp[b] <= 0) continue;
      var Bb = I.bubbles[b], fy = Math.sin(s.t * 0.6 + b * 2) * 2 * calm(s);
      var inner = fig.bubble(ctx, Bb.x, Bb.y + fy, Bb.w, Bb.h, { thought: true, tail: { x: Bb.x + 30 - b * 10, y: Bb.y + Bb.h + 46 }, seed: 'v04:burbuja' + b, p: bp[b] });
      var to = { size: 23, weight: 700, align: 'center', maxWidth: inner.w + 24, lineHeight: 1.15 };
      var L = ink.measureText(ctx, rot(s, Bb.key), to);
      to.p = seg(bp[b], 0.5, 1);
      ink.text(ctx, rot(s, Bb.key), Bb.x + Bb.w / 2, Bb.y + fy + (Bb.h - L.h) / 2, to);
    }
    // «Son expectativas, no impacto realizado»: the chip of the type.
    var chp = beat(a, C.expectativas - 0.02, C.expectativas + 0.06);
    if (chp > 0) env.tags.chip(ctx, 'expectativa', rot(s, 'chip'), { x: I.chip.x, y: I.chip.y, size: I.chip.size, pill: true, p: chp });
  }

  // ---------------------------------------------------------------------------------------------
  // 15 · linea-base — the notebook table of the session's activity (KB §6): four rows and four
  // columns, all empty; the question's three words are circled as they are said; a pencil waits;
  // then the row of total cost takes a flat yellow field: everything counts in it.

  var LB = {
    page: { x: 46, y: 40, w: 846, h: 516 },
    x0: 98, c0: 232, cw: 132, y0: 100, hh: 62, rh: 84,
    rows: ['filaTiempo', 'filaCalidad', 'filaCosto', 'filaRiesgo'],
    cols: ['colLineaBase', 'colMeta', 'colComoSeMide', 'colQuienVerifica'],
    size: 20,
    pencil: { x: 1000, y: 470, size: 130 }
  };

  function lineaBase(ctx, s, env) {
    var C = cuesOf(s, 'linea-base'), st = s.state.lineaBase, ink = env.ink, fig = env.fig, m = env.pal.mundo, T = LB;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['sol', 1150, 112, 56, m.rojo], ['estrella', 1180, 520, 36]], intro);
    fig.notebookPage(ctx, T.page.x, T.page.y, T.page.w, T.page.h, { seed: 'v04:pagina-tabla', p: intro });
    // Line 2: the row of total cost takes a flat yellow field (behind its lines and words).
    var cost = beat(a1, 0, 0.12);
    if (cost > 0) ink.shape(ctx, st.costRow, { fill: m.amarillo, line: false, poly: true, fillAlpha: 0.55, seed: 'v04:fila-costo', p: cost });
    var tp = beat(a0, 0, 0.2);
    for (var i = 0; i < st.grid.length; i++) ink.line(ctx, st.grid[i], { w: i < 2 ? 3 : 2.2, profile: 'even', seed: 'v04:tabla' + i, p: seg(tp, i * 0.04, 0.4 + i * 0.04) });
    var wp = beat(a0, 0.08, 0.26);
    for (var c = 0; c < T.cols.length; c++) {
      ink.text(ctx, rot(s, T.cols[c]), T.x0 + T.c0 + (c + 0.5) * T.cw, T.y0 + 10, { size: T.size, weight: 700, align: 'center', maxWidth: T.cw - 12, lineHeight: 1.1,
        p: seg(wp, c * 0.1, 0.5 + c * 0.1) });
    }
    for (var r = 0; r < T.rows.length; r++) {
      var ry = T.y0 + T.hh + r * T.rh;
      var L = ink.measureText(ctx, rot(s, T.rows[r]), { size: T.size, weight: 700, maxWidth: T.c0 - 26, lineHeight: 1.12 });
      ink.text(ctx, rot(s, T.rows[r]), T.x0 + 12, ry + (T.rh - L.h) / 2, { size: T.size, weight: 700, maxWidth: T.c0 - 26, lineHeight: 1.12, p: seg(wp, 0.2 + r * 0.1, 0.6 + r * 0.1) });
    }
    // The question: «línea base», «costo total», «quién verifica» circled as they are said.
    var circles = [C.base, C.costo, C.verifica];
    for (var k = 0; k < circles.length; k++) {
      var cpk = beat(a0, circles[k] - 0.02, circles[k] + 0.08);
      if (cpk > 0) ink.line(ctx, st.loops[k], { w: 3.4, profile: 'swell', seed: 'v04:circulo' + k, p: cpk, color: m.rojo });
    }
    // The pencil waits, rocking; on line 2 it moves to the row of total cost.
    var Pc = T.pencil, cl = calm(s), mv = inOut3(beat(a1, 0.02, 0.2));
    var px = lerp(Pc.x, T.x0 + T.c0 + T.cw * 2, mv), py = lerp(Pc.y, T.y0 + T.hh + T.rh * 2.5, mv);
    fig.sign(ctx, 'lapiz', px, py + Math.sin(s.t * 0.9) * 2 * cl, Pc.size, { seed: 'v04:lapiz', rot: -0.5 + Math.sin(s.t * 0.7) * 0.04 * cl, p: intro });
  }

  // ---------------------------------------------------------------------------------------------
  // 16 · cierre — back at the bridge: two people carry the empty table and lay it as the last
  // plank; then everyone crosses to «Valor»; the final title writes itself.

  var CIERRE = {
    bridge: { x: 640, y: 440, k: 1.4 },
    built: 0.62,
    title: { y: 36, size: 54, w: 1180 },
    feet: 428, k: 1.1,
    lamp: { x: 330, y: 404, k: 0.32 },
    table: { w: 150, h: 96 }
  };

  function cierre(ctx, s, env) {
    var C = cuesOf(s, 'cierre'), ink = env.ink, fig = env.fig, m = env.pal.mundo, K = CIERRE, B = K.bridge;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0);
    floaters(ctx, s, env, [['sol', 1160, 200, 58, m.rojo], ['estrella', 120, 200, 40]], intro);
    bridgeScene(ctx, s, env, B, K.built, intro);
    fig.lamp(ctx, K.lamp.x, K.lamp.y, K.lamp.k, { t: s.t, p: intro });
    // The gap the table fills: from the end of the deck to the far bank.
    var xb = B.x + lerp(-150, 150, K.built) * B.k, xe = B.x + 150 * B.k, deckY = B.y - 8 * B.k;
    var tC = lineT(s, 0, 0.02), tLay = tC + 3.2, tCross = tLay + 1.3;
    var lay = inOut3(seg(s.t, tLay, tLay + 1.0));
    // The two carriers walk to the gap with the table between them.
    var carry = seg(s.t, tC, tLay), cx = lerp(250, xb - 70, inOut3(carry));
    var cross = inOut3(seg(s.t, tCross, tCross + 3.4)), off = cross * (1010 - (xb - 70));
    var bob = carry > 0 && carry < 1 ? Math.abs(Math.sin(s.t * 5)) * 3 : 0;
    // The table: the empty notebook table held overhead (one fixed drawing, moved and flattened by
    // transforms), then, laid into the gap, the same table as the last plank.
    var Tw = K.table.w, Th = K.table.h, gapW = xe - xb + 6, flat = seg(lay, 0, 0.7);
    var tx = lerp(cx, (xb + xe) / 2, lay), ty = lerp(deckY - 128 * K.k - bob, deckY + 2, lay);
    if (lay < 1) {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(lerp(1, gapW / Tw, flat), lerp(1, 0.16, flat));
      ctx.globalAlpha *= 1 - seg(lay, 0.6, 1);
      ink.card(ctx, -Tw / 2, -Th / 2, Tw, Th, { seed: 'v04:tabla-vacia', weight: 3, radius: 6, p: intro });
      for (var r = 0; r < s.state.cierre.grid.length; r++) ink.line(ctx, s.state.cierre.grid[r], { w: 1.8, profile: 'even', seed: 'v04:tabla-linea' + r, p: intro });
      ctx.restore();
    }
    var pl = seg(lay, 0.5, 1);
    if (pl > 0) ink.card(ctx, xb - 3, deckY - 8, gapW, 16, { seed: 'v04:tablon-tabla', weight: 3, radius: 3, alpha: pl });
    var walking = (carry > 0 && carry < 1) || (cross > 0 && cross < 1);
    var pose = lay < 1 ? 'carrying' : walking ? 'walking' : 'standing';
    var py = K.feet - bob;
    fig.person(ctx, cx - 44 + off, py, K.k, { role: 'directiva', skin: 4, hair: 'bun', seed: 'v04:cierre0', pose: pose, facing: 1, p: intro });
    fig.person(ctx, cx + 44 + off, py, K.k, { role: 'docente', skin: 1, hair: 'curly', seed: 'v04:cierre1', pose: pose, facing: 1, p: intro });
    fig.lectora(ctx, cx - 120 + off * 0.9, K.feet - (walking ? Math.abs(Math.sin(s.t * 5 + 1)) * 3 : 0), K.k, { pose: walking ? 'walking' : 'reading', facing: 1, p: intro });
    ink.letter(ctx, rot(s, 'titulo'), W / 2, K.title.y, { size: K.title.size, align: 'center', maxWidth: K.title.w, maxLines: 1, seed: 'v04:titulo-final',
      counters: 0.3, stars: false, p: beat(a0, 0.02, Math.min(1, Math.max(0.3, C.construye))) });
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, m = env.pal.mundo, pal = env.pal, i;
    var st = {};

    // capital and cadena: the river path, its drawing and the wider stream, whose total width is
    // the river's times inversión corporativa / inversión privada (both parsed from their rótulos).
    var video = findVideo(env.id || 'v04'), capScene = null;
    ((video && video.scenes) || []).forEach(function (sc) { if (sc.id === 'capital') capScene = sc; });
    var river = samplePath(ink, VALLE.river, 4);
    var priv = capScene ? env.chart.parseValue(capScene.rotulos.inversionPrivada.text) : null;
    var corp = capScene ? valuesIn(env.chart, capScene.rotulos.inversionCorporativa.text)[0] : null;
    var wideHw = VALLE.hw * (priv && corp ? corp.value / priv.value : 1);
    var wb = ink.drawing('v04:rio-ancho', { w: 3.4, jitter: 0.5 });
    wb.shape(bandPoints(river, wideHw, wideHw, 44), { fill: pal.mix(m.celeste, m.lienzo, 0.3), line: false });
    st.capital = {
      path: river, river: riverDrawing(env, river), wide: wb.done(), wideHw: wideHw,
      gateRing: ink.ellipsePoints(1139, 479, 30, 44, 18, 0.05).concat([1169, 481, 1168, 470]),
      chainArrows: [1, 2, 3].map(function (k) {
        var x0 = CADENA.xs[k - 1] + CADENA.r + 10, x1 = CADENA.xs[k] - CADENA.r - 12, y = CADENA.y;
        return [x0, y + 2, (x0 + x1) / 2, y - 12, x1, y];
      }),
      parcel: (function () {
        var b = ink.drawing('v04:paquete', { w: 3.4, jitter: 0.5 });
        b.shape([-30, -20, 30, -22, 32, 24, -28, 26], { fill: m.tierra, w: 3.6 });
        b.stroke([0, -21, 1, 25], { w: 3, profile: 'even', color: m.rojo });
        b.stroke([-29, 2, 31, 1], { w: 3, profile: 'even', color: m.rojo });
        b.stroke([0, -22, -12, -34, -2, -36, 0, -22, 12, -36, 4, -38, 0, -22], { w: 2.6, profile: 'even', color: m.rojo });
        return b.done();
      })()
    };

    // paises: a river running down between the two banks; the guide from the label to the tall
    // pile's exact top; the thread of the note; the seal and the gear signs.
    var pr = samplePath(ink, PAISES.river, 4);
    var pb = ink.drawing('v04:rio-orillas', { w: 3.6, jitter: 0.6 });
    pb.shape(bandPoints(pr, 10, 46, 40), { fill: m.celeste, w: 3.4 });
    pb.stroke(ink.wavePoints(560, 640, 720, 3, 60, 0.3), { w: 2, profile: 'hair', color: m.lienzo });
    var seal = ink.drawing('v04:sello-patente', { w: 2.6, jitter: 0.3 });
    seal.stroke([-6, 8, -12, 26], { w: 3.4, profile: 'blunt', color: m.rojo });
    seal.stroke([6, 8, 12, 26], { w: 3.4, profile: 'blunt', color: m.rojo });
    seal.circle(0, 0, 13, { fill: m.rojo, w: 2.6 });
    var gear = ink.drawing('v04:engranaje', { w: 3.2, jitter: 0.4 }), gp = [];
    for (i = 0; i < 40; i++) {
      var ga = i / 40 * TAU, tooth = (i % 4 < 2) ? 40 : 30;
      gp.push(Math.cos(ga) * tooth, Math.sin(ga) * tooth);
    }
    gear.shape(gp, { fill: m.tierra, w: 3.4 });
    gear.circle(0, 0, 11, { fill: m.lienzo, w: 3 });
    st.paises = {
      path: pr, river: pb.done(), seal: seal.done(), gear: gear.done(),
      noteThread: [PAISES.cn.x, PAISES.note.y + PAISES.note.h - 4, PAISES.cn.x + 4, PAISES.base - PAISES.unit - 4]
    };

    // costo-oculto: nothing beyond the constants.
    st.costo = {};

    // energia: the cable, the bolt and the islands (one shape each, filled with a decor color).
    var Mt = ENERGIA.meter, T = ENERGIA.tower, towerTop = T.y - 300 * T.k;
    var bolt = ink.drawing('v04:rayo', { w: 2.6, jitter: 0.3 });
    bolt.shape([0, 0, 14, 0, 6, 14, 16, 14, -2, 36, 4, 20, -6, 20], { fill: m.amarillo, w: 2.6 });
    st.energia = {
      cable: [T.x, towerTop, T.x + 12, towerTop - 30, (T.x + Mt.x) / 2 + 30, Mt.y + Mt.h * 0.7, Mt.x + 2, Mt.y + Mt.h * 0.55],
      bolt: bolt.done(),
      islands: ENERGIA.islands.map(function (I, k) {
        var b = ink.drawing('v04:isla' + k, { w: 4, jitter: 0.6 });
        b.shape(ink.blobPoints(env.rng('v04:isla-forma' + k), 0, 0, ENERGIA.rx, ENERGIA.ry, 11, 0.13, k * 0.7), { fill: '@a', w: 4.2 });
        return b.done();
      })
    };

    // embudo: the cut lines between the bars.
    st.embudo = {
      cuts: [1, 2, 3].map(function (k) {
        var y = EMBUDO.rows[k].y - 12;
        return [EMBUDO.cx - 300, y, EMBUDO.cx, y + 2, EMBUDO.cx + 300, y];
      })
    };

    // etapas: the wide river, its moving waves, the six stones (positions as fig.steppingStones
    // places them) and the arrows between them.
    var E = ETAPAS, wr = ink.drawing('v04:rio-ancho-etapas', { w: 4, jitter: 0.8 });
    wr.shape([-20, 356, 300, 344, 640, 360, 980, 346, 1300, 358, 1300, 560, 980, 552, 640, 564, 300, 548, -20, 560], { fill: m.celeste, w: 4 });
    wr.shape([-20, 330, 40, 340, 64, 470, 52, 600, -20, 610], { fill: m.lienzoOcre, w: 4 });
    wr.shape([1300, 330, 1236, 342, 1214, 470, 1230, 600, 1300, 610], { fill: m.tierra, w: 4 });
    var stones = [], stoneDrawings = [];
    for (i = 0; i < 6; i++) {
      var sx = E.stones.x + (i - 2.5) * 120 * E.stones.k, sy = E.stones.y + Math.sin(i * 1.3) * 14 * E.stones.k * 0.5;
      stones.push({ x: sx, y: sy });
      var sb = ink.drawing('v04:piedra' + i, { w: 3.6, jitter: 0.5 });
      sb.blob(0, 0, 46 * E.stones.k, 17 * E.stones.k, { fill: pal.mix(m.lienzoOcre, m.tierra, 0.3 + (i % 3) * 0.15), w: 3.8, irr: 0.18 });
      stoneDrawings.push(sb.done());
    }
    st.etapas = {
      water: wr.done(), stones: stones, stoneDrawings: stoneDrawings,
      waves: [0, 1, 2, 3].map(function (k) { return ink.wavePoints(-140 + k * 330, 398 + (k % 2) * 112, 120 + k * 330, 3, 64, k * 0.7); }),
      stoneArrows: stones.slice(1).map(function (S, k) {
        var A = stones[k], x0 = A.x + 46 * E.stones.k * 0.62, x1 = S.x - 46 * E.stones.k * 0.62;
        return [x0, A.y - 34, (x0 + x1) / 2, (A.y + S.y) / 2 - 44, x1, S.y - 34];
      })
    };

    // actualizacion: our notes on the course's page (illegible handwriting).
    var P1 = ACT.page1, notes = [];
    for (i = 0; i < 3; i++) {
      var pts = [], y0 = P1.y + 196 + i * 30 - (i === 2 ? 0 : 0), x0 = P1.x + 80, w0 = i === 2 ? 220 : 330;
      for (var j = 0; j <= 18; j++) {
        var u = j / 18, ang = u * TAU * (w0 / 46);
        pts.push(x0 + u * w0 + Math.sin(ang) * 5, y0 - Math.abs(Math.cos(ang)) * 9 + Math.sin(u * 7 + i) * 2);
      }
      notes.push(pts);
    }
    st.act = { notes: notes };

    // productividad: the leaders from each label to its weight (positions of the left pan at BAL).
    var panX = BAL.x - 140 * BAL.k, panY = BAL.y + (-230 + 66) * BAL.k, prodScene = null;
    ((video && video.scenes) || []).forEach(function (sc2) { if (sc2.id === 'productividad') prodScene = sc2; });
    var values = PROD.weights.map(function (Wt) { return prodScene ? env.chart.parseValue(prodScene.rotulos[Wt.key].text) : null; });
    st.prod = {
      values: values,
      leaders: PROD.weights.map(function (Wt, k) {
        var x = panX + Wt.dx, top = panY - (values[k] ? values[k].value : 0) * PROD.px;
        return [x, PROD.labels.y0 + k * PROD.labels.dy + 32, x, top - 8];
      })
    };

    // pwc: the shared baseline.
    st.pwc = { baseline: [PWC.towers[0].x - 24, PWC.base + 1, PWC.towers[1].x + PWC.tw + 30, PWC.base] };

    // causalidad: the two solid arrows, the dotted «asociación» line and the method checkboxes.
    var K = CAUSA, boxes = [], ticks = [];
    for (i = 0; i < 4; i++) {
      var bx = K.methods.x[i % 2], by = K.methods.y[Math.floor(i / 2)] + 2;
      boxes.push([bx, by, bx + 24, by + 1, bx + 25, by + 25, bx - 1, by + 24]);
      ticks.push([bx + 4, by + 12, bx + 11, by + 21, bx + 30, by - 6]);
    }
    st.causa = {
      arrows: [
        [K.cloud.x - 150, K.cloud.y + 66, K.left.x + K.left.w * 0.72, K.cloud.y + 118, K.left.x + K.left.w * 0.56, K.left.y - 10],
        [K.cloud.x + 150, K.cloud.y + 66, K.right.x + K.right.w * 0.28, K.cloud.y + 118, K.right.x + K.right.w * 0.44, K.right.y - 10]
      ],
      assoc: [K.left.x + K.left.w + 14, K.left.y + K.left.h / 2, K.cloud.x, K.left.y + K.left.h / 2 + 8, K.right.x - 14, K.right.y + K.right.h / 2],
      boxes: boxes, ticks: ticks
    };

    // intencion: month ticks of the strip and the line of sight from the spyglass.
    var ticksI = [];
    for (i = 0; i <= INT.strip.months; i++) {
      var tx = INT.strip.x + i * INT.strip.cell, long = i % 6 === 0;
      ticksI.push([tx, INT.strip.y + (long ? 2 : 10), tx + 0.6, INT.strip.y + INT.strip.h - (long ? 2 : 10)]);
    }
    st.intencion = { ticks: ticksI, sight: [252, 326, 470, 318, 690, 310] };

    // linea-base: the table's lines, the loops around three of its words, the row of total cost.
    var T2 = LB, gx1 = T2.x0 + T2.c0 + T2.cw * 4, gy1 = T2.y0 + T2.hh + T2.rh * 4, grid = [];
    grid.push([T2.x0, T2.y0 + T2.hh, gx1, T2.y0 + T2.hh + 1]);                   // under the header
    grid.push([T2.x0 + T2.c0, T2.y0, T2.x0 + T2.c0 + 1, gy1]);                   // after the row names
    for (i = 1; i < 4; i++) grid.push([T2.x0, T2.y0 + T2.hh + i * T2.rh, gx1, T2.y0 + T2.hh + i * T2.rh + 1]);
    for (i = 1; i < 4; i++) grid.push([T2.x0 + T2.c0 + i * T2.cw, T2.y0 + 4, T2.x0 + T2.c0 + i * T2.cw + 1, gy1]);
    grid.push([T2.x0, gy1, gx1, gy1 + 1]);
    var cyCost = T2.y0 + T2.hh + T2.rh * 2;
    st.lineaBase = {
      grid: grid,
      loops: [
        ink.ellipsePoints(T2.x0 + T2.c0 + T2.cw * 0.5, T2.y0 + T2.hh / 2, T2.cw * 0.52, T2.hh * 0.5, 16, 0.04),
        ink.ellipsePoints(T2.x0 + T2.c0 * 0.5, cyCost + T2.rh / 2, T2.c0 * 0.5, T2.rh * 0.44, 16, -0.03),
        ink.ellipsePoints(T2.x0 + T2.c0 + T2.cw * 3.5, T2.y0 + T2.hh / 2, T2.cw * 0.54, T2.hh * 0.52, 16, 0.05)
      ].map(function (pts) { return pts.concat(pts.slice(0, 6)); }),
      costRow: [T2.x0 + 4, cyCost + 4, gx1 - 4, cyCost + 5, gx1 - 5, cyCost + T2.rh - 4, T2.x0 + 5, cyCost + T2.rh - 5]
    };

    // cierre: the lines of the small empty table carried to the bridge (its own units, centered).
    var tw2 = CIERRE.table.w / 2, th2 = CIERRE.table.h / 2, tg = [];
    for (i = 1; i < 5; i++) tg.push([-tw2 + 8, -th2 + i * th2 * 2 / 5, tw2 - 8, -th2 + i * th2 * 2 / 5 + 0.5]);
    for (i = 1; i < 5; i++) tg.push([-tw2 + i * tw2 * 2 / 5, -th2 + 8, -tw2 + i * tw2 * 2 / 5 + 0.5, th2 - 8]);
    st.cierre = { grid: tg };
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v04 = {
    setup: setup,
    drawsWarnings: { causalidad: true },
    layers: {
      capital: valleyLayer,
      paises: groundLayer('territorio', { seed: 'v04:orillas', horizon: PAISES.horizon, contours: false }),
      cadena: valleyLayer,
      'costo-oculto': groundLayer('personas', {}),
      energia: groundLayer('datos', {}),
      embudo: groundLayer('datos', {}),
      puente: groundLayer('territorio', { seed: 'v04:abismo', horizon: PUENTE.horizon, contours: false }),
      etapas: groundLayer('territorio', { seed: 'v04:etapas', horizon: ETAPAS.horizon, contours: false }),
      actualizacion: groundLayer('personas', {}),
      productividad: groundLayer('personas', {}),
      metr: groundLayer('personas', {}),
      pwc: groundLayer('datos', {}),
      causalidad: groundLayer('personas', {}),
      intencion: groundLayer('territorio', { seed: 'v04:horizonte', horizon: INT.horizon, contours: false }),
      'linea-base': groundLayer('personas', {}),
      cierre: groundLayer('territorio', { seed: 'v04:abismo', horizon: PUENTE.horizon, contours: false })
    },
    scenes: {
      capital: capital,
      paises: paises,
      cadena: cadena,
      'costo-oculto': costoOculto,
      energia: energia,
      embudo: embudo,
      puente: puente,
      etapas: etapas,
      actualizacion: actualizacion,
      productividad: productividad,
      metr: metr,
      pwc: pwc,
      causalidad: causalidad,
      intencion: intencion,
      'linea-base': lineaBase,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
