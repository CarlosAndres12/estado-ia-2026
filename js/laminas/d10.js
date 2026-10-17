/* js/laminas/d10.js — D10 «Universidad: se usa más de lo que se gobierna» (prompt §12.2; KB §7,
 * "Guion de diapositivas").
 *
 * A fast warm boat (fig.boat) full of students races over a painted sea, pushed by a small ruled
 * motor — the AI is only the lamp on it; there is no compass and no map on board, and its wake
 * loops instead of keeping a course; far away on the horizon a lighthouse shines. The scene
 * encodes no value. The four-step evaluation path (diagrama, flujo) is drawn by the engine.
 *
 * The big-figure column is drawn here with the engine's own lamina.bigFigure: the first figure
 * («86%» … «24% a diario», edu-1 + edu-2) gets one tag per source — edu-1 under its label, tied
 * to «86%», and edu-2 («Con matiz», press coverage only) beside the end of the label, tied to
 * «24% a diario» — because their joined source label is wider than one tag. The other figures
 * (edu-3, edu-5) are drawn exactly as the engine draws them. The KB note about the removed «34%»
 * stays in the notes; nothing on the lámina shows it.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the boat rocks a
 * little, a gull glides and letters flow through the lamp (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  // fig.lamp moves its letters 0.09 of a cycle per second: loop × LAMP_CYCLE closes the cycle in 8 s.
  var LAMP_CYCLE = 1 / 0.09;
  var COLUMN = { x: 56, w: 330, gap: 28 };             // the big-figure column (as the engine lays it out)
  var NOMINAL = { w: 810, h: 302 };
  var HORIZON = 150;                                    // zone-local
  var BOAT = { x: 372, y: 238, scale: 1.15, passengers: 3 };
  var LIGHT = { x: 742, y: 152, scale: 0.3, beam: Math.PI + 0.1 };
  var WAVE = { len: 64, rows: [[186, 3.4], [242, 4], [286, 3.6]] };   // y and amplitude of each wave row
  var WAKE = [150, 258, 118, 268, 84, 254, 74, 230, 96, 218, 114, 236, 94, 262, 56, 274, 20, 266, 6, 250];

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

  // The sea: a free flat gouache field under the calligraphic horizon (soft ends, no frame), with
  // rows of cream brush waves inside it.
  function buildSea(env) {
    var b = env.ink.drawing('d10:sea', { w: 4, jitter: 0.6 }), m = env.pal.mundo, L = WAVE.len, W = NOMINAL.w;
    var pts = [], x;
    for (x = 26; x <= W - 26; x += L / 4) pts.push(x, HORIZON + Math.sin(x / L * TAU) * 1.5);
    pts.push(W - 6, HORIZON + 18, W - 14, 270, W - 46, 296, W * 0.7, 300, W * 0.4, 297, W * 0.15, 301, 40, 294, 10, 262, 6, HORIZON + 16);
    b.fill(pts, { fill: m.celeste, fillScale: 0 });
    WAVE.rows.forEach(function (row, i) {
      var x0 = 34 + i * 18, x1 = W - 40 - i * 22;
      b.stroke(env.ink.wavePoints(x0, row[0], x1, row[1], L, i * 1.3), { w: 2.6, profile: 'swell', color: m.lienzo });
    });
    return b.done();
  }

  function buildHorizon(env) {
    var b = env.ink.drawing('d10:horizon', { w: 4.4, jitter: 0.8 });
    b.stroke([0, HORIZON, 270, HORIZON + 2, 540, HORIZON - 1, NOMINAL.w, HORIZON + 1], { w: 4.2, profile: 'blunt' });
    b.blob(LIGHT.x, HORIZON + 2, 46, 11, { fill: env.pal.mundo.tierra, w: 3.4, irr: 0.15, n: 9 });
    return b.done();
  }

  // ---- The big-figure column

  function columnRects(s) {
    var e = s.lamina, n = (e.cifras || []).length, top = s.zones.ilustracion.y;
    var bottom = s.zones.idea ? s.zones.idea.y - 16 : 612, fh = (bottom - top) / Math.max(1, n), out = [];
    for (var i = 0; i < n; i++) out.push({ x: COLUMN.x, y: top + i * fh, w: COLUMN.w, h: fh });
    return out;
  }

  // One big figure whose label holds a second number from another source: the engine's figure
  // without its joined tag, then the first source's tag under the label (tied to the big number,
  // as the engine ties it) and each other source's tag right after the end of the label.
  function splitFigure(ctx, env, item, r, seed) {
    var L = EIA.engine.lamina, tags = env.tags, ink = env.ink;
    var copy = { valor: item.valor, etiqueta: item.etiqueta, cifras: [] };
    var out = L.bigFigure(ctx, copy, r, { seed: seed });
    var vb = out.valueBox, lb = out.labelBox, ids = item.cifras;
    // The first source, under the label: the engine's placement and fallbacks.
    var room = r.y + r.h - (lb.y + lb.h + 8) - 4, to = { scale: 0.8, maxWidth: r.w - 10, scope: 'auto' };
    if (tags.measureTag(ctx, [ids[0]], to).h > room) to.scope = false;
    if (tags.measureTag(ctx, [ids[0]], to).h > room) to.scale = 0.7;
    tags.sourceTag(ctx, [ids[0]], { x: r.x + 6, y: lb.y + lb.h + 8, scale: to.scale, maxWidth: to.maxWidth, scope: to.scope,
      anchor: { x: r.x + Math.min(vb.w, 90) * 0.5, y: r.y + vb.h * 0.92 } });
    // The other sources, beside the end of the label (its last line).
    var lay = ink.measureText(ctx, item.etiqueta, { size: 19, maxWidth: r.w, maxLines: 3, fit: true, minSize: 14 });
    ctx.save();
    ctx.font = lay.font;
    var endX = r.x + ctx.measureText(lay.lines[lay.lines.length - 1]).width;
    ctx.restore();
    var endY = lb.y + (lay.lines.length - 1) * lay.lineH + lay.size * 0.62, x = endX + 26;
    for (var i = 1; i < ids.length; i++) {
      var m2 = tags.measureTag(ctx, [ids[i]], { scale: 0.8, scope: false });
      var tg = tags.sourceTag(ctx, [ids[i]], { x: x, y: endY - m2.h / 2, scale: 0.8, scope: false, anchor: { x: endX + 5, y: endY } });
      x = tg.x + tg.w + 12;
    }
  }

  function drawFigures(ctx, env, s) {
    var L = EIA.engine && EIA.engine.lamina, e = s.lamina, list = e.cifras || [];
    if (!L || !list.length) return;
    columnRects(s).forEach(function (r, i) {
      var it = list[i], seed = e.id + ':fig' + i;
      if (i === 0 && it.cifras && it.cifras.length > 1) splitFigure(ctx, env, it, r, seed);
      else L.bigFigure(ctx, it, r, { seed: seed });
    });
  }

  // ---- The sea scene

  function drawScene(ctx, env, s, A) {
    var f = fitOf(A), k = f.k, fig = env.fig, ink = env.ink, m = env.pal.mundo;
    var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
    var u = s.still ? 0 : s.loop;
    ink.draw(ctx, s.state.sea, f.x, f.y, k, { offset: 3 });
    ink.draw(ctx, s.state.horizon, f.x, f.y, k, { offset: 3 });
    // The distant lighthouse, and a gull gliding near it.
    fig.lighthouse(ctx, X(LIGHT.x), Y(LIGHT.y), LIGHT.scale * k, { beam: LIGHT.beam });
    fig.sign(ctx, 'pajaro', X(600 + Math.sin(TAU * u) * 18), Y(56 + Math.sin(TAU * u * 2) * 5), 40 * k, { seed: 'd10-gull' });
    // The looping wake behind the motor (no course kept), then the boat, rocking by whole pixels in
    // the loop (the engine keys the wave under the hull by its position, so few positions keep it
    // cached).
    var rock = s.still ? 0 : Math.round(Math.sin(TAU * u * 2) * 2);
    ink.line(ctx, stable(env, 'wake', WAKE.map(function (v, i) { return i % 2 ? Y(v) : X(v); })), { w: 2.8 * k, profile: 'swell', seed: 'd10-wake' });
    ink.dotted(ctx, stable(env, 'foam', [X(164), Y(266), X(124), Y(280), X(68), Y(288)]), { r: 2.2 * k, gap: 12 * k, seed: 'd10-foam', color: m.lienzo });
    var bs = BOAT.scale * k, bx = X(BOAT.x), by = Y(BOAT.y) + rock;
    var boat = fig.boat(ctx, bx, by, bs, { motor: true, compass: false, passengers: BOAT.passengers, t: u * LAMP_CYCLE });
    // The motor is bolted to the stern by a short ruled bracket (the machine stays ruled and navy).
    var q = env.pal.maquina;
    ink.rRect(ctx, boat.motor.x - 2 * bs, boat.motor.y - 16 * bs, bx - 148 * bs - boat.motor.x + 4 * bs, 7 * bs, { fill: q.noche, color: q.linea, w: 1.2 });
  }

  EIA.laminas.d10 = {
    // The figure column is drawn by the module (see splitFigure); the zones keep the engine's layout.
    layout: { cifras: false, diagrama: { x: 414, y: 480, w: 810, h: 132 } },

    setup: function (env) { return { sea: buildSea(env), horizon: buildHorizon(env) }; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, dz = s.zones.diagrama;
      var left = COLUMN.x + COLUMN.w + COLUMN.gap;
      drawScene(ctx, env, s, { x: left, y: z.y, w: z.x + z.w - left, h: (dz ? dz.y - 12 : z.y + z.h) - z.y });
      drawFigures(ctx, env, s);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
