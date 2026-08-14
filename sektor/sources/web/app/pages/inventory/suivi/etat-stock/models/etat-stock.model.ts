/**
 * État des Stocks Models
 */

import type { LocationType } from '../../../../../inventory/models';

export interface EtatStockItem {
  id: string;
  articleId: string;
  articleCode: string;
  articleName: string;
  familleId?: string;
  familleName?: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  locationType: LocationType;
  quantityAvailable: number;
  quantityReserved: number;
  quantityTotal: number;
  unit: string;
  unitPrice: number;
  stockValue: number;
  stockMin?: number;
  lastMovementDate?: string;
}

export interface EtatStockGroupedByArticle {
  articleId: string;
  articleCode: string;
  articleName: string;
  familleName?: string;
  unit: string;
  totalQuantityAvailable: number;
  totalQuantityReserved: number;
  totalQuantity: number;
  totalValue: number;
  locationCount: number;
}

export interface EtatStockKpis {
  totalStockValue: number;
  articlesInStock: number;
  activeLocations: number;
  activeAlerts: number;
}

export type LocationTypeFilter = 'ALL' | 'DEPOT' | 'CHANTIER';
export type StockStatusFilter = 'all' | 'alert' | 'exhausted';

export interface EtatStockFilters {
  locationType: LocationTypeFilter;
  locationId?: string;
  familleId?: string;
  stockStatus: StockStatusFilter;
  search?: string;
}
