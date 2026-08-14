# Tomic / Anatomy — Color System

**Functional UI colors for enterprise SaaS.** Supports hierarchy, readability, and interaction states. No Material Design visuals; no branding or decorative palettes. Angular Material is used only for interaction and accessibility.

**Implementation:** Token values and semantic aliases live in `_colors.scss`. Component tokens in `_components.scss` and `_layout.scss` reference semantic tokens. Buttons, tables, toolbars, filter bar, layout, and reset use these tokens. Prefer semantic tokens (`--nf-surface-*`, `--nf-text-*`, `--nf-border-*`, `--nf-primary`, etc.) in new or updated styles.

---

## 1. Color Philosophy

- **Color supports hierarchy, not decoration.** Use color to signal importance, state, or intent—not to fill space or match a brand mood.
- **Spacing and layout carry most of the visual structure.** Surfaces stay neutral; borders and gaps define sections.
- **Most surfaces remain neutral.** One neutral family; subtle steps between page, section, table, hover, and selected.
- **Semantic colors are rare and intentional.** Primary for main action; danger for destructive; success/warning for status. Nothing else.
- **Readable for long sessions.** Power users work in the UI for hours. Avoid loud contrast, colored backgrounds everywhere, or “Material-like” emphasis patterns.

**Avoid:** Loud contrasts, colored backgrounds everywhere, elevation-driven emphasis, extra shades “just in case,” opacity-only hierarchy.

---

## 2. Neutral Surfaces (Foundation)

All surfaces belong to the same neutral family. Differences are subtle and perceptible, not dramatic. Hover and selection are visible but not distracting.

| Token | Intended usage |
|-------|-----------------|
| `--nf-surface-page` | Page / viewport background (root content area). |
| `--nf-surface-section` | Section, panel, or card background (e.g. toolbar strip, filter bar, card). |
| `--nf-surface-table` | Table body background (may match section or be one step lighter/darker). |
| `--nf-surface-hover` | Row or item hover (subtle; same hue family). |
| `--nf-surface-selected` | Selected row or item (clearly distinct from hover; may use a very light tint of primary or a neutral step). |

**Rules:** Same neutral family only. No colored surfaces for layout. Hover and selected must be distinguishable from default and from each other.

*Implementation note: Map to existing `--nf-color-bg`, `--nf-color-surface`, `--nf-color-surface-hover`, `--nf-color-bg-muted`, etc. where names align; add `--nf-surface-*` aliases if needed for clarity.*

---

## 3. Text Color Hierarchy

Minimal hierarchy. Contrast must be sufficient for accessibility; secondary and muted text must remain readable. Do not rely on opacity alone for hierarchy.

| Token | Intended usage |
|-------|-----------------|
| `--nf-text-primary` | Default content (body, table cells, labels). |
| `--nf-text-secondary` | Descriptions, metadata, secondary labels. |
| `--nf-text-muted` | Placeholders, hints, captions, disabled labels. |
| `--nf-text-disabled` | Disabled control text (reduced emphasis, still legible). |

**Rules:** Each level must meet contrast requirements on its background. Prefer distinct gray steps over opacity on a single color.

*Implementation note: Align with existing `--nf-color-text`, `--nf-color-text-secondary`, `--nf-color-text-muted`, `--nf-color-text-disabled`.*

---

## 4. Borders, Dividers & Outlines

Structural separation only. Neutral and calm. Focus outline clearly visible but not flashy. Do not rely on shadows for separation.

| Token | Intended usage |
|-------|-----------------|
| `--nf-border-default` | Default border (inputs, tables, buttons, cards). |
| `--nf-border-subtle` | Subtle divider (between list items, inside panels). |
| `--nf-border-strong` | Strong divider (context change, e.g. section vs content). |
| `--nf-border-focus` | Keyboard focus outline (visible, not flashy; overrides hover). |

**Rules:** Borders define edges and sections. Focus outline takes precedence over hover visually. No colored borders for layout.

*Implementation note: Align with existing `--nf-color-border`, `--nf-color-border-focus`, `--nf-color-border-muted`; add subtle/strong if needed.*

---

## 5. Semantic Colors (Strictly Limited)

Intent only: primary action, danger, success, warning, neutral (disabled/inactive). Each has base, hover, active where relevant, and a subtle/background variant (very light). No extra shades “just in case.” Semantic colors are not used for layout.

| Intent | Base | Hover | Active | Subtle (background) |
|--------|------|-------|--------|----------------------|
| **Primary** | `--nf-primary` | `--nf-primary-hover` | `--nf-primary-active` | `--nf-primary-subtle` |
| **Danger** | `--nf-danger` | `--nf-danger-hover` | — | `--nf-danger-subtle` |
| **Success** | `--nf-success` | — | — | `--nf-success-subtle` (optional) |
| **Warning** | `--nf-warning` | — | — | `--nf-warning-subtle` (optional) |
| **Neutral (inactive)** | `--nf-neutral` | — | — | — |

**Usage:** Primary = main action (one per context). Danger = destructive. Success = confirmation/status. Warning = rare, exceptional. Neutral = disabled or inactive UI. Do not use semantic color for large areas or as the only separator.

*Implementation note: Map to existing `--nf-color-primary`, `--nf-color-primary-hover`, `--nf-color-primary-active`, `--nf-color-primary-light` (as subtle); same for danger, success, warning; add `--nf-neutral` if missing.*

---

## 6. Interaction States (Cross-cutting)

State changes should be perceivable but subtle. Avoid stacking multiple strong signals (e.g. color + thick border + background). Disabled reduces emphasis but preserves legibility. Focus overrides hover visually.

| State | What changes | Buttons | Rows / items | Inputs |
|-------|----------------|---------|--------------|--------|
| **Default** | Surface + text/border per hierarchy | variant base | surface-table | border-default, bg section |
| **Hover** | Background (and optionally border) | variant hover | surface-hover | border-hover |
| **Active / pressed** | Darker or stronger | variant active | — | — |
| **Selected** | Background (and optional border) | — | surface-selected | — |
| **Disabled** | Muted surface/text, no hover | opacity + cursor | — | text-disabled, border-subtle |
| **Focused** | Outline (border-focus or ring) | outline overrides hover | outline | border-focus |

**Rules:** One primary visual signal per state. Focus indicator must be clearly visible for keyboard users. Disabled state must not hide the control.

---

## 7. Table-Specific Color Rules

Tables stay calm and scan-friendly. No heavy grid lines. Prefer hover over zebra striping.

| Element | Token / rule |
|---------|------------------|
| **Header background** | Slightly distinct from body (e.g. one neutral step); not a strong color. |
| **Header text** | Secondary or muted to show hierarchy. |
| **Body background** | Same as section/table surface. |
| **Row hover** | surface-hover. |
| **Row selection** | surface-selected (very light tint or neutral step). |
| **Zebra striping** | **No** by default. Use only if data density is very high and validated with users. |
| **Dividers** | Subtle horizontal lines between rows optional; no full grid. |

**Rules:** No heavy grid; vertical borders only if needed for dense columns. Header vs body difference is subtle. Hover and selected must be clearly visible.

*Implementation note: Align with existing `--nf-table-header-bg`, `--nf-table-row-bg`, `--nf-table-row-hover-bg`, `--nf-table-row-selected-bg`, `--nf-table-border-color`.*

---

## 8. Accessibility Constraints

- **Contrast:** Text and interactive elements must have sufficient contrast against their background (target: meet WCAG AA for normal text; intent stated here; full audit not in scope yet).
- **Focus:** Visible focus indicator for keyboard users; focus outline must not be removed or reduced to opacity-only.
- **Semantic color:** Semantic color must not be the only indicator (e.g. danger = red + icon/text “Delete”). Icons or text still required.
- **Disabled:** Disabled state must be perceivable (e.g. reduced contrast, not invisible).

No full WCAG audit or automated checks are specified here—intent only.

---

## 9. Usage Rules (Summary)

**Do:**

- Use neutral surfaces for almost all layout; reserve semantic color for actions and status.
- Use the same neutral family for page, section, table, hover, selected.
- Use text hierarchy (primary, secondary, muted, disabled) with real color steps, not opacity only.
- Use borders for separation; use focus outline for keyboard focus.
- Keep tables calm: subtle header, hover, selection; no zebra by default.
- Ensure hover, selected, disabled, and focus are all clearly distinguishable.

**Avoid:**

- Material Design color system, elevations, or visual language.
- Branding, marketing, or decorative color palettes.
- Loud contrast or colored backgrounds everywhere.
- Relying on semantic color alone (always pair with icon or text).
- Heavy grid lines or full borders on tables.
- Introducing extra semantic shades “just in case.”
- Using shadows as the primary way to separate sections (prefer borders and surfaces).

---

## Token Reference (Names Only)

**Surfaces:**  
`--nf-surface-page` · `--nf-surface-section` · `--nf-surface-table` · `--nf-surface-hover` · `--nf-surface-selected`

**Text:**  
`--nf-text-primary` · `--nf-text-secondary` · `--nf-text-muted` · `--nf-text-disabled`

**Borders:**  
`--nf-border-default` · `--nf-border-subtle` · `--nf-border-strong` · `--nf-border-focus`

**Semantic:**  
`--nf-primary` · `--nf-primary-hover` · `--nf-primary-active` · `--nf-primary-subtle`  
`--nf-danger` · `--nf-danger-hover` · `--nf-danger-subtle`  
`--nf-success` · `--nf-success-subtle` (optional)  
`--nf-warning` · `--nf-warning-subtle` (optional)  
`--nf-neutral`

Values and mapping to existing `_colors.scss` variables are left to implementation; this document defines semantics and usage only.
