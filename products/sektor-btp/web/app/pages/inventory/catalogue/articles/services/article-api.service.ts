import { Injectable, inject } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import {
  articleCreateToItem,
  articleUpdateToItem,
  itemToArticle,
  type ItemApiRow,
} from '@app/inventory/services/item-article.mapper';
import { NATURE_POSTE_BUDGET, type Nature } from '@app/inventory/models';
import { ItemsApiService } from '../../items/services/item-api.service';

import type { Article, ArticleCreate, ArticleQuery, ArticleUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ArticlesApiService extends FeatureApiService<Article, ArticleCreate, ArticleUpdate> {
  /** Alias path kept for routing; data comes from `/api/v1/items`. */
  protected override basePath = '/api/v1/items';
  protected override searchFields = ['code', 'name', 'sku'];

  private readonly itemsApi = inject(ItemsApiService);

  override async getAll(query?: ListQuery): Promise<ListResponse<Article>> {
    const q = (query ?? {}) as ArticleQuery;
    const res = await this.itemsApi.getAll({
      page: q.page ?? 0,
      pageSize: q.pageSize ?? 20,
      search: q.search,
      searchFields: this.searchFields.join(','),
    });

    let items = (res.items as ItemApiRow[]).map((row) => ({
      ...itemToArticle(row),
      devise: 'MAD',
    }));

    if (q.familleId) {
      items = items.filter((a) => a.familleId === q.familleId);
    }
    if (q.usageLot) {
      items = items.filter((a) => (a.lotsUsage ?? []).includes(q.usageLot!));
    }
    if (q.nature) {
      items = items.filter((a) => a.nature === q.nature);
    }
    if (q.isActive !== undefined) {
      items = items.filter((a) => a.isActive === q.isActive);
    }

    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Article> {
    const item = (await this.itemsApi.getById(id)) as ItemApiRow;
    return { ...itemToArticle(item), devise: 'MAD' };
  }

  override async create(data: ArticleCreate): Promise<Article> {
    const payload = { ...data };
    if (!payload.posteBudgetId && payload.nature) {
      payload.posteBudgetId = NATURE_POSTE_BUDGET[payload.nature as Nature];
    }
    const item = (await this.itemsApi.create(articleCreateToItem(payload))) as ItemApiRow;
    return { ...itemToArticle(item), devise: data.devise ?? 'MAD' };
  }

  override async update(id: string | number, data: ArticleUpdate): Promise<Article> {
    const item = (await this.itemsApi.update(id, articleUpdateToItem(data))) as ItemApiRow;
    return { ...itemToArticle(item), devise: data.devise ?? 'MAD' };
  }

  override async delete(id: string | number): Promise<void> {
    return this.itemsApi.delete(id);
  }
}
