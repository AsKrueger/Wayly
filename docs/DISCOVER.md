# Discover experience

## Scope

The `/` route renders the first Wayly Discover experience. It lets a visitor choose an activity category, available time and budget, and shows a small matching set of local sample places. It does not generate recommendations, plans or live place data.

## Implementation

- `src/app/features/discover/discover-page.component.ts` owns the screen presentation and lightweight Signal state.
- `src/app/features/discover/discover-page.component.css` provides the screen's responsive layout using the global design tokens.
- `src/app/core/domain/models/place.ts` defines a framework-independent place record with optional availability and provenance fields; `place-category.ts` defines the controlled categories and labels.
- `src/app/core/domain/models/discover-preferences.ts` defines the available time, budget and preference types.
- `src/app/core/application/ports/place-catalog.ts` is the minimal typed asynchronous query contract; `SamplePlaceCatalog` provides local fixture data through it. No external provider has been selected or integrated yet.
- `src/app/features/discover/data/sample-places.ts` contains fictional local place data, independent of the template.
- `src/app/shared/components/place-card.component.ts` renders a reusable, clearly marked sample-place card.

## Interactions

- Native radio groups allow keyboard and screen-reader selection of activity, time and budget.
- Selecting an activity filters the local examples to that category. Time and budget choices update the selected preference summary.
- The primary action announces that the preferences are ready, while explicitly stating that personalized recommendations are not available yet.
- Changing a preference after continuing clears that status so it cannot imply the old selection is current.
- Each fictional example is marked as such; descriptions and optional textual location come only from the local fixture. Illustrative budgets and durations are clearly labelled, and absent location, coordinates or hours are not inferred.
- Catalog loading and failures have explicit live status/error messages; a failed read is never presented as a successful empty result.
- The external provider decision is documented in [ADR-0007](../ADR/ADR-0007-Defer-External-Place-Provider.md); Discover continues to use local fictional fixtures until a bounded location experience is defined.

## Tests

`src/app/features/discover/discover-page.component.spec.ts` checks route rendering, the initial examples, category filtering, time/budget selection and the primary action's status and reset behavior. Fixture, catalog and shared-card behavior have focused specs beside their implementations. See [PLACE-MODEL.md](PLACE-MODEL.md) for the data contract.
