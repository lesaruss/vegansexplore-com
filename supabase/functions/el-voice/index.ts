// el-voice: ElevenLabs voice cloning for LESARUSS (Sean, 2026-11-09, playbook ve-podcast-studio: "yes to the voice clone").
// Kept apart from el-media so the Guides' speech path is never touched. Auth: Bearer LESARUSS_ADMIN_TOKEN. The ElevenLabs key is
// read here, server side, and never returned.
// Body:
//   { action: 'subscription' }                                             -> tier, character use, whether cloning is allowed
//   { action: 'voices' }                                                   -> the account's own voices (cloned and designed)
//   { action: 'clone', name, description?, sources: [{ bucket, path }], remove_background_noise? }
//        -> an Instant Voice Clone from clean recordings of one speaker (1 to 25 files from our storage), returns { voice_id }
//   { action: 'delete', voice_id }                                         -> removes a cloned voice
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const EL = 'https://api.elevenlabs.io';
const SOURCES = ['vegan-media', 'geekfon-media'];
const okPath = (p: string) => /^[A-Za-z0-9_\-\/.]+$/.test(p) && !p.includes('..');

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rows } = await db.from('lesaruss_secrets').select('key,value').in('key', ['LESARUSS_ADMIN_TOKEN', 'ELEVENLABS_API_KEY']);
  const sec: Record<string, string> = {}; (rows || []).forEach((r: { key: string; value: string }) => { sec[r.key] = r.value; });
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!sec.LESARUSS_ADMIN_TOKEN || supplied !== sec.LESARUSS_ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401);
  if (!sec.ELEVENLABS_API_KEY) return json({ error: 'ELEVENLABS_API_KEY unavailable' }, 500);
  const key = { 'xi-api-key': sec.ELEVENLABS_API_KEY };
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'subscription') {
      const r = await fetch(`${EL}/v1/user/subscription`, { headers: key });
      const o = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: `elevenlabs ${r.status}`, detail: o }, 502);
      return json({ tier: o.tier, status: o.status, character_count: o.character_count, character_limit: o.character_limit,
        can_use_instant_voice_cloning: o.can_use_instant_voice_cloning, can_use_professional_voice_cloning: o.can_use_professional_voice_cloning,
        voice_slots_used: o.voice_slots_used, voice_limit: o.voice_limit, next_character_count_reset_unix: o.next_character_count_reset_unix });
    }
    if (b.action === 'voices') {
      const r = await fetch(`${EL}/v2/voices?page_size=100&voice_type=personal`, { headers: key });
      const o = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: `elevenlabs ${r.status}`, detail: o }, 502);
      return json({ voices: (o.voices || []).map((v: Record<string, unknown>) => ({ voice_id: v.voice_id, name: v.name, category: v.category })) });
    }
    if (b.action === 'clone') {
      const name = String(b.name || '').slice(0, 80), list = Array.isArray(b.sources) ? b.sources.slice(0, 25) : [];
      if (!name || !list.length) return json({ error: 'name and sources needed' }, 400);
      const fd = new FormData();
      fd.append('name', name);
      if (b.description) fd.append('description', String(b.description).slice(0, 500));
      fd.append('remove_background_noise', b.remove_background_noise === false ? 'false' : 'true');
      for (const [i, s] of list.entries()) {
        const bk = String(s.bucket || ''), p = String(s.path || '');
        if (!SOURCES.includes(bk) || !okPath(p)) return json({ error: `bad source ${i}` }, 400);
        const { data, error } = await db.storage.from(bk).download(p);
        if (error || !data) return json({ error: `source ${i}: ${error?.message || 'missing'}` }, 400);
        fd.append('files', new Blob([await data.arrayBuffer()], { type: 'audio/mpeg' }), p.split('/').pop() || `sample-${i}.mp3`);
      }
      const r = await fetch(`${EL}/v1/voices/add`, { method: 'POST', headers: key, body: fd });
      const t = await r.text();
      if (!r.ok) return json({ error: `elevenlabs ${r.status}`, detail: t.slice(0, 800) }, 502);
      const o = JSON.parse(t);
      return json({ voice_id: o.voice_id, requires_verification: o.requires_verification });
    }
    if (b.action === 'delete') {
      const id = String(b.voice_id || '');
      if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return json({ error: 'bad voice_id' }, 400);
      const r = await fetch(`${EL}/v1/voices/${id}`, { method: 'DELETE', headers: key });
      return json({ ok: r.ok, status: r.status });
    }
    return json({ error: 'action must be subscription, voices, clone or delete' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
