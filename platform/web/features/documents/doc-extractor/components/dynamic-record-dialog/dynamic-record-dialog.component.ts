import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { DocumentWorkflowStatus } from '../../models/document-workflow.model';
import { ExtractionDraft, ExtractedRecord } from '../../models/extraction.model';
import { JsonSchemaArray } from '../../models/json-schema.model';
import { DocumentValidationService } from '../../services/document-validation.service';
import { ExtractionService } from '../../services/extraction.service';
import { JsonSchemaFormBuilder } from '../../utils/json-schema-form-builder';
import { DynamicArrayTableComponent } from '../dynamic-array-table/dynamic-array-table.component';
import { DynamicFormRendererComponent } from '../dynamic-form-renderer/dynamic-form-renderer.component';
import { TenantContextService } from '../../../../../core/tenant/tenant.context';

export interface DynamicRecordDialogData {
  definition: DocTypeDefinition;
  lockedDocTypeVersion: number;
  mode: 'create' | 'edit';
  draft?: ExtractionDraft;
  record?: ExtractedRecord;
}

export interface DynamicRecordDialogResult {
  record: ExtractedRecord;
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
  private readonly extractionService = inject(ExtractionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantContext = inject(TenantContextService);
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
  
  readonly canValidate = computed(() => {
    const result = this.validationResult();
    const workflowState = this.validationService.buildWorkflowState(
      result,
      DocumentWorkflowStatus.DRAFT
    );
    return this.validationService.canValidate(workflowState);
  });
  
  // Get validation errors for display
  readonly validationErrors = computed(() => {
    return this.validationResult().errors;
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

  validateAndSave(): void {
    if (this.saving()) return;

    // Check validation state using DocumentValidationService
    if (!this.canValidate()) {
      const errorCount = this.validationResult().errorCount;
      const message = errorCount > 0
        ? this.translate.instant('docExtractor.workflow.validation.errorsCount', { count: errorCount })
        : this.translate.instant('docExtractor.workflow.validation.fixErrorsBeforeValidation');
      this.snackBar.open(message, this.translate.instant('docExtractor.messages.dismiss'), { duration: 4000 });
      return;
    }

    // Also check form validity as a secondary check
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

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      this.snackBar.open(
        this.translate.instant('docExtractor.messages.tenantIdRequired'),
        this.translate.instant('docExtractor.messages.dismiss'),
        { duration: 5000 }
      );
      return;
    }

    const request =
      this.data.mode === 'create'
        ? { 
            draftId: this.data.draft!.draftId, 
            dataJson,
            domainKey: this.definition.domainKey,
            docTypeKey: this.definition.docTypeKey,
            docTypeVersion: this.data.lockedDocTypeVersion,
            tenantId
          }
        : { 
            recordId: this.data.record!.recordId, 
            dataJson,
            domainKey: this.definition.domainKey,
            docTypeKey: this.definition.docTypeKey,
            docTypeVersion: this.data.lockedDocTypeVersion,
            tenantId
          };

    this.saving.set(true);
    this.extractionService.validate(request).subscribe({
      next: (record) => {
        this.saving.set(false);
        this.dialogRef.close({ record });
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const msg = this.humanizeHttpError(err);
        this.snackBar.open(msg, this.translate.instant('docExtractor.messages.dismiss'), { duration: 8000 });
      },
    });
  }

  private humanizeHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMsg =
        (typeof err.error === 'string' && err.error) ||
        (err.error && typeof err.error === 'object' && 'message' in err.error ? String((err.error as any).message) : '');
      return serverMsg || this.translate.instant('docExtractor.messages.requestFailed', { status: err.status });
    }
    return this.translate.instant('docExtractor.messages.unexpectedError');
  }
}


