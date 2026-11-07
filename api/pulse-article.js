// Vercel Serverless Function: /api/pulse-article
// Serves a real, crawlable, per-article Pulse page at /pulse/[slug] (rewritten in vercel.json).
// Exists so link-preview crawlers (Facebook, LinkedIn, iMessage, Slack) see a real
// title/image/description in the raw page source, since pulse.html builds its content
// with client-side JavaScript that those crawlers never execute.
//
// Preview (Sean, 2026-09-29): /pulse/<slug>?preview=<token> shows a piece, draft or not, with
// this same page, for the Depot's Preview button (hq.lesaruss.ai/depot and the brand Depots).
// The token comes from public.ve_pulse_previews and lives an hour; ve_pulse_preview() returns
// the piece only for a live token. A preview is marked, never indexed and never cached.
//
// Categories and ad rail here must mirror pulse.html exactly (same consolidated
// Community/Recipes taxonomy, same ad_placements/ad_campaigns rail via ad-resolve).

const SEO = require('../public/ve-seo-text.js');
const SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

// Mirrors the hardcoded `posts` array in pulse.html (post July-18 category consolidation:
// Platform/Beta/Guides/Regions/Events/Points/Story all folded into Community, Recipes kept
// separate). These 9 are frozen pre-launch posts (June 2026) and do not change, so a
// one-time copy here is safe. All other Pulse articles are live rows in ve_pulse_content,
// fetched below.
const STATIC_POSTS = [
  {
    slug: 'directory', category: 'Community',
    headline: "The Directory Is Growing: 2,800+ Businesses and Counting",
    excerpt: "We're actively cataloging Vegan businesses across all 9 launch regions. Here's what we're finding city by city.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_191306_d3274cac-433f-4b7f-bb98-ba598006f59a.png',
    body: '<div class="article-eyebrow">Platform</div><h1 class="article-h1">2,800+ Businesses. 9 Regions. And We\'re Just Getting Started.</h1><p class="article-lede">Before anyone could join, before the platform had a name anyone knew, the work had already been happening. Cataloging Vegan businesses city by city, block by block. Right now the directory sits at over 2,800 verified listings across 63 cities, and we\'re adding more every week leading up to July 13.</p><div class="article-section-head">What\'s in the Directory Right Now</div><p class="article-p">Restaurants, cafes, markets, health food stores, Vegan beauty brands, wellness spaces, community gardens, pop-up vendors, if it\'s Vegan and it\'s operating in one of our nine launch regions, our team has been working to find it, verify it, and document it. Every listing includes location, category, and enough detail to actually be useful.</p><p class="article-p">We\'ve been deliberate about quality over volume. Every listing in the directory has been manually reviewed. We\'re not scraping Yelp. We\'re building something you can actually trust.</p><div class="article-section-head">How We\'re Building It</div><p class="article-p">The cataloging work started long before the platform existed. In city after city, the approach has been the same: on the ground research, community sourcing, and verification. The Vegan Explorer program, which opens to Founding Members on July 13, is the next phase of that work. You become the eyes and ears. Your city, your knowledge, your contribution to a directory that belongs to everyone.</p><div class="article-section-head">What Goes Live July 13</div><p class="article-p">On launch day, the full directory opens across all nine regions. Search by city, neighborhood, category, or dietary need. Filter for delivery, outdoor seating, Black-owned, women-owned, and more. Every listing links to a business profile page that can be claimed, updated, and expanded by the business owner. Founding Members will be among the first to explore it, and the first to contribute to it.</p>'
  },
  {
    slug: 'beta', category: 'Community',
    headline: "Beta Access Is Live for Founding Members",
    excerpt: "You're inside. Here's what you can explore right now and what features are still being built before July 13.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_191822_aa0d2b7e-89f1-4893-b958-e3d251e67aef.png',
    body: '<div class="article-eyebrow orange">Beta Access</div><h1 class="article-h1">You\'re Inside. Here\'s What That Means Right Now.</h1><p class="article-lede">Beta access is live for Founding Members. This isn\'t a waitlist confirmation or a holding page, you\'re in. The platform isn\'t complete, and that\'s intentional. Here\'s what\'s available to explore right now, and what\'s still being built before July 13.</p><div class="article-section-head">What\'s Live Right Now</div><ul class="article-list"><li><div class="article-dot"></div><div><strong>This hub.</strong> The Founding Member welcome page is your pre-launch home. The Pulse updates here daily as things develop.</div></li><li><div class="article-dot"></div><div><strong>The directory preview.</strong> A growing view of what\'s been cataloged across our launch regions.</div></li><li><div class="article-dot"></div><div><strong>Opportunity registration.</strong> Community Manager and Vegan Explorer interest forms are live. If a role opens in your city, you\'ll be contacted first.</div></li></ul><div class="article-section-head">What\'s Coming Before July 13</div><ul class="article-list"><li><div class="article-dot orange"></div><div><strong>Login access.</strong> A link will be emailed to you when full platform login opens. One click, no password needed.</div></li><li><div class="article-dot orange"></div><div><strong>Full directory search.</strong> Filter by city, category, neighborhood, and more across all nine regions.</div></li><li><div class="article-dot orange"></div><div><strong>Guide track enrollment.</strong> Your 111-day path opens on July 13. You\'ll choose your starting point at first login.</div></li><li><div class="article-dot orange"></div><div><strong>Community events.</strong> RSVP opens for Founding Members before public tickets drop.</div></li></ul><p class="article-p">Beta isn\'t a lesser version, it\'s the version where Founding Members shape what ships. If something doesn\'t feel right, that\'s the point of this window.</p>'
  },
  {
    slug: 'guide-tracks', category: 'Community',
    headline: "Your 111-Day Guide Track: What to Expect When It Goes Live",
    excerpt: "The guide tracks unlock July 13. Here's a look at what the first 7 days look like for both paths.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_192200_2efeca9b-c2a5-4cd0-a507-70ed60fac6e4.png',
    body: '<div class="article-eyebrow">Guide Tracks</div><h1 class="article-h1">111 Days. Your Path. Two Starting Points.</h1><p class="article-lede">The guide tracks are VEGANS EXPLORE\'s answer to the question every person gets stuck on at the start: where do I even begin? The 111-day format is based on research around how long meaningful habit change actually takes. Here\'s how the system works and what it looks like from day one.</p><div class="article-section-head">Two Entry Points</div><p class="article-p">You choose your starting point at first login. The two core paths on launch day are the Pre-Vegan track and the Seasoned Vegan track. Pre-Vegan is for people who are curious, transitioning, or just starting to take plant-based eating seriously. Seasoned Vegan is for people who are already there and want to go deeper, community, advocacy, contribution, and leadership.</p><div class="article-section-head">What the First Seven Days Look Like</div><ul class="article-list"><li><div class="article-dot"></div><div><strong>Day 1.</strong> Profile setup and your first city check-in. What\'s Vegan in your neighborhood right now.</div></li><li><div class="article-dot"></div><div><strong>Days 2-3.</strong> Your guide introduces the five pillars: Discover, Learn, Connect, Participate, Reward.</div></li><li><div class="article-dot"></div><div><strong>Days 4-5.</strong> First directory contribution. You find and submit a Vegan spot in your city.</div></li><li><div class="article-dot"></div><div><strong>Days 6-7.</strong> First community touchpoint. You connect with other members in your region and earn your first points.</div></li></ul><div class="article-section-head">After Day 111</div><p class="article-p">Completing a guide track unlocks the next level of the platform, expanded contribution tools, featured profile placement, and eligibility for Community Manager consideration in your city.</p>'
  },
  {
    slug: 'regions', category: 'Community',
    headline: "Meet the Nine Launch Regions Going Live on July 13",
    excerpt: "South Florida. London. New York. Atlanta. Here's the full map of day-one cities and what's already built in each.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_192515_7ecf6fcb-69cb-475e-bc73-545e9f1ba48a.png',
    body: '<div class="article-eyebrow">Launch Regions</div><h1 class="article-h1">Nine Regions. One Launch Day. July 13.</h1><p class="article-lede">South Florida. London. New York. Atlanta. Central Florida. Philadelphia. Los Angeles. North Carolina. DMV. These are the nine regions going live on July 13, 2026. Each one has been in active development, directory cataloging, community building, and infrastructure, for months before a single public member has access.</p><div class="article-section-head">Why These Nine</div><p class="article-p">These regions were selected based on three criteria: the size of the existing Vegan community, the density of Vegan-friendly businesses already operating, and the presence of people ready to build local infrastructure from day one.</p><div class="article-section-head">What Expansion Looks Like</div><p class="article-p">Nine regions is the beginning, not the ceiling. New regions open when a Community Manager candidate emerges and the local directory reaches a minimum threshold. If your city isn\'t on this list, the path to getting it there is through the Vegan Explorer program.</p>'
  },
  {
    slug: 'founder-badge', category: 'Community',
    headline: "What the Founder Badge Means on Your Profile",
    excerpt: "It's permanent. It's visible. And it will never be available again after July 13. Here's how it shows up.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_192718_7f641c42-c387-41fe-a93d-0d4118beacff.png',
    body: '<div class="article-eyebrow">Community</div><h1 class="article-h1">Permanent. Visible. Gone After July 13.</h1><p class="article-lede">The Founder Badge is not a loyalty point. It\'s not a tier that resets annually. It\'s a permanent credential attached to your profile from the moment you joined, and it will never be available again after July 13, 2026.</p><div class="article-section-head">What the Badge Does</div><ul class="article-list"><li><div class="article-dot"></div><div><strong>It\'s on your profile permanently.</strong> Every member who joins after July 13 will see it and know you were here first.</div></li><li><div class="article-dot"></div><div><strong>It routes you to the front of every line.</strong> Community Manager openings, Vegan Explorer featured slots, early event access, Founding Members are always contacted first.</div></li><li><div class="article-dot"></div><div><strong>It marks your contributions differently.</strong> Content, reviews, and listings submitted by Founding Members carry the badge in the directory and community feeds.</div></li><li><div class="article-dot"></div><div><strong>It\'s social proof inside the community.</strong> As the platform grows, the Founder Badge becomes rarer and more meaningful.</div></li></ul><div class="article-section-head">What Closes on July 13</div><p class="article-p">At midnight on July 13, the Founding Member program closes permanently. The $11 price goes away. The badge goes away. The early access window goes away. There is no version of this that comes back around later.</p>'
  },
  {
    slug: 'events', category: 'Community',
    headline: "First Community Events Drop on Launch Day",
    excerpt: "Founding Members get first access to RSVP for launch week events in their city before public tickets open.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_193036_59710f70-d432-4954-a0b1-7314ffcabe2f.png',
    body: '<div class="article-eyebrow orange">Events</div><h1 class="article-h1">First Community Events Drop on Launch Day.</h1><p class="article-lede">Launch week isn\'t just a website going live. It\'s a real-world activation across nine regions. The first VEGANS EXPLORE community events are being planned city by city right now, and Founding Members get first access to RSVP before a single public ticket is released.</p><div class="article-section-head">What Launch Week Looks Like</div><p class="article-p">Every region is planning at least one launch week activation. Restaurant takeovers, outdoor markets, community meetups, the format varies by city. Founding Members receive RSVP access before public tickets open. In most cases that means exclusive access to events that will sell out before they hit general availability.</p><div class="article-section-head">The Event Infrastructure</div><p class="article-p">Events run through the platform, and every ticket sold goes back into building the community that hosted it.</p><div class="article-section-head">After Launch Week</div><p class="article-p">The calendar stays live and grows as Community Managers in each region establish their local event cadence. If you want to host an event through the platform, the Community Manager in your city is your first contact.</p>'
  },
  {
    slug: 'recipes', category: 'Recipes',
    headline: "The Recipe Ecosystem Is Opening to Creators on Launch Day",
    excerpt: "Community creators can start submitting recipes. Confidence scoring, recognition, and the Cooking Show pipeline explained.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_193919_cbe48df1-25d8-4d2c-92d0-e2d277cfe5b6.png',
    body: '<div class="article-eyebrow">Recipe Ecosystem</div><h1 class="article-h1">The Recipe Ecosystem Is Bigger Than a Recipe Page.</h1><p class="article-lede">VEGANS EXPLORE was never going to be a recipe site. But it was always going to take recipes seriously. What\'s been built is an ecosystem, from submission to scoring to recognition to a Cooking Show pipeline.</p><div class="article-section-head">How Submission Works</div><p class="article-p">Any member can submit a recipe. Once submitted, it enters the Confidence Score pipeline, a composite rating built on community rating (40%), nutritional verification via USDA FoodData Central (40%), and editorial review (20%). A recipe earns its placement.</p><div class="article-section-head">Recognition</div><p class="article-p">Recipes that perform get featured. Creators who build a following around their recipes earn points and placement, and the best move into the Cooking Show pipeline.</p><div class="article-section-head">The Cooking Show Pipeline</div><p class="article-p">The Cooking Show is a Phase 2 program that unlocks at 1,000 members or 10 verified creators. Creators who have built an audience and a body of high-confidence recipes become candidates. Community-first, not celebrity-first.</p>'
  },
  {
    slug: 'points', category: 'Community',
    headline: "Earn Points for Every Action. Redeem Against Your Membership.",
    excerpt: "The cross-community points system goes live July 13. Service-earned only. Here's what you can do with them.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_212740_7395ee05-3c4b-46fe-a999-b4e4afca8d8a.png',
    body: '<div class="article-eyebrow">Points System</div><h1 class="article-h1">Earn Points for Every Action. Redeem Against Your Membership.</h1><p class="article-lede">The VEGANS EXPLORE points system is service-earned only. You cannot buy them, trade for them, or receive them for signing up and doing nothing. You earn them by contributing to the community.</p><div class="article-section-head">How You Earn</div><ul class="article-list"><li><div class="article-dot"></div><div><strong>Directory contributions.</strong> Submit, verify, or update a business listing and earn points for each verified addition.</div></li><li><div class="article-dot"></div><div><strong>Recipe submissions.</strong> Submit a recipe that passes the Confidence Score threshold and earn points based on its rating.</div></li><li><div class="article-dot"></div><div><strong>Community engagement.</strong> Event attendance, guide track milestones, and referred members all generate points.</div></li><li><div class="article-dot"></div><div><strong>Volunteer hours.</strong> Community Managers and Vegan Explorers earn points for documented platform-building activity.</div></li></ul><div class="article-section-head">How You Redeem</div><p class="article-p">Points redeem directly against your membership cost, up to 50% of the total through donated points to local businesses and community organizations. There\'s also a store of zero-cost digital goods that only points can unlock.</p><div class="article-section-head">The Leaderboard</div><p class="article-p">Every region has a live leaderboard. The top contributors in each city are featured on that city\'s directory page and community hub. Your points total is public. Your ranking is public. The community sees who\'s showing up.</p>'
  },
  {
    slug: 'origin', category: 'Community',
    headline: "63 Cities. 2,800+ Listings. Before the Platform Even Existed.",
    excerpt: "How the team behind VEGANS EXPLORE spent years mapping the Vegan world before building the infrastructure it deserved.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_213329_20a43b05-2d41-49c6-bb23-c44955c61b25.png',
    body: '<div class="article-eyebrow">The Story</div><h1 class="article-h1">63 Cities. 2,800+ Listings. Before the Platform Even Existed.</h1><p class="article-lede">Most platforms launch and then go find their content. VEGANS EXPLORE was built the other way around. The work started years before a single line of platform code was written, people on the ground in cities around the world, cataloging the Vegan world one listing at a time.</p><div class="article-section-head">How the Work Started</div><p class="article-p">It began as a personal project. The Vegan community had restaurants, markets, events, and spaces worth knowing about, and no single place to find them that wasn\'t outdated, incomplete, or buried inside a platform that treated Vegan content as a niche. The response was to start building the list. City by city. Category by category.</p><div class="article-section-head">63 Cities Later</div><p class="article-p">By the time the platform was ready to launch, 63 cities had been cataloged and over 2,800 businesses verified. The work happened across South Florida, New York, London, Atlanta, LA, and everywhere in between. Not scraped, researched, visited, verified, and documented by people who actually knew the communities they were mapping.</p><div class="article-section-head">Why It Matters That You\'re Here</div><p class="article-p">The Vegan Explorer program, which opens to Founding Members on July 13, is how the catalog grows beyond what any single team could build. You take what was started and extend it into every block of every city that isn\'t on the list yet. The 63 cities are the proof of concept. What happens next is the real work.</p>'
  }
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').trim();

  if (!slug) {
    res.writeHead(302, { Location: '/pulse' });
    return res.end();
  }

  const previewToken = String((req.query && req.query.preview) || '');
  // A search result can open an episode at the moment it is about: /pulse/<slug>?t=<seconds>.
  const startAt = Math.max(0, Math.min(parseInt((req.query && req.query.t) || '', 10) || 0, 86400));
  const preview = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(previewToken);
  let previewStatus = '';

  let post = preview ? null : STATIC_POSTS.find(function (p) { return p.slug === slug; });

  if (!post) {
    try {
      const headers = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
      const r = preview
        ? await fetch(SUPABASE_URL + '/rest/v1/rpc/ve_pulse_preview', { method: 'POST', headers: headers, body: JSON.stringify({ p_token: previewToken }) })
        : await fetch(SUPABASE_URL + '/rest/v1/ve_pulse_content?select=id,slug,title,category,podcast_show,episode_number,youtube_id,video_url,audio_url,author,origin,published_at,summary,body,thumbnail_url,cover_credit,cover_license,updated_note,updated_note_at&slug=eq.' + encodeURIComponent(slug) + '&status=eq.published&limit=1', { headers: headers });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0] && (!preview || rows[0].slug === slug)) {
        const row = rows[0];
        if (preview) previewStatus = row.status || 'draft';
        post = {
          id: row.id,
          slug: row.slug,
          category: row.category,
          show: row.podcast_show || '',
          epNum: row.episode_number || null,
          publishedAt: row.published_at || null,
          headline: row.title,
          excerpt: row.summary || '',
          img: row.thumbnail_url,
          youtubeId: row.youtube_id,
          videoUrl: row.video_url,
          audioUrl: row.audio_url,
          author: row.author,
          fromDepot: row.origin === 'depot',
          date: row.published_at || preview ? new Date(row.published_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '',
          body: row.body || '',
          coverCredit: row.cover_credit || '',
          coverLicense: row.cover_license || '',
          updatedNote: row.updated_note || '',
          updatedAt: row.updated_note_at || null
        };
      }
    } catch (e) {
      // fall through to 404 below
    }
  }

  if (!post) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Article not found - VEGANS EXPLORE Pulse</title>' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
      '<body style="font-family:Montserrat,sans-serif;padding:80px 24px;text-align:center;color:#1a1a1a;">' +
      '<h1 style="font-size:20px;">This article could not be found.</h1>' +
      '<p><a href="/pulse" style="color:#2d7d31;">Back to the Pulse</a></p></body></html>'
    );
  }

  const pageUrl = 'https://vegansexplore.com/pulse/' + post.slug;

  // A podcast episode (Sean, 2026-11-01: "The banner on this page is broken... we have a lot of articles setup this way... we
  // need to fix the formatting and how people find them"). 278 of the 279 Pulse articles are an episode's show notes. Around
  // the notes: the episode itself (YouTube, or the show's own audio from its feed through ve_pulse_episode, so the 55 with no
  // video play too), the show's page, the people on it (ve_person_credits, their People profiles) and the show's other
  // episodes, so no episode page is a dead end.
  let epData = null, people = [], siblings = [];
  if (post.show && post.id) {
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    const get = function (p) { return p.then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
    const got = await Promise.all([
      get(fetch(SUPABASE_URL + '/rest/v1/rpc/ve_pulse_episode', { method: 'POST', headers: h, body: JSON.stringify({ p_slug: post.slug }) })),
      get(fetch(SUPABASE_URL + '/rest/v1/ve_person_credits?select=role,listings(slug,name,category,logo_url,status)&content_id=eq.' + encodeURIComponent(post.id), { headers: h })),
      get(fetch(SUPABASE_URL + '/rest/v1/ve_content_mentions?select=listings(slug,name,category,logo_url,status)&status=eq.shown&content_id=eq.' + encodeURIComponent(post.id) + '&limit=100', { headers: h })),
      get(fetch(SUPABASE_URL + '/rest/v1/ve_pulse_content?select=slug,title,episode_number,published_at,thumbnail_url&status=eq.published&podcast_show=eq.' + encodeURIComponent(post.show) + '&order=published_at.asc&limit=500', { headers: h }))
    ]);
    epData = got[0] && got[0].show ? got[0] : null;
    const seen = {};
    people = (Array.isArray(got[1]) ? got[1] : []).filter(function (c) {
      const l = c.listings; if (!l || l.status !== 'approved' || seen[l.slug]) return false; seen[l.slug] = 1; return true;
    }).sort(function (a, b) { return (a.role === 'Host') - (b.role === 'Host'); });
    // Discussed (Sean, 2026-11-03: "if you can fill it in, put it in"): People profiles the episode's own text names, from the same
    // matches In this story uses (ve_content_mentions; a wrong one comes off in Depot > In this story). Credits come first.
    const PEOPLE_CATS = ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders', 'Promoters'];
    (Array.isArray(got[2]) ? got[2] : []).forEach(function (m) {
      const l = m.listings; if (!l || l.status !== 'approved' || seen[l.slug] || PEOPLE_CATS.indexOf(l.category) < 0) return;
      seen[l.slug] = 1; people.push({ role: 'Discussed', listings: l });
    });
    siblings = Array.isArray(got[3]) ? got[3] : [];
  }
  const showSlug = epData ? epData.show.slug : '';
  const feedEp = epData && epData.episode && epData.episode.audio ? epData.episode : null;
  const shortTitle = function (t) { return String(t || '').replace(/\s*\|\s*(Ep|Episode)\b[^|]*\|[^|]*$/i, '').replace(/\s*\|\s*[^|]*Podcast\s*$/i, '').trim(); };
  // Pictures from other hosts at full size (Apple's are 3000 px) go through Vercel's resizer (images in vercel.json), the
  // original as the fallback (the rule of 2026-10-31, as in public/ve-episodes.js).
  const pic = function (url, w, attrs) {
    if (!url) return '';
    const src = /^https:\/\//.test(url) ? '/_vercel/image?url=' + encodeURIComponent(url) + '&w=' + w + '&q=75' : url;
    return '<img src="' + esc(src) + '" data-src="' + esc(url) + '" alt="" loading="lazy" decoding="async" onerror="if(this.src!==this.dataset.src){this.src=this.dataset.src}else{this.onerror=null}"' + (attrs || '') + '>';
  };
  const fmtDate = function (d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : ''; };
  // Depot pieces (Sean, 2026-09-29): the Background writer ends every piece with
  // "First reported by <Source>: <url>". That line becomes the source's name as a link, in a
  // smaller line under the article, and any other bare link in the text becomes clickable.
  let sourceHtml = '';
  if (post.fromDepot) {
    const credit = /<p>\s*((?:First|Originally) reported by|Source:?)\s+([^<]+?)\s*:\s*(https?:\/\/[^\s<"]+?)[.,]?\s*<\/p>\s*$/i;
    const m = post.body.match(credit);
    if (m) {
      post.body = post.body.slice(0, m.index);
      sourceHtml = '<p class="article-source">' + m[1] + ' <a href="' + m[3] + '" target="_blank" rel="noopener">' + m[2] + '</a></p>';
    }
    post.body = post.body.replace(/(^|[\s(>])(https?:\/\/[^\s<"']+?)([.,;:!?)]*)(?=[\s<]|$)/g, function (_, pre, url, tail) {
      let label = url;
      try { label = new URL(url.replace(/&amp;/g, '&')).hostname.replace(/^www\./, ''); } catch (e) {}
      return pre + '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>' + tail;
    });
  }

  const title = post.headline;
  // Google cuts descriptions at about 155 characters and titles at about 65 (Signal, 2026-11-07; public/ve-seo-text.js).
  let description = SEO.clip(post.excerpt || '', SEO.DESC_MAX);
  if (description.length < SEO.DESC_MIN) description = SEO.clip((description ? description.replace(/[.\s]+$/, '') + '. ' : '') + 'From the Daily Pulse on Vegans Explore.', SEO.DESC_MAX);
  const pageTitle = SEO.title(title);
  const image = post.img || (epData && epData.show.logo) || 'https://vegansexplore.com/public/pulse-ve-banner.jpg';
  const caption = 'Read this on VEGANS EXPLORE Pulse: ' + title;

  // Above the article: a YouTube player, our own video or audio from the Depot, or the
  // cover picture for an article or interview. Mirrors pulseMediaHtml() in /pulse.html.
  const box = '<div style="position:relative;width:100%;aspect-ratio:16/9;margin-bottom:28px;border-radius:8px;overflow:hidden;background:#000;">';
  let embedHtml = '';
  // Episode row for every episode we can match to its feed (Sean, 2026-11-03); a moment link (?t=) keeps the YouTube player,
  // since its second is timed on the video.
  const useRow = !!feedEp && !(post.youtubeId && startAt);
  if (post.youtubeId && !useRow) embedHtml = box + '<iframe src="https://www.youtube.com/embed/' + esc(post.youtubeId) + (startAt ? '?start=' + startAt + '&autoplay=1' : '') + '" title="' + esc(title) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
  else if (post.videoUrl) embedHtml = box + '<video controls playsinline preload="metadata" poster="' + esc(post.img || '') + '" src="' + esc(post.videoUrl) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;" aria-label="' + esc(title) + '"></video></div>';
  else if (post.img && post.fromDepot) {
    // The cover's credit (Sean, 2026-09-29): who the photo is from, or that it is an illustration.
    const credit = post.coverLicense === 'illustration' ? 'Illustration'
      : post.coverCredit ? (/^(photo|courtesy|illustration)\b/i.test(post.coverCredit) || / logo$/i.test(post.coverCredit) ? post.coverCredit : 'Photo: ' + post.coverCredit) : '';
    embedHtml = '<img src="' + esc(post.img) + '" alt="" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;margin-bottom:' + (credit ? '6px' : post.audioUrl ? '14px' : '28px') + ';">'
      + (credit ? '<p class="cover-credit" style="margin-bottom:' + (post.audioUrl ? '14px' : '24px') + ';">' + esc(credit) + '</p>' : '');
  }
  if (post.audioUrl) embedHtml += '<audio controls preload="metadata" src="' + esc(post.audioUrl) + '" style="display:block;width:100%;margin-bottom:28px;" aria-label="Listen: ' + esc(title) + '"></audio>';
  if (post.fromDepot) embedHtml += '<h1 style="font-size:clamp(24px,3.4vw,34px);font-weight:900;line-height:1.15;margin:0 0 8px;">' + esc(title) + '</h1>'
    + '<p style="font-size:13px;font-weight:700;color:rgba(26,26,26,0.72);margin:0 0 ' + (post.updatedNote ? '8px' : '22px') + ';">' + (post.author ? 'By ' + esc(post.author) + ' &middot; ' : '') + esc(post.date || '') + '</p>'
    // Updated (Sean, 2026-09-29): what changed after the subject replied, the way newsrooms mark it.
    + (post.updatedNote ? '<p class="article-updated">Updated' + (post.updatedAt ? ' ' + esc(new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })) : '') + ': ' + esc(post.updatedNote) + '</p>' : '');

  // In this story (Sean, 2026-11-02): ONE section, after the write-up and its source and just before Share this article, on every article.
  // Its cards are filled by the loader at the foot of the page. Never on a Depot preview.
  const inStoryBlock = preview ? '' : '<section class="in-story" id="in-story" hidden><div class="share-label">In this story</div>'
    + '<p class="in-story-sub">The people, places and media this story names, from our Directory. Vote for them, or open their page.</p>'
    + '<div class="in-story-pills" id="in-story-pills" role="group" aria-label="Filter"></div>'
    + '<div class="vrd-root"><div class="rank-grid" id="in-story-grid"></div></div></section>';
  let epHtml = '', peopleHtml = '', playerIsRow = false, moreHtml = '';
  if (epData) {
    const show = epData.show;
    const showUrl = '/directory/' + encodeURIComponent(show.slug);
    const epUrl = feedEp ? showUrl + '?ep=' + encodeURIComponent(feedEp.guid) : showUrl;
    const art = (feedEp && feedEp.image) || show.logo || '';
    const mins = feedEp && feedEp.duration ? Math.round(feedEp.duration / 60) + ' min' : '';
    const meta = [post.epNum ? 'Episode ' + post.epNum : '', fmtDate(post.publishedAt), mins].filter(Boolean).join(' &middot; ');
    // The player (Sean, 2026-11-03: "I want the player to be consistent, like the episode"): an episode with no video is the same
    // row as on its show's page, art, Play and Save, with the docked player above it (public/ve-episodes.js, drawn by the script
    // at the foot of the page; this card is what shows until it loads and for anyone without scripts). An episode with a video keeps
    // its YouTube player and the card.
    playerIsRow = useRow;
    epHtml = (playerIsRow ? '<div class="vep-dock" data-vep-always></div><div id="ep-player" class="ep-player" data-show="' + esc(show.slug) + '" data-guid="' + esc(feedEp.guid) + '">' : '')
      + '<div class="ep-card">'
      + (art ? pic(art, 256, ' class="ep-art" width="96" height="96"') : '')
      + '<div class="ep-body"><a class="ep-show" href="' + showUrl + '">' + esc(show.name) + '</a>'
      + '<div class="ep-meta">' + meta + '</div>'
      + '<div class="ep-links"><a class="ep-btn ep-btn-go" href="' + epUrl + '">' + (!playerIsRow && (post.youtubeId || !feedEp) ? 'Listen on the show page' : 'Open on the show page') + '</a>'
      + '<a class="ep-btn" href="' + showUrl + '">Every episode</a></div></div></div>'
      + (playerIsRow ? '</div>' : '');
    // On this episode (Sean, 2026-11-03: "put them below About the Guest, and then that's where all those slots will fill"): the guest
    // and the host, then anyone else credited as the transcripts bring them in, right after About the Guest. In this story leaves
    // these people out, since they are here.
    if (people.length) peopleHtml = '<h3 class="article-section-head">On this episode</h3><div class="ep-people">' + people.map(function (c) {
      const l = c.listings;
      const face = l.logo_url ? pic(l.logo_url, 128, ' width="56" height="56"') : '<span class="ep-letter">' + esc((l.name || '?').charAt(0)) + '</span>';
      return '<a class="ep-person" href="/directory/' + encodeURIComponent(l.slug) + '">' + face + '<span><strong>' + esc(l.name) + '</strong><small>' + esc(c.role || '') + '</small></span></a>';
    }).join('') + '</div>';
    // The show's other episodes: the one before and after, then those nearest it.
    const i = siblings.findIndex(function (x) { return x.slug === post.slug; });
    if (siblings.length > 1) {
      const prev = i > 0 ? siblings[i - 1] : null, next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null;
      const near = siblings.map(function (x, k) { return { x: x, d: Math.abs(k - i) }; })
        .filter(function (o) { return o.x.slug !== post.slug && (!prev || o.x.slug !== prev.slug) && (!next || o.x.slug !== next.slug); })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 6).map(function (o) { return o.x; })
        .sort(function (a, b) { return String(b.published_at).localeCompare(String(a.published_at)); });
      const row = function (x, label) {
        const thumb = x.thumbnail_url || show.logo || '';
        return '<a class="ep-row" href="/pulse/' + encodeURIComponent(x.slug) + '">'
          + (thumb ? pic(thumb, 256, ' width="72" height="72"') : '')
          + '<span>' + (label ? '<small class="ep-row-label">' + label + '</small>' : '')
          + '<strong>' + esc(shortTitle(x.title)) + '</strong>'
          + '<small>' + [x.episode_number ? 'Episode ' + x.episode_number : '', fmtDate(x.published_at)].filter(Boolean).join(' &middot; ') + '</small></span></a>';
      };
      moreHtml = '<section class="ep-more" aria-label="More from ' + esc(show.name) + '"><div class="share-label">More from ' + esc(show.name) + '</div>'
        + ((prev || next) ? '<div class="ep-pn">' + (prev ? row(prev, 'Previous episode') : '<span></span>') + (next ? row(next, 'Next episode') : '<span></span>') + '</div>' : '')
        + (near.length ? '<div class="ep-list">' + near.map(function (x) { return row(x, ''); }).join('') + '</div>' : '')
        + '<a class="ep-btn" href="' + showUrl + '">See every episode of ' + esc(show.name) + '</a></section>';
    }
  }
  // The title is the page's one h1 (the show notes wrote it as an h2, so the page had none).
  let bodyHtml = post.body;
  if (!post.fromDepot) bodyHtml = bodyHtml.replace(/<h2 class="article-h1">([\s\S]*?)<\/h2>/, '<h1 class="article-h1">$1</h1>');
  // For an episode, the player and the show sit under the title and its summary, not above the title.
  let articleHtml = embedHtml + bodyHtml;
  if (epData) {
    // Short description, the player, then Topics Covered and About the Guest, then On this episode (Sean, 2026-11-03).
    const m = bodyHtml.match(/<p class="article-lede">[\s\S]*?<\/p>/);
    articleHtml = m ? bodyHtml.slice(0, m.index + m[0].length) + embedHtml + epHtml + bodyHtml.slice(m.index + m[0].length) + peopleHtml
      : embedHtml + epHtml + bodyHtml + peopleHtml;
  }
  const ld = epData ? {
    '@context': 'https://schema.org', '@type': 'PodcastEpisode', name: shortTitle(title), url: pageUrl, description: post.excerpt || undefined,
    datePublished: post.publishedAt || undefined, episodeNumber: post.epNum || undefined, image: (post.img || epData.show.logo) || undefined,
    partOfSeries: { '@type': 'PodcastSeries', name: epData.show.name, url: 'https://vegansexplore.com/directory/' + epData.show.slug },
    associatedMedia: feedEp ? { '@type': 'MediaObject', contentUrl: feedEp.audio } : (post.youtubeId ? { '@type': 'VideoObject', name: shortTitle(title), embedUrl: 'https://www.youtube.com/embed/' + post.youtubeId, thumbnailUrl: post.img || undefined, uploadDate: post.publishedAt || undefined } : undefined),
    actor: people.filter(function (c) { return c.role !== 'Host' && c.role !== 'Discussed'; }).map(function (c) { return { '@type': 'Person', name: c.listings.name, url: 'https://vegansexplore.com/directory/' + c.listings.slug }; })
  } : null;

  const html = '<!DOCTYPE html>'
    + '<html lang="en"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>' + esc(pageTitle) + '</title>'
    + '<meta name="description" content="' + esc(description) + '">'
    + (preview ? '<meta name="robots" content="noindex, nofollow">' : '')
    + '<link rel="canonical" href="' + pageUrl + '">'
    + '<meta property="og:type" content="article">'
    + '<meta property="og:site_name" content="Vegans Explore">'
    + '<meta property="og:title" content="' + esc(pageTitle) + '">'
    + '<meta property="og:description" content="' + esc(description) + '">'
    + '<meta property="og:image" content="' + esc(image) + '">'
    + '<meta property="og:url" content="' + pageUrl + '">'
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta name="twitter:title" content="' + esc(pageTitle) + '">'
    + '<meta name="twitter:description" content="' + esc(description) + '">'
    + '<meta name="twitter:image" content="' + esc(image) + '">'
    + (ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' : '')
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">'
    + '<style>'
    + '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}'
    + ':root{--ve-green:#3A9B3E;--ve-green-dark:#2d7d31;--ve-green-mid:#b8ddb9;--ve-green-light:#e8f5e9;--ve-orange:#F69820;--ve-orange-dark:#d4800f;--ve-border:rgba(0,0,0,0.09);--ve-text:#1a1a1a;--ve-text-75:rgba(26,26,26,0.75);--ve-text-50:rgba(26,26,26,0.50);--ve-text-30:rgba(26,26,26,0.30);}'
    + 'body{background:#f5f5f5;color:var(--ve-text);font-family:"Montserrat",sans-serif;-webkit-font-smoothing:antialiased;}'
    + '.btn-join{display:inline-block;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:13px 28px;border-radius:4px;text-decoration:none;background:var(--ve-green);color:#fff;transition:background 0.15s;border:none;cursor:pointer;}'
    + '.btn-join:hover{background:var(--ve-green-dark);}'
    + '.pulse-list-wrap{padding:28px 40px 64px;}'
    // Full width (LOCKED 2026-10-04): three-fourths the article, one-fourth the ad rail (public/ve-ad-rail.js); the article's
    // text keeps its own reading width inside its column.
    + '.article{max-width:860px;}'
    // The episode (Sean, 2026-11-01): the show, the player and the way to the show's page, the people on it, the other episodes.
    // In this story (Sean, 2026-11-02): the Directory cards of the people, restaurants and brands the story names. Filled by
    // the loader at the foot of the page (ve_content_mentions); hidden until a card is drawn.
    + '.in-story{margin:40px 0 28px;}.in-story[hidden]{display:none;}'
    + '.in-story-sub{font-size:13px;color:var(--ve-text-75);margin:0 0 14px;}'
    + '.in-story-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:14px;}'
    + '.in-story-grid>.in-story-item{min-width:0;}.in-story-item[hidden]{display:none;}'
    + '.in-story-pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;}'
    + '.in-story-pills button{font:inherit;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:9px 14px;min-height:38px;border-radius:99px;border:1px solid rgba(0,0,0,.2);background:#fff;color:var(--ve-text);cursor:pointer;}'
    + '.in-story-pills button[aria-pressed="true"]{background:var(--ve-green-dark);border-color:var(--ve-green-dark);color:#fff;}'
    + '.in-story-pills button span{font-weight:600;opacity:.75;margin-left:4px;}'
    + '.ep-card{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid var(--ve-border);border-radius:8px;padding:16px;margin:0 0 24px;}'
    + '.ep-art{width:96px;height:96px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--ve-green-light);}'
    + '.ep-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}'
    + '.ep-show{font-size:15px;font-weight:800;color:var(--ve-text);text-decoration:none;}.ep-show:hover{color:var(--ve-green-dark);}'
    + '.ep-meta{font-size:12px;font-weight:600;color:var(--ve-text-50);}'
    + '.ep-body audio{width:100%;height:40px;}'
    + '.ep-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px;}'
    + '.ep-btn{display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--ve-text);background:#fff;border:1.5px solid var(--ve-border);border-radius:6px;padding:10px 16px;}'
    + '.ep-btn:hover{border-color:var(--ve-text);}'
    + '.ep-btn-go{background:var(--ve-green-dark);border-color:var(--ve-green-dark);color:#fff;}.ep-btn-go:hover{background:#1f5f22;border-color:#1f5f22;}'
    + '.ep-player .vep-sum{display:none;}.vep-dock{margin-bottom:12px;}.ep-player{margin:0 0 24px;}.ep-player .ep-card{margin:0;}.ep-player-more{margin:12px 0 0;font-size:13px;}.ep-player-more a{color:var(--ve-green-dark);font-weight:800;}'
    + '.ep-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:10px;margin:0 0 24px;}'
    + '.ep-person{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--ve-border);border-radius:8px;padding:10px;text-decoration:none;color:var(--ve-text);}'
    + '.ep-person:hover{border-color:var(--ve-green);}'
    + '.ep-person img,.ep-letter{width:56px;height:56px;border-radius:8px;object-fit:cover;flex-shrink:0;}'
    + '.ep-letter{display:flex;align-items:center;justify-content:center;background:var(--ve-green-light);color:var(--ve-green-dark);font-size:22px;font-weight:900;}'
    + '.ep-person span{display:flex;flex-direction:column;min-width:0;}.ep-person strong{font-size:13px;font-weight:800;}.ep-person small{font-size:11px;font-weight:600;color:var(--ve-text-50);}'
    + '.ep-more{margin-top:36px;padding-top:28px;border-top:1px solid var(--ve-border);}'
    + '.ep-pn{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}'
    + '.ep-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(360px,100%),1fr));gap:10px;margin-bottom:16px;}'
    + '.ep-row{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--ve-border);border-radius:8px;padding:10px;text-decoration:none;color:var(--ve-text);min-width:0;}'
    + '.ep-row:hover{border-color:var(--ve-green);}'
    + '.ep-row img{width:72px;height:72px;border-radius:8px;object-fit:cover;flex-shrink:0;}'
    + '.ep-row span{display:flex;flex-direction:column;gap:3px;min-width:0;}'
    + '.ep-row strong{font-size:13px;font-weight:800;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}'
    + '.ep-row small{font-size:11px;font-weight:600;color:var(--ve-text-50);}'
    + '.ep-row .ep-row-label{font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--ve-green-dark);}'
    + '@media (max-width:640px){.ep-card{flex-direction:column;}.ep-art{width:72px;height:72px;}.ep-pn{grid-template-columns:1fr;}}'
    + '@media (max-width:640px){.pulse-list-wrap{padding:16px 16px 48px;}}'
    + '.panel-breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:28px;flex-wrap:wrap;}'
    + '.panel-trail-btn{background:none;border:none;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ve-green-dark);cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;}'
    + '.panel-breadcrumb-sep{font-size:11px;color:var(--ve-border);font-weight:600;}'
    + '.panel-breadcrumb-current{font-size:11px;font-weight:800;color:var(--ve-text);text-transform:uppercase;letter-spacing:0.08em;}'
    + '.article-eyebrow{font-size:9px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:var(--ve-green);margin-bottom:12px;}'
    + '.article-eyebrow.orange{color:var(--ve-orange-dark);}'
    + '.article-h1{font-size:clamp(22px,3vw,38px);font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;line-height:1.05;color:var(--ve-text);margin-bottom:16px;}'
    + '.article-lede{font-size:15px;font-weight:400;color:var(--ve-text-75);line-height:1.75;margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--ve-border);}'
    + '.article-section-head{font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:var(--ve-text);margin:28px 0 12px;}'
    + '.article-p{font-size:14px;font-weight:400;color:var(--ve-text-75);line-height:1.8;margin-bottom:16px;}'
    + '.article > p:not([class]):not([style]){font-size:14px;font-weight:400;color:var(--ve-text-75);line-height:1.8;margin:0 0 18px;}'
    + '.article a:not([class]){color:var(--ve-green-dark);font-weight:700;text-decoration:underline;text-underline-offset:3px;}'
    + '.article-updated{font-size:12.5px;font-weight:600;color:var(--ve-text-75);background:#f4f7f4;border-left:3px solid var(--ve-green);padding:6px 10px;margin:0 0 22px;line-height:1.5;}'
    + '.article-change{font-size:12px;color:var(--ve-text-50);margin:14px 0 0;line-height:1.5;}'
    + '.cover-credit{font-size:11.5px;font-weight:600;color:var(--ve-text-50);text-align:right;line-height:1.4;}'
    + '.article-source{font-size:12.5px;font-weight:600;color:var(--ve-text-50);line-height:1.6;margin:22px 0 0;}'
    + '.article-list{list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:12px;}'
    + '.article-list li{display:flex;align-items:flex-start;gap:12px;font-size:13px;color:var(--ve-text-75);line-height:1.65;}'
    + '.article-list li strong{color:var(--ve-text);font-weight:700;}'
    + '.article-dot{width:7px;height:7px;border-radius:50%;background:var(--ve-green);flex-shrink:0;margin-top:6px;}'
    + '.article-dot.orange{background:var(--ve-orange);}'
    + '.share-bar{margin-top:36px;padding-top:28px;border-top:1px solid var(--ve-border);}'
    + '.share-label{font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:var(--ve-text-50);margin-bottom:14px;}'
    + '.caption-field{border:1px solid var(--ve-border);border-radius:8px;overflow:hidden;max-width:620px;margin-bottom:22px;}'
    + '.caption-field textarea{width:100%;border:none;outline:none;resize:none;padding:12px 14px;font-family:"Montserrat",sans-serif;font-size:12px;color:var(--ve-text-75);background:#fafafa;line-height:1.6;}'
    + '.share-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}'
    + '.share-btn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;text-decoration:none;transition:transform 0.15s,box-shadow 0.15s;flex-shrink:0;}'
    + '.share-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.18);}'
    + '.share-btn:focus-visible{outline:3px solid var(--ve-orange);outline-offset:2px;}'
    + '.share-btn svg{width:18px;height:18px;color:#fff;}'
    + '.share-btn.facebook{background:#1877F2;} .share-btn.x{background:#000;} .share-btn.linkedin{background:#0A66C2;} .share-btn.whatsapp{background:#25D366;} .share-btn.sms{background:var(--ve-green-dark);} .share-btn.email{background:#6b6b6b;}'
    + '.share-link-field{display:flex;align-items:center;border:1px solid var(--ve-border);border-radius:8px;overflow:hidden;margin-left:4px;flex:1;min-width:220px;max-width:420px;}'
    + '.share-link-field input{flex:1;border:none;outline:none;padding:10px 14px;font-family:"Montserrat",sans-serif;font-size:11px;color:var(--ve-text-50);background:#fafafa;min-width:0;}'
    + '.share-copy-btn{border:none;background:var(--ve-text);color:#fff;font-family:"Montserrat",sans-serif;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:0 16px;height:40px;cursor:pointer;white-space:nowrap;}'
    + '.share-copy-btn:hover{background:#333;} .share-copy-btn.copied{background:var(--ve-green-dark);}'
    + ':focus-visible{outline:3px solid var(--ve-orange);outline-offset:3px;}'
    + '@media (max-width:640px){.share-link-field{max-width:none;width:100%;margin-left:0;margin-top:10px;}}'
    + '.pulse-comments{margin-top:36px;padding-top:28px;border-top:1px solid var(--ve-border);}'
    + '.pulse-comment-composer{margin-bottom:24px;}'
    + '.pulse-comment-composer textarea{width:100%;max-width:620px;border:1px solid var(--ve-border);border-radius:8px;padding:12px 14px;font-family:"Montserrat",sans-serif;font-size:13px;color:var(--ve-text);resize:vertical;min-height:70px;box-sizing:border-box;}'
    + '.pulse-comment-submit{margin-top:10px;border:none;background:var(--ve-green-dark);color:#fff;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:10px 20px;border-radius:6px;cursor:pointer;}'
    + '.pulse-comment-submit:hover{opacity:0.9;} .pulse-comment-submit:disabled{opacity:0.6;cursor:default;}'
    + '.pulse-comment-error{margin-top:8px;font-size:12px;color:#C0392B;}'
    + '.pulse-comment-gate{border:1px dashed var(--ve-border);border-radius:8px;padding:18px;max-width:620px;}'
    + '.pulse-comment-signin-btn{border:none;background:var(--ve-text);color:#fff;font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;padding:12px 20px;border-radius:6px;cursor:pointer;}'
    + '.pulse-comment-signin-btn:hover{background:#333;}'
    + '.pulse-comments-list{display:flex;flex-direction:column;gap:18px;max-width:620px;}'
    + '.pulse-comments-empty{font-size:13px;color:var(--ve-text-50);padding:8px 0;}'
    + '.pulse-comment{display:flex;gap:12px;align-items:flex-start;}'
    + '.pulse-comment-avatar{width:36px;height:36px;border-radius:50%;flex-shrink:0;object-fit:cover;}'
    + '.pulse-comment-avatar-fallback{display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;}'
    + '.pulse-comment-body{flex:1;min-width:0;}'
    + '.pulse-comment-meta{display:flex;align-items:baseline;gap:8px;margin-bottom:4px;}'
    + '.pulse-comment-name{font-size:12px;font-weight:700;color:var(--ve-text);}'
    + '.pulse-comment-time{font-size:11px;color:var(--ve-text-50);}'
    + '.pulse-comment-text{font-size:13px;color:var(--ve-text-75);line-height:1.6;white-space:pre-wrap;word-break:break-word;}'
    + '</style></head><body>'
    + '<script src="/public/nav.js"></script>'
    + (preview ? '<div role="note" style="position:sticky;top:0;z-index:50;background:#F69820;color:#1a1a1a;font:800 12px/1.4 Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-align:center;padding:9px 12px;">Preview' + (previewStatus === 'published' ? ' of a published piece' : ': not published yet') + '</div>' : '')
    // The shared banner (public/ve-city-banner.js), the same one as /pulse, the Directory and Events (Sean, 2026-11-01: the old
    // black bar and hero were retired on 2026-10-26 everywhere but here). An episode's banner picks among our shows (the pick opens
    // that show's page, with every episode); any other article's picks a chapter's Daily Pulse. It starts folded.
    + '<section id="pulse-hero"></section>'
    + '<div class="pulse-list-wrap"><div class="vear-layout">'
    + '<div class="vear-main">'
    + '<div class="article">' + articleHtml + sourceHtml
    // Anyone can ask for a change or a removal (Sean, 2026-09-29).
    + (post.fromDepot ? '<p class="article-change">Something wrong, or want this taken down? <a href="mailto:hello@vegansexplore.com?subject=' + encodeURIComponent('Change request: ' + post.headline) + '">Email us</a> and we will fix it.</p>' : '')
    // In this story (Sean, 2026-11-02): after the write-up and its source, the last thing before Share this article.
    + inStoryBlock
    + '<div class="share-bar">'
    + '<textarea id="captionInput" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;"></textarea>'
    + '<div class="share-label">Share this article</div>'
    + '<div class="share-row">'
    + '<a class="share-btn facebook" id="shareFb" title="Share on Facebook" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5h2.5V5.2c-.43-.06-1.9-.2-3.6-.2-3.57 0-6 2.24-6 6.35v2.9H3.6V18h3.3v9h4V18h3.17l.5-3.75H10.9v-2.5c0-1.08.3-1.83 1.86-1.83H14V8.5z"/></svg></a>'
    + '<a class="share-btn x" id="shareX" title="Share on X" aria-label="Share on X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3l7.1 9.4L4.3 21H7l5.3-6.3L16.9 21H21l-7.5-9.9L20 3h-2.7l-4.9 5.8L8.1 3H4z"/></svg></a>'
    + '<a class="share-btn linkedin" id="shareLi" title="Share on LinkedIn" aria-label="Share on LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4-.01 2 2 0 0 1 4 .01zM3.3 8.75h3.6V21H3.3V8.75zm6.03 0h3.45v1.68h.05c.48-.9 1.66-1.86 3.42-1.86 3.66 0 4.33 2.4 4.33 5.53V21h-3.6v-6.02c0-1.44-.03-3.28-2-3.28-2.02 0-2.33 1.57-2.33 3.18V21h-3.6V8.75z"/></svg></a>'
    + '<a class="share-btn whatsapp" id="shareWa" title="Share on WhatsApp" aria-label="Share on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.27-.1-.46-.15-.66.15-.2.3-.76.95-.93 1.15-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.5-.17 0-.37-.02-.56-.02s-.52.07-.8.37c-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.57-.35z"/><path d="M12 2C6.5 2 2 6.4 2 11.8c0 1.9.55 3.66 1.5 5.16L2 22l5.2-1.36A10.1 10.1 0 0 0 12 21.6c5.5 0 10-4.4 10-9.8S17.5 2 12 2zm0 17.8c-1.65 0-3.2-.44-4.53-1.2l-.32-.19-3.1.8.83-2.98-.2-.31A8.13 8.13 0 0 1 3.8 11.8c0-4.4 3.7-8 8.2-8s8.2 3.6 8.2 8-3.7 8-8.2 8z"/></svg></a>'
    + '<a class="share-btn sms" id="shareSms" title="Text this article" aria-label="Text this article"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H7l-3 3V4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="12.5" x2="13" y2="12.5"/></svg></a>'
    + '<a class="share-btn email" id="shareEmail" title="Share by email" aria-label="Share by email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/></svg></a>'
    + '<div class="share-link-field"><input id="shareUrlInput" type="text" readonly value="' + esc(pageUrl) + '"><button class="share-copy-btn" id="copyBtn">Copy</button></div>'
    + '</div></div>'
    + '<div class="pulse-comments" id="pulseComments" data-slug="' + esc(post.slug) + '">'
    + '<div class="share-label">Discussion</div>'
    + '<div id="pulseCommentComposerMount"></div>'
    + '<div id="pulseCommentsList" class="pulse-comments-list"><div class="pulse-comments-empty">Loading comments...</div></div>'
    + '</div>'
    + moreHtml
    + '</div></div>'
    // One ad per page, the tall one (Sean, 2026-10-27), drawn by public/ve-ad-rail.js through ve-ad-creative.js, so an HTML5 ad
    // plays in its frame (it was drawn as an <img> here, a broken picture), with Your ad here under it.
    + '<aside class="vear-rail" data-ad-page="pulse"></aside>'
    + '</div></div>'
    + '<script src="/public/ve-pulse-subscribe.js" defer></script>'
    + '<script src="/public/footer.js"></script>'
    + '<script src="/public/ve-hubs.js"></script>'
    + '<script src="/public/ve-city-banner.js"></script>'
    + '<script src="/public/ve-ad-creative.js"></script>'
    + '<script src="/public/ve-ad-rail.js"></script>'
    // The In this story loader (Sean, 2026-11-02): the shown mentions for this article (anon read), their Directory cards through
    // ve-region-directory.js (the same card, votes and page as the Directory), sorted into People, Media, Places and Organizations
    // with pills to pick one. Nothing shows when nothing is named.
    + (preview ? '' : '<script>(function(){var EXC=' + JSON.stringify(people.map(function (c) { return c.listings.slug; })) + ';var CID=' + JSON.stringify(post.id) + ',U=' + JSON.stringify(SUPABASE_URL) + ',K=' + JSON.stringify(SUPABASE_ANON_KEY) + ';'
      + 'var H={apikey:K,Authorization:"Bearer "+K};'
      + 'var GROUP={People:["Activists","Content Creators","Athletes","Physicians","Health Experts","Chefs","Founders"],'
      + 'Media:["Podcasts","Documentaries & Films","Books","YouTube","News Outlets","Radio and TV"],'
      + 'Organizations:["Nonprofits","Rescues","Sanctuaries","Groups","Event Venues","Events"]};'
      + 'var ORDER=["People","Media","Places","Organizations"];'
      + 'function groupOf(c){for(var g in GROUP){if(GROUP[g].indexOf(c)>=0)return g;}return "Places";}'
      + 'fetch(U+"/rest/v1/ve_content_mentions?select=listings(slug)&content_id=eq."+CID+"&status=eq.shown&limit=100",{headers:H})'
      + '.then(function(r){return r.ok?r.json():[];}).then(function(rows){'
      + 'var slugs=(rows||[]).map(function(x){return x.listings&&x.listings.slug;}).filter(function(x){return x&&EXC.indexOf(x)<0;});'
      + 'if(!slugs.length)return;'
      + 'var ready=window.VERegionDirectory?Promise.resolve():new Promise(function(res){var s=document.createElement("script");s.src="/public/ve-region-directory.js";s.onload=res;s.onerror=res;document.head.appendChild(s);});'
      + 'return ready.then(function(){if(!window.VERegionDirectory)return;VERegionDirectory.css();'
      + 'return fetch(U+"/rest/v1/listings?status=eq.approved&slug=in.("+slugs.map(encodeURIComponent).join(",")+")&select="+encodeURIComponent(VERegionDirectory.FIELDS),{headers:H})'
      + '.then(function(r){return r.ok?r.json():[];}).then(function(list){'
      + 'if(!list||!list.length)return;'
      + 'list.forEach(function(r){r._g=groupOf(r.category);});'
      + 'list.sort(function(a,b){return ORDER.indexOf(a._g)-ORDER.indexOf(b._g);});'
      + 'var section=document.getElementById("in-story"), grid=document.getElementById("in-story-grid"), pills=document.getElementById("in-story-pills");'
      + 'grid.innerHTML=list.map(function(r,i){return "<div class=\\"in-story-item\\" data-g=\\""+r._g+"\\">"+VERegionDirectory.card(r,i)+"</div>";}).join("");'
      + 'VERegionDirectory.wire(grid.parentNode);'
      + 'var present=ORDER.filter(function(g){return list.some(function(r){return r._g===g;});});'
      + 'function n(g){return list.filter(function(r){return !g||r._g===g;}).length;}'
      + 'pills.innerHTML=\'<button type="button" aria-pressed="true" data-g="">All<span>\'+n("")+\'</span></button>\''
      + '+present.map(function(g){return \'<button type="button" aria-pressed="false" data-g="\'+g+\'">\'+g+\'<span>\'+n(g)+\'</span></button>\';}).join("");'
      + 'pills.onclick=function(e){var b=e.target.closest("button");if(!b)return;var g=b.getAttribute("data-g");'
      + 'pills.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});'
      + 'grid.querySelectorAll(".in-story-item").forEach(function(it){it.hidden=!!g&&it.getAttribute("data-g")!==g;});};'
      + 'section.hidden=false;});});'
      + '}).catch(function(){});})();</script>')
    // The episode player (public/ve-episodes.js, the same row as a show's page and /listen): the show's art, Play into the docked
    // player, and Save, from the show's feed through ve-podcast.
    + (playerIsRow ? '<script src="/public/ve-episodes.js"></script><script>(function(){var box=document.getElementById("ep-player");if(!box||!window.VEEpisodes)return;'
      + 'var SB=' + JSON.stringify(SUPABASE_URL) + ',ANON=' + JSON.stringify(SUPABASE_ANON_KEY) + ',slug=box.getAttribute("data-show"),guid=box.getAttribute("data-guid");'
      + 'var tok="";try{tok=localStorage.getItem("ve_token")||"";}catch(e){}'
      + 'var h={"Content-Type":"application/json"};if(tok)h.Authorization="Bearer "+tok;'
      + 'var listing=fetch(SB+"/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=eq."+encodeURIComponent(slug)+"&limit=1",{headers:{apikey:ANON,Authorization:"Bearer "+ANON}}).then(function(r){return r.json();}).then(function(a){return a&&a[0];});'
      + 'var episode=fetch(SB+"/functions/v1/ve-podcast",{method:"POST",headers:h,body:JSON.stringify({action:"episode",slug:slug,guid:guid})}).then(function(r){return r.json();});'
      + 'Promise.all([listing,episode]).then(function(r){var l=r[0],d=r[1];if(!l||!d||!d.ok||!d.episode)return;'
      + 'var ep=d.episode,show={id:l.id,name:l.name,slug:l.slug,image:l.logo_url||(d.show&&d.show.image)||""},e2=Object.assign({},ep,{image:show.image||ep.image||""});'
      + "box.innerHTML=VEEpisodes.row(e2,show,{showName:true,saved:!!d.saved})+'<p class=\"ep-player-more\"><a href=\"/directory/'+encodeURIComponent(l.slug)+'\">Every episode of '+String(l.name).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</a></p>';"
      + 'VEEpisodes.css();'
      + 'box.addEventListener("click",function(e){var b=e.target.closest("[data-vep-play]");if(b){e.preventDefault();VEEpisodes.play(e2,show);return;}'
      + 'var sv=e.target.closest("[data-vep-save]");if(sv){e.preventDefault();VEEpisodes.save(l.id,ep.guid,sv);}});'
      + '}).catch(function(){});})();</script>' : '')
    + '<script>(function(){'
    + 'var SHOW=' + JSON.stringify(showSlug) + ';'
    + "var SHOWS=[{value:'vegans-explore-podcast',label:'Vegans Explore Podcast'},{value:'soflo-vegans-podcast',label:'SoFlo Vegans Podcast'},{value:'vegans-who-lift-podcast',label:'Vegans Who Lift Podcast'},{value:'pre-vegans-podcast',label:'Pre-Vegans Podcast'}];"
    + "if(window.VECityBanner&&document.getElementById('pulse-hero')){var ready=false,b;"
    + "if(SHOW){b=VECityBanner.mount('pulse-hero',{key:'pulse',title:'Daily Pulse',pickLabel:'Show',param:false,art:'/public/pulse-ve-banner.jpg',choices:SHOWS,initial:SHOW,"
    + "sub:'Show notes for every episode of our shows: who was on, what they talked about, and the episode to play.',"
    + "home:{label:'Pulse home',href:'/pulse'},link:function(v){return {href:'/directory/'+v,label:'Every episode'};},"
    + "onChange:function(v){if(ready&&v!==SHOW)location.href='/directory/'+encodeURIComponent(v);}});}"
    + "else{b=VECityBanner.mount('pulse-hero',{key:'pulse',title:'Daily Pulse',allTitle:'Every City',allLabel:'All cities',param:false,"
    + "sub:'Every chapter\\'s community board: today\\'s briefing and its conversation, jobs, classifieds, fosters and rescues.',"
    + "home:{label:'Pulse home',href:'/pulse'},onChange:function(slug){if(ready)location.href='/pulse'+(slug?'?city='+encodeURIComponent(slug):'');}});}"
    + "ready=true;document.body.classList.add('has-banner');if(b&&b.autoFold)b.autoFold();}"

    + 'var pageUrl=' + JSON.stringify(pageUrl) + ';'
    + 'var title=' + JSON.stringify(title) + ';'
    + 'var caption=' + JSON.stringify(caption) + ';'
    + 'var enc=encodeURIComponent;'
    + "document.getElementById('captionInput').value=caption;"
    + "document.getElementById('shareFb').href='https://www.facebook.com/sharer/sharer.php?u='+enc(pageUrl);"
    + "document.getElementById('shareX').href='https://twitter.com/intent/tweet?url='+enc(pageUrl)+'&text='+enc(caption);"
    + "document.getElementById('shareLi').href='https://www.linkedin.com/sharing/share-offsite/?url='+enc(pageUrl);"
    + "document.getElementById('shareWa').href='https://wa.me/?text='+enc(caption+' '+pageUrl);"
    + "document.getElementById('shareSms').href='sms:?&body='+enc(caption+' '+pageUrl);"
    + "document.getElementById('shareEmail').href='mailto:?subject='+enc(title)+'&body='+enc(caption+'\\n\\n'+pageUrl);"
    + "['shareFb','shareX','shareLi','shareWa'].forEach(function(id){document.getElementById(id).target='_blank';document.getElementById(id).rel='noopener';});"
    + "document.getElementById('copyBtn').addEventListener('click',function(){var btn=this,input=document.getElementById('shareUrlInput');input.select();if(navigator.clipboard){navigator.clipboard.writeText(pageUrl).then(function(){btn.textContent='Copied';btn.classList.add('copied');setTimeout(function(){btn.textContent='Copy';btn.classList.remove('copied');},1800);});}});"
    + "var PULSE_SUPABASE_URL=" + JSON.stringify(SUPABASE_URL) + ";"
    + "var PULSE_ANON_KEY=" + JSON.stringify(SUPABASE_ANON_KEY) + ";"
    + "function pEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}"
    + "var pulseSlug=" + JSON.stringify(post.slug) + ";"
    + "function pulseAvatarHtml(m){m=m||{};if(m.avatar_url)return '<img class=\"pulse-comment-avatar\" src=\"'+pEsc(m.avatar_url)+'\" alt=\"\">';var initials=m.initials||'VE';var color=m.color||'#22C55E';return '<div class=\"pulse-comment-avatar pulse-comment-avatar-fallback\" style=\"background:'+pEsc(color)+';\">'+pEsc(initials)+'</div>';}"
    + "function pulseTimeAgo(iso){var diff=Date.now()-new Date(iso).getTime();var mins=Math.floor(diff/60000);if(mins<1)return 'just now';if(mins<60)return mins+'m ago';var hrs=Math.floor(mins/60);if(hrs<24)return hrs+'h ago';var days=Math.floor(hrs/24);if(days<30)return days+'d ago';return new Date(iso).toLocaleDateString();}"
    + "function renderPulseCommentsList(comments){var wrap=document.getElementById('pulseCommentsList');if(!wrap)return;if(!comments.length){wrap.innerHTML='<div class=\"pulse-comments-empty\">No comments yet. Be the first to join the discussion.</div>';return;}wrap.innerHTML=comments.map(function(c){return '<div class=\"pulse-comment\">'+pulseAvatarHtml(c.member)+'<div class=\"pulse-comment-body\"><div class=\"pulse-comment-meta\"><span class=\"pulse-comment-name\">'+pEsc((c.member&&c.member.name)||'VE Member')+'</span><span class=\"pulse-comment-time\">'+pulseTimeAgo(c.created_at)+'</span></div><div class=\"pulse-comment-text\">'+pEsc(c.content)+'</div></div></div>';}).join('');}"
    + "function loadPulseComments(slug){fetch('/api/pulse-comments?slug='+enc(slug)).then(function(r){return r.json();}).then(function(d){renderPulseCommentsList(d.comments||[]);}).catch(function(){var wrap=document.getElementById('pulseCommentsList');if(wrap)wrap.innerHTML='<div class=\"pulse-comments-empty\">Comments are unavailable right now.</div>';});}"
    + "function waitForVEAuth(cb,attempts){attempts=attempts||0;if(window.VEAuth){cb();return;}if(!document.querySelector('script[src*=\"ve-auth\"]')){var s=document.createElement('script');s.src='/public/ve-auth.js';document.head.appendChild(s);}if(attempts>60){cb();return;}setTimeout(function(){waitForVEAuth(cb,attempts+1);},100);}"
    + "function renderPulseComposer(slug){var mount=document.getElementById('pulseCommentComposerMount');if(!mount)return;waitForVEAuth(function(){if(window.VEAuth&&VEAuth.isLoggedIn()){mount.innerHTML='<div class=\"pulse-comment-composer\"><textarea id=\"pulseCommentInput\" rows=\"3\" placeholder=\"Join the discussion...\" maxlength=\"2000\"></textarea><div><button class=\"pulse-comment-submit\" id=\"pulseCommentSubmit\" type=\"button\">Post Comment</button></div><div class=\"pulse-comment-error\" id=\"pulseCommentError\" style=\"display:none;\"></div></div>';document.getElementById('pulseCommentSubmit').addEventListener('click',function(){submitPulseComment(slug);});}else{mount.innerHTML='<div class=\"pulse-comment-gate\"><button class=\"pulse-comment-signin-btn\" id=\"pulseCommentSignIn\" type=\"button\">Sign in with your Passport to join the discussion</button></div>';document.getElementById('pulseCommentSignIn').addEventListener('click',function(){if(window.VEAuth){VEAuth.requirePassport(function(){renderPulseComposer(slug);},'Sign in to comment on this article.');}});}});}"
    + "function submitPulseComment(slug){var input=document.getElementById('pulseCommentInput');var errEl=document.getElementById('pulseCommentError');var btn=document.getElementById('pulseCommentSubmit');if(!input)return;var content=input.value.trim();if(errEl)errEl.style.display='none';if(!content)return;if(btn){btn.disabled=true;btn.textContent='Posting...';}fetch('/api/pulse-comments?slug='+enc(slug),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:content,token:VEAuth.getToken()})}).then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});}).then(function(res){if(btn){btn.disabled=false;btn.textContent='Post Comment';}if(!res.ok){if(errEl){errEl.textContent=(res.d&&res.d.error)||'Something went wrong.';errEl.style.display='block';}return;}input.value='';loadPulseComments(slug);}).catch(function(){if(btn){btn.disabled=false;btn.textContent='Post Comment';}if(errEl){errEl.textContent='Something went wrong. Please try again.';errEl.style.display='block';}});}"
    + "renderPulseComposer(pulseSlug);"
    + "loadPulseComments(pulseSlug);"
    + '})();</script>'
    + '</body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', preview ? 'private, no-store' : 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  if (preview) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.status(200).send(html);
};
