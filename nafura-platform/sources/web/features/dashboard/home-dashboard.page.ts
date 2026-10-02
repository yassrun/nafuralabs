/**
 * Platform home: quick access to every screen the user may open (capabilities and business contexts),
 * plus recent activity when the audit log is readable. No business widget: those belong to BCs.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  PageShellComponent,
  PageHeaderComponent,
  DashboardGridComponent,
  WidgetRendererComponent,
} from '@lib/anatomy/components';
import type { WidgetConfig } from '@lib/anatomy/components/organisms/widgets/widget.types';
import { AuthStateStore } from '@core/security/state/auth.state';
import { APP_SHELL_CONFIG, APP_SHELL_ACCESS } from '../../platform/app-shell/app-shell.config';
import type { AppShellNavigationItem } from '../../platform/app-shell/app-shell.types';
import { grants, visibleNavigation } from '../../platform/app-shell/navigation-access';

const AUDIT_READ = 'administration.audit.read';

const RECENT_ACTIVITY: WidgetConfig = {
  id: 'recent-activity',
  type: 'activity',
  title: 'dashboard.widgets.recentActivity',
  span: 'full',
  dataSource: {
    endpoint: '/api/v1/platform/collaboration/audit/log',
    params: { size: '10', sort: 'eventAt', direction: 'desc' },
  },
  config: { maxItems: 10 },
};

@Component({
  selector: 'nf-home-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslateModule,
    LucideAngularModule,
    PageShellComponent,
    PageHeaderComponent,
    DashboardGridComponent,
    WidgetRendererComponent,
  ],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="headerConfig()" />

      @for (section of sections(); track section.id) {
        <section class="nf-home__section" [attr.aria-labelledby]="'home-' + section.id">
          <h2 class="nf-home__section-title" [id]="'home-' + section.id">{{ section.label }}</h2>
          <ul class="nf-home__cards">
            @for (item of section.items; track item.id) {
              <li>
                <a class="nf-home__card" [routerLink]="item.route">
                  <span class="nf-home__card-icon" aria-hidden="true">
                    <lucide-icon [name]="item.icon || 'circle'" [size]="20"></lucide-icon>
                  </span>
                  <span class="nf-home__card-label">{{ item.label }}</span>
                  <lucide-icon class="nf-home__card-arrow" name="chevron-right" [size]="16" aria-hidden="true"></lucide-icon>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      @if (showActivity()) {
        <nf-dashboard-grid>
          <nf-widget [config]="activity" />
        </nf-dashboard-grid>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .nf-home__section { margin-bottom: var(--nf-space-6, 24px); }
      .nf-home__section-title {
        margin: 0 0 var(--nf-space-3, 12px);
        font-size: var(--nf-font-size-sm, 0.875rem);
        font-weight: var(--nf-font-weight-semibold, 600);
        color: var(--nf-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .nf-home__cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--nf-space-3, 12px);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .nf-home__card {
        display: flex;
        align-items: center;
        gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-3, 12px) var(--nf-space-4, 16px);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-lg, 12px);
        background: var(--nf-surface-card, #fff);
        color: var(--nf-text-primary);
        text-decoration: none;
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .nf-home__card:hover,
      .nf-home__card:focus-visible {
        border-color: var(--nf-color-primary-400, #60a5fa);
        box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
        outline: none;
      }
      .nf-home__card-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--nf-radius-md, 8px);
        background: var(--nf-color-primary-50, #eff6ff);
        color: var(--nf-color-primary-600, #2563eb);
        flex: none;
      }
      .nf-home__card-label { flex: 1; font-weight: var(--nf-font-weight-medium, 500); }
      .nf-home__card-arrow { color: var(--nf-text-tertiary, #9ca3af); }
    `,
  ],
})
export class HomeDashboardPage {
  private readonly shell = inject(APP_SHELL_CONFIG);
  private readonly access = inject(APP_SHELL_ACCESS, { optional: true });
  private readonly auth = inject(AuthStateStore);

  readonly activity = RECENT_ACTIVITY;

  /** One card section per navigation group (a BC, Administration…), loose links under their zone. */
  readonly sections = computed(() => {
    const navigation = this.access ? visibleNavigation(this.shell.sidebar.navigation, this.access()) : this.shell.sidebar.navigation;
    const leaves = (items: readonly AppShellNavigationItem[]): AppShellNavigationItem[] =>
      items.flatMap((item) => (item.children?.length ? leaves(item.children) : item.route && item.route !== '/dashboard' ? [item] : []));
    return navigation
      .flatMap((section) => [
        { id: section.id, label: section.label || 'Espace de travail', items: leaves(section.items.filter((item) => !item.children?.length)) },
        ...section.items
          .filter((item) => item.children?.length)
          .map((group) => ({ id: group.id, label: group.label, items: leaves(group.children!) })),
      ])
      .filter((section) => section.items.length > 0);
  });

  readonly showActivity = computed(() => {
    const permissions = this.access?.().permissions;
    const routes = (items: readonly AppShellNavigationItem[]): string[] =>
      items.flatMap((item) => [item.route ?? '', ...routes(item.children ?? [])]);
    const auditMounted = this.shell.sidebar.navigation.some((s) => routes(s.items).includes('/administration/audit'));
    return auditMounted && !!permissions && grants(permissions, AUDIT_READ);
  });

  readonly headerConfig = computed(() => {
    const name = this.auth.user()?.profile?.firstName;
    return {
      title: name ? `Bonjour ${name}` : 'dashboard.title',
      subtitle: 'dashboard.subtitle',
      icon: 'home',
    };
  });
}
