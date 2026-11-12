/* ve-feedback.js: the Feedback button on every page (Sean, 2026-11-03: "a feedback button... the same way we have the share button... whatever page
 * they're pressing feedback on loads as the default, they can still choose what they want to give feedback on... select different options").
 *
 *   VEFeedback.open({ page, form })  (a super admin gets the page's Guide chat, ve-page-guide.js; form: true forces this form)  ·  any element with data-ve-feedback opens it  ·  VEFeedback.button(cls) returns the button's markup
 *
 * A short form: what is it about (a page list, defaulting to this page), what kind (broken, wrong, confusing, missing, idea, praise, other), what happened,
 * an optional email for a reply, and a voice message where the browser can record (2026-11-10). Sent to ve-feedback (a ve_feedback row and an email to the team). */
(function () {
  if (window.VEFeedback) return;
  function canRecord() { return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-feedback';
  var KINDS = [['suggestion', 'A change to this page'], ['broken', 'Something is broken'], ['wrong', 'Wrong or out of date'], ['confusing', 'Confusing'], ['missing', 'Something is missing'], ['idea', 'An idea'], ['praise', 'Working well'], ['other', 'Something else']];
  var PAGES = [['Home', '/'], ['Directory', '/directory'], ['Events', '/events'], ['Daily Pulse', '/pulse'], ['Media', '/media'], ['Guides', '/guides'], ['Communities', '/communities'],
    ['Passport / joining', '/passport'], ['Search', '/search'], ['My dashboard', '/dashboard'], ['My Saves', '/dashboard/saves']];
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('vefbStyle')) return;
    var st = document.createElement('style'); st.id = 'vefbStyle';
    st.textContent = '.vefb-wrap{position:fixed;inset:0;z-index:100001;background:rgba(10,20,14,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,system-ui,sans-serif;}' +
      '.vefb{background:#fff;color:#14261a;border-radius:14px;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px 26px 22px;box-shadow:0 20px 60px rgba(0,0,0,.25);}' +
      '.vefb h3{margin:0 0 6px;font-size:22px;font-weight:900;line-height:1.15;}.vefb p.lead{margin:0 0 16px;font-size:14px;line-height:1.55;color:rgba(0,0,0,.7);}' +
      '.vefb label,.vefb .lb{display:block;font-size:13px;font-weight:700;margin:0 0 12px;}.vefb input,.vefb textarea,.vefb select{display:block;width:100%;box-sizing:border-box;margin-top:5px;min-height:42px;border:1px solid rgba(0,0,0,.22);border-radius:6px;padding:9px 12px;font:inherit;font-weight:500;font-size:14px;background:#fff;color:#14261a;}' +
      '.vefb select{appearance:none;-webkit-appearance:none;padding-right:44px;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' fill=\'none\' stroke=\'%2314261a\' stroke-width=\'2\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;}' +
      '.vefb-voice{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:-2px 0 14px;}.vefb-voice button{font:inherit;font-size:12px;font-weight:800;border-radius:6px;padding:8px 14px;border:1px solid #2d7d31;background:#fff;color:#2d7d31;cursor:pointer;}.vefb-voice button.on{background:#b42318;border-color:#b42318;color:#fff;}.vefb-voice .vv-state{font-size:12.5px;color:rgba(0,0,0,.6);}.vefb-voice audio{height:36px;max-width:100%;}' +
      '.vefb textarea{min-height:96px;resize:vertical;}.vefb .url{font-size:12px;font-weight:500;color:rgba(0,0,0,.55);margin:-6px 0 12px;word-break:break-all;}' +
      '.vefb .kinds{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px;}.vefb .kinds button{border:1.5px solid rgba(0,0,0,.18);background:#fff;border-radius:6px;padding:8px 11px;font:700 12.5px/1.2 inherit;font-family:inherit;cursor:pointer;color:#14261a;}' +
      '.vefb .kinds button.on{background:var(--vb-accent,#1E7A3E);border-color:var(--vb-accent,#1E7A3E);color:#fff;}' +
      '.vefb .acts{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:6px;flex-wrap:wrap;}.vefb .go{background:var(--vb-accent,#1E7A3E);color:#fff;border:0;border-radius:6px;padding:12px 20px;font:800 14px/1 inherit;font-family:inherit;cursor:pointer;}' +
      '.vefb .no{background:none;border:0;font:700 13px inherit;font-family:inherit;cursor:pointer;color:rgba(0,0,0,.6);}.vefb .err{color:#B42318;font-size:13px;font-weight:700;margin:4px 0 0;min-height:1em;}' +
      '.vefb [hidden]{display:none !important;}.vefb .small{font-size:12px;color:rgba(0,0,0,.55);margin:0 0 12px;}@media(max-width:560px){.vefb{padding:22px 18px 18px;}}';
    document.head.appendChild(st);
  }
  function btnCss() {
    if (document.getElementById('vefbBtnStyle')) return;
    var st = document.createElement('style'); st.id = 'vefbBtnStyle';
    st.textContent = '.ve-feedback-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 13px;margin-right:6px;border-radius:6px;border:1.5px solid rgba(0,0,0,0.12);background:#fff;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;cursor:pointer;flex-shrink:0;}' +
      '.ve-feedback-btn:hover{border-color:var(--vb-go,#2d7d31);color:var(--vb-go,#2d7d31);}.ve-feedback-btn:focus-visible{outline:3px solid #22C55E;outline-offset:2px;}' +
      '.ve-feedback-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}' +
      '@media(max-width:1060px){.ve-feedback-btn{width:38px;padding:0;font-size:0;gap:0;}}@media(max-width:380px){.ve-feedback-btn{width:36px;height:36px;margin-right:4px;}}';
    document.head.appendChild(st);
  }
  function me() { try { return JSON.parse(localStorage.getItem('ve_member') || 'null'); } catch (e) { return null; } }
  function signedIn() { try { return !!(window.VEAuth && VEAuth.isLoggedIn && VEAuth.isLoggedIn()); } catch (e) { return false; } }
  function vid() { try { var v = localStorage.getItem('ve_visitor'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('ve_visitor', v); } return v; } catch (e) { return ''; } }
  // The page as anyone can open it: a dashboard address becomes its public page (VEShare.url), no tracking bits.
  function here() { try { if (window.VEShare && VEShare.url) return VEShare.url(); } catch (e) {} return location.origin + location.pathname + location.search; }
  function labelOf(u) { var p; try { p = new URL(u).pathname; } catch (e) { return u; } for (var i = 0; i < PAGES.length; i++) if (PAGES[i][1] === p) return PAGES[i][0]; return (document.title || p).replace(/\s*[—|-]\s*Vegans Explore\s*$/i, '').slice(0, 80); }
  function button(cls) { btnCss(); return '<button type="button" class="ve-feedback-btn' + (cls ? ' ' + cls : '') + '" data-ve-feedback aria-label="Send feedback" title="Send feedback">' + ICON + 'Feedback</button>'; }
  // A super admin (signed in as themselves, not viewing as someone else) talks to the page's Guide instead (ve-page-guide.js,
  // Sean 2026-11-05); its "Send as feedback instead" reopens this form with { form: true }.
  function isAdmin() { try { var m = signedIn() && VEAuth.getMember && VEAuth.getMember(); return !!(m && m.is_superadmin); } catch (e) { return false; } }
  function open(o) {
    o = o || {};
    if (!o.form && isAdmin()) {
      if (window.VEPageGuide) { VEPageGuide.open(); return; }
      loadGuide(function () { VEPageGuide.open(); }); return;
    }
    css();
    var m = signedIn() ? me() : null, kind = '';
    var cur = o.page || here(), curLabel = labelOf(cur);
    var opts = '<option value="__here">This page: ' + esc(curLabel) + '</option>' + PAGES.filter(function (p) { return location.origin + p[1] !== cur; })
      .map(function (p) { return '<option value="' + esc(location.origin + p[1]) + '">' + esc(p[0]) + '</option>'; }).join('') + '<option value="__other">Another page (I will say which)</option>';
    var wrap = document.createElement('div'); wrap.className = 'vefb-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="vefb"><h3>Tell us what you see</h3><p class="lead">Spotted something off, or have an idea? Tell us. We read every one, and the team sees it right away.</p>' +
      '<form novalidate><label>What is it about?<select name="page">' + opts + '</select></label><p class="url" data-url>' + esc(cur) + '</p>' +
      '<label data-other hidden>Which page, or where on the site?<input name="other" placeholder="For example: the Events filters"></label>' +
      '<div class="lb">What kind of feedback?</div><div class="kinds">' + KINDS.map(function (k) { return '<button type="button" data-k="' + k[0] + '">' + esc(k[1]) + '</button>'; }).join('') + '</div>' +
      '<label>What happened, or what would you like?<textarea name="message" placeholder="What did you do, what did you expect, what did you see instead?"></textarea></label>' +
      (canRecord() ? '<div class="vefb-voice"><span class="lb" style="margin:0">Or leave a voice message</span><button type="button" class="vv-rec">Record</button><span class="vv-state" aria-live="polite"></span></div>' : '') +
      '<label>Your email (optional, only if you want a reply)<input name="email" type="email" autocomplete="email" value="' + esc(m && m.email || '') + '"></label>' +
      '<p class="err" aria-live="polite"></p><div class="acts"><button type="button" class="no">Not now</button><button type="submit" class="go">Send feedback</button></div></form></div>';
    document.body.appendChild(wrap);
    var f = wrap.querySelector('form'), err = wrap.querySelector('.err'), urlEl = wrap.querySelector('[data-url]'), other = wrap.querySelector('[data-other]');
    function close() { wrap.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    function chosen() { var v = f.page.value; return v === '__here' ? cur : v === '__other' ? '' : v; }
    f.page.addEventListener('change', function () { var v = chosen(); urlEl.textContent = v; urlEl.hidden = !v; other.hidden = f.page.value !== '__other'; });
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('.no')) { close(); return; }
      var k = e.target.closest('[data-k]'); if (k) { kind = kind === k.dataset.k ? '' : k.dataset.k; wrap.querySelectorAll('[data-k]').forEach(function (b) { b.classList.toggle('on', b.dataset.k === kind); }); }
    });
    // Voice message (Sean, 2026-11-10): record up to two minutes, hear it back, send it with the feedback.
    var rec = null, chunks = [], blob = null, timer = null, vbox = wrap.querySelector('.vefb-voice');
    if (vbox) {
      var rb = vbox.querySelector('.vv-rec'), st = vbox.querySelector('.vv-state');
      var stopRec = function () { if (rec && rec.state === 'recording') rec.stop(); };
      rb.addEventListener('click', function () {
        if (rec && rec.state === 'recording') { stopRec(); return; }
        if (blob) { blob = null; var old = vbox.querySelector('audio'); if (old) old.remove(); rb.textContent = 'Record'; st.textContent = ''; return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          chunks = []; rec = new MediaRecorder(stream);
          rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
          rec.onstop = function () {
            clearInterval(timer); stream.getTracks().forEach(function (t) { t.stop(); });
            blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            rb.classList.remove('on'); rb.textContent = 'Remove'; st.textContent = 'Recorded. It goes with your feedback.';
            var au = document.createElement('audio'); au.controls = true; au.src = URL.createObjectURL(blob); vbox.appendChild(au);
          };
          rec.start(); var secs = 0; rb.classList.add('on'); rb.textContent = 'Stop'; st.textContent = 'Recording 0:00';
          timer = setInterval(function () { secs++; st.textContent = 'Recording ' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2); if (secs >= 120) stopRec(); }, 1000);
        }).catch(function () { st.textContent = 'The microphone is not available. You can type instead.'; });
      });
    }
    function voiceData() {
      if (!blob) return Promise.resolve(null);
      if (blob.size > 3000000) return Promise.reject(new Error('long'));
      return new Promise(function (ok, no) { var rd = new FileReader(); rd.onload = function () { ok(String(rd.result).split(',')[1] || ''); }; rd.onerror = no; rd.readAsDataURL(blob); });
    }
    setTimeout(function () { f.message.focus(); }, 30);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = (f.message.value || '').trim(), em = (f.email.value || '').trim(), pg = chosen(), lab = f.page.value === '__other' ? (f.other.value || '').trim() : labelOf(pg);
      if (f.page.value === '__other') { if (!lab) { err.textContent = 'Tell us which page, please.'; f.other.focus(); return; } pg = location.origin + '/'; }
      if (!kind) { err.textContent = 'Pick what kind of feedback it is.'; return; }
      if (msg.length < 5 && !blob) { err.textContent = 'A few words about it, or a voice message, please.'; f.message.focus(); return; }
      if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'That email does not look right.'; f.email.focus(); return; }
      err.textContent = ''; var go = f.querySelector('.go'); go.disabled = true; go.textContent = 'Sending...';
      voiceData().then(function (v64) { return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_url: pg, page_label: lab, kind: kind, message: msg, voice: v64 || undefined, voice_type: blob ? blob.type : undefined, email: em, name: m && m.name || '', visitor: vid(), signed_in: signedIn(), viewport: innerWidth + 'x' + innerHeight }) }); })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok || !x.d.ok) { go.disabled = false; go.textContent = 'Send feedback'; err.textContent = x.d.error === 'daily_limit' ? 'You have sent a few already. Thank you, we have them.' : x.d.error === 'voice_too_long' ? 'That voice message is too long. Keep it under two minutes.' : 'That did not go through. Try again in a moment.'; return; }
          wrap.querySelector('.vefb').innerHTML = '<h3>Thank you</h3><p class="lead">The team has it. ' + (em ? 'If we need more, we will write to ' + esc(em) + '.' : 'Every note like this makes the site better.') + '</p><div class="acts"><button type="button" class="go no" style="color:#fff">Close</button></div>';
        })
        .catch(function (e2) { go.disabled = false; go.textContent = 'Send feedback'; err.textContent = e2 && e2.message === 'long' ? 'That voice message is too long. Keep it under two minutes.' : 'That did not go through. Try again in a moment.'; });
    });
  }
  // The page-guide script, loaded once. For a super admin it also puts "Talk to <Guide>" on the page's Guide panels (step 2).
  var pgLoading = null;
  function loadGuide(cb) {
    if (window.VEPageGuide) { if (cb) cb(); return; }
    if (!pgLoading) { pgLoading = []; var sc = document.createElement('script'); sc.src = '/public/ve-page-guide.js?v=3'; sc.onload = function () { pgLoading.forEach(function (f) { f(); }); }; document.head.appendChild(sc); }
    if (cb) pgLoading.push(cb);
  }
  // Step 3 (2026-11-06): everyone gets "Talk to <Guide>" on a page's Guide panels, so the script loads on any page that has one,
  // now or once a tab draws one (the Guide rail, the tour's narrator, a Resources card). A super admin gets it on every page.
  var PANELS = '#dgRail,.vgt-narr,.gt-card[data-gt]';
  function panels() {
    if (window.VEPageGuide) return;
    if (isAdmin() || document.querySelector(PANELS)) { loadGuide(); return; }
    try { var ob = new MutationObserver(function () { if (document.querySelector(PANELS)) { ob.disconnect(); loadGuide(); } }); ob.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'complete') setTimeout(panels, 1200); else window.addEventListener('load', function () { setTimeout(panels, 1200); });
  btnCss();
  window.VEFeedback = { open: open, button: button, url: here };
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-ve-feedback]'); if (!a) return; e.preventDefault(); open(); });
})();
