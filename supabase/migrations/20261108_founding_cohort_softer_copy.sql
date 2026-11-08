-- ve-outreach-buckets (Sean, 2026-11-08): "It's very strong... people who just happen to be in my mailing list, who aren't vegan... may have just
-- done one time thing... It sounds like we don't know who the person is... tone the language down... And if I do know them, I will add a note."
-- The campaign emails no longer claim history with the reader; a personal version (Make it personal) adds what Sean knows. All are drafts, unlocked.
update ve_outreach_campaign_emails set subject = 'Vegans Explore is opening soon', body = $b$Hi {first_name},

You're getting this because our paths have crossed at some point. I wanted you to hear it from me before we open to everyone.

Vegans Explore is a free place to find Vegan restaurants, events and people in your city, with Guides on food, travel and more. We're opening it to a small group first, and you're welcome to be part of it.

If you have a few minutes:

1. Join free. A short survey, about two minutes, and you start with 250 points. Anyone who joins before midnight Eastern on January 1, 2027 is a Founding Member.

2. Take the Welcome Guide. Liz shows you around: the Directory, your city, events, the Guides and how points work.

3. Tell us what you think. There's a Feedback button on every page.

Start here: {link}

No pressure either way. If it's not for you, the link at the bottom takes you off this list.

Thank you,
Sean$b$, locked_at = null
where campaign_slug = 'founding-cohort-1-2026-11' and step = 1;

update ve_outreach_campaign_emails set body = $b$Hi {first_name},

Thank you for taking a look at Vegans Explore this week.

With ThanksLiving two weeks out, we just opened the Holiday Guide. Theo walks you through it: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to sanctuaries and rescues.

Take a look, and share it with anyone planning their table:
{link}

If you haven't yet, joining takes about two minutes. And if you notice anything, the Feedback button on every page comes straight to me.

Thank you,
Sean$b$, locked_at = null
where campaign_slug = 'founding-cohort-1-wed-clicked' and step = 1;

update ve_outreach_campaign_emails set body = $b$Hi {first_name},

I wrote to you a few days ago about Vegans Explore. Whether or not you've had time to look, here is something you can use right now.

The Holiday Guide is open: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to sanctuaries and rescues this season. ThanksLiving is Thursday, November 26.

{link}

Joining is free, a two-minute survey, and anyone who joins before midnight Eastern on January 1, 2027 is a Founding Member.

Thank you,
Sean$b$, locked_at = null
where campaign_slug = 'founding-cohort-1-wed-opened' and step = 1;

update ve_outreach_campaign_emails set body = $b$Hi {first_name},

ThanksLiving is Thursday, November 26, and we just opened a free Holiday Guide for it: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to sanctuaries and rescues.

Here it is:
{link}

If you'd like to look around the rest of Vegans Explore, joining is free, a two-minute survey, and the Welcome Guide shows you around. Anyone who joins before midnight Eastern on January 1, 2027 is a Founding Member.

Thank you,
Sean$b$, locked_at = null
where campaign_slug = 'founding-cohort-1-wed-quiet' and step = 1;
