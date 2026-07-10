/**
 * Dialog to select a workflow template when multiple exist for "Submit for Approval".
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import type { WorkflowTemplateDto } from '../services/workflow-api.service';

export interface WorkflowTemplateSelectDialogData {
  templates: WorkflowTemplateDto[];
  titleKey?: string;
  submitLabelKey?: string;
}

@Component({
  selector: 'nf-workflow-template-select-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ (data.titleKey || 'workflow.submit.selectTemplateTitle') | translate }}</h2>
    <mat-dialog-content>
      <p class="nf-workflow-template-select__hint">{{ 'workflow.submit.selectTemplateHint' | translate }}</p>
      <ul class="nf-workflow-template-select__list">
        @for (t of data.templates; track t.id) {
          <li>
            <button type="button" class="nf-workflow-template-select__item" (click)="select(t)">
              <span class="nf-workflow-template-select__name">{{ t.name }}</span>
              @if (t.description) {
                <span class="nf-workflow-template-select__desc">{{ t.description }}</span>
              }
            </button>
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">{{ 'common.actions.cancel' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .nf-workflow-template-select__hint { margin: 0 0 12px; color: var(--nf-text-muted, #6b7280); font-size: 0.875rem; }
    .nf-workflow-template-select__list { list-style: none; margin: 0; padding: 0; }
    .nf-workflow-template-select__item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      margin-bottom: 4px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 8px;
      background: var(--nf-surface-card, #fff);
      cursor: pointer;
      font: inherit;
    }
    .nf-workflow-template-select__item:hover { background: var(--nf-surface-hover, #f3f4f6); }
    .nf-workflow-template-select__name { font-weight: 500; display: block; }
    .nf-workflow-template-select__desc { font-size: 0.8rem; color: var(--nf-text-muted); display: block; margin-top: 2px; }
  `],
})
export class WorkflowTemplateSelectDialogComponent {
  readonly dialogRef = inject(MatDialogRef<WorkflowTemplateSelectDialogComponent>);
  readonly data = inject<WorkflowTemplateSelectDialogData>(MAT_DIALOG_DATA);

  select(template: WorkflowTemplateDto): void {
    this.dialogRef.close(template.code);
  }

  close(): void {
    this.dialogRef.close();
  }
}
