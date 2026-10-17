/* js/laminas/d03.js — D3 «La frontera irregular» (prompt §12.2; KB §5, "Guion de diapositivas").
 *
 * A cordillera of flat biomorphic mountains drawn straight on the notebook page: two peaks lit in
 * yellow carry rotulos.pico1 / pico2 («Ciencia de nivel doctoral», «Matemáticas de competición»)
 * and share the tag of cap-3 (estado «Con matiz»); two deep ultramarine valleys carry
 * rotulos.valle1 / valle2 with the tags of cap-5 and cap-6; a small warm climber crosses the
 * frontier on a rope from the first lit summit. The three-step diagram (pasos) runs along the
 * bottom, drawn by the engine in a slightly lower band so the mountains get more height.
 *
 * Mountain heights and valley depths encode no value: the two lit peaks and the two valleys are
 * drawn alike so no one reads one figure against the other. Copy comes only from the deck entry.
 * Static by default; in the 8 s ambient loop a bird glides over the range (nothing when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 1168, h: 336 };
  var BASE = 322;                                      // the ground line, zone-local px
  // Mountains (zone-local px): summit x and height, feet l / r; lit peaks carry a yellow cap.
  var MOUNTS = [
    { x: 92, top: 206, l: 0, r: 200, color: 'siena' },
    { x: 300, top: 74, l: 128, r: 474, color: 'tierra', lit: true, rot: 'pico1' },
    { x: 796, top: 60, l: 626, r: 964, color: 'verde', lit: true, rot: 'pico2' },
    { x: 1114, top: 118, l: 1038, r: 1168, color: 'verdeClaro' }
  ];
  // Deep valleys between two mountains (indices) from the level `top` down to the ground.
  // tag: where its source tag hangs ('in' the dark field under the label, or 'sky' above the valley).
  var VALLEYS = [{ a: 1, b: 2, top: 150, rot: 'valle1', tag: 'in' }, { a: 2, b: 3, top: 152, rot: 'valle2', tag: 'sky' }];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function slopeX(m, side, y) { return lerp(m.x, side < 0 ? m.l : m.r, (y - m.top) / (BASE - m.top)); }

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

  function buildValleys(env) {
    var b = env.ink.drawing('d03:valleys', { w: 4, jitter: 0.6 }), m = env.pal.mundo;
    var night = env.pal.mix(m.azul, m.tinta, 0.35);
    VALLEYS.forEach(function (v, i) {
      var A = MOUNTS[v.a], B = MOUNTS[v.b], x0 = slopeX(A, 1, v.top) - 6, x1 = slopeX(B, -1, v.top) + 6;
      var pts = [], n = 8;
      // An irregular top edge that sags a little between the two slopes, then down under both feet.
      for (var j = 0; j <= n; j++) {
        var u = j / n;
        pts.push(lerp(x0, x1, u), v.top + Math.sin(u * Math.PI) * 12 + (j % 2 ? 3 : -2) + (i ? 1 : 0));
      }
      pts.push(slopeX(B, -1, BASE) + 16, BASE + 2, slopeX(A, 1, BASE) - 16, BASE + 2);
      b.shape(pts, { fill: night, line: false, poly: true });
    });
    return b.done();
  }

  function buildRange(env) {
    var b = env.ink.drawing('d03:range', { w: 4.6, jitter: 1 }), m = env.pal.mundo;
    var cols = { siena: m.siena, tierra: m.tierra, verde: m.verde, verdeClaro: env.pal.mix(m.verde, m.amarillo, 0.3) };
    MOUNTS.forEach(function (mt) {
      var hL = mt.x - mt.l, hR = mt.r - mt.x, H = BASE - mt.top;
      // Feet flare a little; the bottom edge runs along the ground line (no belly under it).
      b.shape([mt.l, BASE, mt.l + hL * 0.14, BASE - H * 0.1, mt.l + hL * 0.45 - 6, BASE - H * 0.5, mt.x - 14, mt.top + 10, mt.x + 4, mt.top,
        mt.x + 16, mt.top + 12, mt.r - hR * 0.5 + 6, BASE - H * 0.52, mt.r - hR * 0.14, BASE - H * 0.1, mt.r, BASE,
        lerp(mt.r, mt.l, 0.34), BASE + 1, lerp(mt.r, mt.l, 0.67), BASE + 1], { fill: cols[mt.color], w: 4.6 });
      if (mt.lit) {
        var cy = mt.top + H * 0.34;
        b.shape([slopeX(mt, -1, cy) + 12, cy, mt.x - 12, mt.top + 9, mt.x + 4, mt.top + 3, slopeX(mt, 1, cy) - 12, cy - 6, mt.x + 4, cy + 16],
          { fill: m.amarillo, w: 3.6 });
      }
    });
    b.stroke([-8, BASE, 400, BASE + 2, 800, BASE - 1, 1176, BASE + 1], { w: 5, profile: 'blunt' });
    return b.done();
  }

  // A label centered at (x, y) (top), tinta on the page or chalk white in a valley; returns its box.
  function label(ctx, env, text, x, y, o) {
    var ink = env.ink, size = o.size, mw = o.maxWidth;
    var lay = ink.measureText(ctx, text, { size: size, weight: 700, maxWidth: mw, lineHeight: 1.16 });
    ink.text(ctx, text, x, y, { size: size, weight: 700, maxWidth: mw, lineHeight: 1.16, align: 'center', color: o.color });
    return { x: x - lay.w / 2, y: y, w: lay.w, h: lay.h };
  }

  EIA.laminas.d03 = {
    // The pasos band sits a little lower and thinner than the default, so the range gets 336 px.
    layout: {
      diagrama: { x: 56, y: 474, w: 1168, h: 116 },
      ilustracion: { x: 56, y: 126, w: 1168, h: 336 }
    },

    setup: function (env) {
      return { valleys: buildValleys(env), range: buildRange(env) };
    },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, ink = env.ink, fig = env.fig, m = env.pal.mundo, tags = env.tags;
      var rot = s.lamina.rotulos || {};
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      ink.draw(ctx, s.state.valleys, f.x, f.y, k);
      ink.draw(ctx, s.state.range, f.x, f.y, k, { offset: 3 });

      // The climber on the second lit peak, roped back to the first summit across the valley.
      var p1 = MOUNTS[1], p2 = MOUNTS[2], cyF = 168, cxF = slopeX(p2, -1, cyF) + 14;
      var climber = fig.person(ctx, X(cxF), Y(cyF), 0.6 * k, { role: 'persona', pose: 'walking', facing: 1, seed: 'd03-climber',
        skin: 3, cloth: m.rojo, legs: m.azul, hair: 'curly' });
      var hand = climber.hand.left;
      ink.line(ctx, stable(env, 'rope', [X(p1.x + 8), Y(p1.top + 6), X((p1.x + cxF) / 2), Y(140), hand.x, hand.y]), { w: 2.8 * k, profile: 'even', seed: 'd03-rope' });
      ink.circle(ctx, X(p1.x + 8), Y(p1.top + 6), 5 * k, { fill: m.tinta, line: false, seed: 'd03-anchor' });

      // A bird gliding over the range (ambient only).
      var u = s.still ? 0 : s.loop;
      fig.sign(ctx, 'pajaro', X(120 + Math.sin(TAU * u) * 22), Y(110 + Math.sin(TAU * u * 2) * 6), 54 * k, { seed: 'd03-bird' });

      // Lit peaks: labels above the summits and one cap-3 tag between them, threaded to both.
      var peakIds = (rot.pico1 && rot.pico1.cifras) || (rot.pico2 && rot.pico2.cifras) || [];
      var lo = { size: 21 * k, maxWidth: 340 * k };
      var la = rot.pico1 ? label(ctx, env, rot.pico1.text, X(p1.x), Y(p1.top - 44), lo) : null;
      var tagO = { scale: 0.78 * k, scope: true }, mt = peakIds.length ? tags.measureTag(ctx, peakIds, tagO) : { w: 0, h: 0 };
      var tx = la ? la.x + la.w + 22 * k : X(470);
      var lbw = rot.pico2 ? ink.measureText(ctx, rot.pico2.text, { size: lo.size, weight: 700, maxWidth: lo.maxWidth, lineHeight: 1.16 }).w : 0;
      var lb = rot.pico2 ? label(ctx, env, rot.pico2.text, Math.max(X(p2.x + 20), tx + mt.w + 22 * k + lbw / 2), Y(p2.top - 46), lo) : null;
      if (la && lb && peakIds.length) {
        var tg = tags.sourceTag(ctx, peakIds, { x: tx, y: Y(-4), scale: tagO.scale, scope: tagO.scope, anchor: { x: la.x + la.w + 3, y: la.y + la.h * 0.6 } });
        if (tg) ink.line(ctx, stable(env, 'thread2', [tg.x + tg.w - 3, tg.y + tg.h * 0.6, (tg.x + tg.w + lb.x) / 2, tg.y + tg.h * 0.8, lb.x - 3, lb.y + lb.h * 0.6]),
          { w: 2 * k, profile: 'hair', seed: 'd03-thread2', dot: 1.6 });
      }

      // Deep valleys: the label in chalk white inside the dark field, its tag hanging under it.
      VALLEYS.forEach(function (v, i) {
        var r = rot[v.rot];
        if (!r) return;
        var A = MOUNTS[v.a], B = MOUNTS[v.b], ty = v.top + 22;
        var cx = (slopeX(A, 1, ty + 30) + slopeX(B, -1, ty + 30)) / 2;
        var w = slopeX(B, -1, ty + 40) - slopeX(A, 1, ty + 40) - 26;
        var lb2 = label(ctx, env, r.text, X(cx), Y(ty), { size: 19 * k, maxWidth: Math.min(300, w) * k, color: m.lienzo });
        if (r.cifras && r.cifras.length) {
          var vo = { scale: 0.72 * k, scope: 'auto' }, vm = tags.measureTag(ctx, r.cifras, vo);
          vo.x = X(cx) - vm.w / 2 + 10 * k;
          if (v.tag === 'sky') { vo.x -= 36 * k; vo.y = Y(v.top) - vm.h - 20 * k; vo.anchor = { x: lb2.x + 12 * k, y: lb2.y + 4 * k }; }
          else { vo.y = lb2.y + lb2.h + 12 * k; vo.anchor = { x: X(cx) - lb2.w * 0.25, y: lb2.y + lb2.h - 2 }; }
          tags.sourceTag(ctx, r.cifras, vo);
        }
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
