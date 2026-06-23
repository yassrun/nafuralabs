/**
 * Motif Mouvement Configuration Facade — HTTP via `/api/v1/motifs`.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map, Observable, shareReplay } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import { MotifsApiService } from '../../../../../inventory/services/motifs-api.service';
import type { MotifMouvementConfig, MotifMouvementCreate } from '../models';

@Injectable({ providedIn: 'root' })
export class MotifMouvementFacade implements PartialCrudFacade<MotifMouvementConfig, MotifMouvementCreate> {
  private readonly api = inject(MotifsApiService);

  readonly items$: Observable<MotifMouvementConfig[]> = from(this.api.getAll({ page: 0, pageSize: 500 })).pipe(
    map((res) => res.items ?? []),
    shareReplay(1),
  );
  readonly items = toSignal(this.items$, { initialValue: [] });
  readonly isLoading = signal(false);

  async loadItems(): Promise<ListResponse<MotifMouvementConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      const items = res.items ?? [];
      return { items, total: res.total ?? items.length };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<MotifMouvementConfig> {
    return this.api.getById(id);
  }

  async createItem(_data: MotifMouvementCreate): Promise<MotifMouvementConfig> {
    throw new Error('Motifs are read-only (seeded data)');
  }

  async updateItem(_id: string, _data: Partial<MotifMouvementCreate>): Promise<MotifMouvementConfig> {
    throw new Error('Motifs are read-only (seeded data)');
  }

  async deleteItem(_id: string): Promise<void> {
    throw new Error('Motifs are read-only (seeded data)');
  }
}
