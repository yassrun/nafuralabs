import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  NonConformite,
  NonConformiteCreate,
  NonConformiteUpdate,
} from '@applications/erp/hse/models';

import { ChantierLookupService } from '@applications/erp/chantiers/services/chantier-lookup.service';
import { NcApiService } from './nc-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

@Injectable({ providedIn: 'root' })
export class NcFacade extends GridFacade<NonConformite, NonConformiteCreate, NonConformiteUpdate> {
  protected override api = inject(NcApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly chantierLookup = inject(ChantierLookupService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    this.lookupsSignal.set(await this.chantierLookup.asLookupContext('chantiers'));
  }

  async traiter(id: string): Promise<NonConformite> {
    const r = await this.api.traiter(id);
    this.audit.log('UPDATE', 'NC', r.id, r.numero ?? r.id, 'Statut → EN COURS');
    return r;
  }

  async verifier(id: string): Promise<NonConformite> {
    const r = await this.api.verifier(id);
    this.audit.log('UPDATE', 'NC', r.id, r.numero ?? r.id, 'Statut → VÉRIFIÉE');
    return r;
  }

  async cloturer(id: string): Promise<NonConformite> {
    const r = await this.api.cloturer(id);
    this.audit.log('UPDATE', 'NC', r.id, r.numero ?? r.id, 'Statut → CLÔTURÉE');
    return r;
  }

  protected override onCreateSuccess(item: NonConformite): void {
    this.audit.log('CREATE', 'NC', item.id, item.numero ?? item.id, item.chantierCode);
  }

  protected override onUpdateSuccess(item: NonConformite): void {
    this.audit.log('UPDATE', 'NC', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'NC', '—', 'Non-conformité supprimée');
  }
}
