import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent, PageHeaderComponent, StatCardComponent, ChartComponent } from '@lib/anatomy';
import type { ChartData } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';

import { AnalyticsApiService } from '../services/analytics-api.service';
import {
  ANALYTICS_CHART_OPTIONS,
  toBarChart,
  toDoughnutFromMetrics,
} from '../utils/analytics-chart.util';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-rh',
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
  templateUrl: './tableau-rh.page.html',
  styles: [ANALYTICS_PAGE_STYLES],
})
export class TableauRhPage implements OnInit {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly translate = inject(TranslateService);

  readonly periodFrom = signal('2026-01-01');
  readonly periodTo = signal('2026-12-31');
  readonly loaded = signal(false);
  readonly totalActifs = signal(0);
  readonly massSalariale = signal(0);
  readonly congesEnAttente = signal(0);
  readonly paieAValider = signal(0);
  readonly totalCDI = signal(0);
  readonly tauxConge = signal(0);

  readonly payrollChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly contractChart = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  readonly chartOptions = signal(ANALYTICS_CHART_OPTIONS);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.rh.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.rh.breadcrumb') },
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
        metrics: 'totalActifs,masseSalariale,congesEnAttente,paieAValider,totalCDI,tauxConge',
      };
      const data = await this.analyticsApi.getBuckets('rh', query);
      const rows = data.rows ?? [];
      this.totalActifs.set(this.analyticsApi.sumMetric(rows, 'totalActifs'));
      this.massSalariale.set(this.analyticsApi.sumMetric(rows, 'masseSalariale'));
      this.congesEnAttente.set(this.analyticsApi.sumMetric(rows, 'congesEnAttente'));
      this.paieAValider.set(this.analyticsApi.sumMetric(rows, 'paieAValider'));
      this.totalCDI.set(this.analyticsApi.sumMetric(rows, 'totalCDI'));
      const taux =
        rows.length > 0
          ? Math.round(rows.reduce((s, r) => s + (Number(r.metrics?.['tauxConge']) || 0), 0) / rows.length)
          : 0;
      this.tauxConge.set(taux);

      const catData = await this.analyticsApi.getBuckets('rh', {
        ...query,
        dimensions: 'categorie',
        metrics: 'masseSalariale',
      });
      this.payrollChart.set(
        toBarChart(
          catData.rows ?? [],
          'masseSalariale',
          this.translate.instant('erp.analyticsTableau.rh.stats.masse'),
          0,
        ),
      );

      const cdd = Math.max(0, this.totalActifs() - this.totalCDI());
      this.contractChart.set(
        toDoughnutFromMetrics(
          [{ keys: ['effectifs'], metrics: { totalCDI: this.totalCDI(), cdd } }],
          [
            { key: 'totalCDI', label: this.translate.instant('erp.analyticsTableau.rh.stats.cdi') },
            { key: 'cdd', label: this.translate.instant('erp.analyticsTableau.rh.stats.cdd') },
          ],
        ),
      );
    } catch {
      this.resetToEmpty();
    }
    this.loaded.set(true);
  }

  private resetToEmpty(): void {
    this.totalActifs.set(0);
    this.massSalariale.set(0);
    this.congesEnAttente.set(0);
    this.paieAValider.set(0);
    this.totalCDI.set(0);
    this.tauxConge.set(0);
    this.payrollChart.set({ labels: [], datasets: [] });
    this.contractChart.set({ labels: [], datasets: [] });
  }
}
