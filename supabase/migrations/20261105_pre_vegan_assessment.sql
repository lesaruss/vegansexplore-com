-- vegans-explore-initiative-business-certification: B2, the Pre-Vegan pre-assessment (2026-11-05, Logan).
-- The free, private pre-assessment from Standard V1.2 ("How it runs", step 1): self-reported, a private readiness score.
-- Built on the existing survey engine (ve_surveys, ve_survey_questions, ve_survey_answers).
--   * active = false: nobody can open or answer it until the Pre-Vegan Restaurant Guide (B3) is built and Sean turns it on.
--   * admits = false: finishing it never makes anyone a member.
--   * every question pays 0 points: points never buy a gate, and the readiness score is not points.
-- The scoring lives apart from the questions (ve_preveg_rules), so a respondent never sees the weights.
-- The score is advice for the business only. It is never a certification decision, never public, never shown to a Verifier as a pass.
-- Logan's defaults (Sean's to change): 0, 1 or 2 per answer; "not sure" scores 0 with advice; "ready to apply" = no blocker and
-- every gate at 75% or more.

insert into ve_surveys (slug, guide_slug, title, intro, admits, active) values
('pre-vegan-assessment', null, 'Pre-Vegan readiness check',
 'A private check of how ready your plant-based dishes are for Pre-Vegan Certification. Only you see your score. It is not a certification and nothing you answer is published.',
 false, false)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, admits = false, active = false;

delete from ve_survey_questions where survey_slug = 'pre-vegan-assessment';
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
-- Who can apply
('pre-vegan-assessment','pv_license',1,'choice','Do you have a current business license and food permit at this location?',null,
 '[{"v":"yes","label":"Yes"},{"v":"no","label":"No"},{"v":"not_sure","label":"Not sure"}]',0,true),
('pre-vegan-assessment','pv_menu',2,'choice','Is your menu public, printed or online, where anyone can read it?',null,
 '[{"v":"yes","label":"Yes"},{"v":"no","label":"No"}]',0,true),
('pre-vegan-assessment','pv_dishes',3,'choice','How many plant-based dishes are on your menu?','Count named dishes only. Leave out sides, and count a dish offered several ways once.',
 '[{"v":"0","label":"None yet"},{"v":"1_2","label":"1 or 2"},{"v":"3_5","label":"3 to 5"},{"v":"6","label":"6 or more"}]',0,true),
('pre-vegan-assessment','pv_dish_names',4,'long','Which dishes would you put forward? List them as they appear on your menu.',null,null,0,false),
('pre-vegan-assessment','pv_city',5,'text','Which city is this location in?','The pilot starts in South Florida.',null,0,true),
-- G1 Ingredient evidence
('pre-vegan-assessment','pv_labels',6,'choice','For those dishes, could you show the label or spec sheet for every ingredient you buy?','A letter from your distributor alone is not enough.',
 '[{"v":"all","label":"Yes, every one"},{"v":"most","label":"Most of them"},{"v":"some","label":"Some of them"},{"v":"none","label":"Not yet"}]',0,true),
('pre-vegan-assessment','pv_subs',7,'choice','Have you read those labels all the way down to the sub-ingredients?','For example, what is inside the sauce, the bread or the seasoning blend.',
 '[{"v":"yes","label":"Yes"},{"v":"some","label":"Some of them"},{"v":"no","label":"Not yet"}]',0,true),
('pre-vegan-assessment','pv_banned',8,'multi','Do any of those dishes use any of these?','Tick all that apply.',
 '[{"v":"honey","label":"Honey"},{"v":"beeswax","label":"Beeswax"},{"v":"carmine","label":"Carmine (a red coloring)"},{"v":"shellac","label":"Shellac (a shiny glaze)"},{"v":"gelatin","label":"Gelatin"},{"v":"isinglass","label":"Isinglass (used in some beer and wine)"},{"v":"rennet","label":"Animal rennet (in some cheese)"},{"v":"none","label":"None of these"},{"v":"not_sure","label":"Not sure"}]',0,true),
('pre-vegan-assessment','pv_proof',9,'multi','Do any of those dishes use any of these?','These can be made with or without animal products, so each one needs proof from its maker. Tick all that apply.',
 '[{"v":"natural_flavors","label":"Natural flavors"},{"v":"wine","label":"Wine"},{"v":"beer","label":"Beer"},{"v":"vinegar","label":"Vinegar"},{"v":"vitamin_d3","label":"Vitamin D3"},{"v":"sugar","label":"Sugar"},{"v":"enzymes","label":"Enzymes"},{"v":"glycerin","label":"Glycerin"},{"v":"emulsifiers","label":"Emulsifiers"},{"v":"fermented","label":"Something fermented"},{"v":"none","label":"None of these"},{"v":"not_sure","label":"Not sure"}]',0,true),
('pre-vegan-assessment','pv_contains',10,'choice','Does any label for those dishes say "contains milk" or "contains egg"?','"May contain" is a different line; that one is allowed and disclosed.',
 '[{"v":"no","label":"No"},{"v":"yes","label":"Yes"},{"v":"not_sure","label":"Not sure"}]',0,true),
-- G2 Hidden in process
('pre-vegan-assessment','pv_bases',11,'multi','Which of these do those dishes use?','Tick all that apply.',
 '[{"v":"stock","label":"A stock or broth"},{"v":"dough","label":"A dough or bread"},{"v":"glaze","label":"A glaze or wash"},{"v":"pan_release","label":"Pan release or cooking spray"},{"v":"frying_oil","label":"Frying oil"},{"v":"shared_base","label":"A sauce or base used in other dishes"},{"v":"none","label":"None of these"}]',0,true),
('pre-vegan-assessment','pv_bases_known',12,'choice','For each of those, do you know exactly what is in it, by brand?',null,
 '[{"v":"yes","label":"Yes, every one"},{"v":"some","label":"Some of them"},{"v":"no","label":"Not yet"},{"v":"na","label":"We use none of them"}]',0,true),
-- G3 Protected path
('pre-vegan-assessment','pv_storage',13,'choice','Are the ingredients for those dishes stored in their own place, apart from meat, fish, dairy and eggs?',null,
 '[{"v":"yes","label":"Yes"},{"v":"partly","label":"Partly"},{"v":"no","label":"No"}]',0,true),
('pre-vegan-assessment','pv_tools',14,'choice','When you make them, do you use their own utensils and surfaces, or a clean separate pan or barrier?',null,
 '[{"v":"yes","label":"Yes, every time"},{"v":"partly","label":"Sometimes"},{"v":"no","label":"No"}]',0,true),
('pre-vegan-assessment','pv_fryer',15,'choice','If any of those dishes are fried, what fryer do you use?',null,
 '[{"v":"not_fried","label":"None of them are fried"},{"v":"dedicated","label":"A fryer that has only ever cooked plant-based food"},{"v":"shared","label":"A fryer we also use for meat, fish, cheese or egg"}]',0,true),
('pre-vegan-assessment','pv_water',16,'choice','If any are boiled or blanched, whose water is it?',null,
 '[{"v":"not_boiled","label":"None of them are boiled"},{"v":"separate","label":"Fresh water, used only for them"},{"v":"shared","label":"Water also used for meat, fish or eggs"}]',0,true),
('pre-vegan-assessment','pv_grill',17,'choice','If any are grilled or cooked on a griddle, which one?',null,
 '[{"v":"not_grilled","label":"None of them are grilled"},{"v":"dedicated","label":"One used only for them"},{"v":"cleaned","label":"A shared one, cleaned before each time"},{"v":"shared","label":"A shared one, not cleaned first"}]',0,true),
('pre-vegan-assessment','pv_oven',18,'choice','If any are baked or roasted, which oven?',null,
 '[{"v":"not_baked","label":"None of them are baked"},{"v":"separate","label":"One used only for them, or covered and on its own rack"},{"v":"shared","label":"A shared oven at the same time as animal products"}]',0,true),
-- G4 Accurate use
('pre-vegan-assessment','pv_channels',19,'multi','Where do those dishes appear?','Tick all that apply. Every one would need to show the certification correctly.',
 '[{"v":"printed","label":"A printed menu"},{"v":"website","label":"Our website"},{"v":"qr","label":"A QR menu"},{"v":"delivery","label":"Delivery apps"},{"v":"social","label":"Social media"}]',0,true),
('pre-vegan-assessment','pv_wording',20,'choice','Does any menu or app call those dishes, or your restaurant, "Vegan" today?',null,
 '[{"v":"no","label":"No"},{"v":"yes","label":"Yes"},{"v":"not_sure","label":"Not sure"}]',0,true),
-- G5 Staff
('pre-vegan-assessment','pv_manager',21,'choice','Is there one manager who would be responsible for these dishes?',null,
 '[{"v":"yes","label":"Yes"},{"v":"no","label":"Not yet"}]',0,true),
('pre-vegan-assessment','pv_training',22,'choice','Have the people who take orders and cook these dishes been trained on how they are made and kept apart?',null,
 '[{"v":"all","label":"Everyone"},{"v":"some","label":"Some of them"},{"v":"none","label":"Not yet"}]',0,true),
-- G6 Change approval
('pre-vegan-assessment','pv_runs_out',23,'choice','When an ingredient for one of these dishes runs out, what happens?',null,
 '[{"v":"list","label":"We only use brands from a list we keep"},{"v":"manager","label":"A manager decides what to use"},{"v":"any","label":"We use whatever is in stock"}]',0,true),
('pre-vegan-assessment','pv_subs_supplier',24,'choice','How often does your supplier send a different brand than you ordered?',null,
 '[{"v":"rarely","label":"Rarely or never"},{"v":"sometimes","label":"Sometimes"},{"v":"often","label":"Often"}]',0,true),
-- G7 Access
('pre-vegan-assessment','pv_access',25,'choice','Would you be open to a kitchen visit, an unannounced check once a year, and us reviewing your records?',null,
 '[{"v":"yes","label":"Yes"},{"v":"questions","label":"I have questions first"},{"v":"no","label":"No"}]',0,true),
-- G8 Records
('pre-vegan-assessment','pv_records',26,'choice','Do you keep the labels and invoices for what you buy?','Certification asks you to keep them for the year plus 5 years.',
 '[{"v":"yes","label":"Yes, kept and easy to find"},{"v":"some","label":"Some of them"},{"v":"no","label":"No"}]',0,true),
('pre-vegan-assessment','pv_notes',27,'long','Anything else we should know?',null,null,0,false);

-- How each answer scores. Private: read only by ve_preveg_readiness, never returned with the questions.
create table if not exists ve_preveg_rules (
  question_id text not null,
  gate text not null check (gate in ('eligibility','G1','G2','G3','G4','G5','G6','G7','G8')),
  value text not null,
  score smallint not null check (score between 0 and 2),
  blocker boolean not null default false,
  advice text,
  primary key (question_id, value)
);
alter table ve_preveg_rules enable row level security;

delete from ve_preveg_rules;
insert into ve_preveg_rules (question_id, gate, value, score, blocker, advice) values
('pv_license','eligibility','yes',2,false,null),
('pv_license','eligibility','no',0,true,'A current business license and food permit are needed before you can apply.'),
('pv_license','eligibility','not_sure',0,false,'Check that your business license and food permit are current for this address.'),
('pv_menu','eligibility','yes',2,false,null),
('pv_menu','eligibility','no',0,true,'Your menu needs to be public before you can apply.'),
('pv_dishes','eligibility','0',0,true,'You need at least 3 named plant-based dishes to apply.'),
('pv_dishes','eligibility','1_2',0,true,'You need at least 3 named plant-based dishes to apply, not counting sides.'),
('pv_dishes','eligibility','3_5',2,false,null),
('pv_dishes','eligibility','6',2,false,null),
('pv_labels','G1','all',2,false,null),
('pv_labels','G1','most',1,false,'Gather a label photo or spec sheet for every ingredient you buy for these dishes, by brand and product.'),
('pv_labels','G1','some',0,false,'Gather a label photo or spec sheet for every ingredient you buy for these dishes, by brand and product.'),
('pv_labels','G1','none',0,false,'Start a folder with a label photo or spec sheet for every ingredient you buy for these dishes.'),
('pv_subs','G1','yes',2,false,null),
('pv_subs','G1','some',1,false,'Read every label down to its sub-ingredients: what is inside each sauce, bread and blend.'),
('pv_subs','G1','no',0,false,'Read every label down to its sub-ingredients: what is inside each sauce, bread and blend.'),
('pv_banned','G1','none',2,false,null),
('pv_banned','G1','not_sure',0,false,'Check each label for honey, beeswax, carmine, shellac, gelatin, isinglass and animal rennet.'),
('pv_banned','G1','honey',0,true,'Honey is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','beeswax',0,true,'Beeswax is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','carmine',0,true,'Carmine is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','shellac',0,true,'Shellac is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','gelatin',0,true,'Gelatin is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','isinglass',0,true,'Isinglass is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_banned','G1','rennet',0,true,'Animal rennet is not allowed in a certified dish. Swap it out or leave that dish out.'),
('pv_proof','G1','none',2,false,null),
('pv_proof','G1','not_sure',0,false,'Check each label for natural flavors, wine, beer, vinegar, vitamin D3, sugar, enzymes, glycerin, emulsifiers and anything fermented.'),
('pv_proof','G1','natural_flavors',1,false,'Ask the maker of each natural flavor, in writing, whether it contains any animal product.'),
('pv_proof','G1','wine',1,false,'Ask the winery, in writing, whether the wine is fined with animal products.'),
('pv_proof','G1','beer',1,false,'Ask the brewery, in writing, whether the beer is fined with animal products.'),
('pv_proof','G1','vinegar',1,false,'Ask the maker of the vinegar, in writing, how it is made and clarified.'),
('pv_proof','G1','vitamin_d3',1,false,'Vitamin D3 is often from lanolin. Ask the maker, in writing, for its source.'),
('pv_proof','G1','sugar',1,false,'Some cane sugar is filtered with bone char. Ask the maker, in writing.'),
('pv_proof','G1','enzymes',1,false,'Ask the maker, in writing, where its enzymes come from.'),
('pv_proof','G1','glycerin',1,false,'Ask the maker, in writing, whether its glycerin is plant-based.'),
('pv_proof','G1','emulsifiers',1,false,'Ask the maker, in writing, whether its emulsifiers are plant-based.'),
('pv_proof','G1','fermented',1,false,'Ask the maker, in writing, what the ferment was grown on.'),
('pv_contains','G1','no',2,false,null),
('pv_contains','G1','yes',0,true,'An ingredient labeled "contains milk" or "contains egg" fails. Swap it before you apply.'),
('pv_contains','G1','not_sure',0,false,'Check each label for a "contains milk" or "contains egg" line.'),
('pv_bases','G2','none',2,false,null),
('pv_bases','G2','stock',1,false,'Trace the stock or broth by brand, or write down your own recipe.'),
('pv_bases','G2','dough',1,false,'Trace the dough or bread by brand, or write down your own recipe.'),
('pv_bases','G2','glaze',1,false,'Trace the glaze or wash; egg washes and butter glazes are common.'),
('pv_bases','G2','pan_release',1,false,'Check the pan release or spray label; some contain lecithin from egg or dairy.'),
('pv_bases','G2','frying_oil',1,false,'Trace the frying oil by brand, and see the fryer question.'),
('pv_bases','G2','shared_base',1,false,'Trace every shared sauce or base by brand or recipe, since it reaches other dishes too.'),
('pv_bases_known','G2','yes',2,false,null),
('pv_bases_known','G2','na',2,false,null),
('pv_bases_known','G2','some',1,false,'Write down, by brand, what goes into each stock, dough, glaze, spray, oil and shared base.'),
('pv_bases_known','G2','no',0,false,'Write down, by brand, what goes into each stock, dough, glaze, spray, oil and shared base.'),
('pv_storage','G3','yes',2,false,null),
('pv_storage','G3','partly',1,false,'Give these dishes'' ingredients their own shelf or bin, apart from animal products.'),
('pv_storage','G3','no',0,false,'Give these dishes'' ingredients their own shelf or bin, apart from animal products.'),
('pv_tools','G3','yes',2,false,null),
('pv_tools','G3','partly',1,false,'Set aside utensils and a surface for these dishes, or use a clean separate pan or barrier every time.'),
('pv_tools','G3','no',0,false,'Set aside utensils and a surface for these dishes, or use a clean separate pan or barrier every time.'),
('pv_fryer','G3','not_fried',2,false,null),
('pv_fryer','G3','dedicated',2,false,null),
('pv_fryer','G3','shared',0,true,'A shared fryer is never allowed. Use a dedicated fryer, or leave the fried dishes out.'),
('pv_water','G3','not_boiled',2,false,null),
('pv_water','G3','separate',2,false,null),
('pv_water','G3','shared',0,true,'Shared cooking water is never allowed. Use fresh water for these dishes.'),
('pv_grill','G3','not_grilled',2,false,null),
('pv_grill','G3','dedicated',2,false,null),
('pv_grill','G3','cleaned',1,false,'A shared grill must be cleaned before every use for these dishes, and your plan must say how.'),
('pv_grill','G3','shared',0,true,'A grill not cleaned after animal products is never allowed. Clean it first every time, or use a dedicated one.'),
('pv_oven','G3','not_baked',2,false,null),
('pv_oven','G3','separate',2,false,null),
('pv_oven','G3','shared',0,false,'A shared oven is allowed only under a written procedure we approve. Plan to bake these dishes separately or covered.'),
('pv_channels','G4','printed',2,false,null),
('pv_channels','G4','website',2,false,null),
('pv_channels','G4','qr',2,false,null),
('pv_channels','G4','delivery',1,false,'Delivery apps are often missed. List each one; the dish names must match there too.'),
('pv_channels','G4','social',2,false,null),
('pv_wording','G4','no',2,false,null),
('pv_wording','G4','yes',1,false,'Certification never says "Vegan" alone or "Vegan restaurant". Plan to change that wording on every channel.'),
('pv_wording','G4','not_sure',1,false,'Check how these dishes are named on every menu and app.'),
('pv_manager','G5','yes',2,false,null),
('pv_manager','G5','no',0,false,'Name one manager who is responsible for these dishes.'),
('pv_training','G5','all',2,false,null),
('pv_training','G5','some',1,false,'Train everyone who takes orders or cooks these dishes, and keep a list with the dates.'),
('pv_training','G5','none',0,false,'Train everyone who takes orders or cooks these dishes, and keep a list with the dates.'),
('pv_runs_out','G6','list',2,false,null),
('pv_runs_out','G6','manager',1,false,'Keep a written list of the brands allowed for each ingredient, and use only those.'),
('pv_runs_out','G6','any',0,false,'Keep a written list of the brands allowed for each ingredient. A swap off the list stops the certification at once.'),
('pv_subs_supplier','G6','rarely',2,false,null),
('pv_subs_supplier','G6','sometimes',1,false,'Check every delivery against your brand list before it reaches these dishes.'),
('pv_subs_supplier','G6','often',0,false,'Ask your supplier not to substitute on these items, and check every delivery against your brand list.'),
('pv_access','G7','yes',2,false,null),
('pv_access','G7','questions',1,false,'Our team can walk you through the visit and the yearly check before you apply.'),
('pv_access','G7','no',0,true,'Certification needs a kitchen visit, one unannounced check a year and a records review.'),
('pv_records','G8','yes',2,false,null),
('pv_records','G8','some',1,false,'Keep every receiving label and invoice for these dishes for the year plus 5 years, in one place.'),
('pv_records','G8','no',0,false,'Keep every receiving label and invoice for these dishes for the year plus 5 years, in one place.');

-- The private readiness view for one member. Self-reported advice, never a certification decision.
-- A multi answer scores as its worst ticked option; an unanswered scored question counts 0 of 2.
create or replace function ve_preveg_readiness(p_member uuid)
returns jsonb language sql stable security definer set search_path = public as $$
with q as (
  select distinct r.question_id, r.gate, sq.pos, sq.kind
  from ve_preveg_rules r join ve_survey_questions sq on sq.survey_slug = 'pre-vegan-assessment' and sq.id = r.question_id
), a as (
  select q.*, ans.value from q
  left join ve_survey_answers ans on ans.member_id = p_member and ans.survey_slug = 'pre-vegan-assessment' and ans.question_id = q.question_id
), picked as (
  select a.question_id, a.gate, a.pos, v.val
  from a cross join lateral (
    select x as val from jsonb_array_elements_text(case when jsonb_typeof(a.value) = 'array' then a.value else '[]'::jsonb end) x
    union all select a.value #>> '{}' where jsonb_typeof(a.value) = 'string'
  ) v
), hit as (
  select p.question_id, p.gate, p.pos, r.score, r.blocker, r.advice
  from picked p join ve_preveg_rules r on r.question_id = p.question_id and r.value = p.val
), per_q as (
  select a.question_id, a.gate, a.pos, a.value is not null as answered,
         coalesce((select min(h.score) from hit h where h.question_id = a.question_id), 0) as score
  from a
), gates as (
  select gate, sum(score) got, count(*) * 2 as max_score, round(100.0 * sum(score) / (count(*) * 2)) pct,
         count(*) filter (where not answered) unanswered
  from per_q group by gate
)
select jsonb_build_object(
  'answered', (select count(*) from per_q where answered),
  'questions', (select count(*) from per_q),
  'overall_pct', (select round(100.0 * sum(got) / sum(max_score)) from gates),
  'gates', (select jsonb_agg(jsonb_build_object('gate', gate, 'pct', pct, 'unanswered', unanswered) order by gate) from gates),
  'blockers', coalesce((select jsonb_agg(distinct advice) from hit where blocker), '[]'::jsonb),
  'next_steps', coalesce((select jsonb_agg(advice order by pos) from (select distinct on (advice) advice, pos from hit where not blocker and advice is not null order by advice, pos) s), '[]'::jsonb),
  'ready_to_apply', not exists (select 1 from hit where blocker)
                    and not exists (select 1 from per_q where not answered)
                    and not exists (select 1 from gates where pct < 75),
  'note', 'Self-reported and private. This is not a certification and is never published.'
);
$$;
revoke all on function ve_preveg_readiness(uuid) from public, anon, authenticated;
