import numpy as np, sys
SR=44100
r=lambda n: np.fromfile(n+'.44.raw',dtype=np.float32).astype(np.float64)
mix,v,bed,take=r('holiday-guide-v1'),r('holiday-guide-theo-v1'),r('holiday-spot-v1'),r('take1')
OFF=1.5
s=lambda t:int(round(t*SR))
def rms(x): return np.sqrt(np.mean(x**2))
# gains fitted from the mix just before the cut (voice + bed)
a,b=s(OFF+25.0),s(OFF+28.0)
A=np.stack([v[a-s(OFF):b-s(OFF)],bed[a:b]],1); g=np.linalg.lstsq(A,mix[a:b],rcond=None)[0]
vg,bg=g; print('fitted vg %.3f bg %.3f'%(vg,bg))
# original last sentence level vs new
old=v[s(28.56):s(31.74)]; new=take[s(29.62):s(32.12)]
lv=rms(old)/rms(new); print('level match x%.3f'%lv)
# new line: from 29.40 in take (after 'it.' 29.06) to end of 'guide.' + 0.25 s; shorten the 0.58 s pause after 'below' (30.30-30.88) to 0.25 s
p1,p2=s(30.40),s(30.73)   # remove 0.33 s from the middle of the pause
line=np.concatenate([take[s(29.40):p1-s(0.01)]*1, take[p2:s(32.12)+s(0.30)]])
# tiny crossfade at the internal cut
cf=s(0.01); seg1=take[s(29.40):p1]; seg2=take[p2:s(32.42)]
x=np.linspace(0,1,cf); line=np.concatenate([seg1[:-cf], seg1[-cf:]*(1-x)+seg2[:cf]*x, seg2[cf:]])
line=line*lv
# cut point in the mix: in the original's gap after 'it.' (voice 28.00-28.56), at voice 28.20 -> mix 29.70
cut=s(OFF+28.20)
head=mix[:cut]
lead=s(0.02)  # the new line starts 0.20 s before 'Tap' (take 29.40 -> 'Tap' 29.62)
tail_len=len(line)+s(0.45)+s(2.5)
t0=cut
bseg=bed[t0:t0+tail_len]
if len(bseg)<tail_len: bseg=np.pad(bseg,(0,tail_len-len(bseg)))
env=np.ones(tail_len); f0=len(line)+s(0.45); env[f0:]=np.linspace(1,0,tail_len-f0)**2
tail=bseg*bg*env
tail[:len(line)]+=line*vg
# 25 ms crossfade into the tail
cf=s(0.025); x=np.linspace(0,1,cf)
tail[:cf]=mix[cut:cut+cf]*(1-x)+tail[:cf]*x
out=np.concatenate([head,tail])
pk=np.max(np.abs(out)); print('len %.2f s peak %.3f'%(len(out)/SR,pk))
if pk>0.98: out*=0.98/pk
out.astype(np.float32).tofile('banner.44.raw')
