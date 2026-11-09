-- ve-daily-pulse-discussion: Pulse subscribers in the Depot (Sean, 2026-11-09). Applied live through the connector.
-- Where and when each person asked for the Pulse, for Depot > Pulse subscribers (ve-pulse-subscribe 'list').
alter table ve_tasters add column if not exists pulse_source text, add column if not exists pulse_requested_at timestamptz;
update ve_tasters set pulse_requested_at = coalesce(pulse_requested_at, created_at) where source = 'pulse-subscribe';
