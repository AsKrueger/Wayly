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
Review could run. Dependabot security updates and private vulnerability
reporting remain disabled; Secret Protection was not enabled. Push protection
and branch-protection rules have not been verified.

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
- `.github/dependabot.yml` checks npm dependencies and GitHub Actions weekly.
- Workflow actions are pinned to verified full commit SHAs and retain version
  comments for reviewability.

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

## Reproducing the checks on Windows

Use a supported Node.js release (CI uses Node 22) and npm, from the repository
root in PowerShell:

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
