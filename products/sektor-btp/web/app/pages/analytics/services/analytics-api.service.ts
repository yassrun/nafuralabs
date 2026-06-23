import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

export interface AnalyticsBucketRow {
  keys: string[];
  metrics: Record<string, number>;
}

export interface AnalyticsBucketResponse {
  dimensions: string[];
  rows: AnalyticsBucketRow[];
}

export type AnalyticsDomain = 'achats' | 'chantiers' | 'ventes' | 'finance' | 'rh' | 'hse';

export interface AnalyticsQuery {
  dimensions?: string;
  from?: string;
  to?: string;
  metrics?: string;
  [key: string]: unknown;
}

const DEFAULT_FROM = '2026-01-01';
const DEFAULT_TO = '2026-12-31';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService extends FeatureApiService<unknown, unknown, unknown> {
  protected override basePath = '/api/v1/achats/analytics';

  async getBuckets(domain: AnalyticsDomain, query?: AnalyticsQuery): Promise<AnalyticsBucketResponse> {
    const path = `/api/v1/${domain}/analytics`;
    const params = this.buildQueryParams({
      dimensions: query?.dimensions ?? 'societe,bu',
      from: query?.from ?? DEFAULT_FROM,
      to: query?.to ?? DEFAULT_TO,
      metrics: query?.metrics,
    });
    return this.get<AnalyticsBucketResponse>(path, params);
  }

  /** Sum a metric across all bucket rows. */
  sumMetric(rows: AnalyticsBucketRow[], metric: string): number {
    return rows.reduce((s, r) => s + (Number(r.metrics?.[metric]) || 0), 0);
  }
}
