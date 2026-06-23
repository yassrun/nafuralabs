import type { LocationType } from '@applications/erp/inventory/models';

export interface FamilleValorisation {
  familleId: string;
  familleName: string;
  articleCount: number;
  totalQuantity: number;
  totalValue: number;
  percentOfTotal: number;
}

export interface LocationValorisation {
  locationId: string;
  locationName: string;
  locationType: LocationType;
  totalValue: number;
  percentOfTotal: number;
}

export interface ValorisationKpis {
  totalStockValue: number;
  depotValue: number;
  chantierValue: number;
  monthlyVariationPercent: number;
}

export interface ValorisationSnapshot {
  asOfDate: string;
  costingMethod: string;
  kpis: ValorisationKpis;
  byFamille: FamilleValorisation[];
  byLocation: LocationValorisation[];
}
