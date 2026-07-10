# Nafura Design System — Layout & Spacing

Concise specification for spacing, component heights, padding, containers, alignment, and responsiveness. Optimized for **dense enterprise interfaces**; avoids Material Design proportions.

---

## 1. Spacing Scale

**Single scale, 4px base.** Use only these values everywhere.

| Token | Value | Usage |
|-------|--------|--------|
| `--nf-space-1` | **4px** | **Inline** — gap between icon and label, between small chips/badges, tight list items. |
| `--nf-space-2` | **8px** | **Inline / tight block** — gap between buttons in a group, form field to label, toolbar item spacing. |
| `--nf-space-3` | **12px** | **Block** — vertical gap between related blocks (e.g. toolbar → table), compact section padding. |
| `--nf-space-4` | **16px** | **Block / section** — default gap between sections, padding inside toolbar/inputs, cell horizontal padding. |
| `--nf-space-6` | **24px** | **Section** — space between major page zones (e.g. header → toolbar), card/section inner padding when not compact. |
| `--nf-space-8` | **32px** | **Page** — page container padding, large separation between page-level areas. |

**Rules:** No random values (e.g. 6px, 10px, 14px, 20px). For anything in between, choose the next step up or down. Prefer the smaller step when in doubt for density.

---

## 2. Component Heights (Critical)

Heights drive visual alignment across rows (toolbar, table, inputs). Keep consistent.

| Component | Small | Medium | Notes |
|-----------|--------|--------|--------|
| **Button** | 32px | 40px | No 48px default; dense. |
| **Input / Select** | — | 40px | Same as button medium so they align in one row. |
| **Toolbar** | — | **Target 40px** | Single row; padding + content height. May grow vertically only when wrapping. |
| **Table row** | — | 40px | Same as input/button for alignment when actions in row. |
| **Table header** | — | 36px | Slightly smaller than row; subtle. |
| **Pagination bar** | — | 40px | Aligns with toolbar and table row. |
| **Page header** | min 56px | max 80px | Breadcrumb + title + actions; compact top/bottom padding. |

**Constraints:**

- Listing pages: dense but readable; no oversized touch targets.
- Heights align: toolbar row = input height = table row height = pagination row (40px).
- Table header can be 36px so the header reads as secondary to the data row.
- **Toolbar:** Target height 40px; may grow vertically only when wrapping. Do not set a larger default (e.g. 48px) “for comfort”—reinforces density discipline.

**Tokens (align with existing):**

- `--nf-button-height-sm` = 32px, `--nf-button-height-md` = 40px
- `--nf-input-height` = 40px
- `--nf-table-row-height` = 40px (derive from cell padding or set explicitly)
- `--nf-listing-toolbar-height` = 40px (target; may grow when wrapping)
- `--nf-page-header-min-height` = 56px, `--nf-page-header-max-height` = 80px

---

## 3. Padding Rules

**Principle:** Vertical rhythm > horizontal freedom. Avoid over-padding.

| Context | Vertical | Horizontal | Notes |
|---------|----------|------------|--------|
| **Button** | 6–8px (sm), 8px (md) | 12px (sm), 16px (md) | Symmetric vertical; horizontal from spacing scale. |
| **Input / Select** | 8px top/bottom | 12px | Content area; total height 40px. |
| **Table cell** | 12px | 16px | Keeps row height 40px with ~14–16px text and tight line-height. Assumes single-line content; multi-line rows may auto-expand. |
| **Toolbar container** | 8px | 8px | Tight; inner gaps between items = 8px. |
| **Page section** | 12px (compact) / 16px (default) | 16px | Section padding; vertical drives rhythm. |

**Rules:**

- Use the same vertical padding for all elements in a single row (e.g. toolbar) so baselines align.
- Prefer 12px or 16px for section vertical padding; 8px only for toolbar or very compact blocks.
- Do not use asymmetric padding (e.g. 8px top, 16px bottom) unless there’s a clear hierarchy (e.g. more space below a title).

---

## 4. Layout Containers

| Container | Default padding | Max width | Scroll behavior |
|-----------|-----------------|-----------|------------------|
| **Page** | 16px or 24px | 1400px (content); listing may opt out for full-width | Page body scrolls; header/toolbar can be sticky. Listing pages may opt out of max-width (full-width) if data-heavy. |
| **Section** | 12px (listing) / 16px (generic) | Inherits page | No inner scroll; section is a block. |
| **Toolbar** | 8px | None (full width of section) | No scroll; wrap to next line on narrow. |
| **Table** | 0 (table fills section) | None | Horizontal scroll inside view; vertical scroll view. |

**Notes:**

- Page container: `--nf-page-container-padding` = 16px or 24px; content max-width 1400px centered. Listing pages may opt out (full-width) if data-heavy.
- Section: `--nf-page-section-padding` / `--nf-listing-section-padding`; no max-width.
- Toolbar: `--nf-listing-toolbar-padding` = 8px; flex, wrap, no overflow scroll.
- Table: lives in listing “view” container; view has `overflow: auto`; table scrolls inside it.

---

## 5. Alignment & Rhythm Rules

| Scenario | Rule |
|----------|------|
| **Vertical centering vs baseline** | Use **vertical center** for single-line controls (buttons, inputs, toolbar row). Use **baseline** for text-heavy blocks (e.g. title + subtitle). |
| **Text vs icon** | Icon and label: **center** icon to cap-height of text (or use 8px gap). Icon-only button: center icon in hit area. |
| **Actions relative to titles** | Page header: actions **end-aligned** (flex-end) on the same row as title. Toolbar: primary actions **end-aligned** (margin-left: auto). |
| **Separator vs spacing** | Use a **Separator** (border) when changing context (e.g. toolbar vs table, sidebar vs content). Use **spacing** only within the same context (e.g. between buttons, between title and breadcrumb). |

**Summary:** Same context → spacing. New context → Separator (or strong spacing + optional border).

**Naming:** In code and specs, use **Separator** (or **Context separator**) for the visual divider between contexts—boring and explicit, avoids ambiguity with “spacing” and prevents naming from leaking into implementation.

---

## 6. Responsiveness (Foundational)

| Topic | Rule |
|-------|------|
| **Primary layout** | **Flex** for page/section/toolbar/header; **grid** only when explicit columns (e.g. form two-column layout). |
| **Wrapping** | Toolbar: **wrap** (flex-wrap) so search, filters, actions move to next line on narrow. Header actions: **wrap** similarly. No horizontal scroll of the whole toolbar. |
| **Breakpoints** | **Few:** e.g. `sm` 640px, `md` 1024px. Use for: toolbar wrap, header layout (stack vs row), optional sidebar collapse. Do not add many breakpoints. |
| **Table on small screens** | **Horizontal scroll** inside the table container; no redesign (no cards, no hidden columns by default). Keep same component heights. |

---

## 7. Design System Summary

- **Spacing:** One scale — 4, 8, 12, 16, 24, 32 px. Inline → block → section → page.
- **Heights:** 32 (button sm), 40 (button md, input, toolbar, table row, pagination), 36 (table header). Page header 56–80px.
- **Padding:** Vertical rhythm first; buttons 8px, inputs 8px, cells 12px vertical / 16px horizontal, toolbar 8px, sections 12–16px.
- **Containers:** Page 16–24px padding, 1400px max; section 12–16px; toolbar 8px; table 0 padding, scroll inside view.
- **Alignment:** Center for controls; baseline for text blocks; actions end-aligned; Separator at context change.
- **Responsiveness:** Flex primary; wrap toolbar and header; few breakpoints; table scrolls horizontally.

---

## Token Reference (Names + Values)

**Spacing (canonical 6-step)**  
`--nf-space-1` 4px · `--nf-space-2` 8px · `--nf-space-3` 12px · `--nf-space-4` 16px · `--nf-space-6` 24px · `--nf-space-8` 32px

**Heights**  
`--nf-button-height-sm` 32px · `--nf-button-height-md` 40px · `--nf-input-height` 40px · `--nf-listing-toolbar-height` 40px · table row 40px · table header 36px · pagination 40px · page header min 56px / max 80px

**Padding**  
Button: y 6–8px, x 12–16px · Input: y 8px, x 12px · Table cell: y 12px, x 16px · Toolbar: 8px · Section: 12–16px · Page: 16–24px

**Containers**  
`--nf-page-container-padding` · `--nf-page-section-padding` · `--nf-listing-section-padding` · `--nf-listing-toolbar-padding` · `--nf-content-max-width` 1400px

**Breakpoints (reference)**  
sm 640px · md 1024px

---

## Usage Guidelines

1. **Always use tokens** — No raw px for spacing/height/padding except in token definitions.
2. **Pick the right step** — Inline 4–8; block 8–12; section 16–24; page 24–32.
3. **Keep row heights 40px** — Toolbar, input, table row, pagination so they align.
4. **Prefer less padding** — Use 8px or 12px where possible; 16px for sections.
5. **Separate by context** — Same context = spacing; new context = Separator (border) or clear gap.
6. **Flex + wrap** — Toolbar and header actions wrap; table scrolls; few breakpoints.
