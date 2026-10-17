# Brief for a lámina worker (T09: a group of láminas per worker)

You draw the illustrations of a group of láminas (given in your launch prompt) for the course deck: each
lámina is the KB's "Guion de diapositivas" slide redrawn in the site's visual language. Read this whole
brief first.

## Safety (binding — the machine hard-reset twice under heavy parallel Chromium load)
- Launch Chromium ONLY through `tools/dev/chromium-safe.sh` (`tools/snapshots.mjs` already does); one
  browser at a time; always with a `timeout`. No audio tests. Another worker may be rendering meanwhile.
- Commit after each lámina so a crash loses little.

## Where you work
- Isolated git worktree; its root is your current working directory (`git rev-parse --show-toplevel`; use
  relative paths). Never write under `/home/carlos/ssd/clase_guberney/project`.
- Read first: `odd/tasks/estado-ia-2026-site.md`, `odd/spec/contracts.md` (deck shape), `odd/spec/engine-api.md`
  (binding drawing API; the `EIA.engine.lamina` section is your contract), `odd/spec/data-model.md`, the
  deck entries of your láminas in `js/data/deck.js`, and `js/engine/lamina.js` (layout, zones, draw order).
- Spec `odd/spec/prompt-estado-ia-2026.md`: lines 22–217 (§1 non-negotiables, §2 tone and sensitive topics,
  §3 visual identity, §4 legends) and 764–795 (§12: the layout engine rules and the illustration of each of
  your láminas in §12.2 — binding).
- KB `contenido/base-estado-ia-2026.md`: the "Guion de diapositivas" of your láminas and the §13 rows of
  their figures. For reference only (do not copy code): `js/videos/v02-que-mide.js` shows how scenes use
  the engine.

## Deliverables
1. `js/laminas/dNN.js` for each of your láminas (stubs exist; keep the names):
   `EIA.laminas.dNN = { setup(env), draw(ctx, s, env), drawAfter?, layout? }`, `s = { t, still, loop,
   lamina, zones, state }`. The engine draws background, diagram (from `lamina.diagrama`), big figures,
   titular, session sign, "Idea central" and pie; you draw the metaphor illustration of §12.2 in
   `s.zones.ilustracion` (fit it with `env.fig.inRect`) and anything else §12.2 asks for (move or hide zones
   with `layout`, e.g. `{ drawDiagram: false }` when you draw the diagram yourself).
   - Static by default; an optional calm 8 s ambient loop (`s.loop`, stars, waves, drifting signs) that does
     nothing when `s.still` is true (print, thumbnails, reduced motion).
   - Every number on the lámina: exact honest mark (prompt §3.7) and its `tags.sourceTag` from
     `env.cifra(id)`; unknown values never drawn; editions never on one axis.
   - AI only as the small ruled lamp (the KB's "robot aprendiz" and "pelotón de ciclistas" are lamps); people
     warm, friendly and diverse; benchmarks in ruled navy panels; no logos, flags or names on pennants.
   - Pure deterministic draw functions; geometry from `setup` with the seeded RNG.
2. Copy only from data: every string you draw comes from the lámina's deck entry (`titular`, `cifras`,
   `diagrama`, `ideaCentral`, `pie`, `rotulos`). If §12.2 needs a label that is missing, add it to that
   lámina's `rotulos` in `js/data/deck.js` — verbatim from the KB guion (or the corrected version the prompt
   names: D8 "27,0% vs 8,5%", D15 "479.273 millones" and "106 acciones"; D10 never shows a "34%") — with
   `cifras` ids on any rótulo holding a number. Edit only your láminas' entries.
3. Review loop: `node tools/snapshots.mjs --laminas` renders all 17 stills to `review/laminas/`; LOOK at your
   láminas with the Read tool (also an ambient frame: `index.html?lamina=dNN&t=4` through
   `tools/dev/chromium-safe.sh --headless=new --no-sandbox --disable-gpu --hide-scrollbars --window-size=1280,720
   --virtual-time-budget=6000 --screenshot=<scratchpad>/x.png "file://$PWD/index.html?lamina=dNN&t=4"`) and
   iterate until each passes: readable from the back of a room; one clear metaphor; black calligraphic lines,
   flat offset color fields, cream page; every number exact and tagged; nothing overlapping; no reproduction
   of a specific Miró work, logo or signature.

## Do not touch
`js/engine/*` (several workers run in parallel — write local helpers in your lámina file and report engine
bugs or wishes instead), other láminas' files or deck entries, any file outside the surfaces below.

## Allowed edit surfaces
js/laminas/dNN.js (only your láminas)
js/data/deck.js (only your láminas' entries)

## Verification (report `<command>: <observed result>`)
- `node tools/check-content.mjs` → 0 errors;
- `node --test --test-concurrency=1 tools/test/` → all pass;
- `node tools/snapshots.mjs --laminas` → 17 stills, 0 console errors;
- determinism: render one of your láminas twice at the same `t` (e.g. through `index.html?lamina=dNN&t=3`
  and `window.renderFrame(3)` twice in one page via `tools/lib/browser.mjs`) → identical pixels.

## Finish
Code/comments English; all visible copy Spanish from data. Commit in the worktree (Conventional Commits,
English, NO `Co-Authored-By` or AI attribution; read `/home/carlos/.agents/skills/work-unit-commits/SKILL.md`
first). Return: branch, commits, files with line counts, verification results, the PNGs you reviewed and what
you changed after looking, engine bugs/wishes, and anything incomplete. Then close with a `## Key Learnings`
block of 1–5 numbered items, each a standalone factual sentence of at least 20 characters and at least 4 words.
