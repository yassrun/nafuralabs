# UX Core Patterns: Master–Slave, Wizard, Settings

**Status:** Spec + implementation plan. Socle decisions fixed (click vs double-click, wizard ≠ tabs, settings V1 = composition).

**Implementation status (Feb 2026):**
- Config-driven base classes exist for listing, detail, master-slave, dashboard, settings, wizard.
- Settings and wizard configs live in anatomy types (SettingsPageConfig, WizardPageConfig).

---

## 0) UX pattern types (socle)

Pour que l’IA et les générateurs trouvent ces patterns, ils doivent exister comme **type** :

```ts
/** UX pattern used by a page or route. */
export type UxPatternType = 'listing' | 'detail' | 'masterSlave' | 'wizard' | 'settings';
```

- **listing** = page liste standard (nf-entity-listing).
- **detail** = page détail/édition standard (nf-entity-detail).
- **masterSlave** = split master + slave, URL :id; two subtypes: **entity-focus** (list → entity detail), **entity-collection** (entity → dependent collection / lines).
- **wizard** = flux étapes, validation progressive, review step.
- **settings** = règles / toggles / config, explicit save, restore defaults.

Usage prévu : config de route, métadonnées de page ou generator (e.g. `uxPattern: 'masterSlave'`) pour choisir le bon template et les bons composants. À intégrer dans les types anatomy et, si besoin, dans le routing/meta.

---

## 1) Findings from existing Listing / Detail

### Reusable building blocks

| Block | Location | Role |
|-------|----------|------|
| **nf-page-shell** | `lib/anatomy/components/organisms/page-shell` | Full-height flex wrapper; optional scroll / no-padding. |
| **nf-page-header** | `lib/anatomy/components/molecules/page-header` | Title, subtitle, breadcrumbs, icon, primary/secondary actions (config-driven). |
| **nf-entity-listing** | `lib/anatomy/components/organisms/entity-listing` | Toolbar (nf-listing-controls), table/card/grid/list views, selection, pagination, empty/error/loading. |
| **nf-listing-controls** | `lib/anatomy/components/molecules/listing-controls` | Search, filters, columns, view-mode switcher, selection toggle. |
| **nf-data-table** | `lib/anatomy/components/organisms/data-table` | Sortable table, row click/dblclick, selection (single/multiple). |
| **nf-pagination** | `lib/anatomy/components/organisms/...` (see index) | Page + page-size; total. |
| **nf-entity-detail** | `lib/anatomy/components/organisms/entity-detail` | Sectioned form (fieldset + legend), header/footer actions (nf-button-list), config-driven fields. |
| **nf-button-list** | `lib/anatomy/components/molecules/button-list` | Toolbar/detail actions (left/right groups). |
| **nf-drawer** | `lib/anatomy/components/organisms/drawer` | Side panel (left/right), backdrop, header, body; no footer slot (can be extended or content-projected). |
| **nf-tabs** | `lib/anatomy/components/molecules/tabs` | Tab group (MatTabGroup skinned); tab change output. |
| **nf-empty-state / nf-error-state / nf-loading-state** | molecules | Listing/detail state placeholders. |

### Config & page classes

- **Listing:** `ListingPageConfig` (columns, filters, actions, routes, pagination, viewModes), `buildListingConfig`, `ConfigDrivenListingPage`, `ListingRouteConfig` (detail(item), create, list).
- **Detail:** `DetailPageConfig` (fields, sections, actions, routes, modes), `buildDetailConfig`, `ConfigDrivenDetailPage`, `DetailRouteConfig` (list, edit(item), view(item)?).
- **Selection:** Single click = toggle selection (single/multiple); double-click = navigate to detail via `routes.detail(item)`.
- **Header pattern:** Page header is separate from listing/detail; `headerConfig` (title, optional actions) passed to `nf-page-header`.

### Tokens & conventions

- All visuals via `--nf-*` (Tomic); no direct Material/PrimeNG in feature code.
- Spacing: `--nf-space-*`, component tokens in `_components.scss` (e.g. `--nf-page-header-*`, `--nf-table-row-height`).
- Listing: `nf-entity-listing__toolbar`, `nf-entity-listing__view`, `nf-entity-listing__pagination`; selection bar when 2+ selected.
- Detail: `nf-entity-detail__actions-bar`, `nf-entity-detail__section`, `nf-entity-detail__form`; sections collapsible optional.

### Gaps for new patterns

- **Master–Slave:** No split layout that keeps list + detail on one route; list state (filters/sort/page) is lost on navigate; no URL-driven selected id.
- **Wizard:** No step container or step validation/review; only flat/sectioned forms.
- **Settings:** No dedicated “settings” layout; tenant-admin modules page uses raw Material (mat-card, mat-slide-toggle) and is not config-driven or nf-*.

---

## 2) Pattern Spec: Master–Slave

**Socle:** Master–Slave is **one UX pattern** with **two subtypes**. Same shell (two panes, URL-driven selection, responsive); the **role of the slave** and the **composition** differ by subtype.

---

### Purpose (common)

Show a **persistent master** and a **contextual slave** on the same screen so users work without losing master context. Optional deep link to selected master (e.g. `:id` in URL). Single click on master opens the slave pane (exception to standard click = selection elsewhere).

---

### Two subtypes (formal)

| Subtype | Intent | Master | Slave | Example |
|--------|--------|--------|--------|--------|
| **entity-focus** | Continuous navigation / focus / editing across entities | List of **entities** (same type) | **Detail** of one entity (form/sections) | Products list → Product detail |
| **entity-collection** | Working on a **dependent** flow or collection in the context of one master | **One entity** (header/card) or list of entities | **Dependent collection** (lines, movements, items) — not a “detail page” of the master | Inventory (header) → Inventory Tx Lines; Order → Order lines |

- **entity-focus:** Master = list; slave = entity detail (same entity type as list rows). Preserve list state (filters/sort/page); single click opens detail; URL = selected entity id.
- **entity-collection:** Master = one entity (or list where selecting one loads it as context); slave = one-to-many dependent collection (lines, transactions). Slave is **not** the “detail form” of the master; it is a **contextual collection** that only makes sense with the master. Add/edit/delete lines, inline or mini-forms; save semantics (e.g. save header + lines together, or per-line) are defined per flow.

**This remains ONE pattern** (one shell, one `UxPatternType: 'masterSlave'`), with two **subtypes** for IA/generators and composition guidance. No separate UX patterns; no new design concepts.

---

### When to use

- **entity-focus:** Browsing many items and frequently opening/closing details (documents, orders, contacts). List context must be preserved when viewing/editing one item.
- **entity-collection:** Working on header + lines, or parent + dependent list (inventory + movements, order + lines). The dependent collection has no meaning without the selected master.

### When not to use

- Full-page CRUD where list → detail is a deliberate drill-down and list state can be re-established on back.
- When slave content is heavy (many tabs, large forms) and a full-page view is clearer.
- When the “slave” is an independent list (same entity type as master, no parent-child relation); that is entity-focus, not entity-collection.

---

### Composition (reuse) by subtype

- **entity-focus**
  - **Master:** `nf-entity-listing` (or reduced variant: `nf-listing-controls` + `nf-data-table` + `nf-pagination`). Same config shape (`ListingPageConfig`); `routes.detail` used for URL only.
  - **Slave:** `nf-entity-detail` (form/sections, Save/Cancel/Delete). Or `nf-drawer` + `nf-entity-detail` on narrow.
- **entity-collection**
  - **Master:** One entity view (e.g. header summary card or minimal form) **or** list of entities where selecting one sets “current master” and loads dependent collection. Reuse existing blocks (e.g. compact detail, card, or small listing).
  - **Slave:** **Dependent collection** — e.g. table/list of lines with add/edit/delete (inline or small forms). Reuse `nf-data-table` (or list) + toolbar (Add line, etc.) and line-level actions. Not `nf-entity-detail` for the master; it is a collection UI (lines, movements, items).
- **Layout (both):** Same shell: two panes (master | slave), responsive (e.g. drawer for slave on narrow). `nf-page-header` at top; title can reflect “Entities” or selected entity / “Header + Lines”.

---

### Navigation model

- **entity-focus:** Route `.../items` and `.../items/:id`. Id = selected entity. Single click on row → open slave, update URL. Back/close → list-only URL; list state preserved.
- **entity-collection:** Route e.g. `.../inventories/:id` (master id). Selecting master (from list or breadcrumb) loads slave collection for that master. Optional sub-routes for “selected line” (e.g. `.../inventories/:id/lines/:lineId`) if needed; otherwise selection is in-memory or query. Back/close = clear slave or leave master context.

---

### Key interactions

- **Click (socle):** Single click on master = focus row & open slave (no selection mode for “open”). Same for both subtypes.
- **entity-focus:** List toolbar (New, Refresh, filters). Slave: Save, Cancel, Delete (same as standard detail). Save = persist entity; Cancel = discard and close slave.
- **entity-collection:** Master: optional edit/save of header. Slave: Add line, Edit line, Delete line (inline or dialog); save semantics = per product (e.g. save header + lines together, or dirty lines on submit). No “detail form” of the master in the slave pane—slave is the collection.

---

### How the current Master–Slave shell supports both

- **nf-master-slave-shell** is **subtype-agnostic**: it provides two slots (master, slave), `selectedId` / `selectedIdChange`, responsive overlay, and empty state when no selection. It does **not** assume slave content is `nf-entity-detail`.
- **entity-focus:** Page projects `nf-entity-listing` in master and `nf-entity-detail` in slave (current Products panel demo). URL = selected entity id; base class `ConfigDrivenMasterSlavePage` handles route sync, load, save/cancel/delete.
- **entity-collection:** Same shell; page projects **master** = header/card or list of parents, **slave** = table/list of dependents (e.g. `nf-data-table` for lines) + toolbar and line actions. No change to the shell; only the content of the two slots and the page logic (load lines for selected master, add/edit/delete lines) differ. Implementation can use the same `selectedId` for “selected master id” and drive slave content by that id.

---

### Accessibility and keyboard (high level)

- Focus management when opening/closing slave (focus in slave pane or back to master row/card).
- Tab through master and slave; Escape closes slave / clears selection.
- Screen reader: Announce slave update (e.g. “Detail for [name]” or “Lines for [master]”); master and slave as two regions (`aria-label` on panes).

---

## 3) Pattern Spec: Wizard

### Purpose

Guide users through a **multi-step create or configuration** flow with clear steps, per-step validation, and a final review/confirm step.

### When to use

- Creating an entity with many logical groups (e.g. “Basics” → “Pricing” → “Rules” → “Review”).
- Onboarding or setup flows where order of steps matters.
- When you want to reduce cognitive load by showing one section at a time.

### When not to use

- Single-step create/edit; use existing detail page.
- When steps are independent (use tabs or a flat form with sections instead).

### Composition (reuse)

- **Steps:** Each step content = existing **sectioned form** building blocks: same field types and section layout as `nf-entity-detail` (sections as fieldsets, same grid, same nf-* form controls). No custom per-flow UI where possible—reuse `nf-entity-detail` sections or a shared “step content” that accepts field/section config.
- **Progress (socle):** **nf-wizard-shell** has its own **stepper semantics** (progression + validation + lock). **Do NOT reuse nf-tabs as stepper.** Tabs = free navigation; Wizard = strict step order, validation before advance, optional lock of future steps. Visually a stepper can resemble tabs, but the component is dedicated (nf-wizard-shell with step labels, current step, optional “valid” state).
- **Actions:** Top or bottom bar: Back, Next, Submit; reuse `nf-button-list` (left: Back, right: Next/Submit). Same tokens and spacing as detail actions bar.
- **Shell:** `nf-page-shell` + `nf-page-header` (title = wizard name; optional subtitle = current step). Content = nf-wizard-shell (stepper + current step body + action bar).

### Navigation model

- **Route:** Option A: single route with `step` query or path (e.g. `.../create?step=2` or `.../create/pricing`). Option B: one route per step. Prefer one route + step index or id for simpler deep link and “resume” behavior.
- **Back/Next:** Back = previous step (no submit); Next = validate current step, then advance or show errors. Last step: Submit.
- **Direct step access:** Optional: allow clicking step indicator to jump to completed steps; block or warn when jumping over invalid steps.

### Key interactions

- **Progressive validation:** On “Next”, validate only current step’s form slice; show errors on that step. On “Submit”, validate all steps (or only remaining) and submit.
- **Review step:** Final step shows read-only summary of all steps (reuse same field/section config in read-only or summary layout); Submit from there.
- **Save/Cancel:** Cancel = confirm then leave wizard (navigate back). Optional “Save draft” = persist partial and leave (if product supports it).

### Accessibility and keyboard (high level)

- Stepper: step list with current step indicated (aria-current="step"); step labels in headings.
- Focus: when moving to next step, focus first field or step heading.
- Escape or Cancel: confirm and exit.

---

## 4) Pattern Spec: Settings UX

### Purpose

Provide a **clearly separated** area for rules, toggles, and configuration entities—distinct from operational listing/detail—with safe defaults and explicit apply/save.

### When to use

- Feature flags, module toggles, notification preferences, validation rules, defaults.
- Any screen that is “configuration” not “operational data” (e.g. not “list of orders” but “how orders behave”).

### When not to use

- Normal entity CRUD (use listing + detail).
- One-off admin tools that don’t need to feel like “settings.”

### Composition (reuse) — V1 = composition only (socle)

- **Layout:** **V1 Settings = composition only.** No nf-settings-shell. Use: **nf-page-shell** + **nf-page-header** + **nf-tabs** (for categories) + **section styling** (existing entity-detail section or fieldset + legend) + **nf-button-list** for actions. Add **nf-settings-section** only when 2–3 real pages show repetition; avoid creating a component “par principe”.
- **Form controls:** Reuse same nf-* form primitives used in entity-detail (toggles, selects, inputs) and section styling (fieldset + legend, or existing nf-entity-detail section classes). No raw `mat-card` / `mat-slide-toggle` in feature code—use nf-* wrappers and existing section styling.
- **Actions:** Per section or one global bar: “Restore defaults”, “Apply” / “Save”. Use `nf-button-list` (e.g. left: Restore defaults, right: Save). Explicit save (no auto-save by default) so “safe defaults” and “discard” are clear.
- **Visual distinction:** Same tokens and density as rest of app; differentiate by: (1) placement under “Settings” in nav, (2) page title “Settings” or “Settings > Category”, (3) optional icon/badge for “settings” in header. Do **not** look like a data table—prefer forms, toggles, and compact lists of options.

### Navigation model

- **Route:** e.g. `.../settings` and `.../settings/:category` (or query). Category = tab/section id.
- **Apply/Save:** Save persists settings; optional “You have unsaved changes” on leave. Restore defaults: reset form to defaults, then user must Save to persist.

### Key interactions

- **Safe defaults:** “Restore defaults” loads default config into form; user can edit and then “Save” or “Cancel” to leave without saving.
- **Explicit apply/save:** One “Save” (or “Apply”) action; optional per-section save if product needs it. Success toast on save.
- **Cancel/Discard:** If dirty, confirm “Discard changes?” then navigate away or reset form.

### Accessibility and keyboard (high level)

- Sections as landmarks or headings; toggles and controls with labels.
- Save/Cancel visible and in logical tab order; no unexpected auto-save without indication.

---

## 5) Minimal implementation plan + checklist

### Implementation order (socle)

1. **Master–Slave:** Valider spec (click = open pane, URL :id) → implémenter **nf-master-slave-shell** + **1 demo Products** uniquement.
2. **Wizard:** Puis **nf-wizard-shell** (stepper dédié, pas nf-tabs) + demo Product create wizard.
3. **Settings:** En dernier, **composition seulement** (nf-page-shell + nf-page-header + nf-tabs + section styling + nf-button-list); pas de nf-settings-shell ni nf-settings-section en V1.

### UX pattern type

- Ajouter `UxPatternType = 'listing' | 'detail' | 'masterSlave' | 'wizard' | 'settings'` dans `web/app/platform/lib/anatomy/types/` (ou endroit central) pour que l’IA et les generators puissent identifier le pattern d’une page.

### New nf-* components (core anatomy)

| Component | Purpose | Location |
|-----------|---------|----------|
| **nf-master-slave-shell** | Two-pane layout (master + slave); responsive (stack or drawer); single click = open detail pane (no selection mode for open); `selectedId` / `selectedIdChange` for URL sync. | `web/app/platform/lib/anatomy/components/organisms/master-slave-shell/` |
| **nf-wizard-shell** | Dedicated stepper (not nf-tabs): step labels, current step, progression + validation + lock; projected step body; action bar Back / Next / Submit. Inputs: currentStep, steps[], valid per step; outputs: stepChange, next, back, submit. | `web/app/platform/lib/anatomy/components/organisms/wizard-shell/` |
| **nf-settings-shell** / **nf-settings-section** | **V1: none.** Settings = composition (see above). Add nf-settings-section only when 2–3 real pages need the same section block. | — |

Recommendation: **nf-master-slave-shell** and **nf-wizard-shell** only. **Settings V1** = nf-page-shell + nf-page-header + nf-tabs + existing section/field styling + nf-button-list. No new Settings component until repetition appears.

### Reused components (no new ones)

- Master–Slave: **nf-entity-listing** (or listing-controls + data-table + pagination), **nf-entity-detail**, **nf-page-header**, **nf-page-shell**, **nf-drawer** (for responsive slave).
- Wizard: **nf-page-shell**, **nf-page-header**, **nf-entity-detail** (sections/fields) or shared step body component, **nf-button-list**.
- Settings: **nf-page-shell**, **nf-page-header**, **nf-tabs**, **nf-button-list**, form controls and section styling from entity-detail (no new Settings component in V1).

### File locations

| Item | Location |
|------|----------|
| **UxPatternType** | `web/app/platform/lib/anatomy/types/index.ts` (or types/ux-pattern.ts) |
| Master–Slave shell | `web/app/platform/lib/anatomy/components/organisms/master-slave-shell/` (component + scss + index) |
| Wizard shell | `web/app/platform/lib/anatomy/components/organisms/wizard-shell/` (component + scss + index) |
| Settings V1 | No new files; composition in feature pages. |
| Demo: Products Master–Slave | To be hosted in a dedicated demo feature/application (not in platform baseline). |
| Demo: Product create wizard | To be hosted in a dedicated demo feature/application. |
| Demo: Settings | To be hosted in a dedicated demo feature/application using composition. |

### Integration checklist

**Phase 1 — Master–Slave**
- [ ] Add **UxPatternType** (`'listing' | 'detail' | 'masterSlave' | 'wizard' | 'settings'`) in anatomy types.
- [ ] Add **nf-master-slave-shell**: layout (CSS grid or flex), master/slave slots, **single click = open pane** (no selection mode for open), `selectedId` / `selectedIdChange`, responsive (drawer for slave on narrow), export from organisms index.
- [ ] Implement **Products demo**: route with optional `:id`, page composes shell + entity-listing (state preserved) + entity-detail; sync URL ↔ selectedId; list facade keeps filters/sort/page.

**Phase 2 — Wizard**
- [ ] Add **nf-wizard-shell**: dedicated stepper (not tabs), step labels + current + optional valid state, slot for step content, action bar (Back / Next / Submit), export from organisms.
- [ ] Implement Product create wizard demo (e.g. Basics → Pricing → Review).

**Phase 3 — Settings**
- [ ] Document: “Settings V1 = nf-page-shell + nf-page-header + nf-tabs + section styling + nf-button-list.”
- [ ] Add Sandbox settings page (composition only); nf-* wrappers only; Save + Restore defaults.

**Global**
- [ ] Docs: Update anatomy README and COMPONENTS.md with the three patterns, UxPatternType, and when to use; link to this spec.
- [ ] Lint: No direct Material/PrimeNG in new feature pages (only in nf-* wrappers).

---

**Next step:** Implémenter **uniquement** Master–Slave (nf-master-slave-shell + demo Products), puis Wizard, puis Settings (composition).
