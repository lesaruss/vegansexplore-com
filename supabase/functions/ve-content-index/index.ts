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
// state), and srt (SRT files dropped on the page, matched to an episode there).
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

async function save(contentId: string, source: string, language: string | null, segs: Seg[], length: number | null) {
  const text = segs.map((x) => x.t).join(' ');
  await db.from('ve_content_transcripts').upsert({ content_id: contentId, source, language, segments: segs, text, words: text.split(/\s+/).length,
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

async function handle(req: Request): Promise<Response> {
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const body = await req.json().catch(() => ({}));
  const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  if (!sec?.value || given !== sec.value) {
    // The Depot page: a signed-in super admin may read the status and the episodes, and save SRT files.
    const id = given ? await memberId(given) : null;
    const { data: m } = id ? await db.from('members').select('is_superadmin').eq('id', id).maybeSingle() : { data: null };
    if (!m?.is_superadmin || !['status', 'episodes', 'srt'].includes(String(body.action))) return json({ error: 'unauthorized' }, 401);
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
      await save(String(body.content_id), String(body.source || 'turboscribe'), 'en', segs, null);
      return json({ ok: true, segments: segs.length });
    }
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
