# Заводит товары сайта в Каталог Тильды (для YML-фида Яндекса). Данные — из собранного сайта и catalog.json.
# Повторный запуск обновляет те же товары: UID хранятся в state.json (ключ store).
import json,os,re,html,subprocess,time,sys
T=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(T); P=58806103
st_path=os.path.join(T,'state.json'); st=json.load(open(st_path)); st.setdefault('store',{'parts':{},'products':{}})
save=lambda: json.dump(st,open(st_path,'w'),ensure_ascii=False,indent=1)
amap=json.load(open(os.path.join(T,'map.json')))
def call(tool,args):
    for a in range(6):
        r=subprocess.run(['python3','-I',os.path.join(T,'call.py'),tool,json.dumps(args,ensure_ascii=False)],capture_output=True,text=True)
        out=r.stdout.strip()
        if 'Rate limit' in out: time.sleep(65); continue
        if r.returncode==0: return out
        print('  ',tool,out[:300],flush=True); time.sleep(3)
    raise SystemExit(f'{tool} failed')
catalog={p['slug']:p for p in json.load(open(os.path.join(ROOT,'src/data/catalog.json')))}
s=open(os.path.join(T,'work/site/dist/compare/index.html')).read()
cmp=json.loads(html.unescape(re.search(r'<script type="application/json" id="compare-data">(.*?)</script>',s,re.S).group(1)))
pages={p['key']:p for p in json.load(open(os.path.join(T,'work/pages.json')))['pages']}
for c in cmp:
    raw=catalog[c['slug']]; page=pages['product__rikanv-'+c['slug']]
    part=c['category']
    if part not in st['store']['parts']:
        existing={x['title']:x['uid'] for x in json.loads(call('store_get_parts_list',{'projectid':P}))['parts']}
        if part not in existing: call('store_create_parts',{'projectid':P,'title':part})  # отвечает внутренним id, нужен uid из списка
        existing={x['title']:x['uid'] for x in json.loads(call('store_get_parts_list',{'projectid':P}))['parts']}
        st['store']['parts'][part]=existing[part]; save()
    uid=st['store']['products'].get(c['slug'])
    if not uid:
        uid=int(call('store_create_products',{'projectid':P,'title':c['name'],'storepartuid':st['store']['parts'][part]}))
        st['store']['products'][c['slug']]=uid; save()
    seen=set(); titles=[]; values=[]
    for g in c['groups']:
        if g['title']=='Основное': continue
        for k,v in g['rows']:
            name=k if k not in seen else f"{g['title']}: {k}"
            seen.add(k); titles.append(name); values.append(v)
    gallery=[{'img':amap[i['src']]} for i in raw['images'] if i['src'] in amap]
    url='https://infrahunt.ru'+c['url'].rstrip('/')
    args={'projectid':P,'productuid':uid,'title':c['name'],'brand':'RikaNV','sku':c['slug'],
          'descr':page['descr'],'text':raw['description'].replace('\n','<br>'),
          'price':str(c['price'] or ''),'partuids':str(st['store']['parts'][part]),
          'gallery':json.dumps(gallery,ensure_ascii=False),'buttonlink':url,
          'characteristics':{'title':titles,'value':values},
          'off':'' if c['price'] else 'y',
          'seo_title':page['title'],'seo_descr':page['descr']}
    out=call('store_save_products',args)
    print(c['slug'],uid,'цена' if c['price'] else 'скрыт (цена по запросу)',len(gallery),'фото',len(titles),'характеристик',out[:80].replace('\n',' '),flush=True)
