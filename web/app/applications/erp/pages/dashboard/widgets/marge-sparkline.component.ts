import { Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ChartComponent, type ChartData } from '@lib/anatomy';

import { DASHBOARD_CHART_EMPTY_STYLES, USE_DASHBOARD_DEMO_DATA } from '../dashboard-demo.constants';

@Component({
  selector: 'app-dashboard-marge-sparkline',
  standalone: true,
  imports: [TranslateModule, ChartComponent],
  template: `
    <section class="dash-chart-card" data-testid="dashboard-chart-marges">
      <h3 class="dash-chart-card__title">{{ 'dashboard.widget.margeSparkTitle' | translate }}</h3>
      @if (useDemoData) {
        <div class="dash-chart-card__body">
          <nf-chart
            type="line"
            [data]="chartData()"
            [options]="chartOptions()"
            height="240px"
            [minHeight]="200"
          />
        </div>
      } @else {
        <p class="dash-chart-card__empty">{{ 'dashboard.widget.emptyMessage' | translate }}</p>
      }
    </section>
  `,
  styles: [`
    .dash-chart-card {
      border: 1px solid var(--nf-color-border);
      border-radius: 8px;
      padding: 12px 12px 4px;
      background: var(--nf-color-surface);
      min-width: 320px;
    }
    .dash-chart-card__title {
      margin: 0 0 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .dash-chart-card__body { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    ${DASHBOARD_CHART_EMPTY_STYLES}
  `],
})
export class MargeSparklineComponent {
  readonly useDemoData = USE_DASHBOARD_DEMO_DATA;

  private readonly days = signal(
    Array.from({ length: 30 }, (_, i) => `J${i + 1}`),
  );

  private readonly palette = [
    'var(--nf-color-primary-500)',
    'var(--nf-color-success-600)',
    'var(--nf-color-warning-500)',
    'var(--nf-color-primary-700)',
    'var(--nf-color-danger-600)',
    'var(--nf-color-primary-400)',
    'var(--nf-color-text-secondary)',
    'var(--nf-color-primary-300)',
    'var(--nf-color-accent-500)',
    'var(--nf-color-warning-600)',
  ];

  private readonly series = signal(
    USE_DASHBOARD_DEMO_DATA
      ? this.palette.map((color, idx) => ({
          label: `CH-${String(idx + 1).padStart(3, '0')}`,
          color,
          data: Array.from({ length: 30 }, (_, d) =>
            Math.round(8 + idx * 1.2 + Math.sin((d + idx) / 3) * 4 + (d / 30) * 6),
          ),
        }))
      : [],
  );

  readonly chartData = computed((): ChartData<'line'> => {
    const s = this.series();
    return {
      labels: this.days(),
      datasets: s.map((row) => ({
        label: row.label,
        data: row.data,
        borderColor: row.color,
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.5,
      })),
    };
  });

  readonly chartOptions = signal({
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      tooltip: { intersect: false, mode: 'index' as const },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 8 } },
      y: { beginAtZero: true, title: { display: true, text: '%' } },
    },
  });
}
