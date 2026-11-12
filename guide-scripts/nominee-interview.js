/* Kai's interview for a nominee, /nominate/interview (Sean, 2026-11-09 approved the design; 2026-11-12 "build step 2").
 * The page is a copy of nominate.html (the Explorer Guide's shell, in the Color Block look); this file follows guide-scripts/nominate.js and
 * the approved mock /mocks/nominate/interview.html. Server: ve-nominations (interview_get, answer_upload, answer_save, interview_send,
 * interview_join, place_search, submit). The link in Kai's invitation opens it with ?t=<invite token>; ?preview=1 walks it with sample answers.
 *
 *   #/                 Overview: Kai's personal welcome (her opening with their names, the nominator's own recording, her closing)
 *   #/interview/1..8   Kai asks each question on video (recorded, approved); they answer by voice, dictation or writing; saved as they go
 *   #/interview/9      Read it over, the release, Send my interview
 *   #/nominate/1..2    Nominate someone (optional, Skip this)
 *   #/member           You're a member (Founding Member, the badges, 250 points)
 *   #/account          Set up your account (Google, or email and a password); joining admits them, then the members' Welcome Guide
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-nominations';
  var MEDIA = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/kai/';
  var PIC = '/public/guides/';
  var KAI = PIC + 'nominate/kai-';
  var MAX = 120;
  var MIC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var CSS = [
    '.nm-mock{margin:0;background:#FFF7EC;color:#5a3a00;border-bottom:1px solid #f5d9b0;font-size:12px;font-weight:600;padding:8px 40px;}',
    '.nm-mock b{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;border:2px solid #b45309;border-radius:6px;padding:1px 7px;margin-right:8px;}',
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    '.nm-quote{border-left:4px solid #F69820;background:var(--warm);border-radius:0 12px 12px 0;padding:12px 16px;margin:12px 0 4px;font-size:15px;line-height:1.55;}',
    '.nm-quote small{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;font-weight:800;color:#8a5a00;flex-wrap:wrap;}',
    '.nm-play{display:inline-flex;align-items:center;gap:6px;color:var(--g);font-weight:800;}',
    '.nm-play i{width:22px;height:22px;border-radius:50%;background:var(--g);display:grid;place-items:center;}',
    '.nm-play i::after{content:"";border-left:7px solid #fff;border-top:4px solid transparent;border-bottom:4px solid transparent;margin-left:2px;}',
    '.nm-f{display:block;font-size:12px;font-weight:800;margin:10px 0 4px;color:var(--ink);}',
    '.nm-f small{font-weight:600;color:var(--ink55);}',
    '.nm-in{width:100%;border:1px solid #cfcfcf;border-radius:6px;padding:11px 12px;font:inherit;font-size:14px;background:#fff;color:var(--ink);}',
    '.nm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;}',
    '.nm-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '.nm-chip{border:1px solid #cfcfcf;border-radius:6px;padding:8px 12px;font-size:13px;font-weight:700;background:#fff;cursor:pointer;font-family:inherit;}',
    '.nm-chip[aria-pressed=true]{background:var(--g);border-color:var(--g);color:#fff;}',
    '.nm-modes{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:8px;margin:4px 0 12px;}',
    '.nm-mode{border:1px solid #cfcfcf;border-radius:8px;padding:10px 12px;font-size:12.5px;line-height:1.4;color:var(--ink75);background:#fff;text-align:left;font-family:inherit;cursor:pointer;}',
    '.nm-mode b{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--ink);margin-bottom:2px;}',
    '.nm-mode[aria-pressed=true]{border:2px solid var(--g);background:var(--gl);}',
    '.nm-best{margin-left:auto;font-size:9.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;background:#F69820;color:#1a1a1a;border-radius:5px;padding:2px 6px;}',
    '.nm-rec{display:flex;align-items:center;gap:12px;border:1px dashed var(--gm);border-radius:12px;padding:12px;background:#f6fbf6;flex-wrap:wrap;}',
    '.nm-dot{width:44px;height:44px;border-radius:50%;background:#dc2626;display:grid;place-items:center;flex:none;box-shadow:0 0 0 6px rgba(220,38,38,.12);border:0;cursor:pointer;}',
    '.nm-dot i{width:14px;height:14px;border-radius:3px;background:#fff;}',
    '.nm-wave{flex:1 1 140px;height:26px;border-radius:4px;background:repeating-linear-gradient(90deg,var(--g) 0 3px,transparent 3px 7px);-webkit-mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);}',
    '.nm-rec small{flex:1 1 260px;font-size:12.5px;font-weight:700;color:var(--ink75);}',
    '.nm-check{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5;margin:10px 0;color:var(--ink75);}',
    '.nm-check input{margin-top:4px;accent-color:var(--g);}',
    '.nm-check b{color:var(--ink);}',
    '.nm-rv{display:grid;grid-template-columns:150px minmax(0,1fr);gap:6px 14px;font-size:14px;margin:6px 0 10px;}',
    '.nm-rv dt{font-weight:800;color:var(--ink55);font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding-top:2px;}',
    '.nm-prog{height:6px;border-radius:3px;background:#eee;margin:6px 0 4px;overflow:hidden;}',
    '.nm-prog i{display:block;height:100%;background:var(--g);}',
    '.nm-form .wg-gs-b{height:auto !important;overflow:visible !important;}',
    '.nm-steps{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 0;}.nm-steps span{font-size:12px;font-weight:800;border-radius:6px;padding:6px 11px;border:1px solid #cfcfcf;color:var(--ink55);}.nm-steps span.on{background:var(--g);border-color:var(--g);color:#fff;}.nm-steps span.dn{background:var(--gl);border-color:var(--gm);color:var(--g);}',
    '.nm-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:1px solid #dadce0;border-radius:6px;background:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;color:var(--ink);}.nm-google span{font-weight:900;color:#4285F4;font-size:16px;}',
    '.nm-apple{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:0;border-radius:6px;background:#000;color:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;margin-bottom:8px;}.nm-apple svg{width:16px;height:16px;fill:#fff;}',
    '.dg-maya.nm-vid::after{content:"\\25B6  Play Kai\'s welcome for you";position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.72);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;border-radius:6px;}',
    '.nm-gfx{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin:8px 0 18px;}',
    '.nm-g{position:relative;border-radius:12px;overflow:hidden;background:#14301c;color:#fff;display:flex;flex-direction:column;}',
    '.nm-g.sq{width:min(340px,100%);aspect-ratio:1;}.nm-g.st{width:min(220px,100%);aspect-ratio:9/16;}',
    '.nm-g-pic{flex:1 1 auto;min-height:0;background:#fff center bottom/contain no-repeat;}',
    '.nm-g-t{padding:12px 14px 40px;background:#14301c;position:relative;}',
    '.nm-g-t small{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c5f2c7;}',
    '.nm-g-t b{display:block;font-size:19px;font-weight:900;line-height:1.15;margin:4px 0;}',
    '.nm-g.st .nm-g-t b{font-size:17px;}',
    '.nm-g-t span{font-size:12px;font-weight:600;color:#e8f5e9;}',
    '.nm-g-logo{position:absolute;right:12px;bottom:10px;height:20px;}',
    '.nm-stamp{position:absolute;top:10px;right:10px;z-index:2;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;background:#fff;border:2px solid #b45309;border-radius:6px;padding:1px 7px;}',
    '.nm-me{position:relative;width:min(260px,100%);aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid var(--line);}.nm-me img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.nm-me-b{flex:1 1 280px;min-width:0;font-size:15px;line-height:1.55;color:var(--ink75);}.nm-me-b b{display:block;font-size:20px;font-weight:900;color:var(--ink);margin-bottom:4px;}',
    '.nm-q .wg-gs-pic{position:relative;}',
    '.nm-kq-btn{position:absolute;left:10px;bottom:16px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:6px;background:rgba(0,0,0,.78);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;cursor:pointer;}',
    '.nm-kq-ic{width:0;height:0;border-left:9px solid #fff;border-top:6px solid transparent;border-bottom:6px solid transparent;}',
    '.nm-kq.on .nm-kq-ic{width:10px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;}',
    '.nm-kq-bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(0,0,0,.25);}',
    '.nm-kq-bar b{display:block;height:100%;width:0;background:#22C55E;}',
    '.nm-kq video{display:block;width:100%;height:100%;object-fit:cover;}',
    '.nm-hint{font-size:12.5px;color:var(--ink55);margin:8px 0 0;}',
    '.nm-sel{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%231a1a1a%27 stroke-width=%272%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 16px center;}',
    '.nm-spots{list-style:none;padding:0;margin:0;display:grid;gap:8px;}',
    '.nm-spots li{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;}',
    '.nm-spots li>b{font-size:14px;}',
    '.nm-spots li.done{background:var(--gl);border-color:var(--gm);}',
    '.nm-spots li.done a{margin-left:auto;font-size:12px;font-weight:800;color:var(--g);}',
    '.nm-spots li.now{display:block;}.nm-spots li.now>b{display:block;margin-bottom:6px;}.nm-spots li.now .dg-btn{margin-top:8px;}',
    '@media (max-width:900px){.nm-form.nm-q .wg-gs-pic{display:block;width:100%;height:auto;aspect-ratio:1;max-width:240px;flex:none;}}',
    '.nm-or{text-align:center;font-size:12px;font-weight:700;color:var(--ink55);margin:12px 0 2px;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.nm-form .wg-gs-pic{display:none;}.nm-grid,.nm-modes{grid-template-columns:1fr;}.nm-rv{grid-template-columns:1fr;gap:2px;}.nm-rv dd{margin-bottom:8px;}}',
    '.dg-maya .nm-kv-btn{top:10px;bottom:auto;}@media (max-width:900px){.dg-maya .nm-kv-btn{top:6px;left:6px;padding:6px 8px;font-size:11px;}}',
    '.dg-maya .nm-kv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}.dg-maya.on .nm-kq-ic{width:10px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;}',
    '.nm-msg{min-height:20px;font-size:13.5px;font-weight:700;color:var(--g);margin:8px 0 0;}.nm-msg.bad{color:#b42318;}',
    '.nm-dot.live{animation:nmPulse 1.2s infinite;}@keyframes nmPulse{0%,100%{box-shadow:0 0 0 6px rgba(220,38,38,.12)}50%{box-shadow:0 0 0 12px rgba(220,38,38,.06)}}',
    '.nm-dot.idle{background:#fff;border:2px solid #dc2626;}.nm-dot.idle i{border-radius:50%;background:#dc2626;}',
    '.nm-rec audio{width:100%;margin-top:6px;}',
    '.nm-file{font-size:12.5px;color:var(--ink55);margin:8px 0 0;}.nm-file label{color:var(--g);font-weight:800;cursor:pointer;text-decoration:underline;}',
    '.nm-signed{font-size:14px;background:var(--gl);border:1px solid var(--gm);border-radius:10px;padding:10px 12px;margin:4px 0 6px;}'
  ].join('');

  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // Kai's questions, approved and recorded 2026-11-09 (kai/nominee-interview/q1..q8-v1.mp4): [key, short name, on the page, Kai says].
  var Q = [
    ['q1', 'Who You Are', 'Tell me who you are and what you do in your community.', 'Let\'s start easy. Tell me who you are, and what you do in your community. Your work, your passions, what people know you for.'],
    ['q2', 'Where You Live', 'Where do you live, and how long have you lived there?', 'Where do you live? South Florida, Central Florida, wherever home is. And how long have you lived there?'],
    ['q3', 'Your Vegan Origin Story', 'What\'s your Vegan origin story? Take me back to the moment it started.', 'What\'s your Vegan origin story? Take me back to the moment it started. Maybe a documentary, a friend, a meal, or an animal you met.'],
    ['q4', 'What You\'re Building', 'What are you building or working on right now for the Vegan movement?', 'What are you building or working on right now for the Vegan movement? A business, an event, a page, a project. Big or small.'],
    ['q5', 'Your Shout-Out', 'Who in your community has your back? Give them a shout-out.', 'Nobody does it alone. Who in your community has your back? Give them a shout-out.'],
    ['q6', 'Your Favorite Spots', 'Your favorite Vegan spots nearby, and why. Up to three.', 'What are your favorite Vegan spots nearby? Pick up to three, and tell me why you love each one.'],
    ['q7', 'Your Advice', 'What would you tell someone just starting out?', 'Someone listening is right where you once were. What would you tell someone just starting out?'],
    ['q8', 'What\'s Next', 'What\'s next for you, and how can people support it?', 'Last one. What\'s next for you, and how can people support it?']
  ];
  var YEARS = ['Less than a year', '1 to 5 years', '5 to 10 years', '10 years or more'];
  var ROLES = [['business_owner', 'Business owner'], ['content_creator', 'Content creator'], ['nonprofit', 'Works for a nonprofit'], ['activist', 'Activist']];
  var TABS = [
    { k: 'overview', label: 'Overview', art: 'welcome' },
    { k: 'interview', label: 'The Interview', art: 'listen' },
    { k: 'nominate', label: 'Nominate Someone', art: 'flowers', say: 'Who else deserves their flowers? Pass it on. This one is optional, so skip it if no one comes to mind.' },
    { k: 'member', label: 'You\'re a Member', art: 'cheer', say: 'That was amazing. Thank you for trusting me with your story.' },
    { k: 'account', label: 'Set Up Your Account', art: 'phone', say: 'Last thing: choose how you sign in. Then Liz shows you everything your membership opens up.' }
  ];

  var qs = new URLSearchParams(location.search);
  var PREVIEW = qs.get('preview') === '1';
  var T = qs.get('t') || '';
  try { if (T) localStorage.setItem('nm_invite', T); else if (!PREVIEW) T = localStorage.getItem('nm_invite') || ''; } catch (e) {}
  var D = null, CHAPTERS = [], A = {}, curTab = 'overview', loadErr = '';
  var W = { mode: 'rec', blob: null, type: '', seconds: 0, url: '', written: '', q: '', spot: null };
  var N = { name: '', email: '', roles: [], mode: 'rec', written: '', blob: null, type: '', seconds: 0, url: '' };
  var rec = null, chunks = [], t0 = 0, tick = null, recFor = null;

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function tok() { try { return localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function api(body) {
    var h = { 'Content-Type': 'application/json' }, t = tok(); if (t) h.Authorization = 'Bearer ' + t;
    return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k + (k === 'interview' || k === 'nominate' ? '/1' : '')); }
  function head(k, h, lede) { return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : ''); }
  function crumb(label) { return '<div class="dg-crumb"><a href="#/">Your Interview</a> &rsaquo; ' + esc(label) + '</div>'; }
  function card(kicker, title, picUrl, body, btns, cls, picHtml) {
    return '<section class="wg-gs' + (cls ? ' ' + cls : '') + '">' + (picHtml || '<span class="wg-gs-pic"><img src="' + esc(picUrl) + '" alt="" decoding="async" width="640" height="640"></span>') +
      '<div class="wg-gs-b"><div class="vgi-k">' + esc(kicker) + '</div><h3 class="wg-gs-t">' + esc(title) + '</h3>' + body +
      '<p class="nm-msg" id="nmMsg" role="status"></p>' + (btns ? '<div class="wg-gs-btns">' + btns + '</div>' : '') + '</div></section>';
  }
  function lines(ps) { return ps.map(function (x) { return '<p>' + x + '</p>'; }).join(''); }
  function artRow(picUrl, title, txt) { return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + esc(txt) + '</p></div></li>'; }
  function group(label, rows) { return '<div class="wg-grp"><h5>' + esc(label) + '</h5><ol>' + rows.join('') + '</ol></div>'; }
  function cta(k, title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({});
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  function say(t, bad) { var m = $('nmMsg'); if (m) { m.textContent = t || ''; m.className = 'nm-msg' + (bad ? ' bad' : ''); } }
  function isEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
  function first() { return (D && D.nominee.first_name) || 'there'; }
  function stepOf() { var m = location.hash.match(/^#\/[a-z]+\/(\d+)/); return m ? +m[1] : 1; }
  function answered(q) { var a = A[q]; return !!(a && (a.audio_url || a.written)); }
  function spots() { return ['q6s1', 'q6s2', 'q6s3'].filter(answered); }

  var SAMPLE = { ok: true, nominee: { first_name: 'Maria', name: 'Sample: Maria Rodriguez', email: 'maria@example.com', area: 'South Florida', area_slug: 'south-florida' },
    nominator: { name: 'Sample: Dana P.', named: true, written: 'She feeds the whole block every Thursday and never asks for anything back. Half of us tried Vegan food for the first time at her table.', audio_url: null },
    welcome: { url: null }, answers: {}, sent: false, joined: false };

  // ---------- Kai's welcome on the Overview: her opening (with their names), the nominator's own voice, her closing (two clips) ----------
  function welcomeParts() {
    var p = [];
    if (D && D.welcome && D.welcome.url) p.push({ a: D.welcome.url });
    if (D && D.nominator && D.nominator.audio_url) p.push({ a: D.nominator.audio_url });
    p.push({ v: MEDIA + 'nominee-welcome/closing-a-v1.mp4?v=1' }, { v: MEDIA + 'nominee-welcome/closing-b-v1.mp4?v=1' });
    return p;
  }
  function auto() { try { return sessionStorage.getItem('nm_kai_auto') === '1'; } catch (e) { return false; } }
  function setAuto(on) { try { sessionStorage.setItem('nm_kai_auto', on ? '1' : '0'); } catch (e) {} }
  var player = null;
  function drawRail(t, sayText) {
    bubble.textContent = sayText;
    var box = $('dgMaya'), btn = $('dgPlay'); box.style.backgroundImage = "url('" + KAI + t.art + ".jpg')";
    if (player) { player.stop(); player = null; }
    box.innerHTML = ''; btn.hidden = true;
    if (t.k !== 'overview') return;
    var parts = welcomeParts(), i = 0, playing = false;
    box.innerHTML = '<video class="nm-kv" playsinline preload="metadata" poster="' + KAI + 'welcome.jpg"></video><audio preload="none"></audio><i class="nm-kq-bar"><b></b></i>';
    var v = box.querySelector('video'), au = box.querySelector('audio'), bar = box.querySelector('.nm-kq-bar b');
    v.style.visibility = 'hidden';
    function label() { btn.innerHTML = playing ? '&#10074;&#10074; Pause' : (i >= parts.length ? '&#9654; Play again' : '&#9654; Play Kai\'s welcome'); }
    function el() { return parts[i] && parts[i].v ? v : au; }
    function load() { var p = parts[i]; if (p.v) { v.src = p.v; v.style.visibility = 'visible'; } else { au.src = p.a; v.style.visibility = 'hidden'; } }
    function go() { if (i >= parts.length) i = 0; load(); var pr = el().play(); if (pr && pr.catch) pr.catch(function () { playing = false; label(); }); playing = true; label(); }
    function next() { i++; bar.style.width = (i / parts.length * 100) + '%'; if (i < parts.length) go(); else { playing = false; v.style.visibility = 'hidden'; label(); } }
    v.onended = next; au.onended = next;
    btn.hidden = false; label();
    btn.onclick = function () { if (playing) { setAuto(false); el().pause(); playing = false; label(); } else { setAuto(true); if (el().src && !el().ended && i < parts.length) { el().play(); playing = true; label(); } else go(); } };
    player = { stop: function () { v.pause(); au.pause(); } };
  }

  // ---------- question clips (the same as the mock: Play lets the next question play; Pause stops it) ----------
  function kaiAsk(s) {
    return '<span class="wg-gs-pic nm-kq" data-kq="' + s + '"><video class="nm-kq-v" src="' + MEDIA + 'nominee-interview/q' + s + '-v1.mp4?v=1" poster="' + KAI + 'ask.jpg" playsinline preload="metadata"></video>' +
      '<button type="button" class="nm-kq-btn" aria-label="Play Kai asking this question"><span class="nm-kq-ic"></span><span class="nm-kq-l">Play Kai</span></button><i class="nm-kq-bar"><b></b></i></span>';
  }
  function kaiPlay(el, on, keep) {
    if (!el) return; var v = el.querySelector('video');
    if (!keep) setAuto(on);
    if (!v._w) { v._w = 1;
      v.addEventListener('timeupdate', function () { el.querySelector('.nm-kq-bar b').style.width = (v.duration ? v.currentTime / v.duration * 100 : 0) + '%'; });
      v.addEventListener('play', function () { el.classList.add('on'); el.querySelector('.nm-kq-l').textContent = 'Pause'; });
      v.addEventListener('pause', function () { el.classList.remove('on'); el.querySelector('.nm-kq-l').textContent = v.ended ? 'Play again' : 'Play Kai'; }); }
    if (on) { if (v.ended) v.currentTime = 0; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
  }

  // ---------- answering ----------
  function modes(st) {
    var m = [['rec', 'Record your voice', 'Up to 2 minutes. Listen back first.', true], ['say', 'Speak, we type', 'Tap the mic in the box and talk.'], ['write', 'Write it out', 'Prefer typing? We can read it for you.']];
    return '<div class="nm-modes" role="group" aria-label="How to answer">' + m.map(function (x) {
      return '<button type="button" class="nm-mode" data-mode="' + x[0] + '" aria-pressed="' + (x[0] === st.mode) + '"><b>' + (x[0] === 'rec' ? MIC : '') + esc(x[1]) + (x[3] ? '<span class="nm-best">Best</span>' : '') + '</b>' + esc(x[2]) + '</button>';
    }).join('') + '</div><div class="nm-ans" id="nmAns">' + answer(st) + '</div>';
  }
  function answer(st) {
    if (st.mode === 'rec') {
      var saved = st === W && W.q && A[W.q] && A[W.q].audio_url && !W.blob ? A[W.q] : null;
      return '<div class="nm-rec"><button type="button" class="nm-dot ' + (rec ? 'live' : 'idle') + '" id="nmRec" aria-label="' + (rec ? 'Stop recording' : 'Start recording') + '"><i></i></button>' +
        '<span id="nmRecTxt" style="flex:1 1 220px;font-size:13.5px;font-weight:700;color:var(--ink75)">' + recText(st, saved) + '</span>' +
        (st.url && !rec ? '<audio controls src="' + esc(st.url) + '"></audio>' : saved ? '<audio controls src="' + esc(saved.audio_url) + '"></audio>' : '') + '</div>' +
        '<p class="nm-file">No microphone handy? <label for="nmFile">Attach a voice memo</label> instead.<input type="file" id="nmFile" accept="audio/*" hidden></p>';
    }
    return '<textarea class="nm-in" id="nmText" rows="6" maxlength="4000" placeholder="' + (st.mode === 'say' ? 'Tap the mic at the right of this box and talk; your words appear here.' : 'Write it in your own words.') + '">' + esc(st.written) + '</textarea>';
  }
  function recText(st, saved) {
    if (rec) { var s = (Date.now() - t0) / 1000; return '<b>' + fmt(s) + '</b> recorded &middot; <b>' + fmt(MAX - s) + ' left</b> of 2:00 &middot; tap to stop'; }
    if (st.blob) return 'Your recording: <b>' + fmt(st.seconds) + '</b>. Listen back, or tap the button to record again.';
    if (saved) return 'Saved: your <b>' + fmt(saved.audio_seconds || 0) + '</b> recording. Tap the button to record it again.';
    return 'Tap the red button and start talking. You have up to 2:00, and you can listen back first.';
  }
  function cur() { return location.hash.indexOf('#/nominate') === 0 ? N : W; }
  function paintRec() { var a = $('nmAns'), st = cur(); if (a && st.mode === 'rec') a.innerHTML = answer(st); }
  function startRec() {
    if (!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { say('This browser cannot record here. Attach a voice memo, or switch to Write it out.', true); return; }
    var st = cur();
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); })[0];
      rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined); chunks = []; t0 = Date.now(); recFor = st;
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] });
        var secs = (Date.now() - t0) / 1000; rec = null; clearInterval(tick); setAudio(recFor, blob, Math.min(secs, MAX)); paintRec();
      };
      rec.start(1000); say(''); paintRec();
      tick = setInterval(function () { var s = (Date.now() - t0) / 1000; var el = $('nmRecTxt'); if (el) el.innerHTML = recText(st); if (s >= MAX) stopRec(); }, 250);
    }).catch(function () { say('We could not use your microphone. Allow it in your browser, or attach a voice memo instead.', true); });
  }
  function stopRec() { if (rec && rec.state !== 'inactive') rec.stop(); }
  function setAudio(st, blob, secs) { if (st.url) URL.revokeObjectURL(st.url); st.blob = blob; st.type = blob.type || 'audio/webm'; st.seconds = secs; st.url = URL.createObjectURL(blob); say(''); }
  function resetW(q) { if (W.url) URL.revokeObjectURL(W.url); var a = A[q] || {}; W = { mode: a.written && !a.audio_url ? 'write' : 'rec', blob: null, type: '', seconds: 0, url: '', written: a.written || '', q: q, spot: null }; }

  // Saves one answer: the recording first (a signed upload), then the row.
  function saveAnswer(q, extra) {
    if (PREVIEW) { A[q] = { written: W.mode === 'rec' ? '' : W.written, audio_url: W.url || (A[q] && A[q].audio_url) || (W.mode === 'rec' ? 'preview' : null), audio_seconds: Math.round(W.seconds), extra: extra || {} }; return Promise.resolve({ ok: true }); }
    var body = { action: 'answer_save', t: T, q: q, extra: extra || {} };
    var up = Promise.resolve();
    if (W.mode === 'rec' && W.blob) {
      up = api({ action: 'answer_upload', t: T, q: q, type: W.type, size: W.blob.size }).then(function (d) {
        if (!d || !d.ok) throw d || {};
        return fetch(d.url, { method: 'PUT', headers: { 'Content-Type': W.type, 'x-upsert': 'true' }, body: W.blob }).then(function (r) {
          if (!r.ok) throw { message: 'Your recording did not upload. Try again.' };
          body.audio = { path: d.path, key: d.key, seconds: Math.round(W.seconds) };
        });
      });
    } else if (W.mode !== 'rec') body.written = W.written.trim();
    else body.keep_audio = true;
    return up.then(function () { return api(body); }).then(function (d) { if (!d || !d.ok) throw d || {}; A[q] = d.answer; return d; });
  }
  function checkAnswer(q) {
    if (rec) return 'Stop the recording first.';
    if (W.mode === 'rec' && !W.blob && !(A[q] && A[q].audio_url)) return 'Record your answer, or switch to Speak or Write.';
    if (W.mode !== 'rec' && W.written.trim().length < 2) return 'Tell me in a few words, or switch to Record.';
    return '';
  }

  // ---------- views ----------
  var VIEWS = {
    overview: function () {
      var nm = D.nominator, quote = nm.written ? '"' + esc(nm.written) + '"' : 'They said it in their own voice. Press Play Kai\'s welcome to hear it.';
      return head('You were nominated', first() + ', Your Community Put Your Name Forward', '') +
        '<div class="nm-quote">' + quote + '<small>' + (nm.named ? esc(nm.name) + ' nominated you' : 'Someone in your community nominated you') + '</small></div>' +
        card('Getting started', 'How this works', pic('creator-guide.jpg'), lines([
          'Press Play to hear Kai\'s welcome. Then answer eight questions, one a page, about ten minutes. Record if you can; typing works too. It is an audition: every nominee is considered, and we tell you either way.']),
          '<a class="dg-btn" href="#/interview/1">' + (answered('q1') ? 'Continue my interview' : 'Start my interview') + '</a>') +
        '<div class="wg-arts">' +
        group('Start to finish', [
          artRow(pic('holiday/w-say.jpg'), '1. The Interview', 'Eight questions from Kai, one a page, about ten minutes. Record your answers if you can; speaking or typing works too.'),
          artRow(pic('partner-group-partner.jpg'), '2. Nominate Someone', 'Optional. Pass it on: name someone else who deserves their flowers, or skip it.'),
          artRow(pic('welcome-ensemble.jpg'), '3. You\'re a Member', 'Finishing makes you a member: free, a Founding Member, with your Explorer badge and 250 points.'),
          artRow(pic('thumb-passport.jpg'), '4. Set Up Your Account', 'Sign in with Google, or with your email and a password.'),
          artRow(pic('welcome-guide.jpg'), '5. Your Welcome Guide', 'Liz walks you through everything your membership opens up.')]) +
        group('Where your story could live', [
          artRow(pic('holiday/p-listen.jpg'), 'The Podcast', 'Your city\'s show, in your own voice: the nomination, then your story.'),
          artRow(pic('partner-community-manager.jpg'), 'Your City\'s Page', 'Community Voices on your city\'s hub, where neighbors press Play on your answer.'),
          artRow(pic('restaurant-guide/t-pulse.jpg'), 'The Daily Pulse', 'A story in your city\'s morning briefing the week you are featured.'),
          artRow(pic('partner-official-creator.jpg'), 'Our Social', 'A card from your interview, shared with your community.')]) +
        '</div>' + cta('Ready when you are', 'Let\'s tell your story.', 'Eight questions, about ten minutes. Kai is with you the whole way.', [answered('q1') ? 'Continue my interview' : 'Start my interview', '#/interview/1']);
    },
    interview: function () {
      var s = Math.min(9, Math.max(1, stepOf()));
      if (s === 9) {
        var rows = Q.map(function (q, i) {
          var v;
          if (q[0] === 'q6') v = spots().map(function (k) { return esc((A[k].extra || {}).name || 'A spot'); }).join(', ') || 'Not answered yet';
          else if (!answered(q[0])) v = '<b style="color:#b42318">Not answered yet</b>';
          else v = (q[0] === 'q2' && A.q2.extra ? esc([A.q2.extra.chapter_name, A.q2.extra.years].filter(Boolean).join(', ')) + '; ' : '') + (A[q[0]].audio_url ? 'Your ' + fmt(A[q[0]].audio_seconds || 0) + ' recording' : esc(A[q[0]].written));
          return '<dt>' + (i + 1) + '. ' + esc(q[1]) + '</dt><dd>' + v + ' <a href="#/interview/' + (i + 1) + '" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd>';
        }).join('');
        return crumb('The Interview') + head('All eight', 'Send Your Interview', '') +
          '<div class="nm-prog" aria-hidden="true"><i style="width:100%"></i></div>' +
          card('Your answers', 'Read them over, then send', pic('holiday/w-say.jpg'), '<dl class="nm-rv">' + rows + '</dl>' +
            '<label class="nm-check"><input type="checkbox" id="nmRelease"' + (D.sent ? ' checked disabled' : '') + '> <span><b>You may use my interview.</b> Vegans Explore may play or quote my answers, and edit them for length, on the podcast, in the Daily Pulse, on social and on my city\'s page. I can ask for it to come down at any time at contact@lesaruss.com.</span></label>' +
            '<label class="nm-check"><input type="checkbox" id="nmAdult"' + (D.sent ? ' checked disabled' : '') + '> <span>I am 18 or over.</span></label>',
            '<a class="dg-btn dg-ghost" href="#/interview/8">Back</a><button type="button" class="dg-btn" id="nmSendInt">' + (D.sent ? 'Sent. Next: Nominate someone' : 'Send my interview') + '</button>', 'nm-form');
      }
      var q = Q[s - 1], body;
      if (q[0] === 'q6') return crumb('The Interview') + head('Question 6 of 8', q[2], '') + '<div class="nm-prog" aria-hidden="true"><i style="width:75%"></i></div>' + spotsView();
      if (W.q !== q[0]) resetW(q[0]);
      if (q[0] === 'q2') {
        var e = (A.q2 && A.q2.extra) || {}, area = e.chapter || (D.nominee.area_slug || '');
        body = '<div class="nm-grid"><div><label class="nm-f" for="nmCh">Where you live</label><select class="nm-in nm-sel" id="nmCh"><option value="">Pick your area</option>' +
          CHAPTERS.map(function (c) { return '<option value="' + esc(c.slug) + '"' + (c.slug === area ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '<option value="other"' + (area === 'other' ? ' selected' : '') + '>Somewhere else</option></select></div>' +
          '<div><label class="nm-f" for="nmYr">How long you have lived there</label><select class="nm-in nm-sel" id="nmYr"><option value="">Pick one</option>' +
          YEARS.map(function (y) { return '<option' + (y === e.years ? ' selected' : '') + '>' + esc(y) + '</option>'; }).join('') + '</select></div></div>' +
          '<p class="nm-hint">Two quick picks for your city page, then tell Kai about home in your own words.</p>' + modes(W);
      } else body = modes(W);
      return crumb('The Interview') + head('Question ' + s + ' of 8', q[2], '') +
        '<div class="nm-prog" aria-hidden="true"><i style="width:' + Math.round(s / 8 * 100) + '%"></i></div>' +
        '<section class="wg-gs nm-form nm-q">' + kaiAsk(s) + '<div class="wg-gs-b"><div class="vgi-k">Your answer</div><h3 class="wg-gs-t">' + esc(q[1]) + '</h3>' + body +
        '<p class="nm-msg" id="nmMsg" role="status"></p><div class="wg-gs-btns"><a class="dg-btn dg-ghost" href="' + (s === 1 ? '#/' : '#/interview/' + (s - 1)) + '">Back</a>' +
        '<button type="button" class="dg-btn" data-save="' + s + '">' + (s === 8 ? 'Save and review' : 'Save and next') + '</button><button type="button" class="dg-btn dg-ghost" data-save="' + s + '" data-exit="1">Save and exit</button></div></div></section>';
    },
    nominate: function () {
      var s = stepOf() === 2 ? 2 : 1, skip = '<a class="dg-btn dg-ghost" href="#/member">Skip this</a>';
      if (!D.sent) return crumb('Nominate Someone') + head('Optional', 'Who Else Deserves Their Flowers?', 'Send your interview first, then pass it on.') + '<div class="dg-btns"><a class="dg-btn" href="#/interview/9">Back to my interview</a></div>';
      if (s === 1) return crumb('Nominate Someone') + head('Optional', 'Who Else Deserves Their Flowers?', 'Your interview is in. Now pass it on, or skip this step.') +
        card('Who', 'Someone in your community', pic('partner-group-partner.jpg'),
          '<div class="nm-grid"><div><label class="nm-f" for="nnName">Their name</label><input class="nm-in" id="nnName" data-n="name" data-dictate="off" value="' + esc(N.name) + '"></div>' +
          '<div><label class="nm-f" for="nnEmail">Their email <small>(so we can reach them)</small></label><input class="nm-in" type="email" id="nnEmail" data-n="email" value="' + esc(N.email) + '"></div></div>' +
          '<span class="nm-f">What they do <small>(pick any that fit)</small></span><div class="nm-chips">' + ROLES.map(function (r) { return '<button type="button" class="nm-chip" data-role="' + r[0] + '" aria-pressed="' + (N.roles.indexOf(r[0]) > -1) + '">' + esc(r[1]) + '</button>'; }).join('') + '</div>',
          '<button type="button" class="dg-btn" id="nnNext">Next: Why them</button>' + skip, 'nm-form');
      return crumb('Nominate Someone') + head('Optional', 'Why Do They Deserve Their Flowers?', 'In your own words. If you record it, we may play it when we tell their story.') +
        card('Why them', 'Say it however is easiest', pic('holiday/w-say.jpg'), modes(N) +
          '<label class="nm-check"><input type="checkbox" id="nnRelease" checked> <span><b>You may use my nomination</b> on our shows, in the Daily Pulse, on social and on city pages.</span></label>',
          '<a class="dg-btn dg-ghost" href="#/nominate/1">Back</a><button type="button" class="dg-btn" id="nnSend">Send my nomination</button>' + skip, 'nm-form');
    },
    member: function () {
      return crumb('You\'re a Member') + head('Welcome, Founding Member', 'You\'re a Member, ' + first(), '') +
        card('What you have now', 'Your story is with our team', pic('welcome-ensemble.jpg'), lines([
          '<b>We listen to every interview.</b> If yours is picked, you hear from us first, with the date. One last step: choose how you sign in, and your membership is ready, with your Explorer and Nominee badges and 250 points.']),
          '<a class="dg-btn" href="#/account">Set up my account</a>') +
        '<div class="wg-arts">' + group('What your membership opens up', [
          artRow(pic('partner-community-manager.jpg'), 'Your City', 'Your city\'s Daily Pulse each morning, its boards and its events.'),
          artRow(pic('thumb-bounties.jpg'), 'Points', 'Earn them by taking part, spend them on Guides, give them to the places and causes you love.'),
          artRow(pic('welcome-guide.jpg'), 'Your Guides', 'Ask your Guide anything, and open topic Guides with your points.')]) + '</div>';
    },
    account: function () {
      if (D.joined) return crumb('Set Up Your Account') + head('You\'re in', 'Welcome to Vegans Explore', '') + card('Your account', 'You are a member', pic('thumb-passport.jpg'), lines(['Your membership is ready. Liz shows you around next.']), '<a class="dg-btn" href="/passport?guide=welcome&amp;from=nominee">Open my Welcome Guide</a>');
      var signed = !!tok() && !PREVIEW;
      return crumb('Set Up Your Account') + head('Last step', 'How Do You Want to Sign In?', '') +
        card('Your account', D.nominee.name, pic('thumb-passport.jpg'),
          (signed ? '<p class="nm-signed">You are signed in. Press Finish joining to add your membership to this account.</p>' :
          '<div id="nmGoogle" style="min-height:44px"></div><div class="nm-or">or use your email</div>' +
          '<div class="nm-grid"><div><label class="nm-f" for="acEmail">Email</label><input class="nm-in" type="email" id="acEmail" autocomplete="email" value="' + esc(D.nominee.email) + '"></div>' +
          '<div><label class="nm-f" for="acPw">Choose a password <small>(8 or more characters)</small></label><input class="nm-in" type="password" id="acPw" autocomplete="new-password"></div></div>' +
          '<p class="nm-hint">Already have an account? <a href="#" id="acSignIn" style="color:var(--g);font-weight:800">Sign in</a> instead.</p>'),
          '<button type="button" class="dg-btn" id="acJoin">' + (signed ? 'Finish joining' : 'Create my account') + '</button>', 'nm-form');
    }
  };

  function spotsView() {
    var have = spots(), n = have.length, open = W.spot !== null || (n < 3 && !have.length);
    var list = have.map(function (k, i) { var a = A[k]; return '<li class="done"><b>' + (i + 1) + '. ' + esc((a.extra || {}).name || 'A spot') + '</b><span class="nm-play"><i></i>' + (a.audio_url ? 'Your ' + fmt(a.audio_seconds || 0) + ' recording' : 'Written') + '</span><a href="#/interview/6" data-redo="' + k + '">Redo</a></li>'; }).join('');
    var form = '';
    if (n < 3 || W.spot) {
      if (W.q !== 'spot') { W = { mode: 'rec', blob: null, type: '', seconds: 0, url: '', written: '', q: 'spot', spot: W.spot }; }
      form = '<li class="now"><b>' + (W.spot ? 'Redo: ' + esc((A[W.spot].extra || {}).name || 'this spot') : (n + 1) + '. ' + (n ? 'Another spot' : 'Your first spot')) + '</b>' +
        '<input class="nm-in" id="spName" placeholder="Start typing a place name" autocomplete="off" data-dictate="off" value="' + esc(W.spot ? (A[W.spot].extra || {}).name : (W.place ? W.place.name : '')) + '"><div id="spList" class="nm-chips" style="margin:6px 0 8px"></div>' + modes(W) +
        '<button type="button" class="dg-btn" id="spSave" style="margin-top:8px">Save this spot</button></li>';
    }
    return '<section class="wg-gs nm-form nm-q">' + kaiAsk(6) + '<div class="wg-gs-b"><div class="vgi-k">Your answer</div><h3 class="wg-gs-t">Your Favorite Spots</h3><ol class="nm-spots">' + list + form + '</ol>' +
      '<p class="nm-hint">Up to three, each with its own recording. After your third, they lock in; Redo one to change it.</p><p class="nm-msg" id="nmMsg" role="status"></p>' +
      '<div class="wg-gs-btns"><a class="dg-btn dg-ghost" href="#/interview/5">Back</a><button type="button" class="dg-btn" id="spNext">Next question</button></div></div></section>';
  }

  // ---------- menu, Kai, routing (welcome-guide.js) ----------
  function drawMenu(c) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === c ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === c ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  foldBtn.addEventListener('click', function () { var f = !railEl.classList.contains('dg-folded'); railEl.classList.toggle('dg-folded', f); foldBtn.textContent = f ? 'Show Kai' : 'Hide Kai'; });
  function nav(i) {
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    if (!D) { main.innerHTML = loadErr ? head('Your interview', 'We could not open your interview', '<span>' + esc(loadErr) + '</span>') : '<div class="dg-loading">Opening your interview...</div>'; return; }
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    if (!VIEWS[k]) k = 'overview';
    if (rec) stopRec();
    curTab = k; var t = tab(k);
    main.innerHTML = (PREVIEW ? '<p class="dg-note"><b>Preview.</b> Sample answers are filled in so you can see every page. Nothing is saved or sent.</p>' : '') + VIEWS[k]();
    drawMenu(k); nav(TABS.indexOf(t));
    var sayText = t.say || '';
    if (k === 'overview') sayText = 'Congratulations, ' + first() + '! I\'m Kai. Press Play to hear why you were nominated, then start your interview whenever you\'re ready.';
    if (k === 'interview') { var s = stepOf(); sayText = s >= 9 ? 'That\'s all eight. Read them over, then send it to our team.' : Q[s - 1][3]; }
    drawRail(t, sayText);
    if (k === 'account') setupGoogle();
    if (k === 'interview' && auto()) setTimeout(function () { var el = document.querySelector('.nm-kq'); if (el) kaiPlay(el, true, true); }, 60);
    window.scrollTo(0, 0);
  }

  // ---------- events ----------
  document.addEventListener('input', function (e) {
    var el = e.target; if (el.closest && el.closest('.nm-form')) say('');
    if (el.id === 'nmText') cur().written = el.value;
    var n = el.getAttribute && el.getAttribute('data-n'); if (n) N[n] = el.value;
    if (el.id === 'spName') { W.place = null; placeSearch(el.value); }
  });
  var psT = null;
  function placeSearch(q) {
    clearTimeout(psT); var box = $('spList'); if (!box) return;
    if (q.trim().length < 2) { box.innerHTML = ''; return; }
    psT = setTimeout(function () { api({ action: 'place_search', q: q }).then(function (d) {
      box.innerHTML = ((d && d.places) || []).map(function (p) { return '<button type="button" class="nm-chip" data-place="' + esc(p.slug) + '" data-name="' + esc(p.name) + '">' + esc(p.name) + (p.city ? ' <small>' + esc(p.city) + '</small>' : '') + '</button>'; }).join('');
    }).catch(function () {}); }, 250);
  }
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'nmFile') {
      var f = el.files && el.files[0], st = cur(); if (!f) return;
      if (!/^audio\//.test(f.type)) { say('That file is not a recording.', true); return; }
      if (f.size > 25 * 1024 * 1024) { say('That recording is over 25 MB. Try a shorter one.', true); return; }
      var a = new Audio(); a.preload = 'metadata';
      a.onloadedmetadata = function () { var d = isFinite(a.duration) ? a.duration : 0; if (d > MAX + 10) { say('That one runs ' + fmt(d) + '. Keep it under 2:00.', true); return; } setAudio(st, f, d); paintRec(); };
      a.onerror = function () { setAudio(st, f, 0); paintRec(); };
      a.src = URL.createObjectURL(f);
    }
  });
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('.nm-kq-btn'))) { var el = b.closest('.nm-kq'); kaiPlay(el, !el.classList.contains('on')); return; }
    if ((b = e.target.closest('.nm-mode'))) { if (rec) stopRec(); var st = cur(); st.mode = b.getAttribute('data-mode'); b.parentNode.querySelectorAll('.nm-mode').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); $('nmAns').innerHTML = answer(st); say(''); return; }
    if ((b = e.target.closest('#nmRec'))) { if (rec) stopRec(); else startRec(); return; }
    if ((b = e.target.closest('.nm-chip[data-role]'))) { var r = b.getAttribute('data-role'), on = N.roles.indexOf(r) > -1; N.roles = on ? N.roles.filter(function (x) { return x !== r; }) : N.roles.concat(r); b.setAttribute('aria-pressed', String(!on)); return; }
    if ((b = e.target.closest('.nm-chip[data-place]'))) { W.place = { slug: b.getAttribute('data-place'), name: b.getAttribute('data-name') }; $('spName').value = W.place.name; $('spList').innerHTML = ''; return; }
    if ((b = e.target.closest('[data-redo]'))) { e.preventDefault(); W = { mode: 'rec', blob: null, type: '', seconds: 0, url: '', written: '', q: 'spot', spot: b.getAttribute('data-redo') }; route(); return; }
    if ((b = e.target.closest('#spSave'))) { saveSpot(b); return; }
    if ((b = e.target.closest('#spNext'))) { if (!spots().length) { say('Save at least one spot first.', true); return; } location.hash = '#/interview/7'; return; }
    if ((b = e.target.closest('[data-save]'))) { saveStep(b); return; }
    if ((b = e.target.closest('#nmSendInt'))) { sendInterview(b); return; }
    if ((b = e.target.closest('#nnNext'))) { if (!N.name.trim()) { say('Their name, please.', true); return; } if (!isEmail(N.email.trim())) { say('Their email, so we can reach them.', true); return; } location.hash = '#/nominate/2'; return; }
    if ((b = e.target.closest('#nnSend'))) { sendNomination(b); return; }
    if ((b = e.target.closest('#acJoin'))) { join(b); return; }
    if ((b = e.target.closest('#acSignIn'))) { e.preventDefault(); if (window.VEAuth) VEAuth.showAuthModal('Sign in to finish joining.', function () { route(); }); return; }
  });

  function saveStep(b) {
    var s = +b.getAttribute('data-save'), q = Q[s - 1][0], extra = {};
    if (q === 'q2') {
      var ch = $('nmCh').value, yr = $('nmYr').value;
      if (!ch || !yr) { say('Pick your area and how long you have lived there.', true); return; }
      var c = CHAPTERS.filter(function (x) { return x.slug === ch; })[0]; extra = { chapter: ch, chapter_name: c ? c.name : 'Somewhere else', years: yr };
    }
    var err = checkAnswer(q); if (err && !(q === 'q2' && false)) { say(err, true); return; }
    b.disabled = true; var lbl = b.textContent; b.textContent = 'Saving...';
    saveAnswer(q, extra).then(function () {
      W.q = ''; if (b.getAttribute('data-exit')) { location.hash = '#/'; return; } location.hash = '#/interview/' + (s + 1);
    }).catch(function (x) { b.disabled = false; b.textContent = lbl; say((x && x.message) || 'That did not save. Try again in a minute.', true); });
  }
  function saveSpot(b) {
    var name = ($('spName').value || '').trim(); if (name.length < 2) { say('Type the place\'s name.', true); return; }
    var err = checkAnswer('spot'); if (err && !(W.spot && A[W.spot] && A[W.spot].audio_url && W.mode === 'rec' && !W.blob)) { say(err, true); return; }
    var key = W.spot || ['q6s1', 'q6s2', 'q6s3'].filter(function (k) { return !answered(k); })[0];
    var extra = { name: W.place && W.place.name === name ? W.place.name : name, slug: W.place && W.place.name === name ? W.place.slug : null };
    b.disabled = true; b.textContent = 'Saving...';
    saveAnswer(key, extra).then(function () { W = { mode: 'rec', blob: null, type: '', seconds: 0, url: '', written: '', q: '', spot: null }; route(); })
      .catch(function (x) { b.disabled = false; b.textContent = 'Save this spot'; say((x && x.message) || 'That did not save. Try again.', true); });
  }
  function sendInterview(b) {
    if (D.sent) { location.hash = '#/nominate/1'; return; }
    var missing = Q.filter(function (q) { return q[0] === 'q6' ? !spots().length : !answered(q[0]); });
    if (missing.length) { say('Answer every question first: ' + missing.map(function (q) { return q[1]; }).join(', ') + '.', true); return; }
    if (!$('nmRelease').checked) { say('Tick the box to let us use your interview.', true); return; }
    if (!$('nmAdult').checked) { say('Tick the box to say you are 18 or over.', true); return; }
    b.disabled = true; b.textContent = 'Sending...';
    (PREVIEW ? Promise.resolve({ ok: true }) : api({ action: 'interview_send', t: T, release: true, adult: true })).then(function (d) {
      if (!d || !d.ok) throw d || {}; D.sent = true; location.hash = '#/nominate/1';
    }).catch(function (x) { b.disabled = false; b.textContent = 'Send my interview'; say((x && x.message) || 'That did not send. Try again in a minute.', true); });
  }
  function sendNomination(b) {
    if (N.mode === 'rec' && !N.blob) { say('Record why, or switch to Speak or Write.', true); return; }
    if (N.mode !== 'rec' && N.written.trim().length < 3) { say('Tell us why in a few words.', true); return; }
    if (!$('nnRelease').checked) { say('Tick the box to let us use your nomination.', true); return; }
    b.disabled = true; b.textContent = 'Sending...';
    if (PREVIEW) { location.hash = '#/member'; return; }
    var base = { action: 'submit', nominee_name: N.name.trim(), nominee_email: N.email.trim(), community_slug: (A.q2 && A.q2.extra && A.q2.extra.chapter !== 'other' && A.q2.extra.chapter) || D.nominee.area_slug || '',
      roles: N.roles, self_nominated: false, written: N.mode === 'rec' ? '' : N.written.trim(), nominator_name: D.nominee.name, nominator_email: D.nominee.email, credit_ok: true, release: true, adult: true, source: 'interview' };
    var up = N.mode === 'rec' && N.blob ? api({ action: 'upload', type: N.type, size: N.blob.size }).then(function (d) {
      if (!d || !d.ok) throw d || {};
      return fetch(d.url, { method: 'PUT', headers: { 'Content-Type': N.type, 'x-upsert': 'true' }, body: N.blob }).then(function (r) { if (!r.ok) throw { message: 'Your recording did not upload. Try again.' }; base.audio = { path: d.path, key: d.key, seconds: Math.round(N.seconds) }; });
    }) : Promise.resolve();
    up.then(function () { return api(base); }).then(function (d) { if (!d || !d.ok) throw d || {}; location.hash = '#/member'; })
      .catch(function (x) { b.disabled = false; b.textContent = 'Send my nomination'; say((x && x.message) || 'That did not send. Try again.', true); });
  }

  // ---------- joining: an account (Google, or email and a password), then ve-nominations interview_join admits it ----------
  function admit(b) {
    if (PREVIEW) { D.joined = true; route(); return; }
    api({ action: 'interview_join', t: T }).then(function (d) {
      if (!d || !d.ok) throw d || {};
      D.joined = true; try { localStorage.removeItem('nm_invite'); } catch (e) {}
      location.href = '/passport?guide=welcome&from=nominee';
    }).catch(function (x) { if (b) { b.disabled = false; b.textContent = 'Finish joining'; } say((x && x.message) || 'That did not finish. Try again in a minute.', true); });
  }
  function join(b) {
    if (D.joined) return;
    if (!D.sent && !PREVIEW) { say('Send your interview first.', true); return; }
    if (tok() && !PREVIEW) { b.disabled = true; b.textContent = 'Joining...'; admit(b); return; }
    var em = ($('acEmail').value || '').trim(), pw = $('acPw').value || '';
    if (!isEmail(em)) { say('Your email, please.', true); return; }
    if (pw.length < 8) { say('Choose a password of 8 or more characters.', true); return; }
    if (PREVIEW) { admit(b); return; }
    if (!window.VEAuth) { say('Sign-in is still loading. Try again in a second.', true); return; }
    b.disabled = true; b.textContent = 'Creating your account...';
    VEAuth.signup(em, pw, D.nominee.name.replace(/^Sample:\s*/, ''), null, (A.q2 && A.q2.extra && A.q2.extra.chapter) || D.nominee.area_slug || null, '').then(function (d) {
      if (!d || !d.token) throw d || {};
      admit(b);
    }).catch(function (x) { b.disabled = false; b.textContent = 'Create my account'; say((x && (x.message || x.error)) || 'We could not create your account. If you already have one, sign in instead.', true); });
  }
  function setupGoogle() {
    var el = $('nmGoogle'); if (!el) return;
    var tries = 0; (function go() {
      if (window.VEAuth && window.google && window.google.accounts) VEAuth.initGoogleSignIn(el, function (d) { if (d && d.token) admit(null); else say('Google sign-in did not finish. Try again, or use your email.', true); }, (D.nominee.area_slug || null));
      else if (tries++ < 40) setTimeout(go, 250);
    })();
  }

  window.addEventListener('beforeunload', function (e) { if (!PREVIEW && (W.blob || N.blob)) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });

  route();
  var chapters = api({ action: 'chapters' }).then(function (d) { CHAPTERS = (d && d.chapters) || []; }).catch(function () {});
  var load = PREVIEW ? Promise.resolve(SAMPLE) : (T ? api({ action: 'interview_get', t: T }) : Promise.resolve({ error: 'no_invite', message: 'Open this page from the link in your invitation email.' }));
  Promise.all([load, chapters]).then(function (r) {
    var d = r[0];
    if (!d || !d.ok) { loadErr = (d && d.message) || 'That link did not work. Ask us for a new one at contact@lesaruss.com.'; route(); return; }
    D = d; A = d.answers || {};
    var h = $('nmFrom'); if (h) h.innerHTML = D.nominator.named ? 'nominated<br>by ' + esc(D.nominator.name.replace(/^Sample:\s*/, '')) : 'nominated by<br>your community';
    route();
  }).catch(function () { loadErr = 'We could not reach our server. Try again in a minute.'; route(); });
})();
