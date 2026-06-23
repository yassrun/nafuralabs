/**
 * LayoutEditor Component
 * 
 * Allows configuring form sections, grid columns, and array tables.
 * Uses drag-and-drop for reordering (simplified version).
 */

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';

import { BuilderStateStore } from '../../builder-state.store';
import { BuilderSection, BuilderGridColumn, createDefaultSection } from '../../../models/builder-state.model';
import { ConfirmDialogService } from '@lib/anatomy';

@Component({
  selector: 'app-layout-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatTooltipModule,
    MatChipsModule,
    MatListModule,
  ],
  template: `
    <div class="layout-editor">
      <!-- Form Sections -->
      <section class="layout-section">
        <div class="section-header">
          <h3>Form Sections</h3>
          @if (!readonly) {
            <button mat-stroked-button color="primary" (click)="addSection()">
              <mat-icon>add</mat-icon>
              Add Section
            </button>
          }
        </div>

        <mat-accordion class="sections-list" multi>
          @for (section of sections(); track section.id; let i = $index) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>view_module</mat-icon>
                  {{ section.title }}
                </mat-panel-title>
                <mat-panel-description>
                  {{ section.controls.length }} fields, {{ section.columns || 2 }} columns
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="section-form">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Section Title</mat-label>
                    <input matInput 
                      [value]="section.title" 
                      (change)="updateSection(section.id, { title: $any($event.target).value })"
                      [readonly]="readonly">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Columns</mat-label>
                    <mat-select 
                      [value]="section.columns || 2" 
                      (selectionChange)="updateSection(section.id, { columns: $event.value })"
                      [disabled]="readonly">
                      <mat-option [value]="1">1 Column</mat-option>
                      <mat-option [value]="2">2 Columns</mat-option>
                      <mat-option [value]="3">3 Columns</mat-option>
                      <mat-option [value]="4">4 Columns</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="controls-list">
                  <h4>Fields in Section</h4>
                  @for (control of section.controls; track control.fieldPath) {
                    <div class="control-item">
                      <span class="control-path">{{ control.fieldPath }}</span>
                      @if (control.label) {
                        <span class="control-label">({{ control.label }})</span>
                      }
                      @if (!readonly) {
                        <button mat-icon-button color="warn" 
                          (click)="removeControl(section.id, control.fieldPath)"
                          matTooltip="Remove from section">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </div>
                  }

                  @if (!readonly) {
                    <mat-form-field appearance="outline" class="add-control">
                      <mat-label>Add Field</mat-label>
                      <mat-select (selectionChange)="addControl(section.id, $event.value); $event.source.value = ''">
                        @for (path of availableFieldPaths; track path) {
                          <mat-option [value]="path">{{ path }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                </div>

                @if (!readonly) {
                  <div class="section-actions">
                    <button mat-button color="warn" (click)="removeSection(section.id)">
                      <mat-icon>delete</mat-icon>
                      Remove Section
                    </button>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        @if (sections().length === 0) {
          <div class="empty-state">
            <p>No form sections defined.</p>
            @if (!readonly) {
              <button mat-stroked-button color="primary" (click)="addSection()">
                Add First Section
              </button>
            }
          </div>
        }
      </section>

      <!-- Grid Columns -->
      <section class="layout-section">
        <div class="section-header">
          <h3>Grid Columns</h3>
        </div>

        <div class="grid-columns-list">
          @for (col of gridColumns(); track col.fieldPath) {
            <div class="column-item">
              <mat-icon>view_column</mat-icon>
              <span class="column-path">{{ col.fieldPath }}</span>
              @if (col.label) {
                <span class="column-label">"{{ col.label }}"</span>
              }
              @if (!readonly) {
                <button mat-icon-button color="warn" 
                  (click)="removeGridColumn(col.fieldPath)"
                  matTooltip="Remove column">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }

          @if (!readonly) {
            <mat-form-field appearance="outline" class="add-column">
              <mat-label>Add Column</mat-label>
              <mat-select (selectionChange)="addGridColumn($event.value); $event.source.value = ''">
                @for (path of availableFieldPaths; track path) {
                  <mat-option [value]="path">{{ path }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>
      </section>

      <!-- Array Tables -->
      <section class="layout-section">
        <div class="section-header">
          <h3>Array Tables</h3>
        </div>

        @for (arr of arrays(); track arr.path) {
          <div class="array-config">
            <div class="array-header">
              <mat-icon>table_chart</mat-icon>
              <span class="array-path">{{ arr.path }}</span>
              <span class="array-title">"{{ arr.title }}"</span>
            </div>
            <div class="array-columns">
              @for (col of arr.columns; track col.fieldPath) {
                <mat-chip>{{ col.fieldPath }}</mat-chip>
              }
            </div>
          </div>
        }

        @if (arrays().length === 0) {
          <div class="empty-state small">
            <p>No array tables. Array tables are auto-created when you add array fields.</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .layout-editor {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .layout-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .sections-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-expansion-panel-header mat-icon {
      margin-right: 8px;
      color: rgba(0, 0, 0, 0.5);
    }

    .section-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 12px;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .controls-list {
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

    .control-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.1);

      .control-path {
        font-family: monospace;
        font-size: 13px;
        font-weight: 500;
      }

      .control-label {
        color: rgba(0, 0, 0, 0.5);
        font-size: 12px;
      }

      button {
        margin-left: auto;
      }
    }

    .add-control, .add-column {
      margin-top: 8px;
    }

    .section-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .grid-columns-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .column-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.1);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: rgba(0, 0, 0, 0.4);
      }

      .column-path {
        font-family: monospace;
        font-size: 13px;
      }

      .column-label {
        color: rgba(0, 0, 0, 0.5);
        font-size: 12px;
      }
    }

    .array-config {
      padding: 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .array-header {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        color: rgba(0, 0, 0, 0.5);
      }

      .array-path {
        font-family: monospace;
        font-weight: 500;
      }

      .array-title {
        color: rgba(0, 0, 0, 0.5);
      }
    }

    .array-columns {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      color: rgba(0, 0, 0, 0.45);
      text-align: center;

      &.small {
        padding: 16px;
      }
    }
  `],
})
export class LayoutEditorComponent {
  @Input() readonly = false;

  private readonly store = inject(BuilderStateStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  
  readonly fields = this.store.fields;
  readonly sections = this.store.sections;
  readonly gridColumns = this.store.gridColumns;
  readonly arrays = this.store.arrays;

  get availableFieldPaths(): string[] {
    return this.collectFieldPaths(this.fields(), '');
  }

  addSection(): void {
    const id = `section-${Date.now()}`;
    const section = createDefaultSection(id, `Section ${this.sections().length + 1}`);
    this.store.addSection(section);
  }

  updateSection(id: string, updates: Partial<BuilderSection>): void {
    this.store.updateSection(id, updates);
  }

  async removeSection(id: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove section',
      message: 'Remove this section?',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.store.removeSection(id);
  }

  addControl(sectionId: string, fieldPath: string): void {
    if (fieldPath) {
      this.store.addControl(sectionId, fieldPath);
    }
  }

  removeControl(sectionId: string, fieldPath: string): void {
    this.store.removeControl(sectionId, fieldPath);
  }

  addGridColumn(fieldPath: string): void {
    if (fieldPath) {
      this.store.addGridColumn({ fieldPath });
    }
  }

  removeGridColumn(fieldPath: string): void {
    this.store.removeGridColumn(fieldPath);
  }

  private collectFieldPaths(fields: any[], prefix: string): string[] {
    const paths: string[] = [];
    for (const field of fields) {
      const path = prefix ? `${prefix}.${field.key}` : field.key;
      paths.push(path);

      if (field.type === 'object' && field.nestedFields) {
        paths.push(...this.collectFieldPaths(field.nestedFields, path));
      }
    }
    return paths;
  }
}
