-- ve-pathways / ve-door-guides: the locked Restaurant Guide emails (Sean, 2026-11-04, "locked")
-- replace the business-outreach Day 0, 4 and 10 as DRAFTS. Nothing sends until Sean approves a send day and a city is on.
-- Source: docs/proposals/door-guides-enrollment-copy.md section 1. Checked first: no city enabled, no commitment, nothing ever sent.
-- Old copy (status ready), kept here so it can be put back:
--  1 "We built a page for {business}": Hi {first_name}, I'm Sean, founder of Vegans Explore... Here is your listing: {link}{guide_line}{free_check} ... The first step is claiming your listing...
--  2 "Your front-row seat{in_city}": A quick follow-up. Businesses that join now get every day until January 1 on us...
--  3 "Last note from me": I won't keep filling your inbox. Your page stays up either way...
update ve_outreach_templates set status='draft', updated_at=now(), subject='A free Guide for {business}', body=$b$Hi {first_name},

Thank you for what {business} does for the Vegan movement.

I have spent years on the ground in this movement, eating at Vegan places, meeting the people behind them and recording their stories. Vegans Explore grew out of that. It is a home base for Vegan businesses and the people looking for them.

We built a page for {business}, and a free Guide for Vegan restaurants. It shows how your place looks to people searching right now, what you can do about it, and how to claim your page and make it yours.{free_check}

Your Guide: {link}

We launch on January 1, 2027. Anyone who joins before then is a Founding Member, and that stays on their profile for good. There are two ways in: $11, one time, or a short survey that tells us how to serve you. Either one helps us grow faster.

No pressure. Take a look when you have a minute.

Sean
Vegans Explore$b$ where program='business-outreach' and step=1;
update ve_outreach_templates set status='draft', updated_at=now(), subject='Your page is waiting, {first_name}', body=$b$Hi {first_name},

Quick follow-up. The Guide I sent for {business} takes a few minutes: your page, what people see when they search for you, and how to claim it.

{link}

As a member you can post jobs, join the community, see the campaigns and promotions as they open, and be among the first we reach out to when a Guide features a business.

Founding Member closes at midnight Eastern on January 1, 2027. After that the door is the same, but the Founding Member mark is not.

Sean$b$ where program='business-outreach' and step=2;
update ve_outreach_templates set status='draft', updated_at=now(), subject='Last note from me', body=$b$Hi {first_name},

This is my last note. Your Guide is here whenever you want it: {link}

If this is not for you, no hard feelings. Thank you for what you do for the movement either way.

Sean$b$ where program='business-outreach' and step=3;
