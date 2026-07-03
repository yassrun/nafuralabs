import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent, PageHeaderComponent, StatCardComponent, ChartComponent } from '@lib/anatomy';
import type { ChartData } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';

import { AnalyticsApiService, type AnalyticsBucketRow } from '../services/analytics-api.service';
import {
  ANALYTICS_CHART_OPTIONS,
  toDoughnutFromMetrics,
  toGroupedBarChart,
} from '../utils/analytics-chart.util';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-financier',
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
  templateUrl: './tableau-financier.page.html',
  styles: [ANALYTICS_PAGE_STYLES],
})
export class TableauFinancierPage implements OnInit {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly translate = inject(TranslateService);

  readonly periodFrom = signal('2026-01-01');
  readonly periodTo = signal('2026-12-31');
  readonly loaded = signal(false);
  readonly caFactureHt = signal(0);
  readonly caEncaisseHt = signal(0);
  readonly resteAEncaisser = signal(0);
  readonly facturesEmises = signal(0);
  readonly facturesEnRetard = signal(0);
  readonly retenuesGarantie = signal(0);

  readonly caChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly invoiceChart = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  readonly chartOptions = signal(ANALYTICS_CHART_OPTIONS);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.financier.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.financier.breadcrumb') },
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
        metrics: 'caFactureHt,caEncaisseHt,resteAEncaisser,facturesEmises,facturesEnRetard,retenuesGarantie,creancesOuvertes',
      };
      let data = await this.analyticsApi.getBuckets('finance', query);
      if (!data.rows?.length) {
        data = await this.analyticsApi.getBuckets('ventes', query);
      }
      const rows = data.rows ?? [];
      this.applyStats(rows);

      const buData = await this.analyticsApi.getBuckets('finance', {
        ...query,
        dimensions: 'bu',
        metrics: 'caFactureHt,caEncaisseHt,resteAEncaisser',
      });
      const buRows = buData.rows?.length ? buData.rows : rows;
      this.caChart.set(
        toGroupedBarChart(buRows, [
          { key: 'caFactureHt', label: this.translate.instant('erp.analyticsTableau.financier.stats.caFacture') },
          { key: 'caEncaisseHt', label: this.translate.instant('erp.analyticsTableau.financier.stats.caEncaisse') },
          { key: 'resteAEncaisser', label: this.translate.instant('erp.analyticsTableau.financier.stats.reste') },
        ]),
      );
      this.invoiceChart.set(
        toDoughnutFromMetrics(rows, [
          { key: 'facturesEmises', label: this.translate.instant('erp.analyticsTableau.financier.stats.factures') },
          { key: 'facturesEnRetard', label: this.translate.instant('erp.analyticsTableau.financier.stats.retard') },
          { key: 'retenuesGarantie', label: this.translate.instant('erp.analyticsTableau.financier.stats.rg') },
        ]),
      );
    } catch {
      this.resetToEmpty();
    }
    this.loaded.set(true);
  }

  private applyStats(rows: AnalyticsBucketRow[]): void {
    this.caFactureHt.set(this.analyticsApi.sumMetric(rows, 'caFactureHt'));
    this.caEncaisseHt.set(this.analyticsApi.sumMetric(rows, 'caEncaisseHt'));
    this.resteAEncaisser.set(
      this.analyticsApi.sumMetric(rows, 'resteAEncaisser') || this.analyticsApi.sumMetric(rows, 'creancesOuvertes'),
    );
    this.facturesEmises.set(this.analyticsApi.sumMetric(rows, 'facturesEmises'));
    this.facturesEnRetard.set(this.analyticsApi.sumMetric(rows, 'facturesEnRetard'));
    this.retenuesGarantie.set(this.analyticsApi.sumMetric(rows, 'retenuesGarantie'));
  }

  private resetToEmpty(): void {
    this.caFactureHt.set(0);
    this.caEncaisseHt.set(0);
    this.resteAEncaisser.set(0);
    this.facturesEmises.set(0);
    this.facturesEnRetard.set(0);
    this.retenuesGarantie.set(0);
    this.caChart.set({ labels: [], datasets: [] });
    this.invoiceChart.set({ labels: [], datasets: [] });
  }
}
