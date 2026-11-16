# Режет страницы Tilda-копии сайта на блоки: blocks/<page>/<NN>-<name>.html + pages.json
import re,os,json,html as H,glob,shutil
W=os.path.dirname(os.path.abspath(__file__)); DIST=os.path.join(W,'work','site','dist'); OUT=os.path.join(W,'work','blocks')
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT)
amap=json.load(open(os.path.join(W,'map.json')))
VOID={'img','input','br','hr','meta','link','source','wbr','area','col','embed','track','param'}
TAG=re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*)>')

def children(s, start, end):
    """Верхнеуровневые элементы в s[start:end] -> [(a,b,tag,attrs)]."""
    out=[]; depth=0; i=start; cur=None
    while True:
        m=TAG.search(s,i,end)
        if not m: break
        close,tag,attrs=m.group(1),m.group(2).lower(),m.group(3)
        if not close and tag in ('script','style'):
            e=s.index(f'</{tag}>',m.end())+len(tag)+3
            if depth==0: out.append((m.start(),e,tag,attrs))
            i=e; continue
        selfclose = tag in VOID or attrs.rstrip().endswith('/')
        if close:
            depth-=1
            if depth==0: out.append((cur[0],m.end(),cur[1],cur[2]))
        elif selfclose:
            if depth==0: out.append((m.start(),m.end(),tag,attrs))
        else:
            if depth==0: cur=(m.start(),tag,attrs)
            depth+=1
        i=m.end()
    return out

def inner(s, el):
    a,b,tag,attrs=el
    open_end=s.index('>',a)+1
    return open_end, b-len(f'</{tag}>')

def cls(attrs):
    m=re.search(r'class="([^"]*)"',attrs); return m.group(1).split() if m else []

PATHS='catalog|product|cart|compare|video|kontakty|dostavka-i-oplata|obmen-i-vozvrat|politika-konfidencialnosti'
def fix(code):
    for p in sorted(amap,key=len,reverse=True):
        code=code.replace('https://infrahunt.ru'+p,amap[p]).replace(p,amap[p])
    # Адреса страниц без завершающего слэша, как на Тильде.
    code=re.sub(r'(?<=[\s"\'(=;])((?:https://infrahunt\.ru)?/(?:%s)(?:/[a-z0-9-]+)*)/(?=["\'?#&)])'%PATHS, r'\1', code)
    code=code.replace('https://infrahunt.ru/"','https://infrahunt.ru"')
    return code

def wrap(parts, name):
    return f'<div class="ih ih-{name}">'+''.join(parts)+'</div>'

def page_blocks(s):
    m=re.search(r'<main id="main"[^>]*>',s); a=m.end(); b=s.index('</main>',a)
    kids=children(s,a,b); groups=[]
    for el in kids:
        c=cls(el[3])
        if el[2]=='script':
            groups[-1][0].append(s[el[0]:el[1]]); continue
        if c[:1]==['wrap'] and len(c)<=1 and len(children(s,*inner(s,el)))>1 and len([k for k in kids if k[2]!='script'])<=1:
            ia,ib=inner(s,el); open_tag=s[el[0]:ia]; sub=children(s,ia,ib); cur=[]
            intro=True
            for se in sub:
                frag=s[se[0]:se[1]]
                if se[2]=='script' and not cur and groups:
                    groups[-1][0][-1]=groups[-1][0][-1][:-6]+frag+'</div>'; continue
                if se[2]=='script' and cur: cur.append(frag); continue
                cur.append(frag)
                if intro:
                    if re.search(r'<h1\b',frag): intro=False; groups.append([[open_tag+''.join(cur)+'</div>'],'intro']); cur=[]
                    continue
                groups.append([[open_tag+''.join(cur)+'</div>'], (cls(se[3])[:1] or [se[2]])[0]]); cur=[]
            if cur:
                if groups: groups[-1][0][-1]=groups[-1][0][-1][:-6]+''.join(cur)+'</div>'
                else: groups.append([[open_tag+''.join(cur)+'</div>'],'wrap'])
            continue
        frag=s[el[0]:el[1]]
        name=next((x for x in c if x not in ('wrap','section','block')),None) or (re.search(r'id="([^"]+)"',el[3]) or [None,el[2]])[1]
        groups.append([[frag],name])
    # Блок только с хлебными крошками приклеиваем к следующему.
    out=[]
    for parts,name in groups:
        if out and out[-1][1]=='crumbs': out[-1]=[out[-1][0]+parts,name]; continue
        joined=''.join(parts)
        if 'class="breadcrumbs' in joined and not re.search(r'<(section|h1|h2|header)\b',joined): out.append([parts,'crumbs']); continue
        out.append([parts,name])
    return out

MARK=[('lead','id="lead-dialog"'),('media','id="media-dialog"'),('catalog','data-catalog'),('hero','class="slider'),
      ('compare','id="compare-data"'),('cart','id="cart-data"'),('video','data-media-filter'),('kontakty','data-copy'),('product','data-gallery')]
JS={k:open(os.path.join(W,'work','js',k+'.js')).read() for k in ['runtime']+[m[0] for m in MARK]}
def with_scripts(code, used, force=()):
    keys=list(force)+[k for k,mk in MARK if mk in code]
    add=[k for k in keys if k not in used]; used.update(add)
    return code+''.join(f'\n<script>\n{JS[k]}\n</script>' for k in add)

pages=[]
files=sorted(glob.glob(os.path.join(DIST,'**','index.html'),recursive=True))+[os.path.join(DIST,'404.html')]
for f in files:
    s=open(f).read()
    route='/'+os.path.relpath(os.path.dirname(f),DIST).replace('.','').strip('/') if f.endswith('index.html') else '/404'
    route=route.rstrip('/') or '/'
    alias='' if route=='/' else ('not-found' if route=='/404' else route.strip('/'))
    key=alias.replace('/','__') or 'index'
    head=s.split('</head>')[0]
    title=H.unescape(re.search(r'<title>(.*?)</title>',head).group(1))
    descr=H.unescape(re.search(r'<meta name="description" content="([^"]*)"',head).group(1))
    noindex='noindex' in head
    ld=''.join(re.findall(r'<script type="application/ld\+json">.*?</script>',head))
    blocks=[]; used=set()
    for i,(parts,name) in enumerate(page_blocks(s)):
        code=fix(wrap(parts,re.sub(r'[^a-z0-9-]','',name.lower()) or 'block'))
        code=with_scripts(code,used)
        if i==0: code=fix(ld)+code  # микроразметка: <head> до оплаты тарифа закрыт
        blocks.append({'name':name,'file':f'{key}/{i:02d}-{name}.html'})
        os.makedirs(os.path.join(OUT,key),exist_ok=True); open(os.path.join(OUT,blocks[-1]['file']),'w').write(code)
    pages.append({'route':route,'alias':alias,'key':key,'title':title,'descr':descr,'noindex':noindex,'headcode':fix(ld),'blocks':blocks})

# Шапка и подвал — отдельные страницы проекта (Тильда подставляет их на все страницы).
s=open(os.path.join(DIST,'index.html')).read()
body=s[s.index('<body'):s.index('</body>')]
hdr=re.search(r'<a class="skip-link".*?</header>',body,re.S).group(0)
ftr=re.search(r'<footer.*?</footer>',body,re.S).group(0)
media=re.search(r'<dialog class="media-dialog".*?</dialog>',body,re.S).group(0)
lead=re.search(r'<dialog class="lead".*?</dialog>\s*<script type="application/json" id="lead-data">.*?</script>',body,re.S).group(0)
toast=re.search(r'<div class="toast"[^>]*></div>',body).group(0)
os.makedirs(os.path.join(OUT,'_header'),exist_ok=True); os.makedirs(os.path.join(OUT,'_footer'),exist_ok=True)
used=set()
shared={'header':[('_header/00-header.html',with_scripts(fix(wrap([hdr],'header')),used,force=['runtime']))],
        'footer':[('_footer/00-footer.html',fix(wrap([ftr],'footer'))),
                  ('_footer/01-media.html',with_scripts(fix(wrap([media],'media')),used)),
                  ('_footer/02-lead.html',with_scripts(fix(wrap([lead],'lead')),used)),
                  ('_footer/03-toast.html',fix(wrap([toast],'toast')))]}
for part in shared.values():
    for fn,code in part: open(os.path.join(OUT,fn),'w').write(code)
json.dump({'pages':pages,'shared':{k:[fn for fn,_ in v] for k,v in shared.items()}},open(os.path.join(W,'work','pages.json'),'w'),ensure_ascii=False,indent=1)
for p in pages: print(p['route'], len(p['blocks']), [b['name'] for b in p['blocks']])
