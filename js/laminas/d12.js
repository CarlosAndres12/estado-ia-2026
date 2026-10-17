/* js/laminas/d12.js — D12 «Medicina: potencia con evidencia desigual» (prompt §12.2; KB §8,
 * "Guion de diapositivas").
 *
 * A tall calligraphic traffic light (the clinical legend of prompt §4.4): lights in fixed positions —
 * top rotulos.luzRoja («Rojo», cross), middle luzAmbar («Ámbar», half disc), bottom luzVerde
 * («Verde», check star) — each with its sign and label. Beside each light, its statements, one per
 * line, each with its own source tag: red rojo1–rojo3 (med-3, med-5, med-6), amber «Sistema
 * multiagente…» (med-2, a laboratory result, so it sits in a small ruled navy panel, its tag on the
 * cream page), green «Notas clínicas…» (med-1). The «2,4%» line is on its own and its tag shows the
 * scope («Sobre 1.016 autorizaciones hasta diciembre de 2024, no sobre los 258 de 2025»), so it never
 * reads as a share of the 258. The frame already carries a color legend (the lights), so every
 * evidence chip is in its monochrome form. Each light's block is centered on its light; the lights
 * keep equal spacing.
 *
 * The diagram «Antes de escalar» (Validación externa → Seguimiento posdespliegue → Responsabilidad
 * clínica) is drawn here as a vertical path in the right column, with its title, so the light can
 * stand the full height (layout: drawDiagram false).
 *
 * Copy comes only from the deck entry. Static.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var LIGHT = { cx: 104, R: 27, pad: 14, body: 80 };    // the traffic light (screen px)
  var COL = { bracket: 234, text: 252, textW: 458, size: 19, tag: 728, tagScale: 0.7, panel: 6 };
  var FLOW = { x: 990, w: 234, title: 24, card: 64, arrow: 30, size: 18 };
  var GAP = { row: 8, block: 8 };
  // Rótulos whose tag must show the figure's scope (prompt §12.2: the 2,4% is not a share of the 258).
  var SCOPED = { rojo3: true };
  // Rótulos that report a laboratory result (controlled conditions: a ruled navy panel).
  var LAB = { ambar: true };

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return v === pts[i]; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  // The three blocks in the legend's fixed order (top → bottom), with their rótulos.
  function blocksOf(env, rot) {
    var keys = { rojo: ['rojo1', 'rojo2', 'rojo3'], ambar: ['ambar'], verde: ['verde'] };
    var labels = { rojo: 'luzRoja', ambar: 'luzAmbar', verde: 'luzVerde' };
    return env.pal.legend.semaforo.slice().sort(function (a, b) { return a.pos - b.pos; }).map(function (lt) {
      return { light: lt, label: rot[labels[lt.key]], rows: keys[lt.key].filter(function (k) { return rot[k]; }).map(function (k) { return { key: k, r: rot[k] }; }) };
    });
  }

  function tagOpts(row) {
    return SCOPED[row.key] ? { scale: 0.8, scope: true, mono: true } : { scale: COL.tagScale, scope: false, mono: true };
  }

  // Measures every row (text and tag) and stacks the blocks so each is centered on its light and
  // the lights keep equal spacing.
  function layoutBlocks(ctx, env, blocks, top) {
    var to = { size: COL.size, maxWidth: COL.textW, lineHeight: 1.22 };
    blocks.forEach(function (b) {
      b.h = 0;
      b.rows.forEach(function (row, i) {
        row.text = env.ink.measureText(ctx, row.r.text, to);
        row.lab = !!LAB[row.key];
        var th = row.text.h + (row.lab ? 2 * COL.panel : 0), tg = row.r.cifras && row.r.cifras.length ? env.tags.measureTag(ctx, row.r.cifras, tagOpts(row)) : { w: 0, h: 0 };
        row.tagH = tg.h;
        row.h = Math.max(th, tg.h);
        b.h += row.h + (i ? GAP.row : 0);
      });
    });
    var S = 0;
    for (var i = 0; i + 1 < blocks.length; i++) S = Math.max(S, (blocks[i].h + blocks[i + 1].h) / 2 + GAP.block);
    blocks.forEach(function (b, j) { b.cy = top + blocks[0].h / 2 + j * S; b.y = b.cy - b.h / 2; });
    return S;
  }

  function drawLight(ctx, env, blocks, ground) {
    var ink = env.ink, fig = env.fig, m = env.pal.mundo, R = LIGHT.R, cx = LIGHT.cx;
    var top = blocks[0].cy - R - LIGHT.pad, bot = blocks[blocks.length - 1].cy + R + LIGHT.pad;
    // The post down to the ground and a small foot, then the tall body.
    ink.line(ctx, stable(env, 'post', [cx, bot - 4, cx - 2, (bot + ground) / 2, cx, ground - 4]), { w: 8, profile: 'blunt', seed: 'd12-post' });
    ink.line(ctx, stable(env, 'foot', [cx - 34, ground, cx, ground + 2, cx + 34, ground - 1]), { w: 5, profile: 'blunt', seed: 'd12-foot' });
    ink.card(ctx, cx - LIGHT.body / 2, top, LIGHT.body, bot - top, { seed: 'd12-body', weight: 4.4, radius: R + 8, fill: m.tinta });
    blocks.forEach(function (b) {
      var lt = b.light;
      ink.glow(ctx, cx, b.cy, R * 1.9, lt.color, 0.35);
      ink.circle(ctx, cx, b.cy, R, { fill: lt.color, line: false, seed: 'd12-luz' + lt.key });
      fig.sign(ctx, lt.sign, cx, b.cy, R * 1.25, { seed: 'd12-luz', mono: true });
      if (b.label) {
        var lo = { size: 20, weight: 700 }, lay = ink.measureText(ctx, b.label.text, lo);
        ink.text(ctx, b.label.text, cx + LIGHT.body / 2 + 10, b.cy - lay.h / 2 + 1, lo);
      }
    });
  }

  // One block: a calligraphic bracket spanning its lines, then each line with its tag.
  function drawBlock(ctx, env, b, idx) {
    var ink = env.ink, m = env.pal.mundo, q = env.pal.maquina, tags = env.tags;
    var x = COL.bracket, y0 = b.y + 2, y1 = b.y + b.h - 2;
    ink.line(ctx, stable(env, 'bracket' + idx, [x + 8, y0, x, y0 + 6, x - 1, (y0 + y1) / 2, x, y1 - 6, x + 8, y1]), { w: 3, profile: 'swell', seed: 'd12-br' + idx });
    var y = b.y;
    b.rows.forEach(function (row) {
      var th = row.text.h + (row.lab ? 2 * COL.panel : 0), ty = y + (row.h - th) / 2 + (row.lab ? COL.panel : 0);
      var color = m.tinta, endX;
      if (row.lab) {
        // A laboratory result: the line sits in a small ruled navy panel (controlled conditions).
        env.fig.panel(ctx, COL.text - 10, ty - COL.panel, row.text.w + 20, row.text.h + 2 * COL.panel, { cell: 10, construction: false });
        color = m.lienzo;
        endX = COL.text + row.text.w + 14;
      }
      ink.text(ctx, row.r.text, COL.text, ty, { size: COL.size, maxWidth: COL.textW, lineHeight: 1.22, color: color });
      if (!row.lab) {
        ctx.save();
        ctx.font = row.text.font;
        endX = COL.text + ctx.measureText(row.text.lines[row.text.lines.length - 1]).width + 6;
        ctx.restore();
      }
      var endY = ty + (row.text.lines.length - 1) * row.text.lineH + row.text.size * 0.62;
      if (row.lab) endY = ty + row.text.h / 2;
      if (row.r.cifras && row.r.cifras.length) {
        var o = tagOpts(row), mt = tags.measureTag(ctx, row.r.cifras, o);
        tags.sourceTag(ctx, row.r.cifras, { x: COL.tag, y: y + (row.h - mt.h) / 2, scale: o.scale, scope: o.scope, mono: o.mono,
          anchor: { x: endX, y: endY } });
      }
      y += row.h + GAP.row;
    });
  }

  // «Antes de escalar»: its title, then the items as cards joined by downward arrows.
  function drawFlow(ctx, env, d, bottom) {
    var ink = env.ink, items = (d && d.items) || [], n = items.length;
    if (!n) return;
    var h = FLOW.title + 10 + n * FLOW.card + (n - 1) * FLOW.arrow, y = bottom - h;
    if (d.titulo) ink.text(ctx, d.titulo, FLOW.x, y, { size: 23, weight: 700, font: 'display', maxWidth: FLOW.w });
    y += FLOW.title + 10;
    items.forEach(function (it, i) {
      ink.card(ctx, FLOW.x, y, FLOW.w, FLOW.card, { seed: 'd12-flow' + i, weight: 3.2, radius: 12 });
      var o = { size: FLOW.size, weight: 700, align: 'center', maxWidth: FLOW.w - 24, lineHeight: 1.16, fit: true, minSize: 13, maxHeight: FLOW.card - 12 };
      var lay = ink.measureText(ctx, it.text, o);
      ink.text(ctx, it.text, FLOW.x + FLOW.w / 2, y + (FLOW.card - lay.h) / 2, o);
      if (i < n - 1) {
        var ax = FLOW.x + FLOW.w / 2, a0 = y + FLOW.card + 4, a1 = y + FLOW.card + FLOW.arrow - 4;
        ink.arrow(ctx, stable(env, 'flow' + i, [ax, a0, ax + 2, (a0 + a1) / 2, ax, a1]), { w: 3.2, headSize: 10, seed: 'd12-fa' + i });
      }
      y += FLOW.card + FLOW.arrow;
    });
  }

  EIA.laminas.d12 = {
    layout: { drawDiagram: false },

    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, rot = s.lamina.rotulos || {};
      var ground = s.zones.idea ? s.zones.idea.y - 18 : z.y + z.h;
      var blocks = blocksOf(env, rot);
      layoutBlocks(ctx, env, blocks, z.y + 2);
      drawLight(ctx, env, blocks, ground);
      blocks.forEach(function (b, i) { drawBlock(ctx, env, b, i); });
      drawFlow(ctx, env, s.lamina.diagrama, ground + 4);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
