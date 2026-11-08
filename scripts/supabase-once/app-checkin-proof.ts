// ve-once-app-checkin (2026-11-08, ve-mobile-app J): a 15-minute session for the internal test member so the app's place page and Check in
// can be driven in a browser against the live ve-checkin, then `cleanup` removes that member's check-ins, menu sends, photos and points at the
// listing. Run with x-run-key, then redeploy as the 410 stub. The key is a placeholder here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const RUN_KEY = '__RUN_KEY__'; // placeholder; the run used a fresh key kept only in the session scratchpad
const URL_ = Deno.env.get('SUPABASE_URL')!, SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL_, SK);
const MEMBER = '459ced0a-4756-47d7-bdd3-a78865c3a141'; // the Logan test account (Vegans Explore, internal, active, not a super admin)
const b64 = (s: string | Uint8Array) => { const bin = typeof s === 'string' ? s : String.fromCharCode(...s); return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
async function token(sub: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify({ sub, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${h}.${p}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`))))}`;
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== RUN_KEY) return new Response('no', { status: 403 });
  const step = new URL(req.url).searchParams.get('step');
  const j = (o: unknown) => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
  if (step === 'token') {
    const { data: m } = await db.from('members').select('id, name, email, membership_status, home_community, lesars_balance').eq('id', MEMBER).single();
    return j({ token: await token(MEMBER), member: m });
  }
  if (step === 'cleanup') {
    const slug = new URL(req.url).searchParams.get('slug') || 'love-life-cafe';
    const { data: l } = await db.from('listings').select('id').eq('slug', slug).eq('status', 'approved').single();
    const { data: cs } = await db.from('ve_checkins').select('id, points').eq('member_id', MEMBER).eq('listing_id', l!.id).gte('created_at', new Date(Date.now() - 6 * 3600e3).toISOString());
    const out: unknown[] = [];
    for (const c of cs || []) {
      const { data: acts } = await db.from('ve_checkin_actions').select('id, photo_path').eq('checkin_id', c.id);
      const paths = (acts || []).map((a: any) => a.photo_path).filter(Boolean);
      if (paths.length) await db.storage.from('checkin-photos').remove(paths);
      await db.from('ve_checkin_actions').delete().eq('checkin_id', c.id);
      if (c.points > 0) {
        await db.from('points_ledger').delete().eq('ref_id', 'checkin:' + c.id);
        const { data: m } = await db.from('members').select('lesars_balance').eq('id', MEMBER).single();
        await db.from('members').update({ lesars_balance: (m!.lesars_balance || 0) - c.points }).eq('id', MEMBER);
        await db.rpc('apply_member_points_delta', { p_member_id: MEMBER, p_delta: -c.points }).then(() => {}, () => {});
      }
      await db.from('ve_checkins').delete().eq('id', c.id);
      out.push({ checkin: c.id, points: c.points, actions: (acts || []).length, photos: paths.length });
    }
    const { data: m } = await db.from('members').select('lesars_balance').eq('id', MEMBER).single();
    return j({ removed: out, balance_after: m?.lesars_balance });
  }
  return j({ error: 'step' });
});
