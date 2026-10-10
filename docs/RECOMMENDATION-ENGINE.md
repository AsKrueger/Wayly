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

## Compatibility and score

Compatibility is evaluated first and is a hard gate: a category mismatch, known budget above the selected ceiling, or known duration above available time excludes the place. Scoring runs only for compatible places, so a high score can never restore an excluded place.

Every compatible result receives a score from 0 to 100 using a fixed denominator and two equally weighted criteria:

| Criterion | Weight | Formula for known data | Purpose |
|---|---:|---|---|
| Budget efficiency | 50 points | `50 × (budget ceiling rank − place rank + 1) ÷ budget ceiling rank` | Prefer lower illustrative budget levels while respecting the user's selected ceiling. Ranks are Economical = 1, Medium = 2, Flexible = 3. |
| Time utilization | 50 points | `50 × estimated visit minutes ÷ available minutes` | Prefer a known visit estimate that makes fuller use of the user's available time, without exceeding it. |

Both contributions are capped by their compatibility checks, and the total is their sum. The score is a relative ordering aid for these two stated preferences, not a probability, quality rating, or claim of real-world accuracy. Category selection remains a hard filter rather than a score: all surviving places already satisfy it, so scoring it again would not differentiate candidates.

If a budget or duration is unknown, its contribution is zero out of its fixed 50-point maximum and its breakdown status is `unknown`. The denominator is not reduced, so missing information cannot increase a score. `verification` remains `partial` whenever either value is unknown, but completeness is not an additional sorting bonus; this avoids double-penalizing the same missing fields.

## Explanations and ordering

Reasons report the category decision (or that no category filter was set), compatible known budget and duration values, and each unknown budget or duration. A place only appears after known incompatibilities have been excluded.

Results are ordered by compatibility (incompatible places are excluded), then descending score, then ascending stable place ID for equal scores. Verification status and compatibility reasons remain attached after sorting. All weights and score contributions are explicit in the returned score breakdown; there are no random values or hidden tie-breakers.

## Limitations

This is a deterministic, bounded ordering strategy, not an optimized itinerary or a claim of real-world suitability. Budget categories are broad ordinal levels; time utilization does not account for travel or whether a user wants to fill all available time. Fixture budget and duration values are illustrative. External place providers, real prices and hours, travel time, location, popularity, and multi-activity planning remain out of scope.

The pure engine behavior is covered by `src/app/core/domain/services/recommendation-engine.spec.ts`; store integration and the rendered explanations are covered by the Discover specs.
