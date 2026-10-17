/* js/laminas/d17.js — D17 «Cinco mensajes para decidir» (prompt §12.2; KB §10, "Guion de
 * diapositivas" and contenido 9).
 *
 * Left: the five cards of diagrama (tarjetas), stacked, each with its sign (items[].signo:
 * cordillera, iceberg, escalera sin primer peldaño, lancha con brújula, volante) and its text,
 * verbatim from KB §10 contenido 9. The second card's figures («88% de uso frente a 39% con impacto
 * en EBIT») carry one tag built from both of its cifras (adop-1, adop-5: one source, one type),
 * hanging right of the card with a thread to each line that holds a figure; the parenthetical that
 * holds them starts its own line so the threads leave from the ends of those lines.
 *
 * Right: the KB metaphor («brújula sobre el mar que apunta a un faro»): on a night sea (fig.marNocturno,
 * in a painted panel), a compass star floats on the water turned toward a lighthouse whose beam
 * reaches back to it. Bottom: rotulos.fraseFinal, the closing phrase, brush-lettered across the
 * page. The pie is the engine's. The module draws the cards itself (layout: diagrama false).
 *
 * Copy comes only from the deck entry. Static by default; in the 8 s ambient loop the stars
 * twinkle, the compass sways around the lighthouse's bearing and the beam sweeps a little (nothing
 * moves when s.still: then the compass points exactly at the lighthouse).
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.laminas = EIA.laminas || {};

  var TAU = Math.PI * 2;
  var NOMINAL = { w: 1168, h: 526 };                   // the whole page below the titular, above the pie
  // The five cards share one text size; each card is as tall as its text (at least minH), and the
  // stack fits `avail`.
  var CARDS = { x: 0, y: 2, w: 512, avail: 402, minH: 64, pad: 10, gap: 8, sign: 60, size: 22, minSize: 16 };
  var TAG = { gap: 16, scale: 0.86, maxWidth: 320 };
  var PANEL = { x: 712, y: 0, w: 456, h: 404, r: 18, horizon: 0.56 };
  var MOON = { x: 790, y: 62, size: 74 };
  var STARS = [[880, 48, 30], [960, 120, 22], [1040, 36, 26], [744, 150, 20], [1130, 150, 18], [850, 170, 16]];
  var LIGHT = { x: 1100, y: 232, scale: 0.3 };          // base of the distant lighthouse (on its rock)
  var STAR = { x: 830, y: 318, size: 132 };              // the compass star on the water
  var FRASE = { y: 420, size: 44 };

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return v === pts[i]; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  function fitOf(z) {
    var k = Math.min(z.w / NOMINAL.w, z.h / NOMINAL.h);
    return { k: k, x: z.x + (z.w - NOMINAL.w * k) / 2, y: z.y };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- The five cards

  // A card's text as lines at one size: when it carries figures, the parenthetical that holds them
  // starts a new line. Each line knows whether it holds a figure.
  function cardLines(ctx, env, it, maxW, size) {
    var segs = [it.text], figs = it.cifras && it.cifras.length;
    if (figs) {
      var cut = it.text.indexOf(' (');
      if (cut > 0) segs = [it.text.slice(0, cut), it.text.slice(cut + 1)];
    }
    var o = { size: size, weight: 700, maxWidth: maxW, lineHeight: 1.16 }, lines = [], font = null;
    segs.forEach(function (sg) {
      var lay = env.ink.measureText(ctx, sg, o);
      font = lay.font;
      lay.lines.forEach(function (ln) { lines.push({ text: ln, fig: !!figs && /\d/.test(ln) }); });
    });
    return { lines: lines, size: size, lineH: size * 1.16, h: (lines.length - 1) * size * 1.16 + size * 1.22, font: font };
  }

  // The stack: the largest shared text size at which every card fits and the stack fits `avail`.
  function layoutCards(ctx, env, items, k) {
    var maxW = (CARDS.w - 104) * k;
    for (var size = CARDS.size * k; ; size = Math.max(CARDS.minSize * k, size * 0.95)) {
      var total = (items.length - 1) * CARDS.gap * k;
      var cards = items.map(function (it) {
        var L = cardLines(ctx, env, it, maxW, size);
        L.cardH = Math.max(CARDS.minH * k, L.h + 2 * CARDS.pad * k);
        total += L.cardH;
        return L;
      });
      if (total <= CARDS.avail * k || size <= CARDS.minSize * k) return cards;
    }
  }

  function drawCards(ctx, env, s, X, Y, k) {
    var ink = env.ink, fig = env.fig, m = env.pal.mundo, items = (s.lamina.diagrama && s.lamina.diagrama.items) || [];
    var peeks = [m.amarillo, m.celeste, m.rojo, m.verde, m.amarillo];
    var cards = layoutCards(ctx, env, items, k), y = Y(CARDS.y);
    items.forEach(function (it, i) {
      var L = cards[i], x = X(CARDS.x), w = CARDS.w * k, h = L.cardH;
      ink.card(ctx, x, y, w, h, { seed: 'd17-card' + i, weight: 3.4, radius: 12, peek: peeks[i % peeks.length], peekCorner: i % 2 ? 'br' : 'tl' });
      if (it.signo && fig.hasSign(it.signo)) fig.sign(ctx, it.signo, x + 46 * k, y + h / 2, CARDS.sign * k, { seed: 'd17-' + it.signo });
      var tx = x + 90 * k, ty = y + (h - L.h) / 2, anchors = [];
      ctx.save();
      ctx.font = L.font;
      L.lines.forEach(function (ln, j) {
        var ly = ty + j * L.lineH;
        ink.text(ctx, ln.text, tx, ly, { size: L.size, weight: 700 });
        if (ln.fig) anchors.push({ x: tx + ctx.measureText(ln.text).width + 6 * k, y: ly + L.size * 0.62 });
      });
      ctx.restore();
      if (it.cifras && it.cifras.length && anchors.length) cardTag(ctx, env, it.cifras, anchors, x + w + TAG.gap * k, y + h / 2, k);
      y += h + CARDS.gap * k;
    });
  }

  // One tag for a card's figures, beside the card, with a thread to each line that holds a figure.
  function cardTag(ctx, env, ids, anchors, x, cy, k) {
    var to = { scale: TAG.scale * k, scope: 'auto', maxWidth: TAG.maxWidth }, tm = env.tags.measureTag(ctx, ids, to);
    var tg = env.tags.sourceTag(ctx, ids, { x: x, y: cy - tm.h / 2, scale: to.scale, scope: to.scope, maxWidth: to.maxWidth, anchor: anchors[0] });
    for (var i = 1; i < anchors.length; i++) {
      var a = anchors[i], hx = tg.hole.x, hy = tg.hole.y;
      env.ink.line(ctx, stable(env, 'thread' + i, [a.x, a.y, (a.x + hx) / 2, (a.y + hy) / 2 + 6 * k, hx, hy]), { w: 2 * to.scale, profile: 'hair',
        seed: 'd17-thread' + i, dot: 1.6 });
    }
  }

  // ---- The night sea: the compass star turned toward the lighthouse

  function drawSea(ctx, env, s, X, Y, k) {
    var fig = env.fig, ink = env.ink, m = env.pal.mundo, u = s.still ? 0 : s.loop;
    var px = X(PANEL.x), py = Y(PANEL.y), pw = PANEL.w * k, ph = PANEL.h * k;
    var sk = Math.max(pw / 1280, ph / 720), sx = px + (pw - 1280 * sk) / 2;
    ctx.save();
    roundRect(ctx, px, py, pw, ph, PANEL.r * k);
    ctx.clip();
    fig.marNocturno(ctx, sx, py, sk, { horizon: PANEL.horizon * ph / (720 * sk), moon: false, stars: 0, seed: 'd17' });
    fig.sign(ctx, 'luna', X(MOON.x), Y(MOON.y), MOON.size * k, { seed: 'd17-moon' });
    STARS.forEach(function (st, i) {
      var tw = s.still ? 1 : 0.86 + 0.14 * Math.sin(TAU * u * (1 + i % 2) + i * 1.9);
      fig.sign(ctx, 'estrella', X(st[0]), Y(st[1]), st[2] * k * tw, { seed: 'd17-star' + i, colors: { a: m.rojo, ink: i % 3 ? m.amarillo : m.lienzo } });
    });
    // The lighthouse on its rock; its lamp sits 250 px (× scale) above its base.
    var lx = X(LIGHT.x), ly = Y(LIGHT.y), ls = LIGHT.scale * k, lampY = ly - 250 * ls;
    var cx = X(STAR.x), cy = Y(STAR.y);
    var bearing = Math.atan2(lampY - cy, lx - cx);                    // from the compass to the lamp
    var beam = Math.atan2(cy - lampY, cx - lx) + (s.still ? 0 : Math.sin(TAU * u) * 0.06);
    ink.blob(ctx, lx - 4 * k, ly + 6 * k, 46 * k, 13 * k, { fill: m.siena, w: 3 * k, irr: 0.18, n: 9, seed: 'd17-rock' });
    fig.lighthouse(ctx, lx, ly, ls, { beam: beam });
    // The compass star floating on the water, its north turned toward the lighthouse.
    // Cream strokes (the sign's ink slot): black would vanish on the night water.
    ink.glow(ctx, cx, cy, 86 * k, m.amarillo, 0.6);
    ink.wave(ctx, cx - 76 * k, cy + 44 * k, cx + 76 * k, { amp: 3 * k, len: 46 * k, w: 2.6 * k, color: m.lienzo, seed: 'd17-ripple' });
    var rot = bearing + Math.PI / 2 + (s.still ? 0 : Math.sin(TAU * u + 1.2) * 0.12);
    fig.sign(ctx, 'brujula', cx, cy, STAR.size * k, { seed: 'd17-compass', rot: rot, colors: { a: m.rojo, ink: m.lienzo, paper: m.amarillo } });
    ctx.restore();
    ink.card(ctx, px, py, pw, ph, { fill: false, weight: 5, radius: PANEL.r * k, seed: 'd17-frame' });
  }

  EIA.laminas.d17 = {
    layout: { diagrama: false, drawDiagram: false },

    setup: function () { return {}; },

    draw: function (ctx, s, env) {
      var z = s.zones.ilustracion, f = fitOf(z), k = f.k, rot = s.lamina.rotulos || {};
      var X = function (lx) { return f.x + lx * k; }, Y = function (ly) { return f.y + ly * k; };
      drawSea(ctx, env, s, X, Y, k);
      drawCards(ctx, env, s, X, Y, k);
      // The closing phrase, brush-lettered across the page.
      if (rot.fraseFinal) {
        env.ink.letter(ctx, rot.fraseFinal.text, X(NOMINAL.w / 2), Y(FRASE.y), { size: FRASE.size * k, maxWidth: NOMINAL.w * k, maxLines: 2, fit: true,
          minSize: 26, align: 'center', seed: 'd17-frase' });
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
