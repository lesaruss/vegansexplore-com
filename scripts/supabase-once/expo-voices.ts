// One-time function (canon ops-supabase-write-once-function), 2026-11-21: the World Vegan Expo Guide's narration.
// Sean records in the HQ voice booth (set ve-expo-narration); Logan cleans each take locally, then:
//   POST ?step=stt          body = the cleaned mp3  -> ElevenLabs scribe words (the key is read here, server side)
//   POST ?step=put&name=... body = the cleaned mp3  -> vegan-media/media/voices/expo/<name> (liz-expo-n-<view>-vN.mp3 only)
// Header x-run-key: KEY (scratchpad only). Redeployed as the 410 stub once every keeper is up.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KEY = '<random 48 hex characters>'
const NAME = /^liz-expo-n-[a-z]+(-[a-z]+)?-v[0-9]+\.mp3$/

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const u = new URL(req.url), step = u.searchParams.get('step') || ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const audio = new Uint8Array(await req.arrayBuffer())
  if (audio.length < 1000) return Response.json({ error: 'no audio' }, { status: 400 })
  if (step === 'stt') {
    const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'ELEVENLABS_API_KEY').single()
    const fd = new FormData()
    fd.append('file', new Blob([audio], { type: 'audio/mpeg' }), 'audio.mp3')
    fd.append('model_id', 'scribe_v1')
    fd.append('timestamps_granularity', 'word')
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': data!.value }, body: fd })
    const t = await r.text()
    if (!r.ok) return Response.json({ error: `stt ${r.status}`, detail: t.slice(0, 400) }, { status: 502 })
    const o = JSON.parse(t)
    return Response.json({ text: o.text, words: (o.words || []).filter((w: any) => w.type === 'word').map((w: any) => [w.text, w.start, w.end]) })
  }
  if (step === 'put') {
    const name = u.searchParams.get('name') || ''
    if (!NAME.test(name)) return Response.json({ error: 'bad name' }, { status: 400 })
    const path = `media/voices/expo/${name}`
    const { error } = await db.storage.from('vegan-media').upload(path, audio, { contentType: 'audio/mpeg', upsert: true, cacheControl: '300' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/vegan-media/${path}`, bytes: audio.length })
  }
  return Response.json({ error: 'unknown_step' }, { status: 400 })
})

// The stub, once every keeper is up:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
