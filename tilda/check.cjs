// Сравнивает страницы оригинала и Тильды: высота, горизонтальная прокрутка, положение заголовков и кнопок.
const { chromium } = require('playwright');
const fs = require('fs');
const [pagesJson, outFile] = process.argv.slice(2);
const pages = JSON.parse(fs.readFileSync(pagesJson)).pages;
const widths = [1440, 1100, 1000, 900, 700, 600, 390];
const measure = () => {
  const root = document.querySelector('#allrecords') || document.body;
  const els = [...root.querySelectorAll('h1,h2,h3,.btn,.card,.clip,.review,.tile')].filter((e) => !e.closest('dialog') && e.getClientRects().length);
  return { h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth,
    els: els.map((e) => { const r = e.getBoundingClientRect(); return [e.tagName + '.' + (e.className.baseVal ?? e.className).split(' ')[0], Math.round(r.top + scrollY), Math.round(r.left), Math.round(r.width), Math.round(r.height)]; }) };
};
(async () => {
  const b = await chromium.launch(); const rows = [];
  for (const p of pages) {
    const orig = 'http://localhost:4321' + (p.route === '/404' ? '/404.html' : p.route === '/' ? '/' : p.route + '/');
    const tilda = `http://localhost:4400/${p.key}.html`;
    for (const w of widths) {
      const res = {};
      for (const [name, url] of [['o', orig], ['t', tilda]]) {
        const pg = await b.newPage({ viewport: { width: w, height: 900 } });
        const errs = []; pg.on('pageerror', (e) => { if (!/\$ is not defined/.test(e.message)) errs.push(e.message); });
        await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
        await pg.evaluate(() => document.fonts.ready);
        res[name] = { ...(await pg.evaluate(measure)), errs };
        await pg.close();
      }
      const o = res.o, t = res.t; let worst = 0, mism = 0;
      const n = Math.min(o.els.length, t.els.length);
      for (let i = 0; i < n; i++) { const d = Math.max(...[1, 2, 3, 4].map((k) => Math.abs(o.els[i][k] - t.els[i][k]))); if (o.els[i][0] !== t.els[i][0]) mism++; worst = Math.max(worst, d); }
      const row = { page: p.key, w, hO: o.h, hT: t.h, swT: t.sw, elsO: o.els.length, elsT: t.els.length, worst, mism, errs: t.errs.slice(0, 2) };
      if (worst > 2 || o.h !== t.h || t.sw > w || o.els.length !== t.els.length || t.errs.length) {
        const i = o.els.findIndex((e, k) => t.els[k] && Math.max(...[1, 2, 3, 4].map((j) => Math.abs(e[j] - t.els[k][j]))) > 2);
        row.first = i >= 0 ? { o: o.els[i], t: t.els[i] } : null;
      }
      rows.push(row); console.log(JSON.stringify(row));
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(rows, null, 1));
  await b.close();
})();
