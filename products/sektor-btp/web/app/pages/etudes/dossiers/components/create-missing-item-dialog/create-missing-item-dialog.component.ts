import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import { NATURE_TYPE_DPU, normalizeNature, type Nature } from '@app/inventory/models';
import { ItemsApiService } from '@app/pages/inventory/catalogue/items/services/item-api.service';
import { ItemPricesApiService } from '@app/pages/inventory/catalogue/item-prices/services/item-price-api.service';
import type { ItemPriceCreate } from '@app/pages/inventory/catalogue/item-prices/models';
import { CurrenciesApiService } from '@app/pages/finance/configuration/currencies/services/currency-api.service';

export type CreateMissingItemMode = 'catalogue' | 'poste';

export interface CreateMissingItemDialogData {
  designation: string;
  type: string;
  unite: string;
  rendement: number;
  uniteOptions: { code: string; id?: string }[];
  /** catalogue = créer item + tarif ; poste = composant manuel uniquement. */
  mode?: CreateMissingItemMode;
}

export interface CreateMissingItemDialogResult {
  itemId?: string;
  code?: string;
  name: string;
  type: DpuComposantType;
  unite: string;
  prixUnitaire: number;
  sourcePrix: string;
}

const NATURE_OPTIONS: { value: Nature; label: string }[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'CONSOMMABLE', label: 'Consommable' },
  { value: 'CARBURANT', label: 'Carburant' },
  { value: 'OUTILLAGE', label: 'Outillage' },
  { value: 'MATERIEL', label: 'Matériel en propre' },
  { value: 'LOCATION', label: 'Location matériel' },
  { value: 'MAIN_DOEUVRE', label: "Main d'œuvre" },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
  { value: 'SERVICE', label: 'Service externe' },
];

@Component({
  selector: 'app-create-missing-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ isCatalogue() ? 'Créer dans le catalogue' : 'Ajouter au poste' }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <label class="field">
        <span>Désignation *</span>
        <input name="name" type="text" [(ngModel)]="name" required />
      </label>

      <div class="grid-2">
        <label class="field">
          <span>Nature *</span>
          <select name="type" [(ngModel)]="nature">
            @for (t of natures; track t.value) {
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
        <span>{{ isCatalogue() ? 'Prix unitaire (tarif)' : 'Prix unitaire' }} *</span>
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
          {{ isCatalogue() ? 'Créer et tarifer' : 'Ajouter au poste' }}
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
  private readonly currenciesApi = inject(CurrenciesApiService);

  readonly natures = NATURE_OPTIONS;
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  name = this.data.designation;
  nature: Nature = normalizeNature(this.data.type);
  unite =
    this.data.unite ||
    this.data.uniteOptions[0]?.code ||
    'U';
  prixUnitaire = '0';

  isCatalogue(): boolean {
    return (this.data.mode ?? 'catalogue') === 'catalogue';
  }

  private dpuType(): DpuComposantType {
    return NATURE_TYPE_DPU[this.nature];
  }

  canSave(): boolean {
    const p = Number.parseFloat(String(this.prixUnitaire).replace(',', '.'));
    return !!this.name.trim() && !!this.unite.trim() && Number.isFinite(p) && p >= 0;
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    const prix = Number.parseFloat(String(this.prixUnitaire).replace(',', '.'));

    if (!this.isCatalogue()) {
      this.dialogRef.close({
        name: this.name.trim(),
        type: this.dpuType(),
        unite: this.unite,
        prixUnitaire: prix,
        sourcePrix: 'MANUEL',
      });
      this.saving.set(false);
      return;
    }

    const uom = this.data.uniteOptions.find((u) => u.code === this.unite);
    try {
      const item = await this.itemsApi.create({
        name: this.name.trim(),
        nature: this.nature,
        isActive: true,
        unitOfMeasureId: uom?.id,
        code: undefined,
      });
      const today = new Date().toISOString().slice(0, 10);
      const currencyId = await this.resolveReferenceCurrencyId();
      const payload: ItemPriceCreate = {
        itemId: item.id,
        priceType: 'ACHAT_STANDARD',
        currencyId,
        unitPrice: prix,
        effectiveFrom: today,
      };
      await this.pricesApi.create(payload);
      this.dialogRef.close({
        itemId: item.id,
        code: item.code,
        name: item.name,
        type: this.dpuType(),
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

  private async resolveReferenceCurrencyId(): Promise<string> {
    const page = await this.currenciesApi.getAll({ page: 0, pageSize: 100 });
    const items = page.items as Array<{ id: string; code?: string; isReference?: boolean }>;
    const ref =
      items.find((c) => c.isReference === true)
      ?? items.find((c) => (c.code ?? '').toUpperCase() === 'MAD')
      ?? items[0];
    if (!ref?.id) {
      throw { error: { message: 'Aucune devise de référence trouvée.' } };
    }
    return ref.id;
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
