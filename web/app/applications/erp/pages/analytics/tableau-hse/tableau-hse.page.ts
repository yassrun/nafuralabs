import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent, PageHeaderComponent, StatCardComponent, ChartComponent } from '@lib/anatomy';
import type { ChartData } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';

import { AnalyticsApiService } from '../services/analytics-api.service';
import {
  ANALYTICS_CHART_OPTIONS,
  toGroupedBarChart,
} from '../utils/analytics-chart.util';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-hse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    StatCardComponent,
    ChartComponent,
    ButtonComponent,
  ],
  templateUrl: './tableau-hse.page.html',
  styles: [ANALYTICS_PAGE_STYLES],
})
export class TableauHsePage implements OnInit {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly translate = inject(TranslateService);

  readonly periodFrom = signal('2026-01-01');
  readonly periodTo = signal('2026-12-31');
  readonly loaded = signal(false);
  readonly incidentsYtd = signal(0);
  readonly incidentsGraves = signal(0);
  readonly ncOuvertes = signal(0);
  readonly inspectionsEnCours = signal(0);
  readonly formationsTerminees = signal(0);
  readonly joursArretYtd = signal(0);

  readonly severityChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly complianceChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly chartOptions = signal({
    ...ANALYTICS_CHART_OPTIONS,
    indexAxis: 'y' as const,
  });

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.hse.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.hse.breadcrumb') },
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
        metrics: 'incidentsYtd,incidentsGraves,joursArretYtd,ncOuvertes,inspectionsEnCours,formationsTerminees',
      };
      const data = await this.analyticsApi.getBuckets('hse', query);
      const rows = data.rows ?? [];
      this.incidentsYtd.set(this.analyticsApi.sumMetric(rows, 'incidentsYtd'));
      this.incidentsGraves.set(this.analyticsApi.sumMetric(rows, 'incidentsGraves'));
      this.joursArretYtd.set(this.analyticsApi.sumMetric(rows, 'joursArretYtd'));
      this.ncOuvertes.set(this.analyticsApi.sumMetric(rows, 'ncOuvertes'));
      this.inspectionsEnCours.set(this.analyticsApi.sumMetric(rows, 'inspectionsEnCours'));
      this.formationsTerminees.set(this.analyticsApi.sumMetric(rows, 'formationsTerminees'));

      this.severityChart.set({
        labels: [
          this.translate.instant('erp.analyticsTableau.hse.stats.incidents'),
          this.translate.instant('erp.analyticsTableau.hse.stats.graves'),
          this.translate.instant('erp.analyticsTableau.hse.stats.joursArret'),
        ],
        datasets: [
          {
            label: this.translate.instant('erp.analyticsTableau.hse.charts.severity'),
            data: [this.incidentsYtd(), this.incidentsGraves(), this.joursArretYtd()],
            backgroundColor: '#1b3fae',
          },
        ],
      });

      const buData = await this.analyticsApi.getBuckets('hse', {
        ...query,
        dimensions: 'bu',
        metrics: 'ncOuvertes,inspectionsEnCours,formationsTerminees',
      });
      this.complianceChart.set(
        toGroupedBarChart(buData.rows ?? [], [
          { key: 'ncOuvertes', label: this.translate.instant('erp.analyticsTableau.hse.stats.nc') },
          { key: 'inspectionsEnCours', label: this.translate.instant('erp.analyticsTableau.hse.stats.inspections') },
          { key: 'formationsTerminees', label: this.translate.instant('erp.analyticsTableau.hse.stats.formations') },
        ]),
      );
    } catch {
      this.resetToEmpty();
    }
    this.loaded.set(true);
  }

  private resetToEmpty(): void {
    this.incidentsYtd.set(0);
    this.incidentsGraves.set(0);
    this.ncOuvertes.set(0);
    this.inspectionsEnCours.set(0);
    this.formationsTerminees.set(0);
    this.joursArretYtd.set(0);
    this.severityChart.set({ labels: [], datasets: [] });
    this.complianceChart.set({ labels: [], datasets: [] });
  }
}
