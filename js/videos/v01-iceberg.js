/* js/videos/v01-iceberg.js — V01 «Adopción masiva, valor por demostrar» (prompt §13, sesión 1; KB §4).
 *
 * Eight scenes in three chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 La punta del iceberg   noche · punta
 *   2 Debajo del agua        bajo-el-agua · advertencia (this scene presses its stamp itself)
 *   3 La ruta del curso      ruta · caso · pregunta · cierre
 *
 * The iceberg is the image of the site hero and lámina D1 (prompt §9.2, §12.2): the night sea of
 * fig.marNocturno (its sea, moon and nine stars), the iceberg of fig.iceberg and the small ruled
 * lamp at its summit. fig.iceberg keeps its waterline at a fixed depth, so this file rebuilds the
 * very same seeded drawing (ink.drawing('iceberg') with the engine's points, colors and waterline
 * stroke) to let one calligraphic waterline sink and settle, as the script asks. When the mass is
 * revealed it takes deep washes, so the chalk-white words read on it.
 *
 * Every number lands by the time its subtitle chunk appears and holds, exact and with its source
 * tag, to the end of its scene: «88%» (adop-1) on the luminous tip; «cerca de dos tercios» (adop-4)
 * as a 100-dot unit grid with one third lit and the «≈» cap; «39%» (adop-5) as a bar on a 0–100%
 * track, with its note «casi siempre menor de 5%» as text only (a share of EBIT, not of
 * organizations: it never shares the bar's axis). The AI is only the small ruled lamp; people and
 * places are warm and free.
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

  var W = 1280, H = 720;

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

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    noche: { empecemos: [1, 'Empecemos', 'chunk'] },
    punta: { cifra: [0, '88%', 'chunk'], punta: [2, 'Es la punta', 'chunk'] },
    'bajo-el-agua': { escala: [0, 'la escala', 'word'], valor: [0, 'el valor y', 'word'], gobernanza: [0, 'la gobernanza', 'word'],
      ebit: [1, '39%', 'chunk'], nota: [1, 'casi siempre', 'chunk'] },
    advertencia: { sello: [0, 'uso no es valor', 'word'], dias: [0, 'todos los días', 'word'],
      redisenar: [1, 'rediseñar', 'word'], integrar: [1, 'integrar datos', 'word'], formar: [1, 'formar personas', 'word'],
      medir: [1, 'medir contra', 'word'] },
    ruta: { s0: [0, 'capacidad técnica', 'word'], s1: [0, 'economía y adopción', 'word'], s2: [0, 'trabajo y educación', 'word'],
      s3: [0, 'ciencia y salud', 'word'], s4: [0, 'riesgo y gobernanza', 'word'], s5: [0, 'la agenda', 'word'],
      controladas: [1, 'condiciones controladas', 'word'], real: [1, 'lo que produce', 'word'] },
    caso: { tarjeta: [0, 'cada equipo', 'word'], sesion: [0, 'sesión tras sesión', 'word'] },
    pregunta: { pregunta: [0, '¿cuánto valor', 'chunk'] }
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

  function paper(ctx, s, env) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, 'personas', { seed: 'v01:pagina' });
  }

  // A cream notebook ground pre-rendered once per scene (prompt §14).
  function paperLayer(env) {
    var c = env.canvas(W, H);
    env.ink.background(c.getContext('2d'), 'personas', { seed: 'v01:pagina' });
    return { bg: c };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, colors?]; keep them
  // clear of the subtitle band (y > 570).
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v01:fx' + i) * 9, f[2] + noise(t * 0.8, 'v01:fy' + i) * 7, f[3], {
        seed: 'v01:float' + f[0] + i, colors: f[4] || null, rot: noise(t * 0.6, 'v01:fr' + i) * 0.14, p: p
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
    var img = env.ink.layer(ctx, 'v01:letra|' + key + '|' + size + '|' + (full.color || ''), w, h, function (g) {
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

  // ---------------------------------------------------------------------------------------------
  // The night sea and the iceberg (the hero's and D1's image).

  var SEA = { horizon: 0.56, moon: { x: 1040, y: 140, size: 130 } };
  var TILT = 250;    // px of deeper sea kept below the frame, for the look down in bajo-el-agua

  // fig.marNocturno's sea (its moon and stars are drawn per frame, below), and under it, out of
  // frame, the sea going on, deeper.
  function seaLayer(env) {
    var c = env.canvas(W, H + TILT), g = c.getContext('2d'), m = env.pal.mundo, q = env.pal.maquina;
    env.fig.marNocturno(g, 0, 0, 1, { horizon: SEA.horizon, stars: 0, moon: false });
    var deep = g.createLinearGradient(0, H, 0, H + TILT);
    deep.addColorStop(0, env.pal.mix(m.azul, q.noche, 0.6));
    deep.addColorStop(1, env.pal.mix(m.azul, q.noche, 0.82));
    g.fillStyle = deep;
    g.fillRect(0, H, W, TILT);
    env.ink.wash(g, 0, H - 30, W, TILT + 30, { colors: [q.noche, m.azul], alpha: 0.16, blobs: 6, seed: 'v01:hondo' });
    var r = env.rng('v01:hondo');
    for (var i = 0; i < 5; i++) {
      var y = H + 26 + i * 44 + r.range(-8, 8), x0 = r.range(-40, 820), len = r.range(180, 380);
      env.ink.wave(g, x0, y, x0 + len, { amp: r.range(4, 7), len: r.range(80, 130), w: r.range(2.6, 4.2), profile: 'swell', seed: 'v01:ola' + i,
        color: env.pal.rgba(i % 3 ? m.celeste : m.lienzo, 0.55) });
    }
    env.ink.grain(g, 0, H, W, TILT, { alpha: 0.8 });
    return { bg: c };
  }

  // The sea ground with the camera looking dy px lower (0 = the frame of the hero).
  function seaGround(ctx, s, env, dy) {
    dy = dy || 0;
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, -dy, W, H + TILT);
    else env.fig.marNocturno(ctx, 0, -dy, 1, { horizon: SEA.horizon, stars: 0, moon: false });
    var Mn = SEA.moon;
    if (Mn.y - dy > -Mn.size) env.fig.sign(ctx, 'luna', Mn.x, Mn.y - dy, Mn.size, { seed: 'moon' });
  }

  // fig.marNocturno's own stars (same seeded places, sizes and colors), twinkling gently.
  // hide(x, y, size) leaves out a star that would sit behind copy.
  function seaStars(ctx, s, env, hide, dy) {
    var stars = s.state.stars, m = env.pal.mundo, c = calm(s);
    dy = dy || 0;
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], y = st.y - dy, edge = seg(y, st.size * 0.2, st.size * 0.9);   // fades out at the top as the camera looks down
      if (edge <= 0 || (hide && hide(st.x, y, st.size))) continue;
      var tw = 0.85 + 0.15 * Math.sin(s.t * 1.3 + st.i * 1.7) * c;
      env.fig.sign(ctx, 'estrella', st.x, y, st.size * tw, { seed: 'night' + st.i, colors: { a: m.rojo, ink: st.i % 3 ? m.amarillo : m.lienzo },
        alpha: 0.95 * edge });
    }
  }
  function starField(env) {
    var r = env.rng('stars'), out = [];
    for (var i = 0; i < 9; i++) {
      var sx = r.range(60, 1220), sy = r.range(40, 720 * SEA.horizon - 50), sz = r.range(26, 50);
      if (Math.hypot(sx - 1040, sy - 140) < 110) continue;
      out.push({ i: i, x: sx, y: sy, size: sz });
    }
    return out;
  }
  function inRects(rects) {
    return function (x, y, size) {
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i], m = size * 0.5;
        if (x > r[0] - m && x < r[0] + r[2] + m && y > r[1] - m && y < r[1] + r[3] + m) return true;
      }
      return false;
    };
  }

  // fig.iceberg's drawing, rebuilt with the same seed, points and colors (see the header).
  var BERG = {
    mass: [-200, 14, -170, 120, -80, 230, 40, 260, 160, 190, 210, 60, 190, 14],
    tip: [-70, 4, -40, -70, -10, -120, 20, -150, 44, -96, 74, -40, 96, 4],
    vein: [-20, -100, 0, -60],
    depth: 280,                 // fig.iceberg's reveal depth: reveal 1 shows the whole mass
    summit: { x: 20, y: -150 }
  };

  function bergSetup(env) {
    var ink = env.ink, m = env.pal.mundo;
    var b = ink.drawing('iceberg', { w: 4, jitter: 0.8 });
    var mass = b.shape(BERG.mass, { fill: '@mass', w: 4.4 });
    b.shape(BERG.tip, { fill: '@tip', w: 4.4 });
    b.stroke(BERG.vein, { w: 2, profile: 'hair', color: m.celeste });
    return {
      d: b.done(),
      colors: { tip: m.lienzo, mass: env.pal.mix(m.celeste, m.azul, 0.35) },
      massFill: mass.fill,
      // fig.iceberg's waterline in its own units (scale 1): ink.wave(x ± 300, amp 5, len 120).
      line: ink.wavePoints(-300, 0, 300, 5, 120, 0),
      // The mass outline, for its dotted hint under the water.
      massLoop: BERG.mass.slice()
    };
  }

  // Clip to everything above the waterline (its centerline), `depth` units below the iceberg's
  // natural waterline; the line's own stroke then covers the clip edge.
  function clipAbove(ctx, st, B, depth) {
    var L = st.berg.line, k = B.k;
    ctx.beginPath();
    ctx.moveTo(B.x - 330 * k, B.y - 480 * k);
    ctx.lineTo(B.x + 330 * k, B.y - 480 * k);
    ctx.lineTo(B.x + 330 * k, B.y + (depth + L[L.length - 1]) * k);
    for (var i = L.length - 2; i >= 0; i -= 2) ctx.lineTo(B.x + L[i] * k, B.y + (depth + L[i + 1]) * k);
    ctx.lineTo(B.x - 330 * k, B.y + (depth + L[1]) * k);
    ctx.closePath();
    ctx.clip();
  }

  // Deep washes on the revealed mass: its own gouache field (same path and offset as ink.draw
  // gives it), darkening with depth.
  function deepWash(ctx, env, st, B, a) {
    if (a <= 0) return;
    var f = st.berg.massFill, k = B.k, m = env.pal.mundo, q = env.pal.maquina;
    var off = Math.min(4, Math.max(1, 3.1 * Math.sqrt(k))) / k;
    ctx.save();
    ctx.translate(B.x, B.y);
    ctx.scale(k, k);
    ctx.translate(f.ox * off * f.off, f.oy * off * f.off);
    ctx.clip(f.path);
    var g = ctx.createLinearGradient(0, 10, 0, 262);
    g.addColorStop(0, env.pal.rgba(m.azul, 0.12));
    g.addColorStop(0.45, env.pal.rgba(m.azul, 0.5));
    g.addColorStop(1, env.pal.rgba(q.noche, 0.74));
    ctx.globalAlpha *= a;
    ctx.fillStyle = g;
    ctx.fillRect(-240, -10, 480, 290);
    ctx.restore();
  }

  // B = { x, y, k }: the natural waterline center and scale (fig.iceberg units: 1 = 420 px wide).
  // o: depth (units the waterline has sunk below its natural place), glow (0..1), wash (0..1),
  // words(ctx) (drawn on the mass, above the waterline).
  function drawBerg(ctx, env, st, B, o) {
    var ink = env.ink, m = env.pal.mundo, depth = o.depth || 0;
    if (o.glow) ink.glow(ctx, B.x, B.y - 80 * B.k, Math.max(180 * B.k, 46), m.amarillo, 0.35 * o.glow);
    ctx.save();
    clipAbove(ctx, st, B, depth);
    ink.draw(ctx, st.berg.d, B.x, B.y, B.k, { colors: st.berg.colors });
    deepWash(ctx, env, st, B, o.wash || 0);
    if (o.words) o.words(ctx);
    ctx.restore();
    // The one calligraphic waterline (fig.iceberg's stroke: swell, cream).
    ctx.save();
    ctx.translate(B.x, B.y + depth * B.k);
    ctx.scale(B.k, B.k);
    ink.line(ctx, st.berg.line, { w: 4.5, profile: 'swell', seed: 'waterline', color: m.lienzo });
    ctx.restore();
  }

  // The small ruled lamp at the summit ("iluminada por una diminuta lámpara de IA en la cima").
  function summitLamp(ctx, s, env, B, p) {
    if (p <= 0) return;
    var k = Math.max(0.12, 0.2 * B.k);
    env.fig.lamp(ctx, B.x + BERG.summit.x * B.k, B.y + BERG.summit.y * B.k - 48 * k - 2, k, { t: s.t, p: p });
  }

  // A barely moving iceberg (calm ambient life): it rides the swell by a pixel or two.
  function bob(B, s, amp) {
    return { x: B.x, y: B.y + Math.sin(s.t * 0.9) * (amp == null ? 1.6 : amp) * calm(s), k: B.k };
  }
  // A camera move between two framings: the scale changes geometrically (a steady zoom) and the
  // position follows the scale, so a far shape grows before it travels.
  function lerpBerg(a, b, e) {
    var k = a.k * Math.pow(b.k / a.k, e), u = b.k === a.k ? e : (k - a.k) / (b.k - a.k);
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: k };
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · noche — the night sea; far away, a small luminous shape on the horizon; the title writes
  // itself; on "Empecemos por lo que se ve" we approach the shape: it is the iceberg's tip.

  var FAR = { x: 1004, y: 720 * SEA.horizon + 3, k: 0.13 };   // on the horizon, under the moon
  var NEAR = { x: 440, y: 470, k: 1.55 };                      // the framing of punta
  var NOCHE = { title: { x: 520, y: 288, size: 78, w: 800 } };

  function nocheApproach(s, C) {
    var t0 = lineT(s, 1, Math.max(0, C.empecemos - 0.04)), t1 = Math.max(t0 + 0.5, s.dur - 0.45);
    return inOut3(seg(s.t, t0, t1));
  }

  function noche(ctx, s, env) {
    var C = cuesOf(s, 'noche'), st = s.state, m = env.pal.mundo, T = NOCHE.title;
    seaGround(ctx, s, env);
    var e = nocheApproach(s, C), B = bob(lerpBerg(FAR, NEAR, e), s, 1.6 * e);
    var titleA = 1 - seg(e, 0.04, 0.4);
    seaStars(ctx, s, env, titleA > 0 ? inRects([[T.x - T.w / 2, T.y, T.w, T.size * 1.45]]) : null);
    // The luminous shape breathes softly while it waits on the horizon.
    drawBerg(ctx, env, st, B, { glow: lerp(0.8 + 0.2 * Math.sin(s.t * 1.1) * calm(s), 1, e) });
    summitLamp(ctx, s, env, B, seg(B.k, 0.5, 1.2));
    letterFade(ctx, env, rot(s, 'titulo'), T.x, T.y, { size: T.size, align: 'center', maxWidth: T.w, maxLines: 1, seed: 'v01:titulo',
      color: m.lienzo, counters: 0.3, counterColors: [m.amarillo, m.rojo, m.celeste], stars: false, p: seg(s.at(0), 0.02, 0.3) }, titleA, 'titulo');
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · punta — the luminous tip above the waterline, lit by the small lamp; «88%» lands on it with
  // its label and tag; the lectora appears in the corner and asks; "Es la punta del iceberg": a
  // dotted hint of the mass below the water.

  var PUN = {
    num: { x: 16, y: -56, size: 64 },          // on the tip, in iceberg units from the waterline center
    label: { x: 612, y: 296, w: 262, size: 25 },
    tag: { x: 604, y: 428 },
    lectora: { x: 1112, y: 728, k: 3.3 }
  };

  function punta(ctx, s, env) {
    var C = cuesOf(s, 'punta'), st = s.state, ink = env.ink, m = env.pal.mundo;
    seaGround(ctx, s, env);
    seaStars(ctx, s, env, inRects([[PUN.label.x, PUN.label.y, PUN.label.w, 100]]));
    var B = bob(NEAR, s);
    // "Es la punta del iceberg": the hidden mass, a dotted line under the water.
    var hint = beat(s.at(2), C.punta - 0.04, C.punta + 0.22);
    if (hint > 0) {
      ctx.save();
      ctx.translate(B.x, B.y);
      ctx.scale(B.k, B.k);
      ink.dotted(ctx, st.berg.massLoop, { closed: true, r: 2.8 / B.k, gap: 13 / B.k, seed: 'v01:masa', color: env.pal.rgba(m.lienzo, 0.7), p: hint });
      ctx.restore();
    }
    drawBerg(ctx, env, st, B, { glow: 1 });
    summitLamp(ctx, s, env, B, 1);
    // 88% on the tip, whole, by the time its subtitle chunk appears; label and tag with it.
    var win = landWindow(C.cifra), np = beat(s.at(0), win[0], win[1]);
    if (np > 0) {
      var nx = B.x + PUN.num.x * B.k, ny = B.y + PUN.num.y * B.k - PUN.num.size * 0.62;
      var L = hero(ctx, env, rot(s, 'cifra'), nx, ny, PUN.num.size, { align: 'center', seed: 'v01:88', p: np });
      ink.text(ctx, rot(s, 'etiqueta'), PUN.label.x, PUN.label.y, { size: PUN.label.size, weight: 700, color: m.lienzo, maxWidth: PUN.label.w,
        lineHeight: 1.16, p: seg(s.at(0), win[1], win[1] + 0.06) });
      env.tags.sourceTag(ctx, 'adop-1', { x: PUN.tag.x, y: PUN.tag.y, anchor: { x: nx + L.w / 2 - 2, y: ny + L.h * 0.55 }, p: np, scale: 1.08 });
    }
    // The lectora steps into the corner with her notebook and asks.
    var lp = out3(seg(s.at(1), 0, 0.3));
    if (lp > 0) env.fig.lectora(ctx, PUN.lectora.x, PUN.lectora.y, PUN.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · bajo-el-agua — the camera looks down while the waterline sinks slowly and the submerged
  // mass appears in deep washes; «Escala», «Valor» and «Gobernanza» write themselves on it in chalk
  // white; then two figures surface beside it on paper cards: the unit grid of «cerca de dos
  // tercios» and the bar of «39%» with its note.

  var BAJO = {
    berg: { x: 300, y: 222, k: 1.15 },
    line: 548,                                  // screen y where the sunk waterline rests
    words: [['escala', 0, 72, 46], ['valor', 2, 134, 46], ['gobernanza', 12, 196, 40]],   // key, x, y (iceberg units), size
    cardA: { x: 596, y: 60, w: 288, h: 268 },
    grid: { x: 622, y: 86, w: 160 },
    labelA: { x: 622, y: 256, w: 250, size: 20 },
    tagA: { x: 912, y: 64 },
    cardB: { x: 596, y: 354, w: 288, h: 204 },
    descB: { x: 622, y: 370, w: 250, size: 20 },
    track: { x: 622, y: 432, len: 236, h: 34 },
    noteB: { x: 622, y: 484, w: 250, size: 20 },
    tagB: { x: 900, y: 414 }
  };

  // The look down: from punta's framing to the whole iceberg, the waterline sinking past the mass.
  function bajoMove(s, C) {
    var t1 = Math.max(1.2, lineT(s, 0, C.escala - 0.08));
    var e = inOut3(seg(s.t, 0.15, t1));
    var B = lerpBerg(NEAR, BAJO.berg, e);
    var yw = lerp(NEAR.y, BAJO.line, e);
    return { e: e, B: B, depth: (yw - B.y) / B.k, dy: TILT * e };
  }

  // A paper card that surfaces: it rises a little from below and fades in (e 0 → 1). Call it
  // inside ctx.save()/restore(); returns the rise in px, for the tag tied outside that block.
  var RISE = 36;
  function surfacing(ctx, e) {
    ctx.translate(0, (1 - e) * RISE);
    ctx.globalAlpha *= e;
    return (1 - e) * RISE;
  }

  function bajo(ctx, s, env) {
    var C = cuesOf(s, 'bajo-el-agua'), st = s.state, ink = env.ink, chart = env.chart, m = env.pal.mundo;
    var A = bajoMove(s, C), B = bob(A.B, s, 1.2);
    seaGround(ctx, s, env, A.dy);
    seaStars(ctx, s, env, inRects([[580, 40, 700, 520]]), A.dy);
    var a0 = s.at(0);
    drawBerg(ctx, env, st, B, {
      glow: 1, depth: A.depth, wash: A.e,
      words: function (g) {
        for (var i = 0; i < BAJO.words.length; i++) {
          var wd = BAJO.words[i], cue = C[wd[0]];
          var wp = beat(a0, cue - 0.03, cue + 0.12);
          if (wp > 0) ink.letter(g, rot(s, wd[0]), B.x + wd[1] * B.k, B.y + wd[2] * B.k - wd[3] * 0.62, { size: wd[3], align: 'center', maxLines: 1,
            seed: 'v01:tiza' + i, color: m.lienzo, counters: 0, stars: false, underline: false, p: wp });
        }
      }
    });
    summitLamp(ctx, s, env, B, 1);

    // Card A: «cerca de dos tercios» — 100 dots, one third lit (the KB's «~1/3 sí», rounded to
    // whole dots), with the «≈» cap; it surfaces as line 1 begins.
    var a1 = s.at(1);
    var eA = out3(seg(s.t, lineT(s, 0, 0.94), lineT(s, 1, 0.012)));
    if (eA > 0) {
      var R = BAJO.cardA, G = BAJO.grid;
      ctx.save();
      var dyA = surfacing(ctx, eA);
      ink.card(ctx, R.x, R.y, R.w, R.h, { seed: 'v01:tarjeta-a', weight: 4, radius: 12 });
      var g = chart.unitGrid(ctx, { x: G.x, y: G.y, w: G.w, total: 100, percent: 100 / 3, litColor: m.rojo, seed: 'v01:tercio', p: seg(a1, 0, 0.075) });
      var landed = seg(a1, 0.075, 0.11);
      if (landed > 0) {
        // The «≈» cap: a dotted edge after the last lit dot, and the sign beside it.
        var rows = Math.floor(g.lit / g.cols), pch = g.pitch;
        ctx.save();
        ctx.globalAlpha *= landed;
        ink.dotted(ctx, st.bajo.capEdge, { r: 1.7, gap: 7, seed: 'v01:remate', color: m.tinta });
        ctx.restore();
        hero(ctx, env, rot(s, 'remateAprox'), G.x + g.w + 12, G.y + rows * pch - 24, 40, { seed: 'v01:aprox', p: landed });
        ink.text(ctx, rot(s, 'dosTercios'), BAJO.labelA.x, BAJO.labelA.y, { size: BAJO.labelA.size, weight: 700, maxWidth: BAJO.labelA.w,
          lineHeight: 1.18, p: landed });
      }
      ctx.restore();
      var tagAp = seg(a1, 0, 0.09);
      if (tagAp > 0) {
        env.tags.sourceTag(ctx, 'adop-4', { x: BAJO.tagA.x, y: BAJO.tagA.y + dyA, anchor: { x: G.x + G.w + 2, y: G.y + 10 + dyA }, p: tagAp * eA, scale: 1.08 });
      }
    }

    // Card B: «39%» on a 0–100% track (a share of organizations, like the grid); the note «casi
    // siempre menor de 5%» is a share of EBIT: text only, on no axis.
    var winB = landWindow(C.ebit);
    var eB = out3(beat(a1, winB[0] - 0.07, winB[0]));
    if (eB > 0) {
      var R2 = BAJO.cardB, T = BAJO.track;
      ctx.save();
      var dyB = surfacing(ctx, eB);
      ink.card(ctx, R2.x, R2.y, R2.w, R2.h, { seed: 'v01:tarjeta-b', weight: 4, radius: 12 });
      ink.text(ctx, rot(s, 'etiquetaEbit'), BAJO.descB.x, BAJO.descB.y, { size: BAJO.descB.size, weight: 700, maxWidth: BAJO.descB.w, lineHeight: 1.18 });
      var sc = chart.scale(100, T.x, T.len);
      ctx.fillStyle = env.pal.rgba(m.lienzoOcre, 0.85);
      ctx.fillRect(T.x, T.y, T.len, T.h);
      ink.line(ctx, st.bajo.trackEnd, { w: 2.2, profile: 'even', seed: 'v01:pista-fin' });
      chart.baseline(ctx, T.x, T.y - 8, T.y + T.h + 8, { p: 1 });
      var bp = beat(a1, winB[0], winB[1]);
      var gb = chart.bar(ctx, { text: rot(s, 'cifraEbit'), scale: sc, y: T.y, h: T.h, labels: false, seed: 'v01:ebit', p: bp, color: m.azul });
      var vl = seg(a1, winB[1], winB[1] + 0.03), VL = null;
      if (vl > 0) VL = ink.text(ctx, rot(s, 'cifraEbit'), sc(chart.parseValue(rot(s, 'cifraEbit')).value) + 12, T.y + 1, { size: 30, weight: 700, p: vl });
      var nl = beat(a1, C.nota - 0.02, C.nota + 0.03);
      if (nl > 0) ink.text(ctx, rot(s, 'notaEbit'), BAJO.noteB.x, BAJO.noteB.y, { size: BAJO.noteB.size, italic: true, maxWidth: BAJO.noteB.w, lineHeight: 1.18, p: nl });
      ctx.restore();
      if (bp > 0) {
        var ax = VL ? sc(chart.parseValue(rot(s, 'cifraEbit')).value) + 16 + VL.w : gb.x1 + 2;
        env.tags.sourceTag(ctx, 'adop-5', { x: BAJO.tagB.x, y: BAJO.tagB.y + dyB, anchor: { x: ax, y: T.y + T.h / 2 + dyB }, p: bp * eB, scale: 1.08 });
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · advertencia — on a desk, the small lamp glows beside a calendar full of marked days while a
  // single coin stays small; the stamp «Uso no es valor» presses onto the page (the scene presses
  // it itself: drawsWarnings below); then what value demands is noted below it.

  var ADV = {
    floor: 584,
    desk: { x: 330, k: 0.86 },
    lamp: { x: 214, y: 360, k: 0.56 },
    cal: { x: 352, y: 342, k: 0.78 },
    coin: { x: 470, y: 392, k: 0.4 },
    stamp: { x: 884, y: 210, size: 276 },
    list: { x: 716, y: 378, gap: 35, size: 23, keys: ['redisenar', 'integrar', 'formar', 'medir'] }
  };

  function advertencia(ctx, s, env) {
    var C = cuesOf(s, 'advertencia'), st = s.state.adv, ink = env.ink, fig = env.fig;
    paper(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 96, 104, 44], ['espiral', 560, 112, 40], ['luna', 1200, 520, 40]], intro);
    fig.desk(ctx, ADV.desk.x, ADV.floor, ADV.desk.k, { p: intro });
    var marked = Math.round(lerp(12, 24, seg(s.at(0), C.dias - 0.04, C.dias + 0.14)));
    fig.calendar(ctx, ADV.cal.x, ADV.cal.y, ADV.cal.k, { marked: marked, seed: 'v01:calendario', p: out3(seg(s.intro, 0.1, 1)) });
    fig.lamp(ctx, ADV.lamp.x, ADV.lamp.y + Math.sin(s.t * 1.2) * 1.2 * calm(s), ADV.lamp.k, { t: s.t, p: out3(seg(s.intro, 0.2, 1)) });
    fig.coin(ctx, ADV.coin.x, ADV.coin.y, ADV.coin.k, { seed: 'v01:moneda', p: out3(seg(s.intro, 0.3, 1)) });
    // The stamp presses on the words that name it, and stays.
    var press = beat(s.at(0), C.sello - 0.02, C.sello + 0.16);
    if (press > 0) env.tags.warningStamp(ctx, 1, ADV.stamp.x, ADV.stamp.y, ADV.stamp.size, press);
    // "El valor exige …": four notes write themselves as they are said.
    var Ls = ADV.list, a1 = s.at(1);
    var hp = seg(a1, 0, 0.1);
    if (hp > 0) ink.text(ctx, rot(s, 'exige'), Ls.x, Ls.y, { size: Ls.size + 1, weight: 700, p: hp });
    for (var i = 0; i < Ls.keys.length; i++) {
      var cue = C[Ls.keys[i]], ip = beat(a1, cue - 0.03, cue + 0.07);
      if (ip <= 0) continue;
      ink.shape(ctx, st.boxes[i], { fill: false, w: 2.6, seed: 'v01:casilla' + i, p: ip });
      ink.text(ctx, rot(s, Ls.keys[i]), Ls.x + 34, Ls.y + (i + 1) * Ls.gap + 4, { size: Ls.size, p: seg(ip, 0.3, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · ruta — a calligraphic road map unrolls; six stations draw on in order with their session
  // signs and names; an irregular star is the compass rose. Then: what AI achieves in controlled
  // conditions (a ruled navy panel with the lamp) and what it produces in the real world (warm).

  var RUTA = {
    map: { x: 64, y: 58, w: 1152, h: 500 },
    stations: [[178, 452], [372, 372], [566, 444], [760, 352], [954, 410], [1112, 300]],
    labelSide: [1, -1, 1, -1, 1, -1],          // 1 below the station, −1 above it
    r: 30, label: { size: 23, w: 210 },
    compass: { x: 1110, y: 142, size: 120 },
    panel: { x: 112, y: 96, w: 214, h: 134 },   // controlled conditions, top left
    world: { x: 604, y: 262, w: 300 }            // the real world, top centre: left end of its ground line
  };

  function routePoints() {
    var S = RUTA.stations, pts = [];
    for (var i = 0; i < S.length; i++) {
      pts.push(S[i][0], S[i][1]);
      if (i < S.length - 1) pts.push((S[i][0] + S[i + 1][0]) / 2, (S[i][1] + S[i + 1][1]) / 2 + (i % 2 ? 26 : -26));
    }
    return pts;
  }

  function station(ctx, env, x, y, r, i, sign, p) {
    env.ink.circle(ctx, x, y, r, { fill: env.pal.mundo.lienzo, w: Math.max(2.6, r * 0.15), seed: 'v01:estacion' + i, p: p });
    env.fig.sign(ctx, sign, x, y, r * 1.5, { seed: 'v01:signo' + i, p: seg(p, 0.35, 1) });
  }

  function ruta(ctx, s, env) {
    var C = cuesOf(s, 'ruta'), st = s.state.ruta, ink = env.ink, fig = env.fig, m = env.pal.mundo, Mp = RUTA.map;
    paper(ctx, s, env);
    // The map unrolls from the left.
    var un = inOut3(seg(s.t, 0.1, 1.5));
    if (un <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(Mp.x - 10, Mp.y - 10, (Mp.w + 20) * un, Mp.h + 20);
    ctx.clip();
    ink.card(ctx, Mp.x, Mp.y, Mp.w, Mp.h, { seed: 'v01:mapa', weight: 4.4, radius: 16, fill: env.pal.mix(m.lienzoOcre, m.lienzo, 0.45) });
    ctx.restore();
    var a0 = s.at(0), a1 = s.at(1);
    fig.road(ctx, 0, 0, 1, { points: st.road, stations: 0, p: 0.6 * inOut3(seg(s.t, 0.6, Math.max(1.4, lineT(s, 0, C.s0 - 0.02)))) });
    var cues = [C.s0, C.s1, C.s2, C.s3, C.s4, C.s5], keys = ['capacidad', 'economia', 'trabajo', 'ciencia', 'riesgo', 'agenda'], Lb = RUTA.label;
    for (var i = 0; i < RUTA.stations.length; i++) {
      var S = RUTA.stations[i], sp = beat(a0, cues[i] - 0.03, cues[i] + 0.05);
      if (sp <= 0) continue;
      station(ctx, env, S[0], S[1], RUTA.r, i, st.signs[i], sp);
      var lo = { size: Lb.size, weight: 700, align: 'center', maxWidth: Lb.w, lineHeight: 1.12 };
      var h = ink.measureText(ctx, rot(s, keys[i]), lo).h;
      lo.p = seg(sp, 0.4, 1);
      ink.text(ctx, rot(s, keys[i]), S[0], RUTA.labelSide[i] > 0 ? S[1] + RUTA.r + 10 : S[1] - RUTA.r - 12 - h, lo);
    }
    // The compass rose: an irregular star, turning slowly.
    var cp = out3(seg(s.t, 0.8, 2));
    if (cp > 0) {
      var Cp = RUTA.compass;
      ink.line(ctx, st.compassNS, { w: 2.2, profile: 'hair', seed: 'v01:rosa-ns', p: cp });
      ink.line(ctx, st.compassEW, { w: 2.2, profile: 'hair', seed: 'v01:rosa-eo', p: cp });
      fig.sign(ctx, 'estrella', Cp.x, Cp.y, Cp.size, { seed: 'v01:rosa', colors: { a: m.rojo }, rot: noise(s.t * 0.15, 'v01:rosa') * 0.35, p: cp });
      ink.dot(ctx, Cp.x, Cp.y - Cp.size * 0.62, 6, m.rojo);
    }
    // Line 2: controlled conditions (a ruled navy panel with the lamp) and the real world (warm).
    var pc = beat(a1, C.controladas - 0.04, C.controladas + 0.08);
    if (pc > 0) {
      var Pn = RUTA.panel;
      ctx.save();
      ctx.beginPath();
      ctx.rect(Pn.x - 2, Pn.y - 2, Pn.w + 4, (Pn.h + 4) * inOut3(pc));
      ctx.clip();
      fig.panel(ctx, Pn.x, Pn.y, Pn.w, Pn.h, { cell: 12 });
      ctx.restore();
      fig.lamp(ctx, Pn.x + Pn.w / 2, Pn.y + Pn.h / 2, 0.62, { t: s.t, p: seg(pc, 0.4, 1) });
    }
    var pw = beat(a1, C.real - 0.03, C.real + 0.12);
    if (pw > 0) {
      var Wd = RUTA.world;
      ink.circle(ctx, Wd.x + Wd.w - 34, Wd.y - 124, 28, { fill: m.rojo, line: false, seed: 'v01:sol', p: pw });
      ink.shape(ctx, st.hill, { fill: m.verde, w: 3.6, seed: 'v01:colina', p: pw });
      fig.sign(ctx, 'casa', Wd.x + 58, Wd.y - 30, 56, { seed: 'v01:casa', p: seg(pw, 0.2, 0.8) });
      fig.person(ctx, Wd.x + 134, Wd.y, 0.94, { role: 'campesina', pose: 'waving', skin: 4, seed: 'v01:mundo0', p: seg(pw, 0.3, 1) });
      fig.person(ctx, Wd.x + 200, Wd.y + 2, 0.9, { role: 'docente', pose: 'standing', skin: 1, seed: 'v01:mundo1', facing: -1, p: seg(pw, 0.4, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · caso — a team of four around a table opens a blank card «Nuestro caso de uso»; session after
  // session the card travels the road and collects a small stamp at each station.

  var CASO = {
    road: { x: 47, y: -170, k: 0.92 },         // the road of ruta, a little smaller, along the top of the page
    team: { x: 640, y: 612, k: 1.0 },
    card: { x: 640, y: 346, w: 320, h: 164 },
    small: 0.56,                                // the card's scale on the road
    below: 70                                   // px below the station it visits
  };

  function caso(ctx, s, env) {
    var C = cuesOf(s, 'caso'), st = s.state.ruta, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    paper(ctx, s, env);
    var intro = out3(s.intro), R = CASO.road;
    floaters(ctx, s, env, [['estrella', 104, 420, 40], ['sol', 1180, 440, 44]], intro);
    // The road of the course, at the top of the page (no names: the stations are known by now).
    fig.road(ctx, R.x, R.y, R.k, { points: st.road, stations: 0, p: 0.6 * intro });
    var pts = st.caso.stations, i;
    for (i = 0; i < pts.length; i++) station(ctx, env, pts[i].x, pts[i].y, 22, i, st.signs[i], out3(seg(s.intro, 0.3 + i * 0.1, 0.7 + i * 0.1)));
    fig.team(ctx, CASO.team.x, CASO.team.y, CASO.team.k, { n: 4, p: intro });
    // The card opens on "cada equipo elegirá…", then travels from "sesión tras sesión".
    var op = beat(s.at(0), C.tarjeta - 0.04, C.tarjeta + 0.1);
    if (op <= 0) return;
    var J = cardJourney(s, pts, lineT(s, 0, C.sesion - 0.02), lineT(s, 1, 0.92));
    var Cd = CASO.card, k = lerp(1, CASO.small, J.lift);
    ctx.save();
    ctx.translate(lerp(Cd.x, J.x, J.lift), lerp(Cd.y, J.y + CASO.below, J.lift));
    ctx.rotate(Math.sin(s.t * 0.8) * 0.02 * calm(s));
    ctx.scale(k, k);
    ink.card(ctx, -Cd.w / 2, -Cd.h / 2, Cd.w, Cd.h, { seed: 'v01:caso', weight: 4.4, radius: 12, p: op });
    ink.letter(ctx, rot(s, 'tarjeta'), 0, -Cd.h / 2 + 16, { size: 30, align: 'center', maxWidth: Cd.w - 36, maxLines: 1, seed: 'v01:tarjeta',
      counters: 0.25, stars: false, underline: false, p: seg(op, 0.35, 1) });
    // Empty lines (the case is still to be written) and six stamp places.
    ctx.save();
    ctx.globalAlpha *= seg(op, 0.5, 1);
    for (var r = 0; r < 2; r++) ink.line(ctx, st.caso.rule[r], { w: 1.8, profile: 'even', seed: 'v01:renglon' + r, color: env.pal.mix(m.tinta, m.lienzo, 0.55) });
    ctx.restore();
    for (i = 0; i < 6; i++) {
      var sx = -Cd.w / 2 + 36 + i * (Cd.w - 72) / 5, sy = Cd.h / 2 - 28, sp = J.stamps[i];
      if (sp > 0) {
        var kk = 1 + 0.4 * (1 - sp);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(kk, kk);
        ink.circle(ctx, 0, 0, 13, { fill: m.rojo, w: 2.4, seed: 'v01:sello' + i, p: sp });
        fig.sign(ctx, st.signs[i], 0, 0, 18, { seed: 'v01:sello-signo' + i, mono: true, p: sp });
        ctx.restore();
      } else {
        ink.circle(ctx, sx, sy, 13, { line: true, w: 1.4, seed: 'v01:hueco' + i, p: seg(op, 0.6, 1) });
      }
    }
    ctx.restore();
  }

  // Where the card is at scene time s.t: off the table (lift 0 → 1), then from station to station
  // between tStart and tEnd; stamps[i] is the press progress at station i.
  function cardJourney(s, pts, tStart, tEnd) {
    var n = pts.length, lift = inOut3(seg(s.t, tStart, tStart + 1.2));
    var per = Math.max(0.1, tEnd - (tStart + 1.2)) / n, out = { lift: lift, x: pts[0].x, y: pts[0].y, stamps: [] };
    var u = (s.t - tStart - 1.2) / per;   // 0 at the first station, i at station i
    for (var i = 0; i < n; i++) out.stamps.push(seg(u, i + 0.15, i + 0.45));
    if (u <= 0) return out;
    var i0 = Math.min(n - 1, Math.floor(u)), f = inOut3(seg(u - i0, 0.55, 1));
    var a = pts[i0], b = pts[Math.min(n - 1, i0 + 1)];
    out.x = lerp(a.x, b.x, f);
    out.y = lerp(a.y, b.y, f) + Math.sin(Math.PI * f) * 24;
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · pregunta — a notebook page with the big question of the course and empty lines; a pencil
  // waits; stars drift. Then the lectora, with her own question, writes in her notebook.

  var PREG = {
    page: { x: 70, y: 58, w: 790, h: 492 },
    text: { x: 140, y: 112, w: 680, size: 64 },
    pencil: { x: 772, y: 470, size: 120 },
    lectora: { x: 1062, y: 602, k: 2.9 }
  };

  function pregunta(ctx, s, env) {
    var C = cuesOf(s, 'pregunta'), ink = env.ink, fig = env.fig, Pg = PREG.page;
    paper(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 960, 110, 46], ['estrella', 1210, 160, 30], ['estrella', 920, 520, 34], ['espiral', 1180, 80, 34]], intro);
    fig.notebookPage(ctx, Pg.x, Pg.y, Pg.w, Pg.h, { seed: 'v01:pagina-pregunta', p: intro });
    var qp = beat(s.at(0), C.pregunta - 0.02, Math.min(1, C.pregunta + 0.42));
    if (qp > 0) ink.letter(ctx, rot(s, 'pregunta'), PREG.text.x, PREG.text.y, { size: PREG.text.size, maxWidth: PREG.text.w, maxLines: 3,
      seed: 'v01:pregunta', counters: 0.3, p: qp });
    // The pencil waits on the page, rocking a little.
    var Pc = PREG.pencil, c = calm(s);
    fig.sign(ctx, 'lapiz', Pc.x, Pc.y + Math.sin(s.t * 0.9) * 2 * c, Pc.size, { seed: 'v01:lapiz', rot: -0.5 + Math.sin(s.t * 0.7) * 0.04 * c, p: intro });
    var lp = out3(seg(s.at(1), 0, 0.3));
    if (lp > 0) fig.lectora(ctx, PREG.lectora.x, PREG.lectora.y, PREG.lectora.k, { pose: 'writing', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · cierre — back to the sea: the waterline settles halfway and shows the tip and the mass
  // together; the course message writes itself; slow fade to navy.

  var CIERRE = { berg: { x: 640, y: 338, k: 1.0 }, title: { x: 540, y: 34, size: 48, w: 880 }, fade: 2.6 };

  function cierre(ctx, s, env) {
    var st = s.state, m = env.pal.mundo, T = CIERRE.title;
    seaGround(ctx, s, env);
    var B = bob(CIERRE.berg, s, 1.4);
    seaStars(ctx, s, env, inRects([[T.x - T.w / 2, T.y, T.w, 130], [B.x - 90, B.y - 190, 200, 200]]));
    // The waterline comes up from below the mass and settles at half its depth.
    var settle = out3(seg(s.t, 0, 2.6));
    var depth = BERG.depth * lerp(0.92, 0.5, settle);
    drawBerg(ctx, env, st, B, { glow: 1, depth: depth, wash: 1 });
    summitLamp(ctx, s, env, B, 1);
    env.ink.letter(ctx, rot(s, 'titulo'), T.x, T.y, { size: T.size, align: 'center', maxWidth: T.w, maxLines: 2, seed: 'v01:mensaje',
      color: m.lienzo, counters: 0.25, counterColors: [m.amarillo, m.rojo, m.celeste], stars: false, p: seg(s.at(0), 0.02, 0.55) });
    // Slow fade to navy over the last seconds, once the message has been read.
    var f = seg(s.t, s.dur - CIERRE.fade, s.dur);
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

  function setup(env) {
    var ink = env.ink, i;
    var st = { berg: bergSetup(env), stars: starField(env) };

    // bajo-el-agua: the «≈» cap after one third of the 100 dots, and the 100% end of the track.
    var G = BAJO.grid, T = BAJO.track, cols = 10, pitch = G.w / cols, lit = Math.round(100 / 3), rows = Math.floor(lit / cols), rest = lit - rows * cols;
    st.bajo = {
      capEdge: [G.x, G.y + (rows + 1) * pitch, G.x + rest * pitch, G.y + (rows + 1) * pitch, G.x + rest * pitch, G.y + rows * pitch, G.x + G.w, G.y + rows * pitch],
      trackEnd: [T.x + T.len, T.y - 6, T.x + T.len, T.y + T.h + 6]
    };

    // advertencia: the hand-drawn boxes of the list.
    var boxes = [];
    for (i = 0; i < ADV.list.keys.length; i++) {
      var bx = ADV.list.x + 4, by = ADV.list.y + (i + 1) * ADV.list.gap + 6;
      boxes.push([bx, by, bx + 18, by + 1, bx + 19, by + 19, bx - 1, by + 18]);
    }
    st.adv = { boxes: boxes };

    // ruta and caso: the road, its session signs (sessions 2–7), the compass, the warm world.
    var signs = [];
    for (i = 2; i <= 7; i++) signs.push(env.pal.legend.sesiones[i].sign);
    var Cp = RUTA.compass, Wd = RUTA.world;
    st.ruta = {
      road: routePoints(),
      signs: signs,
      compassNS: [Cp.x + 2, Cp.y - Cp.size * 0.78, Cp.x - 1, Cp.y, Cp.x + 1, Cp.y + Cp.size * 0.7],
      compassEW: [Cp.x - Cp.size * 0.7, Cp.y + 1, Cp.x, Cp.y - 1, Cp.x + Cp.size * 0.7, Cp.y + 2],
      hill: [Wd.x, Wd.y, Wd.x + 60, Wd.y - 50, Wd.x + 150, Wd.y - 68, Wd.x + 240, Wd.y - 40, Wd.x + Wd.w, Wd.y]
    };
    var R = CASO.road;
    st.ruta.caso = {
      stations: RUTA.stations.map(function (p) { return { x: R.x + p[0] * R.k, y: R.y + p[1] * R.k }; }),
      rule: [ink.wavePoints(-110, 4, 110, 1.2, 70, 0.3), ink.wavePoints(-110, 30, 80, 1.2, 64, 1.1)]
    };
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v01 = {
    setup: setup,
    drawsWarnings: { advertencia: true },
    layers: {
      noche: seaLayer,
      punta: seaLayer,
      'bajo-el-agua': seaLayer,
      advertencia: paperLayer,
      ruta: paperLayer,
      caso: paperLayer,
      pregunta: paperLayer,
      cierre: seaLayer
    },
    scenes: {
      noche: noche,
      punta: punta,
      'bajo-el-agua': bajo,
      advertencia: advertencia,
      ruta: ruta,
      caso: caso,
      pregunta: pregunta,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
