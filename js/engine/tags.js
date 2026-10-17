/* Estado de la IA 2026 — source tags, evidence chips, estado signs and stamps (prompt §3.8, §4, §6.8).
 *
 * Every tag is built from the figure registry: tags.sourceTag(ctx, 'adop-1', …) reads
 * EIA.cifra('adop-1') (chip, short source label, scope, estado). Callers never type a source,
 * a scope or a number.
 *
 *   tags.sourceTag(ctx, cifraId | [ids], opts)  -> { x, y, w, h, hole } paper tag tied to a number
 *   tags.measureTag(ctx, cifraId, opts)        -> { w, h } without drawing
 *   tags.labelTag(ctx, text, opts)             -> { x, y, w, h, hole } same paper tag, free text from data
 *   tags.chip(ctx, clase, label, opts)         -> { x, y, w, h } evidence / neutral chip
 *   tags.measureChip(ctx, clase, label, opts)  -> { w, h }
 *   tags.estadoSign(ctx, estadoKey, x, y, size)
 *   tags.warningStamp(ctx, n, x, y, size, p, opts)
 *   tags.illustrativeStamp(ctx, x, y, scale, p) -> { x, y, w, h }
 *   tags.updateRibbon(ctx, x, y, scale, p)      -> { x, y, w, h }
 *   tags.marginNote(ctx, title, text, x, y, w, p, opts) -> { x, y, w, h }
 *
 * All positions are logical px; (x, y) is the top-left corner unless a function says "center".
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};
  var tags = E.tags = E.tags || {};

  var TAU = Math.PI * 2;
  function P() { return E.palette; }
  function M() { return E.palette.mundo; }
  function L() { return E.palette.legend; }
  function I() { return E.ink; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function seg(p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); }

  var warned = {};
  function warnOnce(msg) {
    if (warned[msg]) return;
    warned[msg] = true;
    if (root.console) root.console.warn('[tags] ' + msg);
  }

  function sign(ctx, name, x, y, size, o) {
    if (E.figures && E.figures.sign) E.figures.sign(ctx, name, x, y, size, o);
    else { ctx.fillStyle = M().tinta; ctx.beginPath(); ctx.arc(x, y, size * 0.3, 0, TAU); ctx.fill(); }
  }

  function cifraOf(id) {
    try { return EIA.cifra(id); } catch (err) { warnOnce(err.message || ('Cifra desconocida: ' + id)); return null; }
  }

  function fontSans(size, weight, italic) { return I().font({ size: size, weight: weight || 400, italic: !!italic, font: 'sans' }); }

  // ---------------------------------------------------------------------------------------------
  // Evidence chips: sign + verbatim label. Full form (sign in the type color) or monochrome.

  function chipSpec(clase, label) {
    var t = L().tipoByClase[clase];
    if (t) return { sign: t.sign, color: t.color, label: label || t.label, kind: 'tipo' };
    if (clase === 'neutral') return { sign: L().neutral.sign, color: M().tinta, label: label || '', kind: 'neutral' };
    return null;
  }

  function chipLayout(ctx, clase, label, o) {
    var spec = chipSpec(clase, label);
    if (!spec) return { w: 0, h: 0, spec: null };
    var size = o.size || 15;
    var signSize = spec.kind === 'neutral' ? size * 0.82 : size * 1.55;
    var gap = size * 0.4;
    ctx.font = fontSans(size, 700);
    var tw = ctx.measureText(spec.label).width;
    var pad = o.pill ? size * 0.6 : 0;
    var h = Math.max(signSize, size * 1.35) + (o.pill ? size * 0.5 : 0);
    var w = pad + signSize + gap + tw + pad;
    return { w: w, h: h, spec: spec, size: size, signSize: signSize, gap: gap, pad: pad, tw: tw };
  }

  tags.measureChip = function (ctx, clase, label, o) {
    var l = chipLayout(ctx, clase, label, o || {});
    return { w: l.w, h: l.h };
  };

  /* tags.chip(ctx, clase, label, opts) — clase: 'capacidad' | 'uso' | 'resultado' | 'expectativa' |
   * 'proyeccion' | 'neutral' ('ninguno' draws nothing). label: the verbatim KB "Tipo" (defaults to
   * the legend label). opts: x, y (top-left), size (label px, 15), mono, pill (outlined pill), p. */
  tags.chip = function (ctx, clase, label, o) {
    o = o || {};
    var l = chipLayout(ctx, clase, label, o);
    var x = o.x || 0, y = o.y || 0;
    if (!l.spec) return { x: x, y: y, w: 0, h: 0 };
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return { x: x, y: y, w: l.w, h: l.h };
    if (o.pill) {
      I().card(ctx, x, y, l.w, l.h, { radius: l.h / 2, weight: Math.max(1.6, l.size * 0.14), seed: 'chip:' + clase + ':' + l.spec.label, p: seg(p, 0, 0.6), grain: false });
    }
    var cy = y + l.h / 2;
    var colors = l.spec.kind === 'tipo' && !o.mono ? { a: l.spec.color } : null;
    sign(ctx, l.spec.sign, x + l.pad + l.signSize / 2, cy, l.signSize, { seed: 'chip', mono: !!o.mono || l.spec.kind === 'neutral', colors: colors, p: seg(p, 0, 0.7) });
    ctx.save();
    ctx.globalAlpha *= seg(p, 0.3, 0.9);
    ctx.font = fontSans(l.size, 700);
    ctx.fillStyle = o.color || M().tinta;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(l.spec.label, x + l.pad + l.signSize + l.gap, cy + l.size * 0.36);
    ctx.restore();
    return { x: x, y: y, w: l.w, h: l.h };
  };

  // ---------------------------------------------------------------------------------------------
  // Estado signs (prompt §4.3), tinta only, centered.

  tags.estadoSign = function (ctx, key, x, y, size, o) {
    var e = L().estados[key];
    if (!e) return;
    sign(ctx, e.sign, x, y, size, { seed: 'estado', colors: { a: M().tinta }, p: o && o.p, alpha: o && o.alpha });
  };

  // ---------------------------------------------------------------------------------------------
  // Source tag ("etiqueta de fuente"): cream paper tag, thick irregular outline, punched hole, a
  // thin calligraphic thread to its number, chip + short source label (+ scope when there is room),
  // estado sign in a corner when the figure is not "Verificada" (a ribbon for "Actualización").

  function tagContent(ids) {
    var list = Array.isArray(ids) ? ids : [ids], cs = [];
    for (var i = 0; i < list.length; i++) {
      var c = cifraOf(list[i]);
      if (c) cs.push(c);
    }
    if (!cs.length) return null;
    var labels = [];
    cs.forEach(function (c) { if (c.etiqueta && labels.indexOf(c.etiqueta) < 0) labels.push(c.etiqueta); });
    var estado = '';
    for (i = 0; i < cs.length; i++) if (cs[i].estadoKey && cs[i].estadoKey !== 'verificada') { estado = cs[i].estadoKey; break; }
    return {
      first: cs[0], chip: cs[0].chip, label: labels.join(' · '),
      scope: cs.length === 1 ? cs[0].alcanceTexto : '', estado: estado, key: cs.map(function (c) { return c.id; }).join('+')
    };
  }

  var tagLayoutCache = new Map();
  function tagLayout(ctx, ids, o) {
    var tc = tagContent(ids);
    if (!tc) return null;
    var k = o.scale || 1, maxW = (o.maxWidth || 300) * k;
    var key = tc.key + '|' + k + '|' + maxW + '|' + o.scope + '|' + (o.mono ? 1 : 0);
    var hit = tagLayoutCache.get(key);
    if (hit) return hit;
    var padL = 32 * k, padR = 14 * k, padT = 9 * k, padB = 10 * k;
    var chipSize = 13 * k, labelSize = 15.5 * k, scopeSize = 13 * k;
    var chip = chipLayout(ctx, tc.chip.clase, tc.chip.label, { size: chipSize });
    ctx.font = fontSans(labelSize, 700);
    var labelW = ctx.measureText(tc.label).width;
    var contentW = Math.min(Math.max(chip.w, labelW), maxW - padL - padR);
    var scopeLines = [];
    if (tc.scope && o.scope !== false) {
      var sw = Math.max(contentW, Math.min(200 * k, maxW - padL - padR));
      var lines = I().wrap(ctx, tc.scope, sw, fontSans(scopeSize, 400, true));
      var limit = o.scope === true ? 4 : 2;
      if (lines.length <= limit) {
        scopeLines = lines;
        ctx.font = fontSans(scopeSize, 400, true);
        for (var i = 0; i < lines.length; i++) contentW = Math.max(contentW, ctx.measureText(lines[i]).width);
      }
    }
    var h = padT + (chip.h ? chip.h + 3 * k : 0) + labelSize * 1.2 + (scopeLines.length ? 4 * k + scopeLines.length * scopeSize * 1.25 : 0) + padB;
    var w = padL + contentW + padR;
    var out = { tc: tc, k: k, w: w, h: h, padL: padL, padT: padT, chip: chip, chipSize: chipSize, labelSize: labelSize,
      scopeSize: scopeSize, scopeLines: scopeLines, labelW: labelW };
    try { if (!document.fonts || document.fonts.check(fontSans(labelSize, 700))) tagLayoutCache.set(key, out); } catch (e) { /* no DOM */ }
    return out;
  }

  tags.measureTag = function (ctx, ids, o) {
    var l = tagLayout(ctx, ids, o || {});
    return l ? { w: l.w, h: l.h } : { w: 0, h: 0 };
  };

  // Luggage-tag outline (chamfered at the hole end). Arrays are cached by size so the brush
  // geometry built from them is reused frame after frame.
  var tagShapes = new Map();
  function tagShape(w, h, k) {
    var key = Math.round(w * 2) + 'x' + Math.round(h * 2) + 'x' + k;
    var pts = tagShapes.get(key);
    if (!pts) {
      var c = Math.min(13 * k, h * 0.32);
      pts = [c, 0, w * 0.5, -0.6, w, 0, w + 0.6, h * 0.5, w, h, w * 0.5, h + 0.6, c, h, 0, h - c, -0.5, h * 0.5, 0, c];
      tagShapes.set(key, pts);
    }
    return pts;
  }

  /* tags.sourceTag(ctx, cifraId | [ids], opts) -> { x, y, w, h, hole } | null
   * opts: x, y (top-left), or near: { x, y, side: 'right' | 'left' | 'below' | 'above', gap } to place
   *   it beside a number; anchor: { x, y } the number the thread ties to (defaults to near);
   *   p (0→1), scale (1), maxWidth (300), scope ('auto' ≤ 2 lines | true | false), mono (chip in
   *   tinta, for frames that already carry a color legend), tilt (radians), ribbon (true). */
  tags.sourceTag = function (ctx, ids, o) {
    o = o || {};
    var l = tagLayout(ctx, ids, o);
    if (!l) return null;
    var k = l.k, x = o.x || 0, y = o.y || 0, w = l.w, h = l.h;
    if (o.near) {
      var gapN = o.near.gap == null ? 22 * k : o.near.gap, side = o.near.side || 'right';
      if (side === 'right') { x = o.near.x + gapN; y = o.near.y - h / 2; }
      else if (side === 'left') { x = o.near.x - gapN - w; y = o.near.y - h / 2; }
      else if (side === 'below') { x = o.near.x - 24 * k; y = o.near.y + gapN; }
      else { x = o.near.x - 24 * k; y = o.near.y - gapN - h; }
    }
    var anchor = o.anchor || (o.near ? { x: o.near.x, y: o.near.y } : null);
    var p = o.p == null ? 1 : o.p;
    var hole = { x: x + 15 * k, y: y + h / 2 };
    if (p <= 0) return { x: x, y: y, w: w, h: h, hole: hole };
    var m = M(), ink = I();
    var seed = 'tag:' + l.tc.key;
    var tilt = o.tilt == null ? E.rng.create(seed).jitter(0.018) : o.tilt;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    // Paper and outline.
    var shape = tagShape(w, h, k);
    var pf = seg(p, 0, 0.25);
    ink.shape(ctx, shape, { fill: m.lienzo, line: false, tex: false, edge: false, offset: 0, fillScale: 0, fillJitter: 0, seed: seed + 'f', p: pf, exact: true });
    ctx.save();
    ctx.globalAlpha *= pf * 0.55;
    ctx.fillStyle = ink.grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ink.shape(ctx, shape, { line: true, w: 3.2 * k, seed: seed + 'o' + Math.round(w) + 'x' + Math.round(h), p: seg(p, 0, 0.55), fillScale: 0 });
    // Punched hole with a reinforcement ring.
    var hx = 15 * k, hy = h / 2;
    ctx.globalAlpha = seg(p, 0.2, 0.4);
    ctx.fillStyle = m.lienzoOcre;
    ctx.beginPath(); ctx.arc(hx, hy, 4.6 * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = m.tinta; ctx.lineWidth = 1.4 * k;
    ctx.beginPath(); ctx.arc(hx, hy, 6.4 * k, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    // Content.
    var tp = seg(p, 0.3, 0.8), cy = l.padT;
    if (tp > 0) {
      if (l.chip.h) {
        tags.chip(ctx, l.tc.chip.clase, l.tc.chip.label, { x: l.padL, y: cy, size: l.chipSize, mono: !!o.mono, p: tp });
        cy += l.chip.h + 3 * k;
      }
      ctx.globalAlpha = tp;
      ctx.fillStyle = m.tinta;
      ctx.textBaseline = 'alphabetic';
      ctx.font = fontSans(l.labelSize, 700);
      ctx.fillText(l.tc.label, l.padL, cy + l.labelSize * 0.95);
      cy += l.labelSize * 1.2;
      if (l.scopeLines.length) {
        cy += 4 * k;
        ctx.font = fontSans(l.scopeSize, 400, true);
        ctx.fillStyle = P().mix(m.tinta, m.lienzo, 0.18);
        for (var i = 0; i < l.scopeLines.length; i++) ctx.fillText(l.scopeLines[i], l.padL, cy + l.scopeSize * 0.95 + i * l.scopeSize * 1.25);
      }
      ctx.globalAlpha = 1;
    }
    // Estado: corner sign, or the "Actualización" ribbon.
    var ep = seg(p, 0.55, 0.95);
    if (l.tc.estado && ep > 0) {
      if (l.tc.estado === 'actualizacion' && o.ribbon !== false) tags.updateRibbon(ctx, w - 70 * k, -13 * k, 0.62 * k, ep);
      else tags.estadoSign(ctx, l.tc.estado, w - 4 * k, 2 * k, 21 * k, { p: ep });
    }
    ctx.restore();

    // Thread from the number to the hole: thin, calligraphic, sagging slightly.
    if (anchor) {
      var thp = seg(p, 0.45, 1);
      if (thp > 0) {
        var c = Math.cos(tilt), s = Math.sin(tilt);
        var hxW = x + hx * c - hy * s, hyW = y + hx * s + hy * c;
        var dx = hxW - anchor.x, dy = hyW - anchor.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var sag = Math.min(26 * k, dist * 0.18);
        var pts = [anchor.x, anchor.y, anchor.x + dx * 0.5 + (-dy / dist) * sag * 0.3, anchor.y + dy * 0.5 + sag, hxW, hyW];
        ink.line(ctx, pts, { w: 2 * k, profile: 'hair', seed: seed + 'th', p: thp, color: m.tinta, dot: 1.6 });
      }
    }
    return { x: x, y: y, w: w, h: h, hole: hole };
  };

  /* tags.labelTag(ctx, text, opts) -> { x, y, w, h, hole }: a paper tag in the source-tag style
   * (cream paper, thick irregular outline, punched hole, thread to opts.anchor) holding free text
   * from data instead of a figure's source — e.g. the template «Fuente · Alcance · Tipo de
   * evidencia». It never stands in for a figure's real tag. opts: x, y (top-left) or near (as
   * sourceTag), anchor, p, scale (1), size (text px at scale 1, 17), maxWidth (300), tilt, seed. */
  tags.labelTag = function (ctx, text, o) {
    o = o || {};
    var k = o.scale || 1, ink = I(), m = M();
    var size = (o.size || 17) * k, padL = 32 * k, padR = 16 * k, padT = 11 * k, padB = 12 * k;
    var L = ink.measureText(ctx, String(text == null ? '' : text), { size: size, weight: 700, maxWidth: (o.maxWidth || 300) * k - padL - padR, lineHeight: 1.22 });
    var w = padL + L.w + padR, h = padT + L.h + padB;
    var x = o.x || 0, y = o.y || 0;
    if (o.near) {
      var gapN = o.near.gap == null ? 22 * k : o.near.gap, side = o.near.side || 'right';
      if (side === 'right') { x = o.near.x + gapN; y = o.near.y - h / 2; }
      else if (side === 'left') { x = o.near.x - gapN - w; y = o.near.y - h / 2; }
      else if (side === 'below') { x = o.near.x - 24 * k; y = o.near.y + gapN; }
      else { x = o.near.x - 24 * k; y = o.near.y - gapN - h; }
    }
    var anchor = o.anchor || (o.near ? { x: o.near.x, y: o.near.y } : null);
    var p = o.p == null ? 1 : o.p, hx = 15 * k, hy = h / 2;
    var hole = { x: x + hx, y: y + hy };
    if (p <= 0) return { x: x, y: y, w: w, h: h, hole: hole };
    var seed = 'label-tag:' + (o.seed || text);
    var tilt = o.tilt == null ? E.rng.create(seed).jitter(0.018) : o.tilt;
    var shape = tagShape(w, h, k);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    var pf = seg(p, 0, 0.25);
    ink.shape(ctx, shape, { fill: m.lienzo, line: false, tex: false, edge: false, offset: 0, fillScale: 0, fillJitter: 0, seed: seed + 'f', p: pf, exact: true });
    ctx.save();
    ctx.globalAlpha *= pf * 0.55;
    ctx.fillStyle = ink.grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ink.shape(ctx, shape, { line: true, w: 3.2 * k, seed: seed + 'o' + Math.round(w) + 'x' + Math.round(h), p: seg(p, 0, 0.55), fillScale: 0 });
    ctx.globalAlpha = seg(p, 0.2, 0.4);
    ctx.fillStyle = m.lienzoOcre;
    ctx.beginPath(); ctx.arc(hx, hy, 4.6 * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = m.tinta; ctx.lineWidth = 1.4 * k;
    ctx.beginPath(); ctx.arc(hx, hy, 6.4 * k, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    ink.text(ctx, String(text == null ? '' : text), padL, padT, { size: size, weight: 700, maxWidth: (o.maxWidth || 300) * k - padL - padR, lineHeight: 1.22, p: seg(p, 0.3, 0.8) });
    ctx.restore();
    if (anchor) {
      var thp = seg(p, 0.45, 1);
      if (thp > 0) {
        var c = Math.cos(tilt), sn = Math.sin(tilt);
        var hxW = x + hx * c - hy * sn, hyW = y + hx * sn + hy * c;
        var dx = hxW - anchor.x, dy = hyW - anchor.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var sag = Math.min(26 * k, dist * 0.18);
        var pts = [anchor.x, anchor.y, anchor.x + dx * 0.5 + (-dy / dist) * sag * 0.3, anchor.y + dy * 0.5 + sag, hxW, hyW];
        ink.line(ctx, pts, { w: 2 * k, profile: 'hair', seed: seed + 'th', p: thp, color: m.tinta, dot: 1.6 });
      }
    }
    return { x: x, y: y, w: w, h: h, hole: hole };
  };

  // ---------------------------------------------------------------------------------------------
  // Warning stamps (prompt §4.2): round ink stamps in tinta only, two signs separated by a
  // calligraphic crossed equals sign, the warning text below them.

  tags.warningStamp = function (ctx, n, x, y, size, p, o) {
    o = o || {};
    var adv = null, list = L().advertencias;
    for (var i = 0; i < list.length; i++) if (list[i].n === n) adv = list[i];
    if (!adv) { warnOnce('unknown warning: ' + n); return; }
    p = p == null ? 1 : p;
    if (p <= 0) return;
    var ink = I(), m = M(), R = size / 2;
    // Press: descends and lands (scale 1.18 → 1), then holds.
    var press = seg(p, 0, 0.4), land = 1 + 0.18 * (1 - press) * (1 - press);
    var rot = o.rot == null ? -0.08 + E.rng.create('stamp' + n).jitter(0.06) : o.rot;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(land, land);
    ctx.globalAlpha *= 0.94 * clamp(press * 1.6, 0, 1);
    var col = m.tinta;
    ink.circle(ctx, 0, 0, R * 0.95, { line: true, w: Math.max(2.4, size * 0.04), seed: 'stamp-ring' + n + Math.round(size), irr: 0.015 });
    ink.circle(ctx, 0, 0, R * 0.84, { line: true, w: Math.max(1.2, size * 0.014), seed: 'stamp-ring2' + n + Math.round(size), irr: 0.015 });
    var sy = -R * 0.2, ss = size * 0.27;
    sign(ctx, adv.signs[0], -R * 0.42, sy, ss, { seed: 'stamp', mono: true });
    sign(ctx, 'distinto', 0, sy, size * 0.16, { seed: 'stamp', mono: true });
    sign(ctx, adv.signs[1], R * 0.42, sy, ss, { seed: 'stamp', mono: true });
    if (o.text !== false) {
      var fs = Math.max(9, size * 0.072);
      var lay = ink.measureText(ctx, adv.texto, { size: fs, weight: 700, maxWidth: R * 1.25, maxLines: 2, fit: true, lineHeight: 1.12 });
      ink.text(ctx, adv.texto, 0, R * 0.2, { size: lay.size, weight: 700, maxWidth: R * 1.25, maxLines: 2, fit: true, lineHeight: 1.12, align: 'center', color: col });
    }
    if (o.number !== false) {
      ctx.font = fontSans(Math.max(9, size * 0.07), 700);
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(String(adv.n), 0, -R * 0.6);
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------------------------------------
  // "Ejemplo ilustrativo" stamp: tinta dashed outline, pencil sign, verbatim label.

  function stampBox(ctx, label, scale) {
    var k = scale || 1, size = 16 * k;
    ctx.font = fontSans(size, 700);
    var tw = ctx.measureText(label).width;
    return { k: k, size: size, w: 16 * k + 30 * k + 10 * k + tw + 16 * k, h: 44 * k, tw: tw };
  }
  tags.illustrativeStamp = function (ctx, x, y, scale, p) {
    var il = L().ilustrativo, b = stampBox(ctx, il.label, scale);
    p = p == null ? 1 : p;
    if (p <= 0) return { x: x, y: y, w: b.w, h: b.h };
    var k = b.k;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.025);
    I().card(ctx, 0, 0, b.w, b.h, { dashed: true, radius: 10 * k, weight: 2.8 * k, seed: 'ilustrativo', p: seg(p, 0, 0.7), dash: 11 * k, gap: 7 * k });
    sign(ctx, il.sign, 16 * k + 15 * k, b.h / 2, 30 * k, { seed: 'ilus', mono: true, p: seg(p, 0.2, 0.8) });
    ctx.globalAlpha *= seg(p, 0.35, 0.9);
    ctx.font = fontSans(b.size, 700);
    ctx.fillStyle = M().tinta;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(il.label, 16 * k + 30 * k + 10 * k, b.h / 2 + b.size * 0.36);
    ctx.restore();
    return { x: x, y: y, w: b.w, h: b.h };
  };

  // ---------------------------------------------------------------------------------------------
  // "Actualización" ribbon: small swallow-tailed banner with the crescent moon and the label.

  tags.updateRibbon = function (ctx, x, y, scale, p) {
    var k = scale || 1, label = L().estados.actualizacion.label, size = 15 * k;
    ctx.font = fontSans(size, 700);
    var tw = ctx.measureText(label).width;
    var w = 14 * k + 22 * k + 6 * k + tw + 16 * k, h = 30 * k, notch = 9 * k;
    p = p == null ? 1 : p;
    if (p <= 0) return { x: x, y: y, w: w, h: h };
    var pts = [0, 0, w, 0, w - notch, h / 2, w, h, 0, h, notch, h / 2];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.03);
    I().shape(ctx, pts, { fill: M().lienzoOcre, w: 2.6 * k, seed: 'ribbon' + Math.round(w), p: seg(p, 0, 0.6), fillScale: 0, offset: 1.5 * k });
    sign(ctx, L().estados.actualizacion.sign, 14 * k + 11 * k, h / 2, 22 * k, { seed: 'ribbon', colors: { a: M().tinta }, p: seg(p, 0.2, 0.8) });
    ctx.globalAlpha *= seg(p, 0.35, 0.9);
    ctx.font = fontSans(size, 700);
    ctx.fillStyle = M().tinta;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, 14 * k + 22 * k + 6 * k, h / 2 + size * 0.36);
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  };

  // ---------------------------------------------------------------------------------------------
  // Margin note: handwritten-style note with a small sign (glossary notes, facilitator tips).

  tags.marginNote = function (ctx, title, text, x, y, w, p, o) {
    o = o || {};
    p = p == null ? 1 : p;
    var ink = I(), m = M(), k = o.scale || 1;
    var titleSize = (o.titleSize || 19) * k, textSize = (o.textSize || 17) * k, padL = 40 * k, pad = 12 * k;
    var tl = ink.measureText(ctx, title || '', { size: titleSize, weight: 700, maxWidth: w - padL - pad });
    var bl = ink.measureText(ctx, text || '', { size: textSize, italic: true, maxWidth: w - padL - pad, lineHeight: 1.32 });
    var h = pad + (title ? tl.h + 4 * k : 0) + (text ? bl.h : 0) + pad;
    if (p <= 0) return { x: x, y: y, w: w, h: h };
    ctx.save();
    if (o.card !== false) {
      ctx.globalAlpha *= seg(p, 0, 0.3) * (o.cardAlpha == null ? 0.94 : o.cardAlpha);
      ink.card(ctx, x, y, w, h, { seed: 'note:' + (title || ''), weight: 1.6 * k, radius: 8 * k, outline: P().mix(m.tinta, m.lienzo, 0.35) });
      ctx.globalAlpha = 1;
    }
    ink.line(ctx, [x + 22 * k, y + pad + 22 * k, x + 18 * k, y + h * 0.55, x + 22 * k, y + h - pad], { w: 3 * k, profile: 'swell', seed: 'note-bracket' + Math.round(h), p: seg(p, 0.1, 0.6), dot: 'detached' });
    sign(ctx, o.sign || 'libreta', x + 20 * k, y + pad + 8 * k, 22 * k, { seed: 'note', p: seg(p, 0, 0.5) });
    var tp = seg(p, 0.25, 0.85), cy = y + pad;
    if (title) { ink.text(ctx, title, x + padL, cy, { size: titleSize, weight: 700, maxWidth: w - padL - pad, p: tp }); cy += tl.h + 4 * k; }
    if (text) ink.text(ctx, text, x + padL, cy, { size: textSize, italic: true, maxWidth: w - padL - pad, lineHeight: 1.32, p: tp });
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  };
})(typeof window !== 'undefined' ? window : globalThis);
