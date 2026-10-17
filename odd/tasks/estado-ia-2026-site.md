# Feature: estado-ia-2026-site

Locator: `odd/tasks/estado-ia-2026-site.md` · Engram mirror: `odd/estado-ia-2026-site/tasks` (project `project`)
Branch: `feat/estado-ia-2026-site` · Spec: `odd/spec/prompt-estado-ia-2026.md` · KB: `contenido/base-estado-ia-2026.md` (v1.1)

## Objective

Build the complete offline static site for the course «Estado de la IA 2026» exactly as specified in
`odd/spec/prompt-estado-ia-2026.md` (the prompt, sections 0–16): one-file hash-routed site, 17 canvas
láminas, 9 narrated canvas videos, Miró-inspired procedural art, and dev-only Node tools (content
checker, voice-over with Azure AI Speech, snapshots, optional MP4 export).

## Problem and why

Participants and facilitators need a course companion where every figure is traceable to the KB (v1.1,
17 de octubre de 2026), corrected versions only, with the course message carried by the art: people warm
and free, AI small, cool and ruled.

## Scope and constraints

- Plain HTML/CSS/vanilla JS, classic `defer` scripts sharing `window.EIA`, works from `file://`, no
  runtime network, no image/SVG/icon-font files (canvas only), deterministic frames.
- All visible/spoken copy in Spanish; all figures via `js/data/cifras.js` (`EIA.cifra(id)`).
- Shared contracts fixed in T01: `js/core/namespace.js` (`EIA.cifra`, `EIA.util.citation`, `EIA.makeEnv`),
  `index.html` script order, `js/main.js` boot dispatch, CSS owner sections in `css/components.css`.
- Commits: Conventional Commits, no AI attribution (user rule). Push/PR are the user's decision.
- RDD (receipt-driven development): `off` (decided by global) → no native review ceremony; ordinary checks.
- Parallel writers run in isolated git worktrees (prompt §15 allows parallel agents); parent merges.

## Delivery strategy

`exception-ok`: greenfield repository (no commits on `main`), one feature branch with work-unit commits.
Forecast ≈ 30–40k authored lines, far above the 400-line heuristic; the correct solution naturally
exceeds it. Slicing into PRs is left to the user (each task commit is a candidate slice).

## Tasks

| ID | Task | Route (trigger evidence) | Status |
|---|---|---|---|
| T01 | Scaffold: branch, KB copy, tree, `index.html`, namespace contract, stubs, fonts, tools config, this doc | inline (mechanical, already understood) | in progress |
| T02 | Data layer + content checker: `kb-parse`, `load-data`, all `js/data/*` except `videos.js`, `check-content.mjs` | delegated writer (2+ non-trivial files, KB reading prepares the write) | pending |
| T03 | Video scripts as data: `js/data/videos.js` (9 videos, prompt §13) | delegated writer (large transcription) | pending |
| T04 | Drawing engine: rng, easing, palette + tokens.css, ink, chart, tags, figures, lamina layout, API doc | delegated writer (many non-trivial files) | pending |
| T05 | Video runtime: timeline, captions, narrator, player, recorder, render mode, CDP browser lib, snapshots | delegated writer (many non-trivial files) | pending |
| T06 | V02 end to end + art review against prompt §3 | delegated writer | pending |
| T07 | Page shell: router, markup, views, nav, hero, chips, citations/popovers, banco, glossary, FAQ, references, asistente, footer, CSS | delegated writer | pending |
| T08 | Interactions: quizzes, games, calculator, embudo, cuaderno, rubric, Ley de IA timeline, indicadores, timer, láminas viewer, Modo clase, print | delegated writer | pending |
| T09 | Láminas D01–D17 | delegated writers (parallel, worktrees) | pending |
| T10 | Videos V01, V03–V09 | delegated writers (parallel, worktrees) | pending |
| T11 | Voice-over tooling (normalizer, SSML, Azure adapter, generator with `--dry-run`, check-voiceover) | delegated writer | pending |
| T12 | Optional MP4 export (`render-videos.mjs`) | delegated writer | pending |
| T13 | README (Spanish), acceptance checks (prompt §16), final fixes | delegated verifier + writer | pending |

## Acceptance criteria

Prompt §16.1 in full. Key gates: offline open with no console errors; `node tools/check-content.mjs`
zero errors; 9 videos play in sync; 17 láminas render/print with corrected figures; deterministic
`renderFrame(t)`; honest charts; Spanish everywhere; AI never anthropomorphized.

## Checks per task

- T02: `node tools/check-content.mjs` (KB match section passes).
- T03: data loads in vm; ids/structure validated by the checker.
- T04/T05/T06/T09/T10: headless Chromium snapshots reviewed against prompt §3; determinism (same t twice → same pixels); no console errors.
- T07/T08: every route renders with no console errors (headless Chromium console capture).
- T11: `node tools/generate-voiceover.mjs --dry-run` report per video.

## Progress and evidence

- T01: branch `feat/estado-ia-2026-site` created; KB copied unchanged (sha256 identical); fonts Noto Sans /
  Noto Serif Display subset to WOFF2 and embedded in `css/fonts.css` (OFL 1.1).

## Next step

Commit T01, then launch wave 1 in parallel worktrees: T02, T03, T04, T05.
