# ve-events-guide: every line people read for steps 3 to 9 of the membership rule (for Sean)

Canon `canon-ve-door-guides` v6 (`membership_rule_v6`). Nothing below is live. Approve, change or strike each part; Logan builds only what is approved.
Facts checked 2026-11-06 against the database: nobody has finished the Events, Restaurant or Creator intake (0 each), no Nonprofit survey exists (0),
3 creator applications sit in the old `ve_creator_applications` table. So changing any intake loses nobody's answers.

## Step 3. The four shared questions (was `shared-intake-questions.md`)

One correction to the earlier draft: its "Vegan options alongside other food" breaks the locked rule that a business that is not Vegan offers
plant-based (Pre-Vegan) options, never "Vegan options", in our own copy. Fixed below.

| Key | Question | Choices |
|---|---|---|
| `chapter` | Which Vegans Explore chapter are you in, or closest to? | South Florida, Central Florida, North Florida, Atlanta, Washington, D.C., Maryland, Virginia, Delaware, West Virginia, Philadelphia, New York, Los Angeles, London, Somewhere else |
| `org_name` | What is the name of your business, group or organization? | (short answer) |
| `org_link` | Your website or Instagram | (short answer) |
| `vegan_level` | How Vegan is what you run? | Everything is Vegan · Mostly Vegan · Plant-based options alongside other food · I am planning to make it more Vegan |

Stored values stay `all`, `mostly`, `friendly`, `notyet`, so Depot > Event sponsors keeps scoring them.

Which intake asks which:
- **Events**: all four (replaces "Where do you mostly host?", splits "name and a link", replaces "How Vegan are your events?").
- **Restaurant**: all four (adds chapter, name, link; replaces "How Vegan is your menu?").
- **Creator**: `chapter` only, added before "What city are you based in?". A creator is not an organization, their handles already cover the link, and
  "How long have you been Vegan?" is about them, not what they run.
- **Nonprofit**: `chapter`, `org_name`, `org_link` (not `vegan_level`: the Directory never rates how Vegan a nonprofit is).

The two lines a member reads:
- Above a filled-in question: "Filled in from what you told us before. Change it if it is different now."
- At the end: "You answered these before, so we filled them in:" then one button each, "Change: <the question>".

Every intake still totals 250; points move between that intake's own questions (Logan's split, no new wording).

## Step 4. The Nonprofit Guide's intake (moves onto the same survey system)

Today it is "Tell us about your organization", members only, 100 points, inside the Guide's Become a Partner tab. It becomes the Guide's intake,
free for anyone, 250 points, and finishing it opens the Nonprofit Guide (the same as Events, Restaurant and Creator).

1. What is your part in the organization? (I founded it or run it · I am on staff · I volunteer or sit on the board · Something else) **required**
2. `chapter` (shared) **required**
3. `org_name` (shared) **required**
4. `org_link` (shared)
5. What kind of organization is it? (Nonprofit · Rescue · Sanctuary · Something else) **required**
6. Where do you serve? (short answer)
7. What is hardest right now? (Raising money · Finding volunteers · Getting seen · Burnout · Running events · Something else) **required**
8. How do you raise money today? (Events · Monthly donors · Grants · Merchandise · Business partners · Peer-to-peer · Other)
9. Do you have a monthly giving program? (Yes · We are starting one · Not yet)
10. What would help most from Vegans Explore? (Being found in the Directory · Promoting our events · Business partners · Volunteers · Being on a podcast or in the Daily Pulse · Earning through our own link) **required**
11. Anything else we should know? (long answer)

Changed from today's form: "Ads" is dropped from question 10 (we have no ad offer for nonprofits to promise), and "Your role there" becomes a choice
so it can sit under the badge. The Guide's header box reads **Free with a short survey**, as Events, Restaurant and Creator do.

Creator is already on the system (16 questions, 250 points). Its three old applications stay in Depot > Ambassadors > Creators as they are.

## Step 5. Members see the intake before a business Guide opens

No new wording: a member who opens Events, Restaurant, Creator or Nonprofit without its intake sees the same "Take the short survey, free" gate a
visitor sees. One line on that gate for members (new):
- "You are a member, so this one is free. Answer a few questions about your <events / restaurant / work / organization> and it opens, with up to 250 more points."

## Step 6. Registered badges

Sean's words were "Registered creator, restaurant owner, event host, nonprofit". One problem: the Restaurant intake lets "I am part of the team"
finish it, and calling a server a "Registered restaurant owner" is not true. Logan's recommendation, the badge names the intake and the role sits under it:

| Badge | Small text under it (their answer) |
|---|---|
| Registered restaurant | I am the founder · I am an owner · I am part of the team · Something else |
| Registered event host | I host or organize events · I promote or produce events · I run a venue · I am a vendor or brand |
| Registered creator | their main platform, e.g. "Creator on Instagram" |
| Registered nonprofit | I founded it or run it · I am on staff · I volunteer or sit on the board |

Where it shows (Logan's default): the member's own dashboard, the member card the team sees, and their People profile when one is linked to them.
Never on a Directory listing (that is the claim's job).

## Step 7. The Explorer survey on the Welcome, and the prompt after the $11

On `/passport`, Enter the room's **Take the survey** opens the Explorer survey: 8 questions, 250 points, checked by a person before it admits (the
review gate the profile survey has today). The 31-question profile stays as the member's profile, paying per answer.

1. What brings you to Vegans Explore? (Finding places to eat · Meeting people · Events · Learning · Supporting the animals · My business or work) **required**
2. Where are you on your Vegan journey? (Vegan · Pre-Vegan, working toward it · Vegetarian · Just curious) **required**
3. `chapter` (shared) **required**
4. What do you want more of where you live? (Places to eat · Events · Groceries and products · People to meet · Ways to help animals) **required**
5. How do you want to hear from us? (The Daily Pulse by email · Instagram · I will check the site)
6. Do you run any of these? (A restaurant or food business · Events · A nonprofit, rescue or sanctuary · I make content · None of these) **required**
   (A pick shows a line on the thank-you screen pointing to that Guide's intake.)
7. In your own words: what would make Vegans Explore worth it for you? (long answer) **required**
8. Optional: a place, person or group we should add to the Directory (short answer)

Screens:
- Finished: "Thanks. A person on our team reads every one, usually within a day or two. We will email you when you are in."
- After the $11 (a card on the dashboard, not required): "You're in. Want 250 more points? Take the Explorer survey, or the survey for your business, events or work." Buttons: **Take the Explorer survey** · **Not now**

## Step 8. Claim emails point hosts to the event survey

- "We got your claim" email, after the Guide line, a new link: "It is free: <take the short event survey> and the Guide opens for you, with up to 250 points."
- The thank-you screen after a claim, one line under it: "While you wait: the event survey is free, opens the Vegan Events Guide and pays up to 250 points." with **Take the event survey**.
(The approval email already sends hosts with no account to the survey.)

## Step 9. Policies, the Guides' facts and saved answers

`/policies#membership`, replacing "The two ways in":
> **Becoming a member.** There are two ways in, and both give you the same membership. Take a survey: the short Explorer survey, or the survey for
> one of our business Guides (Restaurant, Events, Creator, Nonprofit), each worth up to 250 points. Or get your Passport for $11, one time, with
> 1,100 points. Either way before midnight Eastern on January 1, 2027 makes you a Founding Member. Our topic Guides (Dairy, Nutrition, Airport,
> Stadium & Arena, Theme Park, Supermarket) are $11 or 1,100 points for members. A business Guide opens when you finish its survey, members included,
> and each one finished adds a Registered badge to your profile and up to 250 points. A person on our team checks the Explorer survey before it admits you.

The Guides' facts (what Liz and the others know) and the saved answers "How do I become a member?", "Is it free?", "How do I get a Guide?" say the same
in one or two sentences each.
