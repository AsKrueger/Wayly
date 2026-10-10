# ADR-0008: Interactive Map Provider

- Status: Accepted for low-volume portfolio use; production suitability not approved
- Date: 2026-10-10

## Context

Issue #10 adds optional map visualization to Discover without introducing a place search provider or fabricating coordinates. The existing eight fictional sample places have no coordinates, so they must remain list-only. Any map must be isolated so a future tile provider can replace the current implementation.

The library license and the tile/data service terms are separate decisions. OpenStreetMap data is licensed under the ODbL and requires visible attribution. The public `tile.openstreetmap.org` service is community-funded, capacity-limited, best-effort, and has no SLA; it may block usage that degrades the service. Free-to-use OSM data does not imply an unrestricted free tile API.

The official Leaflet 1.x API and npm package metadata, OSM Tile Usage Policy, and OSM copyright/licensing notice were reviewed on 2026-10-10.

## Decision

- Use Leaflet 1.9.x as an isolated presentation library. Leaflet is BSD 2-Clause-licensed and has no Angular peer dependency; Angular interacts with it only through the application `PlaceMapAdapter` boundary. Type declarations come from `@types/leaflet`.
- Use the standard HTTPS OSM tile endpoint for this low-volume, interactive portfolio implementation. No API key or paid service is required.
- Request tiles only when a user opens a proposal containing at least one valid coordinate, and only for the visible map area as the user browses. Do not bulk download, prefetch, add offline tiles, or bypass HTTP caching.
- Keep OSM attribution visible on the map, link to the OSM copyright page, and identify OSM data as ODbL-licensed.
- Keep the map adapter replaceable. A failed tile/map load falls back to the still-available list and offers a retry. The place catalog remains independent from the tile service.

## Operational limitations

The public tile service offers no uptime or performance guarantee and can block access without notice. It has no published numeric request quota that would establish a production capacity commitment. This decision is therefore limited to development and low-volume portfolio interaction, not a production or commercial availability guarantee. Before launch or significant traffic, select a service with appropriate capacity/SLA or self-host tiles and review its costs and terms. Recheck the policy before deployment because it may change.

## Consequences

- Current fixtures have no coordinates, so Discover displays the map's no-coordinate state and does not request tiles. No fixture locations are inferred.
- Only finite latitude values in `[-90, 90]` and longitude values in `[-180, 180]` are eligible for markers. Places without valid coordinates remain in recommendation lists.
- No place-provider API, geocoding, location permission, map token, or paid integration is added.
- Automated tests use a simulated `PlaceMapAdapter`; they make no Internet or tile requests.
- Selection is owned by Discover and passed to the map and list, so the two views cannot maintain conflicting selected-place state.

## Sources

- [Leaflet 1.9 API reference](https://leafletjs.com/reference.html)
- [Leaflet npm package](https://www.npmjs.com/package/leaflet)
- [Leaflet license (BSD 2-Clause)](https://github.com/Leaflet/Leaflet/blob/main/LICENSE)
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [OpenStreetMap copyright, ODbL and attribution](https://www.openstreetmap.org/copyright)
