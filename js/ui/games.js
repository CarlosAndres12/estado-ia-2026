/* Estado de la IA 2026 — the interactive tools of the sessions (prompt §10.3–§10.6, §10.12, §11).
 *
 * Registers EIA.ui.tools[actividadId] = { mount(el, { sesion, id }) -> { destroy } } for the ids the
 * sessions list (js/ui/views.js calls them inside the "Actividad" block, and Modo clase on its
 * activity slides). Every string comes from the tool's entry of EIA.data.actividades (its `ui`
 * object holds the tool copy) or from EIA.data.course.ui; every figure from EIA.cifra(id).
 *
 *   s1-que-mide      «¿Qué mide esta cifra?»: eight cards into the five type bins (drag with a mouse;
 *                    tap or keyboard: a card, then its bin), key notes and hints, the full key at the end
 *
 * Shared here: sorter(), the pick-then-place and drag behavior of the sorting games. The notebook
 * sheets (ficha, tabla, plan) are registered by js/ui/worksheets.js. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var tools = ui.tools = ui.tools || {};
  var doc = root.document;

  function K() { return ui.kit; }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  function act(id) { return (EIA.data.actividades || {})[id] || null; }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: false }); } catch (err) { el.focus(); } }

  // =============================================================================================
  // Sorting: pick a card, then a target (click, tap or keyboard); with a mouse or a pen, drag the
  // card onto a target. o = { root, cards: selector, targets: selector, place(card, target),
  // select(card|null) }. Touch never drags, so the page keeps scrolling under a finger.

  function sorter(o) {
    var selected = null, drag = null, suppressClick = false;

    function select(card) {
      if (selected && selected !== card) selected.setAttribute('aria-pressed', 'false');
      selected = card;
      if (card) card.setAttribute('aria-pressed', 'true');
      if (o.select) o.select(card);
    }
    function onClick(e) {
      if (suppressClick) { suppressClick = false; return; }
      var card = e.target.closest && e.target.closest(o.cards);
      if (card && o.root.contains(card)) {
        select(card.getAttribute('aria-pressed') === 'true' ? null : card);
        return;
      }
      var target = e.target.closest && e.target.closest(o.targets);
      if (target && o.root.contains(target)) {
        if (selected) o.place(selected, target);
        else if (o.empty) o.empty(target);
      }
    }

    function targetAt(x, y) {
      var el = doc.elementFromPoint(x, y);
      var t = el && el.closest ? el.closest(o.targets) : null;
      return t && o.root.contains(t) ? t : null;
    }
    function onDown(e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      var card = e.target.closest && e.target.closest(o.cards);
      if (!card || !o.root.contains(card)) return;
      drag = { card: card, x: e.clientX, y: e.clientY, id: e.pointerId, ghost: null, over: null };
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.ghost) {
        if (dx * dx + dy * dy < 49) return;
        var r = drag.card.getBoundingClientRect();
        drag.ox = drag.x - r.left;
        drag.oy = drag.y - r.top;
        drag.ghost = drag.card.cloneNode(true);
        drag.ghost.removeAttribute('id');
        drag.ghost.setAttribute('aria-hidden', 'true');
        drag.ghost.className += ' is-ghost';
        drag.ghost.style.width = r.width + 'px';
        (doc.getElementById('overlays') || doc.body).appendChild(drag.ghost);
        drag.card.classList.add('is-lifted');
        select(drag.card);
        o.root.classList.add('is-dragging');
      }
      e.preventDefault();
      drag.ghost.style.transform = 'translate(' + Math.round(e.clientX - drag.ox) + 'px,' + Math.round(e.clientY - drag.oy) + 'px) rotate(-2deg)';
      var over = targetAt(e.clientX, e.clientY);
      if (over !== drag.over) {
        if (drag.over) drag.over.classList.remove('is-over');
        if (over) over.classList.add('is-over');
        drag.over = over;
      }
      // Scroll the page when the pointer reaches the top or bottom edge.
      var edge = 70, vh = root.innerHeight;
      if (e.clientY < edge) root.scrollBy(0, -14);
      else if (e.clientY > vh - edge) root.scrollBy(0, 14);
    }
    function end(e, cancel) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag;
      drag = null;
      if (!d.ghost) return;
      suppressClick = true;
      root.setTimeout(function () { suppressClick = false; }, 0);
      d.ghost.remove();
      d.card.classList.remove('is-lifted');
      o.root.classList.remove('is-dragging');
      if (d.over) d.over.classList.remove('is-over');
      var target = cancel ? null : targetAt(e.clientX, e.clientY);
      if (target) o.place(d.card, target);
    }
    function onUp(e) { end(e, false); }
    function onCancel(e) { end(e, true); }

    o.root.addEventListener('click', onClick);
    o.root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove, { passive: false });
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    return {
      select: select,
      selected: function () { return selected; },
      destroy: function () {
        o.root.removeEventListener('click', onClick);
        o.root.removeEventListener('pointerdown', onDown);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerup', onUp);
        root.removeEventListener('pointercancel', onCancel);
        if (drag && drag.ghost) drag.ghost.remove();
      }
    };
  }

  // =============================================================================================
  // S1 · «¿Qué mide esta cifra?» (prompt §10.3). A meaning zone: the bins carry the five types as
  // sign + label in their colors; decorative signs step aside.

  tools['s1-que-mide'] = {
    mount: function (el, o) {
      var a = act(o.id || 's1-que-mide');
      if (!a || !a.cards) return null;
      var kit = K(), c = a.ui || {};
      var bins = {};
      a.bins.forEach(function (b) { bins[b.clase] = b; });
      var total = a.cards.length;

      var box = h('div', { class: 'game game--tipos zone-meaning' });
      var deckId = kit.uid('deck'), binsId = kit.uid('bins');
      var help = h('p', { class: 'game__help', text: c.instrucciones });
      var progress = h('p', { class: 'game__progress' });
      var deck = h('div', { class: 'game__deck', role: 'group', 'aria-labelledby': deckId });
      var binsEl = h('div', { class: 'game__bins', role: 'group', 'aria-labelledby': binsId });
      var feedback = kit.feedbackBox('game__feedback');
      var endEl = h('div', { class: 'game__end', hidden: true });
      box.appendChild(help);
      box.appendChild(progress);
      box.appendChild(h('h4', { class: 'game__label', id: deckId, text: c.tarjetas }));
      box.appendChild(deck);
      box.appendChild(h('h4', { class: 'game__label', id: binsId, text: c.tipos }));
      box.appendChild(binsEl);
      box.appendChild(feedback);
      box.appendChild(endEl);
      el.appendChild(box);

      var placed = 0;
      var lists = {};

      function build() {
        deck.innerHTML = '';
        binsEl.innerHTML = '';
        endEl.hidden = true;
        endEl.innerHTML = '';
        kit.feedback(feedback, null);
        placed = 0;
        a.cards.forEach(function (card) {
          deck.appendChild(h('button', { type: 'button', class: 'game-card', 'data-card': card.id, 'aria-pressed': 'false' }, [
            h('span', { class: 'game-card__cifra', text: card.cifra }),
            h('span', { class: 'game-card__fuente', text: card.fuente })
          ]));
        });
        a.bins.forEach(function (b) {
          var listId = kit.uid('bin');
          var list = h('ul', { class: 'game-bin__list', id: listId, 'aria-label': kit.fmt(c.clasificadas, { tipo: b.label }) });
          lists[b.clase] = list;
          binsEl.appendChild(h('div', { class: 'game-bin game-bin--' + b.clase }, [
            h('button', { type: 'button', class: 'game-bin__target', 'data-bin': b.clase, 'aria-describedby': listId, html: ui.chipHTML(b.clase, b.label) }),
            list
          ]));
        });
        updateProgress();
      }
      function updateProgress() { progress.textContent = kit.fmt(c.progreso, { n: placed, total: total }); }
      function cardData(btn) {
        var id = btn.getAttribute('data-card');
        for (var i = 0; i < a.cards.length; i++) if (a.cards[i].id === id) return a.cards[i];
        return null;
      }

      function place(btn, target) {
        var card = cardData(btn), clase = target.getAttribute('data-bin');
        if (!card) return;
        if (card.clase === clase) {
          var next = btn.nextElementSibling || btn.previousElementSibling;
          sort.select(null);
          btn.remove();
          lists[clase].appendChild(h('li', { class: 'game-bin__item', text: card.cifra }));
          placed += 1;
          updateProgress();
          kit.feedback(feedback, 'bien', ui.t('feedback.bien'), card.claveKB);
          if (placed === total) finish();
          else focusEl(next && next.classList.contains('game-card') ? next : deck.querySelector('.game-card'));
        } else {
          kit.feedback(feedback, 'casi', ui.t('feedback.casi', { pista: (bins[card.clase] || {}).pista || '' }));
        }
      }

      function finish() {
        var cols = (a.clave && a.clave.columnas) || [];
        var again = h('button', { type: 'button', class: 'btn', text: ui.t('feedback.repetir') });
        again.addEventListener('click', function () { build(); focusEl(deck.querySelector('.game-card')); });
        var titleId = kit.uid('clave');
        var title = h('h4', { class: 'game__end-title', id: titleId, tabindex: '-1', text: (a.clave && a.clave.titulo) || '' });
        endEl.appendChild(h('p', { class: 'game__done', text: c.fin }));
        endEl.appendChild(title);
        endEl.appendChild(h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-labelledby': titleId }, [
          h('table', { class: 'game__key' }, [
            h('thead', {}, [h('tr', {}, cols.map(function (col) { return h('th', { scope: 'col', text: col }); }))]),
            h('tbody', {}, a.cards.map(function (card) {
              var fig = card.cifras && card.cifras[0] && EIA.cifra.has(card.cifras[0])
                ? h('button', { type: 'button', class: 'fig', 'data-cifra': card.cifras[0], 'aria-haspopup': 'dialog', 'aria-expanded': 'false', text: card.cifra })
                : card.cifra;
              return h('tr', {}, [
                h('th', { scope: 'row' }, [fig]),
                h('td', { text: card.fuente }),
                h('td', {}, [
                  h('span', { text: card.claveKB }),
                  card.correccion ? h('span', { class: 'game__fix' }, [' ', h('a', { href: '#cifras/correccion-' + card.correccion, text: ui.t('banco.verCorreccion') })]) : null
                ])
              ]);
            }))
          ])
        ]));
        endEl.appendChild(h('p', { class: 'game__again' }, [again]));
        endEl.hidden = false;
        focusEl(title);
      }

      var sort = sorter({
        root: box,
        cards: '.game-card',
        targets: '.game-bin__target',
        place: place,
        select: function (card) {
          box.classList.toggle('has-selection', !!card);
          Array.prototype.forEach.call(binsEl.querySelectorAll('.game-bin__target'), function (t) {
            var b = bins[t.getAttribute('data-bin')];
            if (card) t.setAttribute('aria-label', kit.fmt(c.soltar, { cifra: (cardData(card) || {}).cifra, tipo: b.label }));
            else t.removeAttribute('aria-label');
          });
          if (card) kit.feedback(feedback, 'info', kit.fmt(c.elegida, { cifra: (cardData(card) || {}).cifra }));
        }
      });

      build();
      return { destroy: function () { sort.destroy(); box.remove(); } };
    }
  };

  ui.games = { sorter: sorter };
})(typeof window !== 'undefined' ? window : globalThis);
