# Tomic UI Constitution

> Canonical frontend documentation now lives in [docs/frontend/README.md](docs/frontend/README.md). This constitution remains the authoritative rules for Anatomy usage.

> The authoritative rules governing the Nafura platform design system.

---

## 1. Philosophy

**Enterprise, calm, dense, predictable.**

| Principle | Description |
|-----------|-------------|
| **Enterprise** | Built for power users who work with data all day. No consumer-app flourishes. |
| **Calm** | Neutral surfaces, semantic color only for meaning (status, actions). No decorative gradients or shadows. |
| **Dense** | Maximize information density without sacrificing readability. 40px row heights, 8px base spacing. |
| **Predictable** | Same component = same behavior everywhere. No per-page variations of core patterns. |

---

## 2. Engine vs Skin

### The Rule

> **Material / PrimeNG = Engine. Tomic = Skin + Composition.**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| **Engine** | Interaction, accessibility, keyboard nav, ARIA, overlay management | `mat-table`, `mat-menu`, `p-select`, `MatTooltip` |
| **Skin** | All visual styling: colors, spacing, typography, borders, shadows | `--nf-*` CSS tokens |
| **Composition** | Combining primitives into higher-order patterns | `nf-data-table`, `nf-filter-bar`, `nf-page-header` |

### What This Means

1. **We do NOT use Material Design as a visual system.** Material's opinionated styling (ripples, elevation, indigo-pink palette) is overridden or disabled.

2. **We MAY use Angular Material primitives** for their interaction/a11y engine: focus management, keyboard navigation, ARIA attributes, overlay positioning.

3. **We MAY use PrimeNG** as a data/control engine: rich form controls, data handling, selection models.

4. **All visuals come from Tomic tokens (`--nf-*`).** No component should render Material's or PrimeNG's default colors.

---

## 3. Wrapping Rules

### When to Wrap

| Scenario | Action |
|----------|--------|
| Component is used in feature pages | **Must wrap** in `nf-*` component |
| Component has visual styling from library | **Must wrap** and override all visual tokens |
| Component is only used internally in another wrapper | May use directly inside wrapper |
| Directive adds behavior without visuals (e.g., tooltip) | May expose as `nf*` directive |

### Wrapper Responsibilities

Every `nf-*` wrapper must:

1. **Hide the engine** - Feature code never imports `MatXxxModule` or `PrimeNG` modules
2. **Control the API** - Expose only the inputs/outputs needed, not the full engine API
3. **Apply Tomic tokens** - All colors, spacing, typography via `--nf-*` variables
4. **Maintain a11y** - Preserve keyboard nav, focus rings, ARIA from the engine

### File Organization

```
lib/anatomy/components/
├── atoms/          # Smallest units (button, badge, icon, spinner)
├── molecules/      # Combinations (search-input, page-header, selection-bar)
├── organisms/      # Complex patterns (data-table, filter-bar, modal)
└── services/       # Imperative APIs (toast, confirm-dialog)
```

---

## 4. Theming Rules

### Single Source of Truth

> **Only `--nf-*` tokens control visuals. Period.**

| Token Category | Example | Defined In |
|----------------|---------|------------|
| Colors | `--nf-primary`, `--nf-danger`, `--nf-text-secondary` | `core/styles/_colors.scss` |
| Spacing | `--nf-space-2`, `--nf-space-4` | `core/styles/_spacing.scss` |
| Typography | `--nf-font-size-sm`, `--nf-font-weight-medium` | `core/styles/_typography.scss` |
| Components | `--nf-button-height-md`, `--nf-table-row-height` | `core/styles/_components.scss` |

### Preventing Theme Leakage

1. **Material prebuilt themes** may be loaded for structural CSS, but visual tokens (colors, shadows) must be overridden globally.

2. **PrimeNG theme presets** (e.g., Aura) are allowed for structure, but `--p-primary-*` must be bound to `--nf-primary-*`.

3. **No component may hardcode colors.** Use `var(--nf-*)` exclusively.

4. **Override location**: All library overrides live in `web/src/styles.scss` or `core/styles/_components.scss`.

### Token Hierarchy

```
Product Theme (optional)
    ↓ overrides
Platform Tokens (core/styles/_colors.scss)
    ↓ consumed by
Component Tokens (core/styles/_components.scss)
    ↓ used in
nf-* Component Styles
```

---

## 5. Responsiveness Rules

### Principles

| Rule | Description |
|------|-------------|
| **Flex-first** | Use flexbox for layout. Avoid fixed widths except for known constraints. |
| **Wrap > Shrink** | When space runs out, wrap to next line. Don't shrink content to illegibility. |
| **No surprise hiding** | Don't hide content at breakpoints without clear user affordance (e.g., overflow menu). |
| **Touch targets** | Maintain 40px minimum touch targets on interactive elements. |

### Breakpoint Strategy

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Stack layouts, full-width inputs |
| Tablet | 640px - 1024px | Side-by-side with wrapping |
| Desktop | > 1024px | Full density layout |

### Implementation

- Use `nf-button-list` with `responsive` config to collapse actions to menu
- Use `nf-listing-controls` with natural wrapping for listing actions
- Avoid `display: none` at breakpoints; prefer overflow menus

---

## 6. Anti-Patterns

### Forbidden in Feature Code

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| `<mat-checkbox>` in feature template | Direct engine usage, theme leakage | Use `nf-data-table` selection or future `nf-checkbox` |
| `<p-dropdown>` in feature template | Direct engine usage | Use `nf-filter-bar` or create `nf-select` wrapper |
| `<mat-button>` anywhere outside core | Bypasses Tomic styling | Use `nf-button` |
| `matMenuTriggerFor` in feature code | Exposes Material API | Use `nf-button-list` with `view="menu"` |
| Hardcoded color values | Breaks theming | Use `var(--nf-color-*)` |
| Mixed icon sets in same context | Visual inconsistency | Standardize on Material Icons for UI |
| Multiple theme owners | Conflicting token values | Single `--nf-*` token source |

### Enforcement

1. **Code review checklist** - Reviewers check for direct `mat-*` / `p-*` usage in features
2. **Lint rules** (optional) - ESLint custom rule or grep-based CI check
3. **Import boundaries** - Feature modules should not import `MatXxxModule` directly

---

## 7. Decision Record

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-01 | Use Material for table/paginator engine | Best a11y, keyboard nav, sort integration |
| 2024-01 | Use PrimeNG for form controls (select, date) | Richer out-of-box features than Material forms |
| 2024-01 | Tomic tokens as single source | Prevent theme conflicts, enable product theming |
| 2025-01 | Document constitution | Formalize rules after inconsistency audit |

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOMIC STACK                             │
├─────────────────────────────────────────────────────────────────┤
│  Feature Pages         │  Only use nf-* components              │
├─────────────────────────────────────────────────────────────────┤
│  nf-* Wrappers         │  Compose engines + apply --nf-* tokens │
├─────────────────────────────────────────────────────────────────┤
│  Engines (Mat/Prime)   │  Provide interaction, a11y, behavior   │
├─────────────────────────────────────────────────────────────────┤
│  --nf-* Tokens         │  Single source of truth for visuals    │
└─────────────────────────────────────────────────────────────────┘
```
