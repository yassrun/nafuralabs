/**
 * Costing Method Configuration Facade — backed by `/api/v1/costing-methods`.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import { CostingMethodsApiService } from './costing-method-api.service';
import type { CostingMethodConfig, CostingMethodCreate, CostingMethodUpdate } from '../models';

function normalize(dto: CostingMethodConfig): CostingMethodConfig {
  return {
    ...dto,
    isActive: dto.isActive ?? true,
  };
}

@Injectable({ providedIn: 'root' })
export class CostingMethodFacade implements PartialCrudFacade<CostingMethodConfig, CostingMethodCreate> {
  private readonly api = inject(CostingMethodsApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  async loadItems(): Promise<ListResponse<CostingMethodConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      return {
        items: res.items.map(normalize),
        total: res.total,
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<CostingMethodConfig> {
    const dto = await this.api.getById(id);
    return normalize(dto);
  }

  async createItem(data: CostingMethodCreate): Promise<CostingMethodConfig> {
    const dto = await this.api.create(data);
    return normalize(dto);
  }

  async updateItem(id: string, data: Partial<CostingMethodUpdate>): Promise<CostingMethodConfig> {
    const dto = await this.api.update(id, data);
    return normalize(dto);
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
