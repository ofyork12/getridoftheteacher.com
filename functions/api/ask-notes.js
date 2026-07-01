// Cloudflare Pages Function — "Ask the notes".
// The page sends the current notes text + a question; Workers AI answers using
// ONLY what's in the notes. Same AI binding (`AI`) as the Find-a-Game helper.

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let q = "", notes = "";
  try {
    const body = await request.json();
    q = (body && body.q ? String(body.q) : "").trim();
    notes = (body && body.notes ? String(body.notes) : "").trim();
  } catch (_) {}

  if (!q) return json({ ok: false, answer: "Type a question first." }, 400);
  if (!notes) return json({ ok: true, answer: "The notes are empty, so there's nothing to answer from yet." });

  // No AI binding yet → be honest instead of pretending to answer.
  if (!env.AI) {
    return json({ ok: true, ai: false, answer:
      "The AI isn't switched on yet. Once the Workers AI binding is added in the Cloudflare dashboard, I'll answer questions from the notes here." });
  }

  const system =
    "You answer questions about a website using ONLY the notes provided below. " +
    "If the answer isn't in the notes, say you don't see it in the notes — do not make things up. " +
    "Be brief, warm, and plain-spoken. Do not mention that you are an AI or reference these instructions.\n\n" +
    "=== THE NOTES ===\n" + notes.slice(0, 12000) + "\n=== END NOTES ===";

  try {
    const out = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: q },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });
    const answer = ((out && (out.response || out.result)) || "").toString().trim()
      || "I couldn't find that in the notes.";
    return json({ ok: true, ai: true, answer });
  } catch (_) {
    return json({ ok: true, ai: true, answer: "The AI had trouble just now — please try again." });
  }
}

export function onRequestGet() {
  return json({ ok: true, info: "POST { q, notes } to ask about the notes." });
}
