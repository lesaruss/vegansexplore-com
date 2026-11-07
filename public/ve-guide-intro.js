/*
 * ve-guide-intro.js: "Start here", the short opening every Guide carries on its Overview.
 * Sean, 2026-11-06 live review of the Restaurant Guide: "very simple, not a lot... how to use this thing". It replaced the
 * six-part version locked earlier the same day, on every Guide (Sean took Logan's default).
 *
 *   VEGuideIntro.html({ place, why, change, how, pic })
 *     place   You are in the right place: who this Guide is for, one sentence
 *     why     why Vegans Explore is the right guide for them: [bold lead, sentence], one or two sentences
 *     change  what they will know or have when they are done
 *     how     how to use it, one sentence (members: pick a topic below; visitors: the first step)
 *     pic     optional picture URL (our illustrated style), shown on the left
 *   VEGuideIntro.wire(root)  kept for older callers; nothing to wire now
 *
 * The Guide's sections sit under it on the page (as headings with pills), so Start here is only instructions.
 */
(function () {
  if (window.VEGuideIntro) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var CSS = '.vgi{display:flex;gap:18px;align-items:flex-start;border:1px solid var(--line,#e3e8e3);border-radius:14px;background:#fff;padding:16px;margin:4px 0 6px;}' +
    '.vgi-pic{flex:0 0 132px;width:132px;height:132px;border-radius:12px;overflow:hidden;background:var(--gl,#eef6ec);}' +
    '.vgi-pic img{display:block;width:100%;height:100%;object-fit:cover;}' +
    '.vgi-k{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--g,#1f5f22);}' +
    '.vgi-b p{margin:6px 0 0;font-size:14px;line-height:1.55;color:var(--ink75,rgba(0,0,0,.68));}.vgi-b p b{color:var(--ink,#1a1a1a);}' +
    '@media(max-width:600px){.vgi{flex-direction:column;}.vgi-pic{width:100%;height:160px;flex-basis:auto;}}';
  function css() { if (document.getElementById('vgi-css')) return; var s = document.createElement('style'); s.id = 'vgi-css'; s.textContent = CSS; document.head.appendChild(s); }
  function html(o) {
    css(); o = o || {};
    var why = o.why || ['Vegans Explore is built for this.', 'We have covered the Vegan community since 2016, city by city.'];
    return '<section class="vgi" aria-label="Start here">' +
      (o.pic ? '<span class="vgi-pic"><img src="' + esc(o.pic) + '" alt="" loading="lazy" decoding="async" width="640" height="640"></span>' : '') +
      '<div class="vgi-b"><div class="vgi-k">Start here</div>' +
      '<p><b>You are in the right place.</b> ' + esc(o.place) + '</p>' +
      '<p><b>' + esc(why[0]) + '</b> ' + esc(why[1]) + '</p>' +
      '<p><b>When you are done,</b> ' + esc(o.change) + '</p>' +
      '<p><b>How to use it:</b> ' + esc(o.how) + '</p></div></section>';
  }
  function wire() {}
  window.VEGuideIntro = { html: html, wire: wire };
})();
