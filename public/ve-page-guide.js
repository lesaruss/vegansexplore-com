/* ve-page-guide.js: the super admin's chat with the page's Guide (Sean, 2026-11-05, playbook ve-page-guide, phase 1).
 * "When I do that as a super admin, that is the equivalent of me speaking to you here."
 *
 *   VEPageGuide.open()   opened by the Feedback button (ve-feedback.js) for a signed-in super admin (not while viewing as someone else).
 *
 * Tell the Guide what is wrong on the page; it answers, asks when it is unsure, and lists the exact changes (what it is now, what it
 * becomes). Tick the ones you want and press Apply. Server: ve-page-guide (chat proposes, apply re-checks and saves, each change logged).
 * The conversation is kept for the visit per page (sessionStorage ve_pg_<path>). "Send as feedback instead" opens the plain form. */
(function () {
  if (window.VEPageGuide) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-page-guide';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pageUrl() { try { if (window.VEFeedback && VEFeedback.url) return VEFeedback.url(); } catch (e) {} return location.href; }
  function key() { return 've_pg_' + location.pathname; }
  function load() { try { return JSON.parse(sessionStorage.getItem(key()) || '[]'); } catch (e) { return []; } }
  function save(t) { try { sessionStorage.setItem(key(), JSON.stringify(t.slice(-30))); } catch (e) {} }
  function pic() { try { if (window.VEGuideArt) return VEGuideArt('liz', 'square'); } catch (e) {} return 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20261005_021226_51fc0dd1-aad1-45ee-ada3-f6cab13ed3a2_min.webp'; }
  function css() {
    if (document.getElementById('vepgStyle')) return;
    var st = document.createElement('style'); st.id = 'vepgStyle';
    st.textContent = '.vepg-wrap{position:fixed;inset:0;z-index:100001;background:rgba(10,20,14,.45);display:flex;justify-content:flex-end;font-family:Montserrat,system-ui,sans-serif;}' +
      '.vepg{background:#fff;color:#14261a;width:min(480px,100%);height:100%;display:flex;flex-direction:column;box-shadow:-10px 0 40px rgba(0,0,0,.2);}' +
      '.vepg-h{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(0,0,0,.1);}' +
      '.vepg-h img{width:48px;height:48px;border-radius:10px;object-fit:cover;background:#eef5ef;flex-shrink:0;}.vepg-h b{display:block;font-size:16px;font-weight:900;}' +
      '.vepg-h span{display:block;font-size:12px;color:rgba(0,0,0,.6);line-height:1.35;}.vepg-h .x{margin-left:auto;background:none;border:0;font-size:26px;line-height:1;cursor:pointer;color:#14261a;padding:4px 8px;}' +
      '.vepg-log{flex:1;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}' +
      '.vepg-m{max-width:88%;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.5;white-space:pre-wrap;}.vepg-m.u{align-self:flex-end;background:var(--vb-accent,#1E7A3E);color:#fff;}' +
      '.vepg-m.a{align-self:flex-start;background:#f1f6f2;}.vepg-m.s{align-self:center;background:none;color:rgba(0,0,0,.6);font-size:12.5px;text-align:center;}' +
      '.vepg-ch{border:1px solid rgba(0,0,0,.14);border-radius:10px;padding:10px 12px;font-size:13px;align-self:stretch;}.vepg-ch label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;margin:0 0 8px;}' +
      '.vepg-ch input{margin-top:3px;width:16px;height:16px;flex-shrink:0;}.vepg-ch .f{font-weight:800;}.vepg-ch .from{color:#8a1c12;text-decoration:line-through;word-break:break-word;}.vepg-ch .to{color:#14612d;font-weight:700;word-break:break-word;white-space:pre-wrap;}' +
      '.vepg-ch .why{color:rgba(0,0,0,.55);font-size:12px;}.vepg-ch .ap{background:var(--vb-accent,#1E7A3E);color:#fff;border:0;border-radius:6px;padding:9px 14px;font:800 13px/1 inherit;font-family:inherit;cursor:pointer;}' +
      '.vepg-ch .ap:disabled{opacity:.5;cursor:default;}.vepg-f{border-top:1px solid rgba(0,0,0,.1);padding:12px 16px;}' +
      '.vepg-f textarea{display:block;width:100%;box-sizing:border-box;min-height:70px;max-height:180px;resize:vertical;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:9px 12px;font:500 14px/1.45 inherit;font-family:inherit;color:#14261a;}' +
      '.vepg-f .row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:8px;flex-wrap:wrap;}.vepg-f .go{background:var(--vb-accent,#1E7A3E);color:#fff;border:0;border-radius:6px;padding:11px 18px;font:800 14px/1 inherit;font-family:inherit;cursor:pointer;}' +
      '.vepg-f .go:disabled{opacity:.5;}.vepg-f .lnk{background:none;border:0;font:700 12.5px inherit;font-family:inherit;cursor:pointer;color:rgba(0,0,0,.6);text-decoration:underline;padding:0;}' +
      '@media(max-width:560px){.vepg{width:100%;}}';
    document.head.appendChild(st);
  }
  function open() {
    css();
    var turns = load(), busy = false;
    var wrap = document.createElement('div'); wrap.className = 'vepg-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Talk to Liz about this page');
    wrap.innerHTML = '<div class="vepg"><div class="vepg-h"><img alt="" src="' + esc(pic()) + '"><div><b>Talk to Liz</b><span>About this page. Tell me what is wrong or out of date; I show you the changes before anything saves.</span></div><button type="button" class="x" aria-label="Close">&times;</button></div>' +
      '<div class="vepg-log" aria-live="polite"></div>' +
      '<form class="vepg-f" novalidate><textarea name="t" placeholder="For example: Samuel goes by Chef Sam. Use chefsam@therabbithole.life; the Gmail is old."></textarea>' +
      '<div class="row"><span><button type="button" class="lnk" data-fb>Send as feedback instead</button> &middot; <button type="button" class="lnk" data-new>Start over</button></span><button type="submit" class="go">Send</button></div></form></div>';
    document.body.appendChild(wrap);
    var log = wrap.querySelector('.vepg-log'), f = wrap.querySelector('form'), ta = f.t, go = f.querySelector('.go');
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('.x')) close();
      if (e.target.closest('[data-fb]')) { close(); if (window.VEFeedback) VEFeedback.open({ form: true }); }
      if (e.target.closest('[data-new]')) { turns = []; save(turns); draw(); }
    });
    function changeCard(t, i) {
      var done = t.applied;
      return '<div class="vepg-ch" data-i="' + i + '">' + t.changes.map(function (c, j) {
        return '<label><input type="checkbox" data-j="' + j + '"' + (done ? ' disabled' : ' checked') + '><span><span class="f">' + esc(c.label) + '</span><br>' +
          (c.from ? '<span class="from">' + esc(c.from) + '</span><br>' : '') + '<span class="to">' + esc(c.field === 'do_not_email' ? 'Do not email this contact' : c.to) + '</span>' +
          (c.why ? '<br><span class="why">' + esc(c.why) + '</span>' : '') + '</span></label>';
      }).join('') + (done ? '<div class="why">' + esc(done) + '</div>' : '<button type="button" class="ap">Apply the ticked changes</button>') + '</div>';
    }
    function draw() {
      log.innerHTML = (turns.length ? '' : '<div class="vepg-m s">Tell me what needs to change on this page. You can type or use the mic.</div>') + turns.map(function (t, i) {
        if (t.role === 'user') return '<div class="vepg-m u">' + esc(t.text) + '</div>';
        return '<div class="vepg-m a">' + esc(t.text) + '</div>' + (t.changes && t.changes.length ? changeCard(t, i) : '');
      }).join('') + (busy ? '<div class="vepg-m s">Liz is reading the page...</div>' : '');
      log.scrollTop = log.scrollHeight;
    }
    log.addEventListener('click', function (e) {
      var b = e.target.closest('.ap'); if (!b) return;
      var box = b.closest('.vepg-ch'), t = turns[+box.dataset.i];
      var picked = [].filter.call(box.querySelectorAll('input[data-j]'), function (x) { return x.checked; }).map(function (x) { return t.changes[+x.dataset.j]; });
      if (!picked.length) return;
      b.disabled = true; b.textContent = 'Applying...';
      call({ action: 'apply', page_url: pageUrl(), changes: picked }).then(function (d) {
        if (d && (d.saved || []).length) {
          t.applied = 'Saved: ' + d.saved.join(', ') + '.' + ((d.failed || []).length ? ' Did not save: ' + d.failed.join(', ') + '.' : '') + ' Refresh the page to see it.';
        } else { b.disabled = false; b.textContent = 'Apply the ticked changes'; t.applied = ''; alert('That did not save' + (d && d.error ? ': ' + d.error : '') + '.'); return; }
        save(turns); draw();
      });
    });
    function call(body) {
      var tok = window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : '';
      return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { error: 'bad_response' }; }); }).catch(function () { return { error: 'offline' }; });
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (ta.value || '').trim(); if (!text || busy) return;
      turns.push({ role: 'user', text: text }); ta.value = ''; busy = true; go.disabled = true; save(turns); draw();
      var main = document.querySelector('main') || document.body, pageText = '';
      try { pageText = (main.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 6000); } catch (er) {}
      call({ action: 'chat', page_url: pageUrl(), page_label: document.title, page_text: pageText,
        messages: turns.map(function (t) { return { role: t.role, text: t.text }; }) }).then(function (d) {
        busy = false; go.disabled = false;
        if (!d || !d.ok) turns.push({ role: 'assistant', text: d && d.error === 'admins_only' ? 'This chat is for super admins. Use Send as feedback instead.' : 'I could not answer that just now (' + (d && d.error || 'error') + '). Try again in a moment.' });
        else turns.push({ role: 'assistant', text: d.reply, changes: d.changes || [] });
        save(turns); draw(); ta.focus();
      });
    });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) f.requestSubmit(); });
    draw(); setTimeout(function () { ta.focus(); }, 30);
  }
  window.VEPageGuide = { open: open };
})();
