import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AlertComponent, ButtonComponent } from '@lib/anatomy';
import type { SmartImportResult } from '../models/smart-import.model';

export type SmartImportResultAction = 'CLOSE' | 'RETRY';

@Component({
  selector: 'nf-smart-import-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule, AlertComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="result">
      <header>
        <h2>{{ 'platform.smartImport.result.title' | translate }}</h2>
        <p>{{ 'platform.smartImport.result.hint' | translate }}</p>
      </header>

      <div class="stats">
        <div><strong>{{ data.imported + data.corrected }}</strong><span>{{ 'platform.smartImport.result.imported' | translate }}</span></div>
        <div><strong>{{ data.skippedDuplicates }}</strong><span>{{ 'platform.smartImport.result.duplicates' | translate }}</span></div>
        <div><strong>{{ data.skippedByUser + data.skippedInvalid }}</strong><span>{{ 'platform.smartImport.result.skipped' | translate }}</span></div>
        <div class="failed"><strong>{{ data.failed }}</strong><span>{{ 'platform.smartImport.result.failed' | translate }}</span></div>
      </div>

      @if (failedRows().length > 0) {
        <nf-alert
          variant="warning"
          [message]="'platform.smartImport.result.retryHint' | translate:{ count: failedRows().length }" />
        <div class="failures">
          @for (row of failedRows(); track row.sourceIndex) {
            <div>
              <strong>{{ row.label }}</strong>
              <span>{{ (row.error?.messageKey ?? 'platform.smartImport.errors.unknown') | translate }}</span>
              @if (row.error?.correlationId) {
                <small>Ref: {{ row.error?.correlationId }}</small>
              }
            </div>
          }
        </div>
      }

      <footer>
        @if (failedRows().length > 0) {
          <nf-button variant="secondary" (clicked)="close('RETRY')">
            {{ 'platform.smartImport.result.retry' | translate }}
          </nf-button>
        }
        <nf-button variant="primary" (clicked)="close('CLOSE')">
          {{ 'common.close' | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .result { padding: 1.25rem; display: grid; gap: 1rem; min-width: min(680px, 90vw); }
    h2, p { margin: 0; }
    header p, .failures span, small { color: var(--nf-color-text-secondary); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
    .stats div { border: 1px solid var(--nf-color-border); border-radius: .5rem; padding: .75rem; display: grid; }
    .stats strong { font-size: 1.5rem; }
    .stats span { font-size: .8rem; color: var(--nf-color-text-secondary); }
    .stats .failed strong { color: var(--nf-color-danger-700); }
    .failures { max-height: 260px; overflow: auto; border: 1px solid var(--nf-color-border); border-radius: .5rem; }
    .failures div { padding: .6rem .75rem; display: grid; }
    .failures div + div { border-top: 1px solid var(--nf-color-border); }
    footer { display: flex; justify-content: flex-end; gap: .5rem; }
  `],
})
export class SmartImportResultDialogComponent {
  readonly data = inject<SmartImportResult>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<SmartImportResultDialogComponent, SmartImportResultAction>,
  );

  failedRows() {
    return this.data.rows.filter((row) => row.status === 'FAILED');
  }

  close(action: SmartImportResultAction): void {
    this.ref.close(action);
  }
}

