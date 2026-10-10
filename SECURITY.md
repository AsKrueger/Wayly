# Security policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues or pull requests.
Use the repository's **Security** tab to submit a private vulnerability report
if GitHub private vulnerability reporting is available. Otherwise, contact the
maintainer privately through their GitHub profile before sharing technical
details.

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
GitHub Actions. The Dependency graph and Dependabot alerts are enabled;
automatic security updates and private vulnerability reporting remain
disabled. Secret Protection was not enabled, and push protection and branch
protection have not been verified. These checks do not replace responsible
disclosure or manual review.
