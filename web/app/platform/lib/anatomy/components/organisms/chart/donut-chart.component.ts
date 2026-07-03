import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/** Donut/stacked chart type (CSS-based, no Chart.js). */
export type DonutChartType = 'donut' | 'stacked';

export type ChartTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ChartDatum {
  label: string;
  value: number;
  tone?: ChartTone;
}

interface ChartSegment extends ChartDatum {
  percent: number;
  startAngle: number;
  endAngle: number;
  colorVar: string;
}

/**
 * CSS-based donut or stacked bar chart. Use for simple distribution views.
 * For bar/line/pie/doughnut with Chart.js, use nf-chart instead.
 */
@Component({
  selector: 'nf-donut-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="nf-donut-chart">
      <div class="nf-donut-chart__visual">
        @if (type() === 'donut') {
          <div class="nf-donut-chart__donut" [style.background]="donutBackground()">
            <div class="nf-donut-chart__donut-center">
              <div class="nf-donut-chart__total">{{ total() | number }}</div>
              <div class="nf-donut-chart__label">{{ 'Total' | translate }}</div>
            </div>
          </div>
        } @else {
          <div class="nf-donut-chart__stacked">
            @for (segment of segments(); track segment.label) {
              <div
                class="nf-donut-chart__stacked-segment"
                [style.width.%]="segment.percent"
                [style.backgroundColor]="segment.colorVar"
                [attr.title]="segment.label + ' • ' + segment.value">
              </div>
            }
          </div>
        }
      </div>

      <div class="nf-donut-chart__legend">
        @for (segment of segments(); track segment.label) {
          <button
            type="button"
            class="nf-donut-chart__legend-row"
            (click)="onLegendClick(segment)">
            <span
              class="nf-donut-chart__legend-swatch"
              [style.backgroundColor]="segment.colorVar">
            </span>
            <span class="nf-donut-chart__legend-label">{{ segment.label }}</span>
            <span class="nf-donut-chart__legend-value">{{ segment.value | number }}</span>
            <span class="nf-donut-chart__legend-percent">{{ segment.percent | number:'1.0-0' }}%</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --nf-donut-chart-color-1: var(--nf-color-primary-500);
        --nf-donut-chart-color-2: var(--nf-color-success-500);
        --nf-donut-chart-color-3: var(--nf-color-warning-500);
        --nf-donut-chart-color-4: var(--nf-color-danger-500);
        --nf-donut-chart-color-5: var(--nf-color-info-500);
        --nf-donut-chart-color-6: var(--nf-color-gray-400);
      }

      .nf-donut-chart {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        gap: var(--nf-space-4, 16px);
        align-items: center;
      }

      .nf-donut-chart__visual {
        display: flex;
        justify-content: center;
      }

      .nf-donut-chart__donut {
        position: relative;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: var(--nf-color-border);
      }

      .nf-donut-chart__donut-center {
        position: absolute;
        inset: 16px;
        border-radius: 50%;
        background: var(--nf-surface-section);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .nf-donut-chart__total {
        font-size: var(--nf-font-size-xl, 1.25rem);
        font-weight: var(--nf-font-weight-semibold, 600);
        color: var(--nf-text-primary);
      }

      .nf-donut-chart__label {
        font-size: var(--nf-font-size-xs, 0.75rem);
        color: var(--nf-text-secondary);
      }

      .nf-donut-chart__stacked {
        display: flex;
        width: 100%;
        height: 16px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--nf-border-default);
      }

      .nf-donut-chart__stacked-segment {
        height: 100%;
      }

      .nf-donut-chart__legend {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-2, 8px);
      }

      .nf-donut-chart__legend-row {
        display: grid;
        grid-template-columns: 12px 1fr auto auto;
        gap: var(--nf-space-2, 8px);
        align-items: center;
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-text-primary);
        background: transparent;
        border: 0;
        padding: 0;
        text-align: left;
        cursor: pointer;
      }

      .nf-donut-chart__legend-row:focus-visible {
        outline: 2px solid var(--nf-border-focus);
        outline-offset: 2px;
        border-radius: 6px;
      }

      .nf-donut-chart__legend-swatch {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .nf-donut-chart__legend-label {
        color: var(--nf-text-secondary);
      }

      .nf-donut-chart__legend-value {
        font-weight: var(--nf-font-weight-semibold, 600);
      }

      .nf-donut-chart__legend-percent {
        color: var(--nf-text-muted);
        font-size: var(--nf-font-size-xs, 0.75rem);
      }

      @media (max-width: 1024px) {
        .nf-donut-chart {
          grid-template-columns: 1fr;
          justify-items: start;
        }
      }
    `,
  ],
})
export class DonutChartComponent {
  type = input<DonutChartType>('donut');
  data = input<ChartDatum[]>([]);

  legendClick = output<ChartDatum>();

  total = computed(() => {
    return this.data().reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  });

  segments = computed<ChartSegment[]>(() => {
    const total = this.total();
    if (total <= 0) {
      return [];
    }

    let startAngle = 0;
    return this.data().map((item, index) => {
      const value = Math.max(item.value, 0);
      const percent = (value / total) * 100;
      const angle = (percent / 100) * 360;
      const segment: ChartSegment = {
        ...item,
        percent,
        startAngle,
        endAngle: startAngle + angle,
        colorVar: this.resolveColorVar(item.tone, index),
      };
      startAngle += angle;
      return segment;
    });
  });

  donutBackground = computed(() => {
    const segments = this.segments();
    if (segments.length === 0) {
      return 'conic-gradient(var(--nf-border-default) 0deg, var(--nf-border-default) 360deg)';
    }

    const parts = segments.map((segment) => {
      return `${segment.colorVar} ${segment.startAngle}deg ${segment.endAngle}deg`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  });

  private resolveColorVar(tone: ChartTone | undefined, index: number): string {
    if (tone) {
      switch (tone) {
        case 'primary':
          return 'var(--nf-color-primary-500)';
        case 'success':
          return 'var(--nf-color-success-500)';
        case 'warning':
          return 'var(--nf-color-warning-500)';
        case 'danger':
          return 'var(--nf-color-danger-500)';
        case 'info':
          return 'var(--nf-color-info-500)';
        case 'neutral':
          return 'var(--nf-color-gray-400)';
      }
    }

    const swatchIndex = (index % 6) + 1;
    return `var(--nf-donut-chart-color-${swatchIndex})`;
  }

  onLegendClick(segment: ChartDatum): void {
    this.legendClick.emit(segment);
  }
}
