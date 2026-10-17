# Brief for a video worker (T10: one video per worker)

You build ONE narrated canvas video (`vNN`, given in your launch prompt) end to end, to the same standard
as the reference video V02 (`js/videos/v02-que-mide.js`). Read this whole brief first.

## Safety (binding — the machine hard-reset twice under heavy parallel Chromium load)
- Launch Chromium ONLY through `tools/dev/chromium-safe.sh` (the snapshot tool already does); one browser
  at a time; always with a `timeout`. Never run `--perf --full`. No audio playback or speech tests.
- Another worker may be rendering at the same time: no loops over all videos; render only your video.
- Commit after each meaningful step so a crash loses little.

## Where you work
- Isolated git worktree; its root is your current working directory (`git rev-parse --show-toplevel`; use
  relative paths). Never write under `/home/carlos/ssd/clase_guberney/project`.
- Read first: `odd/tasks/estado-ia-2026-site.md`, `odd/spec/contracts.md`, `odd/spec/engine-api.md`
  (binding drawing API, incl. the T06 additions), `odd/spec/data-model.md`, `js/core/namespace.js`, the
  header comments of `js/engine/player.js` and `js/engine/timeline.js`, your video's entry in
  `js/data/videos.js`, and `js/videos/v02-que-mide.js` (reference implementation: copy its patterns).
- Spec `odd/spec/prompt-estado-ia-2026.md`: lines 22–217 (§1 non-negotiables, §2 tone and sensitive topics,
  §3 visual identity, §4 legends), 421–481 (§6 video system), the §12.2 entry of the láminas your video
  shares (its metaphors must match), and YOUR script in §13 (search `### VNN`).
- KB `contenido/base-estado-ia-2026.md`: the session section of your video and §13 rows of its figures.

## Deliverables
1. `js/videos/<file>.js` (your file already exists as a stub; keep its name): every scene of your script,
   registered as `EIA.videos.vNN = { setup(env), layers?, scenes: { [sceneId](ctx, s, env) } }`.
   - One idea per scene; one visual beat per voice line keyed to `s.at(i)` / `s.line`, and in-line beats to
     `s.cue(i, words, 'chunk')` (never hard-coded seconds). Calm ambient life; outlines draw on, flat fields
     bloom after them.
   - Every number: exact honest mark (prompt §3.7: shared zero-based scale, unit grids, exact dot counts,
     "≈"/"más de"/"menos de"/"hasta" caps, bands, intervals with zero), grows from zero and lands before or
     while its line says it, holds ≥ 2 s; its `tags.sourceTag` from `env.cifra(id)` stays while the number is
     on screen. Unknown values are never drawn. Editions/sources never share an axis or a line.
   - Benchmarks and lab results inside ruled navy panels; real work warm and free (§3.5, §6.9). AI only as
     the small ruled lamp (never eyes, face, body). People friendly and diverse; the lectora where she speaks.
   - Static grounds/textures in `layers` (built once with `env.canvas`); pure deterministic draw functions.
2. On-screen copy only from data. If a scene needs a label the script does not quote (gauge names,
   interval values, indicator questions, axis labels…), add it to YOUR video's `rotulos` in
   `js/data/videos.js`, verbatim from the KB or the script, with `cifras` ids on any rótulo holding a number.
   Edit only your video's object in that file. Never change voice lines.
3. Review loop: `node tools/snapshots.mjs --only vNN` writes frames at every line midpoint and checkpoint
   card plus `review/vNN/hoja-de-contactos.png`. LOOK at the contact sheet and the individual frames with
   the Read tool and iterate until every frame passes: black calligraphic lines that swell and taper; flat
   saturated fields offset from outlines; cream notebook page with grain; floating signs; one clear subject
   and generous space; every number exact, legible and tagged; nothing overlapping illegibly; subtitles
   legible; no reproduction of a specific Miró work.

## Art guidance from V02 (worked well)
- Fade hero numbers in WHOLE (a cached image), never glyph by glyph (it shows false intermediate numbers),
  and without colored counters or stars. Land each figure by its chunk with `cue(…,'chunk')`, fade its
  label in after it lands, hold to the end of the scene.
- One `sourceTag` per figure at about `scale: 1.08`, tied to the mark's value edge or the label corner; its
  thread never crosses text. `sourceTag({ chip: false })` when a question must not give the answer away.
- Benchmarks: `chart.bar` with `style: 'ruled'` inside a navy `fig.panel`, one shared `chart.scale`;
  ranges with `chart.band`; durations with `stopwatch({ elapsed })`.
- Meaning zones (the five types compared or sorted): chip top-left with `pill: true`; floating signs `mono`.
- Floating signs drift slowly via `rng.noise1(s.t * 0.2)`.
- Reusable helpers local to v02 worth copying: `cuesOf`, `landWindow`, `beat`, `hero({ fade })`,
  `floaters`, `pathAt` / `samplePath` / `alongPath`, `quad`, `insidePoly`, `groundLayer`.
- Leave the player's overlay areas free: subtitles below y ≈ 570; chapter title top-left for 2 s; the
  glossary note at x 894–1254, y 214–410 during the line that first uses a glossary term; warning stamps
  top-right (or declare `drawsWarnings: { sceneId: true }` when the scene presses stamps itself).
- Pitfalls: a cue at 0 shows things before the line starts (guard it like v02's `beat`); `ink.card` peek
  shapes in a fan cover neighbours (draw blobs yourself, behind the cards); the comet sign's head is
  off-centre; fading `ink.letter` with `globalAlpha` shows dark outlines (render to a layer, fade that);
  `snapshots.mjs --out` resolves paths under the repo root.

## Do not touch
- `js/engine/*` (several workers run in parallel): if you need a reusable helper, write it locally in your
  video file; report engine bugs or wishes in your final report instead of editing the engine.
- Other videos' entries in `js/data/videos.js`, any other file outside the surfaces below.

## Allowed edit surfaces
js/videos/<your file>.js
js/data/videos.js

## Verification (report `<command>: <observed result>`)
- `node tools/check-content.mjs` → 0 errors;
- `node --test --test-concurrency=1 tools/test/` → all pass;
- `node tools/snapshots.mjs --only vNN` → frames + contact sheet, 0 console errors; estimated length vs `target`;
- `node tools/snapshots.mjs --only vNN --determinism` → identical pixels.

## Finish
Code/comments English; all visible copy Spanish from data. Commit in the worktree (Conventional Commits,
English, NO `Co-Authored-By` or AI attribution; read `/home/carlos/.agents/skills/work-unit-commits/SKILL.md`
first). Return: branch, commits, files with line counts, verification results, the frames you reviewed and
what you changed after looking, engine bugs/wishes, and anything incomplete. Then close with a
`## Key Learnings` block of 1–5 numbered items, each a standalone factual sentence of at least 20 characters
and at least 4 words.
