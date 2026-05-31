/* audio-library.js -- shared audio engine for the whole site.
 *
 * Drop this on a page with <script src="audio-library.js"></script> and
 * use window.AudioLib in your game / lesson HTML.  One Web Audio engine
 * shared by every clip; src.stop(0) means the next sound can't ever
 * overlap the previous one.
 *
 * Public API
 * ----------
 *   AudioLib.registerClips({ key: dataUri, ... })   -- decode & cache clips
 *   AudioLib.play(key)                              -- play one clip
 *   AudioLib.playChain(items, opts)                 -- play sequence
 *   AudioLib.stopAll()                              -- cut every active source
 *   AudioLib.say(text, opts)                        -- TTS fallback
 *   AudioLib.isReady(key)                           -- is a clip decoded yet?
 *
 * Equation emphasis (the user's "emphasis codes for equations as they are
 * voiced"): each item in playChain can be either a plain key string OR an
 * object { key, emphasize, onStart, onEnd, gap }.  `emphasize` accepts an
 * Element (toggles class "audio-emph") OR a function called like
 * { add(), remove() }.  The previous clip's emphasis is removed before the
 * next one starts, so visual highlight follows the voice automatically.
 *
 * Example:
 *   AudioLib.playChain([
 *     { key: '2',       emphasize: pairEl },     // says "two", highlights pair
 *     { key: 'plus' },
 *     { key: '1',       emphasize: existingEl }, // says "one", highlights existing
 *     { key: 'equals' },
 *     { key: '3',       emphasize: totalEl }     // says "three", highlights total
 *   ]);
 */
(function (global) {
  if (global.AudioLib) return;            // already loaded; don't redefine

  // --- AudioContext (lazy, resumed on every call so mobile autoplay is happy) ---
  let _ctx = null;
  function getCtx() {
    if (!_ctx) {
      try { _ctx = new (global.AudioContext || global.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (_ctx.state === 'suspended') { try { _ctx.resume(); } catch (e) {} }
    return _ctx;
  }

  // --- decoded buffers ---
  const _buffers = {};
  const _decodePromises = {};            // key -> Promise<boolean>, so callers can await

  function _b64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  // Decode and store a clip under `key`.  Accepts a data: URI string OR a
  // pre-decoded AudioBuffer.  Returns a Promise resolving to true/false.
  function _loadClip(key, dataUriOrBuffer) {
    if (dataUriOrBuffer && dataUriOrBuffer.length != null && dataUriOrBuffer.duration != null) {
      // already an AudioBuffer
      _buffers[key] = dataUriOrBuffer;
      return Promise.resolve(true);
    }
    if (typeof dataUriOrBuffer !== 'string') return Promise.resolve(false);
    const c = getCtx();
    if (!c) return Promise.resolve(false);
    const comma = dataUriOrBuffer.indexOf(',');
    if (comma < 0) return Promise.resolve(false);
    try {
      const arr = _b64ToArrayBuffer(dataUriOrBuffer.slice(comma + 1));
      const p = c.decodeAudioData(arr)
        .then(buf => { _buffers[key] = buf; return true; })
        .catch(() => false);
      _decodePromises[key] = p;
      return p;
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  // Bulk register: { key: dataUri, ... }.  Returns Promise<{key: true|false}>.
  function registerClips(dict) {
    const promises = [];
    const keys = [];
    for (const k in dict) {
      if (!Object.prototype.hasOwnProperty.call(dict, k)) continue;
      keys.push(k);
      promises.push(_loadClip(k, dict[k]));
    }
    return Promise.all(promises).then(results => {
      const summary = {};
      keys.forEach((k, i) => { summary[k] = results[i]; });
      return summary;
    });
  }

  // --- active sources (so stopAll can kill them synchronously) ---
  const _active = new Set();

  // Build a source that routes through a GainNode so stopAll can ramp the
  // gain to 0 *before* the audio reaches the system output buffer.  Without
  // this, src.stop(0) leaves a brief audible tail on Android because the
  // sound is already buffered downstream of the source -- the user heard
  // this as "one extra voice" bleeding into the next clip.
  function _makeSource(buf) {
    const c = getCtx();
    if (!c) return null;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    src.connect(gain);
    gain.connect(c.destination);
    src._gain = gain;
    return src;
  }

  function stopAll() {
    const c = _ctx;
    _chainToken++;                                    // invalidate any in-flight chain
    for (const src of _active) {
      // Replace onended with a cleanup-only handler so the 8ms gain ramp
      // can finish silently before src.stop() fires its 'ended' event.
      // We MUST NOT call src.disconnect() synchronously here -- the audio
      // thread short-circuits the scheduled ramp the moment the node leaves
      // the graph, and the system buffer gets to play the un-faded tail.
      const gain = src._gain;
      src.onended = function () {
        try { src.disconnect(); } catch (e) {}
        if (gain) { try { gain.disconnect(); } catch (e) {} }
      };
      try {
        if (gain && c) {
          const now = c.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.012);   // 12ms ramp to silence
        }
      } catch (e) {}
      try { src.stop(c ? c.currentTime + 0.018 : 0); }              // stop just after ramp
      catch (e) { try { src.stop(0); } catch (e2) {} }
    }
    _active.clear();
  }

  // --- single-clip play (returns the BufferSource, or null) ---
  function play(key) {
    const c = getCtx();
    if (!c) return null;
    const buf = _buffers[key];
    if (!buf) return null;
    const src = _makeSource(buf);
    if (!src) return null;
    src.onended = () => {
      _active.delete(src);
      try { src.disconnect(); } catch (e) {}
      if (src._gain) { try { src._gain.disconnect(); } catch (e) {} }
    };
    _active.add(src);
    try { src.start(0); } catch (e) {
      _active.delete(src);
      return null;
    }
    return src;
  }

  // --- chain of clips with per-clip emphasis ---
  // items: each is a string (key) OR { key, emphasize, onStart, onEnd, gap }
  //   emphasize: Element (toggles 'audio-emph' class) or { add(), remove() }
  // opts:  { gap (default 140ms), onDone }
  // Returns a Promise that resolves when finished or interrupted.
  let _chainToken = 0;

  function _applyEmphasis(emph) {
    if (!emph) return null;
    if (typeof emph.add === 'function' && typeof emph.remove === 'function') {
      try { emph.add(); } catch (e) {}
      return emph;
    }
    if (emph.classList) {
      emph.classList.add('audio-emph');
      return { remove: () => { try { emph.classList.remove('audio-emph'); } catch (e) {} } };
    }
    return null;
  }

  function playChain(items, opts) {
    opts = opts || {};
    stopAll();
    const c = getCtx();
    if (!c) return Promise.resolve();
    const defaultGap = opts.gap != null ? opts.gap : 140;
    const myToken = ++_chainToken;
    let i = 0;
    let prevEmph = null;

    return new Promise(resolve => {
      const finish = () => {
        if (prevEmph) { try { prevEmph.remove(); } catch (e) {} prevEmph = null; }
        if (opts.onDone) { try { opts.onDone(); } catch (e) {} }
        resolve();
      };
      const playNext = () => {
        if (myToken !== _chainToken) { finish(); return; }
        if (i >= items.length) { finish(); return; }
        const raw = items[i++];
        const item = typeof raw === 'string' ? { key: raw } : (raw || { key: '' });

        // Swap emphasis -- remove previous, apply current.
        if (prevEmph) { try { prevEmph.remove(); } catch (e) {} prevEmph = null; }
        prevEmph = _applyEmphasis(item.emphasize);
        if (item.onStart) { try { item.onStart(); } catch (e) {} }

        const buf = _buffers[item.key];
        if (!buf) {
          if (item.onEnd) { try { item.onEnd(); } catch (e) {} }
          playNext();
          return;
        }
        const src = _makeSource(buf);
        if (!src) { playNext(); return; }
        const gapAfter = item.gap != null ? item.gap : defaultGap;
        src.onended = () => {
          _active.delete(src);
          try { src.disconnect(); } catch (e) {}
          if (src._gain) { try { src._gain.disconnect(); } catch (e) {} }
          if (item.onEnd) { try { item.onEnd(); } catch (e) {} }
          if (myToken !== _chainToken) { finish(); return; }
          setTimeout(playNext, gapAfter);
        };
        _active.add(src);
        try { src.start(0); }
        catch (e) {
          _active.delete(src);
          if (item.onEnd) { try { item.onEnd(); } catch (e) {} }
          if (myToken === _chainToken) playNext();
        }
      };
      playNext();
    });
  }

  // --- TTS fallback for clips we haven't recorded yet ---
  function say(text, opts) {
    opts = opts || {};
    stopAll();
    if (!('speechSynthesis' in global)) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = opts.rate  != null ? opts.rate  : 0.95;
    u.pitch = opts.pitch != null ? opts.pitch : 1.0;
    u.volume= opts.volume!= null ? opts.volume: 1.0;
    speechSynthesis.speak(u);
  }

  function isReady(key) { return !!_buffers[key]; }

  global.AudioLib = {
    registerClips: registerClips,
    play: play,
    playChain: playChain,
    stopAll: stopAll,
    say: say,
    isReady: isReady
  };
})(window);
