import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { ErpLookupService, partnerLookupLabel } from '@applications/erp/shared/services/erp-lookup.service';
import type {
  BonCommandeClient,
  BCClientCreate,
  BCClientStatus,
  BCClientUpdate,
} from '@applications/erp/ventes/models';

import { BccApiService } from './bcc-api.service';

@Injectable({ providedIn: 'root' })
export class BccFacade extends GridFacade<BonCommandeClient, BCClientCreate, BCClientUpdate> {
  protected override api = inject(BccApiService);
  private readonly erpLookup = inject(ErpLookupService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    const [clients, chantiers] = await Promise.all([
      this.erpLookup.partnersByRole('CLIENT'),
      this.erpLookup.chantiers(),
    ]);
    this.lookupsSignal.set({
      clients: clients.map((c) => ({
        key: c.key,
        value: partnerLookupLabel(c),
      })),
      chantiers: chantiers.map((c) => ({
        key: c.key,
        value: c.value,
      })),
    });
  }

  async changeStatus(id: string, status: BCClientStatus): Promise<BonCommandeClient> {
    if (status === 'EN_COURS') {
      return this.api.confirm(id);
    }
    if (status === 'FACTURE') {
      return this.api.convertToFacture(id);
    }
    return this.api.update(id, { status });
  }
}
