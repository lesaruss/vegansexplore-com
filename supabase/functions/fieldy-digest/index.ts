import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const DIGEST_TO = 'contact@lesaruss.com';
const DIGEST_FROM = 'LESARUSS Fieldy Digest <fieldy@lesaruss.ai>';
const STUDIO_TABLE_URL = 'https://supabase.com/dashboard/project/fwbhwfxpncrsfhttimna/editor';
const GAP_MS = 20 * 60 * 1000; // 20 min silence = new recording session
const MIN_CLUSTER_CHARS = 200; // below this, it's heartbeat/noise, not a real conversation
const MODEL = 'claude-sonnet-5';

// Fieldy Daily Digest v2 - built 2026-08-06, rebuilt same day per Sean's direct
// correction: v1 emailed raw one-line snippets ("attributed to Vegans Explore")
// out of what were actually 5-10min conversations, and included duplicate
// entries. Sean's standard: "would you send that to a client?" v1 failed that
// test. v2 clusters the raw 30-second transcript chunks into real recording
// sessions by time gap, then asks Claude to read each FULL session (with
// per-chunk timestamps preserved so it can anchor topics to real clock times)
// and split it into distinct, substantive topics - each with a contextual
// summary (not a soundbite), a brand attribution, and an explicit
// recommendation on whether it needs a playbook/tracker entry, a decision,
// or is already actionable/no-op. Duplicate topics within a session are
// explicitly instructed to be consolidated into one entry, not repeated.
//
// 2026-08-06 (Logan): first live test used a stale/invalid model id
// (claude-3-5-sonnet-20241022) which 404'd on every cluster. The bug was
// caught before Sean saw a bad email ONLY because summarizationErrors was
// checked in the JSON response, not because "sent:true" was trusted.
// Hardened here: if every substantive session fails to summarize, the
// function now refuses to send a misleading "nothing needs attention" email
// and instead fails loud (logged to stream_events as blocked).

interface Topic {
  start_time: string;
  title: string;
  summary: string;
  brand: string;
  action: 'NEEDS_PLAYBOOK_ENTRY' | 'NEEDS_DECISION' | 'ALREADY_ACTIONABLE_NO_FOLLOWUP' | 'FYI_ONLY';
  action_reason: string;
  next_step: string;
}

function fmtET(iso: string) {
  return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
}

function parseJsonLoose(text: string): any {
  const cleaned = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

const VALID_ACTIONS = ['NEEDS_PLAYBOOK_ENTRY', 'NEEDS_DECISION', 'ALREADY_ACTIONABLE_NO_FOLLOWUP', 'FYI_ONLY'];

// Safety net: even with an explicit "must be exactly one of these four
// strings" instruction, the model has drifted to values like "notify" or
// "create_task" in testing. Normalize anything off-spec instead of letting
// it silently vanish from both the "needs attention" and "FYI" buckets.
function normalizeAction(raw: string): Topic['action'] {
  const a = (raw ?? '').toUpperCase().trim();
  if (VALID_ACTIONS.includes(a)) return a as Topic['action'];
  if (a.includes('DECISION') || a === 'NOTIFY') return 'NEEDS_DECISION';
  if (a.includes('TASK') || a.includes('PLAYBOOK') || a.includes('TRACKER') || a.includes('CREATE')) return 'NEEDS_PLAYBOOK_ENTRY';
  if (a.includes('DONE') || a.includes('ACTIONABLE') || a.includes('COMPLETE')) return 'ALREADY_ACTIONABLE_NO_FOLLOWUP';
  return 'FYI_ONLY';
}

async function summarizeSession(apiKey: string, rows: { received_at: string; transcript_text: string }[], startTs: string, endTs: string): Promise<Topic[]> {
  const transcriptBlock = rows
    .filter(r => (r.transcript_text ?? '').trim().length > 0)
    .map(r => `[${fmtET(r.received_at)} ET] ${r.transcript_text.trim()}`)
    .join('\n');

  const prompt = `You are producing a daily digest for Sean A. Russell from a passive ambient voice recording (the "Fieldy" app) covering ${fmtET(startTs)} ET to ${fmtET(endTs)} ET. The transcript below is made of many short timestamped chunks and may contain multiple unrelated topics, meetings, asides, background noise, or filler - it is NOT a single clean conversation.

Your job: identify each DISTINCT, SUBSTANTIVE topic, decision, piece of feedback, or idea Sean discusses or dictates. Skip pure filler, meta-commentary about the recording itself, silence, or background noise with no real content. If the same topic is revisited more than once in this window, consolidate it into ONE entry - do not repeat it.

LESARUSS brands to attribute to (pick the closest match, or "Other/Unclear"): LESARUSS (parent), GeekFon Society, Vegans Explore, 111 Day Theory, LESARUSS 360, K12 Unlocked, ADA Unlocked, TopSpot, TalentVangelist, Russell's Roving Reporters, LESARUSS AI, Family Resource Center.

For each distinct topic return an object with:
- start_time: the approximate clock time (from the bracketed timestamps) where this topic begins, e.g. "7:45 PM"
- title: a short 5-9 word label
- summary: 3-5 sentences of REAL CONTEXT - what was actually discussed/decided/felt, written so someone who never heard the recording understands it. Do not just quote a soundbite.
- brand: the closest brand match from the list above
- action: MUST be exactly one of these four strings, verbatim, no other value: "NEEDS_PLAYBOOK_ENTRY" (this is a new idea/direction that should be logged into a playbook or tracker and isn't yet), "NEEDS_DECISION" (Sean asked an open question or left something unresolved that needs a yes/no or a choice), "ALREADY_ACTIONABLE_NO_FOLLOWUP" (already fully captured/built, FYI only), "FYI_ONLY" (ambient/personal, no system action implied). Do not invent any other action value (not "notify", not "create_task", not anything else) - pick the closest of these four exact strings.
- action_reason: one sentence justifying the action classification
- next_step: a concrete next step, or "None" if action is FYI_ONLY

Respond with ONLY a valid JSON array of these objects, no markdown fences, no commentary. If there are truly no substantive topics, return [].

TRANSCRIPT:
${transcriptBlock}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000, // R (2026-11-08): thinking counts against max_tokens
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Anthropic API error ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  // IMPORTANT: this model returns extended-thinking blocks before the text
  // block, so content[0] is NOT reliably the text - find the actual text
  // block explicitly. (Found live: content[0] was a "thinking" block with no
  // .text, so content[0]?.text silently resolved to undefined -> '[]' ->
  // zero topics reported with zero errors. That's exactly the kind of
  // silent-wrong-result Sean called out - caught here by manually testing
  // the raw API call and comparing against what the function reported.)
  const textBlock = (data?.content ?? []).find((b: any) => b?.type === 'text');
  const text = textBlock?.text ?? '[]';
  try {
    const parsed = parseJsonLoose(text) as Topic[];
    return parsed.map(t => ({ ...t, action: normalizeAction(t.action as unknown as string) }));
  } catch {
    return [{
      start_time: fmtET(startTs),
      title: 'Summary parse failed - raw model output attached',
      summary: text.slice(0, 1500),
      brand: 'Other/Unclear',
      action: 'FYI_ONLY',
      action_reason: 'Claude did not return valid JSON for this session; showing raw output so nothing is silently dropped.',
      next_step: 'Review manually.',
    }];
  }
}

Deno.serve(async (req: Request) => {
  const { data: secretRows } = await db
    .from('lesaruss_secrets')
    .select('key, value')
    .in('key', ['CRON_SECRET', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY']);

  const secrets: Record<string, string> = {};
  for (const row of (secretRows ?? [])) secrets[row.key] = row.value;

  const CRON_SECRET = secrets['CRON_SECRET'] ?? '';
  const RESEND_API_KEY = secrets['RESEND_API_KEY'] ?? '';
  const ANTHROPIC_API_KEY = secrets['ANTHROPIC_API_KEY'] ?? '';

  const authHeader = req.headers.get('x-cron-secret') ?? req.headers.get('authorization') ?? '';
  if (authHeader !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: transcripts, error: tErr } = await db
    .from('fieldy_transcripts')
    .select('id, received_at, transcript_text, is_command, command_status, command_summary, command_result')
    .gte('received_at', since)
    .order('received_at', { ascending: true });

  if (tErr) {
    return new Response(JSON.stringify({ error: 'failed to load fieldy_transcripts', detail: tErr }), { status: 500 });
  }

  const rows = transcripts ?? [];

  // cluster into sessions by time gap
  type Row = typeof rows[number];
  const clusters: Row[][] = [];
  let current: Row[] = [];
  let lastTs: number | null = null;
  for (const r of rows) {
    const ts = new Date(r.received_at).getTime();
    if (lastTs !== null && ts - lastTs > GAP_MS) {
      if (current.length) clusters.push(current);
      current = [];
    }
    current.push(r);
    lastTs = ts;
  }
  if (current.length) clusters.push(current);

  const substantiveClusters = clusters.filter(c => {
    const totalChars = c.reduce((sum, r) => sum + (r.transcript_text ?? '').trim().length, 0);
    return totalChars >= MIN_CLUSTER_CHARS;
  });

  const openCommands = rows.filter(r => r.is_command && !['completed', 'done'].includes((r.command_status ?? '').toLowerCase()));

  let topics: Topic[] = [];
  let summarizationErrors: string[] = [];

  if (ANTHROPIC_API_KEY) {
    const results = await Promise.allSettled(
      substantiveClusters.map(c => summarizeSession(ANTHROPIC_API_KEY, c, c[0].received_at, c[c.length - 1].received_at))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') topics.push(...r.value);
      else summarizationErrors.push(String(r.reason));
    }
  } else {
    summarizationErrors.push('ANTHROPIC_API_KEY not found in lesaruss_secrets - cannot summarize.');
  }

  if (rows.length === 0 && openCommands.length === 0) {
    await db.from('stream_events').insert({
      owner: 'fieldy-digest',
      station: 'system',
      summary: 'Fieldy digest: no transcripts or substantive sessions in the last 24h - not emailed.',
      status: 'completed',
    });
    return new Response(JSON.stringify({ sent: false, reason: 'nothing to report' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Fail loud, don't ship a misleading digest: if there WERE substantive
  // sessions but every single one failed to summarize, do not send an email
  // that reads as "nothing needs attention" - that's worse than no email.
  if (substantiveClusters.length > 0 && topics.length === 0 && summarizationErrors.length > 0) {
    await db.from('stream_events').insert({
      owner: 'fieldy-digest',
      station: 'system',
      summary: `Fieldy digest BLOCKED: ${substantiveClusters.length} substantive session(s) existed but summarization failed for all of them - not emailed to avoid a false "nothing needs attention" report. Errors: ${summarizationErrors.join(' | ').slice(0, 800)}`,
      status: 'blocked',
    });
    return new Response(JSON.stringify({ sent: false, reason: 'all summarization failed, refused to send misleading digest', summarizationErrors }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const needsAction = topics.filter(t => t.action === 'NEEDS_PLAYBOOK_ENTRY' || t.action === 'NEEDS_DECISION');
  const fyi = topics.filter(t => t.action === 'ALREADY_ACTIONABLE_NO_FOLLOWUP' || t.action === 'FYI_ONLY');
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });

  function renderTopic(t: Topic) {
    const badge = t.action === 'NEEDS_PLAYBOOK_ENTRY' ? 'Log to playbook/tracker' : t.action === 'NEEDS_DECISION' ? 'Needs your decision' : t.action === 'ALREADY_ACTIONABLE_NO_FOLLOWUP' ? 'Already handled' : 'FYI only';
    return `
      <li style="margin-bottom: 20px; list-style: none;">
        <div style="font-weight: 600;">${t.start_time} ET — ${t.title} <span style="font-weight: 400; color: #0b5fff;">(${t.brand})</span></div>
        <div style="color: #444; margin-top: 4px;">${t.summary}</div>
        <div style="color: #666; margin-top: 4px; font-size: 13px;"><strong>${badge}:</strong> ${t.action_reason}</div>
        ${t.next_step && t.next_step !== 'None' ? `<div style="color: #666; font-size: 13px;"><strong>Next step:</strong> ${t.next_step}</div>` : ''}
      </li>`;
  }

  function renderCommand(r: Row) {
    return `
      <li style="margin-bottom: 14px; list-style: none;">
        <div style="font-weight: 600;">${fmtET(r.received_at)} ET — voice command (status: ${r.command_status ?? 'unknown'})</div>
        <div style="color: #444; margin-top: 2px;">${(r.command_summary ?? r.command_result ?? '').toString().slice(0, 400)}</div>
      </li>`;
  }

  const htmlBody = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 4px;">Fieldy Daily Digest</h2>
      <p style="color: #555; margin-top: 0;">${dateStr} — last 24 hours — ${substantiveClusters.length} recording session(s), ${topics.length} distinct topic(s)</p>
      ${openCommands.length > 0 ? `<h3>Open voice commands (${openCommands.length})</h3><ul style="padding-left: 0;">${openCommands.map(renderCommand).join('')}</ul>` : ''}
      ${needsAction.length > 0 ? `<h3>Needs your attention (${needsAction.length})</h3><ul style="padding-left: 0;">${needsAction.map(renderTopic).join('')}</ul>` : `<p style="color: #888;">Nothing needs a decision or a new playbook entry in this window.</p>`}
      ${fyi.length > 0 ? `<h3>FYI / already handled (${fyi.length})</h3><ul style="padding-left: 0;">${fyi.map(renderTopic).join('')}</ul>` : ''}
      ${summarizationErrors.length > 0 ? `<p style="color: #b00; font-size: 13px;">Partial summarization issues (some sessions may be missing above): ${summarizationErrors.join(' | ').slice(0, 500)}</p>` : ''}
      <p style="color: #888; font-size: 13px;">Full raw transcripts: <a href="${STUDIO_TABLE_URL}/fieldy_transcripts">fieldy_transcripts</a>.</p>
    </div>
  `.trim();

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: DIGEST_FROM,
      to: DIGEST_TO,
      subject: `Fieldy Digest: ${needsAction.length} item(s) need attention`,
      html: htmlBody,
    }),
  });

  const resendResult = await resendResp.json().catch(() => null);

  await db.from('stream_events').insert({
    owner: 'fieldy-digest',
    station: 'system',
    summary: `Fieldy digest sent to ${DIGEST_TO}: ${substantiveClusters.length} session(s), ${topics.length} topic(s), ${needsAction.length} needing attention.`,
    status: resendResp.ok ? 'completed' : 'in_progress',
  });

  return new Response(JSON.stringify({
    sent: resendResp.ok,
    sessionCount: substantiveClusters.length,
    topicCount: topics.length,
    needsAction,
    fyi,
    summarizationErrors,
    resend: resendResult,
  }), {
    status: resendResp.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
});
