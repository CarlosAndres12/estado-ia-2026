// Structure and reference checks for js/data/videos.js (the 9 video scripts, prompt §5.5 / §13).
// Run from the repository root:  node --test tools/test/videos-data.test.mjs
//
// The data file is evaluated the way the site and the tools load it: a classic script in a Node vm
// sandbox where window === globalThis, after js/core/namespace.js. Every number a video shows or says
// is compared with the KB §13 row its ids point to (contenido/base-estado-ia-2026.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');

function loadVideos() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const rel of ['js/core/namespace.js', 'js/data/videos.js']) {
    vm.runInContext(read(rel), sandbox, { filename: rel });
  }
  return sandbox.EIA.data.videos;
}

// KB §13: rows in order under each heading -> ids 'adop-1'…'alc-4' (prompt §5.4). "Ídem" alcances are
// resolved to the nearest earlier row of the same table with the same first source.
const PREFIX = {
  'Adopción y valor': 'adop',
  'Capacidad técnica': 'cap',
  'Economía e infraestructura': 'eco',
  'Productividad': 'prod',
  'Trabajo': 'trab',
  'Educación': 'edu',
  'Ciencia': 'cien',
  'Medicina': 'med',
  'Riesgo y regulación': 'ries',
  'América Latina y Colombia': 'alc'
};

function loadKbRows() {
  const kb = read('contenido/base-estado-ia-2026.md');
  const start = kb.indexOf('\n## 13. Banco de cifras');
  const end = kb.indexOf('\n## 14.', start);
  assert.ok(start >= 0 && end > start, 'KB §13 not found');
  const rows = {};
  const groups = {};
  let prefix = null;
  for (const line of kb.slice(start, end).split('\n')) {
    const h = line.match(/^### (.+)$/);
    if (h) {
      prefix = PREFIX[h[1].trim()];
      assert.ok(prefix, `Unknown KB §13 heading: ${h[1]}`);
      groups[prefix] = [];
      continue;
    }
    if (!prefix || !line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells[0] === 'Cifra' || /^-+$/.test(cells[0])) continue;
    const row = { id: `${prefix}-${groups[prefix].length + 1}`, cifra: cells[0], alcance: cells[1], fuente: cells[3] };
    groups[prefix].push(row);
    rows[row.id] = row;
  }
  const firstSource = (f) => (f.match(/^\[([^\]]+)\]/) || [])[1];
  for (const list of Object.values(groups)) {
    list.forEach((row, i) => {
      row.alcanceTexto = row.alcance;
      if (!/^Ídem/.test(row.alcance)) return;
      for (let j = i - 1; j >= 0; j--) {
        if (firstSource(list[j].fuente) === firstSource(row.fuente) && !/^Ídem/.test(list[j].alcance)) {
          row.alcanceTexto = list[j].alcance;
          break;
        }
      }
    });
  }
  const counts = Object.fromEntries(Object.entries(groups).map(([p, list]) => [p, list.length]));
  return { rows, counts };
}

// Numbers as whole tokens, the way the KB writes them ("1.993", "66,3", "2026/1744" -> "2026", "1744").
// A digit glued to a letter ("D7") is not a number. Plain years 2010–2030 are exempt (prompt §5.8).
const NUM = /(?<![\p{L}\d])\d+(?:[.,]\d+)*/gu;
const isYear = (t) => /^\d{4}$/.test(t) && Number(t) >= 2010 && Number(t) <= 2030;
const numbers = (s) => (String(s).match(NUM) || []).filter((t) => !isYear(t));
const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const idList = (x) => Array.isArray(x) && x.length > 0 && x.every((id) => typeof id === 'string');

// Context figures the video scripts use (odd/spec/contracts.md §2): js/data/cifras.js must define them.
const CTX_SLUGS = ['modelos-convergen', 'ley-vigor', 'ley-prohibiciones', 'ilia-indicadores', 'colombia-quinto', 'medicos-experiencia'];

const videos = loadVideos();
const kb = loadKbRows();

// Every item that carries text and figure ids: { where, texts, cifras, ilustrativo }.
function items(v) {
  const out = [];
  for (const s of v.scenes) {
    for (const [k, r] of Object.entries(s.rotulos)) {
      out.push({ where: `${v.id}/${s.id}.rotulos.${k}`, scene: s.id, texts: [r.text], cifras: r.cifras || [], ilustrativo: !!r.ilustrativo });
    }
    s.lines.forEach((l, i) => {
      out.push({ where: `${v.id}/${s.id}.lines[${i}]`, scene: s.id, texts: [l.text], cifras: l.cifras || [], ilustrativo: !!l.ilustrativo });
    });
  }
  v.checkpoints.forEach((c, i) => {
    out.push({
      where: `${v.id}/checkpoints[${i}] (after ${c.after})`,
      scene: c.after,
      texts: [c.question, c.options[c.answer], c.explain],
      cifras: c.cifras || [],
      ilustrativo: !!c.ilustrativo
    });
  });
  return out;
}

test('nine videos in course order with the §5.5 fields', () => {
  assert.ok(Array.isArray(videos), 'EIA.data.videos is an array');
  assert.equal(videos.length, 9);
  const slugs = new Set();
  videos.forEach((v, i) => {
    assert.equal(v.id, 'v' + String(i + 1).padStart(2, '0'));
    assert.match(v.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!slugs.has(v.slug), `duplicate slug ${v.slug}`);
    slugs.add(v.slug);
    assert.ok(typeof v.title === 'string' && v.title.trim(), `${v.id}: title`);
    assert.ok(Number.isInteger(v.sesion) && v.sesion >= 1 && v.sesion <= 7, `${v.id}: sesion`);
    assert.ok(Array.isArray(v.laminas) && v.laminas.every((d) => /^d(0[1-9]|1[0-7])$/.test(d)), `${v.id}: laminas`);
    assert.match(v.rate, /^[+-]?\d+%$/);
    assert.ok(Array.isArray(v.target) && v.target.length === 2 && v.target[0] > 0 && v.target[0] <= v.target[1], `${v.id}: target`);
    assert.ok(v.poster && typeof v.poster.scene === 'string' && v.poster.p >= 0 && v.poster.p <= 1, `${v.id}: poster`);
    assert.ok(Array.isArray(v.chapters) && v.chapters.length > 0, `${v.id}: chapters`);
    assert.ok(Array.isArray(v.scenes) && v.scenes.length > 0, `${v.id}: scenes`);
    assert.ok(Array.isArray(v.checkpoints), `${v.id}: checkpoints`);
  });
});

test('scene ids are unique and every reference names an existing scene', () => {
  for (const v of videos) {
    const order = v.scenes.map((s) => s.id);
    assert.equal(new Set(order).size, order.length, `${v.id}: duplicate scene id`);
    const pos = (id) => order.indexOf(id);
    assert.ok(pos(v.poster.scene) >= 0, `${v.id}: poster.scene ${v.poster.scene}`);
    let last = -1;
    v.chapters.forEach((c, i) => {
      assert.ok(typeof c.title === 'string' && c.title.trim(), `${v.id}: chapter ${i} title`);
      assert.ok(pos(c.from) >= 0, `${v.id}: chapter "${c.title}" starts at unknown scene ${c.from}`);
      assert.ok(pos(c.from) > last, `${v.id}: chapters out of scene order`);
      last = pos(c.from);
    });
    assert.equal(v.chapters[0].from, order[0], `${v.id}: the first chapter starts at the first scene`);
    for (const c of v.checkpoints) assert.ok(pos(c.after) >= 0, `${v.id}: checkpoint after unknown scene ${c.after}`);
  }
});

test('scenes, rótulos and lines are well formed', () => {
  for (const v of videos) {
    for (const s of v.scenes) {
      const where = `${v.id}/${s.id}`;
      assert.match(s.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, where);
      assert.ok(Number.isInteger(s.min) && s.min > 0, `${where}: min`);
      assert.ok(typeof s.seVe === 'string' && s.seVe.trim() && !/\n/.test(s.seVe), `${where}: seVe is one non-empty line`);
      assert.ok(!/Mir[oó]/.test(s.seVe), `${where}: no mention of the artist on screen (prompt §3.12)`);
      assert.ok(s.rotulos && typeof s.rotulos === 'object' && !Array.isArray(s.rotulos), `${where}: rotulos`);
      for (const [k, r] of Object.entries(s.rotulos)) {
        assert.match(k, /^[a-z][a-zA-Z0-9]*$/, `${where}: rótulo key ${k}`);
        assert.ok(typeof r.text === 'string' && r.text.trim(), `${where}.${k}: text`);
        assert.deepEqual(Object.keys(r).filter((x) => !['text', 'cifras', 'ilustrativo'].includes(x)), [], `${where}.${k}: fields`);
        if ('cifras' in r) assert.ok(idList(r.cifras), `${where}.${k}: cifras is a non-empty list of ids`);
        if ('ilustrativo' in r) assert.equal(r.ilustrativo, true, `${where}.${k}: ilustrativo`);
      }
      assert.ok(Array.isArray(s.lines) && s.lines.length > 0, `${where}: lines`);
      s.lines.forEach((l, i) => {
        const at = `${where}.lines[${i}]`;
        assert.ok(l.voice === 'narrador' || l.voice === 'lectora', `${at}: voice`);
        assert.ok(typeof l.text === 'string' && l.text.trim(), `${at}: text`);
        if ('say' in l) assert.ok(typeof l.say === 'string' && l.say.trim(), `${at}: say`);
        if ('pause' in l) assert.ok(typeof l.pause === 'number' && l.pause > 0, `${at}: pause`);
        if ('rate' in l) assert.match(l.rate, /^[+-]?\d+%$/, `${at}: rate`);
        if ('ilustrativo' in l) assert.equal(l.ilustrativo, true, `${at}: ilustrativo`);
        if ('cifras' in l) assert.ok(idList(l.cifras), `${at}: cifras is a non-empty list of ids`);
        if ('advertencia' in l) {
          const list = Array.isArray(l.advertencia) ? l.advertencia : [l.advertencia];
          assert.ok(list.length >= 1 && list.every((n) => [1, 2, 3, 4].includes(n)), `${at}: advertencia`);
          if (Array.isArray(l.advertencia)) assert.ok(list.length > 1, `${at}: a single warning is a number`);
        }
        const known = ['voice', 'text', 'say', 'pause', 'rate', 'cifras', 'ilustrativo', 'advertencia'];
        assert.deepEqual(Object.keys(l).filter((x) => !known.includes(x)), [], `${at}: fields`);
      });
    }
  }
});

test('checkpoints have 2–4 options, a valid answer and a hint without numbers', () => {
  for (const v of videos) {
    v.checkpoints.forEach((c, i) => {
      const at = `${v.id}/checkpoints[${i}]`;
      for (const f of ['question', 'explain', 'hint']) assert.ok(typeof c[f] === 'string' && c[f].trim(), `${at}: ${f}`);
      assert.ok(Array.isArray(c.options) && c.options.length >= 2 && c.options.length <= 4, `${at}: options`);
      assert.ok(c.options.every((o) => typeof o === 'string' && o.trim()), `${at}: empty option`);
      assert.ok(Number.isInteger(c.answer) && c.answer >= 0 && c.answer < c.options.length, `${at}: answer`);
      assert.ok(!/\d/.test(c.hint), `${at}: the hint contains a number`);
      assert.ok(!fold(c.hint).includes(fold(c.options[c.answer])), `${at}: the hint names the answer`);
      if ('cifras' in c) assert.ok(idList(c.cifras), `${at}: cifras is a non-empty list of ids`);
      if ('ilustrativo' in c) assert.equal(c.ilustrativo, true, `${at}: ilustrativo`);
    });
  }
});

test('figure ids exist in KB §13 or are declared context figures', (t) => {
  const used = new Set();
  for (const v of videos) {
    for (const it of items(v)) {
      for (const id of it.cifras) {
        const m = id.match(/^(adop|cap|eco|prod|trab|edu|cien|med|ries|alc)-(\d+)$/);
        if (m) {
          assert.ok(Number(m[2]) >= 1 && Number(m[2]) <= kb.counts[m[1]], `${it.where}: ${id} is not a KB §13 row`);
        } else {
          assert.match(id, /^ctx-[a-z0-9-]+$/, `${it.where}: malformed id ${id}`);
          assert.ok(CTX_SLUGS.includes(id.slice(4)), `${it.where}: ${id} is not a context figure of contracts.md §2`);
          used.add(id);
        }
      }
      assert.equal(new Set(it.cifras).size, it.cifras.length, `${it.where}: repeated id`);
    }
  }
  t.diagnostic(`context figures used: ${[...used].join(', ')}`);
});

test('a rótulo only carries ids said by a line of its scene', () => {
  for (const v of videos) {
    for (const s of v.scenes) {
      const said = new Set(s.lines.flatMap((l) => l.cifras || []));
      for (const [k, r] of Object.entries(s.rotulos)) {
        for (const id of r.cifras || []) assert.ok(said.has(id), `${v.id}/${s.id}.${k}: ${id} is not said in the scene`);
      }
    }
  }
});

test('every number is backed by figure ids or marked illustrative', () => {
  for (const v of videos) {
    for (const it of items(v)) {
      const found = it.texts.flatMap(numbers);
      if (found.length) assert.ok(it.cifras.length || it.ilustrativo, `${it.where}: ${found.join(', ')} without cifras`);
    }
  }
});

test('numbers match the KB §13 rows they cite', (t) => {
  const mismatches = [];
  const viaContext = [];
  for (const v of videos) {
    for (const it of items(v)) {
      if (it.ilustrativo) continue;
      const rows = it.cifras.filter((id) => kb.rows[id]).map((id) => kb.rows[id]);
      if (!rows.length) continue;
      const allowed = new Set(rows.flatMap((r) => [r.cifra, r.alcanceTexto].flatMap((s) => s.match(NUM) || [])));
      const missing = it.texts.flatMap(numbers).filter((n) => !allowed.has(n));
      if (!missing.length) continue;
      const entry = `${it.where} [${it.cifras.join(', ')}]: ${[...new Set(missing)].join(', ')}`;
      if (it.cifras.some((id) => id.startsWith('ctx-'))) viaContext.push(entry);
      else mismatches.push(entry);
    }
  }
  for (const e of viaContext) t.diagnostic(`backed by a context figure (checked by tools/check-content.mjs): ${e}`);
  assert.deepEqual(mismatches, [], 'numbers not found in the cited KB §13 rows');
});

test('seVe numbers come from the scene’s own rótulos or lines', () => {
  for (const v of videos) {
    for (const s of v.scenes) {
      const own = new Set([...Object.values(s.rotulos).map((r) => r.text), ...s.lines.map((l) => l.text)].flatMap((x) => x.match(NUM) || []));
      for (const n of numbers(s.seVe)) assert.ok(own.has(n), `${v.id}/${s.id}: seVe number ${n} is not in the scene's copy`);
    }
  }
});

test('no banned version of a corrected figure (KB §14, prompt §5.8.5)', () => {
  const BANNED = [
    ['"34%" with UNESCO', (s) => /(?<![\d,.])34\s?%/.test(s) && /UNESCO/.test(s)],
    ['"hasta 50%"', (s) => /hasta \+?50\s?%/.test(s)],
    ['"3 clústeres" for Latin America', (s) => /(?<![\d,.])3 clústeres/.test(s) && /(América Latina|ALC)/.test(s)],
    ['"pionero/pionera" for Colombia', (s) => /\bpioner[oa]\b/i.test(s) && /Colombia/.test(s) && !/\b(no|ni)\b/i.test(s)],
    ['"4 de cada 5" outside the US', (s) => /(4 de cada 5|cuatro de cada cinco)/i.test(s) && !/(Estados Unidos|EE_UU)/.test(s)],
    ['"2,4%" with "258"', (s) => /2,4\s?%/.test(s) && /(?<![\d,.])258(?![\d,.]\d)/.test(s)],
    ['rounded CONPES 4144', (s) => /más de 100 acciones|479\.000/.test(s)],
    ['"27% vs 9%"', (s) => /27\s?% (vs\.?|frente a) 9\s?%/.test(s)],
    ['AI Act in full from August 2026', (s) => /(aplica|rige)\w* (completa|por completo|en su totalidad)/i.test(s) && /agosto de 2026/.test(s) && !/\berror\b/.test(s)]
  ];
  const sentences = (s) => s.replace(/EE\. UU\./g, 'EE_UU').split(/(?<!\d)\.(?!\d)|[;·\n]/);
  const strings = [];
  for (const v of videos) {
    strings.push([v.id, v.title], ...v.chapters.map((c) => [v.id, c.title]));
    for (const s of v.scenes) {
      strings.push([`${v.id}/${s.id}.seVe`, s.seVe]);
      for (const [k, r] of Object.entries(s.rotulos)) strings.push([`${v.id}/${s.id}.${k}`, r.text]);
      s.lines.forEach((l, i) => strings.push([`${v.id}/${s.id}.lines[${i}]`, l.text], ...(l.say ? [[`${v.id}/${s.id}.lines[${i}].say`, l.say]] : [])));
    }
    v.checkpoints.forEach((c, i) => [c.question, ...c.options, c.explain, c.hint].forEach((x) => strings.push([`${v.id}/checkpoints[${i}]`, x])));
  }
  const hits = [];
  for (const [where, text] of strings) {
    for (const sentence of sentences(text)) {
      for (const [name, bad] of BANNED) if (bad(sentence)) hits.push(`${where}: ${name}: "${sentence.trim()}"`);
    }
  }
  assert.deepEqual(hits, []);
});

test('the 2025 survey series and its 2026 edition never share a scene (prompt §5.8.6)', () => {
  for (const v of videos) {
    for (const s of v.scenes) {
      const ids = new Set([
        ...s.lines.flatMap((l) => l.cifras || []),
        ...Object.values(s.rotulos).flatMap((r) => r.cifras || []),
        ...v.checkpoints.filter((c) => c.after === s.id).flatMap((c) => c.cifras || [])
      ]);
      const series = ['adop-1', 'adop-2', 'adop-3', 'adop-4', 'adop-5', 'adop-6'].some((id) => ids.has(id));
      assert.ok(!(series && ids.has('adop-7')), `${v.id}/${s.id}: adop-1…6 and adop-7 in one scene`);
    }
  }
});

test('summary', (t) => {
  for (const v of videos) {
    const lines = v.scenes.reduce((n, s) => n + s.lines.length, 0);
    const rotulos = v.scenes.reduce((n, s) => n + Object.keys(s.rotulos).length, 0);
    t.diagnostic(`${v.id} ${v.slug}: ${v.scenes.length} scenes, ${lines} lines, ${v.checkpoints.length} checkpoints, ${rotulos} rótulos`);
  }
  for (const v of videos) {
    v.checkpoints.forEach((c) => c.options.forEach((o, k) => {
      if (k !== c.answer && numbers(o).length) t.diagnostic(`wrong option with a number, for a person to glance at: ${v.id}/${c.after}: "${o}"`);
    }));
  }
});
