# Architecture

## Architectural principles

Wayly follows a pragmatic layered architecture, but without turning Angular into a monolithic backend-style system.

The layers exist only when they provide a clear responsibility:

```text
┌─────────────────────────────┐
│        Presentation         │
│ Angular Components / Views  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Application          │
│ Use Cases / State / Ports   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│           Domain            │
│ Rules / Models / Engine     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Infrastructure        │
│ APIs / Providers / HTTP     │
└─────────────────────────────┘
```

## Domain-first approach

The business logic must be independent from Angular, DOM, HTTP and Firebase. The recommendation engine is the main source of business rules and plan generation logic.

## Signals as reactive state

State will use Angular Signals, with source state and derived state clearly separated.

Source state:

- budget
- availableTime
- maxDistance
- selectedCategories
- selectedPreferences
- currentLocation
- selectedDate
- places
- generatedPlans
- selectedPlan

Derived state:

- filteredPlaces
- compatiblePlaces
- remainingBudget
- remainingTime
- planTotalCost
- planTotalDuration
- planDistance
- planScore

Derived state should be defined with `computed()` and must not be duplicated from source state.

## Feature states

Every feature should use explicit lifecycle states:

- Idle
- Loading
- Success
- Empty
- Error

This avoids ambiguous boolean or string states that make behavior hard to reason about.

## Initial repository structure

```text
src/
└── app/
    ├── core/
    │   ├── domain/
    │   │   ├── models/
    │   │   ├── value-objects/
    │   │   ├── rules/
    │   │   └── services/
    │   ├── application/
    │   │   ├── use-cases/
    │   │   └── ports/
    │   └── infrastructure/
    │       ├── providers/
    │       ├── http/
    │       └── configuration/
    ├── shared/
    │   ├── components/
    │   ├── directives/
    │   ├── pipes/
    │   └── utilities/
    ├── features/
    │   ├── discover/
    │   ├── explore/
    │   ├── planner/
    │   ├── plan-detail/
    │   └── plan-battle/
    ├── app.component.*
    ├── app.config.ts
    └── app.routes.ts
```

## Recommendation engine

The recommendation engine is the main business component and should be structured as a deterministic pipeline:

```text
Places
 +
Constraints
 +
Preferences
      ↓
Filtering
      ↓
Compatibility
      ↓
Combination
      ↓
Scoring
      ↓
Ranking
      ↓
Candidate Plans
```

The engine must remain:

- independent from Angular;
- independent from the DOM;
- independent from HTTP;
- independent from Firebase;
- deterministic;
- testable;
- extensible;
- explainable.

## Domain model (initial conceptual model)

### Plan

Represents a proposal that includes:

- items
- totalCost
- totalDuration
- totalDistance
- score

### Constraint

Represents objective limits:

- budget
- availableTime
- maxDistance
- location
- date

### Preference

Represents user preferences:

- relax
- culture
- outdoor
- food
- entertainment
- social

### Score

Represents compatibility between a plan and the user’s needs. The score must be explainable.

## External providers

The application should depend on abstractions instead of concrete implementations:

- PlaceProvider
- WeatherProvider
- EventProvider
- GeocodingProvider

Concrete providers can later use OpenStreetMap, geocoding services, event providers and weather APIs. The domain will not be coupled to them directly.
