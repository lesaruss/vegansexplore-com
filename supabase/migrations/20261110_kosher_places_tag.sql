-- ve-holiday-guide: Kosher Places for the Hanukkah section (Sean, 2026-11-10: "we could show restaurants that are kosher... for Hanukkah").
-- The tag `kosher` on food places whose own description says they are kosher, kosher certified or cook in a kosher kitchen (read one by
-- one, 2026-11-10). Left out: places that only say an ingredient is kosher (Pizza Verdura Sincera) or offer "kosher choices" or dishes
-- (Bodhi Village, Moss Cafe, Maoz Vegetarian). The Guide shows them as each place describes itself and asks people to check with the
-- place. Safe to run twice.
update listings set tags = array_append(coalesce(tags, '{}'), 'kosher'), updated_at = now()
where status = 'approved' and not ('kosher' = any(coalesce(tags, '{}'))) and slug in (
  'sen-saigon', 'v-spot', 'noshy', 'p-s-kitchen', 'sentir-vegan-mexican-restaurant', 'love-life-cafe', 'sweet-love-vegan-gluten-free', 'bunniecakes',
  'anixi', 'erin-mckennas-bakery', 'pow-pow-franklin-square', 'say-she-ate', 'joey-s-home-bakery-boynton-beach', 'nana-good-eats',
  'fruitive-healthy-food-smoothies', 'siena-s-vegetarian-pizzeria-restaurant', 'around-the-table-catering', 'dikla-delicious-gluten-free-kosher-bakery',
  'grand-cafe-hollywood', 'erin-mckenna-s-bakery', 'erin-mckenna-s-bakery-la');
