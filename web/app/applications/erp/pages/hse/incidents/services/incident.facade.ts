import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Incident,
  IncidentCreate,
  IncidentUpdate,
} from '@applications/erp/hse/models';

import { ChantierLookupService } from '@applications/erp/chantiers/services/chantier-lookup.service';
import { IncidentApiService } from './incident-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class IncidentFacade extends GridFacade<Incident, IncidentCreate, IncidentUpdate> {
  protected override api = inject(IncidentApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly chantierLookup = inject(ChantierLookupService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    const context = await this.chantierLookup.asLookupContext('chantiers');
    this.lookupsSignal.set(context);
  }

  async declarer(id: string): Promise<Incident> {
    const r = await this.api.update(id, { status: 'DECLARE' });
    this.audit.log('UPDATE', 'INCIDENT', r.id, r.numero ?? r.id, 'Statut → DÉCLARÉ');
    return r;
  }

  async investiguer(id: string): Promise<Incident> {
    const r = await this.api.investiguer(id);
    this.audit.log('UPDATE', 'INCIDENT', r.id, r.numero ?? r.id, 'Statut → EN INVESTIGATION');
    return r;
  }

  async cloturer(id: string): Promise<Incident> {
    const r = await this.api.clore(id);
    this.audit.log('UPDATE', 'INCIDENT', r.id, r.numero ?? r.id, 'Statut → CLÔTURÉ');
    return r;
  }

  protected override onCreateSuccess(item: Incident): void {
    this.audit.log('CREATE', 'INCIDENT', item.id, item.numero ?? item.id, item.chantierCode);
  }

  protected override onUpdateSuccess(item: Incident): void {
    this.audit.log('UPDATE', 'INCIDENT', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'INCIDENT', '—', 'Incident supprimé');
  }
}
