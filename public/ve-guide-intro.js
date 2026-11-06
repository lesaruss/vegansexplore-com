/*
 * ve-guide-intro.js: "Start here", the opening every Guide carries on its Overview (Sean, 2026-11-06).
 *
 *   VEGuideIntro.html({ guide, name, audience, problem, change, how, open })
 *     guide     the Guide's first name, who they talk to (Liz)
 *     name      the Guide's title (the Vegan Restaurant Guide)
 *     audience  why they are here, one or two sentences in the Guide's words
 *     problem   what problem this Guide solves
 *     change    what is different once they have been through it
 *     how       optional extra steps for this Guide, [[title, text], ...], added after the shared ones
 *     open      true to show it open (visitors); false shows it folded under its heading (members)
 *   VEGuideIntro.wire(root)  makes its Talk to <Guide> and Feedback buttons work (call after drawing)
 *
 * Shared on purpose, so every Guide says the same thing about why we do this, how a Guide works and that it is built with them.
 * A Guide passes only what is its own. The text shows on the page whether or not anyone presses the Guide's Play.
 */
(function () {
  if (window.VEGuideIntro) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var CSS = '.vgi{margin:0 0 22px;border:1px solid var(--line,#e3e8e3);border-radius:12px;background:#fff;}' +
    '.vgi>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;}' +
    '.vgi>summary::-webkit-details-marker{display:none;}' +
    '.vgi>summary b{font-size:15.5px;font-weight:900;display:block;}' +
    '.vgi>summary span{font-size:13px;color:var(--ink75,rgba(0,0,0,.68));}' +
    '.vgi>summary i{font-style:normal;font-size:12px;font-weight:800;color:var(--g,#1f5f22);white-space:nowrap;}' +
    '.vgi[open]>summary i:after{content:"Hide";}.vgi:not([open])>summary i:after{content:"Read it";}' +
    '.vgi-b{padding:0 16px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(420px,100%),1fr));gap:12px;}' +
    '.vgi-c{border:1px solid var(--line,#e3e8e3);border-radius:10px;padding:12px 14px;background:#fbfcfb;}' +
    '.vgi-c h3{font-size:14.5px;font-weight:900;margin:0 0 6px;}' +
    '.vgi-c p{font-size:13.5px;line-height:1.55;color:var(--ink75,rgba(0,0,0,.68));margin:0 0 6px;}' +
    '.vgi-c ol{margin:4px 0 0;padding-left:18px;font-size:13.5px;line-height:1.55;color:var(--ink75,rgba(0,0,0,.68));}' +
    '.vgi-c li{margin:0 0 5px;}.vgi-c li b{color:var(--ink,#1a1a1a);}' +
    '.vgi-c.vgi-w{border-color:var(--g,#1f5f22);background:#f3f8f2;}' +
    '.vgi-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}' +
    '.vgi-acts button{font:inherit;font-size:13px;font-weight:800;border-radius:6px;padding:9px 14px;cursor:pointer;border:1px solid var(--g,#1f5f22);background:var(--g,#1f5f22);color:#fff;}' +
    '.vgi-acts button.alt{background:#fff;color:var(--g,#1f5f22);}' +
    '@media(max-width:560px){.vgi>summary{padding:12px 14px;}.vgi-b{padding:0 12px 12px;}}';
  function css() { if (document.getElementById('vgi-css')) return; var s = document.createElement('style'); s.id = 'vgi-css'; s.textContent = CSS; document.head.appendChild(s); }

  function html(o) {
    css(); o = o || {};
    var G = o.guide || 'your Guide', N = o.name || 'this Guide';
    var how = [
      ['The tabs are the steps', 'Go in order, or jump to the one you need. The address bar keeps your place, so the back button works.'],
      [G + ' walks you through it', 'Press Play beside ' + G + ' to hear each tab, or just read it. Back and Next move you along. Nothing plays until you press it.'],
      ['You cannot break anything', 'Look around, stop, and come back any time. What you save stays on your account.']
    ].concat(o.how || []);
    return '<details class="vgi"' + (o.open === false ? '' : ' open') + '><summary><div><b>Start here</b><span>Why this Guide exists, what it changes for you, and how to use it.</span></div><i aria-hidden="true"></i></summary><div class="vgi-b">' +
      '<div class="vgi-c"><h3>Why you are here</h3><p>' + esc(o.audience) + '</p></div>' +
      '<div class="vgi-c"><h3>Why we do what we do</h3><p>Vegans Explore exists so the Vegan movement grows through the people and businesses that carry it. We have covered the Vegan community since 2016, starting with SoFlo Vegans. When Vegan businesses, groups and causes do well, more people try it, and more people stay. So we build the tools, city by city, with the people who use them.</p></div>' +
      '<div class="vgi-c"><h3>Why ' + esc(N) + ' was made</h3><p>' + esc(o.problem) + '</p></div>' +
      '<div class="vgi-c"><h3>What changes for you</h3><p>' + esc(o.change) + '</p></div>' +
      '<div class="vgi-c"><h3>How to use this Guide</h3><p>If this is your first time using something like this, that is normal. Here is all you need:</p><ol>' +
        how.map(function (h) { return '<li><b>' + esc(h[0]) + '.</b> ' + esc(h[1]) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="vgi-c vgi-w"><h3>It is built with you</h3><p>This Guide is not finished, and it changes with what you tell us. If something is not working, is not clear, or is missing, tell ' + esc(G) + ' or send us feedback. Our team sees what you share with ' + esc(G) + ', so anything ' + esc(G) + ' cannot help with comes straight to a person, and we make sure you get what you need.</p>' +
        '<p>If this does not work for you, you will not use it, and then we have not done our job. Our goal is that you get what you need.</p>' +
        '<div class="vgi-acts"><button type="button" data-vgi-talk>Talk to ' + esc(G) + '</button><button type="button" class="alt" data-vgi-fb>Send feedback</button></div></div>' +
      '</div></details>';
  }
  function wire(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll('[data-vgi-talk]'), function (b) {
      b.addEventListener('click', function () {
        if (window.VEPageGuide) return VEPageGuide.open({});
        if (window.VEFeedback) return VEFeedback.open({ form: true });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-vgi-fb]'), function (b) {
      b.addEventListener('click', function () { if (window.VEFeedback) VEFeedback.open({ form: true }); });
    });
  }
  window.VEGuideIntro = { html: html, wire: wire };
})();
