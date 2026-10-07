# Design system foundation

## Principles

Wayly's visual language should feel clear, useful, calm and human. Components favour familiar HTML semantics, readable contrast and a low-friction mobile-first layout. The system is intentionally small and should grow only when repeated product needs emerge.

## Tokens

Global tokens live in `src/styles.css` under `:root`.

| Group | Token examples | Purpose |
| --- | --- | --- |
| Color | `--color-brand`, `--color-background`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-danger` | Brand identity, readable surfaces and feedback |
| Typography | `--font-size-xs` through `--font-size-display`, `--line-height-body`, `--line-height-heading` | Responsive text hierarchy |
| Spacing | `--space-1` through `--space-8` | Consistent gaps and padding |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill` | Inputs, cards, badges and actions |
| Shadows | `--shadow-card`, `--shadow-raised` | Subtle elevation |
| Layout | `--content-width`, `--page-gutter`, `--section-gap` | Fluid mobile-first content layout |
| Motion | `--transition-fast`, `--transition-standard` | Restrained state transitions |
| Layering | `--z-header` | Explicit stacking for shared interface layers |

Use existing tokens before introducing component-specific values. Prefer semantic colors over raw values in new styles.

## Typography and layout

The system uses a native system sans-serif stack, a fluid display size with `clamp()`, and separate heading/body line heights. `.page-container` provides a centered, bounded layout with fluid gutters. Start layouts as a single column and add columns at tablet/desktop breakpoints.

## Shared primitives

Global CSS primitives are deliberately small:

- `.button`, `.button--secondary`: anchors or buttons with consistent hit area and interaction states.
- `.surface-card`: a bordered, low-elevation surface for content groups.
- `.field`, `.field__label`, `.field__control`, `.field__hint`, `.field__error`: styles for native inputs, selects and textareas. Associate labels using `for`/`id`, expose invalid state with `aria-invalid="true"`, and connect hints/errors with `aria-describedby`.
- `.badge`, `.badge--accent`: concise status or category labels; never use color as the only indicator.
- `.sr-only`: visually hidden text that remains available to assistive technology.

Prefer native HTML controls instead of wrapping them in generic components until shared behavior justifies that abstraction.

## Interaction states

Buttons, links and controls have hover, active, keyboard focus, disabled and invalid styling. Keep native semantics (`<button>` for actions and `<a>` for navigation). Use `aria-busy="true"` for an in-progress control and provide a textual status where loading is meaningful. Validation messages should be clear and associated with their field.

The global `:focus-visible` style uses a high-contrast outline and is not removed. Ensure any new interactive surface preserves it.

## Responsive and motion

The home page uses mobile-first single-column content and moves to multi-column layouts only when space allows. Verify at narrow mobile width, tablet width and desktop width; avoid horizontal scrolling.

The global reduced-motion rule removes non-essential transition and animation timing and disables smooth scrolling for users who request reduced motion.

## Accessibility baseline

- Use one descriptive `h1`, then a logical heading hierarchy.
- Use landmarks and semantic content elements.
- Provide accessible names for links and controls; decorative art should be hidden from assistive technology.
- Maintain sufficient text/background contrast and visible focus.
- Respect keyboard operation, disabled state and reduced-motion preferences.
