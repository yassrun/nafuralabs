import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

/** Sections listed on `/admin` — targets stay under `/administration/*` (canonical feature routes). */
const ADMIN_HUB_SECTIONS: readonly {
  route: string;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    route: '/administration/members',
    labelKey: 'administration.navigation.members',
    descriptionKey: 'administration.hub.descriptions.members',
  },
  {
    route: '/administration/roles',
    labelKey: 'administration.navigation.roles',
    descriptionKey: 'administration.hub.descriptions.roles',
  },
  {
    route: '/administration/domain-activation',
    labelKey: 'administration.navigation.domainActivation',
    descriptionKey: 'administration.hub.descriptions.domainActivation',
  },
  {
    route: '/administration/audit',
    labelKey: 'administration.navigation.audit',
    descriptionKey: 'administration.hub.descriptions.audit',
  },
  {
    route: '/administration/templates',
    labelKey: 'administration.navigation.templates',
    descriptionKey: 'administration.hub.descriptions.templates',
  },
  {
    route: '/administration/email-templates',
    labelKey: 'administration.navigation.emailTemplates',
    descriptionKey: 'administration.hub.descriptions.emailTemplates',
  },
  {
    route: '/administration/workflows',
    labelKey: 'administration.navigation.workflows',
    descriptionKey: 'administration.hub.descriptions.workflows',
  },
  {
    route: '/administration/scheduled-jobs',
    labelKey: 'administration.navigation.scheduledJobs',
    descriptionKey: 'administration.hub.descriptions.scheduledJobs',
  },
  {
    route: '/administration/webhooks',
    labelKey: 'administration.navigation.webhooks',
    descriptionKey: 'administration.hub.descriptions.webhooks',
  },
  {
    route: '/administration/api-keys',
    labelKey: 'administration.navigation.apiKeys',
    descriptionKey: 'administration.hub.descriptions.apiKeys',
  },
  {
    route: '/administration/numbering-sequences',
    labelKey: 'administration.navigation.numberingSequences',
    descriptionKey: 'administration.hub.descriptions.numberingSequences',
  },
  {
    route: '/administration/subscriptions',
    labelKey: 'administration.navigation.subscriptions',
    descriptionKey: 'administration.hub.descriptions.subscriptions',
  },
  {
    route: '/administration/settings',
    labelKey: 'administration.hub.appSettings',
    descriptionKey: 'administration.hub.descriptions.settings',
  },
  {
    route: '/administration/societe',
    labelKey: 'administration.navigation.societe',
    descriptionKey: 'administration.hub.descriptions.societe',
  },
  {
    route: '/administration/parametres-fiscal',
    labelKey: 'administration.navigation.fiscal',
    descriptionKey: 'administration.hub.descriptions.fiscal',
  },
  {
    route: '/administration/audit-log',
    labelKey: 'administration.navigation.auditLog',
    descriptionKey: 'administration.hub.descriptions.auditLog',
  },
  {
    route: '/administration/demo',
    labelKey: 'administration.navigation.demo',
    descriptionKey: 'administration.hub.descriptions.demo',
  },
];

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="{
          title: ('administration.hub.title' | translate),
          subtitle: ('administration.hub.subtitle' | translate),
          breadcrumbs: [{ label: ('administration.navigation.title' | translate), route: '/admin' }]
        }"></nf-page-header>

      <div class="admin-hub" data-testid="admin-hub">
        <p class="admin-hub__intro">{{ 'administration.hub.intro' | translate }}</p>
        <ul class="admin-hub__grid" role="list">
          @for (s of sections; track s.route) {
            <li role="listitem">
              <a class="admin-hub__card" [routerLink]="s.route">
                <span class="admin-hub__card-title">{{ s.labelKey | translate }}</span>
                <span class="admin-hub__card-desc">{{ s.descriptionKey | translate }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </nf-page-shell>
  `,
  styles: `
    .admin-hub {
      padding: 0 var(--nf-space-4, 1rem) var(--nf-space-8, 2rem);
      max-width: 1200px;
    }
    .admin-hub__intro {
      margin: 0 0 var(--nf-space-4, 1rem);
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-muted);
      line-height: 1.5;
    }
    .admin-hub__grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--nf-space-3, 0.75rem);
    }
    .admin-hub__card {
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-1, 0.25rem);
      height: 100%;
      padding: var(--nf-space-4, 1rem);
      border: 1px solid var(--nf-border-default);
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: var(--nf-color-surface);
      text-decoration: none;
      color: inherit;
      transition:
        border-color 120ms ease,
        box-shadow 120ms ease,
        background 120ms ease;
    }
    .admin-hub__card:hover {
      border-color: var(--nf-color-primary-300);
      box-shadow: var(--nf-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.08));
      background: var(--nf-primary-subtle, var(--nf-color-primary-50));
    }
    .admin-hub__card-title {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      color: var(--nf-text-primary);
    }
    .admin-hub__card-desc {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted);
      line-height: 1.4;
    }
  `,
})
export class AdminHubPage {
  readonly sections = ADMIN_HUB_SECTIONS;
}
