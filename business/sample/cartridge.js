/* Green Leaf Kitchen's Cartridge (Front of House, canon canon-ve-front-of-house v4; Sean, 2026-10-31: "a cartridge, just plug
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
      approvals: {
        brand: { state: 'approved', by: 'Owner', at: '2026-10-24', note: 'Second round: the turmeric accent came in, the darker green stayed.' },
        voice: { state: 'approved', by: 'Owner', at: '2026-10-24' },
        story: { state: 'approved', by: 'Owner', at: '2026-10-26', note: 'Asked us to name the bakery down the street. Kept it unnamed until they agree.' },
        menu: { state: 'approved', by: 'Owner', at: '2026-10-27' },
        photos: { state: 'to_make', note: 'Four of twenty shot. The rest are booked.' },
        info: { state: 'approved', by: 'Owner', at: '2026-10-22' }
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
          { name: 'Reversed, cream on forest', state: 'to_make' },
          { name: 'The mark alone (the leaf and fork)', state: 'to_make' },
          { name: 'Wordmark on one line', state: 'to_make' },
          { name: 'Social sizes (profile, cover, story)', state: 'to_make' },
          { name: 'Delivery app sizes (logo, banner)', state: 'to_make' }
        ],
        rules: ['Clear space all round equal to the leaf\'s width.', 'Never smaller than 120 px (1 inch) wide.',
          'Only on cream, white or forest. Never on a photo without a panel behind it.', 'Never stretched, recolored, outlined or shadowed.']
      },
      colors: [
        { key: 'forest', name: 'Forest', hex: '#1E4D2B', role: 'Text, headings, the dark panels' },
        { key: 'leaf', name: 'Leaf', hex: '#2E7D32', role: 'Buttons and links (the logo\'s green)' },
        { key: 'cream', name: 'Cream', hex: '#FBF5E6', role: 'The page, everywhere' },
        { key: 'sage', name: 'Sage', hex: '#DCE8D2', role: 'Soft panels, tags, the hours strip' },
        { key: 'turmeric', name: 'Turmeric', hex: '#E0A030', role: 'One highlight a screen: a badge, a new dish' },
        { key: 'charcoal', name: 'Charcoal', hex: '#1F2420', role: 'Small print, prices' }
      ],
      pairs: [['forest', 'cream'], ['leaf', 'cream'], ['cream', 'forest'], ['charcoal', 'turmeric'], ['forest', 'sage']],
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
      ]
    },

    menu: {
      sections: [
        { name: 'Breakfast, all day', items: [
          { name: 'Sunrise Plate', price: '$15', tags: ['Favorite'], photo: { state: 'shot', src: IMG + 'photo-1.jpg' },
            was: 'Tofu scramble, crispy potatoes, sauteed greens and sourdough toast.',
            copy: 'Turmeric tofu scramble, crispy rosemary potatoes, garlicky greens and two slices of toasted sourdough. The one most people order first.' },
          { name: 'Banana Oat Pancakes', price: '$13', tags: [], photo: { state: 'to_shoot' },
            was: 'Three pancakes with maple, cinnamon cashew cream and berries.',
            copy: 'A stack of three, golden at the edges, with warm maple, cinnamon cashew cream and fresh berries.' }
        ] },
        { name: 'Bowls', items: [
          { name: 'Green Goddess Bowl', price: '$16', tags: ['Gluten-free', 'Favorite'], photo: { state: 'shot', src: IMG + 'photo-2.jpg' },
            was: 'Quinoa, roasted broccoli, chickpeas, avocado and herb tahini.',
            copy: 'Fluffy quinoa, charred broccoli, crispy roasted chickpeas and half an avocado under a bright herb tahini.' },
          { name: 'Jerk Jackfruit Bowl', price: '$17', tags: ['Gluten-free', 'Spicy'], photo: { state: 'shot', src: IMG + 'photo-3.jpg' },
            was: 'Jerk jackfruit, coconut rice and beans, plantains and mango slaw.',
            copy: 'Slow-cooked jerk jackfruit with coconut rice and beans, sweet fried plantains and a crunchy mango slaw.' }
        ] },
        { name: 'Sandwiches', items: [
          { name: 'Smoky Tempeh Club', price: '$15', tags: [], photo: { state: 'to_shoot' },
            was: 'Smoked tempeh, lettuce, tomato and chipotle aioli on toasted sourdough.',
            copy: 'Smoky tempeh stacked with crisp lettuce, ripe tomato and chipotle aioli on toasted sourdough.' },
          { name: 'Buffalo Cauliflower Wrap', price: '$14', tags: ['Spicy'], photo: { state: 'to_shoot' },
            was: 'Crispy buffalo cauliflower, ranch, celery and greens in a spinach wrap.',
            copy: 'Crispy buffalo cauliflower with cool ranch, celery and greens, rolled in a spinach wrap.' }
        ] },
        { name: 'Drinks', items: [
          { name: 'Oat Milk Latte', price: '$5', tags: ['Gluten-free'], photo: { state: 'to_shoot' },
            was: 'Espresso and steamed oat milk. Hot or iced.',
            copy: 'A double shot and silky steamed oat milk. Hot or iced.' },
          { name: 'Green Machine Smoothie', price: '$9', tags: ['Gluten-free'], photo: { state: 'to_shoot' },
            was: 'Spinach, mango, banana, ginger and coconut water.',
            copy: 'Spinach, mango, banana and fresh ginger blended with coconut water. Green, cold and sweeter than it looks.' }
        ] },
        { name: 'Sweets', items: [
          { name: 'Key Lime Cheesecake', price: '$8', tags: ['Favorite'], photo: { state: 'to_shoot' },
            was: 'Cashew key lime cheesecake on a graham crust.',
            copy: 'Our cashew Key lime cheesecake on a buttery graham crust. Tart, creamy, and worth the drive.' }
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
      space: [
        { shot: 'Outside by day, the whole front and the sign', state: 'to_shoot' },
        { shot: 'Outside at dusk, lights on', state: 'to_shoot' },
        { shot: 'The room wide, from the front corner', state: 'shot', src: IMG + 'photo-4.jpg' },
        { shot: 'The room wide, from the back corner', state: 'to_shoot' },
        { shot: 'The counter and the pastry case', state: 'to_shoot' },
        { shot: 'Details: the plants, the coffee bar, the chalkboard', state: 'to_shoot' },
        { shot: 'The owner at the counter', state: 'to_shoot' },
        { shot: 'The team, all together', state: 'to_shoot' }
      ]
    },

    info: {
      address: { street: '123 Sample Street', city: 'Fort Lauderdale', state: 'FL', zip: '33301' },
      phone: '(954) 555-0142',
      email: 'hello@example.com',
      hours: { Monday: '8 AM to 3 PM', Tuesday: '8 AM to 3 PM', Wednesday: '8 AM to 3 PM', Thursday: '8 AM to 9 PM', Friday: '8 AM to 10 PM', Saturday: '9 AM to 10 PM', Sunday: '9 AM to 3 PM' },
      details: ['Patio seating', 'Wheelchair accessible', 'Street parking and a lot behind the building', 'Dogs welcome on the patio'],
      links: { website: 'https://example.com/green-leaf-kitchen', instagram: '@greenleafkitchen (sample)', google: 'Claimed, we are a manager', directory: '/business/sample' },
      ordering: { pos: 'Square', state: 'to_connect', order_url: null, note: 'They ring up on Square. Menu sync and online orders come with the Square connection.' }
    }
  };
})();
