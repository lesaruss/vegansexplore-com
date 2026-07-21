// Vercel Serverless Function: /api/pulse-article
// Serves a real, crawlable, per-article Pulse page at /pulse/[slug] (rewritten in vercel.json).
// Exists so link-preview crawlers (Facebook, LinkedIn, iMessage, Slack) see a real
// title/image/description in the raw page source, since pulse.html builds its content
// with client-side JavaScript that those crawlers never execute.
//
// Categories and ad rail here must mirror pulse.html exactly (same consolidated
// Community/Recipes taxonomy, same ad_placements/ad_campaigns rail via ad-resolve).

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
    body: '<div class="article-eyebrow orange">Events</div><h1 class="article-h1">First Community Events Drop on Launch Day.</h1><p class="article-lede">Launch week isn\'t just a website going live. It\'s a real-world activation across nine regions. The first VEGANS EXPLORE community events are being planned city by city right now, and Founding Members get first access to RSVP before a single public ticket is released.</p><div class="article-section-head">What Launch Week Looks Like</div><p class="article-p">Every region is planning at least one launch week activation. Restaurant takeovers, outdoor markets, community meetups, the format varies by city. Founding Members receive RSVP access before public tickets open. In most cases that means exclusive access to events that will sell out before they hit general availability.</p><div class="article-section-head">The Event Infrastructure</div><p class="article-p">Events run through the platform\'s affiliate ticket model, Community Partners and Vegan Explorers can drive ticket sales and earn commission, and every ticket sold goes back into building the community that hosted it.</p><div class="article-section-head">After Launch Week</div><p class="article-p">The calendar stays live and grows as Community Managers in each region establish their local event cadence. If you want to host an event through the platform, the Community Manager in your city is your first contact.</p>'
  },
  {
    slug: 'recipes', category: 'Recipes',
    headline: "The Recipe Ecosystem Is Opening to Creators on Launch Day",
    excerpt: "Community creators can start submitting recipes. Confidence scoring, affiliate tiers, and the Cooking Show pipeline explained.",
    img: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/hf_20260609_193919_cbe48df1-25d8-4d2c-92d0-e2d277cfe5b6.png',
    body: '<div class="article-eyebrow">Recipe Ecosystem</div><h1 class="article-h1">The Recipe Ecosystem Is Bigger Than a Recipe Page.</h1><p class="article-lede">VEGANS EXPLORE was never going to be a recipe site. But it was always going to take recipes seriously. What\'s been built is an ecosystem, from submission to scoring to affiliate revenue to a Cooking Show pipeline.</p><div class="article-section-head">How Submission Works</div><p class="article-p">Any member can submit a recipe. Once submitted, it enters the Confidence Score pipeline, a composite rating built on community rating (40%), nutritional verification via USDA FoodData Central (40%), and editorial review (20%). A recipe earns its placement.</p><div class="article-section-head">The Affiliate Tier</div><p class="article-p">Recipes that perform generate affiliate value. Creators who build a following around their recipes earn through the platform\'s affiliate structure, initially tied to VEGANS EXPLORE membership signups that flow through their content.</p><div class="article-section-head">The Cooking Show Pipeline</div><p class="article-p">The Cooking Show is a Phase 2 program that unlocks at 1,000 members or 10 verified creators. Creators who have built an audience and a body of high-confidence recipes become candidates. Community-first, not celebrity-first.</p>'
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

  let post = STATIC_POSTS.find(function (p) { return p.slug === slug; });

  if (!post) {
    try {
      const url = SUPABASE_URL + '/rest/v1/ve_pulse_content?select=slug,title,category,youtube_id,summary,body,thumbnail_url&slug=eq.' + encodeURIComponent(slug) + '&status=eq.published&limit=1';
      const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) {
        const row = rows[0];
        post = {
          slug: row.slug,
          category: row.category,
          headline: row.title,
          excerpt: row.summary || '',
          img: row.thumbnail_url,
          youtubeId: row.youtube_id,
          body: row.body || ''
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
  const title = post.headline;
  const description = (post.excerpt || '').slice(0, 200);
  const image = post.img || 'https://vegansexplore.com/public/pulse-ve-banner.png';
  const caption = 'Read this on VEGANS EXPLORE Pulse: ' + title;

  const embedHtml = post.youtubeId
    ? '<div style="position:relative;width:100%;aspect-ratio:16/9;margin-bottom:28px;border-radius:8px;overflow:hidden;background:#000;">'
      + '<iframe src="https://www.youtube.com/embed/' + post.youtubeId + '" title="' + esc(title) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      + '</div>'
    : '';

  const html = '<!DOCTYPE html>'
    + '<html lang="en"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>' + esc(title) + ' - VEGANS EXPLORE Pulse</title>'
    + '<meta name="description" content="' + esc(description) + '">'
    + '<link rel="canonical" href="' + pageUrl + '">'
    + '<meta property="og:type" content="article">'
    + '<meta property="og:site_name" content="VEGANS EXPLORE">'
    + '<meta property="og:title" content="' + esc(title) + '">'
    + '<meta property="og:description" content="' + esc(description) + '">'
    + '<meta property="og:image" content="' + esc(image) + '">'
    + '<meta property="og:url" content="' + pageUrl + '">'
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta name="twitter:title" content="' + esc(title) + '">'
    + '<meta name="twitter:description" content="' + esc(description) + '">'
    + '<meta name="twitter:image" content="' + esc(image) + '">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">'
    + '<style>'
    + '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}'
    + ':root{--ve-green:#3A9B3E;--ve-green-dark:#2d7d31;--ve-green-mid:#b8ddb9;--ve-green-light:#e8f5e9;--ve-orange:#F69820;--ve-orange-dark:#d4800f;--ve-border:rgba(0,0,0,0.09);--ve-text:#1a1a1a;--ve-text-75:rgba(26,26,26,0.75);--ve-text-50:rgba(26,26,26,0.50);--ve-text-30:rgba(26,26,26,0.30);}'
    + 'body{background:#f5f5f5;color:var(--ve-text);font-family:"Montserrat",sans-serif;-webkit-font-smoothing:antialiased;}'
    + '.pulse-list-wrap{padding:28px 40px 64px;}'
    + '.pulse-content-row{display:flex;align-items:flex-start;gap:24px;max-width:1180px;margin:0 auto;}'
    + '.pulse-main{flex:1;min-width:0;max-width:760px;}'
    + '.ad-rail{width:300px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:16px;position:sticky;top:24px;}'
    + '.ad-rail-label{font-size:9px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:var(--ve-text-30);text-align:center;}'
    + '.ad-slot{position:relative;border-radius:8px;overflow:hidden;background:#fff;border:1px solid var(--ve-border);width:100%;max-width:300px;flex-shrink:0;}'
    + '.ad-slot-tower{aspect-ratio:1/2;} .ad-slot-landscape{aspect-ratio:6/5;}'
    + '.ad-slot a{display:block;width:100%;height:100%;} .ad-slot img{width:100%;height:100%;object-fit:cover;display:block;}'
    + '.ad-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--ve-green-light);color:var(--ve-green-dark);}'
    + '.ad-placeholder svg{width:26px;height:26px;opacity:0.6;} .ad-ph-text{font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;} .ad-ph-dim{font-size:10px;font-weight:600;color:var(--ve-text-30);}'
    + '@media (max-width:1240px){.pulse-content-row{flex-direction:column;}.ad-rail{position:static;top:auto;width:100%;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:12px;padding-top:20px;border-top:1px solid var(--ve-border);}.ad-slot{width:100%;max-width:100%;}}'
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
    + '</style></head><body>'
    + '<script src="/public/nav.js"></script>'
    + '<div class="pulse-list-wrap"><div class="pulse-content-row">'
    + '<div class="pulse-main">'
    + '<div class="panel-breadcrumb"><a class="panel-trail-btn" href="/pulse">Pulse</a><span class="panel-breadcrumb-sep">/</span><span class="panel-breadcrumb-current">' + esc(post.category || '') + '</span></div>'
    + '<div class="article">' + embedHtml + post.body
    + '<div class="share-bar">'
    + '<div class="share-label">Default caption</div>'
    + '<div class="caption-field"><textarea id="captionInput" rows="2" readonly></textarea></div>'
    + '<div class="share-label">Share this article</div>'
    + '<div class="share-row">'
    + '<a class="share-btn facebook" id="shareFb" title="Share on Facebook" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5h2.5V5.2c-.43-.06-1.9-.2-3.6-.2-3.57 0-6 2.24-6 6.35v2.9H3.6V18h3.3v9h4V18h3.17l.5-3.75H10.9v-2.5c0-1.08.3-1.83 1.86-1.83H14V8.5z"/></svg></a>'
    + '<a class="share-btn x" id="shareX" title="Share on X" aria-label="Share on X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3l7.1 9.4L4.3 21H7l5.3-6.3L16.9 21H21l-7.5-9.9L20 3h-2.7l-4.9 5.8L8.1 3H4z"/></svg></a>'
    + '<a class="share-btn linkedin" id="shareLi" title="Share on LinkedIn" aria-label="Share on LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4-.01 2 2 0 0 1 4 .01zM3.3 8.75h3.6V21H3.3V8.75zm6.03 0h3.45v1.68h.05c.48-.9 1.66-1.86 3.42-1.86 3.66 0 4.33 2.4 4.33 5.53V21h-3.6v-6.02c0-1.44-.03-3.28-2-3.28-2.02 0-2.33 1.57-2.33 3.18V21h-3.6V8.75z"/></svg></a>'
    + '<a class="share-btn whatsapp" id="shareWa" title="Share on WhatsApp" aria-label="Share on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.27-.1-.46-.15-.66.15-.2.3-.76.95-.93 1.15-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.5-.17 0-.37-.02-.56-.02s-.52.07-.8.37c-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.57-.35z"/><path d="M12 2C6.5 2 2 6.4 2 11.8c0 1.9.55 3.66 1.5 5.16L2 22l5.2-1.36A10.1 10.1 0 0 0 12 21.6c5.5 0 10-4.4 10-9.8S17.5 2 12 2zm0 17.8c-1.65 0-3.2-.44-4.53-1.2l-.32-.19-3.1.8.83-2.98-.2-.31A8.13 8.13 0 0 1 3.8 11.8c0-4.4 3.7-8 8.2-8s8.2 3.6 8.2 8-3.7 8-8.2 8z"/></svg></a>'
    + '<a class="share-btn sms" id="shareSms" title="Text this article" aria-label="Text this article"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H7l-3 3V4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="12.5" x2="13" y2="12.5"/></svg></a>'
    + '<a class="share-btn email" id="shareEmail" title="Share by email" aria-label="Share by email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/></svg></a>'
    + '<div class="share-link-field"><input id="shareUrlInput" type="text" readonly value="' + esc(pageUrl) + '"><button class="share-copy-btn" id="copyBtn">Copy</button></div>'
    + '</div></div></div></div>'
    + '<aside class="ad-rail" id="veAdRail" aria-label="Advertisement">'
    + '<div class="ad-rail-label">Advertisement</div>'
    + '<div class="ad-slot ad-slot-tower" id="adSlotSkyscraper"><div class="ad-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg><div class="ad-ph-text">Advertisement</div><div class="ad-ph-dim">300 x 600</div></div></div>'
    + '<div class="ad-slot ad-slot-landscape" id="adSlotLandscape1"><div class="ad-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg><div class="ad-ph-text">Advertisement</div><div class="ad-ph-dim">300 x 250</div></div></div>'
    + '</aside>'
    + '</div></div>'
    + '<script src="/public/footer.js"></script>'
    + '<script>(function(){'
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
    + "var VE_AD_SLOT_ELS={'skyscraper':'adSlotSkyscraper','landscape-1':'adSlotLandscape1'};"
    + "function renderAdSlot(elId,ad){var el=document.getElementById(elId);if(!el||!ad||!ad.image_url)return;el.innerHTML='<a href=\"'+pEsc(ad.link_url||'#')+'\" target=\"_blank\" rel=\"noopener noreferrer sponsored\"><img src=\"'+pEsc(ad.image_url)+'\" alt=\"Advertisement\"></a>';}"
    + "fetch(PULSE_SUPABASE_URL+'/functions/v1/ad-resolve?brand_slug=vegans-explore&page_slug=pulse',{headers:{apikey:PULSE_ANON_KEY,Authorization:'Bearer '+PULSE_ANON_KEY}}).then(function(r){return r.json();}).then(function(data){var slots=data&&data.slots;if(!slots||!slots.length)return;slots.forEach(function(s){var elId=VE_AD_SLOT_ELS[s.slot_id];if(elId)renderAdSlot(elId,s);});}).catch(function(){});"
    + '})();</script>'
    + '</body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
};
