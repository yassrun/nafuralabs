import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AlertComponent, ButtonComponent } from '@lib/anatomy';
import { DynamicArrayTableComponent } from '../../doc-extractor/components/dynamic-array-table/dynamic-array-table.component';
import type { JsonSchemaArray, JsonSchemaObject } from '../../doc-extractor/models/json-schema.model';
import { JsonSchemaFormBuilder } from '../../doc-extractor/utils/json-schema-form-builder';
import type { SmartImportRowStatus, SmartImportSession } from '../models/smart-import.model';
import { SmartImportOrchestratorService } from '../services/smart-import-orchestrator.service';

@Component({
  selector: 'nf-smart-import-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    TranslateModule,
    AlertComponent,
    ButtonComponent,
    DynamicArrayTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="review">
      <header>
        <div>
          <h2>{{ 'platform.smartImport.review.title' | translate }}</h2>
          <p>{{ 'platform.smartImport.review.hint' | translate:{ count: session.rows.length } }}</p>
        </div>
        <span class="policy">{{ session.config.importPolicy }}</span>
      </header>

      @if (invalidCount() > 0) {
        <nf-alert
          variant="warning"
          [title]="'platform.smartImport.review.attentionTitle' | translate"
          [message]="'platform.smartImport.review.attentionMessage' | translate:{ count: invalidCount() }" />
      }

      <nav class="filters" aria-label="Import row filters">
        @for (filter of filters; track filter.status) {
          <button
            type="button"
            [class.active]="selectedFilter() === filter.status"
            (click)="selectedFilter.set(filter.status)">
            {{ filter.label | translate }}
            <span>{{ count(filter.status) }}</span>
          </button>
        }
      </nav>

      @if (arrayConfig(); as cfg) {
        <app-dynamic-array-table
          [title]="cfg.title"
          [formArray]="formArray"
          [arraySchema]="arraySchema()"
          [columns]="cfg.columns"
          [issues]="allIssues()"
          [lockStructure]="true"
        />
      }

      <div class="row-decisions">
        @for (entry of visibleRows(); track entry.row.sourceIndex) {
          <article [class.invalid]="entry.row.status === 'NEEDS_REVIEW'">
            <div>
              <strong>{{ entry.row.label }}</strong>
              <span class="status">{{ statusKey(entry.row.status) | translate }}</span>
              @if (entry.row.issues.length > 0) {
                <ul>
                  @for (issue of entry.row.issues; track issue.path + issue.kind) {
                    <li>{{ issue.path }} — {{ issue.message }}</li>
                  }
                </ul>
              }
            </div>
            <div class="actions">
              @if (entry.row.status === 'IGNORED') {
                <nf-button variant="secondary" size="sm" (clicked)="restore(entry.index)">
                  {{ 'platform.smartImport.review.restore' | translate }}
                </nf-button>
              } @else if (entry.row.status !== 'DUPLICATE') {
                <nf-button variant="ghost" size="sm" (clicked)="ignore(entry.index)">
                  {{ 'platform.smartImport.review.ignore' | translate }}
                </nf-button>
              }
            </div>
          </article>
        }
      </div>

      <footer>
        <div>
          @if (invalidCount() > 0 && session.config.importPolicy === 'PARTIAL') {
            <nf-button variant="ghost" (clicked)="ignoreAllInvalid()">
              {{ 'platform.smartImport.review.ignoreAllInvalid' | translate }}
            </nf-button>
          }
        </div>
        <div class="footer-actions">
          <nf-button variant="secondary" (clicked)="cancel()">
            {{ 'common.cancel' | translate }}
          </nf-button>
          <nf-button variant="primary" [disabled]="!canConfirm()" (clicked)="confirm()">
            {{ 'platform.smartImport.review.confirm' | translate:{ count: readyCount() } }}
          </nf-button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .review { padding: 1.25rem; display: grid; gap: 1rem; width: min(1100px, 94vw); }
    header, footer, article { display: flex; justify-content: space-between; gap: 1rem; }
    h2, p { margin: 0; }
    header p { color: var(--nf-color-text-secondary); }
    .policy, .status, .filters span {
      padding: .15rem .45rem; border-radius: 999px; background: var(--nf-color-bg-subtle);
      font-size: .75rem;
    }
    .filters { display: flex; flex-wrap: wrap; gap: .4rem; }
    .filters button {
      border: 1px solid var(--nf-color-border); background: transparent; color: inherit;
      border-radius: 999px; padding: .35rem .6rem; cursor: pointer;
    }
    .filters button.active { border-color: var(--nf-color-primary-500); }
    .row-decisions { display: grid; gap: .4rem; max-height: 240px; overflow: auto; }
    article { border: 1px solid var(--nf-color-border); border-radius: .5rem; padding: .65rem; }
    article.invalid { border-color: var(--nf-color-warning-500); }
    article ul { margin: .35rem 0 0; color: var(--nf-color-danger-700); font-size: .8rem; }
    .actions, .footer-actions { display: flex; align-items: center; gap: .5rem; }
    footer { align-items: center; }
  `],
})
export class SmartImportReviewDialogComponent {
  readonly session = inject<SmartImportSession>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<SmartImportReviewDialogComponent, SmartImportSession | undefined>,
  );
  private readonly orchestrator = inject(SmartImportOrchestratorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly formArray = new FormArray<AbstractControl>([]);
  readonly selectedFilter = signal<SmartImportRowStatus | 'ALL'>('ALL');
  readonly filters: Array<{ status: SmartImportRowStatus | 'ALL'; label: string }> = [
    { status: 'ALL', label: 'platform.smartImport.filters.all' },
    { status: 'READY', label: 'platform.smartImport.filters.ready' },
    { status: 'NEEDS_REVIEW', label: 'platform.smartImport.filters.needsReview' },
    { status: 'DUPLICATE', label: 'platform.smartImport.filters.duplicates' },
    { status: 'IGNORED', label: 'platform.smartImport.filters.ignored' },
    { status: 'FAILED', label: 'platform.smartImport.filters.failed' },
  ];

  constructor() {
    const schema = this.itemObjectSchema();
    for (const row of this.session.rows) {
      const group = JsonSchemaFormBuilder.buildGroupForObjectSchema(schema);
      JsonSchemaFormBuilder.patchFormFromData({ form: group, schema, dataJson: row.data });
      this.formArray.push(group);
    }
    this.formArray.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncAndValidate());
  }

  arrayConfig() {
    return this.session.schema.uiSchema.arrays?.find(
      (array) => array.path === this.session.arrayPath,
    );
  }

  arraySchema(): JsonSchemaArray {
    const schema = this.session.schema.jsonSchema as unknown as Record<string, unknown>;
    const properties = schema['properties'] as Record<string, unknown>;
    return properties[this.session.arrayPath] as JsonSchemaArray;
  }

  itemObjectSchema(): JsonSchemaObject {
    return this.arraySchema().items as JsonSchemaObject;
  }

  allIssues() {
    return this.session.rows.flatMap((row) => row.issues);
  }

  count(status: SmartImportRowStatus | 'ALL'): number {
    return status === 'ALL'
      ? this.session.rows.length
      : this.session.rows.filter((row) => row.status === status).length;
  }

  readyCount(): number {
    return this.count('READY');
  }

  invalidCount(): number {
    return this.count('NEEDS_REVIEW');
  }

  visibleRows() {
    return this.session.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) =>
        this.selectedFilter() === 'ALL' || row.status === this.selectedFilter(),
      );
  }

  statusKey(status: SmartImportRowStatus): string {
    return `platform.smartImport.status.${status.toLowerCase()}`;
  }

  ignore(index: number): void {
    this.syncRows();
    this.session.rows[index].status = 'IGNORED';
  }

  restore(index: number): void {
    this.session.rows[index].status = 'READY';
    this.syncAndValidate();
  }

  ignoreAllInvalid(): void {
    this.syncRows();
    for (const row of this.session.rows) {
      if (row.status === 'NEEDS_REVIEW') row.status = 'IGNORED';
    }
  }

  canConfirm(): boolean {
    if (this.readyCount() === 0 && this.count('IMPORTED') === 0) return false;
    // Block confirm while unresolved issues remain (fix or ignore first).
    if (this.invalidCount() > 0) return false;
    return true;
  }

  confirm(): void {
    this.syncAndValidate();
    if (this.canConfirm()) this.ref.close(this.session);
  }

  cancel(): void {
    this.ref.close(undefined);
  }

  private syncAndValidate(): void {
    this.syncRows();
    this.orchestrator.revalidate(this.session);
  }

  private syncRows(): void {
    const schema = this.itemObjectSchema();
    this.formArray.controls.forEach((control, index) => {
      const serialized = JsonSchemaFormBuilder.serializeToDataJson({
        form: control as ReturnType<typeof JsonSchemaFormBuilder.buildGroupForObjectSchema>,
        schema,
      });
      // Preserve nested arrays (e.g. lots.sousLots/postes) not edited in the flat table.
      this.session.rows[index].data = {
        ...this.session.rows[index].data,
        ...serialized,
      };
    });
  }
}

