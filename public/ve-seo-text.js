/* Search titles and descriptions, one rule for the server and the page (Signal, Sean 2026-11-07, playbook signal).
 * Google cuts titles at about 60 to 65 characters and descriptions at about 155, and a description under about 70 gives
 * people little reason to click. api/listing.js (require) and directory/listing.html (window.VESeoText) both use this,
 * so the title and description a crawler sees and the ones the page sets stay the same. Any new page that writes its
 * own title or description from data should use it too.
 *   title(name, extra)      "<name><extra> — Vegans Explore", dropping extra, then shortening the name, to fit 65
 *   desc(name, text, where) the listing's own words, then where, filled when short, cut at a word near 155
 */
(function (root) {
  var SUFFIX = ' — Vegans Explore';
  var TITLE_MAX = 65, DESC_MAX = 155, DESC_MIN = 70;
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function clip(s, n) {
    s = clean(s);
    if (s.length <= n) return s;
    var cut = s.slice(0, n - 1);
    var sp = cut.lastIndexOf(' ');
    return (sp > n - 30 ? cut.slice(0, sp) : cut).replace(/[\s,.;:·—-]+$/, '') + '…';
  }
  function title(name, extra) {
    name = clean(name); extra = extra || '';
    if ((name + extra + SUFFIX).length <= TITLE_MAX) return name + extra + SUFFIX;
    if ((name + SUFFIX).length <= TITLE_MAX) return name + SUFFIX;
    if (name.length <= TITLE_MAX) return name;
    return clip(name, TITLE_MAX);
  }
  function desc(name, text, where) {
    name = clean(name); text = clean(text); where = clean(where);
    var d = text;
    if (where && d.toLowerCase().indexOf(where.split(',')[0].toLowerCase()) < 0) d = d ? d + ' · ' + where : '';
    if (d.length < DESC_MIN) {
      var fill = 'Find ' + name + (where ? ' in ' + where : '') + ' on Vegans Explore, the Vegan community Directory, with links and member votes.';
      d = d ? d.replace(/[.\s]+$/, '') + '. ' + fill : fill;
    }
    return clip(d, DESC_MAX);
  }
  var api = { title: title, desc: desc, clip: clip, TITLE_MAX: TITLE_MAX, DESC_MAX: DESC_MAX, DESC_MIN: DESC_MIN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VESeoText = api;
})(typeof window !== 'undefined' ? window : this);
