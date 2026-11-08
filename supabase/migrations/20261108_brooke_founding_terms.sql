-- brooke-sellers: founding terms (Sean, 2026-11-08): setup fee waived and a discounted
-- monthly rate, earned by being with Sean since 2024; in return, real-time feedback
-- so we work out the bugs and the process with a real person.
update ve_branddesk_accounts
set plan_line = 'Founding partner: setup fee waived and a discounted $200 a month for being with us since 2024. Billed by LESARUSS Inc. from November 30, 2026',
    note = 'Founding partner since 2024. Setup fee waived and the monthly rate discounted to $200 (standard: the setup, then $500 a month), for sticking with Sean since 2024 (Sean, 2026-11-08). The value to us: her real-time feedback, so we work out the bugs and the process with a real person. Billed on the LESARUSS Stripe account through HQ client billing (client_billing_plans fb28f444, first charge Nov 30, 2026). No BrandDesk Stripe subscription: Pause and End it in the Depot do not apply. Setup counts as paid, so her Library downloads are open.'
where id = '26572b91-50fd-473f-9dce-52c3c55def3b';

update ve_people_outreach
set body = replace(body,
  E'One more thing. Your old monthly subscription closed out',
  E'One more thing, and thank you. You''ve been with me since 2024, so your setup fee is waived and your monthly rate is discounted. All I ask in return is what you already do: tell me what works and what doesn''t as you use it, so we can work out the bugs and the process with a real person before anyone else comes on.\n\nYour old monthly subscription closed out')
where id = '4fbbd9f4-9c2b-4b3d-b597-d8de794999cd' and status = 'draft'
  and body not like '%setup fee is waived%';
