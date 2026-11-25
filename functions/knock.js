// A visitor's knock. GET says how things stand; POST knocks.
// When enough knocks are already waiting from earlier days and the builder has not been woken today, the first
// look of the day (a visitor opening the page, or the keeper's daily look) wakes it: that is the one thing GET does.
//
// Since 2026-11-25 knocks add up. The builder says how many knocks it takes to wake it (`knocks` in a step, 1 to 10;
// one if it never said). Knocks from different visitors are kept across days until there are that many, and it is
// woken once a day at most. A knock that comes when it has already been woken today, or when the week's steps are
// spent, is kept for the next time.
//
// What is kept: how many knocks are waiting, how many came today, and, for three days, the random number the
// visitor's own browser made up, so that one visitor counts once a day. A knock carries no message.

const WEEK_BUDGET = 15;
// A wake that has not become a step after this long is taken to have gone wrong, and the door opens again.
const MISSED_AFTER_MS = 30 * 60 * 1000;
const TRIES_A_DAY = 3;
const NEED_MAX = 10;
// No more knocks are kept than would wake it this many times, and no more than this many are taken in a day.
const KEPT_WAKES = 7;
const KNOCKS_A_DAY = 60;
const THREE_DAYS = 60 * 60 * 24 * 3;
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

// how many knocks the builder asked for: the latest step that says so
function needOf(steps) {
  for (let i = steps.length - 1; i >= 1; i--) {
    const k = steps[i] && steps[i].knocks;
    if (Number.isInteger(k) && k >= 1 && k <= NEED_MAX) return k;
  }
  return 1;
}

function okVisitor(v) {
  return typeof v === "string" && /^[a-f0-9]{32}$/.test(v);
}

async function look(context, v) {
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
  const need = needOf(steps);
  const [woke, kept, came, mine] = await Promise.all([
    env.KNOCKS.get("woke:" + today),
    env.KNOCKS.get("pool"),
    env.KNOCKS.get("kn-day:" + today),
    okVisitor(v) ? env.KNOCKS.get("kn:" + today + ":" + v) : null,
  ]);
  const pool = Math.max(0, Number(kept) || 0), todayKnocks = Math.max(0, Number(came) || 0);
  const more = {
    need, pool, today: todayKnocks, mine: !!mine,
    // nothing more is taken once enough is kept, or once the day's knocks are used up
    full: pool >= need * KEPT_WAKES || todayKnocks >= KNOCKS_A_DAY,
  };
  if (woke) {
    // the value is "time|steps there were at the wake|tries today", so the page can tell whether the new step has landed
    const [at, had, n] = woke.split("|");
    const landed = steps.length > Number(had || 0), tries = Number(n || 1);
    const late = Date.now() - Date.parse(at) > MISSED_AFTER_MS;
    if (!landed && late) {
      // woken, and nothing came of it: say so, and let a visitor knock again a few times
      if (tries < TRIES_A_DAY) return { state: "missed", at, steps: steps.length, tries, ...more };
      return { state: "woken", at, landed: false, stuck: true, ...more };
    }
    return { state: "woken", at, landed, ...more };
  }
  const monday = weekStart(today), sunday = addDays(monday, 6);
  const thisWeek = steps.slice(1).filter((s) => s && typeof s.date === "string" && s.date >= monday && s.date <= sunday).length;
  if (thisWeek >= WEEK_BUDGET) return { state: "spent", ...more };
  // due: enough knocks are already waiting, and it has not been woken today
  return { state: "open", steps: steps.length, due: pool >= need, ...more };
}

async function fire(env) {
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
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Wake it now. `again` is a second try after a wake that came to nothing: it takes nothing from what is kept.
// Two looks at the same moment from far apart could both get here before either sees the other's mark; with the
// few visitors this place has, that is left as it is.
async function wake(env, seen, pool, came, mine, again) {
  const today = seoulDay(), at = new Date().toISOString();
  const before = again ? await env.KNOCKS.get("woke:" + today) : null;
  const left = again ? pool : pool - seen.need;
  await env.KNOCKS.put("woke:" + today, at + "|" + seen.steps + "|" + ((seen.tries || 0) + 1), { expirationTtl: THREE_DAYS });
  if (!again) await env.KNOCKS.put("pool", String(left));
  if (!(await fire(env))) {
    // it could not be woken: the knocks stay kept, and the next knock or look tries again
    if (before) await env.KNOCKS.put("woke:" + today, before, { expirationTtl: THREE_DAYS });
    else await env.KNOCKS.delete("woke:" + today);
    if (!again) await env.KNOCKS.put("pool", String(pool));
    return json({ state: "failed", need: seen.need, pool, today: came, mine }, 502);
  }
  return json({ state: "waking", at, need: seen.need, pool: left, today: came, mine, full: left >= seen.need * KEPT_WAKES || came >= KNOCKS_A_DAY });
}

export async function onRequestGet(context) {
  const seen = await look(context, new URL(context.request.url).searchParams.get("v"));
  if (seen.state === "open" && seen.due) return wake(context.env, seen, seen.pool, seen.today, seen.mine, false);
  return json(seen);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ state: "refused" }, 403);
  let body = {};
  try {
    body = (await request.json()) || {};
  } catch (e) {
    body = {};
  }
  const v = body.v;
  if (!okVisitor(v)) return json({ state: "refused" }, 400);
  const seen = await look(context, v);
  if (seen.state === "off" || seen.state === "resting") return json(seen);
  const today = seoulDay();
  let pool = seen.pool, came = seen.today, mine = seen.mine;

  if (!mine && !seen.full) {
    // this visitor's knock for today
    pool += 1; came += 1; mine = true;
    await Promise.all([
      env.KNOCKS.put("kn:" + today + ":" + v, "1", { expirationTtl: THREE_DAYS }),
      env.KNOCKS.put("kn-day:" + today, String(came), { expirationTtl: THREE_DAYS }),
      env.KNOCKS.put("pool", String(pool)),
    ]);
  }
  // a wake that came to nothing may be tried again by any knock
  const again = seen.state === "missed";
  if (again || (seen.state === "open" && pool >= seen.need)) return wake(env, seen, pool, came, mine, again);
  const now = { ...seen, pool, today: came, mine, full: pool >= seen.need * KEPT_WAKES || came >= KNOCKS_A_DAY, kept: mine && !seen.mine };
  delete now.due;
  return json(now);
}
