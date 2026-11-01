/* VE Macros: a product's macros, the same everywhere (Sean, 2026-11-01: "Could we also list the macros of the item? And that might
 * mean a lot to people who are working out and watching their nutrition").
 *
 *   VEMacros.css()             the styles, once
 *   VEMacros.strip(m, opts)    calories, protein, carbs and fat per serving in four boxes, the serving under them, fiber and sugar
 *                              on one line and protein per 100 calories (opts.title, opts.compact); '' when m is empty
 *   VEMacros.line(m)           "8g protein · 80 cal", for a tile
 *   VEMacros.per100(m)         protein per 100 calories (one decimal), or null
 *   VEMacros.amount(text)      an ingredient line or serving in mL or g ("1 cup" 240, "2 Tbsp (30g)" 30), or null
 *   VEMacros.scale(m, f)       m times f
 *   VEMacros.sum(list)         the macros added up
 *
 * m is ve_products.macros or ve_product_barcodes.macros: {serving, cal, protein, carbs, fat, fiber, sugar, sodium, item}.
 */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { var n = Number(v); return isFinite(n) ? n : null; }
  function fmt(v) { var n = num(v); if (n == null) return '–'; return String(Math.round(n * 10) / 10); }
  function per100(m) { if (!m) return null; var c = num(m.cal), p = num(m.protein); return c && p != null ? Math.round(p / c * 1000) / 10 : null; }
  function css() {
    if (document.getElementById('vem-style')) return;
    var s = document.createElement('style'); s.id = 'vem-style';
    s.textContent = '.vem{margin:16px 0}.vem-h{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(26,26,26,.55);margin:0 0 8px}' +
      '.vem-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}' +
      '.vem-box{border:1px solid rgba(0,0,0,.1);border-radius:6px;padding:10px 8px;text-align:center;background:#fff}' +
      '.vem-box b{display:block;font-size:22px;font-weight:900;line-height:1.1;color:#1a1a1a}.vem-box span{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(26,26,26,.6);margin-top:3px}' +
      '.vem-box.pro{border-color:var(--vb-accent,#3A9B3E);background:var(--vb-soft,#E8F5E9)}.vem-box.pro b{color:var(--vb-accent-ink,#1f5f22)}' +
      '.vem-sub{font-size:12.5px;line-height:1.5;color:rgba(26,26,26,.7);margin-top:8px}.vem-sub b{color:#1a1a1a}' +
      '.vem.compact .vem-box{padding:7px 4px}.vem.compact .vem-box b{font-size:17px}' +
      '@media(max-width:380px){.vem-box b{font-size:18px}.vem-box span{font-size:10px}}';
    document.head.appendChild(s);
  }
  function strip(m, opts) {
    opts = opts || {};
    if (!m || num(m.cal) == null) return '';
    css();
    var p100 = per100(m), extra = [];
    if (m.fiber != null) extra.push('<b>' + fmt(m.fiber) + 'g</b> fiber');
    if (m.sugar != null) extra.push('<b>' + fmt(m.sugar) + 'g</b> sugar');
    if (m.sodium != null) extra.push('<b>' + fmt(m.sodium) + 'mg</b> sodium');
    if (p100 != null) extra.push('<b>' + p100 + 'g</b> protein per 100 calories');
    return '<div class="vem' + (opts.compact ? ' compact' : '') + '">' + (opts.title === false ? '' : '<h3 class="vem-h">' + esc(opts.title || 'Macros per serving') + '</h3>') +
      '<div class="vem-row"><div class="vem-box"><b>' + fmt(m.cal) + '</b><span>Calories</span></div>' +
      '<div class="vem-box pro"><b>' + fmt(m.protein) + 'g</b><span>Protein</span></div>' +
      '<div class="vem-box"><b>' + fmt(m.carbs) + 'g</b><span>Carbs</span></div>' +
      '<div class="vem-box"><b>' + fmt(m.fat) + 'g</b><span>Fat</span></div></div>' +
      '<div class="vem-sub">' + (m.serving ? 'Serving: <b>' + esc(m.serving) + '</b>' + (extra.length ? ' · ' : '') : '') + extra.join(' · ') + '</div></div>';
  }
  function line(m) {
    if (!m || num(m.cal) == null) return '';
    return fmt(m.protein) + 'g protein · ' + fmt(m.cal) + ' cal';
  }
  // How much an amount is, in mL or g (taken as equal for these foods). The first number and unit in the text, a gram or mL
  // figure in brackets winning ("2 Tbsp (30g)" is 30).
  var UNIT = { cup: 240, cups: 240, c: 240, tbsp: 15, tablespoon: 15, tablespoons: 15, tbs: 15, tsp: 5, teaspoon: 5, teaspoons: 5,
    oz: 28, ounce: 28, ounces: 28, 'fl oz': 30, ml: 1, g: 1, gram: 1, grams: 1, l: 1000, liter: 1000, litre: 1000, kg: 1000, lb: 454, pound: 454, slice: 20, slices: 20 };
  function qty(s) {
    s = String(s).trim();
    var m = s.match(/^(\d+)\s+(\d+)\/(\d+)/); if (m) return +m[1] + m[2] / m[3];
    m = s.match(/^(\d+)\/(\d+)/); if (m) return m[1] / m[2];
    m = s.match(/^(\d*\.?\d+)/); if (m) return +m[1];
    if (/^(a|an|one)\b/i.test(s)) return 1;
    return null;
  }
  function amount(text) {
    var t = String(text || '').replace(/[½¼¾⅓⅔]/g, function (c) { return { '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅓': ' 1/3', '⅔': ' 2/3' }[c]; });
    var br = t.match(/\((\d*\.?\d+)\s*(g|ml)\)/i);
    if (br) return +br[1];
    var re = /(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+|\ba\b|\ban\b|\bone\b)[\s-]*(fl\.? ?oz|cups?|c\b|tablespoons?|tbsp|tbs|teaspoons?|tsp|ounces?|oz|ml|grams?|g\b|liters?|litres?|l\b|kg|pounds?|lb|slices?)/i;
    var m = t.match(re);
    if (!m) return null;
    var q = qty(m[1]); var u = m[2].toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
    if (u === 'fl oz' || u === 'floz') u = 'fl oz';
    var f = UNIT[u] || UNIT[u.replace(/s$/, '')];
    return q != null && f ? q * f : null;
  }
  var KEYS = ['cal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
  function scale(m, f) { var o = {}; KEYS.forEach(function (k) { if (num(m[k]) != null) o[k] = num(m[k]) * f; }); return o; }
  function sum(list) { var o = {}; list.forEach(function (m) { KEYS.forEach(function (k) { if (num(m[k]) != null) o[k] = (o[k] || 0) + num(m[k]); }); }); return o; }
  window.VEMacros = { css: css, strip: strip, line: line, per100: per100, amount: amount, scale: scale, sum: sum };
})();
