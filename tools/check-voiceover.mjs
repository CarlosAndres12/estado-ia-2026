#!/usr/bin/env node
/* tools/check-voiceover.mjs — the listening sheet of the narration (prompt §8.3).
 *
 * Prints a plain-text sheet for the person who listens to every video once: the final check is always
 * by ear. This tool never plays, records or transcribes audio (no speech-to-text). For every voice
 * line it shows the time in the video (from assets/audio/manifest.js when the narration has been
 * generated, else estimated at 2.3 words/s), the voice, the text as displayed and the text as spoken,
 * and what to listen for: figures said in words (a figure read as a date, a decimal read as
 * thousands), lexicon names and acronyms (an English name mangled), abbreviations, explicit `say`
 * overrides and normalizer warnings. Fix what sounds wrong in tools/voice.config.json "lexicon",
 * in lib/normalize-es.mjs, or with a `say` on the line, then run generate-voiceover.mjs again.
 *
 *   node tools/check-voiceover.mjs                every video
 *   node tools/check-voiceover.mjs --only v04     some videos (comma-separated)
 *   node tools/check-voiceover.mjs --flagged      only the lines with something to listen for
 *   node tools/check-voiceover.mjs > escucha.txt  a file to print
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadConfig, planVideo, estimateLine, DRY_RUN_WPS } from './generate-voiceover.mjs';
import { loadVoiceData, createLayout } from './lib/voice-layout.mjs';
import { formatTime } from './lib/voice-assets.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '..');

const KIND_NOTES = {
  number: 'figure', year: 'year', date: 'date', ordinal: 'ordinal', fraction: 'fraction', roman: 'roman numeral',
  lexicon: 'lexicon', abbreviation: 'abbreviation', acronym: 'acronym, read by the voice as written'
};

/** What to listen for in one planned line. */
export function listenFor(line) {
  const items = [];
  const seen = new Set();
  const add = (text) => { if (!seen.has(text)) { seen.add(text); items.push(text); } };
  if (line.say) add(`explicit say (spoken instead of the text): «${line.spoken}»`);
  for (const t of line.terms) {
    add(t.kind === 'acronym' ? `${t.display} (${KIND_NOTES.acronym})` : `${t.display} → ${t.spoken} (${KIND_NOTES[t.kind] || t.kind})`);
  }
  for (const w of line.warnings) add(`warning ${w.code}: ${w.message}`);
  return items;
}

/** The sheet of one video: plan = planVideo(...), starts = Map 'scene:index' -> seconds. */
export function videoSheet({ plan, starts, source, flagged = false }) {
  const v = plan.video;
  const out = [`== ${v.id} · ${v.slug} · ${v.title} ==`, source, ''];
  let shown = 0;
  for (const line of plan.lines) {
    const items = listenFor(line);
    if (flagged && !items.length) continue;
    shown++;
    out.push(`[ ] ${formatTime(starts.get(line.key) || 0)}  ${line.key} · ${line.role}`);
    out.push(`    shows: ${line.text}`);
    out.push(`    says:  ${line.spoken}`);
    if (items.length) {
      out.push('    listen for:');
      for (const item of items) out.push(`      - ${item}`);
    }
    out.push('');
  }
  if (!shown) out.push('(nothing to listen for in particular)', '');
  return { text: out.join('\n'), shown, flaggedLines: plan.lines.filter((l) => listenFor(l).length).length };
}

/** Line start times from the manifest when it matches the script, else estimated. */
function startsFor(plan, entry, layout) {
  const keys = plan.lines.map((l) => l.key);
  if (entry && Array.isArray(entry.lines) && entry.lines.length === keys.length &&
      entry.lines.every((l, i) => `${l.scene}:${l.index}` === keys[i])) {
    return {
      starts: new Map(entry.lines.map((l) => [`${l.scene}:${l.index}`, l.start])),
      source: `audio: ${entry.file} (${formatTime(entry.duration)}) — times from assets/audio/manifest.js`
    };
  }
  const lineDurations = Object.fromEntries(plan.lines.map((l) => [l.key, estimateLine(l)]));
  const byLine = new Map(plan.lines.map((l) => [l.source, l.chunks]));
  const tl = layout.build(plan.video, { lineDurations, wps: DRY_RUN_WPS, chunk: (text, line) => byLine.get(line) || layout.chunk(text) });
  const note = entry ? 'the manifest entry does not match the script (regenerate the narration)' : 'no narration generated yet';
  return {
    starts: new Map(tl.lines.map((L) => [`${L.sceneId}:${L.index}`, L.start])),
    source: `audio: ${note} — times estimated at ${DRY_RUN_WPS} words/s`
  };
}

export async function listeningSheet({ root = DEFAULT_ROOT, only = null, flagged = false, config } = {}) {
  const EIA = await loadVoiceData({ root, manifest: true });
  const layout = createLayout(EIA);
  const cfg = config || loadConfig();
  const manifest = EIA.audioManifest || {};
  let videos = Array.from(EIA.data.videos);
  if (only && only.length) {
    const unknown = only.filter((id) => !videos.some((v) => v.id === id));
    if (unknown.length) throw new Error(`unknown video ${unknown.join(', ')}`);
    videos = videos.filter((v) => only.includes(v.id));
  }
  const parts = [];
  let lines = 0;
  let marked = 0;
  for (const video of videos) {
    const plan = planVideo(video, { layout, config: cfg });
    const { starts, source } = startsFor(plan, manifest[video.id], layout);
    const sheet = videoSheet({ plan, starts, source, flagged });
    parts.push(sheet.text);
    lines += plan.lines.length;
    marked += sheet.flaggedLines;
  }
  parts.push(`${videos.length} video${videos.length === 1 ? '' : 's'} · ${lines} lines · ${marked} with something to listen for. ` +
    'Listen to every video once; this sheet only says where to pay attention.');
  return parts.join('\n');
}

function parseArgs(argv) {
  const opts = { only: null, flagged: false, root: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--flagged') opts.flagged = true;
    else if (arg === '--only') opts.only = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith('--only=')) opts.only = arg.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--root') opts.root = argv[++i];
    else throw new Error(`unknown option ${arg} (use --only <ids>, --flagged)`);
  }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  listeningSheet(parseArgs(process.argv.slice(2)))
    .then((text) => process.stdout.write(text + '\n'))
    .catch((err) => {
      console.error('check-voiceover: ' + (err && err.message ? err.message : err));
      process.exitCode = 1;
    });
}
