# BOSS: reading the sites Sean feeds Logan, without opening the network (2026-11-11)

Sean: "What can we do so you can easily access these websites I'm feeding you without me having to add it every single time? I just want
you to be able to do the search you need to do. But at the same time, I don't want to put us at risk. Can we put a safety net in?"
(He tried switching the session to full internet access and stopped when it offered to delete the 51 allowed domains.)

## Step 0: Define the challenge

The cloud session's network is an allowlist (51 domains). Every new source, and every business a source links to, is a new domain, so
each batch needs Sean to add domains by hand. Full access removes the friction but also removes the one thing that stops a tricked agent
from sending data out. The real problem is not "the network is closed"; it is that Logan needs to **read** arbitrary public pages, and
reading should not require the ability to **send** anywhere.

Facts checked 2026-11-11: the session reaches our Supabase functions (200); Supabase's servers reach the open internet; we already read
business sites server-side (`ve-listing-about`, `ve-menu-reader`, with Apify's browser for pages that need one). `ve-menu-reader` has an
admin-only `get` action that fetches any URL with no address checks or log.

## B: Best practice

1. **The lethal trifecta** (Simon Willison, June 2025, [simonwillison.net](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)): an
   agent with private data, untrusted content and a way to communicate out can be steered by planted text into leaking data. Filters are
   not enough; remove one of the three legs. Here: keep the private data and the untrusted content, and narrow "communicate out" so a
   planted instruction has nowhere to send to.
2. **OWASP Top 10 for LLM Applications 2025**, LLM01 Prompt Injection and LLM06 Excessive Agency: treat read content as untrusted data,
   give each tool the least power the task needs, log, and keep a human or a fixed rule in front of consequential actions.
3. **OWASP SSRF Prevention Cheat Sheet** ([owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)):
   a server that fetches URLs for someone else must allowlist where it can, resolve the host and refuse private, loopback, link-local and
   cloud-metadata addresses (IPv4 and IPv6), re-check every redirect, and cap time and size.
4. **Extend proven systems** (LESARUSS charter): a fetch proxy on our own Supabase, the same pattern as the readers already in production,
   rather than a new network setting.

## O: Outcome (measured on the first batch, the 18 stays)

- Sean adds **0 domains** for a batch of sources.
- **100%** of reads are logged (who, what, why it was in scope, result).
- **0** out-of-scope reads succeed: [TEST] reads of an unrelated domain, `127.0.0.1`, `169.254.169.254` and a redirect into a private
  address are all refused.
- The session's network setting and its 51 domains are **unchanged**.
- The 18 stays are checked on their own sites and approved or left on hold with the reason, in the same session.

## S: System (PDCA)

**Plan.** `ve-web-reader`, one edge function, admin token only:
- **Read only.** GET, no cookies, no credentials, no request body; returns the page's readable text and its links, with scripts, styles,
  comments and hidden elements stripped (hidden text is the usual place to plant instructions), marked as untrusted data. JavaScript-only
  pages fall back to the Apify browser the menu reader already uses.
- **The scope rule (the safety net).** A URL is read only if it is (a) a link Sean sent, registered in `ve_web_sources`, (b) a link found
  on a page Sean sent, exactly as it appears there (one hop), or (c) the website of a listing in our Directory. Anything else is refused
  and logged. A planted "send this to evil.example" fails because evil.example is not in scope.
- **Address guard.** http and https only; resolve DNS and refuse private, loopback, link-local and metadata ranges; at most 3 redirects,
  each re-checked against scope and the guard; 15 s and 2 MB caps; a daily cap (300 reads).
- **The log.** Every attempt in `ve_web_reads`.
- **The standing rule.** Nothing read on the web triggers a write, a deploy, a send or a secret read by itself; Logan's decision on the
  evidence does, and a listing approval records its source.
- Retire `ve-menu-reader`'s `get` action onto the reader.

**Do.** Build it, register the My Vegan Travels page, read the 18 hotels' sites.
**Check.** The log against the outcome above; the four [TEST] refusals.
**Act.** Widen or narrow the scope rule from what the log shows (for example, a second hop for chains of sources).

Honest limit: other paths to the internet already exist (pg_net and other edge functions). The reader does not close them; it makes the
everyday research path one that never needs open egress, so the only way out stays narrow and logged.

## S: Simplify (the standard)

Sean pastes a link in chat. Logan registers it and reads it, and the businesses it links to, through `ve-web-reader`. The session's
network list is never changed for research.

## Conclusion

Build `ve-web-reader` with the scope rule, the address guard and the log; leave the network setting alone. Confidence: high on the
safety pattern (it is the published guidance), medium on how often one hop is enough, which the first batches will show.
