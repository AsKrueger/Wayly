# ADR-0001: Angular Standalone Architecture

- Status: Accepted
- Date: 2026-10-07

## Context

The product is planned as a modern Angular application with a responsive and modular frontend. The project needs a maintainable structure with clear feature boundaries and a low-friction setup.

## Decision

Use Angular 18 with standalone components and a modular application structure. Keep component, service and feature responsibilities explicit.

## Consequences

- lower boilerplate;
- simpler onboarding for a new team;
- good fit for a scalable feature-based structure;
- requires consistent conventions to avoid fragmentation.

## Notes

This is the initial frontend foundation and does not include product functionality beyond the architectural structure.
