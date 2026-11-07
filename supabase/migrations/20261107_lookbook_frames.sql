-- branddesk-production-wing: the lookbook standard (LOCKED by Sean 2026-11-07, canon-ve-guide-tour-standard v4 lookbook_format_v4).
-- Each shot is a frame: the words heard over it (line), whether its picture is in hand (readiness, kept apart from the
-- decision in status), and an orange note when the script names something not built yet (flag).
alter table ve_video_shots add column if not exists line text;
alter table ve_video_shots add column if not exists readiness text not null default 'ready';
alter table ve_video_shots add column if not exists flag text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='ve_video_shots_readiness_check') then
    alter table ve_video_shots add constraint ve_video_shots_readiness_check check (readiness in ('ready','recapture','mock','broll'));
  end if;
end $$;
-- The Depot tour's frames: window within each chapter (seconds), line, readiness and flag. Splits inside a chapter are by sentence.
with t as (select id from ve_video_tours where slug='depot'),
v(n,o,line,af,at,rd,flag) as (values
 (1,1,'Welcome to the Depot. I''m V.',0.0,2.4,'ready',null),
 (1,2,'This is where we run Vegans Explore behind the scenes.',2.4,5.48,'ready',null),
 (2,1,null,0,7.8,'ready',null),
 (3,1,null,0,7.7,'ready',null),
 (4,1,'Directory keeps our listings right.',0,2.3,'ready',null),
 (4,2,'Review what''s on hold, approve events, handle claims and badges, and set up restaurant visits.',2.3,8.22,'ready',null),
 (5,1,null,0,7.18,'ready','Not built yet: Logos as its own tool (category pills, sort by views). Today it lives in Directory review > Logos.'),
 (6,1,null,0,7.3,'ready',null),
 (7,1,null,0,11.02,'ready',null),
 (7,2,null,0,11.02,'broll',null),
 (8,1,null,0,10.44,'ready','Not built yet: See every page (each page of a Guide at a glance, as a visitor or a member sees it).'),
 (9,1,'Ideas is where every idea lands.',0,2.5,'ready',null),
 (9,2,'Type it or say it, add screenshots, links or files, and Logan reads it back to you before anything gets built. Feedback from the site lands here too.',2.5,12.72,'ready',null),
 (9,3,null,2.5,12.72,'broll',null),
 (10,1,null,0,7.82,'ready',null),
 (11,1,null,0,6.18,'ready',null),
 (12,1,null,0,14.34,'ready','Not built yet: tap V on a page and she summarizes it (Ask V on the Depot).'),
 (13,1,'That''s the tour. I''ll step aside so you can see everything. Tap me on any page, or ask me anything.',0,6.9,'ready','Not built yet: Ask V on every Depot page.'),
 (13,2,'If I can''t answer, I''ll take it to the team.',6.9,9.42,'ready',null))
update ve_video_shots s set line=coalesce(v.line,(select c.line from ve_video_chapters c where c.tour_id=s.tour_id and c.n=s.chapter_n)),
  audio_from=v.af, audio_to=v.at, readiness=v.rd, flag=v.flag
from v, t where s.tour_id=t.id and s.chapter_n=v.n and s.ord=v.o;
