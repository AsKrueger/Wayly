# Place domain model

## Categories

`src/app/core/domain/models/place-category.ts` defines the controlled `PlaceCategory` union and the single category-to-label map used by Discover and place cards:

- `culture` — Cultura
- `nature` — Naturaleza
- `food` — Gastronomía
- `leisure` — Ocio

## Place

`src/app/core/domain/models/place.ts` defines a framework-independent, readonly `Place`:

- Required identity and core content: `id`, `name`, `description`, `category`.
- Optional location data: `location`, `coordinates`.
- Optional planning information: `budgetLevel`, `estimatedVisitMinutes`, `openingHours`.
- Required provenance: `source`, `dataStatus`.

Missing optional values mean the information is unknown or unavailable; the model does not assign defaults or infer coordinates, prices, durations or hours. `PlaceDataStatus` distinguishes fictional demo entries, unverified provider data and verified data. `PlaceOpeningHours` carries weekday and local clock-time text; timezone and exception dates are not defined at this MVP stage.

## Fixtures

`src/app/features/discover/data/sample-places.ts` contains eight intentionally fictional records across all four categories. Stable `demo-` identifiers, `source: 'wayly-demo'` and `dataStatus: 'fictional'` are required on each record. Optional budget levels and visit durations are explicitly illustrative and appear with that disclaimer in the UI. No coordinates, opening hours or exact prices are invented.

## Query contract and adapter

`src/app/core/application/ports/place-catalog.ts` exposes the minimal asynchronous `PlaceCatalog.getAll()` query contract. `SamplePlaceCatalog` adapts the local fixture to that contract. The application configuration binds the port to the sample adapter; a later provider can replace that binding without coupling Discover to the fixture module.

No external provider is currently selected or integrated. The catalog method has no geographic query, and the product has not selected a search area or location-consent flow. See [ADR-0007](ADR/ADR-0007-Defer-External-Place-Provider.md) for the assessment and conditions for revisiting this choice.

## Rendering

`PlaceCardComponent` uses the shared category labels and renders optional location, illustrative budget/duration and opening hours only when present. It identifies each fictional record and omits unavailable data rather than showing a placeholder that could be mistaken for verified information.

## Tests

- Fixture specs check required fields, stable unique IDs, fictional provenance, category coverage and partial data.
- Catalog specs check the local adapter's typed query result.
- Place-card specs check complete optional details and partial records.
- Discover specs continue to verify route rendering and preference-driven filtering through the catalog port.
