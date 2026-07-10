import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ChartComponent, type ChartData } from '@lib/anatomy';

import { DASHBOARD_CHART_EMPTY_STYLES, USE_DASHBOARD_DEMO_DATA } from '../dashboard-demo.constants';

export interface ChantierAlerteRow {
  code: string;
  motifKey: string;
  gravite: 'high' | 'medium';
}

const DEMO_ROWS: ChantierAlerteRow[] = [
  { code: 'CH-2025-001', motifKey: 'dashboard.alert.motif.budget', gravite: 'high' },
  { code: 'CH-2026-003', motifKey: 'dashboard.alert.motif.retard', gravite: 'high' },
  { code: 'CH-2025-002', motifKey: 'dashboard.alert.motif.rg', gravite: 'medium' },
  { code: 'CH-2026-005', motifKey: 'dashboard.alert.motif.budget', gravite: 'medium' },
  { code: 'CH-2026-004', motifKey: 'dashboard.alert.motif.retard', gravite: 'medium' },
];

@Component({
  selector: 'app-dashboard-top-chantiers-alerte',
  standalone: true,
  imports: [TranslateModule, ChartComponent],
  template: `
    <section class="dash-chart-card" data-testid="dashboard-chart-top-alertes">
      <h3 class="dash-chart-card__title">{{ 'dashboard.widget.topAlertesTitle' | translate }}</h3>
      @if (useDemoData) {
        <ul class="alerte-list">
          @for (row of rows(); track row.code) {
            <li class="alerte-list__item" [class.alerte-list__item--high]="row.gravite === 'high'">
              <span class="alerte-list__code">{{ row.code }}</span>
              <span class="alerte-list__motif">{{ row.motifKey | translate }}</span>
            </li>
          }
        </ul>
        <div class="dash-chart-card__body dash-chart-card__body--compact">
          <nf-chart
            type="bar"
            [data]="chartData()"
            [options]="chartOptions()"
            height="180px"
            [minHeight]="160"
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
      padding: 12px;
      background: var(--nf-color-surface);
      min-width: 320px;
    }
    .dash-chart-card__title {
      margin: 0 0 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .alerte-list {
      list-style: none;
      margin: 0 0 12px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .alerte-list__item {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.8125rem;
      padding: 6px 8px;
      border-radius: 6px;
      background: var(--nf-color-bg-muted);
    }
    .alerte-list__item--high {
      border-left: 3px solid var(--nf-color-danger-600);
    }
    .alerte-list__code { font-weight: 600; }
    .alerte-list__motif { color: var(--nf-color-text-secondary); text-align: right; }
    .dash-chart-card__body { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .dash-chart-card__body--compact { margin-top: 4px; }
    ${DASHBOARD_CHART_EMPTY_STYLES}
  `],
})
export class TopChantiersAlerteComponent {
  private readonly translate = inject(TranslateService);

  readonly useDemoData = USE_DASHBOARD_DEMO_DATA;

  readonly rows = signal<ChantierAlerteRow[]>(USE_DASHBOARD_DEMO_DATA ? DEMO_ROWS : []);

  readonly chartData = signal<ChartData<'bar'>>(this.buildBarData());

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
      this.chartData.set(this.buildBarData());
    });
  }

  private buildBarData(): ChartData<'bar'> {
    const keys = [
      'dashboard.alert.motif.budget',
      'dashboard.alert.motif.retard',
      'dashboard.alert.motif.rg',
    ];
    return {
      labels: keys.map((k) => this.translate.instant(k)),
      datasets: [
        {
          label: this.translate.instant('dashboard.widget.topAlertesBarDataset'),
          data: USE_DASHBOARD_DEMO_DATA ? [2, 2, 1] : [],
          backgroundColor: [
            'color-mix(in srgb, var(--nf-color-danger-600) 65%, transparent)',
            'color-mix(in srgb, var(--nf-color-warning-500) 65%, transparent)',
            'color-mix(in srgb, var(--nf-color-primary-500) 65%, transparent)',
          ],
        },
      ],
    };
  }
}
