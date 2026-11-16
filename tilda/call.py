# usage: python3 call.py TOOL '{"arg":...}'  (или TOOL - и аргументы JSON в stdin) — вызывает инструмент Тильды и печатает текст результата
import json,subprocess,sys,os
D=os.path.dirname(os.path.abspath(__file__))
body={"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":sys.argv[1],"arguments":json.loads(sys.stdin.read() if sys.argv[2:]==["-"] else sys.argv[2]) if len(sys.argv)>2 else {}}}
# Тело запроса идёт через stdin: картинки в base64 не помещаются в аргументы командной строки.
out=subprocess.run([D+'/mcp.sh'],input=json.dumps(body,ensure_ascii=False),capture_output=True,text=True).stdout
try: r=json.loads(out)
except Exception: print(out[:3000]); sys.exit(1)
if 'error' in r: print('ERROR',r['error']); sys.exit(1)
for c in r['result'].get('content',[]):
    print(c.get('text',c))
if r['result'].get('isError'): sys.exit(2)
