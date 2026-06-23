import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { FactureApiService } from '@applications/erp/pages/ventes/factures/services/facture-api.service';
import { RecouvrementService } from '@applications/erp/finance/services/recouvrement.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { SuiviRecouvrement } from '@applications/erp/finance/models';

@Component({
  selector: 'app-recouvrement-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    MadCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recouvrement.page.html',
  styleUrl: '../_finance-r2.shared.scss',
})
export class RecouvrementPage {
  private readonly factureApi = inject(FactureApiService);
  private readonly reco = inject(RecouvrementService);
  private readonly audit = inject(ErpAuditService);

  protected readonly rows = signal<SuiviRecouvrement[]>([]);
  protected readonly log = signal<string[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const { items: facts } = await this.factureApi.getAll();
      const today = new Date().toISOString().slice(0, 10);
      this.rows.set(this.reco.buildSuivis(facts, today));
    } catch {
      this.rows.set([]);
    }
  }

  envoyerRelance(row: SuiviRecouvrement): void {
    this.audit.log(
      'UPDATE',
      'facture_client',
      row.factureId,
      row.numeroFacture,
      JSON.stringify({ type: 'relance', niveau: row.niveauRelance, canal: 'EMAIL' }),
    );
    this.log.set([
      `${new Date().toISOString()} — Relance ${row.numeroFacture} (niveau ${row.niveauRelance})`,
      ...this.log(),
    ].slice(0, 20));
  }

  miseEnDemeure(row: SuiviRecouvrement): void {
    this.audit.log(
      'PRINT',
      'facture_client',
      row.factureId,
      row.numeroFacture,
      'mise_en_demeure_pdf_mock',
    );
    this.log.set([
      `${new Date().toISOString()} — PDF mise en demeure généré (mock) — ${row.numeroFacture}`,
      ...this.log(),
    ].slice(0, 20));
  }
}
