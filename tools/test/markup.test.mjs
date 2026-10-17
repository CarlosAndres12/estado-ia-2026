// Tests for js/core/markup.js — the KB text subset renderer (prompt §5.3, §10.1).
// Run from the repository root:  node --test tools/test/markup.test.mjs
//
// markup.js is a classic script that must stay DOM-free, so it is evaluated the way the tools load
// the data: in a Node vm sandbox where window === globalThis, after js/core/namespace.js and the data
// files it reads at call time (copy, figures, sources).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');

function load() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const rel of ['js/core/namespace.js', 'js/data/course.js', 'js/data/cifras.js', 'js/data/fuentes.js', 'js/core/markup.js']) {
    vm.runInContext(read(rel), sandbox, { filename: rel });
  }
  return sandbox.EIA;
}

const EIA = load();
const M = EIA.markup;

test('exposes the renderer API', () => {
  for (const name of ['escape', 'render', 'inline', 'plain', 'citations', 'figures']) {
    assert.equal(typeof M[name], 'function', name);
  }
});

test('escapes every HTML special character', () => {
  assert.equal(M.escape('<b>"A" & \'B\'</b>'), '&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;');
  const html = M.render('<script>alert(1)</script> & más');
  assert.ok(!html.includes('<script>'), html);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; más'), html);
});

test('a paragraph is wrapped in <p>; inline() never adds block wrappers', () => {
  assert.equal(M.render('Hola mundo.'), '<p>Hola mundo.</p>');
  assert.equal(M.inline('Hola mundo.'), 'Hola mundo.');
});

test('blank lines separate paragraphs and single newlines join lines', () => {
  assert.equal(M.render('Uno\ndos.\n\nTres.'), '<p>Uno dos.</p><p>Tres.</p>');
});

test('**negrita** and *cursiva*, also next to punctuation', () => {
  assert.equal(M.inline('**Rol.** Eres el asistente del curso *Estado de la IA 2026*.'),
    '<strong>Rol.</strong> Eres el asistente del curso <em>Estado de la IA 2026</em>.');
  assert.equal(M.inline('- *Actualización:* la edición'), '- <em>Actualización:</em> la edición');
});

test('a lone asterisk stays literal', () => {
  assert.equal(M.inline('Con matiz * nota'), 'Con matiz * nota');
});

test('a KB citation becomes a source tag button with its key', () => {
  const html = M.inline('aparece en la cobertura de [Campus Technology][ct].');
  assert.match(html, /<button type="button" class="source-tag" data-cita="ct" aria-haspopup="dialog" aria-expanded="false">/);
  assert.match(html, /Campus Technology<\/button>\.$/);
});

test('the source tag carries a visually hidden "Fuente" prefix from the copy', () => {
  const prefix = EIA.data.course.ui.page.markup.fuente;
  assert.ok(prefix && prefix.length > 0, 'ui.page.markup.fuente copy exists');
  const html = M.inline('[McKinsey, 2025][mck25]');
  assert.ok(html.includes('<span class="visually-hidden">' + M.escape(prefix) + ' </span>McKinsey, 2025'), html);
});

test('parentheses around citations only are dropped in tag mode', () => {
  const html = M.inline('Obtuvo 55,84 puntos ([Minciencias][minciencias]; [MinTIC][mintic]).');
  assert.ok(!html.includes('(<button'), html);
  assert.ok(!html.includes('</button>)'), html);
  assert.equal((html.match(/class="source-tag"/g) || []).length, 2);
  assert.ok(html.endsWith('</button>.'), html);
});

test('parentheses that hold more than citations are kept', () => {
  const html = M.inline('frente a 8,5% (redondeado a 9%) en las menos expuestas');
  assert.ok(html.includes('(redondeado a 9%)'), html);
});

test('an unknown source key renders as plain escaped text', () => {
  const html = M.inline('según [Nadie][no-existe].');
  assert.ok(!html.includes('<button'), html);
  assert.ok(html.includes('Nadie'), html);
});

test('citation link mode opens the source in a new tab with rel="noopener"', () => {
  const url = EIA.data.fuentes.hai.url;
  const html = M.inline('[Stanford AI Index 2026][hai]', { cite: 'link' });
  assert.ok(html.includes('href="' + M.escape(url) + '"'), html);
  assert.ok(html.includes('target="_blank"'), html);
  assert.ok(html.includes('rel="noopener"'), html);
  assert.ok(html.includes('Stanford AI Index 2026'), html);
});

test('citation text mode keeps only the label', () => {
  const html = M.inline('Stanford HAI (2026). [The 2026 AI Index Report][hai].', { cite: 'text' });
  assert.ok(!html.includes('<button') && !html.includes('<a '), html);
  assert.ok(html.includes('<span class="cite-text">The 2026 AI Index Report</span>'), html);
});

test('a registered figure becomes a popover button with a dotted underline class', () => {
  const html = M.inline('El {{adop-1|88%}} de las organizaciones');
  assert.equal(html, 'El <button type="button" class="fig" data-cifra="adop-1" aria-haspopup="dialog" aria-expanded="false">88%</button> de las organizaciones');
});

test('an unknown figure id renders its text without a button', () => {
  assert.equal(M.inline('{{zzz-9|12%}} más'), '12% más');
});

test('figures inside bold text keep both', () => {
  const html = M.inline('**{{adop-1|88%}} usa IA**');
  assert.ok(html.startsWith('<strong><button type="button" class="fig" data-cifra="adop-1"'), html);
  assert.ok(html.endsWith('usa IA</strong>'), html);
});

test('dash lists become <ul> and keep inline markup', () => {
  assert.equal(M.render('- uno con *énfasis*\n- dos'), '<ul><li>uno con <em>énfasis</em></li><li>dos</li></ul>');
});

test('two spaces per level nest a list inside the previous item', () => {
  const html = M.render('- *Rojo, evidencia insuficiente:*\n  - De más de 500 estudios\n  - La FDA\n- Prioridades');
  assert.equal(html, '<ul><li><em>Rojo, evidencia insuficiente:</em><ul><li>De más de 500 estudios</li><li>La FDA</li></ul></li><li>Prioridades</li></ul>');
});

test('numbered lists become <ol>, with start when they do not begin at 1', () => {
  assert.equal(M.render('1. Uno.\n2. Dos.'), '<ol><li>Uno.</li><li>Dos.</li></ol>');
  assert.equal(M.render('3. Tres.\n4. Cuatro.'), '<ol start="3"><li>Tres.</li><li>Cuatro.</li></ol>');
});

test('a paragraph line followed directly by a list starts the list', () => {
  const html = M.render('**Reglas de respuesta**\n1. Toda cifra va con su fuente.\n2. No inventes.\n\n**Tareas típicas:** explicar.');
  assert.equal(html, '<p><strong>Reglas de respuesta</strong></p><ol><li>Toda cifra va con su fuente.</li><li>No inventes.</li></ol><p><strong>Tareas típicas:</strong> explicar.</p>');
});

test('pipe tables become a scrollable, labelled table with header cells', () => {
  const html = M.render('| Actor | Prioridades |\n|---|---|\n| Gobiernos | Medición con {{adop-1|88%}} |\n| Universidades | Política común |');
  assert.match(html, /^<div class="table-wrap" role="region" tabindex="0" aria-label="[^"]+"><table>/);
  assert.ok(html.includes('<thead><tr><th scope="col">Actor</th><th scope="col">Prioridades</th></tr></thead>'), html);
  assert.ok(html.includes('<tbody><tr><td>Gobiernos</td><td>Medición con <button type="button" class="fig" data-cifra="adop-1"'), html);
  assert.ok(html.endsWith('</tbody></table></div>'), html);
  assert.equal((html.match(/<tr>/g) || []).length, 3);
});

test('a table between paragraphs closes and reopens the flow', () => {
  const html = M.render('Antes.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nDespués.');
  assert.ok(html.startsWith('<p>Antes.</p><div class="table-wrap"'), html);
  assert.ok(html.endsWith('</table></div><p>Después.</p>'), html);
});

test('blocks citing an update source get the luna mark; caja makes it a box', () => {
  const text = '- Uno ([McKinsey, 2025][mck25]).\n- *Actualización:* la edición 2026 ([McKinsey, 2026][mck26]).';
  const html = M.render(text, { updates: [{ fuente: 'mck26', caja: true }] });
  assert.ok(html.includes('<li>Uno'), 'first item untouched: ' + html);
  assert.match(html, /<li class="update update--caja"><span class="update__badge"><span class="estado__sign estado__sign--actualizacion" aria-hidden="true"><\/span>/);
});

test('an update mark adds the "Actualización" label unless the text already starts with it', () => {
  const label = EIA.data.course.leyenda.actualizacion;
  const own = M.render('METR marca hoy ese estudio como desactualizado ([METR, 2026][metr-up]).', { updates: [{ fuente: 'metr-up' }] });
  assert.ok(own.startsWith('<div class="update">'), own);
  assert.ok(own.includes('<span class="update__label">' + label + '</span>'), own);
  const already = M.render('- *Actualización:* la edición 2026 ([McKinsey, 2026][mck26]).', { updates: [{ fuente: 'mck26' }] });
  assert.ok(!already.includes('update__label'), already);
});

test('plain() strips the markup to readable text', () => {
  assert.equal(M.plain('**Rol.** El {{adop-1|88%}} usa IA ([McKinsey, 2025][mck25]).'), 'Rol. El 88% usa IA (McKinsey, 2025).');
  assert.equal(M.plain('- uno\n- *dos*'), 'uno dos');
});

test('citations() and figures() list what a text references, in order', () => {
  const text = 'El {{adop-1|88%}} y {{adop-5|39%}} ([McKinsey, 2025][mck25]; [Stanford, cap. 4][hai4]).';
  // Objects built inside the vm belong to another realm: compare them as plain data.
  const plain = (v) => JSON.parse(JSON.stringify(v));
  assert.deepEqual(plain(M.citations(text)), [{ label: 'McKinsey, 2025', key: 'mck25' }, { label: 'Stanford, cap. 4', key: 'hai4' }]);
  assert.deepEqual(plain(M.figures(text)), [{ id: 'adop-1', text: '88%' }, { id: 'adop-5', text: '39%' }]);
});

test('every KB text of the sessions renders without leftover markup', () => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['js/core/namespace.js', 'js/data/course.js'];
  for (let n = 1; n <= 7; n++) files.push('js/data/sesiones/s' + n + '.js');
  files.push('js/data/cifras.js', 'js/data/fuentes.js', 'js/data/faq.js', 'js/core/markup.js');
  for (const rel of files) vm.runInContext(read(rel), ctx, { filename: rel });
  const E = ctx.EIA;
  const leftovers = [];
  const visit = (where, text) => {
    const html = E.markup.render(text);
    const stripped = html.replace(/<[^>]+>/g, '');
    if (/\*\*|\{\{|\}\}|\]\[/.test(stripped)) leftovers.push(where + ': ' + stripped.slice(0, 120));
  };
  for (let n = 1; n <= 7; n++) {
    const s = E.data.sesiones[n];
    visit('s' + n + '.tesis', s.tesis);
    s.contenido.forEach((c) => visit('s' + n + '.contenido.' + c.n, c.cuerpo));
  }
  E.data.faq.forEach((f) => visit('faq.' + f.id, f.respuesta));
  assert.deepEqual(leftovers, []);
});
