import { Injectable } from '@angular/core';

export type PlaceListScope = 'all' | 'pending' | 'approved';

export interface CatalogSearchFilters {
  q: string;
  cityCode: string;
  category: string;
  districtCode: string;
  venueTypes: string[];
  activities: string[];
  aiDecision: string;
  enrichmentStatus: string;
  minScore: string;
}

export interface CatalogSearchSnapshot {
  scope: PlaceListScope;
  pageIndex: number;
  pageSize: number;
  sort: string;
  filters: CatalogSearchFilters;
}

@Injectable({ providedIn: 'root' })
export class CatalogSearchStateService {
  private snapshot: CatalogSearchSnapshot | null = null;

  save(snapshot: CatalogSearchSnapshot): void {
    this.snapshot = {
      ...snapshot,
      filters: {
        ...snapshot.filters,
        venueTypes: [...snapshot.filters.venueTypes],
        activities: [...snapshot.filters.activities],
      },
    };
  }

  restore(): CatalogSearchSnapshot | null {
    if (!this.snapshot) {
      return null;
    }
    return {
      ...this.snapshot,
      filters: {
        ...this.snapshot.filters,
        venueTypes: [...this.snapshot.filters.venueTypes],
        activities: [...this.snapshot.filters.activities],
      },
    };
  }
}
