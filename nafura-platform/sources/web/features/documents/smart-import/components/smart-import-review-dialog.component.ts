import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@lib/anatomy';
import {
  reclassifyDoubt,
  summarizeDoubts,
  type FieldIssue,
} from '../../doc-extractor/models/extraction.model';
import type { JsonSchemaObject, JsonSchemaRoot } from '../../doc-extractor/models/json-schema.model';
import type { UiArrayConfig, UiRootView, UiSchema } from '../../doc-extractor/models/ui-schema.model';
import type { SmartImportRowStatus, SmartImportSession } from '../models/smart-import.model';
import { SmartImportOrchestratorService } from '../services/smart-import-orchestrator.service';
import { resolveRootView, resolveTreeConfig } from '../utils/root-view.util';
import { mergeNodeData } from '../utils/tree-flatten.util';
import {
  SmartImportDataTableComponent,
  type SmartImportDataTableRowEvent,
} from './smart-import-data-table.component';
import type { SmartImportDoubtReclassifyEvent } from './smart-import-doubt-lists.component';
import {
  SmartImportEditDialogComponent,
  type SmartImportEditDialogData,
} from './smart-import-edit-dialog.component';
import {
  SmartImportRecordTableComponent,
  type SmartImportRecordHeaderEvent,
} from './smart-import-record-table.component';
import {
  SmartImportTreeTableComponent,
  type SmartImportTreeNodeEvent,
} from './smart-import-tree-table.component';

@Component({
  selector: 'nf-smart-import-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    TranslateModule,
    ButtonComponent,
    SmartImportDataTableComponent,
    SmartImportTreeTableComponent,
    SmartImportRecordTableComponent,
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

      @if (doubtSummary().extraction > 0 || doubtSummary().sourceGap > 0) {
        <div class="doubt-banner" role="group">
          <p data-nature="EXTRACTION">
            {{ 'platform.smartImport.doubts.bannerExtraction' | translate:{ count: doubtSummary().extraction } }}
          </p>
          <p data-nature="SOURCE_GAP">
            {{ 'platform.smartImport.doubts.bannerSourceGap' | translate:{ count: doubtSummary().sourceGap } }}
          </p>
        </div>
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

      <div class="layout-host">
        @switch (rootView) {
          @case ('TREE_TABLE') {
            <nf-smart-import-tree-table
              [title]="arrayConfig()?.title ?? ''"
              [rows]="session.rows"
              [tree]="treeConfig"
              [filter]="selectedFilter()"
              (nodeActivate)="onTreeNodeActivate($event)"
              (reclassify)="onReclassify($event)" />
          }
          @case ('RECORD_TABLE') {
            <nf-smart-import-record-table
              [rootData]="session.rootData"
              [uiSchema]="session.schema.uiSchema"
              [rows]="session.rows"
              [columns]="arrayConfig()?.columns ?? []"
              [arrayTitle]="arrayConfig()?.title ?? ''"
              [filter]="selectedFilter()"
              [headerIssues]="headerIssues()"
              (headerActivate)="onRecordHeaderActivate($event)"
              (rowActivate)="onDataRowActivate($event)"
              (reclassify)="onReclassify($event)" />
          }
          @default {
            <nf-smart-import-data-table
              [title]="arrayConfig()?.title ?? ''"
              [rows]="session.rows"
              [columns]="arrayConfig()?.columns ?? []"
              [filter]="selectedFilter()"
              (rowActivate)="onDataRowActivate($event)"
              (reclassify)="onReclassify($event)" />
          }
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
    .review {
      padding: 1.25rem 1.5rem;
      display: grid;
      gap: 1rem;
      width: min(96vw, 1280px);
      max-height: min(90vh, 960px);
      grid-template-rows: auto auto auto 1fr auto;
    }
    header, footer { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    h2, p { margin: 0; }
    header p { color: var(--nf-color-text-secondary); }
    .policy {
      padding: .15rem .45rem; border-radius: 999px; background: var(--nf-color-bg-subtle);
      font-size: .75rem; white-space: nowrap;
    }
    .filters { display: flex; flex-wrap: wrap; gap: .4rem; }
    .filters button {
      border: 1px solid var(--nf-color-border); background: transparent; color: inherit;
      border-radius: 999px; padding: .35rem .6rem; cursor: pointer;
    }
    .filters button.active { border-color: var(--nf-color-primary-500); }
    .doubt-banner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .75rem 1.25rem;
    }
    .doubt-banner p { margin: 0; font-size: .9rem; }
    .doubt-banner [data-nature='EXTRACTION'] { color: var(--nf-color-warning-700, #b45309); }
    .doubt-banner [data-nature='SOURCE_GAP'] { color: var(--nf-color-text-secondary); }
    .layout-host { min-height: 0; overflow: auto; }
    .footer-actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; justify-content: flex-end; }
    footer { align-items: center; }
  `],
})
export class SmartImportReviewDialogComponent {
  readonly session = inject<SmartImportSession>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<SmartImportReviewDialogComponent, SmartImportSession | undefined>,
  );
  private readonly orchestrator = inject(SmartImportOrchestratorService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly selectedFilter = signal<SmartImportRowStatus | 'ALL'>('ALL');
  readonly filters: Array<{ status: SmartImportRowStatus | 'ALL'; label: string }> = [
    { status: 'ALL', label: 'platform.smartImport.filters.all' },
    { status: 'READY', label: 'platform.smartImport.filters.ready' },
    { status: 'NEEDS_REVIEW', label: 'platform.smartImport.filters.needsReview' },
    { status: 'DUPLICATE', label: 'platform.smartImport.filters.duplicates' },
    { status: 'IGNORED', label: 'platform.smartImport.filters.ignored' },
  ];

  readonly rootView: UiRootView;
  readonly treeConfig;

  constructor() {
    this.rootView = resolveRootView(
      this.session.schema.uiSchema,
      this.session.schema.jsonSchema,
      this.session.arrayPath,
    );
    this.treeConfig = resolveTreeConfig(this.session.schema.uiSchema, this.session.arrayPath);
  }

  arrayConfig(): UiArrayConfig | undefined {
    return this.session.schema.uiSchema.arrays?.find(
      (array) => array.path === this.session.arrayPath,
    ) ?? this.session.schema.uiSchema.arrays?.[0];
  }

  /** Header-level issues (RECORD_TABLE) — stored on first row during revalidate. */
  headerIssues(): FieldIssue[] {
    const arrayPath = this.session.arrayPath;
    const first = this.session.rows[0];
    if (!first || !this.session.rootData) return [];
    return first.issues.filter((issue) => {
      const p = issue.path ?? '';
      return !p.startsWith(`${arrayPath}[`) && p !== arrayPath;
    });
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

  doubtSummary(): { extraction: number; sourceGap: number } {
    return summarizeDoubts(this.session.rows.flatMap((row) => row.issues));
  }

  onReclassify(event: SmartImportDoubtReclassifyEvent): void {
    const next = reclassifyDoubt(event.issue, event.nature);
    for (const row of this.session.rows) {
      row.issues = row.issues.map((issue) => (issue === event.issue ? next : issue));
    }
    this.refreshRows();
  }

  ignoreAllInvalid(): void {
    for (const row of this.session.rows) {
      if (row.status === 'NEEDS_REVIEW') row.status = 'IGNORED';
    }
    this.refreshRows();
  }

  canConfirm(): boolean {
    if (this.readyCount() === 0) return false;
    if (this.invalidCount() > 0) return false;
    return true;
  }

  confirm(): void {
    this.orchestrator.revalidate(this.session);
    if (this.canConfirm()) this.ref.close(this.session);
    else this.refreshRows();
  }

  cancel(): void {
    this.ref.close(undefined);
  }

  async onDataRowActivate(event: SmartImportDataTableRowEvent): Promise<void> {
    const row = event.row;
    if (row.status === 'IGNORED' || row.status === 'DUPLICATE') {
      return;
    }
    const itemSchema = this.itemObjectSchema();
    const patched = await this.openEditDialog({
      title: this.translate.instant('platform.smartImport.edit.titleRow', {
        label: row.label,
      }),
      objectSchema: itemSchema,
      uiSchema: this.rowEditUiSchema(itemSchema),
      data: { ...row.data },
      preserveArrayKeys: this.treeConfig.childrenPaths,
    });
    if (!patched) return;
    mergeNodeData(row.data, patched, this.treeConfig.childrenPaths);
    this.orchestrator.revalidate(this.session);
    this.refreshRows();
  }

  async onTreeNodeActivate(event: SmartImportTreeNodeEvent): Promise<void> {
    const node = event.node;
    const root = this.session.rows[node.rootIndex];
    if (!root || root.status === 'IGNORED' || root.status === 'DUPLICATE') {
      return;
    }
    const objectSchema = this.schemaForTreeLevel(node.levelKey);
    const patched = await this.openEditDialog({
      title: this.translate.instant('platform.smartImport.edit.titleNode', {
        level: node.levelLabel,
      }),
      objectSchema,
      uiSchema: this.nodeEditUiSchema(objectSchema),
      data: { ...node.data },
      preserveArrayKeys: this.treeConfig.childrenPaths,
    });
    if (!patched) return;
    mergeNodeData(node.data, patched, this.treeConfig.childrenPaths);
    this.orchestrator.revalidate(this.session);
    this.refreshRows();
  }

  async onRecordHeaderActivate(_event: SmartImportRecordHeaderEvent): Promise<void> {
    const root = this.session.rootData;
    const rootSchema = this.session.schema.jsonSchema as JsonSchemaObject;
    const patched = await this.openEditDialog({
      title: this.translate.instant('platform.smartImport.edit.titleHeader'),
      objectSchema: rootSchema,
      uiSchema: {
        ...this.session.schema.uiSchema,
        arrays: [],
      },
      data: { ...root },
      preserveArrayKeys: [this.session.arrayPath],
    });
    if (!patched) return;
    mergeNodeData(root, patched, [this.session.arrayPath]);
    this.orchestrator.revalidate(this.session);
    this.refreshRows();
  }

  /** New array ref so OnPush layout children detect edits/revalidation. */
  private refreshRows(): void {
    this.session.rows = this.session.rows.map((row) => ({
      ...row,
      issues: [...row.issues],
    }));
    this.cdr.markForCheck();
  }

  private async openEditDialog(
    data: SmartImportEditDialogData,
  ): Promise<Record<string, unknown> | undefined> {
    const ref = this.dialog.open<
      SmartImportEditDialogComponent,
      SmartImportEditDialogData,
      Record<string, unknown> | undefined
    >(SmartImportEditDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      disableClose: true,
      data,
    });
    return firstValueFrom(ref.afterClosed());
  }

  private itemObjectSchema(): JsonSchemaObject {
    const root = this.session.schema.jsonSchema as JsonSchemaRoot;
    const properties = root.properties ?? {};
    const arraySchema = properties[this.session.arrayPath] as { items?: JsonSchemaObject };
    return (arraySchema?.items ?? { type: 'object', properties: {} }) as JsonSchemaObject;
  }

  private schemaForTreeLevel(levelKey: string): JsonSchemaObject {
    const root = this.session.schema.jsonSchema as JsonSchemaRoot;
    if (levelKey === this.treeConfig.path) {
      return this.itemObjectSchema();
    }
    // Walk: lots.items.properties.sousLots.items ...
    let current: JsonSchemaObject | null = this.itemObjectSchema();
    const queue = [...this.treeConfig.childrenPaths];
    for (const key of queue) {
      const prop = current?.properties?.[key] as { items?: JsonSchemaObject } | undefined;
      const items = prop?.items ?? null;
      if (key === levelKey && items) return items;
      if (items) current = items;
    }
    // Fallback: search properties of item schema
    const fromItem = this.itemObjectSchema().properties?.[levelKey] as
      | { items?: JsonSchemaObject }
      | undefined;
    if (fromItem?.items) return fromItem.items;
    // Postes may exist under sousLots
    const sousLots = this.itemObjectSchema().properties?.['sousLots'] as
      | { items?: JsonSchemaObject }
      | undefined;
    const postes = sousLots?.items?.properties?.['postes'] as
      | { items?: JsonSchemaObject }
      | undefined;
    if (levelKey === 'postes' && postes?.items) return postes.items;
    return { type: 'object', properties: {} };
  }

  private rowEditUiSchema(itemSchema: JsonSchemaObject): UiSchema {
    const columns = this.arrayConfig()?.columns ?? this.treeConfig.columns;
    return {
      importPolicy: this.session.schema.uiSchema.importPolicy,
      sections: [
        {
          title: '',
          columns: 2,
          fields: columns
            .filter((col) => itemSchema.properties?.[col.path.split('.')[0]])
            .map((col) => ({ path: col.path, label: col.label })),
        },
      ],
      arrays: [],
    };
  }

  private nodeEditUiSchema(objectSchema: JsonSchemaObject): UiSchema {
    const preserve = new Set(this.treeConfig.childrenPaths);
    const fields = Object.entries(objectSchema.properties ?? {})
      .filter(([key, schema]) => {
        if (preserve.has(key)) return false;
        const t = schema.type;
        const primary = Array.isArray(t) ? t.find((x) => x !== 'null') : t;
        return primary !== 'array';
      })
      .map(([key, schema]) => ({
        path: key,
        label: (schema as { title?: string }).title ?? key,
      }));
    return {
      importPolicy: this.session.schema.uiSchema.importPolicy,
      sections: [{ title: '', columns: 2, fields }],
      arrays: [],
    };
  }
}
