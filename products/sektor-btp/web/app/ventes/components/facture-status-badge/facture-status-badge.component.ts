import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type {
  AvoirStatus,
  FactureStatus,
  RetenueGarantieStatus,
} from '../../models';

type AnyStatus = FactureStatus | AvoirStatus | RetenueGarantieStatus | string;

const STATUS_LABEL: Record<string, string> = {
  // Facture
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PARTIELLEMENT_PAYEE: 'Part. payée',
  PAYEE: 'Payée',
  EN_LITIGE: 'En litige',
  AVOIRISEE: 'Avoirisée',
  ANNULEE: 'Annulée',
  // Avoir
  EMIS: 'Émis',
  IMPUTE: 'Imputé',
  REMBOURSE: 'Remboursé',
  ANNULE: 'Annulé',
  // Retenue garantie
  EN_COURS: 'En cours',
  LIBERATION_DEMANDEE: 'Libération demandée',
  LIBEREE: 'Libérée',
  CONTESTEE: 'Contestée',
};

const STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'archived'
> = {
  BROUILLON: 'default',
  EMISE: 'info',
  PARTIELLEMENT_PAYEE: 'warning',
  PAYEE: 'success',
  EN_LITIGE: 'danger',
  AVOIRISEE: 'archived',
  ANNULEE: 'archived',
  EMIS: 'info',
  IMPUTE: 'success',
  REMBOURSE: 'success',
  ANNULE: 'archived',
  EN_COURS: 'info',
  LIBERATION_DEMANDEE: 'warning',
  LIBEREE: 'success',
  CONTESTEE: 'danger',
};

@Component({
  selector: 'app-facture-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="fsb" [attr.data-variant]="variant()">
      <span class="fsb__dot"></span>
      <span class="fsb__label">{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .fsb {
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
      .fsb__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .fsb[data-variant='default'] {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }
      .fsb[data-variant='info'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-700);
      }
      .fsb[data-variant='success'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .fsb[data-variant='warning'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .fsb[data-variant='danger'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .fsb[data-variant='archived'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-800);
      }
    `,
  ],
})
export class FactureStatusBadgeComponent {
  readonly status = input.required<AnyStatus>();

  readonly label = computed(() => STATUS_LABEL[this.status()] ?? this.status());
  readonly variant = computed(() => STATUS_VARIANT[this.status()] ?? 'default');
}
