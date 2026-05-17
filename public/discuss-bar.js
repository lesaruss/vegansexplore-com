/* discuss-bar.js — shared filter chip row for all Discuss surfaces
   data-mode="nav"   → chips are <a> links (sticky bar on chat page)
   data-mode="board" → chips are <button>s calling setFilter() (default)
*/
(function () {
  var script = document.currentScript;
  var mode = (script && script.getAttribute('data-mode')) || 'board';

  /* Fix text-decoration on <a> chips once */
  if (!document.getElementById('discuss-bar-css')) {
    var st = document.createElement('style');
    st.id = 'discuss-bar-css';
    st.textContent = 'a.discuss-filter-btn{text-decoration:none;}';
    document.head.appendChild(st);
  }

  var CATS = ['All','Nutrition','Lifestyle','Relationships','Business','Activism','Community','Food Science'];

  /* On board mode, read ?filter= param to pre-activate a chip */
  var activeFilter = 'All';
  if (mode === 'board') {
    var param = new URLSearchParams(location.search).get('filter');
    if (param) activeFilter = param;
  }

  function makeChip(cat) {
    if (mode === 'nav') {
      var href = cat === 'All' ? '/guides/ve-discuss' : '/guides/ve-discuss?filter=' + encodeURIComponent(cat);
      return '<a href="' + href + '" class="discuss-filter-btn">' + cat + '</a>';
    } else {
      var f = cat === 'All' ? 'all' : cat;
      var cls = 'discuss-filter-btn' + (cat === activeFilter ? ' active' : '');
      return '<button class="' + cls + '" onclick="setFilter(\'' + f.replace(/'/g, "\\'") + '\', this)" type="button">' + cat + '</button>';
    }
  }

  var chips = CATS.map(makeChip).join('');
  var todayBtn = '<a href="/guides/ve-guide-chat-v1" class="btn-today">Today\'s Topic <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';

  var html = '<div class="discuss-filters" role="group" aria-label="Filter by category">'
    + todayBtn + chips + '</div>';

  script.insertAdjacentHTML('beforebegin', html);
})();
