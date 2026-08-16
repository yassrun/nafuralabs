/**
 * FieldEditor Component
 * 
 * Allows adding, editing, and removing field definitions.
 * Supports nested objects and array item fields.
 */

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { BuilderStateStore } from '../../builder-state.store';
import { BuilderField, FieldType, createDefaultField } from '../../../models/builder-state.model';
import { ConfirmDialogService } from '@lib/anatomy';

@Component({
  selector: 'app-field-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="field-editor">
      <div class="header">
        <h3>Field Definitions</h3>
        @if (!readonly) {
          <button mat-stroked-button color="primary" (click)="addField()">
            <mat-icon>add</mat-icon>
            Add Field
          </button>
        }
      </div>

      <mat-accordion class="fields-list" multi>
        @for (field of fields(); track field.key; let i = $index) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="field-icon">{{ getFieldIcon(field.type) }}</mat-icon>
                <span class="field-key">{{ field.key }}</span>
                @if (field.required) {
                  <mat-chip class="required-chip">Required</mat-chip>
                }
              </mat-panel-title>
              <mat-panel-description>
                {{ field.label }} ({{ field.type }})
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="field-form">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Key</mat-label>
                  <input matInput 
                    [value]="field.key" 
                    (change)="updateFieldKey(field, $any($event.target).value)"
                    [readonly]="readonly"
                    placeholder="fieldKey">
                  <mat-hint>Unique identifier (alphanumeric + underscore)</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Label</mat-label>
                  <input matInput 
                    [value]="field.label" 
                    (change)="updateField(field.key, { label: $any($event.target).value })"
                    [readonly]="readonly"
                    placeholder="Display Label">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Type</mat-label>
                  <mat-select 
                    [value]="field.type" 
                    (selectionChange)="updateField(field.key, { type: $event.value })"
                    [disabled]="readonly">
                    @for (type of fieldTypes; track type) {
                      <mat-option [value]="type">{{ type }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-checkbox 
                  [checked]="field.required"
                  (change)="updateField(field.key, { required: $event.checked })"
                  [disabled]="readonly">
                  Required
                </mat-checkbox>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput 
                  [value]="field.description || ''" 
                  (change)="updateField(field.key, { description: $any($event.target).value })"
                  [readonly]="readonly"
                  rows="2"
                  placeholder="Optional description/help text">
                </textarea>
              </mat-form-field>

              <!-- Nested fields for object type -->
              @if (field.type === 'object') {
                <div class="nested-fields">
                  <h4>Nested Fields</h4>
                  @for (nested of field.nestedFields || []; track nested.key) {
                    <div class="nested-field-item">
                      <span>{{ nested.key }}: {{ nested.type }}</span>
                      @if (!readonly) {
                        <button mat-icon-button color="warn" 
                          (click)="removeNestedField(field.key, nested.key)"
                          matTooltip="Remove nested field">
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                  }
                  @if (!readonly) {
                    <button mat-stroked-button (click)="addNestedField(field.key)">
                      <mat-icon>add</mat-icon>
                      Add Nested Field
                    </button>
                  }
                </div>
              }

              <!-- Array item fields for array type -->
              @if (field.type === 'array') {
                <div class="nested-fields">
                  <h4>Array Item Fields</h4>
                  @for (item of field.arrayItemFields || []; track item.key) {
                    <div class="nested-field-item">
                      <span>{{ item.key }}: {{ item.type }}</span>
                      @if (!readonly) {
                        <button mat-icon-button color="warn" 
                          (click)="removeArrayItemField(field.key, item.key)"
                          matTooltip="Remove item field">
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                  }
                  @if (!readonly) {
                    <button mat-stroked-button (click)="addArrayItemField(field.key)">
                      <mat-icon>add</mat-icon>
                      Add Item Field
                    </button>
                  }
                </div>
              }

              @if (!readonly) {
                <div class="field-actions">
                  <button mat-button color="warn" (click)="removeField(field.key)">
                    <mat-icon>delete</mat-icon>
                    Remove Field
                  </button>
                </div>
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>

      @if (fields().length === 0) {
        <div class="empty-state">
          <mat-icon>widgets</mat-icon>
          <p>No fields defined yet.</p>
          @if (!readonly) {
            <button mat-stroked-button color="primary" (click)="addField()">
              <mat-icon>add</mat-icon>
              Add First Field
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .field-editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(0, 0, 0, 0.5);
    }

    .field-key {
      font-family: monospace;
      font-weight: 600;
    }

    .required-chip {
      margin-left: 8px;
      font-size: 10px;
      min-height: 20px;
      padding: 0 8px;
    }

    .field-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 12px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: center;

      mat-form-field {
        flex: 1;
      }
    }

    .full-width {
      width: 100%;
    }

    .nested-fields {
      padding: 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .nested-field-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.1);

      span {
        font-family: monospace;
        font-size: 13px;
      }
    }

    .field-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px;
      color: rgba(0, 0, 0, 0.45);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: rgba(0, 0, 0, 0.25);
      }
    }
  `],
})
export class FieldEditorComponent {
  @Input() readonly = false;

  private readonly store = inject(BuilderStateStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly fields = this.store.fields;

  readonly fieldTypes: FieldType[] = [
    'string', 'number', 'integer', 'boolean', 'date', 'enum', 'object', 'array'
  ];

  getFieldIcon(type: FieldType): string {
    const icons: Record<FieldType, string> = {
      string: 'text_fields',
      number: 'numbers',
      integer: 'tag',
      boolean: 'toggle_on',
      date: 'calendar_today',
      enum: 'list',
      object: 'data_object',
      array: 'view_list',
    };
    return icons[type] || 'help';
  }

  addField(): void {
    const key = this.generateUniqueKey('field');
    const field = createDefaultField(key, 'string');
    this.store.addField(field);
  }

  updateField(key: string, updates: Partial<BuilderField>): void {
    this.store.updateField(key, updates);
  }

  updateFieldKey(field: BuilderField, newKey: string): void {
    // Key change requires special handling (updates references)
    if (newKey && newKey !== field.key) {
      this.store.updateField(field.key, { key: newKey });
    }
  }

  async removeField(key: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove field',
      message: `Remove field "${key}"?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.store.removeField(key);
  }

  addNestedField(parentKey: string): void {
    const key = this.generateUniqueKey('nested');
    const field = createDefaultField(key, 'string');
    this.store.addNestedField(parentKey, field);
  }

  removeNestedField(parentKey: string, nestedKey: string): void {
    // TODO: Implement nested field removal in store
    console.log('Remove nested field:', parentKey, nestedKey);
  }

  addArrayItemField(arrayKey: string): void {
    const key = this.generateUniqueKey('item');
    const field = createDefaultField(key, 'string');
    this.store.addArrayItemField(arrayKey, field);
  }

  removeArrayItemField(arrayKey: string, itemKey: string): void {
    // TODO: Implement array item field removal in store
    console.log('Remove array item field:', arrayKey, itemKey);
  }

  private generateUniqueKey(prefix: string): string {
    const existing = new Set(this.fields().map(f => f.key));
    let i = 1;
    while (existing.has(`${prefix}${i}`)) {
      i++;
    }
    return `${prefix}${i}`;
  }
}
