# ADR-0010: Open Data at Runtime, Worldwide

- Status: Accepted on 2026-11-18. The owner gave full freedom over the product direction for Wayly 2.0.
- Date: 2026-11-18
- Supersedes: [ADR-0009](ADR-0009-Location-Selection.md) (location cascade and per-locality static catalogues) and the provider deferral of [ADR-0007](ADR-0007-Defer-External-Place-Provider.md).

## Context

Wayly 2.0 has to work for anyone, anywhere, at zero cost and without a backend. ADR-0009 planned static catalogues for Spain, generated offline. That approach covers one country, needs a manual multi-gigabyte pipeline, ages quickly, and forces a four-level selector that is slow to use. The competitor analysis ([COMPETITORS.md](../COMPETITORS.md)) shows that time to first value is the main differentiator, so the user must be able to type any place, or tap "use my location", and get a plan.

All the services below were tested from the browser origin on 2026-11-18. All of them are free, need no API key and send `Access-Control-Allow-Origin: *`.

## Decision

| Need | Service | Licence and attribution | Usage policy and our safeguards |
| --- | --- | --- | --- |
| Search a city, neighbourhood or address | [Photon](https://photon.komoot.io) (komoot) | OpenStreetMap data, ODbL | Fair use; heavy use is throttled. We wait 350 ms after typing stops, need 3 characters and send one request at a time. |
| "Use my location" | Browser Geolocation API, then Photon reverse search for the name | — | Only after the user presses the button. The position is used for the query and kept only on the device. |
| Places | [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) public instances: `overpass-api.de`, then `overpass.private.coffee`. **Backup:** Photon nearby search filtered by the same tag rules | © OpenStreetMap contributors, ODbL | One bounded query per plan (radius up to 5 km, at most 70 elements per category plus 60 notable ones, 12 s server timeout). Results cached on the device for 24 h by rounded position. On HTTP 429, 5xx or timeout the next instance is tried, then Photon (no opening hours or Wikidata); there is no retry loop. |
| Photo and summary of notable places | Wikipedia REST `page/summary`, in the user's language | Text CC BY-SA, images under their own licence, shown with a link to the article | Only for places with a `wikipedia` tag, only when the user opens or sees the stop. |
| Weather | [Open-Meteo](https://open-meteo.com) forecast | CC BY 4.0, attribution to Open-Meteo | Free for non-commercial use under 10,000 calls a day. One call per plan. **Before ads are enabled (phase 6) this must be reviewed**, because ads make the site commercial; the fallback is to hide the weather. |
| Map tiles | OpenStreetMap standard tiles ([ADR-0008](ADR-0008-Interactive-Map-Provider.md)) | © OpenStreetMap contributors | Unchanged from ADR-0008. |

Further decisions:

1. **Coverage is worldwide.** There is no list of supported localities.
2. **No location cascade.** One search box plus a location button replace the country → region → province → locality selector.
3. **Domain stays independent of providers.** The engine works on `Place` objects; adapters translate OpenStreetMap tags (ADR-0004). Tests never call the network.
4. **Honest data.** Places from OpenStreetMap are marked `unverified`. Costs and visit durations are estimates by type, and the interface says so.
5. **Backup source.** During implementation (2026-11-18) the main Overpass instance answered "at capacity" and the second one timed out. Photon's nearby search with OpenStreetMap tag filters was verified as a backup and is used automatically. Details in [DATA-SOURCES.md](../DATA-SOURCES.md).
6. **Static catalogue work is archived.** The generator from #53 stays in the `feature/issue53` branch. It is the exit plan below, not part of the application.

## Consequences

- Wayly works in any town that has OpenStreetMap data, which includes most of the world.
- The application depends on shared community services with no availability guarantee. Every call has a timeout and a visible, retryable error.
- Public Overpass instances are not meant to carry a large consumer application. This is acceptable at launch volume with caching. **Exit plan** if traffic grows: pre-generate per-city place files with a scheduled GitHub Actions job (free for public repositories) and serve them from GitHub Pages, using the archived generator; Overpass then stays only as a fallback.
- The Content Security Policy must list exactly these origins.
- Attribution for OpenStreetMap, Wikipedia and Open-Meteo is shown in the interface.

## Sources

- [Overpass API, usage and public instances](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Overpass API user's manual, commons](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)
- [Photon](https://github.com/komoot/photon)
- [Open-Meteo terms](https://open-meteo.com/en/terms)
- [Wikimedia REST API](https://en.wikipedia.org/api/rest_v1/)
- [OpenStreetMap copyright and ODbL](https://www.openstreetmap.org/copyright)
