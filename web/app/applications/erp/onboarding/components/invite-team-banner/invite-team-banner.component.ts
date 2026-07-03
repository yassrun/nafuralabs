import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { OnboardingApiService } from '../../services/onboarding-api.service';

const DISMISS_KEY = 'nafura-onboarding-invite-dismissed';
const MIN_SCORE_TO_SHOW = 80;

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'naf-invite-team-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    @if (visible()) {
      <aside class="invite-banner" role="complementary">
        <nf-button type="button" class="invite-banner__close" (clicked)="dismiss()" aria-label="Fermer" variant="secondary">×</nf-button>
        <p class="invite-banner__title">{{ 'onboarding.invite.title' | translate }}</p>
        <textarea class="invite-banner__emails" rows="2" [(ngModel)]="emailsText" [placeholder]="'onboarding.invite.emails' | translate"></textarea>
        <label>
          <span>{{ 'onboarding.invite.role' | translate }}</span>
          <select [(ngModel)]="defaultRole">
            <option value="MANAGER">Conducteur travaux</option>
            <option value="MEMBER">Comptable</option>
            <option value="VIEWER">Visiteur</option>
          </select>
        </label>
        <div class="invite-banner__actions">
          <nf-button type="button" class="invite-banner__send" (clicked)="send()" [disabled]="sending()" variant="secondary">
            {{ 'onboarding.invite.send' | translate }}
          </nf-button>
          <nf-button type="button" class="invite-banner__later" (clicked)="dismiss()" variant="secondary">
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
      position: absolute; top: 0.5rem; right: 0.5rem; border: 0; background: none;
      font-size: 1.25rem; cursor: pointer; line-height: 1;
    }
    .invite-banner__title { font-weight: 600; margin: 0 0 0.5rem; }
    .invite-banner__emails { width: 100%; box-sizing: border-box; margin-bottom: 0.5rem; font: inherit; }
    .invite-banner__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .invite-banner__send { padding: 0.5rem 1rem; border: 0; border-radius: 6px; background: var(--nf-color-primary-600); color: var(--nf-color-surface); cursor: pointer; }
    .invite-banner__later { padding: 0.5rem 1rem; border: 0; background: none; color: var(--nf-color-primary-600); cursor: pointer; text-decoration: underline; }
  `],
})
export class InviteTeamBannerComponent {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);

  readonly visible = signal(false);
  readonly sending = signal(false);
  emailsText = '';
  defaultRole = 'MANAGER';

  constructor() {
    void this.evaluateVisibility();
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
    const tenantId = this.auth.currentTenant()?.tenant.id;
    if (!tenantId) return;
    const emails = this.emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));
    if (emails.length === 0) return;
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
