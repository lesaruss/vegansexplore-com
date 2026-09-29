// public/depot-outreach.js
// The heads-up to a piece's subject (Sean, 2026-09-29, the newsroom gold standard): every piece
// tells the business or person it is about. A Spotlight (a friendly local feature) sends the
// preview, the go-live time, a fact check and a photo request; they get no veto. A News piece
// (anything the subject may not welcome) sends only a request for comment, never the draft.
// Sending is Sean's go: it also schedules the piece (5pm local unless he set a time), and the
// Depot publishes it on its own at that time.
//
//   Any button with data-outreach="<ve_pulse_content id>" (and data-outreach-title) opens it.
//   The page may set window.veDepotReload to refresh after a change. Needs /public/ve-auth.js.
// Engine: ve-news-desk outreach_get / outreach_save / outreach_send / outreach_mark / piece_schedule.
(function () {
  if (window.VEDepotOutreach) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-news-desk';
  var dlg, pid, title, state = null, busy = false;

  function tok() { return window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : ''; }
  function api(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function $(id) { return dlg.querySelector('#' + id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // A datetime-local value (the viewer's own clock) for an ISO time, and back.
  function toLocal(iso) { if (!iso) return ''; var d = new Date(iso), p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function fromLocal(v) { var d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); }
  function nice(iso) { return iso ? new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : ''; }

  var st = document.createElement('style');
  st.textContent =
    'dialog.ve-ou{border:0;border-radius:14px;padding:0;width:min(780px,calc(100% - 32px));max-height:calc(var(--ve-view-h,100vh) - 48px);overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:Montserrat,system-ui,sans-serif;color:#1a1a1a;}' +
    'dialog.ve-ou::backdrop{background:rgba(10,20,12,.7);}' +
    '.ve-ou-in{padding:20px 22px;}' +
    '.ve-ou h2{font-size:17px;font-weight:900;margin:0 0 4px;}' +
    '.ve-ou .lead{font-size:13px;line-height:1.55;color:rgba(26,26,26,.75);margin:0 0 12px;}' +
    '.ve-ou .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}' +
    '@media (max-width:600px){.ve-ou .row{grid-template-columns:1fr;}dialog.ve-ou{width:100%;max-width:100%;margin:0;border-radius:0;max-height:100%;height:100%;}}' +
    '.ve-ou label{display:block;font-size:12.5px;font-weight:800;margin:10px 0 5px;}' +
    '.ve-ou input,.ve-ou select,.ve-ou textarea{box-sizing:border-box;width:100%;font:inherit;font-size:14px;padding:10px 12px;min-height:44px;border:1px solid rgba(0,0,0,.28);border-radius:8px;background:#fff;}' +
    '.ve-ou textarea{line-height:1.55;min-height:260px;}' +
    '.ve-ou .hint{font-size:12px;color:rgba(26,26,26,.7);margin:4px 0 0;line-height:1.5;}' +
    '.ve-ou .status{font-size:13px;font-weight:700;padding:9px 12px;border-radius:8px;background:#eef2ee;margin:0 0 10px;}' +
    '.ve-ou .status.sent{background:#e6f4e7;color:#1f5f2a;}.ve-ou .status.failed{background:#fdecec;color:#8a1c1c;}.ve-ou .status.news{background:#fff4e5;color:#5c3a00;}' +
    '.ve-ou-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;margin-top:16px;}' +
    '.ve-ou-foot button{font:inherit;font-size:13.5px;font-weight:800;padding:10px 16px;min-height:44px;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:#fff;cursor:pointer;}' +
    '.ve-ou-foot .go{background:#1f5f2a;color:#fff;border-color:#1f5f2a;}' +
    '.ve-ou-foot button[disabled]{opacity:.5;cursor:not-allowed;}' +
    '.ve-ou-msg{flex:1 1 220px;font-size:13px;color:#8a1c1c;min-height:1em;}.ve-ou-msg.ok{color:#1f5f2a;}' +
    '.ve-ou a{color:#1f5f2a;font-weight:700;}' +
    '[data-ou-sent][hidden],[data-ou-draft][hidden]{display:none;}';
  document.head.appendChild(st);

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 've-ou';
    dlg.setAttribute('aria-labelledby', 've-ou-h');
    dlg.innerHTML =
      '<div class="ve-ou-in">' +
      '<h2 id="ve-ou-h">Heads-up</h2>' +
      '<p class="lead">Every piece tells who it is about, the way newsrooms do: a Spotlight gets the preview, the go-live time, a fact check and a photo request (they cannot hold it back). A News piece gets only a request for comment, never the draft. Sending schedules the piece to go live on its own.</p>' +
      '<p class="status" id="ve-ou-status" role="status"></p>' +
      '<div class="row">' +
      '<div><label for="ve-ou-track">Kind of piece</label><select id="ve-ou-track"><option value="spotlight">Spotlight (a friendly local feature)</option><option value="news">News (they may not welcome it)</option></select></div>' +
      '<div><label for="ve-ou-when">Goes live (your time)</label><input type="datetime-local" id="ve-ou-when"><p class="hint" id="ve-ou-whenhint"></p></div>' +
      '</div>' +
      '<div data-ou-draft>' +
      '<div class="row">' +
      '<div><label for="ve-ou-name">Their name (optional)</label><input type="text" id="ve-ou-name" maxlength="120" placeholder="The owner or manager"></div>' +
      '<div><label for="ve-ou-email">Their email</label><input type="email" id="ve-ou-email" placeholder="owner@their-business.com"></div>' +
      '</div>' +
      '<p class="hint" id="ve-ou-where"></p>' +
      '<label for="ve-ou-subject">Subject</label><input type="text" id="ve-ou-subject" maxlength="160">' +
      '<label for="ve-ou-body">The email</label><textarea id="ve-ou-body"></textarea>' +
      '<p class="hint">{{preview_link}} becomes a private two-week preview link, and {{go_live}} the go-live time, when it is sent. Replies come to hello@vegansexplore.com and contact@lesaruss.com.</p>' +
      '</div>' +
      '<div data-ou-sent hidden><label for="ve-ou-sentbody">What we sent</label><textarea id="ve-ou-sentbody" readonly></textarea>' +
      '<label for="ve-ou-reply">Their reply, in a line (optional)</label><input type="text" id="ve-ou-reply" maxlength="1000" placeholder="Sent two photos, hours are 11 to 9"></div>' +
      '<div id="ve-ou-updbox" hidden><label for="ve-ou-upd">Updated line on the live article (optional)</label><input type="text" id="ve-ou-upd" maxlength="300" placeholder="Added photos from the owner and corrected the hours.">' +
      '<p class="hint">Shows under the date, the way newsrooms mark a change. Leave it empty to remove it.</p></div>' +
      '<div class="ve-ou-foot"><span class="ve-ou-msg" id="ve-ou-msg" role="status"></span>' +
      '<button type="button" data-ou-close>Close</button>' +
      '<button type="button" id="ve-ou-skip" data-ou-draft>Skip (no way to reach them)</button>' +
      '<button type="button" id="ve-ou-save" data-ou-draft>Save</button>' +
      '<button type="button" id="ve-ou-replied" data-ou-sent hidden>They replied</button>' +
      '<button type="button" id="ve-ou-updsave" hidden>Save the Updated line</button>' +
      '<button type="button" class="go" id="ve-ou-send" data-ou-draft>Send and schedule</button>' +
      '</div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('[data-ou-close]').addEventListener('click', function () { dlg.close(); });
    $('ve-ou-track').addEventListener('change', function () { changeTrack(this.value); });
    $('ve-ou-when').addEventListener('change', function () { saveWhen(); });
    $('ve-ou-save').addEventListener('click', function () { save(false); });
    $('ve-ou-send').addEventListener('click', send);
    $('ve-ou-skip').addEventListener('click', function () { mark('skipped'); });
    $('ve-ou-replied').addEventListener('click', function () { mark('replied'); });
    $('ve-ou-updsave').addEventListener('click', function () {
      api({ action: 'piece_update_note', pulse_id: pid, note: $('ve-ou-upd').value.trim() }).then(function (d) {
        if (!d || !d.ok) return fail(d);
        say(d.piece.updated_note ? 'The Updated line is on the article.' : 'Updated line removed.', true);
      });
    });
    dlg.addEventListener('close', function () { if (window.veDepotReload) window.veDepotReload(); });
  }

  function say(m, ok) { var e = $('ve-ou-msg'); e.textContent = m || ''; e.className = 've-ou-msg' + (ok ? ' ok' : ''); }
  var ERR = {
    no_email: 'Add their email first.', bad_email: 'That email does not look right.', empty: 'The subject and the email cannot be empty.',
    news_no_preview: 'A News piece never sends the draft. Take out the preview link.', already_sent: 'This heads-up was already sent.',
    not_a_draft: 'This piece is already live, so its time cannot change.', bad_time: 'Pick a date and time.', brand_not_ready: 'Sending is set up for Vegans Explore only for now.',
    not_configured: 'Email is not connected on the server.', send_failed: 'The email did not go. Try again in a moment.'
  };
  function fail(d) { busy = false; say((d && (ERR[d.error] || (d.message ? 'It did not go: ' + d.message : ''))) || 'That did not save. Try again.'); }

  function paint() {
    var o = state.outreach, sent = o.status === 'sent' || o.status === 'replied';
    $('ve-ou-h').textContent = 'Heads-up: ' + (title || 'this piece');
    $('ve-ou-track').value = state.track || 'spotlight';
    $('ve-ou-when').value = toLocal(state.publish_at);
    $('ve-ou-when').disabled = state.live;
    $('ve-ou-whenhint').textContent = state.live ? 'This piece is live.' : state.publish_at ? 'Goes live ' + nice(state.publish_at) + '.' : 'Not scheduled. Sending schedules it for ' + nice(state.suggested_publish_at) + ' unless you pick a time.';
    $('ve-ou-name').value = o.contact_name || '';
    $('ve-ou-email').value = o.contact_email || '';
    $('ve-ou-subject').value = o.subject || '';
    $('ve-ou-body').value = o.body || '';
    $('ve-ou-sentbody').value = o.body || '';
    $('ve-ou-reply').value = o.reply_note || '';
    $('ve-ou-upd').value = state.updated_note || '';
    $('ve-ou-where').innerHTML = o.contact_email ? (o.contact_source ? 'Found on their ' + esc(o.contact_source) + '.' : '') :
      'No email yet.' + (o.contact_url ? ' Look on <a href="' + esc(o.contact_url) + '" target="_blank" rel="noopener">' + (o.contact_channel === 'instagram' ? 'their Instagram' : 'their website') + '</a> (a contact or press page), or message them there.' : ' Check their website or social pages for a contact or press email.');
    var s = $('ve-ou-status'), when = o.sent_at ? new Date(o.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    s.className = 'status' + (o.status === 'sent' || o.status === 'replied' ? ' sent' : o.status === 'failed' ? ' failed' : state.track === 'news' ? ' news' : '');
    s.textContent = o.status === 'sent' ? 'Sent to ' + o.contact_email + ' on ' + when + '. Waiting on their reply.'
      : o.status === 'replied' ? 'They replied' + (o.reply_note ? ': ' + o.reply_note : '.')
      : o.status === 'failed' ? 'The last send did not go: ' + (o.error || 'unknown') + '. Fix it and send again.'
      : o.status === 'skipped' ? 'Skipped: no way to reach them. You can still send if you find an email.'
      : state.track === 'news' ? 'News: this asks for their comment by the go-live time. It never includes the draft.'
      : 'Not sent yet. Check the email, then Send and schedule.';
    dlg.querySelectorAll('[data-ou-draft]').forEach(function (e) { e.hidden = sent; });
    dlg.querySelectorAll('[data-ou-sent]').forEach(function (e) { e.hidden = !sent; });
    $('ve-ou-replied').hidden = o.status !== 'sent';
    $('ve-ou-track').disabled = sent || state.live;
    $('ve-ou-updbox').hidden = !state.live; $('ve-ou-updsave').hidden = !state.live;
  }

  function load() {
    say('Loading...', true);
    return api({ action: 'outreach_get', pulse_id: pid }).then(function (d) {
      if (!d || !d.ok) return fail(d);
      state = { outreach: d.outreach, track: d.track, publish_at: d.publish_at, suggested_publish_at: d.suggested_publish_at, updated_note: d.updated_note, live: !!state_live };
      say(''); paint();
    }, function () { say('Could not connect. Try again.'); });
  }
  var state_live = false;

  function fields() {
    return { contact_name: $('ve-ou-name').value.trim(), contact_email: $('ve-ou-email').value.trim(), subject: $('ve-ou-subject').value, body: $('ve-ou-body').value };
  }
  function save(quiet) {
    if (busy) return Promise.resolve(null);
    busy = true; if (!quiet) say('Saving...', true);
    return api(Object.assign({ action: 'outreach_save', pulse_id: pid }, fields())).then(function (d) {
      busy = false;
      if (!d || !d.ok) { fail(d); return null; }
      state.outreach = d.outreach; if (!quiet) { say('Saved.', true); paint(); }
      return d;
    }, function () { busy = false; say('Could not connect. Try again.'); return null; });
  }
  function saveWhen() {
    var v = $('ve-ou-when').value, iso = v ? fromLocal(v) : null;
    if (v && !iso) return say('Pick a date and time.');
    if (iso && new Date(iso).getTime() < Date.now()) return say('Pick a time in the future.');
    api({ action: 'piece_schedule', pulse_id: pid, publish_at: iso }).then(function (d) {
      if (!d || !d.ok) return fail(d);
      state.publish_at = d.piece.publish_at; paint(); say(iso ? 'Scheduled.' : 'Not scheduled.', true);
    });
  }
  function changeTrack(t) {
    var o = state.outreach;
    if (o.body && !confirm('Switch to ' + (t === 'news' ? 'News' : 'Spotlight') + '? The email is redrafted for it (your edits to the text are replaced).')) { $('ve-ou-track').value = state.track; return; }
    api({ action: 'piece_schedule', pulse_id: pid, track: t }).then(function (d) {
      if (!d || !d.ok) return fail(d);
      state.track = t;
      return api(Object.assign({ action: 'outreach_save', pulse_id: pid, redraft: true }, { contact_name: $('ve-ou-name').value.trim(), contact_email: $('ve-ou-email').value.trim() }));
    }).then(function (d) {
      if (!d) return;
      if (!d.ok) return fail(d);
      state.outreach = d.outreach; paint(); say(t === 'news' ? 'Now News: the email asks for comment only.' : 'Now a Spotlight.', true);
    });
  }
  function send() {
    var f = fields();
    if (!f.contact_email) return say('Add their email first.');
    if (state.track === 'news' && /\{\{preview_link\}\}|\?preview=/.test(f.body)) return say('A News piece never sends the draft. Take out the preview link.');
    var when = state.publish_at ? nice(state.publish_at) : nice(state.suggested_publish_at);
    if (!confirm('Send this to ' + f.contact_email + '?' + (state.live ? '' : '\n\nThe piece is then scheduled to go live ' + when + '.'))) return;
    save(true).then(function (d) {
      if (!d) return;
      busy = true; say('Sending...', true); $('ve-ou-send').disabled = true;
      return api({ action: 'outreach_send', pulse_id: pid }).then(function (r) {
        busy = false; $('ve-ou-send').disabled = false;
        if (!r || !r.ok) return fail(r);
        say('Sent.', true);
        return load();
      }, function () { busy = false; $('ve-ou-send').disabled = false; say('Could not connect. Try again.'); });
    });
  }
  function mark(status) {
    if (status === 'skipped' && !confirm('Skip the heads-up for this piece? It can still be scheduled and published.')) return;
    api({ action: 'outreach_mark', pulse_id: pid, status: status, reply_note: $('ve-ou-reply').value.trim() }).then(function (d) {
      if (!d || !d.ok) return fail(d);
      state.outreach = d.outreach; paint(); say(status === 'replied' ? 'Noted. Add their photo with Cover, and fix anything they flagged.' : 'Skipped.', true);
    });
  }

  function open(id, t, live) {
    if (!dlg) build();
    pid = id; title = t || ''; state_live = !!live; state = null; busy = false;
    $('ve-ou-h').textContent = 'Heads-up: ' + (title || 'this piece');
    dlg.showModal();
    load();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-outreach]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(b.getAttribute('data-outreach'), b.getAttribute('data-outreach-title') || '', b.hasAttribute('data-outreach-live'));
  }, true);

  window.VEDepotOutreach = { open: open };
})();
