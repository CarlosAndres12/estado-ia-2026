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

  // =============================================================================================
  // S5 · «Sube la escalera de evidencia» (prompt §10.6): the KB's three claims onto the six rungs;
  // feedback from the KB key, then each claim shows its traffic-light color as light + sign + label.

  function lightChip(colorId, label) {
    var L = (EIA.engine.palette && EIA.engine.palette.legend.semaforo) || [];
    var spec = L.filter(function (x) { return x.key === colorId; })[0];
    var sign = spec && ui.decor && ui.decor.signCanvas ? ui.decor.signCanvas(spec.sign, 24, { seed: 'semaforo-' + colorId, mono: true, className: 'light-chip__sign' }) : null;
    return h('span', { class: 'light-chip light-chip--' + colorId }, [
      h('span', { class: 'light light--' + colorId, 'aria-hidden': 'true' }), sign,
      h('span', { class: 'light-chip__label', text: label })
    ]);
  }

  tools['s5-escalera'] = {
    mount: function (el, o) {
      var a = act(o.id || 's5-escalera');
      if (!a || !a.peldanos) return null;
      var kit = K(), c = a.ui || {};
      var colores = {};
      (a.colores || []).forEach(function (x) { colores[x.id] = x; });
      var total = a.afirmaciones.length, placed = 0;
      var claimsId = kit.uid('claims'), rungsId = kit.uid('rungs');

      var help = h('p', { class: 'game__help', text: c.instrucciones });
      var progress = h('p', { class: 'game__progress' });
      var claims = h('div', { class: 'ladder__claims', role: 'group', 'aria-labelledby': claimsId });
      var rungs = h('ol', { class: 'ladder__rungs', 'aria-labelledby': rungsId });
      var feedback = kit.feedbackBox('game__feedback');
      var results = h('div', { class: 'ladder__results', hidden: true });
      var endEl = h('div', { class: 'game__end', hidden: true });
      var box = h('div', { class: 'game game--ladder' }, [
        help, progress,
        h('div', { class: 'ladder__board' }, [
          h('div', { class: 'ladder__col' }, [h('h4', { class: 'game__label', id: claimsId, text: c.afirmaciones }), claims]),
          h('div', { class: 'ladder__col ladder__col--rungs' }, [h('h4', { class: 'game__label', id: rungsId, text: c.escalera }), rungs])
        ]),
        feedback, results, endEl
      ]);
      el.appendChild(box);

      function claimData(btn) {
        var id = btn.getAttribute('data-claim');
        return a.afirmaciones.filter(function (x) { return x.id === id; })[0] || null;
      }
      function build() {
        placed = 0;
        claims.innerHTML = '';
        rungs.innerHTML = '';
        results.innerHTML = '';
        results.hidden = true;
        endEl.innerHTML = '';
        endEl.hidden = true;
        kit.feedback(feedback, null);
        a.afirmaciones.forEach(function (f) {
          claims.appendChild(h('button', { type: 'button', class: 'game-card ladder__claim', 'data-claim': f.id, 'aria-pressed': 'false' }, [
            h('span', { class: 'game-card__cifra', text: f.text })
          ]));
        });
        a.peldanos.forEach(function (p, i) {
          rungs.appendChild(h('li', { class: 'ladder__rung' }, [
            h('button', { type: 'button', class: 'ladder__target', 'data-rung': i + 1 }, [
              h('span', { class: 'ladder__n', text: String(i + 1) }),
              h('span', { class: 'ladder__text' }, [h('span', { class: 'visually-hidden', text: kit.fmt(c.escalon, { n: i + 1 }) + ': ' }), p])
            ]),
            h('ul', { class: 'ladder__placed' })
          ]));
        });
        progress.textContent = kit.fmt(c.progreso, { n: 0, total: total });
      }

      function place(btn, target) {
        var f = claimData(btn), n = Number(target.getAttribute('data-rung'));
        if (!f) return;
        if (n !== f.escalon) {
          kit.feedback(feedback, 'casi', ui.t('feedback.casi', { pista: n > f.escalon ? c.pistaAlta : c.pistaBaja }));
          return;
        }
        var col = colores[f.color] || { label: f.color };
        var next = btn.nextElementSibling || btn.previousElementSibling;
        sort.select(null);
        btn.remove();
        target.parentNode.querySelector('.ladder__placed').appendChild(h('li', { class: 'ladder__tag' }, [
          h('span', { class: 'ladder__tag-text', text: f.text }), lightChip(f.color, col.label)
        ]));
        placed += 1;
        progress.textContent = kit.fmt(c.progreso, { n: placed, total: total });
        kit.feedback(feedback, 'bien', ui.t('feedback.bien'), h('div', {}, [
          h('p', { class: 'feedback__extra', html: kit.mi(String(f.clave).replace(/[;.]\s*$/, '')) }),
          h('p', { class: 'feedback__extra' }, [lightChip(f.color, kit.fmt(c.color, { color: col.label }))])
        ]));
        results.hidden = false;
        if (!results.firstChild) results.appendChild(h('h4', { class: 'game__label', text: c.resultados }));
        results.appendChild(kit.card('card--thin ladder__result', [
          h('p', { class: 'ladder__result-head' }, [h('strong', { text: f.text }), ' ', lightChip(f.color, col.label)]),
          h('ul', {}, (f.detalle || []).map(function (d) { return h('li', { html: kit.mi(d) }); })),
          h('p', { class: 'ladder__result-src' }, sourceTags(f.cifras))
        ]));
        if (placed === total) finish();
        else focusEl(next && next.classList.contains('ladder__claim') ? next : claims.querySelector('.ladder__claim'));
      }

      function finish() {
        var again = h('button', { type: 'button', class: 'btn', text: ui.t('feedback.repetir') });
        again.addEventListener('click', function () { build(); focusEl(claims.querySelector('.ladder__claim')); });
        var titleId = kit.uid('clave');
        var title = h('h4', { class: 'game__end-title', id: titleId, tabindex: '-1', text: a.claveTitulo });
        endEl.appendChild(h('p', { class: 'game__done', text: c.fin }));
        endEl.appendChild(kit.card('card--thin ladder__key', [title, h('ul', { 'aria-labelledby': titleId }, a.afirmaciones.map(function (f) {
          return h('li', { html: kit.mi(f.clave) });
        }))]));
        endEl.appendChild(h('p', { class: 'game__again' }, [again]));
        endEl.hidden = false;
        focusEl(title);
      }

      var sort = sorter({
        root: box,
        cards: '.ladder__claim',
        targets: '.ladder__target',
        place: place,
        select: function (card) {
          box.classList.toggle('has-selection', !!card);
          var f = card ? claimData(card) : null;
          Array.prototype.forEach.call(rungs.querySelectorAll('.ladder__target'), function (t) {
            if (f) t.setAttribute('aria-label', kit.fmt(c.soltar, { afirmacion: f.text, n: t.getAttribute('data-rung') }));
            else t.removeAttribute('aria-label');
          });
          if (f) kit.feedback(feedback, 'info', kit.fmt(c.elegida, { afirmacion: f.text }));
        }
      });

      build();
      return { destroy: function () { sort.destroy(); box.remove(); } };
    }
  };

  // =============================================================================================
  // S6 · «Calendario de la Ley de IA» (prompt §11): a paper timeline with two layers, "La ley" and
  // the Ómnibus Digital. Pins sit at positions exactly proportional to their KB dates; turning the
  // Ómnibus on pins its own dates (stamped "aplazado" where the KB says so) and stamps the
  // general-purpose-model pins "sin cambios". No date the KB does not give is drawn.

  function isoTime(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
  }
  // Placement of the pins: alternate label rows inside each layer so neighbors never overlap.
  var CAL = { h: 312, axis: 154, rows: { ley: [18, 78], omnibus: [196, 254] }, label: 46 };

  function drawStrip(ctx, w, o) {
    var E = EIA.engine, ink = E.ink, m = E.palette.mundo;
    ink.card(ctx, 4, 4, w - 8, CAL.h - 8, { seed: 'cal-strip', weight: 3.2, radius: 16, fill: ui.decor ? ui.decor.PAPEL : m.lienzo, grain: false });
    ink.line(ctx, [18, CAL.axis + 1, w * 0.35, CAL.axis - 1, w * 0.7, CAL.axis + 1, w - 18, CAL.axis], { w: 3.6, profile: 'even', seed: 'cal-axis', dot: true });
    ctx.font = '700 13px "EIA Sans", system-ui, sans-serif';
    ctx.fillStyle = E.palette.mix(m.tinta, m.lienzo, 0.25);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    o.years.forEach(function (y) {
      ink.line(ctx, [y.x, CAL.axis - 9, y.x + 0.5, CAL.axis + 9], { w: 2.4, profile: 'even', seed: 'cal-year-' + y.label });
      ctx.fillText(y.label, y.x + 5, CAL.axis + 5);
    });
  }

  tools['s6-calendario'] = {
    mount: function (el, o) {
      var a = act(o.id || 's6-calendario');
      if (!a || !a.hitos) return null;
      var kit = K(), c = a.ui || {};
      var on = { ley: true, omnibus: false };
      var capas = {};
      a.capas.forEach(function (x) { capas[x.id] = x; });

      // Domain: four months of margin around the first and last KB dates.
      var times = a.hitos.map(function (x) { return isoTime(x.iso); });
      var t0 = Math.min.apply(null, times), t1 = Math.max.apply(null, times);
      var from = new Date(t0); from.setUTCMonth(from.getUTCMonth() - 4);
      var to = new Date(t1); to.setUTCMonth(to.getUTCMonth() + 4);
      var span = to.getTime() - from.getTime();
      function pos(iso) { return (isoTime(iso) - from.getTime()) / span; }

      // Pins: one per layer and date.
      var pins = [];
      a.hitos.forEach(function (x) {
        var p = pins.filter(function (q) { return q.capa === x.capa && q.iso === x.iso; })[0];
        if (!p) { p = { capa: x.capa, iso: x.iso, fecha: x.fecha, hitos: [] }; pins.push(p); }
        p.hitos.push(x);
      });
      ['ley', 'omnibus'].forEach(function (capa) {
        pins.filter(function (p) { return p.capa === capa; }).sort(function (p, q) { return isoTime(p.iso) - isoTime(q.iso); })
          .forEach(function (p, i) { p.row = i % 2; });
      });

      var layerBtns = a.capas.map(function (x) {
        var b = h('button', { type: 'button', class: 'btn cal__layer cal__layer--' + x.id, 'aria-pressed': on[x.id] ? 'true' : 'false' }, [
          h('span', { class: 'cal__layer-mark', 'aria-hidden': 'true' }), h('span', { text: x.label })
        ]);
        b.addEventListener('click', function () { on[x.id] = !on[x.id]; b.setAttribute('aria-pressed', on[x.id] ? 'true' : 'false'); render(); });
        return b;
      });
      var canvas = kit.canvas('cal__paper');
      var strip = h('div', { class: 'cal__strip' }, [canvas]);
      var wrap = h('div', { class: 'cal__wrap', role: 'group', tabindex: '-1', 'aria-label': c.linea }, [strip]);
      var omnibusNote = h('div', { class: 'cal__omnibus', hidden: true });
      var listId = kit.uid('hitos');
      var list = h('ol', { class: 'cal__list', 'aria-labelledby': listId });
      var box = h('div', { class: 'cal' }, [
        h('p', { class: 'cal__help', text: c.instrucciones }),
        h('div', { class: 'cal__layers', role: 'group', 'aria-label': c.capas }, layerBtns),
        wrap,
        h('p', { class: 'cal__scroll-hint', text: c.desplazar }),
        omnibusNote,
        h('h4', { class: 'game__label', id: listId, text: c.hitos }),
        list,
        h('p', { class: 'cal__legal' }, [h('span', { class: 'cal__legal-sign', 'aria-hidden': 'true' }), a.nota])
      ]);
      el.appendChild(box);

      function stampsOf(x) {
        var out = [];
        if (on.omnibus && x.estado === 'aplazado') out.push(a.sellos.aplazado);
        if (on.omnibus && x.estadoConOmnibus === 'sin cambios') out.push(a.sellos.sinCambios);
        return out;
      }
      function stampEls(list) { return list.map(function (s) { return h('span', { class: 'cal__stamp', text: s }); }); }
      var cardIds = {};
      function cardId(x) { return cardIds[x.id] || (cardIds[x.id] = kit.uid('hito-' + x.id)); }

      function render() {
        // Pins on the strip: an anchor at the exact date holds the stem and the dot; the label
        // above or below may slide sideways (clampLabels) to stay inside the paper.
        Array.prototype.forEach.call(strip.querySelectorAll('.cal__anchor'), function (n) { n.remove(); });
        pins.forEach(function (p) {
          if (!on[p.capa]) return;
          var first = p.hitos[0];
          var stamps = [];
          p.hitos.forEach(function (x) { stampsOf(x).forEach(function (s) { if (stamps.indexOf(s) < 0) stamps.push(s); }); });
          var top = CAL.rows[p.capa][p.row];
          var above = p.capa === 'ley';
          var stemTop = above ? top + CAL.label : CAL.axis;
          var stemH = above ? CAL.axis - top - CAL.label : top - CAL.axis;
          var label = p.hitos.map(function (x) { return x.etiqueta; }).join('; ');
          var pin = h('button', {
            type: 'button', class: 'cal__pin', style: 'top: ' + top + 'px',
            'aria-label': kit.fmt(c.pin, { fecha: p.fecha, etiqueta: label }) + (stamps.length ? ' (' + stamps.join(', ') + ')' : '')
          }, [
            h('span', { class: 'cal__pin-date', text: p.fecha }),
            stamps.length ? h('span', { class: 'cal__pin-stamps' }, stampEls(stamps)) : null
          ]);
          pin.addEventListener('click', function () {
            var card = doc.getElementById(cardId(first));
            if (!card) return;
            card.scrollIntoView({ block: 'nearest', behavior: kit.reduced() ? 'auto' : 'smooth' });
            card.classList.remove('is-flash');
            void card.offsetWidth;
            card.classList.add('is-flash');
            try { card.focus({ preventScroll: true }); } catch (err) { card.focus(); }
          });
          strip.appendChild(h('span', {
            class: 'cal__anchor cal__anchor--' + p.capa, 'data-pos': pos(p.iso), 'data-capa': p.capa, 'data-row': p.row,
            style: 'left: ' + (pos(p.iso) * 100).toFixed(4) + '%'
          }, [
            h('span', { class: 'cal__stem', 'aria-hidden': 'true', style: 'top: ' + stemTop + 'px; height: ' + stemH + 'px' }),
            h('span', { class: 'cal__dot', 'aria-hidden': 'true', style: 'top: ' + CAL.axis + 'px' }),
            pin
          ]));
        });
        // The Ómnibus layer's own sentence.
        omnibusNote.innerHTML = '';
        omnibusNote.hidden = !on.omnibus;
        if (on.omnibus) {
          var om = capas.omnibus || {};
          omnibusNote.appendChild(kit.card('card--thin cal__omnibus-card', [
            h('p', { class: 'cal__omnibus-title', text: om.label }),
            h('p', {}, [om.texto ? om.texto + '. ' : '', a.sinCambios ? a.sinCambios.texto : '']),
            h('p', { class: 'cal__src' }, sourceTags((om.cifras || []).concat(a.sinCambios ? a.sinCambios.cifras : [])))
          ]));
        }
        // The cards, in date order.
        list.innerHTML = '';
        a.hitos.filter(function (x) { return on[x.capa]; }).sort(function (x, y) {
          return isoTime(x.iso) - isoTime(y.iso) || (x.capa === y.capa ? 0 : x.capa === 'ley' ? -1 : 1);
        }).forEach(function (x) {
          var stamps = stampsOf(x);
          list.appendChild(h('li', {
            class: 'card card--thin cal__card cal__card--' + x.capa + (x.tarjeta === 'texto' ? ' cal__card--texto' : ''),
            id: cardId(x), tabindex: '-1'
          }, [
            h('p', { class: 'cal__card-head' }, [
              h('span', { class: 'cal__card-layer' }, [h('span', { class: 'visually-hidden', text: c.capa + ': ' }), (capas[x.capa] || {}).label]),
              ' ',
              figButton((x.cifras || [])[0], x.fecha, 'cal__card-date')
            ].concat(stamps.length ? [' '].concat(stampEls(stamps)) : [])),
            h('p', { class: 'cal__card-text', text: x.texto }),
            h('p', { class: 'cal__src' }, sourceTags(x.cifras))
          ]));
        });
        draw();
      }

      var width = 0;
      function draw() {
        if (!width || !EIA.engine.ink) return;
        var ctx = kit.fit(canvas, width, CAL.h);
        var years = [];
        for (var y = from.getUTCFullYear() + 1; y <= to.getUTCFullYear(); y++) {
          var tt = Date.UTC(y, 0, 1);
          if (tt > from.getTime() && tt < to.getTime()) years.push({ label: String(y), x: (tt - from.getTime()) / span * width });
        }
        try { drawStrip(ctx, width, { years: years }); } catch (err) { if (root.console) root.console.warn('[games] calendar: ' + err.message); }
        clampLabels();
      }
      // Labels stay inside the paper, and a label in the row nearer the axis never covers the
      // stem of a neighbor whose label sits in the farther row (same layer).
      var NEAR = { ley: 1, omnibus: 0 };
      function clampLabels() {
        var W = strip.clientWidth, pad = 12, gapStem = 9;
        var anchors = Array.prototype.slice.call(strip.querySelectorAll('.cal__anchor'));
        anchors.forEach(function (an) {
          var pin = an.querySelector('.cal__pin');
          var x = Number(an.getAttribute('data-pos')) * W, half = pin.offsetWidth / 2;
          var left = x - half, capa = an.getAttribute('data-capa');
          function fit() { left = Math.max(pad, Math.min(W - pad - 2 * half, left)); }
          fit();
          if (Number(an.getAttribute('data-row')) === NEAR[capa]) {
            anchors.forEach(function (other) {
              if (other === an || other.getAttribute('data-capa') !== capa || Number(other.getAttribute('data-row')) === NEAR[capa]) return;
              var sx = Number(other.getAttribute('data-pos')) * W;
              if (sx < left - gapStem || sx > left + 2 * half + gapStem) return;
              left = sx < x ? sx + gapStem : sx - gapStem - 2 * half;
              fit();
            });
          }
          pin.style.transform = 'translateX(' + Math.round(left - x) + 'px)';
        });
      }
      var stop = kit.observeSize(strip, function (w) { width = w; draw(); });
      kit.engineReady().then(draw);
      render();
      return { destroy: function () { stop(); box.remove(); } };
    }
  };

  // =============================================================================================
  // S7 · «Marco de indicadores» (prompt §11): the KB's nine levels; each opens its question.

  tools['s7-indicadores'] = {
    mount: function (el, o) {
      var a = act(o.id || 's7-indicadores');
      if (!a || !a.niveles) return null;
      var kit = K(), c = a.ui || {}, cols = a.columnas || [];
      var toggles = [];
      function set(btn, q, open) {
        q.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.lastChild.textContent = open ? c.ocultar : c.ver;
      }
      var list = h('ol', { class: 'ind__list' }, a.niveles.map(function (n, i) {
        var qid = kit.uid('pregunta');
        var q = h('p', { class: 'ind__pregunta', id: qid, hidden: true }, [
          h('span', { class: 'ind__q-label', text: (cols[2] || '') + ': ' }), n.pregunta
        ]);
        var btn = h('button', { type: 'button', class: 'btn btn--small ind__toggle', 'aria-expanded': 'false', 'aria-controls': qid }, [
          h('span', { class: 'visually-hidden', text: n.nivel + ': ' }), h('span', { text: c.ver })
        ]);
        btn.addEventListener('click', function () { set(btn, q, q.hidden); });
        toggles.push({ btn: btn, q: q });
        return h('li', { class: 'ind__row ind__row--' + n.id }, [
          h('span', { class: 'ind__n', 'aria-hidden': 'true', text: String(i + 1) }),
          h('div', { class: 'ind__main' }, [
            h('p', { class: 'ind__nivel' }, [h('span', { class: 'visually-hidden', text: (cols[0] || '') + ': ' }), n.nivel]),
            h('p', { class: 'ind__indicadores' }, [h('span', { class: 'ind__label', text: (cols[1] || '') + ': ' }), n.indicadores]),
            q
          ]),
          btn
        ]);
      }));
      var all = h('button', { type: 'button', class: 'btn ind__all', text: c.todas });
      all.addEventListener('click', function () {
        var open = toggles.some(function (x) { return x.q.hidden; });
        toggles.forEach(function (x) { set(x.btn, x.q, open); });
        all.textContent = open ? c.ninguna : c.todas;
      });
      var box = h('div', { class: 'ind' }, [
        h('div', { class: 'ind__bar' }, [c.ayuda ? h('p', { class: 'ind__help', text: c.ayuda }) : null, all]),
        kit.card('ind__card', [list])
      ]);
      el.appendChild(box);
      return { destroy: function () { box.remove(); } };
    }
  };

  // S7 · «Cuatro escenarios plausibles» (KB §10, contenido 7; prompt §4.4): four windows with the
  // legend's pattern fills (dots, stripes, small stars, checks) and their KB labels.

  tools['s7-escenarios'] = {
    mount: function (el, o) {
      var a = act(o.id || 's7-escenarios');
      if (!a || !a.escenarios) return null;
      var kit = K(), c = a.ui || {};
      var wins = [];
      var list = h('ul', { class: 'esc__list' }, a.escenarios.map(function (e, i) {
        var canvas = kit.canvas('esc__window');
        var M = EIA.engine.palette ? EIA.engine.palette.mundo : {};
        wins.push({ canvas: canvas, patron: e.patron, seed: 'escenario-' + e.id, wash: [M.celeste, M.amarillo, M.verde, M.rojo][i % 4] || '#E7D3A8' });
        return h('li', { class: 'card esc__card' }, [
          canvas,
          h('p', { class: 'esc__n', text: kit.fmt(c.escenario, { n: i + 1 }) }),
          h('h4', { class: 'esc__title', text: e.titulo }),
          h('p', { class: 'esc__text', html: kit.mi(e.texto) })
        ]);
      }));
      var box = h('div', { class: 'esc' }, [c.titulo ? h('h4', { class: 'game__label', text: c.titulo }) : null, list]);
      el.appendChild(box);
      function draw() {
        var E = EIA.engine;
        if (!E.ink || !E.figures) return;
        wins.forEach(function (w) {
          var cw = Math.max(120, Math.floor(w.canvas.parentNode.clientWidth - 8)), ch = 96;
          var ctx = kit.fit(w.canvas, cw, ch);
          var m = E.palette.mundo, mix = E.palette.mix;
          ctx.save();
          ctx.beginPath();
          ctx.rect(6, 6, cw - 12, ch - 12);
          ctx.clip();
          ctx.fillStyle = mix(w.wash, m.lienzo, 0.62);
          ctx.fillRect(6, 6, cw - 12, ch - 12);
          E.figures.pattern(ctx, w.patron, 6, 6, cw - 12, ch - 12, { color: mix(m.tinta, m.lienzo, 0.3), spacing: 18, seed: w.seed });
          ctx.restore();
          E.ink.line(ctx, [6, 6, cw - 6, 7, cw - 7, ch - 6, 6, ch - 7], { w: 3.2, closed: true, profile: 'even', seed: w.seed + '-frame' });
          E.ink.line(ctx, [cw / 2, 8, cw / 2 + 1, ch - 8], { w: 2.4, profile: 'even', seed: w.seed + '-mullion' });
        });
      }
      var stop = kit.observeSize(list, draw);
      kit.engineReady().then(draw);
      return { destroy: function () { stop(); box.remove(); } };
    }
  };

  // S7 · «Presentación y defensa: 7 minutos + 3 de preguntas por equipo» (prompt §10.12): a hand-
  // drawn two-phase timer (honest stopwatch: the elapsed share of the whole turn as an exact
  // sector, the phase change marked) with the list of teams. An optional soft chime is generated
  // with Web Audio when a phase ends; nothing plays unless the facilitator turns it on.

  var TEAMS_KEY = 'temporizador:equipos';
  var audio = null;
  function chime() {
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === 'suspended' && audio.resume) audio.resume();
      var t = audio.currentTime + 0.02;
      [659.25, 987.77].forEach(function (f, i) {
        var osc = audio.createOscillator(), g = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.22);
        g.gain.exponentialRampToValueAtTime(0.16, t + i * 0.22 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 1.4);
        osc.connect(g);
        g.connect(audio.destination);
        osc.start(t + i * 0.22);
        osc.stop(t + i * 0.22 + 1.5);
      });
    } catch (err) { /* no sound: the words on screen still say it */ }
  }

  tools['s7-presentacion'] = {
    mount: function (el, o) {
      var a = act(o.id || 's7-presentacion');
      if (!a || !a.fases) return null;
      var kit = K(), c = a.ui || {}, store = EIA.util.store, clock = EIA.util.formatClock;
      var fases = a.fases.map(function (f) { return { label: f.label, ms: f.minutos * 60000, minutos: f.minutos }; });
      var total = fases.reduce(function (s, f) { return s + f.ms; }, 0);
      var st = { teams: (store.get(TEAMS_KEY, []) || []).filter(function (x) { return typeof x === 'string'; }), current: 0, elapsed: 0, running: false, t0: 0, timer: 0, phase: 0, chime: false };
      var id = kit.uid('timer');

      var teamList = h('ol', { class: 'timer__teams-list' });
      var input = h('input', { type: 'text', id: id + '-name', class: 'timer__input', maxlength: '80', autocomplete: 'off' });
      var add = h('button', { type: 'button', class: 'btn btn--small', text: c.agregar });
      var teamsCard = kit.card('card--thin timer__teams', [
        h('h4', { class: 'timer__h', text: c.equipos }),
        h('p', { class: 'timer__empty help', text: c.sinEquipos }),
        teamList,
        h('div', { class: 'timer__add' }, [h('label', { class: 'field-label', for: id + '-name', text: c.nombre }), h('div', { class: 'timer__add-row' }, [input, add])])
      ]);
      var turn = h('p', { class: 'timer__turn' });
      var canvas = kit.canvas('timer__dial', ' ');
      var phaseEl = h('p', { class: 'timer__phase' });
      var digits = h('p', { class: 'timer__digits', 'aria-hidden': 'true' });
      var left = h('p', { class: 'timer__left' });
      var live = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
      var bar = h('div', { class: 'timer__bar', 'aria-hidden': 'true' }, fases.map(function (f, i) {
        return h('span', { class: 'timer__seg timer__seg--' + i, style: 'flex: ' + f.minutos + ' 1 0' }, [
          h('span', { class: 'timer__seg-fill' }), h('span', { class: 'timer__seg-label', text: kit.fmt(c.fase, { fase: f.label, minutos: f.minutos }) })
        ]);
      }));
      var bStart = h('button', { type: 'button', class: 'btn btn--primary', text: ui.t('modoClase.iniciar') });
      var bReset = h('button', { type: 'button', class: 'btn', text: ui.t('modoClase.reiniciar') });
      var bNext = h('button', { type: 'button', class: 'btn', text: c.siguiente });
      var bell = h('input', { type: 'checkbox', id: id + '-bell' });
      var clockCard = kit.card('timer__clock', [
        turn,
        h('div', { class: 'timer__face' }, [canvas, h('div', { class: 'timer__readout' }, [phaseEl, digits, left])]),
        bar,
        h('p', { class: 'timer__buttons' }, [bStart, bReset, bNext]),
        h('p', { class: 'timer__bell' }, [bell, h('label', { for: id + '-bell', text: c.campana })]),
        live
      ]);
      var box = h('div', { class: 'timer' }, [clockCard, teamsCard]);
      el.appendChild(box);

      function teamName(i) { return st.teams[i] || ''; }
      function saveTeams() { store.set(TEAMS_KEY, st.teams); }
      function renderTeams() {
        teamList.innerHTML = '';
        teamsCard.querySelector('.timer__empty').hidden = st.teams.length > 0;
        st.teams.forEach(function (name, i) {
          var pick = h('button', { type: 'button', class: 'timer__team' + (i === st.current ? ' is-current' : ''), 'aria-pressed': i === st.current ? 'true' : 'false', 'aria-label': kit.fmt(c.elegir, { equipo: name }) }, [
            h('span', { class: 'timer__team-n', 'aria-hidden': 'true', text: String(i + 1) }), h('span', { text: name })
          ]);
          pick.addEventListener('click', function () { st.current = i; reset(); renderTeams(); });
          var del = h('button', { type: 'button', class: 'timer__remove', 'aria-label': kit.fmt(c.quitar, { equipo: name }), text: '×' });
          del.addEventListener('click', function () {
            st.teams.splice(i, 1);
            if (st.current >= st.teams.length) st.current = Math.max(0, st.teams.length - 1);
            saveTeams(); renderTeams(); paint();
          });
          teamList.appendChild(h('li', { class: 'timer__team-row' }, [pick, del]));
        });
      }
      function addTeam() {
        var name = String(input.value || '').replace(/\s+/g, ' ').trim();
        if (!name) { input.focus(); return; }
        st.teams.push(name);
        input.value = '';
        saveTeams(); renderTeams(); paint();
        input.focus();
      }
      add.addEventListener('click', addTeam);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addTeam(); } });

      function now() { return root.performance ? root.performance.now() : Date.now(); }
      function elapsed() { return Math.min(total, st.elapsed + (st.running ? now() - st.t0 : 0)); }
      function phaseAt(ms) {
        var acc = 0;
        for (var i = 0; i < fases.length; i++) { acc += fases[i].ms; if (ms < acc) return { i: i, end: acc }; }
        return { i: fases.length - 1, end: total, done: true };
      }
      function paint() {
        var e = elapsed(), ph = phaseAt(e);
        var name = teamName(st.current);
        turn.textContent = name ? kit.fmt(c.turno, { equipo: name }) : c.sinTurno;
        phaseEl.textContent = kit.fmt(c.fase, { fase: fases[ph.i].label, minutos: fases[ph.i].minutos });
        var remaining = clock(ph.done ? 0 : (ph.end - e) / 1000 + 0.999);
        digits.textContent = remaining;
        left.textContent = ph.done ? (name ? kit.fmt(c.cumplido, { equipo: name }) : c.cumplidoSinEquipo) : kit.fmt(c.quedan, { tiempo: remaining, fase: fases[ph.i].label });
        canvas.setAttribute('aria-label', kit.fmt(c.reloj, { transcurrido: clock(e / 1000), total: clock(total / 1000) }));
        var acc = 0;
        Array.prototype.forEach.call(bar.children, function (seg, i) {
          var share = Math.max(0, Math.min(1, (e - acc) / fases[i].ms));
          seg.firstChild.style.width = (share * 100).toFixed(3) + '%';
          acc += fases[i].ms;
        });
        bStart.textContent = st.running ? ui.t('modoClase.pausar') : ui.t('modoClase.iniciar');
        drawDial(e);
        if (ph.i !== st.phase || ph.done) {
          if (ph.done && st.running) {
            st.elapsed = total; st.running = false; root.clearInterval(st.timer);
            bStart.textContent = ui.t('modoClase.iniciar');
            live.textContent = left.textContent;
            if (st.chime) chime();
          } else if (ph.i !== st.phase && st.running) {
            live.textContent = kit.fmt(c.empieza, { fase: fases[ph.i].label });
            if (st.chime) chime();
          }
          st.phase = ph.i;
        }
      }
      var dialSize = 0;
      function drawDial(e) {
        var E = EIA.engine;
        if (!E.figures || !E.figures.stopwatch) return;
        var size = dialSize || 180;
        var ctx = kit.fit(canvas, size, size);
        var k = size / 150, cx = size / 2, cy = size / 2 + 8 * k;
        var mark = fases[0].ms / total;
        E.figures.stopwatch(ctx, cx, cy, k, { elapsed: e / total, mark: Math.min(mark, e / total), wedge: E.palette.mundo.amarillo, extra: E.palette.mundo.celeste });
        // The phase change, drawn on the dial at its exact angle.
        var ang = -Math.PI / 2 + mark * Math.PI * 2, r0 = 9 * k, r1 = 64 * k;
        E.ink.line(ctx, [cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1], { w: 3, profile: 'even', seed: 'timer-mark', dot: true });
      }

      function tick() { paint(); }
      function start() {
        if (st.running) {
          st.elapsed = elapsed(); st.running = false; root.clearInterval(st.timer);
        } else {
          if (elapsed() >= total) st.elapsed = 0;
          st.running = true; st.t0 = now(); st.phase = phaseAt(st.elapsed).i;
          st.timer = root.setInterval(tick, 250);
        }
        paint();
      }
      function reset() {
        st.running = false; root.clearInterval(st.timer); st.elapsed = 0; st.phase = 0; live.textContent = '';
        paint();
      }
      bStart.addEventListener('click', start);
      bReset.addEventListener('click', reset);
      bNext.addEventListener('click', function () {
        if (st.teams.length) st.current = (st.current + 1) % st.teams.length;
        reset(); renderTeams();
      });
      bell.addEventListener('change', function () { st.chime = bell.checked; });

      var stop = kit.observeSize(clockCard, function (w) { dialSize = Math.round(Math.max(150, Math.min(230, w * 0.32))); paint(); });
      kit.engineReady().then(paint);
      renderTeams();
      paint();
      return { destroy: function () { root.clearInterval(st.timer); stop(); box.remove(); } };
    }
  };

  ui.games = { sorter: sorter, pasos: pasos };
})(typeof window !== 'undefined' ? window : globalThis);
