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
  toGroupedBarChart,
} from '../utils/analytics-chart.util';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-achats',
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
  templateUrl: './tableau-achats.page.html',
  styles: [ANALYTICS_PAGE_STYLES],
})
export class TableauAchatsPage implements OnInit {
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly translate = inject(TranslateService);

  readonly periodFrom = signal('2026-01-01');
  readonly periodTo = signal('2026-12-31');
  readonly loaded = signal(false);
  readonly totalFournisseurs = signal(0);
  readonly daEnAttente = signal(0);
  readonly commandesEnCours = signal(0);
  readonly montantEngage = signal(0);
  readonly contratsActifs = signal(0);
  readonly aoEnCours = signal(0);

  readonly pipelineChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly engageChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly chartOptions = signal(ANALYTICS_CHART_OPTIONS);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.achats.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.achats.breadcrumb') },
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
        metrics: 'montantEngage,commandesEnCours,daEnAttente,contratsActifs,aoEnCours,totalFournisseurs',
      };
      const data = await this.analyticsApi.getBuckets('achats', query);
      const rows = data.rows ?? [];
      this.daEnAttente.set(this.analyticsApi.sumMetric(rows, 'daEnAttente'));
      this.commandesEnCours.set(this.analyticsApi.sumMetric(rows, 'commandesEnCours'));
      this.montantEngage.set(this.analyticsApi.sumMetric(rows, 'montantEngage'));
      this.contratsActifs.set(this.analyticsApi.sumMetric(rows, 'contratsActifs'));
      this.aoEnCours.set(this.analyticsApi.sumMetric(rows, 'aoEnCours'));
      this.totalFournisseurs.set(this.analyticsApi.sumMetric(rows, 'totalFournisseurs'));

      const buData = await this.analyticsApi.getBuckets('achats', {
        ...query,
        dimensions: 'bu',
        metrics: 'daEnAttente,commandesEnCours,aoEnCours,contratsActifs',
      });
      this.pipelineChart.set(
        toGroupedBarChart(buData.rows ?? [], [
          { key: 'daEnAttente', label: this.translate.instant('erp.analyticsTableau.achats.stats.da') },
          { key: 'commandesEnCours', label: this.translate.instant('erp.analyticsTableau.achats.stats.commandes') },
          { key: 'aoEnCours', label: this.translate.instant('erp.analyticsTableau.achats.stats.ao') },
          { key: 'contratsActifs', label: this.translate.instant('erp.analyticsTableau.achats.stats.contrats') },
        ]),
      );

      const rubData = await this.analyticsApi.getBuckets('achats', {
        ...query,
        dimensions: 'rubrique',
        metrics: 'montantEngage',
      });
      this.engageChart.set(
        toBarChart(
          rubData.rows ?? [],
          'montantEngage',
          this.translate.instant('erp.analyticsTableau.achats.stats.montantEngage'),
          0,
        ),
      );
    } catch {
      this.resetToEmpty();
    }
    this.loaded.set(true);
  }

  private resetToEmpty(): void {
    this.totalFournisseurs.set(0);
    this.daEnAttente.set(0);
    this.commandesEnCours.set(0);
    this.montantEngage.set(0);
    this.contratsActifs.set(0);
    this.aoEnCours.set(0);
    this.pipelineChart.set({ labels: [], datasets: [] });
    this.engageChart.set({ labels: [], datasets: [] });
  }
}
