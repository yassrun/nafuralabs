import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';
import { DynamicArrayTableComponent } from '../../doc-extractor/components/dynamic-array-table/dynamic-array-table.component';
import { DynamicFormRendererComponent } from '../../doc-extractor/components/dynamic-form-renderer/dynamic-form-renderer.component';
import type { JsonSchemaArray, JsonSchemaObject } from '../../doc-extractor/models/json-schema.model';
import type { UiArrayConfig, UiSchema } from '../../doc-extractor/models/ui-schema.model';
import { JsonSchemaFormBuilder, type AnyFormGroup } from '../../doc-extractor/utils/json-schema-form-builder';

export interface SmartImportEditDialogData {
  title: string;
  objectSchema: JsonSchemaObject;
  uiSchema: UiSchema;
  data: Record<string, unknown>;
  /** Array property names to preserve (not edited) and strip from serialization merge. */
  preserveArrayKeys?: string[];
}

@Component({
  selector: 'nf-smart-import-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    TranslateModule,
    ButtonComponent,
    DynamicFormRendererComponent,
    DynamicArrayTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="edit">
      <header>
        <h2>{{ data.title }}</h2>
        <p>{{ 'platform.smartImport.edit.hint' | translate }}</p>
      </header>

      @if (hasSections) {
        <app-dynamic-form-renderer
          [form]="form"
          [jsonSchema]="data.objectSchema"
          [uiSchema]="formUiSchema" />
      }

      @for (array of editableArrays; track array.path) {
        <app-dynamic-array-table
          [title]="array.title"
          [formArray]="arrayForm(array.path)"
          [arraySchema]="arraySchema(array.path)"
          [columns]="array.columns"
          [lockStructure]="false" />
      }

      <footer>
        <nf-button variant="secondary" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </nf-button>
        <nf-button variant="primary" (clicked)="save()">
          {{ 'platform.smartImport.edit.save' | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .edit {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      width: min(720px, 94vw);
      max-height: min(85vh, 900px);
      overflow: auto;
    }
    header h2, header p { margin: 0; }
    header p { color: var(--nf-color-text-secondary); font-size: .875rem; }
    footer { display: flex; justify-content: flex-end; gap: .5rem; padding-top: .5rem; }
  `],
})
export class SmartImportEditDialogComponent {
  readonly data = inject<SmartImportEditDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<SmartImportEditDialogComponent, Record<string, unknown> | undefined>,
  );

  readonly form: AnyFormGroup;
  readonly formUiSchema: UiSchema;
  readonly editableArrays: UiArrayConfig[];
  readonly hasSections: boolean;

  constructor() {
    const preserve = new Set(this.data.preserveArrayKeys ?? []);
    this.form = JsonSchemaFormBuilder.buildGroupForObjectSchema(this.data.objectSchema, {
      maxObjectDepth: 2,
    });
    JsonSchemaFormBuilder.patchFormFromData({
      form: this.form,
      schema: this.data.objectSchema,
      dataJson: this.data.data,
    });

    const sections =
      this.data.uiSchema.sections?.length
        ? this.data.uiSchema.sections
        : [
            {
              title: '',
              columns: 2,
              fields: Object.entries(this.data.objectSchema.properties ?? {})
                .filter(([key, schema]) => {
                  if (preserve.has(key)) return false;
                  const t = schema.type;
                  const primary = Array.isArray(t) ? t.find((x) => x !== 'null') : t;
                  return primary !== 'array';
                })
                .map(([key, schema]) => ({
                  path: key,
                  label: (schema as { title?: string }).title ?? key,
                })),
            },
          ];

    this.formUiSchema = {
      ...this.data.uiSchema,
      sections,
      arrays: [],
    };
    this.hasSections = sections.some((s) => s.fields.length > 0);

    this.editableArrays = (this.data.uiSchema.arrays ?? []).filter(
      (array) => !preserve.has(array.path),
    );
  }

  arrayForm(path: string): FormArray<AbstractControl> {
    const control = this.form.get(path);
    if (control instanceof FormArray) return control as FormArray<AbstractControl>;
    return new FormArray<AbstractControl>([]);
  }

  arraySchema(path: string): JsonSchemaArray {
    const prop = this.data.objectSchema.properties?.[path];
    return (prop ?? { type: 'array', items: { type: 'object', properties: {} } }) as JsonSchemaArray;
  }

  save(): void {
    const serialized = JsonSchemaFormBuilder.serializeToDataJson({
      form: this.form,
      schema: this.data.objectSchema,
    });
    const preserve = new Set(this.data.preserveArrayKeys ?? []);
    const result: Record<string, unknown> = { ...this.data.data };
    for (const [key, value] of Object.entries(serialized)) {
      if (preserve.has(key)) continue;
      result[key] = value;
    }
    // Keep child arrays from original when preserved
    for (const key of preserve) {
      if (key in this.data.data) result[key] = this.data.data[key];
    }
    this.ref.close(result);
  }

  cancel(): void {
    this.ref.close(undefined);
  }
}
