/* Directory votes (Sean, 2026-09-27): any signed-in member votes once per listing per
 * day, and the vote sticks. Before this, the + Vote buttons on /directory and the city
 * hubs only bumped the number on screen, so a refresh wiped it.
 *
 *   Signed out            -> the sign-in box (a new account then meets the $11 box).
 *   Signed in, not paid   -> ve-votes answers payment_required and the "Founding Member,
 *                            $11 one time" box opens (VEAuth.showActivateModal).
 *   Member                -> ve-votes saves it (listing_daily_votes; the trigger keeps
 *                            listings.vote_count), and the button reads "Voted today".
 *
 *   VEVotes.wire(root)  binds every .vote-btn[data-listing-id] under root (safe to call
 *                       again after re-rendering) and marks the ones already voted today.
 *   The count shown is the .vote-count in the same .rank-card (or .rank-right).
 *   VEVotes.cast(listingId) and VEVotes.today() are the raw calls (the listing page uses them).
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-votes';
  var today = null; // Promise of { listingId: true } for the signed-in member, fetched once

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
  function votedToday() {
    if (!window.VEAuth || !VEAuth.isLoggedIn()) return Promise.resolve({});
    if (!today) today = listToday().then(function (d) {
      var m = {}; ((d && d.listing_ids) || []).forEach(function (id) { m[id] = true; }); return m;
    }).catch(function () { today = null; return {}; });
    return today;
  }
  function countEl(btn) {
    var box = btn.closest('.rank-card') || btn.closest('.rank-right') || btn.parentNode;
    return box ? box.querySelector('.vote-count') : null;
  }
  function paint(btn) {
    btn.dataset.voted = '1'; btn.disabled = true; btn.textContent = 'Voted today';
    btn.title = 'You can vote for this one again tomorrow.';
    btn.style.background = '#5EC47A'; btn.style.color = '#000'; btn.style.borderColor = '#5EC47A';
  }
  function setCount(btn, n) {
    if (n == null) return;
    var el = countEl(btn); if (el) el.textContent = Number(n).toLocaleString();
    var card = btn.closest('.rank-card'); if (card) card.dataset.votes = String(n);
  }
  function vote(btn) {
    if (btn.dataset.voted || btn.dataset.busy) return;
    if (!window.VEAuth) return;
    if (!VEAuth.isLoggedIn()) {
      VEAuth.showAuthModal('Sign in to vote. Members vote once a day for every business they love.', function () { window.location.reload(); });
      return;
    }
    var id = btn.getAttribute('data-listing-id'), label = btn.textContent;
    btn.dataset.busy = '1'; btn.disabled = true; btn.textContent = 'Voting...';
    cast(id).then(function (d) {
      delete btn.dataset.busy;
      if (d && d.ok) { setCount(btn, d.vote_count); paint(btn); if (today) today.then(function (m) { m[id] = true; }); return; }
      if (d && d.error === 'already_voted_today') { paint(btn); return; }
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
    if (btns.length) votedToday().then(function (m) { btns.forEach(function (b) { if (m[b.getAttribute('data-listing-id')]) paint(b); }); });
  }
  window.VEVotes = { wire: wire, cast: cast, today: listToday };
})();
