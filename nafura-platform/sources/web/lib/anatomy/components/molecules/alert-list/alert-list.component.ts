import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgeComponent } from '../../atoms/badge';
import type { BadgeVariant } from '../../../types';
import { ButtonComponent } from '../../atoms/button';

export type AlertListSeverity = 'info' | 'warning' | 'critical';

export interface AlertListItem {
  id: string;
  severity: AlertListSeverity;
  severityLabel?: string;
  label: string;
  actionLabel: string;
}

@Component({
  selector: 'nf-alert-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  template: `
    <div class="nf-alert-list">
      @for (item of items(); track item.id) {
        <div class="nf-alert-list__item">
          <div class="nf-alert-list__meta">
            <nf-badge
              size="sm"
              rounded
              [variant]="severityVariant(item.severity)">
              {{ item.severityLabel || (item.severity | titlecase) }}
            </nf-badge>
            <span class="nf-alert-list__label">{{ item.label }}</span>
          </div>
          <nf-button
            variant="secondary"
            size="sm"
            (clicked)="onActionClick(item)">
            {{ item.actionLabel }}
          </nf-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nf-alert-list {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-2, 8px);
      }

      .nf-alert-list__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-3, 12px);
        border: 1px solid var(--nf-border-default);
        border-radius: var(--nf-radius-md, 8px);
        background: var(--nf-surface-section);
      }

      .nf-alert-list__meta {
        display: flex;
        align-items: center;
        gap: var(--nf-space-2, 8px);
        color: var(--nf-text-primary);
        font-size: var(--nf-font-size-sm, 0.875rem);
      }

      .nf-alert-list__label {
        color: var(--nf-text-primary);
      }

      @media (max-width: 768px) {
        .nf-alert-list__item {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class AlertListComponent {
  items = input<AlertListItem[]>([]);

  actionClick = output<AlertListItem>();

  severityVariant(severity: AlertListSeverity): BadgeVariant {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  onActionClick(item: AlertListItem): void {
    this.actionClick.emit(item);
  }
}
