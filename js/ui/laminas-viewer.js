/* Estado de la IA 2026 — the láminas viewer (prompt §10.10, §12.1, §14).
 *
 *   EIA.ui.openLamina(id, list)     full-screen 16:9 canvas of lámina `id` (EIA.engine.lamina.render,
 *       still frame); ←/→ and PageUp/PageDown move through `list` (default: the whole deck), Home/End
 *       jump to the ends, "Notas" (N) shows the KB "Qué decir" and "Nota" (plus the corrections the
 *       notes must name and links to the related "Contenido" points), Esc closes and gives the focus
 *       back. "Imprimir láminas" prints the láminas of `list` two per page with their notes.
 *   EIA.ui.laminasViewer = { open, close, draw(canvas, id, cssWidth), preparePrint(list) -> cleanup,
 *       describe(id), page(id) }
 *   open(id, list, { onClose({ id, user }) })   onClose gets the last page shown; user is false when the
 *       viewer closed because the route changed.
 * Pages beyond the deck: a page provider in EIA.ui.laminasPages ({ has(id), ids(), render(ctx, id),
 *   title(id), describe(id), notes(id, o), copy(key) -> chrome string or null }) draws and describes the
 *   ids it has (the fichas of sesión 0, js/ui/linea-tiempo-fichas.js); the deck stays the default.
 *   EIA.ui.kit.modal(el, { onKey, onClose }) -> { close }   the dialog shell shared with Modo clase
 *       (presenter.js): mounted in #overlays (so figure popovers still open above it), page scroll
 *       locked, Tab kept inside, focus returned to the opener on close.
 * Every string comes from EIA.data (deck notes verbatim; chrome in course.ui.visor and ui.laminas). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  function t(path, vars) { return ui.t ? ui.t(path, vars) : ''; }
  function kit() { return ui.kit; }
  function deck() { return EIA.data.deck || []; }
  function entry(id) { return deck().filter(function (d) { return d.id === id; })[0] || null; }
  // The page provider that has `id` (registered by any script, before or after this one), or null.
  function page(id) {
    var list = ui.laminasPages || [];
    for (var i = 0; i < list.length; i++) if (list[i].has(id)) return list[i];
    return null;
  }
  function known(id) { return !!(entry(id) || page(id)); }

  // =============================================================================================
  // Modal shell (also used by presenter.js)

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  var openModals = [];
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function popoverOpen() { return !!(ui.popover && ui.popover.current && ui.popover.current()); }

  function modal(el, o) {
    o = o || {};
    var opener = doc.activeElement;
    (doc.getElementById('overlays') || doc.body).appendChild(el);
    openModals.push(el);
    doc.documentElement.classList.add('has-modal');
    function onKey(e) {
      if (openModals[openModals.length - 1] !== el) return;
      if (popoverOpen() && (e.key === 'Escape' || e.key === 'Esc' || e.key === 'Tab')) return;
      if (o.onKey && o.onKey(e) === true) return;
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), visible);
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0], last = items[items.length - 1], active = doc.activeElement;
      if (!el.contains(active)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    doc.addEventListener('keydown', onKey, true);
    var closed = false;
    return {
      close: function (restore) {
        if (closed) return;
        closed = true;
        doc.removeEventListener('keydown', onKey, true);
        openModals = openModals.filter(function (x) { return x !== el; });
        if (!openModals.length) doc.documentElement.classList.remove('has-modal');
        if (ui.popover && ui.popover.close) ui.popover.close();
        el.remove();
        if (o.onClose) o.onClose();
        if (restore !== false && opener && opener.focus && doc.contains(opener)) {
          try { opener.focus({ preventScroll: true }); } catch (err) { opener.focus(); }
        }
      }
    };
  }
  if (ui.kit) ui.kit.modal = modal;

  // =============================================================================================
  // Drawing and text alternative

  // Draws lámina `id` (still frame) into canvas at cssWidth CSS px (16:9), DPR capped at 2.
  function draw(canvas, id, cssWidth, scale) {
    var lam = EIA.engine.lamina, pg = page(id);
    if (!pg && (!lam || !lam.render)) return;
    var w = Math.max(160, Math.round(cssWidth));
    var hh = Math.round(w * 9 / 16);
    var k = Math.min(2, root.devicePixelRatio || 1) * (scale || 1);
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(hh * k);
    canvas.style.width = w + 'px';
    canvas.style.height = hh + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / 1280, 0, 0, canvas.height / 720, 0, 0);
    try { if (pg) pg.render(ctx, id); else lam.render(ctx, id, { t: 0, still: true }); } catch (err) { if (root.console) root.console.warn('[visor] ' + id + ': ' + err.message); }
  }

  // The lámina's drawn words, in reading order (aria-label of the canvas).
  function describe(id) {
    var pg = page(id);
    if (pg) return pg.describe(id);
    var d = entry(id);
    if (!d) return '';
    var parts = [d.titular, d.subtitulo];
    (d.cifras || []).forEach(function (c) { parts.push([c.valor, c.etiqueta].join(' ')); });
    if (d.diagrama) {
      if (d.diagrama.titulo) parts.push(d.diagrama.titulo);
      (d.diagrama.items || []).forEach(function (it) { parts.push(it.text); });
    }
    if (d.ideaCentral) parts.push(d.ideaCentral.text);
    if (d.pie) parts.push(d.pie.text);
    var text = parts.filter(Boolean).map(function (p) { return String(p).replace(/[.\s]+$/, ''); }).join('. ');
    return t('visor.descripcion', { n: d.n, texto: text + '.' });
  }

  // Notes: KB "Qué decir" and "Nota" verbatim, corrections the notes must name, related contenido.
  function notesFor(id, o) {
    o = o || {};
    var pg = page(id);
    if (pg) return pg.notes(id, o);
    var d = entry(id), k = kit();
    var box = h('div', { class: 'lamina-notes' });
    if (!d) return box;
    var n = d.notas || {};
    if (n.decir) box.appendChild(h('p', { class: 'lamina-notes__item' }, [h('strong', { text: t('modoClase.queDecir') + ': ' }), h('span', { html: k.mi(n.decir, o.cite ? { cite: o.cite } : null) })]));
    if (n.nota) box.appendChild(h('p', { class: 'lamina-notes__item' }, [h('strong', { text: t('visor.nota') + ': ' }), h('span', { html: k.mi(n.nota, o.cite ? { cite: o.cite } : null) })]));
    (n.correcciones || []).forEach(function (cid) {
      var row = ((EIA.data.correcciones || {}).filas || []).filter(function (f) { return f.id === cid; })[0];
      if (!row) return;
      box.appendChild(h('div', { class: 'lamina-notes__fix' }, [
        h('p', {}, [h('strong', { text: t('banco.versionBase') + ': ' }), h('span', { class: 'strike', html: k.mi(row.antes) })]),
        h('p', {}, [h('strong', { text: t('banco.versionCorrecta') + ': ' }), h('span', { html: k.mi(row.ahora) })])
      ]));
    });
    if (!n.decir && !n.nota && !(n.correcciones || []).length) box.appendChild(h('p', { class: 'empty-note', text: t('visor.sinNotas') }));
    var s = EIA.data.sesiones[d.sesion];
    var points = (d.contenido || []).map(function (cn) { return s && s.contenido.filter(function (c) { return c.n === cn; })[0]; }).filter(Boolean);
    if (points.length && !o.noLinks) {
      box.appendChild(h('p', { class: 'lamina-notes__label', text: t('visor.contenido') }));
      box.appendChild(h('ul', { class: 'lamina-notes__links' }, points.map(function (c) {
        var a = h('a', { href: '#s' + d.sesion + '/contenido-' + c.n, text: t('visor.contenidoN', { n: c.n, titulo: k.plain(c.titulo) }) });
        if (o.onLink) a.addEventListener('click', o.onLink);
        return h('li', {}, [a]);
      })));
    }
    return box;
  }

  // =============================================================================================
  // The viewer

  var current = null;

  // The bar title of a page.
  function titleOf(id) {
    var pg = page(id), d = entry(id);
    return pg ? pg.title(id) : t('visor.lamina', { n: d.n, titulo: d.titulo });
  }

  function open(id, list, opts) {
    opts = opts || {};
    if (current) current.close(false);
    var pg0 = page(id);
    var all = pg0 ? pg0.ids() : deck().map(function (d) { return d.id; });
    var ids = (Array.isArray(list) && list.length ? list : all).filter(known);
    var i = Math.max(0, ids.indexOf(id));
    if (!ids.length) return;
    var k = kit();
    // Chrome strings: the provider's own words for its pages (e.g. "Ficha anterior"), else the deck's.
    function label(key, fallback) { var v = pg0 && pg0.copy ? pg0.copy(key) : null; return v != null ? v : t(fallback); }
    var titleId = k.uid('visor-titulo');
    var notesId = k.uid('visor-notas');
    var title = h('h2', { class: 'visor__title', id: titleId });
    var count = h('p', { class: 'visor__count' });
    var canvas = h('canvas', { class: 'visor__canvas', role: 'img' });
    var stage = h('div', { class: 'visor__stage' }, [canvas]);
    var notesBody = h('div', { class: 'visor__notes-body' });
    var notes = h('aside', { class: 'visor__notes', id: notesId, hidden: true, 'aria-label': t('laminas.notas') }, [
      h('h3', { class: 'visor__notes-title', text: t('laminas.notas') }), notesBody
    ]);
    var bPrev = h('button', { type: 'button', class: 'visor__nav visor__nav--prev', 'aria-label': label('anterior', 'visor.anterior') }, [h('span', { 'aria-hidden': 'true', text: '‹' })]);
    var bNext = h('button', { type: 'button', class: 'visor__nav visor__nav--next', 'aria-label': label('siguiente', 'visor.siguiente') }, [h('span', { 'aria-hidden': 'true', text: '›' })]);
    var bNotes = h('button', { type: 'button', class: 'btn btn--small btn--night', 'aria-expanded': 'false', 'aria-controls': notesId, text: t('laminas.notas') });
    var bPrint = h('button', { type: 'button', class: 'btn btn--small btn--night', text: label('imprimir', 'laminas.imprimir') });
    var bClose = h('button', { type: 'button', class: 'btn btn--small btn--night visor__close', 'aria-label': label('cerrarAria', 'visor.cerrarAria'), text: t('visor.cerrar') });
    var el = h('div', { class: 'visor', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
      h('div', { class: 'visor__bar' }, [
        h('div', { class: 'visor__heading' }, [count, title]),
        h('div', { class: 'visor__tools' }, [bNotes, bPrint, bClose])
      ]),
      h('div', { class: 'visor__main' }, [bPrev, stage, bNext, notes]),
      h('p', { class: 'visor__keys', text: label('atajos', 'visor.atajos') })
    ]);

    function fit() {
      var r = stage.getBoundingClientRect();
      var w = Math.max(200, Math.min(r.width, (r.height || r.width * 9 / 16) * 16 / 9));
      draw(canvas, ids[i], Math.floor(w));
    }
    function show(j) {
      i = Math.max(0, Math.min(ids.length - 1, j));
      title.textContent = titleOf(ids[i]);
      count.textContent = t('visor.posicion', { n: i + 1, total: ids.length });
      canvas.setAttribute('aria-label', describe(ids[i]));
      bPrev.disabled = i === 0;
      bNext.disabled = i === ids.length - 1;
      notesBody.innerHTML = '';
      notesBody.appendChild(notesFor(ids[i], { onLink: function () { close(false); } }));
      if (ui.reveal) ui.reveal.show(notesBody);
      k.engineReady().then(fit);
      fit();
    }
    function toggleNotes(force) {
      var on = force != null ? force : notes.hidden;
      notes.hidden = !on;
      el.classList.toggle('has-notes', on);
      bNotes.setAttribute('aria-expanded', on ? 'true' : 'false');
      root.requestAnimationFrame(fit);
    }
    function printAll() {
      var cleanup = preparePrint(ids);
      function done() { cleanup(); root.removeEventListener('afterprint', done); }
      root.addEventListener('afterprint', done);
      root.setTimeout(function () { root.print(); }, 120);
    }
    bPrev.addEventListener('click', function () { show(i - 1); });
    bNext.addEventListener('click', function () { show(i + 1); });
    bNotes.addEventListener('click', function () { toggleNotes(); });
    bPrint.addEventListener('click', printAll);
    bClose.addEventListener('click', function () { close(); });
    stage.addEventListener('click', function (e) {
      var r = stage.getBoundingClientRect();
      show(e.clientX - r.left < r.width / 3 ? i - 1 : i + 1);
    });

    var shell = modal(el, {
      onKey: function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return false;
        var key = e.key, typing = k.editable(e.target);
        if (key === 'Escape' || key === 'Esc') { e.preventDefault(); close(); return true; }
        if (key === 'PageUp' || (key === 'ArrowLeft' && !typing)) { e.preventDefault(); show(i - 1); return true; }
        if (key === 'PageDown' || (key === 'ArrowRight' && !typing)) { e.preventDefault(); show(i + 1); return true; }
        if (key === 'Home' && !typing) { e.preventDefault(); show(0); return true; }
        if (key === 'End' && !typing) { e.preventDefault(); show(ids.length - 1); return true; }
        if ((key === 'n' || key === 'N') && !typing) { e.preventDefault(); toggleNotes(); return true; }
        return false;
      }
    });
    var onResize = function () { fit(); };
    root.addEventListener('resize', onResize);
    var onRoute = function () { close(false); };
    root.addEventListener('eia:route', onRoute);
    function close(restore) {
      root.removeEventListener('resize', onResize);
      root.removeEventListener('eia:route', onRoute);
      shell.close(restore);
      current = null;
      if (opts.onClose) opts.onClose({ id: ids[i], user: restore !== false });
    }
    current = { close: close, show: show, el: el };
    show(i);
    try { bClose.focus({ preventScroll: true }); } catch (err) { bClose.focus(); }
    return current;
  }

  // =============================================================================================
  // "Imprimir láminas": two per page, still frames, with their notes.

  function preparePrint(list) {
    var ids = (list && list.length ? list : deck().map(function (d) { return d.id; })).filter(known);
    var old = doc.getElementById('print-laminas');
    if (old) old.remove();
    var sheet = h('div', { id: 'print-laminas', class: 'print-sheet print-laminas' }, ids.map(function (id) {
      var canvas = h('canvas', { class: 'print-laminas__canvas', role: 'img', 'aria-label': describe(id) });
      draw(canvas, id, 1280, 1.25 / Math.min(2, root.devicePixelRatio || 1));
      canvas.style.width = '';
      canvas.style.height = '';
      return h('figure', { class: 'print-laminas__item' }, [
        canvas,
        h('figcaption', {}, [
          h('p', { class: 'print-laminas__title', text: titleOf(id) }),
          notesFor(id, { noLinks: true, cite: 'text' })
        ])
      ]);
    }));
    doc.body.appendChild(sheet);
    doc.body.setAttribute('data-print', 'laminas');
    return function () {
      if (doc.body.getAttribute('data-print') === 'laminas') doc.body.removeAttribute('data-print');
      sheet.remove();
    };
  }

  ui.openLamina = function (id, list, opts) { return open(id, list, opts); };
  ui.laminasViewer = {
    open: open,
    close: function () { if (current) current.close(); },
    draw: draw,
    describe: describe,
    notes: notesFor,
    page: page,
    preparePrint: preparePrint
  };
})(typeof window !== 'undefined' ? window : globalThis);
