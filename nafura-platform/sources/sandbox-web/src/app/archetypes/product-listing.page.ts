import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import {
  ListingControlsComponent,
  type ListingControlsColumn,
} from '@platform/lib/anatomy/components/molecules/listing-controls';
import {
  ListingActionsComponent,
  type ListingActionItem,
} from '@platform/lib/anatomy/components/molecules/listing-actions';
import { DataTableComponent } from '@platform/lib/anatomy/components/organisms/data-table';
import type { ColumnConfig, FilterFieldConfig } from '@platform/lib/anatomy/types';

import { ProductMockFacade, type Product } from '../mocks/product-mock.facade';
import { SmartImportStubComponent } from '../components/smart-import-stub.component';

@Component({
  selector: 'sb-product-listing',
  standalone: true,
  imports: [
    PageShellComponent,
    PageHeaderComponent,
    ListingControlsComponent,
    ListingActionsComponent,
    SmartImportStubComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig" />

      <div class="toolbar">
        <nf-listing-controls
          [showSelectionToggle]="true"
          [selectionModeActive]="selectionMode()"
          [columns]="controlColumns()"
          [hiddenColumnsCount]="hiddenCount()"
          [filterActive]="filterActive()"
          [filterFields]="filterFields"
          [filterValues]="filterValues()"
          [search]="search()"
          (selectionToggleClick)="selectionMode.update((v) => !v)"
          (columnsChange)="onColumnsChange($event)"
          (filterChange)="onFilterChange($event)"
          (searchChange)="search.set($event)"
        />
        <nf-listing-actions [actions]="globalActions" (actionClick)="onGlobalAction($event)">
          <!-- Real ERP: nf-smart-import-action (menu btn + tooltip) -->
          <sb-smart-import-stub />
        </nf-listing-actions>
      </div>

      <nf-data-table
        [items]="items()"
        [columns]="visibleColumns()"
        [rowClickable]="true"
        [selectable]="selectionMode() ? 'multiple' : false"
        [sortColumn]="sort()?.column"
        [sortDirection]="sort()?.direction"
        (sortChange)="onSortChange($event)"
        (rowDblClick)="open($event)"
      />
    </nf-page-shell>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
    `,
  ],
})
export class ProductListingPage {
  private readonly facade = inject(ProductMockFacade);
  private readonly router = inject(Router);

  readonly headerConfig = {
    title: 'Products',
    subtitle: 'nf-listing · controls + actions (smart-import menu · Export · New)',
  };

  readonly allColumns: ColumnConfig[] = [
    { key: 'code', field: 'code', label: 'Code', sortable: true },
    { key: 'name', field: 'name', label: 'Name', sortable: true },
    { key: 'status', field: 'status', label: 'Status', sortable: true },
    { key: 'description', field: 'description', label: 'Description', sortable: false },
  ];

  readonly controlColumns = signal<ListingControlsColumn[]>(
    this.allColumns.map((c) => ({
      key: c.key,
      label: c.label,
      visible: c.key !== 'description',
    }))
  );

  readonly search = signal('');
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly sort = signal<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  readonly selectionMode = signal(false);

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
      ],
    },
  ];

  readonly globalActions: ListingActionItem[] = [
    { id: 'export', label: 'Export', variant: 'secondary', icon: 'download' },
    { id: 'new', label: 'New', variant: 'primary', icon: 'plus' },
  ];

  readonly hiddenCount = computed(
    () => this.controlColumns().filter((c) => !c.visible).length
  );
  readonly filterActive = computed(() => Object.keys(this.filterValues()).length > 0);

  readonly visibleColumns = computed(() => {
    const visible = new Set(
      this.controlColumns().filter((c) => c.visible).map((c) => c.key)
    );
    return this.allColumns.filter((c) => visible.has(c.key));
  });

  readonly items = computed(() => {
    let rows = this.facade.list();
    const q = this.search().trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q)
      );
    }
    const filters = this.filterValues();
    if (filters['status']) {
      rows = rows.filter((p) => p.status === filters['status']);
    }
    const s = this.sort();
    if (s) {
      const dir = s.direction === 'asc' ? 1 : -1;
      const key = s.column as keyof Product;
      rows = [...rows].sort((a, b) => {
        const av = String(a[key] ?? '');
        const bv = String(b[key] ?? '');
        return av.localeCompare(bv) * dir;
      });
    }
    return rows;
  });

  onColumnsChange(cols: ListingControlsColumn[]): void {
    this.controlColumns.set(cols);
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
  }

  onSortChange(ev: { column: string; direction: 'asc' | 'desc' | null }): void {
    this.sort.set(ev.direction ? { column: ev.column, direction: ev.direction } : null);
  }

  onGlobalAction(id: string): void {
    if (id === 'new') void this.router.navigate(['/archetypes', 'details', 'new']);
  }

  open(item: Product): void {
    void this.router.navigate(['/archetypes', 'details', item.id]);
  }
}
