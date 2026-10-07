# Accessibility

## Core mandate

Accessibility is not a post-development activity. It is a design and delivery requirement from the beginning.

## Minimum requirements

Wayly must support:

- complete keyboard navigation;
- visible focus states;
- semantic HTML;
- correct labels and names;
- sufficient contrast;
- understandable error states;
- `aria-label` when needed;
- no reliance solely on color;
- `prefers-reduced-motion` support;
- alternate text and descriptive content.

## UX considerations

The application should ensure users always understand:

- what they need to do;
- what is happening;
- why the system is providing a certain result;
- which constraints affect the plan;
- how to modify the outcome.

## Definition of Done

Accessibility is part of the Definition of Done and should be reviewed at feature level before release.

## Current application foundation

- The initial page uses `header`, `main`, `section`, `article` and `footer` landmarks with a single page-level `h1`.
- The primary call to action is a real in-page link, and all interactive elements retain a visible `:focus-visible` indicator.
- Global styles support labelled form controls, invalid states via `aria-invalid="true"`, disabled controls and readable validation messages.
- Non-essential transitions and smooth scrolling are reduced when `prefers-reduced-motion: reduce` is enabled.
- See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for token, color and component conventions.
