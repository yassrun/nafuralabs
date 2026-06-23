import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

import type { WorkflowStepDto } from '../models';

export interface WorkflowStepDialogData {
  step?: WorkflowStepDto;
  stepNumber: number;
  roleOptions: { value: string; label: string }[];
}

@Component({
  selector: 'app-workflow-step-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'administration.workflows.stepDialog.title' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="step-dialog-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'administration.workflows.stepDialog.stepName' | translate }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'administration.workflows.stepDialog.approverRole' | translate }}</mat-label>
          <mat-select formControlName="approverRole">
            @for (opt of data.roleOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'administration.workflows.stepDialog.timeoutHours' | translate }}</mat-label>
          <input matInput type="number" formControlName="timeoutHours" min="1" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'administration.workflows.stepDialog.escalationRole' | translate }}</mat-label>
          <mat-select formControlName="escalationRole">
            <mat-option value="">{{ 'common.none' | translate }}</mat-option>
            @for (opt of data.roleOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'administration.workflows.stepDialog.condition' | translate }}</mat-label>
          <input matInput formControlName="condition" placeholder="SpEL (optional)" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancel()">
          {{ 'common.actions.cancel' | translate }}
        </button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ 'common.actions.save' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .step-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 360px;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class WorkflowStepDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<WorkflowStepDialogComponent>);
  readonly data: WorkflowStepDialogData = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    approverRole: ['', Validators.required],
    timeoutHours: [null as number | null, [Validators.min(1)]],
    escalationRole: [''],
    condition: [''],
  });

  ngOnInit(): void {
    const step = this.data.step;
    if (step) {
      this.form.patchValue({
        name: step.name,
        approverRole: step.approverRole,
        timeoutHours: step.timeoutHours ?? null,
        escalationRole: step.escalationRole ?? '',
        condition: step.condition ?? '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const result: WorkflowStepDto = {
      stepNumber: this.data.stepNumber,
      name: v.name,
      approverRole: v.approverRole,
      timeoutHours: v.timeoutHours ?? undefined,
      escalationRole: v.escalationRole || undefined,
      condition: v.condition || undefined,
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
