/* js/videos/v05-tareas.js — V05 «Tareas, no puestos» (prompt §13, sesión 4; KB §7; lámina D9).
 *
 * Nine scenes in three chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Tres conceptos             oficina · exposicion · tres-conceptos (this scene presses its stamp
 *                                itself, on the words that name it: drawsWarnings below)
 *   2 Quién siente la presión    desigual · entrada
 *   3 Competencias que cambian   competencias · siete · tareas-caso · cierre
 *
 * Work is warm and free: a job is a fan of task cards on a desk; the warm calligraphic career ladder
 * of lámina D9 (wooden rails, brush rungs) loses its first rung, which dissolves into dots, while a
 * young person looks up from below; at the end several people set a new first rung of another
 * shape. The AI is only the small ruled lamp.
 *
 * Honest marks (prompt §3.7). Exposure is light, never an empty seat: fields of exact dot counts
 * where a soft yellow halo marks «alguna exposición» and dark dots «exposición más alta»; no dot
 * ever disappears and nothing is counted as a job lost. The world's employment is a round field of
 * exactly 1.000 dots (250 haloed, 33 dark), the two income groups fields of 100 dots (34 and 11
 * haloed), women and men fields of 1.000 dots (47 and 24 dark; then 96 and 35 in high-income
 * countries). Every field is laid out from the centre out (phyllotaxis), so its first k dots are
 * exactly the k nearest the centre and k dots fill exactly k/n of the disc. «casi −20%» (trab-4)
 * is a bar on a 0–100% track that stops at the stated value with a dotted cap and «≈»; «39%»
 * (trab-5) lands whole beside the comet that flies toward the road sign «2030».
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
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));

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
  function val(env, text) { var v = env.chart.parseValue(text); return v ? v.value : 0; }
  // Pieces of a rótulo split at a separator of its own text («países de ingresos altos: 34%»).
  function piece(text, sep, i) { var a = String(text).split(sep); return a[i] == null ? '' : a[i].trim(); }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    oficina: { puestos: [0, 'qué puestos', 'word'], pero: [0, 'Pero la IA', 'chunk'], tareas: [0, 'tareas antes', 'word'] },
    exposicion: { cifra: [0, '25%', 'chunk'], paises: [0, '34%', 'chunk'], masAlta: [1, '3,3%', 'chunk'] },
    'tres-conceptos': { expuesta: [0, 'Una ocupación expuesta', 'chunk'],
      automatizacion: [0, 'La automatización', 'chunk'], integracion: [0, 'integración organizacional', 'word'],
      desplazamiento: [1, 'Y el desplazamiento', 'chunk'], desempleo: [1, 'exposición no es desempleo', 'word'] },
    desigual: { administrativas: [0, 'Las ocupaciones administrativas', 'chunk'], medios: [0, 'medios', 'word'], software: [0, 'software', 'word'],
      finanzas: [0, 'finanzas', 'word'], mundo: [1, '4,7%', 'chunk'], altos: [1, '9,6%', 'chunk'] },
    entrada: { entrada: [0, 'puestos de entrada', 'word'], cifra: [0, 'casi 20%', 'chunk'], patron: [0, 'aunque las pérdidas', 'chunk'],
      automatizando: [1, 'se están automatizando', 'chunk'] },
    competencias: { cifra: [0, '39%', 'chunk'], iaDatos: [0, 'IA y datos', 'word'], redes: [0, 'redes y ciberseguridad', 'word'],
      alfabetizacion: [0, 'alfabetización tecnológica', 'word'], pensamiento: [1, 'pensamiento creativo', 'word'], resiliencia: [1, 'resiliencia', 'word'],
      flexibilidad: [1, 'flexibilidad', 'word'], colaboracion: [1, 'colaboración', 'word'] },
    'tareas-caso': { desagreguen: [0, 'en tareas', 'word'], apoya: [0, 'apoya', 'word'], podria: [0, 'podría realizarla', 'word'],
      indispensable: [0, 'indispensable', 'word'], escalon: [1, 'escalón de entrada', 'word'], preservarlo: [1, 'ese aprendizaje', 'chunk'] }
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

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function ground(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v05:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14).
  function groundLayer(kind, opts) {
    return function (env) {
      var c = env.canvas(W, H), o = { seed: 'v05:pagina' }, k;
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
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v05:fx' + i) * 9, f[2] + noise(t * 0.8, 'v05:fy' + i) * 7, f[3], {
        seed: 'v05:float' + f[0] + i, colors: f[4] || null, rot: noise(t * 0.6, 'v05:fr' + i) * 0.14, p: p
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
    var img = env.ink.layer(ctx, 'v05:letra|' + key + '|' + size + '|' + (full.color || ''), w, h, function (g) {
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

  // A label lettered by hand that writes itself on (no counters, no stars: it reads at a glance).
  function label(ctx, env, text, x, y, size, o) {
    return env.ink.letter(ctx, text, x, y, { size: size, align: o.align || 'left', maxWidth: o.maxWidth, maxLines: o.maxLines || 1,
      counters: o.counters || 0, stars: false, underline: !!o.underline, seed: o.seed, color: o.color, p: o.p });
  }

  // One source tag per figure, at the size the course uses in videos.
  function sourceTag(ctx, env, ids, x, y, anchor, p) {
    if (p <= 0) return null;
    return env.tags.sourceTag(ctx, ids, { x: x, y: y, anchor: anchor, p: p, scale: 1.08 });
  }

  // Ruled thread of the machine (constant width, crisp) with stars flowing along it: the lamp's
  // touch on a task. Dashes move with s.t.
  function ruledThread(ctx, env, s, x0, y0, x1, y1, p) {
    if (p <= 0) return;
    var q = env.pal.maquina;
    ctx.save();
    ctx.strokeStyle = q.rejilla;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha *= 0.85;
    ctx.setLineDash([5, 6]);
    ctx.lineDashOffset = -s.t * 14;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p));
    ctx.stroke();
    ctx.restore();
  }

  var Q1 = {};   // scratch point, overwritten by every call (no state across frames)

  // ---------------------------------------------------------------------------------------------
  // Exact dot fields. n dots in a disc of radius R, laid out from the centre out (phyllotaxis: the
  // i-th dot sits at radius R·√((i + ½)/n)), so the first k dots are exactly the k nearest the
  // centre and k dots fill exactly k/n of the disc. Every dot keeps its place: a share is a soft
  // halo behind its dots or the same dots darkened, never dots removed.

  function fieldGeom(n, R) {
    var xs = new Float32Array(n), ys = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var r = R * Math.sqrt((i + 0.5) / n), a = i * GOLDEN;
      xs[i] = Math.cos(a) * r;
      ys[i] = Math.sin(a) * r;
    }
    var pitch = R * Math.sqrt(Math.PI / n);
    return { n: n, R: R, x: xs, y: ys, r: pitch * 0.34, halo: pitch * 0.78, pitch: pitch };
  }

  // The field's dots in one color, pre-rendered once (each dot a slightly irregular gouache dab).
  function fieldLayer(ctx, env, F, color, key) {
    var pad = Math.ceil(F.r * 2 + 2), size = Math.ceil(F.R * 2 + pad * 2);
    var c = env.ink.layer(ctx, 'v05:campo|' + key + '|' + F.n + '|' + F.R + '|' + color, size, size, function (g) {
      var r = env.rng('v05:campo:' + key);
      g.fillStyle = color;
      for (var i = 0; i < F.n; i++) {
        g.beginPath();
        g.ellipse(size / 2 + F.x[i] + r.jitter(0.3), size / 2 + F.y[i] + r.jitter(0.3), F.r * r.range(0.92, 1.06), F.r * r.range(0.9, 1.04),
          r() * Math.PI, 0, TAU);
        g.fill();
      }
    });
    return { c: c, size: size };
  }

  /* One field centred at (cx, cy). o: halo (count of haloed dots), dark (count of dark dots),
   * base (0..1: the dots themselves appear from the centre out), color, key, haloAlpha. */
  function drawField(ctx, env, F, cx, cy, o) {
    var m = env.pal.mundo, i, nh = Math.round(o.halo || 0), nd = Math.round(o.dark || 0);
    var base = o.base == null ? 1 : clamp01(o.base);
    if (base <= 0) return;
    if (nh > 0) {
      // One path for all the halos: their union is filled once, so overlaps never darken.
      ctx.save();
      ctx.globalAlpha *= o.haloAlpha == null ? 0.7 : o.haloAlpha;
      ctx.fillStyle = m.amarillo;
      ctx.beginPath();
      for (i = 0; i < nh; i++) {
        ctx.moveTo(cx + F.x[i] + F.halo, cy + F.y[i]);
        ctx.arc(cx + F.x[i], cy + F.y[i], F.halo, 0, TAU);
      }
      ctx.fill();
      ctx.fillStyle = env.ink.gouachePattern(ctx, 1);
      ctx.fill();
      ctx.restore();
    }
    var L = fieldLayer(ctx, env, F, o.color, o.key);
    ctx.save();
    if (base < 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, F.R * Math.sqrt(base) + F.r, 0, TAU);
      ctx.clip();
    }
    ctx.drawImage(L.c, cx - L.size / 2, cy - L.size / 2, L.size, L.size);
    ctx.restore();
    if (nd > 0) {
      ctx.fillStyle = m.tinta;
      ctx.beginPath();
      for (i = 0; i < nd; i++) {
        ctx.moveTo(cx + F.x[i] + F.r * 1.1, cy + F.y[i]);
        ctx.arc(cx + F.x[i], cy + F.y[i], F.r * 1.1, 0, TAU);
      }
      ctx.fill();
    }
  }

  // The legend marks of a field: a dot with its halo, or a dark dot (same look as in the field).
  function legendDot(ctx, env, x, y, kind, color, p) {
    if (p <= 0) return;
    var m = env.pal.mundo;
    ctx.save();
    ctx.globalAlpha *= p;
    if (kind === 'halo') {
      ctx.globalAlpha *= 0.7;
      ctx.fillStyle = m.amarillo;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, TAU);
      ctx.fill();
      ctx.globalAlpha /= 0.7;
    }
    ctx.fillStyle = kind === 'dark' ? m.tinta : color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · oficina — a warm desk seen from above, as a flat sketch in the notebook, and the person who
  // works at it. The job lies on the desk as one closed stack of cards; on «Pero la IA transforma
  // tareas…» it unfolds into a fan of five task cards (calling, deciding, teaching a newcomer,
  // writing, filing), and the small ruled lamp comes in and touches two of them: the tasks change,
  // the person and the job are still there.

  var OFI = {
    person: { x: 318, y: 556, k: 2.95 },
    fan: { x: 800, y: 566, r: 254, w: 136, h: 180, angles: [-0.9, -0.45, 0, 0.45, 0.9] },
    lamp: { x: 1136, y: 196, k: 0.5 },
    touched: [3, 4],
    blobs: ['celeste', 'verde', 'azul', 'amarillo', 'rojo']
  };

  // Where card i of the fan is when the fan is open by e (0: one closed stack on the desk).
  function fanCard(i, e, outp) {
    var F = OFI.fan, n = F.angles.length;
    var ei = inOut3(seg(e, i * 0.08, 0.68 + i * 0.08));
    var a = lerp((i - (n - 1) / 2) * 0.035, F.angles[i], ei), r = lerp(F.r * 0.9, F.r, ei);
    outp.x = F.x + Math.sin(a) * r;
    outp.y = F.y - Math.cos(a) * r + (1 - ei) * 26;
    outp.a = a;
    return outp;
  }

  function taskIcon(ctx, env, i, p) {
    var fig = env.fig;
    switch (i) {
      case 0:   // calling
        fig.phone(ctx, 10, -2, 1.05, { seed: 'v05:llama', p: p });
        env.ink.line(ctx, [-18, -28, -25, -16, -18, -4], { w: 2.8, profile: 'even', seed: 'v05:onda1', p: p });
        env.ink.line(ctx, [-28, -36, -38, -16, -28, 4], { w: 2.8, profile: 'even', seed: 'v05:onda2', p: p });
        break;
      case 1:   // deciding: the stamp that approves
        fig.stamp(ctx, 0, 32, 1.02, { seed: 'v05:decide', p: p });
        break;
      case 2:   // teaching someone who has just arrived
        fig.person(ctx, -24, 52, 0.78, { role: 'docente', pose: 'pointing', skin: 3, hair: 'bun', seed: 'v05:ensena', facing: 1, p: p });
        fig.person(ctx, 30, 52, 0.62, { role: 'estudiante', pose: 'lookingUp', skin: 1, hair: 'curly', seed: 'v05:llega', facing: -1, p: p });
        break;
      case 3:   // writing
        fig.sheet(ctx, 0, -2, 1.25, { seed: 'v05:escribe', p: p });
        break;
      case 4:   // filing
        fig.folder(ctx, 0, 0, 0.74, { seed: 'v05:archiva', p: p });
        break;
    }
  }

  function oficina(ctx, s, env) {
    var C = cuesOf(s, 'oficina'), st = s.state.oficina, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var intro = out3(s.intro), a = s.at(0);
    floaters(ctx, s, env, [['sol', 1170, 70, 56, { a: m.rojo }], ['estrella', 560, 92, 40], ['pajaro', 160, 210, 54]], intro);
    // The person stands behind the desk; the desk top (seen from above) hides the legs.
    var P = OFI.person;
    fig.person(ctx, P.x, P.y, P.k, { role: 'servidor', pose: 'presenting', facing: 1, skin: 4, hair: 'short', glasses: true, seed: 'v05:oficinista',
      cloth: m.verde, legs: m.tinta, p: out3(seg(s.intro, 0.2, 1)) });
    ink.draw(ctx, st.desk, 0, 0, 1, { p: seg(s.t, 0, 1.3), offset: 3 });
    // The job: a closed stack of cards on the desk that unfolds into the fan of tasks.
    var open = beat(a, C.pero - 0.02, C.pero + 0.16);
    var cardP = out3(beat(a, 0.02, Math.max(0.12, Math.min(C.puestos, 0.4))));
    var F = OFI.fan, n = F.angles.length, i;
    if (cardP > 0) {
      for (i = 0; i < n; i++) {
        var c = fanCard(i, open, Q1), touchedNow = OFI.touched.indexOf(i) >= 0 ? beat(a, C.tareas - 0.02, C.tareas + 0.08) : 0;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.a);
        // The flat color behind each task's sign blooms once its card is out of the stack.
        var ip = seg(open, 0.25 + i * 0.08, 0.6 + i * 0.08);
        ink.card(ctx, -F.w / 2, -F.h / 2, F.w, F.h, { seed: 'v05:tarea' + i, weight: 3.8, radius: 11, p: cardP });
        if (ip > 0) {
          ink.blob(ctx, 0, -4, 48, 44, { fill: m[OFI.blobs[i]], line: false, seed: 'v05:fondo' + i, irr: 0.2, n: 9, p: ip, fillAlpha: 0.55 });
          taskIcon(ctx, env, i, ip);
        }
        if (touchedNow > 0) {
          // The lamp's touch: a cool ruled corner mark on the task card.
          ink.rRect(ctx, F.w / 2 - 28, -F.h / 2 + 8, 20, 20, { color: env.pal.maquina.rejilla, w: 1.6, p: touchedNow });
        }
        ctx.restore();
      }
    }
    // «Pero la IA transforma tareas…»: the small ruled lamp comes in and touches two task cards.
    var lp = beat(a, C.tareas - 0.06, C.tareas + 0.04);
    if (lp > 0) {
      var L = OFI.lamp, ly = L.y + Math.sin(s.t * 1.1) * 2 * calm(s);
      for (i = 0; i < OFI.touched.length; i++) {
        fanCard(OFI.touched[i], 1, Q1);
        var cx = Q1.x + Math.cos(Q1.a) * (F.w / 2 - 18) - Math.sin(Q1.a) * (-F.h / 2 + 18);
        var cy = Q1.y + Math.sin(Q1.a) * (F.w / 2 - 18) + Math.cos(Q1.a) * (-F.h / 2 + 18);
        ruledThread(ctx, env, s, L.x, ly, cx, cy, beat(a, C.tareas - 0.02, C.tareas + 0.08));
      }
      fig.lamp(ctx, L.x, ly, L.k, { t: s.t, p: lp });
    }
  }

  // The desk seen from above: a flat warm top with a mug, a plant, loose papers and a pen.
  function deskSetup(env) {
    var m = env.pal.mundo, b = env.ink.drawing('v05:escritorio', { w: 4, jitter: 0.8 });
    // A long warm top with softly rounded corners (enough points that the brush keeps its edges).
    b.shape([136, 446, 150, 432, 420, 430, 700, 428, 980, 430, 1130, 432, 1146, 446, 1148, 500, 1146, 552, 1130, 566, 860, 568, 560, 568,
      150, 566, 136, 552, 134, 500], { fill: m.tierra, w: 5, fillJitter: 2, fillScale: 0.004 });
    // Loose papers.
    b.shape([196, 470, 286, 460, 294, 546, 204, 556], { fill: '@paper', w: 3, fillScale: 0 });
    b.stroke([214, 488, 270, 482], { w: 2, profile: 'even' });
    b.stroke([216, 506, 276, 500], { w: 2, profile: 'even' });
    b.stroke([218, 524, 258, 520], { w: 2, profile: 'even' });
    // A mug from above.
    b.circle(470, 506, 28, { fill: m.lienzo, w: 3.6 });
    b.circle(470, 506, 18, { fill: m.madera, w: 2, fillScale: 0 });
    b.stroke([498, 498, 514, 502, 512, 516, 496, 518], { w: 4, profile: 'blunt' });
    // A plant from above: leaves around the pot's rim.
    for (var i = 0; i < 7; i++) {
      var ang = i / 7 * TAU + 0.3;
      b.blob(1078 + Math.cos(ang) * 30, 500 + Math.sin(ang) * 22, 22, 12, { fill: i % 2 ? m.verde : env.pal.mix(m.verde, m.amarillo, 0.3),
        w: 2.6, irr: 0.12, rot: ang, n: 8 });
    }
    b.circle(1078, 500, 14, { fill: m.siena, w: 3 });
    // A pen.
    b.stroke([352, 548, 420, 538], { w: 6, profile: 'blunt', color: m.azul });
    return b.done({ colors: { paper: m.lienzo } });
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · exposicion — the world's employment as a round field of exactly 1.000 dots. «25%»: 250 get
  // a soft yellow halo (alguna exposición); «34%» and «11%»: two fields of 100 dots, 34 and 11
  // haloed; «3,3%»: 33 of the haloed dots turn dark (exposición más alta). A legend beside the field
  // names the halo and the dark dots. No dot ever leaves its place.

  var EXPO = {
    field: { x: 296, y: 292, R: 178 },
    caption: { y: 486, size: 26 },
    // Legend rows: the sample dot, the number and, below it, what it counts.
    legend: { dot: 574, num: 604, rows: [74, 202], numSize: 58, labelDy: 66, labelSize: 24 },
    small: { y: 446, R: 50, xs: [650, 826], valueY: 344, valueSize: 34, labelY: 504, labelSize: 19, labelW: 170 },
    tag1: { x: 962, y: 62 }, tag2: { x: 962, y: 190 }
  };

  function exposicion(ctx, s, env) {
    var C = cuesOf(s, 'exposicion'), st = s.state.expo, m = env.pal.mundo, ink = env.ink;
    ground(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1), Fd = EXPO.field, Lg = EXPO.legend, col = st.color;
    floaters(ctx, s, env, [['estrella', 96, 84, 42], ['espiral', 1196, 470, 36]], intro);
    // The world's employment: 1.000 dots fill in from the centre, then the halo and the dark dots.
    var nAlg = Math.round(val(env, rot(s, 'cifraAlguna')) * st.big.n / 100);
    var nMax = Math.round(val(env, rot(s, 'cifraMasAlta')) * st.big.n / 100);
    var w1 = landWindow(C.cifra), w2 = landWindow(C.masAlta);
    var g1 = out3(beat(a0, w1[0], w1[1])), g2 = out3(beat(a1, w2[0], w2[1]));
    drawField(ctx, env, st.big, Fd.x, Fd.y, { base: seg(s.t, 0.1, 1.3), halo: nAlg * g1, dark: nMax * g2, color: col, key: 'mundo' });
    ink.text(ctx, rot(s, 'empleoMundial'), Fd.x, EXPO.caption.y, { size: EXPO.caption.size, weight: 700, align: 'center', p: seg(s.t, 0.8, 1.6) });

    // Legend row 1: «25%» alguna exposición (trab-1, tied to the number).
    var n1 = seg(a0, w1[1], w1[1] + 0.04);
    if (n1 > 0) {
      var y1 = Lg.rows[0];
      legendDot(ctx, env, Lg.dot, y1 + 34, 'halo', col, n1);
      var H1 = hero(ctx, env, rot(s, 'cifraAlguna'), Lg.num, y1, Lg.numSize, { seed: 'v05:25', p: n1 });
      ink.text(ctx, rot(s, 'alguna'), Lg.num, y1 + Lg.labelDy, { size: Lg.labelSize, weight: 700, p: seg(a0, w1[1] + 0.02, w1[1] + 0.07) });
      sourceTag(ctx, env, 'trab-1', EXPO.tag1.x, EXPO.tag1.y, { x: Lg.num + H1.w + 6, y: y1 + 30 }, n1);
    }
    // The two income groups: fields of 100 dots, side by side, haloed as their chunk is said.
    var Sm = EXPO.small, ws = landWindow(C.paises), keys = ['ingresosAltos', 'ingresosBajos'];
    var sp = out3(beat(a0, ws[0] - 0.06, ws[0]));
    for (var i = 0; i < 2; i++) {
      if (sp <= 0) break;
      var text = rot(s, keys[i]), n = Math.round(val(env, text) * st.small.n / 100);
      var gi = out3(beat(a0, ws[0] + i * 0.03, ws[1] + i * 0.03));
      drawField(ctx, env, st.small, Sm.xs[i], Sm.y, { base: sp, halo: n * gi, color: col, key: 'grupo' + i });
      var vp = seg(a0, ws[1] + i * 0.03, ws[1] + i * 0.03 + 0.04);
      if (vp > 0) {
        hero(ctx, env, piece(text, ':', 1), Sm.xs[i], Sm.valueY, Sm.valueSize, { align: 'center', seed: 'v05:grupo' + i, p: vp });
        ink.text(ctx, piece(text, ':', 0), Sm.xs[i], Sm.labelY, { size: Sm.labelSize, weight: 700, align: 'center', maxWidth: Sm.labelW,
          lineHeight: 1.1, p: vp });
      }
    }
    // Legend row 2: «3,3%» exposición más alta (trab-2), once the glossary note has gone.
    var n2 = seg(a1, w2[1], w2[1] + 0.04);
    if (n2 > 0) {
      var y2 = Lg.rows[1];
      legendDot(ctx, env, Lg.dot, y2 + 34, 'dark', col, n2);
      var H2 = hero(ctx, env, rot(s, 'cifraMasAlta'), Lg.num, y2, Lg.numSize, { seed: 'v05:33', p: n2 });
      ink.text(ctx, rot(s, 'masAlta'), Lg.num, y2 + Lg.labelDy, { size: Lg.labelSize, weight: 700, p: seg(a1, w2[1] + 0.02, w2[1] + 0.07) });
      sourceTag(ctx, env, 'trab-2', EXPO.tag2.x, EXPO.tag2.y, { x: Lg.num + H2.w + 6, y: y2 + 30 }, n2);
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · tres-conceptos — three calligraphic doorways in a row, separated by crossed equals signs:
  // «Exposición» (sunlight falls on a desk: tasks the AI could support), «Automatización» (the small
  // ruled lamp doing a task, wired into the office's flow of papers), «Desplazamiento» (an empty
  // chair); the title «No son lo mismo». On «exposición no es desempleo» the scene presses warning
  // stamp 3 itself (sol sobre un escritorio ≠ silla vacía) and keeps it.

  var TRES = {
    ground: 486, k: 1.5, xs: [212, 626, 1040],
    label: { y: 506, size: 37 },
    neq: { y: 372, size: 78 },
    title: { x: 64, y: 40, size: 54 },
    stamp: { x: 1110, y: 126, size: 200 },
    keys: ['exposicion', 'automatizacion', 'desplazamiento']
  };

  // The inside of door 2: a desk, the lamp above it on a ruled wire, and the office's flow (a ruled
  // line across the doorway) carrying small papers that pass under the lamp.
  function automationInside(ctx, s, env, x, gy, p, flowP) {
    var q = env.pal.maquina, m = env.pal.mundo, ink = env.ink;
    var deskY = gy - 2, topY = gy - 66, lampY = gy - 172;
    env.fig.desk(ctx, x, deskY, 0.3, { p: p });
    if (p <= 0) return;
    // The flow: one ruled line along the desk top, out through both sides of the doorway.
    var y = topY - 4;
    ink.rLine(ctx, x - 112, y, x + 70, y, { color: q.rejilla, w: 2.4, p: flowP });
    ink.rLine(ctx, x, lampY + 26, x, y - 30, { color: q.rejilla, w: 2, p: flowP });
    // Papers travel along the line (slowly, ambient) and pass under the lamp, which marks them.
    if (flowP >= 1) {
      for (var i = 0; i < 3; i++) {
        var u = ((s.t * 0.08 + i / 3) % 1), px = x - 100 + u * 160, fade = Math.sin(Math.PI * u);
        ctx.save();
        ctx.globalAlpha *= clamp01(fade * 1.6);
        ctx.fillStyle = m.lienzo;
        ctx.strokeStyle = m.tinta;
        ctx.lineWidth = 2;
        ctx.fillRect(px - 11, y - 28, 22, 28);
        ctx.strokeRect(px - 11, y - 28, 22, 28);
        if (u > 0.5) ink.rLine(ctx, px - 6, y - 14, px + 6, y - 14, { color: q.rejilla, w: 2 });
        ctx.restore();
      }
    }
    env.fig.lamp(ctx, x, lampY, 0.48, { t: s.t, p: seg(p, 0.3, 1) });
  }

  function tresConceptos(ctx, s, env) {
    var C = cuesOf(s, 'tres-conceptos'), ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), T = TRES, gy = T.ground, i;
    // The three doorways and the crossed equals signs between them draw on as the line begins.
    var dp = [beat(a0, 0.01, 0.12), beat(a0, 0.04, 0.15), beat(a0, 0.07, 0.18)];
    for (i = 0; i < 3; i++) fig.doorway(ctx, T.xs[i], gy, T.k, { seed: 'v05:puerta' + i, p: dp[i] });
    for (i = 0; i < 2; i++) {
      fig.sign(ctx, 'distinto', (T.xs[i] + T.xs[i + 1]) / 2 + 22, T.neq.y, T.neq.size, { seed: 'v05:distinto' + i, p: beat(a0, 0.1 + i * 0.04, 0.2 + i * 0.04) });
    }
    label(ctx, env, rot(s, 'noSonLoMismo'), T.title.x, T.title.y, T.title.size, { seed: 'v05:nosonlomismo', underline: true, p: beat(a0, 0.02, 0.2) });

    // Door 1 · Exposición: sunlight falls on a desk.
    var e1 = beat(a0, C.expuesta - 0.02, C.expuesta + 0.12);
    if (e1 > 0) {
      // A soft beam from the sun to the desk top, then the sign itself.
      ctx.save();
      ctx.globalAlpha *= 0.32 * e1;
      ctx.fillStyle = m.amarillo;
      ctx.beginPath();
      ctx.moveTo(T.xs[0] - 22, gy - 150);
      ctx.lineTo(T.xs[0] + 22, gy - 150);
      ctx.lineTo(T.xs[0] + 66, gy - 92);
      ctx.lineTo(T.xs[0] - 66, gy - 92);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ink.glow(ctx, T.xs[0], gy - 150, 120, m.amarillo, 0.45 * e1);
      fig.sign(ctx, 'sol-escritorio', T.xs[0], gy - 96, 150, { seed: 'v05:sol-escritorio', p: e1 });
    }
    // Door 2 · Automatización: the lamp actually does a task, wired into the office's flow.
    var e2 = beat(a0, C.automatizacion - 0.02, C.automatizacion + 0.12);
    automationInside(ctx, s, env, T.xs[1], gy, e2, beat(a0, C.integracion - 0.04, C.integracion + 0.08));
    // Door 3 · Desplazamiento: an empty chair.
    var e3 = beat(a1, C.desplazamiento, C.desplazamiento + 0.1);
    if (e3 > 0) fig.chair(ctx, T.xs[2] - 6, gy - 72, 0.86, { seed: 'v05:silla', p: e3 });
    var lp = [e1, e2, e3];
    for (i = 0; i < 3; i++) {
      if (lp[i] > 0) label(ctx, env, rot(s, T.keys[i]), T.xs[i] + 20, T.label.y, T.label.size,
        { align: 'center', seed: 'v05:concepto' + i, p: seg(lp[i], 0.3, 1) });
    }
    // «Por eso, exposición no es desempleo»: the stamp presses on those words and stays.
    var press = beat(a1, C.desempleo - 0.02, C.desempleo + 0.14);
    if (press > 0) env.tags.warningStamp(ctx, 3, T.stamp.x, T.stamp.y, T.stamp.size, press);
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · desigual — exposure is not shared out evenly. One sun lights a row of work places: its
  // light falls most on the two administrative desks (folders, a stamp, papers) and faintly on the
  // others; then the small signs of media, software and finance drift in and join the light. On the
  // second line the work places give way to four fields of exactly 1.000 dots: «mujeres» (47 dark)
  // and «hombres» (24 dark) of the «empleo mundial», then the same for «países de ingresos altos»
  // (96 and 35); each value over its field and one source tag for the figure (trab-3).

  var DES = {
    floor: 506, sun: { x: 640, y: 96, size: 116 },
    stations: [
      { x: 178, admin: true, desk: true, person: { role: 'servidor', skin: 1, hair: 'short', seed: 'v05:adm1', cloth: 'azul' } },
      { x: 430, admin: true, desk: true, person: { role: 'directiva', skin: 4, hair: 'bun', seed: 'v05:adm2', cloth: 'rojo' } },
      { x: 812, admin: false, desk: false, person: { role: 'campesina', skin: 2, hair: 'braids', seed: 'v05:campo', cloth: 'verde' } },
      { x: 1072, admin: false, desk: false, person: { role: 'medica', skin: 3, hair: 'long', seed: 'v05:salud' } }
    ],
    joiners: [{ kind: 'medios', x: 104, y: 214, cue: 'medios' }, { kind: 'software', x: 304, y: 178, cue: 'software' },
      { kind: 'finanzas', x: 500, y: 214, cue: 'finanzas' }],
    fields: { y: 306, R: 110, xs: [222, 474, 806, 1058], valueY: 132, valueSize: 46, labelY: 428, labelSize: 25 },
    captions: { y: 50, size: 32, xs: [350, 930] },
    keys: [['mujeres', 'mujeresMundo'], ['hombres', 'hombresMundo'], ['mujeres', 'mujeresAltos'], ['hombres', 'hombresAltos']],
    legend: { x: 92, y: 484 },
    tag: { x: 566, y: 456 }
  };

  // One work place: its person, its desk (seen from the front) and what lies on it.
  function station(ctx, env, S, i, p) {
    var fig = env.fig, m = env.pal.mundo, gy = DES.floor, sp = S.person;
    var who = { role: sp.role, pose: S.desk ? 'standing' : 'presenting', facing: i % 2 ? -1 : 1, skin: sp.skin, hair: sp.hair, seed: sp.seed,
      cloth: sp.cloth ? m[sp.cloth] : null, p: p };
    if (S.desk) {
      fig.person(ctx, S.x, gy - 8, 1.95, who);
      fig.desk(ctx, S.x, gy, 0.46, { p: p });
      var top = gy - 210 * 0.46;
      if (i === 0) {
        fig.folder(ctx, S.x - 44, top - 14, 0.34, { seed: 'v05:carpeta0', p: p });
        fig.stamp(ctx, S.x + 52, top + 1, 0.46, { seed: 'v05:sello0', p: p });
      } else {
        fig.sheet(ctx, S.x - 52, top - 20, 0.62, { seed: 'v05:hoja1', p: p, rot: -0.2 });
        fig.sheet(ctx, S.x - 36, top - 18, 0.62, { seed: 'v05:hoja2', p: p, rot: 0.1 });
        fig.folder(ctx, S.x + 46, top - 14, 0.34, { seed: 'v05:carpeta1', p: p });
      }
    } else {
      fig.person(ctx, S.x, gy, 1.95, who);
      if (sp.role === 'campesina') {
        for (var k = 0; k < 3; k++) {
          env.ink.blob(ctx, S.x + 70 + k * 30, gy - 16 - (k % 2) * 6, 9, 20, { fill: k % 2 ? m.verde : env.pal.mix(m.verde, m.amarillo, 0.3),
            w: 2.4, irr: 0.15, rot: (k - 1) * 0.3, n: 8, seed: 'v05:brote' + k, p: p });
        }
      }
    }
  }

  // A small sign of the work that multimodality reaches: a headline, a laptop, coins.
  function joinerSign(ctx, env, kind, x, y, p) {
    var fig = env.fig, m = env.pal.mundo, ink = env.ink;
    if (kind === 'medios') fig.headline(ctx, x, y, 0.42, { seed: 'v05:medios', masthead: m.rojo, p: p });
    else if (kind === 'finanzas') {
      fig.coin(ctx, x - 14, y + 6, 0.42, { seed: 'v05:moneda0', p: p });
      fig.coin(ctx, x + 10, y - 4, 0.42, { seed: 'v05:moneda1', p: p });
    } else {
      ink.shape(ctx, [x - 34, y + 14, x + 34, y + 14, x + 40, y + 22, x - 40, y + 22], { fill: m.lienzoOcre, w: 2.6, seed: 'v05:laptop-base', p: p, fillScale: 0 });
      ink.shape(ctx, [x - 30, y + 14, x - 26, y - 26, x + 26, y - 26, x + 30, y + 14], { fill: m.azul, w: 2.6, seed: 'v05:laptop-pantalla', p: p, fillScale: 0 });
      ink.line(ctx, [x - 16, y - 12, x - 4, y - 12], { w: 2.4, profile: 'even', color: m.amarillo, seed: 'v05:codigo0', p: p });
      ink.line(ctx, [x - 10, y - 2, x + 14, y - 2], { w: 2.4, profile: 'even', color: m.lienzo, seed: 'v05:codigo1', p: p });
    }
  }

  // Light from the sun onto a place: a soft beam that widens toward it.
  function beam(ctx, env, x, y, alpha) {
    if (alpha <= 0) return;
    var S = DES.sun;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = env.pal.mundo.amarillo;
    ctx.beginPath();
    ctx.moveTo(S.x - 16, S.y + 30);
    ctx.lineTo(S.x + 16, S.y + 30);
    ctx.lineTo(x + 92, y);
    ctx.lineTo(x - 92, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function desigual(ctx, s, env) {
    var C = cuesOf(s, 'desigual'), st = s.state.desigual, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), i, intro = out3(s.intro);
    // Line 1: the work places under one sun (they give way to the fields as line 2 begins).
    var away = 1 - seg(a1, 0, 0.05);
    if (away > 0) {
      ctx.save();
      ctx.globalAlpha *= away;
      var lit = beat(a0, 0.02, 0.14), adm = beat(a0, C.administrativas - 0.02, C.administrativas + 0.1);
      for (i = 0; i < DES.stations.length; i++) {
        var S = DES.stations[i];
        beam(ctx, env, S.x, DES.floor - 120, lit * (S.admin ? 0.12 + 0.2 * adm : 0.09));
        if (S.admin) ink.glow(ctx, S.x, DES.floor - 110, 120, m.amarillo, 0.5 * adm);
      }
      for (i = 0; i < DES.joiners.length; i++) {
        var J = DES.joiners[i], jp = beat(a0, C[J.cue] - 0.04, C[J.cue] + 0.02);
        if (jp > 0) ink.glow(ctx, J.x, J.y, 70, m.amarillo, 0.45 * jp);
      }
      fig.sign(ctx, 'sol', DES.sun.x, DES.sun.y, DES.sun.size, { seed: 'v05:sol-desigual', rays: true, p: intro });
      for (i = 0; i < DES.stations.length; i++) station(ctx, env, DES.stations[i], i, out3(seg(s.intro, 0.1 + i * 0.08, 0.7 + i * 0.08)));
      for (i = 0; i < DES.joiners.length; i++) {
        var J2 = DES.joiners[i], e = inOut3(beat(a0, C[J2.cue] - 0.1, C[J2.cue]));
        if (e <= 0) continue;
        // Each sign drifts in from the right edge and settles beside the administrative desks.
        joinerSign(ctx, env, J2.kind, lerp(1340, J2.x, e), lerp(J2.y - 60, J2.y, e) + Math.sin(s.t * 0.9 + i) * 2 * e, 1);
      }
      ctx.restore();
    }
    // Line 2: four fields of exactly 1.000 dots; dark dots = exposición más alta.
    var Fd = DES.fields, Cp = DES.captions, w1 = landWindow(C.mundo), w2 = landWindow(C.altos);
    var show = [seg(a1, 0, 0.05), seg(a1, 0, 0.05), beat(a1, w2[0] - 0.06, w2[0]), beat(a1, w2[0] - 0.06, w2[0])];
    var grow = [out3(beat(a1, w1[0], w1[1])), out3(beat(a1, w1[0] + 0.02, w1[1] + 0.02)), out3(beat(a1, w2[0], w2[1])), out3(beat(a1, w2[0] + 0.02, w2[1] + 0.02))];
    var land = [seg(a1, w1[1], w1[1] + 0.03), seg(a1, w1[1] + 0.02, w1[1] + 0.05), seg(a1, w2[1], w2[1] + 0.03), seg(a1, w2[1] + 0.02, w2[1] + 0.05)];
    if (show[2] > 0) ink.line(ctx, st.divider, { w: 3, profile: 'swell', seed: 'v05:divisor', p: show[2], dot: 'detached' });
    for (i = 0; i < 4; i++) {
      if (show[i] <= 0) continue;
      var key = DES.keys[i], n = Math.round(val(env, rot(s, key[1])) * st.field.n / 100);
      drawField(ctx, env, st.field, Fd.xs[i], Fd.y, { base: show[i], dark: n * grow[i], color: st.color, key: 'desigual' + i });
      ink.text(ctx, rot(s, key[0]), Fd.xs[i], Fd.labelY, { size: Fd.labelSize, weight: 700, align: 'center', p: show[i] });
      if (land[i] > 0) hero(ctx, env, rot(s, key[1]), Fd.xs[i], Fd.valueY - 12, Fd.valueSize, { align: 'center', seed: 'v05:desigual' + i, p: land[i] });
    }
    if (show[0] > 0) label(ctx, env, rot(s, 'empleoMundial'), Cp.xs[0], Cp.y, Cp.size, { align: 'center', seed: 'v05:cap-mundo', p: show[0] });
    if (show[2] > 0) label(ctx, env, rot(s, 'ingresosAltos'), Cp.xs[1], Cp.y, Cp.size, { align: 'center', seed: 'v05:cap-altos', p: show[2] });
    if (show[0] > 0) {
      legendDot(ctx, env, DES.legend.x, DES.legend.y + 14, 'dark', st.color, show[0]);
      ink.text(ctx, rot(s, 'masAlta'), DES.legend.x + 22, DES.legend.y, { size: 24, weight: 700, p: show[0] });
    }
    // One tag for the figure, tied to the edge of the men's field of the first pair.
    sourceTag(ctx, env, 'trab-3', DES.tag.x, DES.tag.y, { x: Fd.xs[1] + Fd.R * 0.72, y: Fd.y + Fd.R * 0.72 }, land[0]);
  }

  // ---------------------------------------------------------------------------------------------
  // The career ladder of lámina D9 (wooden rails with brush outlines, brush rungs), six rungs evenly
  // spaced. Local units: foot centre at (0, 0), up is negative. Its first rung is drawn apart: whole,
  // as the dots it dissolves into, or (cierre) a new rung of another shape.

  var LAD = { x: 430, y: 524, h: 392, w: 124, top: 96, lean: 0.07, rungs: 6 };
  function ladL(up) { return lerp(-LAD.w / 2, -LAD.top / 2 + LAD.lean * LAD.h, up / LAD.h); }
  function ladR(up) { return lerp(LAD.w / 2, LAD.top / 2 + LAD.lean * LAD.h, up / LAD.h); }
  function rungUp(i) { return (i + 1) * LAD.h / (LAD.rungs + 1); }

  function ladderSetup(env) {
    var m = env.pal.mundo, ink = env.ink, H2 = LAD.h, i;
    var b = ink.drawing('v05:escalera', { w: 4, jitter: 0.8 });
    [[ladL, m.tierra], [ladR, env.pal.mix(m.tierra, m.siena, 0.4)]].forEach(function (side) {
      var f = side[0], pts = [], j;
      for (j = 0; j <= 6; j++) pts.push(f(H2 * j / 6) - 6, -H2 * j / 6);
      for (j = 6; j >= 0; j--) pts.push(f(H2 * j / 6) + 6, -H2 * j / 6);
      b.shape(pts, { fill: side[1], w: 3.8, fillJitter: 1.2, fillScale: 0.004 });
    });
    for (i = 1; i < LAD.rungs; i++) {
      var up = rungUp(i);
      b.stroke([ladL(up) + 6, -up, (ladL(up) + ladR(up)) / 2, -up + b.r.jitter(2), ladR(up) - 6, -up + b.r.jitter(1.5)], { w: 7, profile: 'blunt' });
    }
    var up0 = rungUp(0), l0 = ladL(up0), r0 = ladR(up0);
    var b0 = ink.drawing('v05:peldano', { w: 7, jitter: 0.8 });
    b0.stroke([l0 + 6, -up0, (l0 + r0) / 2, -up0 + 1.5, r0 - 6, -up0 + 0.5], { w: 7, profile: 'blunt' });
    // The dots it dissolves into: they shrink and sag toward the right; a few have already fallen.
    var r = env.rng('v05:puntos'), dots = [];
    for (i = 0; i < 11; i++) {
      var u = i / 10;
      dots.push({ x: lerp(l0 + 7, r0 - 7, u) + r.jitter(1.5), y: -up0 + u * u * 14 + r.jitter(1.6), r: lerp(4.6, 1.8, u) });
    }
    dots.push({ x: l0 + 30, y: -up0 + 26, r: 2 }, { x: l0 + 62, y: -up0 + 40, r: 1.7 }, { x: r0 - 16, y: -up0 + 34, r: 1.5 });
    // The new first rung of another shape (cierre): a wavy plank, red, wider than the old rung.
    var bn = ink.drawing('v05:peldano-nuevo', { w: 4, jitter: 0.6 }), pts2 = [], k;
    for (k = 0; k <= 8; k++) pts2.push(lerp(l0 - 16, r0 + 16, k / 8), -up0 - 9 + Math.sin(k * 1.4) * 3);
    for (k = 8; k >= 0; k--) pts2.push(lerp(l0 - 16, r0 + 16, k / 8), -up0 + 9 + Math.sin(k * 1.4 + 1) * 3);
    bn.shape(pts2, { fill: m.rojo, w: 4, fillJitter: 1, fillScale: 0.01 });
    bn.dot(l0 - 4, -up0, 3.2);
    bn.dot(r0 + 4, -up0, 3.2);
    var ground2 = ink.drawing('v05:suelo', { w: 4.6, jitter: 0.8 });
    ground2.stroke([-380, 0, -120, 2, 80, -1, 178, 1], { w: 4.6, profile: 'blunt' });
    return { rails: b.done(), rung0: b0.done(), dots: dots, newRung: bn.done(), ground: ground2.done(), up0: up0, l0: l0, r0: r0 };
  }

  // The ladder at (LAD.x, LAD.y): rails and upper rungs (p), the first rung whole (1 - gone) and
  // as dots (gone); in the ambient loop a few dots drift down and fade.
  function drawLadder(ctx, s, env, L, o) {
    var ink = env.ink, m = env.pal.mundo;
    ink.draw(ctx, L.ground, LAD.x, LAD.y, 1, { p: o.p });
    ink.draw(ctx, L.rails, LAD.x, LAD.y, 1, { p: o.p, offset: 3 });
    var gone = o.gone || 0;
    if (gone < 1) ink.draw(ctx, L.rung0, LAD.x, LAD.y, 1, { p: o.p, alpha: 1 - gone });
    if (gone <= 0) return;
    ctx.save();
    ctx.globalAlpha *= gone;
    for (var i = 0; i < L.dots.length; i++) ink.dot(ctx, LAD.x + L.dots[i].x, LAD.y + L.dots[i].y, L.dots[i].r, m.tinta);
    if (o.drift) {
      for (var k = 0; k < 4; k++) {
        var u = (s.t * 0.12 + k / 4) % 1, px = LAD.x + lerp(L.l0 + 14, L.r0 - 14, (k + 0.5) / 4) + Math.sin(TAU * (u + k * 0.3)) * 4;
        ctx.save();
        ctx.globalAlpha *= Math.sin(Math.PI * u) * 0.8;
        ink.dot(ctx, px, LAD.y - L.up0 + 12 + u * (L.up0 - 16), 1.9 - u * 0.6, m.tinta);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · entrada — lámina D9's metaphor: the warm career ladder whose first rung dissolves into dots
  // as «puestos de entrada» is said; someone already up the ladder; a young person looks up from
  // below. Beside it, the figure: «Desarrolladores de software de 22 a 25 años · EE. UU.» and
  // «casi −20%» as a bar on a 0–100% track that stops at the stated value with a dotted cap and «≈»
  // (trab-4). Then the hypothesis, marked as such: a dotted arrow from the lost rung to the small
  // lamp, and the note «Una hipótesis plausible, pero no demostrada». Last, the lectora asks; the
  // pause holds the image.

  var ENT = {
    head: { x: 690, y: 66, w: 430, size: 30 },
    value: { x: 690, size: 68 },
    track: { x: 692, len: 500, h: 40 },
    tag: { x: 962 },
    young: { dx: -132, k: 1.62 },
    climber: { rung: 3, k: 1.02 },
    lamp: { x: 604, y: 418, k: 0.42 },
    note: { x: 650, y: 494, size: 25, w: 600 },
    lectora: { x: 104, y: 606, k: 2.62 }
  };

  function entrada(ctx, s, env) {
    var C = cuesOf(s, 'entrada'), st = s.state.ladder, ink = env.ink, fig = env.fig, chart = env.chart, m = env.pal.mundo;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), a2 = s.at(2), intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 590, 132, 64, { a: m.rojo }], ['estrella', 214, 150, 42, { a: m.amarillo }]], intro);
    // The ladder; its first rung dissolves on «puestos de entrada».
    var gone = beat(a0, C.entrada - 0.03, C.entrada + 0.12);
    drawLadder(ctx, s, env, st, { p: seg(s.t, 0, 1.4), gone: gone, drift: gone >= 1 });
    // «…aún no muestran un patrón general»: the rest of the ladder holds (a soft light on its rungs).
    var holds = beat(a0, C.patron - 0.02, C.patron + 0.1) * (1 - 0.5 * seg(a0, C.patron + 0.2, 1));
    if (holds > 0) {
      for (var r = 1; r < LAD.rungs; r++) {
        var up = rungUp(r);
        ink.glow(ctx, LAD.x + (ladL(up) + ladR(up)) / 2, LAD.y - up, 46, m.amarillo, 0.35 * holds);
      }
    }
    var cu = rungUp(ENT.climber.rung), cx = LAD.x + (ladL(cu) + ladR(cu)) / 2;
    fig.person(ctx, cx, LAD.y - cu - 2, ENT.climber.k, { role: 'persona', pose: 'carrying', facing: 1, seed: 'v05:escala', skin: 1, hair: 'bun',
      cloth: m.rojo, legs: m.tinta, p: out3(seg(s.intro, 0.3, 1)) });
    fig.person(ctx, LAD.x + ENT.young.dx, LAD.y, ENT.young.k, { role: 'estudiante', pose: 'lookingUp', facing: 1, seed: 'v05:joven', skin: 3,
      hair: 'curly', cloth: m.amarillo, legs: m.azul, p: out3(seg(s.intro, 0.4, 1)) });

    // The figure: its label writes on just before the bar lands, by the chunk that says it.
    var text = rot(s, 'caida'), who = piece(text, ' · ', 0), where = piece(text, ' · ', 1), what = piece(text, ' · ', 2);
    var pv = chart.parseValue(what), rest = what.slice(pv.index + pv.raw.length).trim();
    var win = landWindow(C.cifra), Hd = ENT.head;
    var hp = beat(a0, win[0] - 0.06, win[0] + 0.04);
    var HL = ink.text(ctx, who, Hd.x, Hd.y, { size: Hd.size, weight: 700, maxWidth: Hd.w, lineHeight: 1.12, p: hp });
    var WL = ink.text(ctx, where, Hd.x, Hd.y + HL.h + 6, { size: 23, italic: true, p: hp });
    var vy = Hd.y + HL.h + WL.h + 18, ty = vy + 132;
    var T = ENT.track, sc = chart.scale(100, T.x, T.len);
    var tp = seg(hp, 0.4, 1);
    if (tp > 0) {
      ctx.save();
      ctx.globalAlpha *= tp * 0.55;
      ctx.strokeStyle = m.tinta;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(T.x, ty, T.len, T.h);
      ctx.restore();
      chart.baseline(ctx, T.x, ty - 10, ty + T.h + 10, { p: tp });
    }
    var bp = beat(a0, win[0], win[1]);
    var gb = chart.bar(ctx, { text: what, scale: sc, y: ty, h: T.h, labels: false, seed: 'v05:caida', p: bp, color: m.rojo });
    var lp = seg(a0, win[1], win[1] + 0.03);
    if (lp > 0) {
      var VL = hero(ctx, env, pv.raw, ENT.value.x, vy, ENT.value.size, { seed: 'v05:caida', p: lp });
      ink.text(ctx, rest, ENT.value.x + 4, vy + VL.h - 2, { size: 26, weight: 700, p: lp });
      // «≈» beside the dotted cap at the exact value.
      ink.text(ctx, env.pal.legend.words.aprox, gb.x1 + 12, ty + 2, { size: 32, weight: 700, p: lp });
    }
    // The tag comes with the label (it already holds numbers) and stays tied to the bar's value edge.
    sourceTag(ctx, env, 'trab-4', ENT.tag.x, ty + T.h + 26, { x: gb.x1 + 2, y: ty + T.h }, hp);

    // Line 2: the hypothesis, drawn as one: a dotted arrow from the lost rung to the small lamp.
    var h1 = beat(a1, 0.01, 0.2), h2 = beat(a1, C.automatizando - 0.04, C.automatizando + 0.1);
    if (h1 > 0) ink.text(ctx, rot(s, 'hipotesis'), ENT.note.x, ENT.note.y, { size: ENT.note.size, italic: true, maxWidth: ENT.note.w, p: h1 });
    if (h2 > 0) {
      var Lp = ENT.lamp;
      ink.arrow(ctx, st.hypArrow, { w: 3, headSize: 12, dotted: true, seed: 'v05:hipotesis', p: h2 });
      fig.lamp(ctx, Lp.x, Lp.y + Math.sin(s.t * 1.1) * 1.5 * calm(s), Lp.k, { t: s.t, p: seg(h2, 0.4, 1) });
    }
    // Line 3: the lectora steps in and asks; the pause holds the image.
    var lq = out3(seg(a2, 0, 0.25));
    if (lq > 0) fig.lectora(ctx, ENT.lectora.x, ENT.lectora.y, ENT.lectora.k, { pose: 'asking', facing: 1, p: lq });
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · competencias — a comet with a dotted tail crosses the sky toward a small road sign «2030»,
  // with the chip «Proyección»; «39%» lands whole with its label and tag (trab-5). Skill signs drift
  // up as they are named: «IA y datos», «redes y ciberseguridad», «alfabetización tecnológica»;
  // beside them, warm human signs: «pensamiento creativo», «resiliencia», «flexibilidad»,
  // «colaboración».

  var COMP = {
    horizon: 0.55,
    sign: { x: 1156, y: 400, k: 0.9 },
    chip: { x: 952, y: 296 },
    number: { x: 92, y: 112, size: 104 }, label: { x: 336, y: 130, w: 330, size: 27 }, tag: { x: 104, y: 262 },
    flight: 0.82,
    // [rótulo key, sign kind, x, y]: the three fastest-growing skills, then the human ones.
    skills: [['iaDatos', 'lampara', 75, 444, 'iaDatos'], ['redes', 'candado', 345, 444, 'redes'], ['alfabetizacion', 'portatil', 787, 444, 'alfabetizacion'],
      ['pensamientoCreativo', 'espiral', 61, 530, 'pensamiento'], ['resiliencia', 'brote', 468, 530, 'resiliencia'],
      ['flexibilidad', 'cabellos', 718, 530, 'flexibilidad'], ['colaboracion', 'corazon', 981, 530, 'colaboracion']]
  };

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
  var Q2 = {};

  // A skill's sign, about 48 px, centred at (x, y).
  function skillSign(ctx, s, env, kind, x, y, p) {
    var fig = env.fig, m = env.pal.mundo, ink = env.ink;
    switch (kind) {
      case 'lampara': fig.lamp(ctx, x, y, 0.4, { t: s.t, p: p }); break;
      case 'candado': fig.lock(ctx, x, y + 2, 0.56, { seed: 'v05:candado', p: p }); break;
      case 'portatil': joinerSign(ctx, env, 'software', x, y + 2, p); break;
      case 'espiral': fig.sign(ctx, 'espiral', x, y, 50, { seed: 'v05:creativo', p: p }); break;
      case 'brote':
        ink.blob(ctx, x - 12, y + 2, 9, 20, { fill: m.verde, w: 2.4, irr: 0.15, rot: -0.5, n: 8, seed: 'v05:hoja-a', p: p });
        ink.blob(ctx, x + 12, y - 4, 9, 22, { fill: env.pal.mix(m.verde, m.amarillo, 0.3), w: 2.4, irr: 0.15, rot: 0.45, n: 8, seed: 'v05:hoja-b', p: p });
        ink.line(ctx, [x, y + 24, x - 1, y + 6, x + 2, y - 10], { w: 3, profile: 'lift', seed: 'v05:tallo', p: p });
        break;
      case 'cabellos': fig.sign(ctx, 'cabellos', x, y, 54, { seed: 'v05:flexible', p: p }); break;
      case 'corazon': fig.sign(ctx, 'corazon-mano', x, y, 46, { seed: 'v05:colabora', p: p }); break;
    }
  }

  function competencias(ctx, s, env) {
    var C = cuesOf(s, 'competencias'), st = s.state.comp, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env, 'territorio');
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro), win = landWindow(C.cifra);
    floaters(ctx, s, env, [['estrella', 700, 64, 30, { a: m.amarillo }], ['estrella', 1210, 120, 26], ['estrella', 860, 330, 22]], intro);
    fig.roadSign(ctx, COMP.sign.x, COMP.sign.y, COMP.sign.k, { text: rot(s, 'senal'), p: out3(seg(s.intro, 0.2, 1)), seed: 'v05:senal' });
    env.tags.chip(ctx, 'proyeccion', rot(s, 'chip'), { x: COMP.chip.x, y: COMP.chip.y, size: 22, pill: true, p: out3(seg(s.intro, 0.4, 1)) });
    // The comet flies most of its arc before the figure lands, then drifts on toward the sign.
    var tLand = lineT(s, 0, win[1]);
    var u = COMP.flight * inOut3(seg(s.t, 0.2, tLand)) + (1 - COMP.flight) * seg(s.t, tLand, s.dur);
    if (u > 0) {
      var g = st.path, per = 22 / g.len;
      for (var i = 16; i >= 7; i--) {
        var ub = u - i * per;
        if (ub <= 0) continue;
        pathAt(g, ub, Q2);
        ink.dot(ctx, Q2.x, Q2.y, Math.max(1.3, 5.6 - (i - 7) * 0.45) * (0.8 + 0.2 * Math.sin(s.t * 2.2 + i)), m.tinta);
      }
      pathAt(g, u, Q1);
      // The sign's head is off its centre: place the head on the path.
      var ro = Q1.a + 0.686, hx = 44 * Math.cos(ro) + 36 * Math.sin(ro), hy = 44 * Math.sin(ro) - 36 * Math.cos(ro);
      fig.sign(ctx, 'cometa', Q1.x - hx, Q1.y - hy + Math.sin(s.t * 0.9) * 3, 200, { seed: 'v05:cometa', rot: ro });
    }
    // «39%», whole, by its chunk; label and tag with it.
    var np = beat(a0, win[0], win[1]);
    if (np > 0) {
      var N = COMP.number, LB = COMP.label;
      var L = hero(ctx, env, rot(s, 'cifra'), N.x, N.y, N.size, { seed: 'v05:39', p: np });
      ink.text(ctx, rot(s, 'etiqueta'), LB.x, LB.y, { size: LB.size, weight: 700, maxWidth: LB.w, lineHeight: 1.16, p: seg(np, 0.3, 1) });
      // The thread leaves the number's lower-left corner, so it never crosses the label.
      sourceTag(ctx, env, 'trab-5', COMP.tag.x, COMP.tag.y, { x: N.x + 14, y: N.y + L.h - 16 }, np);
    }
    // The skills drift up as they are named, and settle.
    for (i = 0; i < COMP.skills.length; i++) {
      var sk = COMP.skills[i], line = i < 3 ? a0 : a1, cue = C[sk[4]];
      var e = beat(line, cue - 0.05, cue + 0.06);
      if (e <= 0) continue;
      var ee = out3(e), y = lerp(sk[3] + 70, sk[3], ee) + noise(s.t * 0.25 + i, 'v05:sube' + i) * 3 * calm(s);
      ctx.save();
      ctx.globalAlpha *= clamp01(e * 2);
      skillSign(ctx, s, env, sk[1], sk[2] + 28, y, 1);
      ink.text(ctx, rot(s, sk[0]), sk[2] + (sk[1] === 'portatil' ? 80 : 66), y - 17, { size: 27, weight: 700 });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · siete — seven small cards fan out like a hand of cards as the base report's seven
  // capacities are named, each with a sign and its short label: «Comprender», «Formular»,
  // «Verificar», «Proteger», «Diseñar y supervisar», «Documentar», «Evaluar».

  var SIETE = {
    pivot: { x: 640, y: 706 }, r: 430, w: 132, h: 188,
    angles: [-0.96, -0.64, -0.32, 0, 0.32, 0.64, 0.96],
    keys: ['comprender', 'formular', 'verificar', 'proteger', 'disenarSupervisar', 'documentar', 'evaluar'],
    cues: [[0, 'comprender'], [0, 'formular'], [0, 'verificar'], [1, 'proteger'], [1, 'diseñar y supervisar'], [1, 'documentar'], [1, 'evaluar']],
    blobs: ['amarillo', 'rojo', 'verde', 'azul', 'celeste', 'amarillo', 'rojo'],
    title: { x: 64, y: 40, size: 44 }
  };

  function capacityIcon(ctx, s, env, i, p) {
    var fig = env.fig, ink = env.ink;
    switch (i) {
      case 0:   // understanding what the AI can and cannot do: the lamp inside its limits
        ink.dotted(ctx, s.state.siete.ring, { closed: true, r: 2, gap: 9, seed: 'v05:limites', p: p });
        fig.lamp(ctx, 0, 0, 0.42, { t: s.t, p: p });
        break;
      case 1: fig.key(ctx, 4, 0, 0.8, { seed: 'v05:llave', p: p }); break;
      case 2: ink.line(ctx, [-26, -2, -8, 18, 28, -24], { w: 9, profile: 'blunt', seed: 'v05:visto', p: p }); break;
      case 3: fig.lock(ctx, 0, 2, 0.74, { seed: 'v05:protege', p: p }); break;
      case 4: fig.steeringWheel(ctx, -4, -4, 0.2, { seed: 'v05:supervisa', p: p }); break;
      case 5: fig.sheet(ctx, 0, 0, 0.96, { seed: 'v05:documenta', p: p }); break;
      case 6: fig.balance(ctx, 0, 30, 0.22, { seed: 'v05:evalua', p: p }); break;
    }
  }

  function siete(ctx, s, env) {
    var st = s.state.siete, ink = env.ink, m = env.pal.mundo, S = SIETE, i;
    ground(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), lines = [s.at(0), s.at(1)];
    floaters(ctx, s, env, [['estrella', 1180, 90, 40], ['luna', 1100, 200, 40], ['pajaro', 96, 220, 54]], intro);
    label(ctx, env, rot(s, 'titulo'), S.title.x, S.title.y, S.title.size, { seed: 'v05:siete', underline: true, maxWidth: 1100, p: beat(a0, 0.01, 0.3) });
    var cp = out3(beat(a0, 0.02, 0.12));
    if (cp <= 0) return;
    var opens = [], order = [], j;
    for (i = 0; i < 7; i++) {
      var cue = s.cue ? s.cue(S.cues[i][0], S.cues[i][1], 'word') : null;
      cue = cue == null ? 0.5 : cue;
      opens.push(inOut3(beat(lines[S.cues[i][0]], cue - 0.04, cue + 0.06)));
    }
    // Cards still in the closed stack lie under the opened ones (the next to open on top of it).
    for (i = 6; i >= 0; i--) if (opens[i] <= 0) order.push(i);
    for (i = 0; i < 7; i++) if (opens[i] > 0) order.push(i);
    for (j = 0; j < order.length; j++) {
      i = order[j];
      var open = opens[i];
      var a = lerp((i - 3) * 0.02, S.angles[i], open), r = lerp(S.r * 0.92, S.r, open);
      var cx = S.pivot.x + Math.sin(a) * r, cy = S.pivot.y - Math.cos(a) * r + (1 - open) * 30;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ink.card(ctx, -S.w / 2, -S.h / 2, S.w, S.h, { seed: 'v05:capacidad' + i, weight: 3.8, radius: 11, p: cp });
      var ip = seg(open, 0.35, 1);
      if (ip > 0) {
        ink.blob(ctx, 0, -38, 42, 36, { fill: m[S.blobs[i]], line: false, seed: 'v05:capfondo' + i, irr: 0.2, n: 9, p: ip, fillAlpha: 0.55 });
        ctx.save();
        ctx.translate(0, -38);
        capacityIcon(ctx, s, env, i, ip);
        ctx.restore();
        ink.text(ctx, rot(s, S.keys[i]), 0, 18, { size: 21, weight: 700, align: 'center', maxWidth: S.w - 26, maxLines: 2, fit: true, minSize: 15,
          lineHeight: 1.08, p: ip });
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · tareas-caso — the team's case card «Nuestro caso de uso» splits into seven task cards; each
  // gets one of three stamps, shown with their meaning: «La IA apoya» (the lamp beside a person),
  // «La IA podría realizarla» (the lamp alone), «La persona es indispensable» (a person alone). One
  // card gets a small ladder sign, «escalón de entrada», and a warm ring: that learning is kept.

  var CASO = {
    card: { x: 640, y: 136, w: 340, h: 150 },
    tasks: { y: 302, w: 128, h: 158, x0: 124, dx: 172, n: 7 },
    stampOf: [0, 2, 1, 0, 2, 1, 0],          // which stamp each task card gets (any mix: the cards are blank)
    entry: 2,                                // the task card that is an entry step
    legend: { y: 486, xs: [70, 400, 800], r: 36 },
    keys: ['apoya', 'podriaRealizarla', 'indispensable'],
    cues: ['apoya', 'podría realizarla', 'indispensable']
  };

  // A stamp: an ink ring with its sign — the lamp beside a person, the lamp, or a person.
  function caseStamp(ctx, s, env, kind, x, y, r, p) {
    if (p <= 0) return;
    var ink = env.ink, fig = env.fig, m = env.pal.mundo, k = r / 30;
    var press = seg(p, 0, 0.5), land = 1 + 0.25 * (1 - press) * (1 - press);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(land, land);
    ctx.globalAlpha *= clamp01(press * 1.6);
    ink.circle(ctx, 0, 0, r, { fill: m.lienzo, w: 3 * k, seed: 'v05:sello' + kind });
    if (kind === 0) {
      fig.person(ctx, 9 * k, 17 * k, 0.36 * k, { role: 'persona', pose: 'standing', seed: 'v05:sello-persona', skin: 2, hair: 'bob', mono: true });
      fig.lamp(ctx, -11 * k, -2 * k, 0.17 * k, { t: s.t });
    } else if (kind === 1) {
      fig.lamp(ctx, 0, 0, 0.26 * k, { t: s.t });
    } else {
      fig.person(ctx, 0, 18 * k, 0.4 * k, { role: 'persona', pose: 'standing', seed: 'v05:sello-persona', skin: 2, hair: 'bob', mono: true });
    }
    ctx.restore();
  }

  function tareasCaso(ctx, s, env) {
    var C = cuesOf(s, 'tareas-caso'), st = s.state.caso, ink = env.ink, fig = env.fig, m = env.pal.mundo, K = CASO, T = K.tasks, i;
    ground(ctx, s, env);
    var a0 = s.at(0), a1 = s.at(1), intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1170, 80, 40], ['sol', 96, 96, 48, { a: m.rojo }]], intro);
    // The case card, then its split into seven task cards on «desagreguen la ocupación en tareas».
    var split = inOut3(beat(a0, C.desagreguen - 0.02, C.desagreguen + 0.14));
    var cardA = 1 - seg(split, 0.3, 0.8);
    if (cardA > 0) {
      var Cd = K.card;
      ctx.save();
      ctx.globalAlpha *= cardA;
      ink.card(ctx, Cd.x - Cd.w / 2, Cd.y - Cd.h / 2, Cd.w, Cd.h, { seed: 'v05:caso', weight: 4.4, radius: 12, p: intro });
      label(ctx, env, rot(s, 'tarjeta'), Cd.x, Cd.y - Cd.h / 2 + 18, 32, { align: 'center', seed: 'v05:caso-titulo', counters: 0.25, p: seg(s.intro, 0.3, 1) });
      for (var r2 = 0; r2 < 2; r2++) ink.line(ctx, st.rule[r2], { w: 1.8, profile: 'even', seed: 'v05:renglon' + r2, color: env.pal.mix(m.tinta, m.lienzo, 0.55) });
      ctx.restore();
    }
    if (split > 0) {
      for (i = 0; i < T.n; i++) {
        var e = inOut3(seg(split, i * 0.05, 0.6 + i * 0.05)), tx = lerp(K.card.x, T.x0 + i * T.dx, e), ty = lerp(K.card.y, T.y, e);
        var tilt = lerp(0, (i % 2 ? 0.04 : -0.04), e);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(tilt);
        ink.card(ctx, -T.w / 2, -T.h / 2, T.w, T.h, { seed: 'v05:tarea-caso' + i, weight: 3.4, radius: 10, p: e });
        ctx.save();
        ctx.globalAlpha *= seg(e, 0.5, 1);
        for (var r3 = 0; r3 < 2; r3++) ink.line(ctx, st.lines[r3], { w: 1.8, profile: 'even', seed: 'v05:tarea-renglon' + i + r3, color: env.pal.mix(m.tinta, m.lienzo, 0.5) });
        ctx.restore();
        ctx.restore();
      }
    }
    // «¿la IA apoya, podría realizarla o la persona es indispensable?»: the legend, then the stamps.
    var Lg = K.legend, firstCue = C.apoya;
    for (i = 0; i < 3; i++) {
      var lp = beat(a0, C[['apoya', 'podria', 'indispensable'][i]] - 0.03, C[['apoya', 'podria', 'indispensable'][i]] + 0.05);
      caseStamp(ctx, s, env, i, Lg.xs[i] + Lg.r, Lg.y, Lg.r, lp);
      if (lp > 0) ink.text(ctx, rot(s, K.keys[i]), Lg.xs[i] + Lg.r * 2 + 14, Lg.y - 15, { size: 25, weight: 700, p: seg(lp, 0.3, 1) });
    }
    for (i = 0; i < T.n; i++) {
      var sp = beat(a0, firstCue + 0.06 + i * 0.035, firstCue + 0.14 + i * 0.035);
      if (sp > 0) caseStamp(ctx, s, env, K.stampOf[i], T.x0 + i * T.dx + 14, T.y + 36, 34, sp);
    }
    // «escalón de entrada»: a small ladder sign on one card, then a warm ring that keeps it.
    var ep = beat(a1, C.escalon - 0.04, C.escalon + 0.08);
    if (ep > 0) {
      var ex = T.x0 + K.entry * T.dx;
      fig.sign(ctx, 'escalera', ex - 22, T.y - 12, 62, { seed: 'v05:escalon', p: ep });
      label(ctx, env, rot(s, 'escalonEntrada'), ex, T.y - T.h / 2 - 54, 26, { align: 'center', seed: 'v05:escalon-texto', p: seg(ep, 0.2, 1) });
    }
    var kp = beat(a1, C.preservarlo - 0.04, C.preservarlo + 0.12);
    if (kp > 0) {
      var kx = T.x0 + K.entry * T.dx;
      ink.glow(ctx, kx, T.y, 110, m.amarillo, 0.4 * kp);
      ink.line(ctx, st.keep, { w: 4.4, profile: 'swell', seed: 'v05:preserva', closed: true, p: kp });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · cierre — back at the ladder: two people hold a new first rung of another shape (a red wavy
  // plank) and set it where the old one dissolved; the young person steps up onto it. Final title
  // «En el trabajo cambian tareas, no solo puestos.»; a soft fade to the page.

  var CIERRE = {
    title: { x: 668, y: 92, w: 560, size: 50 },
    helpers: [{ dx: -64, skin: 4, hair: 'short', cloth: 'verde', seed: 'v05:ayuda1', facing: 1 },
      { dx: 66, skin: 0, hair: 'ponytail', cloth: 'azul', seed: 'v05:ayuda2', facing: -1 }],
    young: { dx: -132, k: 1.62 },
    fade: 1.4
  };

  function cierre(ctx, s, env) {
    var st = s.state.ladder, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    ground(ctx, s, env);
    var a = s.at(0), intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 590, 132, 64, { a: m.rojo }], ['estrella', 214, 150, 42, { a: m.amarillo }], ['pajaro', 1010, 410, 64],
      ['estrella', 1170, 340, 34], ['espiral', 830, 470, 40]], intro);
    // The new rung blooms in the helpers' hands; the old dots fade as it settles.
    var rung = seg(s.t, 0.4, 2.2), settle = seg(s.t, 2.0, 3.4);
    drawLadder(ctx, s, env, st, { p: 1, gone: 1 - settle, drift: false });
    if (rung > 0) ink.draw(ctx, st.newRung, LAD.x, LAD.y - (1 - out3(rung)) * 20, 1, { p: rung });
    var cu = rungUp(ENT.climber.rung), cx = LAD.x + (ladL(cu) + ladR(cu)) / 2;
    fig.person(ctx, cx, LAD.y - cu - 2, ENT.climber.k, { role: 'persona', pose: 'waving', facing: 1, seed: 'v05:escala', skin: 1, hair: 'bun',
      cloth: m.rojo, legs: m.tinta });
    for (var i = 0; i < CIERRE.helpers.length; i++) {
      var hp = CIERRE.helpers[i];
      fig.person(ctx, LAD.x + hp.dx, LAD.y, 1.24, { role: 'persona', pose: 'standing', facing: hp.facing, seed: hp.seed, skin: hp.skin,
        hair: hp.hair, cloth: m[hp.cloth], p: out3(seg(s.t, 0.1 + i * 0.2, 1.2 + i * 0.2)) });
    }
    // The young person steps up onto the new rung once it is set.
    var step = inOut3(seg(s.t, 3.6, 5.0));
    var yx = lerp(LAD.x + CIERRE.young.dx, LAD.x + (st.l0 + st.r0) / 2, step), yy = lerp(LAD.y, LAD.y - st.up0 + 8, step) - Math.sin(Math.PI * step) * 26;
    fig.person(ctx, yx, yy, CIERRE.young.k, { role: 'estudiante', pose: 'lookingUp', facing: 1, seed: 'v05:joven', skin: 3, hair: 'curly',
      cloth: m.amarillo, legs: m.azul });
    var T = CIERRE.title;
    ink.letter(ctx, rot(s, 'titulo'), T.x, T.y, { size: T.size, maxWidth: T.w, maxLines: 3, seed: 'v05:titulo-final', counters: 0.25, stars: false,
      p: beat(a, 0.02, 0.7) });
    // Soft fade to the page in the last moments.
    var f = seg(s.t, s.dur - CIERRE.fade, s.dur);
    if (f > 0) {
      ctx.save();
      ctx.globalAlpha = inOut3(f);
      ctx.fillStyle = m.lienzo;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var m = env.pal.mundo;
    var ink = env.ink, cc = CASO.card, color = env.pal.mix(m.azul, m.lienzo, 0.42), ladder = ladderSetup(env);
    // entrada: the hypothesis arrow, from the dots of the lost rung to the lamp.
    ladder.hypArrow = [LAD.x + ladder.r0 + 10, LAD.y - ladder.up0 + 6, LAD.x + ladder.r0 + 70, LAD.y - ladder.up0 - 30, ENT.lamp.x - 34, ENT.lamp.y + 4];
    return {
      oficina: { desk: deskSetup(env) },
      expo: { big: fieldGeom(1000, EXPO.field.R), small: fieldGeom(100, EXPO.small.R), color: color },
      desigual: { field: fieldGeom(1000, DES.fields.R), color: color, divider: [640, 96, 642, 250, 638, 404] },
      ladder: ladder,
      comp: { path: samplePath(ink, [-160, 214, 200, 86, 560, 46, 860, 70, 1010, 176], 4) },
      siete: { ring: ink.ellipsePoints(0, 0, 40, 34, 24, 0) },
      caso: {
        rule: [ink.wavePoints(cc.x - 120, cc.y + 14, cc.x + 120, 1.2, 70, 0.3), ink.wavePoints(cc.x - 120, cc.y + 40, cc.x + 80, 1.2, 64, 1.1)],
        lines: [ink.wavePoints(-44, -52, 44, 1.2, 40, 0.3), ink.wavePoints(-44, -30, 30, 1.2, 36, 1.1)],
        keep: ink.ellipsePoints(CASO.tasks.x0 + CASO.entry * CASO.tasks.dx, CASO.tasks.y, 92, 108, 24, 0.06)
      }
    };
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v05 = {
    setup: setup,
    drawsWarnings: { 'tres-conceptos': true },
    layers: {
      oficina: groundLayer('personas', {}),
      exposicion: groundLayer('personas', {}),
      'tres-conceptos': groundLayer('personas', {}),
      desigual: groundLayer('personas', {}),
      entrada: groundLayer('personas', {}),
      competencias: groundLayer('territorio', { seed: 'v05:cielo', horizon: COMP.horizon, contours: false }),
      siete: groundLayer('personas', {}),
      'tareas-caso': groundLayer('personas', {}),
      cierre: groundLayer('personas', {})
    },
    scenes: {
      oficina: oficina,
      exposicion: exposicion,
      'tres-conceptos': tresConceptos,
      desigual: desigual,
      entrada: entrada,
      competencias: competencias,
      siete: siete,
      'tareas-caso': tareasCaso,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
