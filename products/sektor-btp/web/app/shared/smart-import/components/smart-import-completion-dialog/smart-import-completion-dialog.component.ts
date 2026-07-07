import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy/components';
import { DynamicArrayTableComponent } from '@platform/features/documents/doc-extractor/components/dynamic-array-table/dynamic-array-table.component';
import type { JsonSchemaArray, JsonSchemaObject } from '@platform/features/documents/doc-extractor/models/json-schema.model';
import { JsonSchemaFormBuilder } from '@platform/features/documents/doc-extractor/utils/json-schema-form-builder';

import type {
  SmartImportCompletionDialogData,
  SmartImportCompletionDialogResult,
} from '../../models/smart-import.model';
import { requiredFieldsFromArraySchema, validateRowRequired } from '../../models/smart-import.model';

@Component({
  selector: 'erp-smart-import-completion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    TranslateModule,
    ButtonComponent,
    DynamicArrayTableComponent,
  ],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ 'achats.smartImport.completionTitle' | translate }}</h2>
        <p>{{ 'achats.smartImport.completionHint' | translate:{ count: data.rows.length } }}</p>
      </header>

      @if (arrayConfig(); as cfg) {
        <app-dynamic-array-table
          [title]="cfg.title"
          [formArray]="formArray"
          [arraySchema]="arraySchema()"
          [columns]="cfg.columns"
        />
      }

      <footer>
        <nf-button variant="secondary" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </nf-button>
        <nf-button variant="primary" (clicked)="confirm()" [disabled]="!canConfirm()">
          {{ 'achats.smartImport.confirmImport' | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    header h2 { margin: 0 0 0.25rem; font-size: 1.125rem; }
    header p { margin: 0; color: var(--nf-text-muted, #64748b); font-size: 0.875rem; }
    footer { display: flex; justify-content: flex-end; gap: 0.5rem; }
  `],
})
export class SmartImportCompletionDialogComponent {
  readonly data = inject<SmartImportCompletionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SmartImportCompletionDialogComponent, SmartImportCompletionDialogResult>);

  readonly formArray = new FormArray<ReturnType<typeof JsonSchemaFormBuilder.buildGroupForObjectSchema>>([]);
  readonly requiredFields: string[];

  constructor() {
    this.requiredFields = requiredFieldsFromArraySchema(this.data.definition, this.data.arrayPath);
    const itemSchema = this.itemObjectSchema();

    for (const entry of this.data.rows) {
      const rowGroup = JsonSchemaFormBuilder.buildGroupForObjectSchema(itemSchema);
      JsonSchemaFormBuilder.patchFormFromData({
        form: rowGroup,
        schema: itemSchema,
        dataJson: entry.row,
      });
      this.formArray.push(rowGroup);
    }
  }

  arrayConfig() {
    return this.data.definition.uiSchema.arrays?.find((a) => a.path === this.data.arrayPath);
  }

  arraySchema(): JsonSchemaArray {
    const schema = this.data.definition.jsonSchema as unknown as Record<string, unknown>;
    const properties = schema['properties'] as Record<string, unknown>;
    return properties[this.data.arrayPath] as JsonSchemaArray;
  }

  itemObjectSchema(): JsonSchemaObject {
    return this.arraySchema().items as JsonSchemaObject;
  }

  canConfirm(): boolean {
    const rows = this.serializeRows();
    return rows.every((row, idx) => validateRowRequired(row, this.requiredFields, idx).valid);
  }

  confirm(): void {
    if (!this.canConfirm()) {
      return;
    }
    this.dialogRef.close({ rows: this.serializeRows() });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private serializeRows(): Record<string, unknown>[] {
    const itemSchema = this.itemObjectSchema();
    const rows: Record<string, unknown>[] = [];
    for (const ctrl of this.formArray.controls) {
      rows.push(
        JsonSchemaFormBuilder.serializeToDataJson({
          form: ctrl as ReturnType<typeof JsonSchemaFormBuilder.buildGroupForObjectSchema>,
          schema: itemSchema,
        }),
      );
    }
    return rows;
  }
}

export type { SmartImportCompletionDialogData, SmartImportCompletionDialogResult };
