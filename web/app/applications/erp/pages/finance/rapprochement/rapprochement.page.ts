import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { TreasuryJournalEntryService } from '@applications/erp/finance/services/treasury-journal-entry.service';
import {
  RapprochementMatcherComponent,
  ReleveImportDialogComponent,
  SoldeIndicatorComponent,
} from '@applications/erp/finance/components';
import type {
  CompteFinancier,
  MouvementTresorerie,
  Rapprochement,
  RapprochementLigneReleve,
  RapprochementStatus,
} from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';
import { ConfirmDialogService } from '@lib/anatomy';

interface MatchPair {
  mouvementId: string;
  releveLigneId: string;
}

@Component({
  selector: 'app-rapprochement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RapprochementMatcherComponent,
    ReleveImportDialogComponent,
    SoldeIndicatorComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rapprochement.page.html',
  styleUrl: './rapprochement.page.scss',
})
export class RapprochementPage {
  private readonly api = inject(BankReconciliationApiService);
  private readonly treasuryEntries = inject(TreasuryJournalEntryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly comptes = signal<CompteFinancier[]>([]);
  protected readonly historique = signal<Rapprochement[]>([]);
  protected readonly mouvements = signal<MouvementTresorerie[]>([]);
  protected readonly soldeDebutComptable = signal<number>(0);
  protected readonly soldeFinComptable = signal<number>(0);

  protected readonly compteId = signal<string>('');
  protected readonly dateDebut = signal<string>('');
  protected readonly dateFin = signal<string>('');
  protected readonly soldeFinReleve = signal<number>(0);
  protected readonly notes = signal<string>('');
  protected readonly lignesReleve = signal<RapprochementLigneReleve[]>([]);
  protected readonly pairs = signal<MatchPair[]>([]);
  protected readonly showImport = signal<boolean>(false);
  protected readonly busy = signal<boolean>(false);
  protected readonly err = signal<string | null>(null);

  readonly compte = computed(() => this.comptes().find((c) => c.id === this.compteId()));

  readonly ecart = computed(() =>
    Math.round((this.soldeFinComptable() - this.soldeFinReleve()) * 100) / 100,
  );

  readonly status = computed<RapprochementStatus>(() => {
    if (Math.abs(this.ecart()) < 0.01) return 'VALIDE';
    return 'EN_COURS';
  });

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    this.busy.set(true);
    try {
      const [accounts, hist] = await Promise.all([
        this.api.listAccounts(),
        this.api.listHistorique(),
      ]);
      this.comptes.set(accounts.filter((c) => c.type === 'BANQUE'));
      this.historique.set([...hist].sort((a, b) => (a.dateFin < b.dateFin ? 1 : -1)));

      if (this.id) {
        const r = await this.api.getRapprochement(this.id);
        this.applyRapprochement(r);
      } else {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateDebut.set(start.toISOString().slice(0, 10));
        this.dateFin.set(today.toISOString().slice(0, 10));
        const firstBank = this.comptes()[0];
        if (firstBank) {
          this.compteId.set(firstBank.id);
        }
        await this.reloadBalancesAndMovements();
      }
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  private applyRapprochement(r: Rapprochement): void {
    this.compteId.set(r.compteFinancierId);
    this.dateDebut.set(r.dateDebut);
    this.dateFin.set(r.dateFin);
    this.soldeFinReleve.set(r.soldeFinReleve);
    this.notes.set(r.notes ?? '');
    this.lignesReleve.set(r.lignesReleve ?? []);
    this.soldeDebutComptable.set(r.soldeDebutComptable);
    this.soldeFinComptable.set(r.soldeFinComptable);
    this.pairs.set(
      (r.mouvementsRapprochesIds ?? [])
        .map((mid) => {
          const ligne = (r.lignesReleve ?? []).find((l) => l.matchedMouvementId === mid);
          return { mouvementId: mid, releveLigneId: ligne?.id ?? '' };
        })
        .filter((p) => p.releveLigneId),
    );
    void this.reloadMovements();
  }

  async onParamsChange(): Promise<void> {
    if (this.id) return;
    await this.reloadBalancesAndMovements();
  }

  private async reloadBalancesAndMovements(): Promise<void> {
    const accountId = this.compteId();
    const from = this.dateDebut();
    const to = this.dateFin();
    if (!accountId || !from || !to) return;
    try {
      const dayBefore = new Date(from);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const [debut, fin] = await Promise.all([
        this.api.accountingBalance(accountId, dayBefore.toISOString().slice(0, 10)),
        this.api.accountingBalance(accountId, to),
      ]);
      this.soldeDebutComptable.set(debut);
      this.soldeFinComptable.set(fin);
      await this.reloadMovements();
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    }
  }

  private async reloadMovements(): Promise<void> {
    const accountId = this.compteId();
    const from = this.dateDebut();
    const to = this.dateFin();
    if (!accountId || !from || !to) {
      this.mouvements.set([]);
      return;
    }
    const rows = await this.api.listMovementCandidates(accountId, from, to, this.id ?? undefined);
    this.mouvements.set(
      rows.map((m) => ({ ...m, compteFinancierId: accountId, compteFinancierLibelle: this.compte()?.libelle })),
    );
  }

  setPeriodeMonth(offset: number): void {
    const today = new Date();
    const target = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0);
    this.dateDebut.set(target.toISOString().slice(0, 10));
    this.dateFin.set(lastDay.toISOString().slice(0, 10));
    void this.onParamsChange();
  }

  onPairsChange(pairs: MatchPair[]): void {
    this.pairs.set(pairs);
  }

  async runAutoMatch(): Promise<void> {
    if (this.id) {
      this.busy.set(true);
      try {
        const updated = await this.api.autoMatchStatement(this.id);
        this.applyRapprochement(updated);
      } catch (e) {
        this.err.set(e instanceof Error ? e.message : String(e));
      } finally {
        this.busy.set(false);
      }
      return;
    }
    const dayMs = 86_400_000;
    const usedM = new Set(this.pairs().map((p) => p.mouvementId));
    const usedL = new Set(this.pairs().map((p) => p.releveLigneId));
    const next = [...this.pairs()];
    for (const ligne of this.lignesReleve()) {
      if (usedL.has(ligne.id)) continue;
      const amount = ligne.recette > 0 ? ligne.recette : ligne.depense;
      const ligneTime = new Date(ligne.date).getTime();
      const mv = this.mouvements().find((m) => {
        if (usedM.has(m.id)) return false;
        const mAmt = m.recette > 0 ? m.recette : m.depense;
        if (Math.abs(mAmt - amount) > 0.02) return false;
        if (Math.abs(new Date(m.date).getTime() - ligneTime) > 3 * dayMs) return false;
        const sameDir =
          (ligne.recette > 0 && m.recette > 0) || (ligne.depense > 0 && m.depense > 0);
        return sameDir;
      });
      if (mv) {
        next.push({ mouvementId: mv.id, releveLigneId: ligne.id });
        usedM.add(mv.id);
        usedL.add(ligne.id);
      }
    }
    this.pairs.set(next);
  }

  openImport(): void {
    this.showImport.set(true);
  }

  onLignesImported(lignes: RapprochementLigneReleve[]): void {
    this.lignesReleve.set([...this.lignesReleve(), ...lignes]);
    this.showImport.set(false);
  }

  cancelImport(): void {
    this.showImport.set(false);
  }

  async resetReleve(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Effacer toutes les lignes du relevé ?',
      message: ' ',
      confirmLabel: 'Effacer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.lignesReleve.set([]);
    this.pairs.set([]);
  }

  /** Crée une écriture banque (journal BQ) à partir d'une ligne de relevé orpheline. */
  async createMvtFromReleve(ligne: RapprochementLigneReleve): Promise<void> {
    if (!this.compteId() || !this.compte()) return;
    const compte = this.compte()!;
    const created = await this.treasuryEntries.createFromReleveLine({
      compteFinancierId: this.compteId()!,
      compteFinancierLibelle: compte.libelle,
      glAccountCode: compte.compteCgncCode,
      date: ligne.date,
      libelle: ligne.libelle,
      reference: ligne.reference,
      recette: ligne.recette,
      depense: ligne.depense,
    });
    this.mouvements.set([...this.mouvements(), created]);
    this.pairs.set([...this.pairs(), { mouvementId: created.id, releveLigneId: ligne.id }]);
  }

  async validate(): Promise<void> {
    if (!this.compte() || !this.dateDebut() || !this.dateFin()) return;
    this.busy.set(true);
    this.err.set(null);
    try {
      const status: RapprochementStatus = Math.abs(this.ecart()) < 0.01 ? 'VALIDE' : 'ANOMALIE';
      const lignesWithMatch: RapprochementLigneReleve[] = this.lignesReleve().map((l) => {
        const pair = this.pairs().find((p) => p.releveLigneId === l.id);
        return { ...l, matchedMouvementId: pair?.mouvementId };
      });
      const payload = {
        compteFinancierId: this.compteId(),
        compteFinancierLibelle: this.compte()!.libelle,
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
        soldeDebutComptable: this.soldeDebutComptable(),
        soldeFinComptable: this.soldeFinComptable(),
        soldeFinReleve: this.soldeFinReleve(),
        ecart: this.ecart(),
        status,
        notes: this.notes() || undefined,
        lignesReleve: lignesWithMatch,
      };
      await this.api.saveRapprochement(this.id, payload, this.pairs());
      this.router.navigate(['/finance/rapprochement']);
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async deleteRapprochement(): Promise<void> {
    if (!this.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer ce rapprochement ?',
      message: ' ',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.api.deleteRapprochement(this.id);
      this.router.navigate(['/finance/rapprochement']);
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  openExisting(r: Rapprochement): void {
    this.router.navigate(['/finance/rapprochement', r.id]);
  }

  newRapprochement(): void {
    this.router.navigate(['/finance/rapprochement']);
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.locale);
  }

  statusLabel(s: RapprochementStatus): string {
    return s === 'VALIDE' ? 'Validé' : s === 'EN_COURS' ? 'En cours' : 'Anomalie';
  }

  statusVariant(s: RapprochementStatus): string {
    return s === 'VALIDE' ? 'success' : s === 'ANOMALIE' ? 'danger' : 'warning';
  }
}
