import { Injectable, inject } from '@angular/core';

import type { Article, ArticleType } from '../models';
import { isStockableNature } from '../models';
import { ErpLookupService } from '../../shared/services/erp-lookup.service';
import { itemToArticle, type ItemApiRow } from './item-article.mapper';

export interface ArticleCatalogQuery {
  nature?: ArticleType;
  activeOnly?: boolean;
  /** Default true — only stockable natures (mouvements). */
  stockableOnly?: boolean;
}

/**
 * Loads catalogue articles for line editors and lookups via {@link ErpLookupService}.
 */
@Injectable({ providedIn: 'root' })
export class ArticleCatalogService {
  private readonly erpLookup = inject(ErpLookupService);

  async loadArticles(query: ArticleCatalogQuery = {}): Promise<Article[]> {
    const rows = await this.erpLookup.items();
    let articles = rows.map((row) => itemToArticle(row.data as unknown as ItemApiRow));

    if (query.nature) {
      articles = articles.filter((a) => a.nature === query.nature);
    }
    if (query.activeOnly !== false) {
      articles = articles.filter((a) => a.isActive);
    }
    if (query.stockableOnly !== false) {
      articles = articles.filter((a) => isStockableNature(a.nature));
    }
    return articles;
  }
}
