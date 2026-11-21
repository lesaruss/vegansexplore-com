# Comment-to-DM on @vegansexplore, built in-house (2026-11-21)

Sean: "Is there a way to automate that, like ManyChat, without using ManyChat?" ... "you can go ahead and build it."

## How it works
Someone comments a keyword (first: B12) on our post. Instagram sends the comment to `ve-ig-comments`. It sends that person one private
reply (Meta allows one per comment) with their own tracked `/go/ig-xxxxxxx` link, then replies publicly "Sent! Check your DMs". One DM per
person per keyword. Every comment is logged in `ve_ig_comment_events`; keywords live in `ve_ig_keywords` (a post-specific keyword beats a
general one). Built and tested 2026-11-21: webhook check, signature check, keyword match, status, connect guard. Nothing sends until connected.

## Sean's steps (about 10 minutes, once)
1. developers.facebook.com, My Apps, Create App. Use case: manage messaging and content on Instagram. Name: Vegans Explore. Connect the
   Vegans Explore business portfolio.
2. In the app: Instagram, API setup with Instagram login. Copy the Instagram app ID and Instagram app secret.
3. Supabase dashboard, project lesaruss-directory, Edge Functions, Secrets: add `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`.
4. Back in the app, Instagram login settings, Valid OAuth redirect URI:
   `https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments?action=callback`
5. Webhooks: Callback URL `https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments`, Verify token (Logan sends it in chat;
   it is `IG_WEBHOOK_VERIFY_TOKEN` in lesaruss_secrets). Verify and save, then subscribe to the field `comments`.
6. Open `https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments?action=connect`, log in as @vegansexplore, approve. The page
   says Connected. It refuses any other account.
7. App Review: request Advanced Access for instagram_business_basic, instagram_business_manage_comments, instagram_business_manage_messages
   (privacy policy: https://vegansexplore.com/privacy). Meta usually asks for business verification and a short screen recording; Logan
   prepares the recording. Until approved, it works only for people with a role on the app, so the reels end with "link in bio".

## After approval
Logan tests with a real comment, then the reel ending switches to "Comment B12". New keywords (CHEESE, SOY, ...) are rows in `ve_ig_keywords`.
