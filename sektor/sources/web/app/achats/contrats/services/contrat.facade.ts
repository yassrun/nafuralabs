import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext, LookupItem } from '@platform/lib/anatomy/types';
import type { ContratAchat, ContratAchatCreate, ContratAchatStatus, ContratAchatUpdate } from '@app/achats/models';
import { ErpAuditService, AuditAction } from '@app/socle/shell/erp-audit.service';

import { ContratApiService } from './contrat-api.service';

@Injectable({ providedIn: 'root' })
export class ContratFacade extends GridFacade<ContratAchat, ContratAchatCreate, ContratAchatUpdate> {
  protected override api = inject(ContratApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['fournisseurs'] !== undefined) return;
    this.lookupsSignal.set({ fournisseurs: [] });
  }

  ensureFournisseurLookup(contrat: ContratAchat): void {
    if (!contrat.fournisseurId) return;
    const base = { ...this.lookupsSignal() };
    const fournisseurs: LookupItem[] = [...(base['fournisseurs'] ?? [])];
    if (!fournisseurs.some((f) => f.key === contrat.fournisseurId)) {
      fournisseurs.push({
        key: contrat.fournisseurId,
        value: contrat.fournisseurName?.trim() || contrat.fournisseurId,
      });
      this.lookupsSignal.set({ ...base, fournisseurs });
    }
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
