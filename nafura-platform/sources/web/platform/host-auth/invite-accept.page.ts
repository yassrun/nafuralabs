import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { HOST_AUTH_OPTIONS } from './host-auth.config';
import { HostAuthService } from './host-auth.service';
import {
  InvitationApiService,
  type InvitationPreview,
} from './invitation-api.service';

/**
 * Public invitation acceptance: preview token, create account if needed, activate membership.
 * Mounted outside the authenticated shell (same as /login).
 */
@Component({
  selector: 'nf-invite-accept',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule],
  template: `
    <div class="invite">
      <div class="card">
        @if (productMark) {
          <img class="logo logo--image" [src]="productMark" alt="" />
        } @else {
          <div class="logo" aria-hidden="true">{{ productInitial }}</div>
        }
        <h1>{{ 'invite.accept.title' | translate }}</h1>

        @if (busy()) {
          <p class="hint">{{ 'invite.accept.pending' | translate }}</p>
        } @else if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
          <button type="button" (click)="goLogin()">
            {{ 'invite.accept.loginToContinue' | translate }}
          </button>
        } @else if (success()) {
          <p class="ok">{{ successMessage() }}</p>
          <button type="button" [disabled]="submitting()" (click)="continueAfterAccept()">
            {{ continueLabel() }}
          </button>
        } @else if (preview(); as data) {
          <p class="hint">
            {{ 'invite.accept.tenantLabel' | translate }}:
            <strong>{{ data.tenantName }}</strong>
          </p>
          <p class="hint">{{ data.email }}</p>

          @if (data.alreadyAccepted) {
            <p class="ok">{{ 'invite.accept.alreadyAccepted' | translate }}</p>
            <button type="button" (click)="continueAfterAccept()">
              {{ continueLabel() }}
            </button>
          } @else if (data.requiresAccountSetup) {
            <form class="form" (ngSubmit)="acceptWithAccount()">
              <label>
                <span>{{ 'invite.accept.firstName' | translate }}</span>
                <input type="text" name="firstName" required [(ngModel)]="firstName" />
              </label>
              <label>
                <span>{{ 'invite.accept.lastName' | translate }}</span>
                <input type="text" name="lastName" required [(ngModel)]="lastName" />
              </label>
              <label>
                <span>{{ 'invite.accept.password' | translate }}</span>
                <input
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  required
                  [(ngModel)]="password" />
                <small>{{ passwordHint() }}</small>
              </label>
              @if (formError()) {
                <p class="error" role="alert">{{ formError() }}</p>
              }
              <button type="submit" [disabled]="submitting()">
                {{ 'invite.accept.createAccount' | translate }}
              </button>
            </form>
          } @else {
            <p class="hint">{{ 'invite.accept.existingAccount' | translate }}</p>
            <button type="button" [disabled]="submitting()" (click)="acceptExisting()">
              {{ 'invite.accept.activate' | translate }}
            </button>
            @if (formError()) {
              <p class="error" role="alert">{{ formError() }}</p>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .invite {
        display: grid;
        place-items: center;
        min-height: 100dvh;
        background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
        padding: 1.5rem;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border-radius: 16px;
        padding: 2rem 1.75rem;
        box-shadow: 0 20px 50px rgb(0 0 0 / 18%);
      }
      .logo {
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        margin-bottom: 12px;
        border-radius: 14px;
        background: #0d9488;
        color: #fff;
        font-size: 26px;
        font-weight: 800;
      }
      .logo--image {
        display: block;
        background: none;
        object-fit: contain;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.35rem;
      }
      .hint,
      .ok,
      .error {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        line-height: 1.45;
      }
      .hint {
        color: #64748b;
      }
      .ok {
        color: #047857;
      }
      .error {
        color: #b42318;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #334155;
      }
      input,
      button {
        width: 100%;
        font: inherit;
        font-size: 0.875rem;
        border-radius: 8px;
      }
      input {
        padding: 10px 12px;
        border: 1px solid #cbd5e1;
        font-weight: 400;
      }
      button {
        margin-top: 4px;
        min-height: 40px;
        border: 0;
        background: #0f766e;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      small {
        font-weight: 400;
        color: #64748b;
      }
    `,
  ],
})
export class InviteAcceptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(InvitationApiService);
  private readonly auth = inject(HostAuthService);
  private readonly translate = inject(TranslateService);
  private readonly options = inject(HOST_AUTH_OPTIONS);

  readonly productName = this.options.productName;
  readonly productMark = this.options.productMark;
  readonly productInitial = this.options.productName.trim().charAt(0).toUpperCase();

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
    const ok =
      this.password.length >= 8 &&
      /[A-Z]/.test(this.password) &&
      /\d/.test(this.password);
    return ok ? '✓' : this.translate.instant('invite.accept.passwordHint');
  }

  continueLabel(): string {
    return this.auth.current()
      ? this.translate.instant('invite.accept.openApp')
      : this.translate.instant('invite.accept.loginToContinue');
  }

  async goLogin(): Promise<void> {
    await this.router.navigateByUrl(this.auth.loginPath());
  }

  async continueAfterAccept(): Promise<void> {
    const data = this.preview();
    if (this.auth.current() && data) {
      this.submitting.set(true);
      try {
        await this.auth.selectOrganization(data.tenantId);
        await this.router.navigateByUrl(this.auth.homePath());
      } catch {
        await this.router.navigateByUrl(this.auth.homePath());
      } finally {
        this.submitting.set(false);
      }
      return;
    }
    const returnUrl = this.token
      ? `/invite/accept?token=${encodeURIComponent(this.token)}`
      : this.auth.homePath();
    await this.router.navigate([this.auth.loginPath()], {
      queryParams: { returnUrl },
    });
  }

  async acceptExisting(): Promise<void> {
    await this.submitAccept({});
  }

  async acceptWithAccount(): Promise<void> {
    this.formError.set(null);
    if (
      this.password.length < 8 ||
      !/[A-Z]/.test(this.password) ||
      !/\d/.test(this.password)
    ) {
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
      await this.auth.ensureSession();
      const data = await this.api.preview(this.token);
      this.preview.set(data);
      this.busy.set(false);

      const session = this.auth.current();
      if (session) {
        const userEmail = session.email?.toLowerCase();
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
      this.successMessage.set(
        result.message || this.translate.instant('invite.accept.success')
      );
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
