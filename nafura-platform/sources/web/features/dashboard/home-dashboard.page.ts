/**
 * Platform home (`/` / Accueil). Intentionally empty for now — no cards, no widgets.
 * Business content belongs to BCs; rebuild this screen when a real home design lands.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageShellComponent } from '@lib/anatomy/components';

@Component({
  selector: 'nf-home-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageShellComponent],
  template: `<nf-page-shell [scroll]="true"></nf-page-shell>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class HomeDashboardPage {}
