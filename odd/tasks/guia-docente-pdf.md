# Feature: guía docente en PDF

## Objective
A printable PDF guide for the teacher (facilitator) of «Estado de la IA 2026», generated from the site's own data so every figure stays traceable to the KB, and published with the site.

## Scope
- New dev tool `tools/build-teacher-guide.mjs`: builds an HTML guide from `js/data/*` (via `tools/lib/load-data.mjs`) and prints it to PDF with the capped headless Chromium (`tools/lib/browser.mjs`, one worker).
- Output `docs/guia-docente.pdf` (committed) and a link to it from the site.
- Spanish content (course language), neutral professional register.

## Constraints
- No new figures: numbers only via `cifras.js` / existing data text; content checker stays 0 errors.
- One Chromium at a time, capped (crash history). No audio checks.
- No AI attribution in commits.

## Tasks
- [x] G01 Build tool + PDF + site link + README note (delegated writer: 3+ non-trivial files)
- [ ] G02 Verify (tests, check-content, route check, visual readback of PDF pages), publish to GitHub Pages

## Acceptance
- PDF opens, has cover with authors, course overview, how to use the site, per-session guide (objectives, preparation, agenda, facilitator notes, quiz key, resources), evaluation/rubric, project, glossary/sources pointers.
- 200+ tests pass, check-content 0 errors, routes 0 problems.

## Progress
- Facilitator name filled: commit 68eb37f.
- G01 done (route: delegated writer). `tools/build-teacher-guide.mjs` (pure `buildGuide(EIA)` + one capped Chromium `Page.printToPDF`), `docs/guia-docente.{html,pdf}` (letter, 52 pages, ~1.0 MB, page numbers in footer, PDF outline), link «Descargar guía docente (PDF)» in footer and «Cómo usar este sitio» (`ui.page.footer.guia`/`guiaHref`), README §10 note, `tools/test/teacher-guide.test.mjs` (7 tests).
  - Evidence: `node --test tools/test` 207/207 pass; `check-content` 0 errors 0 warnings; `check-routes --width 360` 30 routes, 0 problems; visual readback of pages 1, 2, 9, 11, 23, 36, 41, 50, 52 (cover, TOC, sessions, annex) OK.
  - Gaps: no per-session "preparation" field in the data (built from the session's videos, láminas, activities and notebook sheets); session `contenido` (lecture body) not reproduced, it stays on the site; tool activities without a KB block (s2-pasos, s3-embudo, s6-calendario, s7-plan…) show title plus their data (fases, hitos, indicadores, escenarios) and a pointer to the site tool.

