import base64, io, json, html
from PIL import Image
D={'welcome':4.127,'reached':33.620,'tips':6.504,'pulse':5.016,'directory':14.942,'businesses':6.531,'events':10.397,'support':4.780,'partner':7.184,'start':7.523,'here':11.938}
order=list(D); st={}; t=0
for k in order: st[k]=t; t+=D[k]+0.4
def img(p, w=1000, crop=None):
    im=Image.open(p).convert('RGB')
    if crop: im=im.crop(crop)
    if im.size[0]>w: im=im.resize((w,int(im.size[1]*w/im.size[0])))
    b=io.BytesIO(); im.save(b,'JPEG',quality=74); return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
F=[
 dict(n=1,t=st['welcome'],ch='Welcome',src='sb/dani.webp',line="Hi, I'm Dani. Welcome to Vegans Explore. I'll be your guide.",shot="Dani waves, the Vegans Explore logo comes in beside her.",kind='Have',note='Dani’s profile art.'),
 dict(n=2,t=st['reached'],ch='You’ve reached the Nonprofit Guide',src='sb/banner.jpg',line="If you lead a Vegan nonprofit, a rescue or a sanctuary, you probably have a thousand ideas and not enough hands. Passion keeps the doors open, but it can’t do the fundraising, the marketing and the day-to-day on its own.",shot="The Guide’s banner: Dani with a rescued rabbit. Slow push in.",kind='Have',broll="Round 2 option: an illustrated still of a small rescue team stretched thin (paperwork, phones, a dog waiting). About 2 credits."),
 dict(n=3,t=st['reached']+16.2,ch='You’ve reached the Nonprofit Guide',src='sb/dani.webp',line="And the people who help steer the ship often get pulled somewhere else. Our founder has worked alongside hundreds of organizations, and we built this so you don’t have to do it alone.",shot="Dani close, warm. Text on screen: “You don’t have to do it alone.”",kind='Have',broll="Round 2 option: a volunteer waving goodbye at a sanctuary gate, then Dani with a team around a table. About 4 credits for two stills."),
 dict(n=4,t=st['reached']+27.8,ch='You’ve reached the Nonprofit Guide',src='sb/f05-home.png',line="You go from carrying everything yourself to having a home base, a playbook and a community behind you.",shot="The Guide’s first page, the three cards light up one by one.",kind='Have'),
 dict(n=5,t=st['tips'],ch='The 10 tips',src='sb/f06-tips.png',line="The ten tips cover fundraising and staying relevant, one at a time, each with what to do this week.",shot="The tips list, tip 1 outlined.",kind='Have'),
 dict(n=6,t=st['pulse'],ch='Pulse',src='sb/f07-pulse.png',line="Pulse has our conversations with nonprofit leaders. Hear how they did it, right here.",shot="The nonprofit series, a Play button pressed.",kind='Have'),
 dict(n=7,t=st['directory'],ch='Directory and Get found',src='sb/f08-directory.png',line="The Directory is where members find nonprofits, rescues and sanctuaries, city by city.",shot="The Directory’s organization cards, zooming across a city.",kind='Have'),
 dict(n=8,t=st['directory']+5.6,ch='Directory and Get found',src='sb/f09-found.png',line="Get found shows you how to claim your page and keep it current. If anyone sees something wrong with a listing, they can tell our team, and we look into it.",shot="Get found’s steps; then the Feedback button on a listing.",kind='Have'),
 dict(n=9,t=st['businesses'],ch='Businesses',src='sb/f10-businesses.png',line="Businesses shows Vegan brands and restaurants near you that fit a partnership, with a pitch you can send.",shot="Brands and restaurants near you, the pitch to copy.",kind='Recapture',note='Shows placeholder lines here. Final cut uses the member view.'),
 dict(n=10,t=st['events'],ch='Events',src='sb/f11-events.png',line="Events puts your next event on our calendar and in the Daily Pulse.",shot="The four event steps, Put it on our calendar outlined.",kind='Have'),
 dict(n=11,t=st['events']+5.0,ch='Events',src='sb/f12-fosters.png',line="Need a foster? Post it on your city’s Fosters board, where local members are looking.",shot="The Central Florida Fosters board, Post to Fosters outlined.",kind='Have',note='This board still says “your Passport is $11 one time”. Fix before the cut.'),
 dict(n=12,t=st['support'],ch='Support',src='sb/f13-support.png',line="Support covers what wears small teams down, and how to share the load.",shot="Three weaknesses, Share the load.",kind='Recapture',note='Final cut uses the member view.'),
 dict(n=13,t=st['partner'],ch='Become a Partner',src='sb/f14-partner.png',line="And when you’re ready, Become a Partner gives your organization its own link, points for our services and a badge.",shot="The partnership cards, the badge on a listing.",kind='Have'),
 dict(n=14,t=st['start'],ch='Where to start',src='sb/f15-start.png',line="Start with the short survey about your organization. It’s free, it makes you a member, and it tells us what you need, because we’re building this with you.",shot="Free with the survey, the button outlined, a cursor taps it.",kind='Have'),
 dict(n=15,t=st['here'],ch='I\u2019m here',src='sb/dani.webp',line="I\u2019m right here. Ask me anything, and if I can\u2019t answer, I\u2019ll take it to our team.",shot="Dani on screen, briefly, as she offers help.",kind='Have'),
 dict(n=16,t=st['here']+5.14,ch='I\u2019m here',src='sb/h2-hidden.png',line="Hide me to see the full page,",shot="The real Guide: Hide me folds Dani into the corner and the page takes the full width. The Show me square is outlined.",kind='Have'),
 dict(n=17,t=st['here']+7.0,ch='I\u2019m here',src='sb/h3-back.png',line="tap me to bring me back, and on any page, tap me and I\u2019ll summarize it.",shot="Tap the corner square and Dani slides back in beside the page. Then the summary.",kind='Build',note='Hide and show are live today. Summarize this page is not built yet, so its part of this frame stays a mock.'),
]
for i,f in enumerate(F): f['end']=F[i+1]['t'] if i+1<len(F) else t
for f in F: f['img']=img(f['src'])
aud='data:audio/mpeg;base64,'+base64.b64encode(open('tour.mp3','rb').read()).decode()
def mmss(s): s=int(round(s)); return f"{s//60}:{s%60:02d}"
cards=''.join(f'''<article class="fr" id="f{f['n']}" data-t="{f['t']:.2f}">
<div class="pic"><img src="{f['img']}" alt="Frame {f['n']}: {html.escape(f['ch'])}"></div>
<div class="meta"><div class="top"><span class="num">{f['n']:02d}</span><span class="time">{mmss(f['t'])} to {mmss(f['end'])}</span><span class="tag {f['kind'].lower()}">{ {'Have':'Ready','Recapture':'Recapture','Build':'Mock'}[f['kind']] }</span></div>
<h3>{html.escape(f['ch'])}</h3><p class="line">“{html.escape(f['line'])}”</p>
<p class="shot"><b>On screen:</b> {html.escape(f['shot'])}</p>
{('<p class="note">'+html.escape(f['note'])+'</p>') if f.get('note') else ''}
{('<p class="broll"><b>B-roll:</b> '+html.escape(f['broll'])+'</p>') if f.get('broll') else ''}
<button type="button" class="play" data-go="{f['t']:.2f}">Play from here</button></div></article>''' for f in F)
data=json.dumps([{'n':f['n'],'t':round(f['t'],2),'img':f['img'],'ch':f['ch'],'line':f['line']} for f in F])
page=open('tpl.html').read().replace('%%CARDS%%',cards).replace('%%AUD%%',aud).replace('%%DATA%%',data).replace('%%TOTAL%%',mmss(t))
open('lookbook.html','w').write(page)
print(len(page)//1024,'KB', mmss(t))
