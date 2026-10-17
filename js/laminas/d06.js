/* js/laminas/d06.js — D6 «Capital e infraestructura» (prompt §12.2; KB §6, "Guion de diapositivas").
 *
 * A river of luminous gold coins winds down a warm valley into a reservoir held by a dam with a
 * single sluice gate; through that one gate a thin channel runs to a ruled server tower
 * (fig.serverTower), and a hand-drawn energy meter wired to the tower reads rotulos.medidor
 * («29,6 GW») with the tag of its cifras. The meter is a register (the reading is written in its
 * window): no dial, so no invented scale or maximum is implied. The flujo diagram
 * (Capital → Cómputo → Modelos → Productos), the big figures (eco-1, eco-3, eco-4) and the Idea
 * central (eco-6) are drawn by the engine. Coins carry no count: they are the metaphor, not data.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the coins drift
 * down the river and the meter's disc turns (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 810, h: 318 };
  var GROUND = 298;                                    // zone-local ground line
  var RIVER = [-6, 40, 70, 52, 132, 92, 118, 146, 160, 190, 232, 214];   // center line, into the reservoir
  var RIVER_W = 13;                                    // half width
  var POOL = { cx: 330, cy: 240, rx: 128, ry: 52 };
  var DAM = { x0: 452, x1: 492, top: 150 };
  var GATE = { x0: 458, x1: 486, y0: 232, y1: 276 };
  var TOWER = { x: 566, scale: 0.68 };
  var METER = { x: 628, y: 24, w: 150, h: 104 };
  var COINS = 7;
  var POOL_COINS = [[286, 236], [338, 258], [372, 226], [316, 214], [244, 252]];

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

  // Smoothed river center line with cumulative lengths (for coins at even spacing) and its banks.
  function riverGeom(env) {
    var sp = env.ink.smoothPath(RIVER, false, 4), L = [0], i;
    for (i = 1; i < sp.n; i++) L.push(L[i - 1] + Math.hypot(sp.x[i] - sp.x[i - 1], sp.y[i] - sp.y[i - 1]));
    var left = [], right = [];
    for (i = 0; i < sp.n; i += 3) {
      var a = Math.max(0, i - 1), b = Math.min(sp.n - 1, i + 1);
      var dx = sp.x[b] - sp.x[a], dy = sp.y[b] - sp.y[a], d = Math.hypot(dx, dy) || 1;
      var w = RIVER_W * (1 + 0.25 * i / sp.n);          // a little wider toward the mouth
      left.push(sp.x[i] - dy / d * w, sp.y[i] + dx / d * w);
      right.unshift(sp.x[i] + dy / d * w, sp.y[i] - dx / d * w);
    }
    var band = left.concat(right.reduce(function (acc, v, j, arr) { if (j % 2 === 0) acc.push(arr[j], arr[j + 1]); return acc; }, []));
    return { path: sp, L: L, total: L[L.length - 1], band: band };
  }

  function riverAt(g, u) {
    var target = u * g.total, lo = 0, hi = g.L.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (g.L[mid] <= target) lo = mid; else hi = mid - 1; }
    return { x: g.path.x[lo], y: g.path.y[lo] };
  }

  function buildValley(env, rg) {
    var b = env.ink.drawing('d06:valley', { w: 4.2, jitter: 0.8 }), m = env.pal.mundo, pal = env.pal;
    // Two warm hills behind the reservoir.
    b.shape([-10, GROUND, 40, 150, 130, 96, 230, 120, 300, 190, 340, GROUND], { fill: m.verde, w: 4.4 });
    b.shape([200, GROUND, 290, 168, 400, 128, 500, 170, 560, GROUND], { fill: pal.mix(m.verde, m.amarillo, 0.35), w: 4.2 });
    // The river and the reservoir.
    b.shape(rg.band, { fill: m.celeste, w: 3.4 });
    b.blob(POOL.cx, POOL.cy, POOL.rx, POOL.ry, { fill: m.celeste, w: 4.2, irr: 0.07, n: 12 });
    b.stroke(env.ink.wavePoints(POOL.cx - 80, POOL.cy + 18, POOL.cx + 40, 3, 46, 0.6), { w: 2.2, profile: 'hair', color: m.lienzo });
    // The dam with its single sluice gate, and the channel that leaves through it.
    b.shape([DAM.x0, DAM.top, DAM.x1, DAM.top - 4, DAM.x1 + 4, GROUND, DAM.x0 - 6, GROUND], { fill: m.lienzoOcre, w: 4.4 });
    b.shape([GATE.x0, GATE.y0, GATE.x1, GATE.y0, GATE.x1, GATE.y1, GATE.x0, GATE.y1], { fill: m.madera, w: 3.4 });
    b.stroke([GATE.x0 + 4, GATE.y0 + 15, GATE.x1 - 4, GATE.y0 + 15], { w: 2, profile: 'even', color: m.lienzo });
    b.stroke([(GATE.x0 + GATE.x1) / 2, GATE.y0, (GATE.x0 + GATE.x1) / 2 + 1, DAM.top - 18], { w: 3.4, profile: 'blunt' });
    b.circle((GATE.x0 + GATE.x1) / 2, DAM.top - 22, 6, { fill: m.rojo, w: 2.4 });
    b.shape([DAM.x1 + 2, GATE.y1 - 14, TOWER.x - 40, GATE.y1 - 6, TOWER.x - 40, GATE.y1 + 4, DAM.x1 + 2, GATE.y1 + 2], { fill: m.celeste, w: 2.6 });
    b.stroke([-8, GROUND, 300, GROUND + 2, 620, GROUND - 1, 818, GROUND + 1], { w: 5, profile: 'blunt' });
    return b.done();
  }

  // A luminous coin: gold coin over a soft yellow glow.
  function coin(ctx, env, x, y, sc, alpha, seed) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    env.ink.glow(ctx, x, y, 26 * sc / 0.3, env.pal.mundo.amarillo, 0.75);
    env.fig.coin(ctx, x, y, sc, { seed: seed });
    ctx.restore();
  }

  // The hand-drawn register meter: the reading written in its window, a small turning disc.
  function meter(ctx, env, rot, r, turn) {
    var ink = env.ink, m = env.pal.mundo;
    ink.card(ctx, r.x, r.y, r.w, r.h, { seed: 'd06-meter', weight: 4.2, radius: 14 });
    var win = { x: r.x + 12, y: r.y + 14, w: r.w - 24, h: 44 };
    ink.card(ctx, win.x, win.y, win.w, win.h, { seed: 'd06-window', weight: 2.6, radius: 6, fill: env.pal.mix(m.lienzo, m.lienzoOcre, 0.35) });
    var to = { size: 27, weight: 700, align: 'center', maxWidth: win.w - 12, maxLines: 1, fit: true, minSize: 18 };
    var lay = ink.measureText(ctx, rot.text, to);
    ink.text(ctx, rot.text, win.x + win.w / 2, win.y + (win.h - lay.h) / 2 + 1, to);
    // The disc seen edge-on, with a red mark going round.
    var dcx = r.x + r.w / 2, dcy = r.y + r.h - 24;
    ink.blob(ctx, dcx, dcy, 34, 7, { fill: m.lienzoOcre, w: 2.6, irr: 0.02, n: 14, seed: 'd06-disc' });
    var mx = dcx + Math.sin(turn) * 30, front = Math.cos(turn) > 0;
    if (front) {
      ctx.fillStyle = m.rojo;
      ctx.beginPath();
      ctx.arc(mx, dcy + 2, 3.4, 0, TAU);
      ctx.fill();
    }
    return { x: win.x + win.w / 2 - lay.w / 2, y: win.y + (win.h - lay.h) / 2 + 1, w: lay.w, h: lay.h };
  }

  // A small hand-drawn bolt (energy) on the meter's corner.
  var BOLT = [0, 0, 14, 0, 6, 14, 16, 14, -2, 36, 4, 20, -6, 20];
  function bolt(ctx, env, x, y, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    env.ink.shape(ctx, BOLT, { fill: env.pal.mundo.amarillo, w: 2.6, seed: 'd06-bolt' });
    ctx.restore();
  }

  EIA.laminas.d06 = {
    setup: function (env) {
      var rg = riverGeom(env);
      return { river: rg, valley: buildValley(env, rg) };
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, ink = env.ink, fig = env.fig, m = env.pal.mundo;
      var rot = s.lamina.rotulos || {}, u0 = s.still ? 0 : s.loop;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      fig.sign(ctx, 'sol', X(330), Y(48), 58 * k, { seed: 'd06-sun' });
      ink.draw(ctx, s.state.valley, f.x, f.y, k, { offset: 3 });

      // Coins: a stream down the river (fading in at the source and out at the mouth), a few
      // gleaming in the reservoir, one leaving through the gate.
      for (var i = 0; i < COINS; i++) {
        var u = (i / COINS + u0) % 1, pt = riverAt(s.state.river, u);
        coin(ctx, env, X(pt.x), Y(pt.y), 0.3 * k, Math.min(1, u * 9, (1 - u) * 9), 'd06-c' + i);
      }
      POOL_COINS.forEach(function (c, j) { coin(ctx, env, X(c[0]), Y(c[1]), 0.26 * k, 1, 'd06-p' + j); });
      var gu = (u0 * 2 + 0.5) % 1;
      coin(ctx, env, X(GATE.x1 + 14 + gu * (TOWER.x - 64 - GATE.x1)), Y(GATE.y1 - 4), 0.22 * k, Math.min(1, gu * 6, (1 - gu) * 6), 'd06-g');

      // The ruled server tower, the cable and the hand-drawn meter that reads its energy.
      var tw = fig.serverTower(ctx, X(TOWER.x), Y(GROUND), TOWER.scale * k, {});
      var mr = { x: X(METER.x), y: Y(METER.y), w: METER.w * k, h: METER.h * k };
      // The cable rises from the top of the tower to the meter.
      ink.line(ctx, stable(env, 'cable', [tw.x + tw.w * 0.5, tw.y + 1, tw.x + tw.w * 0.62, tw.y - 26 * k, (tw.x + tw.w + mr.x) / 2, mr.y + mr.h * 0.62,
        mr.x + 2, mr.y + mr.h * 0.5]), { w: 3 * k, profile: 'even', seed: 'd06-cable' });
      if (rot.medidor) {
        var txt = meter(ctx, env, rot.medidor, mr, (s.still ? 0 : s.loop) * TAU * 3);
        bolt(ctx, env, mr.x + mr.w - 16 * k, mr.y - 20 * k, k);
        if (rot.medidor.cifras && rot.medidor.cifras.length) {
          var to = { scale: 0.74 * k, scope: 'auto' }, tm = env.tags.measureTag(ctx, rot.medidor.cifras, to);
          to.x = Math.min(mr.x - 6 * k, z.x + z.w - tm.w - 2);
          to.y = mr.y + mr.h + 14 * k;
          to.anchor = { x: txt.x + 8, y: txt.y + txt.h - 4 };
          env.tags.sourceTag(ctx, rot.medidor.cifras, to);
        }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
