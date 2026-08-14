import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { FieldIssue } from '../../doc-extractor/models/extraction.model';
import type { UiArrayColumn, UiSchema } from '../../doc-extractor/models/ui-schema.model';
import type { SmartImportRow, SmartImportRowStatus } from '../models/smart-import.model';
import { getRelativeValue } from '../utils/tree-flatten.util';
import {
  SmartImportDataTableComponent,
  type SmartImportDataTableRowEvent,
} from './smart-import-data-table.component';
import {
  SmartImportDoubtListsComponent,
  type SmartImportDoubtReclassifyEvent,
} from './smart-import-doubt-lists.component';

export interface SmartImportRecordHeaderEvent {
  rootData: Record<string, unknown>;
}

@Component({
  selector: 'nf-smart-import-record-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, SmartImportDataTableComponent, SmartImportDoubtListsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="record">
      <section
        class="header"
        (dblclick)="headerActivate.emit({ rootData })"
        [attr.title]="'platform.smartImport.review.dblclickHint' | translate">
        <div class="header-top">
          <h3>{{ 'platform.smartImport.review.recordHeader' | translate }}</h3>
          <span class="hint">{{ 'platform.smartImport.review.dblclickHint' | translate }}</span>
        </div>
        @for (section of uiSchema.sections ?? []; track section.title) {
          <div class="section">
            @if (section.title) {
              <h4>{{ section.title }}</h4>
            }
            <dl [style.--cols]="section.columns ?? 2">
              @for (field of section.fields; track field.path) {
                <div class="field">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ displayValue(rootData, field.path) }}</dd>
                </div>
              }
            </dl>
          </div>
        }
        @if (headerIssues.length > 0) {
          <nf-smart-import-doubt-lists
            [issues]="headerIssues"
            [columns]="columns"
            [uiSchema]="uiSchema"
            (reclassify)="reclassify.emit($event)" />
        }
      </section>

      <nf-smart-import-data-table
        [title]="arrayTitle"
        [rows]="rows"
        [columns]="columns"
        [filter]="filter"
        (rowActivate)="rowActivate.emit($event)"
        (reclassify)="reclassify.emit($event)" />
    </div>
  `,
  styles: [`
    .record { display: grid; gap: 1rem; }
    .header {
      border: 1px solid var(--nf-color-border);
      border-radius: .5rem;
      padding: .85rem 1rem;
      cursor: pointer;
      background: var(--nf-color-bg-subtle, #f8f8f8);
    }
    .header:hover { outline: 1px solid var(--nf-color-primary-500, #2563eb); }
    .header-top { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
    h3, h4 { margin: 0; }
    h3 { font-size: .95rem; }
    h4 { font-size: .8rem; color: var(--nf-color-text-secondary); margin-bottom: .35rem; }
    .hint { font-size: .75rem; color: var(--nf-color-text-secondary); }
    .section { margin-top: .75rem; }
    dl {
      display: grid;
      grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
      gap: .5rem 1rem;
      margin: 0;
    }
    .field dt {
      margin: 0;
      font-size: .7rem;
      color: var(--nf-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: .02em;
    }
    .field dd {
      margin: .1rem 0 0;
      color: var(--nf-color-text-secondary);
      font-size: .875rem;
    }
  `],
})
export class SmartImportRecordTableComponent {
  @Input({ required: true }) rootData!: Record<string, unknown>;
  @Input({ required: true }) uiSchema!: UiSchema;
  @Input({ required: true }) rows: SmartImportRow[] = [];
  @Input({ required: true }) columns: UiArrayColumn[] = [];
  @Input() arrayTitle = '';
  @Input() filter: SmartImportRowStatus | 'ALL' = 'ALL';
  @Input() headerIssues: FieldIssue[] = [];
  @Output() readonly headerActivate = new EventEmitter<SmartImportRecordHeaderEvent>();
  @Output() readonly rowActivate = new EventEmitter<SmartImportDataTableRowEvent>();
  @Output() readonly reclassify = new EventEmitter<SmartImportDoubtReclassifyEvent>();

  displayValue(data: Record<string, unknown>, path: string): string {
    const value = getRelativeValue(data, path);
    if (value == null || value === '') return '—';
    return String(value);
  }
}
