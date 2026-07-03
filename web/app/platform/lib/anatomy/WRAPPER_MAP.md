# Tomic Wrapper Map

> Canonical frontend documentation now lives in [docs/frontend/README.md](docs/frontend/README.md). This map remains the authoritative wrapper inventory.

> Authoritative mapping of UI primitives to their wrappers, engines, and usage policies.

---

## Wrapper Policy Table

| Primitive | Public Component | Engine | Current Usage | Decision | Notes |
|-----------|-----------------|--------|---------------|----------|-------|
| **Button** | `nf-button` | Material (`mat-button`) | ✅ Wrapped | Keep as-is | Uses `--nf-*` tokens for all variants |
| **Icon Button** | `nf-button` (icon-only) | Material (`mat-button`, `mat-icon`) | ⚠️ Mixed | Wrap now | Some direct `mat-icon-button` usage exists |
| **Menu / Overflow** | `nf-button-list` | Material (`mat-menu`) | ✅ Wrapped | Keep as-is | Handles responsive collapse to menu |
| **Tooltip** | `nfTooltip` directive | Material (`MatTooltip`) | ✅ Wrapped | Keep as-is | Directive wraps host directive pattern |
| **Checkbox** | ❌ None | Material (`mat-checkbox`) | ❌ Direct | **Wrap now** | Pink accent leak; needs `nf-checkbox` or global override |
| **Text Input** | `nf-search-input` (search only) | Material (`mat-form-field`) | ⚠️ Partial | Refactor later | General text input wrapper needed |
| **Search Input** | `nf-search-input`, `nf-search-expandable` | Material (`mat-form-field`) | ✅ Wrapped | Keep as-is | Expandable variant available |
| **Select** | ❌ None (via `nf-filter-bar`) | PrimeNG (`p-select`) | ⚠️ Indirect | Refactor later | Only usable inside filter-bar today |
| **MultiSelect** | ❌ None (via `nf-filter-bar`) | PrimeNG (`p-multiSelect`) | ⚠️ Indirect | Refactor later | Only usable inside filter-bar today |
| **DatePicker** | ❌ None (via `nf-filter-bar`) | PrimeNG (`p-datePicker`) | ⚠️ Indirect | Refactor later | Only usable inside filter-bar today |
| **Number Input** | ❌ None (via `nf-filter-bar`) | PrimeNG (`p-inputNumber`) | ⚠️ Indirect | Refactor later | Only usable inside filter-bar today |
| **Table / DataGrid** | `nf-data-table` | Material (`mat-table`, `mat-sort`) | ✅ Wrapped | Keep as-is | Full-featured with selection |
| **Paginator** | `nf-pagination` | Material (`mat-paginator`) | ✅ Wrapped | Keep as-is | 1-indexed API, styled via tokens |
| **Badge / Tag** | `nf-badge` | Custom (no engine) | ✅ Wrapped | Keep as-is | Pure CSS with `--nf-color-*` |
| **Drawer / Panel** | `nf-drawer` | Custom (no engine) | ✅ Wrapped | Keep as-is | Slide-in panel with backdrop |
| **Modal / Dialog** | `nf-modal` | Custom (CDK portal) | ✅ Wrapped | Keep as-is | Uses CDK for overlay |
| **Confirm Dialog** | `ConfirmDialogService` | Custom + `nf-modal` | ✅ Wrapped | Keep as-is | Imperative API |
| **Toast** | `ToastService` | Custom | ✅ Wrapped | Keep as-is | Imperative API |
| **Spinner** | `nf-spinner` | Custom (CSS) | ✅ Wrapped | Keep as-is | Pure CSS animation |
| **Skeleton** | `nf-skeleton` | Custom (CSS) | ✅ Wrapped | Keep as-is | Loading placeholder |
| **Avatar** | `nf-avatar` | Custom | ✅ Wrapped | Keep as-is | Image + fallback initials |
| **Divider** | `nf-divider` | Custom (CSS) | ✅ Wrapped | Keep as-is | Horizontal/vertical separator |
| **Breadcrumb** | `nf-breadcrumb` | Custom | ✅ Wrapped | Keep as-is | Navigation trail |
| **Tabs** | `nf-tabs` | Custom | ✅ Wrapped | Keep as-is | Tab navigation |
| **Alert** | `nf-alert` | Custom | ✅ Wrapped | Keep as-is | Inline messages |

---

## Engine Choice Summary

| Category | Engine | Rationale |
|----------|--------|-----------|
| **Table, Sort, Paginator** | Angular Material | Best keyboard navigation, ARIA, CDK integration |
| **Form Controls (Select, Date, Multi)** | PrimeNG | Richer features than Material forms, better UX for complex selection |
| **Overlays (Menu, Tooltip)** | Angular Material | Mature overlay positioning via CDK |
| **Modals, Drawers** | Custom + CDK | Full control over styling, CDK for portal management |
| **Simple UI (Badge, Spinner, etc.)** | Custom | No engine needed; pure CSS/HTML |

---

## Current Direct Usage (To Be Addressed)

### Direct `mat-*` Usage in Feature Code

| File | Component | Usage | Action |
|------|-----------|-------|--------|
| `data-table.component.ts` | `mat-checkbox` | Table row selection | Override globally OR create `nf-checkbox` |
| `form.component.ts` | `mat-checkbox` | Form field | Override globally OR create `nf-checkbox` |
| `doc-extractor/*` | `mat-checkbox` | Various forms | Override globally OR create `nf-checkbox` |
| `button-list.component.ts` | `mat-icon-button` | Menu trigger | Acceptable (inside wrapper) |
| `search-expandable.component.ts` | `mat-icon-button` | Trigger button | Acceptable (inside wrapper) |

### Direct `p-*` Usage in Feature Code

| File | Component | Usage | Action |
|------|-----------|-------|--------|
| `filter-bar.component.ts` | `p-select`, `p-multiSelect`, etc. | Filter controls | Acceptable (inside wrapper) |

**Note**: Direct usage inside `lib/anatomy/components/**` is acceptable. Direct usage in `features/**` or `pages/**` is NOT acceptable.

---

## Wrappers to Introduce

### Priority 1: Immediate (Theme Consistency)

| Wrapper | Engine | Notes |
|---------|--------|-------|
| Global checkbox override | Material | Apply `--nf-*` tokens to `.mat-mdc-checkbox` globally |

### Priority 2: Near-term (API Consistency)

| Wrapper | Engine | Notes |
|---------|--------|-------|
| `nf-select` | PrimeNG `p-select` | Standalone select for use outside filter-bar |
| `nf-multiselect` | PrimeNG `p-multiSelect` | Standalone multiselect |
| `nf-datepicker` | PrimeNG `p-datePicker` | Standalone date picker |
| `nf-input` | Material `mat-form-field` | General text input wrapper |

### Priority 3: Future (Nice to Have)

| Wrapper | Engine | Notes |
|---------|--------|-------|
| `nf-checkbox` | Material `mat-checkbox` | If global override insufficient |
| `nf-radio` | Material `mat-radio` | When needed |
| `nf-switch` | Material `mat-slide-toggle` | When needed |

---

## No-Direct-Use Rule

### The Rule

> **Feature code (features/\*\*, pages/\*\*) must NEVER directly use `mat-*` or `p-*` components.**

### Allowed Locations for Direct Engine Usage

```
✅ lib/anatomy/components/**     (wrapper implementations)
✅ lib/anatomy/directives/**     (directive wrappers like nfTooltip)
❌ features/**                     (feature modules)
❌ pages/**                       (feature pages - if separate)
❌ products/**                    (product shells)
```

### How to Comply

1. **Need a button?** Use `<nf-button>`, not `<button mat-button>`
2. **Need a table?** Use `<nf-data-table>`, not `<table mat-table>`
3. **Need a dropdown?** Use `<nf-filter-bar>` (today) or request `nf-select` wrapper
4. **Need a tooltip?** Use `[nfTooltip]`, not `[matTooltip]`
5. **Need something not wrapped?** Request a wrapper in `lib/anatomy/components`

### Enforcement Mechanisms

#### Option A: ESLint Rule (Recommended)

```javascript
// .eslintrc.js (conceptual - requires custom rule)
{
  rules: {
    'tomic/no-direct-engine-usage': ['error', {
      forbidden: ['mat-*', 'p-*', 'matInput', 'matMenuTriggerFor'],
      allowedPaths: ['lib/anatomy/**']
    }]
  }
}
```

#### Option B: CI Grep Check

```bash
#!/bin/bash
# scripts/check-direct-usage.sh

# Check for mat-* tags in feature code
VIOLATIONS=$(grep -r -l --include="*.html" "<mat-" web/app/features/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo "ERROR: Direct mat-* usage found in feature code:"
  echo "$VIOLATIONS"
  exit 1
fi

# Check for p-* tags in feature code
VIOLATIONS=$(grep -r -l --include="*.html" "<p-" web/app/features/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo "ERROR: Direct p-* usage found in feature code:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "OK: No direct engine usage in feature code"
```

#### Option C: Code Review Checklist

- [ ] No `<mat-*>` tags in feature templates
- [ ] No `<p-*>` tags in feature templates
- [ ] No `matInput`, `matMenuTriggerFor`, `mat-icon-button` attributes in features
- [ ] All UI components are `nf-*` wrappers
- [ ] No hardcoded color values (use `var(--nf-*)`)

---

## CI Integration

### Running the Lint Check

```bash
# From project root
./infra/scripts/lint-tomic.sh
```

### Adding to CI Pipeline

```yaml
# Example GitHub Actions step
- name: Tomic UI Lint
  run: ./infra/scripts/lint-tomic.sh
```

### What It Checks

1. **`<mat-*>` tags** in `features/**` and `products/**` HTML files → ERROR
2. **`<p-*>` tags** in `features/**` and `products/**` HTML files → ERROR
3. **Material attributes** (`matInput`, `matMenuTriggerFor`, etc.) → WARNING
4. **MatXxxModule imports** in feature TypeScript files → WARNING

### Compliance Guide

| You want to... | DON'T use | DO use |
|----------------|-----------|--------|
| Add a button | `<button mat-button>` | `<nf-button>` |
| Add a checkbox | `<mat-checkbox>` | `<nf-data-table>` (selection) or global override |
| Add a dropdown | `<p-select>` | `<nf-filter-bar>` or request `nf-select` |
| Add a tooltip | `[matTooltip]` | `[nfTooltip]` |
| Add a table | `<table mat-table>` | `<nf-data-table>` |
| Add a modal | `<mat-dialog>` | `<nf-modal>` or `ConfirmDialogService` |

---

## Icon Strategy

### Current State

Three icon sets are loaded:
1. **Material Icons** - via `MatIconModule` (primary for UI)
2. **PrimeIcons** - via `primeicons/primeicons.css` (for PrimeNG components)
3. **FontAwesome** - via `@fortawesome/fontawesome-free` (legacy)

### Recommendation

| Context | Icon Set | Rationale |
|---------|----------|-----------|
| UI icons (buttons, menus, etc.) | Material Icons | Consistent with `mat-icon`, well-integrated |
| PrimeNG internal icons | PrimeIcons | Required by PrimeNG components |
| Legacy/specific needs | FontAwesome | Deprecate over time |

**Rule**: New UI code should use Material Icons exclusively. PrimeIcons are acceptable only within PrimeNG components.

---

## Summary

| Status | Count | Examples |
|--------|-------|----------|
| ✅ Fully Wrapped | 18 | `nf-button`, `nf-data-table`, `nf-badge`, `nf-drawer` |
| ⚠️ Needs Global Override | 1 | `mat-checkbox` (pink accent) |
| ⚠️ Indirect Only | 4 | `p-select`, `p-multiSelect`, `p-datePicker`, `p-inputNumber` |
| ❌ Missing Standalone | 4 | `nf-select`, `nf-input`, `nf-datepicker`, `nf-checkbox` |

