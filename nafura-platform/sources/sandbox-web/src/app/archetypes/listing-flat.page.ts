import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ScreenComponent } from '@platform/lib/anatomy/components/organisms/page-screen';
import type { PageHeaderConfig } from '@platform/lib/anatomy/components/molecules/page-header';
import {
  ListingFlatComponent,
  type ListingFlatConfig,
  type ListingFlatSelection,
  type ListingSelectionAction,
} from '@platform/lib/anatomy/components/organisms/listing-flat';
import type { ListingActionItem } from '@platform/lib/anatomy/components/molecules/listing-actions';
import type { ColumnConfig, FilterFieldConfig } from '@platform/lib/anatomy/types';

import { ProductMockFacade, type Product } from '../mocks/product-mock.facade';

@Component({
  selector: 'sb-listing-flat',
  standalone: true,
  imports: [FormsModule, ScreenComponent, ListingFlatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-screen [header]="headerConfig">
      <div class="lab">
        <div class="lab__stage">
          <nf-listing-flat
            [config]="listingConfig()"
            [items]="items()"
            (rowDblClick)="open($event)"
            (actionClick)="onListingAction($event)"
            (selectionChange)="selection.set($event)"
          />
        </div>
        <aside class="lab__opts">
          <h2>Configuration</h2>
          <p class="lab__hint">Dupliquer = 1 ligne · Supprimer = 1+ lignes. Simple = clic ligne · multiple = cases.</p>

          <h3>Vue</h3>
          <label><input type="checkbox" [ngModel]="optSearch()" (ngModelChange)="optSearch.set($event)" /> Search</label>
          <label><input type="checkbox" [ngModel]="optFilters()" (ngModelChange)="optFilters.set($event)" /> Filtres</label>
          @if (optFilters()) {
            <div class="lab__sub">
              <span class="lab__sub-title">Champs filtrés</span>
              <label><input type="checkbox" [ngModel]="optFilterStatus()" (ngModelChange)="optFilterStatus.set($event)" /> Status (select)</label>
              <label><input type="checkbox" [ngModel]="optFilterCode()" (ngModelChange)="optFilterCode.set($event)" /> Code (texte)</label>
              <label><input type="checkbox" [ngModel]="optFilterName()" (ngModelChange)="optFilterName.set($event)" /> Name (texte)</label>
              <label><input type="checkbox" [ngModel]="optFilterActive()" (ngModelChange)="optFilterActive.set($event)" /> Filtre actif (Status = Active)</label>
            </div>
          }
          <label><input type="checkbox" [ngModel]="optColumns()" (ngModelChange)="optColumns.set($event)" /> Visibilité colonnes</label>
          <label><input type="checkbox" [ngModel]="optPagination()" (ngModelChange)="optPagination.set($event)" /> Pagination</label>
          <label>
            Sélection
            <select [ngModel]="optSelection()" (ngModelChange)="optSelection.set($event)">
              <option value="none">Aucune</option>
              <option value="single">Simple</option>
              <option value="multiple">Multiple</option>
            </select>
          </label>
          <label><input type="checkbox" [ngModel]="optSelectionToggle()" (ngModelChange)="optSelectionToggle.set($event)" /> Bouton multi-sélection (toolbar)</label>
          <label>
            Page size
            <select [ngModel]="optPageSize()" (ngModelChange)="optPageSize.set($event)">
              <option [ngValue]="10">10</option>
              <option [ngValue]="20">20</option>
              <option [ngValue]="50">50</option>
            </select>
          </label>

          <h3>Action bar</h3>
          <label><input type="checkbox" [ngModel]="optActNew()" (ngModelChange)="optActNew.set($event)" /> New</label>
          <label><input type="checkbox" [ngModel]="optActExport()" (ngModelChange)="optActExport.set($event)" /> Export</label>
          <label><input type="checkbox" [ngModel]="optActDuplicate()" (ngModelChange)="optActDuplicate.set($event)" /> Dupliquer (sélection)</label>
          <label><input type="checkbox" [ngModel]="optActDelete()" (ngModelChange)="optActDelete.set($event)" /> Supprimer (sélection)</label>
        </aside>
      </div>
    </nf-screen>
  `,
  styles: [
    `
      .lab {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 240px;
        gap: 16px;
        min-height: 0;
        height: 100%;
      }
      .lab__stage {
        min-width: 0;
        min-height: 0;
      }
      .lab__opts {
        border-left: 1px solid var(--nf-color-border, #e5e7eb);
        padding-left: 14px;
        font-size: 13px;
      }
      .lab__opts h2 {
        margin: 0 0 6px;
        font-size: 0.75rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
      }
      .lab__hint {
        margin: 0 0 12px;
        color: var(--nf-text-muted, #6b7280);
        font-size: 12px;
      }
      .lab__opts label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
      }
      .lab__opts h3 {
        margin: 14px 0 6px;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
      }
      .lab__sub {
        margin: 0 0 8px;
        padding-left: 14px;
        border-left: 2px solid var(--nf-color-border, #e5e7eb);
      }
      .lab__sub-title {
        display: block;
        margin: 0 0 4px;
        font-size: 11px;
        color: var(--nf-text-muted, #6b7280);
      }
      .lab__opts select {
        margin-left: auto;
      }
      @media (max-width: 800px) {
        .lab {
          grid-template-columns: 1fr;
        }
        .lab__opts {
          border-left: 0;
          padding-left: 0;
          border-top: 1px solid var(--nf-color-border, #e5e7eb);
          padding-top: 12px;
        }
      }
    `,
  ],
})
export class ListingFlatPage {
  private readonly facade = inject(ProductMockFacade);
  private readonly router = inject(Router);

  readonly optSearch = signal(true);
  readonly optFilters = signal(true);
  readonly optFilterStatus = signal(true);
  readonly optFilterCode = signal(true);
  readonly optFilterName = signal(false);
  readonly optFilterActive = signal(false);
  readonly optColumns = signal(true);
  readonly optPagination = signal(true);
  readonly optSelection = signal<ListingFlatSelection>('none');
  readonly optSelectionToggle = signal(false);
  readonly optActNew = signal(true);
  readonly optActExport = signal(true);
  readonly optActDuplicate = signal(true);
  readonly optActDelete = signal(true);
  readonly optPageSize = signal(10);

  private readonly statusFilterField: FilterFieldConfig = {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Draft', value: 'Draft' },
    ],
  };

  readonly activeFilterFields = computed((): FilterFieldConfig[] => {
    const fields: FilterFieldConfig[] = [];
    if (this.optFilterStatus()) fields.push(this.statusFilterField);
    if (this.optFilterCode()) fields.push({ key: 'code', label: 'Code', type: 'text' });
    if (this.optFilterName()) fields.push({ key: 'name', label: 'Name', type: 'text' });
    return fields;
  });

  readonly enabledActions = computed((): ListingActionItem[] => {
    const out: ListingActionItem[] = [];
    if (this.optActExport()) out.push({ id: 'export', label: 'Export', variant: 'secondary', icon: 'download' });
    if (this.optActNew()) out.push({ id: 'new', label: 'New', variant: 'primary', icon: 'plus' });
    return out;
  });

  readonly enabledSelectionActions = computed((): ListingSelectionAction[] => {
    const out: ListingSelectionAction[] = [];
    if (this.optActDuplicate()) out.push({ id: 'duplicate', label: 'Dupliquer', variant: 'secondary', icon: 'copy', scope: 'single' });
    if (this.optActDelete()) out.push({ id: 'delete', label: 'Supprimer', variant: 'danger', icon: 'trash-2', scope: 'single+bulk' });
    return out;
  });

  private readonly columns: ColumnConfig[] = [
    { key: 'code', field: 'code', label: 'Code', sortable: true },
    { key: 'name', field: 'name', label: 'Name', sortable: true },
    { key: 'status', field: 'status', label: 'Status', sortable: true },
    { key: 'description', field: 'description', label: 'Description', sortable: false },
  ];

  readonly selection = signal<Product[]>([]);

  readonly items = signal<Product[]>(this.buildItems());

  private buildItems(): Product[] {
    const base = this.facade.list();
    const extra: Product[] = [];
    for (let i = 6; i <= 36; i++) {
      extra.push({
        id: `prd-${String(i).padStart(2, '0')}`,
        code: `PRD-${String(i).padStart(2, '0')}`,
        name: `Article ${i}`,
        status: i % 3 === 0 ? 'Draft' : 'Active',
        description: i % 4 === 0 ? 'Demo row' : undefined,
      });
    }
    return [...base, ...extra];
  }

  readonly headerConfig: PageHeaderConfig = {
    title: 'Products',
    subtitle: 'nf-listing-flat · toolbar + action bar + table + pager',
  };

  readonly listingConfig = computed((): ListingFlatConfig => ({
    columns: this.columns,
    filters: this.activeFilterFields(),
    initialFilters: this.optFilterActive() ? { status: 'Active' } : undefined,
    pageSize: this.optPageSize(),
    emptyMessage: 'No products',
    actions: this.enabledActions(),
    selectionActions: this.enabledSelectionActions(),
    features: {
      search: this.optSearch(),
      filters: this.optFilters(),
      columnToggle: this.optColumns(),
      pagination: this.optPagination(),
      selection: this.optSelection(),
      selectionToggle: this.optSelectionToggle(),
    },
  }));

  onListingAction(id: string): void {
    if (id === 'new') {
      void this.router.navigate(['/archetypes', 'details', 'new']);
      return;
    }
    if (id === 'duplicate') {
      this.duplicateSelected();
      return;
    }
    if (id === 'delete') {
      this.deleteSelected();
    }
  }

  private duplicateSelected(): void {
    const selected = this.selection();
    if (selected.length === 0) return;
    const copies = selected.map((p, i) => ({
      ...p,
      id: `prd-copy-${Date.now()}-${i}`,
      code: `${p.code}-CP`,
      status: 'Draft' as const,
    }));
    this.items.update((rows) => [...rows, ...copies]);
    this.selection.set([]);
  }

  private deleteSelected(): void {
    const ids = new Set(this.selection().map((p) => p.id));
    if (ids.size === 0) return;
    this.items.update((rows) => rows.filter((r) => !ids.has(r.id)));
    this.selection.set([]);
  }

  open(item: Product): void {
    void this.router.navigate(['/archetypes', 'details', item.id]);
  }
}
