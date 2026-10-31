# Offline Michigan map — data, packaging and rebuild procedure

Reviewed 2026-10-31.

## What the map is

A vector map drawn on an HTML canvas by Urban Haven's own renderer (`src/map/render.ts`). All geometry, labels, the place-name search index and attribution are stored on the device. There is no tile server, no online map embed, no web font, and no OpenStreetMap data or tiles. Labels use the phone's built-in system font.

| | Bundled overview (always offline) | Optional regional detail packs |
|---|---|---|
| Coverage | Michigan (both peninsulas, Isle Royale and other islands present in the source) plus neighboring shores, lon −92.6…−80.4, lat 40.9…49.0 | Upper Peninsula & Isle Royale; Northern Lower Peninsula; Southern Lower Peninsula (overlapping bands) |
| Contents | Land, Great Lakes and inland lakes, major rivers, county and state lines, interstate / US / primary / secondary highways, parks; 3,899 searchable places | All Natural Earth road classes (adds “other paved” county roads and ferries), more rivers, less-simplified shapes |
| Simplification | ≈ 450 m (small islands and lakes kept at ≈ 90 m) | ≈ 35 m (limited by the 1:10 m source itself) |
| Zoom | 5 – 9 | 8 – 12 (maximum zoom of the app is 12) |
| Size | 133 KB (gzip) | UP 40 KB, NLP 24 KB, SLP 45 KB (gzip), split into 16 KB parts |

**Honest limits.** The geometry comes from Natural Earth's 1:10,000,000-scale data. Shorelines and road positions can be off by hundreds of metres to about a kilometre. At zoom 10–12 the map is good for “which town, which highway, which side of the bay”, not for streets. There are no street names, addresses, routing, closures or facility status. Place points (Census internal points, USGS coordinates) are more precise than the roads drawn around them.

## Why these sizes and this packaging

The task asked for a size calculation before downloading substantial data. With the sources that were reachable, the whole statewide dataset is only ~240 KB compressed, so storage is not a constraint. The overview is bundled into the core offline install (it is precached and hash-verified with the app). Detail packs are still separate and optional because:

1. the pack machinery (per-part SHA-256, resume, delete, version tracking, warning when a region is missing) is required and is what lets a future, much larger, higher-detail dataset (for example Census TIGER roads, roughly tens of MB statewide) be added without making every install download it; and
2. a household that only cares about one peninsula stores less.

Packs live in Cache Storage under `urban-haven-maps-v1-<scope>`, separate from the versioned app caches, so app updates never delete them. Metadata (version, hashes, part list) is in IndexedDB `mapPacks`. Each pack is gzip-compressed JSON (integer Web-Mercator coordinates, delta encoded), split into 16 KB `.bin` parts listed in `maps/catalog.json` with their sizes and SHA-256. Download fetches each missing part with `?__network=` (bypassing the service worker), checks size and SHA-256 before storing it, and after all parts checks the whole-file SHA-256 and decodes the result. An interrupted download keeps verified parts; **Resume** fetches only the missing ones. Browser test `e2e/packs.e2e.mjs` covers interruption (HTTP 503), a corrupted part, resume and deletion.

### GitHub Pages, range requests, memory, Android storage

* No HTTP range requests are needed: packs are whole small files, so it does not matter whether a host or a cache honors `Range`. (GitHub Pages does serve ranges, but Cache Storage cannot answer range requests without extra code — another reason the format avoids them.)
* `.gz` files are served as opaque bytes and decompressed in the browser with `DecompressionStream` (Chrome 80+ / Android System WebView). GitHub Pages' own transfer compression does not interfere because the stored bytes are already gzip.
* Memory: the decoded overview is a few MB of typed arrays; each pack well under that. Drawing culls by bounding box and skips sub-pixel segments, so phones redraw smoothly while panning (checked in Chromium mobile emulation; still to be confirmed on low-end Android hardware).
* Android storage: Chrome can evict site data under storage pressure unless persistent storage is granted. The app requests persistence on the Offline page; map packs and the core install are re-verified there and on the Map page.

## Sources and licenses

| Data | Source | Version / retrieval | License |
|---|---|---|---|
| Land, minor islands, lakes, rivers & lake centerlines (global + North America), North America roads (shapefile), admin-1 state/province lines, US counties, parks | Natural Earth 1:10m vector | `github.com/nvkelso/natural-earth-vector`, commit `ca96624a56bd078437bca8184e78163e5039ad19` (2022-06-02), VERSION 5.2.0-pre | Public domain |
| City / village / CDP names and internal points | U.S. Census Bureau 2025 Gazetteer, places (`2025_Gaz_place_national.txt`) | via `github.com/bdurand/us_geo` (`data/raw/gazetteer/`) | Public domain (U.S. government work) |
| Township (county subdivision) names and points | U.S. Census Bureau 2025 Gazetteer, county subdivisions | same | Public domain |
| Small communities not in Census lists | USGS GNIS populated places (`data/processed/gnis_non_census_places.csv`) | same | Public domain |
| Label ranking only | ACS 2023 5-year population (B01003) | same (`data/raw/demographics/`) | Public domain |
| Water-body label positions | Placed by the app authors | — | MIT (this project) |

The `us_geo` repository's code is MIT licensed; the data files it redistributes are U.S. government public-domain works. Attribution is shown on the map (“Natural Earth · US Census · USGS GNIS”) and in full under **Map → What this map shows → Data sources & licenses**, both available offline.

## Reproducible rebuild

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/nvkelso/natural-earth-vector.git ne
cd ne && git checkout ca96624a56bd078437bca8184e78163e5039ad19 2>/dev/null; git sparse-checkout set --no-cone \
  /geojson/ne_10m_admin_1_states_provinces.geojson /geojson/ne_10m_lakes.geojson /geojson/ne_10m_lakes_north_america.geojson \
  /geojson/ne_10m_rivers_lake_centerlines.geojson /geojson/ne_10m_rivers_north_america.geojson /geojson/ne_10m_admin_2_counties.geojson \
  /geojson/ne_10m_minor_islands.geojson /geojson/ne_10m_parks_and_protected_lands_area.geojson /geojson/ne_10m_land.geojson \
  /10m_cultural/ne_10m_roads_north_america.shp /10m_cultural/ne_10m_roads_north_america.dbf \
  /10m_cultural/ne_10m_roads_north_america.shx /10m_cultural/ne_10m_roads_north_america.prj /LICENSE.md /VERSION
cd ..
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/bdurand/us_geo.git us_geo
cd us_geo && git checkout HEAD -- data/raw/gazetteer/2025_Gaz_place_national.txt data/raw/gazetteer/2025_Gaz_cousubs_national.txt \
  data/processed/gnis_non_census_places.csv data/raw/demographics/place_2023.json data/raw/demographics/county_subdivision_2023.json
cd ../urban-haven
npm run map:data -- ../ne ../us_geo     # writes public/maps/{overview.json.gz,catalog.json,packs/…}
npm run build
```

The script prints each pack's size, part count and feature counts. Bump `DATA_VERSION` in `scripts/map/build-map-data.mjs` whenever the data change; installed packs then show “update available”.

## Investigated and rejected

* **OpenStreetMap tiles** — bulk downloading standard OSM tiles violates the tile usage policy. Not used.
* **Census TIGER/Line 2010 ZCTA polygons as detailed land** (GitHub mirror `OpenDataDE/State-zip-code-GeoJSON`) — rejected after rendering them: several ZCTAs (Drummond Island, Les Cheneaux, Munising/Grand Island, Big Bay) include large areas of Great Lakes water, which would draw water as land. Showing false land is worse than showing a generalized coastline.
* **Census TIGER roads, Geofabrik OSM extracts, Protomaps builds, Overture** — the build environment could not reach those hosts (only GitHub was reachable). They remain the natural upgrade path; a TIGER primary/secondary roads layer would need a new pack version and a field mapping (MTFCC → road class) that has **not** been written or tested.
* **MapLibre GL / PMTiles** — standard choice, but needs glyph PBFs or a font server for labels and a larger runtime; npm packages could not be installed here. The custom canvas renderer is ~600 lines, uses system fonts, and was testable end to end.
