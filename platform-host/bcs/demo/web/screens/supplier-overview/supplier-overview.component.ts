import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ApiConfigService,
  ChartComponent,
  KpiStripComponent,
  type ChartData,
  type KpiItem,
} from '@platform/platform/screen-kit';
import { ScreenState } from '@platform/platform/screen/screen-page.component';

interface Overview {
  total: number;
  amount: number;
  byStatus: Record<string, number>;
}

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'En approbation',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
  ORDERED: 'Commandée',
};

/** Calculated supplier summary. Declared as `supplier-overview` in the demo manifest. */
@Component({
  selector: 'demo-supplier-overview',
  standalone: true,
  imports: [KpiStripComponent, ChartComponent],
  template: `
    @if (kpis().length) {
      <nf-kpi-strip [kpis]="kpis()" />
      <nf-chart type="bar" [data]="chart()" height="280px" />
    }
  `,
})
export class SupplierOverviewComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiConfigService);
  private readonly screen = inject(ScreenState);

  readonly kpis = signal<KpiItem[]>([]);
  readonly chart = signal<ChartData<'bar'>>({ labels: [], datasets: [{ data: [] }] });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.screen.error.set('Fournisseur introuvable.');
      return;
    }
    this.screen.loading.set(true);
    this.screen.error.set(null);
    try {
      const base = this.api.getApiBaseUrl().replace(/\/+$/, '');
      const overview = await firstValueFrom(this.http.get<Overview>(`${base}/api/v1/demo/suppliers/${id}/overview`));
      const entries = Object.entries(overview.byStatus ?? {});
      const money = new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(overview.amount ?? 0);
      this.kpis.set([
        { id: 'total', label: 'Demandes', value: overview.total ?? 0, icon: 'shopping-cart' },
        { id: 'amount', label: 'Montant cumulé', value: money, icon: 'banknote' },
      ]);
      this.chart.set({
        labels: entries.map(([status]) => LABELS[status] ?? status),
        datasets: [{ label: 'Demandes', data: entries.map(([, count]) => count) }],
      });
    } catch {
      this.screen.error.set('Impossible de charger la synthèse.');
    } finally {
      this.screen.loading.set(false);
    }
  }
}
