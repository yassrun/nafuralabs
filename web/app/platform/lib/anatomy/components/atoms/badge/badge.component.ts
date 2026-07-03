import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { BadgeVariant } from '../../../types';

/**
 * Badge size types.
 */
export type BadgeSize = 'sm' | 'md';

/**
 * Badge Component
 *
 * Status indicators and labels.
 *
 * @stable
 *
 * @example
 * <nf-badge variant="success">Active</nf-badge>
 * <nf-badge variant="danger" icon="error">Failed</nf-badge>
 * <nf-badge variant="info" rounded>New</nf-badge>
 */
@Component({
  selector: 'nf-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span [class]="badgeClasses()">
      @if (icon()) {
        <mat-icon class="nf-badge__icon">{{ icon() }}</mat-icon>
      }
      <span class="nf-badge__content">
        <ng-content></ng-content>
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .nf-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      border-radius: 4px;
      white-space: nowrap;
    }

    // Sizes
    .nf-badge--sm {
      padding: 2px 6px;
      font-size: 0.6875rem;
    }

    .nf-badge--md {
      padding: 4px 8px;
      font-size: 0.75rem;
    }

    // Rounded (pill shape)
    .nf-badge--rounded {
      border-radius: 100px;
    }

    // Variants
    .nf-badge--default {
      background-color: var(--nf-color-surface, #e0e0e0);
      color: var(--nf-color-text, #333);
    }

    .nf-badge--success {
      background-color: var(--nf-color-success-light, #e8f5e9);
      color: var(--nf-color-success-700, #15803d);
    }

    .nf-badge--warning {
      background-color: var(--nf-color-warning-light, #fff3e0);
      color: var(--nf-color-warning-700, #b45309);
    }

    .nf-badge--danger {
      background-color: var(--nf-color-danger-light, #ffebee);
      color: var(--nf-color-danger-700, #b91c1c);
    }

    .nf-badge--info {
      background-color: var(--nf-color-info-light, #e3f2fd);
      color: var(--nf-color-info-700, #0369a1);
    }

    // Icon
    .nf-badge__icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .nf-badge--sm .nf-badge__icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }
  `],
})
export class BadgeComponent {
  // Inputs
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('md');
  rounded = input<boolean>(false);
  icon = input<string | undefined>(undefined);

  // Computed classes
  badgeClasses = computed(() => {
    const classes = [
      'nf-badge',
      `nf-badge--${this.variant()}`,
      `nf-badge--${this.size()}`,
    ];

    if (this.rounded()) {
      classes.push('nf-badge--rounded');
    }

    return classes.join(' ');
  });
}
