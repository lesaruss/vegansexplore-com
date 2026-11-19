-- 2026-11-19: Sean locked the plain-words Community Manager agreement ("lock it"). It becomes the signable version 1 (the 2026-11-13 text
-- was never sent or signed and is replaced). The position keeps its slug (links), with the new title and summary. Safe to run twice.
update public.ve_positions set
  title = 'Community Manager',
  summary = 'Invite your people, sign people up at events in your city, and answer comments and messages on @vegansexplore.',
  posting = posting_draft,
  agreement_version = agreement_draft_version,
  agreement_text = agreement_draft_text,
  agreement_sha256 = encode(sha256(convert_to(agreement_draft_text, 'UTF8')), 'hex'),
  posting_draft = null, agreement_draft_version = null, agreement_draft_text = null,
  updated_at = now()
where slug = 'social-media-manager-instagram' and agreement_draft_text is not null;
