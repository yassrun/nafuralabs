import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { ButtonComponent } from '@lib/anatomy';
import { OnboardingApiService } from '../../services/onboarding-api.service';

const DISMISS_KEY = 'nafura-onboarding-invite-dismissed';
const MIN_SCORE_TO_SHOW = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'naf-invite-team-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    @if (visible()) {
      <aside class="invite-banner" role="complementary">
        <nf-button type="button" class="invite-banner__close" (clicked)="dismiss()" [attr.aria-label]="'onboarding.invite.dismiss' | translate" variant="ghost" size="sm">×</nf-button>
        <p class="invite-banner__title">{{ 'onboarding.invite.title' | translate }}</p>
        <label class="invite-banner__field">
          <span class="invite-banner__sr">{{ 'onboarding.invite.emails' | translate }}</span>
          <textarea
            class="invite-banner__emails"
            rows="2"
            [(ngModel)]="emailsText"
            (ngModelChange)="onEmailsChange()"
            (blur)="touched.set(true)"
            [attr.aria-invalid]="showEmailsError()"
            [attr.aria-describedby]="showEmailsError() ? 'invite-emails-error' : null"
            [placeholder]="'onboarding.invite.emails' | translate"></textarea>
          @if (showEmailsError()) {
            <small id="invite-emails-error" class="invite-banner__error" role="alert">
              {{ emailsErrorKey() | translate }}
            </small>
          }
        </label>
        <label>
          <span>{{ 'onboarding.invite.role' | translate }}</span>
          <select [(ngModel)]="defaultRole">
            <option value="MANAGER">Conducteur travaux</option>
            <option value="MEMBER">Comptable</option>
            <option value="VIEWER">Visiteur</option>
          </select>
        </label>
        <div class="invite-banner__actions">
          <nf-button
            type="button"
            class="invite-banner__send"
            (clicked)="send()"
            [disabled]="!canSend()"
            variant="primary">
            {{ 'onboarding.invite.send' | translate }}
          </nf-button>
          <nf-button type="button" class="invite-banner__later" (clicked)="dismiss()" variant="ghost">
            {{ 'onboarding.invite.dismiss' | translate }}
          </nf-button>
        </div>
      </aside>
    }
  `,
  styles: [`
    .invite-banner {
      position: sticky; top: 0; z-index: 20;
      margin: 0 0 1rem; padding: 1rem 2.5rem 1rem 1rem;
      background: linear-gradient(90deg, var(--nf-color-primary-50), var(--nf-color-success-50));
      border: 1px solid var(--nf-color-primary-200); border-radius: 10px;
    }
    .invite-banner__close {
      position: absolute; top: 0.5rem; right: 0.5rem;
    }
    .invite-banner__title { font-weight: 600; margin: 0 0 0.5rem; }
    .invite-banner__field { display: block; margin-bottom: 0.5rem; }
    .invite-banner__sr {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
    .invite-banner__emails {
      width: 100%; box-sizing: border-box; font: inherit;
      border: 1px solid var(--nf-border-default); border-radius: 8px; padding: 0.5rem 0.65rem;
    }
    .invite-banner__emails[aria-invalid='true'] {
      border-color: var(--nf-color-danger-500, #dc2626);
    }
    .invite-banner__error {
      display: block; margin-top: 0.35rem;
      color: var(--nf-color-danger-700); font-size: 0.8125rem;
    }
    .invite-banner__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
  `],
})
export class InviteTeamBannerComponent {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);

  readonly visible = signal(false);
  readonly sending = signal(false);
  readonly touched = signal(false);
  /** Bumps when emailsText changes so computed/canSend stay fresh under OnPush. */
  readonly emailsTick = signal(0);

  emailsText = '';
  defaultRole = 'MANAGER';

  readonly parsedEmails = computed(() => {
    this.emailsTick();
    return this.parseEmails(this.emailsText);
  });

  constructor() {
    void this.evaluateVisibility();
  }

  onEmailsChange(): void {
    this.emailsTick.update((n) => n + 1);
  }

  canSend(): boolean {
    const { valid, invalid } = this.parsedEmails();
    return !this.sending() && valid.length > 0 && invalid.length === 0;
  }

  showEmailsError(): boolean {
    if (!this.touched()) {
      return false;
    }
    const { valid, invalid, rawTokens } = this.parsedEmails();
    return rawTokens.length === 0 || valid.length === 0 || invalid.length > 0;
  }

  emailsErrorKey(): string {
    const { valid, invalid, rawTokens } = this.parsedEmails();
    if (rawTokens.length === 0 || valid.length === 0) {
      return 'onboarding.invite.emailsRequired';
    }
    if (invalid.length > 0) {
      return 'onboarding.invite.emailsInvalid';
    }
    return 'onboarding.invite.emailsRequired';
  }

  dismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
    this.visible.set(false);
  }

  async send(): Promise<void> {
    this.touched.set(true);
    if (!this.canSend()) {
      return;
    }
    const tenantId = this.auth.currentTenant()?.tenant.id;
    if (!tenantId) {
      return;
    }
    const emails = this.parsedEmails().valid;
    this.sending.set(true);
    try {
      const result = await this.api.bulkInvite(tenantId, { emails, defaultRole: this.defaultRole });
      if (result.sent >= 3) {
        this.dismiss();
      }
    } finally {
      this.sending.set(false);
    }
  }

  private parseEmails(text: string): { valid: string[]; invalid: string[]; rawTokens: string[] } {
    const rawTokens = text
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const token of rawTokens) {
      if (EMAIL_RE.test(token)) {
        valid.push(token);
      } else {
        invalid.push(token);
      }
    }
    return { valid, invalid, rawTokens };
  }

  private async evaluateVisibility(): Promise<void> {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        return;
      }
    } catch {
      /* noop */
    }

    const tenantId = this.auth.currentTenant()?.tenant.id;
    if (!tenantId || tenantId === 'pending-tenant') {
      return;
    }

    try {
      const result = await this.api.getCompleteness(tenantId);
      if (result.score >= MIN_SCORE_TO_SHOW) {
        this.visible.set(true);
      }
    } catch {
      /* hide until completeness is known */
    }
  }
}
