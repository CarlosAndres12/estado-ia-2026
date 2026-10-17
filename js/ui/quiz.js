/* Estado de la IA 2026 — session quizzes (prompt §10.8) and the small kit every interactive tool
 * shares (this is the first interactions script in index.html).
 *
 *   EIA.ui.quiz.mount(el, sesion) -> { destroy }   the "Quiz" block of sesiones 1–6 (views.js hook):
 *       the KB's questions one at a time with large options. A right answer gets the bursting star,
 *       "¡Muy bien!", the correct option and the KB explanation; a wrong one the gentle spiral and
 *       "Casi. Pista: …" with another try. Score (first tries) at the end and "Repetir".
 *
 *   EIA.ui.kit — helpers for js/ui/{quiz,games,worksheets,rubrica,laminas-viewer,presenter}.js
 *     kit.uid(prefix)                  unique DOM id
 *     kit.t(path, vars)                copy from EIA.data.course.ui (EIA.ui.t), '' when missing
 *     kit.tv(path)                     raw copy value (arrays, objects)
 *     kit.mi(text) / kit.md(text)      KB inline / block markup -> HTML (EIA.markup)
 *     kit.plain(text)                  KB markup -> plain text
 *     kit.fmt(str, vars)               fills {placeholders} of tool copy taken from js/data
 *     kit.card(cls, kids, tag)         a paper card with the brush outline (no scroll reveal: tools
 *                                      add cards after the view's reveals were set up)
 *     kit.feedback(el, kind, main, extra)  renders feedback into el: kind 'bien' (star) | 'casi'
 *                                      (spiral) | 'info'; main is text, extra a text or a node
 *     kit.canvas(cls) / kit.fit(canvas, w, h) -> ctx   a DPR-capped canvas (≤ 2) drawing in CSS px
 *     kit.observeSize(el, fn) -> stop  calls fn(width) when el's width changes (ResizeObserver)
 *     kit.reduced()                    prefers-reduced-motion
 *     kit.editable(target)             true for text fields, selects and sliders (keys stay theirs)
 *
 * Feedback never relies on color alone: the star and the spiral are CSS images drawn by decor.js
 * (var(--exito), var(--casi)) and every state also says it in words. All copy comes from js/data. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  // ---------------------------------------------------------------------------------------------
  // Kit

  var uidCount = 0;
  var kit = ui.kit = {};

  kit.uid = function (prefix) { uidCount += 1; return (prefix || 'eia') + '-' + uidCount; };
  kit.t = function (path, vars) { return ui.t ? ui.t(path, vars) : ''; };
  kit.tv = function (path) { return ui.tv ? ui.tv(path) : null; };
  kit.fmt = function (str, vars) {
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? String(vars[k]) : '';
    });
  };
  kit.mi = function (text, opts) { return EIA.markup ? EIA.markup.inline(text || '', opts) : String(text || ''); };
  kit.md = function (text, opts) { return EIA.markup ? EIA.markup.render(text || '', opts) : String(text || ''); };
  kit.plain = function (text) { return EIA.markup ? EIA.markup.plain(text || '') : String(text || ''); };
  kit.h = function (tag, attrs, kids) { return ui.h(tag, attrs, kids); };

  kit.card = function (cls, kids, tag) {
    return ui.h(tag || 'div', { class: 'card' + (cls ? ' ' + cls : '') }, kids);
  };

  kit.feedback = function (el, kind, main, extra) {
    el.innerHTML = '';
    if (!kind) { el.hidden = true; return; }
    el.hidden = false;
    el.className = el.className.replace(/\s*feedback--\w+/g, '') + ' feedback--' + kind;
    var text = ui.h('div', { class: 'feedback__text' }, [
      main ? ui.h('p', { class: 'feedback__main', text: main }) : null,
      extra == null || extra === '' ? null : (typeof extra === 'string' ? ui.h('p', { class: 'feedback__extra', text: extra }) : extra)
    ]);
    el.appendChild(ui.h('span', { class: 'feedback__sign', 'aria-hidden': 'true' }));
    el.appendChild(text);
  };
  kit.feedbackBox = function (cls) {
    return ui.h('div', { class: 'feedback' + (cls ? ' ' + cls : ''), role: 'status', 'aria-live': 'polite', hidden: true });
  };

  kit.reduced = function () { return ui.reducedMotion ? ui.reducedMotion() : false; };

  kit.canvas = function (cls, label) {
    var c = doc.createElement('canvas');
    c.className = cls || '';
    if (label) { c.setAttribute('role', 'img'); c.setAttribute('aria-label', label); } else c.setAttribute('aria-hidden', 'true');
    return c;
  };
  // Sizes the backing store for (w, h) CSS px at the device ratio (capped at 2) and returns a
  // context that draws in CSS px.
  kit.fit = function (canvas, w, h, scale) {
    var k = Math.min(2, root.devicePixelRatio || 1) * (scale || 1);
    canvas.width = Math.max(1, Math.round(w * k));
    canvas.height = Math.max(1, Math.round(h * k));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  };
  kit.observeSize = function (el, fn) {
    var last = -1;
    function check() {
      var w = Math.floor(el.clientWidth || 0);
      if (!w || Math.abs(w - last) < 2) return;
      last = w;
      fn(w);
    }
    if (typeof root.ResizeObserver === 'function') {
      var ro = new root.ResizeObserver(check);
      ro.observe(el);
      return function () { ro.disconnect(); };
    }
    root.addEventListener('resize', check);
    root.setTimeout(check, 0);
    return function () { root.removeEventListener('resize', check); };
  };
  kit.engineReady = function () {
    return ui.decor && ui.decor.fontsReady ? ui.decor.fontsReady() : Promise.resolve();
  };

  kit.editable = function (el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
    if (tag !== 'INPUT') return false;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    return ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'color'].indexOf(type) < 0;
  };

  // ---------------------------------------------------------------------------------------------
  // Quiz

  var LETRAS = 'abcdefgh';

  function mount(el, sesion) {
    var s = EIA.data.sesiones && EIA.data.sesiones[sesion];
    var items = (s && s.quiz) || [];
    if (!items.length) return null;
    var h = ui.h, t = kit.t;
    var id = kit.uid('quiz');
    var state = { i: 0, tries: 0, score: 0, solved: false };

    var box = h('div', { class: 'quiz', role: 'group', 'aria-label': t('quiz.region', { n: sesion }) });
    var progress = h('p', { class: 'quiz__progress' });
    var question = h('h3', { class: 'quiz__q', id: id + '-q', tabindex: '-1' });
    var options = h('div', { class: 'quiz__options', role: 'group', 'aria-labelledby': id + '-q' });
    var feedback = kit.feedbackBox('quiz__feedback');
    var next = h('button', { type: 'button', class: 'btn btn--primary quiz__next', hidden: true });
    var card = kit.card('quiz__card', [progress, question, options, feedback, h('p', { class: 'quiz__actions' }, [next])]);
    var end = h('div', { class: 'quiz__end', hidden: true });
    box.appendChild(card);
    box.appendChild(end);
    el.appendChild(box);

    function render() {
      var q = items[state.i];
      state.tries = 0;
      state.solved = false;
      progress.textContent = t('quiz.progreso', { n: state.i + 1, total: items.length });
      question.innerHTML = kit.mi(q.pregunta);
      options.innerHTML = '';
      q.opciones.forEach(function (o, j) {
        var b = h('button', { type: 'button', class: 'quiz__option', 'data-i': j }, [
          h('span', { class: 'quiz__letter', 'aria-hidden': 'true', text: LETRAS.charAt(j) + ')' }),
          h('span', { class: 'quiz__text', text: kit.plain(o) }),
          h('span', { class: 'quiz__mark', 'aria-hidden': 'true' }),
          h('span', { class: 'visually-hidden quiz__state' })
        ]);
        options.appendChild(b);
      });
      kit.feedback(feedback, null);
      next.hidden = true;
      next.textContent = state.i < items.length - 1 ? t('quiz.siguiente') : t('quiz.terminar');
    }

    function answer(btn) {
      if (state.solved || btn.getAttribute('aria-disabled') === 'true') return;
      var q = items[state.i];
      var j = Number(btn.getAttribute('data-i'));
      state.tries += 1;
      if (j === q.respuesta) {
        state.solved = true;
        if (state.tries === 1) state.score += 1;
        btn.classList.add('is-right');
        Array.prototype.forEach.call(options.children, function (b) { b.setAttribute('aria-disabled', 'true'); });
        var letra = q.letra || LETRAS.charAt(q.respuesta);
        var extra = h('div', {}, [
          h('p', { class: 'feedback__extra', text: t('quiz.respuesta', { letra: letra, opcion: kit.plain(q.opciones[q.respuesta]) }) }),
          q.explicacion ? h('p', { class: 'feedback__extra', html: kit.mi(q.explicacion) }) : null
        ]);
        kit.feedback(feedback, 'bien', t('feedback.bien'), extra);
        next.hidden = false;
        try { next.focus({ preventScroll: true }); } catch (err) { next.focus(); }
      } else {
        btn.classList.add('is-wrong');
        btn.setAttribute('aria-disabled', 'true');
        btn.querySelector('.quiz__state').textContent = ' (' + t('quiz.probada') + ')';
        kit.feedback(feedback, 'casi', t('feedback.casi', { pista: q.pista || '' }));
      }
    }

    function finish() {
      card.hidden = true;
      end.innerHTML = '';
      var again = h('button', { type: 'button', class: 'btn', text: t('feedback.repetir') });
      again.addEventListener('click', restart);
      var heading = h('p', { class: 'quiz__score', tabindex: '-1', text: t('quiz.puntaje', { n: state.score, total: items.length }) });
      end.appendChild(kit.card('quiz__card quiz__card--end', [
        h('span', { class: 'quiz__end-sign', 'aria-hidden': 'true' }),
        h('p', { class: 'quiz__done', text: t('quiz.fin', { n: sesion }) }),
        heading,
        h('p', {}, [again])
      ]));
      end.hidden = false;
      try { heading.focus({ preventScroll: false }); } catch (err) { heading.focus(); }
      if (ui.announce) ui.announce(t('quiz.puntaje', { n: state.score, total: items.length }));
    }

    function restart() {
      state.i = 0;
      state.score = 0;
      end.hidden = true;
      card.hidden = false;
      render();
      try { question.focus({ preventScroll: false }); } catch (err) { question.focus(); }
    }

    function onClick(e) {
      var b = e.target.closest && e.target.closest('.quiz__option');
      if (b && options.contains(b)) answer(b);
    }
    options.addEventListener('click', onClick);
    next.addEventListener('click', function () {
      if (state.i < items.length - 1) {
        state.i += 1;
        render();
        try { question.focus({ preventScroll: false }); } catch (err) { question.focus(); }
      } else {
        finish();
      }
    });

    render();
    return {
      destroy: function () { options.removeEventListener('click', onClick); box.remove(); }
    };
  }

  ui.quiz = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
