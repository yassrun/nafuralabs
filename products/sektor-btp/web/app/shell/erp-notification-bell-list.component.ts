import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { NotificationBellCloseService } from '@platform/features/collaboration/notification/services/notification-bell-close.service';

import type { ErpAlert } from './erp-notifications.service';
import { ErpNotificationsService } from './erp-notifications.service';

const TYPE_ICON: Record<string, string> = {
  APPROBATION: '✅',
  FACTURE_RETARD: '💰',
  CAUTION_EXPIRY: '🛡',
  NC_CRITIQUE: '⚠️',
  PILOTAGE: '📊',
};

/**
 * Compact ERP alert list for the platform notification bell dropdown.
 */
@Component({
  selector: 'app-erp-notification-bell-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="erp-bell-list">
      @if (svc.alerts().length === 0) {
        <p class="erp-bell-list__empty">{{ 'shared.alerts.noPendingAlert' | translate }}</p>
      } @else {
        <ul class="erp-bell-list__ul">
          @for (alert of svc.alerts(); track alert.id) {
            <li
              class="erp-bell-list__li"
              [class.erp-bell-list__li--haute]="alert.urgence === 'HAUTE'"
            >
              <button type="button" class="erp-bell-list__item" (click)="open(alert)">
                <span class="erp-bell-list__icon" aria-hidden="true">{{ typeIcon(alert.type) }}</span>
                <span class="erp-bell-list__body">
                  <span class="erp-bell-list__title">{{ alert.titre }}</span>
                  <span class="erp-bell-list__detail">{{ alert.detail }}</span>
                </span>
                @if (alert.urgence === 'HAUTE') {
                  <span class="erp-bell-list__dot" aria-hidden="true"></span>
                }
              </button>
              <button
                type="button"
                class="erp-bell-list__dismiss"
                [attr.aria-label]="'shared.alerts.dismiss' | translate"
                (click)="dismiss($event, alert)"
              >
                ×
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .erp-bell-list { padding: 4px 0; }
    .erp-bell-list__empty {
      margin: 0;
      padding: 12px;
      color: var(--nf-text-muted, #6b7280);
      font-size: 0.875rem;
      text-align: center;
    }
    .erp-bell-list__ul { margin: 0; padding: 0; list-style: none; }
    .erp-bell-list__li { border-bottom: 1px solid var(--nf-border-default, #e5e7eb); display: flex; align-items: stretch; }
    .erp-bell-list__li:last-child { border-bottom: none; }
    .erp-bell-list__li--haute { border-inline-start: 3px solid var(--nf-color-danger-600, #dc2626); }
    .erp-bell-list__item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: start;
      font: inherit;
      color: inherit;
    }
    .erp-bell-list__item:hover { background: var(--nf-surface-hover, #f3f4f6); }
    .erp-bell-list__icon { flex-shrink: 0; font-size: 1.1rem; line-height: 1.3; }
    .erp-bell-list__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .erp-bell-list__title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--nf-text-primary, #111827);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .erp-bell-list__detail {
      font-size: 0.78rem;
      color: var(--nf-text-secondary, #6b7280);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .erp-bell-list__dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-top: 4px;
      border-radius: 50%;
      background: var(--nf-color-danger-600, #dc2626);
    }
    .erp-bell-list__dismiss {
      flex-shrink: 0;
      width: 32px;
      border: none;
      background: transparent;
      color: var(--nf-text-muted, #9ca3af);
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    }
    .erp-bell-list__dismiss:hover { color: var(--nf-text-primary, #111827); background: var(--nf-surface-hover, #f3f4f6); }
  `],
})
export class ErpNotificationBellListComponent {
  readonly svc = inject(ErpNotificationsService);
  private readonly bellClose = inject(NotificationBellCloseService);

  typeIcon(type: string): string {
    return TYPE_ICON[type] ?? '🔔';
  }

  open(alert: ErpAlert): void {
    this.svc.navigate(alert);
    this.bellClose.close();
  }

  dismiss(event: Event, alert: ErpAlert): void {
    event.stopPropagation();
    void this.svc.dismiss(alert);
  }
}
