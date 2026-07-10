import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Employe,
  EmployeCreate,
  EmployeUpdate,
  StatutEmploye,
} from '@applications/erp/rh/models';

import { EmployeApiService } from './employe-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class EmployeFacade extends GridFacade<Employe, EmployeCreate, EmployeUpdate> {
  protected override api = inject(EmployeApiService);
  private readonly audit = inject(ErpAuditService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    // No external lookups needed for employes
  }

  async changeStatut(id: string, statut: StatutEmploye): Promise<Employe> {
    const r = await this.api.update(id, { statut });
    this.audit.log('UPDATE', 'EMPLOYE', r.id, r.matricule ?? r.id, `Statut → ${statut}`);
    return r;
  }

  protected override onCreateSuccess(item: Employe): void {
    this.audit.log('CREATE', 'EMPLOYE', item.id, item.matricule ?? item.id,
      `${item.nom} ${item.prenom}`.trim() || undefined);
  }

  protected override onUpdateSuccess(item: Employe): void {
    this.audit.log('UPDATE', 'EMPLOYE', item.id, item.matricule ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'EMPLOYE', '—', 'Employé supprimé');
  }
}
