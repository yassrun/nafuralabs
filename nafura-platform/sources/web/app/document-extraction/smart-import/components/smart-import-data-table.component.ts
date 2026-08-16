import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { UiArrayColumn } from '../../models/ui-schema.model';
import type { SmartImportRow, SmartImportRowStatus } from '../models/smart-import.model';
import { getRelativeValue } from '../utils/tree-flatten.util';
import {
  SmartImportDoubtListsComponent,
  type SmartImportDoubtReclassifyEvent,
} from './smart-import-doubt-lists.component';

export interface SmartImportDataTableRowEvent {
  index: number;
  row: SmartImportRow;
}

@Component({
  selector: 'nf-smart-import-data-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, SmartImportDoubtListsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      @if (title) {
        <h3>{{ title }}</h3>
      }
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th class="status-col">{{ 'platform.smartImport.columns.status' | translate }}</th>
              @for (col of columns; track col.path) {
                <th [style.width.px]="col.widthPx ?? null">{{ col.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (entry of visibleEntries; track entry.index) {
              <tr
                [class.invalid]="entry.row.status === 'NEEDS_REVIEW'"
                [class.muted]="isMuted(entry.row.status)"
                (dblclick)="rowActivate.emit({ index: entry.index, row: entry.row })"
                [attr.title]="'platform.smartImport.review.dblclickHint' | translate">
                <td class="status-col">
                  <span class="badge" [attr.data-status]="entry.row.status">
                    {{ statusKey(entry.row.status) | translate }}
                  </span>
                </td>
                @for (col of columns; track col.path) {
                  <td class="cell">{{ displayValue(entry.row.data, col.path) }}</td>
                }
              </tr>
              @if (entry.row.issues.length > 0 && entry.row.status === 'NEEDS_REVIEW') {
                <tr class="issues-row">
                  <td [attr.colspan]="columns.length + 1">
                    <nf-smart-import-doubt-lists
                      [issues]="entry.row.issues"
                      [columns]="columns"
                      (reclassify)="reclassify.emit($event)" />
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .wrap { display: grid; gap: .5rem; }
    h3 { margin: 0; font-size: .95rem; }
    .table-scroll { overflow: auto; max-height: min(52vh, 560px); border: 1px solid var(--nf-color-border); border-radius: .5rem; }
    table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    th, td { padding: .55rem .65rem; text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    th { position: sticky; top: 0; background: var(--nf-color-bg-subtle, #f5f5f5); z-index: 1; }
    tbody tr { cursor: pointer; }
    tbody tr.muted { opacity: .55; }
    tbody tr.invalid { background: color-mix(in srgb, var(--nf-color-warning-500, #f59e0b) 8%, transparent); }
    tbody tr:hover { background: color-mix(in srgb, var(--nf-color-primary-500, #2563eb) 6%, transparent); }
    .cell { color: var(--nf-color-text-secondary); }
    .status-col { width: 110px; }
    .badge {
      display: inline-block; padding: .1rem .45rem; border-radius: 999px;
      font-size: .7rem; background: var(--nf-color-bg-subtle);
    }
    .badge[data-status='READY'] { color: var(--nf-color-success-700, #15803d); }
    .badge[data-status='NEEDS_REVIEW'] { color: var(--nf-color-warning-700, #b45309); }
    .badge[data-status='DUPLICATE'],
    .badge[data-status='IGNORED'] { color: var(--nf-color-text-secondary); }
    .badge[data-status='FAILED'] { color: var(--nf-color-danger-700, #b91c1c); }
    .issues-row td { padding-top: 0; background: transparent; }
    .issues-row nf-smart-import-doubt-lists { display: block; margin-left: 110px; }
  `],
})
export class SmartImportDataTableComponent {
  @Input({ required: true }) rows: SmartImportRow[] = [];
  @Input({ required: true }) columns: UiArrayColumn[] = [];
  @Input() title = '';
  @Input() filter: SmartImportRowStatus | 'ALL' = 'ALL';
  @Output() readonly rowActivate = new EventEmitter<SmartImportDataTableRowEvent>();
  @Output() readonly reclassify = new EventEmitter<SmartImportDoubtReclassifyEvent>();

  get visibleEntries(): Array<{ index: number; row: SmartImportRow }> {
    return this.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => this.filter === 'ALL' || row.status === this.filter);
  }

  displayValue(data: Record<string, unknown>, path: string): string {
    const value = getRelativeValue(data, path);
    if (value == null || value === '') return '—';
    return String(value);
  }

  statusKey(status: SmartImportRowStatus): string {
    return `platform.smartImport.status.${status.toLowerCase()}`;
  }

  isMuted(status: SmartImportRowStatus): boolean {
    return status === 'IGNORED' || status === 'DUPLICATE';
  }
}
