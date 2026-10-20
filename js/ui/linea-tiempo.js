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

  /* Soft hyphens (U+00AD) in the long Spanish words of a text, at syllable breaks (V-CV, VC-CV and the
   * inseparable pairs bl, br, cl, cr, dr, fl, fr, gl, gr, kl, kr, pl, pr, tr, ch, ll, rr): the narrow poster
   * columns break "preentrenamiento" as preen-tre-na-mien-to, whatever hyphenation the browser has. */
  var INSEPARABLE = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr'];
  var VOWEL = /[aeiouáéíóúü]/i;
  function hyphenate(text) {
    return String(text || '').replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{9,}/g, function (w) {
      var cuts = [];
      for (var i = 1; i < w.length; i++) {
        if (VOWEL.test(w[i]) || !VOWEL.test(w[i - 1])) continue;
        var j = i;
        while (j < w.length && !VOWEL.test(w[j])) j++;
        if (j >= w.length) break;
        var pair = w.slice(j - 2, j).toLowerCase(), insep = j - i >= 2 && INSEPARABLE.indexOf(pair) >= 0;
        var cut = j - i === 1 ? i : insep ? j - 2 : j - 1;
        if (cut >= 2 && w.length - cut >= 2) cuts.push(cut);
        i = j;
      }
      var out = '', last = 0;
      cuts.forEach(function (c) { out += w.slice(last, c) + '\u00AD'; last = c; });
      return out + w.slice(last);
    });
  }

  // ---------------------------------------------------------------------------------------------
  // The poster line: a brush line through every dot, with waves between them and loops in some gaps

  /* linePoints(dots, { x0, x1, y, amp, loops, seed }) -> flat [x, y, …] from x0 to x1 that passes
   * exactly through every dot ({ x, y }, left to right). Between two dots the line bows up or down
   * (alternating, amp px); a gap listed in loops (gap k = between dot k and dot k+1) gets a small curl. */
  function linePoints(dots, o) {
    o = o || {};
    var amp = o.amp == null ? 10 : o.amp;
    var y0 = dots.length ? dots[0].y : (o.y || 0);
    var anchors = [{ x: o.x0 == null ? 0 : o.x0, y: y0 }].concat(dots, [{ x: o.x1 == null ? 100 : o.x1, y: dots.length ? dots[dots.length - 1].y : y0 }]);
    var loops = o.loops || [];
    var out = [anchors[0].x, anchors[0].y];
    for (var k = 1; k < anchors.length; k++) {
      var a = anchors[k - 1], b = anchors[k], len = b.x - a.x;
      if (len <= 0) continue;
      var bow = (k % 2 ? -1 : 0.6) * Math.min(amp, len * 0.12);
      var n = Math.max(4, Math.round(len / 14));
      var curl = loops.indexOf(k - 2) >= 0 ? Math.min(13, len * 0.1) : 0;  // segment k joins dot k-2 and dot k-1
      for (var i = 1; i <= n; i++) {
        var t = i / n;
        if (i === n) { out.push(b.x, b.y); break; }
        var x = a.x + len * t, y = a.y + (b.y - a.y) * t + Math.sin(Math.PI * t) * bow;
        out.push(x, y);
        if (curl && i === Math.floor(n / 2)) {
          for (var j = 1; j < 16; j++) {
            var th = j / 16 * Math.PI * 2;
            out.push(x - curl * Math.sin(th) + (j / 16) * curl * 0.9, y - curl * (1 - Math.cos(th)));
          }
        }
      }
    }
    return out;
  }

  var DOT_COLORS = ['tinta', 'rojo', 'azul', 'amarillo'];
  var LOOPS = { fundamentos: [1, 4], generativa: [2, 5] };      // gaps with a curl, as on the poster

  function dpr() { return Math.min(2, root.devicePixelRatio || 1); }
  function fitCanvas(c, w, hgt) {
    var k = dpr(), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(hgt * k));
    if (c.width === cw && c.height === ch) return null;
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    return ctx;
  }
  function paintArt(c, name) {
    var w = c.clientWidth, hgt = c.clientHeight;
    if (!w || !hgt) return;
    var ctx = fitCanvas(c, w, hgt);
    if (!ctx || !ui.lineaTiempoArte) return;
    try { ui.lineaTiempoArte.draw(ctx, name, w, hgt); } catch (err) { if (root.console) root.console.warn('[s0] ' + name + ': ' + err.message); }
  }

  /* One era panel: poster title, spaced subtitle, short colored rule and flourish; then a scroller with
   * the stage (line canvas + columns). A column with one milestone is a single button (drawing, dot,
   * year, rótulo, resumen, place); a column of several shows one drawing, their dots and year, and one
   * small button per milestone. buttons[i] and dots[i] follow the milestone order of the data. */
  function buildPanel(era, k, hitos, helpId, buttons, dots) {
    var h = ui.h;
    var index = {};
    hitos.forEach(function (x, i) { index[x.id] = i; });
    var titleId = 's0--era-' + era.id;
    var flourish = h('canvas', { class: 'poster__flourish', 'aria-hidden': 'true' });
    var head = h('header', { class: 'poster__head' }, [
      h('h3', { class: 'poster__title', id: titleId, text: era.titulo }),
      h('p', { class: 'poster__subtitle' }, [h('span', { text: era.subtitulo }), h('span', { class: 'poster__years', text: era.anios })]),
      h('span', { class: 'poster__rule', 'aria-hidden': 'true' }),
      flourish
    ]);
    var line = h('canvas', { class: 'poster__line', 'aria-hidden': 'true' });
    var cols = h('ol', { class: 'poster__cols', 'aria-labelledby': titleId });
    var widths = [], arts = [];

    function hitoButton(hito, i, mini, kids) {
      var dot = h('span', { class: 'poster__dot poster__dot--' + DOT_COLORS[i % DOT_COLORS.length], 'aria-hidden': 'true' });
      dots[i] = dot;
      var btn = h('button', {
        type: 'button', class: 'timeline__hito poster__hito' + (mini ? ' poster__hito--mini' : ''), id: 's0--' + hito.id,
        'aria-pressed': 'false', 'aria-describedby': helpId, tabindex: i === 0 ? '0' : '-1', 'data-index': String(i)
      }, (kids || []).concat(mini ? [] : [h('span', { class: 'poster__dotzone' }, [dot])], [
        mini ? null : h('span', { class: 'poster__fecha', text: hito.fecha }),
        h('span', { class: 'poster__rotulo', text: hyphenate(hito.rotulo) }),
        h('span', { class: 'poster__resumen', text: hyphenate(hito.resumen) }),
        h('span', { class: 'poster__lugar', text: hyphenate(hito.lugar) })
      ].filter(Boolean)));
      buttons[i] = btn;
      return btn;
    }

    era.columnas.forEach(function (col) {
      widths.push((col.ancho || 1) + 'fr');
      var ids = col.hitos.filter(function (id) { return index[id] != null; });
      var art = h('canvas', { class: 'poster__art', 'aria-hidden': 'true' });
      arts.push({ canvas: art, name: col.arte });
      var li = h('li', { class: 'poster__col' + (col.tinte ? ' poster__col--' + col.tinte : '') + (ids.length > 1 ? ' poster__col--grupo' : '') });
      if (ids.length === 1) {
        li.appendChild(hitoButton(hitos[index[ids[0]]], index[ids[0]], false, [art]));
      } else {
        var first = index[ids[0]];
        var row = h('span', { class: 'poster__dotzone', 'aria-hidden': 'true' });
        var items = h('ul', { class: 'poster__items' });
        ids.forEach(function (id) {
          var btn = hitoButton(hitos[index[id]], index[id], true);
          row.appendChild(dots[index[id]]);
          items.appendChild(h('li', {}, [btn]));
        });
        li.appendChild(h('div', { class: 'poster__group-head', 'data-first': String(first) }, [art, row,
          h('span', { class: 'poster__fecha', 'aria-hidden': 'true', text: col.fecha || hitos[first].fecha })]));
        li.appendChild(items);
      }
      cols.appendChild(li);
    });
    cols.style.gridTemplateColumns = widths.join(' ');
    var units = era.columnas.reduce(function (sum, c) { return sum + (c.ancho || 1); }, 0);
    var stage = h('div', { class: 'poster__stage', style: '--units: ' + units }, [line, cols]);
    var el = h('section', { class: 'poster__panel poster__panel--' + era.id, 'aria-labelledby': titleId }, [
      head, h('div', { class: 'poster__scroller' }, [stage])
    ]);

    function paintLine() {
      var w = stage.clientWidth, hgt = stage.clientHeight;
      if (!w || !hgt || !E().ink) return;
      var ctx = fitCanvas(line, w, hgt);
      if (!ctx) return;
      var box = stage.getBoundingClientRect();
      var pts = [];
      era.columnas.forEach(function (col) {
        col.hitos.forEach(function (id) {
          var d = dots[index[id]];
          if (!d) return;
          var r = d.getBoundingClientRect();
          pts.push({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
        });
      });
      if (!pts.length) return;
      var last = era.id === 'generativa';
      var x1 = w - (last ? 34 : 10);
      var path = linePoints(pts, { x0: 6, x1: x1, loops: LOOPS[era.id] || [], amp: 16 });
      var ink = E().ink;
      try {
        ink.line(ctx, path, { w: 3.6, profile: 'swell', seed: 's0-line-' + era.id });
        if (last) ink.arrow(ctx, [x1 - 2, pts[pts.length - 1].y, w - 6, pts[pts.length - 1].y], { w: 3.4, headSize: 15, seed: 's0-arrow' });
        else ink.dot(ctx, x1 + 2, pts[pts.length - 1].y, 5, E().palette.mundo.rojo);
      } catch (err) { if (root.console) root.console.warn('[s0] line: ' + err.message); }
    }

    function paint() {
      paintLine();
      arts.forEach(function (a) { paintArt(a.canvas, a.name); });
      paintArt(flourish, 'adorno-' + era.id);
    }
    return { el: el, stage: stage, paint: paint };
  }

  function E() { return EIA.engine || {}; }

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

    // The poster: one panel per era, one column per poster column (see buildPanel)
    var helpId = 's0--ayuda';
    body.appendChild(h('p', { id: helpId, class: 'visually-hidden', text: copy('pistaAyuda') }));
    var dots = [];
    var poster = h('div', { class: 'poster' });
    var panels = D.eras.map(function (era, k) {
      var panel = buildPanel(era, k, hitos, helpId, buttons, dots);
      poster.appendChild(panel.el);
      return panel;
    });
    body.appendChild(poster);

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
      var scroller = btn.closest('.poster__scroller');
      if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
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
        dots[k].classList.toggle('is-selected', on);
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
    poster.addEventListener('click', function (e) {
      var art = e.target.closest && e.target.closest('[data-first]');
      if (art) select(Number(art.getAttribute('data-first')), { play: true, user: true });
    });
    poster.addEventListener('keydown', function (e) {
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
    var ro = null;
    if (typeof root.ResizeObserver === 'function') {
      ro = new root.ResizeObserver(function (entries) {
        entries.forEach(function (en) { panels.forEach(function (p) { if (p.stage === en.target) p.paint(); }); });
      });
      panels.forEach(function (p) { ro.observe(p.stage); });
    } else {
      root.addEventListener('resize', function () { panels.forEach(function (p) { p.paint(); }); });
    }
    return { destroy: function () { setPlayAll(false); player.stop(); if (ro) ro.disconnect(); } };
  }

  ui.lineaTiempo = { mount: mount, sources: sources, clipFor: clipFor, cueAt: cueAt, linePoints: linePoints, hyphenate: hyphenate };
})(typeof window !== 'undefined' ? window : globalThis);
