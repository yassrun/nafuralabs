import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { JsonSchema, JsonSchemaArray, JsonSchemaObject } from '../../models/json-schema.model';
import { UiArrayColumn } from '../../models/ui-schema.model';
import { AnyFormGroup, JsonSchemaFormBuilder } from '../../utils/json-schema-form-builder';

@Component({
  selector: 'app-dynamic-array-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './dynamic-array-table.component.html',
  styleUrl: './dynamic-array-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicArrayTableComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) formArray!: FormArray<AbstractControl>;
  @Input({ required: true }) arraySchema!: JsonSchemaArray;
  @Input({ required: true }) columns!: UiArrayColumn[];
  @Input() readonly = false;

  @ViewChild(MatTable) private readonly table?: MatTable<AbstractControl>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] && this.formArray) {
      if (this.readonly) this.formArray.disable({ emitEvent: false });
      else this.formArray.enable({ emitEvent: false });
    }
  }

  get displayedColumns(): string[] {
    return [...this.columns.map(c => c.path), 'actions'];
  }

  get rows(): AbstractControl[] {
    return this.formArray?.controls ?? [];
  }

  itemSchema(): JsonSchemaObject | null {
    const items = this.arraySchema.items;
    if (!items) return null;
    const t = (items as any)?.type;
    const primary = Array.isArray(t) ? t[0] : t;
    return primary === 'object' ? (items as JsonSchemaObject) : null;
  }

  schemaFor(colPath: string): JsonSchema | null {
    const item = this.itemSchema();
    if (!item) return null;
    return JsonSchemaFormBuilder.getSchemaAtPath(item as any, colPath);
  }

  isEnum(schema: JsonSchema | null): boolean {
    return !!schema && Array.isArray((schema as any).enum) && (schema as any).enum.length > 0;
  }

  enumOptions(schema: JsonSchema | null): unknown[] {
    return Array.isArray((schema as any)?.enum) ? ((schema as any).enum as unknown[]) : [];
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

  rowGroup(row: AbstractControl): AnyFormGroup {
    return row as FormGroup as AnyFormGroup;
  }

  addRow(): void {
    const item = this.itemSchema();
    if (!item) return;
    if (this.readonly) return;

    const row = JsonSchemaFormBuilder.buildGroupForObjectSchema(item);
    this.formArray.push(row);
    this.table?.renderRows();
  }

  removeRow(index: number): void {
    if (this.readonly) return;
    this.formArray.removeAt(index);
    this.table?.renderRows();
  }

  hasFieldError(control: AbstractControl | null | undefined): boolean {
    if (!control || !control.errors) return false;
    // Always show errors if control has errors (touched or not)
    // This ensures errors are visible immediately when validation detects them
    return true;
  }

  getFieldError(control: AbstractControl | null | undefined): string {
    if (!control || !control.errors) return '';
    
    if (control.hasError('required')) return 'Required';
    if (control.hasError('date')) return 'Invalid date';
    if (control.hasError('number') || control.hasError('integer')) return 'Invalid number';
    if (control.hasError('min')) return `Must be ≥ ${control.getError('min')?.min}`;
    if (control.hasError('max')) return `Must be ≤ ${control.getError('max')?.max}`;
    if (control.hasError('minlength')) return `Must be at least ${control.getError('minlength')?.requiredLength} characters`;
    if (control.hasError('maxlength')) return `Must be at most ${control.getError('maxlength')?.requiredLength} characters`;
    return 'Invalid value';
  }
}

