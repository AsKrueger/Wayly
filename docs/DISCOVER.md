# Discover experience

## Scope

The `/` route lets a visitor choose activity categories, available time and budget, then presents deterministic recommendations from local sample places. It does not create multi-stop plans or use live place data.

## State ownership

- The component-scoped `DiscoverStore` is the single source of truth for the asynchronous catalog lifecycle and Discover preferences. It uses one discriminated catalog state (`loading`, `success`, or `error`) so a failed load cannot be confused with an empty result.
- The store owns the selected categories, available time and budget. The initial category is Culture; clearing all category checkboxes means all categories. Recommendations, result count, empty-catalog/no-match states and the preference summary are computed from the catalog and preferences.
- The screen component owns only presentation state: whether the user has acknowledged the current preferences and the transient retry-button busy indicator. Changing a preference clears the acknowledgement.

## Implementation

- `src/app/features/discover/state/discover-store.service.ts` coordinates catalog loading and reactive Discover state; it is provided at the page component, not globally.
- `src/app/features/discover/discover-page.component.ts` owns the screen presentation and preference controls.
- `src/app/features/discover/discover-page.component.css` provides the screen's responsive layout using the global design tokens.
- `src/app/core/domain/models/place.ts` defines a framework-independent place record with optional availability and provenance fields; `place-category.ts` defines the controlled categories and labels.
- `src/app/core/domain/models/discover-preferences.ts` defines the available time, budget and selected-category preference types, independently of Angular.
- `src/app/core/application/ports/place-catalog.ts` is the minimal typed asynchronous query contract; `SamplePlaceCatalog` provides local fixture data through it. No external provider has been selected or integrated yet.
- `src/app/features/discover/data/sample-places.ts` contains fictional local place data, independent of the template.
- `src/app/shared/components/place-card.component.ts` renders a reusable, clearly marked sample-place card.

## Interactions

- Native checkboxes allow selecting multiple activity categories; time and budget remain radio groups. All controls support standard keyboard interaction.
- Selected activities filter the local examples together. Clearing all activity checkboxes shows examples from every category. Time and budget choices update the selected preference summary without reloading the catalog.
- Recommendations update reactively when categories, budget, or available time changes. The primary action confirms the current preferences; it does not initiate another catalog request.
- Changing a preference after continuing clears that status so it cannot imply the old selection is current.
- Each fictional example is marked as such; descriptions and optional textual location come only from the local fixture. Illustrative budgets and durations are clearly labelled, and absent location, coordinates or hours are not inferred.
- Catalog loading, failure, a successfully empty catalog, and no matching recommendations have distinct presentations. Errors can be retried; repeated requests cannot be triggered while the catalog is already loading.
- The pure recommendation engine excludes known category, budget-ceiling, and duration incompatibilities; it retains missing budget/duration data as partial matches with visible explanations.
- Compatible recommendations are sorted by the engine's transparent 0–100 affinity score; Discover shows a rounded summary and each criterion's contribution, while retaining compatibility reasons and verification state. A partial result is not given a separate completeness bonus or penalty.
- The external provider decision is documented in [ADR-0007](../ADR/ADR-0007-Defer-External-Place-Provider.md); Discover continues to use local fictional fixtures until a bounded location experience is defined.

## Tests

`src/app/core/domain/services/recommendation-engine.spec.ts` checks the pure matching rules, missing data, explanations, ordering and determinism. `src/app/features/discover/state/discover-store.service.spec.ts` checks initial/loading state, successful and empty results, errors and retry, reactive recommendation integration, and the fixture catalog adapter. `src/app/features/discover/discover-page.component.spec.ts` checks route rendering, category controls, time/budget selection, recommendation explanations, empty/error handling and retry. Fixture, catalog and shared-card behavior have focused specs beside their implementations. See [RECOMMENDATION-ENGINE.md](RECOMMENDATION-ENGINE.md) for the rules, and [PLACE-MODEL.md](PLACE-MODEL.md) for the data contract.
