-- Sean, 2026-11-21: Veronica's last name is Menin, not Menon. Fixed on SoFlo 114's cards, in canon-ve-brand-kit-templates and the playbook;
-- her reel re-rendered as v8 (vegan-media media/podcast/spotlight/veronica-love-life/reel-v8.mp4), v7 with the name fixed.
update ve_pod_segments set script = replace(script,'Menon','Menin'), title = replace(title,'Menon','Menin'), note = replace(note,'Menon','Menin')
 where episode_id = '87c6333a-11b8-4459-8a68-c0ea19831ade' and (script ilike '%menon%' or title ilike '%menon%' or note ilike '%menon%');
update knowledge_records set body = replace(body::text,'Veronica Menon','Veronica Menin')::jsonb where slug = 'canon-ve-brand-kit-templates' and body::text ilike '%veronica menon%';
update playbook_records set body = replace(body,'Veronica Menon','Veronica Menin') where body ilike '%veronica menon%';
