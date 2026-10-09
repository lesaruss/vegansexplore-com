/* ve-guide-tour.js: a Guide walks the visitor through, on camera (Sean, 2026-10-09: "This is how all of our guides need
 * to be from now on... the guides walking you through and being animated like that").
 *
 * Laid out like the For <Brand> tour (Sean, 2026-10-09: "set up just like how Oatly set up"): one slide at a time, the
 * words on the left of a dark panel and a picture of what the Guide is talking about on the right; the Guide herself
 * (a lip-synced clip, her words in a bubble, a play button) in the page's right column, or on top of the slide on a phone.
 * Nothing plays until Start the tour; from then every Next or Back plays the slide, unless the visitor paused her.
 * Clips are made the For <Brand> way: el-media voice, Wan 2.7, scripts/brand-door/assemble_r5.py.
 *
 *   VEGuideTour.mount(el, {
 *     guide: 'Liz', title: 'Your Guide to Vegans Explore',
 *     narr: rightColumnElement,        // optional: where the Guide sits on wide screens; else a column of its own
 *     wide: '(min-width:769px)',       // optional: when the Guide sits in that column
 *     slides: [{ t: 'Kicker', h: 'Headline', body: '<p>html</p>', pic: '<div class="vgt-camps">...</div>',
 *                say: 'Her words, as recorded', clip: { video, poster } }, ...]
 *   })  ->  { stop }
 *   A button with data-vgt-start inside a slide starts the tour.
 *
 *   Pictures (CSS here): .vgt-logo (a square picture), .vgt-snap (a white card, e.g. a dashboard), .vgt-camps (Coming
 *   cards), .vgt-cities (city art with names), .vgt-choices (two ways forward), .vgt-steps (numbered steps).
 *
 *   VEGuideTour.LIZ_PARTNER: Liz's clips for the locked Partner Dashboard and /apply (pt1 .. pt6).
 */
(function () {
  var MEDIA = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/';
  var M = MEDIA + 'liz/partner-tour/';
  var LIZ_PARTNER = {};
  for (var n = 1; n <= 6; n++) LIZ_PARTNER['pt' + n] = { video: M + 'pt-' + n + '.mp4', poster: M + 'pt-poster-' + n + '.jpg' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('vgt-css')) return;
    var s = document.createElement('style'); s.id = 'vgt-css';
    s.textContent =
      '.vgt{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;align-items:start}' +
      '.vgt.vgt-solo.vgt-wide{grid-template-columns:minmax(0,1fr) 340px}' +
      // The dark panel wears our city at night, faintly, like the For <Brand> tour.
      ".vgt-stage{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:32px;align-items:center;min-height:420px;background:linear-gradient(100deg,rgba(9,20,12,.93) 0%,rgba(9,20,12,.8) 45%,rgba(9,20,12,.6) 100%),#0d1a10 url('" + MEDIA + "communities/south-florida-night.jpg') center/cover no-repeat;color:#fff;border-radius:16px;padding:36px}" +
      '.vgt-stage.nopic{grid-template-columns:minmax(0,1fr)}' +
      '.vgt-k{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8fe3a6;margin:0 0 10px}' +
      '.vgt-words h2{font-size:clamp(24px,2.6vw,34px);font-weight:900;line-height:1.15;margin:0 0 14px;color:#fff;text-transform:none;letter-spacing:normal;text-align:left}' +
      '.vgt-words p{font-size:15px;line-height:1.65;color:rgba(255,255,255,.82);margin:0 0 12px}' +
      '.vgt-words ul{list-style:none;margin:0 0 12px;padding:0}.vgt-words li{font-size:14.5px;line-height:1.55;color:rgba(255,255,255,.82);padding:8px 0 8px 22px;position:relative;border-bottom:1px solid rgba(255,255,255,.08)}' +
      ".vgt-words li::before{content:'';position:absolute;left:4px;top:15px;width:8px;height:8px;border-radius:50%;background:#5EC47A}.vgt-words li b{color:#fff}" +
      '.vgt-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}' +
      '.vgt-btn{display:inline-block;font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer;border-radius:8px;padding:12px 16px;background:#5EC47A;color:#0d2a12;border:1.5px solid #5EC47A}' +
      '.vgt-btn.o{background:transparent;color:#8fe3a6}.vgt-btn:hover{filter:brightness(1.08)}' +
      '.vgt-tag{display:inline-block;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#2b1d00;background:#f3c86b;border-radius:4px;padding:2px 6px;vertical-align:middle}' +
      '.vgt-ctrl{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:14px;font-size:12px;font-weight:800;color:#6b736d}' +
      '.vgt-nav{font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:10px 18px;border-radius:8px;border:1.5px solid rgba(0,0,0,.12);background:#fff;color:#1a1a1a;cursor:pointer}' +
      '.vgt-nav:disabled{opacity:.4;cursor:default}' +
      // The Guide: a white card like the For <Brand> narrator.
      '.vgt-narr{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:16px;color:#1a1a1a;text-align:left}' +
      '.vgt-narr[hidden]{display:none !important}.vgt-side .vgt-narr{position:sticky;top:72px}' +
      '.vgt-vslot{border-radius:12px;overflow:hidden;background:#f6f7f6;aspect-ratio:1/1;margin-bottom:10px}' +
      '.vgt-vid{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer;background:#f6f7f6}' +
      '.vgt-vid.vgt-shift{animation:vgt-shift .55s ease-out}.vgt-vid.vgt-shift.alt{animation-name:vgt-shift-alt}' +
      '@keyframes vgt-shift{from{transform:translateX(-10px) scale(1.04);opacity:.55}to{transform:none;opacity:1}}' +
      '@keyframes vgt-shift-alt{from{transform:translateX(10px) scale(1.04);opacity:.55}to{transform:none;opacity:1}}' +
      '@media(prefers-reduced-motion:reduce){.vgt-vid.vgt-shift{animation:none}}' +
      '.vgt-name{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b736d;margin-bottom:10px}.vgt-name b{font-size:14px;letter-spacing:0;text-transform:none;color:#1a1a1a}' +
      '.vgt-bubble{position:relative;background:#f0faf4;border:1px solid #c8e6c9;border-radius:12px;padding:14px 16px;font-size:14.5px;line-height:1.6;color:#1a1a1a}' +
      ".vgt-bubble::before{content:'';position:absolute;top:-8px;left:26px;width:14px;height:14px;background:#f0faf4;border-left:1px solid #c8e6c9;border-top:1px solid #c8e6c9;transform:rotate(45deg)}" +
      '.vgt-play{font-family:inherit;margin-top:12px;width:100%;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:11px 14px;border-radius:8px;border:1.5px solid #1f5f22;background:#1f5f22;color:#fff;cursor:pointer}' +
      '.vgt-play[aria-pressed="true"]{background:#fff;color:#1f5f22}.vgt-play.go{font-size:13px;padding:14px;background:#5EC47A;border-color:#5EC47A;color:#0d1a10}' +
      '.vgt-main .vgt-narr{margin-bottom:14px}' +
      // Pictures
      '.vgt-logo{width:100%;aspect-ratio:1/1;max-height:340px;border-radius:18px;background:#fff center/72% no-repeat;box-shadow:0 18px 50px rgba(0,0,0,.35)}' +
      '.vgt-logo.cover{background-size:cover}' +
      '.vgt-logo.word{display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-size:clamp(24px,3vw,38px);font-weight:900;line-height:1.1;color:#1f5f22}' +
      '.vgt-snap{background:#fff;border-radius:14px;padding:16px;color:#1a1a1a;box-shadow:0 18px 50px rgba(0,0,0,.35)}' +
      '.vgt-snap-h{display:flex;justify-content:space-between;gap:8px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#6b736d;margin-bottom:10px}' +
      '.vgt-page-id{display:flex;gap:14px;align-items:center;margin:4px 0 14px}.vgt-page-id i{flex:0 0 64px;width:64px;height:64px;border-radius:14px;background:#1f5f22;color:#fff;font-style:normal;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
      '.vgt-page-id i{position:relative}.vgt-page-id i em{position:absolute;inset:0;background:center/cover no-repeat}.vgt-page-id b{display:block;font-size:22px;font-weight:900;line-height:1.15}.vgt-page-id span{font-size:13px;color:#6b736d}' +
      '.vgt-snap-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.vgt-snap-tabs span{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(0,0,0,.12);border-radius:99px;padding:5px 10px;color:#4a5a4d}' +
      '.vgt-snap-tabs span.on{background:#1f5f22;border-color:#1f5f22;color:#fff}' +
      '.vgt-snap-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}.vgt-snap-tiles div{border:1px solid rgba(0,0,0,.1);border-radius:10px;padding:10px 12px}' +
      '.vgt-snap-tiles b{display:block;font-size:22px;font-weight:900;color:#9aa39c;line-height:1.1}.vgt-snap-tiles span{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6b736d}' +
      '.vgt-snap-bars{display:flex;align-items:flex-end;gap:3px;height:64px;border-bottom:1px solid rgba(0,0,0,.1)}.vgt-snap-bars i{flex:1;background:#c8e6c9;border-radius:3px 3px 0 0}' +
      '.vgt-camps{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}' +
      '.vgt-camps>div{border:1px dashed rgba(243,200,107,.5);border-radius:12px;padding:13px 16px;background:rgba(255,255,255,.05);display:flex;flex-direction:column;gap:3px}' +
      '.vgt-camps .vgt-tag{align-self:flex-start;margin-bottom:6px}.vgt-camps b{font-size:15.5px;font-weight:900;color:#fff;line-height:1.25}' +
      '.vgt-camps span{font-size:13px;line-height:1.45;color:rgba(255,255,255,.75)}.vgt-camps em{font-style:normal;font-size:12px;font-weight:800;color:#f3c86b}' +
      '.vgt-cities{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}' +
      '.vgt-cities div{position:relative;aspect-ratio:16/9;border-radius:10px;background:#333 center/cover no-repeat;overflow:hidden}' +
      ".vgt-cities div::before{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.75),rgba(0,0,0,.05) 70%)}" +
      '.vgt-cities span{position:absolute;left:10px;bottom:7px;font-size:12px;font-weight:800;color:#fff}' +
      '.vgt-cities .any{display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);border:1px dashed rgba(143,227,166,.5)}.vgt-cities .any::before{display:none}' +
      '.vgt-cities .any span{position:static;font-size:13px;color:#8fe3a6;text-align:center;padding:8px}' +
      '.vgt-choices{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}' +
      '.vgt-choices>*{display:block;text-decoration:none;background:#fff;border-radius:14px;padding:18px 20px;color:#1a1a1a;box-shadow:0 18px 50px rgba(0,0,0,.3)}' +
      '.vgt-choices small{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#3A9B3E;margin-bottom:4px}' +
      '.vgt-choices b{display:block;font-size:18px;font-weight:900;line-height:1.25;margin-bottom:4px}.vgt-choices span{font-size:13.5px;line-height:1.5;color:#4a5a4d}' +
      '.vgt-steps{list-style:none;margin:0;padding:0;display:grid;gap:10px;counter-reset:vgt}' +
      '.vgt-steps li{counter-increment:vgt;display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start;background:#fff;border-radius:12px;padding:14px 16px;color:#1a1a1a;box-shadow:0 12px 34px rgba(0,0,0,.28)}' +
      ".vgt-steps li::before{content:counter(vgt);width:34px;height:34px;border-radius:50%;background:#1f5f22;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center}" +
      '.vgt-steps b{display:block;font-size:15px;font-weight:900}.vgt-steps span{font-size:13px;line-height:1.5;color:#4a5a4d}' +
      '@media(max-width:900px){.vgt-stage{grid-template-columns:minmax(0,1fr);gap:22px;padding:24px 20px;min-height:0}.vgt-logo{max-width:280px}}' +
      '@media(max-width:600px){.vgt-main .vgt-narr{display:grid;grid-template-columns:120px minmax(0,1fr);gap:4px 12px;align-items:start}.vgt-main .vgt-vslot{grid-row:span 3;margin:0}.vgt-main .vgt-name{margin:0}.vgt-main .vgt-bubble{padding:10px 12px;font-size:13.5px}.vgt-main .vgt-bubble::before{display:none}.vgt-main .vgt-play{margin-top:4px}}';
    document.head.appendChild(s);
  }

  function mount(el, o) {
    if (!el || !o || !o.slides || !o.slides.length) return;
    css();
    var S = { i: 0, started: false, playing: false, paused: false }, slides = o.slides, guide = o.guide || 'Liz';
    var solo = !o.narr, mq = window.matchMedia ? matchMedia(o.wide || (solo ? '(min-width:901px)' : '(min-width:769px)')) : { matches: true };
    el.innerHTML = '<div class="vgt' + (solo ? ' vgt-solo' : '') + '"><div class="vgt-main"><div class="vgt-narr"></div><div class="vgt-slide"></div></div>' +
      (solo ? '<aside class="vgt-side"><div class="vgt-narr"></div></aside>' : '') + '</div>';
    var root = el.firstChild, mobBox = root.querySelector('.vgt-main .vgt-narr');
    var sideBox = solo ? root.querySelector('.vgt-side .vgt-narr') : document.createElement('div');
    if (!solo) { sideBox.className = 'vgt-narr vgt-narr-side'; o.narr.innerHTML = ''; o.narr.appendChild(sideBox); }
    var vid = document.createElement('video');
    vid.className = 'vgt-vid'; vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
    [mobBox, sideBox].forEach(function (b) {
      b.innerHTML = '<div class="vgt-vslot"></div><div class="vgt-name"><b>' + esc(guide) + '</b> &middot; ' + esc(o.title || 'Your Guide to Vegans Explore') + '</div>' +
        '<div class="vgt-bubble"></div><button type="button" class="vgt-play"></button>';
    });
    function clip(i) { return slides[i].clip || {}; }
    function cue(shift) {
      var c = clip(S.i); if (c.video && vid.getAttribute('src') !== c.video) { vid.poster = c.poster || ''; vid.src = c.video; }
      if (shift) { vid.classList.remove('vgt-shift', 'alt'); void vid.offsetWidth; vid.classList.add('vgt-shift'); if (S.i % 2) vid.classList.add('alt'); }
    }
    function play() { cue(); if (!vid.getAttribute('src')) return; vid.play().then(function () { S.playing = true; drawNarr(); }).catch(function () { S.playing = false; drawNarr(); }); }
    function stop() { vid.pause(); S.playing = false; drawNarr(); }
    function start() { S.started = true; S.paused = false; [].forEach.call(el.querySelectorAll('[data-vgt-start]'), function (b) { b.remove(); }); play(); drawNarr(); }
    function toggle() { if (!S.started) return start(); if (S.playing) { S.paused = true; stop(); } else { S.paused = false; play(); } }
    vid.addEventListener('ended', function () { S.playing = false; drawNarr(); });
    vid.addEventListener('click', toggle);
    // One video, in whichever box is showing: the right column on a wide screen, on top of the slide on a phone.
    function place() {
      var wide = !!mq.matches; root.classList.toggle('vgt-wide', wide);
      mobBox.hidden = wide; sideBox.hidden = !wide;
      var slot = (wide ? sideBox : mobBox).querySelector('.vgt-vslot'); if (vid.parentNode !== slot) slot.appendChild(vid);
    }
    function drawNarr() {
      [mobBox, sideBox].forEach(function (b) {
        b.querySelector('.vgt-bubble').textContent = slides[S.i].say || '';
        var p = b.querySelector('.vgt-play'); p.classList.toggle('go', !S.started); p.setAttribute('aria-pressed', String(S.playing));
        p.innerHTML = !S.started ? '&#9654; Start the tour' : S.playing ? 'Pause ' + esc(guide) : '&#9654; Watch ' + esc(guide);
      });
    }
    function draw() {
      var s = slides[S.i], startBtn = !S.started && S.i === 0 && !/data-vgt-start/.test(s.body || '');
      root.querySelector('.vgt-slide').innerHTML =
        '<section class="vgt-stage' + (s.pic ? '' : ' nopic') + '"><div class="vgt-words"><div class="vgt-k">' + (S.i + 1) + ' &middot; ' + esc(s.t) + '</div><h2>' + s.h + '</h2>' + (s.body || '') +
        (startBtn ? '<div class="vgt-btns"><button type="button" class="vgt-btn" data-vgt-start>&#9654; Start the tour</button></div>' : '') + '</div>' +
        (s.pic ? '<div class="vgt-pic">' + s.pic + '</div>' : '') + '</section>' +
        '<div class="vgt-ctrl"><button type="button" class="vgt-nav" data-vgt="-1"' + (S.i ? '' : ' disabled') + '>Back</button><span>' + (S.i + 1) + ' of ' + slides.length + '</span>' +
        '<button type="button" class="vgt-nav" data-vgt="1"' + (S.i < slides.length - 1 ? '' : ' disabled') + '>Next</button></div>';
      if (S.started) [].forEach.call(el.querySelectorAll('[data-vgt-start]'), function (b) { b.remove(); });
      drawNarr();
    }
    function onClick(e) {
      var b;
      if (e.target.closest('[data-vgt-start]')) { start(); return; }
      if (e.target.closest('.vgt-play')) { toggle(); return; }
      if ((b = e.target.closest('[data-vgt]'))) {
        S.i = Math.max(0, Math.min(slides.length - 1, S.i + +b.getAttribute('data-vgt'))); vid.pause(); S.playing = false; draw(); cue(true);
        if (S.started && !S.paused) play();
      }
    }
    el.addEventListener('click', onClick);
    if (!solo) sideBox.addEventListener('click', onClick);
    if (mq.addEventListener) mq.addEventListener('change', place); else if (mq.addListener) mq.addListener(place);
    draw(); cue(); place();
    return { stop: function () { if (S.playing) stop(); } };
  }
  window.VEGuideTour = { mount: mount, LIZ_PARTNER: LIZ_PARTNER, esc: esc };
})();
