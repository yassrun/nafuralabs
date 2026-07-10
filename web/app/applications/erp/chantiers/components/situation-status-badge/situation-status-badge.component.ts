import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { SituationStatus } from '../../models';

const STATUS_LABEL: Record<SituationStatus, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Soumise',
  VALIDEE_MOA: 'Validée MOA',
  FACTUREE: 'Facturée',
  PAYEE: 'Payée',
  REJETEE: 'Rejetée',
};

const STATUS_VARIANT: Record<SituationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'archived'> = {
  BROUILLON: 'default',
  SOUMISE: 'warning',
  VALIDEE_MOA: 'info',
  FACTUREE: 'info',
  PAYEE: 'success',
  REJETEE: 'danger',
};

@Component({
  selector: 'app-situation-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ssb" [attr.data-variant]="variant()">
      <span class="ssb__dot"></span>
      <span class="ssb__label">{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .ssb {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
        white-space: nowrap;
      }
      .ssb__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .ssb[data-variant='default'] {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }
      .ssb[data-variant='info'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-700);
      }
      .ssb[data-variant='success'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .ssb[data-variant='warning'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .ssb[data-variant='danger'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .ssb[data-variant='archived'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-800);
      }
    `,
  ],
})
export class SituationStatusBadgeComponent {
  readonly status = input.required<SituationStatus>();

  readonly label = computed(() => STATUS_LABEL[this.status()] ?? this.status());
  readonly variant = computed(() => STATUS_VARIANT[this.status()] ?? 'default');
}
