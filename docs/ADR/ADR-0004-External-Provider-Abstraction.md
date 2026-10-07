# ADR-0004: External Provider Abstraction

- Status: Accepted
- Date: 2026-10-07

## Context

The project depends on external data sources such as places, weather, events and geocoding. Direct coupling would make the domain fragile and harder to test.

## Decision

Expose abstractions such as `PlaceProvider`, `WeatherProvider`, `EventProvider` and `GeocodingProvider` to isolate the domain from concrete provider implementations.

## Consequences

- easier local development with fixtures;
- simplified mocks in tests;
- less risk from API changes;
- reduced coupling between business logic and infrastructure.

## Notes

Concrete providers are deferred until there is a justified product need.
