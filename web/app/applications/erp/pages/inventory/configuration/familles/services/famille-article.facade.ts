/**
 * Famille Article Configuration Facade — backed by `/api/v1/item-categories`.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import { ItemCategoriesApiService } from '../../item-categories/services/item-category-api.service';
import type { ItemCategory, ItemCategoryCreate, ItemCategoryUpdate } from '../../item-categories/models';
import type { FamilleArticleConfig, FamilleArticleCreate, FamilleArticleUpdate } from '../models';

function toFamille(dto: ItemCategory): FamilleArticleConfig {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    isActive: dto.isActive ?? true,
  };
}

function toCategoryCreate(data: FamilleArticleCreate): ItemCategoryCreate {
  return {
    code: data.code,
    name: data.name,
    description: data.description,
    isActive: data.isActive,
  };
}

function toCategoryUpdate(data: Partial<FamilleArticleUpdate>): ItemCategoryUpdate {
  return data as ItemCategoryUpdate;
}

@Injectable({ providedIn: 'root' })
export class FamilleArticleFacade implements PartialCrudFacade<FamilleArticleConfig, FamilleArticleCreate> {
  private readonly api = inject(ItemCategoriesApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  async loadItems(): Promise<ListResponse<FamilleArticleConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      return {
        items: res.items.map(toFamille),
        total: res.total,
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<FamilleArticleConfig> {
    const dto = await this.api.getById(id);
    return toFamille(dto);
  }

  async createItem(data: FamilleArticleCreate): Promise<FamilleArticleConfig> {
    const dto = await this.api.create(toCategoryCreate(data));
    return toFamille(dto);
  }

  async updateItem(id: string, data: Partial<FamilleArticleUpdate>): Promise<FamilleArticleConfig> {
    const dto = await this.api.update(id, toCategoryUpdate(data));
    return toFamille(dto);
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
