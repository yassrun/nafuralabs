import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ChartComponent, type ChartData } from '@lib/anatomy';

import { DASHBOARD_CHART_EMPTY_STYLES, USE_DASHBOARD_DEMO_DATA } from '../dashboard-demo.constants';

const DEMO_N = [2.1, 4.2, 6.8, 9.1, 11.4, 14.0, 16.2, 18.5, 20.1, 22.0, 23.4, 25.0];
const DEMO_N1 = [1.9, 3.8, 6.0, 8.2, 10.5, 12.8, 15.0, 17.1, 18.8, 20.5, 21.9, 23.2];

@Component({
  selector: 'app-dashboard-ca-cumul-chart',
  standalone: true,
  imports: [TranslateModule, ChartComponent],
  template: `
    <section class="dash-chart-card" data-testid="dashboard-chart-ca-cumul">
      <h3 class="dash-chart-card__title">{{ 'dashboard.widget.caCumulTitle' | translate }}</h3>
      @if (useDemoData) {
        <div class="dash-chart-card__body">
          <nf-chart
            type="line"
            [data]="chartData()"
            [options]="chartOptions()"
            height="260px"
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
    .dash-chart-card__body {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    ${DASHBOARD_CHART_EMPTY_STYLES}
  `],
})
export class CaCumulChartComponent {
  private readonly translate = inject(TranslateService);

  readonly useDemoData = USE_DASHBOARD_DEMO_DATA;

  private readonly labels = signal([
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
  ]);

  private readonly n = signal(USE_DASHBOARD_DEMO_DATA ? DEMO_N : []);
  private readonly n1 = signal(USE_DASHBOARD_DEMO_DATA ? DEMO_N1 : []);

  readonly chartData = signal<ChartData<'line'>>(this.buildData());

  readonly chartOptions = signal({
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { intersect: false, mode: 'index' as const },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'M MAD' } },
    },
  });

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.chartData.set(this.buildData());
    });
  }

  private buildData(): ChartData<'line'> {
    return {
      labels: this.labels(),
      datasets: [
        {
          label: this.translate.instant('dashboard.chart.yearN'),
          data: this.n(),
          borderColor: 'var(--nf-color-primary-500)',
          backgroundColor: 'color-mix(in srgb, var(--nf-color-primary-500) 8%, transparent)',
          tension: 0.3,
          fill: true,
        },
        {
          label: this.translate.instant('dashboard.chart.yearN1'),
          data: this.n1(),
          borderColor: 'var(--nf-color-text-muted)',
          borderDash: [6, 4],
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }
}
