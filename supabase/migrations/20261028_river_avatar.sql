-- River's Guide account wears his new look (Sean picked it 2026-10-28), served from the site after the merge.
update members set avatar_url = 'https://vegansexplore.com/public/guides/art/river-square.webp'
where email = 'river.guide@vegansexplore.com' and avatar_url like '%7f42e72b-fb79-4ee2-8ead-08a2709889ed%';
