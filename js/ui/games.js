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

  // =============================================================================================
  // S2 · «Pasos que se acumulan» (prompt §10.4): P = p^n with independent steps, an illustrative
  // example (permanent stamp), shown as a percentage and as a ruled ladder whose glow fades.

  var pasos = {
    // p: success per step in percent; n: steps (rounded). Inputs are clamped.
    prob: function (p, n) {
      var q = Math.min(1, Math.max(0, Number(p) / 100));
      var k = Math.max(0, Math.round(Number(n) || 0));
      return Math.pow(q, k);
    },
    // [P after step 1, …, P after step n]
    serie: function (p, n) {
      var out = [], k = Math.max(0, Math.round(Number(n) || 0));
      for (var i = 1; i <= k; i++) out.push(pasos.prob(p, i));
      return out;
    },
    /* formato(P) -> { decimal, porcentaje, aprox, texto }: "≈ 0,36 · 36%" (Spanish format, the
     * presets' wording). Rounding never turns a probability into a certainty or into zero: more
     * decimals appear near 0 and 1, and "< 0,01%" below what four decimals can show. */
    formato: function (P) {
      var fmt = EIA.util.formatNumber;
      function show(value, base, maxD, unit) {
        for (var d = base; d <= maxD; d++) {
          var r = Number(value.toFixed(d));
          if ((r > 0 || value <= 0) && (r < unit || value >= unit)) return { text: fmt(r, d), exact: Math.abs(r - value) < 1e-9 * unit, less: false };
        }
        return { text: '< ' + fmt(Math.pow(10, -maxD), maxD), exact: false, less: true };
      }
      P = Math.min(1, Math.max(0, Number(P) || 0));
      var dec = show(P, 2, 4, 1);
      var pct = show(P * 100, 0, 2, 100);
      var aprox = !dec.exact || !pct.exact;
      return {
        decimal: dec.text,
        porcentaje: pct.text + '%',
        aprox: aprox,
        texto: (aprox && !dec.less ? '≈ ' : '') + dec.text + ' · ' + pct.text + '%'
      };
    }
  };

  function drawLadder(ctx, w, hh, serie, o) {
    var E = EIA.engine, ink = E.ink, pal = E.palette, maq = pal.maquina, m = pal.mundo;
    ink.machineGrid(ctx, 0, 0, w, hh, { cell: 16 });
    var left = 74, right = 22, top = 26, bottom = 44;
    var x0 = left, x1 = w - right, y0 = top, y1 = hh - bottom, gap = y1 - y0;
    var n = serie.length, step = (x1 - x0) / Math.max(1, n);
    ink.rLine(ctx, x0 - 6, y0, x1 + 6, y0, { color: maq.linea, w: 1.4 });
    ink.rLine(ctx, x0 - 6, y1, x1 + 6, y1, { color: maq.linea, w: 1.4 });
    ctx.font = '400 13px "EIA Sans", system-ui, sans-serif';
    ctx.fillStyle = m.lienzo;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(EIA.util.formatPercent(100), x0 - 12, y0);
    ctx.fillText(EIA.util.formatPercent(0), x0 - 12, y1);
    if (E.figures && E.figures.lamp) E.figures.lamp(ctx, 30, (y0 + y1) / 2, 0.34, { t: 0 });
    var lw = Math.max(2, Math.min(10, step * 0.42));
    for (var i = 0; i < n; i++) {
      var x = x0 + (i + 0.5) * step, v = serie[i], yTop = y1 - v * gap;
      ink.rLine(ctx, x, y0, x, y1, { color: maq.rejilla, w: Math.max(1.2, lw * 0.5) });
      ink.glow(ctx, x, yTop, Math.max(10, lw * 2.6), maq.brilloVerde, 0.85 * v, true);
      ink.rLine(ctx, x, y1, x, yTop, { color: pal.mix(maq.linea, maq.brilloVerde, v), w: lw, cap: 'butt' });
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = m.lienzo;
    ctx.fillText(o.first, x0 + 0.5 * step, y1 + 10);
    if (n > 1) {
      var lastLabelW = ctx.measureText(o.last).width;
      var lx = Math.min(x1 - lastLabelW / 2, x0 + (n - 0.5) * step);
      if (lx - lastLabelW / 2 > x0 + 0.5 * step + ctx.measureText(o.first).width / 2 + 8) ctx.fillText(o.last, lx, y1 + 10);
    }
    if (n) {
      var xl = x0 + (n - 0.5) * step, yl = y1 - serie[n - 1] * gap;
      ctx.font = '700 17px "EIA Sans", system-ui, sans-serif';
      ctx.textBaseline = 'bottom';
      var tw = ctx.measureText(o.value).width;
      ctx.textAlign = 'left';
      var tx = Math.min(w - tw - 6, xl + 8);
      ctx.fillText(o.value, tx, Math.max(18, yl - 6));
    }
  }

  tools['s2-pasos'] = {
    mount: function (el, o) {
      var a = act(o.id || 's2-pasos');
      if (!a) return null;
      var kit = K(), c = a.ui || {}, fmt = EIA.util.formatNumber;
      var id = kit.uid('pasos');
      var state = { p: a.p.inicial, n: a.n.inicial };

      function slider(spec, key, decimals) {
        var inputId = id + '-' + key;
        var out = h('output', { class: 'calc__value', for: inputId });
        var input = h('input', {
          type: 'range', id: inputId, class: 'calc__range', min: spec.min, max: spec.max, step: spec.paso, value: spec.inicial
        });
        function sync() {
          state[key] = Number(input.value);
          out.textContent = fmt(state[key], decimals) + (spec.unidad || '');
          input.setAttribute('aria-valuetext', out.textContent);
        }
        input.addEventListener('input', function () { sync(); update(); });
        sync();
        return { input: input, out: out, sync: sync, el: h('div', { class: 'calc__field' }, [
          h('label', { class: 'calc__label', for: inputId }, [h('span', { text: spec.label }), out]),
          input
        ]) };
      }

      var stamp = h('p', { class: 'calc__stamp', html: ui.ilustrativoHTML() + ' <span>' + EIA.markup.escape(a.sello.text) + '</span>' });
      var sp = slider(a.p, 'p', 1), sn = slider(a.n, 'n', 0);
      var presets = h('div', { class: 'calc__presets', role: 'group', 'aria-label': c.ejemplos }, [
        h('span', { class: 'calc__presets-label', 'aria-hidden': 'true', text: c.ejemplos })
      ].concat(a.presets.map(function (pr) {
        var b = h('button', { type: 'button', class: 'btn btn--small', text: pr.label });
        b.addEventListener('click', function () {
          sp.input.value = pr.p; sn.input.value = pr.n;
          sp.sync(); sn.sync(); update();
        });
        return b;
      })));
      var parts = String(a.formula || '').split('^');
      var formula = h('p', { class: 'calc__formula', 'aria-hidden': 'true' }, [parts[0], parts[1] ? h('sup', { text: parts[1] }) : null]);
      var resultLabel = h('p', { class: 'calc__result-label' });
      var result = h('p', { class: 'calc__result', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
      var canvas = kit.canvas('calc__canvas');
      var figure = h('figure', { class: 'calc__figure' }, [canvas, h('figcaption', { class: 'calc__caption' })]);
      var table = h('table', {}, [
        h('caption', { text: c.tabla }),
        h('thead', {}, [h('tr', {}, (c.columnas || []).map(function (col) { return h('th', { scope: 'col', text: col }); }))]),
        h('tbody')
      ]);
      var hidden = h('div', { class: 'visually-hidden' }, [table]);
      var box = h('div', { class: 'calc' }, [
        stamp,
        h('div', { class: 'calc__controls' }, [sp.el, sn.el]),
        presets,
        h('div', { class: 'calc__out' }, [formula, resultLabel, result]),
        figure,
        hidden
      ]);
      el.appendChild(box);

      var width = 0;
      function draw() {
        if (!width || !EIA.engine.ink) return;
        var hh = Math.round(Math.max(200, Math.min(300, width * 0.36)));
        var ctx = kit.fit(canvas, width, hh);
        var serie = pasos.serie(state.p, state.n);
        try {
          drawLadder(ctx, width, hh, serie, {
            first: kit.fmt(c.paso, { n: 1 }), last: kit.fmt(c.paso, { n: state.n }),
            value: pasos.formato(serie[serie.length - 1]).porcentaje
          });
        } catch (err) { if (root.console) root.console.warn('[games] ladder: ' + err.message); }
      }
      function update() {
        var P = pasos.prob(state.p, state.n);
        var f = pasos.formato(P);
        resultLabel.textContent = kit.fmt(c.resultado, { n: state.n });
        result.textContent = f.texto;
        figure.lastChild.textContent = kit.fmt(c.escalera, { n: state.n });
        var body = table.querySelector('tbody');
        body.innerHTML = '';
        pasos.serie(state.p, state.n).forEach(function (v, i) {
          body.appendChild(h('tr', {}, [h('td', { text: String(i + 1) }), h('td', { text: pasos.formato(v).porcentaje })]));
        });
        draw();
      }
      var stop = kit.observeSize(figure, function (w) { width = w; draw(); });
      kit.engineReady().then(draw);
      update();
      return { destroy: function () { stop(); box.remove(); } };
    }
  };

  // =============================================================================================
  // Figure and source triggers (the popovers of js/ui/chips.js open on any of these buttons).

  function figButton(id, text, cls) {
    if (!id || !EIA.cifra.has(id)) return h('span', { class: cls || null, text: text });
    return h('button', { type: 'button', class: 'fig' + (cls ? ' ' + cls : ''), 'data-cifra': id, 'aria-haspopup': 'dialog', 'aria-expanded': 'false', text: text });
  }
  function sourceTags(ids) {
    var keys = [];
    (ids || []).forEach(function (id) {
      if (!EIA.cifra.has(id)) return;
      EIA.cifra(id).fuentes.forEach(function (k) { if (keys.indexOf(k) < 0 && EIA.data.fuentes[k]) keys.push(k); });
    });
    return keys.map(function (k) {
      return h('button', { type: 'button', class: 'source-tag', 'data-cita': k, 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, [
        h('span', { class: 'visually-hidden', text: ui.t('page.markup.fuente') + ' ' }), EIA.data.fuentes[k].etiqueta
      ]);
    });
  }

  // =============================================================================================
  // S3 · «El embudo, con cuidado» (prompt §10.5): lámina D7's four bars on one zero-based scale,
  // each a figure button; the fixed caution note; the 2026 edition on a separate panel.

  tools['s3-embudo'] = {
    mount: function (el, o) {
      var a = act(o.id || 's3-embudo');
      var d = a && (EIA.data.deck || []).filter(function (x) { return x.id === a.lamina; })[0];
      if (!a || !d || !d.diagrama) return null;
      var kit = K(), c = a.ui || {}, rot = d.rotulos || {};
      var panelId = kit.uid('edicion');
      var items = d.diagrama.items.map(function (it, i) {
        var v = Math.max(0, Math.min(100, Number(it.valor) || 0));
        var fill = h('span', { class: 'funnel__fill' + (it.aprox ? ' funnel__fill--aprox' : ''), style: 'width: ' + v.toFixed(4) + '%', 'data-aprox': it.aprox || null });
        var bar = h('button', {
          type: 'button', class: 'fig funnel__bar' + (it.cuello ? ' funnel__bar--neck' : ''), 'data-cifra': (it.cifras || [])[0] || a.barras[i],
          'aria-haspopup': 'dialog', 'aria-expanded': 'false'
        }, [
          h('span', { class: 'funnel__track', 'aria-hidden': 'true' }, [fill]),
          h('span', { class: 'funnel__label', text: it.text })
        ]);
        return h('li', { class: 'funnel__item' }, [
          bar,
          it.cuello && rot.cuello ? h('span', { class: 'funnel__neck', text: rot.cuello.text }) : null
        ]);
      });
      var toggle = h('button', { type: 'button', class: 'btn funnel__toggle', 'aria-expanded': 'false', 'aria-controls': panelId, text: a.edicion2026.label });
      var fid = a.edicion2026.cifras[0];
      var f = EIA.cifra.has(fid) ? EIA.cifra(fid) : null;
      var panel = h('section', { class: 'card funnel__panel', id: panelId, hidden: true, 'aria-label': a.edicion2026.label }, f ? [
        h('p', { class: 'funnel__panel-meta', html: ui.chipHTML(f.clase, f.tipo) + ' ' + ui.estadoHTML(f.estado) }),
        h('p', { class: 'funnel__panel-cifra' }, [figButton(fid, f.cifra)]),
        h('p', { class: 'funnel__panel-alcance', text: f.alcanceTexto }),
        h('p', { class: 'funnel__panel-src' }, sourceTags([fid])),
        h('p', { class: 'funnel__panel-note' }, [h('span', { class: 'funnel__nc', 'aria-hidden': 'true' }), h('strong', { text: a.edicion2026.nota })])
      ] : []);
      toggle.addEventListener('click', function () {
        var open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? c.ocultar : a.edicion2026.label;
      });
      var box = h('div', { class: 'funnel' }, [
        c.ayuda ? h('p', { class: 'funnel__help', text: c.ayuda }) : null,
        h('div', { class: 'card funnel__chart' }, [
          h('div', { class: 'funnel__ends', 'aria-hidden': 'true' }, [
            rot.uso ? h('span', { class: 'funnel__end funnel__end--top', text: rot.uso.text }) : null,
            rot.valor ? h('span', { class: 'funnel__end funnel__end--bottom', text: rot.valor.text }) : null
          ]),
          h('ol', { class: 'funnel__list', 'aria-label': d.titulo }, items),
          c.escala ? h('p', { class: 'funnel__scale', text: c.escala }) : null,
          sourceTags(a.barras).length ? h('p', { class: 'funnel__src' }, sourceTags(a.barras)) : null
        ]),
        h('p', { class: 'margin-note funnel__note', text: a.nota }),
        h('p', { class: 'funnel__actions' }, [toggle]),
        panel
      ]);
      el.appendChild(box);
      return { destroy: function () { box.remove(); } };
    }
  };

  ui.games = { sorter: sorter, pasos: pasos };
})(typeof window !== 'undefined' ? window : globalThis);
