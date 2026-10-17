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
    var r = b.r, n = o.rays || r.int(6, 9), a0 = r() * TAU, strokes = Math.max(3, Math.floor(n / 2));
    var center = o.center !== undefined ? o.center : (r() < 0.35 ? 'color' : r() < 0.45 ? 'dot' : null);
    if (center === 'color') b.blob(0, 0, 9, 8, { fill: '@a', line: false, irr: 0.18 });
    // Crossing strokes (each one gives two points of different lengths), plus a lone ray when odd.
    for (var i = 0; i < strokes; i++) {
      var a = a0 + i / strokes * Math.PI + r.jitter(0.2), l1 = r.range(26, 47), l2 = r.range(18, 44);
      var cx = r.jitter(2.5), cy = r.jitter(2.5);
      b.stroke([Math.cos(a) * l1, Math.sin(a) * l1, cx, cy, -Math.cos(a) * l2, -Math.sin(a) * l2],
        { w: r.range(3.8, 5.8), profile: 'swell', press: 0.25 });
    }
    if (n % 2) ray(b, a0 + Math.PI / (2 * strokes) + r.jitter(0.2), 4, r.range(22, 38), r.range(3.4, 5), r.jitter(2));
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

  // =============================================================================================
  // PEOPLE (prompt §3.4): rounded biomorphic bodies in flat color, black brush outlines, dot eyes,
  // small smiles, hair as calligraphic strokes, clear poses. Built in a 100-unit-tall frame with the
  // feet at y = 0; scale 1 = 100 px tall. No real or famous people, no logos, nothing grotesque.

  var NECK = -75;
  // Arm chains (shoulder, elbow, hand) per pose, for the right arm (x > 0) and left arm (x < 0).
  var POSES = {
    standing: { r: [11, -71, 15, -57, 14, -45], l: [-11, -71, -15, -57, -14, -45], tilt: 0 },
    reading: { r: [11, -71, 14, -60, 5, -56], l: [-11, -71, -14, -60, -5, -56], tilt: 0.13, prop: 'held' },
    writing: { r: [11, -71, 17, -61, 5, -59], l: [-11, -71, -14, -60, -6, -55], tilt: 0.12, prop: 'held' },
    pointing: { r: [11, -71, 24, -79, 37, -86], l: [-11, -71, -15, -58, -13, -46], tilt: -0.06 },
    presenting: { r: [11, -71, 25, -64, 37, -63], l: [-11, -71, -15, -58, -13, -46], tilt: -0.04 },
    asking: { r: [11, -71, 17, -63, 7, -78], l: [-11, -71, -14, -60, -6, -56], tilt: 0.09, prop: 'held' },
    lookingUp: { r: [11, -71, 15, -57, 14, -45], l: [-11, -71, -15, -57, -14, -45], tilt: -0.24, eyesUp: true },
    waving: { r: [11, -71, 21, -83, 22, -97], l: [-11, -71, -15, -57, -14, -45], tilt: -0.05 },
    carrying: { r: [11, -71, 19, -82, 12, -94], l: [-11, -71, -18, -82, -12, -94], tilt: 0 },
    catching: { r: [11, -71, 23, -70, 33, -74], l: [-11, -71, -6, -62, 6, -66], tilt: -0.08, prop: 'open' },
    tying: { r: [11, -71, 22, -64, 31, -60], l: [-11, -71, 2, -64, 22, -58], tilt: 0.08 },
    walking: { r: [11, -71, 17, -58, 19, -46], l: [-11, -71, -16, -59, -20, -48], tilt: 0, walk: true }
  };
  fig.poses = function () { return Object.keys(POSES); };

  var HAIRS = ['short', 'bob', 'long', 'bun', 'curly', 'ponytail', 'braids', 'bald'];
  var OUTFITS = { directiva: 'blazer', servidor: 'shirt', docente: 'cardigan', investigadora: 'coat', medica: 'coat',
    desarrollador: 'hoodie', estudiante: 'shirt', campesina: 'dress', lectora: 'dress', persona: 'shirt' };

  function personSpec(o) {
    var role = o.role || 'persona';
    var r = E.rng.create('person:' + (o.seed == null ? role : o.seed));
    var m = M();
    var spec = {
      role: role,
      pose: POSES[o.pose] ? o.pose : 'standing',
      hair: o.hair || r.pick(HAIRS),
      outfit: o.outfit || OUTFITS[role] || 'shirt',
      skin: o.skin != null ? o.skin : r.int(0, 4),
      hairColor: o.hairColor || r.pick([m.tinta, m.tinta, m.madera, m.siena, m.lienzoOcre]),
      cloth: o.cloth || r.pick([m.rojo, m.azul, m.amarillo, m.verde, m.tierra, m.celeste]),
      legs: o.legs || r.pick([m.tinta, m.azul, m.madera, m.siena]),
      width: o.width || r.range(0.9, 1.18),
      height: o.height || (role === 'estudiante' ? r.range(0.88, 0.95) : r.range(0.94, 1.04)),
      glasses: o.glasses != null ? !!o.glasses : r() < 0.2,
      cheeks: o.cheeks != null ? !!o.cheeks : r() < 0.5,
      prop: o.prop || null,
      seed: String(o.seed == null ? role : o.seed)
    };
    if (spec.outfit === 'coat') spec.cloth = m.lienzo;
    return spec;
  }

  function personKey(sp) {
    return ['person', sp.role, sp.pose, sp.hair, sp.outfit, sp.skin, sp.hairColor, sp.cloth, sp.legs, sp.width.toFixed(3), sp.height.toFixed(3),
      sp.glasses ? 1 : 0, sp.cheeks ? 1 : 0, sp.prop || '', sp.seed].join('|');
  }

  function wx(pts, k) { var out = pts.slice(); for (var i = 0; i < out.length; i += 2) out[i] *= k; return out; }

  function hairBack(b, sp) {
    var hc = '@hair';
    switch (sp.hair) {
      case 'bob': b.shape([-14, -90, -12.5, -98, 0, -101.5, 12.5, -98, 14, -90, 14.5, -79, 10, -76.5, -10, -76.5, -14.5, -79], { fill: hc, w: 2.2 }); break;
      case 'long': b.shape([-14, -92, -12, -99, 0, -102, 12, -99, 14, -92, 16, -76, 15, -64, 8, -66, -8, -66, -15, -64, -16, -76], { fill: hc, w: 2.2 }); break;
      case 'ponytail': b.shape([10, -95, 17, -90, 21, -78, 18, -68, 15, -78, 12, -88], { fill: hc, w: 2 }); break;
      case 'braids':
        [-1, 1].forEach(function (sd) {
          for (var i = 0; i < 4; i++) b.ellipse(sd * 13.5, -80 + i * 5.2, 2.8, 3.2, { fill: hc, w: 1.4 });
        });
        break;
    }
  }
  function hairFront(b, sp) {
    var hc = '@hair';
    switch (sp.hair) {
      case 'short': b.shape([-11.8, -88, -10.5, -96, -3, -99.5, 6, -99, 11.5, -94, 12, -87, 7, -92, 0, -93.5, -6, -92], { fill: hc, w: 2.2 }); break;
      case 'bob': b.shape([-11.8, -88, -10, -96, 0, -99.8, 10, -96, 11.8, -88, 7, -93.5, 1, -94.6, -5, -93.6], { fill: hc, w: 2.2 }); b.stroke([-2, -95, 1, -97.5, 4, -95.5], { w: 0.9, profile: 'hair', color: '@paper' }); break;
      case 'long': case 'braids': case 'ponytail':
        b.shape([-11.8, -88, -9.5, -96.5, 0, -99.8, 9.5, -96.5, 11.8, -88, 4, -94, -3, -93.5], { fill: hc, w: 2.2 }); break;
      case 'bun':
        b.circle(1, -101, 5.6, { fill: hc, w: 2 });
        b.shape([-11.8, -88, -9.5, -96.5, 0, -99.6, 9.5, -96.5, 11.8, -88, 5, -93.5, -4, -93.5], { fill: hc, w: 2.2 });
        break;
      case 'curly':
        for (var i = 0; i < 6; i++) {
          var a = Math.PI * (1.05 + i * 0.18);
          b.circle(Math.cos(a) * 10.5, -89 + Math.sin(a) * 10.5, 4.4, { fill: hc, w: 1.8 });
        }
        break;
      case 'bald':
        b.stroke([-5, -97, -1, -99.5, 3, -97.5], { w: 1.2, profile: 'hair' });
        b.stroke([-9, -93, -7, -96], { w: 1, profile: 'hair' });
        break;
    }
  }

  function headInto(b, sp, pose) {
    hairBack(b, sp);
    b.circle(0, -86.5, 11.6, { fill: '@skin', w: 2.5 });
    hairFront(b, sp);
    var ey = POSES[pose].eyesUp ? -88.3 : -86.6;
    b.dot(-4.2, ey, 1.4);
    b.dot(4.2, ey, 1.4);
    if (sp.cheeks) { b.dot(-6.8, -82.4, 1.9, { color: '@cheek' }); b.dot(6.8, -82.4, 1.9, { color: '@cheek' }); }
    if (POSES[pose].eyesUp) b.stroke([-2.4, -81, 0, -79.8, 2.4, -81], { w: 1.1, profile: 'even' });
    else b.stroke([-3.6, -81.6, 0, -79.6, 3.6, -81.6], { w: 1.2, profile: 'even' });
    if (sp.glasses) {
      b.stroke(arc(-4.3, ey, 3.9, 0, TAU, 12), { w: 1.15, profile: 'even' });
      b.stroke(arc(4.3, ey, 3.9, 0, TAU, 12), { w: 1.15, profile: 'even' });
      b.stroke([-0.6, ey - 0.4, 0.6, ey - 0.4], { w: 1, profile: 'even' });
      b.stroke([-8.1, ey - 0.8, -11.2, ey - 1.6], { w: 0.9, profile: 'even' });
      b.stroke([8.1, ey - 0.8, 11.2, ey - 1.6], { w: 0.9, profile: 'even' });
    }
    if (sp.role === 'campesina') {
      b.shape([-19, -95, -10, -98, 0, -99, 10, -98, 19, -95, 10, -93.5, 0, -93, -10, -93.5], { fill: M().tierra, w: 2 });
      b.shape([-9, -96, -8, -104, 0, -106, 8, -104, 9, -96], { fill: M().tierra, w: 2 });
    }
  }

  function bodyInto(b, sp, pose) {
    var k = sp.width, P2 = POSES[pose];
    var walk = !!P2.walk;
    // Legs / trousers first (behind the torso).
    if (sp.outfit === 'dress') {
      b.stroke(walk ? [-5, -31, -8, -16, -11, -3] : [-5.5, -31, -6, -16, -6.5, -3], { w: 3.6, profile: 'blunt' });
      b.stroke(walk ? [5, -31, 7, -16, 9, -3] : [5.5, -31, 6, -16, 6.5, -3], { w: 3.6, profile: 'blunt' });
    } else {
      var tr = walk ? [-12, -39, 12, -39, 11.5, -22, 13, -3, 6, -3, 1.5, -24, -1.5, -24, -7, -3, -14, -3, -11.5, -22]
        : [-12, -39, 12, -39, 11.5, -21, 9.5, -3, 3, -3, 1, -25, -1, -25, -3, -3, -9.5, -3, -11.5, -21];
      b.shape(wx(tr, k), { fill: '@legs', w: 2.4 });
    }
    var fx = walk ? [-11, 10] : [-7.5, 7.5];
    b.ellipse(fx[0] * (sp.outfit === 'dress' ? 1 : k) - 1.5, -1.8, 5, 2.4, { fill: '@ink', w: 1.2 });
    b.ellipse(fx[1] * (sp.outfit === 'dress' ? 1 : k) + 1.5, -1.8, 5, 2.4, { fill: '@ink', w: 1.2 });
    // Torso.
    var torso;
    switch (sp.outfit) {
      case 'dress': torso = [-11.5, -73, -7, -75.8, 7, -75.8, 11.5, -73, 13, -61, 14.2, -47, 16.6, -30.5, 0, -29.2, -16.6, -30.5, -14.2, -47, -13, -61]; break;
      case 'coat': torso = [-12.5, -73, -7, -75.8, 7, -75.8, 12.5, -73, 14.8, -60, 15.4, -42, 17.4, -21, 3, -20, 0, -25, -3, -20, -17.4, -21, -15.4, -42, -14.8, -60]; break;
      default: torso = [-12, -73, -7, -75.8, 7, -75.8, 12, -73, 14, -61, 13.6, -49, 13, -37.5, 0, -36.5, -13, -37.5, -13.6, -49, -14, -61];
    }
    var tb = b.shape(wx(torso, k), { fill: '@outfit', w: 2.6 });
    switch (sp.outfit) {
      case 'coat': b.stroke([0, -75, 0.5, -50, 0, -26], { w: 1.4, profile: 'even' }); b.stroke([-4, -75, 0, -66, 4, -75], { w: 1.4, profile: 'even' }); break;
      case 'blazer': b.stroke([-5, -75, 0, -62, 5, -75], { w: 1.6, profile: 'even' }); b.fill(wx([-4, -75, 0, -63, 4, -75], 1), { fill: '@paper', tex: false }); break;
      case 'cardigan': b.stroke([0, -74, 0, -38], { w: 1.3, profile: 'even' }); b.dot(-2.2, -60, 0.9); b.dot(-2.2, -50, 0.9); break;
      case 'hoodie': b.blob(0, -76, 9, 3.6, { fill: '@outfit', w: 1.8, irr: 0.05 }); b.stroke([-6, -48, 6, -48], { w: 1.3, profile: 'even' }); break;
      case 'shirt': b.stroke([-3.5, -75.5, 0, -71, 3.5, -75.5], { w: 1.4, profile: 'even' }); break;
    }
    if (sp.role === 'lectora') {
      // Her red scarf.
      b.shape([-8, -76.5, 0, -73, 8, -76.5, 7, -72, 0, -70.5, -7, -72], { fill: '@accent', w: 1.8 });
      b.shape([3, -72, 7, -60, 3.5, -59, 1, -71], { fill: '@accent', w: 1.6 });
    }
    if (sp.role === 'medica') {
      b.stroke([-6, -75, -7, -66, -3, -60, 2, -61, 5, -66, 5, -75], { w: 1.4, profile: 'even' });
      b.circle(2.2, -58.5, 2.3, { fill: M().celeste, w: 1.2 });
    }
    if (sp.role === 'estudiante') b.stroke([-9, -74, -11, -58, -12.5, -44], { w: 2, profile: 'even', color: M().siena });
    return tb;
  }

  function heldProp(b, sp, pose) {
    var P2 = POSES[pose], prop = sp.prop || (P2.prop ? (sp.role === 'lectora' ? 'notebook' : null) : null);
    if (!prop) return;
    var m = M();
    var hr = P2.r, hl = P2.l;
    var cx = (hr[4] + hl[4]) / 2, cy = (hr[5] + hl[5]) / 2;
    switch (prop) {
      case 'notebook':
        if (P2.prop === 'open') {
          b.shape([-4, -72, 6, -73, 16, -70, 16, -60, 6, -62, -4, -61], { fill: '@paper', w: 1.8, fillScale: 0 });
          b.stroke([6, -72.5, 6, -62], { w: 1.2, profile: 'even' });
        } else {
          b.shape(box(cx - 8, cy - 9, cx + 8, cy + 3, 0.1), { fill: '@book', w: 1.9, fillScale: 0 });
          b.fill(box(cx - 6.5, cy - 7.5, cx + 6.5, cy + 1.5, 0.1), { fill: '@paper', fillScale: 0, tex: false });
          b.stroke([cx - 4.5, cy - 4.5, cx + 4.5, cy - 4.8], { w: 0.9, profile: 'even' });
          b.stroke([cx - 4.5, cy - 1.6, cx + 3, cy - 1.8], { w: 0.9, profile: 'even' });
        }
        break;
      case 'book': b.shape(box(cx - 9, cy - 8, cx + 9, cy + 4, 0.1), { fill: m.rojo, w: 1.9, fillScale: 0 }); break;
      case 'phone': b.shape(box(hr[4] - 2.5, hr[5] - 8, hr[4] + 2.5, hr[5] + 1, 0.2), { fill: m.tinta, w: 1.2, fillScale: 0 }); break;
      case 'clipboard':
        b.shape(box(cx - 8, cy - 11, cx + 8, cy + 4, 0.08), { fill: m.madera, w: 1.8, fillScale: 0 });
        b.fill(box(cx - 6, cy - 8, cx + 6, cy + 2.5, 0.08), { fill: '@paper', fillScale: 0, tex: false });
        break;
      case 'laptop':
        b.shape([cx - 12, cy - 2, cx + 12, cy - 2, cx + 14, cy + 2, cx - 14, cy + 2], { fill: m.lienzoOcre, w: 1.6, fillScale: 0 });
        b.shape([cx - 11, cy - 2, cx - 9, cy - 16, cx + 9, cy - 16, cx + 11, cy - 2], { fill: m.lienzoOcre, w: 1.6, fillScale: 0 });
        b.dot(cx, cy - 9, 1.6, { color: m.tierra });
        break;
      case 'flask':
        b.shape([hr[4] - 1.5, hr[5] - 12, hr[4] - 1.5, hr[5] - 7, hr[4] - 6, hr[5] + 1, hr[4] + 6, hr[5] + 1, hr[4] + 1.5, hr[5] - 7, hr[4] + 1.5, hr[5] - 12],
          { fill: m.celeste, w: 1.4, fillScale: 0 });
        break;
      case 'folder': b.shape(box(cx - 10, cy - 8, cx + 10, cy + 4, 0.08), { fill: m.amarillo, w: 1.8, fillScale: 0 }); break;
      case 'plank': b.shape([-28, -97, 30, -95, 30, -91, -28, -93], { fill: m.tierra, w: 1.8, fillScale: 0 }); break;
      case 'spyglass':
        b.shape(rotPts([4, -88, 30, -88, 30, -82, 4, -83], -0.25, 4, -86), { fill: m.madera, w: 1.6, fillScale: 0 });
        break;
    }
  }

  function personDrawing(sp) {
    return cached(personKey(sp), function () {
      var b = I().drawing('person:' + sp.seed + ':' + sp.pose, { w: 2.6, jitter: 0.25 });
      var pose = sp.pose, P2 = POSES[pose];
      bodyInto(b, sp, pose);
      // The head tilts around the neck; build it in its own builder space by rotating points.
      var hb = I().drawing('head:' + sp.seed + ':' + pose, { w: 2.4, jitter: 0.15 });
      headInto(hb, sp, pose);
      var head = hb.done();
      var tilt = P2.tilt || 0;
      b.custom(function (ctx, e, o, s) {
        ctx.save();
        ctx.translate(0, NECK);
        ctx.rotate(tilt);
        ctx.translate(0, -NECK);
        I().draw(ctx, head, 0, 0, 1, { p: e, colors: o.colors, mono: o.mono, offset: (o.offset != null ? o.offset : clamp(3.1 * Math.sqrt(s), 1, 4)) / s,
          weight: (o.weight || 1) * I().weightFor(s) / I().weightFor(1) });
        ctx.restore();
      }, { t: [0, 0.75], len: 80 });
      // Arms over the torso, then hands and any held prop.
      var hand = function (c) { b.circle(c[4], c[5], 2.9, { fill: '@skin', w: 1.5 }); };
      if (P2.prop) heldProp(b, sp, pose);
      b.stroke([P2.r[0], P2.r[1], P2.r[2], P2.r[3], P2.r[4], P2.r[5]], { w: 3.3, profile: 'blunt' });
      b.stroke([P2.l[0], P2.l[1], P2.l[2], P2.l[3], P2.l[4], P2.l[5]], { w: 3.3, profile: 'blunt' });
      if (!P2.prop) heldProp(b, sp, pose);
      hand(P2.r);
      hand(P2.l);
      if (sp.role === 'lectora' && (pose === 'writing' || pose === 'asking' || pose === 'pointing' || pose === 'catching' || pose === 'reading')) {
        var h = P2.r;
        b.stroke([h[4] + 1, h[5] + 2, h[4] + 7, h[5] - 8], { w: 2.4, profile: 'blunt', color: M().amarillo });
        b.dot(h[4] + 7.4, h[5] - 8.6, 1, { color: '@ink' });
      }
      return b.done({ colors: null });
    });
  }

  function personColors(sp, o) {
    var m = M();
    return merge({
      skin: P().pieles[clamp(sp.skin, 0, 4)], hair: sp.hairColor, outfit: sp.cloth, legs: sp.legs, accent: m.rojo,
      cheek: P().mix(m.rojo, P().pieles[clamp(sp.skin, 0, 4)], 0.45), book: m.azul, paper: m.lienzo
    }, o.colors);
  }

  /* fig.person(ctx, x, y, scale, opts) — one friendly personaje. (x, y) = between the feet on the
   * ground; scale 1 = 100 px tall (good from 0.8 to 4).
   * opts: role ('directiva' | 'servidor' | 'docente' | 'investigadora' | 'medica' | 'desarrollador' |
   *   'estudiante' | 'campesina' | 'persona'), pose (fig.poses()), seed (picks skin, hair, colors),
   *   skin (0..4, Pieles), hair (short | bob | long | bun | curly | ponytail | braids | bald),
   *   hairColor, cloth, legs, outfit (dress | coat | blazer | cardigan | hoodie | shirt), glasses,
   *   prop (notebook | book | phone | clipboard | laptop | flask | folder | plank | spyglass),
   *   facing (1 right, -1 left), p (draw-on), colors (slot overrides), mono. */
  fig.person = function (ctx, x, y, scale, o) {
    o = o || {};
    var sp = personSpec(o);
    var d = personDrawing(sp);
    var s = (scale || 1) * sp.height;
    I().draw(ctx, d, x, y, s, { p: o.p, colors: personColors(sp, o), flip: o.facing === -1, mono: o.mono, alpha: o.alpha, rot: o.rot });
    return { x: x, y: y, top: y - 100 * s, head: { x: x, y: y - 86.5 * s, r: 11.6 * s }, hand: handPos(sp, x, y, s, o.facing) };
  };
  function handPos(sp, x, y, s, facing) {
    var P2 = POSES[sp.pose], f = facing === -1 ? -1 : 1;
    return { right: { x: x + P2.r[4] * s * f, y: y + P2.r[5] * s }, left: { x: x + P2.l[4] * s * f, y: y + P2.l[5] * s } };
  }

  /* fig.lectora(ctx, x, y, scale, opts) — the recurring reader who voices the critical questions:
   * round glasses, notebook and pencil, yellow dress and red scarf; same design in every video.
   * opts: pose ('reading' default | 'writing' | 'asking' | 'pointing' | 'catching' | 'tying' |
   * 'standing' | 'lookingUp' | 'walking'), facing, p. She never holds a magnifying glass. */
  fig.lectora = function (ctx, x, y, scale, o) {
    o = o || {};
    var m = M();
    return fig.person(ctx, x, y, scale, merge({
      role: 'lectora', seed: 'lectora', pose: o.pose || 'reading', hair: 'bob', outfit: 'dress', skin: 2, glasses: true, cheeks: true,
      hairColor: m.tinta, cloth: m.amarillo, legs: m.tinta, width: 1.04, height: 1, prop: 'notebook'
    }, { pose: o.pose || 'reading', facing: o.facing, p: o.p, alpha: o.alpha, colors: o.colors }));
  };

  /* fig.team(ctx, x, y, scale, opts) -> { top: { x, y, w } }: 3–4 diverse people around a table.
   * (x, y) = front center of the table on the floor; scale 1 = table 320 px wide.
   * opts: n (4), seeds (array), p. The returned table top is where a card can be laid. */
  fig.team = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, n = o.n || 4, p = o.p == null ? 1 : o.p, m = M();
    var poses = ['presenting', 'writing', 'pointing', 'reading'];
    var roles = ['directiva', 'docente', 'desarrollador', 'servidor'];
    var hairs = ['short', 'long', 'curly', 'bun'];
    for (var i = 0; i < n; i++) {
      var u = n === 1 ? 0 : i / (n - 1) - 0.5;
      fig.person(ctx, x + u * 250 * s, y - 14 * s, 1.55 * s, {
        role: roles[i % 4], seed: (o.seeds && o.seeds[i]) || ('team' + i), pose: poses[i % 4], hair: hairs[i % 4], skin: [0, 3, 1, 4][i % 4],
        facing: u < 0 ? 1 : -1, p: seg(p, i * 0.1, 0.6 + i * 0.1)
      });
    }
    // The table in front: a warm wooden top and a front panel down to the floor.
    var tw = 340 * s, top = y - 76 * s;
    fig.table(ctx, x, y, s, { w: 340, h: 76, p: seg(p, 0.4, 1), seed: 'team' });
    return { top: { x: x, y: top, w: tw } };
  };

  /* fig.table(ctx, x, y, scale, opts) -> { top }: a warm table seen from the front. (x, y) = front
   * center on the floor; opts.w, opts.h (px at scale 1: 340 × 76), color (madera), top (tierra),
   * p, seed. */
  fig.table = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, w = (o.w || 340) * s, h = (o.h || 76) * s, m = M();
    var d = cached('table|' + Math.round(w) + '|' + Math.round(h) + '|' + (o.seed || ''), function () {
      var b = I().drawing('table:' + (o.seed || '') + w, { w: 3 / Math.max(0.5, s), jitter: 0.6 });
      b.shape(box(-w / 2 + 10, -h + 14, w / 2 - 10, -4, 0.02), { fill: '@a', w: 3 });
      b.shape(box(-w / 2, -h, w / 2, -h + 15, 0.03), { fill: '@b', w: 3.2 });
      b.stroke([-w / 2 + 26, -h + 15, -w / 2 + 28, -2], { w: 2.4, profile: 'blunt' });
      b.stroke([w / 2 - 26, -h + 15, w / 2 - 28, -2], { w: 2.4, profile: 'blunt' });
      return b.done({ colors: { a: m.madera, b: m.tierra } });
    });
    I().draw(ctx, d, x, y, 1, { p: o.p, colors: o.colors, offset: 3 });
    return { top: { x: x, y: y - h, w: w } };
  };

  /* fig.students(ctx, x, y, scale, opts): a small group of university students (backpacks,
   * notebooks, phones). (x, y) = ground center; scale 1 = people ~95 px tall. opts: n (4), p. */
  fig.students = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, n = o.n || 4, p = o.p == null ? 1 : o.p;
    var props = ['phone', 'notebook', 'book', 'phone', 'folder'];
    var poses = ['standing', 'reading', 'walking', 'presenting', 'writing'];
    for (var i = 0; i < n; i++) {
      var u = n === 1 ? 0 : i / (n - 1) - 0.5;
      fig.person(ctx, x + u * 46 * n * s, y + (i % 2) * 6 * s, s, {
        role: 'estudiante', seed: 'student' + i + (o.seed || ''), pose: poses[i % 5], prop: props[i % 5], skin: (i * 2 + 1) % 5,
        facing: u <= 0 ? 1 : -1, p: seg(p, i * 0.08, 0.7 + i * 0.08)
      });
    }
  };

  /* fig.youngLadder(ctx, x, y, scale, opts) -> { ladder: { x, top, bottom } }: a warm calligraphic
   * career ladder whose first rung dissolves into dots, and a young person looking up at it from
   * below. (x, y) = ladder foot on the ground; scale 1 = ladder 300 px tall. opts: p, seed. */
  fig.youngLadder = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, p = o.p == null ? 1 : o.p;
    fig.sign(ctx, 'escalera-sin-peldano', x, y - 125 * s, 270 * s, { seed: o.seed || 'career', p: seg(p, 0, 0.7), weight: 0.75 });
    fig.person(ctx, x - 82 * s, y, 1.25 * s, { role: 'estudiante', seed: (o.seed || 'young') + 'p', pose: 'lookingUp', skin: 3, hair: 'curly', p: seg(p, 0.3, 1) });
    return { ladder: { x: x, top: y - 250 * s, bottom: y } };
  };

  // =============================================================================================
  // PLACES (prompt §3.4, §3.6). Each place is a stage of 1280×720 at scale 1 with (x, y) = its
  // top-left corner; it draws its own ground unless opts.ground === false, leaves generous empty
  // space for the subject, and returns anchor points. Finished places are cached as layers.

  /* fig.inRect(ctx, rect, fn): draws a 1280×720 stage into any rect, cover-fitted, centered and
   * clipped: fn(x, y, scale) receives the stage origin and scale to pass to a place function.
   * Example: fig.inRect(ctx, s.zones.ilustracion, function (x, y, k) { fig.river(ctx, x, y, k); }). */
  fig.inRect = function (ctx, r, fn) {
    var k = Math.max(r.w / 1280, r.h / 720), x = r.x + (r.w - 1280 * k) / 2, y = r.y + (r.h - 720 * k) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    var out = fn(x, y, k);
    ctx.restore();
    return out;
  };

  function placeDraw(ctx, key, x, y, s, o, build) {
    var p = o.p == null ? 1 : o.p;
    var d = cached('place|' + key, build);
    if (p >= 1) {
      var w = 1280 * s, h = 720 * s;
      I().drawLayer(ctx, 'placeL|' + key + '|' + s.toFixed(4), x, y, w, h, function (g) { I().draw(g, d, 0, 0, s, { offset: 3 }); });
    } else {
      I().draw(ctx, d, x, y, s, { p: p, offset: 3 });
    }
  }
  function ground(ctx, kind, x, y, s, o) {
    if (o.ground === false) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    I().background(ctx, kind, { seed: o.seed || kind, horizon: o.horizon, contours: o.contours });
    ctx.restore();
  }
  function plantInto(b, x, y, k) {
    b.shape([x - 26 * k, y - 46 * k, x + 26 * k, y - 46 * k, x + 20 * k, y, x - 20 * k, y], { fill: M().siena, w: 3 });
    var leaves = [[-30, -96, -10], [0, -120, 0], [28, -100, 10], [-14, -78, -6], [16, -76, 6]];
    leaves.forEach(function (l, i) {
      b.blob(x + l[0] * k, y + l[1] * k, 13 * k, 26 * k, { fill: i % 2 ? M().verde : P().mix(M().verde, M().amarillo, 0.25), w: 2.6, irr: 0.12, rot: l[2] * 0.06, n: 8 });
      b.stroke([x + l[0] * k * 0.2, y - 46 * k, x + l[0] * k, y + (l[1] + 20) * k], { w: 2, profile: 'lift' });
    });
  }
  function windowInto(b, x0, y0, w, h, o) {
    b.shape(box(x0, y0, x0 + w, y0 + h, 0.02), { fill: '@sky', w: 4.5 });
    if (o && o.sun) b.circle(x0 + w * 0.68, y0 + h * 0.34, Math.min(w, h) * 0.13, { fill: M().rojo, line: false });
    b.stroke([x0 + w / 2, y0 + 3, x0 + w / 2 + 1, y0 + h - 3], { w: 3.4, profile: 'blunt' });
    b.stroke([x0 + 3, y0 + h / 2, x0 + w - 3, y0 + h / 2 + 1], { w: 3.4, profile: 'blunt' });
  }
  function booksInto(b, x0, y, w, h, r) {
    var x = x0, cols = [M().rojo, M().azul, M().amarillo, M().verde, M().tierra, M().lienzoOcre, M().siena];
    while (x < x0 + w - 12) {
      var bw = r.range(12, 22), bh = h * r.range(0.72, 1);
      b.shape(box(x, y - bh, x + bw, y, 0.04), { fill: r.pick(cols), w: 2.2, fillScale: 0 });
      x += bw + r.range(1, 3);
    }
    b.stroke([x0 - 8, y + 2, x0 + w + 8, y + 3], { w: 5, profile: 'blunt' });
  }
  function deskInto(b, x0, y0, w, h) {
    b.shape(box(x0, y0, x0 + w, y0 + 18, 0.02), { fill: '@wood2', w: 4 });
    b.shape(box(x0 + 14, y0 + 18, x0 + w - 14, y0 + h, 0.02), { fill: '@wood', w: 4 });
    b.stroke([x0 + w * 0.55, y0 + 30, x0 + w * 0.55, y0 + h - 6], { w: 2.6, profile: 'blunt' });
    b.dot(x0 + w * 0.62, y0 + 54, 4);
    b.dot(x0 + w * 0.62, y0 + 100, 4);
  }
  var PLACE_COLORS = function () { return { sky: M().celeste, wood: M().madera, wood2: M().tierra }; };

  /* fig.oficina(ctx, x, y, scale, opts) -> { desk: { x, y, w }, wallY, window } — a warm office:
   * a window with sky and a red sun, a shelf of books, a plant, a desk. opts: seed, p, ground. */
  fig.oficina = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'personas', x, y, s, o);
    placeDraw(ctx, 'oficina|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('oficina' + (o.seed || ''), { w: 4, jitter: 1 }), r = E.rng.create('oficina' + (o.seed || ''));
      b.fill([0, 500, 1280, 492, 1280, 720, 0, 720], { fill: M().lienzoOcre, fillScale: 0, fillAlpha: 0.7, poly: true });
      b.stroke(I().wavePoints(-10, 498, 1290, 3, 900, 0.3), { w: 5, profile: 'blunt' });
      windowInto(b, 880, 90, 270, 230, { sun: true });
      booksInto(b, 110, 210, 300, 80, r);
      booksInto(b, 130, 330, 260, 70, r);
      plantInto(b, 1185, 500, 1.1);
      deskInto(b, 420, 420, 420, 210);
      return b.done({ colors: PLACE_COLORS() });
    });
    return { desk: { x: x + 630 * s, y: y + 420 * s, w: 420 * s }, wallY: y + 498 * s, window: { x: x + 880 * s, y: y + 90 * s, w: 270 * s, h: 230 * s } };
  };

  /* fig.patio(ctx, x, y, scale, opts) -> { groundY } — a university courtyard: arcade, trees, bench. */
  fig.patio = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'territorio', x, y, s, merge(o, { horizon: 0.62, contours: false }));
    placeDraw(ctx, 'patio|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('patio' + (o.seed || ''), { w: 4, jitter: 1 });
      b.shape(box(60, 170, 1220, 446, 0.01), { fill: M().lienzoOcre, w: 4, fillScale: 0 });
      b.fill([60, 150, 640, 128, 1220, 150, 1220, 176, 60, 176], { fill: M().siena, fillScale: 0, poly: true });
      for (var i = 0; i < 7; i++) {
        var ax = 120 + i * 160;
        b.shape(arc(ax, 300, 52, Math.PI, TAU, 10).concat([ax + 52, 446, ax - 52, 446]), { fill: P().mix(M().tierra, M().lienzoOcre, 0.4), w: 3.6 });
      }
      [[150, 446], [1120, 446]].forEach(function (t, k) {
        b.shape([t[0] - 9, t[1], t[0] - 7, t[1] - 120, t[0] + 7, t[1] - 120, t[0] + 9, t[1]], { fill: M().madera, w: 3 });
        b.blob(t[0], t[1] - 170, 80, 70, { fill: M().verde, w: 3.6, irr: 0.2, n: 11 });
        b.blob(t[0] + (k ? -30 : 30), t[1] - 200, 46, 40, { fill: P().mix(M().verde, M().amarillo, 0.3), w: 3, irr: 0.2 });
      });
      b.shape(box(520, 520, 760, 540, 0.03), { fill: M().madera, w: 3.2 });
      b.stroke([540, 540, 540, 580], { w: 4, profile: 'blunt' });
      b.stroke([740, 540, 740, 580], { w: 4, profile: 'blunt' });
      return b.done();
    });
    return { groundY: y + 446 * s };
  };

  /* fig.aula(ctx, x, y, scale, opts) -> { board: { x, y, w, h } } — a classroom: board, desks, window. */
  fig.aula = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'personas', x, y, s, o);
    placeDraw(ctx, 'aula|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('aula' + (o.seed || ''), { w: 4, jitter: 1 });
      b.fill([0, 520, 1280, 512, 1280, 720, 0, 720], { fill: M().lienzoOcre, fillScale: 0, fillAlpha: 0.7, poly: true });
      b.stroke(I().wavePoints(-10, 516, 1290, 3, 800, 0), { w: 5, profile: 'blunt' });
      b.shape(box(300, 90, 980, 380, 0.02), { fill: P().mix(M().verde, M().tinta, 0.45), w: 6 });
      b.stroke([360, 160, 520, 150, 560, 190], { w: 2.4, profile: 'hair', color: M().lienzo });
      b.stroke([380, 250, 700, 240], { w: 2.4, profile: 'hair', color: M().lienzo });
      b.stroke([380, 300, 620, 296], { w: 2.4, profile: 'hair', color: M().lienzo });
      windowInto(b, 1060, 110, 160, 220, { sun: false });
      [[200, 600], [520, 600], [840, 600]].forEach(function (d) {
        b.shape(box(d[0], d[1], d[0] + 220, d[1] + 16, 0.03), { fill: M().tierra, w: 3.4 });
        b.stroke([d[0] + 20, d[1] + 16, d[0] + 20, d[1] + 90], { w: 4, profile: 'blunt' });
        b.stroke([d[0] + 200, d[1] + 16, d[0] + 200, d[1] + 90], { w: 4, profile: 'blunt' });
      });
      return b.done({ colors: PLACE_COLORS() });
    });
    return { board: { x: x + 300 * s, y: y + 90 * s, w: 680 * s, h: 290 * s } };
  };

  /* fig.biblioteca(ctx, x, y, scale, opts) -> { table: { x, y, w } } — tall shelves of books, a
   * reading table and a library ladder. */
  fig.biblioteca = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'personas', x, y, s, o);
    placeDraw(ctx, 'biblioteca|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('biblio' + (o.seed || ''), { w: 4, jitter: 1 }), r = E.rng.create('biblio' + (o.seed || ''));
      b.fill([0, 560, 1280, 552, 1280, 720, 0, 720], { fill: M().lienzoOcre, fillScale: 0, fillAlpha: 0.7, poly: true });
      [[60, 420], [880, 340]].forEach(function (sh) {
        b.shape(box(sh[0], 60, sh[0] + sh[1], 560, 0.01), { fill: M().madera, w: 5 });
        for (var row = 0; row < 4; row++) booksInto(b, sh[0] + 20, 170 + row * 120, sh[1] - 40, 92, r);
      });
      ladderInto(b, { rungs: 7, w: 5 }, 820, 330, 70, 460);
      b.shape(box(500, 600, 820, 620, 0.02), { fill: M().tierra, w: 4 });
      b.stroke([520, 620, 522, 700], { w: 5, profile: 'blunt' });
      b.stroke([800, 620, 798, 700], { w: 5, profile: 'blunt' });
      return b.done();
    });
    return { table: { x: x + 660 * s, y: y + 600 * s, w: 320 * s } };
  };

  function glasswareInto(b, x, y, k, kind, liquid) {
    if (kind === 'flask') {
      b.fill([x - 16 * k, y - 18 * k, x + 16 * k, y - 18 * k, x + 26 * k, y - 4 * k, x + 22 * k, y, x - 22 * k, y, x - 26 * k, y - 4 * k], { fill: liquid, fillScale: 0 });
      b.shape([x - 6 * k, y - 70 * k, x - 6 * k, y - 46 * k, x - 28 * k, y - 6 * k, x - 24 * k, y, x + 24 * k, y, x + 28 * k, y - 6 * k, x + 6 * k, y - 46 * k, x + 6 * k, y - 70 * k],
        { w: 3, fillScale: 0 });
    } else if (kind === 'tube') {
      b.fill([x - 6 * k, y - 34 * k, x + 6 * k, y - 34 * k, x + 6 * k, y - 4 * k, x, y, x - 6 * k, y - 4 * k], { fill: liquid, fillScale: 0 });
      b.shape([x - 7 * k, y - 76 * k, x + 7 * k, y - 76 * k, x + 7 * k, y - 6 * k, x, y + 2 * k, x - 7 * k, y - 6 * k], { w: 2.6, fillScale: 0 });
    } else {
      b.fill([x - 20 * k, y - 30 * k, x + 20 * k, y - 30 * k, x + 20 * k, y, x - 20 * k, y], { fill: liquid, fillScale: 0 });
      b.shape([x - 22 * k, y - 66 * k, x + 22 * k, y - 66 * k, x + 22 * k, y, x - 22 * k, y], { w: 3, fillScale: 0 });
    }
  }

  /* fig.laboratorio(ctx, x, y, scale, opts) -> { bench: { x, y, w } } — a laboratory with warm
   * glassware on a bench and jars on a shelf. */
  fig.laboratorio = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'personas', x, y, s, o);
    placeDraw(ctx, 'laboratorio|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('lab' + (o.seed || ''), { w: 4, jitter: 0.8 }), m = M();
      b.fill([0, 540, 1280, 532, 1280, 720, 0, 720], { fill: m.lienzoOcre, fillScale: 0, fillAlpha: 0.7, poly: true });
      windowInto(b, 1000, 80, 200, 200, { sun: true });
      b.stroke([100, 250, 760, 252], { w: 6, profile: 'blunt' });
      [[150, 'jar', m.amarillo], [240, 'flask', m.rojo], [340, 'jar', m.verde], [440, 'tube', m.azul], [480, 'tube', m.amarillo], [580, 'flask', m.celeste], [690, 'jar', m.rojo]]
        .forEach(function (g) { glasswareInto(b, g[0], 247, 0.9, g[1], g[2]); });
      b.shape(box(140, 500, 1140, 528, 0.01), { fill: m.tierra, w: 4 });
      b.shape(box(170, 528, 1110, 690, 0.01), { fill: m.madera, w: 4 });
      [[320, 'flask', m.amarillo], [420, 'tube', m.rojo], [450, 'tube', m.verde], [480, 'tube', m.celeste], [880, 'flask', m.azul], [980, 'jar', m.amarillo]]
        .forEach(function (g) { glasswareInto(b, g[0], 498, 1.25, g[1], g[2]); });
      return b.done({ colors: PLACE_COLORS() });
    });
    return { bench: { x: x + 640 * s, y: y + 500 * s, w: 1000 * s } };
  };

  /* fig.hospital(ctx, x, y, scale, opts) -> { door: { x, y } } — a hospital in warm shapes: facade,
   * windows, door, a plain plus sign (never the Red Cross emblem), trees. */
  fig.hospital = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'territorio', x, y, s, merge(o, { horizon: 0.78, contours: false }));
    placeDraw(ctx, 'hospital|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('hosp' + (o.seed || ''), { w: 4, jitter: 1 }), m = M();
      b.shape(box(300, 150, 980, 562, 0.01), { fill: m.lienzo, w: 5 });
      b.shape(box(260, 130, 1020, 160, 0.02), { fill: m.siena, w: 4 });
      for (var r2 = 0; r2 < 3; r2++) for (var c = 0; c < 5; c++) {
        if (r2 === 2 && c === 2) continue;
        b.shape(box(340 + c * 124, 200 + r2 * 112, 410 + c * 124, 270 + r2 * 112, 0.04), { fill: m.celeste, w: 3 });
      }
      b.shape(box(580, 430, 700, 562, 0.03), { fill: m.azul, w: 4 });
      b.circle(640, 96, 34, { fill: m.lienzo, w: 4 });
      b.fill([628, 70, 652, 70, 652, 84, 666, 84, 666, 108, 652, 108, 652, 122, 628, 122, 628, 108, 614, 108, 614, 84, 628, 84], { fill: m.verde, fillScale: 0 });
      [[160, 560], [1120, 560]].forEach(function (t) {
        b.stroke([t[0], t[1], t[0] + 2, t[1] - 110], { w: 7, profile: 'blunt', color: m.madera });
        b.blob(t[0], t[1] - 150, 64, 60, { fill: m.verde, w: 3.4, irr: 0.18 });
      });
      return b.done();
    });
    return { door: { x: x + 640 * s, y: y + 562 * s } };
  };

  /* fig.consultorio(ctx, x, y, scale, opts) -> { desk: { x, y, w } } — a doctor's desk in warm
   * shapes: desk, papers, stethoscope, plant and window. */
  fig.consultorio = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'personas', x, y, s, o);
    placeDraw(ctx, 'consultorio|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('consul' + (o.seed || ''), { w: 4, jitter: 1 }), m = M();
      b.fill([0, 500, 1280, 494, 1280, 720, 0, 720], { fill: m.lienzoOcre, fillScale: 0, fillAlpha: 0.7, poly: true });
      windowInto(b, 140, 90, 240, 220, { sun: true });
      deskInto(b, 520, 430, 520, 220);
      b.shape(rotPts(box(600, 396, 700, 428, 0.05), -0.05, 650, 412), { fill: m.lienzo, w: 2.6 });
      b.shape(rotPts(box(612, 386, 712, 418, 0.05), 0.04, 662, 402), { fill: m.lienzo, w: 2.6 });
      b.stroke([800, 428, 790, 400, 820, 388, 850, 400, 846, 428], { w: 3.2, profile: 'even' });
      b.circle(866, 420, 9, { fill: m.celeste, w: 2.6 });
      plantInto(b, 1150, 500, 1);
      return b.done({ colors: PLACE_COLORS() });
    });
    return { desk: { x: x + 780 * s, y: y + 430 * s, w: 520 * s } };
  };

  /* fig.iceberg(ctx, x, y, scale, opts): the luminous tip above a calligraphic waterline and the
   * large submerged mass below. (x, y) = waterline center; scale 1 = 420 px wide.
   * opts: reveal (0..1 how much of the mass shows), glow (tip glow 0..1), p. */
  fig.iceberg = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, m = M(), p = o.p == null ? 1 : o.p;
    var d = cached('iceberg', function () {
      var b = I().drawing('iceberg', { w: 4, jitter: 0.8 });
      b.shape([-200, 14, -170, 120, -80, 230, 40, 260, 160, 190, 210, 60, 190, 14], { fill: '@mass', w: 4.4 });
      b.shape([-70, 4, -40, -70, -10, -120, 20, -150, 44, -96, 74, -40, 96, 4], { fill: '@tip', w: 4.4 });
      b.stroke([-20, -100, 0, -60], { w: 2, profile: 'hair', color: m.celeste });
      return b.done();
    });
    var reveal = o.reveal == null ? 1 : o.reveal;
    if (o.glow) I().glow(ctx, x, y - 80 * s, 180 * s, m.amarillo, 0.35 * o.glow);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 260 * s, y - 200 * s, 520 * s, 200 * s + 280 * s * reveal);
    ctx.clip();
    I().draw(ctx, d, x, y, s, { p: p, colors: { tip: m.lienzo, mass: P().mix(m.celeste, m.azul, 0.35) } });
    ctx.restore();
    I().wave(ctx, x - 300 * s, y, x + 300 * s, { amp: 5 * s, len: 120 * s, w: 4.5 * s, seed: 'waterline', profile: 'swell', p: p, color: m.lienzo });
  };

  /* fig.marNocturno(ctx, x, y, scale, opts) -> { horizon } — a night sea: ultramarine and noche
   * washes, calligraphic waves, a crescent moon and irregular stars. opts: horizon (0..1, 0.5),
   * moon (true), stars (9), t (stars twinkle gently), seed, p. Draw an iceberg with fig.iceberg. */
  fig.marNocturno = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, hz = o.horizon == null ? 0.5 : o.horizon, t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    I().background(ctx, 'mar', { seed: o.seed || 'mar', horizon: hz });
    if (o.moon !== false) fig.sign(ctx, 'luna', 1040, 140, 130, { seed: 'moon', p: o.p });
    var r = E.rng.create('stars' + (o.seed || ''));
    var n = o.stars == null ? 9 : o.stars;
    for (var i = 0; i < n; i++) {
      var sx = r.range(60, 1220), sy = r.range(40, 720 * hz - 50), sz = r.range(26, 50);
      if (Math.hypot(sx - 1040, sy - 140) < 110) continue;
      var tw = 0.85 + 0.15 * Math.sin(t * 1.3 + i * 1.7);
      fig.sign(ctx, 'estrella', sx, sy, sz * tw, { seed: 'night' + i, colors: { a: M().rojo, ink: i % 3 ? M().amarillo : M().lienzo }, p: o.p, alpha: 0.95 });
    }
    ctx.restore();
    return { horizon: y + 720 * hz * s };
  };

  /* fig.cordillera(ctx, x, y, scale, opts) -> { peaks: [{ x, y }], valleys: [{ x, y }] } — an Andean
   * cordillera of flat biomorphic mountains. opts.peaks: [{ x (0..1), h (0..1), lit (yellow),
   * deep (ultramarine valley after it) }]; default five peaks. ground (territorio), p, seed. */
  fig.cordillera = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, m = M();
    var peaks = o.peaks || [{ x: 0.12, h: 0.42 }, { x: 0.3, h: 0.72, lit: true, deep: true }, { x: 0.5, h: 0.5 }, { x: 0.68, h: 0.8, lit: true, deep: true }, { x: 0.88, h: 0.46 }];
    ground(ctx, 'territorio', x, y, s, merge(o, { horizon: 0.72, contours: false }));
    var key = 'cordillera|' + JSON.stringify(peaks) + '|' + (o.seed || '');
    var base = 600;
    placeDraw(ctx, key, x, y, s, o, function () {
      var b = I().drawing(key, { w: 4.5, jitter: 1.2 }), cols = [m.verde, m.tierra, m.azul, m.siena, P().mix(m.verde, m.amarillo, 0.3)];
      // Deep valleys: dark ultramarine wedges behind the mountains; only the V between slopes shows.
      peaks.forEach(function (pk, i) {
        if (!pk.deep) return;
        var nx = peaks[i + 1] ? peaks[i + 1].x : pk.x + 0.15;
        var vx = (pk.x + nx) / 2 * 1280;
        b.fill([vx - 150, base - 330, vx + 150, base - 330, vx + 8, base + 2, vx - 8, base + 2], { fill: P().mix(m.azul, M().tinta, 0.35), poly: true });
      });
      peaks.forEach(function (pk, i) {
        var px = pk.x * 1280, top = base - pk.h * 520, hw = 120 + pk.h * 120;
        b.shape([px - hw, base, px - hw * 0.45, base - pk.h * 300, px - 12, top + 6, px + 8, top, px + hw * 0.5, base - pk.h * 280, px + hw, base],
          { fill: cols[i % cols.length], w: 4.6 });
        if (pk.lit) b.shape([px - 52, top + 96, px - 12, top + 8, px + 8, top + 2, px + 50, top + 92, px, top + 110], { fill: m.amarillo, w: 3.6 });
      });

      b.stroke([-10, base, 1290, base + 2], { w: 5, profile: 'blunt' });
      return b.done();
    });
    var out = { peaks: [], valleys: [] };
    peaks.forEach(function (pk, i) {
      out.peaks.push({ x: x + pk.x * 1280 * s, y: y + (base - pk.h * 520) * s });
      if (pk.deep) {
        var nx = peaks[i + 1] ? peaks[i + 1].x : pk.x + 0.15;
        out.valleys.push({ x: x + (pk.x + nx) / 2 * 1280 * s, y: y + (base - 40) * s });
      }
    });
    return out;
  };

  /* fig.river(ctx, x, y, scale, opts) -> { at(u) -> { x, y }, reservoir, gate } — a valley river
   * flowing into a reservoir closed by a dam with a single sluice gate. opts: coins (gold coins
   * drift along the river with t), gate (0..1 how open), t, p, h (stage height, 720). */
  fig.river = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, m = M(), t = o.t || 0;
    ground(ctx, 'territorio', x, y, s, merge(o, { horizon: 0.32, contours: false }));
    var pts = [-20, 260, 200, 300, 380, 380, 520, 360, 660, 430, 760, 520];
    placeDraw(ctx, 'river|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('river' + (o.seed || ''), { w: 4, jitter: 1 });
      b.shape([-20, 250, 300, 160, 640, 220, 980, 150, 1300, 230, 1300, 340, -20, 340], { fill: P().mix(m.verde, m.amarillo, 0.2), w: 4 });
      b.shape([700, 480, 820, 410, 1010, 420, 1120, 500, 1080, 640, 860, 680, 720, 610], { fill: m.celeste, w: 4.4 });
      var band = [];
      for (var i = 0; i < pts.length; i += 2) band.push(pts[i], pts[i + 1] - 26);
      for (i = pts.length - 2; i >= 0; i -= 2) band.push(pts[i], pts[i + 1] + 26);
      b.shape(band, { fill: m.celeste, w: 3.6 });
      b.shape(box(1100, 450, 1150, 690, 0.04), { fill: m.lienzoOcre, w: 4 });
      b.shape(box(1104, 540, 1146, 600, 0.06), { fill: m.madera, w: 3 });
      return b.done();
    });
    var path = I().smoothPath(pts, false, 6);
    function at(u) {
      var k = clamp(Math.floor(u * (path.n - 1)), 0, path.n - 1);
      return { x: x + path.x[k] * s, y: y + path.y[k] * s };
    }
    if (o.coins && (o.p == null || o.p >= 1)) {
      var nC = typeof o.coins === 'number' ? o.coins : 9;
      for (var c = 0; c < nC; c++) {
        var u = (c / nC + t * 0.04) % 1, q2 = at(u);
        fig.coin(ctx, q2.x, q2.y + Math.sin(t * 2 + c) * 3 * s, 0.32 * s, { seed: 'rc' + c });
      }
    }
    return { at: at, reservoir: { x: x + 910 * s, y: y + 540 * s }, gate: { x: x + 1125 * s, y: y + 570 * s } };
  };

  /* fig.ciudad(ctx, x, y, scale, opts) -> { groundY } — a Latin American city: hills, rows of houses
   * with tiled roofs and colorful façades, a bell tower without symbols, a sun. */
  fig.ciudad = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    ground(ctx, 'territorio', x, y, s, merge(o, { horizon: 0.42, contours: false }));
    placeDraw(ctx, 'ciudad|' + (o.seed || ''), x, y, s, o, function () {
      var b = I().drawing('ciudad' + (o.seed || ''), { w: 3.6, jitter: 0.8 }), m = M(), r = E.rng.create('ciudad' + (o.seed || ''));
      b.circle(1080, 120, 50, { fill: m.rojo, line: false });
      b.shape([-20, 330, 260, 210, 520, 290, 760, 190, 1060, 280, 1300, 220, 1300, 380, -20, 380], { fill: m.verde, w: 4 });
      var facades = [m.amarillo, m.celeste, m.rojo, m.lienzo, P().mix(m.verde, m.lienzo, 0.4), m.tierra, m.lienzoOcre];
      [[400, 0.85], [520, 1]].forEach(function (row, ri) {
        var xx = -10;
        while (xx < 1290) {
          var w = r.range(90, 150), h = r.range(80, 140) * row[1], gy = row[0] + ri * 80;
          if (ri === 0 && xx > 560 && xx < 700) {
            b.shape(box(xx, gy - 260, xx + 70, gy, 0.03), { fill: m.lienzo, w: 3.6 });
            b.shape([xx - 6, gy - 260, xx + 35, gy - 320, xx + 76, gy - 260], { fill: m.siena, w: 3.4 });
            b.shape(arc(xx + 35, gy - 205, 16, Math.PI, TAU, 6).concat([xx + 51, gy - 180, xx + 19, gy - 180]), { fill: m.tinta, w: 2 });
            xx += 80;
            continue;
          }
          b.shape(box(xx, gy - h, xx + w, gy, 0.03), { fill: r.pick(facades), w: 3.4 });
          b.shape([xx - 8, gy - h, xx + w * 0.5, gy - h - 36, xx + w + 8, gy - h], { fill: r() < 0.7 ? m.siena : m.tierra, w: 3.2 });
          b.shape(box(xx + w * 0.2, gy - h * 0.55, xx + w * 0.42, gy - h * 0.2, 0.08), { fill: m.azul, w: 2.4 });
          b.shape(box(xx + w * 0.58, gy - h * 0.6, xx + w * 0.8, gy, 0.06), { fill: m.madera, w: 2.4 });
          xx += w + r.range(4, 14);
        }
      });
      return b.done();
    });
    return { groundY: y + 600 * s };
  };

  var LATAM = [430, 40, 520, 70, 560, 130, 600, 175, 640, 200, 650, 240, 700, 262, 760, 300, 830, 330, 900, 380, 930, 450,
    900, 520, 860, 560, 800, 600, 740, 660, 700, 700, 670, 690, 650, 640, 640, 580, 600, 520, 560, 470, 540, 420, 520, 360,
    530, 320, 560, 290, 520, 260, 470, 215, 420, 170, 360, 120, 330, 80, 380, 50];
  /* fig.latam(ctx, x, y, scale, opts) -> { anchors: { norte, centro, andes, sur, caribe } } — Latin
   * America and the Caribbean as ONE warm biomorphic landmass without borders, plus island blobs.
   * (x, y) = top-left of a 1280×720 stage; opts: color, ground ('lienzo'), p, seed. */
  fig.latam = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, m = M();
    if (o.ground !== false) ground(ctx, 'lienzo', x, y, s, o);
    placeDraw(ctx, 'latam|' + (o.color || ''), x, y, s, o, function () {
      var b = I().drawing('latam', { w: 5, jitter: 2 });
      var land = b.shape(LATAM, { fill: '@land', w: 5.5, fillJitter: 6 });
      b.blob(700, 210, 70, 34, { fill: '@land2', w: 3.4, irr: 0.25, rot: -0.2 });
      b.overlap(land, b.blob(560, 330, 60, 90, { fill: P().mix(m.verde, m.amarillo, 0.25), line: false, irr: 0.3 }), m.verde);
      [[660, 150, 26, 10], [720, 168, 18, 8], [770, 190, 12, 7], [800, 214, 9, 6]].forEach(function (isl) {
        b.blob(isl[0], isl[1], isl[2], isl[3], { fill: '@land', w: 3, irr: 0.2 });
      });
      return b.done({ colors: { land: o.color || m.tierra, land2: P().mix(m.tierra, m.amarillo, 0.35) } });
    });
    function pt(px, py) { return { x: x + px * s, y: y + py * s }; }
    return { anchors: { norte: pt(430, 100), centro: pt(560, 240), caribe: pt(720, 175), andes: pt(600, 470), sur: pt(690, 650), este: pt(860, 420) } };
  };

  var ROAD_DEFAULT = [80, 600, 260, 520, 420, 560, 560, 430, 720, 380, 880, 430, 1020, 300, 1200, 220];
  /* fig.road(ctx, x, y, scale, opts) -> { stations: [{ x, y }], at(u) } — a calligraphic road that
   * unrolls (p) with n stations at even distances. opts: points (flat control points in a
   * 1280×720 stage), stations (6), signs (array of sign names drawn at the stations), p, seed. */
  fig.road = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, p = o.p == null ? 1 : o.p, m = M(), ink = I();
    var pts = o.points || ROAD_DEFAULT;
    var key = 'road|' + pts.join(',');
    var geo = cached(key, function () {
      var path = ink.smoothPath(pts, false, 4), L = [0];
      for (var i = 1; i < path.n; i++) L.push(L[i - 1] + Math.hypot(path.x[i] - path.x[i - 1], path.y[i] - path.y[i - 1]));
      return { path: path, L: L, total: L[L.length - 1],
        edge: ink.strokeGeom(pts, { w: 30, profile: 'even', seed: 'road-body' }), line: ink.strokeGeom(pts, { w: 4, profile: 'swell', seed: 'road-line' }) };
    });
    function at(u) {
      var target = clamp(u, 0, 1) * geo.total, lo = 0, hi = geo.L.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (geo.L[mid] <= target) lo = mid; else hi = mid - 1; }
      return { x: x + geo.path.x[lo] * s, y: y + geo.path.y[lo] * s };
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var rp = seg(p, 0, 0.6);
    ctx.fillStyle = m.tinta;
    ink.fillStroke(ctx, geo.edge, rp, 1.12);
    ctx.fillStyle = m.lienzoOcre;
    ink.fillStroke(ctx, geo.edge, rp, 0.92);
    ctx.fillStyle = P().rgba(m.tinta, 0.55);
    for (var d0 = 0; d0 < geo.total * rp; d0 += 34) ink.strokeRange(ctx, geo.line, d0, Math.min(d0 + 14, geo.total * rp), 0.55, false);
    ctx.restore();
    var n = o.stations == null ? 6 : o.stations, st = [];
    for (var i = 0; i < n; i++) {
      var u = n === 1 ? 0.5 : i / (n - 1), q2 = at(u), sp = seg(p, 0.3 + 0.6 * u - 0.05, 0.3 + 0.6 * u + 0.1);
      st.push(q2);
      if (sp <= 0) continue;
      ink.circle(ctx, q2.x, q2.y, 24 * s, { fill: m.lienzo, w: 4 * s, seed: 'station' + i, p: sp });
      if (o.signs && o.signs[i]) fig.sign(ctx, o.signs[i], q2.x, q2.y, 34 * s, { seed: 'st' + i, p: sp });
    }
    return { stations: st, at: at };
  };

  // =============================================================================================
  // PROPS (prompt §5.7). Built in local px at scale 1 and cached per (name, seed, variant); each
  // returns its anchor points in screen coordinates so callers can attach labels and tags.

  var PROPS = {};
  function anchorsOut(a, x, y, s, flip) {
    if (!a) return null;
    var out = {};
    for (var k in a) {
      var v = a[k];
      if (Array.isArray(v) && typeof v[0] === 'number') out[k] = { x: x + (flip ? -v[0] : v[0]) * s, y: y + v[1] * s };
      else if (Array.isArray(v)) out[k] = v.map(function (q2) { return { x: x + (flip ? -q2[0] : q2[0]) * s, y: y + q2[1] * s }; });
      else out[k] = v;
    }
    return out;
  }
  function defProp(name, build, meta) {
    meta = meta || {};
    PROPS[name] = true;
    fig[name] = function (ctx, x, y, scale, o) {
      o = o || {};
      var s = scale || 1, vk = meta.variant ? meta.variant(o) : '', seed = o.seed == null ? '' : String(o.seed);
      var d = cached('prop|' + name + '|' + seed + '|' + vk, function () {
        var b = I().drawing('prop:' + name + ':' + seed, { w: meta.w || 4, jitter: meta.jitter == null ? 0.8 : meta.jitter });
        var a = build(b, o);
        var dd = b.done({ colors: meta.colors ? meta.colors() : null });
        dd.anchors = a || null;
        return dd;
      });
      I().draw(ctx, d, x, y, s, { p: o.p, colors: o.colors, mono: o.mono, flip: o.flip, rot: o.rot, alpha: o.alpha, weight: o.weight });
      var out = anchorsOut(d.anchors, x, y, s, o.flip) || {};
      if (meta.after) meta.after(ctx, x, y, s, o, out);
      return out;
    };
  }
  fig.propNames = function () { return Object.keys(PROPS); };
  function q01(v) { return Math.round(clamp(v == null ? 0 : v, -10, 10) * 100) / 100; }

  // ---- Notebook and paper

  /* fig.notebookPage(ctx, x, y, w, h, opts) -> inner rect: a field-notebook page (spiral holes, ruled
   * lines, red margin line). opts: p, seed, lines (true), tilt. */
  fig.notebookPage = function (ctx, x, y, w, h, o) {
    o = o || {};
    var ink = I(), m = M(), p = o.p == null ? 1 : o.p;
    ctx.save();
    if (o.tilt) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.tilt); ctx.translate(-x - w / 2, -y - h / 2); }
    ink.card(ctx, x, y, w, h, { seed: o.seed || 'page', weight: 3.6, radius: 6, p: p });
    if (p > 0.3) {
      ctx.save();
      ctx.globalAlpha *= seg(p, 0.3, 0.7);
      ink.notebookLines(ctx, x + 6, y + 18, w - 12, h - 26, { top: 44, spacing: 30, margin: 52 });
      for (var i = 0; i < Math.floor((w - 40) / 34); i++) {
        ctx.fillStyle = m.lienzoOcre;
        ctx.beginPath(); ctx.arc(x + 30 + i * 34, y + 16, 5, 0, TAU); ctx.fill();
        ctx.strokeStyle = m.tinta; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x + 30 + i * 34, y + 8, 7, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    return { x: x + 60, y: y + 44, w: w - 80, h: h - 60 };
  };

  // Newspaper headline as scribbles with a big "%" and no readable numbers.
  defProp('headline', function (b) {
    var r = b.r;
    b.shape(box(-80, -56, 80, 56, 0.03), { fill: '@paper', w: 3.4 });
    b.stroke([-66, -36, -10, -40, 20, -34, 64, -38], { w: 7, profile: 'blunt' });
    for (var i = 0; i < 4; i++) b.stroke(I().wavePoints(-66, -12 + i * 14, i === 3 ? -6 : 10, 2, 18 + r() * 6, r() * 3), { w: 2.2, profile: 'even' });
    b.stroke([24, 34, 62, -14], { w: 5, profile: 'blunt' });
    b.stroke(arc(28, -6, 8, 0, TAU, 10), { w: 4, profile: 'even', closed: true });
    b.stroke(arc(58, 26, 8, 0, TAU, 10), { w: 4, profile: 'even', closed: true });
  }, { w: 3 });

  // A sheet of paper (flies like a bird in some scenes).
  defProp('sheet', function (b) {
    b.shape([-30, -40, 26, -44, 32, 38, -24, 42], { fill: '@paper', w: 3 });
    for (var i = 0; i < 4; i++) b.stroke([-18, -24 + i * 14, 18, -26 + i * 14], { w: 1.8, profile: 'even' });
  });

  // ---- Money

  defProp('coin', function (b) {
    b.circle(0, 0, 30, { fill: '@a', w: 4.2 });
    b.stroke(arc(0, 0, 21, 0, TAU, 12), { w: 1.8, profile: 'outline', closed: true });
    b.stroke([0, -11, 0, 11], { w: 4, profile: 'blunt' });
  }, { colors: function () { return { a: M().oro }; }, jitter: 0.4 });

  /* fig.coinPile(ctx, x, y, scale, opts): a pile of flat coins whose top sits exactly `height` px
   * above y (honest when height comes from a shared scale). opts: height (px), w (coin width 60), p. */
  fig.coinPile = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, h = (o.height || 60) * (o.p == null ? 1 : 1 - Math.pow(1 - clamp(o.p, 0, 1), 3)), w = (o.w || 60) * s, ch = 9 * s, m = M();
    var n = Math.max(1, Math.floor(h / ch));
    for (var i = 0; i < n; i++) {
      var cy = y - i * ch - ch / 2;
      ctx.fillStyle = m.oro;
      ctx.beginPath(); ctx.ellipse(x, cy, w / 2, ch * 0.62, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = m.tinta; ctx.lineWidth = Math.max(1.4, 2 * s);
      ctx.stroke();
    }
    // The exact top edge: a clean stroke at y - height.
    if (o.p == null || o.p >= 1) { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, y - (o.height || 60)); ctx.lineTo(x + w / 2 + 6, y - (o.height || 60)); ctx.stroke(); }
    return { top: { x: x, y: y - (o.height || 60) } };
  };

  // ---- Bridges

  /* fig.bridge(ctx, x, y, scale, opts) -> { left, right, end }: a bridge over an abyss from one bank to
   * the other, its last spans still scaffolding. (x, y) = middle of the deck; 560 × 200 px at scale 1.
   * opts: built (0..1 share of the deck finished, 0.72), labels { left, right } (verbatim, from data),
   * p, seed. */
  defProp('bridge', function (b, o) {
    var m = M(), built = clamp(o.built == null ? 0.72 : o.built, 0, 1);
    // The abyss: a dark chasm between two straight-edged cliffs.
    b.fill([-152, 6, 152, 6, 60, 200, -60, 200], { fill: P().mix(m.azul, m.tinta, 0.55), poly: true });
    b.shape([-280, 0, -210, -2, -150, 0, -146, 40, -158, 90, -148, 140, -156, 200, -220, 202, -280, 200, -282, 100], { fill: m.tierra, w: 4.2, fillScale: 0 });
    b.shape([150, 0, 210, -2, 280, 0, 282, 100, 280, 200, 220, 202, 156, 200, 148, 140, 160, 90, 146, 40], { fill: m.siena, w: 4.2, fillScale: 0 });
    b.stroke([-150, 60, -120, 140, -100, 200], { w: 2, profile: 'hair' });
    b.stroke([150, 60, 118, 140, 100, 200], { w: 2, profile: 'hair' });
    var x0 = -150, x1 = 150, xb = lerp(x0, x1, built);
    b.shape(box(x0, -8, xb, 8, 0.02), { fill: m.madera, w: 3.6 });
    for (var k = x0 + 30; k < xb - 10; k += 30) b.stroke([k, -8, k + 1, 8], { w: 1.6, profile: 'even' });
    var piers = [-75, 0, 75];
    piers.forEach(function (px) { if (px < xb) b.stroke([px, 8, px - 2, 120], { w: 5, profile: 'blunt' }); });
    for (var sx = xb; sx < x1; sx += 26) {
      b.stroke([sx, -6, sx + 26, 6], { w: 1.6, profile: 'hair' });
      b.stroke([sx, 6, sx + 26, -6], { w: 1.6, profile: 'hair' });
      b.stroke([sx, -8, sx, 40], { w: 1.4, profile: 'hair' });
    }
    b.stroke([xb, -8, x1, -8], { w: 1.4, profile: 'hair' });
    return { left: [-205, 0], right: [205, 0], end: [xb, 0] };
  }, { variant: function (o) { return q01(o.built == null ? 0.72 : o.built); }, w: 4,
    after: function (ctx, x, y, s, o, a) {
      if (!o.labels) return;
      var ink = I();
      if (o.labels.left) ink.letter(ctx, o.labels.left, a.left.x, a.left.y + 40 * s, { size: 34 * s, align: 'center', seed: 'bl', underline: false, stars: false, p: o.p, color: M().lienzo });
      if (o.labels.right) ink.letter(ctx, o.labels.right, a.right.x, a.right.y + 40 * s, { size: 34 * s, align: 'center', seed: 'br', underline: false, stars: false, p: o.p, color: M().lienzo });
    } });

  /* fig.suspensionBridge(ctx, x, y, scale, opts) -> { left, right, end }: towers, cables and a deck
   * still under construction. (x, y) = middle of the deck; 520 px wide at scale 1. opts: built
   * (0..1), labels { left, right }, p. */
  defProp('suspensionBridge', function (b, o) {
    var m = M(), built = clamp(o.built == null ? 0.6 : o.built, 0, 1);
    b.fill([-240, 26, 240, 26, 240, 130, -240, 130], { fill: m.azul, poly: true, fillAlpha: 0.9 });
    b.stroke(I().wavePoints(-220, 60, 220, 3, 60, 0), { w: 2.4, profile: 'swell', color: m.celeste });
    b.shape([-340, 0, -280, -2, -230, 0, -226, 60, -236, 130, -340, 132], { fill: m.amarillo, w: 4, fillScale: 0 });
    b.shape([230, 0, 280, -2, 340, 0, 340, 132, 236, 130, 226, 60], { fill: m.tierra, w: 4, fillScale: 0 });
    [-170, 170].forEach(function (tx) { b.shape(box(tx - 9, -150, tx + 9, 40, 0.04), { fill: m.rojo, w: 3.6 }); });
    b.stroke([-230, -6, -170, -146, 0, -40, 170, -146, 230, -6], { w: 2.6, profile: 'even' });
    var xb = lerp(-230, 230, built);
    for (var hx = -150; hx < 160; hx += 30) {
      var cy = hx < 0 ? -146 + (hx + 170) / 170 * 106 : -40 - hx / 170 * 106;
      b.stroke([hx, cy, hx, hx < xb ? -6 : 10], { w: 1.4, profile: 'hair' });
    }
    b.shape(box(-230, -8, xb, 6, 0.02), { fill: m.madera, w: 3.4 });
    return { left: [-280, 0], right: [280, 0], end: [xb, 0] };
  }, { variant: function (o) { return q01(o.built == null ? 0.6 : o.built); },
    after: function (ctx, x, y, s, o, a) {
      if (!o.labels) return;
      if (o.labels.left) I().letter(ctx, o.labels.left, a.left.x, a.left.y + 30 * s, { size: 28 * s, align: 'center', seed: 'sl', underline: false, stars: false, p: o.p });
      if (o.labels.right) I().letter(ctx, o.labels.right, a.right.x, a.right.y + 30 * s, { size: 28 * s, align: 'center', seed: 'sr', underline: false, stars: false, p: o.p });
    } });

  /* fig.plank(ctx, x, y, scale, opts): a wooden plank carried by workers; opts.label (verbatim). */
  defProp('plank', function (b) {
    b.shape(box(-70, -9, 70, 9, 0.03), { fill: M().tierra, w: 3.2 });
    b.stroke([-50, -2, 40, 0], { w: 1.4, profile: 'hair' });
  }, { after: function (ctx, x, y, s, o) { if (o.label) I().text(ctx, o.label, x, y + 12 * s, { size: 16 * s, weight: 700, align: 'center', p: o.p }); } });

  // ---- Measurement and time

  /* fig.balance(ctx, x, y, scale, opts) -> { leftPan, rightPan }: a balance scale. (x, y) = foot of the
   * post; ~300 px wide at scale 1. opts.tilt (radians, > 0 lowers the right pan). */
  defProp('balance', function (b, o) {
    var m = M(), t = o.tilt || 0, top = -230, hw = 140;
    b.shape(box(-60, -14, 60, 0, 0.1), { fill: m.madera, w: 3.6 });
    b.stroke([0, -14, 0, top], { w: 7, profile: 'blunt' });
    b.circle(0, top, 9, { fill: m.oro, w: 3 });
    var lx = -Math.cos(t) * hw, ly = top - Math.sin(t) * hw, rx = Math.cos(t) * hw, ry = top + Math.sin(t) * hw;
    b.stroke([lx, ly, 0, top, rx, ry], { w: 6, profile: 'blunt' });
    var pans = [[lx, ly], [rx, ry]];
    pans.forEach(function (pp) {
      b.stroke([pp[0], pp[1], pp[0] - 46, pp[1] + 70], { w: 1.6, profile: 'hair' });
      b.stroke([pp[0], pp[1], pp[0] + 46, pp[1] + 70], { w: 1.6, profile: 'hair' });
      b.shape(arc(pp[0], pp[1] + 66, 54, 0.05, Math.PI - 0.05, 8), { fill: m.oro, w: 3.6 });
    });
    return { leftPan: [lx, ly + 66], rightPan: [rx, ry + 66], pivot: [0, top] };
  }, { variant: function (o) { return q01(o.tilt); } });

  /* fig.hourglass(ctx, x, y, scale, opts): (x, y) = center; 120 × 200 at scale 1. opts.level (0..1:
   * share of sand still on top, 0.5), p. */
  defProp('hourglass', function (b, o) {
    var m = M(), lv = clamp(o.level == null ? 0.5 : o.level, 0, 1);
    b.shape(box(-56, -100, 56, -86, 0.1), { fill: m.madera, w: 3.4 });
    b.shape(box(-56, 86, 56, 100, 0.1), { fill: m.madera, w: 3.4 });
    var ty = -86 + (1 - lv) * 74;
    if (lv > 0.02) b.fill([-40 + (1 - lv) * 30, ty, 40 - (1 - lv) * 30, ty, 4, -8, -4, -8], { fill: m.amarillo, fillScale: 0 });
    if (lv < 0.98) b.fill([-42, 84, 42, 84, 42 * (1 - lv) * 0.6, 84 - (1 - lv) * 64, -42 * (1 - lv) * 0.6, 84 - (1 - lv) * 64], { fill: m.amarillo, fillScale: 0 });
    b.shape([-46, -86, 46, -86, 8, -6, 46, 86, -46, 86, -8, -6], { w: 4, fillScale: 0 });
  }, { variant: function (o) { return q01(o.level == null ? 0.5 : o.level); } });

  /* fig.stopwatch(ctx, x, y, scale, opts): (x, y) = center of the dial; 120 px at scale 1.
   * opts.turn (0..1: hand position as a share of a full turn — pass a value from data when it
   * encodes one), p. */
  defProp('stopwatch', function (b, o) {
    var m = M(), a = -Math.PI / 2 + TAU * clamp(o.turn || 0, 0, 1);
    b.shape(box(-10, -76, 10, -62, 0.2), { fill: m.rojo, w: 3 });
    b.circle(0, 0, 58, { fill: '@paper', w: 5 });
    for (var i = 0; i < 12; i++) {
      var ta = i / 12 * TAU;
      b.stroke([Math.cos(ta) * 44, Math.sin(ta) * 44, Math.cos(ta) * (i % 3 ? 50 : 52), Math.sin(ta) * (i % 3 ? 50 : 52)], { w: i % 3 ? 2 : 3.6, profile: 'even' });
    }
    b.stroke([0, 0, Math.cos(a) * 40, Math.sin(a) * 40], { w: 4.6, profile: 'lift' });
    b.circle(0, 0, 5, { fill: m.rojo, w: 2 });
  }, { variant: function (o) { return q01(o.turn); } });

  /* fig.telescope(ctx, x, y, scale, opts): a telescope on a tripod. (x, y) = feet center; ~260 px
   * tall at scale 1. opts.angle (tube elevation, radians, 0.5), p. */
  defProp('telescope', function (b, o) {
    var m = M(), a = o.angle == null ? 0.5 : o.angle, hx = 0, hy = -170;
    b.stroke([hx, hy, -60, 0], { w: 4.6, profile: 'blunt' });
    b.stroke([hx, hy, 60, 0], { w: 4.6, profile: 'blunt' });
    b.stroke([hx, hy, 4, 0], { w: 4, profile: 'blunt' });
    var tube = rotPts([-70, -14, 110, -22, 110, 22, -70, 14], -a, 0, 0);
    b.shape(movePts(tube, hx, hy), { fill: m.azul, w: 4 });
    var lens = rotPts([110, -26, 124, -27, 124, 27, 110, 26], -a, 0, 0);
    b.shape(movePts(lens, hx, hy), { fill: m.amarillo, w: 3.4 });
    var eye = rotPts([-70, -9, -92, -8, -92, 8, -70, 9], -a, 0, 0);
    b.shape(movePts(eye, hx, hy), { fill: m.tinta, w: 3 });
    var tip = rotPts([124, 0], -a, 0, 0);
    return { lens: [hx + tip[0], hy + tip[1]] };
  }, { variant: function (o) { return q01(o.angle == null ? 0.5 : o.angle); } });

  /* fig.microscope / magnifier / spyglass / flask: the legend signs at prop size in neutral colors.
   * (x, y) = center; opts.size (px, 160). Magnifier and spyglass belong only to scenes about
   * measurement and intentions (prompt §5.7). */
  fig.microscope = function (ctx, x, y, scale, o) { fig.sign(ctx, 'microscopio', x, y, 160 * (scale || 1), merge({ seed: 'prop' }, o)); };
  fig.magnifier = function (ctx, x, y, scale, o) { fig.sign(ctx, 'lupa', x, y, 160 * (scale || 1), merge({ seed: 'prop', colors: { a: M().celeste } }, o)); };
  fig.spyglass = function (ctx, x, y, scale, o) { fig.sign(ctx, 'catalejo', x, y, 160 * (scale || 1), merge({ seed: 'prop', colors: { a: M().madera } }, o)); };
  fig.flask = function (ctx, x, y, scale, o) { fig.sign(ctx, 'matraz', x, y, 160 * (scale || 1), merge({ seed: 'prop', colors: { a: M().amarillo } }, o)); };
  fig.compass = function (ctx, x, y, scale, o) { fig.sign(ctx, 'brujula', x, y, 160 * (scale || 1), merge({ seed: 'prop' }, o)); };
  fig.chair = function (ctx, x, y, scale, o) { fig.sign(ctx, 'silla-vacia', x, y, 160 * (scale || 1), merge({ seed: 'prop' }, o)); };

  /* fig.trafficLight(ctx, x, y, scale, opts) -> { lights: [{ key, x, y, r }] }: the tall
   * calligraphic clinical traffic light — fixed positions top "Rojo", middle "Ámbar", bottom
   * "Verde", each with its sign and legend label. (x, y) = foot; ~420 px tall at scale 1.
   * opts.lit ('rojo' | 'ambar' | 'verde' | null: that light glows, the others dim), labels (true), p. */
  fig.trafficLight = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, ink = I(), m = M(), p = o.p == null ? 1 : o.p, lights = L2().semaforo;
    var R = 42 * s, cx = x, top = y - 400 * s;
    ink.line(ctx, postPts(cx, y, top), { w: 8 * s, profile: 'blunt', seed: 'tl-post', p: seg(p, 0, 0.3) });
    ink.card(ctx, cx - R - 18 * s, top, (R + 18 * s) * 2, R * 6.6, { seed: 'tl-body', weight: 4.4 * s, radius: R, fill: m.tinta, p: seg(p, 0, 0.4) });
    var out = [];
    for (var i = 0; i < lights.length; i++) {
      var lt = lights[i], ly = top + R * 1.1 + lt.pos * R * 2.2, on = !o.lit || o.lit === lt.key, lp = seg(p, 0.3 + i * 0.15, 0.6 + i * 0.15);
      if (o.lit === lt.key) ink.glow(ctx, cx, ly, R * 2.4, lt.color, 0.55 * lp);
      ctx.save();
      ctx.globalAlpha *= on ? 1 : 0.35;
      ink.circle(ctx, cx, ly, R * 0.86, { fill: lt.color, line: false, seed: 'tl' + i, p: lp });
      ctx.restore();
      fig.sign(ctx, lt.sign, cx, ly, R * 1.05, { seed: 'tl', mono: true, p: lp, alpha: on ? 1 : 0.6 });
      if (o.labels !== false) ink.text(ctx, lt.label, cx + R + 30 * s, ly - 13 * s, { size: 24 * s, weight: 700, p: lp });
      out.push({ key: lt.key, x: cx, y: ly, r: R });
    }
    return { lights: out };
  };
  function L2() { return E.palette.legend; }
  var postCache = new Map();
  function postPts(x, y0, y1) {
    var k = x + '|' + y0 + '|' + y1, v = postCache.get(k);
    if (!v) { v = [x, y0, x - 2, (y0 + y1) / 2, x, y1]; postCache.set(k, v); }
    return v;
  }

  // ---- Office and mail

  defProp('stamp', function (b) {
    b.circle(0, -62, 16, { fill: M().rojo, w: 3.4 });
    b.shape(box(-7, -48, 7, -22, 0.1), { fill: M().madera, w: 3 });
    b.shape(box(-34, -22, 34, -4, 0.08), { fill: M().madera, w: 3.4 });
    b.shape(box(-30, -4, 30, 4, 0.1), { fill: M().tinta, w: 2.4 });
  });
  defProp('folder', function (b) {
    b.shape([-60, -30, -20, -30, -12, -40, 20, -40, 26, -30, 60, -30, 60, 40, -60, 40], { fill: M().amarillo, w: 3.6 });
    b.stroke([-60, -18, 60, -18], { w: 2.4, profile: 'even' });
  });
  defProp('envelope', function (b) {
    b.shape(box(-60, -38, 60, 38, 0.04), { fill: '@paper', w: 3.6 });
    b.stroke([-58, -36, 0, 6, 58, -36], { w: 3, profile: 'even' });
    b.circle(0, 6, 7, { fill: M().rojo, w: 2 });
  });
  defProp('key', function (b) {
    b.circle(-34, 0, 14, { fill: M().oro, w: 3.4 });
    b.circle(-34, 0, 4, { fill: '@paper', w: 1.6 });
    b.stroke([-20, 0, 40, 0], { w: 5.5, profile: 'blunt' });
    b.stroke([28, 0, 28, 12], { w: 4, profile: 'blunt' });
    b.stroke([38, 0, 38, 9], { w: 4, profile: 'blunt' });
  });
  // A ring with too many keys: keys hang below the ring in a fan, each with its bow and teeth.
  defProp('keyRing', function (b) {
    var m = M(), cols = [m.oro, m.tierra, m.lienzoOcre, m.oro, m.siena, m.oro, m.tierra];
    b.stroke(arc(0, -50, 20, 0, TAU, 14), { w: 3.6, closed: true, profile: 'outline' });
    for (var i = 0; i < 7; i++) {
      var a = Math.PI * (0.18 + i * 0.107), bx = Math.cos(a) * 30, by = -50 + Math.sin(a) * 30;
      var ex = Math.cos(a) * 84, ey = -50 + Math.sin(a) * 84;
      b.stroke([Math.cos(a) * 17, -50 + Math.sin(a) * 17, bx, by], { w: 2.4, profile: 'even' });
      b.circle(bx, by, 7, { fill: cols[i], w: 2.6 });
      b.stroke([bx + Math.cos(a) * 7, by + Math.sin(a) * 7, ex, ey], { w: 4, profile: 'blunt' });
      var tx = lerp(bx, ex, 0.8), ty = lerp(by, ey, 0.8), nx = -Math.sin(a), ny = Math.cos(a);
      b.stroke([tx, ty, tx + nx * 7, ty + ny * 7], { w: 3, profile: 'blunt' });
      b.stroke([lerp(bx, ex, 0.92), lerp(by, ey, 0.92), lerp(bx, ex, 0.92) + nx * 5, lerp(by, ey, 0.92) + ny * 5], { w: 2.6, profile: 'blunt' });
    }
  });
  defProp('lock', function (b) {
    b.stroke(arc(0, -22, 22, Math.PI, TAU, 10).concat([22, -6]), { w: 6, profile: 'blunt' });
    b.stroke([-22, -22, -22, -6], { w: 6, profile: 'blunt' });
    b.shape(box(-34, -8, 34, 44, 0.08), { fill: M().oro, w: 4 });
    b.circle(0, 12, 6, { fill: M().tinta, w: 2 });
    b.stroke([0, 16, 0, 30], { w: 4, profile: 'blunt' });
  });
  defProp('mailbox', function (b) {
    b.stroke([0, 0, 0, -110], { w: 7, profile: 'blunt' });
    b.shape(arc(0, -150, 44, Math.PI, TAU, 10).concat([44, -110, -44, -110]), { fill: M().azul, w: 4 });
    b.shape(box(-30, -136, 18, -124, 0.1), { fill: M().tinta, w: 2 });
    b.stroke([36, -150, 36, -186], { w: 3.4, profile: 'blunt' });
    b.shape([36, -186, 60, -180, 36, -172], { fill: M().rojo, w: 2.6 });
    return { slot: [-6, -130] };
  });
  defProp('phone', function (b) {
    b.shape(box(-20, -38, 20, 38, 0.18), { fill: M().tinta, w: 3 });
    b.fill(box(-15, -30, 15, 26, 0.1), { fill: '@paper', fillScale: 0, tex: false });
    b.dot(0, 32, 2.4, { color: '@paper' });
  });
  defProp('calendar', function (b, o) {
    var marked = o.marked == null ? 14 : o.marked, m = M();
    b.shape(box(-90, -70, 90, 80, 0.03), { fill: '@paper', w: 4 });
    b.fill(box(-90, -70, 90, -40, 0.03), { fill: m.rojo, fillScale: 0 });
    for (var i = 0; i < 4; i++) b.stroke(arc(-60 + i * 40, -72, 6, Math.PI, TAU, 6), { w: 3, profile: 'blunt' });
    var cells = [];
    for (var row = 0; row < 4; row++) for (var c = 0; c < 6; c++) cells.push([-74 + c * 28, -24 + row * 26]);
    cells.forEach(function (cc, k) {
      b.stroke([cc[0] - 6, cc[1], cc[0] + 6, cc[1]], { w: 1.4, profile: 'even' });
      if (k < marked) { b.stroke([cc[0] - 7, cc[1] - 8, cc[0] + 7, cc[1] + 6], { w: 2.6, profile: 'blunt' }); b.stroke([cc[0] + 7, cc[1] - 8, cc[0] - 7, cc[1] + 6], { w: 2.6, profile: 'blunt' }); }
    });
    return { header: [0, -55] };
  }, { variant: function (o) { return o.marked == null ? '' : o.marked; } });
  defProp('drawer', function (b, o) {
    var m = M(), n = o.cards == null ? 3 : o.cards;
    for (var i = 0; i < n; i++) b.shape(box(-60 + i * 12, -50 - i * 3, 40 + i * 12, -10, 0.05), { fill: '@paper', w: 2.6 });
    b.shape(box(-90, -20, 90, 40, 0.04), { fill: m.madera, w: 4 });
    b.stroke([-20, 10, 20, 10], { w: 5, profile: 'blunt' });
    return { label: [0, 56] };
  }, { variant: function (o) { return o.cards == null ? '' : o.cards; } });
  defProp('bucket', function (b) {
    var m = M();
    b.shape([-50, -60, 50, -60, 38, 40, -38, 40], { fill: m.celeste, w: 4 });
    b.stroke(arc(0, -60, 50, Math.PI, TAU, 10), { w: 2.6, profile: 'even' });
    [[-20, 54], [6, 66], [26, 52]].forEach(function (d) { b.blob(d[0], d[1], 4, 6, { fill: m.azul, w: 1.6, irr: 0.1 }); });
    b.stroke([-14, 20, -6, 30], { w: 2, profile: 'hair' });
  });
  defProp('chain', function (b, o) {
    var n = o.links || 5, crack = o.crack == null ? 2 : o.crack;
    for (var i = 0; i < n; i++) {
      var cx = (i - (n - 1) / 2) * 36;
      b.stroke(ell(cx, 0, 24, 12, 14), { w: 4.4, closed: true, profile: 'outline' });
      if (i === crack) b.stroke([cx - 3, -14, cx + 3, -6, cx - 2, 0], { w: 2.2, profile: 'hair', color: M().rojo });
    }
  }, { variant: function (o) { return (o.links || 5) + '|' + (o.crack == null ? 2 : o.crack); } });
  // A calligraphic doorway: an open arch with its door leaf ajar and a step.
  defProp('doorway', function (b) {
    var m = M();
    b.shape([-50, 0, -50, -112, -40, -140, 0, -158, 40, -140, 50, -112, 50, 0], { fill: m.lienzoOcre, line: false, poly: true });
    b.shape([50, 0, 50, -150, 88, -134, 88, -12], { fill: m.rojo, w: 3.6, fillScale: 0 });
    b.dot(80, -70, 3.4);
    b.stroke(arc(0, -110, 62, Math.PI, TAU, 12).concat([62, 0]), { w: 6.5, profile: 'blunt' });
    b.stroke([-62, -110, -62, 0], { w: 6.5, profile: 'blunt' });
    b.shape(box(-80, 0, 80, 12, 0.05), { fill: m.tierra, w: 3.4 });
  });
  /* fig.roadSign(ctx, x, y, scale, opts): a post with a sign board; opts.text (a rótulo, e.g. a year
   * that only names a moment). (x, y) = foot of the post. */
  defProp('roadSign', function (b) {
    b.stroke([0, 0, 0, -150], { w: 7, profile: 'blunt' });
    b.shape(box(-60, -200, 60, -150, 0.06), { fill: M().amarillo, w: 4 });
    return { board: [0, -175] };
  }, { after: function (ctx, x, y, s, o, a) { if (o.text) I().text(ctx, o.text, a.board.x, a.board.y - 15 * s, { size: 26 * s, weight: 700, align: 'center', p: o.p }); } });
  defProp('lever', function (b) {
    b.shape(box(-30, -16, 30, 0, 0.1), { fill: M().tinta, w: 3 });
    b.stroke([0, -10, 30, -100], { w: 7, profile: 'blunt' });
    b.circle(32, -106, 12, { fill: M().rojo, w: 3 });
    return { handle: [32, -106] };
  });
  defProp('steppingStones', function (b, o) {
    var n = o.n || 6, out = [], r = b.r;
    for (var i = 0; i < n; i++) {
      var sx = (i - (n - 1) / 2) * 120, sy = Math.sin(i * 1.3) * 14;
      b.blob(sx, sy, 46, 18, { fill: P().mix(M().lienzoOcre, M().tierra, 0.3 + r() * 0.3), w: 3.6, irr: 0.18 });
      out.push([sx, sy]);
    }
    return { stones: out };
  }, { variant: function (o) { return o.n || 6; } });

  // ---- Governance and navigation

  /* fig.steeringWheel(ctx, x, y, scale, opts) -> { center, rim }: a warm steering wheel with a brake
   * disc behind it. (x, y) = center; rim radius 150 px at scale 1. opts.turn (radians), p. */
  defProp('steeringWheel', function (b, o) {
    var m = M(), tr = o.turn || 0;
    b.circle(110, 110, 62, { fill: m.rojo, w: 4 });
    for (var i = 0; i < 6; i++) { var a = i / 6 * TAU; b.circle(110 + Math.cos(a) * 36, 110 + Math.sin(a) * 36, 6, { fill: M().tinta, w: 1.6 }); }
    b.circle(110, 110, 14, { fill: m.lienzoOcre, w: 2.6 });
    b.stroke(arc(0, 0, 150, 0, TAU, 28), { w: 22, closed: true, profile: 'even', color: m.madera });
    b.stroke(arc(0, 0, 162, 0, TAU, 28), { w: 4, closed: true, profile: 'outline' });
    b.stroke(arc(0, 0, 138, 0, TAU, 28), { w: 4, closed: true, profile: 'outline' });
    for (i = 0; i < 3; i++) {
      var sa = tr + Math.PI / 2 + i * TAU / 3;
      b.shape(rotPts([20, -9, 140, -12, 140, 12, 20, 9], sa), { fill: m.madera, w: 3.4 });
    }
    b.circle(0, 0, 32, { fill: m.amarillo, w: 4 });
    return { center: [0, 0], rimR: 150 };
  }, { variant: function (o) { return q01(o.turn); } });

  /* fig.lighthouse(ctx, x, y, scale, opts): (x, y) = base; ~330 px tall at scale 1. opts.beam
   * (radians: direction of the light beam, null = none), p. */
  fig.lighthouse = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    if (o.beam != null) {
      ctx.save();
      ctx.translate(x, y - 250 * s);
      ctx.rotate(o.beam);
      var g = ctx.createLinearGradient(0, 0, 420 * s, 0);
      g.addColorStop(0, P().rgba(M().amarillo, 0.7));
      g.addColorStop(1, P().rgba(M().amarillo, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(420 * s, -60 * s); ctx.lineTo(420 * s, 60 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    fig.sign(ctx, 'faro', x, y - 165 * s, 330 * s, { seed: 'lighthouse', p: o.p });
  };

  /* fig.boat(ctx, x, y, scale, opts) -> { motor, deck }: a fast warm boat; opts.motor (true: a small
   * ruled motor — the lamp — pushes it), compass (false), passengers (0..4), t, p. (x, y) = waterline
   * center; 300 px long at scale 1. */
  fig.boat = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, m = M(), p = o.p == null ? 1 : o.p, n = o.passengers || 0;
    for (var i = 0; i < n; i++) fig.person(ctx, x + (i - (n - 1) / 2) * 52 * s, y - 14 * s, 0.75 * s, { role: 'estudiante', seed: 'boat' + i, pose: 'standing', skin: (i * 2) % 5, p: p });
    var d = cached('boat', function () {
      var b = I().drawing('boat', { w: 4.4, jitter: 1 });
      b.shape([-150, -40, -100, -34, 110, -34, 165, -52, 120, 22, -130, 22], { fill: '@a', w: 4.6 });
      b.stroke([-120, -10, 120, -10], { w: 2.2, profile: 'even', color: m.lienzo });
      return b.done({ colors: { a: m.rojo } });
    });
    I().draw(ctx, d, x, y, s, { p: p, offset: 3 });
    I().wave(ctx, x - 200 * s, y + 18 * s, x + 200 * s, { amp: 4 * s, len: 60 * s, w: 3 * s, seed: 'boatwave', color: m.celeste, p: p });
    var motor = { x: x - 170 * s, y: y - 12 * s };
    if (o.motor !== false) {
      I().rRect(ctx, motor.x - 30 * s, motor.y - 22 * s, 30 * s, 44 * s, { fill: Q().noche, color: Q().linea, w: 1.4, p: p });
      fig.lamp(ctx, motor.x - 15 * s, motor.y - 34 * s, 0.32 * s, { t: o.t, p: p });
    }
    if (o.compass) fig.sign(ctx, 'brujula', x + 60 * s, y - 110 * s, 80 * s, { seed: 'boat', p: p, rot: o.compassRot || 0 });
    return { motor: motor, deck: { x: x, y: y - 34 * s } };
  };

  /* fig.net(ctx, x, y, scale, opts) -> { path: Path2D (screen space test with isPointInPath) }: a
   * large hand-drawn fishing net. (x, y) = center; 360 × 240 at scale 1. */
  fig.net = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, ink = I(), p = o.p == null ? 1 : o.p;
    var rim = cached('net-rim', function () { return ink.blobPoints(E.rng.create('net'), 0, 0, 180, 120, 12, 0.08); });
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var g = ink.shapeGeom(rim, { seed: 'net', w: 5 });
    ctx.save();
    ctx.clip(g.path);
    ctx.strokeStyle = M().tinta;
    ctx.lineWidth = 1.4 / s;
    ctx.globalAlpha *= seg(p, 0.3, 0.8);
    ctx.beginPath();
    for (var i = -200; i <= 200; i += 22) {
      ctx.moveTo(i, -140); ctx.quadraticCurveTo(i + 14, 0, i, 140);
      ctx.moveTo(-200, i * 0.66); ctx.quadraticCurveTo(0, i * 0.66 + 10, 200, i * 0.66);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = M().tinta;
    ink.fillStroke(ctx, g.outline, seg(p, 0, 0.6), 1);
    ctx.restore();
    var path = new Path2D();
    for (var k = 0; k < rim.length; k += 2) { var px = x + rim[k] * s, py = y + rim[k + 1] * s; if (k === 0) path.moveTo(px, py); else path.lineTo(px, py); }
    path.closePath();
    return { path: path };
  };

  /* fig.foldingDoc(ctx, x, y, scale, opts) -> { panels: [rects] }: a document that opens like a
   * folding map into n panels. (x, y) = top-left; each panel 130 × 180 at scale 1. opts.n (6),
   * open (0..1), p. */
  fig.foldingDoc = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, n = o.n || 6, open = clamp(o.open == null ? 1 : o.open, 0, 1), pw = 130 * s, ph = 180 * s, out = [];
    for (var i = 0; i < n; i++) {
      var shown = clamp(open * n - i, 0, 1);
      if (shown <= 0 && i > 0) break;
      var w = pw * (i === 0 ? 1 : shown);
      var rx = x + i * pw;
      ctx.save();
      ctx.globalAlpha *= i === 0 ? 1 : 0.4 + 0.6 * shown;
      I().card(ctx, rx, y + (i % 2) * 4 * s, Math.max(4, w), ph, { seed: 'fold' + i, weight: 3 * s, radius: 4, p: o.p, fill: i % 2 ? M().lienzo : P().mix(M().lienzo, M().lienzoOcre, 0.4) });
      ctx.restore();
      out.push({ x: rx, y: y, w: w, h: ph });
    }
    return { panels: out };
  };

  /* fig.pennant(ctx, x, y, scale, opts): a plain pennant on a short stick with a pattern fill (no
   * names, flags or logos). (x, y) = foot of the stick. opts.pattern, color, t (flutter), p. */
  fig.pennant = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1, t = o.t || 0, top = y - 120 * s, fl = Math.sin(t * 3 + x * 0.01) * 5 * s;
    I().line(ctx, [x, y, x, top], { w: 4 * s, profile: 'blunt', seed: 'pen-stick', p: o.p });
    var tri = new Path2D();
    tri.moveTo(x, top); tri.lineTo(x + 80 * s, top + 22 * s + fl); tri.lineTo(x, top + 46 * s); tri.closePath();
    ctx.save();
    ctx.fillStyle = o.color || M().lienzo;
    ctx.globalAlpha *= o.p == null ? 1 : seg(o.p, 0.3, 1);
    ctx.fill(tri);
    if (o.pattern) fig.pattern(ctx, o.pattern, x, top - 2, 84 * s, 52 * s, { clip: tri, spacing: 12 * s, seed: 'pn' + o.pattern });
    ctx.strokeStyle = M().tinta; ctx.lineWidth = 2.6 * s; ctx.lineJoin = 'round';
    ctx.stroke(tri);
    ctx.restore();
  };

  /* fig.flipCard(ctx, x, y, w, h, opts): a card that turns from front to back. opts.flip (0..1),
   * front(ctx, rect), back(ctx, rect) draw the faces (text from data), seed, peek, p. */
  fig.flipCard = function (ctx, x, y, w, h, o) {
    o = o || {};
    var f = clamp(o.flip || 0, 0, 1), k = Math.abs(Math.cos(f * Math.PI)), front = f < 0.5;
    ctx.save();
    ctx.translate(x + w / 2, y);
    ctx.scale(Math.max(0.02, k), 1);
    ctx.translate(-w / 2, 0);
    I().card(ctx, 0, 0, w, h, { seed: o.seed || 'flip', p: o.p, peek: o.peek, fill: front ? M().lienzo : P().mix(M().lienzo, M().lienzoOcre, 0.5) });
    var face = front ? o.front : o.back;
    if (face && k > 0.2) face(ctx, { x: 0, y: 0, w: w, h: h });
    ctx.restore();
  };

  /* fig.bubble(ctx, x, y, w, h, opts) -> inner rect: a speech bubble (tail to opts.tail { x, y })
   * or a thought bubble (opts.thought: true). Paper fill, brush outline. */
  fig.bubble = function (ctx, x, y, w, h, o) {
    o = o || {};
    var ink = I(), key = 'bubble|' + Math.round(w) + '|' + Math.round(h) + '|' + (o.thought ? 't' : 's') + '|' + (o.seed || '');
    var pts = cached(key, function () {
      var r = E.rng.create(key), out = [];
      var n = o.thought ? 14 : 16;
      for (var i = 0; i < n; i++) {
        var a = i / n * TAU, bump = o.thought ? (i % 2 ? 0.92 : 1.06) : 1 + r.jitter(0.02);
        out.push(w / 2 + Math.cos(a) * w / 2 * bump, h / 2 + Math.sin(a) * h / 2 * bump);
      }
      return out;
    });
    ctx.save();
    ctx.translate(x, y);
    ink.shape(ctx, pts, { fill: o.fill || M().lienzo, w: o.w || 3.4, seed: key, p: o.p, tex: false, offset: 2 });
    ctx.restore();
    if (o.tail) {
      if (o.thought) {
        var tx = o.tail.x, ty = o.tail.y, bx = x + w * 0.3, by = y + h;
        [0.25, 0.55, 0.8].forEach(function (u, i) { ink.circle(ctx, lerp(bx, tx, u), lerp(by, ty, u), 9 - i * 2.5, { fill: o.fill || M().lienzo, w: 2.4, seed: key + 'c' + i, p: o.p }); });
      } else {
        ink.line(ctx, [x + w * 0.3, y + h * 0.92, (x + w * 0.3 + o.tail.x) / 2, (y + h + o.tail.y) / 2, o.tail.x, o.tail.y], { w: 3.4, seed: key + 'tail', profile: 'lift', p: o.p });
      }
    }
    return { x: x + w * 0.15, y: y + h * 0.18, w: w * 0.7, h: h * 0.64 };
  };

  /* fig.desk(ctx, x, y, scale, opts) -> { top }: a warm desk seen from the front with drawers.
   * (x, y) = front center on the floor; 420 × 210 at scale 1. */
  fig.desk = function (ctx, x, y, scale, o) {
    o = o || {};
    var s = scale || 1;
    var d = cached('desk', function () {
      var b = I().drawing('desk', { w: 4, jitter: 1 });
      deskInto(b, -210, -210, 420, 210);
      return b.done({ colors: PLACE_COLORS() });
    });
    I().draw(ctx, d, x, y, s, { p: o.p, offset: 3 });
    return { top: { x: x, y: y - 210 * s, w: 420 * s } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
