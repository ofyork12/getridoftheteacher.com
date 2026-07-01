/* =====================================================================
   Audiobook message board — shared front-end widget.

   Each player loads this once and sets a small config object first:

     <script>
       window.CMM_COMMENTS_CFG = {
         book: 'montecristo',                 // short id, matches the API
         chapters: CHAPTERS,                  // [{label, ...}]
         nowIndex:   () => currentIndex,      // chapter currently playing (-1 if none)
         nowSeconds: () => (audio && isFinite(audio.currentTime) ? audio.currentTime : 0)
       };
     </script>
     <script src="../audiobook-comments.js"></script>

   It injects its own styles + a modal, adds a "What did you think?" button
   to every chapter row and to the player controls, and talks to /api/comments.
   ===================================================================== */
(function () {
  var cfg = window.CMM_COMMENTS_CFG;
  if (!cfg || !cfg.book || !cfg.chapters) return;

  var BOOK = cfg.book;
  var CHAPTERS = cfg.chapters;
  var nowIndex = cfg.nowIndex || function () { return -1; };
  var nowSeconds = cfg.nowSeconds || function () { return 0; };
  var openFor = -1;                         // chapter index the modal is showing

  // ---- helpers ----
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  function ago(ms) {
    var d = Date.now() - ms;
    if (d < 60000) return "just now";
    if (d < 3600000) return Math.floor(d / 60000) + " min ago";
    if (d < 86400000) return Math.floor(d / 3600000) + " hr ago";
    var days = Math.floor(d / 86400000);
    if (days < 30) return days + (days === 1 ? " day ago" : " days ago");
    try { return new Date(ms).toLocaleDateString(); } catch (e) { return "a while ago"; }
  }

  // ---- styles ----
  var css = document.createElement("style");
  css.textContent =
    "#player .xrow{flex-wrap:wrap}" +
    ".chap .cmt{flex:0 0 auto;width:38px;height:38px;border-radius:9px;border:1px solid var(--line);" +
      "background:rgba(255,255,255,.04);color:var(--muted);font-size:16px;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;position:relative}" +
    ".chap .cmt .badge{position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;padding:0 3px;" +
      "border-radius:9px;background:var(--gold);color:var(--navy2,#0f1a2e);font-size:10px;font-weight:bold;" +
      "display:none;align-items:center;justify-content:center;line-height:16px}" +
    ".chap .cmt .badge.show{display:flex}" +
    "#cmtModal{position:fixed;inset:0;z-index:70;display:none;align-items:flex-end;justify-content:center;" +
      "background:rgba(0,0,0,.65)}" +
    "#cmtModal.show{display:flex}" +
    "#cmtSheet{background:var(--navy2,#12151c);border:1px solid var(--gold,#d8b25a);border-bottom:none;" +
      "border-radius:16px 16px 0 0;width:100%;max-width:620px;max-height:90vh;display:flex;flex-direction:column;" +
      "box-shadow:0 -18px 60px rgba(0,0,0,.6);color:var(--ink,#ede6d3);" +
      "font-family:Georgia,'Times New Roman',serif;padding-bottom:env(safe-area-inset-bottom)}" +
    "#cmtHead{display:flex;align-items:flex-start;gap:10px;padding:16px 18px 10px;border-bottom:1px solid var(--line)}" +
    "#cmtHead h3{margin:0;font-size:18px;color:var(--gold,#d8b25a);flex:1;line-height:1.25}" +
    "#cmtHead .sub{display:block;font-size:12px;color:var(--muted,#9fb0c8);font-style:italic;margin-top:2px}" +
    "#cmtClose{background:rgba(255,255,255,.06);border:1px solid var(--line);color:var(--ink);border-radius:9px;" +
      "width:34px;height:34px;font-size:18px;cursor:pointer;flex:0 0 auto}" +
    "#cmtList{overflow-y:auto;padding:12px 18px;flex:1;-webkit-overflow-scrolling:touch}" +
    "#cmtList .empty{color:var(--muted);font-style:italic;text-align:center;padding:22px 0;font-size:14px}" +
    ".cmt-item{padding:10px 0;border-bottom:1px solid var(--line)}" +
    ".cmt-item:last-child{border-bottom:none}" +
    ".cmt-item .who{font-size:13px;color:var(--gold-soft,#e7cf95);font-weight:bold}" +
    ".cmt-item .meta{font-size:11px;color:var(--muted);font-style:italic;margin-left:6px;font-weight:normal}" +
    ".cmt-item .txt{font-size:15px;line-height:1.45;margin-top:3px;white-space:pre-wrap;word-wrap:break-word}" +
    "#cmtForm{border-top:1px solid var(--line);padding:12px 18px 16px;background:rgba(255,255,255,.02)}" +
    "#cmtForm .nm{width:100%;margin-bottom:8px;background:rgba(255,255,255,.06);border:1px solid var(--line);" +
      "color:var(--ink);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:14px}" +
    "#cmtForm textarea{width:100%;min-height:64px;resize:vertical;background:rgba(255,255,255,.06);" +
      "border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px 11px;" +
      "font-family:inherit;font-size:15px;line-height:1.4}" +
    "#cmtForm .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}" +
    "#cmtForm .row2{display:flex;align-items:center;gap:10px;margin-top:9px}" +
    "#cmtSend{background:var(--gold,#d8b25a);color:var(--navy2,#12151c);border:none;border-radius:10px;" +
      "padding:11px 20px;font-family:inherit;font-size:15px;font-weight:bold;cursor:pointer}" +
    "#cmtSend:disabled{opacity:.55;cursor:default}" +
    "#cmtMsg{font-size:13px;color:var(--muted);flex:1}" +
    "#cmtMsg.err{color:var(--red,#e0524a)}" +
    "#cmtMsg.ok{color:#6fcf7f}" +
    ".cmt-xbtn{background:rgba(255,255,255,.06);border:1px solid var(--line);color:var(--gold-soft,#e7cf95);" +
      "border-radius:11px;padding:8px 14px;font-family:inherit;font-size:13px;cursor:pointer}";
  document.head.appendChild(css);

  // ---- modal DOM ----
  var modal = document.createElement("div");
  modal.id = "cmtModal";
  modal.innerHTML =
    '<div id="cmtSheet">' +
      '<div id="cmtHead">' +
        '<h3 id="cmtTitle">What did you think?<span class="sub" id="cmtSub"></span></h3>' +
        '<button id="cmtClose" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div id="cmtList"></div>' +
      '<form id="cmtForm" autocomplete="off">' +
        '<input class="hp" tabindex="-1" aria-hidden="true" id="cmtHp" placeholder="Leave this empty">' +
        '<input class="nm" id="cmtName" maxlength="24" placeholder="Your first name (optional)">' +
        '<textarea id="cmtBody" maxlength="400" placeholder="Share what you thought about this chapter…"></textarea>' +
        '<div class="row2">' +
          '<span id="cmtMsg"></span>' +
          '<button type="submit" id="cmtSend">Post</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  document.body.appendChild(modal);

  var elList = modal.querySelector("#cmtList");
  var elTitle = modal.querySelector("#cmtTitle");
  var elSub = modal.querySelector("#cmtSub");
  var elName = modal.querySelector("#cmtName");
  var elBody = modal.querySelector("#cmtBody");
  var elHp = modal.querySelector("#cmtHp");
  var elMsg = modal.querySelector("#cmtMsg");
  var elSend = modal.querySelector("#cmtSend");

  modal.querySelector("#cmtClose").addEventListener("click", closeBoard);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeBoard(); });
  modal.querySelector("#cmtForm").addEventListener("submit", submit);
  try { elName.value = localStorage.getItem("cmm.commenter") || ""; } catch (e) {}

  function setMsg(text, kind) { elMsg.textContent = text || ""; elMsg.className = kind || ""; }

  function renderList(comments) {
    if (!comments || !comments.length) {
      elList.innerHTML = '<div class="empty">No notes yet — be the first to say what you thought!</div>';
      return;
    }
    elList.innerHTML = "";
    comments.forEach(function (c) { appendOne(c, true); });
    elList.scrollTop = elList.scrollHeight;
  }

  function appendOne(c, fromNow) {
    var item = document.createElement("div");
    item.className = "cmt-item";
    var who = document.createElement("div");
    who.className = "who";
    who.textContent = c.name ? c.name : "A reader";
    var meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = (c.seconds ? "at " + fmt(c.seconds) + " · " : "") + (fromNow ? ago(c.created) : "just now");
    who.appendChild(meta);
    var txt = document.createElement("div");
    txt.className = "txt";
    txt.textContent = c.body;
    item.appendChild(who);
    item.appendChild(txt);
    elList.appendChild(item);
  }

  function openBoard(i) {
    openFor = i;
    var label = (CHAPTERS[i] && CHAPTERS[i].label) || ("Chapter " + (i + 1));
    elTitle.childNodes[0].nodeValue = "What did you think of " + label + "?";
    elSub.textContent = "";
    setMsg("");
    elBody.value = "";
    elList.innerHTML = '<div class="empty">Loading…</div>';
    modal.classList.add("show");
    fetch("/api/comments?book=" + encodeURIComponent(BOOK) + "&chapter=" + (i + 1), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.on === false) { elList.innerHTML = '<div class="empty">Comments aren’t switched on yet.</div>'; return; }
        renderList(d && d.comments);
      })
      .catch(function () { elList.innerHTML = '<div class="empty">Couldn’t load notes right now.</div>'; });
  }
  function closeBoard() { modal.classList.remove("show"); openFor = -1; }

  function submit(e) {
    e.preventDefault();
    if (openFor < 0) return;
    var text = elBody.value.trim();
    if (text.length < 2) { setMsg("Please write a little more.", "err"); return; }
    var name = elName.value.trim();
    // Pin to the current spot only if this is the chapter that's playing.
    var seconds = (nowIndex() === openFor) ? Math.floor(nowSeconds()) : 0;
    var label = (CHAPTERS[openFor] && CHAPTERS[openFor].label) || ("Chapter " + (openFor + 1));
    try { localStorage.setItem("cmm.commenter", name); } catch (e2) {}

    elSend.disabled = true;
    setMsg("Posting…");
    fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        book: BOOK, chapter: openFor + 1, name: name, body: text,
        seconds: seconds, label: label, website: elHp.value
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        d = d || {};
        if (!d.ok) { setMsg(d.error || "Couldn't post — please try again.", "err"); elSend.disabled = false; return; }
        elBody.value = "";
        elSend.disabled = false;
        if (d.shown && d.comment) {
          var empty = elList.querySelector(".empty");
          if (empty) empty.remove();
          appendOne(d.comment, false);
          elList.scrollTop = elList.scrollHeight;
          setMsg("Posted — thanks!", "ok");
          bumpBadge(openFor);
        } else {
          setMsg(d.message || "Thanks! Your note will appear once it's approved.", "ok");
        }
      })
      .catch(function () { setMsg("Couldn't post — check your connection.", "err"); elSend.disabled = false; });
  }

  function bumpBadge(i) {
    var b = document.querySelector('.chap[data-idx="' + i + '"] .cmt .badge');
    if (b) { var n = parseInt(b.textContent, 10) || 0; b.textContent = n + 1; b.classList.add("show"); }
  }

  // ---- wire buttons into the page ----
  function addRowButtons() {
    var rows = document.querySelectorAll(".chap");
    rows.forEach(function (row) {
      if (row.querySelector(".cmt")) return;
      var i = parseInt(row.dataset.idx, 10);
      var btn = document.createElement("button");
      btn.className = "cmt";
      btn.title = "What did you think of this chapter?";
      btn.innerHTML = "&#128172;<span class=\"badge\"></span>";
      btn.addEventListener("click", function (e) { e.stopPropagation(); openBoard(i); });
      row.appendChild(btn);
    });
  }
  function addPlayerButton() {
    var xrow = document.querySelector("#player .xrow");
    if (!xrow || xrow.querySelector(".cmt-xbtn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cmt-xbtn";
    btn.innerHTML = "&#128172; Comments";
    btn.addEventListener("click", function () {
      var i = nowIndex();
      if (i < 0) i = 0;
      openBoard(i);
    });
    xrow.appendChild(btn);
  }

  function init() { addRowButtons(); addPlayerButton(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  // Rows are built by the player's own script; re-scan shortly in case we ran first.
  setTimeout(init, 400);
})();
