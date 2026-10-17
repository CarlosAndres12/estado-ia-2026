/* Estado de la IA 2026 — "Descargar video" (prompt §7).
 *
 *   var ui = EIA.engine.recorder.mount(panelBody, host);   // built by player.js on first open
 *   ui.cancel()                                             // stops and discards a recording
 *   EIA.engine.recorder.mimeType(withAudio) -> best supported MediaRecorder type ('' = default)
 *
 * With an exported MP4 (EIA.videoExports[id], assets/video/index.js) it offers "Descargar MP4".
 * Otherwise it records one real-time linear pass of the player's own canvas:
 * canvas.captureStream(24) plus the narration (Web Audio MediaElementSource ->
 * MediaStreamDestination, audio-track mode over http(s) only) into MediaRecorder with a 1 s
 * timeslice, preferring video/mp4, then webm vp9 + opus, then the browser default. Before it
 * starts it says how long it takes, to keep the tab visible and, when the voice cannot be
 * captured (file://, browser voice, no narration yet), that the file will have no voice. Progress
 * is shown outside the canvas; a hidden tab pauses the pass and the recorder. Also offers
 * "Descargar este capítulo". The file is <slug>.mp4 / <slug>.webm (<slug>-capitulo-N for a chapter).
 *
 * host (player.js): { id, slug, title, duration, chapters, base, canvas, exportInfo,
 *   currentChapter(), voice() -> { ok, reason }, audioStream() -> { stream, release } | null,
 *   announce(text), begin({ from, to }, { onProgress(done, total), onEnd() }) -> Promise,
 *   hold(paused), end() } */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.engine = EIA.engine || {};
  var doc = root.document;

  function copy() {
    var c = EIA.data && EIA.data.course && EIA.data.course.ui && EIA.data.course.ui.player;
    return (c && c.descarga) || {};
  }
  function txt(key, vars) {
    return String(copy()[key] == null ? '' : copy()[key]).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : '';
    });
  }
  function clock(t) { return EIA.util.formatClock(t); }

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return node;
  }

  function mimeType(withAudio) {
    var MR = root.MediaRecorder;
    if (!MR || typeof MR.isTypeSupported !== 'function') return '';
    var list = withAudio ?
      ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'] :
      ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (var i = 0; i < list.length; i++) if (MR.isTypeSupported(list[i])) return list[i];
    return '';
  }

  function supported(canvas) {
    return typeof root.MediaRecorder === 'function' && canvas && typeof canvas.captureStream === 'function';
  }

  function mount(body, host) {
    var job = null;
    body.innerHTML = '';
    var status = el('p', { class: 'player__rec-status', 'aria-live': 'polite' });
    var choices = el('div', { class: 'player__rec-choices' });
    var notice = el('div', { class: 'player__rec-notice', hidden: true });
    var progressBox = el('div', { class: 'player__rec-progress', hidden: true });
    var bar = el('progress', { max: '100', value: '0', 'aria-label': txt('progreso') });
    var progressText = el('span', { class: 'player__rec-time' });
    var stopBtn = el('button', { type: 'button', class: 'btn', text: txt('detener'), onclick: function () { cancel(); } });
    progressBox.appendChild(bar);
    progressBox.appendChild(progressText);
    progressBox.appendChild(stopBtn);

    var exp = host.exportInfo;
    if (exp && exp.file) {
      var mb = exp.bytes ? txt('megabytes', { n: (exp.bytes / 1048576).toFixed(1).replace('.', ',') }) : '';
      choices.appendChild(el('p', {}, [
        el('a', { class: 'btn btn--primary', href: host.base + exp.file, download: String(exp.file).split('/').pop(), text: txt('mp4') }),
        ' ',
        el('span', { class: 'player__rec-detail', text: txt('mp4Detalle', { tamano: mb, tiempo: clock(exp.duration || host.duration) }) })
      ]));
    } else {
      choices.appendChild(el('p', {}, [
        el('button', { type: 'button', class: 'btn btn--primary', text: txt('grabar'), onclick: function () { prepare(null); } }),
        ' ',
        el('span', { class: 'player__rec-detail', text: txt('grabarDetalle', { tiempo: clock(host.duration) }) })
      ]));
    }
    var chapterDetail = el('span', { class: 'player__rec-detail' });
    choices.appendChild(el('p', {}, [
      el('button', { type: 'button', class: 'btn', text: txt('capitulo'), onclick: function () { prepare(host.currentChapter()); } }),
      ' ', chapterDetail
    ]));
    function refreshChapter() {
      var ch = host.currentChapter();
      chapterDetail.textContent = txt('capituloDetalle', { n: ch.index + 1, titulo: ch.title, tiempo: clock(ch.end - ch.start) });
    }
    refreshChapter();
    body.addEventListener('focusin', refreshChapter);
    body.addEventListener('pointerenter', refreshChapter);

    body.appendChild(choices);
    body.appendChild(notice);
    body.appendChild(progressBox);
    body.appendChild(status);

    function say(text) {
      status.textContent = text;
    }

    function prepare(chapter) {
      if (job) return;
      if (!supported(host.canvas)) { say(txt('noSoportado')); return; }
      var range = chapter ? { from: chapter.start, to: chapter.end, chapter: chapter } : { from: 0, to: host.duration, chapter: null };
      var voice = host.voice();
      notice.innerHTML = '';
      notice.appendChild(el('p', { text: txt('aviso', { tiempo: clock(range.to - range.from) }) }));
      if (!voice.ok) {
        var key = { file: 'sinVozArchivo', browser: 'sinVozNavegador', off: 'sinVozApagada' }[voice.reason] || 'sinVozNinguna';
        notice.appendChild(el('p', { class: 'player__rec-warning', text: txt(key) }));
      }
      notice.appendChild(el('p', {}, [
        el('button', { type: 'button', class: 'btn btn--primary', text: txt('empezar'), onclick: function () { start(range, voice.ok); } }),
        ' ',
        el('button', { type: 'button', class: 'btn', text: txt('cancelar'), onclick: function () { notice.hidden = true; choices.hidden = false; } })
      ]));
      choices.hidden = true;
      notice.hidden = false;
      say('');
      var first = notice.querySelector('button');
      if (first) first.focus();
    }

    function start(range, withVoice) {
      var stream, audio = null, recorder, type;
      try {
        stream = host.canvas.captureStream(24);
        if (withVoice) {
          audio = host.audioStream();
          if (audio) audio.stream.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
        }
        type = mimeType(!!audio);
        recorder = new root.MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6000000 } : undefined);
      } catch (err) {
        say(txt('error', { detail: '', detalle: err && err.message || String(err) }));
        if (audio) audio.release();
        return;
      }
      var parts = [];
      job = { recorder: recorder, stream: stream, audio: audio, range: range, discard: false, type: type || recorder.mimeType || 'video/webm' };
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) parts.push(e.data); };
      recorder.onerror = function (e) {
        say(txt('error', { detalle: (e && e.error && e.error.message) || '' }));
        finish(true);
      };
      recorder.onstop = function () {
        var discard = job ? job.discard : true;
        var mime = job ? job.type : 'video/webm';
        var range0 = job ? job.range : range;
        cleanup();
        if (discard) { say(txt('descartada')); return; }
        var ext = /mp4/.test(mime) ? '.mp4' : '.webm';
        var name = host.slug + (range0.chapter ? '-' + txt('archivoCapitulo', { n: range0.chapter.index + 1 }) : '') + ext;
        var blob = new Blob(parts, { type: mime.split(';')[0] });
        parts = [];
        var url = URL.createObjectURL(blob);
        var a = el('a', { href: url, download: name, hidden: true });
        doc.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        say(txt('listo', { archivo: name }));
        host.announce(txt('listo', { archivo: name }));
      };
      notice.hidden = true;
      progressBox.hidden = false;
      bar.value = 0;
      progressText.textContent = txt('grabando', { actual: clock(0), total: clock(range.to - range.from) });
      doc.addEventListener('visibilitychange', onVisibility);
      recorder.start(1000);
      host.begin(range, {
        onProgress: function (done, total) {
          bar.value = Math.round(100 * done / (total || 1));
          progressText.textContent = txt('grabando', { actual: clock(done), total: clock(total) });
        },
        onEnd: function () { finish(false); }
      });
    }

    function onVisibility() {
      if (!job) return;
      var hidden = doc.hidden;
      try {
        if (hidden && job.recorder.state === 'recording') job.recorder.pause();
        else if (!hidden && job.recorder.state === 'paused') job.recorder.resume();
      } catch (err) { /* pause unsupported: the pass still waits */ }
      host.hold(hidden);
      say(hidden ? txt('enPausa') : '');
    }

    function finish(discard) {
      if (!job) return;
      job.discard = discard;
      host.end();
      try {
        if (job.recorder.state !== 'inactive') job.recorder.stop();
        else cleanup();
      } catch (err) { cleanup(); }
    }

    function cleanup() {
      doc.removeEventListener('visibilitychange', onVisibility);
      if (job) {
        job.stream.getTracks().forEach(function (tr) { tr.stop(); });
        if (job.audio) job.audio.release();
      }
      job = null;
      progressBox.hidden = true;
      choices.hidden = false;
    }

    function cancel() { finish(true); }

    return { cancel: cancel };
  }

  EIA.engine.recorder = { mount: mount, mimeType: mimeType };
})(typeof window !== 'undefined' ? window : globalThis);
