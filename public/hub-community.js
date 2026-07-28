/* Shared community features for VE city hub pages, ported from the South Florida
   prototype (now the locked reference implementation) so every hub gets the same
   real, live-wired functionality instead of duplicated inline JS:
     - News submission form (writes to ve_community_news via ve-community-news edge fn)
     - Community Roles / Opportunities (real per-city rows from public.opportunities,
       applications submitted through ve-rewards?action=submit_opportunity_application)
     - Rewards store + Nonprofit giving + Points Leaderboard (ve-rewards edge fn)
     - Passport-gated unlock for Members / Rewards / Chat previews
     - Partner application form (ve-rewards edge fn)
   Requires /public/ve-auth.js to be loaded first on the page.
   Element IDs are generic (hub-*) so this file works unmodified on every city page. */
(function () {
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function headers() { return { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }; }
  function requireAuth(promptMsg, onGranted) {
    if (window.VEAuth && VEAuth.isLoggedIn()) { onGranted(); return; }
    if (window.VEAuth) VEAuth.showAuthModal(promptMsg, onGranted);
  }

  /* ==================== NEWS SUBMISSION FORM ==================== */
  function wireNewsSubmit(citySlug) {
    var openBtn = document.getElementById('hub-news-submit-open');
    var closedWrap = document.getElementById('hub-news-submit-closed');
    var form = document.getElementById('hub-news-submit-form');
    var msg = document.getElementById('hub-news-submit-msg');
    if (!openBtn || !form) return;

    openBtn.addEventListener('click', function () {
      requireAuth('Sign in with your free Passport to submit news.', function () {
        closedWrap.style.display = 'none';
        form.style.display = 'block';
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = '';
      var headline = document.getElementById('hub-news-headline').value.trim();
      var summary = document.getElementById('hub-news-summary').value.trim();
      var url = document.getElementById('hub-news-url').value.trim();
      if (!headline) { msg.textContent = 'Please add a headline.'; msg.style.color = '#dc2626'; return; }
      var token = window.VEAuth ? window.VEAuth.getToken() : null;
      if (!token) { msg.textContent = 'Please sign in first.'; msg.style.color = '#dc2626'; return; }

      var btn = document.getElementById('hub-news-submit-btn');
      btn.disabled = true; btn.textContent = 'Submitting...';

      fetch(SUPABASE_URL + '/functions/v1/ve-community-news?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
        body: JSON.stringify({ token: token, city_slug: citySlug, headline: headline, summary: summary || null, url: url || null })
      }).then(function (r) { return r.json(); }).then(function (d) {
        btn.disabled = false; btn.textContent = 'Submit for review';
        if (d.error) { msg.textContent = d.error; msg.style.color = '#dc2626'; return; }
        form.reset();
        msg.textContent = 'Thanks - your story is in for review.';
        msg.style.color = 'var(--ve-green)';
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Submit for review';
        msg.textContent = 'Something went wrong. Please try again.';
        msg.style.color = '#dc2626';
      });
    });
  }

  /* ==================== OPPORTUNITIES / COMMUNITY ROLES ====================
     Real per-city rows read from public.opportunities (is_active=true,
     city_slug match). Applying requires a signed-in Passport and posts to
     ve-rewards?action=submit_opportunity_application, which writes a real
     row to opportunity_applications for Sean/V to review. */
  function renderOpportunities(listId, citySlug) {
    var wrap = document.getElementById(listId);
    if (!wrap) return;
    if (!citySlug) { wrap.innerHTML = '<p class="hub-dir-empty">Opportunities aren\'t configured for this hub yet.</p>'; return; }

    fetch(SUPABASE_URL + '/rest/v1/opportunities?select=id,title,description,opportunity_type,requirements,location&is_active=eq.true&city_slug=eq.' + encodeURIComponent(citySlug) + '&order=opportunity_type.desc', {
      headers: headers()
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) { wrap.innerHTML = '<p class="hub-dir-empty">No open roles here right now. Check back soon.</p>'; return; }
      wrap.innerHTML = '<div class="news-grid">' + rows.map(function (o) {
        var tier = o.opportunity_type === 'community_manager' ? 'Leadership Role' : 'Volunteer Role';
        return '<article class="news-card opp-card" data-opp-id="' + esc(o.id) + '">' +
          '<div class="news-body">' +
            '<p class="news-date" style="color:var(--ve-green-dark);font-weight:800;letter-spacing:0.1em;text-transform:uppercase;font-size:10px;">' + esc(tier) + '</p>' +
            '<h3 class="news-headline">' + esc(o.title) + '</h3>' +
            '<p class="news-excerpt">' + esc(o.description) + '</p>' +
            (o.requirements ? '<p class="news-excerpt" style="margin-top:6px;color:var(--ve-text-50);font-size:12px;"><strong>What it takes:</strong> ' + esc(o.requirements) + '</p>' : '') +
            '<div class="opp-interest-section" id="opp-section-' + esc(o.id) + '" style="margin-top:14px;">' +
              '<div id="opp-form-' + esc(o.id) + '" class="opp-interest-fields">' +
                '<textarea class="opp-interest-input opp-cover-note" id="opp-note-' + esc(o.id) + '" placeholder="Tell us a bit about why you\'d be a good fit (optional)" rows="3" style="width:100%;font-family:inherit;"></textarea>' +
                '<button type="button" class="btn-opp-submit" data-apply-id="' + esc(o.id) + '" style="margin-top:8px;">Apply Now</button>' +
              '</div>' +
              '<div id="opp-success-' + esc(o.id) + '" class="opp-interest-success" style="display:none;"><div class="opp-interest-success-title">Application received.</div><div class="opp-interest-success-sub">We review these by hand, we will reach out.</div></div>' +
              '<span class="opp-apply-msg" data-opp-msg="' + esc(o.id) + '" style="font-size:12px;display:block;margin-top:6px;"></span>' +
            '</div>' +
          '</div></article>';
      }).join('') + '</div>';

      wrap.querySelectorAll('[data-apply-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-apply-id');
          requireAuth('Sign in with your free Passport to apply.', function () {
            var noteEl = document.getElementById('opp-note-' + id);
            var msgEl = wrap.querySelector('[data-opp-msg="' + id + '"]');
            btn.disabled = true; btn.textContent = 'Submitting...';
            fetch(SUPABASE_URL + '/functions/v1/ve-rewards?action=submit_opportunity_application', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
              body: JSON.stringify({ token: VEAuth.getToken(), opportunity_id: id, cover_note: noteEl ? noteEl.value.trim() || null : null })
            }).then(function (r) { return r.json(); }).then(function (d) {
              btn.disabled = false; btn.textContent = 'Apply Now';
              if (d.error) { if (msgEl) { msgEl.textContent = d.error; msgEl.style.color = '#dc2626'; } return; }
              var formEl = document.getElementById('opp-form-' + id);
              var successEl = document.getElementById('opp-success-' + id);
              if (formEl) formEl.style.display = 'none';
              if (successEl) {
                successEl.style.display = 'block';
                if (d.already_applied) {
                  successEl.querySelector('.opp-interest-success-title').textContent = "You're already on file for this role.";
                }
              }
            }).catch(function () {
              btn.disabled = false; btn.textContent = 'Apply Now';
              if (msgEl) { msgEl.textContent = 'Something went wrong. Please try again.'; msgEl.style.color = '#dc2626'; }
            });
          });
        });
      });
    }).catch(function () { wrap.innerHTML = '<p class="hub-dir-empty">Couldn\'t load opportunities right now.</p>'; });
  }

  /* ==================== REWARDS: STORE + NONPROFIT DONATION ==================== */
  function wireRewards(citySlug) {
    var wrap = document.getElementById('hub-rewards-store');
    if (!wrap) return;
    fetch(SUPABASE_URL + '/rest/v1/store_products?select=id,name,description,points_price,image_url,stock_quantity&is_active=eq.true&or=(city_slug.eq.' + encodeURIComponent(citySlug) + ',city_slug.is.null)&order=sort_order.asc', {
      headers: headers()
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) { wrap.innerHTML = '<p class="hub-dir-empty">Rewards are launching soon. Keep earning points, first drops are coming.</p>'; return; }
      wrap.innerHTML = '<div class="news-grid">' + rows.map(function (p) {
        return '<article class="news-card"><div class="news-img">' + (p.image_url ? '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" style="width:100%;height:100%;object-fit:cover;">' : '<div class="news-img-placeholder">Reward</div>') + '</div>' +
          '<div class="news-body"><h3 class="news-headline">' + esc(p.name) + '</h3>' +
          (p.description ? '<p class="news-excerpt">' + esc(p.description) + '</p>' : '') +
          '<p class="news-date">' + p.points_price + ' points' + (p.stock_quantity != null ? ' &middot; ' + p.stock_quantity + ' left' : '') + '</p>' +
          '<button type="button" class="btn-join" data-redeem-id="' + p.id + '" style="margin-top:8px;">Redeem</button>' +
          '<span class="redeem-msg" data-redeem-msg="' + p.id + '" style="font-size:12px;display:block;margin-top:6px;"></span>' +
        '</div></article>';
      }).join('') + '</div>';

      wrap.querySelectorAll('[data-redeem-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-redeem-id');
          requireAuth('Sign in with your free Passport to redeem rewards.', function () {
            btn.disabled = true; btn.textContent = 'Redeeming...';
            fetch(SUPABASE_URL + '/functions/v1/ve-rewards?action=redeem_product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
              body: JSON.stringify({ token: VEAuth.getToken(), product_id: id })
            }).then(function (r) { return r.json(); }).then(function (d) {
              var msgEl = wrap.querySelector('[data-redeem-msg="' + id + '"]');
              btn.disabled = false;
              if (d.error) { btn.textContent = 'Redeem'; if (msgEl) { msgEl.textContent = d.error === 'insufficient_points' ? 'Not enough points yet.' : d.error; msgEl.style.color = '#dc2626'; } return; }
              btn.textContent = 'Redeemed';
              if (msgEl) { msgEl.textContent = 'Redeemed. New balance: ' + d.balance + ' points.'; msgEl.style.color = 'var(--ve-green)'; }
            }).catch(function () { btn.disabled = false; btn.textContent = 'Redeem'; });
          });
        });
      });
    }).catch(function () { wrap.innerHTML = '<p class="hub-dir-empty">Couldn\'t load rewards right now.</p>'; });
  }

  function renderNonprofits(listId) {
    var wrap = document.getElementById(listId);
    if (!wrap) return;
    fetch(SUPABASE_URL + '/rest/v1/registered_nonprofits?select=id,name,description,website&active=eq.true', {
      headers: headers()
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) { wrap.innerHTML = '<p class="hub-dir-empty">No registered nonprofits yet.</p>'; return; }
      wrap.innerHTML = rows.map(function (n) {
        return '<div class="card" style="background:#fff;border:1.5px solid var(--ve-border);border-radius:10px;padding:20px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;">' +
          '<div><h3 style="font-size:15px;font-weight:800;margin-bottom:4px;">' + esc(n.name) + '</h3>' +
          (n.description ? '<p style="font-size:13px;color:#444;">' + esc(n.description) + '</p>' : '') + '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
          '<input type="number" min="1" step="1" placeholder="Points" data-donate-amount="' + n.id + '" style="width:90px;padding:9px 10px;border:1.5px solid var(--ve-border);border-radius:6px;font-family:\'Montserrat\',sans-serif;font-size:13px;">' +
          '<button type="button" class="btn-outline" data-donate-id="' + n.id + '" style="font-size:11px;padding:9px 16px;">Donate</button>' +
          '</div>' +
          '<span class="donate-msg" data-donate-msg="' + n.id + '" style="font-size:12px;width:100%;"></span>' +
        '</div>';
      }).join('');

      wrap.querySelectorAll('[data-donate-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-donate-id');
          var amountEl = wrap.querySelector('[data-donate-amount="' + id + '"]');
          var amount = parseInt(amountEl.value, 10);
          var msgEl = wrap.querySelector('[data-donate-msg="' + id + '"]');
          if (!amount || amount <= 0) { msgEl.textContent = 'Enter how many points to donate.'; msgEl.style.color = '#dc2626'; return; }
          requireAuth('Sign in with your free Passport to donate points.', function () {
            btn.disabled = true; btn.textContent = 'Donating...';
            fetch(SUPABASE_URL + '/functions/v1/ve-rewards?action=donate_to_nonprofit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
              body: JSON.stringify({ token: VEAuth.getToken(), nonprofit_id: id, amount: amount })
            }).then(function (r) { return r.json(); }).then(function (d) {
              btn.disabled = false; btn.textContent = 'Donate';
              if (d.error) { msgEl.textContent = d.error === 'insufficient_points' ? 'Not enough points yet.' : d.error; msgEl.style.color = '#dc2626'; return; }
              msgEl.textContent = 'Thank you! New balance: ' + d.balance + ' points.'; msgEl.style.color = 'var(--ve-green)';
            }).catch(function () { btn.disabled = false; btn.textContent = 'Donate'; });
          });
        });
      });
    }).catch(function () { wrap.innerHTML = '<p class="hub-dir-empty">Couldn\'t load nonprofits right now.</p>'; });
  }

  /* ==================== PASSPORT GATES (Members/Chat/Rewards) + Leaderboard ==================== */
  function applyGates(cityLabel, cityNames) {
    var loggedIn = !!(window.VEAuth && VEAuth.isLoggedIn());
    document.querySelectorAll('.locked-preview-wrap.hub-gate').forEach(function (wrap) {
      wrap.classList.toggle('hub-unlocked', loggedIn);
    });
    var lbWrap = document.getElementById('hub-leaderboard-wrap');
    if (lbWrap) {
      lbWrap.style.display = loggedIn ? '' : 'none';
      if (loggedIn) loadLeaderboard(cityLabel, cityNames);
    }
  }

  function loadLeaderboard(cityLabel, cityNames) {
    var wrap = document.getElementById('hub-leaderboard-list');
    if (!wrap || !window.VEAuth) return;
    wrap.innerHTML = '<p class="hub-dir-empty">Loading leaderboard&hellip;</p>';
    fetch(SUPABASE_URL + '/functions/v1/ve-rewards?action=leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
      body: JSON.stringify({ token: VEAuth.getToken(), cities: cityNames })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok || !d.leaderboard || !d.leaderboard.length) { wrap.innerHTML = '<p class="hub-dir-empty">No ranked members in ' + esc(cityLabel) + ' yet.</p>'; return; }
      wrap.innerHTML = d.leaderboard.map(function (m) {
        var avatar = m.avatar_url
          ? '<img src="' + esc(m.avatar_url) + '" alt="" class="lb-avatar-img">'
          : '<div class="lb-avatar" style="background:' + (m.color || '#22C55E') + '">' + esc(m.initials || '?') + '</div>';
        return '<div class="lb-row' + (m.is_you ? ' lb-you' : '') + '">' +
          '<span class="lb-rank">#' + m.rank + '</span>' + avatar +
          '<div class="lb-info"><span class="lb-name">' + esc(m.name) + '</span>' +
          (m.location ? '<span class="lb-loc">' + esc(m.location) + '</span>' : '') + '</div>' +
          '<span class="lb-points">' + m.points.toLocaleString() + ' pts</span>' +
        '</div>';
      }).join('');
    }).catch(function () { wrap.innerHTML = '<p class="hub-dir-empty">Couldn\'t load the leaderboard right now.</p>'; });
  }

  /* ==================== PARTNER APPLICATION ==================== */
  function wirePartnerApply(citySlug) {
    var openBtn = document.getElementById('hub-partner-apply-open');
    var form = document.getElementById('hub-partner-apply-form');
    if (!openBtn || !form) return;
    openBtn.addEventListener('click', function () {
      requireAuth('Sign in with your free Passport to apply as a partner.', function () {
        form.style.display = 'block';
        openBtn.style.display = 'none';
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('hub-partner-submit-msg');
      var name = document.getElementById('hub-partner-name').value.trim();
      var desc = document.getElementById('hub-partner-desc').value.trim();
      var site = document.getElementById('hub-partner-site').value.trim();
      if (!name) { msg.textContent = 'Business or org name is required.'; msg.style.color = '#dc2626'; return; }
      var btn = document.getElementById('hub-partner-submit-btn');
      btn.disabled = true; btn.textContent = 'Submitting...';
      fetch(SUPABASE_URL + '/functions/v1/ve-rewards?action=submit_partner_application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
        body: JSON.stringify({ token: VEAuth.getToken(), city_slug: citySlug, business_name: name, business_description: desc || null, business_website: site || null })
      }).then(function (r) { return r.json(); }).then(function (d) {
        btn.disabled = false; btn.textContent = 'Submit application';
        if (d.error) { msg.textContent = d.error; msg.style.color = '#dc2626'; return; }
        form.reset();
        msg.textContent = d.already_applied ? 'You already have an application on file (' + d.status + ').' : "Thanks - we'll be in touch.";
        msg.style.color = 'var(--ve-green)';
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Submit application';
        msg.textContent = 'Something went wrong. Please try again.';
        msg.style.color = '#dc2626';
      });
    });
  }

  window.VEHubCommunity = {
    wireNewsSubmit: wireNewsSubmit,
    renderOpportunities: renderOpportunities,
    wireRewards: wireRewards,
    renderNonprofits: renderNonprofits,
    applyGates: applyGates,
    wirePartnerApply: wirePartnerApply
  };
})();
