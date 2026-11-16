# Собирает скрипты компонентов в самостоятельные IIFE для блоков Тильды.
import re,os,subprocess,json,sys
W=os.path.dirname(os.path.abspath(__file__)); S=os.path.join(W,'work','site'); OUT=os.path.join(W,'work','js'); os.makedirs(OUT,exist_ok=True)
def script_of(path, idx=0):
    s=open(os.path.join(S,path)).read()
    blocks=[m.group(1) for m in re.finditer(r'^<script>\n(.*?)^</script>',s,re.S|re.M)]
    return blocks[idx]
EXTRA_RUNTIME = r'''
// Тильда: шапка закреплена сверху, место под неё держит корень блока; подсветка текущего раздела меню.
const allrecords = document.getElementById('allrecords');
const editing = allrecords?.dataset.tildaMode === 'edit';
if (!editing) document.documentElement.classList.add('ih-live');
const header = document.querySelector<HTMLElement>('.header');
const holder = header?.closest<HTMLElement>('.ih');
if (header && holder && !editing) {
  const fit = () => { holder.style.height = `${header.querySelector<HTMLElement>('.topbar')!.offsetHeight + header.querySelector<HTMLElement>('.bar')!.offsetHeight + 1}px`; };
  fit(); addEventListener('resize', fit); document.fonts?.ready.then(fit);
}
const alias = editing ? `/${allrecords?.dataset.tildaPageAlias ?? ''}` : location.pathname;
const path = alias.replace(/\/+$/, '') || '/';
document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((a) => {
  const href = a.getAttribute('href')!.replace(/\/+$/, '') || '/';
  const current = href === '/catalog' ? path.startsWith('/catalog') || path.startsWith('/product') : path === href;
  a.classList.toggle('is-current', current);
});
'''
TABS = r'''
// Тильда: вкладки товара закрепляются под шапкой скриптом — position: sticky не работает между блоками.
const tabs = document.querySelector<HTMLElement>('.tabs');
const tabsRoot = tabs?.closest<HTMLElement>('.ih');
if (tabs && tabsRoot && document.getElementById('allrecords')?.dataset.tildaMode !== 'edit') {
  const footer = document.querySelector<HTMLElement>('.footer');
  let height = 0;
  const update = () => {
    const top = parseFloat(getComputedStyle(tabs).top) || 0;
    const margin = parseFloat(getComputedStyle(tabs).marginTop) || 0;
    const stuck = tabsRoot.getBoundingClientRect().top + margin <= top;
    if (stuck && !tabs.classList.contains('is-stuck')) { height = tabsRoot.offsetHeight; tabsRoot.style.height = `${height}px`; tabs.classList.add('is-stuck'); }
    if (!stuck && tabs.classList.contains('is-stuck')) { tabs.classList.remove('is-stuck'); tabsRoot.style.height = ''; }
    const limit = footer ? footer.getBoundingClientRect().top - top - tabs.offsetHeight - 24 : 0;
    tabs.style.translate = tabs.classList.contains('is-stuck') && limit < 0 ? `-50% ${limit}px` : '';
  };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
}
'''
ENTRIES = {
  'runtime': ('src/components', "import '../scripts/store';\n" + script_of('src/components/Header.astro') + EXTRA_RUNTIME),
  'lead': ('src/components', script_of('src/components/LeadDialog.astro')),
  'media': ('src/components', script_of('src/components/MediaDialog.astro')),
  'catalog': ('src/components', script_of('src/components/CatalogGrid.astro')),
  'hero': ('src/components', script_of('src/components/HeroSlider.astro')),
  'compare': ('src/pages', script_of('src/pages/compare.astro')),
  'cart': ('src/pages', script_of('src/pages/cart.astro')),
  'video': ('src/pages', script_of('src/pages/video.astro')),
  'kontakty': ('src/pages', script_of('src/pages/kontakty.astro')),
  'product': ('src/pages', script_of('src/pages/product/[slug].astro').replace("from '../../", "from '../") + TABS),
}
esb=os.path.join(os.path.dirname(W),'node_modules','.bin','esbuild')
for key,(d,code) in ENTRIES.items():
    entry=os.path.join(S,d,f'__tilda_{key}.ts'); open(entry,'w').write(code)
    r=subprocess.run([esb,entry,'--bundle','--format=iife','--target=es2019','--charset=utf8','--legal-comments=none',
        '--define:import.meta.env.PUBLIC_YANDEX_METRIKA_ID=""'],capture_output=True,text=True,cwd=S)
    if r.returncode: print(key,r.stderr); sys.exit(1)
    body=r.stdout.strip()
    # Запуск после разбора всей страницы: элементы из следующих блоков к этому моменту уже есть.
    wrapped=f"(function () {{\n  var run = function () {{\n{body}\n  }};\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();\n}})();"
    open(os.path.join(OUT,key+'.js'),'w').write(wrapped)
    os.remove(entry)
    print(key,len(wrapped))
