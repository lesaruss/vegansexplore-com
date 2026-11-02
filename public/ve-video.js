/* ve-video.js: a narrated video that waits for the visitor.
   VEVideo.markup({src, vtt, poster, title, sub, label, ga}) returns the player's HTML.
   Nothing plays until Watch the video is pressed; captions are on by default;
   Google Analytics gets video_start and video_complete with video_title = ga. */
(function () {
  if (window.VEVideo) return;
  var css = '.vv{position:relative;border-radius:10px;overflow:hidden;background:#0F1F14;aspect-ratio:16/9;margin:0 0 18px;box-shadow:0 8px 28px rgba(0,0,0,.18)}' +
    '.vv video{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;background:#0F1F14}' +
    '.vv-play{position:absolute;inset:0;border:0;padding:0;margin:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;padding:0 12px 14px;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0) 45%);color:#fff;font-family:inherit}' +
    '.vv-play[hidden]{display:none}' +
    '.vv-btn{display:inline-flex;align-items:center;gap:8px;background:#F69820;color:#fff;font-weight:800;font-size:14px;letter-spacing:.06em;text-transform:uppercase;padding:12px 18px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
    '.vv-sub{font-size:13px;font-weight:700;text-shadow:0 1px 8px rgba(0,0,0,.6)}' +
    '.vv-play:focus-visible .vv-btn{outline:3px solid #fff;outline-offset:3px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ga(name, title) { try { if (window.gtag) gtag('event', name, { video_title: title }); } catch (e) {} }
  window.VEVideo = {
    markup: function (o) {
      return '<div class="vv" data-vv-ga="' + esc(o.ga || '') + '">' +
        '<video playsinline preload="none" poster="' + esc(o.poster || '') + '" aria-label="' + esc(o.label || o.title || 'Video') + '">' +
        '<source src="' + esc(o.src) + '" type="video/mp4">' +
        (o.vtt ? '<track kind="captions" srclang="en" label="English" src="' + esc(o.vtt) + '" default>' : '') + '</video>' +
        '<button type="button" class="vv-play" aria-label="Play: ' + esc(o.label || o.title || 'the video') + '">' +
        '<span class="vv-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20"></polygon></svg>' + esc(o.title || 'Watch the video') + '</span>' +
        (o.sub ? '<span class="vv-sub">' + esc(o.sub) + '</span>' : '') + '</button></div>';
    }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.vv-play'); if (!b) return;
    var box = b.parentNode, v = box.querySelector('video');
    b.hidden = true; v.controls = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    ga('video_start', box.getAttribute('data-vv-ga'));
  });
  document.addEventListener('ended', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
    var box = v.closest && v.closest('.vv'); if (box) ga('video_complete', box.getAttribute('data-vv-ga'));
  }, true);
})();
