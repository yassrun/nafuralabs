import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { PrintTemplate, PrintTemplateCreate } from '../models';
import { TemplatesApiService } from '../services/templates-api.service';

export interface CreateTemplateDialogData {
  cloneFrom?: PrintTemplate;
}

@Component({
  selector: 'app-create-template-dialog',
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
    <h2 mat-dialog-title>
      {{ (data?.cloneFrom ? 'administration.templates.clone' : 'administration.templates.create') | translate }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="create-template-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.templates.fields.name' | translate }}</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          <mat-error *ngIf="form.controls.name.hasError('required')">
            {{ 'administration.templates.validation.nameRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.templates.fields.code' | translate }}</mat-label>
          <input matInput formControlName="code" autocomplete="off" />
          <mat-error *ngIf="form.controls.code.hasError('required')">
            {{ 'administration.templates.validation.codeRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'administration.templates.fields.entityType' | translate }}</mat-label>
          <mat-select formControlName="entityType">
            @for (et of entityTypes; track et) {
              <mat-option [value]="et">{{ et }}</mat-option>
            }
          </mat-select>
          <mat-error *ngIf="form.controls.entityType.hasError('required')">
            {{ 'administration.templates.validation.entityTypeRequired' | translate }}
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.actions.cancel' | translate }}</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || saving()">
        {{ (data?.cloneFrom ? 'administration.templates.clone' : 'administration.templates.create') | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .create-template-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 320px;
      }
    `,
  ],
})
export class CreateTemplateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TemplatesApiService);
  private readonly dialogRef = inject(MatDialogRef<CreateTemplateDialogComponent>);
  readonly data = inject<CreateTemplateDialogData | undefined>(MAT_DIALOG_DATA, { optional: true });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.maxLength(60)]],
    entityType: ['', Validators.required],
  });

  entityTypes: string[] = [];
  saving = signal(false);

  async ngOnInit(): Promise<void> {
    this.entityTypes = await this.api.getEntityTypes();
    const clone = this.data?.cloneFrom;
    if (clone) {
      this.form.patchValue({
        name: `${clone.name} (Copy)`,
        code: `${clone.code}-copy`,
        entityType: clone.entityType,
      });
      if (this.entityTypes.length > 0 && !this.entityTypes.includes(clone.entityType)) {
        this.entityTypes = [clone.entityType, ...this.entityTypes];
      }
    } else if (this.entityTypes.length > 0) {
      this.form.patchValue({ entityType: this.entityTypes[0] });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    const clone = this.data?.cloneFrom;
    const payload: PrintTemplateCreate = {
      name: this.form.controls.name.value,
      code: this.form.controls.code.value,
      entityType: this.form.controls.entityType.value,
      templateBody: clone ? '' : '<div></div>',
      cloneFromId: clone?.id,
    };
    this.saving.set(true);
    try {
      const created = await this.api.create(payload);
      this.dialogRef.close(created);
    } catch {
      this.saving.set(false);
    }
  }
}
