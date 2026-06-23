import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';

import { AlertComponent } from '@lib/anatomy';
import type { UserNotificationSettings } from '../../models';
import { DIGEST_FREQUENCY_OPTIONS } from './notifications.config';

@Component({
  selector: 'app-user-notifications-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    AlertComponent,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'userSettings.notifications.title' | translate }}</h3>

      <nf-alert
        variant="info"
        [message]="'userSettings.notifications.banner' | translate" />

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="toggles">
          <mat-slide-toggle formControlName="emailNotifications">
            {{ 'userSettings.notifications.email' | translate }}
          </mat-slide-toggle>
          <p class="field-hint">{{ 'userSettings.notifications.email.hint' | translate }}</p>

          <mat-slide-toggle formControlName="inAppNotifications">
            {{ 'userSettings.notifications.inApp' | translate }}
          </mat-slide-toggle>
          <p class="field-hint">{{ 'userSettings.notifications.inApp.hint' | translate }}</p>
        </div>

        <mat-form-field appearance="outline" class="digest-field">
          <mat-label>{{ 'userSettings.notifications.digest' | translate }}</mat-label>
          <mat-select
            formControlName="digestFrequency"
            [disabled]="!form.get('emailNotifications')?.value">
            @for (option of digestOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.labelKey | translate }}</mat-option>
            }
          </mat-select>
          @if (form.get('emailNotifications')?.value) {
            <mat-hint>{{ 'userSettings.notifications.digest.hint' | translate }}</mat-hint>
          } @else {
            <mat-hint>{{ 'userSettings.notifications.digest.disabled' | translate }}</mat-hint>
          }
        </mat-form-field>

        <div class="actions">
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="loading || saving || form.invalid">
            {{ 'userSettings.notifications.save' | translate }}
          </button>
        </div>
      </form>
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

      nf-alert {
        margin-bottom: 1rem;
      }

      .toggles {
        display: grid;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
      }

      .toggles mat-slide-toggle {
        display: block;
      }

      .field-hint {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        color: #64748b;
      }

      .digest-field {
        width: min(360px, 100%);
      }

      .actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class NotificationsSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() data: UserNotificationSettings | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<UserNotificationSettings>();

  readonly digestOptions = [...DIGEST_FREQUENCY_OPTIONS];

  readonly form = this.fb.nonNullable.group({
    emailNotifications: true,
    inAppNotifications: true,
    digestFrequency: 'daily' as UserNotificationSettings['digestFrequency'],
  });

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.form.patchValue(
      {
        emailNotifications: this.data.emailNotifications,
        inAppNotifications: this.data.inAppNotifications,
        digestFrequency: this.data.digestFrequency,
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
    this.save.emit(this.form.getRawValue());
  }
}
