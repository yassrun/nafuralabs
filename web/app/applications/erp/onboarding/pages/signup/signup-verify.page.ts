import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { OnboardingApiService } from '../../services/onboarding-api.service';

@Component({
  selector: 'naf-signup-verify-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, RouterLink],
  template: `
    <section class="verify-card" aria-labelledby="verify-title">
      <h1 id="verify-title">{{ 'onboarding.signup.verifyTitle' | translate }}</h1>
      @if (busy()) {
        <p>{{ 'onboarding.signup.verifyPending' | translate }}</p>
      } @else if (error()) {
        <p class="verify-error" role="alert">{{ error() }}</p>
        <a routerLink="/signup">{{ 'onboarding.signup.backToSignup' | translate }}</a>
      } @else if (success()) {
        <p class="verify-ok">{{ 'onboarding.signup.verifySuccess' | translate }}</p>
      }
    </section>
  `,
  styles: [`
    .verify-card {
      max-width: 420px; margin: 0 auto; padding: 1.5rem;
      background: var(--nf-color-surface); border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.06);
    }
    .verify-error { color: var(--nf-color-danger-700); }
    .verify-ok { color: var(--nf-color-success-700); }
  `],
})
export class SignupVerifyPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);
  private readonly translate = inject(TranslateService);

  readonly busy = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  ngOnInit(): void {
    void this.verify();
  }

  private async verify(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.busy.set(false);
      this.error.set(this.translate.instant('onboarding.signup.verifyMissingToken'));
      return;
    }
    try {
      const result = await this.api.verifyEmail(token);
      await this.auth.completeEmailVerification(result);
      this.success.set(true);
      this.busy.set(false);
      await this.router.navigateByUrl('/onboarding');
    } catch {
      this.busy.set(false);
      this.error.set(this.translate.instant('onboarding.signup.verifyFailed'));
    }
  }
}
