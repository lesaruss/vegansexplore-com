/* ve-referrer.js: "Did someone send you?" on the sign-up step (Sean, 2026-11-03: "the name of the person that registered you, so we can do a
   double check to make sure they get credit... if their name shows up in our system as they're typing it, it'll auto give them an option").
   VEReferrer.mount(el) draws the field into el while the account is unpaid (the $11 window, /public/ve-auth.js). It tells them who their link
   already credits, suggests members as they type (first name, last initial, chapter) and records the pick through the ve-referrer function.
   Where the link already names someone, a different name is kept for the team and the link's person stays credited.
   VEReferrer.flush() saves typed words that were not picked, so the pay button can call it first. */
(function () {
  if (window.VEReferrer) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-referrer';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() { try { return localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function call(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + token() }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  var CSS = '.ve-ref{margin:0 0 18px;text-align:left;font-family:"Montserrat",sans-serif;}' +
    '.ve-ref label{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;color:#1a1a1a;margin-bottom:6px;}' +
    '.ve-ref label span{font-weight:600;color:#595959;}' +
    '.ve-ref-box{position:relative;}' +
    '.ve-ref input{width:100%;box-sizing:border-box;padding:11px 13px;border:1.5px solid rgba(0,0,0,.18);border-radius:6px;font:600 13px Montserrat,sans-serif;color:#1a1a1a;background:#fff;}' +
    '.ve-ref input:focus{outline:none;border-color:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.18);}' +
    '.ve-ref ul{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:3;margin:0;padding:4px 0;list-style:none;background:#fff;border:1px solid rgba(0,0,0,.14);border-radius:6px;box-shadow:0 12px 28px rgba(0,0,0,.16);}' +
    '.ve-ref ul[hidden]{display:none;}' +
    '.ve-ref li{padding:9px 13px;font-size:13px;font-weight:700;cursor:pointer;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;}' +
    '.ve-ref li small{font-size:11px;font-weight:600;color:#595959;}' +
    '.ve-ref li[aria-selected="true"],.ve-ref li:hover{background:#f0faf4;}' +
    '.ve-ref-note{margin:7px 0 0;font-size:12px;line-height:1.45;color:#1f5f22;font-weight:600;min-height:0;}' +
    '.ve-ref-note.warn{color:#7d4a00;}';
  var state = { el: null, input: null, list: null, note: null, picked: null, saved: '', timer: null, cur: -1, rows: [], linked: null };

  function say(t, warn) { state.note.textContent = t || ''; state.note.className = 've-ref-note' + (warn ? ' warn' : ''); }
  function closeList() { state.list.hidden = true; state.input.setAttribute('aria-expanded', 'false'); state.cur = -1; }
  function mark(i) { state.cur = i; [].forEach.call(state.list.children, function (li, k) { li.setAttribute('aria-selected', k === i ? 'true' : 'false'); }); }
  function outcome(d, shown) {
    if (!d || d.error) { say(d && d.error === 'already_member' ? '' : 'We could not save that just now. You can still join.', true); return; }
    if (d.status === 'credited') say('Thank you. ' + (d.credited || shown) + ' gets the credit for sending you.');
    else if (d.status === 'matched') say('Yes, that matches your link. ' + (d.credited || shown) + ' gets the credit.');
    else if (d.status === 'conflict') say('Your link came from ' + (d.credited || 'another member') + ', so they get the credit. We kept the name you gave us.', true);
    else say('We could not find that name, so we saved it and our team will look.', true);
  }
  function pick(r) {
    state.picked = r; state.input.value = r.label; state.saved = r.label; closeList(); say('Saving…');
    call({ action: 'claim', referrer_id: r.id }).then(function (d) { outcome(d, r.label); }).catch(function () { say('We could not save that just now. You can still join.', true); });
  }
  function search() {
    var q = state.input.value.trim(); state.picked = null;
    if (q.length < 2) { closeList(); return; }
    call({ action: 'search', q: q }).then(function (d) {
      if (state.input.value.trim() !== q) return;
      state.rows = (d && d.results) || [];
      if (!state.rows.length) { closeList(); return; }
      state.list.innerHTML = state.rows.map(function (r, i) {
        var bits = [r.chapter ? r.chapter.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : '', r.role === 'ambassador' ? 'Ambassador' : r.role === 'community_manager' ? 'Community Manager' : ''].filter(Boolean).join(' · ');
        return '<li role="option" id="ve-ref-o' + i + '" data-i="' + i + '">' + esc(r.label) + (bits ? '<small>' + esc(bits) + '</small>' : '') + '</li>';
      }).join('');
      state.list.hidden = false; state.input.setAttribute('aria-expanded', 'true'); mark(-1);
    }).catch(function () {});
  }
  // Typed words that were never picked are kept too (a person can type a name we do not suggest), so the team can look.
  function flush() {
    var t = state.input ? state.input.value.trim() : '';
    if (!t || state.picked || t === state.saved) return Promise.resolve();
    state.saved = t;
    return call({ action: 'claim', text: t }).then(function (d) { outcome(d, t); }).catch(function () {});
  }
  function mount(el) {
    if (!el || !token()) return;
    if (!document.getElementById('ve-ref-css')) { var s = document.createElement('style'); s.id = 've-ref-css'; s.textContent = CSS; document.head.appendChild(s); }
    el.innerHTML = '<div class="ve-ref"><label for="ve-ref-in">Did someone send you?<span>Optional</span></label>' +
      '<div class="ve-ref-box"><input id="ve-ref-in" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ve-ref-list" autocomplete="off" autocapitalize="words" spellcheck="false" data-dictate="off" placeholder="Start typing their name">' +
      '<ul id="ve-ref-list" role="listbox" hidden></ul></div><p class="ve-ref-note" aria-live="polite"></p></div>';
    state.el = el; state.input = el.querySelector('input'); state.list = el.querySelector('ul'); state.note = el.querySelector('.ve-ref-note');
    state.picked = null; state.saved = '';
    state.input.addEventListener('input', function () { clearTimeout(state.timer); state.timer = setTimeout(search, 200); });
    state.input.addEventListener('keydown', function (e) {
      var n = state.list.children.length;
      if (e.key === 'ArrowDown' && !state.list.hidden) { e.preventDefault(); mark(Math.min(n - 1, state.cur + 1)); }
      else if (e.key === 'ArrowUp' && !state.list.hidden) { e.preventDefault(); mark(Math.max(-1, state.cur - 1)); }
      else if (e.key === 'Escape' && !state.list.hidden) { e.stopPropagation(); closeList(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (state.cur >= 0 && state.rows[state.cur]) pick(state.rows[state.cur]); else { closeList(); flush(); } }
    });
    state.input.addEventListener('blur', function () { setTimeout(function () { if (state.list.hidden) flush(); }, 160); });
    state.list.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); pick(state.rows[+li.getAttribute('data-i')]); } });
    call({ action: 'status' }).then(function (d) {
      if (!d || d.error || d.paid) { el.innerHTML = ''; return; }
      if (d.credited) { state.linked = d.credited; say('The link you came from credits ' + d.credited + '. Someone else sent you? Type their name.'); }
    }).catch(function () {});
  }
  window.VEReferrer = { mount: mount, flush: flush };
})();
