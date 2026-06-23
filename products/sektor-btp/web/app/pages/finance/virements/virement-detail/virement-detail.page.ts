import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { VirementApiService } from '@applications/erp/finance/services/virement-api.service';
import type { CompteFinancier, VirementInterne, VirementInterneStatus } from '@applications/erp/finance/models';

import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';
import { ButtonComponent } from '@lib/anatomy/components';
import { ConfirmDialogService } from '@lib/anatomy';

@Component({
  selector: 'app-virement-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SubmitApprovalButtonComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './virement-detail.page.html',
  styleUrl: './virement-detail.page.scss',
})
export class VirementDetailPage {
  private readonly api = inject(VirementApiService);
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly comptes = signal<CompteFinancier[]>([]);
  protected readonly existing = signal<VirementInterne | undefined>(undefined);

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isCreate = this.id === null || this.id === 'new';

  protected readonly date = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly compteSourceId = signal<string>('');
  protected readonly compteDestId = signal<string>('');
  protected readonly montant = signal<number>(0);
  protected readonly motif = signal<string>('');
  protected readonly reference = signal<string>('');
  protected readonly status = signal<VirementInterneStatus>('BROUILLON');
  protected readonly notes = signal<string>('');
  protected readonly busy = signal<boolean>(false);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    this.comptes.set(await this.bankApi.listAccounts());
    const sourceQp = this.route.snapshot.queryParamMap.get('sourceId');
    if (this.id && !this.isCreate) {
      const v = await this.api.getInterne(this.id);
      this.existing.set(v);
      this.date.set(v.date);
      this.compteSourceId.set(v.compteSourceId);
      this.compteDestId.set(v.compteDestId);
      this.montant.set(v.montant);
      this.motif.set(v.motif);
      this.reference.set(v.reference ?? '');
      this.status.set(v.status);
      this.notes.set(v.notes ?? '');
    } else if (sourceQp) {
      this.compteSourceId.set(sourceQp);
    }
  }

  readonly compteSource = computed(() =>
    this.comptes().find((c) => c.id === this.compteSourceId()),
  );

  readonly compteDest = computed(() =>
    this.comptes().find((c) => c.id === this.compteDestId()),
  );

  readonly soldeApresSource = computed(() => {
    const c = this.compteSource();
    return c ? c.soldeActuel - this.montant() : 0;
  });

  readonly soldeApresDest = computed(() => {
    const c = this.compteDest();
    return c ? c.soldeActuel + this.montant() : 0;
  });

  readonly comptesDest = computed(() =>
    this.comptes().filter((c) => c.id !== this.compteSourceId() && c.isActive),
  );

  readonly canSave = computed(() => {
    return (
      this.compteSourceId() &&
      this.compteDestId() &&
      this.compteSourceId() !== this.compteDestId() &&
      this.montant() > 0 &&
      this.motif().trim().length > 0 &&
      this.date()
    );
  });

  async saveAsBrouillon(): Promise<void> {
    await this.persist('BROUILLON');
  }

  async saveAndValide(): Promise<void> {
    await this.persist('VALIDE');
  }

  async cancel(): Promise<void> {
    if (!this.id || this.isCreate) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Annuler ce virement ?',
      message: ' ',
      confirmLabel: 'Annuler',
      cancelLabel: 'Retour',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.api.annulerInterne(this.id);
      this.router.navigate(['/finance/virements']);
    } finally {
      this.busy.set(false);
    }
  }

  async deleteVirement(): Promise<void> {
    if (!this.id || this.isCreate) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer définitivement ce virement ?',
      message: ' ',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.api.deleteInterne(this.id);
      this.router.navigate(['/finance/virements']);
    } finally {
      this.busy.set(false);
    }
  }

  private async persist(targetStatus: VirementInterneStatus): Promise<void> {
    if (!this.canSave()) return;
    this.busy.set(true);
    try {
      const payload = {
        date: this.date(),
        compteSourceId: this.compteSourceId(),
        compteSourceLibelle: this.compteSource()?.libelle,
        compteDestId: this.compteDestId(),
        compteDestLibelle: this.compteDest()?.libelle,
        montant: this.montant(),
        motif: this.motif(),
        reference: this.reference() || undefined,
        notes: this.notes() || undefined,
        status: targetStatus,
      };
      if (this.existing()) {
        if (targetStatus === 'VALIDE' && this.existing()!.status !== 'VALIDE') {
          await this.api.validerInterne(this.id!);
        }
        this.router.navigate(['/finance/virements', this.id]);
      } else {
        const created = await this.api.createInterne(payload);
        if (targetStatus === 'VALIDE' && created.status !== 'VALIDE') {
          await this.api.validerInterne(created.id);
        }
        this.router.navigate(['/finance/virements', created.id]);
      }
    } finally {
      this.busy.set(false);
    }
  }

  back(): void {
    this.router.navigate(['/finance/virements']);
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
