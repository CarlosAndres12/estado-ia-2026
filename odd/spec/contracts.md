# Shared contracts (read before writing any module)

These fix the names and shapes that parallel workers depend on. The prompt
(`odd/spec/prompt-estado-ia-2026.md`) is the full spec; this file only pins down what it leaves open.
If you must change a contract, say so in your final report — do not silently diverge.

## 1. Global rules

- Classic scripts, one global `window.EIA` (see `js/core/namespace.js`). No ES modules, no `fetch` of
  JSON, no network, no image/SVG/icon-font files. Everything visual is drawn on `<canvas>`.
- Code, identifiers and code comments in English. Every string the site shows or speaks is Spanish and
  lives in `js/data/*.js` (never typed in drawing or UI code), except developer-facing errors.
- Draw functions are pure functions of `(s, env)`: no `Math.random`, no `Date`, no mutable state.
  Randomness comes from `env.rng(seed)` (seeded; seed strings like `'v02:capacidad:bubble'`).
- `js/core/namespace.js`, `js/engine/timeline.js`, `js/engine/captions.js` and every `js/data/*.js`
  must be DOM-free at load time (tools evaluate them in a Node `vm` sandbox).
- Load order is fixed in `index.html`; do not add, remove or reorder script tags. Dev-only pages live
  in `tools/dev/` and may load the same scripts by relative path plus dev fixtures.
- Commit messages: Conventional Commits, English, no `Co-Authored-By` or any AI attribution.

## 2. Data shapes

### `EIA.data.cifras` — array, KB §13 order, then context figures
```js
{ id: 'adop-1', tema: 'adopcion', cifra: '…verbatim KB…', alcance: '…verbatim KB (may be "Ídem")…',
  alcanceCompleto: '…resolved text, only when alcance is "Ídem…"…', tipo: 'Uso declarado',
  clase: 'uso',          // capacidad | uso | resultado | expectativa | proyeccion | neutral | ninguno
  fuentes: ['mck25'],    // keys of EIA.data.fuentes, KB order
  estado: 'Verificada',  // verbatim KB label incl. its note; '' for ctx-* entries (KB gives none)
  sesiones: [1, 3, 7], enBanco: true }
```
Ids: `adop-1…8`, `cap-1…12`, `eco-1…7`, `prod-1…7`, `trab-1…5`, `edu-1…5`, `cien-1…3`, `med-1…6`,
`ries-1…4`, `alc-1…4` (rows in KB order under each §13 heading). Context figures: `ctx-<slug>`,
`enBanco: false`, `cifra` = the KB sentence verbatim, `fuentes` = the source cited at that spot,
`tipo`/`clase` from the KB when it gives one, else `tipo: '—'`, `clase: 'ninguno'`. Required slugs
(used by the video scripts): `modelos-convergen`, `ley-vigor`, `ley-prohibiciones`,
`ilia-indicadores`, `colombia-quinto`, `medicos-experiencia`. Read figures only via `EIA.cifra(id)`.

### `EIA.data.fuentes` — object keyed by KB link label
```js
{ mck25: { etiqueta: 'McKinsey, 2025', url: 'https://…exact KB URL…', titulo: '…§16 title…', grupo: '…§16 group…' } }
```

### `EIA.data.glosario` — array, KB §12 order
```js
{ id: 'benchmark', termino: 'Benchmark', definicion: '…verbatim…', variantes: ['benchmarks'] }
```
`variantes`: lowercase inflections used to detect the term in text (first occurrence per view / per video).

### `EIA.data.deck` — array of 17 láminas (KB "Guion de diapositivas")
```js
{ id: 'd07', n: 7, sesion: 3,
  titulo: 'Del uso al valor: el embudo de la adopción',   // KB heading after "D7 · ", no final period
  titular: '…',            // drawn headline: KB "Titular" for D1–D2, otherwise = titulo
  subtitulo: '',           // KB "Subtítulo" or ''
  cifras: [{ valor: '+127,5%', etiqueta: 'inversión privada 2025', cifras: ['eco-1'] }],  // ≤ 3, big-figure column
  diagrama: { tipo: 'flujo', titulo: '', items: [{ text: 'Capital', cifras: [] }] } | null,
    // tipo: flujo | embudo | causal | columnas | pasos | ciclo | semaforo | linea | tarjetas
  ideaCentral: { text: '…without outer «»…', cifras: [] } | null,
  pie: { text: '…' } | null,
  rotulos: { key: { text: '…', cifras: [], ilustrativo: false } },  // any other drawn string
  notas: { decir: '…', nota: '…', metafora: '…' },                    // verbatim KB fields ('' if absent)
  kb: [{ label: 'Cifras', text: '…verbatim…', items: ['…'] }],       // every KB sub-bullet, in order
  contenido: [2, 3] }      // related "Contenido" point numbers of its session
```
Drawn text is verbatim KB, except the corrected versions the prompt requires (D8 "27,0% vs 8,5%";
D15 "479.273 millones", "106 acciones") and the D7 caution line ("Cada barra sale de una pregunta
distinta de la misma encuesta."), which goes in `rotulos.cautela`.

### `EIA.data.videos` — array of 9, prompt §5.5, plus:
- `advertencia` is a number 1–4 or an array (`[1, 2]`) when a line presses two stamps.
- `cifras` ids of context figures are written `ctx-<slug>`.
- `target: [minSeconds, maxSeconds]`, `poster: { scene, p }`, `checkpoints[].answer` = option index.
- Every checkpoint has a `hint` (points back to an idea, never names the answer, adds no facts).

### `EIA.audioManifest` (`assets/audio/manifest.js`, generated) — prompt §8.3 step 8
`{ [videoId]: { file, duration, chapters, scenes: [{ id, start, dur }], lines: [{ scene, index, start, dur, chunks: [{ text, start, end }] }], checkpoints: [{ after, start, dur }] } }`
Times are seconds from the start of the video.

### `EIA.videoExports` (`assets/video/index.js`, generated)
`{ [videoId]: { file: 'assets/video/<slug>.mp4', duration, bytes } }`

### `EIA.data.sesiones[n]` — prompt §5.3 (shape documented by T02 in `odd/spec/data-model.md`).

## 3. Engine names other modules call

Implemented in T04 unless noted; callers must degrade gracefully if a function is missing while
modules are being built in parallel, and remove such fallbacks once the engine is merged.

- `EIA.engine.rng.create(seed)` → `r()` in [0, 1) plus helpers (`r.range(a, b)`, `r.int(a, b)`, `r.pick(arr)`).
- `EIA.engine.easing` → `{ clamp, lerp, segment(p, a, b), inOut, out, in, back }`.
- `EIA.engine.palette` → `{ mundo, pieles, maquina, evidencia, legend }` (hex values of prompt §3.9 / §4).
- `EIA.engine.tags.sourceTag(ctx, cifraId, opts)`, `tags.chip(ctx, clase, label, opts)`,
  `tags.estadoSign(ctx, estadoKey, x, y, size)`, `tags.warningStamp(ctx, n, x, y, size, p)`,
  `tags.illustrativeStamp(ctx, x, y, scale, p)`, `tags.updateRibbon(ctx, x, y, scale, p)`.
- `EIA.engine.ink.letter(ctx, text, x, y, opts)` — brush lettering written glyph by glyph (`opts.p`).
- `EIA.engine.figures.lectora(ctx, x, y, scale, opts)` and `figures.lamp(ctx, x, y, scale, opts)`.
- `EIA.engine.lamina.render(ctx, id, { t, still })` draws one full lámina at 1280×720;
  `lamina.mountRender(id, q)` implements `index.html?lamina=<id>` (`window.renderFrame(t)`,
  `window.renderReady` promise). Lámina modules: `EIA.laminas.dNN = { setup(env), draw(ctx, s, env) }`
  where `s = { t, still, lamina /* deck entry */, zones /* named rects */ }`.
- `EIA.engine.player.create(container, videoId, opts)` (T05) → `{ play, pause, seek(t), destroy, el }`;
  `opts = { chapterPause, interactive, onEnd }`. `player.mountRender(id, q)` implements
  `index.html?render=<id>` (`window.renderFrame(t)`, `videoDuration`, `videoChapters`,
  `videoTimeline`, `renderReady`). `EIA.engine.timeline` / `EIA.engine.captions` (T05) are pure.
- Video modules: `EIA.videos.vNN = { setup(env), layers?: { [sceneId](env) }, scenes: { [sceneId](ctx, s, env) } }`
  with `s` exactly as prompt §5.6 (`t, p, dur, intro, outro, lines, line, lineP, at(i), rotulos`).

## 4. Page hooks and CSS conventions (T07 owns the page; others use these names)

- `EIA.ui.boot()` starts the site (called by `js/main.js`). Router fires `window` event `eia:route`
  (`detail: { route, block }`) after every hash change; players also listen to `hashchange`.
- `EIA.ui.chipHTML(clase, label)` → HTML string for an evidence chip; `EIA.ui.estadoHTML(estado)`;
  `EIA.ui.copy(text)` → Promise (Clipboard API + textarea fallback, aria-live "¡Copiado!");
  `EIA.ui.openLamina(id)` opens the láminas viewer.
- CSS classes: `.chip.chip--{clase}`, `.estado.estado--{estadoKey}`, `.btn`, `.btn--primary`,
  `.card`, `.source-tag`, `.visually-hidden`. Shared stylesheet sections in `css/components.css`
  are owned per section marker; edit only inside your own.
- Copy for UI chrome (buttons, labels, feedback) lives in `EIA.data.course.ui` (T02 seeds the strings
  quoted in prompt §7, §9, §10; later owners add keys in their own sub-objects).
