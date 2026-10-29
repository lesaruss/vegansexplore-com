-- Nonprofit Partners built and proven (2026-10-29): the playbook's status and a record. Safe to run twice.
update briefings set status_summary = $s$Built and proven 2026-10-29. Invite an organization from Depot > People > Founding Members (Invite as: Nonprofit Partner); partners in Depot > People > Nonprofit Partners; the lead's Guide at /nonprofits/welcome. First invitation: Susan Hargreaves, Animal Hero Kids, at animalherokidsrock@gmail.com, waiting on the points Sean sets.$s$,
  status_summary_updated_at = now(), updated_at = now()
where slug = 've-nonprofit-partners';

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-partners','vegans-explore','Logan','edit','text',
$b$Built 2026-10-29 (Sean: "go"): ve_nonprofit_partners and its points, the organization's /r/<code> link (whole-word codes), commissions through ve_affiliate_earn (route 'partner', 20%), the 'nonprofit' invitation from Founding Members (Invite as) that comps the lead and starts the partnership, the Nonprofit Partner badge, the Nonprofit Partner Guide (/nonprofits/welcome), Depot > People > Nonprofit Partners, the Policies section, the Guides' facts and a saved answer. Proven end to end with a [TEST] organization and the QA account ($2.20 to the organization on one Passport, the lead's own standing untouched), then removed. Found and fixed: the organization search in ve-affiliate had always returned nothing (wrong column names).$b$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-partners' and body like 'Built 2026-10-29%');
