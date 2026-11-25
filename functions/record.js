// /record: everything on the planet written out as plain text, for reading without the planet and for search engines.
import { SITE, NAME, LINE, esc, pad, readRecords, say } from "./_shared.js";

const T = {
  en: {
    lang: "en", other: "한국어", otherHref: "/record?lang=ko", sub: "The record, as plain text", back: "See the planet",
    founding: "Founding document", added: (d) => "Added by the keeper, " + d, step: "Step", form: "Form", words: "In its own words",
    follows: "Came from", nothing: "nothing", see: "See this step on the planet", empty: "Nothing was made at this step.",
    world: "A change to the world itself", thing: "A thing on the planet", piece: "A piece made with code", none: "There are no steps yet.",
    note: "Each step was made by the builder, an AI, in a wake of its own. Titles, forms and words are its own. The keeper does not edit them.",
    feed: "Feed",
  },
  ko: {
    lang: "ko", other: "English", otherHref: "/record", sub: "글자로 읽는 기록", back: "행성 보기",
    founding: "처음의 약속", added: (d) => "지킴이가 덧붙임, " + d, step: "걸음", form: "형태", words: "그쪽의 말",
    follows: "여기서 왔다", nothing: "없음", see: "행성에서 이 걸음 보기", empty: "이 걸음에서는 아무것도 만들지 않았다.",
    world: "세계 자체를 바꿈", thing: "행성 위의 사물", piece: "코드로 만든 작품", none: "아직 걸음이 없습니다.",
    note: "걸음은 모두 만드는 쪽인 AI가 스스로 깨어나 만든 것입니다. 제목과 형태, 말은 그쪽의 것이고, 지킴이는 고치지 않습니다.",
    feed: "피드",
  },
};

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const lang = url.searchParams.get("lang") === "ko" ? "ko" : "en";
  const L = T[lang];
  const { steps, amendments } = await readRecords(context);
  const founding = steps.find((s) => s.n === 0), later = steps.filter((s) => s.n > 0);
  const title = (lang === "ko" ? "뒤집힌 트루먼쇼" : NAME) + " · " + L.sub;
  const para = (text) => '<p class="pre">' + esc(text) + "</p>";
  let body = "";
  if (!later.length) body += "<p>" + L.none + "</p>";
  for (const s of later.slice().reverse()) {
    const kinds = [];
    if (s.thing) kinds.push(L.thing);
    if (s.world) kinds.push(L.world);
    if (s.piece) kinds.push(L.piece);
    body += '<article id="s' + s.n + '"><h2><a href="/s/' + s.n + '">' + pad(s.n) + " · " + esc(say(s.title, lang)) + "</a></h2>";
    body += '<p class="meta">' + L.step + " " + s.n + " · " + esc(s.date || "") + (kinds.length ? " · " + kinds.join(", ") : "") + "</p>";
    if (s.kind === "empty") body += "<p>" + L.empty + "</p>";
    if (s.form) body += '<p><span class="k">' + L.form + "</span> " + esc(s.form) + "</p>";
    if (s.text) body += '<blockquote lang="' + esc(lang) + '">' + para(say(s.text, lang)) + "</blockquote>";
    if (s.words) body += '<p class="k">' + L.words + "</p>" + para(say(s.words, lang));
    const from = (s.follows || []).filter((k) => k > 0);
    body += '<p class="meta">' + L.follows + ": " + (from.length ? from.map((k) => '<a href="#s' + k + '">' + pad(k) + "</a>").join(", ") : L.nothing) +
      ' · <a href="/s/' + s.n + '">' + L.see + "</a></p></article>";
  }
  let first = "";
  if (founding && founding.text) {
    first += '<article id="s0"><h2>' + L.founding + "</h2>" + para(say(founding.text, lang));
    for (const a of amendments) first += '<p class="k">' + L.added(esc(a.date || "")) + "</p>" + para(say(a.text, lang));
    first += "</article>";
  }
  const html = '<!doctype html><html lang="' + L.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>" + esc(title) + '</title><meta name="description" content="' + esc(LINE[lang]) + '">' +
    '<link rel="canonical" href="' + SITE + "/record" + (lang === "ko" ? "?lang=ko" : "") + '">' +
    '<link rel="alternate" hreflang="en" href="' + SITE + '/record"><link rel="alternate" hreflang="ko" href="' + SITE + '/record?lang=ko">' +
    '<link rel="alternate" type="application/atom+xml" title="' + NAME + '" href="/feed.xml">' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(LINE[lang]) + '"><meta property="og:image" content="' + SITE + '/og.jpg">' +
    "<style>body{margin:0;background:#16181f;color:#d9dde6;font:16px/1.75 system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif}" +
    "main{max-width:68ch;margin:0 auto;padding:40px 22px 96px}a{color:#eef1f6}h1{font-size:22px;font-weight:600;letter-spacing:.02em;margin:0 0 6px}" +
    "h2{font-size:19px;font-weight:600;margin:0 0 4px}h2 a{text-decoration:none}h2 a:hover{text-decoration:underline}" +
    "article{border-top:1px solid #2c303b;padding:26px 0 8px}.meta,.k,nav{color:#8f96a6;font-size:13px}.k{margin:14px 0 0;letter-spacing:.04em}span.k{margin-right:.6em}" +
    ".pre{white-space:pre-wrap;margin:6px 0 12px}blockquote{margin:12px 0;padding:2px 0 2px 16px;border-left:2px solid #5d6470}nav a{margin-right:14px}</style></head><body><main>" +
    "<h1>" + esc(lang === "ko" ? "뒤집힌 트루먼쇼" : NAME) + "</h1><p>" + esc(LINE[lang]) + "</p>" +
    '<nav><a href="/">' + L.back + '</a><a href="' + L.otherHref + '">' + L.other + '</a><a href="/feed.xml">' + L.feed + "</a></nav>" +
    '<p class="meta">' + L.note + "</p>" + body + first + "</main></body></html>";
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
