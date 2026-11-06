-- brooke-sellers: Meatless Muscle's BrandDesk (Sean, 2026-11-05: "set up a brand desk for Brooke as a client using the information we
-- currently have... use Vegans Explore right now as the prototype"). A brand desk is one ve_brand_cartridges row: HQ's BrandDesk wall and
-- brand home (lesaruss-hq lib/brandDesk.ts) read it, and meatless-muscle is already a CLIENT_BRANDS entry in lib/brands.ts.
-- Filled only from what Brooke has published and approved: her site's Brand Guidelines Edition 01 (meatless-muscle assets/brand.css,
-- approved by Brooke and her marketing lead 2026-09-23), her logo and her own words on meatlessmuscle.com. Logo, colors and type are locked
-- (her approval); voice and story are drafts for her to lock. The logo and her photo were copied into vegan-media/media/logos/ first.
insert into ve_brand_cartridges (brand_slug, name, status, data) values ('meatless-muscle', 'Miss Meatless Muscle', 'building', $json$
{
  "meta": {"frame": "brand", "status": "building", "version": 1, "updated": "2026-11-05",
    "sources": ["meatless-muscle repo assets/brand.css (Brand Guidelines Edition 01, approved by Brooke and her marketing lead 2026-09-23)",
                "meatlessmuscle.com home page, her own words"],
    "approvals": {
      "logo":   {"state": "locked", "at": "2026-09-23", "by": "Brooke Sellers (Edition 01)"},
      "colors": {"state": "locked", "at": "2026-09-23", "by": "Brooke Sellers (Edition 01)"},
      "type":   {"state": "locked", "at": "2026-09-23", "by": "Brooke Sellers (Edition 01)"},
      "voice":  {"state": "in_progress", "at": "2026-11-05", "by": "Logan (drafted from her site)"},
      "story":  {"state": "in_progress", "at": "2026-11-05", "by": "Logan (drafted from her site)"}
    }},
  "business": {"name": "Miss Meatless Muscle", "short": "Meatless Muscle", "kind": "Coach", "owner": "Brooke Sellers",
    "city": "", "chapter": "", "vegan": "fully_vegan", "since": 2018, "cuisines": [],
    "website": "https://meatlessmuscle.com", "instagram": "@miss_meatless_muscle", "listing": "brooke-sellers"},
  "brand": {
    "logo": {
      "primary": {"src": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/meatless-muscle-logo.jpg",
        "note": "The double M mark over MEATLESS MUSCLE: MEATLESS in jungle green, MUSCLE in sage. On white.", "state": "have"},
      "files": [
        {"name": "Mark and wordmark, on white (JPEG)", "src": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/meatless-muscle-logo.jpg", "state": "have"},
        {"name": "Brooke's portrait (avatar)", "src": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/meatless-muscle-brooke.jpg", "state": "have"},
        {"name": "The mark as a vector (SVG)", "src": "", "state": "to_make"},
        {"name": "The mark on dark", "src": "", "state": "to_make"}
      ],
      "rules": ["Never stretched, outlined or shadowed.", "The gold 3px rule caps a card or a column: it is what makes a page read as Meatless Muscle at a glance."]
    },
    "colors": [
      {"role": "page", "hex": "#F2F1ED", "name": "Bone"},
      {"role": "text", "hex": "#22262A", "name": "Ink"},
      {"role": "accent", "hex": "#D99A22", "name": "Gold (buttons, with an ink label at 6.2:1; never white on gold)"},
      {"role": "soft", "hex": "#EFF2EC", "name": "Mist"},
      {"role": "highlight", "hex": "#8DA98D", "name": "Sage (behind quotes, never as type at text size)"},
      {"role": "ink", "hex": "#0E332F", "name": "Jungle deep"}
    ],
    "extra_colors": [
      {"hex": "#154741", "name": "Jungle (links at 10.5:1)"}, {"hex": "#B67F14", "name": "Gold deep (hover, link underline)"},
      {"hex": "#D9DED6", "name": "Hairline"}, {"hex": "#5F6569", "name": "Meta text (the AA fix for steel)"}
    ],
    "pairs": [["text","page","Headings and text"],["text","accent","Button words"],["page","ink","Words on the dark panels"],["text","soft","Words on a soft panel"]],
    "type": {
      "heading": {"family": "Archivo", "weight": 600, "why": "Display: headings, buttons, navigation, eyebrows in spaced capitals."},
      "body": {"family": "Manrope", "weight": 400, "why": "Text: everything people read."},
      "accent": {"family": "Instrument Serif", "style": "italic", "why": "The single accent face, for quote marks and a word of emphasis."},
      "google": "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Instrument+Serif:ital@1&display=swap"
    }
  },
  "story": {
    "tagline": "Online coaching for Vegan women who lift.",
    "short": "Lose fat, build strength, and reclaim your confidence, without giving up your values.",
    "long": [
      "I'm Brooke Sellers. After going Vegan in 2018 I transformed my own health through weightlifting, and now I coach women worldwide to do the same: real strength, real results, no restriction.",
      "Custom training built around your goals and your equipment, a nutrition plan with a grocery list and recipes that hit your protein on a plant-based diet, weekly check-ins and monthly coaching calls, and a community of Vegan women doing it alongside you.",
      "Author of the Meatless Muscle Cookbook and Heal Your Gut. Balance Your Hormones. Co-host of the Vegans Who Lift podcast."
    ],
    "answers": {}
  },
  "voice": {
    "sounds_like": "A coach who has done it herself: warm, direct and encouraging, plain about the work and proud of her clients' results.",
    "personality": ["Encouraging", "Direct", "Strong"],
    "words": {"use": ["strength", "real results", "your values", "plant-powered", "accountability", "community"], "avoid": ["diet", "restriction", "quick fix"]},
    "never": ["promise a result a client has not had", "shame a body or a food choice", "use white words on gold"],
    "samples": {
      "hero": "Lose fat, build strength, and reclaim your confidence, without giving up your values.",
      "instagram": "Real strength, real results, no restriction. Your plant-powered plan starts with one application.",
      "closed": "Your journey to a stronger, plant-powered life begins with one application. Let's build your plan together.",
      "google_reply": "Thank you for trusting me with your training. I'm so proud of the work you've put in."
    }
  }
}
$json$::jsonb)
on conflict (brand_slug) do nothing;
