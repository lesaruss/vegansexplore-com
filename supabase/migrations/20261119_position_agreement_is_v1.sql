-- 2026-11-19: Sean: "Would this actually be version 2? Because she never received version 1." Nobody was ever invited to or signed the
-- 2026-11-13 agreement (0 people, 0 signed), so the plain-words draft is version 1. When Sean locks it, the promote step replaces the unsent
-- 2026-11-13 text. Safe to run twice.
update public.ve_positions
   set agreement_draft_version = 'v1',
       agreement_draft_text = replace(agreement_draft_text, 'Community Manager agreement, version 2', 'Community Manager agreement, version 1'),
       updated_at = now()
 where slug = 'social-media-manager-instagram';
