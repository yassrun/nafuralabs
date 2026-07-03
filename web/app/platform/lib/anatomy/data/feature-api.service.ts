/**
 * Feature API Service
 *
 * Abstract base for HTTP CRUD services.
 * Provides standard REST operations for a resource.
 */

import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListQuery, ListResponse } from '../types';
import type { ImportResult } from '../types';
import { ApiConfigService } from '../../../core/config/api-config.service';

/**
 * Create DTO type - defaults to Partial<TItem>
 */
export type CreateDto<TItem> = Partial<TItem>;

/**
 * Update DTO type - defaults to Partial<TItem>
 */
export type UpdateDto<TItem> = Partial<TItem>;

/**
 * Feature API Service
 *
 * Base class for HTTP CRUD services.
 * Extend and set `basePath` to get all CRUD operations.
 *
 * @typeParam TItem - The entity type
 * @typeParam TCreate - The create DTO type
 * @typeParam TUpdate - The update DTO type
 */
export abstract class FeatureApiService<
  TItem,
  TCreate = CreateDto<TItem>,
  TUpdate = UpdateDto<TItem>
> {
  protected readonly http = inject(HttpClient);
  protected readonly apiConfig = inject(ApiConfigService);

  /**
   * Base path for the resource (e.g., '/api/locations').
   */
  protected abstract basePath: string;

  /**
   * Optional explicit search fields used when query contains `search`.
   * Set by generated API services from entity listing.searchFields.
   */
  protected searchFields: string[] = [];

  /**
   * Query params merged into every list request (e.g. `{ role: 'CLIENT' }`).
   */
  protected defaultQuery: Record<string, string | number | boolean> = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // READ Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async getAll(query?: ListQuery): Promise<ListResponse<TItem>> {
    const params = this.buildQueryParams(query);
    const response = await this.get<unknown>(this.basePath, params);
    return this.normalizeListResponse(response);
  }

  async getById(id: string | number): Promise<TItem> {
    return this.get<TItem>(`${this.basePath}/${id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async create(data: TCreate): Promise<TItem> {
    return this.post<TItem>(this.basePath, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async update(id: string | number, data: TUpdate): Promise<TItem> {
    return this.put<TItem>(`${this.basePath}/${id}`, data);
  }

  async patch(id: string | number, data: Partial<TUpdate>): Promise<TItem> {
    return this.patchRequest<TItem>(`${this.basePath}/${id}`, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE Operations
  // ═══════════════════════════════════════════════════════════════════════════

  async delete(id: string | number): Promise<void> {
    return this.deleteRequest(`${this.basePath}/${id}`);
  }

  async deleteMany(ids: (string | number)[]): Promise<void> {
    await Promise.all(ids.map((id) => this.delete(id)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Status Transitions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute a status transition via a dedicated backend endpoint.
   * Never use the PATCH/PUT route for status changes.
   *
   * POST {basePath}/{id}/{endpoint}
   *
   * @example
   * await this.api.executeTransition(id, 'validate');
   * await this.api.executeTransition(id, 'cancel', { note: 'Erreur de commande' });
   */
  async executeTransition<TResult = TItem>(
    id: string | number,
    endpoint: string,
    payload?: Record<string, unknown>,
  ): Promise<TResult> {
    return this.post<TResult>(`${this.basePath}/${id}/${endpoint}`, payload ?? {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Import / Export
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Import entities from a CSV file (multipart/form-data).
   * Backend parses, validates, and returns ImportResult.
   */
  async importCsv(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<ImportResult>(this.resolveUrl(`${this.basePath}/import`), formData)
    );
  }

  /**
   * Export filtered list as CSV (same query params as listing, up to 10,000 rows).
   * Returns blob for download.
   */
  async exportCsv(query?: ListQuery): Promise<Blob> {
    const params = this.buildQueryParams(query);
    return firstValueFrom(
      this.http.get(this.resolveUrl(`${this.basePath}/export`), {
        params,
        responseType: 'blob',
      })
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Protected HTTP Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  protected async get<T>(url: string, params?: HttpParams): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.resolveUrl(url), { params }));
  }

  protected async post<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.resolveUrl(url), body));
  }

  protected async put<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(this.resolveUrl(url), body));
  }

  protected async patchRequest<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.resolveUrl(url), body));
  }

  protected async deleteRequest(url: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.resolveUrl(url)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Query Building
  // ═══════════════════════════════════════════════════════════════════════════

  protected buildQueryParams(query?: ListQuery): HttpParams {
    let params = new HttpParams();
    const merged = { ...this.defaultQuery, ...(query ?? {}) } as ListQuery;
    if (!query && Object.keys(this.defaultQuery).length === 0) return params;
    query = merged;

    if (query.page !== undefined) {
      const page = Number(query.page);
      const zeroBasedPage = Number.isFinite(page) ? Math.max(page - 1, 0) : 0;
      params = params.set('page', zeroBasedPage.toString());
    }
    if (query.pageSize !== undefined) {
      params = params
        .set('size', query.pageSize.toString())
        .set('pageSize', query.pageSize.toString()); // backward compatibility
    }
    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy); // backward compatibility
      params = params.set(
        'sort',
        `${query.sortBy},${query.sortDirection === 'desc' ? 'desc' : 'asc'}`
      );
    }
    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection);
    }
    for (const [key, value] of Object.entries(query)) {
      if (
        value === undefined ||
        value === null ||
        key === 'page' ||
        key === 'pageSize' ||
        key === 'sortBy' ||
        key === 'sortDirection'
      ) {
        continue;
      }
      params = params.set(key, String(value));
    }

    const searchValue = query['search'];
    if (
      this.searchFields.length > 0 &&
      searchValue !== undefined &&
      searchValue !== null &&
      String(searchValue).trim().length > 0
    ) {
      params = params.set('searchFields', this.searchFields.join(','));
    }

    return params;
  }

  protected resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  protected normalizeListResponse(payload: unknown): ListResponse<TItem> {
    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;

      if (Array.isArray(data['items'])) {
        return {
          items: data['items'] as TItem[],
          total: Number(data['total'] ?? data['totalItems'] ?? (data['items'] as unknown[]).length),
        };
      }

      // Spring Data Page default shape
      if (Array.isArray(data['content'])) {
        return {
          items: data['content'] as TItem[],
          total: Number(data['totalElements'] ?? data['total'] ?? (data['content'] as unknown[]).length),
        };
      }
    }

    if (Array.isArray(payload)) {
      return { items: payload as TItem[], total: payload.length };
    }

    return { items: [], total: 0 };
  }
}
