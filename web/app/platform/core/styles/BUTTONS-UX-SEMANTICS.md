# Buttons & Action Groups — UX Semantics

**Anatomy design system.** Defines UX meaning, behavioral rules, and usage for `nf-button` and `nf-button-list` (conceptually: **ActionGroup**). No visual redesign; no API renames. Angular Material remains the interaction and accessibility engine only.

**Implementation:**  
- **nf-button:** In dev mode, warns when variant is `danger` or `primary` and the button is icon-only (no visible label).  
- **nf-button-list:** When any action has `priority` set, primary actions stay visible; tertiary (and on narrow, secondary+tertiary) move to an explicit overflow menu. Same actions, same order; no duplication.

Implementation details: see [BUTTONS-CURRENT.md](./BUTTONS-CURRENT.md).

---

## 1. Button (nf-button) — UX Semantics

### 1.1 Button role & hierarchy

Variants express **intent**, not decoration. Use them consistently.

| Variant | UX meaning | Examples | Use sparingly? |
|--------|------------|----------|----------------|
| **Primary** | Main intent of the page or context | Add, Create, Save, Submit | **Yes** — usually **one** per context |
| **Secondary** | Important but non-core actions | Import, Export, Edit, Apply | No — can have several |
| **Tertiary / Ghost** | Low emphasis or contextual | Reset, Cancel, Filters, Clear | No |
| **Danger** | Destructive, irreversible | Delete, Remove, Archive (if destructive) | Yes — never default focus |

**Rules:**

- **Primary:** Represents the single most important action in that block. Do not use multiple primary buttons in the same toolbar or modal footer.
- **Danger:** Never icon-only. Never the default focus (do not auto-focus a danger button). Always pair with confirmation when irreversible.
- **Ghost:** Use for secondary navigation, filters, or “escape” actions (Cancel, Reset).

**Where each variant is allowed:**

| Context | Primary | Secondary | Tertiary / Ghost | Danger |
|---------|---------|-----------|------------------|--------|
| **Page header** | ✓ (one: e.g. Add) | ✓ | ✓ (e.g. Import) | ✗ |
| **Toolbar** | ✓ (one) or none | ✓ | ✓ | ✗ (prefer row/modal) |
| **Table row** | ✗ | ✓ | ✓ | ✓ (with confirm) |
| **Modal footer** | ✓ (one: e.g. Save) | ✓ (Cancel) | ✓ | ✓ (e.g. Delete) |

---

### 1.2 Button sizes — usage rules

| Size | Use for | Do not use for |
|------|---------|-----------------|
| **sm** | Table row actions, dense toolbars, icon-only buttons | Page-level primary CTAs |
| **md** | Page header actions, toolbar primary actions, modal primary actions | — (default) |
| **lg** | Rare: strong CTAs in empty states or onboarding | Listing toolbars; mixing with sm/md in same group |

**Rules:**

- **Default:** Prefer `md` for headers, toolbars, modals.
- **Discourage:** `lg` in listing toolbars; mixing sizes within the same action group (keep a single size per group).

---

### 1.3 Icon usage rules

| Pattern | When to use | Requirements |
|--------|-------------|--------------|
| **Icon + text** | Default for most actions | Icon clarifies meaning; label carries intent |
| **Icon-only** | Table row actions; compact toolbars on narrow screens only | **Must** have: tooltip + accessible label (e.g. `aria-label` or `ariaLabel` in config) |

**Never allow:**

- Icon-only **primary** page actions (e.g. “Add” must show “Add” or “Create”).
- Icon-only **destructive** actions (danger must show text, e.g. “Delete”).

---

### 1.4 Loading & disabled behavior (UX intent)

**Loading:**

- Replaces the **icon** (not the label), so the action stays recognizable.
- Prevents double submission (button is disabled while loading).
- Keeps button width stable (no label swap).

**Disabled:**

- Indicates the action is **unavailable** in the current state.
- Must remain **visible** — do not hide disabled actions; visibility explains what exists but is currently off.

---

## 2. Action Groups (nf-button-list) — Conceptual model

**nf-button-list** is the implementation. Conceptually treat it as an **ActionGroup**: a semantic container for actions with different priorities and responsive behavior. Component name in code stays `nf-button-list`.

### 2.1 Action priority (semantic, not visual)

Each action in an ActionGroup can carry a **priority** that expresses importance and drives visibility/collapse:

| Priority | Meaning | Default in list |
|----------|---------|------------------|
| **primary** | Must stay visible at all breakpoints; never auto-collapsed | — |
| **secondary** | Important; visible on desktop; may collapse on narrow | **Yes** (backward compatible) |
| **tertiary** | Lower emphasis; may live in overflow/menu by default | — |

**Rules:**

- Priority is **semantic** (importance), not style. It does not change variant/color.
- Default = **secondary** so existing configs stay valid.
- Priority drives what may collapse or move to overflow (see §2.2).

*Type support: `ButtonListItem` may include optional `priority?: 'primary' | 'secondary' | 'tertiary'` for future behavior; today it is documentation and data shape only.*

### 2.2 Visibility rules by priority

| Priority | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| **Primary** | Always visible | Always visible | Always visible (may become icon + tooltip) |
| **Secondary** | Visible | May collapse to menu or icons | Collapse into menu |
| **Tertiary** | May be in overflow/menu by default | In menu | In menu |

**Rules:**

- **Primary:** Never auto-collapsed; never hidden behind a single unlabeled “menu” by default.
- **Tertiary:** Suitable for “More”, “Advanced”, “Settings” — can live in overflow from the start.
- Layout (view) does **not** define importance; **importance** defines what may collapse.

---

## 3. Presentation vs semantics

| Concern | Layer | Purpose |
|---------|--------|---------|
| **view** (horizontal, icons, list, menu) | **Presentation** | How actions are laid out and shown |
| **responsive** (breakpoint, fallbackView) | **Presentation** | Fallback layout on narrow screens |
| **priority** (primary, secondary, tertiary) | **UX semantics** | Which actions stay visible vs collapse |

**Separation:**

- **Layout does not define importance.** You can show a horizontal row or a menu; that does not make an action “primary” or “secondary.”
- **Importance defines what may collapse or overflow.** Priority (when used) drives visibility and collapse behavior, not the other way around.

---

## 4. Responsive behavior rules

Behavior should be **predictable** (no surprises).

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Horizontal layout; all primary + secondary visible; tertiary may be in menu. |
| **Tablet** | Primary always visible; secondary may collapse to menu or icons; overflow is **one** explicit trigger (e.g. “More”). |
| **Mobile** | Primary may become icon + tooltip; secondary and tertiary collapse into menu. |

**Rules:**

- **Never** hide all actions behind one **unlabeled** trigger (e.g. single “…” with no “Actions” or “More” label).
- **Avoid:** Automatic collapse without explicit configuration; hiding critical actions without an affordance (user must know where to find them).

*Current implementation: consumer opts in via `responsive: { breakpointPx, fallbackView }`; no default breakpoint. Future priority-based logic should follow the rules above.*

---

## 5. Overflow philosophy

**Overflow** here means: an explicit “More” / menu trigger that reveals the **same** actions, in the **same** order.

- **Same actions** — no duplication between visible and menu.
- **Same order** — no reordering when moving to menu.
- **Explicit trigger** — one “More” / “Actions” control, clearly labeled.

**Do not implement (yet):** Partial overflow logic (e.g. “first N visible, rest in menu”) — only the UX rules and intent are defined. Today the component supports “all visible” or “all in menu” via `view` / `responsive`.

---

## 6. Usage guidelines

### When to use a single nf-button

- **Page header:** One primary + one secondary (e.g. Add, Import) — use two `nf-button` instances, not a list.
- **Modal footer:** Primary submit + Cancel (and optionally Danger) — each its own `nf-button`.
- **Inline action:** Single CTA in empty state, error state, or form — one `nf-button`.
- **Filter bar:** “Filters”, “Reset” — `nf-button` with ghost/tertiary.

### When to use nf-button-list

- **Toolbar:** Multiple actions (Export, View, More) that may collapse on narrow screens — use `nf-button-list` with `view="horizontal"` and `responsive` as needed.
- **Context menu / dropdown:** Same set of actions in menu form — `view="menu"` or `fallbackView: 'menu'`.
- **Compact icon row:** Dense toolbar on narrow — `view="icons"` or `fallbackView: 'icons'` with tooltips/aria.

### Header vs toolbar vs row actions

| Context | Pattern | Primary? | Size |
|---------|---------|----------|------|
| **Page header** | 1–2 discrete buttons (primary + secondary) | One primary | md |
| **Toolbar** | nf-button-list (horizontal → menu/icons on narrow) | One or none | md (sm if icons fallback) |
| **Table row** | 1–3 nf-button (sm), often icon-only with tooltip | No primary | sm |

### Anti-patterns to avoid

- **Too many primary actions** — e.g. several “primary” buttons in one toolbar or modal.
- **Icon-only everywhere** — e.g. primary “Add” or danger “Delete” as icon-only without text.
- **Auto-collapsing everything on mobile** — ensure at least primary (or the main CTA) stays visible or clearly afforded (e.g. icon + tooltip), and the overflow trigger is labeled (“Actions”, “More”).
- **Unlabeled overflow** — single “…” or icon-only trigger with no `aria-label` / tooltip.
- **Mixing sizes in one group** — keep sm with sm, md with md within the same ActionGroup.

---

## 7. Summary

- **nf-button:** Use variant and size to express intent and context (primary/secondary/tertiary/ghost/danger; sm/md/lg). Prefer icon + text; icon-only only where space forces it, with tooltip + aria. Loading replaces icon; disabled stays visible.
- **nf-button-list (ActionGroup):** Semantic container; optional **priority** per action (primary/secondary/tertiary) drives what stays visible vs collapses. **view** and **responsive** are presentation; **priority** is semantics.
- **Responsive:** Primary always visible or afforded; overflow is explicit, same actions and order; no unlabeled single trigger.
- **Overflow:** Explicit “More”/menu; same actions, same order; no partial overflow logic yet.

No visual redesign; no API renames; no new dependencies. Aligned with Tomic-style UX, data-heavy listings, and Angular Material as infrastructure only.
