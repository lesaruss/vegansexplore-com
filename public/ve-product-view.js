/* VE Product View: one product line opened inside its brand's page (Sean, 2026-10-08).
 *
 * "Let's just make it a little mini web experience for Oatly." A brand with products in our Guides gets one page,
 * its Directory listing (/directory/<brand>), with a Products tab. Opening a product there shows this view:
 * Products > Oatly Milk. /products/<slug> still works as a link and lands here (directory/product.html forwards it
 * to /directory/<brand>?tab=products&product=<slug>, and ?v=<version> picks a version).
 *
 *   VEProductView.css()                       the view's styles, once
 *   VEProductView.render(el, p, brand, opts)  the product: the photo and its versions as round thumbnails, the
 *                                             chosen version's name, the brand's description and ingredients,
 *                                             certifications, its Nutrition Facts and USDA record (both follow the
 *                                             chosen version: variants[].fdc, else the product's), the stores that
 *                                             carry it (each opens that store's Vegan aisle on Vegans Explore, never
 *                                             the store's own site) and more from the brand.
 *       opts.others    the brand's other products (rows with slug, product_type, name)
 *       opts.href(s)   the link for another product's slug
 *       opts.version   the version key to start on
 *       opts.onVersion(key)  called when a version is picked ('' for the first)
 *       opts.side      an element in the page's right column for the Nutrition Facts (Sean, 2026-10-08: "put the
 *                      barcode back on the right-hand side and push the billboard down... people see that it
 *                      changes"). On a phone they stay right under the product.
 *   VEProductView.stores(p)                   the approved stores carrying a product, by name
 *   VEProductView.logo(l, cls)                a listing's logo in a rounded square, or its initials
 *
 * Data: ve_products (variants, fdc, certifications, brand_says, nutrition), ve_product_stores. Uses /public/ve-products.js.
 */
(function () {
  var esc = function (s) { return VEProducts.esc(s); };
  var DATA_SOURCE = { LI: 'Label information from the brand', GDSN: 'GS1 Global Data Synchronization Network' };
  function lc(s) { s = String(s || ''); return s.charAt(0).toLowerCase() + s.slice(1); }
  function titleCase(s) { return String(s || '').toLowerCase().replace(/(^|[\s(\/-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function logo(l, cls) {
    return l.logo_url ? '<span class="' + cls + '" style="background-image:url(\'' + esc(l.logo_url) + '\')" role="img" aria-label="' + esc(l.name) + ' logo"></span>'
      : '<span class="' + cls + '" style="background-color:' + esc(l.color || '#1f5f22') + '">' + esc(l.initials || String(l.name || '?').charAt(0)) + '</span>';
  }
  function stores(p) {
    return (p.ve_product_stores || []).filter(function (r) { return !r.removed_at && r.listings && r.listings.status === 'approved'; })
      .map(function (r) { return r.listings; }).sort(function (x, y) { return x.name.localeCompare(y.name); });
  }

  function css() {
    if (document.getElementById('vpv-style')) return;
    VEProducts.css();
    var s = document.createElement('style'); s.id = 'vpv-style';
    s.textContent = [
      '.pv-h{font-size:clamp(24px,2.6vw,34px);font-weight:900;line-height:1.1;color:#1a1a1a}',
      '.pv-sub{font-size:13px;font-weight:700;color:rgba(26,26,26,.5);margin-top:6px}',
      /* The product: photo and versions | the chosen version | its Nutrition Facts */
      '.pv-prod{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr) 290px;grid-template-areas:"img info nf";gap:28px;margin:20px 0 36px;align-items:start}',
      '.pv-img{grid-area:img}.pv-info{grid-area:info}.pv-nf{grid-area:nf}',
      '.pv-prod.side{grid-template-columns:minmax(0,300px) minmax(0,1fr);grid-template-areas:"img info"}',
      '@media (min-width:769px){.pv-prod.side .pv-nf{display:none}}',
      '.pv-main{aspect-ratio:1/1;border-radius:16px;border:1px solid rgba(0,0,0,.09);background:#f6f7f6 center/contain no-repeat}',
      '.pv-vars{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}',
      '.pv-var{width:52px;height:52px;border-radius:50%;border:2px solid rgba(0,0,0,.09);background:#fff center/76% no-repeat;cursor:pointer;padding:0}',
      '.pv-var:hover{border-color:#3A9B3E}',
      '.pv-var[aria-pressed="true"]{border-color:#1f5f22;box-shadow:0 0 0 3px rgba(58,155,62,.25)}',
      '.pv-varnote{font-size:11.5px;color:rgba(26,26,26,.5);margin-top:8px}',
      '.pv-vname{font-size:20px;font-weight:900;line-height:1.25;color:#1a1a1a}',
      '.pv-desc{font-size:15px;line-height:1.65;color:rgba(26,26,26,.75);margin-top:10px}',
      '.pv-desc cite{display:block;font-style:normal;font-size:12px;color:rgba(26,26,26,.5);margin-top:6px}',
      '.pv-desc cite a,.pv-src a{color:#1f5f22}',
      '.pv-ingr{font-size:13px;line-height:1.6;color:rgba(26,26,26,.75);margin-top:12px}',
      '.pv-ingr b{color:#1a1a1a}',
      '.pv-note{font-size:13px;color:#8a5a00;background:#fff4e2;border-radius:8px;padding:8px 12px;margin-top:10px;display:inline-block}',
      '.pv-certs{display:flex;flex-wrap:wrap;gap:12px 16px;margin-top:18px;align-items:center}',
      '.pv-cert{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:rgba(26,26,26,.75)}',
      '.pv-cert img{width:38px;height:38px;object-fit:contain}',
      '.pv-src{font-size:11.5px;line-height:1.5;color:rgba(26,26,26,.5);margin-top:8px}',
      '.pv-sec{margin-bottom:34px}',
      '.pv-sec h3{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(26,26,26,.5);margin:0 0 12px}',
      '.pv-text{font-size:15px;line-height:1.65;color:rgba(26,26,26,.75)}',
      /* The USDA record */
      '.pv-rec{border:1px solid rgba(0,0,0,.09);border-radius:12px;overflow:hidden}',
      '.pv-rec dl{display:grid;grid-template-columns:200px minmax(0,1fr);margin:0}',
      '.pv-rec dt,.pv-rec dd{margin:0;padding:11px 16px;border-bottom:1px solid rgba(0,0,0,.09);font-size:13.5px;line-height:1.5}',
      '.pv-rec dt{font-weight:800;color:rgba(26,26,26,.75);background:#f6f7f6}',
      '.pv-rec .last{border-bottom:0}',
      '.pv-rec details{border-top:1px solid rgba(0,0,0,.09)}',
      '.pv-rec summary{cursor:pointer;padding:12px 16px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f5f22}',
      '.pv-nut{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:0 24px;padding:0 16px 14px}',
      '.pv-nut div{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px dashed rgba(0,0,0,.09)}',
      /* Where to find it: each store is a button to its page on Vegans Explore (its Vegan aisle) */
      '.pv-stores{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:12px}',
      'a.pv-store{display:flex;gap:12px;align-items:center;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;padding:10px 14px;text-decoration:none;color:#1a1a1a;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05);transition:border-color .15s,box-shadow .15s,transform .15s}',
      'a.pv-store:hover{border-color:#3A9B3E;box-shadow:0 4px 14px rgba(31,95,34,.14);transform:translateY(-1px)}',
      'a.pv-store b{flex:1;min-width:0;font-size:15px;font-weight:800}',
      '.pv-slogo{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid rgba(0,0,0,.09);background:#fff center/72% no-repeat;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff}',
      '.pv-more{display:flex;flex-wrap:wrap;gap:8px}',
      '.pv-sidehead{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(26,26,26,.5);margin:0 0 10px}',
      '.pv-more a{font-size:12px;font-weight:800;letter-spacing:.04em;padding:8px 13px;border-radius:99px;border:1.5px solid rgba(0,0,0,.09);color:#1a1a1a;text-decoration:none}',
      '.pv-more a:hover{border-color:#3A9B3E;color:#1f5f22}',
      '@media (max-width:1280px){.pv-prod:not(.side){grid-template-columns:minmax(0,290px) minmax(0,1fr);grid-template-areas:"img info" "nf info"}}',
      '@media (max-width:768px){.pv-prod,.pv-prod.side{grid-template-columns:minmax(0,1fr);grid-template-areas:"img" "info" "nf"}.pv-main{max-width:340px}' +
        '.pv-rec dl{grid-template-columns:minmax(0,1fr)}.pv-rec dt{border-bottom:0;padding-bottom:2px}.pv-rec dd{padding-top:2px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function record(f) {
    if (!f) return '<div class="pv-sec"><h3>From the label: the USDA record</h3><p class="pv-text">The USDA has no label record for this version yet.</p></div>';
    var rec = [
      ['Product on the record', esc(titleCase(f.description)) + (f.brandName ? ' (' + esc(f.brandName) + ')' : '')],
      ['Brand owner', esc(f.brandOwner)], ['UPC', esc(f.gtinUpc)], ['Package size', esc(f.packageWeight)],
      ['Serving size', esc([f.householdServing, f.servingSize ? f.servingSize + ' ' + String(f.servingSizeUnit || '').replace(/^MLT$/, 'mL').replace(/^GRM$/, 'g') : ''].filter(Boolean).join(', '))],
      ['Category', esc(f.category)], ['Sold in', esc(f.marketCountry)], ['Ingredients', esc(f.ingredients)],
      ['On the record since', esc([f.availableDate, f.publicationDate ? 'published ' + f.publicationDate : ''].filter(Boolean).join(', '))],
      ['Source of the data', esc(DATA_SOURCE[f.dataSource] || f.dataSource || '')]
    ].filter(function (r) { return r[1]; });
    var nuts = f.nutrients || [], per = /ML|LT/i.test(f.servingSizeUnit || '') ? '100 mL' : '100 g';
    return '<div class="pv-sec"><h3>From the label: the USDA record</h3><div class="pv-rec"><dl>' +
      rec.map(function (r, i) { var last = i === rec.length - 1 ? ' class="last"' : ''; return '<dt' + last + '>' + r[0] + '</dt><dd' + last + '>' + r[1] + '</dd>'; }).join('') + '</dl>' +
      (nuts.length ? '<details><summary>All ' + nuts.length + ' nutrients, per ' + per + '</summary><div class="pv-nut">' + nuts.map(function (n) {
        return '<div><span>' + esc(n.name) + '</span><b>' + esc(Math.round(Number(n.value) * 100) / 100) + ' ' + esc(n.unit) + '</b></div>';
      }).join('') + '</div></details>' : '') +
      '</div><p class="pv-src">USDA FoodData Central, Branded Foods, record ' + esc(f.id) + ' (<a href="https://fdc.nal.usda.gov/food-details/' + encodeURIComponent(f.id) +
      '/nutrients" target="_blank" rel="noopener">see the record</a>), as the brand reported it. Recipes change, so check the package.</p></div>';
  }

  function render(el, p, b, opts) {
    opts = opts || {};
    css();
    var name = VEProducts.title(p, b.name);
    var vars = Array.isArray(p.variants) && p.variants.length ? p.variants
      : [{ key: '', name: name, image: p.image_url, description: p.brand_says, source: p.brand_url, nutrition: p.nutrition }];
    var st = stores(p), others = (opts.others || []).filter(function (o) { return o.slug !== p.slug; });
    var html = '<h2 class="pv-h">' + esc(name) + '</h2>' +
      '<div class="pv-sub">' + (vars.length > 1 ? vars.length + ' versions' : '') + (p.made_from ? (vars.length > 1 ? ' &middot; ' : '') + 'Made from ' + esc(lc(p.made_from)) : '') + '</div>' +
      '<div class="pv-prod' + (opts.side ? ' side' : '') + '"><div class="pv-img"><div class="pv-main" role="img"></div>' +
      (vars.length > 1 ? '<div class="pv-vars" role="group" aria-label="Versions">' + vars.map(function (v, i) {
        return '<button type="button" class="pv-var" data-var="' + i + '" title="' + esc(v.name) + '" aria-label="' + esc(v.name) + '" style="background-image:url(\'' + esc(v.image || '') + '\')"></button>';
      }).join('') + '</div><div class="pv-varnote">Pick a version to see its details and nutrition.</div>' : '') + '</div>' +
      '<div class="pv-info"><div class="pv-vname"></div><div class="pv-desc"></div><div class="pv-ingr"></div>' +
      (p.note ? '<div class="pv-note">' + esc(p.note) + '</div>' : '') +
      (Array.isArray(p.certifications) && p.certifications.length ? '<div class="pv-certs">' + p.certifications.map(function (c) {
        return '<span class="pv-cert"><img src="' + esc(c.url) + '" alt="" loading="lazy">' + esc(c.name) + '</span>';
      }).join('') + '</div>' : '') + '</div>' +
      '<div class="pv-nf"></div></div>';
    var anyRecord = !!p.fdc || vars.some(function (v) { return v.fdc; });
    html += '<div class="pv-recwrap"></div>';
    html += '<div class="pv-sec"><h3>Where to find it</h3>' + (st.length ? '<div class="pv-stores">' + st.map(function (s) {
      return '<a class="pv-store" href="/directory/' + encodeURIComponent(s.slug) + '?product=' + encodeURIComponent(p.id) + '" title="' + esc(s.name) + '\'s Vegan aisle">' + logo(s, 'pv-slogo') + '<b>' + esc(s.name) + '</b></a>';
    }).join('') + '</div><p class="pv-src">Each store opens its Vegan aisle on Vegans Explore. Stock changes by location, so check your store.</p>'
      : '<p class="pv-text">We have not mapped a store for this one yet.</p>') + '</div>';
    if (others.length) html += '<div class="pv-sec"><h3>More from ' + esc(b.name) + '</h3><div class="pv-more">' + others.map(function (o) {
      return '<a href="' + esc(opts.href ? opts.href(o.slug) : '/products/' + o.slug) + '" data-product="' + esc(o.slug) + '">' + esc(VEProducts.title(o, b.name)) + '</a>';
    }).join('') + '</div></div>';
    el.innerHTML = html;

    // A version: the photo, name, the brand's own words, ingredients and its Nutrition Facts.
    function pick(i, quiet) {
      var v = vars[i] || vars[0];
      var main = el.querySelector('.pv-main');
      if (v.image) main.style.backgroundImage = "url('" + v.image + "')"; else main.style.backgroundColor = b.color || '#1f5f22';
      main.setAttribute('aria-label', vars.length > 1 ? name + ', ' + v.name : name);
      el.querySelector('.pv-vname').textContent = vars.length > 1 ? b.name + ' ' + p.product_type + ', ' + v.name : name;
      el.querySelector('.pv-desc').innerHTML = v.description ? '&ldquo;' + esc(v.description) + '&rdquo;<cite>' + esc(b.name) +
        (v.source ? ', <a href="' + esc(v.source) + '" target="_blank" rel="noopener">on its website</a>' : '') + '</cite>'
        : (p.made_from ? esc(name) + ' is made from ' + esc(lc(p.made_from)) + '.' : '');
      el.querySelector('.pv-ingr').innerHTML = v.ingredients ? '<b>Ingredients:</b> ' + esc(v.ingredients) : '';
      var nf = v.nutrition || (i === 0 ? p.nutrition : null);
      var nfHtml = nf ? VEProducts.label(nf) + '<p class="pv-src">' + esc(nf.product || '') + (nf.per_container ? '. ' + esc(nf.per_container) : '') + '. ' +
        (v.nutrition && v.source ? 'From <a href="' + esc(v.source) + '" target="_blank" rel="noopener">' + esc(b.name) + '\'s product page</a>' : esc(p.nutrition_source || '')) +
        '. Recipes change, so check the package.</p>' : '<p class="pv-src">Nutrition Facts for this one are not added yet.</p>';
      el.querySelector('.pv-nf').innerHTML = nfHtml;
      if (opts.side) opts.side.innerHTML = '<h3 class="pv-sidehead">Nutrition Facts' + (vars.length > 1 ? ' &middot; ' + esc(v.name) : '') + '</h3>' + nfHtml;
      // The USDA record follows the version too: its own record, else the product's for the first version.
      el.querySelector('.pv-recwrap').innerHTML = anyRecord ? record(v.fdc || (i === 0 ? p.fdc : null)) : '';
      [].forEach.call(el.querySelectorAll('.pv-var'), function (x) { x.setAttribute('aria-pressed', String(+x.getAttribute('data-var') === i)); });
      if (!quiet && opts.onVersion) opts.onVersion(i && vars[i] && vars[i].key ? vars[i].key : '');
    }
    var start = 0;
    vars.forEach(function (v, i) { if (opts.version && v.key === opts.version) start = i; });
    pick(start, true);
    el.onclick = function (e) {
      var v = e.target.closest('[data-var]'); if (v && el.contains(v)) pick(+v.getAttribute('data-var'));
    };
  }

  window.VEProductView = { css: css, render: render, stores: stores, logo: logo };
})();
