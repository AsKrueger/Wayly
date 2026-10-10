# Discover and plan proposal

## Scope

The `/` route lets a visitor select activity categories, available time and budget, then generate a deterministic proposal from the local sample catalog. A proposal is a ranked set of individual candidate places, not a multi-stop plan or live place search.

## State ownership

- The component-scoped `DiscoverStore` is the single source of truth for the asynchronous catalog lifecycle and Discover preferences. It uses one discriminated catalog state (`loading`, `success`, or `error`) so failures cannot be confused with empty results.
- The store owns selected categories, available time and budget. The initial category is Culture; clearing all category checkboxes means all categories. Recommendations, scores, result count, empty/no-match states and the preference summary derive from catalog data and preferences.
- `DiscoverPageComponent` owns only the current presentation stage (preferences or proposal) and the transient retry-button busy state. Returning to preferences does not destroy the page-scoped store or reset preferences.

## Implementation

- `src/app/features/discover/state/discover-store.service.ts` coordinates catalog loading and reactive Discover state; it is scoped to the page rather than provided globally.
- `src/app/features/discover/discover-page.component.ts` owns the preference and proposal presentations and their synchronous transition.
- `src/app/features/discover/discover-page.component.css` provides the responsive layout using global design tokens.
- `src/app/core/domain/models/place.ts` defines a framework-independent place with optional location, budget, duration and hours; `place-category.ts` defines controlled categories.
- `src/app/core/domain/models/discover-preferences.ts` defines category, time and budget preferences without Angular dependencies.
- `src/app/core/application/ports/place-catalog.ts` defines the typed async catalog contract; `SamplePlaceCatalog` provides the local fixtures.
- `src/app/features/discover/data/sample-places.ts` contains fictional data independent from templates.
- `src/app/shared/components/place-card.component.ts` renders the place details available in each result.
- The pure `recommendPlaces` engine filters known incompatibilities, scores compatible results and returns structured reasons, score breakdown and verification state. See [RECOMMENDATION-ENGINE.md](RECOMMENDATION-ENGINE.md) for exact rules.

## Proposal flow

1. The user adjusts category checkboxes, time and budget. No proposal is shown before an explicit request.
2. While the async catalog is loading, generation is disabled and a loading status is shown. On catalog error, the user sees an error and can retry; the error is not represented as an empty proposal.
3. When catalog loading succeeds, “Generar mi propuesta” synchronously switches to the result stage using the current computed engine output. No artificial generation delay or duplicate catalog request is introduced.
4. The result view shows the preferences used, score (labelled as indicative affinity rather than objective quality), criterion contributions, compatibility reasons, partial/complete verification, and available place details.
5. “Modificar preferencias” returns to the same controls with their values preserved. The user can change them and generate an updated proposal.

A successfully empty catalog and a non-empty catalog with no compatible places have distinct messages. Partial recommendations remain visible and identify the data that could not be verified. No unavailable field is inferred.

Native checkboxes and radio controls retain keyboard support and visible focus styling. The proposal is a single responsive view; there is no route transition that would reset local preferences.

## Limitations

All current places are fictional examples; budget and duration details are illustrative. The affinity score is only an ordering aid from the documented engine criteria. There are no external providers, maps, geolocation, route optimization, multiple activities, persistence or sharing.

## Tests

`src/app/core/domain/services/recommendation-engine.spec.ts` checks pure matching, missing data, explanations, scoring, ordering and determinism. `src/app/features/discover/state/discover-store.service.spec.ts` checks catalog lifecycle and reactive engine integration. `src/app/features/discover/discover-page.component.spec.ts` checks the pending-to-proposal transition, score and reasons presentation, preference preservation and regeneration, no-match and empty-catalog states, and catalog errors/retry. The tests use controlled local data and do not call external services.
