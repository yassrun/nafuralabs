import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { EmployeApiService } from '@applications/erp/pages/rh/employes/services/employe-api.service';
import type { Conge, CongeCreate, CongeUpdate } from '@applications/erp/rh/models';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { CongeApiService } from './conge-api.service';

@Injectable({ providedIn: 'root' })
export class CongeFacade extends GridFacade<Conge, CongeCreate, CongeUpdate> {
  protected override api = inject(CongeApiService);
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

  async approuver(id: string): Promise<Conge> {
    const c = await this.api.approve(id);
    this.audit.log('APPROVE', 'CONGE', c.id, c.numero ?? c.id,
      `${c.employeNom ?? c.employeId} — ${c.dateDebut} → ${c.dateFin} (${c.nombreJours} j)`);
    return c;
  }

  async refuser(id: string, motif: string): Promise<Conge> {
    const c = await this.api.reject(id, motif);
    this.audit.log('REJECT', 'CONGE', c.id, c.numero ?? c.id, `Motif : ${motif}`);
    return c;
  }

  async demarrer(id: string): Promise<Conge> {
    const c = await this.api.update(id, { status: 'EN_COURS' });
    this.audit.log('UPDATE', 'CONGE', c.id, c.numero ?? c.id, 'Démarré (EN_COURS)');
    return c;
  }

  async solder(id: string): Promise<Conge> {
    const c = await this.api.update(id, { status: 'SOLDE' });
    this.audit.log('UPDATE', 'CONGE', c.id, c.numero ?? c.id, 'Soldé');
    return c;
  }

  protected override onCreateSuccess(item: Conge): void {
    this.audit.log('CREATE', 'CONGE', item.id, item.numero ?? item.id,
      `${item.type} — ${item.dateDebut} → ${item.dateFin} (${item.nombreJours} j)`);
  }

  protected override onUpdateSuccess(item: Conge): void {
    this.audit.log('UPDATE', 'CONGE', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'CONGE', '—', 'Congé supprimé');
  }
}
