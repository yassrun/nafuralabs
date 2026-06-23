import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Devis,
  DevisCreate,
  DevisUpdate,
} from '@applications/erp/etudes/models';

import { DevisApiService } from './devis-api.service';
import { MetreApiService } from '../../metres/services/metre-api.service';
import {
  ErpLookupService,
  partnerLookupLabel,
} from '@applications/erp/shared/services/erp-lookup.service';

@Injectable({ providedIn: 'root' })
export class DevisFacade extends GridFacade<Devis, DevisCreate, DevisUpdate> {
  protected override api = inject(DevisApiService);
  private readonly metreApi = inject(MetreApiService);
  private readonly erpLookup = inject(ErpLookupService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    const [{ items: devis }, { items: metres }, partners] = await Promise.all([
      this.api.getAll({ page: 0, pageSize: 500 }),
      this.metreApi.getAll({ page: 0, pageSize: 500 }),
      this.erpLookup.partnersByRole('CLIENT'),
    ]);
    const clientMap = new Map<string, { key: string; value: string }>();
    for (const p of partners) {
      const label = partnerLookupLabel(p);
      const id = String(p.key);
      clientMap.set(id, { key: id, value: label });
      const code = (p.data as Record<string, unknown> | undefined)?.['code'];
      if (typeof code === 'string' && code.trim()) {
        clientMap.set(code.trim(), { key: code.trim(), value: label });
      }
    }
    for (const d of devis) {
      if (!d.clientId || clientMap.has(d.clientId)) continue;
      clientMap.set(d.clientId, {
        key: d.clientId,
        value: d.clientName ? `${d.clientName}` : d.clientId,
      });
    }
    this.lookupsSignal.set({
      clients: [...clientMap.values()],
      metres: metres.map((m) => ({
        key: m.id,
        value: `${m.numero} — ${m.projetNom}`,
      })),
    });
  }

  async emit(id: string): Promise<Devis> {
    return this.api.submit(id);
  }

  async newVersion(id: string, modifications: string): Promise<Devis> {
    return this.api.createVersion(id, modifications);
  }

  async approve(id: string): Promise<Devis> {
    return this.api.marquerGagne(id);
  }

  async lose(id: string, motif: string): Promise<Devis> {
    return this.api.update(id, { status: 'PERDU', motifRefus: motif });
  }

  async cancel(id: string): Promise<Devis> {
    return this.api.update(id, { status: 'ANNULE' });
  }
}
