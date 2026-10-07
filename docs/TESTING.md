# Testing strategy

## Principles

The testing strategy is centered on domain rules and behavior, not only on UI rendering.

Priorities:

1. Recommendation Engine
2. Scoring
3. Constraints
4. Edge cases
5. Application services
6. Critical components
7. Infrastructure

## Tools

- Jest
- Angular Testing Utilities
- mocks
- unit tests
- component tests
- integration tests where they add value

## Focus areas

The tests should cover:

- budget logic;
- duration rules;
- distance rules;
- schedules;
- preferences;
- combinations;
- ranking;
- incompatible plans;
- empty-result states;
- incomplete data;
- fallback behavior.

## Quality gates

At this stage there is no arbitrary coverage target. The project should create a baseline first and define a reasonable quality gate later.

## Important principle

Business logic must be testable with minimal Angular dependencies. This ensures that recommendations remain stable and understandable across UI changes.
