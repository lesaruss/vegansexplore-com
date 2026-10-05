/* Daily Pulse desk (Sean, 2026-10-04, playbook ve-daily-pulse-discussion). Where a topic is made
   and approved before it goes up on the Community Board's Pulse lane. A Community Manager sees
   their own city here (in the Pulse Desk); Sean sees every city and National (Depot > Inbox opens
   on National). Nothing posts on its own: a story from the Inbox, or a pasted link, becomes a
   draft queued for the Background writer (the dispatcher's pulse_topic_write job, on Sean's
   Claude subscription), which fills in the headline, intro and question, usually within minutes.
   Anyone at the desk can also finish a draft by hand, which takes it off the writer. Publish
   needs a first reply so no topic opens to an empty room.

   Each day's topic is a city briefing (Sean, 2026-10-04: lead the movement, not trivia): Build
   today's Pulse asks the writer for the whole thing (opening, the stories people are talking
   about, events, one action, the question); a story or link can also lead it. The approver keeps
   or drops each story and event and can change the action before publishing.

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
    '.vpd-warn.ok{color:#1f5f22;background:#EAF7EA;}',
    '.vpd-warn.err{color:#a61b1b;background:#fde8e8;}',
    '.vpd-list{list-style:none;display:grid;gap:8px;margin:0;padding:0;}',
    '.vpd-item{border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;}',
    '.vpd-item b{display:block;font-size:14px;line-height:1.35;}',
    '.vpd-item small{display:block;font-size:12px;color:rgba(26,26,26,0.7);margin-top:2px;}',
    '.vpd-item a{color:#1f5f22;}',
    '.vpd-empty{font-size:14px;color:rgba(26,26,26,0.75);padding:4px 0;}',
    '.vpd-sec{border-top:1px solid rgba(0,0,0,0.1);margin-top:12px;padding-top:12px;}',
    '.vpd-sec h4{font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#595959;margin:0 0 8px;}',
    '.vpd-item2{border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#fff;}',
    '.vpd-item2.off{opacity:0.5;}',
    '.vpd-keep{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;margin-bottom:6px;}',
    '.vpd-keep input{width:18px;height:18px;accent-color:#2d7d31;}',
    '.vpd-item2 small{display:block;font-size:12px;color:rgba(26,26,26,0.7);margin-top:4px;overflow-wrap:anywhere;}',
    '.vpd-item2 a{color:#1f5f22;font-weight:700;}'
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
    var state = { scope: (opts && opts.scope) || '', data: null, timer: null };
    el.classList.add('vpd');
    el.innerHTML = '<div class="vpd-card"><p class="vpd-empty">Loading the Daily Pulse desk&hellip;</p></div>';

    function load() {
      api({ action: 'topic_desk', community: state.scope }).then(function (d) {
        if (d.error) {
          el.innerHTML = d._status === 403 ? '' : '<div class="vpd-card"><p class="vpd-empty">' + esc(d.message || 'The Daily Pulse desk could not load. Refresh to try again.') + '</p></div>';
          return;
        }
        state.data = d; state.scope = d.scope; render();
        // While the writer has a draft, check back so it appears without a refresh. Not while
        // someone is typing in a draft, so their edits are never wiped.
        clearTimeout(state.timer);
        var waiting = d.drafts.some(function (t) { return t.write_status === 'queued' || t.write_status === 'writing'; });
        if (waiting) state.timer = setTimeout(function tick() {
          if (el.contains(document.activeElement) && document.activeElement.closest('form[data-draft]')) { state.timer = setTimeout(tick, 20000); return; }
          load();
        }, 20000);
      });
    }

    function render() {
      var d = state.data, where = d.scope === 'national' ? 'the whole country' : d.scope_name;
      var html = '<div class="vpd-card">' +
        '<div class="vpd-head"><h2>Daily Pulse &middot; ' + esc(d.scope_name) + '</h2>' +
          '<span class="vpd-today' + (d.posted_today ? ' done">Today\'s topic is up' : '">No topic yet today') + '</span></div>' +
        '<p class="vpd-sub">One briefing a day for ' + esc(where) + ', the way the people leading the movement here would tell it: what is happening, what people are talking about, and one thing to do about it, with a question for the conversation. Check it, write the first reply, and publish it to the Board.</p>' +
        '<div class="vpd-row" style="margin-top:14px;"><button type="button" class="vpd-btn" data-build>Build today\'s Pulse</button>' +
          '<span class="vpd-hint" style="font-size:13px;">The writer gathers what is happening in ' + esc(where) + ', the stories people are talking about, events and one thing to do, in a few minutes.</span></div>' +
        (d.scopes.length > 1 ? '<label class="vpd-f" style="margin-top:12px;max-width:320px;">Desk<select data-scope>' +
          d.scopes.map(function (s) { return '<option value="' + s.slug + '"' + (s.slug === d.scope ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' : '') +
        '</div>';

      // Drafts waiting for approval.
      html += '<div class="vpd-card"><h3>Drafts to approve</h3>' +
        (d.drafts.length ? d.drafts.map(draftHtml).join('') : '<p class="vpd-empty">No drafts. Start one from a story or a link below.</p>') + '</div>';

      // Start a topic.
      html += '<div class="vpd-card"><h3>Lead with a specific story</h3><p class="vpd-sub" style="margin:-4px 0 12px;">Optional. The writer still builds the full briefing around it.</p>' +
        '<form data-link><div class="vpd-two">' +
          '<label class="vpd-f">Link to the story<input type="url" name="url" required placeholder="https://" autocomplete="off"></label>' +
          '<label class="vpd-f">A line for the writer <span class="vpd-hint">Optional: what matters about it, or what to ask</span><input name="note" maxlength="500" autocomplete="off"></label>' +
        '</div><div class="vpd-row"><button type="submit" class="vpd-btn ghost">Build it around this link</button></div><p class="vpd-msg" data-link-msg role="status"></p></form>' +
        '<h3 style="margin-top:18px;">Stories from the Inbox</h3>' +
        (d.stories.length ? '<ul class="vpd-list">' + d.stories.map(function (s) {
          return '<li class="vpd-item"><div><b>' + esc(s.title) + '</b><small>' + esc(s.source_name || '') + (s.published_at ? ' &middot; ' + day(s.published_at) : '') +
            ' &middot; <a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">Read it</a></small></div>' +
            '<button type="button" class="vpd-btn ghost" data-from-story="' + s.id + '">Lead with this</button></li>';
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
      var ws = t.write_status, banner = '';
      if (ws === 'queued' || ws === 'writing') banner = '<p class="vpd-warn">' + (ws === 'writing' ? 'The Background writer is writing this now.' : 'Queued for the Background writer. It usually fills this in within a few minutes; this page updates on its own.') + ' You can also finish it yourself: saving or publishing takes it off the writer.</p>';
      else if (ws === 'written') banner = '<p class="vpd-warn ok">Written by the Background writer. Check each story against its source, keep what matters, write the first reply, and publish.</p>';
      else if (ws === 'failed') banner = '<p class="vpd-warn err">The writer could not write this one' + (t.write_error ? ': ' + esc(t.write_error) : '.') + ' Finish it by hand, send it back with a note, or discard it.</p>';
      // Auto drafts (Sean, 2026-10-05: if I look at it, I look at it; if I don't, it goes out): queued the
      // evening before by ve_pulse_auto_queue, published at 7 AM local by ve_pulse_auto_publish.
      if (/^Auto:/.test(t.write_note || '')) banner += '<p class="vpd-warn">' + esc(t.write_note.replace(/^Auto:\s*/, '').replace(/\s*Write the first reply too\.?$/, '')) + ' To stop it, Discard. To change it, edit and Publish now.</p>';
      return '<form class="vpd-draft" data-draft="' + t.id + '">' + banner +
        '<label class="vpd-f">Headline <span class="vpd-hint">For example: South Florida Pulse: a new market, a rescue in need, Saturday\'s party</span><input name="title" maxlength="140" value="' + esc(t.title) + '"></label>' +
        '<label class="vpd-f">Opening <span class="vpd-hint">Two or three sentences: what is moving in the city today and why it matters</span><textarea name="body" rows="3" maxlength="4000">' + esc(t.body) + '</textarea></label>' +
        briefingHtml(t) +
        '<label class="vpd-f" style="margin-top:12px;">The question <span class="vpd-hint">One real question that gets the city talking about today</span><input name="question" maxlength="300" value="' + esc(t.question || '') + '"></label>' +
        (t.briefing && t.briefing.stories && t.briefing.stories.length ? '' :
          '<div class="vpd-two"><label class="vpd-f">Source name <span class="vpd-hint">When there are no stories</span><input name="source_name" maxlength="120" value="' + esc(t.source_name || '') + '"></label>' +
          '<label class="vpd-f">Source link' + (t.source_url ? ' <a href="' + esc(safeUrl(t.source_url)) + '" target="_blank" rel="noopener noreferrer" class="vpd-hint">Open</a>' : '') + '<input name="source_url" type="url" maxlength="1000" value="' + esc(t.source_url || '') + '"></label></div>') +
        '<label class="vpd-f">First reply <span class="vpd-hint">Posted under your name when it goes up, so nobody walks into an empty room</span><textarea name="first_reply" rows="3" maxlength="2000" placeholder="Start it off: what you think, or what you know about it.">' + esc((t.briefing && t.briefing.first_reply) || '') + '</textarea></label>' +
        '<div class="vpd-row"><button type="submit" class="vpd-btn">Publish to the Board</button><button type="button" class="vpd-btn ghost" data-save>Save</button><button type="button" class="vpd-btn ghost" data-rewrite>Send back to the writer</button><button type="button" class="vpd-btn danger" data-discard>Discard</button></div>' +
        '<p class="vpd-msg" role="status"></p></form>';
    }

    // The briefing's sections in the draft: each story and event can be kept or dropped and its
    // words changed; the action is edited in place (clear its title to leave it out).
    function briefingHtml(t) {
      var b = t.briefing || {}, html = '';
      if ((b.stories || []).length) {
        html += '<div class="vpd-sec"><h4>What people are talking about</h4>' + b.stories.map(function (x, i) {
          return '<div class="vpd-item2" data-story="' + i + '"><label class="vpd-keep"><input type="checkbox" data-keep checked> Keep</label>' +
            '<input data-k="title" maxlength="140" value="' + esc(x.title) + '" aria-label="Story headline">' +
            '<textarea data-k="take" rows="2" maxlength="300" aria-label="Why it matters" style="margin-top:6px;">' + esc(x.take || '') + '</textarea>' +
            '<small>' + esc(x.source || '') + ' &middot; <a href="' + esc(safeUrl(x.url)) + '" target="_blank" rel="noopener noreferrer">Read the source</a></small></div>';
        }).join('') + '</div>';
      }
      if ((b.events || []).length) {
        html += '<div class="vpd-sec"><h4>Heads up</h4>' + b.events.map(function (x, i) {
          return '<div class="vpd-item2" data-event="' + i + '"><label class="vpd-keep"><input type="checkbox" data-keep checked> Keep</label>' +
            '<input data-k="title" maxlength="140" value="' + esc(x.title) + '" aria-label="Event">' +
            '<div class="vpd-two" style="margin-top:6px;"><input data-k="when" maxlength="60" value="' + esc(x.when || '') + '" aria-label="When"><input data-k="where" maxlength="120" value="' + esc(x.where || '') + '" aria-label="Where"></div></div>';
        }).join('') + '</div>';
      }
      var a = b.action || {};
      html += '<div class="vpd-sec"><h4>Today\'s move</h4>' +
        '<div class="vpd-two"><label class="vpd-f">Action <span class="vpd-hint">Leave empty for none</span><input name="action_title" maxlength="80" value="' + esc(a.title || '') + '"></label>' +
        '<label class="vpd-f">Button<input name="action_label" maxlength="40" value="' + esc(a.label || '') + '" placeholder="Apply to help"></label></div>' +
        '<label class="vpd-f">What to do and why<input name="action_text" maxlength="300" value="' + esc(a.text || '') + '"></label>' +
        '<label class="vpd-f">Link <span class="vpd-hint">A page on our site (/dashboard/opportunities, /board?...) or a full https link</span><input name="action_url" maxlength="1000" value="' + esc(a.url || '') + '"></label></div>';
      return html;
    }
    function fields(form) {
      var out = {};
      ['title', 'body', 'question', 'first_reply'].forEach(function (k) { out[k] = form.elements[k].value.trim(); });
      if (form.elements.source_url) { out.source_name = form.elements.source_name.value.trim(); out.source_url = form.elements.source_url.value.trim(); }
      var t = (state.data.drafts || []).filter(function (x) { return x.id === form.getAttribute('data-draft'); })[0] || {};
      var b = t.briefing || {};
      var pick = function (list, attr) {
        return (list || []).map(function (x, i) {
          var row = form.querySelector('[' + attr + '="' + i + '"]'); if (!row || !row.querySelector('[data-keep]').checked) return null;
          var y = Object.assign({}, x);
          Array.prototype.forEach.call(row.querySelectorAll('[data-k]'), function (inp) { y[inp.getAttribute('data-k')] = inp.value.trim(); });
          return y;
        }).filter(Boolean);
      };
      var action = form.elements.action_title.value.trim() ? { title: form.elements.action_title.value.trim(), text: form.elements.action_text.value.trim(), label: form.elements.action_label.value.trim(), url: form.elements.action_url.value.trim() } : null;
      out.briefing = { stories: pick(b.stories, 'data-story'), events: pick(b.events, 'data-event'), action: action };
      return out;
    }
    function say(msgEl, text, err) { if (!msgEl) return; msgEl.className = 'vpd-msg' + (err ? ' err' : ''); msgEl.textContent = text; }

    el.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-scope')) { state.scope = e.target.value; load(); }
      if (e.target.hasAttribute('data-keep')) e.target.closest('.vpd-item2').classList.toggle('off', !e.target.checked);
    });
    el.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-build')) {
        e.target.disabled = true; e.target.textContent = 'Queuing...';
        api({ action: 'topic_draft', community: state.scope }).then(function (d) {
          e.target.disabled = false; e.target.textContent = 'Build today\'s Pulse';
          if (d.error) { alert(d.message || 'That did not go through. Try again.'); return; }
          load();
        });
        return;
      }
      var storyId = e.target.getAttribute && e.target.getAttribute('data-from-story');
      if (storyId) {
        e.target.disabled = true; e.target.textContent = 'Queuing...';
        api({ action: 'topic_draft', community: state.scope, lead_id: storyId }).then(function (d) {
          if (d.error) { e.target.disabled = false; e.target.textContent = 'Lead with this'; alert(d.message || 'That did not go through. Try again.'); return; }
          if (window.scrollTo) { try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} }
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
      } else if (e.target.hasAttribute('data-rewrite')) {
        var note = prompt('What should the writer change? (optional)', '');
        if (note === null) return;
        say(msg, 'Sending it back to the writer...');
        api({ action: 'topic_rewrite', id: form.getAttribute('data-draft'), note: note }).then(function (d) { d.error ? say(msg, d.message || 'That did not go through.', true) : load(); });
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
        btn.disabled = true; say(lm, 'Queuing it for the writer...');
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
