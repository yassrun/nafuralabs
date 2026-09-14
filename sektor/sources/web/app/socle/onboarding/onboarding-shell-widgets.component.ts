import { ChangeDetectionStrategy, Component } from '@angular/core';

import { InviteTeamBannerComponent } from './components/invite-team-banner/invite-team-banner.component';

/** Lazy-loaded shell widgets (keeps main bundle smaller). */
@Component({
  selector: 'naf-onboarding-shell-widgets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InviteTeamBannerComponent],
  template: `
    <naf-invite-team-banner />
  `,
})
export class OnboardingInviteBannerWidgetComponent {}
