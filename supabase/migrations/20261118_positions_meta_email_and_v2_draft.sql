-- 2026-11-18: KJ's start page (Sean: "give her the information, make sure she's on board... one of the next steps is put the email address
-- associated with your Meta account so that way we can give you partial access"). Feature first (Sean: "go with feature first";
-- docs/plans/2026-11-18-kj-access-panel.md): KJ works through Meta Business Suite partial access, makes the daily feature from @vegansexplore,
-- answers everyone who raises a hand, never starts a cold DM and never holds the account.
-- 1) Her Meta (Facebook) account email, the address Sean invites in Business Suite.
-- 2) The posting and agreement v2 as DRAFTS beside the live v1. v1 stays the signable agreement until Sean locks v2; then run the promote
--    step at the bottom (kept commented). Safe to run twice.

alter table ve_position_people add column if not exists meta_email text;
alter table ve_position_people add column if not exists meta_email_at timestamptz;

alter table ve_positions add column if not exists posting_draft text;
alter table ve_positions add column if not exists agreement_draft_version text;
alter table ve_positions add column if not exists agreement_draft_text text;

update ve_positions set
  posting_draft = 'Vegans Explore is inviting the Vegan world onto one platform, and Instagram is where most of it lives. As Social Media Manager (Instagram), you make one feature a day from @vegansexplore: a "Now on Vegans Explore" carousel and stories that celebrate up to 20 places in our Directory and tag them. When a place answers (a reply, a thank-you, a reshare or a comment), you answer for Vegans Explore with their own page link, and you log it in your console. You never message anyone cold and you never hold the account: you work through Meta Business Suite with access to posting, messages and comments only. Your own hours, about an hour on weekdays, and you are free to take other work. $125 for each 2-week period of work, paid through Stripe, with a one-month trial.',
  agreement_draft_version = 'v2',
  agreement_draft_text = $agr$Independent Contractor Agreement: Social Media Manager (Instagram), version 2

This agreement is between LESARUSS Inc., doing business as Vegans Explore ("Vegans Explore"), and you, the person signing below ("you").

1. You are an independent contractor. You are not an employee, partner or agent of Vegans Explore. You choose your own hours, your own place of work and your own phone or computer, and you are free to work for others. You receive no employee benefits, and you are responsible for your own taxes.

2. The work. Through the console Vegans Explore gives you, you: make one feature a day from the Vegans Explore Instagram account, a carousel and stories that show the places in that day's batch and tag them; answer, for Vegans Explore, everyone who responds (replies, thank-yous, reshares, comments and new followers), with the person's own link from the console; and mark each place in the console (Featured, Replied, Link sent, Can't reach). Comments on our posts are answered within a day. Each reply is written to the person; no copied mass messages.

3. Limits that protect the account. You post only the day's feature and its stories, made from the console's batch and caption, and only places that are really in them. You never start a new direct message from the Vegans Explore account or from your own account for this work; places that do not answer go to Vegans Explore's own list. You never edit or delete other posts, stories or highlights; never change the profile, username, password, email, phone, settings or security; never invite anyone else to the account; and never use automation, bots or third-party tools on it. You stop for at least 48 hours if Instagram warns about activity, and you tell Vegans Explore that day.

4. The fee. Vegans Explore pays you $125 for each 2-week period of work, through Stripe, on the payday the console shows. Periods run Monday to Sunday; payday is the Friday after a period ends. Your first days before a full period are paid at the same daily rate ($125 divided by 14) with your first full period, and your last period is paid the same way to your end date. A period's fee is paid for that period's work done through the console. You set up payouts with Stripe, including your W-9, before your first payday; Stripe holds your bank and tax details, not Vegans Explore.

5. Trial and ending. The first month is a trial. Either of us may end this agreement at any time with 7 days' written notice (an email is enough), or right away for a breach of sections 3, 6 or 7. You are paid through your end date.

6. Access. Vegans Explore gives you partial access to its Instagram account in Meta Business Suite (posting, messages and comments), using your own Meta login; no password is shared. Vegans Explore can see everything done with that access and may remove it at any time. You keep your own Meta account secure (two-factor authentication on), and you tell us within 24 hours if you think someone else has used your access.

7. Confidentiality and conduct. You keep private what you learn about Vegans Explore, its members, the businesses and people you contact, and its plans. You speak for Vegans Explore warmly, honestly and in its voice: "Vegan" with a capital V, never pushy, never promising anything Vegans Explore has not built, and a business that is not Vegan is described as offering plant-based (Pre-Vegan) options. You do not promote yourself or anyone else from the account.

8. Ownership. The posts, conversations, notes and records you make for Vegans Explore belong to Vegans Explore. You assign to Vegans Explore any rights you have in them.

9. When it ends. Your access is removed, and you return or delete anything of Vegans Explore's you hold. Sections 7 and 8 continue after the agreement ends.

10. General. Florida law governs this agreement. It is the whole agreement about this work; if a part cannot be enforced, the rest still applies. Signing electronically (your typed name and the checkbox) is the same as signing on paper, and a copy is emailed to you.$agr$,
  updated_at = now()
where slug = 'social-media-manager-instagram';

-- PROMOTE (run only after Sean locks v2; then the page shows v2 as the signable agreement):
-- update ve_positions set posting = posting_draft, agreement_version = agreement_draft_version, agreement_text = agreement_draft_text,
--   agreement_sha256 = encode(sha256(convert_to(agreement_draft_text, 'UTF8')), 'hex'),
--   summary = 'Feature the places in our Directory from @vegansexplore, and answer everyone who raises a hand.',
--   posting_draft = null, agreement_draft_version = null, agreement_draft_text = null, updated_at = now()
-- where slug = 'social-media-manager-instagram' and agreement_draft_text is not null;
