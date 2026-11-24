// A visitor's like on one step. POST leaves it or takes it back.
// What is kept: the step number and a random id the visitor's own browser made up. Nothing else about the visitor.
// The likes are kept outside the repository, so the builder does not read them. Counts are not given out
// unless the keeper opens them (LIKES_OPEN), and they are never written into the record.

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function stepCount(context) {
  try {
    const res = await context.env.ASSETS.fetch(new URL("/records.json", context.request.url));
    const steps = (await res.json()).steps;
    return Array.isArray(steps) ? steps.length : 0;
  } catch (e) {
    return 0;
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.KNOCKS) return json({ state: "off" });
  if (env.LIKES_OPEN !== "1") return json({ state: "closed" });
  const counts = {};
  let cursor;
  do {
    const page = await env.KNOCKS.list({ prefix: "liked:", cursor });
    for (const k of page.keys) {
      const n = k.name.split(":")[1];
      counts[n] = (counts[n] || 0) + 1;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return json({ state: "open", counts });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.KNOCKS) return json({ state: "off" }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ state: "refused" }, 403);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ state: "refused" }, 400);
  }
  const n = body && body.n, v = body && body.v;
  if (!Number.isInteger(n) || n < 1 || typeof v !== "string" || !/^[a-f0-9]{32}$/.test(v)) return json({ state: "refused" }, 400);
  if (n >= (await stepCount(context))) return json({ state: "refused" }, 400);
  const key = "liked:" + n + ":" + v;
  if (body.on === false) {
    await env.KNOCKS.delete(key);
    return json({ state: "taken back" });
  }
  await env.KNOCKS.put(key, new Date().toISOString().slice(0, 10));
  return json({ state: "kept" });
}
