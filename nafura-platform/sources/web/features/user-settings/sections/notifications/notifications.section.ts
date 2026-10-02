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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AlertComponent, ButtonComponent, NfSelectComponent, NfSwitchComponent } from '@lib/anatomy';
import type { UserNotificationSettings } from '../../models';
import { DIGEST_FREQUENCY_OPTIONS } from './notifications.config';

@Component({
  selector: 'app-user-notifications-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    AlertComponent,
    ButtonComponent,
    NfSelectComponent,
    NfSwitchComponent,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'userSettings.notifications.title' | translate }}</h3>

      <nf-alert
        variant="info"
        [message]="'userSettings.notifications.banner' | translate" />

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="toggles">
          <nf-switch
            [checked]="form.controls.emailNotifications.value"
            [label]="'userSettings.notifications.email' | translate"
            (changed)="setNotificationControl('emailNotifications', $event)" />
          <p class="field-hint">{{ 'userSettings.notifications.email.hint' | translate }}</p>

          <nf-switch
            [checked]="form.controls.inAppNotifications.value"
            [label]="'userSettings.notifications.inApp' | translate"
            (changed)="setNotificationControl('inAppNotifications', $event)" />
          <p class="field-hint">{{ 'userSettings.notifications.inApp.hint' | translate }}</p>
        </div>

        <nf-select
          class="digest-field"
          [label]="'userSettings.notifications.digest' | translate"
          [options]="digestSelectOptions"
            formControlName="digestFrequency"
          [disabled]="!form.controls.emailNotifications.value" />
        @if (form.controls.emailNotifications.value) {
          <p class="field-hint">{{ 'userSettings.notifications.digest.hint' | translate }}</p>
        } @else {
          <p class="field-hint">{{ 'userSettings.notifications.digest.disabled' | translate }}</p>
        }

        <div class="actions">
          <nf-button
            type="submit"
            variant="primary"
            [disabled]="loading || saving || form.invalid">
            {{ 'userSettings.notifications.save' | translate }}
          </nf-button>
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

      .toggles nf-switch {
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
  private readonly i18n = inject(TranslateService);

  @Input() data: UserNotificationSettings | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<UserNotificationSettings>();

  readonly digestOptions = [...DIGEST_FREQUENCY_OPTIONS];
  readonly digestSelectOptions = this.digestOptions.map((option) => ({
    value: option.value,
    label: this.i18n.instant(option.labelKey),
  }));

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

  setNotificationControl(control: 'emailNotifications' | 'inAppNotifications', value: boolean): void {
    this.form.controls[control].setValue(value);
  }
}
