-- The six local outlets are LESARUSS.ai's (Sean, 2026-10-30: "I'm not sure exactly why they're there. They might be... for Lasaris
-- AI"): made 2026-10-29 by a Google Places search for LESARUSS.ai (tenant ...0001, "News outlet in <city>"). They go back to being
-- LESARUSS.ai's only (the candidate tag hides them here). WLRN stays on both: it has had Susan Hargreaves on.
update public.listings set tags = array_append(tags, 'lesaruss-ai-directory-candidate')
where status = 'approved' and category = 'News Outlets' and not ('lesaruss-ai-directory-candidate' = any(tags))
  and slug in ('diario-las-amricas','las-olas-insider','miamis-community-newspapers','westside-gazette','wpec-cbs-12','wptv-tv-west-palm-beach');
