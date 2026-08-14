import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_ENV } from './env.token';

export interface PlaceSummary {
  id: string;
  canonicalName: string;
  status: string;
  cityCode: string;
  primaryCategory: string;
  address: Record<string, unknown>;
  quality: Record<string, unknown>;
  districtCode?: string | null;
  districtLabel?: string | null;
  venueTypes?: string[] | null;
  /** Primary type (first of venueTypes). */
  venueType?: string | null;
  aiDecision?: string | null;
  layaliScore?: number | null;
  enrichmentStatus?: string | null;
  primaryPhotoUrl?: string | null;
  primaryPhotoAttribution?: string | null;
  updatedAt: string;
}

export interface MediaDto {
  id: string;
  source: string;
  url: string;
  width?: number;
  height?: number;
  attributionText: string;
  authorName?: string;
  reusable: boolean;
  expiresAt: string;
  sortOrder?: number;
}

export interface PlaceDetail extends PlaceSummary {
  countryCode: string;
  providerTypes: string[];
  geo: Record<string, unknown>;
  contact: Record<string, unknown>;
  openingHours: Record<string, unknown>[];
  providerRating: Record<string, unknown>;
  attributes: Record<string, unknown>;
  media: MediaDto[];
  sourceRecords: Record<string, unknown>[];
  enrichment?: Record<string, unknown> | null;
  createdAt: string;
}

export interface JobDetail {
  id: string;
  type: string;
  provider: string;
  status: string;
  request: Record<string, unknown>;
  result: Record<string, unknown> | null;
  progress: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  steps?: Record<string, unknown>[];
  requestedBy: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface GeoDistrictsResponse {
  cityCode: string;
  version: Record<string, unknown>;
  districts: Array<{ code: string; label: string; aliases: string[]; provenance: string }>;
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENV);

  private url(path: string): string {
    const base = this.env.apiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  listPlaces(filters: {
    q?: string;
    cityCode?: string;
    primaryCategory?: string;
    status?: string;
    needsReview?: boolean;
    districtCode?: string;
    venueTypes?: string[];
    activities?: string[];
    aiDecision?: string;
    minScore?: number;
    scoreAppId?: string;
    enrichmentStatus?: string;
    sort?: string;
    page?: number;
    size?: number;
  }): Observable<{ items: PlaceSummary[]; page: { size: number; total: number | null; cursor: string | null } }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (Array.isArray(value)) {
        if (!value.length) {
          return;
        }
        for (const item of value) {
          if (item !== undefined && item !== null && item !== '') {
            params = params.append(key, String(item));
          }
        }
        return;
      }
      params = params.set(key, String(value));
    });
    return this.http.get<{
      items: PlaceSummary[];
      page: { size: number; total: number | null; cursor: string | null };
    }>(this.url('/api/v1/catalog/places'), { params });
  }

  getPlace(id: string): Observable<PlaceDetail> {
    return this.http.get<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}`));
  }

  getTaxonomyMeta(): Observable<{
    categories: string[];
    venueTypes: string[];
    venueTypesByCategory: Record<string, string[]>;
    settings: string[];
    offers: string[];
    experiences: string[];
    suitableFor: string[];
    activities: string[];
  }> {
    return this.http.get<{
      categories: string[];
      venueTypes: string[];
      venueTypesByCategory: Record<string, string[]>;
      settings: string[];
      offers: string[];
      experiences: string[];
      suitableFor: string[];
      activities: string[];
    }>(this.url('/api/v1/catalog/places/meta/taxonomy'));
  }

  patchEnrichment(
    id: string,
    body: {
      venueTypes?: string[] | null;
      /** @deprecated prefer venueTypes */
      venueType?: string | null;
      settings?: string[] | null;
      offers?: string[] | null;
      experiences?: string[] | null;
      suitableFor?: string[] | null;
      musicStyles?: string[] | null;
      cuisines?: string[] | null;
      servesAlcohol?: boolean | null;
      verdict?: string | null;
    }
  ): Observable<PlaceDetail> {
    return this.http.patch<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}/enrichment`), body);
  }

  patchDistrict(id: string, districtCode: string): Observable<PlaceDetail> {
    return this.http.patch<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}/district`), {
      districtCode,
    });
  }

  setPrimaryMedia(placeId: string, mediaId: string): Observable<PlaceDetail> {
    return this.http.post<PlaceDetail>(
      this.url(`/api/v1/catalog/places/${placeId}/media/${mediaId}/primary`),
      {}
    );
  }

  approve(id: string): Observable<PlaceDetail> {
    return this.http.post<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}/approve`), {});
  }

  reject(id: string): Observable<PlaceDetail> {
    return this.http.post<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}/reject`), {});
  }

  archive(id: string): Observable<PlaceDetail> {
    return this.http.post<PlaceDetail>(this.url(`/api/v1/catalog/places/${id}/archive`), {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/v1/catalog/places/${id}`));
  }

  bulkApprove(placeIds: string[]): Observable<{ placeIds: string[]; status: string }> {
    return this.http.post<{ placeIds: string[]; status: string }>(
      this.url('/api/v1/catalog/places/bulk-approve'),
      { placeIds }
    );
  }

  normalizeNames(body: {
    dryRun?: boolean;
    cityCode?: string;
    primaryCategory?: string;
  }): Observable<{
    scanned: number;
    updated: number;
    skippedNoDistrict: number;
    unchanged: number;
    dryRun: boolean;
    samples: Array<{ id: string; before: string; after: string }>;
  }> {
    return this.http.post<{
      scanned: number;
      updated: number;
      skippedNoDistrict: number;
      unchanged: number;
      dryRun: boolean;
      samples: Array<{ id: string; before: string; after: string }>;
    }>(this.url('/api/v1/catalog/places/maintenance/normalize-names'), body);
  }

  listJobs(page = 0, size = 20): Observable<{ items: JobDetail[] }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<{ items: JobDetail[] }>(this.url('/api/v1/catalog/jobs'), { params });
  }

  getJob(id: string): Observable<JobDetail> {
    return this.http.get<JobDetail>(this.url(`/api/v1/catalog/jobs/${id}`));
  }

  startSearch(body: unknown, idempotencyKey: string): Observable<{ jobId: string; status: string }> {
    return this.http.post<{ jobId: string; status: string }>(
      this.url('/api/v1/catalog/jobs/google-places-search'),
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  startEnrichment(body: unknown, idempotencyKey: string): Observable<{ jobId: string; status: string }> {
    return this.http.post<{ jobId: string; status: string }>(
      this.url('/api/v1/catalog/jobs/venue-enrichment'),
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  retryJob(jobId: string, resumeFromStep?: string): Observable<{ jobId: string; status: string }> {
    return this.http.post<{ jobId: string; status: string }>(
      this.url(`/api/v1/catalog/jobs/${jobId}/retry`),
      { resumeFromStep: resumeFromStep ?? null }
    );
  }

  listGeoDistricts(cityCode = 'casablanca'): Observable<GeoDistrictsResponse> {
    const params = new HttpParams().set('cityCode', cityCode);
    return this.http.get<GeoDistrictsResponse>(this.url('/api/v1/catalog/geo/districts'), { params });
  }
}
