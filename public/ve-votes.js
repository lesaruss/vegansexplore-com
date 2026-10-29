/* Directory votes (Sean, 2026-09-27): any signed-in member votes for a listing once every
 * 24 hours, counted from their last vote for it, and the vote sticks. Before this, the
 * + Vote buttons on /directory and the city hubs only bumped the number on screen.
 *
 *   Signed out            -> a small window first (Sean, 2026-10-26: "a prompt that explains why they're going to the
 *                            passport page"): voting is for Passport holders, Explore the Passport (/passport, the
 *                            Passport Guide, back= returns here), Sign in for members, Not now.
 *   Save, signed out      -> the same window for saving (VEVotes.savePrompt(), Sean 2026-10-26), from=save.
 *   Check in, signed out  -> the same window for check-ins (VEVotes.checkinPrompt(), Sean 2026-10-26), from=checkin.
 *   Give, signed out      -> the same window for giving points (VEVotes.givePrompt(), Sean 2026-10-26), from=give.
 *   Signed in, not paid   -> ve-votes answers payment_required and the "Founding Member,
 *                            $11 one time" box opens (VEAuth.showActivateModal).
 *   Member                -> ve-votes saves it (listing_daily_votes; the trigger keeps
 *                            listings.vote_count), and the button reads "Voted".
 *   Voting again too soon -> the same window: "You've voted for this one today", when the next vote opens (tomorrow
 *                            at 9:14 PM EDT, in the visitor's own time zone), and Got it.
 *   Checking in again     -> the same window: "You've checked in here today" (VEVotes.checkedInPrompt(), Sean 2026-10-26).
 *                            A check-in day runs on Eastern time (ve_checkin_save), so the next one opens at midnight
 *                            Eastern, shown in the visitor's own time zone.
 *
 *   VEVotes.wire(root)  binds every .vote-btn[data-listing-id] under root (safe to call
 *                       again after re-rendering) and marks the ones voted in the last 24 hours.
 *   The count shown is the .vote-count in the same .rank-card (or .rank-right).
 *   VEVotes.cast(id), VEVotes.today(), VEVotes.tooSoon(nextIso), VEVotes.nextText(nextIso),
 *   VEVotes.passportPrompt(), VEVotes.savePrompt(), VEVotes.checkinPrompt(), VEVotes.givePrompt(),
 *   VEVotes.votedPrompt(nextIso) and VEVotes.checkedInPrompt() are what the listing page uses.
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-votes';
  var recent = null; // Promise of { listingId: nextVoteIso } for the signed-in member, fetched once

  function call(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + VEAuth.getToken() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.error === 'payment_required' && VEAuth.showActivateModal) VEAuth.showActivateModal(d.message);
        return d;
      });
  }
  function cast(id) { return call({ action: 'vote', listing_id: id }); }
  function listToday() { return call({ action: 'today' }); }
  function votedRecently() {
    if (!window.VEAuth || !VEAuth.isLoggedIn()) return Promise.resolve({});
    if (!recent) recent = listToday().then(function (d) { return (d && d.next) || {}; })
      .catch(function () { recent = null; return {}; });
    return recent;
  }

  // "later today at 9:14 PM EDT" or "tomorrow at 9:14 PM EDT", in the visitor's time zone,
  // falling back to Eastern if the browser will not say which zone it is in.
  function zone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch (e) { return 'America/New_York'; } }
  function nextText(iso) {
    var t = new Date(iso); if (isNaN(t)) return 'tomorrow';
    var tz = zone(), day = function (d) { return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d); };
    var at;
    try { at = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz, timeZoneName: 'short' }); }
    catch (e) { at = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' }); }
    return (day(t) === day(new Date()) ? 'later today at ' : 'tomorrow at ') + at;
  }
  function tooSoon(iso) { return !!iso && new Date(iso).getTime() > Date.now(); }
  function onceMessage(iso) { return "You're only allowed to vote once a day for each business. Please try again " + nextText(iso) + '.'; }

  // A small note that floats at the bottom of the screen for a few seconds.
  var noteEl = null, noteTimer = null;
  function notice(text) {
    if (!noteEl) {
      var st = document.createElement('style');
      st.textContent = '#ve-vote-note{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9998;max-width:min(460px,calc(100% - 32px));background:#1a1a1a;color:#fff;font-family:Montserrat,sans-serif;font-size:13.5px;font-weight:600;line-height:1.45;padding:14px 18px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.3);opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}#ve-vote-note.on{opacity:1}';
      document.head.appendChild(st);
      noteEl = document.createElement('div'); noteEl.id = 've-vote-note'; noteEl.setAttribute('role', 'status'); noteEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(noteEl);
    }
    noteEl.textContent = text; noteEl.classList.add('on');
    clearTimeout(noteTimer); noteTimer = setTimeout(function () { noteEl.classList.remove('on'); }, 6000);
  }

  // The vote window: the same look as the $11 window in ve-auth.js (white card, 12px corners, green button with dark
  // text, 6px buttons). One window, filled per use; Esc, the backdrop and Not now close it, and focus returns to the
  // button that opened it.
  var modalEl = null, lastFocus = null;
  var ICON = {
    heart: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><polyline points="9 10 11.5 12.5 15.5 8.5"/>',
    chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>',
    ticket: '<path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a3 3 0 000 6v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a3 3 0 000-6z"/><path d="M14 5v2M14 11v2M14 17v2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5"/>'
  };
  function buildModal() {
    var st = document.createElement('style');
    st.textContent =
      '#ve-vote-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:20px;font-family:Montserrat,sans-serif}' +
      '#ve-vote-modal.on{display:flex}' +
      '#ve-vm-box{background:#fff;border-radius:12px;padding:34px 30px 24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25);position:relative;text-align:center;animation:veVmIn .18s ease-out}' +
      '@keyframes veVmIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '@media(prefers-reduced-motion:reduce){#ve-vm-box{animation:none}}' +
      '#ve-vm-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;background:none;border-radius:6px;cursor:pointer;color:#555;font-size:22px;line-height:1}' +
      '#ve-vm-x:hover{background:#f3f3f3;color:#1a1a1a}' +
      '#ve-vm-ico{width:52px;height:52px;border-radius:50%;background:#e8f5e9;color:#2d7d31;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}' +
      '#ve-vm-eye{font-size:10px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#2d7d31;margin:0 0 8px}' +
      '#ve-vm-title{margin:0 0 8px;font-size:20px;font-weight:900;color:#1a1a1a;letter-spacing:-0.01em;line-height:1.2}' +
      '#ve-vm-body{margin:0 0 20px;font-size:13.5px;color:#4a4a4a;line-height:1.6}' +
      '#ve-vm-body b{color:#1a1a1a}' +
      '.ve-vm-btn{display:block;width:100%;padding:14px;border-radius:6px;font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;cursor:pointer;border:0;box-sizing:border-box}' +
      '.ve-vm-go{background:#22C55E;color:#03170a}.ve-vm-go:hover{background:#16A34A}' +
      '.ve-vm-alt{background:#fff;color:#1a1a1a;border:1.5px solid rgba(0,0,0,0.2);margin-top:10px}.ve-vm-alt:hover{background:#f5f5f5}' +
      '#ve-vm-foot{margin:14px 0 0;font-size:12.5px;color:#555}#ve-vm-foot a{color:#2d7d31;font-weight:800}' +
      '#ve-vote-modal :focus-visible{outline:3px solid #F69820;outline-offset:2px}';
    document.head.appendChild(st);
    modalEl = document.createElement('div');
    modalEl.id = 've-vote-modal';
    modalEl.innerHTML = '<div id="ve-vm-box" role="dialog" aria-modal="true" aria-labelledby="ve-vm-title" aria-describedby="ve-vm-body">' +
      '<button type="button" id="ve-vm-x" aria-label="Close">&times;</button>' +
      '<div id="ve-vm-ico" aria-hidden="true"></div><p id="ve-vm-eye"></p><h2 id="ve-vm-title"></h2><p id="ve-vm-body"></p>' +
      '<div id="ve-vm-acts"></div><p id="ve-vm-foot"></p></div>';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl || e.target.closest('[data-vm-close]') || e.target.id === 've-vm-x') closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (!modalEl.classList.contains('on')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') { // keep Tab inside the window
        var f = Array.prototype.slice.call(modalEl.querySelectorAll('a[href],button')); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function openModal(o) {
    if (!modalEl) buildModal();
    lastFocus = document.activeElement;
    document.getElementById('ve-vm-ico').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICON[o.icon] + '</svg>';
    document.getElementById('ve-vm-eye').textContent = o.eyebrow || '';
    document.getElementById('ve-vm-title').textContent = o.title;
    document.getElementById('ve-vm-body').innerHTML = o.body;
    document.getElementById('ve-vm-acts').innerHTML = o.actions;
    var foot = document.getElementById('ve-vm-foot'); foot.innerHTML = o.foot || ''; foot.style.display = o.foot ? '' : 'none';
    modalEl.classList.add('on'); document.body.style.overflow = 'hidden';
    var go = modalEl.querySelector('.ve-vm-go'); if (go) go.focus();
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('on'); document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function here() { return location.pathname + location.search + location.hash; }
  // A members-only action, signed out: why, then Explore the Passport (from= tells the Passport Guide which note to show).
  var GATES = {
    vote: { icon: 'heart', title: 'Voting is for Passport holders',
      body: 'Member votes decide which places lead every list. With your Passport, <b>$11 one time</b>, you can vote for the places you love every day, check in, earn points and unlock the Guides.' },
    save: { icon: 'bookmark', title: 'Saving is for Passport holders',
      body: 'Save the places you love to My list and find them again from your dashboard. With your Passport, <b>$11 one time</b>, you can also vote every day, check in, earn points and unlock the Guides.' },
    checkin: { icon: 'pin', title: 'Check-ins are for Passport holders',
      body: 'Check in when you visit a place and earn <b>10 points</b> a visit, and your check-ins show the community the place is open. With your Passport, <b>$11 one time</b>, you can also vote every day, save places and unlock the Guides.' },
    // The Daily Pulse board (Sean, 2026-10-26: "you have to be a member in order to reply or comment... it should give
    // them that pop-up"), from=board on the Passport Guide.
    post: { icon: 'chat', from: 'board', title: 'Posting is for Passport holders',
      body: 'Anyone can read the Daily Pulse. Members post to their city\'s board: classifieds, fosters, rescues and topic ideas. Your Passport is <b>$11 one time</b> and comes with <b>1,100 welcome points</b>.' },
    comment: { icon: 'chat', from: 'board', title: 'Comments are for Passport holders',
      body: 'Every Daily Pulse briefing and every post has a conversation under it, and members are the ones talking. Your Passport, <b>$11 one time</b>, lets you comment, post and reach people directly.' },
    contact: { icon: 'chat', from: 'board', title: 'Contact details are for Passport holders',
      body: 'People share how to reach them with members only, so the board stays safe. Your Passport, <b>$11 one time</b>, shows contact details and lets you comment and post.' },
    report: { icon: 'chat', from: 'board', title: 'Reports come from Passport holders',
      body: 'Members keep the board safe: a report goes to your city\'s Community Manager. Your Passport is <b>$11 one time</b>.' },
    job: { icon: 'briefcase', from: 'board', title: 'Jobs are for Passport holders',
      body: 'Members post when they are looking for work, and businesses in the Directory post their openings: hiring is one of the perks of a listed business. Your Passport is <b>$11 one time</b>.' },
    // Members-only tickets (Sean, 2026-10-28, the Dolphins game: "this is a member-only event. You must be a member in order to
    // access the tickets"): an event whose tickets come through our group link, opened signed out.
    tickets: { icon: 'ticket', title: 'This is a members-only event',
      body: 'Tickets come through our Vegans Explore group link, and you must be a member to get them. Your Passport is <b>$11 one time</b> and comes with <b>1,100 welcome points</b>. Join, and we take you straight to the tickets.' },
    // A group (Sean, 2026-10-29): joining one, and getting its announcements, is for members.
    group: { icon: 'heart', title: 'Groups are for Passport holders',
      body: 'Join any group, in any city: its events, its announcements and its people. Your Passport is <b>$11 one time</b> and comes with <b>1,100 welcome points</b>.' },
    give: { icon: 'gift', title: 'Giving points is for Passport holders',
      body: 'Members earn points by taking part, and can give them to the businesses and nonprofits they love as a boost (never money). Your Passport, <b>$11 one time</b>, comes with <b>1,100 welcome points</b>, so you can give from day one.' }
  };
  // o.signedIn: they are signed in but not a member yet, so no Sign in line. Inside a frame (the dashboard window) the
  // links open in the whole window.
  function gatePrompt(kind, o) {
    o = o || {};
    var g = GATES[kind] || GATES.vote, from = g.from || (GATES[kind] ? kind : 'vote');
    var framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
    var top = framed ? ' target="_top"' : '', back = encodeURIComponent(framed ? '/dashboard/pulse' : here());
    openModal({
      icon: g.icon, eyebrow: 'Members only', title: g.title, body: g.body,
      actions: '<a class="ve-vm-btn ve-vm-go"' + top + ' href="/passport?from=' + from + '&back=' + back + '">Explore the Passport</a>' +
               '<button type="button" class="ve-vm-btn ve-vm-alt" data-vm-close>Not now</button>',
      foot: o.signedIn ? '' : 'Already a member? <a' + top + ' href="/login?next=' + back + '">Sign in</a>'
    });
  }
  function memberPrompt(kind, o) { gatePrompt(kind, o); }
  function passportPrompt() { gatePrompt('vote'); }
  function savePrompt() { gatePrompt('save'); }
  function checkinPrompt() { gatePrompt('checkin'); }
  function givePrompt() { gatePrompt('give'); }
  // The next midnight in New York, as an instant: tomorrow's Eastern date at 00:00, under whichever of EDT or EST it is.
  function nextEasternMidnight() {
    var ny = function (d) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d); };
    var hourNy = function (d) { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(d)); };
    var p = ny(new Date()).split('-').map(Number), tomorrow = ny(new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1, 12)));
    var q = tomorrow.split('-').map(Number);
    for (var off = 4; off <= 5; off++) {
      var t = new Date(Date.UTC(q[0], q[1] - 1, q[2], off));
      if (ny(t) === tomorrow && hourNy(t) === 0) return t.toISOString();
    }
    return new Date(Date.UTC(q[0], q[1] - 1, q[2], 5)).toISOString();
  }
  function checkedInPrompt() {
    openModal({
      icon: 'pin', eyebrow: 'Thanks for checking in', title: "You've checked in here today",
      body: 'Each place takes one check-in a day from you, and you earn points at up to 5 places a day. Your next check-in here opens <b>' + nextText(nextEasternMidnight()).replace('at 12:00 AM', 'at midnight') + '</b>.',
      actions: '<button type="button" class="ve-vm-btn ve-vm-go" data-vm-close>Got it</button>'
    });
  }
  function votedPrompt(iso) {
    openModal({
      icon: 'clock', eyebrow: 'Thanks for voting', title: "You've voted for this one today",
      body: 'Each business gets one vote a day from you, so every list reflects the whole community. Your next vote for this one opens <b>' + nextText(iso) + '</b>.',
      actions: '<button type="button" class="ve-vm-btn ve-vm-go" data-vm-close>Got it</button>'
    });
  }

  function countEl(btn) {
    var box = btn.closest('.rank-card') || btn.closest('.rank-right') || btn.parentNode;
    return box ? box.querySelector('.vote-count') : null;
  }
  // Voted stays clickable, so a second click can say when the next vote opens.
  function paint(btn, nextIso) {
    btn.dataset.voted = '1'; btn.dataset.next = nextIso || ''; btn.disabled = false; btn.textContent = 'Voted';
    btn.title = nextIso ? 'You can vote for this one again ' + nextText(nextIso) + '.' : '';
    btn.style.background = '#5EC47A'; btn.style.color = '#000'; btn.style.borderColor = '#5EC47A';
  }
  function setCount(btn, n) {
    if (n == null) return;
    var el = countEl(btn); if (el) el.textContent = Number(n).toLocaleString();
    var card = btn.closest('.rank-card'); if (card) card.dataset.votes = String(n);
  }
  function vote(btn) {
    if (btn.dataset.busy || !window.VEAuth) return;
    if (btn.dataset.voted && tooSoon(btn.dataset.next)) { votedPrompt(btn.dataset.next); return; }
    if (!VEAuth.isLoggedIn()) { passportPrompt(); return; }
    var id = btn.getAttribute('data-listing-id'), label = btn.textContent;
    btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = 'Voting...';
    cast(id).then(function (d) {
      delete btn.dataset.busy;
      if (d && d.ok) {
        setCount(btn, d.vote_count); paint(btn, d.next_vote_at);
        if (recent) recent.then(function (m) { m[id] = d.next_vote_at; });
        return;
      }
      if (d && (d.error === 'already_voted' || d.error === 'already_voted_today')) { paint(btn, d.next_vote_at); votedPrompt(d.next_vote_at); return; }
      // payment_required: call() has already opened the $11 box. Anything else: let them retry.
      btn.disabled = false; btn.textContent = label;
    }).catch(function () { delete btn.dataset.busy; btn.disabled = false; btn.textContent = label; });
  }
  function wire(root) {
    root = root || document;
    var btns = Array.prototype.slice.call(root.querySelectorAll('.vote-btn[data-listing-id]'));
    btns.forEach(function (btn) {
      if (btn.dataset.veVote) return;
      btn.dataset.veVote = '1';
      btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); vote(btn); });
    });
    if (btns.length) votedRecently().then(function (m) {
      btns.forEach(function (b) { var n = m[b.getAttribute('data-listing-id')]; if (tooSoon(n)) paint(b, n); });
    });
  }
  window.VEVotes = { wire: wire, cast: cast, today: listToday, tooSoon: tooSoon, nextText: nextText, onceMessage: onceMessage, notice: notice,
    memberPrompt: memberPrompt, passportPrompt: passportPrompt, savePrompt: savePrompt, checkinPrompt: checkinPrompt, givePrompt: givePrompt, votedPrompt: votedPrompt,
    checkedInPrompt: checkedInPrompt };
})();
