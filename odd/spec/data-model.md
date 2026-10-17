# Data model of `js/data/` (T02)

Every text the site shows comes from these files, transcribed verbatim from the KB
(`contenido/base-estado-ia-2026.md`, v1.1). Read figures only through `EIA.cifra(id)`. After any edit,
run `node tools/check-content.mjs` (it must report 0 errors).

## Quick path

1. Need a number? Use a figure id (`adop-1`, `ctx-ley-vigor`) and `EIA.cifra(id)`; never type the number.
2. Need KB prose? Render the session/FAQ/course strings with `js/core/markup.js` (markup below).
3. Need UI chrome? `EIA.data.course.ui.<view>.<key>`; tool-specific copy lives in the tool's `actividades` entry.
4. Check: `node tools/check-content.mjs` (add `--verbose` to see every number and the figure behind it).

## Conventions

| Topic | Rule |
|---|---|
| Markup in KB strings | `[Etiqueta][clave]` citation (clave ∈ `EIA.data.fuentes`) · `{{id\|texto}}` registered figure (popover) · `**negrita**` · `*cursiva*` · `- ` lists, `1. ` numbered lists, two spaces per nesting level · `\| a \| b \|` pipe tables · blank line between paragraphs |
| Placeholders in UI strings | `{n}`, `{pista}`, `{puntaje}`, `{duracion}` — replace before display |
| Hints | Stored without "Pista:"; the UI composes `ui.feedback.casi` = "Casi. Pista: {pista}" |
| Signs | Keys such as `iceberg`, `matraz`, `luna` are drawing directions, never shown as text |
| Absent blocks | Sesión 7 has no `errores` and no `quiz` keys (not empty arrays) |

## Files and shapes

### `cifras.js` — `EIA.data.temas`, `EIA.data.cifras`

| Field | Meaning | Example |
|---|---|---|
| `temas[]` | `{ id, titulo, prefijo }`, the 10 KB §13 headings | `{ id: 'adopcion', titulo: 'Adopción y valor', prefijo: 'adop' }` |
| `id` | KB §13 row id (61 rows), then `ctx-<slug>` (9) | `adop-1`, `ctx-osworld-peldanos` |
| `tema` | `temas[].id` | `'america-latina'` |
| `cifra`, `alcance`, `tipo`, `estado` | KB cells verbatim (ctx: KB sentence without final period; `tipo: '—'`, `estado: ''`) | `estado: 'Verificada (corrige el «3»)'` |
| `alcanceCompleto` | Only when `alcance` is "Ídem…": the resolved text (shown/copied) | adop-2…6, cap-10, trab-2, trab-3, edu-3 |
| `clase` | `capacidad\|uso\|resultado\|expectativa\|proyeccion\|neutral\|ninguno` | `'neutral'` for "Índice", "Norma" |
| `fuentes` | Source keys in KB order | `['metr-th', 'metr-th11']` |
| `sesiones` | Sessions whose KB text uses it (`[]` for eco-5: no session text uses it) | `[1, 3, 7]` |
| `enBanco` | `true` for §13 rows, `false` for ctx | |

Context figures: `modelos-convergen`, `ley-vigor`, `ley-prohibiciones`, `ley-mayoria`, `omnibus-transitorio`,
`ilia-indicadores`, `colombia-quinto`, `medicos-experiencia`, `osworld-peldanos` (D4's "~66%" rung).

### `fuentes.js` — `EIA.data.fuentes`, `EIA.data.referencias`

- `fuentes[key] = { etiqueta, url, titulo, autor, grupo }` — 63 KB link keys in KB order.
  `etiqueta` is the short tag label (`'Stanford AI Index 2026, cap. 4'`); `titulo` the KB §16 link text
  (`'4 Economía'`); `autor` the §16 lead (`'Stanford HAI (2026)'`, `''` when the link text names the work);
  `grupo` the §16 group. Suggested display title: `autor + '. ' + titulo`.
- `referencias = [{ grupo, items: ['…markup…'] }]` — KB §16 verbatim, for the Referencias view.

### `sesiones/sN.js` — `EIA.data.sesiones[n]`

| Field | Meaning |
|---|---|
| `n`, `titulo`, `tema`, `signo` | KB heading after "Sesión N · "; KB §2 "Tema" (menu); session sign key |
| `tesis` | KB "Tesis." (markup, figures wrapped) |
| `diapositivas`, `diapositivasMapa` | `'1 y 2'` (session line) and `'1–2'` (KB §2) |
| `laminas`, `videos`, `actividades` | `['d01','d02']`, `['v01','v02']`, ids in `EIA.data.actividades` |
| `producto`, `productoSesion`, `pregunta` | KB §2 "Producto del equipo"; session "Producto:"; KB §2 "Pregunta guía" |
| `resultados[]`, `errores[]`, `discusion[]`, `lecturas[]` | KB list items verbatim (lecturas with links) |
| `agendaTitulo`, `agenda[]` | `'Agenda (120 min)'`; `{ desde, hasta, minutos: '0–15', bloque, recurso }` |
| `bloques`, `contenido[]` | `['Trabajo','Educación superior']` (S4, S5); `{ n, titulo, complemento?, cuerpo, bloque? }` — `complemento` is the text after a bold title without period (`'(informe base)'`, `'([Stanford, cap. 6][hai6])'`) |
| `actualizaciones[]` | `{ contenido, fuente, caja? }`: in that point, the paragraph citing `[…][fuente]` is an update (luna sign); `caja: true` = own box (McKinsey 2026) |
| `discusionTitulo` | `'Discusión'` or `'Discusión de cierre'` (S7) |
| `quiz[]` | `{ pregunta, opciones, respuesta (index), letra, explicacion ('' when the KB gives only the answer), pista }` |
| `facilitador` | `{ laminas: { d01: { decir, nota } }, claves: [{ actividad, titulo }] }` — key content lives in the activity |

### `deck.js` — `EIA.data.deck` (contracts §2 shape, plus)

- `diagrama.tipo` adds `barras` (D5). Per type: `ciclo.retorno` (index the return arrow points to),
  `causal.enlace` (dotted-line label), `linea.hitos` + `items[].carril` (D16), `tarjetas.items[].signo` (D17),
  `pasos.items[].luz` (1, 0.5, 0: lit, half, dark — D11).
- `items[]`, `cifras[]`, `rotulos{}` may carry `valor` (number for proportional marks), `aprox: '≈'` and
  `cuello: true` (D7 bottleneck). D7's one-third bar is `valor: 100 / 3`.
- `datos: { lamparas: { valor: 6, cifras } }` (D5): counts the illustration encodes without text.
- `notas = { decir, nota, metafora, correcciones? }` — `correcciones: ['pwc']` (D8), `['conpes']` (D15) name
  `EIA.data.correcciones` rows the notes must show ("the press release and the slides round").
- `diagrama` is the KB "Diagrama" bullet; other drawn structures are `rotulos`: D4 ladder, D8 balance,
  D12 traffic light (`luzRoja/luzAmbar/luzVerde`, `verde`, `ambar`, `rojo1–3`), D14 GPAI timeline
  (`lineaTitulo`, `ago2025/2026/2027`, `omnibus`), D17 closing phrase (`fraseFinal`, `ideaCentral: null`).

### `actividades.js` — `EIA.data.actividades`, `cuaderno`, `rubrica`, `modoClase`

Every activity: `{ id, sesion, tipo, titulo, kb?, hoja? }`; `kb = { titulo, duracion, consigna, pasos, tabla?, clave? }`
is the KB block verbatim; `hoja` is the notebook sheet it feeds.

| Id | Tipo | Specific fields |
|---|---|---|
| `s1-que-mide` | juego-tipos | `bins[{ clase, label, pista }]`, `cards[{ id, cifra, fuente, claveKB, tipo, clase, nota, cifras, correccion? }]`, `clave{ titulo, columnas }` |
| `s2-pasos` | calculadora | `p`, `n` sliders `{ label, min, max, paso, inicial }`, `presets[{ label, p, n, resultado, ilustrativo }]`, `sello`, `formula` |
| `s3-embudo` | embudo | `lamina: 'd07'` (bars = its diagram), `barras` ids, `nota`, `edicion2026{ panel, label, nota, cifras }` |
| `s5-escalera` | escalera | `peldanos[6]`, `afirmaciones[{ id, text, escalon, color, clave, detalle[], cifras }]`, `claveTitulo`, `colores` |
| `s6-calendario` | calendario | `capas[{ id: 'ley'\|'omnibus', label }]`, `hitos[{ id, capa, fecha, iso, etiqueta, texto, cifras, estado?: 'aplazado', estadoConOmnibus?: 'sin cambios', tarjeta?: 'texto' }]`, `sellos`, `nota` |
| `s7-indicadores` | indicadores | `columnas`, `niveles[{ id, nivel, indicadores, pregunta }]` (9) |
| `s7-escenarios` | escenarios | `escenarios[{ id, titulo, texto, patron }]` (rendered with S7 contenido 7; not in the session's tool list) |
| `s7-presentacion` | temporizador | `fases[{ id, label, minutos }]` (7 + 3) |
| others | ficha / tabla / plan | `kb` + `hoja` |

- `cuaderno = { campos[{ id, label }], hojas[{ id, sesion, titulo, actividad?, secciones[] }] }`; section `tipo`:
  `campos`, `filas` (`min`, `max`, `columnas[{ id, label, tipo: texto|opcion|numero|sino|fecha, opciones?, si?, opcionesDe? }]`),
  `eleccion` (`elegir`, `opciones`, `campo`), `opcion`, `matriz` (`encabezado`, `columnas`, `filas`), `costos`, `texto`, `cifras`.
- `rubrica = { titulo, nota, columnas, niveles[{ n, label }], fracciones: { 4: 1, 3: 0.75, 2: 0.5, 1: 0.25 }, criterios[{ id, criterio, peso, niveles: { 4…1 } }] }`.
- `modoClase = { opciones[{ id, sesion|sesiones, label, minutos? }], bloques: { n: [{ agenda (index), laminas?, videos?, actividades?, contenido?, evidencia?, pregunta?, discusion?, quiz? }] } }`.

### Other files

| File | Shape |
|---|---|
| `correcciones.js` | `{ titulo, columnas, filas[{ id, antes, ahora, fuente, fuentes, cifras }], actualizacionesTitulo, actualizaciones[{ id, titulo, texto, fuentes, cifras }] }` — `cifras` drive "Ver corrección" |
| `glosario.js` | `[{ id, termino, definicion, variantes, excluir? }]` — `excluir`: phrases where a variant has another meaning ("exposición con diapositivas") |
| `faq.js` | `[{ n, id: 'p1', pregunta, respuesta }]` |
| `asistente.js` | `{ intro, kb0: { titulo, texto (KB §0 verbatim) }, base: { archivo, nota }, plantillas[{ id, titulo, texto, blancos }], cierre }` |
| `course.js` | `{ kb, hero, pregunta, ficha, comoUsar, mapa, marco, evaluacion, banco, leyenda, footer, ui }` — one object literal; later owners add `ui.player` etc. |

`course.ui` holds shared chrome by view (`nav`, `inicio`, `mapa`, `evidencia`, `sesion`, `videos`, `citas`,
`banco`, `proyecto`, `glosario`, `preguntas`, `referencias`, `asistente`, `feedback`, `cuaderno`, `rubrica`,
`laminas`, `modoClase`). Player copy (prompt §6–§7) belongs to the video-runtime owner (`ui.player`).

## Checklist after editing

- [ ] `node tools/check-content.mjs` → 0 errors.
- [ ] `node --test tools/test/` → all pass.
