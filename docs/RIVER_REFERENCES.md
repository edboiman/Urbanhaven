# Michigan river geographic reference points

Checked 2026-10-31. Data file: `src/content/michigan-river-references.json`.

## Purpose and limitations

These six points identify named rivers using official USGS monitoring-location coordinates. They are **river geographic references**, not verified drinking-water sources, public access points, boat launches, safe or legal crossings, shelters, or navigation destinations. A historic sampling or streamgage record does not establish present-day access or equipment. No current flow, flood stage, water-quality result, warning or operating status is bundled.

Water near any marker may be contaminated or unsafe to approach. The point metadata does not establish potability, a safe bank, road access, ownership, permission, or a safe crossing. Local restrictions, closures, weather, flooding and current conditions require independent checks.

## Coordinate verification

Coordinates were retrieved directly from the USGS Water Data OGC API's `monitoring-locations` collection. For each identifier the response's official `monitoring_location_name`, stream site type, Michigan state, `geometry.coordinates`, horizontal-position method and accuracy were inspected. GeoJSON supplies **longitude, latitude**; the content file explicitly stores these as `lon` and `lat`. The human-readable USGS location pages label the decimal coordinates as WGS84.

The JSON rounds those geographic coordinates to six decimal places for consistent serialization. This precision is not a claim of survey accuracy. In particular, three original source locations have **±1 arc-minute** stated horizontal accuracy, roughly a kilometre or more depending on direction at Michigan latitudes. They must remain visibly approximate. Do not snap these markers to a road, parcel, trail, riverbank or access site.

| Geographic reference | USGS ID | Latitude, longitude (decimal degrees) | USGS horizontal method / accuracy | Record-use limitation |
|---|---|---|---|---|
| Grand River at Grand Rapids | 04119000 | 42.963082, -85.677253 | Map interpolation; ±1 arc-minute | Geographic reference only; no live data bundled |
| Huron River at Ann Arbor | 04174500 | 42.286954, -83.733774 | Map interpolation; ±1 arc-second | Geographic reference only; no live data bundled |
| Kalamazoo River at Comstock | 04106000 | 42.285597, -85.513893 | Map interpolation; ±1 arc-minute | Geographic reference only; no live data bundled |
| Saginaw River at Saginaw | 04157000 | 43.412803, -83.963029 | Map interpolation; ±1 arc-minute | Historical continuous record ends 2011; sample record extends to 2017 |
| Tahquamenon River near Paradise | 04045500 | 46.574583, -85.269639 | Differential GPS; ±0.1 arc-second | Geographic reference only; no live data bundled |
| Detroit River at Detroit | 04165700 | 42.347260, -82.958528 | Map interpolation; ±1 arc-second | Historical sample record, 1969–1986; no continuous data listed |

The monitoring-location API also supplies an original horizontal datum: NAD27 for the five map-interpolated locations and NAD83 for the Tahquamenon differential-GPS location. The file uses the API's published geometry, which agrees with the USGS pages' WGS84 decimal coordinates, rather than reinterpreting old degrees/minutes/seconds from historic annual reports.

## Historic records

- **Saginaw, 04157000:** the official location page lists continuous discharge data for 2008–2011, field measurements through 2012 and discrete samples through 2017. The map note explicitly calls it a historic location and does not imply a current gauge.
- **Detroit, 04165700:** the official page lists no continuous, daily or field-measurement data types and discrete samples spanning 1969–1986. It is retained as a named-river geographic reference, explicitly labeled as a historic sampling location.
- The other four points also remain geographic references in this app. An active official record would not make a bundled offline coordinate a live river-condition report.

## Primary sources

- **Grand River at Grand Rapids (04119000)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04119000/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04119000?f=json).
- **Huron River at Ann Arbor (04174500)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04174500/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04174500?f=json).
- **Kalamazoo River at Comstock (04106000)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04106000/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04106000?f=json).
- **Saginaw River at Saginaw (04157000)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04157000/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04157000?f=json).
- **Tahquamenon River near Paradise (04045500)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04045500/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04045500?f=json).
- **Detroit River at Detroit (04165700)** — [USGS location page](https://waterdata.usgs.gov/monitoring-location/USGS-04165700/); [USGS metadata API](https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-04165700?f=json).

The API metadata was fetched directly from `api.waterdata.usgs.gov`; direct fetching of the human-facing `waterdata.usgs.gov` pages returned HTTP 403 in this environment. Official indexed page content was used to cross-check the displayed WGS84 metadata labels and historical record spans. No third-party coordinate directory was used.

## Refresh procedure

Re-request each official metadata API item and confirm its identifier, stream site type, state, name, coordinate order, datum presentation, positional method and positional accuracy. Compare the human-facing record for historical status; retain limitations when current data are absent. If a point must become an access site, obtain a separate authoritative access/ownership source and add a new, clearly classified feature rather than changing the meaning of this reference dataset. Preserve IDs and update `checked` only after rechecking.
