(function() {
  var GUIDE_SLUG = 'vegan-restaurant-survival-guide';
  var UNLOCK_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-guide-unlock';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  var introBtn = document.getElementById('introActionBtn');

  function setBtn(label, handler, muted) {
    if (!introBtn) return;
    introBtn.textContent = label;
    introBtn.onclick = handler;
    introBtn.classList.toggle('ve-btn-outline', !!muted);
    introBtn.classList.toggle('ve-btn-primary', !muted);
  }

  function goJoin() { window.location.href = '/join'; }

  function callGate(action, token) {
    return fetch(UNLOCK_URL + '?action=' + action, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: GUIDE_SLUG, token: token || undefined })
    }).then(function(r) { return r.json(); });
  }

  // Pricing (Sean, 2026-10-10, canon-ve-guide-pricing v3): a Guide is $11 or 1 Guide credit. With a credit: unlock it.
  // Without one: get it now for $11 (ve-guide-unlock checkout, back here with ?guide=bought). Not a member yet: join.
  function doUnlock(token) {
    setBtn('Unlocking...', null, true);
    if (introBtn) introBtn.disabled = true;
    callGate('unlock', token).then(function(d) {
      if (introBtn) introBtn.disabled = false;
      if (d.unlocked) {
        if (typeof goToIntake === 'function') goToIntake();
      } else if (d.error === 'no_credit') {
        setBtn('Get It Now for $11', function(){ doBuy(token); }, false);
      } else {
        setBtn('Something Went Wrong - Retry', function(){ doUnlock(token); }, true);
      }
    }).catch(function() {
      if (introBtn) introBtn.disabled = false;
      setBtn('Something Went Wrong - Retry', function(){ doUnlock(token); }, true);
    });
  }

  function doBuy(token) {
    setBtn('Opening Checkout...', null, true);
    fetch(UNLOCK_URL + '?action=checkout', {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: GUIDE_SLUG, token: token, return_url: location.origin + location.pathname })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d && d.url) { (window.top || window).location.href = d.url; return; }
      if (d && d.already) { location.reload(); return; }
      setBtn('Get It Now for $11', function(){ doBuy(token); }, false);
    }).catch(function() { setBtn('Get It Now for $11', function(){ doBuy(token); }, false); });
  }

  function initGate() {
    if (!introBtn) return;

    // Super Admin "View As" preview (2026-07-12): render the gate from the simulated view instead of calling the real
    // ve-guide-unlock backend, so a simulated view never reads or spends Sean's real credits.
    var viewAs = (window.VEAuth && VEAuth.getViewAs && VEAuth.getViewAs()) || null;
    if (viewAs) {
      setBtn(viewAs.mode === 'public' ? 'Join to Get Started' : 'Unlock with 1 Credit', function(){ alert('Preview only - no real action was taken.'); }, false);
      return;
    }

    var loggedIn = !!(window.VEAuth && VEAuth.isLoggedIn());
    if (!loggedIn) {
      setBtn('Join to Get Started', goJoin, false);
      return;
    }
    var token = VEAuth.getToken();
    setBtn('Checking Your Access...', null, true);
    introBtn.disabled = true;
    callGate('status', token).then(function(d) {
      introBtn.disabled = false;
      if (d.unlocked) {
        setBtn('Start Guide', function(){ if (typeof goToIntake === 'function') goToIntake(); }, false);
      } else if (d.access_rule === 'credit' && d.credits >= 1) {
        setBtn('Unlock with 1 Credit', function(){ doUnlock(token); }, false);
      } else if (d.access_rule === 'credit' && d.membership_status === 'active') {
        setBtn('Get It Now for $11', function(){ doBuy(token); }, false);
      } else if (d.access_rule === 'credit') {
        setBtn('Join to Get Started', goJoin, false);
      } else if (d.balance >= d.cost) {
        setBtn('Unlock for ' + d.cost.toLocaleString() + ' Points', function(){ doUnlock(token); }, false);
      } else {
        setBtn('Need ' + (d.cost - d.balance) + ' More Points', function(){ window.location.href = '/account'; }, true);
      }
    }).catch(function() {
      introBtn.disabled = false;
      setBtn('Start Guide', function(){ if (typeof goToIntake === 'function') goToIntake(); }, false);
    });
  }

  if (window.VEAuth) { initGate(); } else { window.addEventListener('load', initGate); }
})();
