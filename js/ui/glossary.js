/* Estado de la IA 2026 — glossary tooltips and the #glosario view (prompt §9.8, §10.13; KB §12).
 *
 *   EIA.ui.glossary.mark(viewEl)          the first occurrence of each KB glossary term in the view's
 *                                         text gets a dotted underline: <button class="gloss" data-termino>
 *                                         (popover by js/ui/chips.js). Headings, buttons, links, chips,
 *                                         source tags, figures, players and .no-gloss are skipped;
 *                                         `variantes` detect the term, `excluir` phrases veto a match.
 *   EIA.ui.glossary.popoverContent(id)    { label, body } for the popover: term, definition,
 *                                         "Ver en el glosario"
 *   EIA.ui.glossary.render(el, state)     the #glosario view: search, alphabetical index, anchors
 *                                         (id "glosario--<id>", deep link #glosario/<id>)
 *   EIA.ui.glossary.focus(el, id)         shows and highlights one term (deep links) */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function t(path, vars) { return ui.t(path, vars); }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  function fold(s) { return EIA.util.fold(s); }
  function entries() { return EIA.data.glosario || []; }

  var SKIP = 'h1, h2, h3, h4, h5, h6, button, a, summary, label, th, code, pre, input, textarea, select, canvas, ' +
    '.chip, .estado, .source-tag, .fig, .gloss, .no-gloss, .player, .visually-hidden, [aria-hidden="true"], .pop';

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  var matcher = null;
  function buildMatcher() {
    if (matcher) return matcher;
    var byVariant = {};
    var variants = [];
    entries().forEach(function (g) {
      (g.variantes || []).forEach(function (v) {
        var k = v.toLowerCase();
        if (byVariant[k]) return;
        byVariant[k] = g;
        variants.push(k);
      });
    });
    variants.sort(function (a, b) { return b.length - a.length; });
    var re = null;
    try {
      re = new RegExp('(^|[^\\p{L}\\p{N}])(' + variants.map(escapeRe).join('|') + ')(?=[^\\p{L}\\p{N}]|$)', 'giu');
    } catch (err) {
      re = new RegExp('(^|[^A-Za-zÀ-ÿ0-9])(' + variants.map(escapeRe).join('|') + ')(?=[^A-Za-zÀ-ÿ0-9]|$)', 'gi');
    }
    matcher = { re: re, byVariant: byVariant };
    return matcher;
  }

  function excluded(g, lower, index, length) {
    var list = g.excluir || [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i].toLowerCase(), from = 0, at;
      while ((at = lower.indexOf(p, from)) >= 0) {
        if (index >= at && index + length <= at + p.length) return true;
        from = at + 1;
      }
    }
    return false;
  }

  function mark(viewEl) {
    if (!viewEl || !entries().length || !doc.createTreeWalker) return;
    var m = buildMatcher();
    var done = {};
    var remaining = entries().length;
    var walker = doc.createTreeWalker(viewEl, root.NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || node.nodeValue.trim().length < 2) return root.NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent || parent.closest(SKIP)) return root.NodeFilter.FILTER_REJECT;
        return root.NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var n = 0; n < nodes.length && remaining > 0; n++) {
      var node = nodes[n];
      var text = node.nodeValue, lower = text.toLowerCase();
      var hits = [];
      m.re.lastIndex = 0;
      var r;
      while ((r = m.re.exec(text)) !== null) {
        var start = r.index + r[1].length, word = r[2];
        var g = m.byVariant[word.toLowerCase()];
        if (!g || done[g.id] || excluded(g, lower, start, word.length)) continue;
        if (hits.some(function (x) { return x.g === g; })) continue;
        hits.push({ g: g, start: start, len: word.length });
      }
      if (!hits.length) continue;
      var frag = doc.createDocumentFragment(), pos = 0;
      hits.forEach(function (x) {
        if (done[x.g.id]) return;
        done[x.g.id] = true;
        remaining--;
        if (x.start > pos) frag.appendChild(doc.createTextNode(text.slice(pos, x.start)));
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'gloss';
        b.setAttribute('data-termino', x.g.id);
        b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', 'false');
        b.textContent = text.slice(x.start, x.start + x.len);
        frag.appendChild(b);
        pos = x.start + x.len;
      });
      if (pos < text.length) frag.appendChild(doc.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  function find(id) {
    var list = entries();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function popoverContent(id) {
    var g = find(id);
    if (!g) return null;
    return {
      label: t('page.popover.dialogoTermino', { termino: g.termino }),
      body: [
        h('p', { class: 'pop__kicker', text: t('glosario.titulo') }),
        h('p', { class: 'pop__title', text: g.termino }),
        h('p', { class: 'pop__text', html: EIA.markup.inline(g.definicion) }),
        h('p', { class: 'pop__actions' }, [h('a', { class: 'pop__link', href: '#glosario/' + g.id, text: t('glosario.verEnGlosario') })])
      ]
    };
  }

  // ---------------------------------------------------------------------------------------------
  // The #glosario view

  function initial(termino) {
    return fold(termino).charAt(0).toUpperCase();
  }

  function render(el) {
    var list = entries().slice().sort(function (a, b) { return a.termino.localeCompare(b.termino, 'es', { sensitivity: 'base' }); });
    var head = ui.viewHead(el, { title: t('glosario.titulo'), signs: ['espiral', 'estrella'] });
    var searchId = 'glosario-buscar';
    var input = h('input', { type: 'search', id: searchId, class: 'search-input', autocomplete: 'off', spellcheck: 'false' });
    var counter = h('p', { class: 'counter', 'aria-live': 'polite' });
    var letters = h('nav', { class: 'letters', 'aria-label': t('page.glosario.letras') });
    var dl = h('div', { class: 'glossary' });
    var empty = h('p', { class: 'empty-note', hidden: true, text: t('page.glosario.sinResultados') });
    var groups = [];
    var current = null;
    list.forEach(function (g) {
      var L = initial(g.termino);
      if (!current || current.letter !== L) {
        var anchor = 'glosario--letra-' + L.toLowerCase();
        current = { letter: L, el: h('section', { class: 'glossary__group', 'aria-labelledby': anchor }), items: [] };
        current.el.appendChild(h('h2', { class: 'glossary__letter', id: anchor, tabindex: '-1', text: L }));
        current.list = h('dl', { class: 'glossary__list' });
        current.el.appendChild(current.list);
        groups.push(current);
        dl.appendChild(current.el);
        letters.appendChild(h('a', { href: '#glosario/letra-' + L.toLowerCase(), class: 'letters__link', text: L }));
      }
      var item = h('div', { class: 'term card card--thin reveal', id: 'glosario--' + g.id }, [
        h('dt', { class: 'term__name', text: g.termino }),
        h('dd', { class: 'term__def', html: EIA.markup.inline(g.definicion) })
      ]);
      item._search = fold(g.termino + ' ' + (g.variantes || []).join(' ') + ' ' + g.definicion);
      current.items.push(item);
      current.list.appendChild(item);
    });

    function update() {
      var q = fold(input.value).trim();
      var words = q ? q.split(/\s+/) : [];
      var n = 0;
      groups.forEach(function (gr) {
        var any = false;
        gr.items.forEach(function (it) {
          var ok = words.every(function (w) { return it._search.indexOf(w) >= 0; });
          it.hidden = !ok;
          if (ok) { any = true; n++; }
        });
        gr.el.hidden = !any;
      });
      counter.textContent = n === 1 ? t('page.glosario.unTermino') : t('page.glosario.contador', { n: n });
      empty.hidden = n > 0;
    }
    input.addEventListener('input', update);

    var tools = h('div', { class: 'view-tools' }, [
      h('label', { for: searchId, class: 'field-label', text: t('page.glosario.buscar') }),
      input, counter
    ]);
    el.appendChild(h('div', { class: 'view-body' }, [tools, letters, dl, empty]));
    update();
    return { head: head };
  }

  function focusTerm(el, id) {
    var item = doc.getElementById('glosario--' + id);
    if (!item) return null;
    var input = el.querySelector('.search-input');
    if (input && input.value) { input.value = ''; input.dispatchEvent(new root.Event('input')); }
    item.hidden = false;
    item.classList.add('is-target');
    root.setTimeout(function () { item.classList.remove('is-target'); }, 2400);
    return item;
  }

  ui.glossary = {
    mark: mark,
    popoverContent: popoverContent,
    render: render,
    focus: focusTerm
  };
})(typeof window !== 'undefined' ? window : globalThis);
