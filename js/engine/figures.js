/* Estado de la IA 2026 — figures: signs, people, places, the machine kit and props (prompt §3.3–§3.6,
 * §5.7). Everything is parameterized, seeded and able to draw on.
 *
 * Common signature: fig.name(ctx, x, y, scale, opts) with opts.seed, opts.p (draw-on 0→1: outlines
 * in stroke order, then fills bloom), opts.colors ({ slot: hex }), poses and variants as options.
 * Geometry is built once per (name, seed, variant) and cached; drawing reuses it.
 *
 *   fig.sign(ctx, name, x, y, size, opts)   one sign of the vocabulary, centered, size = box in px
 *   fig.signNames()                          every sign name
 *   fig.pattern(ctx, name, x, y, w, h, opts) hand-drawn pattern fill (puntos, rayas, estrellas…)
 *   fig.lectora / person / team / students / … (people, see below)
 *   fig.lamp / agentLoop / ruledLadder / examPanel / … (machine kit, always on navy, ruled)
 *   fig.<place>(…) and fig.<prop>(…)          places and props
 *
 * Signs have no eyes or faces (eyes exist only on people); the AI is only ever the ruled lamp.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};
  var fig = E.figures = E.figures || {};

  var TAU = Math.PI * 2;
  function P() { return E.palette; }
  function M() { return E.palette.mundo; }
  function Q() { return E.palette.maquina; }
  function I() { return E.ink; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); }

  // ---------------------------------------------------------------------------------------------
  // Geometry helpers (flat point arrays)

  function arc(cx, cy, r, a0, a1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    return out;
  }
  function ell(cx, cy, rx, ry, n, a0) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = (a0 || 0) + i / n * TAU;
      out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    }
    return out;
  }
  function rotPts(pts, a, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    var c = Math.cos(a), s = Math.sin(a), out = new Array(pts.length);
    for (var i = 0; i < pts.length; i += 2) {
      var x = pts[i] - cx, y = pts[i + 1] - cy;
      out[i] = cx + x * c - y * s;
      out[i + 1] = cy + x * s + y * c;
    }
    return out;
  }
  function movePts(pts, dx, dy, k) {
    k = k == null ? 1 : k;
    var out = new Array(pts.length);
    for (var i = 0; i < pts.length; i += 2) { out[i] = pts[i] * k + dx; out[i + 1] = pts[i + 1] * k + dy; }
    return out;
  }
  function rect(x0, y0, x1, y1) { return [x0, y0, x1, y0, x1, y1, x0, y1]; }
  // Rectangle as control points with extra points near the corners (keeps corners tight).
  function box(x0, y0, x1, y1, k) {
    k = k == null ? 0.12 : k;
    var dx = (x1 - x0) * k, dy = (y1 - y0) * k;
    return [x0, y0 + dy, x0 + dx, y0, x1 - dx, y0, x1, y0 + dy, x1, y1 - dy, x1 - dx, y1, x0 + dx, y1, x0, y1 - dy];
  }

  // ---------------------------------------------------------------------------------------------
  // Drawing cache

  var cache = new E.ink.LRU(900);
  function cached(key, build) {
    var d = cache.get(key);
    if (!d) d = cache.set(key, build());
    return d;
  }
  fig.clearCache = function () { cache.clear(); };

  function merge(a, b) {
    var out = {}, k;
    if (a) for (k in a) out[k] = a[k];
    if (b) for (k in b) if (b[k] != null) out[k] = b[k];
    return out;
  }

  var warned = {};
  function warnOnce(msg) {
    if (warned[msg]) return;
    warned[msg] = true;
    if (root.console) root.console.warn('[figures] ' + msg);
  }

  // ---------------------------------------------------------------------------------------------
  // Sign vocabulary (prompt §3.3 and the course legend of §4). Each sign is built in a 100×100 box
  // centered on (0, 0); fig.sign scales it to `size` px.

  var SIGNS = {};
  function defSign(name, build, meta) { SIGNS[name] = { build: build, meta: meta || {} }; }

  fig.sign = function (ctx, name, x, y, size, o) {
    o = o || {};
    var def = SIGNS[name];
    if (!def) {
      warnOnce('unknown sign: ' + name);
      return;
    }
    var vk = def.meta.variant ? def.meta.variant(o) : '';
    var seed = o.seed == null ? '' : String(o.seed);
    var d = cached('sign|' + name + '|' + seed + '|' + vk, function () {
      var b = E.ink.drawing('sign:' + name + ':' + seed, { w: def.meta.w || 7, jitter: def.meta.jitter == null ? 0.8 : def.meta.jitter });
      def.build(b, o);
      return b.done({ colors: def.meta.colors ? def.meta.colors() : null });
    });
    var colors = o.colors || null;
    if (o.color) colors = merge(colors, { a: o.color });
    E.ink.draw(ctx, d, x, y, (size || 40) / 100, {
      p: o.p, mono: o.mono, colors: colors, rot: o.rot, flip: o.flip, alpha: o.alpha, weight: o.weight, offset: o.offset
    });
  };
  fig.signNames = function () { return Object.keys(SIGNS); };
  fig.hasSign = function (name) { return !!SIGNS[name]; };

  function ray(b, a, r0, r1, w, bend, o) {
    var mx = Math.cos(a) * (r0 + r1) / 2 + Math.cos(a + Math.PI / 2) * bend;
    var my = Math.sin(a) * (r0 + r1) / 2 + Math.sin(a + Math.PI / 2) * bend;
    return b.stroke([Math.cos(a) * r0, Math.sin(a) * r0, mx, my, Math.cos(a) * r1, Math.sin(a) * r1],
      merge({ w: w, profile: 'lift' }, o));
  }

  // Irregular star: 5–8 strokes of different lengths, sometimes a dot or a small colored center.
  defSign('estrella', function (b, o) {
    var r = b.r, n = o.rays || r.int(5, 8), a0 = r() * TAU, strokes = Math.floor(n / 2);
    var center = o.center !== undefined ? o.center : (r() < 0.35 ? 'color' : r() < 0.45 ? 'dot' : null);
    if (center === 'color') b.blob(0, 0, 9, 8, { fill: '@a', line: false, irr: 0.18 });
    // Crossing strokes (each one gives two points of different lengths), plus a lone ray when odd.
    for (var i = 0; i < strokes; i++) {
      var a = a0 + i / strokes * Math.PI + r.jitter(0.2), l1 = r.range(26, 47), l2 = r.range(18, 44);
      var cx = r.jitter(2.5), cy = r.jitter(2.5);
      b.stroke([Math.cos(a) * l1, Math.sin(a) * l1, cx, cy, -Math.cos(a) * l2, -Math.sin(a) * l2],
        { w: r.range(5.5, 8), profile: 'swell' });
    }
    if (n % 2) ray(b, a0 + Math.PI / (2 * strokes) + r.jitter(0.2), 3, r.range(22, 38), r.range(4.5, 6.5), r.jitter(2));
    if (center === 'dot') b.dot(0, 0, 5.5);
  }, { colors: function () { return { a: M().amarillo }; }, variant: function (o) { return (o.rays || '') + '|' + (o.center === undefined ? '' : o.center); } });

  function crescent(rot) {
    var th = 115 * Math.PI / 180, hx = 40 * Math.cos(th), hy = 40 * Math.sin(th);
    var cx = 1500 / (2 * hx - 20), R = 10 - cx, pts = [], k;
    for (k = 0; k <= 10; k++) { var a = -th + 2 * th * k / 10; pts.push(40 * Math.cos(a), 40 * Math.sin(a)); }
    var ai = Math.atan2(hy, hx - cx);
    for (k = 1; k <= 5; k++) { var b2 = ai - 2 * ai * k / 6; pts.push(cx + R * Math.cos(b2), R * Math.sin(b2)); }
    return rotPts(pts, rot);
  }
  defSign('luna', function (b, o) {
    b.shape(crescent(o.tilt == null ? -0.55 : o.tilt), { fill: '@a', w: 6, fillJitter: 1.2 });
  }, { colors: function () { return { a: M().amarillo }; }, jitter: 0.4, variant: function (o) { return o.tilt == null ? '' : o.tilt; } });

  // Red sun disc (o.rays: short calligraphic rays around it).
  defSign('sol', function (b, o) {
    b.circle(0, 0, o.rays ? 25 : 36, { fill: '@a', line: !!o.line, w: 4, irr: 0.025 });
    if (o.rays) {
      var r = b.r;
      for (var i = 0; i < 10; i++) {
        var a = i / 10 * TAU + r.jitter(0.12);
        b.stroke([Math.cos(a) * 32, Math.sin(a) * 32, Math.cos(a) * r.range(41, 47), Math.sin(a) * r.range(41, 47)], { w: 5, profile: 'lift' });
      }
    }
  }, { colors: function () { return { a: M().rojo }; }, variant: function (o) { return (o.rays ? 'r' : '') + (o.line ? 'l' : ''); } });

  function birdInto(b, dx, dy, k, flip) {
    function t(pts) { var out = movePts(pts, 0, 0, k); if (flip) for (var i = 0; i < out.length; i += 2) out[i] = -out[i]; return movePts(out, dx, dy, 1); }
    b.stroke(t([-12, 4, -26, 6, -38, 2]), { w: 4.2 * k, profile: 'lift' });
    b.stroke(t([-12, 7, -24, 13, -34, 16]), { w: 3.6 * k, profile: 'lift' });
    var body = t([-16, 4, -6, -2, 8, -3, 16, 1, 8, 7, -6, 8]);
    b.shape(body, { fill: '@a', w: 4.2 * k });
    var head = t([20, -1]);
    b.dot(head[0], head[1], 5.6 * k);
    b.stroke(t([24, 0, 32, 2]), { w: 3.2 * k, profile: 'lift' });
    b.stroke(t([-4, -2, -16, -26, -30, -36, -46, -26]), { w: 6.5 * k, profile: 'swell' });
    b.stroke(t([4, -3, 12, -30, 26, -38, 42, -30]), { w: 6.5 * k, profile: 'swell', dot: 'detached' });
  }
  // Bird in flight: two calligraphic wings, a small colored body, tail strokes. No eye.
  defSign('pajaro', function (b, o) { birdInto(b, 0, 4, 1, !!o.flip); }, {
    colors: function () { return { a: M().rojo }; }, variant: function (o) { return o.flip ? 'f' : ''; }
  });

  function ladderInto(b, o, x0, y0, w, h) {
    var r = b.r, n = o.rungs || 5, lean = o.lean == null ? 0.08 : o.lean;
    var lx = function (y) { return x0 - w / 2 + (y0 + h / 2 - y) * lean; };
    var rx = function (y) { return x0 + w / 2 + (y0 + h / 2 - y) * lean - (y0 + h / 2 - y) * 0.06; };
    var top = y0 - h / 2, bot = y0 + h / 2;
    b.stroke([lx(bot), bot, lx(lerp(bot, top, 0.5)) + r.jitter(1.5), lerp(bot, top, 0.5), lx(top), top], { w: o.w || 5.5, profile: 'blunt' });
    b.stroke([rx(bot), bot, rx(lerp(bot, top, 0.5)) + r.jitter(1.5), lerp(bot, top, 0.5), rx(top), top], { w: o.w || 5.5, profile: 'blunt' });
    for (var i = 0; i < n; i++) {
      var y = lerp(bot, top, (i + 0.75) / (n + 0.25));
      if (i === 0 && o.missingFirst) {
        for (var j = 0; j < 6; j++) b.dot(lerp(lx(y) + 5, rx(y) - 5, j / 5) + r.jitter(1.5), y + r.jitter(2) + j * 1.2, lerp(3.2, 1.2, j / 5));
        continue;
      }
      b.stroke([lx(y) + 1, y + r.jitter(1.5), rx(y) - 1, y + r.jitter(1.5)], { w: (o.w || 5.5) * 0.85, profile: 'blunt' });
    }
  }
  defSign('escalera', function (b, o) { ladderInto(b, o, 0, 0, 34, 92); }, {
    variant: function (o) { return (o.rungs || '') + (o.missingFirst ? 'm' : ''); }
  });
  defSign('escalera-sin-peldano', function (b, o) { ladderInto(b, merge(o, { missingFirst: true }), 0, 0, 34, 92); });

  defSign('espiral', function (b, o) {
    var pts = [], turns = o.turns || 2.4, tmax = turns * TAU;
    for (var t = 0; t <= tmax; t += 0.32) {
      var rr = 3 + 38 * t / tmax;
      pts.push(Math.cos(t) * rr, Math.sin(t) * rr);
    }
    b.stroke(pts, { w: 6.5, profile: 'press', dot: true });
  });

  // Comet with a tail of dots (also the "Proyección" sign with the evidence color).
  defSign('cometa', function (b, o) {
    var r = b.r;
    b.blob(22, -18, 13, 12, { fill: '@a', w: 5, irr: 0.12 });
    b.stroke([10, -10, -6, -2, -16, 4], { w: 3.5, profile: 'hair' });
    b.stroke([14, -4, 2, 6, -6, 14], { w: 3, profile: 'hair' });
    for (var i = 0; i < 8; i++) {
      var t = (i + 1) / 9;
      b.dot(lerp(8, -44, t) + r.jitter(1.5), lerp(-8, 36, t) + Math.sin(t * 4) * 4, lerp(5.4, 1.6, t));
    }
  }, { colors: function () { return { a: M().amarillo }; } });

  defSign('cabellos', function (b) {
    var r = b.r;
    for (var i = 0; i < 6; i++) {
      var x0 = r.range(-10, 10), len = r.range(50, 86), sway = r.range(8, 18) * r.sign(), pts = [];
      for (var k = 0; k <= 6; k++) {
        var t = k / 6;
        pts.push(x0 + Math.sin(t * 3.4 + i) * sway * t + (i - 2.5) * 6 * t, 42 - len * t);
      }
      b.stroke(pts, { w: r.range(1.8, 3), profile: 'hair', dot: r() < 0.3 ? 'detached' : false });
    }
  }, { jitter: 0.4 });

  defSign('mancha', function (b, o) { b.blob(0, 0, 40, 30, { fill: '@a', irr: 0.22, n: 10, w: 6 }); }, {
    colors: function () { return { a: M().azul }; }
  });

  defSign('puntos', function (b, o) {
    var r = b.r, n = o.n || 11;
    for (var i = 0; i < n; i++) {
      var a = i * 2.39996 + r.jitter(0.3), d = 34 * Math.sqrt((i + 0.5) / n);
      b.dot(Math.cos(a) * d, Math.sin(a) * d, r.range(3.6, 5.6));
    }
  }, { variant: function (o) { return o.n || ''; } });

  defSign('salpicadura', function (b) {
    var r = b.r;
    for (var i = 0; i < 28; i++) {
      var a = r() * TAU, d = 44 * Math.pow(r(), 0.75), sz = 6.5 * Math.pow(1 - d / 46, 1.2) * r.range(0.4, 1.3) + 0.8;
      if (r() < 0.25) b.stroke([Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * (d + sz * 2.4), Math.sin(a) * (d + sz * 2.4)], { w: sz * 1.4, profile: 'press' });
      else b.dot(Math.cos(a) * d, Math.sin(a) * d, sz);
    }
  });

  // Free constellation: hand-placed dots joined by loose curves (the human counterpart of the grid).
  defSign('constelacion', function (b, o) {
    var r = b.r, n = o.n || 6, pts = [], tries = 0;
    while (pts.length < n * 2 && tries++ < 200) {
      var x = r.range(-42, 42), y = r.range(-38, 38), ok = true;
      for (var j = 0; j < pts.length; j += 2) if (Math.hypot(pts[j] - x, pts[j + 1] - y) < 22) ok = false;
      if (ok) pts.push(x, y);
    }
    for (var i = 0; i + 3 < pts.length; i += 2) {
      var mx = (pts[i] + pts[i + 2]) / 2 + r.jitter(7), my = (pts[i + 1] + pts[i + 3]) / 2 + r.jitter(7);
      b.stroke([pts[i], pts[i + 1], mx, my, pts[i + 2], pts[i + 3]], { w: 2, profile: 'hair' });
    }
    for (i = 0; i < pts.length; i += 2) {
      if (i === 2) b.blob(pts[i], pts[i + 1], 6, 6, { fill: '@a', w: 3, irr: 0.1 });
      else b.dot(pts[i], pts[i + 1], r.range(2.6, 4.6));
    }
  }, { colors: function () { return { a: M().amarillo }; }, variant: function (o) { return o.n || ''; } });

  // ---- The five evidence signs (prompt §4.1) — legend use only: they default to their colors.

  defSign('matraz', function (b) {
    b.fill([-17, 12, 17, 12, 31, 34, 28, 42, -28, 42, -31, 34], { fill: '@a', tex: true, fillJitter: 0.6 });
    b.shape([-8, -42, -8, -16, -10, -12, -33, 32, -30, 42, 30, 42, 33, 32, 10, -12, 8, -16, 8, -42], { line: true, w: 6, fillScale: 0 });
    b.stroke([-15, -43, 15, -43], { w: 6.5, profile: 'blunt' });
    b.dot(-6, 26, 3.4, { color: '@paper' });
    b.dot(7, 31, 2.4, { color: '@paper' });
  }, { colors: function () { return { a: P().evidencia.capacidad }; }, jitter: 0.5 });

  defSign('bocadillo', function (b) {
    var pts = [], n = 16, tail = false;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU;
      if (!tail && a > 1.85) { pts.push(-30, 44); tail = true; }
      if (Math.abs(a - 2.05) < 0.3) continue;
      pts.push(2 + Math.cos(a) * 42, -6 + Math.sin(a) * 29);
    }
    b.shape(pts, { fill: '@a', w: 6 });
    b.stroke([-18, -12, 18, -14], { w: 4.5, profile: 'blunt' });
    b.stroke([-16, 2, 8, 0], { w: 4.5, profile: 'blunt' });
  }, { colors: function () { return { a: P().evidencia.uso }; }, jitter: 0.6 });

  defSign('lupa', function (b) {
    b.circle(-9, -9, 27, { fill: '@a', w: 7.5 });
    b.stroke([-24, -16, -20, -24, -12, -28], { w: 3.6, profile: 'swell', color: '@paper' });
    b.stroke([12, 12, 26, 26, 40, 40], { w: 11, profile: 'blunt' });
  }, { colors: function () { return { a: P().evidencia.resultado }; }, jitter: 0.4 });

  defSign('catalejo', function (b) {
    var a = -0.52;
    function part(x0, x1, h0, h1, fill) {
      var pts = rotPts([x0, -h0, x1, -h1, x1, h1, x0, h0], a);
      return b.shape(pts, { fill: fill, w: 5, fillScale: 0 });
    }
    part(-46, -24, 5.5, 6, '@a');
    part(-24, 2, 8.5, 9, '@a');
    part(2, 36, 12, 13.5, '@a');
    var lip = rotPts([36, -16, 41, -16, 41, 16, 36, 16], a);
    b.shape(lip, { fill: '@ink', w: 4, fillScale: 0 });
  }, { colors: function () { return { a: P().evidencia.expectativa }; }, jitter: 0.4 });

  // ---- Estado signs (prompt §4.3)

  defSign('sello-visto', function (b) {
    b.stroke(arc(0, 0, 38, 0, TAU, 18), { w: 6.5, profile: 'outline', closed: true });
    b.stroke(arc(0, 0, 30, 0, TAU, 16), { w: 2.4, profile: 'outline', closed: true });
    b.stroke([-17, 1, -5, 14, 20, -17], { w: 8.5, profile: 'press' });
  }, { jitter: 0.5 });

  defSign('asterisco', function (b) {
    var r = b.r, a0 = r() * 0.4;
    for (var i = 0; i < 3; i++) {
      var a = a0 + i * Math.PI / 3, l = r.range(36, 42);
      b.stroke([-Math.cos(a) * l, -Math.sin(a) * l, Math.cos(a) * l, Math.sin(a) * l], { w: 9, profile: 'blunt' });
    }
  }, { jitter: 0.6 });

  defSign('libro', function (b) {
    b.shape([-44, -22, -24, -26, -2, -18, -2, 32, -22, 26, -44, 28], { fill: '@paper', w: 5, fillScale: 0 });
    b.shape([2, -18, 24, -26, 44, -22, 44, 28, 22, 26, 2, 32], { fill: '@paper', w: 5, fillScale: 0 });
    b.stroke([-36, -10, -10, -8], { w: 3, profile: 'blunt' });
    b.stroke([-36, 2, -10, 4], { w: 3, profile: 'blunt' });
    b.stroke([10, -8, 36, -10], { w: 3, profile: 'blunt' });
    b.stroke([10, 4, 30, 2], { w: 3, profile: 'blunt' });
  }, { jitter: 0.5 });

  // ---- Warning-stamp signs (prompt §4.2)

  defSign('moneda', function (b) {
    b.circle(0, 0, 37, { fill: '@a', w: 6.5 });
    b.stroke(arc(0, 0, 27, 0, TAU, 14), { w: 2.4, profile: 'outline', closed: true });
    b.stroke([-10, -12, 0, -16, 10, -12], { w: 4, profile: 'blunt' });
    b.stroke([0, -14, 0, 14], { w: 5, profile: 'blunt' });
    b.stroke([-10, 12, 0, 16, 10, 12], { w: 4, profile: 'blunt' });
  }, { colors: function () { return { a: M().oro }; }, jitter: 0.4 });

  function deskInto(b, y0, k, fill) {
    b.shape(box(-44 * k, y0, 44 * k, y0 + 10 * k, 0.04), { fill: fill || '@a', w: 5 * k });
    b.stroke([-36 * k, y0 + 10 * k, -38 * k, y0 + 44 * k], { w: 5 * k, profile: 'blunt' });
    b.stroke([36 * k, y0 + 10 * k, 38 * k, y0 + 44 * k], { w: 5 * k, profile: 'blunt' });
  }
  defSign('mesa', function (b) {
    b.shape(rotPts(box(-26, -24, 6, -6, 0.05), -0.08), { fill: '@paper', w: 3.5, fillScale: 0 });
    b.stroke([-20, -17, 0, -18], { w: 2.2, profile: 'blunt' });
    b.stroke([-20, -11, -4, -12], { w: 2.2, profile: 'blunt' });
    b.shape(box(14, -26, 30, -6, 0.2), { fill: '@b', w: 3.5 });
    deskInto(b, -6, 1);
  }, { colors: function () { return { a: M().madera, b: M().rojo }; }, jitter: 0.5 });

  defSign('sol-escritorio', function (b) {
    var r = b.r;
    b.circle(0, -28, 14, { fill: '@b', line: false, irr: 0.03 });
    for (var i = 0; i < 9; i++) {
      var a = i / 9 * TAU + 0.2;
      b.stroke([Math.cos(a) * 19, -28 + Math.sin(a) * 19, Math.cos(a) * r.range(24, 27), -28 + Math.sin(a) * r.range(24, 27)], { w: 3.6, profile: 'lift' });
    }
    deskInto(b, 4, 0.92);
  }, { colors: function () { return { a: M().madera, b: M().rojo }; }, jitter: 0.5 });

  defSign('silla-vacia', function (b) {
    b.shape(box(-24, -44, -10, 4, 0.12), { fill: '@a', w: 5 });
    b.shape(box(-26, 0, 26, 10, 0.1), { fill: '@a', w: 5 });
    b.stroke([-22, 10, -24, 44], { w: 5, profile: 'blunt' });
    b.stroke([22, 10, 24, 44], { w: 5, profile: 'blunt' });
    b.stroke([-6, 10, -6, 36], { w: 3.5, profile: 'blunt' });
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.4 });

  defSign('dos-pajaros', function (b) {
    birdInto(b, -14, -10, 0.56, false);
    birdInto(b, 18, 14, 0.56, false);
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.3 });

  defSign('flecha-empuja', function (b) {
    b.stroke([-46, 2, -22, -1, 2, 1], { w: 9, profile: 'blunt' });
    b.shape([2, -15, 24, 0, 2, 15], { fill: '@ink', w: 3.5, fillScale: 0 });
    b.shape(box(26, -17, 46, 17, 0.12), { fill: '@a', w: 5 });
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.4 });

  // Calligraphic crossed equals sign "≠" (between the two signs of a warning stamp).
  defSign('distinto', function (b) {
    b.stroke([-30, -10, 0, -12, 30, -9], { w: 7, profile: 'blunt' });
    b.stroke([-30, 10, 0, 8, 30, 11], { w: 7, profile: 'blunt' });
    b.stroke([16, -32, 0, 0, -16, 32], { w: 7, profile: 'swell' });
  }, { jitter: 0.6 });

  // ---- Session signs (prompt §4.4)

  defSign('iceberg', function (b) {
    b.shape([-36, 6, -24, 30, 0, 44, 26, 34, 40, 6], { fill: '@b', w: 5, fillAlpha: 0.9 });
    b.shape([-20, 4, -8, -24, 2, -40, 10, -26, 22, 4], { fill: '@a', w: 5.5 });
    b.stroke(I().wavePoints(-48, 4, 48, 3, 32, 0.5), { w: 4.5, profile: 'swell' });
  }, { colors: function () { return { a: M().lienzo, b: M().celeste }; }, jitter: 0.6 });

  defSign('cordillera', function (b) {
    var back = b.shape([-14, 38, 4, -38, 30, 38], { fill: '@a', w: 5 });
    var left = b.shape([-48, 38, -26, -8, -2, 38], { fill: '@b', w: 5 });
    b.overlap(back, left, '@ink');
    var right = b.shape([10, 38, 30, 0, 48, 38], { fill: '@c', w: 5 });
    b.overlap(back, right, '@ink');
    b.shape([-2, -18, 4, -38, 12, -18], { fill: '@d', w: 3.5 });
    b.stroke([-48, 40, 48, 40], { w: 4.5, profile: 'blunt' });
  }, { colors: function () { return { a: M().verde, b: M().azul, c: M().tierra, d: M().amarillo }; }, jitter: 0.5 });

  defSign('puente', function (b) {
    b.shape([-48, -16, 48, -16, 48, 30, 36, 30, 34, 14, 26, 4, 16, 14, 14, 30, 8, 30, 6, 12, 0, 2, -6, 12, -8, 30, -14, 30, -16, 14,
      -26, 4, -34, 14, -36, 30, -48, 30], { fill: '@a', w: 5, fillScale: 0 });
    b.stroke([-50, -18, 0, -21, 50, -18], { w: 7, profile: 'blunt' });
    b.stroke([-40, -26, -40, -18], { w: 3.5, profile: 'blunt' });
    b.stroke([40, -26, 40, -18], { w: 3.5, profile: 'blunt' });
    b.stroke([-44, -27, 0, -29, 44, -27], { w: 3, profile: 'swell' });
    b.stroke(I().wavePoints(-50, 40, 50, 2.5, 26, 0), { w: 3.4, profile: 'swell' });
  }, { colors: function () { return { a: M().tierra }; }, jitter: 0.4 });

  defSign('microscopio', function (b) {
    b.shape(box(-32, 34, 26, 44, 0.12), { fill: '@ink', w: 4 });
    b.stroke([8, 34, 24, 10, 22, -16, 6, -28], { w: 9, profile: 'blunt' });
    b.shape(rotPts(box(-9, -46, 7, 2, 0.1), 0.42, 0, -20), { fill: '@a', w: 5 });
    b.stroke([-30, 10, 14, 10], { w: 5.5, profile: 'blunt' });
    b.shape(rotPts(box(-6, -54, 6, -44, 0.2), 0.42, 0, -20), { fill: '@ink', w: 3 });
  }, { colors: function () { return { a: M().azul }; }, jitter: 0.4 });

  defSign('volante', function (b) {
    b.stroke(arc(0, 0, 38, 0, TAU, 18), { w: 10, profile: 'outline', closed: true });
    b.circle(0, 0, 10, { fill: '@a', w: 5 });
    for (var i = 0; i < 3; i++) {
      var a = Math.PI / 2 + i * TAU / 3;
      b.stroke([Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a) * 33, Math.sin(a) * 33], { w: 7, profile: 'blunt' });
    }
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.5 });

  defSign('faro', function (b) {
    b.fill([-10, -22, -48, -34, -48, -18], { fill: '@b', fillAlpha: 0.4, tex: false, fillScale: 0 });
    b.fill([10, -22, 48, -34, 48, -18], { fill: '@b', fillAlpha: 0.4, tex: false, fillScale: 0 });
    b.blob(0, 40, 26, 8, { fill: M().tierra, w: 4, irr: 0.12 });
    var tower = b.shape([-14, 38, -8, -16, 8, -16, 14, 38], { fill: '@paper', w: 5, fillScale: 0 });
    b.fill([-13, 24, 13, 24, 12, 14, -12, 14], { fill: '@a', fillScale: 0, fillJitter: 0.3 });
    b.fill([-11, 4, 11, 4, 10, -6, -10, -6], { fill: '@a', fillScale: 0, fillJitter: 0.3 });
    b.shape(box(-9, -28, 9, -16, 0.15), { fill: '@b', w: 4 });
    b.shape([-12, -28, 0, -42, 12, -28], { fill: '@ink', w: 3.5 });
    return tower;
  }, { colors: function () { return { a: M().rojo, b: M().amarillo }; }, jitter: 0.4 });

  // ---- Clinical traffic light signs (prompt §4.4): cross, half disc, check star (tinta).

  defSign('cruz', function (b) {
    b.stroke([-26, -26, 0, 0, 26, 26], { w: 11, profile: 'blunt' });
    b.stroke([26, -26, 0, 0, -26, 26], { w: 11, profile: 'blunt' });
  }, { jitter: 0.6 });

  defSign('medio-disco', function (b) {
    b.fill(arc(0, 0, 30, 0, Math.PI, 12), { fill: '@ink', fillScale: 0, tex: false });
    b.stroke(arc(0, 0, 32, 0, TAU, 16), { w: 6.5, closed: true, profile: 'outline' });
    b.stroke([-33, 0, 33, 0], { w: 4, profile: 'blunt' });
  }, { jitter: 0.4 });

  function starPts(n, r0, r1, a0) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var a = (a0 || -Math.PI / 2) + i / (n * 2) * TAU, rr = i % 2 ? r1 : r0;
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    return pts;
  }
  defSign('estrella-visto', function (b) {
    b.shape(starPts(5, 44, 20), { fill: '@paper', w: 5.5, fillScale: 0, exact: true });
    b.stroke([-12, 2, -3, 12, 14, -10], { w: 7, profile: 'press' });
  }, { jitter: 0.5 });

  // ---- Risk-family signs (prompt §4.4)

  defSign('anzuelo', function (b) {
    b.stroke([0, -48, 1, -30], { w: 2.4, profile: 'even' });
    b.stroke(arc(1, -24, 5, -Math.PI / 2, Math.PI * 1.5, 10), { w: 3.8, profile: 'blunt' });
    b.stroke([1, -18, 2, 0, 1, 20, -4, 32, -16, 34, -24, 24, -23, 12], { w: 6.5, profile: 'blunt' });
    b.stroke([-23, 10, -15, 17], { w: 5, profile: 'lift' });
  }, { jitter: 0.4 });

  defSign('grieta', function (b) {
    b.blob(0, 0, 42, 32, { fill: '@a', w: 5.5, irr: 0.1, n: 10 });
    b.stroke([-4, -32, 4, -16, -6, -2, 6, 12, -2, 31], { w: 4.5, profile: 'swell' });
    b.stroke([6, 12, 20, 18, 26, 28], { w: 3, profile: 'lift' });
    b.stroke([-6, -2, -18, -8], { w: 2.6, profile: 'lift' });
  }, { colors: function () { return { a: M().lienzoOcre }; }, jitter: 0.4 });

  function houseInto(b, x, y, w, h, fill, wk) {
    wk = wk || 1;
    b.shape(box(x - w / 2, y - h, x + w / 2, y, 0.08), { fill: fill, w: 3.5 * wk });
    b.shape([x - w / 2 - w * 0.12, y - h, x, y - h - w * 0.42, x + w / 2 + w * 0.12, y - h], { fill: '@ink', w: 3 * wk });
  }
  defSign('red-pueblo', function (b) {
    var r = b.r;
    houseInto(b, -26, 44, 18, 16, '@a');
    houseInto(b, -2, 44, 16, 20, '@b');
    houseInto(b, 22, 44, 18, 14, '@c');
    var lines = [[-46, -4, -10, -26, 30, -12, 48, -30], [-44, -30, -6, -10, 24, -34, 46, -6], [-40, 14, -14, -16, 16, 10, 44, -14]];
    for (var i = 0; i < lines.length; i++) b.stroke(lines[i], { w: 2.2, profile: 'hair' });
    for (i = 0; i < 6; i++) b.dot(r.range(-36, 36), r.range(-26, 6), 2.4);
  }, { colors: function () { return { a: M().rojo, b: M().amarillo, c: M().azul }; }, jitter: 0.4 });

  // ---- Other course signs

  // The lectora's notebook (starts her subtitle lines).
  defSign('libreta', function (b) {
    b.shape(box(-30, -36, 32, 44, 0.08), { fill: '@paper', w: 5.5, fillScale: 0 });
    b.fill(box(-30, -36, -18, 44, 0.08), { fill: '@a', fillScale: 0 });
    for (var i = 0; i < 4; i++) b.stroke(arc(-30, -24 + i * 19, 6, Math.PI * 0.5, Math.PI * 1.6, 6), { w: 3, profile: 'blunt' });
    b.stroke([-8, -16, 22, -18], { w: 3.4, profile: 'blunt' });
    b.stroke([-8, 0, 24, -1], { w: 3.4, profile: 'blunt' });
    b.stroke([-8, 16, 14, 15], { w: 3.4, profile: 'blunt' });
  }, { colors: function () { return { a: M().azul }; }, jitter: 0.4 });

  defSign('lapiz', function (b) {
    var a = -0.75;
    b.shape(rotPts([-30, -8, 22, -8, 22, 8, -30, 8], a), { fill: '@a', w: 4.5, fillScale: 0 });
    b.shape(rotPts([22, -8, 42, 0, 22, 8], a), { fill: '@paper', w: 4, fillScale: 0 });
    var tip = rotPts([40, 0], a);
    b.dot(tip[0], tip[1], 3.4);
    b.shape(rotPts([-44, -8, -36, -8, -36, 8, -44, 8], a), { fill: '@b', w: 4, fillScale: 0 });
    b.fill(rotPts([-36, -8, -30, -8, -30, 8, -36, 8], a), { fill: M().tierra, fillScale: 0 });
  }, { colors: function () { return { a: M().amarillo, b: M().rojo }; }, jitter: 0.3 });

  defSign('cuadrado', function (b) {
    b.shape(box(-24, -24, 24, 24, 0.08), { fill: '@ink', w: 5, fillScale: 0 });
  }, { jitter: 0.6 });

  defSign('capitulo', function (b) {
    b.stroke([-22, 46, -21, 0, -20, -46], { w: 5.5, profile: 'blunt' });
    b.shape([-20, -46, 38, -32, -20, -14], { fill: '@a', w: 4.5 });
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.5 });

  defSign('pausa', function (b) {
    b.stroke(arc(0, 0, 40, 0, TAU, 18), { w: 6, profile: 'outline', closed: true });
    b.stroke([-10, -18, -10, 18], { w: 10, profile: 'blunt' });
    b.stroke([10, -18, 10, 18], { w: 10, profile: 'blunt' });
  }, { jitter: 0.5 });

  // Feedback: a bursting yellow star ("¡Muy bien!").
  defSign('estrella-exito', function (b) {
    var r = b.r;
    b.blob(0, 0, 15, 14, { fill: '@a', w: 4.5, irr: 0.15 });
    for (var i = 0; i < 9; i++) ray(b, i / 9 * TAU + r.jitter(0.15), 17, r.range(30, 42), r.range(5, 7.5), r.jitter(2));
    for (i = 0; i < 7; i++) {
      var a = i / 7 * TAU + 0.3;
      b.dot(Math.cos(a) * 47, Math.sin(a) * 47, r.range(2, 3.6));
    }
  }, { colors: function () { return { a: M().amarillo }; } });

  // Compass made of an irregular star; the north ray ends in a red dot.
  function compassInto(b, cx, cy, k) {
    var r = b.r;
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 4 + r.jitter(0.06), l = (i % 2 ? r.range(16, 22) : r.range(34, 44)) * k;
      b.stroke([cx + Math.cos(a) * 5 * k, cy + Math.sin(a) * 5 * k, cx + Math.cos(a) * l, cy + Math.sin(a) * l], { w: (i % 2 ? 4 : 6.5) * k, profile: 'lift' });
    }
    b.circle(cx, cy, 7 * k, { fill: '@paper', w: 3.5 * k });
    b.dot(cx, cy - 46 * k, 5 * k, { color: '@a' });
  }
  defSign('brujula', function (b) { compassInto(b, 0, 0, 1); }, { colors: function () { return { a: M().rojo }; }, jitter: 0.4 });

  defSign('lancha-brujula', function (b) {
    b.stroke(I().wavePoints(-48, 36, 48, 2.5, 26, 0), { w: 3.4, profile: 'swell' });
    b.shape([-42, 12, -30, 14, 30, 14, 46, 8, 32, 30, -36, 30], { fill: '@a', w: 5, fillScale: 0 });
    b.stroke([-8, 14, -8, -14], { w: 4, profile: 'blunt' });
    b.shape([-6, -14, 22, 8, -6, 8], { fill: '@paper', w: 3.5, fillScale: 0 });
    compassInto(b, 28, -24, 0.42);
  }, { colors: function () { return { a: M().rojo }; }, jitter: 0.4 });

  defSign('casa', function (b) {
    houseInto(b, 0, 40, 60, 44, '@a', 1.6);
    b.shape(box(-8, 16, 8, 40, 0.15), { fill: '@b', w: 4 });
  }, { colors: function () { return { a: M().amarillo, b: M().rojo }; } });

  defSign('corazon-mano', function (b) {
    b.shape([0, 38, -34, 4, -36, -18, -20, -34, 0, -20, 20, -34, 36, -18, 34, 4], { fill: '@a', w: 6 });
  }, { colors: function () { return { a: M().rojo }; } });

  // ---------------------------------------------------------------------------------------------
  // Pattern fills (pennants, scenario windows, agenda blocks, rubric levels): hand-drawn, seeded,
  // cached as layers. Meaning comes from the pattern and a number, never from the evidence colors.

  function patternInto(g, name, w, h, o) {
    var r = E.rng.create('pattern:' + name + ':' + (o.seed || '')), ink = I(), col = o.color || M().tinta, s = o.spacing || 16;
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = col;
    var x, y, i = 0;
    switch (name) {
      case 'puntos':
        for (y = s / 2; y < h + s; y += s) {
          for (x = (i++ % 2 ? s : s / 2); x < w + s; x += s) { g.beginPath(); g.arc(x + r.jitter(1), y + r.jitter(1), s * 0.17 * r.range(0.8, 1.15), 0, TAU); g.fill(); }
        }
        break;
      case 'rayas':
        for (x = -h; x < w + h; x += s * 0.9) {
          ink.line(g, [x, h + 4, x + h * 0.5 + r.jitter(2), h * 0.5, x + h + 4, -4], { w: s * 0.26, color: col, profile: 'blunt', seed: 'pr' + x });
        }
        break;
      case 'estrellas':
        for (y = s * 0.7; y < h + s; y += s * 1.4) {
          for (x = (i++ % 2 ? s * 1.4 : s * 0.7); x < w + s; x += s * 1.4) {
            var a0 = r() * TAU, rr = s * 0.36;
            g.strokeStyle = col; g.lineWidth = Math.max(1.2, s * 0.09); g.lineCap = 'round';
            g.beginPath();
            for (var k = 0; k < 3; k++) {
              var a = a0 + k * Math.PI / 3;
              g.moveTo(x - Math.cos(a) * rr, y - Math.sin(a) * rr);
              g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
            }
            g.stroke();
          }
        }
        break;
      case 'cuadros':
        for (y = 0; y < h; y += s) {
          for (x = ((y / s) % 2 ? s : 0); x < w; x += s * 2) {
            g.beginPath();
            g.rect(x + r.jitter(0.8), y + r.jitter(0.8), s + r.jitter(0.6), s + r.jitter(0.6));
            g.fill();
          }
        }
        break;
      case 'ondas':
        for (y = s * 0.6; y < h + s; y += s) ink.wave(g, -10, y, w + 10, { amp: s * 0.18, len: s * 1.6, w: s * 0.16, color: col, profile: 'even', seed: 'po' + y });
        break;
      case 'espirales':
        g.strokeStyle = col; g.lineWidth = Math.max(1.2, s * 0.08); g.lineCap = 'round';
        for (y = s; y < h + s; y += s * 1.8) {
          for (x = (i++ % 2 ? s * 1.8 : s * 0.9); x < w + s; x += s * 1.8) {
            g.beginPath();
            for (var t = 0; t < 2.2 * TAU; t += 0.3) {
              var rr2 = s * 0.06 + s * 0.55 * t / (2.2 * TAU);
              if (t === 0) g.moveTo(x, y); else g.lineTo(x + Math.cos(t) * rr2, y + Math.sin(t) * rr2);
            }
            g.stroke();
          }
        }
        break;
    }
  }
  /* fig.pattern(ctx, name, x, y, w, h, opts): fills the rect with a hand-drawn pattern.
   * name: 'puntos' | 'rayas' | 'estrellas' | 'cuadros' | 'ondas' | 'espirales'.
   * opts: color (tinta), bg (background color or none), spacing (16), seed, clip (Path2D to clip). */
  fig.pattern = function (ctx, name, x, y, w, h, o) {
    o = o || {};
    var key = 'pattern|' + name + '|' + Math.round(w) + '|' + Math.round(h) + '|' + (o.color || '') + '|' + (o.bg || '') + '|' + (o.spacing || '') + '|' + (o.seed || '');
    ctx.save();
    if (o.clip) ctx.clip(o.clip);
    I().drawLayer(ctx, key, x, y, w, h, function (g) { patternInto(g, name, w, h, o); });
    ctx.restore();
  };

  // =============================================================================================
  // THE MACHINE KIT (prompt §3.5): small, cool and ruler-straight, always on deep navy. The AI is
  // only ever the lamp: thin straight pale-blue lines and perfect circles; it never gets eyes, a
  // face, a body or a brain. Line widths are fixed screen px (crisp), whatever the scale.

  /* fig.panel(ctx, x, y, w, h, opts) -> rect: a ruled navy panel with a fine regular grid (the world
   * of benchmarks, exams and controlled conditions). opts: cell (14), ticks, construction. */
  fig.panel = function (ctx, x, y, w, h, o) {
    o = o || {};
    I().machineGrid(ctx, x, y, w, h, { cell: o.cell || 14, ticks: o.ticks, construction: o.construction, cx: o.cx, cy: o.cy });
    return { x: x, y: y, w: w, h: h };
  };

  function lampDrawing(small) {
    return cached('lamp|' + (small ? 's' : 'n'), function () {
      var b = I().drawing('lamp', { w: 2 });
      b.rdisc(0, 0, 50, { color: '@night' });
      b.rcircle(0, 0, 46, { w: 1.5 });
      if (!small) {
        b.rcircle(0, 0, 33, { w: 1, alpha: 0.55 });
        for (var i = 0; i < 12; i++) {
          var a = i / 12 * TAU;
          b.rline(Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a) * 46, Math.sin(a) * 46, { w: 1, alpha: 0.7 });
        }
      }
      // The window: a perfect square lattice of 3 × 3 panes.
      var s = 21;
      b.rrect(-s, -s, s * 2, s * 2, { w: 1.4, fill: '@grid', fillAlpha: 0.55 });
      b.rline(-s / 3, -s, -s / 3, s, { w: 1.1 });
      b.rline(s / 3, -s, s / 3, s, { w: 1.1 });
      b.rline(-s, -s / 3, s, -s / 3, { w: 1.1 });
      b.rline(-s, s / 3, s, s / 3, { w: 1.1 });
      // Two small glows on the ring, never side by side (nothing that could read as eyes).
      var ag = -0.75, am = 2.45;
      b.glow(Math.cos(ag) * 46, Math.sin(ag) * 46, 13, '@glowG', { alpha: 0.9, add: true });
      b.rcircle(Math.cos(ag) * 46, Math.sin(ag) * 46, 2.6, { fill: '@glowG', stroke: false });
      b.glow(Math.cos(am) * 46, Math.sin(am) * 46, 12, '@glowM', { alpha: 0.8, add: true });
      b.rcircle(Math.cos(am) * 46, Math.sin(am) * 46, 2.3, { fill: '@glowM', stroke: false });
      return b.done();
    });
  }

  /* fig.lamp(ctx, x, y, scale, opts) — "la lámpara de IA", centered; scale 1 = 100 px across.
   * opts: t (seconds: tiny regular stars flow through the window), glow (0..1, 1), dim (0..1: the
   * glow fades, e.g. errors accumulating), p (draw-on), stars (true). */
  fig.lamp = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, p = o.p == null ? 1 : o.p, q = Q();
    var small = s < 0.42;
    var glowK = (o.glow == null ? 1 : o.glow) * (1 - 0.75 * (o.dim || 0));
    var d = lampDrawing(small);
    ctx.save();
    // Soft pre-rendered halo (weaker when dimmed), then the ruled body.
    I().glow(ctx, x, y, 96 * s, q.linea, 0.55 * glowK * seg(p, 0, 0.2));
    I().draw(ctx, d, x, y, s, { p: p, colors: glowK < 1 ? { line: P().mix(q.linea, q.rejilla, 0.5 * (o.dim || 0)) } : null });
    // Letters flowing through it like tiny regular stars: evenly spaced on one straight line.
    if (o.stars !== false && p >= 0.75) {
      var t = o.t || 0, n = small ? 4 : 7, sp = 0.09, a = seg(p, 0.75, 1) * (1 - 0.6 * (o.dim || 0));
      ctx.strokeStyle = q.linea;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (var i = 0; i < n; i++) {
        var u = (i / n + t * sp) % 1;
        var px = x + lerp(-32, 32, u) * s, py = y + lerp(24, -24, u) * s;
        var fade = Math.sin(Math.PI * u);
        ctx.globalAlpha = a * fade;
        var r = Math.max(1.6, 3.2 * s);
        ctx.beginPath();
        ctx.moveTo(px - r, py); ctx.lineTo(px + r, py);
        ctx.moveTo(px, py - r); ctx.lineTo(px, py + r);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* fig.lamps(ctx, x, y, scale, opts): several identical lamps in a row ("models").
   * opts: n (3), gap (px at scale 1, 120), t, dim. */
  fig.lamps = function (ctx, x, y, scale, o) {
    o = o || {};
    var n = o.n || 3, gap = (o.gap || 120) * (scale || 1);
    for (var i = 0; i < n; i++) fig.lamp(ctx, x + (i - (n - 1) / 2) * gap, y, scale, { t: o.t, dim: o.dim, p: o.p });
  };

  /* fig.agentLoop(ctx, x, y, scale, opts) -> { stations: [{ x, y }], panel }: the ruled agent loop
   * on its navy panel, with the lamp moving along it. (x, y) = top-left; panel 560×300 at scale 1.
   * opts: labels (verbatim station labels, from data), n (stations, default labels.length or 5),
   * returnTo (index the return arrow goes back to, 1), at (0..1 lamp position along the loop), t, p. */
  fig.agentLoop = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, w = 560 * s, h = 300 * s, p = o.p == null ? 1 : o.p, q = Q(), ink = I();
    var labels = o.labels || [], n = o.n || labels.length || 5;
    fig.panel(ctx, x, y, w, h, { cell: 14 });
    var cx = x + w / 2, cy = y + h / 2 + 6 * s, rx = w * 0.29, ry = h * 0.27, rr = 34 * s;
    // Rounded-rectangle loop (straight sides, perfect quarter circles).
    var pts = [], L = 0, segs = [];
    function addLine(x0, y0, x1, y1) { segs.push({ k: 'l', x0: x0, y0: y0, x1: x1, y1: y1, len: Math.hypot(x1 - x0, y1 - y0) }); }
    function addArc(ax, ay, a0) { segs.push({ k: 'a', x: ax, y: ay, a0: a0, len: rr * Math.PI / 2 }); }
    addLine(cx - rx + rr, cy - ry, cx + rx - rr, cy - ry); addArc(cx + rx - rr, cy - ry + rr, -Math.PI / 2);
    addLine(cx + rx, cy - ry + rr, cx + rx, cy + ry - rr); addArc(cx + rx - rr, cy + ry - rr, 0);
    addLine(cx + rx - rr, cy + ry, cx - rx + rr, cy + ry); addArc(cx - rx + rr, cy + ry - rr, Math.PI / 2);
    addLine(cx - rx, cy + ry - rr, cx - rx, cy - ry + rr); addArc(cx - rx + rr, cy - ry + rr, Math.PI);
    segs.forEach(function (sg) { L += sg.len; });
    function at(u) {
      var d = ((u % 1) + 1) % 1 * L;
      for (var i = 0; i < segs.length; i++) {
        var sg = segs[i];
        if (d <= sg.len) {
          if (sg.k === 'l') return { x: lerp(sg.x0, sg.x1, d / sg.len), y: lerp(sg.y0, sg.y1, d / sg.len) };
          var a = sg.a0 + d / rr;
          return { x: sg.x + Math.cos(a) * rr, y: sg.y + Math.sin(a) * rr };
        }
        d -= sg.len;
      }
      return { x: segs[0].x0, y: segs[0].y0 };
    }
    // Draw the loop progressively.
    ctx.save();
    ctx.strokeStyle = q.linea;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    var steps = 160, shown = Math.round(steps * seg(p, 0, 0.6));
    for (var k = 0; k <= shown; k++) { var pt = at(k / steps); if (k === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); }
    ctx.stroke();
    ctx.restore();
    var stations = [];
    for (var i = 0; i < n; i++) {
      var sp = at(i / n);
      stations.push(sp);
      var ip = seg(p, 0.3 + 0.5 * i / n, 0.4 + 0.5 * i / n);
      if (ip <= 0) continue;
      ink.rRect(ctx, sp.x - 9 * s, sp.y - 9 * s, 18 * s, 18 * s, { fill: q.noche, color: q.linea, w: 1.4, p: ip });
      ink.rRect(ctx, sp.x - 4 * s, sp.y - 4 * s, 8 * s, 8 * s, { fill: q.linea, stroke: false, p: ip, fillAlpha: 0.8 });
      // Ruled arrowhead just after each station.
      var a0 = at(i / n + 0.06), a1 = at(i / n + 0.075);
      ink.rArrow(ctx, a0.x, a0.y, a1.x, a1.y, { color: q.linea, w: 1.4, headSize: 8 * s, p: ip });
      if (labels[i]) {
        var below = sp.y > cy + 1, lx = sp.x, ly = below ? sp.y + 16 * s : sp.y - 16 * s - 18 * s;
        if (Math.abs(sp.y - cy) < ry * 0.5) { lx = sp.x + (sp.x < cx ? -14 * s : 14 * s); ly = sp.y - 9 * s; }
        ink.text(ctx, labels[i], lx, ly, { size: 15 * Math.max(0.9, s), weight: 700, color: M().lienzo, p: ip,
          align: Math.abs(sp.y - cy) < ry * 0.5 ? (sp.x < cx ? 'right' : 'left') : 'center', maxWidth: (Math.abs(sp.y - cy) < ry * 0.5 ? 108 : 150) * s });
      }
    }
    // Return arrow (the loop goes back to "planificar").
    if (o.returnTo != null && n > 1 && p >= 0.85) {
      var from = stations[n - 1], to = stations[o.returnTo];
      ctx.save();
      ctx.strokeStyle = q.brilloVerde;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(cx, cy, to.x, to.y + 10 * s);
      ctx.stroke();
      ctx.restore();
    }
    if (o.at != null && p >= 0.6) {
      var lp = at(o.at);
      fig.lamp(ctx, lp.x, lp.y, 0.34 * s, { t: o.t, p: seg(p, 0.6, 1) });
    } else if (o.at == null && p >= 0.6) {
      fig.lamp(ctx, cx, cy, 0.5 * s, { t: o.t, p: seg(p, 0.6, 1) });
    }
    return { stations: stations, panel: { x: x, y: y, w: w, h: h }, at: at };
  };

  /* fig.ruledLadder(ctx, x, y, scale, opts) -> { rungs: [y], scale }: a machine ladder whose rungs
   * sit at exact heights for their values (honest). (x, y) = bottom-center at the zero line.
   * opts: max (domain top, 100), h (px at scale 1, 360), w (90), rungs [{ value, crack? }] (numbers
   * parsed from data by the caller), ref (a reference value drawn as a dotted line), lampAt (value),
   * panel (true: navy panel behind), t, p. */
  fig.ruledLadder = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, H = (o.h || 360) * s, w = (o.w || 90) * s, max = o.max || 100, p = o.p == null ? 1 : o.p, q = Q(), ink = I();
    var sc = function (v) { return y - v / max * H; };
    if (o.panel !== false) fig.panel(ctx, x - w * 1.6, y - H - 30 * s, w * 3.2, H + 50 * s, { cell: 12 });
    var rails = seg(p, 0, 0.4);
    ink.rLine(ctx, x - w / 2, y, x - w / 2, lerp(y, y - H, rails), { color: q.linea, w: 1.6 });
    ink.rLine(ctx, x + w / 2, y, x + w / 2, lerp(y, y - H, rails), { color: q.linea, w: 1.6 });
    ink.rLine(ctx, x - w * 0.8, y, x + w * 0.8, y, { color: q.linea, w: 1.2, p: rails });
    var ys = [];
    (o.rungs || []).forEach(function (r, i) {
      var ry = sc(r.value), rp = seg(p, 0.35 + 0.4 * i / Math.max(1, o.rungs.length), 0.5 + 0.4 * i / Math.max(1, o.rungs.length));
      ys.push(ry);
      if (rp <= 0) return;
      if (r.crack) {
        // A hairline crack: the rung is drawn in two ruled pieces with a thin zigzag gap.
        var mx = x + w * 0.12;
        ink.rLine(ctx, x - w / 2, ry, mx - 3 * s, ry, { color: q.linea, w: 2.2, p: rp });
        ink.rLine(ctx, mx + 3 * s, ry, x + w / 2, ry, { color: q.linea, w: 2.2, p: rp });
        ink.rPoly(ctx, [mx - 2 * s, ry - 7 * s, mx + 2 * s, ry - 2 * s, mx - 2 * s, ry + 2 * s, mx + 2 * s, ry + 7 * s], { color: q.brilloMagenta, w: 1.1 });
      } else {
        ink.rLine(ctx, x - w / 2, ry, x + w / 2, ry, { color: q.linea, w: 2.2, p: rp });
      }
    });
    if (o.ref != null && p >= 0.8) {
      var fy = sc(o.ref);
      ink.rLine(ctx, x - w * 1.4, fy, x + w * 1.4, fy, { color: q.brilloVerde, w: 1.2, dash: [4, 4] });
    }
    if (o.lampAt != null && p >= 0.5) fig.lamp(ctx, x, sc(o.lampAt) - 18 * s, 0.32 * s, { t: o.t, p: seg(p, 0.5, 0.9) });
    return { rungs: ys, scale: sc, x0: x - w / 2, x1: x + w / 2 };
  };

  /* fig.examPanel(ctx, x, y, scale, opts) -> { x, y, w, h, sheet }: a ruled exam/benchmark panel with
   * a fine grid and a ruled test sheet. (x, y) = top-left; 420×280 at scale 1 (or opts.w, opts.h).
   * opts: rows (sheet lines, 6), checked (how many rows carry a ruled check, 0), lamp (true), t, p. */
  fig.examPanel = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, w = (o.w || 420) * s, h = (o.h || 280) * s, p = o.p == null ? 1 : o.p, q = Q(), ink = I();
    fig.panel(ctx, x, y, w, h, { cell: 12 });
    var sx = x + w * 0.08, sy = y + h * 0.14, sw = w * 0.5, sh = h * 0.72;
    ink.rRect(ctx, sx, sy, sw, sh, { color: q.linea, w: 1.4, fill: q.noche, p: seg(p, 0, 0.4) });
    ink.rLine(ctx, sx, sy + sh * 0.14, sx + sw, sy + sh * 0.14, { color: q.linea, w: 1.2, p: seg(p, 0.2, 0.5) });
    var rows = o.rows || 6;
    for (var i = 0; i < rows; i++) {
      var ry = sy + sh * (0.26 + 0.68 * i / rows), rp = seg(p, 0.3 + 0.4 * i / rows, 0.45 + 0.4 * i / rows);
      ink.rRect(ctx, sx + 10 * s, ry - 5 * s, 10 * s, 10 * s, { color: q.linea, w: 1.1, p: rp });
      ink.rLine(ctx, sx + 28 * s, ry, sx + sw - 14 * s, ry, { color: q.linea, w: 1, p: rp, alpha: 0.7 });
      if (i < (o.checked || 0) && rp >= 1) ink.rPoly(ctx, [sx + 11 * s, ry, sx + 15 * s, ry + 4 * s, sx + 21 * s, ry - 6 * s], { color: q.brilloVerde, w: 1.6 });
    }
    if (o.lamp !== false) fig.lamp(ctx, x + w * 0.78, y + h * 0.5, 0.62 * s, { t: o.t, p: seg(p, 0.3, 1) });
    return { x: x, y: y, w: w, h: h, sheet: { x: sx, y: sy, w: sw, h: sh } };
  };

  /* fig.serverTower(ctx, x, y, scale, opts) -> { x, y, w, h }: a ruled tower of identical cells.
   * (x, y) = bottom-center; 120×300 at scale 1. opts: rows (14), lit (status dots on, 1), p. */
  fig.serverTower = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, w = 120 * s, h = 300 * s, p = o.p == null ? 1 : o.p, q = Q(), ink = I();
    var x0 = x - w / 2, y0 = y - h;
    I().glow(ctx, x, y - h / 2, h * 0.65, q.linea, 0.22 * seg(p, 0, 0.3));
    ink.rRect(ctx, x0, y0, w, h, { fill: q.noche, color: q.linea, w: 1.6, p: seg(p, 0, 0.3) });
    var rows = o.rows || 14, ch = (h - 16 * s) / rows;
    for (var i = 0; i < rows; i++) {
      var cy = y0 + 8 * s + i * ch, rp = seg(p, 0.2 + 0.6 * i / rows, 0.3 + 0.6 * i / rows);
      if (rp <= 0) continue;
      ink.rRect(ctx, x0 + 8 * s, cy + 2 * s, w - 16 * s, ch - 4 * s, { color: q.rejilla, w: 1.1, fill: P().mix(q.noche, q.rejilla, 0.45), p: rp });
      ink.rLine(ctx, x0 + 16 * s, cy + ch / 2, x0 + w * 0.55, cy + ch / 2, { color: q.linea, w: 1, alpha: 0.6, p: rp });
      if ((o.lit == null ? 1 : o.lit) > 0) {
        ctx.fillStyle = i % 3 === 0 ? q.brilloMagenta : q.brilloVerde;
        ctx.globalAlpha = rp;
        ctx.beginPath(); ctx.arc(x0 + w - 18 * s, cy + ch / 2, 2.2 * Math.max(0.8, s), 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ink.rRect(ctx, x0 - 10 * s, y - 2, w + 20 * s, 8 * s, { fill: q.rejilla, color: q.linea, w: 1.2, p: seg(p, 0, 0.3) });
    return { x: x0, y: y0, w: w, h: h };
  };

  /* fig.computeBlock(ctx, x, y, scale, opts) -> { x, y, w, h, litW }: a block of identical cells;
   * opts.fraction (0..1, exact area: a vertical slice from the left lights up, e.g. a parsed 9,6%
   * → 0.096), cols (20), rows (8), cell (px at scale 1, 16), litColor (brillo verde), p (the slice
   * grows from zero and lands exactly). (x, y) = top-left. */
  fig.computeBlock = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, cols = o.cols || 20, rows = o.rows || 8, c = (o.cell || 16) * s, q = Q(), ink = I();
    var w = cols * c, h = rows * c, p = o.p == null ? 1 : o.p;
    ink.rRect(ctx, x, y, w, h, { fill: q.noche, stroke: false });
    var f = clamp(o.fraction || 0, 0, 1), g = 1 - Math.pow(1 - seg(p, 0.2, 1), 3), litW = w * f * g;
    if (litW > 0) {
      ctx.save();
      ctx.globalAlpha *= 0.85;
      ctx.fillStyle = o.litColor || q.brilloVerde;
      ctx.fillRect(x, y, litW, h);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = q.linea;
    ctx.lineWidth = 1;
    ctx.globalAlpha *= 0.8 * seg(p, 0, 0.3);
    ctx.beginPath();
    for (var i = 0; i <= cols; i++) { ctx.moveTo(x + i * c, y); ctx.lineTo(x + i * c, y + h); }
    for (var j = 0; j <= rows; j++) { ctx.moveTo(x, y + j * c); ctx.lineTo(x + w, y + j * c); }
    ctx.stroke();
    ctx.restore();
    if (litW > 0 && p >= 1) ink.rLine(ctx, x + litW, y - 4, x + litW, y + h + 4, { color: M().lienzo, w: 1.6 });
    return { x: x, y: y, w: w, h: h, litW: litW };
  };

  /* fig.lampOnWheels(ctx, x, y, scale, opts): a lamp on thin ruled wheels with a plain pennant
   * (no names, flags or logos). (x, y) = ground contact center; ~150 px tall at scale 1.
   * opts: pattern ('puntos' | 'rayas' | 'estrellas' | 'cuadros' | 'ondas' | 'espirales'),
   * pennantColor (lienzo), t (wheels turn, pennant flutters), p. */
  fig.lampOnWheels = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, t = o.t || 0, q = Q(), ink = I(), p = o.p == null ? 1 : o.p;
    var wr = 16 * s, ay = y - wr;
    [-26, 26].forEach(function (dx, i) {
      var wx = x + dx * s;
      ink.rCircle(ctx, wx, ay, wr, { color: q.linea, w: 1.3, p: seg(p, 0, 0.4) });
      var rot = -t * 2.2 + i;
      ctx.save();
      ctx.strokeStyle = q.linea; ctx.lineWidth = 1; ctx.globalAlpha *= seg(p, 0.2, 0.5);
      ctx.beginPath();
      for (var k = 0; k < 3; k++) {
        var a = rot + k * Math.PI / 3;
        ctx.moveTo(wx + Math.cos(a) * wr, ay + Math.sin(a) * wr);
        ctx.lineTo(wx - Math.cos(a) * wr, ay - Math.sin(a) * wr);
      }
      ctx.stroke();
      ctx.restore();
    });
    ink.rLine(ctx, x - 26 * s, ay, x + 26 * s, ay, { color: q.linea, w: 1.3, p: seg(p, 0, 0.4) });
    ink.rLine(ctx, x, ay, x, ay - 22 * s, { color: q.linea, w: 1.3, p: seg(p, 0.1, 0.4) });
    fig.lamp(ctx, x, ay - 52 * s, 0.6 * s, { t: t, p: seg(p, 0.2, 1) });
    // Pennant on a thin pole behind.
    var px = x - 30 * s, top = ay - 118 * s;
    ink.rLine(ctx, px, ay, px, top, { color: q.linea, w: 1.2, p: seg(p, 0.3, 0.6) });
    if (p >= 0.6) {
      var fl = Math.sin(t * 3 + x * 0.01) * 4 * s;
      var tri = new Path2D();
      tri.moveTo(px, top);
      tri.lineTo(px - 44 * s, top + 12 * s + fl);
      tri.lineTo(px, top + 26 * s);
      tri.closePath();
      ctx.save();
      ctx.fillStyle = o.pennantColor || M().lienzo;
      ctx.fill(tri);
      ctx.restore();
      if (o.pattern) fig.pattern(ctx, o.pattern, px - 46 * s, top - 2, 48 * s, 30 * s, { clip: tri, spacing: 8 * s, seed: 'pen' + o.pattern });
      ctx.save();
      ctx.strokeStyle = q.linea; ctx.lineWidth = 1.2;
      ctx.stroke(tri);
      ctx.restore();
    }
  };

  /* fig.ruledSieve(ctx, x, y, scale, opts): a ruled sieve (perfect rim, regular mesh, straight
   * handle). (x, y) = center of the rim; 160 px across at scale 1. opts: t (letters fall through),
   * letters (true), p. */
  fig.ruledSieve = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, R = 80 * s, q = Q(), ink = I(), p = o.p == null ? 1 : o.p;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, R, R * 0.38, 0, 0, TAU);
    ctx.fillStyle = q.noche;
    ctx.globalAlpha *= 0.9 * seg(p, 0, 0.3);
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = seg(p, 0.2, 0.6);
    ctx.strokeStyle = q.linea; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = -R; i <= R; i += 12 * s) { ctx.moveTo(x + i, y - R); ctx.lineTo(x + i, y + R); ctx.moveTo(x - R, y + i * 0.38); ctx.lineTo(x + R, y + i * 0.38); }
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = q.linea; ctx.lineWidth = 1.8;
    ctx.globalAlpha *= seg(p, 0, 0.4);
    ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.38, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + R, y); ctx.lineTo(x + R * 1.8, y - R * 0.18); ctx.stroke();
    ctx.restore();
    if (o.letters !== false && p >= 0.6) {
      var t = o.t || 0, r = E.rng.create('sieve');
      ctx.save();
      ctx.fillStyle = q.linea;
      for (var k = 0; k < 9; k++) {
        var lx = x + r.range(-R * 0.7, R * 0.7), phase = r();
        var u = ((t * 0.35 + phase) % 1), ly = y - R * 0.6 + u * R * 1.8;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.9;
        ctx.fillRect(lx, ly, 6 * s, 2 * s);
        ctx.fillRect(lx + 2 * s, ly - 3 * s, 2 * s, 8 * s);
      }
      ctx.restore();
    }
  };

  /* fig.weightsBox(ctx, x, y, scale, opts): a ruled box holding a tidy grid of identical weights.
   * (x, y) = top-left; 220×150 at scale 1. opts: lid ('open' | 'closed' | 'transparent'),
   * drawers (number of closed drawers below, 0), p. Returns { box, drawers: [rects] }. */
  fig.weightsBox = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, w = 220 * s, h = 150 * s, q = Q(), ink = I(), p = o.p == null ? 1 : o.p, lid = o.lid || 'closed';
    ink.rRect(ctx, x, y, w, h, { fill: q.noche, color: q.linea, w: 1.6, p: seg(p, 0, 0.3) });
    if (lid !== 'closed') {
      var cols = 10, rows = 5, cw = (w - 30 * s) / cols, chh = (h - 30 * s) / rows;
      ctx.save();
      ctx.fillStyle = q.linea;
      ctx.globalAlpha *= 0.85 * seg(p, 0.3, 0.7);
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) ctx.fillRect(x + 15 * s + i * cw + cw * 0.2, y + 15 * s + j * chh + chh * 0.2, cw * 0.6, chh * 0.6);
      ctx.restore();
    }
    if (lid === 'closed' || lid === 'transparent') {
      ctx.save();
      if (lid === 'transparent') { ctx.globalAlpha *= 0.25; }
      ink.rRect(ctx, x - 6 * s, y - 14 * s, w + 12 * s, 14 * s, { fill: lid === 'closed' ? q.rejilla : q.linea, color: q.linea, w: 1.4, p: seg(p, 0.4, 0.7) });
      ctx.restore();
      if (lid === 'transparent') ink.rRect(ctx, x - 6 * s, y - 14 * s, w + 12 * s, 14 * s, { color: q.linea, w: 1.4, p: seg(p, 0.4, 0.7) });
    } else {
      ink.rLine(ctx, x, y, x - 30 * s, y - 60 * s, { color: q.linea, w: 1.4, p: seg(p, 0.4, 0.7) });
    }
    var drawers = [];
    for (var k = 0; k < (o.drawers || 0); k++) {
      var dy = y + h + 8 * s + k * 40 * s;
      ink.rRect(ctx, x, dy, w, 34 * s, { fill: q.noche, color: q.linea, w: 1.4, p: seg(p, 0.5, 0.8) });
      ink.rLine(ctx, x + w / 2 - 14 * s, dy + 17 * s, x + w / 2 + 14 * s, dy + 17 * s, { color: q.linea, w: 2 });
      drawers.push({ x: x, y: dy, w: w, h: 34 * s });
    }
    return { box: { x: x, y: y, w: w, h: h }, drawers: drawers };
  };

  /* @@figures-more@@ */
})(typeof window !== 'undefined' ? window : globalThis);
