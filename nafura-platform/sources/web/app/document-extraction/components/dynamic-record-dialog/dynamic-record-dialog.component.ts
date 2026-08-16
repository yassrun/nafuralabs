import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DocTypeDefinition } from '../../models/doc-type-definition.model';
import { ExtractionDraft, ExtractedRecord, ExtractionValidation, FieldIssue } from '../../models/extraction.model';
import { JsonSchemaArray } from '../../models/json-schema.model';
import { DocumentValidationService } from '../../services/document-validation.service';
import { JsonSchemaFormBuilder } from '../../utils/json-schema-form-builder';
import { DynamicArrayTableComponent } from '../dynamic-array-table/dynamic-array-table.component';
import { DynamicFormRendererComponent } from '../dynamic-form-renderer/dynamic-form-renderer.component';

export interface DynamicRecordDialogData {
  definition: DocTypeDefinition;
  lockedDocTypeVersion: number;
  mode: 'create' | 'edit';
  draft?: ExtractionDraft;
  record?: ExtractedRecord;
  /** False for the stateless review flow: validation returns data to the caller only. */
  persistOnValidate?: boolean;
  /** Server validation issues from the extraction response. */
  initialValidation?: ExtractionValidation;
}

export interface DynamicRecordDialogResult {
  record?: ExtractedRecord;
  dataJson: Record<string, unknown>;
}

@Component({
  selector: 'app-dynamic-record-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    DynamicArrayTableComponent,
    DynamicFormRendererComponent,
  ],
  templateUrl: './dynamic-record-dialog.component.html',
  styleUrl: './dynamic-record-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicRecordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DynamicRecordDialogComponent, DynamicRecordDialogResult | undefined>);
  // Exposed to template for conditional labels
  readonly data = inject<DynamicRecordDialogData>(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);
  private readonly validationService = inject(DocumentValidationService);
  private readonly translate = inject(TranslateService);

  readonly saving = signal(false);

  readonly definition = this.data.definition;
  readonly uiSchema = this.definition.uiSchema;

  readonly form = JsonSchemaFormBuilder.buildForm(this.definition.jsonSchema, { maxObjectDepth: 2 }).form;

  // Signal to track form value changes for reactive validation
  private readonly formValue = signal(this.form.value);
  
  // Computed validation state using DocumentValidationService
  readonly validationResult = computed(() => {
    const data = this.formValue();
    return this.validationService.validateDocument(data, this.definition.jsonSchema, this.uiSchema);
  });
  
  readonly canApply = computed(() => this.validationResult().isValid);

  readonly validationErrors = computed(() => {
    return this.validationResult().errors;
  });

  readonly arrayIssues = computed<FieldIssue[]>(() => {
    const liveErrors = this.validationResult().errors;
    const livePaths = new Set(liveErrors.map(error => error.field));
    const live = liveErrors.map(error => ({
      path: error.field,
      rowIndex: this.rowIndexFromPath(error.field),
      kind: (error.code === 'REQUIRED_FIELD_MISSING' ? 'MISSING_REQUIRED' : 'FORMAT_INVALID') as FieldIssue['kind'],
      message: error.message,
    }));
    const initial = (this.data.initialValidation?.issues ?? [])
      .filter(issue => livePaths.has(issue.path) || liveErrors.length === 0);
    const byPath = new Map<string, FieldIssue>();
    for (const issue of [...initial, ...live]) {
      byPath.set(`${issue.path}:${issue.rowIndex ?? ''}`, issue);
    }
    return [...byPath.values()];
  });
  
  readonly blReference = computed(() => {
    const value = this.formValue();
    const ref = value?.['blReference'] || 
                value?.['transferReference'] || 
                value?.['reference'] || 
                value?.['docReference'];
    return ref || '—';
  });
  
  readonly status = computed(() => {
    if (this.data.mode === 'create' && this.data.draft) {
      return 'Extracted';
    }
    if (this.data.record?.status === 'validated') {
      return 'Validated';
    }
    return 'Draft';
  });

  constructor() {
    // Disable the entire form while saving (avoid template [disabled] warnings).
    effect(() => {
      if (this.saving()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });

    // Track form value changes for reactive validation and header
    this.form.valueChanges.subscribe(() => {
      this.formValue.set(this.form.value);
    });

    // Mark fields with validation errors as touched to show errors immediately
    // This effect runs when validationErrors changes and marks all error fields as touched
    effect(() => {
      const errors = this.validationErrors();
      if (errors.length > 0) {
        // Use setTimeout to avoid "ExpressionChangedAfterItHasBeenCheckedError"
        setTimeout(() => {
          errors.forEach(error => {
            this.markFieldAsTouched(error.field);
          });
        }, 0);
      }
    });

    // Enforce locked schema version
    if (this.definition.version !== this.data.lockedDocTypeVersion) {
      this.snackBar.open(
        `Schema version mismatch. Session is locked to v${this.data.lockedDocTypeVersion}, but active definition is v${this.definition.version}.`,
        'Dismiss',
        { duration: 8000 }
      );
      this.dialogRef.close(undefined);
      return;
    }

    const initialData =
      this.data.mode === 'create'
        ? (this.data.draft?.dataJson ?? {})
        : (this.data.record?.dataJson ?? {});

    JsonSchemaFormBuilder.patchFormFromData({
      form: this.form,
      schema: this.definition.jsonSchema,
      dataJson: initialData,
    });
    
    // Initialize form value signal
    this.formValue.set(this.form.value);
  }

  title(): string {
    return this.definition.name;
  }

  arraySchemaAt(path: string): JsonSchemaArray | null {
    const s = JsonSchemaFormBuilder.getSchemaAtPath(this.definition.jsonSchema, path);
    const type = Array.isArray((s as any)?.type) ? (s as any).type[0] : (s as any)?.type;
    return type === 'array' ? (s as JsonSchemaArray) : null;
  }

  arrayFormArray(path: string) {
    const ctrl = this.form.get(path);
    return ctrl as any;
  }

  hasSection(sectionTitle: string): boolean {
    return this.uiSchema.sections?.some(s => s.title === sectionTitle) ?? false;
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  /**
   * Mark a field (including nested array fields) as touched to show validation errors.
   */
  private markFieldAsTouched(fieldPath: string): void {
    // Handle array fields like "items[0].uom"
    const arrayMatch = fieldPath.match(/^(.+)\[(\d+)\]\.(.+)$/);
    if (arrayMatch) {
      const [, arrayPath, indexStr, itemField] = arrayMatch;
      const index = parseInt(indexStr, 10);
      const arrayControl = this.form.get(arrayPath);
      if (arrayControl && arrayControl instanceof FormArray) {
        const itemControl = arrayControl.at(index);
        if (itemControl && itemControl instanceof FormGroup) {
          const fieldControl = itemControl.get(itemField);
          if (fieldControl) {
            fieldControl.markAsTouched({ onlySelf: true });
          }
        }
      }
    } else {
      // Regular field path
      const control = this.form.get(fieldPath);
      if (control) {
        control.markAsTouched({ onlySelf: true });
      }
    }
  }

  applyEdits(): void {
    if (this.saving()) return;

    if (!this.canApply()) {
      const errorCount = this.validationResult().errorCount;
      const message = errorCount > 0
        ? this.translate.instant('docExtractor.workflow.validation.errorsCount', { count: errorCount })
        : this.translate.instant('docExtractor.workflow.validation.fixErrorsBeforeValidation');
      this.snackBar.open(message, this.translate.instant('docExtractor.messages.dismiss'), { duration: 4000 });
      return;
    }

    const ok = JsonSchemaFormBuilder.markAllAndValidate(this.form);
    if (!ok) {
      this.snackBar.open(
        this.translate.instant('docExtractor.workflow.validation.fixErrorsBeforeValidation'),
        this.translate.instant('docExtractor.messages.dismiss'),
        { duration: 4000 }
      );
      return;
    }

    const dataJson = JsonSchemaFormBuilder.serializeToDataJson({
      form: this.form,
      schema: this.definition.jsonSchema,
    });
    this.dialogRef.close({ dataJson });
  }

  issuesForArray(arrayPath: string): FieldIssue[] {
    return this.arrayIssues().filter(issue =>
      issue.path === arrayPath
      || issue.path.startsWith(`${arrayPath}[`)
      || issue.path.startsWith(`${arrayPath}.`)
    );
  }

  private rowIndexFromPath(fieldPath: string): number | null {
    const match = fieldPath.match(/\[(\d+)\]/);
    return match ? Number(match[1]) : null;
  }
}


