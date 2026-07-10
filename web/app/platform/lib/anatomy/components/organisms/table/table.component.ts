import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ColumnConfig, SortDirection } from '../../../types';
import { DataTableComponent, SortChangeEvent } from '../data-table';

@Component({
  selector: 'nf-table',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <nf-data-table
      [items]="items()"
      [columns]="columns()"
      [loading]="loading()"
      [sortColumn]="sortColumn()"
      [sortDirection]="sortDirection()"
      [rowClickable]="rowClickable()"
      [stickyHeader]="stickyHeader()"
      [emptyMessage]="emptyMessage()"
      (sortChange)="sortChange.emit($event)"
      (rowClick)="rowClick.emit($event)">
    </nf-data-table>
  `,
})
export class TableComponent<T = unknown> {
  items = input<T[]>([]);
  columns = input.required<ColumnConfig[]>();
  loading = input<boolean>(false);
  sortColumn = input<string | undefined>(undefined);
  sortDirection = input<SortDirection | undefined>(undefined);
  rowClickable = input<boolean>(false);
  stickyHeader = input<boolean>(true);
  emptyMessage = input<string>('No data available');

  sortChange = output<SortChangeEvent>();
  rowClick = output<T>();
}
