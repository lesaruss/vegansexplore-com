/* The public directory rule (Sean, 2026-09-27): a vegan-friendly listing (or one with vegan
 * options) shows to the public only once the community trusts it, which means 10 different
 * members have voted for it (not one person ten times; listings.voter_count counts people)
 * or its business has claimed it and Sean approved the claim (claim_status 'verified').
 * Members always see everything, so they can vet the rest. Fully vegan listings, and any
 * listing without a vegan status, are never held back.
 *
 * The rule is switched on and its number set in the Depot (Claims tab), stored in
 * ve_site_settings 'directory_trust' as { enabled, min_voters }. While it is off, nothing
 * is hidden.
 *
 *   VETrust.load()            -> Promise of the setting
 *   VETrust.visible(l, s)     true if this visitor should see listing l
 *   VETrust.pending(l, s)     true if l is still being vetted (members see a "members only" note)
 *   VETrust.isMember()        signed in with an active membership (a public preview counts as not)
 * Listings need vegan_status, voter_count and claim_status selected.
 */
(function () {
  var URL_ = 'https://fwbhwfxpncrsfhttimna.supabase.co/rest/v1/ve_site_settings?key=eq.directory_trust&select=value';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var OFF = { enabled: false, min_voters: 10 };
  var loading = null;
  var VETTED = { vegan_friendly: 1, vegan_options: 1 }; // the statuses the rule applies to

  function load() {
    if (!loading) loading = fetch(URL_, { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } })
      .then(function (r) { return r.json(); })
      .then(function (d) { var v = d && d[0] && d[0].value; return v && typeof v === 'object' ? { enabled: !!v.enabled, min_voters: +v.min_voters || 10 } : OFF; })
      .catch(function () { return OFF; });
    return loading;
  }
  function isMember() {
    var m = window.VEAuth && VEAuth.getMember ? VEAuth.getMember() : null;
    return !!(m && m.membership_status === 'active');
  }
  function pending(l, s) {
    if (!s || !s.enabled || !VETTED[l.vegan_status]) return false;
    return !(l.claim_status === 'verified' || (l.voter_count || 0) >= s.min_voters);
  }
  function visible(l, s) { return !pending(l, s) || isMember(); }
  window.VETrust = { load: load, visible: visible, pending: pending, isMember: isMember };
})();
