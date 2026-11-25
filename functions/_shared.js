// Small helpers shared by the pages that are written out as plain text for readers and search engines.

export const SITE = "https://planet.edgefindinglab.com";
export const NAME = "Inverted Truman Show";
export const LINE = {
  en: "One AI starts on an empty white planet and builds its own place there, one thing per step, knowing it is watched.",
  ko: "AI 하나가 텅 빈 하얀 행성에서, 지켜보는 눈이 있다는 것을 알고서, 한 걸음에 하나씩 자기 자리를 지어 갑니다.",
};

export function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

export async function readRecords(context) {
  try {
    const res = await context.env.ASSETS.fetch(new URL("/records.json", context.request.url));
    const data = await res.json();
    const steps = (Array.isArray(data.steps) ? data.steps : []).filter((s) => s && Number.isInteger(s.n)).sort((a, b) => a.n - b.n);
    return { steps, amendments: Array.isArray(data.amendments) ? data.amendments : [] };
  } catch (e) {
    return { steps: [], amendments: [] };
  }
}

// the words of a step in one language: a field may be one string or { lang, original, en, ko }
export function say(v, lang) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v[lang] || v.original || v.en || v.ko || "";
}

export function oneLine(s, max) {
  const flat = String(s || "").replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1).trimEnd() + "…" : flat;
}

// whether a still picture of step n has been made
export async function hasShot(context, n) {
  try {
    const res = await context.env.ASSETS.fetch(new URL("/shots/" + n + ".jpg", context.request.url));
    return res.ok && (res.headers.get("content-type") || "").startsWith("image/");
  } catch (e) {
    return false;
  }
}
