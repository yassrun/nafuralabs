/**
 * Type Article Configuration Facade — backed by `/api/v1/item-types`.
 * `articleType` is derived from `code` when it matches a known {@link ArticleType} value.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import type { ArticleType } from '../../../../../inventory/models';
import { ItemTypesApiService } from '../../item-types/services/item-type-api.service';
import type { ItemType, ItemTypeCreate, ItemTypeUpdate } from '../../item-types/models';
import type { TypeArticleConfig, TypeArticleCreate, TypeArticleUpdate } from '../models';

const ARTICLE_TYPES = new Set<ArticleType>(['MATERIAU', 'CONSOMMABLE', 'ENGIN', 'OUTILLAGE']);

function articleTypeFromCode(code: string): ArticleType {
  return ARTICLE_TYPES.has(code as ArticleType) ? (code as ArticleType) : 'MATERIAU';
}

function toTypeArticle(dto: ItemType): TypeArticleConfig {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    articleType: articleTypeFromCode(dto.code),
    isActive: dto.isActive ?? true,
  };
}

function toItemTypeCreate(data: TypeArticleCreate): ItemTypeCreate {
  return {
    code: data.code,
    name: data.name,
    isActive: data.isActive,
  };
}

@Injectable({ providedIn: 'root' })
export class TypeArticleFacade implements PartialCrudFacade<TypeArticleConfig, TypeArticleCreate> {
  private readonly api = inject(ItemTypesApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  async loadItems(): Promise<ListResponse<TypeArticleConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 0, pageSize: 500 });
      return {
        items: res.items.map(toTypeArticle),
        total: res.total,
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<TypeArticleConfig> {
    const dto = await this.api.getById(id);
    return toTypeArticle(dto);
  }

  async createItem(data: TypeArticleCreate): Promise<TypeArticleConfig> {
    const dto = await this.api.create(toItemTypeCreate(data));
    return toTypeArticle(dto);
  }

  async updateItem(id: string, data: Partial<TypeArticleUpdate>): Promise<TypeArticleConfig> {
    const payload: ItemTypeUpdate = {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };
    const dto = await this.api.update(id, payload);
    return toTypeArticle(dto);
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
