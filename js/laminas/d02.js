/* js/laminas/d02.js — D2 «Ruta de lectura» (prompt §12.2; KB §4, "Guion de diapositivas").
 *
 * The diagram is the route itself: a calligraphic road (fig.road) with six stations, one per
 * diagrama item («1 Capacidad técnica» … «Agenda 2026–2028»), each with the sign of the session
 * that teaches it (palette legend: sessions 2–7); an irregular star as the compass rose; and the
 * central question (ideaCentral) brush-lettered in the "Idea central" card. The module draws the
 * diagram and the card itself (layout: no diagram zone, no engine idea band).
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the compass
 * star sways a little; nothing moves when s.still.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 1168, h: 526 };                  // the illustration zone this design is drawn for
  // Road control points and label placement, in zone-local px.
  var ROAD = [70, 300, 290, 196, 500, 300, 710, 196, 920, 296, 1110, 170];
  var CARD_H = 112;                                    // the lettered "Idea central" card
  var STATION_R = 33, SIGN = 50;
  // Where each station's label sits: side ('below' | 'above') and an x nudge.
  var LABELS = [
    { side: 'below', dx: 24 }, { side: 'above', dx: 0 }, { side: 'below', dx: 0 },
    { side: 'above', dx: 0 }, { side: 'below', dx: 0 }, { side: 'above', dx: -20 }
  ];

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y };
  }

  // Compass rose: an irregular star inside a loose calligraphic ring with four ticks.
  function compass(ctx, env, x, y, k, sway, state) {
    var ink = env.ink, m = env.pal.mundo;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ink.line(ctx, state.ring, { w: 3.4, profile: 'swell', seed: 'd02-ring', closed: true });
    state.ticks.forEach(function (tk, i) { ink.line(ctx, tk, { w: i === 0 ? 5 : 3.6, profile: 'blunt', seed: 'd02-tick' + i }); });
    ink.circle(ctx, 0, -112, 7, { fill: m.rojo, line: false, seed: 'd02-north' });
    ctx.restore();
    env.fig.sign(ctx, 'estrella', x, y, 150 * k, { seed: 'd02-compass', rot: sway, colors: { a: m.rojo } });
  }

  // The lettered "Idea central" card (the engine's band, with the question brush-lettered).
  function ideaCard(ctx, env, idea, r) {
    var ink = env.ink, m = env.pal.mundo, w = env.pal.legend.words;
    ink.card(ctx, r.x, r.y, r.w, r.h, { seed: 'idea:d02', weight: 4.2, radius: 14, peek: m.amarillo, peekCorner: 'tr' });
    env.fig.sign(ctx, 'estrella', r.x + 36, r.y + r.h / 2, 40, { seed: 'idead02' });
    ink.text(ctx, w.ideaCentral, r.x + 70, r.y + 9, { size: 13, weight: 700, color: env.pal.mix(m.tinta, m.lienzo, 0.3) });
    ink.letter(ctx, idea.text, r.x + 70, r.y + 26, { size: 36, maxWidth: r.w - 100, maxLines: 2, fit: true, minSize: 24, seed: 'd02-pregunta' });
  }

  EIA.laminas.d02 = {
    layout: { diagrama: false, drawDiagram: false, idea: false },

    setup: function (env) {
      var ring = [], ticks = [];
      var rr = env.rng('d02:compass');
      for (var i = 0; i < 18; i++) {
        var a = i / 18 * TAU, rad = 100 + rr.jitter(3);
        ring.push(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      for (var j = 0; j < 4; j++) {
        var b = -Math.PI / 2 + j * Math.PI / 2;
        ticks.push([Math.cos(b) * 88, Math.sin(b) * 88, Math.cos(b) * 108, Math.sin(b) * 108]);
      }
      return { ring: ring, ticks: ticks, road: ROAD.slice() };
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var e = s.lamina, items = (e.diagrama && e.diagrama.items) || [];
      var signs = env.pal.legend.sesiones;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      // The compass rose floats in the open field above the start of the road.
      var sway = s.still ? 0 : Math.sin(TAU * s.loop) * 0.06;
      compass(ctx, env, X(96), Y(112), k * 0.7, sway, s.state);

      // The road and its six stations (fig.road keeps the stations evenly spaced along it).
      var rd = fig.road(ctx, f.x, f.y, k, { points: s.state.road, stations: 0, seed: 'd02' });
      var n = items.length;
      for (var i = 0; i < n; i++) {
        var u = n === 1 ? 0.5 : i / (n - 1), q = rd.at(u);
        ink.circle(ctx, q.x, q.y, STATION_R * k, { fill: m.lienzo, w: 4.2 * k, seed: 'd02-station' + i });
        var sg = signs[i + 2];
        if (sg) fig.sign(ctx, sg.sign, q.x, q.y, SIGN * k, { seed: 'd02-st' + i });
        var lb = LABELS[i] || LABELS[0], size = 22 * k, mw = 200 * k;
        var lay = ink.measureText(ctx, items[i].text, { size: size, weight: 700, maxWidth: mw, maxLines: 2, lineHeight: 1.15 });
        var ly = lb.side === 'above' ? q.y - STATION_R * k - 10 * k - lay.h : q.y + STATION_R * k + 8 * k;
        ink.text(ctx, items[i].text, q.x + lb.dx * k, ly, { size: size, weight: 700, maxWidth: mw, maxLines: 2, lineHeight: 1.15, align: 'center' });
      }

      // The central question, brush-lettered in the "Idea central" card.
      if (e.ideaCentral) ideaCard(ctx, env, e.ideaCentral, { x: z.x, y: z.y + z.h - 4 - CARD_H, w: z.w, h: CARD_H });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
