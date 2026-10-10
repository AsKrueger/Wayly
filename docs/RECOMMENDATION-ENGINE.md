# Recommendation engine

## Boundary and contract

`src/app/core/domain/services/recommendation-engine.ts` exports the pure `recommendPlaces` function. Its input contains a readonly list of domain `Place` values and `DiscoverPreferences`; it returns readonly `PlaceRecommendation` values containing each place, structured reasons, and a `complete` or `partial` verification status. The engine imports only domain models and has no Angular, catalog, network, or presentation dependency.

`DiscoverStore` calls the engine from a computed signal when catalog data and preferences are available. Catalog loading and errors remain separate from recommendation results. Discover renders the reasons and verification status returned by the engine rather than reimplementing its matching rules.

## Matching rules

1. If one or more categories are selected, a place must match at least one. Clearing every category checkbox means there is no category restriction.
2. Budget is an ordered ceiling: Economical accepts only Economical; Medium accepts Economical or Medium; Flexible accepts all three levels. A known level above the selected ceiling excludes the place.
3. Duration must not exceed the selected time. The current preference limits are 60 minutes for one hour, 120 minutes for two hours, and 240 minutes for half a day. A known duration above the limit excludes the place; the limit is inclusive.
4. Missing budget or duration does not exclude a category-matching place. The result is marked `partial` and gets a reason identifying each preference that could not be checked. A result is `complete` only when both budget and duration are present and compatible.
5. Matching uses the fixture values as entered, including values marked illustrative. It cannot establish that fictional or illustrative data reflects real-world cost or time.

## Explanations and ordering

Reasons report the category decision (or that no category filter was set), compatible known budget and duration values, and each unknown budget or duration. A place only appears after known incompatibilities have been excluded.

Complete results are listed before partial results. Within either group, results are ordered by ascending stable place ID. There are no arbitrary scores, weights, random values, external lookups, or hidden tie-breakers.

## Limitations

This is a deterministic first-pass filter, not an optimized itinerary or a claim of real-world suitability. Budget categories are broad ordinal levels, and time estimates are illustrative fixture data. External place providers, real prices and hours, travel time, location, ranking scores, and multi-activity planning remain out of scope.

The pure engine behavior is covered by `src/app/core/domain/services/recommendation-engine.spec.ts`; store integration and the rendered explanations are covered by the Discover specs.
