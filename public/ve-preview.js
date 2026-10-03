/* Preview mode for the onboarding pages (Sean, 2026-10-03: "see all of the onboarding
 * sequences ... without having to go through the process").
 *
 * Add ?preview=<state> to /welcome, /partners or /community-managers/onboarding and the
 * page shows a screen that normally only appears after signing up, paying or applying.
 * Each page reads the same parameter itself and turns off everything that would save,
 * send, upload or charge. This file only draws the amber Preview tag, so it is never
 * mistaken for the live experience, and links back to the Depot's journey list.
 *
 * The journeys and every preview state are listed at /admin/depot/preview.
 */
(function () {
  var state = '';
  try { state = new URLSearchParams(location.search).get('preview') || ''; } catch (e) {}
  if (!state) return;
  window.VE_PREVIEW = state;
  function mount() {
    if (document.getElementById('ve-preview-tag')) return;
    var st = document.createElement('style');
    st.textContent = '#ve-preview-tag{position:fixed;left:10px;bottom:10px;z-index:10050;display:flex;align-items:center;gap:8px;max-width:calc(100% - 20px);' +
      'font-family:"Montserrat",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:12px;font-weight:700;line-height:1.3;color:#451a03;background:#FEF3C7;border:1.5px solid #B45309;border-radius:99px;padding:4px 4px 4px 12px;box-shadow:0 6px 18px rgba(0,0,0,0.18);}' +
      '#ve-preview-tag b{font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#92400E;}' +
      '#ve-preview-tag .ve-pv-note{display:none;}' +
      '@media (min-width:900px){#ve-preview-tag .ve-pv-note{display:inline;}}' +
      '#ve-preview-tag a{color:#451a03;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;}' +
      '#ve-preview-tag button{appearance:none;border:0;background:none;font:inherit;font-size:18px;line-height:1;color:#92400E;width:32px;height:32px;border-radius:50%;cursor:pointer;}' +
      '#ve-preview-tag button:hover{background:#fde68a;}';
    document.head.appendChild(st);
    var tag = document.createElement('div');
    tag.id = 've-preview-tag';
    tag.setAttribute('role', 'note');
    tag.title = 'Preview mode: nothing here is saved, sent or charged.';
    tag.innerHTML = '<b>Preview</b><span class="ve-pv-note">Nothing here is saved, sent or charged.</span><a href="/admin/depot/preview">All journeys</a>' +
      '<button type="button" aria-label="Hide the preview tag">&times;</button>';
    tag.querySelector('button').addEventListener('click', function () { tag.remove(); });
    document.body.appendChild(tag);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
