// Собирает CSS всех страниц dist и привязывает каждое правило к корню блока .ih.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const dist = process.argv[3];
const pages = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(dist);
pages.sort((a, b) => (a.endsWith('/dist/index.html') ? -1 : 0) - (b.endsWith('/dist/index.html') ? -1 : 0));

const seen = new Set(); const chunks = [];
const add = (css) => { const k = css.trim(); if (k && !seen.has(k)) { seen.add(k); chunks.push(k); } };
// Сначала общий бандл со стилями из global.css, потом остальное в порядке появления.
const all = [];
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const head = html.split('</head>')[0] + html; // и <style> из body тоже
  for (const m of head.matchAll(/<link rel="stylesheet" href="([^"]+)">|<style>([\s\S]*?)<\/style>/g)) {
    all.push(m[1] ? fs.readFileSync(path.join(dist, m[1]), 'utf8') : m[2]);
  }
}
const globalCss = all.find((c) => c.includes(':root{--bg'));
add(globalCss); all.forEach(add);

const R = '.ih';
function prefix(sel) {
  sel = sel.trim();
  if (sel === ':root' || sel === 'body' || sel === 'html') return R;
  if (sel.startsWith('body.')) return sel; // body.menu-open — блокировка прокрутки при открытом меню
  if (sel === '*') return `${R}, ${R} *`;
  if (/^\*::?(before|after)$/.test(sel)) { const pe = sel.slice(1); return `${R}${pe}, ${R} *${pe}`; }
  return `${R} ${sel}`;
}
const root = postcss.parse(chunks.join('\n'));
root.walkAtRules('font-face', (r) => r.remove());
root.walkRules((rule) => {
  if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
  const isHtml = rule.selectors.length === 1 && rule.selectors[0] === 'html';
  if (isHtml) {
    // scroll-behavior и text-size-adjust — уровень страницы, их задаёт Тильда; курсор переносим на корень блока.
    rule.walkDecls((d) => { if (d.prop !== 'cursor') d.remove(); });
    if (!rule.nodes.length) { rule.remove(); return; }
  }
  const isBody = rule.selectors.length === 1 && rule.selectors[0] === 'body';
  if (isBody) rule.walkDecls((d) => { if (d.prop === 'margin') d.remove(); if (d.prop === 'overflow-x') d.value = 'clip'; });
  rule.selectors = rule.selectors.flatMap((s) => prefix(s).split(/,\s(?=\.ih)/));
});
let out = root.toString().replace(/Manrope Variable/g, 'Manrope');
fs.writeFileSync(process.argv[2], out);
console.log('chunks', chunks.length, 'bytes', out.length);
