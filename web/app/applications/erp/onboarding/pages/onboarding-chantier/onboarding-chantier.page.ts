import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '@core/security/services/auth.facade';
import { ChantierCreatePage } from '../../../pages/chantiers/create/chantier-create.page';
import { OnboardingApiService } from '../../services/onboarding-api.service';

/**
 * Wraps the existing 5-step chantier wizard for onboarding (status pré-rempli via query).
 */
@Component({
  selector: 'naf-onboarding-chantier-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChantierCreatePage],
  template: `
    @if (ready()) {
      <app-chantier-create [onboardingMode]="true" (created)="onCreated($event)"></app-chantier-create>
    }
  `,
})
export class OnboardingChantierPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly onboardingApi = inject(OnboardingApiService);

  readonly ready = signal(false);

  ngOnInit(): void {
    void this.bootstrap();
  }

  /** Re-attach tenant + X-Tenant-Id after reload (onboarding JWT has no Keycloak refresh). */
  private async bootstrap(): Promise<void> {
    await this.ensureTenantContext();
    this.ready.set(true);
  }

  private async ensureTenantContext(): Promise<void> {
    if (this.auth.currentTenant()?.tenant.id) {
      return;
    }
    try {
      const state = await this.onboardingApi.getState();
      if (!state.tenantId) {
        return;
      }
      const answers = state.answers as Record<string, string>;
      const companyName = answers['companyName'] ?? answers['nom'] ?? 'Tenant';
      await this.auth.attachOnboardingTenant(state.tenantId, companyName, state.tenantId);
    } catch {
      // Chantier wizard still renders; lookups may fail until session is restored.
    }
  }

  onCreated(payload: { name: string }): void {
    void this.router.navigate(['/dashboard'], {
      queryParams: { onboardingWelcome: '1', chantierName: payload.name },
    });
  }
}
