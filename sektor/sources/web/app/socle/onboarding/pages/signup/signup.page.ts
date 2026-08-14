
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';

import { ButtonComponent } from '@platform/lib/anatomy';

@Component({
  selector: 'naf-signup-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule, ButtonComponent],
  template: `
    <section class="signup-card" aria-labelledby="signup-title">
      <h1 id="signup-title">{{ 'onboarding.signup.title' | translate }}</h1>
      <p class="signup-card__sub">{{ 'onboarding.signup.subtitle' | translate }}</p>

      <form (ngSubmit)="submit()" class="signup-form">
        <fieldset class="signup-form__fields" [disabled]="submitting()">
          <label>
            <span>{{ 'onboarding.signup.email' | translate }}</span>
            <input type="email" autocomplete="email" required [(ngModel)]="email" name="email" />
          </label>
          <label>
            <span>{{ 'onboarding.signup.password' | translate }}</span>
            <input type="password" autocomplete="new-password" required [(ngModel)]="password" name="password" />
            <small [class.signup-form__hint-ok]="passwordValid()">
              {{ (passwordValid() ? 'onboarding.signup.passwordOk' : 'onboarding.signup.passwordHint') | translate }}
            </small>
          </label>
          <label>
            <span>{{ 'onboarding.signup.firstName' | translate }}</span>
            <input type="text" required [(ngModel)]="firstName" name="firstName" />
          </label>
          <label>
            <span>{{ 'onboarding.signup.lastName' | translate }}</span>
            <input type="text" required [(ngModel)]="lastName" name="lastName" />
          </label>
          <label>
            <span>{{ 'onboarding.signup.locale' | translate }}</span>
            <select [(ngModel)]="locale" name="locale" (ngModelChange)="onLocaleChange($event)">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </fieldset>

        @if (info()) {
          <p class="signup-info" role="status">{{ info() }}</p>
        }
        @if (error()) {
          <p class="signup-error" role="alert">{{ error() }}</p>
        }

        <nf-button type="submit" [fullWidth]="true" [disabled]="submitting()" variant="primary">
          @if (submitting()) {
            <span class="signup-spinner" aria-hidden="true"></span>
          }
          {{ (submitting() ? 'onboarding.signup.submitting' : 'onboarding.signup.submit') | translate }}
        </nf-button>

        @if (submitting()) {
          <p class="signup-wait" role="status">{{ 'onboarding.signup.submittingHint' | translate }}</p>
        }
      </form>
    </section>
  `,
  styles: [`
    .signup-card {
      max-width: 440px; margin: 0 auto; padding: clamp(1.5rem, 4vw, 2.5rem);
      background: var(--nf-color-surface); border-radius: 16px;
      box-shadow: 0 6px 32px rgba(10, 24, 64, 0.08);
    }
    .signup-card h1 {
      margin: 0 0 0.35rem;
      font-size: clamp(1.25rem, 3vw, 1.5rem);
      font-weight: 700;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .signup-card__sub { color: var(--nf-text-secondary, var(--nf-text-muted)); margin: 0 0 1.25rem; line-height: 1.45; }
    .signup-form { display: flex; flex-direction: column; gap: 1rem; }
    .signup-form__fields {
      display: flex; flex-direction: column; gap: 1rem;
      border: 0; margin: 0; padding: 0; min-width: 0;
    }
    .signup-form__fields:disabled { opacity: 0.6; }
    .signup-form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; font-weight: 500; }
    .signup-form input, .signup-form select {
      padding: 0.7rem 0.85rem; border: 1px solid var(--nf-border-default);
      border-radius: 10px; font: inherit; font-weight: 400;
    }
    .signup-form input:focus-visible, .signup-form select:focus-visible {
      outline: 2px solid var(--nf-color-primary-400);
      outline-offset: 1px;
      border-color: var(--nf-color-primary-400);
    }
    .signup-form small { color: var(--nf-text-muted); }
    .signup-form__hint-ok { color: var(--nf-color-success-700) !important; }
    .signup-error { color: var(--nf-color-danger-700); font-size: 0.875rem; }
    .signup-info { color: var(--nf-color-success-700); font-size: 0.875rem; }
    .signup-wait { margin: 0; font-size: 0.8125rem; color: var(--nf-text-muted); text-align: center; }
    .signup-form nf-button { margin-top: 0.5rem; }
    .signup-spinner {
      display: inline-block; width: 14px; height: 14px; margin-inline-end: 0.5rem;
      vertical-align: -2px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-top-color: #fff; border-radius: 50%;
      animation: signup-spin 0.7s linear infinite;
    }
    @keyframes signup-spin { to { transform: rotate(360deg); } }
  `],
})
export class SignupPage {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  email = '';
  password = '';
  firstName = '';
  lastName = '';
  locale: 'fr' | 'en' | 'ar' = 'fr';

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  passwordValid(): boolean {
    return this.password.length >= 8 && /[A-Z]/.test(this.password) && /\d/.test(this.password);
  }

  onLocaleChange(locale: 'fr' | 'en' | 'ar'): void {
    this.translate.use(locale);
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.info.set(null);
    if (!this.passwordValid()) {
      this.error.set(this.translate.instant('onboarding.signup.passwordHint'));
      return;
    }
    this.submitting.set(true);
    const result = await this.auth.register({
      email: this.email.trim(),
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      preferredLocale: this.locale,
    });
    this.submitting.set(false);
    if (!result.success) {
      if (result.message?.includes('EMAIL_ALREADY')) {
        this.error.set(
          `${this.translate.instant('onboarding.signup.errorEmailTaken')} ${this.translate.instant('onboarding.signup.errorEmailResumeHint')}`
        );
      } else {
        this.error.set(this.translate.instant('onboarding.signup.errorGeneric'));
      }
      return;
    }
    if (result.emailVerificationRequired) {
      await this.router.navigate(['/signup/check-email'], {
        queryParams: { email: this.email.trim() },
      });
      return;
    }
    if (result.loginRequired) {
      this.info.set(result.message);
      await this.auth.loginWithReturnUrl('/onboarding');
      return;
    }
    if (result.resumed) {
      this.info.set(this.translate.instant('onboarding.signup.resumeSuccess'));
    } else {
      this.info.set(this.translate.instant('onboarding.signup.createSuccess'));
    }
    await this.router.navigateByUrl('/onboarding');
  }
}
