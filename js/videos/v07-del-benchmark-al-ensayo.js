/* js/videos/v07-del-benchmark-al-ensayo.js — V07 «Del benchmark al ensayo» (prompt §13, sesión 5;
 * KB §8; láminas D11–D12).
 *
 * Fourteen scenes in four chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Más ciencia con IA         publicaciones · modelos · frontera-lab
 *   2 Piezas, no el ciclo        ciclo · manuscrito · proposito
 *   3 El semáforo clínico        semaforo · verde · ambar · rojo
 *   4 La escalera de evidencia   escalera · ubicar · antes-de-escalar · cierre
 *
 * The metaphors are the láminas' (prompt §12.2): D11's telescope on its tripod, its microscope and
 * its process bar «Hipótesis › … › Interpretación» (the luz of the deck entry: the first two steps
 * lit, the third half-lit, the last two dark); D12's tall calligraphic traffic light with its lights
 * in fixed positions (top Rojo, middle Ámbar, bottom Verde), each with its sign and label, and its
 * path «Antes de escalar» around a warm hospital. From «semaforo» to the end of that chapter the
 * frame carries the traffic light's color legend, so every evidence chip is in its monochrome form
 * and decorative signs stay in tinta and blue.
 *
 * Honest marks (prompt §3.7): the two paper stacks exactly 63.547 : ~80.150 tall on one zero-based
 * scale (the approximate one with a dotted top); the 5,8–8,8% band and the «menos de 1%» bar on one
 * 0–100% strip; astrophysics replication, PaperArena's best agent and its experts as bars on one
 * 0–100% scale inside the ruled navy panel of the glassware cordillera (the peaks are a metaphor and
 * carry no value); the writing-time bar cut at exactly 83% of its length with the «hasta» tick; the
 * two amber bars on one 0–100% scale (the «~20%» with a dotted cap) beside exactly 21 small doctors;
 * the study stack split at exactly 5% and at the half («casi»: dotted); the 11,8–14,6 band on a
 * 0–100 track (per 100 cases); a tally of exactly 1.400 cells with exactly 258 dark ones; and, in a
 * separate dated panel, the 2,4% sliver of a bar that stands for the devices with clinical studies
 * (their count is unknown, so it is never drawn as a share of 1.016 or of the 258). Benchmarks and
 * laboratory results live in ruled navy panels whose tags sit on the cream page, tied to the panel's
 * edge (a tag's thread does not show on navy); people and places are warm and free; the AI is only
 * the small ruled lamp.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings
 * it, and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds.
 * No string, number or source is typed here: copy comes from s.rotulos (js/data/videos.js), values
 * from env.chart.parseValue(rótulo) (picked by unit where a rótulo also holds a year or a count),
 * sources from env.tags. Draw functions are pure functions of (s, env): motion comes from s.t,
 * geometry is built in setup(). */
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
  // Pieces of a rótulo split at a separator of its own text («PaperArena: …», «A › B › C»).
  function piece(text, sep, i) { var a = String(text).split(sep); return a[i] == null ? '' : a[i].trim(); }
  function pieces(text, sep) { return String(text).split(sep).map(function (x) { return x.trim(); }).filter(Boolean); }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    publicaciones: { lab: [0, 'laboratorio', 'word'], hojas: [0, 'Las publicaciones', 'word'], pilas: [0, '80.150', 'chunk'],
      banda: [1, '5,8%', 'chunk'], antes: [1, 'menos de 1%', 'chunk'] },
    modelos: { o0: [0, 'astronomía', 'word'], o1: [0, 'meteorología', 'word'], o2: [0, 'biología molecular', 'word'],
      o3: [0, 'química', 'word'], o4: [0, 'ciencias de la Tierra', 'word'] },
    'frontera-lab': { irregular: [0, 'irregular', 'word'], chem: [0, 'ChemBench', 'chunk'], astro: [1, 'menos de 20%', 'chunk'],
      arena: [1, 'PaperArena', 'word'], paper: [1, '38,8%', 'chunk'] },
    ciclo: { ilumina: [0, 'Ilumina', 'word'], validar: [0, 'validar e interpretar', 'word'], juicio: [0, 'juicio experto', 'word'] },
    manuscrito: { acepto: [0, 'aceptó', 'word'], pero: [0, 'Pero los descubrimientos', 'chunk'], pocos: [0, 'pocos', 'word'] },
    proposito: { llave: [0, '111 millones', 'chunk'], proteinas: [0, 'proteínas', 'word'], superaron: [0, 'superaron', 'word'],
      especificas: [0, 'evaluaciones específicas', 'word'] },
    semaforo: { desigual: [0, 'desigual', 'word'], semaforo: [0, 'semáforo', 'word'] },
    verde: { cifra: [0, 'hasta 83%', 'chunk'], notas: [0, 'notas clínicas', 'word'] },
    ambar: { sistema: [0, '85,5%', 'chunk'], medicos: [0, 'Un grupo de 21', 'chunk'] },
    rojo: { estudios: [0, 'más de 500', 'chunk'], mitad: [0, 'casi la mitad', 'chunk'], evaluacion: [0, 'Y en una evaluación', 'chunk'],
      danos: [0, '11,8', 'chunk'], fda: [1, '258', 'chunk'], panel: [1, '1.016', 'chunk'], ensayos: [1, '2,4%', 'chunk'] },
    escalera: { r0: [0, 'puntaje en un benchmark', 'word'], r1: [0, 'casos publicados', 'word'], r2: [0, 'datos retrospectivos', 'word'],
      r3: [1, 'validación externa', 'word'], r4: [1, 'ensayo aleatorizado', 'word'], r5: [1, 'seguimiento posdespliegue', 'word'] },
    ubicar: { notas: [0, 'Las notas clínicas', 'word'], tercer: [0, 'tercer escalón', 'word'], multi: [0, 'El sistema multiagente', 'word'],
      segundo: [0, 'en el segundo', 'word'], revision: [1, 'la revisión de estudios', 'word'], primer: [1, 'primer escalón', 'word'],
      quinto: [1, 'casi nunca llega al quinto', 'word'] },
    'antes-de-escalar': { s0: [0, 'validación externa', 'word'], s1: [0, 'seguimiento posdespliegue', 'word'],
      s2: [0, 'representatividad poblacional', 'word'], s3: [0, 'interacción humano–IA', 'word'], s4: [0, 'responsabilidad clínica', 'word'] },
    cierre: {}
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

  // Every number of a data string in reading order, as the engine parses it («21 médicos …: ~20%»
  // → 21, then ≈ 20 %). chart.parseValue returns the first number only, so marks pick theirs by
  // unit or by position from this list; drawing code never types a value.
  function valuesIn(chart, text) {
    var out = [], rest = String(text || ''), off = 0, guard = 0;
    while (rest && guard++ < 16) {
      var pv = chart.parseValue(rest);
      if (!pv) break;
      pv.at = off + pv.index;
      out.push(pv);
      var cut = pv.index + Math.max(1, pv.raw.length);
      off += cut;
      rest = rest.slice(cut);
    }
    return out;
  }
  function valueWith(chart, text, unit) {
    var all = valuesIn(chart, text);
    for (var i = 0; i < all.length; i++) if (all[i].unit === unit) return all[i];
    return null;
  }
  // Counts of a data string that are not years (four digits from 1900 to 2099 without a thousands point).
  function countsIn(chart, text) {
    return valuesIn(chart, text).filter(function (v) { return !(/^\d{4}$/.test(v.raw) && v.value >= 1900 && v.value < 2100); });
  }

  function findVideo(id) {
    var list = (EIA.data && EIA.data.videos) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function sceneOf(video, id) {
    return ((video && video.scenes) || []).filter(function (x) { return x.id === id; })[0] || { rotulos: {}, lines: [] };
  }
  function rotText(video, id, key) { var r = (sceneOf(video, id).rotulos || {})[key]; return r ? r.text : ''; }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function bg(ctx, s, env) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, 'personas', { seed: 'v07:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus static drawing.
  function groundLayer(kind, opts) {
    return function (env) {
      var c = env.canvas(W, H), o = { seed: 'v07:pagina' }, k;
      for (k in opts || {}) o[k] = opts[k];
      env.ink.background(c.getContext('2d'), kind, o);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, color?]; decorative
  // colors only (never the five evidence colors; in the traffic-light chapter never its three
  // colors either); keep them clear of the subtitle band (y > 570) and of the player's overlays.
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v07:fx' + i) * 9, f[2] + noise(t * 0.8, 'v07:fy' + i) * 7, f[3], {
        seed: 'v07:float' + f[0] + i, colors: f[4] ? { a: f[4] } : null, mono: f[4] === 'mono', rot: noise(t * 0.6, 'v07:fr' + i) * 0.14, p: p
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
    var img = env.ink.layer(ctx, 'v07:letra|' + key + '|' + size + '|' + (full.color || '') + '|' + (full.maxWidth || ''), w, h, function (g) {
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
      maxLines: 1, maxWidth: o.maxWidth, fit: !!o.maxWidth, minSize: 18, p: 1 };
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

  // One source tag per figure. maxWidth keeps the longest source label of this video on one line
  // inside its tag; mono: chips in tinta (the traffic-light chapter); scope: 'auto' | true.
  function tagOpts(o) {
    o = o || {};
    return { scale: o.scale || 1.04, maxWidth: 360, mono: !!o.mono, scope: o.scope == null ? 'auto' : o.scope };
  }
  function tag(ctx, env, ids, x, y, anchor, p, o) {
    if (p <= 0) return null;
    var to = tagOpts(o);
    to.x = x; to.y = y; to.anchor = anchor; to.p = p;
    return env.tags.sourceTag(ctx, ids, to);
  }
  function tagSize(ctx, env, ids, o) { return env.tags.measureTag(ctx, ids, tagOpts(o)); }

  // A paper note pinned with a pin (the «No es práctica clínica» note).
  function pinnedNote(ctx, env, text, N, p, seed) {
    if (p <= 0) return;
    var ink = env.ink, m = env.pal.mundo;
    ctx.save();
    ctx.translate(N.x + N.w / 2, N.y + N.h / 2);
    ctx.rotate(N.rot == null ? 0.03 : N.rot);
    ink.card(ctx, -N.w / 2, -N.h / 2, N.w, N.h, { seed: seed, weight: 3, radius: 8, p: p, peek: m.celeste, peekCorner: 'tr' });
    ink.text(ctx, text, 0, -N.h / 2 + 22, { size: N.size || 24, italic: true, weight: 700, align: 'center', maxWidth: N.w - 36, lineHeight: 1.2, p: seg(p, 0.3, 1) });
    ink.circle(ctx, 0, -N.h / 2 + 2, 7, { fill: m.azul, w: 2.2, seed: seed + ':chincheta', p: seg(p, 0, 0.5) });
    ctx.restore();
  }

  function quad(x0, y0, cx, cy, x1, y1, t, outp) {
    var a = 1 - t;
    outp.x = a * a * x0 + 2 * a * t * cx + t * t * x1;
    outp.y = a * a * y0 + 2 * a * t * cy + t * t * y1;
    return outp;
  }
  var Q1 = {}, Q2 = {};   // scratch points, overwritten by every call (no state across frames)

  // An Erlenmeyer flask into a drawing builder (local units, bottom center at x, y; k scale).
  function flaskInto(b, x, y, k, liquid) {
    b.fill([x - 15 * k, y - 22 * k, x + 15 * k, y - 22 * k, x + 27 * k, y - 4 * k, x + 23 * k, y, x - 23 * k, y, x - 27 * k, y - 4 * k],
      { fill: liquid, fillScale: 0 });
    b.shape([x - 6 * k, y - 70 * k, x - 6 * k, y - 46 * k, x - 29 * k, y - 6 * k, x - 25 * k, y, x + 25 * k, y, x + 29 * k, y - 6 * k,
      x + 6 * k, y - 46 * k, x + 6 * k, y - 70 * k], { w: 3, fillScale: 0 });
    b.stroke([x - 10 * k, y - 71 * k, x + 10 * k, y - 71 * k], { w: 3, profile: 'blunt' });
  }

  // ---------------------------------------------------------------------------------------------
  // The lab table of chapter 1 (local origin: the top-left corner of its top; legs to y 118):
  // a warm wooden table with a flask and a rack of test tubes. The microscope (D11's) stands on it.

  function tableDrawing(env) {
    var m = env.pal.mundo, b = env.ink.drawing('v07:mesa', { w: 4, jitter: 0.8 });
    b.stroke([22, 18, 24, 118], { w: 7, profile: 'blunt', color: m.madera });
    b.stroke([308, 18, 306, 118], { w: 7, profile: 'blunt', color: m.madera });
    b.stroke([24, 86, 306, 84], { w: 3.2, profile: 'even' });
    b.shape([0, 0, 332, -2, 336, 18, -2, 20], { fill: m.tierra, w: 4.2 });
    flaskInto(b, 62, -2, 0.82, m.celeste);
    b.shape([214, -6, 290, -6, 290, -14, 214, -14], { fill: m.madera, w: 2.6, fillScale: 0 });
    [[228, m.rojo], [252, m.amarillo], [276, m.verde]].forEach(function (tb) {
      b.fill([tb[0] - 6, -30, tb[0] + 6, -30, tb[0] + 6, -10, tb[0], -6, tb[0] - 6, -10], { fill: tb[1], fillScale: 0 });
      b.shape([tb[0] - 7, -62, tb[0] + 7, -62, tb[0] + 7, -10, tb[0], -4, tb[0] - 7, -10], { w: 2.4, fillScale: 0 });
    });
    return b.done();
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · publicaciones — the telescope on its tripod and the microscope on a warm lab table, the
  // lamp among them; sheets of paper rise like birds and settle into two stacks exactly
  // 63.547 : ~80.150 tall on one zero-based scale (the approximate one with a dotted top); then, on
  // a 0–100% strip, the band 5,8–8,8% and, below it, the «menos de 1%» of 2010.

  var PUB = {
    floor: 452,
    table: { x: 150, y: 334 },
    scope: { x: 78, y: 452, k: 0.7, angle: 0.62 },
    micro: { x: 340, y: 290, k: 0.46 },
    lamp: { x: 274, y: 312, k: 0.26 },
    stacks: [{ key: 'pila2024', x: 604 }, { key: 'pila2025', x: 832 }], sw: 120, H: 290,
    tag: { x: 964, y: 20 },
    strip: { x: 120, len: 760, h: 24, rows: { banda: 488, antes: 528 } },
    tag2: { x: 918, y: 478 },
    birds: 14
  };

  function pubScale(env, s) {
    var hi = env.chart.parseValue(rot(s, 'pila2025')), lo = env.chart.parseValue(rot(s, 'pila2024'));
    var max = Math.max(hi ? hi.value : 1, lo ? lo.value : 1);
    return env.chart.scale(max, 0, PUB.H);
  }

  // A pile of paper sheets: a vertical warm bar on the shared scale (its top edge is the value: a
  // clean stroke, or a row of dots for an approximate value) with faint sheet edges inside it.
  function paperStack(ctx, env, x, text, sc, p, seed) {
    var g = env.chart.bar(ctx, { text: text, scale: sc, x: x, baseY: PUB.floor, h: PUB.sw, orient: 'v', color: env.pal.mix(env.pal.mundo.lienzo, env.pal.mundo.lienzoOcre, 0.6),
      labels: false, seed: seed, p: p });
    if (g.len > 4) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(g.x0 + 3, g.y0 + 3, PUB.sw - 6, g.len - 4);
      ctx.clip();
      ctx.strokeStyle = env.pal.rgba(env.pal.mundo.tinta, 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var y = PUB.floor - 7; y > g.y0; y -= 7) { ctx.moveTo(g.x0 + 6, y); ctx.lineTo(g.x1 - 5 - ((y * 7) % 9), y + 0.5); }
      ctx.stroke();
      ctx.restore();
    }
    return g;
  }

  function sheetBird(ctx, env, s, x, y, k, i, heading) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * 0.35 + Math.sin(s.t * 3 + i) * 0.2);
    ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(s.t * 7 + i * 1.7)));
    env.fig.sheet(ctx, 0, 0, k, { seed: 'v07:hoja' + (i % 3) });
    ctx.restore();
  }

  function labGroup(ctx, s, env, st, x, y, p) {
    env.ink.draw(ctx, st.table, x, y, 1, { p: p });
    env.fig.microscope(ctx, x + PUB.micro.x - PUB.table.x, y + PUB.micro.y - PUB.table.y, PUB.micro.k, { seed: 'v07', p: p });
  }

  function publicaciones(ctx, s, env) {
    var C = cuesOf(s, 'publicaciones'), st = s.state, ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0.2, 1.6));
    floaters(ctx, s, env, [['estrella', 1196, 320, 34, m.amarillo], ['luna', 560, 118, 40], ['espiral', 1210, 420, 30]], seg(s.t, 2, 3.4));
    ink.line(ctx, st.floor, { w: 4, profile: 'blunt', seed: 'v07:suelo', p: intro });
    fig.telescope(ctx, PUB.scope.x, PUB.scope.y, PUB.scope.k, { angle: PUB.scope.angle, seed: 'v07', p: intro });
    labGroup(ctx, s, env, st, PUB.table.x, PUB.table.y, intro);
    var a0 = s.at(0), a1 = s.at(1);
    // «La IA ya está en el laboratorio»: the small lamp joins the instruments on the table.
    var lp = beat(a0, 0.01, Math.max(0.08, C.lab));
    if (lp > 0) fig.lamp(ctx, PUB.lamp.x, PUB.lamp.y + Math.sin(s.t * 1.1) * 1.5 * calm(s), PUB.lamp.k, { t: s.t, p: lp });

    // The stacks grow while the sheets fly in and land exactly when their numbers are said.
    var sc = pubScale(env, s), g0 = Math.max(0.12, C.hojas + 0.02), g1 = Math.max(g0 + 0.12, C.pilas);
    var gp = beat(a0, g0 + 0.06, g1), i;
    var tops = [];
    for (i = 0; i < 2; i++) {
      var S = PUB.stacks[i];
      var g = paperStack(ctx, env, S.x, rot(s, S.key), sc, gp, 'v07:pila' + i), pv = env.chart.parseValue(rot(s, S.key));
      g.full = pv ? sc(pv.value) - sc(0) : 0;
      tops.push(g);
    }
    for (i = 0; i < st.flights.length; i++) {
      var f = st.flights[i], u0 = lerp(g0, g1 - 0.1, f.u), e = beat(a0, u0, u0 + 0.1);
      if (e <= 0 || e >= 1) continue;
      var land = beat(a0, g0 + 0.06, g1), hNow = (tops[f.stack].full || 0) * out3(land);
      var ex = PUB.stacks[f.stack].x + PUB.sw / 2 + f.dx, ey = PUB.floor - hNow - 6;
      var ee = inOut3(e);
      quad(f.x0, f.y0, f.cx, f.cy, ex, ey, ee, Q1);
      quad(f.x0, f.y0, f.cx, f.cy, ex, ey, Math.min(1, ee + 0.02), Q2);
      sheetBird(ctx, env, s, Q1.x, Q1.y, lerp(0.42, 0.3, ee), i, Math.atan2(Q2.y - Q1.y, Q2.x - Q1.x));
    }
    // Labels land with the marks; one tag for both numbers (cien-1), tied to the higher stack.
    var labP = seg(a0, g1, g1 + 0.04), L2025 = null;
    for (i = 0; i < 2; i++) {
      var Sx = PUB.stacks[i].x + PUB.sw / 2, top = PUB.floor - (tops[i].full || 0);
      var L = ink.text(ctx, rot(s, PUB.stacks[i].key), Sx, top - 44, { size: 28, weight: 700, align: 'center', p: labP });
      if (i === 1) L2025 = { x: Sx + L.w / 2, y: top - 30 };
    }
    if (L2025) tag(ctx, env, 'cien-1', PUB.tag.x, PUB.tag.y, { x: L2025.x + 4, y: L2025.y }, seg(a0, g1 - 0.03, g1 + 0.04));

    // Line 2: one 0–100% strip, shared by the band and the 2010 bar (the dashed line is the whole).
    var tp = beat(a1, 0, 0.04);
    if (tp <= 0) return;
    var T = PUB.strip, sc2 = chart.scale(100, T.x, T.len), R = T.rows, mBand = rot(s, 'participacion'), mAntes = rot(s, 'antes');
    chart.baseline(ctx, T.x, R.banda - 8, R.antes + T.h + 8, { p: tp });
    ctx.save();
    ctx.globalAlpha *= 0.4 * tp;
    ink.rLine(ctx, T.x + T.len, R.banda - 8, T.x + T.len, R.antes + T.h + 8, { color: m.tinta, w: 1.4, dash: [4, 5] });
    ink.rLine(ctx, T.x, R.antes + T.h + 8, T.x + T.len, R.antes + T.h + 8, { color: m.tinta, w: 1.2, dash: [4, 5] });
    ctx.restore();
    var wB = landWindow(C.banda), bp = beat(a1, wB[0], wB[1]);
    var band = chart.band(ctx, { text: mBand, scale: sc2, y: R.banda, h: T.h, color: m.rojo, zeroLine: false, p: bp });
    ink.text(ctx, mBand, band.x1 + 16, R.banda - 1, { size: 22, weight: 700, p: seg(a1, wB[1], wB[1] + 0.04) });
    var wA = landWindow(C.antes), ap = beat(a1, wA[0], wA[1]);
    var gA = chart.bar(ctx, { text: mAntes, scale: sc2, y: R.antes, h: T.h, color: m.azul, labels: false, seed: 'v07:2010', p: ap });
    ink.text(ctx, mAntes, gA.x1 + 30, R.antes - 1, { size: 22, weight: 700, p: seg(a1, wA[1], wA[1] + 0.04) });
    var LBd = ink.measureText(ctx, mBand, { size: 22, weight: 700 });
    tag(ctx, env, 'cien-2', PUB.tag2.x, PUB.tag2.y, { x: band.x1 + 22 + LBd.w, y: R.banda + T.h / 2 }, seg(a1, wB[0], wB[1] + 0.03));
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · modelos — around the lab table, five small ruled lamps (models) each beside the warm sign of
  // its science, as it is named: a star chart, a weather map, a molecule, a flask and a cross-section
  // of the Earth.

  var MOD = {
    table: { x: 472, y: 410 },
    items: [
      { x: 196, y: 330, lamp: [306, 400] }, { x: 350, y: 156, lamp: [460, 222] }, { x: 640, y: 112, lamp: [740, 178] },
      { x: 930, y: 160, lamp: [1030, 228] }, { x: 1084, y: 340, lamp: [972, 410] }
    ]
  };

  function modelObject(ctx, env, st, i, x, y, p) {
    var ink = env.ink, fig = env.fig, m = env.pal.mundo;
    switch (i) {
      case 0:   // star chart: a paper card with a free constellation
        ink.card(ctx, x - 74, y - 56, 148, 112, { seed: 'v07:carta-estelar', weight: 3.4, p: p, fill: env.pal.mix(m.lienzo, m.azul, 0.08) });
        if (p > 0.4) {
          fig.sign(ctx, 'constelacion', x - 6, y - 4, 92, { seed: 'v07:const', p: seg(p, 0.4, 1) });
          fig.sign(ctx, 'estrella', x + 44, y - 32, 26, { seed: 'v07:est0', colors: { a: m.amarillo }, p: seg(p, 0.5, 1) });
          fig.sign(ctx, 'estrella', x - 50, y + 32, 18, { seed: 'v07:est1', colors: { a: m.rojo }, p: seg(p, 0.6, 1) });
        }
        break;
      case 1:   // weather map: isobars, a sun and a rain cloud
        ink.card(ctx, x - 74, y - 56, 148, 112, { seed: 'v07:mapa-tiempo', weight: 3.4, p: p });
        if (p > 0.4) {
          var q = seg(p, 0.4, 1);
          for (var k = 0; k < st.isobars.length; k++) ink.line(ctx, st.isobars[k], { w: 2.2, profile: 'even', closed: true, seed: 'v07:isobara' + k, p: q });
          ink.circle(ctx, x - 38, y - 26, 13, { fill: m.rojo, line: false, seed: 'v07:sol', p: q });
          ink.blob(ctx, x + 36, y + 18, 24, 14, { fill: m.celeste, w: 2.6, seed: 'v07:nube', p: q });
          for (k = 0; k < 3; k++) ink.dot(ctx, x + 24 + k * 12, y + 42 + (k % 2) * 4, 2.6 * q, m.azul);
        }
        break;
      case 2: ink.draw(ctx, st.molecule, x, y, 1, { p: p }); break;
      case 3: ink.draw(ctx, st.flask, x, y, 1, { p: p }); break;
      case 4: ink.draw(ctx, st.earth, x, y, 1, { p: p }); break;
    }
  }

  function modelos(ctx, s, env) {
    var C = cuesOf(s, 'modelos'), st = s.state;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0, 1));
    floaters(ctx, s, env, [['luna', 1200, 90, 40], ['espiral', 80, 110, 34]], intro);
    labGroup(ctx, s, env, st, MOD.table.x, MOD.table.y, intro);
    var a = s.at(0), cues = [C.o0, C.o1, C.o2, C.o3, C.o4];
    for (var i = 0; i < MOD.items.length; i++) {
      var it = MOD.items[i], op = beat(a, cues[i] - 0.04, cues[i] + 0.1);
      if (op <= 0) continue;
      var dy = Math.sin(s.t * 0.8 + i * 1.3) * 2 * calm(s);
      modelObject(ctx, env, st, i, it.x, it.y + dy, op);
      var lpi = beat(a, cues[i] + 0.02, cues[i] + 0.14);
      if (lpi > 0) env.fig.lamp(ctx, it.lamp[0], it.lamp[1] + dy, 0.3, { t: s.t + i, p: lpi });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · frontera-lab — a small cordillera of laboratory glassware inside a ruled navy panel: the
  // tall flask is the peak (ChemBench; a metaphor, no value), two deep valleys between the vessels
  // hold their bars on ONE 0–100% scale: astrophysics replication «menos de 20%» (open arrowhead),
  // PaperArena's best agent 38,8% and its experts 83,5%. Tags sit on the cream page.

  var LAB = {
    panel: { x: 40, y: 40, w: 840, h: 432 },
    floor: 440, H100: 280, barW: 48,
    valleys: [{ x0: 150, x1: 340, name: 'astrofisica', bars: [245] }, { x0: 404, x1: 694, name: 'paperArena', bars: [466, 616] }],
    peak: { neck: 772, top: 84 },
    chemLabel: { x: 752, y: 60, w: 300 },
    tags: { chem: { x: 900, y: 44 }, astro: { x: 230, y: 486 }, paper: { x: 526, y: 486 } }
  };
  function labY(v) { return LAB.floor - v / 100 * LAB.H100; }

  function fronteraLab(ctx, s, env) {
    var C = cuesOf(s, 'frontera-lab'), st = s.state, ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1180, 470, 30, m.amarillo], ['pajaro', 1100, 540, 44]], out3(s.intro));
    var P = LAB.panel, a0 = s.at(0), a1 = s.at(1), i;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.1, 1.1)), 14);
    // The glassware draws on with «la frontera es irregular»; the peak's liquid glows.
    var gp = beat(a0, 0.02, Math.max(0.16, C.irregular + 0.05));
    if (gp > 0) {
      ctx.save();
      ctx.globalAlpha *= gp;
      for (i = 0; i < st.glass.liquids.length; i++) {
        var lq = st.glass.liquids[i];
        ink.rPoly(ctx, lq.pts, { closed: true, fill: env.pal.rgba(lq.peak ? q.brilloVerde : q.linea, lq.peak ? 0.42 : 0.22), stroke: false });
      }
      ctx.restore();
      for (i = 0; i < st.glass.outlines.length; i++) ink.rPoly(ctx, st.glass.outlines[i], { color: q.linea, w: 1.7, p: gp });
      ink.rLine(ctx, P.x + 14, LAB.floor, P.x + P.w - 14, LAB.floor, { color: q.linea, w: 1.4, p: gp });
    }
    var cp = beat(a0, C.chem - 0.06, C.chem + 0.04);
    if (cp > 0) {
      ink.glow(ctx, LAB.peak.neck + 10, LAB.peak.top + 40, 70, q.brilloVerde, 0.5 * cp);
      var CL = LAB.chemLabel;
      var L = ink.text(ctx, rot(s, 'chembench'), CL.x, CL.y, { size: 21, weight: 700, color: m.lienzo, maxWidth: CL.w, lineHeight: 1.2, align: 'right', p: cp });
      // A ruled leader to the panel's edge, where the tag's thread takes over on the cream page.
      ink.rLine(ctx, LAB.peak.neck + 26, CL.y + 12, P.x + P.w, CL.y + 12, { color: q.linea, w: 1.2, p: cp });
      tag(ctx, env, 'cap-7', LAB.tags.chem.x, LAB.tags.chem.y, { x: P.x + P.w, y: CL.y + 12 }, cp);
      void L;
    }

    // Line 2: the bars of the two valleys on one zero-based scale.
    var sc = chart.scale(100, 0, LAB.H100), V0 = LAB.valleys[0], V1 = LAB.valleys[1];
    var astro = rot(s, 'astrofisica'), paper = rot(s, 'paperArena');
    var w1 = landWindow(C.astro), b1 = beat(a1, w1[0], w1[1]);
    var np = beat(a1, 0, 0.04);
    if (np > 0) ink.text(ctx, piece(astro, ':', 0), (V0.x0 + V0.x1) / 2, 116, { size: 20, weight: 700, color: m.lienzo, align: 'center', maxWidth: V0.x1 - V0.x0 - 8, lineHeight: 1.18, p: np });
    var vA = piece(astro, ':', 1), xA = V0.bars[0] - LAB.barW / 2;
    if (b1 > 0) {
      var gA = chart.bar(ctx, { text: vA, scale: sc, x: xA, baseY: LAB.floor, h: LAB.barW, orient: 'v', style: 'ruled', labels: false, seed: 'v07:astro', p: b1 });
      ink.text(ctx, vA, V0.bars[0], gA.y0 - 58, { size: 21, weight: 700, color: m.lienzo, align: 'center', p: seg(a1, w1[1], w1[1] + 0.03) });
      ink.rLine(ctx, V0.bars[0], LAB.floor, V0.bars[0], P.y + P.h, { color: q.linea, w: 1.2 });
    }
    tag(ctx, env, 'cap-5', LAB.tags.astro.x, LAB.tags.astro.y, { x: V0.bars[0], y: P.y + P.h }, beat(a1, w1[0], w1[0] + 0.05));
    var ap = beat(a1, C.arena - 0.02, C.arena + 0.04);
    if (ap > 0) ink.text(ctx, piece(paper, ':', 0), (V1.x0 + V1.x1) / 2, 116, { size: 22, weight: 700, color: m.lienzo, align: 'center', p: ap });
    var vals = valuesIn(chart, paper).filter(function (v) { return v.unit === '%'; });
    var w2 = landWindow(C.paper), roles = ['agente', 'expertos'], mid = (V1.bars[0] + V1.bars[1]) / 2;
    for (i = 0; i < 2 && i < vals.length; i++) {
      var bx = V1.bars[i], bp = beat(a1, w2[0] + i * 0.02, w2[1]);
      if (bp <= 0) continue;
      var g = chart.bar(ctx, { value: vals[i].value, scale: sc, x: bx - LAB.barW / 2, baseY: LAB.floor, h: LAB.barW, orient: 'v', style: 'ruled',
        color: i ? m.amarillo : q.linea, labels: false, seed: 'v07:arena' + i, p: bp });
      var lp = seg(a1, w2[1], w2[1] + 0.03);
      ink.text(ctx, vals[i].raw, bx, g.y0 - 30, { size: 21, weight: 700, color: m.lienzo, align: 'center', p: lp });
      ink.text(ctx, rot(s, roles[i]), bx, LAB.floor + 4, { size: 15, color: m.lienzo, align: 'center', maxWidth: 170, p: lp });
      if (i === 0 && lp > 0) env.fig.lamp(ctx, bx, g.y0 - 52, 0.2, { t: s.t, p: lp });
    }
    if (beat(a1, w2[0], w2[1]) > 0) ink.rLine(ctx, mid, LAB.floor + 26, mid, P.y + P.h, { color: q.linea, w: 1.2 });
    tag(ctx, env, 'cap-6', LAB.tags.paper.x, LAB.tags.paper.y, { x: mid, y: P.y + P.h }, beat(a1, w2[0], w2[0] + 0.05));
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · ciclo — lámina D11's process bar draws on; the telescope's beam lights the first two steps
  // fully and the third halfway (the deck's luz); the last two stay in shadow, where two people hold
  // a pen and a lens: validating and interpreting stay with expert judgement.

  var CIC = {
    card: { x: 108, y: 196, w: 1064, h: 136 },
    bar: { x: 132, y: 222, w: 1016, h: 84, tip: 26, gap: 10, size: 25 },
    scope: { x: 214, y: 566, k: 0.78, angle: 0.9 },
    people: [{ x: 862, role: 'investigadora', pose: 'writing', skin: 4, hair: 'curly', prop: 'notebook', tool: 'pen' },
      { x: 1060, role: 'docente', pose: 'pointing', skin: 1, hair: 'bun', tool: 'lens' }],
    feet: 568, k: 1.72
  };

  function chevron(i, n) {
    var B = CIC.bar, w = B.w / n, g = B.gap / 2, x0 = B.x + i * w + (i > 0 ? g : 0), x1 = B.x + (i + 1) * w - (i < n - 1 ? g : 0);
    var y0 = B.y, y1 = B.y + B.h, ym = (y0 + y1) / 2, t = B.tip, pts = [x0, y0, x1, y0];
    if (i < n - 1) pts.push(x1 + t, ym);
    pts.push(x1, y1, x0, y1);
    if (i > 0) pts.push(x0 + t, ym);
    return { pts: pts, x0: x0, x1: x1, y0: y0, y1: y1, mid: (x0 + x1) / 2 + (i > 0 ? t / 2 : 0) };
  }
  function densify(pts, step) {
    var out = [], n = pts.length / 2;
    for (var i = 0; i < n; i++) {
      var ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[(2 * i + 2) % pts.length], by = pts[(2 * i + 3) % pts.length];
      var k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
      for (var j = 0; j < k; j++) out.push(ax + (bx - ax) * j / k, ay + (by - ay) * j / k);
    }
    return out;
  }
  function clipSide(pts, xs, keepLeft) {
    var out = [], n = pts.length / 2;
    for (var i = 0; i < n; i++) {
      var ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[(2 * i + 2) % pts.length], by = pts[(2 * i + 3) % pts.length];
      var ain = keepLeft ? ax <= xs : ax >= xs, bin = keepLeft ? bx <= xs : bx >= xs;
      if (ain) out.push(ax, ay);
      if (ain !== bin) { var t = (xs - ax) / (bx - ax); out.push(xs, ay + (by - ay) * t); }
    }
    return out;
  }
  function polyFill(ctx, pts, color, alpha) {
    if (alpha <= 0 || pts.length < 6) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i += 2) ctx[i ? 'lineTo' : 'moveTo'](pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function ciclo(ctx, s, env) {
    var C = cuesOf(s, 'ciclo'), st = s.state.cycle, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 760, 104, 34, m.amarillo], ['constelacion', 1090, 110, 70]], seg(s.t, 2, 3.2));
    var a = s.at(0), B = CIC.bar, i;
    var draw = seg(s.t, 0.4, lineT(s, 0, Math.min(0.3, C.ilumina)));
    ink.card(ctx, CIC.card.x, CIC.card.y, CIC.card.w, CIC.card.h, { seed: 'v07:mapa', weight: 4, radius: 12, peek: m.celeste, peekCorner: 'tr', p: draw });
    var light = beat(a, C.ilumina - 0.02, C.ilumina + 0.14), shade = beat(a, C.ilumina + 0.06, C.validar);
    var dark = env.pal.mix(m.tinta, m.azul, 0.22);
    // The beam from the telescope's lens to the lit part of the bar.
    var lens = fig.telescope(ctx, CIC.scope.x, CIC.scope.y, CIC.scope.k, { angle: CIC.scope.angle, seed: 'v07', p: seg(draw, 0.2, 1) });
    for (i = 0; i < st.segs.length; i++) {
      var c = st.segs[i];
      if (c.luz >= 1) polyFill(ctx, c.pts, m.amarillo, light);
      else if (c.luz <= 0) polyFill(ctx, c.pts, dark, shade);
      else { polyFill(ctx, c.left, m.amarillo, light); polyFill(ctx, c.right, dark, shade); }
      if (c.luz > 0 && light > 0) ink.glow(ctx, c.luz >= 1 ? c.mid : (c.x0 + c.split) / 2, (c.y0 + c.y1) / 2, c.luz >= 1 ? 110 : 70, m.amarillo, 0.5 * light);
      ink.line(ctx, c.outline, { w: 3.4, closed: true, profile: 'outline', seed: 'v07:paso' + i, p: seg(draw, i * 0.12, 0.5 + i * 0.12) });
    }
    if (light > 0 && lens && lens.lens && st.reach > 0) {
      var lx = lens.lens.x, ly = lens.lens.y, e = out3(light);
      polyFill(ctx, [lx, ly, B.x + 8, B.y + B.h, lerp(lx, st.reach, e), lerp(ly, B.y + B.h, e)], m.amarillo, 0.3);
      ink.glow(ctx, lx, ly, 40, m.amarillo, 0.6 * light);
    }
    for (i = 0; i < st.labels.length; i++) {
      var sg = st.segs[i], lab = st.labels[i], o = { size: B.size, weight: 700, align: 'center', maxWidth: sg.x1 - sg.x0 - B.tip - 6, maxLines: 1, fit: true, minSize: 15 };
      var lay = ink.measureText(ctx, lab, o), ty = (sg.y0 + sg.y1) / 2 - lay.h / 2 + 1, lpp = seg(draw, 0.5 + i * 0.08, 0.8 + i * 0.04);
      if (lpp <= 0) continue;
      var lit = sg.luz >= 1 ? light : sg.luz <= 0 ? 0 : -1;
      if (lit === -1) {
        // Half-lit: the label in tinta over the lit half, in cream over the dark half.
        o.p = lpp; o.color = m.tinta;
        ink.text(ctx, lab, sg.mid, ty, o);
        ctx.save();
        ctx.beginPath();
        ctx.rect(sg.split, sg.y0 - 2, sg.x1 + B.tip - sg.split, sg.y1 - sg.y0 + 4);
        ctx.clip();
        o.color = m.lienzo; o.p = lpp * shade;
        ink.text(ctx, lab, sg.mid, ty, o);
        ctx.restore();
      } else {
        o.p = lpp; o.color = sg.luz <= 0 ? env.pal.mix(m.tinta, m.lienzo, shade) : m.tinta;
        ink.text(ctx, lab, sg.mid, ty, o);
      }
    }
    // Validating and interpreting: two people under the dark steps, a pen and a lens in hand.
    for (i = 0; i < CIC.people.length; i++) {
      var pp = CIC.people[i], ppP = beat(a, C.validar - 0.04 + i * 0.05, C.validar + 0.12 + i * 0.05);
      if (ppP <= 0) continue;
      var hp = fig.person(ctx, pp.x, CIC.feet, CIC.k, { role: pp.role, pose: pp.pose, prop: pp.prop, skin: pp.skin, hair: pp.hair, seed: 'v07:ciclo' + i,
        facing: -1, height: 1, p: ppP });
      var hand = hp.hand.right, tool = seg(ppP, 0.6, 1);
      if (tool <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= tool;
      if (pp.tool === 'pen') ink.line(ctx, st.pen, { w: 3.2, profile: 'swell', seed: 'v07:pluma', color: m.tinta }), ink.dot(ctx, st.pen[0], st.pen[1], 2.6, m.rojo);
      else {
        ink.circle(ctx, hand.x - 14, hand.y - 18, 18, { fill: env.pal.mix(m.celeste, m.lienzo, 0.4), w: 3.4, seed: 'v07:lente' });
        ink.line(ctx, st.lensGlint, { w: 2.2, profile: 'hair', color: m.lienzo, seed: 'v07:brillo' });
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · manuscrito — at a workshop table, a manuscript drawn entirely in ruled lines (machine-made)
  // receives a small «Aceptado» stamp; beside it, a drawer «descubrimientos experimentales
  // confirmados» holds only a few cards. Then more ruled manuscripts pile up while the drawer stays
  // nearly empty, and the sentence of the second line is lettered.

  var MAN = {
    desk: { x: 420, y: 566, k: 0.82 },
    page: { x: 318, y: 154, w: 196, h: 238 },
    mark: { x: 432, y: 328, w: 150, h: 50, rot: -0.12 },
    drawer: { x: 950, y: 392, k: 1.6 },
    tag: { x: 590, y: 196 },
    idea: { y: 24, size: 50 },
    pile: [[-30, 10, -0.08], [26, 4, 0.06], [-56, 18, -0.14], [50, 14, 0.11]]
  };

  function rulePage(ctx, env, x, y, w, h, p, r) {
    var q = env.pal.maquina, ink = env.ink;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (r) ctx.rotate(r);
    var x0 = -w / 2, y0 = -h / 2;
    ink.rRect(ctx, x0, y0, w, h, { fill: q.noche, color: q.linea, w: 1.6, p: p });
    var lp = seg(p, 0.3, 1);
    if (lp > 0) {
      ink.rRect(ctx, x0 + 16, y0 + 16, w - 32, 16, { fill: q.rejilla, color: q.linea, w: 1.2, p: lp });
      for (var i = 0; i < 9; i++) {
        var ly = y0 + 52 + i * 12, col2 = i >= 4;
        ink.rLine(ctx, x0 + 16, ly, x0 + (col2 ? w / 2 - 8 : w - 16), ly, { color: q.linea, w: 1, p: lp });
      }
      ink.rRect(ctx, x0 + w / 2 + 2, y0 + 96, w / 2 - 18, 48, { color: q.linea, w: 1.1, p: lp });
      for (i = 0; i < 6; i++) ink.rLine(ctx, x0 + 16, y0 + 168 + i * 12, x0 + w - 16 - (i === 5 ? 60 : 0), y0 + 168 + i * 12, { color: q.linea, w: 1, p: lp });
    }
    ctx.restore();
  }

  function manuscrito(ctx, s, env) {
    var C = cuesOf(s, 'manuscrito'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0, 1.1)), a0 = s.at(0), a1 = s.at(1), i;
    floaters(ctx, s, env, [['estrella', 1200, 300, 32, m.amarillo], ['espiral', 690, 470, 30]], intro);
    fig.desk(ctx, MAN.desk.x, MAN.desk.y, MAN.desk.k, { p: intro });
    var P = MAN.page;
    // Line 2: more ruled manuscripts pile up behind the first (producing manuscripts).
    for (i = MAN.pile.length - 1; i >= 0; i--) {
      var pe = beat(a1, i * 0.12, 0.2 + i * 0.12);
      if (pe <= 0) continue;
      var off = MAN.pile[i], ee = out3(pe);
      rulePage(ctx, env, P.x + off[0] * ee, P.y + off[1] * ee - (1 - ee) * 60, P.w, P.h, pe, off[2] * ee);
    }
    rulePage(ctx, env, P.x, P.y, P.w, P.h, intro, 0);
    // The stamp comes down on «aceptó», presses, and lifts away, leaving its mark.
    var M = MAN.mark, ac = C.acepto, down = beat(a0, ac - 0.12, ac), up = beat(a0, ac + 0.03, ac + 0.14);
    var pressed = a0 >= ac;
    if (pressed) {
      ctx.save();
      ctx.translate(M.x, M.y);
      ctx.rotate(M.rot);
      var mp = seg(a0, ac, ac + 0.03);
      ink.card(ctx, -M.w / 2, -M.h / 2, M.w, M.h, { fill: false, outline: m.rojo, weight: 3.4, radius: 10, seed: 'v07:sello', p: mp });
      ink.text(ctx, rot(s, 'sello'), 0, -14, { size: 26, weight: 700, align: 'center', color: m.rojo, p: mp });
      ctx.restore();
    }
    if (down > 0 && up < 1) {
      var sy = lerp(-60, M.y - 2, inOut3(down)) - 220 * inOut3(up), sx = M.x + 260 * inOut3(up);
      fig.stamp(ctx, sx, sy, 1.1, { seed: 'v07' });
    }
    tag(ctx, env, 'cien-3', MAN.tag.x, MAN.tag.y, { x: M.x + M.w / 2 - 4, y: M.y - 6 }, seg(a0, ac + 0.01, ac + 0.08));
    // «Pero los descubrimientos experimentales confirmados siguen siendo pocos»: the drawer.
    var D = MAN.drawer, dp = beat(a0, C.pero - 0.02, C.pero + 0.12);
    if (dp > 0) {
      var da = fig.drawer(ctx, D.x, D.y + Math.sin(s.t * 0.7) * 1.2 * calm(s), D.k, { cards: 3, seed: 'v07', p: dp });
      ink.text(ctx, rot(s, 'cajon'), da.label.x, da.label.y - 6, { size: 23, weight: 700, align: 'center', maxWidth: 440, lineHeight: 1.18, p: seg(dp, 0.4, 1) });
      // «pocos»: a soft light over the nearly empty drawer.
      var pk = beat(a0, C.pocos - 0.02, C.pocos + 0.08);
      if (pk > 0) ink.glow(ctx, D.x - 10, D.y - 60, 120, m.amarillo, 0.35 * pk);
    }
    var ip = beat(a1, 0, 0.7);
    if (ip > 0) ink.letter(ctx, rot(s, 'idea'), W / 2, MAN.idea.y, { size: MAN.idea.size, align: 'center', maxWidth: 1180, maxLines: 1, fit: true, seed: 'v07:idea', p: ip });
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · proposito — a huge ring of keys tries a warm lock and fails; a small, precise ruled key
  // «111 millones de parámetros» opens it.

  var PRO = {
    lock: { x: 896, y: 300, k: 2.3 },
    ring: { x: 380, y: 236, k: 2.1, tx: 700, ty: 214 },
    key: { y: 0, k: 1.1, park: 610, fit: 0 },
    label: { dy: 34, size: 27 },
    tag: { dy: 74 }
  };

  function lockKeyhole() { return { x: PRO.lock.x, y: PRO.lock.y + 12 * PRO.lock.k }; }

  function ruledKey(ctx, env, x, y, k, p) {
    var q = env.pal.maquina, ink = env.ink;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.globalAlpha *= clamp01(p * 2);
    ink.glow(ctx, 40, 0, 70, q.linea, 0.35);
    ink.rCircle(ctx, 0, 0, 18, { fill: q.noche, color: q.linea, w: 1.6 });
    ink.rCircle(ctx, 0, 0, 6, { fill: q.rejilla, color: q.linea, w: 1.2 });
    ink.rRect(ctx, 16, -5, 104, 10, { fill: q.noche, color: q.linea, w: 1.4 });
    ink.rRect(ctx, 92, 5, 8, 10, { fill: q.noche, color: q.linea, w: 1.2 });
    ink.rRect(ctx, 106, 5, 8, 7, { fill: q.noche, color: q.linea, w: 1.2 });
    ctx.restore();
  }

  function proposito(ctx, s, env) {
    var C = cuesOf(s, 'proposito'), st = s.state, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0, 1.1)), a = s.at(0);
    floaters(ctx, s, env, [['estrella', 1180, 110, 34, m.amarillo], ['luna', 160, 90, 40], ['espiral', 1190, 470, 30]], intro);
    var Lk = PRO.lock, kh = lockKeyhole();
    // The lock: its shackle lifts once the small key has turned.
    var turn = beat(a, C.superaron + 0.12, C.superaron + 0.18), open = beat(a, C.superaron + 0.16, C.especificas);
    ink.draw(ctx, st.shackle, Lk.x, Lk.y - 34 * out3(open), Lk.k, { p: intro });
    ink.draw(ctx, st.lockBody, Lk.x, Lk.y, Lk.k, { p: intro });
    if (open > 0) ink.glow(ctx, kh.x, kh.y, 120, m.amarillo, 0.45 * open);
    // The huge ring of keys tries first, shakes at the lock, and swings back.
    var R = PRO.ring, go = beat(a, C.proteinas - 0.1, C.proteinas + 0.08), back = beat(a, C.superaron - 0.16, C.superaron - 0.02);
    var rx = lerp(R.x, R.tx, inOut3(go) * (1 - inOut3(back))), ry = lerp(R.y, R.ty, inOut3(go) * (1 - inOut3(back)));
    var shake = go >= 1 && back <= 0 ? Math.sin(s.t * 14) * 0.09 : 0;
    fig.keyRing(ctx, rx, ry, R.k, { seed: 'v07', rot: shake + noise(s.t * 0.3, 'v07:llavero') * 0.05 + (back > 0 ? -0.08 * back : 0), p: intro });
    // The small ruled key, with its label and tag, from its first chunk; then it slides in and turns.
    var kp = beat(a, 0.01, landWindow(C.llave)[1]);
    if (kp <= 0) return;
    var slide = inOut3(beat(a, C.superaron - 0.02, C.superaron + 0.12));
    var bowX = lerp(PRO.key.park, kh.x - 124 * PRO.key.k, slide), bowY = kh.y;
    ctx.save();
    ctx.translate(bowX + 60, bowY);
    ctx.scale(1, 1 - 0.65 * Math.sin(Math.PI * turn));
    ctx.translate(-bowX - 60, -bowY);
    ruledKey(ctx, env, bowX, bowY, PRO.key.k, kp);
    ctx.restore();
    var lab = rot(s, 'llave'), lx = bowX - 30, ly = bowY + PRO.label.dy, lp = seg(a, landWindow(C.llave)[1] - 0.02, landWindow(C.llave)[1] + 0.03);
    var L = ink.text(ctx, lab, lx, ly, { size: PRO.label.size, weight: 700, align: 'right', p: lp });
    tag(ctx, env, 'cap-12', lx - L.w, ly + PRO.tag.dy - 30, { x: lx - L.w + 10, y: ly + L.h - 4 }, lp);
  }

  // ---------------------------------------------------------------------------------------------
  // The clinical traffic light (D12, prompt §4.4): fixed positions top Rojo (cross), middle Ámbar
  // (half disc), bottom Verde (check star). Scenes 8–10 keep a small one at the top-left with the
  // light of their line lit and its label beside it.

  var BIG = { x: 430, y: 548, k: 1.12 };
  var SMALL = { x: 70, y: 316, k: 0.62 };
  var LIGHT_KEYS = { rojo: 'rojo', ambar: 'ambar', verde: 'verde' };

  function semaforo(ctx, s, env) {
    var C = cuesOf(s, 'semaforo'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    var a = s.at(0);
    floaters(ctx, s, env, [['luna', 1150, 110, 44, m.azul], ['estrella', 1080, 470, 34, 'mono'], ['espiral', 200, 420, 34, 'mono']], seg(s.t, 2, 3.2));
    var p = seg(s.t, 0.3, lineT(s, 0, Math.min(0.5, C.desigual)));
    var tl = fig.trafficLight(ctx, BIG.x, BIG.y, BIG.k, { labels: false, p: p });
    var lights = tl.lights;
    for (var i = 0; i < lights.length; i++) {
      var Lt = lights[i];
      // «Leámosla con un semáforo»: each light glows once, top to bottom.
      var pulse = beat(a, C.semaforo - 0.05 + i * 0.05, C.semaforo + 0.05 + i * 0.05);
      if (pulse > 0) ink.glow(ctx, Lt.x, Lt.y, Lt.r * 2.6, env.pal.legend.semaforo[i].color, 0.5 * Math.sin(Math.PI * Math.min(1, pulse)) + (pulse >= 1 ? 0.12 : 0));
      var lp = seg(p, 0.45 + i * 0.15, 0.75 + i * 0.12), o = { size: 32, weight: 700 }, text = rot(s, LIGHT_KEYS[Lt.key]);
      var lay = ink.measureText(ctx, text, o);
      o.p = lp;
      ink.text(ctx, text, Lt.x + Lt.r + 40, Lt.y - lay.h / 2 + 2, o);
    }
  }

  // The small light at the top-left, its lit light glowing, and that light's label beside it.
  function smallLight(ctx, s, env, key, video) {
    var ink = env.ink, p = out3(seg(s.t, 0, 0.8));
    var tl = env.fig.trafficLight(ctx, SMALL.x, SMALL.y, SMALL.k, { labels: false, lit: key, p: 1 });
    var lt = null;
    tl.lights.forEach(function (l) { if (l.key === key) lt = l; });
    if (!lt) return null;
    var o = { size: 26, weight: 700 }, text = rotText(video, 'semaforo', LIGHT_KEYS[key]), lay = ink.measureText(ctx, text, o);
    o.p = p;
    ink.text(ctx, text, lt.x + lt.r + 22, lt.y - lay.h / 2 + 2, o);
    return { light: lt, label: { x: lt.x + lt.r + 22, y: lt.y - lay.h / 2, w: lay.w, h: lay.h } };
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · verde — the bottom light glows; a doctor writes clinical notes with a small lamp beside the
  // notebook; the writing-time bar shrinks: the cut part is exactly 83% of its length, the «hasta»
  // tick at the cut, the label «hasta −83%» over the part that goes.

  var VER = {
    track: { x: 170, y: 318, len: 800, h: 50 },
    desk: { x: 1110, y: 566, k: 0.6 },
    medica: { x: 1130, y: 552, k: 2.3 },
    lamp: { x: 1016, y: 418, k: 0.32 },
    tag: { x: 650, y: 400 }
  };

  function verde(ctx, s, env) {
    var C = cuesOf(s, 'verde'), ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo, video = s.state.video;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0, 1.1)), a = s.at(0);
    floaters(ctx, s, env, [['luna', 1150, 90, 42, m.azul], ['estrella', 760, 120, 30, 'mono'], ['espiral', 300, 500, 30, 'mono']], intro);
    smallLight(ctx, s, env, 'verde', video);
    // The doctor behind her desk, writing; the small lamp beside her notebook.
    var M = VER.medica;
    fig.person(ctx, M.x, M.y, M.k, { role: 'medica', pose: 'writing', prop: 'notebook', skin: 3, hair: 'ponytail', seed: 'v07:medica', facing: -1, height: 1, glasses: false, p: intro });
    fig.desk(ctx, VER.desk.x, VER.desk.y, VER.desk.k, { p: intro });
    fig.lamp(ctx, VER.lamp.x, VER.lamp.y + Math.sin(s.t * 1.2) * 1.2 * calm(s), VER.lamp.k, { t: s.t, p: seg(s.t, 0.6, 1.6) });
    // The bar: the time before (whole length), then the cut.
    var T = VER.track, pv = chart.parseValue(rot(s, 'marca')), cutShare = pv ? Math.abs(pv.value) / 100 : 0;
    var bp = seg(s.t, 0.5, lineT(s, 0, 0.12)), win = landWindow(C.cifra), cut = beat(a, win[0], win[1]);
    var sc = chart.scale(100, T.x, T.len), xCut = sc(100 * (1 - cutShare * out3(cut)));
    ink.text(ctx, rot(s, 'barra'), T.x, T.y + T.h + 16, { size: 22, weight: 700, p: bp });
    if (bp > 0) {
      chart.baseline(ctx, T.x, T.y - 10, T.y + T.h + 10, { p: bp });
      chart.bar(ctx, { value: 100 * bp, scale: sc, y: T.y, h: T.h, color: m.verde, labels: false, seed: 'v07:tiempo', p: 1, cap: cut >= 1 ? 'max' : 'exact' });
    }
    // The part that goes: a dashed ghost from the cut to the old end.
    if (cut > 0) {
      ctx.save();
      ctx.fillStyle = m.lienzo;
      ctx.fillRect(xCut + 1.6, T.y - 4, T.x + T.len - xCut + 4, T.h + 8);
      ctx.restore();
      ink.rRect(ctx, xCut, T.y, T.x + T.len - xCut, T.h, { color: m.tinta, w: 1.6, dash: [6, 5] });
      chart.bar(ctx, { value: 100 * (1 - cutShare * out3(cut)), scale: sc, y: T.y, h: T.h, color: m.verde, labels: false, seed: 'v07:tiempo', p: 1, cap: cut >= 1 ? 'max' : 'exact' });
    }
    var lp = seg(a, win[1], win[1] + 0.04);
    if (lp > 0) {
      var mid = (xCut + T.x + T.len) / 2, LM = ink.text(ctx, rot(s, 'marca'), mid, T.y - 48, { size: 38, weight: 700, align: 'center', p: lp });
      ink.text(ctx, rot(s, 'hasta'), xCut + 14, T.y + T.h / 2 - 15, { size: 24, italic: true, weight: 700, p: lp });
      void LM;
    }
    tag(ctx, env, 'med-1', VER.tag.x, VER.tag.y, { x: VER.tag.x + 16, y: T.y + T.h + 2 }, seg(a, win[1] - 0.03, win[1] + 0.04), { mono: true });
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · ambar — the middle light glows; inside a ruled navy panel «Casos difíciles publicados en
  // NEJM», two bars on one 0–100% scale: the multi-agent system 85,5% (three identical lamps) and
  // the 21 doctors without their usual tools ~20% (dotted cap); below, exactly 21 small doctors;
  // a pinned note «No es práctica clínica» (the player presses warning 2 for the second line).

  var AMB = {
    panel: { x: 150, y: 196, w: 700, h: 236 },
    zero: 174, len: 600, rows: [{ key: 'sistema', ly: 252, by: 280 }, { key: 'medicos', ly: 334, by: 362 }], bh: 30,
    doctors: { x: 186, pitch: 30, feet: 544, k: 0.62 },
    tag2: { x: 884, y: 224 }, tagCtx: { x: 850, y: 462 },
    note: { x: 892, y: 340, w: 300, h: 84, rot: 0.03 }
  };

  function ambar(ctx, s, env) {
    var C = cuesOf(s, 'ambar'), ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina, video = s.state.video;
    bg(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), i;
    floaters(ctx, s, env, [['luna', 620, 100, 40, m.azul], ['estrella', 1210, 560, 26, 'mono']], out3(s.intro));
    smallLight(ctx, s, env, 'ambar', video);
    var P = AMB.panel;
    panelIn(ctx, env, P, inOut3(seg(s.t, 0.2, 1.3)), 12);
    ink.text(ctx, rot(s, 'casos'), P.x + 24, P.y + 16, { size: 23, weight: 700, color: m.lienzo, p: seg(s.t, 1, 1.8) });
    var sc = chart.scale(100, AMB.zero, AMB.len);
    var zp = beat(a0, 0, 0.05);
    if (zp > 0) chart.baseline(ctx, AMB.zero, AMB.rows[0].by - 8, AMB.rows[1].by + AMB.bh + 8, { style: 'ruled', p: zp });
    var wins = [landWindow(C.sistema), landWindow(C.medicos)];
    for (i = 0; i < 2; i++) {
      var R = AMB.rows[i], text = rot(s, R.key), v = valueWith(chart, text, '%'), w = wins[i], bp = beat(a0, w[0], w[1]);
      if (!v || bp <= 0) continue;
      chart.bar(ctx, { value: v.value, cap: v.approx ? 'approx' : 'exact', scale: sc, y: R.by, h: AMB.bh, style: 'ruled', color: i ? m.amarillo : q.linea,
        labels: false, seed: 'v07:ambar' + i, p: bp });
      if (v.approx && bp >= 1) {
        // «~»: the dotted end cap, drawn in cream so it reads on the ruled fill.
        for (var d = 0; d < 5; d++) ink.dot(ctx, sc(v.value), R.by + (d + 0.5) * AMB.bh / 5, 2.4, m.lienzo);
      }
      var Lr = ink.text(ctx, text, AMB.zero, R.ly, { size: 21, weight: 700, color: m.lienzo, p: seg(a0, w[1], w[1] + 0.03) });
      if (i === 0 && seg(a0, w[1], w[1] + 0.03) > 0) fig.lamps(ctx, AMB.zero + Lr.w + 44, R.ly + 12, 0.2, { n: 3, gap: 110, t: s.t, p: seg(a0, w[1], w[1] + 0.05) });
    }
    // The tag of the bars, tied to the panel's edge between the two rows.
    var ty = (AMB.rows[0].by + AMB.rows[1].by + AMB.bh) / 2;
    tag(ctx, env, 'med-2', AMB.tag2.x, AMB.tag2.y, { x: P.x + P.w, y: ty }, beat(a0, wins[0][0], wins[0][1] + 0.03), { mono: true });
    // Exactly 21 small doctors (the count comes from the rótulo), warm, on the cream page.
    var D = AMB.doctors, counts = countsIn(chart, rot(s, 'medicos')), n = counts.length ? Math.round(counts[0].value) : 0;
    var dp = beat(a0, wins[1][0] - 0.04, wins[1][1]);
    for (i = 0; i < n && dp > 0; i++) {
      var pi = seg(dp, i / n * 0.6, i / n * 0.6 + 0.4);
      if (pi <= 0) continue;
      fig.person(ctx, D.x + i * D.pitch, D.feet + Math.sin(s.t * 1.3 + i) * 0.6 * calm(s), D.k, { role: 'medica', pose: 'standing', skin: i % 5, seed: 'v07:doc' + i, height: 1, p: pi });
    }
    var last = D.x + (n - 1) * D.pitch;
    tag(ctx, env, 'ctx-medicos-experiencia', AMB.tagCtx.x, AMB.tagCtx.y, { x: last + 14, y: D.feet - 34 }, seg(a0, wins[1][1] - 0.04, wins[1][1] + 0.04), { mono: true });
    pinnedNote(ctx, env, rot(s, 'nota'), AMB.note, beat(a1, 0, 0.12), 'v07:nota');
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · rojo — the top light glows. Line 1: a stack of the reviewed studies split at exactly 5%
  // (real clinical data) and at the half («casi»: dotted), and a ruled navy card with the band
  // 11,8–14,6 on a 0–100 track (per 100 cases). Line 2 (the first page slides away): a tally of
  // exactly 1.400 cells, 258 dark; then a separate panel, dated, with «1.016 autorizaciones» and the
  // 2,4% sliver of the bar of devices with clinical studies, its tag showing the scope.

  var ROJ = {
    stack: { x: 196, base: 548, w: 118, H: 300 },
    labels: { x: 340, w: 260 },
    tag3: { x: 340, y: 266 },
    card: { x: 640, y: 168, w: 590, h: 200 },
    track: { x: 668, len: 534, y: 300, h: 26 },
    tag4: { x: 712, y: 384 },
    tally: { x: 150, y: 226, cols: 50, pitch: 8.4 },
    tag5: { x: 150, y: 484 },
    box: { x: 680, y: 112, w: 552, h: 300 },
    bar: { x: 708, y: 300, len: 496, h: 36 },
    tag6: { x: 690, y: 424 }
  };

  function tallyLayer(ctx, env, cols, rows, total, pitch, color, seed) {
    var w = cols * pitch, h = rows * pitch;
    return env.ink.layer(ctx, 'v07:tally|' + total + '|' + cols + '|' + pitch + '|' + color + '|' + seed, w, h, function (g) {
      g.fillStyle = color;
      for (var i = 0; i < total; i++) g.fillRect((i % cols) * pitch + 1, Math.floor(i / cols) * pitch + 1, pitch - 2.4, pitch - 2.4);
    });
  }

  function rojo(ctx, s, env) {
    var C = cuesOf(s, 'rojo'), ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina, video = s.state.video;
    bg(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), i;
    smallLight(ctx, s, env, 'rojo', video);
    // The first page slides away between the lines; the second comes in.
    var swap = inOut3(seg(s.t, lineT(s, 0, 1) + 0.1, lineT(s, 1, 0) + 0.5));
    if (swap < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - swap;
      ctx.translate(-80 * swap, 0);
      rojoStudies(ctx, s, env, C, a0);
      ctx.restore();
    }
    if (swap > 0) {
      ctx.save();
      ctx.globalAlpha *= swap;
      ctx.translate(80 * (1 - swap), 0);
      rojoDevices(ctx, s, env, C, a1);
      ctx.restore();
    }
    void fig; void chart; void m; void q; void i;
  }

  function rojoStudies(ctx, s, env, C, a0) {
    var ink = env.ink, chart = env.chart, m = env.pal.mundo, q = env.pal.maquina, S = ROJ.stack, i;
    var w1 = landWindow(C.estudios), w2 = landWindow(C.mitad), sp = beat(a0, w1[0], w1[1]);
    if (sp > 0) {
      // The whole stack: every study reviewed (its count is in the label, not in its height).
      var h = S.H * out3(sp), top = S.base - h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(S.x - 4, top, S.w + 8, h + 2);
      ctx.clip();
      ctx.fillStyle = env.pal.mix(m.lienzo, m.lienzoOcre, 0.55);
      ctx.fillRect(S.x, S.base - S.H, S.w, S.H);
      // The parts land at their exact shares: 5% real clinical data, ~half exam-style questions.
      var pc = valuesIn(chart, rot(s, 'clinicos')).filter(function (v) { return v.unit === '%'; })[0];
      var share5 = pc ? pc.value / 100 : 0, pp = beat(a0, w2[0], w2[1]);
      var y5 = S.base - S.H * share5, yHalf = S.base - S.H * (share5 + 0.5);
      if (pp > 0) {
        ctx.globalAlpha *= pp;
        ctx.fillStyle = m.tierra;
        ctx.fillRect(S.x, yHalf, S.w, y5 - yHalf);
        ctx.fillStyle = m.azul;
        ctx.fillRect(S.x, y5, S.w, S.base - y5);
        ctx.globalAlpha /= pp;
      }
      ctx.strokeStyle = env.pal.rgba(m.tinta, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var y = S.base - 6; y > S.base - S.H; y -= 6) { ctx.moveTo(S.x + 4, y); ctx.lineTo(S.x + S.w - 4 - ((y * 5) % 8), y); }
      ctx.stroke();
      if (pp >= 1) {
        // Value edges: the 5% edge straight, the half edge dotted («casi»).
        ctx.fillStyle = m.tinta;
        ink.rLine(ctx, S.x, y5, S.x + S.w, y5, { color: m.tinta, w: 2.6 });
        for (i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(S.x + (i + 0.5) * S.w / 8, yHalf, 2.4, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ink.line(ctx, s.state.stackSides[0], { w: 3.4, profile: 'even', seed: 'v07:pilaL', p: out3(sp) });
      ink.line(ctx, s.state.stackSides[1], { w: 3.4, profile: 'even', seed: 'v07:pilaR', p: out3(sp) });
      ink.rLine(ctx, S.x - 3, top, S.x + S.w + 3, top, { color: m.tinta, w: 3.2 });
      ink.rLine(ctx, S.x - 10, S.base, S.x + S.w + 10, S.base, { color: m.tinta, w: 3.4 });
      var Lp = seg(a0, w1[1], w1[1] + 0.03);
      ink.text(ctx, rot(s, 'estudios'), S.x + S.w / 2, S.base - S.H - 64, { size: 23, weight: 700, align: 'center', maxWidth: 300, lineHeight: 1.15, p: Lp });
      var lp2 = seg(a0, w2[1], w2[1] + 0.03), Lb = ROJ.labels;
      if (lp2 > 0) {
        var yE = (yHalf + y5) / 2;
        ink.rLine(ctx, S.x + S.w + 4, yE, Lb.x - 6, yE, { color: m.tinta, w: 1.4, p: lp2 });
        ink.text(ctx, rot(s, 'examen'), Lb.x, yE - 24, { size: 21, weight: 700, maxWidth: Lb.w, lineHeight: 1.15, p: lp2 });
        ink.rLine(ctx, S.x + S.w + 4, (y5 + S.base) / 2, Lb.x - 6, (y5 + S.base) / 2 - 12, { color: m.tinta, w: 1.4, p: lp2 });
        ink.text(ctx, rot(s, 'clinicos'), Lb.x, (y5 + S.base) / 2 - 34, { size: 21, weight: 700, maxWidth: Lb.w, lineHeight: 1.15, p: lp2 });
      }
      tag(ctx, env, 'med-3', ROJ.tag3.x, ROJ.tag3.y, { x: S.x + S.w + 2, y: S.base - S.H + 14 }, seg(a0, w1[1] - 0.03, w1[1] + 0.04), { mono: true });
    }
    // The open evaluation: a ruled navy card, the band of harmful recommendations per 100 cases.
    var cp = beat(a0, C.evaluacion - 0.03, C.evaluacion + 0.06);
    if (cp <= 0) return;
    var K = ROJ.card, T = ROJ.track, rec = rot(s, 'recomendaciones');
    panelIn(ctx, env, K, inOut3(cp), 12);
    env.fig.lamps(ctx, K.x + K.w - 92, K.y + 40, 0.22, { n: 2, gap: 120, t: s.t, p: seg(cp, 0.5, 1) });
    var w4 = landWindow(C.danos), bp = beat(a0, w4[0], w4[1]), sc = chart.scale(100, T.x, T.len);
    var per = countsIn(chart, rec).filter(function (v) { return v.lo == null; }), max = per.length ? per[per.length - 1].value : 100;
    sc = chart.scale(max, T.x, T.len);
    ink.rLine(ctx, T.x, T.y - 10, T.x, T.y + T.h + 10, { color: q.linea, w: 1.6, p: seg(cp, 0.4, 1) });
    ink.rLine(ctx, T.x + T.len, T.y - 10, T.x + T.len, T.y + T.h + 10, { color: q.linea, w: 1.6, p: seg(cp, 0.4, 1) });
    ink.rRect(ctx, T.x, T.y, T.len, T.h, { color: q.linea, w: 1, dash: [4, 4], p: seg(cp, 0.4, 1) });
    if (bp > 0) {
      var band = chart.parseValue(rec), x0 = sc(band.lo), x1 = sc(band.lo) + (sc(band.value) - sc(band.lo)) * out3(bp);
      ctx.save();
      ctx.globalAlpha *= 0.9;
      ctx.fillStyle = q.brilloMagenta;
      ctx.fillRect(x0, T.y + 2, Math.max(1, x1 - x0), T.h - 4);
      ctx.restore();
      ink.rLine(ctx, x0, T.y - 6, x0, T.y + T.h + 6, { color: m.lienzo, w: 2 });
      if (bp >= 1) ink.rLine(ctx, x1, T.y - 6, x1, T.y + T.h + 6, { color: m.lienzo, w: 2 });
    }
    ink.text(ctx, env.pal.legend.words.cero, T.x, T.y + T.h + 12, { size: 18, weight: 700, color: m.lienzo, align: 'center', p: seg(cp, 0.5, 1) });
    var lp4 = seg(a0, w4[1], w4[1] + 0.03);
    ink.text(ctx, rec, K.x + 26, K.y + 22, { size: 22, weight: 700, color: m.lienzo, maxWidth: K.w - 150, lineHeight: 1.18, p: lp4 });
    ink.rLine(ctx, sc(chart.parseValue(rec).lo), T.y + T.h + 6, sc(chart.parseValue(rec).lo), K.y + K.h, { color: q.linea, w: 1.2, p: lp4 });
    tag(ctx, env, 'med-4', ROJ.tag4.x, ROJ.tag4.y, { x: sc(chart.parseValue(rec).lo), y: K.y + K.h }, seg(a0, w4[0], w4[1] + 0.03), { mono: true });
  }

  function rojoDevices(ctx, s, env, C, a1) {
    var ink = env.ink, chart = env.chart, m = env.pal.mundo, i;
    var fda = rot(s, 'fda'), counts = countsIn(chart, fda), lit = counts[0] ? Math.round(counts[0].value) : 0, total = counts[1] ? Math.round(counts[1].value) : 0;
    var T = ROJ.tally, rows = Math.ceil(total / T.cols), w5 = landWindow(C.fda), tp = beat(a1, w5[0], w5[1]);
    // The ruled tally: every cell a device; the dark ones, the 258 of 2025 (exact counts).
    ink.text(ctx, fda, T.x, T.y - 74, { size: 24, weight: 700, maxWidth: T.cols * T.pitch + 20, lineHeight: 1.18, p: seg(a1, w5[1], w5[1] + 0.03) });
    if (total > 0 && tp > 0) {
      var off = tallyLayer(ctx, env, T.cols, rows, total, T.pitch, env.pal.mix(m.lienzoOcre, m.tinta, 0.08), 'off');
      var on = tallyLayer(ctx, env, T.cols, rows, total, T.pitch, m.tinta, 'on');
      var gw = T.cols * T.pitch, gh = rows * T.pitch;
      ctx.save();
      ctx.globalAlpha *= seg(tp, 0, 0.3);
      ctx.drawImage(off, T.x, T.y, gw, gh);
      ctx.restore();
      var k = Math.round(lit * out3(seg(tp, 0.2, 1))), full = Math.floor(k / T.cols), rest = k - full * T.cols;
      if (k > 0) {
        ctx.save();
        ctx.beginPath();
        if (full) ctx.rect(T.x, T.y, gw, full * T.pitch);
        if (rest) ctx.rect(T.x, T.y + full * T.pitch, rest * T.pitch, T.pitch);
        ctx.clip();
        ctx.drawImage(on, T.x, T.y, gw, gh);
        ctx.restore();
      }
      // «~1.400»: an approximate total keeps a dotted end along its last row.
      if (counts[1] && counts[1].approx && tp >= 1) {
        ctx.fillStyle = m.tinta;
        for (i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(T.x + (i + 0.5) * gw / 12, T.y + gh + 6, 2.2, 0, TAU); ctx.fill(); }
      }
      tag(ctx, env, 'med-5', ROJ.tag5.x, ROJ.tag5.y, { x: T.x + 8, y: T.y + gh + 10 }, seg(a1, w5[0], w5[1] + 0.03), { mono: true });
    }
    // A separate panel with its own date: 1.016 authorizations, and among the devices with clinical
    // studies (a bar of its own: their number is not drawn), the 2,4% with randomized trials.
    var w6 = landWindow(C.panel), pp = beat(a1, w6[0], w6[1]);
    if (pp <= 0) return;
    var B = ROJ.box, R = ROJ.bar;
    ink.card(ctx, B.x, B.y, B.w, B.h, { seed: 'v07:panel2024', weight: 4, radius: 14, p: pp, peek: m.celeste, peekCorner: 'br' });
    var hp = seg(a1, w6[1], w6[1] + 0.03);
    ink.text(ctx, rot(s, 'fecha'), B.x + 28, B.y + 22, { size: 23, italic: true, weight: 700, p: hp });
    hero(ctx, env, rot(s, 'autorizaciones'), B.x + 28, B.y + 58, 46, { seed: 'v07:1016', p: hp, maxWidth: B.w - 56 });
    var w7 = landWindow(C.ensayos), sp = beat(a1, w7[0], w7[1]);
    if (sp <= 0) return;
    var pct = valueWith(chart, rot(s, 'porcentaje'), '%'), sc = chart.scale(100, R.x, R.len);
    ink.dotted(ctx, s.state.subset, { r: 2.2, gap: 11, seed: 'v07:subconjunto', p: seg(sp, 0, 0.6) });
    ink.text(ctx, rot(s, 'dispositivos'), R.x, R.y - 34, { size: 22, weight: 700, p: seg(sp, 0, 0.5) });
    chart.bar(ctx, { value: 100, scale: sc, y: R.y, h: R.h, color: env.pal.mix(m.lienzo, m.lienzoOcre, 0.7), labels: false, seed: 'v07:conestudios', p: seg(sp, 0, 0.6) });
    if (pct) chart.bar(ctx, { value: pct.value, scale: sc, y: R.y, h: R.h, color: m.azul, labels: false, seed: 'v07:sliver', p: seg(sp, 0.5, 1) });
    var lp = seg(a1, w7[1], w7[1] + 0.03);
    var LP = ink.text(ctx, rot(s, 'porcentaje'), R.x, R.y + R.h + 12, { size: 34, weight: 700, p: lp });
    ink.text(ctx, rot(s, 'ensayos'), R.x + LP.w + 14, R.y + R.h + 22, { size: 22, weight: 700, p: lp });
    tag(ctx, env, 'med-6', ROJ.tag6.x, ROJ.tag6.y, { x: R.x + (pct ? sc(pct.value) - R.x : 0) / 2, y: B.y + B.h }, seg(a1, w7[0], w7[1] + 0.03), { mono: true, scope: true, scale: 0.98 });
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · escalera — the course's warm ladder of evidence: six numbered rungs, labeled from the
  // bottom as they are named. 12 · ubicar — three cards climb and stop on rungs 3, 2 and 1; a dotted
  // path from the last one rarely reaches the fifth. 14 · cierre — the top rung glows faintly.

  var LAD = { x: 470, half: 44, rung1: 516, gap: 76, top: 116, foot: 548, num: 396, label: 548, labelW: 334, size: 21 };
  function rungY(i) { return LAD.rung1 - i * LAD.gap; }

  function ladder(ctx, s, env, st, p, labelP, labelAlpha) {
    var ink = env.ink, m = env.pal.mundo, i;
    ink.draw(ctx, st.ladder, 0, 0, 1, { p: p });
    for (i = 0; i < 6; i++) {
      var np = seg(p, 0.5 + i * 0.06, 0.7 + i * 0.06);
      if (np > 0) {
        ink.circle(ctx, LAD.num, rungY(i), 17, { fill: m.lienzo, w: 3, seed: 'v07:num' + i, p: np });
        ink.text(ctx, String(i + 1), LAD.num, rungY(i) - 12, { size: 21, weight: 700, align: 'center', p: np });
      }
      var lp = labelP ? labelP[i] : 0;
      if (lp > 0) {
        var text = st.rungs[i], o = { size: LAD.size, weight: 700, maxWidth: LAD.labelW, lineHeight: 1.12, alpha: labelAlpha == null ? 1 : labelAlpha };
        var lay = ink.measureText(ctx, text, o);
        o.p = lp;
        ink.text(ctx, text, LAD.label, rungY(i) - lay.h / 2 + 1, o);
      }
    }
  }

  function escalera(ctx, s, env) {
    var C = cuesOf(s, 'escalera'), st = s.state;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['constelacion', 170, 300, 90], ['estrella', 220, 470, 28, env.pal.mundo.amarillo]], seg(s.t, 2, 3.2));
    var p = seg(s.t, 0.4, lineT(s, 0, Math.max(0.2, C.r0 - 0.02)));
    var cues = [[0, C.r0], [0, C.r1], [0, C.r2], [1, C.r3], [1, C.r4], [1, C.r5]], lps = [];
    for (var i = 0; i < 6; i++) lps.push(beat(s.at(cues[i][0]), cues[i][1] - 0.03, cues[i][1] + 0.1));
    ladder(ctx, s, env, st, p, lps);
  }

  var UBI = { x: 70, w: 286, h: 58, keys: ['notasClinicas', 'multiagente', 'revision'], rungs: [2, 1, 0], lights: ['verde', 'ambar', 'rojo'] };

  function claimCard(ctx, env, text, light, x, y, p) {
    var ink = env.ink, lt = null;
    env.pal.legend.semaforo.forEach(function (l) { if (l.key === light) lt = l; });
    ink.card(ctx, x, y, UBI.w, UBI.h, { seed: 'v07:tarjeta' + light, weight: 3.4, radius: 12, p: p, peek: lt ? lt.color : null, peekCorner: 'tl' });
    if (!lt) return;
    var cp = seg(p, 0.4, 1);
    ink.circle(ctx, x + 32, y + UBI.h / 2, 17, { fill: lt.color, line: false, seed: 'v07:luz' + light, p: cp });
    env.fig.sign(ctx, lt.sign, x + 32, y + UBI.h / 2, 26, { seed: 'v07:luz', mono: true, p: cp });
    ink.text(ctx, text, x + 60, y + UBI.h / 2 - 22, { size: 20, weight: 700, maxWidth: UBI.w - 72, lineHeight: 1.08, fit: true, minSize: 15, maxHeight: UBI.h - 8, p: cp });
  }

  function ubicar(ctx, s, env) {
    var C = cuesOf(s, 'ubicar'), st = s.state, ink = env.ink;
    bg(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1);
    ladder(ctx, s, env, st, 1, [1, 1, 1, 1, 1, 1], 0.5);
    var times = [[a0, C.notas, C.tercer], [a0, C.multi, C.segundo], [a1, C.revision, C.primer]];
    for (var i = 0; i < 3; i++) {
      var tm = times[i], cp = beat(tm[0], tm[1] - 0.02, tm[1] + 0.06), climb = inOut3(beat(tm[0], tm[1], tm[2] + 0.02));
      if (cp <= 0) continue;
      var yEnd = rungY(UBI.rungs[i]) - UBI.h / 2, y = lerp(H - 40, yEnd, climb);
      claimCard(ctx, env, rot(s, UBI.keys[i]), UBI.lights[i], UBI.x, y, cp);
    }
    // «casi nunca llega al quinto»: dots climb from the last card toward rung 5, sparser and fainter.
    var qp = beat(a1, C.quinto - 0.06, C.quinto + 0.12);
    if (qp > 0) {
      var dots = st.rarePath, n = Math.round(dots.length * qp);
      for (var k = 0; k < n; k++) ink.dot(ctx, dots[k][0], dots[k][1], dots[k][2], env.pal.rgba(env.pal.mundo.tinta, dots[k][3]));
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 13 · antes-de-escalar — lámina D12's path «Validación externa → Seguimiento posdespliegue →
  // Responsabilidad clínica» draws on around a hospital in warm shapes; «Representatividad
  // poblacional» and «Interacción humano–IA» join it as they are said; the lectora asks.

  var ANT = {
    hospital: { x: 320, y: 150, k: 0.5 },
    slots: [[182, 470], [262, 196], [640, 92], [1018, 196], [1098, 470]], card: { w: 236, h: 60 },
    lectora: { x: 640, y: 576, k: 2.3 }
  };

  function antesDeEscalar(ctx, s, env) {
    var C = cuesOf(s, 'antes-de-escalar'), st = s.state, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(seg(s.t, 0, 1.2)), a0 = s.at(0), a1 = s.at(1), i;
    floaters(ctx, s, env, [['sol', 1190, 70, 44, m.rojo], ['pajaro', 120, 80, 52]], intro);
    ink.line(ctx, st.groundLine, { w: 4, profile: 'blunt', seed: 'v07:suelo2', p: intro });
    fig.hospital(ctx, ANT.hospital.x, ANT.hospital.y, ANT.hospital.k, { ground: false, seed: 'v07', p: intro });
    // The path: D12's three stations draw on from the start; two more join on their words.
    var pathP = seg(s.t, 0.6, lineT(s, 0, Math.max(0.15, C.s0)));
    // Until the two new stations join, D12's path goes straight from the second station to the last.
    var join = beat(a0, C.s3 + 0.02, C.s3 + 0.12);
    if (join < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - join;
      ink.dotted(ctx, st.loop, { r: 2.6, gap: 13, seed: 'v07:camino', p: pathP });
      ctx.restore();
    }
    var labels = st.stations, joinAt = [null, null, C.s2, C.s3, null], named = [C.s0, C.s1, C.s2, C.s3, C.s4];
    for (i = 0; i < 5; i++) {
      var sl = ANT.slots[i], w = ANT.card.w, h = ANT.card.h, cp, dy = 0;
      if (joinAt[i] == null) cp = seg(pathP, 0.3 + i * 0.12, 0.6 + i * 0.1);
      else { cp = beat(a0, joinAt[i] - 0.05, joinAt[i] + 0.06); dy = -90 * (1 - out3(cp)); }
      if (cp <= 0) continue;
      var hl = beat(a0, named[i] - 0.02, named[i] + 0.05);
      ink.card(ctx, sl[0] - w / 2, sl[1] - h / 2 + dy, w, h, { seed: 'v07:estacion' + i, weight: 3.4, radius: 12, p: cp, peek: hl > 0 ? m.amarillo : null, peekCorner: 'tr' });
      var o = { size: 20, weight: 700, align: 'center', maxWidth: w - 24, lineHeight: 1.1, fit: true, minSize: 14, maxHeight: h - 10 }, lay = ink.measureText(ctx, labels[i], o);
      o.p = seg(cp, 0.4, 1);
      ink.text(ctx, labels[i], sl[0], sl[1] - lay.h / 2 + dy + 1, o);
    }
    for (i = 0; i < st.arrows.length; i++) ink.arrow(ctx, st.arrows[i], { w: 3, headSize: 11, seed: 'v07:flecha' + i, p: i === 0 ? seg(pathP, 0.4, 0.8) : join });
    var lp = out3(beat(a1, 0, 0.15));
    if (lp > 0) fig.lectora(ctx, ANT.lectora.x, ANT.lectora.y, ANT.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  function cierre(ctx, s, env) {
    var st = s.state, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    var a = s.at(0);
    floaters(ctx, s, env, [['estrella', 1060, 300, 34, m.amarillo], ['luna', 220, 300, 40]], out3(s.intro));
    var glow = (0.32 + 0.12 * Math.sin(s.t * 1.4)) * out3(seg(s.t, 0.2, 1.6));
    ink.glow(ctx, LAD.x, rungY(5), 120, m.amarillo, glow);
    ladder(ctx, s, env, st, 1, null);
    ink.letter(ctx, rot(s, 'titulo'), W / 2, 26, { size: 52, align: 'center', maxWidth: 1200, maxLines: 1, fit: true, seed: 'v07:titulo', p: beat(a, 0, 0.85) });
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, m = env.pal.mundo, video = findVideo(env.id || 'v07'), i;
    var r = env.rng('v07:setup');
    var st = { video: video, table: tableDrawing(env) };
    st.floor = [24, PUB.floor + 2, 400, PUB.floor, 980, PUB.floor + 2];

    // publicaciones: sheets flying from the table to the two stacks.
    st.flights = [];
    for (i = 0; i < PUB.birds; i++) {
      var x0 = r.range(250, 470), y0 = PUB.table.y - r.range(10, 40);
      st.flights.push({ stack: i % 2, u: i / (PUB.birds - 1), x0: x0, y0: y0, cx: lerp(x0, 760, 0.5) + r.jitter(80), cy: r.range(30, 110), dx: r.jitter(30) });
    }

    // modelos: isobars, molecule, flask and the Earth's cross-section.
    var it1 = MOD.items[1];
    st.isobars = [0, 1, 2].map(function (k) { return ink.blobPoints(env.rng('v07:iso' + k), it1.x - 12, it1.y + 4, 24 + k * 15, 14 + k * 10, 10, 0.12, 0.2); });
    var mb = ink.drawing('v07:molecula', { w: 3.4, jitter: 0.6 });
    var atoms = [[-44, 20, 16, m.rojo], [0, -8, 20, m.azul], [42, 24, 15, m.amarillo], [6, -52, 13, m.verde], [-30, -44, 11, m.lienzo]];
    [[0, 1], [1, 2], [1, 3], [3, 4]].forEach(function (bd) { mb.stroke([atoms[bd[0]][0], atoms[bd[0]][1], atoms[bd[1]][0], atoms[bd[1]][1]], { w: 4.4, profile: 'blunt' }); });
    atoms.forEach(function (at) { mb.circle(at[0], at[1], at[2], { fill: at[3], w: 3.2 }); });
    st.molecule = mb.done();
    var fb = ink.drawing('v07:matraz', { w: 3.4, jitter: 0.6 });
    flaskInto(fb, 0, 50, 1.45, m.verde);
    fb.dot(-8, 10, 3.4); fb.dot(6, -2, 2.6); fb.dot(-2, -20, 2);
    st.flask = fb.done();
    var eb = ink.drawing('v07:tierra', { w: 3.6, jitter: 0.5 });
    var half = function (rr) { var pts = []; for (var k = 0; k <= 16; k++) { var t = Math.PI + k / 16 * Math.PI; pts.push(Math.cos(t) * rr, Math.sin(t) * rr + 34); } return pts; };
    [[64, m.verde], [52, m.siena], [34, m.amarillo], [18, m.rojo]].forEach(function (ly) { eb.shape(half(ly[0]), { fill: ly[1], w: 3 }); });
    eb.stroke([-78, 35, 78, 35], { w: 4, profile: 'blunt' });
    st.earth = eb.done();

    // frontera-lab: the ruled glassware (outlines and liquids), a cordillera of vessels.
    var F = LAB.floor, nk = LAB.peak.neck;
    st.glass = {
      outlines: [
        [52, 336, 56, 340, 56, F, 72, F, 72, 340, 76, 336],
        [84, 296, 90, 302, 90, F, 144, F, 144, 302, 150, 296],
        [348, 210, 354, 216, 354, F, 394, F, 394, 216, 400, 210],
        [nk - 4, LAB.peak.top, nk, LAB.peak.top + 4, nk, 250, 706, F - 4, 712, F, 842, F, 848, F - 4, nk + 22, 250, nk + 22, LAB.peak.top + 4, nk + 26, LAB.peak.top]
      ],
      liquids: [
        { pts: [744, 330, 817, 330, 848, F - 4, 842, F, 712, F, 706, F - 4], peak: true }
      ]
    };

    // ciclo: D11's chevrons with the luz of the deck entry, and the step labels from the rótulo.
    var d11 = ((EIA.data && EIA.data.deck) || []).filter(function (d) { return d.id === 'd11'; })[0];
    var items = (d11 && d11.diagrama && d11.diagrama.items) || [];
    var labels = pieces(rotText(video, 'ciclo', 'proceso'), '›'), n = labels.length, segs = [], reach = 0;
    for (i = 0; i < n; i++) {
      var c = chevron(i, n), luz = items[i] && items[i].luz != null ? items[i].luz : 0;
      c.luz = luz;
      c.outline = densify(c.pts, 5);
      if (luz > 0 && luz < 1) {
        c.split = c.mid + (c.x1 - c.x0) * (luz - 0.5);
        c.left = clipSide(c.pts, c.split, true);
        c.right = clipSide(c.pts, c.split, false);
      }
      if (luz >= 1) reach = Math.max(reach, c.x1);
      if (luz > 0 && luz < 1) reach = Math.max(reach, c.split);
      segs.push(c);
    }
    var hp0 = handPos(env, CIC.people[0]);
    st.cycle = { segs: segs, labels: labels, reach: reach,
      pen: [hp0.x + 2, hp0.y - 2, hp0.x - 10, hp0.y - 22, hp0.x - 16, hp0.y - 38],
      lensGlint: (function () { var hp1 = handPos(env, CIC.people[1]); return [hp1.x - 24, hp1.y - 26, hp1.x - 18, hp1.y - 32, hp1.x - 10, hp1.y - 32]; })() };

    // proposito: the lock in two drawings (the shackle lifts).
    var sb = ink.drawing('v07:grillete', { w: 4 });
    sb.stroke([-22, -6, -22, -22, -18, -34, -8, -42, 0, -44, 8, -42, 18, -34, 22, -22, 22, -6], { w: 6, profile: 'blunt' });
    st.shackle = sb.done();
    var lb = ink.drawing('v07:candado', { w: 4 });
    lb.shape([-34, -8, 34, -8, 34, 44, -34, 44], { fill: m.oro, w: 4 });
    lb.circle(0, 12, 6, { fill: m.tinta, w: 2 });
    lb.stroke([0, 16, 0, 30], { w: 4, profile: 'blunt' });
    st.lockBody = lb.done();

    // rojo: the stack's static shapes and the dotted «of which» connector of the 2024 panel.
    var S = ROJ.stack;
    st.stackBox = [S.x, S.base, S.x + S.w, S.base, S.x + S.w, S.base - 1, S.x, S.base - 1];
    st.stackSides = [[S.x, S.base, S.x, S.base - S.H], [S.x + S.w, S.base, S.x + S.w, S.base - S.H]];
    st.subset = [ROJ.box.x + 40, ROJ.box.y + 120, ROJ.box.x + 30, ROJ.box.y + 140, ROJ.box.x + 36, ROJ.bar.y - 42];

    // escalera, ubicar, cierre: the warm ladder (rails, rungs, flat fields), rung labels.
    var ld = ink.drawing('v07:escalera', { w: 6, jitter: 0.8 });
    var lx = function (y) { return LAD.x - LAD.half + (LAD.foot - y) * 0.03; }, rx = function (y) { return LAD.x + LAD.half + (LAD.foot - y) * 0.015; };
    ld.shape([lx(LAD.foot) - 6, LAD.foot, lx(LAD.top) - 6, LAD.top, lx(LAD.top) + 6, LAD.top, lx(LAD.foot) + 6, LAD.foot], { fill: m.tierra, line: false });
    ld.shape([rx(LAD.foot) - 6, LAD.foot, rx(LAD.top) - 6, LAD.top, rx(LAD.top) + 6, LAD.top, rx(LAD.foot) + 6, LAD.foot], { fill: m.tierra, line: false });
    ld.stroke([lx(LAD.foot), LAD.foot, lx((LAD.foot + LAD.top) / 2) + 2, (LAD.foot + LAD.top) / 2, lx(LAD.top), LAD.top], { w: 7, profile: 'blunt', dot: true });
    ld.stroke([rx(LAD.foot), LAD.foot, rx((LAD.foot + LAD.top) / 2) - 2, (LAD.foot + LAD.top) / 2, rx(LAD.top), LAD.top], { w: 7, profile: 'blunt', dot: true });
    for (i = 0; i < 6; i++) {
      var y = rungY(i);
      ld.stroke([lx(y) + 2, y + 1, (lx(y) + rx(y)) / 2, y - 1, rx(y) - 2, y + 1], { w: 6, profile: 'blunt' });
    }
    st.ladder = ld.done();
    st.rungs = [];
    for (i = 1; i <= 6; i++) st.rungs.push(rotText(video, 'escalera', 'escalon' + i));
    st.rarePath = [];
    for (i = 0; i < 22; i++) {
      var u = i / 21, py = lerp(rungY(0) - 4, rungY(4), u);
      if (r() < u * 0.55) continue;   // sparser toward the top
      st.rarePath.push([UBI.x + UBI.w + 18 + Math.sin(u * 7) * 8, py, lerp(4, 1.6, u), lerp(0.9, 0.25, u)]);
    }

    // antes-de-escalar: the stations (D12's path pieces in the voice's order), the dotted loop and arrows.
    var camino = pieces(rotText(video, 'antes-de-escalar', 'camino'), '→');
    st.stations = [camino[0] || '', camino[1] || '', rotText(video, 'antes-de-escalar', 'representatividad'), rotText(video, 'antes-de-escalar', 'interaccion'), camino[2] || ''];
    var sl = ANT.slots;
    st.loop = [sl[1][0] + 122, sl[1][1] - 8, 640, 40, sl[3][0] - 122, sl[3][1] - 8, 1104, 330, sl[4][0] + 10, sl[4][1] - 36];
    st.arrows = [
      [sl[0][0] - 10, sl[0][1] - 36, 176, 330, sl[1][0] - 20, sl[1][1] + 36],
      [sl[1][0] + 122, sl[1][1] - 8, 420, 112, sl[2][0] - 122, sl[2][1] + 4],
      [sl[2][0] + 122, sl[2][1] + 4, 860, 112, sl[3][0] - 122, sl[3][1] - 8],
      [sl[3][0] + 20, sl[3][1] + 36, 1104, 330, sl[4][0] + 10, sl[4][1] - 36]
    ];
    st.groundLine = [200, 432, 640, 436, 1080, 432];
    return st;
  }

  // Hand position of a person of the ciclo scene (fig.person's own pose geometry: hand is { left, right }).
  function handPos(env, pp) {
    var g = env.canvas(8, 8).getContext('2d');
    var out = env.fig.person(g, pp.x, CIC.feet, CIC.k, { role: pp.role, pose: pp.pose, prop: pp.prop, skin: pp.skin, hair: pp.hair, seed: 'v07:ciclo' + CIC.people.indexOf(pp),
      facing: -1, height: 1, p: 0 });
    return out.hand.right;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v07 = {
    setup: setup,
    layers: {
      publicaciones: groundLayer('personas', {}),
      modelos: groundLayer('personas', {}),
      'frontera-lab': groundLayer('personas', {}),
      ciclo: groundLayer('personas', {}),
      manuscrito: groundLayer('personas', {}),
      proposito: groundLayer('personas', {}),
      semaforo: groundLayer('personas', {}),
      verde: groundLayer('personas', {}),
      ambar: groundLayer('personas', {}),
      rojo: groundLayer('datos', {}),
      escalera: groundLayer('personas', {}),
      ubicar: groundLayer('personas', {}),
      'antes-de-escalar': groundLayer('personas', {}),
      cierre: groundLayer('personas', {})
    },
    scenes: {
      publicaciones: publicaciones,
      modelos: modelos,
      'frontera-lab': fronteraLab,
      ciclo: ciclo,
      manuscrito: manuscrito,
      proposito: proposito,
      semaforo: semaforo,
      verde: verde,
      ambar: ambar,
      rojo: rojo,
      escalera: escalera,
      ubicar: ubicar,
      'antes-de-escalar': antesDeEscalar,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
