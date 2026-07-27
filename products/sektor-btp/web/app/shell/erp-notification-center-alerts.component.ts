import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';

import type { ErpAlert } from './erp-notifications.service';
import { ErpNotificationsService } from './erp-notifications.service';

const TYPE_ICON: Record<string, string> = {
  APPROBATION: '✅',
  FACTURE_RETARD: '💰',
  CAUTION_EXPIRY: '🛡',
  NC_CRITIQUE: '⚠️',
  PILOTAGE: '📊',
};

/** ERP operational alerts block on the full notification center page. */
@Component({
  selector: 'app-erp-notification-center-alerts',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent],
  template: `
    <section class="erp-center-alerts">
      <header class="erp-center-alerts__header">
        <h2>{{ 'shared.alerts.centerSectionTitle' | translate }}</h2>
        <span class="erp-center-alerts__count">{{ svc.totalCount() }}</span>
      </header>

      @if (svc.alerts().length === 0) {
        <p class="erp-center-alerts__empty">{{ 'shared.alerts.noPendingAlert' | translate }}</p>
      } @else {
        <ul class="erp-center-alerts__list">
          @for (alert of svc.alerts(); track alert.id) {
            <li
              class="erp-center-alerts__item"
              [class.erp-center-alerts__item--haute]="alert.urgence === 'HAUTE'"
            >
              <nf-button
                type="button"
                class="erp-center-alerts__btn"
                variant="ghost"
                (clicked)="open(alert)"
              >
                <span class="erp-center-alerts__icon">{{ typeIcon(alert.type) }}</span>
                <span class="erp-center-alerts__body">
                  <strong>{{ alert.titre }}</strong>
                  <span>{{ alert.detail }}</span>
                  <time>{{ alert.date }}</time>
                </span>
              </nf-button>
              <nf-button
                type="button"
                class="erp-center-alerts__dismiss"
                variant="ghost"
                size="sm"
                [attr.aria-label]="'shared.alerts.dismiss' | translate"
                (clicked)="dismiss($event, alert)"
              >
                {{ 'shared.alerts.dismiss' | translate }}
              </nf-button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .erp-center-alerts {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      background: var(--nf-surface-card, #fff);
    }
    .erp-center-alerts__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .erp-center-alerts__header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }
    .erp-center-alerts__count {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--nf-color-primary-100, #dbeafe);
      color: var(--nf-color-primary-800, #1e40af);
    }
    .erp-center-alerts__empty {
      margin: 0;
      color: var(--nf-text-muted, #6b7280);
      font-size: 0.875rem;
    }
    .erp-center-alerts__list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.5rem;
    }
    .erp-center-alerts__item {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      align-items: stretch;
    }
    .erp-center-alerts__item--haute {
      border-inline-start: 4px solid var(--nf-color-danger-600, #dc2626);
    }
    .erp-center-alerts__btn {
      flex: 1;
      min-width: 0;
    }
    .erp-center-alerts__btn ::ng-deep button {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 0.75rem;
      width: 100%;
      height: auto;
      min-height: 0;
      padding: 0.75rem;
      border: none;
      border-radius: 0;
      background: transparent;
      text-align: start;
      font: inherit;
      white-space: normal;
    }
    .erp-center-alerts__btn ::ng-deep .nf-button__content {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      min-width: 0;
    }
    .erp-center-alerts__btn ::ng-deep button:hover:not(:disabled) {
      background: var(--nf-surface-hover, #f9fafb);
    }
    .erp-center-alerts__icon { font-size: 1.25rem; flex-shrink: 0; }
    .erp-center-alerts__body {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }
    .erp-center-alerts__body strong {
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .erp-center-alerts__body span {
      font-size: 0.8125rem;
      color: var(--nf-text-secondary, #6b7280);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .erp-center-alerts__body time {
      font-size: 0.75rem;
      color: var(--nf-text-muted, #9ca3af);
    }
    .erp-center-alerts__dismiss {
      flex-shrink: 0;
      align-self: center;
      margin-inline-end: 0.75rem;
    }
  `],
})
export class ErpNotificationCenterAlertsComponent implements OnInit {
  readonly svc = inject(ErpNotificationsService);

  ngOnInit(): void {
    void this.svc.refresh();
  }

  typeIcon(type: string): string {
    return TYPE_ICON[type] ?? '🔔';
  }

  open(alert: ErpAlert): void {
    this.svc.navigate(alert);
  }

  dismiss(event: Event, alert: ErpAlert): void {
    event.stopPropagation();
    void this.svc.dismiss(alert);
  }
}
