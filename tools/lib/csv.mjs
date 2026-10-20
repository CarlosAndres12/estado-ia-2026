/* tools/lib/csv.mjs — a small RFC 4180 reader for the course's CSV sources (sesión 0 timeline).
 *
 * Dev-only (Node >= 20, built-ins only).
 *
 *   parseCsv(text)  -> [[field]]                 rows of fields; a leading UTF-8 BOM is dropped, quoted
 *                                                fields may hold commas, doubled quotes and newlines,
 *                                                CRLF or LF line ends, a final empty line is ignored
 *   readCsvObjects(text) -> [{ header: value }]  the first row as keys
 */

export function parseCsv(text) {
  const s = String(text == null ? '' : text).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function readCsvObjects(text) {
  const [header = [], ...rows] = parseCsv(text);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] == null ? '' : r[i]])));
}
