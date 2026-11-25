// How many visitors came today (Seoul day). POST counts this visitor once for the day; GET only reads the number.
// What is kept: for three days, a random id the visitor's own browser made up; and per day one number and
// the names of the sites visitors came from, each with a count. GET ?from=1 gives those names for the last days.

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
  const out = { state: "read", day, today: Number(await env.KNOCKS.get("visits:" + day)) || 0 };
  if (new URL(context.request.url).searchParams.get("from") === "1") {
    out.days = {};
    for (let i = 0; i < 40; i++) {
      const d = new Date(Date.parse(day + "T00:00:00Z") - i * 86400000).toISOString().slice(0, 10);
      const n = Number(await env.KNOCKS.get("visits:" + d)) || 0;
      if (!n) continue;
      let from = {};
      try { from = JSON.parse((await env.KNOCKS.get("from:" + d)) || "{}"); } catch (e) {}
      out.days[d] = { visitors: n, from };
    }
  }
  return json(out);
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
      // where this visitor came from: the name of the site only, never the page
      let host = typeof body.from === "string" ? body.from.toLowerCase().replace(/^www\./, "") : "";
      if (!/^[a-z0-9.-]{1,80}$/.test(host)) host = "direct";
      let from = {};
      try { from = JSON.parse((await env.KNOCKS.get("from:" + day)) || "{}"); } catch (e) {}
      if (Object.keys(from).length < 60 || from[host]) {
        from[host] = (from[host] || 0) + 1;
        await env.KNOCKS.put("from:" + day, JSON.stringify(from));
      }
    }
  } catch (e) {
    // the day's writes may be used up; the number that is there is still given
  }
  return json({ state: "counted", day, today: Math.max(1, today) });
}
