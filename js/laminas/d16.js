/* js/laminas/d16.js — D16 «Agenda 2026–2028» (prompt §12.2; KB §10, "Guion de diapositivas").
 *
 * The KB metaphor («camino con hitos y brújula») as the diagram itself: diagrama.titulo («Hoja de
 * ruta en tres carriles») over a calligraphic road with three lanes, one per diagrama item, each
 * named at the road's start by its carril (Gobiernos, Universidades, Organizaciones). Milestone
 * stones stand on the road's edge, one per diagrama.hitos year (2026, 2027, 2028); each lane's
 * priorities (its item text, split at its commas: verbatim pieces) sit under the milestones in
 * order. Because that order is only a proposal, rotulos.nota («el orden por año es una secuencia
 * propuesta», the KB note) is written under the title. A compass star floats where the road
 * leads. Years that only name a moment get no tag; nothing on the lámina is a figure.
 *
 * The engine's linea drawer expects dated items, so the module draws the road (layout: diagrama
 * false). Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the
 * compass star sways a little (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 1168, h: 462 };                   // illustration + diagram band, as one picture
  var ROAD = { x0: 0, x1: 1096, tip: 1162, top: 122, lane: 104, start: 232 };
  var STONE = { w: 84, h: 50 };
  var COMPASS = { x: 1106, y: 50, size: 100, rot: 0.42 };      // its north leans toward where the road leads
  var TEXT = { title: 30, note: 19, lane: 25, item: 21 };

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y + (z.h - NOMINAL.h * k) / 2 };
  }

  // Points every `step` px along a closed polygon's edges, so the brush outline (which runs through
  // a smoothing spline) keeps its corners.
  function densify(pts, step) {
    var out = [], n = pts.length / 2;
    for (var i = 0; i < n; i++) {
      var ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[(2 * i + 2) % pts.length], by = pts[(2 * i + 3) % pts.length];
      var m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
      for (var j = 0; j < m; j++) out.push(ax + (bx - ax) * j / m, ay + (by - ay) * j / m);
    }
    return out;
  }

  function columnsOf(nCols) {
    var w = (ROAD.x1 - ROAD.start) / nCols, out = [];
    for (var i = 0; i < nCols; i++) out.push({ x: ROAD.start + i * w, w: w, cx: ROAD.start + (i + 0.5) * w });
    return out;
  }

  // The road (band, lane markings, year boundaries) and the milestone stones, built once.
  function buildRoad(env, nLanes, nCols) {
    var b = env.ink.drawing('d16:road', { w: 4.4, jitter: 0.6 }), m = env.pal.mundo;
    var top = ROAD.top, bot = top + nLanes * ROAD.lane, mid = (top + bot) / 2;
    // A straight-edged gouache field under a brush outline whose corners stay sharp.
    var band = [ROAD.x0, top, ROAD.x1, top, ROAD.tip, mid, ROAD.x1, bot, ROAD.x0, bot];
    b.fill(band, { fill: m.lienzoOcre, fillScale: 0, poly: true });
    b.stroke(densify(band, 24), { w: 4.6, closed: true, profile: 'outline' });
    // Cream dashed markings between the lanes.
    for (var l = 1; l < nLanes; l++) {
      var y = top + l * ROAD.lane;
      for (var x = 22; x < ROAD.x1 - 30; x += 52) b.stroke([x, y, x + 15, y + 0.6, x + 30, y], { w: 5, profile: 'blunt', color: m.lienzo });
    }
    // Dotted boundaries between the years, and where the lane names end.
    var cols = columnsOf(nCols);
    cols.forEach(function (c) {
      for (var yy = top + 12; yy < bot - 8; yy += 15) b.dot(c.x, yy, 2.1, { color: env.pal.mix(m.tinta, m.lienzoOcre, 0.45) });
    });
    // A milestone stone on the road's edge above each year.
    cols.forEach(function (c, i) {
      var w = STONE.w / 2, h = STONE.h, cx = c.cx;
      b.shape([cx - w, top + 4, cx - w + 2, top - h * 0.55, cx - w * 0.6, top - h * 0.92, cx, top - h, cx + w * 0.6, top - h * 0.92,
        cx + w - 2, top - h * 0.55, cx + w, top + 4], { fill: i % 2 ? m.lienzo : env.pal.mix(m.lienzo, m.amarillo, 0.35), w: 3.8 });
    });
    return { drawing: b.done(), cols: cols };
  }

  // A lane's priorities, one per milestone when they split evenly at their commas; else the whole
  // text across the lane.
  function piecesOf(text, n) {
    var parts = String(text || '').split(/,\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    return parts.length === n ? parts : null;
  }

  // The compass rose around the star: a flat yellow field, a loose calligraphic ring and four
  // ticks (local px around the center, scale 1 = COMPASS.size 124).
  function buildRose(env) {
    var b = env.ink.drawing('d16:rose', { w: 3, jitter: 0.6 }), m = env.pal.mundo, r = env.rng('d16:rose'), ring = [];
    b.blob(5, 6, 52, 48, { fill: m.amarillo, line: false, irr: 0.12, n: 9 });
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * TAU, rad = 66 + r.jitter(2.5);
      ring.push(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    b.stroke(ring, { w: 3, closed: true, profile: 'swell' });
    for (var j = 0; j < 4; j++) {
      var t = -Math.PI / 2 + j * Math.PI / 2;
      b.stroke([Math.cos(t) * 58, Math.sin(t) * 58, Math.cos(t) * 74, Math.sin(t) * 74], { w: j === 0 ? 4.6 : 3.4, profile: 'blunt' });
    }
    return b.done();
  }

  EIA.laminas.d16 = {
    layout: { diagrama: false, drawDiagram: false },

    setup: function (env) {
      var e = EIA.engine && EIA.engine.lamina ? EIA.engine.lamina.entry(env.id) : null;
      var d = (e && e.diagrama) || {}, nLanes = (d.items || []).length || 3, nCols = (d.hitos || []).length || 3;
      var out = buildRoad(env, nLanes, nCols);
      out.rose = buildRose(env);
      return out;
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, ink = env.ink, m = env.pal.mundo;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
      var e = s.lamina, d = e.diagrama || {}, items = d.items || [], hitos = d.hitos || [], rot = e.rotulos || {}, st = s.state;

      // Title, and the KB note right under it.
      if (d.titulo) ink.text(ctx, d.titulo, X(0), Y(0), { size: TEXT.title * k, weight: 700, font: 'display' });
      if (rot.nota) ink.text(ctx, rot.nota.text, X(2), Y(44), { size: TEXT.note * k, italic: true, color: env.pal.mix(m.tinta, m.lienzo, 0.15) });

      // The compass star where the road leads (it sways a little in the ambient loop).
      var sway = s.still ? 0 : Math.sin(TAU * s.loop) * 0.07;
      ink.draw(ctx, st.rose, X(COMPASS.x), Y(COMPASS.y), COMPASS.size / 124 * k);
      env.fig.sign(ctx, 'brujula', X(COMPASS.x), Y(COMPASS.y), COMPASS.size * k, { seed: 'd16-compass', rot: COMPASS.rot + sway });

      // The road, its stones and their years.
      ink.draw(ctx, st.drawing, f.x, f.y, k);
      st.cols.forEach(function (c, i) {
        if (hitos[i] == null) return;
        var o = { size: 23 * k, weight: 700, align: 'center' }, lay = ink.measureText(ctx, hitos[i], o);
        ink.text(ctx, hitos[i], X(c.cx), Y(ROAD.top - STONE.h * 0.5) - lay.h / 2, o);
      });

      // Each lane: its name at the road's start, its priorities under the milestones.
      items.forEach(function (it, l) {
        var y0 = ROAD.top + l * ROAD.lane, cy = Y(y0 + ROAD.lane / 2);
        if (it.carril) {
          var lo = { size: TEXT.lane * k, weight: 700, font: 'display', maxWidth: (ROAD.start - 26) * k, maxLines: 1, fit: true, minSize: 16 };
          var ll = ink.measureText(ctx, it.carril, lo);
          ink.text(ctx, it.carril, X(16), cy - ll.h / 2, lo);
        }
        var pieces = piecesOf(it.text, st.cols.length);
        var cells = pieces ? pieces.map(function (p, i) { return { text: p, c: st.cols[i] }; })
          : [{ text: it.text, c: { cx: (ROAD.start + ROAD.x1) / 2, w: ROAD.x1 - ROAD.start } }];
        cells.forEach(function (cell) {
          var o = { size: TEXT.item * k, weight: 700, align: 'center', maxWidth: (cell.c.w - 34) * k, maxLines: 2, fit: true, minSize: 15, lineHeight: 1.15 };
          var lay = ink.measureText(ctx, cell.text, o);
          ink.text(ctx, cell.text, X(cell.c.cx), cy - lay.h / 2, o);
        });
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
