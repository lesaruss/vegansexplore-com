/* public/universal-bar.js
 *
 * The LESARUSS universal bar, as rendered on vegansexplore.com.
 *
 * 2026-09-20 (Logan, Sean: "the icon needs to be synced on both. Right now if
 * I go to Vegans Explore logged in with my username, it's different than when
 * I go to LESARUSS HQ").
 *
 * WHAT THIS REPLACES. dashboard/center-console.html carried a hardcoded
 * four-icon .lr-dock: GeekFon Society (an inert <div>, not even a link), a
 * plus pointing at lesaruss.com, the Guide button, and LESARUSS HQ. It could
 * not show the member's own picks because this site had no way to read them,
 * and its colours were copied by hand and had already drifted from the
 * registry -- GeekFon Society was #F69820 here and #7C3AED there.
 *
 * WHERE THE DATA COMES FROM. The lr-shell edge function returns the same four
 * keys LESARUSS HQ serves at /api/shell/me: { member, dock, brands, current }.
 * lr-shell is its own function, not ve-auth, because the shell is universal --
 * GeekFon Society and every other brand site point at this same endpoint. The
 * dock lives in member_dock keyed on members.id, which is the one identity
 * both sites hold, so a brand added to the bar here shows up on HQ and the
 * other way round. Picking a brand posts to lr-shell?action=dock. The site's
 * own ve_token is sent as-is; lr-shell verifies its signature before trusting
 * the member id inside it.
 *
 * THE ORDER IS THE CONTRACT. It matches lesaruss-hq's
 * components/shell/UniversalBar.tsx exactly:
 *
 *   current brand (you are here) -> hub -> LESARUSS AI -> the member's picks
 *   -> divider -> [this site's own items] -> plus
 *
 * On HQ the current brand IS the hub, so the two collapse into one there and
 * the row reads hub, LESARUSS AI, picks, plus. Here the current brand is
 * VEGANS EXPLORE, so you get your own icon lit first and HQ right beside it.
 *
 * WHAT IS LOCAL TO THIS SITE. The Guide button. Sean, 2026-09-10, Group I:
 * "access to the Guide dialogue happens only by clicking the dock icon itself,
 * never a separate auto-appearing bubble." It is passed in as an extra item
 * rather than built in here, so the shared part stays shared.
 *
 * Follows the repo's locked shared-component rule (CLAUDE.md, 2026-05-18):
 * one script file, injects its own CSS, no dock markup in any page.
 */
(function (global) {
  'use strict';

  var FN_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/lr-shell';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  /** The one brand that earns a permanent slot beside the hub. */
  var PERMANENT_SLUG = 'lesaruss-ai';

  /** The registry slug of THIS site, sent to lr-shell so the bar marks the
   *  current brand "you are here". This is vegansexplore.com. lr-shell also
   *  echoes it back as `current`; sending it is what lets one shared bar file
   *  serve every brand by changing only this line. */
  var CURRENT_SLUG = 'vegans-explore';

  // --- Ink ---------------------------------------------------------------
  // Pick the label ink that actually passes AA on a given brand colour instead
  // of always using white. Several brand colours clear 4.5:1 against exactly
  // one of black or white, and LESARUSS orange fails white badly. The old
  // hardcoded dock set color:#fff on every icon, which is why LESARUSS orange
  // read at about 2:1 here.
  //
  // The threshold is the sRGB break-even luminance, where contrast against
  // white and against black are equal: 1.05 / (L + 0.05) == (L + 0.05) / 0.05,
  // so L = sqrt(0.0525) - 0.05 = 0.1791.
  //
  // Same function, same constant, as inkFor() in lesaruss-hq's
  // lib/universeBrands.ts. Both surfaces must reach the same answer for the
  // same hex or the "synced" icon is only synced in colour, not in legibility.
  var INK_BREAK_EVEN = 0.1791;

  function inkFor(hex) {
    var clean = String(hex || '').replace('#', '');
    if (clean.length === 3) clean = clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2);
    if (clean.length !== 6) return '#ffffff';
    function channel(i) {
      var v = parseInt(clean.substr(i, 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    var l = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
    return l > INK_BREAK_EVEN ? '#1a1a1a' : '#ffffff';
  }

  // --- CSS ---------------------------------------------------------------
  // Ported from lesaruss-hq's app/globals.css, the ".hq-dock" block, so the
  // bar is the same object on both sites rather than two lookalikes. The
  // class prefix stays .lr-dock because this site's pages and its existing
  // Guide wiring already reference it; the VALUES are HQ's.
  //
  // Three deliberate differences from what was here before, all HQ's numbers:
  //   - 44px icons, not 54px. The old ones crowded the bar once it carried
  //     more than four items.
  //   - the icon row scrolls inside the bar (.lr-dock-scroll) rather than
  //     widening the page. This bar now carries every brand the member picked,
  //     which is wider than a phone, and canon-mobile-fit-check fails a page
  //     that scrolls sideways.
  //   - ink is per-icon, not always white. See inkFor above.
  var CSS = [
    '.lr-dock{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2;max-width:calc(100vw - 20px);background:rgba(255,255,255,0.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(0,0,0,0.08);border-radius:18px;padding:5px 9px;box-shadow:0 12px 34px rgba(0,0,0,0.16);}',
    '.lr-dock-scroll{display:flex;align-items:center;gap:3px;overflow-x:auto;scrollbar-width:none;max-width:100%;}',
    '.lr-dock-scroll::-webkit-scrollbar{display:none;}',
    '.lr-dock-item{position:relative;display:flex;align-items:center;justify-content:center;padding:2px;border-radius:13px;flex-shrink:0;transition:background 0.15s;text-decoration:none;color:inherit;background:none;border:none;font:inherit;}',
    'a.lr-dock-item,button.lr-dock-item{cursor:pointer;}',
    '.lr-dock-item:hover{background:rgba(0,0,0,0.05);}',
    '.lr-dock-icon{width:44px;height:44px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;letter-spacing:0.02em;font-family:"Montserrat",sans-serif;}',
    '.lr-dock-icon svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;}',
    '.lr-dock-plus{font-size:26px;font-weight:400;line-height:1;}',
    /* "You are here" ring. HQ rings in LESARUSS orange; here it is the Vegans
       Explore green, because the ring marks the brand you are standing on and
       that brand is this one. */
    '.lr-dock-current .lr-dock-icon{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--ve-green,#16A34A);}',
    '.lr-dock-sep{width:1px;align-self:stretch;background:rgba(0,0,0,0.1);margin:4px 4px;flex-shrink:0;}',
    '.lr-dock-item[data-tooltip]::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:rgba(20,20,20,0.94);color:#fff;font-size:11px;font-weight:700;padding:6px 11px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.12s ease;z-index:10;box-shadow:0 6px 16px rgba(0,0,0,0.28);}',
    '.lr-dock-item[data-tooltip]::before{content:"";position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:rgba(20,20,20,0.94);opacity:0;pointer-events:none;transition:opacity 0.12s ease;z-index:10;}',
    '.lr-dock-item[data-tooltip]:hover::after,.lr-dock-item[data-tooltip]:hover::before,.lr-dock-item[data-tooltip]:focus-visible::after,.lr-dock-item[data-tooltip]:focus-visible::before{opacity:1;}',
    /* The brand waffle. HQ opens the same grid from its top nav's Apps button
       and from this bar's plus; this site has no top nav of its own to hang it
       on, so the plus is the only way in and the panel sits above the bar. */
    '.lr-waffle{position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:3;width:min(520px,calc(100vw - 24px));max-height:min(60vh,520px);overflow-y:auto;background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,0.22);padding:16px;}',
    '.lr-waffle[hidden]{display:none;}',
    '.lr-waffle-label{margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(26,26,26,0.62);font-family:"Montserrat",sans-serif;}',
    '.lr-waffle-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}',
    '@media (max-width:560px){.lr-waffle-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}',
    '.lr-waffle-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border:1px solid transparent;border-radius:12px;background:none;cursor:pointer;font-family:"Montserrat",sans-serif;text-align:center;min-width:0;}',
    '.lr-waffle-item:hover:not(:disabled){background:rgba(0,0,0,0.04);}',
    '.lr-waffle-item:disabled{cursor:default;opacity:0.45;}',
    '.lr-waffle-item.is-on-bar{border-color:var(--ve-green,#16A34A);background:rgba(22,163,74,0.07);}',
    '.lr-waffle-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}',
    '.lr-waffle-name{font-size:10.5px;font-weight:700;line-height:1.25;color:#1a1a1a;overflow-wrap:anywhere;}',
    '.lr-waffle-note{font-size:8.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(26,26,26,0.5);}',
    '.lr-waffle-item.is-on-bar .lr-waffle-note{color:var(--ve-green-dark,#15803D);}',
    /* Phone. Mirrors HQ's 760px step: smaller icons, and the bar clears the
       home indicator. No separate mobile treatment beyond that, per Sean
       2026-09-10 Group I ("applies to mobile as well"). */
    '@media (max-width:760px){.lr-dock{bottom:calc(10px + env(safe-area-inset-bottom,0px));padding:4px 7px;}.lr-dock-icon{width:40px;height:40px;font-size:12px;}.lr-waffle{bottom:calc(72px + env(safe-area-inset-bottom,0px));}}',
  ].join('');

  function injectCSS() {
    if (document.getElementById('lr-universal-bar-css')) return;
    var st = document.createElement('style');
    st.id = 'lr-universal-bar-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // --- Markup ------------------------------------------------------------

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The hub's icon is a mark rather than a monogram: it is the one fixed point
     in the universe and reads better as a symbol than as letters. Same SVG as
     HQ's own bar draws for itself. */
  var HUB_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/></svg>';

  function iconHTML(b) {
    return '<span class="lr-dock-icon" style="background:' + esc(b.color) + ';color:' + inkFor(b.color) + ';">' +
      (b.isHub ? HUB_MARK : esc(b.mono)) + '</span>';
  }

  // Where a brand's icon links: its dashboard when one exists, else the domain
  // root. Mirrors brandHref() in lesaruss-hq/lib/universeBrands.ts so both bars
  // send the same icon to the same place.
  function brandHref(b) {
    if (!b.domain) return null;
    return 'https://' + b.domain + (b.dashboardPath || '');
  }

  function itemHTML(b, isCurrent) {
    if (isCurrent) {
      return '<span class="lr-dock-item lr-dock-current" data-tooltip="' + esc(b.name) + '" aria-label="' + esc(b.name) + ', you are here" aria-current="page">' + iconHTML(b) + '</span>';
    }
    // A brand with no domain has nowhere to send anyone. It cannot reach the
    // bar through the waffle either, but a stale member_dock row could still
    // name one, so it renders inert rather than as a link to nothing.
    if (!b.domain) {
      return '<span class="lr-dock-item" data-tooltip="' + esc(b.name) + ' is not live yet" aria-label="' + esc(b.name) + ', not live yet">' + iconHTML(b) + '</span>';
    }
    // Same-tab: this is a switcher, so it takes you to that brand's dashboard
    // (signed in, if your session there is live) rather than piling up tabs.
    return '<a class="lr-dock-item" href="' + esc(brandHref(b)) + '" data-tooltip="' + esc(b.name) +
      '" aria-label="' + esc(b.name) + ', opens its dashboard">' + iconHTML(b) + '</a>';
  }

  // --- Component ---------------------------------------------------------

  function UniversalBar(opts) {
    opts = opts || {};
    var mount = opts.mount;
    // Anything this site adds to the shared row, e.g. the Guide button. Each
    // entry is { html: '<button ...>', onMount: function (root) {} } and is
    // rendered after the divider, before the plus.
    var extras = opts.extras || [];
    var getToken = opts.getToken || function () { return null; };

    var state = { member: null, dock: [], brands: [], current: null, waffleOpen: false };

    function post(action, payload) {
      return fetch(FN_URL + '?action=' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
        body: JSON.stringify(payload || {}),
      }).then(function (r) { return r.ok ? r.json() : null; });
    }

    function bySlug(slug) {
      for (var i = 0; i < state.brands.length; i++) if (state.brands[i].slug === slug) return state.brands[i];
      return null;
    }

    function hub() {
      for (var i = 0; i < state.brands.length; i++) if (state.brands[i].isHub) return state.brands[i];
      return null;
    }

    /* The order, and the reason it is a function rather than inline: HQ's
       UniversalBar.tsx builds the identical list, and keeping it in one named
       place on each side is what makes a future change to one obviously a
       change to the other. */
    function row() {
      var out = [];
      var seen = {};
      function push(b) {
        if (!b || seen[b.slug]) return;
        seen[b.slug] = true;
        out.push(b);
      }
      push(bySlug(state.current));
      push(hub());
      push(bySlug(PERMANENT_SLUG));
      for (var i = 0; i < state.dock.length; i++) push(bySlug(state.dock[i]));
      return out;
    }

    function waffleHTML() {
      var items = state.brands.filter(function (b) { return !b.isHub; }).map(function (b) {
        var onBar = state.dock.indexOf(b.slug) !== -1;
        var cls = 'lr-waffle-item' + (onBar ? ' is-on-bar' : '');
        var title = !b.isLive ? esc(b.name) + ' is not live yet'
          : onBar ? 'Remove ' + esc(b.name) + ' from your bar'
          : 'Add ' + esc(b.name) + ' to your bar';
        return '<button type="button" role="menuitemcheckbox" aria-checked="' + (onBar ? 'true' : 'false') + '"' +
          (b.isLive ? '' : ' disabled aria-disabled="true"') +
          ' class="' + cls + '" data-slug="' + esc(b.slug) + '" title="' + title + '">' +
          '<span class="lr-waffle-icon" style="background:' + esc(b.color) + ';color:' + inkFor(b.color) + ';">' + esc(b.mono) + '</span>' +
          '<span class="lr-waffle-name">' + esc(b.name) + '</span>' +
          (b.isLive ? (onBar ? '<span class="lr-waffle-note">On your bar</span>' : '') : '<span class="lr-waffle-note">Soon</span>') +
          '</button>';
      }).join('');
      return '<div class="lr-waffle" id="lr-waffle" role="menu" aria-label="LESARUSS brands"' + (state.waffleOpen ? '' : ' hidden') + '>' +
        '<p class="lr-waffle-label">Pick the brands for your bar</p>' +
        '<div class="lr-waffle-grid">' + items + '</div></div>';
    }

    function render() {
      var brandItems = row().map(function (b) { return itemHTML(b, b.slug === state.current); }).join('');
      var extraItems = extras.map(function (x) { return x.html; }).join('');

      mount.innerHTML =
        '<nav class="lr-dock" id="lr-dock" aria-label="LESARUSS Universe">' +
          '<div class="lr-dock-scroll">' +
            brandItems +
            '<div class="lr-dock-sep" aria-hidden="true"></div>' +
            extraItems +
            '<button type="button" class="lr-dock-item" id="lr-dock-plus" data-tooltip="All brands" aria-haspopup="menu" aria-expanded="' + (state.waffleOpen ? 'true' : 'false') + '" aria-label="All brands in the LESARUSS Universe">' +
              '<span class="lr-dock-icon lr-dock-plus" style="background:#3f3f46;color:#ffffff;">+</span>' +
            '</button>' +
          '</div>' +
        '</nav>' +
        waffleHTML();

      mount.querySelector('#lr-dock-plus').addEventListener('click', function (e) {
        e.stopPropagation();
        state.waffleOpen = !state.waffleOpen;
        render();
      });

      Array.prototype.forEach.call(mount.querySelectorAll('.lr-waffle-item'), function (btn) {
        btn.addEventListener('click', function () { toggle(btn.getAttribute('data-slug')); });
      });

      // Re-attach whatever this site added, since the row was just rebuilt.
      extras.forEach(function (x) { if (typeof x.onMount === 'function') x.onMount(mount); });
    }

    function toggle(slug) {
      var token = getToken();
      // The waffle is the only way onto the bar, and the bar is stored per
      // member, so there is nowhere to put a pick from a signed-out visitor.
      // Send them to sign in rather than letting the click do nothing.
      if (!token) { global.location.href = '/login.html'; return; }

      var had = state.dock.indexOf(slug) !== -1;
      var before = state.dock.slice();
      // Optimistic: the bar updates as the member clicks and reverts if the
      // write fails. Waiting on the round trip made picking several brands
      // feel broken on HQ, and it would feel the same here.
      state.dock = had ? state.dock.filter(function (s) { return s !== slug; }) : state.dock.concat([slug]);
      render();

      post('dock', { token: token, brand_slug: slug, action: had ? 'remove' : 'add' })
        .then(function (d) {
          if (!d || !d.ok) { state.dock = before; render(); return; }
          if (Array.isArray(d.brand_slugs)) { state.dock = d.brand_slugs; render(); }
        })
        .catch(function () { state.dock = before; render(); });
    }

    function closeWaffleOnOutsideClick() {
      document.addEventListener('click', function (e) {
        if (!state.waffleOpen) return;
        if (mount.contains(e.target)) return;
        state.waffleOpen = false;
        render();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && state.waffleOpen) { state.waffleOpen = false; render(); }
      });
    }

    function load() {
      return post('me', { token: getToken(), current: CURRENT_SLUG }).then(function (d) {
        if (!d) return;
        state.member = d.member || null;
        state.dock = Array.isArray(d.dock) ? d.dock : [];
        state.brands = Array.isArray(d.brands) ? d.brands : [];
        state.current = d.current || CURRENT_SLUG;
        render();
        // The member's own icon is the other half of the sync. Any page that
        // draws it (public/nav.js) gets told, rather than this file reaching
        // into that page's markup.
        try {
          global.dispatchEvent(new CustomEvent('lr:shell-member', { detail: state.member }));
        } catch (e) { /* older browsers: the bar still works without it */ }
      });
    }

    injectCSS();
    // Render once from nothing so the bar occupies its space immediately and
    // does not pop in under the member's cursor when the fetch lands.
    render();
    closeWaffleOnOutsideClick();
    load();

    return { reload: load, getMember: function () { return state.member; } };
  }

  global.LRUniversalBar = { mount: UniversalBar, inkFor: inkFor };
})(window);
