import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import type {
  Avoir,
  AvoirCreate,
  AvoirStatus,
  AvoirUpdate,
} from '@applications/erp/ventes/models';

import { AvoirClientApiService } from './avoir-client-api.service';
import { FactureClientApiService } from '@applications/erp/pages/ventes/factures/services/facture-client-api.service';

@Injectable({ providedIn: 'root' })
export class AvoirFacade extends GridFacade<Avoir, AvoirCreate, AvoirUpdate> {
  protected override api = inject(AvoirClientApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly factureApi = inject(FactureClientApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    const [clientsRes, facturesRes] = await Promise.all([
      this.partnersApi.listByRole('CLIENT', { page: 0, pageSize: 500 }),
      this.factureApi.getAll({ page: 0, pageSize: 500 }),
    ]);
    this.lookupsSignal.set({
      clients: clientsRes.items.map((c) => ({
        key: c.id,
        value: `${c.code} — ${c.raisonSociale}`,
        data: { ice: c.ice },
      })),
      factures: facturesRes.items.map((f) => ({
        key: f.id,
        value: `${f.numero} — ${f.clientName ?? ''}`,
        data: {
          clientId: f.clientId,
          clientName: f.clientName,
          totalHt: f.totalHt,
          netAPayerTtc: f.netAPayerTtc,
          numero: f.numero,
        },
      })),
    });
  }

  private changeStatus(id: string, status: AvoirStatus): Promise<Avoir> {
    return this.api.update(id, { status });
  }

  async emit(id: string): Promise<Avoir> {
    return this.changeStatus(id, 'EMIS');
  }

  async imputer(id: string): Promise<Avoir> {
    return this.changeStatus(id, 'IMPUTE');
  }

  async rembourser(id: string): Promise<Avoir> {
    return this.changeStatus(id, 'REMBOURSE');
  }

  async cancel(id: string): Promise<Avoir> {
    return this.changeStatus(id, 'ANNULE');
  }
}
