/* The Explorer card (playbook ve-explorer-path, Sean 2026-11-08): the bridge from reading a Guide to becoming a member.
 * "The Explorer survey could live on its own on other guides as that bridge between them getting the information and becoming a member."
 * One card any Guide can end on. Someone not yet a member: take the Explorer survey (free, about two minutes, 250 points); finishing it
 * makes them a member at once and sends them back to `back` (sessionStorage ve_after_survey, read by survey.html). A member: their next step.
 *
 *   VEExplorerCard.html({ back: '/passport#/founder', member: bool, next: { label, href } })
 *   VEExplorerCard.wire(root)
 */
(function () {
  if (window.VEExplorerCard) return;
  var DEADLINE = Date.parse('2027-01-01T05:00:00Z');
  var CSS = '.vxc{display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:22px 0 4px;padding:18px 20px;border:1px solid var(--gm,#b8ddb9);border-radius:12px;background:var(--gl,#e8f5e9);}' +
    '.vxc-b{flex:1 1 320px;min-width:0;}.vxc-k{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--g,#1f5f22);}' +
    '.vxc h3{margin:4px 0 4px;font-size:19px;font-weight:900;line-height:1.25;color:#1a1a1a;}.vxc p{margin:0;font-size:14px;line-height:1.55;color:rgba(26,26,26,.78);}' +
    '.vxc-go{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 20px;border-radius:6px;border:0;background:#22C55E;color:#03170a;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;}' +
    '.vxc-go:hover{background:#4ade80;}@media(max-width:600px){.vxc-go{width:100%;}}';
  function css() { if (document.getElementById('vxc-css')) return; var s = document.createElement('style'); s.id = 'vxc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function html(o) {
    css(); o = o || {};
    if (o.member) {
      var n = o.next || { label: 'Open your dashboard', href: '/dashboard' };
      return '<section class="vxc" aria-label="You are an Explorer"><div class="vxc-b"><div class="vxc-k">You are an Explorer</div><h3>You are in.</h3><p>Everything here is open to you.</p></div>' +
        '<a class="vxc-go" href="' + esc(n.href) + '">' + esc(n.label) + '</a></section>';
    }
    var open = Date.now() < DEADLINE;
    return '<section class="vxc" aria-label="Become a member"><div class="vxc-b"><div class="vxc-k">' + (open ? 'Become a Founder, free' : 'Become a member, free') + '</div>' +
      '<h3>Ready? Take the Explorer survey.</h3><p>A few quick questions, about two minutes, and you are in, with 250 points.' +
      (open ? ' Join before midnight Eastern on January 1, 2027 and you are a Founding Member for good.' : '') + '</p></div>' +
      '<button type="button" class="vxc-go" data-vxc-go data-back="' + esc(o.back || '') + '">Take the survey</button></section>';
  }
  function go(back) {
    try { if (back && /^\/(?!\/)/.test(back)) sessionStorage.setItem('ve_after_survey', back); } catch (e) {}
    location.href = '/survey?s=explorer';
  }
  function wire(root) {
    (root || document).querySelectorAll('[data-vxc-go]').forEach(function (b) {
      if (b._vxc) return; b._vxc = 1;
      b.addEventListener('click', function () { go(b.getAttribute('data-back')); });
    });
  }
  window.VEExplorerCard = { html: html, wire: wire, go: go };
})();
