-- Nightly security sweep emergency (4 nights unanswered), fixed 2026-11-16: public.qa_render_blob was SECURITY DEFINER and executable by
-- anon, and it ignored its tok argument (it compared a fixed value), so anyone could read QA blobs written in the last 30 minutes.
-- Nothing in either repo calls it; its last row is 2026-11-12. Revoked, not dropped. Safe to run twice.
revoke execute on function public.qa_render_blob(text, text) from public, anon, authenticated;
comment on function public.qa_render_blob(text, text) is 'QA scratch reader. Locked 2026-11-16 (nightly sweep emergency, 4 nights): it ignored tok and compared a fixed value, so anyone could read blobs from the last 30 minutes. Service role only; nothing in either repo calls it.';
