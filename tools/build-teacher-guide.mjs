#!/usr/bin/env node
/* tools/build-teacher-guide.mjs — the printable teacher guide (guía docente) of the course.
 *
 *   node tools/build-teacher-guide.mjs            docs/guia-docente.html + docs/guia-docente.pdf
 *   node tools/build-teacher-guide.mjs --html     only the HTML (no browser)
 *   node tools/build-teacher-guide.mjs --out <dir>
 *
 * Every course text and number comes from the site's data (js/data/*, loaded with lib/load-data.mjs
 * plus js/core/markup.js for the KB markup). The only words written here are the connective headings
 * and short instructions in COPY below, which carry no figures. The PDF is printed with one capped
 * headless Chromium (lib/browser.mjs, Page.printToPDF), closed when done.
 *
 * `buildGuide(EIA, opts)` is pure (data in, HTML string out) so tests can check its content.
 */

import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadData } from './lib/load-data.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const SITE_URL = 'https://carlosandres12.github.io/estado-ia-2026/';

// Connective copy of the guide (Spanish, no numbers: figures only come from the data).
export const COPY = {
  documento: 'Guía docente',
  portadaKicker: 'Guía docente para quien facilita el curso',
  revisado: 'Revisado por',
  sitio: 'Sitio del curso',
  base: 'Contenido',
  generada: 'Esta guía se genera a partir de los datos del sitio; si cambia la base de conocimiento, vuelva a generarla.',
  indice: 'Índice',
  curso: 'El curso',
  versiones: 'Versiones del curso',
  uso: 'Cómo usar el sitio en clase',
  usoIntro: 'El sitio funciona sin conexión y reúne lo necesario para proyectar y conducir cada sesión.',
  modoClase: 'Modo clase y vista del facilitador',
  modoClaseTexto: 'Elija una sesión (o el taller) para proyectar sus láminas, videos, actividades y quiz siguiendo el reloj de la agenda. Desde el Modo clase, el botón «{boton}» abre una segunda ventana con las notas del orador y las claves, sincronizada con la proyección.',
  opciones: 'Qué se puede proyectar',
  laminas: 'Láminas',
  laminasTexto: 'Cada sesión tiene sus láminas, dibujadas por el sitio. Se abren desde la sesión o desde el Modo clase; las notas del orador están en esta guía y en «Para el facilitador».',
  videos: 'Videos con puntos de control',
  videosTexto: 'Los videos se pausan en puntos de control con una pregunta, sus opciones y una explicación. Pueden verse antes de la sesión o en clase. Esta guía incluye las respuestas.',
  cuaderno: 'Cuaderno del equipo',
  hojas: 'Hojas del cuaderno',
  imprimir: 'Opciones de impresión del sitio',
  imprimirItems: [
    ['imprimirGuia', 'en cada sesión, dentro de «Para el facilitador»: agenda, láminas, claves y quiz con respuestas.'],
    ['imprimirBanco', 'en el banco de cifras: una hoja de citas con la selección filtrada.'],
    ['imprimirCuaderno', 'en el cuaderno: las respuestas del equipo.']
  ],
  materiales: 'Materiales de la base de conocimiento',
  preparacion: 'Lista de preparación',
  preparacionItems: [
    'Abrir el sitio en el equipo de proyección y comprobar que láminas, videos y sonido funcionan.',
    'Probar el Modo clase y la vista del facilitador en dos pantallas o ventanas.',
    'Formar los equipos y explicar el cuaderno del equipo (se guarda solo en el navegador; se exporta para compartirlo).',
    'Revisar en esta guía la agenda, las notas del orador, las claves de las actividades y las respuestas del quiz de la sesión.',
    'Tener a mano el banco de cifras: cada cifra que se cite debe ir con su fuente.'
  ],
  sesionPrep: 'Preparación',
  sesionPrepVer: 'Videos que conviene ver antes',
  sesionPrepLaminas: 'Láminas que se proyectan',
  sesionPrepActividades: 'Actividades y hojas del cuaderno',
  hoja: 'hoja',
  tesis: 'Tesis',
  queDecir: 'Qué decir',
  nota: 'Nota',
  metafora: 'Imagen de la lámina',
  correccion: 'Corrección',
  antes: 'No use',
  ahora: 'Versión correcta',
  sinNotas: 'Sin notas del orador en la base de conocimiento.',
  checkpoint: 'Punto de control',
  respuesta: 'Respuesta',
  pista: 'Pista',
  sinCheckpoints: 'Video sin puntos de control.',
  herramienta: 'Herramienta interactiva en el sitio.',
  fases: 'Fases',
  minutos: 'min',
  hitos: 'Hitos',
  escenarios: 'Escenarios',
  clave: 'Clave',
  evaluacion: 'Evaluación',
  rubrica: 'Rúbrica',
  anexo: 'Anexo',
  cifras: 'Banco de cifras',
  cifrasIntro: 'Cada cifra con su alcance, tipo de evidencia, fuente y estado en la base del curso.',
  contexto: 'Cifras de contexto',
  correcciones: 'Correcciones',
  glosario: 'Glosario',
  referencias: 'Referencias',
  alcance: 'Alcance',
  tipo: 'Tipo de evidencia',
  fuente: 'Fuente',
  estado: 'Estado',
  pie: 'Guía docente'
};

// -------------------------------------------------------------------------------------------------
// Pure builder

function fill(text, vars) {
  return String(text == null ? '' : text).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));
}

export function revisor(course) {
  const m = /Revisado por ([^.]+)\.\s*$/.exec((course.footer && course.footer.texto) || '');
  return m ? m[1].trim() : '';
}

/** Builds the whole guide as one self-contained HTML string. */
export function buildGuide(EIA, opts = {}) {
  const D = EIA.data;
  const M = EIA.markup;
  if (!M) throw new Error('buildGuide: EIA.markup missing (load js/core/markup.js)');
  const c = D.course;
  const ui = c.ui;
  const siteUrl = opts.siteUrl || SITE_URL;
  const esc = M.escape;
  const mi = (s) => M.inline(s, { cite: 'link' });
  const md = (s) => M.render(s, { cite: 'link' });
  const plain = (s) => M.plain(s);
  const deck = (id) => (D.deck || []).find((d) => d.id === id);
  const video = (id) => (D.videos || []).find((v) => v.id === id);
  const hojaTitulo = (id) => { const hj = ((D.cuaderno && D.cuaderno.hojas) || []).find((x) => x.id === id); return hj ? hj.titulo : ''; };
  const sesionLabel = (n) => fill(ui.sesion.sesion, { n });
  const laminaLabel = (d) => fill(ui.page.sesion.lamina, { n: d.n, titulo: d.titulo });
  const out = [];
  const toc = [];
  const push = (...parts) => out.push(...parts);
  const list = (items, f = mi, tag = 'ul', cls = '') => (items && items.length)
    ? `<${tag}${cls ? ` class="${cls}"` : ''}>${items.map((i) => `<li>${f(i)}</li>`).join('')}</${tag}>` : '';
  const table = (header, rows, cls = '') => `<table${cls ? ` class="${cls}"` : ''}><thead><tr>${header.map((h) => `<th>${mi(h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((cell, i) => (i === 0 ? `<th scope="row">${mi(cell)}</th>` : `<td>${mi(cell)}</td>`)).join('')}</tr>`).join('')}</tbody></table>`;
  const chapter = (id, title, kicker) => {
    toc.push({ id, title: kicker && kicker !== COPY.anexo ? `${kicker} · ${title}` : title, level: 1 });
    return `<section class="chapter" id="${id}">${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}<h1>${mi(title)}</h1>`;
  };
  const sub = (id, title) => { toc.push({ id, title, level: 2 }); return `<h2 id="${id}">${mi(title)}</h2>`; };

  // ---- Cover -------------------------------------------------------------------------------------
  const f = c.footer || {};
  const rev = revisor(c);
  const cover = [
    '<section class="cover">',
    `<p class="kicker">${esc(COPY.portadaKicker)}</p>`,
    `<h1 class="cover__title">${esc(c.hero.titulo)}</h1>`,
    `<p class="cover__subtitle">${mi(c.hero.subtitulo)}</p>`,
    `<p class="cover__kicker">${esc(c.hero.kicker)}</p>`,
    `<p class="cover__question">${mi(c.pregunta)}</p>`,
    '<div class="cover__rule"></div>',
    `<h2 class="cover__h">${esc(f.autoresTitulo || '')}</h2>`,
    '<ul class="authors">',
    ...(f.autores || []).map((a) => `<li><strong>${esc(a.nombre)}</strong><br><span>${esc(a.afiliacion)}</span><br><a href="mailto:${esc(a.correo)}">${esc(a.correo)}</a></li>`),
    '</ul>',
    rev ? `<p class="cover__meta"><strong>${esc(COPY.revisado)}:</strong> ${esc(rev)}</p>` : '',
    `<p class="cover__meta"><strong>${esc(COPY.base)}:</strong> ${esc(c.kb.titulo)}, versión ${esc(c.kb.versionTexto)}.</p>`,
    `<p class="cover__meta"><strong>${esc(COPY.sitio)}:</strong> <a href="${esc(siteUrl)}">${esc(siteUrl)}</a></p>`,
    `<p class="cover__note">${mi(f.texto || '')}</p>`,
    `<p class="cover__note">${esc(COPY.generada)}</p>`,
    '</section>'
  ].join('');

  // ---- Course overview ---------------------------------------------------------------------------
  const fi = c.ficha;
  push(chapter('curso', COPY.curso));
  push(`<p class="lead">${mi(c.hero.lead)}</p>`);
  push(`<div class="callout"><p class="callout__label">${esc(ui.inicio.pregunta)}</p><p class="callout__q">${mi(c.pregunta)}</p></div>`);
  push(sub('ficha', ui.inicio.ficha));
  push(`<dl class="ficha">`);
  for (const key of ['descripcion', 'publico', 'modalidad', 'objetivo']) {
    const it = fi[key];
    if (!it) continue;
    push(`<dt>${esc(it.label)}</dt><dd><p>${mi(it.texto)}</p>${list(it.versiones)}</dd>`);
  }
  push(`<dt>${esc(fi.resultados.label)}</dt><dd><p>${mi(fi.resultados.intro)}</p>${list(fi.resultados.items, mi, 'ol')}</dd>`);
  push(`<dt>${esc(fi.metodologia.label)}</dt><dd><p>${mi(fi.metodologia.intro)}</p>${list(fi.metodologia.bloques)}<p>${mi(fi.metodologia.cierre)}</p></dd>`);
  push(`<dt>${esc(fi.fuentes.label)}</dt><dd><p>${mi(fi.fuentes.texto)}</p></dd>`);
  push('</dl>');

  const mp = c.mapa;
  push(sub('mapa', mp.titulo));
  push(table(mp.columnas, mp.filas.map((r) => [String(r.sesion), r.tema, r.diapositivas, r.pregunta, r.producto]), 'map'));
  push(`<p><strong>${esc(ui.sesion.trabajoAutonomo)}:</strong> ${mi(mp.trabajoAutonomo.texto)}</p>`);
  push(`<p>${mi(mp.hilo.texto)}</p>`);
  push(`<h3>${esc(COPY.versiones)}</h3>${list(mp.versiones)}`);

  const mc = c.marco;
  push(sub('marco', mc.titulo));
  push(`<h3>${mi(mc.tipos.titulo)}</h3>`);
  push(table(mc.tipos.columnas, mc.tipos.items.map((i) => [i.tipo, i.queEs, i.ejemplo])));
  push(`<h3>${mi(mc.fuentes.titulo)}</h3>`);
  push(table(mc.fuentes.columnas, mc.fuentes.filas.map((r) => [r.fuente, r.aporta, r.limite])));
  push(`<h3>${mi(mc.coberturas.titulo)}</h3>${list(mc.coberturas.items)}<p>${mi(mc.coberturas.cierre)}</p>`);
  push(`<h3>${mi(mc.criterios.titulo)}</h3><ul>${mc.criterios.items.map((i) => `<li><strong>${mi(i.label)}:</strong> ${mi(i.texto)}</li>`).join('')}</ul>`);
  push(`<h3>${mi(mc.advertencias.titulo)}</h3>${list(mc.advertencias.items, mi, 'ol')}`);
  push('</section>');

  // ---- How to use the site -----------------------------------------------------------------------
  push(chapter('uso', COPY.uso));
  push(`<p class="lead">${esc(COPY.usoIntro)}</p>`);
  push(`<div class="cards">${c.comoUsar.tarjetas.map((tc) => `<div class="card"><h3>${esc(tc.titulo)}</h3><p>${mi(tc.texto)}</p></div>`).join('')}</div>`);
  push(sub('uso-modo-clase', COPY.modoClase));
  push(`<p>${esc(fill(COPY.modoClaseTexto, { boton: ui.modoClase.vistaFacilitador }))}</p>`);
  push(`<p class="hint">${esc(ui.clase.elegirAyuda)}</p>`);
  push(`<h3>${esc(COPY.opciones)}</h3>${list(D.modoClase.opciones.map((o) => o.label), esc)}`);
  push(sub('uso-laminas', COPY.laminas));
  push(`<p>${esc(COPY.laminasTexto)}</p>`);
  push(sub('uso-videos', COPY.videos));
  push(`<p>${esc(COPY.videosTexto)}</p>`);
  push(`<ul>${D.videos.map((v) => `<li><strong>${esc(v.id.toUpperCase())}</strong> · ${esc(v.title)} <span class="muted">(${esc(sesionLabel(v.sesion))})</span></li>`).join('')}</ul>`);
  push(sub('uso-cuaderno', COPY.cuaderno));
  push(`<p>${esc(ui.cuaderno.ayuda)} ${esc(ui.cuaderno.propio)}</p>`);
  push(`<h3>${esc(COPY.hojas)}</h3>${list(D.cuaderno.hojas.map((hj) => hj.titulo), esc)}`);
  push(sub('uso-imprimir', COPY.imprimir));
  const printLabels = { imprimirGuia: ui.page.sesion.imprimirGuia, imprimirBanco: ui.banco.imprimir, imprimirCuaderno: ui.cuaderno.imprimir };
  push(`<ul>${COPY.imprimirItems.map(([k, tx]) => `<li><strong>«${esc(printLabels[k])}»</strong>: ${esc(tx)}</li>`).join('')}</ul>`);
  push(sub('uso-preparacion', COPY.preparacion));
  push(`<p><strong>${esc(COPY.materiales)}:</strong> ${mi(c.kb.materiales)}.</p>`);
  push(`<ul class="checklist">${COPY.preparacionItems.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  push('</section>');

  // ---- Sessions ----------------------------------------------------------------------------------
  for (let n = 1; n <= 7; n++) {
    const s = D.sesiones[n];
    if (!s) continue;
    const base = `s${n}`;
    push(chapter(base, s.titulo, sesionLabel(n)));
    if (s.tema && plain(s.tema) !== plain(s.titulo)) push(`<p class="lead">${mi(s.tema)}</p>`);
    push(`<div class="callout"><p class="callout__label">${esc(COPY.tesis)}</p>${md(s.tesis)}</div>`);
    push('<dl class="facts">');
    push(`<dt>${esc(ui.sesion.pregunta)}</dt><dd>${mi(s.pregunta)}</dd>`);
    push(`<dt>${esc(ui.sesion.producto)}</dt><dd>${mi(s.productoSesion || s.producto)}</dd>`);
    push(`<dt>${esc(ui.sesion.diapositivas)}</dt><dd>${esc(s.diapositivas)}</dd>`);
    push('</dl>');

    push(`<h2>${esc(ui.sesion.resultados)}</h2>${list(s.resultados)}`);

    // Preparation checklist from the session's own resources.
    push(`<h2>${esc(COPY.sesionPrep)}</h2><div class="prep">`);
    const vids = (s.videos || []).map(video).filter(Boolean);
    if (vids.length) push(`<h3>${esc(COPY.sesionPrepVer)}</h3>${list(vids.map((v) => `${v.id.toUpperCase()} · ${v.title}`), esc, 'ul', 'checklist')}`);
    const lams = (s.laminas || []).map(deck).filter(Boolean);
    if (lams.length) push(`<h3>${esc(COPY.sesionPrepLaminas)}</h3>${list(lams.map(laminaLabel), esc, 'ul', 'checklist')}`);
    const acts = (s.actividades || []).map((id) => D.actividades[id]).filter(Boolean);
    if (acts.length) {
      push(`<h3>${esc(COPY.sesionPrepActividades)}</h3><ul class="checklist">${acts.map((a) => {
        const ht = a.hoja ? hojaTitulo(a.hoja) : '';
        return `<li>${mi(a.titulo)}${ht ? ` <span class="muted">(${esc(COPY.hoja)}: ${esc(ht)})</span>` : ''}</li>`;
      }).join('')}</ul>`);
    }
    push('</div>');

    // Agenda
    push(`<h2 id="${base}-agenda">${esc(s.agendaTitulo || ui.sesion.agenda)}</h2>`);
    const cols = ui.page.sesion.agendaColumnas;
    push(`<table class="agenda"><thead><tr>${cols.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${
      s.agenda.map((b) => `<tr><td class="num">${esc(b.minutos)} ${esc(ui.page.sesion.minutos)}</td><td>${mi(b.bloque)}</td><td>${b.recurso && b.recurso !== '—' ? mi(b.recurso) : '—'}</td></tr>`).join('')}</tbody></table>`);

    // Láminas and speaker notes
    if (lams.length) {
      push(`<h2>${esc(ui.sesion.laminas)} · ${esc(ui.sesion.facilitador)}</h2>`);
      for (const d of lams) {
        const no = d.notas || {};
        const fl = (s.facilitador && s.facilitador.laminas && s.facilitador.laminas[d.id]) || {};
        const decir = no.decir || fl.decir;
        const nota = no.nota || fl.nota;
        const parts = [];
        if (decir) parts.push(`<p><strong>${esc(COPY.queDecir)}:</strong> ${mi(decir)}</p>`);
        if (nota) parts.push(`<p><strong>${esc(COPY.nota)}:</strong> ${mi(nota)}</p>`);
        if (no.metafora) parts.push(`<p><strong>${esc(COPY.metafora)}:</strong> ${mi(no.metafora)}</p>`);
        for (const cid of no.correcciones || []) {
          const row = ((D.correcciones && D.correcciones.filas) || []).find((r) => r.id === cid);
          if (row) parts.push(`<p class="fix"><strong>${esc(COPY.correccion)}.</strong> ${esc(COPY.antes)}: <span class="strike">${mi(row.antes)}</span> · ${esc(COPY.ahora)}: ${mi(row.ahora)} ${mi(row.fuente)}</p>`);
        }
        if (!parts.length) parts.push(`<p class="muted">${esc(COPY.sinNotas)}</p>`);
        push(`<div class="note"><h3>${esc(laminaLabel(d))}</h3>${parts.join('')}</div>`);
      }
    }

    // Videos and checkpoints
    if (vids.length) {
      push(`<h2>${esc(ui.sesion.video)}</h2>`);
      for (const v of vids) {
        push(`<div class="note"><h3>${esc(v.id.toUpperCase())} · ${esc(v.title)}</h3>`);
        const cps = v.checkpoints || [];
        if (!cps.length) push(`<p class="muted">${esc(COPY.sinCheckpoints)}</p>`);
        cps.forEach((cp, i) => {
          push(`<div class="qa"><p class="qa__q"><span class="muted">${esc(COPY.checkpoint)}</span> ${mi(cp.question)}</p><ol class="opts" type="a">${
            cp.options.map((o, j) => `<li${j === cp.answer ? ' class="is-answer"' : ''}>${mi(o)}</li>`).join('')}</ol>`);
          push(`<p><strong>${esc(COPY.respuesta)}:</strong> ${String.fromCharCode(97 + cp.answer)}) ${mi(cp.options[cp.answer])}. ${cp.explain ? mi(cp.explain) : ''}</p></div>`);
          void i;
        });
        push('</div>');
      }
    }

    // Activities
    const allActs = acts.concat(Object.values(D.actividades).filter((a) => a.sesion === n && !(s.actividades || []).includes(a.id)));
    if (allActs.length) {
      push(`<h2>${esc(ui.sesion.actividad)}</h2>`);
      for (const a of allActs) push(activityHTML(a));
    }

    if (s.errores && s.errores.length) push(`<h2>${esc(ui.sesion.errores)}</h2>${list(s.errores)}`);
    if (s.discusion && s.discusion.length) push(`<h2>${esc(s.discusionTitulo || ui.sesion.discusion)}</h2>${list(s.discusion, mi, 'ol')}`);

    if (s.quiz && s.quiz.length) {
      push(`<h2 id="${base}-quiz">${esc(ui.page.sesion.quizRespuestas)}</h2><ol class="quiz">`);
      for (const q of s.quiz) {
        const letra = q.letra || String.fromCharCode(97 + q.respuesta);
        push(`<li class="qa"><p class="qa__q">${mi(q.pregunta)}</p><ol class="opts" type="a">${q.opciones.map((o, j) => `<li${j === q.respuesta ? ' class="is-answer"' : ''}>${mi(o)}</li>`).join('')}</ol>`);
        push(`<p class="answer">${esc(fill(ui.page.sesion.respuesta, { letra, opcion: plain(q.opciones[q.respuesta]) }))}</p>`);
        if (q.explicacion) push(`<p>${mi(q.explicacion)}</p>`);
        if (q.pista) push(`<p class="muted"><strong>${esc(COPY.pista)}:</strong> ${mi(q.pista)}</p>`);
        push('</li>');
      }
      push('</ol>');
    }

    if (s.lecturas && s.lecturas.length) push(`<h2>${esc(ui.sesion.lecturas)}</h2>${list(s.lecturas)}`);
    push(`<p><strong>${esc(ui.sesion.trabajoAutonomo)}:</strong> ${mi(mp.trabajoAutonomo.texto)}</p>`);
    push('</section>');
  }

  function activityHTML(a) {
    const kb = a.kb || null;
    const heading = kb && kb.titulo ? kb.titulo : a.titulo;
    const p = [`<div class="activity"><h3>${mi(heading)}${kb && kb.duracion ? ` <span class="badge">${esc(kb.duracion)}</span>` : ''}</h3>`];
    if (kb && kb.titulo && a.titulo && heading.indexOf(a.titulo) < 0) p.push(`<p class="kicker">${mi(a.titulo)}</p>`);
    const consigna = (kb && kb.consigna) || a.consigna;
    if (consigna) p.push(md(consigna));
    if (kb && kb.pasos && kb.pasos.length) p.push(list(kb.pasos, mi, 'ol'));
    if (kb && kb.tabla && kb.tabla.header) p.push(table(kb.tabla.header, kb.tabla.rows || [], 'worksheet'));
    if (!kb) p.push(`<p class="muted">${esc(COPY.herramienta)}</p>`);
    if (a.columnas && Array.isArray(a.niveles) && typeof a.niveles[0] === 'object') {
      p.push(table(a.columnas, a.niveles.map((l) => [l.nivel, l.indicadores, l.pregunta])));
    }
    if (a.fases) p.push(`<p><strong>${esc(COPY.fases)}:</strong> ${a.fases.map((x) => `${esc(x.label)} (${esc(x.minutos)} ${esc(COPY.minutos)})`).join(' · ')}</p>`);
    if (a.hitos) p.push(`<h4>${esc(COPY.hitos)}</h4>${list(a.hitos.map((x) => x.texto))}`);
    if (a.escenarios) p.push(`<h4>${esc(COPY.escenarios)}</h4><ul>${a.escenarios.map((x) => `<li><strong>${mi(x.titulo)}:</strong> ${mi(x.texto)}</li>`).join('')}</ul>`);
    if (typeof a.nota === 'string' && a.nota) p.push(`<p class="muted">${mi(a.nota)}</p>`);
    // Keys for the teacher
    if (a.cards && a.clave && a.clave.columnas) {
      p.push(`<div class="key"><h4>${esc(a.clave.titulo || COPY.clave)}</h4>${table(a.clave.columnas, a.cards.map((cd) => [cd.cifra, cd.fuente, cd.claveKB]))}</div>`);
    }
    if (a.afirmaciones) p.push(`<div class="key"><h4>${esc(a.claveTitulo || COPY.clave)}</h4>${list(a.afirmaciones.map((x) => x.clave))}</div>`);
    if (kb && kb.clave && kb.clave.items) p.push(`<div class="key"><h4>${esc(kb.clave.titulo || COPY.clave)}</h4>${list(kb.clave.items)}</div>`);
    p.push('</div>');
    return p.join('');
  }

  // ---- Evaluation --------------------------------------------------------------------------------
  const ev = c.evaluacion;
  push(chapter('evaluacion', ev.titulo));
  push(table(ev.pesos.columnas, ev.pesos.filas.map((r) => [r.componente, r.peso, r.momento])));
  push(sub('proyecto', ev.proyecto.titulo));
  push(`<p>${mi(ev.proyecto.intro)}</p><ol>${ev.proyecto.preguntas.map((q) => `<li><strong>${mi(q.titulo)}:</strong> ${mi(q.texto)}${q.hojas && q.hojas.length ? ` <span class="muted">(${q.hojas.map((id) => esc(hojaTitulo(id))).filter(Boolean).join(', ')})</span>` : ''}</li>`).join('')}</ol>`);
  push(`<p>${mi(ev.proyecto.cierre)}</p>`);
  push(`<h3>${mi(ev.retro.titulo)}</h3>${list(ev.retro.pasos, mi, 'ol')}`);
  const rb = D.rubrica;
  push(sub('rubrica', rb.titulo || COPY.rubrica));
  push(`<p>${mi(rb.nota)}</p>`);
  push(table(rb.columnas, rb.criterios.map((cr) => [cr.criterio, String(cr.peso) + '%', ...rb.niveles.map((l) => cr.niveles[l.n])]), 'rubric'));
  push('</section>');

  // ---- Annex -------------------------------------------------------------------------------------
  push(chapter('cifras', COPY.cifras, COPY.anexo));
  push(`<p>${esc(COPY.cifrasIntro)}</p>`);
  push(`<ul class="estados">${c.banco.estados.map((e) => `<li><strong>${esc(e.label)}:</strong> ${mi(e.texto)}</li>`).join('')}</ul>`);
  const all = EIA.cifra.all();
  const cifraHTML = (x) => `<li class="cifra" id="cifra-${esc(x.id)}"><span class="cifra__id">${esc(x.id)}</span><div><p class="cifra__v">${mi(x.cifra)}</p>` +
    `<p class="cifra__m">${esc(COPY.alcance)}: ${mi(x.alcanceTexto)}${x.clase !== 'ninguno' ? ` · ${esc(COPY.tipo)}: ${esc(x.tipo)}` : ''}${x.estado ? ` · ${esc(COPY.estado)}: ${esc(x.estado)}` : ''}</p>` +
    `<p class="cifra__s">${esc(COPY.fuente)}: ${x.fuentesList.map((s) => `${esc(s.etiqueta)}, <a href="${esc(s.url)}">${esc(s.url)}</a>`).join('; ')}</p></div></li>`;
  for (const tm of D.temas) {
    const rows = all.filter((x) => x.enBanco && x.tema === tm.id);
    if (!rows.length) continue;
    push(`<h2 id="cifras-${esc(tm.id)}">${esc(tm.titulo)}</h2><ul class="cifras">${rows.map(cifraHTML).join('')}</ul>`);
  }
  const ctx = all.filter((x) => !x.enBanco);
  if (ctx.length) push(`<h2 id="cifras-contexto">${esc(COPY.contexto)}</h2><ul class="cifras">${ctx.map(cifraHTML).join('')}</ul>`);
  const co = D.correcciones;
  if (co && co.filas) {
    push(sub('correcciones', co.titulo || COPY.correcciones));
    push(table(co.columnas, co.filas.map((r) => [r.antes, r.ahora, r.fuente])));
  }
  push('</section>');

  push(chapter('glosario', COPY.glosario, COPY.anexo));
  push(`<dl class="glossary">${D.glosario.map((g) => `<dt>${esc(g.termino)}</dt><dd>${mi(g.definicion)}</dd>`).join('')}</dl>`);
  push('</section>');

  push(chapter('referencias', COPY.referencias, COPY.anexo));
  for (const grp of D.referencias) push(`<h3>${mi(grp.grupo)}</h3>${list(grp.items, (i) => M.inline(i, { cite: 'link' }), 'ul', 'refs')}`);
  push('</section>');

  // ---- Table of contents -------------------------------------------------------------------------
  const tocHTML = `<section class="toc"><h1>${esc(COPY.indice)}</h1><ol>${(() => {
    const parts = [];
    let open = false;
    for (const e of toc) {
      if (e.level === 1) {
        if (open) parts.push('</ol></li>');
        parts.push(`<li><a href="#${e.id}">${esc(plain(e.title))}</a><ol>`);
        open = true;
      } else {
        parts.push(`<li><a href="#${e.id}">${esc(plain(e.title))}</a></li>`);
      }
    }
    if (open) parts.push('</ol></li>');
    return parts.join('');
  })()}</ol></section>`;

  const title = `${COPY.documento} · ${c.hero.titulo}`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${opts.fontsCss || ''}
${GUIDE_CSS}
</style>
</head>
<body>
${cover}
${tocHTML}
${out.join('\n')}
</body>
</html>
`;
}

export const GUIDE_CSS = `
@page { size: letter; margin: 18mm 17mm 20mm; }
@page :first { margin: 0; }
:root { --tinta: #15120F; --rojo: #D7261E; --amarillo: #F5C518; --azul: #1C3F95; --verde: #1E8A4C; --suave: #4A4239; --papel: #FBF7EE; --wash: #F9E7A6; --linea: #CFC4AE; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: "EIA Sans", "Noto Sans", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: var(--tinta); background: #fff; }
h1, h2, h3, h4, .cover__title { font-family: "EIA Display", "Noto Serif Display", Georgia, serif; line-height: 1.15; break-after: avoid; page-break-after: avoid; }
h1 { font-size: 22pt; margin: 0 0 8pt; font-weight: 900; }
h2 { font-size: 14pt; margin: 16pt 0 6pt; padding-bottom: 2pt; border-bottom: 1.5pt solid var(--tinta); }
h3 { font-size: 11.5pt; margin: 10pt 0 4pt; }
h4 { font-size: 10.5pt; margin: 8pt 0 3pt; font-family: "EIA Sans", Arial, sans-serif; }
p { margin: 0 0 5pt; orphans: 3; widows: 3; }
ul, ol { margin: 0 0 6pt; padding-left: 16pt; }
li { margin: 0 0 2pt; }
a { color: var(--azul); text-decoration: none; overflow-wrap: anywhere; }
.muted { color: var(--suave); }
.kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 8.5pt; font-weight: 700; color: var(--rojo); margin: 0 0 4pt; }
.lead { font-size: 12pt; color: var(--suave); }
.strike { text-decoration: line-through; }
button.fig, button.source-tag { all: unset; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ext-link span[aria-hidden] { font-size: 0.8em; }

.cover { height: 279mm; overflow: hidden; padding: 30mm 22mm 18mm; background: var(--papel); border-left: 10mm solid var(--azul); position: relative; break-after: page; page-break-after: always; display: flex; flex-direction: column; }
.cover::after { content: ""; position: absolute; top: 12mm; right: 14mm; width: 16mm; height: 16mm; border-radius: 50%; background: var(--amarillo); box-shadow: -10mm 10mm 0 -4mm var(--rojo); }
.cover__title { font-size: 40pt; font-weight: 900; margin: 6pt 0 6pt; }
.cover__subtitle { font-size: 17pt; margin: 0 0 6pt; }
.cover__kicker { font-size: 10.5pt; color: var(--suave); }
.cover__question { font-family: "EIA Display", Georgia, serif; font-size: 14pt; margin: 14pt 0; padding: 8pt 10pt; background: var(--wash); border-left: 3pt solid var(--tinta); }
.cover__rule { height: 2pt; background: var(--tinta); margin: 10pt 0 10pt; }
.cover__h { border: 0; margin: 0 0 4pt; font-size: 12pt; }
.authors { list-style: none; padding: 0; margin: 0 0 10pt; }
.authors li { margin: 0 0 7pt; font-size: 9.5pt; }
.authors strong { font-size: 11pt; }
.cover__meta { font-size: 9.5pt; margin: 0 0 3pt; }
.cover__note { font-size: 8pt; color: var(--suave); margin-top: auto; padding-top: 6pt; }
.cover__note + .cover__note { margin-top: 0; }

.toc { break-after: page; page-break-after: always; }
.toc ol { list-style: none; padding-left: 0; }
.toc > ol > li { margin: 6pt 0 2pt; font-weight: 700; font-size: 11pt; }
.toc > ol > li > ol { padding-left: 14pt; font-weight: 400; font-size: 9.5pt; columns: 2; column-gap: 14pt; }
.toc a { color: var(--tinta); }

.chapter { break-before: page; page-break-before: always; }
.chapter > h1 { border-bottom: 3pt solid var(--rojo); padding-bottom: 4pt; }
.callout { background: var(--papel); border-left: 3pt solid var(--amarillo); padding: 6pt 9pt; margin: 6pt 0 8pt; break-inside: avoid; }
.callout__label { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin: 0 0 2pt; color: var(--suave); }
.callout__q { font-family: "EIA Display", Georgia, serif; font-size: 13pt; margin: 0; }
dl { margin: 0 0 6pt; }
.ficha dt, .facts dt, .glossary dt { font-weight: 700; margin-top: 5pt; break-after: avoid; }
.ficha dd, .facts dd, .glossary dd { margin: 0 0 3pt 0; }
.facts { display: grid; grid-template-columns: 34mm 1fr; gap: 2pt 8pt; }
.facts dt { margin: 0; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; margin: 6pt 0; }
.card { border: 1pt solid var(--tinta); padding: 6pt 8pt; background: var(--papel); break-inside: avoid; }
.card h3 { margin-top: 0; }
.hint { font-size: 9pt; color: var(--suave); }
.checklist { list-style: none; padding-left: 0; }
.checklist li { padding-left: 14pt; position: relative; }
.checklist li::before { content: ""; position: absolute; left: 0; top: 3pt; width: 7pt; height: 7pt; border: 0.9pt solid var(--tinta); }
.prep { columns: 2; column-gap: 14pt; }
.prep h3 { break-after: avoid; margin-top: 4pt; }
.prep ul { break-inside: avoid; }

table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 9pt; break-inside: auto; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { text-align: left; vertical-align: top; padding: 3pt 4pt; border-bottom: 0.6pt solid var(--linea); }
thead th { border-bottom: 1.2pt solid var(--tinta); font-weight: 700; background: var(--papel); }
tbody th { font-weight: 700; }
td.num { white-space: nowrap; font-variant-numeric: tabular-nums; }
table.worksheet td { height: 14pt; }
table.rubric { font-size: 8pt; }
table.map { font-size: 8.5pt; }

.note { border-left: 2pt solid var(--azul); padding: 2pt 0 2pt 8pt; margin: 6pt 0 8pt; break-inside: avoid; }
.note h3 { margin-top: 0; }
.fix { background: #FCEDEC; padding: 3pt 5pt; }
.activity { border: 0.9pt solid var(--tinta); padding: 6pt 8pt; margin: 6pt 0 10pt; }
.activity > h3 { margin-top: 0; }
.badge { font-family: "EIA Sans", Arial, sans-serif; font-size: 8.5pt; font-weight: 700; background: var(--amarillo); padding: 0 4pt; border-radius: 2pt; white-space: nowrap; }
.key { background: var(--papel); border: 0.9pt dashed var(--tinta); padding: 4pt 7pt; margin-top: 6pt; break-inside: avoid; }
.key h4 { margin-top: 0; }
.qa { break-inside: avoid; margin: 0 0 7pt; }
.qa__q { font-weight: 700; margin-bottom: 2pt; }
.opts { margin-bottom: 2pt; }
.opts li.is-answer { font-weight: 700; }
.opts li.is-answer::marker { color: var(--verde); }
.answer { color: var(--verde); font-weight: 700; }
.quiz > li { margin-bottom: 8pt; }

.estados { font-size: 9pt; }
.cifras { list-style: none; padding: 0; }
.cifra { break-inside: avoid; padding: 3pt 0 4pt; border-bottom: 0.6pt solid var(--linea); display: grid; grid-template-columns: 22mm 1fr; gap: 0 4pt; }
.cifra p { margin: 0 0 1pt; }
.cifra__v { font-weight: 700; }
.cifra__id { font-size: 8pt; font-weight: 700; color: var(--suave); padding-top: 1pt; overflow-wrap: anywhere; }
.cifra__m, .cifra__s { font-size: 8.5pt; color: var(--suave); }
.glossary dd { break-before: avoid; }
.glossary dt { break-after: avoid; }
.refs { font-size: 9pt; }
`;

// -------------------------------------------------------------------------------------------------
// CLI

function pdfPages(buf) {
  const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
}

async function main(argv) {
  const args = argv.slice(2);
  const onlyHtml = args.includes('--html');
  const oi = args.indexOf('--out');
  const outDir = oi >= 0 ? path.resolve(args[oi + 1]) : path.join(ROOT, 'docs');
  const EIA = await loadData({ root: ROOT, extra: ['js/core/markup.js'] });
  const fontsCss = readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8');
  const html = buildGuide(EIA, { fontsCss });
  mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'guia-docente.html');
  writeFileSync(htmlPath, html);
  console.log(`HTML: ${path.relative(ROOT, htmlPath)} (${Math.round(html.length / 1024)} KB)`);
  if (onlyHtml) return;

  const { launchBrowser } = await import('./lib/browser.mjs');
  const b = await launchBrowser({ width: 816, height: 1056, timeout: 5 * 60 * 1000 });
  try {
    await b.open(pathToFileURL(htmlPath).href);
    await b.evaluate('document.fonts.ready.then(() => true)');
    const footer = `<div style="width:100%;font-size:7.5pt;font-family:sans-serif;color:#4A4239;padding:0 17mm;display:flex;justify-content:space-between"><span>${COPY.pie} · ${EIA.data.course.hero.titulo}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    const r = await b.cdp('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footer,
      generateDocumentOutline: true,
      generateTaggedPDF: true
    });
    const pdf = Buffer.from(r.data, 'base64');
    const pdfPath = path.join(outDir, 'guia-docente.pdf');
    writeFileSync(pdfPath, pdf);
    if (b.errors.length) console.warn('Browser errors:\n  ' + b.errors.join('\n  '));
    console.log(`PDF: ${path.relative(ROOT, pdfPath)} (${Math.round(statSync(pdfPath).size / 1024)} KB, ${pdfPages(pdf)} pages)`);
  } finally {
    await b.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv).catch((err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
