/* js/laminas/d11.js — D11 «Ciencia: acelera piezas, no el ciclo completo» (prompt §12.2; KB §8,
 * "Guion de diapositivas").
 *
 * The diagram is the picture: a paper map of the scientific process, the process bar «Hipótesis ›
 * Diseño › Ejecución › Validación › Interpretación» as five chevrons in a row. Each step shows its
 * diagrama item's luz: 1 lit (flat yellow with a soft glow), 0.5 half-lit (yellow up to the middle,
 * dark after it; the label changes color at the split so it reads on both halves), 0 dark. A
 * telescope on its tripod and a microscope point at the map; a few stars and a free constellation
 * float above. The engine's generic pasos drawer ignores luz, so the module draws the bar (layout:
 * drawDiagram false). The big figures (cien-1, cap-5, cap-6) are drawn by the engine.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the stars
 * twinkle (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 810, h: 446 };                     // illustration + diagram band, as one picture
  var MAP = { x: 6, y: 336, w: 798, h: 104 };           // the paper map card (zone-local)
  var BAR = { x: 22, y: 360, w: 766, h: 58, tip: 20, gap: 8, size: 19 };
  var SCOPE = { x: 160, y: 320, scale: 1, angle: -0.42 };
  var MICRO = { x: 690, y: 214, scale: 1.18 };
  var STARS = [[300, 36, 34], [372, 96, 22], [466, 30, 26], [560, 118, 18], [80, 60, 24]];

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y + (z.h - NOMINAL.h * k) / 2 };
  }

  // Chevron i of n in local px: a notch on the left (except the first), a point on the right
  // (except the last); neighbours interlock with a small gap. `mid` is the center of its body.
  function chevron(i, n) {
    var w = BAR.w / n, g = BAR.gap / 2, x0 = BAR.x + i * w + (i > 0 ? g : 0), x1 = BAR.x + (i + 1) * w - (i < n - 1 ? g : 0);
    var y0 = BAR.y, y1 = BAR.y + BAR.h, ym = (y0 + y1) / 2, t = BAR.tip;
    var pts = [x0, y0, x1, y0];
    if (i < n - 1) pts.push(x1 + t, ym);
    pts.push(x1, y1, x0, y1);
    if (i > 0) pts.push(x0 + t, ym);
    return { pts: pts, x0: x0, x1: x1, y0: y0, y1: y1, mid: (x0 + x1) / 2 + (i > 0 ? t / 2 : 0) };
  }

  // Points every `step` px along a closed polygon's edges, so the brush outline (which runs through
  // a smoothing spline) keeps the corners of a chevron sharp.
  function densify(pts, step) {
    var out = [], n = pts.length / 2;
    for (var i = 0; i < n; i++) {
      var ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[(2 * i + 2) % pts.length], by = pts[(2 * i + 3) % pts.length];
      var m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
      for (var j = 0; j < m; j++) out.push(ax + (bx - ax) * j / m, ay + (by - ay) * j / m);
    }
    return out;
  }

  // The five chevrons with their light and their outlines, as one drawing (the labels are drawn per
  // frame from the data). Fields are straight-edged (poly): a step is a crisp arrow.
  function buildBar(env, items) {
    var b = env.ink.drawing('d11:bar', { w: 3.4, jitter: 0 }), m = env.pal.mundo, n = items.length, dark = env.pal.mix(m.tinta, m.azul, 0.22);
    var segs = [];
    items.forEach(function (it, i) {
      var c = chevron(i, n), luz = it.luz == null ? 1 : it.luz;
      if (luz >= 1) b.fill(c.pts, { fill: m.amarillo, fillScale: 0, poly: true });
      else if (luz <= 0) b.fill(c.pts, { fill: dark, fillScale: 0, poly: true });
      else {
        // Half-lit: yellow up to the split, dark after it (the split is a straight vertical cut).
        var xs = c.mid + (c.x1 - c.x0) * (luz - 0.5);
        b.fill(clipLeft(c.pts, xs), { fill: m.amarillo, fillScale: 0, poly: true });
        b.fill(clipRight(c.pts, xs), { fill: dark, fillScale: 0, poly: true });
        c.split = xs;
      }
      b.stroke(densify(c.pts, 5), { w: 3.4, closed: true, profile: 'outline', jitter: 0.4 });
      c.luz = luz;
      segs.push(c);
    });
    return { drawing: b.done(), segs: segs };
  }

  // Polygon clipped to x <= xs or x >= xs (convex enough for these chevrons: walk the edges).
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
  function clipLeft(pts, xs) { return clipSide(pts, xs, true); }
  function clipRight(pts, xs) { return clipSide(pts, xs, false); }

  // A step label centered in its chevron: tinta on light, cream on dark; on a half-lit step it is
  // drawn twice, each copy clipped to its own half.
  function stepLabel(ctx, env, text, c, X, Y, k) {
    var m = env.pal.mundo, o = { size: BAR.size * k, weight: 700, align: 'center', maxWidth: (c.x1 - c.x0 - BAR.tip - 8) * k, maxLines: 1, fit: true, minSize: 13 };
    var lay = env.ink.measureText(ctx, text, o), cx = X(c.mid), ty = Y((c.y0 + c.y1) / 2) - lay.h / 2 + 1;
    if (c.luz > 0 && c.luz < 1) {
      [[m.tinta, X(c.x0 - BAR.tip), X(c.split)], [m.lienzo, X(c.split), X(c.x1 + BAR.tip)]].forEach(function (h) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(h[1], Y(c.y0) - 4, h[2] - h[1], Y(c.y1) - Y(c.y0) + 8);
        ctx.clip();
        o.color = h[0];
        env.ink.text(ctx, text, cx, ty, o);
        ctx.restore();
      });
      return;
    }
    o.color = c.luz >= 1 ? m.tinta : m.lienzo;
    env.ink.text(ctx, text, cx, ty, o);
  }

  EIA.laminas.d11 = {
    layout: { drawDiagram: false },

    setup: function (env) {
      var e = EIA.engine && EIA.engine.lamina ? EIA.engine.lamina.entry(env.id) : null;
      var items = (e && e.diagrama && e.diagrama.items) || [];
      return { bar: items.length ? buildBar(env, items) : null };
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, dz = s.zones.diagrama, fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var area = { x: z.x, y: z.y, w: z.w, h: (dz ? dz.y + dz.h : z.y + z.h) - z.y };
      var f = fitOf(area), k = f.k;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
      var items = (s.lamina.diagrama && s.lamina.diagrama.items) || [], bar = s.state.bar;

      // The sky over the instruments: a free constellation and a few irregular stars.
      fig.sign(ctx, 'constelacion', X(640), Y(56), 92 * k, { seed: 'd11-const' });
      STARS.forEach(function (st, i) {
        var tw = s.still ? 1 : 0.85 + 0.15 * Math.sin(TAU * s.loop * (1 + i % 2) + i * 1.7);
        fig.sign(ctx, 'estrella', X(st[0]), Y(st[1]), st[2] * k * tw, { seed: 'd11-star' + i, colors: { a: i % 2 ? m.amarillo : m.rojo } });
      });

      // The paper map with the process bar.
      ink.card(ctx, X(MAP.x), Y(MAP.y), MAP.w * k, MAP.h * k, { seed: 'd11-map', weight: 4, radius: 12, peek: m.celeste, peekCorner: 'tr' });
      if (bar) {
        // Lit steps shine: a warm halo around them (a half-lit step around its lit half).
        bar.segs.forEach(function (c) {
          if (c.luz <= 0) return;
          var cx = c.luz >= 1 ? c.mid : (c.x0 + c.split) / 2;
          ink.glow(ctx, X(cx), Y((c.y0 + c.y1) / 2), (c.luz >= 1 ? 96 : 64) * k, m.amarillo, c.luz >= 1 ? 0.85 : 0.6);
        });
        ink.draw(ctx, bar.drawing, f.x, f.y, k);
        bar.segs.forEach(function (c, i) { if (items[i]) stepLabel(ctx, env, items[i].text, c, X, Y, k); });
      }

      // The instruments pointed at the map: a telescope on its tripod (left) and a microscope (right).
      fig.telescope(ctx, X(SCOPE.x), Y(SCOPE.y), SCOPE.scale * k, { angle: SCOPE.angle, seed: 'd11' });
      fig.microscope(ctx, X(MICRO.x), Y(MICRO.y), MICRO.scale * k, { seed: 'd11', flip: true });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
