import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AvatarComponent } from '@platform/lib/anatomy/components/atoms/avatar/avatar.component';
import type { UserProfileSettings, UserProfileUpdatePayload } from '../../models';

const MAX_FIRST_NAME_LENGTH = 120;
const MAX_LAST_NAME_LENGTH = 120;
const MAX_DISPLAY_NAME_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;

@Component({
  selector: 'app-user-profile-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'userSettings.profile.title' | translate }}</h3>
      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="profile-header">
            <nf-avatar
              [src]="data?.avatarUrl ?? undefined"
              [name]="avatarDisplayName()"
              size="lg"
              shape="circle" />
            <div class="profile-header-info">
              <span class="profile-email">{{ email || '—' }}</span>
              <span class="profile-email-hint">{{ 'userSettings.profile.email.hint' | translate }}</span>
            </div>
          </div>

          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.profile.firstName' | translate }}</mat-label>
              <input
                matInput
                formControlName="firstName"
                [maxlength]="maxFirstNameLength" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.profile.lastName' | translate }}</mat-label>
              <input
                matInput
                formControlName="lastName"
                [maxlength]="maxLastNameLength" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'userSettings.profile.displayName' | translate }}</mat-label>
              <input
                matInput
                formControlName="displayName"
                [maxlength]="maxDisplayNameLength" />
              <mat-hint align="start">{{ 'userSettings.profile.displayName.hint' | translate }}</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.profile.phone' | translate }}</mat-label>
              <input
                matInput
                formControlName="phone"
                type="tel"
                [maxlength]="maxPhoneLength" />
            </mat-form-field>
          </div>

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="loading || saving || form.invalid || !form.dirty">
              {{ 'userSettings.profile.save' | translate }}
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

      .profile-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .profile-header-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .profile-email {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .profile-email-hint {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.6);
      }

      .grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .grid .full-width {
        grid-column: 1 / -1;
      }

      .actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class ProfileSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly maxFirstNameLength = MAX_FIRST_NAME_LENGTH;
  readonly maxLastNameLength = MAX_LAST_NAME_LENGTH;
  readonly maxDisplayNameLength = MAX_DISPLAY_NAME_LENGTH;
  readonly maxPhoneLength = MAX_PHONE_LENGTH;

  @Input() data: UserProfileSettings | null = null;
  @Input() email = '';
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<UserProfileUpdatePayload>();

  readonly avatarDisplayName = computed(() => {
    const d = this.data;
    if (!d) return '';
    if (d.displayName?.trim()) return d.displayName.trim();
    return `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || '';
  });

  readonly form = this.fb.nonNullable.group({
    firstName: [
      '',
      [Validators.required, Validators.maxLength(MAX_FIRST_NAME_LENGTH)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.maxLength(MAX_LAST_NAME_LENGTH)],
    ],
    displayName: ['', [Validators.maxLength(MAX_DISPLAY_NAME_LENGTH)]],
    phone: ['', [Validators.maxLength(MAX_PHONE_LENGTH)]],
  });

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    this.form.patchValue(
      {
        firstName: this.data.firstName ?? '',
        lastName: this.data.lastName ?? '',
        displayName: this.data.displayName ?? '',
        phone: this.data.phone ?? '',
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
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      displayName: value.displayName.trim() || null,
      phone: value.phone.trim() || null,
    });
  }
}
