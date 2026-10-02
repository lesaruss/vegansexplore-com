/* The Vegans Explore city hubs in one place (Sean, 2026-09-27), for pages that work across
 * communities: the Passport Challenge and Tours pick a hub, and each hub launches on its own.
 * `match` mirrors each hub's matchListing rule in /communities/<slug>/index.html (a listing is in
 * the hub when its city is in `cities` and its state in `states`, whichever are given); keep the
 * two in step when a hub's area changes. `filter` is the same rule as a PostgREST query string.
 * `places` are suggestions for a tour's city field.
 */
(function () {
  var SF = ['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade'];
  var CF = ['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala'];
  var LA = ['Los Angeles','West Hollywood','North Hollywood','Reseda','Canoga Park'];
  var hubs = [
    { slug: 'south-florida', name: 'South Florida', tz: 'America/New_York', match: { cities: SF }, places: SF },
    { slug: 'central-florida', name: 'Central Florida', tz: 'America/New_York', match: { states: ['FL'], cities: CF }, places: CF },
    { slug: 'atlanta', name: 'Atlanta', tz: 'America/New_York', match: { states: ['GA'] }, places: ['Atlanta', 'Decatur'] },
    { slug: 'dmv', name: 'DMV', tz: 'America/New_York', match: { states: ['DC', 'MD', 'VA'] }, places: ['Washington', 'Arlington', 'Silver Spring'] },
    { slug: 'new-york', name: 'New York', tz: 'America/New_York', match: { states: ['NY'] }, places: ['New York', 'Brooklyn'] },
    { slug: 'philadelphia', name: 'Philadelphia', tz: 'America/New_York', match: { states: ['PA'] }, places: ['Philadelphia'] },
    { slug: 'los-angeles', name: 'Los Angeles', tz: 'America/Los_Angeles', match: { cities: LA }, places: LA },
    { slug: 'london', name: 'London', tz: 'Europe/London', match: { cities: ['London'] }, places: ['London'] }
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
