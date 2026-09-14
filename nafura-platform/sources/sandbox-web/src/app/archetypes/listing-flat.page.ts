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
import {
  ActionMenuComponent,
  type ActionMenuNode,
} from '@platform/lib/anatomy/components/molecules/action-menu';
import type { ColumnConfig, FilterFieldConfig } from '@platform/lib/anatomy/types';

import { ProductMockFacade, type Product } from '../mocks/product-mock.facade';
import { SmartImportStubComponent } from '../components/smart-import-stub.component';

@Component({
  selector: 'sb-listing-flat',
  standalone: true,
  imports: [FormsModule, ScreenComponent, ListingFlatComponent, SmartImportStubComponent, ActionMenuComponent],
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
          >
            @if (optActStatus()) {
              <nf-action-menu
                label="Status"
                size="xs"
                [nodes]="statusMenuNodes"
                (actionClick)="onListingAction($event)"
              />
            }
            @if (optActSmartImport()) {
              <sb-smart-import-stub />
            }
          </nf-listing-flat>
        </div>
        <aside class="lab__opts" [class.lab__opts--collapsed]="optsCollapsed()">
          <button
            type="button"
            class="lab__opts-toggle"
            [attr.aria-label]="optsCollapsed() ? 'Afficher la configuration' : 'Masquer la configuration'"
            [title]="optsCollapsed() ? 'Afficher la configuration' : 'Masquer la configuration'"
            (click)="optsCollapsed.update((v) => !v)"
          >
            {{ optsCollapsed() ? '«' : '»' }}
          </button>
          @if (!optsCollapsed()) {
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
              <label><input type="checkbox" [ngModel]="optFilterCategory()" (ngModelChange)="optFilterCategory.set($event)" /> Catégorie (select)</label>
              <label><input type="checkbox" [ngModel]="optFilterActive()" (ngModelChange)="optFilterActive.set($event)" /> Filtre actif (Status = Active)</label>
              <label><input type="checkbox" [ngModel]="optFilterCategoryActive()" (ngModelChange)="optFilterCategoryActive.set($event)" /> Filtre actif (Catégorie = Outillage)</label>
            </div>
          }
          <label><input type="checkbox" [ngModel]="optColumns()" (ngModelChange)="optColumns.set($event)" /> Visibilité colonnes</label>
          <label><input type="checkbox" [ngModel]="optExport()" (ngModelChange)="optExport.set($event)" /> Feature Export (CSV)</label>
          <label><input type="checkbox" [ngModel]="optPagination()" (ngModelChange)="optPagination.set($event)" /> Pagination</label>
          <label>
            Layout toolbar
            <select [ngModel]="optToolbarLayout()" (ngModelChange)="optToolbarLayout.set($event)">
              <option value="chips">A · chips-first</option>
              <option value="split">C · vue / actions</option>
            </select>
          </label>
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
          <label><input type="checkbox" [ngModel]="optActStatus()" (ngModelChange)="optActStatus.set($event)" /> Cascade Status (nf-action-menu)</label>
          <label><input type="checkbox" [ngModel]="optActSmartImport()" (ngModelChange)="optActSmartImport.set($event)" /> Import magique</label>
          <label><input type="checkbox" [ngModel]="optActNew()" (ngModelChange)="optActNew.set($event)" /> New</label>
          <label><input type="checkbox" [ngModel]="optActPrint()" (ngModelChange)="optActPrint.set($event)" /> Imprimer</label>
          <label><input type="checkbox" [ngModel]="optActArchive()" (ngModelChange)="optActArchive.set($event)" /> Archiver</label>
          <label><input type="checkbox" [ngModel]="optActDuplicate()" (ngModelChange)="optActDuplicate.set($event)" /> Dupliquer (sélection)</label>
          <label><input type="checkbox" [ngModel]="optActDelete()" (ngModelChange)="optActDelete.set($event)" /> Supprimer (sélection)</label>
          }
        </aside>
      </div>
    </nf-screen>
  `,
  styles: [
    `
      .lab {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        min-height: 0;
        height: 100%;
      }
      .lab__stage {
        min-width: 0;
        min-height: 0;
      }
      .lab__opts {
        width: 240px;
        border-left: 1px solid var(--nf-color-border, #e5e7eb);
        padding-left: 14px;
        font-size: 13px;
      }
      .lab__opts--collapsed {
        width: auto;
        padding-left: 6px;
      }
      .lab__opts-toggle {
        display: block;
        margin: 0 0 8px auto;
        border: 1px solid var(--nf-color-border, #e5e7eb);
        background: transparent;
        border-radius: 6px;
        padding: 1px 7px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--nf-text-muted, #6b7280);
        cursor: pointer;
      }
      .lab__opts-toggle:hover {
        background: var(--nf-bg-hover, #f3f4f6);
        color: var(--nf-text-primary, #111827);
      }
      .lab__opts--collapsed .lab__opts-toggle {
        margin: 0;
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
          height: auto;
          gap: 8px;
        }
        .lab__opts {
          width: auto;
          border-left: 0;
          padding-left: 0;
          border-top: 1px solid var(--nf-color-border, #e5e7eb);
          padding-top: 12px;
        }
        .lab__opts--collapsed {
          border-top: 0;
          padding-top: 0;
          margin-top: 4px;
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
  readonly optFilterCategory = signal(true);
  readonly optFilterActive = signal(true);
  readonly optFilterCategoryActive = signal(true);
  readonly optColumns = signal(true);
  readonly optExport = signal(true);
  readonly optPagination = signal(true);
  readonly optToolbarLayout = signal<'chips' | 'split'>('chips');
  /** Config panel collapsed (mobile-layout testing). */
  readonly optsCollapsed = signal(false);
  readonly optSelection = signal<ListingFlatSelection>('none');
  readonly optSelectionToggle = signal(false);
  readonly optActSmartImport = signal(true);
  readonly optActStatus = signal(true);
  readonly optActNew = signal(true);
  readonly optActPrint = signal(true);
  readonly optActArchive = signal(true);
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

  private readonly categoryFilterField: FilterFieldConfig = {
    key: 'category',
    label: 'Catégorie',
    type: 'select',
    options: [
      { label: 'Matériau', value: 'Matériau' },
      { label: 'Outillage', value: 'Outillage' },
      { label: 'Consommable', value: 'Consommable' },
    ],
  };

  readonly statusMenuNodes: ActionMenuNode[] = [
    { id: 'status-draft', label: 'Brouillon' },
    { id: 'status-active', label: 'Active' },
    { kind: 'divider' },
    { id: 'status-archived', label: 'Archivé', icon: 'archive' },
  ];

  readonly activeFilterFields = computed((): FilterFieldConfig[] => {
    const fields: FilterFieldConfig[] = [];
    if (this.optFilterStatus()) fields.push(this.statusFilterField);
    if (this.optFilterCategory()) fields.push(this.categoryFilterField);
    if (this.optFilterCode()) fields.push({ key: 'code', label: 'Code', type: 'text' });
    if (this.optFilterName()) fields.push({ key: 'name', label: 'Name', type: 'text' });
    return fields;
  });

  readonly initialFilters = computed((): Record<string, unknown> | undefined => {
    const init: Record<string, unknown> = {};
    if (this.optFilterActive()) init['status'] = 'Active';
    if (this.optFilterCategoryActive()) init['category'] = 'Outillage';
    return Object.keys(init).length > 0 ? init : undefined;
  });

  readonly enabledActions = computed((): ListingActionItem[] => {
    const out: ListingActionItem[] = [];
    if (this.optActPrint()) out.push({ id: 'print', label: 'Imprimer', variant: 'secondary', icon: 'printer' });
    if (this.optActArchive()) out.push({ id: 'archive', label: 'Archiver', variant: 'secondary', icon: 'archive' });
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
    { key: 'code', field: 'code', label: 'Code', sortable: true, width: '120px' },
    { key: 'name', field: 'name', label: 'Name', sortable: true },
    { key: 'category', field: 'category', label: 'Catégorie', sortable: true, width: '150px' },
    {
      key: 'status',
      field: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      badgeVariant: (val) => (val === 'Active' ? 'success' : 'default'),
      width: '130px',
    },
    { key: 'description', field: 'description', label: 'Description', sortable: false },
  ];

  readonly selection = signal<Product[]>([]);

  readonly items = signal<Product[]>(this.buildItems());

  private buildItems(): Product[] {
    const base = this.facade.list();
    const categories: Product['category'][] = ['Matériau', 'Outillage', 'Consommable'];
    const extra: Product[] = [];
    for (let i = 6; i <= 36; i++) {
      extra.push({
        id: `prd-${String(i).padStart(2, '0')}`,
        code: `PRD-${String(i).padStart(2, '0')}`,
        name: `Article ${i}`,
        status: i % 3 === 0 ? 'Draft' : 'Active',
        category: categories[i % categories.length],
        description: i % 4 === 0 ? 'Demo row' : undefined,
      });
    }
    return [...base, ...extra];
  }

  readonly headerConfig: PageHeaderConfig = {
    title: 'Products',
    subtitle: 'nf-listing-flat · ligne 1: recherche & filtres · ligne 2: actions & colonnes à droite',
  };

  readonly listingConfig = computed((): ListingFlatConfig => ({
    columns: this.columns,
    toolbarLayout: this.optToolbarLayout(),
    filters: this.activeFilterFields(),
    initialFilters: this.initialFilters(),
    pageSize: this.optPageSize(),
    emptyMessage: 'No products',
    exportFilename: 'products',
    actions: this.enabledActions(),
    selectionActions: this.enabledSelectionActions(),
    projectedActions: this.optActSmartImport() || this.optActStatus(),
    features: {
      search: this.optSearch(),
      filters: this.optFilters(),
      columnToggle: this.optColumns(),
      export: this.optExport(),
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
