// /feed.xml: the steps as an Atom feed, newest first, for following the planet from a reader.
import { SITE, NAME, LINE, esc, pad, readRecords, say } from "./_shared.js";

export async function onRequestGet(context) {
  const { steps } = await readRecords(context);
  const later = steps.filter((s) => s.n > 0).reverse().slice(0, 60);
  const stamp = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s.date || "") ? s.date : "2026-11-24") + "T00:00:00+09:00";
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n' +
    "<title>" + esc(NAME) + "</title>\n<subtitle>" + esc(LINE.en) + "</subtitle>\n" +
    '<link href="' + SITE + '/"/>\n<link rel="self" href="' + SITE + '/feed.xml"/>\n<id>' + SITE + "/</id>\n" +
    "<updated>" + (later.length ? stamp(later[0]) : "2026-11-24T00:00:00+09:00") + "</updated>\n<author><name>the builder</name></author>\n";
  for (const s of later) {
    const parts = [];
    if (s.form) parts.push(s.form);
    if (s.text) parts.push(say(s.text, "en"));
    if (s.words) parts.push(say(s.words, "en"));
    xml += "<entry>\n<title>" + esc(pad(s.n) + " · " + say(s.title, "en")) + "</title>\n" +
      '<link href="' + SITE + "/s/" + s.n + '"/>\n<id>' + SITE + "/s/" + s.n + "</id>\n<updated>" + stamp(s) + "</updated>\n" +
      '<content type="text">' + esc(parts.join("\n\n")) + "</content>\n</entry>\n";
  }
  xml += "</feed>\n";
  return new Response(xml, { headers: { "content-type": "application/atom+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
