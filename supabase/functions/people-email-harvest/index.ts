// people-email-harvest
// Builds the People directory from Sean's own sent mail across four mailboxes.
// Gated: Authorization: Bearer <LESARUSS_ADMIN_TOKEN>. Read-only against Gmail; never sends.
//
// Actions (POST JSON):
//   { action: 'probe' }                                   token + read-scope check per mailbox
//   { action: 'harvest', mailbox, pageToken?, maxMessages? } log sent messages -> people_email_messages
//   { action: 'threads', email, maxChars? }             raw history only, no model call; searches every alias of the owning contact
//   { action: 'profile', email, draft?: true }            read threads across mailboxes, Claude extracts profile,
//                                                          writes people columns (+ people_outreach_drafts)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAILBOXES: Record<string, { secret: string; address: string }> = {
  contact_lr: { secret: 'GMAIL_REFRESH_TOKEN_CONTACT_LR', address: 'contact@lesaruss.com' },
  srussell: { secret: 'GMAIL_REFRESH_TOKEN_SRUSSELL', address: 'srussell@lesaruss.com' },
  contact_ve: { secret: 'GMAIL_REFRESH_TOKEN_CONTACT_VE', address: 'contact@vegansexplore.com' },
  sean_ve: { secret: 'GMAIL_REFRESH_TOKEN_SEAN_VE', address: 'sean@vegansexplore.com' },
};

const MODEL = 'claude-sonnet-5';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Secrets = Record<string, string>;

async function loadSecrets(supabase: any): Promise<Secrets> {
  const keys = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'LESARUSS_ADMIN_TOKEN', 'ANTHROPIC_API_KEY',
    ...Object.values(MAILBOXES).map((m) => m.secret)];
  const { data } = await supabase.from('lesaruss_secrets').select('key,value').in('key', keys);
  const out: Secrets = {};
  (data || []).forEach((r: any) => { out[r.key] = r.value; });
  return out;
}

const tokenCache: Record<string, string> = {};
async function accessToken(s: Secrets, mailbox: string): Promise<string> {
  if (tokenCache[mailbox]) return tokenCache[mailbox];
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: s.GMAIL_CLIENT_ID, client_secret: s.GMAIL_CLIENT_SECRET,
      refresh_token: s[MAILBOXES[mailbox].secret], grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`token ${mailbox}: ${data.error || 'no access_token'} ${data.error_description || ''}`);
  tokenCache[mailbox] = data.access_token;
  return data.access_token;
}

async function gmail(token: string, path: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const header = (h: any[], n: string) => (h || []).find((x: any) => x.name?.toLowerCase() === n.toLowerCase())?.value ?? '';

// "Jane Doe" <jane@x.com>, bob@y.com  ->  [{name, email}]
function parseAddresses(v: string): { name: string; email: string }[] {
  if (!v) return [];
  const out: { name: string; email: string }[] = [];
  const re = /(?:"?([^"<,]*?)"?\s*<([^>]+)>|([^\s,<>]+@[^\s,<>]+))/g;
  let m;
  while ((m = re.exec(v))) {
    const email = (m[2] || m[3] || '').trim().toLowerCase();
    if (email.includes('@')) out.push({ name: (m[1] || '').trim(), email });
  }
  return out;
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

function decode(data: string): string {
  try {
    const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch { return ''; }
}

function bodyText(p: any): string {
  if (!p) return '';
  if (p.mimeType === 'text/plain' && p.body?.data) return decode(p.body.data);
  if (p.parts) {
    const plain = p.parts.map(bodyText).find((t: string) => t);
    if (plain) return plain;
  }
  if (p.mimeType === 'text/html' && p.body?.data) {
    return decode(p.body.data).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');
  }
  return '';
}

// Drop quoted history so each message contributes only what was newly written.
function stripQuoted(t: string): string {
  const lines = t.split(/\r?\n/);
  const out: string[] = [];
  for (const l of lines) {
    if (/^On .{5,200}wrote:\s*$/.test(l.trim()) || /^-{2,}\s*Original Message/i.test(l.trim()) || /^From: .+/.test(l.trim()) && out.length > 3) break;
    if (l.trim().startsWith('>')) continue;
    out.push(l);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function probe(s: Secrets) {
  const results: Record<string, unknown> = {};
  for (const key of Object.keys(MAILBOXES)) {
    try {
      const t = await accessToken(s, key);
      const prof = await gmail(t, 'profile');
      const list = await gmail(t, 'messages?q=in:sent&maxResults=1');
      results[key] = { profile_status: prof.status, email: prof.body.emailAddress, total: prof.body.messagesTotal,
        sent_list_status: list.status, sent_estimate: list.body.resultSizeEstimate, error: list.body.error?.message };
    } catch (e) { results[key] = { error: (e as Error).message }; }
  }
  return results;
}

async function harvest(s: Secrets, supabase: any, mailbox: string, pageToken: string | undefined, maxMessages: number) {
  const t = await accessToken(s, mailbox);
  let ids: { id: string; threadId: string }[] = [];
  let next: string | undefined = pageToken;
  do {
    const p = new URLSearchParams({ q: 'in:sent', maxResults: '100' });
    if (next) p.set('pageToken', next);
    const r = await gmail(t, `messages?${p}`);
    if (r.status !== 200) throw new Error(`list ${mailbox} ${r.status}: ${JSON.stringify(r.body.error || r.body)}`);
    ids = ids.concat(r.body.messages || []);
    next = r.body.nextPageToken;
  } while (next && ids.length < maxMessages);

  const { data: existing } = await supabase.from('people_email_messages').select('message_id')
    .eq('mailbox', mailbox).in('message_id', ids.map((m) => m.id));
  const seen = new Set((existing || []).map((r: any) => r.message_id));
  const todo = ids.filter((m) => !seen.has(m.id));

  const rows = (await pool(todo, 20, async (m) => {
    const r = await gmail(t, `messages/${m.id}?format=metadata&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc&metadataHeaders=Subject&metadataHeaders=Date`);
    if (r.status !== 200) return null;
    const h = r.body.payload?.headers || [];
    const recips = [...parseAddresses(header(h, 'To')), ...parseAddresses(header(h, 'Cc')), ...parseAddresses(header(h, 'Bcc'))];
    return {
      mailbox, message_id: m.id, thread_id: m.threadId,
      sent_at: r.body.internalDate ? new Date(Number(r.body.internalDate)).toISOString() : null,
      subject: header(h, 'Subject').slice(0, 500), recipients: recips, recipient_count: recips.length,
    };
  })).filter(Boolean);

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('people_email_messages').upsert(rows.slice(i, i + 200), { onConflict: 'mailbox,message_id' });
    if (error) throw new Error(`upsert: ${error.message}`);
  }
  return { mailbox, listed: ids.length, new_rows: rows.length, nextPageToken: next ?? null };
}

const BRAND_GUIDE = `LESARUSS brands you may recommend (pick the single best fit, based only on what the emails show about this person):
- vegans-explore: VEGANS EXPLORE, a Vegan community and discovery platform: city guides, events, plant-based businesses and partners. Fits Vegans, plant-based business owners, event organizers, food and wellness people, community partners.
- lesaruss-ai: LESARUSS AI, a membership community that teaches people to use AI through guides, step-by-step wizards and live hot labs. Fits creators, entrepreneurs, small business owners, consultants, marketers, anyone Sean built websites, tech or creative work with.
- ada-unlocked: ADA Unlocked, digital accessibility (ADA, WCAG) training and tools for organizations. Fits school, district, government, nonprofit and web/communications staff responsible for accessibility.
- geekfon-society: GeekFon Society, an AI music universe and label. Fits music industry, artists, labels, producers.
- k12-unlocked: K12 Unlocked, school marketing and communications platform. Fits K-12 school leaders and school communications staff (not accessibility-specific).
- none: a vendor, service provider, automated sender, or someone with no plausible fit.`;

// Every address on file for the contact that owns this one (people_emails, migration 021).
// Mail to or from any alias belongs to the one person.
async function resolveAliases(supabase: any, email: string): Promise<{ personId: string | null; emails: string[] }> {
  email = email.toLowerCase();
  const { data: owner } = await supabase.from('people_emails').select('person_id').eq('email', email).maybeSingle();
  if (!owner) return { personId: null, emails: [email] };
  const { data: rows } = await supabase.from('people_emails').select('email').eq('person_id', owner.person_id).limit(20);
  const emails = [...new Set([email, ...((rows || []) as { email: string }[]).map((r) => r.email)])];
  return { personId: owner.person_id, emails };
}

// Gather the contact's recent mail across every connected mailbox and every alias, oldest first.
async function collectThreads(s: Secrets, email: string, maxChars = 60000, aliases: string[] = []) {
  email = email.toLowerCase();
  const addresses = [...new Set([email, ...aliases.map((a) => a.toLowerCase())])];
  const collected: any[] = [];
  const mailboxesHit: string[] = [];
  for (const key of Object.keys(MAILBOXES)) {
    try {
      const t = await accessToken(s, key);
      const q = encodeURIComponent(addresses.map((a) => `from:${a} OR to:${a} OR cc:${a}`).join(' OR '));
      const r = await gmail(t, `messages?q=${q}&maxResults=40`);
      const ids = (r.body.messages || []) as { id: string }[];
      if (!ids.length) continue;
      mailboxesHit.push(key);
      const msgs = await pool(ids.slice(0, 15), 8, async (m) => {
        const d = await gmail(t, `messages/${m.id}?format=full`);
        if (d.status !== 200) return null;
        const h = d.body.payload?.headers || [];
        return {
          mailbox: MAILBOXES[key].address, ts: Number(d.body.internalDate || 0),
          from: header(h, 'From'), to: header(h, 'To'), cc: header(h, 'Cc'), subject: header(h, 'Subject'),
          text: stripQuoted(bodyText(d.body.payload)).slice(0, 2500),
        };
      });
      collected.push(...msgs.filter(Boolean).map((m) => ({ ...m, total_in_mailbox: ids.length })));
    } catch (_) { /* mailbox unavailable; continue with the rest */ }
  }
  if (!collected.length) return null;

  collected.sort((a, b) => a.ts - b.ts);
  const trimmed = collected.slice(-24);
  const transcript = trimmed.map((m) =>
    `--- ${new Date(m.ts).toISOString().slice(0, 10)} | mailbox ${m.mailbox}\nFrom: ${m.from}\nTo: ${m.to}${m.cc ? `\nCc: ${m.cc}` : ''}\nSubject: ${m.subject}\n\n${m.text}`
  ).join('\n\n').slice(-maxChars); // keep the newest text when over the cap

  return { email, addresses, collected, mailboxesHit, trimmed, transcript };
}

async function profile(s: Secrets, supabase: any, email: string, wantDraft: boolean) {
  const alias = await resolveAliases(supabase, email);
  const found = await collectThreads(s, email, 60000, alias.emails);
  if (!found) return { email: email.toLowerCase(), found: false };
  const { collected, mailboxesHit, trimmed, transcript } = found;
  email = found.email;

  const { data: person } = alias.personId
    ? await supabase.from('people').select('*').eq('id', alias.personId).maybeSingle()
    : { data: null };
  // Sean's own record (every address he sends from) is never profiled or drafted.
  if (person?.is_self) return { email, found: true, person_id: person.id, skipped: 'self' };

  const brands = ['vegans-explore', 'lesaruss-ai', 'ada-unlocked', 'geekfon-society', 'k12-unlocked', 'none'];
  const str = { type: ['string', 'null'] };
  const schema: Record<string, unknown> = {
    type: 'object',
    properties: {
      is_person: { type: 'boolean', description: 'false for automated senders, no-reply, newsletters, receipts, platforms, generic support desks' },
      first_name: str, last_name: str, organization: str, title: str, phone: str, website: str,
      mailing_address: { type: ['string', 'null'], description: 'only if a street or postal address appears, e.g. in a signature' },
      city: str, region: { type: ['string', 'null'], description: 'state or province' }, country: str,
      relationship_summary: { type: 'string', description: '2-3 plain sentences: who they are to Sean and how the relationship has gone' },
      history: { type: 'array', description: 'one entry per meaningful exchange, oldest first, max 10',
        items: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, summary: { type: 'string' } }, required: ['date', 'summary'] } },
      last_contact_summary: { type: 'string', description: 'what the most recent exchange was about and where it was left' },
      recommended_brand: { type: 'string', enum: brands },
      brand_rationale: { type: 'string', description: 'one sentence, grounded in the emails' },
      outreach_angle: { type: 'string', description: 'one sentence: the personal hook for reaching out now' },
      ...(wantDraft ? {
        draft_subject: str,
        draft_body: { type: ['string', 'null'], description: 'null when recommended_brand is none or is_person is false' },
      } : {}),
    },
    required: ['is_person', 'relationship_summary', 'history', 'last_contact_summary', 'recommended_brand', 'brand_rationale', 'outreach_angle'],
  };

  const prompt = `You are building a contact profile for Sean A. Russell (founder of LESARUSS) from his real email history with ${email}. Use ONLY facts present in the emails. Never guess. Use null when unknown. Sean Russell is the mailbox owner and is never the contact: never use Sean's name, phone number, title, organization or signature for this person. If the only name or phone in the thread is Sean's, use null. Record the profile with the save_profile tool.

${BRAND_GUIDE}
${wantDraft ? `
Draft rules for draft_subject and draft_body: a short personal note from Sean (first person, warm, plain, under 160 words) that references something real from their history, then invites them to join the recommended community as a personal invitation. Sign off "Sean". Use the literal placeholder {{invite_link}} where the link goes. No prices, no statistics, no claims not supported by the emails or the brand description above. Never use the word "sorry" or any apology. No em dashes. American English. Always capitalize Vegan. Greet them by first name if known.` : ''}

EMAILS (oldest first):
${transcript}`;

  const ai = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': s.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 16000, // R (2026-11-08): thinking counts against max_tokens
      tools: [{ name: 'save_profile', description: 'Save the contact profile.', input_schema: schema }],
      tool_choice: { type: 'tool', name: 'save_profile' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const aiBody = await ai.json();
  if (ai.status !== 200) throw new Error(`anthropic ${ai.status}: ${JSON.stringify(aiBody.error || aiBody)}`);
  if (aiBody.stop_reason === 'max_tokens') throw new Error('model cut off');
  const p = (aiBody.content || []).find((c: any) => c.type === 'tool_use')?.input;
  if (!p) throw new Error('model returned no profile');
  const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\u2014/g, ', ').replace(/\bvegan(s?)\b/g, 'Vegan$1').trim() || null : v ?? null);

  const firstTs = collected[0].ts, lastTs = collected[collected.length - 1].ts;
  const messageCount = [...new Set(mailboxesHit)].reduce((n, k) =>
    n + (collected.find((m) => m.mailbox === MAILBOXES[k].address)?.total_in_mailbox || 0), 0);
  const fill = (cur: any, next: any) => (cur === null || cur === undefined || cur === '' ? next : cur);

  const update: Record<string, unknown> = {
    first_name: fill(person?.first_name, clean(p.first_name)),
    last_name: fill(person?.last_name, clean(p.last_name)),
    organization: fill(person?.organization, clean(p.organization)),
    title: fill(person?.title, clean(p.title)),
    phone: fill(person?.phone, clean(p.phone)),
    website: fill(person?.website, clean(p.website)),
    mailing_address: fill(person?.mailing_address, clean(p.mailing_address)),
    city: fill(person?.city, clean(p.city)),
    region: fill(person?.region, clean(p.region)),
    country: fill(person?.country, clean(p.country)),
    relationship_summary: clean(p.relationship_summary),
    history: Array.isArray(p.history) ? p.history.map((h: any) => ({ date: h.date, summary: clean(h.summary) })) : [],
    notes: person?.notes || clean(p.last_contact_summary),
    recommended_brand: p.recommended_brand || null,
    brand_rationale: clean(p.brand_rationale),
    outreach_angle: clean(p.outreach_angle),
    is_person: p.is_person !== false,
    first_contact_at: new Date(firstTs).toISOString(),
    last_interaction_at: new Date(Math.max(lastTs, person?.last_interaction_at ? Date.parse(person.last_interaction_at) : 0)).toISOString(),
    email_message_count: messageCount,
    email_mailboxes: mailboxesHit.map((k) => MAILBOXES[k].address),
    profiled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let personId = person?.id;
  if (personId) {
    const { error } = await supabase.from('people').update(update).eq('id', personId);
    if (error) throw new Error(`people update: ${error.message}`);
  } else {
    const { data, error } = await supabase.from('people')
      .insert({ ...update, email, source: 'email-history', source_event: `Sent mail: ${update.email_mailboxes}` })
      .select('id').single();
    if (error) throw new Error(`people insert: ${error.message}`);
    personId = data.id;
  }

  let draftId: string | null = null;
  if (wantDraft && p.draft_body && update.is_person && p.recommended_brand !== 'none') {
    const fromMailbox = p.recommended_brand === 'vegans-explore' ? 'sean@vegansexplore.com' : 'srussell@lesaruss.com';
    await supabase.from('people_outreach_drafts').update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('person_id', personId).eq('status', 'draft');
    const { data, error } = await supabase.from('people_outreach_drafts').insert({
      person_id: personId, brand: p.recommended_brand, from_mailbox: fromMailbox,
      subject: clean(p.draft_subject), body: clean(p.draft_body), model: MODEL,
    }).select('id').single();
    if (error) throw new Error(`draft insert: ${error.message}`);
    draftId = data.id;
    await supabase.from('people').update({ outreach_status: 'drafted' }).eq('id', personId).eq('outreach_status', 'not_started');
  }
  return { email, found: true, person_id: personId, draft_id: draftId, brand: p.recommended_brand, is_person: update.is_person, messages_read: trimmed.length };
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const s = await loadSecrets(supabase);
    const auth = req.headers.get('authorization') || '';
    if (!s.LESARUSS_ADMIN_TOKEN || auth !== `Bearer ${s.LESARUSS_ADMIN_TOKEN}`) return json({ error: 'Unauthorized.' }, 401);

    const body = await req.json().catch(() => ({}));
    if (body.action === 'probe') return json(await probe(s));
    if (body.action === 'harvest') {
      if (!MAILBOXES[body.mailbox]) return json({ error: 'unknown mailbox' }, 400);
      return json(await harvest(s, supabase, body.mailbox, body.pageToken, Math.min(body.maxMessages ?? 500, 1000)));
    }
    if (body.action === 'threads') {
      // Raw history for profiling outside this function (no model call, no API spend).
      if (!body.email) return json({ error: 'email required' }, 400);
      const alias = await resolveAliases(supabase, String(body.email));
      const t = await collectThreads(s, body.email, Math.min(body.maxChars ?? 12000, 60000), alias.emails);
      if (!t) return json({ email: String(body.email).toLowerCase(), found: false });
      const count = [...new Set(t.mailboxesHit)].reduce((n, k) =>
        n + (t.collected.find((m) => m.mailbox === MAILBOXES[k].address)?.total_in_mailbox || 0), 0);
      return json({
        email: t.email, person_id: alias.personId, addresses: t.addresses, found: true, mailboxes: t.mailboxesHit.map((k) => MAILBOXES[k].address), message_count: count,
        first_at: new Date(t.collected[0].ts).toISOString(), last_at: new Date(t.collected[t.collected.length - 1].ts).toISOString(),
        transcript: t.transcript,
      });
    }
    if (body.action === 'profile') {
      if (!body.email) return json({ error: 'email required' }, 400);
      return json(await profile(s, supabase, body.email, body.draft !== false));
    }
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
