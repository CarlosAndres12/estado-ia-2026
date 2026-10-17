/* Estado de la IA 2026 — page decorations in the Miró-notebook language (prompt §3.11).
 *
 * Every decoration of the page is drawn ONCE with the engine at boot and published as a CSS custom
 * property holding a canvas.toDataURL() image, so the stylesheets can reuse it as a background:
 *
 *   --grain                 paper grain tile (body background)
 *   --frame-1…3, --frame-thin, --frame-dashed, --frame-noche
 *                           9-slice paper-card frames: thick irregular brush outline + papel fill
 *                           (border-image: var(--frame-1) 56 fill / 28px stretch)
 *   --peek-{rojo|amarillo|azul|verde|tinta}   flat biomorphic shapes peeking from behind a card corner
 *   --underline-1…2, --divider, --strike     calligraphic underlines, divider, the correction stroke
 *   --sign-<name>, --sign-<name>-mono        floating Miró signs (decor colors / black only)
 *   --chip-<clase>, --chip-<clase>-mono      evidence signs (type color / tinta), neutral and ilustrativo
 *   --estado-<key>                           estado signs (sello-visto, asterisco, luna, libro)
 *   --sesion-<n>                             session signs 1–7 (iceberg … faro)
 *   --adv-<n>                                the four warning stamps (signs only; the page writes the text)
 *   --exito, --casi                          feedback signs (bursting star, gentle spiral) for the tools
 *
 * The html element gets class "has-decor" once the images exist; the CSS keeps plain fallbacks
 * (solid outlines, no signs) until then, and when the engine is missing.
 *
 *   EIA.ui.decor.init()                     draws everything (idempotent)
 *   EIA.ui.decor.url(name)                  the data URL of one image ('' when missing)
 *   EIA.ui.decor.fontsReady()               Promise: the canvas fonts are loaded
 *   EIA.ui.decor.letterOn(el, text, opts)   brush lettering on a canvas inside el that writes itself on
 *                                           when it scrolls into view (a still frame with reduced motion)
 *     opts: size (52), minSize (28), maxLines (3), color, align ('left' | 'center'), seed, underline,
 *           duration (s). Returns { canvas, play(), draw(p), destroy() }. The canvas is aria-hidden:
 *           the caller keeps the same text in the DOM for assistive technology.
 *   EIA.ui.decor.signCanvas(name, size, opts) -> a small canvas with one sign (for inline UI) */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  var urls = {};
  var ready = false;
  var SCALE = 2;

  function E() { return EIA.engine || {}; }
  function M() { return E().palette.mundo; }
  function warn(msg, err) { if (root.console) root.console.warn('[decor] ' + msg + (err && err.message ? ': ' + err.message : '')); }

  function paint(name, w, h, fn, scale) {
    var k = scale || SCALE;
    try {
      var c = doc.createElement('canvas');
      c.width = Math.ceil(w * k);
      c.height = Math.ceil(h * k);
      var ctx = c.getContext('2d');
      ctx.setTransform(k, 0, 0, k, 0, 0);
      fn(ctx, w, h);
      urls[name] = c.toDataURL('image/png');
    } catch (err) {
      warn('could not draw ' + name, err);
      urls[name] = '';
    }
    return urls[name];
  }

  function cssUrl(u) { return u ? 'url("' + u + '")' : 'none'; }

  // ---------------------------------------------------------------------------------------------
  // The images

  var PAPEL = '#FBF7EE';

  function frames() {
    var ink = E().ink;
    ['1', '2', '3'].forEach(function (v, i) {
      paint('frame-' + v, 120, 120, function (ctx) {
        ink.card(ctx, 3, 3, 114, 114, { seed: 'page-frame-' + v, weight: 3.6 + i * 0.3, radius: 13 + i * 2, fill: PAPEL, grain: false });
      });
    });
    paint('frame-thin', 120, 120, function (ctx) {
      ink.card(ctx, 2.5, 2.5, 115, 115, { seed: 'page-frame-thin', weight: 2.4, radius: 11, fill: PAPEL, grain: false });
    });
    paint('frame-dashed', 120, 120, function (ctx) {
      ink.card(ctx, 3, 3, 114, 114, { seed: 'page-frame-dashed', weight: 2.8, radius: 12, fill: PAPEL, grain: false, dashed: true, dash: 13, gap: 8 });
    });
    paint('frame-noche', 120, 120, function (ctx) {
      ink.card(ctx, 3, 3, 114, 114, { seed: 'page-frame-noche', weight: 3.4, radius: 14, fill: E().palette.maquina.noche, outline: M().lienzo, grain: false });
    });
  }

  function peeks() {
    var ink = E().ink, m = M();
    var colors = { rojo: m.rojo, amarillo: m.amarillo, azul: m.azul, verde: m.verde, tinta: m.tinta };
    Object.keys(colors).forEach(function (k, i) {
      paint('peek-' + k, 120, 120, function (ctx) {
        ink.blob(ctx, 60, 60, 46 - i, 38 + i, { fill: colors[k], line: false, seed: 'peek-' + k, irr: 0.24, n: 9, rot: i * 0.7 });
      });
    });
  }

  function strokes() {
    var ink = E().ink;
    paint('underline-1', 480, 30, function (ctx) {
      ink.line(ctx, ink.wavePoints(6, 15, 452, 3.2, 170, 0.6), { w: 5.2, profile: 'lift', dot: 'detached', seed: 'page-underline-1' });
    });
    paint('underline-2', 480, 30, function (ctx) {
      ink.line(ctx, ink.wavePoints(6, 16, 456, 4, 120, 2.1), { w: 4.4, profile: 'swell', dot: true, seed: 'page-underline-2', second: true });
    });
    paint('divider', 960, 40, function (ctx) {
      ink.line(ctx, ink.wavePoints(10, 22, 900, 5, 260, 1.2), { w: 3.6, profile: 'swell', dot: 'detached', seed: 'page-divider' });
      E().figures.sign(ctx, 'estrella', 934, 18, 30, { seed: 'divider-star', mono: true });
    });
    paint('strike', 600, 60, function (ctx) {
      ink.line(ctx, [6, 44, 160, 36, 320, 30, 470, 22, 594, 14], { w: 4.6, profile: 'swell', seed: 'page-strike' });
    });
    paint('rule', 960, 16, function (ctx) {
      ink.line(ctx, [4, 9, 320, 7, 640, 10, 956, 7], { w: 3, profile: 'even', seed: 'page-rule' });
    });
  }

  var DECOR_SIGNS = ['estrella', 'luna', 'sol', 'pajaro', 'espiral', 'cometa', 'constelacion', 'puntos', 'salpicadura', 'mancha', 'escalera', 'cabellos', 'lapiz', 'libreta'];

  function signs() {
    var fig = E().figures;
    DECOR_SIGNS.forEach(function (name) {
      paint('sign-' + name, 96, 96, function (ctx) { fig.sign(ctx, name, 48, 48, 80, { seed: 'page-' + name }); });
      paint('sign-' + name + '-mono', 96, 96, function (ctx) { fig.sign(ctx, name, 48, 48, 80, { seed: 'page-' + name, mono: true }); });
    });
    paint('exito', 96, 96, function (ctx) { fig.sign(ctx, 'estrella-exito', 48, 48, 86, { seed: 'page-exito' }); });
    paint('casi', 96, 96, function (ctx) { fig.sign(ctx, 'espiral', 48, 48, 74, { seed: 'page-casi', mono: true }); });
  }

  function legend() {
    var fig = E().figures, tags = E().tags, L = E().palette.legend;
    L.tipos.forEach(function (t) {
      paint('chip-' + t.clase, 64, 64, function (ctx) { fig.sign(ctx, t.sign, 32, 32, 58, { seed: 'chip', colors: { a: t.color } }); });
      paint('chip-' + t.clase + '-mono', 64, 64, function (ctx) { fig.sign(ctx, t.sign, 32, 32, 58, { seed: 'chip', mono: true }); });
    });
    paint('chip-neutral', 64, 64, function (ctx) { fig.sign(ctx, L.neutral.sign, 32, 32, 34, { seed: 'chip', mono: true }); });
    paint('chip-ilustrativo', 64, 64, function (ctx) { fig.sign(ctx, L.ilustrativo.sign, 32, 32, 56, { seed: 'ilus', mono: true }); });
    Object.keys(L.estados).forEach(function (k) {
      paint('estado-' + k, 64, 64, function (ctx) { tags.estadoSign(ctx, k, 32, 32, 54); });
    });
    Object.keys(L.sesiones).forEach(function (n) {
      paint('sesion-' + n, 96, 96, function (ctx) { fig.sign(ctx, L.sesiones[n].sign, 48, 48, 88, { seed: 'sesion-' + n }); });
      paint('sesion-' + n + '-mono', 96, 96, function (ctx) { fig.sign(ctx, L.sesiones[n].sign, 48, 48, 88, { seed: 'sesion-' + n, mono: true }); });
    });
    L.advertencias.forEach(function (a) {
      paint('adv-' + a.n, 112, 112, function (ctx) { tags.warningStamp(ctx, a.n, 56, 56, 104, 1, { text: false, number: false, rot: -0.06 }); });
    });
  }

  function grain() {
    var ink = E().ink;
    paint('grain', 220, 220, function (ctx, w, h) { ink.grain(ctx, 0, 0, w, h, { alpha: 0.9 }); }, 1);
  }

  function publish() {
    var style = doc.documentElement.style;
    Object.keys(urls).forEach(function (k) { if (urls[k]) style.setProperty('--' + k, cssUrl(urls[k])); });
  }

  function init() {
    if (ready) return true;
    var e = E();
    if (!doc || !e.ink || !e.figures || !e.tags || !e.palette) { warn('engine not available; plain decorations'); return false; }
    var steps = [grain, frames, peeks, strokes, legend, signs];
    steps.forEach(function (fn) {
      try { fn(); } catch (err) { warn('step failed', err); }
    });
    publish();
    ready = true;
    doc.documentElement.classList.add('has-decor');
    return true;
  }

  // ---------------------------------------------------------------------------------------------
  // Fonts

  var fontsPromise = null;
  function fontsReady() {
    if (fontsPromise) return fontsPromise;
    var lam = E().lamina;
    var p = lam && lam.fontsReady ? lam.fontsReady() : (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve());
    fontsPromise = Promise.resolve(p).then(function () {}, function () {});
    return fontsPromise;
  }

  // ---------------------------------------------------------------------------------------------
  // Brush lettering that writes itself on

  function reducedMotion() {
    try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) { return false; }
  }

  function letterOn(el, text, o) {
    o = o || {};
    var ink = E().ink;
    var canvas = doc.createElement('canvas');
    canvas.className = 'lettering';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    var st = { p: 0, played: false, raf: 0, w: 0, layout: null, destroyed: false };
    if (!ink || !ink.letter) { canvas.remove(); return { canvas: null, play: function () {}, draw: function () {}, destroy: function () {} }; }

    function opts(width) {
      return {
        size: o.size || 52, minSize: o.minSize || 28, maxWidth: Math.max(80, width - 8), maxLines: o.maxLines || 3,
        fit: true, seed: o.seed || text, align: o.align || 'left', underline: o.underline !== false,
        color: o.color, counters: o.counters
      };
    }
    function layout() {
      var w = Math.max(120, Math.floor(el.clientWidth || 0));
      var ctx = canvas.getContext('2d');
      var L = ink.measureLetter(ctx, text, opts(w));
      st.w = w;
      st.layout = L;
      var hh = Math.ceil(L.h + 10);
      var k = Math.min(2, root.devicePixelRatio || 1);
      canvas.width = Math.ceil(w * k);
      canvas.height = Math.ceil(hh * k);
      canvas.style.width = w + 'px';
      canvas.style.height = hh + 'px';
      st.k = k;
      st.hh = hh;
    }
    function draw(p) {
      if (st.destroyed) return;
      st.p = p;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(st.k, 0, 0, st.k, 0, 0);
      var x = (o.align === 'center') ? st.w / 2 : 4;
      ink.letter(ctx, text, x, 2, Object.assign(opts(st.w), { p: p }));
    }
    function play() {
      if (st.played || st.destroyed) return;
      st.played = true;
      if (reducedMotion()) { draw(1); return; }
      var dur = (o.duration || Math.min(3.6, Math.max(1.4, text.length * 0.045))) * 1000;
      var t0 = 0;
      function frame(ts) {
        if (st.destroyed) return;
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        draw(p);
        if (p < 1) st.raf = root.requestAnimationFrame(frame);
      }
      st.raf = root.requestAnimationFrame(frame);
    }

    var io = null, ro = null;
    fontsReady().then(function () {
      if (st.destroyed) return;
      layout();
      draw(0);
      if (typeof root.IntersectionObserver === 'function' && !reducedMotion()) {
        io = new root.IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { play(); io.disconnect(); } });
        }, { threshold: 0.4 });
        io.observe(canvas);
      } else {
        st.played = true;
        draw(1);
      }
      if (typeof root.ResizeObserver === 'function') {
        ro = new root.ResizeObserver(function () {
          var w = Math.floor(el.clientWidth || 0);
          if (!w || Math.abs(w - st.w) < 2) return;
          layout();
          draw(st.played ? 1 : st.p);
        });
        ro.observe(el);
      }
    });

    return {
      canvas: canvas,
      play: play,
      draw: draw,
      destroy: function () {
        st.destroyed = true;
        if (st.raf) root.cancelAnimationFrame(st.raf);
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        canvas.remove();
      }
    };
  }

  function signCanvas(name, size, o) {
    o = o || {};
    var c = doc.createElement('canvas');
    var k = Math.min(2, root.devicePixelRatio || 1);
    c.width = Math.ceil(size * k);
    c.height = Math.ceil(size * k);
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.setAttribute('aria-hidden', 'true');
    c.className = 'sign-canvas' + (o.className ? ' ' + o.className : '');
    try {
      var ctx = c.getContext('2d');
      ctx.setTransform(k, 0, 0, k, 0, 0);
      E().figures.sign(ctx, name, size / 2, size / 2, size * 0.9, { seed: o.seed || ('page-' + name), mono: o.mono, colors: o.colors });
    } catch (err) { warn('sign ' + name, err); }
    return c;
  }

  ui.decor = {
    init: init,
    url: function (name) { return urls[name] || ''; },
    ready: function () { return ready; },
    fontsReady: fontsReady,
    letterOn: letterOn,
    signCanvas: signCanvas,
    PAPEL: PAPEL
  };
})(typeof window !== 'undefined' ? window : globalThis);
