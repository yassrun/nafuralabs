import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import {
  NATURES,
  STOCKABLE_NATURES,
  USAGE_LOTS,
  normalizeNature,
  type Nature,
  type UsageLot,
} from '@app/catalogue/models';
import { ItemCategoriesApiService } from '@app/catalogue/configuration/item-categories/services/item-category-api.service';
import { ItemsApiService } from '@app/catalogue/services/items-api.service';
import type { Item } from '@app/catalogue/items/models/item.model';
import { ItemPricesApiService } from '@app/catalogue/item-prices/services/item-price-api.service';

export interface ArticlePickerUniteOption {
  code: string;
  id?: string;
}

export type ArticlePickerContext = 'dpu' | 'stock' | 'lookup';

export interface ArticlePickerResult {
  item: Item;
  quantite: number;
  prixUnitaire: number;
  unite: string;
}

const NATURE_LABEL: Record<Nature, string> = {
  MATIERE: 'Matière',
  CONSOMMABLE: 'Consommable',
  CARBURANT: 'Carburant',
  OUTILLAGE: 'Outillage',
  MATERIEL: 'Matériel',
  LOCATION: 'Location',
  MAIN_DOEUVRE: 'Main-d’œuvre',
  SOUS_TRAITANCE: 'Sous-traitance',
  SERVICE: 'Service',
};

const LOT_LABEL: Record<UsageLot, string> = {
  GROS_OEUVRE: 'Gros œuvre',
  VRD: 'VRD',
  FINITIONS: 'Finitions',
  SECOND_OEUVRE: 'Second œuvre',
  TECHNIQUE: 'Lots techniques',
};

@Component({
  selector: 'app-article-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, NfSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ap" tabindex="-1" (keydown)="onKeydown($event)">
      <label class="ap__field">
        <span>Rechercher un article</span>
        <input
          name="query"
          type="search"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange()"
          placeholder="Code ou désignation — 2 caractères min., ou poser un filtre"
          autocomplete="off"
          data-testid="article-picker-q"
        />
      </label>

      <div class="ap__chips" role="group" aria-label="Nature">
        @for (n of natures(); track n) {
          <button
            type="button"
            class="ap__chip"
            [attr.data-testid]="'article-picker-nature-' + n"
            [class.ap__chip--on]="nature() === n"
            (click)="toggleNature(n)"
          >
            {{ natureLabel(n) }}
          </button>
        }
      </div>

      <div class="ap__filters">
        <label class="ap__field ap__field--grow">
          <span>Famille</span>
          <nf-select
            [options]="familleOptions()"
            [ngModel]="familleId() ?? ''"
            (ngModelChange)="onFamille($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
        <label class="ap__field">
          <span>Lot d’usage</span>
          <nf-select
            [options]="lotOptions"
            [ngModel]="usageLot() ?? ''"
            (ngModelChange)="onLot($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
      </div>

      @if (erreur()) {
        <div class="ap__error" role="alert">
          <p>{{ erreur() }}</p>
          <nf-button variant="primary" size="sm" (clicked)="relancer()">Relancer</nf-button>
        </div>
      }

      <ul
        class="ap__hits"
        role="listbox"
        aria-label="Articles catalogue"
        (scroll)="onHitsScroll($event)"
      >
        @if (!armed() && !loading()) {
          <li class="ap__hint">Saisir ou filtrer pour chercher. Extraire reste dans le panneau décompo, pas ici.</li>
        } @else if (loading() && items().length === 0) {
          <li class="ap__hint">Recherche…</li>
        } @else if (armed() && !items().length && !erreur()) {
          <li class="ap__hint">Aucun article ne correspond. Affiner la saisie ou les filtres.</li>
        } @else {
          <li class="ap__cols" aria-hidden="true">
            <span>Code</span><span>Désignation</span><span>Unité</span><span>PU</span>
          </li>
          @for (item of items(); track item.id; let i = $index) {
            <li>
              <button
                type="button"
                class="ap__hit"
                data-testid="article-picker-hit"
                role="option"
                [attr.aria-selected]="focusedIndex() === i"
                [class.ap__hit--on]="focusedIndex() === i"
                (click)="selectAt(i)"
                (dblclick)="selectAt(i); confirm()"
              >
                <span class="ap__hit-code">{{ item.code || '—' }}</span>
                <span class="ap__hit-name">{{ item.name }}</span>
                <span class="ap__hit-uom">{{ uniteOf(item) }}</span>
                <span class="ap__hit-pu">{{ puOf(item) | number: '1.2-2' }}</span>
              </button>
            </li>
          }
          @if (loadingMore()) {
            <li class="ap__hint">Suite…</li>
          }
        }
      </ul>

      @if (context() === 'dpu' && selected()) {
        <div class="ap__dpu" data-testid="article-picker-dpu-pied">
          <label class="ap__field">
            <span>Quantité *</span>
            <input
              name="quantite"
              type="number"
              min="0"
              step="any"
              [(ngModel)]="quantite"
              data-testid="article-picker-qty"
            />
          </label>
          <label class="ap__field">
            <span>PU tarif ({{ unite() }})</span>
            <input
              name="prixUnitaire"
              type="number"
              min="0"
              step="any"
              [ngModel]="prixUnitaire()"
              (ngModelChange)="onPrixChange($event)"
              data-testid="article-picker-pu"
            />
          </label>
        </div>
      }

      <footer class="ap__footer">
        <nf-button variant="secondary" (clicked)="cancelled.emit()">Annuler</nf-button>
        @if (context() === 'dpu') {
          <nf-button
            variant="primary"
            data-testid="article-picker-add-dpu"
            [disabled]="!canAddDpu()"
            (clicked)="confirm()"
          >
            Ajouter au poste
          </nf-button>
        } @else {
          <nf-button
            variant="primary"
            data-testid="article-picker-choose"
            [disabled]="!selected()"
            (clicked)="confirm()"
          >
            Choisir
          </nf-button>
        }
      </footer>
    </div>
  `,
  styles: `
    .ap { display: grid; gap: 0.85rem; }
    .ap__field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.875rem; }
    .ap__field--grow { flex: 1; min-width: 12rem; }
    .ap__field input {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
    }
    .ap__chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .ap__chip {
      border: 1px solid var(--nf-color-border, #d1d5db);
      background: transparent;
      border-radius: 999px;
      padding: 0.25rem 0.65rem;
      font: inherit;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .ap__chip--on {
      background: color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 16%, transparent);
      border-color: var(--nf-color-primary-600, #0b6e7a);
    }
    .ap__filters { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .ap__hits {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 16rem;
      overflow: auto;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
    }
    .ap__hint {
      padding: 0.85rem 1rem;
      color: var(--nf-color-text-secondary, #6b7280);
      font-size: 0.875rem;
    }
    .ap__cols {
      display: grid;
      grid-template-columns: 7rem 1fr 3rem 5rem;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: var(--nf-color-text-secondary, #6b7280);
      border-bottom: 1px solid var(--nf-color-border, #e5e7eb);
    }
    .ap__cols span:nth-child(3),
    .ap__cols span:nth-child(4) { text-align: right; }
    .ap__hit {
      display: grid;
      grid-template-columns: 7rem 1fr 3rem 5rem;
      gap: 0.5rem;
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 0;
      border-bottom: 1px solid var(--nf-color-border, #e5e7eb);
      background: transparent;
      text-align: left;
      font: inherit;
      cursor: pointer;
    }
    .ap__hit-code { font-weight: 600; font-size: 0.8rem; }
    .ap__hit-name { font-size: 0.875rem; }
    .ap__hit-uom, .ap__hit-pu { font-size: 0.75rem; color: var(--nf-color-text-secondary, #6b7280); text-align: right; }
    .ap__hit--on { background: color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 10%, transparent); }
    .ap__dpu { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: end; }
    .ap__error { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; color: var(--nf-color-danger, #b91c1c); font-size: 0.875rem; }
    .ap__error p { margin: 0; }
    .ap__footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `,
})
export class ArticlePickerComponent implements OnInit, OnDestroy {
  private readonly itemsApi = inject(ItemsApiService);
  private readonly categoriesApi = inject(ItemCategoriesApiService);
  private readonly pricesApi = inject(ItemPricesApiService);

  readonly context = input<ArticlePickerContext>('lookup');
  readonly presetNature = input<Nature | null>(null);
  readonly uniteOptions = input<ArticlePickerUniteOption[]>([]);

  readonly picked = output<ArticlePickerResult>();
  readonly cancelled = output<void>();

  readonly items = signal<Item[]>([]);
  readonly selected = signal<Item | null>(null);
  readonly focusedIndex = signal(-1);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly nature = signal<Nature | null>(null);
  readonly familleId = signal<string | null>(null);
  readonly usageLot = signal<UsageLot | null>(null);
  readonly prixUnitaire = signal(0);
  readonly unite = signal('U');
  readonly armed = signal(false);
  readonly familleOptions = signal<NfSelectOption[]>([{ value: '', label: 'Toutes' }]);
  readonly total = signal(0);

  query = '';
  quantite = '1';
  readonly lotOptions: NfSelectOption[] = [
    { value: '', label: 'Tous' },
    ...USAGE_LOTS.map((l) => ({ value: l, label: LOT_LABEL[l] })),
  ];

  readonly natures = computed(() =>
    this.context() === 'stock' ? [...STOCKABLE_NATURES] : [...NATURES],
  );

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private page = 0;
  private last = true;
  private uomById = new Map<string, string>();
  /** Chip / famille / lot posés par l'humain — le preset AC-12 ne déclenche pas. */
  private filtersTouched = false;

  ngOnInit(): void {
    const preset = this.presetNature();
    if (preset && this.natures().includes(preset)) {
      this.nature.set(preset);
    }
    for (const u of this.uniteOptions()) {
      if (u.id && u.code) this.uomById.set(u.id, u.code);
    }
    void this.loadFamilles();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  natureLabel(n: Nature): string {
    return NATURE_LABEL[n] ?? n;
  }

  onQueryChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.search({ reset: true }), 300);
  }

  toggleNature(n: Nature): void {
    this.filtersTouched = true;
    this.nature.set(this.nature() === n ? null : n);
    void this.search({ reset: true });
  }

  onFamille(value: string): void {
    const next = value || null;
    if (next === this.familleId()) return;
    this.filtersTouched = true;
    this.familleId.set(next);
    void this.search({ reset: true });
  }

  onLot(value: string): void {
    const next = (value || null) as UsageLot | null;
    if (next === this.usageLot()) return;
    this.filtersTouched = true;
    this.usageLot.set(next);
    void this.search({ reset: true });
  }

  relancer(): void {
    void this.search({ reset: true });
  }

  selectAt(index: number): void {
    const item = this.items()[index];
    if (!item) return;
    this.focusedIndex.set(index);
    this.selected.set(item);
    this.unite.set(this.uniteOf(item));
    this.prixUnitaire.set(this.puOf(item));
    void this.enrichSelection(item);
  }

  onPrixChange(raw: string | number): void {
    const n = Number.parseFloat(String(raw).replace(',', '.'));
    this.prixUnitaire.set(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  canAddDpu(): boolean {
    const q = Number.parseFloat(String(this.quantite).replace(',', '.'));
    return !!this.selected()?.id && Number.isFinite(q) && q > 0;
  }

  confirm(): void {
    const item = this.selected();
    if (!item) return;
    if (this.context() === 'dpu' && !this.canAddDpu()) return;
    const q = Number.parseFloat(String(this.quantite).replace(',', '.'));
    this.picked.emit({
      item,
      quantite: Number.isFinite(q) && q > 0 ? q : 1,
      prixUnitaire: this.prixUnitaire(),
      unite: this.unite(),
    });
  }

  onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.moveFocus(1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.moveFocus(-1);
    } else if (ev.key === 'Enter') {
      if (this.focusedIndex() >= 0) {
        ev.preventDefault();
        this.selectAt(this.focusedIndex());
        this.confirm();
      }
    }
  }

  onHitsScroll(ev: Event): void {
    const el = ev.target as HTMLElement;
    if (this.last || this.loadingMore() || this.loading()) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) {
      void this.search({ reset: false });
    }
  }

  uniteOf(item: Item): string {
    const id = item.unitOfMeasureId;
    if (id && this.uomById.has(id)) return this.uomById.get(id)!;
    const match = this.uniteOptions().find((u) => u.id && u.id === id);
    return match?.code || this.uniteOptions()[0]?.code || 'U';
  }

  puOf(item: Item): number {
    const pu = Number(item.prixUnitaire);
    if (Number.isFinite(pu) && pu > 0) return pu;
    const pmp = Number(item.pmp);
    if (Number.isFinite(pmp) && pmp > 0) return pmp;
    return 0;
  }

  private canSearch(): boolean {
    const qOk = this.query.trim().length >= 2;
    const filterOk =
      this.filtersTouched && (!!this.nature() || !!this.familleId() || !!this.usageLot());
    return qOk || filterOk;
  }

  private moveFocus(delta: number): void {
    const n = this.items().length;
    if (!n) return;
    const next = Math.min(n - 1, Math.max(0, this.focusedIndex() + delta));
    this.focusedIndex.set(next);
    this.selectAt(next);
  }

  private async search(opts: { reset: boolean }): Promise<void> {
    if (!this.canSearch()) {
      this.armed.set(false);
      this.items.set([]);
      this.selected.set(null);
      this.focusedIndex.set(-1);
      this.erreur.set(undefined);
      return;
    }
    this.armed.set(true);
    if (opts.reset) {
      this.page = 0;
      this.last = true;
      this.loading.set(true);
    } else {
      if (this.last) return;
      this.page += 1;
      this.loadingMore.set(true);
    }
    this.erreur.set(undefined);
    try {
      const page = await this.itemsApi.searchPicker({
        q: this.query.trim() || undefined,
        nature: this.nature() ?? undefined,
        familleId: this.familleId() ?? undefined,
        usageLot: this.usageLot() ?? undefined,
        page: this.page,
        size: 20,
      });
      const next = opts.reset ? page.items : [...this.items(), ...page.items];
      this.items.set(next);
      this.total.set(page.total);
      this.last = page.last || next.length >= page.total;
      if (opts.reset) {
        this.selected.set(null);
        this.focusedIndex.set(next.length ? 0 : -1);
        if (next[0]) this.selectAt(0);
      }
    } catch {
      this.erreur.set('Le catalogue n’a pas répondu. Le dialog reste ouvert.');
      if (opts.reset) this.items.set([]);
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  private async loadFamilles(): Promise<void> {
    try {
      const page = await this.categoriesApi.getAll({ page: 0, pageSize: 200 });
      const rows = page.items ?? [];
      const byId = new Map(rows.map((r) => [r.id, r]));
      const opts: NfSelectOption[] = [{ value: '', label: 'Toutes' }];
      for (const row of rows) {
        if (row.isActive === false) continue;
        const parent = row.parentId ? byId.get(row.parentId) : undefined;
        const label = parent ? `${parent.name} / ${row.name}` : row.name;
        opts.push({ value: row.id, label });
      }
      this.familleOptions.set(opts);
    } catch {
      /* filtre famille optionnel */
    }
  }

  private async enrichSelection(item: Item): Promise<void> {
    try {
      const full = await this.itemsApi.getById(item.id);
      if (this.selected()?.id !== item.id) return;
      this.selected.set(full);
      this.unite.set(this.uniteOf(full));
      this.prixUnitaire.set(this.puOf(full));
      if (this.context() === 'dpu') {
        const tarif = await this.lookupTarif(full.id);
        if (this.selected()?.id !== item.id) return;
        if (tarif != null) this.prixUnitaire.set(tarif);
      }
    } catch {
      /* keep row values */
    }
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

export function dpuTypeToNature(type: string | null | undefined): Nature | null {
  if (!type) return null;
  const n = normalizeNature(type);
  if (n === 'MATIERE' || n === 'MAIN_DOEUVRE' || n === 'MATERIEL' || n === 'SOUS_TRAITANCE') {
    return n;
  }
  return null;
}
