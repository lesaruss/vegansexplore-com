import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner with Vegans Explore',
  description: 'Grow your brand with the Vegans Explore network. Community partnerships, campaigns, marketing services, and more.',
}

const styles = `
  :root {
    --bg: #f5f5f5;
    --surface: #ffffff;
    --surface2: #f0f0f0;
    --border: rgba(0,0,0,0.09);
    --text: #1a1a1a;
    --text-75: rgba(26,26,26,0.75);
    --text-50: rgba(26,26,26,0.52);
    --text-30: rgba(26,26,26,0.32);
    --ve-green: #2d7a3a;
    --ve-green-dark: #1f5528;
    --ve-green-light: rgba(45,122,58,0.08);
    --ve-green-mid: rgba(45,122,58,0.14);
    --ve-amber: #b45309;
    --ve-amber-light: rgba(180,83,9,0.08);
    --ve-blue: #1d4ed8;
    --ve-blue-light: rgba(29,78,216,0.07);
    --radius: 12px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    line-height: 1.65;
  }
  :focus-visible { outline: 3px solid var(--ve-green); outline-offset: 3px; }
  a { color: inherit; text-decoration: none; }
  nav {
    position: sticky; top: 0; z-index: 100;
    height: 64px;
    background: rgba(255,255,255,0.97);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
  }
  .nav-logo {
    font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--text); display: flex; align-items: center; gap: 0;
  }
  .nav-logo em { color: var(--ve-green); font-style: normal; }
  .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
  .nav-links a { font-size: 12px; font-weight: 700; color: var(--text-75); transition: color 0.15s; }
  .nav-links a:hover, .nav-links a.active { color: var(--ve-green); }
  .nav-cta {
    background: var(--ve-green); color: #fff;
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 10px 22px; border-radius: 100px; transition: background 0.15s; white-space: nowrap;
  }
  .nav-cta:hover, .nav-cta:focus { background: var(--ve-green-dark); }
  @media (max-width:768px) { .nav-links { display: none; } nav { padding: 0 20px; } }
  .hero { background: var(--ve-green); color: #fff; padding: 88px 32px 80px; text-align: center; }
  .hero-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(255,255,255,0.75); margin-bottom: 18px; display: block;
  }
  .hero h1 { font-size: clamp(34px, 5.5vw, 58px); font-weight: 900; line-height: 1.08; margin-bottom: 22px; }
  .hero h1 em { font-style: italic; }
  .hero-sub { font-size: 17px; font-weight: 400; color: rgba(255,255,255,0.82); max-width: 580px; margin: 0 auto 44px; }
  .hero-stats { display: flex; justify-content: center; flex-wrap: wrap; gap: 36px; margin-bottom: 48px; }
  .hero-stat .num { font-size: 30px; font-weight: 900; display: block; line-height: 1; margin-bottom: 5px; }
  .hero-stat .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.82); }
  .hero-rule { width: 40px; height: 2px; background: rgba(255,255,255,0.25); margin: 0 auto 44px; }
  .btn-white {
    display: inline-block; background: #fff; color: var(--ve-green);
    font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.14em;
    padding: 16px 38px; border-radius: 100px; transition: background 0.15s, transform 0.1s;
  }
  .btn-white:hover, .btn-white:focus { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
  .btn-ghost {
    display: inline-block; border: 2px solid rgba(255,255,255,0.45); color: #fff;
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em;
    padding: 14px 28px; border-radius: 100px; margin-left: 12px; transition: border-color 0.15s;
  }
  .btn-ghost:hover, .btn-ghost:focus { border-color: rgba(255,255,255,0.9); }
  @media (max-width:520px) {
    .hero { padding: 60px 20px 56px; }
    .btn-ghost { margin-left: 0; margin-top: 12px; display: block; text-align: center; }
    .hero-stats { gap: 24px; }
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
  .section { padding: 80px 0; }
  .section-alt { background: var(--surface); }
  @media (max-width:680px) { .wrap { padding: 0 20px; } .section { padding: 56px 0; } }
  .sec-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--ve-green); display: block; margin-bottom: 10px;
  }
  .sec-title { font-size: clamp(26px, 4vw, 38px); font-weight: 900; line-height: 1.1; margin-bottom: 14px; }
  .sec-title em { font-style: italic; }
  .sec-sub { font-size: 15px; color: var(--text-75); max-width: 600px; margin-bottom: 52px; line-height: 1.7; }
  .tier-card { background: var(--surface); border: 2px solid var(--ve-green); border-radius: var(--radius); overflow: hidden; max-width: 600px; }
  .tier-head {
    background: var(--ve-green); color: #fff; padding: 32px 36px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .tier-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px; }
  .tier-title-text { font-size: 24px; font-weight: 900; }
  .tier-price-block { text-align: right; }
  .tier-amount { font-size: 42px; font-weight: 900; line-height: 1; }
  .tier-per { font-size: 13px; font-weight: 600; opacity: 0.72; }
  .tier-body { padding: 32px 36px; }
  .tier-list-label { font-size: 9px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-75); margin-bottom: 16px; }
  .tier-list { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
  .tier-list li { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; line-height: 1.55; }
  .tier-list li::before {
    content: ""; flex-shrink: 0; width: 20px; height: 20px; margin-top: 1px;
    background: var(--ve-green-light); border-radius: 50%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 6l2.5 2.5 4.5-4.5' stroke='%232d7a3a' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: center;
  }
  .tier-divider { height: 1px; background: var(--border); margin: 24px 0; }
  .btn-green {
    display: inline-block; background: var(--ve-green); color: #fff;
    font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.14em;
    padding: 15px 34px; border-radius: 100px; transition: background 0.15s;
  }
  .btn-green:hover, .btn-green:focus { background: var(--ve-green-dark); }
  @media (max-width:500px) {
    .tier-head { flex-direction: column; }
    .tier-price-block { text-align: left; }
    .tier-body { padding: 24px 22px; }
    .tier-head { padding: 26px 22px; }
  }
  .campaign-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .campaign-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .camp-head { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
  .camp-date { font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ve-amber); margin-bottom: 6px; }
  .camp-name { font-size: 18px; font-weight: 900; line-height: 1.2; }
  .camp-body { padding: 18px 24px; }
  .camp-desc { font-size: 13px; color: var(--text-75); line-height: 1.6; margin-bottom: 14px; }
  .camp-detail { font-size: 11px; font-weight: 700; color: var(--text-75); display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
  .tour-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
  .tt { border: 1px solid var(--border); border-radius: 8px; padding: 16px 14px; text-align: center; background: var(--bg); }
  .tt.featured { border-color: var(--ve-green); background: var(--ve-green-light); }
  .tt-name { font-size: 9px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-50); margin-bottom: 6px; }
  .tt-price { font-size: 20px; font-weight: 900; color: var(--ve-green); }
  @media (max-width:500px) { .tour-tiers { grid-template-columns: 1fr; } }
  .cards-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(248px, 1fr)); }
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 28px 24px; display: flex; flex-direction: column; transition: box-shadow 0.18s;
  }
  .card:hover { box-shadow: 0 4px 20px rgba(45,122,58,0.07); }
  .card-icon { font-size: 26px; margin-bottom: 14px; line-height: 1; }
  .card-title { font-size: 14px; font-weight: 800; letter-spacing: 0.03em; margin-bottom: 8px; }
  .card-desc { font-size: 13px; color: var(--text-75); line-height: 1.6; flex: 1; }
  .services-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
  .svc { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 700; }
  .svc-icon { font-size: 20px; flex-shrink: 0; }
  .alacarte { display: flex; flex-direction: column; gap: 14px; max-width: 700px; }
  .alac { display: flex; align-items: flex-start; gap: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 22px; }
  .alac-icon { font-size: 24px; flex-shrink: 0; padding-top: 2px; }
  .alac-name { font-size: 14px; font-weight: 800; letter-spacing: 0.03em; margin-bottom: 4px; }
  .alac-desc { font-size: 13px; color: var(--text-75); line-height: 1.55; }
  .alac-tag {
    margin-left: auto; flex-shrink: 0; align-self: center;
    font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 100px; background: var(--ve-green-light); color: var(--ve-green);
  }
  @media (max-width:480px) { .alac { flex-wrap: wrap; } .alac-tag { margin-left: 0; margin-top: 8px; } }
  .cta-section { background: var(--ve-green); color: #fff; padding: 88px 32px; text-align: center; }
  .cta-section h2 { font-size: clamp(26px, 4.5vw, 42px); font-weight: 900; line-height: 1.1; margin-bottom: 16px; }
  .cta-section h2 em { font-style: italic; }
  .cta-section p { font-size: 16px; color: rgba(255,255,255,0.8); max-width: 500px; margin: 0 auto 36px; }
  @media (max-width:520px) { .cta-section { padding: 60px 20px; } }
  footer {
    background: var(--surface); border-top: 1px solid var(--border); padding: 28px 32px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .footer-logo { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text); }
  .footer-nav { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .footer-nav a { font-size: 12px; font-weight: 700; color: var(--text-75); transition: color 0.15s; }
  .footer-nav a:hover { color: var(--ve-green); }
  .footer-copy { font-size: 11px; color: var(--text-50); }
  @media (max-width:600px) { footer { flex-direction: column; align-items: flex-start; padding: 24px 20px; } .footer-nav { gap: 16px; } }
`

export default function PartnerPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav aria-label="Main navigation">
        <a href="https://vegansexplore.com" className="nav-logo" aria-label="Vegans Explore home">
          Vegans <em>Explore</em>
        </a>
        <ul className="nav-links" role="list">
          <li><a href="https://vegansexplore.com/guides/ve-guides-roster-v1">Guides</a></li>
          <li><a href="https://vegansexplore.com/guides/ve-discuss">Discuss</a></li>
          <li><a href="https://vegansexplore.com/communities">Communities</a></li>
          <li><a href="https://vegansexplore.com/directory">Directory</a></li>
          <li><a href="https://vegansexplore.com/passport">Passport</a></li>
        </ul>
        <a href="mailto:contact@vegansexplore.com" className="nav-cta">Become a Partner</a>
      </nav>

      <header className="hero" role="banner">
        <span className="hero-label">Partnership Opportunities</span>
        <h1>Grow With<br /><em>Vegans Explore.</em></h1>
        <p className="hero-sub">Connect your brand to one of the fastest-growing plant-based networks in the country. Real reach. Real events. Real people.</p>
        <div className="hero-stats" aria-label="Key audience stats">
          <div className="hero-stat"><span className="num">~24K</span><span className="lbl">Social Followers</span></div>
          <div className="hero-stat"><span className="num">77K+</span><span className="lbl">Podcast Downloads</span></div>
          <div className="hero-stat"><span className="num">17.8K</span><span className="lbl">Email Delivered 2025</span></div>
          <div className="hero-stat"><span className="num">8</span><span className="lbl">Active Cities</span></div>
          <div className="hero-stat"><span className="num">200</span><span className="lbl">Influencer Partners</span></div>
        </div>
        <div className="hero-rule" aria-hidden="true"></div>
        <a href="#community-partner" className="btn-white">Start at $111/mo</a>
        <a href="mailto:contact@vegansexplore.com" className="btn-ghost">Talk to us</a>
      </header>

      <div className="section-alt">
        <div className="section wrap" id="community-partner">
          <span className="sec-label">Most Popular</span>
          <h2 className="sec-title">The <em>Community Partner.</em></h2>
          <p className="sec-sub">The entry point for local brands that want consistent, real presence inside the VE community. Month to month, no contract.</p>
          <div className="tier-card" role="region" aria-label="Community Partner tier">
            <div className="tier-head">
              <div>
                <div className="tier-eyebrow">Tier 01</div>
                <div className="tier-title-text">Community Partner</div>
              </div>
              <div className="tier-price-block" aria-label="111 dollars per month">
                <div className="tier-amount">$111</div>
                <div className="tier-per">per month</div>
              </div>
            </div>
            <div className="tier-body">
              <div className="tier-list-label">What you get every month</div>
              <ul className="tier-list">
                <li>Access to a growing list of business marketing and productivity tools to help your brand operate smarter</li>
                <li>Listed in one region as a Community Partner, giving your brand increased exposure to local vegan audiences</li>
                <li>Up to two scheduled social collaborations per month featuring your brand across Vegans Explore channels</li>
              </ul>
              <div className="tier-divider" aria-hidden="true"></div>
              <a href="mailto:contact@vegansexplore.com?subject=Community Partner" className="btn-green">Become a Community Partner</a>
            </div>
          </div>
        </div>
      </div>

      <div className="section wrap" id="campaigns">
        <span className="sec-label">Upcoming Opportunities</span>
        <h2 className="sec-title">Campaigns <em>&amp; Events.</em></h2>
        <p className="sec-sub">Sponsor a campaign. Be part of the moment. These events bring our community together in person - your brand belongs in the room.</p>
        <div className="campaign-grid" role="list">
          <div className="campaign-card" role="listitem">
            <div className="camp-head">
              <div className="camp-date">September 13, 2026</div>
              <div className="camp-name">Dolphin Tailgate</div>
            </div>
            <div className="camp-body">
              <p className="camp-desc">Miami Dolphins pre-game experience at Hard Rock Stadium with access to an F1 garage space. One of the highest-visibility VE events of the year, combining sports, community, and culture.</p>
              <div className="camp-detail"><span aria-hidden="true">&#128205;</span> Miami, FL - Hard Rock Stadium</div>
              <div className="camp-detail"><span aria-hidden="true">&#127944;</span> F1 garage space + tailgate</div>
            </div>
          </div>
          <div className="campaign-card" role="listitem">
            <div className="camp-head">
              <div className="camp-date">November 1, 2026</div>
              <div className="camp-name">World Vegan EXPO</div>
            </div>
            <div className="camp-body">
              <p className="camp-desc">Our flagship annual expo. The biggest day of the year for the plant-based community. Top sponsors are recognized on stage. High-foot-traffic sampling, visibility, and direct consumer engagement.</p>
              <div className="camp-detail"><span aria-hidden="true">&#127981;</span> Annual flagship event</div>
              <div className="camp-detail"><span aria-hidden="true">&#127942;</span> Top sponsors recognized on stage</div>
            </div>
          </div>
          <div className="campaign-card" role="listitem">
            <div className="camp-head">
              <div className="camp-date">Rolling - All Cities</div>
              <div className="camp-name">Vegans Explore Night</div>
            </div>
            <div className="camp-body">
              <p className="camp-desc">City-by-city community meetup nights in all active markets. Intimate events that give local brands direct face time with their people. Perfect for tastings, giveaways, and introductions.</p>
              <div className="camp-detail"><span aria-hidden="true">&#127758;</span> 8 active cities</div>
              <div className="camp-detail"><span aria-hidden="true">&#129327;</span> Sampling and giveaway opportunities</div>
            </div>
          </div>
          <div className="campaign-card" role="listitem">
            <div className="camp-head">
              <div className="camp-date">In Development</div>
              <div className="camp-name">Vegans Explore Tour</div>
            </div>
            <div className="camp-body">
              <p className="camp-desc">A multi-city tour bringing the VE community on the road. Get in early for the best positioning.</p>
              <div className="camp-detail"><span aria-hidden="true">&#127950;</span> Multi-city</div>
              <div className="tour-tiers" role="list" aria-label="Tour sponsorship tiers">
                <div className="tt" role="listitem"><div className="tt-name">Contributing</div><div className="tt-price">$1,111</div></div>
                <div className="tt featured" role="listitem"><div className="tt-name">Co-Presenting</div><div className="tt-price">$5,555</div></div>
                <div className="tt" role="listitem"><div className="tt-name">Title</div><div className="tt-price">$11,111</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-alt">
        <div className="section wrap" id="video-series">
          <span className="sec-label">Content Sponsorship</span>
          <h2 className="sec-title">Vegans Explore <em>the Globe.</em></h2>
          <p className="sec-sub">A travel video series taking the plant-based lifestyle global. Sponsors are woven into the story - not inserted as an ad break.</p>
          <div className="cards-grid" role="list">
            <div className="card" role="listitem">
              <div className="card-icon" aria-hidden="true">&#127909;</div>
              <div className="card-title">Episode Sponsorship</div>
              <div className="card-desc">Your brand featured as a sponsor of a full episode. Verbal mention, on-screen placement, and social promotion tied to the episode release.</div>
            </div>
            <div className="card" role="listitem">
              <div className="card-icon" aria-hidden="true">&#127780;</div>
              <div className="card-title">Product Placement</div>
              <div className="card-desc">Your product woven into the travel narrative. Part of the story, not a cut to a sponsor message. The most authentic form of brand integration in the series.</div>
            </div>
            <div className="card" role="listitem">
              <div className="card-icon" aria-hidden="true">&#127942;</div>
              <div className="card-title">Presented By</div>
              <div className="card-desc">&quot;Vegans Explore the Globe, presented by [Your Brand].&quot; Title partnership on the full series. Coming in at the pilot stage gets you the most favorable terms.</div>
            </div>
            <div className="card" role="listitem">
              <div className="card-icon" aria-hidden="true">&#128250;</div>
              <div className="card-title">Streaming Pathway</div>
              <div className="card-desc">The series has a real pathway to broadcast or streaming distribution. A title sponsor who comes in now is part of that story if it lands.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section wrap" id="activations">
        <span className="sec-label">Event Activations</span>
        <h2 className="sec-title">Games, Competitions <em>&amp; Giveaways.</em></h2>
        <p className="sec-sub">At every Vegans Explore event there is an opportunity for brands to create real interactions with real people.</p>
        <div className="cards-grid" role="list">
          <div className="card" role="listitem">
            <div className="card-icon" aria-hidden="true">&#127881;</div>
            <div className="card-title">Giveaway Sponsor</div>
            <div className="card-desc">Provide product for giveaway at a VE Night, the World Vegan EXPO, or the Dolphin Tailgate. Your brand introduced to the crowd at the moment of maximum energy.</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-icon" aria-hidden="true">&#127942;</div>
            <div className="card-title">Competition Sponsor</div>
            <div className="card-desc">Sponsor a game or competition at a live event. Logo placement, MC shoutout, winner photo with your brand. High recall, low friction, very shareable.</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-icon" aria-hidden="true">&#128247;</div>
            <div className="card-title">Photo Moment</div>
            <div className="card-desc">Branded photo opportunity at events. Attendees share organically and your brand travels beyond the venue with every post.</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-icon" aria-hidden="true">&#127358;</div>
            <div className="card-title">Sampling Station</div>
            <div className="card-desc">Put your product directly in the hands of attendees. Food, beverage, beauty, or lifestyle - if it is vegan, we will sample it at every in-person event.</div>
          </div>
        </div>
      </div>

      <div className="section-alt">
        <div className="section wrap" id="services">
          <span className="sec-label">Done For You</span>
          <h2 className="sec-title"><em>Marketing Services.</em></h2>
          <p className="sec-sub">Through our partnership with LESARUSS AI, we offer full-service marketing production for brands that want more than exposure. We build the assets.</p>
          <div className="services-grid" role="list">
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#128421;</span>Web and Mobile Design</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#127916;</span>Video Production</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#127860;</span>Food Photography</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#127381;</span>Event Coverage</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#128218;</span>Book Publishing</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#127897;</span>Podcast Production</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#128241;</span>Social Media Management</div>
            <div className="svc" role="listitem"><span className="svc-icon" aria-hidden="true">&#127979;</span>Booth Management</div>
          </div>
        </div>
      </div>

      <div className="section wrap" id="alacarte">
        <span className="sec-label">Add-ons</span>
        <h2 className="sec-title"><em>A La Carte.</em></h2>
        <p className="sec-sub">Add any of these to an existing sponsorship or purchase standalone.</p>
        <div className="alacarte" role="list">
          <div className="alac" role="listitem">
            <span className="alac-icon" aria-hidden="true">&#127780;</span>
            <div>
              <div className="alac-name">Video Series Product Placement</div>
              <div className="alac-desc">Your product written into an episode of Vegans Explore the Globe. Integrated naturally into the travel story, not a cut to a sponsor message. Custom pricing by episode and integration depth.</div>
            </div>
            <span className="alac-tag">Custom</span>
          </div>
          <div className="alac" role="listitem">
            <span className="alac-icon" aria-hidden="true">&#128226;</span>
            <div>
              <div className="alac-name">Podcast Network Mention</div>
              <div className="alac-desc">Host-read mention across one or more shows in the VE network. 77K+ combined downloads across SoFlo Vegans, Vegans Explore, and Pre-Vegans. 30-second or 60-second spot options.</div>
            </div>
            <span className="alac-tag">Custom</span>
          </div>
          <div className="alac" role="listitem">
            <span className="alac-icon" aria-hidden="true">&#128240;</span>
            <div>
              <div className="alac-name">Co-Branded Press Release</div>
              <div className="alac-desc">Distributed to 1M+ media contacts via Semrush AI PR. Announce a launch, event sponsorship, or community milestone under the Vegans Explore brand umbrella.</div>
            </div>
            <span className="alac-tag">Custom</span>
          </div>
        </div>
      </div>

      <section className="cta-section" aria-labelledby="cta-h">
        <h2 id="cta-h">Ready to <em>Get In?</em></h2>
        <p>Whether you are starting at $111/month or building a full campaign, the conversation starts with an email.</p>
        <a href="mailto:contact@vegansexplore.com?subject=Partnership Inquiry" className="btn-white">Contact Us to Partner</a>
      </section>

      <footer role="contentinfo">
        <div className="footer-logo">Vegans Explore</div>
        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="https://vegansexplore.com/guides/ve-guides-roster-v1">Guides</a>
          <a href="https://vegansexplore.com/guides/ve-discuss">Discuss</a>
          <a href="https://vegansexplore.com/directory">Directory</a>
          <a href="https://vegansexplore.com/passport">Passport</a>
          <a href="#">Privacy</a>
        </nav>
        <span className="footer-copy">2026 Vegans Explore</span>
      </footer>
    </>
  )
}
