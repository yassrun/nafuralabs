import { Component, effect, inject, signal } from '@angular/core';

import { LISTING_HEADER, type RecordFilter } from '@platform/platform/listing';
import { KpiStripComponent, type KpiItem } from '@platform/platform/screen-kit';

/**
 * KPIs above the purchase-requests list: filtered amount and overdue count.
 * Declared as `purchase-requests-header` with placement `listing-header`.
 */
@Component({
  selector: 'demo-purchase-requests-header',
  standalone: true,
  imports: [KpiStripComponent],
  template: `@if (kpis().length) { <nf-kpi-strip [kpis]="kpis()" /> }`,
})
export class PurchaseRequestsHeaderComponent {
  private readonly header = inject(LISTING_HEADER);

  readonly kpis = signal<KpiItem[]>([]);

  constructor() {
    effect(() => {
      this.header.filter();
      this.header.q();
      void this.refresh();
    });
  }

  private async refresh(): Promise<void> {
    const late = {
      and: [{ neededBy: { before: 'today' } }, { status: { notIn: ['ORDERED', 'REJECTED'] } }],
    } as RecordFilter;
    const [sum, overdue] = await Promise.all([
      this.header.aggregate({ sum: ['amount'] }),
      this.header.aggregate({ count: ['id'] }, late),
    ]);
    const amount = sum['sum']?.['amount'] ?? 0;
    const lateCount = overdue['count']?.['id'] ?? 0;
    const money = new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount);
    this.kpis.set([
      { id: 'amount', label: 'Montant filtré', value: money, icon: 'banknote' },
      { id: 'overdue', label: 'En retard', value: lateCount, icon: 'clock' },
    ]);
  }
}
