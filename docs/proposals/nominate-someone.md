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

## The Vegans Explore you: a drawn portrait for everyone we feature (Sean, 2026-11-09)

"When we feature them, we animate them... a badge of honor... a Vegans Explore version of yourself that you can use in your profile, you
could use on social, but you'll be wearing a Vegans Explore t-shirt, so we can brand it... we won't really ask them, we'll just do it... we
ask for an updated photo of them that we could use for future publication."

- **The photo is part of joining**: Set Up Your Account asks for a clear, recent photo, with one release line: we may use it in features and,
  if featured, draw them in our style in a Vegans Explore tee; either comes down on request. No separate ask later (Sean: "we'll just do it").
- **On feature**, the portrait is drawn with the locked scene recipe: their photo as the first reference, the style scene second, mid shot,
  a warm wave, white background, a Vegans Explore tee (any color). Checked by eye against their photo before it goes out (a likeness that is
  off is worse than none). About 2 Higgsfield credits each.
- **Delivered** in the featured email and on You've Been Featured: Use as my profile picture (sets their member picture), Download, and
  "Not quite you? Tell us and we redraw it." It also goes on their share graphics in place of the photo.
- **Watch**: if enough people object, Sean changes course. Requests to redraw or remove are counted in the Depot queue so that is visible.

## The questions, after Sean's notes (2026-11-09; Kai's lines are drafts until approved and recorded)

| # | On the page | Kai says (question plus a little help) | Answer |
|---|---|---|---|
| 1 | Tell me who you are and what you do in your community. | Let's start easy. Tell me who you are, and what you do in your community. Your work, your passions, what people know you for. | Record, speak or write |
| 2 | Where do you live, and how long have you lived there? | Where do you live? South Florida, Central Florida, wherever home is. And how long have you lived there? | Two picks: area, years |
| 3 | What's your Vegan origin story? Take me back to the moment it started. | What's your Vegan origin story? Take me back to the moment it started. Maybe a documentary, a friend, a meal, or an animal you met. | Record, speak or write |
| 4 | What are you building or working on right now for the Vegan movement? | What are you building or working on right now for the Vegan movement? A business, an event, a page, a project. Big or small. | Record, speak or write |
| 5 | Who in your community has your back? Give them a shout-out. | Nobody does it alone. Who in your community has your back? Give them a shout-out. | Record, speak or write |
| 6 | Your favorite Vegan spots nearby, and why. Up to three. | What are your favorite Vegan spots nearby? Pick up to three, and tell me why you love each one. | Up to 3 places from the Directory, one recording each, locked after the third |
| 7 | What would you tell someone just starting out? | Someone listening is right where you once were. What would you tell someone just starting out? | Record, speak or write |
| 8 | What's next for you, and how can people support it? | Last one. What's next for you, and how can people support it? | Record, speak or write |

Recordings cap at 2 minutes and show the time left while recording. **Kai asks each question** from one picture of her hosting (the same
outfit on every question) with Play on it. Pressing Play is consent: after Save and next, the next question plays on its own; Pause takes
that back. Each line becomes a lip-synced clip (Kai's voice `cgSgspJ2msm6clMCkdW9`, Higgsfield `wan2_7`, one take each, about 30 credits a
clip, so about 240 for eight) once Sean approves the words. Talk to Kai stays in the rail for questions.
