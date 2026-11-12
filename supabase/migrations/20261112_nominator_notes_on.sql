-- ve-nominate-someone: the nominator note turned on (Sean, 2026-11-12: "approved, turn it on"; the wording as drafted). Safe to run twice.
update ve_outreach_campaign_emails set locked_at = now(), locked_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', updated_at = now()
 where campaign_slug = 'nominator-notes' and step = 1 and locked_at is null;
update ve_outreach_campaigns set status = 'active', approved_at = coalesce(approved_at, now()), approved_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  note = 'Sean, 2026-11-12: "approved, turn it on" (the wording as drafted). People are added only by Approve in Depot > Nominations.'
 where slug = 'nominator-notes';
