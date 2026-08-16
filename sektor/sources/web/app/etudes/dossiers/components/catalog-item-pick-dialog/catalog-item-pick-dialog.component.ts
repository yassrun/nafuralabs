import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@platform/lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import { NATURE_TYPE_DPU, normalizeNature } from '@app/catalogue/models';
import { ItemsApiService } from '@app/catalogue/items/services/item-api.service';
import { ItemPricesApiService } from '@app/catalogue/item-prices/services/item-price-api.service';
import type { Item } from '@app/catalogue/items/models/item.model';
import type { UniteOption } from '../../utils/unite-options.util';

export interface CatalogItemPickDialogData {
  uniteOptions: UniteOption[];
}

export interface CatalogItemPickDialogResult {
  itemId: string;
  name: string;
  type: DpuComposantType;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  sourcePrix: 'TARIF';
}

@Component({
  selector: 'app-catalog-item-pick-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Depuis le catalogue</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <label class="field">
        <span>Rechercher un article</span>
        <input
          name="query"
          type="search"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange()"
          placeholder="Nom, code, SKU…"
          autocomplete="off"
        />
      </label>

      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }

      <ul class="results" role="listbox" aria-label="Articles catalogue">
        @if (loading()) {
          <li class="hint">Recherche…</li>
        } @else if (!items().length) {
          <li class="hint">Aucun article. Créez-le d’abord depuis une ligne (« Créer dans le catalogue »).</li>
        } @else {
          @for (item of items(); track item.id) {
            <li>
              <button
                type="button"
                class="hit"
                [class.hit--on]="selected()?.id === item.id"
                (click)="select(item)"
              >
                <strong>{{ item.name }}</strong>
                <span>{{ item.code || item.sku || '—' }} · {{ natureLabel(item) }}</span>
              </button>
            </li>
          }
        }
      </ul>

      @if (selected(); as item) {
        <div class="grid-2">
          <label class="field">
            <span>Quantité *</span>
            <input name="quantite" type="number" min="0" step="any" [(ngModel)]="quantite" />
          </label>
          <p class="prix" aria-live="polite">
            Tarif
            <strong>{{ prixUnitaire() | number: '1.2-2' }} MAD / {{ unite() }}</strong>
          </p>
        </div>
      }

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canAdd()" (clicked)="add()">
          Ajouter au poste
        </nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(36rem, 92vw);
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
    .field input {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
    }
    .results {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 16rem;
      overflow: auto;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
    }
    .hint {
      padding: 0.85rem 1rem;
      color: var(--nf-color-text-secondary, #6b7280);
      font-size: 0.875rem;
    }
    .hit {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 0;
      border-bottom: 1px solid var(--nf-color-border, #e5e7eb);
      background: transparent;
      text-align: left;
      font: inherit;
      cursor: pointer;
    }
    .hit span {
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary, #6b7280);
    }
    .hit--on {
      background: color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 10%, transparent);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      align-items: end;
    }
    .prix {
      margin: 0;
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
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
export class CatalogItemPickDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<CatalogItemPickDialogComponent, CatalogItemPickDialogResult | null>,
  );
  readonly data = inject<CatalogItemPickDialogData>(MAT_DIALOG_DATA);
  private readonly itemsApi = inject(ItemsApiService);
  private readonly pricesApi = inject(ItemPricesApiService);

  readonly items = signal<Item[]>([]);
  readonly selected = signal<Item | null>(null);
  readonly loading = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  query = '';
  quantite = '1';
  readonly prixUnitaire = signal(0);
  readonly unite = signal('U');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.search();
  }

  onQueryChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.search(), 280);
  }

  natureLabel(item: Item): string {
    return normalizeNature(item.nature);
  }

  async select(item: Item): Promise<void> {
    this.selected.set(item);
    this.unite.set(this.resolveUnite(item));
    this.prixUnitaire.set(this.priceFromItem(item));
    try {
      const full = await this.itemsApi.getById(item.id);
      this.selected.set(full);
      this.unite.set(this.resolveUnite(full));
      this.prixUnitaire.set(this.priceFromItem(full));
      const tarif = await this.lookupTarif(full.id);
      if (tarif != null) this.prixUnitaire.set(tarif);
    } catch {
      /* keep list row values */
    }
  }

  canAdd(): boolean {
    const q = Number.parseFloat(String(this.quantite).replace(',', '.'));
    return !!this.selected()?.id && Number.isFinite(q) && q > 0;
  }

  add(): void {
    const item = this.selected();
    if (!item || !this.canAdd()) return;
    const q = Number.parseFloat(String(this.quantite).replace(',', '.'));
    this.dialogRef.close({
      itemId: item.id,
      name: item.name,
      type: NATURE_TYPE_DPU[normalizeNature(item.nature)],
      unite: this.unite(),
      quantite: q,
      prixUnitaire: this.prixUnitaire(),
      sourcePrix: 'TARIF',
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private async search(): Promise<void> {
    this.loading.set(true);
    this.erreur.set(undefined);
    try {
      const page = await this.itemsApi.getAll({
        page: 1,
        pageSize: 40,
        search: this.query.trim() || undefined,
      });
      this.items.set(page.items ?? []);
    } catch {
      this.erreur.set('Impossible de charger le catalogue.');
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private resolveUnite(item: Item): string {
    const uomId = item.unitOfMeasureId;
    const match = this.data.uniteOptions.find((u) => u.id && u.id === uomId);
    return match?.code || this.data.uniteOptions[0]?.code || 'U';
  }

  private priceFromItem(item: Item): number {
    const pu = Number(item.prixUnitaire);
    if (Number.isFinite(pu) && pu > 0) return pu;
    const pmp = Number(item.pmp);
    if (Number.isFinite(pmp) && pmp > 0) return pmp;
    return 0;
  }

  private async lookupTarif(itemId: string): Promise<number | null> {
    try {
      const page = await this.pricesApi.getAll({ page: 1, pageSize: 20, itemId });
      const hit = (page.items ?? []).find((p) => p.itemId === itemId);
      const price = Number(hit?.unitPrice);
      return Number.isFinite(price) && price >= 0 ? price : null;
    } catch {
      return null;
    }
  }
}
