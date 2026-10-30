// Товарный фид YML для Яндекса (Яндекс Товары, Вебмастер): цены и наличие в формате, который понимает поиск.
import { categories } from '../data/content';
import { site } from '../data/site';
import { products } from '../lib/catalog';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path: string) => new URL(path, site.url).href;

export function GET() {
  const used = categories.filter((c) => products.some((p) => p.category.slug === c.slug));
  const offers = products
    .filter((p) => p.price)
    .map((p) => `    <offer id="${p.slug}" available="${p.availability === 'InStock'}">
      <url>${abs(p.url)}</url>
      <price>${p.price}</price>
      <currencyId>RUR</currencyId>
      <categoryId>${used.indexOf(p.category) + 1}</categoryId>
${p.images.slice(0, 5).map((img) => `      <picture>${abs(img.src)}</picture>`).join('\n')}
      <name>${esc(`${p.category.kind} ${p.name}`)}</name>
      <vendor>RikaNV</vendor>
      <model>${esc(p.shortName)}</model>
      <description>${esc([p.copy.lead, ...p.copy.body].join(' '))}</description>
${p.copy.highlights.map(([k, v]) => `      <param name="${esc(k)}">${esc(v)}</param>`).join('\n')}
    </offer>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString().slice(0, 19)}+00:00">
  <shop>
    <name>${site.name}</name>
    <company>${esc(site.legal.name)}</company>
    <url>${site.url}/</url>
    <currencies><currency id="RUR" rate="1"/></currencies>
    <categories>
${used.map((c, i) => `      <category id="${i + 1}">${esc(c.title)}</category>`).join('\n')}
    </categories>
    <offers>
${offers}
    </offers>
  </shop>
</yml_catalog>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
