// A visitor's like on one step. POST leaves it or takes it back.
// What is kept: the step number and a random id the visitor's own browser made up. Nothing else about the visitor.
// The likes are kept outside the repository, so the builder does not read them. A step's count is given only to
// a visitor who has liked that step, and never written into the record. LIKES_OPEN lets the keeper open all of them.

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

async function tally(env, prefix) {
  const counts = {}, by = {};
  let cursor;
  do {
    const page = await env.KNOCKS.list({ prefix, cursor });
    for (const k of page.keys) {
      const [, n, v] = k.name.split(":");
      counts[n] = (counts[n] || 0) + 1;
      (by[v] = by[v] || {})[n] = true;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { counts, by };
}

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.KNOCKS) return json({ state: "off" });
  if (env.LIKES_OPEN === "1") return json({ state: "open", counts: (await tally(env, "liked:")).counts });
  // a visitor is shown the counts of the steps they have liked, and no others
  const v = new URL(request.url).searchParams.get("v") || "";
  if (!/^[a-f0-9]{32}$/.test(v)) return json({ state: "closed" });
  try {
    const { counts, by } = await tally(env, "liked:");
    const mine = {};
    for (const n of Object.keys(by[v] || {})) mine[n] = counts[n];
    return json({ state: "mine", counts: mine });
  } catch (e) {
    return json({ state: "closed" });
  }
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
  // the count of this one step, for the one who has just liked it; a listing can lag behind a write, so their own like is counted in
  let count = 1;
  try {
    const { counts, by } = await tally(env, "liked:" + n + ":");
    count = (counts[n] || 0) + (by[v] ? 0 : 1);
  } catch (e) {}
  return json({ state: "kept", count });
}
