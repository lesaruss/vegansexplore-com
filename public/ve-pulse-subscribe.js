/* The Daily Pulse subscription (Sean, 2026-11-03; redone 2026-11-09, playbook ve-daily-pulse-discussion; edge function ve-pulse-subscribe).
   Sean, 2026-11-09: "take where the search is and make that 50... a 2 column and then put a call to action just to subscribe to the Pulse. When they
   put their email address and click subscribe, it opens up a window that has them choose what they want to subscribe to. Once they choose, they can
   confirm... a confirmation that they can close, and then they'll get an email confirming their subscriptions." Anyone can subscribe; no membership.
   - The call to action: one email field and Subscribe. On /pulse it fills #vps-slot beside the search (half and half, the Daily Pulse tab only);
     on a Pulse article (/pulse/<slug>) it sits at the foot of the main column; on desktop the exit pop-up offers it once per 30 days.
   - Subscribe opens the window: their cities (up to three), how often, the London box when London is picked, then Confirm.
   - Confirm sends the confirm email (double opt-in, unchanged) and the window says Check your email, with Close.
   Shows nothing until the subscription is on (status.open), in a frame, on LESARUSS.ai, or for someone already subscribed on this browser. */
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
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var inFrame = false; try { inFrame = global.self !== global.top; } catch (e) { inFrame = true; }
  var brand = global.VE_BRAND && global.VE_BRAND.pulse; // LESARUSS.ai's Pulse has its own audience
  var q = new URLSearchParams(location.search);
  if (inFrame || brand || q.has('preview') || q.get('hub') === '1' || /^\/(admin|dashboard)\//.test(location.pathname)) return;
  if (ls('ve_pulse_sub') === '1') return;

  function guessCity() {
    var c = q.get('city') || q.get('community') || ss('ve_dir_city') || '';
    return CITIES.some(function (x) { return x[0] === c; }) ? c : '';
  }

  var G = 'var(--ve-green-dark,#1f5f22)';
  var CSS =
    // The call to action (beside the search, or a card at the foot of an article)
    '.vps-cta{font-family:Montserrat,Arial,sans-serif;color:#1a1a1a;padding:16px 0 6px}' +
    '.vps-cta.vps-card{border:1.5px solid rgba(0,0,0,.1);border-radius:12px;padding:18px 20px;margin:24px 0;background:#fff}' +
    '.vps-cta label.vps-l{display:block;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:' + G + ';margin:0 0 6px}' +
    '.vps-cta .vps-row{display:flex;gap:8px}.vps-cta input[type=email]{flex:1 1 auto;min-width:0;border:1.5px solid rgba(0,0,0,.12);border-radius:6px;padding:11px 14px;font:inherit;font-size:15px;background:#fff}' +
    '.vps-cta input[type=email]:focus{outline:2px solid ' + G + ';outline-offset:1px;border-color:' + G + '}' +
    '.vps-go{border:0;border-radius:6px;background:' + G + ';color:#fff;font:800 12.5px Montserrat,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:0 20px;min-height:46px;cursor:pointer;white-space:nowrap}' +
    '.vps-go:disabled{opacity:.6;cursor:default}.vps-go:focus-visible,.vps-x:focus-visible{outline:3px solid #F69820;outline-offset:2px}' +
    '.vps-err{font-size:13px;font-weight:700;color:#b3261e;margin-top:6px;min-height:0}.vps-err:empty{display:none}' +
    '.vps-done{font-size:14px;font-weight:700;color:' + G + ';padding:12px 0}' +
    // The window
    '.vps-pop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.vps-win{font-family:Montserrat,Arial,sans-serif;color:#1a1a1a;background:#fff;border-radius:12px;max-width:560px;width:100%;max-height:92vh;overflow:auto;padding:26px 24px 22px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
    '.vps-win h3{font-size:21px;font-weight:900;margin:0 0 4px;color:' + G + ';padding-right:30px}.vps-win p{font-size:14px;line-height:1.55;margin:0 0 14px;color:#444}' +
    '.vps-win h4{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:16px 0 8px;color:#333}' +
    '.vps-x{position:absolute;top:12px;right:14px;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#555;padding:2px 6px}' +
    '.vps-cities{display:flex;flex-wrap:wrap;gap:6px}' +
    '.vps-chip{position:relative}.vps-chip input{position:absolute;opacity:0;inset:0;cursor:pointer;margin:0}.vps-chip span{display:block;border:1.5px solid rgba(0,0,0,.18);border-radius:6px;padding:8px 12px;font-size:13px;font-weight:700;background:#fff}' +
    '.vps-chip input:checked+span{background:' + G + ';border-color:' + G + ';color:#fff}.vps-chip input:focus-visible+span{outline:3px solid #F69820;outline-offset:2px}' +
    '.vps-freq{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vps-freq .vps-chip span{text-align:center;padding:11px 10px}' +
    '.vps-freq .vps-chip small{display:block;font-weight:600;font-size:11.5px;opacity:.8}' +
    '.vps-lon{display:none;font-size:13px;margin:14px 0 0}.vps-lon label{display:flex;gap:8px;align-items:flex-start;cursor:pointer}' +
    '.vps-acts{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:20px}.vps-acts .vps-go{padding:0 26px}' +
    '.vps-ghost{border:1.5px solid rgba(0,0,0,.2);border-radius:6px;background:#fff;color:#333;font:800 12.5px Montserrat,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:0 18px;min-height:46px;cursor:pointer}' +
    '.vps-fine{font-size:12px;color:#666;margin:14px 0 0}.vps-win .vps-fine{margin:18px 0 0}.vps-to{font-weight:700;color:#1a1a1a}' +
    '.vps-check{width:56px;height:56px;border-radius:50%;background:#e8f5e9;color:' + G + ';display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;margin:0 0 12px}' +
    '@media (max-width:480px){.vps-cta .vps-row{flex-direction:column}.vps-go{width:100%}.vps-win{padding:22px 18px 18px}.vps-acts .vps-go,.vps-acts .vps-ghost{flex:1 1 100%}}';

  // ----- The call to action -----
  var seq = 0;
  function cta(opts) {
    opts = opts || {};
    var id = 'vps-e-' + (++seq), box = document.createElement('div');
    box.className = 'vps-cta' + (opts.card ? ' vps-card' : '');
    box.innerHTML = '<form novalidate><label class="vps-l" for="' + id + '">' + esc(opts.label || 'Get the Daily Pulse in your inbox') + '</label>' +
      '<div class="vps-row"><input id="' + id + '" type="email" name="email" placeholder="Your email" autocomplete="email" maxlength="200" required data-dictate="off">' +
      '<button class="vps-go" type="submit">Subscribe</button></div><div class="vps-err" role="alert"></div></form>';
    var form = box.querySelector('form'), err = box.querySelector('.vps-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      if (!EMAIL_RE.test(email)) { err.textContent = 'That email does not look right.'; form.email.focus(); return; }
      err.textContent = '';
      if (opts.onOpen) opts.onOpen();
      chooser(email, function (res) { done(box, res); });
    });
    return box;
  }
  function done(box, res) {
    ls('ve_pulse_sub', '1');
    box.innerHTML = '<div class="vps-done" role="status">' + (res && res.already ? 'You are subscribed to the Daily Pulse. We updated your choices.' : 'Almost there: check your email to confirm your Daily Pulse.') + '</div>';
  }

  // ----- The window: choose what they get, then confirm -----
  function chooser(email, onDone) {
    var preset = guessCity(), last = document.activeElement;
    var pop = document.createElement('div'); pop.className = 'vps-pop';
    var win = document.createElement('div'); win.className = 'vps-win';
    win.setAttribute('role', 'dialog'); win.setAttribute('aria-modal', 'true'); win.setAttribute('aria-labelledby', 'vps-t');
    var chips = CITIES.map(function (c) {
      return '<label class="vps-chip"><input type="checkbox" name="city" value="' + c[0] + '"' + (c[0] === preset ? ' checked' : '') + '><span>' + esc(c[1]) + '</span></label>';
    }).join('');
    win.innerHTML = '<button type="button" class="vps-x" aria-label="Close">&times;</button>' +
      '<form novalidate><h3 id="vps-t">Choose your Daily Pulse</h3>' +
      '<p>For <span class="vps-to">' + esc(email) + '</span>. The Vegan news, places and events for the cities you pick. Free, and you can change it any time.</p>' +
      '<h4 id="vps-ct">Your cities <span style="font-weight:600;text-transform:none;letter-spacing:0">(up to three)</span></h4>' +
      '<div class="vps-cities" role="group" aria-labelledby="vps-ct">' + chips + '</div>' +
      '<h4 id="vps-ft">How often</h4><div class="vps-freq" role="radiogroup" aria-labelledby="vps-ft">' +
      '<label class="vps-chip"><input type="radio" name="freq" value="daily" checked><span>Every day<small>Each morning</small></span></label>' +
      '<label class="vps-chip"><input type="radio" name="freq" value="weekly"><span>Once a week<small>Mondays</small></span></label></div>' +
      '<div class="vps-lon"><label><input type="checkbox" name="consent"> <span>Yes, email me the Daily Pulse. I can stop it any time.</span></label></div>' +
      '<div class="vps-err" role="alert" style="margin-top:12px"></div>' +
      '<div class="vps-acts"><button class="vps-go" type="submit">Confirm</button><button type="button" class="vps-ghost" data-close>Cancel</button></div>' +
      '<p class="vps-fine">We send one email to confirm it is you. Nothing starts until you click it. Every email has a one-click unsubscribe.</p></form>';
    pop.appendChild(win); document.body.appendChild(pop);
    var form = win.querySelector('form'), err = win.querySelector('.vps-err'), lon = win.querySelector('.vps-lon'), go = win.querySelector('.vps-go');
    var finished = null;
    function close() { pop.remove(); document.removeEventListener('keydown', onKey); if (finished && onDone) onDone(finished); try { last && last.focus && last.focus(); } catch (e) {} }
    function onKey(ev) { if (ev.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    pop.addEventListener('click', function (ev) { if (ev.target === pop) close(); });
    win.addEventListener('click', function (ev) { if (ev.target.closest('.vps-x,[data-close]')) close(); });
    function picked() { return Array.prototype.map.call(form.querySelectorAll('input[name=city]:checked'), function (i) { return i.value; }); }
    form.addEventListener('change', function (e) {
      var p = picked();
      if (e.target.name === 'city' && p.length > MAX) { e.target.checked = false; err.textContent = 'Pick up to three cities.'; return; }
      err.textContent = ''; lon.style.display = picked().indexOf('london') > -1 ? 'block' : 'none';
    });
    lon.style.display = picked().indexOf('london') > -1 ? 'block' : 'none';
    var first = form.querySelector('input[name=city]:checked') || form.querySelector('input[name=city]'); if (first) first.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cities = picked(), freq = (form.querySelector('input[name=freq]:checked') || {}).value || 'daily';
      if (!cities.length) { err.textContent = 'Pick at least one city.'; return; }
      if (cities.indexOf('london') > -1 && !form.consent.checked) { err.textContent = 'Tick the box to get the London Pulse by email.'; return; }
      go.disabled = true; go.textContent = 'One moment…'; err.textContent = '';
      fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'subscribe', email: email, cities: cities, frequency: freq,
        consent: !!form.consent.checked, source: location.pathname.slice(0, 100) }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          if (d && d.ok) {
            finished = d;
            var and = function (a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; };
            var names = cities.map(function (c) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i][0] === c) return CITIES[i][1]; return c; });
            win.innerHTML = '<button type="button" class="vps-x" aria-label="Close">&times;</button><div class="vps-check" aria-hidden="true">&#10003;</div>' +
              (d.already
                ? '<h3 id="vps-t">You are subscribed</h3><p>We updated your Daily Pulse: ' + esc(and(names)) + ', ' + (freq === 'weekly' ? 'once a week' : 'every day') + '.</p>'
                : '<h3 id="vps-t">Check your email</h3><p>We sent a link to <span class="vps-to">' + esc(email) + '</span>. Click <b>Yes, send me the Pulse</b> in that email to confirm, and your Daily Pulse for ' +
                  esc(and(names)) + ' starts ' + (freq === 'weekly' ? 'on Monday' : 'with the next morning\'s edition') + '.</p><p class="vps-fine">Not there in a few minutes? Check your spam or promotions folder.</p>') +
              '<div class="vps-acts"><button type="button" class="vps-go" data-close>Close</button></div>';
            var c = win.querySelector('[data-close]'); if (c) c.focus();
          } else {
            go.disabled = false; go.textContent = 'Confirm';
            err.textContent = (d && d.message) || 'That did not go through. Try again in a minute.';
          }
        }).catch(function () { go.disabled = false; go.textContent = 'Confirm'; err.textContent = 'That did not go through. Try again in a minute.'; });
    });
  }

  // ----- Placement -----
  function place() {
    if (ls('ve_pulse_sub') === '1') return;
    var slot = document.getElementById('vps-slot');
    if (slot) {                                         // /pulse: beside the search, half and half
      if (!slot.firstChild) { slot.appendChild(cta()); var top = document.getElementById('pulse-top'); if (top) top.classList.add('has-sub'); }
      return;
    }
    var main = document.querySelector('.vear-main');    // a Pulse article: a card at the foot of the main column
    if (main && !main.querySelector(':scope > .vps-card')) main.appendChild(cta({ card: true }));
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
      if (ls('ve_pulse_sub') === '1' || document.querySelector('.vps-pop')) return;
      ls('ve_pulse_exit', String(Date.now()));
      var pop = document.createElement('div'); pop.className = 'vps-pop';
      var win = document.createElement('div'); win.className = 'vps-win'; win.setAttribute('role', 'dialog'); win.setAttribute('aria-modal', 'true'); win.setAttribute('aria-labelledby', 'vps-et');
      win.innerHTML = '<button type="button" class="vps-x" aria-label="Close">&times;</button><h3 id="vps-et">Before you go: get the Daily Pulse</h3>' +
        '<p>The Vegan news, places and events in your city, short and free.</p>';
      function close() { pop.remove(); document.removeEventListener('keydown', onKey); }
      function onKey(ev) { if (ev.key === 'Escape') close(); }
      var box = cta({ label: 'Your email', onOpen: close });
      win.appendChild(box); pop.appendChild(win); document.body.appendChild(pop);
      document.addEventListener('keydown', onKey);
      pop.addEventListener('click', function (ev) { if (ev.target === pop) close(); });
      win.querySelector('.vps-x').addEventListener('click', close);
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
  global.VEPulseSub = { cta: cta, chooser: chooser };
})(window);
