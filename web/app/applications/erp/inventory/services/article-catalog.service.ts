import { Injectable, inject } from '@angular/core';

import type { Article, ArticleType } from '../models';
import { ErpLookupService } from '../../shared/services/erp-lookup.service';
import { itemToArticle, type ItemApiRow } from './item-article.mapper';

export interface ArticleCatalogQuery {
  articleType?: ArticleType;
  activeOnly?: boolean;
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

    if (query.articleType) {
      articles = articles.filter((a) => a.articleType === query.articleType);
    }
    if (query.activeOnly !== false) {
      articles = articles.filter((a) => a.isActive);
    }
    return articles.filter((a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE');
  }
}
