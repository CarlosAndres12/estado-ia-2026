/* Estado de la IA 2026 — ink: brush strokes, gouache fields, paper and lettering (prompt §3.2, §5.7).
 *
 * The warm world is drawn with variable-width black brush strokes that swell and taper, flat color
 * fields offset 2–4 px from their outlines, gouache texture and paper grain. The machine world uses
 * the ruled primitives (rLine, rRect, rCircle, machineGrid): straight, thin, regular.
 *
 * Three ways to draw:
 *   1. Immediate mode, screen units: ink.line / shape / blob / circle / dot / dotted / arrow / wave …
 *      Geometry is cached by the identity of the points array, so pass arrays built once in setup().
 *   2. Drawings (what figures.js uses): b = ink.drawing(seed); b.stroke(...); b.shape(...); …;
 *      d = b.done(); then ink.draw(ctx, d, x, y, scale, { p, colors, mono, flip, weight }).
 *      Outlines draw on in stroke order, then their fills bloom (opts.p 0→1).
 *   3. Cached layers: ink.background / paper / machineGrid / wash render once offscreen, then blit.
 *
 * Every function is a pure function of its arguments: seeds drive all variation, nothing reads time.
 * Coordinates are logical 1280×720 units; callers scale the context for devicePixelRatio.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};
  var ink = E.ink = E.ink || {};

  var TAU = Math.PI * 2;
  var hasDOM = typeof document !== 'undefined';

  function P() { return E.palette; }
  function M() { return E.palette.mundo; }
  function rng(seed) { return E.rng.create(seed); }
  function hash(s) { return E.rng.hash(s); }
  function noise1(x, s) { return E.rng.noise1(x, s); }

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function segment(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // ---------------------------------------------------------------------------------------------
  // Small infrastructure: canvases, LRU caches, device scale.

  function makeCanvas(w, h) {
    w = Math.max(1, Math.ceil(w));
    h = Math.max(1, Math.ceil(h));
    if (hasDOM) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    }
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    throw new Error('ink: no canvas available');
  }

  // LRU keyed by string; optional cost function bounds memory (for offscreen layers).
  function LRU(limit, costFn) {
    this.limit = limit;
    this.cost = costFn || null;
    this.total = 0;
    this.map = new Map();
  }
  LRU.prototype.get = function (k) {
    var v = this.map.get(k);
    if (v !== undefined) { this.map.delete(k); this.map.set(k, v); }
    return v;
  };
  LRU.prototype.set = function (k, v) {
    if (this.map.has(k)) { if (this.cost) this.total -= this.cost(this.map.get(k)); this.map.delete(k); }
    this.map.set(k, v);
    if (this.cost) {
      this.total += this.cost(v);
      while (this.total > this.limit && this.map.size > 1) {
        var oldK = this.map.keys().next().value;
        this.total -= this.cost(this.map.get(oldK));
        this.map.delete(oldK);
      }
    } else {
      while (this.map.size > this.limit) this.map.delete(this.map.keys().next().value);
    }
    return v;
  };
  LRU.prototype.clear = function () { this.map.clear(); this.total = 0; };

  // Pixels per logical unit of the current transform (DPR × any caller scaling), capped at 2.
  function deviceScale(ctx) {
    if (!ctx || !ctx.getTransform) return 1;
    var m = ctx.getTransform();
    var s = Math.sqrt(m.a * m.a + m.b * m.b);
    return clamp(Math.ceil(s * 4) / 4, 0.25, 2);
  }

  // Accepts [x0, y0, x1, y1, …], [[x, y], …] or [{ x, y }, …]; returns a flat array.
  function flat(pts) {
    if (!pts || !pts.length) return [];
    if (typeof pts[0] === 'number') return pts;
    var out = new Array(pts.length * 2);
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      if (Array.isArray(q)) { out[2 * i] = q[0]; out[2 * i + 1] = q[1]; }
      else { out[2 * i] = q.x; out[2 * i + 1] = q.y; }
    }
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Geometry: centripetal Catmull–Rom through control points, sampled every `step` units.

  function d2(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }

  function smoothPath(c, closed, step) {
    c = flat(c);
    step = step || 1.2;
    var n = c.length >> 1;
    var xs = [], ys = [];
    if (n === 0) return { x: new Float32Array(0), y: new Float32Array(0), n: 0 };
    if (n === 1) return { x: Float32Array.of(c[0], c[0] + 0.01), y: Float32Array.of(c[1], c[1]), n: 2 };
    var segs = closed ? n : n - 1;
    for (var i = 0; i < segs; i++) {
      var i1 = i, i2 = (i + 1) % n, i0 = i - 1, i3 = i + 2;
      var x1 = c[2 * i1], y1 = c[2 * i1 + 1], x2 = c[2 * i2], y2 = c[2 * i2 + 1], x0, y0, x3, y3;
      if (closed) {
        i0 = (i0 + n) % n; i3 = i3 % n;
        x0 = c[2 * i0]; y0 = c[2 * i0 + 1]; x3 = c[2 * i3]; y3 = c[2 * i3 + 1];
      } else {
        if (i0 < 0) { x0 = 2 * x1 - x2; y0 = 2 * y1 - y2; } else { x0 = c[2 * i0]; y0 = c[2 * i0 + 1]; }
        if (i3 > n - 1) { x3 = 2 * x2 - x1; y3 = 2 * y2 - y1; } else { x3 = c[2 * i3]; y3 = c[2 * i3 + 1]; }
      }
      var t0 = 0;
      var t1 = t0 + Math.max(Math.pow(d2(x0, y0, x1, y1), 0.25), 1e-4);
      var t2 = t1 + Math.max(Math.pow(d2(x1, y1, x2, y2), 0.25), 1e-4);
      var t3 = t2 + Math.max(Math.pow(d2(x2, y2, x3, y3), 0.25), 1e-4);
      var chord = Math.sqrt(d2(x1, y1, x2, y2));
      var m = Math.max(1, Math.ceil(chord / step));
      for (var j = 0; j < m; j++) {
        var t = t1 + (t2 - t1) * (j / m);
        var a1x = ((t1 - t) * x0 + (t - t0) * x1) / (t1 - t0), a1y = ((t1 - t) * y0 + (t - t0) * y1) / (t1 - t0);
        var a2x = ((t2 - t) * x1 + (t - t1) * x2) / (t2 - t1), a2y = ((t2 - t) * y1 + (t - t1) * y2) / (t2 - t1);
        var a3x = ((t3 - t) * x2 + (t - t2) * x3) / (t3 - t2), a3y = ((t3 - t) * y2 + (t - t2) * y3) / (t3 - t2);
        var b1x = ((t2 - t) * a1x + (t - t0) * a2x) / (t2 - t0), b1y = ((t2 - t) * a1y + (t - t0) * a2y) / (t2 - t0);
        var b2x = ((t3 - t) * a2x + (t - t1) * a3x) / (t3 - t1), b2y = ((t3 - t) * a2y + (t - t1) * a3y) / (t3 - t1);
        xs.push(((t2 - t) * b1x + (t - t1) * b2x) / (t2 - t1));
        ys.push(((t2 - t) * b1y + (t - t1) * b2y) / (t2 - t1));
      }
    }
    if (closed) { xs.push(xs[0]); ys.push(ys[0]); }
    else { xs.push(c[2 * (n - 1)]); ys.push(c[2 * (n - 1) + 1]); }
    return { x: Float32Array.from(xs), y: Float32Array.from(ys), n: xs.length };
  }

  // Width profiles: tin/tout = taper lengths (fraction of the stroke), w0/w1 = width at the very
  // start/end (fraction of full), swell = extra width mid-stroke, press = pressure wobble.
  var PROFILES = {
    swell: { tin: 0.16, tout: 0.34, w0: 0.2, w1: 0.06, swell: 0.36, press: 0.2, rough: 0.07 },
    blunt: { tin: 0.05, tout: 0.08, w0: 0.72, w1: 0.6, swell: 0.08, press: 0.12, rough: 0.06 },
    outline: { tin: 0.05, tout: 0.12, w0: 0.45, w1: 0.12, swell: 0.12, press: 0.2, rough: 0.07 },
    lift: { tin: 0.06, tout: 0.5, w0: 0.85, w1: 0.06, swell: 0.12, press: 0.14, rough: 0.07 },
    press: { tin: 0.45, tout: 0.06, w0: 0.12, w1: 0.9, swell: 0.1, press: 0.12, rough: 0.06 },
    even: { tin: 0.02, tout: 0.02, w0: 1, w1: 1, swell: 0, press: 0.03, rough: 0.02 },
    hair: { tin: 0.3, tout: 0.42, w0: 0.15, w1: 0.05, swell: 0.3, press: 0.2, rough: 0.04 }
  };

  /* strokeGeom(points, opts) -> geometry of one brush stroke, in the points' units.
   * opts: w (full width, default 3), profile ('swell' | 'blunt' | 'outline' | 'lift' | 'press' |
   *   'even' | 'hair'), seed, closed (closed loop drawn by hand: overshoots or leaves a small gap),
   *   dot (end dot: true or radius factor; 'detached' floats it just beyond the end), startDot,
   *   second (true or probability: a thin second stroke beside part of this one), step, taperMax,
   *   press / rough (override the profile's pressure and edge roughness), maxGap / maxOvershoot
   *   (longest gap or loop of a closed outline, in the points' units; default max(4, 2 w) and
   *   15 w + 20, so a big card never opens a wide gap nor trails a long second edge). */
  function strokeGeom(points, o) {
    o = o || {};
    var seed = o.seed != null ? String(o.seed) : 'stroke';
    var r = rng(seed);
    var sn = hash(seed);
    var path = smoothPath(points, !!o.closed, o.step || 1.1);
    var x = path.x, y = path.y, n = path.n;
    var base = (o.w || 3) / 2;
    var pr = PROFILES[o.profile || (o.closed ? 'outline' : 'swell')] || PROFILES.swell;

    // A closed outline starts at a seeded point and either overshoots (a loop) or stops short. The
    // share of the perimeter is seeded; its length is capped so big outlines stay closed and tidy.
    if (o.closed && n > 8) {
      var m = n - 1;
      var k0 = Math.floor(r() * m);
      var over = o.overshoot === false ? 0 : (r() < 0.72 ? Math.round(m * r.range(0.05, 0.11)) : -Math.round(m * r.range(0.015, 0.035)));
      if (over !== 0) {
        var per = 0;
        for (var pi = 1; pi < n; pi++) per += Math.sqrt(d2(x[pi - 1], y[pi - 1], x[pi], y[pi]));
        var spacing = per / m || 1;
        var overPts = Math.max(1, Math.round((o.maxOvershoot != null ? o.maxOvershoot : base * 30 + 20) / spacing));
        var gapPts = Math.round((o.maxGap != null ? o.maxGap : Math.max(4, base * 4)) / spacing);
        // maxGap 0: the outline never opens; a seeded gap becomes a short overlap instead, so the
        // tapered start and end never meet as a thin notch.
        if (over < 0 && gapPts <= 0) over = Math.min(overPts, Math.max(2, Math.round(-over * 1.5)));
        else if (over < 0) over = -Math.min(-over, gapPts);
        else over = Math.min(over, overPts);
      }
      var total = m + over;
      var nx0 = new Float32Array(total + 1), ny0 = new Float32Array(total + 1);
      for (var q = 0; q <= total; q++) {
        var idx = (k0 + q) % m;
        nx0[q] = x[idx]; ny0[q] = y[idx];
      }
      // Push the overshoot slightly outward so the loop does not retrace itself exactly.
      if (over > 0) {
        var cxm = 0, cym = 0;
        for (q = 0; q < m; q++) { cxm += x[q]; cym += y[q]; }
        cxm /= m; cym /= m;
        for (q = m; q <= total; q++) {
          var f = (q - m) / Math.max(1, over);
          var dx = nx0[q] - cxm, dy = ny0[q] - cym, dl = Math.sqrt(dx * dx + dy * dy) || 1;
          nx0[q] += dx / dl * base * 1.6 * f;
          ny0[q] += dy / dl * base * 1.6 * f;
        }
      }
      x = nx0; y = ny0; n = total + 1;
    }

    var s = new Float32Array(n);
    for (var i = 1; i < n; i++) s[i] = s[i - 1] + Math.sqrt(d2(x[i - 1], y[i - 1], x[i], y[i]));
    var L = s[n - 1] || 1e-3;

    var nx = new Float32Array(n), ny = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var ia = i > 0 ? i - 1 : 0, ib = i < n - 1 ? i + 1 : n - 1;
      var tx = x[ib] - x[ia], ty = y[ib] - y[ia], tl = Math.sqrt(tx * tx + ty * ty) || 1;
      nx[i] = -ty / tl; ny[i] = tx / tl;
    }

    var tmax = (o.taperMax || 14) * base * 2;
    var tin = Math.min(pr.tin * L, tmax), tout = Math.min(pr.tout * L, tmax);
    var press = o.press != null ? o.press : pr.press;
    var rough = o.rough != null ? o.rough : pr.rough;
    var off = r() * 97;
    var wl = new Float32Array(n), wr = new Float32Array(n);
    var period = base * 9 + 7;
    for (i = 0; i < n; i++) {
      var si = s[i];
      var fin = tin > 0 && si < tin ? lerp(pr.w0, 1, smoothstep(si / tin)) : 1;
      var fout = tout > 0 && L - si < tout ? lerp(pr.w1, 1, smoothstep((L - si) / tout)) : 1;
      var sw = 1 + pr.swell * (Math.sin(Math.PI * si / L) - 0.5);
      var pp = 1 + press * noise1(si / period + off, sn);
      var w = base * fin * fout * sw * pp;
      wl[i] = w * (1 + rough * noise1(si / 2.3 + off * 1.7, sn + 1));
      wr[i] = w * (1 + rough * noise1(si / 2.1 + off * 2.3, sn + 2));
    }

    var g = { n: n, x: x, y: y, nx: nx, ny: ny, wl: wl, wr: wr, s: s, L: L, w: base * 2,
      dot: null, startDot: null, second: null };

    function endTangent(atEnd) {
      var a = atEnd ? Math.max(0, n - 4) : Math.min(n - 1, 3), b = atEnd ? n - 1 : 0;
      var tx2 = x[b] - x[a], ty2 = y[b] - y[a], l2 = Math.sqrt(tx2 * tx2 + ty2 * ty2) || 1;
      return [tx2 / l2, ty2 / l2];
    }
    if (o.dot) {
      var dr = base * (typeof o.dot === 'number' ? o.dot : r.range(1.05, 1.45));
      var te = endTangent(true), gap = o.dot === 'detached' ? dr * 2.4 + base : 0;
      g.dot = { x: x[n - 1] + te[0] * gap, y: y[n - 1] + te[1] * gap, r: dr };
    }
    if (o.startDot) {
      var sr = base * (typeof o.startDot === 'number' ? o.startDot : r.range(1.05, 1.4));
      var ts = endTangent(false), gap2 = o.startDot === 'detached' ? sr * 2.4 + base : 0;
      g.startDot = { x: x[0] + ts[0] * gap2, y: y[0] + ts[1] * gap2, r: sr };
    }
    var wantSecond = o.second === true || (typeof o.second === 'number' && r() < o.second);
    if (wantSecond && L > base * 12) {
      var u0 = r.range(0.08, 0.35), u1 = Math.min(0.95, u0 + r.range(0.25, 0.5));
      var side = r.sign(), dist = base * 2.2 + Math.max(1.2, base * 0.9);
      var pts2 = [];
      var stepIdx = Math.max(1, Math.floor(n / 24));
      for (i = 0; i < n; i += stepIdx) {
        var ui = s[i] / L;
        if (ui < u0 || ui > u1) continue;
        pts2.push(x[i] + nx[i] * side * dist, y[i] + ny[i] * side * dist);
      }
      if (pts2.length >= 4) {
        g.second = strokeGeom(pts2, { w: base * 2 * 0.3, profile: 'hair', seed: seed + ':2', step: o.step });
        g.second.u0 = u0; g.second.u1 = u1;
      }
    }
    return g;
  }

  // Fills the part of stroke g between arc lengths s0 and s1 (with round caps).
  var IA = new Float64Array(6), IB = new Float64Array(6);
  function findIndex(s, v) {
    var lo = 0, hi = s.length - 1;
    if (v >= s[hi]) return hi;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (s[mid] <= v) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  function interp(g, k, v, out) {
    var n = g.n;
    if (k >= n - 1) {
      out[0] = g.x[n - 1]; out[1] = g.y[n - 1]; out[2] = g.nx[n - 1]; out[3] = g.ny[n - 1];
      out[4] = g.wl[n - 1]; out[5] = g.wr[n - 1];
      return;
    }
    var seg = g.s[k + 1] - g.s[k];
    var f = seg > 0 ? (v - g.s[k]) / seg : 0;
    out[0] = lerp(g.x[k], g.x[k + 1], f); out[1] = lerp(g.y[k], g.y[k + 1], f);
    var ax = lerp(g.nx[k], g.nx[k + 1], f), ay = lerp(g.ny[k], g.ny[k + 1], f), al = Math.sqrt(ax * ax + ay * ay) || 1;
    out[2] = ax / al; out[3] = ay / al;
    out[4] = lerp(g.wl[k], g.wl[k + 1], f); out[5] = lerp(g.wr[k], g.wr[k + 1], f);
  }
  function strokeRange(ctx, g, s0, s1, wk, dots) {
    if (!g || g.n < 2) return;
    if (s0 < 0) s0 = 0;
    if (s1 > g.L) s1 = g.L;
    if (s1 - s0 < 1e-3) return;
    var x = g.x, y = g.y, nx = g.nx, ny = g.ny, wl = g.wl, wr = g.wr;
    var ia = findIndex(g.s, s0), ib = findIndex(g.s, s1);
    interp(g, ia, s0, IA);
    interp(g, ib, s1, IB);
    var i;
    ctx.beginPath();
    ctx.moveTo(IA[0] + IA[2] * IA[4] * wk, IA[1] + IA[3] * IA[4] * wk);
    for (i = ia + 1; i <= ib; i++) ctx.lineTo(x[i] + nx[i] * wl[i] * wk, y[i] + ny[i] * wl[i] * wk);
    ctx.lineTo(IB[0] + IB[2] * IB[4] * wk, IB[1] + IB[3] * IB[4] * wk);
    var er = (IB[4] + IB[5]) * 0.5 * wk, ea = Math.atan2(IB[3], IB[2]);
    ctx.arc(IB[0], IB[1], er, ea, ea - Math.PI, true);
    ctx.lineTo(IB[0] - IB[2] * IB[5] * wk, IB[1] - IB[3] * IB[5] * wk);
    for (i = ib; i > ia; i--) ctx.lineTo(x[i] - nx[i] * wr[i] * wk, y[i] - ny[i] * wr[i] * wk);
    ctx.lineTo(IA[0] - IA[2] * IA[5] * wk, IA[1] - IA[3] * IA[5] * wk);
    var sr = (IA[4] + IA[5]) * 0.5 * wk, sa = Math.atan2(IA[3], IA[2]);
    ctx.arc(IA[0], IA[1], sr, sa + Math.PI, sa, true);
    ctx.closePath();
    ctx.fill();
    // Dots are separate fills: a subpath of opposite winding would punch a hole in the stroke.
    if (dots) {
      if (g.dot && s1 >= g.L - 1e-4) {
        ctx.beginPath();
        ctx.arc(g.dot.x, g.dot.y, g.dot.r * wk, 0, TAU);
        ctx.fill();
      }
      if (g.startDot && s0 <= 1e-4) {
        ctx.beginPath();
        ctx.arc(g.startDot.x, g.startDot.y, g.startDot.r * wk, 0, TAU);
        ctx.fill();
      }
    }
  }
  // Draws the first p (0..1) of a stroke, like a brush moving; the second stroke follows.
  function fillStroke(ctx, g, p, wk) {
    if (!g || p <= 0) return;
    strokeRange(ctx, g, 0, p >= 1 ? g.L : g.L * p, wk || 1, true);
    if (g.second) {
      var p2 = segment(p, g.second.u0, g.second.u1);
      if (p2 > 0) fillStroke(ctx, g.second, p2, wk);
    }
  }

  // Organic closed control points around an ellipse.
  function blobPoints(r, cx, cy, rx, ry, n, irr, rot) {
    n = n || 9;
    irr = irr == null ? 0.18 : irr;
    var pts = [];
    var ph = r() * TAU, cr = Math.cos(rot || 0), srr = Math.sin(rot || 0);
    for (var i = 0; i < n; i++) {
      var a = ph + (i / n) * TAU + r.jitter((0.22 / n) * TAU);
      var k = 1 + r.jitter(irr);
      var px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push(cx + px * cr - py * srr, cy + px * srr + py * cr);
    }
    return pts;
  }
  function ellipsePoints(cx, cy, rx, ry, n, rot) {
    n = n || 12;
    var pts = [], cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU, px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      pts.push(cx + px * cr - py * sr, cy + px * sr + py * cr);
    }
    return pts;
  }

  /* shapeGeom(points, opts) -> closed gouache shape: { outline, path (Path2D of the color field),
   * cx, cy, rad, ox, oy (unit offset direction × magnitude), bbox }.
   * The color field is jittered independently of the line and slightly scaled (spill or sliver). */
  // sharp: two guide points hugging each corner, so the Catmull-Rom outline turns within a pixel or
  // two of the vertex instead of rounding it.
  function sharpen(c, w) {
    var n = c.length >> 1, out = [];
    for (var i = 0; i < n; i++) {
      var x = c[2 * i], y = c[2 * i + 1];
      var px = c[2 * ((i - 1 + n) % n)], py = c[2 * ((i - 1 + n) % n) + 1], nx = c[2 * ((i + 1) % n)], ny = c[2 * ((i + 1) % n) + 1];
      var lp = Math.sqrt(d2(x, y, px, py)) || 1, ln = Math.sqrt(d2(x, y, nx, ny)) || 1;
      var e = Math.max(0.6, Math.min(1.5 + (w || 3) * 0.15, lp / 4, ln / 4));
      out.push(x + (px - x) / lp * e, y + (py - y) / lp * e, x, y, x + (nx - x) / ln * e, y + (ny - y) / ln * e);
    }
    return out;
  }

  function shapeGeom(points, o) {
    o = o || {};
    var c = flat(points);
    var seed = o.seed != null ? String(o.seed) : 'shape';
    var r = rng(seed + ':f');
    var n = c.length >> 1, cx = 0, cy = 0, i;
    for (i = 0; i < n; i++) { cx += c[2 * i]; cy += c[2 * i + 1]; }
    cx /= n; cy /= n;
    var rad = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (i = 0; i < n; i++) {
      rad += Math.sqrt(d2(cx, cy, c[2 * i], c[2 * i + 1]));
      minX = Math.min(minX, c[2 * i]); maxX = Math.max(maxX, c[2 * i]);
      minY = Math.min(minY, c[2 * i + 1]); maxY = Math.max(maxY, c[2 * i + 1]);
    }
    rad /= n;
    var fj = o.fillJitter != null ? o.fillJitter : rad * 0.04;
    var fs = 1 + r.jitter(o.fillScale != null ? o.fillScale : 0.03);
    var fc = new Array(c.length);
    for (i = 0; i < n; i++) {
      fc[2 * i] = cx + (c[2 * i] - cx) * fs + r.jitter(fj);
      fc[2 * i + 1] = cy + (c[2 * i + 1] - cy) * fs + r.jitter(fj);
    }
    var path;
    if (o.poly || o.sharp) {
      // Straight-edged field (floors, walls, bands): the polygon itself, offset but not smoothed.
      path = new Path2D();
      for (i = 0; i < n; i++) { if (i === 0) path.moveTo(c[0], c[1]); else path.lineTo(c[2 * i], c[2 * i + 1]); }
      path.closePath();
    } else {
      var fp = o.exact ? smoothPath(c, true, o.step || 1.5) : smoothPath(fc, true, o.step || 1.5);
      path = toPath2D(fp.x, fp.y, fp.n, true);
    }
    var outline = o.line === false ? null : strokeGeom(o.sharp ? sharpen(c, o.w) : c, {
      closed: true, w: o.w, profile: o.profile || 'outline', seed: seed + ':o', second: o.second,
      overshoot: o.overshoot, dot: o.dot, press: o.press, rough: o.rough
    });
    var ang = r() * TAU, mag = r.range(0.62, 1);
    return { outline: outline, path: path, cx: cx, cy: cy, rad: rad,
      ox: Math.cos(ang) * mag, oy: Math.sin(ang) * mag,
      bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
  }

  function toPath2D(x, y, n, closed) {
    var p = new Path2D();
    if (!n) return p;
    p.moveTo(x[0], y[0]);
    for (var i = 1; i < n; i++) p.lineTo(x[i], y[i]);
    if (closed) p.closePath();
    return p;
  }

  // Line weight compensation: a figure drawn small keeps legible lines, a big one stays elegant.
  function weightFor(scale) { return clamp(Math.pow(Math.max(scale, 1e-3), -0.35), 0.55, 1.8); }

  // ---------------------------------------------------------------------------------------------
  // Textures, pre-rendered once (seeded) and reused as patterns.

  var tiles = {};
  function gouacheTile() {
    if (tiles.gouache) return tiles.gouache;
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    var r = rng('ink:gouache-tile');
    g.lineCap = 'round';
    function streak(x, y, a, len, w, col) {
      for (var ox = -S; ox <= S; ox += S) {
        for (var oy = -S; oy <= S; oy += S) {
          var x0 = x + ox, y0 = y + oy;
          if (x0 < -len || x0 > S + len || y0 < -len || y0 > S + len) continue;
          g.strokeStyle = col;
          g.lineWidth = w;
          g.beginPath();
          g.moveTo(x0, y0);
          g.quadraticCurveTo(x0 + Math.cos(a) * len * 0.5 + r.jitter(3), y0 + Math.sin(a) * len * 0.5 + r.jitter(3),
            x0 + Math.cos(a) * len, y0 + Math.sin(a) * len);
          g.stroke();
        }
      }
    }
    for (var i = 0; i < 260; i++) {
      var dark = r() < 0.55;
      streak(r() * S, r() * S, -0.42 + r.jitter(0.3), r.range(16, 70), r.range(1.5, 6.5),
        dark ? 'rgba(0,0,0,' + r.range(0.018, 0.05).toFixed(3) + ')' : 'rgba(255,255,255,' + r.range(0.025, 0.07).toFixed(3) + ')');
    }
    for (i = 0; i < 46; i++) {
      var bx = r() * S, by = r() * S, br = r.range(8, 34), dk = r() < 0.5;
      for (var ox2 = -S; ox2 <= S; ox2 += S) {
        for (var oy2 = -S; oy2 <= S; oy2 += S) {
          var gr = g.createRadialGradient(bx + ox2, by + oy2, 0, bx + ox2, by + oy2, br);
          gr.addColorStop(0, dk ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.05)');
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr;
          g.fillRect(bx + ox2 - br, by + oy2 - br, br * 2, br * 2);
        }
      }
    }
    tiles.gouache = c;
    return c;
  }

  function grainTile() {
    if (tiles.grain) return tiles.grain;
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    var img = g.createImageData(S, S), d = img.data;
    var r = rng('ink:grain-tile');
    for (var i = 0; i < S * S; i++) {
      var v = r(), o = i * 4;
      if (v < 0.16) { d[o] = 40; d[o + 1] = 30; d[o + 2] = 20; d[o + 3] = 8 + Math.floor(r() * 16); }
      else if (v > 0.9) { d[o] = 255; d[o + 1] = 252; d[o + 2] = 240; d[o + 3] = 10 + Math.floor(r() * 18); }
    }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (i = 0; i < 70; i++) {
      var x = r() * S, y = r() * S, a = r() * TAU, l = r.range(4, 16);
      g.strokeStyle = r() < 0.6 ? 'rgba(60,40,20,0.07)' : 'rgba(255,255,250,0.12)';
      g.lineWidth = r.range(0.4, 0.9);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    for (i = 0; i < 26; i++) {
      g.fillStyle = 'rgba(50,35,20,' + r.range(0.08, 0.2).toFixed(2) + ')';
      g.beginPath();
      g.arc(r() * S, r() * S, r.range(0.4, 1.1), 0, TAU);
      g.fill();
    }
    tiles.grain = c;
    return c;
  }

  var patternCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function patternFor(ctx, name, tile) {
    var m = patternCache.get(ctx);
    if (!m) { m = {}; patternCache.set(ctx, m); }
    if (!m[name]) m[name] = ctx.createPattern(tile, 'repeat');
    return m[name];
  }
  var identity = null;
  function gouachePattern(ctx, s) {
    var pat = patternFor(ctx, 'gouache', gouacheTile());
    if (pat.setTransform && typeof DOMMatrix !== 'undefined') {
      if (!identity) identity = new DOMMatrix();
      pat.setTransform(s === 1 ? identity : new DOMMatrix([1 / s, 0, 0, 1 / s, 0, 0]));
    }
    return pat;
  }
  function grainPattern(ctx) { return patternFor(ctx, 'grain', grainTile()); }

  // ---------------------------------------------------------------------------------------------
  // Drawings: a seeded builder records strokes, fields, dots and ruled marks in local units.

  var SLOTS = null;
  function slotDefaults() {
    if (SLOTS) return SLOTS;
    var m = M(), q = P().maquina;
    SLOTS = {
      ink: m.tinta, paper: m.lienzo, skin: P().pieles[1], hair: m.tinta, outfit: m.rojo,
      accent: m.amarillo, a: m.rojo, b: m.azul, c: m.amarillo, d: m.verde, e: m.tierra,
      night: q.noche, line: q.linea, grid: q.rejilla, glowG: q.brilloVerde, glowM: q.brilloMagenta
    };
    return SLOTS;
  }

  function Builder(seed, opts) {
    opts = opts || {};
    this.seed = String(seed == null ? 'drawing' : seed);
    this.r = rng(this.seed);
    this.items = [];
    this.jitter = opts.jitter != null ? opts.jitter : 0;
    this.w = opts.w || 3;
    this.k = 0;
  }
  var B = Builder.prototype;
  B._seed = function () { return this.seed + '#' + (this.k++); };
  B._jit = function (c, amt) {
    c = flat(c);
    if (!amt) return c;
    var out = c.slice();
    for (var i = 0; i < out.length; i++) out[i] += this.r.jitter(amt);
    return out;
  };
  // Open brush stroke through control points.
  B.stroke = function (pts, o) {
    o = o || {};
    var c = this._jit(pts, o.jitter != null ? o.jitter : this.jitter);
    var g = strokeGeom(c, {
      w: o.w || this.w, profile: o.profile, dot: o.dot, startDot: o.startDot, seed: this._seed(),
      closed: o.closed, second: o.second, press: o.press, rough: o.rough, taperMax: o.taperMax,
      overshoot: o.overshoot, step: o.step
    });
    var it = { k: 's', g: g, color: o.color || '@ink', t: o.t, len: g.L, alpha: o.alpha };
    this.items.push(it);
    return it;
  };
  // Closed shape: offset gouache field (fill) + hand-drawn outline (line). Returns { fill, line, geom }.
  B.shape = function (pts, o) {
    o = o || {};
    var c = this._jit(pts, o.jitter != null ? o.jitter : this.jitter);
    var g = shapeGeom(c, {
      seed: this._seed(), w: o.w || this.w, line: o.line, profile: o.profile, fillJitter: o.fillJitter,
      fillScale: o.fillScale, second: o.second, overshoot: o.overshoot, exact: o.exact, press: o.press, poly: o.poly,
      sharp: o.sharp
    });
    var fill = null, line = null;
    if (o.fill) {
      fill = { k: 'f', path: g.path, color: o.fill, cx: g.cx, cy: g.cy, ox: g.ox, oy: g.oy,
        off: o.offset != null ? o.offset : 1, tex: o.tex !== false, edge: o.edge !== false,
        alpha: o.fillAlpha, t: o.tf };
      this.items.push(fill);
    }
    if (o.line !== false) {
      line = { k: 's', g: g.outline, color: o.lineColor || '@ink', t: o.t, len: g.outline.L };
      this.items.push(line);
      if (fill) fill.after = line;
    }
    return { fill: fill, line: line, geom: g };
  };
  B.fill = function (pts, o) {
    o = o || {};
    var copy = {};
    for (var k in o) copy[k] = o[k];
    copy.line = false;
    if (!copy.fill) copy.fill = '@outfit';
    return this.shape(pts, copy);
  };
  B.blob = function (cx, cy, rx, ry, o) {
    o = o || {};
    var pts = blobPoints(this.r, cx, cy, rx, ry, o.n || 9, o.irr, o.rot);
    return this.shape(pts, o);
  };
  B.ellipse = function (cx, cy, rx, ry, o) {
    o = o || {};
    var pts = blobPoints(this.r, cx, cy, rx, ry, o.n || 12, o.irr != null ? o.irr : 0.035, o.rot);
    return this.shape(pts, o);
  };
  B.circle = function (cx, cy, rad, o) { return this.ellipse(cx, cy, rad, rad, o); };
  B.dot = function (x, y, rad, o) {
    o = o || {};
    var it = { k: 'd', x: x, y: y, r: rad, color: o.color || '@ink', t: o.t, len: 4 };
    this.items.push(it);
    return it;
  };
  B.dots = function (pts, rad, o) {
    var c = flat(pts);
    for (var i = 0; i < c.length; i += 2) this.dot(c[i], c[i + 1], typeof rad === 'function' ? rad(i / 2) : rad, o);
  };
  // Ruled (machine) marks: straight, constant screen width (o.w in px), crisp.
  B.rline = function (x0, y0, x1, y1, o) {
    o = o || {};
    var it = { k: 'r', x0: x0, y0: y0, x1: x1, y1: y1, w: o.w || 1.3, color: o.color || '@line',
      dash: o.dash || null, t: o.t, len: Math.sqrt(d2(x0, y0, x1, y1)), alpha: o.alpha, cap: o.cap };
    this.items.push(it);
    return it;
  };
  B.rpoly = function (pts, o) {
    var c = flat(pts);
    o = o || {};
    for (var i = 0; i + 3 < c.length; i += 2) this.rline(c[i], c[i + 1], c[i + 2], c[i + 3], o);
    if (o.closed && c.length >= 6) this.rline(c[c.length - 2], c[c.length - 1], c[0], c[1], o);
  };
  B.rcircle = function (cx, cy, rad, o) {
    o = o || {};
    var it = { k: 'rc', x: cx, y: cy, r: rad, w: o.w || 1.3, color: o.color || '@line', fill: o.fill || null,
      stroke: o.stroke !== false, a0: o.a0 || -Math.PI / 2, t: o.t, len: TAU * rad, alpha: o.alpha };
    this.items.push(it);
    return it;
  };
  B.rrect = function (x, y, w, h, o) {
    o = o || {};
    if (o.fill) this.rfill([x, y, x + w, y, x + w, y + h, x, y + h], { color: o.fill, t: o.tf, alpha: o.fillAlpha });
    if (o.stroke !== false) this.rpoly([x, y, x + w, y, x + w, y + h, x, y + h], { closed: true, w: o.w, color: o.color, t: o.t, dash: o.dash, alpha: o.alpha });
  };
  B.rfill = function (pts, o) {
    o = o || {};
    var c = flat(pts), path = new Path2D(), cx = 0, cy = 0;
    for (var i = 0; i < c.length; i += 2) {
      if (i === 0) path.moveTo(c[i], c[i + 1]); else path.lineTo(c[i], c[i + 1]);
      cx += c[i]; cy += c[i + 1];
    }
    path.closePath();
    var it = { k: 'rf', path: path, color: o.color || '@night', t: o.t, alpha: o.alpha, len: 0,
      cx: cx / (c.length / 2), cy: cy / (c.length / 2) };
    this.items.push(it);
    return it;
  };
  B.rdisc = function (cx, cy, rad, o) {
    o = o || {};
    var path = new Path2D();
    path.arc(cx, cy, rad, 0, TAU);
    var it = { k: 'rf', path: path, color: o.color || '@night', t: o.t, alpha: o.alpha, len: 0, cx: cx, cy: cy };
    this.items.push(it);
    return it;
  };
  // Where two colored shapes overlap, the intersection gets black or a third color.
  B.overlap = function (a, b, color, o) {
    if (!a || !b || !a.fill || !b.fill) return null;
    var it = { k: 'o', a: a.fill, b: b.fill, color: color || '@ink', t: o && o.t, len: 0 };
    this.items.push(it);
    return it;
  };
  B.glow = function (x, y, rad, color, o) {
    var it = { k: 'g', x: x, y: y, r: rad, color: color || '@line', alpha: o && o.alpha != null ? o.alpha : 0.6,
      add: !!(o && o.add), t: o && o.t, len: 0 };
    this.items.push(it);
    return it;
  };
  B.custom = function (fn, o) {
    var it = { k: 'c', fn: fn, t: o && o.t, len: (o && o.len) || 0 };
    this.items.push(it);
    return it;
  };
  B.done = function (o) {
    o = o || {};
    schedule(this.items, o);
    return { items: this.items, seed: this.seed, colors: o.colors || null };
  };

  // Draw-on schedule: strokes and ruled marks one after another (by length) over [0, span];
  // each color field blooms just after its outline; free fields bloom near the end.
  function schedule(items, o) {
    var span = o.span != null ? o.span : 0.78;
    var total = 0, i, it;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (!it.t && (it.k === 's' || it.k === 'r' || it.k === 'rc' || it.k === 'd')) total += Math.max(it.len, 2);
    }
    var acc = 0;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.t) { it.t0 = it.t[0]; it.t1 = it.t[1]; continue; }
      if (it.k === 's' || it.k === 'r' || it.k === 'rc' || it.k === 'd') {
        var l = Math.max(it.len, 2);
        it.t0 = total ? span * acc / total : 0;
        acc += l;
        it.t1 = total ? Math.max(it.t0 + 0.012, span * acc / total) : span;
      }
    }
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.t) continue;
      if (it.k === 'f') {
        if (it.after) { it.t0 = Math.min(0.9, it.after.t1 - 0.02); it.t1 = Math.min(1, it.t0 + 0.22); }
        else { it.t0 = 0.55; it.t1 = 0.85; }
      } else if (it.k === 'rf' || it.k === 'g') { it.t0 = 0; it.t1 = 0.18; }
      else if (it.k === 'o') {
        it.t0 = Math.max(it.a.t0 || 0, it.b.t0 || 0); it.t1 = Math.max(it.a.t1 || 0, it.b.t1 || 0);
      } else if (it.k === 'c') { it.t0 = 0.6; it.t1 = 1; }
    }
  }

  function resolveColor(c, colors, d, mono, kind) {
    if (c && c.charAt(0) === '@') {
      var slot = c.slice(1);
      c = (colors && colors[slot]) || (d.colors && d.colors[slot]) || slotDefaults()[slot] || M().tinta;
    }
    if (!mono) return c;
    var m = M();
    if (kind === 'f' || kind === 'rf' || kind === 'o') return c === m.tinta ? m.tinta : m.lienzo;
    if (kind === 'g') return null;
    return m.tinta;
  }

  function drawFill(ctx, it, col, e, off, s, mono, baseAlpha) {
    ctx.save();
    ctx.translate(it.ox * off * it.off, it.oy * off * it.off);
    var a = it.alpha == null ? 1 : it.alpha;
    if (e < 1) {
      ctx.globalAlpha = baseAlpha * a * e;
      var k = 0.9 + 0.1 * e;
      ctx.translate(it.cx, it.cy);
      ctx.scale(k, k);
      ctx.translate(-it.cx, -it.cy);
    } else {
      ctx.globalAlpha = baseAlpha * a;
    }
    ctx.fillStyle = col;
    ctx.fill(it.path);
    if (!mono && it.tex) {
      ctx.fillStyle = gouachePattern(ctx, s);
      ctx.fill(it.path);
    }
    if (!mono && it.edge) {
      ctx.strokeStyle = P().shade(col, -0.25);
      ctx.lineWidth = 1.7 / s;
      ctx.globalAlpha *= 0.32;
      ctx.stroke(it.path);
    }
    ctx.restore();
  }

  /* ink.draw(ctx, drawing, x, y, scale, opts) — renders a drawing with its origin at (x, y).
   * opts: p (draw-on 0→1, default 1), colors ({ slot: hex } for '@slot' colors), mono (tinta only),
   *   flip (mirror horizontally), rot (radians), alpha, weight (line weight multiplier),
   *   offset (field offset in px, default 2–4 scaled with size). */
  function draw(ctx, d, x, y, scale, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0 || !d) return;
    var s = scale || 1;
    var wk = (o.weight || 1) * weightFor(s);
    var off = (o.offset != null ? o.offset : clamp(3.1 * Math.sqrt(s), 1, 4)) / s;
    var colors = o.colors, mono = !!o.mono;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.flip ? -s : s, s);
    var baseAlpha = ctx.globalAlpha * (o.alpha == null ? 1 : o.alpha);
    ctx.globalAlpha = baseAlpha;
    var items = d.items;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var e = p >= 1 ? 1 : segment(p, it.t0, it.t1);
      if (e <= 0) continue;
      if (it.k === 'c') { it.fn(ctx, e, o, s); continue; }
      var col = resolveColor(it.color, colors, d, mono, it.k);
      if (col == null) continue;
      switch (it.k) {
        case 's':
          ctx.fillStyle = col;
          if (it.alpha != null) ctx.globalAlpha = baseAlpha * it.alpha;
          fillStroke(ctx, it.g, e, wk);
          if (it.alpha != null) ctx.globalAlpha = baseAlpha;
          break;
        case 'f':
          drawFill(ctx, it, col, e, off, s, mono, baseAlpha);
          break;
        case 'd':
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(it.x, it.y, it.r * (e < 1 ? 0.4 + 0.6 * e : 1) * Math.sqrt(wk), 0, TAU);
          ctx.fill();
          break;
        case 'r':
          ctx.strokeStyle = col;
          ctx.lineWidth = it.w / s;
          ctx.lineCap = it.cap || 'butt';
          if (it.alpha != null) ctx.globalAlpha = baseAlpha * it.alpha;
          if (it.dash) ctx.setLineDash([it.dash[0] / s, it.dash[1] / s]);
          ctx.beginPath();
          ctx.moveTo(it.x0, it.y0);
          ctx.lineTo(lerp(it.x0, it.x1, e), lerp(it.y0, it.y1, e));
          ctx.stroke();
          if (it.dash) ctx.setLineDash([]);
          if (it.alpha != null) ctx.globalAlpha = baseAlpha;
          break;
        case 'rc':
          if (it.alpha != null) ctx.globalAlpha = baseAlpha * it.alpha;
          if (it.fill) {
            var fc = resolveColor(it.fill, colors, d, mono, 'rf');
            if (fc) {
              ctx.fillStyle = fc;
              ctx.globalAlpha *= e;
              ctx.beginPath();
              ctx.arc(it.x, it.y, it.r, 0, TAU);
              ctx.fill();
              ctx.globalAlpha = baseAlpha * (it.alpha == null ? 1 : it.alpha);
            }
          }
          if (it.stroke) {
            ctx.strokeStyle = col;
            ctx.lineWidth = it.w / s;
            ctx.beginPath();
            ctx.arc(it.x, it.y, it.r, it.a0, it.a0 + TAU * e);
            ctx.stroke();
          }
          if (it.alpha != null) ctx.globalAlpha = baseAlpha;
          break;
        case 'rf':
          ctx.fillStyle = col;
          ctx.globalAlpha = baseAlpha * (it.alpha == null ? 1 : it.alpha) * e;
          ctx.fill(it.path);
          ctx.globalAlpha = baseAlpha;
          break;
        case 'o':
          ctx.save();
          ctx.globalAlpha = baseAlpha * e;
          ctx.translate(it.a.ox * off * it.a.off, it.a.oy * off * it.a.off);
          ctx.clip(it.a.path);
          ctx.translate(-it.a.ox * off * it.a.off + it.b.ox * off * it.b.off, -it.a.oy * off * it.a.off + it.b.oy * off * it.b.off);
          ctx.fillStyle = col;
          ctx.fill(it.b.path);
          ctx.restore();
          break;
        case 'g':
          glow(ctx, it.x, it.y, it.r, col, it.alpha * e, it.add);
          break;
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // Immediate mode (screen units). Geometry is cached on the identity of the points array.

  var geomCache = new WeakMap();
  var keyCache = new LRU(400);
  function sig(o, kind) {
    return kind + '|' + (o.w || 3) + '|' + (o.profile || '') + '|' + (o.dot || '') + '|' + (o.startDot || '') + '|' +
      (o.closed ? 1 : 0) + '|' + (o.seed == null ? '' : o.seed) + '|' + (o.second || '') + '|' + (o.fillScale || '');
  }
  function cached(pts, o, kind, build) {
    var key = sig(o, kind);
    if (pts && typeof pts === 'object') {
      var m = geomCache.get(pts);
      if (!m) { m = new Map(); geomCache.set(pts, m); }
      var g = m.get(key);
      if (!g) { g = build(); m.set(key, g); }
      return g;
    }
    return build();
  }

  ink.line = function (ctx, pts, o) {
    o = o || {};
    var g = cached(pts, o, 'l', function () { return strokeGeom(pts, o); });
    var a = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a * o.alpha;
    ctx.fillStyle = o.color || M().tinta;
    fillStroke(ctx, g, o.p == null ? 1 : o.p, o.weight || 1);
    ctx.globalAlpha = a;
    return g;
  };

  function drawShapeNow(ctx, g, o) {
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return g;
    var hasLine = o.line !== false && g.outline;
    var pl = hasLine ? segment(p, 0, 0.72) : 0;
    var pf = hasLine ? segment(p, 0.58, 1) : segment(p, 0, 1);
    if (o.fill && pf > 0) {
      drawFill(ctx, { path: g.path, cx: g.cx, cy: g.cy, ox: g.ox, oy: g.oy, off: 1, tex: o.tex !== false, edge: o.edge !== false,
        alpha: o.fillAlpha }, o.fill, pf, o.offset != null ? o.offset : 3, 1, false, ctx.globalAlpha);
    }
    if (hasLine && pl > 0) {
      ctx.fillStyle = o.lineColor || M().tinta;
      fillStroke(ctx, g.outline, pl, o.weight || 1);
    }
    return g;
  }
  ink.shape = function (ctx, pts, o) {
    o = o || {};
    var g = cached(pts, o, o.sharp ? 's#' : 's', function () { return shapeGeom(pts, o); });
    return drawShapeNow(ctx, g, o);
  };
  ink.blob = function (ctx, cx, cy, rx, ry, o) {
    o = o || {};
    var key = 'blob|' + cx + '|' + cy + '|' + rx + '|' + ry + '|' + (o.seed || '') + '|' + (o.n || 9) + '|' + (o.irr == null ? '' : o.irr) +
      '|' + (o.rot || 0) + '|' + sig(o, 'b');
    var g = keyCache.get(key);
    if (!g) {
      var r = rng((o.seed || 'blob') + ':pts');
      g = keyCache.set(key, shapeGeom(blobPoints(r, cx, cy, rx, ry, o.n || 9, o.irr, o.rot), o));
    }
    return drawShapeNow(ctx, g, o);
  };
  ink.circle = function (ctx, cx, cy, rad, o) {
    o = o || {};
    var copy = {};
    for (var k in o) copy[k] = o[k];
    copy.n = o.n || 12;
    copy.irr = o.irr != null ? o.irr : 0.03;
    return ink.blob(ctx, cx, cy, rad, rad, copy);
  };
  ink.dot = function (ctx, x, y, rad, color) {
    ctx.fillStyle = color || M().tinta;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.fill();
  };

  // Hand-dabbed dots along a smooth path (dotted lines such as "asociación").
  ink.dotted = function (ctx, pts, o) {
    o = o || {};
    var key = 'dotted|' + sig(o, 'd') + '|' + (o.gap || 9);
    var g = cached(pts, o, key, function () {
      var path = smoothPath(pts, !!o.closed, 1.5), gap = o.gap || 9, out = [], acc = 0, r = rng((o.seed || 'dotted') + ':d');
      for (var i = 1; i < path.n; i++) {
        var l = Math.sqrt(d2(path.x[i - 1], path.y[i - 1], path.x[i], path.y[i]));
        acc += l;
        if (acc >= gap || i === 1) { out.push(path.x[i], path.y[i], 1 + r.jitter(0.18)); acc = 0; }
      }
      return out;
    });
    var p = o.p == null ? 1 : o.p, n = g.length / 3, show = Math.round(n * clamp(p, 0, 1)), rad = o.r || 2.2;
    ctx.fillStyle = o.color || M().tinta;
    ctx.beginPath();
    for (var j = 0; j < show; j++) {
      ctx.moveTo(g[3 * j] + rad * g[3 * j + 2], g[3 * j + 1]);
      ctx.arc(g[3 * j], g[3 * j + 1], rad * g[3 * j + 2], 0, TAU);
    }
    ctx.fill();
    return g;
  };

  // Calligraphic arrow: brush line + open arrowhead (two strokes) at the end. o.dotted for a dotted
  // shaft, o.head 'open' | 'none', o.headSize (px).
  ink.arrow = function (ctx, pts, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    var c = flat(pts);
    var pShaft = segment(p, 0, 0.8), pHead = segment(p, 0.75, 1);
    if (o.dotted) ink.dotted(ctx, pts, { p: pShaft, color: o.color, r: o.dotR || Math.max(1.6, (o.w || 3) * 0.6), gap: o.gap, seed: o.seed });
    else ink.line(ctx, pts, { w: o.w || 3, p: pShaft, color: o.color, seed: o.seed, profile: o.profile || 'lift' });
    if (o.head === 'none' || pHead <= 0) return;
    var n = c.length;
    var ex = c[n - 2], ey = c[n - 1], bx = c[n - 4], by = c[n - 3];
    var a = Math.atan2(ey - by, ex - bx), hs = o.headSize || 14, spread = 0.5;
    var key = 'ahead|' + ex + '|' + ey + '|' + a + '|' + hs + '|' + (o.w || 3) + '|' + (o.seed || '');
    var head = keyCache.get(key);
    if (!head) {
      var hw = (o.w || 3) * 0.95;
      head = keyCache.set(key, [
        strokeGeom([ex - Math.cos(a - spread) * hs, ey - Math.sin(a - spread) * hs, ex, ey], { w: hw, profile: 'press', seed: (o.seed || 'arrow') + 'l' }),
        strokeGeom([ex - Math.cos(a + spread) * hs, ey - Math.sin(a + spread) * hs, ex, ey], { w: hw, profile: 'press', seed: (o.seed || 'arrow') + 'r' })
      ]);
    }
    ctx.fillStyle = o.color || M().tinta;
    fillStroke(ctx, head[0], pHead, 1);
    fillStroke(ctx, head[1], pHead, 1);
  };

  // Wavy brush line from (x0, y) to (x1, y): o.amp, o.len (wavelength), o.dot (ends in a dot).
  ink.wavePoints = function (x0, y, x1, amp, len, phase) {
    var pts = [], n = Math.max(3, Math.round((x1 - x0) / (len / 4)));
    for (var i = 0; i <= n; i++) {
      var x = lerp(x0, x1, i / n);
      pts.push(x, y + Math.sin((x - x0) / len * TAU + (phase || 0)) * amp);
    }
    return pts;
  };
  ink.wave = function (ctx, x0, y, x1, o) {
    o = o || {};
    var key = 'wave|' + x0 + '|' + y + '|' + x1 + '|' + (o.amp || 4) + '|' + (o.len || 40) + '|' + (o.phase || 0) + '|' + sig(o, 'w');
    var g = keyCache.get(key);
    if (!g) g = keyCache.set(key, strokeGeom(ink.wavePoints(x0, y, x1, o.amp || 4, o.len || 40, o.phase), o));
    ctx.fillStyle = o.color || M().tinta;
    var a = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a * o.alpha;
    fillStroke(ctx, g, o.p == null ? 1 : o.p, o.weight || 1);
    ctx.globalAlpha = a;
    return g;
  };

  // Ink spatter: a seeded burst of drops around (x, y) within radius r.
  ink.spatter = function (ctx, x, y, rad, o) {
    o = o || {};
    var r = rng((o.seed || 'spatter') + ':' + Math.round(rad));
    var n = o.n || 34, p = o.p == null ? 1 : o.p;
    ctx.fillStyle = o.color || M().tinta;
    var a = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a * o.alpha;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var ang = r() * TAU, dist = rad * Math.pow(r(), 0.7), sz = (o.size || 4.2) * Math.pow(1 - dist / rad, 1.1) * r.range(0.35, 1.3) + 0.7;
      if (i / n > p) break;
      var px = x + Math.cos(ang) * dist, py = y + Math.sin(ang) * dist;
      if (r() < 0.22) {
        ctx.moveTo(px, py);
        ctx.ellipse(px, py, sz * 1.9, sz * 0.7, ang, 0, TAU);
      } else {
        ctx.moveTo(px + sz, py);
        ctx.arc(px, py, sz, 0, TAU);
      }
    }
    ctx.fill();
    ctx.globalAlpha = a;
  };

  // A tidy cluster of similar dots (the human counterpart of a ruled grid of points).
  ink.dotCluster = function (ctx, x, y, rad, o) {
    o = o || {};
    var r = rng((o.seed || 'cluster') + ':' + Math.round(rad));
    var n = o.n || 9, size = o.size || 2.6, p = o.p == null ? 1 : o.p;
    ctx.fillStyle = o.color || M().tinta;
    ctx.beginPath();
    for (var i = 0; i < n && i / n < p; i++) {
      var a = i * 2.39996 + r.jitter(0.4), d = rad * Math.sqrt((i + 0.5) / n) + r.jitter(rad * 0.08);
      var px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, sz = size * r.range(0.75, 1.2);
      ctx.moveTo(px + sz, py);
      ctx.arc(px, py, sz, 0, TAU);
    }
    ctx.fill();
  };

  // Loose concentric calligraphic loops (territory contours).
  ink.contours = function (ctx, x, y, rx, ry, o) {
    o = o || {};
    var key = 'contours|' + x + '|' + y + '|' + rx + '|' + ry + '|' + (o.n || 4) + '|' + (o.seed || '');
    var list = keyCache.get(key);
    if (!list) {
      var r = rng((o.seed || 'contours') + ':c');
      list = [];
      var n = o.n || 4;
      for (var i = 0; i < n; i++) {
        var k = 1 - i / (n + 0.6);
        list.push(strokeGeom(blobPoints(r, x + r.jitter(rx * 0.05), y + r.jitter(ry * 0.05), rx * k, ry * k, 9, 0.12),
          { closed: true, w: o.w || 1.6, seed: (o.seed || 'contours') + i, profile: 'outline' }));
      }
      keyCache.set(key, list);
    }
    var p = o.p == null ? 1 : o.p;
    ctx.fillStyle = o.color || M().tinta;
    var a = ctx.globalAlpha;
    if (o.alpha != null) ctx.globalAlpha = a * o.alpha;
    for (var j = 0; j < list.length; j++) fillStroke(ctx, list[j], segment(p, j / list.length * 0.6, j / list.length * 0.6 + 0.4), 1);
    ctx.globalAlpha = a;
  };

  // ---------------------------------------------------------------------------------------------
  // Ruled primitives (the machine): straight, thin, regular, crisp.

  function ruledStyle(ctx, o, def) {
    ctx.strokeStyle = o.color || def || P().maquina.linea;
    ctx.lineWidth = o.w || 1.25;
    ctx.lineCap = o.cap || 'butt';
    if (o.dash) ctx.setLineDash(o.dash);
  }
  ink.rLine = function (ctx, x0, y0, x1, y1, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    ruledStyle(ctx, o);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p));
    ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  };
  ink.rRect = function (ctx, x, y, w, h, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    if (o.fill) {
      var a = ctx.globalAlpha;
      ctx.globalAlpha = a * (o.fillAlpha == null ? 1 : o.fillAlpha) * clamp(p * 3, 0, 1);
      ctx.fillStyle = o.fill;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = a;
    }
    if (o.stroke === false) return;
    ruledStyle(ctx, o);
    var per = 2 * (w + h), L = per * p;
    ctx.beginPath();
    ctx.moveTo(x, y);
    var segs = [[x + w, y, w], [x + w, y + h, h], [x, y + h, w], [x, y, h]], cx = x, cy = y;
    for (var i = 0; i < 4 && L > 0; i++) {
      var sg = segs[i], f = Math.min(1, L / sg[2]);
      ctx.lineTo(lerp(cx, sg[0], f), lerp(cy, sg[1], f));
      L -= sg[2]; cx = sg[0]; cy = sg[1];
    }
    ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  };
  ink.rCircle = function (ctx, cx, cy, rad, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, TAU);
      ctx.fill();
    }
    if (o.stroke === false) return;
    ruledStyle(ctx, o);
    var a0 = o.a0 == null ? -Math.PI / 2 : o.a0;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, a0, a0 + TAU * p);
    ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  };
  ink.rPoly = function (ctx, pts, o) {
    o = o || {};
    var c = flat(pts);
    if (c.length < 4) return;
    ruledStyle(ctx, o);
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    for (var i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]);
    if (o.closed) ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    if (o.stroke !== false) ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  };
  // Ruled arrow with a small open head.
  ink.rArrow = function (ctx, x0, y0, x1, y1, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    var ex = lerp(x0, x1, p), ey = lerp(y0, y1, p);
    ink.rLine(ctx, x0, y0, ex, ey, o);
    var a = Math.atan2(y1 - y0, x1 - x0), hs = o.headSize || 9;
    ruledStyle(ctx, o);
    ctx.beginPath();
    ctx.moveTo(ex - Math.cos(a - 0.45) * hs, ey - Math.sin(a - 0.45) * hs);
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex - Math.cos(a + 0.45) * hs, ey - Math.sin(a + 0.45) * hs);
    ctx.stroke();
  };

  // ---------------------------------------------------------------------------------------------
  // Cached layers and backgrounds (prompt §3.6). Layers are rendered once at device resolution.

  var layerCache = new LRU(26e6, function (c) { return c.width * c.height; });
  function layer(ctx, key, w, h, render) {
    var ds = deviceScale(ctx);
    var k = key + '@' + ds;
    var c = layerCache.get(k);
    if (!c) {
      c = makeCanvas(w * ds, h * ds);
      var g = c.getContext('2d');
      g.scale(ds, ds);
      render(g, w, h);
      layerCache.set(k, c);
    }
    return c;
  }
  ink.layer = layer;
  ink.drawLayer = function (ctx, key, x, y, w, h, render) {
    var c = layer(ctx, key, w, h, render);
    ctx.drawImage(c, x, y, w, h);
    return c;
  };
  ink.clearLayers = function () { layerCache.clear(); };

  // Soft elliptical blob of color (radial falloff) — the unit of washes.
  function softBlob(g, cx, cy, rx, ry, color, alpha, rot) {
    g.save();
    g.translate(cx, cy);
    if (rot) g.rotate(rot);
    g.scale(1, ry / rx);
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, P().rgba(color, alpha));
    gr.addColorStop(0.55, P().rgba(color, alpha * 0.55));
    gr.addColorStop(1, P().rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }

  function washInto(g, w, h, o) {
    var r = rng((o.seed || 'wash') + ':w');
    var n = o.blobs || 7, cols = o.colors || [o.color || M().lienzoOcre];
    for (var i = 0; i < n; i++) {
      var rx = r.range(0.2, 0.55) * Math.max(w, h), ry = rx * r.range(0.35, 0.7);
      softBlob(g, r() * w, r() * h, rx, ry, cols[i % cols.length], (o.alpha || 0.16) * r.range(0.6, 1.2), r.jitter(0.4));
    }
    // Brush streaks in the wash's own colors (a shade darker or lighter): uneven saturation, the
    // gouache hand. Never grey: grey streaks read as dirt.
    if (o.streaks) {
      g.lineCap = 'round';
      var ns = o.streakCount || Math.round(w * h / 12000);
      for (i = 0; i < ns; i++) {
        var x = r() * w, y = r() * h, l = r.range(60, 220), a = (o.streakAngle || 0) + r.jitter(0.08);
        var base = cols[i % cols.length];
        g.strokeStyle = P().rgba(P().shade(base, r() < 0.5 ? -0.12 : 0.25), r.range(0.04, 0.09));
        g.lineWidth = r.range(6, 22);
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + r.jitter(4), x + Math.cos(a) * l, y + Math.sin(a) * l);
        g.stroke();
      }
    }
  }

  function grainInto(g, w, h, alpha) {
    var a = g.globalAlpha;
    g.globalAlpha = alpha == null ? 1 : alpha;
    g.fillStyle = grainPattern(g);
    g.fillRect(0, 0, w, h);
    g.globalAlpha = a;
  }

  function notebookInto(g, w, h, o) {
    var gap = o.spacing || 34, top = o.top == null ? 92 : o.top, m = M();
    g.strokeStyle = P().rgba(m.azul, o.lineAlpha || 0.085);
    g.lineWidth = 1;
    g.beginPath();
    for (var y = top; y < h - 12; y += gap) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(w, Math.round(y) + 0.5); }
    g.stroke();
    if (o.margin !== false) {
      var mx = o.margin == null ? 104 : o.margin;
      g.strokeStyle = P().rgba(m.rojo, 0.2);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(mx + 0.5, 0); g.lineTo(mx + 0.5, h);
      g.stroke();
      g.strokeStyle = P().rgba(m.rojo, 0.1);
      g.beginPath();
      g.moveTo(mx + 4.5, 0); g.lineTo(mx + 4.5, h);
      g.stroke();
    }
  }

  function dotGridInto(g, w, h, o) {
    var gap = o.spacing || 24, m = M();
    g.fillStyle = P().rgba(m.tinta, o.dotAlpha || 0.11);
    g.beginPath();
    for (var y = gap; y < h; y += gap) {
      for (var x = gap; x < w; x += gap) { g.moveTo(x + 1.1, y); g.arc(x, y, 1.1, 0, TAU); }
    }
    g.fill();
  }

  function vignetteInto(g, w, h, color, alpha) {
    var gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
    gr.addColorStop(0, P().rgba(color, 0));
    gr.addColorStop(1, P().rgba(color, alpha));
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }

  function paperInto(g, w, h, o) {
    var m = M();
    g.fillStyle = o.color || m.lienzo;
    g.fillRect(0, 0, w, h);
    washInto(g, w, h, { seed: o.seed, color: m.lienzoOcre, alpha: o.wash == null ? 0.2 : o.wash, blobs: 8 });
    if (o.lines === 'notebook') notebookInto(g, w, h, o);
    else if (o.lines === 'dots') dotGridInto(g, w, h, o);
    grainInto(g, w, h, 1);
    vignetteInto(g, w, h, m.madera, 0.07);
  }

  /* ink.paper(ctx, x, y, w, h, opts): cream lienzo with a soft gouache wash and grain (cached).
   * opts: seed, lines ('notebook' | 'dots' | 'none'), margin (x of the margin line, false = none),
   *   spacing, wash (0..1 strength), color. */
  ink.paper = function (ctx, x, y, w, h, o) {
    o = o || {};
    var key = 'paper|' + w + '|' + h + '|' + (o.seed || '') + '|' + (o.lines || '') + '|' + o.margin + '|' + (o.spacing || '') +
      '|' + (o.wash == null ? '' : o.wash) + '|' + (o.color || '') + '|' + (o.top == null ? '' : o.top);
    return ink.drawLayer(ctx, key, x, y, w, h, function (g) { paperInto(g, w, h, o); });
  };

  /* ink.wash(ctx, x, y, w, h, opts): soft, bleeding color wash (cached). opts: color | colors,
   * alpha, blobs, seed, base (solid color under the wash), streaks, streakAngle. */
  ink.wash = function (ctx, x, y, w, h, o) {
    o = o || {};
    var key = 'wash|' + w + '|' + h + '|' + (o.seed || '') + '|' + (o.color || '') + '|' + (o.colors || '') + '|' + (o.alpha || '') +
      '|' + (o.blobs || '') + '|' + (o.base || '') + '|' + (o.streakAngle || 0);
    return ink.drawLayer(ctx, key, x, y, w, h, function (g) {
      if (o.base) { g.fillStyle = o.base; g.fillRect(0, 0, w, h); }
      washInto(g, w, h, o);
    });
  };

  ink.grain = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
  ink.notebookLines = function (ctx, x, y, w, h, o) {
    ctx.save(); ctx.translate(x, y); notebookInto(ctx, w, h, o || {}); ctx.restore();
  };
  ink.dotGrid = function (ctx, x, y, w, h, o) {
    ctx.save(); ctx.translate(x, y); dotGridInto(ctx, w, h, o || {}); ctx.restore();
  };

  function machineInto(g, w, h, o) {
    var q = P().maquina, cell = o.cell || 16;
    g.fillStyle = q.noche;
    g.fillRect(0, 0, w, h);
    g.lineWidth = 1;
    g.strokeStyle = P().rgba(q.rejilla, 0.72);
    g.beginPath();
    var x, y;
    for (x = cell; x < w; x += cell) { g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, h); }
    for (y = cell; y < h; y += cell) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(w, Math.round(y) + 0.5); }
    g.stroke();
    g.strokeStyle = P().rgba(P().mix(q.rejilla, q.linea, 0.25), 0.5);
    g.beginPath();
    for (x = cell * 5; x < w; x += cell * 5) { g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, h); }
    for (y = cell * 5; y < h; y += cell * 5) { g.moveTo(0, Math.round(y) + 0.5); g.lineTo(w, Math.round(y) + 0.5); }
    g.stroke();
    if (o.ticks !== false) {
      g.strokeStyle = P().rgba(q.linea, 0.55);
      g.beginPath();
      for (x = 0; x <= w; x += cell / 2) {
        var tl = x % (cell * 5) === 0 ? 9 : x % cell === 0 ? 5 : 2.5;
        g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, tl);
        g.moveTo(Math.round(x) + 0.5, h); g.lineTo(Math.round(x) + 0.5, h - tl);
      }
      for (y = 0; y <= h; y += cell / 2) {
        var tl2 = y % (cell * 5) === 0 ? 9 : y % cell === 0 ? 5 : 2.5;
        g.moveTo(0, Math.round(y) + 0.5); g.lineTo(tl2, Math.round(y) + 0.5);
        g.moveTo(w, Math.round(y) + 0.5); g.lineTo(w - tl2, Math.round(y) + 0.5);
      }
      g.stroke();
    }
    if (o.construction !== false) {
      var R = Math.min(w, h) * 0.36, cx = w * (o.cx == null ? 0.62 : o.cx), cy = h * (o.cy == null ? 0.5 : o.cy);
      g.strokeStyle = P().rgba(q.linea, 0.13);
      g.beginPath();
      g.arc(cx, cy, R, 0, TAU);
      g.moveTo(cx + R * 0.55, cy); g.arc(cx, cy, R * 0.55, 0, TAU);
      g.moveTo(cx - R * 1.15, cy); g.lineTo(cx + R * 1.15, cy);
      g.moveTo(cx, cy - R * 1.15); g.lineTo(cx, cy + R * 1.15);
      g.moveTo(0, h); g.lineTo(w, 0);
      g.stroke();
      g.setLineDash([3, 5]);
      g.beginPath();
      g.moveTo(0, cy * 0.5); g.lineTo(w, cy * 0.5);
      g.stroke();
      g.setLineDash([]);
    }
    if (o.border !== false) {
      g.strokeStyle = P().rgba(q.linea, 0.7);
      g.lineWidth = 1.25;
      g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    }
  }

  /* ink.machineGrid(ctx, x, y, w, h, opts): deep navy field with a fine regular grid, measurement
   * ticks and thin construction lines — the world of benchmarks and controlled conditions (cached).
   * opts: cell (grid pitch, 16), ticks, construction, border (all default true), cx/cy (0..1). */
  ink.machineGrid = function (ctx, x, y, w, h, o) {
    o = o || {};
    var key = 'machine|' + w + '|' + h + '|' + (o.cell || 16) + '|' + (o.ticks !== false) + '|' + (o.construction !== false) +
      '|' + (o.border !== false) + '|' + o.cx + '|' + o.cy;
    return ink.drawLayer(ctx, key, x, y, w, h, function (g) { machineInto(g, w, h, o); });
  };

  function territoryInto(g, w, h, o) {
    var m = M(), hy = h * (o.horizon == null ? 0.56 : o.horizon);
    var sky = g.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, P().mix(m.celeste, m.lienzo, 0.35));
    sky.addColorStop(1, P().mix(m.celeste, m.lienzo, 0.72));
    g.fillStyle = sky;
    g.fillRect(0, 0, w, hy + 2);
    washInto(g, w, hy, { seed: (o.seed || 'terr') + 'sky', colors: [m.lienzo, m.celeste], alpha: 0.22, blobs: 6, streakAngle: 0 });
    g.fillStyle = m.lienzoOcre;
    g.fillRect(0, hy, w, h - hy);
    g.save();
    g.translate(0, hy);
    washInto(g, w, h - hy, { seed: (o.seed || 'terr') + 'ground', colors: [m.tierra, m.lienzo, m.lienzoOcre, m.siena], alpha: 0.2, blobs: 9, streakAngle: 0.04, streaks: true });
    g.restore();
    grainInto(g, w, h, 1);
    g.fillStyle = m.tinta;
    var hz = strokeGeom(ink.wavePoints(-10, hy, w + 10, 3, w * 0.7, 0.4), { w: 4.2, seed: (o.seed || 'terr') + 'hz', profile: 'blunt' });
    fillStroke(g, hz, 1, 1);
    if (o.contours !== false) {
      var r = rng((o.seed || 'terr') + 'contours');
      var nC = o.contourCount || 2;
      for (var i = 0; i < nC; i++) {
        var cx = w * r.range(0.15, 0.85), cy = hy + (h - hy) * r.range(0.35, 0.7);
        g.globalAlpha = 0.5;
        ink.contours(g, Math.round(cx), Math.round(cy), Math.round(r.range(90, 170)), Math.round(r.range(28, 52)), { n: 4, seed: (o.seed || 'terr') + 'c' + i, w: 1.4 });
        g.globalAlpha = 1;
      }
    }
  }

  function seaInto(g, w, h, o) {
    var m = M(), q = P().maquina, hy = h * (o.horizon == null ? 0.5 : o.horizon);
    var sky = g.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, q.noche);
    sky.addColorStop(1, P().mix(q.noche, m.azul, 0.55));
    g.fillStyle = sky;
    g.fillRect(0, 0, w, hy + 2);
    washInto(g, w, hy, { seed: (o.seed || 'sea') + 'sky', colors: [m.azul, q.noche], alpha: 0.28, blobs: 6 });
    var sea = g.createLinearGradient(0, hy, 0, h);
    sea.addColorStop(0, m.azul);
    sea.addColorStop(1, P().mix(m.azul, q.noche, 0.6));
    g.fillStyle = sea;
    g.fillRect(0, hy, w, h - hy);
    g.save();
    g.translate(0, hy);
    washInto(g, w, h - hy, { seed: (o.seed || 'sea') + 'water', colors: [q.noche, m.azul, m.celeste], alpha: 0.18, blobs: 8, streaks: true });
    g.restore();
    grainInto(g, w, h, 0.8);
    // Calligraphic waves in the water.
    var r = rng((o.seed || 'sea') + 'waves');
    var nW = o.waves == null ? 9 : o.waves;
    for (var i = 0; i < nW; i++) {
      var y = hy + 24 + (h - hy - 40) * (i + r() * 0.6) / nW;
      var x0 = r.range(-60, w * 0.6), len = r.range(160, 420);
      var gw = strokeGeom(ink.wavePoints(x0, y, x0 + len, r.range(4, 8), r.range(80, 140), r() * 6),
        { w: r.range(2.6, 4.6), seed: 'w' + i, profile: 'swell', dot: r() < 0.3 ? 'detached' : false });
      g.fillStyle = P().rgba(r() < 0.6 ? m.celeste : m.lienzo, r.range(0.55, 0.85));
      fillStroke(g, gw, 1, 1);
    }
    g.fillStyle = P().rgba(m.celeste, 0.7);
    fillStroke(g, strokeGeom(ink.wavePoints(-10, hy, w + 10, 2, w, 0), { w: 2.2, seed: 'sea-hz', profile: 'even' }), 1, 1);
  }

  /* ink.background(ctx, kind, opts) — full-frame scene grounds of prompt §3.6 (cached):
   *   'personas'   cream lienzo, soft wash, faint notebook lines and margin line
   *   'datos'      cream lienzo with the faint dot grid of the notebook's graph page
   *   'territorio' sky and mottled ochre washes, horizon as one calligraphic line, contour loops
   *   'mar'        ultramarine and noche washes with calligraphic waves (moon and stars: figures)
   *   'maquina'    deep navy field, fine regular grid, ticks and construction lines
   * opts: w, h (default 1280×720), x, y, seed, plus the kind's own options (horizon, waves, …). */
  ink.background = function (ctx, kind, o) {
    o = o || {};
    var w = o.w || 1280, h = o.h || 720, x = o.x || 0, y = o.y || 0;
    switch (kind) {
      case 'datos':
        return ink.paper(ctx, x, y, w, h, { seed: o.seed || 'datos', lines: 'dots', spacing: o.spacing });
      case 'maquina':
        return ink.machineGrid(ctx, x, y, w, h, o);
      case 'territorio':
        return ink.drawLayer(ctx, 'terr|' + w + '|' + h + '|' + (o.seed || '') + '|' + o.horizon + '|' + o.contours + '|' + (o.contourCount || ''), x, y, w, h,
          function (g) { territoryInto(g, w, h, o); });
      case 'mar':
        return ink.drawLayer(ctx, 'sea|' + w + '|' + h + '|' + (o.seed || '') + '|' + o.horizon + '|' + o.waves, x, y, w, h,
          function (g) { seaInto(g, w, h, o); });
      case 'lienzo':
        return ink.paper(ctx, x, y, w, h, { seed: o.seed || 'lienzo', lines: 'none' });
      default:
        return ink.paper(ctx, x, y, w, h, { seed: o.seed || 'personas', lines: 'notebook', margin: o.margin, spacing: o.spacing });
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Glow: a pre-rendered radial sprite per color (no per-frame shadowBlur).

  var glowCache = {};
  function glowSprite(color) {
    var c = glowCache[color];
    if (c) return c;
    var S = 128;
    c = makeCanvas(S, S);
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, P().rgba(color, 0.95));
    gr.addColorStop(0.22, P().rgba(color, 0.55));
    gr.addColorStop(0.55, P().rgba(color, 0.16));
    gr.addColorStop(1, P().rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    glowCache[color] = c;
    return c;
  }
  function glow(ctx, x, y, rad, color, alpha, add) {
    if (!(rad > 0) || alpha <= 0) return;
    var c = glowSprite(color || P().maquina.linea);
    var a = ctx.globalAlpha, op = ctx.globalCompositeOperation;
    ctx.globalAlpha = a * (alpha == null ? 1 : alpha);
    if (add) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(c, x - rad, y - rad, rad * 2, rad * 2);
    ctx.globalAlpha = a;
    if (add) ctx.globalCompositeOperation = op;
  }
  ink.glow = glow;

  // ---------------------------------------------------------------------------------------------
  // Text: fonts, wrapping, measuring (never truncates verbatim copy).

  var FONTS = {
    sans: '"EIA Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    display: '"EIA Display", Georgia, "Times New Roman", serif'
  };
  ink.FONTS = FONTS;
  function fontString(o) {
    return (o.italic ? 'italic ' : '') + (o.weight || 400) + ' ' + (o.size || 18) + 'px ' + (FONTS[o.font || 'sans'] || o.font);
  }
  ink.font = fontString;

  function fontsReady(font) {
    try { return !hasDOM || !document.fonts || document.fonts.check(font); } catch (e) { return true; }
  }

  function wrapLines(ctx, text, maxWidth, font) {
    ctx.font = font;
    var paragraphs = String(text == null ? '' : text).split('\n'), lines = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var words = paragraphs[p].split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(''); continue; }
      var cur = words[0];
      for (var i = 1; i < words.length; i++) {
        var test = cur + ' ' + words[i];
        if (!maxWidth || ctx.measureText(test).width <= maxWidth) cur = test;
        else { lines.push(cur); cur = words[i]; }
      }
      lines.push(cur);
    }
    return lines;
  }
  ink.wrap = function (ctx, text, maxWidth, font) { return wrapLines(ctx, text, maxWidth, font || fontString({})); };

  var textLayoutCache = new LRU(600);
  /* ink.measureText(ctx, text, opts) -> { lines, w, h, size, lineH, font, overflow }
   * opts: size (18), weight (400), italic, font ('sans' | 'display'), maxWidth, maxLines, lineHeight
   *   (1.3), fit (shrink until it fits maxLines/maxHeight), minSize, maxHeight. */
  function measureText(ctx, text, o) {
    o = o || {};
    var key = text + '|' + (o.size || 18) + '|' + (o.weight || 400) + '|' + (o.italic ? 1 : 0) + '|' + (o.font || '') + '|' +
      (o.maxWidth || 0) + '|' + (o.maxLines || 0) + '|' + (o.lineHeight || '') + '|' + (o.fit ? 1 : 0) + '|' + (o.minSize || '') + '|' + (o.maxHeight || '');
    var hit = textLayoutCache.get(key);
    if (hit) return hit;
    var size = o.size || 18, minSize = o.minSize || Math.max(10, size * 0.6), lh = o.lineHeight || 1.3, lines, font, w, h, overflow = false;
    for (;;) {
      font = fontString({ size: size, weight: o.weight, italic: o.italic, font: o.font });
      lines = wrapLines(ctx, text, o.maxWidth, font);
      w = 0;
      for (var i = 0; i < lines.length; i++) w = Math.max(w, ctx.measureText(lines[i]).width);
      h = (lines.length - 1) * size * lh + size * 1.22;
      var tooMany = o.maxLines && lines.length > o.maxLines;
      var tooTall = o.maxHeight && h > o.maxHeight;
      var tooWide = o.maxWidth && w > o.maxWidth + 0.5;
      if (!(o.fit && (tooMany || tooTall || tooWide))) { overflow = !!(tooMany || tooTall || tooWide); break; }
      if (size <= minSize) { overflow = true; break; }
      size = Math.max(minSize, size * 0.94);
    }
    var out = { lines: lines, w: w, h: h, size: size, lineH: size * lh, font: font, overflow: overflow };
    if (fontsReady(font)) textLayoutCache.set(key, out);
    return out;
  }
  ink.measureText = measureText;

  /* ink.text(ctx, text, x, y, opts) -> layout. (x, y) is the top of the block; x is the left edge,
   * the center or the right edge for align 'left' | 'center' | 'right'. opts as measureText plus
   * color (tinta), align, p (fade-in 0→1), alpha. */
  ink.text = function (ctx, text, x, y, o) {
    o = o || {};
    var L = measureText(ctx, text, o);
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return L;
    ctx.save();
    ctx.font = L.font;
    ctx.fillStyle = o.color || M().tinta;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = o.align || 'left';
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha) * clamp(p, 0, 1);
    for (var i = 0; i < L.lines.length; i++) ctx.fillText(L.lines[i], x, y + L.size * 0.96 + i * L.lineH);
    ctx.restore();
    return L;
  };

  // ---------------------------------------------------------------------------------------------
  // Brush lettering: thick black letters written glyph by glyph, each with a tiny seeded rotation
  // and offset, some counters filled with flat color, small stars or dots between words, and a
  // wavy underline ending in a dot.

  var glyphW = new Map();
  function glyphWidth(ctx, font, ch) {
    var k = font + '\u0001' + ch;
    var w = glyphW.get(k);
    if (w === undefined) {
      ctx.font = font;
      w = ctx.measureText(ch).width;
      if (fontsReady(font)) glyphW.set(k, w);
    }
    return w;
  }

  var counterCache = new Map();
  // Finds the enclosed holes of a glyph by flood-filling its exterior on a 2× offscreen render.
  function counterMask(ch, font, size, brushW) {
    var key = font + '\u0001' + ch + '\u0001' + brushW;
    if (counterCache.has(key)) return counterCache.get(key);
    var S = 2, pad = Math.ceil(size * 0.35), base = Math.ceil(size * 1.2);
    var cw = Math.ceil((size * 1.4 + pad * 2) * S), ch2 = Math.ceil((size * 1.7) * S);
    var c = makeCanvas(cw, ch2);
    var g = c.getContext('2d', { willReadFrequently: true });
    g.scale(S, S);
    g.font = font;
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#000';
    g.fillText(ch, pad, base);
    if (brushW) { g.lineJoin = 'round'; g.lineWidth = brushW; g.strokeStyle = '#000'; g.strokeText(ch, pad, base); }
    var W = cw, H = ch2, img = g.getImageData(0, 0, W, H), d = img.data;
    var seen = new Uint8Array(W * H), stack = [], i;
    function push(px) { if (!seen[px] && d[px * 4 + 3] < 110) { seen[px] = 1; stack.push(px); } }
    for (i = 0; i < W; i++) { push(i); push((H - 1) * W + i); }
    for (i = 0; i < H; i++) { push(i * W); push(i * W + W - 1); }
    while (stack.length) {
      var q = stack.pop(), qx = q % W, qy = (q - qx) / W;
      if (qx > 0) push(q - 1);
      if (qx < W - 1) push(q + 1);
      if (qy > 0) push(q - W);
      if (qy < H - 1) push(q + W);
    }
    var count = 0, out = g.createImageData(W, H), od = out.data;
    for (i = 0; i < W * H; i++) {
      if (!seen[i] && d[i * 4 + 3] < 110) { od[i * 4 + 3] = 255; count++; }
    }
    var res = null;
    if (count > (size * S * 0.06) * (size * S * 0.06)) {
      var mc = makeCanvas(W, H);
      mc.getContext('2d').putImageData(out, 0, 0);
      res = { canvas: mc, pad: pad, base: base, S: S, tinted: {} };
    }
    if (fontsReady(font)) counterCache.set(key, res);
    return res;
  }
  function tintedCounter(mask, color) {
    var t = mask.tinted[color];
    if (t) return t;
    t = makeCanvas(mask.canvas.width, mask.canvas.height);
    var g = t.getContext('2d');
    g.drawImage(mask.canvas, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, t.width, t.height);
    mask.tinted[color] = t;
    return t;
  }

  var letterCache = new LRU(300);
  /* ink.measureLetter(ctx, text, opts) -> layout { w, h, size, font, lines: [{ x, y, w, glyphs }],
   *   stars, underline, glyphCount }. (x, y) of ink.letter is the top of the block; x is the left
   *   edge, center or right edge per opts.align.
   * opts: size (56), font ('display' | 'sans'), weight (900 display / 700 sans), maxWidth, maxLines (2),
   *   fit (true: shrink until it fits), minSize, lineHeight (1.06), align, seed, jitter (1),
   *   counters (probability a glyph's counter is filled, 0.4), counterColors, stars (true),
   *   underline (true), brush (true: rounder, heavier letters). */
  function letterLayout(ctx, text, o) {
    o = o || {};
    text = String(text == null ? '' : text);
    var fontName = o.font || 'display';
    var weight = o.weight || (fontName === 'display' ? 900 : 700);
    var key = text + '|' + (o.size || 56) + '|' + fontName + '|' + weight + '|' + (o.maxWidth || 0) + '|' + (o.maxLines || 2) + '|' +
      (o.fit !== false) + '|' + (o.minSize || '') + '|' + (o.lineHeight || '') + '|' + (o.align || 'left') + '|' + (o.seed || '') + '|' +
      (o.jitter == null ? 1 : o.jitter) + '|' + (o.counters == null ? '' : o.counters) + '|' + (o.stars !== false) + '|' + (o.underline !== false) + '|' + (o.counterColors || '');
    var hit = letterCache.get(key);
    if (hit) return hit;
    var size = o.size || 56, minSize = o.minSize || Math.max(18, size * 0.55), maxLines = o.maxLines || 2;
    var words = text.split(/\s+/).filter(Boolean), font, lines, track, spaceW;
    function measureWord(wd) {
      var w = 0;
      for (var i = 0; i < wd.length; i++) w += glyphWidth(ctx, font, wd[i]) * (1 + track);
      return w;
    }
    for (;;) {
      font = fontString({ size: size, weight: weight, font: fontName });
      track = 0.015;
      spaceW = glyphWidth(ctx, font, ' ') * 1.25 + size * 0.06;
      lines = [];
      var cur = [], curW = 0;
      for (var i = 0; i < words.length; i++) {
        var ww = measureWord(words[i]);
        var add = (cur.length ? spaceW : 0) + ww;
        if (cur.length && o.maxWidth && curW + add > o.maxWidth) { lines.push({ words: cur, w: curW }); cur = [words[i]]; curW = ww; }
        else { cur.push(words[i]); curW += add; }
      }
      if (cur.length) lines.push({ words: cur, w: curW });
      var widest = 0;
      for (i = 0; i < lines.length; i++) widest = Math.max(widest, lines[i].w);
      var bad = lines.length > maxLines || (o.maxWidth && widest > o.maxWidth);
      if (!bad || o.fit === false || size <= minSize) break;
      size = Math.max(minSize, size * 0.95);
    }
    var r = rng('letter:' + (o.seed || text));
    var jit = o.jitter == null ? 1 : o.jitter, lh = size * (o.lineHeight || 1.06);
    var cprob = o.counters == null ? 0.4 : o.counters;
    var ccols = o.counterColors || [M().rojo, M().amarillo, M().azul, M().amarillo, M().verde];
    var out = { size: size, font: font, lines: [], stars: [], glyphCount: 0, w: 0, h: 0, align: o.align || 'left', brushW: o.brush === false ? 0 : size * 0.034 };
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li], gx = 0, glyphs = [];
      for (var wi = 0; wi < line.words.length; wi++) {
        var wd = line.words[wi];
        if (wi > 0) {
          if (o.stars !== false && size >= 26 && r() < 0.55) {
            out.stars.push({ line: li, x: gx + spaceW / 2, y: -size * r.range(0.28, 0.5), r: size * r.range(0.07, 0.11),
              kind: r() < 0.55 ? 'star' : 'dot', color: r.pick([M().rojo, M().amarillo, M().azul, M().tinta]), after: out.glyphCount, rot: r() * TAU });
          }
          gx += spaceW;
        }
        for (var ci = 0; ci < wd.length; ci++) {
          var chh = wd[ci], cw = glyphWidth(ctx, font, chh) * (1 + track);
          var fillC = /[^\s.,;:¡!¿?'"«»\-–—]/.test(chh) && r() < cprob ? r.pick(ccols) : null;
          glyphs.push({ ch: chh, x: gx, w: cw, rot: r.jitter(0.05) * jit, dy: r.jitter(size * 0.035) * jit,
            k: 1 + r.jitter(0.035) * jit, counter: fillC, cox: r.range(0.6, 1.6) * r.sign(), coy: r.range(0.6, 1.6) * r.sign(), i: out.glyphCount++ });
          gx += cw;
        }
      }
      out.lines.push({ w: gx, y: li * lh, glyphs: glyphs });
      out.w = Math.max(out.w, gx);
    }
    out.lineH = lh;
    out.h = (out.lines.length - 1) * lh + size * 1.22;
    if (o.underline !== false && out.lines.length) {
      var last = out.lines[out.lines.length - 1];
      var ux0 = -size * 0.05, ux1 = last.w + size * 0.12, uy = last.y + size * 1.12;
      var amp = size * 0.04, wl = Math.max(size * 2.6, 90);
      out.underline = { line: out.lines.length - 1, geom: strokeGeom(ink.wavePoints(ux0, uy, ux1, amp, wl, r() * 3), {
        w: Math.max(2.4, size * 0.075), seed: 'ul:' + (o.seed || text), profile: 'lift', dot: 'detached' }) };
      out.h += size * 0.22;
    }
    if (fontsReady(font)) letterCache.set(key, out);
    return out;
  }
  ink.measureLetter = function (ctx, text, o) { return letterLayout(ctx, text, o); };

  function lineX(L, line, x) {
    if (L.align === 'center') return x - line.w / 2;
    if (L.align === 'right') return x - line.w;
    return x;
  }

  function drawStarSign(ctx, sx, sy, sr, rot, color) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.5, sr * 0.42);
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 4, l = sr * (i % 2 ? 0.75 : 1.1);
      ctx.moveTo(-Math.cos(a) * l, -Math.sin(a) * l);
      ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ink.letter(ctx, text, x, y, opts) -> layout. Brush-lettered title written glyph by glyph.
   * opts: as measureLetter, plus color (tinta), p (0→1 writing progress), underlineColor. */
  ink.letter = function (ctx, text, x, y, o) {
    o = o || {};
    var L = letterLayout(ctx, text, o);
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return L;
    var color = o.color || M().tinta;
    var span = L.underline ? 0.86 : 1, n = Math.max(1, L.glyphCount), size = L.size;
    ctx.save();
    ctx.font = L.font;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    for (var li = 0; li < L.lines.length; li++) {
      var line = L.lines[li], lx = lineX(L, line, x), by = y + line.y + size * 0.96;
      for (var gi = 0; gi < line.glyphs.length; gi++) {
        var gl = line.glyphs[gi];
        // Each glyph's window is clamped to the lettering's span, so the last glyphs finish with
        // it instead of jumping to whole at p = 1.
        var e = p >= 1 ? 1 : segment(p, span * gl.i / n, Math.min(span, span * (gl.i + 1.6) / n));
        if (e <= 0) continue;
        ctx.save();
        ctx.translate(lx + gl.x + gl.w / 2, by + gl.dy);
        ctx.rotate(gl.rot);
        ctx.scale(gl.k, gl.k);
        ctx.translate(-gl.w / 2, 0);
        if (e < 1) {
          ctx.beginPath();
          ctx.rect(-size * 0.2, -size * 1.3, (gl.w + size * 0.4) * e, size * 1.8);
          ctx.clip();
        }
        if (gl.counter && e >= 1) {
          var mask = counterMask(gl.ch, L.font, size, L.brushW);
          if (mask) {
            var tc = tintedCounter(mask, gl.counter);
            ctx.drawImage(tc, -mask.pad + gl.cox, -mask.base + gl.coy, tc.width / mask.S, tc.height / mask.S);
          }
        }
        ctx.fillStyle = color;
        ctx.fillText(gl.ch, 0, 0);
        if (L.brushW) {
          ctx.strokeStyle = color;
          ctx.lineWidth = L.brushW;
          ctx.strokeText(gl.ch, 0, 0);
        }
        ctx.restore();
      }
    }
    for (var si = 0; si < L.stars.length; si++) {
      var st = L.stars[si];
      var se = p >= 1 ? 1 : segment(p, Math.min(span * (st.after + 0.5) / n, span * 0.98), Math.min(span, span * (st.after + 2) / n));
      if (se <= 0) continue;
      var sl = L.lines[st.line], sx = lineX(L, sl, x) + st.x, sy = y + sl.y + size * 0.96 + st.y;
      ctx.globalAlpha = se;
      if (st.kind === 'dot') { ctx.fillStyle = st.color; ctx.beginPath(); ctx.arc(sx, sy, st.r * 0.7, 0, TAU); ctx.fill(); }
      else drawStarSign(ctx, sx, sy, st.r, st.rot, st.color);
      ctx.globalAlpha = 1;
    }
    if (L.underline) {
      var ue = segment(p, 0.84, 1);
      if (ue > 0) {
        var ul = L.lines[L.underline.line];
        ctx.translate(lineX(L, ul, x), y);
        ctx.fillStyle = o.underlineColor || color;
        fillStroke(ctx, L.underline.geom, ue, 1);
      }
    }
    ctx.restore();
    return L;
  };

  // ---------------------------------------------------------------------------------------------
  // Paper card: cream field with a thick, slightly irregular black brush outline, and optionally a
  // flat biomorphic shape peeking from behind one corner (instead of a drop shadow).

  var cardCache = new LRU(200);
  function cardGeom(w, h, o) {
    var rad = Math.min(o.radius == null ? 12 : o.radius, Math.min(w, h) / 2 - 0.5);
    var key = w + '|' + h + '|' + (o.seed || '') + '|' + rad + '|' + (o.weight || 4) + '|' + (o.peek || '') + '|' + (o.peekCorner || '');
    var g = cardCache.get(key);
    if (g) return g;
    var r = rng('card:' + (o.seed || '') + ':' + w + 'x' + h);
    var pts = [], wob = o.wobble == null ? 1.3 : o.wobble;
    function edge(x0, y0, x1, y1) {
      var len = Math.sqrt(d2(x0, y0, x1, y1));
      if (len < 1) return;
      var n = Math.max(1, Math.round(len / 46));
      var nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
      for (var i = 0; i < n; i++) {
        var t = i / n, j = i === 0 ? 0 : r.jitter(wob);
        pts.push(lerp(x0, x1, t) + nx * j, lerp(y0, y1, t) + ny * j);
      }
    }
    function corner(cx, cy, a0) {
      for (var i = 0; i <= 2; i++) {
        var a = a0 + (i / 2) * Math.PI / 2;
        pts.push(cx + Math.cos(a) * rad + r.jitter(wob * 0.5), cy + Math.sin(a) * rad + r.jitter(wob * 0.5));
      }
    }
    var R = rad;
    edge(R, 0, w - R, 0); corner(w - R, R, -Math.PI / 2);
    edge(w, R, w, h - R); corner(w - R, h - R, 0);
    edge(w - R, h, R, h); corner(R, h - R, Math.PI / 2);
    edge(0, h - R, 0, R); corner(R, R, Math.PI);
    var sp = smoothPath(pts, true, 2);
    var fill = toPath2D(sp.x, sp.y, sp.n, true);
    // A card is a closed page edge: its outline may loop a little past its start, never stop short.
    var outline = strokeGeom(pts, { closed: true, w: o.weight || 4, seed: 'card-o:' + (o.seed || '') + w + 'x' + h, profile: 'outline', press: 0.22, step: 1.6, maxGap: 0 });
    var peek = null;
    if (o.peek) {
      var corners = { tr: [w - 6, 4], tl: [6, 4], br: [w - 6, h - 4], bl: [6, h - 4] };
      var cc = corners[o.peekCorner || 'tr'], pr = Math.min(70, Math.max(26, Math.min(w, h) * 0.32));
      peek = shapeGeom(blobPoints(r, cc[0] + (cc[0] > w / 2 ? pr * 0.35 : -pr * 0.35), cc[1] + (cc[1] > h / 2 ? pr * 0.3 : -pr * 0.3), pr, pr * 0.8, 8, 0.22),
        { line: false, seed: 'peek:' + (o.seed || '') });
    }
    g = { fill: fill, outline: outline, peek: peek };
    cardCache.set(key, g);
    return g;
  }

  /* ink.card(ctx, x, y, w, h, opts) -> { x, y, w, h }.
   * opts: fill (lienzo), outline (tinta), weight (outline width, 4), radius (12), seed, p (0→1),
   *   peek (color of the shape behind a corner), peekCorner ('tr' | 'tl' | 'br' | 'bl'),
   *   dashed (true: dashed brush outline, e.g. "Ejemplo ilustrativo"), grain (true), alpha. */
  ink.card = function (ctx, x, y, w, h, o) {
    o = o || {};
    var g = cardGeom(w, h, o);
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return { x: x, y: y, w: w, h: h };
    ctx.save();
    ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    var a0 = ctx.globalAlpha;
    if (g.peek) {
      var pe = segment(p, 0.55, 1);
      if (pe > 0) drawFill(ctx, { path: g.peek.path, cx: g.peek.cx, cy: g.peek.cy, ox: 0, oy: 0, off: 0, tex: true, edge: true }, o.peek, pe, 0, 1, false, a0);
    }
    var pf = segment(p, 0, 0.3);
    if (pf > 0 && o.fill !== false) {
      ctx.globalAlpha = a0 * pf;
      ctx.fillStyle = o.fill || M().lienzo;
      ctx.fill(g.fill);
      if (o.grain !== false) { ctx.fillStyle = grainPattern(ctx); ctx.fill(g.fill); }
      ctx.globalAlpha = a0;
    }
    var pl = segment(p, 0.08, 0.85);
    if (pl > 0) {
      ctx.fillStyle = o.outline || M().tinta;
      if (o.dashed) {
        var L = g.outline.L, dash = o.dash || 16, gap = o.gap || 10, end = L * pl;
        for (var s0 = 0; s0 < end; s0 += dash + gap) strokeRange(ctx, g.outline, s0, Math.min(end, s0 + dash), 1, false);
      } else {
        fillStroke(ctx, g.outline, pl, 1);
      }
    }
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  };

  // ---------------------------------------------------------------------------------------------
  // Exports for the other engine modules.

  ink.TAU = TAU;
  ink.flat = flat;
  ink.smoothPath = smoothPath;
  ink.strokeGeom = strokeGeom;
  ink.shapeGeom = shapeGeom;
  ink.strokeRange = strokeRange;
  ink.fillStroke = fillStroke;
  ink.blobPoints = blobPoints;
  ink.ellipsePoints = ellipsePoints;
  ink.toPath2D = toPath2D;
  ink.drawing = function (seed, opts) { return new Builder(seed, opts); };
  ink.draw = draw;
  ink.drawFill = drawFill;
  ink.weightFor = weightFor;
  ink.deviceScale = deviceScale;
  ink.makeCanvas = makeCanvas;
  ink.LRU = LRU;
  ink.PROFILES = PROFILES;
  ink.gouachePattern = gouachePattern;
  ink.grainPattern = grainPattern;
})(typeof window !== 'undefined' ? window : globalThis);
