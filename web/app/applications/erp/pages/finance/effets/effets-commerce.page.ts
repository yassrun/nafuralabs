import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { EffetCommerceApiService } from '@applications/erp/finance/services/effet-commerce-api.service';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { EffetCommerce, EffetCommerceStatus } from '@applications/erp/finance/models';

@Component({
  selector: 'app-effets-commerce-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './effets-commerce.page.html',
  styleUrl: '../_finance-r2.shared.scss',
})
export class EffetsCommercePage {
  private readonly api = inject(EffetCommerceApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly tab = signal<EffetCommerceStatus | 'ALL'>('ALL');
  protected readonly effets = signal<EffetCommerce[]>([]);
  protected readonly busy = signal(false);

  readonly rows = computed(() => {
    const t = this.tab();
    const all = this.effets();
    if (t === 'ALL') return all;
    return all.filter((e) => e.status === t);
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('vue');
    if (q === 'portefeuille') this.tab.set('PORTEFEUILLE');
    else if (q === 'remise') this.tab.set('REMIS_ENCAISSEMENT');
    else if (q === 'escompte') this.tab.set('ESCOMPTE');
    else if (q === 'impayes') this.tab.set('IMPAYE');
    void this.reload();
  }

  async reload(): Promise<void> {
    this.busy.set(true);
    try {
      this.effets.set(await this.api.listEffets());
    } finally {
      this.busy.set(false);
    }
  }

  setTab(t: EffetCommerceStatus | 'ALL'): void {
    this.tab.set(t);
  }

  async setStatus(id: string, status: EffetCommerceStatus): Promise<void> {
    this.busy.set(true);
    try {
      if (status === 'REMIS_ENCAISSEMENT') {
        await this.api.remiseEncaissement(id);
      } else if (status === 'ESCOMPTE') {
        await this.api.escompte(id);
      } else if (status === 'IMPAYE') {
        await this.api.impaye(id);
      }
      await this.reload();
    } finally {
      this.busy.set(false);
    }
  }

  bordereauPdf(): void {
    const txt = this.rows()
      .map((e) => `${e.numero};${e.montant};${e.dateEcheance};${e.status}`)
      .join('\n');
    const blob = new Blob([`Bordereau remise effets\n${txt}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bordereau-effets.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
