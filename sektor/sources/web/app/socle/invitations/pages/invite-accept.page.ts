
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { ButtonComponent } from '@platform/lib/anatomy';
import { APPLICATION_DEFAULT_ROUTE } from '@app/socle/config/routes';

import {
  InvitationApiService,
  type InvitationPreview,
} from '../services/invitation-api.service';

@Component({
  selector: 'naf-invite-accept-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule, ButtonComponent],
  template: `
    <section class="invite-card" aria-labelledby="invite-title">
      <h1 id="invite-title">{{ 'invite.accept.title' | translate }}</h1>

      @if (busy()) {
        <p>{{ 'invite.accept.pending' | translate }}</p>
      } @else if (error()) {
        <p class="invite-error" role="alert">{{ error() }}</p>
      } @else if (success()) {
        <p class="invite-ok">{{ successMessage() }}</p>
        <nf-button variant="primary" [fullWidth]="true" (click)="continueToLogin()">
          {{ 'invite.accept.loginToContinue' | translate }}
        </nf-button>
      } @else if (preview()) {
        <p class="invite-sub">
          {{ 'invite.accept.tenantLabel' | translate }}:
          <strong>{{ preview()!.tenantName }}</strong>
        </p>
        <p class="invite-sub">{{ preview()!.email }}</p>

        @if (preview()!.alreadyAccepted) {
          <p class="invite-info">{{ 'invite.accept.alreadyAccepted' | translate }}</p>
          <nf-button variant="primary" [fullWidth]="true" (click)="continueToLogin()">
            {{ 'invite.accept.loginToContinue' | translate }}
          </nf-button>
        } @else if (preview()!.requiresAccountSetup) {
          <form (ngSubmit)="acceptWithAccount()" class="invite-form">
            <label>
              <span>{{ 'invite.accept.firstName' | translate }}</span>
              <input type="text" required [(ngModel)]="firstName" name="firstName" />
            </label>
            <label>
              <span>{{ 'invite.accept.lastName' | translate }}</span>
              <input type="text" required [(ngModel)]="lastName" name="lastName" />
            </label>
            <label>
              <span>{{ 'invite.accept.password' | translate }}</span>
              <input type="password" autocomplete="new-password" required [(ngModel)]="password" name="password" />
              <small>{{ passwordHint() }}</small>
            </label>
            @if (formError()) {
              <p class="invite-error" role="alert">{{ formError() }}</p>
            }
            <nf-button type="submit" variant="primary" [fullWidth]="true" [disabled]="submitting()">
              {{ 'invite.accept.createAccount' | translate }}
            </nf-button>
          </form>
        } @else {
          <p class="invite-info">{{ 'invite.accept.existingAccount' | translate }}</p>
          <nf-button variant="primary" [fullWidth]="true" [disabled]="submitting()" (click)="acceptExisting()">
            {{ 'invite.accept.activate' | translate }}
          </nf-button>
          @if (formError()) {
            <p class="invite-error" role="alert">{{ formError() }}</p>
          }
        }
      }
    </section>
  `,
  styles: [`
    .invite-card {
      max-width: 420px; margin: 0 auto; padding: 1.5rem;
      background: var(--nf-color-surface); border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
    }
    .invite-sub { color: var(--nf-text-secondary, var(--nf-text-muted)); margin-bottom: 0.75rem; }
    .invite-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .invite-form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .invite-form input {
      padding: 0.625rem 0.75rem; border: 1px solid var(--nf-border-default);
      border-radius: 8px; font: inherit;
    }
    .invite-error { color: var(--nf-color-danger-700); }
    .invite-ok, .invite-info { color: var(--nf-color-success-700); }
  `],
})
export class InviteAcceptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(InvitationApiService);
  private readonly auth = inject(AuthFacade);
  private readonly translate = inject(TranslateService);

  readonly busy = signal(true);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly success = signal(false);
  readonly successMessage = signal('');
  readonly submitting = signal(false);
  readonly preview = signal<InvitationPreview | null>(null);

  firstName = '';
  lastName = '';
  password = '';
  private token = '';

  ngOnInit(): void {
    void this.loadPreview();
  }

  passwordHint(): string {
    const okLen = this.password.length >= 8;
    const okUpper = /[A-Z]/.test(this.password);
    const okDigit = /\d/.test(this.password);
    return okLen && okUpper && okDigit ? '✓' : this.translate.instant('invite.accept.passwordHint');
  }

  async continueToLogin(): Promise<void> {
    const previewData = this.preview();
    const returnUrl = previewData
      ? `/invite/accept?token=${encodeURIComponent(this.token)}`
      : '/';
    if (this.auth.isAuthenticated()) {
      if (previewData) {
        await this.auth.acceptTenantInvitation({
          tenantId: previewData.tenantId,
          tenantName: previewData.tenantName,
          tenantKey: previewData.tenantKey,
        });
      }
      await this.router.navigate(['/', ...APPLICATION_DEFAULT_ROUTE.split('/').filter(Boolean)]);
      return;
    }
    await this.auth.loginWithReturnUrl(returnUrl);
  }

  async acceptExisting(): Promise<void> {
    await this.submitAccept({});
  }

  async acceptWithAccount(): Promise<void> {
    this.formError.set(null);
    if (this.password.length < 8 || !/[A-Z]/.test(this.password) || !/\d/.test(this.password)) {
      this.formError.set(this.translate.instant('invite.accept.passwordHint'));
      return;
    }
    await this.submitAccept({
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
    });
  }

  private async loadPreview(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.busy.set(false);
      this.error.set(this.translate.instant('invite.accept.missingToken'));
      return;
    }

    try {
      const data = await this.api.preview(this.token);
      this.preview.set(data);
      this.busy.set(false);

      if (this.auth.isAuthenticated()) {
        const userEmail = this.auth.user()?.email?.toLowerCase();
        if (userEmail && userEmail !== data.email.toLowerCase()) {
          this.error.set(this.translate.instant('invite.accept.wrongAccount'));
          this.preview.set(null);
          return;
        }
        if (!data.alreadyAccepted && !data.requiresAccountSetup) {
          await this.acceptExisting();
        }
      }
    } catch {
      this.busy.set(false);
      this.error.set(this.translate.instant('invite.accept.failed'));
    }
  }

  private async submitAccept(fields: {
    password?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    this.submitting.set(true);
    this.formError.set(null);
    try {
      const result = await this.api.accept({
        token: this.token,
        ...fields,
      });
      this.successMessage.set(result.message || this.translate.instant('invite.accept.success'));
      this.success.set(true);
      this.preview.set({
        tenantId: result.tenantId,
        tenantKey: result.tenantKey,
        tenantName: result.tenantName,
        email: result.email,
        requiresAccountSetup: false,
        alreadyAccepted: result.alreadyAccepted,
        expiresAt: '',
      });
    } catch {
      this.formError.set(this.translate.instant('invite.accept.failed'));
    } finally {
      this.submitting.set(false);
    }
  }
}
