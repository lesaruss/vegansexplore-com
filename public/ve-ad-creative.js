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

  // A Guide ad's Listen bar (playbook ve-guide-banner-audio, 2026-11-09): 'listen' when play is first pressed, 'heard' when it plays to the
  // end. A listen counts against the slot beside its views and clicks (ad_impressions.listens, ve_house_ad_count), and both count for the
  // page in ve_promo_events (promo guide-<slug>, cta 'rail'), the same visitor id as the listing banner. Bots are never counted.
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var BOT = /bot|crawl|spider|preview|HeadlessChrome|Lighthouse/i.test(navigator.userAgent || '');
  function rpc(fn, body) {
    try { fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify(body) }).catch(function () {}); } catch (e) {}
  }
  function visitor() {
    try {
      var v = localStorage.getItem('ve_visitor');
      if (!v || !/^[A-Za-z0-9-]{8,64}$/.test(v)) { v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 12); localStorage.setItem('ve_visitor', v); }
      return v;
    } catch (e) { return ''; }
  }
  function listen(frame, kind, slug) {
    if (BOT || !/^[a-z0-9-]{2,34}$/.test(String(slug || ''))) return;
    if (kind === 'listen' && frame.dataset.placement && frame.dataset.campaign) rpc('ve_house_ad_count', { p_placement: frame.dataset.placement, p_campaign: frame.dataset.campaign, p_kind: 'listen' });
    var v = visitor(), L = {}; try { L = JSON.parse(sessionStorage.getItem('ve_landing') || '{}') || {}; } catch (e) {}
    if (v) rpc('ve_promo_track', { p_promo: 'guide-' + slug, p_step: kind, p_visitor: v, p_page: location.pathname, p_listing: null, p_cta: 'rail', p_channel: L.channel || null, p_vl: L.vl || null });
  }

  // An HTML5 ad reports its own click (and a Guide ad its listens); match the message to the frame it came from.
  window.addEventListener('message', function (e) {
    if (!e.data || ['click', 'listen', 'heard'].indexOf(e.data.veAd) < 0) return;
    var frames = document.querySelectorAll('iframe.ve-ad-frame');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== e.source) continue;
      if (e.data.veAd === 'click') click(frames[i].dataset.placement, frames[i].dataset.campaign);
      else listen(frames[i], e.data.veAd, e.data.g);
      return;
    }
  });

  window.VEAdCreative = { markup: markup, isRich: isRich, click: click };
})();
