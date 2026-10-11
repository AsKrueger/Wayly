# Testing strategy

## Requirements and commands

Use a Node.js version supported by Angular 18 (`18.19.1`, `20.11.1` or `22.x`) and npm `10.2` or newer. From a clean checkout:

```bash
npm ci
npm test
npm run test:coverage
npm run lint
npm run build
git diff --check
```

`npm test` runs Jest serially for predictable local output. `npm run test:watch` is available during development. To run one spec directly, pass its path to Jest, for example:

```bash
npm test -- src/app/core/domain/services/recommendation-engine.spec.ts
```

Coverage can also be generated with `npm run test:coverage -- --runInBand` when a serial run is preferred.

## GitHub Actions CI

The `CI` workflow in `.github/workflows/ci.yml` runs on every branch push, pull request, and manual `workflow_dispatch`. It uses GitHub-hosted Ubuntu, Node.js 22 (within the Angular 18 engine range), npm's lockfile cache, read-only repository permissions and `npm ci`. The required steps run serially so a failed install, lint, test/coverage or production build fails the quality job; there is no deployment and no external credential is required.

Each run collects Jest coverage and attempts to publish `coverage/lcov.info` plus the browsable HTML report as the `coverage-report` artifact for 14 days, including when an earlier step fails if a report was generated. No minimum coverage threshold is enforced. In a pull request, inspect the **Checks** result for the `Quality checks` job. From a completed Actions run, download `coverage-report` in its **Artifacts** section and open `coverage/lcov-report/index.html`; the command summary and `lcov.info` are available for quick review or tooling.

The same CI workflow verifies npm registry signatures and runs
`npm run security:audit`, which blocks high/critical advisories not present in
the reviewed baseline. Pull requests also run Dependency Review and fail for
new or updated dependencies with high-or-higher severity. A separate pinned
CodeQL workflow analyzes JavaScript and TypeScript on pushes, pull requests and
weekly. Dependabot checks npm and GitHub Actions updates weekly. See
[`DEPENDENCY_SECURITY.md`](../DEPENDENCY_SECURITY.md) for the current advisory
baseline, its limits and the security reporting policy.

To reproduce CI from Windows PowerShell, use `npm.cmd` (the `npm` PowerShell shim may be blocked by local execution policy):

```powershell
npm.cmd ci
npm.cmd audit signatures
npm.cmd run security:audit
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
git diff --check
```

From Command Prompt or a PowerShell environment where npm scripts are enabled, the same commands can use `npm`. If CI fails, start with the first failed step and its log: `npm ci` indicates a lockfile or registry/install problem; lint and Jest print file/spec diagnostics; a build failure includes Angular or TypeScript diagnostics. Reproduce that exact script locally before investigating later steps. Coverage upload warnings are non-fatal and mean no report files were generated; they do not replace the test step's pass/fail result.

## Test organization and purpose

Jest 29 with `jest-preset-angular` runs `src/**/*.spec.ts` using the `tsconfig.spec.json` CommonJS test configuration and `setup-jest.ts`. The same runner also executes `scripts/**/*.spec.cjs`, including regression tests for the dependency-advisory baseline gate. Production TypeScript remains strict through `tsconfig.json`; ESLint checks TypeScript and Angular templates.

- `src/app/core/domain/services/`: framework-independent recommendation compatibility, score criteria and stable ordering.
- `src/app/features/discover/application/`: comparison projection from existing recommendation results; no Angular dependency.
- `src/app/features/discover/state/`: asynchronous catalog state, preference changes and derived recommendation results.
- `src/app/features/discover/data/`: local catalog contract and fixture invariants.
- `src/app/features/discover/map/`: coordinate validation, component fallback behavior and Leaflet adapter boundary.
- `src/app/features/discover/discover-page.component.spec.ts`: observable proposal, comparison, selection, preference and catalog states using `RouterTestingHarness`.
- `src/app/shared/components/`: optional place details and provenance presentation.
- `src/app/app*.spec.ts`: application router outlet and initial provider wiring.

Tests should assert public results and user-observable behavior. Use controlled `Place` records and the existing `PlaceCatalog` and `PlaceMapAdapter` ports instead of duplicating recommendation rules or relying on production data sources.

## External boundaries and determinism

- Catalog tests inject a deterministic local fake or `SamplePlaceCatalog`; they do not call a network service.
- Map component tests replace `PlaceMapAdapter` with an in-memory fake.
- `leaflet-place-map.adapter.spec.ts` mocks the Leaflet API surface and exercises marker creation/update/removal, selection, map bounds, attribution configuration and tile-error reporting without initializing a browser map or requesting tiles.
- No test loads OpenStreetMap tiles or requires online access. Tile terms and deployment limits remain described separately in ADR-0008.
- Catalog promises are awaited at their microtask boundary; tests should avoid arbitrary timeouts, real timers and animation waits unless testing an actual time-based behavior.

The Leaflet adapter tests verify Wayly's use of the adapter boundary, not compatibility with a live Leaflet renderer or tile service. A browser smoke check and an operational review of the chosen tile provider remain deployment concerns, not unit-test gates.

## Coverage collection and baseline

`npm run test:coverage` collects coverage from all `src/**/*.ts` files, excluding specs, declaration files and `src/main.ts` (the framework bootstrap entry point). It emits:

- a text summary in the command output;
- `coverage/lcov.info` for tooling;
- `coverage/lcov-report/index.html` for line and branch inspection.

Before this hardening work, the existing 54-test suite measured **80.82% statements, 79.24% branches, 83.11% functions and 80.68% lines**. That run used Jest's default imported-file collection; the Leaflet adapter was at **25.64% statements** and was identified as a meaningful untested integration boundary. A complete-source measurement was also taken before new tests: **94.30% statements, 89.62% branches, 100% functions and 94.56% lines**.

After explicitly collecting all source files, adding focused entry-point and Leaflet-boundary tests, and replacing arbitrary store-test timeouts with microtask waits, the current measurement is:

| Scope | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| All collected source | 98.86% | 92.45% | 100% | 98.79% |
| Recommendation engine | 97.43% | 100% | 100% | 97.43% |
| Plan Battle projection | 100% | 100% | 100% | 100% |
| Discover map area | 98.60% | 92.10% | 100% | 98.52% |
| Leaflet adapter | 100% | 100% | 100% | 100% |

These values are a snapshot, not a quality target; rerun the command to get the current result. Remaining uncovered lines/branches are defensive or degenerate paths (for example equal duplicate recommendation IDs, no-map component guards, the store's non-error retry guard and an absent-budget display fallback). They should only gain tests if their contract or risk warrants it.

No global coverage threshold is configured. The current measurements are useful for finding gaps, but a blanket percentage would make low-risk presentation paths count like compatibility, scoring and adapter failure behavior, and could encourage tests that inflate a number rather than protect a contract. Reconsider thresholds when project behavior and coverage ownership are stable; prefer focused thresholds for critical pure-domain modules if they become useful.

## Change validation checklist

Before closing a change:

1. Add or update tests next to the affected domain, application, component or adapter code.
2. Check empty, error, boundary and unknown-data cases relevant to that behavior.
3. Run `npm test` and `npm run lint`.
4. For changes to business rules, state transitions, adapters or test configuration, run `npm run test:coverage` and inspect uncovered branches in the affected module.
5. Run `npm run build` and `git diff --check`.
6. Verify that unit tests remain independent of live tile, catalog or other external service availability.
