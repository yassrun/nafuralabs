import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Devise,
  TauxChange,
  TauxChangeCreate,
  TauxChangeUpdate,
} from '@applications/erp/finance/models';

import { DeviseApiService } from '../../devises/services/devise-api.service';
import { TauxChangeApiService } from './taux-change-api.service';

const SOURCES: { key: string; value: string }[] = [
  { key: 'BAM', value: 'Bank Al-Maghrib' },
  { key: 'MANUEL', value: 'Saisie manuelle' },
  { key: 'API', value: 'API tiers' },
];

@Injectable({ providedIn: 'root' })
export class TauxChangeFacade extends GridFacade<
  TauxChange,
  TauxChangeCreate,
  TauxChangeUpdate
> {
  protected override api = inject(TauxChangeApiService);
  private readonly deviseApi = inject(DeviseApiService);

  private readonly devisesSignal = signal<Devise[]>([]);
  readonly devises = computed(() => this.devisesSignal());

  private readonly lookupsSignal = signal<LookupContext>({
    tauxChangeSource: SOURCES,
  });
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (!this.devisesSignal().length) {
      const res = await this.deviseApi.getAll({ page: 1, pageSize: 500 });
      const devises = res.items;
      this.devisesSignal.set(devises);
      const deviseLookup = devises.map((d) => ({
        key: d.code,
        value: `${d.code} — ${d.libelle}`,
      }));
      this.lookupsSignal.set({
        tauxChangeSource: SOURCES,
        deviseCode: deviseLookup,
      });
    }
  }

  async importFromBam(): Promise<TauxChange[]> {
    const created = await this.api.importFromBam();
    await this.loadItems();
    return created;
  }
}
