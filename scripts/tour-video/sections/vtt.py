import json,sys,re
words=json.load(open(sys.argv[1])); script=open(sys.argv[2]).read().split(); lead=float(sys.argv[3])
assert len(words)==len(script),(len(words),len(script))
def ts(t): h=int(t//3600);m=int(t%3600//60);s=t%60;return f'{h:02d}:{m:02d}:{s:06.3f}'
cues=[];cur=[]
for i,(w,st,en) in enumerate(words):
  cur.append((script[i],st,en)); txt=' '.join(x[0] for x in cur)
  if re.search(r'[.:!?]$',script[i]) or len(txt)>70 or (re.search(r',$',script[i]) and len(txt)>40):
    cues.append(cur);cur=[]
if cur: cues.append(cur)
out=['WEBVTT','']
for c in cues: out+= [f'{ts(c[0][1]+lead)} --> {ts(c[-1][2]+lead+0.2)}',' '.join(x[0] for x in c),'']
print('\n'.join(out))
