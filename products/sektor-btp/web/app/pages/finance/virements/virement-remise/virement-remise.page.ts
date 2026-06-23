import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FfApiService } from '@applications/erp/pages/achats/factures-fournisseur/services/ff-api.service';
import { VirementApiService } from '@applications/erp/finance/services/virement-api.service';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type {
  BanqueVirementXmlFormat,
  VirementFournisseurRemiseLine,
} from '@applications/erp/finance/models';

@Component({
  selector: 'app-virement-remise-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './virement-remise.page.html',
  styleUrl: '../../_finance-r2.shared.scss',
})
export class VirementRemisePage {
  private readonly ffApi = inject(FfApiService);
  private readonly api = inject(VirementApiService);

  protected readonly format = signal<BanqueVirementXmlFormat>('SEPA');
  protected readonly executionDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly lines = signal<VirementFournisseurRemiseLine[]>([]);
  protected readonly out = signal<string>('');
  protected readonly remiseId = signal<string | null>(null);
  protected readonly busy = signal(false);

  constructor() {
    void this.loadLines();
  }

  async loadLines(): Promise<void> {
    try {
      const ff = await this.ffApi.list();
      const sel = ff
        .filter((f) => f.resteARegler > 0.01 && f.status !== 'ANNULEE')
        .slice(0, 8)
        .map(
          (f, i): VirementFournisseurRemiseLine => ({
            id: f.id,
            beneficiaire: f.fournisseurName ?? f.fournisseurId,
            rib: `MA00 0000 0000 0000 0000 000${i}`,
            montant: f.resteARegler,
            motif: `Règlement ${f.numeroInterne}`,
            referencePiece: f.numeroInterne,
          }),
        );
      this.lines.set(sel);
    } catch {
      this.lines.set([]);
    }
  }

  async generate(): Promise<void> {
    this.busy.set(true);
    try {
      let id = this.remiseId();
      if (!id) {
        const created = await this.api.createRemise(
          this.format(),
          this.executionDate(),
          this.lines(),
        );
        id = created.id;
        this.remiseId.set(id);
      }
      const xml = await this.api.generateXml(id, this.format());
      this.out.set(xml);
    } finally {
      this.busy.set(false);
    }
  }

  download(): void {
    const blob = new Blob([this.out()], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `virements-${this.format()}-${this.executionDate()}.xml`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
