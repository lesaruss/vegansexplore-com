# mkspec.py name "Head 1|Head 2" "a-b,a-b,..."  -> klaper-<name>-v1.json from the tip-1 spec, captions from w/<name>.txt (word~start)
import json,sys,re
S='$SCRATCH'
name=sys.argv[1]; head=sys.argv[2].split('|'); parts=[[float(x) for x in p.split('-')] for p in sys.argv[3].split(',')]
J=0.25
base=json.load(open(S+'/klaper-b12-soil-v1.json'))
if len(sys.argv)>4: base['label']=sys.argv[4]
base['head']=head; base['parts']=parts; base['out_name']=f'klaper-{name}-v1.mp4'
toks=[t.rsplit('~',1) for t in open(f'{S}/w/{name}.txt').read().split()]
toks=[(w.replace('"',''),float(s)) for w,s in toks]
offs=[];acc=0
for a,b in parts: offs.append(acc); acc+=b-a-J
total=acc+J
FILL={'uh','um','oh'}
FIX={'dose':[("'cause, you","'cause you"),('your, peripheral','your peripheral')],
 'labels':[('work, just','work just')],
 'iodine':[('then, you','then you'),('Since Vegans we','Since Vegans, we')],
 'vitd':[('You, you\'d be wise to, take',"You'd be wise to take"),('you, you\'d be wise to, take',"you'd be wise to take")],
 'outside':[("It's, we're","We're")],
 'doctor':[('people, who','people who')]}
def clean(w):
    if '-' in w:
        p,r=w.split('-',1)
        if len(p)<=3 and r.lower().startswith(p.lower()): w=r
    w=re.sub(r'\b(v)egan',lambda m:'Vegan',w); w=re.sub(r'\bVegans?\b',lambda m:m.group(0),w)
    w=w.replace('vegan','Vegan').replace('dietician','dietitian')
    return w
W=[]
for w,s in toks:
    for k,(a,b) in enumerate(parts):
        if a-0.05<=s<b-0.08:
            base_w=re.sub(r'[^a-z0-9]','',w.lower())
            if base_w in FILL or w.endswith('-') or w.endswith('--'): break
            w=clean(w)
            if W and W[-1][2]==k and re.sub(r'[^a-z0-9]','',W[-1][0].lower())==base_w: W.pop()
            W.append((w,offs[k]+s-a,k)); break
caps=[];pos=0
lines=[l.strip() for l in open(f'{S}/w/{name}.cap') if l.strip()]
for l in lines:
    n=len(l.split()); first=W[pos]; caps.append({'t0':first[1],'text':l.replace('_ ','')})
    print(f"   check: [{first[0]}] ~ [{l.split()[0]}]")
    pos+=n
assert pos==len(W), f'token count {pos} vs {len(W)}: '+' '.join(x[0] for x in W)
for i,c in enumerate(caps):
    c['t0']=0.0 if i==0 else round(max(0,c['t0']-0.1),2)
for i,c in enumerate(caps):
    c['t1']=caps[i+1]['t0'] if i+1<len(caps) else round(total,2)
base['captions']=caps
json.dump(base,open(f'{S}/klaper-{name}-v1.json','w'),indent=1,ensure_ascii=False)
print(f'== {name} {round(total,1)}s')
for c in caps: print(f"  {c['t0']:6.2f}-{c['t1']:6.2f} {c['text']}")
