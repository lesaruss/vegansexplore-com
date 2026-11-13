// The weekly email's words and layout, on the brand kit's locked email template (/mocks/brand-kit/templates, slide 6, canon
// canon-ve-brand-kit-templates): a 6 px stripe across the very top, the landscape logo at 150 px on white, one headline with one marker
// phrase, a short paragraph, one orange button with a tracked /go/ link, and the footer with why they get it, {{unsubscribe_url}} and
// {{postal_address}}. Tables and inline styles, as email-send's shell. No imports, so it renders the same in the function and in a script.

export type Digest = {
  name?: string | null; email?: string; week_of?: string;
  listings: { id?: string; slug: string; name: string; kind: string }[];
  opps: { title: string; opp_kind: string; ends_at: string | null }[];
  features: { key: string; kind: string; title: string; where_label: string | null; ready: boolean; listing?: string }[];
  visitors: number; prev_visitors: number;
};
export type Links = { home: string; opps: string; media: string };

const SITE = 'https://vegansexplore.com';
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v: number) => Number(v || 0).toLocaleString('en-US');
const closes = (t: string | null) => {
  if (!t) return '';
  const d = new Date(Date.parse(t) - 60000);   // a close at midnight Eastern is the day before's last minute
  return ' (closes ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) + ')';
};
const words = (a: string[]) => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';

// The business's name: its own when it has one page; a chain (most of its pages share one name) goes by that name; else the first and
// the count ("SoFlo Vegans Podcast and 3 more").
export function bizName(d: Digest) {
  const count: Record<string, number> = {};
  d.listings.forEach((l) => { count[l.name] = (count[l.name] || 0) + 1; });
  const names = Object.keys(count).sort((a, b) => count[b] - count[a]);
  if (names.length === 1 || count[names[0]] * 2 > d.listings.length) return names[0];
  return names[0] + ' and ' + (d.listings.length - 1) + ' more';
}
const isChain = (d: Digest) => d.listings.length > 1 && !/ and \d+ more$/.test(bizName(d));

export function render(d: Digest, links: Links) {
  const name = bizName(d), many = d.listings.length > 1;
  const page = !many ? 'your page' : isChain(d) ? `your ${d.listings.length} locations` : 'your pages';
  const diff = d.visitors - d.prev_visitors;
  const numbers = d.visitors > 0
    ? `${n(d.visitors)} ${d.visitors === 1 ? 'person' : 'people'} saw ${page} last week` + (d.prev_visitors ? (diff > 0 ? `, ${n(diff)} more than the week before.` : diff < 0 ? `, ${n(-diff)} fewer than the week before.` : ', the same as the week before.') : '.')
    : `${many ? 'Your pages are' : 'Your page is'} ready for visitors. The more you add, the more people find you.`;

  const blocks: string[] = [];
  if (d.opps.length) {
    // In a sentence, a title after the first starts lowercase when it begins with a plain word ("and an ad spot", "your story", "our Q1").
    const lower = (t: string, i: number) => i > 0 ? t.replace(/^(A|An|Our|Your)\b/, (w) => w.toLowerCase()) : t;
    const top = d.opps.slice(0, 3).map((o, i) => `${esc(lower(o.title, i))}${esc(closes(o.ends_at))}`), more = d.opps.length - 3;
    blocks.push(block(`${d.opps.length} new ${d.opps.length === 1 ? 'way' : 'ways'} in`, words(top) + (more > 0 ? `, and ${more} more` : '') + '.', links.opps, 'See them'));
  }
  // A chain's Find us posts are one line, not one per location.
  const findUs = d.features.filter((f) => f.kind === 'find_us'), feats = d.features.filter((f) => f.kind !== 'find_us');
  const items = feats.length + (findUs.length ? 1 : 0);
  if (items) {
    const lines = feats.slice(0, 3).map((f) => {
      const label = String(f.where_label || 'Vegans Explore').replace(/^The /, ''), the = /^Vegans Explore$/.test(label) ? '' : 'the ';
      const where = f.kind === 'find_us' ? 'Your Find us on Vegans Explore post is made.'
        : `You're ${f.kind === 'podcast' ? 'on' : 'in'} ${the}${esc(label)}${f.title ? ': ' + esc(f.title) : ''}.`;
      return where + (f.ready ? ' Your post is ready to share.' : '');
    });
    if (findUs.length) lines.push(findUs.length === 1 ? 'Your Find us on Vegans Explore post is ready to share.' : `Your Find us on Vegans Explore posts are ready to share, one for each of your ${findUs.length} locations.`);
    blocks.push(block(items === 1 ? 'Your feature' : `${items} new in your Media kit`, lines.join(' '), links.media, 'Share it'));
  }

  const parts: string[] = [];
  if (items) parts.push(feats.length ? (feats.length === 1 ? 'a new feature' : `${feats.length} new features`) : findUs.length > 1 ? 'your posts are ready' : 'your post is ready');
  if (d.opps.length) parts.push(`${d.opps.length} new ${d.opps.length === 1 ? 'way' : 'ways'} in`);
  const subject = `Your week on Vegans Explore: ${words(parts)}`;

  const html = shell(
    `<p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#2D5C27">Your week on Vegans Explore</p>` +
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;font-weight:900;letter-spacing:-.02em;color:#1a1a1a">${mark(esc(name))}</h1>` +
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444">${esc(numbers)}</p>` +
    blocks.join('') +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px"><tr><td style="background:#F69820;border-radius:6px">` +
    `<a href="${links.home}" style="display:inline-block;padding:14px 26px;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#1a1a1a;text-decoration:none">Open your dashboard</a></td></tr></table>`,
    `You get this because ${esc(name)} ${/ and \d+ more$/.test(name) ? 'are' : 'is'} claimed on Vegans Explore. It comes only when there is something new.`);
  return { subject, html };
}

// The marker: a band from 56% to 92% of the line in bright green (Foundations); clients that drop gradients show the plain word.
const mark = (s: string) => `<span style="background-image:linear-gradient(transparent 56%,#22C55E 56%,#22C55E 92%,transparent 92%);padding:0 2px">${s}</span>`;

function block(head: string, body: string, href: string, link: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;border:2px solid #1a1a1a;border-radius:12px"><tr><td style="padding:14px 16px">` +
    `<p style="margin:0 0 4px;font-size:15px;font-weight:900;color:#1a1a1a">${esc(head)}</p>` +
    `<p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#444">${body}</p>` +
    `<a href="${href}" style="font-size:13px;font-weight:800;color:#2D5C27;text-decoration:underline">${esc(link)}</a></td></tr></table>`;
}

const STRIPE = [['#2D5C27', 2], ['#F69820', 1], ['#FF9EC4', 1], ['#FFEBD1', 1], ['#22C55E', 1], ['#E8F5E9', 1], ['#3A9B3E', 1]] as const;
function shell(body: string, foot: string) {
  const stripe = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    STRIPE.map(([c, w]) => `<td width="${Math.round((w as number) / 8 * 100)}%" style="background:${c};height:6px;line-height:6px;font-size:0">&nbsp;</td>`).join('') + `</tr></table>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4"><tr><td align="center" style="padding:20px 10px">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Montserrat,Arial,sans-serif;color:#1a1a1a">` +
    `<tr><td>${stripe}</td></tr>` +
    `<tr><td style="padding:26px 32px 6px"><img src="${SITE}/public/logo-ve-landscape-v2.png" alt="Vegans Explore" width="150" style="display:block;border:0;width:150px;height:auto"></td></tr>` +
    `<tr><td style="padding:16px 32px 28px">${body}</td></tr>` +
    `<tr><td style="border-top:1px solid #eeeeee;padding:16px 32px 22px;font-size:12px;line-height:1.5;color:#888888">${foot} <a href="{{unsubscribe_url}}" style="color:#888888">Stop these emails</a>. {{postal_address}}.</td></tr>` +
    `</table></td></tr></table>`;
}

// The sample the approval is taken on (Green Leaf Kitchen, the sample business): a feature and two ways in, the mock's slide 7.
export const SAMPLE: Digest = {
  name: 'Alex Rivera', week_of: '2026-11-16',
  listings: [{ slug: 'green-leaf-kitchen', name: 'Green Leaf Kitchen', kind: 'food' }],
  opps: [{ title: 'Send your Hanukkah, Christmas and Kwanzaa menus', opp_kind: 'holiday', ends_at: '2026-12-15T05:00:00Z' },
    { title: 'The Plant-Based Showcase', opp_kind: 'contribute', ends_at: '2026-11-30T05:00:00Z' }],
  features: [{ key: 'holiday:sample', kind: 'holiday', title: 'Vegan Restaurant Gift Card', where_label: 'The Holiday Guide', ready: true, listing: 'Green Leaf Kitchen' }],
  visitors: 146, prev_visitors: 108,
};
export const SAMPLE_LINKS: Links = { home: `${SITE}/go/bw-sample`, opps: `${SITE}/go/bw-sample`, media: `${SITE}/go/bw-sample` };
