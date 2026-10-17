/* js/laminas/d09.js — D9 «Trabajo: transformación de tareas, presión en la entrada» (prompt §12.2;
 * KB §7, "Guion de diapositivas").
 *
 * A warm calligraphic career ladder (wooden rails, brush rungs) standing on the notebook page; its
 * first rung dissolves into dots that drift toward the ground, labeled rotulos.peldano («Puestos de
 * entrada»); a young person stands at its foot looking up while someone already holds a higher
 * rung (the pressure is at the entry, not on the whole ladder); a red sun and a small star float
 * nearby. The ladder encodes no value. The diagram «No son lo mismo: Exposición → Automatización
 * → Desplazamiento» is the engine's flujo drawer in a band a little lower than the default, and
 * its title (diagrama.titulo, which the generic drawer leaves out) is lettered above it here. The
 * big figures (trab-1, trab-2 + trab-3, trab-4) are drawn by the engine.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop a few dots of the
 * dissolving rung drift down and fade (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 810, h: 300 };                     // the illustration zone this design is drawn for
  var GROUND = 292;                                     // zone-local ground line
  var LADDER = { x: 330, h: 286, w: 96, top: 74, lean: 0.07, rungs: 6 };
  var PERSON = { x: 228, scale: 1.45 };
  var CLIMBER = { rung: 3, scale: 0.78 };
  var FALL = 5;                                         // drifting dots in the ambient loop

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y };
  }

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return v === pts[i]; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Ladder geometry in local px, foot center at (0, 0), y up is negative.
  function rails() {
    var H = LADDER.h, bw = LADDER.w / 2, tw = LADDER.top / 2, lean = LADDER.lean * H;
    return {
      L: function (y) { return lerp(-bw, -tw + lean, -y / H); },
      R: function (y) { return lerp(bw, tw + lean, -y / H); }
    };
  }
  function rungY(i) { return -LADDER.h * (i + 0.62) / (LADDER.rungs + 0.25); }

  // The ladder: two wooden rails with brush outlines, rungs as thick brush strokes, the first rung
  // a row of dots that thin out and fall away (its position is returned for the label).
  function buildLadder(env) {
    var b = env.ink.drawing('d09:ladder', { w: 4, jitter: 0.8 }), m = env.pal.mundo, g = rails(), H = LADDER.h;
    [['L', -1], ['R', 1]].forEach(function (side) {
      var f = g[side[0]], pts = [];
      for (var j = 0; j <= 6; j++) { var y = -H * j / 6; pts.push(f(y) - 5, y); }
      for (j = 6; j >= 0; j--) { var y2 = -H * j / 6; pts.push(f(y2) + 5, y2); }
      b.shape(pts, { fill: side[1] < 0 ? m.tierra : env.pal.mix(m.tierra, m.siena, 0.4), w: 3.6 });
    });
    for (var i = 1; i < LADDER.rungs; i++) {
      var y = rungY(i);
      b.stroke([g.L(y) + 4, y, (g.L(y) + g.R(y)) / 2, y + b.r.jitter(2), g.R(y) - 4, y + b.r.jitter(1.5)], { w: 6.4, profile: 'blunt' });
    }
    // The first rung dissolves: dots shrink and sag toward the right, a few already fallen.
    var y0 = rungY(0), dots = [];
    for (var k = 0; k < 9; k++) {
      var u = k / 8, x = lerp(g.L(y0) + 6, g.R(y0) - 6, u);
      dots.push([x + b.r.jitter(1.5), y0 + u * u * 16 + b.r.jitter(1.6), lerp(4.6, 1.6, u)]);
    }
    dots.push([g.L(y0) + 34, y0 + 30, 1.8], [g.L(y0) + 58, y0 + 44, 1.5], [g.R(y0) - 12, y0 + 38, 1.3]);
    dots.forEach(function (d) { b.dot(d[0], d[1], d[2]); });
    return { drawing: b.done(), rung: { x: g.R(y0), y: y0, left: g.L(y0) } };
  }

  function buildGround(env) {
    var b = env.ink.drawing('d09:ground', { w: 4.4, jitter: 0.8 });
    b.stroke([10, GROUND, 260, GROUND + 2, 540, GROUND - 1, 800, GROUND + 1], { w: 4.6, profile: 'blunt' });
    return b.done();
  }

  EIA.laminas.d09 = {
    // The flujo band sits a little lower so its title fits above it.
    layout: { diagrama: { x: 414, y: 508, w: 810, h: 104 } },

    setup: function (env) {
      var lad = buildLadder(env);
      return { ladder: lad.drawing, rung: lad.rung, ground: buildGround(env) };
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, dz = s.zones.diagrama, fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var rot = s.lamina.rotulos || {}, d = s.lamina.diagrama;
      var area = { x: z.x, y: z.y, w: z.w, h: (dz ? dz.y - 40 : z.y + z.h) - z.y };
      var f = fitOf(area), k = f.k;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      // Signs over the top of the ladder: a red sun and a small star.
      fig.sign(ctx, 'sol', X(540), Y(48), 70 * k, { seed: 'd09-sun' });
      fig.sign(ctx, 'estrella', X(160), Y(84), 40 * k, { seed: 'd09-star', colors: { a: m.amarillo } });

      ink.draw(ctx, s.state.ground, f.x, f.y, k);
      var lx = X(LADDER.x), ly = Y(GROUND);
      ink.draw(ctx, s.state.ladder, lx, ly, k, { offset: 3 });

      // A few dots of the dissolving rung drift down and fade (ambient only).
      if (!s.still) {
        var rg = s.state.rung;
        for (var i = 0; i < FALL; i++) {
          var u = (s.loop * 2 + i / FALL) % 1;
          var px = lx + (lerp(rg.left, rg.x, (i + 0.5) / FALL) + Math.sin(TAU * (u + i * 0.3)) * 4) * k;
          var py = ly + (rg.y + 10 + u * (-rg.y - 14)) * k;
          ctx.save();
          ctx.globalAlpha *= Math.sin(Math.PI * u) * 0.8;
          ink.dot(ctx, px, py, (1.8 - u * 0.6) * k, m.tinta);
          ctx.restore();
        }
      }

      // Someone already up the ladder, and the young person at its foot, looking up.
      var cy = rungY(CLIMBER.rung), g = rails();
      fig.person(ctx, lx + ((g.L(cy) + g.R(cy)) / 2) * k, ly + cy * k - 2 * k, CLIMBER.scale * k, { role: 'persona', pose: 'carrying',
        facing: 1, seed: 'd09-climber', skin: 1, hair: 'bun', cloth: m.rojo, legs: m.tinta });
      fig.person(ctx, X(PERSON.x), ly, PERSON.scale * k, { role: 'estudiante', pose: 'lookingUp', facing: 1, seed: 'd09-young',
        skin: 3, hair: 'curly', cloth: m.amarillo, legs: m.azul });

      // «Puestos de entrada» beside the dissolving rung, with a short arrow to it.
      if (rot.peldano) {
        var rg2 = s.state.rung, ax = lx + (rg2.x + 14) * k, ay = ly + rg2.y * k;
        var lo = { size: 22 * k, weight: 700, maxWidth: 240 * k };
        var lay = ink.measureText(ctx, rot.peldano.text, lo);
        var tx = ax + 46 * k, ty = ay - lay.h / 2 - 2 * k;
        ink.text(ctx, rot.peldano.text, tx, ty, lo);
        var x0 = tx - 8 * k, x1 = ax + 2 * k;
        ink.arrow(ctx, stable(env, 'arrow', [x0, ay + 1, (x0 + x1) / 2, ay - 3, x1, ay]), { w: 3 * k, headSize: 11 * k, seed: 'd09-arrow' });
      }

      // The diagram's title above its band.
      if (d && d.titulo && dz) {
        ink.text(ctx, d.titulo, dz.x, dz.y - 34, { size: 24, weight: 700, font: 'display' });
      }
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
