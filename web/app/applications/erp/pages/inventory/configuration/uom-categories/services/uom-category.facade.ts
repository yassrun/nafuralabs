/**
 * UoM Category Configuration Facade — backed by `/api/v1/uom-categories` (see UoMCategoriesApiService).
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import { UoMCategoriesApiService } from '../../uo-mcategories/services/uo-mcategory-api.service';
import type { UoMCategory, UoMCategoryCreate, UoMCategoryUpdate } from '../../uo-mcategories/models';
import type { UomCategoryConfig, UomCategoryCreate, UomCategoryUpdate } from '../models';

function toUomCategory(dto: UoMCategory): UomCategoryConfig {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    isActive: dto.isActive ?? true,
  };
}

function toCategoryCreate(data: UomCategoryCreate): UoMCategoryCreate {
  return {
    code: data.code,
    name: data.name,
    description: data.description,
    isActive: data.isActive,
  };
}

@Injectable({ providedIn: 'root' })
export class UomCategoryFacade implements PartialCrudFacade<UomCategoryConfig, UomCategoryCreate> {
  private readonly api = inject(UoMCategoriesApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  async loadItems(): Promise<ListResponse<UomCategoryConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      return {
        items: res.items.map(toUomCategory),
        total: res.total,
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<UomCategoryConfig> {
    const dto = await this.api.getById(id);
    return toUomCategory(dto);
  }

  async createItem(data: UomCategoryCreate): Promise<UomCategoryConfig> {
    const dto = await this.api.create(toCategoryCreate(data));
    return toUomCategory(dto);
  }

  async updateItem(id: string, data: Partial<UomCategoryUpdate>): Promise<UomCategoryConfig> {
    const dto = await this.api.update(id, data as UoMCategoryUpdate);
    return toUomCategory(dto);
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
