import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import {
  partitionDoubts,
  type DoubtNature,
  type FieldIssue,
} from '../../models/extraction.model';
import type { UiArrayColumn, UiSchema } from '../../models/ui-schema.model';
import { formatIssueMessage } from '../utils/issue-display.util';

export interface SmartImportDoubtReclassifyEvent {
  issue: FieldIssue;
  nature: DoubtNature;
}

@Component({
  selector: 'nf-smart-import-doubt-lists',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (extraction.length > 0 || sourceGap.length > 0) {
      <div class="doubt-lists">
        @if (extraction.length > 0) {
          <section data-nature="EXTRACTION">
            <h4>{{ 'platform.smartImport.doubts.extraction' | translate }}</h4>
            <p class="hint">{{ 'platform.smartImport.doubts.extractionHint' | translate }}</p>
            <ul>
              @for (issue of extraction; track trackIssue(issue)) {
                <li>
                  <span>{{ humanIssue(issue) }}</span>
                  <button type="button" (click)="reclassify.emit({ issue, nature: 'SOURCE_GAP' })">
                    {{ 'platform.smartImport.doubts.reclassifyAsSourceGap' | translate }}
                  </button>
                </li>
              }
            </ul>
          </section>
        }
        @if (sourceGap.length > 0) {
          <section data-nature="SOURCE_GAP">
            <h4>{{ 'platform.smartImport.doubts.sourceGap' | translate }}</h4>
            <p class="hint">{{ 'platform.smartImport.doubts.sourceGapHint' | translate }}</p>
            <ul>
              @for (issue of sourceGap; track trackIssue(issue)) {
                <li>
                  <span>{{ humanIssue(issue) }}</span>
                  <button type="button" (click)="reclassify.emit({ issue, nature: 'EXTRACTION' })">
                    {{ 'platform.smartImport.doubts.reclassifyAsExtraction' | translate }}
                  </button>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    }
  `,
  styles: [`
    .doubt-lists {
      display: grid;
      gap: .75rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      margin: 0;
    }
    h4 { margin: 0; font-size: .75rem; font-weight: 600; }
    .hint { margin: .15rem 0 .35rem; font-size: .7rem; color: var(--nf-color-text-secondary); }
    ul { margin: 0; padding-left: 1rem; font-size: .8rem; }
    section[data-nature='EXTRACTION'] ul { color: var(--nf-color-warning-700, #b45309); }
    section[data-nature='SOURCE_GAP'] ul { color: var(--nf-color-text-secondary); }
    li { display: flex; flex-wrap: wrap; gap: .35rem .75rem; align-items: baseline; }
    button {
      border: 0;
      background: none;
      padding: 0;
      color: var(--nf-color-primary-600, #2563eb);
      cursor: pointer;
      font-size: .7rem;
      text-decoration: underline;
    }
  `],
})
export class SmartImportDoubtListsComponent {
  @Input() issues: FieldIssue[] = [];
  @Input() columns: UiArrayColumn[] = [];
  @Input() uiSchema?: UiSchema;
  @Output() readonly reclassify = new EventEmitter<SmartImportDoubtReclassifyEvent>();

  get extraction(): FieldIssue[] {
    return partitionDoubts(this.issues).extraction;
  }

  get sourceGap(): FieldIssue[] {
    return partitionDoubts(this.issues).sourceGap;
  }

  trackIssue(issue: FieldIssue): string {
    return `${issue.path}|${issue.kind}|${issue.rowIndex ?? ''}`;
  }

  humanIssue(issue: FieldIssue): string {
    return formatIssueMessage(issue, { columns: this.columns, uiSchema: this.uiSchema });
  }
}
