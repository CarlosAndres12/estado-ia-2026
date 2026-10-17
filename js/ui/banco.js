/* Estado de la IA 2026 — #cifras, the banco de cifras (prompt §9.6, §10.1, §10.2, §14; KB §13–§14).
 *
 *   EIA.ui.banco.mount(el, state)   the view: intro (estado list + KB §1 "Fuentes y citas"), the bank
 *                                   (filters, search, card / table views, "Imprimir esta selección"),
 *                                   "Correcciones" and "Actualizaciones que conviene mencionar"
 *   EIA.ui.banco.focus(id)          deep link #cifras/<id>: clears the filters and returns the card
 *   EIA.ui.banco.matches(c, f)      pure filter: c = EIA.cifra(id), f = { temas, tipos, estados,
 *                                   sesiones (arrays), q (search text) }
 *
 * Filters are toggle chips (aria-pressed): OR inside a group, AND across groups. "Tipo de evidencia"
 * has the five types and "Otros" (neutral and "—" rows). The search is accent- and case-insensitive
 * over cifra, alcance and fuente. Cards: cifra, alcance, chip, estado, source links, sessions,
 * "Copiar cita" and, for rows touched by a KB §14 correction, "Ver corrección". The print sheet is a
 * citation list (cifra, alcance, tipo, estado, URL) built in #print-sheet for css/print.css. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function t(path, vars) { return ui.t(path, vars); }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  function fold(s) { return EIA.util.fold(s); }
  function mi(s, o) { return EIA.markup.inline(s, o); }

  var CLASES = ['capacidad', 'uso', 'resultado', 'expectativa', 'proyeccion'];
  var ESTADOS = ['verificada', 'con-matiz', 'actualizacion', 'informe-base'];

  function tipoKey(c) { return CLASES.indexOf(c.clase) >= 0 ? c.clase : 'otros'; }

  function haystack(c) {
    if (c.__hay) return c.__hay;
    var f = c.fuentesList.map(function (s) {
      var src = EIA.data.fuentes[s.key] || {};
      return [s.etiqueta, src.titulo, src.autor].join(' ');
    }).join(' ');
    c.__hay = fold([c.cifra, c.alcanceTexto, f].join(' '));
    return c.__hay;
  }

  function matches(c, f) {
    f = f || {};
    if (f.temas && f.temas.length && f.temas.indexOf(c.tema) < 0) return false;
    if (f.tipos && f.tipos.length && f.tipos.indexOf(tipoKey(c)) < 0) return false;
    if (f.estados && f.estados.length && f.estados.indexOf(c.estadoKey) < 0) return false;
    if (f.sesiones && f.sesiones.length && !(c.sesiones || []).some(function (n) { return f.sesiones.indexOf(n) >= 0; })) return false;
    var q = fold(f.q || '').trim();
    if (q) {
      var hay = haystack(c);
      var words = q.split(/\s+/);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function corrections() {
    var out = {};
    var cr = EIA.data.correcciones;
    ((cr && cr.filas) || []).forEach(function (f) { (f.cifras || []).forEach(function (id) { if (!out[id]) out[id] = f.id; }); });
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Pieces

  function sourceLinks(c) {
    var hint = t('page.markup.nuevaPestana');
    return c.fuentesList.map(function (f, i) {
      return [i ? '; ' : '', h('a', { href: f.url, target: '_blank', rel: 'noopener', class: 'ext-link', 'aria-label': t('page.banco.abrirFuente', { fuente: f.etiqueta }) + (hint ? ' (' + hint + ')' : '') }, [f.etiqueta, h('span', { 'aria-hidden': 'true', text: ' ↗' })])];
    });
  }

  function sessionLinks(c) {
    return (c.sesiones || []).map(function (n, i) {
      return [i ? ' · ' : '', h('a', { href: '#s' + n, 'aria-label': t('page.banco.irSesion', { n: n }), text: t('page.banco.sesionN', { n: n }) })];
    });
  }

  function copyBtn(id, extraClass) {
    var b = h('button', { type: 'button', class: 'btn btn--small' + (extraClass ? ' ' + extraClass : ''), text: t('citas.copiarCita') });
    ui.copyButton(b, function () { return EIA.util.citation(id); });
    return b;
  }

  function figureCard(c, corr) {
    var meta = h('p', { class: 'fig-card__meta' });
    meta.innerHTML = ui.chipHTML(c.clase, c.tipo) + ' ' + ui.estadoHTML(c.estado);
    return h('li', { class: 'fig-card card card--thin', id: 'cifras--' + c.id }, [
      h('p', { class: 'fig-card__cifra', text: c.cifra }),
      h('p', { class: 'fig-card__alcance' }, [h('span', { class: 'label', text: t('page.banco.alcance') + ': ' }), c.alcanceTexto]),
      meta,
      h('p', { class: 'fig-card__sources' }, [h('span', { class: 'label', text: (c.fuentesList.length > 1 ? t('page.banco.fuentes') : t('page.banco.fuente')) + ': ' })].concat(sourceLinks(c))),
      c.sesiones && c.sesiones.length ? h('p', { class: 'fig-card__sessions' }, [h('span', { class: 'label', text: t('page.banco.sesiones') + ': ' })].concat(sessionLinks(c))) : null,
      h('p', { class: 'fig-card__actions' }, [
        copyBtn(c.id),
        corr ? h('a', { class: 'btn btn--small btn--quiet', href: '#cifras/correccion-' + corr, text: t('banco.verCorreccion') }) : null
      ])
    ]);
  }

  function tableRow(c, corr) {
    var chip = h('td'), estado = h('td');
    chip.innerHTML = ui.chipHTML(c.clase, c.tipo);
    estado.innerHTML = ui.estadoHTML(c.estado);
    return h('tr', { id: 'cifras--fila-' + c.id }, [
      h('th', { scope: 'row', class: 'bank-table__cifra', text: c.cifra }),
      h('td', { text: c.alcanceTexto }),
      chip, estado,
      h('td', {}, sourceLinks(c)),
      h('td', {}, sessionLinks(c)),
      h('td', { class: 'bank-table__actions' }, [copyBtn(c.id), corr ? h('a', { class: 'btn btn--small btn--quiet', href: '#cifras/correccion-' + corr, text: t('banco.verCorreccion') }) : null])
    ]);
  }

  function toggle(label, value, group, html) {
    var b = h('button', { type: 'button', class: 'filter-chip', 'aria-pressed': 'false', 'data-group': group, 'data-value': String(value) });
    if (html) b.innerHTML = html; else b.textContent = label;
    return b;
  }

  // ---------------------------------------------------------------------------------------------
  // The view

  var api = { el: null, reset: null, show: null };

  function mount(el) {
    var cb = EIA.data.course.banco || {}, cr = EIA.data.correcciones || {};
    ui.viewHead(el, { title: t('banco.titulo'), signs: ['estrella', 'puntos', 'luna'] });

    // Intro: the KB's "Estado de cada cifra" and the KB §1 "Fuentes y citas" paragraph.
    var fichaF = EIA.data.course.ficha && EIA.data.course.ficha.fuentes;
    el.appendChild(h('section', { class: 'block bank-intro', id: 'cifras--intro', 'aria-label': t('page.banco.intro') }, [
      h('div', { class: 'grid grid--two' }, [
        ui.card({ peek: true }, [
          h('h2', { class: 'card__title', text: cb.estadosTitulo }),
          h('ul', { class: 'estados' }, (cb.estados || []).map(function (e) {
            return h('li', { class: 'estados__item estado--' + e.key }, [
              h('span', { class: 'estado__sign', 'aria-hidden': 'true' }),
              h('span', {}, [h('strong', { text: e.label + ':' }), ' ', h('span', { html: mi(e.texto) })])
            ]);
          }))
        ]),
        fichaF ? ui.card({ peek: true }, [h('h2', { class: 'card__title', text: fichaF.label }), h('p', { html: mi(fichaF.texto) })]) : null
      ])
    ]));

    // Filters (a meaning zone: decorative color steps aside).
    var state = { temas: [], tipos: [], estados: [], sesiones: [], q: '', view: 'cards' };
    var all = (EIA.data.cifras || []).filter(function (c) { return c.enBanco; }).map(function (c) { return EIA.cifra(c.id); });
    var corr = corrections();

    var groups = [
      { id: 'temas', legend: t('banco.tema'), items: (EIA.data.temas || []).map(function (tm) { return toggle(tm.titulo, tm.id, 'temas'); }) },
      { id: 'tipos', legend: t('banco.tipo'), items: CLASES.map(function (cl) {
        var tp = (EIA.engine.palette.legend.tipoByClase || {})[cl];
        return toggle('', cl, 'tipos', ui.chipHTML(cl, tp ? tp.label : ''));
      }).concat([toggle('', 'otros', 'tipos', '<span class="chip chip--neutral"><span class="chip__sign" aria-hidden="true"></span><span class="chip__label">' + EIA.markup.escape(t('banco.otros')) + '</span></span>')]) },
      { id: 'estados', legend: t('banco.estado'), items: ESTADOS.map(function (k) {
        var e = (cb.estados || []).filter(function (x) { return x.key === k; })[0];
        return toggle('', k, 'estados', ui.estadoHTML(e ? e.label : k));
      }) },
      { id: 'sesiones', legend: t('banco.sesion'), items: [1, 2, 3, 4, 5, 6, 7].map(function (n) {
        return toggle('', n, 'sesiones', '<span class="sesion-sign sesion-sign--' + n + '" aria-hidden="true"></span><span>' + EIA.markup.escape(t('page.banco.sesionN', { n: n })) + '</span>');
      }) }
    ];
    var searchId = 'banco-buscar';
    var input = h('input', { type: 'search', id: searchId, class: 'search-input', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': searchId + '-ayuda' });
    var counter = h('p', { class: 'counter', 'aria-live': 'polite' });
    var clear = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: t('page.banco.limpiar') });
    var viewCards = h('button', { type: 'button', class: 'filter-chip filter-chip--view', 'aria-pressed': 'true', text: t('page.banco.tarjetas') });
    var viewTable = h('button', { type: 'button', class: 'filter-chip filter-chip--view', 'aria-pressed': 'false', text: t('page.banco.tabla') });
    var printBtn = h('button', { type: 'button', class: 'btn btn--small', text: t('banco.imprimir') });

    var filters = h('details', { class: 'filters zone-meaning', open: true }, [
      h('summary', { class: 'filters__summary', text: t('page.banco.filtros') }),
      h('div', { class: 'filters__body' }, groups.map(function (g) {
        return h('fieldset', { class: 'filters__group filters__group--' + g.id }, [h('legend', { text: g.legend }), h('div', { class: 'filters__chips' }, g.items)]);
      }).concat([
        h('div', { class: 'filters__search' }, [
          h('label', { for: searchId, class: 'field-label', text: t('page.banco.buscar') }),
          input,
          h('p', { id: searchId + '-ayuda', class: 'help', text: t('page.banco.buscarAyuda') })
        ])
      ]))
    ]);
    if (root.matchMedia && !root.matchMedia('(min-width: 760px)').matches) filters.open = false;

    var bar = h('div', { class: 'bank-bar' }, [
      counter, clear,
      h('div', { class: 'bank-bar__view', role: 'group', 'aria-label': t('page.banco.vista') }, [viewCards, viewTable]),
      printBtn
    ]);

    var cardList = h('ul', { class: 'bank-cards' });
    var tbody = h('tbody');
    var cols = ui.tv('page.banco.columnas') || [];
    var tableWrap = h('div', { class: 'table-wrap bank-table-wrap', role: 'region', tabindex: '0', 'aria-label': t('banco.titulo'), hidden: true }, [
      h('table', { class: 'bank-table' }, [h('thead', {}, [h('tr', {}, cols.map(function (c) { return h('th', { scope: 'col', text: c }); }))]), tbody])
    ]);
    var empty = h('p', { class: 'empty-note', hidden: true, text: t('page.banco.sinResultados') });

    var cards = {}, rows = {};
    all.forEach(function (c) {
      cards[c.id] = figureCard(c, corr[c.id]);
      rows[c.id] = tableRow(c, corr[c.id]);
      cardList.appendChild(cards[c.id]);
      tbody.appendChild(rows[c.id]);
    });

    var bankBody = ui.block(el, 'banco', t('page.banco.lista'), { class: 'bank' });
    bankBody.appendChild(filters);
    bankBody.appendChild(bar);
    bankBody.appendChild(cardList);
    bankBody.appendChild(tableWrap);
    bankBody.appendChild(empty);

    function visible() { return all.filter(function (c) { return matches(c, state); }); }

    function update() {
      var shown = visible(), ids = {};
      shown.forEach(function (c) { ids[c.id] = true; });
      all.forEach(function (c) { cards[c.id].hidden = !ids[c.id]; rows[c.id].hidden = !ids[c.id]; });
      counter.textContent = shown.length === 1 ? t('page.banco.unaCifra') : t('banco.contador', { n: shown.length });
      empty.hidden = shown.length > 0;
      var any = state.temas.length || state.tipos.length || state.estados.length || state.sesiones.length || state.q;
      clear.hidden = !any;
      cardList.hidden = state.view !== 'cards';
      tableWrap.hidden = state.view !== 'table';
      viewCards.setAttribute('aria-pressed', state.view === 'cards' ? 'true' : 'false');
      viewTable.setAttribute('aria-pressed', state.view === 'table' ? 'true' : 'false');
      printBtn.disabled = !shown.length;
    }

    filters.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.filter-chip[data-group]');
      if (!b) return;
      var g = b.getAttribute('data-group'), raw = b.getAttribute('data-value');
      var v = g === 'sesiones' ? Number(raw) : raw;
      var list = state[g], i = list.indexOf(v);
      if (i >= 0) list.splice(i, 1); else list.push(v);
      b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
      update();
    });
    var timer = 0;
    input.addEventListener('input', function () {
      root.clearTimeout(timer);
      timer = root.setTimeout(function () { state.q = input.value; update(); }, 120);
    });
    function reset() {
      state.temas = []; state.tipos = []; state.estados = []; state.sesiones = []; state.q = '';
      input.value = '';
      Array.prototype.forEach.call(filters.querySelectorAll('.filter-chip[data-group]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
      update();
    }
    clear.addEventListener('click', function () { reset(); input.focus(); });
    viewCards.addEventListener('click', function () { state.view = 'cards'; update(); });
    viewTable.addEventListener('click', function () { state.view = 'table'; update(); });
    printBtn.addEventListener('click', function () { printSheet(visible()); });

    // Corrections (KB §14): the base version struck through with one calligraphic line.
    var cBody = ui.block(el, 'correcciones', t('banco.correcciones'));
    cBody.appendChild(h('ul', { class: 'corrections' }, (cr.filas || []).map(function (f) {
      var related = (f.cifras || []).filter(function (id) { return EIA.cifra.has(id); }).map(function (id) { return EIA.cifra(id); });
      return ui.card({ tag: 'li', class: 'correction', id: 'cifras--correccion-' + f.id }, [
        h('div', { class: 'correction__old' }, [
          h('p', { class: 'label', text: t('banco.versionBase') }),
          h('p', { class: 'correction__struck' }, [h('del', { class: 'strike', text: f.antes })]),
          h('p', { class: 'correction__warning' }, [h('span', { class: 'correction__warning-sign', 'aria-hidden': 'true' }), t('banco.noUses')])
        ]),
        h('div', { class: 'correction__new' }, [
          h('p', { class: 'label', text: t('banco.versionCorrecta') }),
          h('p', { class: 'correction__text', html: mi(f.ahora) }),
          h('p', { class: 'correction__source' }, [h('span', { class: 'label', text: t('page.banco.fuente') + ': ' }), h('span', { html: mi(f.fuente) })]),
          related.length ? h('p', { class: 'correction__figs' }, [h('span', { class: 'label', text: t('page.banco.cifrasRelacionadas') + ': ' })].concat(related.map(function (c, i) {
            return [i ? ' · ' : '', h('a', { href: '#cifras/' + c.id, text: c.cifra })];
          }))) : null
        ])
      ]);
    })));

    var aBody = ui.block(el, 'actualizaciones', t('banco.actualizaciones'));
    aBody.appendChild(h('ul', { class: 'updates' }, (cr.actualizaciones || []).map(function (u) {
      return ui.card({ tag: 'li', class: 'update-card', id: 'cifras--actualizacion-' + u.id }, [
        h('h3', { class: 'card__title' }, [h('span', { class: 'estado__sign estado__sign--actualizacion', 'aria-hidden': 'true' }), h('span', { text: u.titulo })]),
        h('p', { html: mi(u.texto) })
      ]);
    })));

    update();
    api.el = el;
    api.reset = reset;
    api.show = function (id) {
      if (!cards[id]) return null;
      reset();
      state.view = 'cards';
      update();
      return cards[id];
    };
  }

  // ---------------------------------------------------------------------------------------------
  // "Imprimir esta selección": a citation sheet in #print-sheet (css/print.css shows only it).

  function printSheet(list) {
    var old = doc.getElementById('print-sheet');
    if (old) old.remove();
    var kb = EIA.data.course.kb || {};
    var sheet = h('div', { id: 'print-sheet', class: 'print-sheet' }, [
      h('h1', { text: t('page.banco.hoja.titulo') }),
      h('p', { class: 'print-sheet__note', text: t('page.banco.hoja.nota', { version: kb.version, fecha: kb.fecha }) }),
      h('ol', { class: 'print-sheet__list' }, list.map(function (c) {
        return h('li', {}, [
          h('p', { class: 'print-sheet__cifra', text: c.cifra }),
          h('p', { text: c.alcanceTexto }),
          c.clase !== 'ninguno' ? h('p', {}, [h('strong', { text: t('page.banco.hoja.tipo') + ': ' }), c.tipo]) : null,
          c.estado ? h('p', {}, [h('strong', { text: t('page.banco.hoja.estado') + ': ' }), c.estado]) : null,
          h('p', {}, [h('strong', { text: t('page.banco.hoja.url') + ': ' }), c.fuentesList.map(function (f) { return f.etiqueta + ', ' + f.url; }).join('; ')])
        ]);
      }))
    ]);
    doc.body.appendChild(sheet);
    doc.body.setAttribute('data-print', 'banco');
    function done() {
      doc.body.removeAttribute('data-print');
      sheet.remove();
      root.removeEventListener('afterprint', done);
    }
    root.addEventListener('afterprint', done);
    root.setTimeout(function () { root.print(); }, 60);
  }

  ui.banco = {
    mount: mount,
    matches: matches,
    focus: function (id) { return api.show ? api.show(id) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
