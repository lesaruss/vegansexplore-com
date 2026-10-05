/* The Vegans Explore city hubs in one place (Sean, 2026-09-27), for pages that work across
 * communities: the Passport Challenge and Tours pick a hub, and each hub launches on its own.
 * `match` is each hub's Directory rule, used by the hub page and /directory alike (a listing is in
 * the hub when its city is in `cities` and its state in `states`, whichever are given). `filter` is the same rule as a PostgREST query string.
 * `places` are suggestions for a tour's city field.
 *
 * `page` is everything the city hub page needs (Sean, 2026-10-05: South Florida is the prototype
 * and every city gets its layout). There is one hub page, /communities/hub.html, served at
 * /communities/<slug> by a rewrite in vercel.json; a city differs from the others only here.
 *   short / brand   the hero title (SHORT<br>Vegans) and the community's name
 *   regions         the line under the title
 *   banner, alt     the hero art in /communities/<slug>/
 *   area            "across ___" in the section subtitles
 *   eventCities     events (and the points leaderboard) count when their city is one of these
 *   adPrefix        the billboard's ad_placements slot ids: <adPrefix>-skyscraper, -landscape-1, -landscape-2
 *   counties        optional Directory grouping; featured: optional pinned event rows
 */
(function () {
  var SF = ['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade'];
  // South Florida's three counties, for its Directory grouping.
  var SF_COUNTIES = {
    'Miami-Dade': SF.slice(0, 21),
    'Broward': SF.slice(21, 48),
    'Palm Beach': SF.slice(48)
  };
  var CF = ['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala'];
  var LA = ['Los Angeles','West Hollywood','North Hollywood','Reseda','Canoga Park'];
  var hubs = [
    { slug: 'south-florida', name: 'South Florida', tz: 'America/New_York', match: { cities: SF }, places: SF, page: { short: 'SoFlo', brand: 'SoFlo Vegans', regions: 'Miami &middot; Fort Lauderdale &middot; Palm Beach', banner: '/communities/south-florida/banner.jpg', alt: 'South Florida skyline with palm trees and water', area: 'Miami, Fort Lauderdale and Palm Beach', eventCities: SF, adPrefix: 've-sofl-hub', counties: SF_COUNTIES, featured: [{ title: 'Vegans Explore x Miami Dolphins: Plant-Based Game Night', place: 'Hard Rock Stadium, Miami Gardens', when: 'Date coming soon', badge: 'In Development', href: '/campaigns/plant-based-showcase-dolphins', cta: 'See the Showcase' }] } },
    { slug: 'central-florida', name: 'Central Florida', tz: 'America/New_York', match: { states: ['FL'], cities: CF }, places: CF, page: { short: 'CFlo', brand: 'CFlo Vegans', regions: 'Orlando &middot; Kissimmee &middot; Daytona', banner: '/communities/central-florida/banner.jpg', alt: 'Central Florida skyline with Lake Eola fountain', area: 'Orlando, Tampa Bay and Lakeland', eventCities: ['Orlando', 'Tampa', 'St. Petersburg', 'Kissimmee', 'Winter Park', 'Clearwater', 'Lakeland'], adPrefix: 've-central-florida-hub' } },
    { slug: 'atlanta', name: 'Atlanta', tz: 'America/New_York', match: { states: ['GA'] }, places: ['Atlanta', 'Decatur'], page: { short: 'ATL', brand: 'ATL Vegans', regions: 'Midtown &middot; Buckhead &middot; West End', banner: '/communities/atlanta/banner.jpg', alt: 'Atlanta skyline with highways and greenery', area: 'Atlanta, Decatur and the metro', eventCities: ['Atlanta', 'Decatur', 'Sandy Springs', 'Marietta', 'Alpharetta', 'Smyrna', 'East Point', 'College Park'], adPrefix: 've-atlanta-hub' } },
    { slug: 'dmv', name: 'DMV', tz: 'America/New_York', match: { states: ['DC', 'MD', 'VA'] }, places: ['Washington', 'Arlington', 'Silver Spring'], page: { short: 'DMV', brand: 'DMV Vegans', regions: 'Dupont Circle &middot; Capitol Hill &middot; Arlington', banner: '/communities/dmv/banner.png', alt: 'Washington D.C. skyline with the Capitol, Washington Monument, and the National Mall', area: 'D.C., Maryland and Northern Virginia', eventCities: ['Washington', 'Washington D.C.', 'Arlington', 'Alexandria', 'Bethesda', 'Silver Spring', 'Rockville', 'Falls Church', 'Reston', 'Tysons'], adPrefix: 've-dmv-hub' } },
    { slug: 'new-york', name: 'New York', tz: 'America/New_York', match: { states: ['NY'] }, places: ['New York', 'Brooklyn'], page: { short: 'NYC', brand: 'NYC Vegans', regions: 'Manhattan &middot; Brooklyn &middot; Queens', banner: '/communities/new-york/banner.jpg', alt: 'New York City skyline at sunset anime illustration', area: 'Manhattan, Brooklyn, Queens and beyond', eventCities: ['New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Jersey City', 'Hoboken'], adPrefix: 've-new-york-hub' } },
    { slug: 'philadelphia', name: 'Philadelphia', tz: 'America/New_York', match: { states: ['PA'] }, places: ['Philadelphia'], page: { short: 'Philly', brand: 'Philly Vegans', regions: 'Fishtown &middot; Rittenhouse Square &middot; Northern Liberties', banner: '/communities/philadelphia/banner.png', alt: 'Philadelphia skyline with City Hall, Comcast Center, and the Schuylkill Expressway', area: 'Philadelphia and its neighbors', eventCities: ['Philadelphia', 'Camden', 'Cherry Hill', 'King of Prussia', 'Conshohocken', 'Ardmore'], adPrefix: 've-philadelphia-hub' } },
    { slug: 'los-angeles', name: 'Los Angeles', tz: 'America/Los_Angeles', match: { cities: LA }, places: LA, page: { short: 'LA', brand: 'LA Vegans', regions: 'Los Angeles &middot; The Valley &middot; Long Beach', banner: '/communities/los-angeles/banner.jpg', alt: 'Los Angeles anime-style skyline illustration with palm trees at sunset', area: 'Los Angeles, the Valley and Long Beach', eventCities: ['Los Angeles', 'Santa Monica', 'Long Beach', 'Pasadena', 'Culver City', 'West Hollywood', 'Burbank', 'Glendale'], adPrefix: 've-los-angeles-hub' } },
    { slug: 'london', name: 'London', tz: 'Europe/London', match: { cities: ['London'] }, places: ['London'], page: { short: 'London', brand: 'London Vegans', regions: 'Shoreditch &middot; Camden &middot; South Bank', banner: '/communities/london/banner.jpg', alt: 'London anime-style illustration of Tower Bridge and the Shard at night', area: 'London, from Shoreditch to South Bank', eventCities: ['London'], adPrefix: 've-london-hub' } }
  ];
  var list = function (a) { return '(' + a.map(function (c) { return '"' + c + '"'; }).join(',') + ')'; };
  hubs.forEach(function (h) {
    var f = [];
    if (h.match.states) f.push('address_state=in.' + list(h.match.states));
    if (h.match.cities) f.push('address_city=in.' + list(h.match.cities));
    h.filter = f.join('&');
  });
  window.VE_HUBS = hubs;
  window.VE_HUB = function (slug) { return hubs.filter(function (h) { return h.slug === slug; })[0] || hubs[0]; };
})();
