import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { JsonSchema } from '../../models/json-schema.model';
import { UiField, UiSchema, UiSection } from '../../models/ui-schema.model';
import { AnyFormGroup, JsonSchemaFormBuilder } from '../../utils/json-schema-form-builder';

@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './dynamic-form-renderer.component.html',
  styleUrl: './dynamic-form-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormRendererComponent {
  @Input({ required: true }) form!: AnyFormGroup;
  @Input({ required: true }) jsonSchema!: any; // JsonSchemaRoot (kept as any to avoid circular generics in templates)
  @Input({ required: true }) uiSchema!: UiSchema;
  @Input() readonly = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] || changes['uiSchema'] || changes['jsonSchema'] || changes['form']) {
      this.applyDisabledStateFromSchema();
    }
  }

  sectionColumns(section: UiSection): number {
    const cols = section.columns ?? 2;
    return Math.min(Math.max(cols, 1), 4);
  }

  schemaFor(field: UiField): JsonSchema | null {
    return JsonSchemaFormBuilder.getSchemaAtPath(this.jsonSchema, field.path);
  }

  isEnum(schema: JsonSchema | null): schema is JsonSchema {
    return !!schema && Array.isArray((schema as any).enum) && (schema as any).enum.length > 0;
  }

  isBoolean(schema: JsonSchema | null): boolean {
    const t = (schema as any)?.type;
    return t === 'boolean' || (Array.isArray(t) && t[0] === 'boolean');
  }

  isNumber(schema: JsonSchema | null): boolean {
    const t = (schema as any)?.type;
    return t === 'number' || t === 'integer' || (Array.isArray(t) && (t[0] === 'number' || t[0] === 'integer'));
  }

  isDate(schema: JsonSchema | null): boolean {
    return (schema as any)?.type === 'string' && (schema as any)?.format === 'date';
  }

  enumOptions(schema: JsonSchema | null): Array<string | number | boolean> {
    const e = (schema as any)?.enum;
    return Array.isArray(e) ? (e as Array<any>) : [];
  }

  schemaReadOnly(schema: JsonSchema | null): boolean {
    return !!schema && !!(schema as any).readOnly;
  }

  private applyDisabledStateFromSchema(): void {
    if (!this.form || !this.uiSchema || !this.jsonSchema) return;

    for (const section of this.uiSchema.sections ?? []) {
      for (const field of section.fields ?? []) {
        const schema = this.schemaFor(field);
        const ctrl = this.form.get(field.path);
        if (!ctrl) continue;

        const shouldDisable = this.readonly || !!field.readonly || this.schemaReadOnly(schema);
        if (shouldDisable && ctrl.enabled) ctrl.disable({ emitEvent: false });
        if (!shouldDisable && ctrl.disabled) ctrl.enable({ emitEvent: false });
      }
    }
  }

  fieldError(field: UiField): string | null {
    const control = this.form.get(field.path);
    if (!control || !control.errors) return null;
    
    // Show errors even if not touched when form is invalid (for better UX)
    // This helps users see validation errors immediately
    if (!control.touched && this.form.valid) return null;

    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('number')) return 'Please enter a valid number.';
    if (control.hasError('integer')) return 'Please enter a valid integer.';
    if (control.hasError('date')) return 'Please enter a valid date (YYYY-MM-DD).';
    if (control.hasError('typeMismatch')) return 'Invalid value type.';
    if (control.hasError('min')) return `Must be ≥ ${control.getError('min')?.min}.`;
    if (control.hasError('max')) return `Must be ≤ ${control.getError('max')?.max}.`;
    if (control.hasError('minlength')) return `Must be at least ${control.getError('minlength')?.requiredLength} characters.`;
    if (control.hasError('maxlength')) return `Must be at most ${control.getError('maxlength')?.requiredLength} characters.`;
    return 'Invalid value.';
  }
  
  hasFieldError(field: UiField): boolean {
    return this.fieldError(field) !== null;
  }
}

