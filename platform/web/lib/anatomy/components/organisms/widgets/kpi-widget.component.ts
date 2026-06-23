import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { WidgetConfig, KpiWidgetConfig as KpiConfig, KpiWidgetData } from './widget.types';

@Component({
  selector: 'nf-kpi-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="nf-kpi-widget" [attr.data-color]="widgetConfig().color">
      @if (widgetConfig().icon) {
        <div class="nf-kpi-widget__icon">
          <mat-icon>{{ widgetConfig().icon }}</mat-icon>
        </div>
      }
      <div class="nf-kpi-widget__value">{{ formattedValue() }}</div>
      @if (trendLabel(); as label) {
        <div
          class="nf-kpi-widget__trend"
          [class.nf-kpi-widget__trend--up-good]="widgetConfig().trendDirection === 'up-good'"
          [class.nf-kpi-widget__trend--down-good]="widgetConfig().trendDirection === 'down-good'"
          [class.nf-kpi-widget__trend--positive]="isTrendPositive()">
          <mat-icon class="nf-kpi-widget__trend-icon">{{ trendIcon() }}</mat-icon>
          <span>{{ trendValue() }}% {{ label }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .nf-kpi-widget {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-2, 8px);
      }

      .nf-kpi-widget__icon {
        color: var(--nf-color-primary-500);
      }

      .nf-kpi-widget__icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .nf-kpi-widget__value {
        font-size: var(--nf-font-size-xl, 1.25rem);
        font-weight: var(--nf-font-weight-semibold, 600);
        color: var(--nf-text-primary);
      }

      .nf-kpi-widget__trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-text-muted);
      }

      .nf-kpi-widget__trend-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .nf-kpi-widget__trend--up-good.nf-kpi-widget__trend--positive,
      .nf-kpi-widget__trend--down-good:not(.nf-kpi-widget__trend--positive) {
        color: var(--nf-color-success-600);
      }

      .nf-kpi-widget__trend--up-good:not(.nf-kpi-widget__trend--positive),
      .nf-kpi-widget__trend--down-good.nf-kpi-widget__trend--positive {
        color: var(--nf-color-danger-600);
      }
    `,
  ],
})
export class KpiWidgetComponent {
  /** Full widget config (used by renderer) */
  config = input.required<WidgetConfig>();
  /** Resolved data from API (generic shape; component treats as KpiWidgetData) */
  data = input<unknown>(null);

  widgetConfig = computed(() => this.config().config as KpiConfig);

  formattedValue = computed(() => {
    const cfg = this.widgetConfig();
    const d = this.data() as KpiWidgetData | null;
    if (d == null || typeof d !== 'object') return '—';
    const raw = (d as Record<string, unknown>)[cfg.valueField] ?? (d as Record<string, unknown>)['value'];
    const num = typeof raw === 'number' ? raw : Number(raw) || 0;
    switch (cfg.format) {
      case 'currency':
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: cfg.currency ?? 'MAD',
          maximumFractionDigits: 0,
        }).format(num);
      case 'percent':
        return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(num / 100);
      default:
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(num);
    }
  });

  trend = computed(() => {
    const cfg = this.widgetConfig();
    const d = this.data() as Record<string, unknown> | null;
    if (d == null || !cfg.trendField) return null;
    const raw = d[cfg.trendField] ?? d['trend'];
    return typeof raw === 'number' ? raw : null;
  });

  trendLabel = computed(() => {
    const d = this.data() as Record<string, unknown> | null;
    return (d && (d['trendLabel'] as string)) || null;
  });

  trendValue = computed(() => {
    const t = this.trend();
    return t === null ? '' : Math.abs(t);
  });

  isTrendPositive = computed(() => (this.trend() ?? 0) > 0);

  trendIcon = computed(() => {
    const cfg = this.widgetConfig();
    const t = this.trend();
    if (t === null) return 'remove';
    const upIsGood = cfg.trendDirection === 'up-good';
    const positive = t > 0;
    if (positive && upIsGood) return 'arrow_upward';
    if (!positive && !upIsGood) return 'arrow_upward';
    return 'arrow_downward';
  });
}
