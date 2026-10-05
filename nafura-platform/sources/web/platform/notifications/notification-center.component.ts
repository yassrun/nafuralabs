import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '../../lib/anatomy/components/atoms/button';
import { NfSelectComponent } from '../../lib/anatomy/components/atoms/select';
import { EmptyStateComponent } from '../../lib/anatomy/components/molecules/empty-state';
import { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
import { TabsComponent, type TabItem } from '../../lib/anatomy/components/molecules/tabs';
import { formatRelativeTime } from '../../lib/anatomy/utils/relative-time';
import type { NotificationInboxView } from './notifications-api.types';
import { PlatformNotificationsService } from './notifications.service';
import type { PlatformNotification } from './notifications.types';

@Component({
  selector: 'nf-platform-notification-center',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    LucideAngularModule,
    ButtonComponent,
    NfSelectComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-platform-notification-center">
      <header class="nf-platform-notification-center__header">
        <div>
          <h1>{{ 'notifications.center.title' | translate }}</h1>
          <p class="nf-platform-notification-center__subtitle">
            {{ 'notifications.center.subtitle' | translate }}
          </p>
        </div>
        <div class="nf-platform-notification-center__summary">
          {{ 'notifications.center.unread' | translate: { count: notifications.unreadCount() } }}
        </div>
      </header>

      <div class="nf-platform-notification-center__tabs">
        <nf-tabs
          [tabs]="tabs()"
          [activeTab]="notifications.view()"
          (tabChange)="onView($event)" />
      </div>

      <div class="nf-platform-notification-center__toolbar">
        <nf-select
          class="nf-platform-notification-center__source"
          [label]="'notifications.center.filters.source.label' | translate"
          [options]="sourceOptions()"
          [ngModel]="notifications.source()"
          (ngModelChange)="onSource($event)" />
        <nf-button
          variant="primary"
          size="sm"
          [disabled]="notifications.unreadCount() === 0"
          (clicked)="markAllRead()">
          {{ 'notifications.center.actions.markAllRead' | translate }}
        </nf-button>
        <nf-button variant="secondary" size="sm" (clicked)="retry()">
          {{ 'notifications.center.refresh' | translate }}
        </nf-button>
      </div>

      @if (notifications.loading()) {
        <nf-loading-state />
      } @else if (notifications.error()) {
        <nf-empty-state
          icon="bell-ring"
          [title]="notifications.error()!"
          [actionLabel]="'notifications.center.retry' | translate"
          (action)="retry()" />
      } @else if (notifications.notifications().length === 0) {
        <nf-empty-state
          icon="bell-ring"
          [title]="'notifications.center.empty' | translate"
          [message]="'notifications.center.emptyHint' | translate" />
      } @else {
        <div class="nf-platform-notification-center__list" role="list">
          @for (notification of notifications.notifications(); track notification.id) {
            <article
              role="listitem"
              class="nf-platform-notification-center__item"
              [class.nf-platform-notification-center__item--unread]="!notification.read"
              [class.nf-platform-notification-center__item--link]="!!notification.route"
              (click)="open(notification)">
              <div
                class="nf-platform-notification-center__dot"
                [class.nf-platform-notification-center__dot--on]="!notification.read"
                aria-hidden="true"></div>
              <div class="nf-platform-notification-center__item-content">
                @if (notification.sourceLabel) {
                  <span class="nf-platform-notification-center__source">{{ notification.sourceLabel }}</span>
                }
                <h2>{{ notification.title }}</h2>
                @if (notification.message) {
                  <p>{{ notification.message }}</p>
                }
                @if (notification.createdAt) {
                  <time [attr.datetime]="notification.createdAt">{{ relative(notification.createdAt) }}</time>
                }
              </div>
              <div class="nf-platform-notification-center__item-actions">
                @if (!notification.read) {
                  <nf-button
                    variant="ghost"
                    size="sm"
                    (clicked)="markRead($event, notification.id)">
                    {{ 'notifications.center.actions.markRead' | translate }}
                  </nf-button>
                }
                @if (notification.route) {
                  <lucide-icon name="chevron-right" [size]="18" aria-hidden="true"></lucide-icon>
                }
              </div>
            </article>
          }
        </div>

        @if (notifications.hasMore()) {
          <div class="nf-platform-notification-center__more">
            <nf-button
              variant="secondary"
              size="sm"
              [loading]="notifications.loadingMore()"
              (clicked)="loadMore()">
              {{ 'notifications.center.loadMore' | translate }}
            </nf-button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .nf-platform-notification-center {
      max-width: 980px;
      margin: 0 auto;
      padding: 32px;
      display: grid;
      gap: 16px;
    }
    .nf-platform-notification-center__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    h1 { margin: 0; font-size: 1.75rem; }
    .nf-platform-notification-center__subtitle {
      margin: 8px 0 0;
      color: var(--nf-text-muted, #64748b);
    }
    .nf-platform-notification-center__summary {
      color: var(--nf-text-muted, #64748b);
      font-size: .875rem;
      white-space: nowrap;
    }
    .nf-platform-notification-center__toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
    .nf-platform-notification-center__source { width: min(280px, 100%); }
    .nf-platform-notification-center__tabs {
      justify-self: start;
      max-width: 100%;
    }
    .nf-platform-notification-center__tabs ::ng-deep .mat-mdc-tab-header {
      --mdc-secondary-navigation-tab-container-height: 40px;
    }
    .nf-platform-notification-center__tabs ::ng-deep .mat-mdc-tab-labels {
      justify-content: flex-start;
    }
    .nf-platform-notification-center__list { display: grid; gap: 8px; }
    .nf-platform-notification-center__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 8px;
      background: var(--nf-color-surface, #fff);
    }
    .nf-platform-notification-center__item--unread {
      background: var(--nf-color-primary-50, #eff6ff);
      border-color: color-mix(in srgb, var(--nf-color-primary-600, #2563eb) 25%, var(--nf-border-default, #e2e8f0));
    }
    .nf-platform-notification-center__item--link { cursor: pointer; }
    .nf-platform-notification-center__item--link:hover {
      border-color: var(--nf-border-focus, #3b82f6);
    }
    .nf-platform-notification-center__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      background: transparent;
    }
    .nf-platform-notification-center__dot--on {
      background: var(--nf-color-primary-600, #2563eb);
    }
    .nf-platform-notification-center__item-content { flex: 1; min-width: 0; }
    .nf-platform-notification-center__source {
      display: inline-block;
      margin-bottom: 4px;
      color: var(--nf-color-primary-700, #1d4ed8);
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .nf-platform-notification-center__item h2 {
      margin: 0;
      font-size: .9375rem;
      font-weight: 600;
    }
    .nf-platform-notification-center__item p {
      margin: 4px 0 0;
      color: var(--nf-text-muted, #64748b);
      font-size: .8125rem;
    }
    .nf-platform-notification-center__item time {
      display: block;
      margin-top: 6px;
      color: var(--nf-text-muted, #94a3b8);
      font-size: .75rem;
    }
    .nf-platform-notification-center__item-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--nf-text-muted, #94a3b8);
      flex-shrink: 0;
    }
    .nf-platform-notification-center__more {
      display: flex;
      justify-content: center;
      padding-top: 4px;
    }
    @media (max-width: 600px) {
      .nf-platform-notification-center { padding: 20px 12px; }
      .nf-platform-notification-center__header { flex-direction: column; gap: 8px; }
      .nf-platform-notification-center__item { align-items: flex-start; }
    }
  `],
})
export class PlatformNotificationCenterComponent {
  readonly notifications = inject(PlatformNotificationsService);
  private readonly translate = inject(TranslateService);

  readonly tabs = computed<TabItem[]>(() => {
    const unread = this.notifications.unreadCount();
    return [
      {
        id: 'unread',
        label: this.translate.instant('notifications.center.filters.status.unread'),
        badge: unread > 0 ? String(unread > 99 ? '99+' : unread) : undefined,
      },
      { id: 'all', label: this.translate.instant('notifications.center.filters.status.all') },
      { id: 'read', label: this.translate.instant('notifications.center.filters.status.read') },
    ];
  });

  readonly sourceOptions = computed(() => [
    { value: '', label: this.translate.instant('notifications.center.filters.source.all') },
    ...this.notifications.eventOptions().map((event) => ({ value: event.event, label: event.label })),
  ]);

  constructor() {
    this.notifications.initialize();
  }

  relative(value: string): string {
    return formatRelativeTime(value);
  }

  onView(tabId: string): void {
    void this.notifications.setView(tabId as NotificationInboxView);
  }

  onSource(source: string): void {
    void this.notifications.setSource(source ?? '');
  }

  retry(): void {
    void this.notifications.load();
  }

  loadMore(): void {
    void this.notifications.loadMore();
  }

  markAllRead(): void {
    void this.notifications.markAllRead();
  }

  markRead(event: Event, id: string): void {
    event.stopPropagation();
    void this.notifications.markRead(id);
  }

  open(notification: PlatformNotification): void {
    void this.notifications.open(notification);
  }
}
