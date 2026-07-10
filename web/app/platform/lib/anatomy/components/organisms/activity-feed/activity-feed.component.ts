import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTableComponent, SortChangeEvent } from '../data-table';
import type { ActivityFeedConfig, SortDirection } from '../../../types';

/**
 * Activity Feed Component
 *
 * Height-constrained data table for recent activity.
 */
@Component({
  selector: 'nf-activity-feed',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="nf-activity-feed__table" [style.max-height]="maxHeight()">
      <nf-data-table
        [items]="displayItems()"
        [columns]="config().columns"
        [rowClickable]="config().rowClickable ?? false"
        [sortColumn]="sortColumn()"
        [sortDirection]="sortDirection()"
        (sortChange)="onSortChange($event)"
        (rowClick)="onRowClick($event)">
      </nf-data-table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nf-activity-feed__table {
        overflow: hidden;
      }

      :host ::ng-deep nf-data-table {
        display: block;
        max-height: 100%;
      }
    `,
  ],
})
export class ActivityFeedComponent<TItem = unknown> {
  items = input<TItem[]>([]);
  config = input.required<ActivityFeedConfig>();
  sortColumn = input<string>('');
  sortDirection = input<SortDirection | undefined>(undefined);

  sortChange = output<SortChangeEvent>();
  rowClick = output<TItem>();

  readonly maxHeight = computed(() => this.config().maxHeight ?? '320px');

  readonly displayItems = computed(() => {
    const maxRows = this.config().maxRows;
    const data = this.items();
    return maxRows ? data.slice(0, maxRows) : data;
  });

  onSortChange(event: SortChangeEvent): void {
    this.sortChange.emit(event);
  }

  onRowClick(item: TItem): void {
    this.rowClick.emit(item);
  }
}
