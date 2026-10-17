/* Estado de la IA 2026 — sticky header, main navigation and "Buscar en el curso" (prompt §9.1).
 *
 *   EIA.ui.nav.mount(headerEl)    brush-lettered "Estado de la IA 2026" (canvas, writes itself on once),
 *                                 nav "Inicio · Mapa · Evidencia · Sesiones · Cifras · Proyecto · Glosario ·
 *                                 Preguntas · Referencias · Asistente · Modo clase"; "Sesiones" opens the 7
 *                                 sessions with their signs and KB §2 titles; a menu button on small
 *                                 screens; a search panel. Publishes the header height as --header-h.
 *   EIA.ui.nav.setCurrent(route)  aria-current on the active link; closes the menus
 *   EIA.ui.search.build()         the accent-insensitive search index (sessions, banco, glosario, preguntas)
 *   EIA.ui.search.query(text)     -> [{ type, title, snippet, href }] (pure over the index) */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  function t(path, vars) { return ui.t(path, vars); }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }

  var ITEMS = ['inicio', 'mapa', 'evidencia', 'sesiones', 'cifras', 'proyecto', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase'];
  var LABEL_KEY = { clase: 'modoClase' };

  var els = {};

  // ---------------------------------------------------------------------------------------------
  // Brand lettering

  function brand() {
    var title = t('sitio.titulo');
    var link = h('a', { class: 'brand', href: '#inicio', 'aria-label': t('page.nav.irInicio') }, [h('span', { class: 'brand__text', text: title })]);
    var ink = EIA.engine && EIA.engine.ink;
    if (!ink || !ink.letter) return link;
    var canvas = h('canvas', { class: 'brand__lettering', 'aria-hidden': 'true' });
    link.insertBefore(canvas, link.firstChild);
    ui.decor.fontsReady().then(function () {
      var ctx = canvas.getContext('2d');
      var o = { size: 30, maxLines: 1, seed: 'brand', underline: true, counters: 0.5 };
      var L = ink.measureLetter(ctx, title, o);
      var w = Math.ceil(L.w + 14), hh = Math.ceil(L.h + 6), k = Math.min(2, root.devicePixelRatio || 1);
      canvas.width = Math.ceil(w * k);
      canvas.height = Math.ceil(hh * k);
      canvas.style.width = w + 'px';
      canvas.style.height = hh + 'px';
      link.classList.add('has-lettering');
      function draw(p) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ink.letter(ctx, title, 4, 2, Object.assign({ p: p }, o));
      }
      if (ui.reducedMotion()) { draw(1); return; }
      var t0 = 0;
      (function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1100);
        draw(p);
        if (p < 1) root.requestAnimationFrame(frame);
      })(0);
    });
    return link;
  }

  // ---------------------------------------------------------------------------------------------
  // Menus

  function setOpen(button, panel, open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    if (panel === els.nav) {
      els.header.classList.toggle('is-menu-open', open);
      button.setAttribute('aria-label', open ? t('page.nav.cerrarMenu') : t('page.nav.menu'));
    }
  }

  function sessionsMenu() {
    var btn = h('button', { type: 'button', class: 'site-nav__link site-nav__toggle', 'aria-expanded': 'false', 'aria-controls': 'nav-sesiones' },
      [h('span', { text: t('nav.sesiones') }), h('span', { class: 'caret', 'aria-hidden': 'true' })]);
    var list = h('ul', { id: 'nav-sesiones', class: 'site-nav__menu', hidden: true, 'aria-label': t('page.nav.sesionesMenu') });
    var labels = (EIA.data.course.ui.nav.sesionesMenu || []);
    for (var n = 1; n <= 7; n++) {
      list.appendChild(h('li', {}, [h('a', { class: 'site-nav__session', href: '#s' + n, 'data-route': 's' + n }, [
        h('span', { class: 'sesion-sign sesion-sign--' + n, 'aria-hidden': 'true' }),
        h('span', { text: labels[n - 1] || t('sesion.sesion', { n: n }) })
      ])]));
    }
    btn.addEventListener('click', function () { setOpen(btn, list, btn.getAttribute('aria-expanded') !== 'true'); });
    els.sesBtn = btn;
    els.sesList = list;
    return h('li', { class: 'site-nav__item site-nav__item--sesiones' }, [btn, list]);
  }

  function navList() {
    var ul = h('ul', { class: 'site-nav__list' });
    ITEMS.forEach(function (id) {
      if (id === 'sesiones') { ul.appendChild(sessionsMenu()); return; }
      var label = t('nav.' + (LABEL_KEY[id] || id));
      ul.appendChild(h('li', { class: 'site-nav__item' }, [h('a', { class: 'site-nav__link', href: '#' + id, 'data-route': id, text: label })]));
    });
    return ul;
  }

  function closeMenus() {
    if (els.sesBtn) setOpen(els.sesBtn, els.sesList, false);
    if (els.menuBtn && isCompact()) setOpen(els.menuBtn, els.nav, false);
    if (els.searchBtn) setOpen(els.searchBtn, els.search, false);
  }

  function isCompact() {
    return els.menuBtn && root.getComputedStyle(els.menuBtn).display !== 'none';
  }

  function syncCompact() {
    if (!els.menuBtn) return;
    if (isCompact()) {
      if (els.menuBtn.getAttribute('aria-expanded') !== 'true') els.nav.hidden = true;
    } else {
      els.nav.hidden = false;
      els.header.classList.remove('is-menu-open');
    }
  }

  // The sticky header's resting height (bar + nav), without the search panel or the open mobile
  // menu: scroll-padding and the search panel's max-height depend on it.
  function publishHeight() {
    var hh = els.header.offsetHeight || 0;
    if (els.search && !els.search.hidden) hh -= els.search.offsetHeight;
    if (isCompact() && els.nav && !els.nav.hidden) hh -= els.nav.offsetHeight;
    doc.documentElement.style.setProperty('--header-h', Math.max(48, hh) + 'px');
  }

  // ---------------------------------------------------------------------------------------------
  // Search

  var index = null;
  function fold(s) { return EIA.util.fold(s); }
  function plain(s) { return EIA.markup.plain(s); }

  function build() {
    if (index) return index;
    index = [];
    var D = EIA.data;
    for (var n = 1; n <= 7; n++) {
      var s = D.sesiones[n];
      if (!s) continue;
      var tipo = t('page.buscar.tipos.sesion', { n: n });
      index.push({ type: tipo, title: t('page.nav.sesion', { n: n, titulo: s.titulo }), text: plain(s.tesis), href: '#s' + n });
      (s.contenido || []).forEach(function (c) {
        index.push({ type: tipo, title: c.n + '. ' + plain(c.titulo), text: plain(c.cuerpo), href: '#s' + n + '/contenido-' + c.n });
      });
    }
    (D.cifras || []).forEach(function (c) {
      if (!c.enBanco) return;
      var f = (c.fuentes || []).map(function (k) { return (D.fuentes[k] || {}).etiqueta || ''; }).join(' · ');
      index.push({ type: t('page.buscar.tipos.cifra'), title: c.cifra, text: (c.alcanceCompleto || c.alcance) + ' · ' + f, href: '#cifras/' + c.id });
    });
    (D.glosario || []).forEach(function (g) {
      index.push({ type: t('page.buscar.tipos.glosario'), title: g.termino, text: g.definicion, href: '#glosario/' + g.id });
    });
    (D.faq || []).forEach(function (f) {
      index.push({ type: t('page.buscar.tipos.pregunta'), title: f.pregunta, text: plain(f.respuesta), href: '#preguntas/' + f.id });
    });
    index.forEach(function (it) { it.ft = fold(it.title); it.fx = fold(it.text); });
    return index;
  }

  function snippet(text, word) {
    var f = fold(text), i = word ? f.indexOf(word) : -1;
    if (i < 0) return text.length > 160 ? text.slice(0, 157) + '…' : text;
    var a = Math.max(0, i - 60), b = Math.min(text.length, i + 100);
    return (a > 0 ? '…' : '') + text.slice(a, b) + (b < text.length ? '…' : '');
  }

  function query(q) {
    var words = fold(q).trim().split(/\s+/).filter(function (w) { return w.length > 0; });
    if (!words.length || fold(q).trim().length < 2) return [];
    var out = [];
    build().forEach(function (it) {
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var inT = it.ft.indexOf(words[i]) >= 0, inX = it.fx.indexOf(words[i]) >= 0;
        if (!inT && !inX) return;
        score += inT ? 3 : 1;
      }
      out.push({ type: it.type, title: it.title, snippet: snippet(it.text, words[0]), href: it.href, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 24);
  }

  function searchPanel() {
    var id = 'buscar-curso';
    var input = h('input', { type: 'search', id: id, class: 'search-input', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': id + '-ayuda' });
    var status = h('p', { class: 'search__status', role: 'status' });
    var results = h('ol', { class: 'search__results' });
    var panel = h('div', { id: 'search-panel', class: 'search', hidden: true }, [
      h('div', { class: 'search__inner' }, [
        h('label', { for: id, class: 'field-label', text: t('page.buscar.etiqueta') }),
        input,
        h('p', { id: id + '-ayuda', class: 'search__help', text: t('page.buscar.ayuda') }),
        status,
        results
      ])
    ]);
    var timer = 0;
    function run() {
      var q = input.value;
      results.innerHTML = '';
      if (fold(q).trim().length < 2) { status.textContent = q.trim() ? t('page.buscar.minimo') : ''; return; }
      var list = query(q);
      status.textContent = !list.length ? t('page.buscar.sinResultados', { q: q.trim() })
        : list.length === 1 ? t('page.buscar.unResultado') : t('page.buscar.resultados', { n: list.length });
      list.forEach(function (r) {
        results.appendChild(h('li', { class: 'search__result' }, [
          h('a', { href: r.href, class: 'search__link' }, [
            h('span', { class: 'search__type', text: r.type }),
            h('span', { class: 'search__title', text: r.title }),
            h('span', { class: 'search__snippet', text: r.snippet })
          ])
        ]));
      });
    }
    input.addEventListener('input', function () { root.clearTimeout(timer); timer = root.setTimeout(run, 120); });
    results.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setOpen(els.searchBtn, panel, false);
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { setOpen(els.searchBtn, panel, false); els.searchBtn.focus(); }
    });
    els.searchInput = input;
    return panel;
  }

  // ---------------------------------------------------------------------------------------------

  function mount(header) {
    els.header = header;
    header.innerHTML = '';
    var menuBtn = h('button', { type: 'button', class: 'nav-toggle', 'aria-expanded': 'false', 'aria-controls': 'site-nav', 'aria-label': t('page.nav.menu') },
      [h('span', { class: 'nav-toggle__bars', 'aria-hidden': 'true' }), h('span', { class: 'nav-toggle__label', text: t('page.nav.menu') })]);
    var searchBtn = h('button', { type: 'button', class: 'search-toggle', 'aria-expanded': 'false', 'aria-controls': 'search-panel' },
      [h('span', { class: 'search-toggle__sign', 'aria-hidden': 'true' }), h('span', { class: 'search-toggle__label', text: t('page.buscar.abrir') })]);
    var nav = h('nav', { id: 'site-nav', class: 'site-nav', 'aria-label': t('page.nav.principal') }, [navList()]);
    var panel = searchPanel();
    els.menuBtn = menuBtn;
    els.searchBtn = searchBtn;
    els.nav = nav;
    els.search = panel;
    header.appendChild(h('div', { class: 'site-header__bar' }, [brand(), h('div', { class: 'site-header__tools' }, [searchBtn, menuBtn])]));
    header.appendChild(nav);
    header.appendChild(panel);

    menuBtn.addEventListener('click', function () { setOpen(menuBtn, nav, menuBtn.getAttribute('aria-expanded') !== 'true'); publishHeight(); });
    searchBtn.addEventListener('click', function () {
      var open = searchBtn.getAttribute('aria-expanded') !== 'true';
      setOpen(searchBtn, panel, open);
      if (open) { build(); els.searchInput.focus(); }
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      if (els.sesBtn && els.sesBtn.getAttribute('aria-expanded') === 'true') { setOpen(els.sesBtn, els.sesList, false); els.sesBtn.focus(); }
      else if (isCompact() && menuBtn.getAttribute('aria-expanded') === 'true') { setOpen(menuBtn, nav, false); menuBtn.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (els.sesBtn && !els.sesBtn.parentNode.contains(e.target)) setOpen(els.sesBtn, els.sesList, false);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href^="#"]')) closeMenus();
    });
    if (typeof root.ResizeObserver === 'function') {
      new root.ResizeObserver(function () { publishHeight(); }).observe(header);
    }
    root.addEventListener('resize', syncCompact);
    syncCompact();
    publishHeight();
  }

  function setCurrent(route) {
    if (!els.nav) return;
    Array.prototype.forEach.call(els.nav.querySelectorAll('a[data-route]'), function (a) {
      if (a.getAttribute('data-route') === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (els.sesBtn) els.sesBtn.classList.toggle('is-current', /^s[1-7]$/.test(route));
    closeMenus();
  }

  ui.nav = { mount: mount, setCurrent: setCurrent };
  ui.search = { build: build, query: query };
})(typeof window !== 'undefined' ? window : globalThis);
