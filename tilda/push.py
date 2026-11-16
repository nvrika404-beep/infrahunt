# Загружает страницы и блоки на Тильду. Состояние в state.json: повторный запуск обновляет только изменённое.
import json,os,sys,subprocess,hashlib,time
W=os.path.dirname(os.path.abspath(__file__)); T=W; P=58806103
st_path=os.path.join(W,'state.json'); st=json.load(open(st_path)) if os.path.exists(st_path) else {'pages':{},'records':{}}
save=lambda: json.dump(st,open(st_path,'w'),ensure_ascii=False,indent=1)
def call(tool,args,expect=None):
    for attempt in range(6):
        r=subprocess.run(['python3','-I',os.path.join(T,'call.py'),tool,json.dumps(args,ensure_ascii=False)],capture_output=True,text=True)
        out=r.stdout.strip()
        if 'Rate limit' in out: print('  rate limit, wait',flush=True); time.sleep(65); continue
        if r.returncode==0 and (expect is None or out==expect): return out
        print(f'  {tool} attempt {attempt}: {out[:200]}',flush=True); time.sleep(5)
    raise SystemExit(f'{tool} failed')
def page(key,title,descr,alias):
    pid=st['pages'].get(key)
    if not pid:
        pid=int(call('add_blank_page',{'projectid':P})); st['pages'][key]=pid; save()
    call('update_page_settings',{'projectid':P,'pageid':pid,'title':title,'descr':descr,'alias':alias,'date':'2026-11-16 14:00'},'OK')
    return pid
def block(pid,file,afterid):
    code=open(os.path.join(W,'work','blocks',file)).read(); h=hashlib.md5(code.encode()).hexdigest()
    rec=st['records'].get(file)
    if rec and rec['page']==pid and rec['hash']==h: return rec['id']
    if not rec or rec['page']!=pid:
        args={'projectid':P,'pageid':pid,'tplid':1370}
        if afterid: args['afterid']=afterid
        rid=json.loads(call('add_record',args))['recordid']
        call('update_record',{'projectid':P,'pageid':pid,'recordid':rid,'tab':'settings','fields':{'animationoff':'on','blockbackground':'#0b0c0f'}},'OK')
        rec={'id':rid,'page':pid,'hash':''}; st['records'][file]=rec; save()
    call('update_record',{'projectid':P,'pageid':pid,'recordid':rec['id'],'tab':'content','only_field':'code','fields':{'code':code}},'OK')
    rec['hash']=h; save(); return rec['id']
cfg=json.load(open(os.path.join(W,'work','pages.json')))
want=sys.argv[1:]  # ключи страниц или shared
if 'shared' in want:
    for part,files in cfg['shared'].items():
        pid=page('_'+part,'Шапка сайта' if part=='header' else 'Подвал сайта','',part)
        prev=None
        for f in files: prev=block(pid,f,prev)
        print(part,pid,flush=True)
for p in cfg['pages']:
    if want and p['key'] not in want and 'all' not in want: continue
    pid=page(p['key'],p['title'],p['descr'],p['alias'])
    prev=None
    for b in p['blocks']: prev=block(pid,b['file'],prev)
    print(p['key'],pid,len(p['blocks']),flush=True)
