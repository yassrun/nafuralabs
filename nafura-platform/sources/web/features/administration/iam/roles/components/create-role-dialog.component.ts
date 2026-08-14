import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import type { Role } from '../models';
import { RolesApiService } from '../services/roles-api.service';

function kebabCase(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function kebabCaseValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) ? null : { kebabCase: true };
}

@Component({
  selector: 'app-create-role-dialog',
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
    <h2 mat-dialog-title>{{ 'administration.roles.create' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="create-role-form">

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.roles.fields.name' | translate }}</mat-label>
          <input
            matInput
            formControlName="name"
            [placeholder]="'administration.roles.fields.namePlaceholder' | translate"
            autocomplete="off"
            (input)="onNameInput()" />
          <mat-hint align="end">{{ (form.controls.name.value || '').length }}/100</mat-hint>
          <mat-error *ngIf="form.controls.name.hasError('required')">
            {{ 'administration.roles.validation.nameRequired' | translate }}
          </mat-error>
          <mat-error *ngIf="form.controls.name.hasError('maxlength')">
            {{ 'administration.roles.validation.nameMaxLength' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.roles.fields.roleCode' | translate }}</mat-label>
          <input
            matInput
            formControlName="roleCode"
            [placeholder]="'administration.roles.fields.roleCodePlaceholder' | translate"
            autocomplete="off" />
          <mat-hint>{{ 'administration.roles.fields.roleCodeHint' | translate }}</mat-hint>
          <mat-error *ngIf="form.controls.roleCode.hasError('required')">
            {{ 'administration.roles.validation.codeRequired' | translate }}
          </mat-error>
          <mat-error *ngIf="form.controls.roleCode.hasError('kebabCase')">
            {{ 'administration.roles.validation.codeKebabCase' | translate }}
          </mat-error>
          <mat-error *ngIf="codeConflict">
            {{ 'administration.roles.validation.codeConflict' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.roles.fields.description' | translate }}</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            [placeholder]="'administration.roles.fields.descriptionPlaceholder' | translate">
          </textarea>
          <mat-hint align="end">{{ (form.controls.description.value || '').length }}/500</mat-hint>
          <mat-error *ngIf="form.controls.description.hasError('maxlength')">
            {{ 'administration.roles.validation.descriptionMaxLength' | translate }}
          </mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">
        {{ 'common.actions.cancel' | translate }}
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="form.invalid || saving"
        (click)="submit()">
        {{ 'administration.roles.create' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .create-role-form {
        display: grid;
        gap: 0.75rem;
        min-width: min(440px, 80vw);
        padding-top: 0.5rem;
      }
    `,
  ],
})
export class CreateRoleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RolesApiService);
  private readonly dialogRef = inject(MatDialogRef<CreateRoleDialogComponent, Role | undefined>);

  saving = false;
  codeConflict = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    roleCode: ['', [Validators.required, kebabCaseValidator]],
    description: ['', [Validators.maxLength(500)]],
  });

  onNameInput(): void {
    const name = this.form.controls.name.value;
    const currentCode = this.form.controls.roleCode.value;
    const generated = kebabCase(name);
    // Only auto-update if the user hasn't manually edited the code
    if (!currentCode || currentCode === kebabCase(this.lastAutoName)) {
      this.lastAutoName = name;
      this.form.controls.roleCode.setValue(generated, { emitEvent: false });
    }
    this.codeConflict = false;
  }

  private lastAutoName = '';

  close(): void {
    this.dialogRef.close(undefined);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.codeConflict = false;

    try {
      const raw = this.form.getRawValue();
      const role = await this.api.create({
        roleCode: raw.roleCode.trim(),
        name: raw.name.trim(),
        description: raw.description.trim() || undefined,
        permissions: [],
      });
      this.dialogRef.close(role);
    } catch (err: unknown) {
      const httpErr = err as { status?: number } | null;
      if (httpErr?.status === 409) {
        this.codeConflict = true;
        this.form.controls.roleCode.setErrors({ conflict: true });
      }
    } finally {
      this.saving = false;
    }
  }
}
