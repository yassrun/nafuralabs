import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate,
} from '@app/etudes/models';

import { AOCApiService } from './aoc-api.service';
import { DevisApiService } from '../../devis/services/devis-api.service';

@Injectable({ providedIn: 'root' })
export class AOCFacade extends GridFacade<
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate
> {
  protected override api = inject(AOCApiService);
  private readonly devisApi = inject(DevisApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['devis']) return;
    const { items: devis } = await this.devisApi.getAll({ page: 0, pageSize: 500 });
    this.lookupsSignal.set({
      devis: devis.map((d) => ({
        key: d.id,
        value: `${d.numero} V${d.version} — ${d.objet ?? ''}`,
      })),
    });
  }
}
