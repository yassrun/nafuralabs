import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import { BankReconciliationApiService } from '@app/finance/services/bank-reconciliation-api.service';
import type {
  Encaissement,
  FactureClient,
  FactureCreate,
  FactureUpdate,
} from '@app/ventes/models';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';

import { FactureApiService } from './facture-api.service';

@Injectable({ providedIn: 'root' })
export class FactureFacade extends GridFacade<
  FactureClient,
  FactureCreate,
  FactureUpdate
> {
  protected override api = inject(FactureApiService);
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    const bankAccounts = await this.bankApi.listAccounts();
    const banques = bankAccounts.filter((b) => b.type === 'BANQUE');
    this.lookupsSignal.set({
      clients: this.lookupsSignal()['clients'] ?? [],
      chantiers: [],
      banques: banques.map((b) => ({
        key: b.id,
        value: b.libelle,
        data: { code: b.code },
      })),
    });
  }

  ensureClientLookup(facture: FactureClient): void {
    if (!facture.clientId) return;
    const base = { ...this.lookupsSignal() };
    const clients = [...(base['clients'] ?? [])];
    if (!clients.some((c) => c.key === facture.clientId)) {
      clients.push({
        key: facture.clientId,
        value: facture.clientName?.trim() || facture.clientId,
      });
      this.lookupsSignal.set({ ...base, clients });
    }
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
