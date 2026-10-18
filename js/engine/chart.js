/* Estado de la IA 2026 — honest data marks in the Miró language (prompt §3.7, MUST).
 *
 * Rules every function here keeps:
 *   - Lengths, areas, dot counts, angles and positions are exactly proportional to the value, on a
 *     zero-based scale shared by every mark in the frame (pass the same scale to every mark).
 *   - Wobble and offset fills never touch a value-carrying edge: the end of a bar is a straight
 *     stroke centered exactly on the value (≤ 1 px), fills are offset only across a bar.
 *   - Marks grow from zero with `p` (0→1, eased out, never overshooting) and land exactly at p = 1.
 *     Value labels fade in only when the mark has landed, so no in-between number is ever shown.
 *   - Approximate values ("~", "cerca de", "casi") get a dotted end cap and "≈"; "más de"/"menos de"
 *     an open arrowhead; "hasta" a maximum tick with the word "hasta"; ranges a band.
 *   - Numbers come from data strings (rótulos, deck items) through chart.parseValue: drawing code
 *     never types a value.
 *
 *   chart.parseValue(text) -> { value, lo, hi, approx, bound, unit, raw, index, negative } | null
 *   chart.linear(d0, d1, r0, r1) -> scale(v) with .invert, .domain, .range
 *   chart.geom.bar / unitGrid / dots / gauge / timeline  pure geometry (value -> px), for tests
 *   chart.bar, bars, unitGrid, dots, band, interval, gauge, timeline, funnel, panels, baseline
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};
  var chart = E.chart = E.chart || {};

  var TAU = Math.PI * 2;
  function P() { return E.palette; }
  function M() { return E.palette.mundo; }
  function Q() { return E.palette.maquina; }
  function W() { return E.palette.legend.words; }
  function I() { return E.ink; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); }
  function grow(p) { var t = 1 - clamp(p, 0, 1); return 1 - t * t * t; }   // ease-out, no overshoot

  // ---------------------------------------------------------------------------------------------
  // Parsing Spanish figures from data strings ("66,3%", "344.700", "~1/3", "hasta −83%", "14–15%").

  var NUM = '(\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,(\\d+))?';
  var RE = new RegExp(NUM + '(?:\\s*[–-]\\s*' + NUM + ')?(?:\\s*\\/\\s*(\\d+))?(\\s*%|×|\\s*GW|\\s*puntos)?');

  function toNum(intPart, dec) {
    return parseFloat(intPart.replace(/\./g, '') + (dec ? '.' + dec : ''));
  }

  chart.parseValue = function (text) {
    var s = String(text == null ? '' : text);
    var m = RE.exec(s);
    if (!m) return null;
    var before = s.slice(Math.max(0, m.index - 14), m.index).toLowerCase();
    var tail = before.replace(/\s+$/, '');
    var v = toNum(m[1], m[2]);
    var out = { value: v, lo: null, hi: null, approx: false, bound: null, unit: (m[6] || '').trim(), raw: m[0], index: m.index, negative: false };
    var lastCh = tail.charAt(tail.length - 1);
    if (lastCh === '−' || lastCh === '-') { out.negative = true; out.value = -v; tail = tail.slice(0, -1).replace(/\s+$/, ''); }
    else if (lastCh === '+') tail = tail.slice(0, -1).replace(/\s+$/, '');
    var q = /(~|≈|cerca de|casi)$/.exec(tail) || /(más de|>)$/.exec(tail) || /(menos de|<)$/.exec(tail) || /(hasta)$/.exec(tail);
    if (q) {
      if (/~|≈|cerca de|casi/.test(q[1])) out.approx = true;
      else if (/más de|>/.test(q[1])) out.bound = 'more';
      else if (/menos de|</.test(q[1])) out.bound = 'less';
      else out.bound = 'max';
      var start = m.index - (before.length - before.lastIndexOf(q[1]));
      out.raw = s.slice(start, m.index + m[0].length).trim();
      out.index = start;
    } else if (out.negative || lastCh === '+') {
      out.raw = s.slice(m.index - 1, m.index + m[0].length).trim();
      out.index = m.index - 1;
    }
    if (m[3]) {   // range
      out.lo = out.value;
      out.hi = toNum(m[3], m[4]) * (out.negative ? -1 : 1);
      out.value = out.hi;
    }
    if (m[5]) {   // fraction such as 1/3: a share, expressed in percent
      out.value = v / parseFloat(m[5]) * 100 * (out.negative ? -1 : 1);
      out.unit = '%';
      out.fraction = true;
    }
    out.raw = out.raw.replace(/\s+$/, '');
    return out;
  };

  // ---------------------------------------------------------------------------------------------
  // Scales

  chart.linear = function (d0, d1, r0, r1) {
    var k = (r1 - r0) / ((d1 - d0) || 1);
    var f = function (v) { return r0 + (v - d0) * k; };
    f.invert = function (px) { return d0 + (px - r0) / k; };
    f.domain = [d0, d1];
    f.range = [r0, r1];
    return f;
  };
  // Zero-based scale for bars: 0 -> x0, max -> x0 + len.
  chart.scale = function (max, x0, len) { return chart.linear(0, max, x0, x0 + len); };

  function scaleFrom(o, fallbackMax) {
    if (o.scale) return o.scale;
    var max = o.max != null ? o.max : fallbackMax;
    return chart.scale(max, o.orient === 'v' ? 0 : (o.x || 0), o.len || 400);
  }

  // ---------------------------------------------------------------------------------------------
  // Bars

  function barSpec(o) {
    var pv = o.text != null && o.value == null ? chart.parseValue(o.text) : null;
    var value = o.value != null ? o.value : pv ? pv.value : 0;
    var cap = o.cap || (pv ? (pv.approx ? 'approx' : pv.bound || 'exact') : 'exact');
    return { value: value, cap: cap, pv: pv };
  }

  /* chart.geom.bar(opts) -> { x0, x1, y0, y1, value, len, cap } — exact pixel geometry.
   * Horizontal (default): baseline at scale(0), value edge at scale(value); y = top, h = thickness.
   * Vertical (orient 'v'): x = left, baseY = baseline y, value edge at baseY - (scale(value) - scale(0)). */
  chart.geom = {};
  chart.geom.bar = function (o, p) {
    var spec = barSpec(o), sc = scaleFrom(o, Math.max(100, spec.value));
    var g = grow(p == null ? 1 : p), h = o.h || 34;
    var z = sc(0), full = sc(Math.abs(spec.value)) - z;
    var len = full * g;
    if (o.orient === 'v') {
      var by = o.baseY;
      return { x0: o.x, x1: o.x + h, y0: by - len, y1: by, value: spec.value, len: len, full: full, cap: spec.cap, pv: spec.pv, orient: 'v' };
    }
    var x0 = z;
    return { x0: x0, x1: x0 + len, y0: o.y, y1: o.y + h, value: spec.value, len: len, full: full, cap: spec.cap, pv: spec.pv, orient: 'h' };
  };

  function fieldPath(g, seed, ruled) {
    // Gouache field: exact along the value axis, wobbly and offset only across it.
    var r = E.rng.create(seed), path = new Path2D();
    if (ruled) { path.rect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0); return path; }
    var off = r.range(1.6, 3.2) * r.sign();
    if (g.orient === 'v') {
      var w = g.x1 - g.x0, n = Math.max(2, Math.round((g.y1 - g.y0) / 30));
      path.moveTo(g.x0 + off, g.y1);
      for (var i = 0; i <= n; i++) path.lineTo(g.x0 + off + r.jitter(1.1), lerp(g.y1, g.y0, i / n));
      path.lineTo(g.x1 + off + r.jitter(0.8), g.y0);
      for (i = n; i >= 0; i--) path.lineTo(g.x1 + off + r.jitter(1.1), lerp(g.y1, g.y0, i / n));
      path.closePath();
      return path;
    }
    var m = Math.max(2, Math.round((g.x1 - g.x0) / 30));
    path.moveTo(g.x0, g.y0 + off);
    for (var j = 0; j <= m; j++) path.lineTo(lerp(g.x0, g.x1, j / m), g.y0 + off + r.jitter(1.1));
    path.lineTo(g.x1, g.y1 + off + r.jitter(0.8));
    for (j = m; j >= 0; j--) path.lineTo(lerp(g.x0, g.x1, j / m), g.y1 + off + r.jitter(1.1));
    path.closePath();
    return path;
  }

  function drawCap(ctx, g, cap, color, ruled, lw) {
    var ink = I();
    var vert = g.orient !== 'v';
    var ex = vert ? g.x1 : null, ey = vert ? null : g.y0;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    if (cap === 'approx') {
      // Dotted end cap at the exact value.
      var n = 5;
      for (var i = 0; i < n; i++) {
        var t = (i + 0.5) / n;
        ctx.beginPath();
        if (vert) ctx.arc(ex, lerp(g.y0, g.y1, t), lw * 0.75, 0, TAU);
        else ctx.arc(lerp(g.x0, g.x1, t), ey, lw * 0.75, 0, TAU);
        ctx.fill();
      }
    } else {
      // Clean straight stroke centered on the value (no wobble on a value-carrying edge).
      ctx.lineWidth = lw;
      ctx.lineCap = 'butt';
      var ext = cap === 'max' ? (vert ? (g.y1 - g.y0) * 0.3 : (g.x1 - g.x0) * 0.3) : 0;
      ctx.beginPath();
      if (vert) { ctx.moveTo(ex, g.y0 - ext); ctx.lineTo(ex, g.y1 + ext); }
      else { ctx.moveTo(g.x0 - ext, ey); ctx.lineTo(g.x1 + ext, ey); }
      ctx.stroke();
    }
    // Open arrowheads for bounded values, outside the bar so the value edge stays clean.
    if (cap === 'more' || cap === 'less') {
      var size = vert ? (g.y1 - g.y0) * 0.42 : (g.x1 - g.x0) * 0.42, gap = lw * 2.4;
      ctx.lineWidth = Math.max(2, lw * 0.9);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (vert) {
        var cy = (g.y0 + g.y1) / 2;
        if (cap === 'more') { ctx.moveTo(ex + gap, cy - size); ctx.lineTo(ex + gap + size * 0.8, cy); ctx.lineTo(ex + gap, cy + size); }
        else { ctx.moveTo(ex + gap + size * 0.8, cy - size); ctx.lineTo(ex + gap, cy); ctx.lineTo(ex + gap + size * 0.8, cy + size); }
      } else {
        var cx = (g.x0 + g.x1) / 2;
        if (cap === 'more') { ctx.moveTo(cx - size, ey - gap); ctx.lineTo(cx, ey - gap - size * 0.8); ctx.lineTo(cx + size, ey - gap); }
        else { ctx.moveTo(cx - size, ey - gap - size * 0.8); ctx.lineTo(cx, ey - gap); ctx.lineTo(cx + size, ey - gap - size * 0.8); }
      }
      ctx.stroke();
    }
    ctx.restore();
    return ink;
  }

  function capRoom(cap, h) { return cap === 'more' || cap === 'less' ? h * 0.42 * 0.8 + 10 : 0; }

  function hasWord(text, word) { return String(text || '').toLowerCase().indexOf(word) >= 0; }

  // Value text as shown: the verbatim token, with "≈" or "hasta" added when the data's own wording
  // does not already say it.
  function shownValue(o, spec) {
    var t = o.valueText != null ? o.valueText : spec.pv ? spec.pv.raw : '';
    if (!t) return '';
    if (spec.cap === 'approx' && !/[~≈]|cerca|casi/i.test(t)) t = W().aprox + ' ' + t;
    if (spec.cap === 'max' && !hasWord(t, W().hasta) && !hasWord(o.label || o.text, W().hasta)) t = W().hasta + ' ' + t;
    return t;
  }

  // Splits "88% usa IA…" into the value token and the rest; keeps the text whole otherwise.
  function splitLabel(o, spec) {
    if (o.label != null) return o.label;
    if (o.text == null) return '';
    if (spec.pv && spec.pv.index === 0) return String(o.text).slice(spec.pv.raw.length).replace(/^[\s:·]+/, '');
    return spec.pv && o.valueText == null ? null : String(o.text);
  }

  /* chart.bar(ctx, opts) -> geometry + label boxes.
   * opts: text (data string; value parsed from it) or value; valueText; label; scale (shared!) or
   *   max + x + len; x, y (h-bar: y = top) | x, baseY (v-bar); h (thickness, 34); orient 'h' | 'v';
   *   p; color (mundo.azul); style 'warm' | 'ruled'; cap override; seed; cifras (ids: source tag);
   *   labelSize (22); labelWidth (max width of the description, 360); labels (true); tag (true);
   *   tagOpts; mono; textColor. */
  chart.bar = function (ctx, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    var g = chart.geom.bar(o, p), spec = barSpec(o);
    var ruled = o.style === 'ruled';
    var color = o.color || (ruled ? Q().linea : M().azul);
    var line = ruled ? Q().linea : M().tinta, lw = ruled ? 1.6 : 3.2;
    var seed = o.seed || ('bar:' + (o.text || o.value));
    if (g.len > 0.5) {
      var path = fieldPath(g, seed, ruled);
      ctx.save();
      ctx.fillStyle = color;
      if (ruled) ctx.globalAlpha *= 0.85;
      ctx.fill(path);
      if (!ruled) {
        ctx.fillStyle = I().gouachePattern(ctx, 1);
        ctx.fill(path);
      }
      ctx.restore();
      // Long sides: brush strokes along the bar (they carry no value).
      if (!ruled) {
        var bseed = seed + Math.round(g.full);
        if (g.orient === 'v') {
          sideStroke(ctx, [g.x0, g.y1, g.x0, g.y1 - g.full], bseed + 'a', lw, line, g.len / g.full);
          sideStroke(ctx, [g.x1, g.y1, g.x1, g.y1 - g.full], bseed + 'b', lw, line, g.len / g.full);
        } else {
          sideStroke(ctx, [g.x0, g.y0, g.x0 + g.full, g.y0], bseed + 'a', lw, line, g.len / g.full);
          sideStroke(ctx, [g.x0, g.y1, g.x0 + g.full, g.y1], bseed + 'b', lw, line, g.len / g.full);
        }
      } else {
        I().rRect(ctx, g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0, { color: line, w: 1.2 });
      }
      drawCap(ctx, g.orient === 'v' ? { x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y0, orient: 'v' } :
        { x0: g.x1, x1: g.x1, y0: g.y0, y1: g.y1, orient: 'h' }, p >= 1 ? g.cap : 'exact', line, ruled, lw);
    }
    // Labels and tag, once the mark has landed.
    var lp = seg(p, 0.9, 1);
    var out = { x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, value: g.value, len: g.len, cap: g.cap, valueBox: null, labelBox: null, tagBox: null };
    if (lp <= 0 || o.labels === false) return out;
    var vt = shownValue(o, spec), lab = splitLabel(o, spec), size = o.labelSize || 22, ink = I();
    var tc = o.textColor || (ruled ? M().lienzo : M().tinta);
    var lx, ly;
    if (g.orient === 'v') { lx = g.x0; ly = g.y0 - size * 1.3 - (lab ? size * 1.1 : 0); }
    else { lx = g.x1 + 12 + capRoom(g.cap, g.y1 - g.y0); ly = g.y0 + (g.y1 - g.y0) / 2 - size * 0.62; }
    ctx.save();
    ctx.globalAlpha *= lp;
    if (vt) {
      var vl = ink.text(ctx, vt, lx, ly, { size: size, weight: 700, color: tc });
      out.valueBox = { x: lx, y: ly, w: vl.w, h: vl.h };
    }
    if (lab) {
      var lx2 = g.orient === 'v' ? lx : lx + (out.valueBox ? out.valueBox.w + size * 0.4 : 0);
      var ly2 = g.orient === 'v' ? ly + size * 1.15 : ly + size * 0.12;
      var ll = ink.text(ctx, lab, lx2, ly2, { size: size * 0.78, maxWidth: o.labelWidth || 360, color: tc, lineHeight: 1.2 });
      out.labelBox = { x: lx2, y: ly2, w: ll.w, h: ll.h };
    }
    ctx.restore();
    if (o.cifras && o.cifras.length && o.tag !== false && E.tags) {
      var anchorBox = out.labelBox || out.valueBox;
      var ax = anchorBox ? anchorBox.x + anchorBox.w : g.x1, ay = anchorBox ? anchorBox.y + size * 0.55 : g.y0;
      var to = { near: { x: ax + 6, y: ay, side: 'right', gap: 18 }, p: lp, scale: 0.86, mono: o.mono };
      if (o.tagOpts) for (var k in o.tagOpts) to[k] = o.tagOpts[k];
      out.tagBox = E.tags.sourceTag(ctx, o.cifras, to);
    }
    return out;
  };

  function sideStroke(ctx, pts, seed, w, color, p) {
    I().line(ctx, pts, { w: w, profile: 'even', seed: seed, color: color, p: p, rough: 0.04, press: 0.05 });
  }

  /* chart.bars(ctx, items, opts) -> [geometry]. Horizontal bars on ONE shared zero-based scale.
   * items: [{ text | value, valueText?, label?, cifras?, color?, cap? }]
   * opts: x (baseline), y (top), len (px for max), max (domain max; default 100 for % data, else the
   *   largest value), h (thickness), gap, p (staggered), color, style, labelSize, labelWidth, mono. */
  chart.bars = function (ctx, items, o) {
    o = o || {};
    var specs = items.map(function (it) { return barSpec(it); });
    var allPct = specs.every(function (s) { return s.pv && s.pv.unit === '%'; });
    var max = o.max != null ? o.max : allPct ? 100 : Math.max.apply(null, specs.map(function (s) { return Math.abs(s.value); }));
    var sc = o.scale || chart.scale(max, o.x || 0, o.len || 400);
    var h = o.h || 34, gap = o.gap == null ? h * 0.9 : o.gap, p = o.p == null ? 1 : o.p, out = [];
    chart.baseline(ctx, sc(0), (o.y || 0) - 8, (o.y || 0) + items.length * (h + gap) - gap + 8, { p: seg(p, 0, 0.2), style: o.style });
    for (var i = 0; i < items.length; i++) {
      var it = items[i], bo = {};
      for (var k in o) bo[k] = o[k];
      for (k in it) bo[k] = it[k];
      bo.scale = sc;
      bo.y = (o.y || 0) + i * (h + gap);
      bo.h = h;
      bo.p = items.length > 1 ? seg(p, 0.1 + 0.55 * i / items.length, 0.1 + 0.55 * i / items.length + 0.45) : p;
      bo.seed = (o.seed || 'bars') + i;
      out.push(chart.bar(ctx, bo));
    }
    out.scale = sc;
    return out;
  };

  // The shared zero line.
  chart.baseline = function (ctx, x, y0, y1, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    if (o.style === 'ruled') I().rLine(ctx, x, y0, x, lerp(y0, y1, p), { color: Q().linea, w: 1.4 });
    else I().line(ctx, [x, y0, x, y1], { w: 3, profile: 'even', seed: 'baseline' + Math.round(y1 - y0), p: p, rough: 0.03, press: 0.04 });
  };

  // ---------------------------------------------------------------------------------------------
  // Unit grids: 100 dots (or 1.000 when the value has a decimal). Lit dots in reading order.

  /* chart.geom.unitGrid(opts) -> { centers: [x, y, …], cols, rows, pitch, r, total, lit }
   * opts: x, y (top-left), w (width), total (100 | 1000), value (count of lit dots; for a percentage
   *   on 1.000 dots pass value × 10 or use percent), percent (e.g. 3.3 -> 33 of 1.000), cols. */
  chart.geom.unitGrid = function (o) {
    var total = o.total || 100;
    var cols = o.cols || (total === 1000 ? 50 : 10), rows = Math.ceil(total / cols);
    var pitch = (o.w || 300) / cols, r = o.r || pitch * (total === 1000 ? 0.34 : 0.36);
    var lit = o.percent != null ? Math.round(o.percent * total / 100) : Math.round(o.value || 0);
    var centers = new Array(total * 2);
    for (var i = 0; i < total; i++) {
      centers[2 * i] = (o.x || 0) + (i % cols + 0.5) * pitch;
      centers[2 * i + 1] = (o.y || 0) + (Math.floor(i / cols) + 0.5) * pitch;
    }
    return { centers: centers, cols: cols, rows: rows, pitch: pitch, r: r, total: total, lit: clamp(lit, 0, total), w: cols * pitch, h: rows * pitch };
  };

  function gridLayer(ctx, g, color, ruled, seed) {
    var key = 'unitgrid|' + g.total + '|' + g.cols + '|' + g.pitch.toFixed(3) + '|' + g.r.toFixed(3) + '|' + color + '|' + (ruled ? 1 : 0) + '|' + seed;
    return I().layer(ctx, key, g.w, g.h, function (c) {
      var r = E.rng.create('grid:' + seed);
      c.fillStyle = color;
      for (var i = 0; i < g.total; i++) {
        var cx = (i % g.cols + 0.5) * g.pitch, cy = (Math.floor(i / g.cols) + 0.5) * g.pitch;
        c.beginPath();
        if (ruled) c.arc(cx, cy, g.r, 0, TAU);
        else c.ellipse(cx + r.jitter(0.35), cy + r.jitter(0.35), g.r * r.range(0.9, 1.08), g.r * r.range(0.88, 1.05), r() * Math.PI, 0, TAU);
        c.fill();
      }
    });
  }

  /* chart.unitGrid(ctx, opts) -> geometry. opts as geom.unitGrid plus p, litColor, offColor,
   * style 'warm' | 'ruled', halo (soft halo color behind lit dots), seed. Lit count grows with p and
   * lands exactly on the value. */
  chart.unitGrid = function (ctx, o) {
    o = o || {};
    var g = chart.geom.unitGrid(o), p = o.p == null ? 1 : o.p, ruled = o.style === 'ruled';
    var off = o.offColor || (ruled ? Q().rejilla : P().mix(M().lienzoOcre, M().tinta, 0.12));
    var on = o.litColor || (ruled ? Q().linea : M().rojo);
    var seed = o.seed || 'ug';
    var x = o.x || 0, y = o.y || 0;
    var offL = gridLayer(ctx, g, off, ruled, seed), onL = gridLayer(ctx, g, on, ruled, seed);
    var k = Math.round(g.lit * grow(seg(p, 0.1, 1)));
    ctx.save();
    ctx.globalAlpha *= seg(p, 0, 0.15);
    ctx.drawImage(offL, x, y, g.w, g.h);
    ctx.restore();
    if (k > 0) {
      var fullRows = Math.floor(k / g.cols), rest = k - fullRows * g.cols;
      ctx.save();
      ctx.beginPath();
      if (fullRows) ctx.rect(x, y, g.w, fullRows * g.pitch);
      if (rest) ctx.rect(x, y + fullRows * g.pitch, rest * g.pitch, g.pitch);
      ctx.clip();
      if (o.halo) {
        ctx.globalAlpha *= 0.35;
        ctx.fillStyle = o.halo;
        ctx.fillRect(x, y, g.w, g.h);
        ctx.globalAlpha /= 0.35;
      }
      ctx.drawImage(onL, x, y, g.w, g.h);
      ctx.restore();
    }
    g.shown = k;
    return g;
  };

  // ---------------------------------------------------------------------------------------------
  // Exact dot counts as an organic (phyllotaxis) cluster: 44 clusters vs 8, countable.

  chart.geom.dots = function (o) {
    var n = Math.round(o.count || 0), pitch = o.pitch || 14, pts = new Array(n * 2);
    for (var i = 0; i < n; i++) {
      var a = i * 2.399963, d = pitch * 0.62 * Math.sqrt(i + 0.5);
      pts[2 * i] = (o.x || 0) + Math.cos(a) * d;
      pts[2 * i + 1] = (o.y || 0) + Math.sin(a) * d;
    }
    return { centers: pts, count: n, r: o.r || pitch * 0.32, radius: pitch * 0.62 * Math.sqrt(n + 0.5) };
  };

  /* chart.dots(ctx, opts) -> geometry. opts: x, y (center), count, pitch (14), r, color, p,
   * sign (name of a figures sign drawn per unit instead of a dot), signSize, style. */
  chart.dots = function (ctx, o) {
    o = o || {};
    var g = chart.geom.dots(o), p = o.p == null ? 1 : o.p;
    var k = Math.round(g.count * grow(p)), color = o.color || (o.style === 'ruled' ? Q().linea : M().tinta);
    var r = E.rng.create(o.seed || 'dots');
    ctx.fillStyle = color;
    for (var i = 0; i < k; i++) {
      var jx = r.jitter(0.4), jy = r.jitter(0.4), rr = g.r * r.range(0.9, 1.1);
      if (o.sign && E.figures) E.figures.sign(ctx, o.sign, g.centers[2 * i], g.centers[2 * i + 1], o.signSize || g.r * 3, { seed: 'u', colors: o.colors });
      else { ctx.beginPath(); ctx.arc(g.centers[2 * i] + jx, g.centers[2 * i + 1] + jy, rr, 0, TAU); ctx.fill(); }
    }
    g.shown = k;
    return g;
  };

  // ---------------------------------------------------------------------------------------------
  // Ranges and intervals

  /* chart.band(ctx, opts): a range ("14–15%", "5,8–8,8%") as a band with end ticks on a shared
   * scale. opts: text (parsed lo–hi) or lo, hi; scale (shared) or max + x + len; y (top), h (26);
   * color; p; zeroLine (dotted guide from zero, true). Returns { x0, x1, y0, y1 }. */
  chart.band = function (ctx, o) {
    o = o || {};
    var pv = o.text ? chart.parseValue(o.text) : null;
    var lo = o.lo != null ? o.lo : pv && pv.lo != null ? pv.lo : 0, hi = o.hi != null ? o.hi : pv ? pv.value : 0;
    var sc = scaleFrom(o, Math.max(100, hi)), p = o.p == null ? 1 : o.p, h = o.h || 26, y = o.y || 0;
    var g = grow(p), x0 = sc(lo), x1 = sc(lo) + (sc(hi) - sc(lo)) * g, z = sc(0);
    if (o.zeroLine !== false) I().dotted(ctx, [z, y + h / 2, x0, y + h / 2], { r: 1.6, gap: 8, seed: 'bandzero' + Math.round(x0), p: seg(p, 0, 0.4) });
    ctx.save();
    ctx.fillStyle = o.color || M().amarillo;
    ctx.globalAlpha *= 0.85 * seg(p, 0, 0.3);
    ctx.fillRect(x0, y + 3, Math.max(0, x1 - x0), h - 6);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = M().tinta;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y); ctx.lineTo(x0, y + h);
    if (p >= 1) { ctx.moveTo(x1, y); ctx.lineTo(x1, y + h); }
    ctx.stroke();
    ctx.restore();
    return { x0: x0, x1: x1, y0: y, y1: y + h, lo: lo, hi: hi };
  };

  /* chart.interval(ctx, opts): an interval line with end ticks, a point estimate and the zero mark
   * ("−18% (IC 95%: −38% a +9%)"). opts: lo, hi, point (numbers parsed by the caller with
   * parseValue from data), scale (linear over a domain that includes 0) or min, max, x, len; y;
   * p; labels { lo, hi, point } (verbatim strings), zeroLabel (default legend '0'). */
  chart.interval = function (ctx, o) {
    o = o || {};
    var sc = o.scale || chart.linear(o.min, o.max, o.x || 0, (o.x || 0) + (o.len || 400));
    var y = o.y || 0, p = o.p == null ? 1 : o.p, g = grow(p), ink = I(), m = M();
    var z = sc(0), xl = lerp(z, sc(o.lo), g), xh = lerp(z, sc(o.hi), g), xp = lerp(z, sc(o.point), g);
    // Zero line crossing the interval.
    ink.line(ctx, [z, y - 34, z, y + 34], { w: 2.4, profile: 'even', seed: 'zero' + Math.round(z), p: seg(p, 0, 0.3), color: m.tinta });
    ink.text(ctx, o.zeroLabel || W().cero, z, y + 40, { size: 16, weight: 700, align: 'center', p: seg(p, 0, 0.3) });
    ctx.save();
    ctx.strokeStyle = m.tinta;
    ctx.lineCap = 'butt';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(xl, y); ctx.lineTo(xh, y);
    ctx.moveTo(xl, y - 12); ctx.lineTo(xl, y + 12);
    ctx.moveTo(xh, y - 12); ctx.lineTo(xh, y + 12);
    ctx.stroke();
    ctx.fillStyle = o.color || m.rojo;
    ctx.beginPath(); ctx.arc(xp, y, 9, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore();
    var lp = seg(p, 0.9, 1), lb = o.labels || {};
    if (lp > 0) {
      if (lb.lo) ink.text(ctx, lb.lo, xl, y - 42, { size: 18, weight: 700, align: 'center', p: lp });
      if (lb.hi) ink.text(ctx, lb.hi, xh, y - 42, { size: 18, weight: 700, align: 'center', p: lp });
      if (lb.point) ink.text(ctx, lb.point, xp, y + 16, { size: 20, weight: 700, align: 'center', p: lp });
    }
    return { zero: z, lo: xl, hi: xh, point: xp, y: y };
  };

  // ---------------------------------------------------------------------------------------------
  // Gauge: hand-drawn dial, needle at the exact angle.

  var A0 = Math.PI * 5 / 6, SWEEP = Math.PI * 4 / 3;   // from lower-left, 240° clockwise
  chart.geom.gauge = function (o, v) {
    var min = o.min || 0, max = o.max == null ? 100 : o.max;
    var a0 = o.a0 == null ? A0 : o.a0, sweep = o.sweep == null ? SWEEP : o.sweep;
    return a0 + clamp((v - min) / (max - min), 0, 1) * sweep;
  };
  chart.gaugeAngle = chart.geom.gauge;

  /* chart.gauge(ctx, opts) -> { angle, ghostAngle, tip }. opts: x, y (center), r (90), min (0),
   * max, value (or text parsed), ghost (a second value as a faint needle), p (needle sweeps from
   * min), style 'warm' | 'ruled', ticks (12), color (arc band), valueText, label, cifras. */
  chart.gauge = function (ctx, o) {
    o = o || {};
    var pv = o.text != null && o.value == null ? chart.parseValue(o.text) : null;
    var value = o.value != null ? o.value : pv ? pv.value : 0;
    var x = o.x || 0, y = o.y || 0, R = o.r || 90, p = o.p == null ? 1 : o.p, ruled = o.style === 'ruled';
    var ink = I(), m = M(), min = o.min || 0;
    var line = ruled ? Q().linea : m.tinta;
    var a0 = o.a0 == null ? A0 : o.a0, sweep = o.sweep == null ? SWEEP : o.sweep;
    var arcPts = [];
    for (var i = 0; i <= 24; i++) { var a = a0 + sweep * i / 24; arcPts.push(x + Math.cos(a) * R, y + Math.sin(a) * R); }
    var keyPts = chart._arcCache || (chart._arcCache = new Map());
    var ak = x + '|' + y + '|' + R + '|' + a0 + '|' + sweep;
    if (!keyPts.has(ak)) keyPts.set(ak, arcPts);
    arcPts = keyPts.get(ak);
    if (ruled) {
      ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(x, y, R, a0, a0 + sweep * seg(p, 0, 0.3)); ctx.stroke(); ctx.restore();
    } else {
      ctx.save(); ctx.strokeStyle = o.color || m.amarillo; ctx.globalAlpha *= 0.8 * seg(p, 0, 0.3); ctx.lineWidth = R * 0.16;
      ctx.beginPath(); ctx.arc(x, y, R * 0.9, a0, a0 + sweep); ctx.stroke(); ctx.restore();
      ink.line(ctx, arcPts, { w: 5, profile: 'blunt', seed: 'gauge' + ak, p: seg(p, 0, 0.3) });
    }
    // Ticks at exact, regular positions.
    var nt = o.ticks == null ? 12 : o.ticks;
    ctx.save();
    ctx.strokeStyle = line; ctx.lineWidth = ruled ? 1.2 : 2.6; ctx.lineCap = 'round';
    ctx.globalAlpha *= seg(p, 0.1, 0.35);
    ctx.beginPath();
    for (i = 0; i <= nt; i++) {
      var ta = a0 + sweep * i / nt, l = i % 3 === 0 ? 0.8 : 0.86;
      ctx.moveTo(x + Math.cos(ta) * R * l, y + Math.sin(ta) * R * l);
      ctx.lineTo(x + Math.cos(ta) * R * 0.95, y + Math.sin(ta) * R * 0.95);
    }
    ctx.stroke();
    ctx.restore();
    var ang = chart.geom.gauge(o, lerp(min, value, grow(seg(p, 0.25, 1))));
    var out = { angle: ang, ghostAngle: null, tip: null };
    if (o.ghost != null) {
      var ga = chart.geom.gauge(o, o.ghost);
      out.ghostAngle = ga;
      ctx.save(); ctx.globalAlpha *= 0.3 * seg(p, 0.2, 0.4);
      needle(ctx, x, y, R * 0.8, ga, line, ruled);
      ctx.restore();
    }
    out.tip = needle(ctx, x, y, R * 0.8, ang, ruled ? Q().brilloMagenta : m.tinta, ruled);
    ctx.fillStyle = ruled ? Q().linea : m.rojo;
    ctx.beginPath(); ctx.arc(x, y, R * 0.09, 0, TAU); ctx.fill();
    var lp = seg(p, 0.92, 1);
    if (lp > 0 && (o.valueText || pv)) {
      var vt = o.valueText || pv.raw;
      ink.text(ctx, vt, x, y + R * 0.28, { size: Math.max(18, R * 0.26), weight: 700, align: 'center', p: lp, color: ruled ? m.lienzo : m.tinta });
      if (o.label) ink.text(ctx, o.label, x, y + R * 0.62, { size: Math.max(14, R * 0.15), align: 'center', maxWidth: R * 2, p: lp, color: ruled ? m.lienzo : m.tinta });
    }
    if (lp > 0 && o.cifras && o.cifras.length && E.tags) E.tags.sourceTag(ctx, o.cifras, { near: { x: x + R + 10, y: y + R * 0.3, side: 'right' }, p: lp, scale: 0.86 });
    return out;
  };

  // The needle is a straight tapered polygon: no wobble on the value-carrying element.
  function needle(ctx, x, y, len, a, color, ruled) {
    var c = Math.cos(a), s = Math.sin(a), w = ruled ? 1.6 : 4.2;
    var tx = x + c * len, ty = y + s * len;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - s * w, y + c * w);
    ctx.lineTo(tx, ty);
    ctx.lineTo(x + s * w, y - c * w);
    ctx.lineTo(x - c * w * 2, y - s * w * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return { x: tx, y: ty };
  }

  // ---------------------------------------------------------------------------------------------
  // Timeline: a paper strip with dated pins at positions proportional to time.

  var MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  // Short Spanish month names as data writes them («Ago 2027», «sept. 2026»).
  var MESES_CORTOS = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, sept: 8, set: 8, oct: 9, nov: 10, dic: 11 };
  function monthIndex(word) {
    var w = String(word).toLowerCase().replace(/\.$/, '');
    return MESES[w] != null ? MESES[w] : MESES_CORTOS[w] != null ? MESES_CORTOS[w] : null;
  }
  /* chart.parseDate('2 de agosto de 2025' | 'Ago 2027' | 'agosto de 2025' | '2025-08-02' | 2025)
   * -> days since 1970-01-01 (UTC). When a text holds several dates («Ago 2027: plazo para los
   * modelos previos a agosto de 2025») the leading one wins; a month without a day is its 1st. */
  chart.parseDate = function (d) {
    if (typeof d === 'number') return d > 3000 ? d : Date.UTC(d, 0, 1) / 864e5;
    var s = String(d), best = null;
    function offer(index, len, day) { if (isFinite(day) && (!best || index < best.index || (index === best.index && len > best.len))) best = { index: index, len: len, day: day }; }
    var re, m, mi;
    re = /(\d{4})-(\d{2})-(\d{2})/g;
    while ((m = re.exec(s))) offer(m.index, m[0].length, Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5);
    re = /(\d{1,2})\s+de\s+([a-záéíóú]+\.?)\s+(?:de\s+|del\s+)?(\d{4})/gi;
    while ((m = re.exec(s))) if ((mi = monthIndex(m[2])) != null) offer(m.index, m[0].length, Date.UTC(+m[3], mi, +m[1]) / 864e5);
    re = /([a-záéíóú]+\.?)\s+(?:de\s+|del\s+)?(\d{4})/gi;
    while ((m = re.exec(s))) if ((mi = monthIndex(m[1])) != null) offer(m.index, m[0].length, Date.UTC(+m[2], mi, 1) / 864e5);
    re = /\d{4}/g;
    while ((m = re.exec(s))) {
      // A bare year counts only where no fuller date already covers it.
      var covered = best && m.index >= best.index && m.index < best.index + best.len;
      if (!covered) offer(m.index, 4, Date.UTC(+m[0], 0, 1) / 864e5);
    }
    return best ? best.day : NaN;
  };

  chart.geom.timeline = function (o) {
    var from = chart.parseDate(o.from), to = chart.parseDate(o.to);
    var sc = chart.linear(from, to, (o.x || 0) + (o.pad || 30), (o.x || 0) + (o.w || 1000) - (o.pad || 30));
    return (o.items || []).map(function (it) { var d = chart.parseDate(it.date != null ? it.date : it.text); return { x: sc(d), day: d }; });
  };

  /* chart.timeline(ctx, opts) -> [{ x, y }] pin positions. opts: x, y (strip top), w, from, to
   * (dates), items [{ date?, text, below?, cifras?, mark? }] (date parsed from text when absent),
   * p (strip unrolls, pins in order), labelWidth (190), size (16), style. */
  chart.timeline = function (ctx, o) {
    o = o || {};
    var ink = I(), m = M(), p = o.p == null ? 1 : o.p, x = o.x || 0, y = o.y || 0, w = o.w || 1000, h = o.h || 26;
    var pins = chart.geom.timeline(o);
    var sp = seg(p, 0, 0.35);
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 10, y - 400, (w + 20) * sp, 800); ctx.clip();
    ink.card(ctx, x, y, w, h, { seed: 'timeline' + w, radius: 4, weight: 3 });
    ctx.restore();
    var n = pins.length, out = [];
    for (var i = 0; i < n; i++) {
      var it = o.items[i], pe = seg(p, 0.35 + 0.6 * i / n, 0.35 + 0.6 * (i + 1) / n);
      var px = pins[i].x, below = it.below != null ? it.below : i % 2 === 1;
      out.push({ x: px, y: y + h / 2 });
      if (pe <= 0) continue;
      var y0 = below ? y + h : y, y1 = below ? y + h + 40 : y - 40;
      ink.line(ctx, [px, y0, px, y1], { w: 3, profile: 'blunt', seed: 'pin' + i + Math.round(px), p: pe });
      ctx.fillStyle = it.mark || m.rojo;
      ctx.beginPath(); ctx.arc(px, y + h / 2, 7 * pe, 0, TAU); ctx.fill();
      var lw = o.labelWidth || 190, size = o.size || 16;
      var lay = ink.measureText(ctx, it.text, { size: size, maxWidth: lw, lineHeight: 1.22 });
      var ly = below ? y1 + 6 : y1 - 6 - lay.h;
      var lx = clamp(px - lw / 2, x, x + w - lw);
      ink.text(ctx, it.text, lx + lw / 2, ly, { size: size, maxWidth: lw, lineHeight: 1.22, align: 'center', p: seg(pe, 0.5, 1) });
    }
    return out;
  };

  // ---------------------------------------------------------------------------------------------
  // Proportional funnel: centered bars on one zero-based scale; the narrowest is the bottleneck.

  /* chart.funnel(ctx, opts) -> [geometry]. opts: x, y, w (total width of the widest possible bar),
   * items [{ text, cifras }], max (100), h (bar thickness), gap, pitch (row height; default h + gap),
   * p, color, labelX (default x + w + 24), labelWidth, labelSize, mark (true: bracket the narrowest
   * bar), tags (true), mono. */
  chart.funnel = function (ctx, o) {
    o = o || {};
    var items = o.items || [], x = o.x || 0, y = o.y || 0, w = o.w || 400, h = o.h || 46, gap = o.gap == null ? 18 : o.gap;
    var max = o.max || 100, p = o.p == null ? 1 : o.p, cx = x + w / 2, out = [], ink = I(), m = M();
    var narrow = -1, nv = Infinity;
    var specs = items.map(function (it, i) { var s = barSpec(it); if (Math.abs(s.value) < nv) { nv = Math.abs(s.value); narrow = i; } return s; });
    for (var i = 0; i < items.length; i++) {
      var it = items[i], s = specs[i], ip = seg(p, 0.05 + 0.6 * i / items.length, 0.05 + 0.6 * i / items.length + 0.4);
      var pitch = o.pitch || (h + gap);
      var full = Math.abs(s.value) / max * w, len = full * grow(ip), yy = y + i * pitch + (pitch - gap - h) / 2;
      var g = { x0: cx - len / 2, x1: cx + len / 2, y0: yy, y1: yy + h, value: s.value, len: len, full: full, cap: s.cap, orient: 'h' };
      if (len > 0.5) {
        var path = fieldPath(g, 'funnel' + i, false);
        ctx.save();
        ctx.fillStyle = it.color || o.color || (i === narrow && o.mark !== false ? m.amarillo : m.azul);
        ctx.fill(path);
        ctx.fillStyle = ink.gouachePattern(ctx, 1);
        ctx.fill(path);
        ctx.restore();
        sideStroke(ctx, [cx - full / 2, yy, cx + full / 2, yy], 'fa' + i + Math.round(full), 3, m.tinta, ip >= 1 ? 1 : 0);
        sideStroke(ctx, [cx - full / 2, yy + h, cx + full / 2, yy + h], 'fb' + i + Math.round(full), 3, m.tinta, ip >= 1 ? 1 : 0);
        var capT = ip >= 1 ? s.cap : 'exact';
        drawCap(ctx, { x0: g.x1, x1: g.x1, y0: yy, y1: yy + h, orient: 'h' }, capT === 'more' ? 'exact' : capT, m.tinta, false, 3.2);
        drawCap(ctx, { x0: g.x0, x1: g.x0, y0: yy, y1: yy + h, orient: 'h' }, capT === 'more' ? 'exact' : capT, m.tinta, false, 3.2);
      }
      var lp = seg(ip, 0.9, 1), lab = null;
      if (lp > 0) {
        var lx = o.labelX != null ? o.labelX : x + w + 24, size = o.labelSize || 19;
        var vt = shownValue(it, s), rest = splitLabel(it, s);
        var vl = vt ? ink.text(ctx, vt, lx, yy + h / 2 - size * 0.62, { size: size * 1.15, weight: 700, p: lp }) : { w: 0 };
        if (rest) lab = ink.text(ctx, rest, lx + vl.w + (vt ? size * 0.4 : 0), yy + h / 2 - size * 0.55, { size: size * 0.85, maxWidth: o.labelWidth || 330, p: lp, lineHeight: 1.18 });
        if (it.cifras && it.cifras.length && E.tags && o.tags !== false) {
          var tx = lx + vl.w + (lab ? lab.w + size * 0.4 : 0) + 14;
          E.tags.sourceTag(ctx, it.cifras, { near: { x: tx, y: yy + h / 2, side: 'right', gap: 14 }, anchor: { x: tx - 6, y: yy + h / 2 }, p: lp, scale: 0.78, scope: false, mono: o.mono });
        }
      }
      if (i === narrow && o.mark !== false && ip >= 1) {
        // Bottleneck bracket ")(" hugging the narrowest bar.
        ink.line(ctx, [g.x0 - 18, yy - 8, g.x0 - 8, yy + h / 2, g.x0 - 18, yy + h + 8], { w: 3.4, seed: 'neck-l', profile: 'swell' });
        ink.line(ctx, [g.x1 + 18, yy - 8, g.x1 + 8, yy + h / 2, g.x1 + 18, yy + h + 8], { w: 3.4, seed: 'neck-r', profile: 'swell' });
      }
      out.push(g);
    }
    // Shared center axis.
    if (items.length) ink.dotted(ctx, [cx, y - 14, cx, y + items.length * (o.pitch || (h + gap)) - gap + 14], { r: 1.4, gap: 7, seed: 'funnel-axis' + Math.round(cx), p: seg(p, 0, 0.2) });
    return out;
  };

  // ---------------------------------------------------------------------------------------------
  // "No se compara directamente": separate panels, never joined by a line or an axis.

  /* chart.panels(ctx, opts) -> [rects]. opts: x, y, w, h, panels [{ draw(ctx, rect, p), cifras? }],
   * gap (60), note (legend words.noComparable), p, peek (colors behind corners). Each panel is its
   * own paper card; the note sits in the gutter. */
  chart.panels = function (ctx, o) {
    o = o || {};
    var list = o.panels || [], n = list.length || 1, gap = o.gap == null ? 70 : o.gap;
    var pw = (o.w - gap * (n - 1)) / n, p = o.p == null ? 1 : o.p, out = [], ink = I();
    for (var i = 0; i < list.length; i++) {
      var rx = o.x + i * (pw + gap), r = { x: rx, y: o.y, w: pw, h: o.h };
      var pp = seg(p, 0.15 * i, 0.15 * i + 0.85);
      ink.card(ctx, rx, o.y, pw, o.h, { seed: 'panel' + i, p: pp, peek: o.peek ? o.peek[i % o.peek.length] : null, peekCorner: i ? 'tr' : 'tl' });
      if (list[i].draw && pp > 0) list[i].draw(ctx, r, pp);
      out.push(r);
    }
    if (n > 1 && o.note !== false) {
      var note = o.note || W().noComparable, np = seg(p, 0.7, 1);
      for (i = 0; i < n - 1; i++) {
        var gx = o.x + (i + 1) * pw + i * gap + gap / 2;
        ctx.save();
        ctx.translate(gx, o.y + o.h / 2);
        ctx.rotate(-Math.PI / 2);
        ink.text(ctx, note, 0, -11, { size: 18, italic: true, align: 'center', p: np, maxWidth: o.h - 20 });
        ctx.restore();
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
