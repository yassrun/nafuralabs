import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import type { ActiveSession } from '../../models';
import { PASSWORD_MIN_LENGTH } from './security.config';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Phase 1: form and sessions are disabled/placeholder. Phase 2: full Keycloak integration. */
const SECURITY_PHASE_1 = true;

@Component({
  selector: 'app-user-security-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'userSettings.security.title' | translate }}</h3>

      <!-- Password change (Phase 1: disabled + coming soon banner) -->
      <div class="card">
        <h4>{{ 'userSettings.security.password.title' | translate }}</h4>
        @if (phase1) {
          <div class="coming-soon-banner">
            {{ 'userSettings.security.password.comingSoon' | translate }}
          </div>
        }
        <form
          [formGroup]="passwordForm"
          (ngSubmit)="submitPassword()">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.security.password.current' | translate }}</mat-label>
              <input matInput type="password" formControlName="currentPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.security.password.new' | translate }}</mat-label>
              <input matInput type="password" formControlName="newPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'userSettings.security.password.confirm' | translate }}</mat-label>
              <input matInput type="password" formControlName="confirmNewPassword" />
              @if (
                !phase1 &&
                passwordForm.hasError('passwordMismatch') &&
                passwordForm.get('confirmNewPassword')?.touched
              ) {
                <mat-error>{{ 'userSettings.security.password.mismatch' | translate }}</mat-error>
              }
            </mat-form-field>
          </div>

          @if (!phase1) {
            <div class="actions">
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="loading || savingPassword || passwordForm.invalid">
                {{ 'userSettings.security.password.title' | translate }}
              </button>
            </div>
          }
        </form>
      </div>

      <!-- Active sessions (Phase 1: placeholder; Phase 2: table) -->
      <div class="card">
        <h4>{{ 'userSettings.security.sessions.title' | translate }}</h4>
        @if (phase1) {
          <p class="coming-soon-text">
            {{ 'userSettings.security.sessions.comingSoon' | translate }}
          </p>
          <p class="coming-soon-text muted">
            {{ 'userSettings.security.sessions.comingSoonHint' | translate }}
          </p>
        } @else if (sessions.length === 0) {
          <p class="muted">{{ 'userSettings.security.sessions.comingSoon' | translate }}</p>
        } @else {
          <table mat-table [dataSource]="sessions" class="sessions-table">
            <ng-container matColumnDef="device">
              <th mat-header-cell *matHeaderCellDef>Device</th>
              <td mat-cell *matCellDef="let session">
                {{ session.deviceName || 'Unknown device' }}
                @if (session.isCurrent) {
                  <span class="pill">{{ 'userSettings.security.sessions.current' | translate }}</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="ip">
              <th mat-header-cell *matHeaderCellDef>IP</th>
              <td mat-cell *matCellDef="let session">{{ session.ipAddress }}</td>
            </ng-container>
            <ng-container matColumnDef="lastActiveAt">
              <th mat-header-cell *matHeaderCellDef>Last active</th>
              <td mat-cell *matCellDef="let session">
                {{ session.lastActiveAt | date : 'medium' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let session" class="actions-cell">
                @if (!session.isCurrent) {
                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="loading || revokingSessionId === session.id"
                    (click)="revoke.emit(session.id)">
                    {{ 'userSettings.security.sessions.revoke' | translate }}
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </div>

      <!-- 2FA (future: placeholder only) -->
      <div class="card">
        <h4>{{ 'userSettings.security.twoFactor.title' | translate }}</h4>
        <p class="coming-soon-text">
          {{ 'userSettings.security.twoFactor.comingSoon' | translate }}
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .settings-section {
        display: grid;
        gap: 1rem;
      }

      .card {
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        padding: 1rem;
        background: #ffffff;
      }

      .card h4 {
        margin: 0 0 0.75rem;
      }

      .coming-soon-banner {
        background: #fef3c7;
        color: #92400e;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }

      .coming-soon-text,
      .muted {
        color: #64748b;
        margin: 0;
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

      .sessions-table {
        width: 100%;
      }

      .actions-cell {
        text-align: right;
      }

      .pill {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        font-size: 0.72rem;
        background: #dbeafe;
        color: #1d4ed8;
      }
    `,
  ],
})
export class SecuritySectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  /** When true, password form is disabled and sessions show placeholder (Phase 1). */
  @Input() phase1 = SECURITY_PHASE_1;
  @Input() sessions: ActiveSession[] = [];
  @Input() loading = false;
  @Input() savingPassword = false;
  @Input() revokingSessionId: string | null = null;

  @Output() changePassword = new EventEmitter<ChangePasswordPayload>();
  @Output() revoke = new EventEmitter<string>();

  readonly columns = ['device', 'ip', 'lastActiveAt', 'actions'];

  readonly passwordForm = this.fb.group(
    {
      currentPassword: this.fb.nonNullable.control('', Validators.required),
      newPassword: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
      ]),
      confirmNewPassword: this.fb.nonNullable.control('', Validators.required),
    },
    { validators: this.matchPasswords }
  );

  ngOnChanges(): void {
    if (this.phase1) {
      this.passwordForm.disable();
    } else {
      this.passwordForm.enable();
    }
  }

  submitPassword(): void {
    if (this.phase1 || this.passwordForm.invalid) {
      if (this.passwordForm.invalid) {
        this.passwordForm.markAllAsTouched();
      }
      return;
    }
    const value = this.passwordForm.getRawValue();
    this.changePassword.emit({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    });
    this.passwordForm.reset();
  }

  private matchPasswords(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirm = control.get('confirmNewPassword')?.value;
    if (!newPassword || !confirm) {
      return null;
    }
    return newPassword === confirm ? null : { passwordMismatch: true };
  }
}
