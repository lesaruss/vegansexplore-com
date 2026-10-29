-- Nonprofit Partners: Susan Hargreaves's invitation goes to animalherokidsrock@gmail.com (Sean, 2026-10-29: "the most reliable...
-- typically when I email her, I use that Animal Hero Kids Rock one"). Updates the playbook, its records and the canon. Safe to run twice.

update briefings set content = replace(replace(replace(replace(replace(replace(content,
  $a$      <li class="chk-item pending"><span class="chk-box"></span><span>Which of Susan's four emails gets the invitation (default susanh@animalherokids.org, the organization's own domain).</span></li>
$a$, ''),
  $a$<summary>Sean <span class="grp-count">3</span></summary>$a$, $a$<summary>Sean <span class="grp-count">2</span></summary>$a$),
  $a$Pending <span class="count">13</span>$a$, $a$Pending <span class="count">12</span>$a$),
  $a$Completed <span class="count">3</span>$a$, $a$Completed <span class="count">4</span>$a$),
  $a$<summary>Concept <span class="grp-count">3</span></summary>$a$, $a$<summary>Concept <span class="grp-count">4</span></summary>$a$),
  $a$<span>Locked by Sean ("lock it", 2026-10-29).</span></li>$a$,
  $a$<span>Locked by Sean ("lock it", 2026-10-29).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Susan's invitation goes to animalherokidsrock@gmail.com, the address Sean uses and the most reliable (Sean, 2026-10-29).</span></li>$a$),
  updated_at = now()
where slug = 've-nonprofit-partners' and content not like '%animalherokidsrock@gmail.com%';

update briefings set content = replace(content,
  $a$<p>First invitation: Susan Hargreaves, founder of Animal Hero Kids (in the Directory as Be An Animal Hero, Nonprofits).</p>$a$,
  $a$<p>First invitation: Susan Hargreaves, founder of Animal Hero Kids (in the Directory as Be An Animal Hero, Nonprofits), sent to animalherokidsrock@gmail.com.</p>$a$)
where slug = 've-nonprofit-partners' and content not like '%Nonprofits), sent to animalherokidsrock%';

update briefings set content = replace(content, $a$      <h2>2026-10-29</h2>
$a$, $a$      <h2>2026-10-29</h2>
      <p><strong>Decision (Sean).</strong> Susan's invitation goes to animalherokidsrock@gmail.com: "the most reliable... Sometimes the Animal Hero Kid address ones have issues, or the mailbox are filled... typically when I email her, I use that Animal Hero Kids Rock one."</p>
$a$)
where slug = 've-nonprofit-partners' and content not like '%Decision (Sean).</strong> Susan%';

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-partners','vegans-explore','V','decision','text',
$b$Sean, 2026-10-29: Susan Hargreaves's invitation goes to animalherokidsrock@gmail.com, the address he uses for her and the most reliable ("Sometimes the Animal Hero Kid address ones have issues, or the mailbox are filled"). HQ also holds susanh@animalherokids.org, kind2all@bellsouth.net and heartwhispererfilm@gmail.com for her.$b$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-partners' and body like 'Sean, 2026-10-29: Susan Hargreaves%');

update knowledge_records set body = body || jsonb_build_object('first','Susan Hargreaves, Animal Hero Kids (listing be-an-animal-hero), invited at animalherokidsrock@gmail.com (Sean, 2026-10-29: the address he uses, the most reliable).'),
       updated_at = now()
where slug = 'canon-ve-nonprofit-partners' and body->>'first' not like '%animalherokidsrock%';
