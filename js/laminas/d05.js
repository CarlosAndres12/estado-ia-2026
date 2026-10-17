/* js/laminas/d05.js — D5 «Convergencia de modelos, concentración de poder» (prompt §12.2; KB §5).
 *
 * The KB's "pelotón de ciclistas" is lamps: datos.lamparas.valor identical lamps on thin ruled
 * wheels (fig.lampOnWheels) packed near the top of a ruled hill on a navy panel (a preference
 * ranking is the machine's controlled world), each with a plain pennant in a different pattern of
 * the legend — no names, flags or logos — and the tag of the cited convergence (datos.lamparas.cifras).
 * The diagram (tipo «barras», which the engine's generic drawers do not cover) is drawn here:
 * «Modelos notables 2025» as horizontal gouache bars on ONE zero-based scale, so «EE. UU. 59» and
 * «China 35» are exactly proportional (values parsed from the item texts), with the cap-10 tag.
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the wheels turn
 * and the pennants flutter (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  // fig.lampOnWheels turns its wheels at 2.2 rad/s (three spokes: period π/3) and flutters the
  // pennant at 3 rad/s: 10π/3 s of its time closes both cycles, so loop × T_LOOP is seamless.
  var T_LOOP = 10 * Math.PI / 3;
  var HILL = { cx: 0.56, top: 0.62, half: 0.58, sag: 0.5 };   // shares of the panel
  var RIDERS = { scale: 0.9, gap: 70 };

  // The hill: a perfect circular arc (ruled), so the machine's world stays regular.
  function hillGeom(P) {
    var cx = P.x + P.w * HILL.cx, top = P.y + P.h * HILL.top, half = P.w * HILL.half, sag = P.h * HILL.sag;
    var R = (half * half + sag * sag) / (2 * sag);
    return { cx: cx, top: top, R: R, cy: top + R, y: function (x) { var dx = x - cx; return top + R - Math.sqrt(Math.max(0, R * R - dx * dx)); } };
  }

  function drawHill(ctx, env, P, g) {
    var q = env.pal.maquina;
    ctx.save();
    ctx.beginPath();
    ctx.rect(P.x, P.y, P.w, P.h);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.R, 0, Math.PI * 2);
    ctx.fillStyle = env.pal.mix(q.noche, q.rejilla, 0.75);
    ctx.fill();
    ctx.strokeStyle = q.linea;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Two ruled contour arcs under the crest.
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    [26, 56].forEach(function (d) { ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R - d, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); });
    ctx.restore();
  }

  // «Modelos notables 2025»: title, then one bar per item on a shared zero-based scale.
  function drawBars(ctx, env, d, r) {
    var ink = env.ink, chart = env.chart, m = env.pal.mundo;
    var items = (d.items || []).map(function (it) {
      var pv = chart.parseValue(it.text);
      return { it: it, value: pv ? pv.value : it.valor, raw: pv ? pv.raw : String(it.valor), label: it.etiqueta || it.text };
    });
    if (!items.length) return;
    var th = d.titulo ? ink.text(ctx, d.titulo, r.x, r.y + 2, { size: 21, weight: 700 }).h : 0;
    var labelW = 0;
    items.forEach(function (b) { labelW = Math.max(labelW, ink.measureText(ctx, b.label, { size: 21, weight: 700 }).w); });
    var ids = [];
    items.forEach(function (b) { (b.it.cifras || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    var tagO = { scale: 0.8, scope: true }, tm = ids.length ? env.tags.measureTag(ctx, ids, tagO) : { w: 0, h: 0 };
    var x0 = r.x + labelW + 16, valueW = 52, len = r.x + r.w - x0 - valueW - (tm.w ? tm.w + 24 : 0);
    var max = Math.max.apply(null, items.map(function (b) { return b.value; }));
    var sc = chart.scale(max, x0, len), h = 32, gap = 12, y0 = r.y + th + 10;
    chart.baseline(ctx, sc(0), y0 - 6, y0 + items.length * (h + gap) - gap + 6, {});
    var ends = [];
    items.forEach(function (b, i) {
      var y = y0 + i * (h + gap);
      chart.bar(ctx, { value: b.value, cap: 'exact', scale: sc, y: y, h: h, color: m.azul, labels: false, seed: 'd05-bar' + i });
      ink.text(ctx, b.label, x0 - 12, y + h / 2 - 13, { size: 21, weight: 700, align: 'right' });
      var vl = ink.text(ctx, b.raw, sc(b.value) + 10, y + h / 2 - 13, { size: 21, weight: 700 });
      ends.push({ x: sc(b.value) + 10 + vl.w, y: y + h / 2 });
    });
    if (ids.length) {
      var ty = y0 + (items.length * (h + gap) - gap) / 2 - tm.h / 2;
      env.tags.sourceTag(ctx, ids, { x: r.x + r.w - tm.w, y: ty, scale: tagO.scale, scope: tagO.scope, anchor: { x: ends[0].x + 4, y: ends[0].y } });
    }
  }

  EIA.laminas.d05 = {
    layout: { drawDiagram: false },

    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, fig = env.fig, e = s.lamina, t = s.still ? 0 : s.loop * T_LOOP;
      var P = { x: z.x, y: z.y + 4, w: z.w, h: z.h - 8 };
      fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 14, construction: false });
      var g = hillGeom(P);
      drawHill(ctx, env, P, g);

      // The peloton: identical lamps packed near the crest, each pennant with its own pattern.
      var lamps = (e.datos && e.datos.lamparas) || null, n = lamps ? lamps.valor : 0, pats = env.pal.legend.patterns;
      var sc = RIDERS.scale, gap = RIDERS.gap, xs = [];
      for (var i = 0; i < n; i++) xs.push(g.cx + (i - (n - 1) / 2) * gap);
      // Back to front: the riders lower on the slopes first, the ones on the crest last.
      var order = xs.map(function (x, j) { return j; }).sort(function (a, b) { return Math.abs(xs[b] - g.cx) - Math.abs(xs[a] - g.cx); });
      order.forEach(function (j) {
        fig.lampOnWheels(ctx, xs[j], g.y(xs[j]) + 1, sc, { pattern: pats[j % pats.length], t: t });
      });
      if (lamps && lamps.cifras && lamps.cifras.length && n) {
        env.tags.sourceTag(ctx, lamps.cifras, { x: P.x + 16, y: P.y + 16, scale: 0.74, scope: true,
          anchor: { x: xs[0] - 40 * sc, y: g.y(xs[0]) - 104 * sc } });
      }

      // The diagram: proportional bars.
      if (e.diagrama && s.zones.diagrama) drawBars(ctx, env, e.diagrama, s.zones.diagrama);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
