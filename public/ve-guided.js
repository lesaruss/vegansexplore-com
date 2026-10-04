/* ve-guided.js: the guided view, one slide at a time (Sean, 2026-10-04: "I say this every
 * time... put it in that view so we're navigating through and seeing everything").
 *
 * Every mock, demo and walkthrough page uses this instead of a long scroll. It is the
 * Partners page format (/partners, 2026-09-24): one full-height slide on a dark stage, the
 * words on dark glass, Back / "N of M" / Next at the bottom, arrow keys, and on desktop the
 * nav, the stage and the footer share one screen so nothing scrolls. On phones each slide
 * stacks and the controls sit right after its content. The address bar carries the slide
 * (#slide-id), so Back in the browser steps back and a link can open any slide.
 *
 * Markup (the page owns its slide content and styles; this file owns the shell):
 *
 *   <div class="page-frame">
 *     <script src="/public/nav.js"></script>
 *     <div class="vg-note">optional one-line notice, e.g. Illustrative</div>
 *     <main class="vg-stage" data-bg="/path/to/photo.jpg" aria-label="...">
 *       <section class="vg-slide" id="cover" data-title="Start">...</section>
 *       <section class="vg-slide" id="pick" data-title="Pick a side" data-vg-choose>
 *         <button data-vg-path="sponsor">Sponsor</button> ...
 *       </section>
 *       <section class="vg-slide" id="sponsor-1" data-path="sponsor" data-title="...">...</section>
 *       <section class="vg-slide" id="end" data-title="...">...</section>
 *     </main>
 *     <script src="/public/footer.js"></script>
 *   </div>
 *   <script src="/public/ve-guided.js"></script>
 *
 * Paths: slides with data-path only join the walk once that path is picked on a
 * data-vg-choose slide. Picking marks the choice and shows Next (nothing jumps by surprise,
 * same as the campaign pages); Next then opens that path's first slide. Slides without
 * data-path are shared by everyone, in page order.
 * Buttons: [data-vg-go="slide-id"] jumps to a slide; [data-vg-next] acts like Next.
 * Event: 'vg:change' on document, detail { id, index, total }, after every move.
 * Styling helpers: .vg-eyebrow .vg-h .vg-lede .vg-split .vg-glass .vg-panel .vg-btn .vg-btn-ghost
 */
(function () {
  if (window.VEGuided) return;

  var CSS = [
    '.vg-stage{position:relative;height:calc(100vh - 61px);min-height:560px;overflow:hidden;background:#0d130e center/cover no-repeat;color:#fff;font-family:"Montserrat",sans-serif;}',
    '.vg-stage.vg-photo::before{content:"";position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.84) 38%,rgba(0,0,0,0.62) 66%,rgba(0,0,0,0.5) 100%);pointer-events:none;}',
    '.vg-stage::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 30%);pointer-events:none;}',
    '.vg-bg{display:none;}',
    '.vg-slide{position:absolute;inset:0;z-index:1;display:none;padding:44px max(40px,calc((100% - 1320px)/2)) 96px;overflow-y:auto;scrollbar-width:thin;}',
    '.vg-slide.vg-active{display:block;animation:vgIn .25s ease;}',
    '@keyframes vgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '.vg-nav{position:absolute;left:0;right:0;bottom:0;z-index:5;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;padding:12px max(40px,calc((100% - 1320px)/2)) 18px;}',
    '.vg-nav .vg-back{justify-self:start;}',
    '.vg-nav .vg-next{justify-self:end;}',
    '.vg-count{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}',
    '.vg-dots{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;}',
    '.vg-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.3);transition:background .2s,transform .2s;}',
    '.vg-dots i.vg-done{background:rgba(255,255,255,0.65);}',
    '.vg-dots i.vg-on{background:#22C55E;transform:scale(1.3);}',
    '.vg-step{font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#fff;}',
    '.vg-step span{color:#c5f2c7;}',
    '.vg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:13px 24px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;cursor:pointer;border:0;background:#22C55E;color:#03170a;}',
    '.vg-btn:hover{background:#4ade80;}',
    '.vg-btn-ghost{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.45);}',
    '.vg-btn-ghost:hover{background:rgba(255,255,255,0.08);border-color:#fff;}',
    '.vg-btn[hidden]{display:none;}',
    '.vg-back{background:none;border:0;color:#fff;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;padding:14px 8px;cursor:pointer;}',
    '.vg-back[disabled]{visibility:hidden;}',
    '.vg-stage :focus-visible{outline:3px solid #F69820;outline-offset:3px;}',
    '.vg-note{flex:none;background:#2b1d06;color:#ffd79a;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:600;line-height:1.45;padding:9px max(40px,calc((100% - 1320px)/2));border-bottom:1px solid rgba(246,152,32,0.35);}',
    '.vg-note strong{font-weight:900;letter-spacing:0.12em;text-transform:uppercase;font-size:10px;margin-right:8px;color:#F69820;}',
    '.vg-note a{color:#ffd79a;font-weight:800;}',
    '.vg-eyebrow{font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#c5f2c7;margin-bottom:12px;}',
    '.vg-h{font-size:clamp(26px,3vw,40px);font-weight:900;line-height:1.05;letter-spacing:-0.02em;text-transform:uppercase;margin-bottom:16px;color:#fff;}',
    '.vg-h.vg-xl{font-size:clamp(34px,4.6vw,60px);}',
    '.vg-lede{font-size:16px;line-height:1.65;color:#fff;max-width:760px;margin-bottom:16px;}',
    '.vg-fine{font-size:13px;line-height:1.6;color:#ececec;max-width:860px;margin-top:12px;}',
    '.vg-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:48px;align-items:start;}',
    '.vg-glass{background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.22);border-radius:12px;color:#fff;}',
    '.vg-panel{background:#fff;color:#1a1a1a;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,0.35);}',
    '.vg-pick{cursor:pointer;font-family:inherit;text-align:left;width:100%;}',
    '.vg-pick.vg-picked{border-color:#22C55E !important;background:rgba(6,32,12,0.78) !important;box-shadow:0 0 0 2px #22C55E inset;}',
    /* Desktop: nav, notice, stage and footer share one screen; nothing scrolls. */
    '@media (min-width:901px){html.vg-on,html.vg-on body{overflow:hidden;height:100%;}html.vg-on .page-frame{display:flex;flex-direction:column;height:100vh;}html.vg-on .vg-stage{flex:1 1 auto;height:auto;min-height:0;}html.vg-on .ve-footer-inner{padding-top:18px;padding-bottom:18px;}}',
    '@media (min-width:901px) and (max-height:820px){.vg-slide{padding-top:28px;padding-bottom:84px;}.vg-h{font-size:clamp(24px,2.5vw,32px);margin-bottom:10px;}.vg-lede{font-size:15px;margin-bottom:10px;}.vg-nav{padding-top:8px;padding-bottom:10px;}}',
    /* Phones and tablets: a slide stacks, the page scrolls within it, controls follow it. */
    '@media (max-width:900px){.vg-stage{height:auto;min-height:0;overflow:visible;background-image:none !important;}.vg-stage::before,.vg-stage::after{display:none;}.vg-bg{display:block;position:fixed;inset:0;z-index:-1;background:#0d130e center/cover no-repeat;}.vg-bg::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,0.78);}.vg-slide{position:relative;inset:auto;padding:28px 16px 8px;overflow:visible;}.vg-nav{position:relative;padding:8px 16px 32px;}.vg-split{grid-template-columns:minmax(0,1fr);gap:22px;}.vg-note{padding:9px 16px;}}',
    '@media print{.vg-nav{display:none;}.vg-slide{display:block !important;position:relative;page-break-after:always;}html.vg-on,html.vg-on body{overflow:visible;height:auto;}.vg-stage{height:auto;overflow:visible;}}'
  ].join('');

  function init() {
    var stage = document.querySelector('.vg-stage');
    if (!stage) return;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    document.documentElement.classList.add('vg-on');

    var bg = stage.getAttribute('data-bg');
    var bgLayer = document.createElement('div');
    bgLayer.className = 'vg-bg';
    bgLayer.setAttribute('aria-hidden', 'true');
    stage.insertBefore(bgLayer, stage.firstChild);
    if (bg) {
      var val = /^(url|linear|radial)/.test(bg) ? bg : "url('" + bg + "')";
      stage.style.backgroundImage = val;
      bgLayer.style.backgroundImage = val;
      if (/^url|^\//.test(bg)) stage.classList.add('vg-photo');
    }

    var slides = [].slice.call(stage.querySelectorAll('.vg-slide'));
    slides.forEach(function (s) { s.setAttribute('aria-roledescription', 'slide'); });
    stage.setAttribute('aria-roledescription', 'carousel');

    var nav = document.createElement('nav');
    nav.className = 'vg-nav';
    nav.setAttribute('aria-label', 'Slide navigation');
    nav.innerHTML = '<button type="button" class="vg-back">Back</button>' +
      '<div class="vg-count"><div class="vg-dots" aria-hidden="true"></div><div class="vg-step" aria-live="polite"></div></div>' +
      '<button type="button" class="vg-btn vg-next">Next</button>';
    stage.appendChild(nav);
    var backBtn = nav.querySelector('.vg-back'), nextBtn = nav.querySelector('.vg-next');
    var dotsEl = nav.querySelector('.vg-dots'), stepEl = nav.querySelector('.vg-step');

    var path = null, cur = null, pickedOn = {};

    function seq() { return slides.filter(function (s) { var p = s.getAttribute('data-path'); return !p || p === path; }); }
    function byId(id) { for (var i = 0; i < slides.length; i++) if (slides[i].id === id) return slides[i]; return null; }
    function firstOf(p) { for (var i = 0; i < slides.length; i++) if (slides[i].getAttribute('data-path') === p) return slides[i]; return null; }
    function markPicked() {
      [].forEach.call(stage.querySelectorAll('[data-vg-path]'), function (b) {
        var host = b.closest('.vg-slide');
        var on = !!host && pickedOn[host.id] === b.getAttribute('data-vg-path');
        b.classList.toggle('vg-picked', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function render(slide) {
      cur = slide;
      var list = seq(), i = list.indexOf(slide);
      slides.forEach(function (s) { s.classList.toggle('vg-active', s === slide); });
      slide.scrollTop = 0;
      if (window.innerWidth <= 900) window.scrollTo(0, 0);
      var choose = slide.hasAttribute('data-vg-choose');
      backBtn.disabled = i <= 0;
      nextBtn.hidden = choose ? !pickedOn[slide.id] : i >= list.length - 1;
      dotsEl.innerHTML = list.map(function (s, k) { return '<i class="' + (k === i ? 'vg-on' : k < i ? 'vg-done' : '') + '"></i>'; }).join('');
      var title = slide.getAttribute('data-title') || '';
      stepEl.innerHTML = (i + 1) + ' of ' + list.length + (title ? ' <span>· ' + title + '</span>' : '');
      slide.setAttribute('aria-label', (i + 1) + ' of ' + list.length + (title ? ': ' + title : ''));
      markPicked();
      document.dispatchEvent(new CustomEvent('vg:change', { detail: { id: slide.id, index: i, total: list.length } }));
    }

    function go(slide) {
      if (!slide) return;
      var p = slide.getAttribute('data-path');
      if (p) path = p;
      var first = seq()[0];
      var hash = slide === first ? '' : '#' + slide.id;
      if (('#' + slide.id) === location.hash || (!hash && !location.hash)) { render(slide); return; }
      if (hash) location.hash = hash;
      else { history.pushState(null, '', location.pathname + location.search); render(slide); }
    }

    function next() {
      var list = seq(), i = list.indexOf(cur);
      if (cur.hasAttribute('data-vg-choose') && path) { go(firstOf(path)); return; }
      if (i < list.length - 1) go(list[i + 1]);
    }
    function back() {
      var list = seq(), i = list.indexOf(cur);
      if (i > 0) go(list[i - 1]);
    }

    backBtn.addEventListener('click', back);
    nextBtn.addEventListener('click', next);
    stage.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-vg-path]');
      if (pick) { path = pick.getAttribute('data-vg-path'); pickedOn[cur.id] = path; render(cur); return; }
      var to = e.target.closest('[data-vg-go]');
      if (to) { e.preventDefault(); go(byId(to.getAttribute('data-vg-go'))); return; }
      if (e.target.closest('[data-vg-next]')) { e.preventDefault(); next(); }
    });
    document.addEventListener('keydown', function (e) {
      var t = (e.target || {}).tagName;
      if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(t)) return;
      if (e.key === 'ArrowRight' && !nextBtn.hidden) { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' && !backBtn.disabled) { e.preventDefault(); back(); }
    });

    function fromHash() {
      var s = byId((location.hash || '').slice(1));
      if (s && s.getAttribute('data-path')) {
        path = s.getAttribute('data-path');
        slides.forEach(function (c) { if (c.hasAttribute('data-vg-choose') && !pickedOn[c.id] && slides.indexOf(c) < slides.indexOf(s)) pickedOn[c.id] = path; });
      }
      render(s || seq()[0]);
    }
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('popstate', fromHash);
    fromHash();

    window.VEGuided = { go: function (id) { go(byId(id)); }, next: next, back: back, current: function () { return cur && cur.id; } };
  }

  window.VEGuided = null;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
