import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Inspection,
  InspectionCreate,
  InspectionUpdate,
  StatutInspection,
} from '@applications/erp/hse/models';

import { ChantierLookupService } from '@applications/erp/chantiers/services/chantier-lookup.service';
import { InspectionApiService } from './inspection-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class InspectionFacade extends GridFacade<Inspection, InspectionCreate, InspectionUpdate> {
  protected override api = inject(InspectionApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly chantierLookup = inject(ChantierLookupService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    this.lookupsSignal.set(await this.chantierLookup.asLookupContext('chantiers'));
  }

  async demarrer(id: string): Promise<Inspection> {
    const r = await this.api.update(id, { status: 'EN_COURS' as StatutInspection });
    this.audit.log('UPDATE', 'INSPECTION', r.id, r.numero ?? r.id, 'Statut → EN COURS');
    return r;
  }

  async terminer(id: string): Promise<Inspection> {
    const r = await this.api.update(id, { status: 'TERMINEE' as StatutInspection });
    this.audit.log('UPDATE', 'INSPECTION', r.id, r.numero ?? r.id, 'Statut → TERMINÉE');
    return r;
  }

  async annuler(id: string): Promise<Inspection> {
    const r = await this.api.update(id, { status: 'ANNULEE' as StatutInspection });
    this.audit.log('UPDATE', 'INSPECTION', r.id, r.numero ?? r.id, 'Statut → ANNULÉE');
    return r;
  }

  protected override onCreateSuccess(item: Inspection): void {
    this.audit.log('CREATE', 'INSPECTION', item.id, item.numero ?? item.id, item.chantierCode);
  }

  protected override onUpdateSuccess(item: Inspection): void {
    this.audit.log('UPDATE', 'INSPECTION', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'INSPECTION', '—', 'Inspection supprimée');
  }
}
