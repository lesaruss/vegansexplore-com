-- ve-community-directory: confirm the 36 hidden Facebook pages (2026-11-08).
-- No active Community Manager exists, so the task is an online research bounty (the map-the-venues pattern):
-- campaign confirm-facebook, 6 bundle jobs of up to 6 pages, 60 points each, one person each, remote, until Nov 22.
-- A page is restored only after the team checks it; each restore is a ve_listing_edits row (field facebook,
-- meta.playbook ve-community-directory, meta.source the bounty submission). Idempotent: keyed on the campaign slug and each job title.
insert into ve_bounty_campaigns (slug, community_slug, kind, title, story, cover_url, due_at, status, proposed_by, decided_by, decided_at)
select 'confirm-facebook','south-florida','ongoing','Find their Facebook pages',
 'Some places in our Directory lost their Facebook link: the page moved to a new address, or it is gone. Find the right page for each one so members can follow them. Online, from anywhere.',
 null,'2026-11-23T04:59:00Z','open','aa000000-0000-4000-a000-000000000010','aa000000-0000-4000-a000-000000000010',now()
where not exists (select 1 from ve_bounty_campaigns where slug='confirm-facebook');

with c as (select id from ve_bounty_campaigns where slug='confirm-facebook'),
j(sort, title, parts) as (values
 (0,'Facebook pages: South Florida, part 1', array[
  '4 Rivers Smokehouse, Coral Springs FL (old link: facebook.com/4rsmokehouse)',
  'Amar, Delray Beach FL (old link: facebook.com/AmarDelray)',
  'BRGR Stop, Coconut Creek FL (old link: facebook.com/brgrstopftl)',
  'Falafel Gourmet, Coral Springs FL (old link: facebook.com/falafelgourmetcs)',
  'Gary Rack''s Farmhouse, Delray Beach FL (old link: facebook.com/farmhousekitchenboca)',
  'Honest Cuban by VCC, Miami FL, formerly Vegan Cuban Cuisine (old link: facebook.com/vegancubancuisine). Also: is @honestcuban on Instagram theirs?']),
 (1,'Facebook pages: South Florida, part 2', array[
  'Naomi''s Garden, South Beach FL (old link: facebook.com/naomismiami)',
  'Southernmost Pint Brewpub, Key West FL (old link: facebook.com/southernmostpintbrewpub)',
  'Treelion, Miami Gardens FL (old link: facebook.com/227050227307814)',
  'Ziree Thai Sushi, Delray Beach FL (old link: facebook.com/ziree-thai)',
  'The Local Restaurant, Naples FL (old link: facebook.com/thelocalnaples)',
  'Fam Kitchen, Sarasota FL (old link: facebook.com/fam''skitchen)']),
 (2,'Facebook pages: Florida and the Mid-Atlantic', array[
  'Taste of India, Melbourne FL (old link: facebook.com/taste-of-india-melbourne-119622032363)',
  'Mellow Mushroom, Jacksonville Beach FL: the Jacksonville Beach location''s page (old link: facebook.com/mellowjaxbeach)',
  'Frederick Social, Frederick MD (old link: facebook.com/fredericksocialcafe)',
  'Maggie''s Farm, Baltimore MD (old link: facebook.com/farmmaggies)',
  'Sweet Leaf, Arlington VA, one page for both locations (old link: facebook.com/sweetleafafe)',
  'Blue Moon Cafe, Shepherdstown WV (old link: facebook.com/bluemooncafe)']),
 (3,'Facebook pages: New York, Philadelphia and Southern California', array[
  'Bodhi Village, Queens NY (old link: facebook.com/bodai5908)',
  'Holy Burger, Bed-Stuy, Brooklyn NY (old link: facebook.com/holycownyc)',
  'Fitz on 4th, Philadelphia PA (old link: facebook.com/fitzon4th)',
  'Joy Cafe, Philadelphia PA (old link: facebook.com/63230752120)',
  'Higher Taste, Plant-Based, Long Beach CA (old link: facebook.com/highertasteplantbased)',
  'Tony''s Darts Away, Burbank CA (old link: facebook.com/tonysdartsaway)']),
 (4,'Facebook pages: Los Angeles and London', array[
  'Vromage, Los Angeles CA (old link: facebook.com/vromage-dairy-free-cheese-shop)',
  'Gracias Madre, West Hollywood CA (old link: facebook.com/graciasmadreweho)',
  'Cosy Club, Westfield Stratford City, London (old link: facebook.com/thecosyclubuk)',
  'Govinda''s, Soho Street, London (old link: facebook.com/govindaslondon)',
  'Jusu Brothers, Notting Hill, London (old link: facebook.com/jusubrotherslvk)',
  'Mali Vegan Thai, London (old link: facebook.com/mali-vegan-thai-103233072077703)']),
 (5,'Facebook pages: London and our media', array[
  'Sagar, London, one page for Covent Garden and Hammersmith (old link: facebook.com/sagarveg)',
  'Forks Over Knives, the film (old link: facebook.com/forksoverknives)',
  'Keep on Cookin'', the podcast by Dustin Harder (old link: facebook.com/keeponcookinbydustinharder)',
  'Plant Based Briefing, the podcast (old link: facebook.com/PlantBasedBriefing)'])
)
insert into ve_bounties (community_slug, kind, title, brief, deliverable, points, max_awards, slots, due_at, status, sort, campaign_id, parts, gig_kind, apply_mode, remote)
select 'south-florida','other', j.title,
 'Online research, from anywhere, signed in to Facebook. For each place below, search Facebook for it by name and city and find its own official page. Make sure it is theirs: the same address or city, the same logo or photos, or a link to the website on their Directory page. The old link no longer works, and the page has often moved to a new address (a number, or /pages/...). For each one send the page''s link and a screenshot of its top, or write "No page found" with what you searched. Nothing guessed: a fan page, a review site or another business with the same name does not count. We check every page before paying.',
 'For each place: its Facebook page link and a screenshot, or "No page found"',
 60, 1, 1, '2026-11-23T04:59:00Z', 'open', 100 + j.sort, c.id, j.parts, 'bounty', 'claim', true
from j, c
where not exists (select 1 from ve_bounties b where b.campaign_id = c.id and b.title = j.title);
