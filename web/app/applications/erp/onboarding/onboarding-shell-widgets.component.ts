import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CompletenessMeterComponent } from './components/completeness-meter/completeness-meter.component';
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

@Component({
  selector: 'naf-onboarding-completeness-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompletenessMeterComponent],
  template: `<naf-completeness-meter />`,
})
export class OnboardingCompletenessWidgetComponent {}
