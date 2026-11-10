-- Primary and backup emails (Sean, 2026-11-10: "we don't use the backup unless the first one bounces"; personal Gmail over a business address
-- "because their business could be shut down"). A backup stays in its group as stopped ('backup email'), off the list and its counts; when the
-- primary bounces (email_suppressions, reason bounce or hard_bounce), its backups start waiting on their own.
create table if not exists public.ve_outreach_backup_emails (
  id uuid primary key default gen_random_uuid(),
  person_name text,
  primary_email text not null,
  backup_email text not null,
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  switched_at timestamptz,
  unique (primary_email, backup_email)
);
alter table public.ve_outreach_backup_emails enable row level security;

insert into ve_outreach_backup_emails (person_name, primary_email, backup_email, note, created_by)
select n, p, b, 'Sean, 2026-11-10, Holiday launch duplicates review', 'Sean' from (values
 ('Amy Elise','amyeliseamy@gmail.com','amy@therawveganlifecoach.com'),
 ('Arthur Malary','artspizzazz@gmail.com','info@whisperingoakkombucha.com'),
 ('Blaze Goldsmith','iraiselions@gmail.com','blazeint7@yahoo.com'),
 ('Brion Hurley','brionhurley@gmail.com','brion@biz-pi.com'),
 ('Candice Gorman','opalpresence@gmail.com','purepotential@candicegorman.com'),
 ('Carla Joseph','c.josephmsn@gmail.com','mcleenterprise@gmail.com'),
 ('Carlos Salinas','cmsalinas.casuso@gmail.com','s0lr4k@icloud.com'),
 ('Clay Daly','cwdaly@gmail.com','clavel_daly@yahoo.com'),
 ('Darlene Giol','darlenemgiol@gmail.com','thepeacetomypuzzle@gmail.com'),
 ('Dr. Mari Mitrani','mari@dr-mari.com','mari@organicell.com'),
 ('Elvera Yusupov','connectpaws@gmail.com','elle-e@att.net'),
 ('Enrique Orozco','kikefunky9@yahoo.com','vegan@perrology.com'),
 ('Erieka Brown','eriekab@yahoo.com','royalbeadsboutique@gmail.com'),
 ('Gabriela Perez','perezgaby1217@gmail.com','greenflowerbomb@gmail.com'),
 ('Gail Naas','gailanaas@gmail.com','glnnns@aol.com'),
 ('Ibrahim Sebai','ibrahimsebai1@gmail.com','sebaillc@outlook.com'),
 ('Jolene Jackson','joleneannjackson@gmail.com','jolene312@aol.com'),
 ('Joy Lehman','joy.m.lehman@gmail.com','jlehman@mondaycampaigns.org'),
 ('Julie Weiss','jewelsweiss@yahoo.com','shortclown423@aol.com'),
 ('Kelly Mcintyre','kellymcintyre117@gmail.com','moonorchd@aol.com'),
 ('Liah Williams','events@hodofoods.com','liah@hodofoods.com'),
 ('Lydia Palmeri','lydia@choicecontact.com','lydia@vegworldmag.com'),
 ('Marc Evitt','ho2herbs@gmail.com','fatfighter@bellsouth.net'),
 ('Marc Evitt','ho2herbs@gmail.com','healingherbs@junglelifeherbs.com'),
 ('Maria Chapman','lisachap07@gmail.com','lisachap5@me.com'),
 ('Marla Gross','vegangirlie@gmail.com','mar2587@bellsouth.net'),
 ('Mateo Lopez','mateolopez55@gmail.com','mateolopez55@hotmail.com'),
 ('Melanie Chin','melanie12384@gmail.com','melanie_849@hotmail.com'),
 ('Michael Naranjo','mnaranjo1010@gmail.com','naranjofinancial@gmail.com'),
 ('Paige Parsons Roache','paigepr@msn.com','paige@unchainedtv.com'),
 ('Rachael Roth','rachfreia@gmail.com','info@heysugarmama.com'),
 ('Rachel Atis','atis.rachel005@gmail.com','vanasia678@gmail.com'),
 ('Renae Patterson','renaelprlp@aol.com','rpatterson@unifiedcm.com'),
 ('Resha Godis','morantkaresha@gmail.com','samresha@yahoo.com'),
 ('Robert Ruderman','kidnyce@gmail.com','robert@humanewildlifeconsulting.com'),
 ('Sandy Pukel','sandy@holisticholidayatsea.com','oakfeed1@aol.com'),
 ('Scott Stone','dscottstone@gmail.com','filmguy2018@gmail.com'),
 ('Sheri Franzblau','sherifranzblau1@gmail.com','sherifranzblau1@aol.com'),
 ('Sinclaire Dickinson','sincdickinson@gmail.com','sincdickinson@verizon.net'),
 ('Susana Fuertes','susanafuertes87@gmail.com','livekindlyevents@gmail.com'),
 ('Tani Demain','tdemain2017@gmail.com','tanidemain@aol.com'),
 ('Tatiana Toruno','tatiana.toruno8@gmail.com','tati1786@aim.com'),
 ('Terry Zembowsky','tzembowsky@gmail.com','tzembowsky@aol.com'),
 ('Terry Zembowsky','tzembowsky@gmail.com','mooseketeer@aol.com'),
 ('Tim Canova','timo8818@gmail.com','tim@timcanova.com'),
 ('Juan Gonzalez','juanfgonzalez3@aol.com','juanandreschinoto@hotmail.com'),
 ('Linda Gordon','veganfreeze@yahoo.com','cmunk8@aol.com'),
 ('Linda Gordon','veganfreeze@yahoo.com','felina7654@aol.com'),
 ('Nancy Thomas','seasidemoon13@gmail.com','nztlmt@yahoo.com'),
 ('Samantha Jones','elitebroward@gmail.com','samantha.jones.dc@gmail.com')
) v(n, p, b)
on conflict (primary_email, backup_email) do nothing;

-- Close any open review on these people (Sean had moved some there only because of a duplicate).
update ve_outreach_review r set resolved_at = now(), resolved_by = 'Sean', resolution = 'put_back'
where r.resolved_at is null and r.campaign_slug like 'holiday-launch-%'
  and lower(r.person_key) in (select primary_email from ve_outreach_backup_emails union select backup_email from ve_outreach_backup_emails);

-- Primaries wait; backups stop as 'backup email'.
update ve_outreach_campaign_members set send_status = 'waiting', stop_reason = null
where campaign_slug like 'holiday-launch-%' and removed_at is null and coalesce(step,0) = 0
  and lower(person_key) in (select primary_email from ve_outreach_backup_emails) and stop_reason in ('in review','backup email');
update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'backup email'
where campaign_slug like 'holiday-launch-%' and removed_at is null and coalesce(step,0) = 0
  and lower(person_key) in (select backup_email from ve_outreach_backup_emails);

-- Out: Sean's own three addresses and an Apple private relay address (Patricia Buraschi keeps her Gmail, no backup).
update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'not sent: our own address'
where campaign_slug like 'holiday-launch-%' and removed_at is null and lower(person_key) in ('compassiondeck@gmail.com','lesaruss@gmail.com','srussell@soflovegans.com');
update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'not sent: Apple private relay, Sean'
where campaign_slug like 'holiday-launch-%' and removed_at is null and lower(person_key) = '6dc8hcqsx4@privaterelay.appleid.com';

-- Sandy Pukel gets his own personal email from Sean (Sean: "isolate him and send him his own"); held out of the group until Sean approves it.
update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'held out of this batch'
where campaign_slug like 'holiday-launch-%' and removed_at is null and lower(person_key) = 'sandy@holisticholidayatsea.com';

-- A primary that bounces brings its backups in.
create or replace function public.ve_backup_on_bounce() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.active and new.reason in ('bounce','hard_bounce') then
    update ve_outreach_campaign_members m set send_status = 'waiting', stop_reason = null
    where m.removed_at is null and coalesce(m.step,0) = 0 and m.stop_reason = 'backup email'
      and lower(m.person_key) in (select backup_email from ve_outreach_backup_emails where primary_email = lower(new.email));
    update ve_outreach_backup_emails set switched_at = now() where primary_email = lower(new.email) and switched_at is null;
  end if;
  return new;
end $$;
drop trigger if exists ve_backup_on_bounce on public.email_suppressions;
create trigger ve_backup_on_bounce after insert or update of active, reason on public.email_suppressions for each row execute function public.ve_backup_on_bounce();

-- Sean, 2026-11-10: "Is it possible that people are on... different mailing lists? I think I saw Bari Lyman twice." No address is in two launch
-- groups, but 12 Founding Cohort 1 people were in the launch under another address: those are held as backups of their cohort address.
-- soflovegans@gmail.com (ours) is out. "Juan" (first name only) is left for Sean.
insert into ve_outreach_backup_emails (person_name, primary_email, backup_email, note, created_by)
select n, p, b, 'Already in Founding Cohort 1 under their other address; held off the Holiday launch', 'Logan' from (values
 ('Aida Campbell','aidadestacampbell@gmail.com','miingini@gmail.com'),
 ('Ariel Levin','ariel@veganblockparty.com','ariel_styles@aol.com'),
 ('Bari Lyman','bari@meettomarry.com','info@meettomarry.com'),
 ('Emilia Lujan','ealujan11@gmail.com','emilia_lujan88@hotmail.com'),
 ('Erin Fontes','erin@fliff.com','efiefontes@gmail.com'),
 ('Giacomo Marchese','giacomo@veganproteins.com','veganproteins@mail.com'),
 ('Harold Lebovic','lebovic@me.com','lebovic@hotmail.com'),
 ('Jacque Tarlton','jacque@plantchics.com','jacquetarlton@gmail.com'),
 ('Jeffrey Tucker','jmtucker007@gmail.com','veganman@earthsavemiami.org'),
 ('Jenna Bardroff','organizers@solutionaryevents.com','jenna.bardroff@solutionaryspecies.org'),
 ('Karen Ellis-Ritter','kellisritter@icloud.com','kellisritter@compassionatefarming.org'),
 ('Mikaela Barnes','mikaelabarnes0@gmail.com','mikaelabarnes@gmail.com')
) v(n,p,b) on conflict (primary_email, backup_email) do nothing;
update ve_outreach_campaign_members set send_status='stopped', stop_reason='backup email'
where campaign_slug like 'holiday-launch-%' and removed_at is null and coalesce(step,0)=0
  and lower(person_key) in (select backup_email from ve_outreach_backup_emails where note like 'Already in Founding Cohort 1%');
update ve_outreach_campaign_members set removed_at=now(), send_status='stopped', stop_reason='not sent: our own address'
where campaign_slug like 'holiday-launch-%' and removed_at is null and lower(person_key)='soflovegans@gmail.com';
