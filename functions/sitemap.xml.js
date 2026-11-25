// /sitemap.xml: the planet, the plain-text record, and one address for every step.
import { SITE, readRecords } from "./_shared.js";

export async function onRequestGet(context) {
  const { steps } = await readRecords(context);
  const later = steps.filter((s) => s.n > 0);
  const last = later.length ? later[later.length - 1].date : "";
  const day = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? "<lastmod>" + d + "</lastmod>" : "");
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += "  <url><loc>" + SITE + "/</loc>" + day(last) + "</url>\n";
  xml += "  <url><loc>" + SITE + "/record</loc>" + day(last) + "</url>\n";
  xml += "  <url><loc>" + SITE + "/record?lang=ko</loc>" + day(last) + "</url>\n";
  for (const s of later) xml += "  <url><loc>" + SITE + "/s/" + s.n + "</loc>" + day(s.date) + "</url>\n";
  xml += "</urlset>\n";
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}
