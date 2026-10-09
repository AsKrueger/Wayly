# Discover experience

## Scope

The `/` route renders the first Wayly Discover experience. It lets a visitor choose an activity category, available time and budget, and shows a small matching set of local sample places. It does not generate recommendations, plans or live place data.

## Implementation

- `src/app/features/discover/discover-page.component.ts` owns the screen presentation and lightweight Signal state.
- `src/app/features/discover/discover-page.component.css` provides the screen's responsive layout using the global design tokens.
- `src/app/core/domain/models/place.ts` defines a framework-independent place and its category type.
- `src/app/core/domain/models/discover-preferences.ts` defines the available time, budget and preference types.
- `src/app/features/discover/data/sample-places.ts` contains the local sample place data, independent of the template.
- `src/app/shared/components/place-card.component.ts` renders a reusable, clearly marked sample-place card.

## Interactions

- Native radio groups allow keyboard and screen-reader selection of activity, time and budget.
- Selecting an activity filters the local examples to that category. Time and budget choices update the selected preference summary.
- The primary action announces that the preferences are ready, while explicitly stating that personalized recommendations are not available yet.
- Changing a preference after continuing clears that status so it cannot imply the old selection is current.
- Each example is marked as such; descriptions and optional textual location come only from the local fixture.

## Tests

`src/app/features/discover/discover-page.component.spec.ts` checks route rendering, the initial examples, category filtering, time/budget selection and the primary action's status and reset behavior.
