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

  // Chart strings below are verbatim KB fragments (KB §13 and the D7 slide script).
  var D7_ITEMS = [
    { text: '88% usa IA en al menos una función', cifras: ['adop-1'] },
    { text: '62% experimenta o escala agentes', cifras: ['adop-2'] },
    { text: '~1/3 escala la IA en toda la organización (la barra más estrecha, el cuello de botella)', cifras: ['adop-4'] },
    { text: '39% reporta algún impacto en EBIT (normalmente <5%)', cifras: ['adop-5'] }
  ];
  EIA.dev.D7_ITEMS = D7_ITEMS;

  section('charts', 2, function (ctx, o) {
    var ink = E.ink, chart = E.chart, m = E.palette.mundo;
    ink.background(ctx, 'datos', { seed: 'gallery-charts' });
    if (o.page === 1) {
      chart.bars(ctx, D7_ITEMS, { x: 70, y: 50, len: 380, h: 30, gap: 30, p: o.p, labelSize: 20, labelWidth: 230, tag: false });
      chart.unitGrid(ctx, { x: 70, y: 330, w: 220, total: 100, value: 23, p: o.p, seed: 'g23' });
      chart.unitGrid(ctx, { x: 330, y: 330, w: 320, total: 1000, percent: 3.3, p: o.p, litColor: m.tinta, seed: 'g33' });
      chart.dots(ctx, { x: 160, y: 620, count: 44, pitch: 15, p: o.p, seed: 'd44' });
      chart.dots(ctx, { x: 330, y: 620, count: 8, pitch: 15, p: o.p, seed: 'd8' });
      var sc = chart.scale(100, 700, 330);
      chart.band(ctx, { text: '+14–15%', scale: sc, y: 60, p: o.p });
      chart.bar(ctx, { text: 'Hasta −83% de tiempo de redacción de notas clínicas', scale: sc, y: 120, h: 28, p: o.p, color: m.verde, labelWidth: 200, cifras: ['med-1'] });
      chart.bar(ctx, { text: '<20%', label: '', scale: sc, y: 190, h: 28, p: o.p, color: m.rojo });
      chart.bar(ctx, { text: 'Más de 90% (91,2%)', scale: sc, y: 250, h: 28, p: o.p, color: m.amarillo, labelWidth: 120 });
      chart.interval(ctx, { min: -50, max: 20, x: 700, len: 500, y: 400, lo: chart.parseValue('−38%').value, hi: chart.parseValue('+9%').value,
        point: chart.parseValue('−18%').value, labels: { lo: '−38%', hi: '+9%', point: '−18%' }, p: o.p });
      chart.gauge(ctx, { x: 780, y: 600, r: 80, max: 400, text: '362 (2025)', ghost: chart.parseValue('233 (2024)').value, p: o.p, cifras: ['ries-1'] });
      ink.machineGrid(ctx, 1060, 500, 190, 190, { cell: 12 });
      chart.gauge(ctx, { x: 1155, y: 600, r: 62, max: 100, text: '55,84', style: 'ruled', p: o.p });
    } else {
      chart.funnel(ctx, { x: 60, y: 60, w: 360, items: D7_ITEMS, p: o.p, labelWidth: 290 });
      chart.timeline(ctx, { x: 60, y: 470, w: 1160, from: '1 de enero de 2024', to: '1 de enero de 2029', p: o.p, items: [
        { text: '1 de agosto de 2024: entra en vigor' }, { text: '2 de febrero de 2025: prohibiciones y alfabetización en IA' },
        { text: '2 de agosto de 2025: obligaciones para modelos de propósito general' }, { text: '2 de diciembre de 2027' }, { text: '2 de agosto de 2028' }] });
      chart.panels(ctx, { x: 760, y: 560, w: 460, h: 140, p: o.p, panels: [
        { draw: function (c, r, pp) { E.ink.text(c, '88%', r.x + r.w / 2, r.y + 40, { size: 40, weight: 700, align: 'center', p: pp }); } },
        { draw: function (c, r, pp) { E.ink.text(c, '~9 de 10', r.x + r.w / 2, r.y + 44, { size: 34, weight: 700, align: 'center', p: pp }); } }] });
    }
  });

  // Diagram fixtures: item texts are verbatim KB strings (slide scripts and video rótulos).
  var DIAGRAMS = [
    { tipo: 'flujo', items: [{ text: 'Capital' }, { text: 'Cómputo' }, { text: 'Modelos' }, { text: 'Productos' }] },
    { tipo: 'pasos', items: [{ text: 'Producto auténtico' }, { text: 'Bitácora de proceso' }, { text: 'Defensa oral' }, { text: 'Uso declarado de IA' }] },
    { tipo: 'causal', items: [{ text: 'Capital, datos, gestión' }, { text: 'Exposición a IA' }, { text: 'Ingreso por empleado' }, { text: 'asociación' }] },
    { tipo: 'columnas', items: [{ text: 'Uso malicioso', sign: 'anzuelo' }, { text: 'Fallos', sign: 'grieta' }, { text: 'Riesgos sistémicos', sign: 'red-pueblo' }] },
    { tipo: 'ciclo', items: [{ text: 'Inventario' }, { text: 'Clasificar riesgo' }, { text: 'Evaluar' }, { text: 'Supervisar' }, { text: 'Monitorear incidentes' }, { text: 'Corregir' }] },
    { tipo: 'semaforo', items: [{ text: 'evidencia insuficiente' }, { text: 'resultado de laboratorio' }, { text: 'apoyo al flujo de trabajo' }] },
    { tipo: 'linea', items: [{ text: '1 de agosto de 2024: entra en vigor' }, { text: '2 de febrero de 2025: prohibiciones y alfabetización en IA' },
      { text: '2 de agosto de 2025: obligaciones para modelos de propósito general' }] },
    { tipo: 'tarjetas', items: [{ text: 'Gobiernos' }, { text: 'Universidades' }, { text: 'Organizaciones' }] }
  ];

  // Drawer options: titles, the lamp's reach on pasos (luz), the causal enlace, barras.
  var DIAGRAMS_OPTS = [
    { tipo: 'flujo', titulo: 'No son lo mismo', items: [{ text: 'Exposición' }, { text: 'Automatización' }, { text: 'Desplazamiento' }] },
    { tipo: 'pasos', titulo: 'Dónde llega la luz', items: [{ text: 'Hipótesis', luz: 1 }, { text: 'Diseño', luz: 1 }, { text: 'Ejecución', luz: 0.5 },
      { text: 'Validación', luz: 0 }, { text: 'Interpretación', luz: 0 }] },
    { tipo: 'causal', enlace: 'asociación', items: [{ text: 'Capital, datos, gestión' }, { text: 'Exposición a IA' }, { text: 'Ingreso por empleado' }] },
    { tipo: 'barras', titulo: 'Modelos notables 2025', items: [{ text: 'EE. UU. 59', cifras: ['cap-10'], etiqueta: 'EE. UU.', valor: 59 },
      { text: 'China 35', cifras: ['cap-10'], etiqueta: 'China', valor: 35 }] }
  ];

  section('lamina', 4, function (ctx, o) {
    var lam = E.lamina;
    if (o.page === 1) { lam.render(ctx, 'd07', { t: o.t, still: q.still === '1' }); return; }
    if (o.page === 2) { lam.render(ctx, 'd06', { t: o.t, still: q.still === '1' }); return; }
    if (o.page === 4) {
      E.ink.background(ctx, 'personas', { seed: 'gallery-diagrams-opts' });
      var cellsO = [{ x: 40, y: 30, w: 580, h: 170 }, { x: 660, y: 30, w: 580, h: 190 }, { x: 40, y: 260, w: 580, h: 230 }, { x: 660, y: 280, w: 580, h: 150 }];
      DIAGRAMS_OPTS.forEach(function (d, i) {
        lam.diagram(ctx, d, cellsO[i], { p: o.p });
        devLabel(ctx, d.tipo, cellsO[i].x + 4, cellsO[i].y - 12, { align: 'left', size: 11 });
      });
      return;
    }
    E.ink.background(ctx, 'personas', { seed: 'gallery-diagrams' });
    var cells = [
      { x: 30, y: 20, w: 600, h: 130 }, { x: 650, y: 20, w: 600, h: 150 },
      { x: 30, y: 170, w: 600, h: 200 }, { x: 650, y: 190, w: 600, h: 150 },
      { x: 30, y: 400, w: 420, h: 300 }, { x: 470, y: 400, w: 330, h: 190 },
      { x: 820, y: 360, w: 440, h: 190 }, { x: 470, y: 600, w: 790, h: 100 }
    ];
    DIAGRAMS.forEach(function (d, i) {
      lam.diagram(ctx, d, cells[i], { p: o.p });
      devLabel(ctx, d.tipo, cells[i].x + 4, cells[i].y + 12, { align: 'left', size: 11 });
    });
  });

  section('people', 3, function (ctx, o) {
    var fig = E.figures, ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-people' });
    if (o.page === 1) {
      // La lectora in every pose, then at 80, 160 and 400 px tall.
      ['reading', 'writing', 'asking', 'pointing', 'catching', 'tying', 'lookingUp', 'walking'].forEach(function (pose, i) {
        fig.lectora(ctx, 80 + i * 92, 300, 2.2, { pose: pose, p: o.p });
        devLabel(ctx, pose, 80 + i * 92, 320, { size: 11 });
      });
      fig.lectora(ctx, 70, 700, 0.8, { pose: 'writing', p: o.p });
      fig.lectora(ctx, 180, 700, 1.6, { pose: 'asking', p: o.p, facing: -1 });
      fig.lectora(ctx, 1000, 712, 4, { pose: 'reading', p: o.p });
      return;
    }
    if (o.page === 2) {
      var roles = ['directiva', 'servidor', 'docente', 'investigadora', 'medica', 'desarrollador', 'estudiante', 'campesina'];
      var props = [null, 'folder', 'book', 'flask', 'clipboard', 'laptop', 'phone', null];
      var poses = ['presenting', 'standing', 'pointing', 'reading', 'writing', 'reading', 'walking', 'waving'];
      roles.forEach(function (role, i) {
        fig.person(ctx, 80 + i * 158, 330, 2.6, { role: role, seed: 'g' + role, pose: poses[i], prop: props[i], p: o.p });
        devLabel(ctx, role, 80 + i * 158, 350, { size: 11 });
      });
      for (var k = 0; k < 12; k++) fig.person(ctx, 60 + k * 100, 690, 1.5, { seed: 'crowd' + k, pose: fig.poses()[k % fig.poses().length], p: o.p });
      return;
    }
    fig.team(ctx, 330, 420, 1, { p: o.p });
    fig.students(ctx, 330, 690, 1.3, { p: o.p });
    fig.youngLadder(ctx, 980, 680, 1.4, { p: o.p });
  });

  // Places: six stages per page, each a 1280×720 stage drawn at one third.
  section('places', 3, function (ctx, o) {
    var fig = E.figures;
    if (o.page === 3) {
      E.ink.background(ctx, 'personas', { seed: 'road' });
      fig.road(ctx, 0, 0, 1, { p: o.p, signs: ['matraz', 'moneda', 'escalera', 'microscopio', 'volante', 'brujula'] });
      return;
    }
    ctx.fillStyle = '#d9d4c8';
    ctx.fillRect(0, 0, W, H);
    var list = o.page === 1
      ? [['oficina'], ['patio'], ['aula'], ['biblioteca'], ['laboratorio'], ['hospital']]
      : [['consultorio'], ['marNocturno'], ['cordillera'], ['river'], ['ciudad'], ['latam']];
    var cells = grid(6, 3, 0, 0, W, H);
    list.slice(0, 6).forEach(function (pl, i) {
      var c = cells[i], s = (c.w - 8) / 1280, x0 = c.x - c.w / 2 + 4, y0 = c.y - c.h / 2 + 4;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, 1280 * s, 720 * s); ctx.clip();
      var a = fig[pl[0]](ctx, x0, y0, s, { p: o.p, t: o.t, coins: true, seed: 'g' });
      if (pl[0] === 'marNocturno') fig.iceberg(ctx, x0 + 640 * s, a.horizon, 0.9 * s, { glow: 0.6 });
      ctx.restore();
      devLabel(ctx, pl[0], c.x, c.y + c.h / 2 - 6, { size: 12 });
    });
  });

  section('props', 2, function (ctx, o) {
    var fig = E.figures, ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-props' });
    if (o.page === 1) {
      fig.headline(ctx, 100, 90, 1, { seed: 'h1', p: o.p, rot: -0.1 });
      fig.sheet(ctx, 230, 90, 1, { p: o.p, rot: 0.3 });
      fig.coin(ctx, 330, 90, 1, { p: o.p });
      fig.coinPile(ctx, 430, 160, 1, { height: 120 });
      fig.coinPile(ctx, 500, 160, 1, { height: 40 });
      fig.bridge(ctx, 760, 110, 0.8, { built: 0.7, labels: { left: 'Uso', right: 'Valor' }, p: o.p });
      fig.suspensionBridge(ctx, 1110, 170, 0.5, { built: 0.55, p: o.p });
      fig.balance(ctx, 140, 520, 0.9, { tilt: 0.12, p: o.p });
      fig.hourglass(ctx, 330, 400, 0.8, { level: 0.35, p: o.p });
      fig.stopwatch(ctx, 450, 400, 0.8, { turn: 0.3, p: o.p });
      fig.telescope(ctx, 590, 520, 0.8, { p: o.p });
      fig.microscope(ctx, 730, 420, 0.8, { p: o.p });
      fig.trafficLight(ctx, 880, 700, 0.7, { lit: 'ambar', p: o.p });
      fig.steeringWheel(ctx, 1130, 450, 0.7, { turn: 0.2, p: o.p });
      fig.calendar(ctx, 350, 620, 0.8, { marked: 15, p: o.p });
      fig.lighthouse(ctx, 520, 710, 0.55, { beam: -0.3, p: o.p });
      return;
    }
    fig.stamp(ctx, 80, 120, 1, { p: o.p });
    fig.folder(ctx, 200, 100, 1, { p: o.p });
    fig.envelope(ctx, 340, 100, 1, { p: o.p });
    fig.key(ctx, 470, 100, 1, { p: o.p });
    fig.keyRing(ctx, 600, 120, 1, { p: o.p });
    fig.lock(ctx, 720, 100, 1, { p: o.p });
    fig.mailbox(ctx, 830, 200, 0.9, { p: o.p });
    fig.phone(ctx, 930, 100, 1, { p: o.p });
    fig.drawer(ctx, 1080, 120, 0.9, { cards: 3, p: o.p });
    fig.bucket(ctx, 1200, 120, 0.8, { p: o.p });
    fig.chain(ctx, 150, 290, 0.9, { p: o.p });
    fig.doorway(ctx, 360, 360, 0.9, { p: o.p });
    fig.roadSign(ctx, 480, 380, 0.8, { text: '2030', p: o.p });
    fig.lever(ctx, 600, 380, 0.9, { p: o.p });
    fig.steppingStones(ctx, 900, 330, 0.6, { n: 6, p: o.p });
    fig.boat(ctx, 220, 560, 0.8, { motor: true, passengers: 3, t: o.t, p: o.p });
    fig.net(ctx, 560, 560, 0.6, { p: o.p });
    fig.foldingDoc(ctx, 760, 430, 0.5, { n: 6, open: 0.8, p: o.p });
    fig.pennant(ctx, 1150, 560, 0.8, { pattern: 'cuadros', p: o.p });
    fig.bubble(ctx, 780, 560, 200, 110, { tail: { x: 760, y: 700 }, p: o.p });
    fig.bubble(ctx, 1010, 600, 160, 90, { thought: true, tail: { x: 990, y: 710 }, p: o.p });
    fig.flipCard(ctx, 1180, 380, 80, 110, { flip: 0.2, p: o.p });
    fig.plank(ctx, 1150, 300, 0.7, { p: o.p });
    fig.desk(ctx, 660, 715, 0.35, { p: o.p });
  });

  section('machine', 1, function (ctx, o) {
    var fig = E.figures, chart = E.chart, ink = E.ink;
    ink.background(ctx, 'personas', { seed: 'gallery-machine' });
    // Lamps at several sizes on a navy field, and one dimmed.
    fig.panel(ctx, 20, 20, 400, 200);
    fig.lamp(ctx, 90, 120, 1, { t: o.t, p: o.p });
    fig.lamp(ctx, 200, 120, 0.6, { t: o.t, p: o.p });
    fig.lamp(ctx, 280, 120, 0.3, { t: o.t, p: o.p });
    fig.lamp(ctx, 360, 120, 0.6, { t: o.t, p: o.p, dim: 0.8 });
    // Agent loop (V03 rótulos).
    fig.agentLoop(ctx, 440, 20, 0.78, { labels: ['Objetivo', 'Planificar', 'Usar herramientas', 'Ejecutar', 'Verificar'], returnTo: 1, at: 0.3, t: o.t, p: o.p });
    // Ruled ladder with rungs at exact heights (values parsed from the KB row of cap-1).
    var lo = chart.parseValue('~12%').value, hi = chart.parseValue('66,3%').value, ref = chart.parseValue('72,35%').value;
    fig.ruledLadder(ctx, 980, 300, 0.75, { max: 100, rungs: [{ value: lo }, { value: hi, crack: true }], ref: ref, lampAt: hi, t: o.t, p: o.p });
    fig.examPanel(ctx, 20, 250, 0.8, { checked: 3, t: o.t, p: o.p });
    fig.serverTower(ctx, 470, 560, 0.9, { p: o.p });
    fig.computeBlock(ctx, 560, 300, 0.75, { fraction: chart.parseValue('9,6%').value / 100, p: o.p });
    fig.computeBlock(ctx, 560, 420, 0.75, { fraction: chart.parseValue('22,6%').value / 100, p: o.p });
    fig.panel(ctx, 20, 500, 400, 210);
    ['puntos', 'rayas', 'estrellas'].forEach(function (pt, i) { fig.lampOnWheels(ctx, 90 + i * 120, 690, 0.8, { pattern: pt, t: o.t, p: o.p }); });
    fig.panel(ctx, 820, 330, 450, 380);
    fig.ruledSieve(ctx, 920, 440, 0.8, { t: o.t, p: o.p });
    fig.weightsBox(ctx, 1030, 380, 0.85, { lid: 'transparent', drawers: 2, p: o.p });
    fig.weightsBox(ctx, 850, 560, 0.7, { lid: 'closed', p: o.p });
  });

  section('tags', 1, function (ctx, o) {
    var ink = E.ink, tags = E.tags, L = E.palette.legend;
    ink.background(ctx, 'personas', { seed: 'gallery-tags' });
    // Source tags tied to big numbers (the number text here is a dev stand-in for a rótulo).
    var ids = ['adop-1', 'cap-3', 'adop-7', 'adop-8', 'trab-1', 'ries-2'];
    ids.forEach(function (id, i) {
      var x = 60 + (i % 3) * 410, y = 60 + Math.floor(i / 3) * 170;
      ctx.font = '900 40px "EIA Display"';
      ctx.fillStyle = E.palette.mundo.tinta;
      ctx.fillText(id, x, y + 40);
      tags.sourceTag(ctx, id, { near: { x: x + 4, y: y + 56, side: 'below', gap: 26 }, anchor: { x: x + 30, y: y + 50 }, p: o.p });
    });
    // Chips, full and monochrome, plus the neutral chip.
    L.tipos.forEach(function (t, i) {
      tags.chip(ctx, t.clase, t.label, { x: 50 + i * 238, y: 400, size: 16, pill: true, p: o.p });
      tags.chip(ctx, t.clase, t.label, { x: 50 + i * 238, y: 440, size: 16, mono: true, p: o.p });
    });
    tags.chip(ctx, 'neutral', 'Proyección/índice', { x: 1060, y: 470, size: 16, pill: true, p: o.p });
    // Estado signs.
    ['verificada', 'con-matiz', 'actualizacion', 'informe-base'].forEach(function (k, i) {
      tags.estadoSign(ctx, k, 80 + i * 60, 520, 40);
    });
    tags.illustrativeStamp(ctx, 330, 500, 1, o.p);
    tags.updateRibbon(ctx, 720, 505, 1, o.p);
    for (var n = 1; n <= 4; n++) tags.warningStamp(ctx, n, 80 + (n - 1) * 175, 640, 150, o.p);
    tags.marginNote(ctx, 'Benchmark', 'Prueba estandarizada para comparar sistemas en una tarea definida (texto de prueba).', 760, 570, 480, o.p);
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
  // Self-test (?test=1): writes PASS/FAIL lines into #results.

  function freshCanvas() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    return c;
  }
  function pixels(c) { return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data; }
  function sameImage(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function clearCaches() {
    if (E.ink.clearLayers) E.ink.clearLayers();
    if (E.figures.clearCache) E.figures.clearCache();
    if (E.lamina.reset) E.lamina.reset();
  }
  function isInk(d, i) { return d[i] < 70 && d[i + 1] < 70 && d[i + 2] < 70 && d[i + 3] > 200; }

  // Center of the run of ink pixels on row y between x0 and x1 (or null).
  function inkRunCenter(d, y, x0, x1) {
    var first = -1, last = -1;
    for (var x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, Math.ceil(x1)); x++) {
      var i = (Math.round(y) * W + x) * 4;
      if (isInk(d, i)) { if (first < 0) first = x; last = x; }
    }
    return first < 0 ? null : (first + last + 1) / 2;
  }

  function runs(d, y) {
    var outR = [], start = -1;
    for (var x = 0; x < W; x++) {
      var ink = isInk(d, (Math.round(y) * W + x) * 4);
      if (ink && start < 0) start = x;
      if (!ink && start >= 0) { outR.push(start + '-' + (x - 1)); start = -1; }
    }
    return outR.join(' ');
  }

  EIA.dev.runTests = function () {
    var out = [], pass = 0, fail = 0, errors = [];
    function log(ok, msg) { out.push((ok ? 'PASS ' : 'FAIL ') + msg); if (ok) pass++; else fail++; }
    function info(msg) { out.push('INFO ' + msg); }
    window.addEventListener('error', function (e) { errors.push(e.message); });
    var origError = console.error;
    console.error = function () { errors.push([].slice.call(arguments).join(' ')); origError.apply(console, arguments); };

    // 1–2. Every sheet renders without exceptions, and twice (caches cleared) to identical pixels.
    order.forEach(function (name) {
      for (var page = 1; page <= sections[name].pages; page++) {
        var label = name + (sections[name].pages > 1 ? ' p' + page : '');
        try {
          var a = freshCanvas(), b = freshCanvas();
          renderSection(a.getContext('2d'), name, { p: 1, t: 2.5, page: page });
          renderSection(a.getContext('2d'), name, { p: 0.5, t: 2.5, page: page });
          var pa = pixels(a);
          clearCaches();
          renderSection(b.getContext('2d'), name, { p: 1, t: 2.5, page: page });
          renderSection(b.getContext('2d'), name, { p: 0.5, t: 2.5, page: page });
          log(sameImage(pa, pixels(b)), 'determinism ' + label + ' (draw-on p=0.5 at t=2.5, caches cleared between renders)');
        } catch (err) {
          log(false, 'no exceptions ' + label + ': ' + (err && err.message));
        }
      }
    });

    // 3. Honest charts, measured in pixels on a blank canvas.
    var chart = E.chart, c = freshCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var X0 = 100, LEN = 500, BAR_H = 30, GAP = 40, TOP = 60;
    var geo = chart.bars(ctx, D7_ITEMS, { x: X0, y: TOP, len: LEN, h: BAR_H, gap: GAP, labels: false });
    var d = pixels(c);
    var base = inkRunCenter(d, TOP - 4, X0 - 10, X0 + 10);
    log(base != null && Math.abs(base - X0) <= 1, 'zero baseline at x=' + X0 + ' (measured ' + base + ')');
    geo.forEach(function (g, i) {
      var expected = chart.parseValue(D7_ITEMS[i].text).value / 100 * LEN;
      var midY = g.y0 + BAR_H / 2;
      var end = inkRunCenter(d, midY, X0 + expected - 6, X0 + expected + 6);
      var ok = end != null && Math.abs(end - (X0 + expected)) <= 1 && base != null && Math.abs((end - base) - expected) <= 1;
      var pi = (Math.round(midY) * W + Math.round(X0 + expected)) * 4;
      log(ok, 'bar ' + (i + 1) + ' "' + D7_ITEMS[i].text.slice(0, 18) + '…" end at ' + (end == null ? '?' : end.toFixed(1)) +
        ' px, expected ' + (X0 + expected).toFixed(1) + ' (length ' + expected.toFixed(1) + ' px ±1)' + (ok ? '' : ' rgb at expected: ' + d[pi] + ',' + d[pi + 1] + ',' + d[pi + 2] + ' y=' + midY + ' inkRuns: ' + runs(d, midY)));
    });
    log(geo[2].cap === 'approx', 'the "~1/3" bar carries the approximate (dotted, ≈) cap');

    // Unit grid: 23 of 100, and 3,3% of 1.000 = 33 lit dots, counted by sampling every dot center.
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var ug = chart.unitGrid(ctx, { x: 100, y: 300, w: 300, total: 100, value: 23, litColor: '#D7261E', seed: 't23' });
    var ug2 = chart.unitGrid(ctx, { x: 500, y: 300, w: 600, total: 1000, percent: chart.parseValue('3,3%').value, litColor: '#15120F', seed: 't33' });
    var dt = chart.dots(ctx, { x: 300, y: 620, count: 44, pitch: 15, seed: 't44' });
    d = pixels(c);
    function countAt(centers, test) {
      var n = 0;
      for (var k = 0; k < centers.length; k += 2) {
        var i = (Math.round(centers[k + 1]) * W + Math.round(centers[k])) * 4;
        if (test(d, i)) n++;
      }
      return n;
    }
    var red = function (dd, i) { return dd[i] > 150 && dd[i + 1] < 90 && dd[i + 2] < 90; };
    log(countAt(ug.centers, red) === 23, 'unit grid 100: ' + countAt(ug.centers, red) + ' lit dots counted, expected 23');
    log(countAt(ug2.centers, isInk) === 33, 'unit grid 1.000 for "3,3%": ' + countAt(ug2.centers, isInk) + ' lit dots counted, expected 33');
    log(countAt(dt.centers, isInk) === 44, 'dot count: ' + countAt(dt.centers, isInk) + ' dots counted, expected 44');

    // Gauge: the needle sits at the exact angle for 362 on a 0–400 dial (ghost at 233).
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var gv = chart.parseValue('362 (2025)').value, gg = chart.gauge(ctx, { x: 640, y: 360, r: 150, max: 400, value: gv, ticks: 0 });
    d = pixels(c);
    var expectA = Math.PI * 5 / 6 + gv / 400 * Math.PI * 4 / 3, hits = 0;
    for (var rr = 20; rr <= 90; rr += 10) {
      var px = 640 + Math.cos(expectA) * rr, py = 360 + Math.sin(expectA) * rr;
      if (isInk(d, (Math.round(py) * W + Math.round(px)) * 4)) hits++;
    }
    log(Math.abs(gg.angle - expectA) < 1e-9 && hits === 8, 'gauge needle at ' + ((gg.angle * 180 / Math.PI) % 360).toFixed(2) + '° for 362/400 (' + hits + '/8 samples on the needle body)');

    // Funnel, timeline, ruled ladder and compute block: exact geometry.
    var fun = chart.funnel(ctx, { x: 0, y: 0, w: 400, items: D7_ITEMS, labels: false, tags: false });
    var funOk = fun.every(function (g, i) { return Math.abs((g.x1 - g.x0) - chart.parseValue(D7_ITEMS[i].text).value / 100 * 400) < 1e-6; });
    log(funOk, 'funnel bar widths exactly proportional on one zero-based scale');
    var pins = chart.geom.timeline({ x: 0, w: 1000, from: '1 de enero de 2024', to: '1 de enero de 2029', items: [{ text: '1 de agosto de 2024' }, { text: '2 de agosto de 2025' }, { text: '2 de agosto de 2028' }] });
    var dd1 = chart.parseDate('1 de agosto de 2024'), dd2 = chart.parseDate('2 de agosto de 2025'), dd3 = chart.parseDate('2 de agosto de 2028');
    log(Math.abs((pins[1].x - pins[0].x) / (pins[2].x - pins[0].x) - (dd2 - dd1) / (dd3 - dd1)) < 1e-9, 'timeline pins proportional to dates');
    var pdA = chart.parseDate('Ago 2027: plazo para los modelos previos a agosto de 2025'), pdB = chart.parseDate('sept. 2026');
    log(pdA === Date.UTC(2027, 7, 1) / 864e5 && pdB === Date.UTC(2026, 8, 1) / 864e5, 'parseDate reads the leading date and short months («Ago 2027: … agosto de 2025» -> 2027-08-01)');
    var lad = E.figures.ruledLadder(ctx, 200, 600, 1, { max: 100, h: 360, rungs: [{ value: 12 }, { value: 66.3 }], panel: false });
    log(Math.abs(lad.rungs[1] - (600 - 0.663 * 360)) < 1e-9, 'ruled ladder rung for 66,3 at exact height');
    var cb = E.figures.computeBlock(ctx, 0, 0, 1, { fraction: 0.096 });
    log(Math.abs(cb.litW - 0.096 * cb.w) < 1e-9, 'compute block lit slice exactly 9,6% of the block');

    // 4. Parsing Spanish figures from data strings.
    [['66,3%', 66.3, null, '%'], ['344.700 millones de dólares', 344700, null, ''], ['~1/3 escala', 100 / 3, 'approx', '%'], ['Hasta −83% de tiempo', -83, 'max', '%'],
      ['+14–15%', 15, 'range', '%'], ['<20%', 20, 'less', '%'], ['Más de 90% (91,2%)', 90, 'more', '%'], ['−18%', -18, null, '%'], ['1.993 participantes', 1993, null, ''],
      ['29,6 GW', 29.6, null, 'GW'], ['23×', 23, null, '×']].forEach(function (cse) {
      var pv = chart.parseValue(cse[0]);
      var ok = pv && Math.abs(pv.value - cse[1]) < 1e-9 && pv.unit === cse[3] &&
        (cse[2] === null ? !pv.approx && !pv.bound : cse[2] === 'approx' ? pv.approx : cse[2] === 'range' ? pv.lo === 14 && pv.hi === 15 : pv.bound === cse[2]);
      log(!!ok, 'parseValue("' + cse[0] + '") -> ' + (pv ? pv.value + (pv.unit ? ' ' + pv.unit : '') + (pv.approx ? ' ≈' : '') + (pv.bound ? ' ' + pv.bound : '') : 'null'));
    });

    // 4b. Source tags: every source of several figures; long labels wrap inside maxWidth.
    var tgM = E.tags.sourceTag(ctx, ['ries-4', 'ctx-ley-vigor'], { x: 0, y: 0, p: 0 });
    log(!!tgM && tgM.label === 'AI Act Service Desk · EUR-Lex · ' + EIA.cifra('ctx-ley-vigor').fuentesList[0].etiqueta,
      'multi-id sourceTag shows every source once: «' + (tgM && tgM.label) + '»');
    var tgW = E.tags.sourceTag(ctx, ['ries-4', 'ctx-ley-vigor'], { x: 0, y: 0, p: 0, maxWidth: 200, scope: false });
    log(!!tgW && tgW.w <= 200 + 1e-6 && tgW.lines.length > 1, 'long source label wraps inside maxWidth 200 (w ' + (tgW && tgW.w.toFixed(1)) + ', ' + (tgW && tgW.lines.length) + ' lines)');

    log(E.lamina.diagramTypes().indexOf('barras') >= 0, 'lamina.diagram knows barras');

    // 5. Legend rules: the five evidence colors belong only to the evidence types.
    var ev = E.palette.evidencia, decorUsesEv = E.palette.decor.some(function (col) { return Object.keys(ev).some(function (k) { return ev[k] === col; }); });
    log(!decorUsesEv, 'decorative palette excludes the five evidence colors');

    // 6. Frame time (informational; software rendering in headless is slower than a GPU).
    var pc = freshCanvas().getContext('2d'), t0 = performance.now(), N = 12;
    for (var f = 0; f < N; f++) E.lamina.render(pc, 'd07', { t: f / 24 });
    var lam = (performance.now() - t0) / N;
    t0 = performance.now();
    for (f = 0; f < N; f++) renderSection(pc, 'people', { p: 1, t: f / 24, page: 2 });
    var ppl = (performance.now() - t0) / N;
    info('frame time: lámina d07 ' + lam.toFixed(1) + ' ms, people sheet (20 people) ' + ppl.toFixed(1) + ' ms (24 fps budget 41.7 ms)');
    log(lam < 41.7, 'lámina d07 renders within the 24 fps frame budget (' + lam.toFixed(1) + ' ms)');

    // 7. mountRender (index.html?lamina=<id> code path) last, because it replaces the page body.
    var summaryLines = out.slice();
    E.lamina.mountRender('d07', {}).then(function () {
      var cv = document.querySelector('canvas'), k2 = cv.getContext('2d', { willReadFrequently: true });
      window.renderFrame(3.25);
      var A = k2.getImageData(0, 0, cv.width, cv.height).data;
      window.renderFrame(0.5);
      window.renderFrame(3.25);
      var B = k2.getImageData(0, 0, cv.width, cv.height).data;
      var ok = sameImage(A, B) && typeof window.renderFrame === 'function';
      summaryLines.push((ok ? 'PASS ' : 'FAIL ') + 'mountRender d07: renderReady resolved, renderFrame(3.25) deterministic');
      if (ok) pass++; else fail++;
      if (errors.length) { summaryLines.push('FAIL no exceptions: ' + errors.join(' | ')); fail++; }
      else { summaryLines.push('PASS no exceptions or console errors during the run'); pass++; }
      summaryLines.push('SUMMARY ' + pass + ' passed, ' + fail + ' failed');
      var pre = document.createElement('pre');
      pre.id = 'results';
      pre.textContent = summaryLines.join('\n');
      document.body.appendChild(pre);
      document.title = fail ? 'TEST FAIL' : 'TEST PASS';
    });
  };

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

  // ?mount=<id>: the same code path as index.html?lamina=<id> (bare canvas, renderFrame, renderReady),
  // fed by the fixture deck while the real js/data/deck.js is a stub.
  if (q.mount) {
    E.lamina.mountRender(q.mount, q).then(function () { document.title = 'READY ' + q.mount; });
    return;
  }

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
