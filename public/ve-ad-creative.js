/* Ad creatives for every ad slot (Sean, 2026-10-04).
 * The ad-resolve function returns each slot's creative (image_url) and its tracked link (link_url).
 * A creative is either an image, shown as a link, or an HTML5 ad (a .html file), loaded in a
 * sandboxed frame with the tracked link passed as ?clickTag= (the industry convention). An HTML5 ad
 * runs its own story and opens the link itself; it posts {veAd:'click'} to this page so the click
 * is counted against the slot like an image click.
 *
 *   el.innerHTML = VEAdCreative.markup(ad, { imgClass: 'bb-ad-img', linkClass: 'bb-ad-link' });
 *
 * Load this before any script that renders ads. Example: /ads/humble-cabbage/ve-tee.html.
 */
(function () {
  var CLICK_FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ad-click';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isRich(url) { return /\.html?(\?|#|$)/i.test(String(url || '')); }

  function click(placementId, campaignId) {
    if (!placementId || !campaignId) return;
    try {
      navigator.sendBeacon(CLICK_FN, new Blob([JSON.stringify({ placement_id: placementId, campaign_id: campaignId })], { type: 'text/plain' }));
    } catch (e) { /* the visitor still reaches the advertiser */ }
  }

  function markup(ad, opts) {
    opts = opts || {};
    if (!ad || !ad.image_url) return '';
    var ids = ' data-placement="' + esc(ad.placement_id || '') + '" data-campaign="' + esc(ad.campaign_id || '') + '"';
    if (isRich(ad.image_url)) {
      var src = ad.image_url + (ad.image_url.indexOf('?') > -1 ? '&' : '?') + 'clickTag=' + encodeURIComponent(ad.link_url || '');
      return '<iframe class="ve-ad-frame' + (opts.frameClass ? ' ' + esc(opts.frameClass) : '') + '"' + ids +
        ' src="' + esc(src) + '" title="Advertisement" loading="lazy" scrolling="no"' +
        ' sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"' +
        ' style="display:block;width:100%;height:100%;border:0;overflow:hidden"></iframe>';
    }
    return '<a class="' + esc(opts.linkClass || '') + '"' + ids + ' href="' + esc(ad.link_url || '#') +
      '" target="_blank" rel="noopener noreferrer sponsored" onclick="VEAdCreative.click(this.dataset.placement,this.dataset.campaign)">' +
      '<img class="' + esc(opts.imgClass || '') + '" src="' + esc(ad.image_url) + '" alt="Advertisement"></a>';
  }

  // An HTML5 ad reports its own click; match the message to the frame it came from.
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.veAd !== 'click') return;
    var frames = document.querySelectorAll('iframe.ve-ad-frame');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) { click(frames[i].dataset.placement, frames[i].dataset.campaign); return; }
    }
  });

  window.VEAdCreative = { markup: markup, isRich: isRich, click: click };
})();
