import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

import { ErpNotificationCenterAlertsComponent } from '@applications/erp/shell/erp-notification-center-alerts.component';
import { NOTIFICATION_BELL_ADAPTER } from '@platform/features/collaboration/notification/notification-bell.adapter';
import {
  NOTIFICATION_RANGE_OPTIONS,
  NOTIFICATION_SOURCE_OPTIONS,
  NOTIFICATION_STATUS_OPTIONS,
} from './notification-center.config';
import type { NotificationFilters, NotificationItem } from './notifications-api.service';
import { NotificationsFacade } from './notifications.facade';
import { NotificationItemComponent } from './notification-item.component';
import { ConfirmDialogService } from '@lib/anatomy';

@Component({
  selector: 'app-notification-center-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NotificationItemComponent,
    ErpNotificationCenterAlertsComponent,
  ],
  template: `
    <section class="notification-center">
      <header class="notification-center__header">
        <div>
          <h1>{{ 'notifications.center.title' | translate }}</h1>
          <p>{{ 'notifications.center.subtitle' | translate }}</p>
        </div>
        <div class="notification-center__summary">
          <span>{{ 'notifications.center.unread' | translate:{ count: totalPending() } }}</span>
        </div>
      </header>

      @if (hasErpAlerts()) {
        <app-erp-notification-center-alerts />
      }

      <div class="notification-center__layout">
        <aside class="notification-center__filters">
          <h3>{{ 'shared.alerts.centerPlatformSectionTitle' | translate }}</h3>

          <label>
            {{ 'notifications.center.filters.source.label' | translate }}
            <select [ngModel]="filters.source" (ngModelChange)="onSource($event)">
              <option *ngFor="let option of sourceOptions" [value]="option.value">
                {{ option.labelKey | translate }}
              </option>
            </select>
          </label>

          <label>
            {{ 'notifications.center.filters.status.label' | translate }}
            <select [ngModel]="filters.status" (ngModelChange)="onStatus($event)">
              <option *ngFor="let option of statusOptions" [value]="option.value">
                {{ option.labelKey | translate }}
              </option>
            </select>
          </label>

          <label>
            {{ 'notifications.center.filters.range.label' | translate }}
            <select [ngModel]="filters.dateRange" (ngModelChange)="onRange($event)">
              <option *ngFor="let option of rangeOptions" [value]="option.value">
                {{ option.labelKey | translate }}
              </option>
            </select>
          </label>
        </aside>

        <main class="notification-center__list">
          <div class="notification-center__actions">
            <button type="button" (click)="markAllRead()">
              {{ 'notifications.center.actions.markAllRead' | translate }}
            </button>
            <button
              type="button"
              [disabled]="!facade.hasSelection()"
              (click)="markSelectedRead()">
              {{ 'notifications.center.actions.markSelectedRead' | translate }}
            </button>
            <button type="button" (click)="clearOldRead()">
              {{ 'notifications.center.actions.clearOldRead' | translate }}
            </button>
          </div>

          <p *ngIf="facade.loading()">{{ 'notifications.center.loading' | translate }}</p>
          <p *ngIf="facade.error()" class="notification-center__error">{{ facade.error() }}</p>

          <div *ngIf="!facade.loading() && facade.items().length === 0" class="notification-center__empty">
            <span class="material-icons">notifications_none</span>
            <p>{{ 'notifications.center.empty' | translate }}</p>
          </div>

          <div class="notification-center__items">
            <app-notification-item
              *ngFor="let item of facade.items()"
              [notification]="item"
              [selected]="facade.selectedIds().has(item.id)"
              (open)="openNotification($event)"
              (markRead)="markRead($event)"
              (toggleSelection)="facade.toggleSelection($event)">
            </app-notification-item>
          </div>
        </main>
      </div>
    </section>
  `,
  styles: [
    `
      .notification-center {
        padding: 1rem;
        display: grid;
        gap: 1rem;
      }
      .notification-center__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .notification-center__header h1 {
        margin: 0;
      }
      .notification-center__header p {
        margin: 0.25rem 0 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .notification-center__layout {
        display: grid;
        gap: 1rem;
        grid-template-columns: 280px 1fr;
      }
      .notification-center__filters {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 0.75rem;
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }
      .notification-center__filters label {
        display: grid;
        gap: 0.35rem;
      }
      .notification-center__list {
        display: grid;
        gap: 0.75rem;
      }
      .notification-center__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .notification-center__items {
        display: grid;
        gap: 0.5rem;
      }
      .notification-center__empty {
        border: 1px dashed var(--nf-border-default, #d1d5db);
        border-radius: 12px;
        padding: 1.25rem;
        color: var(--nf-text-muted, #6b7280);
        text-align: center;
      }
      .notification-center__error {
        color: var(--nf-color-danger-600, #b91c1c);
      }
      @media (max-width: 900px) {
        .notification-center__layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NotificationCenterPage implements OnInit {
  readonly facade = inject(NotificationsFacade);
  private readonly bellAdapter = inject(NOTIFICATION_BELL_ADAPTER, { optional: true });
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly hasErpAlerts = computed(() => this.bellAdapter?.mode === 'erp-alerts');
  readonly totalPending = computed(
    () => this.facade.unreadCount() + (this.bellAdapter?.count() ?? 0),
  );

  readonly sourceOptions = NOTIFICATION_SOURCE_OPTIONS;
  readonly statusOptions = NOTIFICATION_STATUS_OPTIONS;
  readonly rangeOptions = NOTIFICATION_RANGE_OPTIONS;

  get filters(): NotificationFilters {
    return this.facade.filters();
  }

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.facade.setFilters({
      source: (params.get('source') as NotificationFilters['source']) ?? 'all',
      status: (params.get('status') as NotificationFilters['status']) ?? 'all',
      dateRange: (params.get('range') as NotificationFilters['dateRange']) ?? '7d',
    });
    await this.facade.load();
  }

  onSource(source: string): void {
    this.updateFilters({ source: source as NotificationFilters['source'] });
  }

  onStatus(status: string): void {
    this.updateFilters({ status: status as NotificationFilters['status'] });
  }

  onRange(dateRange: string): void {
    this.updateFilters({ dateRange: dateRange as NotificationFilters['dateRange'] });
  }

  async updateFilters(partial: Partial<NotificationFilters>): Promise<void> {
    const next = { ...this.filters, ...partial };
    this.facade.setFilters(next);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        source: next.source,
        status: next.status,
        range: next.dateRange,
      },
      queryParamsHandling: 'merge',
    });
    await this.facade.load();
  }

  async markRead(id: string): Promise<void> {
    await this.facade.markRead(id);
  }

  async markAllRead(): Promise<void> {
    await this.facade.markAllRead();
  }

  async markSelectedRead(): Promise<void> {
    await this.facade.markSelectedRead();
  }

  async clearOldRead(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('notifications.center.confirmClearOldRead'),
      message: ' ',
      confirmLabel: this.translate.instant('common.actions.delete'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    await this.facade.clearOldRead(30);
  }

  async openNotification(item: NotificationItem): Promise<void> {
    if (!item.isRead) {
      await this.facade.markRead(item.id);
    }
    if (item.actionUrl) {
      await this.router.navigateByUrl(item.actionUrl);
    }
  }
}
