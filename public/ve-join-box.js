/*
 * /public/ve-join-box.js: the join window for our free Guides (Sean, 2026-11-10, first draft on the Holiday Guide). The information is
 * free, but anything someone sends us (a recipe, a menu, an item, a save) needs a name on it: "We don't want just blind submissions."
 * It opens over the page (close with X, Not now, Escape or a tap outside) with two ways in:
 *   1. Quick registration, the default (under a minute): name, email, a password and their city. That is an account, enough to send things and get
 *      the Daily Pulse; it is not membership. The Pulse box subscribes them through ve-pulse-subscribe (double opt-in).
 *   2. Full membership, free: the Explorer survey (about two minutes, 250 points, everything open).
 * Beside them: the Guide's own short video (a placeholder until it is made; each Guide's own character, never another Guide's) and the perks.
 *
 *   VEJoinBox.open({ guide, character, pic, reason, line, onDone, onSurvey, mode })   mode 'member': already registered, only the survey path
 *     guide      'Holiday Guide'                     character 'Theo'          pic  a still of that Guide's character (4:5)
 *     reason     what they tapped ('Submit a Recipe')                      line one sentence about why it needs an account
 *     onDone()   runs after a quick registration or a sign-in (the thing they tapped carries on)
 *     onSurvey() starts the Explorer survey (the page keeps what they were doing and comes back to it)
 *   VEJoinBox.close()
 * Uses window.VEAuth (signup, showAuthModal). Nothing is stored here.
 */
(function () {
  if (window.VEJoinBox) return;
  var PULSE = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-pulse-subscribe';
  var CITIES = [['south-florida', 'South Florida'], ['central-florida', 'Central Florida'], ['north-florida', 'North Florida'], ['atlanta', 'Atlanta'],
    ['washington-dc', 'Washington, D.C.'], ['delaware', 'Delaware'], ['maryland', 'Maryland'], ['virginia', 'Virginia'], ['west-virginia', 'West Virginia'],
    ['new-york', 'New York'], ['philadelphia', 'Philadelphia'], ['los-angeles', 'Los Angeles'], ['seattle', 'Seattle'], ['portland', 'Portland'], ['london', 'London'], ['', 'Somewhere else']];
  var FOUNDING = Date.now() < Date.parse('2027-01-01T05:00:00Z');
  var CSS = '' +
    '.vjb-back{position:fixed;inset:0;z-index:100001;background:rgba(15,23,15,.6);display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px 0;overflow:auto}' +
    '.vjb{position:relative;background:#fff;color:#1a1a1a;border-radius:14px;width:min(980px,100%);max-height:86vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.32);font-family:inherit;display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr)}' +
    '.vjb-x{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:6px;border:1px solid rgba(0,0,0,.14);background:#fff;font-size:22px;line-height:1;cursor:pointer;color:#1a1a1a;z-index:2}' +
    '.vjb-side{background:#f3f8f2;padding:24px;display:flex;flex-direction:column;gap:16px;border-right:1px solid #e3efe3}' +
    '.vjb-vid{position:relative;aspect-ratio:4/5;border-radius:12px;overflow:hidden;background:#dfeadf center top/cover no-repeat}' +
    '.vjb-play{position:absolute;left:14px;bottom:14px;width:54px;height:54px;border-radius:50%;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center}' +
    '.vjb-soon{position:absolute;right:10px;top:10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:#fff;color:#1f5f22;border-radius:6px;padding:4px 8px}' +
    '.vjb-cap{margin:6px 0 0;font-size:12.5px;color:rgba(26,26,26,.6)}' +
    '.vjb-perks h4,.vjb-k{margin:0 0 8px;font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1f5f22}' +
    '.vjb-perks ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}.vjb-perks li{display:flex;gap:10px;font-size:14px;line-height:1.45}' +
    '.vjb-perks li svg{flex:none;margin-top:2px}' +
    '.vjb-main{padding:26px 28px 24px}' +
    '.vjb-main h2{margin:0 0 6px;font-size:26px;line-height:1.15;font-weight:900;padding-right:40px}' +
    '.vjb-lede{margin:0 0 16px;font-size:15px;line-height:1.55;color:rgba(26,26,26,.78)}' +
    '.vjb-paths{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
    '.vjb-path{border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px}' +
    '.vjb-path.on{border:2px solid #22C55E;padding:15px}' +
    '.vjb-path h3{margin:0;font-size:17px;font-weight:800}.vjb-path .vjb-t{font-size:12px;font-weight:800;color:#1f5f22}' +
    '.vjb-path p{margin:0;font-size:13.5px;line-height:1.5;color:rgba(26,26,26,.75)}' +
    '.vjb-f{display:grid;gap:8px;margin-top:4px}.vjb-f label{display:block;font-size:12px;font-weight:700;color:rgba(26,26,26,.75)}' +
    '.vjb-f input[type=text],.vjb-f input[type=email],.vjb-f input[type=password],.vjb-f select{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:10px;border:1.5px solid rgba(0,0,0,.18);border-radius:6px;font:inherit;font-size:16px;background:#fff}' +
    '.vjb-f select{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M1 1l4 4 4-4%27 fill=%27none%27 stroke=%27%23525252%27 stroke-width=%271.6%27/%3E%3C/svg%3E") no-repeat right 16px center}' +
    '.vjb-ck{display:flex!important;gap:8px;align-items:flex-start;font-weight:600!important;line-height:1.4}.vjb-ck input{margin-top:2px}' +
    '.vjb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:6px;border:0;background:#22C55E;color:#03170a;font:inherit;font-weight:800;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-decoration:none;width:100%}' +
    '.vjb-btn.g{background:#fff;border:1.5px solid rgba(0,0,0,.16);color:#1a1a1a}' +
    '.vjb-note{margin:12px 0 0;font-size:12.5px;line-height:1.5;color:rgba(26,26,26,.6)}.vjb-note a{color:#1f5f22;font-weight:700}' +
    '.vjb-err{margin:0;font-size:13px;color:#9a3412;min-height:1em}' +
    '.vjb-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '.vjb-tog{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:8px;background:#eef3ee;margin:0 0 14px}' +
    '.vjb-tog button{min-height:40px;border:0;border-radius:6px;background:transparent;font:inherit;font-size:13.5px;font-weight:800;color:rgba(26,26,26,.7);cursor:pointer}' +
    '.vjb-tog button[aria-selected=true]{background:#fff;color:#1f5f22;box-shadow:0 1px 3px rgba(0,0,0,.12)}' +
    '.vjb-pl{margin:0 0 10px;font-size:14px;line-height:1.5;color:rgba(26,26,26,.75)}.vjb-pl b{color:#1a1a1a}' +
    '.vjb-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.vjb-mvid,.vjb-mperks,.vjb-cs{display:none}' +
    'html.vjb-open{overflow:hidden}' +
    // Phones: one column; Theo's video comes up under the title as one row (his picture, framed from the top so his head shows, and the
    // caption beside it), then the toggle and the form, then the perks.
    '@media(max-width:820px){.vjb{grid-template-columns:1fr;max-height:92vh}.vjb-side{display:none}.vjb-back{padding:10px;align-items:center}' +
      '.vjb-main{padding:22px 18px 18px}.vjb-main h2{font-size:22px}.vjb-2{grid-template-columns:1fr}' +
      '.vjb-mvid{display:flex;gap:12px;align-items:center;margin:0 0 14px;padding:10px;border-radius:12px;background:#f3f8f2}' +
      '.vjb-mvid .vjb-vid{flex:0 0 96px;width:96px;aspect-ratio:4/5;background-position:center top}.vjb-mvid .vjb-soon{display:none}.vjb-mvid .vjb-cs{display:inline;color:#1f5f22;font-weight:800}' +
      '.vjb-mvid .vjb-play{width:34px;height:34px;left:8px;bottom:8px}.vjb-mvid .vjb-cap{margin:0;font-size:14px;line-height:1.45}' +
      '.vjb-mperks{display:block;margin:16px 0 0;padding-top:14px;border-top:1px solid #e3efe3}}';
  var CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var box = null, opts = null, lastFocus = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() { if (document.getElementById('vjb-css')) return; var s = document.createElement('style'); s.id = 'vjb-css'; s.textContent = CSS; document.head.appendChild(s); }
  function guessCity() { try { return sessionStorage.getItem('ve_dir_city') || localStorage.getItem('hg_chapter') || ''; } catch (e) { return ''; } }
  // Quick registration is the default (Sean, 2026-11-10: "I want them through the door as quick as possible... If I can get 10,000 email
  // addresses versus 100 people registering, I'm fine with that"); a toggle under the title switches to Become a member, so the window
  // shows one path at a time and never turns into a long scroll.
  function html(o) {
    var city = guessCity();
    var perks = ['Send menus, recipes and finds, with your name on them', 'The Daily Pulse for your city, every morning', 'Save places and find them again in My Saves',
      'Hear first about ways to support your local Vegan community'];
    var vid = function (cls) {
      return '<div class="' + cls + '"><div class="vjb-vid" style="background-image:url(\'' + esc(o.pic || '') + '\')"><span class="vjb-soon">Video coming</span>' +
        '<span class="vjb-play" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span></div>' +
        '<p class="vjb-cap"><b>' + esc(o.character || 'Your Guide') + '</b> on why it is free to join, in about 30 seconds.<span class="vjb-cs"> Video coming.</span></p></div>';
    };
    return '<button type="button" class="vjb-x" aria-label="Close" data-vjb-x>&times;</button>' +
      '<aside class="vjb-side">' + vid('vjb-dvid') +
        '<div class="vjb-perks"><h4>When you register</h4><ul>' + perks.map(function (p) { return '<li>' + CHECK + '<span>' + esc(p) + '</span></li>'; }).join('') + '</ul></div></aside>' +
      '<div class="vjb-main"><div class="vjb-k">Join Vegans Explore, free</div><h2 id="vjb-t">' + esc(o.reason ? 'Register to ' + o.reason.toLowerCase() : 'Join Vegans Explore') + '</h2>' +
        '<p class="vjb-lede">' + esc(o.line || 'Everything in the ' + (o.guide || 'Guide') + ' is free to read. To send us something, we just need to know who you are.') + '</p>' +
        vid('vjb-mvid') +
        '<div class="vjb-tog" role="tablist" aria-label="How to join"><button type="button" role="tab" aria-selected="true" data-vjb-tab="quick">Quick registration</button>' +
          '<button type="button" role="tab" aria-selected="false" data-vjb-tab="member">Become a member</button></div>' +
        '<section class="vjb-pane" data-vjb-pane="quick" aria-label="Quick registration"><p class="vjb-pl"><b>Under a minute.</b> Your name, a password and your city, and you can send it in right away. This is not a membership; you can become a member any time.</p>' +
          '<form class="vjb-f" novalidate><div class="vjb-2"><label>Your name<input type="text" name="name" autocomplete="name" maxlength="120" data-dictate="off"></label>' +
            '<label>Email<input type="email" name="email" autocomplete="email" maxlength="200"></label></div>' +
            '<div class="vjb-2"><label>Make a password<input type="password" name="password" autocomplete="new-password" minlength="8" placeholder="8 or more characters"></label>' +
            '<label>Your city<select name="city">' + CITIES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === city ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select></label></div>' +
            '<label class="vjb-ck"><input type="checkbox" name="pulse" checked><span>Send me the Daily Pulse and news about ways to support my Vegan community. Unsubscribe any time.</span></label>' +
            '<span class="vjb-hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></span>' +
            '<p class="vjb-err" role="alert"></p><button type="submit" class="vjb-btn">Register and continue</button></form></section>' +
        '<section class="vjb-pane" data-vjb-pane="member" aria-label="Become a member" hidden><p class="vjb-pl"><b>About 2 minutes.</b> Take the Explorer survey and everything opens: 250 points, every Guide and voting for the places you love' + (FOUNDING ? ', and you are a Founding Member before January 1' : '') + '.</p>' +
          (o.reason ? '<p class="vjb-pl">We bring you right back here to finish when you are done.</p>' : '') +
          '<button type="button" class="vjb-btn" data-vjb-survey>Take the survey</button></section>' +
        '<div class="vjb-mperks vjb-perks"><h4>When you register</h4><ul>' + perks.map(function (p) { return '<li>' + CHECK + '<span>' + esc(p) + '</span></li>'; }).join('') + '</ul></div>' +
        '<p class="vjb-note">Already have an account? <a href="#" data-vjb-signin>Sign in</a>. <a href="#" data-vjb-x>Not now</a></p></div>';
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; document.documentElement.classList.remove('vjb-open'); document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function done() { var f = opts && opts.onDone; close(); if (f) f(); }
  function submit(f) {
    var err = f.querySelector('.vjb-err'), btn = f.querySelector('button[type=submit]');
    var name = f.name.value.trim(), email = f.email.value.trim(), pw = f.password.value, city = f.city.value;
    if (name.length < 2) { err.textContent = 'Tell us your name.'; f.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Check your email address.'; f.email.focus(); return; }
    if (pw.length < 8) { err.textContent = 'Make a password of 8 or more characters.'; f.password.focus(); return; }
    var A = window.VEAuth; if (!A || !A.signup) { err.textContent = 'That did not load. Refresh and try again.'; return; }
    btn.disabled = true; btn.textContent = 'One moment...'; err.textContent = '';
    A.signup(email, pw, name, null, city || null, f.website.value).then(function (d) {
      if (!d || d.error || !d.token) throw d || {};
      if (f.pulse.checked && city) {
        fetch(PULSE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'subscribe', email: email, cities: [city], frequency: 'daily',
          consent: city === 'london', source: (location.pathname + ' join box').slice(0, 100) }) }).catch(function () {});
      }
      done();
    }).catch(function (d) {
      btn.disabled = false; btn.textContent = 'Register and continue';
      err.textContent = (d && d.error) ? (/exists/i.test(d.error) ? 'You already have an account with that email. Sign in below.' : d.error) : 'That did not go through. Try again in a minute.';
    });
  }
  function open(o) {
    css(); if (box) close();
    opts = o || {}; lastFocus = document.activeElement;
    box = document.createElement('div'); box.className = 'vjb-back';
    box.innerHTML = '<div class="vjb" role="dialog" aria-modal="true" aria-labelledby="vjb-t">' + html(opts) + '</div>';
    // Already registered (mode 'member'): only the membership path, no toggle.
    if (opts.mode === 'member') {
      var tg = box.querySelector('.vjb-tog'); if (tg) tg.hidden = true;
      [].forEach.call(box.querySelectorAll('[data-vjb-pane]'), function (pn) { pn.hidden = pn.getAttribute('data-vjb-pane') !== 'member'; });
      var t2 = box.querySelector('#vjb-t'); if (t2) t2.textContent = 'Become a member' + (opts.reason ? ' to ' + opts.reason.toLowerCase() : '');
      var nt = box.querySelector('.vjb-note'); if (nt) nt.innerHTML = '<a href="#" data-vjb-x>Not now</a>';
    }
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('[data-vjb-x]')) { e.preventDefault(); close(); return; }
      var tb = e.target.closest('[data-vjb-tab]');
      if (tb) { var k = tb.getAttribute('data-vjb-tab');
        [].forEach.call(box.querySelectorAll('[data-vjb-tab]'), function (b) { b.setAttribute('aria-selected', String(b === tb)); });
        [].forEach.call(box.querySelectorAll('[data-vjb-pane]'), function (pn) { pn.hidden = pn.getAttribute('data-vjb-pane') !== k; }); return; }
      if (e.target.closest('[data-vjb-survey]')) { var s = opts.onSurvey; close(); if (s) s(); else location.href = '/survey?s=explorer'; return; }
      if (e.target.closest('[data-vjb-signin]')) {
        e.preventDefault(); var A = window.VEAuth, f = opts.onDone; close();
        if (A && A.showAuthModal) A.showAuthModal('Sign in to carry on.', function () { if (f) f(); }, 'login');
      }
    });
    box.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); submit(e.target); });
    document.body.appendChild(box); document.documentElement.classList.add('vjb-open'); document.addEventListener('keydown', onKey);
    var first = box.querySelector('input[name=name]'); if (first && window.innerWidth > 820) first.focus();
  }
  window.VEJoinBox = { open: open, close: close };
})();
