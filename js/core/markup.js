/* Estado de la IA 2026 — renderer for the KB text subset (prompt §5.3), no library.
 *
 *   EIA.markup.render(text, opts) -> HTML   paragraphs, "- " / "1. " lists (two spaces per level),
 *                                           pipe tables; inline markup inside every block
 *   EIA.markup.inline(text, opts) -> HTML   inline markup only (titles, table cells, list items)
 *   EIA.markup.plain(text)        -> text   markup removed (search, aria labels, print sheets)
 *   EIA.markup.citations(text)    -> [{ label, key }]   KB citations in order
 *   EIA.markup.figures(text)      -> [{ id, text }]     registered figures in order
 *   EIA.markup.escape(text)       -> text   & < > " ' escaped
 *
 * Inline markup
 *   [Etiqueta][clave]  KB citation (clave in EIA.data.fuentes). opts.cite:
 *                      'tag'  (default) a paper source tag, <button class="source-tag" data-cita>, whose
 *                             popover js/ui/chips.js opens; parentheses that hold only citations are
 *                             dropped, because the tag already reads as a citation;
 *                      'link' a plain link that opens the source in a new tab (rel="noopener");
 *                      'text' the label only (<span class="cite-text">), e.g. the references list.
 *                      Unknown keys render as plain text.
 *   {{id|texto}}       registered figure: <button class="fig" data-cifra> with a dotted underline and
 *                      the figure popover; unknown ids render the text alone.
 *   **negrita**, *cursiva*.
 *
 * opts.updates = [{ fuente, caja }] (sesiones[n].actualizaciones for one contenido point): every
 *   paragraph or list item that cites one of these sources is an "Actualización" (luna sign, and the
 *   label unless the text already starts with it); caja: true makes it a box of its own.
 * opts.tableLabel: accessible name prefix of table wrappers (default: copy ui.page.markup.tabla).
 *
 * Everything is escaped. DOM-free: tools evaluate this file in a Node vm. UI words come from
 * EIA.data.course (ui.page.markup, leyenda.actualizacion) at call time. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};

  var CITE_RE = /\[([^\]\n]+)\]\[([a-z0-9-]+)\]/g;
  var FIG_RE = /\{\{([a-z0-9-]+)\|([^}\n]*)\}\}/g;
  // "(" + one or more citations separated by ";" or "," + ")".
  var CITE_GROUP_RE = /\((\s*\[[^\]\n]+\]\[[a-z0-9-]+\](?:\s*[;,]\s*\[[^\]\n]+\]\[[a-z0-9-]+\])*\s*)\)/g;
  var LIST_RE = /^( *)(-|\d+\.) +(.*)$/;
  var TABLE_RE = /^\s*\|/;
  var SEP_CELL_RE = /^:?-{3,}:?$/;
  // Private-use characters delimit placeholders for already-rendered HTML pieces.
  var PH_OPEN = '', PH_CLOSE = '';
  var PH_RE = /(\d+)/g;

  function str(v) { return v == null ? '' : String(v); }

  function escape(text) {
    return str(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copy(path) {
    var v = EIA.data && EIA.data.course;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) v = v == null ? v : v[parts[i]];
    return typeof v === 'string' ? v : '';
  }

  function fold(text) {
    return EIA.util && EIA.util.fold ? EIA.util.fold(text) : str(text).toLowerCase();
  }

  function fuente(key) {
    var f = EIA.data && EIA.data.fuentes;
    return f && Object.prototype.hasOwnProperty.call(f, key) ? f[key] : null;
  }

  function knownFigure(id) {
    try { return !!(EIA.cifra && EIA.cifra.has && EIA.cifra.has(id)); } catch (err) { return false; }
  }

  // ---------------------------------------------------------------------------------------------
  // Inline

  function emphasis(escaped) {
    return escaped
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(?=[^\s*])([^*]*?[^\s*])\*/g, '<em>$1</em>');
  }

  function citationHTML(label, key, mode) {
    var f = fuente(key);
    if (!f) return escape(label);
    if (mode === 'text') return '<span class="cite-text">' + emphasis(escape(label)) + '</span>';
    if (mode === 'link') {
      var hint = copy('ui.page.markup.nuevaPestana');
      return '<a class="ext-link" href="' + escape(f.url) + '" target="_blank" rel="noopener">' + emphasis(escape(label)) +
        '<span aria-hidden="true"> ↗</span>' + (hint ? '<span class="visually-hidden"> (' + escape(hint) + ')</span>' : '') + '</a>';
    }
    var prefix = copy('ui.page.markup.fuente');
    return '<button type="button" class="source-tag" data-cita="' + escape(key) + '" aria-haspopup="dialog" aria-expanded="false">' +
      (prefix ? '<span class="visually-hidden">' + escape(prefix) + ' </span>' : '') + emphasis(escape(label)) + '</button>';
  }

  function figureHTML(id, text) {
    if (!knownFigure(id)) return escape(text);
    return '<button type="button" class="fig" data-cifra="' + escape(id) + '" aria-haspopup="dialog" aria-expanded="false">' +
      escape(text) + '</button>';
  }

  function inline(text, opts) {
    opts = opts || {};
    var mode = opts.cite || 'tag';
    var pieces = [];
    function hold(html) { pieces.push(html); return PH_OPEN + (pieces.length - 1) + PH_CLOSE; }
    var s = str(text).replace(/[]/g, '');
    if (mode === 'tag') {
      s = s.replace(CITE_GROUP_RE, function (m, inner) {
        var keys = [], ok = true;
        inner.replace(CITE_RE, function (mm, label, key) { if (!fuente(key)) ok = false; keys.push(key); return mm; });
        if (!ok) return m;
        return inner.split(/\s*[;,]\s*(?=\[)/).map(function (part) { return part.trim(); }).join(' ');
      });
    }
    s = s.replace(CITE_RE, function (m, label, key) { return hold(citationHTML(label, key, mode)); });
    s = s.replace(FIG_RE, function (m, id, t) { return hold(figureHTML(id, t)); });
    var html = emphasis(escape(s));
    return html.replace(PH_RE, function (m, i) { return pieces[Number(i)]; });
  }

  // ---------------------------------------------------------------------------------------------
  // Updates ("Actualización" paragraphs and list items)

  function updateFor(text, updates) {
    if (!updates || !updates.length) return null;
    var keys = citations(text).map(function (c) { return c.key; });
    for (var i = 0; i < updates.length; i++) {
      if (updates[i] && keys.indexOf(updates[i].fuente) >= 0) return updates[i];
    }
    return null;
  }

  function updateBadge(text) {
    var label = copy('leyenda.actualizacion');
    var startsWithLabel = label && fold(plain(text)).trim().indexOf(fold(label)) === 0;
    return '<span class="update__badge"><span class="estado__sign estado__sign--actualizacion" aria-hidden="true"></span>' +
      (label && !startsWithLabel ? '<span class="update__label">' + escape(label) + '</span>' : '') + '</span>';
  }

  function updateClass(u) { return 'update' + (u.caja ? ' update--caja' : ''); }

  // ---------------------------------------------------------------------------------------------
  // Blocks

  // Splits a pipe-table row into cells; the "|" inside {{id|texto}} figures is not a cell border.
  function splitRow(line) {
    var held = [];
    var t = line.trim().replace(/[]/g, '').replace(FIG_RE, function (m) {
      held.push(m);
      return PH_OPEN + (held.length - 1) + PH_CLOSE;
    });
    if (t.charAt(0) === '|') t = t.slice(1);
    if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
    return t.split('|').map(function (c) {
      return c.trim().replace(PH_RE, function (m, i) { return held[Number(i)]; });
    });
  }

  function tableHTML(lines, opts) {
    var rows = lines.map(splitRow);
    var head = null;
    if (rows.length > 1 && rows[1].every(function (c) { return SEP_CELL_RE.test(c); })) {
      head = rows[0];
      rows = rows.slice(2);
    }
    rows = rows.filter(function (r) { return !r.every(function (c) { return SEP_CELL_RE.test(c); }); });
    var prefix = opts.tableLabel || copy('ui.page.markup.tabla');
    var name = head ? head.map(plain).join(', ') : '';
    var label = prefix && name ? prefix + ': ' + name : (prefix || name);
    var html = '<div class="table-wrap" role="region" tabindex="0"' + (label ? ' aria-label="' + escape(label) + '"' : '') + '><table>';
    if (head) {
      html += '<thead><tr>' + head.map(function (c) { return '<th scope="col">' + inline(c, opts) + '</th>'; }).join('') + '</tr></thead>';
    }
    html += '<tbody>' + rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td>' + inline(c, opts) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return html;
  }

  function listHTML(items, opts) {
    var i = 0;
    function build(level) {
      var first = items[i];
      var ordered = first.ordered;
      var start = ordered && first.number !== 1 ? ' start="' + first.number + '"' : '';
      var out = ordered ? '<ol' + start + '>' : '<ul>';
      while (i < items.length && items[i].level >= level) {
        var it = items[i];
        if (it.level === level && it.ordered !== ordered) break;
        if (it.level > level) { out = out.replace(/<\/li>$/, '') + build(it.level) + '</li>'; continue; }
        i++;
        var u = updateFor(it.text, opts.updates);
        var body = (u ? updateBadge(it.text) : '') + inline(it.text, opts);
        if (i < items.length && items[i].level > level) body += build(items[i].level);
        out += (u ? '<li class="' + updateClass(u) + '">' : '<li>') + body + '</li>';
      }
      return out + (ordered ? '</ol>' : '</ul>');
    }
    var html = '';
    while (i < items.length) html += build(items[i].level);
    return html;
  }

  function paragraphHTML(text, opts) {
    var u = updateFor(text, opts.updates);
    if (!u) return '<p>' + inline(text, opts) + '</p>';
    return '<div class="' + updateClass(u) + '">' + updateBadge(text) + '<p>' + inline(text, opts) + '</p></div>';
  }

  function render(text, opts) {
    opts = opts || {};
    var lines = str(text).replace(/\r\n?/g, '\n').split('\n');
    var out = [], para = [], i = 0;
    function flush() {
      if (para.length) out.push(paragraphHTML(para.join(' '), opts));
      para = [];
    }
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { flush(); i++; continue; }
      if (TABLE_RE.test(line)) {
        flush();
        var tl = [];
        while (i < lines.length && TABLE_RE.test(lines[i])) tl.push(lines[i++]);
        out.push(tableHTML(tl, opts));
        continue;
      }
      var m = LIST_RE.exec(line);
      if (m) {
        flush();
        var items = [];
        while (i < lines.length && (m = LIST_RE.exec(lines[i]))) {
          items.push({ level: Math.floor(m[1].length / 2), ordered: m[2] !== '-', number: m[2] === '-' ? 0 : parseInt(m[2], 10), text: m[3] });
          i++;
        }
        out.push(listHTML(items, opts));
        continue;
      }
      para.push(line.trim());
      i++;
    }
    flush();
    return out.join('');
  }

  // ---------------------------------------------------------------------------------------------
  // Plain text and references

  function plain(text) {
    return str(text)
      .replace(CITE_RE, '$1')
      .replace(FIG_RE, '$2')
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '$1')
      .replace(/\*(?=[^\s*])([^*]*?[^\s*])\*/g, '$1')
      .replace(/^ *(?:-|\d+\.) +/gm, '')
      .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, '')
      .replace(/\s*\|\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function citations(text) {
    var out = [];
    str(text).replace(CITE_RE, function (m, label, key) { out.push({ label: label, key: key }); return m; });
    return out;
  }

  function figures(text) {
    var out = [];
    str(text).replace(FIG_RE, function (m, id, t) { out.push({ id: id, text: t }); return m; });
    return out;
  }

  EIA.markup = {
    escape: escape,
    render: render,
    inline: inline,
    plain: plain,
    citations: citations,
    figures: figures
  };
})(typeof window !== 'undefined' ? window : globalThis);
