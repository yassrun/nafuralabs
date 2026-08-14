
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { OnboardingApiService } from '../../services/onboarding-api.service';

import { ButtonComponent } from '@platform/lib/anatomy';

@Component({
  selector: 'naf-signup-check-email-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, RouterLink, ButtonComponent],
  template: `
    <section class="check-email-card" aria-labelledby="check-email-title">
      <h1 id="check-email-title">{{ 'onboarding.signup.checkEmailTitle' | translate }}</h1>
      <p>{{ 'onboarding.signup.checkEmailIntro' | translate }}</p>
      @if (email()) {
        <p class="check-email-card__address"><strong>{{ email() }}</strong></p>
      }
      <p>{{ 'onboarding.signup.checkEmailHint' | translate }}</p>

      @if (email()) {
        <nf-button
          class="check-email-card__resend"
          variant="stroked"
          [fullWidth]="true"
          [disabled]="resending() || resendCooldown() > 0"
          (clicked)="resend()"
        >
          @if (resending()) {
            {{ 'onboarding.signup.resendSubmitting' | translate }}
          } @else if (resendCooldown() > 0) {
            {{ 'onboarding.signup.resendCooldown' | translate: { seconds: resendCooldown() } }}
          } @else {
            {{ 'onboarding.signup.resend' | translate }}
          }
        </nf-button>
      }

      @if (resendSuccess()) {
        <p class="check-email-card__feedback" role="status">{{ 'onboarding.signup.resendSuccess' | translate }}</p>
      }
      @if (resendError()) {
        <p class="check-email-card__error" role="alert">{{ 'onboarding.signup.resendError' | translate }}</p>
      }

      <a routerLink="/signup">{{ 'onboarding.signup.backToSignup' | translate }}</a>
    </section>
  `,
  styles: [`
    .check-email-card {
      max-width: 440px; margin: 0 auto; padding: clamp(1.5rem, 4vw, 2.5rem);
      background: var(--nf-color-surface); border-radius: 16px;
      box-shadow: 0 6px 32px rgba(10, 24, 64, 0.08);
    }
    .check-email-card h1 {
      margin: 0 0 0.75rem;
      font-size: clamp(1.25rem, 3vw, 1.5rem);
      font-weight: 700;
    }
    .check-email-card__address {
      padding: 0.75rem 1rem; border-radius: 10px;
      background: var(--nf-color-surface-muted, var(--nf-color-bg-muted));
      word-break: break-all;
    }
    .check-email-card__resend { margin-top: 1rem; display: block; }
    .check-email-card__feedback {
      margin-top: 0.75rem; color: var(--nf-color-success-700);
    }
    .check-email-card__error {
      margin-top: 0.75rem; color: var(--nf-color-danger-600);
    }
    a { display: inline-block; margin-top: 1rem; color: var(--nf-color-primary-600); }
  `],
})
export class SignupCheckEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly onboardingApi = inject(OnboardingApiService);

  readonly email = signal(this.route.snapshot.queryParamMap.get('email')?.trim() ?? '');
  readonly resending = signal(false);
  readonly resendSuccess = signal(false);
  readonly resendError = signal(false);
  readonly resendCooldown = signal(0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  async resend(): Promise<void> {
    const address = this.email();
    if (!address || this.resending() || this.resendCooldown() > 0) {
      return;
    }
    this.resending.set(true);
    this.resendSuccess.set(false);
    this.resendError.set(false);
    try {
      await this.onboardingApi.resendVerificationEmail(address);
      this.resendSuccess.set(true);
      this.startCooldown(60);
    } catch {
      this.resendError.set(true);
    } finally {
      this.resending.set(false);
    }
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.cooldownTimer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      if (next <= 0) {
        this.resendCooldown.set(0);
        if (this.cooldownTimer) {
          clearInterval(this.cooldownTimer);
          this.cooldownTimer = null;
        }
      } else {
        this.resendCooldown.set(next);
      }
    }, 1000);
  }
}
