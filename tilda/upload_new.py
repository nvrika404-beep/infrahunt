# Загружает на CDN Тильды картинки сайта, которых ещё нет в map.json (новые обложки, фото товаров).
import json,os,re,glob,base64,subprocess,sys,html
T=os.path.dirname(os.path.abspath(__file__)); DIST=os.path.join(T,'work','site','dist')
mp=os.path.join(T,'map.json'); m=json.load(open(mp))
MIME={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.gif':'image/gif'}
refs=set()
for f in glob.glob(os.path.join(DIST,'**','*.html'),recursive=True):
    s=html.unescape(open(f).read())
    refs.update(re.findall(r'(/(?:img|media|cursor)/[^"\'\s)>,\\]+\.(?:webp|png|jpe?g|svg|gif))',s))
new=sorted(r for r in refs if r not in m and os.path.exists(DIST+r))
if not new: sys.exit(0)
if not os.environ.get('TILDA_MCP_KEY'): sys.exit(f'Новые картинки не загружены (нет TILDA_MCP_KEY): {new}')
for i in range(0,len(new),4):
    batch=new[i:i+4]
    images=[{'image_base64':base64.b64encode(open(DIST+r,'rb').read()).decode(),'mimetype':MIME[os.path.splitext(r)[1].lower()],'filename':os.path.basename(r)} for r in batch]
    out=subprocess.run(['python3','-I',os.path.join(T,'call.py'),'upload_image','-'],input=json.dumps({'projectid':58806103,'images':images}),capture_output=True,text=True).stdout
    for r,im in zip(batch,json.loads(out)['images']): m[r]=im['url']; print('загружено',r)
    json.dump(m,open(mp,'w'),indent=0)
