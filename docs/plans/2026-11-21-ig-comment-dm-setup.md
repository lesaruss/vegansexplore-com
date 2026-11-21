# Comment-to-DM on @vegansexplore, built in-house (2026-11-21)

Sean: "Is there a way to automate that, like ManyChat, without using ManyChat?" ... "you can go ahead and build it."

## How it works
Someone comments a keyword (first: B12) on our post. Instagram sends the comment to `ve-ig-comments`. It sends that person one private
reply (Meta allows one per comment) with their own tracked `/go/ig-xxxxxxx` link, then replies publicly "Sent! Check your DMs". One DM per
person per keyword. Every comment is logged in `ve_ig_comment_events`; keywords live in `ve_ig_keywords` (a post-specific keyword beats a
general one). Built and tested 2026-11-21: webhook check, signature check, keyword match, status, connect guard. Nothing sends until connected.

## Sean's steps (Unified login; Meta no longer offers "Instagram login" on new apps, 2026-11-21)
1. developers.facebook.com, the Vegans Explore app (fix the display name in App settings, Basic: no stray quote mark).
2. Use cases, Customize, Instagram API, "API setup with Unified login". Step 1: Create new configuration, pick @vegansexplore.
   No redirect URL is needed (no login link; the token comes from the configuration).
3. Step 2, Generate access tokens: generate the token for @vegansexplore. Paste it in Key Room (`hq.lesaruss.ai/keys`), request
   "Instagram access token for @vegansexplore". It never expires.
4. App settings, Basic, App secret (Show): paste it in Key Room, request "Meta app secret". (Sean, 2026-11-21: Key Room, never Supabase.)
5. Step 3, Configure webhooks: Callback URL `https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments`, Verify token from
   Logan (`IG_WEBHOOK_VERIFY_TOKEN`). Verify and save; subscribe to `comments`.
6. Logan runs `discover` (stores the account ids, checks it is @vegansexplore) and tests with a comment from an account that has a role on the app.
7. Step 4, App Review: Advanced Access for instagram_basic, instagram_manage_comments, instagram_manage_messages; Meta may ask to Become a Tech
   Provider and business verification first. Logan prepares the screen recording. Until approved, the reels end with "link in bio".

## After approval
Logan tests with a real comment, then the reel ending switches to "Comment B12". New keywords (CHEESE, SOY, ...) are rows in `ve_ig_keywords`.
