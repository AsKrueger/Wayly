# ADR-0006: Initial Hosting Strategy

- Status: Accepted
- Date: 2026-10-07

## Context

Wayly is positioned as a lightweight web application with future PWA evolution. The initial setup should minimize operational overhead and validate the product quickly.

## Decision

Use Firebase Hosting as the first deployment option, with future infrastructure evaluated only when a real need emerges.

## Consequences

- low initial complexity;
- easy front-end deployment flow;
- fast iteration for early validation;
- future migration remains possible if product requirements change.

## Notes

This decision is intentionally conservative and should be revisited before production launch.
