/* VE Products: what the store aisles, product pages and Guides share (Sean, 2026-10-08).
 *
 * Every product a Guide lists is a row in ve_products. It opens inside its brand's page, the Products
 * tab of /directory/<brand> (public/ve-product-view.js); /products/<slug> forwards there. Stores that
 * carry it are in ve_product_stores (see the Grocery stores section of CLAUDE.md).
 *
 *   VEProducts.title(p, brandName)     "Oatly Milk"
 *   VEProducts.buy(store, row, p, brandName)
 *                                      {href, label, sponsored} for one store, best first: an affiliate
 *                                      deal (/go/ tracked link), the product's own page at the store, the
 *                                      store's search (only when details.store.search_checked is results
 *                                      or loads), then the store's website. null when there is none.
 *   VEProducts.label(n)                a Nutrition Facts panel from ve_products.nutrition
 *   VEProducts.css()                   the panel's styles, once
 *   VEProducts.GUIDES                  guide slug -> [name, link, its Guide (narrates its brands' For <Brand> tour),
 *                                      house ad link (a /go/ tracked link), house ad line]
 *   VEProducts.SOURCES                 the listings.details keys that hold a Guide's products (the same keys as
 *                                      ve_guide_product_sources). A brand with one of them is a brand page with
 *                                      a Products tab.
 */
(function () {
  var GUIDES = { 'vegan-dairy-guide': ['Dairy Guide', '/guides/vegan-dairy-guide', 'maya', '/go/ve-dairy-guide', 'Brands, swaps and recipes, with Maya'] };
  var SOURCES = ['dairy_guide'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function title(p, brandName) { return ((brandName || '') + ' ' + (p.name || p.product_type || '')).trim(); }
  function buy(store, row, p, brandName) {
    var st = (store.details && store.details.store) || {};
    if (row.affiliate_link_code) return { href: '/go/' + encodeURIComponent(row.affiliate_link_code), label: 'Shop at ' + store.name, sponsored: true };
    if (row.buy_url) return { href: row.buy_url, label: 'Shop at ' + store.name };
    if (st.search_url && (st.search_checked === 'results' || st.search_checked === 'loads'))
      return { href: st.search_url.replace('{q}', encodeURIComponent(title(p, brandName))), label: 'Find it at ' + store.name };
    if (store.website) return { href: /^https?:/.test(store.website) ? store.website : 'https://' + store.website, label: 'Visit ' + store.name };
    return null;
  }
  // rows: [label, amount, %DV, indent (1 or 2), bold, thick rule under]
  function label(n) {
    if (!n || !n.rows) return '';
    return '<div class="vep-nf" role="img" aria-label="Nutrition Facts for ' + esc(n.product) + '"><h4>Nutrition Facts</h4>' +
      '<div class="nf-serv">Serving size <b>' + esc(n.serving) + '</b></div>' +
      '<div class="nf-cal"><span>Calories</span><b>' + esc(n.cal) + '</b></div><div class="nf-dvh">% Daily Value*</div>' +
      n.rows.map(function (r) {
        return '<div class="nf-r' + (r[3] === 1 ? ' in' : r[3] === 2 ? ' in2' : '') + (r[5] ? ' thick' : '') + '"><span>' + (r[4] ? '<b>' + esc(r[0]) + '</b> ' : esc(r[0]) + ' ') + esc(r[1]) + '</span><b>' + esc(r[2]) + '</b></div>';
      }).join('') + '</div>';
  }
  function css() {
    if (document.getElementById('vep-style')) return;
    var s = document.createElement('style'); s.id = 'vep-style';
    s.textContent = '.vep-nf{font-family:Helvetica,Arial,sans-serif;color:#000;background:#fff;border:2px solid #000;padding:6px 8px 8px;width:100%;max-width:300px}' +
      '.vep-nf h4{font-size:28px;font-weight:900;letter-spacing:-0.5px;line-height:1;margin:0 0 2px;border-bottom:1px solid #000;padding-bottom:3px}' +
      '.vep-nf .nf-serv{font-size:13px;padding:3px 0;border-bottom:9px solid #000;display:flex;justify-content:space-between;gap:8px}' +
      '.vep-nf .nf-cal{display:flex;justify-content:space-between;align-items:flex-end;font-weight:900;border-bottom:5px solid #000;padding:2px 0}' +
      '.vep-nf .nf-cal span{font-size:20px}.vep-nf .nf-cal b{font-size:32px;line-height:1}' +
      '.vep-nf .nf-dvh{font-size:11px;font-weight:700;text-align:right;border-bottom:1px solid #000;padding:2px 0}' +
      '.vep-nf .nf-r{display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid #000;padding:3px 0;gap:8px}' +
      '.vep-nf .nf-r.in{padding-left:14px}.vep-nf .nf-r.in2{padding-left:28px}.vep-nf .nf-r.thick{border-bottom:9px solid #000}.vep-nf .nf-r b{font-weight:900}';
    document.head.appendChild(s);
  }
  window.VEProducts = { title: title, buy: buy, label: label, css: css, esc: esc, GUIDES: GUIDES, SOURCES: SOURCES };
})();
