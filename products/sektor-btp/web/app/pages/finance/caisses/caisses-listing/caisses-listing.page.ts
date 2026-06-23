import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { CaisseApiService } from '@applications/erp/finance/services/caisse-api.service';
import {
  CompteFinancierCardComponent,
  SoldeIndicatorComponent,
} from '@applications/erp/finance/components';
import { ButtonComponent } from '@lib/anatomy/components';
import { NumberLocalizedPipe } from '@lib/anatomy/pipes';
import type {
  CompteFinancier,
  CompteFinancierStats,
} from '@applications/erp/finance/models';

@Component({
  selector: 'app-caisses-listing',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, CompteFinancierCardComponent, SoldeIndicatorComponent, NumberLocalizedPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caisses-listing.page.html',
  styleUrl: './caisses-listing.page.scss',
})
export class CaissesListingPage {
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly caisseApi = inject(CaisseApiService);
  private readonly router = inject(Router);

  protected readonly comptes = signal<CompteFinancier[]>([]);

  readonly banques = computed(() => this.comptes().filter((c) => c.type === 'BANQUE'));
  readonly caisses = computed(() => this.comptes().filter((c) => c.type === 'CAISSE'));

  readonly soldeTotal = computed(() =>
    this.comptes().reduce((s, c) => s + c.soldeActuel, 0),
  );

  readonly nbActifs = computed(() => this.comptes().filter((c) => c.isActive).length);

  readonly variation24hTotal = computed(() => 0);
  readonly recettesMois = computed(() => 0);
  readonly depensesMois = computed(() => 0);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    const [banks, centrales] = await Promise.all([
      this.bankApi.listAccounts(),
      this.caisseApi.listCentrales(),
    ]);
    this.comptes.set([...banks, ...centrales]);
  }

  statsFor(compte: CompteFinancier): CompteFinancierStats {
    return {
      id: compte.id,
      nbMouvementsMois: 0,
      totalRecettesMois: 0,
      totalDepensesMois: 0,
      variation24h: 0,
      derniereMaj: new Date().toISOString(),
    };
  }

  openMouvements(compte: CompteFinancier): void {
    this.router.navigate(['/finance/caisses', compte.id, 'mouvements']);
  }

  saisirMvt(compte: CompteFinancier): void {
    this.router.navigate(['/finance/caisses', compte.id, 'mouvements'], {
      queryParams: { saisie: 1 },
    });
  }

  newReglement(): void {
    this.router.navigate(['/finance/reglements/new']);
  }

  newVirement(): void {
    this.router.navigate(['/finance/virements/new']);
  }

  goRapprochement(): void {
    this.router.navigate(['/finance/rapprochement']);
  }
}
