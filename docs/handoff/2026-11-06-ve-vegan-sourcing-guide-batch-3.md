# ve-vegan-sourcing-guide: batch 3, pasteurizing, HPP, tempeh and a nationwide plant-based wholesaler (Logan, 2026-11-06, Eastern)

Migration `20261106_sourcing_batch_3.sql`, applied. No Google calls (ledger unchanged, $31.42 of $50 left). No code change; `ve-sourcing` stays v4.

**Added (4), every bio from web search, every bio_source saying "confirm before ordering"**
- **Hiperbaric** (Spain), Equipment: high pressure processing machines for cold-pressed juice and plant milks; notes that small producers usually start with an HPP toller.
- **PRO Engineering / Manufacturing** (Milwaukee), Equipment: batch and tunnel pasteurizers for bottled and canned drinks, including small single-temperature units.
- **Tempeh Today (Schouten Europe)** (Netherlands), Equipment: a small-scale tempeh fermentation unit with training and monitoring; reports cover India only.
  Schouten Europe stays listed separately under food.
- **VEDGEco** (US), Fully vegan company: an only-plant-based wholesaler for restaurants and independent grocers (Hawaii, Northern California, Georgia
  warehouses reported; bought by Vejii in 2022). Little recent news, so its bio says confirm it is still shipping.

Machinery 9, Distributors 7, **236 active**. Kinds were worded so no Buy or make pattern picks them up (and both domains sit outside `MAKE_DOMAINS` anyway).

**Checked live** through `ve-sourcing` as the Logan test account (a Guide owner, not a super admin), with a five-minute token from the one-time
`ve-once-sourcing-proof` (back to the 410 stub): `list` machinery 9 and distribution 7 with all four new rows and their labels, `get` VEDGEco,
`make` still 14 of 14 with the same counts; every call 200.

**Looked for and left out**
- A dedicated **tempeh incubator** maker: none found beyond patents, DIY builds and fermentation cabinets. Tempeh Today is the only packaged system.
- **Small-batch tofu machines**: only marketplace listings (Alibaba and similar) with unverified certifications; Takai and Yung Soon Lih stay the honest picks.
- **PLOW** (Austin): ran a plant-based distribution arm in 2018 to 2021; no sign it still does.
- **Jacmar** (California, Nevada) and the broadline distributors (Sysco, US Foods, KeHE): carry some plant-based lines but are not a Vegan range a restaurant could
  find through them; left out until there is a reason to list a broadliner.

**Open**
- Sean: Liz's Sourcing line (`docs/proposals/liz-audio-scripts.md`) still waits for his read; nothing recorded.
- Logan: regional US distributors in the Southeast and Texas with a real Vegan range, and a US HPP toller list (Hiperbaric names states, not companies), a handful at a time.
