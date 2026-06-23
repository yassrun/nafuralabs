import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  BCStatus,
  BonCommande,
  BonCommandeCreate,
  BonCommandeUpdate,
} from '@applications/erp/achats/models';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import {
  BcApiService,
  type ApiReceptionAchat,
  type ReceptionAchatCreatePayload,
} from './bc-api.service';

export type { ApiReceptionAchat, ReceptionAchatCreatePayload };

@Injectable({ providedIn: 'root' })
export class BcFacade extends GridFacade<BonCommande, BonCommandeCreate, BonCommandeUpdate> {
  protected override api = inject(BcApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['fournisseurs']) return;
    const res = await this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 });
    this.lookupsSignal.set({
      fournisseurs: res.items.map((f) => ({
        key: f.id,
        value: `${f.code} — ${f.raisonSociale}`,
      })),
    });
  }

  async changeStatus(id: string, next: BCStatus): Promise<BonCommande> {
    let result: BonCommande;
    switch (next) {
      case 'VALIDE':
        result = await this.api.submit(id);
        break;
      case 'ENVOYE':
        result = await this.api.send(id);
        break;
      case 'ACCUSE_RECEPTION':
        result = await this.api.acknowledgeReception(id);
        break;
      case 'CLOTURE':
        result = await this.api.close(id);
        break;
      case 'ANNULE':
        result = await this.api.cancel(id);
        break;
      default:
        result = await this.api.update(id, { status: next });
    }
    const action = next === 'VALIDE' ? 'APPROVE' : next === 'ANNULE' ? 'REJECT' : 'UPDATE';
    this.audit.log(action, 'BC', result.id, result.numero ?? result.id, `Statut → ${next}`);
    return result;
  }

  async listReceptions(bcId: string): Promise<ApiReceptionAchat[]> {
    return this.api.listReceptions(bcId);
  }

  async createReception(
    bcId: string,
    payload: ReceptionAchatCreatePayload,
  ): Promise<ApiReceptionAchat> {
    const rec = await this.api.createReception(bcId, payload);
    this.audit.log('CREATE', 'RECEPTION', rec.id, rec.numero, `BC ${bcId}`);
    return rec;
  }

  protected override onCreateSuccess(item: BonCommande): void {
    this.audit.log(
      'CREATE',
      'BC',
      item.id,
      item.numero ?? item.id,
      item.totalTtc
        ? `Montant TTC : ${item.totalTtc.toLocaleString(this.locale)} MAD`
        : undefined,
    );
  }

  protected override onUpdateSuccess(item: BonCommande): void {
    this.audit.log('UPDATE', 'BC', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'BC', '—', 'BC supprimé');
  }
}
