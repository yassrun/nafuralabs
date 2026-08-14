/**
 * État des Stocks Facade
 *
 * Stock balances, locations and articles from HTTP; KPI alert count is derived
 * client-side from low-stock rows until a dedicated alerts API exists.
 */

import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable } from 'rxjs';

import type { ListResponse, PartialCrudFacade } from '@lib/anatomy/types';
import type { Article, Location, StockBalance } from '../../../../../inventory/models';
import { ArticleCatalogService } from '../../../../../inventory/services/article-catalog.service';
import { StockQueryService } from '../../../../../inventory/services/stock-query.service';
import { LocationsApiService } from '../../../configuration/depots/services/location-api.service';

import type {
  EtatStockFilters,
  EtatStockItem,
  EtatStockKpis,
  LocationTypeFilter,
  StockStatusFilter,
} from '../models';

const LIST_PARAMS = { page: 0, pageSize: 5000 } as const;

@Injectable({ providedIn: 'root' })
export class EtatStocksFacade implements PartialCrudFacade<EtatStockItem, EtatStockItem> {
  private readonly stockQuery = inject(StockQueryService);
  private readonly locationsApi = inject(LocationsApiService);
  private readonly articleCatalog = inject(ArticleCatalogService);

  private readonly _filters$ = new BehaviorSubject<EtatStockFilters>({
    locationType: 'ALL',
    stockStatus: 'all',
  });

  readonly filters$ = this._filters$.asObservable();

  /** When true, next `loadItems` refetches remote data (first open / toolbar refresh). */
  private remoteStale = true;

  private readonly _balances$ = new BehaviorSubject<StockBalance[]>([]);
  private readonly _locations$ = new BehaviorSubject<Location[]>([]);
  private readonly _articles$ = new BehaviorSubject<Article[]>([]);

  readonly items$: Observable<EtatStockItem[]> = combineLatest([
    this._balances$,
    this._locations$,
    this._articles$,
    this._filters$,
  ]).pipe(
    map(([balances, locations, articles, filters]) =>
      this.transformAndFilter(balances, locations, articles, filters),
    ),
  );

  readonly kpis$: Observable<EtatStockKpis> = combineLatest([
    this._balances$,
    this._locations$,
    this._articles$,
  ]).pipe(
    map(([balances, locations, articles]) => this.computeKpis(balances, locations, articles)),
  );

  readonly items = toSignal(this.items$, { initialValue: [] });
  readonly kpis = toSignal(this.kpis$, {
    initialValue: { totalStockValue: 0, articlesInStock: 0, activeLocations: 0, activeAlerts: 0 },
  });
  readonly filters = toSignal(this.filters$, {
    initialValue: { locationType: 'ALL' as LocationTypeFilter, stockStatus: 'all' as StockStatusFilter },
  });

  readonly isLoading = signal(false);

  async loadItems(_query?: Record<string, unknown>): Promise<ListResponse<EtatStockItem>> {
    if (this.remoteStale) {
      await this.fetchAllData();
      this.remoteStale = false;
    }
    const items = await firstValueFrom(this.items$);
    return { items, total: items.length };
  }

  updateFilters(partial: Partial<EtatStockFilters>): void {
    this._filters$.next({ ...this._filters$.value, ...partial });
  }

  setLocationType(type: LocationTypeFilter): void {
    this.updateFilters({ locationType: type });
  }

  setLocationId(locationId: string | undefined): void {
    this.updateFilters({ locationId });
  }

  setFamilleId(familleId: string | undefined): void {
    this.updateFilters({ familleId });
  }

  setStockStatus(status: StockStatusFilter): void {
    this.updateFilters({ stockStatus: status });
  }

  setSearch(search: string | undefined): void {
    this.updateFilters({ search });
  }

  /** Next `loadItems` refetches from APIs (used by listing refresh). */
  refresh(): void {
    this.remoteStale = true;
  }

  private async fetchAllData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [locRes, articles] = await Promise.all([
        this.locationsApi.getAll(LIST_PARAMS),
        this.articleCatalog.loadArticles({ activeOnly: true }),
      ]);
      await this.stockQuery.loadAllBalances();
      this._balances$.next(this.stockQuery.getCachedBalances());
      this._locations$.next(locRes.items);
      this._articles$.next(articles);
    } finally {
      this.isLoading.set(false);
    }
  }

  private transformAndFilter(
    balances: StockBalance[],
    locations: Location[],
    articles: Article[],
    filters: EtatStockFilters,
  ): EtatStockItem[] {
    const locationMap = new Map(locations.map((l) => [l.id, l]));
    const articleMap = new Map(articles.map((a) => [a.id, a]));

    let items: EtatStockItem[] = balances.map((b) => {
      const loc = locationMap.get(b.locationId);
      const art = articleMap.get(b.articleId);
      const unitPrice = b.unitPrice ?? art?.prixUnitaire ?? art?.pmp ?? 0;
      const stockValue = b.quantity * unitPrice;

      return {
        id: b.id,
        articleId: b.articleId,
        articleCode: b.articleCode ?? art?.code ?? '',
        articleName: b.articleName ?? art?.name ?? '',
        familleId: art?.familleId,
        familleName: art?.familleName,
        locationId: b.locationId,
        locationCode: loc?.code ?? '',
        locationName: b.locationName ?? loc?.name ?? '',
        locationType: b.locationType ?? loc?.type ?? 'DEPOT',
        quantityAvailable: b.availableQuantity,
        quantityReserved: b.reservedQuantity,
        quantityTotal: b.quantity,
        unit: art?.uomCode ?? '',
        unitPrice,
        stockValue,
        stockMin: art?.stockMin,
        lastMovementDate: b.lastCountDate,
      };
    });

    if (filters.locationType !== 'ALL') {
      items = items.filter((i) => {
        if (filters.locationType === 'DEPOT') {
          return (
            i.locationType === 'DEPOT' ||
            i.locationType === 'ENTREPOT' ||
            i.locationType === 'TRANSIT' ||
            i.locationType === 'VIRTUEL'
          );
        }
        return i.locationType === filters.locationType;
      });
    }

    if (filters.locationId) {
      items = items.filter((i) => i.locationId === filters.locationId);
    }

    if (filters.familleId) {
      items = items.filter((i) => i.familleId === filters.familleId);
    }

    if (filters.stockStatus === 'alert') {
      items = items.filter((i) => i.stockMin != null && i.quantityAvailable <= i.stockMin);
    } else if (filters.stockStatus === 'exhausted') {
      items = items.filter((i) => i.quantityAvailable === 0);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.articleCode.toLowerCase().includes(term) ||
          i.articleName.toLowerCase().includes(term) ||
          i.locationName.toLowerCase().includes(term),
      );
    }

    return items;
  }

  private computeKpis(balances: StockBalance[], _locations: Location[], articles: Article[]): EtatStockKpis {
    const articleMap = new Map(articles.map((a) => [a.id, a]));

    const totalStockValue = balances.reduce((sum, b) => {
      const art = articleMap.get(b.articleId);
      const price = b.unitPrice ?? art?.prixUnitaire ?? art?.pmp ?? 0;
      return sum + b.quantity * price;
    }, 0);

    const articleIds = new Set(balances.map((b) => b.articleId));
    const articlesInStock = articleIds.size;

    const activeLocations = new Set(balances.map((b) => b.locationId)).size;

    let activeAlerts = 0;
    for (const b of balances) {
      const art = articleMap.get(b.articleId);
      const avail = b.availableQuantity ?? 0;
      if (art?.stockMin != null && avail <= art.stockMin) {
        activeAlerts++;
      }
    }

    return { totalStockValue, articlesInStock, activeLocations, activeAlerts };
  }

  getLocationsForFilter(): Observable<Location[]> {
    return this._locations$.asObservable();
  }

  getArticleFamilies(): Observable<{ id: string; name: string }[]> {
    return this._articles$.pipe(
      map((articleList) => {
        const families = new Map<string, string>();
        articleList.forEach((a) => {
          if (a.familleId && a.familleName) {
            families.set(a.familleId, a.familleName);
          }
        });
        return Array.from(families, ([id, name]) => ({ id, name }));
      }),
    );
  }
}
