# Action Bar Architecture — Detail Pages

## Goal

Unify all actions (CRUD + status machine + custom) into a single config-driven toolbar.
Remove `nfActionCenter` from page templates. Everything declared in config, nothing hardcoded per page.

---

## Visual Layout

```
[← Retour]  [utility actions...]        [status badge]  [Annuler]  [Enregistrer]  [Valider]
     ↑              ↑                         ↑          stroked     stroked        flat
  always        left[]                   statusMachine   danger      default       primary
  framework     config                    (auto)         ←────────── right zone ──────────→
```

### Semantic distinction — why Save is NOT grouped with status transitions

- **Enregistrer** = "je n'ai pas fini, je sauvegarde mon brouillon" — le document reste en `BROUILLON`
- **Valider** = "j'ai fini, le document avance dans son cycle de vie" — transition d'état irréversible
- **Annuler** = clôture définitive du document

Grouper visuellement Save avec les transitions workflow induit en erreur. La distinction est faite par le **style** (stroked vs flat), pas par la position physique. Ils restent dans la même zone droite mais la hiérarchie est claire.

### UX Rules (non-negotiable)

1. **"Retour"** — always leftmost, rendered as a text link with arrow icon (`← Retour`), never a button
2. **Separator** — subtle vertical divider (`|`) between Retour and left[] utility actions
3. **Status badge** — leftmost of the right zone, pill style, no click, color from statusMachine config
4. **Right zone order** (left → right): `[status badge]` → `[Annuler — stroked danger]` → `[Enregistrer — stroked default]` → `[Valider — flat primary]`
5. **Enregistrer** — always labeled (never icon-only), `stroked default`, visible only when form is dirty AND item status is `BROUILLON` or mode is `create`
6. **Annuler (workflow)** — `stroked danger`, never `flat` — lower visual weight than Valider
7. **Valider** — `flat primary`, rightmost — highest visual weight, clearest CTA
8. **Disabled state** — button visible but greyed, `disabledTooltip` shown on hover
9. **Permissions** — action hidden entirely (not greyed) when permission is absent

---

## Type Extension — `@lib/anatomy/types`

Add to `DetailToolbarAction<T>` interface:

```typescript
interface DetailToolbarAction<T = unknown> {
  id: string;
  label: string;
  icon?: string;

  position: 'left' | 'right';
  variant?: 'flat' | 'stroked' | 'text' | 'icon';
  color?: 'primary' | 'accent' | 'warn' | 'danger' | 'default';
  order?: number;                // lower = leftmost within zone

  // Visibility
  showInModes?: Array<'create' | 'edit' | 'view'>;  // defaults to all modes
  visible?: (ctx: ActionContext<T>) => boolean;       // dynamic override

  // Permission — hides the action entirely if user lacks it
  permission?: string;

  // Disabled state — keeps button visible but inactive
  disabled?: boolean | ((ctx: ActionContext<T>) => boolean);
  disabledTooltip?: string | ((ctx: ActionContext<T>) => string);

  // Confirm dialog (optional)
  confirm?: {
    title: string;
    message: string | ((item: T) => string);
    confirmLabel?: string;
  };
}

interface ActionContext<T> {
  item: T | null;
  mode: 'create' | 'edit' | 'view';
  isDirty: boolean;
}
```

---

## Status Machine Integration

The `nf-entity-detail` component must automatically render `statusMachine.transitions` in the right zone **without any `nfActionCenter` slot in the page template**.

Rendering rules for status machine transitions:
- Only show transitions valid from `item[statusMachine.field]` current value
- `variant: 'danger'` transitions → `stroked + color: danger`
- `variant: 'primary'` transitions → `flat + color: primary`
- Status badge rendered immediately left of transition buttons
- Transition buttons fire `(transitionRequest)` output — page handles via `handleTransition()`

**Pages must remove `<ng-container nfActionCenter>` from their template.** The framework handles it.

---

## Updated `actions` Config Shape

```typescript
// In buildDetailConfig options:
actions?: {
  left?: DetailToolbarAction<T>[];    // utility actions (Scanner BL, Print...)
  right?: DetailToolbarAction<T>[];   // icon-only right actions (export, ...)
  hide?: Array<'save' | 'delete' | 'duplicate'>;  // suppress default CRUD actions
  override?: {
    save?: Partial<DetailToolbarAction<T>>;
    delete?: Partial<DetailToolbarAction<T>>;
  };
};
```

---

## Reception Config — Target Result

Update `config/detail/detail.config.ts`:

```typescript
export const RECEPTION_DETAIL_CONFIG = buildDetailConfig<InventoryTx>(
  {
    entityName: 'Réceptions',
    icon: 'download',
    fields: RECEPTION_DETAIL_FIELDS,
    routes: RECEPTION_DETAIL_ROUTES,
    statusMachine: RECEPTION_STATUS_MACHINE,
  },
  {
    sections: RECEPTION_DETAIL_SECTIONS,
    modes: { create: true, edit: true, view: true },
    actions: {
      hide: ['delete', 'duplicate'],
      left: [
        {
          id: 'scan_bl',
          label: 'Scanner BL',
          icon: 'document_scanner',
          position: 'left',
          variant: 'stroked',
          color: 'default',
          showInModes: ['create', 'edit'],
          permission: 'stock.reception.create',
          order: 1,
        },
      ],
      override: {
        save: {
          label: 'Enregistrer',
          visible: (ctx) =>
            ctx.mode === 'create' ||
            (ctx.item as InventoryTx | null)?.status === 'BROUILLON',
        },
      },
    },
    saveSuccessMessage: (item) =>
      `Réception ${(item as InventoryTx).txNumber} enregistrée`,
  },
);
```

---

## Reception Page Template — Target Result

Remove `<ng-container nfActionCenter>` entirely from `reception-detail.page.ts`.

The template becomes:

```html
<nf-page-shell scroll>
  <nf-page-header [config]="headerConfig"></nf-page-header>

  <nf-entity-detail
    #detail
    [config]="config"
    [mode]="mode()"
    [item]="item()"
    [lookups]="lookups()"
    [loading]="isLoading()"
    [saving]="isSaving()"
    (action)="onAction($event)"
    (transitionRequest)="handleTransition($event)">

    <!-- nfField overrides remain unchanged -->
    <ng-template nfField="destLocationId" ...> ... </ng-template>
    <ng-template nfField="chantierLocationId" ...> ... </ng-template>
    <ng-template nfField="phaseRef" ...> ... </ng-template>
    <ng-template nfField="lines" ...> ... </ng-template>

  </nf-entity-detail>
</nf-page-shell>
```

The `(transitionRequest)` output is wired directly on `nf-entity-detail` — the component forwards it from the internally rendered status machine.

---

## Files to Modify

| File | Change |
|---|---|
| `@lib/anatomy/types` | Extend `DetailToolbarAction` with `permission`, `disabled`, `disabledTooltip`, `showInModes`, `confirm` |
| `@lib/anatomy/components/organisms/entity-detail` | Render left/right toolbar zones; auto-render status machine in right zone; remove `nfActionCenter` slot dependency |
| `config/detail/detail.config.ts` | Migrate to new `actions.left[]` / `actions.override` shape |
| `reception-detail.page.ts` | Remove `nfActionCenter`, wire `(transitionRequest)` on `nf-entity-detail` |

---

## Constraints

- Do not break other pages that use `nf-entity-detail` — `nfActionCenter` slot must remain supported during transition (backwards compatible) but deprecated
- Do not change `reception.facade.ts` or mock service
- `handleTransition()` logic in `reception-detail.page.ts` stays unchanged
- TypeScript strict mode — no `any`
