/* js/laminas/d15.js — D15 «América Latina y Colombia: consumo rápido, capacidad por construir»
 * (prompt §12.2; KB §10, "Guion de diapositivas").
 *
 * The KB metaphor: a suspension bridge (fig.suspensionBridge) between the bank rotulos.orillaUso
 * («Uso»), lit — the small ruled lamp (the AI) shines over it — and the bank
 * rotulos.orillaCapacidad («Capacidad propia»), still under construction: the deck stops short over
 * the water, its hangers loose, one warm worker fixes the last plank at the deck's end and another
 * carries a plank along the far bank, where more planks wait. Each bank's name is brush-lettered
 * above it. The scene encodes no value.
 *
 * The big figures (alc-1 «14% vs 11%», alc-3 «55,84», alc-4 «479.273» with «106 acciones», the
 * exact figures of KB §14) and the flujo «Adoptante → Cómputo, datos y talento → Soberanía» are
 * drawn by the engine from the deck entry (Colombia is «adoptante»: the deck never says otherwise).
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop letters flow
 * through the lamp and a bird glides over the bridge (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  // fig.lamp moves its letters 0.09 of a cycle per second: loop × LAMP_CYCLE closes the cycle in 8 s.
  var LAMP_CYCLE = 1 / 0.09;
  var NOMINAL = { w: 810, h: 283 };                    // the illustration zone this design is drawn for
  var BRIDGE = { x: 360, y: 150, scale: 0.86, built: 0.6 };
  // fig.suspensionBridge local geometry (px at scale 1): banks from ±226 to ±340 at deck level.
  var BANK = { inner: 226, outer: 340 };
  var LABEL = { y: 44, size: 34 };
  var LAMP = { dy: -34, scale: 0.34 };
  var PLANKS = [[628, 145], [634, 137], [630, 129]];       // the planks waiting on the far bank (centers)

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y + (z.h - NOMINAL.h * k) / 2 };
  }

  EIA.laminas.d15 = {
    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var rot = s.lamina.rotulos || {}, u = s.still ? 0 : s.loop;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
      var bk = BRIDGE.scale * k, bx = X(BRIDGE.x), by = Y(BRIDGE.y);
      var leftX = bx - (BANK.inner + BANK.outer) / 2 * bk, rightX = bx + (BANK.inner + BANK.outer) / 2 * bk;

      // The lit bank: a warm glow behind it, under everything else.
      ink.glow(ctx, leftX, by - 6 * k, 150 * k, m.amarillo, 0.55);

      // The bridge, still under construction toward the far bank.
      var br = fig.suspensionBridge(ctx, bx, by, bk, { built: BRIDGE.built, seed: 'd15' });

      // The planks waiting on the far bank, and the two workers.
      PLANKS.forEach(function (p, i) { fig.plank(ctx, X(p[0]), Y(p[1]), 0.36 * k, { seed: 'd15-plank' + i }); });
      var deck = by - 8 * bk;
      fig.person(ctx, br.end.x - 16 * k, deck, 0.62 * k, { role: 'persona', pose: 'tying', facing: 1, seed: 'd15-w1', skin: 4, hair: 'short',
        cloth: m.verde, legs: m.tinta });
      fig.person(ctx, X(584), by, 0.62 * k, { role: 'persona', pose: 'carrying', prop: 'plank', facing: -1, seed: 'd15-w2', skin: 1, hair: 'braids',
        cloth: m.rojo, legs: m.azul });

      // The small ruled lamp (the AI) shining over the bank of use.
      fig.lamp(ctx, leftX, by + LAMP.dy * k, LAMP.scale * k, { t: u * LAMP_CYCLE, glow: 1 });

      // A bird gliding over the bridge, above the sag of its cable (it moves in the ambient loop).
      fig.sign(ctx, 'pajaro', bx + Math.sin(TAU * u) * 22 * k, by - 100 * k + Math.sin(TAU * u * 2) * 5 * k, 38 * k, { seed: 'd15-bird',
        colors: { a: m.amarillo } });

      // Each bank's name, brush-lettered above it: between the zone's edge and the bank's inner edge
      // (clear of the towers and cables), centered on the bank when it fits.
      var innerL = bx - BANK.inner * bk, innerR = bx + BANK.inner * bk;
      [[rot.orillaUso, leftX, z.x + 4, innerL, 'd15-uso'], [rot.orillaCapacidad, rightX, innerR, z.x + z.w - 4, 'd15-capacidad']].forEach(function (lb) {
        if (!lb[0]) return;
        var o = { size: LABEL.size * k, maxWidth: lb[3] - lb[2], maxLines: 1, fit: true, minSize: 20, underline: false, stars: false, counters: 0, seed: lb[4] };
        var w = ink.measureLetter(ctx, lb[0].text, o).w, cx = Math.max(lb[2] + w / 2, Math.min(lb[3] - w / 2, lb[1]));
        o.align = 'center';
        ink.letter(ctx, lb[0].text, cx, Y(LABEL.y), o);
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
