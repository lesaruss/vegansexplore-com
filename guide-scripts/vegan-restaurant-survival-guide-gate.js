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

  function doUnlock(token) {
    setBtn('Unlocking...', null, true);
    if (introBtn) introBtn.disabled = true;
    callGate('unlock', token).then(function(d) {
      if (introBtn) introBtn.disabled = false;
      if (d.unlocked) {
        if (typeof goToIntake === 'function') goToIntake();
      } else if (d.error === 'insufficient_points') {
        setBtn('Need ' + (d.cost - d.balance) + ' More Points', function(){ window.location.href = '/account'; }, true);
      } else {
        setBtn('Something Went Wrong - Retry', function(){ doUnlock(token); }, true);
      }
    }).catch(function() {
      if (introBtn) introBtn.disabled = false;
      setBtn('Something Went Wrong - Retry', function(){ doUnlock(token); }, true);
    });
  }

  function initGate() {
    if (!introBtn) return;
    var loggedIn = !!(window.VEAuth && VEAuth.isLoggedIn());
    if (!loggedIn) {
      setBtn('Join Free to Get Started', goJoin, false);
      return;
    }
    var token = VEAuth.getToken();
    setBtn('Checking Your Access...', null, true);
    introBtn.disabled = true;
    callGate('status', token).then(function(d) {
      introBtn.disabled = false;
      if (d.unlocked) {
        setBtn('Start Guide', function(){ if (typeof goToIntake === 'function') goToIntake(); }, false);
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
