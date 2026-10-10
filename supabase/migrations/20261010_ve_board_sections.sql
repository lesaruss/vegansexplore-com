-- Community Board sections (Sean, 2026-10-10): "in each city, let's set the sections... a jobs
-- board... a classified... a Fosters Board, and then a Rescues Board." Every city's Board gets Jobs,
-- Classifieds, Fosters and Rescues beside the Daily Pulse and Requests & Offers. Each is a kind; in
-- those lanes the category is the post's type. Each lane opens on a pinned "How it works" post so
-- nobody walks into an empty board (ve-board shows it as from Vegans Explore). The Daily Pulse
-- autopilot now writes a local briefing for every city, not only South Florida.

alter table public.ve_board_posts drop constraint if exists ve_board_posts_kind_check;
alter table public.ve_board_posts add constraint ve_board_posts_kind_check
  check (kind in ('request', 'offer', 'topic', 'job', 'classified', 'foster', 'rescue'));

alter table public.ve_board_posts drop constraint if exists ve_board_posts_category_check;
alter table public.ve_board_posts add constraint ve_board_posts_category_check
  check (category in ('rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other', 'pulse',
    'hiring', 'seeking', 'for_sale', 'free', 'wanted', 'trade', 'foster_needed', 'foster_offered',
    'rescue_urgent', 'rescue_needed', 'rescue_update', 'guide'));

alter table public.ve_board_posts add column if not exists pinned boolean not null default false;
create index if not exists ve_board_posts_lane_idx on public.ve_board_posts (community_slug, kind, status, pinned desc, created_at desc);

-- Local Daily Pulse in every city.
update public.lesaruss_dispatch_settings
  set value = jsonb_set(value::jsonb, '{communities}',
    '["national","south-florida","central-florida","atlanta","dmv","new-york","philadelphia","los-angeles","london"]'::jsonb)::text
  where key = 'pulse_auto';

-- The pinned "How it works" posts, one per lane per city, held by the pulse_auto account.
with who as (
  select (value::jsonb ->> 'member_id')::uuid id from public.lesaruss_dispatch_settings where key = 'pulse_auto'
), cities(slug, name) as (values
  ('south-florida', 'South Florida'), ('central-florida', 'Central Florida'), ('atlanta', 'Atlanta'), ('dmv', 'DMV'),
  ('new-york', 'New York'), ('philadelphia', 'Philadelphia'), ('los-angeles', 'Los Angeles'), ('london', 'London')
), guides(kind, title, body) as (values
('request', 'How to use {city} Requests & Offers', $t$Welcome to Requests & Offers for {city}. This is where you ask your city for help, and where you offer what you can give.

How it works
1. Choose Post a request or offer, then pick A request (I need help) or An offer (I can help).
2. Pick a category: Transport, Food, Services, Volunteers or Other. Jobs, Classifieds, Fosters and Rescues each have their own board.
3. Give it a one-line title people can scan, then the details: what, where, and by when.
4. Add how to reach you if you like. Only signed-in members can see it.
5. When it's sorted, open your post and choose Mark resolved, so your city knows.

Good posts look like: a ride to the vet on Saturday, extra produce from your garden, two volunteers for a Sunday cleanup.

Anyone can read the board. Posting, replying and seeing contact details are for members (the $11 Founding Membership). If something looks wrong, open it and choose Report this post, and your Community Manager will take a look.

Questions about the board? Reply below.$t$),
('job', 'How to use the {city} Jobs board', $t$Welcome to Jobs for {city}: Vegan businesses hiring, and members looking for work.

How it works
1. Choose Post a job, then pick Hiring or Looking for work.
2. Title: the role and the place, for example: Line cook at a Vegan bakery, downtown. Looking for work? Lead with what you do: Pastry chef, open to full or part time.
3. Details: what the work is, the pay or rate, the hours, whether it's full time, part time or a gig, and how to apply.
4. Add how to reach you. Only signed-in members can see it.
5. Once the role is filled or you've found work, open your post and choose Mark filled.

Keep it real: say the pay, keep it to work that fits a Vegan life, and never ask anyone for money to apply. Unpaid help belongs in Requests & Offers under Volunteers.

Anyone can read the board. Posting, replying and seeing contact details are for members (the $11 Founding Membership). See something off? Open it and choose Report this post.

Questions about the board? Reply below.$t$),
('classified', 'How to use the {city} Classifieds', $t$Welcome to the {city} Classifieds: buy, sell, give away, swap and find what you need, from people in your city.

How it works
1. Choose Post a listing, then pick For sale, Free, Wanted or Trade.
2. Title: what it is and the price, for example: Vitamix 5200, $180. Or: Free moving boxes.
3. Details: the condition, the size, the pickup area, and when you're around.
4. Add how to reach you. Only signed-in members can see it.
5. Once it's gone, open your post and choose Mark gone.

House rules: Vegan goods only, so no leather, wool, silk, fur, down or animal-tested products. Meet in a public place, see the item before any money changes hands, and never pay a deposit to someone you haven't met. No animals here: they go on Fosters or Rescues.

Anyone can browse. Posting, replying and seeing contact details are for members (the $11 Founding Membership). Something look like a scam? Open it and choose Report this post.

Questions about the board? Reply below.$t$),
('foster', 'How to use the {city} Fosters board', $t$Welcome to Fosters for {city}: matching animals who need a temporary home with people who can give one.

How it works
1. Choose Post to Fosters, then pick Needs a foster or Can foster.
2. Needs a foster: who they are (species, how many, age), any medical or behavior needs, for how long, and what is covered (food, vet care, supplies).
3. Can foster: who you can take (dogs, cats, rabbits, birds, farmed animals), how many, for how long, and your space (a yard, other animals, kids).
4. Add how to reach you. Only signed-in members can see it.
5. Once they're placed, open your post and choose Mark placed, and tell your city how it went in a reply.

Rescues and shelters: post each animal or group on its own, so people can find them by search. Fosters: never pay a fee to foster. A real rescue covers the costs it promises.

Anyone can read the board. Posting, replying and seeing contact details are for members (the $11 Founding Membership). Worried about a post? Open it and choose Report this post, and your Community Manager will take a look.

Questions about the board? Reply below.$t$),
('rescue', 'How to use the {city} Rescues board', $t$Welcome to Rescues for {city}: animals who need to be pulled, picked up or saved, and the people who can help.

If an animal is hurt or in danger right now, call your local animal control or an emergency vet first, then post here.

How it works
1. Choose Post a rescue, then pick Urgent, Needs a rescue, or Update.
2. Title: who and where, for example: Six hens surrendered, need pickup by Friday.
3. Details: the animals, the area they are in (never a home address in public), the deadline, and the help you need: a pull, transport, a foster, vet costs or supplies.
4. Add how to reach you. Only signed-in members can see it.
5. Post an Update when there's news, and once they're safe, open your post and choose Mark rescued.

Need a foster after the rescue? Post on the Fosters board too. Never send money to someone you can't verify: ask for the rescue's name and check it.

Anyone can read the board. Posting, replying and seeing contact details are for members (the $11 Founding Membership). Worried about a post? Open it and choose Report this post.

Questions about the board? Reply below.$t$)
)
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select c.slug, who.id, g.kind, 'guide', replace(g.title, '{city}', c.name), replace(g.body, '{city}', c.name), 'open', true
from cities c cross join guides g cross join who
where who.id is not null
  and not exists (select 1 from public.ve_board_posts x where x.community_slug = c.slug and x.kind = g.kind and x.pinned);
