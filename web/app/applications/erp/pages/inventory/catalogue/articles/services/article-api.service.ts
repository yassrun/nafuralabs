import { Injectable, inject } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import {
  articleCreateToItem,
  articleUpdateToItem,
  itemToArticle,
  type ItemApiRow,
} from '@applications/erp/inventory/services/item-article.mapper';
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
    if (q.articleType) {
      items = items.filter((a) => a.articleType === q.articleType);
    }
    if (q.isActive !== undefined) {
      items = items.filter((a) => a.isActive === q.isActive);
    }

    items = items.filter(
      (a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE'
    );

    return { items, total: res.total };
  }

  override async getById(id: string | number): Promise<Article> {
    const item = (await this.itemsApi.getById(id)) as ItemApiRow;
    return { ...itemToArticle(item), devise: 'MAD' };
  }

  override async create(data: ArticleCreate): Promise<Article> {
    const item = (await this.itemsApi.create(articleCreateToItem(data))) as ItemApiRow;
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
