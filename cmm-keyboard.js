/* ============================================================
   ColorMyMath Standard Number Keyboard  —  cmm-keyboard.js
   One reusable, resizable keypad for every ColorMyMath game.

   Usage:
     <script src="/cmm-keyboard.js"></script>
     const kb = CMMKeyboard.mount('#myKeyboard', {
       onPress: function(n){ ... },   // 0–9 pressed
       onErase: function(){ ... },    // erase/backspace pressed
       size: 64,                      // optional start key size (px)
       controls: true,                // show the bigger/smaller buttons
       dotsBase: '/color-my-sudoku/img/'  // where dot<n>.png live
     });
     kb.setScale(80);                 // resize from code, any time

   Layout: a 2×5 grid of digit keys (1–5 over 6–7–8–9–0) plus an
   erase key. Each key shows the canonical colored DOTS for that
   number with the black DIGIT as a corner badge.
   Colors/shapes come from the shared dot images — never invented.
   ============================================================ */
(function (global) {
  // Canonical ColorMyMath number colors (used only for the key's border tint;
  // the dots themselves come from the images). Digits are always black.
  var HUE = {
    1:'#FF0000', 2:'#FF8C00', 3:'#F4FF07', 4:'#00C800', 5:'#1D50FE',
    6:'#C814FF', 7:'#B06A1F', 8:'#FF3DD1', 9:'#1AFFFF', 0:'#9aa3ad'
  };
  var MIN = 40, MAX = 120, STEP = 12, STORE = 'cmm-keyboard-size';

  var injected = false;
  function injectCSS() {
    if (injected) return; injected = true;
    var css = ''
      + '.cmk{--cmk-size:64px;display:inline-flex;flex-direction:column;'
      +   'gap:calc(var(--cmk-size)*.14);font-family:Arial,Helvetica,sans-serif;'
      +   '-webkit-tap-highlight-color:transparent;user-select:none;}'
      + '.cmk-grid{display:grid;grid-template-columns:repeat(5,var(--cmk-size));'
      +   'gap:calc(var(--cmk-size)*.14);}'
      + '.cmk-key{position:relative;width:var(--cmk-size);height:var(--cmk-size);'
      +   'background:#fff;border:3px solid var(--hue,#ccc);'
      +   'border-radius:calc(var(--cmk-size)*.18);cursor:pointer;padding:0;'
      +   'display:flex;align-items:center;justify-content:center;'
      +   'transition:transform .08s ease, box-shadow .12s ease;}'
      + '.cmk-key:hover{box-shadow:0 0 0 3px rgba(255,255,255,.25);}'
      + '.cmk-key:active{transform:translateY(2px) scale(.96);}'
      + '.cmk-dots{width:74%;height:74%;object-fit:contain;pointer-events:none;}'
      + '.cmk-digit{position:absolute;top:5%;left:8%;line-height:1;font-weight:800;'
      +   'color:#000;font-size:calc(var(--cmk-size)*.30);'
      +   'background:rgba(255,255,255,.82);border-radius:6px;padding:0 .12em;pointer-events:none;}'
      + '.cmk-key.zero .cmk-digit{position:static;top:auto;left:auto;background:none;'
      +   'font-size:calc(var(--cmk-size)*.52);}'
      + '.cmk-erase{height:calc(var(--cmk-size)*.78);border:3px solid #fff;background:#111;'
      +   'color:#fff;border-radius:calc(var(--cmk-size)*.18);cursor:pointer;'
      +   'font-size:calc(var(--cmk-size)*.34);font-weight:800;display:flex;'
      +   'align-items:center;justify-content:center;gap:.4em;}'
      + '.cmk-erase:active{transform:translateY(2px) scale(.98);}'
      + '.cmk-ctrls{display:flex;align-items:center;justify-content:center;gap:10px;'
      +   'color:#fff;font-size:14px;}'
      + '.cmk-ctrls button{width:34px;height:34px;border-radius:9px;border:2px solid #fff;'
      +   'background:transparent;color:#fff;font-size:20px;font-weight:800;cursor:pointer;'
      +   'line-height:1;display:flex;align-items:center;justify-content:center;}'
      + '.cmk-ctrls button:active{background:#fff;color:#000;}'
      + '.cmk-ctrls button:disabled{opacity:.35;cursor:default;}';
    var s = document.createElement('style'); s.id = 'cmk-style';
    s.textContent = css; document.head.appendChild(s);
  }

  function el(tag, cls){ var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function mount(target, opts) {
    opts = opts || {};
    injectCSS();
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error('CMMKeyboard: target not found');
    var base = opts.dotsBase || '/color-my-sudoku/img/';
    if (base.slice(-1) !== '/') base += '/';

    var root = el('div', 'cmk');
    var start = parseInt(opts.size, 10) || parseInt(localStorage.getItem(STORE), 10) || 64;
    start = Math.max(MIN, Math.min(MAX, start));
    root.style.setProperty('--cmk-size', start + 'px');

    var grid = el('div', 'cmk-grid');
    var order = [1,2,3,4,5,6,7,8,9,0];
    order.forEach(function (n) {
      var b = el('button', 'cmk-key' + (n === 0 ? ' zero' : ''));
      b.type = 'button';
      b.style.setProperty('--hue', HUE[n]);
      b.setAttribute('aria-label', String(n));
      b.dataset.n = n;
      var html = '';
      if (n !== 0) html += '<img class="cmk-dots" src="' + base + 'dot' + n + '.png" alt="">';
      html += '<span class="cmk-digit">' + n + '</span>';
      b.innerHTML = html;
      b.addEventListener('click', function () {
        if (typeof opts.onPress === 'function') opts.onPress(n);
      });
      grid.appendChild(b);
    });
    root.appendChild(grid);

    var erase = el('button', 'cmk-erase'); erase.type = 'button';
    erase.innerHTML = '⌫ <span style="font-size:.7em;letter-spacing:1px;">ERASE</span>';
    erase.addEventListener('click', function () {
      if (typeof opts.onErase === 'function') opts.onErase();
    });
    root.appendChild(erase);

    var minus, plus;
    function refreshCtrls() {
      if (!minus) return;
      var cur = parseInt(root.style.getPropertyValue('--cmk-size'), 10);
      minus.disabled = cur <= MIN; plus.disabled = cur >= MAX;
    }
    if (opts.controls !== false) {
      var ctrls = el('div', 'cmk-ctrls');
      minus = el('button'); minus.type = 'button'; minus.textContent = '−'; minus.title = 'Smaller';
      plus = el('button'); plus.type = 'button'; plus.textContent = '+'; plus.title = 'Bigger';
      var lbl = el('span'); lbl.textContent = 'Size';
      minus.addEventListener('click', function(){ bump(-STEP); });
      plus.addEventListener('click', function(){ bump(STEP); });
      ctrls.appendChild(minus); ctrls.appendChild(lbl); ctrls.appendChild(plus);
      root.appendChild(ctrls);
    }

    function setScale(px) {
      px = Math.max(MIN, Math.min(MAX, Math.round(px)));
      root.style.setProperty('--cmk-size', px + 'px');
      try { localStorage.setItem(STORE, px); } catch (e) {}
      refreshCtrls();
      return px;
    }
    function bump(d){ setScale(parseInt(root.style.getPropertyValue('--cmk-size'), 10) + d); }

    host.appendChild(root);
    refreshCtrls();

    return { el: root, setScale: setScale, bigger: function(){ bump(STEP); }, smaller: function(){ bump(-STEP); } };
  }

  global.CMMKeyboard = { mount: mount, colors: HUE };
})(window);
