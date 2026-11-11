-- Sean, 2026-11-11: "Go with your default" on Guide avatars. Safe to run twice (version guards).
update public.knowledge_records set version=2, updated_by='logan', updated_at=now(),
  change_summary='v2: Guide avatars decided (Sean, "Go with your default"): one LESARUSS-style profile avatar per Guide, scenes keep the recipe.',
  body = jsonb_set(body - 'open', '{guide_avatars}', '"Decided 2026-11-11 (Sean: \"Go with your default\"): Liz, Maya, Theo, Dani, Nori, River and Kai each get one LESARUSS-style avatar for their profile picture, the same on every brand; their scenes keep the locked Guide scene recipe; redrawn one Guide at a time as credits allow."'::jsonb)
where slug='canon-ve-brand-kit-imagery' and status='active' and version=1;
update public.knowledge_records set version=2, updated_by='logan', updated_at=now(),
  change_summary='v2: the Guides get LESARUSS-style profile avatars too (Sean, 2026-11-11).',
  body = jsonb_set(body, '{guides}', '"The Guides (Liz, Maya, Theo, Dani, Nori, River, Kai) each get one LESARUSS-style profile avatar, the same on every brand; their scenes stay in the Guide scene recipe (Sean, 2026-11-11)."'::jsonb)
where slug='canon-lesaruss-universal-profiles' and status='active' and version=1;
