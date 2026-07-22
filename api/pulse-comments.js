const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mirrors the JWT signing scheme used by the ve-auth Supabase Edge Function
// (supabase/functions/ve-auth/index.ts: signJWT()). Same derived secret, so
// a token issued by ve-auth can be verified here without a network round trip.
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function verifyVeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  try {
    const secret = Buffer.from((SERVICE_ROLE_KEY || '').slice(0, 32).padEnd(32, '0'));
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest();
    const expectedSigB64 = expectedSig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSigB64);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(b64urlDecode(payload));
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (!decoded.sub) return null;
    return decoded; // { sub: member_id, email, tier, brand, iat, exp }
  } catch (e) {
    return null;
  }
}

async function sbFetch(path, key, opts) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(opts && opts.headers ? opts.headers : {}),
    },
  });
  return res;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const slug = (req.query && req.query.slug) || '';
  if (!slug) {
    res.status(400).json({ error: 'slug required' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const commentsRes = await sbFetch(
        `/ve_pulse_comments?post_slug=eq.${encodeURIComponent(slug)}&is_flagged=eq.false&order=created_at.asc&select=id,content,created_at,member_id`,
        SUPABASE_ANON_KEY,
        { method: 'GET' }
      );
      const comments = await commentsRes.json();
      if (!Array.isArray(comments)) {
        res.status(200).json({ comments: [] });
        return;
      }
      const memberIds = [...new Set(comments.map((c) => c.member_id).filter(Boolean))];
      let membersById = {};
      if (memberIds.length) {
        const inList = memberIds.map((id) => `"${id}"`).join(',');
        const membersRes = await sbFetch(
          `/members?id=in.(${inList})&select=id,name,initials,color,avatar_url`,
          SUPABASE_ANON_KEY,
          { method: 'GET' }
        );
        const members = await membersRes.json();
        if (Array.isArray(members)) {
          members.forEach((m) => { membersById[m.id] = m; });
        }
      }
      const out = comments.map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        member: membersById[c.member_id]
          ? {
              name: membersById[c.member_id].name,
              initials: membersById[c.member_id].initials,
              color: membersById[c.member_id].color,
              avatar_url: membersById[c.member_id].avatar_url,
            }
          : { name: 'VE Member', initials: 'VE', color: '#22C55E', avatar_url: null },
      }));
      res.status(200).json({ comments: out });
    } catch (e) {
      res.status(500).json({ error: 'Failed to load comments' });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!SERVICE_ROLE_KEY) {
      res.status(500).json({ error: 'Server not configured' });
      return;
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};
    const token = body.token;
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    const decoded = verifyVeToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Sign in with your free Passport to comment.' });
      return;
    }
    if (!content || content.length < 1 || content.length > 2000) {
      res.status(400).json({ error: 'Comment must be between 1 and 2000 characters.' });
      return;
    }

    try {
      const insertRes = await sbFetch('/ve_pulse_comments', SERVICE_ROLE_KEY, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          post_slug: slug,
          member_id: decoded.sub,
          content,
          is_flagged: false,
        }),
      });
      const inserted = await insertRes.json();
      if (!insertRes.ok) {
        res.status(500).json({ error: 'Failed to post comment' });
        return;
      }
      const row = Array.isArray(inserted) ? inserted[0] : inserted;

      const memberRes = await sbFetch(
        `/members?id=eq.${encodeURIComponent(decoded.sub)}&select=name,initials,color,avatar_url`,
        SUPABASE_ANON_KEY,
        { method: 'GET' }
      );
      const memberRows = await memberRes.json();
      const member = Array.isArray(memberRows) && memberRows[0]
        ? memberRows[0]
        : { name: 'VE Member', initials: 'VE', color: '#22C55E', avatar_url: null };

      res.status(201).json({
        comment: {
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          member,
        },
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to post comment' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
