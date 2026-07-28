# UX Fixes — Réception Detail Page

## Context

File: `app/applications/erp/pages/inventory/mouvements/receptions/reception-detail.page.ts`
Config fields: `app/applications/erp/pages/inventory/mouvements/receptions/config/detail/fields.ts`
Config sections: `app/applications/erp/pages/inventory/mouvements/receptions/config/detail/sections.ts`

The reception form (`/inventory/mouvements/receptions/new` and `/:id`) needs 4 UX fixes before it can be considered production-ready.

---

## Fix 1 — Fournisseur field: full width

**Current:** `fournisseurId` field has `width: 'md'` (half line), placed after txDate.

**Change:** Set `width: 'full'` on `fournisseurId` in `fields.ts`. It is the most important field on the document and must occupy the full row.

---

## Fix 2 — Section layout: En-tête compact, lignes immédiatement visibles

**Current:** The header section takes the full screen height, the lines section is below the fold. The user must scroll to see the lines, which are the core of the document.

**Change in `sections.ts`:** Split into 3 sections:

```ts
[
  {
    id: 'identification',
    title: 'Identification',
    fields: ['txNumber', 'txDate', 'fournisseurId', 'reference'],
    columns: 2,
  },
  {
    id: 'destination',
    title: 'Destination',
    fields: ['destLocationId', 'chantierLocationId', 'phaseRef', 'notes'],
    columns: 2,
  },
  {
    id: 'lines',
    title: 'Lignes de réception',
    fields: ['lines'],
    columns: 1,
  },
]
```

Goal: identification + destination are compact 2-column sections. Lines appear immediately after without excessive scrolling.

---

## Fix 3 — Real-time total in the lines section title

**Current:** No total is shown anywhere on the form.

**Change:** In `reception-detail.page.ts`, add a `linesTotal` computed signal:

```ts
readonly linesTotal = computed(() => {
  const lines = (this.item()?.lines ?? []) as Array<{ totalPrice?: number; quantity: number; unitPrice?: number }>;
  const total = lines.reduce(
    (acc, l) => acc + (l.totalPrice ?? (l.unitPrice != null ? l.quantity * l.unitPrice : 0)),
    0,
  );
  return total.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});
```

Display it inside the `nfField="lines"` template, above the editor:

```html
<ng-template nfField="lines" let-control>
  <div class="rd__lines-header">
    <span class="rd__lines-total">Total : {{ linesTotal() }} MAD</span>
  </div>
  <app-reception-lines-editor [linesControl]="asLinesControl(control)" />
</ng-template>
```

Add CSS:
```css
.rd__lines-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.rd__lines-total {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--nf-text-primary, #111827);
}
```

**Note:** The total must update reactively. If `ReceptionLinesEditorComponent` emits changes via the `linesControl` FormControl value, listen to `valueChanges` to keep `item().lines` in sync — or compute directly from the control value if that is simpler. Use whichever approach keeps the signal reactive.

---

## Fix 4 — Prominent "Valider" action button

**Current:** The save action is a small icon in the top-right corner. The "Valider la réception" transition is inside `nf-status-machine` which is not visually prominent.

**Change:** Add a sticky action footer at the bottom of the page in `BROUILLON` mode, visible without scrolling:

```html
@if (mode() !== 'view') {
  <div class="rd__footer">
    <button mat-stroked-button type="button" (click)="onAction('cancel_draft')" [disabled]="isSaving()">
      Annuler
    </button>
    <button mat-flat-button color="primary" type="button" (click)="onAction('save')" [disabled]="isSaving()">
      @if (isSaving()) { Enregistrement… } @else { Enregistrer }
    </button>
  </div>
}
```

CSS:
```css
.rd__footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid var(--nf-border, #e5e7eb);
  padding: 12px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 10;
}
```

The `nf-status-machine` (Valider / Annuler la réception transitions) remains in `nfActionCenter` as-is for validated/draft status transitions. This footer is only for save/discard during editing.

---

## Fix 5 — Réf. BL : forcer type text (bug agent)

In `fields.ts`, ensure `reference` stays a plain text field:

```ts
{
  key: 'reference',
  label: 'Réf. BL / Bon de livraison',
  type: 'text',
  width: 'full',
}
```

It must not have any `lookupKey`, `lookupEndpoint`, or custom select behavior.
If the config-driven renderer still shows a dropdown affordance, override the field in `reception-detail.page.ts` with an explicit `<input matInput type="text">` template.

---

## Fix 6 — Scanner BL : repositionner hors de nfActionCenter

The `Scanner BL` action must not be placed in `nfActionCenter` and must not be implemented as a full-width informational banner.

Preferred placement (Option A): page-level secondary action next to the page title (`Nouvelle réception`).
This clearly expresses that scanning BL is an alternative entry path for the full document (supplier + reference + lines), not an action tied only to `Réf. BL`.

Fallback placement (Option B): first element inside Identification as a discreet full-width callout row.

---

## Constraints

- Do not touch any file outside the reception feature folder and its direct config files.
- Do not change `reception.facade.ts` or `inventory-mock.service.ts`.
- Do not introduce new dependencies.
- Keep all existing template overrides (`destLocationId`, `chantierLocationId`, `phaseRef`, `lines`) intact.
- TypeScript must compile with no errors (hint 6133 on `_inferModeEffect` is acceptable).
