# ADR-0002: Signals as Application State

- Status: Accepted
- Date: 2026-10-07

## Context

Wayly requires a reactive frontend state model that is explicit, derived, and easy to reason about. The product has multiple state streams such as constraints, preferences, generated plans and selected plan.

## Decision

Use Angular Signals as the reactive application state mechanism, with source state and derived state separated by intent.

## Consequences

- less duplicated state;
- clearer reactivity boundaries;
- easier reasoning about UI updates;
- better fit for mobile-first flows and derived views.

## Notes

Computed values are preferred over duplicated stored values when the value can be derived from source state.
