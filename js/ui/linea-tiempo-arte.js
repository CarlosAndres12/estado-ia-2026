/* Estado de la IA 2026 — sesión 0: the drawings of the timeline poster (#s0, js/ui/linea-tiempo.js).
 *
 * One small brush drawing per poster column, in the course's ink language (js/engine/ink.js): flat
 * gouache fields offset from their outlines, swelling black strokes, the machine kit (navy, pale-blue
 * ruled lines) for screens. They evoke base_linea_del_tiempo/Untitled.jpg without photos, logos or
 * faces: a portrait silhouette for Turing, a college hall, a Lisp card, the ELIZA terminal, a wheeled
 * robot, chess pieces, an SUV with roof sensors, a dark cube with a globe, a Go board, a block diagram,
 * text pages, a generic knot, landscapes, video frames, a head with a light bulb, a browser with a gear
 * and a robot head with a globe. Two header flourishes ('adorno-fundamentos', 'adorno-generativa')
 * carry the poster's loose decoration (color blobs, asterisks, a looping line).
 *
 *   EIA.ui.lineaTiempoArte.names()                    every drawing name
 *   EIA.ui.lineaTiempoArte.draw(ctx, name, w, h, o)   fits the drawing in a w×h box (screen units),
 *                                                     centered; o.seed varies the hand. Returns false
 *                                                     for an unknown name.
 *
 * Every drawing is built once (seeded, cached) in its own logical box, 150×112 by default, centered on
 * (0, 0). Loads without a DOM: nothing is drawn until draw() is called with a 2D context. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};

  var TAU = Math.PI * 2;
  function E() { return EIA.engine || {}; }
  function M() { return E().palette.mundo; }
  function Q() { return E().palette.maquina; }
  function piel(i) { return E().palette.pieles[i]; }

  // Neutral grays of the drawings (paper, steel, ash) mixed from the palette's own paper and ink.
  var PAPEL = '#FBF7EE';
  var GRIS = '#D8D2C4';
  var ACERO = '#8C857A';
  var CARBON = '#2B2622';

  function rect(x0, y0, x1, y1) { return [x0, y0, x1, y0, x1, y1, x0, y1]; }
  // Rectangle with extra points near the corners: a softly rounded outline.
  function box(x0, y0, x1, y1, k) {
    k = k == null ? 0.12 : k;
    var dx = (x1 - x0) * k, dy = (y1 - y0) * k;
    return [x0, y0 + dy, x0 + dx, y0, x1 - dx, y0, x1, y0 + dy, x1, y1 - dy, x1 - dx, y1, x0 + dx, y1, x0, y1 - dy];
  }
  function ell(cx, cy, rx, ry, n) {
    var out = [];
    for (var i = 0; i < n; i++) { var a = i / n * TAU; out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
    return out;
  }
  function bilerp(q, u, v) {
    // q = [x0,y0 (top left), x1,y1 (top right), x2,y2 (bottom right), x3,y3 (bottom left)]
    var tx = q[0] + (q[2] - q[0]) * u, ty = q[1] + (q[3] - q[1]) * u;
    var bx = q[6] + (q[4] - q[6]) * u, by = q[7] + (q[5] - q[7]) * u;
    return [tx + (bx - tx) * v, ty + (by - ty) * v];
  }
  function arrowInto(b, x0, y0, x1, y1) {
    b.stroke([x0, y0, x1, y1], { w: 2.4, profile: 'even', jitter: 0 });
    var a = Math.atan2(y1 - y0, x1 - x0), hs = 6;
    b.stroke([x1 - Math.cos(a - 0.5) * hs, y1 - Math.sin(a - 0.5) * hs, x1, y1, x1 - Math.cos(a + 0.5) * hs, y1 - Math.sin(a + 0.5) * hs],
      { w: 2.2, profile: 'even', jitter: 0 });
  }
  // A generic three-lobed knot (a trefoil curve): the poster's "language model" glyph without any logo.
  function knotInto(b, cx, cy, k, w) {
    var pts = [];
    for (var i = 0; i < 48; i++) {
      var t = i / 48 * TAU;
      pts.push(cx + (Math.sin(t) + 2 * Math.sin(2 * t)) * k, cy + (Math.cos(t) - 2 * Math.cos(2 * t)) * k);
    }
    b.stroke(pts, { w: w, profile: 'even', closed: true, jitter: 0 });
  }
  function textInto(b, lines) {
    b.custom(function (ctx) {
      ctx.save();
      ctx.textBaseline = 'alphabetic';
      lines.forEach(function (l) {
        ctx.font = (l.weight || 600) + ' ' + l.size + 'px ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace';
        ctx.fillStyle = l.color;
        ctx.textAlign = l.align || 'left';
        ctx.fillText(l.text, l.x, l.y);
      });
      ctx.restore();
    });
  }
  function frameLandscape(b, x0, y0, x1, y1, o) {
    o = o || {};
    var w = x1 - x0, h = y1 - y0;
    b.shape(rect(x0, y0, x1, y1), { fill: o.sky || M().celeste, w: 3, sharp: true });
    b.circle(x0 + w * 0.76, y0 + h * 0.28, Math.min(w, h) * 0.11, { fill: M().amarillo, line: false });
    b.shape([x0, y0 + h * 0.72, x0 + w * 0.24, y0 + h * 0.3, x0 + w * 0.42, y0 + h * 0.6, x0 + w * 0.62, y0 + h * 0.22,
      x1, y0 + h * 0.66, x1, y1, x0, y1], { fill: M().azul, w: 2, line: false, sharp: true });
    b.shape([x0, y0 + h * 0.8, x0 + w * 0.35, y0 + h * 0.66, x0 + w * 0.7, y0 + h * 0.8, x1, y0 + h * 0.74, x1, y1, x0, y1],
      { fill: M().verde, line: false, sharp: true });
    b.stroke([x0 + w * 0.18, y0 + h * 0.42, x0 + w * 0.24, y0 + h * 0.3, x0 + w * 0.3, y0 + h * 0.4], { w: 1.8, color: PAPEL, profile: 'even' });
    b.stroke([x0 + w * 0.55, y0 + h * 0.33, x0 + w * 0.62, y0 + h * 0.22, x0 + w * 0.69, y0 + h * 0.32], { w: 1.8, color: PAPEL, profile: 'even' });
  }

  // ---------------------------------------------------------------------------------------------
  // The drawings: build(b) in a box centered on (0, 0); extra(ctx) draws signs on top (screen space
  // already scaled to the box); box: { w, h } when not 150×112.

  var ART = {};
  function def(name, build, o) { ART[name] = { build: build, extra: o && o.extra, box: (o && o.box) || { w: 150, h: 112 } }; }
  function star(ctx, x, y, size, seed) { E().figures.sign(ctx, 'asterisco', x, y, size, { seed: seed, mono: true }); }

  def('turing', function (b) {
    b.blob(-38, -4, 25, 24, { fill: M().rojo, line: false, irr: 0.12 });
    b.shape([-40, 52, -36, 28, -20, 15, -6, 13, 14, 13, 28, 15, 44, 28, 48, 52], { fill: CARBON, w: 3.4 });
    b.shape([-6, 13, 4, 34, 14, 13], { fill: PAPEL, w: 2.2 });
    b.shape([2, 17, 6, 17, 8, 31, 4, 36, 0, 31], { fill: M().azul, w: 1.8 });
    b.shape([-3, -2, 11, -2, 12, 14, -4, 14], { fill: piel(0), w: 2.4 });
    b.ellipse(4, -19, 17, 21, { fill: piel(0), w: 3.4 });
    b.ellipse(-12, -16, 4, 6, { fill: piel(0), w: 2.2 });
    b.shape([-14, -23, -11, -36, 1, -43, 15, -40, 22, -29, 21, -22, 11, -31, -1, -30, -10, -21], { fill: CARBON, w: 2.6 });
  }, { extra: function (ctx) { star(ctx, 54, -36, 30, 'turing'); } });

  def('dartmouth', function (b) {
    b.blob(34, -24, 28, 22, { fill: M().amarillo, line: false, irr: 0.14 });
    b.shape(rect(-58, -4, 26, 44), { fill: '#F1E6D0', w: 3, sharp: true });
    b.shape([-62, -4, -16, -24, 30, -4], { fill: M().siena, w: 3, sharp: true });
    b.shape(rect(-24, -38, -8, -16), { fill: '#F1E6D0', w: 2.6, sharp: true });
    b.shape([-27, -38, -16, -56, -5, -38], { fill: M().tinta, w: 2.2, sharp: true });
    for (var i = 0; i < 6; i++) {
      var x = -52 + i * 13;
      b.shape(rect(x, 4, x + 6, 14), { fill: M().celeste, w: 1.8, sharp: true });
      if (i !== 2 && i !== 3) b.shape(rect(x, 24, x + 6, 34), { fill: M().celeste, w: 1.8, sharp: true });
    }
    b.shape(rect(-24, 26, -12, 44), { fill: M().madera, w: 2.2, sharp: true });
    b.stroke([44, 44, 44, 26], { w: 3, profile: 'blunt' });
    b.blob(44, 12, 15, 20, { fill: M().verde, w: 2.8, irr: 0.18 });
    b.blob(62, 24, 9, 14, { fill: M().verde, w: 2.4, irr: 0.2 });
    b.stroke([-66, 45, 0, 44, 70, 45], { w: 3, profile: 'swell' });
  });

  def('lisp', function (b) {
    b.shape(rect(-52, -30, 52, 30), { fill: '#E2DED5', w: 3, sharp: true });
    textInto(b, [
      { text: '(defun ai', x: -40, y: -4, size: 15, color: M().tinta },
      { text: '(think))', x: -22, y: 16, size: 15, color: M().tinta }
    ]);
    b.dot(-50, 40, 4.5, { color: M().rojo });
  });

  def('eliza', function (b) {
    b.circle(-50, -34, 17, { fill: M().azul, line: false });
    b.shape(rect(-64, -28, 64, 34), { fill: Q().noche, w: 3, sharp: true });
    b.rline(-56, -4, 56, -4, { color: Q().rejilla, w: 1 });
    textInto(b, [
      { text: 'ELIZA', x: 0, y: -10, size: 19, color: Q().linea, align: 'center', weight: 400 },
      { text: '> How do you feel today?', x: -56, y: 12, size: 8, color: Q().linea, weight: 500 },
      { text: '> _', x: -56, y: 26, size: 8, color: Q().brilloVerde, weight: 500 }
    ]);
  });

  def('shakey', function (b) {
    b.blob(-32, 10, 27, 25, { fill: M().amarillo, line: false, irr: 0.14 });
    b.shape(rect(-28, 20, 28, 36), { fill: '#5A544C', w: 3, sharp: true });
    b.circle(-18, 40, 7, { fill: M().tinta, w: 2.2 });
    b.circle(18, 40, 7, { fill: M().tinta, w: 2.2 });
    b.shape(rect(-19, -8, 19, 20), { fill: '#C9C2B5', w: 3, sharp: true });
    b.stroke([-13, 0, 13, 0], { w: 1.8, profile: 'even' });
    b.stroke([-13, 8, 5, 8], { w: 1.8, profile: 'even' });
    b.stroke([0, -8, 0, -36], { w: 3, profile: 'even' });
    b.stroke([-8, -22, 8, -22], { w: 2, profile: 'even' });
    b.shape(rect(-11, -50, 11, -36), { fill: '#3A352F', w: 2.4, sharp: true });
    b.circle(11, -43, 4.5, { fill: M().celeste, w: 1.8 });
    b.stroke([4, -50, 10, -60], { w: 2, profile: 'even' });
    b.dot(10, -61, 2.6);
    b.stroke([-46, 49, 0, 48, 48, 49], { w: 2.6, profile: 'swell' });
  });

  function pieceInto(b, x, h, head) {
    var base = 46, top = base - h;
    b.shape([x - 15, base, x + 15, base, x + 13, base - 8, x - 13, base - 8], { fill: M().tinta, w: 1.8, sharp: true });
    b.shape([x - 11, base - 8, x - 6, base - h * 0.32, x - 4, top + h * 0.3, x + 4, top + h * 0.3, x + 6, base - h * 0.32, x + 11, base - 8],
      { fill: M().tinta, w: 1.8 });
    b.shape(rect(x - 9, top + h * 0.24, x + 9, top + h * 0.31), { fill: M().tinta, w: 1.6, sharp: true });
    if (head === 'king') {
      b.ellipse(x, top + h * 0.17, 8, 7, { fill: M().tinta, w: 1.6 });
      b.stroke([x, top + h * 0.1, x, top - 7], { w: 3.4, profile: 'blunt' });
      b.stroke([x - 6, top - 1, x + 6, top - 1], { w: 3.4, profile: 'blunt' });
    } else if (head === 'queen') {
      b.shape([x - 9, top + h * 0.24, x - 11, top + 2, x - 4, top + 8, x, top - 2, x + 4, top + 8, x + 11, top + 2, x + 9, top + h * 0.24],
        { fill: M().tinta, w: 1.6, sharp: true });
      b.dot(x, top - 5, 3.4);
    } else {
      b.circle(x, top + h * 0.12, 8.5, { fill: M().tinta, w: 1.6 });
    }
  }
  def('ajedrez', function (b) {
    b.circle(50, -34, 14, { fill: M().azul, line: false });
    pieceInto(b, -30, 50, 'queen');
    pieceInto(b, 2, 70, 'king');
    pieceInto(b, 32, 34, 'pawn');
  }, { extra: function (ctx) { star(ctx, 56, 14, 24, 'ajedrez'); } });

  def('stanley', function (b) {
    b.blob(48, -8, 22, 21, { fill: M().rojo, line: false, irr: 0.14 });
    b.dot(-60, -32, 5, { color: M().azul });
    b.stroke([-24, -16, 22, -16], { w: 3, profile: 'blunt' });
    b.shape(rect(-18, -25, -8, -16), { fill: '#3A352F', w: 2, sharp: true });
    b.shape(rect(0, -34, 8, -16), { fill: '#5A544C', w: 2, sharp: true });
    b.circle(4, -37, 4.5, { fill: M().amarillo, w: 1.8 });
    b.shape(rect(13, -23, 20, -16), { fill: '#3A352F', w: 1.8, sharp: true });
    b.shape([-62, 28, -60, 10, -46, 6, -32, -13, 26, -13, 38, 4, 60, 8, 64, 28], { fill: '#EDEAE3', w: 3 });
    b.shape([-30, -8, -6, -8, -6, 4, -40, 4], { fill: M().celeste, w: 2, sharp: true });
    b.shape([-1, -8, 22, -8, 32, 4, -1, 4], { fill: M().celeste, w: 2, sharp: true });
    b.stroke([-60, 16, 62, 16], { w: 1.6, profile: 'even', color: M().rojo });
    b.circle(-36, 29, 10, { fill: M().tinta, w: 2.2 });
    b.circle(-36, 29, 4, { fill: '#BDB6AA', w: 1.2 });
    b.circle(38, 29, 10, { fill: M().tinta, w: 2.2 });
    b.circle(38, 29, 4, { fill: '#BDB6AA', w: 1.2 });
    b.stroke([-70, 40, 0, 41, 70, 40], { w: 2.4, profile: 'swell' });
  });

  def('watson', function (b) {
    b.blob(54, -32, 30, 26, { fill: M().azul, line: false, irr: 0.12 });
    b.shape([-40, -22, -24, -38, 40, -38, 24, -22], { fill: '#1E2C57', w: 2.6, sharp: true });
    b.shape([24, -22, 40, -38, 40, 26, 24, 42], { fill: '#0A1430', w: 2.6, sharp: true });
    b.shape(rect(-40, -22, 24, 42), { fill: Q().noche, w: 3, sharp: true });
    b.glow(-8, 10, 30, Q().linea, { alpha: 0.55 });
    b.rcircle(-8, 10, 16, { color: Q().linea, w: 1.8, fill: '#1F4A8A' });
    b.stroke(ell(-8, 10, 7, 16, 20), { w: 1.4, profile: 'even', closed: true, color: Q().linea, jitter: 0 });
    b.rline(-24, 10, 8, 10, { color: Q().linea, w: 1.3 });
    b.rline(-21, 2, 5, 2, { color: Q().linea, w: 1 });
    b.rline(-21, 18, 5, 18, { color: Q().linea, w: 1 });
    b.dot(58, 18, 4.5, { color: M().rojo });
  });

  def('go', function (b) {
    b.blob(-42, -14, 24, 22, { fill: M().amarillo, line: false, irr: 0.14 });
    var q = [-52, -22, 40, -30, 58, 30, -40, 38];
    b.shape([-40, 38, 58, 30, 58, 37, -40, 45], { fill: M().madera, w: 2.4, sharp: true });
    b.shape(q, { fill: '#DDAE63', w: 3, sharp: true });
    var n = 6, i, p0, p1;
    for (i = 1; i < n; i++) {
      p0 = bilerp(q, i / n, 0); p1 = bilerp(q, i / n, 1);
      b.stroke([p0[0], p0[1], p1[0], p1[1]], { w: 1.1, profile: 'even', color: M().siena, jitter: 0 });
      p0 = bilerp(q, 0, i / n); p1 = bilerp(q, 1, i / n);
      b.stroke([p0[0], p0[1], p1[0], p1[1]], { w: 1.1, profile: 'even', color: M().siena, jitter: 0 });
    }
    [[1, 2, 'b'], [2, 2, 'w'], [2, 3, 'b'], [3, 1, 'w'], [3, 3, 'w'], [4, 2, 'b'], [1, 4, 'w'], [4, 4, 'b'], [5, 3, 'b'], [2, 5, 'w']]
      .forEach(function (s) {
        var p = bilerp(q, s[0] / n, s[1] / n);
        if (s[2] === 'b') b.dot(p[0], p[1], 4.6);
        else b.circle(p[0], p[1], 4.3, { fill: PAPEL, w: 1.3 });
      });
  });

  def('transformer', function (b) {
    var boxes = [[-58, -10, -36, 10, M().azul], [-14, -42, 8, -20, M().rojo], [-14, 0, 8, 22, M().azul],
      [28, -26, 50, -4, M().verde], [28, 18, 50, 40, M().rojo], [-58, 26, -42, 42, M().amarillo]];
    boxes.forEach(function (r) { b.shape(rect(r[0], r[1], r[2], r[3]), { fill: r[4], w: 2.4, sharp: true }); });
    arrowInto(b, -36, -4, -16, -28);
    arrowInto(b, -36, 4, -16, 10);
    arrowInto(b, 8, -31, 26, -18);
    arrowInto(b, 8, 8, 26, -10);
    arrowInto(b, 8, 14, 26, 26);
    arrowInto(b, -47, 10, -49, 24);
    b.dots([-12, 34, -4, 34, 4, 34], 1.8);
  }, { extra: function (ctx) { star(ctx, 2, 46, 16, 'transformer'); } });

  function pageInto(b, x0, y0, x1, y1, lines) {
    var f = 11;
    b.shape([x0, y0, x1 - f, y0, x1, y0 + f, x1, y1, x0, y1], { fill: PAPEL, w: 2.8, sharp: true });
    b.stroke([x1 - f, y0, x1 - f, y0 + f, x1, y0 + f], { w: 1.8, profile: 'even' });
    for (var i = 0; i < lines; i++) {
      var y = y0 + 14 + i * 9, len = (i % 3 === 2 ? 0.55 : 0.82) * (x1 - x0 - 18);
      b.stroke([x0 + 9, y, x0 + 9 + len, y], { w: 2, profile: 'even', color: ACERO, jitter: 0.3 });
    }
  }
  def('documento', function (b) {
    pageInto(b, -32, -46, 32, 44, 6);
    b.circle(20, -22, 7, { fill: M().azul, line: false });
    b.shape(rect(-23, 28, -11, 33), { fill: M().rojo, line: false, sharp: true });
    b.shape(rect(-8, 28, 6, 33), { fill: M().amarillo, line: false, sharp: true });
    b.shape(rect(9, 28, 22, 33), { fill: M().verde, line: false, sharp: true });
  });
  def('documentos', function (b) {
    b.dot(-50, -38, 5.5, { color: M().tinta });
    pageInto(b, -14, -48, 44, 36, 5);
    pageInto(b, -40, -36, 18, 46, 6);
    b.dot(54, 40, 4, { color: M().amarillo });
  }, { extra: function (ctx) { star(ctx, 30, 42, 20, 'documentos'); } });

  def('nudo', function (b) {
    b.circle(0, 0, 44, { fill: '#EFE7D6', line: false });
    knotInto(b, 0, 2, 12.5, 6.5);
    knotInto(b, 0, 2, 9, 2);
  }, { extra: function (ctx) { star(ctx, 52, -38, 20, 'nudo'); } });

  def('paisaje', function (b) {
    frameLandscape(b, -56, -36, 52, 38);
  });

  def('paisaje-chat', function (b) {
    b.dot(54, -44, 6, { color: M().rojo });
    frameLandscape(b, -64, -30, 12, 26, { sky: '#A9CBE6' });
    b.shape(box(-2, -6, 54, 36, 0.2), { fill: PAPEL, w: 2.8 });
    b.shape([8, 34, 4, 46, 18, 35], { fill: PAPEL, w: 2.2 });
    knotInto(b, 26, 15, 4.6, 2.6);
  });

  def('video', function (b) {
    var fills = [M().celeste, M().azul, M().verde, M().amarillo, M().siena, '#A9CBE6'];
    for (var r = 0; r < 2; r++) {
      for (var c = 0; c < 3; c++) {
        var x0 = -60 + c * 41, y0 = -38 + r * 36, k = r * 3 + c;
        b.shape(rect(x0, y0, x0 + 36, y0 + 30), { fill: fills[k], w: 2.4, sharp: true });
        b.stroke([x0 + 3, y0 + 24, x0 + 12, y0 + 14, x0 + 19, y0 + 20, x0 + 27, y0 + 10, x0 + 34, y0 + 22], { w: 1.6, profile: 'even', color: k === 1 ? PAPEL : M().tinta });
      }
    }
    b.shape([-6, -2, -6, 18, 12, 8], { fill: M().rojo, w: 2.2, sharp: true });
  });

  def('razonamiento', function (b) {
    b.stroke([-26, 48, -28, 24, -38, 6, -38, -18, -26, -38, -2, -48, 22, -42, 34, -24, 35, -8, 44, 6, 36, 11, 36, 24, 26, 28, 18, 30, 18, 48],
      { w: 4, profile: 'swell' });
    b.circle(-2, -14, 13, { fill: M().amarillo, w: 2.6 });
    b.shape(rect(-7, -1, 3, 9), { fill: ACERO, w: 2, sharp: true });
    b.stroke([-6, 4, 2, 4], { w: 1.4, profile: 'even' });
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI * (0.15 + i * 0.175);
      b.stroke([-2 + Math.cos(a) * 18, -14 + Math.sin(a) * 18, -2 + Math.cos(a) * 25, -14 + Math.sin(a) * 25], { w: 2.2, profile: 'blunt' });
    }
  });

  def('agente', function (b) {
    b.shape(rect(-56, -40, 36, 30), { fill: PAPEL, w: 3, sharp: true });
    b.shape(rect(-56, -40, 36, -27), { fill: GRIS, w: 2.4, sharp: true });
    b.dot(-49, -33.5, 2.4, { color: M().rojo });
    b.dot(-42, -33.5, 2.4, { color: M().amarillo });
    b.dot(-35, -33.5, 2.4, { color: M().verde });
    [-17, -8, 1, 10].forEach(function (y, i) { b.stroke([-46, y, i === 3 ? -14 : 8, y], { w: 2, profile: 'even', color: ACERO }); });
    var pts = [], teeth = 8;
    for (var i = 0; i < teeth; i++) {
      var a = i / teeth * TAU;
      [[-0.17, 14], [-0.1, 20], [0.1, 20], [0.17, 14]].forEach(function (t) { pts.push(36 + Math.cos(a + t[0]) * t[1], 26 + Math.sin(a + t[0]) * t[1]); });
    }
    b.shape(pts, { fill: ACERO, w: 2.4, sharp: true });
    b.circle(36, 26, 6, { fill: PAPEL, w: 2 });
  });

  def('robot', function (b) {
    b.shape(rect(-22, 32, 10, 48), { fill: GRIS, w: 2.6, sharp: true });
    b.shape(box(-36, -20, 24, 32, 0.18), { fill: GRIS, w: 3 });
    b.shape(rect(-42, -2, -36, 14), { fill: ACERO, w: 2, sharp: true });
    b.shape(rect(24, -2, 30, 14), { fill: ACERO, w: 2, sharp: true });
    b.shape(rect(-28, -6, 16, 10), { fill: Q().noche, w: 2.4, sharp: true });
    b.glow(-6, 2, 16, Q().linea, { alpha: 0.4 });
    b.rline(-22, 2, 10, 2, { color: Q().linea, w: 2.4, cap: 'round' });
    b.stroke([-14, 20, 2, 20], { w: 2.2, profile: 'even' });
    b.stroke([-6, -20, -6, -32], { w: 2.4, profile: 'even' });
    b.dot(-6, -34, 3.6, { color: M().rojo });
    b.circle(42, -30, 17, { fill: M().azul, w: 2.6 });
    b.stroke(ell(42, -30, 7.5, 17, 20), { w: 1.5, profile: 'even', closed: true, color: PAPEL, jitter: 0 });
    b.stroke([25, -30, 59, -30], { w: 1.5, profile: 'even', color: PAPEL, jitter: 0 });
  });

  // Header flourishes (box 220×90).
  def('adorno-fundamentos', function (b) {
    b.blob(78, -20, 40, 36, { fill: M().azul, line: false, irr: 0.12 });
    b.stroke([-100, 30, -60, 22, -36, 34, -10, 26], { w: 2.6, profile: 'lift', dot: 'detached' });
  }, { box: { w: 220, h: 90 }, extra: function (ctx) { star(ctx, 6, -18, 46, 'adorno-1'); } });
  def('adorno-generativa', function (b) {
    b.dot(-92, 8, 8, { color: M().azul });
    b.stroke([-82, 14, -60, 2, -44, 12, -40, -6, -30, -12, -24, 0, -34, 8, -42, -2, -20, 4, 4, 12, 26, -4, 40, 6, 62, 2, 86, 20],
      { w: 2.6, profile: 'swell' });
    b.blob(56, 20, 30, 15, { fill: M().rojo, line: false, irr: 0.1 });
    b.shape([4, 6, 12, -6, 18, 8], { fill: M().azul, w: 1.6, sharp: true });
  }, { box: { w: 220, h: 90 }, extra: function (ctx) { star(ctx, 24, -26, 34, 'adorno-2'); } });

  // ---------------------------------------------------------------------------------------------

  var built = {};
  function drawingFor(name) {
    if (!built[name]) {
      var b = E().ink.drawing('s0-arte:' + name, { w: 3, jitter: 0.6 });
      ART[name].build(b);
      built[name] = b.done();
    }
    return built[name];
  }

  function draw(ctx, name, w, h, o) {
    var a = ART[name];
    if (!a || !E().ink) return false;
    o = o || {};
    var s = Math.min(w / a.box.w, h / a.box.h);
    E().ink.draw(ctx, drawingFor(name), w / 2, h / 2, s, { p: o.p });
    if (a.extra) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(s, s);
      a.extra(ctx);
      ctx.restore();
    }
    return true;
  }

  ui.lineaTiempoArte = { names: function () { return Object.keys(ART); }, draw: draw };
})(typeof window !== 'undefined' ? window : globalThis);
