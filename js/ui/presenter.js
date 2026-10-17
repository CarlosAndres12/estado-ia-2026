/* Estado de la IA 2026 — "Modo clase" (prompt §10.11, §11): project a session as full-screen slides.
 *
 *   EIA.ui.presenter.open(arg)   #clase (arg null: the chooser) and #clase/<1–7|taller> (views.js hook).
 *   EIA.ui.presenter.close()     closes without navigating (the router calls open again on #clase/…).
 *
 * A session becomes slides that follow its KB agenda (EIA.data.modoClase.bloques): a cover, then per
 * agenda block a divider, its láminas (still frames), the video marked "Opcional en clase" (pauses at
 * the end of each chapter), the activity (instructions in large type + its tool), the discussion
 * questions and the quiz with answers revealed on click. The 4-hour workshop chains sesiones 1, 3, 4
 * and 7. Type is ≥ 28 px. Keys: ←/→ and PageUp/PageDown always move slides (in a text field only
 * PageUp/PageDown), Home/End, Space or K play/pause the video of a video slide, N opens the notes
 * drawer ("Las notas se ven en la proyección": Qué decir, Nota, keys, Errores de lectura frecuentes),
 * F full screen, Esc closes the drawer, then exits (history.back() to the page before Modo clase).
 * The session clock (Iniciar / Pausar / Reiniciar) draws the agenda blocks as the KB gives them
 * (sesión 1: 15, 30, 25, 35 and 15 min) with a needle where the session should be, and a gentle note
 * when the current block runs long; the workshop shows only its total. The slide and the clock are
 * remembered per session (EIA.util.store). "Abrir vista del facilitador" opens a second window
 * (index.html?vista=facilitador#clase/<arg>) that follows the slides through postMessage and shows
 * the notes, the next slide and the clock. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }
  function t(path, vars) { return ui.t ? ui.t(path, vars) : ''; }
  function cl(key, vars) { return t('clase.' + key, vars); }
  function mc(key, vars) { return t('modoClase.' + key, vars); }
  function kit() { return ui.kit; }
  function store() { return EIA.util.store; }
  function now() { return root.performance ? root.performance.now() : Date.now(); }
  function deckEntry(id) { return (EIA.data.deck || []).filter(function (d) { return d.id === id; })[0] || null; }
  function act(id) { return (EIA.data.actividades || {})[id] || null; }
  function videoById(id) { return (EIA.data.videos || []).filter(function (v) { return v.id === id; })[0] || null; }
  function opciones() { return (EIA.data.modoClase && EIA.data.modoClase.opciones) || []; }
  function argOf(o) { return o.sesion ? String(o.sesion) : o.id; }
  function optionFor(arg) { return opciones().filter(function (o) { return argOf(o) === String(arg); })[0] || null; }
  function sesionesDe(arg) {
    var o = optionFor(arg);
    if (!o) return [];
    return o.sesiones ? o.sesiones.slice() : [o.sesion];
  }
  function isFacilitator() { try { return EIA.util.query().vista === 'facilitador'; } catch (err) { return false; } }

  // =============================================================================================
  // Slides from the KB agenda

  function buildSlides(arg) {
    var list = [];
    sesionesDe(arg).forEach(function (n) {
      var s = EIA.data.sesiones[n];
      if (!s) return;
      var bloques = ((EIA.data.modoClase || {}).bloques || {})[n] || [];
      list.push({ kind: 'portada', sesion: n, block: -1 });
      bloques.forEach(function (b) {
        var base = { sesion: n, block: b.agenda };
        function add(o) { var x = {}; Object.keys(base).forEach(function (k) { x[k] = base[k]; }); Object.keys(o).forEach(function (k) { x[k] = o[k]; }); list.push(x); }
        add({ kind: 'bloque' });
        if (b.pregunta) add({ kind: 'pregunta' });
        (b.laminas || []).forEach(function (id) { if (deckEntry(id)) add({ kind: 'lamina', id: id }); });
        if (b.evidencia) { add({ kind: 'tipos' }); add({ kind: 'advertencias' }); }
        (b.videos || []).forEach(function (id) { if (videoById(id)) add({ kind: 'video', id: id }); });
        (b.contenido || []).forEach(function (cn) { add({ kind: 'contenido', n: cn }); });
        (b.actividades || []).forEach(function (id) { if (act(id)) add({ kind: 'actividad', id: id }); });
        if (b.discusion && s.discusion && s.discusion.length) add({ kind: 'discusion' });
        if (b.quiz && s.quiz) s.quiz.forEach(function (q, i) { add({ kind: 'quiz', i: i }); });
      });
    });
    return list;
  }

  function agendaBlock(sl) {
    var s = EIA.data.sesiones[sl.sesion];
    return s && sl.block >= 0 ? s.agenda[sl.block] : null;
  }

  // Short title of a slide (bar, announcements, "Sigue:" in the facilitator view).
  function slideTitle(sl) {
    var s = EIA.data.sesiones[sl.sesion] || {};
    var k = kit();
    switch (sl.kind) {
      case 'portada': return mc('sesion', { n: sl.sesion }) + ' · ' + s.titulo;
      case 'bloque': case 'pregunta': return k.plain((agendaBlock(sl) || {}).bloque || '');
      case 'lamina': var d = deckEntry(sl.id); return d ? t('visor.lamina', { n: d.n, titulo: d.titulo }) : sl.id;
      case 'tipos': return ((EIA.data.course.marco || {}).tipos || {}).titulo || '';
      case 'advertencias': return ((EIA.data.course.marco || {}).advertencias || {}).titulo || '';
      case 'video': return (videoById(sl.id) || {}).title || sl.id;
      case 'contenido':
        var c = (s.contenido || []).filter(function (x) { return x.n === sl.n; })[0];
        return cl('contenido', { n: sl.n }) + (c ? ' · ' + k.plain(c.titulo) : '');
      case 'actividad': var a = act(sl.id); return a ? k.plain(a.kb && a.kb.titulo ? a.kb.titulo : a.titulo) : sl.id;
      case 'discusion': return s.discusionTitulo || t('sesion.discusion');
      case 'quiz': return cl('quizN', { n: sl.i + 1, total: (s.quiz || []).length });
    }
    return '';
  }

  // =============================================================================================
  // Notes of a slide (drawer and facilitator view). Facilitator copy only: KB text verbatim.

  function slideNotes(sl) {
    var k = kit(), s = EIA.data.sesiones[sl.sesion] || {};
    var box = h('div', { class: 'clase-notes' });
    var any = false;
    if (sl.kind === 'lamina' && ui.laminasViewer) {
      var fl = (s.facilitador && s.facilitador.laminas || {})[sl.id];
      var d = deckEntry(sl.id);
      if (d && ((d.notas || {}).decir || (d.notas || {}).nota || ((d.notas || {}).correcciones || []).length || (fl && (fl.decir || fl.nota)))) {
        box.appendChild(ui.laminasViewer.notes(sl.id, { noLinks: true }));
        any = true;
      }
    }
    if (sl.kind === 'actividad') {
      var a = act(sl.id), key = null;
      if (a && a.cards && a.clave) {
        key = h('table', { class: 'clase-notes__table' }, [
          h('thead', {}, [h('tr', {}, a.clave.columnas.map(function (c) { return h('th', { scope: 'col', text: c }); }))]),
          h('tbody', {}, a.cards.map(function (c) { return h('tr', {}, [h('td', { text: c.cifra }), h('td', { text: c.fuente }), h('td', { text: c.claveKB })]); }))
        ]);
      } else if (a && a.afirmaciones) {
        key = h('ul', {}, a.afirmaciones.map(function (f) { return h('li', { html: k.mi(f.clave) }); }));
      } else if (a && a.kb && a.kb.clave && a.kb.clave.items) {
        key = h('ul', {}, a.kb.clave.items.map(function (i) { return h('li', { html: k.mi(i) }); }));
      }
      if (key) {
        box.appendChild(h('h4', { class: 'clase-notes__h', text: (a.claveTitulo || (a.clave && a.clave.titulo) || (a.kb.clave && a.kb.clave.titulo) || cl('claves')) }));
        box.appendChild(key);
        any = true;
      }
    }
    if (sl.kind === 'quiz') {
      var q = (s.quiz || [])[sl.i];
      if (q) {
        box.appendChild(h('p', {}, [h('strong', { text: cl('respuesta') + ': ' }), (q.letra || String.fromCharCode(97 + q.respuesta)) + ') ' + k.plain(q.opciones[q.respuesta])]));
        if (q.explicacion) box.appendChild(h('p', { html: k.mi(q.explicacion) }));
        any = true;
      }
    }
    if (!any) box.appendChild(h('p', { class: 'empty-note', text: cl('sinNotas') }));
    if (s.errores && s.errores.length) {
      box.appendChild(h('h4', { class: 'clase-notes__h', text: mc('errores') }));
      box.appendChild(h('ul', { class: 'clase-notes__errors' }, s.errores.map(function (e) { return h('li', { html: k.mi(e) }); })));
    }
    return box;
  }

  // =============================================================================================
  // Slide views. Each returns { el, onShow?, onHide?, onResize?, destroy?, player? }.

  function slideShell(sl, cls, kids) {
    return h('section', { class: 'clase-slide clase-slide--' + sl.kind + (cls ? ' ' + cls : ''), 'aria-roledescription': 'diapositiva', hidden: true }, kids);
  }

  function viewPortada(sl) {
    var s = EIA.data.sesiones[sl.sesion], k = kit();
    return { el: slideShell(sl, null, [
      h('span', { class: 'clase-portada__sign sesion-sign sesion-sign--' + sl.sesion, 'aria-hidden': 'true' }),
      h('p', { class: 'clase-kicker', text: mc('sesion', { n: sl.sesion }) }),
      h('h3', { class: 'clase-portada__title', text: s.titulo }),
      h('p', { class: 'clase-portada__q' }, [h('span', { class: 'clase-label', text: t('sesion.pregunta') + ': ' }), h('span', { html: k.mi(s.pregunta) })]),
      h('ol', { class: 'clase-agenda' }, s.agenda.map(function (b, i) {
        return h('li', {}, [h('span', { class: 'clase-agenda__n', text: String(i + 1) }), h('span', { class: 'clase-agenda__min', text: cl('minutos', { minutos: b.minutos }) }), h('span', { html: k.mi(b.bloque) })]);
      }))
    ]) };
  }

  function viewBloque(sl) {
    var s = EIA.data.sesiones[sl.sesion], b = agendaBlock(sl), k = kit();
    return { el: slideShell(sl, null, [
      h('p', { class: 'clase-kicker', text: cl('bloque', { n: sl.block + 1, total: s.agenda.length }) + ' · ' + cl('minutos', { minutos: b.minutos }) }),
      h('h3', { class: 'clase-bloque__title', html: k.mi(b.bloque) }),
      b.recurso && b.recurso !== '—' ? h('p', { class: 'clase-bloque__recurso', text: cl('recurso', { recurso: b.recurso }) }) : null
    ]) };
  }

  function viewPregunta(sl) {
    var b = agendaBlock(sl), k = kit();
    return { el: slideShell(sl, null, [
      h('span', { class: 'clase-pregunta__sign', 'aria-hidden': 'true' }),
      h('p', { class: 'clase-pregunta__text', html: k.mi(b.bloque) })
    ]) };
  }

  function viewLamina(sl) {
    var canvas = h('canvas', { class: 'clase-lamina__canvas', role: 'img', 'aria-label': ui.laminasViewer ? ui.laminasViewer.describe(sl.id) : '' });
    var box = h('div', { class: 'clase-lamina' }, [canvas]);
    var el = slideShell(sl, null, [box]);
    function fit() {
      if (!ui.laminasViewer || el.hidden) return;
      var r = box.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ui.laminasViewer.draw(canvas, sl.id, Math.floor(Math.min(r.width, r.height * 16 / 9)));
    }
    return { el: el, onShow: function () { kit().engineReady().then(fit); fit(); }, onResize: fit };
  }

  function viewTipos(sl) {
    var m = (EIA.data.course.marco || {}).tipos || {}, k = kit(), cols = m.columnas || [];
    return { el: slideShell(sl, 'zone-meaning', [
      h('h3', { class: 'clase-h', text: m.titulo }),
      h('ul', { class: 'clase-tipos' }, (m.items || []).map(function (it) {
        return h('li', { class: 'card clase-tipo' }, [
          h('p', { class: 'clase-tipo__chip', html: ui.chipHTML(it.clase, it.tipo) }),
          h('p', { class: 'clase-tipo__que' }, [h('span', { class: 'visually-hidden', text: (cols[1] || '') + ': ' }), it.queEs]),
          h('p', { class: 'clase-tipo__ej' }, [h('span', { class: 'clase-label', text: (cols[2] || '') + ': ' }), h('span', { html: k.mi(it.ejemplo) })])
        ]);
      }))
    ]) };
  }

  function viewAdvertencias(sl) {
    var m = (EIA.data.course.marco || {}).advertencias || {};
    return { el: slideShell(sl, null, [
      h('h3', { class: 'clase-h', text: m.titulo }),
      h('ol', { class: 'clase-advs' }, (m.items || []).map(function (txt, i) {
        return h('li', { class: 'clase-adv' }, [h('span', { class: 'clase-adv__sign adv-stamp__sign', style: 'background-image: var(--adv-' + (i + 1) + ', none)', 'aria-hidden': 'true' }), h('span', { class: 'clase-adv__text', text: txt })]);
      }))
    ]) };
  }

  function viewVideo(sl) {
    var v = videoById(sl.id);
    var holder = h('div', { class: 'clase-video__holder' });
    var el = slideShell(sl, null, [
      h('div', { class: 'clase-video__head' }, [h('h3', { class: 'clase-h', text: v.title }), h('span', { class: 'badge clase-video__badge', text: mc('videoOpcional') })]),
      h('div', { class: 'clase-video' }, [holder])
    ]);
    var view = { el: el, player: null };
    view.onShow = function () {
      if (view.player || !EIA.engine.player || !EIA.engine.player.create) return;
      try { view.player = EIA.engine.player.create(holder, sl.id, { chapterPause: true }); } catch (err) { if (root.console) root.console.warn('[clase] video ' + sl.id + ': ' + err.message); }
    };
    view.onHide = function () { if (view.player) view.player.pause(); };
    view.destroy = function () { if (view.player) { view.player.destroy(); view.player = null; } };
    return view;
  }

  function mountToolInto(holder, sesion, id) {
    var a = act(id), tools = ui.tools || {};
    var tool = tools[id] || (a ? tools[a.tipo] : null);
    if (!tool || typeof tool.mount !== 'function') return null;
    try { return tool.mount(holder, { sesion: sesion, id: id }) || null; } catch (err) {
      if (root.console) root.console.warn('[clase] tool ' + id + ': ' + err.message);
      return null;
    }
  }

  function viewActividad(sl) {
    var a = act(sl.id), k = kit(), kb = a.kb || null;
    var tool = h('div', { class: 'clase-tool' });
    var el = slideShell(sl, null, [
      h('div', { class: 'clase-actividad__head' }, [
        h('h3', { class: 'clase-h', html: k.mi(kb && kb.titulo ? kb.titulo : a.titulo) }),
        kb && kb.duracion ? h('span', { class: 'badge', text: kb.duracion }) : null
      ]),
      kb && kb.consigna ? h('div', { class: 'clase-consigna', html: k.md(kb.consigna) }) : (a.consigna ? h('div', { class: 'clase-consigna', html: k.md(a.consigna) }) : null),
      kb && kb.pasos && kb.pasos.length ? h('ol', { class: 'clase-pasos' }, kb.pasos.map(function (p) { return h('li', { html: k.mi(p) }); })) : null,
      tool
    ]);
    var inst = mountToolInto(tool, sl.sesion, sl.id);
    return { el: el, destroy: function () { if (inst && inst.destroy) inst.destroy(); } };
  }

  function viewContenido(sl) {
    var s = EIA.data.sesiones[sl.sesion], k = kit();
    var c = (s.contenido || []).filter(function (x) { return x.n === sl.n; })[0];
    var updates = (s.actualizaciones || []).filter(function (u) { return u.contenido === sl.n; });
    var tools = h('div', { class: 'clase-tool' });
    var el = slideShell(sl, null, [
      h('p', { class: 'clase-kicker', text: cl('contenido', { n: sl.n }) }),
      h('h3', { class: 'clase-h', html: c ? k.mi(c.titulo) : '' }),
      c ? h('div', { class: 'clase-prose prose', html: k.md(c.cuerpo, { updates: updates }) }) : null,
      tools
    ]);
    // Activities that belong to this contenido point and are not in the session's tool list.
    var insts = [];
    Object.keys(EIA.data.actividades || {}).forEach(function (id) {
      var a = act(id);
      var ns = Array.isArray(a.contenido) ? a.contenido : (a.contenido ? [a.contenido] : []);
      if (a.sesion === sl.sesion && (s.actividades || []).indexOf(id) < 0 && ns.indexOf(sl.n) >= 0) {
        var holder = h('div', { class: 'clase-tool__item' });
        tools.appendChild(holder);
        insts.push(mountToolInto(holder, sl.sesion, id));
      }
    });
    return { el: el, destroy: function () { insts.forEach(function (x) { if (x && x.destroy) x.destroy(); }); } };
  }

  function viewDiscusion(sl) {
    var s = EIA.data.sesiones[sl.sesion], k = kit();
    return { el: slideShell(sl, null, [
      h('h3', { class: 'clase-h', text: s.discusionTitulo || t('sesion.discusion') }),
      h('ol', { class: 'clase-discusion' }, s.discusion.map(function (q) { return h('li', { html: k.mi(q) }); }))
    ]) };
  }

  function viewQuiz(sl) {
    var s = EIA.data.sesiones[sl.sesion], q = s.quiz[sl.i], k = kit();
    var opts = h('ol', { class: 'clase-quiz__options', type: 'a' }, q.opciones.map(function (o, j) {
      return h('li', { class: 'clase-quiz__option' + (j === q.respuesta ? ' is-answer' : '') }, [
        h('span', { class: 'clase-quiz__letter', 'aria-hidden': 'true', text: String.fromCharCode(97 + j) + ')' }),
        h('span', { text: k.plain(o) }),
        j === q.respuesta ? h('span', { class: 'clase-quiz__mark', 'aria-hidden': 'true' }) : null,
        j === q.respuesta ? h('span', { class: 'clase-quiz__tag', text: cl('respuesta') }) : null
      ]);
    }));
    var expl = q.explicacion ? h('p', { class: 'clase-quiz__expl', html: k.mi(q.explicacion), hidden: true }) : null;
    var btn = h('button', { type: 'button', class: 'btn btn--primary clase-quiz__reveal', 'aria-expanded': 'false', text: cl('mostrarRespuesta') });
    var el = slideShell(sl, null, [
      h('p', { class: 'clase-kicker', text: cl('quizN', { n: sl.i + 1, total: s.quiz.length }) }),
      h('h3', { class: 'clase-quiz__q', html: k.mi(q.pregunta) }),
      opts,
      h('p', { class: 'clase-quiz__actions' }, [btn]),
      expl
    ]);
    function reveal(on) {
      el.classList.toggle('is-revealed', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      btn.textContent = on ? cl('ocultarRespuesta') : cl('mostrarRespuesta');
      if (expl) expl.hidden = !on;
    }
    btn.addEventListener('click', function () { reveal(!el.classList.contains('is-revealed')); });
    opts.addEventListener('click', function () { reveal(true); });
    return { el: el };
  }

  var VIEWS = {
    portada: viewPortada, bloque: viewBloque, pregunta: viewPregunta, lamina: viewLamina, tipos: viewTipos,
    advertencias: viewAdvertencias, video: viewVideo, actividad: viewActividad, contenido: viewContenido,
    discusion: viewDiscusion, quiz: viewQuiz
  };

  // =============================================================================================
  // The session clock and its hand-drawn agenda bar

  var PATTERNS = ['puntos', 'rayas', 'estrellas', 'cuadros', 'ondas', 'espirales'];

  function drawAgendaBar(canvas, w, o) {
    var E = EIA.engine;
    if (!E.ink || !E.figures || !w) return;
    var hh = 52;
    var ctx = kit().fit(canvas, w, hh);
    var m = E.palette.mundo, pad = 10, span = w - pad * 2, top = 8, bh = 30;
    function x(min) { return pad + span * Math.max(0, Math.min(o.total, min)) / o.total; }
    var fills = [m.lienzoOcre, E.palette.mix(m.celeste, m.lienzo, 0.45), E.palette.mix(m.amarillo, m.lienzo, 0.55), E.palette.mix(m.verde, m.lienzo, 0.7)];
    o.blocks.forEach(function (b, i) {
      var x0 = x(b.desde), x1 = x(b.hasta), bw = x1 - x0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, top, bw, bh);
      ctx.clip();
      ctx.fillStyle = i === o.current ? E.palette.mix(m.amarillo, m.lienzo, 0.25) : fills[i % fills.length];
      ctx.fillRect(x0, top, bw, bh);
      E.figures.pattern(ctx, PATTERNS[i % PATTERNS.length], x0, top, bw, bh, { color: E.palette.mix(m.tinta, m.lienzo, 0.5), spacing: 13, seed: 'clase-bar-' + i });
      ctx.restore();
      E.ink.line(ctx, [x0, top - 1, x0, top + bh + 1], { w: 2.4, profile: 'even', seed: 'clase-sep-' + i });
      if (o.blocks.length > 1 && bw > 22) {
        var cx = x0 + bw / 2, cy = top + bh / 2, r = 10;
        E.ink.circle(ctx, cx, cy, r, { fill: ui.decor ? ui.decor.PAPEL : m.lienzo, line: true, w: 1.8, seed: 'clase-n-' + i, irr: 0.05 });
        ctx.fillStyle = m.tinta;
        ctx.font = '700 12px "EIA Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy + 1);
      }
    });
    E.ink.line(ctx, [x(o.total), top - 1, x(o.total), top + bh + 1], { w: 2.4, profile: 'even', seed: 'clase-sep-end' });
    E.ink.line(ctx, [pad - 2, top, x(o.total) + 2, top], { w: 2.2, profile: 'even', seed: 'clase-top' });
    E.ink.line(ctx, [pad - 2, top + bh, x(o.total) + 2, top + bh], { w: 2.2, profile: 'even', seed: 'clase-bottom' });
    if (o.current >= 0 && o.blocks[o.current]) {
      var b = o.blocks[o.current];
      E.ink.line(ctx, [x(b.desde) + 1, top + bh + 6, x(b.hasta) - 1, top + bh + 6], { w: 4, profile: 'swell', seed: 'clase-current' });
    }
    // The needle: where the session should be by the clock.
    var nx = x(o.elapsed);
    ctx.fillStyle = m.rojo;
    ctx.beginPath();
    ctx.moveTo(nx - 6, 1);
    ctx.lineTo(nx + 6, 1);
    ctx.lineTo(nx, 9);
    ctx.closePath();
    ctx.fill();
    E.ink.line(ctx, [nx, 6, nx + 0.3, top + bh + 2], { w: 2.6, profile: 'even', color: m.rojo, seed: 'clase-needle' });
  }

  // =============================================================================================
  // The presentation

  var cur = null;           // the open presentation or chooser
  var lastOutside = null;   // last route seen outside #clase (where "Salir" goes back)

  if (root.addEventListener && doc) {
    root.addEventListener('eia:route', function (e) {
      var d = e.detail || {};
      if (d.route !== 'clase') {
        lastOutside = { route: d.route, block: d.block };
        if (cur) cur.close(false);
      }
    });
  }

  function exitTarget(arg) {
    var prev = EIA.router.previous();
    if (prev && prev.route !== 'clase') return 'back';
    if (lastOutside) return lastOutside;
    var n = Number(arg);
    if (n >= 1 && n <= 7) return { route: 's' + n, block: '' };
    return { route: arg === 'taller' ? 'mapa' : 'inicio', block: '' };
  }
  function exit(arg) {
    var target = exitTarget(arg);
    if (cur) cur.close(false);
    if (target === 'back' && root.history.length > 1) root.history.back();
    else EIA.router.go(target === 'back' ? 'inicio' : target.route, target.block || '');
  }

  function setTitle(text) {
    if (!cur) return;
    if (cur.baseTitle == null) cur.baseTitle = doc.title;
    doc.title = t('page.documento', { vista: text, sitio: t('sitio.titulo') });
  }

  function fullscreen() {
    var el = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (el) { (doc.exitFullscreen || doc.webkitExitFullscreen || function () {}).call(doc); return; }
    var target = doc.documentElement;
    var req = target.requestFullscreen || target.webkitRequestFullscreen;
    if (req) { var p = req.call(target); if (p && p.catch) p.catch(function () {}); }
  }

  // ---- Chooser (#clase) ----------------------------------------------------------------------

  function openChooser() {
    var k = kit();
    var titleId = k.uid('clase-elegir');
    var close = h('button', { type: 'button', class: 'btn btn--small clase__exit', 'aria-label': cl('salirAria'), text: cl('salir') });
    var el = h('div', { class: 'clase clase--chooser', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
      h('div', { class: 'clase__bar' }, [h('h2', { class: 'clase__title', id: titleId, text: mc('titulo') }), close]),
      h('div', { class: 'clase__choose' }, [
        h('p', { class: 'clase-kicker', text: cl('elegir') }),
        h('ul', { class: 'clase-options' }, opciones().map(function (o) {
          return h('li', {}, [h('a', { class: 'clase-option', href: '#clase/' + argOf(o) }, [
            o.sesion ? h('span', { class: 'sesion-sign sesion-sign--' + o.sesion, 'aria-hidden': 'true' }) : h('span', { class: 'clase-option__all', 'aria-hidden': 'true' }),
            h('span', { text: o.label })
          ])]);
        })),
        h('p', { class: 'help clase__keys', text: cl('elegirAyuda') })
      ])
    ]);
    var shell = k.modal(el, {
      onKey: function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); exit(null); return true; }
        return false;
      }
    });
    close.addEventListener('click', function () { exit(null); });
    cur = {
      arg: null,
      baseTitle: null,
      close: function (restore) {
        var base = cur && cur.baseTitle;
        shell.close(restore);
        if (base != null) doc.title = base;
        cur = null;
      }
    };
    setTitle(mc('titulo'));
    var first = el.querySelector('.clase-option');
    if (first) try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
  }

  // ---- Slides (#clase/<arg>) -------------------------------------------------------------------

  function openSlides(arg) {
    var k = kit();
    var slides = buildSlides(arg);
    if (!slides.length) { openChooser(); return; }
    var opt = optionFor(arg);
    var isTaller = sesionesDe(arg).length > 1;
    var sessionLabel = isTaller ? opt.label : mc('sesion', { n: sesionesDe(arg)[0] });
    var KEY = 'clase:' + arg;
    var saved = store().get(KEY, {}) || {};
    var i = Math.max(0, Math.min(slides.length - 1, Number(saved.slide) || 0));
    var built = [];
    var drawerOpen = false;
    var clock = { elapsed: Math.max(0, Number(saved.reloj) || 0), running: false, t0: 0, timer: 0 };
    var s0 = EIA.data.sesiones[sesionesDe(arg)[0]];
    var total = isTaller ? (opt.minutos || 240) : s0.agenda[s0.agenda.length - 1].hasta;
    var blocks = isTaller ? [{ desde: 0, hasta: total, bloque: cl('taller') }] : s0.agenda;

    var titleId = k.uid('clase-titulo');
    var drawerId = k.uid('clase-notas');
    var sign = h('span', { class: 'clase__sign sesion-sign', 'aria-hidden': 'true' });
    var kicker = h('p', { class: 'clase__kicker', text: mc('titulo') + ' · ' + sessionLabel });
    var title = h('h2', { class: 'clase__title', id: titleId });
    var count = h('p', { class: 'clase__count' });
    var live = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
    var bNotes = h('button', { type: 'button', class: 'btn btn--small', 'aria-expanded': 'false', 'aria-controls': drawerId, text: t('laminas.notas') });
    var bFacil = h('button', { type: 'button', class: 'btn btn--small', text: mc('vistaFacilitador') });
    var bFull = h('button', { type: 'button', class: 'btn btn--small', text: cl('pantallaCompleta') });
    var bExit = h('button', { type: 'button', class: 'btn btn--small btn--primary clase__exit', 'aria-label': cl('salirAria'), text: cl('salir') });
    var stage = h('div', { class: 'clase__stage' });
    var drawerBody = h('div', { class: 'clase__drawer-body' });
    var drawer = h('aside', { class: 'clase__drawer', id: drawerId, hidden: true, 'aria-label': t('laminas.notas') }, [
      h('div', { class: 'clase__drawer-head' }, [
        h('p', { class: 'clase__warning' }, [h('span', { class: 'clase__warning-sign', 'aria-hidden': 'true' }), mc('avisoNotas')]),
        h('button', { type: 'button', class: 'btn btn--small clase__drawer-close', text: cl('notasCerrar') })
      ]),
      drawerBody
    ]);
    var bStart = h('button', { type: 'button', class: 'btn btn--small btn--primary', text: mc('iniciar') });
    var bReset = h('button', { type: 'button', class: 'btn btn--small', text: mc('reiniciar') });
    var timeEl = h('p', { class: 'clase__time' });
    var barCanvas = k.canvas('clase__bar-canvas', isTaller ? cl('barraTaller') : cl('barra', { n: blocks.length }));
    var note = h('p', { class: 'clase__note', role: 'status', 'aria-live': 'polite' });
    var bPrev = h('button', { type: 'button', class: 'btn clase__nav', 'aria-label': cl('anterior') }, [h('span', { 'aria-hidden': 'true', text: '‹ ' }), cl('anterior')]);
    var bNext = h('button', { type: 'button', class: 'btn btn--primary clase__nav', 'aria-label': cl('siguiente') }, [cl('siguiente'), h('span', { 'aria-hidden': 'true', text: ' ›' })]);
    var barWrap = h('div', { class: 'clase__barwrap' }, [barCanvas]);
    var el = h('div', { class: 'clase', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
      h('div', { class: 'clase__bar' }, [
        sign,
        h('div', { class: 'clase__heading' }, [kicker, title]),
        count,
        h('div', { class: 'clase__tools' }, [bNotes, bFacil, bFull, bExit])
      ]),
      h('div', { class: 'clase__main' }, [stage, drawer]),
      h('div', { class: 'clase__foot' }, [
        h('div', { class: 'clase__clock', role: 'group', 'aria-label': cl('reloj') }, [bStart, bReset, timeEl]),
        h('div', { class: 'clase__progress' }, [barWrap, note]),
        h('div', { class: 'clase__navs' }, [bPrev, bNext])
      ]),
      live
    ]);

    // -- slides --
    function view(j) {
      if (!built[j]) {
        var make = VIEWS[slides[j].kind];
        built[j] = make ? make(slides[j]) : { el: slideShell(slides[j], null, []) };
        stage.appendChild(built[j].el);
      }
      return built[j];
    }
    function show(j, quiet) {
      j = Math.max(0, Math.min(slides.length - 1, j));
      if (built[i] && j !== i) {
        built[i].el.hidden = true;
        if (built[i].onHide) built[i].onHide();
      }
      i = j;
      var v = view(i), sl = slides[i];
      v.el.hidden = false;
      stage.scrollTop = 0;
      v.el.scrollTop = 0;
      if (v.onShow) v.onShow();
      var label = slideTitle(sl);
      title.textContent = label;
      sign.className = 'clase__sign sesion-sign sesion-sign--' + sl.sesion;
      count.textContent = cl('posicion', { n: i + 1, total: slides.length });
      count.setAttribute('aria-label', cl('posicionAria', { n: i + 1, total: slides.length }));
      bPrev.disabled = i === 0;
      bNext.disabled = i === slides.length - 1;
      el.setAttribute('data-kind', sl.kind);
      if (!quiet) live.textContent = cl('posicionAria', { n: i + 1, total: slides.length }) + ': ' + label;
      if (drawerOpen) renderDrawer();
      save();
      paintClock();
      broadcast();
      // Neighbors are built ahead so moving on is instant (no video player until shown).
      if (i + 1 < slides.length && slides[i + 1].kind !== 'video') view(i + 1);
    }
    function renderDrawer() {
      drawerBody.innerHTML = '';
      drawerBody.appendChild(slideNotes(slides[i]));
    }
    function setDrawer(on) {
      drawerOpen = on;
      drawer.hidden = !on;
      el.classList.toggle('has-drawer', on);
      bNotes.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) renderDrawer();
      root.requestAnimationFrame(function () { if (built[i] && built[i].onResize) built[i].onResize(); });
    }

    // -- clock --
    function elapsedMs() { return clock.elapsed + (clock.running ? now() - clock.t0 : 0); }
    var barW = 0;
    function paintClock() {
      var ms = elapsedMs(), min = ms / 60000;
      timeEl.textContent = cl('tiempo', { transcurrido: EIA.util.formatClock(ms / 1000), total: total });
      bStart.textContent = clock.running ? mc('pausar') : mc('iniciar');
      var sl = slides[i], current = isTaller ? -1 : sl.block;
      try { drawAgendaBar(barCanvas, barW, { blocks: blocks, total: total, elapsed: min, current: current }); } catch (err) { if (root.console) root.console.warn('[clase] bar: ' + err.message); }
      var msg = '';
      if (ms > 0) {
        if (isTaller) { if (min > total) msg = cl('largoTaller'); }
        else if (current >= 0 && blocks[current] && min > blocks[current].hasta) {
          msg = cl('largo', { n: current + 1, bloque: kit().plain(blocks[current].bloque) });
        }
      }
      if (note.textContent !== msg) note.textContent = msg;
      note.hidden = !msg;
    }
    function tick() { paintClock(); if (clock.running && Math.round(elapsedMs() / 1000) % 5 === 0) save(); broadcast(); }
    function startStop() {
      if (clock.running) { clock.elapsed = elapsedMs(); clock.running = false; root.clearInterval(clock.timer); }
      else { clock.running = true; clock.t0 = now(); clock.timer = root.setInterval(tick, 1000); }
      save();
      paintClock();
      broadcast();
    }
    function resetClock() {
      clock.running = false; root.clearInterval(clock.timer); clock.elapsed = 0;
      save(); paintClock(); broadcast();
    }
    function save() { store().set(KEY, { slide: i, reloj: Math.round(elapsedMs()) }); }

    // -- facilitator window --
    var child = null;
    function broadcast() {
      if (!child || child.closed) return;
      try {
        child.postMessage({ tipo: 'eia-clase', accion: 'estado', arg: arg, slide: i, total: slides.length, elapsed: elapsedMs(), running: clock.running }, '*');
      } catch (err) { /* window gone */ }
    }
    function onMessage(e) {
      var d = e.data;
      if (!d || d.tipo !== 'eia-clase' || !child || e.source !== child) return;
      if (d.accion === 'hola') broadcast();
      else if (d.accion === 'ir' && typeof d.slide === 'number') show(d.slide);
      else if (d.accion === 'reloj') startStop();
    }
    root.addEventListener('message', onMessage);
    function openFacilitator() {
      var url = root.location.href.split('#')[0].split('?')[0] + '?vista=facilitador#clase/' + arg;
      child = root.open(url, 'eia-facilitador', 'width=980,height=760');
      root.setTimeout(broadcast, 1500);
    }

    // -- input --
    bPrev.addEventListener('click', function () { show(i - 1); });
    bNext.addEventListener('click', function () { show(i + 1); });
    bNotes.addEventListener('click', function () { setDrawer(!drawerOpen); });
    drawer.querySelector('.clase__drawer-close').addEventListener('click', function () { setDrawer(false); bNotes.focus(); });
    bFull.addEventListener('click', fullscreen);
    bFacil.addEventListener('click', openFacilitator);
    bExit.addEventListener('click', function () { exit(arg); });
    bStart.addEventListener('click', startStop);
    bReset.addEventListener('click', resetClock);
    function onFs() { bFull.textContent = (doc.fullscreenElement || doc.webkitFullscreenElement) ? cl('salirPantalla') : cl('pantallaCompleta'); }
    doc.addEventListener('fullscreenchange', onFs);

    var shell = k.modal(el, {
      onKey: function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return false;
        var key = e.key, target = e.target;
        var typing = k.editable(target);
        var v = built[i], inPlayer = !!(v && v.player && v.player.el && v.player.el.contains(target));
        function done() { e.preventDefault(); e.stopPropagation(); return true; }
        if (key === 'Escape' || key === 'Esc') {
          if (drawerOpen) { setDrawer(false); return done(); }
          exit(arg);
          return done();
        }
        if (key === 'PageDown' || (key === 'ArrowRight' && !typing)) { show(i + 1); return done(); }
        if (key === 'PageUp' || (key === 'ArrowLeft' && !typing)) { show(i - 1); return done(); }
        if (typing) return false;
        if (key === 'Home' && !inPlayer) { show(0); return done(); }
        if (key === 'End' && !inPlayer) { show(slides.length - 1); return done(); }
        if (key === 'n' || key === 'N') { setDrawer(!drawerOpen); return done(); }
        if ((key === ' ' || key === 'k' || key === 'K') && slides[i].kind === 'video' && v && v.player && !inPlayer) {
          if (key === ' ' && /^(BUTTON|A|SUMMARY)$/.test(target.tagName)) return false;
          v.player.toggle();
          return done();
        }
        if ((key === 'f' || key === 'F') && !inPlayer) { fullscreen(); return done(); }
        return false;
      }
    });
    var stopSize = k.observeSize(barWrap, function (w) { barW = w; paintClock(); });
    function onResize() { if (built[i] && built[i].onResize) built[i].onResize(); }
    root.addEventListener('resize', onResize);

    cur = {
      arg: arg,
      baseTitle: null,
      el: el,
      show: show,
      close: function (restore) {
        var base = cur && cur.baseTitle;
        clock.elapsed = elapsedMs();
        clock.running = false;
        save();
        root.clearInterval(clock.timer);
        root.removeEventListener('message', onMessage);
        root.removeEventListener('resize', onResize);
        doc.removeEventListener('fullscreenchange', onFs);
        stopSize();
        built.forEach(function (b) { if (b && b.destroy) { try { b.destroy(); } catch (err) { /* already gone */ } } });
        shell.close(restore);
        if (base != null) doc.title = base;
        cur = null;
      }
    };
    setTitle(mc('titulo') + ' · ' + sessionLabel);
    show(i, true);
    kit().engineReady().then(paintClock);
    try { bNext.focus({ preventScroll: true }); } catch (err) { bNext.focus(); }
  }

  // ---- Facilitator window (index.html?vista=facilitador#clase/<arg>) -----------------------------

  function openFacilitatorView(arg) {
    var k = kit();
    var slides = buildSlides(arg);
    var opt = optionFor(arg);
    if (!slides.length || !opt) { openChooser(); return; }
    var titleId = k.uid('facil');
    var state = { slide: 0, elapsed: 0, running: false, at: now() };
    var status = h('p', { class: 'clase-facil__status', role: 'status', text: cl('sinConexion') });
    var current = h('h3', { class: 'clase-facil__current' });
    var next = h('p', { class: 'clase-facil__next' });
    var notes = h('div', { class: 'clase-facil__notes' });
    var clockEl = h('p', { class: 'clase-facil__clock' });
    var bPrev = h('button', { type: 'button', class: 'btn', text: cl('anterior') });
    var bNext = h('button', { type: 'button', class: 'btn btn--primary', text: cl('siguiente') });
    var bClock = h('button', { type: 'button', class: 'btn', text: mc('iniciar') });
    var el = h('div', { class: 'clase clase--facilitador', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
      h('div', { class: 'clase__bar' }, [h('h2', { class: 'clase__title', id: titleId, text: cl('ventana', { sesion: opt.label }) }), status]),
      h('div', { class: 'clase-facil' }, [
        current, next, clockEl,
        h('p', { class: 'clase-facil__buttons' }, [bPrev, bNext, bClock]),
        notes
      ])
    ]);
    var opener = root.opener;
    function send(msg) { if (opener && !opener.closed) { try { opener.postMessage(msg, '*'); } catch (err) { /* gone */ } } }
    function render() {
      var sl = slides[state.slide] || slides[0];
      current.textContent = cl('posicion', { n: state.slide + 1, total: slides.length }) + ' · ' + slideTitle(sl);
      next.textContent = state.slide + 1 < slides.length ? cl('sigue', { titulo: slideTitle(slides[state.slide + 1]) }) : cl('ultima');
      notes.innerHTML = '';
      notes.appendChild(slideNotes(sl));
      paint();
    }
    function paint() {
      var ms = state.elapsed + (state.running ? now() - state.at : 0);
      var total = opt.minutos || (EIA.data.sesiones[opt.sesion] ? EIA.data.sesiones[opt.sesion].agenda.slice(-1)[0].hasta : 0);
      clockEl.textContent = cl('tiempo', { transcurrido: EIA.util.formatClock(ms / 1000), total: total });
      bClock.textContent = state.running ? mc('pausar') : mc('iniciar');
    }
    function onMessage(e) {
      var d = e.data;
      if (!d || d.tipo !== 'eia-clase' || d.accion !== 'estado' || e.source !== opener) return;
      status.textContent = cl('conectado');
      state.slide = d.slide; state.elapsed = d.elapsed; state.running = d.running; state.at = now();
      render();
    }
    root.addEventListener('message', onMessage);
    var timer = root.setInterval(paint, 1000);
    bPrev.addEventListener('click', function () { send({ tipo: 'eia-clase', accion: 'ir', slide: Math.max(0, state.slide - 1) }); });
    bNext.addEventListener('click', function () { send({ tipo: 'eia-clase', accion: 'ir', slide: Math.min(slides.length - 1, state.slide + 1) }); });
    bClock.addEventListener('click', function () { send({ tipo: 'eia-clase', accion: 'reloj' }); });
    var shell = k.modal(el, {
      onKey: function (e) {
        if (k.editable(e.target)) return false;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { bNext.click(); e.preventDefault(); return true; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { bPrev.click(); e.preventDefault(); return true; }
        return false;
      }
    });
    cur = {
      arg: arg,
      baseTitle: null,
      close: function (restore) {
        var base = cur && cur.baseTitle;
        root.clearInterval(timer);
        root.removeEventListener('message', onMessage);
        shell.close(restore);
        if (base != null) doc.title = base;
        cur = null;
      }
    };
    setTitle(cl('ventana', { sesion: opt.label }));
    render();
    send({ tipo: 'eia-clase', accion: 'hola' });
  }

  // =============================================================================================

  function open(arg) {
    arg = arg == null || arg === '' ? null : String(arg);
    if (cur && cur.arg === arg) return;
    if (cur) cur.close(false);
    if (arg === null || !optionFor(arg)) { openChooser(); return; }
    if (isFacilitator()) openFacilitatorView(arg);
    else openSlides(arg);
  }

  ui.presenter = {
    open: open,
    close: function () { if (cur) cur.close(); },
    current: function () { return cur; },
    slides: buildSlides,
    title: slideTitle
  };
})(typeof window !== 'undefined' ? window : globalThis);
