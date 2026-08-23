import { Injectable, inject, signal, computed } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { ListQuery, ListResponse, LookupContext } from '@platform/lib/anatomy/types';
import { StockQueryService } from '../../services/stock-query.service';
import { NatureApiService } from '../../services/nature-api.service';
import { ArticlesApiService } from './article-api.service';
import type { Article, ArticleCreate, ArticleUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ArticlesFacade extends GridFacade<Article, ArticleCreate, ArticleUpdate> {
  protected override api = inject(ArticlesApiService);
  private readonly naturesApi = inject(NatureApiService);
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
    const natures = await this.naturesApi.list();
    this.lookupsSignal.set({
      familleArticle: [],
      unitOfMeasure: [],
      articleNatures: natures.map((n) => ({
        key: n.code,
        value: n.libelle,
        data: {
          posteBudgetDefaut: n.posteBudgetDefaut,
          stockable: n.stockable,
          typeDpu: n.typeDpu,
        },
      })),
    });
  }
}
