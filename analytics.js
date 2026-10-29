// Google Analytics for vegansexplore.com (property 432623792, read by Depot > Analytics). Pages may carry this tag and nav.js
// loads it on every page that does not (Sean, 2026-10-28), so it runs once a page however it arrives.
(function(){
  // Another brand's site serving our pages (lesaruss.ai, /public/ve-brand.js) is not Vegans Explore traffic.
  if (window.__veGA || /(^|\.)lesaruss\.ai$/.test(location.hostname)) return;
  window.__veGA = true;
  // Everyone counts, the team included (Sean, 2026-10-28: "it's still traffic to the page... include my traffic as well"). For a
  // few hours that day a team browser was marked to send nothing (ve_ga_off); clear that mark.
  try { localStorage.removeItem('ve_ga_off'); } catch (e) {}
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
