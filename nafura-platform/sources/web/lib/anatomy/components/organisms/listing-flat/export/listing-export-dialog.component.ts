import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import type { ColumnConfig } from '../../../../types';
import { ButtonComponent } from '../../../atoms/button';
import { CsvService } from '../../../services/csv.service';

type ExportScope = 'all' | 'page' | 'selection';

/** CSV export dialog of nf-listing-flat; loaded on first use (`@defer`). */
@Component({
  selector: 'nf-listing-export-dialog',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listing-export-dialog.component.html',
  styleUrl: './listing-export-dialog.component.scss',
})
export class ListingExportDialogComponent implements OnInit {
  private readonly csvService = inject(CsvService);

  readonly columns = input.required<ColumnConfig[]>();
  readonly visibleColumns = input.required<ColumnConfig[]>();
  readonly selection = input.required<readonly unknown[]>();
  readonly pageItems = input.required<readonly unknown[]>();
  readonly filteredItems = input.required<readonly unknown[]>();
  readonly page = input.required<number>();
  readonly filename = input('export');

  /** Dialog dismissed, with or without a download. */
  readonly closed = output<void>();
  /** A CSV file was downloaded. */
  readonly exported = output<void>();

  protected readonly scope = signal<ExportScope>('all');
  protected readonly exportColumns = signal<{ key: string; label: string; field: string; selected: boolean }[]>([]);

  protected readonly selectedCount = computed(() => this.exportColumns().filter((c) => c.selected).length);
  protected readonly targetRows = computed(() => {
    switch (this.scope()) {
      case 'selection':
        return this.selection();
      case 'page':
        return this.pageItems();
      default:
        return this.filteredItems();
    }
  });

  ngOnInit(): void {
    // Default scope: the selection if rows are selected, otherwise all the filtered rows.
    this.scope.set(this.selection().length > 0 ? 'selection' : 'all');
    const visibleKeys = new Set(this.visibleColumns().map((c) => c.key));
    this.exportColumns.set(
      this.columns().map((c) => ({ key: c.key, label: c.label, field: c.field ?? c.key, selected: visibleKeys.has(c.key) }))
    );
  }

  protected toggleColumn(key: string, selected: boolean): void {
    this.exportColumns.update((cols) => cols.map((c) => (c.key === key ? { ...c, selected } : c)));
  }

  protected toggleAll(select: boolean): void {
    this.exportColumns.update((cols) => cols.map((c) => ({ ...c, selected: select })));
  }

  protected confirm(): void {
    const rows = this.targetRows() as Record<string, unknown>[];
    const columns = this.exportColumns()
      .filter((c) => c.selected)
      .map((c) => ({ field: c.field, label: c.label }));
    if (columns.length === 0 || rows.length === 0) {
      this.closed.emit();
      return;
    }
    this.csvService.exportToCsv(rows, columns, this.filename());
    this.exported.emit();
    this.closed.emit();
  }
}
