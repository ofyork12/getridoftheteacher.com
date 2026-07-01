// Cloudflare Pages Function — per-chapter audiobook message board.
//
// Every audiobook chapter gets a little "What did you think?" board. Visitors
// read what others wrote about that chapter and add their own note, optionally
// pinned to the moment they were at (e.g. "at 4:32").
//
// Storage: a Cloudflare KV namespace bound as `COMMENTS`.
//   Cloudflare dashboard -> Pages -> getridoftheteacher -> Settings -> Functions
//   -> KV namespace bindings -> add: Variable name = COMMENTS, pick/create a
//   namespace (e.g. "audiobook-comments"). No code change needed once set.
//
// One KV entry per comment (key below), so two people posting to the same
// chapter can never overwrite each other. A compact copy of the comment is
// stored in the key's metadata, so listing a chapter usually needs no extra
// reads.
//
//   key:  cmt:<book>:<chap3>:<created>:<rand>
//   value/metadata: { name, body, seconds, label, created, status }
//   status: "shown" (visible) | "hidden" (removed by admin) | "pending"
//
// Moderation: with AUTO_APPROVE = true, comments appear immediately and are
// filtered on the way in (no links, bad-word block, length + rate limits); you
// delete anything unwanted from book-comments-admin.html. Flip AUTO_APPROVE to
// false to hold every new comment as "pending" until you approve it there.

const AUTO_APPROVE = false;         // false = approve-before-showing (kids-safest)
const MAX_BODY = 400;               // characters
const MAX_NAME = 24;
const MAX_LABEL = 60;
const RATE_SECONDS = 20;            // one post per IP per this many seconds
const LIST_MAX = 300;               // max comments returned for one chapter

// Admin password. Set a Pages env var COMMENTS_PASS to override this default.
const DEFAULT_ADMIN_PASS = "colormymath";

// Bad-word block, stored base64-encoded so the source file stays clean.
// To edit: decode, change the comma-separated list, re-encode to base64.
const BAD_WORDS = atob(
  "ZnVjayxzaGl0LGJpdGNoLGN1bnQsYXNzaG9sZSxkaWNrLHBpc3MsYmFzdGFyZCxzbHV0LHdob3Jl" +
  "LG5pZ2dlcixmYWdnb3QscmV0YXJkLHBvcm4sdmlhZ3JhLGNpYWxpcyxjYXNpbm8="
).split(",");

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const pad3 = (n) => String(Math.max(0, n | 0)).padStart(3, "0");
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const cleanBook = (s) => clean(s).toLowerCase().replace(/[^a-z0-9._-]/g, "");

// A tiny random suffix so simultaneous posts get unique keys.
function rand() {
  try { return crypto.randomUUID().slice(0, 8); } catch (_) { return "x" + (globalThis.performance ? Math.floor(performance.now()) : 0); }
}

function hasLink(s) {
  return /https?:\/\//i.test(s) || /www\./i.test(s) || /\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|info|biz|shop|link)\b/i.test(s);
}
function hasBadWord(s) {
  const low = " " + s.toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ";
  return BAD_WORDS.some((w) => low.includes(" " + w + " "));
}

function commentFromKey(k) {
  const m = k.metadata;
  if (m && m.body != null) {
    return { name: m.name || "", body: m.body, seconds: m.seconds || 0, label: m.label || "",
             created: m.created || 0, status: m.status || "shown" };
  }
  return null; // caller falls back to a value read
}

// ---------------------------------------------------------- GET: list a chapter
// /api/comments?book=montecristo&chapter=3
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const book = cleanBook(url.searchParams.get("book"));
  const chapter = parseInt(url.searchParams.get("chapter"), 10);

  if (!env.COMMENTS) return json({ ok: true, on: false, comments: [] });
  if (!book || !Number.isFinite(chapter)) return json({ ok: false, error: "book and chapter required" }, 400);

  const prefix = `cmt:${book}:${pad3(chapter)}:`;
  let out = [];
  try {
    const listed = await env.COMMENTS.list({ prefix, limit: 1000 });
    for (const k of listed.keys) {
      let c = commentFromKey(k);
      if (!c) { const v = await env.COMMENTS.get(k.name, "json"); if (v) c = v; }
      if (c && c.status === "shown") out.push({ name: c.name, body: c.body, seconds: c.seconds || 0, created: c.created });
    }
  } catch (_) {}
  out.sort((a, b) => a.created - b.created);
  if (out.length > LIST_MAX) out = out.slice(-LIST_MAX);
  return json({ ok: true, on: true, comments: out });
}

// ---------------------------------------------------------- POST: add / admin
export async function onRequestPost(context) {
  const { request, env } = context;
  let body = {};
  try { body = await request.json(); } catch (_) {}
  const action = String(body.action || "add");

  const adminPass = (env.COMMENTS_PASS || DEFAULT_ADMIN_PASS) + "";
  const authed = () => String(body.pass || "") === adminPass;

  // ---- admin: list everything (including hidden/pending) ----
  if (action === "admin-list") {
    if (!authed()) return json({ ok: false, error: "wrong password" }, 401);
    if (!env.COMMENTS) return json({ ok: true, comments: [] });
    const items = [];
    let cursor;
    do {
      const listed = await env.COMMENTS.list({ prefix: "cmt:", limit: 1000, cursor });
      for (const k of listed.keys) {
        const parts = k.name.split(":"); // cmt : book : chap : created : rand
        let c = commentFromKey(k);
        if (!c) { const v = await env.COMMENTS.get(k.name, "json"); if (v) c = v; }
        if (c) items.push({ key: k.name, book: parts[1], chapter: parseInt(parts[2], 10),
                            name: c.name, body: c.body, seconds: c.seconds || 0, label: c.label || "",
                            created: c.created, status: c.status });
      }
      cursor = listed.list_complete ? null : listed.cursor;
    } while (cursor);
    items.sort((a, b) => b.created - a.created);
    return json({ ok: true, comments: items });
  }

  // ---- admin: delete / hide / approve one ----
  if (action === "delete" || action === "hide" || action === "approve") {
    if (!authed()) return json({ ok: false, error: "wrong password" }, 401);
    if (!env.COMMENTS) return json({ ok: false, error: "comments not enabled" }, 400);
    const key = String(body.key || "");
    if (!key.startsWith("cmt:")) return json({ ok: false, error: "bad key" }, 400);
    if (action === "delete") {
      await env.COMMENTS.delete(key);
    } else {
      const c = await env.COMMENTS.get(key, "json");
      if (c) {
        c.status = action === "approve" ? "shown" : "hidden";
        await env.COMMENTS.put(key, JSON.stringify(c), { metadata: c });
      }
    }
    return json({ ok: true });
  }

  // ---- public: add a comment ----
  if (!env.COMMENTS) {
    return json({ ok: false, error: "Comments aren't switched on yet. (Add the COMMENTS binding in Cloudflare.)" }, 503);
  }

  // Honeypot: real people leave this hidden field empty. Bots fill it. Pretend success.
  if (clean(body.website)) return json({ ok: true, held: true });

  const book = cleanBook(body.book);
  const chapter = parseInt(body.chapter, 10);
  const name = clean(body.name).slice(0, MAX_NAME);
  const text = clean(body.body).slice(0, MAX_BODY);
  const label = clean(body.label).slice(0, MAX_LABEL);
  const seconds = Math.max(0, Math.min(86400, parseInt(body.seconds, 10) || 0));

  if (!book || !Number.isFinite(chapter)) return json({ ok: false, error: "Missing book or chapter." }, 400);
  if (text.length < 2) return json({ ok: false, error: "Please write a little more." }, 400);
  if (hasLink(text) || hasLink(name)) return json({ ok: false, error: "Sorry — links aren't allowed here." }, 400);
  if (hasBadWord(text) || hasBadWord(name)) return json({ ok: false, error: "Please keep it friendly — that wording isn't allowed." }, 400);

  // Rate limit per IP.
  const ip = request.headers.get("CF-Connecting-IP") || "0";
  const rlKey = `rl:${ip}`;
  try {
    if (await env.COMMENTS.get(rlKey)) return json({ ok: false, error: "You're posting quickly — wait a few seconds and try again." }, 429);
    await env.COMMENTS.put(rlKey, "1", { expirationTtl: RATE_SECONDS });
  } catch (_) {}

  const created = Date.now();
  const status = AUTO_APPROVE ? "shown" : "pending";
  const record = { name, body: text, seconds, label, created, status };
  const key = `cmt:${book}:${pad3(chapter)}:${created}:${rand()}`;

  // Keep metadata under KV's 1KB limit; else store status only and let the
  // reader fall back to a value read.
  const metaFits = JSON.stringify(record).length < 900;
  try {
    await env.COMMENTS.put(key, JSON.stringify(record), { metadata: metaFits ? record : { status, created } });
  } catch (_) {
    return json({ ok: false, error: "Couldn't save that just now — please try again." }, 500);
  }

  return json({ ok: true, shown: status === "shown",
    comment: status === "shown" ? { name, body: text, seconds, created } : null,
    message: status === "shown" ? "" : "Thanks! Your note will appear once it's approved." });
}
