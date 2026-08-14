import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

@Component({
  selector: 'app-epi-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.epi.headerTitle' | translate),
        subtitle: ('hse.epi.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.routes.epi.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <nav class="volets" [attr.aria-label]="'hse.epi.headerTitle' | translate">
        <a routerLink="/hse/epi/reference" routerLinkActive="active">{{ 'hse.epi.volets.reference' | translate }}</a>
        <a routerLink="/hse/epi/attribution" routerLinkActive="active">{{ 'hse.epi.volets.attribution' | translate }}</a>
        <a routerLink="/hse/epi/verification" routerLinkActive="active">{{ 'hse.epi.volets.verification' | translate }}</a>
      </nav>

      <router-outlet />
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .volets { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
    .volets a {
      padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600;
      text-decoration: none; color: var(--nf-color-text-secondary); border: 1px solid var(--nf-color-border); background: var(--nf-color-surface);
    }
    .volets a:hover { background: var(--nf-color-bg-subtle); }
    .volets a.active { background: var(--nf-color-primary-700); color: var(--nf-color-primary-contrast); border-color: var(--nf-color-primary-700); }
  `],
})
export class EpiShellPage {}
