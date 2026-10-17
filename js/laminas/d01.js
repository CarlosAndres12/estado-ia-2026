/* js/laminas/d01.js — D1 «Portada» (prompt §12.2; KB §4, "Guion de diapositivas").
 *
 * The hero's iceberg as a still: a night-sea painting on the notebook page, drawn with the same
 * engine figures as the #inicio hero and V01 (fig.marNocturno, fig.iceberg, fig.lamp): a crescent
 * moon and irregular stars; the luminous tip, lit by a tiny AI lamp, carries the figure of
 * rotulos.punta («88% de organizaciones usa IA») with the source tag of its cifras; the submerged
 * mass carries rotulos.masa («Escala · Valor · Gobernanza») in chalk-white lettering.
 *
 * Copy comes only from the deck entry; the figure's tag from env.tags. Static by default; the
 * calm 8 s ambient loop (stars twinkle, letters flow through the lamp) does nothing when s.still.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  // Panel-relative layout (the night painting fills the illustration zone).
  var HORIZON = 0.43;            // waterline, share of the panel height
  var BERG = { x: 0.405, scale: 1.3 };
  // fig.lamp moves its letters 0.09 of a cycle per second: this many seconds close one cycle, so
  // passing loop × LAMP_CYCLE makes the 8 s ambient loop seamless.
  var LAMP_CYCLE = 1 / 0.09;
  // Irregular stars [x, y (share of the panel), size px]; they keep clear of the tip, the lamp,
  // the figure, its tag and the moon.
  var STARS = [[0.05, 0.08, 34], [0.15, 0.22, 26], [0.25, 0.06, 38], [0.09, 0.36, 22], [0.22, 0.34, 28],
    [0.49, 0.06, 18], [0.81, 0.36, 22], [0.95, 0.39, 20], [0.82, 0.07, 22], [0.34, 0.31, 16]];

  function panelOf(z) { return { x: z.x, y: z.y + 6, w: z.w, h: z.h - 14 }; }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The figure of rotulos.punta: its number big, the rest of the sentence under it, both chalk
  // white on the night sky; returns where the tag's thread ties to the label.
  function tipLabel(ctx, env, rot, x, y) {
    var ink = env.ink, m = env.pal.mundo;
    var pv = env.chart.parseValue(rot.text);
    var num = pv && pv.index === 0 ? pv.raw : '';
    var rest = num ? rot.text.slice(num.length).replace(/^\s+/, '') : rot.text;
    var lay = { w: 0, h: 0 };
    if (num) {
      lay = ink.letter(ctx, num, x, y, { size: 66, color: m.lienzo, counters: 0, stars: false, underline: false, seed: 'd01:punta', jitter: 0.6 });
    }
    var ly = y + lay.h - 6;
    var tl = ink.text(ctx, rest, x + 4, ly, { size: 27, weight: 700, color: m.lienzo, maxWidth: 440, maxLines: 2 });
    return { anchor: { x: x + 16, y: ly + tl.h - 2 }, bottom: ly + tl.h, x: x };
  }

  EIA.laminas.d01 = {
    setup: function () { return { stars: STARS }; },

    draw: function (ctx, s, env) {
      var r = panelOf(s.zones.ilustracion), fig = env.fig, ink = env.ink, m = env.pal.mundo;
      var rot = s.lamina.rotulos || {};
      var t = s.still ? 0 : s.loop;
      var k = r.w / 1280, sh = 720 * k;
      var hy = r.y + r.h * HORIZON;                       // waterline on screen
      var sy = Math.min(r.y, Math.max(r.y + r.h - sh, hy - HORIZON * sh));
      var cx = r.x + r.w * BERG.x, bs = BERG.scale;

      ctx.save();
      roundRect(ctx, r.x, r.y, r.w, r.h, 18);
      ctx.clip();
      // Night sea (its own stars and moon are placed by hand below, clear of the copy).
      fig.marNocturno(ctx, r.x, sy, k, { horizon: (hy - sy) / sh, moon: false, stars: 0, seed: 'd01' });
      fig.sign(ctx, 'luna', r.x + r.w * 0.92, r.y + r.h * 0.2, 112, { seed: 'd01-moon' });
      s.state.stars.forEach(function (st, i) {
        var tw = s.still ? 1 : 0.86 + 0.14 * Math.sin(TAU * t * (1 + i % 2) + i * 1.9);
        fig.sign(ctx, 'estrella', r.x + st[0] * r.w, r.y + st[1] * r.h, st[2] * tw,
          { seed: 'd01-star' + i, colors: { a: m.rojo, ink: i % 3 ? m.amarillo : m.lienzo } });
      });
      // The iceberg: luminous tip above the waterline, the whole mass below it.
      ink.glow(ctx, cx + 10 * bs, hy - 70 * bs, 150 * bs, m.amarillo, 0.22);
      fig.iceberg(ctx, cx, hy, bs, { reveal: 1, glow: 1 });
      // The tiny AI lamp that lights the tip.
      fig.lamp(ctx, cx - 48 * bs, hy - 128 * bs, 0.34, { t: t * LAMP_CYCLE, glow: 1 });
      // The submerged mass: a small red sign, and its words in chalk white on a deep ultramarine
      // field (a flat lithograph field inside the outline) so they read from the back of the room.
      ink.blob(ctx, cx + 120 * bs, hy + 180 * bs, 24 * bs, 18 * bs, { fill: m.rojo, w: 3, irr: 0.22, n: 8, seed: 'd01-red' });
      if (rot.masa) {
        ink.blob(ctx, cx + 8 * bs, hy + 81 * bs, 180 * bs, 31 * bs, { fill: m.azul, line: false, irr: 0.08, n: 10, seed: 'd01-field' });
        ink.letter(ctx, rot.masa.text, cx + 8 * bs, hy + 66 * bs, { size: 40, maxWidth: 336 * bs, maxLines: 1, fit: true, minSize: 24,
          align: 'center', color: m.lienzo, counters: 0, stars: false, underline: false, seed: 'd01:masa' });
      }
      // The tip's figure and its source tag.
      if (rot.punta) {
        var lab = tipLabel(ctx, env, rot.punta, r.x + r.w * 0.545, r.y + r.h * 0.025);
        if (rot.punta.cifras && rot.punta.cifras.length) {
          env.tags.sourceTag(ctx, rot.punta.cifras, { x: lab.x + 4, y: lab.bottom + 10, scale: 0.86, anchor: lab.anchor });
        }
      }
      ctx.restore();
      // The painting's brush frame on the notebook page.
      ink.card(ctx, r.x, r.y, r.w, r.h, { fill: false, weight: 5, radius: 18, seed: 'd01-frame' });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
