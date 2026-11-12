-- Sean, 2026-11-11: "hold off on sending any more emails. I want to pause all campaigns until we lock this in. Because then those people can
-- actually land on a website that reflects the new brand." Every started outreach campaign is paused (paused_at), except the always-on
-- Welcome for people who join on their own. Resume each from HQ Outreach when Sean says so.
update ve_outreach_campaigns set paused_at = now(),
  note = coalesce(note || ' ', '') || 'Paused 2026-11-11 (Sean: "hold off on sending any more emails... pause all campaigns until we lock this in" the new brand).'
where approved_at is not null and paused_at is null and status <> 'finished' and slug <> 'welcome-community';
