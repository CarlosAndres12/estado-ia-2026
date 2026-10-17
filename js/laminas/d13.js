/* js/laminas/d13.js — D13 «Riesgos: crecen junto con las capacidades» (prompt §12.2; KB §9,
 * "Guion de diapositivas").
 *
 * The control board of the KB metaphor («tablero de control con un indicador que sube de 233 a
 * 362»): a warm hand-drawn board holding one dial (chart.gauge). The dial runs on ONE zero-based
 * scale (its start marked with the legend's zero, its end unlabeled: no invented value); the needle
 * rests at exactly rotulos.aguja.valor (362) and a faint ghost needle at rotulos.fantasma.valor
 * (233), both at their exact angles, and the stretch of the dial band between them is red (the
 * rise, exactly 129 units long on the same scale). Their rótulos («362 (2025)», «233 (2024)») sit
 * at the needle tips and share one ries-1 tag, with a thread to each. The lectora stands beside the
 * board, asking (the raw count is not enough). The big figure «+55%» (ries-1) is the engine's.
 *
 * The three-column diagram («Uso malicioso» · «Fallos» · «Riesgos sistémicos») is drawn here as one
 * paper card across the bottom band, each column with its risk-family sign from the course legend
 * (anzuelo, grieta, red de hilos sobre un pueblo) and one tag for diagrama.cifras (ries-2, the IASR
 * 2026) hanging from the card: the engine's columnas drawer has neither the signs nor that tag.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the board's pilot
 * light pulses softly (nothing moves when s.still; the needles never move).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 810, h: 283 };                    // the illustration zone this design is drawn for
  var BOARD = { x: 14, y: -8, w: 530, h: 286 };
  // The dial: center, radius and the end of its scale. MAX is only where the unlabeled scale ends.
  var DIAL = { cx: 280, cy: 172, r: 94, max: 500, ticks: 10 };
  var KNOBS = [{ x: 82, y: 226, color: 'rojo', turn: -0.7 }, { x: 476, y: 226, color: 'amarillo', turn: 0.5 }];
  var PILOT = { x: 62, y: 40, r: 10 };
  // Tags never wrap their source label: maxWidth leaves room for the longest one.
  var TAG = { x: 566, y: -6, scale: 0.8, maxWidth: 360 };
  var READER = { x: 694, y: 282, scale: 1.76 };
  var COLS = { tagGap: 18, tagScale: 0.86, maxWidth: 340, sign: 74, size: 24 };

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return v === pts[i]; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y + (z.h - NOMINAL.h * k) / 2 };
  }

  function valueOf(env, r) {
    if (r.valor != null) return r.valor;
    var pv = env.chart.parseValue(r.text);
    return pv ? pv.value : null;
  }

  // A knob of the board: a colored disc with a pointer stroke (local px, built once).
  function buildBoard(env) {
    var b = env.ink.drawing('d13:board', { w: 3.4, jitter: 0.5 }), m = env.pal.mundo;
    KNOBS.forEach(function (kn) {
      b.circle(kn.x, kn.y, 19, { fill: m[kn.color], w: 3.6 });
      b.circle(kn.x, kn.y, 6, { fill: m.tinta, w: 2 });
      b.stroke([kn.x, kn.y, kn.x + Math.sin(kn.turn) * 16, kn.y - Math.cos(kn.turn) * 16], { w: 3.4, profile: 'blunt' });
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI * 0.75 + i * Math.PI * 0.375;
        b.stroke([kn.x + Math.sin(a) * 25, kn.y - Math.cos(a) * 25, kn.x + Math.sin(a) * 30, kn.y - Math.cos(a) * 30], { w: 2.2, profile: 'even' });
      }
    });
    // The pilot light's bezel and four rivets in the board's corners.
    b.circle(PILOT.x, PILOT.y, PILOT.r + 4, { w: 3 });
    [[BOARD.x + 18, BOARD.y + 18], [BOARD.x + BOARD.w - 18, BOARD.y + 18], [BOARD.x + 18, BOARD.y + BOARD.h - 18],
      [BOARD.x + BOARD.w - 18, BOARD.y + BOARD.h - 18]].forEach(function (c) { b.dot(c[0], c[1], 3.4); });
    return b.done();
  }

  // A dial rótulo: its number big, the rest («(2025)») smaller after it. side: 'left' (text starts
  // at x), 'center' (centered on x); y is the vertical middle of the number. Returns its box and
  // where a thread ties to it (just after the end of the rótulo).
  function dialLabel(ctx, env, text, x, y, side, k, color) {
    var ink = env.ink, pv = env.chart.parseValue(text);
    var num = pv && pv.index === 0 ? pv.raw : text, rest = pv && pv.index === 0 ? text.slice(pv.raw.length).replace(/^\s+/, '') : '';
    var no = { size: 36 * k, weight: 900, font: 'display', color: color };
    var ro = { size: 19 * k, weight: 700, color: color };
    var nl = ink.measureText(ctx, num, no), rl = rest ? ink.measureText(ctx, rest, ro) : { w: 0, h: 0 };
    var gap = rest ? 7 * k : 0, w = nl.w + gap + rl.w;
    var x0 = side === 'center' ? x - w / 2 : x, top = y - nl.size * 0.62;
    ink.text(ctx, num, x0, top, no);
    if (rest) ink.text(ctx, rest, x0 + nl.w + gap, top + (nl.size - rl.size) * 0.74, ro);
    return { x: x0, y: top, w: w, h: nl.h, anchor: { x: x0 + w + 6 * k, y: y - 2 * k } };
  }

  // The board, its dial and the dial's rótulos with their ries-1 tag.
  function drawBoard(ctx, env, s, f) {
    var ink = env.ink, chart = env.chart, m = env.pal.mundo, pal = env.pal, k = f.k, rot = s.lamina.rotulos || {};
    var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
    ink.card(ctx, X(BOARD.x), Y(BOARD.y), BOARD.w * k, BOARD.h * k, { seed: 'd13-board', weight: 4.6, radius: 26, fill: pal.mix(m.lienzoOcre, m.lienzo, 0.28) });
    ink.draw(ctx, s.state.board, f.x, f.y, k);
    // The pilot light (its glow pulses in the ambient loop).
    var pulse = s.still ? 0.55 : 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(TAU * s.loop));
    ink.glow(ctx, X(PILOT.x), Y(PILOT.y), 34 * k, m.amarillo, pulse);
    ink.circle(ctx, X(PILOT.x), Y(PILOT.y), PILOT.r * k, { fill: m.amarillo, line: false, seed: 'd13-pilot' });

    // The dial: a cream face, then the gauge on one zero-based scale with the exact needles.
    var cx = X(DIAL.cx), cy = Y(DIAL.cy), R = DIAL.r * k, sc = { min: 0, max: DIAL.max };
    var aguja = rot.aguja, fantasma = rot.fantasma;
    var v = aguja ? valueOf(env, aguja) : null, g = fantasma ? valueOf(env, fantasma) : null;
    ink.circle(ctx, cx, cy, R * 1.12, { fill: m.lienzo, w: 4.4, seed: 'd13-face' });
    if (v == null) return;
    // The dial band (as chart.gauge paints it), with the stretch from the ghost to the needle in
    // red: the rise, on the same scale. Then the gauge itself draws its arc, ticks and needles over
    // it (its own band made transparent), so every angle comes from one function.
    var band = function (from, to, color, alpha) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha *= alpha;
      ctx.lineWidth = R * 0.16;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, chart.gaugeAngle(sc, from), chart.gaugeAngle(sc, to));
      ctx.stroke();
      ctx.restore();
    };
    band(0, DIAL.max, m.amarillo, 0.8);
    if (g != null && v > g) band(g, v, m.rojo, 0.9);
    var res = chart.gauge(ctx, { x: cx, y: cy, r: R, min: 0, max: DIAL.max, value: v, ghost: g, ticks: DIAL.ticks, color: 'rgba(0,0,0,0)' });
    // The zero of the scale.
    var z0 = chart.gaugeAngle(sc, 0), zr = R * 1.25;
    ink.text(ctx, pal.legend.words.cero, cx + Math.cos(z0) * zr, cy + Math.sin(z0) * zr - 10 * k, { size: 18 * k, weight: 700, align: 'center' });

    // The rótulos at the needle tips and their one ries-1 tag (a thread to each).
    var anchors = [], ids = [];
    [[aguja, res.angle, m.tinta], [fantasma, res.ghostAngle, pal.mix(m.tinta, m.lienzo, 0.3)]].forEach(function (lb) {
      var r = lb[0], a = lb[1];
      if (!r || a == null) return;
      var rr = R * 1.24, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      var side = Math.abs(Math.cos(a)) < 0.4 ? 'center' : 'left';
      if (side === 'center') py -= 22 * k;                       // above the tip
      var box = dialLabel(ctx, env, r.text, px, py, side, k, lb[2]);
      anchors.push(box.anchor);
      (r.cifras || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    });
    if (!ids.length || !anchors.length) return;
    var tg = env.tags.sourceTag(ctx, ids, { x: X(TAG.x), y: Y(TAG.y), scale: TAG.scale * k, scope: 'auto', maxWidth: TAG.maxWidth,
      anchor: anchors[0] });
    for (var i = 1; i < anchors.length; i++) {
      var a = anchors[i], hx = tg.hole.x, hy = tg.hole.y;
      ink.line(ctx, stable(env, 'thread' + i, [a.x, a.y, (a.x + hx) / 2, (a.y + hy) / 2 + 8 * k, hx, hy]), { w: 2 * TAG.scale * k, profile: 'hair',
        seed: 'd13-thread' + i, dot: 1.6 });
    }
  }

  // The three-column diagram: one paper card, a risk-family sign over each label, one ries-2 tag.
  function drawColumns(ctx, env, d, r) {
    var items = (d && d.items) || [], n = items.length;
    if (!n) return;
    var ink = env.ink, fig = env.fig, legend = env.pal.legend.riesgos || [];
    var ids = d.cifras || [], to = { scale: COLS.tagScale, scope: 'auto', maxWidth: COLS.maxWidth };
    var tm = ids.length ? env.tags.measureTag(ctx, ids, to) : { w: 0, h: 0 };
    var cardW = r.w - (tm.w ? tm.w + COLS.tagGap + 8 : 0), cardH = r.h - 6, colW = cardW / n, y = r.y + 2;
    ink.card(ctx, r.x, y, cardW, cardH, { seed: 'd13-cols', weight: 4, radius: 16, peek: env.pal.mundo.amarillo, peekCorner: 'tl' });
    items.forEach(function (it, i) {
      var x = r.x + i * colW, fam = null;
      legend.forEach(function (L) { if (L.label.toLowerCase() === String(it.text).trim().toLowerCase()) fam = L; });
      if (!fam) fam = legend[i];
      if (i > 0) ink.line(ctx, [x, y + 16, x + 2, y + cardH / 2, x, y + cardH - 16], { w: 2.6, profile: 'swell', seed: 'd13-div' + i });
      if (fam) fig.sign(ctx, fam.sign, x + colW / 2, y + 42, COLS.sign, { seed: 'd13-' + fam.key });
      var o = { size: COLS.size, weight: 700, align: 'center', maxWidth: colW - 24, maxLines: 1, fit: true, minSize: 16 };
      ink.text(ctx, it.text, x + colW / 2, y + 83, o);
    });
    if (ids.length) {
      env.tags.sourceTag(ctx, ids, { x: r.x + cardW + COLS.tagGap, y: y + (cardH - tm.h) / 2, scale: to.scale, scope: to.scope,
        maxWidth: to.maxWidth, anchor: { x: r.x + cardW + 2, y: y + cardH / 2 } });
    }
  }

  EIA.laminas.d13 = {
    // The diagram is drawn here, across the full width of the bottom band.
    layout: { drawDiagram: false },

    setup: function (env) { return { board: buildBoard(env) }; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, dz = s.zones.diagrama, f = fitOf(z), k = f.k;
      drawBoard(ctx, env, s, f);
      // The lectora beside the board, on a short calligraphic ground line.
      var rx = f.x + READER.x * k, ry = f.y + READER.y * k;
      env.ink.line(ctx, stable(env, 'ground', [rx - 58 * k, ry + 1, rx, ry + 3 * k, rx + 62 * k, ry]), { w: 3.6 * k, profile: 'swell', seed: 'd13-ground' });
      env.fig.lectora(ctx, rx, ry, READER.scale * k, { pose: 'asking', facing: -1 });
      if (dz) drawColumns(ctx, env, s.lamina.diagrama, { x: 56, y: dz.y, w: 1168, h: dz.h });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
