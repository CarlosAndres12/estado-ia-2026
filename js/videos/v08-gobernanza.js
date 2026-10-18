/* js/videos/v08-gobernanza.js — V08 «Gobernar sistemas, no solo modelos» (prompt §13, sesión 6; KB §9;
 * láminas D13–D14).
 *
 * Thirteen scenes in four chapters, drawn with the engine only (odd/spec/engine-api.md):
 *   1 Tres familias de riesgo     familias · respuesta
 *   2 Leer bien los incidentes    incidentes · denominador · trampa
 *   3 La Ley de IA de la UE       ley · plazos · omnibus · por-que-importa
 *   4 El ciclo de gobernanza      volante · freno · sociotecnico · cierre
 *
 * The metaphors are the láminas' (prompt §12.2): D13's warm control board whose hand-drawn dial runs
 * on ONE zero-based scale with no labelled end (no invented value) — the needle at exactly 362, the
 * ghost at exactly 233, the stretch between them red — and its three columns with the risk-family
 * signs (anzuelo, grieta, red de hilos sobre un pueblo); D14's warm steering wheel with a brake disc
 * and the six numbered stations of the governance cycle around its rim.
 *
 * The AI Act is one long paper strip whose pins sit at positions exactly proportional to their
 * dates (one linear time scale per frame; the camera only zooms between scenes). Only the dates of
 * the KB are pinned (ctx-ley-vigor, ctx-ley-prohibiciones, ries-3, ries-4); the Ómnibus sheet adds
 * the two postponed high-risk pins and nothing earlier for them; its two other rules are cards of
 * plain text (the prohibition of non-consensual sexual deepfakes and child sexual abuse material
 * is never illustrated). The denominator of the incident count is an empty dotted box: the KB gives
 * no rate, so none is drawn. Benchmarks and tests are ruled navy panels; people and places are warm
 * and free; the AI is only the small ruled lamp. No killer robots, explosions or skulls.
 *
 * Beats follow the voice (prompt §5.6): every change is keyed to s.at(i) of the line that brings it,
 * and in-line beats to s.cue(i, words, kind) (the subtitle chunk times), never to fixed seconds. No
 * string, number or source is typed here: copy comes from s.rotulos (js/data/videos.js), values from
 * the rótulos, sources from env.tags. Draw functions are pure functions of (s, env): motion comes
 * from s.t, geometry is built in setup(). */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.videos = EIA.videos || {};

  var W = 1280, H = 720, TAU = Math.PI * 2;

  function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)); }
  // A beat inside a line: like seg on s.at(i), but never before the line starts (a cue at 0), and
  // always finished by the end of the line (a window that would end past it is pulled back in).
  function beat(at, a, b) {
    if (at <= 0) return 0;
    b = Math.min(b, 1);
    return seg(at, Math.max(0, Math.min(a, b - 0.02)), b);
  }
  function out3(t) { t = 1 - clamp01(t); return 1 - t * t * t; }
  function inOut3(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function noise(x, seed) { return EIA.engine.rng.noise1(x, seed); }
  function rot(s, key) { var r = s.rotulos && s.rotulos[key]; return r ? r.text : ''; }
  // Pieces of a rótulo split at a separator of its own text («Inventario → Clasificar riesgo → …»).
  function piece(text, sep, i) { var a = String(text).split(sep); return a[i] == null ? '' : a[i].trim(); }
  function pieces(text, sep) { return String(text).split(sep).map(function (x) { return x.trim(); }).filter(Boolean); }

  // A dated rótulo as its heading (up to the first colon, without it) and the rest.
  function splitHead(text) {
    var i = String(text).indexOf(':');
    return i > 0 ? { head: text.slice(0, i), rest: text.slice(i + 1).trim() } : { head: String(text), rest: '' };
  }

  // The first full Spanish date of a rótulo («2 de agosto de 2027: … antes del 2 de agosto de 2025»
  // → 2 August 2027), as days since 1970-01-01 UTC. Parsed here (chart.parseDate misreads short
  // month forms such as «Ago 2027»). null when the text holds no full date.
  var MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8,
    octubre: 9, noviembre: 10, diciembre: 11 };
  function dateOf(text) {
    var m = /(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/i.exec(String(text || ''));
    if (!m || MESES[m[2].toLowerCase()] == null) return null;
    return Date.UTC(+m[3], MESES[m[2].toLowerCase()], +m[1]) / 864e5;
  }
  function day(y, mo, d) { return Date.UTC(y, mo - 1, d) / 864e5; }

  function findVideo(id) {
    var list = (EIA.data && EIA.data.videos) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function sceneOf(video, id) {
    var sc = (video && video.scenes) || [];
    for (var i = 0; i < sc.length; i++) if (sc[i].id === id) return sc[i];
    return null;
  }

  // ---------------------------------------------------------------------------------------------
  // Cues: [line index, words, kind]. 'word' → where the subtitles put those words; 'chunk' → when
  // the subtitle chunk holding them appears (a figure must be on screen by then).

  var CUES = {
    familias: { informe: [0, 'El informe internacional', 'chunk'], familias: [0, 'tres familias', 'word'],
      f0: [1, 'uso malicioso', 'word'], f1: [1, 'fallos', 'word'], f2: [1, 'riesgos sistémicos', 'word'], incluyen: [1, 'Incluyen', 'word'] },
    respuesta: { r0: [0, 'evaluaciones', 'word'], r1: [0, 'modelado de amenazas', 'word'], r2: [0, 'reporte de incidentes', 'word'],
      r3: [0, 'resiliencia institucional', 'word'] },
    incidentes: { base: [0, 'AI Incident Database', 'word'], n233: [0, '233', 'word'], n362: [0, '362', 'word'], n55: [0, '55%', 'word'] },
    denominador: { uso: [0, 'más uso', 'word'], reporte: [0, 'más reporte', 'word'], revisan: [0, 'se revisan', 'word'],
      denominador: [1, 'denominador', 'word'], tasa: [1, 'por unidad de adopción', 'word'], transparencia: [1, 'cae la transparencia', 'word'] },
    trampa: { enganar: [0, 'se pueden engañar', 'word'], detectan: [0, 'detectan', 'word'], explotan: [0, 'explotan', 'word'],
      termino: [0, 'reward hacking', 'word'], externa: [1, 'evaluación externa', 'word'], monitoreo: [1, 'monitoreo continuo', 'word'],
      controles: [1, 'controles operacionales', 'word'] },
    ley: { ley: [0, 'Ley de IA', 'word'], vigor: [0, '1 de agosto de 2024', 'word'], prohibiciones: [0, '2 de febrero de 2025', 'word'],
      gpai: [1, '2 de agosto de 2025', 'word'], c0: [1, 'documentación técnica', 'word'], c1: [1, 'política de derechos', 'word'],
      c2: [1, 'resumen público', 'word'] },
    plazos: { mayoria: [0, '2 de agosto de 2026', 'word'], multas: [0, 'incluso con multas', 'word'], previos: [0, 'Los modelos que ya estaban', 'chunk'] },
    omnibus: { hoja: [0, 'el Ómnibus Digital', 'word'], sinCambios: [0, 'No cambió las fechas', 'word'], aplazo: [0, 'pero aplazó', 'word'],
      anexoIII: [0, 'las del anexo III', 'word'], anexoI: [0, 'las del anexo I,', 'word'], prohibe: [1, 'Desde el 2 de diciembre de 2026', 'word'],
      sandbox: [1, 'Y pide que', 'word'] },
    'por-que-importa': { servicios: [0, 'ofrecen servicios', 'word'], socios: [0, 'investigan con socios', 'word'], proveedores: [0, 'usan proveedores', 'word'],
      referencia: [1, 'referencia internacional', 'word'], nota: [1, 'Esto es información', 'word'] },
    volante: { s0: [0, 'Inventario', 'word'], s1: [0, 'Clasificar el riesgo', 'word'], s2: [1, 'Evaluar privacidad', 'word'], s3: [1, 'Supervisar', 'word'],
      s4: [2, 'Monitorear', 'word'], s5: [2, 'Y corregir', 'word'], repite: [0, 'un ciclo que se repite', 'word'] },
    freno: { sinAutoridad: [0, 'sin autoridad', 'word'], noEs: [0, 'no es supervisión', 'word'], criterio: [0, 'Definan el criterio', 'word'],
      quien: [0, 'quién decide', 'word'] },
    sociotecnico: { modelo: [0, 'Un modelo razonablemente', 'word'], datos: [0, 'datos deficientes', 'word'], incentivos: [0, 'incentivos incorrectos', 'word'],
      permisos: [0, 'permisos excesivos', 'word'], usuarios: [0, 'usuarios sin capacidad', 'word'] },
    cierre: { proporcional: [0, 'proporcional', 'word'], titulo: [0, 'Y se gobiernan', 'chunk'] }
  };

  // The scene's cues as shares of their lines, read from the player's s.cue (subtitle timing: the
  // audio manifest's chunk times when it has them, else the character estimate). Memoized per
  // scene state object, which the player keeps for the life of its timeline (a pure cache: same
  // timeline, same shares). Words missing from a line fall back to the middle of the line.
  var cueMemo = new WeakMap();
  function cuesOf(s, sceneId) {
    var c = cueMemo.get(s);
    if (c) return c;
    c = {};
    var spec = CUES[sceneId] || {};
    Object.keys(spec).forEach(function (k) {
      var v = s.cue ? s.cue(spec[k][0], spec[k][1], spec[k][2]) : null;
      c[k] = v == null ? 0.5 : v;
    });
    cueMemo.set(s, c);
    return c;
  }

  // A mark lands over a short window that ends just before its words are said.
  function landBy(cs, len) {
    var b = Math.max(0.03, cs - 0.01);
    return [Math.max(0.005, b - (len || 0.06)), b];
  }

  // ---------------------------------------------------------------------------------------------
  // Shared pieces

  function bg(ctx, s, env, kind) {
    if (s.layers && s.layers.bg) ctx.drawImage(s.layers.bg, 0, 0, W, H);
    else env.ink.background(ctx, kind || 'personas', { seed: 'v08:pagina' });
  }

  // A scene ground pre-rendered once per scene (prompt §14): paper plus static drawing.
  function groundLayer(kind, opts, extra) {
    return function (env) {
      var c = env.canvas(W, H), g = c.getContext('2d'), o = { seed: 'v08:pagina' }, k;
      for (k in opts || {}) o[k] = opts[k];
      env.ink.background(g, kind, o);
      if (extra) extra(g, env);
      return { bg: c };
    };
  }

  // Calm ambient signs: slow drift and turn from s.t. f = [name, x, y, size, color?]; decorative
  // colors only (never the five evidence colors); keep them clear of the subtitle band (y > 570).
  function floaters(ctx, s, env, list, p) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i], t = s.t * 0.2 + i * 7.3;
      env.fig.sign(ctx, f[0], f[1] + noise(t, 'v08:fx' + i) * 9, f[2] + noise(t * 0.8, 'v08:fy' + i) * 7, f[3], {
        seed: 'v08:float' + f[0] + i, colors: f[4] ? { a: f[4] } : null, rot: noise(t * 0.6, 'v08:fr' + i) * 0.14, p: p
      });
    }
  }

  // Brush lettering that fades as one image: drawn glyph by glyph with a low alpha, the fill and the
  // brush stroke overlap and show dark outlines (and a number would pass through in-between numbers).
  function letterFade(ctx, env, text, x, y, lo, alpha, key) {
    if (alpha <= 0) return env.ink.measureLetter(ctx, text, lo);
    if (alpha >= 1) return env.ink.letter(ctx, text, x, y, lo);
    var full = {}, k;
    for (k in lo) full[k] = lo[k];
    full.p = 1;
    var L = env.ink.measureLetter(ctx, text, full), size = L.size;
    var pad = Math.ceil(size * 0.5), w = Math.ceil(L.w + pad * 2), h = Math.ceil(L.h + pad * 2);
    var cx = full.align === 'center' ? w / 2 : full.align === 'right' ? w - pad : pad;
    var img = env.ink.layer(ctx, 'v08:letra|' + key + '|' + size + '|' + (full.color || '') + '|' + (full.maxWidth || ''), w, h, function (g) {
      env.ink.letter(g, text, cx, pad, full);
    });
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, x - cx, y - pad, w, h);
    ctx.restore();
    return L;
  }

  // Hero numbers: lettered without colored counters or stars, faded in whole (prompt §3.7).
  function hero(ctx, env, text, x, y, size, o) {
    var lo = { size: size, align: o.align || 'left', counters: 0, stars: false, underline: false, seed: o.seed, color: o.color, maxLines: 1, p: 1 };
    return letterFade(ctx, env, text, x, y, lo, o.p == null ? 1 : clamp01(o.p), 'hero|' + text + '|' + o.seed);
  }

  // A label lettered by hand that writes itself on (no counters, no stars: it reads at a glance).
  function label(ctx, env, text, x, y, size, o) {
    return env.ink.letter(ctx, text, x, y, { size: size, align: o.align || 'left', maxWidth: o.maxWidth, maxLines: o.maxLines || 1, fit: !!o.maxWidth,
      minSize: 16, counters: o.counters || 0, stars: false, underline: !!o.underline, seed: o.seed, color: o.color, p: o.p });
  }

  // One source tag per figure. Tags never wrap their source label, so maxWidth leaves room for the
  // longest one (it is multiplied by the tag scale).
  function sourceTag(ctx, env, ids, x, y, anchor, p, o) {
    if (p <= 0) return null;
    o = o || {};
    return env.tags.sourceTag(ctx, ids, { x: x, y: y, anchor: anchor, p: p, scale: o.scale || 1.04, maxWidth: o.maxWidth || 380,
      scope: o.scope == null ? 'auto' : o.scope, tilt: o.tilt });
  }

  // The same points array while its numbers stay the same, so the engine's geometry cache (keyed by
  // the array) is reused frame after frame instead of rebuilding the stroke.
  function stable(env, key, pts) {
    var prev = env.cache.get(key);
    if (prev && prev.length === pts.length && prev.every(function (v, i) { return Math.abs(v - pts[i]) < 0.05; })) return prev;
    env.cache.set(key, pts);
    return pts;
  }

  // A second thread from a tag's hole to another mark of the same figure.
  function extraThread(ctx, env, tg, anchor, key, p) {
    if (!tg || p <= 0) return;
    var hx = tg.hole.x, hy = tg.hole.y;
    var pts = stable(env, 'v08:hilo:' + key, [anchor.x, anchor.y, (anchor.x + hx) / 2, (anchor.y + hy) / 2 + 10, hx, hy]);
    env.ink.line(ctx, pts, { w: 2.1, profile: 'hair', seed: 'v08:hilo' + key, dot: 1.6, p: seg(p, 0.45, 1) });
  }

  // A paper note pinned with a red pin.
  function pinnedNote(ctx, env, text, N, p, seed) {
    if (p <= 0) return;
    var ink = env.ink, m = env.pal.mundo;
    ctx.save();
    ctx.translate(N.x + N.w / 2, N.y + N.h / 2);
    ctx.rotate(N.rot == null ? 0.03 : N.rot);
    ink.card(ctx, -N.w / 2, -N.h / 2, N.w, N.h, { seed: seed, weight: 3, radius: 8, p: p, peek: N.peek === false ? null : m.amarillo, peekCorner: N.peek || 'tr' });
    ink.text(ctx, text, N.align === 'center' ? 0 : -N.w / 2 + 20, -N.h / 2 + (N.padT || 18), { size: N.size || 22, italic: N.italic !== false, weight: N.weight || 400,
      maxWidth: N.w - 38, lineHeight: 1.2, align: N.align || 'left', p: seg(p, 0.3, 1) });
    ink.circle(ctx, 0, -N.h / 2 + 2, 7, { fill: m.rojo, w: 2.2, seed: seed + ':chincheta', p: seg(p, 0, 0.5) });
    ctx.restore();
  }

  function circlePts(cx, cy, r, n, a0) {
    var out = [];
    for (var i = 0; i < n; i++) { var a = (a0 || 0) + i / n * TAU; out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    return out;
  }
  function rotPts(pts, a) {
    var c = Math.cos(a), sn = Math.sin(a), out = [];
    for (var i = 0; i < pts.length; i += 2) out.push(pts[i] * c - pts[i + 1] * sn, pts[i] * sn + pts[i + 1] * c);
    return out;
  }

  // A warm hand (palm, four fingers, thumb, sleeve), fingers up at rotation 0; scale 1 ≈ 80 px.
  function handDrawing(env) {
    var b = env.ink.drawing('v08:mano', { w: 3, jitter: 0.3 });
    b.shape([-17, 28, 17, 28, 21, 190, -21, 190], { fill: '@sleeve', w: 3 });
    for (var i = 0; i < 4; i++) b.ellipse(-21 + i * 14, -24 + Math.abs(i - 1.5) * 4, 7.5, 16, { fill: '@skin', w: 2.4 });
    b.ellipse(31, 8, 9, 17, { fill: '@skin', w: 2.4, rot: -0.7 });
    b.ellipse(0, 6, 31, 28, { fill: '@skin', w: 3 });
    b.stroke([-14, -6, -12, 4], { w: 1.6, profile: 'hair' });
    b.stroke([6, -6, 8, 4], { w: 1.6, profile: 'hair' });
    return b.done();
  }
  function hand(ctx, s, env, x, y, k, a, p, sleeve) {
    if (p <= 0) return;
    env.ink.draw(ctx, s.state.hand, x, y, k, { rot: a, p: p, colors: { skin: env.pal.pieles[2], sleeve: sleeve || env.pal.mundo.azul } });
  }

  // ---------------------------------------------------------------------------------------------
  // 1 · familias — the report lands on the page with its tag (ries-2); three tall calligraphic
  // columns draw on, and each takes its risk-family sign and its name as it is said.

  var FAM = {
    report: { x: 64, y: 130, w: 190, h: 236 },
    tag: { x: 60, y: 398 },
    cols: [{ x: 380, color: 'rojo' }, { x: 580, color: 'amarillo' }, { x: 780, color: 'azul' }],
    foot: 470, k: 1, sign: 88, label: { y: 490, size: 27, w: 196 }
  };

  function pillarDrawing(env, i) {
    var b = env.ink.drawing('v08:columna' + i, { w: 4, jitter: 0.7 });
    b.shape([-78, -330, 78, -330, 74, -306, -74, -306], { fill: '@stone', w: 4.2 });
    b.shape([-60, -306, 60, -306, 64, -160, 61, -26, -61, -26, -64, -160], { fill: '@a', w: 4.4 });
    b.shape([-80, -26, 80, -26, 84, 0, -84, 0], { fill: '@stone', w: 4.2 });
    b.circle(0, -214, 56, { fill: '@paper', w: 3.4 });
    b.stroke([-36, -148, -38, -96, -36, -40], { w: 2, profile: 'hair' });
    b.stroke([36, -148, 38, -96, 36, -40], { w: 2, profile: 'hair' });
    return b.done();
  }

  function familias(ctx, s, env) {
    var C = cuesOf(s, 'familias'), st = s.state.familias, ink = env.ink, fig = env.fig, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(s.intro), a0 = s.at(0), a1 = s.at(1);
    floaters(ctx, s, env, [['estrella', 1010, 120, 44, m.amarillo], ['pajaro', 1150, 470, 70], ['espiral', 990, 500, 40], ['luna', 1190, 140, 46, m.amarillo]], intro);
    // The report (no title of its own: the tag says what it is).
    var R = FAM.report, rp = beat(a0, C.informe - 0.04, C.informe + 0.06);
    if (rp > 0) {
      ctx.save();
      ctx.translate(R.x + R.w / 2, R.y + R.h / 2);
      ctx.rotate(-0.04);
      ink.card(ctx, -R.w / 2, -R.h / 2, R.w, R.h, { seed: 'v08:informe', weight: 4, radius: 8, p: rp, peek: m.azul, peekCorner: 'bl' });
      for (var j = 0; j < st.reportLines.length; j++) ink.line(ctx, st.reportLines[j], { w: 2.4, profile: 'even', seed: 'v08:informe' + j, p: seg(rp, 0.4 + j * 0.08, 0.7 + j * 0.06) });
      ctx.restore();
      sourceTag(ctx, env, 'ries-2', FAM.tag.x, FAM.tag.y, { x: FAM.tag.x + 18, y: R.y + R.h - 4 }, rp, { scope: true });
    }
    // The three columns rise slowly while the report is introduced (risks grow with capabilities),
    // one after the other, and stand complete when «tres familias» is said.
    var cueF = [C.f0, C.f1, C.f2];
    for (var i = 0; i < FAM.cols.length; i++) {
      var col = FAM.cols[i], c0 = Math.min(C.informe + 0.04 + i * 0.12, C.familias - 0.2), cp = beat(a0, c0, C.familias - 0.01);
      if (s.line >= 1) cp = 1;
      if (cp <= 0) continue;
      ink.draw(ctx, st.pillars[i], col.x, FAM.foot, FAM.k, { p: cp, colors: { a: m[col.color], stone: m.lienzoOcre, paper: m.lienzo } });
      var fam = st.legend[i], lp = beat(a1, cueF[i] - 0.05, cueF[i] + 0.03);
      if (fam && lp > 0) {
        fig.sign(ctx, fam.sign, col.x, FAM.foot - 214 + Math.sin(s.t * 0.7 + i) * 2, FAM.sign, { seed: 'v08:' + fam.key, p: lp });
        var key = ['usoMalicioso', 'fallos', 'sistemicos'][i];
        label(ctx, env, rot(s, key), col.x, FAM.label.y, FAM.label.size, { align: 'center', maxWidth: FAM.label.w, maxLines: 2, seed: 'v08:fam' + i, p: lp });
      }
    }
    // «Incluyen…»: a loose calligraphic bracket gathers the three families.
    var bp = beat(a1, C.incluyen - 0.02, C.incluyen + 0.12);
    if (bp > 0) ink.line(ctx, st.bracket, { w: 3.4, profile: 'swell', seed: 'v08:llave', p: bp });
  }

  // ---------------------------------------------------------------------------------------------
  // 2 · respuesta — four tools hang on a warm workshop wall, each named as it is said: a ruled test
  // panel, a map with threat arrows, a mailbox, a bridge with flexible joints.

  var RESP = { xs: [212, 498, 784, 1070], hookY: 136, toolY: 290, labelY: 430, keys: ['evaluaciones', 'amenazas', 'reporte', 'resiliencia'] };

  function respuestaLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo;
    ink.background(g, 'personas', { seed: 'v08:pagina' });
    // The workshop wall: one soft biomorphic ochre field (no ruled edge).
    ink.shape(g, ink.blobPoints(env.rng('v08:pared'), 640, 300, 600, 210, 14, 0.06, 0), { fill: m.lienzoOcre, fillAlpha: 0.6, line: false, seed: 'v08:pared' });
    ink.line(g, [70, 494, 400, 498, 800, 492, 1210, 497], { w: 4, profile: 'swell', seed: 'v08:repisa' });
    RESP.xs.forEach(function (x, i) {
      ink.circle(g, x, RESP.hookY, 6, { fill: m.tinta, line: false, seed: 'v08:clavo' + i });
    });
    return { bg: c };
  }

  function tool(ctx, s, env, i, x, y, p) {
    var ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina, st = s.state.respuesta;
    // The string from the nail.
    ink.line(ctx, st.strings[i], { w: 2, profile: 'hair', seed: 'v08:cuerda' + i, p: seg(p, 0, 0.3) });
    switch (i) {
      case 0: {   // the ruled test panel
        var P = { x: x - 96, y: y - 64, w: 192, h: 130 };
        if (seg(p, 0.1, 0.4) > 0) {
          ctx.save();
          ctx.beginPath(); ctx.rect(P.x - 2, P.y - 2, P.w + 4, (P.h + 4) * seg(p, 0.1, 0.4)); ctx.clip();
          fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 12, construction: false });
          ctx.restore();
        }
        ink.rRect(ctx, P.x + 16, P.y + 16, 92, 98, { color: q.linea, w: 1.3, fill: q.noche, p: seg(p, 0.35, 0.6) });
        for (var r = 0; r < 4; r++) {
          var rp = seg(p, 0.5 + r * 0.08, 0.6 + r * 0.08), ry = P.y + 36 + r * 20;
          ink.rRect(ctx, P.x + 24, ry - 5, 9, 9, { color: q.linea, w: 1.1, p: rp });
          ink.rLine(ctx, P.x + 40, ry, P.x + 98, ry, { color: q.linea, w: 1.1, p: rp });
        }
        if (p > 0.7) fig.lamp(ctx, P.x + 150, P.y + 66, 0.36, { t: s.t, p: seg(p, 0.7, 1) });
        break;
      }
      case 1: {   // the map with threat arrows (no real borders: one biomorphic land)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.03);
        ink.card(ctx, -100, -72, 200, 144, { seed: 'v08:mapa', weight: 3.6, radius: 6, p: seg(p, 0, 0.4) });
        ink.shape(ctx, st.land, { fill: m.verde, fillAlpha: 0.8, w: 3, seed: 'v08:tierra', p: seg(p, 0.3, 0.7) });
        ink.circle(ctx, 6, 4, 7, { fill: m.amarillo, w: 2.4, seed: 'v08:blanco', p: seg(p, 0.5, 0.7) });
        for (var a = 0; a < st.threats.length; a++) ink.arrow(ctx, st.threats[a], { w: 3.4, headSize: 11, color: m.rojo, seed: 'v08:amenaza' + a, p: seg(p, 0.55 + a * 0.1, 0.8 + a * 0.08) });
        ctx.restore();
        break;
      }
      case 2:     // the mailbox for incident reports
        fig.mailbox(ctx, x, y + 96, 0.86, { seed: 'v08:buzon', p: p });
        if (p >= 1) fig.envelope(ctx, x - 6 + Math.sin(s.t * 0.9) * 2, y - 46 + Math.sin(s.t * 0.7) * 3, 0.32, { seed: 'v08:sobre' });
        break;
      case 3:     // the bridge with flexible joints
        ink.draw(ctx, st.flexBridge, x, y + 10, 1, { p: p, colors: { a: m.madera, b: m.rojo } });
        break;
    }
  }

  function respuesta(ctx, s, env) {
    var C = cuesOf(s, 'respuesta'), m = env.pal.mundo;
    bg(ctx, s, env);
    floaters(ctx, s, env, [['sol', 1180, 60, 44, m.rojo], ['estrella', 640, 58, 30, m.amarillo]], out3(s.intro));
    var a = s.at(0), cues = [C.r0, C.r1, C.r2, C.r3];
    for (var i = 0; i < 4; i++) {
      var x = RESP.xs[i], sway = Math.sin(s.t * 0.6 + i * 1.7) * 0.012;
      var p = beat(a, cues[i] - 0.08, cues[i] + 0.08);
      if (p <= 0) continue;
      ctx.save();
      ctx.translate(x, RESP.hookY);
      ctx.rotate(sway);
      ctx.translate(-x, -RESP.hookY);
      tool(ctx, s, env, i, x, RESP.toolY, p);
      ctx.restore();
      label(ctx, env, rot(s, RESP.keys[i]), x, RESP.labelY, 25, { align: 'center', maxWidth: 250, maxLines: 2, seed: 'v08:herr' + i, p: seg(p, 0.5, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 3 · incidentes — lámina D13's control board: the dial on ONE zero-based scale (its zero
  // marked, its end unlabeled); the needle grows to exactly 233, then moves to exactly 362 while
  // the ghost stays at 233; the stretch between them turns red; «+55%» lands whole; one ries-1 tag
  // with the scope «AI Incident Database» (threads to every number).

  var DIAL_MAX = 500;   // where the unlabeled scale ends (as in lámina D13): not a value
  var INC = {
    board: { x: 120, y: 78, w: 590, h: 452 },
    plate: { x: 255, y: 466, w: 320, h: 48 },
    dial: { x: 415, y: 306, r: 126 },
    big: { x: 792, y: 258, size: 100 },
    tag: { x: 760, y: 40 },
    lectora: { x: 1172, y: 560, k: 2.1 }
  };

  // A dial rótulo («362 (2025)»): its number big, the rest smaller after it (as in lámina D13).
  function dialLabel(ctx, env, text, x, y, side, k, color, alpha) {
    var ink = env.ink, pv = env.chart.parseValue(text);
    var num = pv && pv.index === 0 ? pv.raw : text, rest = pv && pv.index === 0 ? text.slice(pv.raw.length).replace(/^\s+/, '') : '';
    var no = { size: 40 * k, weight: 900, font: 'display', color: color, p: alpha };
    var ro = { size: 21 * k, weight: 700, color: color, p: alpha };
    var nl = ink.measureText(ctx, num, no), rl = rest ? ink.measureText(ctx, rest, ro) : { w: 0, h: 0 };
    var gap = rest ? 7 * k : 0, w = nl.w + gap + rl.w;
    var x0 = side === 'center' ? x - w / 2 : side === 'right' ? x - w : x, top = y - nl.size * 0.62;
    if (alpha > 0) {
      ink.text(ctx, num, x0, top, no);
      if (rest) ink.text(ctx, rest, x0 + nl.w + gap, top + (nl.size - rl.size) * 0.74, ro);
    }
    return { x: x0, y: top, w: w, h: nl.h, left: { x: x0 - 4 * k, y: y }, right: { x: x0 + w + 6 * k, y: y - 2 * k } };
  }

  /* The dial: a cream face, the yellow band (drawn here: chart.gauge paints one color), the red
   * stretch from the ghost to the needle, then chart.gauge's own arc, ticks and needles over it
   * (its band transparent), so every angle comes from one function. o: value (needle), ghost,
   * k (scale), p (draw-on of the face), labels { antes, despues: { text, alpha } }. Returns the
   * label boxes. */
  function drawDial(ctx, env, cx, cy, R, o) {
    var ink = env.ink, chart = env.chart, m = env.pal.mundo, pal = env.pal, sc = { min: 0, max: DIAL_MAX };
    var fp = o.p == null ? 1 : o.p;
    ink.circle(ctx, cx, cy, R * 1.14, { fill: m.lienzo, w: 4.4 * Math.max(0.6, o.k), seed: 'v08:esfera' + Math.round(R), p: fp });
    if (fp < 0.6) return {};
    var bandA = seg(fp, 0.6, 1);
    var band = function (from, to, color, alpha) {
      if (to <= from) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha *= alpha * bandA;
      ctx.lineWidth = R * 0.16;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, chart.gaugeAngle(sc, from), chart.gaugeAngle(sc, to));
      ctx.stroke();
      ctx.restore();
    };
    band(0, DIAL_MAX, m.amarillo, 0.8);
    if (o.ghost != null && o.value > o.ghost) band(o.ghost, o.value, m.rojo, 0.92);
    var res = chart.gauge(ctx, { x: cx, y: cy, r: R, min: 0, max: DIAL_MAX, value: o.value, ghost: o.ghost, ticks: 10, color: 'rgba(0,0,0,0)', p: bandA < 1 ? bandA : 1 });
    var z0 = chart.gaugeAngle(sc, 0), zr = R * 1.3;
    ink.text(ctx, pal.legend.words.cero, cx + Math.cos(z0) * zr, cy + Math.sin(z0) * zr - 11 * o.k, { size: 20 * o.k, weight: 700, align: 'center', p: bandA });
    var out = {}, L = o.labels || {};
    [['antes', o.ghost != null ? res.ghostAngle : res.angle, pal.mix(m.tinta, m.lienzo, 0.3)], ['despues', res.angle, m.tinta]].forEach(function (lb) {
      var r = L[lb[0]];
      if (!r || !r.text || r.alpha <= 0 || lb[1] == null) return;
      var a = lb[1], rr = R * 1.26, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      var side = Math.abs(Math.cos(a)) < 0.35 ? 'center' : Math.cos(a) > 0 ? 'left' : 'right';
      if (side === 'center') py -= 24 * o.k;
      out[lb[0]] = dialLabel(ctx, env, r.text, px, py, side, o.k, lb[2], r.alpha);
    });
    out.res = res;
    return out;
  }

  function board(ctx, env, B, p, plateText, plate) {
    var ink = env.ink, m = env.pal.mundo;
    ink.card(ctx, B.x, B.y, B.w, B.h, { seed: 'v08:tablero' + Math.round(B.w), weight: 4.6, radius: 26, fill: env.pal.mix(m.lienzoOcre, m.lienzo, 0.28), p: p });
    if (plate && plateText) {
      var pp = seg(p, 0.5, 1);
      ink.card(ctx, plate.x, plate.y, plate.w, plate.h, { seed: 'v08:placa', weight: 3, radius: 8, fill: m.lienzo, p: pp });
      ink.text(ctx, plateText, plate.x + plate.w / 2, plate.y + plate.h / 2 - 13, { size: 24, weight: 700, align: 'center', maxWidth: plate.w - 20, fit: true, minSize: 16, p: seg(pp, 0.4, 1) });
    }
  }

  function incidentes(ctx, s, env) {
    var C = cuesOf(s, 'incidentes'), m = env.pal.mundo, a0 = s.at(0), a1 = s.at(1);
    bg(ctx, s, env);
    floaters(ctx, s, env, [['estrella', 1180, 96, 40, m.amarillo], ['espiral', 1000, 520, 36]], out3(s.intro));
    var B = INC.board, D = INC.dial;
    var bp = out3(beat(a0, Math.min(0.02, C.base), Math.max(0.08, C.base + 0.02)));
    if (bp <= 0) return;
    board(ctx, env, B, bp, rot(s, 'alcance'), INC.plate);
    var v233 = env.chart.parseValue(rot(s, 'antes')).value, v362 = env.chart.parseValue(rot(s, 'despues')).value;
    // 0 → 233 lands just before «233» is said; 233 → 362 just before «362».
    var w1 = landBy(C.n233, 0.07), w2 = landBy(C.n362, 0.07);
    var g1 = out3(beat(a0, w1[0], w1[1])), g2 = inOut3(beat(a0, w2[0], w2[1]));
    if (s.line >= 1) { g1 = 1; g2 = 1; }
    var value = g2 > 0 ? lerp(v233, v362, g2) : v233 * g1;
    var l233 = g1 >= 1 ? 1 : 0, l362 = g2 >= 1 ? seg(a0, w2[1], w2[1] + 0.02) : 0;
    if (s.line >= 1) l362 = 1;
    var dl = drawDial(ctx, env, D.x, D.y, D.r, { value: Math.max(0.001, value), ghost: g2 > 0 ? v233 : null, k: 1, p: seg(bp, 0, 1),
      labels: { antes: { text: rot(s, 'antes'), alpha: l233 }, despues: { text: rot(s, 'despues'), alpha: l362 } } });
    // «+55%» lands whole just before it is said.
    var w3 = landBy(C.n55, 0.05), np = s.line >= 1 ? 1 : beat(a0, w3[0], w3[1]);
    var Lb = null;
    if (np > 0) Lb = hero(ctx, env, rot(s, 'aumento'), INC.big.x, INC.big.y, INC.big.size, { seed: 'v08:55', p: np });
    // One ries-1 tag from the first number on, with its scope; threads to each number.
    // The tag sits above-right of every number, so each thread leaves its hole leftward or down.
    if (l233 > 0 && dl.antes) {
      var tg = sourceTag(ctx, env, 'ries-1', INC.tag.x, INC.tag.y, dl.antes.right, l233, { scope: true, scale: 1.08 });
      if (dl.despues && l362 > 0) extraThread(ctx, env, tg, dl.despues.right, 'inc362', l362);
      if (Lb && np > 0) extraThread(ctx, env, tg, { x: INC.big.x + 10, y: INC.big.y + 14 }, 'inc55', np);
    }
    var lp = out3(beat(a1, 0, 0.3));
    if (lp > 0) env.fig.lectora(ctx, INC.lectora.x, INC.lectora.y, INC.lectora.k, { pose: 'asking', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 4 · denominador — the dial, small, keeps its exact needles and tag; beside it the town grows:
  // more lamps on more desks (more use), more mailboxes (more reporting); a fraction draws on with
  // «incidentes» on top and an EMPTY dotted box below: the KB gives no rate, so none is drawn.
  // Then the lamps' windows cloud over (less technical transparency).

  var DEN = {
    board: { x: 56, y: 70, w: 330, h: 270 }, dial: { x: 222, y: 222, r: 76 },
    tag: { x: 404, y: 40 },
    // Desks with a lamp each (use) and mailboxes (reporting); n = the beat that brings them.
    desks: [{ x: 486, n: 0 }, { x: 666, n: 0 }, { x: 846, n: 1 }, { x: 1026, n: 1 }, { x: 1176, n: 2 }],
    mail: [{ x: 576, n: 0 }, { x: 756, n: 1 }, { x: 936, n: 2 }, { x: 1110, n: 3 }],
    floor: 548, deskK: 0.32, mailK: 0.5,
    houses: [[470, 102, 110, 'rojo'], [640, 96, 128, 'amarillo'], [820, 112, 100, 'verde'], [1000, 98, 118, 'rojo'], [1170, 104, 108, 'azul']],
    frac: { x: 1010, top: 74, bar: 150, box: { x0: 852, x1: 1168, y0: 172, y1: 262 }, label: 276 }
  };

  // A straight-edged shape for static grounds: a flat field offset from its outline (lithograph
  // style) and one brush stroke per edge, so corners stay sharp (smoothed outlines turn a house
  // into an egg).
  function polyInk(g, env, pts, fill, seed, o) {
    o = o || {};
    var ink = env.ink, n = pts.length / 2, i;
    if (fill) {
      g.save();
      g.translate(o.ox == null ? 3 : o.ox, o.oy == null ? 2 : o.oy);
      g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
      g.beginPath();
      for (i = 0; i < n; i++) { if (i) g.lineTo(pts[2 * i], pts[2 * i + 1]); else g.moveTo(pts[0], pts[1]); }
      g.closePath();
      g.fillStyle = fill;
      g.fill();
      if (ink.gouachePattern) { g.fillStyle = ink.gouachePattern(g, 1); g.fill(); }
      g.restore();
    }
    for (i = 0; i < n; i++) {
      if (o.open && i === n - 1) break;
      var x0 = pts[2 * i], y0 = pts[2 * i + 1], x1 = pts[(2 * i + 2) % (2 * n)], y1 = pts[(2 * i + 3) % (2 * n)];
      ink.line(g, [x0, y0, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2 - 0.6, x1, y1], { w: o.w || 3.2, profile: 'even', seed: seed + ':' + i });
    }
  }

  // A small house: a body and a pitched roof, straight-edged.
  function house(g, env, x, base, w, h, color, seed) {
    var m = env.pal.mundo;
    polyInk(g, env, [x - w / 2, base, x - w / 2, base - h, x + w / 2, base - h, x + w / 2, base], env.pal.mix(m[color] || color, m.lienzo, 0.55), seed);
    polyInk(g, env, [x - w / 2 - 12, base - h, x, base - h - w * 0.42, x + w / 2 + 12, base - h], m[color] === m.rojo ? m.tierra : m.rojo, seed + 'r');
  }

  function denominadorLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink;
    ink.background(g, 'personas', { seed: 'v08:pagina' });
    // The town's ground and its rooftops behind the desks.
    DEN.houses.forEach(function (h, i) { house(g, env, h[0], DEN.floor, h[2], h[1], h[3], 'v08:casa' + i); });
    ink.line(g, [404, 548, 700, 552, 1000, 546, 1236, 550], { w: 4, profile: 'swell', seed: 'v08:suelo' });
    return { bg: c };
  }

  function denominador(ctx, s, env) {
    var C = cuesOf(s, 'denominador'), ink = env.ink, fig = env.fig, m = env.pal.mundo, a0 = s.at(0), a1 = s.at(1);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    // The dial, with its exact needles, rótulos and tag, from the first frame (the figure stays).
    board(ctx, env, DEN.board, intro, null, null);
    var v233 = env.chart.parseValue(s.state.inc.antes).value, v362 = env.chart.parseValue(s.state.inc.despues).value;
    var dl = drawDial(ctx, env, DEN.dial.x, DEN.dial.y, DEN.dial.r, { value: v362, ghost: v233, k: 0.62, p: intro,
      labels: { antes: { text: s.state.inc.antes, alpha: intro }, despues: { text: s.state.inc.despues, alpha: intro } } });
    if (dl.antes && dl.despues) {
      // Right of and above both rótulos: the threads leave the hole leftward.
      var tg = sourceTag(ctx, env, 'ries-1', DEN.tag.x, DEN.tag.y, dl.antes.right, intro, { scale: 0.96 });
      extraThread(ctx, env, tg, dl.despues.right, 'den362', intro);
    }
    // «los conteos se revisan»: a pencil circles the count, softly.
    var rv = beat(a0, C.revisan - 0.02, C.revisan + 0.12);
    if (rv > 0 && dl.despues) {
      var lb = dl.despues;
      ink.line(ctx, stable(env, 'v08:revisa', circlePts(lb.x + lb.w / 2, lb.y + lb.h / 2, Math.max(lb.w, 40) * 0.7, 14, -1.2).concat([lb.x + lb.w * 0.9, lb.y - 2])),
        { w: 2.4, profile: 'even', seed: 'v08:revisa', p: rv, color: m.rojo });
    }
    // The town grows: desks with lamps (use), then mailboxes (reporting).
    var dueUse = [0, C.uso - 0.03, C.uso + 0.03], dueRep = [0, C.reporte - 0.06, C.reporte - 0.01, C.reporte + 0.05];
    var dim = s.line >= 1 ? 0.7 * beat(a1, C.transparencia - 0.02, C.transparencia + 0.12) : 0;
    DEN.desks.forEach(function (d, i) {
      var p = d.n === 0 ? intro : s.line >= 1 ? 1 : beat(a0, dueUse[d.n] - 0.03, dueUse[d.n] + 0.05);
      if (p <= 0) return;
      var top = fig.desk(ctx, d.x, DEN.floor, DEN.deskK, { p: p }).top;
      if (p >= 0.6) fig.lamp(ctx, d.x + 10, top.y - 22 + Math.sin(s.t * 0.8 + i) * 1.2, 0.34, { t: s.t + i, dim: dim, p: seg(p, 0.6, 1) });
    });
    DEN.mail.forEach(function (d, i) {
      var p = d.n === 0 ? intro : s.line >= 1 ? 1 : beat(a0, dueRep[d.n] - 0.03, dueRep[d.n] + 0.04);
      if (p > 0) fig.mailbox(ctx, d.x, DEN.floor, DEN.mailK, { seed: 'v08:buzon' + i, p: p });
    });
    // The fraction: «incidentes» over a bar, an empty dotted box below — never filled.
    var F = DEN.frac, fp = beat(a1, C.denominador - 0.06, C.denominador + 0.04);
    if (fp > 0) {
      label(ctx, env, rot(s, 'numerador'), F.x, F.top, 44, { align: 'center', seed: 'v08:numerador', p: fp });
      ink.line(ctx, s.state.den.bar, { w: 6, profile: 'blunt', seed: 'v08:barra', p: seg(fp, 0.3, 0.8) });
      ink.dotted(ctx, s.state.den.box, { closed: true, r: 2.6, gap: 13, seed: 'v08:caja', p: seg(fp, 0.5, 1) });
      ink.arrow(ctx, s.state.den.link, { dotted: true, w: 2.4, headSize: 12, seed: 'v08:enlace', p: seg(fp, 0.2, 0.9) });
    }
    var tp = beat(a1, C.tasa - 0.03, C.tasa + 0.05);
    if (tp > 0) ink.text(ctx, rot(s, 'denominador'), F.x, F.label, { size: 25, italic: true, weight: 700, align: 'center', maxWidth: 360, p: tp });
  }

  // ---------------------------------------------------------------------------------------------
  // 5 · trampa — a ruled exam room (navy): the lamp passes the sign «evaluación en curso» and its
  // glow changes; it finds a gap in the ruled fence of the test and slips a token through it; the
  // term «reward hacking» is lettered on the page (the player's margin note gives its KB
  // definition). Then warm hands patch the gap, an external evaluator watches, a lock is set.

  var TRA = {
    panel: { x: 56, y: 70, w: 790, h: 452 },
    sign: { x: 150, y: 104, w: 276, h: 52 },
    fence: { x: 610, y0: 100, y1: 494, gap0: 300, gap1: 352 },
    tray: { x: 690, y: 300, w: 110, h: 56 },
    termino: { x: 1062, y: 92, size: 44 },
    desks: { x0: 120, y0: 392, dx: 136, dy: 62, w: 92, h: 30, cols: 3, rows: 2 },
    evaluadora: { x: 1074, y: 562, k: 2.2 },
    lock: { x: 610, y: 430 }
  };

  function trampa(ctx, s, env) {
    var C = cuesOf(s, 'trampa'), st = s.state.trampa, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina;
    var a0 = s.at(0), a1 = s.at(1), P = TRA.panel, Fn = TRA.fence, S = TRA.sign;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 940, 470, 34, m.amarillo]], intro);
    // The exam room, revealed top to bottom.
    var pr = inOut3(s.intro);
    if (pr > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(P.x - 2, P.y - 2, P.w + 4, (P.h + 4) * pr); ctx.clip();
      fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 14 });
      ctx.restore();
    }
    // The sign «evaluación en curso» (ruled plate) and the fence with its gap.
    var sp = seg(s.intro, 0.4, 1);
    ink.rRect(ctx, S.x, S.y, S.w, S.h, { color: q.linea, w: 1.6, fill: q.noche, p: sp });
    ink.rLine(ctx, S.x + S.w / 2, S.y + S.h, S.x + S.w / 2, S.y + S.h + 26, { color: q.linea, w: 1.4, p: sp });
    ink.text(ctx, rot(s, 'letrero'), S.x + S.w / 2, S.y + 13, { size: 22, weight: 700, align: 'center', color: m.lienzo, p: seg(sp, 0.5, 1) });
    ink.rLine(ctx, Fn.x, Fn.y0, Fn.x, Fn.gap0, { color: q.linea, w: 2.2, p: sp });
    ink.rLine(ctx, Fn.x, Fn.gap1, Fn.x, Fn.y1, { color: q.linea, w: 2.2, p: sp });
    for (var k = 0; k < st.fenceTicks.length; k++) {
      var fy = st.fenceTicks[k];
      ink.rLine(ctx, Fn.x - 9, fy, Fn.x + 9, fy, { color: q.linea, w: 1.3, p: sp });
    }
    // The exam desks: identical, regular (the controlled conditions of a test).
    var Dk = TRA.desks;
    for (var dr = 0; dr < Dk.rows; dr++) for (var dc = 0; dc < Dk.cols; dc++) {
      var dxp = Dk.x0 + dc * Dk.dx, dyp = Dk.y0 + dr * Dk.dy;
      ink.rRect(ctx, dxp, dyp, Dk.w, Dk.h, { color: q.linea, w: 1.2, p: seg(sp, 0.2 + (dr * Dk.cols + dc) * 0.05, 0.6 + (dr * Dk.cols + dc) * 0.05) });
      ink.rLine(ctx, dxp + 12, dyp + Dk.h / 2, dxp + Dk.w - 12, dyp + Dk.h / 2, { color: q.linea, w: 1, alpha: 0.6, p: sp });
    }
    // The score tray beyond the fence.
    var T = TRA.tray;
    ink.rRect(ctx, T.x, T.y, T.w, T.h, { color: q.linea, w: 1.4, p: sp });
    // The lamp's walk: start → past the sign (its glow changes) → to the gap.
    var u = inOut3(beat(a0, C.enganar - 0.04, C.explotan - 0.02));
    var pt = { x: 0, y: 0 };
    var g = st.walk, n = g.length / 2 - 1, f = u * n, i0 = Math.min(n - 1, Math.floor(f)), fr = f - i0;
    pt.x = lerp(g[i0 * 2], g[i0 * 2 + 2], fr); pt.y = lerp(g[i0 * 2 + 1], g[i0 * 2 + 3], fr);
    // Near the sign it «behaves»: the glow brightens; past it, back to normal.
    var nearSign = clamp01(1 - Math.abs(pt.x - (S.x + S.w / 2)) / 150) * beat(a0, C.detectan - 0.06, C.detectan);
    var lampP = seg(s.intro, 0.5, 1);
    if (lampP > 0) fig.lamp(ctx, pt.x, pt.y + Math.sin(s.t * 0.9) * 2, 0.5, { t: s.t, glow: 1 + 1.2 * nearSign, p: lampP });
    // The token slips through the gap into the tray; the tray lights its ruled check.
    var tk = inOut3(beat(a0, C.explotan, C.explotan + 0.12));
    if (tk > 0) {
      var tx = lerp(pt.x + 30, T.x + 40, tk), ty = lerp(pt.y, T.y + T.h / 2, tk) - Math.sin(Math.PI * tk) * 8;
      ink.rRect(ctx, tx - 8, ty - 8, 16, 16, { color: q.brilloMagenta, w: 1.4, fill: q.noche });
      if (tk >= 1) ink.rPoly(ctx, [T.x + 66, T.y + 28, T.x + 76, T.y + 38, T.x + 94, T.y + 16], { color: q.brilloVerde, w: 2 });
    }
    // The term, lettered on the page.
    var tp = beat(a0, C.termino - 0.03, C.termino + 0.12);
    if (tp > 0) label(ctx, env, rot(s, 'termino'), TRA.termino.x, TRA.termino.y, TRA.termino.size, { align: 'center', seed: 'v08:termino', underline: true, p: tp });
    // Line 2: the human controls.
    var ep = out3(beat(a1, 0, 0.25));
    if (ep > 0) fig.person(ctx, TRA.evaluadora.x, TRA.evaluadora.y, TRA.evaluadora.k, { role: 'investigadora', pose: 'writing', prop: 'clipboard', facing: -1,
      seed: 'v08:evaluadora', skin: 4, hair: 'braids', p: ep });
    var patch = beat(a1, C.externa - 0.04, C.externa + 0.08);
    if (patch > 0) ink.line(ctx, st.patch, { w: 9, profile: 'swell', seed: 'v08:remiendo', p: patch, color: m.rojo });
    var mp = beat(a1, C.monitoreo - 0.03, C.monitoreo + 0.1);
    if (mp > 0) ink.dotted(ctx, st.sight, { r: 2.4, gap: 14, seed: 'v08:mirada', p: mp });
    var lk = beat(a1, C.controles - 0.03, C.controles + 0.06);
    if (lk > 0) fig.lock(ctx, TRA.lock.x, TRA.lock.y, 0.62, { seed: 'v08:candado', p: lk });
  }

  // ---------------------------------------------------------------------------------------------
  // The AI Act timeline (ley · plazos · omnibus): one paper strip; every pin at the exact x of its
  // date on the frame's one linear time scale. The camera zooms between scenes (the view's date
  // range eases from the previous scene's), so positions stay proportional in every frame.

  var TL = { x0: 70, x1: 1210, y: 282, h: 30, paper: { x: 46, w: 1188 } };
  var VIEW = {
    ley: [day(2024, 6, 1), day(2026, 4, 1)],
    plazos: [day(2024, 6, 1), day(2027, 12, 1)],
    omnibus: [day(2025, 4, 1), day(2028, 11, 1)]
  };
  var ZOOM = 1.8;   // seconds of camera zoom at the start of plazos and omnibus

  function viewAt(s, from, to) {
    var e = from ? inOut3(seg(s.t, 0, ZOOM)) : 1, f = from || to;
    var d0 = lerp(f[0], to[0], e), d1 = lerp(f[1], to[1], e);
    return function (d) { return TL.x0 + (d - d0) / (d1 - d0) * (TL.x1 - TL.x0); };
  }

  // The strip, unrolled up to x = xu (a paper roll sits at its end), with an unlabeled tick at each
  // new year (an honest scale cue; years that only name a moment are not written).
  function strip(ctx, s, env, sc, xu, p) {
    var ink = env.ink, m = env.pal.mundo, x = TL.paper.x, y = TL.y;
    xu = Math.min(xu, x + TL.paper.w);
    if (xu <= x + 4 || p <= 0) return;
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.beginPath(); ctx.rect(x - 8, y - 20, xu - x + 8, TL.h + 40); ctx.clip();
    ink.card(ctx, x, y, TL.paper.w, TL.h, { seed: 'v08:tira', weight: 3.4, radius: 5 });
    ctx.strokeStyle = env.pal.mix(m.tinta, m.lienzo, 0.4);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var yr = 2025; yr <= 2028; yr++) {
      var tx = sc(day(yr, 1, 1));
      if (tx < x + 8 || tx > xu - 6) continue;
      ctx.moveTo(tx, y + 8); ctx.lineTo(tx, y + TL.h - 8);
    }
    ctx.stroke();
    ctx.restore();
    if (xu < x + TL.paper.w - 2) {
      // The roll still to unroll.
      ctx.save();
      ctx.globalAlpha *= p;
      ink.circle(ctx, xu + 6, y + TL.h / 2, 20, { fill: m.lienzoOcre, w: 3.2, seed: 'v08:rollo' });
      ctx.restore();
      rollSpiral(ctx, s, env, xu, p);
    }
  }
  // The roll's spiral is drawn around (0, 0): place it with a translate.
  function rollSpiral(ctx, s, env, xu, p) {
    if (p <= 0 || xu >= TL.paper.x + TL.paper.w - 2) return;
    ctx.save();
    ctx.translate(xu + 6, TL.y + TL.h / 2);
    ctx.globalAlpha *= p;
    env.ink.line(ctx, s.state.tl.roll, { w: 2, profile: 'even', seed: 'v08:rollo-espiral' });
    ctx.restore();
  }

  // A pin: a red head on the strip and a calligraphic stem up (dir −1) or down (dir 1) to y1.
  function pin(ctx, env, key, x, y1, p, color) {
    if (p <= 0) return;
    var ink = env.ink, m = env.pal.mundo, cy = TL.y + TL.h / 2;
    if (y1 != null) {
      var y0 = y1 < cy ? TL.y - 2 : TL.y + TL.h + 2;
      ink.line(ctx, stable(env, 'v08:tallo:' + key, [x, y0, x + 1, (y0 + y1) / 2, x, y1]), { w: 3, profile: 'blunt', seed: 'v08:tallo' + key, p: seg(p, 0.2, 1) });
    }
    ctx.save();
    ctx.fillStyle = color || m.rojo;
    ctx.beginPath(); ctx.arc(x, cy, 8 * out3(seg(p, 0, 0.4)), 0, TAU); ctx.fill();
    ctx.strokeStyle = m.tinta; ctx.lineWidth = 2;
    if (p >= 0.4) { ctx.beginPath(); ctx.arc(x, cy, 8, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  /* A dated rótulo as a label block: its date heading (bold) and the rest below it. o: x (anchor),
   * align ('left' | 'center' | 'right'), bottom (y of the block's bottom) or top, w, size, p.
   * Returns { x, y, w, h, headEnd: { x, y } }. Fades in whole (dates never write on glyph by glyph). */
  function dateLabel(ctx, env, text, o) {
    var ink = env.ink, parts = splitHead(text), size = o.size || 21;
    var ho = { size: size + 2, weight: 700, font: 'display', maxWidth: o.w, align: o.align || 'left', lineHeight: 1.1 };
    var ro = { size: size, maxWidth: o.w, align: o.align || 'left', lineHeight: 1.2 };
    var hl = ink.measureText(ctx, parts.head, ho), rl = parts.rest ? ink.measureText(ctx, parts.rest, ro) : { h: 0, w: 0 };
    var hgt = hl.h + (parts.rest ? 2 + rl.h : 0);
    var top = o.top != null ? o.top : o.bottom - hgt;
    if (o.p > 0) {
      ho.p = o.p; ro.p = o.p;
      ink.text(ctx, parts.head, o.x, top, ho);
      if (parts.rest) ink.text(ctx, parts.rest, o.x, top + hl.h + 2, ro);
    }
    var bw = Math.max(hl.w, rl.w), bx = o.align === 'center' ? o.x - bw / 2 : o.align === 'right' ? o.x - bw : o.x;
    return { x: bx, y: top, w: bw, h: hgt, headEnd: { x: bx + hl.w + 6, y: top + hl.h * 0.55 } };
  }

  // ---------------------------------------------------------------------------------------------
  // 6 · ley — the strip unrolls; «1 de agosto de 2024: entra en vigor» and «2 de febrero de 2025:
  // prohibiciones y alfabetización en IA» are pinned as they are said (one tag for the two context
  // figures, a thread to each); then «2 de agosto de 2025: obligaciones…» (ries-3) and its three
  // small cards, one per obligation as it is said.

  var LEY = {
    labels: { vigor: { w: 250, align: 'center', bottom: 252 }, prohibiciones: { w: 280, align: 'center', bottom: 252 }, gpai: { w: 244, align: 'left', bottom: 216, dx: -150 } },
    ctxTag: { x: 508, y: 328 },
    gpaiTag: { x: 912, y: 64 },
    cards: { x: 520, y: 388, w: 362, gap: 8, size: 19, keys: ['documentacion', 'derechosAutor', 'resumen'] }
  };

  function ley(ctx, s, env) {
    var C = cuesOf(s, 'ley'), ink = env.ink, m = env.pal.mundo, a0 = s.at(0), a1 = s.at(1);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1180, 470, 36, m.amarillo]], intro);
    var sc = viewAt(s, null, VIEW.ley);
    var unroll = inOut3(beat(a0, 0.01, Math.max(0.12, C.ley + 0.05)));
    var xu = lerp(TL.paper.x, TL.paper.x + TL.paper.w, unroll);
    strip(ctx, s, env, sc, xu, intro);
    // Pins of line 1, landing just before their dates are said.
    var keys = ['vigor', 'prohibiciones'], cues = [C.vigor, C.prohibiciones], heads = [];
    for (var i = 0; i < 2; i++) {
      var r = rot(s, keys[i]), d = dateOf(r), x = sc(d), Lo = LEY.labels[keys[i]];
      var w = landBy(cues[i], 0.05), p = s.line >= 1 ? 1 : beat(a0, w[0], w[1]);
      if (p <= 0 || x > xu) continue;
      pin(ctx, env, keys[i], x, Lo.bottom + 6, p);
      dateLabel(ctx, env, r, { x: x, align: Lo.align, w: Lo.w, bottom: Lo.bottom, p: seg(p, 0.4, 1) });
      heads.push({ x: x, p: p });
    }
    if (heads.length) {
      var cy = TL.y + TL.h + 4;
      var tg = sourceTag(ctx, env, ['ctx-ley-vigor', 'ctx-ley-prohibiciones'], LEY.ctxTag.x, LEY.ctxTag.y, { x: heads[0].x, y: cy }, heads[0].p);
      if (heads[1]) extraThread(ctx, env, tg, { x: heads[1].x, y: cy }, 'ley-prohib', heads[1].p);
    }
    // Line 2: the general-purpose models.
    var rg = rot(s, 'gpai'), xg = sc(dateOf(rg)), Lg = LEY.labels.gpai;
    var wg = landBy(C.gpai, 0.05), pg = beat(a1, wg[0], wg[1]);
    if (pg > 0) {
      pin(ctx, env, 'gpai', xg, Lg.bottom + 6, pg);
      var gl = dateLabel(ctx, env, rg, { x: xg + Lg.dx, align: 'left', w: Lg.w, bottom: Lg.bottom, p: seg(pg, 0.4, 1) });
      sourceTag(ctx, env, 'ries-3', LEY.gpaiTag.x, LEY.gpaiTag.y, gl.headEnd, pg);
      // Its three cards hang under the pin, one per obligation as it is said.
      var K = LEY.cards, cc = [C.c0, C.c1, C.c2];
      ink.line(ctx, s.state.ley.cardString, { w: 2, profile: 'hair', seed: 'v08:hilo-tarjetas', p: beat(a1, cc[0] - 0.05, cc[0]) });
      var cyy = K.y;
      for (var c = 0; c < 3; c++) {
        var to = { size: K.size, weight: 700, align: 'center', maxWidth: K.w - 30, lineHeight: 1.15 };
        var lay = ink.measureText(ctx, rot(s, K.keys[c]), to), ch = lay.h + 22;
        var cp = beat(a1, cc[c] - 0.03, cc[c] + 0.05);
        if (cp > 0) {
          ctx.save();
          ctx.translate(K.x + K.w / 2, cyy + ch / 2);
          ctx.rotate((c - 1) * 0.012);
          ink.card(ctx, -K.w / 2, -ch / 2, K.w, ch, { seed: 'v08:obligacion' + c + '|' + Math.round(ch), weight: 3, radius: 8, p: cp });
          to.p = seg(cp, 0.4, 1);
          ink.text(ctx, rot(s, K.keys[c]), 0, -lay.h / 2, to);
          ctx.restore();
        }
        cyy += ch + K.gap;
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 7 · plazos — the camera pulls back and the strip unrolls further; the earlier pins stay as bare
  // pins (no dates written, so no numbers without tags); «2 de agosto de 2026: …» and «2 de agosto de
  // 2027: …» are pinned as they are said, with one ries-3 tag (a thread to each).

  var PLA = {
    mayoria: { w: 400, align: 'center', bottom: 252 },
    previos: { w: 300, align: 'center', top: 346 },
    tag: { x: 900, y: 470 }
  };

  function plazos(ctx, s, env) {
    var C = cuesOf(s, 'plazos'), st = s.state.tl, a0 = s.at(0), m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 70, 90, 34, m.amarillo], ['luna', 1190, 520, 40]], intro);
    var sc = viewAt(s, VIEW.ley, VIEW.plazos);
    // The paper already unrolled stays; the rest unrolls when the line starts.
    var end0 = TL.paper.x + TL.paper.w, xu = lerp(Math.min(end0, sc(VIEW.ley[1])), end0, inOut3(beat(a0, 0.0, 0.1)));
    strip(ctx, s, env, sc, xu, 1);
    st.earlier.forEach(function (e) { pin(ctx, env, 'pre' + e.key, sc(e.day), null, 1); });
    var r1 = rot(s, 'mayoria'), r2 = rot(s, 'previos'), x1 = sc(dateOf(r1)), x2 = sc(dateOf(r2));
    var w1 = landBy(C.mayoria, 0.05), w2 = landBy(C.previos, 0.05);
    var p1 = beat(a0, w1[0], w1[1]), p2 = beat(a0, w2[0], w2[1]);
    var t1 = null, t2 = null;
    if (p1 > 0 && x1 <= xu) {
      pin(ctx, env, 'mayoria', x1, PLA.mayoria.bottom + 6, p1);
      t1 = dateLabel(ctx, env, r1, { x: x1, align: 'center', w: PLA.mayoria.w, bottom: PLA.mayoria.bottom, p: seg(p1, 0.4, 1) });
    }
    if (p2 > 0 && x2 <= xu) {
      var cx = Math.min(x2, TL.paper.x + TL.paper.w - PLA.previos.w / 2);
      pin(ctx, env, 'previos', x2, PLA.previos.top - 6, p2);
      t2 = dateLabel(ctx, env, r2, { x: cx, align: 'center', w: PLA.previos.w, top: PLA.previos.top, p: seg(p2, 0.4, 1) });
    }
    if (t1) {
      // Below-right: the thread to «2026» runs up-left, the one to «2027» straight up.
      var tg = sourceTag(ctx, env, 'ries-3', PLA.tag.x, PLA.tag.y, { x: x1, y: TL.y + TL.h + 4 }, p1);
      if (t2) extraThread(ctx, env, tg, { x: tg.hole.x + 4, y: t2.y + t2.h + 4 }, 'pla-previos', p2);
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 8 · omnibus — the camera moves on to 2025–2028; the general-purpose-model pins stay, each
  // marked «sin cambios»; a new sheet «Ómnibus Digital · Reglamento (UE) 2026/1744» is stapled under
  // the strip (ries-4, «Actualización»); the strip unrolls further and two high-risk pins land, each
  // stamped «aplazado» (no earlier date is drawn for them: the KB gives none); then the two other
  // rules appear on the sheet as cards of plain text; the lectora draws the conclusion.

  var OMN = {
    gpaiHead: { bottom: 236, w: 200, size: 19 },
    sinCambios: { dy: 18 },
    anexos: [{ key: 'anexoIII', align: 'left', dx: -96, w: 180 }, { key: 'anexoI', align: 'right', dx: 90, w: 206 }],
    anexoBottom: 168,
    sheet: { x: 280, y: 300, w: 430, h: 262 },
    cards: { dx: 22, y: [384, 466], w: 386, keys: ['prohibiciones', 'sandbox'] },
    gpaiTag: { x: 64, y: 72 },
    sheetTag: { x: 728, y: 348 },
    lectora: { x: 1146, y: 566, k: 2.05 }
  };

  // A rubber stamp pressed in ink: a tilted ruled-free brush box with a word (from data).
  function wordStamp(ctx, env, text, x, y, p, seed, color) {
    if (p <= 0) return;
    var ink = env.ink, m = env.pal.mundo, press = seg(p, 0, 0.5), k = 1 + 0.2 * (1 - press) * (1 - press);
    var L = ink.measureText(ctx, text, { size: 20, weight: 700 });
    var w = L.w + 26, h = 34;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.09);
    ctx.scale(k, k);
    ctx.globalAlpha *= clamp01(press * 1.6) * 0.92;
    ink.card(ctx, -w / 2, -h / 2, w, h, { seed: seed, weight: 3, radius: 6, fill: 'rgba(0,0,0,0)', outline: color || m.rojo, grain: false });
    ink.text(ctx, text, 0, -12, { size: 20, weight: 700, align: 'center', color: color || m.rojo });
    ctx.restore();
  }

  function omnibus(ctx, s, env) {
    var C = cuesOf(s, 'omnibus'), st = s.state.tl, ink = env.ink, m = env.pal.mundo, a0 = s.at(0), a1 = s.at(1), a2 = s.at(2);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    var sc = viewAt(s, VIEW.plazos, VIEW.omnibus);
    var end0 = TL.paper.x + TL.paper.w;
    // The strip ends where plazos left it until the high-risk rules are said, then unrolls on.
    var xu = lerp(Math.min(end0, sc(VIEW.plazos[1])), end0, inOut3(beat(a0, C.aplazo - 0.04, C.aplazo + 0.04)));
    strip(ctx, s, env, sc, xu, 1);
    // The general-purpose-model pins with their dates (ries-3) and «sin cambios».
    var scp = s.line >= 1 ? 1 : beat(a0, C.sinCambios - 0.02, C.sinCambios + 0.08);
    var heads = [];
    st.gpai.forEach(function (g, i) {
      var x = sc(g.day);
      if (x < TL.x0 - 30) return;
      var H2 = OMN.gpaiHead;
      pin(ctx, env, 'g' + i, x, H2.bottom + 4, 1);
      var lb = dateLabel(ctx, env, g.head, { x: x, align: 'center', w: H2.w, bottom: H2.bottom - 20, size: H2.size, p: intro });
      heads.push({ x: x, lb: lb });
      if (scp > 0) ink.text(ctx, rot(s, 'sinCambios'), x, H2.bottom - 16, { size: 18, italic: true, weight: 700, align: 'center', color: m.verde, p: seg(scp, i * 0.15, 0.5 + i * 0.15) });
    });
    if (heads.length) {
      // One tag for the group of general-purpose-model dates, tied straight down to the first one
      // (a thread to the others would cross the tag's own text); the row reads as one group.
      sourceTag(ctx, env, 'ries-3', OMN.gpaiTag.x, OMN.gpaiTag.y, { x: OMN.gpaiTag.x + 18, y: heads[0].lb.y - 2 }, intro);
    }
    // The Ómnibus sheet, stapled under the strip.
    var S = OMN.sheet, hp = beat(a0, C.hoja - 0.04, C.hoja + 0.06), tg4 = null;
    if (hp > 0) {
      ctx.save();
      ctx.translate(S.x + S.w / 2, S.y + S.h / 2 - (1 - out3(hp)) * 30);
      ctx.rotate(-0.015);
      ink.card(ctx, -S.w / 2, -S.h / 2, S.w, S.h, { seed: 'v08:omnibus', weight: 3.8, radius: 6, p: hp });
      label(ctx, env, rot(s, 'hoja'), -S.w / 2 + 24, -S.h / 2 + 22, 27, { maxWidth: S.w - 48, maxLines: 2, seed: 'v08:hoja-titulo', p: seg(hp, 0.4, 1) });
      ctx.restore();
      // Two staples through the sheet's top edge into the strip.
      if (hp >= 0.7) [S.x + 60, S.x + S.w - 60].forEach(function (gx) {
        var sy = TL.y + TL.h + 4;
        ink.rPoly(ctx, [gx - 13, sy + 5, gx - 13, sy, gx + 13, sy, gx + 13, sy + 5], { color: m.tinta, w: 2.6 });
      });
      tg4 = sourceTag(ctx, env, 'ries-4', OMN.sheetTag.x, OMN.sheetTag.y, { x: S.x + S.w - 6, y: S.y + 44 }, seg(hp, 0.3, 1));
    }
    // The two postponed high-risk pins, further right; each stamped «aplazado».
    var acues = [C.anexoIII, C.anexoI];
    OMN.anexos.forEach(function (A, i) {
      var r = rot(s, A.key), x = sc(dateOf(r)), w = landBy(acues[i], 0.05), p = s.line >= 1 ? 1 : beat(a0, w[0], w[1]);
      if (p <= 0 || x > xu + 2) return;
      pin(ctx, env, A.key, x, OMN.anexoBottom + 6, p, m.amarillo);
      var lb = dateLabel(ctx, env, r, { x: x + A.dx, align: A.align, w: A.w, bottom: OMN.anexoBottom, p: seg(p, 0.4, 1) });
      var stp = s.line >= 1 ? 1 : beat(a0, w[1] + 0.01, w[1] + 0.06);
      // Highlight while the lectora draws the conclusion.
      var hl = s.line >= 2 ? beat(a2, 0.1, 0.4) * (0.6 + 0.4 * Math.sin(s.t * 2)) : 0;
      var sy = lb.y - 24, sx = A.align === 'left' ? lb.x + 60 : lb.x + lb.w - 60;
      if (hl > 0) ink.glow(ctx, sx, sy, 60, m.amarillo, 0.55 * hl);
      wordStamp(ctx, env, rot(s, 'aplazado'), sx, sy, stp, 'v08:aplazado' + i);
      // A dotted guide along the strip's foot from the stapled sheet to the pin it adds.
      if (hp > 0) {
        var gy = TL.y + TL.h + 9, gx0 = S.x + S.w - 30;
        ink.dotted(ctx, stable(env, 'v08:guia' + i, [gx0, gy, (gx0 + x) / 2, gy + 1, x, gy]), { r: 2, gap: 11, seed: 'v08:guia' + i, p: p });
      }
    });
    // Line 2: two cards of plain text on the sheet (never illustrated).
    if (hp > 0) {
      var K = OMN.cards, kc = [C.prohibe, C.sandbox];
      for (var c = 0; c < 2; c++) {
        var cp = beat(a1, kc[c] - 0.04, kc[c] + 0.04);
        if (s.line >= 2) cp = 1;
        if (cp <= 0) continue;
        var to = { size: 19, weight: 700, maxWidth: K.w - 32, lineHeight: 1.16 }, lay = ink.measureText(ctx, rot(s, K.keys[c]), to);
        ink.card(ctx, S.x + K.dx, K.y[c], K.w, lay.h + 22, { seed: 'v08:regla' + c + '|' + Math.round(lay.h), weight: 2.8, radius: 8, p: cp });
        to.p = seg(cp, 0.4, 1);
        ink.text(ctx, rot(s, K.keys[c]), S.x + K.dx + 16, K.y[c] + 11, to);
      }
    }
    // Line 3: the lectora.
    var lp = out3(beat(a2, 0, 0.3));
    if (lp > 0) env.fig.lectora(ctx, OMN.lectora.x, OMN.lectora.y, OMN.lectora.k, { pose: 'pointing', facing: -1, p: lp });
  }

  // ---------------------------------------------------------------------------------------------
  // 9 · por-que-importa — a calligraphic sea between two shores; threads join a Latin American
  // university and a company to European partners and providers as they are said; small stars
  // (the international reference) rise over the sea; the note «Información, no asesoría jurídica».

  var PQI = {
    uni: { x: 120, y: 452 }, firm: { x: 300, y: 456 }, partner: { x: 990, y: 458 }, provider: { x: 1170, y: 454 },
    note: { x: 446, y: 64, w: 388, h: 66 }
  };

  function porQueLayer(env) {
    var c = env.canvas(W, H), g = c.getContext('2d'), ink = env.ink, m = env.pal.mundo, pal = env.pal;
    ink.background(g, 'territorio', { seed: 'v08:orillas', horizon: 0.6, contours: false });
    // The sea, from the horizon down, between the two shores; calligraphic waves on it.
    ink.shape(g, [300, 436, 640, 430, 980, 436, 1010, 660, 270, 660], { fill: m.azul, fillAlpha: 0.9, w: 3.4, seed: 'v08:mar', poly: true });
    for (var i = 0; i < 3; i++) ink.line(g, ink.wavePoints(470 + i * 20, 462 + i * 34, 820 - i * 24, 5, 48, i), { w: 2.8, profile: 'swell', seed: 'v08:ola' + i, color: m.celeste });
    // Two shores (no borders, no flags): biomorphic land on each side.
    ink.shape(g, [-20, 452, 160, 440, 330, 446, 470, 470, 510, 680, -20, 680], { fill: m.tierra, w: 3.6, seed: 'v08:orilla1' });
    ink.shape(g, [800, 474, 900, 448, 1060, 440, 1300, 450, 1300, 680, 770, 680], { fill: m.verde, w: 3.6, seed: 'v08:orilla2' });
    // A university (pediment and columns) and a company (a block of windows) on each shore.
    function building(x, base, w, h, color, kind, seed) {
      polyInk(g, env, [x - w / 2, base, x - w / 2, base - h, x + w / 2, base - h, x + w / 2, base], pal.mix(color, m.lienzo, 0.3), seed);
      if (kind === 'uni') {
        polyInk(g, env, [x - w / 2 - 14, base - h, x, base - h - 44, x + w / 2 + 14, base - h], m.rojo, seed + 'r');
        for (var k = 0; k < 4; k++) {
          var cx = x - w / 2 + 18 + k * (w - 36) / 3;
          ink.line(g, [cx, base - 6, cx + 1, base - h / 2, cx, base - h + 10], { w: 3.6, profile: 'blunt', seed: seed + 'c' + k });
        }
      } else {
        for (var r = 0; r < 3; r++) for (var q = 0; q < 3; q++) {
          var wx = x - w / 2 + 14 + q * (w - 28) / 3, wy = base - h + 16 + r * (h - 30) / 3;
          polyInk(g, env, [wx, wy, wx + 20, wy, wx + 20, wy + 22, wx, wy + 22], m.amarillo, seed + 'v' + r + q, { w: 2 });
        }
      }
    }
    building(PQI.uni.x, PQI.uni.y, 150, 112, m.lienzoOcre, 'uni', 'v08:uni');
    building(PQI.firm.x, PQI.firm.y, 112, 134, m.celeste, 'firm', 'v08:empresa');
    building(PQI.partner.x, PQI.partner.y, 140, 106, m.lienzoOcre, 'uni', 'v08:socio');
    building(PQI.provider.x, PQI.provider.y, 112, 128, m.siena, 'firm', 'v08:proveedor');
    return { bg: c };
  }

  function porQueImporta(ctx, s, env) {
    var C = cuesOf(s, 'por-que-importa'), st = s.state.pqi, ink = env.ink, fig = env.fig, m = env.pal.mundo, a0 = s.at(0), a1 = s.at(1);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['sol', 1180, 100, 50, m.rojo], ['pajaro', 160, 120, 70]], intro);
    // People on both shores.
    fig.person(ctx, 214, 552, 1.3, { role: 'docente', pose: 'pointing', seed: 'v08:docente', skin: 3, hair: 'curly', facing: 1, p: intro });
    fig.person(ctx, 400, 552, 1.25, { role: 'directiva', pose: 'presenting', seed: 'v08:directiva', skin: 1, hair: 'bun', facing: 1, p: intro });
    fig.person(ctx, 1078, 552, 1.25, { role: 'investigadora', pose: 'waving', seed: 'v08:socia', skin: 0, hair: 'long', facing: -1, p: intro });
    // Threads across the sea, one per relationship as it is said (dotted, warm).
    var cues = [C.servicios, C.socios, C.proveedores];
    for (var i = 0; i < st.threads.length; i++) {
      var tp = s.line >= 1 ? 1 : beat(a0, cues[i] - 0.04, cues[i] + 0.1);
      if (tp > 0) ink.arrow(ctx, st.threads[i], { dotted: true, w: 3, gap: 12, headSize: 14, seed: 'v08:hilo-mar' + i, p: tp, color: [m.rojo, m.tinta, m.rojo][i] });
    }
    // The international reference: a few small stars rise over the sea.
    var rp = beat(a1, C.referencia - 0.04, C.referencia + 0.16);
    for (var k = 0; k < st.stars.length; k++) {
      var sp = seg(rp, k * 0.12, 0.5 + k * 0.1);
      if (sp > 0) fig.sign(ctx, 'estrella', st.stars[k][0], st.stars[k][1] + Math.sin(s.t * 0.8 + k) * 3, st.stars[k][2], { seed: 'v08:ref' + k, colors: { a: m.amarillo }, p: sp });
    }
    var np = beat(a1, C.nota - 0.04, C.nota + 0.06);
    if (np > 0) pinnedNote(ctx, env, rot(s, 'nota'), { x: PQI.note.x, y: PQI.note.y, w: PQI.note.w, h: PQI.note.h, size: 21, padT: 22, align: 'center', weight: 700 }, np, 'v08:nota-juridica');
  }

  // ---------------------------------------------------------------------------------------------
  // 10 · volante — lámina D14's metaphor: a large warm steering wheel with a brake disc; around its
  // rim the six numbered stations draw on in order as they are said; arrows join them and the
  // last returns to the first; the wheel turns slowly and a small token goes round the cycle.

  var VOL = { cx: 640, cy: 292, k: 0.86, rx: 318, ry: 206, st: 23, labelW: 210, size: 24, a0: -Math.PI / 3 };

  function wheelDrawings(env) {
    var m = env.pal.mundo;
    var d = env.ink.drawing('v08:disco', { w: 4, jitter: 0.4 });
    // The brake disc: a flat blue disc with ventilation slots in a ring (not dots on red: that
    // would read as a ladybird), a cream hub; the red caliper grips its rim and does not turn.
    d.circle(0, 0, 62, { fill: '@a', w: 4 });
    d.stroke(circlePts(0, 0, 50, 24), { w: 2, closed: true, profile: 'even', overshoot: false });
    for (var i = 0; i < 8; i++) { var a = i / 8 * TAU; d.stroke([Math.cos(a) * 26, Math.sin(a) * 26, Math.cos(a + 0.18) * 40, Math.sin(a + 0.18) * 40], { w: 3.4, profile: 'blunt', color: '@b' }); }
    d.circle(0, 0, 15, { fill: '@b', w: 2.6 });
    var cal = env.ink.drawing('v08:pinza', { w: 3.4, jitter: 0.4 });
    cal.shape([34, -64, 62, -46, 76, -14, 58, -12, 46, -36, 26, -50], { fill: '@a', w: 3 });
    var w = env.ink.drawing('v08:volante', { w: 4, jitter: 0.5 });
    w.stroke(circlePts(0, 0, 150, 36), { w: 22, closed: true, profile: 'even', color: '@wood', overshoot: false });
    w.stroke(circlePts(0, 0, 162, 36), { w: 4, closed: true, profile: 'outline', overshoot: false });
    w.stroke(circlePts(0, 0, 138, 36), { w: 4, closed: true, profile: 'outline', overshoot: false });
    for (i = 0; i < 3; i++) w.shape(rotPts([20, -9, 140, -12, 140, 12, 20, 9], Math.PI / 2 + i * TAU / 3), { fill: '@wood', w: 3.4 });
    w.circle(0, 0, 32, { fill: '@hub', w: 4 });
    return {
      disc: d.done({ colors: { a: m.azul, b: m.lienzo } }),
      caliper: cal.done({ colors: { a: m.rojo } }),
      wheel: w.done({ colors: { wood: m.madera, hub: m.amarillo } })
    };
  }

  // The wheel (and its brake disc) at (x, y), scale k, turned by a.
  function drawWheel(ctx, s, env, x, y, k, a, p) {
    var W2 = s.state.wheel;
    env.ink.draw(ctx, W2.disc, x + 110 * k, y + 110 * k, k, { rot: a * 0.6, p: p });
    env.ink.draw(ctx, W2.caliper, x + 110 * k, y + 110 * k, k, { p: p });
    env.ink.draw(ctx, W2.wheel, x, y, k, { rot: a, p: p });
  }

  function stationAt(i, n) {
    var a = VOL.a0 + i / n * TAU;
    return { x: VOL.cx + Math.cos(a) * VOL.rx, y: VOL.cy + Math.sin(a) * VOL.ry, c: Math.cos(a), s: Math.sin(a), a: a };
  }

  function volante(ctx, s, env) {
    var C = cuesOf(s, 'volante'), st = s.state.vol, ink = env.ink, m = env.pal.mundo;
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1190, 520, 34, m.amarillo], ['espiral', 90, 520, 34]], intro);
    var turn = s.t * 0.07 + noise(s.t * 0.1, 'v08:giro') * 0.08;
    drawWheel(ctx, s, env, VOL.cx, VOL.cy, VOL.k, turn, intro);
    var names = pieces(rot(s, 'ciclo'), '→'), n = names.length;
    var due = [[0, C.s0], [0, C.s1], [1, C.s2], [1, C.s3], [2, C.s4], [2, C.s5]];
    var shown = [];
    for (var i = 0; i < n; i++) {
      var d = due[i] || [2, 1], p = s.line > d[0] ? 1 : s.line === d[0] ? beat(s.at(d[0]), d[1] - 0.04, d[1] + 0.04) : 0;
      shown.push(p);
    }
    // Arrows along the ring from each station to the next; the last one returns to the first.
    for (i = 0; i < n; i++) {
      var to = (i + 1) % n, ap = i === n - 1 ? seg(shown[n - 1], 0.6, 1) : seg(shown[to], 0, 0.5);
      if (ap > 0) ink.arrow(ctx, st.arcs[i], { w: 3.4, headSize: 13, seed: 'v08:arco' + i, p: ap, dotted: i === n - 1 });
    }
    for (i = 0; i < n; i++) {
      if (shown[i] <= 0) continue;
      var S2 = stationAt(i, n), R = VOL.st, sp = shown[i];
      ink.circle(ctx, S2.x, S2.y, R * out3(seg(sp, 0, 0.5)) + 0.01, { fill: m.amarillo, w: 3.4, seed: 'v08:estacion' + i, p: seg(sp, 0, 0.6) });
      ink.text(ctx, String(i + 1), S2.x, S2.y - 13, { size: 23, weight: 700, align: 'center', p: seg(sp, 0.4, 0.9) });
      var o = { size: VOL.size, weight: 700, maxWidth: VOL.labelW, lineHeight: 1.12, p: seg(sp, 0.4, 1) };
      var lay = ink.measureText(ctx, names[i], o), gapL = R + 10;
      o.align = S2.c > 0.1 ? 'left' : S2.c < -0.1 ? 'right' : 'center';
      var lx = S2.x + (o.align === 'left' ? gapL : o.align === 'right' ? -gapL : 0);
      ink.text(ctx, names[i], lx, S2.y - lay.h / 2, o);
    }
    // Once the cycle is closed, a token goes round it: the cycle repeats.
    if (shown[n - 1] >= 1) {
      var t0 = s.lines[2] ? s.lines[2].end : s.dur, u = Math.max(0, s.t - t0) * 0.22 + 0.001;
      var f = u * n % n, k0 = Math.floor(f), fr = inOut3(f - k0), A = stationAt(k0, n), B = stationAt((k0 + 1) % n, n);
      var ta = A.a + (((B.a - A.a) % TAU) + TAU) % TAU * fr;
      ink.circle(ctx, VOL.cx + Math.cos(ta) * VOL.rx * 0.9, VOL.cy + Math.sin(ta) * VOL.ry * 0.9, 9, { fill: m.rojo, w: 2.4, seed: 'v08:ficha' });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 11 · freno — a warm hand comes to rest on the brake lever, with the note «¿Quién puede
  // detenerlo?»; beside the lamp, a reviewer without a lever is crossed out: «revisión sin
  // autoridad».

  var FRE = {
    lever: { x: 250, y: 500, k: 2.6 }, note: { x: 380, y: 96, w: 330, h: 74 }, disc: { x: 520, y: 430, k: 0.8 },
    panel: { x: 770, y: 250, w: 170, h: 160 }, reviewer: { x: 1090, y: 548, k: 2.2 },
    sinAutoridad: { x: 1090, y: 270 }
  };

  function freno(ctx, s, env) {
    var C = cuesOf(s, 'freno'), st = s.state.freno, ink = env.ink, fig = env.fig, m = env.pal.mundo, a = s.at(0);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 560, 110, 36, m.amarillo], ['luna', 620, 470, 40]], intro);
    // The brake lever: it is pulled a little when the hand rests on it.
    var L = FRE.lever, grip = inOut3(beat(a, C.criterio - 0.04, C.criterio + 0.08)), pull = -0.14 * grip;
    ink.line(ctx, st.floor, { w: 4, profile: 'swell', seed: 'v08:piso', p: intro });
    ctx.save();
    ctx.translate(L.x, L.y - 10 * L.k);
    ctx.rotate(pull);
    ctx.translate(-L.x, -(L.y - 10 * L.k));
    fig.lever(ctx, L.x, L.y, L.k, { seed: 'v08:palanca', p: intro });
    var hx = L.x + 32 * L.k, hy = L.y - 106 * L.k;
    var hp = beat(a, C.criterio - 0.08, C.criterio);
    if (hp > 0) hand(ctx, s, env, lerp(hx - 150, hx - 2, out3(hp)), lerp(hy + 150, hy + 10, out3(hp)), 0.95, 0.5, out3(hp), m.verde);
    ctx.restore();
    // The lever's cable to the brake disc.
    ink.line(ctx, st.cable, { w: 2.6, profile: 'even', seed: 'v08:cable', p: intro });
    var D = FRE.disc;
    s.state.wheel && env.ink.draw(ctx, s.state.wheel.disc, D.x, D.y, D.k, { p: intro, rot: grip * 0.4 });
    s.state.wheel && env.ink.draw(ctx, s.state.wheel.caliper, D.x, D.y, D.k, { p: intro });
    var np = beat(a, C.criterio, C.criterio + 0.08);
    if (np > 0) pinnedNote(ctx, env, rot(s, 'pregunta'), { x: FRE.note.x, y: FRE.note.y, w: FRE.note.w, h: FRE.note.h, size: 26, weight: 700, padT: 20, rot: -0.03 }, np, 'v08:quien');
    // Beside the lamp (in its ruled panel), the reviewer with no lever.
    var P = FRE.panel;
    fig.panel(ctx, P.x, P.y, P.w, P.h, { cell: 12, construction: false });
    fig.lamp(ctx, P.x + P.w / 2, P.y + P.h / 2, 0.72, { t: s.t, p: intro });
    var rp = out3(beat(a, 0, 0.14));
    if (rp > 0) fig.person(ctx, FRE.reviewer.x, FRE.reviewer.y, FRE.reviewer.k, { role: 'servidor', pose: 'reading', prop: 'clipboard', seed: 'v08:revisor', skin: 2,
      hair: 'short', facing: -1, p: rp });
    var xp = beat(a, C.sinAutoridad - 0.02, C.sinAutoridad + 0.08);
    if (xp > 0) {
      ink.line(ctx, st.cross[0], { w: 8, profile: 'swell', seed: 'v08:tache1', p: seg(xp, 0, 0.55), color: m.rojo });
      ink.line(ctx, st.cross[1], { w: 8, profile: 'swell', seed: 'v08:tache2', p: seg(xp, 0.45, 1), color: m.rojo });
      ink.text(ctx, rot(s, 'sinAutoridad'), FRE.sinAutoridad.x, FRE.sinAutoridad.y, { size: 26, weight: 700, italic: true, align: 'center', maxWidth: 300, p: seg(xp, 0.5, 1) });
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 12 · sociotecnico — a safe-looking lamp in a warm workshop; around it, as they are named, a
  // leaky data bucket, a crooked incentive chart (a sketch, no values), a ring with too many keys and
  // a person with no time to review; small sparks jump between them.

  var SOC = {
    lamp: { x: 640, y: 248, k: 0.9 }, plinth: { x: 580, y: 312, w: 120, h: 86 },
    bucket: { x: 250, y: 410 }, chart: { x: 300, y: 112, w: 190, h: 140 }, keys: { x: 920, y: 214 }, person: { x: 1066, y: 548, k: 2.1 },
    floor: 548
  };

  function sociotecnico(ctx, s, env) {
    var C = cuesOf(s, 'sociotecnico'), st = s.state.soc, ink = env.ink, fig = env.fig, m = env.pal.mundo, q = env.pal.maquina, a = s.at(0);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 1190, 90, 32, m.amarillo], ['sol', 90, 96, 40, m.rojo]], intro);
    ink.line(ctx, st.floor, { w: 4, profile: 'swell', seed: 'v08:taller', p: intro });
    // The workbench, and on it the lamp on its small ruled plinth: steady, safe-looking.
    fig.table(ctx, SOC.lamp.x, SOC.floor, 1, { w: 300, h: 150, p: intro, seed: 'v08:banco' });
    var P = SOC.plinth;
    ink.rRect(ctx, P.x, P.y, P.w, P.h, { color: q.linea, w: 1.4, fill: q.noche, p: intro });
    fig.lamp(ctx, SOC.lamp.x, SOC.lamp.y, SOC.lamp.k, { t: s.t, glow: 1 + 0.25 * beat(a, C.modelo - 0.02, C.modelo + 0.08), p: intro });
    // «sistemas sociotécnicos»: one loose dotted boundary draws around the whole workshop.
    ink.dotted(ctx, st.system, { closed: true, r: 2.4, gap: 15, seed: 'v08:sistema', p: beat(a, 0.02, 0.2) });
    var cues = [C.datos, C.incentivos, C.permisos, C.usuarios], ps = cues.map(function (c) { return beat(a, c - 0.05, c + 0.04); });
    // Leaky data bucket.
    if (ps[0] > 0) {
      fig.bucket(ctx, SOC.bucket.x, SOC.bucket.y, 1.1, { seed: 'v08:balde', p: ps[0] });
      if (ps[0] >= 1) for (var d = 0; d < 3; d++) {
        var u = (s.t * 0.6 + d / 3) % 1;
        ink.dot(ctx, SOC.bucket.x - 18 + d * 20, SOC.bucket.y + 80 + u * 60, 4.4 * (1 - u * 0.5), m.azul);
      }
    }
    // A crooked incentive chart: a sketch that encodes no value (no axes labels, no numbers).
    if (ps[1] > 0) {
      var K = SOC.chart;
      ctx.save();
      ctx.translate(K.x + K.w / 2, K.y + K.h / 2);
      ctx.rotate(-0.05);
      ink.card(ctx, -K.w / 2, -K.h / 2, K.w, K.h, { seed: 'v08:incentivos', weight: 3.2, radius: 6, p: ps[1] });
      ink.line(ctx, st.axes, { w: 2.6, profile: 'even', seed: 'v08:ejes', p: seg(ps[1], 0.3, 0.6) });
      ink.arrow(ctx, st.crooked, { w: 3.4, headSize: 12, seed: 'v08:torcida', color: m.rojo, p: seg(ps[1], 0.5, 1) });
      ctx.restore();
    }
    if (ps[2] > 0) fig.keyRing(ctx, SOC.keys.x, SOC.keys.y + Math.sin(s.t * 0.7) * 2, 1.1, { seed: 'v08:llavero', p: ps[2] });
    if (ps[3] > 0) {
      fig.person(ctx, SOC.person.x, SOC.person.y, SOC.person.k, { role: 'desarrollador', pose: 'walking', prop: 'folder', seed: 'v08:sin-tiempo', skin: 3, hair: 'short', facing: -1, p: ps[3] });
      fig.stopwatch(ctx, SOC.person.x + 66, SOC.person.y - 254, 0.5, { turn: 0.92, seed: 'v08:prisa', p: ps[3] });
    }
    // Sparks between the lamp and each piece, after the last one is named.
    var sp = beat(a, C.usuarios + 0.04, C.usuarios + 0.16);
    if (sp > 0) {
      for (var k = 0; k < st.sparks.length; k++) {
        var S2 = st.sparks[k], fl = 0.65 + 0.35 * Math.sin(s.t * 3.1 + k * 1.9);
        ctx.save();
        ctx.globalAlpha *= sp * fl;
        ink.line(ctx, S2, { w: 3, profile: 'even', seed: 'v08:chispa' + k, color: k % 2 ? m.rojo : m.amarillo });
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // 13 · cierre — the wheel keeps turning under warm hands; the final title is lettered.

  var CIE = { cx: 640, cy: 382, k: 0.88, title: { y: 34, size: 50, w: 1100 }, fade: 1.4 };

  function cierre(ctx, s, env) {
    var C = cuesOf(s, 'cierre'), m = env.pal.mundo, a = s.at(0);
    bg(ctx, s, env);
    var intro = out3(s.intro);
    floaters(ctx, s, env, [['estrella', 170, 200, 44, m.amarillo], ['sol', 1110, 210, 56, m.rojo], ['pajaro', 1000, 470, 70]], intro);
    var turn = s.t * 0.08;
    drawWheel(ctx, s, env, CIE.cx, CIE.cy, CIE.k, turn, intro);
    // Two warm hands on the rim, steering.
    var R = 150 * CIE.k, hl = Math.PI * 1.1, hr = -Math.PI * 0.1;
    hand(ctx, s, env, CIE.cx + Math.cos(hl) * R, CIE.cy + Math.sin(hl) * R, 0.86, -0.32, intro, m.rojo);
    hand(ctx, s, env, CIE.cx + Math.cos(hr) * R, CIE.cy + Math.sin(hr) * R, 0.86, 0.32, intro, m.verde);
    env.ink.letter(ctx, rot(s, 'titulo'), W / 2, CIE.title.y, { size: CIE.title.size, align: 'center', maxWidth: CIE.title.w, maxLines: 2, seed: 'v08:titulo-final',
      counters: 0.25, stars: false, p: beat(a, C.titulo - 0.06, Math.min(1, C.titulo + 0.3)) });
    var f = seg(s.t, s.dur - CIE.fade, s.dur);
    if (f > 0) {
      ctx.save();
      ctx.globalAlpha = inOut3(f);
      ctx.fillStyle = m.lienzo;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // setup(): geometry built once (seeded), shared by every frame.

  function setup(env) {
    var ink = env.ink, video = findVideo(env.id || 'v08'), i;
    var st = { hand: handDrawing(env), wheel: wheelDrawings(env) };

    // familias: the columns, the report's scribbled lines, the bracket under the three names.
    st.familias = {
      pillars: FAM.cols.map(function (c, k) { return pillarDrawing(env, k); }),
      legend: env.pal.legend.riesgos || [],
      reportLines: [0, 1, 2, 3, 4, 5].map(function (k) { return ink.wavePoints(-66, -74 + k * 28, k === 5 ? 6 : 66, 1.6, 30 + k * 3, k); }),
      bracket: [292, 546, 330, 558, 580, 554, 830, 558, 868, 544]
    };

    // respuesta: strings from the nails, the map's land and threat arrows, the flexible bridge.
    var fb = ink.drawing('v08:puente-flexible', { w: 3.6, jitter: 0.5 });
    var jx = [-110, -55, 0, 55, 110], jy = [0, 10, 14, 10, 0];
    for (i = 0; i < 4; i++) fb.shape([jx[i] + 8, jy[i] - 8, jx[i + 1] - 8, jy[i + 1] - 8, jx[i + 1] - 8, jy[i + 1] + 8, jx[i] + 8, jy[i] + 8], { fill: '@a', w: 3.4 });
    for (i = 0; i < 5; i++) fb.circle(jx[i], jy[i], 8, { fill: '@b', w: 2.6 });
    fb.stroke([-110, 0, -116, 60], { w: 5, profile: 'blunt' });
    fb.stroke([110, 0, 116, 60], { w: 5, profile: 'blunt' });
    fb.stroke([-110, -8, -60, -60], { w: 1.8, profile: 'hair' });
    fb.stroke([110, -8, 60, -60], { w: 1.8, profile: 'hair' });
    st.respuesta = {
      strings: RESP.xs.map(function (x, k) { var top = [RESP.toolY - 66, RESP.toolY - 74, RESP.toolY - 92, RESP.toolY - 52][k]; return [x, RESP.hookY, x - 30, (RESP.hookY + top) / 2, x - 50, top, x, RESP.hookY, x + 30, (RESP.hookY + top) / 2, x + 50, top]; }),
      land: ink.blobPoints(env.rng('v08:mapa-tierra'), 0, 4, 66, 44, 11, 0.22, 0),
      threats: [[-86, -56, -50, -36, -12, -6], [88, -54, 56, -30, 22, -4], [80, 60, 50, 40, 18, 14]],
      flexBridge: fb.done()
    };

    // incidentes / denominador: the dial's rótulos (denominador shows the same dial).
    var inc = sceneOf(video, 'incidentes');
    st.inc = { antes: inc ? inc.rotulos.antes.text : '', despues: inc ? inc.rotulos.despues.text : '' };
    var F = DEN.frac, Bx = F.box;
    st.den = {
      bar: [Bx.x0 - 10, F.bar, F.x, F.bar + 2, Bx.x1 + 10, F.bar],
      box: [Bx.x0, Bx.y0, (Bx.x0 + Bx.x1) / 2, Bx.y0 - 1, Bx.x1, Bx.y0, Bx.x1 + 1, (Bx.y0 + Bx.y1) / 2, Bx.x1, Bx.y1, (Bx.x0 + Bx.x1) / 2, Bx.y1 + 1, Bx.x0, Bx.y1, Bx.x0 - 1, (Bx.y0 + Bx.y1) / 2],
      link: [392, 250, 600, 180, 836, 110]
    };

    // trampa: the lamp's walk, the fence ticks, the warm patch, the evaluator's line of sight.
    var Fn = TRA.fence, ticks = [];
    for (var fy = Fn.y0 + 20; fy < Fn.y1; fy += 40) if (fy < Fn.gap0 - 6 || fy > Fn.gap1 + 6) ticks.push(fy);
    st.trampa = {
      walk: [150, 330, 240, 262, 300, 226, 380, 228, 470, 290, 556, 326],
      fenceTicks: ticks,
      patch: [Fn.x - 4, Fn.gap0 - 10, Fn.x + 6, Fn.gap0 + 14, Fn.x - 5, Fn.gap0 + 30, Fn.x + 5, Fn.gap1 + 10],
      sight: [1030, 330, 930, 320, 800, 316, 690, 322]
    };

    // The AI Act timeline: the roll's spiral and the earlier pins (bare) for plazos; the general-
    // purpose-model pins with their date headings (rótulos of ley and plazos) for omnibus.
    var ls = sceneOf(video, 'ley'), ps = sceneOf(video, 'plazos');
    var spiral = [];
    for (i = 0; i <= 22; i++) { var u = i / 22, ra = 3 + u * 13, an = u * TAU * 2.2; spiral.push(Math.cos(an) * ra, Math.sin(an) * ra); }
    function headOf(r) { return r ? splitHead(r.text).head : ''; }
    st.tl = {
      roll: spiral,
      earlier: ls ? ['vigor', 'prohibiciones', 'gpai'].map(function (k) { return { key: k, day: dateOf(ls.rotulos[k].text) }; }) : [],
      gpai: [ls && ls.rotulos.gpai, ps && ps.rotulos.mayoria, ps && ps.rotulos.previos].filter(Boolean).map(function (r) { return { head: headOf(r), day: dateOf(r.text) }; })
    };
    var K = LEY.cards;
    st.ley = { cardString: [0, 0, 0, 0] };
    var csx = K.x + K.w * 0.68;
    st.ley.cardString = [csx, TL.y + TL.h + 2, csx + 2, (TL.y + K.y) / 2 + 20, csx, K.y + 2];

    // por-que-importa: threads across the sea and the stars of the international reference.
    st.pqi = {
      threads: [
        [PQI.firm.x + 40, PQI.firm.y - 150, 600, 200, 760, 210, PQI.provider.x - 40, PQI.provider.y - 150],
        [PQI.uni.x + 20, PQI.uni.y - 170, 480, 120, 820, 130, PQI.partner.x - 10, PQI.partner.y - 150],
        [PQI.provider.x - 20, PQI.provider.y - 128, 860, 250, 560, 250, PQI.firm.x + 50, PQI.firm.y - 128]
      ],
      stars: [[540, 330, 40], [646, 300, 50], [752, 338, 38], [600, 384, 30]]
    };

    // volante: the arcs between stations along the ring.
    var n = 6, gap = (VOL.st + 12) / Math.min(VOL.rx, VOL.ry);
    st.vol = { arcs: [] };
    for (i = 0; i < n; i++) {
      var aa = VOL.a0 + i / n * TAU + gap, ab = VOL.a0 + (i + 1) / n * TAU - gap, pts = [];
      for (var j = 0; j <= 6; j++) { var t = aa + (ab - aa) * j / 6; pts.push(VOL.cx + Math.cos(t) * VOL.rx, VOL.cy + Math.sin(t) * VOL.ry); }
      st.vol.arcs.push(pts);
    }

    // freno: the floor and the cross over the reviewer.
    var R2 = FRE.reviewer, top = R2.y - 100 * R2.k;
    st.freno = {
      floor: [80, 504, 400, 507, 700, 502, 960, 506, 1230, 550],
      cable: [FRE.lever.x + 30, FRE.lever.y - 8, 380, 520, 470, 470, FRE.disc.x - 40, FRE.disc.y + 16],
      cross: [[R2.x - 92, top + 14, R2.x, top + 120, R2.x + 92, R2.y - 20], [R2.x + 92, top + 14, R2.x + 6, top + 120, R2.x - 92, R2.y - 20]]
    };

    // sociotecnico: floor, chart sketch, sparks.
    var L = SOC.lamp;
    st.soc = {
      floor: [70, SOC.floor, 400, SOC.floor + 4, 800, SOC.floor - 2, 1220, SOC.floor + 2],
      system: ink.ellipsePoints(650, 318, 560, 248, 30, 0.04),
      axes: [-70, -50, -72, 50, 76, 48],
      crooked: [-60, 36, -30, 6, -6, 22, 20, -30, 40, -20, 58, 34],
      sparks: [
        [L.x - 70, L.y + 10, L.x - 100, L.y + 40, L.x - 120, L.y + 30, L.x - 150, L.y + 70],
        [L.x - 60, L.y - 60, L.x - 90, L.y - 80, L.x - 108, L.y - 70, L.x - 130, L.y - 100],
        [L.x + 64, L.y - 50, L.x + 100, L.y - 64, L.x + 116, L.y - 50, L.x + 160, L.y - 70],
        [L.x + 70, L.y + 24, L.x + 110, L.y + 40, L.x + 128, L.y + 26, L.x + 170, L.y + 56]
      ]
    };
    return st;
  }

  // ---------------------------------------------------------------------------------------------

  EIA.videos.v08 = {
    setup: setup,
    layers: {
      familias: groundLayer('personas', {}),
      respuesta: respuestaLayer,
      incidentes: groundLayer('personas', {}),
      denominador: denominadorLayer,
      trampa: groundLayer('personas', {}),
      ley: groundLayer('personas', {}),
      plazos: groundLayer('personas', {}),
      omnibus: groundLayer('personas', {}),
      'por-que-importa': porQueLayer,
      volante: groundLayer('personas', {}),
      freno: groundLayer('personas', {}),
      sociotecnico: groundLayer('personas', {}),
      cierre: groundLayer('personas', {})
    },
    scenes: {
      familias: familias,
      respuesta: respuesta,
      incidentes: incidentes,
      denominador: denominador,
      trampa: trampa,
      ley: ley,
      plazos: plazos,
      omnibus: omnibus,
      'por-que-importa': porQueImporta,
      volante: volante,
      freno: freno,
      sociotecnico: sociotecnico,
      cierre: cierre
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
