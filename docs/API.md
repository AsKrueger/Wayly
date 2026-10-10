# API and provider strategy

## Provider abstraction model

Wayly must not couple feature logic to any specific backend or third-party service.

The domain will use interfaces such as:

- `PlaceProvider`
- `WeatherProvider`
- `EventProvider`
- `GeocodingProvider`

These abstractions enable technical flexibility and easier testing.

## External dependency policy

Before integrating a new API, the team must validate whether it can be used directly from the browser or if it requires a backend/proxy. If a private key is needed, it must never be exposed inside the frontend bundle.

## Provider evaluation status

No external place provider is currently integrated. The public OSM Overpass/Nominatim services have limits that make them unsuitable as an unbounded consumer POI catalogue, while Google Places and Geoapify require a geographically scoped query and bring cost, attribution, key-management and data-retention obligations.

The current `PlaceCatalog.getAll()` port has no location or area parameter, and Wayly has not selected a launch region or location-consent flow. Discover therefore continues to use fictional local fixtures. This avoids inventing a default city or making an unbounded external request.

See [ADR-0007](ADR/ADR-0007-Defer-External-Place-Provider.md) for the provider assessment and revisit criteria. Official policies and pricing must be rechecked immediately before any future integration because quotas, terms and prices may change.

Potential sources assessed, but not selected:

- OpenStreetMap Overpass for bounded POI queries, subject to its public-instance guidance and ODbL attribution/licensing.
- Google Places API (New), subject to per-SKU billing, Google attribution and strict Places content caching/storage rules.
- Geoapify Places, subject to API key controls, plan quota/rate limits and provider/data-source attribution and licensing.

Nominatim is a geocoding service rather than a POI catalog and its public policy does not permit systematic area-wide POI downloads.

## Fixtures and controlled datasets

Before depending on external APIs, the project should rely on fixtures for development and testing.

Example structure:

```text
fixtures/
└── places.json
```

Benefits:

- UI development without real dependency
- deterministic testing
- offline development
- easier reproduction of edge cases
- avoidance of API rate limits

## Data contract expectations

The recommendation engine should not depend on UI or transport concerns. It should work with normalized domain models such as:

- place metadata;
- distance and duration information;
- category tags and preferences;
- availability and schedule data;
- compatibility and scoring signals.

## Security rule

No secrets should be kept in the repository. Use environment variables and GitHub Secrets, and prefer a backend/proxy layer when required.
