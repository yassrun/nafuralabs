import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { CaisseApiService } from '@applications/erp/finance/services/caisse-api.service';
import type { MouvementTresorerieType } from '@applications/erp/finance/models';
import {
  MouvementRowComponent,
  SoldeIndicatorComponent,
} from '@applications/erp/finance/components';
import { ButtonComponent } from '@lib/anatomy/components';
import { NumberLocalizedPipe } from '@lib/anatomy/pipes';
import type {
  CompteFinancier,
  MouvementCaisseChantier,
  MouvementTresorerie,
} from '@applications/erp/finance/models';

import { SaisieMvtDialogComponent } from '../components/saisie-mvt-dialog/saisie-mvt-dialog.component';

@Component({
  selector: 'app-mouvements-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MouvementRowComponent,
    SoldeIndicatorComponent,
    SaisieMvtDialogComponent,
    NumberLocalizedPipe,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mouvements-listing.page.html',
  styleUrl: './mouvements-listing.page.scss',
})
export class MouvementsListingPage {
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly caisseApi = inject(CaisseApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly compteId = signal<string>(this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly compte = signal<CompteFinancier | undefined>(undefined);
  protected readonly isCaisseApi = signal(false);
  protected readonly mouvements = signal<MouvementTresorerie[]>([]);

  protected readonly filterType = signal('');
  protected readonly filterRapproche = signal<'all' | 'yes' | 'no'>('all');
  protected readonly filterFrom = signal('');
  protected readonly filterTo = signal('');
  protected readonly filterText = signal('');
  protected readonly showDialog = signal(false);
  protected readonly caisseMouvements = signal<MouvementCaisseChantier[]>([]);
  protected readonly validatingCaisseId = signal<string | null>(null);

  readonly filtered = computed(() => {
    let list = [...this.mouvements()];
    if (this.filterType()) list = list.filter((m) => m.type === this.filterType());
    if (this.filterRapproche() === 'yes') list = list.filter((m) => !!m.rapprocheId);
    if (this.filterRapproche() === 'no') list = list.filter((m) => !m.rapprocheId);
    if (this.filterFrom()) list = list.filter((m) => m.date >= this.filterFrom());
    if (this.filterTo()) list = list.filter((m) => m.date <= this.filterTo());
    if (this.filterText()) {
      const t = this.filterText().toLowerCase();
      list = list.filter(
        (m) =>
          m.libelle.toLowerCase().includes(t) ||
          m.numero.toLowerCase().includes(t),
      );
    }
    return list;
  });

  readonly soldeInitial = computed(() => this.compte()?.soldeInitial ?? 0);
  readonly totalRecettes = computed(() =>
    this.filtered().reduce((s, m) => s + m.recette, 0),
  );
  readonly totalDepenses = computed(() =>
    this.filtered().reduce((s, m) => s + m.depense, 0),
  );

  readonly soldesApres = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const c = this.compte();
    if (!c) return map;
    const asc = [...this.mouvements()].sort((a, b) => (a.date < b.date ? -1 : 1));
    let solde = c.soldeInitial;
    for (const m of asc) {
      solde += m.recette - m.depense;
      map.set(m.id, Math.round(solde * 100) / 100);
    }
    return map;
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('saisie') === '1') {
      this.showDialog.set(true);
    }
    void this.init();
  }

  private bankPeriodBounds(): { from: string; to: string } {
    const to = new Date();
    const from = new Date(to.getFullYear(), 0, 1);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  }

  private async init(): Promise<void> {
    const id = this.compteId();
    const banks = await this.bankApi.listAccounts();
    let c = banks.find((x) => x.id === id);
    let fromCaisse = false;
    if (!c) {
      c = await this.caisseApi.getCentrale(id);
      fromCaisse = !!c;
    }
    if (c) {
      if (fromCaisse) {
        const solde = await this.caisseApi.getSolde(id);
        c = { ...c, soldeActuel: solde };
      } else if (c.type === 'BANQUE') {
        const { to } = this.bankPeriodBounds();
        const solde = await this.bankApi.accountingBalance(id, to);
        c = { ...c, soldeActuel: solde };
      }
      this.compte.set(c);
      this.isCaisseApi.set(fromCaisse);
    }
    await this.reloadMouvements();
  }

  private async reloadMouvements(): Promise<void> {
    const id = this.compteId();
    if (this.isCaisseApi()) {
      const rows = await this.caisseApi.listMouvements(id);
      this.caisseMouvements.set(rows);
      this.mouvements.set(
        rows.map((m, idx) => ({
          id: m.id,
          numero: `CM-${idx + 1}`,
          compteFinancierId: id,
          date: m.date,
          type: m.type === 'AVANCE_RECUE' ? 'AUTRE_RECETTE' : 'AUTRE_DEPENSE',
          modePaiement: 'ESPECES',
          recette: m.type === 'AVANCE_RECUE' ? m.montant : 0,
          depense: m.type !== 'AVANCE_RECUE' ? m.montant : 0,
          libelle: m.description,
          createdAt: m.date,
        })),
      );
      return;
    }
    this.caisseMouvements.set([]);
    const c = this.compte();
    if (!c || c.type !== 'BANQUE') {
      this.mouvements.set([]);
      return;
    }
    const { from, to } = this.bankPeriodBounds();
    const rows = await this.bankApi.listMovementCandidates(id, from, to);
    this.mouvements.set(
      rows.map((m) => ({
        ...m,
        compteFinancierId: id,
        compteFinancierLibelle: c.libelle,
      })),
    );
  }

  back(): void {
    this.router.navigate(['/finance/caisses']);
  }

  ouvrirSaisie(): void {
    this.showDialog.set(true);
  }

  fermerSaisie(): void {
    this.showDialog.set(false);
  }

  async onMvtSaved(mvt?: MouvementTresorerie): Promise<void> {
    this.showDialog.set(false);
    if (mvt && !mvt.id && mvt.type) {
      this.navigateDelegated(mvt.type);
      return;
    }
    await this.init();
  }

  private navigateDelegated(type: MouvementTresorerieType): void {
    const compteId = this.compteId();
    switch (type) {
      case 'REGLEMENT_CLIENT':
        this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'CLIENT', compteId },
        });
        break;
      case 'REGLEMENT_FOURN':
        this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'FOURNISSEUR', compteId },
        });
        break;
      case 'PAIEMENT_PAIE':
        this.router.navigate(['/finance/reglements/new'], {
          queryParams: { type: 'EMPLOYE', compteId },
        });
        break;
      case 'VIREMENT_INTERNE':
        this.router.navigate(['/finance/virements/new'], {
          queryParams: { sourceId: compteId },
        });
        break;
      default:
        void this.init();
    }
  }

  exportCSV(): void {
    const list = this.filtered();
    if (!list.length) return;
    const lines = [
      [
        this.translate.instant('finance.mouvement.csv.date'),
        this.translate.instant('finance.mouvement.csv.numero'),
        this.translate.instant('finance.mouvement.csv.libelle'),
        this.translate.instant('finance.mouvement.csv.recette'),
        this.translate.instant('finance.mouvement.csv.depense'),
      ].join(','),
    ];
    for (const m of list) {
      lines.push([m.date, m.numero, `"${m.libelle}"`, m.recette || '', m.depense || ''].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mouvements-${this.compte()?.code ?? 'compte'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  reset(): void {
    this.filterType.set('');
    this.filterRapproche.set('all');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterText.set('');
  }

  caisseStatus(mvtId: string): MouvementCaisseChantier['status'] | undefined {
    return this.caisseMouvements().find((m) => m.id === mvtId)?.status;
  }

  canValiderCaisse(mvtId: string): boolean {
    const status = this.caisseStatus(mvtId);
    return !!status && status !== 'VALIDE' && status !== 'REJETE';
  }

  async validerCaisseMouvement(mvtId: string): Promise<void> {
    if (!this.canValiderCaisse(mvtId) || this.validatingCaisseId()) return;
    this.validatingCaisseId.set(mvtId);
    try {
      await this.caisseApi.validerMouvement(mvtId);
      await this.init();
    } finally {
      this.validatingCaisseId.set(null);
    }
  }
}
