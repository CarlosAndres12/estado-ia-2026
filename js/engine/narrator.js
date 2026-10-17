/* Estado de la IA 2026 — narration and the playback clock (prompt §8.5).
 *
 *   var nar = EIA.engine.narrator.create(tl, { videoId, base, rate, voice });
 *
 * Three modes, decided once (`nar.ready` resolves when known):
 *   'audio'    the generated track (EIA.audioManifest[videoId].file) is the master clock: play,
 *              pause, seek and rate go through the <audio> element (preservesPitch on) and the
 *              canvas follows audio.currentTime. Used only when the timeline was built from that
 *              same manifest (tl.source === 'manifest'), so voice and frames agree.
 *   'browser'  speechSynthesis with the best Spanish voice per role; the clock is internal, each
 *              subtitle chunk is spoken at its start time and the frame holds while an utterance
 *              overruns its slot; seeking cancels the speech; durations are the timeline's
 *              estimates (~2.4 words/s).
 *   'silent'   neither exists: an internal clock, subtitles only. The site works before any audio.
 * If the audio file fails to load, the mode falls back to 'browser' or 'silent' (nar.onchange).
 *
 *   nar.tick(nowMs) -> t     advance the clock once per animation frame (performance.now())
 *   nar.time()               last t
 *   nar.play() / pause() / seek(t) / setRate(r) / setVoice(on)
 *   nar.playing, nar.holding, nar.mode
 *   nar.canCapture()         { ok, reason: '' | 'file' | 'browser' | 'silent' | 'off' }
 *   nar.captureStream()      { stream, release() } with the narration for MediaRecorder, or null
 *   nar.destroy()
 *   EIA.engine.narrator.pickVoices(voices) -> { narrador, lectora, pitch: { narrador, lectora } }
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.engine = EIA.engine || {};

  var MAX_DT = 0.25;        // a long frame never jumps the internal clock further than this
  var LEAD_SPEAK = 0.05;    // a seek that lands this close before a chunk still speaks it

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function now() { return root.performance && root.performance.now ? root.performance.now() : Date.now(); }

  // ---------------------------------------------------------------------------------------------
  // Voice choice (prompt §8.5). Voice lists carry no gender, so names decide it.

  var FEMALE = /\b(dalia|renata|nuria|paulina|sabina|m[oó]nica|helena|laura|elvira|luc[ií]a|elena|marisol|paloma|sof[ií]a|larissa|beatriz|candela|carlota|marta|pilar|isabel|alicia|esperanza|juanita|francisca|ximena|catalina|camila|valentina|lupe|pen[eé]lope|conchita|ang[eé]lica|teresa|irene|female|mujer|woman)\b/i;
  var MALE = /\b(jorge|ra[uú]l|pablo|diego|juan|carlos|jaime|[aá]lvaro|enrique|miguel|gonzalo|gerardo|cecilio|liberto|luciano|yago|andr[eé]s|sergio|tom[aá]s|emilio|gabriel|antonio|arnau|dar[ií]o|el[ií]as|esteban|federico|lorenzo|sa[uú]l|male|hombre|man)\b/i;

  function langTier(lang) {
    var l = String(lang || '').replace('_', '-').toLowerCase();
    if (l === 'es-mx') return 0;
    if (l === 'es-co' || l === 'es-419' || l === 'es-us') return 1;
    if (l === 'es-es') return 2;
    if (l === 'es' || l.indexOf('es-') === 0) return 3;
    return -1;
  }

  function genderOf(v) {
    var name = String(v && v.name || '');
    if (FEMALE.test(name)) return 'f';
    if (MALE.test(name)) return 'm';
    if (/^google espa[nñ]ol/i.test(name)) return 'f';  // Google's Spanish voices are female
    return '';
  }

  // Narrador: "Jorge" es-MX > any male es-MX > es-CO / es-419 / es-US > es-ES > any es-*
  // (male first inside each step).
  function narradorRank(v) {
    var tier = langTier(v.lang), g = genderOf(v);
    var step = tier === 0 && /jorge/i.test(v.name || '') ? 0 : tier === 0 && g === 'm' ? 1 : tier === 1 ? 2 : tier === 2 ? 3 : 4;
    return [step, g === 'm' ? 0 : g === '' ? 1 : 2];
  }

  // Lectora: a female voice in the same order.
  function lectoraRank(v) {
    var tier = langTier(v.lang), g = genderOf(v);
    return [g === 'f' ? 0 : g === '' ? 1 : 2, tier];
  }

  function best(list, rank) {
    var top = null, topKey = null;
    list.forEach(function (v, i) {
      var key = rank(v).concat([i]);
      if (!topKey) { top = v; topKey = key; return; }
      for (var k = 0; k < key.length; k++) {
        if (key[k] < topKey[k]) { top = v; topKey = key; return; }
        if (key[k] > topKey[k]) return;
      }
    });
    return top;
  }

  function pickVoices(voices) {
    var es = Array.prototype.filter.call(voices || [], function (v) { return langTier(v.lang) >= 0; });
    var out = { narrador: null, lectora: null, pitch: { narrador: 1, lectora: 1 } };
    if (!es.length) return out;
    out.narrador = best(es, narradorRank);
    var others = es.filter(function (v) { return v !== out.narrador; });
    var women = others.filter(function (v) { return genderOf(v) === 'f'; });
    out.lectora = best(women.length ? women : others, lectoraRank) || out.narrador;
    // Only one voice: the lectora uses it a little higher, so the two roles still differ.
    if (out.lectora === out.narrador) out.pitch.lectora = 1.15;
    return out;
  }

  var voicesPromise = null;
  function loadVoices() {
    if (voicesPromise) return voicesPromise;
    voicesPromise = new Promise(function (resolve) {
      var synth = root.speechSynthesis;
      if (!synth || typeof synth.getVoices !== 'function') { resolve([]); return; }
      var list = synth.getVoices();
      if (list && list.length) { resolve(list); return; }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve(synth.getVoices() || []);
      }
      if (synth.addEventListener) synth.addEventListener('voiceschanged', finish);
      else synth.onvoiceschanged = finish;
      setTimeout(finish, 1500);
    });
    return voicesPromise;
  }
  // Ask early: browsers load their voice list asynchronously.
  if (root.speechSynthesis && typeof root.speechSynthesis.getVoices === 'function') {
    try { root.speechSynthesis.getVoices(); } catch (err) { /* voices load later */ }
  }

  // ---------------------------------------------------------------------------------------------
  // Speech slots: one per subtitle chunk, so subtitles and the browser voice move together and
  // long lines never hit the cut-off some browsers apply to long utterances. A line with an
  // explicit `say` is spoken whole (its chunks are display text only).

  function buildSlots(tl) {
    var slots = [];
    tl.lines.forEach(function (line) {
      if (line.say) {
        slots.push({ start: line.start, end: line.end, text: line.say, voice: line.voice, rate: line.rate });
        return;
      }
      (line.chunks || []).forEach(function (c) {
        slots.push({ start: c.start, end: c.end, text: c.text, voice: line.voice, rate: line.rate });
      });
    });
    return slots;
  }

  function firstSlotFrom(slots, t) {
    for (var i = 0; i < slots.length; i++) if (slots[i].start >= t - LEAD_SPEAK) return i;
    return slots.length;
  }

  // ---------------------------------------------------------------------------------------------

  function create(tl, opts) {
    opts = opts || {};
    var manifest = (EIA.audioManifest || {})[opts.videoId || tl.id];
    var nar = {
      mode: 'silent',
      playing: false,
      holding: false,
      onchange: null,
      ready: null
    };
    var t = 0;
    var rate = opts.rate || 1;
    var voiceOn = opts.voice !== false;
    var lastNow = -1;
    var audio = null, audioLive = false;
    var synth = root.speechSynthesis || null;
    var voices = null;
    var slots = buildSlots(tl);
    var nextSlot = 0;
    var active = null;          // { slot, index, done, since }
    var resumeSlot = -1;        // slot interrupted by a pause, spoken again on play
    var audioCtx = null, mediaSource = null;
    var destroyed = false;

    function setMode(mode) {
      if (nar.mode === mode) return;
      nar.mode = mode;
      if (typeof nar.onchange === 'function') nar.onchange(mode);
    }

    function fallbackMode() {
      return loadVoices().then(function (list) {
        voices = pickVoices(list);
        setMode(voices.narrador && synth ? 'browser' : 'silent');
      });
    }

    // --- audio-track mode -------------------------------------------------------------------
    function startAudio() {
      return new Promise(function (resolve) {
        try {
          audio = new root.Audio();
        } catch (err) {
          audio = null;
          resolve(false);
          return;
        }
        audio.preload = 'metadata';
        audio.preservesPitch = true;
        audio.mozPreservesPitch = true;
        audio.webkitPreservesPitch = true;
        var settled = false;
        function settle(ok) {
          if (settled) return;
          settled = true;
          resolve(ok);
        }
        audio.addEventListener('loadedmetadata', function () { settle(true); });
        audio.addEventListener('error', function () {
          if (!settled) { settle(false); return; }
          // failed after it was chosen: continue on the internal clock, without the track
          audioLive = false;
          fallbackMode();
        });
        audio.addEventListener('ended', function () { audioLive = false; });
        setTimeout(function () { settle(audio && audio.readyState >= 1); }, 8000);
        audio.src = (opts.base || '') + manifest.file;
      });
    }

    var canUseAudio = manifest && manifest.file && tl.source === 'manifest' && typeof root.Audio === 'function';
    nar.ready = (canUseAudio ? startAudio().then(function (ok) {
      if (ok) {
        audioLive = true;
        audio.muted = !voiceOn;
        setMode('audio');
        return undefined;
      }
      audio = null;
      return fallbackMode();
    }) : fallbackMode()).then(function () { return nar.mode; }, function () { return nar.mode; });

    // --- browser-voice mode -----------------------------------------------------------------
    function speak(index) {
      var slot = slots[index];
      if (!slot || !synth || !voices || !voices.narrador) return;
      var role = slot.voice === 'lectora' ? 'lectora' : 'narrador';
      var u;
      try {
        u = new root.SpeechSynthesisUtterance(slot.text);
      } catch (err) {
        return;
      }
      var voice = voices[role] || voices.narrador;
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = clamp(rate * (slot.rate || 1), 0.5, 2);
      u.pitch = voices.pitch[role] || 1;
      var entry = { slot: slot, index: index, done: false, since: 0, utter: u };
      u.onend = u.onerror = function () { entry.done = true; };
      active = entry;
      try {
        synth.speak(u);
      } catch (err) {
        entry.done = true;
      }
    }

    function stopSpeech() {
      active = null;
      nar.holding = false;
      if (synth) {
        try { synth.cancel(); } catch (err) { /* nothing to cancel */ }
      }
    }

    // Advance from `prev` to `next`: hold while the current utterance overruns its slot, then
    // start every slot whose start time has been reached.
    function advanceSpeech(prev, next, ms) {
      if (active && !active.done) {
        if (synth && !synth.speaking && !synth.pending) active.done = true;
      }
      if (active && !active.done && next > active.slot.end) {
        if (!active.since) active.since = ms;
        var limit = Math.max(2500, (active.slot.end - active.slot.start) * 1500);
        if (ms - active.since < limit) {
          nar.holding = true;
          return Math.max(prev, active.slot.end);
        }
        active.done = true;   // the voice never reported its end: let the video go on
      }
      nar.holding = false;
      // Every slot that starts by `next` is due; only the latest one is spoken (slots last longer
      // than a frame, so normally there is exactly one).
      var due = -1;
      while (nextSlot < slots.length && slots[nextSlot].start <= next) due = nextSlot++;
      if (due >= 0) {
        speak(due);
        if (next > slots[due].end) next = slots[due].end;
      }
      return next;
    }

    // --- clock ------------------------------------------------------------------------------
    nar.time = function () { return t; };

    nar.tick = function (ms) {
      if (ms == null) ms = now();
      if (!nar.playing || destroyed) { lastNow = ms; return t; }
      if (nar.mode === 'audio' && audio && audioLive) {
        if (audio.ended) {
          audioLive = false;
        } else {
          t = audio.currentTime;
          lastNow = ms;
          return t;
        }
      }
      var dt = lastNow < 0 ? 0 : clamp((ms - lastNow) / 1000, 0, MAX_DT);
      lastNow = ms;
      var next = t + dt * rate;
      if (nar.mode === 'browser' && voiceOn) next = advanceSpeech(t, next, ms);
      t = Math.min(next, tl.duration);
      return t;
    };

    nar.play = function () {
      if (nar.playing || destroyed) return;
      nar.playing = true;
      lastNow = -1;
      if (nar.mode === 'audio' && audio) {
        if (t < (audio.duration || Infinity) - 0.05) {
          audioLive = true;
          audio.playbackRate = rate;
          if (Math.abs(audio.currentTime - t) > 0.05) audio.currentTime = t;
          var p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function () { audioLive = false; });   // blocked or failed: frames go on
          }
        } else {
          audioLive = false;
        }
      } else if (nar.mode === 'browser' && voiceOn) {
        if (resumeSlot >= 0 && slots[resumeSlot] && t < slots[resumeSlot].end) {
          // a pause cut this chunk: say it again from its start
          t = Math.max(0, slots[resumeSlot].start);
          nextSlot = resumeSlot;
        } else {
          nextSlot = firstSlotFrom(slots, t);
        }
        resumeSlot = -1;
      }
    };

    nar.pause = function () {
      if (!nar.playing) return;
      nar.playing = false;
      if (audio) audio.pause();
      if (nar.mode === 'browser') {
        resumeSlot = active && !active.done ? active.index : -1;
        stopSpeech();
      }
    };

    nar.seek = function (target) {
      t = clamp(Number(target) || 0, 0, tl.duration);
      lastNow = -1;
      resumeSlot = -1;
      if (nar.mode === 'audio' && audio) {
        var d = audio.duration;
        if (!d || t < d - 0.05) {
          audio.currentTime = t;
          audioLive = true;
          if (nar.playing && audio.paused) {
            var p = audio.play();
            if (p && typeof p.catch === 'function') p.catch(function () { audioLive = false; });
          }
        } else {
          audioLive = false;
          audio.pause();
        }
      }
      if (nar.mode === 'browser') {
        stopSpeech();
        nextSlot = firstSlotFrom(slots, t);
      }
    };

    nar.setRate = function (r) {
      rate = r > 0 ? r : 1;
      if (audio) audio.playbackRate = rate;
      if (nar.mode === 'browser' && nar.playing) {
        nar.pause();
        nar.play();
      }
    };

    nar.setVoice = function (on) {
      voiceOn = !!on;
      if (audio) audio.muted = !voiceOn;
      if (nar.mode === 'browser') {
        stopSpeech();
        nextSlot = firstSlotFrom(slots, t);
      }
    };

    nar.voiceOn = function () { return voiceOn; };

    // --- recording ----------------------------------------------------------------------------
    nar.canCapture = function () {
      if (nar.mode === 'browser') return { ok: false, reason: 'browser' };
      if (nar.mode !== 'audio' || !audio) return { ok: false, reason: 'silent' };
      if (root.location && root.location.protocol === 'file:') return { ok: false, reason: 'file' };
      if (!voiceOn) return { ok: false, reason: 'off' };
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return { ok: false, reason: 'silent' };
      return { ok: true, reason: '' };
    };

    nar.captureStream = function () {
      if (!nar.canCapture().ok) return null;
      try {
        if (!audioCtx) {
          var AC = root.AudioContext || root.webkitAudioContext;
          audioCtx = new AC();
          mediaSource = audioCtx.createMediaElementSource(audio);
          mediaSource.connect(audioCtx.destination);   // keep hearing it while recording
        }
        if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
        var dest = audioCtx.createMediaStreamDestination();
        mediaSource.connect(dest);
        return {
          stream: dest.stream,
          release: function () {
            try { mediaSource.disconnect(dest); } catch (err) { /* already disconnected */ }
          }
        };
      } catch (err) {
        return null;
      }
    };

    nar.destroy = function () {
      destroyed = true;
      nar.playing = false;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        try { audio.load(); } catch (err) { /* released */ }
      }
      if (nar.mode === 'browser') stopSpeech();
      if (audioCtx && audioCtx.close) audioCtx.close();
    };

    return nar;
  }

  EIA.engine.narrator = {
    create: create,
    pickVoices: pickVoices,
    loadVoices: loadVoices,
    genderOf: genderOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
