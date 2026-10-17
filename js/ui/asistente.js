/* Estado de la IA 2026 — #asistente, "Trabaja con el asistente del curso" (prompt §9.9).
 *
 *   EIA.ui.asistente.mount(el)       intro; "Instrucciones del asistente" (KB §0 verbatim) with "Copiar
 *                                    instrucciones" (copies the KB text exactly); "Base de conocimiento"
 *                                    (link to contenido/base-estado-ia-2026.md + note); the six templates
 *                                    with inline inputs for the [blanks] and "Copiar"; the closing note.
 *   EIA.ui.asistente.fill(texto, values) -> the template with each [blank] replaced by its value, or kept
 *                                    as "[blank]" when the value is empty (pure)
 * Copy: EIA.data.asistente and EIA.data.course.ui.asistente / ui.page.asistente. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};

  var BLANK_RE = /\[([^\]\n]+)\]/g;

  function t(path, vars) { return ui.t(path, vars); }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }

  function fill(texto, values) {
    var i = 0;
    return String(texto || '').replace(BLANK_RE, function (m, blank) {
      var v = values && values[i] != null ? String(values[i]).trim() : '';
      i++;
      return v ? v : '[' + blank + ']';
    });
  }

  function template(p, index) {
    var inputs = [];
    var line = h('p', { class: 'template__text' });
    var last = 0, m, k = 0;
    BLANK_RE.lastIndex = 0;
    while ((m = BLANK_RE.exec(p.texto)) !== null) {
      if (m.index > last) line.appendChild(root.document.createTextNode(p.texto.slice(last, m.index)));
      var id = 'asistente-' + p.id + '-' + (k++);
      var input = h('input', {
        type: 'text', id: id, class: 'blank-input', placeholder: m[1], autocomplete: 'off',
        'aria-label': t('page.asistente.blanco', { blanco: m[1] }), size: String(Math.max(8, Math.min(34, m[1].length + 2)))
      });
      inputs.push(input);
      line.appendChild(input);
      last = m.index + m[0].length;
    }
    if (last < p.texto.length) line.appendChild(root.document.createTextNode(p.texto.slice(last)));
    var btn = h('button', { type: 'button', class: 'btn btn--small btn--primary', text: t('asistente.copiar') });
    ui.copyButton(btn, function () { return fill(p.texto, inputs.map(function (i) { return i.value; })); });
    return ui.card({ tag: 'li', class: 'template', id: 'asistente--' + p.id, peek: index % 3 === 0 }, [
      h('h3', { class: 'card__title', text: (index + 1) + '. ' + p.titulo }),
      line,
      h('p', { class: 'template__actions' }, [btn])
    ]);
  }

  function mount(el) {
    var a = EIA.data.asistente || {};
    ui.viewHead(el, { title: t('asistente.titulo'), signs: ['lapiz', 'estrella'], lead: '<p>' + EIA.markup.inline(a.intro || '') + '</p>' });

    var instr = ui.block(el, 'instrucciones', t('asistente.instrucciones'));
    var copyAll = h('button', { type: 'button', class: 'btn btn--primary', text: t('asistente.copiarInstrucciones') });
    ui.copyButton(copyAll, function () { return (a.kb0 && a.kb0.texto) || ''; });
    instr.appendChild(ui.card({ class: 'kb0' }, [
      h('p', { class: 'kicker', text: a.kb0 ? a.kb0.titulo : '' }),
      h('div', { class: 'prose kb0__text', html: EIA.markup.render(a.kb0 ? a.kb0.texto : '') }),
      h('p', { class: 'kb0__actions' }, [copyAll])
    ]));

    var base = ui.block(el, 'base', t('asistente.base'));
    if (a.base) {
      base.appendChild(ui.card({ thin: true, class: 'kb-file' }, [
        h('p', {}, [h('a', { class: 'btn', href: a.base.archivo, target: '_blank', rel: 'noopener', 'aria-label': t('page.asistente.abrirBase') + ' (' + t('page.markup.nuevaPestana') + ')' }, [
          h('span', { class: 'kb-file__sign', 'aria-hidden': 'true' }), h('span', { class: 'kb-file__name', text: a.base.archivo })
        ])]),
        h('p', { text: a.base.nota })
      ]));
    }

    var tpl = ui.block(el, 'plantillas', t('asistente.plantillas'));
    tpl.appendChild(h('p', { class: 'help', text: t('page.asistente.ayuda') }));
    tpl.appendChild(h('ol', { class: 'templates' }, (a.plantillas || []).map(template)));

    if (a.cierre) el.appendChild(h('div', { class: 'view-body' }, [h('aside', { class: 'margin-note margin-note--cierre' }, [h('p', { html: EIA.markup.inline(a.cierre) })])]));
  }

  ui.asistente = { mount: mount, fill: fill };
})(typeof window !== 'undefined' ? window : globalThis);
