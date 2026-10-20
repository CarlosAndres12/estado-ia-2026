# Feature: sesión 0 · línea del tiempo interactiva con audio

## Objective
Add a "Sesión 0" to the course site: an interactive timeline of AI 1950–2026 built from
`base_linea_del_tiempo/linea_tiempo_evolucion_IA_1950_2026.csv`, where every milestone is clickable
and has its own narrated audio.

## Problem / why
The course starts at Sesión 1 with the 2026 state of AI; students lack the historical arc that explains
how we got here. The CSV already holds 24 verified milestones with sources.

## Scope
- Data: `js/data/linea-tiempo.js` (24 milestones copied literally from the CSV: fecha, hito, actores,
  lugar, avance, importancia, fuente URL, nota de verificación) + a session-0 entry wired into the
  course map/router (`#s0`, deep link `#s0/<id>`).
- UI: horizontal, keyboard-accessible timeline (canvas or DOM, following site conventions); click/Enter on a
  milestone opens its detail card and plays its narration; prev/next, play-all; captions; works at 360 px.
- Audio: one Edge TTS clip per milestone (+ intro) via the existing voice-over tooling, under `assets/audio/`,
  registered in the audio manifest so it plays offline from `file://`.
- Tests + `check-content` / `check-routes` coverage; README route list.

## Constraints
- Spanish UI/narration (course language), neutral professional register; code/comments in English.
- Text only from the CSV (no invented facts or figures).
- One capped Chromium at a time (crash history). No audio playback checks.
- No AI attribution in commits; Conventional Commits.

## Tasks
- [x] T01 Data + route + interactive timeline UI + tests (route: delegated writer, 3+ non-trivial files) — commit 39a5fb5
- [x] T02 Narration audio per milestone + manifest + player wiring + checks (route: same delegated writer) — commit 1bd8d1a

## Acceptance
- `#s0` renders 24 clickable milestones in chronological order; each opens detail + plays its clip.
- Existing tests pass, new tests added; `check-content` 0 errors; `check-routes` 0 problems (incl. 360 px).

## Progress
- Created 2026-10-20. Delivery strategy: ask-on-risk. Forecast ~600 authored lines (+ generated audio).
- 2026-10-20 T01 done (route: delegated writer; trigger: 3+ non-trivial files). `js/data/linea-tiempo.js` (24 CSV rows
  verbatim + narration composed from each row; era titles from the poster `base_linea_del_tiempo/Untitled.jpg`),
  `js/ui/linea-tiempo.js` (track with roving tabindex, detail card, prev/next, play-all, captions-only clock),
  `#s0` in router ORDER between `#evidencia` and `#s1`, nav menu entry, `#mapa` prelude card, search entries,
  `tools/lib/csv.mjs`, check-content step 7 (CSV vs data field by field, ids, invented numbers),
  check-routes `s0` + `s0/alphago` + an `--interact` step, README routes. Commit 39a5fb5.
- 2026-10-20 T02 done (route: same delegated writer). `tools/generate-timeline-voiceover.mjs` reuses the video
  pipeline (es-MX-JorgeNeural, cache, alignment, loudnorm); 25 clips (7:00.9 total, 6.6 MB) in `assets/audio/s0/`
  plus `assets/audio/s0/manifest.js` (`EIA.timelineAudio`, own file because generate-voiceover rewrites
  `assets/audio/manifest.js` with video ids only). Commit 1bd8d1a.

## Verification evidence (2026-10-20)
- `node --test tools/test`: 225 pass, 0 fail (new: linea-tiempo.test.mjs 12, timeline-voiceover.test.mjs 5; router +2).
- `node tools/check-content.mjs`: 0 errors, 0 warnings, step 7 Timeline ok.
- `node tools/check-routes.mjs --width 360`: 32 routes and deep links, 0 problems.
- `node tools/check-routes.mjs --interact --width 360`: 9 checks, 0 problems (s0 step runs captions-only, no audio).
- Snapshots `review/s0/s0_alphago.png` (1280) and `review/s0/s0_alphago-w360.png` inspected: milestone centered and
  selected, eras labeled, detail card readable, no horizontal page scroll at 360 px.
- Test-first note: router expectations were edited right after the router change (RED not observed separately);
  data/check tests were written against the new step. No audio playback checks by design.

## Open
- The CSV source `base_linea_del_tiempo/` is untracked and outside the writer's edit surface; check-content step 7
  and `tools/test/linea-tiempo.test.mjs` read it, so it must be committed for a clean checkout to pass.
- Engram mirror `odd/sesion-0-linea-tiempo/tasks`: left to the parent orchestrator.

## Next step
Commit `base_linea_del_tiempo/` (user decision), listen to a few clips (human check), then push/PR per policy.

- 2026-10-20 CSV + poster committed (64ad9eb); main fast-forwarded and GitHub Pages rebuilt (built 64ad9eb, s0 audio manifest returns 200).
