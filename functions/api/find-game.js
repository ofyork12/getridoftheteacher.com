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
// level = rough difficulty order (0 = anytime/extra, 1 = first steps … 6 = bundle).
// The AI is told to prefer lower levels first and to suggest "Start Here" when a
// parent is unsure where to begin. Descriptions are pulled from the real pages.
const CATALOG = [
  { url: "start-here.html",          title: "Start Here",            level: 0, teaches: "the recommended order to learn everything, the ColorMyMath way — every number has its own color", tags: "start begin where do i start first new beginner unsure overwhelmed don't know what order path roadmap getting started kindergarten preschool" },
  { url: "number-practice.html",     title: "Numbers 1 to 10",       level: 1, teaches: "meeting the numbers 1–10 — what each one looks like and how many it is", tags: "numbers number recognition 1 to 10 name the number what number is this numerals digits learn numbers preschool pre-k toddler" },
  { url: "counting-to-10.html",      title: "Counting to 10",        level: 1, teaches: "counting 1 to 10, each number in its own color — and it counts backward too", tags: "count counting to ten 1-10 one two three forward backward backwards countdown count down ten-frame preschool kindergarten" },
  { url: "count-to-20.html",         title: "Counting to 20",        level: 2, teaches: "counting past ten up to 20, with a second ten-frame filling in colored dots", tags: "count counting to 20 twenty teen numbers eleven twelve thirteen past ten second ten-frame kindergarten" },
  { url: "count-to-5-dots.html",     title: "Roll to 5",             level: 1, teaches: "a fun marble game — pick 1 to 5 balls, roll them, and watch them total up", tags: "roll to 5 marbles balls counting game play fun five physics interactive toddler preschool" },
  { url: "bigger-smaller.html",      title: "Bigger / Smaller",      level: 1, teaches: "comparing two groups — click the one with MORE; bigger vs smaller, more vs less", tags: "bigger smaller more less compare comparing greater fewer most least which has more groups quantity amounts kindergarten" },
  { url: "math-five.html",           title: "Five and Under",        level: 2, teaches: "learning all the numbers up to 5 and starting to add within 5", tags: "five and under within 5 add to five small numbers number sense to five facts kindergarten" },
  { url: "math-ten.html",            title: "Ten and Under",         level: 3, teaches: "numbers and facts up to 10 — each lesson has a game, a video, and a play-along", tags: "ten and under within 10 to ten facts lessons video play along number sense first grade" },
  { url: "easy-addition.html",       title: "Easy Addition",         level: 2, teaches: "a gentle first take on adding — adding 1, doubles, make-10 buddies, and adding 2, 3, 4", tags: "easy addition adding plus first sums beginner intro adding 1 doubles add 2 3 4 start kindergarten first grade" },
  { url: "addition.html",            title: "Addition (1 to 5)",     level: 2, teaches: "adding one dot at a time, building all the way up to 5", tags: "addition add plus sums within 5 one at a time small numbers kindergarten" },
  { url: "subtraction.html",         title: "Subtraction",           level: 2, teaches: "starting with 5 and taking one away at a time, down to 0", tags: "subtraction subtract take away minus less count down from 5 taking away kindergarten" },
  { url: "goal2.html",               title: "Doubles",               level: 3, teaches: "a number plus itself — 1+1, 2+2, 3+3, 4+4, 5+5", tags: "doubles double plus itself 1+1 2+2 3+3 same number twice addition facts first grade" },
  { url: "making-10.html",           title: "Making 10",             level: 3, teaches: "finding every pair of number buddies that add up to 10", tags: "making 10 make ten number bonds buddies pairs friends of ten add to 10 rainbow facts combinations first grade" },
  { url: "making-10-pairs.html",     title: "Make 10 — Two Numbers", level: 3, teaches: "a game where you pick the two numbers that combine to make 10", tags: "make 10 two numbers pair game add combine ten bonds match first grade" },
  { url: "partitions-of-10.html",    title: "Every Way to Make 10",  level: 3, teaches: "all the different ways to split 10 into two parts", tags: "partitions of 10 split decompose break apart ways to make ten parts number bonds 42 first grade" },
  { url: "subtraction-from-10.html", title: "Subtraction from 10",   level: 3, teaches: "starting at 10 and taking away one at a time, down to 0", tags: "subtraction from 10 minus take away ten subtract down from ten first grade" },
  { url: "clocks.html",              title: "Clocks",                level: 4, teaches: "telling time the ColorMyMath way, with color", tags: "clock clocks time telling time hours minutes oclock analog read the clock first grade" },
  { url: "sudoku.html",              title: "Color My Sudoku",       level: 4, teaches: "sudoku where every number shows as that many colored dots", tags: "sudoku puzzle logic colored dots brain grid number puzzle thinking older kids" },
  { url: "math-puzzles.html",        title: "Logic Puzzles",         level: 4, teaches: "logic games where each number shows as that many colored dots", tags: "puzzles logic games brain teaser thinking problem solving colored dots older kids" },
  { url: "multiplication-3d.html",   title: "Squares & Cubes",       level: 5, teaches: "seeing a number as a flat square, or as a cube you can spin", tags: "squares cubes multiplication times square numbers cube 3d area volume spin older kids" },
  { url: "squares-2d.html",          title: "Squares",               level: 5, teaches: "square numbers shown as dots — 1, 4, 9, 16, 25 …", tags: "squares square numbers area dots times itself 4 9 16 multiplication" },
  { url: "multiplication-cube-2.html", title: "3D Cubes",            level: 5, teaches: "a number cubed shown as a spinning cube, like 4×4×4 = 64", tags: "cubes cube 3d cubed volume spin multiplication 4x4x4 older kids" },
  { url: "my-colors.html",           title: "Make It Your Colors",   level: 1, teaches: "pick your own color for each number, used across all the games (paid feature)", tags: "colors color picker my colors choose pick customize palette personalize paid" },
  { url: "language-learning.html",   title: "Language Learning",     level: 0, teaches: "picture-and-word vocabulary in Vietnamese, Chinese, Korean, and French", tags: "language vocabulary words french chinese korean vietnamese foreign bilingual esl" },
  { url: "audiobooks.html",          title: "Audio Books",           level: 0, teaches: "free classic stories read aloud — tap a book to listen", tags: "audio books read aloud stories listening reading library tom sawyer free bedtime" },
  { url: "premium-games.html",       title: "Full Math Games Access", level: 6, teaches: "every game and level together — the ColorMyMath Teacher's Edition", tags: "all games everything full access teacher edition premium bundle complete one place" },
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
  }).filter((x) => x.score > 0)
    // Best match first; ties broken by easier (lower level) game first.
    .sort((a, b) => b.score - a.score || (a.c.level || 9) - (b.c.level || 9));
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
    .map((c) => `- url: ${c.url} | title: ${c.title} | level: ${c.level} | teaches: ${c.teaches}`)
    .join("\n");

  const system =
    "You are the friendly guide for ColorMyMath, a website of colorful math games for young children. " +
    "A parent or teacher tells you what their child needs. Recommend 1 to 3 games from the catalog below that fit best. " +
    "ONLY recommend games from the catalog, and ONLY use their exact urls. Never invent a url or a game. " +
    "Each game has a 'level' (1 = first steps, rising to 6). When several fit, prefer the easier (lower-level) one first and list picks easiest-first. " +
    "If the parent sounds unsure where to begin, or their child is brand new to math, include 'Start Here' (start-here.html). " +
    "If the topic isn't math (a story, another language), it's fine to suggest Audio Books or Language Learning. " +
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
    // Newer Workers AI models auto-parse a JSON reply, so `out.response` can be
    // an object already; older/other shapes give a string in response/result or
    // an OpenAI-style choices[].message.content. Handle all of them.
    const resp = out && out.response;
    if (resp && typeof resp === "object") {
      parsed = resp;
    } else {
      const text = (resp || (out && out.result) ||
        (out && out.choices && out.choices[0] && out.choices[0].message &&
          out.choices[0].message.content) || "") + "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
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
