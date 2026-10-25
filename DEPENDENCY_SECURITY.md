# Dependency and software-supply-chain security

## Current baseline

The figures below were recorded on **2026-10-25** on `feature/issue42`, after
the migration to Angular 21 (issue #42), from the `package-lock.json` using
`npm audit`:

| Scope | Critical | High | Moderate | Low | Total |
|---|---:|---:|---:|---:|---:|
| All installed dependencies | 0 | 0 | 5 | 0 | 5 |
| Production dependencies (`npm audit --omit=dev`) | 0 | 0 | 0 | 0 | 0 |

For comparison, the review of 2026-10-10 on Angular 18 reported 95 affected
packages in total (2 critical, 65 high) and 8 in production (4 high). After
issue #18 alone the total was 45 (38 high). The moderate count rose from 7 to
23 with issue #19: most of those entries are Jest 30 packages reported because
they depend on `sprintf-js`, which has a moderate advisory. The gate only
tracks high and critical advisories.

The production audit is clean. The 5 moderate advisories are in the development
tree (Jest 30, through `sprintf-js`); they are outside the high/critical gate
and are reviewed in F1-3. The Angular 20.3.33 runtime advisories that were open
on this date are closed by the migration to Angular 21. Treat the remaining
findings as unresolved risks, not as vulnerabilities that have been fixed or
proven unexploitable.

### Packages and advisories are counted differently

`npm audit` counts affected packages; the baseline lists advisories. The two
numbers are not expected to match:

| Scope | Packages with high/critical findings | Unique high/critical advisories |
|---|---:|---:|
| All installed dependencies | 0 | 0 |
| Production dependencies | 0 | 0 |

`security/npm-audit-baseline.json` is empty since issue #42. The gate compares
advisory IDs, not package counts.

## Exception and remediation plan

| Advisory | Package | Scope | Fix |
|---|---|---|---|
The table is empty since issue #42. Angular 21 closed its entries:

- GHSA-587h-7wmj-h5pm (`vite`) and GHSA-g84c-rxfj-3j2c (`webpack-dev-middleware`),
  fixed by `@angular-devkit/build-angular` 21.
- GHSA-vfj7-8cjw-p6xm (`braces`), which `npm audit` no longer reports for the
  locked tree.
- GHSA-xjj6-f33q-929c (`undici`), reported after the upgrade: `@angular/build`
  21.2.28 pins `undici` 7.29.1 exactly, and the fix is 7.30.1. `package.json`
  has `overrides` that set `undici` to 7.30.1 only inside `@angular/build`, so
  the `undici` 8 used by jsdom in Jest is not affected.

`npm audit` offers no fix for either within Angular 20: both require the
Angular 21 build packages. Issue #19 (F1-2) removed the tooling blocker by
moving to Jest 30 and `jest-preset-angular` 16, which supports Angular 19 to
22. The exit condition for both entries is the Angular 22 migration (F1-5 in
[`docs/ROADMAP.md`](docs/ROADMAP.md)).

Do not use `npm audit fix --force` as a routine remediation. Keep the baseline
limited to reviewed, still-present GHSA IDs: the audit gate fails on new
high/critical findings and on stale exceptions.

## Baseline policy

**Status:** approved by the repository owner on **2026-10-11**.

1. Only the repository owner approves changes to
   `security/npm-audit-baseline.json`.
2. Every new entry is recorded in the table below with its reason and its exit
   condition.
3. An advisory that has a patch within the current major version is fixed, not
   added to the baseline.
4. If the patch requires a major version, the advisory is accepted with an exit
   condition tied to the migration issue that will remove it.
5. Obsolete entries are removed in the same commit that resolves the advisory.

The 37 entries reviewed on 2026-10-10 predate this policy. Issue #18 (F1-1)
removed 35 of them by migrating Angular from 18 to 20. The 2 that remain are
listed under "Exception and remediation plan" with their exit condition, and
the baseline is emptied in F1-3.

Entries added after 2026-10-11:

| Advisory | Package and scope | Reason | Exit condition | Approved on |
|---|---|---|---|---|
| GHSA-587h-7wmj-h5pm | `vite`, development and build | The only fix is `@angular-devkit/build-angular` 21, a major update (rule 4). | Closed on 2026-10-25 by Angular 21 (F1-5, #42) | 2026-10-25, pending confirmation by the repository owner |

`npm audit signatures` succeeded for the installed dependency tree during this
review: registry signatures were verified for the reported packages. npm
reported provenance attestations only for a subset; signature verification
does not mean every package has a provenance attestation or that its code is
safe.

The checked-out source was scanned for common token and private-key patterns;
no matches were found. This is not a complete secret scan and does not inspect
repository history, ignored local files or GitHub-hosted secrets. The
repository's Dependency graph and Dependabot alerts were initially disabled;
both were enabled during PR validation with maintainer approval so Dependency
Review could run. The current state of every GitHub security setting and of
the branch rulesets is recorded in [`SECURITY.md`](SECURITY.md).

When those alerts were enabled, GitHub reported **62 vulnerabilities** on the
default branch (1 critical, 33 high, 24 moderate and 4 low). This is a separate
GitHub report from the `npm audit` totals above; the totals are not directly
comparable and should not be added together. Review individual alerts in the
repository's Security tab when triaging differences.

The initial audit discovery ran on Node.js 24.19.0/npm 11.17.0, outside the
project's declared Node.js support range. Full local validation was subsequently
re-run successfully on Node.js 22.23.3/npm 11.17.0, including `npm ci`,
signature verification, the advisory gate, lint, coverage tests and production
build. CI is configured for Node.js 22.

## CI controls

- `.github/workflows/ci.yml` verifies npm registry signatures and runs
  `npm run security:audit`. The checker allows only the reviewed high/critical
  GitHub Security Advisory IDs in `security/npm-audit-baseline.json`; any new
  high/critical advisory, unidentified high/critical advisory, or stale
  baseline entry fails CI. It does not suppress the normal `npm audit` output
  or claim that known findings are safe.
- Pull requests run GitHub Dependency Review and fail for newly introduced or
  updated dependencies with high-or-higher severity.
- `.github/workflows/codeql.yml` analyzes JavaScript and TypeScript on pushes,
  pull requests and a weekly schedule.
- `.github/dependabot.yml` checks npm dependencies and GitHub Actions weekly
  and targets `develop`. Major updates of Angular, its Jest tooling and
  TypeScript (also minor updates for TypeScript) are excluded until F1-3.
  GitHub reads this file from the default branch, `main`, where it has been in
  effect since the phase 0 closing PR (#27).
- Workflow actions are pinned to verified full commit SHAs and retain version
  comments for reviewability.
- All workflow jobs run on `ubuntu-24.04` rather than `ubuntu-latest`, so a
  runner image change is a reviewed commit.

Wayly is a public repository, so GitHub code scanning with CodeQL is available
for public repositories without an Advanced Security subscription. The
CodeQL workflow ran successfully for PR #18 and uploaded analysis results.
Code-scanning alerts and default-branch results should still be confirmed in
the **Security** tab after merge.

The baseline holds 2 advisory IDs (`braces` and `webpack-dev-middleware`), the
explicit temporary exception described above. When resolving findings, update
dependencies and remove resolved IDs from the baseline in the same change.
The checker fails if an allowlisted advisory is no longer reported, prompting
the stale entry to be removed. Review the remaining baseline regularly and do
not add new IDs merely to make CI pass; first assess the advisory, affected
dependency path, compatibility and remediation options.

## Reproducing the checks on Windows and Ubuntu/Linux

Use a supported Node.js release (CI uses Node 22) and npm, from the repository
root. On Ubuntu/Linux:

```bash
npm ci
npm audit signatures
npm run security:audit
npm run lint
npm run test:coverage
npm run build
git diff --check
```

On Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd audit signatures
npm.cmd run security:audit
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
git diff --check
```

The audit commands require access to the npm registry. `npm run security:audit`
invokes the installed npm CLI, parses its JSON report and compares high/critical
advisories with the checked-in baseline. A report/registry error fails rather
than being treated as a clean audit. GitHub Actions results are available from
the repository's **Actions** tab; CodeQL findings appear in **Security** when
the repository's security features are available and enabled.
