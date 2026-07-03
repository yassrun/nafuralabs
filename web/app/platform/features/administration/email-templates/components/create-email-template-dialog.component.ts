import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import type { EmailTemplateCreate } from '../models';

@Component({
  selector: 'app-create-email-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'administration.emailTemplates.create' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="create-email-template-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.emailTemplates.fields.name' | translate }}</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          <mat-error *ngIf="form.controls.name.hasError('required')">
            {{ 'common.validation.required' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.emailTemplates.fields.code' | translate }}</mat-label>
          <input matInput formControlName="code" autocomplete="off" placeholder="e.g. invoice-reminder" />
          <mat-error *ngIf="form.controls.code.hasError('required')">
            {{ 'common.validation.required' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.emailTemplates.fields.subject' | translate }}</mat-label>
          <input matInput formControlName="subject" autocomplete="off" />
          <mat-error *ngIf="form.controls.subject.hasError('required')">
            {{ 'common.validation.required' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.emailTemplates.fields.entityType' | translate }}</mat-label>
          <input matInput formControlName="entityType" autocomplete="off" placeholder="e.g. invoice" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.actions.cancel' | translate }}</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || saving">
        {{ 'administration.emailTemplates.create' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .create-email-template-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 320px;
      }
    `,
  ],
})
export class CreateEmailTemplateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateEmailTemplateDialogComponent>);

  saving = false;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    subject: ['', Validators.required],
    entityType: [''],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    try {
      const value = this.form.getRawValue();
      const payload: EmailTemplateCreate = {
        name: value.name,
        code: value.code.trim(),
        subject: value.subject,
        entityType: value.entityType?.trim() || undefined,
      };
      this.dialogRef.close(payload);
    } finally {
      this.saving = false;
    }
  }
}
