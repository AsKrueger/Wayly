# Deployment and infrastructure

## Hosting strategy

The first hosting option for Wayly is Firebase Hosting. This is the initial recommendation because it fits a progressive web app strategy and keeps the project lightweight in the early stages.

The final infrastructure decision will be validated before production deployment.

## CI/CD strategy

GitHub Actions should automate the following pipeline:

```text
npm ci
  ↓
Lint
  ↓
Unit tests
  ↓
Coverage
  ↓
Production build
  ↓
Accessibility checks
```

For `main`:

```text
Push
  ↓
CI
  ↓
Build
  ↓
Deploy
```

CI and CD must remain conceptually separated.

## Future infrastructure

Potential services worth evaluating later:

- Firebase Hosting
- Firebase Authentication
- Firestore
- Cloud Functions
- Cloud Run

These services should not be introduced before the product need is real and justified.

## Observability

The project should evolve toward detection of:

- API failures;
- rendering problems;
- navigation issues;
- performance issues;
- recommendation engine errors.

The initial observability approach should remain deliberately simple.
