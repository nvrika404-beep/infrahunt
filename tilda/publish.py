# Публикует все страницы проекта (после правок шапки или подвала нужно переопубликовать всё).
import json,subprocess,time,os,sys
T=os.path.dirname(os.path.abspath(__file__))
st=json.load(open(os.path.join(T,'state.json')))
keys=sys.argv[1:] or ['_header','_footer']+[k for k in st['pages'] if not k.startswith('_')]
fails=[]
for k in keys:
    for a in range(6):
        out=subprocess.run(['python3','-I',os.path.join(T,'call.py'),'publish_page',json.dumps({'projectid':58806103,'pageid':st['pages'][k]})],capture_output=True,text=True).stdout
        if 'Rate limit' in out: time.sleep(65); continue
        break
    if '"wslink"' not in out: fails.append(k); print('FAIL',k,out[:150],flush=True)
print('published',len(keys)-len(fails),'of',len(keys))
