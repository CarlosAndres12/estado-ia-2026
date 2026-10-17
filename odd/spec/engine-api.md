# Drawing engine API (T04)

The engine draws everything in the course: láminas, videos and page decorations. It lives in
`js/engine/{rng,easing,palette,ink,chart,tags,figures,lamina}.js` and is reached through `env` in
modules (`env.ink`, `env.chart`, `env.tags`, `env.fig`, `env.pal`, `env.ease`, `env.rng(seed)`,
`env.cifra(id)`) or `EIA.engine.*` elsewhere. Every call is a pure function of its arguments: the
same inputs give the same pixels.

## Quick path

1. Draw in **logical 1280×720 units**. The caller scales for DPR: `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
2. Wait for fonts before the first frame: `EIA.engine.lamina.fontsReady().then(start)`.
3. Build heavy geometry once in `setup(env)` (drawings, point arrays) and reuse it every frame.
4. Take every string from data (`s.rotulos`, the deck entry) and every source from `tags.sourceTag(ctx, id, …)`.
5. Review in the gallery: `tools/dev/gallery.html?section=<name>`; run `tools/dev/gallery.html?test=1`.

```js
// A lámina module (js/laminas/dNN.js) — strings come from the deck entry, numbers from its rótulos.
EIA.laminas.d03 = {
  layout: { diagrama: { x: 56, y: 470, w: 1168, h: 120 } },          // optional zone overrides
  setup: function (env) { return { peaks: [{ x: 0.3, h: 0.7, lit: true }] }; },
  draw: function (ctx, s, env) {
    var r = s.zones.ilustracion;
    var c = env.fig.inRect(ctx, r, function (x, y, k) { return env.fig.cordillera(ctx, x, y, k, { peaks: s.state.peaks }); });
    env.tags.sourceTag(ctx, 'cap-3', { near: { x: c.peaks[0].x, y: c.peaks[0].y, side: 'right' } });
  }
};
```

## Art rules every caller follows

| Rule | How |
|---|---|
| People and the real world are warm and free | Brush strokes (`ink.*`), gouache fields, `fig.person`, places, props, cream page backgrounds |
| The AI is only ever the lamp | `fig.lamp` / `fig.lamps` / machine kit. Never eyes, a face, a body or a brain. Signs have no eyes either |
| Controlled conditions are ruled and navy | Benchmarks, exams and lab results sit in `fig.panel` / `ink.machineGrid` / `fig.examPanel`; going from benchmark to real work goes from the navy panel to the cream page |
| Meaning zones | Where the five types are taught or sorted, decorative signs are black only: pass `{ mono: true }` or `colors: { a: pal.mundo.tinta }` |
| The five evidence colors mean the five types | Only `tags.chip` / `tags.sourceTag` use them. Decorative signs use `pal.decor` |
| A number is never on screen without its tag | `tags.sourceTag(ctx, ids, { near/anchor, p })` for as long as the number shows; dates that only name a moment get none |
| Honest charts | One shared zero-based scale per frame; values from `chart.parseValue(text)`; never `easing.back` on data; labels appear after the mark lands |
| Illustrative examples | `tags.illustrativeStamp` for the whole beat of a line marked `ilustrativo` |
| Warnings | `tags.warningStamp(ctx, n, x, y, size, p)` for 3 s when a line has `advertencia` |
| Determinism | Seeds are strings (`'v02:capacidad:bubble'`); motion comes from `s.t`, never `Date` or `Math.random` |
| Sensitive topics | No skulls, gore or killer robots; the hospital uses a green plus, never the Red Cross emblem |

## Conventions

| Topic | Convention |
|---|---|
| Units | Logical px of the 1280×720 frame. `scale` multiplies a figure's natural size |
| Anchor | `(x, y)` is top-left unless the function says center, foot or ground |
| `p` | Draw-on progress 0→1 (default 1). Outlines draw in stroke order, then fills bloom |
| `t` | Seconds, for ambient motion (twinkles, the lamp's stars, waves, wheels) |
| `seed` | Any string; same seed → same shape. Varies hand-drawn details only |
| `colors` | `{ slot: hex }` overrides for `'@slot'` colors (`a`, `b`, `skin`, `hair`, `outfit`, `ink`…) |
| `mono` | Tinta only (monochrome legend forms, print) |
| Line weight | Compensated with size (`ink.weightFor`): small figures keep legible lines |
| Caching | Geometry is cached by seed/variant, immediate-mode paths by the identity of the points array. Pass arrays built in `setup` |

## `EIA.engine.rng`

| Function | Returns |
|---|---|
| `create(seed)` | `r()` in [0, 1) plus `r.range(a, b)`, `r.int(a, b)` (inclusive), `r.pick(arr)`, `r.chance(p)`, `r.sign()`, `r.jitter(a)`, `r.gauss(m, sd)`, `r.shuffle(arr)`, `r.fork(name)` |
| `hash(str)` · `mulberry32(n)` | uint32 · generator |
| `value(seed, i)` | stateless lattice value in [0, 1) |
| `noise1(x, seed)` · `noise2(x, y, seed)` | smooth value noise in [−1, 1] (ambient drift: `noise1(s.t * 0.3, 'v01:moon')`) |

## `EIA.engine.easing`

`clamp(x, a=0, b=1)`, `lerp(a, b, t)`, `invLerp`, `map(x, a, b, c, d)`, `segment(p, a, b)` (0 before
a, 0→1 between, 1 after), `in`, `out`, `inOut` (cubic), `sineIn`, `sineOut`, `sineInOut`, `smooth`,
`smoother`, `back(t)` (overshoots: not for data), `stagger(p, i, n, spread=0.35)`, `loop(t, period)`,
`pulse(t, period)`. Example: `var e = env.ease.out(s.at(1))`.

## `EIA.engine.palette`

| Key | Content |
|---|---|
| `mundo` | `lienzo #F4EEDF`, `lienzoOcre #E7D3A8`, `tinta #15120F`, `rojo #D7261E`, `amarillo #F5C518`, `azul #1C3F95`, `verde #1E8A4C`, `celeste #86BEE3`, `tierra #C68A2E`, `siena #94461C`, `madera #6B4426`, `oro #E2B33C`, `tierras[]` |
| `pieles` | five skin tones, light → deep |
| `maquina` | `noche #0E1A3B`, `linea #A9D6FF`, `rejilla #2A3D6E`, `brilloVerde #46F0B0`, `brilloMagenta #F45CCF` |
| `evidencia` | `capacidad #0072B2`, `uso #E69F00`, `resultado #009E73`, `expectativa #CC79A7`, `proyeccion #D55E00` |
| `decor` | colors decorative signs may use (never the evidence colors) |
| `legend.tipos` / `tipoByClase` | `{ clase, label, color, sign, que }` — verbatim KB §3.1 |
| `legend.neutral` · `legend.ilustrativo` | neutral chip (`cuadrado` sign) · `{ label: 'Ejemplo ilustrativo · no es un dato', sign: 'lapiz' }` |
| `legend.advertencias` | `[{ n, texto, signs: [a, b] }]` — the four warnings |
| `legend.estados` | `{ verificada, 'con-matiz', actualizacion, 'informe-base' }` → `{ label, sign, meaning }` |
| `legend.sesiones` | `{ 1…7: { sign } }` (iceberg, cordillera, puente, escalera-sin-peldano, microscopio, volante, faro) |
| `legend.semaforo` | `[{ key, label, sign, color, pos }]` top → bottom: Rojo, Ámbar, Verde |
| `legend.riesgos` · `escalera` · `gobernanza` | risk families with signs · `{ rungs: 6 }` · `{ stations: 6 }` |
| `legend.escenarios` · `patterns` | four windows with patterns · `puntos, rayas, estrellas, cuadros, ondas, espirales` |
| `legend.words` | `noComparable`, `hasta`, `aprox` (≈), `advertencia`, `ideaCentral`, `cero` |
| helpers | `rgba(hex, a)`, `mix(a, b, t)`, `shade(hex, ±amount)` (− toward tinta, + toward lienzo) |

CSS mirror (`css/tokens.css`): `--lienzo`, `--lienzo-ocre`, `--tinta`, `--rojo`, `--amarillo`, `--azul`,
`--verde`, `--celeste`, `--tierra`, `--siena`, `--madera`, `--oro`, `--piel-1…5`, `--noche`, `--linea`,
`--rejilla`, `--brillo-verde`, `--brillo-magenta`, `--ev-{capacidad|uso|resultado|expectativa|proyeccion}`,
`--semaforo-{rojo|ambar|verde}`, `--font-sans`, `--font-display`, `--fs-{xs|sm|base|md|lg|xl|2xl|3xl|display}`,
`--lh-*`, `--fw-*`, `--sp-1…9`, `--radius-card`, `--measure`, `--touch-target`, `--focus-ring`.

## `EIA.engine.ink` — brush, paper, text

### Strokes and shapes (immediate mode, screen units)

| Call | Options (defaults) |
|---|---|
| `line(ctx, pts, o)` | `w` 3, `profile` `swell` \| `blunt` \| `outline` \| `lift` \| `press` \| `even` \| `hair`, `dot` (true \| `'detached'`), `startDot`, `second` (thin second stroke: true or probability), `closed`, `color` tinta, `p`, `seed`, `alpha` |
| `shape(ctx, pts, o)` | closed shape: `fill` (offset gouache field), `line` true, `w`, `poly` (straight-edged field), `tex`, `offset` px, `p`, `seed` |
| `blob(ctx, cx, cy, rx, ry, o)` · `circle(ctx, cx, cy, r, o)` | biomorphic / hand-drawn circle; `irr` irregularity, `n` points, `rot`, plus shape options |
| `dot(ctx, x, y, r, color)` · `dotted(ctx, pts, o)` | dot · hand-dabbed dotted line (`r`, `gap`) |
| `arrow(ctx, pts, o)` | calligraphic arrow, open head (`headSize`, `dotted`, `head: 'none'`) |
| `wave(ctx, x0, y, x1, o)` · `wavePoints(x0, y, x1, amp, len, phase)` | wavy stroke (`amp`, `len`, `dot`) · its points |
| `spatter(ctx, x, y, r, o)` · `dotCluster(ctx, x, y, r, o)` · `contours(ctx, x, y, rx, ry, o)` | ink spatter · tidy dots · loose concentric loops |

`pts` may be `[x0, y0, …]`, `[[x, y]…]` or `[{x, y}…]`. Example: `ink.line(ctx, s.state.path, { w: 6, dot: true, p: s.at(0) })`.

### Ruled (the machine): crisp, constant screen width

`rLine(ctx, x0, y0, x1, y1, o)`, `rRect(ctx, x, y, w, h, o)` (`fill`, `stroke`), `rCircle(ctx, cx, cy, r, o)`,
`rPoly(ctx, pts, o)`, `rArrow(ctx, x0, y0, x1, y1, o)`; `o = { color: linea, w: 1.25, dash, p }`.

### Backgrounds and layers (pre-rendered, cached)

| Call | Notes |
|---|---|
| `background(ctx, kind, o)` | `kind`: `personas` (notebook lines + margin), `datos` (dot grid), `territorio` (`horizon`, `contours`), `mar` (`horizon`, `waves`), `maquina`, `lienzo`; `o.w/h/x/y/seed` |
| `paper(ctx, x, y, w, h, o)` | `lines` notebook \| dots \| none, `margin`, `spacing`, `wash` |
| `wash(ctx, x, y, w, h, o)` · `grain(ctx, x, y, w, h, o)` | soft color wash (`color(s)`, `alpha`, `base`, `streaks`) · paper grain overlay |
| `machineGrid(ctx, x, y, w, h, o)` | navy field, fine grid (`cell` 16), ticks, construction lines |
| `notebookLines(…)` · `dotGrid(…)` | the lines only |
| `layer(ctx, key, w, h, render)` · `drawLayer(ctx, key, x, y, w, h, render)` · `clearLayers()` | your own cached offscreen layer (LRU ≈ 26 Mpx) |
| `glow(ctx, x, y, r, color, alpha, add)` | pre-rendered radial glow (no shadowBlur) |

### Text and lettering

| Call | Notes |
|---|---|
| `text(ctx, text, x, y, o)` → layout | `size` 18, `weight`, `italic`, `font` `sans` \| `display`, `maxWidth`, `maxLines`, `fit` (shrink, never truncates), `minSize`, `maxHeight`, `lineHeight` 1.3, `align`, `color`, `p` (fade) |
| `measureText(ctx, text, o)` | `{ lines, w, h, size, lineH, font, overflow }` |
| `letter(ctx, text, x, y, o)` → layout | brush lettering written glyph by glyph: `size` 56, `font` display, `maxWidth`, `maxLines` 2, `fit`, `align`, `p`, `seed`, `counters` (0.4 share of filled counters), `stars`, `underline` (wavy, ends in a dot), `color` |
| `measureLetter(ctx, text, o)` | `{ w, h, size, lines, … }` for layout before drawing |
| `wrap(ctx, text, maxWidth, font)` · `font(o)` · `FONTS` | helpers; fonts are "EIA Sans" (400/700/italic) and "EIA Display" (700/900) |
| `card(ctx, x, y, w, h, o)` | paper card, thick irregular outline: `weight` 4, `radius` 12, `peek` (color behind a corner), `peekCorner`, `dashed`, `fill`, `p` |

### Drawings (how figures are built)

```js
var b = env.ink.drawing('v05:fan', { w: 4, jitter: 1 });   // seeded builder, local units
b.shape(pts, { fill: '@a' });  b.stroke(pts, { w: 3, dot: true });  b.rline(0, 0, 50, 0);
var d = b.done();                                            // in setup()
env.ink.draw(ctx, d, x, y, scale, { p: s.at(0), colors: { a: env.pal.mundo.rojo } });
```

Builder methods: `stroke`, `shape`, `fill`, `blob`, `ellipse`, `circle`, `dot`, `dots`, `rline`, `rpoly`,
`rcircle`, `rrect`, `rfill`, `rdisc`, `overlap(a, b, color)` (intersection in black or a third color),
`glow`, `custom(fn)`, `done()`. Low level: `strokeGeom`, `shapeGeom`, `fillStroke`, `strokeRange`,
`smoothPath`, `blobPoints`, `weightFor`, `deviceScale`, `makeCanvas`, `LRU`.

## `EIA.engine.chart` — honest marks

| Call | Draws | Key options |
|---|---|---|
| `parseValue(text)` | → `{ value, lo, hi, approx, bound, unit, raw, index }` from a data string ("66,3%", "~1/3", "hasta −83%", "14–15%", "más de 90%") | fractions become % ("~1/3" → 33,3) |
| `linear(d0, d1, r0, r1)` · `scale(max, x0, len)` | scales (`.invert`) | share ONE scale per frame |
| `bar(ctx, o)` | gouache bar, exact value edge, cap by wording (≈ dotted, chevrons, "hasta" tick) | `text` or `value`, `scale`, `x`, `y`, `h` 34, `orient` h \| v (`baseY`), `style` warm \| ruled, `color`, `cifras` (tag), `label`, `labelWidth`, `p` |
| `bars(ctx, items, o)` | horizontal bars on one zero-based scale + zero line | `max` (100 for % data), `x`, `y`, `len`, `h`, `gap`, `p` (staggered) |
| `unitGrid(ctx, o)` | 100 (or 1.000) dots, `value` lit in reading order (or `percent`) | `x`, `y`, `w`, `litColor`, `halo`, `style` |
| `dots(ctx, o)` | exact count as an organic cluster | `x`, `y` (center), `count`, `pitch`, `sign` |
| `band(ctx, o)` · `interval(ctx, o)` | range band with end ticks · interval line, point and zero mark | `text`/`lo`/`hi`; `min`, `max`, `labels`, `zeroLabel` |
| `gauge(ctx, o)` | hand-drawn dial, needle at the exact angle, optional ghost needle | `x`, `y`, `r`, `min`, `max`, `value`/`text`, `ghost`, `style` |
| `timeline(ctx, o)` | paper strip, pins at positions proportional to the dates | `from`, `to`, `items: [{ text, date? }]` (Spanish dates parsed) |
| `funnel(ctx, o)` | centered proportional bars, bottleneck bracketed | `items`, `w`, `h`, `pitch`, `labelX`, `labelWidth` |
| `panels(ctx, o)` | separate cards + "No se compara directamente" | `panels: [{ draw(ctx, rect, p) }]`, `gap` |
| `geom.bar / unitGrid / dots / gauge / timeline` | pure value → px geometry (tests, label placement) | |

Every mark grows from zero with `p` (ease-out, no overshoot) and lands exactly at `p = 1`; its value
label fades in only after it lands. Example: `chart.bars(ctx, items, { x: 120, y: 200, len: 520, p: s.at(1) })`.

## `EIA.engine.tags` — tags, chips, stamps

| Call | Notes |
|---|---|
| `sourceTag(ctx, idOrIds, o)` → `{ x, y, w, h, hole }` | cream paper tag + thread: chip, short source label, scope when it fits, estado sign (ribbon for "Actualización"). `x, y` or `near: { x, y, side, gap }`; `anchor`; `p`; `scale`; `maxWidth` 300; `scope` auto \| true \| false; `mono` |
| `measureTag(ctx, id, o)` | `{ w, h }` |
| `chip(ctx, clase, label, o)` | sign + verbatim label; `size` 15, `mono`, `pill`, `x`, `y`, `p` |
| `estadoSign(ctx, key, x, y, size)` | center; tinta |
| `warningStamp(ctx, n, x, y, size, p, o)` | round ink stamp, center; `o.text`, `o.number` |
| `illustrativeStamp(ctx, x, y, scale, p)` · `updateRibbon(ctx, x, y, scale, p)` | top-left; return boxes |
| `marginNote(ctx, title, text, x, y, w, p, o)` | glossary or facilitator note; `o.sign`, `o.card` |

## `EIA.engine.figures` (`env.fig`)

`fig.sign(ctx, name, x, y, size, o)` draws one sign centered in a `size` px box. Names:

| Group | Signs |
|---|---|
| Miró vocabulary | `estrella`, `luna`, `sol` (`rays`), `pajaro`, `escalera`, `espiral`, `cometa`, `cabellos`, `mancha`, `puntos`, `salpicadura`, `constelacion` |
| Evidence (legend only) | `matraz`, `bocadillo`, `lupa`, `catalejo`, `cometa` (with `colors: { a: evidencia.proyeccion }`) |
| Estado | `sello-visto`, `asterisco`, `luna`, `libro` |
| Warning stamps | `bocadillo`, `moneda`, `matraz`, `mesa`, `sol-escritorio`, `silla-vacia`, `dos-pajaros`, `flecha-empuja`, `distinto` (≠) |
| Sessions | `iceberg`, `cordillera`, `puente`, `escalera-sin-peldano`, `microscopio`, `volante`, `faro` |
| Traffic light · risks | `cruz`, `medio-disco`, `estrella-visto` · `anzuelo`, `grieta`, `red-pueblo` |
| Other | `libreta` (lectora subtitles), `lapiz`, `cuadrado`, `capitulo`, `pausa`, `estrella-exito`, `espiral`, `brujula`, `lancha-brujula`, `casa`, `corazon-mano` |

`fig.pattern(ctx, name, x, y, w, h, o)` fills a rect with `puntos | rayas | estrellas | cuadros | ondas | espirales` (`color`, `bg`, `spacing`, `clip`).

### People (scale 1 = 100 px tall, `(x, y)` = feet on the ground)

| Call | Notes |
|---|---|
| `person(ctx, x, y, scale, o)` → `{ top, head, hand }` | `role` directiva \| servidor \| docente \| investigadora \| medica \| desarrollador \| estudiante \| campesina \| persona; `pose` (`fig.poses()`: standing, reading, writing, pointing, presenting, asking, lookingUp, waving, carrying, catching, tying, walking); `seed`, `skin` 0–4, `hair`, `outfit`, `glasses`, `prop` (notebook, book, phone, clipboard, laptop, flask, folder, plank, spyglass), `facing` ±1, `p` |
| `lectora(ctx, x, y, scale, o)` | the recurring reader (`pose` reading by default); never holds a magnifier |
| `team(ctx, x, y, scale, o)` → `{ top }` · `table(…)` | 3–4 people around a table (`n`), front center on the floor |
| `students(ctx, x, y, scale, o)` · `youngLadder(ctx, x, y, scale, o)` | student group · ladder without its first rung + young person looking up |

### Machine kit (always on navy, ruled)

| Call | Natural size and anchor | Options |
|---|---|---|
| `lamp(ctx, x, y, scale, o)` | 100 px, center | `t` (stars flow), `glow`, `dim` 0–1, `p` |
| `lamps(ctx, x, y, scale, o)` | row of identical lamps | `n`, `gap` |
| `panel(ctx, x, y, w, h, o)` | ruled navy panel | `cell` |
| `agentLoop(ctx, x, y, scale, o)` → `{ stations, at(u) }` | 560×300, top-left | `labels` (from data), `n`, `returnTo`, `at`, `t` |
| `ruledLadder(ctx, x, y, scale, o)` → `{ rungs, scale }` | bottom-center at zero | `max`, `h` 360, `rungs: [{ value, crack }]`, `ref`, `lampAt` |
| `examPanel(…)` · `serverTower(…)` · `computeBlock(…)` | 420×280 top-left · 120×300 bottom-center · cells top-left (`fraction` exact) | |
| `lampOnWheels(…)` · `ruledSieve(…)` · `weightsBox(…)` | ground · center · top-left | `pattern` · `t` · `lid` open \| closed \| transparent, `drawers` |

### Places (1280×720 stages, `(x, y)` = top-left; cached as layers)

`oficina`, `patio`, `aula`, `biblioteca`, `laboratorio`, `hospital`, `consultorio`, `marNocturno`
(`horizon`, `moon`, `stars`, `t`) with `iceberg(ctx, x, y, scale, { reveal, glow })`, `cordillera`
(`peaks: [{ x, h, lit, deep }]` → `{ peaks, valleys }`), `river` (`coins`, `t` → `{ at(u), reservoir, gate }`),
`ciudad`, `latam` (→ `anchors`), `road` (`stations`, `signs`, `points` → `{ stations, at(u) }`).
Fit any stage into a zone with `fig.inRect(ctx, rect, function (x, y, k) { … })`.

### Props (anchors returned in screen coordinates)

`notebookPage(ctx, x, y, w, h, o)`, `headline`, `sheet`, `coin`, `coinPile` (`height` px, exact top),
`bridge` (`built`, `labels: { left, right }`, 560 px), `suspensionBridge`, `plank` (`label`), `balance`
(`tilt` → pans), `hourglass` (`level`), `stopwatch` (`turn`), `telescope`, `microscope`, `magnifier`,
`spyglass`, `flask`, `compass`, `chair`, `trafficLight` (`lit` → `lights`), `stamp`, `folder`,
`envelope`, `key`, `keyRing`, `lock`, `mailbox`, `phone`, `calendar` (`marked`), `drawer` (`cards`),
`bucket`, `chain` (`crack`), `doorway`, `roadSign` (`text`), `lever`, `steppingStones` (`n`),
`steeringWheel` (`turn`), `lighthouse` (`beam`), `boat` (`motor`, `compass`, `passengers`), `net`
(→ `path` for `isPointInPath`), `foldingDoc` (`n`, `open`), `pennant` (`pattern`), `flipCard`
(`flip`, `front`, `back`), `bubble(ctx, x, y, w, h, { tail, thought })`, `desk`. All take `p`.

## `EIA.engine.lamina`

| Call | Notes |
|---|---|
| `render(ctx, id, { t, still })` | full lámina from `EIA.data.deck`; `still` freezes the 8 s ambient loop (print, thumbnails, reduced motion) |
| `mountRender(id, q)` | `index.html?lamina=<id>[&dpr=2][&still=1][&t=…]`: bare canvas, `window.renderFrame(t)`, `window.renderReady` |
| `layout(entry, module)` → zones | `titular`, `subtitulo`, `cifras`, `figs[]`, `diagrama`, `ilustracion`, `idea`, `pie`, `sesion`, `full` |
| `diagram(ctx, diagrama, rect, { p, mono })` | `flujo`, `pasos`, `embudo`, `causal`, `columnas` (item `sign`), `ciclo`, `semaforo`, `linea`, `tarjetas` |
| `bigFigure(ctx, item, rect, o)` · `entry(id)` · `fontsReady()` · `reset(id)` | |

Module contract: `EIA.laminas.dNN = { setup(env), draw(ctx, s, env), drawAfter?(ctx, s, env), layout? }`,
`s = { t, still, loop, lamina, zones, state }`. Draw order: background → `draw` → diagram → big
figures → titular → session sign → Idea central → pie → `drawAfter`. `layout` may move or hide a
zone (`{ cifras: false }`, `{ diagrama: rect }`, `{ drawDiagram: false }`, `{ ilustracion: rect }`).

## Checks

| Command | Expect |
|---|---|
| `tools/dev/gallery.html?test=1` (headless `--dump-dom`) | every line `PASS`; `SUMMARY n passed, 0 failed` |
| `tools/dev/gallery.html?section=<signs\|people\|places\|machine\|props\|charts\|tags\|lettering\|lamina\|backgrounds>&page=N&p=0.5&t=2` | sheet to review by eye against prompt §3 |
| `tools/dev/gallery.html?mount=d07` | the `index.html?lamina=` path with the dev fixture deck |

Launch headless Chromium only through `tools/dev/chromium-safe.sh`, one browser at a time.
