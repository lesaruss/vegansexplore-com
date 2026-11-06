# ve-podcast-studio: Episode 145 run sheet, Sean's voice, the Captivate time fix (Nov 6, 2026, Eastern)

Playbook `ve-podcast-studio`. Episode 145 (`ve_pod_episodes` 7d59c856-f226-4055-b5f0-50e43b0ea856), title **"Ballots, Marathons and Jane
Velez-Mitchell Unchained"**, airs **Sunday Nov 8, 7:00 AM Eastern** (`publish_at` 2026-11-08 12:00 UTC).

## Done this chat
- **Captivate time bug fixed** (HQ main 60573ed, production READY). Captivate stores an episode's `date` as wall time in the show's
  zone (America/New_York): Ep 144 went out 7:00 AM Eastern and Captivate holds `published_date` 2026-11-01T07:00:00Z; the show's
  `time_zone` is America/New_York, `default_time` 09:00. The button sent UTC (`12:00`), which would have aired 145 at noon.
  `captivate_schedule` now formats `date` in America/New_York (Intl). Read from Captivate through pg_net (auth, `/shows/<id>/episodes`,
  `/shows/<id>`), token never printed.
- **Run sheet restructured** (Sean): opening sound, Sean intro, **Kai "Coming up today"** (new spot, pos 25), **Dairy Guide commercial**
  (27), Kai top stories (opens "We're back."; "The reviewer's visit"), Liz Directory (ends "You'll hear Jane in her own words, right
  after this."), **Restaurant Guide commercial** (45), Jane clip, Dani, Nori, Maya Guides (now ends on the **Explorer Guide** at
  vegansexplore.com), **Nonprofit Guide commercial** (90), Sean outro, Kai's tag, closing sound.
- **Sean's intro and outro in his own voice** (Higgsfield `seed_audio`, element voice "Sean A. Russell" 7985695a-f508-49d6-b6e6-508d425b609b).
  Sean: "amazed... how real it sounds like me". Files `media/podcast/vep-weekly/2026-11-08/sean-intro-v3.mp3` (33.5 s) and `sean-outro-v4.mp3`
  (65.5 s), 44.1 kHz stereo 192 kbps, -16 LUFS, each checked word for word with el-media `stt`. The voice model left 16 s of dead air in the
  first intro take; pauses over 0.9 s are cut to about two beats (Sean: "take one beat away"). Outro v4: Jane's full name, the Explorer Guide
  at vegansexplore.com (spell "Vegans Explore dot com" in the prompt), "See you next time". Both on the run sheet as voiced.
- **Show notes drafted** (below), not yet saved to the episode (Sean reads first; the page locks them once on Captivate).
- **Newsroom idea logged** in `ve-social-studio` (record fc39a5d9): the podcast cut into daily shorts, Guides animated at a still studio desk,
  B-roll from clips, a YouTube version, Sen Saigon (VEP 62, multi-camera video) first, capture bounties. Not built.
- `ve-once-pod145` (signed upload links for this episode's folder only) is the 410 stub again.

## Waiting on Sean
- **Approve the six Guide scripts** in BrandDesk > Vegans Explore > Podcast > Episode 145 (Kai preview, Kai top stories, Liz, Dani, Nori,
  Maya). Each voices on approval. Nothing else is missing.

## Then Logan
1. Assemble the finished MP3 to match Ep 144 (`media/podcast/vep-weekly/2026-11-01/episode-v4.mp3`: 44.1 kHz stereo, 192 kbps, -16 LUFS,
   peaks -1.5 dB): run sheet order, short gaps, each Guide voice over its `bed_path` bed ducked under the voice (Maya and Kai's preview have
   no bed), Jane's clip after the Restaurant Guide commercial. Upload as `episode-final-v1.mp3` (the page's `final_start` / `final_done`, or a
   one-time signed-upload function as this chat did, then set `final_path`).
2. Save the show notes to `ve_pod_episodes.shownotes` once Sean OKs them.
3. Sean presses **Approve and schedule on Captivate**; confirm with `GET /shows/5f0184ac-771d-41be-9db2-49f08fc0b880/episodes/scheduled`
   that it reads 2026-11-08 07:00 (Captivate's wall time). If it refuses status Scheduled, find the value; a retry reuses the uploaded media.
4. Lower: React error 418 on the BrandDesk podcast page; the signed-in check as vegan@ before showing Sean.

## Show notes draft
<p>Your weekly Vegan news from the Vegans Explore Guides: D.C. and Denver ban foie gras, London's Vegan Michelin-starred restaurant, Rich Roll's New York City Marathon at 60, and Jane Velez-Mitchell in her own words on how UnchainedTV began.</p>

<h3>Top stories with Kai</h3>
<ul>
<li>Washington, D.C. and Denver vote to ban foie gras: <a href="https://sentientmedia.org/denver-and-d-c-have-voted-to-ban-foie-gras/">Sentient Media</a></li>
<li>Plates, England's only Vegan Michelin-starred restaurant: <a href="https://vegnews.com/plates-london-restaurant-review">VegNews</a></li>
</ul>

<h3>What's new in the Directory with Liz</h3>
<p>130 new listings went live this week at <a href="https://vegansexplore.com/directory">vegansexplore.com/directory</a>. This week's spotlight: <a href="https://vegansexplore.com/directory/unchained_tv">UnchainedTV</a>, the free Vegan streaming network founded by <a href="https://vegansexplore.com/directory/jane-velez-mitchell">Jane Velez-Mitchell</a>. Hear her full conversation with Sean on <a href="https://vegansexplore.com/pulse/jane-velez-mitchell-unchained-broadcast-animal-activism">Vegans Explore Podcast 43</a>.</p>

<h3>From the community with Dani</h3>
<ul>
<li>Rich Roll finishes the New York City Marathon at 60: <a href="https://plantbasednews.org/culture/sport/rich-roll-new-york-city-marathon/">Plant Based News</a></li>
<li>The Vegan Society of Aotearoa New Zealand names its first Vegan Impact Award recipients: <a href="https://vegconomist.com/fairs-events/nz-vegan-society-turns-awards-programme-products-to-people/">Vegconomist</a></li>
</ul>

<h3>Around the world with Nori</h3>
<ul>
<li>Burger King UK gives away 250,000 plant-based Royales for World Vegan Month: <a href="https://plantbasednews.org/lifestyle/food/burger-king-uk-plant-based-royales/">Plant Based News</a></li>
<li>De Nieuwe Melkboer wins Compassion in World Farming's first Plant Based Leadership Award: <a href="https://vegconomist.com/food-and-beverage/milk-and-dairy-alternatives/dutch-dairy-farm-turned-soy-yogurt-maker-wins-ciwfs-first-plant-based-leadership-award/">Vegconomist</a></li>
</ul>

<h3>Our Guides with Maya</h3>
<p>New here? Start with the <a href="https://vegansexplore.com/passport">Explorer Guide</a>, a quick tour of everything you can do with Vegans Explore. Every Guide is at <a href="https://vegansexplore.com/guides">vegansexplore.com/guides</a>.</p>

<p>Start here: <a href="https://vegansexplore.com/passport">the Explorer Guide</a>. Join before January 1, 2027 and you are a Founding Member for good.</p>

## How-tos learned
- **Captivate dates are show-local wall time**, with a misleading `Z`. Never send UTC.
- **Higgsfield voice clone**: `generate_audio` model `seed_audio`, `voice_type` element. It can leave long silences; run `silencedetect`, cut
  any pause over ~1 s, loudnorm to -16, then stt.
- **Uploading to vegan-media from the sandbox**: a one-time edge function that returns `createSignedUploadUrl` for one folder (key checked by
  sha256), PUT the file, then 410 stub.

## Commits
- HQ: 60573ed (main).
- vegansexplore-com: this doc, migration note `20261106_pod145_run_sheet_voice.sql`, CLAUDE.md line.
