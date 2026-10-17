/* Estado de la IA 2026 — "Cuaderno del equipo" (prompt §10.7): the session products of each team.
 *
 * Several notebooks live side by side in this browser (EIA.util.store, every access guarded); a
 * notebook is one team. "Exportar" / "Importar" move it as a .json file within the team, "Copiar
 * como texto" and "Imprimir cuaderno" (the notebook, the rubric and the decision log) take it out.
 * Every label is the KB's, from EIA.data.cuaderno (js/data/actividades.js); the chrome is
 * EIA.data.course.ui.cuaderno. The site never writes for the team: no auto-fill, no generated text.
 * A gentle note asks "¿Es un dato personal?…" when a text looks like it names or identifies someone;
 * it never blocks.
 *
 *   EIA.ui.cuaderno.mount(el)                       the whole notebook (#proyecto, views.js hook); each
 *                                                   sheet is section#proyecto--hoja-<hojaId>
 *   EIA.ui.cuaderno.mountSheet(el, hojaId, { secciones })   one sheet, bound to the active notebook
 *                                                   (the activity tools of the sessions and Modo clase)
 *   EIA.ui.cuaderno.note({ sesion, texto })         adds a discussion question for the team to answer
 *   EIA.ui.cuaderno.model                           active notebook, list, get/set, change listeners
 *   EIA.ui.cuaderno.preparePrint() -> cleanup()     builds #print-cuaderno and sets body[data-print]
 *   Pure (tools/test/interactions.test.mjs): detect(text) -> ['nombre'|'numero'|'correo'|'telefono'],
 *   blank(o), normalize(obj), serialize(nb), parse(text) -> { ok, cuaderno | error }, toText(nb).
 *
 * Also registers EIA.ui.tools.ficha / tabla / plan: the session activities that feed a sheet mount
 * that sheet (actividad.hoja; actividad.secciones narrows it to some sections). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;
  var C = ui.cuaderno = ui.cuaderno || {};

  var FORMATO = 'eia-cuaderno';
  var VERSION = 1;

  function K() { return ui.kit; }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  // Chrome copy of the notebook (EIA.data.course.ui.cuaderno), DOM-free so the tests can use it.
  function cq(key, vars) {
    var c = (EIA.data.course && EIA.data.course.ui && EIA.data.course.ui.cuaderno) || {};
    var v = c[key];
    if (typeof v !== 'string') return '';
    return v.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? String(vars[k]) : ''; });
  }
  function schema() { return EIA.data.cuaderno || { campos: [], hojas: [] }; }
  function hojaById(id) { return (schema().hojas || []).filter(function (x) { return x.id === id; })[0] || null; }
  function slug(text) { return EIA.util.slug(text); }
  function fold(text) { return EIA.util.fold(text); }

  // =============================================================================================
  // Pure: personal-data check

  // Words that start a sentence or a phrase in Spanish; they do not make a name with the next word.
  var STOP = ('el la los las un una unos unas en de del al a ante con sin por para si no se es y o u lo le su sus mi mis tu ' +
    'este esta estos estas ese esa esos esas aquel cada cuando como donde que qué quien quién cómo dónde cuál pero ' +
    'también luego después antes primero segundo hoy ayer mañana entre desde hasta hacia según sobre tras durante ' +
    'nuestro nuestra nuestros nuestras todo toda todos todas otro otra ya aquí allí así').split(' ');
  var CAP_RUN = /[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+/g;
  var EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}/;
  // Phones group digits with spaces or hyphens; ids and file numbers run on, or with dots.
  var PHONE = /(?:\+\d{1,3}[\s-]?(?:\(\d{1,4}\)[\s-]?)?\d{2,4}(?:[\s-]\d{2,4}){1,4}|\(\d{1,4}\)[\s-]?\d{2,4}(?:[\s-]\d{2,4}){1,4}|\b\d{2,4}(?:[\s-]\d{2,4}){2,4}\b)/g;
  var DIGIT_RUN = /\d(?:\.?\d){7,}/g;
  var MONEY_BEFORE = /(?:\$|US\$|COP|USD|EUR)\s*$/i;
  var MONEY_AFTER = /^\s*(?:pesos|cop|usd|us\$|dólares|dolares|euros|eur|millones|mil)\b/i;

  function digits(s) { return (String(s).match(/\d/g) || []).length; }

  C.detect = function (text) {
    var s = String(text == null ? '' : text);
    var found = [];
    if (!s.trim()) return found;
    // Names: two or more capitalized words in a row, once sentence words are set aside.
    var m, named = false;
    CAP_RUN.lastIndex = 0;
    while (!named && (m = CAP_RUN.exec(s)) !== null) {
      var words = m[0].split(/\s+/);
      while (words.length && STOP.indexOf(words[0].toLowerCase()) >= 0) words.shift();
      if (words.length >= 2) named = true;
    }
    if (named) found.push('nombre');
    if (EMAIL.test(s)) found.push('correo');
    // Phone numbers: a country or area code, or three or more digit groups with 7+ digits.
    var phone = false, rest = s;
    PHONE.lastIndex = 0;
    while (!phone && (m = PHONE.exec(s)) !== null) {
      var d = digits(m[0]);
      if (d >= 7 && d <= 15 && !MONEY_BEFORE.test(s.slice(0, m.index)) && !MONEY_AFTER.test(s.slice(m.index + m[0].length))) {
        phone = true;
        rest = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length);
      }
    }
    if (phone) found.push('telefono');
    // Long digit runs (ids, file numbers), unless they are an amount of money.
    DIGIT_RUN.lastIndex = 0;
    while ((m = DIGIT_RUN.exec(rest)) !== null) {
      if (MONEY_BEFORE.test(rest.slice(0, m.index)) || MONEY_AFTER.test(rest.slice(m.index + m[0].length))) continue;
      found.push('numero');
      break;
    }
    return found;
  };

  // =============================================================================================
  // Pure: notebook data

  function newId() {
    return 'c-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
  }
  function campoIds() { return (schema().campos || []).map(function (c) { return c.id; }); }

  C.blank = function (o) {
    o = o || {};
    var now = o.now || new Date().toISOString();
    var campos = {};
    campoIds().forEach(function (id) { campos[id] = ''; });
    return { formato: FORMATO, version: VERSION, id: o.id || newId(), creado: now, actualizado: now, campos: campos, hojas: {}, notas: [], rubrica: { niveles: {}, retro: {} } };
  };

  var BAD_KEYS = ['__proto__', 'constructor', 'prototype'];
  function badKey(k) { return BAD_KEYS.indexOf(k) >= 0; }
  function clean(v, depth) {
    if (depth > 8) return undefined;
    if (typeof v === 'string') return v.length > 20000 ? v.slice(0, 20000) : v;
    if (typeof v === 'number') return isFinite(v) ? v : undefined;
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) {
      return v.slice(0, 300).map(function (x) { return clean(x, depth + 1); }).filter(function (x) { return x !== undefined; });
    }
    if (v && typeof v === 'object') {
      var out = {};
      Object.keys(v).slice(0, 300).forEach(function (k) {
        if (badKey(k)) return;
        var c = clean(v[k], depth + 1);
        if (c !== undefined) out[k] = c;
      });
      return out;
    }
    return undefined;
  }
  function str(v) { return typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : ''); }

  C.normalize = function (obj) {
    obj = obj && typeof obj === 'object' ? obj : {};
    var out = C.blank({ id: typeof obj.id === 'string' && obj.id ? obj.id.slice(0, 80) : undefined, now: str(obj.creado) || undefined });
    out.actualizado = str(obj.actualizado) || out.creado;
    var campos = obj.campos && typeof obj.campos === 'object' ? obj.campos : {};
    Object.keys(out.campos).forEach(function (k) { out.campos[k] = str(campos[k]); });
    var hojas = clean(obj.hojas, 0);
    out.hojas = hojas && !Array.isArray(hojas) ? hojas : {};
    out.notas = (Array.isArray(obj.notas) ? obj.notas : []).filter(function (n) { return n && typeof n === 'object'; }).map(function (n) {
      var s = Number(n.sesion);
      return { sesion: s >= 1 && s <= 7 ? Math.round(s) : null, pregunta: str(n.pregunta), respuesta: str(n.respuesta) };
    });
    var r = obj.rubrica && typeof obj.rubrica === 'object' ? obj.rubrica : {};
    var niveles = r.niveles && typeof r.niveles === 'object' ? r.niveles : {};
    var retro = r.retro && typeof r.retro === 'object' ? r.retro : {};
    Object.keys(niveles).forEach(function (k) {
      var n = Number(niveles[k]);
      if (!badKey(k) && n >= 1 && n <= 4 && Math.round(n) === n) out.rubrica.niveles[k] = n;
    });
    Object.keys(retro).forEach(function (k) {
      var x = retro[k];
      if (badKey(k) || !x || typeof x !== 'object') return;
      out.rubrica.retro[k] = { evidencia: str(x.evidencia), accion: str(x.accion) };
    });
    return out;
  };

  C.serialize = function (nb) { return JSON.stringify(C.normalize(nb), null, 2); };

  C.parse = function (text) {
    var obj;
    try { obj = JSON.parse(String(text == null ? '' : text).replace(/^﻿/, '')); } catch (err) { return { ok: false, error: 'json' }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj.formato !== FORMATO) return { ok: false, error: 'formato' };
    return { ok: true, cuaderno: C.normalize(obj) };
  };

  function get(obj, path) {
    var v = obj;
    for (var i = 0; i < path.length; i++) { if (v == null) return undefined; v = v[path[i]]; }
    return v;
  }

  // Display value of one column/field (option labels instead of ids).
  function optionsOf(col) {
    if (col.opcionesDe) {
      var a = (EIA.data.actividades || {})[col.opcionesDe];
      return a && a.niveles ? a.niveles.map(function (n) { return { id: n.id, label: n.nivel }; }) : [];
    }
    if (col.tipo === 'sino') return [{ id: 'si', label: cq('si') }, { id: 'no', label: cq('no') }];
    var opts = col.opciones || [];
    if (col.ayuda === 's5-escalera') {
      var esc = (EIA.data.actividades || {})['s5-escalera'];
      if (esc && esc.peldanos) return opts.map(function (o, i) { return { id: o.id, label: o.label + ' · ' + (esc.peldanos[i] || '') }; });
    }
    return opts;
  }
  function display(col, v) {
    if (v == null || v === '') return '';
    if (col.tipo === 'opcion' || col.tipo === 'sino') {
      var o = optionsOf(col).filter(function (x) { return x.id === v; })[0];
      return o ? o.label : String(v);
    }
    if (col.tipo === 'numero') return EIA.util.formatNumber(v);
    if (col.tipo === 'fecha') return String(v);
    return String(v);
  }
  function rowCount(sec, rows) { return Math.max(sec.min || 0, (rows || []).length); }

  // Same-unit sum of the "Costo total" checklist; null when units differ or nothing is marked.
  function costSum(sec, val) {
    val = val || {};
    var unit = null, total = 0, any = false, ok = true;
    sec.items.forEach(function (it) {
      var x = val[it.id];
      if (!x || !x.marcado || x.monto === '' || x.monto == null || !isFinite(Number(x.monto))) return;
      var u = String(x.unidad || '').trim().replace(/\s+/g, ' ');
      if (unit === null) unit = u;
      else if (fold(unit) !== fold(u)) ok = false;
      total += Number(x.monto);
      any = true;
    });
    if (!any || !ok) return null;
    return { total: total, unidad: unit };
  }
  C.costSum = costSum;

  /* entries(nb, hoja) -> [{ title?, items: [{ label, value }] }]: the sheet as text, for "Copiar
   * como texto" and the printed notebook. */
  function entries(nb, hoja) {
    var data = (nb.hojas || {})[hoja.id] || {};
    var groups = [];
    hoja.secciones.forEach(function (sec) {
      var v = data[sec.id];
      var title = sec.titulo || sec.label || '';
      if (sec.tipo === 'campos') {
        groups.push({ title: sec.titulo || '', items: sec.campos.map(function (c) { return { label: c.label, value: str(get(v, [c.id])) }; }) });
      } else if (sec.tipo === 'filas') {
        var rows = Array.isArray(v) ? v : [];
        for (var i = 0; i < rowCount(sec, rows); i++) {
          var row = rows[i] || {};
          groups.push({ title: (sec.fila || '') + ' ' + (i + 1), items: sec.columnas.map(function (col) { return { label: col.label, value: display(col, row[col.id]) }; }) });
        }
      } else if (sec.tipo === 'eleccion') {
        var chosen = (get(v, ['elegidos']) || []).filter(function (id) { return sec.opciones.some(function (o) { return o.id === id; }); });
        var items = [{ label: title, value: chosen.map(function (id) { return sec.opciones.filter(function (o) { return o.id === id; })[0].label; }).join(', ') }];
        chosen.forEach(function (id) {
          var o = sec.opciones.filter(function (x) { return x.id === id; })[0];
          items.push({ label: o.label + ' · ' + sec.campo.label, value: str(get(v, ['porque', id])) });
        });
        groups.push({ title: '', items: items });
      } else if (sec.tipo === 'opcion') {
        groups.push({ title: '', items: [{ label: sec.label, value: display({ tipo: 'opcion', opciones: sec.opciones }, v) }] });
      } else if (sec.tipo === 'matriz') {
        sec.filas.forEach(function (f) {
          groups.push({ title: (sec.titulo ? sec.titulo + ' · ' : '') + f, items: sec.columnas.map(function (col) { return { label: col, value: str(get(v, [slug(f), slug(col)])) }; }) });
        });
      } else if (sec.tipo === 'costos') {
        var cs = [];
        sec.items.forEach(function (it) {
          var x = get(v, [it.id]);
          if (x && x.marcado) cs.push({ label: it.label, value: [x.monto === '' || x.monto == null ? '' : EIA.util.formatNumber(x.monto), str(x.unidad)].join(' ').trim() });
        });
        var sum = costSum(sec, v);
        if (sum) cs.push({ label: '', value: cq('suma', { total: EIA.util.formatNumber(sum.total), unidad: sum.unidad }) });
        groups.push({ title: title, items: cs.length ? cs : [{ label: '', value: '' }] });
      } else if (sec.tipo === 'texto') {
        groups.push({ title: '', items: [{ label: sec.label, value: str(v) }] });
      } else if (sec.tipo === 'cifras') {
        var ids = Array.isArray(v) ? v.filter(function (id) { return EIA.cifra.has(id); }) : [];
        groups.push({ title: '', items: ids.length ? ids.map(function (id) { return { label: '', value: EIA.util.citation(id) }; }) : [{ label: '', value: '' }] });
      }
    });
    return groups;
  }
  function hojaTitle(hoja) { return (hoja.sesion ? cq('sesion', { n: hoja.sesion }) + ' · ' : '') + hoja.titulo; }

  C.toText = function (nb) {
    nb = C.normalize(nb);
    var empty = cq('vacio') || '—';
    var lines = [cq('titulo')];
    (schema().campos || []).forEach(function (c) { lines.push(c.label + ': ' + (nb.campos[c.id] || empty)); });
    (schema().hojas || []).forEach(function (hoja) {
      lines.push('', hojaTitle(hoja), '');
      entries(nb, hoja).forEach(function (g) {
        if (g.title) lines.push(g.title.trim());
        g.items.forEach(function (it) {
          if (it.label) lines.push((g.title ? '  ' : '') + it.label);
          lines.push((g.title ? '    ' : '  ') + (it.value || empty));
        });
      });
    });
    if (nb.notas.length) {
      lines.push('', cq('notas'), '');
      nb.notas.forEach(function (n) {
        lines.push((n.sesion ? cq('sesion', { n: n.sesion }) + ' · ' : '') + n.pregunta);
        lines.push('  ' + (n.respuesta || empty));
      });
    }
    return lines.join('\n') + '\n';
  };

  // =============================================================================================
  // Model: the notebooks of this browser and change listeners

  var INDEX_KEY = 'cuaderno:indice';
  function nbKey(id) { return 'cuaderno:' + id; }

  var model = C.model = (function () {
    var store = EIA.util.store;
    var index = null, books = {}, listeners = [], timer = 0, pending = {}, saved = true;

    function load() {
      if (index) return;
      var raw = store.get(INDEX_KEY, null);
      index = { lista: [], activo: '' };
      if (raw && Array.isArray(raw.lista)) {
        raw.lista.forEach(function (it) {
          if (!it || typeof it.id !== 'string') return;
          var nb = store.get(nbKey(it.id), null);
          if (!nb) return;
          books[it.id] = C.normalize(nb);
          index.lista.push(it.id);
        });
        if (raw.activo && books[raw.activo]) index.activo = raw.activo;
      }
      if (!index.activo && index.lista.length) index.activo = index.lista[0];
    }
    function writeIndex() {
      return store.set(INDEX_KEY, { lista: index.lista.map(function (id) { return { id: id, equipo: books[id].campos.equipo || '' }; }), activo: index.activo });
    }
    function flush() {
      root.clearTimeout(timer);
      timer = 0;
      var ok = true;
      Object.keys(pending).forEach(function (id) { if (books[id]) ok = store.set(nbKey(id), books[id]) && ok; });
      pending = {};
      ok = writeIndex() && ok;
      saved = ok;
      emit({ type: 'saved', ok: ok });
      return ok;
    }
    function schedule(id) {
      pending[id] = true;
      root.clearTimeout(timer);
      timer = root.setTimeout(flush, 350);
    }
    function emit(ev) {
      listeners.slice().forEach(function (fn) { try { fn(ev); } catch (err) { if (root.console) root.console.warn('[cuaderno] ' + err.message); } });
    }
    function ensure() {
      load();
      if (!index.activo) {
        var nb = C.blank();
        books[nb.id] = nb;
        index.lista.push(nb.id);
        index.activo = nb.id;
        schedule(nb.id);
      }
      return books[index.activo];
    }
    if (root.addEventListener) root.addEventListener('pagehide', function () { if (timer) flush(); });

    return {
      active: ensure,
      activeId: function () { ensure(); return index.activo; },
      list: function () { ensure(); return index.lista.map(function (id) { return books[id]; }); },
      saved: function () { return saved; },
      get: function (path) { return get(ensure(), path); },
      set: function (path, value, source) {
        var nb = ensure(), o = nb;
        for (var i = 0; i < path.length - 1; i++) {
          var k = path[i], next = path[i + 1];
          if (Array.isArray(o) && typeof k === 'number') while (o.length < k) o.push({});
          if (o[k] == null || typeof o[k] !== 'object') o[k] = typeof next === 'number' ? [] : {};
          o = o[k];
        }
        var last = path[path.length - 1];
        if (Array.isArray(o) && typeof last === 'number') while (o.length < last) o.push({});
        o[last] = value;
        nb.actualizado = new Date().toISOString();
        schedule(nb.id);
        emit({ type: 'set', path: path, source: source || null });
      },
      select: function (id) {
        ensure();
        if (!books[id] || id === index.activo) return;
        if (timer) flush();
        index.activo = id;
        writeIndex();
        emit({ type: 'switch' });
      },
      create: function () {
        ensure();
        if (timer) flush();
        var nb = C.blank();
        books[nb.id] = nb;
        index.lista.push(nb.id);
        index.activo = nb.id;
        schedule(nb.id);
        flush();
        emit({ type: 'switch' });
        return nb;
      },
      remove: function (id) {
        ensure();
        if (!books[id]) return;
        if (timer) flush();
        delete books[id];
        index.lista = index.lista.filter(function (x) { return x !== id; });
        store.remove(nbKey(id));
        if (index.activo === id) index.activo = index.lista[0] || '';
        ensure();
        flush();
        emit({ type: 'switch' });
      },
      // Adds an imported notebook; keeps a newer local version of the same id (the import becomes a copy).
      add: function (nb) {
        ensure();
        if (timer) flush();
        var copy = false;
        if (books[nb.id] && String(books[nb.id].actualizado) > String(nb.actualizado)) { nb.id = newId(); copy = true; }
        if (index.lista.indexOf(nb.id) < 0) index.lista.push(nb.id);
        books[nb.id] = nb;
        index.activo = nb.id;
        schedule(nb.id);
        flush();
        emit({ type: 'switch' });
        return { cuaderno: nb, copia: copy };
      },
      flush: flush,
      on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
    };
  })();

  // =============================================================================================
  // Fields

  // A note that appears beside a field whose text looks like personal data; it never blocks.
  function watchPersonal(field, holder) {
    var note = null, t = 0;
    function check() {
      var hit = C.detect(field.value).length > 0;
      if (hit && !note) {
        note = h('p', { class: 'sticky-note', id: K().uid('nota-personal'), role: 'note' }, [h('span', { class: 'sticky-note__pin', 'aria-hidden': 'true' }), cq('datoPersonal')]);
        holder.appendChild(note);
        field.setAttribute('aria-describedby', ((field.getAttribute('aria-describedby') || '') + ' ' + note.id).trim());
      } else if (!hit && note) {
        field.setAttribute('aria-describedby', (field.getAttribute('aria-describedby') || '').replace(note.id, '').trim());
        if (!field.getAttribute('aria-describedby')) field.removeAttribute('aria-describedby');
        note.remove();
        note = null;
      }
    }
    field.addEventListener('input', function () { root.clearTimeout(t); t = root.setTimeout(check, 450); });
    check();
  }

  function autosize(ta) {
    function fit() { ta.style.height = 'auto'; ta.style.height = Math.min(600, Math.max(ta.scrollHeight + 4, 52)) + 'px'; }
    ta.addEventListener('input', fit);
    root.requestAnimationFrame ? root.requestAnimationFrame(fit) : fit();
  }

  // A labeled text area bound to path.
  function textField(ctx, path, label, opts) {
    opts = opts || {};
    var id = K().uid('campo');
    var ta = h(opts.input ? 'input' : 'textarea', { id: id, class: 'sheet-input' + (opts.input ? '' : ' sheet-text'), rows: opts.input ? null : (opts.rows || 2), type: opts.input ? 'text' : null, 'aria-label': opts.aria || null });
    ta.value = str(model.get(path));
    ta.addEventListener('input', function () { model.set(path, ta.value, ctx.source); });
    var wrap = h('div', { class: 'sheet-field' + (opts.cls ? ' ' + opts.cls : '') }, [
      label ? h('label', { class: 'sheet-label', for: id, text: label }) : null, ta
    ]);
    if (!opts.input) autosize(ta);
    // The team's and the case's own names are names by design: no personal-data note there.
    if (!opts.noWatch) watchPersonal(ta, wrap);
    return wrap;
  }

  function selectField(ctx, path, label, options, opts) {
    opts = opts || {};
    var id = K().uid('opcion');
    var sel = h('select', { id: id, class: 'sheet-input sheet-select', 'aria-label': opts.aria || null }, [h('option', { value: '', text: cq('elegirOpcion') })].concat(options.map(function (o) {
      return h('option', { value: o.id, text: o.label });
    })));
    sel.value = str(model.get(path));
    sel.addEventListener('change', function () { model.set(path, sel.value, ctx.source); if (opts.onChange) opts.onChange(sel.value); });
    return h('div', { class: 'sheet-field' }, [label ? h('label', { class: 'sheet-label', for: id, text: label }) : null, sel]);
  }

  function radioGroup(ctx, path, legend, options) {
    var name = K().uid('radio');
    var current = str(model.get(path));
    return h('fieldset', { class: 'sheet-radios' }, [h('legend', { class: 'sheet-label', text: legend })].concat(options.map(function (o) {
      var id = K().uid('r');
      var input = h('input', { type: 'radio', id: id, name: name, value: o.id });
      input.checked = current === o.id;
      input.addEventListener('change', function () { if (input.checked) model.set(path, o.id, ctx.source); });
      return h('label', { class: 'sheet-radio', for: id }, [input, h('span', { text: o.label })]);
    })));
  }

  // ---- Section renderers ------------------------------------------------------------------------

  function secCampos(ctx, base, sec) {
    return h('div', { class: 'sheet-sec sheet-sec--campos' }, sec.campos.map(function (c) {
      return textField(ctx, base.concat([sec.id, c.id]), c.label, { rows: 3 });
    }));
  }

  function secFilas(ctx, base, sec, rerender, host) {
    var path = base.concat([sec.id]);
    var rows = model.get(path);
    rows = Array.isArray(rows) ? rows : [];
    var n = rowCount(sec, rows);
    var box = h('div', { class: 'sheet-sec sheet-sec--filas', 'data-sec': sec.id });
    for (var i = 0; i < n; i++) (function (i) {
      var rowPath = path.concat([i]);
      var legend = (sec.fila || '') + ' ' + (i + 1);
      var fields = sec.columnas.map(function (col) {
        var p = rowPath.concat([col.id]);
        if (col.tipo === 'opcion' || col.tipo === 'sino') {
          return selectField(ctx, p, col.label, optionsOf(col), { onChange: function () { applyConditions(); } });
        }
        if (col.tipo === 'numero' || col.tipo === 'fecha') {
          var id = K().uid('n');
          var input = h('input', { id: id, type: col.tipo === 'numero' ? 'number' : 'date', class: 'sheet-input', min: col.tipo === 'numero' ? '0' : null, step: col.tipo === 'numero' ? '1' : null, inputmode: col.tipo === 'numero' ? 'numeric' : null });
          input.value = str(model.get(p));
          input.addEventListener('input', function () {
            var v = col.tipo === 'numero' ? (input.value === '' ? '' : Number(input.value)) : input.value;
            model.set(p, v, ctx.source);
          });
          var wrap = h('div', { class: 'sheet-field sheet-field--short', 'data-col': col.id }, [h('label', { class: 'sheet-label', for: id, text: col.label }), input]);
          if (col.si) {
            var cond = display({ tipo: 'opcion', opciones: optionsOf(sec.columnas.filter(function (x) { return x.id === col.si.campo; })[0] || {}) }, col.si.valor);
            wrap.appendChild(h('p', { class: 'sheet-cond help', text: cq('soloSi', { valor: cond.split(' (')[0] }) }));
          }
          return wrap;
        }
        return textField(ctx, p, col.label, { rows: 2 });
      });
      fields.forEach(function (f, j) { f.setAttribute('data-col', sec.columnas[j].id); });
      function applyConditions() {
        sec.columnas.forEach(function (col, j) {
          if (!col.si) return;
          var on = str(model.get(rowPath.concat([col.si.campo]))) === col.si.valor;
          var input = fields[j].querySelector('input, select, textarea');
          if (input) input.disabled = !on;
          fields[j].classList.toggle('is-off', !on);
        });
      }
      var head = h('div', { class: 'sheet-row__head' }, [h('span', { class: 'sheet-row__title', text: legend })]);
      if (i >= (sec.min || 0)) {
        var del = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: cq('quitarFila', { fila: legend }) });
        del.addEventListener('click', function () {
          var list = (model.get(path) || []).slice();
          list.splice(i, 1);
          model.set(path, list, null);
          rerender();
        });
        head.appendChild(del);
      }
      box.appendChild(h('fieldset', { class: 'sheet-row' }, [h('legend', { class: 'visually-hidden', text: legend }), head, h('div', { class: 'sheet-row__fields' }, fields)]));
      applyConditions();
    })(i);
    if (sec.max == null || n < sec.max) {
      var addBtn = h('button', { type: 'button', class: 'btn btn--small', text: cq('agregarFila') });
      addBtn.addEventListener('click', function () {
        var list = (model.get(path) || []).slice();
        while (list.length < n) list.push({});
        list.push({});
        model.set(path, list, null);
        rerender();
        var rowsEls = (host || ctx.root).querySelectorAll('.sheet-sec--filas[data-sec="' + sec.id + '"] .sheet-row');
        var last = rowsEls[rowsEls.length - 1];
        var first = last && last.querySelector('input, select, textarea');
        if (first) first.focus();
      });
      box.appendChild(h('p', { class: 'sheet-add' }, [addBtn]));
    }
    return box;
  }

  function secEleccion(ctx, base, sec) {
    var path = base.concat([sec.id]);
    var counter = h('p', { class: 'sheet-count', 'aria-live': 'polite' });
    var whyBox = h('div', { class: 'sheet-why' });
    var boxes = [];
    function chosen() { return (model.get(path.concat(['elegidos'])) || []).filter(function (id) { return sec.opciones.some(function (o) { return o.id === id; }); }); }
    function sync() {
      var list = chosen();
      counter.textContent = cq('elegidos', { n: list.length, total: sec.elegir });
      boxes.forEach(function (b) { b.disabled = !b.checked && list.length >= sec.elegir; b.parentNode.classList.toggle('is-off', b.disabled); });
      whyBox.innerHTML = '';
      list.forEach(function (id) {
        var o = sec.opciones.filter(function (x) { return x.id === id; })[0];
        whyBox.appendChild(textField(ctx, path.concat(['porque', id]), o.label + ' · ' + sec.campo.label, { rows: 2 }));
      });
    }
    var fs = h('fieldset', { class: 'sheet-sec sheet-sec--eleccion' }, [h('legend', { class: 'sheet-legend', text: sec.titulo }), counter]);
    var row = h('div', { class: 'sheet-checks' });
    sec.opciones.forEach(function (o) {
      var id = K().uid('c');
      var b = h('input', { type: 'checkbox', id: id, value: o.id });
      b.checked = chosen().indexOf(o.id) >= 0;
      b.addEventListener('change', function () {
        var list = chosen().filter(function (x) { return x !== o.id; });
        if (b.checked && list.length < sec.elegir) list.push(o.id);
        b.checked = list.indexOf(o.id) >= 0;
        model.set(path.concat(['elegidos']), list, ctx.source);
        sync();
      });
      boxes.push(b);
      row.appendChild(h('label', { class: 'sheet-check', for: id }, [b, h('span', { text: o.label })]));
    });
    fs.appendChild(row);
    fs.appendChild(whyBox);
    sync();
    return fs;
  }

  function secMatriz(ctx, base, sec) {
    var path = base.concat([sec.id]);
    var table = h('table', { class: 'sheet-matrix' }, [
      h('thead', {}, [h('tr', {}, [h('th', { scope: 'col', text: sec.encabezado })].concat(sec.columnas.map(function (c) { return h('th', { scope: 'col', text: c }); })))]),
      h('tbody', {}, sec.filas.map(function (f) {
        return h('tr', {}, [h('th', { scope: 'row', text: f })].concat(sec.columnas.map(function (c) {
          var p = path.concat([slug(f), slug(c)]);
          var ta = h('textarea', { class: 'sheet-input sheet-cell', rows: 2, 'aria-label': f + ' · ' + c });
          ta.value = str(model.get(p));
          ta.addEventListener('input', function () { model.set(p, ta.value, ctx.source); });
          var td = h('td', {}, [ta]);
          autosize(ta);
          watchPersonal(ta, td);
          return td;
        })));
      }))
    ]);
    return h('div', { class: 'sheet-sec sheet-sec--matriz' }, [
      sec.titulo ? h('h4', { class: 'sheet-legend', text: sec.titulo }) : null,
      h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': sec.titulo || sec.encabezado }, [table])
    ]);
  }

  function secCostos(ctx, base, sec) {
    var path = base.concat([sec.id]);
    var sumEl = h('p', { class: 'sheet-sum', 'aria-live': 'polite' });
    function updateSum() {
      var s = costSum(sec, model.get(path));
      sumEl.textContent = s ? cq('suma', { total: EIA.util.formatNumber(s.total), unidad: s.unidad }) : cq('sumaPendiente');
      sumEl.classList.toggle('is-pending', !s);
    }
    var list = h('ul', { class: 'sheet-costs' }, sec.items.map(function (it) {
      var p = path.concat([it.id]);
      var idc = K().uid('costo'), idm = K().uid('monto'), idu = K().uid('unidad');
      var check = h('input', { type: 'checkbox', id: idc });
      check.checked = !!model.get(p.concat(['marcado']));
      var amount = h('input', { type: 'number', id: idm, class: 'sheet-input', min: '0', step: 'any', inputmode: 'decimal' });
      var v = model.get(p.concat(['monto']));
      amount.value = v == null ? '' : String(v);
      var unit = h('input', { type: 'text', id: idu, class: 'sheet-input', placeholder: cq('unidadAyuda'), maxlength: '60' });
      unit.value = str(model.get(p.concat(['unidad'])));
      function sync() { amount.disabled = unit.disabled = !check.checked; li.classList.toggle('is-off', !check.checked); }
      check.addEventListener('change', function () { model.set(p.concat(['marcado']), check.checked, ctx.source); sync(); updateSum(); });
      amount.addEventListener('input', function () { model.set(p.concat(['monto']), amount.value === '' ? '' : Number(amount.value), ctx.source); updateSum(); });
      unit.addEventListener('input', function () { model.set(p.concat(['unidad']), unit.value, ctx.source); updateSum(); });
      var li = h('li', { class: 'sheet-cost' }, [
        h('label', { class: 'sheet-check sheet-cost__item', for: idc }, [check, h('span', { text: it.label })]),
        h('div', { class: 'sheet-cost__fields' }, [
          h('label', { class: 'sheet-mini', for: idm, text: cq('monto') }), amount,
          h('label', { class: 'sheet-mini', for: idu, text: cq('unidad') }), unit
        ])
      ]);
      sync();
      return li;
    }));
    updateSum();
    return h('fieldset', { class: 'sheet-sec sheet-sec--costos' }, [h('legend', { class: 'sheet-legend', text: sec.titulo }), list, sumEl]);
  }

  function secCifras(ctx, base, sec) {
    var path = base.concat([sec.id]);
    var id = K().uid('buscar');
    var input = h('input', { type: 'search', id: id, class: 'sheet-input', autocomplete: 'off' });
    var results = h('ul', { class: 'sheet-picker__results' });
    var count = h('p', { class: 'sheet-count', 'aria-live': 'polite' });
    var chosenEl = h('ol', { class: 'sheet-picked' });
    function chosen() { return (model.get(path) || []).filter(function (x) { return EIA.cifra.has(x); }); }
    function renderChosen() {
      chosenEl.innerHTML = '';
      var list = chosen();
      if (!list.length) chosenEl.appendChild(h('li', { class: 'empty-note sheet-picked__empty', text: cq('sinCifras') }));
      list.forEach(function (cid) {
        var c = EIA.cifra(cid);
        var copyBtn = h('button', { type: 'button', class: 'btn btn--small', text: cq('copiarCita') });
        ui.copyButton(copyBtn, function () { return EIA.util.citation(cid); });
        var del = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: cq('quitarCifra'), 'aria-label': cq('quitarCifraDe', { cifra: c.cifra }) });
        del.addEventListener('click', function () { model.set(path, chosen().filter(function (x) { return x !== cid; }), ctx.source); renderChosen(); search(); });
        chosenEl.appendChild(h('li', { class: 'sheet-picked__item' }, [h('p', { class: 'sheet-picked__cita', text: EIA.util.citation(cid) }), h('p', { class: 'sheet-picked__actions' }, [copyBtn, del])]));
      });
    }
    function search() {
      var q = fold(input.value).trim();
      results.innerHTML = '';
      if (q.length < 2) { count.textContent = ''; return; }
      var temas = {};
      (EIA.data.temas || []).forEach(function (t) { temas[t.id] = t.titulo; });
      var hits = EIA.cifra.all().filter(function (c) {
        return c.enBanco && fold([c.cifra, c.alcanceTexto, c.etiqueta, temas[c.tema] || ''].join(' ')).indexOf(q) >= 0;
      });
      count.textContent = cq('resultados', { n: hits.length });
      var picked = chosen();
      hits.slice(0, 8).forEach(function (c) {
        var has = picked.indexOf(c.id) >= 0;
        var add = h('button', { type: 'button', class: 'btn btn--small', disabled: has, text: has ? cq('yaAgregada') : cq('agregarCifra'), 'aria-label': has ? null : cq('agregarCifraDe', { cifra: c.cifra }) });
        add.addEventListener('click', function () {
          var list = chosen();
          if (list.indexOf(c.id) < 0) list.push(c.id);
          model.set(path, list, ctx.source);
          renderChosen();
          search();
        });
        results.appendChild(h('li', { class: 'sheet-picker__hit' }, [
          h('p', { class: 'sheet-picker__cifra' }, [h('strong', { text: c.cifra }), ' ', h('span', { class: 'sheet-picker__src', text: c.etiqueta })]),
          add
        ]));
      });
    }
    var t = 0;
    input.addEventListener('input', function () { root.clearTimeout(t); t = root.setTimeout(search, 160); });
    renderChosen();
    return h('div', { class: 'sheet-sec sheet-sec--cifras' }, [
      h('div', { class: 'sheet-picker' }, [
        h('label', { class: 'sheet-label', for: id, text: cq('buscarCifra') }),
        h('p', { class: 'help', text: cq('buscarAyuda') }),
        input, count, results
      ]),
      chosenEl
    ]);
  }

  var SECTIONS = { campos: secCampos, filas: secFilas, eleccion: secEleccion, matriz: secMatriz, costos: secCostos, cifras: secCifras };

  function renderSections(ctx, hoja, body, only) {
    body.innerHTML = '';
    var base = ['hojas', hoja.id];
    hoja.secciones.forEach(function (sec) {
      if (only && only.indexOf(sec.id) < 0) return;
      var el;
      if (sec.tipo === 'texto') el = h('div', { class: 'sheet-sec sheet-sec--texto' }, [textField(ctx, base.concat([sec.id]), sec.label, { rows: 3 })]);
      else if (sec.tipo === 'opcion') el = h('div', { class: 'sheet-sec sheet-sec--opcion' }, [radioGroup(ctx, base.concat([sec.id]), sec.label, sec.opciones)]);
      else if (SECTIONS[sec.tipo]) el = SECTIONS[sec.tipo](ctx, base, sec, function () { renderSections(ctx, hoja, body, only); }, body);
      if (el) body.appendChild(el);
    });
  }

  // =============================================================================================
  // One sheet bound to the active notebook (session activities, Modo clase)

  C.mountSheet = function (el, hojaId, o) {
    o = o || {};
    var hoja = hojaById(hojaId);
    if (!hoja) return null;
    var ctx = { source: K().uid('hoja'), root: null };
    var who = h('p', { class: 'sheet__who' });
    var body = h('div', { class: 'sheet__body' });
    var box = h('div', { class: 'sheet sheet--inline', 'data-hoja': hoja.id }, [
      h('div', { class: 'sheet__bar' }, [who, h('a', { class: 'btn btn--small', href: '#proyecto/hoja-' + hoja.id, text: cq('abrirCuaderno') })]),
      h('p', { class: 'sheet__own help', text: cq('propio') }),
      body
    ]);
    ctx.root = box;
    el.appendChild(box);
    function render() {
      var nb = model.active();
      who.textContent = cq('cuadernoDe', { equipo: nb.campos.equipo || cq('sinNombre') });
      renderSections(ctx, hoja, body, o.secciones || null);
    }
    var t = 0;
    var off = model.on(function (ev) {
      if (ev.type === 'switch') { render(); return; }
      if (ev.type === 'set' && ev.source !== ctx.source) {
        if (ev.path[0] === 'campos') { who.textContent = cq('cuadernoDe', { equipo: model.active().campos.equipo || cq('sinNombre') }); return; }
        if (ev.path[1] !== hoja.id) return;
        root.clearTimeout(t);
        t = root.setTimeout(render, 160);
      }
    });
    render();
    return { destroy: function () { off(); box.remove(); } };
  };

  // =============================================================================================
  // The whole notebook (#proyecto)

  function download(name, text) {
    var blob = new root.Blob([text], { type: 'application/json;charset=utf-8' });
    var url = root.URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name, hidden: true });
    doc.body.appendChild(a);
    a.click();
    root.setTimeout(function () { root.URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function notesSection(ctx) {
    var sec = h('section', { class: 'card sheet', id: 'proyecto--hoja-notas', tabindex: '-1', 'aria-labelledby': 'proyecto--hoja-notas-titulo' }, [
      h('h3', { class: 'sheet__title', id: 'proyecto--hoja-notas-titulo', text: cq('notas') })
    ]);
    var body = h('div', { class: 'sheet__body' });
    sec.appendChild(body);
    function render() {
      body.innerHTML = '';
      var notas = model.active().notas;
      if (!notas.length) { body.appendChild(h('p', { class: 'empty-note', text: cq('sinNotas') })); return; }
      notas.forEach(function (n, i) {
        var del = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: cq('quitarNota') });
        del.addEventListener('click', function () {
          var list = model.active().notas.slice();
          list.splice(i, 1);
          model.set(['notas'], list, null);
          render();
        });
        body.appendChild(h('div', { class: 'sheet-note' }, [
          h('p', { class: 'sheet-note__q' }, [n.sesion ? h('span', { class: 'badge', text: cq('sesion', { n: n.sesion }) }) : null, ' ', n.pregunta]),
          textField(ctx, ['notas', i, 'respuesta'], cq('respuesta'), { rows: 2 }),
          h('p', { class: 'sheet-note__actions' }, [del])
        ]));
      });
    }
    render();
    return { el: sec, render: render };
  }

  C.mount = function (el) {
    var kit = K();
    var ctx = { source: kit.uid('cuaderno'), root: null };
    var status = h('p', { class: 'cuaderno__status', role: 'status', 'aria-live': 'polite' });
    var picker = h('select', { id: kit.uid('cuadernos'), class: 'sheet-input cuaderno__select' });
    var bNew = h('button', { type: 'button', class: 'btn btn--small', text: cq('nuevo') });
    var bDel = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: cq('eliminar') });
    var fieldsBox = h('div', { class: 'cuaderno__campos' });
    var file = h('input', { type: 'file', accept: '.json,application/json', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
    var bExport = h('button', { type: 'button', class: 'btn', text: cq('exportar') });
    var bImport = h('button', { type: 'button', class: 'btn', text: cq('importar') });
    var bCopy = h('button', { type: 'button', class: 'btn', text: cq('copiarTexto') });
    var bPrint = h('button', { type: 'button', class: 'btn', text: cq('imprimir') });
    var index = h('nav', { class: 'cuaderno__index', 'aria-label': cq('hojas') });
    var sheets = h('div', { class: 'cuaderno__sheets' });
    var bar = kit.card('cuaderno__bar', [
      h('div', { class: 'cuaderno__pick' }, [h('label', { class: 'sheet-label', for: picker.id, text: cq('cuaderno') }), h('div', { class: 'cuaderno__pick-row' }, [picker, bNew, bDel])]),
      fieldsBox,
      h('p', { class: 'cuaderno__actions' }, [bExport, bImport, bCopy, bPrint, file]),
      status,
      h('p', { class: 'help cuaderno__help', text: cq('ayuda') + ' ' + cq('propio') })
    ]);
    var box = h('div', { class: 'cuaderno', role: 'region', 'aria-label': cq('region') }, [bar, index, sheets]);
    ctx.root = box;
    el.appendChild(box);

    function teamLabel(nb) { return nb.campos.equipo || cq('sinNombre'); }
    function renderPicker() {
      picker.innerHTML = '';
      var seen = {};
      model.list().forEach(function (nb) {
        var label = teamLabel(nb);
        seen[label] = (seen[label] || 0) + 1;
        picker.appendChild(h('option', { value: nb.id, text: label + (seen[label] > 1 ? ' (' + seen[label] + ')' : '') }));
      });
      picker.value = model.activeId();
    }
    function renderFields() {
      fieldsBox.innerHTML = '';
      (schema().campos || []).forEach(function (c) {
        var f = textField(ctx, ['campos', c.id], c.label, { input: true, cls: 'sheet-field--campo', noWatch: true });
        f.querySelector('input').addEventListener('input', function () { renderPickerLabels(); });
        fieldsBox.appendChild(f);
      });
    }
    function renderPickerLabels() {
      var nb = model.active();
      var opt = picker.querySelector('option[value="' + nb.id + '"]');
      if (opt) opt.textContent = teamLabel(nb);
    }
    var sheetBodies = [];
    function renderSheets() {
      sheets.innerHTML = '';
      index.innerHTML = '';
      sheetBodies = [];
      var links = h('ul', {});
      (schema().hojas || []).forEach(function (hoja) {
        var id = 'proyecto--hoja-' + hoja.id;
        links.appendChild(h('li', {}, [h('a', { href: '#proyecto/hoja-' + hoja.id }, [
          hoja.sesion ? h('span', { class: 'cuaderno__index-n', text: cq('sesion', { n: hoja.sesion }) }) : null, hoja.titulo
        ])]));
        var body = h('div', { class: 'sheet__body' });
        var a = hoja.actividad && (EIA.data.actividades || {})[hoja.actividad];
        sheets.appendChild(h('section', { class: 'card sheet', id: id, tabindex: '-1', 'aria-labelledby': id + '-titulo', 'data-hoja': hoja.id }, [
          h('p', { class: 'kicker sheet__kicker', text: hoja.sesion ? cq('sesion', { n: hoja.sesion }) : cq('general') }),
          h('h3', { class: 'sheet__title', id: id + '-titulo' }, [
            hoja.titulo,
            a && hoja.sesion ? h('a', { class: 'sheet__link', href: '#s' + hoja.sesion + '/' + a.id, text: a.kb && a.kb.titulo ? a.kb.titulo : a.titulo }) : null
          ]),
          body
        ]));
        renderSections(ctx, hoja, body, null);
        sheetBodies.push({ hoja: hoja, body: body });
      });
      links.appendChild(h('li', {}, [h('a', { href: '#proyecto/hoja-notas', text: cq('notas') })]));
      index.appendChild(links);
      notes = notesSection(ctx);
      sheets.appendChild(notes.el);
    }
    var notes = null;
    function renderAll() { renderPicker(); renderFields(); renderSheets(); }

    picker.addEventListener('change', function () { model.select(picker.value); });
    bNew.addEventListener('click', function () { model.create(); try { fieldsBox.querySelector('input').focus(); } catch (err) { /* none */ } });
    var armed = 0;
    bDel.addEventListener('click', function () {
      var nb = model.active();
      if (!armed) {
        bDel.textContent = cq('confirmarEliminar', { equipo: teamLabel(nb) });
        bDel.classList.add('is-armed');
        armed = root.setTimeout(function () { armed = 0; bDel.textContent = cq('eliminar'); bDel.classList.remove('is-armed'); }, 5000);
        return;
      }
      root.clearTimeout(armed);
      armed = 0;
      bDel.textContent = cq('eliminar');
      bDel.classList.remove('is-armed');
      var name = teamLabel(nb);
      model.remove(nb.id);
      status.textContent = cq('eliminado', { equipo: name });
    });
    bExport.addEventListener('click', function () {
      model.flush();
      var nb = model.active();
      var name = kit.fmt(cq('archivo'), { equipo: slug(nb.campos.equipo || cq('sinNombre')) || 'equipo' }) + '.json';
      try { download(name, C.serialize(nb)); status.textContent = cq('exportado', { archivo: name }); } catch (err) { status.textContent = cq('noGuardado'); }
    });
    bImport.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new root.FileReader();
      reader.onload = function () {
        var r = C.parse(reader.result);
        if (!r.ok) { status.textContent = cq('errorImportar'); return; }
        var res = model.add(r.cuaderno);
        status.textContent = res.copia ? cq('importadoCopia') : cq('importado', { equipo: teamLabel(res.cuaderno) });
      };
      reader.onerror = function () { status.textContent = cq('errorImportar'); };
      reader.readAsText(f);
      file.value = '';
    });
    ui.copyButton(bCopy, function () { model.flush(); return C.toText(model.active()); });
    bPrint.addEventListener('click', function () {
      var cleanup = C.preparePrint();
      function done() { cleanup(); root.removeEventListener('afterprint', done); }
      root.addEventListener('afterprint', done);
      root.setTimeout(function () { root.print(); }, 80);
    });

    var t = 0;
    var off = model.on(function (ev) {
      if (ev.type === 'switch') { renderAll(); return; }
      if (ev.type === 'saved') { status.textContent = ev.ok ? cq('guardado') : cq('noGuardado'); return; }
      if (ev.type !== 'set' || ev.source === ctx.source) return;
      root.clearTimeout(t);
      t = root.setTimeout(function () {
        if (ev.path[0] === 'notas') { if (notes) notes.render(); return; }
        if (ev.path[0] === 'campos') { renderFields(); renderPickerLabels(); return; }
        if (ev.path[0] !== 'hojas') return;
        sheetBodies.forEach(function (sb) { if (sb.hoja.id === ev.path[1]) renderSections(ctx, sb.hoja, sb.body, null); });
      }, 160);
    });
    renderAll();
    return { destroy: function () { off(); box.remove(); } };
  };

  // =============================================================================================
  // "Anotar en el cuaderno" (the discussion questions of each session)

  C.note = function (o) {
    o = o || {};
    var texto = String(o.texto || '').trim();
    if (!texto) return;
    var notas = model.active().notas.slice();
    var s = Number(o.sesion) || null;
    if (notas.some(function (n) { return n.pregunta === texto && n.sesion === s; })) return;
    notas.push({ sesion: s, pregunta: texto, respuesta: '' });
    model.set(['notas'], notas, null);
  };

  // =============================================================================================
  // "Imprimir cuaderno": the notebook, the rubric and the decision log, as plain text blocks.

  C.preparePrint = function () {
    model.flush();
    var nb = model.active();
    var old = doc.getElementById('print-cuaderno');
    if (old) old.remove();
    var kb = (EIA.data.course && EIA.data.course.kb) || {};
    var empty = cq('vacio');
    var sheet = h('div', { id: 'print-cuaderno', class: 'print-sheet print-cuaderno' }, [
      h('h1', { text: cq('titulo') }),
      h('p', { class: 'print-sheet__note', text: cq('impresoNota', { version: kb.version || '', fecha: kb.fecha || '' }) }),
      h('dl', { class: 'print-cuaderno__campos' }, (schema().campos || []).map(function (c) {
        return h('div', {}, [h('dt', { text: c.label }), h('dd', { text: nb.campos[c.id] || empty })]);
      }))
    ]);
    (schema().hojas || []).forEach(function (hoja) {
      var sec = h('section', { class: 'print-cuaderno__hoja' }, [h('h2', { text: hojaTitle(hoja) })]);
      entries(nb, hoja).forEach(function (g) {
        var block = h('div', { class: 'print-cuaderno__grupo' }, [g.title ? h('h3', { text: g.title }) : null]);
        g.items.forEach(function (it) {
          block.appendChild(h('div', { class: 'print-cuaderno__item' }, [
            it.label ? h('p', { class: 'print-cuaderno__label', text: it.label }) : null,
            h('p', { class: 'print-cuaderno__value' + (it.value ? '' : ' is-empty'), text: it.value || empty })
          ]));
        });
        sec.appendChild(block);
      });
      sheet.appendChild(sec);
    });
    if (nb.notas.length) {
      sheet.appendChild(h('section', { class: 'print-cuaderno__hoja' }, [h('h2', { text: cq('notas') })].concat(nb.notas.map(function (n) {
        return h('div', { class: 'print-cuaderno__item' }, [
          h('p', { class: 'print-cuaderno__label', text: (n.sesion ? cq('sesion', { n: n.sesion }) + ' · ' : '') + n.pregunta }),
          h('p', { class: 'print-cuaderno__value', text: n.respuesta || empty })
        ]);
      }))));
    }
    var rub = ui.rubrica && ui.rubrica.printBlock ? ui.rubrica.printBlock(nb) : null;
    if (rub) sheet.appendChild(rub);
    doc.body.appendChild(sheet);
    doc.body.setAttribute('data-print', 'cuaderno');
    return function () {
      if (doc.body.getAttribute('data-print') === 'cuaderno') doc.body.removeAttribute('data-print');
      sheet.remove();
    };
  };

  // =============================================================================================
  // Session activities that feed a sheet: ficha (S1), tabla (S2–S6), plan (S7).

  var tools = ui.tools = ui.tools || {};
  function sheetTool() {
    return {
      mount: function (el, o) {
        var a = (EIA.data.actividades || {})[o.id];
        if (!a || !a.hoja) return null;
        return C.mountSheet(el, a.hoja, { secciones: a.secciones || null });
      }
    };
  }
  tools.ficha = sheetTool();
  tools.tabla = sheetTool();
  tools.plan = sheetTool();
})(typeof window !== 'undefined' ? window : globalThis);
