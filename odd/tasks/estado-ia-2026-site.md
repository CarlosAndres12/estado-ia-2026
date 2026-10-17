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
- User decisions (2026-10-17): narration with **Edge TTS** (free; `es-MX-JorgeNeural` narrador, `es-MX-DaliaNeural`
  lectora) instead of Azure; the user is away — continue autonomously without blocking questions.
- Parallel writers run in isolated git worktrees (prompt §15 allows parallel agents); parent merges.

## Delivery strategy

`exception-ok`: greenfield repository (no commits on `main`), one feature branch with work-unit commits.
Forecast ≈ 30–40k authored lines, far above the 400-line heuristic; the correct solution naturally
exceeds it. Slicing into PRs is left to the user (each task commit is a candidate slice).

## Tasks

| ID | Task | Route (trigger evidence) | Status |
|---|---|---|---|
| T01 | Scaffold: branch, KB copy, tree, `index.html`, namespace contract, stubs, fonts, tools config, this doc | inline (mechanical, already understood) | done (2869e53, 958ffd8) |
| T02 | Data layer + content checker: `kb-parse`, `load-data`, all `js/data/*` except `videos.js`, `check-content.mjs` | delegated writer (2+ non-trivial files, KB reading prepares the write) | done (cherry-picked 414d2f2, 57b861d, 1e20899) |
| T03 | Video scripts as data: `js/data/videos.js` (9 videos, prompt §13) | delegated writer (large transcription) | done (84e78b8) |
| T04 | Drawing engine: rng, easing, palette + tokens.css, ink, chart, tags, figures, lamina layout, API doc | delegated writer (many non-trivial files) | done (cherry-picked 0149682..a019a98 → 73f2246) |
| T05 | Video runtime: timeline, captions, narrator, player, recorder, render mode, CDP browser lib, snapshots | delegated writer (many non-trivial files) | done (fast-forward to 58a2c61) |
| T06 | V02 end to end + art review against prompt §3 | delegated writer | done (cherry-picked 4832670..9f98293) |
| T07 | Page shell: router, markup, views, nav, hero, chips, citations/popovers, banco, glossary, FAQ, references, asistente, footer, CSS | delegated writer | done (cherry-picked b22f7c2..4c08e68) |
| T08 | Interactions: quizzes, games, calculator, embudo, cuaderno, rubric, Ley de IA timeline, indicadores, timer, láminas viewer, Modo clase, print | delegated writer | done (cherry-picked 540ff7d..cb96f5a) |
| T09 | Láminas D01–D17 | delegated writers (parallel, worktrees) | done (D01–D17 merged) |
| T10 | Videos V01, V03–V09 | delegated writers (parallel, worktrees) | running (one video per worker, brief in odd/spec/video-worker-brief.md) |
| T11 | Voice-over tooling with **Edge TTS** (user decision; Azure kept optional): normalizer, SSML, Edge bridge + adapter, alignment, generator, listening sheet | delegated writer (many non-trivial files) | done (merged; fix b91d3af) |
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

- T01 follow-up: `odd/spec/contracts.md` pins shared shapes/names for parallel work; citation omits the
  estado sentence for ctx-* figures (958ffd8).
- Wave 1 launched in worktrees `.claude/worktrees/agent-*` (branches `worktree-agent-*`): T02, T03, T04, T05.
  Coordination: `EIA.data.course.ui.player` copy is owned by T05 (merge appends it to T02's course.js).

- T03 done (84e78b8): `js/data/videos.js` 9 videos / 108 scenes / 197 lines / 16 checkpoints / 334 rótulos,
  verbatim from prompt §13; `node --test tools/test/videos-data.test.mjs` 12/12 pass (parent re-run);
  headless index.html 0 console lines; assess risk medium (executable data) → writer self-verification +
  parent spot check. Open items for T06/T10: scenes need extra rótulos the script never quotes (gauge and
  ladder names, interval values, indicator questions, KB §3.2 limits…) — add them verbatim with ids.
  Hints are stored without "Pista:" (UI adds "Casi. Pista: "). v08 `omnibus` lectora line names the
  banned AI Act claim only to call it an error (checker must allow it).

- Crash (2026-10-17): machine went down while T02/T04/T05/T11 ran (user: an audio check crashed it).
  New user rule: never run audio checks (check-voiceover, playback, STT) — only generate audio. Resumed
  T02, T04, T05 from their worktrees with low-load limits; T11 held until they land.

- T02 done: data files (70 cifras incl. 9 ctx, 63 fuentes, 17 láminas, 7 sesiones), kb-parse, load-data,
  check-content; on main tree with real videos.js: `node tools/check-content.mjs` → 0 errors, 0 warnings
  (453 numbers checked); `node --test tools/test/` → 31 pass. Extra fields documented in
  odd/spec/data-model.md (diagrama.tipo `barras`; tool copy lives in actividades.js entries).
  Open: quiz hints are written by the worker → facilitator review; cuaderno cost amount/unit labels → T08.

- Crash diagnosis: both resets (07:17, 07:25) ended the journal abruptly (no OOM/panic/MCE), thermal zone
  72–73 °C at the next boot vs 50 °C idle, second crash seconds after two headless Chromium launches →
  caused by the parallel workers' load. Mitigation: one worker at a time; every headless Chromium via
  `tools/dev/chromium-safe.sh` (systemd-run CPUQuota=300%, MemoryMax=6G, nice 15); no real-time perf runs.

- User applied global caps (2026-10-17 07:4x): `user.slice` and `system.slice` AllowedCPUs=0-9, power
  profile `power-saver` (platform `quiet`); verified (cpuset 0-9, Tctl 43.6 °C). Concurrency policy: at most
  two workers, only one of them rendering with Chromium. Running: T04 (rendering), T11 (no Chromium, no
  audio checks). T05 waits for T04.

- T04 done: engine merged (rng, easing, palette, ink, chart, tags, figures, lamina; tokens.css; engine-api.md;
  gallery + self-test). Parent re-run: `gallery.html?test=1` → SUMMARY 50 passed, 0 failed; `git fsck
  --connectivity-only` clean, 0 empty objects. Real `index.html?lamina=d07` renders the frame (titular,
  proportional funnel with tags, idea central) with no console errors; illustration waits for T09.
  Known art weaknesses (worker): lettering is jittered Noto Serif Display, strokes smoother than real brush,
  sparse places, stylized landmass. Scene objects without helpers (compose from primitives): service-window
  counter, threat map, V07 star/weather/molecule charts, ruled manuscript.
- T05 resumed after merge of the feature branch into its worktree (TEMP fallbacks → real engine).

- T05 done (fast-forward to 58a2c61): timeline, captions (pure, 50 chars × 2 lines chunking; manifest chunks
  used as-is), narrator, player (+ render mode), recorder, browser.mjs (CDP, defaults to chromium-safe.sh),
  snapshots.mjs, dev fixtures. Parent re-run: `node --test tools/test/` 65/65; checker 0 errors;
  `snapshots.mjs --only v02 --determinism` identical, no console errors. Worker: perf 60 s sample of a
  15:19 video → 24 fps, p95 2.0 ms, heap 1.9→2.3 MB. Untested: speechSynthesis, audio-track playback,
  MediaRecorder, fullscreen. Contract additions: `s.state`, `s.layers`, `env.scale`, `env.canvas(w,h)`.
- T06 launched (V02 + art review gate) alongside T11.

- T11 done (merged with --no-ff): Edge TTS pipeline — normalizer (0 warnings on 197 lines), Edge bridge,
  word-boundary alignment, optional Azure adapter (only tested with a fake SDK), generator, text listening
  sheet. Parent re-run: 131/131 tests, checker 0 errors, dry run uses js/engine captions + timeline.
  Worker's real Edge trial (v01, scratch only): 16 clips, 160.16 s MP3 = manifest. Parent fix b91d3af:
  trim trailing engine silence to 0.15 s after the last word (Edge pads ~0.87 s) and dry-run wps from
  config (Edge 2.9) → estimate 39:07 total; 132/132 tests. Final narration generated at the end (after T10).
- T07 (page shell) launched alongside T06.

- T06 done (cherry-picked): V02 all 11 scenes + art gate; engine fixes (closed outlines, warning-stamp
  desks, stopwatch sectors, labelTag, sourceTag chip:false, checkpoint card tags), contract additions
  `drawsWarnings` and `s.cue(i, words, 'chunk'|'word')`. Parent re-run: 132/132 tests, checker 0 errors,
  `snapshots.mjs --only v02` 25 frames 0 console errors, est. 3:24 (target 3:00–4:30); parent looked at the
  contact sheet: coherent notebook style, ruled navy benchmark panel, chips sign+label, legible cards.
- Concurrency policy update: global caps make peak load bounded; at most TWO workers at a time, each
  browser through chromium-safe.sh. Video workers never edit the engine (local helpers; report wishes).

- T07 done (cherry-picked 11 commits): router, markup, all views, chips/popovers/Copiar cita, banco,
  glossary, FAQ, references, asistente, page CSS, `tools/check-routes.mjs`. Parent re-run: 175/175
  tests, checker 0 errors, check-routes 30 routes + 30 in-app hash changes 0 console errors; parent
  looked at #inicio (hero iceberg + tag) and #s3 (tesis with tagged figure popovers). Header lettering
  writes itself on in 1.1 s (headless screenshots catch it mid-way). Parent fix d36b912: glossary
  tooltip excluded from verb uses of «escala».
- Concurrency: temps 39.8 °C at load ~1.3 under the caps → up to three workers (one non-heavy). Running:
  V01 (T10), T08 (interactions), D01–D06 (T09). Re-check temperature at each notification.

- V01 done (cherry-picked 72c2fb7, 1708522): 8 scenes, est. 2:47 (target 2:30–3:30), determinism ok,
  checker 0 errors, 175/175 tests; 46 °C after merge. Engine wishes collected for a later engine-polish
  pass (after parallel video/lámina work): `fig.iceberg` waterline depth/no-line + mass shape access;
  `fig.marNocturno` star positions + vertical offset; `chart.unitGrid` approximate cap; `ink.letter`
  cached-layer fade; `fig.road` station size; snapshots sample mid-chunk instead of line midpoint.
- V03 launched.

- D01–D06 done (cherry-picked 0e44cd7..ba98033): checker 0 errors, 17 stills 0 console errors,
  determinism ok (worker). Parent looked at the six together: coherent; fixed in the engine
  (lamina.bigFigure) dark colour fields and coloured counters covering big digits → light field
  peeking low-left, plain digits; gallery self-test 50/50 after the fix. More engine wishes: `barras`
  diagram drawer; `fig.agentLoop` label size/inset; tag thread colour on navy panels; lamp loop phase;
  doc: person `hand` is {left,right}, ink caches by position; hero iceberg vs `fig.iceberg` unify.
- D07–D12 launched.

- T08 done (cherry-picked 14 commits): quiz, games/tools S1–S7, cuaderno, rubric, proyecto, láminas
  viewer, Modo clase (+ facilitator window), print. Parent re-run: 187/187 tests, checker 0 errors,
  `check-routes.mjs --interact` 8 checks 0 problems (cuaderno PDF 5 pages). Parent fix: S5 Verde sign
  name → `estrella-visto`; data-model.md documents tool copy. Untested: facilitator-window sync with two
  windows, timer chime (no-audio rule), real-mouse drag, video playback in Modo clase.

- D07–D12 done (cherry-picked 85cf5da..f2cad9f): checker 0 errors, 17 stills 0 console errors,
  determinism ok (worker); parent looked at the six together: coherent, no "34%" on D10, D12 lab result
  in navy panel, D8 corrected 27,0% vs 8,5%. More engine wishes: flujo/pasos/causal drawers ignore
  `titulo`/`luz`/`enlace`; `sourceTag` label wrap; big-figure thread crosses its label; long scopes;
  sharp-outline option; `fig.boat` motor detached.
- D13–D17 launched (running: V03, V04, D13–D17).

- V03 done (cherry-picked d210da2..bdfa75c): 15 scenes, est. 6:22 (target 5:00–7:00), determinism ok,
  checker 0 errors. Parent fix (test-first): video glossary notes now honour `excluir` (RED 1 fail →
  GREEN 188/188). More engine wishes: cordillera deep valleys look rectangular; default fillJitter/
  fillScale grow with size; agentLoop `lamp:false` + labelSize; ruledLadder crack size + scale rungs.

- D13–D17 done (cherry-picked 5102152..9217daf): checker 0 errors, 17 stills 0 console errors,
  determinism ok (worker). Parent: D15 «14% vs 11%» got the verbatim thesis label (the guion has none;
  the checker only accepts session/guion text); engine lamina.bigFigure sets an overflowing label in two
  smaller lines so its tag stays in its row (changed D09, D11, D15 only); gallery self-test 50/50.
  Kept: D13 shows the ries-1 tag twice (big figure + dial), both honest. More engine wishes:
  `chart.parseDate` misreads «Ago 2027: … agosto de 2025»; `chart.gauge` sub-range colour; columnas/
  tarjetas/linea drawers ignore cifras/signo/hitos; sourceTag maxWidth × scale; suspensionBridge label
  width; faro one-sided beam; thread crosses big-figure label.

## Next step

Merge wave 1 branches as they finish (verify each: checker, tests, headless console), then wave 2:
T06 (V02 + art review), T07 (page shell), T11 (voice tools); then T08, T09, T10.
