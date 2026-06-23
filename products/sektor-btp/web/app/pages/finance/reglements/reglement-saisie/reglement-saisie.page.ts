import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ImputationPickerComponent } from '@applications/erp/finance/components';
import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { ContrePartieLookupService } from '@applications/erp/finance/services/contre-partie-lookup.service';
import { FacturesOuvertesService } from '@applications/erp/finance/services/factures-ouvertes.service';
import { ReglementApiService } from '@applications/erp/finance/services/reglement-api.service';
import type {
  CompteFinancier,
  ContrePartie,
  FactureOuverte,
  ModePaiement,
  Reglement,
  ReglementImputation,
  ReglementType,
} from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';
import { ConfirmDialogService } from '@lib/anatomy';

@Component({
  selector: 'app-reglement-saisie',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ImputationPickerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reglement-saisie.page.html',
  styleUrl: './reglement-saisie.page.scss',
})
export class ReglementSaisiePage {
  private readonly facturesOuvertes = inject(FacturesOuvertesService);
  private readonly contrePartieLookup = inject(ContrePartieLookupService);
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly reglementApi = inject(ReglementApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly comptes = signal<CompteFinancier[]>([]);

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isCreate = this.id === null || this.id === 'new';

  readonly existing = signal<Reglement | undefined>(undefined);

  // Form state
  protected readonly type = signal<ReglementType>('CLIENT');
  protected readonly date = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly modePaiement = signal<ModePaiement>('VIREMENT');
  protected readonly reference = signal<string>('');
  protected readonly banqueEmise = signal<string>('');
  protected readonly contrePartieId = signal<string>('');
  protected readonly contrePartieName = signal<string>('');
  protected readonly compteFinancierId = signal<string>('');
  protected readonly montantTotal = signal<number>(0);
  protected readonly imputations = signal<ReglementImputation[]>([]);
  protected readonly notes = signal<string>('');

  protected readonly contreParties = signal<ContrePartie[]>([]);
  protected readonly factures = signal<FactureOuverte[]>([]);

  protected readonly busy = signal<boolean>(false);

  constructor() {
    void this.bankApi.listAccounts().then((accounts) => this.comptes.set(accounts));
    if (this.id && !this.isCreate) {
      void this.loadExisting(this.id);
    } else {
      const qpType = this.route.snapshot.queryParamMap.get('type') as ReglementType | null;
      if (qpType) this.type.set(qpType);
      const qpCompte = this.route.snapshot.queryParamMap.get('compteId');
      if (qpCompte) this.compteFinancierId.set(qpCompte);
    }
    this.loadContreParties();
    this.loadFactures();
  }

  private async loadExisting(id: string): Promise<void> {
    try {
      const row = await this.reglementApi.getById(id);
      this.existing.set(row);
      this.type.set(row.type);
      this.date.set(row.date);
      this.modePaiement.set(row.modePaiement);
      this.reference.set(row.reference ?? '');
      this.banqueEmise.set(row.banqueEmise ?? '');
      this.contrePartieId.set(row.contrePartieId);
      this.contrePartieName.set(row.contrePartieName ?? '');
      this.compteFinancierId.set(row.compteFinancierId);
      this.montantTotal.set(row.montantTotal);
      this.imputations.set(row.imputations);
      this.notes.set(row.notes ?? '');
      await this.loadFactures();
    } catch {
      this.existing.set(undefined);
    }
  }

  readonly isReadonly = computed(
    () => !!this.existing() && (this.existing()!.status === 'VALIDE' || !!this.existing()!.ecritureId),
  );

  setType(t: ReglementType): void {
    if (this.isReadonly() || !this.isCreate) return;
    this.type.set(t);
    this.contrePartieId.set('');
    this.contrePartieName.set('');
    this.imputations.set([]);
    this.montantTotal.set(0);
    this.loadContreParties();
    this.loadFactures();
  }

  private async loadContreParties(): Promise<void> {
    const list = await this.contrePartieLookup.listByReglementType(this.type());
    this.contreParties.set(list);
  }

  async setContrePartie(id: string): Promise<void> {
    this.contrePartieId.set(id);
    const cp = this.contreParties().find((c) => c.id === id);
    this.contrePartieName.set(cp?.name ?? '');
    await this.loadFactures();
  }

  private async loadFactures(): Promise<void> {
    if (this.type() === 'EMPLOYE') {
      this.factures.set([]);
      return;
    }
    const t = this.type();
    if (t !== 'CLIENT' && t !== 'FOURNISSEUR') {
      this.factures.set([]);
      return;
    }
    const list = await this.facturesOuvertes.list(t, this.contrePartieId() || undefined);
    this.factures.set(list);
  }

  onImputationsChange(imps: ReglementImputation[]): void {
    this.imputations.set(imps);
  }

  onMontantChange(v: number): void {
    this.montantTotal.set(v);
  }

  readonly canSave = computed(() => {
    if (this.isReadonly()) return false;
    if (!this.contrePartieId()) return false;
    if (!this.compteFinancierId()) return false;
    if (!this.date()) return false;
    if (this.montantTotal() <= 0) return false;
    if (this.type() !== 'EMPLOYE' && this.imputations().length === 0) return false;
    return true;
  });

  readonly impDiff = computed(() => {
    const imp = this.imputations().reduce((s, i) => s + i.montantImpute, 0);
    return Math.round((imp - this.montantTotal()) * 100) / 100;
  });

  async saveAsDraft(): Promise<void> {
    await this.persist('BROUILLON');
  }

  async saveAndValide(): Promise<void> {
    await this.persist('VALIDE');
  }

  async cancelReglement(): Promise<void> {
    if (!this.id || !this.existing()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Annuler ce règlement ?',
      message: ' ',
      confirmLabel: 'Annuler',
      cancelLabel: 'Retour',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.reglementApi.annuler(this.id);
      this.router.navigate(['/finance/reglements']);
    } finally {
      this.busy.set(false);
    }
  }

  async deleteReglement(): Promise<void> {
    if (!this.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer définitivement ce règlement ?',
      message: ' ',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.reglementApi.delete(this.id);
      this.router.navigate(['/finance/reglements']);
    } finally {
      this.busy.set(false);
    }
  }

  private async persist(targetStatus: 'BROUILLON' | 'VALIDE'): Promise<void> {
    if (!this.canSave()) return;
    this.busy.set(true);
    try {
      const compteLib = this.comptes().find((c) => c.id === this.compteFinancierId())?.libelle;
      const payload = {
        type: this.type(),
        date: this.date(),
        modePaiement: this.modePaiement(),
        reference: this.reference() || undefined,
        banqueEmise: this.banqueEmise() || undefined,
        contrePartieId: this.contrePartieId(),
        contrePartieName: this.contrePartieName(),
        compteFinancierId: this.compteFinancierId(),
        compteFinancierLibelle: compteLib,
        montantTotal: this.montantTotal(),
        imputations: this.imputations(),
        status: 'BROUILLON' as const,
        notes: this.notes() || undefined,
      };

      let reglement: Reglement;
      if (this.existing()) {
        reglement = await this.reglementApi.update(this.id!, payload);
      } else {
        reglement = await this.reglementApi.create(payload);
      }

      if (targetStatus === 'VALIDE') {
        reglement = await this.reglementApi.comptabiliser(reglement.id);
      }

      this.router.navigate(['/finance/reglements', reglement.id]);
    } finally {
      this.busy.set(false);
    }
  }

  back(): void {
    this.router.navigate(['/finance/reglements']);
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
