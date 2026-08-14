import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { ChartComponent, type ChartData } from '@lib/anatomy';

import { HseKpiApiService } from '../../hse/tableau-bord-hse/services/hse-kpi-api.service';
import { DASHBOARD_CHART_EMPTY_STYLES, USE_DASHBOARD_DEMO_DATA } from '../dashboard-demo.constants';

@Component({
  selector: 'app-dashboard-bird-pyramid-hse',
  standalone: true,
  imports: [TranslateModule, ChartComponent],
  template: `
    <section class="dash-chart-card" data-testid="dashboard-chart-bird-hse">
      <h3 class="dash-chart-card__title">{{ 'dashboard.widget.birdHseTitle' | translate }}</h3>
      @if (hasChartData()) {
        <div class="dash-chart-card__body">
          <nf-chart
            type="bar"
            [data]="chartData()"
            [options]="chartOptions()"
            height="220px"
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
export class BirdPyramidHseComponent {
  private readonly translate = inject(TranslateService);
  private readonly hseKpiApi = inject(HseKpiApiService);

  readonly useDemoData = USE_DASHBOARD_DEMO_DATA;
  readonly hasChartData = signal(USE_DASHBOARD_DEMO_DATA);

  /** Must be declared before chartData — buildData() reads it during field init. */
  private readonly liveCounts = signal<number[]>([]);

  readonly chartData = signal<ChartData<'bar'>>(this.buildData());

  readonly chartOptions = signal({
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false },
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  });

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.chartData.set(this.buildData(this.liveCounts()));
    });
    if (!USE_DASHBOARD_DEMO_DATA) {
      void this.loadLiveData();
    }
  }

  private async loadLiveData(): Promise<void> {
    const year = new Date().getFullYear();
    try {
      const kpis = await this.hseKpiApi.getKpis({
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      });
      const bird = kpis.pyramideBird;
      const atSansArret = Math.max(0, (bird?.at ?? 0) - (bird?.atAvecArret ?? 0));
      const counts = [
        bird?.presquAccidents ?? 0,
        atSansArret,
        bird?.atAvecArret ?? 0,
        0,
      ];
      this.liveCounts.set(counts);
      this.hasChartData.set(counts.some((n) => n > 0));
      this.chartData.set(this.buildData(counts));
    } catch {
      this.hasChartData.set(false);
    }
  }

  private buildData(counts?: number[]): ChartData<'bar'> {
    const data =
      counts ??
      (USE_DASHBOARD_DEMO_DATA ? [12, 4, 1, 0] : this.liveCounts());
    const keys = [
      'dashboard.bird.presqueAt',
      'dashboard.bird.atBenin',
      'dashboard.bird.atGrave',
      'dashboard.bird.mortel',
    ];
    return {
      labels: keys.map((k) => this.translate.instant(k)),
      datasets: [
        {
          label: this.translate.instant('dashboard.bird.dataset'),
          data,
          backgroundColor: [
            'color-mix(in srgb, var(--nf-color-warning-500) 75%, transparent)',
            'color-mix(in srgb, var(--nf-color-accent-400) 85%, transparent)',
            'color-mix(in srgb, var(--nf-color-danger-600) 80%, transparent)',
            'color-mix(in srgb, var(--nf-color-text-secondary) 90%, transparent)',
          ],
        },
      ],
    };
  }
}
