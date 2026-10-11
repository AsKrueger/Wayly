# Dependency and software-supply-chain security

## Current baseline

The dependency review below was recorded on **2026-10-10** from the committed
`package-lock.json` using `npm audit`:

| Scope | Critical | High | Moderate | Low | Total |
|---|---:|---:|---:|---:|---:|
| All installed dependencies | 2 | 65 | 21 | 7 | 95 |
| Production dependencies (`npm audit --omit=dev`) | 0 | 4 | 4 | 0 | 8 |

High/critical advisories affect Angular packages and development tooling,
including `@angular-devkit/build-angular`, `@angular/cli`, `@angular/common`,
`@angular/compiler`, `@angular/core`, `@angular/router`, Jest, and
`jest-preset-angular`. The two critical transitive packages reported at the
time were `piscina` and `tar`; both are in the development/build dependency
tree. The production-only audit still reports four affected high-severity
package entries and four moderate entries. The high-severity production
packages are `@angular/common`, `@angular/compiler`, `@angular/core` and
`@angular/router`. Treat these as unresolved risks, not as vulnerabilities
that have been fixed or proven unexploitable.

### Packages and advisories are counted differently

`npm audit` counts affected packages; the baseline lists advisories. The two
numbers are not expected to match:

| Scope | Packages with high/critical findings | Unique high/critical advisories |
|---|---:|---:|
| All installed dependencies | 67 (2 critical + 65 high) | 37 |
| Production dependencies | 4 | 13 |

- One advisory can affect several packages, and a package is also counted when
  it only depends on a vulnerable package. That is why 37 advisories produce 67
  affected packages: 19 of the 67 are named directly by an advisory and the
  other 48 are reported only because they depend on one of those.
- One package can carry several advisories. In production, `@angular/common`
  has 6, `@angular/core` 5, `@angular/compiler` 4 and `@angular/router` 1. That
  adds up to 16 because some advisories are reported for more than one package;
  there are 13 distinct ones.

The 13 production advisories are part of the 37, and
`security/npm-audit-baseline.json` holds those 37 advisory IDs. The gate
compares advisory IDs, not package counts.

`npm audit fix --dry-run` proposed no compatible automatic changes. The
available fixes for the affected direct Angular and Jest dependencies require
major upgrades beyond this project's Angular 18/Jest 29 foundation. Do not use
`npm audit fix --force` as a routine remediation. Review each advisory's
affected path and compatibility before changing versions; update the baseline
when findings are actually resolved.

The maintainer chose to preserve Angular 18 for this hardening change rather
than undertake the major Angular/Jest migration required to clear the current
audit findings. The baseline is therefore an explicit, temporary risk
acceptance—not a claim that the advisories are fixed. Revisit it when compatible
patches become available or when a separately planned framework upgrade is
approved.

## Exception and remediation plan

The maintainer accepts the documented baseline temporarily to avoid an
unreviewed framework migration in this change. The production Angular findings
remain a release risk; the absence of a source-review finding does not establish
that the vulnerable framework code is unreachable or harmless.

1. Before the next production release, review the current Angular advisories
   and affected code paths against the application's actual use of Angular
   templates, routing and browser APIs. Do not treat that reachability review
   as a replacement for upgrading.
2. Plan a coordinated upgrade to a supported, patched Angular major, including
   Angular framework/CLI/build packages and the aligned compiler, router and
   platform packages. Upgrade Jest and `jest-preset-angular` as required by
   Angular compatibility. Run the full Windows and CI validation before
   removing resolved GHSA IDs.
3. Resolve the build-tree `tar` and `piscina` findings as part of that
   dependency-tree update, or sooner if a compatible upstream fix becomes
   available. Re-run both full and production-only audits after each update.
4. Keep the baseline limited to reviewed, still-present GHSA IDs. The audit
   gate fails on new high/critical findings and stale exceptions; do not add
   IDs without documenting their package path, severity, production/build
   scope and remediation decision.

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

The 37 entries reviewed on 2026-10-10 predate this policy. They share one
reason and one exit condition: their fixes require major upgrades of Angular or
of the Jest tooling, and they leave the baseline with the phase 1 migration
issues (F1-1 and F1-2 in [`docs/ROADMAP.md`](docs/ROADMAP.md)), with the
baseline emptied in F1-3.

Entries added after 2026-10-11:

| Advisory | Package and scope | Reason | Exit condition | Approved on |
|---|---|---|---|---|
| None | | | | |

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
  GitHub reads this file from the default branch, so these settings take effect
  once the phase 0 closing PR brings them to `main`.
- Workflow actions are pinned to verified full commit SHAs and retain version
  comments for reviewability.
- All workflow jobs run on `ubuntu-24.04` rather than `ubuntu-latest`, so a
  runner image change is a reviewed commit.

Wayly is a public repository, so GitHub code scanning with CodeQL is available
for public repositories without an Advanced Security subscription. The
CodeQL workflow ran successfully for PR #18 and uploaded analysis results.
Code-scanning alerts and default-branch results should still be confirmed in
the **Security** tab after merge.

The 37 advisory IDs in the baseline are an explicit temporary exception for
the findings observed on the review date. When resolving findings, update
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
