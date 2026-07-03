import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import { ErpLookupService, partnerLookupLabel } from '@applications/erp/shared/services/erp-lookup.service';
import type {
  BonCommandeClient,
  OffreCommerciale,
  OffreCreate,
  OffreStatus,
  OffreUpdate,
} from '@applications/erp/ventes/models';

import { OffreApiService } from './offre-api.service';

@Injectable({ providedIn: 'root' })
export class OffreFacade extends GridFacade<OffreCommerciale, OffreCreate, OffreUpdate> {
  protected override api = inject(OffreApiService);
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

  async convertToBcc(id: string): Promise<{ offre: OffreCommerciale; bcc: BonCommandeClient }> {
    return this.api.convertToBcc(id);
  }

  async changeStatus(
    id: string,
    status: OffreStatus,
    motifRefus?: string,
  ): Promise<OffreCommerciale> {
    switch (status) {
      case 'ENVOYEE':
        return this.api.send(id);
      case 'ACCEPTEE':
        return this.api.accept(id);
      case 'REFUSEE':
        return this.api.refuse(id, motifRefus?.trim() ?? '');
      case 'ANNULEE':
        return this.api.cancel(id);
      default:
        return this.api.update(id, { status, motifRefus });
    }
  }
}
