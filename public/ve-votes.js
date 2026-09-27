/* Directory votes (Sean, 2026-09-27): any signed-in member votes for a listing once every
 * 24 hours, counted from their last vote for it, and the vote sticks. Before this, the
 * + Vote buttons on /directory and the city hubs only bumped the number on screen.
 *
 *   Signed out            -> the sign-in box (a new account then meets the $11 box).
 *   Signed in, not paid   -> ve-votes answers payment_required and the "Founding Member,
 *                            $11 one time" box opens (VEAuth.showActivateModal).
 *   Member                -> ve-votes saves it (listing_daily_votes; the trigger keeps
 *                            listings.vote_count), and the button reads "Voted".
 *   Voting again too soon -> "You're only allowed to vote once a day... try again tomorrow
 *                            at 9:14 PM EDT", in the visitor's own time zone (the browser's).
 *
 *   VEVotes.wire(root)  binds every .vote-btn[data-listing-id] under root (safe to call
 *                       again after re-rendering) and marks the ones voted in the last 24 hours.
 *   The count shown is the .vote-count in the same .rank-card (or .rank-right).
 *   VEVotes.cast(id), VEVotes.today(), VEVotes.tooSoon(nextIso) and VEVotes.nextText(nextIso)
 *   are what the listing page uses.
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
    if (btn.dataset.voted && tooSoon(btn.dataset.next)) { notice(onceMessage(btn.dataset.next)); return; }
    if (!VEAuth.isLoggedIn()) {
      VEAuth.showAuthModal('Sign in to vote. Members vote once a day for every business they love.', function () { window.location.reload(); });
      return;
    }
    var id = btn.getAttribute('data-listing-id'), label = btn.textContent;
    btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = 'Voting...';
    cast(id).then(function (d) {
      delete btn.dataset.busy;
      if (d && d.ok) {
        setCount(btn, d.vote_count); paint(btn, d.next_vote_at);
        if (recent) recent.then(function (m) { m[id] = d.next_vote_at; });
        return;
      }
      if (d && (d.error === 'already_voted' || d.error === 'already_voted_today')) { paint(btn, d.next_vote_at); notice(onceMessage(d.next_vote_at)); return; }
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
  window.VEVotes = { wire: wire, cast: cast, today: listToday, tooSoon: tooSoon, nextText: nextText, onceMessage: onceMessage, notice: notice };
})();
