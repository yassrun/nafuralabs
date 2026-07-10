import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  AO_CLIENT_STATUS_KEYS,
  DEVIS_STATUS_KEYS,
  METRE_STATUS_KEYS,
} from '@applications/erp/shell/i18n-labels';

import type {
  AOClientStatus,
  DevisStatus,
  MetreStatus,
} from '../../models';

type AnyStatus = DevisStatus | AOClientStatus | MetreStatus | string;

const KEY_LOOKUP: Record<string, string> = {
  ...(DEVIS_STATUS_KEYS as Record<string, string>),
  ...(METRE_STATUS_KEYS as Record<string, string>),
  ...(AO_CLIENT_STATUS_KEYS as Record<string, string>),
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'archived'> = {
  BROUILLON: 'default',
  EMIS: 'info',
  NEGOCIATION: 'warning',
  APPROUVE: 'success',
  PERDU: 'danger',
  ANNULE: 'archived',
  EXPIRE: 'warning',
  TERMINE: 'success',
  A_ETUDIER: 'default',
  EN_PREPARATION: 'info',
  SOUMIS: 'warning',
  ATTRIBUE: 'success',
  INFRUCTUEUX: 'archived',
};

@Component({
  selector: 'app-etudes-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="esb" [attr.data-variant]="variant()">
      <span class="esb__dot"></span>
      <span class="esb__label">{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .esb {
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
      .esb__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .esb[data-variant='default'] {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
      }
      .esb[data-variant='info'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-700);
      }
      .esb[data-variant='success'] {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }
      .esb[data-variant='warning'] {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
      }
      .esb[data-variant='danger'] {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
      }
      .esb[data-variant='archived'] {
        background: var(--nf-color-primary-100);
        color: var(--nf-color-primary-800);
      }
    `,
  ],
})
export class EtudesStatusBadgeComponent {
  private readonly translate = inject(TranslateService);
  readonly status = input.required<AnyStatus>();

  readonly label = computed(() => {
    const key = KEY_LOOKUP[String(this.status())];
    if (!key) return String(this.status());
    const resolved = this.translate.instant(key);
    return resolved === key ? String(this.status()) : resolved;
  });
  readonly variant = computed(() => STATUS_VARIANT[this.status()] ?? 'default');
}
