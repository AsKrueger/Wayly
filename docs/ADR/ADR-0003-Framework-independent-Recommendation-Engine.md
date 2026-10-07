# ADR-0003: Framework-independent Recommendation Engine

- Status: Accepted
- Date: 2026-10-07

## Context

The product requires a recommendation engine that can calculate compatible activities, plan combinations and scores. It must be testable without needing DOM or Angular-specific APIs.

## Decision

Define a business-layer recommendation engine that is independent from Angular, HTTP, DOM and Firebase, and is driven by deterministic rules.

## Consequences

- logic can be unit tested in isolation;
- easier future refactors;
- clearer product logic;
- more scalable evolution toward richer recommendations.

## Notes

This is a foundational decision to keep the domain stable even when UI or infrastructure change.
