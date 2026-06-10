/* ColorMyMath universal mute button.
 *
 * Drop-in: add <script src="mute-button.js"></script> high in a game page's
 * <head> (before the game's own audio code runs).  It:
 *   1. draws a floating speaker button (bottom-right),
 *   2. silences BOTH audio paths the games use -- HTML <audio> elements AND
 *      Web Audio (decodeAudioData + BufferSource) -- without touching each
 *      game's own code, and
 *   3. remembers the choice on the device (localStorage key 'cmm_muted') and
 *      syncs it live across every game iframe/tab on the site.
 *
 * Web Audio is silenced by rerouting each connection to ctx.destination through
 * a per-context gain node we can set to 0.  The context keeps RUNNING (so
 * 'ended'/onended and timers still fire and games that chain clips don't stall);
 * we just turn the volume to zero.
 */
(function () {
  if (window.__cmmMuteInit) return;
  window.__cmmMuteInit = true;

  var KEY = 'cmm_muted';
  var muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) {}
  window.__cmmMuted = muted;

  var gains = [];

  // --- Web Audio: reroute "-> destination" through a gain we can zero. ---
  if (window.AudioNode && AudioNode.prototype && AudioNode.prototype.connect) {
    var rawConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest) {
      try {
        var ctx = this.context;
        if (ctx && dest === ctx.destination) {
          var mg = ctx.__cmmGain;
          if (!mg) {
            mg = ctx.createGain();
            mg.gain.value = window.__cmmMuted ? 0 : 1;
            rawConnect.call(mg, ctx.destination);
            ctx.__cmmGain = mg;
            gains.push(mg);
          }
          var rest = Array.prototype.slice.call(arguments, 1);
          return rawConnect.apply(this, [mg].concat(rest));
        }
      } catch (e) {}
      return rawConnect.apply(this, arguments);
    };
  }

  // --- HTML <audio>/<video>: force current mute state on every play(). ---
  if (window.HTMLMediaElement && HTMLMediaElement.prototype && HTMLMediaElement.prototype.play) {
    var rawPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      try { this.muted = window.__cmmMuted; } catch (e) {}
      return rawPlay.apply(this, arguments);
    };
  }

  var btn = null;

  function updateBtn() {
    if (!btn) return;
    btn.textContent = muted ? '🔇' : '🔊'; // 🔇 / 🔊
    btn.setAttribute('aria-label', muted ? 'Sound is off. Tap to turn sound on.' : 'Sound is on. Tap to turn sound off.');
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.title = muted ? 'Sound off' : 'Sound on';
    btn.style.opacity = muted ? '0.55' : '1';
  }

  function applyState() {
    window.__cmmMuted = muted;
    for (var i = 0; i < gains.length; i++) {
      try { gains[i].gain.value = muted ? 0 : 1; } catch (e) {}
    }
    try {
      var media = document.querySelectorAll('audio,video');
      for (var j = 0; j < media.length; j++) { try { media[j].muted = muted; } catch (e) {} }
    } catch (e) {}
    updateBtn();
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) {}
    applyState();
  }

  function buildBtn() {
    if (btn || !document.body) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cmmMuteBtn';
    var s = btn.style;
    s.position = 'fixed';
    s.right = 'calc(env(safe-area-inset-right, 0px) + 8px)';
    s.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 8px)';
    s.zIndex = '2147483647';
    s.width = '44px';
    s.height = '44px';
    s.borderRadius = '50%';
    s.border = '2px solid rgba(255,255,255,0.85)';
    s.background = 'rgba(0,0,0,0.55)';
    s.color = '#fff';
    s.fontSize = '20px';
    s.lineHeight = '1';
    s.padding = '0';
    s.margin = '0';
    s.cursor = 'pointer';
    s.display = 'flex';
    s.alignItems = 'center';
    s.justifyContent = 'center';
    s.webkitTapHighlightColor = 'transparent';
    s.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    s.touchAction = 'manipulation';
    s.userSelect = 'none';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setMuted(!muted);
    });
    document.body.appendChild(btn);
    updateBtn();
  }

  // Live-sync across same-origin iframes/tabs.
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) {
      muted = (e.newValue === '1');
      applyState();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { buildBtn(); applyState(); });
  } else {
    buildBtn();
    applyState();
  }
})();
