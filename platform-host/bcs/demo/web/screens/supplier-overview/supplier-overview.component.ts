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
import { RECORD_SECTION } from '@platform/platform/record';
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

/**
 * Calculated supplier summary.
 * Declared as `supplier-overview` with placements `page` and `section`.
 * As a page it uses {@link ScreenState}; as a record section it uses {@link RECORD_SECTION}.
 */
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
  private readonly screen = inject(ScreenState, { optional: true });
  private readonly section = inject(RECORD_SECTION, { optional: true });

  readonly kpis = signal<KpiItem[]>([]);
  readonly chart = signal<ChartData<'bar'>>({ labels: [], datasets: [{ data: [] }] });

  constructor() {
    void this.load();
  }

  private supplierId(): string | null {
    const fromRoute = this.route.snapshot.paramMap.get('id');
    if (fromRoute && fromRoute !== 'new') return fromRoute;
    const saved = this.section?.saved();
    const id = saved?.['id'];
    return id == null ? null : String(id);
  }

  private setLoading(on: boolean): void {
    this.screen?.loading.set(on);
  }

  private setError(message: string | null): void {
    this.screen?.error.set(message);
  }

  private async load(): Promise<void> {
    const id = this.supplierId();
    if (!id) {
      this.setError('Fournisseur introuvable.');
      return;
    }
    this.setLoading(true);
    this.setError(null);
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
      this.setError('Impossible de charger la synthèse.');
    } finally {
      this.setLoading(false);
    }
  }
}
