/* ve-page-guide.js: the super admin's chat with the page's Guide (Sean, 2026-11-05, playbook ve-page-guide, phase 1).
 * "When I do that as a super admin, that is the equivalent of me speaking to you here."
 *
 *   VEPageGuide.open()   opened by the Feedback button (ve-feedback.js) for a signed-in super admin (not while viewing as someone else).
 *
 * Tell the Guide what is wrong on the page; it answers, asks when it is unsure, and lists the exact changes (what it is now, what it
 * becomes). Tick the ones you want and press Apply. Server: ve-page-guide (chat proposes, apply re-checks and saves, each change logged).
 * The conversation is kept for the visit per page and Guide (sessionStorage ve_pg_<guide>_<path>). "Send as feedback instead" opens the plain form.
 *
 * Step 2 (2026-11-05): the page's own Guide. VEPageGuide.open({guide}) talks as that Guide (liz, maya, river, nori, dani, theo, kai,
 * pascal); with no guide it reads the page: the Guide rail (#dgRail data-guide), the Resources tab's Guide, else Liz. For a super
 * admin this file also puts a "Talk to <Guide>" button on every Guide panel it finds, now and as tabs draw: the Guide rail on a
 * Guide page, the Partner Dashboard tour's narrator (.vgt-narr), and each Resources card (.gt-card). ve-feedback.js loads this file
 * for super admins. On a page that is not a listing the Guide answers and files Notes for Logan (Depot > Feedback).
 *
 * Step 3 (2026-11-06, Sean: "Go with your defaults"): the same "Talk to <Guide>" button for everyone, on the Guide panels only (the
 * Feedback button stays the plain form for anyone but a super admin). A member (a paid or survey account, VEAuth.isLoggedIn) asks the
 * page's Guide: saved answers first (ve-auth guide_ask, free), and when none fits, "Ask <Guide> directly · 4 points" (guide_chat_send,
 * the monthly allowance, told which page they are on) or "Ask a person" (guide_ask_person, free). No changes, no Apply. A visitor or an
 * unpaid account gets "Suggest a change" in the Guide's voice (one box and an optional email, sent to ve-feedback as kind suggestion),
 * with a note that members can ask the Guide. ve-feedback.js loads this file on any page with a Guide panel. */
(function () {
  if (window.VEPageGuide) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-page-guide';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pageUrl() { try { if (window.VEFeedback && VEFeedback.url) return VEFeedback.url(); } catch (e) {} return location.href; }
  var NAMES = { liz: 'Liz', maya: 'Maya', river: 'River', nori: 'Nori', dani: 'Dani', theo: 'Theo', kai: 'Kai', pascal: 'Pascal' };
  // The Resources tab's Guide per card (ve-guide-tab.js GUIDES).
  var GT = { 'vegan-dairy-guide': 'maya', 'vegan-restaurant-guide': 'liz', 'creator-guide': 'kai', 'nonprofit-guide': 'dani', 'nutrition-guide': 'theo',
    'supermarket-guide': 'pascal', 'vegan-events-guide': 'river', 'group-partner': 'dani', 'welcome': 'dani' };
  var G = 'liz';
  function slugOf(name) { var k = String(name || '').trim().toLowerCase(); return NAMES[k] ? k : null; }
  function detect() {
    var r = document.getElementById('dgRail'); if (r && slugOf(r.getAttribute('data-guide'))) return slugOf(r.getAttribute('data-guide'));
    var cards = document.querySelectorAll('.gt-card[data-gt]');
    for (var i = 0; i < cards.length; i++) if (cards[i].offsetParent && GT[cards[i].getAttribute('data-gt')]) return GT[cards[i].getAttribute('data-gt')];
    return 'liz';
  }
  function key() { return 've_pg_' + G + '_' + location.pathname; }
  function load() { try { return JSON.parse(sessionStorage.getItem(key()) || '[]'); } catch (e) { return []; } }
  function save(t) { try { sessionStorage.setItem(key(), JSON.stringify(t.slice(-30))); } catch (e) {} }
  function pic() { try { if (window.VEGuideArt) { var u = VEGuideArt(G, 'square'); if (u) return u; } } catch (e) {} return 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20261005_021226_51fc0dd1-aad1-45ee-ada3-f6cab13ed3a2_min.webp'; }
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
      '.vepg-f .go:disabled{opacity:.5;}.vepg .lnk{background:none;border:0;font:700 12.5px inherit;font-family:inherit;cursor:pointer;color:rgba(0,0,0,.6);text-decoration:underline;padding:0;}' +
      '.vepg-talk{display:inline-flex;align-items:center;gap:6px;background:#fff;color:var(--vb-accent,#1E7A3E);border:1.5px solid var(--vb-accent,#1E7A3E);border-radius:6px;padding:8px 12px;font:800 13px/1.1 Montserrat,system-ui,sans-serif;cursor:pointer;margin:8px 0 0;}' +
      '.vepg-talk:hover,.vepg-talk:focus-visible{background:var(--vb-accent,#1E7A3E);color:#fff;}#dgRail>.vepg-talk{align-self:flex-start;}' +
      '@media(max-width:560px){.vepg{width:100%;}}';
    document.head.appendChild(st);
  }
  function openAdmin(o) {
    var N = NAMES[G], isListing = /^\/(dashboard\/)?directory\/[a-z0-9-]+\/?$/i.test(location.pathname);
    var turns = load(), busy = false;
    var wrap = document.createElement('div'); wrap.className = 'vepg-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Talk to ' + N + ' about this page');
    wrap.innerHTML = '<div class="vepg"><div class="vepg-h"><img alt="" src="' + esc(pic()) + '"><div><b>Talk to ' + esc(N) + '</b><span>' + (isListing ? 'About this page. Tell me what is wrong or out of date; I show you the changes before anything saves.' : 'About this page. Tell me what to change; I write it up for Logan and show you before it goes.') + '</span></div><button type="button" class="x" aria-label="Close">&times;</button></div>' +
      '<div class="vepg-log" aria-live="polite"></div>' +
      '<form class="vepg-f" novalidate><textarea name="t" placeholder="' + (isListing ? 'For example: Samuel goes by Chef Sam. Use chefsam@therabbithole.life; the Gmail is old.' : 'For example: the Money tab should say what a booth usually costs.') + '"></textarea>' +
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
      }).join('') + (busy ? '<div class="vepg-m s">' + esc(N) + ' is reading the page...</div>' : '');
      log.scrollTop = log.scrollHeight;
    }
    log.addEventListener('click', function (e) {
      var b = e.target.closest('.ap'); if (!b) return;
      var box = b.closest('.vepg-ch'), t = turns[+box.dataset.i];
      var picked = [].filter.call(box.querySelectorAll('input[data-j]'), function (x) { return x.checked; }).map(function (x) { return t.changes[+x.dataset.j]; });
      if (!picked.length) return;
      b.disabled = true; b.textContent = 'Applying...';
      call({ action: 'apply', page_url: pageUrl(), page_label: document.title, guide: G, changes: picked }).then(function (d) {
        if (d && (d.saved || []).length) {
          var onlyNotes = d.saved.every(function (x) { return x === 'Note for Logan'; });
          t.applied = 'Saved: ' + d.saved.join(', ') + '.' + ((d.failed || []).length ? ' Did not save: ' + d.failed.join(', ') + '.' : '') + (onlyNotes ? ' Logan has it in Depot > Feedback.' : ' Refresh the page to see it.');
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
      var main = document.querySelector('#dgApp') || document.querySelector('main') || document.body, pageText = '';
      try { pageText = (main.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 6000); } catch (er) {}
      call({ action: 'chat', page_url: pageUrl(), page_label: document.title, page_text: pageText, guide: G,
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
  function isAdmin() { try { var m = window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn() && VEAuth.getMember && VEAuth.getMember(); return !!(m && m.is_superadmin); } catch (e) { return false; } }
  function isMember() { try { return !!(window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn()); } catch (e) { return false; } }
  function open(o) {
    o = o || {}; G = slugOf(o.guide) || detect(); css();
    if (isAdmin()) return openAdmin(o);
    if (isMember()) return openMember(o);
    return openVisitor(o);
  }
  // The panel every mode shares: the Guide's picture, a line, the log and the box.
  function shell(sub, ph, foot, sendLabel) {
    var N = NAMES[G];
    var wrap = document.createElement('div'); wrap.className = 'vepg-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Talk to ' + N);
    wrap.innerHTML = '<div class="vepg"><div class="vepg-h"><img alt="" src="' + esc(pic()) + '"><div><b>Talk to ' + esc(N) + '</b><span>' + sub + '</span></div><button type="button" class="x" aria-label="Close">&times;</button></div>' +
      '<div class="vepg-log" aria-live="polite"></div><form class="vepg-f" novalidate><textarea name="t" placeholder="' + esc(ph) + '"></textarea>' + (foot.top || '') +
      '<div class="row"><span>' + (foot.links || '') + '</span><button type="submit" class="go">' + esc(sendLabel || 'Send') + '</button></div></form></div>';
    document.body.appendChild(wrap);
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('.x')) close(); });
    return { wrap: wrap, log: wrap.querySelector('.vepg-log'), f: wrap.querySelector('form'), close: close };
  }
  var AUTH = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-auth?action=';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  function auth(action, body) {
    body.token = window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : '';
    return fetch(AUTH + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d._status = r.status; return d; }); }).catch(function () { return { error: 'offline' }; });
  }
  function shareUrl() { var u = pageUrl(); return /^https:\/\//.test(u) ? u : location.origin + location.pathname; }
  // A member: saved answers first, free; then the Guide (4 points) or a person (free). The conversation is kept for the visit.
  function openMember() {
    var N = NAMES[G], k = 've_pgm_' + G + '_' + location.pathname, turns, busy = false, conv;
    try { turns = JSON.parse(sessionStorage.getItem(k) || '[]'); conv = sessionStorage.getItem(k + '_c'); } catch (e) { turns = []; }
    function newConv() { conv = Math.random().toString(36).slice(2, 10).replace(/[^a-z0-9]/g, 'a'); try { sessionStorage.setItem(k + '_c', conv); } catch (e) {} }
    if (!conv || !/^[a-z0-9]{4,16}$/.test(conv)) newConv();
    function keep() { try { sessionStorage.setItem(k, JSON.stringify(turns.slice(-30))); } catch (e) {} }
    var S = shell('Ask me about this page. Saved answers are free; asking me directly is 4 points.', 'For example: what should I bring to my first potluck?',
      { links: '<button type="button" class="lnk" data-new>Start over</button>' }, 'Ask');
    var log = S.log, f = S.f, ta = f.t, go = f.querySelector('.go');
    function offer(q) { return '<div class="vepg-ch vepg-offer" data-q="' + esc(q) + '"><button type="button" class="ap" data-direct>Ask ' + esc(N) + ' directly &middot; 4 points</button> <button type="button" class="lnk" data-person>Ask a person, free</button></div>'; }
    function draw() {
      log.innerHTML = (turns.length ? '' : '<div class="vepg-m s">Ask ' + esc(N) + ' anything about this page or being Vegan here.</div>') + turns.map(function (t) {
        if (t.role === 'user') return '<div class="vepg-m u">' + esc(t.text) + '</div>';
        if (t.role === 'note') return '<div class="vepg-m s">' + t.html + '</div>';
        var link = t.link_url ? '<br><a href="' + esc(t.link_url) + '" style="font-weight:800;color:var(--vb-accent,#1E7A3E)">' + esc(t.link_label || 'Open it') + '</a>' : '';
        var rel = (t.related || []).length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + t.related.map(function (r) { return '<button type="button" class="vepg-talk" style="margin:0" data-rel="' + esc(r.question) + '">' + esc(r.question) + '</button>'; }).join('') + '</div>' : '';
        return (t.text ? '<div class="vepg-m a">' + esc(t.text) + link + '</div>' : '') + rel + (t.offer && !t.used ? offer(t.offer) : '');
      }).join('') + (busy ? '<div class="vepg-m s">' + esc(N) + ' is thinking...</div>' : '');
      log.scrollTop = log.scrollHeight;
    }
    function ask(text) {
      if (!text || busy) return;
      turns.push({ role: 'user', text: text }); busy = true; go.disabled = true; keep(); draw();
      auth('guide_ask', { message: text, agent_slug: G, page_url: shareUrl() }).then(function (d) {
        busy = false; go.disabled = false;
        if (d && d.answer) turns.push({ role: 'assistant', text: d.answer.answer, link_url: d.answer.link_url, link_label: d.answer.link_label, related: d.related, offer: text, kb: 1 });
        else turns.push({ role: 'assistant', text: d && d.error ? 'I could not look that up just now. Try again in a moment.' : 'I do not have a saved answer for that yet.', related: d && d.related, offer: text });
        keep(); draw(); ta.focus();
      });
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); var t = (ta.value || '').trim(); ta.value = ''; ask(t); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
    S.wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-new]')) { turns = []; newConv(); keep(); draw(); return; }
      var rel = e.target.closest('[data-rel]'); if (rel) { ask(rel.getAttribute('data-rel')); return; }
      var box = e.target.closest('.vepg-offer'); if (!box || busy) return;
      var q = box.getAttribute('data-q'), src = null;
      for (var i = turns.length - 1; i >= 0; i--) if (turns[i].offer === q && !turns[i].used) { src = turns[i]; break; }
      if (e.target.closest('[data-direct]')) {
        if (src) src.used = 1; busy = true; go.disabled = true; keep(); draw();
        auth('guide_chat_send', { agent_slug: G, message: q, conversation: conv, page_url: shareUrl(), page_label: document.title }).then(function (d) {
          busy = false; go.disabled = false;
          if (d && d.reply) {
            turns.push({ role: 'assistant', text: d.reply });
            if (d.balance != null) turns.push({ role: 'note', html: esc(d.balance) + ' points left.' + (d.memory && d.memory.used >= 16 ? ' ' + esc(N) + ' remembers the last 20 messages. <button type="button" class="lnk" data-new>Start a new conversation</button>' : '') });
          } else if (d && d.error === 'insufficient_points') {
            if (src) src.used = 0;
            turns.push({ role: 'note', html: 'You have ' + esc(d.balance || 0) + ' points, and asking directly is 4. Earn more with <a href="/bounties">Bounties</a>, or ask a person for free.' });
          } else { if (src) src.used = 0; turns.push({ role: 'note', html: esc(N) + ' could not answer just now. No points were taken. Try again in a moment.' }); }
          keep(); draw();
        });
      }
      if (e.target.closest('[data-person]')) {
        if (src) src.used = 1; busy = true; keep(); draw();
        auth('guide_ask_person', { message: q, agent_slug: G, page_url: shareUrl() }).then(function (d) {
          busy = false;
          if (d && d.ok) turns.push({ role: 'note', html: 'Sent to our team. They reply to your email.' });
          else { if (src) src.used = 0; turns.push({ role: 'note', html: d && d.error === 'daily_limit' ? 'You have sent five today. The team has them.' : 'That did not send. Try again in a moment.' }); }
          keep(); draw();
        });
      }
    });
    draw(); setTimeout(function () { ta.focus(); }, 30);
  }
  // A visitor, or an account that has not joined yet: a suggestion in the Guide's voice, sent to the team (ve-feedback, kind suggestion).
  function openVisitor() {
    var N = NAMES[G];
    var S = shell('I can pass a change to the team. What should be different on this page?', 'For example: the hours on this page are out of date.',
      { top: '<input name="em" type="email" autocomplete="email" placeholder="Your email, if you would like a reply (optional)" style="display:block;width:100%;box-sizing:border-box;margin-top:8px;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:9px 12px;font:500 14px/1.4 inherit;font-family:inherit;">' }, 'Send to the team');
    var log = S.log, f = S.f, ta = f.t, go = f.querySelector('.go');
    var join = '<div class="vepg-m s" style="text-align:left;align-self:stretch;background:#f1f6f2;border-radius:10px;padding:10px 12px;color:#14261a">Members can ask ' + esc(N) + ' questions here too. ' +
      'Join free with a short survey, or with the $11 Passport. <a href="/passport#/join" style="font-weight:800;color:var(--vb-accent,#1E7A3E)">See how to join</a></div>';
    log.innerHTML = '<div class="vepg-m a">Hi, I am ' + esc(N) + '. Spotted something wrong, missing or out of date? Tell me and I will make sure the team sees it.</div>' + join;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = (ta.value || '').trim(), em = (f.em.value || '').trim();
      var bad = msg.length < 5 ? 'A few words about it, please.' : em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) ? 'That email does not look right.' : '';
      var old = log.querySelector('.vepg-err'); if (old) old.remove();
      if (bad) { log.insertAdjacentHTML('beforeend', '<div class="vepg-m s vepg-err" style="color:#8a1c12">' + bad + '</div>'); return; }
      go.disabled = true; go.textContent = 'Sending...';
      var vid = ''; try { vid = localStorage.getItem('ve_visitor') || ''; } catch (er) {}
      fetch('https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_url: shareUrl(), page_label: (document.title || '').replace(/\s*[—|-]\s*Vegans Explore\s*$/i, '').slice(0, 80), kind: 'suggestion', message: msg, email: em,
          name: 'A visitor (via ' + N + ')', visitor: vid, signed_in: false, viewport: innerWidth + 'x' + innerHeight }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok || !x.d.ok) { go.disabled = false; go.textContent = 'Send to the team'; log.insertAdjacentHTML('beforeend', '<div class="vepg-m s vepg-err" style="color:#8a1c12">' + (x.d && x.d.error === 'daily_limit' ? 'You have sent a few already. Thank you, we have them.' : 'That did not go through. Try again in a moment.') + '</div>'); return; }
          f.remove();
          log.innerHTML = '<div class="vepg-m u">' + esc(msg) + '</div><div class="vepg-m a">Thank you. The team has it' + (em ? ', and if they need more they will write to ' + esc(em) : '') + '.</div>' + join;
        })
        .catch(function () { go.disabled = false; go.textContent = 'Send to the team'; });
    });
    setTimeout(function () { ta.focus(); }, 30);
  }
  // "Talk to <Guide>" on every Guide panel, for everyone (step 3; super admins only in step 2).
  function talkBtn(g) { return '<button type="button" class="vepg-talk" data-vepg-talk="' + g + '">Talk to ' + esc(NAMES[g]) + '</button>'; }
  function attach() {
    css();
    var rail = document.getElementById('dgRail');
    if (rail && !rail.querySelector('[data-vepg-talk]')) {
      var g = slugOf(rail.getAttribute('data-guide')) || 'liz', after = document.getElementById('dgPlay') || document.getElementById('dgBubble');
      if (after && after.parentNode === rail) after.insertAdjacentHTML('afterend', talkBtn(g)); else rail.insertAdjacentHTML('beforeend', talkBtn(g));
    }
    [].forEach.call(document.querySelectorAll('.vgt-narr'), function (n) {
      if (n.querySelector('[data-vepg-talk]') || !n.querySelector('.vgt-name b')) return;
      var g = slugOf(n.querySelector('.vgt-name b').textContent) || 'liz';
      n.insertAdjacentHTML('beforeend', talkBtn(g));
    });
    [].forEach.call(document.querySelectorAll('.gt-card[data-gt]'), function (c) {
      var g = GT[c.getAttribute('data-gt')]; if (!g || c.querySelector('[data-vepg-talk]')) return;
      var go = c.querySelector('.gt-go'); if (go) go.insertAdjacentHTML('afterend', ' ' + talkBtn(g));
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-vepg-talk]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); open({ guide: b.getAttribute('data-vepg-talk') });
  }, true);
  var pend = null;
  try { new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = null; attach(); }, 300); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  attach();
  window.VEPageGuide = { open: open, attach: attach };
})();
