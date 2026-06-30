// Cloudflare Pages Function — "Find a game" recommender.
// Same idea as Shania's /api/admin/ask: a small server endpoint that runs
// Workers AI (Llama 3.3 70B). Here it reads the ColorMyMath game catalog and
// recommends which game/lesson a visitor should open for what their kid needs.
//
// Requires a Workers AI binding named `AI` on the Pages project
// (Cloudflare dashboard → Pages → getridoftheteacher → Settings → Functions →
//  Bindings → add "Workers AI", variable name AI). No code change needed once set.

// ── The catalog the AI may recommend from. URLs MUST be real pages on the site.
// The AI is told to ONLY use these urls; anything it invents is dropped server-side.
const CATALOG = [
  { url: "start-here.html",            title: "Start Here",              teaches: "where to begin — the recommended ColorMyMath path for a brand-new learner", tags: "begin start first new where do I start path order" },
  { url: "number-practice.html",       title: "Numbers 1 to 10",        teaches: "recognizing the numbers 1–10 and how many each one is", tags: "numbers recognition 1 to 10 what number names of numbers" },
  { url: "counting-to-10.html",        title: "Counting to 10",         teaches: "counting objects 1–10 with colored dots; counts forward AND backward", tags: "count counting to 10 backward backwards forward ten-frame" },
  { url: "count-to-20.html",           title: "Counting to 20",         teaches: "counting past ten to 20; a second ten-frame fills with colored dots", tags: "count counting to 20 past ten teen numbers twenty" },
  { url: "count-to-5-dots.html",       title: "Roll to 5 (marble game)", teaches: "a playful marble-run counting game for numbers 1–5", tags: "count to 5 marbles roll balls game play five fun" },
  { url: "bigger-smaller.html",        title: "Bigger / Smaller",       teaches: "comparing two amounts — which is more, which is less, bigger vs smaller", tags: "bigger smaller more less compare comparing greater fewer than" },
  { url: "math-five.html",             title: "Five and Under",         teaches: "all the numbers up to 5 — building number sense within 5", tags: "five and under within 5 numbers up to five number sense" },
  { url: "math-ten.html",              title: "Ten and Under",          teaches: "all the numbers up to 10 — building number sense within 10", tags: "ten and under within 10 numbers up to ten number sense" },
  { url: "making-10.html",             title: "Making 10",              teaches: "finding the pairs that add up to 10 (number bonds of 10)", tags: "making 10 make ten pairs add to 10 number bonds friends of ten" },
  { url: "making-10-pairs.html",       title: "Make 10 — Two Numbers",  teaches: "a game: pick two numbers that combine to make 10", tags: "make 10 two numbers pairs game add combine ten bonds" },
  { url: "partitions-of-10.html",      title: "Every Way to Make 10",   teaches: "all the different ways to split 10 into two parts (decomposing 10)", tags: "partitions of 10 split decompose break apart ways to make ten parts" },
  { url: "easy-addition.html",         title: "Easy Addition",          teaches: "a gentle first introduction to adding", tags: "easy addition adding first plus beginner intro start adding" },
  { url: "addition.html",              title: "Addition (1 to 5)",      teaches: "adding small numbers within 5", tags: "addition add plus sums within 5 small numbers" },
  { url: "subtraction.html",           title: "Subtraction (taking away)", teaches: "taking away — subtraction with small numbers", tags: "subtraction subtract take away minus less" },
  { url: "subtraction-from-10.html",   title: "Subtraction from 10",    teaches: "subtracting from 10 (the other half of the make-10 facts)", tags: "subtraction from 10 minus take away ten subtract" },
  { url: "multiplication-3d.html",     title: "Squares & Cubes",        teaches: "square and cube numbers shown in 2-D and spinning 3-D", tags: "squares cubes multiplication times square numbers cube 3d" },
  { url: "squares-2d.html",            title: "Squares",                teaches: "square numbers laid out as dots (1, 4, 9, 16 …)", tags: "squares square numbers area dots times itself" },
  { url: "clocks.html",                title: "Clocks",                 teaches: "telling time with colorful clocks", tags: "clock clocks time telling time hours minutes o'clock" },
  { url: "my-colors.html",             title: "Make It Your Colors",    teaches: "pick your own color for each number — used across all the games", tags: "colors color picker my colors choose pick customize palette" },
  { url: "audiobooks.html",            title: "Audio Books",            teaches: "listen to classic stories read aloud", tags: "audio books read aloud stories listening reading library" },
  { url: "language-learning.html",     title: "Language Learning",      teaches: "picture-and-word vocabulary in other languages", tags: "language vocabulary french spanish chinese words foreign" },
];

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Plain keyword fallback so the page still works even if AI is unavailable.
function keywordPicks(q) {
  const words = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = CATALOG.map((c) => {
    const hay = (c.title + " " + c.teaches + " " + c.tags).toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score++;
    return { c, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => ({ title: x.c.title, url: x.c.url, why: x.c.teaches }));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let q = "";
  try {
    const body = await request.json();
    q = (body && body.q ? String(body.q) : "").trim();
  } catch (_) {}
  if (!q) return json({ ok: false, error: "Please type what your child needs help with." }, 400);
  if (q.length > 500) q = q.slice(0, 500);

  const valid = new Set(CATALOG.map((c) => c.url));

  // No AI binding configured yet → keyword fallback so the feature still works.
  if (!env.AI) {
    const picks = keywordPicks(q);
    return json({ ok: true, ai: false, message: picks.length
      ? "Here are the closest matches:"
      : "I couldn't find a close match — try a word like \"counting\", \"adding\", or \"make 10\".", picks });
  }

  const catalogText = CATALOG
    .map((c) => `- url: ${c.url} | title: ${c.title} | teaches: ${c.teaches}`)
    .join("\n");

  const system =
    "You are the friendly guide for ColorMyMath, a website of colorful math games for young children. " +
    "A parent or teacher tells you what their child needs. Recommend 1 to 3 games from the catalog below that fit best. " +
    "ONLY recommend games from the catalog, and ONLY use their exact urls. Never invent a url or a game. " +
    "Be warm and brief — write for a busy grown-up. " +
    "Reply with ONLY valid JSON, no markdown, in this exact shape: " +
    '{"message":"<one short friendly sentence>","picks":[{"title":"<exact catalog title>","url":"<exact catalog url>","why":"<one short reason for this child>"}]}\n\n' +
    "CATALOG:\n" + catalogText;

  let parsed = null;
  try {
    const out = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: q },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    const text = (out && (out.response || out.result || "")) + "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch (_) {
    parsed = null;
  }

  // Validate AI output: keep only picks whose url is a real catalog page.
  let picks = [];
  let message = "";
  if (parsed && Array.isArray(parsed.picks)) {
    picks = parsed.picks
      .filter((p) => p && valid.has(p.url))
      .slice(0, 3)
      .map((p) => {
        const cat = CATALOG.find((c) => c.url === p.url);
        return { title: cat.title, url: cat.url, why: (p.why || cat.teaches) + "" };
      });
    message = (parsed.message || "") + "";
  }

  // If the AI gave nothing usable, fall back to keyword matching.
  if (!picks.length) {
    picks = keywordPicks(q);
    message = picks.length
      ? "Here are the closest matches:"
      : "I couldn't find a close match — try a word like \"counting\", \"adding\", or \"make 10\".";
  }

  return json({ ok: true, ai: true, message, picks });
}

// Friendly response for a GET (e.g. someone opening the URL directly).
export function onRequestGet() {
  return json({ ok: true, info: "POST { q } to get game recommendations." });
}
