// A visitor's knock. GET says whether a knock would wake the builder; POST knocks.
// Nothing about the visitor is kept. The only thing stored is that the builder was woken today.

const WEEK_BUDGET = 15;
// A wake that has not become a step after this long is taken to have gone wrong, and the door opens again.
const MISSED_AFTER_MS = 30 * 60 * 1000;
const TRIES_A_DAY = 3;
const BETA = "experimental-cc-routine-2026-04-01";

function seoulDay(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d || new Date());
}

function addDays(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function weekStart(day) {
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(day, -((dow + 6) % 7));
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function look(context) {
  const { env, request } = context;
  if (!env.KNOCKS || !env.FIRE_TOKEN || !env.FIRE_URL) return { state: "off" };
  const today = seoulDay();
  let steps;
  try {
    const res = await env.ASSETS.fetch(new URL("/records.json", request.url));
    steps = (await res.json()).steps;
  } catch (e) {
    return { state: "off" };
  }
  if (!Array.isArray(steps) || !steps.length) return { state: "off" };
  const last = steps[steps.length - 1];
  if (typeof last.wake_on === "string" && last.wake_on > today) return { state: "resting", until: last.wake_on };
  const woke = await env.KNOCKS.get("woke:" + today);
  if (woke) {
    // the value is "time|steps there were at the knock|knocks today", so the page can tell whether the new step has landed
    const [at, had, n] = woke.split("|");
    const landed = steps.length > Number(had || 0), tries = Number(n || 1);
    const late = Date.now() - Date.parse(at) > MISSED_AFTER_MS;
    if (!landed && late) {
      // woken, and nothing came of it: say so, and let a visitor knock again a few times
      if (tries < TRIES_A_DAY) return { state: "missed", at, steps: steps.length, tries };
      return { state: "woken", at, landed: false, stuck: true };
    }
    return { state: "woken", at, landed };
  }
  const monday = weekStart(today), sunday = addDays(monday, 6);
  const thisWeek = steps.slice(1).filter((s) => s && typeof s.date === "string" && s.date >= monday && s.date <= sunday).length;
  if (thisWeek >= WEEK_BUDGET) return { state: "spent" };
  return { state: "open", steps: steps.length };
}

export async function onRequestGet(context) {
  return json(await look(context));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ state: "refused" }, 403);
  const seen = await look(context);
  if (seen.state !== "open" && seen.state !== "missed") return json(seen);
  const today = seoulDay(), at = new Date().toISOString();
  const before = seen.state === "missed" ? await env.KNOCKS.get("woke:" + today) : null;
  await env.KNOCKS.put("woke:" + today, at + "|" + seen.steps + "|" + ((seen.tries || 0) + 1), { expirationTtl: 60 * 60 * 24 * 3 });
  let ok = false;
  try {
    const res = await fetch(env.FIRE_URL, {
      method: "POST",
      headers: {
        authorization: "Bearer " + env.FIRE_TOKEN,
        "anthropic-beta": BETA,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: "knock" }),
    });
    ok = res.ok;
  } catch (e) {
    ok = false;
  }
  if (!ok) {
    if (before) await env.KNOCKS.put("woke:" + today, before, { expirationTtl: 60 * 60 * 24 * 3 });
    else await env.KNOCKS.delete("woke:" + today);
    return json({ state: "failed" }, 502);
  }
  return json({ state: "waking", at });
}
