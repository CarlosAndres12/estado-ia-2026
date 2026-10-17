/* Estado de la IA 2026 — the rubric of the final project (prompt §10.9, KB §11).
 *
 *   EIA.ui.rubrica.mount(el)        #proyecto "Rúbrica" (views.js hook): the KB rubric as a table where
 *       the team or the facilitator picks a level per criterion; "Puntaje de la rúbrica: NN/100" with
 *       the note "Autoevaluación orientativa: la calificación la asigna el docente."; per criterion,
 *       the KB feedback steps as fields ("Evidencia tomada del texto", "Acción para subir un nivel").
 *       Levels and feedback are kept with the active team notebook (EIA.ui.cuaderno.model), so the
 *       notebook prints them and each team keeps its own.
 *   EIA.ui.rubrica.score(niveles, rubrica?) -> Σ peso × fracción (4 = 100%, 3 = 75%, 2 = 50%, 1 = 25%)
 *   EIA.ui.rubrica.formato(score) -> '72,5' · texto(niveles) -> 'Puntaje de la rúbrica: 72,5/100'
 *   EIA.ui.rubrica.printBlock(nb) -> the rubric block of the printed notebook
 * Pure parts are DOM-free (tools/test/interactions.test.mjs). Every string comes from js/data. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var R = ui.rubrica = ui.rubrica || {};

  function data() { return EIA.data.rubrica || { criterios: [], niveles: [], fracciones: {} }; }
  function copy(key, vars) {
    var c = (EIA.data.course && EIA.data.course.ui && EIA.data.course.ui.rubrica) || {};
    var v = c[key];
    if (typeof v !== 'string') return '';
    return v.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? String(vars[k]) : ''; });
  }

  // ---------------------------------------------------------------------------------------------
  // Pure

  R.score = function (niveles, rubrica) {
    var r = rubrica || data(), total = 0;
    niveles = niveles || {};
    (r.criterios || []).forEach(function (c) {
      var n = Number(niveles[c.id]);
      var f = r.fracciones ? r.fracciones[n] : undefined;
      if (Math.round(n) === n && typeof f === 'number') total += c.peso * f;
    });
    return Math.round(total * 100) / 100;
  };

  R.formato = function (score) {
    var v = Math.round(Number(score || 0) * 100) / 100;
    var d = Math.round(v) === v ? 0 : (Math.round(v * 10) === v * 10 ? 1 : 2);
    return EIA.util.formatNumber(v, d);
  };

  R.texto = function (niveles) { return copy('puntaje', { puntaje: R.formato(R.score(niveles)) }); };

  function levelLabel(n) {
    var l = (data().niveles || []).filter(function (x) { return x.n === n; })[0];
    return l ? l.label + ' (' + n + ')' : '';
  }

  // ---------------------------------------------------------------------------------------------
  // Storage: the active team notebook when the notebook is there, else this page only.

  var memory = { niveles: {}, retro: {} };
  function model() { return ui.cuaderno && ui.cuaderno.model ? ui.cuaderno.model : null; }
  function state() {
    var m = model();
    var r = m ? m.get(['rubrica']) : memory;
    return r && typeof r === 'object' ? { niveles: r.niveles || {}, retro: r.retro || {} } : { niveles: {}, retro: {} };
  }
  function set(path, value, source) {
    var m = model();
    if (m) { m.set(['rubrica'].concat(path), value, source); return; }
    var o = memory;
    for (var i = 0; i < path.length - 1; i++) o = o[path[i]] = o[path[i]] || {};
    o[path[path.length - 1]] = value;
  }

  // ---------------------------------------------------------------------------------------------
  // View

  R.mount = function (el) {
    var h = ui.h, kit = ui.kit, r = data();
    if (!r.criterios || !r.criterios.length) return null;
    var source = kit.uid('rubrica');
    var levels = (r.niveles || []).slice().sort(function (a, b) { return b.n - a.n; });
    var radios = {};
    var who = h('p', { class: 'rubric__who' });
    var scoreEl = h('p', { class: 'rubric__score', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    var meter = h('span', { class: 'rubric__meter-fill' });
    var pending = h('p', { class: 'rubric__pending' });
    var tableId = kit.uid('rubrica-tabla');

    var body = h('tbody', {}, r.criterios.map(function (c) {
      var name = kit.uid('nivel-' + c.id);
      var rowHead = h('th', { scope: 'row', id: name + '-c', text: c.criterio });
      radios[c.id] = [];
      return h('tr', { class: 'rubric__row' }, [rowHead, h('td', { class: 'num rubric__peso', text: copy('peso', { peso: c.peso }) })].concat(levels.map(function (l) {
        var id = name + '-' + l.n;
        var input = h('input', { type: 'radio', id: id, name: name, value: String(l.n), class: 'rubric__radio', 'aria-describedby': name + '-c' });
        input.addEventListener('change', function () {
          if (!input.checked) return;
          set(['niveles', c.id], l.n, source);
          update();
        });
        radios[c.id].push(input);
        return h('td', { class: 'rubric__cell' }, [h('label', { class: 'rubric__option', for: id }, [
          input,
          h('span', { class: 'rubric__mark', 'aria-hidden': 'true' }),
          h('span', { class: 'visually-hidden', text: levelLabel(l.n) + ': ' }),
          h('span', { class: 'rubric__desc', html: kit.mi((c.niveles || {})[l.n] || '') })
        ])]);
      })));
    }));
    var table = h('table', { class: 'rubric-table rubric-table--pick', id: tableId }, [
      h('thead', {}, [h('tr', {}, (r.columnas || []).map(function (col) { return h('th', { scope: 'col', text: col }); }))]),
      body
    ]);
    var clear = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: copy('limpiar') });
    clear.addEventListener('click', function () {
      set(['niveles'], {}, source);
      sync();
    });

    var retro = h('div', { class: 'rubric__retro' }, r.criterios.map(function (c) {
      function field(key, label) {
        var id = kit.uid('retro');
        var ta = h('textarea', { id: id, class: 'sheet-input sheet-text', rows: 2 });
        ta.setAttribute('data-crit', c.id);
        ta.setAttribute('data-key', key);
        ta.addEventListener('input', function () {
          var cur = state().retro[c.id] || {};
          set(['retro', c.id], { evidencia: key === 'evidencia' ? ta.value : (cur.evidencia || ''), accion: key === 'accion' ? ta.value : (cur.accion || '') }, source);
        });
        return h('div', { class: 'sheet-field' }, [h('label', { class: 'sheet-label', for: id, text: label }), ta]);
      }
      return h('fieldset', { class: 'rubric__crit' }, [
        h('legend', { class: 'rubric__crit-title' }, [c.criterio, ' ', h('span', { class: 'rubric__crit-level' })]),
        h('div', { class: 'rubric__crit-fields' }, [field('evidencia', copy('evidencia')), field('accion', copy('accion'))])
      ]);
    }));

    var box = h('div', { class: 'rubric', role: 'region', 'aria-label': copy('region') }, [
      r.nota ? h('p', { class: 'rubric__kb-note', html: kit.mi(r.nota) }) : null,
      h('p', { class: 'help rubric__help', text: copy('elegir') }),
      who,
      kit.card('card--table rubric__card', [h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': r.titulo || '' }, [table])]),
      kit.card('rubric__result', [
        scoreEl,
        h('span', { class: 'rubric__meter', 'aria-hidden': 'true' }, [meter]),
        pending,
        h('p', { class: 'rubric__disclaimer' }, [h('span', { class: 'rubric__disclaimer-sign', 'aria-hidden': 'true' }), copy('nota')]),
        h('p', { class: 'rubric__actions' }, [clear])
      ]),
      h('h3', { class: 'subtitle', text: copy('retro') }),
      h('p', { class: 'help', text: copy('retroAyuda') }),
      retro
    ]);
    el.appendChild(box);

    function update() {
      var st = state();
      var score = R.score(st.niveles);
      scoreEl.textContent = R.texto(st.niveles);
      meter.style.width = Math.max(0, Math.min(100, score)) + '%';
      var missing = r.criterios.filter(function (c) { return !radios[c.id].some(function (x) { return x.checked; }); }).length;
      pending.textContent = missing ? copy('pendientes', { n: missing }) : copy('completa');
      Array.prototype.forEach.call(retro.querySelectorAll('.rubric__crit'), function (fs, i) {
        var n = st.niveles[r.criterios[i].id];
        fs.querySelector('.rubric__crit-level').textContent = n ? '· ' + levelLabel(n) : '';
      });
    }
    function sync() {
      var st = state();
      r.criterios.forEach(function (c) {
        radios[c.id].forEach(function (x) { x.checked = Number(x.value) === st.niveles[c.id]; });
      });
      Array.prototype.forEach.call(retro.querySelectorAll('textarea'), function (ta) {
        var v = st.retro[ta.getAttribute('data-crit')] || {};
        ta.value = v[ta.getAttribute('data-key')] || '';
      });
      var m = model();
      who.textContent = m ? copy('cuaderno', { equipo: m.active().campos.equipo || copy('sinNombre') }) : '';
      who.hidden = !m;
      update();
    }
    var off = model() ? model().on(function (ev) {
      if (ev.type === 'switch') sync();
      else if (ev.type === 'set' && ev.source !== source && (ev.path[0] === 'rubrica' || ev.path[0] === 'campos')) sync();
    }) : function () {};
    sync();
    return { destroy: function () { off(); box.remove(); } };
  };

  // The rubric in the printed notebook: chosen level per criterion, score, note and feedback.
  R.printBlock = function (nb) {
    var h = ui.h, r = data();
    if (!h || !r.criterios) return null;
    var st = nb && nb.rubrica ? nb.rubrica : { niveles: {}, retro: {} };
    var none = (EIA.data.course.ui.cuaderno || {}).sinNivel || '';
    return h('section', { class: 'print-cuaderno__hoja print-cuaderno__rubrica' }, [
      h('h2', { text: (EIA.data.course.ui.cuaderno || {}).rubrica || r.titulo }),
      h('table', {}, [
        h('thead', {}, [h('tr', {}, [h('th', { text: (r.columnas || [])[0] || '' }), h('th', { text: (r.columnas || [])[1] || '' }), h('th', { text: copy('elegido') })])]),
        h('tbody', {}, r.criterios.map(function (c) {
          var n = st.niveles[c.id];
          return h('tr', {}, [
            h('th', { scope: 'row', text: c.criterio }),
            h('td', { class: 'num', text: copy('peso', { peso: c.peso }) }),
            h('td', { text: n ? levelLabel(n) + ' · ' + EIA.markup.plain((c.niveles || {})[n] || '') : none })
          ]);
        }))
      ]),
      h('p', { class: 'print-cuaderno__score', text: R.texto(st.niveles) }),
      h('p', { text: copy('nota') }),
      h('div', {}, r.criterios.map(function (c) {
        var f = st.retro[c.id] || {};
        if (!f.evidencia && !f.accion) return null;
        return h('div', { class: 'print-cuaderno__item' }, [
          h('p', { class: 'print-cuaderno__label', text: c.criterio }),
          f.evidencia ? h('p', { class: 'print-cuaderno__value', text: copy('evidencia') + ': ' + f.evidencia }) : null,
          f.accion ? h('p', { class: 'print-cuaderno__value', text: copy('accion') + ': ' + f.accion }) : null
        ]);
      }))
    ]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
