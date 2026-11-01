# Source and accuracy audit — Urban Haven 2.1.1

Reviewed **2026-11-01, America/New_York**. This package replaces the earlier 2.1.0 download. The audit found substantive issues and corrected them; a successful build alone would not have detected those issues.

## Scope

The review compared the water procedures, all 15 pantry groups, 23 recipes, 19 crop profiles, 10 gardening articles, 78 frost-station rows, the 10 prolonged-care guides, basic medical/sanitation/climate guidance, pet material and relevant interface wording with primary government, clinical-service and university-extension sources. Remaining infrastructure guidance was inspected for electrical, generator, fire, flood, shelter and communication limits. Code checks cover arithmetic, storage, backups and malformed inputs. This is an editorial and source audit, not independent clinical certification or a field/kitchen trial.

## Corrections applied

| Area | Finding | Resolution in this package |
|---|---|---|
| Date meaning | Inventory called every past date expired. | Separate quality, expiry and review/rotation choices. Past dates are conservatively excluded pending review, without declaring food unsafe. Legacy dates remain review dates until classified. |
| Water rotation | Undated commercial water was assumed self-filled; 182 days approximated six months. | Explicit commercial/self-filled/unknown type. Six calendar months apply only to identified self-filled water; an earlier entered date wins. Unknown legacy water prompts classification rather than a false inference. |
| Flood exposure | Sealed-container wording implied screw-cap bottles could be salvaged by exterior cleaning. | Remove that exception; specify affected closures and approved alternative supplies. Food recovery requires the full FDA process, not the former abbreviated bleach recipe. |
| Wells | Well-pit wording allowed an exception, and clean coliform results sounded like complete clearance. | No well-pit entry; qualified professionals and local health-department clearance. Coliform results do not rule out chemicals. |
| Water procedures | Freshness of bleach and local-use qualifications were incomplete. | Add age/storage/concentration checks and advisory-specific washing/bathing language. Preserve the distinct published CDC and EPA tables; do not mathematically normalize their drop equivalents. |
| Infant feeding | Generic cooled-water advice omitted higher-risk infants and lacked a complete offline storage reference. | Add an offline formula guide with ready-to-feed preference when formula is needed, higher-risk powder precautions, exact mixing, use-by and prepared-feed limits. |
| Pantry | Quality ranges and ambient-temperature wording were unclear; one nuts source did not support both opened and unopened examples. | Label quality conditions, clarify time/temperature concepts, add the applicable source and retain exact-product exceptions. |
| Recipes | Generic cold-soaked oats were treated as safe across products; jam storage was overgeneralized. | Require explicitly ready-to-eat cereal for that no-cook recipe. Follow spread labels/single portions. Ordinary oats tagged in inventory no longer satisfy the cereal requirement. The old recipe ID is retained for saved-plan compatibility. |
| Recipe quantities | Couscous planner counted 0.4 of a 10-oz box while using about 170 g. | Use 0.6 of the stated box and explicit instant-product directions. Package and water figures remain estimates requiring actual-label checks; the planner is not a nutrition-completeness certificate. |
| Seeds | A lamp/sun conversion, a fixed germination interval and an unsupported replacement-rule attribution remained. | Remove universal lighting conversion; use crop/fixture instructions, packet-specific germination timing and clearly attributed viability interpretation. |
| Seed food safety | Clean trays/intended-use seed could be read as a raw-crop safety guarantee. | Add seed-borne pathogen and recall limits. Do not use treated or recalled seed; distinguish microgreens from whole sprouts. The app has no live recall feed. |
| Planting dates | Fall cabbage's transplant date was labeled sowing; fall peas used spring maturity. | Separate fall seed start and outdoor target, include seedling time, use fall pea maturity, and label the 14-day buffer as an app assumption. Reconcile crop-specific seedling/soil defaults. |
| Harvest meaning | Broad harvest ranges hid differences in stage, method and cultivar. | Add harvest-stage notes; qualify seed potatoes, dry beans, indoor greens, onion methods and tomato containers. |
| Medical escalation | Dental, burn and young-infant respiratory warnings were weaker than source urgency. | Strengthen immediate-care wording, harmonize thermal-burn cooling guidance, and clarify medicine expiry, antibiotics and interrupted essential treatment. No new drug doses are generated. |
| Pets | One older food guide used a shorter planning target; wet-food handling and veterinary medicine qualification needed clarity. | Align with the two-week plan, keep individualized quantities, add FDA storage actions and permit human medicines only when a veterinarian specifically directs their use for that animal. |
| Source labels | Content update dates were presented as if they proved universal verification. | Distinguish content/reference records from an audit. Retain historical source dates; this report states the actual review scope and retrieval limits. |

## Confirmed, with conditions

- The principal CDC/EPA water quantities, boil times and disinfection tables match their respective sources. Differences between the agencies' published tables are retained and identified.
- All 78 spring frost rows match the official MSU table's five date columns. The source's historical period is not specified; it is not a current forecast or an autumn-frost table.
- The numeric seed-life examples match the cited Iowa State ideal-storage table. They predict planting viability, not edible safety or guaranteed germination. Primed/pelleted seed needs separate treatment.
- Pantry quality examples broadly match Nebraska, NMSU, USDA and product-specific guidance. Opened products, packaging, temperature and labels can invalidate a generic unopened estimate.
- Generator/CO, damaged-battery, flood/electrical, private-land, manual-path and receiver-band limitations are retained. No station uptime or safe route is certified.

See **SHELF_LIFE_REFERENCE.md** for the compact storage table and conditions, and **TEST_RESULTS.md** for software evidence.

## Primary-source references

| Scope | Principal references actually consulted |
|---|---|
| Water storage/treatment | [CDC emergency supply](https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html), [CDC treatment](https://www.cdc.gov/water-emergency/about/index.html), [EPA disinfection](https://www.epa.gov/ground-water-and-drinking-water/emergency-disinfection-drinking-water), [CDC advisories](https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html), [CDC wells](https://www.cdc.gov/water-emergency/about/how-to-disinfect-wells-after-an-emergency.html), Michigan EGLE emergency private-well sheet cited in the app |
| Food | [Nebraska storage chart](https://food.unl.edu/free-resource/food-storage/), [NMSU E-118](https://pubs.nmsu.edu/_e/E118/), [USDA canned-food Q&A](https://ask.fsis.usda.gov/article/How-long-can-you-keep-canned-goods), [FDA floods](https://www.fda.gov/food/food-safety-during-emergencies/floods-key-tips-consumers-about-food-and-water-safety), [FoodSafety.gov outage chart](https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage), Virginia Tech storage table and manufacturer preparation directions recorded in PANTRY_COOKING_SOURCES.md |
| Seeds/growing | [Iowa storage/testing](https://yardandgarden.extension.iastate.edu/how-to/how-store-seeds-and-test-germination-rates), [MSU test](https://www.canr.msu.edu/news/a_simple_seed_germination_test_may_be_a_deal_breaker), MSU crop-specific guidance cited in crop records, [UMN fall planting](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/planting-vegetables-in-midsummer-for-fall-harvest), [Minnesota seed handling](https://www.mda.state.mn.us/sites/default/files/docs/2026-05/Seed_Storage_Handling_Guidelines.pdf), [FDA 2026 seed outbreak](https://www.fda.gov/food/outbreaks-foodborne-illness/outbreak-investigation-salmonella-sprouts-september-2026) |
| Medical/infants | [NHS dental abscess](https://www.nhs.uk/conditions/dental-abscess/), [Red Cross burns](https://www.redcross.org/take-a-class/resources/learn-first-aid/burns), [NHS burns](https://www.nhs.uk/conditions/burns-and-scalds/), CDC respiratory/wound/heat/cold guidance, [CDC formula](https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html), [FDA expired medicines](https://www.fda.gov/drugs/special-features/dont-be-tempted-use-expired-medicines), FDA post-disaster drug guidance and CDC antibiotics guidance cited in the app |
| Pets | [CDC kit](https://www.cdc.gov/healthy-pets/emergency-preparedness/preparedness-kit.html), [FDA food storage](https://www.fda.gov/animal-veterinary/animal-health-literacy/proper-storage-pet-food-treats), CDC pet-food safety, FDA pet-medication-error guidance and relevant sections of [AVMA Saving the Whole Family](https://ebusiness.avma.org/files/productdownloads/STWF_English.pdf) |

## Access and confidence limits

Some canonical MSU, FEMA/Ready.gov and USDA pages returned 403 to the research service. Equivalent official MSU HTML, accessible government guidance and USDA Q&A supported the relevant claims. Several AVMA pages returned an iframe rather than readable text; relevant AVMA PDF sections and CDC/FDA sources were used. Search extracts or blocked bodies are not represented as independently content-checked pages. Source links can redirect, change or fail later, and offline content cannot receive live alerts or recalls.

No universal safe life is claimed for opened water, all pet foods, all seed packets or all medicines. Actual labels, lot recalls, storage history and individual medical/veterinary instructions take priority. The audit does not validate an individual product already owned by a household without that product's label and history. Recipe palatability, actual crop yields, field navigation, broadcast reception and physical Android offline operation were not tested in this audit.
