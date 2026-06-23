import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { ErpLookupService, partnerLookupLabel } from '@applications/erp/shared/services/erp-lookup.service';
import type {
  Encaissement,
  FactureClient,
  FactureCreate,
  FactureUpdate,
} from '@applications/erp/ventes/models';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { FactureApiService } from './facture-api.service';

@Injectable({ providedIn: 'root' })
export class FactureFacade extends GridFacade<
  FactureClient,
  FactureCreate,
  FactureUpdate
> {
  protected override api = inject(FactureApiService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    const [clients, chantiers, bankAccounts] = await Promise.all([
      this.erpLookup.partnersByRole('CLIENT'),
      this.erpLookup.chantiers(),
      this.bankApi.listAccounts(),
    ]);
    const banques = bankAccounts.filter((b) => b.type === 'BANQUE');
    this.lookupsSignal.set({
      clients: clients.map((c) => ({
        key: c.key,
        value: partnerLookupLabel(c),
        data: { ice: (c.data as Record<string, unknown> | undefined)?.['ice'] },
      })),
      chantiers: chantiers.map((c) => ({
        key: c.key,
        value: c.value,
      })),
      banques: banques.map((b) => ({
        key: b.id,
        value: b.libelle,
        data: { code: b.code },
      })),
    });
  }

  async emit(id: string): Promise<FactureClient> {
    const f = await this.api.update(id, { status: 'EMISE' });
    this.audit.log('SUBMIT', 'FACTURE', f.id, f.numero ?? f.id, 'Facture émise');
    return f;
  }

  async cancel(id: string): Promise<FactureClient> {
    const f = await this.api.update(id, { status: 'ANNULEE' });
    this.audit.log('UPDATE', 'FACTURE', f.id, f.numero ?? f.id, 'Annulée');
    return f;
  }

  async litige(id: string, motif: string): Promise<FactureClient> {
    const f = await this.api.update(id, { status: 'EN_LITIGE', motifLitige: motif });
    this.audit.log('REJECT', 'FACTURE', f.id, f.numero ?? f.id, `Litige : ${motif}`);
    return f;
  }

  async resoudreLitige(id: string): Promise<FactureClient> {
    const f = await this.api.update(id, { status: 'EMISE', motifLitige: undefined });
    this.audit.log('UPDATE', 'FACTURE', f.id, f.numero ?? f.id, 'Litige résolu');
    return f;
  }

  async addEncaissement(
    factureId: string,
    encaissement: Omit<Encaissement, 'id' | 'factureId'>,
  ): Promise<FactureClient> {
    const f = await this.api.addEncaissement(factureId, encaissement);
    this.audit.log('CREATE', 'ENCAISSEMENT', factureId, f.numero ?? factureId,
      `+${encaissement.montantTtc?.toLocaleString(this.locale)} MAD (${encaissement.modePaiement})`);
    return f;
  }

  async removeEncaissement(
    factureId: string,
    encaissementId: string,
  ): Promise<FactureClient> {
    const f = await this.api.removeEncaissement(factureId, encaissementId);
    this.audit.log('DELETE', 'ENCAISSEMENT', encaissementId, f.numero ?? factureId,
      'Encaissement supprimé');
    return f;
  }

  protected override onCreateSuccess(item: FactureClient): void {
    this.audit.log('CREATE', 'FACTURE', item.id, item.numero ?? item.id,
      item.netAPayerTtc ? `Net TTC : ${item.netAPayerTtc.toLocaleString(this.locale)} MAD` : undefined);
  }

  protected override onUpdateSuccess(item: FactureClient): void {
    this.audit.log('UPDATE', 'FACTURE', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'FACTURE', '—', 'Facture supprimée');
  }
}
