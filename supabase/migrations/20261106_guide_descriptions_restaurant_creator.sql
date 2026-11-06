-- ve-restaurant-guide: the Guide list's words match the Guides as they are now (2026-11-06).
-- Restaurant Guide: its locked name, Top challenges (not "the fixes in order"), Sourcing, the page and dashboard, free with its survey.
-- Creator Guide: Kai narrates since 2026-10-30, and the last step is Become a creator.
update ve_guides set title = 'The Vegan Restaurant Guide',
  description = 'For 100% Vegan restaurants: a free check of how your place looks to people searching, the top challenges Vegan restaurants run into, Vegan suppliers for what you buy, your page and dashboard, our interviews with owners and the promotions we run. Free with a short survey. With Liz as your Guide.'
where slug = 'vegan-restaurant-guide';
update ve_guides set
  description = 'Ten moves to go from hobbyist to professional Vegan creator, each with a real creator doing it and three action items, the creators and channels in our Directory, our creator episodes, and how to become one of our official creators. Free with a short survey. With Kai as your Guide.'
where slug = 'creator-guide';
