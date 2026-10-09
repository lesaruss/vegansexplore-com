/* ve-guide-tour.js: a Guide walks the visitor through, on camera (Sean, 2026-10-09: "This is how all of our guides need
 * to be from now on... the guides walking you through and being animated like that").
 *
 * One slide at a time: words on the left, the Guide on the right (a lip-synced clip, her words in a bubble under it).
 * Nothing plays until Start the tour; from then every Next or Back plays the slide, unless the visitor paused her.
 * Clips are made the For <Brand> way: el-media voice, Wan 2.7, scripts/brand-door/assemble_r5.py.
 *
 *   VEGuideTour.mount(el, {
 *     guide: 'Liz', title: 'Your Guide to Vegans Explore',
 *     slides: [{ t: 'Kicker', h: 'Headline', body: '<p>html</p>', say: 'Her words', clip: { video, poster } }, ...]
 *   })
 *   A button with data-vgt-start inside a slide starts the tour.
 *
 *   VEGuideTour.LIZ_PARTNER: Liz's clips for the locked Partner Dashboard and /apply (pt-1 .. pt-6).
 */
(function () {
  var M = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/partner-tour/';
  var LIZ_PARTNER = {};
  for (var n = 1; n <= 6; n++) LIZ_PARTNER['pt' + n] = { video: M + 'pt-' + n + '.mp4', poster: M + 'pt-poster-' + n + '.jpg' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('vgt-css')) return;
    var s = document.createElement('style'); s.id = 'vgt-css';
    s.textContent =
      '.vgt{color:#fff}' +
      ".vgt-stage{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:center;min-height:380px;border-radius:16px;padding:30px;background:linear-gradient(100deg,rgba(9,20,12,.94),rgba(9,20,12,.8)),url('https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/communities/south-florida-night.jpg') center/cover #0d1a10}" +
      '.vgt-k{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8fe3a6;margin:0 0 8px}' +
      '.vgt-words h2{font-size:clamp(22px,2.4vw,30px);font-weight:900;line-height:1.2;margin:0 0 12px;color:#fff;text-transform:none;letter-spacing:normal;text-align:left}' +
      '.vgt-words p{font-size:15px;line-height:1.6;color:rgba(255,255,255,.84);margin:0 0 12px}' +
      '.vgt-words ul{list-style:none;margin:0 0 10px;padding:0}.vgt-words li{font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.84);padding:8px 0 8px 22px;position:relative;border-bottom:1px solid rgba(255,255,255,.08)}' +
      ".vgt-words li::before{content:'';position:absolute;left:4px;top:15px;width:8px;height:8px;border-radius:50%;background:#5EC47A}.vgt-words li b{color:#fff}" +
      '.vgt-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}' +
      '.vgt-btn{display:inline-block;font:inherit;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer;border-radius:8px;padding:12px 18px;background:#5EC47A;color:#0d2a12;border:1px solid #5EC47A}' +
      '.vgt-btn.o{background:transparent;color:#8fe3a6;border-color:rgba(143,227,166,.6)}' +
      '.vgt-tag{display:inline-block;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#2b1d00;background:#f3c86b;border-radius:4px;padding:2px 6px;vertical-align:middle;margin-left:4px}' +
      '.vgt-guide{display:flex;flex-direction:column;gap:10px}' +
      '.vgt-vid{width:100%;aspect-ratio:1;border-radius:14px;background:#fff center/cover;object-fit:cover;display:block;cursor:pointer}' +
      '.vgt-name{font-size:12px;color:rgba(255,255,255,.7)}.vgt-name b{color:#fff;font-size:14px}' +
      '.vgt-bubble{background:rgba(255,255,255,.95);color:#123d18;border-radius:12px;padding:10px 13px;font-size:13.5px;line-height:1.5}' +
      '.vgt-play{font:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:#5EC47A;color:#0d2a12;border:0;border-radius:8px;padding:10px 12px;cursor:pointer}' +
      '.vgt-ctrl{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:14px;color:#4a5a4d;font-size:13px;font-weight:700}' +
      '.vgt-nav{font:inherit;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:#fff;color:#1a1a1a;border:1px solid rgba(0,0,0,.15);border-radius:8px;padding:10px 18px;cursor:pointer}' +
      '.vgt-nav[disabled]{opacity:.4;cursor:default}' +
      '@media(max-width:900px){.vgt-stage{grid-template-columns:minmax(0,1fr);padding:22px 18px;min-height:0}.vgt-guide{order:-1;flex-direction:row;align-items:flex-start;gap:12px}.vgt-vid{width:120px;flex:0 0 120px}.vgt-guide-side{flex:1;display:flex;flex-direction:column;gap:8px}}';
    document.head.appendChild(s);
  }

  function mount(el, o) {
    if (!el || !o || !o.slides || !o.slides.length) return;
    css();
    var S = { i: 0, started: false, playing: false, paused: false }, slides = o.slides, guide = o.guide || 'Liz';
    var vid = document.createElement('video');
    vid.className = 'vgt-vid'; vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
    function clip(i) { return slides[i].clip || {}; }
    function cue() { var c = clip(S.i); if (c.video && vid.getAttribute('src') !== c.video) { vid.poster = c.poster || ''; vid.src = c.video; } }
    function play() { cue(); if (!vid.src) return; vid.play().then(function () { S.playing = true; drawGuide(); }).catch(function () { S.playing = false; drawGuide(); }); }
    function stop() { vid.pause(); S.playing = false; }
    function start() { S.started = true; S.paused = false; play(); draw(); }
    vid.addEventListener('ended', function () { S.playing = false; drawGuide(); });
    vid.addEventListener('click', function () { if (!S.started) return start(); if (S.playing) { S.paused = true; stop(); drawGuide(); } else { S.paused = false; play(); } });
    function drawGuide() {
      var b = el.querySelector('.vgt-play'); if (b) b.innerHTML = !S.started ? '&#9654; Start the tour' : S.playing ? 'Pause ' + esc(guide) : '&#9654; Hear ' + esc(guide);
    }
    function draw() {
      var s = slides[S.i];
      el.innerHTML = '<div class="vgt"><div class="vgt-stage"><div class="vgt-words"><div class="vgt-k">' + (S.i + 1) + ' &middot; ' + esc(s.t) + '</div><h2>' + s.h + '</h2>' + s.body +
        (S.started ? '' : (S.i === 0 && !/data-vgt-start/.test(s.body) ? '<div class="vgt-btns"><button type="button" class="vgt-btn" data-vgt-start>&#9654; Start the tour</button></div>' : '')) + '</div>' +
        '<div class="vgt-guide"><div class="vgt-slot"></div><div class="vgt-guide-side"><div class="vgt-name"><b>' + esc(guide) + '</b> &middot; ' + esc(o.title || 'Your Guide to Vegans Explore') + '</div>' +
        '<div class="vgt-bubble">' + esc(s.say) + '</div><button type="button" class="vgt-play"></button></div></div></div>' +
        '<div class="vgt-ctrl"><button type="button" class="vgt-nav" data-vgt="-1"' + (S.i ? '' : ' disabled') + '>Back</button><span>' + (S.i + 1) + ' of ' + slides.length + '</span>' +
        '<button type="button" class="vgt-nav" data-vgt="1"' + (S.i < slides.length - 1 ? '' : ' disabled') + '>Next</button></div></div>';
      if (S.started) [].forEach.call(el.querySelectorAll('[data-vgt-start]'), function (b) { b.remove(); });
      el.querySelector('.vgt-slot').appendChild(vid);
      cue(); drawGuide();
    }
    el.addEventListener('click', function (e) {
      var b;
      if (e.target.closest('[data-vgt-start]')) { start(); return; }
      if (e.target.closest('.vgt-play')) { if (!S.started) start(); else if (S.playing) { S.paused = true; stop(); drawGuide(); } else { S.paused = false; play(); } return; }
      if ((b = e.target.closest('[data-vgt]'))) {
        S.i = Math.max(0, Math.min(slides.length - 1, S.i + +b.getAttribute('data-vgt'))); stop(); draw();
        if (S.started && !S.paused) play();
      }
    });
    draw();
    return { stop: stop };
  }
  window.VEGuideTour = { mount: mount, LIZ_PARTNER: LIZ_PARTNER, esc: esc };
})();
