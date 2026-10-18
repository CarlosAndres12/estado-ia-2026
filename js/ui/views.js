/* Estado de la IA 2026 — the page shell: boot, views and footer (prompt §9, §11; contracts §4).
 *
 *   EIA.ui.boot()   called by js/main.js: draws the page decorations (decor.js), mounts the header
 *                   (nav.js) and the footer, installs popovers (chips.js) and reveals (reveal.js), then
 *                   starts the router (js/core/router.js). EIA.ui.ready resolves after the first view.
 *
 * Views render lazily on first visit into <section class="view" data-route> inside #main and stay in
 * the DOM (hidden) afterwards, so their state survives navigation. Blocks have ids "<route>--<block>"
 * (#s3/actividad -> id "s3--actividad"); the router's block is scrolled into view and focused.
 *
 *   #inicio      hero (hero.js), "La pregunta del curso", "Ficha del curso", "Cómo usar este sitio", V01
 *   #mapa        road with 7 stations, hilo conductor, trabajo autónomo, versiones, ruta de lectura (D2)
 *   #evidencia   KB §3: five types (meaning zone), fuentes, coberturas, criterios, four warning stamps, V02
 *   #s1…#s7      one template, blocks: resultados, agenda, laminas, video, contenido (contenido-<n>),
 *                errores, actividad (<actividadId>), discusion, quiz, lecturas, facilitador
 *   #proyecto    KB §11: pesos, proyecto final (8 questions → notebook sheets), cuaderno, rúbrica, retro
 *   #cifras      banco.js · #glosario glossary.js · #asistente asistente.js
 *   #preguntas   KB §15 accordion (preguntas--p<n>) · #referencias KB §16 (referencias--<key>)
 *   #clase       Modo clase (presenter.js) or a chooser while it is not available
 *
 * Plug-in hooks for the interactive tools (T08). All are optional and looked up when a view renders:
 * the page calls a hook only when it exists and renders a small placeholder otherwise. `sesion` is
 * always the session NUMBER (1–7); read EIA.data.sesiones[sesion] for its data.
 *
 *   EIA.ui.tools[actividadId] || EIA.ui.tools[actividad.tipo]
 *       .mount(el, { sesion, id }) -> optional { destroy() }
 *       Once per id of sesiones[n].actividades, inside the "Actividad" block (el is
 *       div.tool-mount inside article#s<n>--<id>). The page has already rendered the KB block above el:
 *       kb.titulo, kb.duracion, kb.consigna (or actividad.consigna) and kb.pasos. The tool renders
 *       everything interactive, including kb.tabla as fields. Without a tool the page shows kb.tabla
 *       statically. Activities that name a contenido point and are not in the session's tool list
 *       (s7-escenarios) are mounted the same way right after that contenido point.
 *   EIA.ui.quiz.mount(el, sesion) -> optional { destroy() }        "Quiz" block (sesiones 1–6)
 *   EIA.ui.cuaderno.note({ sesion, texto })                         the "Anotar en el cuaderno" buttons
 *       of the "Discusión" block (texto = the question as plain text)
 *   EIA.ui.cuaderno.mount(el)                                       #proyecto "Cuaderno del equipo"; give
 *       each sheet the id "proyecto--hoja-<hojaId>" so the links #proyecto/hoja-<hojaId> land on it
 *   EIA.ui.rubrica.mount(el)                                        #proyecto "Rúbrica"
 *   EIA.ui.presenter.open(arg)        #clase (arg null: show the chooser) and #clase/<1–7|taller> (arg
 *       '1'…'7' or 'taller'). The view underneath stays as it was; on exit the presenter goes back with
 *       history.back() or EIA.router.go(previous.route, previous.block) (EIA.router.previous()).
 *   EIA.ui.openLamina(id, list)       lámina thumbnails (list = the lámina ids of that group);
 *       without it the thumbnail opens index.html?lamina=<id> in a new tab.
 *   Notes: activities can call EIA.ui.copy, EIA.ui.copyButton, EIA.ui.announce, EIA.ui.chipHTML,
 *   EIA.ui.estadoHTML, EIA.ui.ilustrativoHTML, EIA.ui.h, EIA.ui.t and EIA.markup; feedback signs are the
 *   CSS images var(--exito) and var(--casi) (decor.js).
 *
 * Shared helpers defined here: EIA.ui.h(tag, attrs, children), EIA.ui.t(path, vars) (copy from
 * EIA.data.course.ui, then EIA.data.course), EIA.ui.fmt, EIA.ui.reducedMotion(), EIA.ui.viewHead,
 * EIA.ui.block, EIA.ui.card, EIA.ui.placeholder, EIA.ui.prevNext, EIA.ui.videoEmbed,
 * EIA.ui.laminaThumbs, EIA.ui.stampsFor. Every visible string comes from js/data/. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  // =============================================================================================
  // Helpers

  ui.h = function (tag, attrs, kids) {
    var el = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'hidden') el.hidden = !!v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      });
    }
    append(el, kids);
    return el;
  };
  function append(el, kids) {
    if (kids == null) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (k) {
      if (k == null || k === false) return;
      if (Array.isArray(k)) { append(el, k); return; }
      el.appendChild(typeof k === 'string' || typeof k === 'number' ? doc.createTextNode(String(k)) : k);
    });
  }
  var h = ui.h;

  ui.fmt = function (str, vars) {
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? String(vars[k]) : '';
    });
  };

  function lookup(base, path) {
    var v = base;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) v = v == null ? v : v[parts[i]];
    return v;
  }
  // Raw copy value (string, array or object) from EIA.data.course.ui, then EIA.data.course.
  ui.tv = function (path) {
    var c = (EIA.data && EIA.data.course) || {};
    var v = lookup(c.ui || {}, path);
    if (v == null) v = lookup(c, path);
    return v;
  };
  ui.t = function (path, vars) {
    var v = ui.tv(path);
    return typeof v === 'string' ? ui.fmt(v, vars) : '';
  };
  var t = ui.t;

  ui.reducedMotion = function () {
    try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (err) { return false; }
  };

  function md(text, opts) { return EIA.markup.render(text, opts); }
  function mi(text, opts) { return EIA.markup.inline(text, opts); }
  function plain(text) { return EIA.markup.plain(text); }
  function course() { return EIA.data.course || {}; }

  function warn(msg, err) { if (root.console) root.console.warn('[views] ' + msg + (err && err.message ? ': ' + err.message : '')); }

  // Deterministic decoration cycle (peek colors and corners) so every visit looks the same.
  var PEEKS = ['rojo', 'amarillo', 'azul', 'verde'];
  var CORNERS = ['tr', 'bl', 'tl', 'br'];
  var peekCount = 0;

  /* card(opts, kids): a paper card with a thick brush outline; opts.peek true (cycle), a color or
   * false; opts.tag ('div'), opts.class, opts.thin (thin frame), opts.id. */
  ui.card = function (o, kids) {
    o = o || {};
    var cls = 'card reveal' + (o.thin ? ' card--thin' : '') + (o.class ? ' ' + o.class : '');
    if (o.peek) {
      var color = o.peek === true ? PEEKS[peekCount % PEEKS.length] : o.peek;
      cls += ' card--peek card--peek-' + color + ' card--peek-' + CORNERS[peekCount % CORNERS.length];
      peekCount++;
    }
    return h(o.tag || 'div', { class: cls, id: o.id || null }, kids);
  };
  var card = ui.card;

  ui.placeholder = function (text, extra) {
    return h('div', { class: 'placeholder' }, [h('span', { class: 'placeholder__sign', 'aria-hidden': 'true' }), h('p', { text: text }), extra || null]);
  };

  /* viewHead(el, { kicker, title, lead (HTML), sign (session n), signs ([decor sign names, decor.js]),
   *   monoSigns (black signs, for meaning zones), meta (element) }) */
  ui.viewHead = function (el, o) {
    var route = el.getAttribute('data-route');
    var head = h('header', { class: 'view-head' });
    (o.signs || []).forEach(function (name, i) {
      head.appendChild(h('span', {
        class: 'float-sign float-sign--' + i + ' reveal', 'aria-hidden': 'true',
        style: 'background-image: var(--sign-' + name + (o.monoSigns ? '-mono' : '') + ', none)'
      }));
    });
    if (o.sign) head.appendChild(h('span', { class: 'view-head__sesion sesion-sign sesion-sign--' + o.sign, 'aria-hidden': 'true' }));
    if (o.kicker) head.appendChild(h('p', { class: 'kicker', text: o.kicker }));
    head.appendChild(h('h1', { class: 'view-title reveal', id: route + '--titulo', tabindex: '-1', text: o.title }));
    if (o.meta) head.appendChild(o.meta);
    if (o.lead) head.appendChild(h('div', { class: 'lead', html: o.lead }));
    el.appendChild(head);
    return head;
  };

  /* block(el, id, title, opts) -> body element; opts.level (2), opts.class */
  ui.block = function (el, id, title, o) {
    o = o || {};
    var route = el.getAttribute('data-route');
    var hid = route + '--' + id + '-titulo';
    var sec = h('section', { class: 'block' + (o.class ? ' ' + o.class : ''), id: route + '--' + id, 'aria-labelledby': hid });
    sec.appendChild(h('h' + (o.level || 2), { class: 'block-title reveal', id: hid, tabindex: '-1', text: title }));
    var body = h('div', { class: 'block__body' });
    sec.appendChild(body);
    (o.parent || el).appendChild(sec);
    return body;
  };
  var block = ui.block;

  function viewTitle(route) {
    var n = EIA.router.sessionNumber(route);
    if (n) {
      var s = EIA.data.sesiones[n];
      return t('page.nav.sesion', { n: n, titulo: s ? s.titulo : '' });
    }
    var key = { inicio: 'nav.inicio', mapa: 'mapa.titulo', evidencia: 'evidencia.titulo', proyecto: 'proyecto.titulo',
      cifras: 'banco.titulo', glosario: 'glosario.titulo', preguntas: 'preguntas.titulo', referencias: 'referencias.titulo',
      asistente: 'asistente.titulo', clase: 'modoClase.titulo' }[route];
    return key ? t(key) : '';
  }
  ui.viewTitle = viewTitle;

  ui.prevNext = function (el) {
    var route = el.getAttribute('data-route');
    var nb = EIA.router.neighbors(route);
    if (!nb.prev && !nb.next) return null;
    var nav = h('nav', { class: 'prevnext', 'aria-label': t('page.nav.vecinos') });
    if (nb.prev) nav.appendChild(h('a', { class: 'prevnext__link prevnext__link--prev', href: '#' + nb.prev, rel: 'prev' }, [
      h('span', { class: 'prevnext__dir', text: t('nav.anterior') }), h('span', { class: 'prevnext__title', text: viewTitle(nb.prev) })
    ]));
    if (nb.next) nav.appendChild(h('a', { class: 'prevnext__link prevnext__link--next', href: '#' + nb.next, rel: 'next' }, [
      h('span', { class: 'prevnext__dir', text: t('nav.siguiente') }), h('span', { class: 'prevnext__title', text: viewTitle(nb.next) })
    ]));
    el.appendChild(nav);
    return nav;
  };

  // The four course warnings, wherever the KB invokes one (prompt §4.2): a small "Advertencia N" stamp.
  function advertencias() { return (course().leyenda && course().leyenda.advertencias) || []; }
  ui.stampsFor = function (text) {
    var f = EIA.util.fold(plain(text));
    return advertencias().filter(function (a) {
      return f.indexOf(EIA.util.fold(a.texto).replace(/[.\s]+$/, '')) >= 0;
    }).map(function (a) { return a.n; });
  };
  function stampEl(n) {
    var a = advertencias().filter(function (x) { return x.n === n; })[0];
    if (!a) return null;
    return h('span', { class: 'adv-stamp adv-stamp--' + n }, [
      h('span', { class: 'adv-stamp__sign', 'aria-hidden': 'true' }),
      h('span', { class: 'adv-stamp__label', text: t('leyenda.advertencia', { n: n }) }),
      h('span', { class: 'visually-hidden', text: ': ' + a.texto })
    ]);
  }
  function stampsAfter(container, text) {
    var list = ui.stampsFor(text);
    if (!list.length) return;
    container.appendChild(h('p', { class: 'adv-stamps' }, list.map(stampEl)));
  }

  // =============================================================================================
  // Hooks (see the header): looked up at call time, never required.

  function hook(name) { return ui[name] && typeof ui[name] === 'object' ? ui[name] : null; }

  function mountTool(el, sesion, id) {
    var a = (EIA.data.actividades || {})[id];
    var tools = ui.tools || {};
    var tool = tools[id] || (a ? tools[a.tipo] : null);
    if (tool && typeof tool.mount === 'function') {
      try { tool.mount(el, { sesion: sesion, id: id }); return true; } catch (err) { warn('tool ' + id + ' failed', err); el.innerHTML = ''; }
    }
    return false;
  }

  // =============================================================================================
  // Videos and láminas

  function videoById(id) {
    var list = EIA.data.videos || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var lazyIO = null;
  var lazyQueue = [];
  function lazy(el, fn, margin) {
    if (typeof root.IntersectionObserver !== 'function') { fn(); return; }
    if (!lazyIO) {
      lazyIO = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          lazyIO.unobserve(en.target);
          var job = en.target.__lazy;
          en.target.__lazy = null;
          if (job) lazyQueue.push(job);
        });
        pump();
      }, { rootMargin: (margin || 600) + 'px 0px' });
    }
    el.__lazy = fn;
    lazyIO.observe(el);
  }
  // Printing needs the lámina thumbnails that have not scrolled into view yet.
  function flushThumbs(rootEl) {
    if (!rootEl) return;
    Array.prototype.forEach.call(rootEl.querySelectorAll('.lamina-thumb__canvas'), function (c) {
      var job = c.__lazy;
      if (!job) return;
      c.__lazy = null;
      if (lazyIO) lazyIO.unobserve(c);
      try { job(); } catch (err) { warn('thumbnail', err); }
    });
  }
  var pumping = false;
  function pump() {
    if (pumping) return;
    pumping = true;
    (function step() {
      var job = lazyQueue.shift();
      if (!job) { pumping = false; return; }
      try { job(); } catch (err) { warn('lazy job failed', err); }
      root.requestAnimationFrame(step);
    })();
  }

  ui.videoEmbed = function (id, route) {
    var v = videoById(id);
    if (!v) return null;
    var info = null;
    try { info = EIA.engine.player && EIA.engine.player.info ? EIA.engine.player.info(id) : null; } catch (err) { info = null; }
    var dur = info && info.duration ? EIA.util.formatClock(info.duration) : '';
    var holder = h('div', { class: 'video__holder' });
    var fig = h('figure', { class: 'video', id: (route ? route + '--' : '') + 'video-' + id }, [
      h('figcaption', { class: 'video__caption' }, [
        h('h3', { class: 'video__title', text: v.title }),
        dur ? h('p', { class: 'video__duration', text: t('videos.duracion', { duracion: dur }) }) : null
      ]),
      holder
    ]);
    lazy(holder, function () {
      if (!EIA.engine.player || !EIA.engine.player.create) return;
      try { fig.__player = EIA.engine.player.create(holder, id, {}); } catch (err) { warn('player ' + id, err); }
    }, 900);
    return fig;
  };

  function deckEntry(id) {
    var d = EIA.data.deck || [];
    for (var i = 0; i < d.length; i++) if (d[i].id === id) return d[i];
    return null;
  }

  function drawLamina(canvas, id) {
    var lam = EIA.engine.lamina;
    if (!lam || !lam.render) return;
    var w = Math.max(160, canvas.clientWidth || 320);
    var k = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(w * k * 9 / 16);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / 1280, 0, 0, canvas.width / 1280, 0, 0);
    lam.render(ctx, id, { still: true, t: 0 });
  }

  ui.laminaThumbs = function (ids, o) {
    o = o || {};
    var list = h('ul', { class: 'laminas' + (o.class ? ' ' + o.class : '') });
    ids.forEach(function (id) {
      var d = deckEntry(id);
      if (!d) return;
      var canvas = h('canvas', { class: 'lamina-thumb__canvas', 'aria-hidden': 'true', width: 320, height: 180 });
      var a = h('a', {
        class: 'lamina-thumb', href: 'index.html?lamina=' + id, target: '_blank', rel: 'noopener',
        'aria-label': t('page.sesion.abrirLamina', { n: d.n, titulo: d.titulo })
      }, [canvas, h('span', { class: 'lamina-thumb__label', text: t('page.sesion.lamina', { n: d.n, titulo: d.titulo }) })]);
      a.addEventListener('click', function (e) {
        if (typeof ui.openLamina === 'function') { e.preventDefault(); ui.openLamina(id, ids.slice()); }
      });
      list.appendChild(h('li', { class: 'laminas__item' }, [a]));
      lazy(canvas, function () {
        ui.decor.fontsReady().then(function () {
          try { drawLamina(canvas, id); } catch (err) { warn('lamina thumbnail ' + id, err); }
        });
      }, 300);
    });
    return list;
  };

  // =============================================================================================
  // Agenda: a hand-drawn 120-minute ruler with proportional, numbered blocks in pattern fills.

  var AGENDA_PATTERNS = ['puntos', 'rayas', 'estrellas', 'cuadros', 'ondas', 'espirales'];

  function agendaRuler(s) {
    var canvas = h('canvas', { class: 'ruler__canvas', 'aria-hidden': 'true' });
    var fig = h('figure', { class: 'ruler' }, [canvas, h('figcaption', { class: 'visually-hidden', text: t('page.sesion.regla', { n: s.agenda.length }) })]);
    function draw() {
      var e = EIA.engine;
      if (!e || !e.ink || !e.figures) return;
      var w = Math.max(240, fig.clientWidth || 0), hh = 112;
      var k = Math.min(2, root.devicePixelRatio || 1);
      canvas.width = Math.round(w * k);
      canvas.height = Math.round(hh * k);
      canvas.style.height = hh + 'px';
      var ctx = canvas.getContext('2d');
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, w, hh);
      var m = e.palette.mundo, pad = 16, span = w - pad * 2;
      var fills = [m.lienzoOcre, e.palette.mix(m.celeste, m.lienzo, 0.45), e.palette.mix(m.amarillo, m.lienzo, 0.55), e.palette.mix(m.verde, m.lienzo, 0.7)];
      function x(min) { return pad + span * min / 120; }
      var top = 10, bh = 50;
      s.agenda.forEach(function (b, i) {
        var x0 = x(b.desde), x1 = x(b.hasta), bw = x1 - x0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, top, bw, bh);
        ctx.clip();
        ctx.fillStyle = fills[i % fills.length];
        ctx.fillRect(x0, top, bw, bh);
        e.figures.pattern(ctx, AGENDA_PATTERNS[i % AGENDA_PATTERNS.length], x0, top, bw, bh, { color: e.palette.mix(m.tinta, m.lienzo, 0.45), spacing: 15, seed: 'agenda-' + s.n + '-' + i });
        ctx.restore();
        e.ink.line(ctx, [x0, top, x0, top + bh], { w: 2.6, profile: 'even', seed: 'agenda-sep-' + s.n + '-' + i });
        var nr = Math.min(13, (bw - 5) / 2);
        if (nr >= 7) {
          var cx = x0 + bw / 2, cy = top + bh / 2;
          e.ink.circle(ctx, cx, cy, nr, { fill: ui.decor.PAPEL, line: true, w: nr > 10 ? 2.2 : 1.6, seed: 'agenda-n-' + i, irr: 0.05 });
          ctx.fillStyle = m.tinta;
          ctx.font = '700 ' + Math.round(nr * 1.15) + 'px "EIA Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), cx, cy + 1);
        }
      });
      e.ink.line(ctx, [x(120), top, x(120), top + bh], { w: 2.6, profile: 'even', seed: 'agenda-sep-end-' + s.n });
      e.ink.line(ctx, [pad - 4, top, x(120) + 2, top + 1], { w: 2.4, profile: 'even', seed: 'agenda-top-' + s.n });
      // The ruler: one hand-drawn baseline, ticks every 5 min, labels every 30 min.
      var by = top + bh + 8;
      e.ink.line(ctx, [pad - 6, by, w / 2, by + 1, w - pad + 6, by], { w: 3, profile: 'even', seed: 'ruler-' + s.n });
      ctx.strokeStyle = m.tinta;
      ctx.lineCap = 'round';
      for (var mnt = 0; mnt <= 120; mnt += 5) {
        var len = mnt % 30 === 0 ? 14 : mnt % 15 === 0 ? 10 : 6;
        ctx.lineWidth = mnt % 30 === 0 ? 2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(x(mnt), by);
        ctx.lineTo(x(mnt) + 0.4, by + len);
        ctx.stroke();
      }
      ctx.fillStyle = m.tinta;
      ctx.font = '400 14px "EIA Sans", system-ui, sans-serif';
      ctx.textBaseline = 'alphabetic';
      for (var lm = 0; lm <= 120; lm += 30) {
        ctx.textAlign = lm === 0 ? 'left' : lm === 120 ? 'right' : 'center';
        ctx.fillText(lm === 120 ? lm + ' ' + t('page.sesion.minutos') : String(lm), x(lm) + (lm === 0 ? -2 : lm === 120 ? 2 : 0), by + 32);
      }
    }
    var lastW = 0;
    function redraw() {
      var w = fig.clientWidth || 0;
      if (!w || Math.abs(w - lastW) < 2) return;
      lastW = w;
      draw();
    }
    ui.decor.fontsReady().then(function () {
      if (typeof root.ResizeObserver === 'function') new root.ResizeObserver(redraw).observe(fig);
      else root.addEventListener('resize', redraw);
      redraw();
    });
    return fig;
  }

  function agendaTable(s) {
    var cols = ui.tv('page.sesion.agendaColumnas') || [];
    var n = s.n;
    // The KB "Recurso" cell keeps its own text; recognized values only become links to what they name
    // (a lámina, the session's activities, KB §3 = #evidencia, the final project).
    function recurso(text) {
      var m = /^Diapositiva (\d{1,2})$/.exec(text);
      if (m) {
        var id = 'd' + (m[1].length < 2 ? '0' : '') + m[1];
        var d = deckEntry(id);
        if (d) {
          var a = h('a', { href: 'index.html?lamina=' + id, target: '_blank', rel: 'noopener', text: text, 'aria-label': t('page.sesion.abrirLamina', { n: d.n, titulo: d.titulo }) });
          a.addEventListener('click', function (e) { if (typeof ui.openLamina === 'function') { e.preventDefault(); ui.openLamina(id, (s.laminas || []).slice()); } });
          return a;
        }
      }
      if (/^Actividad/.test(text)) return h('a', { href: '#s' + n + '/actividad', text: text });
      if (text === 'Sección 3') return h('a', { href: '#evidencia', text: text });
      if (text === 'Proyecto final') return h('a', { href: '#proyecto', text: text });
      return text;
    }
    var table = h('table', { class: 'agenda-table' }, [
      h('thead', {}, [h('tr', {}, [h('th', { scope: 'col', class: 'agenda-table__n' }, [h('span', { class: 'visually-hidden', text: t('page.sesion.numero') })])].concat(cols.map(function (c) { return h('th', { scope: 'col', text: c }); })))]),
      h('tbody', {}, s.agenda.map(function (b, i) {
        return h('tr', {}, [
          h('td', { class: 'agenda-table__n' }, [h('span', { class: 'agenda-n', text: String(i + 1) })]),
          h('td', { class: 'num', text: b.minutos }),
          h('td', { html: mi(b.bloque) }),
          h('td', {}, [recurso(b.recurso)])
        ]);
      }))
    ]);
    return h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': (s.agendaTitulo || t('sesion.agenda')) }, [table]);
  }

  // =============================================================================================
  // #inicio

  function renderInicio(el) {
    var c = course();
    var hero = h('section', { class: 'hero', 'aria-label': t('page.hero.region') });
    var text = h('div', { class: 'hero__card card' }, [
      h('p', { class: 'kicker', text: c.hero.kicker }),
      h('h1', { class: 'hero__title', id: 'inicio--titulo', tabindex: '-1', text: c.hero.titulo }),
      h('p', { class: 'hero__subtitle', text: c.hero.subtitulo }),
      h('p', { class: 'hero__lead', text: c.hero.lead }),
      h('p', { class: 'hero__line', text: c.hero.linea }),
      h('p', { class: 'hero__buttons' }, (c.hero.botones || []).map(function (b, i) {
        return h('a', { class: 'btn' + (i === 0 ? ' btn--primary' : ''), href: b.href || (b.accion === 'modo-clase' ? '#clase' : '#inicio'), text: b.label });
      }))
    ]);
    hero.appendChild(text);
    el.appendChild(hero);
    if (ui.hero && ui.hero.mount) {
      try { el.__hero = ui.hero.mount(hero); } catch (err) { warn('hero', err); }
      if (el.__hero && el.__hero.el) hero.insertBefore(el.__hero.el, text);
    }

    var q = h('section', { class: 'block block--pregunta', id: 'inicio--pregunta', 'aria-labelledby': 'inicio--pregunta-titulo' }, [
      h('h2', { class: 'block-title reveal', id: 'inicio--pregunta-titulo', tabindex: '-1', text: t('inicio.pregunta') })
    ]);
    var qbox = h('div', { class: 'question' });
    var qtext = h('p', { class: 'question__text', text: c.pregunta });
    qbox.appendChild(qtext);
    q.appendChild(qbox);
    el.appendChild(q);
    var letter = ui.decor.letterOn(qbox, c.pregunta, { size: 54, minSize: 30, maxLines: 4, seed: 'pregunta-del-curso', duration: 3.2 });
    if (letter && letter.canvas) qtext.classList.add('visually-hidden');

    var f = c.ficha;
    var fichaBody = block(el, 'ficha', t('inicio.ficha'));
    var grid = h('div', { class: 'grid grid--ficha' });
    function fcard(item, extra) {
      return card({ peek: true, class: 'ficha' }, [h('h3', { class: 'card__title', text: item.label }), item.texto ? h('p', { html: mi(item.texto) }) : null, extra || null]);
    }
    grid.appendChild(fcard(f.descripcion));
    grid.appendChild(fcard(f.publico));
    grid.appendChild(fcard(f.modalidad, h('ul', {}, f.modalidad.versiones.map(function (v) { return h('li', { html: mi(v) }); }))));
    grid.appendChild(fcard(f.objetivo));
    grid.appendChild(card({ peek: true, class: 'ficha ficha--wide' }, [
      h('h3', { class: 'card__title', text: f.resultados.label }),
      h('p', { text: f.resultados.intro }),
      h('ol', { class: 'numbered' }, f.resultados.items.map(function (r) { return h('li', { html: mi(r) }); }))
    ]));
    grid.appendChild(card({ peek: true, class: 'ficha' }, [
      h('h3', { class: 'card__title', text: f.metodologia.label }),
      h('p', { text: f.metodologia.intro }),
      h('ul', {}, f.metodologia.bloques.map(function (b) { return h('li', { html: mi(b) }); })),
      h('p', { html: mi(f.metodologia.cierre) })
    ]));
    grid.appendChild(fcard(f.fuentes));
    fichaBody.appendChild(grid);

    var usar = block(el, 'como-usar', t('inicio.comoUsar'));
    usar.appendChild(h('div', { class: 'grid grid--two' }, c.comoUsar.tarjetas.map(function (tc) {
      return card({ peek: true, class: 'como-usar como-usar--' + tc.id }, [h('h3', { class: 'card__title', text: tc.titulo }), h('p', { html: mi(tc.texto) })]);
    })));

    var vb = block(el, 'video', t('page.inicio.video'));
    var ve = ui.videoEmbed('v01', 'inicio');
    if (ve) vb.appendChild(ve);
    ui.prevNext(el);
  }

  // =============================================================================================
  // #mapa

  function drawRoad(wrap, canvas) {
    var e = EIA.engine;
    if (!e || !e.ink) return;
    var signs = wrap.querySelectorAll('.station__sign');
    if (!signs.length) return;
    var box = wrap.getBoundingClientRect();
    var w = Math.max(1, Math.round(box.width)), hh = Math.max(1, Math.round(box.height));
    var k = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(hh * k);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    // One calligraphic road through the station signs, meandering a little between them.
    var pts = [];
    Array.prototype.forEach.call(signs, function (s, i) {
      var r = s.getBoundingClientRect();
      var cx = r.left - box.left + r.width / 2, cy = r.top - box.top + r.height / 2;
      if (i > 0) pts.push(cx + (i % 2 ? 30 : -30), (pts[pts.length - 1] + cy) / 2);
      pts.push(cx, cy);
    });
    e.ink.line(ctx, pts, { w: 7, profile: 'swell', seed: 'road-' + w + 'x' + hh, dot: true });
  }

  function renderMapa(el) {
    var c = course(), mp = c.mapa;
    ui.viewHead(el, { title: t('mapa.titulo'), signs: ['estrella', 'pajaro', 'constelacion'] });
    var wrap = h('div', { class: 'road' });
    var canvas = h('canvas', { class: 'road__line', 'aria-hidden': 'true' });
    var list = h('ol', { class: 'road__stations', 'aria-label': t('page.mapa.camino') });
    mp.filas.forEach(function (f) {
      var n = f.sesion;
      list.appendChild(h('li', { class: 'station', id: 'mapa--s' + n }, [
        h('span', { class: 'station__sign sesion-sign sesion-sign--' + n, 'aria-hidden': 'true' }),
        card({ peek: n % 2 ? true : false, class: 'station__card' }, [
          h('p', { class: 'kicker', text: t('sesion.sesion', { n: n }) }),
          h('h2', { class: 'station__title' }, [h('a', { href: '#s' + n, text: f.tema })]),
          h('dl', { class: 'meta' }, [
            h('dt', { text: t('mapa.diapositivas') }), h('dd', { text: f.diapositivas }),
            h('dt', { text: t('mapa.pregunta') }), h('dd', { text: f.pregunta }),
            h('dt', { text: t('mapa.producto') }), h('dd', { class: 'station__product' }, [h('span', { class: 'stamp-sign', 'aria-hidden': 'true' }), f.producto])
          ]),
          h('p', { class: 'station__go' }, [h('a', { class: 'btn btn--small', href: '#s' + n, text: t('page.mapa.irSesion', { n: n }) })])
        ])
      ]));
    });
    wrap.appendChild(canvas);
    wrap.appendChild(list);
    el.appendChild(h('div', { class: 'view-body' }, [wrap]));
    var lastKey = '';
    function road() {
      var key = wrap.offsetWidth + 'x' + wrap.offsetHeight;
      if (!wrap.offsetWidth || key === lastKey) return;
      lastKey = key;
      try { drawRoad(wrap, canvas); } catch (err) { warn('road', err); }
    }
    if (typeof root.ResizeObserver === 'function') new root.ResizeObserver(road).observe(wrap);
    ui.decor.fontsReady().then(road);

    var hilo = block(el, 'hilo', t('mapa.hilo'));
    hilo.appendChild(h('p', { html: mi(mp.hilo.texto) }));
    hilo.appendChild(card({ peek: 'amarillo', class: 'case-card' }, [
      h('h3', { class: 'card__title', text: t('page.mapa.caso') }),
      h('p', { text: t('page.mapa.casoTexto') }),
      h('ol', { class: 'case-card__stamps' }, mp.filas.map(function (f) {
        return h('li', {}, [h('span', { class: 'case-card__stamp sesion-sign sesion-sign--' + f.sesion, 'aria-hidden': 'true' }),
          h('span', { class: 'case-card__n', text: t('sesion.sesion', { n: f.sesion }) }), h('span', { text: f.producto })]);
      }))
    ]));

    var ta = block(el, 'trabajo-autonomo', t('mapa.trabajoAutonomo'));
    ta.appendChild(h('p', { html: mi(mp.trabajoAutonomo.texto) }));

    var vs = block(el, 'versiones', t('mapa.versiones'));
    vs.appendChild(h('ul', { class: 'versions' }, mp.versiones.map(function (v) { return h('li', { class: 'card card--thin reveal', html: mi(v) }); })));
    vs.appendChild(semesterHelper());

    var ruta = block(el, 'ruta', t('mapa.ruta'));
    var d2 = deckEntry(mp.ruta && mp.ruta.lamina || 'd02');
    if (d2) ruta.appendChild(ui.laminaThumbs([d2.id], { class: 'laminas--one' }));
    ui.prevNext(el);
  }

  // MAY (prompt §9.3): seven dates every 14 days from a chosen start date.
  function semesterHelper() {
    var id = 'mapa-fecha-inicio';
    var input = h('input', { type: 'date', id: id, class: 'date-input' });
    var out = h('ol', { class: 'dates', 'aria-live': 'polite' });
    var fmtDate = null;
    try { fmtDate = new root.Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (err) { fmtDate = null; }
    input.addEventListener('change', function () {
      out.innerHTML = '';
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.value);
      if (!m || !fmtDate) return;
      var base = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      for (var i = 0; i < 7; i++) {
        out.appendChild(h('li', { text: t('page.mapa.fechas.sesion', { n: i + 1, fecha: fmtDate.format(new Date(base + i * 14 * 86400000)) }) }));
      }
    });
    return card({ class: 'dates-card', thin: true }, [
      h('h3', { class: 'card__title', text: t('page.mapa.fechas.titulo') }),
      h('p', { class: 'help', text: t('page.mapa.fechas.ayuda') }),
      h('label', { for: id, class: 'field-label', text: t('page.mapa.fechas.inicio') }),
      input, out
    ]);
  }

  // =============================================================================================
  // #evidencia (KB §3)

  function warningStamps() {
    var wrap = h('ul', { class: 'stamps' });
    advertencias().forEach(function (a) {
      var canvas = h('canvas', { class: 'stamps__canvas', role: 'img', 'aria-label': t('page.evidencia.sello', { n: a.n, texto: a.texto }) });
      wrap.appendChild(h('li', { class: 'stamps__item reveal' }, [canvas, h('p', { class: 'stamps__label', 'aria-hidden': 'true', text: t('leyenda.advertencia', { n: a.n }) })]));
      ui.decor.fontsReady().then(function () {
        var e = EIA.engine;
        if (!e || !e.tags) return;
        var size = 200, k = Math.min(2, root.devicePixelRatio || 1);
        canvas.width = size * k;
        canvas.height = size * k;
        var ctx = canvas.getContext('2d');
        ctx.setTransform(k, 0, 0, k, 0, 0);
        try { e.tags.warningStamp(ctx, a.n, size / 2, size / 2, size * 0.94, 1, {}); } catch (err) { warn('stamp ' + a.n, err); }
      });
    });
    return wrap;
  }

  function renderEvidencia(el) {
    var mc = course().marco;
    ui.viewHead(el, { title: t('evidencia.titulo'), signs: ['espiral', 'puntos'] });
    var tipos = block(el, 'tipos', mc.tipos.titulo, { class: 'zone-meaning' });
    tipos.appendChild(h('div', { class: 'grid grid--tipos' }, mc.tipos.items.map(function (it) {
      return card({ peek: 'tinta', class: 'tipo tipo--' + it.clase, id: 'evidencia--' + it.clase }, [
        h('p', { class: 'tipo__chip', html: ui.chipHTML(it.clase, it.tipo) }),
        h('dl', { class: 'tipo__dl' }, [
          h('dt', { text: t('evidencia.queEs') }), h('dd', { html: mi(it.queEs) }),
          h('dt', { text: t('evidencia.ejemplo') }), h('dd', { html: mi(it.ejemplo) })
        ])
      ]);
    })));

    var fu = block(el, 'fuentes', mc.fuentes.titulo);
    var table = h('table', {}, [
      h('thead', {}, [h('tr', {}, mc.fuentes.columnas.map(function (c) { return h('th', { scope: 'col', text: c }); }))]),
      h('tbody', {}, mc.fuentes.filas.map(function (f) {
        return h('tr', {}, [h('th', { scope: 'row', html: mi(f.fuente) }), h('td', { html: mi(f.aporta) }), h('td', { html: mi(f.limite) })]);
      }))
    ]);
    fu.appendChild(card({ class: 'card--table' }, [h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': mc.fuentes.titulo }, [table])]));
    var cob = h('div', { class: 'coberturas' }, [
      h('h3', { class: 'subtitle', text: mc.coberturas.titulo }),
      h('ul', {}, mc.coberturas.items.map(function (i) { return h('li', { html: mi(i) }); })),
      h('p', { html: mi(mc.coberturas.cierre) })
    ]);
    fu.appendChild(cob);

    var cr = block(el, 'criterios', mc.criterios.titulo);
    cr.appendChild(h('dl', { class: 'criteria' }, mc.criterios.items.map(function (c) {
      return h('div', { class: 'criteria__item card card--thin reveal' }, [h('dt', { text: c.label }), h('dd', { html: mi(c.texto) })]);
    })));

    var adv = block(el, 'advertencias', mc.advertencias.titulo);
    adv.appendChild(warningStamps());

    var vb = block(el, 'video', t('page.evidencia.video'));
    var ve = ui.videoEmbed('v02', 'evidencia');
    if (ve) vb.appendChild(ve);
    vb.appendChild(h('p', { class: 'cta' }, [h('a', { class: 'btn btn--primary', href: '#s1/actividad', text: t('evidencia.practica') })]));
    ui.prevNext(el);
  }

  // =============================================================================================
  // Sessions #s1…#s7 (prompt §9.5, §11)

  var SESSION_BLOCKS = ['resultados', 'agenda', 'laminas', 'video', 'contenido', 'errores', 'actividad', 'discusion', 'quiz', 'lecturas', 'facilitador'];

  function blockLabel(s, id) {
    if (id === 'discusion') return s.discusionTitulo || t('sesion.discusion');
    if (id === 'agenda') return s.agendaTitulo || t('sesion.agenda');
    return t('sesion.' + id);
  }

  function presentBlocks(s) {
    return SESSION_BLOCKS.filter(function (id) {
      if (id === 'errores') return !!(s.errores && s.errores.length);
      if (id === 'quiz') return !!(s.quiz && s.quiz.length);
      if (id === 'laminas') return !!(s.laminas && s.laminas.length);
      if (id === 'video') return !!(s.videos && s.videos.length);
      if (id === 'actividad') return !!(s.actividades && s.actividades.length);
      return true;
    });
  }

  function sessionHead(el, s) {
    var meta = h('dl', { class: 'meta meta--session' }, [
      h('div', {}, [h('dt', { text: t('sesion.pregunta') }), h('dd', { html: mi(s.pregunta) })]),
      h('div', {}, [h('dt', { text: t('sesion.diapositivas') }), h('dd', { text: s.diapositivas })]),
      h('div', {}, [h('dt', { text: t('sesion.producto') }), h('dd', { html: mi(s.producto) })])
    ]);
    ui.viewHead(el, { kicker: t('sesion.sesion', { n: s.n }), title: s.titulo, sign: s.n, meta: meta, lead: md(s.tesis), signs: ['estrella', 'luna'] });
    var nav = h('nav', { class: 'block-index', 'aria-label': t('page.sesion.bloques') }, [
      h('ul', {}, presentBlocks(s).map(function (id) {
        return h('li', {}, [h('a', { href: '#s' + s.n + '/' + id, text: blockLabel(s, id) })]);
      }))
    ]);
    el.appendChild(nav);
  }

  function contenidoPoint(s, c, level) {
    var route = 's' + s.n;
    var updates = (s.actualizaciones || []).filter(function (u) { return u.contenido === c.n; });
    var art = h('article', { class: 'point reveal', id: route + '--contenido-' + c.n });
    var title = h('h' + level, { class: 'point__title', tabindex: '-1' }, [
      h('span', { class: 'point__n', text: c.n + '.' }), ' ',
      h('span', { html: mi(c.titulo) }),
      c.complemento ? h('span', { class: 'point__comp', html: ' ' + mi(c.complemento) }) : null
    ]);
    art.appendChild(title);
    stampsAfter(art, c.titulo);
    var hasBox = updates.some(function (u) { return u.caja; });
    art.appendChild(h('div', { class: 'point__body prose' + (hasBox ? ' has-update-box' : ''), html: md(c.cuerpo, { updates: updates }) }));
    return art;
  }

  // Activities that name a contenido point but are not in the session's tool list (s7-escenarios).
  function extraTools(s) {
    var all = EIA.data.actividades || {}, out = {};
    Object.keys(all).forEach(function (id) {
      var a = all[id];
      if (a.sesion !== s.n || (s.actividades || []).indexOf(id) >= 0) return;
      var ns = Array.isArray(a.contenido) ? a.contenido : (a.contenido ? [a.contenido] : []);
      if (ns.length) (out[ns[ns.length - 1]] = out[ns[ns.length - 1]] || []).push(id);
    });
    return out;
  }

  function closingPhrase(s) {
    if (s.n !== 7) return null;
    var d17 = deckEntry('d17');
    var frase = d17 && d17.rotulos && d17.rotulos.fraseFinal ? d17.rotulos.fraseFinal.text : '';
    if (!frase) return null;
    var box = h('div', { class: 'closing', 'aria-hidden': 'true' });
    ui.decor.letterOn(box, frase, { size: 46, minSize: 26, maxLines: 3, seed: 'frase-final', align: 'center', duration: 3.4 });
    return box;
  }

  function contenidoBlock(el, s) {
    var body = block(el, 'contenido', t('sesion.contenido'));
    var extra = extraTools(s);
    function point(c, level) {
      body.appendChild(contenidoPoint(s, c, level));
      (extra[c.n] || []).forEach(function (id) {
        var mount = h('div', { class: 'tool-mount tool-mount--inline', id: 's' + s.n + '--' + id, 'data-tool': id });
        body.appendChild(mount);
        mountTool(mount, s.n, id);
      });
      if (s.n === 7 && c.n === 9) {
        var cl = closingPhrase(s);
        if (cl) body.appendChild(cl);
      }
    }
    if (s.bloques && s.bloques.length) {
      s.bloques.forEach(function (b) {
        body.appendChild(h('h3', { class: 'subblock reveal', text: b }));
        s.contenido.filter(function (c) { return c.bloque === b; }).forEach(function (c) { point(c, 4); });
      });
    } else {
      s.contenido.forEach(function (c) { point(c, 3); });
    }
  }

  function kbTable(tabla, label) {
    if (!tabla || !tabla.header) return null;
    return h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': label || '' }, [h('table', { class: 'worksheet-table' }, [
      h('thead', {}, [h('tr', {}, tabla.header.map(function (c) { return h('th', { scope: 'col', html: mi(c) }); }))]),
      h('tbody', {}, (tabla.rows || []).map(function (r) {
        return h('tr', {}, r.map(function (c, i) { return i === 0 && c ? h('th', { scope: 'row', html: mi(c) }) : h('td', { html: mi(c) }); }));
      }))
    ])]);
  }

  function activityBlock(el, s) {
    var body = block(el, 'actividad', t('sesion.actividad'));
    (s.actividades || []).forEach(function (id) {
      var a = (EIA.data.actividades || {})[id];
      if (!a) return;
      var kb = a.kb || null;
      var heading = kb && kb.titulo ? kb.titulo : a.titulo;
      var art = card({ tag: 'article', class: 'activity', id: 's' + s.n + '--' + id }, [
        kb && kb.titulo && a.titulo && heading.indexOf(a.titulo) < 0 ? h('p', { class: 'kicker', text: a.titulo }) : null,
        h('h3', { class: 'activity__title', tabindex: '-1' }, [h('span', { html: mi(heading) }), kb && kb.duracion ? h('span', { class: 'badge', text: kb.duracion }) : null]),
        (kb && kb.consigna) ? h('div', { class: 'prose', html: md(kb.consigna) }) : (a.consigna ? h('div', { class: 'prose', html: md(a.consigna) }) : null),
        kb && kb.pasos && kb.pasos.length ? h('ol', { class: 'steps' }, kb.pasos.map(function (p) { return h('li', { html: mi(p) }); })) : null
      ]);
      var mount = h('div', { class: 'tool-mount', 'data-tool': id });
      art.appendChild(mount);
      if (!mountTool(mount, s.n, id)) {
        mount.appendChild(ui.placeholder(t('page.sesion.herramientaPendiente')));
        var tb = kb ? kbTable(kb.tabla, heading) : null;
        if (tb) mount.appendChild(tb);
      }
      body.appendChild(art);
    });
  }

  function discussionBlock(el, s) {
    var body = block(el, 'discusion', blockLabel(s, 'discusion'));
    body.appendChild(h('ul', { class: 'discussion' }, (s.discusion || []).map(function (q) {
      var btn = h('button', { type: 'button', class: 'btn btn--small btn--note', text: t('sesion.anotar') });
      btn.addEventListener('click', function () {
        var cq = hook('cuaderno');
        if (cq && typeof cq.note === 'function') {
          try { cq.note({ sesion: s.n, texto: plain(q) }); ui.announce(t('page.sesion.anotado')); } catch (err) { warn('cuaderno.note', err); }
        } else {
          ui.announce(t('page.sesion.cuadernoPendiente'));
        }
      });
      return h('li', { class: 'discussion__item card card--thin reveal' }, [h('p', { class: 'discussion__q', html: mi(q) }), btn]);
    })));
  }

  function quizBlock(el, s) {
    var body = block(el, 'quiz', t('sesion.quiz'));
    var mount = h('div', { class: 'tool-mount', 'data-tool': 'quiz' });
    body.appendChild(mount);
    var qz = hook('quiz');
    if (qz && typeof qz.mount === 'function') {
      try { qz.mount(mount, s.n); return; } catch (err) { warn('quiz.mount', err); mount.innerHTML = ''; }
    }
    mount.appendChild(ui.placeholder(t('page.sesion.quizPendiente')));
    mount.appendChild(h('ol', { class: 'quiz-static' }, s.quiz.map(function (q) {
      return h('li', {}, [h('p', { html: mi(q.pregunta) }), h('ol', { class: 'quiz-static__options', type: 'a' }, q.opciones.map(function (o) { return h('li', { html: mi(o) }); }))]);
    })));
  }

  function lecturasBlock(el, s) {
    var body = block(el, 'lecturas', t('sesion.lecturas'));
    body.appendChild(h('ul', { class: 'readings' }, (s.lecturas || []).map(function (l) { return h('li', { html: mi(l, { cite: 'link' }) }); })));
    var mp = course().mapa;
    body.appendChild(h('h3', { class: 'subtitle', text: t('sesion.trabajoAutonomo') }));
    body.appendChild(h('p', { html: mi(mp.trabajoAutonomo.texto) }));
  }

  function facilitadorBlock(el, s) {
    var route = 's' + s.n;
    var det = h('details', { class: 'facilitador block', id: route + '--facilitador' });
    var sum = h('summary', { class: 'facilitador__summary' }, [h('h2', { class: 'facilitador__title', id: route + '--facilitador-titulo', text: t('sesion.facilitador') })]);
    det.appendChild(sum);
    var body = h('div', { class: 'facilitador__body' });
    det.appendChild(body);

    var printBtn = h('button', { type: 'button', class: 'btn btn--small', text: t('page.sesion.imprimirGuia') });
    printBtn.addEventListener('click', function () { printGuide(el, det); });
    body.appendChild(h('p', { class: 'facilitador__print' }, [printBtn]));

    var notes = (s.laminas || []).map(function (id) {
      var d = deckEntry(id), fl = (s.facilitador && s.facilitador.laminas || {})[id] || {};
      if (!d || (!fl.decir && !fl.nota)) return null;
      return h('div', { class: 'margin-note' }, [
        h('p', { class: 'margin-note__title', text: t('page.sesion.lamina', { n: d.n, titulo: d.titulo }) }),
        fl.decir ? h('p', {}, [h('strong', { text: t('modoClase.queDecir') + ': ' }), h('span', { html: mi(fl.decir) })]) : null,
        fl.nota ? h('p', {}, [h('strong', { text: t('page.sesion.nota') + ': ' }), h('span', { html: mi(fl.nota) })]) : null
      ]);
    }).filter(Boolean);
    if (notes.length) {
      body.appendChild(h('h3', { class: 'subtitle', text: t('sesion.laminas') }));
      notes.forEach(function (n) { body.appendChild(n); });
    }

    var claves = (s.facilitador && s.facilitador.claves) || [];
    if (claves.length) {
      body.appendChild(h('h3', { class: 'subtitle', text: t('page.sesion.claves') }));
      claves.forEach(function (cl) {
        var a = (EIA.data.actividades || {})[cl.actividad];
        if (!a) return;
        var box = h('div', { class: 'key' }, [h('h4', { class: 'key__title', text: cl.titulo + ' · ' + a.titulo })]);
        if (a.cards && a.clave && a.clave.columnas) {
          box.appendChild(kbTable({ header: a.clave.columnas, rows: a.cards.map(function (c) { return [c.cifra, c.fuente, c.claveKB]; }) }, cl.titulo));
        } else if (a.afirmaciones) {
          box.appendChild(h('ul', {}, a.afirmaciones.map(function (f) { return h('li', { html: mi(f.clave) }); })));
        } else if (a.kb && a.kb.clave && a.kb.clave.items) {
          box.appendChild(h('ul', {}, a.kb.clave.items.map(function (i) { return h('li', { html: mi(i) }); })));
        }
        body.appendChild(box);
      });
    }

    if (s.quiz && s.quiz.length) {
      body.appendChild(h('h3', { class: 'subtitle', text: t('page.sesion.quizRespuestas') }));
      body.appendChild(h('ol', { class: 'quiz-key' }, s.quiz.map(function (q) {
        var letra = q.letra || String.fromCharCode(97 + q.respuesta);
        return h('li', {}, [
          h('p', { html: mi(q.pregunta) }),
          h('p', { class: 'quiz-key__answer', text: t('page.sesion.respuesta', { letra: letra, opcion: q.opciones[q.respuesta] }) }),
          q.explicacion ? h('p', { html: mi(q.explicacion) }) : null
        ]);
      })));
    }

    body.appendChild(h('h3', { class: 'subtitle', text: t('page.sesion.agenda') }));
    body.appendChild(h('ol', { class: 'agenda-compact' }, s.agenda.map(function (b) {
      return h('li', {}, [h('span', { class: 'num', text: b.minutos + ' ' + t('page.sesion.minutos') }), ' · ', h('span', { html: mi(b.bloque) }), b.recurso && b.recurso !== '—' ? ' · ' + b.recurso : '']);
    })));
    el.appendChild(det);
  }

  function printGuide(viewEl, det) {
    var opened = !det.open;
    det.open = true;
    ui.reveal.show(viewEl);
    flushThumbs(viewEl);
    doc.body.setAttribute('data-print', 'guia');
    viewEl.classList.add('is-print-target');
    function done() {
      doc.body.removeAttribute('data-print');
      viewEl.classList.remove('is-print-target');
      if (opened) det.open = false;
      root.removeEventListener('afterprint', done);
    }
    root.addEventListener('afterprint', done);
    root.setTimeout(function () { root.print(); }, 250);
  }

  function renderSesion(el, n) {
    var s = EIA.data.sesiones[n];
    if (!s) { el.appendChild(ui.placeholder(viewTitle('s' + n))); return; }
    sessionHead(el, s);

    var res = block(el, 'resultados', t('sesion.resultados'));
    res.appendChild(h('ul', { class: 'outcomes' }, s.resultados.map(function (r) { return h('li', { html: mi(r) }); })));

    var ag = block(el, 'agenda', blockLabel(s, 'agenda'), { class: 'block--guide' });
    ag.appendChild(agendaRuler(s));
    ag.appendChild(agendaTable(s));
    if (n === 1) {
      ag.appendChild(card({ class: 'callout', thin: true }, [
        h('p', { text: t('page.sesion.lecturaEvidencia') }),
        h('p', {}, [h('a', { class: 'btn btn--small', href: '#evidencia', text: t('page.sesion.irEvidencia') })])
      ]));
    }

    if (s.laminas && s.laminas.length) {
      var lb = block(el, 'laminas', t('sesion.laminas'), { class: 'block--guide' });
      lb.appendChild(ui.laminaThumbs(s.laminas));
    }
    if (s.videos && s.videos.length) {
      var vb = block(el, 'video', t('sesion.video'));
      s.videos.forEach(function (id) { var v = ui.videoEmbed(id, 's' + n); if (v) vb.appendChild(v); });
    }
    contenidoBlock(el, s);
    if (s.errores && s.errores.length) {
      var eb = block(el, 'errores', t('sesion.errores'));
      eb.appendChild(h('ul', { class: 'errors' }, s.errores.map(function (e) {
        return card({ tag: 'li', class: 'error-card' }, [h('span', { class: 'error-card__sign', 'aria-hidden': 'true' }), h('p', { html: mi(e) })]);
      })));
    }
    if (s.actividades && s.actividades.length) activityBlock(el, s);
    discussionBlock(el, s);
    el.querySelector('#s' + n + '--discusion').classList.add('block--guide');
    if (s.quiz && s.quiz.length) quizBlock(el, s);
    lecturasBlock(el, s);
    facilitadorBlock(el, s);
    ui.prevNext(el);
  }

  // =============================================================================================
  // #proyecto (KB §11)

  function hojaTitle(id) {
    var hojas = (EIA.data.cuaderno && EIA.data.cuaderno.hojas) || [];
    for (var i = 0; i < hojas.length; i++) if (hojas[i].id === id) return hojas[i].titulo;
    return '';
  }

  function staticRubric() {
    var r = EIA.data.rubrica;
    if (!r || !r.criterios) return null;
    var levels = (r.niveles || []).slice().sort(function (a, b) { return b.n - a.n; });
    return h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': r.titulo || '' }, [h('table', { class: 'rubric-table' }, [
      h('thead', {}, [h('tr', {}, (r.columnas || []).map(function (c) { return h('th', { scope: 'col', text: c }); }))]),
      h('tbody', {}, r.criterios.map(function (c) {
        return h('tr', {}, [h('th', { scope: 'row', text: c.criterio }), h('td', { class: 'num', text: c.peso })].concat(levels.map(function (l) {
          return h('td', { html: mi((c.niveles || {})[l.n] || '') });
        })));
      }))
    ])]);
  }

  function renderProyecto(el) {
    var ev = course().evaluacion;
    ui.viewHead(el, { title: t('proyecto.titulo'), signs: ['estrella', 'constelacion'] });
    var pesos = h('table', {}, [
      h('thead', {}, [h('tr', {}, ev.pesos.columnas.map(function (c) { return h('th', { scope: 'col', text: c }); }))]),
      h('tbody', {}, ev.pesos.filas.map(function (f) {
        return h('tr', {}, [h('th', { scope: 'row', html: mi(f.componente) }), h('td', { class: 'num', text: f.peso }), h('td', { text: f.momento })]);
      }))
    ]);
    el.appendChild(h('div', { class: 'view-body' }, [card({ class: 'card--table' }, [h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': t('proyecto.titulo') }, [pesos])])]));

    var pf = block(el, 'final', t('proyecto.proyecto'));
    pf.appendChild(h('p', { html: mi(ev.proyecto.intro) }));
    pf.appendChild(h('ol', { class: 'questions' }, ev.proyecto.preguntas.map(function (q) {
      return h('li', { class: 'questions__item card card--thin reveal' }, [
        h('p', {}, [h('strong', { text: q.n + '. ' + q.titulo + ':' }), ' ', h('span', { html: mi(q.texto) })]),
        q.hojas && q.hojas.length ? h('p', { class: 'questions__sheets' }, [h('span', { class: 'questions__label', text: t('page.proyecto.hojas') + ' ' })].concat(q.hojas.map(function (hid, i) {
          return [i ? ' · ' : '', h('a', { href: '#proyecto/hoja-' + hid, text: hojaTitle(hid) || hid })];
        }))) : null
      ]);
    })));
    pf.appendChild(h('p', { html: mi(ev.proyecto.cierre) }));

    var cq = block(el, 'cuaderno', t('proyecto.cuaderno'));
    var cqMount = h('div', { class: 'tool-mount', 'data-tool': 'cuaderno' });
    cq.appendChild(cqMount);
    var cuaderno = hook('cuaderno');
    var ok = false;
    if (cuaderno && typeof cuaderno.mount === 'function') {
      try { cuaderno.mount(cqMount); ok = true; } catch (err) { warn('cuaderno.mount', err); cqMount.innerHTML = ''; }
    }
    if (!ok) {
      cqMount.appendChild(ui.placeholder(t('page.proyecto.cuadernoPendiente')));
      var hojas = (EIA.data.cuaderno && EIA.data.cuaderno.hojas) || [];
      cqMount.appendChild(h('ul', { class: 'sheets' }, hojas.map(function (hj) {
        return h('li', { id: 'proyecto--hoja-' + hj.id, class: 'sheets__item', tabindex: '-1' }, [
          hj.sesion ? h('span', { class: 'sheets__n', text: t('sesion.sesion', { n: hj.sesion }) }) : null, h('span', { text: hj.titulo })
        ]);
      })));
    }

    var rb = block(el, 'rubrica', t('proyecto.rubrica'));
    var rbMount = h('div', { class: 'tool-mount', 'data-tool': 'rubrica' });
    rb.appendChild(rbMount);
    var rubrica = hook('rubrica');
    ok = false;
    if (rubrica && typeof rubrica.mount === 'function') {
      try { rubrica.mount(rbMount); ok = true; } catch (err) { warn('rubrica.mount', err); rbMount.innerHTML = ''; }
    }
    if (!ok) {
      rbMount.appendChild(ui.placeholder(t('page.proyecto.rubricaPendiente')));
      if (EIA.data.rubrica && EIA.data.rubrica.nota) rbMount.appendChild(h('p', { html: mi(EIA.data.rubrica.nota) }));
      var st = staticRubric();
      if (st) rbMount.appendChild(card({ class: 'card--table' }, [st]));
    }

    var rt = block(el, 'retro', t('proyecto.retro'));
    rt.appendChild(h('ol', { class: 'numbered' }, ev.retro.pasos.map(function (p) { return h('li', { html: mi(p) }); })));
    ui.prevNext(el);
  }

  // =============================================================================================
  // #preguntas (KB §15) and #referencias (KB §16)

  function renderPreguntas(el) {
    ui.viewHead(el, { title: t('preguntas.titulo'), signs: ['pajaro', 'puntos'] });
    var list = h('div', { class: 'faq view-body' });
    (EIA.data.faq || []).forEach(function (f) {
      var body = h('div', { class: 'faq__answer prose', html: md(f.respuesta) });
      stampsAfter(body, f.respuesta);
      list.appendChild(h('details', { class: 'faq__item card card--thin reveal', id: 'preguntas--' + f.id }, [
        h('summary', { class: 'faq__q' }, [h('span', { class: 'faq__n', text: f.n + '.' }), ' ', h('span', { html: mi(f.pregunta) })]),
        body
      ]));
    });
    el.appendChild(list);
  }

  function renderReferencias(el) {
    ui.viewHead(el, { title: t('referencias.titulo'), signs: ['libreta', 'estrella'] });
    var byKey = {};
    (EIA.data.cifras || []).forEach(function (c) {
      if (!c.enBanco) return;
      (c.fuentes || []).forEach(function (k) { (byKey[k] = byKey[k] || []).push(c); });
    });
    var seen = {};
    var body = h('div', { class: 'view-body' });
    (EIA.data.referencias || []).forEach(function (g, gi) {
      var sec = h('section', { class: 'refs', 'aria-labelledby': 'referencias--grupo-' + gi }, [h('h2', { class: 'block-title reveal', id: 'referencias--grupo-' + gi, text: g.grupo })]);
      var ul = h('ul', { class: 'refs__list' });
      g.items.forEach(function (item) {
        var li = card({ tag: 'li', thin: true, class: 'ref' }, [h('p', { class: 'ref__text', html: mi(item, { cite: 'text' }) })]);
        var keys = [];
        EIA.markup.citations(item).forEach(function (c) { if (keys.indexOf(c.key) < 0 && EIA.data.fuentes[c.key]) keys.push(c.key); });
        if (keys.length) {
          var src = h('ul', { class: 'ref__sources' });
          var labels = {};
          EIA.markup.citations(item).forEach(function (c) { if (!labels[c.key]) labels[c.key] = c.label; });
          keys.forEach(function (k) {
            var f = EIA.data.fuentes[k];
            var figs = byKey[k] || [];
            var row = h('li', { class: 'ref__source', id: seen[k] ? null : 'referencias--' + k, tabindex: seen[k] ? null : '-1' }, [
              keys.length > 1 ? h('span', { class: 'ref__label', html: mi(labels[k] || f.etiqueta, { cite: 'text' }) }) : null,
              h('a', { class: 'btn btn--small', href: f.url, target: '_blank', rel: 'noopener', 'aria-label': t('page.referencias.abrirFuenteDe', { fuente: plain(labels[k] || f.etiqueta) }) + ' (' + t('page.markup.nuevaPestana') + ')', text: t('referencias.abrirFuente') }),
              figs.length ? h('details', { class: 'ref__figs' }, [
                h('summary', { text: t('page.referencias.cifrasN', { n: figs.length }) }),
                h('ul', {}, figs.map(function (c) { return h('li', {}, [h('a', { href: '#cifras/' + c.id, text: c.cifra })]); }))
              ]) : null
            ]);
            seen[k] = true;
            src.appendChild(row);
          });
          li.appendChild(src);
        }
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      body.appendChild(sec);
    });
    el.appendChild(body);
  }

  // =============================================================================================
  // #clase while the presenter is not available (or underneath it)

  function renderClase(el) {
    ui.viewHead(el, { title: t('modoClase.titulo'), signs: ['estrella', 'sol'] });
    var hasPresenter = !!(hook('presenter') && typeof ui.presenter.open === 'function');
    var body = h('div', { class: 'view-body' });
    if (!hasPresenter) body.appendChild(ui.placeholder(t('page.clase.pendiente')));
    body.appendChild(h('h2', { class: 'block-title reveal', text: t('page.clase.elegir') }));
    var opts = (EIA.data.modoClase && EIA.data.modoClase.opciones) || [];
    body.appendChild(h('ul', { class: 'clase-options' }, opts.map(function (o) {
      var arg = o.sesion ? String(o.sesion) : o.id;
      var href = hasPresenter ? '#clase/' + arg : (o.sesion ? '#s' + o.sesion : '#mapa');
      return h('li', {}, [h('a', { class: 'btn clase-options__btn', href: href }, [
        o.sesion ? h('span', { class: 'sesion-sign sesion-sign--' + o.sesion, 'aria-hidden': 'true' }) : null, h('span', { text: o.label })
      ])]);
    })));
    el.appendChild(body);
  }

  // =============================================================================================
  // Footer (prompt §9.10)

  function renderFooter(footer) {
    var f = course().footer || {};
    var html = mi(f.texto || '');
    if (f.placeholder) {
      var ph = EIA.markup.escape(f.placeholder);
      html = html.split(ph).join('<span class="blank">' + ph + '</span>');
    }
    footer.innerHTML = '';
    footer.setAttribute('aria-label', t('page.footer.region'));
    footer.appendChild(h('div', { class: 'site-footer__inner' }, [
      h('span', { class: 'site-footer__sign', 'aria-hidden': 'true' }),
      h('p', { class: 'site-footer__text', html: html })
    ]));
    if (f.autores && f.autores.length) {
      footer.appendChild(h('div', { class: 'site-footer__authors' }, [
        h('h2', { class: 'site-footer__authors-title', text: f.autoresTitulo || '' }),
        h('ul', {}, f.autores.map(function (a) {
          return h('li', {}, [
            h('strong', { text: a.nombre }),
            h('span', { text: ' ' + a.afiliacion + ' ' }),
            h('a', { href: 'mailto:' + a.correo, text: a.correo })
          ]);
        }))
      ]));
    }
  }

  // =============================================================================================
  // Shell

  var RENDER = {
    inicio: renderInicio,
    mapa: renderMapa,
    evidencia: renderEvidencia,
    proyecto: renderProyecto,
    cifras: function (el, state) {
      if (ui.banco && ui.banco.mount) ui.banco.mount(el, state);
      else { ui.viewHead(el, { title: t('banco.titulo') }); }
    },
    glosario: function (el, state) { ui.glossary.render(el, state); },
    preguntas: renderPreguntas,
    referencias: renderReferencias,
    asistente: function (el, state) {
      if (ui.asistente && ui.asistente.mount) ui.asistente.mount(el, state);
      else { ui.viewHead(el, { title: t('asistente.titulo') }); }
    },
    clase: renderClase
  };
  for (var sn = 1; sn <= 7; sn++) (function (n) { RENDER['s' + n] = function (el) { renderSesion(el, n); }; })(sn);

  var views = {};
  var shown = null;
  var main = null;
  var baseTitle = '';
  var NO_GLOSS = { glosario: true, asistente: true, clase: true };

  function ensureView(route) {
    var v = views[route];
    if (v) return v;
    var el = h('section', { class: 'view view--' + (/^s[1-7]$/.test(route) ? 'sesion' : route), 'data-route': route, 'aria-labelledby': route + '--titulo', hidden: true });
    main.appendChild(el);
    v = views[route] = { route: route, el: el };
    peekCount = 0;
    try {
      RENDER[route](el, EIA.router.current());
    } catch (err) {
      if (root.console) root.console.error('[views] ' + route + ': ' + (err && (err.stack || err.message)));
    }
    if (!NO_GLOSS[route] && ui.glossary) {
      try { ui.glossary.mark(el); } catch (err) { warn('glossary', err); }
    }
    ui.reveal.observe(el);
    return v;
  }

  function showView(v) {
    if (shown === v) return;
    if (shown) shown.el.hidden = true;
    v.el.hidden = false;
    shown = v;
    var heroApi = views.inicio && views.inicio.el.__hero;
    if (heroApi) heroApi.setActive(v.route === 'inicio');
  }

  function findBlock(v, block) {
    var route = v.route, el = null;
    if (route === 'cifras' && ui.banco && ui.banco.focus) el = ui.banco.focus(block);
    if (route === 'glosario' && ui.glossary && ui.glossary.focus) el = ui.glossary.focus(v.el, block);
    if (!el) el = doc.getElementById(route + '--' + block);
    if (!el) return null;
    if (el.tagName === 'DETAILS') el.open = true;
    var parentDetails = el.parentElement && el.parentElement.closest('details');
    if (parentDetails) parentDetails.open = true;
    return el;
  }

  function focusTarget(el) {
    var heading = el.matches('h1, h2, h3, h4, [tabindex]') ? el : el.querySelector('h1, h2, h3, h4, summary');
    var target = heading || el;
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|SUMMARY|INPUT)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
  }

  function settle(fn) {
    root.requestAnimationFrame(function () { root.requestAnimationFrame(fn); });
  }

  function show(state, info) {
    if (ui.popover) ui.popover.close();
    var presenter = hook('presenter');
    if (state.route === 'clase' && presenter && typeof presenter.open === 'function') {
      if (!shown) showView(ensureView('clase'));
      ui.nav.setCurrent('clase');
      try { presenter.open(state.block || null); } catch (err) { if (root.console) root.console.error('[views] presenter: ' + (err && err.message)); }
      return;
    }
    var v = ensureView(state.route);
    showView(v);
    ui.nav.setCurrent(state.route);
    doc.title = state.route === 'inicio' ? baseTitle : t('page.documento', { vista: viewTitle(state.route), sitio: t('sitio.titulo') });
    settle(function () {
      if (state.block) {
        var target = findBlock(v, state.block);
        if (target) {
          ui.reveal.show(target);
          target.scrollIntoView({ block: 'start' });
          focusTarget(target);
          target.classList.add('is-target');
          root.setTimeout(function () { target.classList.remove('is-target'); }, 2400);
          return;
        }
      }
      if (info.initial && !state.block) return;
      root.scrollTo(0, 0);
      var h1 = v.el.querySelector('h1');
      if (h1) focusTarget(h1);
    });
  }

  var readyResolve = null;
  ui.ready = new Promise(function (resolve) { readyResolve = resolve; });

  ui.boot = function () {
    main = doc.getElementById('main');
    baseTitle = doc.title;
    try { ui.decor.init(); } catch (err) { warn('decor', err); }
    ui.reveal.init();
    ui.popover.init();
    ui.nav.mount(doc.getElementById('site-header'));
    renderFooter(doc.getElementById('site-footer'));

    root.addEventListener('beforeprint', function () { if (shown) flushThumbs(shown.el); });

    var skip = doc.querySelector('.skip-link');
    if (skip) skip.addEventListener('click', function (e) { e.preventDefault(); focusTarget(main); });

    // A click on a link to the current hash re-runs the route (scrolls back to the block).
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var href = a.getAttribute('href');
      if (href === root.location.hash || (href === '#inicio' && !root.location.hash)) { e.preventDefault(); EIA.router.refresh(); }
    });

    EIA.router.start(show);
    ui.decor.fontsReady().then(function () {
      settle(function () {
        try { root.performance.mark('eia:ready'); } catch (err) { /* old engines */ }
        readyResolve(true);
      });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
