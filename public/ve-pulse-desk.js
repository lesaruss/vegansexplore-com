/* Daily Pulse desk (Sean, 2026-10-04, playbook ve-daily-pulse-discussion). Where a topic is made
   and approved before it goes up on the Community Board's Pulse lane. A Community Manager sees
   their own city here (in the Pulse Desk); Sean sees every city and National (Depot > Inbox opens
   on National). Nothing posts on its own: a story from the Inbox, or a pasted link, becomes a
   draft (written by Claude when the writer is available, otherwise filled from the story to
   finish by hand), and Publish needs a first reply so no topic opens to an empty room.

     VEPulseDesk.mount(element, { scope: 'national' })   scope optional; defaults to the first allowed

   Every call goes to ve-board (topic_desk, topic_draft, topic_save, topic_publish, topic_discard),
   which checks who may approve which city. */
(function () {
  if (window.VEPulseDesk) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-board';
  var css = [
    '.vpd{font-family:inherit;color:#1a1a1a;}',
    '.vpd-card{background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:14px;padding:20px;margin-bottom:18px;}',
    '.vpd-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:6px;}',
    '.vpd h2{font-size:13px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#1f5f22;margin:0;}',
    '.vpd h3{font-size:15px;font-weight:800;margin:0 0 10px;}',
    '.vpd p.vpd-sub{font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);margin:4px 0 0;}',
    '.vpd-today{font-size:12px;font-weight:800;border-radius:99px;padding:4px 10px;background:#fff4e2;color:#7d4a00;}',
    '.vpd-today.done{background:#EAF7EA;color:#1f5f22;}',
    '.vpd select,.vpd input,.vpd textarea{font:inherit;font-weight:500;letter-spacing:0;font-size:14.5px;padding:10px 12px;border:1px solid rgba(0,0,0,0.22);border-radius:8px;width:100%;background:#fff;color:#1a1a1a;}',
    '.vpd textarea{resize:vertical;}',
    '.vpd label.vpd-f{display:grid;gap:4px;font-size:12px;font-weight:800;letter-spacing:0.02em;margin-bottom:10px;}',
    '.vpd .vpd-hint{font-weight:600;color:rgba(26,26,26,0.7);}',
    '.vpd-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:10px;}',
    '@media (max-width:640px){.vpd-two{grid-template-columns:minmax(0,1fr);}}',
    '.vpd-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}',
    '.vpd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 18px;border-radius:8px;border:none;background:#2d7d31;color:#fff;font:inherit;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;}',
    '.vpd-btn:hover{background:#1f5f22;}',
    '.vpd-btn:disabled{opacity:0.55;cursor:default;}',
    '.vpd-btn.ghost{background:#fff;color:#1f5f22;border:1px solid rgba(0,0,0,0.2);}',
    '.vpd-btn.ghost:hover{background:#f2f5f2;}',
    '.vpd-btn.danger{background:none;color:#8a2c22;letter-spacing:0.04em;}',
    '.vpd-btn:focus-visible,.vpd a:focus-visible{outline:3px solid #F69820;outline-offset:2px;}',
    '.vpd-msg{font-size:13px;font-weight:700;min-height:18px;color:#1f5f22;margin-top:6px;}',
    '.vpd-msg.err{color:#a61b1b;}',
    '.vpd-draft{border:1.5px solid #F69820;border-radius:12px;padding:16px;margin-top:14px;background:#fffdf8;}',
    '.vpd-warn{font-size:13px;font-weight:700;color:#7d4a00;background:#fff4e2;border-radius:8px;padding:8px 10px;margin-bottom:10px;}',
    '.vpd-list{list-style:none;display:grid;gap:8px;margin:0;padding:0;}',
    '.vpd-item{border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;}',
    '.vpd-item b{display:block;font-size:14px;line-height:1.35;}',
    '.vpd-item small{display:block;font-size:12px;color:rgba(26,26,26,0.7);margin-top:2px;}',
    '.vpd-item a{color:#1f5f22;}',
    '.vpd-empty{font-size:14px;color:rgba(26,26,26,0.75);padding:4px 0;}'
  ].join('');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function token() { try { return (window.VEAuth && VEAuth.getToken && VEAuth.getToken()) || localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function api(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); })
      .catch(function () { return { error: 'network', message: 'Could not reach the desk. Check your connection and try again.' }; });
  }
  function day(iso) { return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? u : '#'; }

  function mount(el, opts) {
    if (!el) return;
    if (!document.getElementById('vpd-style')) { var st = document.createElement('style'); st.id = 'vpd-style'; st.textContent = css; document.head.appendChild(st); }
    var state = { scope: (opts && opts.scope) || '', data: null };
    el.classList.add('vpd');
    el.innerHTML = '<div class="vpd-card"><p class="vpd-empty">Loading the Daily Pulse desk&hellip;</p></div>';

    function load() {
      api({ action: 'topic_desk', community: state.scope }).then(function (d) {
        if (d.error) {
          el.innerHTML = d._status === 403 ? '' : '<div class="vpd-card"><p class="vpd-empty">' + esc(d.message || 'The Daily Pulse desk could not load. Refresh to try again.') + '</p></div>';
          return;
        }
        state.data = d; state.scope = d.scope; render();
      });
    }

    function render() {
      var d = state.data, where = d.scope === 'national' ? 'the whole country' : d.scope_name;
      var html = '<div class="vpd-card">' +
        '<div class="vpd-head"><h2>Daily Pulse &middot; ' + esc(d.scope_name) + '</h2>' +
          '<span class="vpd-today' + (d.posted_today ? ' done">Today\'s topic is up' : '">No topic yet today') + '</span></div>' +
        '<p class="vpd-sub">One topic a day for ' + esc(where) + ': a short intro, one real question, and the source. Pick a story or paste a link, check the draft, write the first reply, and publish it to the Board.</p>' +
        (d.scopes.length > 1 ? '<label class="vpd-f" style="margin-top:12px;max-width:320px;">Desk<select data-scope>' +
          d.scopes.map(function (s) { return '<option value="' + s.slug + '"' + (s.slug === d.scope ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' : '') +
        '</div>';

      // Drafts waiting for approval.
      html += '<div class="vpd-card"><h3>Drafts to approve</h3>' +
        (d.drafts.length ? d.drafts.map(draftHtml).join('') : '<p class="vpd-empty">No drafts. Start one from a story or a link below.</p>') + '</div>';

      // Start a topic.
      html += '<div class="vpd-card"><h3>Start a topic</h3>' +
        '<form data-link><div class="vpd-two">' +
          '<label class="vpd-f">Link to the story<input type="url" name="url" required placeholder="https://" autocomplete="off"></label>' +
          '<label class="vpd-f">A line about it <span class="vpd-hint">Optional; needed if the page cannot be read</span><input name="note" maxlength="500" autocomplete="off"></label>' +
        '</div><div class="vpd-row"><button type="submit" class="vpd-btn">Draft from link</button></div><p class="vpd-msg" data-link-msg role="status"></p></form>' +
        '<h3 style="margin-top:18px;">Stories from the Inbox</h3>' +
        (d.stories.length ? '<ul class="vpd-list">' + d.stories.map(function (s) {
          return '<li class="vpd-item"><div><b>' + esc(s.title) + '</b><small>' + esc(s.source_name || '') + (s.published_at ? ' &middot; ' + day(s.published_at) : '') +
            ' &middot; <a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">Read it</a></small></div>' +
            '<button type="button" class="vpd-btn ghost" data-from-story="' + s.id + '">Draft topic</button></li>';
        }).join('') + '</ul>' : '<p class="vpd-empty">No new stories for ' + esc(where) + ' in the last three weeks. Paste a link above.</p>') +
        '</div>';

      // Live topics.
      html += '<div class="vpd-card"><h3>Live topics</h3>' +
        (d.live.length ? '<ul class="vpd-list">' + d.live.map(function (t) {
          var link = '/board?lane=pulse&community=' + (t.community === 'national' ? 'south-florida' : t.community) + '&post=' + t.id;
          return '<li class="vpd-item"><div><b>' + esc(t.title) + '</b><small>' + day(t.published_at) + ' &middot; ' + t.reply_count + (t.reply_count === 1 ? ' reply' : ' replies') +
            (t.status === 'hidden' ? ' &middot; Hidden' : '') + '</small></div><a class="vpd-btn ghost" href="' + link + '" data-frame-label="Daily Pulse">Open</a></li>';
        }).join('') + '</ul>' : '<p class="vpd-empty">Nothing published yet.</p>') + '</div>';

      el.innerHTML = html;
    }

    function draftHtml(t) {
      return '<form class="vpd-draft" data-draft="' + t.id + '">' +
        (!t.question ? '<p class="vpd-warn">The writer was not available, so this draft is filled from the story. Write the intro in your own words and add the question.</p>' : '') +
        '<label class="vpd-f">Headline <span class="vpd-hint">Plain and specific, in our words</span><input name="title" maxlength="140" value="' + esc(t.title) + '"></label>' +
        '<label class="vpd-f">Intro <span class="vpd-hint">Two to four neutral sentences on what happened</span><textarea name="body" rows="4" maxlength="4000">' + esc(t.body) + '</textarea></label>' +
        '<label class="vpd-f">The question <span class="vpd-hint">One real question about members\' experience or view</span><input name="question" maxlength="300" value="' + esc(t.question || '') + '"></label>' +
        '<div class="vpd-two"><label class="vpd-f">Source name<input name="source_name" maxlength="120" value="' + esc(t.source_name) + '"></label>' +
        '<label class="vpd-f">Source link <a href="' + esc(safeUrl(t.source_url)) + '" target="_blank" rel="noopener noreferrer" class="vpd-hint">Open</a><input name="source_url" type="url" maxlength="1000" value="' + esc(t.source_url) + '"></label></div>' +
        '<label class="vpd-f">First reply <span class="vpd-hint">Posted under your name when it goes up, so nobody walks into an empty room</span><textarea name="first_reply" rows="3" maxlength="2000" placeholder="Start it off: what you think, or what you know about it."></textarea></label>' +
        '<div class="vpd-row"><button type="submit" class="vpd-btn">Publish to the Board</button><button type="button" class="vpd-btn ghost" data-save>Save</button><button type="button" class="vpd-btn danger" data-discard>Discard</button></div>' +
        '<p class="vpd-msg" role="status"></p></form>';
    }

    function fields(form) {
      var out = {};
      ['title', 'body', 'question', 'source_name', 'source_url', 'first_reply'].forEach(function (k) { out[k] = form.elements[k].value.trim(); });
      return out;
    }
    function say(msgEl, text, err) { if (!msgEl) return; msgEl.className = 'vpd-msg' + (err ? ' err' : ''); msgEl.textContent = text; }

    el.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-scope')) { state.scope = e.target.value; load(); }
    });
    el.addEventListener('click', function (e) {
      var storyId = e.target.getAttribute && e.target.getAttribute('data-from-story');
      if (storyId) {
        e.target.disabled = true; e.target.textContent = 'Drafting...';
        api({ action: 'topic_draft', community: state.scope, lead_id: storyId }).then(function (d) {
          if (d.error) { e.target.disabled = false; e.target.textContent = 'Draft topic'; alert(d.message || 'That did not go through. Try again.'); return; }
          load();
        });
        return;
      }
      var form = e.target.closest && e.target.closest('form[data-draft]');
      if (!form) return;
      var msg = form.querySelector('.vpd-msg');
      if (e.target.hasAttribute('data-save')) {
        var f = fields(form); delete f.first_reply;
        say(msg, 'Saving...');
        api(Object.assign({ action: 'topic_save', id: form.getAttribute('data-draft') }, f)).then(function (d) { d.error ? say(msg, d.message || 'That did not save.', true) : say(msg, 'Saved.'); });
      } else if (e.target.hasAttribute('data-discard')) {
        if (!confirm('Discard this draft?')) return;
        api({ action: 'topic_discard', id: form.getAttribute('data-draft') }).then(function (d) { d.error ? say(msg, d.message || 'That did not go through.', true) : load(); });
      }
    });
    el.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      if (form.hasAttribute('data-link')) {
        var lm = form.querySelector('[data-link-msg]'), btn = form.querySelector('button');
        btn.disabled = true; say(lm, 'Reading the page and drafting...');
        api({ action: 'topic_draft', community: state.scope, url: form.elements.url.value.trim(), note: form.elements.note.value.trim() }).then(function (d) {
          btn.disabled = false;
          if (d.error) { say(lm, d.message || 'That did not go through. Try again.', true); return; }
          load();
        });
        return;
      }
      if (form.hasAttribute('data-draft')) {
        var msg = form.querySelector('.vpd-msg'), f = fields(form);
        if (!f.question) { say(msg, 'End the topic with one real question.', true); return; }
        if (!f.first_reply) { say(msg, 'Write the first reply, so nobody walks into an empty room.', true); return; }
        var pub = form.querySelector('button[type="submit"]'); pub.disabled = true; say(msg, 'Publishing...');
        api(Object.assign({ action: 'topic_publish', id: form.getAttribute('data-draft') }, f)).then(function (d) {
          pub.disabled = false;
          if (d.error) { say(msg, d.message || 'That did not go through. Try again.', true); return; }
          load();
        });
      }
    });

    load();
  }

  window.VEPulseDesk = { mount: mount };
})();
