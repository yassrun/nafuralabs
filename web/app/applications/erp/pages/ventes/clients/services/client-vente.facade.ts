import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  ClientVente,
  ClientVenteCreate,
  ClientVenteUpdate,
} from '@applications/erp/ventes/models';

import { ClientApiService } from './client-api.service';

@Injectable({ providedIn: 'root' })
export class ClientVenteFacade extends GridFacade<ClientVente, ClientVenteCreate, ClientVenteUpdate> {
  protected override api = inject(ClientApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    // No external lookups needed for client
  }
}
