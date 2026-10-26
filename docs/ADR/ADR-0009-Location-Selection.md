# ADR-0009: Location Selection and Per-Locality Catalogues

- Status: Proposed. Pending owner approval of the attribution text and the Spanish administrative mapping (see Open items).
- Date: 2026-10-26
- Supersedes the location criteria of [ADR-0007](ADR-0007-Defer-External-Place-Provider.md).

## Context

ADR-0007 deferred an external place provider until the launch geography, the user's location input and the result limits were decided. Discover still uses eight fictional fixtures without coordinates, so the map never shows markers.

Phase 4 replaces the fixtures with real places from OpenStreetMap, processed offline into static catalogues. That requires a decision on how users choose the area they search, how large each catalogue is, and how many results the recommendation engine receives.

The owner decided the following:

- Users choose their location themselves, through the preferences form, not through browser geolocation.
- The selection is hierarchical: country, region, province, locality.
- Catalogues cover all localities of a country, one country at a time. Spain comes first; Portugal follows in a later phase.
- The search radius is 15 km.
- There is no limit on the number of results.

## Decision

1. **Selection.** The preferences form offers a cascade: country, then region, then province, then locality. The cascade only offers localities that have a catalogue. Browser geolocation is not used, so no location permission is requested and no position data is processed.

2. **Catalogue unit.** One static JSON catalogue per locality, generated offline from an OpenStreetMap extract by a script in the repository (F4-1). Catalogues are not fetched from an external service at runtime, so the application needs no backend, API key or paid service.

3. **Radius.** Each catalogue contains the places within 15 km of the locality's centre. The radius is applied when the catalogue is generated, so the application does not run a geographic query. Distance scoring is added later in F5-1.

4. **Locality centre.** The centre is the coordinate of the locality's place node in OpenStreetMap. If a locality has no place node, the centroid of its administrative boundary is used. The chosen method is recorded in the generated metadata.

5. **No result limit.** Every place in the catalogue within the radius is a candidate for recommendation. The recommendation engine must handle the full set; the performance of the largest Spanish catalogue is measured in F4-2 before this decision is treated as final.

6. **Administrative mapping for Spain.** The locality is the municipality (OpenStreetMap `admin_level=8`). The levels above are:

   | Selector level | OpenStreetMap `admin_level` | Notes |
   |---|---:|---|
   | Country | 2 | Spain. |
   | Region | 4 | Autonomous communities. Ceuta and Melilla must be checked: they have their own administrative level. |
   | Province | 6 | Provinces. |
   | Locality | 8 | Municipalities. |

   This mapping is to be verified against the OpenStreetMap tagging of Spain before it is accepted. Verification is part of F4-1.

7. **Attribution.** Proposed text: "© OpenStreetMap contributors", shown in Discover with a link to the OpenStreetMap copyright page, and identification of the data as ODbL-licensed. Pending owner confirmation.

8. **Portugal.** Portugal is added in a later phase. Its administrative mapping is defined then, not in this decision.

## Consequences

- Discover can only offer localities that have a catalogue. Adding a locality means generating its catalogue, not changing the application.
- No geolocation, no location permission and no position data are involved.
- Catalogue size is measured in F4-1 before the storage decision is final. If Spain does not fit in the repository, the alternative is chosen then and recorded here.
- The absence of a result limit makes the recommendation engine's cost depend on catalogue size. This is checked in F4-2.
- Changing the radius later means regenerating every catalogue.

## Open items

- Owner approval of the attribution text (point 7).
- Verification of the Spanish administrative mapping, including Ceuta and Melilla (point 6).
- Measurement of the Spanish catalogue volume (F4-1).

## Sources

- [OpenStreetMap copyright, ODbL and attribution](https://www.openstreetmap.org/copyright)
- [ADR-0007](ADR-0007-Defer-External-Place-Provider.md) and [ADR-0008](ADR-0008-Interactive-Map-Provider.md), for the constraints this decision builds on.
