import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  FactureClient,
  LotChantier,
  Situation,
  SituationCreate,
  SituationStatus,
  SituationUpdate,
} from '@app/chantiers/models';
import { ErpAuditService, AuditAction } from '@app/socle/shell/erp-audit.service';
import { ChantierApiService } from '@app/chantiers/services/chantier-api.service';
import { ChantierLotApiService } from '@app/chantiers/services/chantier-lot-api.service';

import { SituationApiService } from './situation-api.service';

@Injectable({ providedIn: 'root' })
export class SituationFacade extends GridFacade<
  Situation,
  SituationCreate,
  SituationUpdate
> {
  protected override api = inject(SituationApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    this.lookupsSignal.set({
      chantiers: [],
      clients: [],
      employees: [],
    });
  }

  /** GET chantier by id for TVA / RG prefill — not a collection dump. */
  async loadChantierPrefill(chantierId: string): Promise<{
    tvaTaux: number;
    retenueGarantie: number;
    avancePercue?: number;
  } | null> {
    try {
      const c = await this.chantierApi.getById(chantierId);
      return {
        tvaTaux: c.tvaTaux ?? 20,
        retenueGarantie: c.cautionGarantie ?? 7,
        avancePercue: c.avancePercue ?? 0,
      };
    } catch {
      return null;
    }
  }

  /** Bonjour-de-route pour les composants de page : récupère lots du chantier. */
  async loadLots(chantierId: string): Promise<LotChantier[]> {
    return this.lotApi.listByChantier(chantierId);
  }

  /** Cumul HT des situations FACTUREES/PAYEES précédentes pour un chantier. */
  async getCumulPrecedent(chantierId: string): Promise<number> {
    return this.api.getCumulPrecedent(chantierId);
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
