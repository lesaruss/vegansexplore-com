// Google Analytics for vegansexplore.com (property 432623792, read by Depot > Analytics). Pages may carry this tag and nav.js
// loads it on every page that does not (Sean, 2026-10-28), so it runs once a page however it arrives.
(function(){
  if (window.__veGA) return;
  window.__veGA = true;
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
