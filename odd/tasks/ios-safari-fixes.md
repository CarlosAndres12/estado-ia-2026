# iOS Safari fixes

## Objective
Make the site work properly on iPhone (iOS Safari / WebKit), after a user report that it "does not work well on iPhone".

## Problem
A static audit (2026-10-20) found WebKit-specific failures:
- Video narration: `js/engine/narrator.js` preloads the MP3 outside a user gesture and waits for `loadedmetadata`; iOS never loads it, so Play stalls up to 8 s and then falls back to `speechSynthesis`, which iOS also silences because `speak()` runs from rAF, not a tap.
- Fullscreen button (`js/engine/player.js`) does nothing on iPhone: no Fullscreen API for non-video elements.
- `100vh` panels (`css/layout.css:188,228`, `css/components.css:2210`) overflow under the Safari toolbar; the Modo clase video width collapses in landscape.
- Unbounded glyph canvas cache (`js/engine/ink.js` counterCache) grows canvas memory toward the iOS total-canvas limit.

## Why
iPhone users get videos with long delays and no sound, a dead button and clipped panels.

## Scope / constraints
- Plain ES5 IIFE style (`window.EIA`), no dependencies. Desktop behavior must not change.
- No audio playback/STT checks; one headless browser at a time through the safe wrapper.
- Deploy = fast-forward `main` to the feature branch and push (GitHub Pages). Authorized by the user on 2026-10-20.

## Tasks
- [x] I01 Narration unlock inside the Play tap (prime audio element + speechSynthesis in the gesture; no stall waiting for metadata). Route: delegated (multi-file writer). Commit 34015a0. Test: tools/test/narrator-unlock.test.mjs (RED 6 fail → GREEN).
- [x] I02 Fullscreen fallback: pseudo-fullscreen (fixed, full viewport) when the Fullscreen API is unavailable. Route: delegated (same writer). Commit 76a621b. Test: tools/test/ios-layout.test.mjs (static).
- [x] I03 Replace `100vh` with `dvh` keeping a `vh` fallback; guard the Modo clase video width against negative values. Route: delegated (same writer). Commit 89bfb62. Also paired `.hero__art` (layout.css). Test: tools/test/ios-layout.test.mjs (static).
- [x] I04 Bound the ink glyph cache. Route: delegated (same writer). Commit 69d1864. Counter cache LRU(240); evicted counter masks and shared layers set to 0x0 in a microtask. Test: tools/test/ink-cache.test.mjs.
- [ ] I05 Verify (tests, check-content, WebKit iPhone emulation smoke), commit, deploy.

## Acceptance criteria
- Play starts immediately on WebKit iPhone emulation without the 8 s stall; no console errors.
- Fullscreen button enlarges the player on iPhone emulation.
- Existing tests and `check-content` pass.

## Progress
- 2026-10-20 feature document created.
- 2026-10-20 I01–I04 done by one delegated writer. Checks: `node --test --test-concurrency=1 test/` 241/241 pass; `node tools/check-content.mjs` 0 errors, 0 warnings. No browser run (left to I05).
- Behavior note (I01): before any tap, missing metadata no longer falls back to the browser voice after 8 s; the track stays the candidate and the first tap gives it 4 s (UNLOCK_WAIT) to load. On desktop metadata normally arrives before the tap, so nothing changes; on a stalled desktop network the browser-voice note appears only after a tap.
