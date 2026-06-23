import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type { ContratAchat, ContratAchatCreate, ContratAchatStatus, ContratAchatUpdate } from '@applications/erp/achats/models';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import { ErpAuditService, AuditAction } from '@applications/erp/shell/erp-audit.service';

import { ContratApiService } from './contrat-api.service';

@Injectable({ providedIn: 'root' })
export class ContratFacade extends GridFacade<ContratAchat, ContratAchatCreate, ContratAchatUpdate> {
  protected override api = inject(ContratApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['fournisseurs']) return;
    const res = await this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 });
    this.lookupsSignal.set({
      fournisseurs: res.items
        .filter((f) => f.isActive !== false)
        .map((f) => ({ key: f.id, value: `${f.code} — ${f.raisonSociale}` })),
    });
  }

  async changeStatus(id: string, next: ContratAchatStatus): Promise<ContratAchat> {
    let result: ContratAchat;
    if (next === 'SIGNE') {
      result = await this.api.sign(id);
    } else if (next === 'RESILIE') {
      result = await this.api.terminate(id);
    } else {
      result = await this.api.update(id, { status: next });
    }
    const action: AuditAction =
      next === 'SIGNE' ? 'APPROVE' :
      next === 'RESILIE' ? 'REJECT' : 'UPDATE';
    this.audit.log(action, 'CONTRAT', result.id, result.numero ?? result.id, `Statut → ${next}`);
    return result;
  }

  protected override onCreateSuccess(item: ContratAchat): void {
    this.audit.log('CREATE', 'CONTRAT', item.id, item.numero ?? item.id);
  }

  protected override onUpdateSuccess(item: ContratAchat): void {
    this.audit.log('UPDATE', 'CONTRAT', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'CONTRAT', '—', 'Contrat supprimé');
  }
}
