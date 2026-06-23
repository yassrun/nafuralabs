import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageShellComponent } from '@lib/anatomy';

@Component({
  selector: 'app-locations-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent],
  template: `
    <nf-page-shell [scroll]="true">
      <nav class="subnav" aria-label="Locations">
        <a routerLink="/materiel/locations/contrats" routerLinkActive="active">{{
          'materielGmao.locations.tabContrats' | translate
        }}</a>
        <a routerLink="/materiel/locations/etats" routerLinkActive="active">{{
          'materielGmao.locations.tabEtats' | translate
        }}</a>
        <a routerLink="/materiel/locations/echeances" routerLinkActive="active">{{
          'materielGmao.locations.tabEcheances' | translate
        }}</a>
      </nav>
      <router-outlet />
    </nf-page-shell>
  `,
  styles: [
    `
      .subnav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .subnav a {
        padding: 0.4rem 0.75rem;
        border-radius: 0.4rem;
        text-decoration: none;
        color: var(--nf-text-primary);
        border: 1px solid var(--nf-color-border);
        background: var(--nf-color-surface);
        font-weight: 600;
        font-size: 0.85rem;
      }
      .subnav a.active {
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        border-color: var(--nf-color-primary-700);
      }
    `,
  ],
})
export class LocationsHubPage {}
