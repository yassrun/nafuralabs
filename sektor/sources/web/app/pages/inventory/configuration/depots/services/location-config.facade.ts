/**
 * Location Configuration Facade — backed by `/api/v1/locations`.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map, Observable } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import { LocationsApiService } from './location-api.service';
import type { LocationConfig, LocationConfigCreate, LocationConfigUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class LocationConfigFacade implements PartialCrudFacade<LocationConfig, LocationConfigCreate> {
  private readonly api = inject(LocationsApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  async loadItems(): Promise<ListResponse<LocationConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      return { items: res.items as LocationConfig[], total: res.total };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<LocationConfig> {
    return this.api.getById(id) as Promise<LocationConfig>;
  }

  async createItem(data: LocationConfigCreate): Promise<LocationConfig> {
    return this.api.create(data as LocationConfigCreate) as Promise<LocationConfig>;
  }

  async updateItem(id: string, data: Partial<LocationConfigUpdate>): Promise<LocationConfig> {
    return this.api.update(id, data) as Promise<LocationConfig>;
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }

  getLocationsForLookup(): Observable<{ id: string; name: string }[]> {
    return this.items$.pipe(
      map((items) => items.map((l) => ({ id: l.id, name: `${l.code} - ${l.name}` })))
    );
  }
}
