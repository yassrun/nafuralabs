import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Stat card variant types.
 */
export type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Trend data interface.
 */
export interface TrendData {
  value: number;
  direction: 'up' | 'down';
}

/**
 * Stat Card Component
 *
 * KPI/metric display.
 *
 * @example
 * <nf-stat-card
 *   label="Total Items"
 *   [value]="1234"
 *   icon="inventory"
 *   [trend]="{ value: 12, direction: 'up' }">
 * </nf-stat-card>
 */
@Component({
  selector: 'nf-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div [class]="cardClasses()">
      @if (icon()) {
        <div class="nf-stat-card__icon-wrapper">
          <mat-icon class="nf-stat-card__icon">{{ icon() }}</mat-icon>
        </div>
      }
      <div class="nf-stat-card__content">
        <span class="nf-stat-card__label">{{ label() }}</span>
        <div class="nf-stat-card__value-row">
          <span class="nf-stat-card__value">{{ value() }}</span>
          @if (trend()) {
            <span [class]="trendClasses()">
              <mat-icon class="nf-stat-card__trend-icon">
                {{ trend()!.direction === 'up' ? 'trending_up' : 'trending_down' }}
              </mat-icon>
              {{ trend()!.value }}%
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nf-stat-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background-color: var(--nf-color-surface, #fff);
      border-radius: 8px;
      border: 1px solid var(--nf-color-border, #e0e0e0);
    }

    .nf-stat-card__icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background-color: var(--nf-color-surface-variant, #f5f5f5);
    }

    .nf-stat-card__icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--nf-color-text-secondary, #666);
    }

    // Variant colors for icon
    .nf-stat-card--primary .nf-stat-card__icon-wrapper {
      background-color: var(--nf-color-primary-light, rgba(25, 118, 210, 0.1));
    }
    .nf-stat-card--primary .nf-stat-card__icon {
      color: var(--nf-color-primary, #1976d2);
    }

    .nf-stat-card--success .nf-stat-card__icon-wrapper {
      background-color: var(--nf-color-success-light, #e8f5e9);
    }
    .nf-stat-card--success .nf-stat-card__icon {
      color: var(--nf-color-success, #388e3c);
    }

    .nf-stat-card--warning .nf-stat-card__icon-wrapper {
      background-color: var(--nf-color-warning-light, #fff3e0);
    }
    .nf-stat-card--warning .nf-stat-card__icon {
      color: var(--nf-color-warning, #f57c00);
    }

    .nf-stat-card--danger .nf-stat-card__icon-wrapper {
      background-color: var(--nf-color-danger-light, #ffebee);
    }
    .nf-stat-card--danger .nf-stat-card__icon {
      color: var(--nf-color-danger, #d32f2f);
    }

    .nf-stat-card__content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nf-stat-card__label {
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
    }

    .nf-stat-card__value-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nf-stat-card__value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-stat-card__trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .nf-stat-card__trend--up {
      color: var(--nf-color-success, #388e3c);
      background-color: var(--nf-color-success-light, #e8f5e9);
    }

    .nf-stat-card__trend--down {
      color: var(--nf-color-danger, #d32f2f);
      background-color: var(--nf-color-danger-light, #ffebee);
    }

    .nf-stat-card__trend-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
  `],
})
export class StatCardComponent {
  // Inputs
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input<string | undefined>(undefined);
  trend = input<TrendData | undefined>(undefined);
  variant = input<StatCardVariant>('default');

  // Computed classes
  cardClasses = computed(() => {
    return `nf-stat-card nf-stat-card--${this.variant()}`;
  });

  trendClasses = computed(() => {
    const trendData = this.trend();
    if (!trendData) return '';
    return `nf-stat-card__trend nf-stat-card__trend--${trendData.direction}`;
  });
}
