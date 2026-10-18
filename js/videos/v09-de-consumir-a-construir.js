/* js/videos/v09-de-consumir-a-construir.js — V09 «De consumir a construir» (prompt §13, sesión 7;
 * KB §10; láminas D15–D17).
 *
 * Thirteen scenes in four chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Una región que adopta rápido   region · ilia · consumo · pioneros · computo
 *   2 Colombia                       colombia · conpes · falta
 *   3 Agenda 2026–2028               agenda · escenarios · indicadores
 *   4 Cinco mensajes                 mensajes · cierre
 *
 * Latin America and the Caribbean is one warm landmass without borders (fig.latam). Every number
 * is an honest mark on one zero-based scale per frame, and it lands, whole, before or while its
 * line says it, with its source tag from then to the end of the scene: «14%» and «11%» (alc-1)
 * as bars on one 0–100% track; the 19 ILIA countries as 19 plain cards, with no names or flags
 * (ctx-ilia-indicadores); the three pioneers (alc-2) as bars on one 0–100 scale; the 8 and 44
 * state-backed supercomputing clusters (eco-7) as exactly that many identical ruled cells; Colombia's
 * 55,84, 67,29 and 76,01 (alc-3) as gauges on one 0–100 dial; the CONPES 4144 counter (alc-4) whole;
 * and «88% vs 39%» (adop-1, adop-5) on D17's second card. Colombia is always «adoptante».
 *
 * The metaphors are those of the láminas: D15's suspension bridge from «Uso» to «Capacidad propia»,
 * D16's road of three lanes with a compass star, D17's five cards and the compass star that turns
 * toward a lighthouse on the night sea, where V01's iceberg rests in the distance. The AI is only the
 * small ruled lamp; people and places are warm and free.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings it,
 * and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds. No
 * string, number or source is typed here: copy comes from s.rotulos (js/data/videos.js), values from
 * env.chart.parseValue(rótulo), sources from env.tags. Draw functions are pure functions of
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
  // Ambient motion settles in and out with the scene (no jump at a crossfade).
  function calm(s) { return seg(s.t, 0, 1.2) * seg(s.dur - s.t, 0, 1.2); }
  function val(env, text) { var v = env.chart.parseValue(text); return v ? v.value : 0; }
  // The words of a rótulo after its first number («14% de las visitas…» → «de las visitas…»).
  function afterValue(env, text) {
    var v = env.chart.parseValue(text);
    if (!v || v.index == null) return text;
    return String(text).slice(v.index + v.raw.length).replace(/^[\s:·]+/, '');
  }
  // The words of a rótulo before its first number («Chile 70,56» → «Chile»).
  function beforeValue(env, text) {
    var v = env.chart.parseValue(text);
    if (!v || v.index == null) return text;
    return String(text).slice(0, v.index).replace(/[\s:·]+$/, '');
  }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    region: { visitas: [0, '14%', 'chunk'], usuarios: [0, '11%', 'chunk'], descargas: [1, 'descargas', 'word'] },
    ilia: { paises: [0, '19 países', 'chunk'], hab: [0, 'factores habilitantes', 'word'], inv: [0, 'investigación, desarrollo', 'word'],
      gob: [0, 'y gobernanza', 'word'] },
    consumo: { mipymes: [0, 'mipymes', 'word'], productividad: [0, 'productividad', 'word'], dependencia: [1, 'dependencia', 'word'],
      datos: [1, 'salida de datos', 'word'], valor: [1, 'captura externa', 'word'] },
    pioneros: { chile: [0, '70,56', 'word'], brasil: [0, '67,39', 'word'], uruguay: [0, '62,32', 'word'], adoptantes: [0, 'Colombia, Ecuador', 'chunk'] },
    computo: { ocho: [0, '8 clústeres', 'word'], cuarenta: [0, '44', 'chunk'] },
    colombia: { puntaje: [0, '55,84', 'word'], puesto: [0, 'cuarto lugar', 'word'], adopcion: [1, '67,29', 'word'], gobernanza: [1, '76,01', 'word'],
      avanzada: [1, 'gobernanza avanzada', 'word'], adoptante: [1, 'es adoptante', 'word'] },
    conpes: { contador: [0, '106 acciones', 'chunk'], e0: [1, 'ética', 'word'], e1: [1, 'datos e infraestructura', 'word'], e2: [1, 'investigación', 'word'],
      e3: [1, 'capacidades', 'word'], e4: [1, 'mitigación', 'word'], e5: [1, 'adopción pública', 'word'], estrategia: [1, 'Estrategia de Datos', 'word'] },
    falta: { pide: [0, 'Pide más', 'word'], reto: [1, 'portafolio verificable', 'word'], indicadores: [1, 'indicadores periódicos', 'word'],
      convertir: [1, 'convertir el consumo', 'word'] },
    agenda: { gob: [0, 'Los gobiernos', 'word'], g0: [0, 'medir separando', 'word'], g1: [0, 'compartir cómputo', 'word'], g2: [0, 'regular de forma', 'word'],
      uni: [1, 'Las universidades', 'word'], u0: [1, 'una política común', 'word'], u1: [1, 'alfabetización transversal', 'word'],
      u2: [1, 'evaluación auténtica', 'word'], org: [1, 'Las organizaciones', 'word'], o0: [1, 'pocos flujos', 'word'], o1: [1, 'línea base', 'word'],
      o2: [1, 'agentes con permisos', 'word'], r0: [2, 'diseños causales', 'word'], r1: [2, 'reportes con', 'word'], r2: [2, 'resultados nulos', 'word'],
      r3: [2, 'evaluaciones en español', 'word'], comun: [3, 'un indicador común', 'word'] },
    escenarios: { w0: [0, 'Difusión con bajo', 'word'], w1: [0, 'Transformación agéntica', 'word'], w2: [1, 'Automatización desigual', 'word'],
      w3: [1, 'reacción regulatoria', 'word'], sello: [1, 'aceleran las obligaciones', 'word'] },
    indicadores: { n0: [0, 'insumos', 'word'], n1: [0, 'uso, integración', 'word'], n2: [0, 'integración', 'word'], n3: [0, 'resultado', 'word'],
      n4: [0, 'aprendizaje', 'word'], n5: [0, 'distribución', 'word'], n6: [0, 'seguridad', 'word'], n7: [0, 'sostenibilidad', 'word'],
      n8: [0, 'y gobernanza', 'word'], apr: [1, 'aprendizaje', 'word'], dis: [1, 'Y en distribución', 'word'] },
    mensajes: { m0: [0, 'Uno:', 'word'], m1: [0, 'Dos:', 'word'], cifra: [0, '88%', 'word'], m2: [1, 'Tres:', 'word'], m3: [1, 'Cuatro:', 'word'],
      m4: [1, 'cinco:', 'word'] },
    cierre: { gracias: [0, 'Gracias', 'chunk'] }
  };

  // The scene's cues as shares of their lines, read from the player's s.cue (subtitle timing).
  // Memoized per scene state object, which the player keeps for the life of its timeline (a pure
  // cache: same timeline, same shares). Words missing from a line fall back to the middle.
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

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function ground(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v09:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus static drawing.
  function groundLayer(kind, opts, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d'), o = { seed: 'v09:pagina' }, k;
      for (k in opts || {}) o[k] = opts[k];
      env.ink.background(g, kind, o);
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, colors?]; keep them
  // clear of the subtitle band (y > 570) and of the player's overlays.
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v09:fx' + i) * 9, f[2] + noise(t * 0.8, 'v09:fy' + i) * 7, f[3], {
        seed: 'v09:float' + f[0] + i, colors: f[4] || null, rot: noise(t * 0.6, 'v09:fr' + i) * 0.14, p: p
      });
    }
  }

  // Brush lettering that fades as one image: drawn glyph by glyph with a low alpha, the fill and the
  // brush stroke overlap and show dark outlines (and a number would pass through in-between
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
    var img = env.ink.layer(ctx, 'v09:letra|' + key + '|' + size + '|' + (full.color || ''), w, h, function (g) {
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
    var lo = { size: size, align: o.align || 'left', counters: 0, stars: false, underline: false, seed: o.seed, color: o.color, maxLines: 1, p: 1 };
    return letterFade(ctx, env, text, x, y, lo, o.p == null ? 1 : clamp01(o.p), 'hero|' + text + '|' + o.seed);
  }

  // A label lettered by hand that writes itself on (no counters, no stars: it reads at a glance).
  function label(ctx, env, text, x, y, size, o) {
    return env.ink.letter(ctx, text, x, y, { size: size, align: o.align || 'left', maxWidth: o.maxWidth, maxLines: o.maxLines || 1, fit: !!o.fit,
      minSize: o.minSize, counters: o.counters || 0, stars: false, underline: !!o.underline, seed: o.seed, color: o.color, p: o.p });
  }

  // One source tag per figure, at the size the course uses in videos.
  function tag(ctx, env, ids, x, y, anchor, p, o) {
    if (p <= 0) return null;
    var to = { x: x, y: y, anchor: anchor, p: p, scale: 1.08, maxWidth: 320 }, k;
    for (k in o || {}) to[k] = o[k];
    return env.tags.sourceTag(ctx, ids, to);
  }

  // Points every `step` px along a closed polygon's edges, so a brush outline (which runs through a
  // smoothing spline) keeps its corners instead of rounding into a lens.
  function densify(pts, step) {
    var out = [], n = pts.length / 2;
    for (var i = 0; i < n; i++) {
      var ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[(2 * i + 2) % pts.length], by = pts[(2 * i + 3) % pts.length];
      var m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
      for (var j = 0; j < m; j++) out.push(ax + (bx - ax) * j / m, ay + (by - ay) * j / m);
    }
    return out;
  }
  function rectPts(x, y, w, h, step) { return densify([x, y, x + w, y, x + w, y + h, x, y + h], step || 24); }

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
    return { x: p.x, y: p.y, s: acc, n: p.n, len: acc[p.n - 1] || 1, ctrl: ctrl };
  }
  var Q1 = {};   // scratch point, overwritten by every call (no state across frames)

  // A shape drawn at its place but faded as a whole (shapes, cards): draw on with p, fade with a.
  function faded(ctx, a, fn) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    fn();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · region — Latin America and the Caribbean as one landmass; on one 0–100% track, the share
  // of the world's visits to AI solutions (14%) and of Internet users (11%); phones flutter out of
  // the Caribbean toward «tercera región en descargas…».

  var REG = {
    land: { x: -236, y: 10, k: 0.8 },
    rows: [{ key: 'visitas', cue: 'visitas', y: 108 }, { key: 'usuarios', cue: 'usuarios', y: 252 }],
    x: 590, len: 600, trackDy: 74, h: 40, hero: 54, desc: 24,
    tag: { x: 590, y: 400 },
    descargas: { x: 930, y: 404, w: 300 },
    phones: [[-40, 0], [10, -46], [60, 18], [100, -30], [150, 6]]   // spread of the flock (px)
  };

  function region(ctx, s, env) {
    var C = cuesOf(s, 'region'), ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), L = REG.land;
    fig.latam(ctx, L.x, L.y, L.k, { ground: false, p: out3(seg(s.t, 0, 0.6) * 0.15 + beat(a0, 0, 0.2) * 0.85), seed: 'v09:latam' });
    floaters(ctx, s, env, [['estrella', 1210, 76, 36], ['sol', 560, 520, 40, { a: m.rojo }]], out3(s.intro));

    // One 0–100% scale for both shares: a dashed track is the whole (100%), the bar the share.
    var sc = chart.scale(100, REG.x, REG.len), last = null;
    REG.rows.forEach(function (r, i) {
      var text = rot(s, r.key), win = landWindow(C[r.cue]), ty = r.y + REG.trackDy;
      var tp = out3(beat(a0, win[0] - 0.08, win[0]));
      if (tp <= 0) return;
      faded(ctx, tp, function () {
        ink.rRect(ctx, REG.x, ty, REG.len, REG.h, { color: env.pal.mix(m.tinta, m.lienzo, 0.45), w: 1.4, dash: [6, 6] });
      });
      chart.baseline(ctx, REG.x, ty - 10, ty + REG.h + 10, { p: tp });
      var bp = beat(a0, win[0], win[1]);
      var g = chart.bar(ctx, { value: val(env, text), scale: sc, y: ty, h: REG.h, color: i ? m.azul : m.rojo, labels: false, seed: 'v09:region' + i, p: bp });
      var lp = beat(a0, win[1] - 0.02, win[1] + 0.03);
      if (lp > 0) {
        var vt = env.chart.parseValue(text).raw;
        var HL = hero(ctx, env, vt, REG.x, r.y, REG.hero, { seed: 'v09:reg' + i, p: lp });
        ink.text(ctx, afterValue(env, text), REG.x + HL.w + 16, r.y + REG.hero * 0.3, { size: REG.desc, weight: 700, maxWidth: REG.len - HL.w - 16,
          lineHeight: 1.15, p: lp });
      }
      if (bp > 0) last = { x: g.x1, y: ty + REG.h, p: seg(lp, 0, 1) };
    });
    // One tag for the three figures of alc-1, under the bars, tied to the lower bar's value edge.
    var t0 = landWindow(C.visitas)[1];
    var tp2 = beat(a0, t0 - 0.02, t0 + 0.04);
    if (tp2 > 0) {
      var lowY = REG.rows[1].y + REG.trackDy + REG.h, topY = REG.rows[0].y + REG.trackDy + REG.h;
      var anc = last && last.p > 0 && s.at(0) >= landWindow(C.usuarios)[1] ? { x: last.x - 6, y: lowY } : { x: sc(val(env, rot(s, 'visitas'))) - 6, y: topY };
      tag(ctx, env, 'alc-1', REG.tag.x, REG.tag.y, anc, tp2);
    }

    // Line 2: phones flutter out of the Caribbean toward the phrase.
    var fp = beat(a1, 0, Math.max(0.2, C.descargas));
    if (fp > 0) {
      var D = REG.descargas, from = { x: 360, y: 150 }, to = { x: D.x + 120, y: D.y - 60 };
      for (var k = 0; k < REG.phones.length; k++) {
        var ph = REG.phones[k], e = inOut3(seg(fp, k * 0.08, 0.6 + k * 0.08));
        var px = lerp(from.x, to.x + ph[0], e) + noise(s.t * 0.4 + k, 'v09:phx') * 10 * calm(s);
        var py = lerp(from.y, to.y + ph[1], e) - Math.sin(e * Math.PI) * 120 + noise(s.t * 0.5 + k * 2, 'v09:phy') * 8 * calm(s);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(noise(s.t * 0.3 + k * 3, 'v09:phr') * 0.4 + (k % 2 ? 0.25 : -0.2));
        fig.phone(ctx, 0, 0, 0.42, { seed: 'v09:tel' + (k % 3), p: seg(e, 0, 0.3) });
        ctx.restore();
      }
      ink.text(ctx, rot(s, 'descargas'), D.x, D.y, { size: 26, weight: 700, maxWidth: D.w, lineHeight: 1.16, p: beat(a1, C.descargas - 0.05, C.descargas + 0.1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · ilia — nineteen plain cards (no names, no flags: the KB does not list the countries); three
  // ribbons weave through them as the three dimensions are named.

  var ILIA = {
    rows: [10, 9], card: { w: 62, h: 84 }, gap: 14, rowGap: 22, x: 72, y: 128,
    ribbons: [{ key: 'habilitantes', cue: 'hab', color: 'rojo', ph: 0 }, { key: 'investigacion', cue: 'inv', color: 'amarillo', ph: 2.1 },
      { key: 'gobernanza', cue: 'gob', color: 'azul', ph: 4.2 }],
    labels: { y: 388, x: 72, w: 250, gap: 14 },
    tag: { x: 880, y: 92 }
  };

  function iliaCards() {
    var out = [], k = 0;
    ILIA.rows.forEach(function (n, r) {
      var rowW = n * ILIA.card.w + (n - 1) * ILIA.gap, x0 = ILIA.x + (ILIA.rows[0] * ILIA.card.w + (ILIA.rows[0] - 1) * ILIA.gap - rowW) / 2;
      for (var i = 0; i < n; i++) out.push({ i: k++, x: x0 + i * (ILIA.card.w + ILIA.gap), y: ILIA.y + r * (ILIA.card.h + ILIA.rowGap), r: (i % 3 - 1) * 0.03 });
    });
    return out;
  }

  function setupIlia(env) {
    var cards = iliaCards(), x0 = ILIA.x - 30, x1 = ILIA.x + ILIA.rows[0] * (ILIA.card.w + ILIA.gap) + 16;
    var top = ILIA.y + 10, bot = ILIA.y + 2 * ILIA.card.h + ILIA.rowGap - 10;
    var ribbons = ILIA.ribbons.map(function (rb, j) {
      var pts = [];
      for (var i = 0; i <= 14; i++) {
        var u = i / 14, x = lerp(x0, x1, u);
        pts.push(x, (top + bot) / 2 + Math.sin(u * TAU * 1.5 + rb.ph) * (bot - top) * 0.42 + (j - 1) * 14);
      }
      return samplePath(env.ink, pts, 5);
    });
    return { cards: cards, ribbons: ribbons };
  }

  function ilia(ctx, s, env) {
    var C = cuesOf(s, 'ilia'), st = s.state.ilia, ink = env.ink, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = s.at(0), cards = st.cards, last = cards[ILIA.rows[0] - 1];
    floaters(ctx, s, env, [['constelacion', 1060, 520, 90], ['estrella', 830, 520, 34]], out3(s.intro));
    // The 19 cards land one by one in the first share of the line, well before «19 países».
    var cardsEnd = Math.min(0.3, Math.max(0.1, C.paises - 0.04));
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], cp = beat(a, 0.01 + i * (cardsEnd - 0.06) / cards.length, 0.05 + (i + 1) * (cardsEnd - 0.06) / cards.length);
      if (cp <= 0) continue;
      var bob = Math.sin(s.t * 0.7 + i * 0.9) * 1.5 * calm(s);
      ctx.save();
      ctx.translate(c.x + ILIA.card.w / 2, c.y + ILIA.card.h / 2 + bob);
      ctx.rotate(c.r);
      ink.card(ctx, -ILIA.card.w / 2, -ILIA.card.h / 2, ILIA.card.w, ILIA.card.h, { seed: 'v09:pais' + (i % 7), weight: 3, radius: 8, p: cp });
      ctx.restore();
    }
    // One tag for the count of cards (ctx-ilia-indicadores), from when the cards are there.
    tag(ctx, env, 'ctx-ilia-indicadores', ILIA.tag.x, ILIA.tag.y, { x: last.x + ILIA.card.w - 4, y: last.y + 10 }, beat(a, cardsEnd - 0.04, cardsEnd + 0.04));
    // The three ribbons weave across the cards, one per dimension, each with its name below.
    var Lb = ILIA.labels;
    ILIA.ribbons.forEach(function (rb, j) {
      var rp = beat(a, C[rb.cue] - 0.03, C[rb.cue] + 0.08);
      if (rp <= 0) return;
      var g = st.ribbons[j];
      ink.line(ctx, g.ctrl, { w: 16, profile: 'blunt', color: m[rb.color], seed: 'v09:cinta' + j, p: rp, alpha: 0.92 });
      ink.line(ctx, g.ctrl, { w: 2.4, profile: 'swell', seed: 'v09:cintaborde' + j, p: rp, dot: 'detached' });
      var lx = Lb.x + j * (Lb.w + Lb.gap), lp = seg(rp, 0.5, 1);
      ink.blob(ctx, lx + 14, Lb.y + 14, 14, 10, { fill: m[rb.color], w: 2.6, irr: 0.2, seed: 'v09:nudo' + j, p: lp });
      ink.text(ctx, rot(s, rb.key), lx + 38, Lb.y, { size: 24, weight: 700, maxWidth: Lb.w - 38, lineHeight: 1.12, p: lp });
    });
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · consumo — on the near shore a busy market of ready-made lamps in boxes, bought by many small
  // figures and small shops; across the sea, a thin stream of data drifts to a distant shore, and a
  // few coins float away with it.

  var CONS = {
    horizon: 268,
    near: [0, 382, 140, 362, 300, 374, 470, 366, 610, 388, 676, 440, 690, 540, 668, 720, 0, 720],
    far: [820, 266, 960, 252, 1100, 247, 1280, 242, 1280, 300, 1100, 304, 940, 300, 830, 292],
    towers: [[1004, 52], [1066, 72], [1130, 60], [1192, 44]],          // x, height (bottom at 262)
    stalls: [{ x: 116, shop: false }, { x: 300, shop: true }, { x: 486, shop: false }],
    table: 470, feet: 566,
    people: [
      { x: 52, skin: 1, hair: 'long', facing: 1 }, { x: 196, skin: 4, hair: 'short', facing: -1 }, { x: 226, skin: 2, hair: 'bun', facing: 1 },
      { x: 384, skin: 0, hair: 'curly', facing: -1 }, { x: 420, skin: 3, hair: 'braids', facing: 1 }, { x: 572, skin: 1, hair: 'ponytail', facing: -1 }
    ],
    stream: [560, 418, 700, 404, 820, 360, 930, 312, 1060, 262],
    n: 18, coins: 4
  };

  function consumoLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo, q = env.pal.maquina;
    ink.background(g, 'lienzo', { seed: 'v09:consumo' });
    // The sea under the horizon, then the two shores.
    ink.shape(g, rectPts(-10, CONS.horizon, W + 20, H - CONS.horizon + 10, 40), { fill: m.azul, line: false, fillScale: 0, fillJitter: 1.5, seed: 'v09:mar' });
    ink.line(g, [-10, CONS.horizon, 640, CONS.horizon + 2, 1290, CONS.horizon], { w: 4, profile: 'swell', seed: 'v09:horizonte' });
    var r = env.rng('v09:olas');
    for (var i = 0; i < 6; i++) {
      var y = CONS.horizon + 40 + i * 48 + r.range(-8, 8), x0 = r.range(700, 900);
      ink.wave(g, x0, y, x0 + r.range(160, 300), { amp: 4, len: 70, w: 2.6, color: env.pal.rgba(m.celeste, 0.8), seed: 'v09:ola' + i });
    }
    ink.shape(g, densify(CONS.far, 30), { fill: m.siena, w: 3.6, fillScale: 0, fillJitter: 1.5, seed: 'v09:lejos' });
    // Far away, a row of identical ruled cells: someone else's data centers.
    CONS.towers.forEach(function (tw) {
      ink.rRect(g, tw[0] - 16, 262 - tw[1], 32, tw[1], { color: q.linea, w: 1.2, fill: q.noche });
      for (var k = 12; k < tw[1] - 4; k += 12) ink.rLine(g, tw[0] - 12, 262 - k, tw[0] + 12, 262 - k, { color: q.rejilla, w: 1 });
    });
    ink.shape(g, densify(CONS.near, 30), { fill: m.lienzoOcre, w: 4.4, fillScale: 0, fillJitter: 2, seed: 'v09:cerca' });
    ink.grain(g, 0, 0, W, H, { alpha: 0.5 });
    return { bg: c };
  }

  // A market stall: two posts, a striped awning, a table and two open boxes (each with its lamp).
  function stall(ctx, s, env, st, k, p, lit) {
    var ink = env.ink, m = env.pal.mundo, x = st.x, ty = CONS.table, d = s.state.consumo;
    ink.draw(ctx, d.stall, x, ty, 1, { p: p, colors: { a: k % 2 ? m.rojo : m.verde } });
    for (var b = 0; b < 2; b++) {
      var bx = x - 34 + b * 68, lp = seg(lit, b * 0.3, 0.5 + b * 0.3);
      if (lp > 0) env.fig.lamp(ctx, bx, ty - 50 + Math.sin(s.t * 1.1 + k * 2 + b) * 1.5 * calm(s), 0.24, { t: s.t + k + b, p: lp });
      ink.draw(ctx, d.box, bx, ty, 1, { p: p });
    }
  }

  function consumo(ctx, s, env) {
    var C = cuesOf(s, 'consumo'), st = s.state.consumo, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 1180, 110, 70, { a: m.rojo }], ['pajaro', 760, 150, 54]], intro);
    // The market: stalls draw on, their lamps light up; the small shop's lamps join on «mipymes».
    CONS.stalls.forEach(function (sl, k) {
      var lit = sl.shop ? beat(a0, C.mipymes - 0.04, C.mipymes + 0.08) : beat(a0, 0.04 + k * 0.05, 0.16 + k * 0.05);
      stall(ctx, s, env, sl, k, out3(seg(s.t, 0, 0.6) * 0.3 + beat(a0, 0, 0.12) * 0.7), lit);
    });
    // Many small figures buying, each with a lamp box in hand once they have bought it.
    CONS.people.forEach(function (pp, i) {
      var pp0 = out3(beat(a0, 0.02 + i * 0.03, 0.14 + i * 0.03));
      if (pp0 <= 0) return;
      var walk = Math.sin(s.t * 0.6 + i * 1.3) * 3 * calm(s);
      var P = fig.person(ctx, pp.x + walk, CONS.feet, 0.92, { role: 'persona', pose: i % 2 ? 'carrying' : 'standing', facing: pp.facing, seed: 'v09:comprador' + i,
        skin: pp.skin, hair: pp.hair, p: pp0 });
      // «productividad a corto plazo»: a small star over some heads.
      var sp = beat(a0, C.productividad - 0.02 + i * 0.01, C.productividad + 0.06 + i * 0.01);
      if (sp > 0 && i % 2 === 0) fig.sign(ctx, 'estrella', P.head.x, P.top - 20 + Math.sin(s.t + i) * 2, 26 * out3(sp), { seed: 'v09:chispa' + i, colors: { a: m.amarillo } });
    });
    // Line 2. «dependencia tecnológica»: ruled threads from the market's lamps to the far shore.
    var dp = beat(a1, C.dependencia - 0.04, C.dependencia + 0.12);
    if (dp > 0) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -s.t * 10;
      ctx.strokeStyle = q.rejilla;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      CONS.stalls.forEach(function (sl, k) {
        var x0 = sl.x + 34, y0 = CONS.table - 64, tw = CONS.towers[k % CONS.towers.length], x1 = tw[0], y1 = 262 - tw[1];
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(lerp(x0, x1, 0.5), Math.min(y0, y1) - 70, lerp(x0, x1, dp), lerp(y0, y1, dp) - Math.sin(dp * Math.PI) * 50);
      });
      ctx.stroke();
      ctx.restore();
    }
    // «salida de datos»: a thin stream of small ruled cells drifts across the sea.
    var g = st.stream, flow = beat(a1, C.datos - 0.04, C.datos + 0.1);
    if (flow > 0) {
      for (var i = 0; i < CONS.n; i++) {
        var u = (i / CONS.n + s.t * 0.035) % 1;
        if (u > flow) continue;
        pathAt(g, u, Q1);
        var sz = 5 + (i % 3);
        ink.rRect(ctx, Q1.x - sz / 2 + Q1.nx * (i % 2 ? 6 : -6), Q1.y - sz / 2 + Q1.ny * (i % 2 ? 6 : -6), sz, sz,
          { color: q.linea, w: 1, fill: q.noche, alpha: seg(u, 0, 0.08) * seg(1 - u, 0, 0.08) });
      }
    }
    // «captura externa del valor»: a few coins float away along the stream.
    var vp = beat(a1, C.valor - 0.04, C.valor + 0.06);
    if (vp > 0) {
      for (var k2 = 0; k2 < CONS.coins; k2++) {
        var uc = clamp01(seg(a1, C.valor + k2 * 0.05, 1) * 0.85 + 0.05);
        pathAt(g, uc, Q1);
        ctx.save();
        ctx.globalAlpha *= vp * (1 - seg(uc, 0.8, 0.92) * 0.6);
        fig.coin(ctx, Q1.x, Q1.y - 14 + Math.sin(s.t * 1.2 + k2) * 4, 0.36, { seed: 'v09:moneda' + k2 });
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · pioneros — the three pioneers of the ILIA 2025 as warm bars on one 0–100 scale, under the
  // label «Pioneros»; then the group label of the adoptantes (Colombia among them).

  var PIO = {
    keys: ['chile', 'brasil', 'uruguay'], x: 300, len: 760, y: 186, h: 50, gap: 34,
    title: { x: 300, y: 94 }, tag: { x: 930, y: 84 },
    group: { x: 120, y: 420, w: 1040, h: 92 }
  };

  function pioneros(ctx, s, env) {
    var C = cuesOf(s, 'pioneros'), ink = env.ink, chart = env.chart, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = s.at(0), sc = chart.scale(100, PIO.x, PIO.len);
    floaters(ctx, s, env, [['estrella', 1180, 360, 36], ['espiral', 140, 110, 40]], out3(s.intro));
    label(ctx, env, rot(s, 'pioneros'), PIO.title.x, PIO.title.y, 48, { seed: 'v09:pioneros', underline: true, p: beat(a, 0, 0.1) });
    var bottom = PIO.y + PIO.keys.length * (PIO.h + PIO.gap) - PIO.gap;
    chart.baseline(ctx, sc(0), PIO.y - 12, bottom + 12, { p: beat(a, 0.02, 0.1) });
    var cues = [C.chile, C.brasil, C.uruguay], ends = [];
    PIO.keys.forEach(function (key, i) {
      var text = rot(s, key), y = PIO.y + i * (PIO.h + PIO.gap), win = landWindow(cues[i]);
      var np = beat(a, win[0] - 0.05, win[0]);
      if (np > 0) ink.text(ctx, beforeValue(env, text), PIO.x - 20, y + PIO.h / 2 - 15, { size: 28, weight: 700, align: 'right', p: np });
      var bp = beat(a, win[0], win[1]);
      var g = chart.bar(ctx, { value: val(env, text), scale: sc, y: y, h: PIO.h, color: [m.rojo, m.amarillo, m.verde][i], labels: false, seed: 'v09:pionero' + i, p: bp });
      var lp = beat(a, win[1] - 0.01, win[1] + 0.03);
      if (lp > 0) hero(ctx, env, chart.parseValue(text).raw, g.x1 + 14, y + PIO.h / 2 - 22, 40, { seed: 'v09:valor' + i, p: lp });
      ends.push({ x: g.x1, y: y, p: lp });
    });
    // One tag for the three pioneers (alc-2), tied to the first bar's value edge.
    if (ends[0].p > 0) tag(ctx, env, 'alc-2', PIO.tag.x, PIO.tag.y, { x: ends[0].x + 120, y: ends[0].y + 6 }, ends[0].p);
    // The adoptantes: a group label on a paper card (Colombia is adoptante, never pionera).
    var G = PIO.group, gp = beat(a, C.adoptantes - 0.04, C.adoptantes + 0.08);
    if (gp > 0) {
      ink.card(ctx, G.x, G.y, G.w, G.h, { seed: 'v09:adoptantes', weight: 3.6, radius: 12, p: gp, peek: m.azul, peekCorner: 'tl' });
      ink.text(ctx, rot(s, 'adoptantes'), G.x + G.w / 2, G.y + G.h / 2 - 17, { size: 30, weight: 700, align: 'center', maxWidth: G.w - 50, fit: true, minSize: 22, p: seg(gp, 0.4, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · computo — 8 state-backed supercomputing clusters in the region against 44 in Europe and
  // Central Asia (2025): exactly that many identical ruled cells (compute is the machine's).

  var COMP = {
    pitch: 30, cell: 19,
    groups: [{ key: 'americaLatina', cue: 'ocho', x: 330, y: 270 }, { key: 'europa', cue: 'cuarenta', x: 900, y: 270 }],
    labelY: 440, labelW: 440, year: { x: 640, y: 64 }, tag: { x: 470, y: 96 }
  };

  function cellCluster(ctx, env, cx, cy, n, p, t) {
    var q = env.pal.maquina, g = env.chart.geom.dots({ x: cx, y: cy, count: n, pitch: COMP.pitch });
    var k = Math.round(n * out3(p)), c = COMP.cell;
    for (var i = 0; i < k; i++) {
      var x = g.centers[2 * i], y = g.centers[2 * i + 1];
      env.ink.rRect(ctx, x - c / 2, y - c / 2, c, c, { color: q.linea, w: 1.2, fill: q.noche });
      var on = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.3);
      env.ink.rRect(ctx, x - 3, y - 3, 6, 6, { color: q.linea, w: 0.8, fill: on > 0.75 ? q.brilloVerde : q.rejilla });
    }
    return g;
  }

  function computo(ctx, s, env) {
    var C = cuesOf(s, 'computo'), ink = env.ink, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = s.at(0), firstTag = null;
    floaters(ctx, s, env, [['estrella', 1200, 520, 34], ['luna', 90, 120, 44]], out3(s.intro));
    // The year the count belongs to (eco-7), written as the scene opens; its tag comes with the cells.
    COMP.groups.forEach(function (gr, i) {
      var text = rot(s, gr.key), n = Math.round(val(env, text)), win = landWindow(C[gr.cue]);
      var gp = beat(a, win[0], win[1]);
      if (gp <= 0) return;
      ink.glow(ctx, gr.x, gr.y, 120 + n * 1.5, env.pal.maquina.linea, 0.18 * gp);
      var g = cellCluster(ctx, env, gr.x, gr.y, n, gp, s.t);
      var lp = beat(a, win[1] - 0.01, win[1] + 0.04);
      ink.text(ctx, text, gr.x, COMP.labelY, { size: 26, weight: 700, align: 'center', maxWidth: COMP.labelW, lineHeight: 1.15, p: lp });
      if (i === 0) firstTag = { x: gr.x + g.radius * 0.7, y: gr.y - g.radius * 0.7, p: lp };
    });
    var a0w = landWindow(C.ocho);
    var yp = beat(a, a0w[0], a0w[1]);
    if (yp > 0) label(ctx, env, rot(s, 'anio'), COMP.year.x, COMP.year.y, 46, { align: 'center', seed: 'v09:anio', p: yp });
    if (firstTag && firstTag.p > 0) tag(ctx, env, 'eco-7', COMP.tag.x + 60, COMP.tag.y + 10, firstTag, firstTag.p);
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · colombia — a warm Andean landscape; a calligraphic gauge on 0–100 reads 55,84 with the
  // ribbon «4.º de 19»; two smaller gauges on the same 0–100 dial: adopción 67,29 and gobernanza
  // 76,01 («gobernanza avanzada»); the group label «Grupo: adoptante».

  var COL = {
    big: { x: 330, y: 268, r: 150 }, small: [{ key: 'adopcion', cue: 'adopcion', x: 820, y: 236 }, { key: 'gobernanza', cue: 'gobernanza', x: 1070, y: 236 }],
    smallR: 88, ribbon: { x: 330, y: 438, w: 230, h: 54 }, tagBig: { x: 520, y: 404 }, tagSmall: { x: 780, y: 404 },
    group: { x: 330, y: 520 }, avanzada: { x: 1070, y: 330 }
  };

  // A cream paper disc behind each dial, so it reads over the mountains.
  function dialPaper(ctx, env, x, y, r, p, seed) {
    env.ink.circle(ctx, x, y, r * 1.12, { fill: env.pal.mundo.lienzo, w: 3.4, seed: seed, p: p });
  }

  function colombia(ctx, s, env) {
    var C = cuesOf(s, 'colombia'), ink = env.ink, chart = env.chart, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), B = COL.big;
    floaters(ctx, s, env, [['sol', 1190, 92, 64, { a: m.rojo }], ['pajaro', 620, 120, 54]], out3(s.intro));
    // The big dial: paper and dial from the start of the line, the needle lands on «55,84».
    var win = landWindow(C.puntaje), dp = out3(beat(a0, 0, Math.max(0.04, win[0])));
    if (dp > 0) {
      dialPaper(ctx, env, B.x, B.y, B.r, dp, 'v09:dial');
      chart.gauge(ctx, { x: B.x, y: B.y, r: B.r, min: 0, max: 100, value: val(env, rot(s, 'puntaje')), p: dp < 1 ? dp * 0.3 : 0.3 + 0.7 * beat(a0, win[0], win[1]),
        color: m.amarillo, ticks: 10 });
    }
    var lp = beat(a0, win[1] - 0.01, win[1] + 0.03);
    if (lp > 0) hero(ctx, env, rot(s, 'puntaje'), B.x, B.y + 34, 64, { align: 'center', seed: 'v09:5584', p: lp });
    // «4.º de 19»: a ribbon under the dial, when the rank is said.
    var rp = beat(a0, C.puesto - 0.04, C.puesto + 0.06), R = COL.ribbon;
    if (rp > 0) {
      ink.shape(ctx, s.state.colombia.ribbon, { fill: m.rojo, w: 3.4, seed: 'v09:cinta', p: rp, fillScale: 0, fillJitter: 1 });
      faded(ctx, seg(rp, 0.5, 1), function () {
        ink.text(ctx, rot(s, 'puesto'), R.x, R.y - 17, { size: 30, weight: 700, align: 'center', color: m.lienzo });
      });
    }
    // One tag for the score and the rank (alc-3, with the context figure of the rise in rank).
    tag(ctx, env, ['alc-3', 'ctx-colombia-quinto'], COL.tagBig.x, COL.tagBig.y, { x: B.x + 84, y: B.y + 70 }, lp);
    // Line 2: the two smaller dials, on the same 0–100 dial.
    var lastSmall = null;
    COL.small.forEach(function (g, i) {
      var text = rot(s, g.key), w2 = landWindow(C[g.cue]);
      var sp = out3(beat(a1, w2[0] - 0.12, w2[0]));
      if (sp <= 0) return;
      dialPaper(ctx, env, g.x, g.y, COL.smallR, sp, 'v09:dialchico' + i);
      chart.gauge(ctx, { x: g.x, y: g.y, r: COL.smallR, min: 0, max: 100, value: val(env, text), p: sp < 1 ? sp * 0.3 : 0.3 + 0.7 * beat(a1, w2[0], w2[1]),
        color: m.amarillo, ticks: 10 });
      var vp = beat(a1, w2[1] - 0.01, w2[1] + 0.03);
      if (vp > 0) {
        ink.text(ctx, beforeValue(env, text), g.x, g.y + 18, { size: 20, weight: 700, align: 'center', p: vp });
        hero(ctx, env, chart.parseValue(text).raw, g.x, g.y + 40, 30, { align: 'center', seed: 'v09:chico' + i, p: vp });
        lastSmall = { x: g.x - 20, y: g.y + COL.smallR * 0.9, p: vp };
      }
    });
    if (lastSmall) {
      var first = COL.small[0];
      tag(ctx, env, 'alc-3', COL.tagSmall.x, COL.tagSmall.y, { x: first.x + 30, y: first.y + COL.smallR * 0.84 }, beat(a1, landWindow(C.adopcion)[1] - 0.01,
        landWindow(C.adopcion)[1] + 0.03));
    }
    var av = beat(a1, C.avanzada - 0.03, C.avanzada + 0.08);
    if (av > 0) label(ctx, env, rot(s, 'gobernanzaAvanzada'), COL.avanzada.x, COL.avanzada.y, 30, { align: 'center', seed: 'v09:avanzada', p: av });
    // «Colombia es adoptante, no pionera»: the group label under the big dial.
    var gp = beat(a1, C.adoptante - 0.04, C.adoptante + 0.08);
    if (gp > 0) label(ctx, env, rot(s, 'grupo'), COL.group.x, COL.group.y, 36, { align: 'center', seed: 'v09:grupo', underline: true, p: gp });
  }

  function colombiaLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d');
    env.fig.cordillera(g, 0, 40, 1, { seed: 'v09:andes',
      peaks: [{ x: 0.06, h: 0.32 }, { x: 0.22, h: 0.44, lit: true }, { x: 0.42, h: 0.36, deep: true }, { x: 0.6, h: 0.5, lit: true }, { x: 0.8, h: 0.38, deep: true },
        { x: 0.96, h: 0.46, lit: true }] });
    return { bg: c };
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · conpes — «CONPES 4144» opens like a folding map into six sections, each with its sign, as
  // its axes are named; the counter «106 acciones · 479.273 millones de pesos · hasta 2030».

  var CON = {
    k: 1.42, y: 176, title: { x: 74, y: 30 }, counter: { x: 74, y: 104 }, tag: { x: 900, y: 50 },
    keys: ['etica', 'datos', 'investigacion', 'talento', 'riesgos', 'adopcion'],
    signs: ['volante', 'constelacion', 'microscopio', 'escalera', 'grieta', 'casa'],
    colors: ['rojo', 'azul', 'verde', 'amarillo', 'rojo', 'verde']
  };

  function conpes(ctx, s, env) {
    var C = cuesOf(s, 'conpes'), st = s.state.conpes, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    var pw = 130 * CON.k, ph = 180 * CON.k, cues = [C.e0, C.e1, C.e2, C.e3, C.e4, C.e5];
    // The title, written as the scene opens; its numbers are tagged from then on.
    var TL = label(ctx, env, rot(s, 'documento'), CON.title.x, CON.title.y, 56, { seed: 'v09:conpes', p: beat(a0, 0, 0.12) });
    // How open the map is: panel i unfolds on its axis' word.
    var open = 1;
    for (var i = 1; i < 6; i++) open += seg(a1, cues[i] - 0.05, cues[i]);
    open /= 6;
    var shownW = pw * Math.max(1, open * 6), x0 = (W - shownW) / 2;
    fig.foldingDoc(ctx, x0, CON.y, CON.k, { n: 6, open: open, p: intro });
    // The cover's scribbled lines until the first axis is named.
    var cover = 1 - beat(a1, cues[0] - 0.05, cues[0]);
    if (cover > 0) {
      faded(ctx, cover, function () {
        for (var j = 0; j < st.scribbles.length; j++) {
          ctx.save();
          ctx.translate(x0, CON.y);
          ink.line(ctx, st.scribbles[j], { w: 2.4, profile: 'even', seed: 'v09:garabato' + j, p: seg(intro, 0.3 + j * 0.1, 0.7 + j * 0.06) });
          ctx.restore();
        }
      });
    }
    // Each section: its sign and its name, as it is said.
    var est = beat(a1, C.estrategia - 0.03, C.estrategia + 0.08);
    for (i = 0; i < 6; i++) {
      var sp = beat(a1, cues[i] - 0.02, cues[i] + 0.06);
      if (sp <= 0 || open * 6 < i + 0.98) continue;
      var px = x0 + i * pw, cx = px + pw / 2;
      // «En 2026, la Estrategia de Datos Abiertos…»: the data section lights up.
      if (i === 1 && est > 0) ink.glow(ctx, cx, CON.y + ph / 2, ph * 0.7, m.amarillo, 0.55 * est);
      fig.sign(ctx, CON.signs[i], cx, CON.y + 70, 82, { seed: 'v09:eje' + i, colors: { a: m[CON.colors[i]] }, p: sp });
      ink.text(ctx, rot(s, CON.keys[i]), cx, CON.y + 128, { size: 21, weight: 700, align: 'center', maxWidth: pw - 24, lineHeight: 1.14, p: seg(sp, 0.4, 1) });
    }
    // The counter lands whole by its chunk and holds; one tag for both numbers (alc-4).
    var win = landWindow(C.contador), cp = beat(a0, win[0], win[1]);
    var CL = null;
    if (cp > 0) CL = ink.text(ctx, rot(s, 'contador'), CON.counter.x, CON.counter.y, { size: 28, weight: 700, p: cp });
    var tp = beat(a0, 0.02, 0.12);
    if (tp > 0) {
      var tb = tag(ctx, env, 'alc-4', CON.tag.x, CON.tag.y, { x: CON.title.x + TL.w + 8, y: CON.title.y + TL.h * 0.62 }, tp);
      if (CL && tb) {
        ink.line(ctx, stableThread(s, CON.counter.x + CL.w + 6, CON.counter.y + 16, tb.hole.x, tb.hole.y), { w: 2.1, profile: 'hair', seed: 'v09:hilo', dot: 1.6, p: cp });
      }
    }
  }
  // A second thread from the counter to the tag's hole (a points array per scene state, reused).
  var threadMemo = new WeakMap();
  function stableThread(s, x0, y0, x1, y1) {
    var prev = threadMemo.get(s);
    if (prev && prev[0] === x0 && prev[1] === y0 && prev[4] === x1 && prev[5] === y1) return prev;
    var pts = [x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + 6, x1, y1];
    threadMemo.set(s, pts);
    return pts;
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · falta — D15's metaphor: a suspension bridge from the lit bank «Uso» toward «Capacidad
  // propia», still under construction; workers carry planks «cómputo», «datos» and «talento»; on
  // the reto, they lay them and the deck grows a little toward the far bank.

  var FAL = {
    x: 640, y: 352, k: 1.5, built: [0.5, 0.58, 0.66, 0.74],
    planks: [{ key: 'computo', skin: 4, hair: 'short', cloth: 'verde', start: 0.04 }, { key: 'datos', skin: 1, hair: 'braids', cloth: 'rojo', start: 0.16 },
      { key: 'talento', skin: 3, hair: 'bun', cloth: 'azul', start: 0.28 }],
    labelY: 210
  };

  function falta(ctx, s, env) {
    var C = cuesOf(s, 'falta'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro), k = FAL.k;
    floaters(ctx, s, env, [['sol', 1180, 92, 60, { a: m.rojo }], ['estrella', 520, 84, 34]], intro);
    var leftX = FAL.x - 285 * k, rightX = FAL.x + 285 * k, deckY = FAL.y - 8 * k;
    ink.glow(ctx, leftX, FAL.y - 10, 190, m.amarillo, 0.6 * intro);
    // How many planks are already laid (one per cue of the reto line).
    var laid = [beat(a1, C.reto - 0.04, C.reto + 0.04), beat(a1, C.indicadores - 0.04, C.indicadores + 0.04), beat(a1, C.convertir - 0.04, C.convertir + 0.04)];
    var nLaid = (laid[0] >= 1 ? 1 : 0) + (laid[1] >= 1 ? 1 : 0) + (laid[2] >= 1 ? 1 : 0);
    var br = fig.suspensionBridge(ctx, FAL.x, FAL.y, k, { built: FAL.built[nLaid], seed: 'v09:puente', p: out3(beat(a0, 0, 0.16) * 0.8 + seg(s.t, 0, 0.6) * 0.2) });
    fig.lamp(ctx, leftX, FAL.y - 60, 0.4, { t: s.t, glow: 1, p: out3(beat(a0, 0.06, 0.2)) });
    // Each bank's name, brush-lettered above it (kept clear of the towers).
    label(ctx, env, rot(s, 'orillaUso'), leftX - 10, FAL.labelY + 20, 46, { align: 'center', seed: 'v09:uso', p: beat(a0, 0.08, 0.2) });
    label(ctx, env, rot(s, 'orillaCapacidad'), rightX + 20, FAL.labelY, 38, { align: 'center', seed: 'v09:capacidad', maxWidth: 250, maxLines: 2, p: beat(a0, 0.12, 0.24) });
    // The workers walk the deck toward its end with their planks, then lay them on the reto line.
    FAL.planks.forEach(function (pk, i) {
      var arrive = inOut3(beat(a0, pk.start, Math.max(pk.start + 0.3, C.pide)));
      if (arrive <= 0 && s.line < 1) return;
      var endX = br.end.x - 30 * k - i * 46;
      var wx = lerp(leftX + 40, endX, arrive), wy = deckY - 2;
      var bob = Math.abs(Math.sin(s.t * 2.4 + i)) * 2 * (1 - arrive * 0.8);
      var done = laid[i];
      fig.person(ctx, wx, wy, 0.7, { role: 'persona', pose: done >= 1 ? 'standing' : 'carrying', facing: 1, seed: 'v09:obrero' + i, skin: pk.skin, hair: pk.hair,
        cloth: m[pk.cloth], legs: m.tinta, p: out3(beat(a0, pk.start - 0.02, pk.start + 0.06)) });
      if (done < 1) {
        // The plank rides on the shoulder, then is laid at the deck's end.
        var px = lerp(wx + 6, br.end.x + 30 * k, inOut3(done)), py = lerp(wy - 78 - bob, deckY + 2, inOut3(done));
        fig.plank(ctx, px, py, 0.62, { seed: 'v09:tablon' + i, p: out3(beat(a0, pk.start, pk.start + 0.06)) });
        ink.text(ctx, rot(s, pk.key), px, py - 40, { size: 22, weight: 700, align: 'center', p: seg(out3(beat(a0, pk.start + 0.02, pk.start + 0.1)), 0, 1) * (1 - done) });
      }
    });
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · agenda — D16's road with three lanes (Gobiernos, Universidades, Organizaciones) and
  // milestones 2026, 2027, 2028, its priorities written as they are said; a thinner path
  // «Investigación» runs alongside; the note «El orden por año es una secuencia propuesta»; a
  // compass star where the road leads; the common indicator at the end.

  var AGE = {
    x0: 40, x1: 812, tip: 870, top: 168, lane: 80, start: 214,
    stone: { w: 76, h: 44 }, note: { x: 40, y: 104 },
    lanes: ['gobiernos', 'universidades', 'organizaciones'],
    items: [['gobiernos1', 'gobiernos2', 'gobiernos3'], ['universidades1', 'universidades2', 'universidades3'], ['organizaciones1', 'organizaciones2', 'organizaciones3']],
    years: ['hito2026', 'hito2027', 'hito2028'],
    path: { y: 452 }, research: ['microscopio', 'libro', 'espiral', 'constelacion'],
    compass: { x: 1060, y: 132, size: 124 }, comun: { y: 500 }
  };

  function setupAgenda(env) {
    var b = env.ink.drawing('v09:camino', { w: 4.4, jitter: 0.6 }), m = env.pal.mundo, n = AGE.lanes.length;
    var top = AGE.top, bot = top + n * AGE.lane, mid = (top + bot) / 2;
    var band = [AGE.x0, top, AGE.x1, top, AGE.tip, mid, AGE.x1, bot, AGE.x0, bot];
    b.fill(band, { fill: m.lienzoOcre, fillScale: 0, poly: true });
    b.stroke(densify(band, 24), { w: 4.6, closed: true, profile: 'outline' });
    for (var l = 1; l < n; l++) {
      var y = top + l * AGE.lane;
      for (var x = 22 + AGE.x0; x < AGE.x1 - 30; x += 52) b.stroke([x, y, x + 15, y + 0.6, x + 30, y], { w: 5, profile: 'blunt', color: m.lienzo });
    }
    var cw = (AGE.x1 - AGE.start) / 3, cols = [];
    for (var c = 0; c < 3; c++) cols.push({ x: AGE.start + c * cw, w: cw, cx: AGE.start + (c + 0.5) * cw });
    cols.forEach(function (co) {
      for (var yy = top + 12; yy < bot - 8; yy += 15) b.dot(co.x, yy, 2.1, { color: env.pal.mix(m.tinta, m.lienzoOcre, 0.45) });
    });
    cols.forEach(function (co, i) {
      var w = AGE.stone.w / 2, h = AGE.stone.h, cx = co.cx;
      b.shape([cx - w, top + 4, cx - w + 2, top - h * 0.55, cx - w * 0.6, top - h * 0.92, cx, top - h, cx + w * 0.6, top - h * 0.92, cx + w - 2, top - h * 0.55, cx + w, top + 4],
        { fill: i % 2 ? m.lienzo : env.pal.mix(m.lienzo, m.amarillo, 0.35), w: 3.8 });
    });
    // The thinner research path alongside the road.
    var py = AGE.path.y, path = [];
    for (var k = 0; k <= 16; k++) { var u = k / 16; path.push(lerp(AGE.x0, AGE.tip + 40, u), py + Math.sin(u * TAU * 1.2) * 8); }
    // The compass rose behind the star (D16's).
    var rb = env.ink.drawing('v09:rosa', { w: 3, jitter: 0.6 }), rr = env.rng('v09:rosa'), ring = [];
    rb.blob(5, 6, 52, 48, { fill: m.amarillo, line: false, irr: 0.12, n: 9 });
    for (var i2 = 0; i2 < 18; i2++) { var an = i2 / 18 * TAU, rad = 66 + rr.jitter(2.5); ring.push(Math.cos(an) * rad, Math.sin(an) * rad); }
    rb.stroke(ring, { w: 3, closed: true, profile: 'swell' });
    for (var j = 0; j < 4; j++) {
      var tt = -Math.PI / 2 + j * Math.PI / 2;
      rb.stroke([Math.cos(tt) * 58, Math.sin(tt) * 58, Math.cos(tt) * 74, Math.sin(tt) * 74], { w: j === 0 ? 4.6 : 3.4, profile: 'blunt' });
    }
    return { road: b.done(), cols: cols, path: path, pathG: samplePath(env.ink, path, 5), rose: rb.done() };
  }

  function agenda(ctx, s, env) {
    var C = cuesOf(s, 'agenda'), st = s.state.agenda, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = [s.at(0), s.at(1), s.at(2), s.at(3)], intro = out3(s.intro);
    // The road and its stones draw on as the scene opens; the years stand on the stones.
    var rp = out3(seg(s.t, 0, 0.6) * 0.25 + beat(a[0], 0, 0.14) * 0.75);
    ink.draw(ctx, st.road, 0, 0, 1, { p: rp });
    AGE.years.forEach(function (key, i) {
      ink.text(ctx, rot(s, key), st.cols[i].cx, AGE.top - AGE.stone.h * 0.5 - 12, { size: 23, weight: 700, align: 'center', p: seg(rp, 0.6 + i * 0.1, 0.8 + i * 0.1) });
    });
    // The KB note: the order by year is only a proposed sequence (after the chapter title).
    ink.text(ctx, rot(s, 'nota'), AGE.note.x, AGE.note.y, { size: 21, italic: true, color: env.pal.mix(m.tinta, m.lienzo, 0.15), p: beat(a[0], 0.1, 0.2) });
    // The compass star where the road leads; on the last line it settles toward the road's end.
    var sway = noise(s.t * 0.25, 'v09:brujula') * 0.12 * calm(s), turn = inOut3(beat(a[3], C.comun - 0.05, C.comun + 0.3));
    faded(ctx, intro, function () {
      ink.draw(ctx, st.rose, AGE.compass.x, AGE.compass.y, AGE.compass.size / 124);
      fig.sign(ctx, 'brujula', AGE.compass.x, AGE.compass.y, AGE.compass.size, { seed: 'v09:brujula', rot: lerp(0.42, -1.1, turn) + sway });
    });
    // Each lane: its name lights up when said, its three priorities written under the milestones.
    var laneCue = [[0, C.gob], [1, C.uni], [1, C.org]];
    var itemCue = [[C.g0, C.g1, C.g2], [C.u0, C.u1, C.u2], [C.o0, C.o1, C.o2]];
    AGE.lanes.forEach(function (key, l) {
      var li = laneCue[l][0], lc = laneCue[l][1], y0 = AGE.top + l * AGE.lane, cy = y0 + AGE.lane / 2;
      var on = beat(a[li], lc - 0.03, lc + 0.03);
      var said = li === 0 ? s.line >= 0 && a[0] > lc : s.line > 1 || (s.line === 1 && a[1] > lc);
      var active = l === 0 ? s.line === 0 && a[0] > lc : l === 1 ? s.line === 1 && a[1] > C.uni && a[1] < C.org : s.line === 1 && a[1] > C.org;
      if (active) ink.blob(ctx, AGE.x0 + 86, cy, 88, 24, { fill: m.amarillo, line: false, irr: 0.15, seed: 'v09:carril' + l, alpha: 0.85 });
      ink.text(ctx, rot(s, key), AGE.x0 + 14, cy - 14, { size: 25, weight: 700, font: 'display', maxWidth: AGE.start - AGE.x0 - 22, fit: true, minSize: 16,
        p: seg(rp, 0.5, 0.9) * (said || on > 0 ? 1 : 0.55) });
      for (var c = 0; c < 3; c++) {
        var ip = beat(a[li], itemCue[l][c] - 0.03, itemCue[l][c] + 0.06);
        if (ip <= 0) continue;
        var col = st.cols[c];
        ink.text(ctx, rot(s, AGE.items[l][c]), col.cx, cy - 12, { size: 20, weight: 700, align: 'center', maxWidth: col.w - 26, maxLines: 2, lineHeight: 1.12, p: ip });
      }
    });
    // Line 3: the thinner research path draws on with its name; signs bloom along it.
    var pp = beat(a[2], 0, 0.14);
    if (pp > 0) {
      ink.line(ctx, st.path, { w: 18, profile: 'even', color: m.lienzoOcre, seed: 'v09:sendero', p: pp });
      ink.line(ctx, st.path, { w: 3, profile: 'swell', seed: 'v09:senderoborde', p: pp, dot: 'detached' });
      ink.text(ctx, rot(s, 'investigacion'), AGE.x0 + 10, AGE.path.y - 46, { size: 23, weight: 700, font: 'display', p: seg(pp, 0.4, 1) });
      var rc = [C.r0, C.r1, C.r2, C.r3];
      for (var r = 0; r < 4; r++) {
        var sp = beat(a[2], rc[r] - 0.03, rc[r] + 0.06);
        if (sp <= 0) continue;
        pathAt(st.pathG, 0.3 + r * 0.17, Q1);
        fig.sign(ctx, AGE.research[r], Q1.x, Q1.y - 30 + Math.sin(s.t * 0.8 + r) * 2 * calm(s), 46, { seed: 'v09:inv' + r, p: sp,
          colors: { a: [m.rojo, m.azul, m.verde, m.amarillo][r] } });
      }
    }
    // Line 4: one indicator common to all.
    var cp = beat(a[3], C.comun - 0.03, C.comun + 0.2);
    if (cp > 0) label(ctx, env, rot(s, 'comun'), 470, AGE.comun.y, 30, { align: 'center', maxWidth: 860, fit: true, minSize: 22, seed: 'v09:comun', underline: true, p: cp });
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · escenarios — four small windows open on the horizon, each with its pattern fill (the
  // course legend) and its scene: many lamps, little change; lamps on short ruled leashes with a
  // reviewer; a ladder without its first rung; a large stamp «Obligaciones». The lectora asks.

  var ESC = {
    w: 238, h: 206, y: 112, x0: 64, step: 290, titleY: 334,
    keys: ['difusion', 'transformacion', 'automatizacion', 'reaccion'],
    lectora: { x: 1176, y: 566, k: 1.5 }
  };

  function windowScene(ctx, s, env, i, x, y, p) {
    var fig = env.fig, ink = env.ink, m = env.pal.mundo, q = env.pal.maquina, w = ESC.w, h = ESC.h, t = s.t, c = calm(s);
    switch (i) {
      case 0:   // many lamps, little change: they hover over an unchanged little house
        for (var k = 0; k < 6; k++) {
          var lx = x + 36 + (k % 3) * 82, ly = y + 42 + Math.floor(k / 3) * 54 + Math.sin(t * 0.9 + k) * 2 * c;
          fig.lamp(ctx, lx, ly, 0.2, { t: t + k, p: seg(p, k * 0.08, 0.5 + k * 0.08) });
        }
        fig.sign(ctx, 'casa', x + w / 2, y + h - 44, 70, { seed: 'v09:casa', p: seg(p, 0.3, 0.9) });
        break;
      case 1:   // lamps on short, ruled leashes, held by a person who reviews
        var hx = x + 70, hy = y + h - 96;
        fig.person(ctx, x + 62, y + h - 10, 0.9, { role: 'investigadora', pose: 'standing', prop: 'clipboard', facing: 1, seed: 'v09:revisora', skin: 4, hair: 'curly', p: seg(p, 0, 0.6) });
        for (var j = 0; j < 2; j++) {
          var ex = x + 160 + j * 46, ey = y + 58 + j * 50 + Math.sin(t * 0.8 + j * 2) * 3 * c;
          ink.rLine(ctx, hx + 14, hy, ex, ey, { color: q.rejilla, w: 1.4, p: seg(p, 0.4, 0.8) });
          fig.lamp(ctx, ex, ey, 0.24, { t: t + j, p: seg(p, 0.3 + j * 0.1, 0.8) });
        }
        break;
      case 2:   // a ladder without its first rung, a young person looking up
        fig.youngLadder(ctx, x + w / 2 + 34, y + h - 10, 0.66, { seed: 'v09:escalera', p: p });
        break;
      case 3:   // a large stamp presses «Obligaciones»
        var press = seg(p, 0.5, 0.75), lift = 1 - press;
        var mark = seg(p, 0.7, 0.85);
        if (mark > 0) {
          ctx.save();
          ctx.translate(x + w / 2, y + h - 56);
          ctx.rotate(-0.06);
          ctx.globalAlpha *= mark;
          ink.rRect(ctx, -96, -26, 192, 52, { color: env.pal.shade(m.rojo, -0.15), w: 3.2 });
          ink.text(ctx, rot(s, 'sello'), 0, -15, { size: 26, weight: 700, align: 'center', color: env.pal.shade(m.rojo, -0.25) });
          ctx.restore();
        }
        fig.stamp(ctx, x + w / 2, y + h - 84 - lift * 60, 1.3, { seed: 'v09:sello', p: seg(p, 0, 0.4) });
        break;
    }
  }

  function escenarios(ctx, s, env) {
    var C = cuesOf(s, 'escenarios'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), a2 = s.at(2);
    floaters(ctx, s, env, [['pajaro', 1180, 470, 56], ['estrella', 640, 470, 30]], out3(s.intro));
    var opens = [beat(a0, C.w0 - 0.03, C.w0 + 0.12), beat(a0, C.w1 - 0.03, C.w1 + 0.12), beat(a1, C.w2 - 0.03, C.w2 + 0.14), beat(a1, C.w3 - 0.03, C.sello + 0.06)];
    var pats = env.pal.legend.escenarios;
    for (var i = 0; i < 4; i++) {
      var op = opens[i];
      if (op <= 0) continue;
      var x = ESC.x0 + i * ESC.step, y = ESC.y + Math.sin(s.t * 0.5 + i * 1.4) * 2 * calm(s);
      var fp = seg(op, 0.25, 0.6);
      if (fp > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 4, y + 4, ESC.w - 8, ESC.h - 8);
        ctx.clip();
        ctx.globalAlpha *= fp;
        fig.pattern(ctx, pats[i].pattern, x, y, ESC.w, ESC.h, { color: env.pal.mix(m.tinta, m.lienzo, 0.72), bg: env.pal.mix(m.lienzo, m.amarillo, 0.12 + 0.06 * (i % 2)),
          seed: 'v09:patron' + i });
        ctx.restore();
      }
      windowScene(ctx, s, env, i, x, y, seg(op, 0.4, 1));
      ink.card(ctx, x, y, ESC.w, ESC.h, { fill: false, weight: 4.2, radius: 10, seed: 'v09:ventana' + i, p: seg(op, 0, 0.4) });
      ink.text(ctx, rot(s, ESC.keys[i]), x + ESC.w / 2, ESC.titleY, { size: 23, weight: 700, align: 'center', maxWidth: ESC.w + 20, maxLines: 2, lineHeight: 1.12,
        p: seg(op, 0.5, 1) });
    }
    // The lectora asks which one is more likely for her organization in 2028.
    var lp = out3(beat(a2, 0, 0.2));
    if (lp > 0) fig.lectora(ctx, ESC.lectora.x, ESC.lectora.y, ESC.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · indicadores — a nine-step notebook ladder: each level with its sign, its name and its
  // question in small handwriting (KB §10, «Marco de indicadores»); two questions are read aloud.

  var IND = {
    keys: ['insumos', 'uso', 'integracion', 'resultado', 'aprendizaje', 'distribucion', 'seguridad', 'sostenibilidad', 'gobernanza'],
    qs: ['preguntaInsumos', 'preguntaUso', 'preguntaIntegracion', 'preguntaResultado', 'preguntaAprendizaje', 'preguntaDistribucion', 'preguntaSeguridad',
      'preguntaSostenibilidad', 'preguntaGobernanza'],
    signs: ['puntos', 'pajaro', 'espiral', 'estrella', 'sol', 'corazon-mano', 'casa', 'mancha', 'volante'],
    railL: 118, railR: 196, y0: 536, step: 51, name: { x: 278 }, q: { x: 520, w: 700 }
  };

  function setupIndicadores(env) {
    var top = IND.y0 - 8 * IND.step - 30, bot = IND.y0 + 26;
    var rails = [[IND.railL + 6, bot, IND.railL - 2, (top + bot) / 2, IND.railL + 2, top], [IND.railR - 6, bot, IND.railR + 2, (top + bot) / 2, IND.railR - 2, top]];
    var rungs = [];
    for (var i = 0; i < 9; i++) { var y = IND.y0 - i * IND.step; rungs.push([IND.railL, y + 1, (IND.railL + IND.railR) / 2, y - 1, IND.railR, y + 1]); }
    return { rails: rails, rungs: rungs };
  }

  function indicadores(ctx, s, env) {
    var C = cuesOf(s, 'indicadores'), st = s.state.indicadores, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1200, 96, 34], ['luna', 1210, 470, 40]], intro);
    st.rails.forEach(function (r, i) { ink.line(ctx, r, { w: 7, profile: 'swell', color: m.madera, seed: 'v09:larguero' + i, p: out3(beat(a0, 0, 0.08)) }); });
    var cues = [C.n0, C.n1, C.n2, C.n3, C.n4, C.n5, C.n6, C.n7, C.n8];
    var hiA = beat(a1, C.apr - 0.04, C.apr + 0.06) * (1 - beat(a1, C.dis - 0.05, C.dis)), hiD = beat(a1, C.dis - 0.04, C.dis + 0.06);
    for (var i = 0; i < 9; i++) {
      var y = IND.y0 - i * IND.step, rp = beat(a0, cues[i] - 0.04, cues[i] + 0.03);
      if (rp <= 0) continue;
      ink.line(ctx, st.rungs[i], { w: 6, profile: 'blunt', seed: 'v09:peldano' + i, p: rp });
      var hi = i === 4 ? hiA : i === 5 ? hiD : 0;
      if (hi > 0) ink.blob(ctx, IND.q.x + 300, y, 330, 24, { fill: m.amarillo, line: false, irr: 0.12, seed: 'v09:resalta' + i, alpha: 0.85 * hi });
      fig.sign(ctx, IND.signs[i], 236, y - 2 + Math.sin(s.t * 0.7 + i) * 1.2 * calm(s), 34, { seed: 'v09:nivel' + i, p: rp,
        colors: { a: env.pal.decor[i % 4] } });
      ink.text(ctx, rot(s, IND.keys[i]), IND.name.x, y - 14, { size: 25, weight: 700, font: 'display', p: rp });
      ink.text(ctx, rot(s, IND.qs[i]), IND.q.x, y - 12, { size: hi > 0 ? lerp(19, 21, hi) : 19, italic: true, weight: hi > 0.5 ? 700 : 400,
        color: env.pal.mix(m.tinta, m.lienzo, 0.12 * (1 - hi)), maxWidth: IND.q.w, maxLines: 1, fit: true, minSize: 15, p: seg(rp, 0.4, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 12 · mensajes — D17's five cards draw on one by one, each with its sign; the second carries
  // «88% vs 39%» with the tag of both figures (adop-1, adop-5).

  var MEN = {
    x: 70, w: 650, y0: 62, h: 84, gap: 12, sign: 62,
    keys: ['capacidad', 'adopcion', 'tareas', 'aprendizaje', 'gobernanza'],
    signs: ['cordillera', 'iceberg', 'escalera-sin-peldano', 'lancha-brujula', 'volante'],
    peeks: ['amarillo', 'celeste', 'rojo', 'verde', 'amarillo'],
    tag: { x: 760, y: 96 }
  };

  function mensajes(ctx, s, env) {
    var C = cuesOf(s, 'mensajes'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['estrella', 1150, 470, 40], ['espiral', 900, 520, 40], ['sol', 1200, 120, 50, { a: m.rojo }]], out3(s.intro));
    var cues = [[a0, C.m0], [a0, C.m1], [a1, C.m2], [a1, C.m3], [a1, C.m4]];
    for (var i = 0; i < 5; i++) {
      var cp = beat(cues[i][0], cues[i][1] - 0.03, cues[i][1] + 0.1);
      if (cp <= 0) continue;
      var x = MEN.x, y = MEN.y0 + i * (MEN.h + MEN.gap);
      ink.card(ctx, x, y, MEN.w, MEN.h, { seed: 'v09:mensaje' + i, weight: 3.4, radius: 12, p: cp, peek: m[MEN.peeks[i]], peekCorner: i % 2 ? 'br' : 'tl' });
      fig.sign(ctx, MEN.signs[i], x + 50, y + MEN.h / 2, MEN.sign, { seed: 'v09:signo' + i, p: seg(cp, 0.2, 0.8) });
      ink.text(ctx, rot(s, MEN.keys[i]), x + 100, y + MEN.h / 2 - 17, { size: 29, weight: 700, maxWidth: MEN.w - 120, p: seg(cp, 0.4, 1) });
      if (i === 1) {
        var win = landWindow(C.cifra), np = beat(a0, win[0], win[1]);
        if (np > 0) {
          var txt = rot(s, 'usoVsImpacto');
          var HL = hero(ctx, env, txt, x + MEN.w - 24, y + MEN.h / 2 - 20, 38, { align: 'right', seed: 'v09:8839', p: np });
          tag(ctx, env, ['adop-1', 'adop-5'], MEN.tag.x, MEN.tag.y, { x: x + MEN.w - 18, y: y + MEN.h / 2 - 4 }, np);
          void HL;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 13 · cierre — D17's metaphor: on the night sea a compass made of an irregular star turns toward
  // a lighthouse; V01's iceberg rests in the distance; the final title; slow fade to navy.

  var CIE = {
    horizon: 0.6, berg: { x: 250, y: 434, k: 0.3 }, light: { x: 1090, y: 452, k: 0.62 },
    star: { x: 620, y: 490, size: 150 }, title: { y: 34, size: 50 },
    stars: [[150, 250, 30], [420, 300, 22], [860, 220, 26], [980, 330, 20], [700, 360, 18], [60, 380, 20]]
  };

  function cierre(ctx, s, env) {
    var C = cuesOf(s, 'cierre'), ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    ground(ctx, s, env);
    var a = s.at(0), c = calm(s);
    CIE.stars.forEach(function (st, i) {
      var tw = 0.86 + 0.14 * Math.sin(s.t * 1.3 + i * 1.7) * c;
      fig.sign(ctx, 'estrella', st[0], st[1], st[2] * tw, { seed: 'v09:noche' + i, colors: { a: m.rojo, ink: i % 3 ? m.amarillo : m.lienzo } });
    });
    fig.sign(ctx, 'luna', 1190, 250, 70, { seed: 'v09:luna' });
    // V01's iceberg, small in the distance, with the lamp on its summit.
    var B = CIE.berg;
    fig.iceberg(ctx, B.x, B.y + Math.sin(s.t * 0.4) * 1.2 * c, B.k, { reveal: 0 });
    fig.lamp(ctx, B.x + 20 * B.k, B.y - 150 * B.k - 8, 0.12, { t: s.t });
    // The lighthouse on its rock, its beam reaching back to the compass.
    var L = CIE.light, S = CIE.star, lampY = L.y - 250 * L.k;
    var bearing = Math.atan2(lampY - S.y, L.x - S.x);
    var beamA = Math.atan2(S.y - lampY, S.x - L.x) + Math.sin(s.t * 0.5) * 0.05 * c;
    ink.blob(ctx, L.x - 4, L.y + 8, 90, 22, { fill: m.siena, w: 3.4, irr: 0.18, n: 9, seed: 'v09:roca' });
    fig.lighthouse(ctx, L.x, L.y, L.k, { beam: beamA });
    // The compass star turns from off-course to the lighthouse's bearing over the line.
    var turn = inOut3(beat(a, 0, 0.55));
    ink.glow(ctx, S.x, S.y, 110, m.amarillo, 0.6);
    ink.wave(ctx, S.x - 96, S.y + 58, S.x + 96, { amp: 3, len: 50, w: 2.8, color: m.lienzo, seed: 'v09:onda' });
    var rotA = lerp(bearing + Math.PI / 2 + 1.6, bearing + Math.PI / 2, turn) + Math.sin(s.t * 0.7) * 0.05 * c;
    fig.sign(ctx, 'brujula', S.x, S.y + Math.sin(s.t * 0.6) * 2 * c, S.size, { seed: 'v09:brujula-final', rot: rotA, colors: { a: m.rojo, ink: m.lienzo, paper: m.amarillo } });
    // The final title, brush-lettered in cream over the night sky.
    ink.letter(ctx, rot(s, 'titulo'), W / 2, CIE.title.y, { size: CIE.title.size, align: 'center', maxWidth: 1180, maxLines: 2, fit: true, minSize: 34,
      seed: 'v09:titulo-final', color: m.lienzo, counters: 0, stars: true, underline: false, p: beat(a, 0, Math.max(0.2, C.gracias - 0.04)) });
    // Slow fade to navy at the very end.
    var f = seg(s.t, s.dur - 2.8, s.dur - 0.3);
    if (f > 0) {
      ctx.save();
      ctx.globalAlpha = inOut3(f);
      ctx.fillStyle = q.noche;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function cierreLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d');
    env.fig.marNocturno(g, 0, 0, 1, { horizon: CIE.horizon, stars: 0, moon: false, seed: 'v09:mar' });
    return { bg: c };
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, m = env.pal.mundo, st = {};
    st.ilia = setupIlia(env);

    // consumo: the stall (posts, striped awning, table) and the open lamp box, in local units.
    var sb = ink.drawing('v09:puesto', { w: 3.6, jitter: 0.8 });
    sb.stroke([-70, 0, -70, -128], { w: 4.4, profile: 'blunt', color: m.madera });
    sb.stroke([70, 0, 70, -128], { w: 4.4, profile: 'blunt', color: m.madera });
    var awning = [-86, -150, 86, -150, 92, -118, -92, -118];
    sb.shape(densify(awning, 16), { fill: '@a', w: 3.6, fillScale: 0, fillJitter: 1 });
    for (var i = -60; i <= 60; i += 40) sb.fill(densify([i - 10, -149, i + 10, -149, i + 12, -119, i - 12, -119], 8), { fill: m.lienzo, fillScale: 0 });
    sb.shape(densify([-88, -4, 88, -4, 88, 8, -88, 8], 16), { fill: m.madera, w: 3.4, fillScale: 0, fillJitter: 0.6 });
    sb.stroke([-80, 8, -82, 70], { w: 3.4, profile: 'blunt' });
    sb.stroke([80, 8, 82, 70], { w: 3.4, profile: 'blunt' });
    var bx = ink.drawing('v09:caja', { w: 3, jitter: 0.6 });
    bx.shape(densify([-24, -36, 24, -36, 24, -4, -24, -4], 8), { fill: m.tierra, w: 3, fillScale: 0, fillJitter: 0.6 });
    bx.shape(densify([-24, -36, -36, -46, -14, -48, -6, -36], 6), { fill: env.pal.mix(m.tierra, m.lienzo, 0.25), w: 2.4, fillScale: 0 });
    bx.shape(densify([24, -36, 36, -46, 14, -48, 6, -36], 6), { fill: env.pal.mix(m.tierra, m.lienzo, 0.25), w: 2.4, fillScale: 0 });
    st.consumo = { stall: sb.done(), box: bx.done(), stream: samplePath(ink, CONS.stream, 5) };

    // colombia: the ribbon under the big dial (straight edges, notched ends).
    var R = COL.ribbon, rx = R.x - R.w / 2, ry = R.y - R.h / 2;
    st.colombia = { ribbon: densify([rx - 22, ry, rx + R.w + 22, ry, rx + R.w + 6, ry + R.h / 2, rx + R.w + 22, ry + R.h, rx - 22, ry + R.h, rx - 6, ry + R.h / 2], 14) };

    // conpes: a few scribbled text lines on the closed cover (local units, panel 0).
    var scr = [], pw = 130 * CON.k;
    for (var k = 0; k < 4; k++) scr.push(ink.wavePoints(26, 60 + k * 34, pw - 26 - (k === 3 ? 50 : 0), 2.2, 22, k));
    st.conpes = { scribbles: scr };

    st.agenda = setupAgenda(env);
    st.indicadores = setupIndicadores(env);
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v09 = {
    setup: setup,
    layers: {
      region: groundLayer('lienzo', {}),
      ilia: groundLayer('datos', {}),
      consumo: consumoLayer,
      pioneros: groundLayer('datos', {}),
      computo: groundLayer('datos', {}),
      colombia: colombiaLayer,
      conpes: groundLayer('personas', {}),
      falta: groundLayer('territorio', { seed: 'v09:orillas', horizon: 0.5, contours: false }),
      agenda: groundLayer('lienzo', {}),
      escenarios: groundLayer('territorio', { seed: 'v09:horizonte', horizon: 0.62, contours: false }),
      indicadores: groundLayer('personas', {}),
      mensajes: groundLayer('personas', {}),
      cierre: cierreLayer
    },
    scenes: {
      region: region,
      ilia: ilia,
      consumo: consumo,
      pioneros: pioneros,
      computo: computo,
      colombia: colombia,
      conpes: conpes,
      falta: falta,
      agenda: agenda,
      escenarios: escenarios,
      indicadores: indicadores,
      mensajes: mensajes,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
