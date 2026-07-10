import { Injectable, inject } from '@angular/core';

import { LookupService } from '@lib/anatomy';

import { ErpLookupService } from '../../shared/services/erp-lookup.service';
import type { Location, StockBalance } from '../models';
import { itemToArticle, type ItemApiRow } from './item-article.mapper';
import { StockQueryService } from './stock-query.service';

/**
 * Loads stock balances from the API and enriches rows with article and location metadata.
 */
@Injectable({ providedIn: 'root' })
export class StockBalanceEnrichmentService {
  private readonly stockQuery = inject(StockQueryService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly lookupService = inject(LookupService);

  async loadEnrichedBalances(): Promise<StockBalance[]> {
    await this.stockQuery.loadAllBalances();
    const raw = this.stockQuery.getCachedBalances();
    const [itemRows, locationRows, categoryRows] = await Promise.all([
      this.erpLookup.items(),
      this.erpLookup.locations(),
      this.lookupService.get({
        key: 'item-categories',
        endpoint: '/api/v1/item-categories/lookup',
        displayField: 'name',
        valueField: 'id',
        params: { size: 200 },
      }),
    ]);
    const articleById = new Map(
      itemRows.map((row) => [String(row.key), itemToArticle(row.data as unknown as ItemApiRow)] as const),
    );
    const locationById = new Map<string, Location>(
      locationRows
        .map((row) => row.data as Location | undefined)
        .filter((l): l is Location => !!l)
        .map((l) => [l.id, l]),
    );
    const categoryNameById = new Map(
      categoryRows.map((c) => [String(c.key), c.value] as const),
    );

    return raw.map((row) => {
      const article = articleById.get(row.articleId);
      const location = locationById.get(row.locationId);
      const unitPrice = article?.pmp ?? article?.prixUnitaire ?? 0;
      return {
        ...row,
        articleCode: article?.code,
        articleName: article?.name,
        familleId: article?.familleId,
        familleName: article?.familleId
          ? categoryNameById.get(article.familleId) ?? article.familleId
          : undefined,
        locationName: location?.name,
        locationType: location?.type,
        unitPrice,
        totalValue: unitPrice * row.quantity,
        stockMin: article?.stockMin,
      };
    });
  }
}
