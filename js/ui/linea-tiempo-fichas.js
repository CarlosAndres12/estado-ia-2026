/* Estado de la IA 2026 — sesión 0: one ficha per milestone of the timeline (#s0, js/ui/linea-tiempo.js).
 *
 * A ficha is a 1280×720 canvas page in the language of the course láminas (js/engine/lamina.js): the
 * kicker "Sesión 0 · Línea del tiempo" with the era title, the milestone as a brush-lettered titular,
 * its position ("Hito n de 24") in a colored disc at the top right, the date as the big hero figure,
 * the labeled fields Organización/personas, Lugar/contexto and Descripción del avance técnico, the
 * milestone's poster drawing (its column's arte, js/ui/linea-tiempo-arte.js) large on a paper card with
 * a source tag naming the hosts of its sources, an "Importancia histórica" band in the place of the
 * láminas' "Idea central", and the Nota de verificación as the pie. Every word comes from the
 * milestone's own row (EIA.data.lineaTiempo.hitos) or the chrome in EIA.data.lineaTiempo.ui.
 *
 *   EIA.ui.lineaTiempoFichas = {
 *     ids()                 ['s0-<hito id>', …] in milestone order
 *     hitoOf(id)            the milestone of a ficha id, or null
 *     idOf(hito)            its ficha id
 *     hosts(fuente)         ['openai.com', …] the hosts of a "Fuente de verificación" cell, once each
 *     position(i)           "Hito n de 24" for milestone index i
 *     texts(hito)           [{ key, text, chrome? }] every string the ficha draws, in reading order
 *     layout(ctx, hito)     -> zones { kicker, titular, badge, fecha, campos, arte, fuente, idea, pie,
 *                              overflow, overflowing: [zone] }; measures with ctx, shrinks long text
 *                              (titular, fields, band, pie) down to its minimum size like lamina.js
 *     render(ctx, id)       draws one ficha in logical 1280×720 units (still frame)
 *   }
 * The module registers a page provider for the láminas viewer (EIA.ui.laminasPages, read by
 * js/ui/laminas-viewer.js): has(id), ids(), render, title, describe, notes(id, o) and copy(key) for the
 * viewer's chrome. Loads without a DOM; notes() needs one. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};

  var W = 1280, H = 720, MARGIN = 56, PREFIX = 's0-';
  var TITLE = { size: 54, maxWidth: 900, maxLines: 2, minSize: 32 };
  var LEFT_W = 560, ART_X = 648;
  var FIELD = { max: 21, min: 14, label: 13, gap: 12 };
  var DOT_COLORS = ['tinta', 'rojo', 'azul', 'amarillo'];   // the poster dots (linea-tiempo.js)

  function E() { return EIA.engine || {}; }
  function I() { return E().ink; }
  function M() { return E().palette.mundo; }
  function data() { return EIA.data.lineaTiempo || { hitos: [], eras: [], ui: {} }; }
  function copy(key, vars) {
    var v = key.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, data().ui);
    return String(v == null ? '' : v).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? String(vars[k]) : ''; });
  }
  function muted() { return E().palette.mix(M().tinta, M().lienzo, 0.3); }

  // ---------------------------------------------------------------------------------------------
  // Identity and text

  function hitos() { return data().hitos || []; }
  function idOf(hito) { return PREFIX + hito.id; }
  function ids() { return hitos().map(idOf); }
  function indexOf(id) {
    var list = hitos();
    for (var i = 0; i < list.length; i++) if (idOf(list[i]) === id) return i;
    return -1;
  }
  function hitoOf(id) { var i = indexOf(id); return i < 0 ? null : hitos()[i]; }
  function eraOf(hito) { return (data().eras || []).filter(function (e) { return e.id === hito.era; })[0] || null; }
  function columnOf(hito) {
    var era = eraOf(hito);
    return era ? era.columnas.filter(function (c) { return c.hitos.indexOf(hito.id) >= 0; })[0] || null : null;
  }

  function sources(fuente) {
    return String(fuente || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function hosts(fuente) {
    var out = [];
    sources(fuente).forEach(function (url) {
      var m = /^[a-z]+:\/\/([^\/?#:]+)/i.exec(url);
      var host = m ? m[1].toLowerCase().replace(/^www\./, '') : '';
      if (host && out.indexOf(host) < 0) out.push(host);
    });
    return out;
  }
  function position(i) { return copy('posicion', { n: i + 1, total: hitos().length }); }

  var FIELDS = ['actores', 'lugar', 'avance'];

  function texts(hito) {
    var i = hitos().indexOf(hito), era = eraOf(hito), out = [];
    function add(key, text, chrome) { if (text) out.push(chrome ? { key: key, text: text, chrome: true } : { key: key, text: text }); }
    add('kicker', copy('ficha.kicker'), true);
    add('era', era && era.titulo);
    add('position', position(i), true);
    add('hito', hito.hito);
    add('fecha', hito.fecha);
    FIELDS.forEach(function (k) { add('campos.' + k, copy('campos.' + k), true); add(k, hito[k]); });
    add('campos.fuente', copy('campos.fuente'), true);
    hosts(hito.fuente).forEach(function (h) { add('host', h); });
    add('campos.importancia', copy('campos.importancia'), true);
    add('importancia', hito.importancia);
    add('campos.nota', copy('campos.nota'), true);
    add('nota', hito.nota);
    return out;
  }
  function kickerText(hito) {
    var era = eraOf(hito);
    return copy('ficha.kicker') + (era ? ' · ' + era.titulo : '');
  }

  // ---------------------------------------------------------------------------------------------
  // Layout

  var BAND = { h: 84, text: 25, min: 16 };
  var PIE = { size: 14, min: 11, lines: 2 };
  var TAG = { label: 12, size: 15, maxWidth: 300 };

  function layout(ctx, hito) {
    var ink = I(), z = { overflowing: [] };
    function bad(name) { if (z.overflowing.indexOf(name) < 0) z.overflowing.push(name); }

    // Kicker and titular (the badge keeps the top right corner)
    var kl = ink.measureText(ctx, kickerText(hito), { size: 15, weight: 700, maxWidth: TITLE.maxWidth, maxLines: 1, fit: true, minSize: 11 });
    if (kl.overflow) bad('kicker');
    z.kicker = { x: MARGIN, y: 26, w: TITLE.maxWidth, h: kl.h, size: kl.size };
    var tl = ink.measureLetter(ctx, hito.hito, { size: TITLE.size, maxWidth: TITLE.maxWidth, maxLines: TITLE.maxLines, minSize: TITLE.minSize,
      seed: idOf(hito), underline: true });
    if (tl.lines.length > TITLE.maxLines || tl.w > TITLE.maxWidth + 0.5) bad('titular');
    z.titular = { x: MARGIN, y: z.kicker.y + z.kicker.h + 6, w: TITLE.maxWidth, h: tl.h };
    z.badge = { x: W - MARGIN - 112, y: 22, w: 112, h: 104 };
    var top = Math.max(z.titular.y + z.titular.h + 18, z.badge.y + z.badge.h + 14);

    // Pie (label + nota, up to 2 lines) and the band above it
    var pieLabel = ink.measureText(ctx, copy('campos.nota') + ':', { size: PIE.size, weight: 700 });
    var pieW = W - MARGIN * 2 - pieLabel.w - 6;
    var pl = ink.measureText(ctx, hito.nota, { size: PIE.size, maxWidth: pieW, maxLines: PIE.lines, fit: true, minSize: PIE.min });
    if (pl.overflow) bad('pie');
    var pieH = Math.max(pl.h, pieLabel.h);
    z.pie = { x: MARGIN, y: H - 14 - pieH, w: W - MARGIN * 2, h: pieH, labelW: pieLabel.w, size: pl.size };
    z.idea = { x: MARGIN, y: z.pie.y - 12 - BAND.h, w: W - MARGIN * 2, h: BAND.h };
    var il = ink.measureText(ctx, hito.importancia, { font: 'display', weight: 700, size: BAND.text, maxWidth: z.idea.w - 100, maxLines: 2, fit: true,
      minSize: BAND.min, maxHeight: z.idea.h - 30 });
    if (il.overflow) bad('idea');
    var bottom = z.idea.y - 16;

    // Left column: the date as the hero figure, then the labeled fields at the largest size that fits
    var fl = ink.measureLetter(ctx, hito.fecha, { size: 100, maxWidth: LEFT_W, maxLines: 1, minSize: 56, seed: idOf(hito) + ':fecha',
      underline: false, stars: false, counters: 0 });
    if (fl.lines.length > 1 || fl.w > LEFT_W + 0.5) bad('fecha');
    z.fecha = { x: MARGIN, y: top, w: Math.min(LEFT_W, Math.ceil(fl.w)), h: fl.h };
    var cy = top + fl.h + 14;
    z.campos = { x: MARGIN, y: cy, w: LEFT_W, h: Math.max(0, bottom - cy), blocks: [], size: FIELD.min };
    for (var s = FIELD.max; s >= FIELD.min; s--) {
      var blocks = [], y = cy;
      FIELDS.forEach(function (k, n) {
        var lab = ink.measureText(ctx, copy('campos.' + k), { size: FIELD.label, weight: 700, maxWidth: LEFT_W, maxLines: 1, fit: true, minSize: 11 });
        var val = ink.measureText(ctx, hito[k], { size: s, maxWidth: LEFT_W, lineHeight: 1.25 });
        if (n) y += FIELD.gap;
        blocks.push({ key: k, y: y, labelH: lab.h, h: lab.h + 2 + val.h, size: s });
        y += lab.h + 2 + val.h;
      });
      z.campos.blocks = blocks;
      z.campos.size = s;
      if (y - cy <= z.campos.h) break;
      if (s === FIELD.min) bad('campos');
    }

    // Right column: the drawing card and its source tag hanging from its lower left corner
    var tagLabel = ink.measureText(ctx, copy('campos.fuente'), { size: TAG.label, weight: 700 });
    var tagText = ink.measureText(ctx, hosts(hito.fuente).join(' · '), { size: TAG.size, weight: 700, maxWidth: TAG.maxWidth, maxLines: 2, fit: true, minSize: 12 });
    if (tagText.overflow) bad('fuente');
    var tagW = Math.ceil(Math.max(tagLabel.w + 20, tagText.w)) + 36, tagH = Math.ceil(tagLabel.h + 4 + tagText.h + 18);
    var artH = Math.max(120, bottom - top - Math.ceil(tagH * 0.45));
    z.arte = { x: ART_X, y: top, w: W - MARGIN - ART_X, h: artH, name: (columnOf(hito) || {}).arte };
    z.fuente = { x: ART_X + 22, y: top + artH - Math.floor(tagH * 0.55), w: tagW, h: tagH, labelH: tagLabel.h };
    if (z.fuente.y + z.fuente.h > z.idea.y) bad('fuente');

    z.overflow = z.overflowing.length > 0;
    return z;
  }

  // ---------------------------------------------------------------------------------------------
  // Drawing

  var measureCtx = null;
  function mctx() {
    if (!measureCtx) measureCtx = I().makeCanvas(8, 8).getContext('2d');
    return measureCtx;
  }

  function render(ctx, id) {
    var ink = I(), m = M(), hito = hitoOf(id);
    ink.background(ctx, 'personas', { seed: 'ficha:' + id });
    if (!hito) return null;
    var i = indexOf(id), z = layout(ctx, hito);
    var dot = m[DOT_COLORS[i % DOT_COLORS.length]];
    var peek = hito.era === 'generativa' ? m.celeste : m.amarillo;
    var F = E().figures;

    // The calm margin signs of the láminas, frozen
    if (F) {
      F.sign(ctx, 'estrella', W - 40, 168, 30, { seed: id + '0', colors: { a: m.amarillo } });
      F.sign(ctx, 'puntos', 24, 600, 26, { seed: id + '1', colors: { a: m.amarillo } });
    }

    // Kicker and titular
    ink.text(ctx, kickerText(hito), z.kicker.x, z.kicker.y, { size: 15, weight: 700, maxWidth: z.kicker.w, maxLines: 1, fit: true, minSize: 11, color: muted() });
    ink.letter(ctx, hito.hito, z.titular.x, z.titular.y, { size: TITLE.size, maxWidth: TITLE.maxWidth, maxLines: TITLE.maxLines, minSize: TITLE.minSize,
      seed: id, underline: true });

    // The date, with a flat light field peeking behind it (lamina.bigFigure)
    var fz = z.fecha;
    var br = Math.max(30, Math.min(fz.w * 0.3, 130));
    ink.blob(ctx, fz.x + br * 1.1, fz.y + fz.h * 0.72, br, fz.h * 0.3, {
      fill: peek, line: false, seed: id + ':blob', irr: 0.2, fillAlpha: 0.85 });
    ink.letter(ctx, hito.fecha, fz.x, fz.y, { size: 100, maxWidth: LEFT_W, maxLines: 1, minSize: 56, seed: id + ':fecha',
      underline: false, stars: false, counters: 0 });

    // The labeled fields
    z.campos.blocks.forEach(function (b) {
      ink.text(ctx, copy('campos.' + b.key), z.campos.x, b.y, { size: FIELD.label, weight: 700, maxWidth: z.campos.w, maxLines: 1, fit: true, minSize: 11, color: muted() });
      ink.text(ctx, hito[b.key], z.campos.x, b.y + b.labelH + 2, { size: b.size, maxWidth: z.campos.w, lineHeight: 1.25 });
    });

    // The poster drawing, large, on its paper card
    var a = z.arte;
    // A flat field peeks out at its lower right corner, kept clear of the band and the page edge.
    ink.blob(ctx, a.x + a.w - 44, a.y + a.h - 8, 50, 26, { fill: peek, line: false, seed: id + ':peek', irr: 0.2, fillAlpha: 0.9 });
    ink.card(ctx, a.x, a.y, a.w, a.h, { seed: id + ':card', weight: 4, radius: 16 });
    if (a.name && ui.lineaTiempoArte) {
      ctx.save();
      ctx.translate(a.x + 28, a.y + 24);
      try { ui.lineaTiempoArte.draw(ctx, a.name, a.w - 56, a.h - 48); } catch (err) { if (root.console) root.console.warn('[ficha] ' + a.name + ': ' + err.message); }
      ctx.restore();
    }

    // The position disc
    var bx = z.badge.x + z.badge.w / 2, by = z.badge.y + 38;
    ink.circle(ctx, bx, by, 34, { fill: dot, w: 3.4, seed: id + ':badge' });
    ink.text(ctx, String(i + 1), bx, by - 18, { size: 30, weight: 700, align: 'center', color: dot === m.amarillo ? m.tinta : m.lienzo });
    ink.text(ctx, position(i), bx, by + 42, { size: 14, weight: 700, align: 'center', color: muted() });

    // Its source tag: the hosts of the row's sources
    var t = z.fuente;
    ink.card(ctx, t.x, t.y, t.w, t.h, { seed: id + ':tag', weight: 3, radius: 12 });
    ink.dot(ctx, t.x + 18, t.y + 9 + t.labelH / 2, 3.4, m.tinta);
    ink.text(ctx, copy('campos.fuente'), t.x + 28, t.y + 9, { size: TAG.label, weight: 700 });
    ink.text(ctx, hosts(hito.fuente).join(' · '), t.x + 18, t.y + 13 + t.labelH, { size: TAG.size, weight: 700, maxWidth: TAG.maxWidth, maxLines: 2, fit: true, minSize: 12 });

    // The band: Importancia histórica
    var r = z.idea;
    ink.card(ctx, r.x, r.y, r.w, r.h, { seed: 'idea:' + id, weight: 4.2, radius: 14, peek: m.amarillo, peekCorner: 'tr' });
    if (F) F.sign(ctx, 'estrella', r.x + 36, r.y + r.h / 2, 40, { seed: 'idea' + id });
    ink.text(ctx, copy('campos.importancia'), r.x + 70, r.y + 9, { size: 13, weight: 700, color: muted() });
    ink.text(ctx, hito.importancia, r.x + 70, r.y + 26, { font: 'display', weight: 700, size: BAND.text, maxWidth: r.w - 100, maxLines: 2, fit: true,
      minSize: BAND.min, maxHeight: r.h - 30 });

    // Pie: the verification note
    var p = z.pie, pc = E().palette.mix(m.tinta, m.lienzo, 0.2);
    ink.text(ctx, copy('campos.nota') + ':', p.x, p.y, { size: PIE.size, weight: 700, color: pc });
    ink.text(ctx, hito.nota, p.x + p.labelW + 6, p.y, { size: PIE.size, maxWidth: p.w - p.labelW - 6, maxLines: PIE.lines, fit: true, minSize: PIE.min, color: pc });
    return z;
  }

  // ---------------------------------------------------------------------------------------------
  // Page provider of the láminas viewer

  function describe(id) {
    var hito = hitoOf(id);
    if (!hito) return '';
    var parts = [kickerText(hito), hito.hito, hito.fecha, position(indexOf(id))];
    FIELDS.forEach(function (k) { parts.push(copy('campos.' + k) + ': ' + hito[k]); });
    parts.push(copy('campos.fuente') + ': ' + hosts(hito.fuente).join(', '));
    parts.push(copy('campos.importancia') + ': ' + hito.importancia);
    parts.push(copy('campos.nota') + ': ' + hito.nota);
    var text = parts.filter(Boolean).map(function (s) { return String(s).replace(/[.\s]+$/, ''); }).join('. ');
    return copy('ficha.descripcion', { texto: text + '.' });
  }

  function notes(id, o) {
    o = o || {};
    var h = ui.h, hito = hitoOf(id);
    var box = h('div', { class: 'lamina-notes' });
    if (!hito) return box;
    box.appendChild(h('p', { class: 'lamina-notes__item' }, [h('strong', { text: copy('campos.nota') + ': ' }), h('span', { text: hito.nota })]));
    box.appendChild(h('p', { class: 'lamina-notes__label', text: copy('campos.fuente') }));
    var hint = ui.t ? ui.t('page.markup.nuevaPestana') : '';
    box.appendChild(h('ul', { class: 'lamina-notes__links' }, sources(hito.fuente).map(function (url) {
      if (o.noLinks) return h('li', { text: url });
      return h('li', {}, [h('a', { class: 'ext-link', href: url, target: '_blank', rel: 'noopener', 'aria-label': url + (hint ? ' (' + hint + ')' : '') },
        [url, h('span', { 'aria-hidden': 'true', text: ' ↗' })])]);
    })));
    return box;
  }

  var provider = {
    has: function (id) { return indexOf(id) >= 0; },
    ids: ids,
    render: function (ctx, id) { return render(ctx, id); },
    title: function (id) { var x = hitoOf(id); return x ? copy('ficha.titulo', { fecha: x.fecha, hito: x.hito }) : ''; },
    describe: describe,
    notes: notes,
    copy: function (key) { var v = (data().ui.ficha || {})[key]; return v == null ? null : v; }
  };
  (ui.laminasPages = ui.laminasPages || []).push(provider);

  ui.lineaTiempoFichas = {
    ids: ids, hitoOf: hitoOf, idOf: idOf, hosts: hosts, position: position, texts: texts,
    layout: function (ctx, hito) { return layout(ctx || mctx(), hito); },
    render: render
  };
})(typeof window !== 'undefined' ? window : globalThis);
