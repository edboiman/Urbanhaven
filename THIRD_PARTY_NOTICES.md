# Third-party notices

Original application code, guide prose, recipes, checklist definitions, the SVG illustration/icon and the household workbook: MIT, see `LICENSE`.

## Runtime software (bundled into the app)

| Component | License | Notes |
|---|---|---|
| React, React DOM, scheduler | MIT | Bundled by esbuild; license text in `dist/assets/*.LEGAL.txt` |
| PDF.js (`pdfjs-dist`) incl. worker, CMaps, standard fonts, WASM decoders | Apache-2.0 (with bundled third-party notices for fonts and decoders) | Copied to `dist/pdfjs/` with their LICENSE files — do not remove them |
| Lucide icon geometry | ISC (© Lucide Contributors) | 67 icons regenerated into `src/components/icons.tsx` by `scripts/generate-icons.mjs`; no runtime icon package |

## Build and test tools (not shipped)

esbuild (MIT), TypeScript (Apache-2.0), Playwright (Apache-2.0), @types/react, @types/react-dom, @types/node (MIT).

## Map data (shipped in `public/maps/`)

| Data | License |
|---|---|
| Natural Earth 1:10m vector data — land, minor islands, lakes, rivers, North America roads, admin-1 lines, US counties, parks | Public domain (naturalearthdata.com). “Made with Natural Earth.” |
| U.S. Census Bureau 2025 Gazetteer (places, county subdivisions) and ACS 2023 population | Public domain (U.S. government works) |
| USGS Geographic Names Information System populated places | Public domain (U.S. government work) |
| Retrieval of Census/GNIS files via `github.com/bdurand/us_geo` | Repository code MIT; the data files are the public-domain government works above |

No OpenStreetMap data or tiles, web fonts, remote images or AI-generated images are used.

## Referenced publications

The app links CDC, EPA, FEMA/Ready.gov, U.S. Fire Administration, USDA FSIS, FoodSafety.gov, Michigan EGLE, MI Ready, NWS, MSU Extension, University of Minnesota, UW–Madison, Colorado State, Illinois and Clemson extension pages, and Public Health – Seattle & King County. Their websites and publications are not relicensed by this project. Guides, checklists and recipes are original summaries of factual recommendations with attribution, not copies. The frost-probability values are facts from a Michigan State Climatologist table, cited with its URL.
