import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate,
} from '@applications/erp/etudes/models';

import { AOCApiService } from './aoc-api.service';
import { DevisApiService } from '../../devis/services/devis-api.service';
import { MetreApiService } from '../../metres/services/metre-api.service';

@Injectable({ providedIn: 'root' })
export class AOCFacade extends GridFacade<
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate
> {
  protected override api = inject(AOCApiService);
  private readonly devisApi = inject(DevisApiService);
  private readonly metreApi = inject(MetreApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['devis']) return;
    const [{ items: devis }, { items: metres }] = await Promise.all([
      this.devisApi.getAll({ page: 0, pageSize: 500 }),
      this.metreApi.getAll({ page: 0, pageSize: 500 }),
    ]);
    this.lookupsSignal.set({
      devis: devis.map((d) => ({
        key: d.id,
        value: `${d.numero} V${d.version} — ${d.objet ?? ''}`,
      })),
      metres: metres.map((m) => ({
        key: m.id,
        value: `${m.numero} — ${m.projetNom}`,
      })),
    });
  }
}
