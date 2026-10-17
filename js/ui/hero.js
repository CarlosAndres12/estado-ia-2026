/* Estado de la IA 2026 — the #inicio hero background (prompt §9.2): a silent 20 s canvas loop, not a
 * video. A night sea in ultramarine with calligraphic waves, a crescent moon and irregular stars; a
 * Miró iceberg whose luminous tip, lit by a tiny AI lamp, carries "88% de organizaciones usa IA" with
 * its source tag (adop-1); the waterline, one calligraphic line, slowly sinks to reveal the submerged
 * mass with "Escala · Valor · Gobernanza" in chalk-white calligraphy, then rises again; a bird crosses.
 * With prefers-reduced-motion: a still frame with the waterline halfway, and no loop.
 *
 *   var hero = EIA.ui.hero.mount(container)  -> { el, setActive(on), destroy() }
 *   frame(ctx, t)                             draws the 1280×720 frame at time t (pure function of t)
 * The loop runs only while the hero is on screen, the page is visible, the route is #inicio and the
 * viewer has not paused it ("Pausar la animación", WCAG 2.2.2). Copy: EIA.data.course.hero.rotulos and
 * EIA.data.course.ui.page.hero. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  var W = 1280, H = 720, LOOP = 20, FPS = 24;
  var TOP = 300, DEEP = 612;          // waterline: at the surface and at its deepest
  var CX = 846;                        // iceberg center
  var STARS = [[118, 84, 40], [296, 160, 30], [522, 66, 46], [652, 226, 28], [1004, 52, 34], [1236, 262, 30], [70, 250, 26], [430, 250, 22]];

  function E() { return EIA.engine; }
  function M() { return E().palette.mundo; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  // Waterline depth 0 (surface) → 1 (deepest) over the loop: hold, sink, hold, rise, hold.
  function depth(t) {
    var u = ((t % LOOP) + LOOP) % LOOP;
    if (u < 2) return 0;
    if (u < 9) return smooth((u - 2) / 7);
    if (u < 13) return 1;
    if (u < 19) return 1 - smooth((u - 13) / 6);
    return 0;
  }

  var geo = null;
  function geometry() {
    if (geo) return geo;
    var ink = E().ink, m = M(), pal = E().palette;
    var b = ink.drawing('hero:mass', { w: 4.4, jitter: 0.9 });
    b.shape([-262, 4, -244, 96, -196, 196, -108, 272, 6, 306, 128, 280, 216, 206, 266, 104, 276, 4], { fill: '@mass', w: 4.6 });
    b.shape([-150, 120, -110, 86, -62, 104, -58, 150, -104, 170, -146, 158], { fill: '@deep', w: 2.6 });
    b.shape([116, 192, 150, 168, 186, 186, 176, 222, 138, 230], { fill: '@red', w: 2.4 });
    b.stroke([-20, 240, 24, 222, 70, 238, 112, 226], { w: 2.4, profile: 'hair' });
    var mass = b.done({ colors: { mass: pal.mix(m.celeste, m.azul, 0.32), deep: m.azul, red: m.rojo } });
    var tb = ink.drawing('hero:tip', { w: 4.2, jitter: 0.8 });
    tb.shape([-112, 4, -86, -54, -52, -112, -16, -164, 18, -138, 48, -92, 82, -46, 116, 4], { fill: '@tip', w: 4.6 });
    tb.shape([-34, -96, -12, -132, 6, -112, -10, -84], { fill: '@glint', w: 2 });
    tb.stroke([-2, -150, 20, -104, 30, -60], { w: 2, profile: 'hair', color: m.celeste });
    var tip = tb.done({ colors: { tip: m.lienzo, glint: m.amarillo } });
    geo = {
      mass: mass,
      tip: tip,
      wave: ink.wavePoints(-20, 0, W + 20, 6, 150, 0.4),
      birdPath: function (t) {
        var u = clamp((t % LOOP - 3) / 9, 0, 1);
        return { x: -90 + u * (W + 180), y: 228 - Math.sin(u * Math.PI) * 70 + Math.sin(t * 3.1) * 6, on: u > 0 && u < 1, flap: Math.sin(t * 7) };
      }
    };
    return geo;
  }

  function frame(ctx, t, still) {
    var e = E(), ink = e.ink, fig = e.figures, m = M();
    var g = geometry();
    var d = still ? 0.5 : depth(t);
    var wy = TOP + (DEEP - TOP) * d;
    var copy = (EIA.data.course && EIA.data.course.hero && EIA.data.course.hero.rotulos) || {};

    // Night sea and sky.
    fig.marNocturno(ctx, 0, 0, 1, { horizon: TOP / H, t: still ? 0 : t, moon: false, stars: 0, seed: 'hero' });
    fig.sign(ctx, 'luna', 1172, 96, 96, { seed: 'hero-moon' });
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i], tw = still ? 1 : 0.86 + 0.14 * Math.sin(t * 1.25 + i * 1.9);
      fig.sign(ctx, 'estrella', s[0], s[1], s[2] * tw, { seed: 'hero-star' + i, colors: { a: m.rojo, ink: i % 3 ? m.amarillo : m.lienzo } });
    }

    // The submerged mass: a faint hint under the water, in full color above the sinking waterline.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, wy, W, H - wy);
    ctx.clip();
    ink.draw(ctx, g.mass, CX, TOP, 1, { alpha: 0.2 });
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, wy);
    ctx.clip();
    ink.draw(ctx, g.mass, CX, TOP, 1, {});
    if (copy.masa) {
      ink.letter(ctx, copy.masa.text, CX + 6, TOP + 112, {
        size: 40, maxWidth: 430, maxLines: 2, fit: true, minSize: 26, align: 'center', color: m.lienzo,
        counters: 0, stars: false, underline: false, seed: 'hero-masa'
      });
    }
    ctx.restore();

    // The luminous tip and the tiny lamp that lights it.
    ink.glow(ctx, CX - 12, TOP - 82, 150, m.amarillo, 0.32);
    ink.draw(ctx, g.tip, CX, TOP, 1, {});
    fig.lamp(ctx, CX - 108, TOP - 182, 0.34, { t: still ? 0 : t, glow: 1 });

    // The waterline: one calligraphic line (cached geometry, moved with the transform).
    ctx.save();
    ctx.translate(0, wy);
    ink.line(ctx, g.wave, { w: 4.6, profile: 'swell', seed: 'hero-waterline', color: m.lienzo });
    ctx.restore();

    // The tip's figure and its source tag.
    if (copy.punta) {
      var lay = ink.text(ctx, copy.punta.text, CX + 70, TOP - 196, { size: 27, weight: 700, color: m.lienzo, maxWidth: 300, maxLines: 2 });
      var ty = TOP - 196 + ((lay && lay.h) || 34);
      e.tags.sourceTag(ctx, copy.punta.cifras || 'adop-1', { x: CX + 74, y: ty + 14, scale: 0.82, anchor: { x: CX + 46, y: TOP - 150 } });
    }

    // A bird crosses.
    if (!still) {
      var bp = g.birdPath(t);
      if (bp.on) fig.sign(ctx, 'pajaro', bp.x, bp.y, 64, { seed: 'hero-bird', rot: bp.flap * 0.08 });
    }
  }

  function mount(container) {
    var h = ui.h, t = ui.t;
    var canvas = h('canvas', { class: 'hero__canvas', role: 'img' });
    var rot = (EIA.data.course.hero && EIA.data.course.hero.rotulos) || {};
    canvas.setAttribute('aria-label', t('page.hero.lienzo', { punta: rot.punta ? rot.punta.text : '', masa: rot.masa ? rot.masa.text : '' }));
    var pauseBtn = h('button', { type: 'button', class: 'hero__pause btn btn--small btn--night', 'aria-pressed': 'false', text: t('page.hero.pausar') });
    var box = h('div', { class: 'hero__art' }, [canvas, pauseBtn]);
    container.appendChild(box);

    var st = { active: true, visible: true, paused: false, raf: 0, clock: 0, last: 0, drawnAt: -1, ready: false, w: 0, h: 0, k: 1, destroyed: false };
    var ctx = canvas.getContext('2d');

    function still() { return ui.reducedMotion(); }

    function size() {
      var w = Math.max(1, box.clientWidth), hh = Math.max(1, box.clientHeight);
      var k = Math.min(2, root.devicePixelRatio || 1);
      if (w * k > 1920) k = 1920 / w;
      st.w = w; st.h = hh; st.k = k;
      canvas.width = Math.round(w * k);
      canvas.height = Math.round(hh * k);
    }

    function draw() {
      if (!st.ready || st.destroyed) return;
      var bw = canvas.width, bh = canvas.height;
      var s = Math.max(bw / W, bh / H);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = E().palette.maquina.noche;
      ctx.fillRect(0, 0, bw, bh);
      ctx.setTransform(s, 0, 0, s, (bw - W * s) / 2, (bh - H * s) / 2);
      try { frame(ctx, st.clock, still()); } catch (err) {
        st.ready = false;
        if (root.console) root.console.warn('[hero] ' + (err && err.message));
      }
    }

    function running() { return st.ready && st.active && st.visible && !st.paused && !still() && !doc.hidden; }

    function tick(ts) {
      st.raf = 0;
      if (!running()) { st.last = 0; return; }
      if (st.last) st.clock += Math.min(0.1, (ts - st.last) / 1000);
      st.last = ts;
      if (ts - st.drawnAt >= 1000 / FPS - 2) { st.drawnAt = ts; draw(); }
      st.raf = root.requestAnimationFrame(tick);
    }

    function sync() {
      pauseBtn.hidden = still();
      if (running()) { if (!st.raf) { st.last = 0; st.raf = root.requestAnimationFrame(tick); } }
      else if (st.raf) { root.cancelAnimationFrame(st.raf); st.raf = 0; }
    }

    pauseBtn.addEventListener('click', function () {
      st.paused = !st.paused;
      pauseBtn.setAttribute('aria-pressed', st.paused ? 'true' : 'false');
      pauseBtn.textContent = st.paused ? t('page.hero.reanudar') : t('page.hero.pausar');
      sync();
    });

    var io = null, ro = null, mq = null;
    if (typeof root.IntersectionObserver === 'function') {
      io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (en) { st.visible = en.isIntersecting; });
        sync();
      });
      io.observe(box);
    }
    if (typeof root.ResizeObserver === 'function') {
      ro = new root.ResizeObserver(function () { size(); draw(); });
      ro.observe(box);
    }
    function onVisibility() { sync(); }
    doc.addEventListener('visibilitychange', onVisibility);
    try {
      mq = root.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.addEventListener) mq.addEventListener('change', function () { draw(); sync(); });
    } catch (err) { mq = null; }

    size();
    ui.decor.fontsReady().then(function () {
      if (st.destroyed) return;
      st.ready = true;
      size();
      draw();
      sync();
    });

    return {
      el: box,
      setActive: function (on) { st.active = !!on; sync(); },
      destroy: function () {
        st.destroyed = true;
        if (st.raf) root.cancelAnimationFrame(st.raf);
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        doc.removeEventListener('visibilitychange', onVisibility);
        box.remove();
      }
    };
  }

  ui.hero = { mount: mount, frame: frame, depth: depth, LOOP: LOOP };
})(typeof window !== 'undefined' ? window : globalThis);
