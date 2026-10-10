// ve-content-index: the content index (Sean, 2026-10-10: "go ahead and start on the content index"). Ten years of our
// episodes and interviews, searchable by topic with timestamps, so a Guide can play the exact moment ("dairy" returns every
// moment across every show, who said it, and a play button that starts at that second).
//
// Step 1 (this function): timestamped transcripts. YouTube captions first (free): the video's own caption track, else
// YouTube's automatic one, read server side and saved as segments [{s, e, t}] in ve_content_transcripts. Episodes not on
// YouTube get theirs from TurboScribe (SRT files, `srt` action). Step 2 (topics: moments tagged by the Background writer)
// and step 3 (search and clips) build on these rows.
//
// POST, Authorization: Bearer <LESARUSS_ADMIN_TOKEN> (Logan, crons):
//   youtube { content_id }      fetch one episode's captions
//   youtube_batch { limit? }    the next episodes on YouTube with no transcript yet (default 10)
//   srt { content_id, srt, source? }  save a transcript from an SRT file (TurboScribe)
//   status                      how many episodes have a timestamped transcript, by show
// Depot > Content index (a signed-in super admin, Bearer <ve_token>): status, episodes (every episode with its transcript
// state), match (which episode each dropped file is, read from what is said in it) and srt (save a file to its episode).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

type Seg = { s: number; e: number; t: string };
type Track = { baseUrl: string; languageCode?: string; kind?: string; name?: { simpleText?: string; runs?: { text: string }[] } };

const clean = (t: string) => t.replace(/\[(music|applause|laughter)\]/gi, '').replace(/\s+/g, ' ').trim();

// The caption tracks, from the watch page; if YouTube withholds them there, from the player API as the Android app.
async function tracksFor(id: string): Promise<{ tracks: Track[]; length: number | null; how: string; note?: string }> {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en&bpctr=9999999999`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' } });
    const html = await r.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|<\/script>)/s);
    if (m) {
      const p = JSON.parse(m[1]);
      const tracks = p?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const length = Number(p?.videoDetails?.lengthSeconds) || null;
      if (tracks.length) return { tracks, length, how: 'watch' };
      const why = p?.playabilityStatus?.status && p.playabilityStatus.status !== 'OK' ? `${p.playabilityStatus.status}: ${p.playabilityStatus.reason || ''}` : 'no captions on the watch page';
      const alt = await playerApi(id);
      return alt.tracks.length ? { ...alt, length: alt.length || length } : { tracks: [], length, how: 'watch', note: why };
    }
  } catch { /* fall through */ }
  return await playerApi(id);
}
async function playerApi(id: string): Promise<{ tracks: Track[]; length: number | null; how: string; note?: string }> {
  try {
    const r = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip' },
      body: JSON.stringify({ videoId: id, context: { client: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 34, hl: 'en' } } }),
    });
    const p = await r.json();
    return { tracks: p?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [], length: Number(p?.videoDetails?.lengthSeconds) || null, how: 'player',
      note: p?.playabilityStatus?.status !== 'OK' ? `${p?.playabilityStatus?.status}: ${p?.playabilityStatus?.reason || ''}` : undefined };
  } catch (e) { return { tracks: [], length: null, how: 'player', note: String((e as Error).message || e) }; }
}

// English first, a person's captions before YouTube's automatic ones.
function pick(tracks: Track[]): Track | null {
  const en = tracks.filter((t) => (t.languageCode || '').startsWith('en'));
  return en.find((t) => t.kind !== 'asr') || en[0] || tracks.find((t) => t.kind !== 'asr') || tracks[0] || null;
}

async function segmentsFrom(track: Track): Promise<Seg[]> {
  const url = track.baseUrl.replace(/&fmt=[^&]*/, '') + '&fmt=json3';
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  const d = await r.json().catch(() => null);
  const out: Seg[] = [];
  for (const ev of d?.events || []) {
    if (!ev.segs) continue;
    const t = clean(ev.segs.map((x: { utf8?: string }) => x.utf8 || '').join(''));
    if (!t) continue;
    const s = (ev.tStartMs || 0) / 1000, e = s + (ev.dDurationMs || 0) / 1000;
    out.push({ s: Math.round(s * 10) / 10, e: Math.round(e * 10) / 10, t });
  }
  return out;
}

// SRT (TurboScribe's timestamped export) to segments.
function fromSrt(srt: string): Seg[] {
  const ts = (x: string) => { const m = x.match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0; };
  return srt.replace(/\r/g, '').split(/\n\s*\n/).map((b) => {
    const lines = b.trim().split('\n'); const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) return null;
    const [a, z] = lines[i].split('-->');
    const t = clean(lines.slice(i + 1).join(' '));
    return t ? { s: Math.round(ts(a) * 10) / 10, e: Math.round(ts(z) * 10) / 10, t } : null;
  }).filter(Boolean) as Seg[];
}

async function save(contentId: string, source: string, language: string | null, segs: Seg[], length: number | null, fileName: string | null = null) {
  const text = segs.map((x) => x.t).join(' ');
  await db.from('ve_content_transcripts').upsert({ content_id: contentId, source, language, segments: segs, text, words: text.split(/\s+/).length, file_name: fileName,
    duration_seconds: length || Math.ceil(segs.length ? segs[segs.length - 1].e : 0) || null, status: 'ready', note: null, fetched_at: new Date().toISOString() });
  if (length) await db.from('ve_pulse_content').update({ duration_seconds: length }).eq('id', contentId).is('duration_seconds', null);
}

async function youtube(contentId: string) {
  const { data: c } = await db.from('ve_pulse_content').select('id,title,youtube_id').eq('id', contentId).maybeSingle();
  if (!c?.youtube_id) return { content_id: contentId, result: 'no_youtube' };
  const t = await tracksFor(c.youtube_id);
  const track = pick(t.tracks);
  if (!track) {
    await db.from('ve_content_transcripts').upsert({ content_id: c.id, source: 'youtube', status: 'no_captions', note: `${t.how}: ${t.note || 'no caption tracks'}`.slice(0, 300), fetched_at: new Date().toISOString() });
    if (t.length) await db.from('ve_pulse_content').update({ duration_seconds: t.length }).eq('id', c.id).is('duration_seconds', null);
    return { title: c.title, result: 'no_captions', note: t.note, how: t.how };
  }
  const segs = await segmentsFrom(track);
  if (!segs.length) {
    await db.from('ve_content_transcripts').upsert({ content_id: c.id, source: 'youtube', status: 'failed', note: `${t.how}: caption track came back empty`, fetched_at: new Date().toISOString() });
    return { title: c.title, result: 'empty', how: t.how };
  }
  await save(c.id, track.kind === 'asr' ? 'youtube_auto' : 'youtube', track.languageCode || null, segs, t.length);
  return { title: c.title, result: 'ready', segments: segs.length, auto: track.kind === 'asr', how: t.how };
}

function b64urlBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
// A signed-in member's token (same key as ve-auth), for the Depot page.
async function memberId(token: string): Promise<string | null> {
  try {
    const [h, p, sig] = token.split('.'); if (!h || !p || !sig) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlBytes(sig), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const res = await handle(req);
  const h = new Headers(res.headers); Object.entries(CORS).forEach(([k, v]) => h.set(k, v));
  return new Response(res.body, { status: res.status, headers: h });
});

// Which episode is this file? (Sean, 2026-10-10: "could you look at the transcript to figure out the title"). TurboScribe names
// files after the audio, so the name rarely says. The opening minutes do: the host introduces the guest by name. Each episode is
// scored by its title's words heard in the file's opening, rare words (a guest's name) counting far more than common ones
// (vegan, podcast); an episode that already has an untimed transcript is compared line for line; "episode 12" said early
// counts too, and so does the file name. Returns the best five per file.
const STOP = new Set('the and for with from that this what how why who are was you your our his her its into about plus part ep episode podcast soflo vegans vegan explore lift who pre'.split(' '));
const toks = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length > 2 && !STOP.has(w));
function shingles(s: string, n = 5, cap = 4000) {
  const w = String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).slice(0, cap); const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}
// The file name's show initials and episode number (Sean, 2026-10-10: "most of them have the episode number in the title
// as well with initials for the podcast"): SFV 012, VWL S5E7, PV E16. Episodes carry theirs in the title (Ep 001, E109,
// S5E7) or episode_number.
const SHOWS: [RegExp, string][] = [[/\b(sfvp?|soflo|sfl)\b/i, 'SoFlo Vegans Podcast'], [/\b(vwlp?|vegans who lift)\b/i, 'Vegans Who Lift Podcast'],
  [/\b(pvp?|pre[- ]?vegans?)\b/i, 'Pre-Vegans Podcast'], [/\b(vep|vex|vegans explore)\b/i, 'Vegans Explore Podcast']];
function codeOf(s: string, strict = false) {
  const x = String(s || '').replace(/\.(srt|txt|mp3|m4a|wav|mp4)$/gi, '').replace(/[_.]+/g, ' ');
  const show = (SHOWS.find(([r]) => r.test(x)) || [null, null])[1];
  const se = x.match(/\bs0*(\d{1,2})\s*e0*(\d{1,3})\b/i);
  const ep = se ? null : (x.match(/\b(?:ep(?:isode)?|e)\s*0*(\d{1,4})\b/i) || (!strict && x.match(/(?:^|\s)0*(\d{1,4})(?=\s|$)/)) || [])[1];
  return { show, season: se ? +se[1] : null, num: se ? +se[2] : ep ? +ep : null };
}
// The opening of a transcript, the same however it arrived (a dropped file's text or a saved row's), for "already saved".
const opening = (t: string) => clean(String(t || '')).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 300);
async function match(files: { name?: string; head?: string }[]) {
  const { data: saved } = await db.from('ve_content_transcripts').select('content_id,head,file_name');
  const S = (saved || []).map((r) => ({ id: r.content_id, o: opening(r.head || ''), f: r.file_name }));
  const { data: eps } = await db.from('ve_pulse_content').select('id,title,podcast_show,episode_number,summary,transcript').not('podcast_show', 'is', null).limit(1000);
  const E = (eps || []).map((e) => ({ ...e, code: (() => { const c = codeOf(String(e.title).replace(/^.*?\|/, ''), true); return { season: c.season, num: c.num ?? e.episode_number ?? null }; })(), tw: [...new Set(toks(String(e.title).replace(/\|.*$/, '')))], sw: [...new Set(toks(e.summary || ''))].slice(0, 40),
    sh: e.transcript ? shingles(e.transcript) : null }));
  const df = new Map<string, number>(); E.forEach((e) => new Set([...e.tw, ...e.sw]).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const idf = (w: string) => Math.log((E.length + 1) / ((df.get(w) || 0) + 1));
  return files.slice(0, 40).map((f) => {
    const head = String(f.head || '').slice(0, 30000); const hw = new Set(toks(head.split(/\s+/).slice(0, 1500).join(' ')));
    const fsh = shingles(head); const nameW = new Set(toks(String(f.name || '').replace(/\.(srt|txt)$/i, '')));
    const fc = codeOf(String(f.name || ''));
    const said = head.toLowerCase().split(/\s+/).slice(0, 400).join(' ').match(/episode (?:number )?(\d{1,3})\b/);
    const scored = E.map((e) => {
      const tot = e.tw.reduce((a, w) => a + idf(w), 0) || 1;
      const t = e.tw.reduce((a, w) => a + (hw.has(w) ? idf(w) : 0), 0) / tot;
      const sTot = e.sw.reduce((a, w) => a + idf(w), 0) || 1;
      const sm = e.sw.reduce((a, w) => a + (hw.has(w) ? idf(w) : 0), 0) / sTot;
      const nm = e.tw.reduce((a, w) => a + (nameW.has(w) ? idf(w) : 0), 0) / tot;
      let same = 0; if (e.sh && fsh.size) { let n = 0; fsh.forEach((x) => { if (e.sh!.has(x)) n++; }); same = n / Math.min(fsh.size, e.sh.size); }
      const num = said && e.code.num && +said[1] === e.code.num ? 0.15 : 0;
      const showOk = !fc.show || fc.show === e.podcast_show;
      const numOk = fc.num != null && e.code.num === fc.num && (fc.season == null || fc.season === e.code.season);
      const code = numOk && fc.show && showOk ? 0.75 : numOk && !fc.show ? 0.3 : 0;
      const score = Math.min(1, same > 0.08 ? 0.9 + same : code + 0.6 * t + 0.25 * sm + 0.35 * nm + num) * (showOk ? 1 : 0.5);
      return { id: e.id, score: Math.round(score * 100) / 100 };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    const o = opening(head); const hit = o.length >= 120 ? S.find((r) => r.o && r.o.slice(0, 200) === o.slice(0, 200)) : null;
    return { name: f.name || '', candidates: scored, saved_as: hit ? hit.id : null };
  });
}

async function handle(req: Request): Promise<Response> {
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const body = await req.json().catch(() => ({}));
  const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  if (!sec?.value || given !== sec.value) {
    // The Depot page: a signed-in super admin may read the status and the episodes, and save SRT files.
    const id = given ? await memberId(given) : null;
    const { data: m } = id ? await db.from('members').select('is_superadmin').eq('id', id).maybeSingle() : { data: null };
    if (!m?.is_superadmin || !['status', 'episodes', 'match', 'srt'].includes(String(body.action))) return json({ error: 'unauthorized' }, 401);
  }
  try {
    // What YouTube returns to this server, for diagnosing blocks.
    if (body.action === 'probe') {
      const id = String(body.youtube_id || '');
      const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en&bpctr=9999999999`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' } });
      const html = await r.text();
      const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|<\/script>)/s);
      let ps = null, nTracks = null;
      if (m) { try { const p = JSON.parse(m[1]); ps = p?.playabilityStatus; nTracks = (p?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []).length; } catch (e) { ps = 'parse: ' + String(e); } }
      const pr = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip' },
        body: JSON.stringify({ videoId: id, context: { client: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 34, hl: 'en' } } }) });
      const pt = await pr.text();
      return json({ watch: { status: r.status, final_url: r.url, bytes: html.length, has_player: !!m, playability: ps, tracks: nTracks,
        consent: /consent\.youtube|before you continue/i.test(html), bot: /confirm you.re not a bot|unusual traffic/i.test(html), title: (html.match(/<title>([^<]*)/) || [])[1] || null },
        player: { status: pr.status, bytes: pt.length, head: pt.slice(0, 200) } });
    }
    if (body.action === 'youtube') return json({ ok: true, ...(await youtube(String(body.content_id || ''))) });
    if (body.action === 'youtube_batch') {
      const limit = Math.max(1, Math.min(25, Number(body.limit) || 10));
      const { data: done } = await db.from('ve_content_transcripts').select('content_id');
      const skip = new Set((done || []).map((r) => r.content_id));
      const { data: eps } = await db.from('ve_pulse_content').select('id').not('youtube_id', 'is', null).not('podcast_show', 'is', null).order('published_at', { ascending: false }).limit(1000);
      const todo = (eps || []).filter((e) => !skip.has(e.id)).slice(0, limit);
      const results = [];
      for (const e of todo) { results.push(await youtube(e.id)); await new Promise((r) => setTimeout(r, 400)); }
      return json({ ok: true, done: results.length, left: (eps || []).filter((e) => !skip.has(e.id)).length - results.length, results });
    }
    if (body.action === 'srt') {
      const { data: ep } = await db.from('ve_pulse_content').select('id').eq('id', String(body.content_id || '')).maybeSingle();
      if (!ep) return json({ error: 'no_episode' }, 400);
      const segs = fromSrt(String(body.srt || ''));
      if (!segs.length) return json({ error: 'empty_srt' }, 400);
      await save(String(body.content_id), String(body.source || 'turboscribe'), 'en', segs, null, body.file_name ? String(body.file_name).slice(0, 300) : null);
      return json({ ok: true, segments: segs.length });
    }
    if (body.action === 'match') return json({ ok: true, files: await match(Array.isArray(body.files) ? body.files : []) });
    if (body.action === 'episodes') {
      const { data: eps } = await db.from('ve_pulse_content').select('id,title,podcast_show,youtube_id,published_at,duration_seconds').not('podcast_show', 'is', null).order('published_at', { ascending: false }).limit(1000);
      const { data: tr } = await db.from('ve_content_transcripts').select('content_id,source,status,words,duration_seconds,fetched_at');
      const T = new Map((tr || []).map((t) => [t.content_id, t]));
      return json({ ok: true, episodes: (eps || []).map((e) => ({ ...e, transcript: T.get(e.id) || null })) });
    }
    if (body.action === 'status') {
      const { data } = await db.rpc('ve_content_index_status');
      return json({ ok: true, shows: data });
    }
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
}
