/* ve-listing-request.js: "Know a Vegan place we are missing?" (ve-community-directory T3, Sean 2026-11-06).
   VEListingRequest.open({ name?, where?, page? }) opens a small window: name, where, a link (website or Instagram), a note, and an email
   when signed out. It sends ve-listing-requests submit. Sean's own (a super admin's token) go straight to work; everyone else's are
   researched and drafted first, then wait for Sean on his dashboard. Any element with data-ve-listing-request opens it. */
(function () {
  if (window.VEListingRequest) return;
  var URL_FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-requests';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function token() { try { return window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn() ? VEAuth.getToken() : ''; } catch (e) { return ''; } }
  function visitor() { try { var v = localStorage.getItem('ve_visitor'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('ve_visitor', v); } return v; } catch (e) { return ''; } }
  function css() {
    if (document.getElementById('vlr-css')) return;
    var s = document.createElement('style'); s.id = 'vlr-css';
    s.textContent = '.vlr-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.vlr{background:#fff;border-radius:12px;max-width:480px;width:100%;max-height:92vh;overflow:auto;padding:22px;font-family:Montserrat,system-ui,sans-serif;color:#1a1a1a}' +
      '.vlr h3{margin:0 0 4px;font-size:20px;font-weight:800}.vlr p{margin:0 0 14px;font-size:14px;line-height:1.5;color:rgba(0,0,0,.68)}' +
      '.vlr label{display:block;font-size:12px;font-weight:700;margin:10px 0 4px}.vlr input,.vlr textarea{width:100%;box-sizing:border-box;border:1px solid rgba(0,0,0,.18);border-radius:6px;padding:10px 12px;font:inherit;font-size:16px}' +
      '.vlr textarea{min-height:70px;resize:vertical}.vlr-row{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}' +
      '.vlr button{border:0;border-radius:6px;padding:11px 18px;font:inherit;font-weight:800;font-size:13px;cursor:pointer}.vlr .go{background:var(--vb-go,#2D5C27);color:#fff}.vlr .no{background:#eee;color:#1a1a1a}' +
      '.vlr-msg{font-size:13px;margin-top:10px;color:#b42318}.vlr-ok{font-size:15px;line-height:1.5}';
    document.head.appendChild(s);
  }
  function open(o) {
    o = o || {}; css();
    var signed = !!token();
    var bg = document.createElement('div'); bg.className = 'vlr-bg';
    bg.innerHTML = '<div class="vlr" role="dialog" aria-modal="true" aria-labelledby="vlr-h"><h3 id="vlr-h">Know a Vegan place we are missing?</h3>' +
      '<p>Tell us about it. Our team looks it up and checks it before it goes on the Directory.</p>' +
      '<label for="vlr-n">Its name</label><input id="vlr-n" maxlength="140" value="' + esc(o.name || '') + '">' +
      '<label for="vlr-w">Where it is</label><input id="vlr-w" maxlength="140" placeholder="City and state, or online" value="' + esc(o.where || '') + '">' +
      '<label for="vlr-l">A link (optional)</label><input id="vlr-l" maxlength="600" placeholder="https:// or @instagram" data-dictate="off">' +
      '<label for="vlr-t">What do you get there? (optional)</label><textarea id="vlr-t" maxlength="1500" placeholder="All Vegan, or a few Vegan options? What do you order?"></textarea>' +
      (signed ? '' : '<label for="vlr-e">Your email, so we can tell you when it is listed</label><input id="vlr-e" type="email" maxlength="200">') +
      '<div class="vlr-msg" id="vlr-m" role="alert"></div><div class="vlr-row"><button type="button" class="no" data-x>Cancel</button><button type="button" class="go" data-s>Send it</button></div></div>';
    document.body.appendChild(bg);
    var close = function () { bg.remove(); };
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.hasAttribute('data-x')) close(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    var $ = function (id) { return bg.querySelector('#' + id); };
    $('vlr-n').focus();
    bg.querySelector('[data-s]').onclick = function () {
      var btn = this, m = $('vlr-m'); m.textContent = '';
      var body = { action: 'submit', name: $('vlr-n').value, where: $('vlr-w').value, link: $('vlr-l').value, note: $('vlr-t').value,
        email: signed ? '' : ($('vlr-e') || {}).value || '', visitor: visitor(), page_url: o.page || location.href };
      if (!body.name.trim() && !body.link.trim()) { m.textContent = 'Give us its name or a link.'; return; }
      btn.disabled = true; btn.textContent = 'Sending...';
      var h = { 'Content-Type': 'application/json' }; if (signed) h.Authorization = 'Bearer ' + token();
      fetch(URL_FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d || !d.ok) { m.textContent = (d && d.message) || 'That did not send. Try again in a minute.'; btn.disabled = false; btn.textContent = 'Send it'; return; }
        bg.querySelector('.vlr').innerHTML = '<h3>Thank you</h3><p class="vlr-ok">' + (d.straight_to_work ? 'It is in the queue and Logan works it next.' :
          'Our team looks it up and checks it. ' + (signed || body.email ? 'We will let you know when it is listed.' : '')) + '</p><div class="vlr-row"><button type="button" class="go" data-x>Close</button></div>';
      }).catch(function () { m.textContent = 'That did not send. Try again in a minute.'; btn.disabled = false; btn.textContent = 'Send it'; });
    };
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ve-listing-request]');
    if (t) { e.preventDefault(); open({ name: t.getAttribute('data-name') || '', where: t.getAttribute('data-where') || '' }); }
  });
  window.VEListingRequest = { open: open };
})();
