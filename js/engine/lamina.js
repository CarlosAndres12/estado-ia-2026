/* Estado de la IA 2026 — lámina layout engine (prompt §12.1).
 *
 * A lámina is one 1280×720 canvas page built from its EIA.data.deck entry (contracts §2): a
 * brush-lettered titular (≤ 2 lines) and subtítulo, a column of up to 3 big figures (each with its
 * label and source tag), a diagram band drawn by a generic drawer for its diagrama.tipo, the
 * illustration (the lámina's own module), an "Idea central" band and the pie in small text.
 *
 *   lamina.render(ctx, id, { t, still })  draws one full lámina in logical 1280×720 units
 *   lamina.mountRender(id, q)             index.html?lamina=<id>: bare canvas, window.renderFrame(t),
 *                                         window.renderReady (fonts loaded + setup done)
 *   lamina.layout(entry, module)          -> zones { titular, subtitulo, cifras, figs[], diagrama,
 *                                            ilustracion, idea, pie, sesion, full }
 *   lamina.diagram(ctx, diagrama, rect, { p, mono }) generic drawers (flujo, embudo, causal, columnas,
 *                                         pasos, ciclo, semaforo, linea, tarjetas)
 *   lamina.bigFigure(ctx, item, rect, { p, seed })  one big figure with its label and tag
 *   lamina.entry(id)                      the deck entry or null
 *
 * Lámina modules: EIA.laminas.dNN = { setup(env), draw(ctx, s, env), drawAfter?(ctx, s, env),
 *   layout?: { cifras?: false | rect, diagrama?: false | rect, ilustracion?: rect, idea?: rect } }
 * with s = { t, still, loop (0→1 over the 8 s ambient loop, 0 when still), lamina (deck entry),
 * zones, state (whatever setup returned) }. Text comes only from the deck entry (and its rotulos).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};
  var lamina = E.lamina = E.lamina || {};

  var W = 1280, H = 720, MARGIN = 56, LOOP = 8;
  var TAU = Math.PI * 2;
  function M() { return E.palette.mundo; }
  function L() { return E.palette.legend; }
  function I() { return E.ink; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); }

  var warned = {};
  function warnOnce(msg) {
    if (warned[msg]) return;
    warned[msg] = true;
    if (root.console) root.console.warn('[lamina] ' + msg);
  }

  lamina.entry = function (id) {
    var deck = (EIA.data && EIA.data.deck) || [];
    for (var i = 0; i < deck.length; i++) if (deck[i].id === id) return deck[i];
    return null;
  };

  // ---------------------------------------------------------------------------------------------
  // Layout

  var TITLE = { size: 54, maxWidth: 1010, maxLines: 2, minSize: 34 };

  // A scratch context for measuring text before anything is drawn.
  var measureCtx = null;
  function mctx() {
    if (!measureCtx) measureCtx = I().makeCanvas(8, 8).getContext('2d');
    return measureCtx;
  }

  lamina.layout = function (entry, mod) {
    var ctx = mctx(), ink = I(), lay = (mod && mod.layout) || {};
    var z = { full: { x: 0, y: 0, w: W, h: H } };
    var tl = ink.measureLetter(ctx, entry.titular || entry.titulo || '', { size: TITLE.size, maxWidth: TITLE.maxWidth, maxLines: TITLE.maxLines,
      minSize: TITLE.minSize, seed: entry.id, underline: true });
    z.titular = { x: MARGIN, y: 30, w: TITLE.maxWidth, h: tl.h };
    z.sesion = { x: W - MARGIN - 96, y: 26, w: 96, h: 96 };
    var y = z.titular.y + z.titular.h + 4;
    if (entry.subtitulo) {
      var sl = ink.measureText(ctx, entry.subtitulo, { size: 23, maxWidth: TITLE.maxWidth, maxLines: 2, fit: true });
      z.subtitulo = { x: MARGIN, y: y, w: TITLE.maxWidth, h: sl.h };
      y += sl.h + 6;
    }
    var top = Math.max(y + 16, 150);
    var pieH = entry.pie ? 26 : 0;
    var bottom = H - 18 - pieH;
    if (entry.pie) z.pie = { x: MARGIN, y: H - 16 - pieH, w: W - MARGIN * 2, h: pieH };
    if (entry.ideaCentral && lay.idea !== false) {
      z.idea = lay.idea || { x: MARGIN, y: bottom - 74, w: W - MARGIN * 2, h: 70 };
      bottom = z.idea.y - 16;
    }
    var left = MARGIN, right = W - MARGIN;
    var nFigs = (entry.cifras || []).length;
    if (nFigs && lay.cifras !== false) {
      z.cifras = lay.cifras || { x: MARGIN, y: top, w: 330, h: bottom - top };
      z.figs = [];
      var fh = z.cifras.h / Math.max(nFigs, 1);
      for (var i = 0; i < nFigs; i++) z.figs.push({ x: z.cifras.x, y: z.cifras.y + i * fh, w: z.cifras.w, h: fh });
      if (!lay.cifras) left = z.cifras.x + z.cifras.w + 28;
    }
    if (entry.diagrama && lay.diagrama !== false) {
      if (lay.diagrama) z.diagrama = lay.diagrama;
      else {
        var dh = entry.diagrama.tipo === 'ciclo' || entry.diagrama.tipo === 'semaforo' || entry.diagrama.tipo === 'embudo' ? 190 : 132;
        z.diagrama = { x: left, y: bottom - dh, w: right - left, h: dh };
        bottom = z.diagrama.y - 12;
      }
    }
    z.ilustracion = lay.ilustracion || { x: left, y: top, w: right - left, h: Math.max(60, bottom - top) };
    return z;
  };

  // ---------------------------------------------------------------------------------------------
  // Zones drawn by the engine

  function drawTitular(ctx, entry, z, p) {
    I().letter(ctx, entry.titular || entry.titulo || '', z.titular.x, z.titular.y, {
      size: TITLE.size, maxWidth: TITLE.maxWidth, maxLines: TITLE.maxLines, minSize: TITLE.minSize, seed: entry.id, p: p });
    if (entry.subtitulo && z.subtitulo) {
      I().text(ctx, entry.subtitulo, z.subtitulo.x, z.subtitulo.y, { size: 23, maxWidth: z.subtitulo.w, maxLines: 2, fit: true, p: p });
    }
  }

  function drawSesion(ctx, entry, z) {
    var s = L().sesiones[entry.sesion];
    var cx = z.sesion.x + z.sesion.w / 2, cy = z.sesion.y + z.sesion.h / 2 - 6;
    if (s && E.figures) E.figures.sign(ctx, s.sign, cx, cy, 70, { seed: 'sesion' + entry.sesion });
    if (entry.n != null) {
      I().text(ctx, String(entry.n), cx, cy + 36, { size: 17, weight: 700, align: 'center', color: E.palette.mix(M().tinta, M().lienzo, 0.25) });
    }
  }

  var DECOR = null;
  function decor() {
    if (!DECOR) DECOR = [M().rojo, M().amarillo, M().azul, M().verde];
    return DECOR;
  }

  /* lamina.bigFigure(ctx, item, rect, opts): big number (valor), its label (etiqueta) and the source
   * tag of item.cifras, with a flat color field peeking behind the number. The field is always a
   * light color and sits low-left, so black digits keep their contrast; digits get no colored
   * counters (a number must read as exactly itself from the back of a room). */
  var LIGHT = null;
  function lightDecor() {
    if (!LIGHT) LIGHT = [M().amarillo, M().celeste, M().lienzoOcre];
    return LIGHT;
  }
  lamina.bigFigure = function (ctx, item, r, o) {
    o = o || {};
    var ink = I(), p = o.p == null ? 1 : o.p, seed = o.seed || ('fig:' + item.valor);
    var vs = clamp(r.h * 0.3, 36, 66);
    var vl = ink.measureLetter(ctx, item.valor, { size: vs, maxWidth: r.w - 10, maxLines: 1, seed: seed, underline: false, stars: false, counters: 0 });
    var rr = E.rng.create(seed);
    ink.blob(ctx, r.x + vl.w * 0.22, r.y + vl.h * 0.74, Math.max(24, vl.w * 0.3), vl.h * 0.3, {
      fill: rr.pick(lightDecor()), line: false, seed: seed + 'blob', irr: 0.2, p: seg(p, 0, 0.6), fillAlpha: 0.85 });
    ink.letter(ctx, item.valor, r.x, r.y, { size: vs, maxWidth: r.w - 10, maxLines: 1, seed: seed, underline: false, stars: false, counters: 0, p: seg(p, 0.1, 0.7) });
    var ly = r.y + vl.h + 2;
    var lab = item.etiqueta ? ink.text(ctx, item.etiqueta, r.x, ly, { size: 19, maxWidth: r.w, maxLines: 3, fit: true, minSize: 14, p: seg(p, 0.4, 0.9) }) : { h: 0, w: 0 };
    var out = { valueBox: { x: r.x, y: r.y, w: vl.w, h: vl.h }, labelBox: { x: r.x, y: ly, w: lab.w, h: lab.h }, tagBox: null };
    if (item.cifras && item.cifras.length && E.tags) {
      // The tag fits the rest of the row: with its scope when there is room, without it otherwise.
      var room = r.y + r.h - (ly + lab.h + 8) - 4;
      var to = { scale: 0.8, maxWidth: r.w - 10, scope: 'auto' };
      if (E.tags.measureTag(ctx, item.cifras, to).h > room) to.scope = false;
      if (E.tags.measureTag(ctx, item.cifras, to).h > room) to.scale = 0.7;
      out.tagBox = E.tags.sourceTag(ctx, item.cifras, {
        x: r.x + 6, y: ly + lab.h + 8, anchor: { x: r.x + Math.min(vl.w, 90) * 0.5, y: r.y + vl.h * 0.92 },
        p: seg(p, 0.5, 1), scale: to.scale, maxWidth: to.maxWidth, scope: to.scope });
    }
    return out;
  };

  function drawIdea(ctx, entry, z, p) {
    var ink = I(), r = z.idea, idea = entry.ideaCentral;
    ink.card(ctx, r.x, r.y, r.w, r.h, { seed: 'idea:' + entry.id, weight: 4.2, radius: 14, peek: M().amarillo, peekCorner: 'tr', p: p });
    var w = L().words;
    E.figures && E.figures.sign(ctx, 'estrella', r.x + 36, r.y + r.h / 2, 40, { seed: 'idea' + entry.id, p: p });
    ink.text(ctx, w.ideaCentral, r.x + 70, r.y + 9, { size: 13, weight: 700, color: E.palette.mix(M().tinta, M().lienzo, 0.3), p: p });
    var tagW = idea.cifras && idea.cifras.length ? 250 : 0;
    ink.text(ctx, idea.text, r.x + 70, r.y + 26, { font: 'display', weight: 700, size: 25, maxWidth: r.w - 100 - tagW, maxLines: 2, fit: true,
      minSize: 16, maxHeight: r.h - 30, p: p });
    if (tagW && E.tags) {
      E.tags.sourceTag(ctx, idea.cifras, { x: r.x + r.w - tagW + 10, y: r.y + 8, p: p, scale: 0.78, scope: false, maxWidth: tagW - 20 });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Generic diagram drawers. Item text is verbatim from the deck; item.cifras get small tags.

  function textBox(ctx, text, r, o) {
    o = o || {};
    var size = o.size || 19;
    var lay = I().measureText(ctx, text, { size: size, weight: o.weight || 700, maxWidth: r.w, maxHeight: r.h, fit: true, minSize: 12, lineHeight: 1.18, font: o.font });
    var y = r.y + (r.h - lay.h) / 2;
    I().text(ctx, text, r.x + r.w / 2, y, { size: lay.size, weight: o.weight || 700, maxWidth: r.w, align: 'center', lineHeight: 1.18, p: o.p, font: o.font,
      color: o.color });
    return lay;
  }

  function itemTag(ctx, it, x, y, p, o) {
    if (!it.cifras || !it.cifras.length || !E.tags) return null;
    return E.tags.sourceTag(ctx, it.cifras, { x: x, y: y, p: p, scale: (o && o.scale) || 0.7, scope: false, mono: o && o.mono, maxWidth: (o && o.maxWidth) || 240 });
  }

  var DRAW = {};

  // flujo: "A → B → C" as paper cards joined by calligraphic arrows.
  DRAW.flujo = function (ctx, d, r, o) {
    var items = d.items || [], n = items.length || 1, gap = 46, ink = I();
    var cw = (r.w - gap * (n - 1)) / n, ch = Math.min(r.h - (hasTags(items) ? 40 : 0), 96), y = r.y + 4;
    for (var i = 0; i < items.length; i++) {
      var x = r.x + i * (cw + gap), ip = seg(o.p, i / n * 0.7, i / n * 0.7 + 0.3);
      ink.card(ctx, x, y, cw, ch, { seed: 'flujo' + i + d.titulo, weight: 3.2, radius: 12, p: ip });
      textBox(ctx, items[i].text, { x: x + 12, y: y + 8, w: cw - 24, h: ch - 16 }, { size: 21, p: ip });
      if (i < n - 1) ink.arrow(ctx, [x + cw + 6, y + ch / 2, x + cw + gap - 8, y + ch / 2 + 2], { w: 3.4, headSize: 12, seed: 'fa' + i, p: ip });
      itemTag(ctx, items[i], x + 4, y + ch + 8, ip, o);
    }
  };

  function hasTags(items) { for (var i = 0; i < items.length; i++) if (items[i].cifras && items[i].cifras.length) return true; return false; }

  // pasos: numbered stepping stones along a calligraphic path, labels under them.
  DRAW.pasos = function (ctx, d, r, o) {
    var items = d.items || [], n = items.length || 1, ink = I(), m = M();
    var stepW = r.w / n, cy = r.y + 30;
    ink.line(ctx, pathFor('pasos', r.x + 20, cy, r.x + r.w - 20), { w: 3, seed: 'pasos-path' + n, profile: 'swell', p: seg(o.p, 0, 0.5) });
    for (var i = 0; i < items.length; i++) {
      var cx = r.x + stepW * (i + 0.5), ip = seg(o.p, 0.2 + 0.6 * i / n, 0.2 + 0.6 * i / n + 0.3);
      ink.circle(ctx, cx, cy, 20, { fill: i % 2 ? m.amarillo : m.lienzo, w: 3.4, seed: 'paso' + i, p: ip });
      ink.text(ctx, String(i + 1), cx, cy - 12, { size: 20, weight: 700, align: 'center', p: ip });
      textBox(ctx, items[i].text, { x: cx - stepW / 2 + 8, y: cy + 28, w: stepW - 16, h: r.h - 62 }, { size: 18, p: ip });
      itemTag(ctx, items[i], cx - stepW / 2 + 8, r.y + r.h - 30, ip, o);
    }
  };

  var pathCache = new Map();
  function pathFor(key, x0, y, x1) {
    var k = key + '|' + x0 + '|' + y + '|' + x1;
    var pts = pathCache.get(k);
    if (!pts) { pts = I().wavePoints(x0, y, x1, 5, Math.max(120, (x1 - x0) / 3), 0.4); pathCache.set(k, pts); }
    return pts;
  }

  // embudo: proportional funnel (chart.funnel) on one zero-based scale.
  DRAW.embudo = function (ctx, d, r, o) {
    var items = d.items || [], n = Math.max(1, items.length), tagW = hasTags(items) ? 200 : 0;
    var w = Math.min(r.w * 0.36, 400), labelW = Math.max(160, r.w - w - 24 - tagW - 70), size = 19;
    // Row pitch fits the tallest label so wrapped labels never collide.
    var tallest = 0;
    for (var i = 0; i < items.length; i++) {
      var pv = E.chart.parseValue(items[i].text), rest = pv && pv.index === 0 ? items[i].text.slice(pv.raw.length) : items[i].text;
      tallest = Math.max(tallest, I().measureText(ctx, rest.trim(), { size: size * 0.85, maxWidth: labelW, lineHeight: 1.18 }).h);
    }
    var pitch = Math.min((r.h - 8) / n, Math.max(64, tallest + 14)), h = Math.min(50, pitch - 14);
    E.chart.funnel(ctx, { x: r.x, y: r.y + 4, w: w, items: items, h: h, gap: pitch - h, pitch: pitch, p: o.p, labelX: r.x + w + 24,
      labelWidth: labelW, labelSize: size, mono: o.mono });
  };

  // causal: a common cause (items[0], a biomorphic cloud) with solid arrows to two effects
  // (items[1], items[2]); between the effects only a dotted line labeled items[3].
  DRAW.causal = function (ctx, d, r, o) {
    var it = d.items || [], ink = I(), m = M(), p = o.p;
    var cx = r.x + r.w / 2, cy = r.y + r.h * 0.22;
    var ex = r.w * 0.34, ey = r.y + r.h * 0.72, bw = Math.min(250, r.w * 0.3), bh = Math.min(64, r.h * 0.3);
    ink.blob(ctx, cx, cy, Math.min(190, r.w * 0.22), r.h * 0.2, { fill: m.celeste, w: 3.4, seed: 'causal-cloud', irr: 0.14, n: 11, p: seg(p, 0, 0.4) });
    if (it[0]) textBox(ctx, it[0].text, { x: cx - 150, y: cy - r.h * 0.16, w: 300, h: r.h * 0.32 }, { size: 21, p: p });
    [[cx - ex, -1], [cx + ex, 1]].forEach(function (e, k) {
      var item = it[k + 1];
      if (!item) return;
      var bx = e[0] - bw / 2, ip = seg(p, 0.3 + 0.2 * k, 0.7 + 0.2 * k);
      ink.arrow(ctx, [cx + e[1] * 60, cy + r.h * 0.17, cx + e[1] * (ex * 0.6), ey - bh / 2 - 26, e[0], ey - bh / 2 - 8], { w: 3.6, seed: 'cause' + k, p: ip });
      ink.card(ctx, bx, ey - bh / 2, bw, bh, { seed: 'effect' + k, weight: 3.2, p: ip });
      textBox(ctx, item.text, { x: bx + 10, y: ey - bh / 2 + 6, w: bw - 20, h: bh - 12 }, { size: 20, p: ip });
    });
    var dp = seg(p, 0.7, 1);
    if (dp > 0 && it[1] && it[2]) {
      ink.dotted(ctx, [cx - ex + bw / 2 + 10, ey, cx, ey + 4, cx + ex - bw / 2 - 10, ey], { r: 2.6, gap: 10, seed: 'assoc', p: dp });
      if (it[3]) ink.text(ctx, it[3].text, cx, ey + 12, { size: 18, italic: true, align: 'center', p: dp });
    }
  };

  // columnas: equal columns, each a card with its text (and item.sign when given).
  DRAW.columnas = function (ctx, d, r, o) {
    var items = d.items || [], n = items.length || 1, gap = 24, cw = (r.w - gap * (n - 1)) / n, ink = I();
    for (var i = 0; i < items.length; i++) {
      var x = r.x + i * (cw + gap), ip = seg(o.p, i / n * 0.6, i / n * 0.6 + 0.4), sgn = items[i].sign;
      ink.card(ctx, x, r.y, cw, r.h - (hasTags(items) ? 34 : 0), { seed: 'col' + i, weight: 3.2, p: ip });
      if (sgn && E.figures) E.figures.sign(ctx, sgn, x + 34, r.y + 34, 44, { seed: 'col' + i, p: ip });
      textBox(ctx, items[i].text, { x: x + (sgn ? 60 : 14), y: r.y + 10, w: cw - (sgn ? 74 : 28), h: r.h - (hasTags(items) ? 54 : 20) }, { size: 19, p: ip });
      itemTag(ctx, items[i], x + 6, r.y + r.h - 30, ip, o);
    }
  };

  // ciclo: numbered stations around an ellipse with calligraphic arrows between them.
  DRAW.ciclo = function (ctx, d, r, o) {
    var items = d.items || [], n = items.length || 1, ink = I(), m = M();
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = r.w * 0.36, ry = r.h * 0.34;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i / n * TAU, a2 = -Math.PI / 2 + (i + 1) / n * TAU, ip = seg(o.p, i / n * 0.8, i / n * 0.8 + 0.2);
      var x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      var am = (a + a2) / 2;
      ink.arrow(ctx, [x + Math.cos(a + 0.5) * 30, y + Math.sin(a + 0.5) * 24, cx + Math.cos(am) * rx * 1.04, cy + Math.sin(am) * ry * 1.06,
        cx + Math.cos(a2) * rx + Math.cos(a2 - 0.5) * 30, cy + Math.sin(a2) * ry + Math.sin(a2 - 0.5) * 24], { w: 2.6, headSize: 10, seed: 'ciclo' + i, p: ip });
      ink.circle(ctx, x, y, 17, { fill: m.amarillo, w: 3, seed: 'st' + i, p: ip });
      ink.text(ctx, String(i + 1), x, y - 11, { size: 18, weight: 700, align: 'center', p: ip });
      var lw = 170, ly = Math.sin(a) >= 0 ? y + 20 : y - 20 - 44;
      textBox(ctx, items[i].text, { x: x - lw / 2, y: ly, w: lw, h: 44 }, { size: 16, p: ip });
    }
  };

  // semaforo: the clinical traffic light (legend positions, signs and labels) with item texts.
  DRAW.semaforo = function (ctx, d, r, o) {
    var items = d.items || [], ink = I(), lights = L().semaforo, R = Math.min(26, r.h / 7.5);
    var x = r.x + R + 8, top = r.y + R + 6, step = (r.h - 2 * R - 12) / 2;
    ink.card(ctx, x - R - 8, r.y, R * 2 + 16, r.h, { seed: 'semaforo-body', weight: 3.4, radius: R, fill: M().tinta, p: o.p });
    for (var i = 0; i < lights.length; i++) {
      var lt = lights[i], y = top + lt.pos * step, ip = seg(o.p, 0.2 + i * 0.2, 0.5 + i * 0.2);
      ink.circle(ctx, x, y, R, { fill: lt.color, line: false, seed: 'luz' + i, p: ip });
      if (E.figures) E.figures.sign(ctx, lt.sign, x, y, R * 1.3, { seed: 'luz', mono: true, p: ip });
      ink.text(ctx, lt.label, x + R + 18, y - 22, { size: 18, weight: 700, p: ip });
      if (items[i]) ink.text(ctx, items[i].text, x + R + 18, y - 2, { size: 17, maxWidth: r.w - R * 2 - 60, maxLines: 2, fit: true, minSize: 12, p: ip });
    }
  };

  // linea: a paper timeline with pins at positions proportional to the dates in the item texts.
  DRAW.linea = function (ctx, d, r, o) {
    var items = (d.items || []).map(function (it) { return { text: it.text, date: it.date, cifras: it.cifras }; });
    var days = items.map(function (it) { return E.chart.parseDate(it.date || it.text); }).filter(function (v) { return isFinite(v); });
    if (!days.length) return DRAW.tarjetas(ctx, d, r, o);
    var lo = Math.min.apply(null, days), hi = Math.max.apply(null, days), span = Math.max(30, hi - lo);
    E.chart.timeline(ctx, { x: r.x, y: r.y + r.h / 2 - 13, w: r.w, from: lo - span * 0.06, to: hi + span * 0.06, items: items, p: o.p,
      labelWidth: Math.min(220, r.w / Math.max(2, items.length) * 1.6), size: 15 });
  };

  // tarjetas: a row of paper cards with their texts.
  DRAW.tarjetas = function (ctx, d, r, o) {
    var items = d.items || [], n = items.length || 1, gap = 18, cw = (r.w - gap * (n - 1)) / n, ink = I(), rr = E.rng.create('tarjetas');
    for (var i = 0; i < items.length; i++) {
      var x = r.x + i * (cw + gap), ip = seg(o.p, i / n * 0.6, i / n * 0.6 + 0.4);
      ink.card(ctx, x, r.y + rr.jitter(4), cw, r.h - 8 - (hasTags(items) ? 30 : 0), { seed: 'tarjeta' + i, weight: 3.2, p: ip,
        peek: i % 2 ? null : decor()[i % 4], peekCorner: 'tr' });
      textBox(ctx, items[i].text, { x: x + 12, y: r.y + 10, w: cw - 24, h: r.h - 28 - (hasTags(items) ? 30 : 0) }, { size: 18, p: ip });
      itemTag(ctx, items[i], x + 4, r.y + r.h - 30, ip, o);
    }
  };

  lamina.diagram = function (ctx, d, r, o) {
    o = o || {};
    if (!d) return;
    var p = o.p == null ? 1 : o.p, fn = DRAW[d.tipo];
    if (!fn) { warnOnce('diagrama.tipo desconocido: ' + d.tipo); fn = DRAW.tarjetas; }
    fn(ctx, d, r, { p: p, mono: o.mono });
  };
  lamina.diagramTypes = function () { return Object.keys(DRAW); };

  // ---------------------------------------------------------------------------------------------
  // Instances: one env + setup per lámina id (setup precomputes geometry with the seeded RNG).

  var instances = new Map();
  function instance(id) {
    var inst = instances.get(id);
    if (inst) return inst;
    var mod = (EIA.laminas || {})[id] || null;
    var env = EIA.makeEnv ? EIA.makeEnv({ id: id }) : null;
    var state = null;
    if (mod && typeof mod.setup === 'function' && env) {
      try { state = mod.setup(env); } catch (err) { warnOnce('setup de ' + id + ': ' + (err && err.message)); }
    }
    inst = { mod: mod, env: env, state: state, zones: null, entryRef: null };
    instances.set(id, inst);
    return inst;
  }
  lamina.reset = function (id) { if (id) instances.delete(id); else instances.clear(); };

  // Calm ambient life: two small signs drift in the margins; frozen when still.
  function ambient(ctx, entry, t, still) {
    if (!E.figures) return;
    var r = E.rng.create('ambient:' + entry.id), u = still ? 0 : (t % LOOP) / LOOP;
    var spots = [[W - 40, 150], [24, 600]];
    for (var i = 0; i < spots.length; i++) {
      var ph = r() * TAU, dx = Math.sin(u * TAU + ph) * 4, dy = Math.cos(u * TAU + ph) * 3;
      E.figures.sign(ctx, i ? 'puntos' : 'estrella', spots[i][0] + dx, spots[i][1] + dy, i ? 26 : 30,
        { seed: entry.id + i, rot: still ? 0 : Math.sin(u * TAU + ph) * 0.12, colors: { a: M().amarillo } });
    }
  }

  /* lamina.render(ctx, id, { t, still }) — draws one full lámina at 1280×720 (logical units).
   * Static by default; t drives an optional calm 8 s ambient loop that `still` disables. */
  lamina.render = function (ctx, id, o) {
    o = o || {};
    var entry = lamina.entry(id);
    var still = !!o.still, t = still ? 0 : (o.t || 0);
    I().background(ctx, 'personas', { seed: 'lamina:' + id });
    if (!entry) {
      warnOnce('Lámina desconocida en EIA.data.deck: ' + id);
      return null;
    }
    var inst = instance(id);
    var z = inst.zones;
    if (!z || inst.entryRef !== entry) {
      z = lamina.layout(entry, inst.mod);
      // Keep the zones only once the display font is loaded (fallback metrics would stick).
      if (fontsLoaded()) { inst.zones = z; inst.entryRef = entry; }
    }
    var s = { t: t, still: still, loop: still ? 0 : (t % LOOP) / LOOP, lamina: entry, zones: z, state: inst.state };
    ambient(ctx, entry, t, still);
    if (inst.mod && typeof inst.mod.draw === 'function') {
      ctx.save();
      try { inst.mod.draw(ctx, s, inst.env); } catch (err) { warnOnce('draw de ' + id + ': ' + (err && err.message)); }
      ctx.restore();
    }
    var lay = (inst.mod && inst.mod.layout) || {};
    if (entry.diagrama && z.diagrama && lay.drawDiagram !== false) lamina.diagram(ctx, entry.diagrama, z.diagrama, { mono: lay.mono });
    if (z.figs) entry.cifras.forEach(function (f, i) { lamina.bigFigure(ctx, f, z.figs[i], { seed: id + ':fig' + i }); });
    drawTitular(ctx, entry, z, 1);
    drawSesion(ctx, entry, z);
    if (z.idea) drawIdea(ctx, entry, z, 1);
    if (entry.pie && z.pie) {
      I().text(ctx, entry.pie.text, z.pie.x, z.pie.y + 4, { size: 15, maxWidth: z.pie.w, maxLines: 1, fit: true, minSize: 11,
        color: E.palette.mix(M().tinta, M().lienzo, 0.2) });
    }
    if (inst.mod && typeof inst.mod.drawAfter === 'function') {
      ctx.save();
      try { inst.mod.drawAfter(ctx, s, inst.env); } catch (err) { warnOnce('drawAfter de ' + id + ': ' + (err && err.message)); }
      ctx.restore();
    }
    return z;
  };

  function fontsLoaded() {
    try { return !root.document || !root.document.fonts || root.document.fonts.check('900 40px "EIA Display"'); } catch (e) { return true; }
  }

  function fontsReady() {
    var d = root.document;
    if (!d || !d.fonts || !d.fonts.load) return Promise.resolve();
    return Promise.all([
      d.fonts.load('900 40px "EIA Display"'), d.fonts.load('700 40px "EIA Display"'),
      d.fonts.load('400 20px "EIA Sans"'), d.fonts.load('700 20px "EIA Sans"'), d.fonts.load('italic 400 20px "EIA Sans"')
    ]).then(function () { return d.fonts.ready; });
  }
  lamina.fontsReady = fontsReady;

  /* lamina.mountRender(id, q) — implements index.html?lamina=<id>: replaces the page with a bare
   * 1280×720 canvas (q.dpr, default 1, max 2) and exposes window.renderFrame(t) and
   * window.renderReady (resolves once fonts are loaded and the module's setup ran). q.still = '1'
   * freezes the ambient loop; q.t is the first frame drawn. */
  lamina.mountRender = function (id, q) {
    q = q || {};
    var d = root.document;
    var dpr = clamp(Number(q.dpr) || 1, 1, 2);
    d.body.innerHTML = '';
    d.body.style.margin = '0';
    d.body.style.background = M().lienzo;
    var c = d.createElement('canvas');
    c.width = W * dpr;
    c.height = H * dpr;
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    c.style.display = 'block';
    var entry = lamina.entry(id);
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', entry ? (entry.titular || entry.titulo) : id);
    d.body.appendChild(c);
    var ctx = c.getContext('2d');
    var still = q.still === '1' || q.still === 'true';
    root.renderFrame = function (t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lamina.render(ctx, id, { t: Number(t) || 0, still: still });
      return true;
    };
    root.renderReady = fontsReady().then(function () {
      instance(id);
      root.renderFrame(Number(q.t) || 0);
      return true;
    });
    return root.renderReady;
  };
})(typeof window !== 'undefined' ? window : globalThis);
