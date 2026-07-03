import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent, PageHeaderComponent, StatCardComponent, ChartComponent } from '@lib/anatomy';
import type { ChartData } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import { SituationApiService } from '@applications/erp/pages/chantiers/situations/services/situation-api.service';

import { AnalyticsApiService } from '../services/analytics-api.service';
import {
  ANALYTICS_CHART_OPTIONS,
  toDoughnutFromMetrics,
  toGroupedBarChart,
} from '../utils/analytics-chart.util';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-chantiers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MadCurrencyPipe,
    PageShellComponent,
    PageHeaderComponent,
    StatCardComponent,
    ChartComponent,
    ButtonComponent,
  ],
  templateUrl: './tableau-chantiers.page.html',
  styles: [ANALYTICS_PAGE_STYLES],
})
export class TableauChantiersPage implements OnInit {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly situationApi = inject(SituationApiService);
  private readonly translate = inject(TranslateService);

  readonly periodFrom = signal('2026-01-01');
  readonly periodTo = signal('2026-12-31');
  readonly loaded = signal(false);
  readonly totalChantiers = signal(0);
  readonly chantiersEnCours = signal(0);
  readonly chantiersTermines = signal(0);
  readonly situationsEmises = signal(0);
  readonly avencements = signal(0);
  readonly totalBudget = signal(0);

  readonly budgetChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly statusChart = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  readonly chartOptions = signal(ANALYTICS_CHART_OPTIONS);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.chantiers.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.chantiers.breadcrumb') },
    ],
  }));

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loaded.set(false);
    try {
      const query = {
        from: this.periodFrom(),
        to: this.periodTo(),
        metrics: 'nbChantiers,chantiersEnCours,chantiersTermines,situationsEmises,avancementMoyen,totalBudget,ca',
      };
      const data = await this.analyticsApi.getBuckets('chantiers', query);
      const rows = data.rows ?? [];
      this.totalChantiers.set(this.analyticsApi.sumMetric(rows, 'nbChantiers'));
      this.chantiersEnCours.set(this.analyticsApi.sumMetric(rows, 'chantiersEnCours'));
      this.chantiersTermines.set(this.analyticsApi.sumMetric(rows, 'chantiersTermines'));
      this.situationsEmises.set(this.analyticsApi.sumMetric(rows, 'situationsEmises'));
      this.totalBudget.set(this.analyticsApi.sumMetric(rows, 'totalBudget'));
      const avg =
        rows.length > 0
          ? Math.round(rows.reduce((s, r) => s + (Number(r.metrics?.['avancementMoyen']) || 0), 0) / rows.length)
          : 0;
      this.avencements.set(avg);

      const buData = await this.analyticsApi.getBuckets('chantiers', {
        ...query,
        dimensions: 'bu',
        metrics: 'totalBudget,ca',
      });
      this.budgetChart.set(
        toGroupedBarChart(buData.rows ?? [], [
          { key: 'totalBudget', label: this.translate.instant('erp.analyticsTableau.chantiers.charts.budget') },
          { key: 'ca', label: this.translate.instant('erp.analyticsTableau.chantiers.charts.ca') },
        ]),
      );
      this.statusChart.set(
        toDoughnutFromMetrics(rows, [
          { key: 'chantiersEnCours', label: this.translate.instant('erp.analyticsTableau.chantiers.stats.enCours') },
          { key: 'chantiersTermines', label: this.translate.instant('erp.analyticsTableau.chantiers.stats.termines') },
        ]),
      );
    } catch {
      await this.loadFromApis();
    }
    this.loaded.set(true);
  }

  private async loadFromApis(): Promise<void> {
    const [{ items: chantiers }, { items: situations }] = await Promise.all([
      this.chantierApi.getAll(),
      this.situationApi.getAll(),
    ]);
    this.totalChantiers.set(chantiers.length);
    this.chantiersEnCours.set(chantiers.filter((c) => c.status === 'EN_COURS').length);
    this.chantiersTermines.set(
      chantiers.filter((c) => c.status === 'TERMINE' || c.status === 'RECEPTIONNE' || c.status === 'CLOTURE').length,
    );
    this.situationsEmises.set(situations.filter((s) => s.status !== 'BROUILLON').length);
    const avgAv =
      chantiers.length > 0
        ? Math.round(chantiers.reduce((s, c) => s + (c.avancementPercent ?? 0), 0) / chantiers.length)
        : 0;
    this.avencements.set(avgAv);
    this.totalBudget.set(chantiers.reduce((s, c) => s + (c.budgetHt ?? 0), 0));
    this.budgetChart.set({ labels: [], datasets: [] });
    this.statusChart.set(
      toDoughnutFromMetrics(
        [
          {
            keys: ['fallback'],
            metrics: { chantiersEnCours: this.chantiersEnCours(), chantiersTermines: this.chantiersTermines() },
          },
        ],
        [
          { key: 'chantiersEnCours', label: this.translate.instant('erp.analyticsTableau.chantiers.stats.enCours') },
          { key: 'chantiersTermines', label: this.translate.instant('erp.analyticsTableau.chantiers.stats.termines') },
        ],
      ),
    );
  }
}
