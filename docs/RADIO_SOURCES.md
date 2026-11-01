# Michigan radio directory — source review

Reviewed 2026-10-31. Data file: `src/content/radio-stations.json`.

## Scope and use

The bundled directory contains all **28 NOAA Weather Radio transmitters located in Michigan** in the NWS Michigan station listing and a curated **20 AM/FM public or news stations** covering both peninsulas. It is an offline frequency reference for a separate receiver. There are no audio streams, live transmitter checks, guaranteed service areas, guaranteed emergency programming or uptime promises.

The `area` values identify transmitter communities or broad listening regions, not reception boundaries. A usable signal depends on the receiver, antenna, terrain, structures, interference and transmitter availability. Michigan border areas may receive an out-of-state NOAA transmitter that this in-state list does not include. The NWS county/station search is the appropriate online source for county alert coverage.

## NOAA verification

The station page builds its table from the official [NWS transmitter dataset](https://www.weather.gov/source/nwr/JS/ccl-data.js). The dataset was retrieved directly, parsed as JSON after its `var cclData =` assignment, filtered to `sitestate == "MI"`, and compared with the NWS Michigan station listing. Call signs, site names and frequencies are taken from those records. Each row in the bundled JSON links to that transmitter's NWS detail page. The dataset's temporary `status` field is deliberately not bundled because an offline value becomes stale.

| Call sign | NWS site name | Frequency |
|---|---|---|
| KEC63 | Detroit | 162.550 MHz |
| KIG66 | Marquette | 162.550 MHz |
| KIG74 | Sault Ste Marie | 162.550 MHz |
| KIG83 | Alpena | 162.550 MHz |
| KIH22 | Traverse City | 162.400 MHz |
| KIH29 | Flint | 162.475 MHz |
| KJY76 | Crystal Falls | 162.475 MHz |
| KXI33 | West Branch | 162.450 MHz |
| KZZ33 | Mount Pleasant | 162.525 MHz |
| KZZ35 | Escanaba | 162.500 MHz |
| WNG572 | Petoskey | 162.475 MHz |
| WNG576 | Newberry | 162.450 MHz |
| WNG582 | Sandusky | 162.450 MHz |
| WNG647 | Adrian / Petersburg | 162.450 MHz |
| WNG672 | Wolf Lake | 162.425 MHz |
| WNG683 | Marenisco | 162.550 MHz |
| WNG684 | Manistique | 162.525 MHz |
| WNG701 | Bad Axe | 162.525 MHz |
| WWF34 | Plainwell | 162.475 MHz |
| WWF36 | Hesperia | 162.475 MHz |
| WWF70 | Gaylord | 162.500 MHz |
| WXK73 | Houghton | 162.400 MHz |
| WXK81 | Onondaga | 162.400 MHz |
| WXN99 | West Olive | 162.425 MHz |
| WZ2513 | Copper Harbor | 162.500 MHz |
| WZ2514 | Munising | 162.475 MHz |
| WZ2515 | Grand Marais | 162.425 MHz |
| WZ2560 | Cannonsburg | 162.550 MHz |

### Receiver guidance

- NOAA broadcasts use seven VHF frequencies: **162.400, 162.425, 162.450, 162.475, 162.500, 162.525 and 162.550 MHz**. The NWS SAME guide confirms these frequencies; the NWS marine-radio page explains that channel numbering can differ. The app uses frequency values rather than assigning potentially misleading WX1–WX7 numbers.
- NWS receiver guidance explicitly distinguishes a simple AM/FM radio from a receiver with the weather band. A hand crank is a power method; its presence does not establish a radio's tuning bands. The app tells users to inspect the receiver specification for WX/NOAA capability.
- A radio that can play the weather channel may lack, or may not have enabled, tone alerts or SAME alerts. The app tells users to follow their receiver's manual, verify county coverage, and test reception before an emergency.
- No runtime, charging-time or outage-survival estimate is made. More than one warning source is prudent because NWS publishes degraded and out-of-service transmitter states.

## AM/FM verification

The entries below were checked against the broadcaster's own frequency/listening pages. These are ordinary analog AM/FM dial frequencies, not HD subchannels or internet-only feeds. Programming descriptions are intentionally broad because schedules change. The WKAR AM 870 daylight restriction is included in the visible station note. WGGL and WNMU are identified as mixed services; they are not described as continuous news-only services.

| Station | Dial | Broad region | Primary verification |
|---|---|---|---|
| WUOM — Michigan Public | FM 91.7 MHz | Ann Arbor, Detroit / southeast Lower Peninsula | [Official source](https://www.michiganpublic.org/how-to-listen) |
| WVGR — Michigan Public | FM 104.1 MHz | Grand Rapids, Kalamazoo / west Lower Peninsula | [Official source](https://www.michiganpublic.org/how-to-listen) |
| WFUM — Michigan Public | FM 91.1 MHz | Flint / east-central Lower Peninsula | [Official source](https://www.michiganpublic.org/how-to-listen) |
| WLNZ — Michigan Public | FM 89.7 MHz | Lansing / south-central Lower Peninsula | [Official source](https://www.michiganpublic.org/how-to-listen) |
| WRSX — Michigan Public | FM 91.3 MHz | Port Huron / Blue Water region | [Official source](https://www.michiganpublic.org/how-to-listen) |
| WCMU — WCMU News & More | FM 89.5 MHz | Mount Pleasant / central Lower Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WCML — WCMU News & More | FM 91.7 MHz | Alpena / northeast Lower Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WCMW — WCMU News & More | FM 103.9 MHz | Harbor Springs / northwest Lower Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WCMB — WCMU News & More | FM 95.7 MHz | Oscoda / northeast Lower Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WCMZ — WCMU News & More | FM 98.3 MHz | Sault Ste. Marie / eastern Upper Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WWCM — WCMU News & More | FM 96.9 MHz | Standish / northeastern Lower Peninsula | [Official source](https://www.wcmu.org/how-to-listen) |
| WCMV — WCMU News & More | FM 94.3 MHz | Traverse City / Leelanau area | [Official source](https://www.wcmu.org/how-to-listen) |
| WICA — IPR News | FM 91.5 MHz | Traverse City / northwest Lower Peninsula | [Official source](https://www.interlochenpublicradio.org/fm-listening) |
| WGGL — MPR | FM 91.1 MHz | Houghton / western Upper Peninsula | [Official source](https://www.mpr.org/listen/stations/wggl) |
| WNMU — Public Radio 90 | FM 90.1 MHz | Marquette / central Upper Peninsula | [Official source](https://www.wnmufm.org/about-public-radio-90) |
| WMUK — NPR News | FM 102.1 MHz | Kalamazoo / southwest Lower Peninsula | [Official source](https://www.wmuk.org/open-records) |
| WGVU — WGVU News | FM 88.5 MHz | Grand Rapids / west Lower Peninsula | [Official source](https://www.wgvunews.org/fm-schedule) |
| WDET — Detroit Public Radio | FM 101.9 MHz | Detroit / southeast Lower Peninsula | [Official source](https://wdet.org/) |
| WKAR — NewsTalk | AM 870 kHz | Lansing / Michigan capital region | [Official source](https://www.wkar.org/ways-to-listen-to-wkar) |
| WWJ — Newsradio 950 | AM 950 kHz | Metro Detroit / southeast Lower Peninsula | [Official source](https://www.audacy.com/wwjnewsradio/news/local/cbs-news-radio-is-shutting-down-what-that-means-for-wwj-2676925748) |

Additional cross-checks and source limits:

- WNMU's own About page establishes its programming and Upper Great Lakes focus; its licensee, [Northern Michigan University](https://nmu.edu/universitymedia), explicitly lists WNMU at 90.1 FM. The university page is retained in the bundled sources.
- Michigan Public's How to Listen introduction says “four” while listing five FM signals. The five enumerated call signs/frequencies are also confirmed on its [About page](https://www.michiganpublic.org/about-us). The directory uses the five explicit entries rather than the inconsistent introductory count.
- WCMU's listening page describes WCMV as Traverse City while its public-file page gives Leland. The bundled area is “Traverse City / Leelanau area,” a regional description rather than a city-of-license claim. WUCX's shared schedule is omitted from this short list.
- WWJ's own March 20, 2026 newsroom announcement explicitly confirms AM 950 and continued local news service. No discontinued network affiliation is asserted.

## Primary references

- [NWS Michigan NOAA Weather Radio station listing](https://www.weather.gov/nwr/stations?State=MI)
- [NWS NOAA Weather Radio receiver information](https://www.weather.gov/nwr/nwr_receivers)
- [NWS seven frequencies and SAME county guidance](https://www.weather.gov/nwr/usingsame)
- [NWS weather frequencies and receiver channel numbering](https://www.weather.gov/marine/wxradio)
- [NWS station and county coverage search](https://www.weather.gov/nwr/station_search)
- [NWS NOAA Weather Radio outages](https://www.weather.gov/nwr/outages)
- [Michigan Public — How to Listen](https://www.michiganpublic.org/how-to-listen)
- [WCMU — How to Listen](https://www.wcmu.org/how-to-listen)
- [Interlochen Public Radio — FM Listening](https://www.interlochenpublicradio.org/fm-listening)
- [Minnesota Public Radio — WGGL](https://www.mpr.org/listen/stations/wggl)
- [WNMU — About Public Radio 90](https://www.wnmufm.org/about-public-radio-90)
- [Northern Michigan University — WNMU 90.1 FM](https://nmu.edu/universitymedia)
- [WMUK — Open Records and station frequencies](https://www.wmuk.org/open-records)
- [WGVU — FM Schedule](https://www.wgvunews.org/fm-schedule)
- [WDET — Detroit Public Radio](https://wdet.org/)
- [WKAR — Ways to Listen](https://www.wkar.org/ways-to-listen-to-wkar)
- [WWJ Newsroom — AM 950 and local news service](https://www.audacy.com/wwjnewsradio/news/local/cbs-news-radio-is-shutting-down-what-that-means-for-wwj-2676925748)

## Refresh procedure

Recheck the NWS state list and per-transmitter county coverage, then each broadcaster's own listening page. Preserve stable IDs. Update frequencies and broad program notes only when supported by an official source, retain relevant operating-hour restrictions, update the review date, and run the content/schema checks. Never convert a point-in-time transmitter status into a promise that a station will remain available during an outage.
