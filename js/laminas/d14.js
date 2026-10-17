/* js/laminas/d14.js — D14 «Regulación y gobernanza: del texto a la práctica» (prompt §12.2; KB §9,
 * "Guion de diapositivas").
 *
 * Left: the timeline for general-purpose models, rotulos.lineaTitulo («Línea de tiempo para
 * modelos GPAI»), as a vertical paper strip with one pin per dated rótulo (ago2025, ago2026,
 * ago2027) at a position exactly proportional to its month, read from the rótulo itself («Ago
 * 2025: …»); a rótulo whose date cannot be read gets no pin. The dates are facts of the KB, so the
 * strip carries one ries-3 tag for the group. Under it, the Ómnibus note (rotulos.omnibusTitulo
 * «Nota» and rotulos.omnibus) with its own ries-4 tag (estado «Actualización»: the ribbon). The
 * note is not a pin: it is about the high-risk rules, not about the general-purpose models.
 *
 * Right: the six-step governance cycle (diagrama, ciclo) around a warm steering wheel with a brake
 * disc (fig.steeringWheel): six numbered stations on an ellipse, calligraphic arrows from each to
 * the next and from the last back to the first, labels outside the ring. The engine's ciclo drawer
 * would put the cycle in the bottom band without the wheel, so the module draws it (layout:
 * diagrama false).
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the wheel turns
 * a little left and right (nothing moves when s.still).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 1168, h: 427 };                   // illustration + diagram band, as one picture
  var LINE = { x: 6, y: 50, w: 26, h: 162, pad: 0.2, labelX: 54, labelW: 470, head: 21, size: 19 };
  var DATES = ['ago2025', 'ago2026', 'ago2027'];
  // Tags never wrap their source label: maxWidth leaves room for the longest one.
  var GTAG = { x: 54, gap: 18, scale: 0.86, maxWidth: 380 };
  var NOTE = { x: 18, gap: 16, w: 344, size: 19, tagX: 378, tagScale: 0.8, maxWidth: 340 };
  var WHEEL = { cx: 870, cy: 214, scale: 0.6, rx: 168, ry: 150, st: 19, labelW: 114, size: 19 };
  var MESES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11 };

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

  // The month a rótulo starts with («Ago 2025: …») as a month count (year × 12 + month), or null.
  function monthOf(text) {
    var m = /^\s*([A-Za-zÁÉÍÓÚáéíóú]{3,})\.?\s+(\d{4})/.exec(String(text || ''));
    if (!m) return null;
    var mes = MESES[m[1].slice(0, 3).toLowerCase()];
    return mes == null ? null : Number(m[2]) * 12 + mes;
  }

  // A dated rótulo as a heading (up to its first colon) and the rest.
  function splitHead(text) {
    var i = text.indexOf(':');
    return i > 0 ? { head: text.slice(0, i + 1), rest: text.slice(i + 1).replace(/^\s+/, '') } : { head: text, rest: '' };
  }

  // ---- The GPAI timeline and the Ómnibus note

  function drawTimeline(ctx, env, s, X, Y, k) {
    var ink = env.ink, m = env.pal.mundo, rot = s.lamina.rotulos || {};
    if (rot.lineaTitulo) ink.text(ctx, rot.lineaTitulo.text, X(0), Y(0), { size: 26 * k, weight: 700, font: 'display', maxWidth: 520 * k, maxLines: 1, fit: true, minSize: 18 });
    var pins = DATES.map(function (key) { return rot[key] ? { r: rot[key], month: monthOf(rot[key].text) } : null; })
      .filter(function (p) { return p && p.month != null; });
    if (!pins.length) return null;
    var lo = pins[0].month, hi = pins[pins.length - 1].month, span = Math.max(1, hi - lo);
    var from = lo - span * LINE.pad, to = hi + span * LINE.pad;
    var yOf = function (mo) { return LINE.y + (mo - from) / (to - from) * LINE.h; };
    // The strip, then each pin at its exact month with its rótulo beside it.
    ink.card(ctx, X(LINE.x), Y(LINE.y), LINE.w * k, LINE.h * k, { seed: 'd14-strip', weight: 3, radius: 5 });
    var ids = [];
    pins.forEach(function (p, i) {
      var py = Y(yOf(p.month)), sx = X(LINE.x + LINE.w / 2);
      ink.line(ctx, stable(env, 'pin' + i, [sx + 6 * k, py, X(LINE.labelX - 18), py + 1]), { w: 3 * k, profile: 'blunt', seed: 'd14-pin' + i });
      ctx.fillStyle = m.rojo;
      ctx.beginPath(); ctx.arc(sx, py, 7 * k, 0, TAU); ctx.fill();
      var parts = splitHead(p.r.text), ho = { size: LINE.head * k, weight: 700, font: 'display' }, ro = { size: LINE.size * k, maxWidth: LINE.labelW * k, lineHeight: 1.18 };
      var hl = ink.measureText(ctx, parts.head, ho), rl = parts.rest ? ink.measureText(ctx, parts.rest, ro) : { h: 0 };
      var top = py - (hl.h + rl.h) / 2;
      ink.text(ctx, parts.head, X(LINE.labelX), top, ho);
      if (parts.rest) ink.text(ctx, parts.rest, X(LINE.labelX), top + hl.h, ro);
      (p.r.cifras || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      p.bottom = top + hl.h + rl.h;
    });
    // One tag for the group of dates, hanging from the foot of the strip.
    var last = pins[pins.length - 1].bottom, out = { y: last };
    if (ids.length) {
      var tg = env.tags.sourceTag(ctx, ids, { x: X(GTAG.x), y: last + GTAG.gap * k, scale: GTAG.scale * k, scope: 'auto', maxWidth: GTAG.maxWidth,
        anchor: { x: X(LINE.x + LINE.w / 2), y: Y(LINE.y + LINE.h) - 2 } });
      out.y = tg.y + tg.h;
    }
    return out;
  }

  function drawNote(ctx, env, s, X, top, k) {
    var ink = env.ink, m = env.pal.mundo, rot = s.lamina.rotulos || {}, r = rot.omnibus;
    if (!r) return;
    var y = top + NOTE.gap * k, x = X(NOTE.x), hy = y;
    if (rot.omnibusTitulo) {
      var hl = ink.text(ctx, rot.omnibusTitulo.text, x, y, { size: 16 * k, weight: 700, color: env.pal.mix(m.tinta, m.lienzo, 0.25) });
      hy = y + hl.h;
    }
    var o = { size: NOTE.size * k, maxWidth: NOTE.w * k, lineHeight: 1.2 }, lay = ink.text(ctx, r.text, x, hy, o);
    // A calligraphic bracket marks the note.
    var b0 = y + 2, b1 = hy + lay.h - 2;
    ink.line(ctx, stable(env, 'bracket', [x - 6 * k, b0, x - 13 * k, b0 + 6 * k, x - 14 * k, (b0 + b1) / 2, x - 13 * k, b1 - 6 * k, x - 6 * k, b1]),
      { w: 3 * k, profile: 'swell', seed: 'd14-bracket' });
    if (r.cifras && r.cifras.length) {
      ctx.save();
      ctx.font = lay.font;
      var endX = x + ctx.measureText(lay.lines[lay.lines.length - 1]).width + 6 * k;
      ctx.restore();
      var endY = hy + (lay.lines.length - 1) * lay.lineH + lay.size * 0.62;
      var to = { scale: NOTE.tagScale * k, scope: 'auto', maxWidth: NOTE.maxWidth }, tm = env.tags.measureTag(ctx, r.cifras, to);
      env.tags.sourceTag(ctx, r.cifras, { x: X(NOTE.tagX), y: Math.max(y + 12 * k, (y + hy + lay.h) / 2 - tm.h / 2 + 6 * k), scale: to.scale, scope: to.scope,
        maxWidth: to.maxWidth, anchor: { x: endX, y: endY } });
    }
  }

  // ---- The governance cycle around the steering wheel

  function drawCycle(ctx, env, s, X, Y, k) {
    var ink = env.ink, m = env.pal.mundo, items = (s.lamina.diagrama && s.lamina.diagrama.items) || [], n = items.length;
    var cx = X(WHEEL.cx), cy = Y(WHEEL.cy), rx = WHEEL.rx * k, ry = WHEEL.ry * k;
    var turn = s.still ? 0 : Math.round(Math.sin(TAU * s.loop) * 6) / 100;
    env.fig.steeringWheel(ctx, cx, cy, WHEEL.scale * k, { turn: turn, seed: 'd14' });
    if (!n) return;
    var ang = function (i) { return -Math.PI / 2 + i / n * TAU; };
    var at = function (a, f) { return { x: cx + Math.cos(a) * rx * f, y: cy + Math.sin(a) * ry * f }; };
    // Arrows along the ring, from each station to the next (the last back to the first).
    var gap = (WHEEL.st + 9) / Math.min(WHEEL.rx, WHEEL.ry);
    for (var i = 0; i < n; i++) {
      var a0 = ang(i) + gap, a1 = ang(i + 1) - gap, pts = [];
      for (var j = 0; j <= 5; j++) { var q = at(a0 + (a1 - a0) * j / 5, 1.0); pts.push(q.x, q.y); }
      ink.arrow(ctx, stable(env, 'arc' + i, pts), { w: 3 * k, headSize: 11 * k, seed: 'd14-arc' + i });
    }
    // Stations and their labels, outside the ring.
    items.forEach(function (it, i) {
      var a = ang(i), c = at(a, 1), ca = Math.cos(a), sa = Math.sin(a), R = WHEEL.st * k;
      ink.circle(ctx, c.x, c.y, R, { fill: m.amarillo, w: 3.2 * k, seed: 'd14-st' + i });
      ink.text(ctx, String(i + 1), c.x, c.y - 11.5 * k, { size: 19 * k, weight: 700, align: 'center' });
      var o = { size: WHEEL.size * k, weight: 700, maxWidth: WHEEL.labelW * k, lineHeight: 1.15 };
      var lay = ink.measureText(ctx, it.text, o), gapL = R + 8 * k;
      if (Math.abs(ca) < 0.3) {
        o.align = 'center';
        o.maxWidth = WHEEL.labelW * 1.6 * k;
        lay = ink.measureText(ctx, it.text, o);
        ink.text(ctx, it.text, c.x, sa < 0 ? c.y - gapL - lay.h : c.y + gapL, o);
      } else {
        o.align = ca > 0 ? 'left' : 'right';
        ink.text(ctx, it.text, c.x + (ca > 0 ? gapL : -gapL), c.y - lay.h / 2, o);
      }
    });
  }

  EIA.laminas.d14 = {
    // The cycle is drawn here around the wheel: the illustration takes the diagram band too.
    layout: { diagrama: false, drawDiagram: false },

    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k;
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
      var tl = drawTimeline(ctx, env, s, X, Y, k);
      drawNote(ctx, env, s, X, tl ? tl.y : Y(LINE.y + LINE.h), k);
      drawCycle(ctx, env, s, X, Y, k);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
