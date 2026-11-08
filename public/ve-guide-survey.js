/* A Guide's own survey (Sean, 2026-11-03: "they have to complete the survey that's tied to that guide").
 * VEGuideSurvey.mount(el, { survey: 'vegan-events-guide', onDone(res), onChange() }) draws one question per view (#q/<n>), Back / Question N of M / Next,
 * saving and paying each answer as it is given (ve-mission-survey survey_get / survey_answer, rows in ve_surveys and ve_survey_questions).
 * A new Guide's survey is rows, never code here.
 * Survey first, account last (Sean, 2026-11-07; playbook ve-mobile-app H): with no account, a survey that admits is answered on this device
 * (localStorage ve_survey_draft_<slug>), a points pill adds up in the top right, and the last step is Save your answers: making the account
 * (email or Google, the site's own window) sends every answer at once (survey_submit_all), which admits them. */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-mission-survey?action=';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var CSS = '.vgs{max-width:860px}.vgs-bar{height:6px;background:#e8f5e9;border-radius:6px;overflow:hidden;margin:0 0 18px}.vgs-bar i{display:block;height:100%;background:#22C55E}' +
    '.vgs-k{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#1f5f22;margin:0 0 6px}.vgs-q{font-size:clamp(20px,2.2vw,26px);font-weight:900;margin:0 0 6px;line-height:1.25}' +
    '.vgs-h{font-size:14px;color:rgba(26,26,26,.78);margin:0 0 16px;line-height:1.5}.vgs-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:10px;margin:0 0 18px}' +
    '.vgs-opt{min-height:48px;padding:12px 16px;text-align:left;background:#fff;border:1.5px solid rgba(0,0,0,.16);border-radius:6px;font:700 14px Montserrat,sans-serif;color:#1a1a1a;cursor:pointer}' +
    '.vgs-opt[aria-pressed="true"]{border-color:#1f5f22;background:#e8f5e9;color:#1f5f22}.vgs-in{width:100%;min-height:48px;padding:12px 14px;border:1.5px solid rgba(0,0,0,.16);border-radius:6px;font:500 15px Montserrat,sans-serif;margin:0 0 18px;box-sizing:border-box}' +
    'textarea.vgs-in{min-height:140px;resize:vertical}.vgs-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.vgs-c{font-size:12px;font-weight:800;color:#595959}' +
    '.vgs-b{min-height:44px;padding:12px 22px;border-radius:6px;border:0;background:#22C55E;color:#03170a;font:800 12px Montserrat,sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-block}' +
    '.vgs-badge{border:1.5px solid #1f5f22;background:#f4fbf4;border-radius:6px;padding:18px 20px;margin:0 0 18px}.vgs-badge b.n{display:inline-block;background:#1f5f22;color:#fff;border-radius:6px;padding:6px 12px;font-size:14px;font-weight:900;margin:0 0 10px}' +
    '.vgs-top{position:sticky;top:calc(var(--ve-nav-h,64px) + 8px);z-index:5;display:flex;justify-content:flex-end;margin:0 0 10px;pointer-events:none}.vgs-pill{background:#1f5f22;color:#fff;border-radius:6px;padding:7px 11px;font:900 12px Montserrat,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.15)}.vgs-pill.bump{transform:scale(1.08);transition:transform .2s}' +
    '.vgs-save{border:1.5px solid #1f5f22;border-radius:8px;padding:22px 20px;background:#f4fbf4;margin:0 0 18px}' +
    '.vgs-b.g{background:#fff;border:1.5px solid rgba(0,0,0,.2);color:#1a1a1a}.vgs-b[disabled]{opacity:.5;cursor:default}.vgs-err{color:#b42318;font-size:13px;font-weight:700;min-height:18px;margin:0 0 10px}.vgs-pts{font-size:12px;font-weight:800;background:#e8f5e9;color:#1f5f22;border-radius:6px;padding:4px 8px;display:inline-block;margin-left:8px}';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function tok() { try { return localStorage.getItem('ve_token'); } catch (e) { return null; } }
  function api(action, body) {
    return fetch(FN + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON }, body: JSON.stringify(Object.assign({ token: tok() }, body)) })
      .then(function (r) { return r.json().then(function (d) { d = d || {}; d._status = r.status; return d; }); });
  }
  // Words a member reads, approved by Sean 2026-11-06 (docs/proposals/membership-rule-wording-steps-3-9.md).
  // The business badge (canon-ve-business-badges; wording from docs/proposals/business-badges-intake.md, approved by Sean 2026-11-06).
  var BADGE = { vegan: '100% Vegan', plant_based: '100% Plant-based', pre_vegan: 'Pre-Vegan' };
  function badgeHtml(b) {
    if (!b || !b.claimed) return '';
    var line;
    if (b.claimed === 'vegan' && b.status === 'shown') line = 'Your badge is <b>100% Vegan</b>. You can change your answers any time.';
    else if (b.claimed === 'vegan') line = 'Your badge will be <b>100% Vegan</b>. Our team checks it before it shows. Until then your page shows 100% Plant-based. You can change your answers any time.';
    else if (b.status === 'follow_up') line = 'Your badge will be <b>100% Plant-based</b> for now. Our team will reach out to help you get to 100% Vegan. You can change your answers any time.';
    else if (b.claimed === 'plant_based') line = 'Your badge will be <b>100% Plant-based</b>. You can change your answers any time.';
    else line = 'Your badge will be <b>Pre-Vegan</b>: you offer plant-based options. Want some items certified? Tell us. You can change your answers any time.';
    return '<div class="vgs-badge"><b class="n">' + esc(BADGE[b.claimed]) + '</b><p class="vgs-h" style="margin:0">' + line + '</p></div>';
  }
  var BADGE_KEYS = ['biz_all_plant', 'biz_word', 'biz_beyond', 'biz_help'];
  var T = { filled: 'Filled in from what you told us before. Change it if it is different now.', list: 'You answered these before, so we filled them in:', change: 'Change' };
  function mount(el, opts) {
    if (!document.getElementById('vgs-css')) { var st = document.createElement('style'); st.id = 'vgs-css'; st.textContent = CSS; document.head.appendChild(st); }
    var S = null, A = {}, C = {}, n = 1, busy = false, anon = !tok();
    var DRAFT = 've_survey_draft_' + opts.survey;
    function keepDraft() { try { localStorage.setItem(DRAFT, JSON.stringify(A)); } catch (e) {} }
    function readDraft() { try { var d = JSON.parse(localStorage.getItem(DRAFT) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
    function earned() { return S.questions.reduce(function (t, q) { return t + (visible(q) && !empty(A[q.id]) ? (q.points || 0) : 0); }, 0); }
    function pill() { return S && S.total ? '<div class="vgs-top"><span class="vgs-pill" id="vgsPill" aria-live="polite">' + earned() + ' of ' + S.total + ' points</span></div>' : ''; }
    // Shared answers given in another intake (canon-ve-door-guides v6, shared_answers): filled in and skipped on the way through;
    // the server writes them into this intake with the next answer saved, and lists them at the end to change.
    function carried(q) { return q && Object.prototype.hasOwnProperty.call(C, q.id); }
    // A question with show_if appears only when the earlier answer it names is one of its values (canon-ve-business-badges: the badge questions).
    function byId(id) { for (var i = 0; i < S.questions.length; i++) if (S.questions[i].id === id) return S.questions[i]; return null; }
    function visible(q) {
      if (!q || !q.show_if) return true;
      var p = byId(q.show_if.q); if (!p || !visible(p)) return false;
      var v = A[p.id]; return v != null && (q.show_if['in'] || []).indexOf(v) >= 0;
    }
    function step(from, dir) { var Q = S.questions; for (var i = from + dir; i >= 0 && i < Q.length; i += dir) if (!carried(Q[i]) && visible(Q[i])) return i; return -1; }
    function shownList() { return S.questions.filter(visible); }
    function say(h, noPill) { el.innerHTML = '<div class="vgs">' + (noPill ? '' : pill()) + h + '</div>'; if (opts.onChange) opts.onChange(); }
    function fromHash() { var m = /^#q\/(\d+)/.exec(location.hash); return m ? parseInt(m[1], 10) : 1; }
    function draw() {
      var Q = S.questions, q = Q[n - 1];
      if (!q) return summary();
      var v = A[q.id], opts2 = '';
      if (q.kind === 'choice' || q.kind === 'multi') {
        opts2 = '<div class="vgs-opts" role="group">' + (q.options || []).map(function (o) {
          var on = q.kind === 'multi' ? (v || []).indexOf(o.v) >= 0 : v === o.v;
          return '<button type="button" class="vgs-opt" data-v="' + esc(o.v) + '" aria-pressed="' + on + '">' + esc(o.label) + '</button>'; }).join('') + '</div>';
      } else if (q.kind === 'long') opts2 = '<textarea class="vgs-in" maxlength="2000" aria-label="' + esc(q.prompt) + '">' + esc(v || '') + '</textarea>';
      else opts2 = '<input class="vgs-in" maxlength="200" aria-label="' + esc(q.prompt) + '" value="' + esc(v || '') + '">';
      var VQ = shownList(), at = Math.max(VQ.indexOf(q), 0) + 1;
      say('<div class="vgs-bar"><i style="width:' + Math.round(((at - 1) / VQ.length) * 100) + '%"></i></div><p class="vgs-k">' + esc(S.title) + '<span class="vgs-pts">' + q.points + ' points</span></p>' +
        '<h2 class="vgs-q">' + esc(q.prompt) + (q.required ? '' : ' (optional)') + '</h2>' + (q.help ? '<p class="vgs-h">' + esc(q.help) + '</p>' : '<p class="vgs-h"></p>') +
        (carried(q) || (q.shared && !empty(v)) ? '<p class="vgs-h"><b>' + esc(T.filled) + '</b></p>' : '') + opts2 +
        '<p class="vgs-err" id="vgsErr" role="alert"></p><div class="vgs-nav">' + (step(n - 1, -1) >= 0 ? '<a class="vgs-b g" href="#q/' + (step(n - 1, -1) + 1) + '">Back</a>' : '<span></span>') +
        '<span class="vgs-c">Question ' + at + ' of ' + VQ.length + '</span><button type="button" class="vgs-b" id="vgsNext">' + (step(n - 1, 1) < 0 ? 'Finish' : 'Next') + '</button></div>');
    }
    function summary() {
      var left = S.questions.filter(function (q) { return q.required && visible(q) && empty(A[q.id]); });
      if (S.completed) return finished();
      if (anon && !left.length) return saveView();
      say('<h2 class="vgs-q">Almost there</h2><p class="vgs-h">' + (left.length ? 'A few questions still need an answer.' : 'Every question is answered.') + '</p>' +
        (left.length ? left.map(function (q) { return '<p><a class="vgs-b g" href="#q/' + (S.questions.indexOf(q) + 1) + '">' + esc(q.prompt) + '</a></p>'; }).join('') : ''));
    }
    function badgeView(go) {
      var first = 0; S.questions.some(function (x, i) { if (x.shared === 'biz_all_plant') { first = i; return true; } return false; });
      say('<p class="vgs-k">' + esc(S.title) + '</p><h2 class="vgs-q">Your badge</h2>' + badgeHtml(S.badge) +
        '<div class="vgs-nav"><a class="vgs-b g" href="#q/' + (first + 1) + '">Change my answers</a><button type="button" class="vgs-b" id="vgsGo">Continue</button></div>');
      document.getElementById('vgsGo').onclick = go;
    }
    // The account step: every answer is on this device until now.
    function saveView(errMsg) {
      say('<p class="vgs-k">' + esc(S.title) + '</p><h2 class="vgs-q">Save your answers</h2><div class="vgs-save"><p class="vgs-h" style="margin:0 0 12px">You earned <b>' + earned() + ' points</b>. ' +
        'Make your free account to keep them' + (S.admits ? ': your membership opens the moment you save.' : '.') + ' Nothing is charged.</p>' +
        '<p style="margin:0"><button type="button" class="vgs-b" id="vgsSave">Save with Google or email</button></p>' +
        '<p class="vgs-h" style="margin:12px 0 0">Already have an account? <a href="#" id="vgsSignin" style="color:#1f5f22;font-weight:800">Sign in</a> and your answers save to it.</p></div>' +
        '<p class="vgs-err" role="alert">' + esc(errMsg || '') + '</p>');
      function open(mode) {
        if (!window.VEAuth) return;
        // A new account waits on the survey: the site's own window would offer the survey again, so this page finishes the join itself.
        window.VE_ACTIVATE_HANDLER = function () { submitAll(); };
        VEAuth.showAuthModal('Save your answers: make your free account.', submitAll, mode);
      }
      document.getElementById('vgsSave').onclick = function () { open('signup'); };
      document.getElementById('vgsSignin').onclick = function (e) { e.preventDefault(); open('login'); };
    }
    function submitAll() {
      if (!tok()) return;
      say('<p class="vgs-h">Saving your answers...</p>', true);
      api('survey_submit_all', { survey: S.slug, answers: A }).then(function (d) {
        if (d.error) { anon = true; return saveView(d.error === 'not_eligible' ? 'This account cannot take this survey. Try another account, or write to contact@lesaruss.com.' : 'That did not save. Try again.'); }
        anon = false; try { localStorage.removeItem(DRAFT); } catch (e) {} window.VE_ACTIVATE_HANDLER = null;
        if (d.badge) S.badge = d.badge;
        if (d.completed) { S.completed = true; return finished(d); }
        // Signed in to an account that already had other answers: carry on from where the server says.
        location.reload();
      }).catch(function () { saveView('That did not go through. Try again.'); });
    }
    function empty(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
    function sharedList() {
      var L = S.questions.filter(function (q) { return q.shared && !empty(A[q.id]); });
      if (!L.length) return '';
      return '<p class="vgs-h">' + esc(T.list) + '</p>' + L.map(function (q) { return '<p><a class="vgs-b g" href="#q/' + (S.questions.indexOf(q) + 1) + '">' + esc(T.change) + ': ' + esc(q.prompt) + '</a></p>'; }).join('');
    }
    // opts.doneHtml replaces the finish screen (the Explorer survey: a person reads it before it admits, membership_rule_v6).
    // The business badge shows only on a survey that asks the badge questions (a creator's survey never shows a restaurant's badge; Sean 2026-11-07).
    function asksBadge() { return S.questions.some(function (q) { return BADGE_KEYS.indexOf(q.shared) >= 0; }); }
    function finished(res) { say((typeof opts.doneHtml === 'function' ? opts.doneHtml(A) : opts.doneHtml) || ('<h2 class="vgs-q">You finished.</h2><p class="vgs-h">Thank you. Your answers are saved.</p>' + (asksBadge() ? badgeHtml(S.badge) : '') + sharedList())); if (opts.onDone) opts.onDone(res || {}); }
    function save() {
      var q = S.questions[n - 1], v = A[q.id], err = document.getElementById('vgsErr');
      if (q.required && empty(v)) { err.textContent = 'Pick or write an answer to go on.'; return; }
      if (q.kind === 'multi' && q.help && /up to three/i.test(q.help) && (v || []).length > 3) { err.textContent = 'Pick up to three.'; return; }
      if (anon) {
        keepDraft(); var nx0 = step(n - 1, 1);
        var p = document.getElementById('vgsPill'); if (p) { p.textContent = earned() + ' of ' + S.total + ' points'; p.classList.add('bump'); }
        if (nx0 >= 0) location.hash = '#q/' + (nx0 + 1); else summary();
        return;
      }
      if (busy) return; busy = true; var b = document.getElementById('vgsNext'); b.disabled = true;
      api('survey_answer', { survey: S.slug, id: q.id, value: empty(v) ? null : v }).then(function (d) {
        busy = false;
        if (d.error === 'under_review') { S.completed = true; return finished(d); }
        if (d.error) { b.disabled = false; err.textContent = d.error === 'not_eligible' ? 'This account cannot take this survey. Sign in again, or get your Passport.' : 'That did not save. Try again.'; return; }
        // The server wrote every carried answer into this intake with this save; they stay skipped on the way through and listed at the end.
        if (d.badge) S.badge = d.badge;
        var nx = step(n - 1, 1);
        var ahead = S.questions.slice(n).some(function (x) { return !carried(x) && visible(x) && empty(A[x.id]); });
        var go = function () { if (d.completed && (d.admitted || nx < 0 || !ahead)) { S.completed = true; return finished(d); } if (nx >= 0) location.hash = '#q/' + (nx + 1); else summary(); };
        // The owner sees their badge before it shows, with a way back to change it.
        if (d.badge_changed && d.badge && BADGE_KEYS.indexOf(q.shared) >= 0) return badgeView(go);
        go();
      }).catch(function () { busy = false; b.disabled = false; err.textContent = 'That did not go through. Try again.'; });
    }
    el.addEventListener('click', function (e) {
      var o = e.target.closest('.vgs-opt'); if (o && S) {
        var q = S.questions[n - 1], val = o.getAttribute('data-v');
        if (q.kind === 'multi') { var cur = (A[q.id] || []).slice(), i = cur.indexOf(val); if (i >= 0) cur.splice(i, 1); else cur.push(val); A[q.id] = cur; } else A[q.id] = val;
        draw(); return;
      }
      if (e.target.id === 'vgsNext') save();
    });
    el.addEventListener('input', function (e) { if (e.target.classList.contains('vgs-in') && S) A[S.questions[n - 1].id] = e.target.value; });
    window.addEventListener('hashchange', function () { if (S) { n = fromHash(); draw(); } });
    say('<p class="vgs-h">Loading the questions...</p>');
    api('survey_get', { survey: opts.survey }).then(function (d) {
      if (d.error || !d.survey) { say('<p class="vgs-h">We could not open this survey. Sign in and try again.</p>', true); return; }
      S = d.survey; A = S.answers || {}; C = S.carried || {}; if (opts.onLoaded) opts.onLoaded(S);
      if (anon) {
        if (!S.admits && opts.onNeedAccount) return opts.onNeedAccount(S);
        A = readDraft();
      }
      Object.keys(C).forEach(function (id) { A[id] = C[id].value; });
      if (S.completed) { if (opts.onAlreadyDone) { opts.onAlreadyDone(S); } return finished(); }
      // Resume at the first unanswered required question.
      if (!/^#q\//.test(location.hash)) {
        var first = -1; S.questions.some(function (q, i) { if (!carried(q) && visible(q) && q.required && empty(A[q.id])) { first = i; return true; } return false; });
        // Only carried answers are left: saving one writes them all in and finishes the intake.
        if (first < 0 && Object.keys(C).length && !S.questions.some(function (q) { return !carried(q) && visible(q) && q.required && empty(A[q.id]); })) { var cq = S.questions.filter(carried)[0]; n = S.questions.indexOf(cq) + 1; draw(); return save(); }
        if (first < 0) first = step(-1, 1);
        n = Math.max(first, 0) + 1; location.replace('#q/' + n);
      }
      else n = fromHash();
      draw();
    }).catch(function () { say('<p class="vgs-h">We could not reach the survey. Try again in a minute.</p>'); });
  }
  window.VEGuideSurvey = { mount: mount };
})();
