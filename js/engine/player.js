/* Estado de la IA 2026 — video player (prompt §6 and §7).
 *
 *   var p = EIA.engine.player.create(container, videoId, { chapterPause, interactive, onEnd });
 *     -> { play, pause, toggle, seek(t), time(), duration, chapters, setOption(name, on), destroy, el }
 *   EIA.engine.player.mountRender(videoId, q)    index.html?render=<id>: bare canvas for the tools,
 *       window.renderFrame(t), videoDuration, videoChapters, videoTimeline, renderCanvas,
 *       renderReady (fonts + setup). Linear checkpoints; subtitles unless q.subs === '0';
 *       q.scale sets the backing scale (default 1 = 1280×720); q.t renders that time at once.
 *   EIA.engine.player.info(videoId) -> { id, title, slug, duration, source, chapters } (for the page)
 *   EIA.engine.player.Renderer      the deterministic frame renderer used by both
 *
 * Module contract (contracts §3): EIA.videos[id] = { setup(env), layers?: { [sceneId](env) },
 * scenes: { [sceneId](ctx, s, env) }, drawsWarnings?: { [sceneId]: true } }. The engine adds to `env`: env.scale (backing scale) and
 * env.canvas(w, h) (an offscreen canvas at that scale whose context already draws in logical
 * units). `s` is timeline.state() (prompt §5.6) plus s.layers: what layers[sceneId](env)
 * returned, built lazily and kept in an LRU of current + next scene, the next one prefetched while
 * idle; s.state: what setup(env) returned (as láminas get it); and s.cue(i, needle, kind): where
 * words of line i show in the subtitles, as a share of s.at(i) (see cueFor below). setup runs once
 * per player after the fonts load; modules may also keep results in env.cache.
 *
 * The player draws, over every scene: subtitles, the lettered chapter title, warning stamps for
 * `advertencia` lines, the "Ejemplo ilustrativo" stamp for `ilustrativo` lines, the glossary
 * margin note and the linear checkpoint card. Scene code must not draw those again. One opt-out:
 * a module may declare drawsWarnings: { [sceneId]: true } for a scene whose subject IS the warning
 * stamps (it presses them on the page itself, on the words that name them); the player then
 * skips the corner stamps of that scene's lines, so the same stamp is never shown twice.
 * All chrome text comes from EIA.data.course.ui.player (js/data/course.js). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.engine = EIA.engine || {};
  var doc = root.document;

  var W = 1280, H = 720, FPS = 24;

  // Site root (the folder of index.html), from this script's own URL, so the same code works in
  // index.html and in the dev pages under tools/dev/.
  var SITE_BASE = (function () {
    var src = doc && doc.currentScript && doc.currentScript.src;
    return src ? src.replace(/js\/engine\/player\.js(?:[?#].*)?$/, '') : '';
  })();

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function smooth(x) { return x * x * (3 - 2 * x); }
  function T() { return EIA.engine.timeline; }
  function CAP() { return EIA.engine.captions; }
  function now() { return root.performance ? root.performance.now() : Date.now(); }

  // ---------------------------------------------------------------------------------------------
  // Copy

  function copy() {
    var c = EIA.data && EIA.data.course && EIA.data.course.ui && EIA.data.course.ui.player;
    return c || {};
  }
  function fmt(str, vars) {
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : '';
    });
  }
  function txt(key, vars) {
    var v = copy();
    key.split('.').forEach(function (k) { v = v == null ? v : v[k]; });
    return fmt(v == null ? '' : v, vars);
  }
  function clock(t) {
    return EIA.util && EIA.util.formatClock ? EIA.util.formatClock(t) : String(Math.floor(t));
  }

  function findVideo(id) {
    var list = (EIA.data && EIA.data.videos) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function buildTimeline(video) {
    return T().build(video, { manifest: (EIA.audioManifest || {})[video.id] });
  }

  function info(id) {
    var video = findVideo(id);
    if (!video) return null;
    var tl = buildTimeline(video);
    return {
      id: video.id, title: video.title, slug: tl.slug, duration: tl.duration, source: tl.source,
      chapters: tl.chapters.map(function (c) { return { index: c.index, title: c.title, start: c.start, end: c.end }; })
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Fonts: canvas text must not be drawn with a fallback font (frames would not be deterministic).

  var fontsPromise = null;
  function fontsReady() {
    if (fontsPromise) return fontsPromise;
    var fonts = doc && doc.fonts;
    if (!fonts || typeof fonts.load !== 'function') return (fontsPromise = Promise.resolve());
    var specs = ['400 34px "EIA Sans"', '700 34px "EIA Sans"', 'italic 400 28px "EIA Sans"',
      '700 30px "EIA Display"', '900 30px "EIA Display"'];
    fontsPromise = Promise.all(specs.map(function (s) {
      return fonts.load(s).catch(function () { return null; });
    })).then(function () { return fonts.ready; }).then(function () {}, function () {});
    return fontsPromise;
  }

  // ---------------------------------------------------------------------------------------------
  // Environment

  function makeCanvas(w, h, scale) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * scale));
    c.height = Math.max(1, Math.ceil(h * scale));
    c.getContext('2d').setTransform(scale, 0, 0, scale, 0, 0);
    c.logicalWidth = w;
    c.logicalHeight = h;
    return c;
  }

  function makeEnv(id, scale) {
    var env = EIA.makeEnv ? EIA.makeEnv({ id: id }) : { W: W, H: H, id: id, cache: new Map() };
    env.scale = scale;
    env.canvas = function (w, h) { return makeCanvas(w || W, h || H, env.scale); };
    return env;
  }

  // A view of `env` at another scale that shares its setup cache (scrubber previews).
  function scaledEnv(env, scale) {
    var view = Object.create(env);
    view.scale = scale;
    view.canvas = function (w, h) { return makeCanvas(w || W, h || H, view.scale); };
    return view;
  }

  // ---------------------------------------------------------------------------------------------
  // Layers: lazy per scene, LRU of current + next scene.

  function LayerCache(renderer, capacity) {
    this.r = renderer;
    this.capacity = capacity;
    this.map = new Map();
  }
  LayerCache.prototype.get = function (si) {
    var map = this.map;
    if (map.has(si)) {
      var hit = map.get(si);
      map.delete(si);
      map.set(si, hit);
      return hit;
    }
    var built = this.build(si);
    map.set(si, built);
    while (map.size > this.capacity) map.delete(map.keys().next().value);
    return built;
  };
  LayerCache.prototype.build = function (si) {
    var r = this.r;
    var seg = r.tl.scenes[si];
    var fn = r.mod && r.mod.layers && r.mod.layers[seg.id];
    if (typeof fn !== 'function') return null;
    try {
      return fn(r.env);
    } catch (err) {
      r.report('layers:' + seg.id, err);
      return null;
    }
  };
  LayerCache.prototype.prefetch = function (si) {
    if (si >= 0 && si < this.r.tl.scenes.length && !this.map.has(si)) this.get(si);
  };
  LayerCache.prototype.clear = function () { this.map.clear(); };

  // ---------------------------------------------------------------------------------------------
  // Overlays drawn over the scenes. Engine functions (tags.*) draw them once T04 is merged; each
  // fallback is plain canvas.

  function veil(ctx, alpha, color) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Warning stamps press into the top-right corner for 3 s (tags.warningStamp: center anchor; its
  // text is 0.072 × size, so the stamp is large enough to read on a projected video).
  var WARNING_SIZE = 168, WARNING_GAP = 14, MARGIN = 26;

  function drawWarning(ctx, env, w, local) {
    var C = T().C;
    var cx = W - MARGIN - WARNING_SIZE / 2 - w.slot * (WARNING_SIZE + WARNING_GAP);
    var cy = MARGIN + WARNING_SIZE / 2;
    ctx.save();
    ctx.globalAlpha = clamp01((C.WARNING - local) / 0.45);
    env.tags.warningStamp(ctx, w.n, cx, cy, WARNING_SIZE, clamp01(local / 1.2));
    ctx.restore();
  }

  // "Ejemplo ilustrativo" for the whole beat of an `ilustrativo` line, top-right (left of any
  // warning stamp pressed at the same time). tags.illustrativeStamp is top-left anchored and, at
  // p = 0, only returns its box.
  var STAMP_SCALE = 1.25;

  function drawIllustrative(ctx, env, local, dur, slots) {
    var box = env.tags.illustrativeStamp(ctx, 0, 0, STAMP_SCALE, 0);
    var right = W - MARGIN - slots * (WARNING_SIZE + WARNING_GAP);
    ctx.save();
    ctx.globalAlpha = clamp01(Math.min(local / 0.2, (dur - local) / 0.3));
    env.tags.illustrativeStamp(ctx, right - box.w, MARGIN + 8, STAMP_SCALE, clamp01(local / 0.6));
    ctx.restore();
  }

  // Glossary margin note: the term and its KB definition, verbatim, for the line that first uses it.
  var NOTE_W = 360, NOTE_TOP = MARGIN + WARNING_SIZE + 20;

  function drawGlossary(ctx, env, entry, local, dur) {
    ctx.save();
    ctx.globalAlpha = clamp01(Math.min(local / 0.25, (dur - local) / 0.3));
    env.tags.marginNote(ctx, entry.termino, entry.definicion, W - MARGIN - NOTE_W, NOTE_TOP, NOTE_W,
      clamp01(local / 0.8), { scale: 1.2, sign: 'libreta' });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------------------
  // Renderer: one deterministic frame for any t (renderFrame, playback, previews, recording).

  function Renderer(video, tl, opts) {
    opts = opts || {};
    this.video = video;
    this.tl = tl;
    this.mod = (EIA.videos || {})[video.id] || null;
    this.scale = opts.scale || 1;
    this.env = opts.env || makeEnv(video.id, this.scale);
    this.linear = opts.linear !== false;
    this.subtitles = opts.subtitles !== false;
    this.layers = new LayerCache(this, opts.layerCapacity || 2);
    this.states = [];
    this.buffer = null;
    this.reported = {};
    this.cue = {};
    this.cf = {};
    this.isReady = false;
  }

  Renderer.prototype.report = function (key, err) {
    if (this.reported[key]) return;
    this.reported[key] = true;
    if (root.console) console.error('[player] ' + this.video.id + ' · ' + key + ':', err);
  };

  Renderer.prototype.setup = function () {
    if (this.isReady) return;
    this.isReady = true;
    var mod = this.mod, cache = this.env.cache;
    if (!mod || typeof mod.setup !== 'function' || !cache || cache.has('setup:done')) return;
    cache.set('setup:done', true);
    try {
      var result = mod.setup(this.env);
      if (result !== undefined) cache.set('setup', result);
    } catch (err) {
      this.report('setup', err);
    }
  };

  Renderer.prototype.setScale = function (scale) {
    if (scale === this.scale) return;
    this.scale = scale;
    this.env.scale = scale;
    this.layers.clear();
    this.buffer = null;
  };

  Renderer.prototype.bufferFor = function (canvas) {
    var b = this.buffer;
    if (!b || b.canvas.width !== canvas.width || b.canvas.height !== canvas.height) {
      var c = doc.createElement('canvas');
      c.width = canvas.width;
      c.height = canvas.height;
      b = this.buffer = c.getContext('2d');
    }
    return b;
  };

  // flags: { overlays: false } draws the scenes only (poster, previews).
  Renderer.prototype.render = function (ctx, t, flags) {
    var tl = this.tl;
    t = t <= 0 ? 0 : t >= tl.duration ? tl.duration : t;
    var s = this.scale;
    var overlays = !(flags && flags.overlays === false);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    var cf = tl.crossfadeAt(t, this.cf);
    if (cf) {
      this.drawSegment(ctx, tl.segments[cf.from], t);
      var b = this.bufferFor(ctx.canvas);
      b.setTransform(s, 0, 0, s, 0, 0);
      b.globalAlpha = 1;
      this.drawSegment(b, tl.segments[cf.to], t);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = smooth(cf.x);
      ctx.drawImage(b.canvas, 0, 0);
      ctx.restore();
    } else {
      this.drawSegment(ctx, tl.segmentAt(t), t);
    }
    if (overlays) {
      this.drawOverlays(ctx, t);
      var endIn = tl.duration - t;
      if (endIn < 1) veil(ctx, 0.35 * (1 - endIn), CAP().colors(this.env).tinta);
    }
  };

  Renderer.prototype.drawSegment = function (ctx, seg, t) {
    if (seg.kind === 'scene') {
      this.drawScene(ctx, seg.scene, t - seg.start);
      return;
    }
    var scene = this.tl.segments[seg.afterSegment];
    this.drawScene(ctx, scene.scene, scene.dur);   // the scene it follows, held on its last frame
    if (!this.linear) return;                       // interactive: the HTML card goes on top
    var local = t - seg.start;
    veil(ctx, 0.45 * clamp01(local / 0.3), CAP().colors(this.env).tinta);
    CAP().drawCheckpoint(ctx, seg.data, local, { env: this.env, copy: copy().checkpoint || {}, dur: seg.dur });
  };

  /* s.cue(i, needle, kind) -> share (0..1) of line i at which `needle` (words of its text) shows
   * in the subtitles: 'chunk' = when the subtitle chunk holding it appears, 'word' (default) =
   * where the words fall inside that chunk, by characters; null when the line does not contain
   * them. It reads the timeline's chunk times — the audio manifest's when it has them, else the
   * same character-count estimate the subtitles use — so beats keyed to it follow the voice when
   * it is regenerated. Pure; results are memoized per scene. Example: a number lands by
   * s.cue(1, '66,3%', 'chunk') of s.at(1) and holds. */
  function cueFor(seg) {
    var memo = new Map();
    return function (i, needle, kind) {
      var key = i + '\u0001' + needle + '\u0001' + (kind || 'word');
      if (memo.has(key)) return memo.get(key);
      var L = seg.lines[i], out = null;
      var text = L ? L.text || '' : '', at = needle ? text.indexOf(needle) : -1, dur = L ? L.end - L.start : 0;
      if (at >= 0 && dur > 0) {
        var chunks = L.chunks || [], from = 0;
        for (var k = 0; k < chunks.length && out == null; k++) {
          var ct = chunks[k].text || '', cat = text.indexOf(ct, from);
          if (!ct || cat < 0) continue;
          from = cat + ct.length;
          if (at >= cat && at < cat + ct.length) {
            var c = chunks[k];
            var t = kind === 'chunk' ? c.start : c.start + (c.end - c.start) * (at - cat) / ct.length;
            out = clamp01((t - L.start) / dur);
          }
        }
        if (out == null) out = clamp01(at / text.length);
      }
      memo.set(key, out);
      return out;
    };
  }

  Renderer.prototype.drawScene = function (ctx, si, localT) {
    var seg = this.tl.scenes[si];
    var s = this.states[si] = this.tl.state(si, localT, this.states[si]);
    if (!s.cue) s.cue = cueFor(seg);
    s.layers = this.layers.get(si);
    s.state = this.env.cache ? this.env.cache.get('setup') : undefined;
    var fn = this.mod && this.mod.scenes && this.mod.scenes[seg.id];
    ctx.save();
    ctx.fillStyle = CAP().colors(this.env).lienzo;
    ctx.fillRect(0, 0, W, H);
    if (typeof fn === 'function') {
      try {
        fn(ctx, s, this.env);
      } catch (err) {
        this.report(seg.id, err);
        ctx.restore();
        ctx.save();
        this.placeholder(ctx, seg);
      }
    } else {
      this.placeholder(ctx, seg);
    }
    ctx.restore();
  };

  // A notebook page with the scene's description and copy, until its module draws it.
  Renderer.prototype.placeholder = function (ctx, seg) {
    var cap = CAP();
    var col = cap.colors(this.env);
    ctx.fillStyle = col.lienzo;
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(28, 63, 149, 0.12)';
    ctx.beginPath();
    for (var y = 100; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(215, 38, 30, 0.3)';
    ctx.beginPath();
    ctx.moveTo(120, 0); ctx.lineTo(120, H);
    ctx.stroke();
    ctx.fillStyle = col.tinta;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = cap.font(22, 700);
    ctx.fillText(txt('escenaPendiente') + ' · ' + seg.id, 150, 88);
    var f = cap.font(28, 400, null, 'italic');
    ctx.font = f;
    var lines = cap.layout(ctx, seg.seVe || '', f, 1000);
    lines.slice(0, 6).forEach(function (line, i) { ctx.fillText(line, 150, 152 + i * 40); });
    var rot = seg.rotulos || {};
    ctx.font = cap.font(22, 700);
    Object.keys(rot).slice(0, 5).forEach(function (k, i) {
      var text = rot[k] && rot[k].text;
      if (text) ctx.fillText('«' + String(text).slice(0, 80) + '»', 150, 152 + (Math.min(6, lines.length) + 1 + i) * 40);
    });
  };

  Renderer.prototype.drawOverlays = function (ctx, t) {
    var ov = this.tl.overlays, env = this.env, i, slots = 0;
    var own = this.mod && this.mod.drawsWarnings;
    for (i = 0; i < ov.warnings.length; i++) {
      var w = ov.warnings[i];
      if (own && own[this.tl.lines[w.line].sceneId]) continue;   // the scene presses them itself
      if (t >= w.start && t < w.end) {
        drawWarning(ctx, env, w, t - w.start);
        slots = Math.max(slots, w.slot + 1);
      }
    }
    for (i = 0; i < ov.illustrative.length; i++) {
      var il = ov.illustrative[i];
      if (t >= il.start && t < il.end) { drawIllustrative(ctx, env, t - il.start, il.end - il.start, slots); break; }
    }
    for (i = 0; i < ov.glossary.length; i++) {
      var g = ov.glossary[i];
      if (t >= g.start && t < g.end) { drawGlossary(ctx, env, g.entry, t - g.start, g.end - g.start); break; }
    }
    for (i = 0; i < ov.chapterTitles.length; i++) {
      var c = ov.chapterTitles[i];
      if (t >= c.start && t < c.end) { CAP().drawChapterTitle(ctx, c.title, t - c.start, { env: env }); break; }
    }
    if (this.subtitles) {
      var cue = CAP().cueAt(this.tl, t, this.cue);
      if (cue) CAP().drawSubtitle(ctx, cue, { env: env });
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Render mode: index.html?render=<id>

  function mountRender(id, q) {
    q = q || {};
    var body = doc.body;
    body.innerHTML = '';
    body.style.margin = '0';
    body.style.background = '#F4EEDF';
    var video = findVideo(id);
    if (!video) {
      root.renderError = 'Unknown video: ' + id;
      root.renderReady = Promise.resolve(false);
      body.textContent = txt('error');
      if (root.console) console.warn('[player] ' + root.renderError);
      return;
    }
    var tl;
    try {
      tl = buildTimeline(video);
    } catch (err) {
      root.renderError = String(err && err.message || err);
      root.renderReady = Promise.resolve(false);
      if (root.console) console.error('[player]', err);
      return;
    }
    var scale = clamp(Number(q.scale) || 1, 0.25, 3);
    var canvas = doc.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    canvas.style.display = 'block';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', fmt(txt('region'), { titulo: video.title }));
    body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var r = new Renderer(video, tl, { scale: scale, linear: true, subtitles: q.subs !== '0' });
    root.videoDuration = tl.duration;
    root.videoChapters = tl.chapters.map(function (c) {
      return { index: c.index, title: c.title, from: c.from, start: c.start, end: c.end };
    });
    root.videoTimeline = tl;
    root.renderCanvas = canvas;
    root.renderFrame = function (t) {
      r.render(ctx, Number(t) || 0);
      return true;
    };
    root.renderReady = fontsReady().then(function () {
      r.setup();
      root.renderFrame(q.t != null && q.t !== '' ? Number(q.t) : 0);
      return true;
    });
  }

  // ---------------------------------------------------------------------------------------------
  // DOM helpers

  function h(tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c != null) node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    });
    return node;
  }

  // Hand-drawn icons on small canvases (no image or icon files).
  function drawIcon(canvas, kind) {
    var size = Number(canvas.getAttribute('data-size')) || 24;
    var dpr = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    var g = canvas.getContext('2d');
    g.setTransform(dpr * size, 0, 0, dpr * size, 0, 0);
    g.clearRect(0, 0, 1, 1);
    var color = '#15120F';
    try { color = root.getComputedStyle(canvas.parentNode).color || color; } catch (err) { /* default ink */ }
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineWidth = 0.09;
    if (kind === 'play') {
      g.beginPath();
      g.moveTo(0.3, 0.2);
      g.quadraticCurveTo(0.58, 0.33, 0.82, 0.5);
      g.quadraticCurveTo(0.56, 0.69, 0.31, 0.81);
      g.quadraticCurveTo(0.27, 0.5, 0.3, 0.2);
      g.closePath();
      g.fill();
      g.stroke();
    } else if (kind === 'pause') {
      g.lineWidth = 0.17;
      g.beginPath();
      g.moveTo(0.34, 0.22); g.lineTo(0.33, 0.78);
      g.moveTo(0.67, 0.23); g.lineTo(0.68, 0.77);
      g.stroke();
    } else if (kind === 'replay') {
      g.beginPath();
      g.arc(0.5, 0.52, 0.3, -Math.PI * 0.35, Math.PI * 1.45);
      g.stroke();
      g.beginPath();
      g.moveTo(0.68, 0.08); g.lineTo(0.8, 0.3); g.lineTo(0.56, 0.33);
      g.closePath();
      g.fill();
    } else if (kind === 'star' || kind === 'spiral') {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);    // engine signs draw in pixels
      CAP().drawSign(g, kind === 'star' ? 'estrella-exito' : 'espiral', size / 2, size / 2, size * 0.92, { seed: 'feedback' });
    }
  }

  function iconCanvas(kind, size) {
    var c = h('canvas', { class: 'player__icon', 'data-size': size || 24, 'data-icon': kind, 'aria-hidden': 'true' });
    return c;
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      if (root.navigator && root.navigator.clipboard && root.isSecureContext) {
        root.navigator.clipboard.writeText(text).then(resolve, function () { legacy() ? resolve() : reject(); });
      } else if (legacy()) resolve();
      else reject();
      function legacy() {
        var ta = h('textarea', { readonly: true, class: 'player__sr' });
        ta.value = text;
        doc.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        return ok;
      }
    });
  }

  // ---------------------------------------------------------------------------------------------
  // Interactive player

  var players = [];
  var activePlayer = null;
  var uidCounter = 0;
  var PREFS_KEY = 'player:prefs';

  function store() {
    return (EIA.util && EIA.util.store) || { get: function (k, d) { return d; }, set: function () {}, remove: function () {} };
  }

  function errorBox(container, message) {
    var box = h('div', { class: 'player player--error', role: 'status' }, [h('p', { text: message })]);
    container.appendChild(box);
    var noop = function () {};
    return { play: noop, pause: noop, toggle: noop, seek: noop, time: function () { return 0; }, duration: 0, chapters: [], setOption: noop, destroy: function () { box.remove(); }, el: box };
  }

  function create(container, videoId, opts) {
    opts = opts || {};
    var video = findVideo(videoId);
    if (!video) {
      if (root.console) console.warn('[player] unknown video: ' + videoId);
      return errorBox(container, txt('error'));
    }
    var tl;
    try {
      tl = buildTimeline(video);
    } catch (err) {
      if (root.console) console.error('[player]', err);
      return errorBox(container, txt('error'));
    }

    var prefs = store().get(PREFS_KEY, {}) || {};
    var st = {
      t: 0, lastT: 0, started: false, ended: false, overlay: '',
      interactive: opts.interactive != null ? !!opts.interactive : prefs.interactive !== false,
      chapterPause: !!opts.chapterPause,
      subtitles: prefs.subs !== false,
      voice: prefs.voice !== false,
      rate: prefs.rate === 0.75 ? 0.75 : 1,
      scale: 0, dirty: true, lastFrame: -1, raf: 0,
      initialized: false, initPromise: null, destroyed: false,
      recording: null, cpSeg: null, scene: -1, chapter: -1, second: -1, lastUi: 0, lastAria: 0, lastSave: 0,
      prefetched: -1
    };
    var uid = 'player-' + (++uidCounter);
    var renderer = null, preview = null, narrator = null, ctx = null;
    var stats = opts.stats ? { times: [], drops: 0, last: -1 } : null;
    var api;

    // --- DOM -------------------------------------------------------------------------------------
    var rootEl = h('div', { class: 'player', 'data-video': video.id, 'data-state': 'idle' });
    var frameEl = h('div', { class: 'player__frame' });
    var chaptersEl = h('div', { class: 'player__chapters', role: 'group', 'aria-label': txt('capitulos') });
    var chapterButtons = tl.chapters.map(function (ch) {
      var b = h('button', {
        type: 'button', class: 'player__chapter',
        'aria-label': txt('capituloAria', { n: ch.index + 1, titulo: ch.title }),
        text: txt('capituloBoton', { n: ch.index + 1, titulo: ch.title }),
        onclick: function () { seek(ch.start); play(); }
      });
      chaptersEl.appendChild(b);
      return b;
    });

    var canvas = h('canvas', { class: 'player__canvas', role: 'img', 'aria-label': fmt(txt('lienzo'), { titulo: video.title, escena: '' }) });
    ctx = canvas.getContext('2d');
    var hintEl = h('p', { id: uid + '-hint', class: 'visually-hidden player__sr', text: txt('atajos') });
    var stage = h('div', {
      class: 'player__stage', tabindex: '0', role: 'group',
      'aria-label': txt('region', { titulo: video.title }), 'aria-describedby': uid + '-hint'
    });
    var loadingEl = h('p', { class: 'player__loading', text: txt('cargando') });

    var bigPlay = h('button', {
      type: 'button', class: 'player__big-play', 'aria-label': txt('reproducirVideo', { titulo: video.title }),
      onclick: function () { seek(0); play(); }
    }, [iconCanvas('play', 44)]);
    var resumeBox = h('div', { class: 'player__resume', hidden: true });
    var posterEl = h('div', { class: 'player__poster' }, [bigPlay, resumeBox]);

    var cardEl = h('div', { class: 'player__card', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': uid + '-cpk', hidden: true });
    var chapterEndEl = h('div', { class: 'player__chapter-end', hidden: true });
    var endEl = h('div', { class: 'player__end', hidden: true }, [
      h('button', {
        type: 'button', class: 'player__replay',
        onclick: function () { seek(0); play(); }
      }, [iconCanvas('replay', 30), h('span', { text: txt('verDeNuevo') })])
    ]);
    stage.appendChild(canvas);
    stage.appendChild(loadingEl);
    stage.appendChild(posterEl);
    stage.appendChild(cardEl);
    stage.appendChild(chapterEndEl);
    stage.appendChild(endEl);

    // controls
    var playBtn = h('button', { type: 'button', class: 'player__btn player__play', 'aria-label': txt('reproducir'), onclick: function () { toggle(); } }, [iconCanvas('play', 22)]);
    var fillEl = h('div', { class: 'player__fill' });
    var thumbEl = h('div', { class: 'player__thumb' });
    var trackEl = h('div', { class: 'player__track' }, [fillEl]);
    var previewCanvas = h('canvas', { class: 'player__preview-frame', width: 256, height: 144, 'aria-hidden': 'true' });
    var previewLabel = h('span', { class: 'player__preview-label' });
    var previewEl = h('div', { class: 'player__preview', hidden: true, 'aria-hidden': 'true' }, [previewCanvas, previewLabel]);
    var scrub = h('div', {
      class: 'player__scrub', role: 'slider', tabindex: '0', 'aria-label': txt('barra'),
      'aria-valuemin': '0', 'aria-valuemax': String(Math.round(tl.duration)), 'aria-valuenow': '0'
    }, [trackEl, thumbEl, previewEl]);
    tl.chapters.forEach(function (ch) {
      if (ch.index === 0) return;
      trackEl.appendChild(h('span', { class: 'player__tick player__tick--chapter', style: 'left:' + pct(ch.start), title: txt('capituloBoton', { n: ch.index + 1, titulo: ch.title }) },
        [h('span', { class: 'player__tick-label', text: String(ch.index + 1) })]));
    });
    tl.scenes.forEach(function (s) {
      if (s.index === 0) return;
      trackEl.appendChild(h('span', { class: 'player__tick player__tick--scene', style: 'left:' + pct(s.start) }));
    });
    tl.checkpoints.forEach(function (c) {
      trackEl.appendChild(h('span', { class: 'player__tick player__tick--checkpoint', style: 'left:' + pct(c.start) + ';width:' + pct(c.dur) }));
    });
    var timeEl = h('span', { class: 'player__time', 'aria-hidden': 'true', text: txt('tiempo', { actual: clock(0), total: clock(tl.duration) }) });

    function toggleButton(label, pressed, onToggle) {
      var b = h('button', { type: 'button', class: 'player__toggle', 'aria-pressed': pressed ? 'true' : 'false', text: label });
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        onToggle(on);
      });
      return b;
    }
    var subsBtn = toggleButton(txt('subtitulos'), st.subtitles, function (on) { setOption('subtitulos', on); });
    var voiceBtn = toggleButton(txt('voz'), st.voice, function (on) { setOption('voz', on); });
    var slowBtn = h('button', { type: 'button', class: 'player__toggle', 'aria-pressed': st.rate === 0.75 ? 'true' : 'false', 'aria-label': txt('velocidadAria', { valor: txt('velocidadLenta') }), text: txt('velocidadLenta'), onclick: function () { setRate(0.75); } });
    var normalBtn = h('button', { type: 'button', class: 'player__toggle', 'aria-pressed': st.rate === 1 ? 'true' : 'false', 'aria-label': txt('velocidadAria', { valor: txt('velocidadNormal') }), text: txt('velocidadNormal'), onclick: function () { setRate(1); } });
    var speedEl = h('span', { class: 'player__speed', role: 'group', 'aria-label': txt('velocidad') }, [h('span', { class: 'player__speed-label', 'aria-hidden': 'true', text: txt('velocidad') }), slowBtn, normalBtn]);
    var interBtn = toggleButton(txt('preguntasInteractivas'), st.interactive, function (on) { setOption('preguntas', on); });
    var chapBtn = toggleButton(txt('pausarCapitulo'), st.chapterPause, function (on) { setOption('capitulos', on); });
    var fullBtn = h('button', { type: 'button', class: 'player__toggle player__full', text: txt('pantallaCompleta'), onclick: function () { toggleFullscreen(); } });
    var noteEl = h('span', { class: 'player__note', hidden: true });
    var controls = h('div', { class: 'player__controls' }, [
      h('div', { class: 'player__bar' }, [playBtn, scrub, timeEl]),
      h('div', { class: 'player__options', role: 'group', 'aria-label': txt('opciones') }, [subsBtn, voiceBtn, speedEl, interBtn, chapBtn, fullBtn, noteEl])
    ]);
    frameEl.appendChild(chaptersEl);
    frameEl.appendChild(stage);
    frameEl.appendChild(controls);
    var liveEl = h('p', { class: 'visually-hidden player__sr', 'aria-live': 'polite' });

    var panels = h('div', { class: 'player__panels' });
    var transcriptPanel = panel(txt('transcripcion'), buildTranscript());
    var sourcesPanel = panel(txt('fuentes'), buildSources());
    panels.appendChild(transcriptPanel);
    panels.appendChild(sourcesPanel);
    if ((video.laminas || []).length) panels.appendChild(panel(txt('laminas'), buildLaminas()));
    var downloadBody = h('div', { class: 'player__download' });
    var downloadPanel = panel(txt('descarga.titulo'), downloadBody);
    var recorderUi = null;
    downloadPanel.addEventListener('toggle', function () {
      if (downloadPanel.open && !recorderUi && EIA.engine.recorder) recorderUi = EIA.engine.recorder.mount(downloadBody, host());
    });
    panels.appendChild(downloadPanel);

    rootEl.appendChild(frameEl);
    rootEl.appendChild(hintEl);
    rootEl.appendChild(liveEl);
    rootEl.appendChild(panels);
    container.appendChild(rootEl);
    rootEl.querySelectorAll('canvas.player__icon').forEach(function (c) { drawIcon(c, c.getAttribute('data-icon')); });

    function pct(t) { return (tl.duration > 0 ? (t / tl.duration) * 100 : 0).toFixed(3) + '%'; }
    function panel(title, body) {
      return h('details', { class: 'player__panel' }, [h('summary', { text: title }), body]);
    }
    function announce(text) {
      liveEl.textContent = '';
      setTimeout(function () { liveEl.textContent = text; }, 30);
    }

    // --- transcript, sources, láminas ---------------------------------------------------------
    function sourceNote(ids) {
      var p = h('p', { class: 'player__tsource' }, [txt('fuenteLinea') + ' ']);
      var first = true;
      ids.forEach(function (id) {
        var c;
        try { c = EIA.cifra(id); } catch (err) { return; }
        if (!first) p.appendChild(doc.createTextNode('; '));
        first = false;
        p.appendChild(c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener', text: c.etiqueta }) : doc.createTextNode(c.etiqueta));
      });
      return first ? null : p;
    }

    function buildTranscript() {
      var box = h('div', { class: 'player__transcript' });
      tl.chapters.forEach(function (ch) {
        var section = h('section', { class: 'player__tchapter' }, [h('h3', { text: txt('capituloBoton', { n: ch.index + 1, titulo: ch.title }) })]);
        tl.segments.forEach(function (seg) {
          if (seg.chapter !== ch.index) return;
          if (seg.kind === 'scene') {
            var sc = h('div', { class: 'player__tscene' }, [
              h('h4', { text: txt('escena', { n: seg.scene + 1 }) }),
              seg.seVe ? h('p', { class: 'player__tseve', text: seg.seVe }) : null
            ]);
            seg.lines.forEach(function (line) {
              sc.appendChild(h('p', { class: 'player__tline player__tline--' + line.voice }, [
                h('button', { type: 'button', class: 'player__tstamp', 'aria-label': txt('irA', { tiempo: clock(line.start) }), text: clock(line.start), onclick: function () { seek(line.start); } }),
                ' ',
                h('strong', { text: txt(line.voice) + ':' }),
                ' ' + line.text
              ]));
              var note = line.cifras.length ? sourceNote(line.cifras) : null;
              if (note) sc.appendChild(note);
              if (line.ilustrativo) sc.appendChild(h('p', { class: 'player__tsource', text: txt('ilustrativo') }));
            });
            section.appendChild(sc);
          } else {
            var cp = seg.data;
            var right = cp.options[cp.answer];
            var cpBox = h('div', { class: 'player__tcheck' }, [
              h('p', {}, [h('strong', { text: txt('pregunta') + ': ' }), cp.question]),
              h('ul', {}, cp.options.map(function (o) { return h('li', { text: o }); })),
              h('p', { text: txt('respuesta', { opcion: right }) + (cp.explain ? ' — ' + cp.explain : '') })
            ]);
            var note = cp.cifras && cp.cifras.length ? sourceNote(cp.cifras) : null;
            if (note) cpBox.appendChild(note);
            if (cp.ilustrativo) cpBox.appendChild(h('p', { class: 'player__tsource', text: txt('ilustrativo') }));
            section.appendChild(cpBox);
          }
        });
        box.appendChild(section);
      });
      return box;
    }

    function figureIds() {
      var ids = [], seen = {};
      function add(list) { (list || []).forEach(function (id) { if (!seen[id]) { seen[id] = true; ids.push(id); } }); }
      tl.segments.forEach(function (seg) {
        if (seg.kind === 'scene') {
          seg.lines.forEach(function (l) { add(l.cifras); });
          var rot = seg.rotulos || {};
          Object.keys(rot).forEach(function (k) { add(rot[k] && rot[k].cifras); });
        } else add(seg.data.cifras);
      });
      return ids;
    }

    function buildSources() {
      var ids = figureIds();
      var list = h('ul', { class: 'player__sources' });
      ids.forEach(function (id) {
        var c;
        try { c = EIA.cifra(id); } catch (err) {
          if (root.console) console.warn('[player] ' + video.id + ': ' + (err && err.message));
          return;
        }
        var meta = h('p', { class: 'player__source-meta' });
        if (c.clase !== 'ninguno') {
          if (EIA.ui.chipHTML) meta.appendChild(h('span', { class: 'player__chip' })).innerHTML = EIA.ui.chipHTML(c.clase, c.tipo);
          else meta.appendChild(h('span', { class: 'chip chip--' + c.clase, text: txt('tipoEvidencia') + ' ' + c.tipo }));
        }
        if (c.estado) {
          if (EIA.ui.estadoHTML) meta.appendChild(h('span', { class: 'player__estado' })).innerHTML = EIA.ui.estadoHTML(c.estado);
          else meta.appendChild(h('span', { class: 'estado estado--' + c.estadoKey, text: txt('estado') + ' ' + c.estado }));
        }
        var links = h('p', { class: 'player__source-links' });
        c.fuentesList.forEach(function (f, i) {
          if (i) links.appendChild(doc.createTextNode(' · '));
          links.appendChild(h('a', { href: f.url, target: '_blank', rel: 'noopener', 'aria-label': txt('enlaceFuente', { fuente: f.etiqueta }), text: f.etiqueta }));
        });
        var copyBtn = h('button', { type: 'button', class: 'btn player__copy', text: txt('copiarCita') });
        copyBtn.addEventListener('click', function () {
          var text = EIA.util.citation(id);
          var viaUi = EIA.ui && typeof EIA.ui.copy === 'function';
          (viaUi ? EIA.ui.copy(text) : fallbackCopy(text)).then(function () {
            copyBtn.textContent = txt('copiado');
            if (!viaUi) announce(txt('copiado'));
            setTimeout(function () { copyBtn.textContent = txt('copiarCita'); }, 2000);
          }, function () { announce(txt('noCopiado')); });
        });
        list.appendChild(h('li', { class: 'player__source' }, [
          h('p', { class: 'player__source-cifra', text: c.cifra }),
          c.alcanceTexto ? h('p', { class: 'player__source-alcance', text: c.alcanceTexto }) : null,
          meta, links, copyBtn
        ]));
      });
      if (!list.children.length) return h('p', { text: txt('fuentesVacio') });
      return list;
    }

    function buildLaminas() {
      var list = h('ul', { class: 'player__laminas' });
      (video.laminas || []).forEach(function (id) {
        var deck = (EIA.data.deck || []).filter(function (d) { return d.id === id; })[0];
        var n = deck ? deck.n : parseInt(String(id).replace(/\D/g, ''), 10);
        var titulo = deck ? deck.titulo : id;
        var link = h('a', {
          class: 'btn player__lamina', href: SITE_BASE + 'index.html?lamina=' + id, target: '_blank', rel: 'noopener',
          'aria-label': txt('abrirLamina', { n: n, titulo: titulo }), text: txt('lamina', { n: n, titulo: titulo })
        });
        link.addEventListener('click', function (e) {
          if (EIA.ui && typeof EIA.ui.openLamina === 'function') {
            e.preventDefault();
            pause();
            EIA.ui.openLamina(id);
          }
        });
        list.appendChild(h('li', {}, [link]));
      });
      return list;
    }

    // --- init ------------------------------------------------------------------------------------
    function init() {
      if (st.initPromise) return st.initPromise;
      st.initPromise = fontsReady().then(function () {
        if (st.destroyed) return;
        renderer = new Renderer(video, tl, { scale: 1, linear: !st.interactive, subtitles: st.subtitles });
        resize();
        renderer.setup();
        narrator = EIA.engine.narrator.create(tl, { videoId: video.id, base: SITE_BASE, rate: st.rate, voice: st.voice });
        narrator.onchange = updateNote;
        narrator.ready.then(updateNote);
        st.initialized = true;
        loadingEl.hidden = true;
        offerResume();
        requestRender();
      });
      return st.initPromise;
    }

    function updateNote() {
      var mode = narrator && narrator.mode;
      noteEl.hidden = !(mode === 'browser' || mode === 'silent');
      noteEl.textContent = mode === 'browser' ? txt('vozNavegador') : mode === 'silent' ? txt('sinVoz') : '';
    }

    function offerResume() {
      var saved = store().get('player:' + video.id, null);
      var t = saved && Number(saved.t);
      resumeBox.innerHTML = '';
      if (!(t >= 5 && t < tl.duration - 5)) { resumeBox.hidden = true; bigPlay.hidden = false; return; }
      resumeBox.appendChild(h('button', { type: 'button', class: 'btn btn--primary', text: txt('continuarDonde', { tiempo: clock(t) }), onclick: function () { seek(t); play(); } }));
      resumeBox.appendChild(h('button', { type: 'button', class: 'btn', text: txt('desdeInicio'), onclick: function () { seek(0); play(); } }));
      resumeBox.hidden = false;
      bigPlay.hidden = true;
    }

    function resize() {
      if (!renderer) return;
      var rect = stage.getBoundingClientRect();
      var dpr = Math.min(2, root.devicePixelRatio || 1);
      var scale = st.recording ? 1 : clamp(Math.round(((rect.width || 640) * dpr / W) * 100) / 100, 0.25, 2);
      if (scale === st.scale) return;
      st.scale = scale;
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
      renderer.setScale(scale);
      requestRender();
    }

    // --- loop ------------------------------------------------------------------------------------
    function schedule() {
      if (!st.raf && !st.destroyed) st.raf = root.requestAnimationFrame(frame);
    }
    function requestRender() {
      st.dirty = true;
      schedule();
    }

    function frame(ms) {
      st.raf = 0;
      if (!st.initialized || st.destroyed) return;
      var t = narrator.tick(ms);
      if (narrator.playing) t = crossings(st.lastT, t);
      st.t = t;
      var shown = st.started ? t : tl.posterTime();
      var tq = Math.floor(shown * FPS + 1e-6) / FPS;
      if (st.dirty || tq !== st.lastFrame) {
        var t0 = stats ? now() : 0;
        renderer.render(ctx, st.started ? tq : shown, st.started ? null : { overlays: false });
        if (stats) record(now() - t0, tq);
        st.lastFrame = tq;
        st.dirty = false;
        afterRender(tq);
      }
      updateUi(t, ms);
      st.lastT = t;
      if (narrator.playing) schedule();
    }

    function record(ms, tq) {
      if (stats.times.length < 40000) stats.times.push(ms);
      if (stats.last >= 0 && tq - stats.last > 1.5 / FPS) stats.drops++;
      stats.last = tq;
    }

    function afterRender(t) {
      var seg = tl.sceneAt(t);
      if (seg.scene !== st.scene) {
        st.scene = seg.scene;
        canvas.setAttribute('aria-label', fmt(txt('lienzo'), { titulo: video.title, escena: seg.seVe || '' }));
      }
      // prefetch the next scene's layers while idle, never during a crossfade
      if (st.prefetched !== seg.scene && !tl.crossfadeAt(t)) {
        st.prefetched = seg.scene;
        var next = seg.scene + 1;
        var idle = root.requestIdleCallback || function (fn) { return setTimeout(fn, 120); };
        idle(function () { if (renderer && !st.destroyed) renderer.layers.prefetch(next); }, { timeout: 1000 });
      }
    }

    function crossings(prev, t) {
      var i;
      if (st.recording) {
        var rec = st.recording;
        if (t >= rec.to) {
          stopAt(rec.to);
          rec.hooks.onEnd();
          return rec.to;
        }
        rec.hooks.onProgress(Math.max(0, t - rec.from), rec.to - rec.from);
        return t;
      }
      if (st.interactive) {
        for (i = 0; i < tl.checkpoints.length; i++) {
          var cp = tl.checkpoints[i];
          if (prev < cp.start && t >= cp.start) {
            stopAt(cp.start);
            showCheckpoint(cp);
            return cp.start;
          }
        }
      }
      if (st.chapterPause) {
        for (i = 1; i < tl.chapters.length; i++) {
          var ch = tl.chapters[i];
          if (prev < ch.start && t >= ch.start) {
            stopAt(ch.start);
            showChapterEnd(ch);
            return ch.start;
          }
        }
      }
      if (t >= tl.duration) {
        stopAt(tl.duration);
        showEnd();
        return tl.duration;
      }
      return t;
    }

    function stopAt(t) {
      narrator.pause();
      narrator.seek(t);
      st.t = st.lastT = t;
      setState();
      savePosition(true);
    }

    function updateUi(t, ms) {
      var fullUpdate = !narrator || !narrator.playing || ms - st.lastUi > 66;
      if (fullUpdate) {
        st.lastUi = ms;
        var x = tl.duration > 0 ? clamp01(t / tl.duration) : 0;
        fillEl.style.transform = 'scaleX(' + x.toFixed(4) + ')';
        thumbEl.style.left = (x * 100).toFixed(3) + '%';
      }
      var sec = Math.floor(t);
      if (sec !== st.second) {
        st.second = sec;
        timeEl.textContent = txt('tiempo', { actual: clock(t), total: clock(tl.duration) });
      }
      if (!narrator || !narrator.playing || ms - st.lastAria > 1000) {
        st.lastAria = ms;
        var chi = tl.chapterAt(t);
        scrub.setAttribute('aria-valuenow', String(Math.round(t)));
        scrub.setAttribute('aria-valuetext', txt('barraValorCapitulo', { actual: clock(t), total: clock(tl.duration), n: chi + 1, capitulo: tl.chapters[chi].title }));
        if (chi !== st.chapter) {
          st.chapter = chi;
          chapterButtons.forEach(function (b, i) {
            if (i === chi) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
          });
        }
      }
      if (narrator && narrator.playing && ms - st.lastSave > 2000) {
        st.lastSave = ms;
        savePosition(false);
      }
    }

    function savePosition(force) {
      if (st.recording || !st.started) return;
      var t = st.t;
      if (t > 3 && t < tl.duration - 3) store().set('player:' + video.id, { t: Math.round(t * 10) / 10 });
      else if (force && t >= tl.duration - 3) store().remove('player:' + video.id);
    }

    function setState() {
      var playing = !!(narrator && narrator.playing);
      rootEl.setAttribute('data-state', playing ? 'playing' : st.ended ? 'ended' : st.started ? 'paused' : 'idle');
      playBtn.setAttribute('aria-label', playing ? txt('pausar') : txt('reproducir'));
      var icon = playBtn.querySelector('canvas');
      drawIcon(icon, playing ? 'pause' : 'play');
    }

    // --- overlays --------------------------------------------------------------------------------
    function focusInside() { return rootEl.contains(doc.activeElement); }

    function hideOverlays() {
      cardEl.hidden = true;
      chapterEndEl.hidden = true;
      endEl.hidden = true;
      st.overlay = '';
      st.cpSeg = null;
      rootEl.classList.remove('has-overlay');
    }

    function showCheckpoint(seg) {
      hideOverlays();
      st.overlay = 'checkpoint';
      st.cpSeg = seg;
      var cp = seg.data;
      cardEl.innerHTML = '';
      var feedback = h('div', { class: 'player__feedback', 'aria-live': 'polite' });
      var cont = h('button', { type: 'button', class: 'btn btn--primary player__continue', text: txt('checkpoint.continuar'), onclick: continueCheckpoint });
      var group = h('div', { class: 'player__options-list', role: 'group', 'aria-label': txt('checkpoint.opciones') });
      var buttons = cp.options.map(function (opt, i) {
        var b = h('button', { type: 'button', class: 'player__option' }, [h('span', { class: 'player__option-mark', 'aria-hidden': 'true' }), h('span', { text: opt })]);
        b.addEventListener('click', function () { answer(i, b, buttons, feedback, cont); });
        group.appendChild(b);
        return b;
      });
      cardEl.appendChild(h('p', { class: 'player__card-kicker', id: uid + '-cpk', text: txt('checkpoint.titulo') }));
      cardEl.appendChild(h('p', { class: 'player__card-question', text: cp.question }));
      cardEl.appendChild(group);
      cardEl.appendChild(feedback);
      cardEl.appendChild(cont);
      cardEl.hidden = false;
      rootEl.classList.add('has-overlay');
      if (focusInside() && buttons[0]) buttons[0].focus();
    }

    function answer(i, button, buttons, feedback, cont) {
      var cp = st.cpSeg && st.cpSeg.data;
      if (!cp) return;
      feedback.innerHTML = '';
      var mark = button.querySelector('.player__option-mark');
      if (i === cp.answer) {
        button.classList.add('is-right');
        mark.appendChild(iconCanvas('star', 26));
        buttons.forEach(function (b) { b.disabled = true; });
        feedback.appendChild(iconCanvas('star', 34));
        feedback.appendChild(h('p', {}, [h('strong', { text: txt('checkpoint.muyBien') }), ' ' + (cp.explain || '')]));
        cont.focus();
      } else {
        button.classList.add('is-wrong');
        button.disabled = true;
        mark.appendChild(iconCanvas('spiral', 26));
        feedback.appendChild(iconCanvas('spiral', 34));
        feedback.appendChild(h('p', { text: cp.hint ? txt('checkpoint.casi', { pista: cp.hint }) : txt('checkpoint.casiSinPista') }));
        var next = buttons.filter(function (b) { return !b.disabled; })[0];
        if (next) next.focus();
      }
      cardEl.querySelectorAll('canvas.player__icon').forEach(function (c) { drawIcon(c, c.getAttribute('data-icon')); });
    }

    function continueCheckpoint() {
      var seg = st.cpSeg;
      hideOverlays();
      if (seg) seek(seg.end);
      play();
    }

    function showChapterEnd(next) {
      hideOverlays();
      st.overlay = 'chapter';
      var prev = tl.chapters[next.index - 1];
      chapterEndEl.innerHTML = '';
      var b = h('button', { type: 'button', class: 'btn btn--primary', text: txt('continuarCon', { titulo: next.title }), onclick: function () { hideOverlays(); play(); } });
      chapterEndEl.appendChild(h('p', { text: txt('finCapitulo', { titulo: prev ? prev.title : '' }) }));
      chapterEndEl.appendChild(b);
      chapterEndEl.hidden = false;
      rootEl.classList.add('has-overlay');
      announce(txt('finCapitulo', { titulo: prev ? prev.title : '' }));
      if (focusInside()) b.focus();
    }

    function showEnd() {
      hideOverlays();
      st.ended = true;
      st.overlay = 'end';
      endEl.hidden = false;
      rootEl.classList.add('has-overlay');
      setState();
      store().remove('player:' + video.id);
      announce(txt('finVideo'));
      if (typeof opts.onEnd === 'function') opts.onEnd();
    }

    // --- actions ---------------------------------------------------------------------------------
    function play() {
      return init().then(function () {
        if (st.destroyed || (narrator && narrator.playing)) return;
        if (st.overlay === 'checkpoint') { continueCheckpoint(); return; }
        if (st.overlay) hideOverlays();
        if (st.ended || st.t >= tl.duration - 0.05) { st.ended = false; seek(0); }
        players.forEach(function (p) { if (p !== api) p.pause(); });
        activePlayer = api;
        st.started = true;
        posterEl.hidden = true;
        return narrator.ready.then(function () {
          if (st.destroyed) return;
          narrator.play();
          st.lastT = narrator.time();
          setState();
          requestRender();
        });
      });
    }

    function pause() {
      if (!narrator || !narrator.playing) return;
      narrator.pause();
      setState();
      savePosition(true);
      requestRender();
    }

    function toggle() {
      if (narrator && narrator.playing) pause();
      else play();
    }

    function seek(t, scrubbing) {
      t = clamp(Number(t) || 0, 0, tl.duration);
      if (!st.initialized) {
        init().then(function () { seek(t, scrubbing); });
        return;
      }
      if (st.overlay && !(scrubbing && st.overlay === 'checkpoint')) hideOverlays();
      st.ended = false;
      st.started = true;
      posterEl.hidden = true;
      narrator.seek(t);
      st.t = st.lastT = t;
      st.second = -1;
      if (st.interactive && !st.recording && !scrubbing) {
        var seg = tl.segmentAt(t);
        if (seg.kind === 'checkpoint' && t < seg.end - 0.05) {
          if (narrator.playing) narrator.pause();
          showCheckpoint(seg);
        }
      }
      setState();
      requestRender();
    }

    function seekBy(dt) { seek(st.t + dt); }

    function jumpChapter(dir) {
      var i = tl.chapterAt(st.t);
      var target = dir < 0 ? (st.t - tl.chapters[i].start > 2 ? i : i - 1) : i + 1;
      if (target < 0) target = 0;
      if (target >= tl.chapters.length) return;
      seek(tl.chapters[target].start);
    }

    function setRate(r) {
      st.rate = r;
      slowBtn.setAttribute('aria-pressed', r === 0.75 ? 'true' : 'false');
      normalBtn.setAttribute('aria-pressed', r === 1 ? 'true' : 'false');
      if (narrator) narrator.setRate(r);
      savePrefs();
    }

    function setOption(name, on) {
      on = !!on;
      if (name === 'subtitulos') {
        st.subtitles = on;
        subsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (renderer) renderer.subtitles = on;
      } else if (name === 'voz') {
        st.voice = on;
        voiceBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (narrator) narrator.setVoice(on);
      } else if (name === 'preguntas') {
        st.interactive = on;
        interBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (renderer) renderer.linear = !on;
        if (!on && st.overlay === 'checkpoint') hideOverlays();
      } else if (name === 'capitulos') {
        st.chapterPause = on;
        chapBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      savePrefs();
      requestRender();
    }

    function savePrefs() {
      store().set(PREFS_KEY, { subs: st.subtitles, voice: st.voice, rate: st.rate, interactive: st.interactive });
    }

    function fullscreenElement() { return doc.fullscreenElement || doc.webkitFullscreenElement || null; }
    function toggleFullscreen() {
      if (fullscreenElement() === frameEl) {
        (doc.exitFullscreen || doc.webkitExitFullscreen || function () {}).call(doc);
      } else {
        var req = frameEl.requestFullscreen || frameEl.webkitRequestFullscreen;
        if (req) {
          var p = req.call(frameEl);
          if (p && p.catch) p.catch(function () {});
        }
      }
    }
    function onFullscreen() {
      var on = fullscreenElement() === frameEl;
      fullBtn.textContent = on ? txt('salirPantallaCompleta') : txt('pantallaCompleta');
      rootEl.classList.toggle('is-fullscreen', on);
      setTimeout(resize, 50);
    }

    // --- input -----------------------------------------------------------------------------------
    stage.addEventListener('click', function (e) {
      if (e.target === canvas && !st.overlay && !st.recording) toggle();
    });

    frameEl.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || st.recording) return;
      var tag = e.target && e.target.tagName;
      var native = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      var key = e.key;
      if ((key === ' ' || key === 'Enter') && native) return;
      if (key === ' ' || key === 'k' || key === 'K') { toggle(); e.preventDefault(); }
      else if (key === 'ArrowLeft') { if (e.shiftKey) jumpChapter(-1); else seekBy(-5); e.preventDefault(); }
      else if (key === 'ArrowRight') { if (e.shiftKey) jumpChapter(1); else seekBy(5); e.preventDefault(); }
      else if (key === 'c' || key === 'C') { setOption('subtitulos', !st.subtitles); e.preventDefault(); }
      else if (key === 'f' || key === 'F') { toggleFullscreen(); e.preventDefault(); }
      else if (e.target === scrub && (key === 'Home' || key === 'End')) { seek(key === 'Home' ? 0 : tl.duration); e.preventDefault(); }
    });

    var drag = null;
    function timeFromEvent(e) {
      var r = trackEl.getBoundingClientRect();
      return clamp01((e.clientX - r.left) / (r.width || 1)) * tl.duration;
    }
    scrub.addEventListener('pointerdown', function (e) {
      if (st.recording) return;
      e.preventDefault();
      try { scrub.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
      drag = { wasPlaying: !!(narrator && narrator.playing) };
      if (narrator && narrator.playing) narrator.pause();
      seek(timeFromEvent(e), true);
    });
    scrub.addEventListener('pointermove', function (e) {
      if (drag) seek(timeFromEvent(e), true);
      else showPreview(timeFromEvent(e), e);
    });
    function endDrag(e) {
      if (!drag) return;
      var was = drag.wasPlaying;
      drag = null;
      seek(timeFromEvent(e));
      if (was && st.overlay !== 'checkpoint') play();
    }
    scrub.addEventListener('pointerup', endDrag);
    scrub.addEventListener('pointercancel', endDrag);
    scrub.addEventListener('pointerleave', function () { previewEl.hidden = true; });

    var previewState = { at: 0, t: -1, timer: 0 };
    function showPreview(t, e) {
      if (!st.initialized) return;
      var r = trackEl.getBoundingClientRect();
      previewEl.hidden = false;
      previewEl.style.left = clamp(e.clientX - r.left, 0, r.width) + 'px';
      previewLabel.textContent = txt('vistaPrevia', { tiempo: clock(t), capitulo: tl.chapters[tl.chapterAt(t)].title });
      clearTimeout(previewState.timer);
      var wait = 120 - (now() - previewState.at);
      if (wait <= 0) drawPreview(t);
      else previewState.timer = setTimeout(function () { drawPreview(t); }, wait);
    }
    function drawPreview(t) {
      if (Math.abs(t - previewState.t) < 0.25 || st.destroyed) return;
      previewState.at = now();
      previewState.t = t;
      if (!preview) {
        var s = previewCanvas.width / W;
        preview = new Renderer(video, tl, { scale: s, env: scaledEnv(renderer.env, s), linear: true, subtitles: false, layerCapacity: 1 });
        preview.isReady = true;
      }
      preview.render(previewCanvas.getContext('2d'), t, { overlays: false });
    }

    function onRoute() { if (st.recording && recorderUi) recorderUi.cancel(); else pause(); }
    function onVisibility() {
      if (doc.hidden && !st.recording && narrator && narrator.mode !== 'audio') pause();
    }
    root.addEventListener('hashchange', onRoute);
    root.addEventListener('eia:route', onRoute);
    doc.addEventListener('visibilitychange', onVisibility);
    doc.addEventListener('fullscreenchange', onFullscreen);
    doc.addEventListener('webkitfullscreenchange', onFullscreen);

    var io = null, ro = null;
    if (typeof root.IntersectionObserver === 'function') {
      io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) init();
          if (en.intersectionRatio < 0.25 && !st.recording && !fullscreenElement()) pause();
        });
      }, { rootMargin: '200px 0px', threshold: [0, 0.25] });
      io.observe(stage);
    } else {
      init();
    }
    if (typeof root.ResizeObserver === 'function') {
      ro = new root.ResizeObserver(function () { resize(); });
      ro.observe(stage);
    } else {
      root.addEventListener('resize', resize);
    }

    // --- recording host (js/engine/recorder.js) --------------------------------------------------
    var savedForRecording = null;
    function host() {
      return {
        id: video.id, slug: tl.slug, title: video.title, duration: tl.duration, chapters: tl.chapters,
        base: SITE_BASE, canvas: canvas,
        exportInfo: (EIA.videoExports || {})[video.id] || null,
        currentChapter: function () { return tl.chapters[tl.chapterAt(st.t)]; },
        voice: function () { return narrator ? narrator.canCapture() : { ok: false, reason: 'silent' }; },
        audioStream: function () { return narrator ? narrator.captureStream() : null; },
        announce: announce,
        begin: function (range, hooks) {
          return init().then(function () {
            pause();
            hideOverlays();
            savedForRecording = { voice: st.voice, linear: renderer.linear };
            st.recording = { from: range.from, to: range.to, hooks: hooks };
            rootEl.classList.add('is-recording');
            renderer.linear = true;
            if (narrator.mode === 'browser') narrator.setVoice(false);   // not capturable: keep it quiet
            st.scale = 0;
            resize();
            seek(range.from);
            st.started = true;
            narrator.play();
            st.lastT = narrator.time();
            setState();
            requestRender();
          });
        },
        hold: function (on) {
          if (!st.recording) return;
          if (on) narrator.pause();
          else { narrator.play(); st.lastT = narrator.time(); requestRender(); }
          setState();
        },
        end: function () {
          if (!st.recording) return;
          narrator.pause();
          st.recording = null;
          rootEl.classList.remove('is-recording');
          renderer.linear = savedForRecording ? savedForRecording.linear : !st.interactive;
          if (narrator.mode === 'browser') narrator.setVoice(st.voice);
          st.scale = 0;
          resize();
          setState();
          requestRender();
        }
      };
    }

    api = {
      el: rootEl,
      duration: tl.duration,
      chapters: tl.chapters,
      timeline: tl,
      play: play,
      pause: pause,
      toggle: toggle,
      seek: function (t) { seek(t); },
      time: function () { return st.t; },
      isPlaying: function () { return !!(narrator && narrator.playing); },
      setOption: setOption,
      ready: function () { return init(); },
      stats: function () { return stats ? summarize(stats) : null; },
      resetStats: function () { if (stats) { stats.times = []; stats.drops = 0; stats.last = -1; } },
      destroy: function () {
        st.destroyed = true;
        if (st.raf) root.cancelAnimationFrame(st.raf);
        if (recorderUi) recorderUi.cancel();
        if (narrator) narrator.destroy();
        if (io) io.disconnect();
        if (ro) ro.disconnect(); else root.removeEventListener('resize', resize);
        root.removeEventListener('hashchange', onRoute);
        root.removeEventListener('eia:route', onRoute);
        doc.removeEventListener('visibilitychange', onVisibility);
        doc.removeEventListener('fullscreenchange', onFullscreen);
        doc.removeEventListener('webkitfullscreenchange', onFullscreen);
        players = players.filter(function (p) { return p !== api; });
        if (activePlayer === api) activePlayer = null;
        rootEl.remove();
      }
    };
    players.push(api);
    return api;
  }

  function summarize(stats) {
    var a = stats.times.slice().sort(function (x, y) { return x - y; });
    var sum = 0;
    a.forEach(function (x) { sum += x; });
    return {
      frames: a.length,
      avg: a.length ? sum / a.length : 0,
      p95: a.length ? a[Math.min(a.length - 1, Math.floor(a.length * 0.95))] : 0,
      max: a.length ? a[a.length - 1] : 0,
      dropped: stats.drops
    };
  }

  EIA.engine.player = {
    create: create,
    mountRender: mountRender,
    info: info,
    Renderer: Renderer,
    fontsReady: fontsReady,
    base: SITE_BASE,
    active: function () { return activePlayer; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
