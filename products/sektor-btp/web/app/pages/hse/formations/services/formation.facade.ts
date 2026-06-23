import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Formation,
  FormationCreate,
  FormationUpdate,
} from '@applications/erp/hse/models';

import { FormationApiService } from './formation-api.service';

@Injectable({ providedIn: 'root' })
export class FormationFacade extends GridFacade<Formation, FormationCreate, FormationUpdate> {
  protected override api = inject(FormationApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['loaded']) return;
    this.lookupsSignal.set({ loaded: [{ key: true, value: 'true' }] });
  }

  async demarrer(id: string): Promise<Formation> {
    return this.api.update(id, { status: 'EN_COURS' });
  }

  async terminer(id: string): Promise<Formation> {
    return this.api.cloturer(id);
  }

  async annuler(id: string): Promise<Formation> {
    return this.api.update(id, { status: 'ANNULEE' });
  }
}
