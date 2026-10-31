# Content standards and update procedure

Every guide has ID, title, category, summary / why it matters, conditions, supplies, numbered steps, warnings, mistakes, alternatives, quick reference, source organizations / titles / HTTPS URLs / checked dates, update date, region, tags and related IDs. All essential prose is bundled locally. Source links are optional online references. Warnings appear before optional details, and emergency reading mode hides nonessential sections.

The 67 guides cover 10 categories (2.0 added a Michigan private-well guide and updated four water guides). These are completed priority topics, not a claim that every possible emergency or every subtopic from the specification has a dedicated article. Sources were opened and reviewed on 2026-10-31. Category research notes record important claim limits. Source checking is not a claim of clinical, engineering or emergency-management peer review.

Source priorities: CDC / EPA for water; public-health authorities for sanitation; USDA / FoodSafety.gov for food; FEMA / Ready.gov for preparedness; NWS / NOAA for weather; public safety and recognized first-aid organizations for emergency care; university extension for gardening. Current local orders override generic guidance. Individual medical / technical situations require professional advice.

## Safety editorial rules

- Never suggest boiling, ordinary portable filters or household disinfectants remove toxic chemicals or radioactivity.
- Water disinfectant doses must specify product suitability, concentration, measured volume, clarity / cold adjustments and contact time. No universal dose for other formulations.
- No invented medication doses, clinical diagnoses, electrical repairs, gas reconnection instructions or survival guarantees.
- Food temperature history matters; do not use smell / taste to judge safety. Garden harvest times are approximate and cultivar-dependent. Regional dates are not guarantees.
- No automatic copyrighted publication redistribution. Guide text is original paraphrase of verified public facts. Source websites remain third-party works; full external PDFs are not bundled. The workbook is an original planning aid.

## Edit and release

1. Locate each source, compare current guidance and record review date. If inaccessible or uncertain, omit the claim or describe the exact limitation instead of inventing a citation.
2. Update the JSON and affected category source note. Keep IDs stable so favorites / links remain valid. Add appropriate search tags.
3. Have a qualified independent reviewer check changes before treating the app as a safety-critical production reference.
4. Run `npm run check`; inspect the affected article in both regular and emergency reading mode.
5. Recheck linked related IDs and source URLs. Automated schema validation cannot establish factual accuracy or future URL availability.
6. Deploy; test new cache activation with existing personal data, then test airplane mode and cold restart on real Android.

Independent editorial sign-off is outstanding. The app labels this limitation; do not remove it without an actual review.
