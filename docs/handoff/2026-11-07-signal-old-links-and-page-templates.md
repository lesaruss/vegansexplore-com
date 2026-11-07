# signal: old links and page templates fixed (2026-11-06 to 2026-11-07)

Playbook `signal` (Signal, our Information Systems Division). Logan, build mode.

## Done and live

**Old links (main e3043f8, 2026-11-06).** Sean: "let's fix it so that there's no one goes to a broken site, and if they do go to a page
that's not redirected somewhere, let's redirect them to the Explorer page... monitor that over time."
- Every old WordPress address (`/project/*`, `/project_category/*`, `/category/*`, `/showcase/*`, `/author/*`, `/tag/*`, `/regions/*`, old
  article slugs) and the 404 page go to `api/gone.js`, which asks `signal_resolve_old(path)`: the hand map `signal_redirects` first, then a
  listing (301), then a Pulse article (301), else the Explorer intake `/passport?from=old-link&was=<path>` (302, "That page has moved").
- Every visit is a `signal_old_hits` row (bots flagged). Migration `20261106_signal_old_links.sql`.
- soflovegans.com lands on `/communities/south-florida` (through `/network/soflo-vegans-podcast`, with UTM). The Cloudflare rule could point
  straight at the hub (Sean's option, it works as is).

**Page templates (main 23eb436, 2026-11-07).** Sean: "let's go ahead and fix the page templates."
- `public/ve-seo-text.js`: one title and description rule for the server and the page (titles fit 65, descriptions 70 to 155).
  Used by `api/listing.js`, `directory/listing.html`, `api/event.js`, `api/pulse-article.js`.
- `api/chapter.js` (new; `/communities/<slug>` rewrites to it): each chapter's own title, description, canonical, share picture (its banner)
  and an `<h1>` the banner replaces. Reads `public/ve-hubs.js` in a vm, so a new chapter needs nothing.
- Listings send their name as an `<h1>` in the HTML; the Pulse post view inside a listing is an `<h2>`; Explorer photos have alt text.
- Main pages (Directory, Events, Media, Pulse, Guides, Communities, Contact, Explore, Policies, Welcome, Passport) got canonical, share tags
  and a seed `<h1 class="vcb-ssr">` inside the banner's box; home, Passport, Policies, Pulse, Welcome and nine Guides got shorter descriptions.
  `api/event.js` strips the Events page's own canonical, share tags and seed heading before adding the event's.
- Scanner (`ve-signal`, deployed from 61681c9, source sha256 ebab07f0): counts headings and pictures only outside `<script>`, `<style>` and comments.

**Rescan, 2026-11-07 8:36 to 8:59 AM Eastern**: 3,325 pages, about 7,000 flags down to 7 on 3 pages. Driven by a temporary pg_cron job
`signal-rescan-tmp` (150 a minute) that removed itself.

## Waiting on Sean

- **Merge 20309bf** (branch `claude/friendly-thompson-jw101h`): listings whose slug has an underscore (Hippeas `hippeas_snacks`, UnchainedTV
  `unchained_tv`) were stripped to a missing slug and still served "Loading...". One-character fix in `api/listing.js`, checked locally.
- `/business` still says canonical `/passport` in the served HTML (the page corrects it after load). Left as is.

## Next (A to Z)

1. The Signal tab in BrandDesk (HQ): issues as Fixed / Needs you / Watching, the top line, old-link visits from `signal_old_hits`.
2. Search Console: remove the two old 2024 sitemaps, resubmit the live one (the reader is read-only: write access or Sean's two clicks).
3. Lock or drop `zz_playbook_close_20261106` (no RLS).
4. Monitoring: Sentinel as Signal's engine; uptime and errors, crons and pg_net, page speed, costs. No tag manager today.
5. Copy to the other brands and clients (a `signal_sites` row each).

## How to rescan

`ve-signal` `scan_start` then `scan_batch` (limit 150) until done; admin token from `lesaruss_secrets`, called with `net.http_post`.
`ve-function-deploy` needs the full 40-character sha.
