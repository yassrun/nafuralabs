import { Injectable, inject } from '@angular/core';

import {
  DashboardKpiApiService,
  type DashboardAllKpis,
  type DashboardKpiDateRange,
} from './dashboard-kpi-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly kpiApi = inject(DashboardKpiApiService);

  /** Default YTD window through today. */
  defaultRange(): DashboardKpiDateRange {
    const now = new Date();
    const year = now.getFullYear();
    return {
      from: `${year}-01-01`,
      to: now.toISOString().slice(0, 10),
    };
  }

  loadAllKpis(range?: DashboardKpiDateRange): Promise<DashboardAllKpis> {
    return this.kpiApi.fetchAll(range ?? this.defaultRange());
  }
}
