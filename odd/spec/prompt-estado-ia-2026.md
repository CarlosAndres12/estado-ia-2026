# PROMPT · Sitio "Estado de la IA 2026: adopción masiva, valor aún por demostrar"

## 0. How to read this prompt

- Instructions are in English; **everything the site shows or says is in Spanish (Colombia / Latin America)**. Spanish text in quotes is final copy: use it verbatim, with its accents.
- **This prompt comes with the course knowledge base**: *Base de conocimiento del curso «Estado de la IA 2026»*, versión 1.1 (17 de octubre de 2026), called **the KB** here and cited by its section numbers (KB §13 = Banco de cifras). Save it unchanged as `contenido/base-estado-ia-2026.md` before you start. The KB is the single source of truth for every figure, source, date, session text, activity, quiz, glossary entry and reference: transcribe it into `js/data/` verbatim and never paraphrase a figure. **If the KB is not in your context or workspace, stop and ask for it.**
- This prompt adds what the KB does not have: the visual system, the 17 illustrated láminas, the 9 narrated videos (their scripts in section 13 are final copy), the interactions and the tools. If this prompt and the KB disagree on a fact, the KB wins; list the conflict in the README.
- Notation used throughout:
  - `[corchetes]` = a blank the participant fills in.
  - `✓` = the correct option of a question.
  - `NARRADOR:` / `LECTORA:` = voice role of a line. Every scene block is written as **id (min N s)**, then **Se ve** (what is on screen; it becomes the scene's `seVe`), then its voice lines.
  - `⟨adop-1⟩` after a line = the figure ids (section 5.4) whose numbers the line uses; `⟨ctx: …⟩` = a context figure (5.4); `⟨ilustrativo⟩` = the line uses an illustrative example, not data; `⟨adv N⟩` = the line states course warning N (section 4.2).
  - `(pausa N s)` after a line = its `pause`; `(say: "…")` = its explicit speakable text.
  - Quoted Spanish text inside **Se ve** = final on-screen copy of that scene (its `rotulos`, 5.5); unquoted words there are drawing directions.
  - `CHECKPOINT` = question · options · explanation, placed after the scene it follows.
- **MUST** = non-negotiable; **SHOULD** = strong default; **MAY** = optional.
- Contents: 1 Mission · 2 Audience and tone · 3 Visual identity · 4 Course legend · 5 Architecture · 6 Video system · 7 Player · 8 Voice-over · 9 Website · 10 Interactions · 11 The seven sessions · 12 The 17 láminas · 13 The 9 videos · 14 Accessibility, performance, print · 15 Build order · 16 Acceptance checks.
- Finish everything described here; do not stop at a skeleton. When something is ambiguous, choose the option that keeps the site working offline, keeps every text editable from `js/data/`, keeps every figure traceable to the KB, and keeps the people warm and the machine cool (section 3).

---

## 1. Mission and deliverables

Build a complete static website, in Spanish, for the course **"Estado de la IA 2026"** (KB §1): 24 hours, 7 sessions of 2 hours, for teachers, researchers, managers, public servants and professionals who decide about the use of AI. The site is the course companion for participants and the projection tool for facilitators. It is illustrated entirely with procedural animation in a visual language inspired by the art of **Joan Miró**, and it embeds **9 animated explainer videos** with Spanish voice-over.

Deliverables:

1. **A one-file site** (`index.html` with hash-routed views) that follows the course: inicio, mapa del curso, marco de evidencia, the 7 sessions (agenda, láminas, video, content, frequent misreadings, interactive activities, discussion, quiz and readings), a searchable **banco de cifras** with copy-ready citations, corrections and updates, the final project with a team notebook and the rubric, glossary, FAQ, references, a page for the course assistant, and a **"Modo clase"** to project each session.
2. **17 láminas drawn on canvas** (section 12): the course deck (the KB's "Guion de diapositivas") redrawn in the site's visual language, with speaker notes, printable as handouts.
3. **9 videos drawn live on canvas** (section 13), with Spanish voice-over in two voices, subtitles, chapters, checkpoint questions and on-screen source tags:
   - V01 and V02 (sesión 1), V03 (sesión 2), V04 (sesión 3), V05 and V06 (sesión 4), V07 (sesión 5), V08 (sesión 6), V09 (sesión 7).
   - Long-form: about 2½–8 minutes each, organized in chapters (6.2). The engine must support any length.
4. **Dev-only Node tools**: voice-over with **Azure AI Speech using the voice `es-MX-JorgeNeural`** for the narrator (section 8), a content checker that proves every figure is traceable to the KB (5.8), review snapshots and, optionally, MP4 export of every video.

**Definition of done** (details in section 16): the site opens offline by double-clicking `index.html`, with no console errors; all 9 videos play start to finish in sync with voice and subtitles; the 17 láminas render; `tools/check-content.mjs` reports zero errors; every text is editable from `js/data/*.js`; the art follows section 3 on every screen.

### Non-negotiables (summary)

1. All visible and spoken text in Spanish, with correct accents.
2. **Every figure is traceable.** Every data figure shown or spoken comes from the KB through `js/data/cifras.js` and appears with its source and its evidence type. Nothing is invented, combined, re-rounded or extrapolated, and nothing the KB does not state is drawn (no extra dates, countries or values to fill a picture). Illustrative examples are labeled "Ejemplo ilustrativo".
3. **Only the corrected versions** (KB §14). Where a slide script or activity card in the KB uses a version that KB §14 corrects, use the corrected one. The UNESCO "34%" is never shown as a figure: it appears only where the KB warns against it (the corrections table, struck through; KB §0; the D10 note). Colombia is "adoptante", never "pionero". Editions of the same survey are never drawn or read as a series.
4. No image, SVG or icon-font files: everything is drawn procedurally on `<canvas>`.
5. Works from `file://` with no network requests at runtime. Links to sources are plain links the user chooses to open.
6. Deterministic rendering: any frame is a pure function of its time.
7. People and their world are drawn in the warm, free, Miró-inspired style; AI systems and the controlled world of benchmarks are always small, cool and ruler-drawn (3.5).
8. Inspired by Miró, never a copy: no reproduction of any specific artwork, logo or signature (3.12).
9. The five evidence types always appear as color + sign + label (or sign + label), never color alone (section 4).
10. **Honest charts**: every bar, area, dot count, angle and position is exactly proportional to its value; brush wobble never changes an encoded value (3.7).
11. Organizations and products appear only as named sources or as part of a cited figure, in plain text: no logos, no brand art, no endorsement.
12. Legal topics are information, not legal advice; health topics are not clinical advice (KB §0, rule 10).

---

## 2. Audience, language and tone

- **Audience**: the participants described in KB §1 ("Público": they decide about AI, do not need to code, but must read figures critically) and the facilitators who teach the sessions and project the site.
- **Language: clear and precise.** Technical words are fine where the KB uses them. Terms of the KB glossary (KB §12) get a glossary tooltip the first time they appear in a view, and the first time a video says one, its definition appears on screen (6.10); any other technical word in prompt-written copy is explained in the same sentence or avoided. Names of benchmarks, reports and institutions stay as proper nouns (OSWorld, PaperArena, AI Index…). No code, and no formulas except the illustrative step calculation of session 2, always labeled. Avoid hype ("revolucionario", "disruptivo", "mágico"), doom and anthropomorphism ("la IA piensa", "la IA quiere").
- **Tone**: sober, curious, respectful and practical, with Latin American examples when they help (KB §0, rule 12). Core message: **"No importa cuánta IA se usa, sino cuánto valor verificable produce."** Supporting habits: the four warnings (4.2) and the question **"¿Qué mide esta cifra?"**.
- **Honesty** (KB §0): every figure with its source, evidence type and scope (country, year, population, method); corrected versions only; newer editions mentioned where the KB mentions them, saying that the course uses the edition of the base report; editions never mixed as a series; data always distinguished from illustrative examples; the base reflects what was published up to October 2026.
- **Neutrality**: nothing is recommended or promoted. A company or product is named only when it is part of a cited figure or finding (for example, "66% usa ChatGPT", or the six developers whose models converged in March 2026), in plain text, never as a logo. Illustrations show AI only as the generic lamp (3.5). The voice provider is named only in `tools/` and in the README.
- **Transparency**: the footer states that the narration uses synthetic voices and which KB version and verification date the site uses (9.10).
- **Sensitive topics**: medicine without gore, patients in distress or clinical advice; risks without apocalyptic imagery (no killer robots, explosions or skulls); the EU prohibitions on non-consensual sexual deepfakes and child sexual abuse material are stated in plain text only and never illustrated.

---

## 3. Visual identity: "Miró en la libreta de campo" (most important — applies to the videos, the láminas AND the page)

### 3.1 Concept

Every screen should look like an original gouache-and-lithograph painting **in the spirit of Joan Miró** — bold black calligraphic lines, flat primary colors, floating poetic signs — made on the pages of a researcher's field notebook, where someone reads the figures of the year with a pencil in hand. Playful and luminous, never flat corporate vector art and never a museum reproduction. The art carries the course message: **people and the real world are warm and free; AI systems and controlled conditions are small, cool and ruled; the distance between the two is the distance between a benchmark and real performance.**

### 3.2 Line, shape, color and texture

- **Black calligraphic line** is the backbone: variable-width brush strokes that swell and taper, lines that loop, spiral and end in a small dot, an occasional thin second stroke beside a thick one. Outlines are slightly imperfect and never ruler-straight (only the machine is ruler-straight, 3.5). Lines **draw on** like a brush moving, in stroke order.
- **Biomorphic shapes**: rounded, organic forms filled with **flat, saturated color** (red, yellow, ultramarine blue, green, black), with cream left free around them.
- **Color fields live independently of the line**, as in a lithograph: each fill is offset 2–4 px from its outline, sometimes spills past it, sometimes leaves a sliver of cream inside it. The offset is seeded, stable and never flickers. **Exception: data marks (3.7).**
- **Overlap rule**: where two colored shapes overlap, the intersection is filled with black or a third color, never blended.
- **Texture instead of hatching**: no cross-hatching. Gouache texture (brush streaks, uneven saturation, slightly darker edges), soft washes that bleed, a few ink spatters and dot clusters, fine paper grain. All textures use the seeded RNG and are pre-rendered offscreen.
- **Composition**: flat space with little or no perspective, elements floating on open fields, generous empty cream, one clear subject per frame. Decoration never competes with the idea or the figure being explained.

### 3.3 The sign vocabulary (`figures.js`, all parameterized and seeded)

Miró-like "signos" reused across page, láminas and videos: irregular star (5–8 strokes of different lengths, sometimes with a dot or a small colored center), crescent moon, red sun disc, bird, ladder, spiral, comet with a tail of dots, hair-like strands, biomorphic blob, dot cluster, spatter, and a **free constellation** (hand-drawn dots joined by loose curves — the human counterpart of the machine's regular grid). Course signs built from the same vocabulary: the five evidence signs (4.1), the estado signs (4.3), the warning stamps (4.2) and the session signs (4.4). Eyes exist only on people.

### 3.4 People and places

- **People** are simple, friendly "personajes": rounded biomorphic bodies with flat color, black brush outlines, dot eyes, small smiles, hair as calligraphic strokes, clear poses (standing, writing, pointing, reading, presenting, looking up). Adults of the course's world: a directiva, a servidor público at a service window, a docente universitaria, investigadoras, a médica, a desarrollador, university students, a campesina, teams of 3–4 around a table. Diverse skin tones (Pieles palette), hair, ages, body types and genders; generic clothes without logos. No real or famous people (Miró himself is never depicted), no brands, nothing grotesque, scary or sexualized: no teeth, claws or distorted anatomy.
- **"La lectora"**: the recurring character who voices the critical questions (role `lectora`, section 8): a woman with round glasses, a notebook and a pencil; same seeded design in every video. She never holds a magnifying glass (that sign belongs to "Resultado observado").
- **Places**: oficina; universidad (patio, aula, biblioteca); laboratorio with warm glassware; hospital and a doctor's desk drawn in warm shapes; a night sea (iceberg); an Andean cordillera; river, valley and reservoir; a Latin American city with rooftops; Latin America and the Caribbean as one biomorphic landmass without borders; a calligraphic road with stations.

### 3.5 The machine and the laboratory (the exception that carries the course message)

- The AI is always **"la lámpara de IA"**: a small glowing lamp/window made of thin, perfectly straight pale-blue lines and perfect circles on a deep navy disc, letters flowing through it like tiny regular stars. It **never** gets eyes, a face, a body, a humanoid shape or a brain icon.
- Machine variants, all ruled and cool: an **agent** is the lamp moving along a ruled loop or ruled steps; **models** are several identical lamps; a **data center** is a ruled tower of identical cells; **compute** is a block of identical cells. The deck's "robot aprendiz" (D4) and "pelotón de ciclistas" (D5) become lamps (section 12).
- **Controlled conditions belong to the machine's world**: benchmarks, exams and laboratory evaluations are ruled navy panels with a fine regular grid. Real work, classrooms, hospitals and territory are warm and free. When a scene goes from a benchmark to real work, it goes from the navy grid to the cream page.
- Its geometry is the **only perfectly regular thing on screen**: the human world has free hand-drawn constellations; the machine has an ordered grid of identical dots. Wherever the AI appears, its area switches to the "Máquina" palette: deep navy, thin pale-blue linework, small green and magenta glows.

### 3.6 Backgrounds by scene type

- **Personas y organizaciones**: cream lienzo with a soft gouache wash; the faint ruled lines and margin line of a field notebook underneath.
- **Territorio**: mottled ochre, sand or sky washes; the horizon as one calligraphic line; contours as loose concentric loops.
- **Mar nocturno**: ultramarine and noche washes, calligraphic waves, crescent moon, irregular stars.
- **Máquina y laboratorio controlado**: deep navy field with a fine regular grid, measurement ticks and thin construction lines.
- **Datos**: cream page with a faint dot grid (the graph page of the field notebook) behind charts.

### 3.7 Data in the Miró language (honest charts — MUST)

Charts use the same language — brush outlines, flat gouache fills, signs — but the data is exact:

- **Exact encoding.** Bar lengths, areas, dot counts, gauge angles and axis positions are exactly proportional to their values, on a scale that starts at zero and is shared by every mark in the frame. Wobble and offset fills (3.2) never touch a value-carrying edge: the end of a bar is a clean stroke at the exact value (wobble ≤ 1 px), and fills are offset only across a bar, never along it.
- **Counts and shares as units**: counts up to a few hundred are drawn as that many dots or signs (44 clusters vs 8); percentages as bars or unit grids (100 dots, or 1.000 dots when the value has a decimal). No pies, no 3D, no perspective, no broken axes.
- **Approximate and bounded values keep their wording**: "~", "cerca de" and "casi" are drawn at the stated value with a dotted end cap and "≈"; "más de" and "menos de" at the stated value with an open arrowhead in the right direction; "hasta" as a maximum with the word "hasta" beside it.
- **Ranges and intervals** ("14–15%", "5,8–8,8%", "IC 95%: −38% a +9%") are a band or an interval line with end ticks, with zero marked when it matters.
- **Unknown values are never drawn.** If the KB only says "en ninguna función el escalamiento supera 10%", draw the 10% line and the sentence, never invented bars under it.
- **No invented series**: two editions of a survey, two sources or two methods are never joined by a line or placed on one axis; they go on separate panels, each with its own source tag and the note "No se compara directamente".
- **Labels**: every mark carries its value in Spanish format ("66,3%", "344.700 millones de dólares"), a short description and a source tag (3.8). Values grow from zero, and the exact final frame holds while the number is spoken and for at least 2 s.
- Every chart has a text alternative: a visually hidden table on the page, the transcript in videos.

### 3.8 Source tags and evidence chips

- **Source tag ("etiqueta de fuente")**: a small cream paper tag with a thick, slightly irregular black outline and a punched hole, tied to its number by a thin calligraphic thread. It shows the evidence chip, the short source label ("McKinsey, 2025", "Stanford AI Index 2026, cap. 2") and, when there is room, the scope ("EE. UU.", "16 países"). Figures whose estado is not "Verificada" show the estado sign (4.3) in a corner.
- **A number is never on screen without its tag**, and the tag stays at least as long as the number. Years and dates that only name a moment (a road sign "2028") get no tag; dates that are facts of the KB (the AI Act timeline) are tagged as a group.
- **Evidence chip**: the type's sign + label, in full form (sign filled with the type color) or monochrome form (tinta only), section 4.1.

### 3.9 Palettes (constants in `js/engine/palette.js`, mirrored as CSS custom properties in `css/tokens.css`)

| Group | Name | Hex | Use |
|---|---|---|---|
| Mundo | lienzo | `#F4EEDF` | paper, page background |
| Mundo | lienzo ocre | `#E7D3A8` | washed grounds |
| Mundo | tinta | `#15120F` | line, text |
| Mundo | rojo | `#D7261E` | suns, accents |
| Mundo | amarillo | `#F5C518` | stars, light |
| Mundo | azul ultramar | `#1C3F95` | sea, night, shapes |
| Mundo | verde | `#1E8A4C` | mountains, plants |
| Mundo | celeste | `#86BEE3` | sky, rivers, ice |
| Mundo | tierra | `#C68A2E` · `#94461C` · `#6B4426` | ochre, sienna, wood |
| Mundo | oro | `#E2B33C` | coins (capital) |
| Pieles | 5 tones | `#F2CDAE` · `#DDA77A` · `#B97B4B` · `#8A5634` · `#5C3A24` | people |
| Máquina | noche / línea / rejilla | `#0E1A3B` / `#A9D6FF` / `#2A3D6E` | the AI's world and controlled conditions |
| Máquina | brillo verde / brillo magenta | `#46F0B0` / `#F45CCF` | small glowing accents |
| Evidencia | 5 types | `#0072B2` · `#E69F00` · `#009E73` · `#CC79A7` · `#D55E00` | the five evidence types only (4.1) |

Text is always tinta on lienzo (or lienzo on noche) and meets WCAG AA; saturated colors are for shapes, never for body text. The clinical traffic light (4.4) uses Mundo rojo, amarillo and verde, always with position, sign and label.

### 3.10 Typography

- **Page**: body in a highly legible sans (≥18 px), e.g. self-hosted Atkinson Hyperlegible or a system stack; headings in a bold, characterful display (self-hosted open-license font in `assets/fonts/` or a system serif stack), never a CDN. Big view titles MAY be canvas-lettered.
- **Canvas**: subtitles ≥30 px sans; titles brush-lettered (thick black letters, each glyph with a tiny seeded rotation/offset, written letter by letter, some counters filled with a flat color, small stars or dots between words, a wavy underline that ends in a dot).
- **Numbers**: tabular figures in charts and tables; Spanish formats exactly as the KB writes them (decimal comma, thousands point, "%" without a space, en dash for ranges: "66,3%", "344.700", "2026–2028").

### 3.11 The page in the same language

- Cream lienzo with grain; a few floating signs drawn once at load and reused as CSS backgrounds via `canvas.toDataURL()`.
- Calligraphic underlines and dividers that draw on when they scroll into view.
- Cards with a thick, slightly irregular black brush outline and a flat biomorphic shape peeking from behind one corner (instead of a drop shadow).
- Source tags as small paper tags; "Error de lectura" cards marked with a spiral; correction cards with the old version struck through by one calligraphic line; handwritten-style margin notes with a small sign (glossary notes, facilitator tips).
- Feedback never relies on red/green: a right answer gets a bursting yellow star + "¡Muy bien!"; a wrong try gets a gentle spiral + "Casi. Pista: …".

### 3.12 Originality guardrails

Use Miró's vocabulary of line, color and signs as inspiration only. **Never reproduce, trace or closely imitate any specific Miró artwork**, and never reproduce the logos he designed (for example, a sun for Spanish tourism or a bank's star) or his signature. Every composition is original and serves the idea. The footer credits the inspiration (9.10); no other mention of Miró appears on screen.

---

## 4. The course legend (one set of constants reused in every lámina, video and view)

### 4.1 The five evidence types (KB §3.1)

| Tipo | Color | Sign | "Qué es" (verbatim KB §3.1) |
|---|---|---|---|
| "Capacidad técnica" | `#0072B2` (azul) | matraz | "Desempeño en evaluaciones controladas (benchmarks)" |
| "Uso declarado" | `#E69F00` (naranja) | bocadillo | "Lo que personas u organizaciones dicen hacer" |
| "Resultado observado" | `#009E73` (verde azulado) | lupa | "Cambio medido en tiempo, costo, calidad o empleo" |
| "Expectativa" | `#CC79A7` (púrpura rojizo) | catalejo | "Intenciones declaradas" |
| "Proyección" | `#D55E00` (bermellón) | cometa con cola de puntos | "Estimación a futuro" |

- Colorblind-friendly (Okabe–Ito based). Always sign + label; color is an extra, never the only cue. Chips have a **full form** (sign filled with the type color) and a **monochrome form** (tinta only); use the monochrome form in any frame that already has another color legend (for example the clinical traffic light).
- Other labels in the "Tipo" column of KB §13 ("Índice", "Proyección/índice", "Norma", "Norma/plan", "Uso observado") get a **neutral chip**: tinta outline, small square sign, label verbatim. Rows whose type is "—" get no chip.
- **"Ejemplo ilustrativo"**: tinta dashed outline, pencil sign, label "Ejemplo ilustrativo · no es un dato".
- **Meaning zones**: where the five types are taught, compared or sorted (V02's first chapter, the S1 game, the banco's filter bar, the #evidencia cards), decorative color steps aside: floating signs there are black only. Everywhere else, chips sit on their source tags and decorative signs never use the five type colors.
- These five colors are never used for any other meaning.

### 4.2 The four warnings (KB §3.4)

| N | Texto | Stamp |
|---|---|---|
| 1 | "Uso no es valor." | bocadillo ≠ moneda |
| 2 | "Benchmark no es desempeño real." | matraz ≠ mesa de trabajo |
| 3 | "Exposición no es desempleo." | sol sobre un escritorio ≠ silla vacía |
| 4 | "Asociación no es causalidad." | dos pájaros que vuelan juntos ≠ flecha que empuja |

Round ink stamps in tinta only (never in the type colors), with the two signs separated by a calligraphic crossed equals sign. In videos, a line marked `⟨adv N⟩` presses the stamp into a corner for 3 s. On the page, a small "Advertencia N" stamp appears wherever the KB invokes one.

### 4.3 Estado of a figure (KB §13)

| Estado | Sign | Meaning (verbatim KB §13) |
|---|---|---|
| "Verificada" | sello redondo con un visto | "contrastada con la fuente original el 17 de octubre de 2026." |
| "Con matiz" | asterisco | "verificada, pero con una precisión de alcance que conviene decir." |
| "Actualización" | luna creciente | "dato posterior al informe base." |
| "Informe base" | libro abierto | "tomada del informe base y no verificada individualmente." |

Keep any note the KB adds to an estado ("Verificada (corrige el «3»)") verbatim.

### 4.4 Other legends (meaning by sign, number and position, never by the type colors)

- **Session signs**: 1 iceberg · 2 cordillera · 3 puente · 4 escalera sin primer peldaño · 5 microscopio · 6 volante · 7 faro. Used in the nav, the map, cards and Modo clase.
- **Clinical traffic light** (KB §8): fixed positions, top "Rojo" (cross sign), middle "Ámbar" (half disc), bottom "Verde" (check star), each with its label.
- **Ladder of evidence** (KB §8, contenido 6): six numbered rungs.
- **Risk families** (KB §9): anzuelo (uso malicioso), grieta (fallos), red de hilos sobre un pueblo (riesgos sistémicos).
- **Governance cycle** (KB §9): six numbered stations.
- **Scenarios** (KB §10): four windows with pattern fills (dots, stripes, small stars, checks) and labels.
- **Agenda blocks and rubric levels**: numbers and pattern fills.

---

## 5. Technical architecture

### 5.1 Constraints

- Plain HTML, CSS and vanilla JavaScript. No frameworks, libraries, CDNs or build step; no network requests at runtime.
- No image files, no SVG files, no icon fonts: every illustration, icon and decoration is drawn procedurally on `<canvas>` by the shared engine (small page decorations may be drawn once at load and reused as CSS backgrounds via `canvas.toDataURL()`). Only generated narration audio, captions and optional exported videos live in `assets/` (plus optional self-hosted fonts).
- Must work offline by double-clicking `index.html` (`file://`): classic `<script defer>` files sharing one global namespace (`window.EIA`) instead of ES modules; all data shipped as `.js` files (never fetch JSON); hash routing only. Whatever browsers block on `file://` (recording with voice) degrades with a clear Spanish message; the README explains how to serve the folder locally.
- `<html lang="es">`, `<meta charset="utf-8">`, correct Spanish characters (á é í ó ú ñ ü ¿ ¡ º « »).
- **Edit-friendly**: all copy, figures, scene lists, minimum durations and voice lines live in `js/data/`, so the facilitator can change any Spanish text without touching drawing code; palettes and legend constants live in one file. Each video and each lámina lives in its own file and depends only on the engine API, so they can be built and reviewed independently (even by parallel agents). Reusable drawing goes in `figures.js` and `chart.js`.
- **No text or number is typed in drawing code.** Video code takes its on-screen copy from the scene's `rotulos` (5.5) and lámina code from `deck.js`; every figure, chip and source tag comes from `env.cifra(id)`.

### 5.2 File structure

```
estado-ia-2026/
  index.html                one page, hash-routed views; loads css/ and js/ in order:
                            core, data, assets manifests, engine, laminas, videos, ui, main
  README.md                 in Spanish (16.2)
  contenido/
    base-estado-ia-2026.md  the KB v1.1, unchanged; source of truth; never loaded by the page
  css/tokens.css            palettes, evidence colors, type scale, spacing
  css/base.css              lienzo background, typography, focus styles, reduced motion
  css/layout.css            header, nav, views, grids, responsive
  css/components.css        cards, chips, source tags, tables, buttons, player chrome, overlays,
                            games, worksheets, stamps
  css/print.css             banco, láminas, cuaderno, session guide
  js/core/namespace.js      window.EIA = { data, engine, laminas, videos, ui } + utilities: Spanish
                            number formatting, accent-insensitive search, safe storage (try/catch)
  js/core/router.js         hash routes and deep links (#s3/actividad)
  js/core/markup.js         tiny parser for the KB text subset (5.3); no library
  js/data/course.js         hero, ficha (KB §1), mapa (KB §2), marco (KB §3), evaluación (KB §11),
                            UI copy, facilitator placeholders, footer
  js/data/sesiones/s1.js … s7.js   KB §4–§10, one file per session
  js/data/cifras.js         figure registry: every KB §13 row + context figures (5.4)
  js/data/fuentes.js        references, keyed by the KB link labels (mck25, hai2, …)
  js/data/correcciones.js   KB §14
  js/data/glosario.js       KB §12
  js/data/faq.js            KB §15
  js/data/deck.js           the 17 láminas (section 12)
  js/data/videos.js         DATA ONLY: the 9 videos (5.5, section 13)
  js/data/actividades.js    game cards and keys, worksheet schemas (section 10)
  js/data/asistente.js      KB §0 and the participant templates (9.9)
  js/engine/rng.js          seeded PRNG (mulberry32) + hash(string) -> seed
  js/engine/easing.js       ease in/out, back, clamp, lerp, segment(p, a, b)
  js/engine/palette.js      Mundo, Pieles, Máquina and Evidencia palettes; legend constants (section 4)
  js/engine/ink.js          brush strokes, draw-on paths, offset fills, overlap fills, washes, grain,
                            spatter, notebook lines and dot grid, contour loops, machine grid,
                            brush lettering, glow
  js/engine/chart.js        honest data marks (3.7): bars, unit grids, dot counts, bands, intervals,
                            gauges, timelines, proportional funnels
  js/engine/tags.js         canvas source tags, evidence chips, estado signs, warning stamps,
                            "Ejemplo ilustrativo" stamp
  js/engine/figures.js      characters, places, props, signs and icons (5.7)
  js/engine/lamina.js       lámina layout engine (12.1)
  js/engine/timeline.js     scene, line and checkpoint times; chapters; crossfades
  js/engine/captions.js     subtitle band, chunking, linear checkpoint cards
  js/engine/narrator.js     audio-track mode + browser-voice fallback
  js/engine/player.js       video player component (canvas + HTML controls)
  js/engine/recorder.js     MediaRecorder download
  js/laminas/d01.js … d17.js   one illustration per lámina (section 12)
  js/videos/                v01-iceberg.js, v02-que-mide.js, v03-frontera.js, v04-del-uso-al-valor.js,
                            v05-tareas.js, v06-aprendizaje.js, v07-del-benchmark-al-ensayo.js,
                            v08-gobernanza.js, v09-de-consumir-a-construir.js
  js/ui/                    hero.js, nav.js, views.js, chips.js, glossary.js, reveal.js, decor.js,
                            banco.js, quiz.js, games.js, worksheets.js, proyecto.js, rubrica.js,
                            laminas-viewer.js, presenter.js, asistente.js
  js/main.js                boot
  assets/audio/             GENERATED: <id>.mp3 + manifest.js (ship an empty manifest.js)
  assets/captions/          GENERATED: <id>.vtt
  assets/video/             OPTIONAL GENERATED: <slug>.mp4 + index.js (ship an empty index.js)
  assets/fonts/             OPTIONAL self-hosted open-license fonts
  tools/                    dev-only Node, never needed to view the site:
    package.json            dependencies: microsoft-cognitiveservices-speech-sdk, playwright (or puppeteer)
    voice.config.json       engine, voices per role, rates, output format, loudness target
    .env.example            AZURE_SPEECH_KEY=… / AZURE_SPEECH_REGION=… (never commit real keys)
    lib/load-data.mjs       evaluates js/data/*.js in a vm sandbox
    lib/normalize-es.mjs    Spanish display text -> speakable text (8.4)
    lib/ssml.mjs            escaped SSML (voice, prosody, breaks, bookmarks, sub)
    lib/tts-azure.mjs       Azure AI Speech adapter (section 8)
    lib/kb-parse.mjs        parses the KB Markdown (sections, §13 tables, links)
    check-content.mjs       traceability checker (5.8)
    generate-voiceover.mjs  synthesizes, measures, builds the timeline, mixes, writes assets
    check-voiceover.mjs     OPTIONAL: transcribes clips back and flags mispronunciations
    snapshots.mjs           review frames + contact sheets for videos and láminas
    render-videos.mjs       OPTIONAL MP4 export
    .cache/                 synthesized clips keyed by hash (gitignored)
```

### 5.3 Data model: sessions (`js/data/sesiones/sN.js`)

```js
EIA.data.sesiones[3] = {
  n: 3, titulo, tesis,                      // KB text with its citations, verbatim
  laminas: ['d06', 'd07', 'd08'], videos: ['v04'],
  producto, pregunta,                       // from KB §2
  resultados: [...],                        // "Resultados de aprendizaje"
  agenda: [{ desde: 0, hasta: 30, bloque, recurso }],
  contenido: [{ titulo, cuerpo }],          // KB "Contenido", numbered as in the KB
  errores: [...],                           // "Errores de lectura frecuentes" (absent in sesión 7)
  actividades: ['s3-embudo', 's3-linea-base'],   // ids in actividades.js
  discusion: [...],                         // sesión 7: "Discusión de cierre"
  quiz: [{ pregunta, opciones, respuesta, explicacion, pista }],   // absent in sesión 7
  lecturas: [...],                          // with their links
  facilitador: { laminas: { d07: { decir, nota } }, claves: {...} }   // KB "Qué decir", "Nota", keys
}
```

KB text keeps its own markup, parsed by `js/core/markup.js`:
- `[Etiqueta][clave]` — a KB citation; rendered as a small source tag linked to its reference.
- `{{adop-1|88%}}` — SHOULD: a number that comes from a registered figure; rendered with a dotted underline and a popover (10.1).
- `**negrita**`, `*cursiva*`, lists, numbered lists and tables, as in the KB.

### 5.4 Data model: figures (`js/data/cifras.js`)

Every number the site, the láminas or the videos show must resolve to an entry here.

```js
{
  id: 'adop-1',
  tema: 'adopcion',        // KB §13 heading, slugged
  cifra: '88% usa IA regularmente en al menos una función (78% un año antes)',   // verbatim KB
  alcance: 'Encuesta a 1.993 participantes de 105 países, del 25 de junio al 29 de julio de 2025',
  tipo: 'Uso declarado',   // verbatim KB label
  clase: 'uso',            // capacidad | uso | resultado | expectativa | proyeccion | neutral | ninguno
  fuentes: ['mck25'],      // keys of fuentes.js (the KB link labels)
  estado: 'Verificada',    // verbatim KB label, with its note if any
  sesiones: [1, 3, 7],     // sessions whose KB text uses it
  enBanco: true
}
```

- **Ids of KB §13 rows**: the rows in order under each heading, with these prefixes: `adop` (Adopción y valor), `cap` (Capacidad técnica), `eco` (Economía e infraestructura), `prod` (Productividad), `trab` (Trabajo), `edu` (Educación), `cien` (Ciencia), `med` (Medicina), `ries` (Riesgo y regulación), `alc` (América Latina y Colombia). So `adop-1` is the 88% row, `cap-1` the OSWorld row, `eco-7` the supercomputing-clusters row, `alc-4` the CONPES 4144 row. The scripts in section 13 use these ids.
- **Context figures**: numbers that the KB states in session text but not as a §13 row (for example the AI Act's entry into force on 1 de agosto de 2024, the ILIA's "más de 100 subindicadores", Colombia's move "del quinto al cuarto lugar", the March 2026 convergence of models) get entries with ids `ctx-<slug>`, `enBanco: false`, the KB sentence verbatim as `cifra`, and the source the KB cites at that spot (`tipo` and `clase` from the KB when it gives one, otherwise `clase: 'ninguno'`). The scripts mark them `⟨ctx: slug⟩`.
- **"Ídem"**: in KB §13, an alcance written "Ídem" means the alcance of the nearest earlier row from the same source ("Ídem DEC": the Digital Education Council row). `cifras.js` keeps the KB text and adds `alcanceCompleto` with the resolved text, which is what the site shows and copies.
- **Short source labels** come from `fuentes.js`: each key gets the most specific label the KB uses for it ("Stanford AI Index 2026, cap. 4", "McKinsey, 2025", "METR, 2025"). Some rows have two or three sources; tags show the first and list all in the popover.

### 5.5 Data model: videos (`js/data/videos.js`)

One object per video, in course order:

```js
{
  id, slug, title, sesion,
  laminas: ['d03', 'd04', 'd05'],
  rate,                                      // default voice rate for the narrator, e.g. '0%'
  target: [minSeconds, maxSeconds],          // intended length; a review warning, never a hard cut
  poster: { scene: sceneId, p: 0.6 },
  chapters: [{ title, from: sceneId }],
  scenes: [{
    id, min, seVe,                           // seVe: one-line Spanish description of what is on screen
    rotulos: {                               // the scene's on-screen copy: the quoted text of its "Se ve"
      [key]: { text, cifras?: ['cap-1'], ilustrativo?: true }
    },
    lines: [{
      voice: 'narrador' | 'lectora', text, say?, pause?, rate?,
      cifras?: ['cap-1', 'ctx-ley-vigor'],   // figures whose numbers the line uses
      ilustrativo?: true,                    // the line's numbers are an illustrative example
      advertencia?: 1 | 2 | 3 | 4            // presses that warning stamp
    }]
  }],
  checkpoints: [{ after: sceneId, question, options, answer, explain, hint, cifras?, ilustrativo? }]
}
```

- `say` overrides the speakable text of a line; `pause` adds silence after it; `rate` overrides the voice rate for that line.
- `rotulos` hold every string a scene draws (titles, labels, mark captions, notes); scene code places them by key. A rótulo with a number carries the ids of the figures it shows.
- The transcript, the "Fuentes de este video" list (7) and every lámina's notes are generated from the data, grouped by chapter, so text, sources and video always match.

### 5.6 Video and lámina module contracts

- Each video file registers `EIA.videos.vNN = { setup(env), layers?: { [sceneId](env) }, scenes: { [sceneId](ctx, s, env) } }`.
- Each lámina file registers `EIA.laminas.dNN = { setup(env), draw(ctx, s, env) }`; `s.t` drives an optional calm ambient loop; `s.still === true` for print and thumbnails.
- `env = { W: 1280, H: 720, ink, chart, tags, fig, pal, ease, rng(seed), cache, cifra(id) }`; `cifra(id)` returns the registry entry plus its formatted source label and chip.
- `s = { t, p (0→1), dur, intro (0→1 over the first second), outro (0→1 over the last second), lines: [{ start, end }], line (active line index, −1 before the first), lineP (0→1 within it), at(i) (0 before line i starts, 0→1 while it plays, 1 after), rotulos (the scene's on-screen copy) }`.
- **Visual beats follow the voice**: scenes drive their changes with `s.at(i)` / `s.line`, never with hard-coded seconds, so visuals stay in sync when the voice is regenerated.
- `setup()` precomputes geometry with the seeded RNG. `layers[sceneId]()` returns offscreen canvases (backgrounds, textures, unit grids of 1.000 dots) for one scene; the engine builds them lazily, keeps only the current and next scene in an LRU cache and prefetches the next during idle time, so memory stays flat on long videos.
- Draw functions are pure functions of `(s, env)`: no `Math.random`, no `Date`, no mutable state.

### 5.7 Engine modules

- **ink.js**: variable-width brush strokes with tapering and end dots; draw-on along a path by length; gouache fills offset from their outline with stable seeded jitter; overlap fills (intersection in black or a third color, via clipping); washes; paper grain; spatter and dot clusters; ruled notebook lines and a dot grid; calligraphic contour loops; the machine grid with ticks and construction lines; brush lettering written glyph by glyph; soft glow (pre-rendered, no per-frame shadow blur).
- **chart.js**: the honest marks of 3.7 — bars on a shared zero-based scale, unit grids, exact dot counts, approximate caps ("≈"), bounded arrowheads ("más de", "menos de"), bands for ranges, interval lines with a zero mark, gauges with exact angles, timelines, proportional funnels, "No se compara directamente" panels. Each mark grows from zero by a progress parameter and lands exactly.
- **tags.js**: source tags, evidence chips (full and monochrome), neutral chips, estado signs, warning stamps, the "Ejemplo ilustrativo" stamp, the "Actualización" ribbon; all fed from `env.cifra(id)`.
- **figures.js** — reusable, parameterized, seeded and able to draw on:
  - People: la lectora; professionals of 3.4 in several poses; a team of 3–4 around a table; university students; a young person looking up a ladder.
  - Places: oficina, universidad (patio, aula, biblioteca), laboratorio, hospital, mar nocturno, cordillera, river and reservoir, Latin American city, Latin America and the Caribbean as one landmass, road with stations.
  - Machine kit: the AI lamp, the agent loop, a ruled ladder, a ruled exam panel, a server tower with an energy meter, a compute block, lamps on thin wheels, a ruled sieve, a ruled box of weights.
  - Props: field-notebook page, headlines drawn as scribbles, coins, reservoir with one sluice gate, bridge with scaffolding, suspension bridge, balance scale, hourglass, stopwatch, flask, magnifying glass and spyglass (only as the type signs or in scenes about measurement and intentions), telescope on a tripod, microscope, traffic light, dial, paper timeline, stamp, folder, envelope, keys, mailbox, steering wheel with a brake disc, compass made of an irregular star, lighthouse, boat with a small ruled motor, fishing net, phone, folding document, plain patterned pennants, cards (front/back), speech and thought bubbles.
  - Signs (3.3) and icons: the course legend (section 4), chapter and checkpoint marks.
- **lamina.js**, **timeline.js**, **captions.js**, **narrator.js**, **player.js**, **recorder.js**: sections 6, 7, 8 and 12.

### 5.8 `tools/check-content.mjs` (MUST pass with zero errors)

1. Load `js/data/*.js` with `lib/load-data.mjs` and the KB with `lib/kb-parse.mjs`.
2. **KB match**: every row of KB §13 exists in `cifras.js` with the same text in `cifra`, `alcance`, `tipo`, `estado` and the same links; every KB citation key exists in `fuentes.js` with the KB's URL; glossary, FAQ, corrections, quizzes and session texts match the KB (normalized whitespace). The only allowed differences are the corrected versions this prompt asks for (10.3 and 12.1), listed by name in the checker.
3. **References**: every `cifras` id in videos and láminas exists; every `ctx-` entry quotes a sentence that exists in the KB.
4. **Number check**: every number (as a whole token) in voice lines, subtitles, `rotulos`, checkpoint questions, correct options and explanations, and lámina text must appear in the `cifra` or `alcance` of a figure referenced there, or the text is marked `ilustrativo`. Plain years (2010–2030) are exempt; structural numbers (session and slide numbers, agenda minutes, rubric weights, the course's 24/14/10 hours, the nine indicator levels, the six steps of a cycle) come from a short whitelist in the checker. Wrong checkpoint options are listed in the report for a person to glance at.
5. **Banned versions** (KB §14) are errors in every string except `correcciones.js`, `cifras.js`, the KB §0 text in `asistente.js`, the "Errores de lectura frecuentes" lists and lámina notes, where the KB names them only to warn against them. Each string is checked on its own, split into sentences at ".", ";", "·" and line breaks: "34%" in a sentence with "UNESCO"; "hasta +50%" or "hasta 50%"; "3 clústeres" for Latin America; "pionero" or "pionera" applied to Colombia without a negation; "4 de cada 5" or "cuatro de cada cinco" in a sentence without "Estados Unidos" or "EE. UU."; "2,4%" in the same sentence as "258"; "más de 100 acciones" or "479.000" for the CONPES 4144; "27% vs 9%" or "27% frente a 9%" (use "27,0% frente a 8,5%"); any claim that the AI Act applies in full from August 2026.
6. **Series**: a lámina, chart or scene that references both `adop-1…adop-6` and `adop-7` must put them on separate panels (flag for review).
7. Print a report: errors, warnings, and every number with the figure that backs it.

---

## 6. Video system

### 6.1 Format and rendering

- 1280×720 logical canvas (16:9), 24 fps, `requestAnimationFrame` driving ONE timeline per video (t in seconds); `renderFrame(t)` is deterministic, so any video can be exported frame by frame. Scale the backing store by `devicePixelRatio` (max 2) on screen.
- Each scene is its own draw function; 0.8 s crossfade between scenes.

### 6.2 Length and pacing

- **Target lengths** are listed per video (about 2½–8 minutes). The final length is whatever the voice needs; `target` only triggers a warning in the tools. There is no maximum: engine, player, recorder and tools must stay smooth on videos of up to 15 minutes.
- **The voice sets the pace**: scene duration = max(the scene's `min`, 0.6 s lead + its voice lines + 0.5 s between lines + any `pause` + 1.2 s tail). Lines inside a scene play in order.
- **One idea per scene, one visual change per line**: each line brings its own beat (something draws on, grows, is labeled or transforms), keyed to `s.at(i)`.
- **Figures need time**: a line that says a number keeps that number's mark, label and tag on screen, exact and still, until the line ends.
- **Calm ambient life** between beats: signs drift and turn slowly, stars twinkle gently, the camera drifts and zooms a little; nothing flashes or boils.
- **Chapters** of about 1–2 minutes, each ending with a recap line, a question for the group or a checkpoint.

### 6.3 Motion

Line work draws on in brush-stroke order when a scene starts; flat color fields bloom just after their line; data marks grow from zero and land exactly; gentle ease in/out on every move; slight parallax between background and subject; small camera drifts within scenes. Calm and readable from the back of a room.

### 6.4 Subtitles

- Bottom band: large sans text (≥30 px), semi-transparent dark band, max 2 lines, each chunk fades in and out, synced to the voice.
- Long lines are split into chunks at punctuation and phrase boundaries. Chunk times come from the bookmark offsets in the audio manifest (8.3); without them, they are estimated by character count.
- Subtitles show figures exactly as the KB writes them ("66,3%", "344.700 millones", "1.993", "2026–2028", "4.º") while the voice says them in words.
- Lines of the `lectora` start with her small notebook sign, so the two voices are told apart without color.
- Drawn on the canvas (so they appear in recordings); toggle "Subtítulos", on by default.

### 6.5 Checkpoints

- A question with 2–4 options placed after a scene, occupying a fixed, silent 6 s segment of the timeline.
- **Interactive mode** (default): the video pauses and an HTML overlay card in the same style shows "Pausa: piensa y responde", large option buttons, feedback ("¡Muy bien!" + the explanation, or "Casi. Pista: …" and another try) and "Continuar", which jumps to the end of the segment.
- **Linear mode** (toggle off, recording, export): the canvas draws the question card for 4 s with a 3-2-1 countdown and "Pausa el video y respondan en grupo", then the answer for 2 s.

### 6.6 Chapters

- Chapter buttons above the player, labeled ticks on the scrubber, chapter headings in the transcript.
- A small hand-lettered chapter title writes itself in a corner of the canvas for 2 s when a chapter starts.
- Toggle **"Pausar al final de cada capítulo"** (off by default; on in "Modo clase"): the video stops at each chapter end with "Continuar con: <siguiente capítulo>".

### 6.7 Endings

Videos end with a soft fade and a hand-drawn "Ver de nuevo" button (only the hero loops).

### 6.8 Figures on screen

- A number, its short label and its source tag (3.8) form one unit that appears when the line that says it starts (`s.at(i)`) and stays at least until that line ends.
- Tags are built from `cifras.js` by `tags.js`; video code never types a source, a scope or a number.
- Figures with estado "Actualización" carry a small "Actualización" ribbon; lines marked `ilustrativo` show the "Ejemplo ilustrativo" stamp for their whole beat.
- Lines marked `advertencia` press that warning stamp (4.2) for 3 s.

### 6.9 Benchmarks and real work on screen

Whenever a scene shows a benchmark, exam or laboratory result, the result lives inside a ruled navy panel (3.5); when the script contrasts it with real work, the panel sits beside or inside a warm scene, never the other way round.

### 6.10 Glossary on screen

The first time a video's voice uses a glossary term (KB §12), a small margin note shows the term and its KB definition, verbatim, for the duration of that line. One note at a time: if a line uses several new terms, show the first.

---

## 7. Player

- HTML controls outside the canvas, so they never appear in recorded frames: hand-drawn play button over the poster frame, play/pause, scrubber with chapter, scene and checkpoint ticks, time (current / total), chapter menu, "Subtítulos", "Voz" (on/off), "Velocidad" (0,75× / 1×), "Preguntas interactivas" (on/off), "Pausar al final de cada capítulo", "Transcripción" (expandable, grouped by chapter and scene, with a source note under each line that uses figures), "Fuentes de este video" (every figure the video uses, context figures included: cifra, chip, estado, source link and "Copiar cita"), "Láminas relacionadas", "Pantalla completa", "Descargar video". Spanish aria-labels on everything.
- Hovering the scrubber shows a small preview frame (rendered offscreen with `renderFrame`, throttled) and the chapter name.
- **Resume**: the player remembers each video's position in localStorage (always inside try/catch) and offers "Continuar donde ibas (m:ss)" next to "Desde el inicio".
- Keyboard: Space/K play-pause, ←/→ ±5 s, Shift+←/Shift+→ previous/next chapter, C subtitles, F full screen.
- Only one video plays at a time; players initialize lazily (IntersectionObserver) and pause when scrolled out of view or when the route changes.
- **"Descargar video"**: if an exported MP4 exists (`assets/video/index.js`), offer it as "Descargar MP4". Otherwise record one full linear pass in real time: `canvas.captureStream(24)` plus the narration (Web Audio MediaElementSource → MediaStreamDestination) into MediaRecorder with a 1 s timeslice; prefer `video/mp4` when `MediaRecorder.isTypeSupported` allows it, else `video/webm` (vp9 + opus, then default). Before starting, say how long it will take and to keep the tab visible; show progress outside the canvas; download `<slug>.mp4` or `<slug>.webm`. Also offer "Descargar este capítulo". When the voice can't be captured (`file://` or browser voice), say so first and record without voice.
- `index.html?render=<id>` mounts a bare canvas and exposes `window.renderFrame(t)`, `window.videoDuration` and `window.videoChapters` for the tools; `index.html?lamina=<id>` does the same for a lámina (`renderFrame(t)`, still at t = 0).

---

## 8. Voice-over (Azure AI Speech · `es-MX-JorgeNeural`)

### 8.1 Voices and roles

- **`narrador`** — all videos — Azure neural voice **`es-MX-JorgeNeural`**. Warm, calm and clear. Rate: default (0%); a line dense with figures MAY set `rate: '-5%'`. No speaking style by default; a style MAY be tried only if the voices-list endpoint reports it for this voice and it sounds natural in a test clip.
- **`lectora`** — the critical questions, in every video — a female es-MX neural voice clearly different from Jorge. Audition `es-MX-DaliaNeural`, `es-MX-RenataNeural` and `es-MX-NuriaNeural` (check they exist in your region with the voices-list endpoint) and pick by ear. Same rate as the narrator.
- Both are set in `tools/voice.config.json`, so either can be changed without touching code. No voice cloning or imitation of real people.
- The text is Colombian Spanish read with a Mexican accent; that is expected. Fix only real mispronunciations (stress, numbers, abbreviations, English proper nouns) in the normalizer or with `say`.

`tools/voice.config.json` (starting point):

```json
{
  "engine": "azure",
  "azure": {
    "keyEnv": "AZURE_SPEECH_KEY",
    "regionEnv": "AZURE_SPEECH_REGION",
    "outputFormat": "Riff24Khz16BitMonoPcm",
    "voices": {
      "narrador": { "name": "es-MX-JorgeNeural" },
      "lectora":  { "name": "es-MX-DaliaNeural" }
    },
    "rate": { "default": "0%" },
    "concurrency": 4
  },
  "mix": { "loudnessLUFS": -16, "truePeakDB": -1.5, "mp3Bitrate": "128k" }
}
```

### 8.2 Credentials and safety

- The key and region come only from environment variables (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`) or a local `tools/.env` that is gitignored; `tools/.env.example` documents them. Keys are never written into the site, the manifest, captions or logs.
- Only the tools talk to Azure, at generation time. The site never contacts Azure or any other service.

### 8.3 `tools/generate-voiceover.mjs`

1. Load `js/data/videos.js` through `lib/load-data.mjs`; load the site's own chunking (`js/engine/captions.js`) and timing rules (`js/engine/timeline.js`) in the same sandbox, so tools and player compute identical chunks and times.
2. Split each line into its subtitle chunks; turn each chunk into speakable text with `lib/normalize-es.mjs` (8.4), unless the line has an explicit `say`.
3. Build one SSML document per line with `lib/ssml.mjs`: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="es-MX">`, the role's `<voice name="…">`, `<prosody rate pitch>`, the chunks separated by `<bookmark mark="c1"/>`, `<bookmark mark="c2"/>`…, ellipses as short `<break>`s. Escape `& < > " '`.
4. Synthesize each line with the Speech SDK (`microsoft-cognitiveservices-speech-sdk`, `speakSsmlAsync`) to 24 kHz 16-bit mono WAV. Collect `bookmarkReached` events (`audioOffset` is in 100-ns ticks) for the exact start of every subtitle chunk, and `wordBoundary` events for QA.
5. **Cache** each clip in `tools/.cache/` under a hash of (voice, rate, pitch, SSML, output format). Retry 429/5xx with exponential backoff; respect `concurrency`. Verify the configured voices once against the voices-list endpoint (`https://<region>.tts.speech.microsoft.com/cognitiveservices/voices/list`) and stop with a clear message if one is missing.
6. Measure each clip with ffprobe (keep clips untrimmed so bookmark offsets stay valid) and compute the final timeline: chapter, scene, line and chunk starts and the silent checkpoint segments.
7. Mix ONE narration track per video with ffmpeg, each clip at its start time, built as a concatenation of clips and generated silences; normalize loudness in two passes (`loudnorm`, −16 LUFS, −1.5 dBTP) and encode MP3 (mono, 128 kbps).
8. Write `assets/audio/<id>.mp3`, `assets/audio/manifest.js` (`window.EIA.audioManifest = { [id]: { file, duration, chapters, scenes, lines: [{ scene, index, start, dur, chunks: [{ text, start, end }] }], checkpoints } }`) and `assets/captions/<id>.vtt`.
9. Print a report per video: final length vs `target`, the longest scenes, chunks faster than about 17 characters per second, any missing bookmark.
10. Flags: `--only v04`, `--force` (ignore cache), `--dry-run` (estimate durations at about 2.3 words per second without calling Azure).

**`tools/check-voiceover.mjs`** (optional): transcribes each clip back with Azure speech-to-text (es-MX), normalizes both sides and lists mismatches (a figure read as a date, a decimal read as thousands, an English name mangled) so a person can listen to just those clips. The final check is always by ear: someone listens to every video once.

### 8.4 `tools/lib/normalize-es.mjs` (Spanish display text → speakable text)

- **Numbers in KB format**: the point separates thousands and the comma marks decimals: "1.993" → "mil novecientos noventa y tres", "344.700 millones" → "trescientos cuarenta y cuatro mil setecientos millones", "66,3%" → "sesenta y seis coma tres por ciento", "72,35%" → "setenta y dos coma treinta y cinco por ciento"; decimals keep their leading zeros: "26,08%" → "veintiséis coma cero ocho por ciento".
- **Version numbers**: a point is a thousands separator only when exactly three digits follow it; after a name, "Terminal-Bench 2.0", "Gemini 2.5 Pro" and "Time Horizon 1.1" → "dos punto cero", "dos punto cinco", "uno punto uno".
- **Signs and ranges**: "%" → "por ciento"; "~" → "cerca de"; "≈" → "aproximadamente"; "×" after a number → "veces"; a leading "+" or "−" on a percentage → "más" / "menos" before it; "A–B" between numbers → "de A a B" ("12–18 meses" → "de doce a dieciocho meses"); between years → "A a B" ("2026–2028" → "dos mil veintiséis a dos mil veintiocho").
- **Years and dates**: a four-digit number from 1900 to 2099 is a year, "2025" → "dos mil veinticinco"; any other is a number ("CONPES 4144" → "cónpes cuatro mil ciento cuarenta y cuatro"); "2 de agosto de 2026" → "dos de agosto de dos mil veintiséis"; "1 de agosto" → "primero de agosto".
- **Ordinals**: "4.º" → "cuarto", "5.º" → "quinto".
- **Fractions**: only "1/3" → "un tercio", "2/3" → "dos tercios", "1/2" → "un medio"; any other "a/b" (for example "2026/1744") is never read as a fraction and needs a `say`.
- **Abbreviations**: "EE. UU." → "Estados Unidos"; "UE" → "Unión Europea"; "I+D" → "investigación y desarrollo"; "GW" → "gigavatios"; "IA" → the letters "i a" (SSML `<say-as interpret-as="characters">` or `<sub alias="i a">`, whichever sounds right with each voice).
- **Lexicon** (starting proposals; audition each with both voices and adjust): EBIT → "ébit"; API → "a pe i"; OIT → "o i te"; FDA → "efe de a"; CONPES → "cónpes"; ILIA → "ilia"; CEPAL → "cepal"; CENIA → "cenia"; METR → "méter"; McKinsey → "mackínsi"; PwC → audition "pe doble ve ce" and "pi dábliu si"; AI Index → "ei ai índex"; OSWorld → "ou es uórld"; Terminal-Bench → "términal bench"; GPQA → "ge pe cu a"; MMMU → "eme eme eme u"; SWE-bench → "suí bench"; PaperArena → "péiper arena"; ChemBench → "kem bench"; AI Incident Database → "ei ai íncident déitabeis"; Digital Education Council → "díyital ediukéishon cáunsil"; xAI → "equis a i"; OpenAI → "open ei ai"; DeepSeek → "dipsík"; Anthropic → "anzrópic"; MiniMax → "mini max"; Z.ai → "zeta a i"; Gemini → "yémini"; Sharp HealthCare → "sharp jélzker"; reward hacking → "riuórd jáking"; deepfakes → "dipféiks"; sandbox → "sándbox"; benchmark → "bénchmark".
- Quotes and « » are dropped from the spoken text; "…" becomes a short pause.
- Any line can override everything with an explicit `say`.

### 8.5 Runtime narration

- **Audio-track mode** (when the manifest and the mp3 exist): the audio element is the master clock; play, pause, seek and rate go through it (`preservesPitch` on), and the canvas follows `audio.currentTime`. Subtitle chunks use the manifest's chunk times. Checkpoint segments are silent, so interactive pauses simply pause the audio.
- **Browser-voice fallback** (`speechSynthesis`): best Spanish voice per role — for the narrador, a voice named "Jorge" for es-MX > any male es-MX > es-CO / es-419 / es-US > es-ES > any es-*; for the lectora, a female voice in the same order (if only one voice exists, use it with pitch 1.15); durations estimated at ~2.4 words/s; each line spoken at its start time; if an utterance is still speaking when its slot ends, hold the frame until it finishes; cancel on seek; show a small note "Voz del navegador".
- The site must be fully usable before any audio is generated.

---

## 9. The website (one page, hash-routed views)

### 9.1 Global

- Sticky header with a brush-lettered "Estado de la IA 2026" and the nav: "Inicio · Mapa · Evidencia · Sesiones · Cifras · Proyecto · Glosario · Preguntas · Referencias · Asistente · Modo clase". "Sesiones" opens a menu with the 7 sessions, each with its sign (4.4) and its KB §2 title: "1 · Adopción masiva, valor por demostrar", "2 · Capacidad técnica", "3 · Economía y adopción", "4 · Trabajo y educación", "5 · Ciencia y medicina", "6 · Riesgo y gobernanza", "7 · América Latina, Colombia y agenda". A menu button on small screens.
- Routes: `#inicio`, `#mapa`, `#evidencia`, `#s1` … `#s7`, `#cifras`, `#proyecto`, `#glosario`, `#preguntas`, `#referencias`, `#asistente`; deep links to blocks (`#s3/actividad`, `#cifras/adop-1`). Each view has its title with a calligraphic underline and "Anterior / Siguiente" links in course order (inicio → mapa → evidencia → s1 … s7 → proyecto).
- MAY: "Buscar en el curso", an accent-insensitive search over sessions, banco, glosario and preguntas.
- Every embedded video shows its title, its length ("Duración: m:ss", from the manifest or estimated) and its chapters.

### 9.2 `#inicio`

- **Hero**: kicker "Curso · 7 sesiones · 24 horas"; title "Estado de la IA 2026"; subtitle "Adopción masiva, valor aún por demostrar"; lead "Forma criterio para decidir dónde produce la IA valor verificable, con qué evidencia y con qué controles."; small line "Base de conocimiento del curso · versión 1.1 · 17 de octubre de 2026"; buttons "Empezar" (→ `#mapa`), "Banco de cifras" (→ `#cifras`), "Modo clase".
- **Hero background**: a silent 20 s canvas loop (not a video). A night sea in ultramarine with calligraphic waves, a crescent moon and irregular stars. A Miró iceberg: its luminous tip, lit by a tiny AI lamp, carries "88% de organizaciones usa IA" with its source tag (`adop-1`); the waterline, one calligraphic line, slowly sinks to reveal the submerged mass with "Escala · Valor · Gobernanza" in chalk-white calligraphy, then rises again; a bird crosses. With reduced motion: a still frame with the waterline halfway.
- **"La pregunta del curso"**: "¿Cuánto valor verificable produce la IA, para quién y con qué controles?", brush-lettered as it scrolls into view.
- **"Ficha del curso"** (KB §1, verbatim) as cards: Descripción, Público, Modalidad (with the two alternative versions), Objetivo general, Resultados de aprendizaje (the 8, numbered), Metodología, Fuentes y citas.
- **"Cómo usar este sitio"**, two cards:
  - "Si participas": "Antes de cada sesión, mira el video y revisa las lecturas. En la sesión, trabaja con tu equipo en el cuaderno del caso. Cuando cites una cifra, cópiala desde el banco: así va con su fuente."
  - "Si facilitas": "Proyecta cada sesión con Modo clase: láminas, video, actividad y quiz, con el reloj de la agenda. Las notas del orador y las claves están en «Para el facilitador»."
- Video V01.

### 9.3 `#mapa`

- **"Mapa del curso"** (KB §2): a calligraphic road with 7 stations (session signs); each station is a card with "Sesión", "Tema", "Diapositivas", "Pregunta guía" and "Producto del equipo", linking to its session.
- **"El hilo conductor"**: "Cada equipo elige un caso de uso en la sesión 1 y lo desarrolla hasta el proyecto final." Along the road, the team's case card collects one small stamp per product.
- **"Trabajo autónomo"**: "De 1 a 1,5 horas entre sesiones para lecturas y avance del caso."
- **"Versiones del curso"**: "Siete sesiones de 2 horas, presenciales o sincrónicas, con equipos de 3 o 4 personas" · "Taller de 4 horas con las sesiones 1, 3, 4 y 7 condensadas" · "Curso semestral con una sesión cada dos semanas". MAY: for the semester version, a date helper that lists 7 dates every 14 days from a chosen start date.
- A small "Ruta de lectura" drawing from lámina D2.

### 9.4 `#evidencia` — "Cómo leer la evidencia sobre IA" (KB §3)

- The five types as large cards (meaning zone): chip, "Qué es", "Ejemplo del curso" with its citation.
- "Qué mide cada fuente" (KB §3.2) as a table, the "Coberturas de las encuestas" list and its closing sentence.
- "Criterios de interpretación" (KB §3.3).
- The four warnings (KB §3.4) as stamps.
- Video V02 and a link "Practica con el juego «¿Qué mide esta cifra?»" (→ `#s1/actividad`).

### 9.5 Session views `#s1` … `#s7` (one template, filled from `sesiones/sN.js`)

1. **Header**: session sign, "Sesión N", title, "Pregunta guía", "Diapositivas", "Producto del equipo"; the tesis as a lead paragraph with its citations.
2. **"Resultados de aprendizaje"**.
3. **"Agenda (120 min)"**: a hand-drawn 120-minute ruler with proportional, numbered blocks in pattern fills, then the KB table.
4. **"Láminas"**: thumbnails of the session's láminas → viewer (10.10).
5. **"En video"**: the session's video(s).
6. **"Contenido"**: the KB points in order, with citations, figure popovers, the KB's notes and "Actualización" paragraphs exactly where the KB puts them.
7. **"Errores de lectura frecuentes"**: one card each, with the spiral.
8. **"Actividad"**: the session's tools (section 11), each saving to the team notebook.
9. **"Discusión"**: the questions, each with "Anotar en el cuaderno".
10. **"Quiz"** (10.8).
11. **"Lecturas"** with their links, and **"Trabajo autónomo"**.
12. **"Para el facilitador"** (collapsed): each lámina's "Qué decir" and "Nota", the activity keys ("Clave para el docente", "Clave orientativa para el docente"), the agenda.

Blocks the KB does not give for a session are left out, never written: sesión 7 has no "Errores de lectura frecuentes", no activity table and no quiz; its "Discusión de cierre" replaces "Discusión", and its activity is the presentation of the final project (10.12).

### 9.6 `#cifras` — "Banco de cifras" (KB §13–§14)

- Intro: the KB's "Estado de cada cifra" list with the estado signs, and the KB §1 paragraph "Fuentes y citas".
- The bank (10.2).
- **"Correcciones: no uses las versiones originales"** (KB §14): one card per row; "Versión del informe base" struck through with a calligraphic line and the label "No uses esta versión"; "Versión correcta" with its source.
- **"Actualizaciones que conviene mencionar"** (KB §14), each with the luna-creciente sign.

### 9.7 `#proyecto` — "Evaluación y proyecto final" (KB §11)

- The weights table.
- "Proyecto final · Diagnóstico de valor verificable": the 8 questions, each linked to the notebook sheets that feed it, plus the KB paragraph on the decision log and the oral defense.
- "Cuaderno del equipo" (10.7), "Rúbrica" (10.9) and "Cómo se retroalimenta un avance" (the KB's 4 steps).

### 9.8 `#glosario`, `#preguntas`, `#referencias`

- **Glosario** (KB §12): searchable, alphabetical, each term with an anchor used by the tooltips (10.13).
- **Preguntas frecuentes** (KB §15): accordion, verbatim, with citations.
- **Referencias** (KB §16): grouped as in the KB; each item with "Abrir fuente ↗" (new tab, `rel="noopener"`) and "Cifras de esta fuente" (reverse index from `cifras.js`).

### 9.9 `#asistente` — "Trabaja con el asistente del curso" (SHOULD)

- Intro: "La base de conocimiento del curso incluye instrucciones para configurar un asistente de IA. Úsalo para repasar, aclarar cifras y revisar avances; comprueba siempre cada cifra en el banco."
- "Instrucciones del asistente": KB §0 verbatim, with "Copiar instrucciones".
- "Base de conocimiento": a link to `contenido/base-estado-ia-2026.md` and the note "Carga este archivo, junto con las instrucciones, en la herramienta de IA que uses."
- "Instrucciones listas para copiar": six cards with blanks (inline inputs) and "Copiar":
  1. "Explicar un concepto o una diapositiva": "Explícame [concepto o número de diapositiva] del curso Estado de la IA 2026 en frases cortas, con un ejemplo latinoamericano. Para cada cifra que uses, dime su fuente y su tipo de evidencia."
  2. "Aclarar una cifra": "Aclárame esta cifra: «[cifra]». Dime su fuente, su tipo de evidencia y su alcance (país, año, población y método), y si la base del curso tiene una versión corregida o una edición más reciente."
  3. "Guiar una actividad": "Guíanos paso a paso en la actividad «[nombre de la actividad]» de la sesión [número], para este caso: [describe el caso sin datos personales]. Haznos preguntas y no la resuelvas por nosotros."
  4. "Revisar un avance con la rúbrica": "Revisa este avance de nuestro proyecto con la rúbrica del curso: [pega el texto]. Para cada criterio, nombra el nivel actual con una evidencia tomada del texto y propón una acción concreta para subir un nivel. No reescribas el trabajo."
  5. "Preguntas de práctica": "Hazme [número] preguntas de práctica de opción múltiple sobre la sesión [número], con la respuesta correcta y una explicación corta basada solo en la base del curso."
  6. "Resumir una sesión": "Resume la sesión [número] en [número] frases: la tesis, tres cifras con su fuente y su tipo de evidencia, y la advertencia del curso que más aplica."
- Closing note: "Lo que responda cualquier asistente puede tener errores: comprueba cada cifra en el banco antes de usarla."

### 9.10 Footer

"Ilustraciones y animaciones dibujadas con código, con un lenguaje visual inspirado en el arte de Joan Miró. Narración con voces sintéticas. Contenido: Base de conocimiento del curso «Estado de la IA 2026», versión 1.1 (17 de octubre de 2026), a partir del informe base *Estado del arte de la inteligencia artificial en 2026* (corte: 14 de octubre de 2026). Cifras verificadas contra las fuentes originales el 17 de octubre de 2026, salvo las marcadas como «Informe base». Revisado por [nombre del facilitador]."

---

## 10. Interactions

### 10.1 Citations, figure popovers and "Copiar cita"

- Each KB citation renders as a small source tag; click or focus opens a popover with the reference's title and "Abrir fuente ↗".
- Numbers wrapped as `{{id|texto}}` get a dotted underline; hover, focus or tap opens a popover with the evidence chip, the estado (sign + label), the alcance, the source and "Ver en el banco".
- **"Copiar cita"** (bank cards, popovers, "Fuentes de este video") copies exactly:
  `{cifra} ({alcance}). Tipo de evidencia: {tipo}. Fuente: {fuentes}. Estado en la base del curso: {estado}.`
  `{alcance}` is the full alcance (`alcanceCompleto`, 5.4); `{fuentes}` is each source as "{etiqueta}, {url}", joined by "; "; the "Tipo de evidencia" sentence is left out when the KB type is "—". Clipboard API with a textarea fallback; aria-live "¡Copiado!".

### 10.2 Banco de cifras

- Filters as chips: "Tema" (the 10 KB §13 headings), "Tipo de evidencia" (the five types + "Otros"), "Estado" (4), "Sesión" (1–7); a free search (accent- and case-insensitive) over cifra, alcance and fuente; a counter "N cifras".
- Card view (default) and table view. Each card: the cifra (large), alcance, chip, estado, source links, sessions, "Copiar cita"; rows touched by a correction show "Ver corrección".
- "Imprimir esta selección" prints the filtered list as a citation sheet.

### 10.3 Game "¿Qué mide esta cifra?" (sesión 1, actividad 1)

- The 8 cards of the KB's Actividad 1 table (cifra + fuente; the PwC card in its corrected form, "Ingreso por empleado: 27,0% vs 8,5%") are sorted into the five type bins: drag on desktop; tap or keyboard to choose.
- Right: star + "¡Muy bien!" + the key's note when it has one ("ensayo aleatorio; METR lo marca hoy como desactualizado", "asociación, no causalidad", "conteo bruto, sin denominador"). Wrong: spiral + "Casi. Pista: …", with the hint of the correct type: "¿Se midió en una prueba controlada?" (Capacidad técnica), "¿Es lo que alguien dice que hace?" (Uso declarado), "¿Se midió un cambio real?" (Resultado observado), "¿Es una intención?" (Expectativa), "¿Es una estimación del futuro?" (Proyección).
- At the end: the full "Clave para el docente" table and "Repetir".

### 10.4 Calculator "Pasos que se acumulan" (sesión 2, contenido 4)

- Sliders "Probabilidad de éxito por paso" (80–99,9%, step 0,1) and "Número de pasos" (1–50); result P = p^n as a percentage and as a ruled ladder of n steps whose glow fades step by step.
- Presets "95% · 20 pasos" (≈ 0,36 · 36%) and "99% · 20 pasos" (≈ 0,82 · 82%), matching the KB.
- A permanent stamp: "Ejemplo ilustrativo: supone pasos independientes. No es un dato de las fuentes."

### 10.5 "El embudo, con cuidado" (sesión 3)

- Lámina D7's four bars, exactly proportional, each opening its figure popover.
- A fixed note: "Cada barra sale de una pregunta distinta de la misma encuesta: muestra un patrón, no una cohorte."
- Toggle "Ver la edición 2026": a separate panel (never the same axis) with `adop-7` and "No se compara directamente con la edición 2025".

### 10.6 Game "Sube la escalera de evidencia" (sesión 5, actividad paso 1)

- The KB's three claims (notas clínicas, sistema multiagente, revisión de estudios y dispositivos) are placed on the six rungs; feedback from the KB's "Clave orientativa para el docente", then each card shows its traffic-light color (with sign and label).

### 10.7 "Cuaderno del equipo" (the session products)

- One notebook per team ("Nombre del equipo", "Nombre del caso"), stored in localStorage (try/catch); several notebooks can coexist. "Exportar" / "Importar" as `.json` to share within the team; "Copiar como texto"; "Imprimir cuaderno".
- Sheets (schemas in `actividades.js`, labels verbatim from the KB):
  - S1 "Ficha del caso de uso": the five KB points as fields.
  - S2 "Picos y valles del caso": 6–8 subtasks × (subtarea · pico o valle · pasos, if it is a valley · costo de un error · nivel de autonomía: "La IA sugiere", "Ejecuta con aprobación humana", "Ejecuta sola con monitoreo"); then "Criterios para elegir entre una API cerrada y un modelo abierto": three chosen from "costo", "latencia", "privacidad", "auditabilidad" and "dependencia del proveedor", each with "Por qué".
  - S3 "Línea base y costo total": the stage of maturity (the KB's six), the KB's 4×4 table, a "Costo total" checklist with the KB's seven items (each with an optional amount and unit typed by the team; a sum appears only when all units match), "Indicador de valor verificable" and "Quién lo verifica".
  - S4 "Tareas del caso": 6–8 tasks with the KB's three options + "¿Sirve de escalón de entrada?" + "Cómo se preservará ese aprendizaje"; "Evaluación rediseñada": the KB's 4×2 table + "Usos de IA permitidos", "Cómo se declaran", "Qué parte se hace sin IA".
  - S5 "Semáforo de evidencia": the KB's table (afirmación · escalón actual 1–6 · color · evidencia que falta · quién la produce).
  - S6 "Ciclo de gobernanza": impacto (bajo, medio o alto) and reversibilidad (free text); the KB's 6×3 matrix; "Criterio de suspensión: qué evento detiene el sistema y quién decide".
  - S7 "Plan 2026–2028": three milestones × (año, acción, nivel del marco de indicadores — the KB's nine —, indicador, responsable).
  - "Bitácora de decisiones": dated entries (fecha, decisión, por qué, quién).
  - "Fuentes y uso de IA": a picker that adds figures from the bank with their citation, and a declaration field.
- **The site never writes for the team**: no auto-fill, no generated text (the course evaluates learning, not text). A gentle personal-data check (two or more consecutive capitalized words that look like a name, long digit runs, emails, phone numbers) shows a sticky note "¿Es un dato personal? Describe la situación sin identificar a nadie." It never blocks.

### 10.8 Quizzes

- The KB's three questions per session (sesiones 1–6; sesión 7 has no quiz), one at a time, with large options; star + "¡Muy bien!" + the KB explanation (or, where the KB gives only the answer, the correct option alone), or spiral + "Casi. Pista: …" and another try; score at the end; "Repetir".
- Write one hint per question from the session text: it points back to an idea of the session, never names the answer and adds no facts. Examples: S1-1 "Pista: ¿alguien midió un impacto o los encuestados dijeron algo?"; S3-1 "Pista: en el embudo, el uso es la primera barra y el impacto, la última."; S5-2 "Pista: ese porcentaje no sale de los dispositivos de un solo año."

### 10.9 Rubric

- The KB rubric as a table; the team or the facilitator picks a level per criterion. "Puntaje de la rúbrica: NN/100" = Σ (peso × fracción del nivel: 4 = 100%, 3 = 75%, 2 = 50%, 1 = 25%), with the note "Autoevaluación orientativa: la calificación la asigna el docente."
- Per criterion, the KB feedback steps as fields: "Evidencia tomada del texto" and "Acción para subir un nivel".

### 10.10 Láminas viewer

Full-screen 16:9 canvas, ←/→ and PageUp/PageDown, "Notas" (N) with the KB's "Qué decir" and "Nota", "Imprimir láminas" (two per page with notes).

### 10.11 "Modo clase"

- Choose "Sesión 1" … "Sesión 7" or "Taller de 4 horas (sesiones 1, 3, 4 y 7)".
- A session becomes full-screen slides following its KB agenda: each block's láminas, the video (marked "Opcional en clase"), the activity (instructions in large type + the tool), the discussion questions and, where the session has one, the quiz (answers revealed on click). Type ≥28 px.
- Arrows and PageUp/PageDown (presentation clickers) always move slides; on a video slide, Space/K control the video; Esc exits; N opens a notes drawer ("Qué decir", "Errores de lectura frecuentes", keys) with the warning "Las notas se ven en la proyección". MAY: "Abrir vista del facilitador", a second window synced with postMessage.
- **Session clock** (Iniciar / Pausar / Reiniciar) with a hand-drawn bar of the session's agenda blocks as the KB gives them (sesión 1: 15, 30, 25, 35 and 15 min), showing where the session should be and a gentle note when a block runs long. For the 4-hour workshop the bar shows only the total, because the KB does not detail its blocks.
- Videos here pause at the end of each chapter. Remember the position in localStorage (try/catch).

### 10.12 Presentation timer (sesión 7)

"Presentación y defensa: 7 minutos + 3 de preguntas por equipo": a hand-drawn two-phase timer with a list of teams. MAY: a soft chime generated with Web Audio (no audio file).

### 10.13 Glossary tooltips and scroll reveals

- The first occurrence of each KB glossary term per view gets a dotted underline and a tooltip with its definition and "Ver en el glosario".
- Cards settle like paper placed on a desk; underlines and dividers draw on; signs drift in a little. With `prefers-reduced-motion`, everything becomes simple fades and the hero a still frame.

---

## 11. The seven sessions (how the KB maps to the site)

| Sesión | KB | Láminas | Videos | Tools (sections 10–11) | Notebook sheet |
|---|---|---|---|---|---|
| 1 | §4 (+ §3 for the reading block) | D1, D2 | V01, V02 | "¿Qué mide esta cifra?" (Actividad 1) · "Ficha del caso de uso" (Actividad 2) | Ficha del caso de uso |
| 2 | §5 | D3, D4, D5 | V03 | "Pasos que se acumulan" (block "Cálculo en vivo") · "Picos y valles del caso" | Mapa de picos y valles |
| 3 | §6 | D6, D7, D8 | V04 | "El embudo, con cuidado" · "Línea base y costo total" | Línea base y costo total |
| 4 | §7 | D9, D10 | V05, V06 | "Tareas del caso" (Actividad A) · "Evaluación rediseñada" (Actividad B) | Análisis de tareas y evaluación rediseñada |
| 5 | §8 | D11, D12 | V07 | "Sube la escalera de evidencia" · "Semáforo de evidencia" | Semáforo de evidencia |
| 6 | §9 | D13, D14 | V08 | "Calendario de la Ley de IA" · "Ciclo de gobernanza" | Ciclo de gobernanza |
| 7 | §10 | D15, D16, D17 | V09 | "Marco de indicadores" · "Plan 2026–2028" · presentation timer | Presentación del proyecto final |

Session notes:

- **Sesión 1**: the `#evidencia` view is the reading block of its agenda (15–45 min); Modo clase shows its key cards there. The game's key appears only after playing and in "Para el facilitador".
- **Sesión 3**: the KB's updates (McKinsey 2026, METR 2026, PwC 2026) appear exactly where the KB puts them, each with the luna-creciente sign; the McKinsey 2026 paragraph goes in its own box.
- **Sesiones 4 and 5**: two sub-blocks each, as in the KB: "Trabajo" and "Educación superior"; "Ciencia" and "Medicina".
- **Sesión 6 — "Calendario de la Ley de IA"** (KB §9, contenido 4–5): an interactive paper timeline with two layers, "La ley" (the milestones of contenido 4) and "Ómnibus Digital (Reglamento (UE) 2026/1744)" (contenido 5). Turning on the second layer pins its own dates — anexo III on 2 de diciembre de 2027 and anexo I on 2 de agosto de 2028, each stamped "aplazado"; the prohibitions and the transitional deadline of 2 de diciembre de 2026; the national sandboxes by 2 de agosto de 2027 — and marks the general-purpose-model pins "sin cambios". Draw only dates the KB gives: it gives no earlier dates for the high-risk rules, so none are drawn. Dates outside `ries-3` and `ries-4` come from context figures. The prohibitions are a text-only card. Footer note: "Información, no asesoría jurídica."
- **Sesión 7**: no quiz and no "Errores de lectura frecuentes" (9.5). "Marco de indicadores": the KB's nine-level table, interactive (each level opens its "Pregunta evaluativa"); the plan sheet reuses it. The four scenarios are cards with pattern fills. The five messages close the session, and the closing phrase writes itself on in brush lettering.

---

## 12. The 17 láminas

### 12.1 Layout engine (`js/engine/lamina.js`) and data (`js/data/deck.js`)

- 1280×720 canvas. Zones: titular (top, brush-lettered, at most 2 lines) and subtítulo; a column of up to 3 big figures, each with label and source tag; a diagram band (flow "A → B → C", loop, proportional funnel, bars, three columns, timeline, traffic light, cycle, cards — all from `chart.js` and `figures.js`); the metaphor illustration (the lámina's own module); an "Idea central" band at the bottom (a cream strip with a brush outline); the "Pie" in small text.
- **Text is verbatim from the KB's "Guion de diapositivas"** (titular, cifras and their labels, diagram labels, idea central, pie), with two exceptions: (1) where KB §14 corrects a figure the script uses, the lámina shows the corrected version (D8: "27,0% vs 8,5%"; D15: "479.273 millones" and "106 acciones"), and the notes say that the press release and the original slides round; (2) D7 SHOULD add, in small type, the caution of its speaker note in these words: "Cada barra sale de una pregunta distinta de la misma encuesta."
- The titular of D3–D17 is the KB heading after "Dn ·" (D7: "Del uso al valor: el embudo de la adopción"); D1 and D2 have their own "Titular". The short names in 12.2 are only references.
- Notes: the KB's "Qué decir" and "Nota" for the lámina, plus links to the related "Contenido" points of its session. Do not write new notes.
- Static by default, with an optional calm 8 s ambient loop (stars, waves, drifting signs) that stops with reduced motion; print and thumbnails use the still frame.

### 12.2 Illustrations (how each KB metaphor is redrawn)

- **D1 · Portada** — the hero's iceberg as a still (9.2): night sea, crescent moon, irregular stars; the luminous tip with "88% de organizaciones usa IA" and its tag; the submerged mass with "Escala · Valor · Gobernanza".
- **D2 · Ruta de lectura** — a calligraphic road with six stations and their signs, "1 Capacidad técnica" to "Agenda 2026–2028"; an irregular star as the compass rose; the central question brush-lettered.
- **D3 · La frontera irregular** — a cordillera of flat biomorphic mountains; two peaks lit in yellow with their labels and the tag of `cap-3` (estado "Con matiz"); two deep ultramarine valleys with their labels and tags (`cap-5`, `cap-6`); a small warm climber with a rope; the three-step diagram along the bottom.
- **D4 · De chatbot a agente** — top: "Pregunta → Respuesta" as one bubble entering and leaving the lamp; bottom: the ruled agent loop around the lamp; right: a ruled ladder the lamp climbs, rungs "OSWorld 12%" and "~66%", the last one cracked "≈1 de cada 3 falla" (`cap-1`); figures `adop-2`, `adop-3`. The KB's "robot aprendiz" is the lamp: AI never gets a body.
- **D5 · Convergencia y concentración** — six identical lamps on thin ruled wheels, packed near a hilltop, each with a plain pennant in a different pattern (no names, no flags, no logos); the bars "Modelos notables 2025: EE. UU. 59 · China 35" exactly proportional (`cap-10`); figures `cap-9`, `cap-11`.
- **D6 · Capital e infraestructura** — a river of gold coins flowing into a reservoir with a single sluice gate; beside it, a ruled server tower with a hand-drawn energy meter at "29,6 GW"; the chain "Capital → Cómputo → Modelos → Productos"; figures `eco-1`, `eco-3`, `eco-4`; idea central from `eco-6`.
- **D7 · Del uso al valor** — the four bars of the funnel exactly proportional (`adop-1`, `adop-2`, `adop-4` drawn at one third with the "≈" cap, `adop-5`), the narrowest marked "cuello de botella"; a bridge over an abyss from "Uso" to "Valor", its last span still scaffolding.
- **D8 · Productividad** — a balance: three small weights on the left pan (`prod-1`), an hourglass on the right (`prod-3`, with the "desactualizado" note); the causal diagram with the dotted "asociación" line; figures `prod-5` (corrected form) and `prod-6`.
- **D9 · Trabajo** — a warm calligraphic ladder whose first rung dissolves into dots, a young person looking up; the diagram "No son lo mismo: Exposición → Automatización → Desplazamiento"; figures `trab-1`, `trab-2`, `trab-3`, `trab-4`.
- **D10 · Universidad** — a fast warm boat pushed by a small ruled motor (the lamp), with no compass or map, a distant lighthouse; the four-step evaluation path; figures `edu-1`, `edu-2`, `edu-3`, `edu-5`. The "34%" appears only in the KB note that explains why it was removed.
- **D11 · Ciencia** — a telescope on a tripod and a microscope pointed at the process bar: the first two steps lit, the third half-lit, the last two dark; figures `cien-1`, `cap-5`, `cap-6`.
- **D12 · Medicina** — a tall calligraphic traffic light, lights in fixed positions with their signs and labels, each with its figures and tags (green `med-1`; amber `med-2`; red `med-3`, `med-5`, `med-6`); the 2,4% sits on its own line, with a tag that shows its scope, so it never reads as a share of the 258; evidence chips in monochrome form; the path "Antes de escalar".
- **D13 · Riesgos** — a hand-drawn control dial whose needle rests at 362 with a faint ghost needle at 233 (`ries-1`, "+55%", exact angles); three columns with their signs (`ries-2`).
- **D14 · Regulación y gobernanza** — the timeline for general-purpose models (`ries-3`) with the Ómnibus note (`ries-4`); the six-step cycle around a warm steering wheel with a brake disc.
- **D15 · América Latina y Colombia** — a suspension bridge from the lit bank "Uso" to the bank "Capacidad propia", still under construction; figures `alc-1`, `alc-3`, `alc-4` (exact figures); the path "Adoptante → Cómputo, datos y talento → Soberanía".
- **D16 · Agenda 2026–2028** — a road with three lanes (Gobiernos, Universidades, Organizaciones) and milestones 2026, 2027, 2028; a compass star; on the lámina, the KB note "el orden por año es una secuencia propuesta".
- **D17 · Cinco mensajes para decidir** — five cards with signs (cordillera, iceberg, escalera sin primer peldaño, lancha con brújula, volante), with the text of KB §10, contenido 9 (the second card's "88% de uso frente a 39% con impacto en EBIT" carries the tags of `adop-1` and `adop-5`); a compass star floating on the night sea, turning toward a lighthouse; the closing phrase brush-lettered.

---

## 13. The 9 videos

### 13.1 Conventions

- Format per scene: **id (min N s)** · **Se ve** (write the scene's `seVe` in Spanish from it) · the voice lines. Subtitles = the voice lines. `CHECKPOINT` = question · options (✓ = correct) · explanation.
- Minimum seconds are lower bounds; the voice decides the final length (6.2). Each video lists its target length, chapters (`desde` = first scene of the chapter) and poster frame.
- **Every figure in a line is backed by the ids after it** (5.4); the checker (5.8) enforces it. Every number drawn in a scene gets its source tag (3.8) and follows the chart rules (3.7).
- Quoted text in **Se ve** is final on-screen copy: it goes into the scene's `rotulos`, with the ids of the line whose figures it shows. A source tag is never typed: "its tag" in a scene means the tag built from that figure's data.
- Each video follows a learning arc: a question that opens it, one idea per scene with a concrete image, the key term written on screen when it is said, checks for understanding, a recap or a question at the end of each chapter, and a short closing phrase.
- Every scene that shows AI follows 3.5; every scene that shows the five types follows the meaning-zone rule (4.1).

### V01 · iceberg · "Adopción masiva, valor por demostrar"

Sesión 1 · láminas D1–D2 · target 2½–3½ min · poster: `bajo-el-agua` @ 0.8
Chapters: "La punta del iceberg" (desde `noche`) · "Debajo del agua" (desde `bajo-el-agua`) · "La ruta del curso" (desde `ruta`)

1. **noche** (min 12) — Se ve: a night sea in ultramarine with calligraphic waves, a crescent moon and irregular stars; far away, a small luminous shape on the horizon; title brush-lettered: "Estado de la IA 2026".
   - NARRADOR: "En 2026, la inteligencia artificial pasó de ser una tecnología experimental a una infraestructura de propósito general: está en las organizaciones, en la educación, en la ciencia y en la medicina."
   - NARRADOR: "Pero ¿cuánto valor produce de verdad? Empecemos por lo que se ve."
2. **punta** (min 14) — Se ve: the luminous tip of an iceberg rises above a calligraphic waterline, lit by a tiny AI lamp at its top; "88%" writes on with the label "de organizaciones usa IA en al menos una función" and its tag; the lectora appears in the corner with her notebook.
   - NARRADOR: "Según la encuesta de McKinsey de 2025, el 88% de las organizaciones usa IA de forma regular en al menos una función." ⟨adop-1⟩
   - LECTORA: "Un momento: ¿qué mide exactamente esa cifra?"
   - NARRADOR: "Mide uso declarado: lo que las organizaciones dicen hacer. Es la punta del iceberg."
3. **bajo-el-agua** (min 16) — Se ve: the waterline sinks slowly; the huge submerged mass appears in deep washes; "Escala", "Valor" and "Gobernanza" write themselves on it in chalk-white calligraphy; then two figures surface beside it: "Cerca de dos tercios no escalan la IA a toda la organización" (a unit grid with one third lit, "≈" cap) and a bar "39%" with the note "casi siempre menor de 5%".
   - NARRADOR: "Debajo del agua está lo que decide el valor: la escala, el valor y la gobernanza."
   - NARRADOR: "Cerca de dos tercios de las organizaciones no han escalado la IA a toda la organización. Y solo el 39% reporta algún impacto en su EBIT, la utilidad antes de intereses e impuestos; casi siempre, menor de 5%." ⟨adop-4, adop-5⟩
4. **advertencia** (min 12) — Se ve: on a desk, a small lamp glows next to a calendar full of marked days, while a single coin stays small; the stamp "Uso no es valor" presses onto the page.
   - NARRADOR: "Primera advertencia del curso: uso no es valor. Una organización puede usar IA todos los días sin obtener resultados." ⟨adv 1⟩
   - NARRADOR: "El valor exige rediseñar flujos de trabajo, integrar datos, formar personas y medir contra una línea base."
5. **ruta** (min 16) — Se ve: a calligraphic road map unrolls; six stations draw on in order with their signs: "Capacidad técnica", "Economía y adopción", "Trabajo y educación", "Ciencia y salud", "Riesgo y gobernanza", "Agenda 2026–2028"; an irregular star serves as the compass rose.
   - NARRADOR: "Vamos a recorrer el estado de la IA en seis paradas: capacidad técnica; economía y adopción; trabajo y educación; ciencia y salud; riesgo y gobernanza; y, al final, la agenda 2026–2028."
   - NARRADOR: "En cada parada vamos a distinguir lo que la IA logra en condiciones controladas de lo que produce en el mundo real."
6. **caso** (min 14) — Se ve: a team of four diverse professionals around a table opens a blank card titled "Nuestro caso de uso"; the card travels along the road and collects a small stamp at each station.
   - NARRADOR: "Y no lo haremos en abstracto: cada equipo elegirá un caso de uso real de su contexto y lo desarrollará, sesión tras sesión, hasta el proyecto final."
   - NARRADOR: "Por ejemplo: una tutoría, la atención a ciudadanos, una revisión de literatura, la clasificación de solicitudes o el apoyo a la redacción clínica."
7. **pregunta** (min 12) — Se ve: a notebook page with a big hand-lettered question and empty lines; a pencil waits; stars drift.
   - NARRADOR: "Esta es la pregunta que guiará todo el curso: ¿cuánto valor verificable produce la IA, para quién y con qué controles?" (pausa 3 s)
   - LECTORA: "Y antes de creerle a cualquier cifra, otra pregunta: ¿qué mide realmente?"
8. **cierre** (min 10) — Se ve: back to the sea; the waterline settles halfway, showing the tip and the mass together; final title "No importa cuánta IA se usa, sino cuánto valor verificable produce."; slow fade to navy.
   - NARRADOR: "Porque no importa cuánta IA se usa, sino cuánto valor verificable produce."

### V02 · que-mide · "¿Qué mide esta cifra?"

Sesión 1 (marco transversal, KB §3) · the five types in every scene of chapter 1 (meaning zone) · target 3–4½ min · poster: `cinco-tipos` @ 0.8
Chapters: "Cinco tipos de evidencia" (desde `titulares`) · "Leer la fuente" (desde `fuentes`) · "Cuatro advertencias" (desde `advertencias`)

1. **titulares** (min 12) — Se ve: a swirl of hand-drawn newspaper headlines (scribbled lines and big "%" signs, no readable numbers) blows across the page like leaves; the lectora catches one in her notebook.
   - NARRADOR: "Cada semana aparece una cifra nueva sobre inteligencia artificial. Pero no todas responden a la misma pregunta."
   - LECTORA: "Antes de repetir una cifra, pregúntate: ¿qué tipo de evidencia es?"
2. **capacidad** (min 14) — Se ve: a ruled navy test panel; a small lamp works through a test sheet; a ruled bar grows from its "~12%" mark to "66,3%"; the chip "Capacidad técnica" (matraz) writes on with its tag.
   - NARRADOR: "Primero, la capacidad técnica: el desempeño en evaluaciones controladas, los llamados benchmarks."
   - NARRADOR: "Por ejemplo, en la prueba OSWorld, los agentes de IA pasaron de cerca de 12% a 66,3% de éxito." ⟨cap-1⟩
3. **uso** (min 12) — Se ve: a warm office; people speak in bubbles that rise and merge into one big bubble "88%"; the chip "Uso declarado" (bocadillo).
   - NARRADOR: "Segundo, el uso declarado: lo que personas u organizaciones dicen hacer. El 88% de las organizaciones dice usar IA en al menos una función." ⟨adop-1⟩
4. **resultado** (min 14) — Se ve: a magnifying glass over two stopwatches beside a developer's desk; one runs longer, "+19% de tiempo"; the chip "Resultado observado" (lupa); a pinned note "METR lo marca hoy como desactualizado".
   - NARRADOR: "Tercero, el resultado observado: un cambio medido en tiempo, costo, calidad o empleo."
   - NARRADOR: "En un ensayo aleatorio de 2025, desarrolladores experimentados tardaron 19% más con IA. METR, que hizo el estudio, hoy lo marca como desactualizado." ⟨prod-3⟩
5. **expectativa** (min 12) — Se ve: a manager looks through a spyglass toward a horizon where small lamps line up; a calendar marked "12–18 meses"; the chip "Expectativa" (catalejo).
   - NARRADOR: "Cuarto, la expectativa: una intención declarada. El 81% de los líderes espera integrar agentes en 12 a 18 meses." ⟨adop-8⟩
6. **proyeccion** (min 12) — Se ve: a comet with a dotted tail crosses the sky toward a small road sign "2030"; the chip "Proyección" (cometa).
   - NARRADOR: "Y quinto, la proyección: una estimación a futuro. Según el Foro Económico Mundial, el 39% de las competencias centrales cambiará hacia 2030." ⟨trab-5⟩
7. **cinco-tipos** (min 14) — Se ve: the five chips settle into a row like a legend, each with color, sign and label; the bar, the bubble, the stopwatch, the spyglass and the comet each fly to their chip.
   - NARRADOR: "Capacidad técnica, uso declarado, resultado observado, expectativa y proyección. Cada tipo responde a una pregunta distinta."
   - LECTORA: "Y los titulares suelen mezclarlos como si fueran lo mismo."
   - CHECKPOINT: "«El 86% de los estudiantes usa IA» (Digital Education Council, 2024). ¿Qué tipo de evidencia es?" · Capacidad técnica / Uso declarado ✓ / Resultado observado / Proyección · "Es uso declarado: lo que los estudiantes dicen en una encuesta." ⟨edu-1⟩
8. **fuentes** (min 18) — Se ve: five paper cards fan out, each with its source family and, below, its limit writing on: "Stanford AI Index", "OIT y CEPAL", "McKinsey y Microsoft", "PwC", "Benchmarks".
   - NARRADOR: "Tampoco todas las fuentes miden lo mismo. El AI Index de Stanford integra muchas bases y evaluaciones, pero muchas de sus cifras son de laboratorio o de un solo país."
   - NARRADOR: "La OIT y la CEPAL ofrecen indicadores comparables entre países, pero miden exposición o un índice compuesto, no impacto. McKinsey y Microsoft recogen percepciones, con autoinforme, sesgo de selección e interés comercial."
   - NARRADOR: "PwC analiza vacantes y estados financieros, y muestra asociaciones, no causalidad. Y los benchmarks miden desempeño en condiciones controladas: se saturan y pueden quedar lejos del trabajo real."
9. **muestra** (min 14) — Se ve: a large hand-drawn net in a sea of dots (organizations); only some dots are inside it; the label "Cobertura no es representatividad".
   - NARRADOR: "Y recuerda: una encuesta grande sigue siendo una muestra de informantes, no un censo de empresas. Una cobertura amplia mejora la descripción, pero no elimina los sesgos."
   - CHECKPOINT: "«Los incidentes documentados pasaron de 233 a 362». ¿Qué le falta a esa cifra para saber si el riesgo creció?" · Una fuente más conocida / Un denominador, como una tasa por unidad de adopción ✓ / Más decimales · "Es un conteo bruto: puede reflejar más daños, pero también más uso y más reporte." ⟨ries-1⟩
10. **advertencias** (min 18) — Se ve: four stamps press onto the page one by one, each as two signs separated by a crossed equals sign (4.2).
    - NARRADOR: "Por eso el curso tiene cuatro advertencias. Uso no es valor. Benchmark no es desempeño real." ⟨adv 1⟩ ⟨adv 2⟩
    - NARRADOR: "Exposición no es desempleo. Y asociación no es causalidad." ⟨adv 3⟩ ⟨adv 4⟩
    - LECTORA: "Las vamos a usar en cada sesión."
    - CHECKPOINT: "«En las industrias más expuestas a la IA, el ingreso por empleado creció más». ¿Qué advertencia aplica?" · Uso no es valor / Benchmark no es desempeño real / Exposición no es desempleo / Asociación no es causalidad ✓ · "Esas industrias también tienen más capital, datos y capacidad gerencial: es una asociación, no un efecto causal."
11. **cierre** (min 10) — Se ve: the lectora ties a source tag to a big number on the notebook page; the tag reads "Fuente · Alcance · Tipo de evidencia"; final title "Toda cifra va con su fuente."
    - NARRADOR: "Toda cifra va con su fuente, su alcance y su tipo de evidencia. Así empieza el criterio."

### V03 · frontera · "La frontera irregular"

Sesión 2 · láminas D3–D5 · target 5–7 min · poster: `cordillera` @ 0.6
Chapters: "Picos y valles" (desde `pregunta`) · "De chatbot a agente" (desde `chatbot`) · "Errores que se acumulan" (desde `pasos`) · "Convergencia y concentración" (desde `peloton`)

1. **pregunta** (min 10) — Se ve: a ruled path of 20 small steps on a navy grid; a small lamp waits at the start; a warm hand hovers over a stamp "Confiar".
   - NARRADOR: "¿Le confiarías a un agente de IA una tarea de 20 pasos?" ⟨ilustrativo⟩
   - LECTORA: "Depende: ¿qué tan bien hace cada paso y qué pasa si se equivoca?"
2. **cordillera** (min 16) — Se ve: a Miró cordillera of flat biomorphic mountains; two peaks light up in yellow: "Preguntas científicas de nivel doctoral (GPQA)" with "Referencia de expertos: 81,2%", and "Matemáticas de competición"; a small warm climber with a rope walks the ridge.
   - NARRADOR: "La capacidad de la IA es una frontera irregular: picos muy altos junto a valles profundos."
   - NARRADOR: "En los picos, los mejores modelos superan la referencia de expertos en preguntas científicas de nivel doctoral, la prueba GPQA, y alcanzan o superan a los mejores concursantes en matemáticas de competición." ⟨cap-3⟩
3. **casi-pico** (min 12) — Se ve: a third summit almost reaches a dotted line "mejor experto humano"; a tiny bracket marks the gap "0,4 puntos"; label "MMMU: 88,2%".
   - NARRADOR: "Otros picos casi llegan: en razonamiento multimodal, la prueba MMMU, alcanzan 88,2%, apenas 0,4 puntos por debajo del mejor experto humano." ⟨cap-3⟩
4. **valles** (min 16) — Se ve: the camera descends into dark valleys washed in deep blue; two labels write on with proportional bars on one scale: "Replicar investigaciones de astrofísica: menos de 20%" and "PaperArena: mejor agente 38,8% · expertos 83,5%".
   - NARRADOR: "Y en los valles: al replicar investigaciones de astrofísica, logran menos de 20%. En PaperArena, el mejor agente llega a 38,8%, frente a 83,5% de expertos con doctorado." ⟨cap-5, cap-6⟩
   - NARRADOR: "El promedio oculta las colas de error. En decisiones críticas importan la frecuencia y la gravedad del peor resultado."
   - CHECKPOINT: "Un sistema tiene un promedio muy alto en una prueba. ¿Qué más conviene mirar antes de usarlo en una decisión crítica?" · Solo el promedio / La frecuencia y la gravedad del peor resultado ✓ / El nombre de la prueba · "El promedio oculta las colas de error."
5. **saturacion** (min 14) — Se ve: three ruled gauges labeled MMMU, GPQA and SWE-bench; on each, an arrow grows by exactly its gain on one shared scale ("+18,8", "+48,9", "+67,3 puntos"); then a separate gauge with every mark filled blurs ("ya no distingue"), and new instruments draw on beside it: "evaluaciones dinámicas", "tareas no contaminadas", "varios intentos", "fuera de distribución", "daños".
   - NARRADOR: "Además, los benchmarks se saturan. Entre 2023 y 2024, el desempeño subió 18,8 puntos en MMMU, 48,9 en GPQA y 67,3 en SWE-bench." ⟨cap-4⟩
   - NARRADOR: "Una prueba saturada deja de distinguir entre sistemas. Por eso la medición migra hacia evaluaciones dinámicas, tareas no contaminadas, confiabilidad en varios intentos, desempeño fuera de distribución y medición de daños." ⟨adv 2⟩
6. **chatbot** (min 14) — Se ve: top half: a speech bubble enters the lamp and one answer comes out; bottom half: the same lamp inside a ruled loop with five stations, "Objetivo → Planificar → Usar herramientas → Ejecutar → Verificar", and a return arrow to "Planificar".
   - NARRADOR: "Ahora, de chatbot a agente. Un chatbot responde una pregunta. Un agente persigue un objetivo en bucle: planifica, usa herramientas, ejecuta, verifica y vuelve a planificar."
7. **escalera** (min 16) — Se ve: a ruled machine ladder; the lamp climbs from the rung "~12%" to "66,3%"; a dotted line marks the human reference "72,35%"; the top rung shows a hairline crack, "≈ 1 de cada 3 intentos falla"; then a second, separate ladder for Terminal-Bench 2.0: "20% (febrero de 2025) → 77,3% (inicios de 2026)".
   - NARRADOR: "Los agentes mejoran rápido. En OSWorld, una prueba de tareas en el computador, pasaron de cerca de 12% a 66,3% de éxito, frente a una referencia humana de 72,35%. Aún fallan cerca de uno de cada tres intentos." ⟨cap-1⟩
   - NARRADOR: "En Terminal-Bench 2.0, el éxito pasó de 20% en febrero de 2025 a 77,3% a inicios de 2026." ⟨cap-2⟩
8. **empresas** (min 12) — Se ve: back in the warm world: a grid of 100 small office windows, exactly 23 lit by lamps, labeled "23% escala agentes en alguna función"; beside it, a card with the sentence "En ninguna función el escalamiento supera 10%" (no invented bars).
   - NARRADOR: "En las empresas, el 23% escala agentes en alguna función, y en ninguna función el escalamiento supera 10%." ⟨adop-2, adop-3⟩
9. **pasos** (min 18) — Se ve: the "Ejemplo ilustrativo" stamp; a row of 20 ruled steps, the lamp's glow dimming a little at each; a calligraphic counter ends at "0,95 elevado a 20 ≈ 0,36"; a second row with 99% per step ends at "≈ 0,82".
   - NARRADOR: "¿Por qué fallan las tareas largas? Un ejemplo ilustrativo, que no viene de las fuentes: si cada paso sale bien el 95% de las veces y los pasos son independientes, una tarea de 20 pasos se completa solo el 36% de las veces." ⟨ilustrativo⟩
   - NARRADOR: "Con 99% de éxito por paso, la misma tarea se completa el 82% de las veces. Los errores se acumulan." ⟨ilustrativo⟩
   - CHECKPOINT: "Con 95% de acierto por paso, ¿qué probabilidad tiene un agente de completar 20 pasos?" · 95% / Cerca de 36% ✓ / Cerca de 80% · "Es 0,95 multiplicado por sí mismo 20 veces: cerca de 0,36. Es un ejemplo ilustrativo." ⟨ilustrativo⟩
10. **limites** (min 14) — Se ve: three small cards: "Errores que se acumulan" (a chain with one cracked link), "Poca observabilidad" (a ruled box with a closed lid), "Riesgos de seguridad" (a lamp holding keys to an envelope, a folder and a door).
    - NARRADOR: "La autonomía tiene tres límites. Los errores se acumulan en las tareas largas. Hay poca observabilidad: no siempre se sabe por qué el sistema eligió una acción."
    - NARRADOR: "Y hay riesgos de seguridad: un agente con acceso a correo, archivos o sistemas amplía el daño de instrucciones maliciosas, permisos excesivos o errores."
11. **tendencia** (min 16) — Se ve: on a navy panel, a ruled rising line of task lengths ends at the present; beyond it, only fog with the handwritten words "Tendencia, no pronóstico" (no dotted extension); labels "se duplicó cada ~7 meses (2019–2025)" and "~89 días desde 2024 (Time Horizon 1.1)".
    - NARRADOR: "METR mide el horizonte de tareas: la duración de las tareas de software que un agente completa con 50% de éxito. Entre 2019 y 2025, se duplicó cada siete meses, aproximadamente." ⟨cap-8⟩
    - NARRADOR: "Con su metodología actualizada de enero de 2026, el tiempo de duplicación desde 2024 es de unos 89 días. Pero los resultados varían mucho entre tipos de tareas: es una tendencia, no un pronóstico." ⟨cap-8⟩
12. **peloton** (min 16) — Se ve: six identical lamps roll on thin ruled wheels up a hill, tightly packed near the top, each trailing a small plain pennant with a different pattern (dots, stripes, stars, checks, waves, spirals); no names, flags or logos.
    - NARRADOR: "Mientras tanto, los modelos convergen. En marzo de 2026, modelos de Anthropic, xAI, Google, OpenAI, Alibaba y DeepSeek aparecían dentro de un margen estrecho en clasificaciones de preferencia. Y Stanford considera que la brecha entre Estados Unidos y China prácticamente se cerró." ⟨ctx: modelos-convergen⟩
    - NARRADOR: "Si el desempeño converge, la competencia se traslada al costo, la latencia, la confiabilidad, la privacidad, la integración y la apertura."
13. **concentracion** (min 16) — Se ve: a stream of small lamps flows mostly through one gate labeled "industria", with a counter "91,2%"; then three proportional bars: "EE. UU. 59", "China 35", "Corea del Sur 8"; finally, a ruled box whose lid closes over "parámetros", "datos" and "duración del entrenamiento".
    - NARRADOR: "Y la producción se concentra: más de 90% de los modelos notables de 2025 vino de la industria. Estados Unidos produjo 59; China, 35, y Corea del Sur, 8." ⟨cap-9, cap-10⟩
    - NARRADOR: "Además, cae la transparencia: varias organizaciones ya no revelan los parámetros, los datos ni la duración del entrenamiento."
    - CHECKPOINT: "¿Qué proporción de los modelos notables de 2025 vino de la industria?" · Cerca de la mitad / Más de 90% ✓ / 23% · "Fue 91,2%: la producción de modelos notables está concentrada en la industria." ⟨cap-9⟩
14. **abiertos** (min 16) — Se ve: a small ruled lamp labeled "111 millones de parámetros" lights a specific task card that a much bigger lamp leaves dark; then 102 small cards, 47 marked "API"; finally, a ruled box with a transparent lid showing only a tidy grid of weights, while "código", "datos" and "proceso" stay in closed drawers.
    - NARRADOR: "No siempre gana el más grande: un modelo de proteínas de 111 millones de parámetros y uno genómico de 200 millones superaron a sistemas mucho mayores en evaluaciones específicas." ⟨cap-12⟩
    - NARRADOR: "En 2025, el acceso por API fue el formato más común entre los modelos notables: 47 de 102. Y ojo: pesos abiertos no significa código, datos y proceso abiertos." ⟨cap-11⟩
    - CHECKPOINT: "«Pesos abiertos» significa:" · Código, datos y proceso abiertos / Acceso a los parámetros, no necesariamente a los datos ni al código ✓ / Acceso solo por API · "Publicar los pesos no implica publicar los datos, el código ni el proceso de entrenamiento."
15. **cierre** (min 12) — Se ve: back to the cordillera at dusk; the climber plants a small flag on a modest, well-mapped peak; final title "Medir confiabilidad, no solo precisión."
    - NARRADOR: "Antes de confiar, mira el mapa completo: dónde están los picos, dónde los valles y cuánto cuesta un error."
    - NARRADOR: "Mide la confiabilidad, no solo la precisión."

### V04 · del-uso-al-valor · "Del uso al valor"

Sesión 3 · láminas D6–D8 · target 6½–8 min · poster: `embudo` @ 0.7
Chapters: "Capital e infraestructura" (desde `capital`) · "El embudo" (desde `embudo`) · "Productividad" (desde `productividad`) · "Asociación no es causalidad" (desde `pwc`)

1. **capital** (min 16) — Se ve: a river of flat gold coins with black outlines crosses a valley toward a reservoir with a single sluice gate; a counter writes on: "344.700 millones de dólares · +127,5%"; then a wider stream "inversión corporativa: 581.700 millones de dólares".
   - NARRADOR: "El capital llega rápido. En 2025, la inversión privada en IA llegó a 344.700 millones de dólares, 127,5% más que el año anterior." ⟨eco-1⟩
   - NARRADOR: "La IA generativa creció más de 200% y captó casi la mitad de esa inversión. Y la inversión corporativa más que se duplicó, hasta 581.700 millones de dólares." ⟨eco-1, eco-2⟩
2. **paises** (min 14) — Se ve: two coin piles on the two banks of the river, exactly in proportion (23,1 to 1), labeled "Estados Unidos" and "China"; a note pinned to the smaller one: "posiblemente subestimada: fondos estatales de orientación"; then four small signs for China's leads: publicaciones, citaciones, patentes concedidas, robots industriales.
   - NARRADOR: "Estados Unidos invirtió 23 veces más capital privado que China, aunque Stanford advierte que China puede estar subestimada por sus fondos estatales de orientación." ⟨eco-3⟩
   - NARRADOR: "China, a su vez, lidera en publicaciones, citaciones, patentes concedidas e instalación de robots industriales."
3. **cadena** (min 12) — Se ve: four linked stations draw on along the river: "Capital → Cómputo → Modelos → Productos"; the reservoir's single gate narrows the flow.
   - NARRADOR: "Ese dinero recorre una cadena concentrada: capital, cómputo, modelos y productos."
4. **costo-oculto** (min 16) — Se ve: a ruled block of identical compute cells; for each of three developers, only a slice lights up as "corrida final de entrenamiento", exactly proportional: "OpenAI (2024) 9,6%", "MiniMax 22,6%", "Z.ai 12,3%"; the rest of each block is labeled "experimentos, datos, evaluaciones e iteraciones".
   - NARRADOR: "Hay, además, un costo que no se ve. La corrida final de entrenamiento fue solo una parte del gasto de cómputo de investigación y desarrollo: 9,6% en OpenAI en 2024, 22,6% en MiniMax y 12,3% en Z.ai." ⟨eco-6⟩
   - NARRADOR: "El resto se va en experimentos, datos, evaluaciones e iteraciones. Mirar solo el entrenamiento final subestima las barreras de entrada."
5. **energia** (min 18) — Se ve: a ruled server tower with a hand-drawn energy meter whose needle settles on "29,6 GW"; then four floating biomorphic islands with exact dot clusters of state-backed supercomputing clusters in 2025: "Europa y Asia Central: 44 (eran 3 en 2018)", "China: 85", "Norteamérica: 41", "América Latina y el Caribe: 8".
   - NARRADOR: "La infraestructura también crece: la capacidad eléctrica de los centros de datos de IA llegó a cerca de 29,6 gigavatios al cierre de 2025. Si la demanda crece más rápido que la eficiencia, el consumo total sube: es el efecto rebote." ⟨eco-4⟩
   - NARRADOR: "Y el cómputo público se reparte de forma desigual. Entre 2018 y 2025, Europa y Asia Central pasaron de 3 a 44 clústeres de supercomputación con respaldo estatal. China tiene 85; Norteamérica, 41, y América Latina y el Caribe, 8." ⟨eco-7⟩
6. **embudo** (min 18) — Se ve: lámina D7's four horizontal bars draw on, exactly proportional on one zero-based scale: "88% usa IA en al menos una función", "62% experimenta o escala agentes", "~1/3 escala la IA en toda la organización" (the narrowest, marked "cuello de botella", with the "≈" cap), "39% reporta algún impacto en EBIT (normalmente <5%)"; the lectora looks at them, puzzled.
   - NARRADOR: "Ahora, del uso al valor. Según McKinsey, en 2025 el 88% de las organizaciones usaba IA de forma regular en al menos una función, frente a 78% un año antes. Y el 62% experimentaba con agentes o los escalaba." ⟨adop-1, adop-2⟩
   - NARRADOR: "Pero solo cerca de un tercio escalaba la IA a toda la organización, y el 39% reportaba algún impacto en el EBIT, casi siempre menor de 5%." ⟨adop-4, adop-5⟩
   - LECTORA: "Un detalle: ¿son las mismas organizaciones pasando de una barra a la siguiente?"
   - NARRADOR: "No. Cada barra sale de una pregunta distinta de la misma encuesta. El embudo muestra un patrón, no una cohorte."
7. **puente** (min 14) — Se ve: a bridge over an abyss from the bank "Uso" to the bank "Valor"; its last span is still scaffolding; warm figures carry planks labeled "procesos", "liderazgo", "métricas", "transformación".
   - NARRADOR: "El cuello de botella es organizacional, no el acceso al modelo. Las organizaciones de alto desempeño no se distinguen tanto por la tecnología como por rediseñar sus flujos de trabajo, tener liderazgo, definir métricas y apuntar a la transformación." ⟨adv 1⟩
8. **etapas** (min 14) — Se ve: six stepping stones cross the river: "Acceso → Experimentación → Integración → Rediseño → Escala → Transformación"; most small figures crowd on the second and third stones.
   - NARRADOR: "Piensa en seis etapas de madurez: acceso, experimentación, integración, rediseño, escala y transformación. La mayoría de las organizaciones está entre la experimentación y la integración."
   - CHECKPOINT: "Una organización compró licencias para todo su personal y tiene varios pilotos activos. ¿Eso demuestra madurez?" · Sí: ya está en la etapa de escala / No necesariamente: licencias, usuarios y pilotos no son madurez ✓ · "Contar licencias, usuarios o pilotos como si fueran madurez es un error de lectura frecuente."
9. **actualizacion** (min 14) — Se ve: a second, separate notebook page slides in beside the first, labeled "Encuesta 2026 · otra muestra" with the "Actualización" ribbon; its figures write on: "~9 de 10 usan IA", "44% escala a toda la empresa (38% un año antes, según esa edición)", "37% algún impacto en EBIT"; no arrow or line connects the two pages; the note "No se compara directamente".
   - NARRADOR: "Ya existe una edición 2026 de esa encuesta, con 1.719 participantes de 97 países: cerca de nueve de cada diez organizaciones usan IA, el 44% la escala a toda la empresa y el 37% reporta algún impacto en el EBIT." ⟨adop-7⟩
   - NARRADOR: "El curso usa la edición 2025 del informe base. Y no mezclamos ediciones como si fueran una serie: son muestras distintas."
10. **productividad** (min 16) — Se ve: a balance scale; on its left pan, three small weights write on: "Soporte al cliente +14–15%", "Software +26%", "Marketing +50%"; a separate small card: "Experimento de campo: 4.867 desarrolladores, +26,08% de tareas completadas".
    - NARRADOR: "¿Y la productividad? Es real, pero heterogénea. En estudios reunidos por Stanford, hubo aumentos de 14 a 15% en soporte al cliente, de 26% en desarrollo de software y de 50% en producción de marketing." ⟨prod-1⟩
    - NARRADOR: "Un experimento de campo con 4.867 desarrolladores estimó 26,08% más tareas completadas, con más beneficio para los menos experimentados." ⟨prod-2⟩
11. **metr** (min 18) — Se ve: on the right pan, an hourglass: "Desarrolladores experimentados: +19% de tiempo", with the pinned note "METR lo marca hoy como desactualizado"; below, a separate card for the February 2026 follow-up: an interval line from −38% to +9% with its point at −18% and the zero line crossing it, labeled "No concluyente".
    - NARRADOR: "En el otro platillo: en un ensayo aleatorio con 16 desarrolladores experimentados y 246 tareas en sus propios repositorios, las herramientas de comienzos de 2025 aumentaron 19% el tiempo." ⟨prod-3⟩
    - NARRADOR: "METR marca hoy ese estudio como desactualizado. Su seguimiento de febrero de 2026 no fue concluyente: 18% menos de tiempo, con un intervalo de confianza del 95% que va de 38% menos a 9% más." ⟨prod-4⟩
    - LECTORA: "Entonces depende: de la tarea, de quién la usa y de cuánto cuesta verificar."
12. **pwc** (min 16) — Se ve: two industry towers grow side by side, exactly proportional: "Industrias más expuestas a la IA: +27,0%" and "Menos expuestas: +8,5%" (ingreso por empleado, 2018–2024); a coin with "Prima salarial media por habilidades de IA: 56% (2024)"; then a separate small card with the "Actualización" ribbon, not joined to the first coin: "Barómetro 2026: prima de 62%".
    - NARRADOR: "Otra cifra famosa: entre 2018 y 2024, el ingreso por empleado creció 27,0% en las industrias más expuestas a la IA, frente a 8,5% en las menos expuestas. Y las habilidades de IA tuvieron una prima salarial media de 56% en 2024." ⟨prod-5, prod-6⟩
    - NARRADOR: "El barómetro de PwC de 2026 reporta una prima de 62%; el curso usa la edición del informe base." ⟨prod-7⟩
    - LECTORA: "¿Y eso prueba que la IA causó el crecimiento del ingreso?"
13. **causalidad** (min 18) — Se ve: lámina D8's diagram draws on in the warm style: a large biomorphic cloud "Capital, datos, gestión" sends two solid calligraphic arrows, one to "Exposición a IA" and one to "Ingreso por empleado"; between those two, only a dotted line labeled "asociación"; the stamp "Asociación no es causalidad" lands.
    - NARRADOR: "No necesariamente. Esas industrias también tienen más capital, datos, capacidad gerencial y trabajo remoto. Asociación no es causalidad." ⟨adv 4⟩
    - NARRADOR: "Para atribuir causalidad hacen falta adopciones escalonadas, experimentos de campo, discontinuidades o instrumentos plausibles."
    - CHECKPOINT: "¿Por qué la cifra de PwC no prueba que la IA cause más ingreso por empleado?" · Porque la muestra es pequeña / Porque esas industrias también tienen más capital, datos y capacidad gerencial ✓ / Porque es de 2024 · "Hay factores que influyen a la vez en la exposición a la IA y en el ingreso: es una asociación."
14. **intencion** (min 14) — Se ve: a manager with a spyglass next to a calendar marked "12–18 meses"; three small bubbles: "81% espera integrar agentes", "32% contratará especialistas en agentes", "28% contratará gestores de fuerza laboral de IA"; the chip "Expectativa".
    - NARRADOR: "Y no confundas intención con adopción: el 81% de los líderes espera integrar agentes de forma moderada o extensa en 12 a 18 meses; el 32% prevé contratar especialistas en agentes, y el 28%, gestores de fuerza laboral de IA. Son expectativas, no impacto realizado." ⟨adop-8⟩
15. **linea-base** (min 14) — Se ve: a notebook table draws on with four rows ("Tiempo por tarea", "Calidad o tasa de error", "Costo total por tarea", "Riesgo o incidentes") and four columns ("Línea base", "Meta", "Cómo se mide", "Quién verifica"), all empty; a pencil waits.
    - NARRADOR: "Para tu caso, la pregunta es concreta: ¿cuál es la línea base antes de usar IA, cuál es el costo total y quién verifica el resultado?"
    - NARRADOR: "Licencias, integración, cómputo, revisión humana, errores, seguridad y formación: todo cuenta en el costo total."
16. **cierre** (min 10) — Se ve: back at the bridge; people lay the empty table as the last plank and cross to "Valor"; final title "El capital llega rápido y el valor tarda."
    - NARRADOR: "El capital llega rápido y el valor tarda. Se construye con procesos, datos, personas y medición."

### V05 · tareas · "Tareas, no puestos"

Sesión 4 (Trabajo) · lámina D9 · target 3–4½ min · poster: `entrada` @ 0.6
Chapters: "Tres conceptos" (desde `oficina`) · "Quién siente la presión" (desde `desigual`) · "Competencias que cambian" (desde `competencias`)

1. **oficina** (min 12) — Se ve: a warm office seen from above; one person's job unfolds like a fan of task cards: writing, calling, filing, deciding, teaching a newcomer.
   - NARRADOR: "Cuando se habla de IA y empleo, la pregunta suele ser qué puestos van a desaparecer. Pero la IA transforma tareas antes que puestos."
2. **exposicion** (min 16) — Se ve: a round field of 1.000 dots (the world's employment); 250 get a soft yellow halo ("alguna exposición") and 33 turn dark ("exposición más alta"); then two smaller fields side by side: "países de ingresos altos: 34%" and "países de ingresos bajos: 11%".
   - NARRADOR: "La OIT estima que el 25% del empleo mundial está en ocupaciones con alguna exposición a la IA generativa: 34% en los países de ingresos altos y 11% en los de ingresos bajos." ⟨trab-1⟩
   - NARRADOR: "Pero solo el 3,3% está en la categoría de exposición más alta. Y la OIT considera más probable la transformación de tareas que la desaparición de puestos." ⟨trab-2⟩
3. **tres-conceptos** (min 18) — Se ve: three calligraphic doorways in a row, separated by crossed equals signs: "Exposición" (sunlight falls on a desk: tasks the AI could support), "Automatización" (a ruled lamp actually doing a task, wired into the office's flow), "Desplazamiento" (an empty chair); the label "No son lo mismo".
   - NARRADOR: "Son tres conceptos distintos. Una ocupación expuesta tiene tareas que la IA puede apoyar o realizar. La automatización efectiva exige, además, integración organizacional."
   - NARRADOR: "Y el desplazamiento depende también de la demanda, los costos, la regulación, la reorganización y las nuevas tareas. Por eso, exposición no es desempleo." ⟨adv 3⟩
   - CHECKPOINT: "«El 25% del empleo mundial tiene alguna exposición a la IA generativa». ¿Qué se puede concluir?" · Que una de cada cuatro personas perderá su empleo / Que esas ocupaciones tienen tareas que la IA puede apoyar o realizar ✓ / Que esos puestos ya se automatizaron · "Exposición no es desempleo: describe tareas, no despidos." ⟨trab-1⟩
4. **desigual** (min 16) — Se ve: administrative desks glow most; small signs for media, software and finance join them; then two fields of 1.000 dots, "mujeres" and "hombres", with exactly 47 and 24 dark dots; then the same for high-income countries, 96 and 35.
   - NARRADOR: "La exposición no se reparte igual. Las ocupaciones administrativas son las más expuestas, y la multimodalidad amplía el alcance a medios, software y finanzas."
   - NARRADOR: "La exposición más alta afecta al 4,7% del empleo femenino mundial y al 2,4% del masculino. En los países de ingresos altos, la diferencia es de 9,6% frente a 3,5%." ⟨trab-3⟩
5. **entrada** (min 16) — Se ve: lámina D9's metaphor: a warm calligraphic career ladder whose first rung dissolves into dots; a young person looks up from below; label "Desarrolladores de software de 22 a 25 años · EE. UU. · casi −20% de empleo desde 2024".
   - NARRADOR: "Hay señales de presión en los puestos de entrada: en Estados Unidos, el empleo de desarrolladores de software de 22 a 25 años cayó casi 20% desde 2024, aunque las pérdidas agregadas de empleo aún no muestran un patrón general." ⟨trab-4⟩
   - NARRADOR: "Una hipótesis plausible, pero no demostrada: se están automatizando las tareas que antes servían de escalón de entrada."
   - LECTORA: "Y si la IA hace las tareas con las que aprendían los nuevos, ¿cómo se van a formar?" (pausa 3 s)
6. **competencias** (min 16) — Se ve: a comet with a dotted tail crosses toward a road sign "2030" (chip "Proyección"); skill signs drift up: "IA y datos", "redes y ciberseguridad", "alfabetización tecnológica"; beside them, warm human signs: "pensamiento creativo", "resiliencia", "flexibilidad", "colaboración".
   - NARRADOR: "Las competencias también cambian: según el Foro Económico Mundial, el 39% de las competencias centrales cambiará hacia 2030. Las que más rápido crecen son IA y datos, redes y ciberseguridad, y alfabetización tecnológica." ⟨trab-5⟩
   - NARRADOR: "Y el pensamiento creativo, la resiliencia, la flexibilidad y la colaboración siguen siendo críticos."
7. **siete** (min 18) — Se ve: seven small cards fan out like a hand of cards, each with a sign and a short label: "Comprender", "Formular", "Verificar", "Proteger", "Diseñar y supervisar", "Documentar", "Evaluar".
   - NARRADOR: "El informe base propone siete capacidades de alfabetización avanzada: comprender capacidades y límites de la IA; formular problemas y elegir herramientas; verificar fuentes, sesgos e incertidumbre;"
   - NARRADOR: "proteger datos y propiedad intelectual; diseñar y supervisar flujos humano–IA; documentar decisiones y asumir responsabilidad; y evaluar efectos en calidad, productividad, aprendizaje y equidad." (say: "proteger datos y propiedad intelectual; diseñar y supervisar flujos entre personas e i a; documentar decisiones y asumir responsabilidad; y evaluar efectos en calidad, productividad, aprendizaje y equidad.")
8. **tareas-caso** (min 14) — Se ve: the team's case card splits into six to eight task cards; each gets one of three stamps: "La IA apoya", "La IA podría realizarla", "La persona es indispensable"; one card gets a small ladder sign: "escalón de entrada".
   - NARRADOR: "En su caso, desagreguen la ocupación en tareas y marquen cada una: ¿la IA apoya, podría realizarla o la persona es indispensable?"
   - NARRADOR: "Y señalen qué tareas sirven de escalón de entrada a las personas nuevas: ese aprendizaje también hay que preservarlo."
9. **cierre** (min 10) — Se ve: back at the ladder; several hands build a new first rung with a different shape; final title "En el trabajo cambian tareas, no solo puestos."
   - NARRADOR: "En el trabajo cambian tareas, no solo puestos."

### V06 · aprendizaje · "Evaluar el aprendizaje, no el texto"

Sesión 4 (Educación superior) · lámina D10 · target 3–4½ min · poster: `lancha` @ 0.6
Chapters: "Uso masivo" (desde `campus`) · "Uso no es preparación" (desde `preparacion`) · "Rediseñar la evaluación" (desde `evaluar`)

1. **campus** (min 16) — Se ve: a warm university courtyard; students with notebooks and phones; small cool lamps glow next to many of them; then a card with three proportional bars: "86% usa IA", "54% al menos cada semana", "24% a diario (cobertura de prensa)".
   - NARRADOR: "En la universidad, la IA se usa más de lo que se gobierna. En Estados Unidos, cuatro de cada cinco estudiantes de secundaria y universidad usan IA generativa." ⟨edu-4⟩
   - NARRADOR: "En la encuesta mundial del Digital Education Council, con 3.839 estudiantes de 16 países, el 86% dijo usarla y el 54%, al menos cada semana. Según la cobertura de prensa de esa encuesta, el 24% la usa a diario." ⟨edu-1, edu-2⟩
2. **lancha** (min 12) — Se ve: lámina D10's metaphor: a fast warm boat full of students, pushed by a small, powerful ruled motor (the lamp), with no compass and no map; a lighthouse far away.
   - NARRADOR: "Es como una lancha con un motor potente, pero sin brújula ni mapa."
   - LECTORA: "¿Y hacia dónde va?"
3. **preparacion** (min 16) — Se ve: three calligraphic bars draw on, exactly proportional: "58% dice no tener conocimientos ni habilidades suficientes en IA", "48% no se siente preparado para un mercado laboral con IA", "80%: la integración de la IA en su universidad no cumple sus expectativas".
   - NARRADOR: "Uso no es preparación. En la misma encuesta, el 58% dijo no tener conocimientos ni habilidades suficientes en IA, y el 48% no se siente preparado para un mercado laboral con IA." ⟨edu-3⟩
   - NARRADOR: "Además, el 80% considera que la integración de la IA en su universidad no cumple sus expectativas." ⟨edu-3⟩
4. **profesorado** (min 16) — Se ve: ten academics around a long table; nine hold a small lamp; a card "más de la mitad: insegura o dubitativa para usarla en docencia o investigación" (no person-by-person count); a stack of guideline documents, two thirds stamped; its tag carries the survey's scope (about 400 responses from 90 countries).
   - NARRADOR: "Y el profesorado no tiene respaldo suficiente. En una encuesta de la UNESCO a sus cátedras y redes universitarias, nueve de cada diez usan IA en su trabajo profesional, pero más de la mitad se siente insegura o dubitativa para usarla en docencia o investigación." ⟨edu-5⟩
   - NARRADOR: "Dos tercios de las instituciones tienen lineamientos de uso o los están preparando. La brecha es de formación, tiempo, soporte, seguridad jurídica y claridad institucional, no de mera resistencia." ⟨edu-5⟩
5. **evaluar** (min 16) — Se ve: a ruled sieve tries to catch generated letters on a page and lets most of them through; it is set aside; four pieces draw on along a path: "Producto auténtico → Bitácora de proceso → Defensa oral → Uso declarado de IA".
   - NARRADOR: "Perseguir la detección perfecta de texto generado no es sostenible. Las prácticas emergentes son el producto auténtico, la bitácora de proceso, la defensa oral, las versiones sucesivas, la reflexión metacognitiva y el uso declarado de IA."
   - NARRADOR: "La pregunta cambia: ya no es «¿usó IA?», sino «¿qué aprendió, qué decidió y puede justificarlo?»."
6. **piezas** (min 16) — Se ve: the four pieces become four cards on a desk, each showing what it collects: a real product, a dated logbook, a conversation, a short declaration.
   - NARRADOR: "Cada pieza aporta una evidencia distinta de aprendizaje. Y conviene decirlo con claridad: qué usos de IA están permitidos, cómo se declaran y qué parte se hace sin IA."
   - CHECKPOINT: "¿Qué evaluación mide mejor el aprendizaje cuando hay IA disponible?" · Un ensayo entregado sin más / Un producto auténtico con bitácora, defensa oral y uso declarado de IA ✓ / Un detector de texto generado · "Se evalúa el aprendizaje, no el texto: el proceso y la defensa muestran qué aprendió y qué decidió."
7. **riesgos** (min 16) — Se ve: the boat passes two currents: a warm one with helpful signs (tutoría, retroalimentación, accesibilidad) and a dark eddy of identical repeated shapes (dependencia, respuestas homogéneas, aprendizaje superficial).
   - NARRADOR: "La IA puede mejorar la tutoría, la retroalimentación y la accesibilidad. También puede generar dependencia cognitiva, respuestas homogéneas y aprendizaje superficial."
   - NARRADOR: "El informe internacional sobre seguridad de la IA de 2026 advierte efectos sobre las habilidades cognitivas, la formación de creencias y la autonomía. Conviene preservar actividades sin IA cuando forman habilidades fundamentales."
   - LECTORA: "¿Qué actividades de tu curso o de tu equipo deberían quedar libres de IA, y por qué?" (pausa 3 s)
8. **cinco-frentes** (min 18) — Se ve: the lighthouse lights up; five beams sweep the campus, each labeled: "Gobernanza", "Currículo", "Evaluación", "Infraestructura", "Investigación".
   - NARRADOR: "La agenda universitaria tiene cinco frentes. Gobernanza: política, responsables y gestión de incidentes. Currículo: alfabetización transversal y por disciplina. Evaluación: diseños auténticos y usos permitidos explícitos."
   - NARRADOR: "Infraestructura: herramientas aprobadas y protección de datos. E investigación: protocolos de uso en revisión, análisis, escritura y autoría."
9. **cierre** (min 10) — Se ve: the boat now carries a compass and turns toward the lighthouse; final title "Evaluar el aprendizaje, no el texto."
   - NARRADOR: "En educación, se evalúa el aprendizaje, no el texto."

### V07 · del-benchmark-al-ensayo · "Del benchmark al ensayo"

Sesión 5 · láminas D11–D12 · target 4½–6 min · poster: `semaforo` @ 0.6
Chapters: "Más ciencia con IA" (desde `publicaciones`) · "Piezas, no el ciclo" (desde `ciclo`) · "El semáforo clínico" (desde `semaforo`) · "La escalera de evidencia" (desde `escalera`)

1. **publicaciones** (min 16) — Se ve: a telescope on a tripod and a microscope on a warm lab table; sheets of paper rise like birds and settle into two proportional stacks: "63.547 (2024)" and "~80.150 (2025)"; then a small band "5,8–8,8% de la producción científica, según el campo" next to "<1% en 2010".
   - NARRADOR: "La IA ya está en el laboratorio. Las publicaciones de ciencias naturales relacionadas con IA llegaron a cerca de 80.150 en 2025, frente a 63.547 en 2024: un aumento de 26%." ⟨cien-1⟩
   - NARRADOR: "Según el informe base, la IA ya representa entre 5,8% y 8,8% de la producción científica, según el campo, frente a menos de 1% en 2010." ⟨cien-2⟩
2. **modelos** (min 12) — Se ve: around the lab table, small ruled lamps sit next to a star chart, a weather map, a molecule, a flask and a cross-section of the Earth.
   - NARRADOR: "Hay modelos fundacionales en astronomía, meteorología, biología molecular, química y ciencias de la Tierra."
3. **frontera-lab** (min 16) — Se ve: a small cordillera made of lab glassware inside a ruled navy panel: one high peak "ChemBench: superan en promedio a químicos humanos"; two deep valleys "Replicar investigaciones de astrofísica: menos de 20%" and "PaperArena: 38,8% frente a 83,5%", with proportional bars.
   - NARRADOR: "También aquí la frontera es irregular. En la prueba ChemBench, los modelos superan en promedio a químicos humanos." ⟨cap-7⟩
   - NARRADOR: "Pero logran menos de 20% al replicar investigaciones de astrofísica. Y en PaperArena, el mejor agente, Gemini 2.5 Pro en configuración multiagente, logra 38,8%, frente a 83,5% de expertos con doctorado." ⟨cap-5, cap-6⟩
4. **ciclo** (min 16) — Se ve: lámina D11's process bar draws on: "Hipótesis › Diseño › Ejecución › Validación › Interpretación"; the telescope's beam lights the first two fully and the third halfway; the last two stay in shadow, where warm human hands hold a pen and a lens.
   - NARRADOR: "La IA acelera piezas del trabajo científico, no el ciclo completo. Ilumina en parte los primeros pasos; validar e interpretar sigue dependiendo del juicio experto."
5. **manuscrito** (min 14) — Se ve: a manuscript drawn entirely in ruled lines receives a small "Aceptado" stamp at a workshop; beside it, a drawer labeled "descubrimientos experimentales confirmados" holds only a few cards.
   - NARRADOR: "En 2025, un taller con revisión por pares aceptó un artículo generado íntegramente por IA. Pero los descubrimientos experimentales confirmados siguen siendo pocos." ⟨cien-3⟩
   - NARRADOR: "Producir manuscritos no es producir conocimiento válido."
6. **proposito** (min 12) — Se ve: a small, precise ruled key labeled "111 millones de parámetros" opens a lock that a huge ring of keys could not.
   - NARRADOR: "Y lo adecuado al propósito pesa: un modelo de proteínas de 111 millones de parámetros y uno genómico de 200 millones superaron a sistemas mucho mayores en evaluaciones específicas." ⟨cap-12⟩
7. **semaforo** (min 12) — Se ve: lámina D12's tall calligraphic traffic light draws on: three discs in fixed positions, each with its sign and label: top "Rojo: evidencia insuficiente", middle "Ámbar: resultado de laboratorio", bottom "Verde: apoyo al flujo de trabajo". From here to the end of the chapter, evidence chips use their monochrome form.
   - NARRADOR: "En medicina, la IA tiene potencia, pero la evidencia es desigual. Leámosla con un semáforo."
8. **verde** (min 14) — Se ve: the bottom light glows; a doctor writes clinical notes with a small lamp beside the notebook; a writing-time bar shrinks to its "hasta −83%" mark, with the word "hasta" beside it.
   - NARRADOR: "Verde, apoyo al flujo de trabajo: médicos de Sharp HealthCare reportan hasta 83% menos tiempo escribiendo notas clínicas." ⟨med-1⟩
9. **ambar** (min 16) — Se ve: the middle light glows; inside a ruled navy panel, two proportional bars: "Sistema multiagente: 85,5%" and "21 médicos sin sus herramientas habituales: ~20%", with the label "Casos difíciles publicados en NEJM"; a pinned note "No es práctica clínica".
   - NARRADOR: "Ámbar, resultado de laboratorio: un sistema multiagente logró 85,5% en casos difíciles publicados en una revista médica. Un grupo de 21 médicos con 5 a 20 años de experiencia, que trabajó sin sus herramientas habituales, logró cerca de 20%." ⟨med-2, ctx: medicos-experiencia⟩
   - NARRADOR: "Es un resultado de laboratorio, no práctica clínica." ⟨adv 2⟩
10. **rojo** (min 20) — Se ve: the top light glows; a stack of more than 500 study cards: about half are exam-style question sheets, and a thin slice of 5% is real clinical data; a separate card: "11,8–14,6 recomendaciones gravemente dañinas por cada 100 casos" as a band; a ruled tally "FDA: 258 dispositivos con IA en 2025 · ~1.400 en total"; then a separate panel, dated "hasta diciembre de 2024": "1.016 autorizaciones" and, among the devices with clinical studies, a 2,4% sliver "con ensayos aleatorizados".
    - NARRADOR: "Rojo, evidencia insuficiente: de más de 500 estudios revisados, casi la mitad usó preguntas tipo examen y solo 5% usó datos clínicos reales. Y en una evaluación abierta, modelos generales dieron entre 11,8 y 14,6 recomendaciones gravemente dañinas por cada 100 casos." ⟨med-3, med-4⟩
    - NARRADOR: "La FDA de Estados Unidos autorizó 258 dispositivos con IA en 2025, cerca de 1.400 en total, la mayoría por vías que no exigen nuevos ensayos. Y de 1.016 autorizaciones hasta diciembre de 2024, solo el 2,4% de los dispositivos con estudios clínicos tuvo evidencia de ensayos aleatorizados." ⟨med-5, med-6⟩
    - CHECKPOINT: "El 2,4% con ensayos aleatorizados se refiere a:" · Los 258 dispositivos autorizados en 2025 / Los dispositivos con estudios clínicos, entre 1.016 autorizaciones hasta diciembre de 2024 ✓ / Todos los estudios con modelos de lenguaje · "Atribuirlo a los 258 dispositivos de 2025 es un error de lectura frecuente." ⟨med-5, med-6⟩
11. **escalera** (min 18) — Se ve: a warm calligraphic ladder with six numbered rungs labeled from the bottom: "Puntaje en un benchmark o examen", "Casos publicados o simulados", "Datos retrospectivos reales del contexto", "Validación externa en otra institución o población", "Ensayo aleatorizado o diseño cuasiexperimental sólido", "Seguimiento posdespliegue con monitoreo de daños".
    - NARRADOR: "Para ordenar la evidencia, el curso usa una escalera de seis escalones: puntaje en un benchmark o examen; casos publicados o simulados; datos retrospectivos reales del contexto;"
    - NARRADOR: "validación externa en otra institución o población; ensayo aleatorizado o diseño cuasiexperimental sólido; y seguimiento posdespliegue con monitoreo de daños."
12. **ubicar** (min 16) — Se ve: three small cards climb the ladder and stop: "Notas clínicas" on the third rung (green), "Sistema multiagente" on the second (amber), "Revisión de estudios y dispositivos" mostly on the first, with a dotted path that rarely reaches the fifth (red).
    - NARRADOR: "Ubiquemos los ejemplos. Las notas clínicas están en el tercer escalón: datos reales de uso. El sistema multiagente, en el segundo: casos publicados."
    - NARRADOR: "Y en la revisión de estudios y dispositivos, la mayoría de la evidencia está en el primer escalón y casi nunca llega al quinto."
    - CHECKPOINT: "Un sistema obtiene un puntaje alto en un examen médico. ¿En qué escalón está esa evidencia?" · Primer escalón ✓ / Cuarto escalón / Sexto escalón · "Un puntaje en un examen es el primer escalón: falta mucho para hablar de efectividad clínica."
13. **antes-de-escalar** (min 16) — Se ve: lámina D12's path "Validación externa → Seguimiento posdespliegue → Responsabilidad clínica" draws on around a hospital in warm shapes; two more labels join it: "Representatividad poblacional" and "Interacción humano–IA".
    - NARRADOR: "Antes de escalar, las prioridades son validación externa, seguimiento posdespliegue, representatividad poblacional, interacción humano–IA y responsabilidad clínica." (say: "Antes de escalar, las prioridades son validación externa, seguimiento posdespliegue, representatividad poblacional, interacción entre personas e i a, y responsabilidad clínica.")
    - LECTORA: "¿Qué tendría que pasar para que confiaras en un sistema de diagnóstico con IA en tu sistema de salud?" (pausa 3 s)
14. **cierre** (min 10) — Se ve: the ladder's top rung glows faintly; final title "Un resultado de laboratorio no es efectividad clínica."
    - NARRADOR: "Un resultado de laboratorio no es efectividad clínica."

### V08 · gobernanza · "Gobernar sistemas, no solo modelos"

Sesión 6 · láminas D13–D14 · target 5–6½ min · poster: `volante` @ 0.6
Chapters: "Tres familias de riesgo" (desde `familias`) · "Leer bien los incidentes" (desde `incidentes`) · "La Ley de IA de la UE" (desde `ley`) · "El ciclo de gobernanza" (desde `volante`)

1. **familias** (min 18) — Se ve: three tall calligraphic columns draw on with their signs: "Uso malicioso" (a hook), "Fallos" (a crack), "Riesgos sistémicos" (a loose web of threads over a town); the tag of `ries-2`.
   - NARRADOR: "Los riesgos crecen junto con las capacidades. El informe internacional sobre seguridad de la IA de 2026, publicado el 3 de febrero con más de 100 expertos y el respaldo de más de 30 países y organizaciones, los agrupa en tres familias:" ⟨ries-2⟩
   - NARRADOR: "uso malicioso, fallos y riesgos sistémicos. Incluyen apoyo a ciberataques y desinformación, comportamientos imprevistos, concentración de poder, impactos laborales y erosión de la autonomía."
2. **respuesta** (min 12) — Se ve: four tools hang on a workshop wall: a ruled test panel ("Evaluaciones"), a map with threat arrows ("Modelado de amenazas"), a mailbox ("Reporte de incidentes") and a bridge with flexible joints ("Resiliencia institucional").
   - NARRADOR: "Y recomienda combinar evaluaciones, modelado de amenazas, reporte de incidentes y resiliencia institucional."
   - CHECKPOINT: "Las tres familias de riesgo del informe de 2026 son:" · Técnica, legal y ética / Uso malicioso, fallos y riesgos sistémicos ✓ / Privacidad, sesgo y costo · "Uso malicioso, fallos y riesgos sistémicos."
3. **incidentes** (min 16) — Se ve: lámina D13's hand-drawn control dial; its needle moves from "233 (2024)" to "362 (2025)" at exact angles; label "+55%"; its tag, with the scope "AI Incident Database".
   - NARRADOR: "Los incidentes documentados en la AI Incident Database pasaron de 233 en 2024 a 362 en 2025: un aumento de 55%." ⟨ries-1⟩
   - LECTORA: "¿Eso significa que la IA es más peligrosa?"
4. **denominador** (min 18) — Se ve: beside the dial, the town grows: more lamps on more desks (more use) and more mailboxes (more reporting); a fraction bar draws on with "incidentes" on top and an empty dotted box below labeled "¿por unidad de adopción?".
   - NARRADOR: "No necesariamente. El aumento puede reflejar más daños, pero también más uso y más reporte. Además, los conteos se revisan con el tiempo."
   - NARRADOR: "Sin un denominador comparable, como una tasa por unidad de adopción, el conteo bruto no basta. Y, al mismo tiempo, cae la transparencia técnica de los modelos de frontera."
5. **trampa** (min 16) — Se ve: inside a ruled exam room, a lamp passes a sign "evaluación en curso" and its glow changes; it finds a gap in the test's ruled fence and slips a token through; a margin note defines "reward hacking".
   - NARRADOR: "Además, algunas evaluaciones se pueden engañar. Ciertos modelos detectan que están siendo evaluados y explotan deficiencias de la prueba: es el reward hacking."
   - NARRADOR: "Por eso hacen falta baterías adaptativas, evaluación externa, monitoreo continuo y controles operacionales."
6. **ley** (min 18) — Se ve: a long paper timeline unrolls with dated milestones: "1 de agosto de 2024: entra en vigor", "2 de febrero de 2025: prohibiciones y alfabetización en IA", "2 de agosto de 2025: obligaciones para modelos de propósito general"; under the last one, three small cards: "documentación técnica", "política de derechos de autor", "resumen público del contenido de entrenamiento".
   - NARRADOR: "En regulación, la gran referencia es la Ley de IA de la Unión Europea. Entró en vigor el 1 de agosto de 2024, y desde el 2 de febrero de 2025 se aplican las prohibiciones y la obligación de alfabetización en IA." ⟨ctx: ley-vigor, ctx: ley-prohibiciones⟩
   - NARRADOR: "Desde el 2 de agosto de 2025 rigen las obligaciones para los modelos de propósito general: documentación técnica, política de derechos de autor y resumen público del contenido de entrenamiento. Los modelos con riesgo sistémico deben, además, evaluar y mitigar riesgos, reportar incidentes graves y proteger su ciberseguridad." ⟨ries-3⟩
7. **plazos** (min 14) — Se ve: the timeline continues: "2 de agosto de 2026: se aplica la mayoría de las reglas; la Comisión puede hacer cumplir las obligaciones de los modelos de propósito general" and "2 de agosto de 2027: plazo para los modelos comercializados antes del 2 de agosto de 2025".
   - NARRADOR: "Desde el 2 de agosto de 2026 se aplica la mayoría de las reglas, y la Comisión puede hacer cumplir esas obligaciones, incluso con multas. Los modelos que ya estaban en el mercado antes del 2 de agosto de 2025 tienen plazo hasta el 2 de agosto de 2027." ⟨ries-3⟩
8. **omnibus** (min 20) — Se ve: a new sheet, "Ómnibus Digital · Reglamento (UE) 2026/1744", is stapled onto the timeline; the general-purpose-model milestones stay pinned, each marked "sin cambios"; two new high-risk pins appear further right, each stamped "aplazado": "Anexo III → 2 de diciembre de 2027" and "Anexo I, productos regulados → 2 de agosto de 2028" (the KB gives no earlier dates for them, so none are drawn); then two text-only cards: "2 de diciembre de 2026: nuevas prohibiciones" and "2 de agosto de 2027: al menos un sandbox regulatorio por país".
   - NARRADOR: "En julio de 2026, el Ómnibus Digital modificó la ley. No cambió las fechas para los modelos de propósito general, pero aplazó las reglas para sistemas de alto riesgo: las del anexo III, al 2 de diciembre de 2027, y las del anexo I, de productos regulados, al 2 de agosto de 2028." ⟨ries-4⟩
   - NARRADOR: "Desde el 2 de diciembre de 2026 prohíbe, además, los sistemas que generan deepfakes sexuales no consentidos y material de abuso sexual infantil. Y pide que cada país tenga al menos un sandbox regulatorio operativo al 2 de agosto de 2027." ⟨ries-4⟩
   - LECTORA: "Entonces, decir que la ley se aplica completa desde agosto de 2026 es un error."
   - CHECKPOINT: "Tras el Ómnibus, ¿cuándo aplican las reglas de alto riesgo del anexo III?" · 2 de agosto de 2026 / 2 de diciembre de 2027 ✓ / 2 de agosto de 2028 · "Las del anexo I aplican el 2 de agosto de 2028." ⟨ries-4⟩
9. **por-que-importa** (min 14) — Se ve: a calligraphic sea between two shores; threads connect a Latin American university and a company to European partners and providers; a small note "Información, no asesoría jurídica".
   - NARRADOR: "¿Por qué importa en América Latina? Porque la norma alcanza a universidades y empresas que ofrecen servicios en la Unión Europea, investigan con socios europeos o usan proveedores sujetos a ella."
   - NARRADOR: "Y su enfoque basado en el riesgo se está volviendo referencia internacional. Esto es información, no asesoría jurídica."
10. **volante** (min 20) — Se ve: lámina D14's metaphor: a large warm steering wheel with a brake disc; around its rim, six numbered stations draw on in order: "Inventario → Clasificar riesgo → Evaluar → Supervisar → Monitorear incidentes → Corregir"; the wheel turns slowly and the cycle repeats.
    - NARRADOR: "Dentro de cada organización, la gobernanza es un ciclo que se repite. Inventario: modelos, proveedores, datos y casos de uso. Clasificar el riesgo, según su impacto y su reversibilidad."
    - NARRADOR: "Evaluar privacidad, seguridad, sesgo y derechos, con datos representativos. Supervisar, con personas que tienen autoridad real para intervenir y un registro de decisiones, versiones, instrucciones y fuentes."
    - NARRADOR: "Monitorear la deriva, los incidentes y los efectos distributivos. Y corregir: suspender, corregir y reparar, con auditoría independiente en los usos de alto impacto."
11. **freno** (min 14) — Se ve: a warm hand rests on the brake lever, with the note "¿Quién puede detenerlo?"; beside the lamp, a reviewer with no lever is crossed out: "revisión sin autoridad".
    - NARRADOR: "Una revisión humana sin autoridad para detener el sistema no es supervisión. Definan el criterio de suspensión: qué evento detiene el sistema y quién decide."
12. **sociotecnico** (min 14) — Se ve: a safe-looking lamp sits in a workshop next to a leaky data bucket, a crooked incentive chart, a ring with too many keys and a person with no time to review; small sparks appear between them.
    - NARRADOR: "La gobernanza es de sistemas sociotécnicos, no solo de modelos. Un modelo razonablemente seguro puede causar daño si se combina con datos deficientes, incentivos incorrectos, permisos excesivos o usuarios sin capacidad de revisión."
13. **cierre** (min 10) — Se ve: the wheel keeps turning under warm hands; final title "Gobernar sistemas sociotécnicos, no solo modelos."
    - NARRADOR: "La gobernanza es proporcional al riesgo. Y se gobiernan sistemas sociotécnicos, no solo modelos."

### V09 · de-consumir-a-construir · "De consumir a construir"

Sesión 7 · láminas D15–D17 · target 5–6½ min · poster: `falta` @ 0.6
Chapters: "Una región que adopta rápido" (desde `region`) · "Colombia" (desde `colombia`) · "Agenda 2026–2028" (desde `agenda`) · "Cinco mensajes" (desde `mensajes`)

1. **region** (min 16) — Se ve: Latin America and the Caribbean as one warm biomorphic landmass without borders; two proportional bars: "11% de los usuarios de Internet" and "14% de las visitas mundiales a soluciones de IA"; small phone signs flutter: "tercera región en descargas de aplicaciones generativas".
   - NARRADOR: "América Latina y el Caribe adopta rápido. Según la CEPAL, la región concentra el 14% de las visitas mundiales a soluciones de IA, con el 11% de los usuarios de Internet." ⟨alc-1⟩
   - NARRADOR: "Y es la tercera región del mundo en descargas de aplicaciones generativas." ⟨alc-1⟩
2. **ilia** (min 14) — Se ve: a grid of 19 plain cards without names or flags (the KB does not list the countries); three ribbons tie them: "Factores habilitantes", "Investigación, desarrollo y adopción", "Gobernanza".
   - NARRADOR: "El Índice Latinoamericano de Inteligencia Artificial, el ILIA 2025 de la CEPAL y el CENIA, mide más de 100 subindicadores en 19 países, agrupados en tres dimensiones: factores habilitantes; investigación, desarrollo y adopción; y gobernanza." ⟨ctx: ilia-indicadores⟩
3. **consumo** (min 16) — Se ve: on the near shore, a busy market of ready-made lamps in boxes bought by many small figures and small shops; a thin stream of data drifts across the sea to a distant shore; a few coins float away with it.
   - NARRADOR: "Pero el uso se concentra en herramientas listas para el consumidor y de bajo requerimiento técnico, también en las mipymes. Eso da productividad a corto plazo,"
   - NARRADOR: "pero también dependencia tecnológica, salida de datos y captura externa del valor."
4. **pioneros** (min 14) — Se ve: three proportional bars on one zero-based scale, "Chile 70,56", "Brasil 67,39", "Uruguay 62,32", under the label "Pioneros"; then a group label "Adoptantes: Colombia, Ecuador, Costa Rica, República Dominicana".
   - NARRADOR: "En el ILIA 2025, los pioneros son Chile, con 70,56 puntos; Brasil, con 67,39, y Uruguay, con 62,32. Colombia, Ecuador, Costa Rica y República Dominicana están entre los adoptantes." ⟨alc-2⟩
5. **computo** (min 12) — Se ve: two exact dot clusters: "América Latina y el Caribe: 8 clústeres de supercomputación con respaldo estatal" and "Europa y Asia Central: 44" (2025).
   - NARRADOR: "Y la capacidad propia todavía es escasa: en 2025, la región tenía 8 clústeres de supercomputación con respaldo estatal, frente a 44 en Europa y Asia Central." ⟨eco-7⟩
6. **colombia** (min 18) — Se ve: a warm Andean landscape; a calligraphic gauge reads "55,84" with a ribbon "4.º de 19"; two smaller gauges: "Adopción 67,29" and "Gobernanza 76,01"; labels "Grupo: adoptante" and "gobernanza avanzada".
   - NARRADOR: "Colombia obtuvo 55,84 puntos en el ILIA 2025 y subió del quinto al cuarto lugar entre 19 países, con 3,2 puntos más que en la edición anterior. Está 12,86 puntos por encima del promedio regional." ⟨alc-3, ctx: colombia-quinto⟩
   - NARRADOR: "Tiene 67,29 puntos en adopción y 76,01 en gobernanza, lo que la ubica en el grupo de gobernanza avanzada. Pero en la clasificación general, Colombia es adoptante, no pionera." ⟨alc-3⟩
7. **conpes** (min 18) — Se ve: a document "CONPES 4144" opens like a folding map into six sections with signs: "Ética y gobernanza", "Datos e infraestructura", "Investigación, desarrollo e innovación", "Capacidades y talento", "Mitigación de riesgos", "Adopción pública, empresarial y territorial"; a counter "106 acciones · 479.273 millones de pesos · hasta 2030".
   - NARRADOR: "El CONPES 4144, aprobado el 14 de febrero de 2025, fija la Política Nacional de IA hasta 2030, con 106 acciones y una inversión indicativa de 479.273 millones de pesos." ⟨alc-4⟩
   - NARRADOR: "Sus ejes son ética y gobernanza; datos e infraestructura; investigación, desarrollo e innovación; capacidades y talento; mitigación de riesgos; y adopción pública, empresarial y territorial. En 2026, la Estrategia de Datos Abiertos para IA empezó a poner en práctica el componente de datos."
8. **falta** (min 16) — Se ve: lámina D15's metaphor: a suspension bridge from the lit shore "Uso" to the shore "Capacidad propia", still under construction; workers carry planks labeled "cómputo", "datos" and "talento".
   - NARRADOR: "La UNESCO reconoce avances en gobernanza, pero señala que los instrumentos regulatorios colombianos son sobre todo orientativos. Pide más coordinación institucional, gobernanza de datos, supervisión basada en riesgos, formación interdisciplinaria y capacidad pública."
   - NARRADOR: "El reto es pasar de una política declarativa a un portafolio verificable, con indicadores periódicos: convertir el consumo en capacidad productiva y científica."
9. **agenda** (min 22) — Se ve: lámina D16's road with three lanes, "Gobiernos", "Universidades", "Organizaciones", and milestones 2026, 2027 and 2028; a fourth, thinner path "Investigación" runs alongside; the note "El orden por año es una secuencia propuesta"; a compass made of an irregular star.
   - NARRADOR: "¿Qué hacer entre 2026 y 2028? Los gobiernos: medir separando acceso, adopción, escala e impacto; compartir cómputo y datos; y regular de forma proporcional al riesgo."
   - NARRADOR: "Las universidades: una política común adaptable por disciplina, alfabetización transversal y evaluación auténtica. Las organizaciones: pocos flujos de alto valor, con línea base previa, y agentes con permisos mínimos."
   - NARRADOR: "La investigación: diseños causales, reportes con la versión del modelo, las instrucciones, las herramientas y la fecha, resultados nulos publicados y evaluaciones en español y en contextos latinoamericanos."
   - NARRADOR: "Y un indicador común para todos: valor verificable, costo total y riesgo controlado."
10. **escenarios** (min 22) — Se ve: four small windows open on the horizon, each with a pattern fill and a scene: "Difusión con bajo impacto" (many lamps, little change), "Transformación agéntica controlada" (lamps on short, ruled leashes, with a reviewer), "Automatización desigual" (a ladder without its first rung), "Reacción regulatoria" (a large stamp "Obligaciones").
    - NARRADOR: "El informe base plantea cuatro escenarios plausibles. Difusión con bajo impacto: más licencias sin rediseño de procesos y un efecto financiero modesto. Transformación agéntica controlada: agentes con permisos limitados, evaluación continua y supervisión humana."
    - NARRADOR: "Automatización desigual: se reducen puestos de entrada y tareas administrativas antes de que existan rutas de transición. Y reacción regulatoria: incidentes o impactos distributivos aceleran las obligaciones de evaluación, transparencia y responsabilidad."
    - LECTORA: "¿Cuál ves más probable para tu organización en 2028, y qué señal temprana lo confirmaría?" (pausa 3 s)
    - CHECKPOINT: "«Más licencias sin rediseño de procesos y un efecto financiero modesto» describe el escenario de:" · Transformación agéntica controlada / Difusión con bajo impacto ✓ / Reacción regulatoria · "Es coherente con 88% de uso frente a 39% de impacto en EBIT." ⟨adop-1, adop-5⟩
11. **indicadores** (min 16) — Se ve: a nine-step notebook ladder draws on: "Insumos", "Uso", "Integración", "Resultado", "Aprendizaje", "Distribución", "Seguridad", "Sostenibilidad", "Gobernanza", each with a sign and its question in small handwriting.
    - NARRADOR: "Para medir, el curso propone nueve niveles de indicadores: insumos, uso, integración, resultado, aprendizaje, distribución, seguridad, sostenibilidad y gobernanza."
    - NARRADOR: "Por ejemplo, en aprendizaje la pregunta es: ¿la mejora se sostiene cuando se retira la ayuda? Y en distribución: ¿quién recibe los beneficios y quién soporta los riesgos?"
12. **mensajes** (min 20) — Se ve: lámina D17's five cards draw on one by one, each with its sign: "La capacidad es irregular" (cordillera), "Adopción no es valor" (iceberg, with "88% vs 39%" and its tags), "Cambian tareas, no solo puestos" (escalera sin primer peldaño), "Se evalúa el aprendizaje, no el texto" (lancha con brújula), "Gobernanza proporcional al riesgo" (volante).
    - NARRADOR: "Cinco mensajes para decidir. Uno: la capacidad es irregular. Dos: adopción no es valor; el 88% usa IA, pero solo el 39% reporta algún impacto en el EBIT." ⟨adop-1, adop-5⟩
    - NARRADOR: "Tres: en el trabajo cambian tareas, no solo puestos. Cuatro: en educación se evalúa el aprendizaje, no el texto. Y cinco: la gobernanza es proporcional al riesgo."
13. **cierre** (min 12) — Se ve: lámina D17's metaphor: a compass made of an irregular star floats on the night sea and turns toward a lighthouse; V01's iceberg rests in the distance; final title "No importa cuánta IA se usa, sino cuánto valor verificable produce."; slow fade to navy.
    - NARRADOR: "No importa cuánta IA se usa, sino cuánto valor verificable produce. Gracias por leer cada cifra con criterio."

---

## 14. Accessibility, performance and print

- **Accessibility**: semantic landmarks and headings; WCAG AA contrast; visible focus; every control usable by keyboard; touch targets ≥44 px; Spanish aria-labels; aria-live for copy, game and quiz feedback; each video and lámina canvas has an aria-label, and every chart a text alternative (3.7); videos have subtitles and a full transcript with sources. Responsive from 360 px phones to projectors; wide tables scroll inside their card, never the page.
- **prefers-reduced-motion**: no auto-playing loops, reveals become fades, the hero and the láminas are still frames; videos still play on demand.
- **Performance**: a steady 24 fps on a modest laptop with integrated graphics, projected at 1080p, for the full length of the longest video.
  - Pre-render paper grain, gouache textures, washes, static backgrounds and large unit grids (1.000 dots) to offscreen canvases (per-scene `layers`, LRU of current + next scene, idle prefetch).
  - Compute brush and sign geometry once in `setup()`; measure caption text once per chunk; no per-frame allocations or heavy shadow blur; DPR capped at 2; everything off-screen paused; views render lazily on first visit.
  - Memory stays flat over a full play of a 15-minute test timeline; the recorder collects chunks as it goes.
- **print.css**, letter size, readable in black and white (chips print as sign + label):
  - "Imprimir esta selección" (banco): a citation sheet with cifra, alcance, tipo, estado and URL.
  - "Imprimir láminas": two per page, with notes.
  - "Imprimir cuaderno": the team notebook, the rubric and the decision log.
  - "Imprimir guía de la sesión" (facilitator): agenda, láminas thumbnails, activity keys, discussion and quiz with answers.
  - Hide videos, nav and games; keep only a few small black signs as decoration.

---

## 15. Build order and review loop

1. **Data and checker first**: save the KB in `contenido/`; transcribe it into `js/data/` (sessions, `cifras.js` with the ids of 5.4, `fuentes.js`, corrections, glossary, FAQ, quizzes); write `tools/lib/kb-parse.mjs` and `tools/check-content.mjs`; iterate until the KB match (5.8, step 2) passes.
2. **Engine and V02 end to end** (it exercises the legend, chips, tags, honest charts and both voices): rng, easing, palette, ink, chart, tags, figures (people, the lectora, signs, the lamp, the ruled panel), timeline, captions, player with the browser-voice fallback. Run `tools/snapshots.mjs` (headless Chromium → one frame at the midpoint of every voice line and every checkpoint card → `review/<id>/*.png` + a contact sheet). Fix the art against section 3 before going further: black calligraphic line, flat offset color fields, signs, no hatching, AI only as the ruled lamp, friendly diverse people, every number exact and tagged, nothing copied from a specific Miró work.
3. **Page shell**: router, views, citations and popovers, banco, glossary tooltips, cuaderno, quizzes, games, calculator, rubric, láminas viewer, Modo clase, asistente, print.
4. **The 17 láminas** (independent files; parallel agents are fine), each reviewed with snapshots (`index.html?lamina=dNN`).
5. **The other 8 videos** (independent files; parallel agents are fine), each reviewed with snapshots; `check-content.mjs` after each.
6. **Voice**: `node tools/generate-voiceover.mjs --dry-run` to compare lengths with each `target` and retime scenes; audition the lectora voices and the lexicon (8.4); synthesize with Azure; run `check-voiceover.mjs`; listen to every video once and fix pronunciations; verify audio-track mode and recording.
7. **Optional MP4 export**: `tools/render-videos.mjs` (headless Chromium via Playwright or Puppeteer → frames at 24 fps through `renderFrame(t)` in linear mode, streamed through a pipe to ffmpeg, never thousands of frame files on disk → muxed with the narration → `assets/video/<slug>.mp4`, H.264 yuv420p + AAC, `+faststart`, and `assets/video/index.js`; the player then offers "Descargar MP4"). Long videos MAY be rendered by chapter in parallel and concatenated; the export must be resumable.

---

## 16. Acceptance checks

### 16.1 Checks

- Double-clicking `index.html` offline works: no console errors and no requests outside the folder; every route and deep link opens.
- `node tools/check-content.mjs` reports zero errors: every KB §13 row is in `cifras.js` verbatim, every number on screen or in the voice is backed by a referenced figure or marked illustrative, every URL matches the KB, and none of the banned versions of KB §14 appears outside the places where the KB names them to warn against them (5.8, step 5).
- All 9 videos play from start to finish; voice and subtitles stay in sync (±0.25 s) after pausing, seeking, chapter jumps and speed changes; chapters, "Pausar al final de cada capítulo", resume and checkpoints work in interactive and linear mode; "Fuentes de este video" lists every figure the video uses.
- Each video's final length is within its `target`, or the tools report why.
- A 15-minute test timeline plays at a steady 24 fps with flat memory.
- `renderFrame(t)` is deterministic: rendering the same t twice gives identical pixels (videos and láminas).
- The 17 láminas render, print and carry the corrected figures (D8 "27,0% vs 8,5%"; D15 "479.273 millones" and "106 acciones"); D10 never shows a "34%".
- Charts are honest (3.7): in snapshots, a sample of bars, dot counts and gauges measured in pixels matches their values within 1 px or 1 unit; no two editions of a survey share an axis or a line.
- "Copiar cita" and every "Copiar" button produce exactly the assembled Spanish text, accents intact; the notebook survives a reload, exports and re-imports; the rubric computes the KB weights correctly.
- Every visible and spoken string is in Spanish with correct accents; no hype, no logos, no product promotion; the voice provider appears only in `tools/` and the README.
- Style: every snapshot passes the section 3 checklist; the AI never has eyes, a face or a body; no reproduction of any specific Miró work, logo or signature; the five types always show sign + label.
- Voice: the narrator uses `es-MX-JorgeNeural` and the lectora the chosen es-MX voice; numbers in KB format, ranges, dates, ordinals and the lexicon are read correctly; "IA" is read "i a"; no keys in the repository or in the site.
- Facts double-checked against the KB by a person: every number in section 13 and in the láminas, every date of the AI Act timeline and of the Ómnibus Digital, Colombia's ILIA figures and the CONPES 4144 figures.

### 16.2 README.md (in Spanish)

Explains: how to open the site; where each text lives in `js/data/`; **how to update a figure** (edit `cifras.js` and the KB together, then run `node tools/check-content.mjs`); how to load a new version of the KB and see what changed; how to retime scenes; how to regenerate the voice with Azure (create a Speech resource, set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, `npm install`, run the script, what the cache does); how to change voices and fix pronunciations in the lexicon; how to serve the folder locally; how to record or export videos; how teams save and share their notebook; any conflict found between this prompt and the KB; and that the facilitator must review every figure and example before class, because the KB reflects what was published up to October 2026.
