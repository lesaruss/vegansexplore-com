-- canon-front-print-placement: 3.0 in (size L) -> 2.0 in on every size.
-- Sean, 2026-11-09: "yes, change it to 2 inches", after his GeekFon Society XL tee (printed at 3.0 in)
-- measured about 50 percent further from the collar than a Target XL tee (same paper strip as a ruler).
-- Applied live 2026-11-09 (knowledge_records version trigger took it to v5). Safe to run twice.
update knowledge_records set
 title = 'Front print placement: top of art 2.0 inches below the collar seam, every size (Sean, 2026-11-09)',
 body = body || jsonb_build_object(
   'rule','Front chest prints on adult tees: the TOP of the visible artwork sits 2.0 inches below the front collar seam, on every size (checked on L, XL and 2XL). Tolerance plus or minus 0.2 inches. Anchor by the top of the art, never by the image center.',
   'proof','Before showing any front print, pull the Printify front mockups for L, XL and 2XL and measure collar seam to art top in inches (use art width in inches as the ruler). Pass is 1.8 to 2.2 on each size. Report the number for each size.',
   'how_to_compute','Bella+Canvas 3001 on provider 39: front print area for L and up is 3692x4800 px at 300 dpi, and its top edge sits 2.06 inches below the collar seam in Printify mockups (calibrated 2026-10-08). 2.0 in is at or just above that edge, so place the art top AT the print-area top: target px = 0. With image scale s (fraction of print-area width), file size w x h and alpha bbox top b: image height ih = s x 3692 x h / w, then y = (0 - b x ih / h + ih / 2) / 4800. x stays 0.5. Crop print files to their alpha bbox so b = 0. That lands about 2.06 in on L, inside tolerance. Re-measure XL and 2XL: if the print area sits lower on those sizes, report the number to Sean (the provider cannot print above its print area). Other blanks: recalibrate the offset from one mockup first.',
   'v4_origin','Sean, 2026-11-09: "change it to 2 inches." Evidence: his GeekFon Society Logo Tee (XL, placed at the v3 3.0 in rule) photographed beside a Target XL tee with the same paper strip as a ruler: collar seam to print top about 1.55 strips on the GeekFon tee vs 1.05 on the Target tee, about 50 percent lower. He had said the print sat "just a tad too low."',
   'superseded_value','v1-v3 (2026-10-08): 3.0 in on size L.',
   'lookbook', replace(body->>'lookbook','Place the top of the art 3.0 in below the collar seam at that scale.','Place the top of the art 2.0 in below the collar seam at that scale (v4, 2026-11-09; the 2026-10-08 shots used 3.0).')),
 change_summary = 'v4: target moved from 3.0 in (size L) to 2.0 in on every size, on Sean''s yes 2026-11-09 after the GeekFon vs Target collar comparison.',
 updated_by = 'logan', updated_at = now()
where slug = 'canon-front-print-placement' and body->>'rule' not like '%2.0 inches%';
