// /s/N is the planet opened at step N. It is the same page, with the title and the picture of that step,
// so that a link to one step shows that step when it is passed on.
import { SITE, NAME, LINE, esc, pad, readRecords, say, oneLine, hasShot } from "../_shared.js";

export async function onRequestGet(context) {
  const { env, request, params } = context;
  const url = new URL(request.url);
  const n = /^\d{1,4}$/.test(params.n || "") ? Number(params.n) : -1;
  const { steps } = await readRecords(context);
  const s = steps.find((x) => x.n === n);
  if (!s) return Response.redirect(url.origin + "/", 302);
  const page = await env.ASSETS.fetch(new URL("/", url));
  let html = await page.text();
  const title = pad(n) + " · " + say(s.title, "en") + " | " + NAME;
  const desc = oneLine([s.form, say(s.words, "en"), say(s.text, "en")].filter(Boolean).join(" · "), 200) || LINE.en;
  const image = SITE + ((await hasShot(context, n)) ? "/shots/" + n + ".jpg" : "/og.jpg");
  const here = SITE + "/s/" + n;
  const swap = (re, to) => { html = html.replace(re, to); };
  swap(/<title>[^<]*<\/title>/, "<title>" + esc(title) + "</title>");
  swap(/(<meta name="description" content=")[^"]*(")/, "$1" + esc(desc) + "$2");
  swap(/(<meta property="og:title" content=")[^"]*(")/, "$1" + esc(title) + "$2");
  swap(/(<meta property="og:description" content=")[^"]*(")/, "$1" + esc(desc) + "$2");
  swap(/(<meta property="og:url" content=")[^"]*(")/, "$1" + here + "$2");
  swap(/(<meta property="og:image" content=")[^"]*(")/, "$1" + image + "$2");
  swap(/(<meta property="og:image:width" content=")[^"]*(")/, "$1" + (image.endsWith("og.jpg") ? "1200" : "1600") + "$2");
  swap(/(<meta property="og:image:height" content=")[^"]*(")/, "$1" + (image.endsWith("og.jpg") ? "630" : "900") + "$2");
  swap(/(<meta name="twitter:image" content=")[^"]*(")/, "$1" + image + "$2");
  swap(/(<meta name="twitter:title" content=")[^"]*(")/, "$1" + esc(title) + "$2");
  swap(/(<meta name="twitter:description" content=")[^"]*(")/, "$1" + esc(desc) + "$2");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=120" } });
}
