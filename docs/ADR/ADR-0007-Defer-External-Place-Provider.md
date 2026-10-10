# ADR-0007: Defer External Place Provider

- Status: Accepted
- Date: 2026-10-10

## Context

Issue #5 evaluates an external place provider for Wayly. Discover currently uses the asynchronous `PlaceCatalog.getAll()` contract, which has no search area, user location, category query or result limit. The product has not selected a launch geography or decided whether users may opt in to location access.

A useful POI query must be geographically bounded. Fetching an unbounded provider catalogue would either invent a default city or make a broad data pull that is not suitable for public shared services. Provider responses also have different licensing, attribution, retention and billing constraints.

The provider policies and documentation below were reviewed on 2026-10-10. No external API endpoints were called.

## Options evaluated

### OpenStreetMap public Overpass

The public instances are shared community resources, not a production capacity or availability commitment. The official guidance gives broad usage guidelines, warns against large-scale extraction and broader consumer-app use, and directs complete-area data needs to extracts rather than Overpass. A portfolio app must also provide OpenStreetMap attribution and account for ODbL obligations where applicable.

Sources:

- [Overpass API public-instance guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)
- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright)

### OpenStreetMap Nominatim

The public Nominatim service is intended for moderate end-user geocoding, not bulk POI discovery. Its policy sets a maximum of one request per second per application, counts combined user traffic, and prohibits systematic queries such as downloading all POIs in an area. Results require OSM attribution and the service requires an identifying `Referer` or `User-Agent`.

Sources:

- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright)

### Google Places API (New)

Nearby Search requires a location restriction and a field mask. Pricing is pay-as-you-go and field/SKU dependent; the reviewed pricing table lists a limited monthly free allowance for Nearby Search Pro followed by paid usage. Places content has strict caching and storage restrictions. When Places content is shown without a Google Map, Google Maps attribution/logo is required. A browser application can use a supported SDK with a website-restricted key, but that key is visible to clients and must be treated as public, restricted configuration, not as a secret. Public terms and a privacy policy are also required.

Sources:

- [Places API pricing](https://developers.google.com/maps/billing-and-pricing/pricing#places)
- [Places API usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- [Google Maps Platform API key security best practices](https://developers.google.com/maps/api-security-best-practices)

### Geoapify Places

Places queries require a category and a spatial filter or bias. Requests consume credits, and the Free plan's use is subject to plan-specific limits, rate limits and attribution; the reviewed public information did not establish a numeric quota suitable for a project budget. An API key is required and visible if used in a browser bundle. Geoapify attribution and OSM attribution are required on the Free plan. The reviewed terms do not establish blanket rights for unrestricted caching or redistribution of every returned data source.

Sources:

- [Geoapify Places API reference](https://apidocs.geoapify.com/docs/places/)
- [Geoapify pricing FAQ](https://www.geoapify.com/pricing/)
- [Geoapify pricing details](https://www.geoapify.com/pricing-details/)
- [Geoapify terms and attribution](https://www.geoapify.com/terms-and-conditions/#attribution)

## Decision

Do not add a live provider or external adapter in this issue. Keep `SamplePlaceCatalog` as the active implementation and retain the existing `PlaceCatalog` port.

This is a deliberate deferral, not a claim that the evaluated providers are universally unsuitable. Without a user-selected area or an opt-in location flow, an external search cannot be scoped responsibly. The current contract also cannot communicate a geographic query, and changing it before the product chooses its location experience would prematurely encode an assumption.

The public OSM endpoints are not appropriate for unbounded catalog retrieval. The commercial services can be reconsidered only after Wayly defines a geographic query, expected traffic and budget, required fields, provider attribution in the UI, and data retention/redistribution needs.

## Consequences

- Discover remains deterministic, offline-capable and credential-free with fictional sample places.
- No API key, token, HTTP integration, or backend is added.
- No provider data is represented as real or verified.
- The existing port remains replaceable, but no external provider is selected by this ADR.
- A future issue must first define location input and consent/privacy behavior, then repeat a provider terms and budget review immediately before implementation.

## Revisit criteria

Revisit this decision when the product has:

1. a user-selected search area or an explicit, consent-based location input;
2. a bounded radius/area and result limit;
3. expected request volume and an acceptable recurring budget;
4. a decision about map use and attribution placement;
5. verified provider-specific caching, licensing and redistribution requirements;
6. a clear deployment plan for browser-restricted public keys or a separately scoped backend proxy if private credentials are required.
