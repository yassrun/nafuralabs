import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  Avoir,
  AvoirCreate,
  AvoirStatus,
  AvoirUpdate,
} from '@app/ventes/models';

import { AvoirClientApiService } from './avoir-client-api.service';

@Injectable({ providedIn: 'root' })
export class AvoirFacade extends GridFacade<Avoir, AvoirCreate, AvoirUpdate> {
  protected override api = inject(AvoirClientApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    this.lookupsSignal.set({
      clients: [],
      factures: [],
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
