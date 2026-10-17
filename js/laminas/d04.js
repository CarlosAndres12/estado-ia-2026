/* js/laminas/d04.js — D4 «De chatbot a agente» (prompt §12.2; KB §5, "Guion de diapositivas").
 *
 * The KB's "robot aprendiz" is the lamp: the AI never gets a body. Three machine pictures, all
 * ruled and navy, beside the engine's big figures (adop-2, adop-3):
 *   top     «Pregunta → Respuesta»: a paper bubble goes into the lamp and a bubble comes out;
 *   bottom  the diagram, drawn as the ruled agent loop around the lamp (fig.agentLoop) with the
 *           diagrama labels and its return arrow to diagrama.retorno;
 *   right   a ruled ladder the lamp climbs, its rungs at the exact heights of rotulos.peldanoBajo
 *           and peldanoAlto (valor, on one zero-based 0–100 scale), the high one cracked with
 *           peldanoRoto («≈1 de cada 3 falla»); approximate rungs end in dots, and one cap-1 tag
 *           (a benchmark of computer tasks) hangs on the ladder for its three numbers.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop letters flow
 * through the lamps (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  // fig.lamp moves its letters 0.09 of a cycle per second: loop × LAMP_CYCLE closes the cycle in 8 s.
  var LAMP_CYCLE = 1 / 0.09;
  var NOMINAL = { w: 810, h: 462 };                    // the illustration zone this design is drawn for
  var LADDER = { panelX: 516, cx: 576, zeroY: 430, h: 340, scale: 0.944, max: 100 };

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

  // A paper speech bubble with its word centered, tail toward (tx, ty).
  function bubble(ctx, env, text, x, y, w, h, tail, seed) {
    env.fig.bubble(ctx, x, y, w, h, { tail: tail, seed: seed });
    env.ink.text(ctx, text, x + w / 2, y + h / 2 - 14, { size: 22, weight: 700, align: 'center', maxWidth: w - 20, fit: true, minSize: 15 });
  }

  EIA.laminas.d04 = {
    layout: { diagrama: false, drawDiagram: false },

    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, fig = env.fig, ink = env.ink, chart = env.chart, tags = env.tags;
      var m = env.pal.mundo, q = env.pal.maquina, words = env.pal.legend.words;
      var e = s.lamina, rot = e.rotulos || {}, t = s.still ? 0 : s.loop * LAMP_CYCLE;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      // Top: «Pregunta → Respuesta», one exchange through the lamp.
      var lampX = X(250), lampY = Y(52);
      fig.panel(ctx, lampX - 58 * k, lampY - 50 * k, 116 * k, 100 * k, { cell: 12, construction: false });
      fig.lamp(ctx, lampX, lampY, 0.6 * k, { t: t });
      if (rot.pregunta) bubble(ctx, env, rot.pregunta.text, X(14), Y(18), 152 * k, 66 * k, { x: X(152), y: Y(82) }, 'd04-pregunta');
      if (rot.respuesta) bubble(ctx, env, rot.respuesta.text, X(334), Y(18), 152 * k, 66 * k, { x: X(348), y: Y(82) }, 'd04-respuesta');
      ink.arrow(ctx, stable(env, 'in', [X(170), Y(52), X(184), Y(48), X(190), Y(52)]), { w: 3.2 * k, headSize: 11 * k, seed: 'd04-in' });
      ink.arrow(ctx, stable(env, 'out', [X(310), Y(52), X(320), Y(48), X(330), Y(52)]), { w: 3.2 * k, headSize: 11 * k, seed: 'd04-out' });

      // Bottom: the diagram as the ruled agent loop around the lamp. The station labels are set
      // here (as fig.agentLoop sets them) except that a label on a side of the loop stays inside
      // it, so «Usar herramientas» never runs past the panel's edge.
      var d = e.diagrama;
      if (d && d.items) {
        var ls = 0.886 * k, items = d.items;
        var loop = fig.agentLoop(ctx, X(0), Y(150), ls, { n: items.length, returnTo: d.retorno, t: t });
        var P = loop.panel, cxL = P.x + P.w / 2, cyL = P.y + P.h / 2 + 6 * ls, ryL = P.h * 0.27, size = 15 * Math.max(0.9, ls);
        loop.stations.forEach(function (sp, i) {
          if (!items[i]) return;
          var lo2 = { size: size, weight: 700, color: m.lienzo, lineHeight: 1.18 };
          if (Math.abs(sp.y - cyL) < ryL * 0.5) {
            var right = sp.x > cxL;
            lo2.align = right ? 'right' : 'left';
            lo2.maxWidth = 104 * ls;
            var lay = ink.measureText(ctx, items[i].text, lo2);
            ink.text(ctx, items[i].text, sp.x + (right ? -16 : 16) * ls, sp.y - lay.h / 2 + 2 * ls, lo2);
          } else {
            lo2.align = 'center';
            lo2.maxWidth = 150 * ls;
            ink.text(ctx, items[i].text, sp.x, sp.y > cyL + 1 ? sp.y + 16 * ls : sp.y - 34 * ls, lo2);
          }
        });
      }

      // Right: the ruled ladder the lamp climbs (a benchmark: navy panel, exact rung heights).
      var L = LADDER, sc = L.scale * k, cx = X(L.cx), zy = Y(L.zeroY);
      fig.panel(ctx, X(L.panelX), Y(0), z.x + z.w - X(L.panelX), Y(NOMINAL.h) - Y(0), { cell: 12, construction: false });
      var lo = rot.peldanoBajo, hi = rot.peldanoAlto, broken = rot.peldanoRoto;
      var rungs = [];
      if (lo) rungs.push({ value: lo.valor != null ? lo.valor : chart.parseValue(lo.text).value });
      if (hi) rungs.push({ value: hi.valor != null ? hi.valor : chart.parseValue(hi.text).value, crack: !!broken });
      var lad = fig.ruledLadder(ctx, cx, zy, sc, { max: L.max, h: L.h, rungs: rungs, panel: false, t: t });
      // Regular ruler ticks along the left rail (every tenth of the scale; no numbers).
      for (var i = 1; i <= 10; i++) {
        var ty = lad.scale(L.max * i / 10);
        ink.rLine(ctx, lad.x0 - (i % 5 ? 6 : 11) * k, ty, lad.x0, ty, { color: q.linea, w: 1, alpha: 0.7 });
      }
      // The lamp has climbed to the high rung (left of its crack, so the crack shows).
      if (hi) fig.lamp(ctx, cx - 16 * k, lad.rungs[lad.rungs.length - 1] - 26 * k, 0.46 * k, { t: t });
      // Rung labels: approximate rungs end in three dots (and "≈" when the words do not say it).
      var lx = lad.x1 + 26 * k;
      [lo, hi].forEach(function (r, j) {
        if (!r) return;
        var ry = lad.rungs[j];
        for (var dI = 0; dI < 3; dI++) ink.rCircle(ctx, lad.x1 + (5 + dI * 6) * k, ry, 1.6 * k, { fill: q.linea, stroke: false });
        var approx = r.aprox && !/[~≈]/.test(r.text) ? (r.aprox || words.aprox) : '';
        var tx = lx;
        if (approx) {
          var al = ink.text(ctx, approx, tx, ry - 13 * k, { size: 21 * k, weight: 700, color: m.lienzo });
          tx += al.w + 6 * k;
        }
        ink.text(ctx, r.text, tx, ry - 13 * k, { size: 21 * k, weight: 700, color: m.lienzo, maxWidth: z.x + z.w - tx - 8 });
      });
      if (broken && hi) {
        var by = lad.rungs[lad.rungs.length - 1];
        ink.glow(ctx, (lad.x0 + lad.x1) / 2 + 10 * k, by, 16 * k, q.brilloMagenta, 0.5, true);
        ink.text(ctx, broken.text, lx, by + 14 * k, { size: 17 * k, weight: 700, color: m.lienzo, maxWidth: z.x + z.w - lx - 8, lineHeight: 1.15 });
      }
      // One tag for the ladder's three numbers, hanging from the top of the ladder.
      var ids = (hi && hi.cifras && hi.cifras[0] ? [hi.cifras[0]] : null) || (lo && lo.cifras) || [];
      if (ids.length) {
        tags.sourceTag(ctx, ids, { x: X(L.panelX + 10), y: Y(8), scale: 0.72 * k, scope: true, maxWidth: 300,
          anchor: { x: cx, y: lad.scale(L.max) - 2 } });
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
