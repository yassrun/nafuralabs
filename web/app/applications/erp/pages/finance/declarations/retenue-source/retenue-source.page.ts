import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { FactureApiService } from '@applications/erp/pages/ventes/factures/services/facture-api.service';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { FactureClient } from '@applications/erp/ventes/models';

@Component({
  selector: 'app-retenue-source-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retenue-source.page.html',
  styleUrl: '../../_finance-r2.shared.scss',
})
export class RetenueSourcePage {
  private readonly factureApi = inject(FactureApiService);

  protected readonly trimestre = signal<'T1-2026' | 'T2-2026'>('T1-2026');
  protected readonly factures = signal<FactureClient[]>([]);

  readonly lignes = computed(() =>
    this.factures().filter((f) => f.marchePublic && f.retenueSourceMontantMad),
  );

  readonly totalRas = computed(() =>
    this.lignes().reduce((s, f) => s + (f.retenueSourceMontantMad ?? 0), 0),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      const { items: rows } = await this.factureApi.getAll();
      this.factures.set(rows);
    } catch {
      this.factures.set([]);
    }
  }

  exportXml(): void {
    const body = this.lignes()
      .map(
        (f) =>
          `<Ligne facture="${f.numero}" client="${f.clientId}" ras="${(f.retenueSourceMontantMad ?? 0).toFixed(2)}" />`,
      )
      .join('\n');
    const xml = `<?xml version="1.0"?>\n<DeclarationRetenueSource trimestre="${this.trimestre()}">\n${body}\n<Total>${this.totalRas().toFixed(2)}</Total>\n</DeclarationRetenueSource>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `retenue-source-${this.trimestre()}.xml`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
