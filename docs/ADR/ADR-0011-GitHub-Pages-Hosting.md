# ADR-0011: Free Hosting on GitHub Pages

- Status: Accepted on 2026-11-18.
- Date: 2026-11-18
- Supersedes: [ADR-0006](ADR-0006-Initial-Hosting-Strategy.md).

## Context

ADR-0006 chose Firebase Hosting as a first option and asked for a review before launch. Wayly is a static application with no backend, and the project must cost nothing, including the domain. Firebase needs a separate Google Cloud project and billing account settings, which adds an account and a risk of accidental charges.

## Decision

- Host Wayly on **GitHub Pages**, from the public repository, at `https://askrueger.github.io/Wayly/`.
- Deploy with a GitHub Actions workflow that runs only on `main`, separate from CI, as the roadmap requires.
- Build with `--base-href /Wayly/` and copy `index.html` to `404.html` so that deep and shared links work.
- No custom domain for now. A custom domain is not free.

## Consequences

- Zero cost and no new accounts.
- HTTPS is provided by GitHub.
- GitHub Pages cannot set HTTP headers, so the Content Security Policy stays in a `<meta>` tag.
- Deep links are answered with HTTP 404 and the application shell; users do not notice, but search engines index mainly the home page.
- **Advertising (phase 6):** AdSense reads `ads.txt` from the root of the domain, and a project site lives under `/Wayly/`. The free options are documented in phase 6: a user site repository (`AsKrueger.github.io`) to serve `ads.txt`, or moving to another free host with its own subdomain. The choice is made then.

## Sources

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Google AdSense, ads.txt](https://developers.google.com/adsense/platforms/direct/ads-txt)
