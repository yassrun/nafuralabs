import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Fournisseur,
  FournisseurCreate,
  FournisseurUpdate,
} from '@applications/erp/achats/models';

import { FournisseurApiService } from './fournisseur-api.service';

@Injectable({ providedIn: 'root' })
export class FournisseurFacade extends GridFacade<Fournisseur, FournisseurCreate, FournisseurUpdate> {
  protected override api = inject(FournisseurApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    // No external lookups needed for fournisseur
  }
}
