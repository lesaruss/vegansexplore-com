/* ve-header-search.js: the new header's search box for pages that draw their own header (the dashboard), the same box nav.js draws on
   every other page (Sean, 2026-11-03). Markup the page owns: <form class="ve-hs" id="ve-hs" role="search"><label class="ve-hs-field">svg
   <span class="ve-hs-chip" id="ve-hs-chip" hidden></span><input name="q" id="ves-page-input"><kbd>/</kbd></label></form>. This file styles it, loads
   /public/ve-search.js on first use and sends Enter to /search?q=. Keep in step with the search wiring in nav.js. */
(function () {
  if (window.VEHeaderSearch) return;
  var css = [
    '.ve-hs{flex:1 1 auto;max-width:none;width:100%;margin:0;position:relative;min-width:0;}',
    '.ve-hs-field.dict kbd{display:none;}',
    '.ve-hs-field{display:flex;align-items:center;gap:10px;height:44px;border:1.5px solid #2d7d31;border-radius:6px;padding:0 14px;background:#fff;box-shadow:0 0 0 3px rgba(58,155,62,.12);margin:0;cursor:text;}',
    '.ve-hs-field:focus-within{box-shadow:0 0 0 3px rgba(58,155,62,.28);}',
    '.ve-hs-field>svg{width:18px;height:18px;flex:none;stroke:#1a1a1a;fill:none;stroke-width:2.3;stroke-linecap:round;}',
    '.ve-hs-field input{flex:1;min-width:0;border:0;outline:0;background:none;font:600 14px Montserrat,sans-serif;color:#1a1a1a;height:100%;padding:0;}',
    '.ve-hs-field input::placeholder{color:#5a5a5a;font-weight:600;opacity:1;}',
    '.ve-hs-field kbd{font:800 11px Montserrat,sans-serif;border:1.5px solid rgba(0,0,0,.18);border-radius:4px;padding:1px 7px;color:#555;flex:none;}',
    '.ve-hs .ves-list{top:calc(100% + 8px);}',
    '@media(max-width:700px){.ve-hs-field kbd{display:none;}}'
  ].join('');
  function attach(form) {
    if (!form || form._vehs) return; form._vehs = true;
    var st = document.getElementById('ve-hs-css');
    if (!st) { st = document.createElement('style'); st.id = 've-hs-css'; st.textContent = css; document.head.appendChild(st); }
    var input = form.querySelector('input'), mounted = false;
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) input.setAttribute('data-dictate', 'off');
    else input.closest('.ve-hs-field').classList.add('dict');
    function go(q) { q = (q || '').trim(); if (q.length < 2) return; location.href = '/search?q=' + encodeURIComponent(q); }
    function ensure() {
      if (mounted) return; mounted = true;
      function m() { window.VESearch.mount(input, { host: form, onSubmit: go, dictate: !input.hasAttribute('data-dictate') }); if (input.value.trim().length >= 2) input.dispatchEvent(new Event('input')); }
      if (window.VESearch) { m(); return; }
      var ss = document.createElement('script'); ss.src = '/public/ve-search.js'; ss.onload = m; (document.head || document.documentElement).appendChild(ss);
    }
    input.addEventListener('focus', ensure); input.addEventListener('input', ensure);
    form.addEventListener('submit', function (e) { e.preventDefault(); ensure(); go(input.value); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault(); input.focus(); input.select();
    });
  }
  window.VEHeaderSearch = { attach: attach };
  function auto() { attach(document.getElementById('ve-hs')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
