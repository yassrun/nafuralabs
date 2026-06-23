import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Metre,
  MetreCreate,
  MetreUpdate,
} from '@applications/erp/etudes/models';

import { MetreApiService } from './metre-api.service';

@Injectable({ providedIn: 'root' })
export class MetreFacade extends GridFacade<Metre, MetreCreate, MetreUpdate> {
  protected override api = inject(MetreApiService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['metreurs']) return;
    const { items } = await this.api.getAll({ page: 0, pageSize: 500 });
    const seen = new Set<string>();
    const metreurs: { key: string; value: string }[] = [];
    for (const m of items) {
      if (!m.metreurId || seen.has(m.metreurId)) continue;
      seen.add(m.metreurId);
      metreurs.push({
        key: m.metreurId,
        value: m.metreurName ? `${m.metreurName}` : m.metreurId,
      });
    }
    this.lookupsSignal.set({ metreurs });
  }
}
