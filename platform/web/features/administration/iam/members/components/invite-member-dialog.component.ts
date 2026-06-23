import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { LookupItem } from '@lib/anatomy/types';

export interface InviteMemberDialogData {
  roles: LookupItem[];
  initialValue?: InviteMemberDialogResult;
  duplicateError?: boolean;
}

export interface InviteMemberDialogResult {
  email: string;
  roleId: string;
  message?: string;
}

@Component({
  selector: 'app-invite-member-dialog',
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
    <h2 mat-dialog-title>{{ 'administration.members.invite' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="invite-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.members.columns.email' | translate }}</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" />
          <mat-error *ngIf="form.controls.email.hasError('required')">
            {{ 'administration.members.validation.emailRequired' | translate }}
          </mat-error>
          <mat-error *ngIf="form.controls.email.hasError('email')">
            {{ 'administration.members.validation.emailInvalid' | translate }}
          </mat-error>
          <mat-error *ngIf="data.duplicateError">
            {{ 'administration.members.invite.duplicate' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.members.columns.role' | translate }}</mat-label>
          <mat-select formControlName="roleId">
            <mat-option *ngFor="let role of data.roles" [value]="role.key">{{ role.value }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.roleId.hasError('required')">
            {{ 'administration.members.validation.roleRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.members.fields.message' | translate }}</mat-label>
          <textarea matInput formControlName="message" rows="4"></textarea>
          <mat-hint align="end">{{ (form.controls.message.value || '').length }}/500</mat-hint>
          <mat-error *ngIf="form.controls.message.hasError('maxlength')">
            {{ 'administration.members.validation.messageMaxLength' | translate }}
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">{{ 'Cancel' | translate }}</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">
        {{ 'administration.members.invite' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .invite-form {
        display: grid;
        gap: 0.75rem;
        min-width: min(560px, 80vw);
        padding-top: 0.5rem;
      }
    `,
  ],
})
export class InviteMemberDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<InviteMemberDialogComponent, InviteMemberDialogResult | undefined>
  );

  readonly data = inject<InviteMemberDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    email: [this.data.initialValue?.email ?? '', [Validators.required, Validators.email]],
    roleId: [this.data.initialValue?.roleId ?? '', [Validators.required]],
    message: [this.data.initialValue?.message ?? '', [Validators.maxLength(500)]],
  });

  close(): void {
    this.dialogRef.close(undefined);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.dialogRef.close({
      email: raw.email.trim(),
      roleId: String(raw.roleId),
      message: raw.message.trim() || undefined,
    });
  }
}
