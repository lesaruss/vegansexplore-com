-- Sean, 2026-11-10: "the first letter should always be capital in a title... with our strongest supporters, all lowercase... Sloppy."
-- Every campaign name's first word after the colon is capitalized. Applied 2026-11-10.
update ve_outreach_campaigns set name = regexp_replace(name, ':\s*([a-z])', ': ' || upper(substring(name from ':\s*([a-z])')))
where name ~ ':\s*[a-z]';
