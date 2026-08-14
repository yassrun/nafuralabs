import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutChartComponent, type ChartDatum } from '../chart';
import type { WidgetConfig, ChartWidgetConfig as ChartConfig, ChartWidgetData } from './widget.types';

@Component({
  selector: 'nf-chart-widget',
  standalone: true,
  imports: [CommonModule, DonutChartComponent],
  template: `
    <div class="nf-chart-widget">
      @if (chartData().length > 0) {
        <nf-donut-chart [type]="chartType()" [data]="chartData()" />
      } @else {
        <p class="nf-chart-widget__empty">No data</p>
      }
    </div>
  `,
  styles: [
    `
      .nf-chart-widget {
        min-height: 200px;
      }

      .nf-chart-widget__empty {
        margin: 0;
        color: var(--nf-text-muted);
        font-size: var(--nf-font-size-sm, 0.875rem);
      }
    `,
  ],
})
export class ChartWidgetComponent {
  config = input.required<WidgetConfig>();
  /** API response (generic; component treats as ChartWidgetData) */
  data = input<unknown>(null);

  widgetConfig = computed(() => this.config().config as ChartConfig);

  /** Map API labels + datasets to ChartDatum[] for existing nf-chart (donut/stacked) */
  chartData = computed<ChartDatum[]>(() => {
    const raw = this.data();
    const d = raw as ChartWidgetData | null;
    const cfg = this.widgetConfig();
    if (!d || !Array.isArray(d.labels) || !d.labels.length || !Array.isArray(d.datasets) || !d.datasets.length) return [];
    const first = d.datasets[0];
    if (!first?.data) return [];
    return d.labels.map((label, i) => ({
      label,
      value: first.data[i] ?? 0,
    }));
  });

  /** Existing nf-chart supports 'donut' | 'stacked'; map pie/doughnut -> donut, bar/line -> stacked */
  chartType = computed<'donut' | 'stacked'>(() => {
    const t = this.widgetConfig().chartType;
    if (t === 'pie' || t === 'doughnut') return 'donut';
    return 'stacked';
  });
}
