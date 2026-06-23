import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { ErpLookupService, partnerLookupLabel } from '@applications/erp/shared/services/erp-lookup.service';
import type {
  FactureClient,
  LotChantier,
  Situation,
  SituationCreate,
  SituationStatus,
  SituationUpdate,
} from '@applications/erp/chantiers/models';
import { ErpAuditService, AuditAction } from '@applications/erp/shell/erp-audit.service';
import { ChantierLotApiService } from '@applications/erp/pages/chantiers/services/chantier-lot-api.service';

import { SituationApiService } from './situation-api.service';

@Injectable({ providedIn: 'root' })
export class SituationFacade extends GridFacade<
  Situation,
  SituationCreate,
  SituationUpdate
> {
  protected override api = inject(SituationApiService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    const [chantiers, clients, employees] = await Promise.all([
      this.api.lookupChantiers(),
      this.erpLookup.partnersByRole('CLIENT'),
      this.erpLookup.employes('ACTIF'),
    ]);
    this.lookupsSignal.set({
      chantiers: chantiers.map((c) => ({
        key: c.id,
        value: `${c.code} — ${c.name}`,
        data: {
          clientId: c.clientId,
          clientName: c.clientName,
          tvaTaux: c.tvaTaux,
          retenueGarantie: c.cautionGarantie ?? 7,
          avancePercue: c.avancePercue ?? 0,
          status: c.status,
        },
      })),
      clients: clients.map((c) => ({
        key: c.key,
        value: partnerLookupLabel(c),
      })),
      employees: employees.map((e) => ({
        key: e.key,
        value: e.value,
        data: { matricule: (e.data as Record<string, unknown> | undefined)?.['matricule'] },
      })),
    });
  }

  /** Bonjour-de-route pour les composants de page : récupère lots du chantier. */
  async loadLots(chantierId: string): Promise<LotChantier[]> {
    return this.lotApi.listByChantier(chantierId);
  }

  override async createItem(input: SituationCreate): Promise<Situation> {
    if (!input.chantierId) {
      throw new Error('Chantier requis');
    }
    const numeroOrdre = await this.nextNumeroOrdre(input.chantierId);
    return super.createItem({ ...input, numeroOrdre });
  }

  async nextNumeroOrdre(chantierId: string): Promise<number> {
    const existing = await this.api.listByChantier(chantierId);
    const maxOrdre = existing.reduce(
      (max, s) => Math.max(max, s.numeroOrdre ?? 0),
      0,
    );
    return maxOrdre + 1;
  }

  async executeTransition(
    id: string,
    endpoint: string,
    payload?: Record<string, unknown>,
  ): Promise<Situation> {
    switch (endpoint) {
      case 'submit':
        return this.changeStatus(id, 'SOUMISE');
      case 'validate':
        return this.changeStatus(id, 'VALIDEE_MOA');
      case 'reject':
        return this.changeStatus(id, 'REJETEE', String(payload?.['note'] ?? ''));
      case 'invoice': {
        const { situation } = await this.emettreFacture(id);
        return situation;
      }
      case 'pay':
        return this.marquerPayee(id);
      default:
        throw new Error(`Transition situation inconnue: ${endpoint}`);
    }
  }

  async changeStatus(
    id: string,
    next: SituationStatus,
    note?: string,
  ): Promise<Situation> {
    let result: Situation;
    if (next === 'SOUMISE') {
      result = await this.api.submit(id);
    } else if (next === 'VALIDEE_MOA') {
      result = await this.api.acceptMoa(id);
    } else if (next === 'REJETEE') {
      result = await this.api.reject(id, note ?? '');
    } else {
      throw new Error(`Transition statut non supportée: ${next}`);
    }

    const action: AuditAction =
      next === 'VALIDEE_MOA' ? 'APPROVE' :
      next === 'REJETEE' ? 'REJECT' :
      next === 'SOUMISE' ? 'SUBMIT' : 'UPDATE';
    this.audit.log(action, 'SITUATION', result.id, result.numero ?? result.id,
      `Statut → ${next}${note ? ` (${note})` : ''}`);
    return result;
  }

  async emettreFacture(
    id: string,
  ): Promise<{ situation: Situation; facture: FactureClient }> {
    const result = await this.api.convertToFacture(id);
    this.audit.log('CREATE', 'FACTURE', result.facture.id,
      result.facture.numero ?? result.facture.id,
      `Émise depuis ${result.situation.numero} — ${result.facture.totalTtc?.toLocaleString(this.locale)} MAD TTC`);
    return result;
  }

  async marquerPayee(id: string): Promise<Situation> {
    const result = await this.api.marquerPayee(id);
    this.audit.log('UPDATE', 'SITUATION', result.id, result.numero ?? result.id,
      `Marquée payée — ${result.netAPayerTtc?.toLocaleString(this.locale)} MAD`);
    return result;
  }

  protected override onCreateSuccess(item: Situation): void {
    this.audit.log('CREATE', 'SITUATION', item.id, item.numero ?? item.id,
      `Travaux période : ${item.travauxPeriodeHt?.toLocaleString(this.locale)} MAD HT`);
  }

  protected override onUpdateSuccess(item: Situation): void {
    this.audit.log('UPDATE', 'SITUATION', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'SITUATION', '—', 'Situation supprimée');
  }
}
