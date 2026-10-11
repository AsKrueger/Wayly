# Security policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues or pull requests.
Use **Report a vulnerability** in the repository's **Security** tab to submit a
private vulnerability report. If that is not possible, contact the maintainer
privately through their GitHub profile before sharing technical details.

Include the affected version or commit, impact, reproduction steps and any
suggested mitigation. Do not include credentials or data belonging to other
people. The maintainers will acknowledge reports as soon as practical; no
response-time or remediation-time SLA is currently offered.

## Supported versions

Only the current default branch is supported for security fixes. No release
branches or published production versions are currently maintained.

## Automated protections

The repository runs pinned GitHub Actions for CodeQL analysis, dependency
review and the normal CI checks. Dependabot is configured for npm packages and
GitHub Actions. These checks do not replace responsible disclosure or manual
review.

## GitHub security settings

State of each repository setting as of **2026-10-11**. No paid feature is
enabled.

| Setting | State | Notes |
|---|---|---|
| Dependency graph | Enabled | |
| Dependabot alerts | Enabled | |
| Dependabot security updates | Discarded | Its pull requests always target the default branch, and `main` only receives changes when a phase is closed. Dependabot alerts still report the findings. |
| Private vulnerability reporting | Enabled | |
| Secret Protection (secret scanning) | Enabled | Free for public repositories. |
| Push protection | Enabled | Free for public repositories. |
| Code scanning (CodeQL) | Enabled | Advanced setup through `.github/workflows/codeql.yml`. |
| Branch ruleset for `main` | Active | Pull request required, three required checks, no force push, no deletion. |
| Branch ruleset for `develop` | Active | Same as `main`, and the branch must be up to date before merging. |

The required checks are `Quality checks`, `Dependency review` and
`Analyze JavaScript and TypeScript`. Review approvals are not required because
the repository has a single maintainer. The rules are described in
[`CONTRIBUTING.md`](CONTRIBUTING.md).
