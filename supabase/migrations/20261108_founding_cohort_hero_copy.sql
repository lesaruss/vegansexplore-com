-- ve-outreach-buckets (Sean, 2026-11-08): keep them the hero; front-row seat; we've been in the community since 2016 and built this from it;
-- it only becomes what it's meant to be with their help; launch January 1, free to join with a survey. Supersedes 20261108_founding_cohort_softer_copy.sql (step 1).
update ve_outreach_campaign_emails set subject = 'A front-row seat, {first_name}', body = $b$Hi {first_name},

Wherever you are with Vegan living right now, every day, now and then, or just curious, something big is coming, and I want you to have a front-row seat.

Since 2016 we've been out in the community: the events, the podcasts, the restaurants and the people behind them. We took everything we learned and built Vegans Explore, one place to find Vegan restaurants, events, people and Guides in your city.

It officially launches January 1, 2027. But what it becomes depends on the people who shape it now, and that's where you come in. You get to be at the very beginning of something meant to reach millions of people.

Coming in now is free:

1. Take a short survey, about two minutes, and you're in, with 250 points. Join before midnight Eastern on January 1 and you're a Founding Member.

2. Walk through the Welcome Guide. Liz shows you around.

3. Tell us what you think. There's a Feedback button on every page, and what you tell us shapes what we build.

Start here: {link}

Thank you,
Sean$b$, locked_at = null
where campaign_slug = 'founding-cohort-1-2026-11' and step = 1;
