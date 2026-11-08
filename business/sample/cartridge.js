/* Green Leaf Kitchen's Cartridge (BrandDesk, canon canon-ve-front-of-house v4; Sean, 2026-10-31: "a cartridge, just plug
 * it into the template, that it knows the colors, it knows the logo, it knows everything").
 *
 * A Cartridge is everything that makes one business look and sound like itself, in one file. The frame (the website template)
 * is fixed and keeps improving; it reads only what is in here. The same file is the client's brand kit (/business/sample/brand),
 * the record the monthly check-in keeps current, and the asset sheet they take with them if they ever leave.
 *
 * Green Leaf Kitchen is invented (the sample business at /business/sample). Nothing here is a database row.
 *
 * Shape (every Cartridge has these keys; a frame may ignore what it does not draw):
 *   meta      version, status, the approvals per section ({section: {state, by, at, note}}), where it came from
 *   business  name, kind, how Vegan, cuisines, city, chapter
 *   brand     logo files, colors (each with a role), type, photo treatment
 *   voice     personality, how we sound, what we never say, words we use, sample lines by place
 *   story     tagline, short (one or two sentences), long (the About)
 *   menu      sections, each item: name, was (their words), copy (ours), price, tags, photo {state, src}
 *   photos    the shot list for the space and the team, each with its state
 *   info      address, phone, hours, links, ordering (point of sale)
 * Approval states: approved, in_review (sent to them), revising (they asked for changes), to_make (ours to produce).
 */
(function () {
  var IMG = '/business/sample/img/';
  window.VE_CARTRIDGE = {
    meta: {
      version: 3,
      status: 'locked',
      updated: '2026-10-31',
      frame: 'restaurant',
      sample: true,
      // One entry per section of the brand kit. States: not_started (the kit shows instructions only), in_progress, in_review (with
      // the owner), revising, locked (approved; the content shows with Edit).
      approvals: {
        logo: { state: 'locked', by: 'Owner', at: '2026-10-22', note: 'We keep their stacked logo and make the other six files.' },
        colors: { state: 'locked', by: 'Owner', at: '2026-10-24', note: 'Second round: the turmeric highlight came in, the darker green stayed.' },
        type: { state: 'locked', by: 'Owner', at: '2026-10-24' },
        voice: { state: 'locked', by: 'Owner', at: '2026-10-24' },
        story: { state: 'locked', by: 'Owner', at: '2026-10-26', note: 'Asked us to name the bakery down the street. Kept it unnamed until the bakery agrees.' },
        menu: { state: 'locked', by: 'Owner', at: '2026-10-27' },
        photos: { state: 'locked', by: 'Owner', at: '2026-10-31', note: 'Every dish, drink and the space, shot to the standard. Illustrative photos for this sample.' },
        info: { state: 'locked', by: 'Owner', at: '2026-10-22' }
      },
      sources: ['Their old website (archived at intake)', 'Their Google profile', 'Their Instagram', 'The intake call', 'Their menu as printed']
    },

    business: {
      name: 'Green Leaf Kitchen',
      short: 'Green Leaf',
      kind: 'Restaurant',
      vegan: '100% Vegan',
      cuisines: ['All-day breakfast', 'Bowls', 'Caribbean touches'],
      city: 'Fort Lauderdale, FL',
      chapter: 'south-florida',
      since: 2019
    },

    brand: {
      logo: {
        primary: { src: IMG + 'logo.jpg', state: 'have', note: 'Stacked: the leaf and fork over the wordmark, on cream.' },
        files: [
          { name: 'Primary, stacked, on cream', state: 'have' },
          { name: 'Primary, vector (SVG and PDF)', state: 'to_make' },
          { name: 'Reversed, cream on forest', state: 'have', src: IMG + 'logo-reverse.png' },
          { name: 'The mark alone (the leaf and fork)', state: 'have', src: IMG + 'mark.png' },
          { name: 'The mark alone, reversed (cream)', state: 'have', src: IMG + 'mark-reverse.png' },
          { name: 'Wordmark on one line', state: 'to_make' },
          { name: 'Social sizes (profile, cover, story)', state: 'to_make' },
          { name: 'Delivery app sizes (logo, banner)', state: 'to_make' }
        ],
        rules: ['Clear space all round equal to the leaf\'s width.', 'Never smaller than 120 px (1 inch) wide.',
          'Only on cream, white or forest. Never on a photo without a panel behind it.', 'Never stretched, recolored, outlined or shadowed.']
      },
      // Colors by role, so any frame knows which is the page, the text, the buttons. The names are the client's own.
      colors: [
        { role: 'page', name: 'Cream', hex: '#FBF5E6', job: 'The page, everywhere' },
        { role: 'text', name: 'Forest', hex: '#1E4D2B', job: 'Text, headings, the dark panels' },
        { role: 'accent', name: 'Leaf', hex: '#2E7D32', job: 'Buttons and links' },
        { role: 'soft', name: 'Sage', hex: '#DCE8D2', job: 'Soft panels, tags, the hours strip' },
        { role: 'highlight', name: 'Turmeric', hex: '#E0A030', job: 'One highlight a screen: a badge, a new dish' },
        { role: 'ink', name: 'Charcoal', hex: '#1F2420', job: 'Small print, and words on the highlight' }
      ],
      // The pairs a frame draws, [words, background, where]. The kit scores readability from these.
      pairs: [['text', 'page', 'Headings and text'], ['page', 'accent', 'Button words'], ['page', 'text', 'Words on the dark panels'], ['ink', 'highlight', 'Words on a highlight'], ['text', 'soft', 'Words on a soft panel']],
      type: {
        heading: { family: 'Nunito', weight: 900, why: 'Round and bold like the wordmark, so the site and the sign read as one.' },
        body: { family: 'DM Sans', weight: 400, why: 'Plain and easy at small sizes: menus, hours, prices.' },
        google: 'https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&family=DM+Sans:wght@400;500;700&display=swap'
      },
      photo: {
        look: 'Bright and natural. Window light from the side, light wood, cream ceramic, linen. Warm, never orange. Food fills most of the frame.',
        never: 'Flash, dark moody tables, filters, plastic wrap, a dirty rim, anything off the menu in frame.'
      }
    },

    voice: {
      personality: ['Warm', 'Sunny', 'Unfussy'],
      sounds_like: 'A neighbor who cooks really well and is glad you came by. Short sentences. Talks about the food, not about being Vegan.',
      never: ['Preachy or guilt (no "cruelty-free so you can feel good")', 'Diet talk ("guilt-free", "clean", "skinny")', 'Exclamation marks in a row', '"Fake" or "mock" anything'],
      words: { use: ['all-day', 'big', 'fresh', 'made here', 'neighborhood', 'come hungry'], avoid: ['plant-based alternative', 'healthy version', 'meatless'] },
      samples: {
        hero: 'All-day breakfast, big bowls and good coffee. Come hungry.',
        instagram: 'The Sunrise Plate is back on the patio. Turmeric tofu, crispy potatoes, greens and sourdough from down the street. Open at 8.',
        google_reply: 'Thank you, Dana. The jackfruit bowl is our favorite too. See you on the patio next time.',
        closed: 'We\'re closed today for a family day. Back tomorrow at 8, coffee on.'
      }
    },

    story: {
      tagline: 'A neighborhood Vegan kitchen: all-day breakfast, big bowls and good coffee.',
      short: 'A corner kitchen in Fort Lauderdale cooking all-day breakfast, big bowls and Key lime cheesecake people cross the county for. Everything is Vegan.',
      long: [
        'Green Leaf Kitchen started with twelve tables, a patio and a counter that opens at eight. It still is that: a place you can come in your running shoes for a latte or bring your whole family for brunch.',
        'We cook breakfast all day, build big bowls with a little Caribbean in them, and pile sandwiches on sourdough from the bakery down the street. Everything on the menu is Vegan, and most of it can be made gluten-free.',
        'And yes, the Key lime cheesecake is worth the drive.'
      ],
      // A short narrated photo video of how the place came about (Sean, 2026-11-08). Liz narrates; captions are its words.
      video: { src: 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/business/sample/story-v2.mp4',
        poster: IMG + 'story-poster.jpg', captions: '/business/sample/story-v2.vtt', title: 'How Green Leaf Kitchen came to be' }
    },

    // News from the restaurant: the site's Latest section (newest first). Dates are days before today, so the sample stays current.
    // A post may point at an event on the Vegans Explore calendar.
    posts: [
      { days_ago: 4, votes: 58, kind: 'New on the menu', title: 'Meet the Coconut Mango Pudding',
        photo: IMG + 'm-pudding.webp',
        body: ['Creamy coconut chia pudding, layered with fresh mango and finished with toasted coconut. Cold, bright and just sweet enough.',
          'It started as a staff snack on hot afternoons. Then the staff would not stop talking about it. Now it is in the pastry case every day.'] },
      { days_ago: 11, votes: 41, kind: 'See us there', title: 'Find us at the Vegans Explore Community Night', when_in_days: 9,
        photo: IMG + 'm-cheesecake.webp',
        body: ['We are a vendor at the next Vegans Explore Community Night in Fort Lauderdale. Come find our table for Jerk Jackfruit Bowl bites, Key lime cheesecake cups and cold hibiscus lemonade.',
          'Bring a friend who has never had Vegan food. That is the whole point of the night.'],
        link: { label: 'See it on the Vegans Explore calendar', href: 'https://vegansexplore.com/events?city=south-florida' } },
      { days_ago: 19, votes: 96, kind: 'Holiday', title: 'Our ThanksLiving trays are here',
        photo: IMG + 'photo-3.jpg',
        body: ['Feeding a table on ThanksLiving? Order a family tray of Jerk Jackfruit, coconut rice and beans, garlicky greens and a whole Key lime cheesecake. Feeds six.',
          'Order by the Sunday before and pick it up warm on Wednesday afternoon. We are closed on the day itself so the team can be with their families.'] },
      { days_ago: 47, votes: 33, kind: 'New hours', title: 'Thursday to Saturday, we are open late',
        photo: IMG + 's-outside-night.webp',
        body: ['You asked, so the string lights stay on. We are open until 9 on Thursdays and until 10 on Fridays and Saturdays, with the full menu and the patio.',
          'Breakfast all day still means all day. Pancakes at 9:45 PM are allowed.'] },
      { days_ago: 96, votes: 72, kind: 'Our people', title: 'Meet the team behind the counter',
        photo: IMG + 's-team.webp',
        body: ['Five of us open the doors every morning. Some of us have cooked for twenty years, one of us started as a regular who would not leave.',
          'Say hi next time you come in. We will remember your order.'] },
      { days_ago: 183, votes: 124, kind: 'Big news', title: 'We are partnering with Vegans Explore',
        photo: IMG + 's-owner.webp',
        body: ['Opening a restaurant is a lot. The cooking is the part we love. Everything else, the website, the photos, the social posts and the numbers, can swallow you whole.',
          'So we are partnering with Vegans Explore and LESARUSS.ai. They run the back end and show us everything, and we get to put our time into the food and the people who come through the door. See you soon, Fort Lauderdale.'] }
    ],

    menu: {
    // What goes into each dish and where it comes from (Sean, 2026-11-08: "not how to make it, just what's being sourced").
    // An ingredient is made here, from a local farm, a local maker, or a brand. A brand on Vegans Explore names its Directory
    // listing (listing: slug), so an owner building a dish can pull it from the Directory. Allergens are named per ingredient
    // and a dish's list is worked out from them. Farms, makers and the bakery here are made up for the sample.
    ingredients: {
      tofu: { name: 'Organic tofu', from: 'maker', source: 'Bamboo Lane Tofu, a family tofu shop in Miami', organic: true, allergens: ['Soy'] },
      potatoes: { name: 'Yukon Gold potatoes', from: 'farm', source: 'Sunrise Fields, Homestead', organic: true },
      greens: { name: 'Kale and collard greens', from: 'farm', source: 'Little River Farm, Redland', organic: true },
      sourdough: { name: 'Sourdough bread', from: 'maker', source: 'Corner Crumb, the bakery down the street', allergens: ['Wheat'] },
      spice: { name: 'Turmeric, garlic and rosemary', from: 'made', source: 'Our own spice blend, ground here', organic: true },
      oatmilk: { name: 'Oat milk', from: 'brand', brand: 'Oatly', listing: 'oatly', source: 'Oatly Barista Edition' },
      espresso: { name: 'Espresso', from: 'maker', source: 'Las Olas Coffee Roasters, Fort Lauderdale' },
      flax: { name: 'Ground golden flaxseed', from: 'market', source: 'Organic, in place of eggs', organic: true },
      oatflour: { name: 'Oat flour and spelt flour', from: 'market', source: 'Stone-ground', allergens: ['Wheat'] },
      maple: { name: 'Pure maple syrup', from: 'market', source: 'Grade A, from Vermont' },
      cashewcream: { name: 'Cinnamon cashew cream', from: 'made', source: 'Made here from organic cashews', organic: true, allergens: ['Tree nuts'] },
      berries: { name: 'Strawberries and blueberries', from: 'farm', source: 'Florida farms, in season' },
      banana: { name: 'Bananas', from: 'market', source: 'Fair trade', organic: true },
      beans: { name: 'Black beans', from: 'made', source: 'Cooked here from dry, organic', organic: true },
      salsaverde: { name: 'Salsa verde', from: 'made', source: 'Tomatillos and jalapeños from Little River Farm' },
      tortilla: { name: 'Flour tortilla', from: 'maker', source: 'La Familia Tortillería, Hialeah', allergens: ['Wheat'] },
      avocado: { name: 'Avocado', from: 'farm', source: 'Homestead growers, in season' },
      onion: { name: 'Pickled red onion', from: 'made', source: 'Pickled here every morning' },
      microgreens: { name: 'Microgreens', from: 'farm', source: 'Little River Farm, Redland', organic: true },
      justegg: { name: 'Plant-based egg', from: 'brand', brand: 'JUST Egg', listing: 'just-egg', source: 'JUST Egg, folded with chickpea flour' },
      chickpeaflour: { name: 'Chickpea flour', from: 'market', source: 'Stone-ground', organic: true },
      spinach: { name: 'Spinach', from: 'farm', source: 'Little River Farm, Redland', organic: true },
      peppers: { name: 'Roasted red peppers', from: 'made', source: 'Roasted here' },
      quinoa: { name: 'Quinoa', from: 'market', source: 'Tri-color', organic: true },
      broccoli: { name: 'Broccoli', from: 'farm', source: 'Sunrise Fields, Homestead', organic: true },
      chickpeas: { name: 'Crispy chickpeas', from: 'made', source: 'Roasted here', organic: true },
      tahini: { name: 'Herb tahini', from: 'made', source: 'Made here with stone-ground sesame', allergens: ['Sesame'] },
      jackfruit: { name: 'Young green jackfruit', from: 'market', source: 'Slow-cooked here' },
      jerk: { name: 'Jerk marinade', from: 'brand', brand: 'West Indies Peppa Sauce', listing: 'shopwips', source: 'Scotch bonnet heat from West Indies Peppa Sauce' },
      coconutmilk: { name: 'Coconut milk', from: 'market', source: 'Organic, full fat', organic: true, allergens: ['Coconut'] },
      plantain: { name: 'Sweet plantains', from: 'farm', source: 'South Florida growers' },
      mango: { name: 'Mango', from: 'farm', source: 'Florida mangoes, in season' },
      noodles: { name: 'Rice noodles', from: 'market', source: 'Brown rice' },
      peanutsauce: { name: 'Peanut sauce', from: 'made', source: 'Made here with peanuts, tamari and lime', allergens: ['Peanuts', 'Soy'] },
      edamame: { name: 'Edamame', from: 'market', source: 'Non-GMO', organic: true, allergens: ['Soy'] },
      rice: { name: 'Cilantro lime rice', from: 'made', source: 'Long-grain rice, cooked here', organic: true },
      corn: { name: 'Charred corn salsa', from: 'made', source: 'Sweet corn from Sunrise Fields' },
      tempeh: { name: 'Smoked tempeh', from: 'brand', brand: "Wiwa's Tempeh", listing: 'wiwastempeh', source: "Wiwa's Tempeh, smoked here", allergens: ['Soy'] },
      mayo: { name: 'Plant-based mayo', from: 'brand', brand: 'Follow Your Heart', listing: 'follow-your-heart', source: 'Follow Your Heart Vegenaise', allergens: ['Soy'] },
      tomato: { name: 'Tomatoes', from: 'farm', source: 'Sunrise Fields, Homestead' },
      cauliflower: { name: 'Cauliflower', from: 'farm', source: 'Sunrise Fields, Homestead', organic: true },
      buffalo: { name: 'Buffalo sauce', from: 'made', source: 'Made here' },
      wrap: { name: 'Spinach wrap', from: 'maker', source: 'La Familia Tortillería, Hialeah', allergens: ['Wheat'] },
      cheddar: { name: 'Plant-based cheddar', from: 'brand', brand: 'Violife', listing: 'violife', source: 'Violife cheddar slices', allergens: ['Coconut'] },
      mozzarella: { name: 'Plant-based mozzarella', from: 'brand', brand: 'Violife', listing: 'violife', source: 'Violife mozzarella shreds', allergens: ['Coconut'] },
      bun: { name: 'Brioche-style bun', from: 'maker', source: 'Corner Crumb, the bakery down the street', allergens: ['Wheat'] },
      slaw: { name: 'Slaw', from: 'made', source: 'Cabbage and carrots, cut here' },
      pesto: { name: 'Basil pesto', from: 'made', source: 'Made here with basil, garlic and pine nuts', allergens: ['Tree nuts'] },
      zucchini: { name: 'Zucchini', from: 'farm', source: 'Little River Farm, Redland', organic: true },
      matcha: { name: 'Ceremonial matcha', from: 'market', source: 'Stone-ground, from Japan', organic: true },
      coldbrew: { name: 'Cold brew coffee', from: 'maker', source: 'Las Olas Coffee Roasters, steeped here overnight' },
      ginger: { name: 'Fresh ginger', from: 'market', source: 'Organic', organic: true },
      coconutwater: { name: 'Coconut water', from: 'brand', brand: 'Harmless Harvest', listing: 'harmless-harvest', source: 'Harmless Harvest', allergens: ['Coconut'] },
      hibiscus: { name: 'Hibiscus flowers and lemons', from: 'market', source: 'Dried hibiscus, lemons squeezed here' },
      acai: { name: 'Açaí', from: 'brand', brand: 'Navitas Organics', listing: 'navitasorganics', source: 'Navitas Organics açaí', organic: true },
      granola: { name: 'House granola', from: 'made', source: 'Baked here with oats, almonds and maple', allergens: ['Tree nuts'] },
      cashews: { name: 'Organic cashews', from: 'market', source: 'Soaked and blended here', organic: true, allergens: ['Tree nuts'] },
      lime: { name: 'Key limes', from: 'farm', source: 'Florida Keys, in season' },
      graham: { name: 'Graham crust', from: 'made', source: "Made here with Miyoko's butter", allergens: ['Wheat', 'Tree nuts'] },
      butter: { name: 'Plant-based butter', from: 'brand', brand: "Miyoko's", listing: 'miyokos', source: "Miyoko's cultured butter", allergens: ['Tree nuts'] },
      chocolate: { name: 'Dark chocolate', from: 'market', source: 'Fair trade, 70% cacao' },
      flour: { name: 'Unbleached flour', from: 'market', source: 'Organic', organic: true, allergens: ['Wheat'] },
      walnuts: { name: 'Walnuts', from: 'market', source: 'Organic', organic: true, allergens: ['Tree nuts'] },
      chia: { name: 'Chia seeds', from: 'market', source: 'Organic', organic: true },
      coconut: { name: 'Toasted coconut', from: 'made', source: 'Toasted here', allergens: ['Coconut'] }
    },
      sections: [
        { name: 'Breakfast, all day', items: [
          { name: 'Sunrise Plate', ing: ['tofu', 'spice', 'potatoes', 'greens', 'sourdough'], nutrition: { cal: 620, protein: 28, carbs: 68, fat: 24 }, votes: 412, price: '$15', tags: ['Favorite'], photo: { state: 'shot', src: IMG + 'photo-1.jpg' }, gallery: [IMG + 'g/photo-1-1.webp', IMG + 'g/photo-1-2.webp', IMG + 'g/photo-1-3.webp'],
            was: 'Tofu scramble, crispy potatoes, sauteed greens and sourdough toast.',
            copy: 'Turmeric tofu scramble, crispy rosemary potatoes, garlicky greens and two slices of toasted sourdough. The one most people order first.' },
          { name: 'Banana Oat Pancakes', ing: ['oatflour', 'flax', 'oatmilk', 'banana', 'maple', 'cashewcream', 'berries'], nutrition: { cal: 690, protein: 14, carbs: 112, fat: 20 }, votes: 288, price: '$13', tags: [], photo: { state: 'shot', src: IMG + 'm-pancakes.webp' }, gallery: [IMG + 'g/m-pancakes-1.webp', IMG + 'g/m-pancakes-2.webp', IMG + 'g/m-pancakes-3.webp'],
            was: 'Three pancakes with maple, cinnamon cashew cream and berries.',
            copy: 'A stack of three, golden at the edges, with warm maple, cinnamon cashew cream and fresh berries.' },
          { name: 'Sunrise Burrito', ing: ['tofu', 'spice', 'beans', 'potatoes', 'salsaverde', 'tortilla'], nutrition: { cal: 710, protein: 30, carbs: 92, fat: 22 }, votes: 196, price: '$13', tags: ['Spicy'], photo: { state: 'shot', src: IMG + 'm-burrito.webp' }, gallery: [IMG + 'g/m-burrito-1.webp', IMG + 'g/m-burrito-2.webp', IMG + 'g/m-burrito-3.webp'],
            was: 'Tofu scramble, black beans, potatoes and salsa verde in a flour tortilla.',
            copy: 'Turmeric tofu scramble, black beans and crispy potatoes rolled up with bright salsa verde. Breakfast you can carry.' },
          { name: 'Smashed Avocado Toast', ing: ['sourdough', 'avocado', 'onion', 'microgreens'], nutrition: { cal: 430, protein: 11, carbs: 48, fat: 22 }, votes: 171, price: '$12', tags: [], photo: { state: 'shot', src: IMG + 'm-avotoast.webp' }, gallery: [IMG + 'g/m-avotoast-1.webp', IMG + 'g/m-avotoast-2.webp', IMG + 'g/m-avotoast-3.webp'],
            was: 'Avocado on sourdough with chili flakes, pickled onion and microgreens.',
            copy: 'Smashed avocado on toasted sourdough with chili flakes, pickled red onion, microgreens and a squeeze of lime.' },
          { name: 'Chickpea Frittata', ing: ['justegg', 'chickpeaflour', 'spinach', 'peppers'], nutrition: { cal: 390, protein: 22, carbs: 30, fat: 18 }, votes: 94, price: '$14', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-frittata.webp' }, gallery: [IMG + 'g/m-frittata-1.webp', IMG + 'g/m-frittata-2.webp', IMG + 'g/m-frittata-3.webp'],
            was: 'Chickpea frittata with spinach and roasted peppers, side salad.',
            copy: 'A thick slice of golden chickpea frittata with spinach and roasted red peppers, and a little arugula salad.' }
        ] },
        { name: 'Bowls', items: [
          { name: 'Green Goddess Bowl', ing: ['quinoa', 'broccoli', 'chickpeas', 'avocado', 'tahini'], nutrition: { cal: 640, protein: 22, carbs: 70, fat: 32 }, votes: 233, price: '$16', tags: ['Gluten-free', 'Favorite'], photo: { state: 'shot', src: IMG + 'photo-2.jpg' }, gallery: [IMG + 'g/photo-2-1.webp', IMG + 'g/photo-2-2.webp', IMG + 'g/photo-2-3.webp'],
            was: 'Quinoa, roasted broccoli, chickpeas, avocado and herb tahini.',
            copy: 'Fluffy quinoa, charred broccoli, crispy roasted chickpeas and half an avocado under a bright herb tahini.' },
          { name: 'Jerk Jackfruit Bowl', ing: ['jackfruit', 'jerk', 'rice', 'beans', 'coconutmilk', 'plantain', 'mango', 'slaw'], nutrition: { cal: 720, protein: 16, carbs: 118, fat: 20 }, votes: 367, price: '$17', tags: ['Gluten-free', 'Spicy'], photo: { state: 'shot', src: IMG + 'photo-3.jpg' }, gallery: [IMG + 'g/photo-3-1.webp', IMG + 'g/photo-3-2.webp', IMG + 'g/photo-3-3.webp'],
            was: 'Jerk jackfruit, coconut rice and beans, plantains and mango slaw.',
            copy: 'Slow-cooked jerk jackfruit with coconut rice and beans, sweet fried plantains and a crunchy mango slaw.' },
          { name: 'Peanut Tofu Noodle Bowl', ing: ['noodles', 'tofu', 'peanutsauce', 'edamame', 'slaw'], nutrition: { cal: 760, protein: 32, carbs: 92, fat: 28 }, votes: 205, price: '$16', tags: [], photo: { state: 'shot', src: IMG + 'm-noodles.webp' }, gallery: [IMG + 'g/m-noodles-1.webp', IMG + 'g/m-noodles-2.webp', IMG + 'g/m-noodles-3.webp'],
            was: 'Rice noodles, crispy tofu, cabbage, carrots, edamame, cucumber and peanut sauce.',
            copy: 'Rice noodles with crispy tofu, crunchy cabbage, carrots, edamame and cucumber, tossed in our creamy peanut sauce.' },
          { name: 'Burrito Bowl', ing: ['rice', 'beans', 'corn', 'tomato', 'tofu', 'avocado'], nutrition: { cal: 680, protein: 26, carbs: 96, fat: 22 }, votes: 142, price: '$15', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-burritobowl.webp' }, gallery: [IMG + 'g/m-burritobowl-1.webp', IMG + 'g/m-burritobowl-2.webp', IMG + 'g/m-burritobowl-3.webp'],
            was: 'Cilantro lime rice, black beans, corn salsa, pico, guacamole and crispy tofu.',
            copy: 'Cilantro lime rice, black beans, charred corn salsa, pico de gallo, crispy tofu and a big scoop of guacamole.' },
          { name: 'Mango Acai Bowl', ing: ['acai', 'mango', 'banana', 'granola', 'coconut'], nutrition: { cal: 520, protein: 9, carbs: 84, fat: 18 }, votes: 158, price: '$13', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-acai.webp' }, gallery: [IMG + 'g/m-acai-1.webp', IMG + 'g/m-acai-2.webp', IMG + 'g/m-acai-3.webp'],
            was: 'Acai with mango, banana, granola and coconut.',
            copy: 'Thick, cold acai topped with mango, banana, house granola and toasted coconut.' }
        ] },
        { name: 'Sandwiches', items: [
          { name: 'Smoky Tempeh Club', ing: ['tempeh', 'sourdough', 'tomato', 'greens', 'mayo'], nutrition: { cal: 610, protein: 30, carbs: 58, fat: 28 }, votes: 137, price: '$15', tags: [], photo: { state: 'shot', src: IMG + 'm-club.webp' }, gallery: [IMG + 'g/m-club-1.webp', IMG + 'g/m-club-2.webp', IMG + 'g/m-club-3.webp'],
            was: 'Smoked tempeh, lettuce, tomato and chipotle aioli on toasted sourdough.',
            copy: 'Smoky tempeh stacked with crisp lettuce, ripe tomato and chipotle aioli on toasted sourdough.' },
          { name: 'Buffalo Cauliflower Wrap', ing: ['cauliflower', 'buffalo', 'mayo', 'wrap', 'greens'], nutrition: { cal: 540, protein: 14, carbs: 62, fat: 26 }, votes: 176, price: '$14', tags: ['Spicy'], photo: { state: 'shot', src: IMG + 'm-wrap.webp' }, gallery: [IMG + 'g/m-wrap-1.webp', IMG + 'g/m-wrap-2.webp', IMG + 'g/m-wrap-3.webp'],
            was: 'Crispy buffalo cauliflower, ranch, celery and greens in a spinach wrap.',
            copy: 'Crispy buffalo cauliflower with cool ranch, celery and greens, rolled in a spinach wrap.' },
          { name: 'Chickpea Salad Melt', ing: ['chickpeas', 'mayo', 'cheddar', 'tomato', 'sourdough'], nutrition: { cal: 640, protein: 22, carbs: 66, fat: 30 }, votes: 251, price: '$14', tags: ['Favorite'], photo: { state: 'shot', src: IMG + 'm-melt.webp' }, gallery: [IMG + 'g/m-melt-1.webp', IMG + 'g/m-melt-2.webp', IMG + 'g/m-melt-3.webp'],
            was: 'Chickpea salad, vegan cheddar and tomato, grilled on sourdough.',
            copy: 'Our dill chickpea salad and tomato under melted cheddar, grilled on sourdough until it crackles.' },
          { name: 'BBQ Jackfruit Sandwich', ing: ['jackfruit', 'slaw', 'bun'], nutrition: { cal: 560, protein: 12, carbs: 92, fat: 14 }, votes: 214, price: '$15', tags: [], photo: { state: 'shot', src: IMG + 'm-bbq.webp' }, gallery: [IMG + 'g/m-bbq-1.webp', IMG + 'g/m-bbq-2.webp', IMG + 'g/m-bbq-3.webp'],
            was: 'Pulled BBQ jackfruit with slaw on a toasted bun.',
            copy: 'Pulled BBQ jackfruit piled high with crunchy slaw on a toasted bun. Bring napkins.' },
          { name: 'Pesto Veggie Panini', ing: ['pesto', 'zucchini', 'peppers', 'spinach', 'mozzarella', 'sourdough'], nutrition: { cal: 620, protein: 16, carbs: 60, fat: 34 }, votes: 88, price: '$14', tags: [], photo: { state: 'shot', src: IMG + 'm-panini.webp' }, gallery: [IMG + 'g/m-panini-1.webp', IMG + 'g/m-panini-2.webp', IMG + 'g/m-panini-3.webp'],
            was: 'Pesto, roasted zucchini, peppers, spinach and mozzarella, pressed.',
            copy: 'Basil pesto, roasted zucchini and peppers, spinach and melty mozzarella, pressed hot and crisp.' }
        ] },
        { name: 'Drinks', items: [
          { name: 'Oat Milk Latte', ing: ['espresso', 'oatmilk'], nutrition: { cal: 150, protein: 3, carbs: 20, fat: 7 }, votes: 302, price: '$5', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-latte.webp' }, gallery: [IMG + 'g/m-latte-1.webp', IMG + 'g/m-latte-2.webp', IMG + 'g/m-latte-3.webp'],
            was: 'Espresso and steamed oat milk. Hot or iced.',
            copy: 'A double shot and silky steamed oat milk. Hot or iced.' },
          { name: 'Iced Matcha Latte', ing: ['matcha', 'oatmilk'], nutrition: { cal: 170, protein: 3, carbs: 26, fat: 7 }, votes: 167, price: '$6', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-matcha.webp' }, gallery: [IMG + 'g/m-matcha-1.webp', IMG + 'g/m-matcha-2.webp', IMG + 'g/m-matcha-3.webp'],
            was: 'Matcha and oat milk over ice.',
            copy: 'Bright ceremonial matcha poured over oat milk and ice.' },
          { name: 'Cold Brew', ing: ['coldbrew'], nutrition: { cal: 5, protein: 0, carbs: 0, fat: 0 }, votes: 121, price: '$5', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-coldbrew.webp' }, gallery: [IMG + 'g/m-coldbrew-1.webp', IMG + 'g/m-coldbrew-2.webp', IMG + 'g/m-coldbrew-3.webp'],
            was: 'Cold brew coffee over ice, oat milk on request.',
            copy: 'Steeped overnight, smooth and strong, over ice. Add a splash of oat milk.' },
          { name: 'Green Machine Smoothie', ing: ['spinach', 'mango', 'banana', 'ginger', 'coconutwater'], nutrition: { cal: 260, protein: 4, carbs: 62, fat: 1 }, votes: 109, price: '$9', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-smoothie.webp' }, gallery: [IMG + 'g/m-smoothie-1.webp', IMG + 'g/m-smoothie-2.webp', IMG + 'g/m-smoothie-3.webp'],
            was: 'Spinach, mango, banana, ginger and coconut water.',
            copy: 'Spinach, mango, banana and fresh ginger blended with coconut water. Green, cold and sweeter than it looks.' },
          { name: 'Hibiscus Lemonade', ing: ['hibiscus'], nutrition: { cal: 110, protein: 0, carbs: 28, fat: 0 }, votes: 143, price: '$5', tags: ['Gluten-free'], photo: { state: 'shot', src: IMG + 'm-hibiscus.webp' }, gallery: [IMG + 'g/m-hibiscus-1.webp', IMG + 'g/m-hibiscus-2.webp', IMG + 'g/m-hibiscus-3.webp'],
            was: 'Hibiscus tea and fresh lemonade over ice.',
            copy: 'Ruby red hibiscus and fresh-squeezed lemonade over ice, with a sprig of mint.' }
        ] },
        { name: 'Sweets', items: [
          { name: 'Key Lime Cheesecake', ing: ['cashews', 'lime', 'coconutmilk', 'graham', 'butter'], nutrition: { cal: 480, protein: 8, carbs: 38, fat: 34 }, votes: 389, price: '$8', tags: ['Favorite'], photo: { state: 'shot', src: IMG + 'm-cheesecake.webp' }, gallery: [IMG + 'g/m-cheesecake-1.webp', IMG + 'g/m-cheesecake-2.webp', IMG + 'g/m-cheesecake-3.webp'],
            was: 'Cashew key lime cheesecake on a graham crust.',
            copy: 'Our cashew Key lime cheesecake on a buttery graham crust. Tart, creamy, and worth the drive.' },
          { name: 'Chocolate Chip Cookie', ing: ['flour', 'butter', 'chocolate'], nutrition: { cal: 380, protein: 4, carbs: 48, fat: 20 }, votes: 226, price: '$4', tags: [], photo: { state: 'shot', src: IMG + 'm-cookie.webp' }, gallery: [IMG + 'g/m-cookie-1.webp', IMG + 'g/m-cookie-2.webp', IMG + 'g/m-cookie-3.webp'],
            was: 'Big chocolate chip cookie with sea salt.',
            copy: 'Big, soft in the middle, crisp at the edge, with dark chocolate and a pinch of sea salt.' },
          { name: 'Banana Bread', ing: ['flour', 'banana', 'walnuts', 'maple'], nutrition: { cal: 410, protein: 6, carbs: 58, fat: 18 }, votes: 118, price: '$5', tags: [], photo: { state: 'shot', src: IMG + 'm-bananabread.webp' }, gallery: [IMG + 'g/m-bananabread-1.webp', IMG + 'g/m-bananabread-2.webp', IMG + 'g/m-bananabread-3.webp'],
            was: 'Banana bread with walnuts.',
            copy: 'A thick slice of banana bread with walnuts and a caramelized top. Ask us to warm it.' },
          { name: 'Coconut Mango Pudding', ing: ['chia', 'coconutmilk', 'mango', 'coconut'], nutrition: { cal: 310, protein: 6, carbs: 32, fat: 19 }, votes: 64, price: '$7', tags: ['New', 'Gluten-free'], photo: { state: 'shot', src: IMG + 'm-pudding.webp' }, gallery: [IMG + 'g/m-pudding-1.webp', IMG + 'g/m-pudding-2.webp', IMG + 'g/m-pudding-3.webp'],
            was: 'Coconut chia pudding with mango.',
            copy: 'Creamy coconut chia pudding layered with fresh mango and toasted coconut.' }
        ] }
      ]
    },
    photos: {
      spec: {
        angles: 'Every item twice: three-quarter (about 45 degrees) and straight overhead.',
        set: 'The same light wood table by the front window, the same cream stoneware, a linen napkin, one fork. Nothing else.',
        light: 'Window light from the left, a white bounce on the right, no flash. Mid-morning.',
        drinks: 'Shot against the light so they glow; cold drinks with real condensation and the garnish on top.',
        crops: '4:5 for the menu and Instagram, 1:1 for the delivery apps, 16:9 for the website hero. Full size, at least 3000 px on the long side.',
        plate: 'Plated the way it leaves the kitchen, wiped rims, sauce where the cook puts it. Never styled bigger than it is served.'
      },
      // Each shot has a set, so the website can show Outside, At night, Inside and The team as toggles.
      space: [
        { shot: 'Outside by day, the whole front and the sign', set: 'outside', state: 'shot', src: IMG + 's-outside-day.webp' },
        { shot: 'Outside at dusk, lights on, the same corner', set: 'night', state: 'shot', src: IMG + 's-outside-night.webp' },
        { shot: 'The full dining room, from the high corner', set: 'inside', state: 'shot', src: IMG + 's-room-wide.webp' },
        { shot: 'The room wide, from the front corner', set: 'inside', state: 'shot', src: IMG + 'photo-4.jpg' },
        { shot: 'The banquette corner at the back', set: 'inside', state: 'shot', src: IMG + 's-banquette.webp' },
        { shot: 'The window bar and its stools', set: 'inside', state: 'shot', src: IMG + 's-window-bar.webp' },
        { shot: 'The counter and the pastry case', set: 'inside', state: 'shot', src: IMG + 's-counter.webp' },
        { shot: 'Details: the plants and the coffee bar', set: 'inside', state: 'shot', src: IMG + 's-details.webp' },
        { shot: 'The owner at the counter', set: 'team', state: 'shot', src: IMG + 's-owner.webp' },
        { shot: 'The team, all together', set: 'team', state: 'shot', src: IMG + 's-team.webp' }
      ]
    },

    info: {
      address: { street: '123 Sample Street', city: 'Fort Lauderdale', state: 'FL', zip: '33301' },
      phone: '(954) 555-0142',
      email: 'hello@example.com',
      hours: { Monday: '8 AM to 3 PM', Tuesday: '8 AM to 3 PM', Wednesday: '8 AM to 3 PM', Thursday: '8 AM to 9 PM', Friday: '8 AM to 10 PM', Saturday: '9 AM to 10 PM', Sunday: '9 AM to 3 PM' },
      details: ['Patio seating', 'Wheelchair accessible', 'Street parking and a lot behind the building', 'Dogs welcome on the patio'],
      links: { website: 'https://example.com/green-leaf-kitchen', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/', facebook: 'https://facebook.com/', google: 'Claimed, we are a manager', directory: '/business/sample' },
      ordering: { pos: 'Square', state: 'connected', order_url: null, pickup_minutes: 20, note: 'They ring up on Square. Orders from the website go straight to their Square screen; the menu and prices stay in step.' }
    }
  };
})();
