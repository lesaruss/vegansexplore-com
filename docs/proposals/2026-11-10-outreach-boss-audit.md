# BOSS analysis: HQ Outreach (playbook `ve-outreach-buckets`)

Sean, 2026-11-10: "What does approved mean? Does it mean that it was sent? I don't understand what I'm looking at... It's very overwhelming...
I need you to figure out how we can fix this so that way I look forward to using it."

## Step 0: The challenge

Outreach answers the wrong questions first. To learn "what needs me, what is going out, how is it doing", Sean has to open a tab, read an
explanation paragraph, pick a door tile, open a campaign, then a group. Found on 2026-11-10:

- **28 sends on one flat level**: launches, one-off replies (Brion Hurley x2), master copies (Creator invitation), 6 welcome drafts, 6
  orientation drafts, ThanksLiving, cohort 1 and its 3 follow-ups. Nothing separates "a campaign" from "a piece of one".
- **Two things are both called a campaign**: the program (Holiday Guide launch) and each group inside it.
- **Status words that need a glossary**: Draft, Ready to approve, Approved, Scheduled, Sending, Paused, Done, Finished, Pending, In
  sequence, "Everyone has had their emails". "Approved" reads as "sent" (it means "allowed to send").
- **Explanation walls**: every view opens with a paragraph; there is also a tour button, an Advanced footer to three retired views (Cities,
  People lists, Send days) and door tiles (Restaurant, People, No longer open, plus Inactive ones) that are filters, not destinations.
- **Nothing tells Sean what needs him**: on 2026-11-10 Founding cohort 1 was paused with 9 people still waiting, and the Holiday Guide
  launch had 5 unlocked emails; neither was surfaced.

Root cause: the page was built engine-first (doors, lists, sends) instead of decision-first (what do I do next, what happened).

## B: Best practice

1. **Visibility of system status** (Nielsen Norman Group, 10 Usability Heuristics, #1, Jakob Nielsen 1994, nngroup.com/articles/ten-usability-heuristics):
   a system should always tell people what is going on through timely feedback. Applied: one status per campaign, in plain words, with
   "N of M sent" and a progress bar, never a word that must be looked up.
2. **Match between the system and the real world** (same heuristic set, #2): use the user's words, not the system's. Email tools converge on
   the same lifecycle: Mailchimp's campaign statuses are Draft, Scheduled, Sending, Sent, Paused (Mailchimp Help, "Campaign status
   definitions"); Klaviyo uses Draft, Scheduled, Sending, Sent. Nobody uses "Approved" as a state; approving is the action (Schedule/Start).
3. **Progressive disclosure** (NN/g, Jakob Nielsen 2006, nngroup.com/articles/progressive-disclosure): show the few things most people need
   first, move the rest one step away. Applied: the home shows only live and ready campaigns; finished, drafts and replies sit behind
   "show more"; doors become a filter on People, not a level of navigation.
4. **Hick's law** (Hick 1952; Hyman 1953): decision time grows with the number of choices. Applied: one primary action per card (Review and
   start, Resume, Open), two top tabs (Campaigns, People), no Advanced links.
5. **An inbox of what needs you**: Linear's Inbox, GitHub's notifications and HubSpot's Tasks queue put "what needs your action" above
   everything else so the tool is opened for a reason. Applied: a "Needs you" row at the top (ready to start, paused, bounced over 5%,
   replies to answer), empty means you are done.

## O: Outcome (how we know it works)

- From the Outreach home, Sean can answer three questions in under 10 seconds without reading a paragraph: what needs me, what is going
  out today, how is each campaign doing.
- Six status words, the same everywhere: Draft, Ready to start, Scheduled, Sending, Paused, Finished. "Approved" never appears.
- From the home to starting a ready campaign: one click to its page, one button to start (after read, look, test).
- Zero explanation paragraphs on the home; the tag legend is one line.
- The real test: over the next two weeks Sean starts, pauses and checks campaigns himself without asking Logan what something means, and
  says he is fine using it. Any "what does this mean" is logged as an iteration.

## S: System

Design Thinking, short loop: the mock (this file's picture, real campaigns and numbers) goes to Sean; on his OK, build the home, the status
words and the campaign page's "Review and start" checklist; Sean uses it for the Holiday Guide launch; fix what he trips on; repeat up to
three rounds this week.

## S: Simplify (the standard)

- **Home**: Needs you, Going out today, Campaigns (live and ready first, cards with N of M sent, opened, clicked, joined, one button),
  "show N more" for finished, drafts and replies. Two tabs: Campaigns and People (the Roster, with Bounced, Unsubscribed and Do not contact
  as filters).
- **One campaign = one program.** Its groups, steps (the lookbook) and schedule live inside it. One-off replies and master copies are not
  campaigns on the home.
- **Starting a campaign** is a checklist on its page: 1 Read the email, 2 Look at the page, 3 Send yourself a test, 4 Start. Start = lock +
  approve every group in one press.
- **Six tags, one line of meaning** under the campaigns. Never Approved.
- Retire from navigation: door tiles as a level, the Advanced footer (Cities, People lists, Send days), the explanation paragraphs, the tour.

## Iteration plan

Round 1 (today): Sean reviews the mock. Round 2: build home + tags + checklist, Sean starts the Holiday Guide launch with it. Round 3: fix
what he trips on, then make it the template for every brand's Outreach.

## Conclusion

Recommendation: rebuild the Outreach home decision-first as in the mock, with the six-word status lifecycle and a one-press Start. Confidence
high: every change is a standard pattern from email tools and NN/g heuristics, and nothing in the sending engine changes (it is a view and
wording change plus one "start all groups" action).
