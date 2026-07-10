import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { EmployeApiService } from '@applications/erp/pages/rh/employes/services/employe-api.service';
import type { FichePaie, FichePaieCreate, FichePaieUpdate } from '@applications/erp/rh/models';

import { PaieApiService } from './paie-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class PaieFacade extends GridFacade<FichePaie, FichePaieCreate, FichePaieUpdate> {
  protected override api = inject(PaieApiService);
  private readonly employeApi = inject(EmployeApiService);
  private readonly audit = inject(ErpAuditService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['employes']) return;
    try {
      const { items: employes } = await this.employeApi.getAll();
      this.lookupsSignal.set({
        employes: employes.map((e) => ({
          key: e.id,
          value: `${e.matricule} — ${e.nom} ${e.prenom}`,
        })),
      });
    } catch {
      this.lookupsSignal.set({ employes: [] });
    }
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
