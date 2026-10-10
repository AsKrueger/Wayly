# Discover and plan proposal

## Scope

The `/` route lets a visitor select activity categories, available time and budget, then generate a deterministic proposal from the local sample catalog. A proposal is a ranked set of individual candidate places, not a multi-stop plan or live place search.

## State ownership

- The component-scoped `DiscoverStore` is the single source of truth for the asynchronous catalog lifecycle and Discover preferences. It uses one discriminated catalog state (`loading`, `success`, or `error`) so failures cannot be confused with empty results.
- The store owns selected categories, available time and budget. The initial category is Culture; clearing all category checkboxes means all categories. Recommendations, scores, result count, empty/no-match states and the preference summary derive from catalog data and preferences.
- `DiscoverPageComponent` owns the preferences/proposal presentation stage, the selected place shared by the list and map, and the transient retry-button busy state. Returning to preferences does not destroy the page-scoped store or reset preferences.

## Proposal flow

1. The user adjusts category checkboxes, time and budget. No proposal is shown before an explicit request.
2. While the asynchronous catalog is loading, generation is disabled and a loading status is shown. On catalog error, the user sees an error and can retry; the error is not represented as an empty proposal.
3. When catalog loading succeeds, “Generar mi propuesta” synchronously switches to current computed engine results. It does not create a fake generation delay or issue another catalog request.
4. The proposal view shows the preferences used, score (labelled as indicative affinity rather than objective quality), criterion contributions, compatibility reasons, partial/complete verification, and available place details.
5. When at least two compatible recommendations exist, “Comparar dos opciones” opens Plan Battle with the two highest-ranked results from the existing recommendation engine. It presents each result's current score, criterion contributions, reasons, verification state, category, description and available location, budget and duration. Unknown location, budget or duration is explicitly shown as “Sin datos”.
6. The affinity explanation describes the relative engine scores without declaring an objective winner. Exact score ties are identified as ties. The user can choose either option, change that choice, and return to the proposal; this selection reuses Discover's selected-place state and does not modify preferences or ranking.
7. If fewer than two compatible recommendations exist, comparison remains unavailable and explains how many alternatives are available. “Modificar preferencias” returns to the same controls with values preserved; this closes the comparison and clears its selection before a new proposal is generated.

A successfully empty catalog and a non-empty catalog with no compatible places have distinct messages. Partial recommendations remain visible and identify data that could not be verified. No unavailable field is inferred.

## Map and list interaction

`app-place-map` adapts Leaflet through the application `PlaceMapAdapter` port. The map receives only the current recommended places and produces markers only for finite, in-range coordinates (latitude `[-90, 90]`, longitude `[-180, 180]`). Places without valid coordinates are never removed from the list.

List and map selection are bound to one Discover-owned selected-place ID. Clicking or keyboard-selecting a recommendation highlights the corresponding marker when one exists. Selecting a keyboard-accessible map marker highlights and focuses its list result. Selecting an unlocated place keeps the list selection and announces that it cannot be represented on the map. Changing preferences clears selection so stale markers are not represented as current.

If no recommendations have valid coordinates, no Leaflet map or tile request is initialized; the UI explains the limitation and keeps the full list available. If initialization or tile loading fails, Discover reports the map error, retains list interactions, and offers a map retry. No asynchronous loading state is fabricated for synchronous map initialization. OSM attribution is displayed, and the map's operational restrictions are recorded in [ADR-0008](ADR/ADR-0008-Interactive-Map-Provider.md).

## Responsive and accessible behavior

The map and result list stack in a single column and remain within the viewport at mobile widths. The map is a labelled region with keyboard-enabled Leaflet markers; each result card has a native keyboard-operable selection button with a visible focus ring and `aria-pressed` state. Cards can also be selected by pointer. Selection is not indicated by color alone. OSM attribution links to its copyright and ODbL information.

## Data and limitations

All current places are fictional examples; budget and duration details are illustrative. Current fixtures deliberately contain no coordinates, so the map displays the no-coordinate fallback until real, valid coordinates become available from an appropriately licensed source. No geocoding, location permission, external place search, route optimization, multiple activities, persistence or sharing is implemented.

## Tests

`src/app/features/discover/application/plan-battle.spec.ts` checks that comparison uses the two leading engine recommendations, preserves their reasons/scores, retains partial status, reports ties honestly and handles insufficient results. `discover-page.component.spec.ts` verifies the comparison flow, changing a choice, preference invalidation and the single-alternative state. Map tests use a fake adapter and make no network requests; recommendation rules remain covered in `src/app/core/domain/services/recommendation-engine.spec.ts`.
