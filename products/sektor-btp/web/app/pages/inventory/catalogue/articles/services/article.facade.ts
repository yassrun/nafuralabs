import { Injectable, inject, signal, computed } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { ListQuery, ListResponse, LookupContext } from '@lib/anatomy/types';
import { ItemCategoriesApiService } from '../../../configuration/item-categories/services/item-category-api.service';
import { UnitOfMeasuresApiService } from '../../../configuration/unit-of-measures/services/unit-of-measure-api.service';
import type { ItemCategory } from '../../../configuration/item-categories/models';
import type { UnitOfMeasure } from '../../../configuration/unit-of-measures/models';
import { StockQueryService } from '../../../../../inventory/services/stock-query.service';
import { ArticlesApiService } from './article-api.service';
import type { Article, ArticleCreate, ArticleUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ArticlesFacade extends GridFacade<Article, ArticleCreate, ArticleUpdate> {
  protected override api = inject(ArticlesApiService);
  private readonly categoriesApi = inject(ItemCategoriesApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly stockQuery = inject(StockQueryService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async loadItems(query?: ListQuery): Promise<ListResponse<Article>> {
    const res = await super.loadItems(query);
    const ids = res.items.map((a) => a.id);
    const stockMap = await this.stockQuery.aggregateByItems(ids);
    return {
      ...res,
      items: res.items.map((a) => ({ ...a, stockTotal: stockMap.get(a.id) ?? 0 })),
    };
  }

  override async ensureLookups(): Promise<void> {
    const [categories, uoms] = await Promise.all([
      this.categoriesApi.getAll({ page: 0, pageSize: 200 }),
      this.uomApi.getAll({ page: 0, pageSize: 200 }),
    ]);
    this.lookupsSignal.set({
      familleArticle: (categories.items as ItemCategory[]).map((c) => ({
        key: c.id,
        value: c.name ?? c.code ?? c.id,
      })),
      unitOfMeasure: (uoms.items as UnitOfMeasure[])
        .filter((u) => u.isActive !== false)
        .map((u) => ({ key: u.id, value: `${u.code ?? ''} — ${u.name}`.trim() })),
    });
  }
}
