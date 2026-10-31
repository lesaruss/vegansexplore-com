/* ve-managed.js: "Managed by us" request window (BrandDesk, canon canon-ve-front-of-house; built 2026-10-31).
 *
 *   VEManaged.open({ from: 'business' | 'audit' | 'fix', fix: '<fix id>', business: 'Name', listing: '<slug>', title, lead })
 *
 * A short form (name, email, the business, city, phone, what they want help with, a note) sent to ve-brand-kit managed_interest:
 * a ve_initiative_interest row the dashboard's Inbox shows as a Managed marketing request, an email to the team and a confirmation
 * to them. A signed-in member's name and email are filled in and their token sent. Nothing is charged here.
 */
(function () {
  if (window.VEManaged) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-brand-kit';
  var WANTS = [['website', 'A website that looks the part'], ['google', 'Google: profile, photos, reviews'], ['photos', 'Photos of every dish'],
    ['brand', 'A logo and brand kit'], ['social', 'Social media'], ['ordering', 'Online ordering'], ['everything', 'All of it']];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('vemStyle')) return;
    var st = document.createElement('style'); st.id = 'vemStyle';
    st.textContent = '.vem-wrap{position:fixed;inset:0;z-index:100001;background:rgba(10,20,14,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,system-ui,sans-serif;}' +
      '.vem{background:#fff;color:#14261a;border-radius:14px;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px 26px 22px;box-shadow:0 20px 60px rgba(0,0,0,.25);}' +
      '.vem h3{margin:0 0 6px;font-size:22px;font-weight:900;line-height:1.15;}.vem p.lead{margin:0 0 16px;font-size:14px;line-height:1.55;color:rgba(0,0,0,.7);}' +
      '.vem label{display:block;font-size:13px;font-weight:700;margin:0 0 12px;}.vem input,.vem textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;min-height:42px;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:9px 12px;font:inherit;font-weight:500;font-size:14px;}' +
      '.vem textarea{min-height:76px;resize:vertical;}.vem .two{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;}' +
      '.vem .wants{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px;}.vem .wants button{border:1.5px solid rgba(0,0,0,.18);background:#fff;border-radius:6px;padding:8px 11px;font:700 12.5px/1.2 inherit;font-family:inherit;cursor:pointer;color:#14261a;}' +
      '.vem .wants button.on{background:var(--vb-accent,#1E7A3E);border-color:var(--vb-accent,#1E7A3E);color:#fff;}' +
      '.vem .acts{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:6px;flex-wrap:wrap;}.vem .go{background:var(--vb-accent,#1E7A3E);color:#fff;border:0;border-radius:6px;padding:12px 20px;font:800 14px/1 inherit;font-family:inherit;cursor:pointer;}' +
      '.vem .no{background:none;border:0;font:700 13px inherit;font-family:inherit;cursor:pointer;color:rgba(0,0,0,.6);}.vem .err{color:#B42318;font-size:13px;font-weight:700;margin:4px 0 0;min-height:1em;}' +
      '.vem .small{font-size:12px;color:rgba(0,0,0,.55);margin:10px 0 0;}@media(max-width:560px){.vem .two{grid-template-columns:1fr;}.vem{padding:22px 18px 18px;}}';
    document.head.appendChild(st);
  }
  function me() { try { return JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch (e) { return null; } }
  function token() { try { return (window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn() && VEAuth.getToken()) || ''; } catch (e) { return ''; } }
  function open(o) {
    o = o || {}; css();
    var m = token() ? me() : null, picked = {};
    var wrap = document.createElement('div'); wrap.className = 'vem-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="vem"><h3>' + esc(o.title || 'Have us do it') + '</h3><p class="lead">' + esc(o.lead || 'Tell us a little about your place. Someone from our team gets back to you within a day. Nothing is charged here.') + '</p>' +
      '<form novalidate><div class="two"><label>Your name<input name="name" autocomplete="name" value="' + esc(m && m.name || '') + '"></label>' +
      '<label>Email<input name="email" type="email" autocomplete="email" value="' + esc(m && m.email || '') + '"></label></div>' +
      '<div class="two"><label>Your business<input name="business" value="' + esc(o.business || '') + '"></label><label>City<input name="city" autocomplete="address-level2"></label></div>' +
      '<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel"></label>' +
      '<div style="font-size:13px;font-weight:700">What would help most?</div><div class="wants">' + WANTS.map(function (w) { return '<button type="button" data-w="' + w[0] + '">' + esc(w[1]) + '</button>'; }).join('') + '</div>' +
      '<label>Anything we should know (optional)<textarea name="note" placeholder="What is hardest right now, what you have tried, a good time to call..."></textarea></label>' +
      '<p class="err" aria-live="polite"></p><div class="acts"><button type="button" class="no">Not now</button><button type="submit" class="go">Send it to our team</button></div></form></div>';
    document.body.appendChild(wrap);
    var f = wrap.querySelector('form'), err = wrap.querySelector('.err');
    function close() { wrap.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('.no')) { close(); return; }
      var w = e.target.closest('[data-w]'); if (w) { picked[w.dataset.w] = !picked[w.dataset.w]; w.classList.toggle('on', !!picked[w.dataset.w]); }
    });
    setTimeout(function () { var first = f.querySelector('input:not([value]),input[value=""]'); (first || f.name).focus(); }, 30);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (f[n].value || '').trim(); };
      if (!v('name')) { err.textContent = 'Your name, please.'; f.name.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) { err.textContent = 'An email we can reach you at, please.'; f.email.focus(); return; }
      if (!v('business')) { err.textContent = 'The name of your business, please.'; f.business.focus(); return; }
      err.textContent = ''; var go = f.querySelector('.go'); go.disabled = true; go.textContent = 'Sending...';
      var t = token();
      fetch(FN, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { Authorization: 'Bearer ' + t } : {}),
        body: JSON.stringify({ action: 'managed_interest', from: o.from || 'business', fix: o.fix || '', listing: o.listing || '', name: v('name'), email: v('email'),
          business: v('business'), city: v('city'), phone: v('phone'), note: v('note'), wants: Object.keys(picked).filter(function (k) { return picked[k]; }) }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok || !x.d.ok) { go.disabled = false; go.textContent = 'Send it to our team'; err.textContent = x.d.error === 'daily_limit' ? 'We already have your note from today. We will be in touch.' : 'That did not go through. Try again in a moment.'; return; }
          wrap.querySelector('.vem').innerHTML = '<h3>Got it, thank you</h3><p class="lead">Someone from our team will be in touch within a day. We sent a note to ' + esc(v('email')) + ' so you have it.</p>' +
            '<p class="lead">In the meantime, see the kind of website we build: <a href="/business/sample/site" target="_blank" rel="noopener">a sample restaurant\'s site</a>.</p><div class="acts"><button type="button" class="go no" style="color:#fff">Close</button></div>';
        })
        .catch(function () { go.disabled = false; go.textContent = 'Send it to our team'; err.textContent = 'That did not go through. Try again in a moment.'; });
    });
  }
  window.VEManaged = { open: open };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-managed]'); if (!a) return;
    e.preventDefault(); open({ from: a.dataset.managed || 'business', fix: a.dataset.fix || '', business: a.dataset.business || '', listing: a.dataset.listing || '' });
  });
})();
