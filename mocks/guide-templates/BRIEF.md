# Two Guide templates: Finder and Handbook (2026-11-16)

Sean, after the four-option panel: "Do we have 2 templates? And if so, we should probably build them out now... I like the search
template, but I would also like to see it with those adjustments." Panel result: D (Search first) won 4 of 5; the usability expert
warned search means nothing on topic Guides. So every Guide uses ONE frame and ONE of two bodies.

## The template classes (by what the visitor came to do)
| Class | Visitor came to | Guides |
|---|---|---|
| **Finder** | find a place, menu, event or product near them | Holiday, Airport, Stadium & Arena, Theme Park, Supermarket, Vegan Dairy |
| **Handbook** | learn something, part by part | Nutrition, Food Photographer, Vegan Events (hosting), Vegan Activism, Creator, Nonprofit, Welcome, Taste |
| Handbook, with progress | do steps toward a goal (certify, claim, get in) | Pre-Vegan Business, Pre-Vegan Restaurant, Vegan Restaurant |
A Finder may still have learn parts (Dairy: Swaps, Cookbook) and a Handbook may still list places (Nutrition: Experts); the class only
decides the FIRST screen of a part and the body pattern of that part. Class is set per part with `data-template="finder|handbook"`.

## The shared frame (identical in both mocks; copy it, do not redesign it)
1. Site nav (`/public/nav.js`) and footer (`/public/footer.js`), Mock strip (peach) naming the template.
2. Guide bar (Guides section pink): Guide name, "Free for everyone. Join free" (one line), and ONE way to move: a **Contents**
   button that opens A's Contents panel (`/mocks/guide-options/a/index.html`: numbered parts, each with its date or one-line purpose,
   Overview first, "You are here" on the current part; grid on desktop, list on phone; opens in place, pushes the page down, never a
   floating box that scrolls inside itself). Close it with the same button or Escape. The current part's name shows on the button.
3. Page head: eyebrow (date and days to go, or "Part N of M"), title, one line.
4. The Guide appears once: one row with the Guide's square picture (framed from the top, head never cut), the Guide's one line, and a
   quiet "Play" that plays only when pressed.
5. One orange action (`.k-btn.k-cta`) per view. Kit `/public/ve-kit.css`, 6px corners, ink outlines, solid offset shadows, stripe.
6. Full width; nothing scrolls inside its own box; no horizontal scroll at 390.

## Finder body (start from `/mocks/guide-options/d/index.html`, keep what works, add these)
- The search block (City or ZIP, Near me, Search = the one orange action).
- A one-sentence answer instead of "2 results": "Next Level Veggie Grill is cooking a Holiday Feast for pickup on December 26, 27,
  31 and January 1, at 19 locations. No New Year's Eve parties posted yet." (third person, true).
- **Answer chips from C as the filters**, in plain words: "Everything", "Hosting at home" (menus), "Going out" (events). Never show a
  filter with a 0 count as a dead end: an empty filter shows the honest empty state with "Add your event".
- **Pickup date chips from B** on the menu card, with the holiday's own day highlighted (Dec 31 pink).
- One list: menu cards and event cards together; shared Directory card shape; one card per chain ("19 locations").
- Closing line "That is everything posted for December 31 so far." then Coming rows and the business doorway (from the brief below).
- Phone (390 x 844): title, search, Search button AND the answer sentence above 760 px; the first card's top within the first
  screen if at all possible (shrink the head, not the type size).

## Handbook body (the Nutrition Guide, a real part)
- Read `/home/user/vegansexplore-com/guide-scripts/nutrition-guide.js` and `guides/nutrition-guide.html` for real content, its Guide,
  its parts and their lines. Use only true content from those files.
- Show the part **Nutrients** ("Eight nutrients, one at a time") as the view: head, the Guide row, then the part's pieces as rows
  (one row per nutrient: name, one-line why, "Read" link), a "Start here" orange action that opens the first piece, then at the
  bottom "Next part: Your plate" (a plain link, not a pager with numbers).
- Show the **progress variant** in the same file on a second view reached from the Contents panel or `?v=progress`: the same rows
  with a check / "Not yet" tag per part (illustrative, labelled Sample), and a "Your progress: 2 of 8" line. Say in the Mock strip it
  is the pattern for the business Guides.
- Phone: title, the Guide row's line and "Start here" above 760 px.

## Rules (hard)
No em-dashes. "Vegan" capitalized. Title case titles. Third person about businesses. `<html lang="en" data-kit-parent="welcome-guide">`,
`<meta name="robots" content="noindex,nofollow">`, a real `<title>`. Static HTML, inline CSS/JS, no new libraries. Real content only.
