import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'naf-signup-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    <section class="signup-card" aria-labelledby="signup-title">
      <h1 id="signup-title">{{ 'onboarding.signup.title' | translate }}</h1>
      <p class="signup-card__sub">{{ 'onboarding.signup.subtitle' | translate }}</p>

      <form (ngSubmit)="submit()" class="signup-form">
        <label>
          <span>{{ 'onboarding.signup.email' | translate }}</span>
          <input type="email" autocomplete="email" required [(ngModel)]="email" name="email" />
        </label>
        <label>
          <span>{{ 'onboarding.signup.password' | translate }}</span>
          <input type="password" autocomplete="new-password" required [(ngModel)]="password" name="password" />
          <small>{{ passwordHint() }}</small>
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
          <select [(ngModel)]="locale" name="locale">
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>

        @if (info()) {
          <p class="signup-info" role="status">{{ info() }}</p>
        }
        @if (error()) {
          <p class="signup-error" role="alert">{{ error() }}</p>
        }

        <nf-button type="submit" class="signup-submit" [disabled]="submitting()" variant="primary">
          {{ (submitting() ? 'onboarding.signup.submitting' : 'onboarding.signup.submit') | translate }}
        </nf-button>
      </form>
    </section>
  `,
  styles: [`
    .signup-card {
      max-width: 420px; margin: 0 auto; padding: 1.5rem;
      background: var(--nf-color-surface); border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
    }
    .signup-card__sub { color: var(--nf-text-secondary, var(--nf-text-muted)); margin-bottom: 1.25rem; }
    .signup-form { display: flex; flex-direction: column; gap: 1rem; }
    .signup-form label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .signup-form input, .signup-form select {
      padding: 0.625rem 0.75rem; border: 1px solid var(--nf-border-default);
      border-radius: 8px; font: inherit;
    }
    .signup-error { color: var(--nf-color-danger-700); font-size: 0.875rem; }
    .signup-info { color: var(--nf-color-success-700); font-size: 0.875rem; }
    .signup-submit {
      margin-top: 0.5rem; padding: 0.75rem; border: 0; border-radius: 8px;
      background: var(--nf-color-primary-600); color: var(--nf-color-surface); font-weight: 600; cursor: pointer;
    }
    .signup-submit:disabled { opacity: 0.6; cursor: not-allowed; }
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

  passwordHint(): string {
    const okLen = this.password.length >= 8;
    const okUpper = /[A-Z]/.test(this.password);
    const okDigit = /\d/.test(this.password);
    if (okLen && okUpper && okDigit) {
      return '✓';
    }
    return '8+ car., majuscule, chiffre';
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.info.set(null);
    if (this.password.length < 8 || !/[A-Z]/.test(this.password) || !/\d/.test(this.password)) {
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
      await this.router.navigate(['/login']);
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
