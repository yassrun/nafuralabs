import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import { ItemsApiService } from '@app/pages/inventory/catalogue/items/services/item-api.service';
import { ItemPricesApiService } from '@app/pages/inventory/catalogue/item-prices/services/item-price-api.service';

export interface CreateMissingItemDialogData {
  designation: string;
  type: string;
  unite: string;
  rendement: number;
  uniteOptions: { code: string; id?: string }[];
}

export interface CreateMissingItemDialogResult {
  itemId: string;
  code?: string;
  name: string;
  type: DpuComposantType;
  unite: string;
  prixUnitaire: number;
  sourcePrix: string;
}

const TYPES: { value: DpuComposantType; label: string }[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'MAIN_DOEUVRE', label: 'Main-d’œuvre' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
];

@Component({
  selector: 'app-create-missing-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Créer dans le catalogue</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <label class="field">
        <span>Désignation *</span>
        <input name="name" type="text" [(ngModel)]="name" required />
      </label>

      <div class="grid-2">
        <label class="field">
          <span>Type *</span>
          <select name="type" [(ngModel)]="type">
            @for (t of types; track t.value) {
              <option [ngValue]="t.value">{{ t.label }}</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Unité *</span>
          <select name="unite" [(ngModel)]="unite">
            @for (u of data.uniteOptions; track u.code) {
              <option [ngValue]="u.code">{{ u.code }}</option>
            }
          </select>
        </label>
      </div>

      <label class="field">
        <span>Prix unitaire (tarif) *</span>
        <input name="prix" type="number" min="0" step="any" [(ngModel)]="prixUnitaire" required />
      </label>

      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }

      <footer>
        <nf-button variant="secondary" [disabled]="saving()" (clicked)="close()">Annuler</nf-button>
        <nf-button
          variant="primary"
          [loading]="saving()"
          [disabled]="!canSave() || saving()"
          (clicked)="save()"
        >
          Créer et tarifer
        </nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(28rem, 92vw);
      background: var(--nf-color-surface, #fff);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }
    header h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.875rem;
    }
    .field input,
    .field select {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .error {
      margin: 0;
      color: var(--nf-color-danger, #b91c1c);
      font-size: 0.875rem;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
})
export class CreateMissingItemDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CreateMissingItemDialogComponent, CreateMissingItemDialogResult | null>,
  );
  readonly data = inject<CreateMissingItemDialogData>(MAT_DIALOG_DATA);
  private readonly itemsApi = inject(ItemsApiService);
  private readonly pricesApi = inject(ItemPricesApiService);

  readonly types = TYPES;
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  name = this.data.designation;
  type: DpuComposantType = (TYPES.find((t) => t.value === this.data.type)?.value ??
    'MATIERE') as DpuComposantType;
  unite =
    this.data.unite ||
    this.data.uniteOptions[0]?.code ||
    'U';
  prixUnitaire = '0';

  canSave(): boolean {
    const p = Number.parseFloat(String(this.prixUnitaire).replace(',', '.'));
    return !!this.name.trim() && !!this.unite.trim() && Number.isFinite(p) && p >= 0;
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    const prix = Number.parseFloat(String(this.prixUnitaire).replace(',', '.'));
    const uom = this.data.uniteOptions.find((u) => u.code === this.unite);
    try {
      const item = await this.itemsApi.create({
        name: this.name.trim(),
        articleType: this.type,
        isActive: true,
        unitOfMeasureId: uom?.id,
        code: undefined,
      });
      const today = new Date().toISOString().slice(0, 10);
      await this.pricesApi.create({
        itemId: item.id,
        priceType: 'ACHAT_STANDARD',
        unitPrice: prix,
        effectiveFrom: today,
      } as Parameters<ItemPricesApiService['create']>[0]);
      this.dialogRef.close({
        itemId: item.id,
        code: item.code,
        name: item.name,
        type: this.type,
        unite: this.unite,
        prixUnitaire: prix,
        sourcePrix: 'TARIF',
      });
    } catch (e) {
      const err = e as { error?: { message?: string; code?: string } };
      this.erreur.set(
        err?.error?.message ?? err?.error?.code ?? 'Impossible de créer l’article catalogue.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
