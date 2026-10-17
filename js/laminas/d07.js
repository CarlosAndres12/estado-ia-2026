/* js/laminas/d07.js — D7 «Del uso al valor: el embudo de la adopción» (prompt §12.2; KB §6,
 * "Guion de diapositivas").
 *
 * Top: a bridge over a bottomless abyss from rotulos.uso («Uso») to rotulos.valor («Valor»)
 * (fig.bridge): its last span is still scaffolding — a hand-drawn scaffold tower stands in the
 * gap and planks wait on the far bank — while two warm workers carry and fix the next planks.
 * Bottom: the diagram, drawn here (not by the engine) so the bottleneck can be named: the four
 * funnel bars on ONE zero-based 0–100 scale (chart.funnel), values parsed from the item texts
 * («88%», «62%», «~1/3» at exactly one third with the dotted "≈" cap, «39%»); the four share one
 * source, type and estado, so one McKinsey tag hangs beside the labels with a thread to each
 * number. The narrowest bar, bracketed by the funnel, is marked with rotulos.cuello («cuello de
 * botella»), and rotulos.cautela («Cada barra sale de una pregunta distinta de la misma
 * encuesta.») sits under the labels in small type.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop a bird glides
 * over the abyss (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var BUILT = 0.72;                                   // share of the deck already built (fig.bridge default)
  var BRIDGE = { scale: 0.9, below: 200 };             // the cliffs reach 200 local px under the deck
  var FUNNEL = { x: 200, w: 340, labelGap: 24, labelW: 440, size: 20, tail: 30, tagScale: 0.86 };

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return v === pts[i]; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  // Scaffold tower under the unbuilt span, in fig.bridge local units (deck from x −150 to 150 at y 0).
  function buildScaffold(env) {
    var b = env.ink.drawing('d07:scaffold', { w: 2.6, jitter: 0.6 }), m = env.pal.mundo;
    var xb = -150 + 300 * BUILT, l = xb + 16, r = 136, top = 8, bot = 158;
    b.stroke([l, top, l - 1, bot], { w: 3.2, profile: 'blunt' });
    b.stroke([r, top, r + 1, bot], { w: 3.2, profile: 'blunt' });
    [48, 92, 136].forEach(function (y) { b.stroke([l - 8, y, r + 8, y + 1], { w: 2.6, profile: 'even' }); });
    b.stroke([l, top + 4, r, 48], { w: 2, profile: 'hair' });
    b.stroke([r, 48, l, 92], { w: 2, profile: 'hair' });
    b.stroke([l, 92, r, 136], { w: 2, profile: 'hair' });
    // A plank waiting on the far bank, and a short pile of planks there.
    [0, 7, 14].forEach(function (dy, i) {
      b.shape([168 + i * 3, -10 - dy, 226 + i * 2, -11 - dy, 226 + i * 2, -5 - dy, 168 + i * 3, -4 - dy], { fill: m.tierra, w: 1.8, fillScale: 0 });
    });
    return b.done();
  }

  // The bridge picture: clipped to its area so the abyss has no bottom.
  function drawBridge(ctx, env, s, A) {
    var fig = env.fig, ink = env.ink, m = env.pal.mundo, rot = s.lamina.rotulos || {};
    var k = BRIDGE.scale, bx = A.x + A.w / 2, by = A.y + A.h - BRIDGE.below * k;
    ctx.save();
    ctx.beginPath();
    ctx.rect(A.x, A.y - 40, A.w, A.h + 40);
    ctx.clip();
    fig.sign(ctx, 'sol', bx + 300 * k, by - 40 * k, 58 * k, { seed: 'd07-sun' });
    var labels = {};
    if (rot.uso) labels.left = rot.uso.text;
    if (rot.valor) labels.right = rot.valor.text;
    var br = fig.bridge(ctx, bx, by, k, { built: BUILT, labels: labels, seed: 'd07' });
    ink.draw(ctx, s.state.scaffold, bx, by, k);
    // Two workers on the deck: one carries a plank toward the gap, one fixes the last plank.
    var deck = by - 8 * k;
    fig.person(ctx, br.end.x - 118 * k, deck, 0.6 * k, { role: 'persona', pose: 'carrying', prop: 'plank', facing: 1, seed: 'd07-w1',
      skin: 3, hair: 'curly', cloth: m.verde, legs: m.azul });
    fig.person(ctx, br.end.x - 26 * k, deck, 0.6 * k, { role: 'persona', pose: 'tying', facing: 1, seed: 'd07-w2',
      skin: 1, hair: 'bun', cloth: m.rojo, legs: m.tinta });
    // A bird gliding over the abyss (ambient only).
    var u = s.still ? 0 : s.loop;
    fig.sign(ctx, 'pajaro', bx - 96 * k + Math.sin(TAU * u) * 24, by + 74 * k + Math.sin(TAU * u * 2) * 6, 50 * k, { seed: 'd07-bird',
      colors: { a: m.amarillo } });
    ctx.restore();
  }

  // Where chart.funnel's label of one item ends (its value token, then the rest of the text).
  function labelEnd(ctx, env, it, lx) {
    var ink = env.ink, size = FUNNEL.size, pv = env.chart.parseValue(it.text), vt = '', rest = it.text;
    if (pv && pv.index === 0) {
      vt = pv.raw;
      if (pv.approx && !/[~≈]|cerca|casi/i.test(vt)) vt = env.pal.legend.words.aprox + ' ' + vt;
      rest = it.text.slice(pv.raw.length).replace(/^[\s:·]+/, '');
    }
    var vw = vt ? ink.measureText(ctx, vt, { size: size * 1.15, weight: 700 }).w + size * 0.4 : 0;
    var rw = rest ? ink.measureText(ctx, rest, { size: size * 0.85, maxWidth: FUNNEL.labelW, lineHeight: 1.18 }).w : 0;
    return lx + vw + rw;
  }

  // The funnel: bars on one zero-based 0–100 scale, the bottleneck named, the caution underneath.
  function drawFunnel(ctx, env, s, R) {
    var ink = env.ink, chart = env.chart, d = s.lamina.diagrama, rot = s.lamina.rotulos || {};
    var items = (d && d.items) || [];
    if (!items.length) return;
    var n = items.length, pitch = (R.h - FUNNEL.tail) / n, h = Math.min(34, pitch - 13), lx = FUNNEL.x + FUNNEL.w + FUNNEL.labelGap;
    var bars = chart.funnel(ctx, { x: FUNNEL.x, y: R.y, w: FUNNEL.w, items: items, max: 100, h: h, gap: pitch - h, pitch: pitch,
      labelX: lx, labelWidth: FUNNEL.labelW, labelSize: FUNNEL.size, tags: false });
    // The four bars share one source, type and estado: one tag beside the labels, with a thread to
    // each of the four numbers (the tag draws the first; the others are drawn the same way).
    var ids = [], ends = items.map(function (it) { return labelEnd(ctx, env, it, lx); });
    items.forEach(function (it) { (it.cifras || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    if (ids.length) {
      var to = { scale: FUNNEL.tagScale, scope: false }, tm = env.tags.measureTag(ctx, ids, to);
      var midY = (bars[0].y0 + bars[n - 1].y1) / 2, tx = Math.max.apply(null, ends) + 46, ty = midY - tm.h / 2;
      var rowY = function (i) { return (bars[i].y0 + bars[i].y1) / 2; };
      var tg = env.tags.sourceTag(ctx, ids, { x: tx, y: ty, scale: to.scale, scope: false, anchor: { x: ends[0] + 8, y: rowY(0) } });
      for (var i = 1; i < n; i++) {
        var ax = ends[i] + 8, ay = rowY(i), hx = tg.hole.x, hy = tg.hole.y;
        ink.line(ctx, stable(env, 'thread' + i, [ax, ay, (ax + hx) / 2, (ay + hy) / 2 + 8, hx, hy]), { w: 2 * to.scale, profile: 'hair',
          seed: 'd07-thread' + i, dot: 1.6 });
      }
    }
    // The bottleneck: the item the data marks (cuello), else the narrowest bar.
    var neck = -1;
    items.forEach(function (it, i) { if (it.cuello) neck = i; });
    if (neck < 0) bars.forEach(function (g, i) { if (neck < 0 || g.full < bars[neck].full) neck = i; });
    var g = bars[neck];
    if (g && rot.cuello) {
      var lo = { size: 20, weight: 700, align: 'right' };
      var lay = ink.measureText(ctx, rot.cuello.text, lo);
      ink.text(ctx, rot.cuello.text, g.x0 - 30, (g.y0 + g.y1) / 2 - lay.h / 2 + 1, lo);
    }
    if (rot.cautela) {
      var last = bars[bars.length - 1];
      ink.text(ctx, rot.cautela.text, FUNNEL.x + FUNNEL.w + FUNNEL.labelGap, last.y1 + 16, { size: 16, italic: true,
        color: env.pal.mix(env.pal.mundo.tinta, env.pal.mundo.lienzo, 0.15), maxWidth: R.x + R.w - FUNNEL.x - FUNNEL.w - FUNNEL.labelGap });
    }
  }

  EIA.laminas.d07 = {
    // The diagram band starts a little higher and is drawn here (bottleneck label, caution line).
    layout: { drawDiagram: false, diagrama: { x: 56, y: 420, w: 1168, h: 192 } },

    setup: function (env) { return { scaffold: buildScaffold(env) }; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, dz = s.zones.diagrama;
      var top = z.y, A = { x: z.x, y: top, w: z.w, h: (dz ? dz.y : z.y + z.h) - 14 - top };
      drawBridge(ctx, env, s, A);
      if (dz) drawFunnel(ctx, env, s, dz);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
