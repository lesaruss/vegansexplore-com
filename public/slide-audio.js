/* Slide narration for the guided pages (partners, Community Manager onboarding).
 *
 * Each slide's media panel can carry a short voice clip, played over a quiet
 * music bed (the bed is pre-leveled in storage, so it plays at full element
 * volume). The first play needs a tap; after that, moving to another slide
 * starts that slide's clip, so the page plays like a guided walkthrough.
 *
 *   VESlideAudio.setup({ bed: url, clips: { key: { url, dur } } })
 *   VESlideAudio.markup(key, poster, caption)   -> HTML for a .media panel
 *   VESlideAudio.onSlide(key)                   -> call from the page's show()
 */
(function () {
  var S = { clips: {}, bed: null, bedEl: null, voice: null, cur: null, armed: false, unlocked: false, startTimer: null, fadeTimer: null };

  var CSS = [
    '.sa-play{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:100%;border:0;background:rgba(0,0,0,0.42);color:#fff;cursor:pointer;font-family:inherit;text-align:center;padding:20px;}',
    '.sa-play:hover{background:rgba(0,0,0,0.5);}',
    '.sa-icon{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;}',
    '.sa-play .sa-pause{display:none;}',
    '.sa-playing .sa-play .sa-go{display:none;}',
    '.sa-playing .sa-play .sa-pause{display:block;}',
    '.sa-label{text-shadow:0 1px 3px rgba(0,0,0,0.6);font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;}',
    '.sa-label span{display:block;font-size:13px;font-weight:600;letter-spacing:0;text-transform:none;opacity:0.9;margin-top:4px;}',
    '.sa-bar{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,0.25);}',
    '.sa-bar i{display:block;height:100%;width:0;background:#22C55E;transition:width 0.25s linear;}'
  ].join('');

  function fmt(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function panel(key) { return document.querySelector('.media[data-sa-key="' + key + '"]'); }
  function track(name, p) { try { if (window.gtag) gtag('event', name, p || {}); } catch (e) {} }

  function setup(cfg) {
    S.clips = cfg.clips || {};
    S.bed = cfg.bed || null;
    if (!document.getElementById('sa-css')) {
      var st = document.createElement('style'); st.id = 'sa-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    S.voice = new Audio(); S.voice.preload = 'none';
    if (S.bed) { S.bedEl = new Audio(); S.bedEl.preload = 'none'; S.bedEl.src = S.bed; }
    S.voice.addEventListener('timeupdate', progress);
    S.voice.addEventListener('ended', function () { track('slide_audio_complete', { clip: S.cur }); endBed(); ui(S.cur, false); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-sa]');
      if (!b) return;
      e.preventDefault();
      var key = b.getAttribute('data-sa');
      if (S.cur === key && !S.voice.paused) { pause(); return; }
      if (S.cur === key && S.voice.paused && S.voice.currentTime > 0 && !S.voice.ended) { resume(); return; }
      S.armed = true;
      play(key);
    });
  }

  function markup(key, poster, cap) {
    var c = S.clips[key] || {};
    return '<img src="' + poster + '" alt="">' +
      '<button type="button" class="sa-play" data-sa="' + key + '" aria-label="Play: ' + cap + '">' +
        '<span class="sa-icon" aria-hidden="true"><svg class="sa-go" width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="sa-pause" width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg></span>' +
        '<span class="sa-label">Hear from me<span>' + cap + (c.dur ? ' &middot; ' + fmt(c.dur) : '') + '</span></span>' +
      '</button><div class="sa-bar" aria-hidden="true"><i></i></div>';
  }

  function ui(key, playing) {
    var p = key && panel(key);
    if (p) p.classList.toggle('sa-playing', !!playing);
  }

  function progress() {
    var p = S.cur && panel(S.cur), bar = p && p.querySelector('.sa-bar i');
    if (bar && S.voice.duration) bar.style.width = Math.min(100, (S.voice.currentTime / S.voice.duration) * 100) + '%';
  }

  function endBed() {
    var b = S.bedEl; if (!b || b.paused) return;
    clearInterval(S.fadeTimer);
    var v = 1;
    S.fadeTimer = setInterval(function () {
      v -= 0.08;
      try { b.volume = Math.max(0, v); } catch (e) {}
      if (v <= 0) { clearInterval(S.fadeTimer); b.pause(); try { b.volume = 1; } catch (e) {} }
    }, 90);
  }

  function stop() {
    clearTimeout(S.startTimer); clearInterval(S.fadeTimer);
    if (S.voice) { S.voice.pause(); }
    if (S.bedEl) { S.bedEl.pause(); try { S.bedEl.volume = 1; } catch (e) {} }
    ui(S.cur, false);
  }

  function play(key) {
    var c = S.clips[key];
    if (!c) return;
    stop();
    S.cur = key;
    var bar = panel(key) && panel(key).querySelector('.sa-bar i'); if (bar) bar.style.width = '0';
    S.voice.src = c.url;
    ui(key, true);
    track('slide_audio_play', { clip: key });
    if (S.bedEl) { S.bedEl.currentTime = 0; S.bedEl.play().catch(function () {}); }
    var go = function () { S.voice.play().then(function () { S.unlocked = true; }).catch(function () { ui(key, false); }); };
    // iOS only starts media inside the tap itself, so the first play is immediate.
    // After that the element is unlocked and a short lead-in lets the bed arrive first.
    if (!S.unlocked || !S.bedEl) go(); else S.startTimer = setTimeout(go, 700);
  }

  function pause() { S.voice.pause(); if (S.bedEl) S.bedEl.pause(); ui(S.cur, false); }
  function resume() { if (S.bedEl) S.bedEl.play().catch(function () {}); S.voice.play().catch(function () {}); ui(S.cur, true); }

  // Called on every slide change: stop what is playing and, once the visitor has
  // chosen to listen, start the new slide's clip.
  function onSlide(key) {
    stop();
    if (S.armed && key && S.clips[key]) play(key);
  }

  window.VESlideAudio = { setup: setup, markup: markup, onSlide: onSlide, stop: stop, has: function (k) { return !!S.clips[k]; } };
})();
