import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { AppGeneralSettings } from '../../models';
import type { GeneralTimezoneOption } from './general.config';
import { GENERAL_TIMEZONE_OPTIONS } from './general.config';

const MAX_TENANT_NAME_LENGTH = 255;

@Component({
  selector: 'app-app-settings-general-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'appSettings.general.title' | translate }}</h3>
      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'appSettings.general.tenantName' | translate }}</mat-label>
              <input
                matInput
                formControlName="tenantName"
                [maxlength]="maxTenantNameLength" />
              <mat-hint align="start">{{ 'appSettings.general.tenantName.hint' | translate }}</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'appSettings.general.timezone' | translate }}</mat-label>
              <mat-select formControlName="timezone">
                @for (tz of timezoneOptions; track tz.value) {
                  <mat-option [value]="tz.value">{{ tz.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'appSettings.general.contactEmail' | translate }}</mat-label>
              <input matInput formControlName="contactEmail" type="email" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'appSettings.general.supportEmail' | translate }}</mat-label>
              <input matInput formControlName="supportEmail" type="email" />
            </mat-form-field>
          </div>

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="loading || saving || form.invalid || !form.dirty">
              {{ 'appSettings.general.save' | translate }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [
    `
      .settings-section {
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        padding: 1rem;
        background: #ffffff;
      }

      .settings-section h3 {
        margin: 0 0 1rem;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
      }

      .grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class GeneralSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly maxTenantNameLength = MAX_TENANT_NAME_LENGTH;

  @Input() data: AppGeneralSettings | null = null;
  @Input() loading = false;
  @Input() saving = false;
  @Input() timezoneOptions: GeneralTimezoneOption[] = [...GENERAL_TIMEZONE_OPTIONS];

  @Output() save = new EventEmitter<AppGeneralSettings>();

  readonly form = this.fb.group({
    tenantName: this.fb.nonNullable.control(
      '',
      [Validators.required, Validators.maxLength(MAX_TENANT_NAME_LENGTH)]
    ),
    contactEmail: this.fb.control<string | null>(null, Validators.email),
    supportEmail: this.fb.control<string | null>(null, Validators.email),
    timezone: this.fb.nonNullable.control('UTC', Validators.required),
  });

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.form.patchValue(
      {
        tenantName: this.data.tenantName ?? '',
        contactEmail: this.data.contactEmail ?? null,
        supportEmail: this.data.supportEmail ?? null,
        timezone: this.data.timezone ?? 'UTC',
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      tenantName: value.tenantName.trim(),
      contactEmail: value.contactEmail?.trim() || null,
      supportEmail: value.supportEmail?.trim() || null,
      timezone: value.timezone,
    });
  }
}
