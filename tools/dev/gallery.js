/* Dev-only gallery and self-test for the drawing engine (T04). Not part of the site.
 *
 *   gallery.html?section=<name>[&page=N][&p=0..1][&t=seconds][&dpr=2]
 *   gallery.html?test=1          determinism, honest-chart measurements, no exceptions
 *
 * Captions on the sheets are developer labels (identifiers), not course copy.
 */
(function (EIA) {
  'use strict';

  var E = EIA.engine;
  var q = EIA.util.query();
  var W = 1280, H = 720;
  var sections = {};
  var order = [];

  function section(name, pages, fn) { sections[name] = { pages: pages, fn: fn }; order.push(name); }

  function devLabel(ctx, text, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.size || 12) + 'px ui-monospace, monospace';
    ctx.fillStyle = o.color || 'rgba(21,18,15,0.55)';
    ctx.textAlign = o.align || 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function grid(n, cols, x0, y0, w, h) {
    var rows = Math.ceil(n / cols), cw = w / cols, ch = h / rows, out = [];
    for (var i = 0; i < n; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      out.push({ x: x0 + c * cw + cw / 2, y: y0 + r * ch + ch / 2, w: cw, h: ch });
    }
    return out;
  }

  function opts() {
    return { p: q.p == null ? 1 : Number(q.p), t: q.t == null ? 0 : Number(q.t), page: Number(q.page) || 1 };
  }

  // ---------------------------------------------------------------------------------------------
  // Sheets

  section('ink', 1, function (ctx, o) {
    var ink = E.ink, m = E.palette.mundo;
    ink.background(ctx, 'personas', { seed: 'gallery-ink' });
    var profiles = ['swell', 'blunt', 'outline', 'lift', 'press', 'even', 'hair'];
    profiles.forEach(function (pr, i) {
      var y = 70 + i * 52;
      var pts = [150, y + 10, 260, y - 14, 380, y + 12, 500, y - 8];
      ink.line(ctx, pts, { w: pr === 'hair' ? 2 : 9, profile: pr, seed: 'g' + pr, p: o.p, dot: i % 3 === 0, second: i === 0 });
      devLabel(ctx, pr, 90, y + 4, { align: 'left' });
    });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b1'), 700, 160, 90, 70, 9, 0.25), { fill: m.rojo, w: 7, seed: 'sh1', p: o.p });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b2'), 860, 200, 80, 90, 8, 0.3), { fill: m.amarillo, w: 6, seed: 'sh2', p: o.p });
    ink.shape(ctx, ink.blobPoints(E.rng.create('b3'), 1040, 150, 100, 60, 10, 0.2), { fill: m.azul, w: 8, seed: 'sh3', p: o.p });
    ink.circle(ctx, 1150, 300, 50, { fill: m.rojo, w: 3, line: false, seed: 'sun' });
    ink.spatter(ctx, 700, 420, 60, { seed: 'sp1' });
    ink.dotCluster(ctx, 860, 420, 40, { seed: 'dc1', n: 13 });
    ink.contours(ctx, 1060, 430, 120, 50, { seed: 'ct1' });
    ink.arrow(ctx, [620, 560, 760, 520, 900, 560], { w: 4, seed: 'ar1', p: o.p });
    ink.arrow(ctx, [940, 600, 1200, 600], { dotted: true, seed: 'ar2', p: o.p });
    ink.wave(ctx, 150, 470, 560, { amp: 7, len: 60, w: 5, dot: true, seed: 'wv', profile: 'press', p: o.p });
    ink.card(ctx, 150, 520, 380, 150, { seed: 'card1', peek: m.azul, peekCorner: 'tr', p: o.p });
    ink.rRect(ctx, 960, 470, 180, 90, { color: E.palette.maquina.linea });
  });

  section('signs', 3, function (ctx, o) {
    var ink = E.ink, fig = E.figures;
    ink.background(ctx, 'personas', { seed: 'gallery-signs' });
    var names = fig.signNames();
    if (o.page === 1) {
      var cells = grid(names.length, 10, 20, 14, W - 40, H - 28);
      names.forEach(function (n, i) {
        var c = cells[i];
        fig.sign(ctx, n, c.x, c.y - 8, Math.min(c.w, c.h) * 0.66, { seed: 'g', p: o.p });
        devLabel(ctx, n, c.x, c.y + c.h / 2 - 6, { size: 11 });
      });
    } else if (o.page === 2) {
      // Monochrome forms (tinta only) and a large reading of the evidence and estado signs.
      var legend = ['matraz', 'bocadillo', 'lupa', 'catalejo', 'cometa', 'sello-visto', 'asterisco', 'luna', 'libro', 'cuadrado'];
      legend.forEach(function (n, i) {
        var x = 80 + i * 124;
        fig.sign(ctx, n, x, 110, 100, { seed: 'g', p: o.p });
        fig.sign(ctx, n, x, 250, 100, { seed: 'g', mono: true, p: o.p });
        fig.sign(ctx, n, x, 360, 32, { seed: 'g', p: o.p });
        fig.sign(ctx, n, x, 410, 22, { seed: 'g', p: o.p });
        devLabel(ctx, n, x, 450, { size: 11 });
      });
      ['estrella', 'luna', 'sol', 'pajaro', 'espiral', 'constelacion'].forEach(function (n, i) {
        fig.sign(ctx, n, 110 + i * 210, 590, 190, { seed: 'big' + i, p: o.p });
      });
    } else {
      // Seed variation: the same sign with eight seeds.
      ['estrella', 'pajaro', 'constelacion', 'mancha', 'cabellos', 'salpicadura'].forEach(function (n, row) {
        for (var k = 0; k < 10; k++) fig.sign(ctx, n, 70 + k * 118, 66 + row * 116, 92, { seed: 's' + k, p: o.p });
      });
    }
  });

  section('lettering', 1, function (ctx, o) {
    var ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-letter' });
    ink.letter(ctx, 'Estado de la IA 2026', 140, 60, { size: 92, maxWidth: 1060, seed: 'l1', p: o.p });
    ink.letter(ctx, 'Del uso al valor: el embudo de la adopción', 140, 240, { size: 60, maxWidth: 1000, seed: 'l2', p: o.p });
    ink.letter(ctx, 'Medir confiabilidad, no solo precisión.', 140, 420, { size: 48, font: 'sans', maxWidth: 1000, seed: 'l3', p: o.p });
    ink.text(ctx, 'Lo que personas u organizaciones dicen hacer. Texto de cuerpo en EIA Sans a 22 px, envuelto en un ancho máximo de 700 píxeles para revisar la medida.',
      140, 560, { size: 22, maxWidth: 700 });
    ink.text(ctx, 'Nota en cursiva, estilo margen', 900, 560, { size: 20, italic: true, maxWidth: 300 });
  });

  section('backgrounds', 1, function (ctx, o) {
    var ink = E.ink;
    var kinds = ['personas', 'datos', 'territorio', 'mar', 'maquina', 'lienzo'];
    var cells = grid(kinds.length, 3, 0, 0, W, H);
    kinds.forEach(function (k, i) {
      var c = cells[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      ctx.clip();
      ctx.translate(c.x - c.w / 2, c.y - c.h / 2);
      ctx.scale(c.w / W, c.h / H);
      ink.background(ctx, k, { seed: 'bg-' + k });
      ctx.restore();
      devLabel(ctx, k, c.x, c.y + c.h / 2 - 10, { size: 14, color: k === 'mar' || k === 'maquina' ? '#F4EEDF' : '#15120F' });
    });
  });

  // ---------------------------------------------------------------------------------------------
  // Runner

  var stage = document.getElementById('stage');
  var dpr = Math.min(2, Number(q.dpr) || 1);
  stage.width = W * dpr;
  stage.height = H * dpr;
  stage.style.width = W + 'px';
  stage.style.height = H + 'px';

  function renderSection(ctx, name, o) {
    var s = sections[name];
    if (!s) throw new Error('Unknown section: ' + name);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    s.fn(ctx, o);
    ctx.restore();
  }

  function nav() {
    var el = document.getElementById('nav');
    el.innerHTML = order.map(function (n) { return '<a href="?section=' + n + '">' + n + '</a>'; }).join('') +
      '<a href="?test=1">self-test</a>';
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 40px "EIA Display"'),
      document.fonts.load('700 40px "EIA Display"'),
      document.fonts.load('400 20px "EIA Sans"'),
      document.fonts.load('700 20px "EIA Sans"'),
      document.fonts.load('italic 400 20px "EIA Sans"')
    ]).then(function () { return document.fonts.ready; });
  }

  EIA.dev = EIA.dev || {};
  EIA.dev.sections = sections;
  EIA.dev.renderSection = renderSection;

  fontsReady().then(function () {
    nav();
    var ctx = stage.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (q.test) {
      if (EIA.dev.runTests) EIA.dev.runTests(ctx);
      return;
    }
    try {
      renderSection(ctx, q.section || 'ink', opts());
      document.title = 'OK ' + (q.section || 'ink');
    } catch (err) {
      document.getElementById('results').textContent = 'FAIL render: ' + (err && err.stack || err);
      throw err;
    }
  });
})(window.EIA);
