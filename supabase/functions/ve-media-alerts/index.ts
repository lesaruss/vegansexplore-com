// ve-media-alerts: keeps the private media list current (Sean, 2026-11-13; playbook ve-newsroom; migration 20261113_ve_media_outlets.sql).
// Daily (pg_cron ve-media-alerts-daily) it reads the last days of "Google Alert - Vegan" emails in srussell@lesaruss.com (read-only,
// GMAIL_REFRESH_TOKEN_SRUSSELL) and the News Desk's new Vegans Explore stories, adds new articles and outlets, sorts new outlets by kind,
// scores new articles (flattering / neutral / critical toward the Vegan community) and rolls the scores up per outlet.
// Same parsing and scoring as the backfill (scripts/supabase-once/media-outlets.ts). Social platforms and our own sites are left out.
// POST, x-cron-secret (CRON_SECRET) or Authorization: Bearer LESARUSS_ADMIN_TOKEN. Body { days?: 3 (max 30), score_only?: true }.
// Claude calls: max_tokens 16000, anything but end_turn is an error (CLAUDE.md).
import { createClient } from "jsr:@supabase/supabase-js@2";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MODEL = "claude-sonnet-5-5";
const PLATFORMS = /(^|\.)(youtube\.com|youtu\.be|facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com|reddit\.com|linkedin\.com|pinterest\.com|threads\.net|google\.com|vegansexplore\.com|lesaruss\.com|quora\.com|amazon\.com|etsy\.com)$/;

async function secrets(keys: string[]) {
  const { data } = await db.from("lesaruss_secrets").select("key,value").in("key", keys);
  const s: Record<string, string> = {}; for (const r of data ?? []) s[r.key] = r.value; return s;
}
async function gmailToken() {
  const s = await secrets(["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN_SRUSSELL"]);
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: s.GMAIL_CLIENT_ID, client_secret: s.GMAIL_CLIENT_SECRET, refresh_token: s.GMAIL_REFRESH_TOKEN_SRUSSELL, grant_type: "refresh_token" }) });
  const j = await res.json(); if (!j.access_token) throw new Error("gmail_token: " + (j.error ?? res.status)); return j.access_token as string;
}
async function g(t: string, p: string) {
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + p, { headers: { Authorization: "Bearer " + t } });
  if (!r.ok) throw new Error("gmail " + p.split("?")[0] + " " + r.status); return r.json();
}
const dec = (d: string) => new TextDecoder().decode(Uint8Array.from(atob(d.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
function plain(p: any): string { if (!p) return ""; if (p.mimeType === "text/plain" && p.body?.data) return dec(p.body.data); for (const x of p.parts ?? []) { const t = plain(x); if (t) return t; } return ""; }
function domainOf(u: string) { try { return new URL(u).hostname.toLowerCase().replace(/^(www|m|amp|edition|eu|uk|us)\./, ""); } catch { return ""; } }
const slugOf = (d: string) => d.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Item = { title: string; source: string; snippet: string; url: string };
function parseAlert(text: string): Item[] {
  const out: Item[] = []; const re = /<(https:\/\/www\.google\.com\/url\?[^>]+)>/g; let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const chunk = text.slice(last, m.index); last = m.index + m[0].length;
    const lines = chunk.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^===.*===$/.test(l));
    let real = ""; try { real = new URL(m[1]).searchParams.get("url") ?? ""; } catch { /* skip */ }
    if (!real || lines.length < 2) continue;
    // Title wraps at about 76 characters; the outlet's name is the line after it. Prefer the split where the title ends with " - <source>".
    let k = 1; let found = false;
    for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
      const t = lines.slice(0, i).join(" "); const s = lines[i];
      if (s.length <= 80 && (t.endsWith(" - " + s) || t.endsWith(" | " + s) || t.toLowerCase().endsWith(s.toLowerCase()))) { k = i; found = true; break; }
    }
    if (!found) { k = 1; while (k < lines.length - 1 && lines[k - 1].length >= 72) k++; }
    const source = lines[k] ?? ""; let title = lines.slice(0, k).join(" ");
    for (const sep of [" - ", " | "]) if (title.endsWith(sep + source)) title = title.slice(0, -(sep + source).length);
    title = title.replace(/(\s*\|\s*[^|]{0,24})?\s*\|\s*$/, "").trim();
    out.push({ title, source, snippet: lines.slice(k + 1).join(" ").slice(0, 600), url: real });
  }
  return out;
}

async function outletIds(rows: { domain: string; name: string }[]) {
  const uniq = new Map<string, string>(); for (const r of rows) if (r.domain && !uniq.has(r.domain)) uniq.set(r.domain, r.name || r.domain);
  if (!uniq.size) return new Map<string, string>();
  const ins = [...uniq].map(([domain, name]) => ({ domain, name, slug: slugOf(domain), website: "https://" + domain }));
  const { error } = await db.from("ve_media_outlets").upsert(ins, { onConflict: "domain", ignoreDuplicates: true }); if (error) throw error;
  const { data, error: e2 } = await db.from("ve_media_outlets").select("id,domain").in("domain", [...uniq.keys()]); if (e2) throw e2;
  return new Map((data ?? []).map((r) => [r.domain, r.id]));
}
async function insertCoverage(rows: any[]) {
  if (!rows.length) return 0;
  const { data, error } = await db.from("ve_media_coverage").upsert(rows, { onConflict: "url", ignoreDuplicates: true }).select("id"); if (error) throw error;
  return data?.length ?? 0;
}

async function alerts(days: number) {
  const t = await gmailToken(); const ids: string[] = []; let pt: string | undefined;
  do {
    const q = encodeURIComponent(`from:googlealerts-noreply@google.com subject:"Google Alert - Vegan" newer_than:${days}d`);
    const page = await g(t, `messages?q=${q}&maxResults=500${pt ? "&pageToken=" + pt : ""}`);
    for (const x of page.messages ?? []) ids.push(x.id); pt = page.nextPageToken;
  } while (pt);
  ids.reverse();
  const slice = ids.slice(0, 60); let items = 0, skipped = 0; const rows: any[] = [];
  for (let i = 0; i < slice.length; i += 10) {
    const msgs = await Promise.all(slice.slice(i, i + 10).map((id) => g(t, `messages/${id}?format=full`)));
    for (const msg of msgs) {
      const day = new Date(Number(msg.internalDate)).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      for (const it of parseAlert(plain(msg.payload))) {
        items++; const domain = domainOf(it.url); if (!domain || PLATFORMS.test(domain)) { skipped++; continue; }
        rows.push({ domain, it, day, mid: msg.id });
      }
    }
  }
  const map = await outletIds(rows.map((r) => ({ domain: r.domain, name: r.it.source })));
  const inserted = await insertCoverage(rows.map((r) => ({ outlet_id: map.get(r.domain), url: r.it.url, title: r.it.title.slice(0, 500), snippet: r.it.snippet, source_name: r.it.source, published_on: r.day, origin: "google_alert", gmail_message_id: r.mid })));
  return { alerts: slice.length, items, skipped_platforms: skipped, inserted };
}

async function desk(days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await db.from("ve_news_leads").select("id,source_name,title,url,summary,published_at,created_at").eq("brand_slug", "vegans-explore").gte("created_at", since).order("created_at").limit(1000); if (error) throw error;
  const rows = (data ?? []).map((r) => ({ r, domain: domainOf(r.url ?? "") })).filter((x) => x.domain && x.r.title && !PLATFORMS.test(x.domain));
  const map = await outletIds(rows.map((x) => ({ domain: x.domain, name: x.r.source_name ?? "" })));
  const inserted = await insertCoverage(rows.map(({ r, domain }) => ({ outlet_id: map.get(domain), url: r.url, title: String(r.title).slice(0, 500), snippet: (r.summary ?? "").replace(/<[^>]+>/g, " ").slice(0, 600), source_name: r.source_name, published_on: (r.published_at ?? r.created_at)?.slice(0, 10), origin: "news_desk", news_lead_id: r.id })));
  return { read: data?.length ?? 0, kept: rows.length, inserted };
}

async function claude(system: string, user: string) {
  const s = await secrets(["ANTHROPIC_API_KEY"]);
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": s.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 16000, system, messages: [{ role: "user", content: user }] }) });
  const j = await r.json();
  if (!r.ok) throw new Error("claude " + r.status + " " + JSON.stringify(j).slice(0, 300));
  if (j.stop_reason !== "end_turn") throw new Error("claude stop_reason " + j.stop_reason);
  const txt = (j.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  const a = txt.indexOf("["), b = txt.lastIndexOf("]"); return JSON.parse(txt.slice(a, b + 1));
}

const TOPICS = ["food_dining", "recipes", "health_nutrition", "business_products", "animal_welfare", "environment_climate", "policy_law", "culture_lifestyle", "sports_fitness", "celebrity", "travel", "events", "science_research", "other"];
const SCORE_SYS = `You score news coverage for a Vegan community organization's media list. For each item, judge how the piece treats Vegans, the Vegan community or Vegan living.
flattering: positive, celebratory or helpful toward Vegans or Vegan food, people, businesses or ideas.
neutral: factual reporting, balanced or mixed, or Vegan mentioned only in passing. News that is bad for a Vegan business (a closure, a product dropped) is neutral unless the piece itself speaks negatively of Vegans.
critical: mocks, disparages or stereotypes Vegans, warns people away from Vegan diets, or argues against the Vegan community.
Topic, one of: ${TOPICS.join(", ")}.
Reply with only a JSON array: [{"i":<index>,"stance":"flattering|neutral|critical","topic":"...","reason":"<max 15 words, only when critical, else empty>"}]`;

async function score(n: number) {
  const { data, error } = await db.from("ve_media_coverage").select("id,title,snippet,source_name").is("scored_at", null).order("created_at").limit(n); if (error) throw error;
  const rows = data ?? []; const batches: any[][] = []; for (let i = 0; i < rows.length; i += 40) batches.push(rows.slice(i, i + 40));
  let done = 0;
  await Promise.all(batches.map(async (b) => {
    const user = b.map((r, i) => `${i}. [${r.source_name ?? ""}] ${r.title} :: ${(r.snippet ?? "").slice(0, 300)}`).join("\n");
    const res: any[] = await claude(SCORE_SYS, user);
    const now = new Date().toISOString();
    await Promise.all(res.filter((x) => b[x.i] && ["flattering", "neutral", "critical"].includes(x.stance)).map(async (x) => {
      const { error } = await db.from("ve_media_coverage").update({ stance: x.stance, topic: TOPICS.includes(x.topic) ? x.topic : "other", stance_reason: x.stance === "critical" ? (x.reason || null) : null, scored_at: now }).eq("id", b[x.i].id);
      if (!error) done++;
    }));
  }));
  const { count } = await db.from("ve_media_coverage").select("id", { count: "exact", head: true }).is("scored_at", null);
  return { picked: rows.length, scored: done, remaining: count };
}

const KIND_SYS = `Classify media outlets for a PR media list. Each line is a website domain and the names its articles were credited to (some are wrong, cut from a headline). For each, give name (the outlet's proper public name, e.g. "The Washington Post", "Plant Based News"; from the domain if the credited names are wrong), kind (newspaper, magazine, tv_radio, digital_news, blog, trade, student, advocacy, wire, other), scope (national, local, international, vegan_niche) and region (city and state, or country, when local or international; else empty). vegan_niche means an outlet mainly about Vegan or plant-based living.
Reply with only a JSON array: [{"i":<index>,"name":"...","kind":"...","scope":"...","region":"..."}]`;
async function classify(n: number) {
  const { data, error } = await db.from("ve_media_outlets").select("id,name,domain").is("kind", null).order("created_at").limit(n); if (error) throw error;
  const rows = data ?? []; const batches: any[][] = []; for (let i = 0; i < rows.length; i += 80) batches.push(rows.slice(i, i + 80));
  const { data: cov } = await db.from("ve_media_coverage").select("outlet_id,source_name").in("outlet_id", rows.map((r) => r.id)).limit(20000);
  const seen = new Map<string, Map<string, number>>();
  for (const c of cov ?? []) { if (!c.source_name) continue; const m = seen.get(c.outlet_id) ?? new Map(); m.set(c.source_name, (m.get(c.source_name) ?? 0) + 1); seen.set(c.outlet_id, m); }
  const names = (id: string) => [...(seen.get(id) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, k]) => `${n} x${k}`).join("; ");
  let done = 0;
  await Promise.all(batches.map(async (b) => {
    const res: any[] = await claude(KIND_SYS, b.map((r, i) => `${i}. ${r.domain}: ${names(r.id) || r.name}`).join("\n"));
    await Promise.all(res.filter((x) => b[x.i]).map(async (x) => {
      const { error } = await db.from("ve_media_outlets").update({ ...(x.name ? { name: String(x.name).slice(0, 120) } : {}), kind: x.kind || "other", scope: x.scope || null, region: x.region || null }).eq("id", b[x.i].id);
      if (!error) done++;
    }));
  }));
  const { count } = await db.from("ve_media_outlets").select("id", { count: "exact", head: true }).is("kind", null);
  return { picked: rows.length, classified: done, remaining: count };
}


const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const s = await secrets(["CRON_SECRET", "LESARUSS_ADMIN_TOKEN"]);
  const cron = req.headers.get("x-cron-secret");
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const authed = (cron && s.CRON_SECRET && cron === s.CRON_SECRET) || (bearer && s.LESARUSS_ADMIN_TOKEN && bearer === s.LESARUSS_ADMIN_TOKEN);
  if (!authed) return json({ ok: false, error: "unauthorized" }, 401);
  const b = await req.json().catch(() => ({}));
  const days = Math.min(30, Math.max(1, Number(b.days) || 3));
  const out: Record<string, unknown> = { ok: true, days };
  try {
    if (!b.score_only) {
      out.alerts = await alerts(days);
      out.desk = await desk(days);
      out.classify = await classify(160);
    }
    // score in rounds of 240 until done or about 100 seconds have passed
    const t0 = Date.now(); const rounds: unknown[] = [];
    while (Date.now() - t0 < 100000) { const r = await score(240); rounds.push(r); if (!r.picked || !r.remaining) break; }
    out.score = rounds;
    const { data, error } = await db.rpc("ve_media_outlets_rollup"); if (error) throw error;
    out.rolled_up = data;
    return json(out);
  } catch (e) {
    console.error("ve-media-alerts", e);
    return json({ ...out, ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
});
