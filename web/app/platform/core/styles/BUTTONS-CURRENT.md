# Buttons & Button Groups — Current Implementation

**As implemented today.** No redesign; no naming changes. For UX refinement and interaction rules only.

**UX semantics, behavioral rules, and usage guidelines:** see [BUTTONS-UX-SEMANTICS.md](./BUTTONS-UX-SEMANTICS.md).

---

## 1. Button Component

**Selector:** `nf-button`  
**Location:** `web/app/platform/lib/anatomy/components/atoms/button/button.component.ts`

### Public API (inputs / outputs)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `variant` | `ButtonVariant` | `'primary'` | Visual style. |
| `size` | `ButtonSize` | `'md'` | Size. |
| `icon` | `string \| undefined` | `undefined` | Material icon name. |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Leading or trailing icon. |
| `loading` | `boolean` | `false` | Shows spinner and disables click. |
| `disabled` | `boolean` | `false` | Disabled state. |
| `fullWidth` | `boolean` | `false` | Stretch to container width. |

| Output | Payload | Description |
|--------|---------|-------------|
| `clicked` | `MouseEvent` | Emitted on click (not emitted when disabled or loading). |

**Types:**  
- `ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'`  
- `ButtonSize = 'sm' | 'md' | 'lg'`

### Variants

- **primary** — Filled, primary color; hover darkens.
- **secondary** — Transparent, primary border and text; hover light background.
- **tertiary** — Surface background; hover darker surface.
- **danger** — Filled danger color; hover darkens.
- **ghost** — Transparent, secondary text; hover light background.

### Sizes

- **sm** — `min-height: 32px`, `padding: 4px 12px`, `font-size: 0.8125rem`.
- **md** — `min-height: 40px`, `padding: 8px 16px`, `font-size: 0.875rem`.
- **lg** — `min-height: 48px`, `padding: 12px 24px`, `font-size: 1rem`.

*Note: These values are hardcoded in the component styles. Design tokens exist in `_components.scss` (`--nf-button-height-*`, `--nf-button-padding-x-*`) but are not used by the button component today.*

### Icon support

- **Leading:** `icon` set, `iconPosition="left"` (default). Icon rendered before content.
- **Trailing:** `icon` set, `iconPosition="right"`. Icon rendered after content.
- **Icon-only:** `icon` set and no content (or empty `<nf-button ...></nf-button>`). Content is in `<span class="nf-button__content">`; when empty, the button still has the gap (8px) from the flex layout. Used in toolbar via `nf-button-list` with `view="icons"`.

Icon size: 20px (md); 18px for sm; 24px for lg. All hardcoded in component.

### Loading / disabled

- **loading:** `true` → `<mat-spinner diameter="18">` shown in place of leading icon; button disabled for click; `clicked` not emitted.
- **disabled:** `true` → `opacity: 0.5`, `cursor: not-allowed`; `clicked` not emitted.  
- If both, `disabled` is effectively applied (button element gets `[disabled]="disabled() || loading()"`).

### Default height(s) and padding

- **Default size:** `md` → min-height 40px, padding 8px 16px.
- **Heights:** sm 32px, md 40px, lg 48px (inline styles; design tokens not referenced).

### Alignment rules

- **Layout:** `display: inline-flex`, `align-items: center`, `justify-content: center`, `gap: 8px` (hardcoded). Text and icon are vertically centered; no baseline alignment.
- **Full width:** When `fullWidth` is true, host is `display: block`, `width: 100%`; button is full width.

### Current usage examples

| Context | Usage |
|--------|--------|
| **Header** | `nf-page-header` uses config-driven `primaryAction` / `secondaryAction`; each rendered as `<nf-button variant="primary"|"secondary" [icon]="..." ...>`. Single primary + single secondary; no `nf-button-list`. |
| **Toolbar** | `<nf-button-list [actions]="toolbarConfig.actions" view="horizontal" [responsive]="{ breakpointPx: 768, fallbackView: 'menu' }" variant="secondary" />`. Actions are Export, More options, View. |
| **Filter bar** | `<nf-button variant="ghost" ...>` for “Filters” toggle and “Reset”. |
| **Row action** | Data table exposes `rowActionsTemplate`; consumer provides `<ng-template #rowActions let-row>...</ng-template>` with their own buttons (e.g. `nf-button`). Table does not use `nf-button-list` for row actions. |
| **Modals / dialogs / forms** | `nf-button` for Cancel, Save, Confirm, etc. (primary/secondary/ghost as needed). |
| **Empty / error state** | Single CTA `<nf-button variant="primary" ...>` from config. |

---

## 2. Button List / Button Group

**Component name:** `nf-button-list` (ButtonListComponent)  
**Location:** `web/app/platform/lib/anatomy/components/molecules/button-list/button-list.component.ts`

There is no separate “button group” component; grouping is done by `nf-button-list`.

### Layout strategy

- **Container:** `<div class="nf-button-list nf-button-list--{{ effectiveView() }}">`.
- **Flex:** `display: flex`, `gap: var(--nf-button-list-gap, 8px)`.
- **By view:**
  - **list** — `flex-direction: column`, `align-items: stretch`, `min-width: 160px`.
  - **horizontal** — `flex-direction: row`, `flex-wrap: wrap`, `align-items: center`.
  - **icons** — `flex-direction: row`, `align-items: center`, `gap: var(--nf-button-list-icons-gap, 4px)`.
  - **menu** — Single trigger button (no flex row of actions); trigger opens `<mat-menu>` with menu items.

### Spacing between buttons

- **Horizontal / list:** `--nf-button-list-gap` with fallback `8px` (defined in component styles; not in `_components.scss`).
- **Icons:** `--nf-button-list-icons-gap` with fallback `4px`.
- **Menu:** No gap between buttons (all actions are in the dropdown).

### Responsive behavior (implemented today)

- **Input:** `responsive?: { breakpointPx: number; fallbackView: 'menu' | 'icons' }`.
- **Logic:** `effect()` + `window.matchMedia(\`(max-width: ${breakpointPx}px)\`)`; when match, `isNarrow` is true and `effectiveView()` returns `fallbackView` instead of `view`.
- So: **manual** configuration (consumer sets `[responsive]`); when set, **automatic** switch at breakpoint. No built-in default breakpoint.

### Overflow / collapse

- **Overflow:** No “first N visible, rest in overflow” behavior. Either all actions are visible (horizontal / icons / list) or all are in a **menu** (one trigger, dropdown).
- **Collapse:** “Collapse” is implemented as **menu** view: one trigger button (default icon `more_vert`, aria-label “Actions”) that opens a dropdown listing all actions. Used in toolbar with `fallbackView: 'menu'` below 768px.

---

## 3. Responsive Behavior

### Tablet / mobile

- **Default:** None. `nf-button-list` does not change view unless `responsive` is provided.
- **When `responsive` is set (e.g. toolbar):**
  - **Below `breakpointPx` (e.g. 768px):** `effectiveView` becomes `fallbackView`.
  - **fallbackView: 'menu'** → All actions collapse into one trigger; dropdown shows full list (same as `view="menu"`).
  - **fallbackView: 'icons'** → Same set of actions rendered as icon-only buttons (smaller footprint).

### Do buttons turn into…?

| Behavior | Implemented? | How |
|---------|--------------|-----|
| **Icon-only** | Yes | `view="icons"` or `fallbackView: 'icons'`. Each action is `<nf-button size="sm" [icon]="action.icon ?? 'circle'" ...></nf-button>` (no label in content). |
| **Overflow menu** | Yes | `view="menu"` or `fallbackView: 'menu'`. One trigger; `<mat-menu>` with `mat-menu-item` per action. |
| **Stacked layout** | Yes (but not for toolbar) | `view="list"`. Column layout, full-width buttons; not used in current toolbar/header. |

### Automatic vs manual

- **View mode:** Manual — consumer sets `view` (horizontal / icons / list / menu).
- **Breakpoint switch:** Automatic once configured — consumer sets `responsive: { breakpointPx, fallbackView }`; component listens to `matchMedia` and flips `effectiveView` when width &lt; breakpoint.

---

## 4. Constraints & Decisions

### Why this approach

- **Single button:** Wrap Material `mat-button` for consistent look and one API (variant, size, icon, loading); avoids scattering Material classes and allows future tokenization.
- **Button list:** One component for “set of actions” with multiple presentations (horizontal, icons, list, menu) and optional responsive collapse to menu/icons, so toolbars and headers don’t each implement breakpoints and overflow.

### Known limitations / pain points

- Button **does not use** design tokens from `_components.scss` (heights, padding); values are duplicated in component styles. Inconsistency risk if tokens are updated.
- **No “overflow” pattern:** Cannot show “first 3 buttons + More” without building it yourself; only “all visible” or “all in menu.”
- **Row actions:** Table does not provide a standard “row action bar”; consumer supplies `rowActionsTemplate` with custom markup (e.g. multiple `nf-button`), so alignment and density can vary.
- **Icon-only in list:** When `view="icons"`, missing `action.icon` falls back to `'circle'`; no way to hide an action or use text-only in icons view.

### Intentionally avoided

- No split button (single trigger with primary + dropdown).
- No automatic “collapse to menu at breakpoint” without consumer opt-in (no default `responsive`).
- No design-token coupling in the button component yet (tokens exist; component uses px).

---

## 5. Code Snippets

### Button component (relevant parts)

```ts
// Inputs
variant = input<ButtonVariant>('primary');
size = input<ButtonSize>('md');
icon = input<string | undefined>(undefined);
iconPosition = input<'left' | 'right'>('left');
loading = input<boolean>(false);
disabled = input<boolean>(false);
fullWidth = input<boolean>(false);
clicked = output<MouseEvent>();

// Template: mat-button with [class]="buttonClasses()", [disabled]="disabled() || loading()"
// - If loading: mat-spinner (diameter 18)
// - Else if icon left: mat-icon
// - span.nf-button__content with ng-content
// - If not loading and icon right: mat-icon
```

```scss
// Sizes (inline in component)
.nf-button--sm { padding: 4px 12px; font-size: 0.8125rem; min-height: 32px; }
.nf-button--md { padding: 8px 16px; font-size: 0.875rem; min-height: 40px; }
.nf-button--lg { padding: 12px 24px; font-size: 1rem; min-height: 48px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; ... }
```

### Button list component (relevant parts)

```ts
// Inputs
actions = input.required<ButtonListItem[]>();
view = input<ButtonListView>('horizontal');  // 'list' | 'horizontal' | 'icons' | 'menu'
responsive = input<ButtonListResponsiveConfig | undefined>(undefined);
menuTriggerIcon = input<string>('more_vert');
menuTriggerAriaLabel = input<string>('Actions');
variant = input<ButtonVariant>('secondary');
size = input<ButtonSize>('md');
actionClick = output<string>();

// effectiveView: when responsive set and isNarrow, return fallbackView; else view
// isNarrow: matchMedia(max-width: breakpointPx)
```

```html
<!-- horizontal / list / icons: for each action, nf-button with [variant], size (list => md), [icon], [fullWidth] (list => true), (clicked) => onActionClick(action.id) -->
<!-- menu: one button [matMenuTriggerFor], mat-menu with mat-menu-item per action -->
```

```scss
.nf-button-list { display: flex; gap: var(--nf-button-list-gap, 8px); }
.nf-button-list--list { flex-direction: column; align-items: stretch; min-width: 160px; }
.nf-button-list--horizontal { flex-direction: row; flex-wrap: wrap; align-items: center; }
.nf-button-list--icons { flex-direction: row; align-items: center; gap: var(--nf-button-list-icons-gap, 4px); }
```

### Example: toolbar (product-listing)

```html
<div class="nf-listing-toolbar">
  <nf-listing-controls
    [columns]="listingColumns"
    [filterActive]="filterActive"
    [sortActive]="sortActive"
    [search]="search"
    (filterClick)="onFilterClick()"
    (sortClick)="onSortClick()"
    (searchChange)="onSearchChange($event)">
  </nf-listing-controls>
  <nf-button-list
    [actions]="toolbarConfig.actions"
    view="horizontal"
    [responsive]="{ breakpointPx: 768, fallbackView: 'menu' }"
    variant="secondary"
    (actionClick)="onToolbarAction($event)">
  </nf-button-list>
</div>
```

`toolbarConfig.actions` (e.g. from `toolbar.config.ts`):

```ts
actions: [
  { id: 'export', label: 'Export', icon: 'upload' },
  { id: 'more', label: 'More options', icon: 'more_vert', ariaLabel: 'More options' },
  { id: 'viewToggle', label: 'View', icon: 'view_module', ariaLabel: 'Toggle view' },
],
```

### Example: header (config-driven)

```html
<nf-page-header [config]="headerConfig" (actionClick)="onHeaderAction($event)"></nf-page-header>
```

Config includes `primaryAction` and `secondaryAction`; page-header renders:

```html
<nf-button variant="secondary" [icon]="..." (clicked)="...">Import</nf-button>
<nf-button variant="primary" [icon]="..." (clicked)="...">Add Product</nf-button>
```

Actions container: `display: flex`, `align-items: center`, `gap: var(--nf-space-2, 8px)`, `margin-left: auto`.

---

*Document reflects codebase as of creation; no redesign or naming changes applied.*
