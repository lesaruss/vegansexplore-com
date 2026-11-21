# mkspec3.py base.json out.json "Head1|Head2" "Label" "a-b,a-b" capfile : captions from "episode_time|text" lines
import json,sys
base,out,head,label,parts,cap=sys.argv[1:7]
J=0.25; S=json.load(open(base)); P=[[float(x) for x in p.split('-')] for p in parts.split(',')]
offs=[];acc=0
for a,b in P: offs.append(acc); acc+=b-a-J
total=round(acc+J,2)
def m(x):
    for k,(a,b) in enumerate(P):
        if a-0.3<=x<=b: return offs[k]+x-a
    raise SystemExit(f'time {x} not in parts')
caps=[]
for l in open(cap):
    if '|' not in l: continue
    t,txt=l.strip().split('|',1); caps.append({'t0':max(0,round(m(float(t))-0.1,2)),'text':txt})
caps[0]['t0']=0.0
for i,c in enumerate(caps): c['t1']=caps[i+1]['t0'] if i+1<len(caps) else total
S.update(head=head.split('|'),label=label,parts=P,captions=caps,out_name=out.rsplit('/',1)[1].replace('.json','.mp4'))
json.dump(S,open(out,'w'),indent=1,ensure_ascii=False)
print(out.rsplit('/',1)[1],total,'s',len(caps),'captions')
