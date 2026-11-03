/* The Daily Pulse subscription box and exit pop-up (Sean, 2026-11-03, canon canon-ve-people-campaigns-doors; edge function ve-pulse-subscribe).
   Loaded by /pulse and every /pulse/<article>. Shows nothing until Sean turns the subscription on (status.open), nothing in a frame, nothing on
   LESARUSS.ai, nothing for someone already subscribed on this browser.
   - The box: after the first story card on /pulse, and at the foot of the page's main column on every Pulse page and article.
   - The exit pop-up: desktop only (a wide screen with a mouse), never on a first page view of a visit, once per visitor per 30 days,
     when the pointer leaves through the top of the window. Never on phones (Google penalizes intrusive mobile interstitials).
   Double opt-in: the form sends the confirm email; nothing starts until they click it. London needs the unticked box. */
(function (global) {
  'use strict';
  if (global.VEPulseSub) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-pulse-subscribe';
  var CITIES = [['south-florida', 'South Florida'], ['central-florida', 'Central Florida'], ['north-florida', 'North Florida'], ['atlanta', 'Atlanta'],
    ['washington-dc', 'Washington, D.C.'], ['delaware', 'Delaware'], ['maryland', 'Maryland'], ['virginia', 'Virginia'], ['west-virginia', 'West Virginia'],
    ['new-york', 'New York'], ['philadelphia', 'Philadelphia'], ['los-angeles', 'Los Angeles'], ['london', 'London']];
  var MAX = 3, THIRTY_DAYS = 30 * 864e5;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var inFrame = false; try { inFrame = global.self !== global.top; } catch (e) { inFrame = true; }
  var brand = global.VE_BRAND && global.VE_BRAND.pulse; // LESARUSS.ai's Pulse has its own audience
  var q = new URLSearchParams(location.search);
  if (inFrame || brand || q.has('preview') || q.get('hub') === '1' || /^\/(admin|dashboard)\//.test(location.pathname)) return;
  if (ls('ve_pulse_sub') === '1') return;

  function guessCity() {
    var c = q.get('city') || q.get('community') || ss('ve_dir_city') || '';
    return CITIES.some(function (x) { return x[0] === c; }) ? c : '';
  }

  var CSS = '.vps{border:2px solid var(--ve-green-dark,#1f5f22);border-radius:12px;padding:20px 22px;margin:22px 0;background:#fff;font-family:Montserrat,Arial,sans-serif;color:#1a1a1a}' +
    '.vps h3{font-size:20px;font-weight:800;margin:0 0 4px;color:var(--ve-green-dark,#1f5f22)}.vps p{font-size:14px;line-height:1.55;margin:0 0 12px;color:#444}' +
    '.vps-row{display:flex;gap:10px;flex-wrap:wrap;align-items:stretch}.vps input[type=email]{flex:1 1 220px;min-width:0;height:44px;border:1px solid #bbb;border-radius:6px;padding:0 14px;font:inherit;font-size:15px}' +
    '.vps button.vps-go{height:44px;border:0;border-radius:6px;background:var(--ve-green-dark,#1f5f22);color:#fff;font:800 13px Montserrat,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:0 22px;cursor:pointer}' +
    '.vps button.vps-go:disabled{opacity:.6;cursor:default}.vps-cities{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}' +
    '.vps-chip{position:relative}.vps-chip input{position:absolute;opacity:0;inset:0;cursor:pointer}.vps-chip span{display:block;border:1px solid #bbb;border-radius:6px;padding:7px 11px;font-size:13px;font-weight:600;background:#fff}' +
    '.vps-chip input:checked+span{background:var(--ve-green-dark,#1f5f22);border-color:var(--ve-green-dark,#1f5f22);color:#fff}.vps-chip input:focus-visible+span{outline:3px solid #F69820;outline-offset:2px}' +
    '.vps-opts{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;margin:0 0 12px}.vps-opts label{display:flex;gap:6px;align-items:center;cursor:pointer}' +
    '.vps-msg{font-size:14px;font-weight:700;margin-top:10px;min-height:20px}.vps-msg.err{color:#b3261e}.vps-fine{font-size:12px;color:#666;margin:10px 0 0}' +
    '.vps-lon{display:none;font-size:13px;margin:0 0 12px}.vps-lon label{display:flex;gap:8px;align-items:flex-start}' +
    '.vps-pop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.vps-pop .vps{max-width:560px;width:100%;margin:0;position:relative;max-height:92vh;overflow:auto}.vps-x{position:absolute;top:10px;right:12px;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#555}';

  function formHtml(id, preset) {
    var chips = CITIES.map(function (c) {
      return '<label class="vps-chip"><input type="checkbox" name="city" value="' + c[0] + '"' + (c[0] === preset ? ' checked' : '') + '><span>' + esc(c[1]) + '</span></label>';
    }).join('');
    return '<form class="vps-form" novalidate>' +
      '<div class="vps-cities" role="group" aria-label="Pick up to three cities">' + chips + '</div>' +
      '<div class="vps-opts"><label><input type="radio" name="freq-' + id + '" value="daily" checked> Every day</label><label><input type="radio" name="freq-' + id + '" value="weekly"> Once a week</label></div>' +
      '<div class="vps-lon"><label><input type="checkbox" name="consent"> <span>Yes, email me the Daily Pulse. I can stop it any time.</span></label></div>' +
      '<div class="vps-row"><label class="visually-hidden" style="position:absolute;left:-9999px" for="vps-e-' + id + '">Your email</label>' +
      '<input id="vps-e-' + id + '" type="email" name="email" placeholder="Your email" autocomplete="email" maxlength="200" required>' +
      '<button class="vps-go" type="submit">Subscribe</button></div>' +
      '<div class="vps-msg" role="status" aria-live="polite"></div>' +
      '<p class="vps-fine">Free. We email you once to confirm, then the Pulse. Stop any time with one click.</p></form>';
  }
  var seq = 0;
  function build(pop) {
    var id = ++seq, box = document.createElement('section');
    box.className = 'vps'; box.setAttribute('aria-label', 'Get the Daily Pulse');
    box.innerHTML = (pop ? '<button type="button" class="vps-x" aria-label="Close">&times;</button>' : '') +
      '<h3>' + (pop ? 'Before you go: get the Daily Pulse' : 'Get the Daily Pulse in your inbox') + '</h3>' +
      '<p>The Vegan news, places, events and what is happening in your city, short and free. Pick up to three cities.</p>' + formHtml(id, guessCity());
    wire(box);
    return box;
  }
  function wire(box) {
    var form = box.querySelector('form'), msg = box.querySelector('.vps-msg'), lon = box.querySelector('.vps-lon'), go = box.querySelector('.vps-go');
    function picked() { return Array.prototype.map.call(form.querySelectorAll('input[name=city]:checked'), function (i) { return i.value; }); }
    form.addEventListener('change', function (e) {
      var p = picked();
      if (e.target.name === 'city' && p.length > MAX) { e.target.checked = false; msg.className = 'vps-msg err'; msg.textContent = 'Pick up to three cities.'; return; }
      msg.textContent = ''; lon.style.display = p.indexOf('london') > -1 ? 'block' : 'none';
    });
    lon.style.display = picked().indexOf('london') > -1 ? 'block' : 'none';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cities = picked(), email = form.email.value.trim(), freq = (form.querySelector('input[type=radio]:checked') || {}).value || 'daily';
      msg.className = 'vps-msg err';
      if (!cities.length) { msg.textContent = 'Pick at least one city.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'That email does not look right.'; return; }
      go.disabled = true; msg.className = 'vps-msg'; msg.textContent = 'One moment…';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'subscribe', email: email, cities: cities, frequency: freq,
        consent: !!(form.consent && form.consent.checked), source: 'pulse:' + location.pathname.slice(0, 80) }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          go.disabled = false;
          if (d && d.ok) {
            ls('ve_pulse_sub', '1');
            box.innerHTML = '<h3>' + (d.already ? 'You are on the list' : 'Check your email') + '</h3><p>' +
              (d.already ? 'We updated your cities. Nothing else to do.' : 'We sent a link to confirm. Click it and the Daily Pulse starts.') + '</p>';
            setTimeout(function () { if (box.parentNode && box.parentNode.classList.contains('vps-pop')) box.parentNode.remove(); }, 6000);
          } else { msg.className = 'vps-msg err'; msg.textContent = (d && d.message) || 'That did not go through. Try again in a minute.'; }
        }).catch(function () { go.disabled = false; msg.className = 'vps-msg err'; msg.textContent = 'That did not go through. Try again in a minute.'; });
    });
  }

  // ----- Placement -----
  function place() {
    if (ls('ve_pulse_sub') === '1') return;
    var main = document.querySelector('.vear-main');
    if (main && !main.querySelector(':scope > .vps-end')) { var end = build(false); end.classList.add('vps-end'); main.appendChild(end); }
    var first = document.querySelector('#posts .post-card');
    if (first && !document.querySelector('.vps-inline')) { var inl = build(false); inl.classList.add('vps-inline'); first.parentNode.insertBefore(inl, first.nextSibling); }
  }
  // ----- The exit pop-up: desktop only, not on a first page view, once per 30 days -----
  function desktop() { return global.matchMedia && global.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches; }
  function exitIntent() {
    if (!desktop()) return;
    var views = Number(ss('ve_pulse_views') || 0) + 1; ss('ve_pulse_views', String(views));
    if (views < 2) return;
    var last = Number(ls('ve_pulse_exit') || 0); if (last && Date.now() - last < THIRTY_DAYS) return;
    var armed = false; setTimeout(function () { armed = true; }, 8000);
    function onOut(e) {
      if (!armed || e.clientY > 0 || e.relatedTarget) return;
      document.removeEventListener('mouseout', onOut);
      if (ls('ve_pulse_sub') === '1') return;
      ls('ve_pulse_exit', String(Date.now()));
      var pop = document.createElement('div'); pop.className = 'vps-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true');
      var box = build(true); pop.appendChild(box); document.body.appendChild(pop);
      function close() { pop.remove(); document.removeEventListener('keydown', onKey); }
      function onKey(ev) { if (ev.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      pop.addEventListener('click', function (ev) { if (ev.target === pop) close(); });
      box.querySelector('.vps-x').addEventListener('click', close);
      var f = box.querySelector('input[type=email]'); if (f) f.focus();
    }
    document.addEventListener('mouseout', onOut);
  }

  function start() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    place(); exitIntent();
    var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(place, 300); }).observe(document.body, { childList: true, subtree: true });
  }
  fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status' }) })
    .then(function (r) { return r.json(); }).then(function (d) { if (d && d.open) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); } }).catch(function () {});
  global.VEPulseSub = { build: build };
})(window);
