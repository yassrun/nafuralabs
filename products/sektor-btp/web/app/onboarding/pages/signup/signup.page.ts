import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

import { AuthFacade } from '@core/security/services/auth.facade';
import { ButtonComponent } from '@lib/anatomy';

function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) {
    return null;
  }
  const ok = value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
  return ok ? null : { passwordPolicy: true };
}

@Component({
  selector: 'naf-signup-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonComponent],
  template: `
    <section class="signup-card" aria-labelledby="signup-title">
      <h1 id="signup-title">{{ 'onboarding.signup.title' | translate }}</h1>
      <p class="signup-card__sub">{{ 'onboarding.signup.subtitle' | translate }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="signup-form" novalidate>
        <fieldset class="signup-form__fields" [disabled]="submitting()">
          <label>
            <span>{{ 'onboarding.signup.email' | translate }}</span>
            <input
              type="email"
              autocomplete="email"
              formControlName="email"
              [attr.aria-invalid]="showError('email')"
              [attr.aria-describedby]="showError('email') ? 'signup-email-error' : null" />
            @if (showError('email')) {
              <small id="signup-email-error" class="signup-form__error" role="alert">
                {{ emailErrorKey() | translate }}
              </small>
            }
          </label>

          <label>
            <span>{{ 'onboarding.signup.password' | translate }}</span>
            <input
              type="password"
              autocomplete="new-password"
              formControlName="password"
              [attr.aria-invalid]="showError('password')"
              [attr.aria-describedby]="passwordDescribedBy()" />
            <small
              id="signup-password-hint"
              [class.signup-form__hint-ok]="passwordOk()"
              [class.signup-form__error]="showError('password')">
              @if (showError('password')) {
                {{ passwordErrorKey() | translate }}
              } @else {
                {{ (passwordOk() ? 'onboarding.signup.passwordOk' : 'onboarding.signup.passwordHint') | translate }}
              }
            </small>
          </label>

          <label>
            <span>{{ 'onboarding.signup.firstName' | translate }}</span>
            <input
              type="text"
              autocomplete="given-name"
              formControlName="firstName"
              [attr.aria-invalid]="showError('firstName')"
              [attr.aria-describedby]="showError('firstName') ? 'signup-firstName-error' : null" />
            @if (showError('firstName')) {
              <small id="signup-firstName-error" class="signup-form__error" role="alert">
                {{ nameErrorKey('firstName') | translate }}
              </small>
            }
          </label>

          <label>
            <span>{{ 'onboarding.signup.lastName' | translate }}</span>
            <input
              type="text"
              autocomplete="family-name"
              formControlName="lastName"
              [attr.aria-invalid]="showError('lastName')"
              [attr.aria-describedby]="showError('lastName') ? 'signup-lastName-error' : null" />
            @if (showError('lastName')) {
              <small id="signup-lastName-error" class="signup-form__error" role="alert">
                {{ nameErrorKey('lastName') | translate }}
              </small>
            }
          </label>

          <label>
            <span>{{ 'onboarding.signup.locale' | translate }}</span>
            <select formControlName="locale">
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

        <nf-button
          type="submit"
          [fullWidth]="true"
          [disabled]="!canSubmit()"
          variant="primary">
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
    .signup-form input[aria-invalid='true'],
    .signup-form select[aria-invalid='true'] {
      border-color: var(--nf-color-danger-500, #dc2626);
    }
    .signup-form small { color: var(--nf-text-muted); font-weight: 400; }
    .signup-form__hint-ok { color: var(--nf-color-success-700) !important; }
    .signup-form__error { color: var(--nf-color-danger-700) !important; }
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
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordPolicyValidator]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    locale: this.fb.nonNullable.control<'fr' | 'en' | 'ar'>('fr', Validators.required),
  });

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map((status) => status === 'VALID'),
    ),
    { initialValue: this.form.valid },
  );

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  /** Forces re-eval of showError after markAllAsTouched. */
  readonly touchedTick = signal(0);

  constructor() {
    this.form.controls.locale.valueChanges.subscribe((locale) => {
      this.translate.use(locale);
    });
  }

  canSubmit(): boolean {
    return this.formValid() === true && !this.submitting();
  }

  showError(controlName: 'email' | 'password' | 'firstName' | 'lastName'): boolean {
    this.touchedTick();
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  passwordOk(): boolean {
    return this.form.controls.password.valid && !!this.form.controls.password.value;
  }

  passwordDescribedBy(): string {
    return 'signup-password-hint';
  }

  emailErrorKey(): string {
    const errors = this.form.controls.email.errors;
    if (errors?.['required']) {
      return 'onboarding.signup.emailRequired';
    }
    return 'onboarding.signup.emailInvalid';
  }

  passwordErrorKey(): string {
    const errors = this.form.controls.password.errors;
    if (errors?.['required']) {
      return 'onboarding.signup.passwordRequired';
    }
    return 'onboarding.signup.passwordInvalid';
  }

  nameErrorKey(controlName: 'firstName' | 'lastName'): string {
    const errors = this.form.controls[controlName].errors;
    if (errors?.['required']) {
      return controlName === 'firstName'
        ? 'onboarding.signup.firstNameRequired'
        : 'onboarding.signup.lastNameRequired';
    }
    return controlName === 'firstName'
      ? 'onboarding.signup.firstNameMin'
      : 'onboarding.signup.lastNameMin';
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.info.set(null);
    this.form.markAllAsTouched();
    this.touchedTick.update((n) => n + 1);

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const { email, password, firstName, lastName, locale } = this.form.getRawValue();
    this.submitting.set(true);
    const result = await this.auth.register({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredLocale: locale,
    });
    this.submitting.set(false);

    if (!result.success) {
      if (result.message?.includes('EMAIL_ALREADY')) {
        this.error.set(
          `${this.translate.instant('onboarding.signup.errorEmailTaken')} ${this.translate.instant('onboarding.signup.errorEmailResumeHint')}`,
        );
      } else {
        this.error.set(this.translate.instant('onboarding.signup.errorGeneric'));
      }
      return;
    }

    if (result.emailVerificationRequired) {
      await this.router.navigate(['/signup/check-email'], {
        queryParams: { email: email.trim() },
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

  private focusFirstInvalid(): void {
    const order = ['email', 'password', 'firstName', 'lastName'] as const;
    for (const name of order) {
      if (this.form.controls[name].invalid) {
        const el = this.host.nativeElement.querySelector(
          `[formControlName="${name}"]`,
        ) as HTMLElement | null;
        el?.focus();
        return;
      }
    }
  }
}
