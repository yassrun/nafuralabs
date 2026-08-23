import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  BonCommandeClient,
  BCClientCreate,
  BCClientStatus,
  BCClientUpdate,
} from '@app/ventes/models';

import { BccApiService } from './bcc-api.service';

@Injectable({ providedIn: 'root' })
export class BccFacade extends GridFacade<BonCommandeClient, BCClientCreate, BCClientUpdate> {
  protected override api = inject(BccApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    this.lookupsSignal.set({
      clients: [],
      chantiers: [],
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
