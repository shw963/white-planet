// How many visitors came today (Seoul day). POST counts this visitor once for the day; GET only reads the number.
// What is kept: for three days, a random id the visitor's own browser made up; and one number per day.

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function seoulDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.KNOCKS) return json({ state: "off" });
  const day = seoulDay();
  return json({ state: "read", day, today: Number(await env.KNOCKS.get("visits:" + day)) || 0 });
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
  const v = body && body.v;
  if (typeof v !== "string" || !/^[a-f0-9]{32}$/.test(v)) return json({ state: "refused" }, 400);
  const day = seoulDay(), key = "visit:" + day + ":" + v, total = "visits:" + day;
  let today = Number(await env.KNOCKS.get(total)) || 0;
  // a search engine reading the page is not a visitor
  if (/bot|crawl|spider|slurp|yeti|preview|headless|lighthouse|inspect/i.test(request.headers.get("user-agent") || "")) return json({ state: "read", day, today });
  try {
    if (!(await env.KNOCKS.get(key))) {
      await env.KNOCKS.put(key, "1", { expirationTtl: 60 * 60 * 24 * 3 });
      today += 1;
      await env.KNOCKS.put(total, String(today));
    }
  } catch (e) {
    // the day's writes may be used up; the number that is there is still given
  }
  return json({ state: "counted", day, today: Math.max(1, today) });
}
