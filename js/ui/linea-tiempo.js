/* Estado de la IA 2026 — sesión 0, the AI timeline 1950–2026 (#s0, #s0/<milestone id>).
 *
 *   EIA.ui.lineaTiempo.mount(el, state)   renders the view (views.js RENDER.s0): a horizontal, scrollable
 *       track of the 24 milestones of EIA.data.lineaTiempo grouped by era; each milestone is a button
 *       (click, Enter or Space) that selects it, shows its card (every CSV field and its sources) and
 *       plays its narration with captions. Anterior / Siguiente, "Reproducir todo" (auto-advance) and
 *       the introduction. Arrow keys, Home and End move along the track (roving tabindex).
 *       state.block names the milestone of a deep link: it is selected, never played on load.
 *
 * Audio: EIA.timelineAudio (assets/audio/s0/manifest.js, written by tools/generate-timeline-voiceover.mjs)
 * maps 'intro' and each milestone id to { file, duration, chunks: [{ text, start, end }] }. A plain
 * <audio> element plays the clip and the captions follow its currentTime. Without an entry, or when the
 * file fails to load or play, the clip runs on an internal clock at ~2.4 words/s with the same captions
 * (EIA.engine.captions.chunk / timeChunks): captions only, and "Reproducir todo" still advances.
 *
 * Pure helpers for the tests (DOM-free): EIA.ui.lineaTiempo.sources(fuente) -> [url],
 * clipFor(key) -> { key, file, duration, chunks, text }, cueAt(chunks, t) -> index | -1.
 * Every visible string comes from js/data/linea-tiempo.js. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  var WPS = 2.4;          // words per second of the captions-only clock (narrator.js 'silent' estimate)
  var GAP_MS = 800;       // pause between two milestones in "Reproducir todo"

  function data() { return EIA.data.lineaTiempo || { hitos: [], eras: [], ui: {}, intro: {} }; }
  function copy(key, vars) {
    var v = key.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, data().ui);
    return String(v == null ? '' : v).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? String(vars[k]) : ''; });
  }
  function h(tag, attrs, kids) { return ui.h(tag, attrs, kids); }

  // ---------------------------------------------------------------------------------------------
  // Pure helpers

  /** The URLs of a "Fuente de verificación" cell (several are joined by " ; "). */
  function sources(fuente) {
    return String(fuente || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function textFor(key) {
    if (key === 'intro') return data().intro.narracion || '';
    var hito = data().hitos.filter(function (x) { return x.id === key; })[0];
    return hito ? hito.narracion : '';
  }

  /** The clip of 'intro' or a milestone id: the generated one, or captions timed at WPS. */
  function clipFor(key) {
    var text = textFor(key);
    var entry = (EIA.timelineAudio || {})[key];
    if (entry && entry.file && entry.chunks && entry.chunks.length) {
      return { key: key, file: entry.file, duration: entry.duration, chunks: entry.chunks, text: text };
    }
    var cap = EIA.engine && EIA.engine.captions;
    var texts = cap && cap.chunk ? cap.chunk(text) : [text];
    var words = text.split(/\s+/).filter(Boolean).length;
    var duration = Math.max(2, words / WPS);
    var chunks = cap && cap.timeChunks ? cap.timeChunks(texts, 0, duration) : [{ text: text, start: 0, end: duration }];
    return { key: key, file: null, duration: duration, chunks: chunks, text: text };
  }

  /** Index of the caption chunk showing at t seconds (the last one stays until the end). */
  function cueAt(chunks, t) {
    if (!chunks || !chunks.length || t < chunks[0].start) return -1;
    for (var i = chunks.length - 1; i >= 0; i--) if (t >= chunks[i].start) return i;
    return -1;
  }

  // ---------------------------------------------------------------------------------------------
  // Player: one clip at a time, audio or captions-only clock

  function createPlayer(onCue, onState) {
    var audio = null;
    var clip = null;
    var mode = 'silent';
    var playing = false;
    var offset = 0, t0 = 0;
    var raf = 0;
    var done = null;
    var failed = {};

    function now() { return root.performance && root.performance.now ? root.performance.now() : Date.now(); }
    function time() {
      if (!clip) return 0;
      if (mode === 'audio') return audio.currentTime || 0;
      return playing ? offset + (now() - t0) / 1000 : offset;
    }
    function loop() {
      raf = 0;
      if (!clip) return;
      var t = time();
      onCue(clip, cueAt(clip.chunks, t));
      if (mode === 'silent' && playing && t >= clip.duration) return finish();
      if (playing) raf = root.requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = root.requestAnimationFrame(loop); }
    function setPlaying(on) { playing = on; onState({ playing: on, key: clip && clip.key, mode: mode }); if (on) kick(); }
    function toSilent(at) {
      if (clip && clip.file) failed[clip.key] = true;
      mode = 'silent';
      offset = at || 0;
      t0 = now();
      if (audio) { try { audio.pause(); } catch (err) { /* nothing to pause */ } }
      setPlaying(true);
    }
    function finish() {
      var cb = done;
      done = null;
      setPlaying(false);
      onCue(clip, clip ? clip.chunks.length - 1 : -1);
      if (cb) cb();
    }
    function ensureAudio() {
      if (audio || typeof root.Audio !== 'function') return audio;
      audio = new root.Audio();
      audio.preload = 'none';
      audio.addEventListener('ended', function () { if (mode === 'audio' && playing) finish(); });
      audio.addEventListener('error', function () { if (mode === 'audio' && playing) toSilent(audio.currentTime || 0); });
      return audio;
    }

    function play(key, onDone) {
      stop();
      clip = clipFor(key);
      done = onDone || null;
      offset = 0;
      onCue(clip, -1);
      if (clip.file && !failed[key] && ensureAudio()) {
        mode = 'audio';
        audio.src = clip.file;
        setPlaying(true);
        var p;
        try { p = audio.play(); } catch (err) { toSilent(0); return; }
        if (p && typeof p.catch === 'function') p.catch(function () { if (clip && clip.key === key && mode === 'audio') toSilent(audio.currentTime || 0); });
      } else {
        toSilent(0);
      }
    }
    function pause() {
      if (!clip || !playing) return;
      if (mode === 'audio') audio.pause();
      else offset = time();
      setPlaying(false);
    }
    function resume() {
      if (!clip || playing) return;
      if (mode === 'audio') {
        setPlaying(true);
        var p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(function () { toSilent(audio.currentTime || 0); });
      } else {
        if (offset >= clip.duration) offset = 0; // a finished clip starts over
        t0 = now();
        setPlaying(true);
      }
    }
    function stop() {
      done = null;
      if (audio) { try { audio.pause(); } catch (err) { /* idle */ } }
      if (raf) { root.cancelAnimationFrame(raf); raf = 0; }
      if (playing) setPlaying(false);
      clip = null;
    }
    return {
      play: play, pause: pause, resume: resume, stop: stop,
      current: function () { return clip ? clip.key : null; },
      isPlaying: function () { return playing; },
      usedFallback: function (key) { return !!failed[key] || !(EIA.timelineAudio || {})[key]; }
    };
  }

  // ---------------------------------------------------------------------------------------------
  // View

  function mount(el, state) {
    var D = data();
    var hitos = D.hitos;
    var selected = -1;
    var playAll = false;
    var advanceTimer = 0;
    var buttons = [];

    ui.viewHead(el, { kicker: D.kicker, title: D.titulo, lead: '<p>' + EIA.markup.inline(D.lead) + '</p>' });
    var body = ui.block(el, 'hitos', copy('pista'), { class: 'timeline-block' });

    // Controls
    var prevBtn = h('button', { type: 'button', class: 'btn btn--small', text: '← ' + copy('anterior') });
    var allBtn = h('button', { type: 'button', class: 'btn btn--small btn--primary', 'aria-pressed': 'false', text: copy('reproducirTodo') });
    var nextBtn = h('button', { type: 'button', class: 'btn btn--small', text: copy('siguiente') + ' →' });
    var introBtn = h('button', { type: 'button', class: 'btn btn--small btn--quiet', text: copy('introduccion') });
    var pos = h('p', { class: 'timeline__pos', 'aria-live': 'polite' });
    body.appendChild(h('div', { class: 'timeline__controls', role: 'group', 'aria-label': copy('controles') }, [prevBtn, allBtn, nextBtn, introBtn, pos]));

    // Track
    var helpId = 's0--ayuda';
    body.appendChild(h('p', { id: helpId, class: 'visually-hidden', text: copy('pistaAyuda') }));
    var scroller = h('div', { class: 'timeline__scroller' });
    var eras = h('ol', { class: 'timeline__eras', 'aria-label': copy('pista') });
    D.eras.forEach(function (era) {
      var list = h('ol', { class: 'timeline__list' });
      hitos.forEach(function (hito, i) {
        if (hito.era !== era.id) return;
        var btn = h('button', {
          type: 'button', class: 'timeline__hito', id: 's0--' + hito.id, 'aria-pressed': 'false',
          'aria-describedby': helpId, tabindex: i === 0 ? '0' : '-1', 'data-index': String(i)
        }, [
          h('span', { class: 'timeline__dot', 'aria-hidden': 'true' }),
          h('span', { class: 'timeline__fecha', text: hito.fecha }),
          h('span', { class: 'timeline__nombre', text: hito.hito })
        ]);
        buttons[i] = btn;
        list.appendChild(h('li', { class: 'timeline__item' }, [btn]));
      });
      eras.appendChild(h('li', { class: 'timeline__era timeline__era--' + era.id }, [
        h('h3', { class: 'timeline__era-title' }, [h('span', { text: era.titulo }), h('span', { class: 'timeline__era-years', text: era.subtitulo })]),
        list
      ]));
    });
    scroller.appendChild(eras);
    body.appendChild(scroller);

    // Detail card and captions
    var detail = h('article', { class: 'card card--thin timeline__detail', 'aria-labelledby': 's0--detalle-titulo' });
    var caption = h('p', { class: 'timeline__caption', 'aria-hidden': 'true' });
    var notice = h('p', { class: 'timeline__notice', hidden: true, text: copy('sinAudio') });
    var listenBtn = h('button', { type: 'button', class: 'btn btn--small', text: copy('escuchar') });
    body.appendChild(detail);

    var player = createPlayer(function (clip, i) {
      caption.textContent = clip && i >= 0 ? clip.chunks[i].text : '';
    }, function (st) {
      listenBtn.textContent = st.playing ? copy('pausar') : copy('escuchar');
      listenBtn.setAttribute('aria-pressed', st.playing ? 'true' : 'false');
      if (st.playing && st.key) notice.hidden = !player.usedFallback(st.key);
    });

    function field(key, value) {
      return [h('dt', { text: copy('campos.' + key) }), h('dd', { text: value })];
    }
    function sourceLinks(fuente) {
      var hint = ui.t ? ui.t('page.markup.nuevaPestana') : '';
      return h('dd', {}, [h('ul', { class: 'timeline__sources' }, sources(fuente).map(function (url) {
        return h('li', {}, [h('a', { class: 'ext-link', href: url, target: '_blank', rel: 'noopener', 'aria-label': url + (hint ? ' (' + hint + ')' : '') }, [url, h('span', { 'aria-hidden': 'true', text: ' ↗' })])]);
      }))]);
    }

    function renderDetail() {
      detail.textContent = '';
      var hito = hitos[selected];
      if (!hito) {
        detail.appendChild(h('p', { class: 'kicker', text: D.kicker }));
        detail.appendChild(h('h3', { class: 'card__title', id: 's0--detalle-titulo', tabindex: '-1', text: D.titulo }));
        detail.appendChild(h('p', { class: 'timeline__lead', text: D.intro.narracion }));
      } else {
        detail.appendChild(h('p', { class: 'kicker timeline__detail-fecha', text: hito.fecha }));
        detail.appendChild(h('h3', { class: 'card__title', id: 's0--detalle-titulo', tabindex: '-1', text: hito.hito }));
      }
      detail.appendChild(h('div', { class: 'timeline__narration' }, [listenBtn, h('div', { class: 'timeline__caption-box' }, [
        h('span', { class: 'timeline__caption-label', text: copy('subtitulos') }), caption
      ])]));
      detail.appendChild(notice);
      if (hito) {
        detail.appendChild(h('dl', { class: 'timeline__fields' }, [].concat(
          field('actores', hito.actores), field('lugar', hito.lugar), field('avance', hito.avance),
          field('importancia', hito.importancia), field('nota', hito.nota),
          [h('dt', { text: copy('campos.fuente') }), sourceLinks(hito.fuente)]
        )));
      }
      caption.textContent = '';
      pos.textContent = hito ? copy('posicion', { n: selected + 1, total: hitos.length }) : '';
    }

    function centerOn(btn, instant) {
      var box = scroller.getBoundingClientRect(), r = btn.getBoundingClientRect();
      var left = scroller.scrollLeft + (r.left - box.left) - (scroller.clientWidth - r.width) / 2;
      var behavior = instant || (ui.reducedMotion && ui.reducedMotion()) ? 'auto' : 'smooth';
      try { scroller.scrollTo({ left: Math.max(0, left), behavior: behavior }); } catch (err) { scroller.scrollLeft = Math.max(0, left); }
    }

    function clearAdvance() { if (advanceTimer) { root.clearTimeout(advanceTimer); advanceTimer = 0; } }

    function setPlayAll(on) {
      playAll = on;
      allBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      allBtn.textContent = on ? copy('detenerTodo') : copy('reproducirTodo');
      if (!on) clearAdvance();
    }

    function onClipEnd() {
      if (!playAll) return;
      if (selected >= hitos.length - 1) { setPlayAll(false); return; }
      advanceTimer = root.setTimeout(function () { advanceTimer = 0; select(selected + 1, { play: true, user: true }); }, GAP_MS);
    }

    /* select(i, { play, user, focus }): i = -1 shows the introduction card. user: rewrite the hash to
     * #s0/<id> without a new history entry (EIA.router.replace) and keep the button in view. */
    function select(i, o) {
      o = o || {};
      clearAdvance();
      selected = i;
      buttons.forEach(function (b, k) {
        var on = k === i;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-selected', on);
        b.setAttribute('tabindex', on || (i < 0 && k === 0) ? '0' : '-1');
      });
      renderDetail();
      var hito = hitos[i];
      if (hito) {
        centerOn(buttons[i]);
        if (o.focus) buttons[i].focus({ preventScroll: true });
        if (o.user && EIA.router.current().route === 's0') EIA.router.replace('s0', hito.id);
        if (o.user && ui.announce) ui.announce(copy('seleccionado', { fecha: hito.fecha, hito: hito.hito }));
      }
      if (o.play) player.play(hito ? hito.id : 'intro', onClipEnd);
      else player.stop();
    }

    function indexOf(id) {
      for (var i = 0; i < hitos.length; i++) if (hitos[i].id === id) return i;
      return -1;
    }

    // Events
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i, { play: true, user: true }); });
    });
    eras.addEventListener('keydown', function (e) {
      var btn = e.target.closest && e.target.closest('.timeline__hito');
      if (!btn) return;
      var i = Number(btn.getAttribute('data-index'));
      var to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: hitos.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      to = Math.max(0, Math.min(hitos.length - 1, to));
      buttons.forEach(function (b, k) { b.setAttribute('tabindex', k === to ? '0' : '-1'); });
      buttons[to].focus({ preventScroll: true });
      centerOn(buttons[to]);
    });
    prevBtn.addEventListener('click', function () { select(Math.max(0, selected - 1), { play: true, user: true }); });
    nextBtn.addEventListener('click', function () { select(Math.min(hitos.length - 1, selected + 1), { play: true, user: true }); });
    introBtn.addEventListener('click', function () { setPlayAll(false); select(-1, { play: true }); });
    allBtn.addEventListener('click', function () {
      if (playAll) { setPlayAll(false); player.stop(); return; }
      setPlayAll(true);
      select(selected < 0 || selected >= hitos.length - 1 ? 0 : selected, { play: true, user: true });
    });
    listenBtn.addEventListener('click', function () {
      var key = hitos[selected] ? hitos[selected].id : 'intro';
      if (player.current() === key) {
        if (player.isPlaying()) { setPlayAll(false); player.pause(); } else player.resume();
      } else {
        player.play(key, onClipEnd);
      }
    });

    // Deep links after the first render, and silence when the view is left.
    // A hidden view has no layout, so the track is centered again once views.js has shown the view and
    // scrolled the deep-link target into view (it waits two frames; this runs one frame later).
    function recenter() {
      root.requestAnimationFrame(function () { root.requestAnimationFrame(function () { root.requestAnimationFrame(function () {
        if (buttons[selected]) centerOn(buttons[selected], true);
      }); }); });
    }
    root.addEventListener('eia:route', function (e) {
      var d = e.detail || {};
      if (d.route !== 's0') { setPlayAll(false); player.stop(); return; }
      var i = d.block ? indexOf(d.block) : -1;
      if (i >= 0 && i !== selected) select(i, {});
      recenter();
    });

    select(state && state.block ? indexOf(state.block) : -1, {});
    ui.prevNext(el);
    return { destroy: function () { setPlayAll(false); player.stop(); } };
  }

  ui.lineaTiempo = { mount: mount, sources: sources, clipFor: clipFor, cueAt: cueAt };
})(typeof window !== 'undefined' ? window : globalThis);
