// ve-media-ingest: moves generated media into public storage for the site.
//
// Jobs live in public.ve_media_ingest_jobs (RLS on, no policies), so only the
// service role can queue one. The caller passes a job id; nothing else is trusted.
//
//   kind 'copy': fetch an allowed CDN URL (Higgsfield output) and store it.
//   kind 'bed':  cut an excerpt from a music-beds WAV, downmix to mono 16 kHz,
//                level it to a quiet target RMS with fades, and store it as WAV.
//                The level is baked in so the page can play it under the voice
//                at full element volume (iOS ignores HTMLMediaElement.volume).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const DEST_BUCKET = 'vegan-media';
const DEST_PREFIX = 'onboarding-audio/';
const ALLOWED_HOSTS = [/\.cloudfront\.net$/, /(^|\.)higgsfield\.ai$/];
const MAX_COPY_BYTES = 20 * 1024 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function finish(id: string, status: string, result: Record<string, unknown>) {
  await db.from('ve_media_ingest_jobs').update({ status, result, finished_at: new Date().toISOString() }).eq('id', id);
}

async function copyJob(job: any) {
  const url = new URL(job.source);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.some((re) => re.test(url.hostname))) throw new Error('source host not allowed');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('fetch failed ' + res.status);
  const type = res.headers.get('content-type') || 'application/octet-stream';
  if (!/^audio\/|^video\/|^image\//.test(type)) throw new Error('unexpected content-type ' + type);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_COPY_BYTES) throw new Error('file too large');
  const up = await db.storage.from(DEST_BUCKET).upload(job.dest_path, buf, { contentType: type, upsert: true });
  if (up.error) throw new Error('upload failed: ' + up.error.message);
  return { bytes: buf.byteLength, content_type: type };
}

function readWav(buf: Uint8Array) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tag = (o: number) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let o = 12, channels = 0, rate = 0, bits = 0, dataStart = -1, dataLen = 0;
  while (o + 8 <= buf.byteLength) {
    const id = tag(o), size = dv.getUint32(o + 4, true);
    if (id === 'fmt ') { channels = dv.getUint16(o + 10, true); rate = dv.getUint32(o + 12, true); bits = dv.getUint16(o + 22, true); }
    if (id === 'data') { dataStart = o + 8; dataLen = Math.min(size, buf.byteLength - dataStart); break; }
    o += 8 + size + (size % 2);
  }
  if (dataStart < 0 || bits !== 16 || !channels || !rate) throw new Error('unsupported WAV (need 16-bit PCM)');
  return { dv, channels, rate, dataStart, frames: Math.floor(dataLen / (2 * channels)) };
}

function writeWav(samples: Int16Array, rate: number) {
  const out = new Uint8Array(44 + samples.length * 2);
  const dv = new DataView(out.buffer);
  const put = (o: number, s: string) => { for (let i = 0; i < 4; i++) out[o + i] = s.charCodeAt(i); };
  put(0, 'RIFF'); dv.setUint32(4, 36 + samples.length * 2, true); put(8, 'WAVE');
  put(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  put(36, 'data'); dv.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) dv.setInt16(44 + i * 2, samples[i], true);
  return out;
}

async function bedJob(job: any) {
  const p = job.params || {};
  const startS = Number(p.start_s ?? 0), durS = Math.min(Number(p.dur_s ?? 60), 120);
  const target = Number(p.target_rms ?? 0.022), fadeS = Number(p.fade_s ?? 2.5), factor = 3; // 48 kHz -> 16 kHz
  const dl = await db.storage.from('music-beds').download(job.source);
  if (dl.error || !dl.data) throw new Error('music bed not found');
  const w = readWav(new Uint8Array(await dl.data.arrayBuffer()));
  const first = Math.min(Math.floor(startS * w.rate), w.frames - 1);
  const count = Math.min(Math.floor(durS * w.rate), w.frames - first);
  const outRate = Math.round(w.rate / factor), n = Math.floor(count / factor);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = 0; k < factor; k++) {
      const f = first + i * factor + k, base = w.dataStart + f * 2 * w.channels;
      for (let c = 0; c < w.channels; c++) acc += w.dv.getInt16(base + c * 2, true);
    }
    mono[i] = acc / (factor * w.channels * 32768);
  }
  let sq = 0;
  for (let i = 0; i < n; i++) sq += mono[i] * mono[i];
  const rms = Math.sqrt(sq / Math.max(n, 1)) || 1e-9, gain = target / rms, fadeN = Math.floor(fadeS * outRate);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    let g = gain;
    if (i < fadeN) g *= i / fadeN;
    if (n - i < fadeN) g *= (n - i) / fadeN;
    out[i] = Math.max(-32767, Math.min(32767, Math.round(mono[i] * g * 32768)));
  }
  const wav = writeWav(out, outRate);
  const up = await db.storage.from(DEST_BUCKET).upload(job.dest_path, wav, { contentType: 'audio/wav', upsert: true });
  if (up.error) throw new Error('upload failed: ' + up.error.message);
  return { bytes: wav.byteLength, seconds: n / outRate, source_rms: rms, gain };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let id = '';
  try { id = String((await req.json()).job_id || ''); } catch { /* fall through */ }
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'job_id required' }, 400);

  const { data: job } = await db.from('ve_media_ingest_jobs').select('*').eq('id', id).maybeSingle();
  if (!job) return json({ error: 'job not found' }, 404);
  if (job.status !== 'queued') return json({ error: 'job already ' + job.status }, 409);
  if (!String(job.dest_path).startsWith(DEST_PREFIX) || String(job.dest_path).includes('..')) {
    await finish(id, 'failed', { error: 'dest_path outside ' + DEST_PREFIX });
    return json({ error: 'bad dest_path' }, 400);
  }
  await db.from('ve_media_ingest_jobs').update({ status: 'running' }).eq('id', id);
  try {
    const result = job.kind === 'copy' ? await copyJob(job) : job.kind === 'bed' ? await bedJob(job) : (() => { throw new Error('unknown kind'); })();
    const publicUrl = db.storage.from(DEST_BUCKET).getPublicUrl(job.dest_path).data.publicUrl;
    await finish(id, 'done', { ...result, public_url: publicUrl });
    return json({ ok: true, public_url: publicUrl, ...result });
  } catch (e) {
    await finish(id, 'failed', { error: String((e as Error).message || e) });
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
