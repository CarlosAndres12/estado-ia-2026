/* Estado de la IA 2026 — evidence chips, estado marks, "Copiar cita" and the popovers of citations,
 * figures and glossary terms (prompt §3.8, §4, §10.1, §10.13; contracts §4).
 *
 *   EIA.ui.chipHTML(clase, label, { mono })  -> '<span class="chip chip--{clase}">…</span>'
 *       sign (CSS background drawn by decor.js) + verbatim label; '' for clase 'ninguno';
 *       'neutral' for the other KB labels ("Índice", "Norma"…). Never color alone.
 *   EIA.ui.estadoHTML(estado)                -> '<span class="estado estado--{key}">…</span>' ('' if none)
 *   EIA.ui.ilustrativoHTML()                 -> the "Ejemplo ilustrativo · no es un dato" stamp
 *   EIA.ui.copy(text)                        -> Promise; Clipboard API, textarea fallback, aria-live "¡Copiado!"
 *   EIA.ui.copyButton(button, getText)       wires a button: copies getText() and shows "¡Copiado!" for 2 s
 *   EIA.ui.announce(text)                    polite live-region message (#live)
 *   EIA.ui.popover.init()                    installs the delegated listeners (once, from EIA.ui.boot)
 *   EIA.ui.popover.close()                   closes the open popover
 *
 * Popover triggers are the buttons js/core/markup.js and js/ui/glossary.js write:
 *   button.source-tag[data-cita]   click or focus  -> reference title + "Abrir fuente ↗"
 *   button.fig[data-cifra]         hover, focus or tap -> chip, estado, alcance, source, "Ver en el banco",
 *                                  "Copiar cita"
 *   button.gloss[data-termino]     hover, focus or tap -> definition + "Ver en el glosario"
 * One popover is open at a time, in #overlays, positioned under (or over) its trigger. Tab moves from
 * the trigger into the popover and on to the next control after the trigger; Esc closes it and
 * returns the focus; leaving both closes it. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function esc(s) { return EIA.markup ? EIA.markup.escape(s) : String(s == null ? '' : s); }
  function t(path, vars) { return ui.t ? ui.t(path, vars) : ''; }
  function legend() { return (EIA.engine && EIA.engine.palette && EIA.engine.palette.legend) || null; }

  // ---------------------------------------------------------------------------------------------
  // Chips and estado marks

  var CLASES = ['capacidad', 'uso', 'resultado', 'expectativa', 'proyeccion'];

  ui.chipHTML = function (clase, label, o) {
    o = o || {};
    if (!clase || clase === 'ninguno') return '';
    var kind = CLASES.indexOf(clase) >= 0 ? clase : 'neutral';
    var text = label;
    if (!text) {
      var L = legend();
      var tipo = L && L.tipoByClase && L.tipoByClase[kind];
      text = tipo ? tipo.label : '';
    }
    if (!text) return '';
    var prefix = t('page.chips.tipo');
    return '<span class="chip chip--' + kind + (o.mono ? ' chip--mono' : '') + '">' +
      '<span class="chip__sign" aria-hidden="true"></span>' +
      (prefix ? '<span class="visually-hidden">' + esc(prefix) + ' </span>' : '') +
      '<span class="chip__label">' + esc(text) + '</span></span>';
  };

  ui.estadoHTML = function (estado) {
    if (!estado) return '';
    var key = EIA.util && EIA.util.estadoKey ? EIA.util.estadoKey(estado) : '';
    var prefix = t('page.chips.estado');
    return '<span class="estado' + (key ? ' estado--' + key : '') + '">' +
      '<span class="estado__sign" aria-hidden="true"></span>' +
      (prefix ? '<span class="visually-hidden">' + esc(prefix) + ' </span>' : '') +
      '<span class="estado__label">' + esc(estado) + '</span></span>';
  };

  ui.ilustrativoHTML = function () {
    var label = t('leyenda.ilustrativo');
    if (!label) return '';
    return '<span class="chip chip--ilustrativo"><span class="chip__sign" aria-hidden="true"></span><span class="chip__label">' + esc(label) + '</span></span>';
  };

  // ---------------------------------------------------------------------------------------------
  // Live region and copy

  ui.announce = function (text) {
    var live = doc.getElementById('live');
    if (!live) return;
    live.textContent = '';
    root.setTimeout(function () { live.textContent = text; }, 40);
  };

  function textareaCopy(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    var active = doc.activeElement;
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (err) { /* old engines */ }
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (active && active.focus) { try { active.focus({ preventScroll: true }); } catch (err) { active.focus(); } }
    return ok;
  }

  ui.copy = function (text) {
    var value = String(text == null ? '' : text);
    function done() { ui.announce(t('citas.copiado')); }
    function fail(err) { ui.announce(t('page.copia.error')); throw err || new Error('copy failed'); }
    var clip = root.navigator && root.navigator.clipboard;
    if (clip && typeof clip.writeText === 'function' && root.isSecureContext !== false) {
      return clip.writeText(value).then(done, function () {
        if (textareaCopy(value)) return done();
        return fail();
      });
    }
    return new Promise(function (resolve, reject) {
      if (textareaCopy(value)) { done(); resolve(); } else { try { fail(); } catch (err) { reject(err); } }
    });
  };

  ui.copyButton = function (button, getText) {
    var label = button.textContent;
    var timer = 0;
    button.addEventListener('click', function () {
      ui.copy(getText()).then(function () {
        button.textContent = t('citas.copiado');
        button.classList.add('is-copied');
        root.clearTimeout(timer);
        timer = root.setTimeout(function () { button.textContent = label; button.classList.remove('is-copied'); }, 2000);
      }, function () { /* announced */ });
    });
    return button;
  };

  // ---------------------------------------------------------------------------------------------
  // Popover content

  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }

  function fuenteTitle(key) {
    var f = (EIA.data.fuentes || {})[key];
    if (!f) return '';
    return f.autor ? f.autor + '. ' + f.titulo : f.titulo;
  }

  function linkOut(url, label, aria) {
    var hint = t('page.markup.nuevaPestana');
    var a = h('a', { class: 'pop__link', href: url, target: '_blank', rel: 'noopener', 'aria-label': aria ? aria + (hint ? ' (' + hint + ')' : '') : null, text: label });
    return a;
  }

  function citaContent(key) {
    var f = (EIA.data.fuentes || {})[key];
    if (!f) return null;
    return {
      label: t('page.popover.dialogoFuente', { fuente: f.etiqueta }),
      body: [
        h('p', { class: 'pop__kicker', text: t('page.popover.referencia') }),
        h('p', { class: 'pop__title', text: fuenteTitle(key) }),
        h('p', { class: 'pop__actions' }, [
          linkOut(f.url, t('citas.abrirFuente'), t('page.referencias.abrirFuenteDe', { fuente: f.etiqueta })),
          h('a', { class: 'pop__link pop__link--quiet', href: '#referencias/' + key, text: t('page.popover.verEnReferencias') })
        ])
      ]
    };
  }

  function cifraContent(id, trigger) {
    var c;
    try { c = EIA.cifra(id); } catch (err) { return null; }
    var meta = h('p', { class: 'pop__meta' });
    meta.innerHTML = ui.chipHTML(c.clase, c.tipo) + ' ' + ui.estadoHTML(c.estado);
    var dl = h('dl', { class: 'pop__dl' }, [
      h('dt', { text: t('page.popover.alcance') }), h('dd', { text: c.alcanceTexto }),
      h('dt', { text: c.fuentesList.length > 1 ? t('page.popover.fuentes') : t('page.popover.fuente') }),
      h('dd', {}, c.fuentesList.map(function (f, i) {
        return h('span', { class: 'pop__source' }, [i ? '; ' : '', linkOut(f.url, f.etiqueta + ' ↗', t('page.referencias.abrirFuenteDe', { fuente: f.etiqueta }))]);
      }))
    ]);
    var copyBtn = h('button', { type: 'button', class: 'btn btn--small', text: t('citas.copiarCita') });
    ui.copyButton(copyBtn, function () { return EIA.util.citation(id); });
    var actions = h('p', { class: 'pop__actions' }, [
      c.enBanco ? h('a', { class: 'btn btn--small', href: '#cifras/' + id, text: t('citas.verEnBanco') }) : null,
      copyBtn
    ]);
    return {
      label: t('page.popover.dialogoCifra', { texto: trigger ? trigger.textContent : c.cifra }),
      body: [
        h('p', { class: 'pop__kicker', text: t('page.popover.cifra') }),
        h('p', { class: 'pop__cifra', text: c.cifra }),
        meta, dl,
        c.enBanco ? null : h('p', { class: 'pop__note', text: t('page.popover.contexto') }),
        actions
      ]
    };
  }

  function terminoContent(id) {
    return ui.glossary && ui.glossary.popoverContent ? ui.glossary.popoverContent(id) : null;
  }

  // ---------------------------------------------------------------------------------------------
  // Popover manager

  var pop = null, body = null, current = null, openedBy = '', hoverTimer = 0, downWasOpen = false;
  var POP_ID = 'eia-pop';

  function kindOf(el) {
    if (!el || !el.getAttribute) return '';
    if (el.hasAttribute('data-cita')) return 'cita';
    if (el.hasAttribute('data-cifra')) return 'cifra';
    if (el.hasAttribute('data-termino')) return 'termino';
    return '';
  }
  function triggerOf(target) {
    var el = target && target.closest ? target.closest('button[data-cita], button[data-cifra], button[data-termino]') : null;
    return el && !el.closest('#' + POP_ID) ? el : null;
  }

  function ensure() {
    if (pop) return pop;
    var host = doc.getElementById('overlays') || doc.body;
    pop = h('div', { id: POP_ID, class: 'pop', role: 'dialog', 'aria-modal': 'false', hidden: true });
    var close = h('button', { type: 'button', class: 'pop__close', 'aria-label': t('page.popover.cerrar'), text: '×' });
    close.addEventListener('click', function () { var tr = current; closePop(); if (tr) tr.focus(); });
    body = h('div', { class: 'pop__body' });
    pop.appendChild(close);
    pop.appendChild(body);
    pop.addEventListener('pointerenter', function () { root.clearTimeout(hoverTimer); });
    pop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && openedBy === 'hover') scheduleClose(); });
    host.appendChild(pop);
    return pop;
  }

  function place(trigger) {
    var rects = trigger.getClientRects();
    var r = rects.length ? rects[0] : trigger.getBoundingClientRect();
    var vw = doc.documentElement.clientWidth, vh = root.innerHeight;
    pop.style.left = '0px';
    pop.style.top = '0px';
    pop.style.maxWidth = Math.min(380, vw - 24) + 'px';
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.max(12, Math.min(r.left, vw - pw - 12));
    var below = r.bottom + 12, above = r.top - 12 - ph;
    var useAbove = below + ph > vh - 8 && above >= 8;
    var top = useAbove ? above : below;
    pop.style.left = Math.round(left + root.scrollX) + 'px';
    pop.style.top = Math.round(top + root.scrollY) + 'px';
    var ax = Math.max(18, Math.min(r.left + Math.min(r.width / 2, 28) - left, pw - 18));
    pop.style.setProperty('--arrow-x', Math.round(ax) + 'px');
    pop.classList.toggle('pop--above', useAbove);
  }

  function openPop(trigger, how) {
    var kind = kindOf(trigger);
    if (!kind) return;
    if (current === trigger && pop && !pop.hidden) { if (how !== 'hover') openedBy = how; return; }
    var content = kind === 'cita' ? citaContent(trigger.getAttribute('data-cita'))
      : kind === 'cifra' ? cifraContent(trigger.getAttribute('data-cifra'), trigger)
      : terminoContent(trigger.getAttribute('data-termino'));
    if (!content) return;
    closePop();
    ensure();
    body.innerHTML = '';
    content.body.forEach(function (n) { if (n) body.appendChild(n); });
    pop.setAttribute('aria-label', content.label || '');
    pop.className = 'pop pop--' + kind;
    pop.hidden = false;
    current = trigger;
    openedBy = how;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', POP_ID);
    place(trigger);
  }

  function closePop() {
    root.clearTimeout(hoverTimer);
    if (!pop || pop.hidden) { current = null; return; }
    pop.hidden = true;
    if (current) {
      current.setAttribute('aria-expanded', 'false');
      current.removeAttribute('aria-controls');
    }
    current = null;
    openedBy = '';
  }

  function scheduleClose() {
    root.clearTimeout(hoverTimer);
    hoverTimer = root.setTimeout(closePop, 260);
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function focusablesIn(el) { return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), visible); }

  function focusAfter(trigger) {
    var all = focusablesIn(doc.body).filter(function (el) { return !pop.contains(el); });
    var i = all.indexOf(trigger);
    var next = i >= 0 ? all[i + 1] : null;
    closePop();
    if (next) next.focus();
  }

  function onKeydown(e) {
    if (!pop || pop.hidden || !current) return;
    var inPop = pop.contains(doc.activeElement);
    if (e.key === 'Escape' || e.key === 'Esc') {
      var tr = current;
      closePop();
      if (inPop || doc.activeElement === tr) tr.focus();
      e.preventDefault();
      return;
    }
    if (e.key !== 'Tab') return;
    var items = focusablesIn(pop);
    if (!items.length) return;
    if (doc.activeElement === current && !e.shiftKey) {
      e.preventDefault();
      items[0].focus();
    } else if (inPop && e.shiftKey && doc.activeElement === items[0]) {
      e.preventDefault();
      current.focus();
    } else if (inPop && !e.shiftKey && doc.activeElement === items[items.length - 1]) {
      e.preventDefault();
      focusAfter(current);
    }
  }

  var installed = false;
  function init() {
    if (installed) return;
    installed = true;
    doc.addEventListener('pointerdown', function (e) {
      var tr = triggerOf(e.target);
      downWasOpen = !!(tr && tr === current && pop && !pop.hidden && openedBy !== 'hover');
      if (!tr && pop && !pop.hidden && !pop.contains(e.target)) closePop();
    }, true);
    doc.addEventListener('click', function (e) {
      var tr = triggerOf(e.target);
      if (!tr) return;
      e.preventDefault();
      if (downWasOpen || (current === tr && pop && !pop.hidden && openedBy === 'key')) { closePop(); downWasOpen = false; return; }
      openPop(tr, 'click');
      downWasOpen = false;
    });
    doc.addEventListener('focusin', function (e) {
      var tr = triggerOf(e.target);
      if (tr) { if (tr !== current) openPop(tr, 'focus'); return; }
      if (pop && !pop.hidden && !pop.contains(e.target)) closePop();
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && triggerOf(e.target)) openedBy = openedBy === 'focus' ? 'key' : openedBy;
      onKeydown(e);
    });
    doc.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var tr = triggerOf(e.target);
      if (!tr || kindOf(tr) === 'cita') return;
      root.clearTimeout(hoverTimer);
      if (tr === current) return;
      hoverTimer = root.setTimeout(function () { openPop(tr, 'hover'); }, 140);
    });
    doc.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse') return;
      var tr = triggerOf(e.target);
      if (!tr) return;
      if (tr !== current) { root.clearTimeout(hoverTimer); return; }
      if (openedBy === 'hover' && !(e.relatedTarget && pop && pop.contains(e.relatedTarget))) scheduleClose();
    });
    doc.addEventListener('scroll', function (e) {
      if (current && e.target !== doc && e.target.contains && e.target.contains(current)) closePop();
    }, true);
    root.addEventListener('resize', closePop);
    root.addEventListener('eia:route', closePop);
  }

  ui.popover = {
    init: init,
    close: closePop,
    open: function (trigger) { openPop(trigger, 'click'); },
    current: function () { return current; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
