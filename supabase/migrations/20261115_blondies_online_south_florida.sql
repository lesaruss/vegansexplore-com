-- Blondies Vegan Bakery (added by hand 2026-11-15 as Online, catering and holiday menus only; the Boynton Beach cafe closed):
-- serves South Florida only, not every chapter; gets the logo already in our storage from its old listing; its holiday menu
-- tips (ThanksLiving, Hanukkah) point at this listing so an approved one shows on its page. Safe to run twice.
update listings set communities = array['south-florida'],
  logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/listings/blondies-vegan-bakery-cafe/logo-2026-11-10-b4d8db1e.jpg'
 where id = '07b302ae-697a-4255-8c3a-159ce31a9aae';
update ve_holiday_menu_tips set listing_id = '07b302ae-697a-4255-8c3a-159ce31a9aae'
 where id in ('28367479-ad2a-4be0-90c4-963e2d48772c', '3f819783-858b-44a7-b7fd-95955491b564');
