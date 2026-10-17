/* js/laminas/d08.js — D8 «Productividad: real, pero heterogénea» (prompt §12.2; KB §6, "Guion de
 * diapositivas").
 *
 * A balance (fig.balance). On the left pan, three small weights; beside them their rótulos
 * («Soporte al cliente +14–15%», «Software +26%», «Marketing +50%»), each marked by its weight, and
 * one prod-1 tag threaded to the three numbers. On the right pan, an hourglass (fig.hourglass) with
 * rotulos.reloj («Desarrolladores expertos: +19% más tiempo (METR)»), its prod-3 tag and, under the
 * tag, the note rotulos.desactualizado («METR lo marca hoy como desactualizado»).
 * The weights are identical and the beam stays level: the picture encodes no value and does not
 * set the studies against each other (they are different studies, not one scale). The big figures
 * (prod-5 in its corrected form «27,0% vs 8,5%», prod-6) are drawn by the engine.
 *
 * The causal diagram is the engine's own drawer (lamina.diagram), called here so the dotted line
 * between the two effects carries diagrama.enlace («asociación»), which the generic drawer leaves out.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop a thin thread
 * of sand falls in the hourglass (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var NOMINAL = { w: 810, h: 302 };                     // the illustration zone this design is drawn for
  var BAL = { x: 398, foot: 298, scale: 0.78 };        // balance: post x and foot (zone-local px)
  var LIST = { x: 6, y: 8, w: 290, size: 18, gap: 14, icon: 0.6 };
  var RIGHT = { x: 574, y: 8, w: 234, size: 18 };
  var WEIGHTS = ['rojo', 'azul', 'verde'];
  var ROWS = ['soporte', 'software', 'marketing'];

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

  // A small balance weight: a trapezoid body with a ring on top; (0, 0) = middle of its base.
  function buildWeight(env) {
    var b = env.ink.drawing('d08:weight', { w: 3, jitter: 0.4 });
    b.shape([-14, 0, 14, 0, 9, -25, -9, -25], { fill: '@a', w: 3.2 });
    b.circle(0, -31, 6.4, { w: 2.6 });
    return b.done();
  }

  // Where `token` sits in a text block drawn by ink.text(ctx, text, x, y, o): its box on the line
  // that holds it (null when the text does not contain it).
  function tokenAt(ctx, env, text, token, x, y, o) {
    var L = env.ink.measureText(ctx, text, o);
    for (var i = 0; i < L.lines.length; i++) {
      var k = L.lines[i].indexOf(token);
      if (k < 0) continue;
      ctx.save();
      ctx.font = L.font;
      var before = ctx.measureText(L.lines[i].slice(0, k)).width, tw = ctx.measureText(token).width;
      ctx.restore();
      return { x: x + before, y: y + i * L.lineH, w: tw, h: L.size * 1.22, mid: y + i * L.lineH + L.size * 0.62 };
    }
    return null;
  }

  // The number token of a rótulo (its first figure, as written).
  function numberOf(env, text) {
    var pv = env.chart.parseValue(text);
    return pv ? pv.raw : null;
  }

  // The three rótulos of the left pan, one line each, marked by their weights; one prod-1 tag (one
  // bank row) hangs right of the list with a thread from each number (threads reach the hole from
  // its left, clear of the text).
  function drawLeft(ctx, env, s, X, Y, k) {
    var ink = env.ink, m = env.pal.mundo, rot = s.lamina.rotulos || {}, ids = [], marks = [], right = 0;
    var y = Y(LIST.y), tx = X(LIST.x + 32), size = LIST.size * k;
    ROWS.forEach(function (key, i) {
      var r = rot[key];
      if (!r) return;
      var o = { size: size, weight: 700, maxWidth: LIST.w * k, lineHeight: 1.16 };
      var lay = ink.text(ctx, r.text, tx, y, o);
      ink.draw(ctx, s.state.weight, X(LIST.x + 12), y + size * 1.12, LIST.icon * k, { colors: { a: m[WEIGHTS[i]] } });
      var num = numberOf(env, r.text), at = num ? tokenAt(ctx, env, r.text, num, tx, y, o) : null;
      if (at) marks.push({ x: at.x + at.w + 5, y: at.mid });
      right = Math.max(right, tx + lay.w);
      (r.cifras || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      y += lay.h + LIST.gap * k;
    });
    if (!ids.length || !marks.length) return;
    var tg = env.tags.sourceTag(ctx, ids, { x: right + 22 * k, y: Y(LIST.y) - 4 * k, scale: 0.8 * k, scope: 'auto', anchor: marks[0] });
    for (var i = 1; i < marks.length; i++) {
      var a = marks[i], hx = tg.hole.x, hy = tg.hole.y;
      ink.line(ctx, stable(env, 'thread' + i, [a.x, a.y, (a.x + hx) / 2, (a.y + hy) / 2 + 6 * k, hx, hy]), { w: 2 * 0.8 * k, profile: 'hair',
        seed: 'd08-thread' + i, dot: 1.6 });
    }
  }

  // rotulos.reloj beside the hourglass, broken before its number so the prod-3 tag can hang right
  // under the number; the «desactualizado» note under the tag.
  function drawRight(ctx, env, s, X, Y, k) {
    var ink = env.ink, rot = s.lamina.rotulos || {}, r = rot.reloj;
    if (!r) return;
    var o = { size: RIGHT.size * k, weight: 700, maxWidth: RIGHT.w * k, lineHeight: 1.16 };
    var x = X(RIGHT.x), y = Y(RIGHT.y), num = numberOf(env, r.text), cut = num ? r.text.indexOf(num) : -1, anchor = null;
    if (cut > 0) {
      var head = ink.text(ctx, r.text.slice(0, cut).replace(/\s+$/, ''), x, y, o);
      y += head.h + (o.size * 0.16);
      anchor = { x: x + 8 * k, y: y + o.size * 1.1 };
    }
    var tail = ink.text(ctx, cut > 0 ? r.text.slice(cut) : r.text, x, y, o);
    var ty = y + tail.h + 12 * k, tg = null;
    if (r.cifras && r.cifras.length) {
      tg = env.tags.sourceTag(ctx, r.cifras, { x: x + 2, y: ty, scale: 0.8 * k, scope: 'auto', anchor: anchor || { x: x + 8 * k, y: ty - 6 * k } });
    }
    var note = rot.desactualizado;
    if (note) {
      ink.text(ctx, note.text, x + 2, tg ? tg.y + tg.h + 12 * k : ty, { size: 16.5 * k, italic: true, maxWidth: RIGHT.w * k, lineHeight: 1.18 });
    }
  }

  // The causal diagram by the engine's own drawer, plus diagrama.enlace on its dotted line.
  function drawCausal(ctx, env, s, r) {
    var d = s.lamina.diagrama, L = EIA.engine && EIA.engine.lamina;
    if (!d || !L) return;
    L.diagram(ctx, { tipo: d.tipo, titulo: d.titulo, items: d.items }, r, {});
    if (d.enlace && d.items && d.items.length >= 3) {
      var ey = r.y + r.h * 0.72;
      env.ink.text(ctx, d.enlace, r.x + r.w / 2, ey + 9, { size: 20, weight: 700, italic: true, align: 'center' });
    }
  }

  EIA.laminas.d08 = {
    layout: { drawDiagram: false },

    setup: function (env) { return { weight: buildWeight(env) }; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };

      // A soft flat field behind the balance (a lithograph wash, no value).
      ink.blob(ctx, X(BAL.x + 6), Y(180), 170 * k, 112 * k, { fill: env.pal.mix(m.lienzoOcre, m.lienzo, 0.35), line: false, irr: 0.12, n: 10, seed: 'd08-field' });

      // The balance and what sits on its pans: weights left, the hourglass right (drawn first, so
      // the pans hold them).
      var bk = BAL.scale * k, bx = X(BAL.x), by = Y(BAL.foot);
      var pivotY = by - 230 * bk, rim = pivotY + 66 * bk;
      var lx = bx - 140 * bk, rx = bx + 140 * bk;
      [-32, 0, 32].forEach(function (dx, i) {
        ink.draw(ctx, s.state.weight, lx + dx * bk, rim + 4 * bk, 1.12 * bk, { colors: { a: m[WEIGHTS[i]] } });
      });
      var glass = { x: rx, y: rim - 40 * bk };
      fig.hourglass(ctx, glass.x, glass.y, 0.44 * bk, { level: 0.62, seed: 'd08' });
      if (!s.still) {
        // A thin thread of sand in the neck (ambient only).
        var t = s.loop * 8;
        for (var j = 0; j < 3; j++) {
          var u = (t * 1.5 + j / 3) % 1;
          ink.dot(ctx, glass.x, glass.y - 2 * bk + u * 30 * bk, 1.4 * bk, m.amarillo);
        }
      }
      fig.balance(ctx, bx, by, bk, { tilt: 0, seed: 'd08' });

      drawLeft(ctx, env, s, X, Y, k);
      drawRight(ctx, env, s, X, Y, k);
      if (s.zones.diagrama) drawCausal(ctx, env, s, s.zones.diagrama);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
