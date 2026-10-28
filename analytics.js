// Google Analytics for vegansexplore.com (property 432623792, read by Depot > Analytics). Pages may carry this tag and nav.js
// loads it on every page that does not (Sean, 2026-10-28), so it runs once a page however it arrives.
// The team's own visits are not traffic (Sean, 2026-10-28: "exclude my own visits from the traffic numbers"): a browser where a
// super admin has signed in, or that holds a Sign In As session, is marked (localStorage ve_ga_off) and sends nothing to Google
// from then on, signed in or out. ?ga=off marks a browser by hand (a phone before signing in), ?ga=on clears it.
(function(){
  if (window.__veGA) return;
  window.__veGA = true;
  try {
    var q = /[?&]ga=(on|off)\b/.exec(location.search);
    if (q) { if (q[1] === 'off') localStorage.setItem('ve_ga_off', '1'); else localStorage.removeItem('ve_ga_off'); }
    var m = JSON.parse(localStorage.getItem('ve_member') || 'null');
    if ((m && m.is_superadmin) || localStorage.getItem('ve_switch_from')) localStorage.setItem('ve_ga_off', '1');
    if (localStorage.getItem('ve_ga_off') === '1') return;
  } catch (e) {}
  var ID = 'G-2B6SKSQZLX';
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID);
})();
