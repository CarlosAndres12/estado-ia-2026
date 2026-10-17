/* Estado de la IA 2026 — extras of the #proyecto view (prompt §10.7, KB §11).
 *
 * The page shell lists the eight questions of the final project with links to the notebook sheets
 * that feed them (#proyecto/hoja-<hojaId>). This marks every link whose sheet already holds
 * something the team wrote in the active notebook (a small star, and "ya tiene contenido" for
 * screen readers), so a team sees at a glance what is still missing. It reads the notebook
 * (EIA.ui.cuaderno.model) and never fills anything in. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  // True when a sheet value holds any text, number, choice or mark.
  function filled(v) {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (typeof v === 'number') return isFinite(v);
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.some(filled);
    if (typeof v === 'object') return Object.keys(v).some(function (k) { return filled(v[k]); });
    return false;
  }

  function mark() {
    var view = doc.querySelector('.view[data-route="proyecto"]');
    var m = ui.cuaderno && ui.cuaderno.model;
    if (!view || !m) return;
    var nb = m.active();
    var label = ((EIA.data.course.ui || {}).cuaderno || {}).conContenido || '';
    Array.prototype.forEach.call(view.querySelectorAll('.questions__sheets a[href^="#proyecto/hoja-"]'), function (a) {
      var id = a.getAttribute('href').slice('#proyecto/hoja-'.length);
      var has = filled((nb.hojas || {})[id]) || (id === 'notas' && nb.notas.length > 0);
      a.classList.toggle('has-content', has);
      var note = a.querySelector('.questions__done');
      if (has && !note) a.appendChild(ui.h('span', { class: 'visually-hidden questions__done', text: ' (' + label + ')' }));
      else if (!has && note) note.remove();
    });
  }

  var timer = 0, listening = false;
  function later() { root.clearTimeout(timer); timer = root.setTimeout(mark, 300); }
  if (root.addEventListener && doc) {
    root.addEventListener('eia:route', function (e) {
      if (!e.detail || e.detail.route !== 'proyecto') return;
      if (!listening && ui.cuaderno && ui.cuaderno.model) {
        listening = true;
        ui.cuaderno.model.on(function (ev) { if (ev.type === 'set' || ev.type === 'switch') later(); });
      }
      mark();
    });
  }

  ui.proyecto = { mark: mark, filled: filled };
})(typeof window !== 'undefined' ? window : globalThis);
