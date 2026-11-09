# Nominate Someone and the nominee's interview (proposal, Sean 2026-11-09)

Mocks: `/mocks/nominate/` (the nomination), `/mocks/nominate/interview.html` (the nominee's path), `/mocks/nominate/interview.html#/featured`
(after a feature). Parent: the Explorer Guide (`passport.html?guide=welcome`), canon `canon-template-gate` v6. Kai hosts; her lines are drafts.

## The nominee's path (Sean: "the first page is the overview... then the interview... then nominate somebody... optional... confirmation...
set up their membership... then the welcome guide, the version for members")

1. **Overview**: Kai explains everything start to finish; the nomination quote with the nominator's voice; Kai's personal welcome video.
2. **The Interview**: eight questions, one a page (`#/interview/N`), record, dictate or type; a review page with the release, then Send.
3. **Nominate Someone**: optional, Who (name, email, what they do: Business owner, Content creator, Works for a nonprofit, Activist, pick any),
   Why them; Skip this on both steps.
4. **You're a Member**: Founding Member, Explorer and Nominee badges, 250 points.
5. **Set Up Your Account**: Continue with Apple, Continue with Google, or email and password; an optional photo for feature graphics;
   what they hear from us. Then the members' Welcome Guide.

## Kai's welcome video (draft for Sean; nothing recorded)

Sean: "Congratulations, Maria. You're getting this because you were nominated by your friend, Dana P., who thinks... And if Dana actually
recorded her voice, hear from Dana herself."

> Congratulations, {first name}! I'm Kai, from Vegans Explore. You're getting this because your friend {nominator} nominated you, and
> {nominator} thinks you deserve your flowers. Here's why, in their own words.

Then **the nominator's recording** plays. If they wrote it instead, Kai reads it: "{nominator} said: {their words}."

> People don't get nominated by accident. This is your chance to tell your story: a short interview with me, eight questions, about ten
> minutes. Your story could be featured on our podcast, on your city's page and in the Daily Pulse. Every nominee is considered, and we'll
> tell you either way. Whenever you're ready, press Start my interview.

How it is made for each nominee: the lines with a name are generated in Kai's voice (`cgSgspJ2msm6clMCkdW9`, "Veegan" in the text sent to the
voice) and checked word for word with `stt`; the closing paragraph is recorded once. The video is Kai's stills with a slow zoom, a new shot
about every 3 seconds (`canon-video-shot-pace`), with a quote card while the nominator speaks. **Sean's call**: approve this template once and
let names fill in per nominee (each still checked with stt), instead of approving every nominee's video.

## When someone is featured (Sean: "automatically set up to send them a message showing where they are listed... graphics... I've been
featured on Vegans Explore... that's how we can get sticky")

- Marking a nominee Featured in the Depot queue (with the places it is live: city hub card, episode, Pulse story) sends one email from an
  approved BrandDesk Outreach template: where they are listed, their graphics, a personal tracked `/go/` link, `{{unsubscribe_url}}` and
  `{{postal_address}}`. The nominator gets a short note with the same link.
- **Graphics**, made automatically from their photo (or a drawn card if none): a square (1080 x 1080) and a story (1080 x 1920), "I've been
  featured on Vegans Explore", Community Voices and the city, their name and credit, our logo on a solid plate. Download and Copy my link on
  their **You've Been Featured** page.
- The podcast gets the same kit later (Sean: "we'll talk about that later").

## Sign in with Apple on the website

The backend already verifies Apple tokens (`ve-auth` action `apple`, built for the app 2026-11-08). The website needs an Apple **Services ID**
for vegansexplore.com (Apple developer account, domain verified, return URL), that ID added to the `APPLE_AUDIENCES` secret, and Apple's JS
button in `ve-auth.js` beside Google, so every sign-in on the site gets it, not only this page.
