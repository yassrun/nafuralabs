import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type { FichePaie, FichePaieCreate, FichePaieUpdate } from '@app/rh/models';

import { PaieApiService } from './paie-api.service';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class PaieFacade extends GridFacade<FichePaie, FichePaieCreate, FichePaieUpdate> {
  protected override api = inject(PaieApiService);
  private readonly audit = inject(ErpAuditService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['employes']) return;
    this.lookupsSignal.set({ employes: [] });
  }

  async valider(id: string): Promise<FichePaie> {
    const r = await this.api.valider(id);
    this.audit.log('APPROVE', 'FICHE_PAIE', r.id, r.numero ?? r.id, 'Fiche validée');
    return r;
  }

  async payer(id: string): Promise<FichePaie> {
    const r = await this.api.payer(id);
    this.audit.log('UPDATE', 'FICHE_PAIE', r.id, r.numero ?? r.id, 'Paiement enregistré');
    return r;
  }

  protected override onCreateSuccess(item: FichePaie): void {
    this.audit.log('CREATE', 'FICHE_PAIE', item.id, item.numero ?? item.id, item.mois);
  }

  protected override onUpdateSuccess(item: FichePaie): void {
    this.audit.log('UPDATE', 'FICHE_PAIE', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'FICHE_PAIE', '—', 'Fiche de paie supprimée');
  }
}
