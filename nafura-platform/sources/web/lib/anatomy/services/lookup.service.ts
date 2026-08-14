/**
 * Lookup Service
 *
 * Provides loading and caching of reference/lookup data.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { LookupItem, LookupContext } from '../types';
import { ApiConfigService } from '../../../core/config/api-config.service';
import { TenantContextService } from '../../../core/tenant/tenant.context';

/**
 * Lookup request configuration.
 */
export interface LookupRequest {
  key: string;
  endpoint: string;
  transform?: (response: unknown) => LookupItem[];
  forceRefresh?: boolean;
  params?: Record<string, string | number | boolean>;
  displayField?: string;
  valueField?: string;
}

/**
 * Default transform for API responses.
 */
function defaultTransform(
  response: unknown,
  displayField = 'name',
  valueField = 'id'
): LookupItem[] {
  const items = extractItems(response);
  if (!items.length) {
    if (!isEmptyLookupResponse(response)) {
      console.warn('LookupService: Expected array-like response');
    }
    return [];
  }

  return items.map((item) => {
    const key = item[valueField] ?? item['key'] ?? item['id'] ?? item['code'] ?? '';
    const value = item[displayField] ?? item['value'] ?? item['name'] ?? item['label'] ?? String(key);

    return {
      key: key as string | number | boolean,
      value: String(value),
      data: item,
    };
  });
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly tenantContext = inject(TenantContextService);
  private cache = new Map<string, LookupItem[]>();
  private cacheSignature = new Map<string, string>();
  private pending = new Map<string, Promise<LookupItem[]>>();

  /**
   * Get a single lookup by key.
   */
  async get(request: LookupRequest): Promise<LookupItem[]> {
    const { key, endpoint, transform, forceRefresh, params, displayField, valueField } = request;
    const requestEndpoint = withQueryParams(endpoint, params);
    const signature = this.buildSignature(requestEndpoint, displayField, valueField);
    const pendingKey = `${key}::${signature}`;

    if (
      !forceRefresh &&
      this.cache.has(key) &&
      this.cacheSignature.get(key) === signature
    ) {
      return this.cache.get(key)!;
    }

    if (this.pending.has(pendingKey)) {
      return this.pending.get(pendingKey)!;
    }

    const defaultMap = (response: unknown) => defaultTransform(response, displayField, valueField);
    const promise = this.fetchLookup(requestEndpoint, transform ?? defaultMap);
    this.pending.set(pendingKey, promise);

    try {
      const items = await promise;
      this.cache.set(key, items);
      this.cacheSignature.set(key, signature);
      return items;
    } finally {
      this.pending.delete(pendingKey);
    }
  }

  /**
   * Get multiple lookups at once.
   */
  async getMultiple(requests: LookupRequest[]): Promise<LookupContext> {
    const results = await Promise.all(
      requests.map(async (req) => ({
        key: req.key,
        items: await this.get(req),
      }))
    );

    const context: LookupContext = {};
    for (const result of results) {
      context[result.key] = result.items;
    }
    return context;
  }

  /**
   * Check if a lookup is cached.
   */
  isCached(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cached lookup.
   */
  getCached(key: string): LookupItem[] | undefined {
    return this.cache.get(key);
  }

  /**
   * Set lookup items directly.
   */
  setCache(key: string, items: LookupItem[]): void {
    this.cache.set(key, items);
  }

  /**
   * Clear cache for a specific key.
   */
  clearCache(key: string): void {
    this.cache.delete(key);
    this.cacheSignature.delete(key);
  }

  /**
   * Clear all cached lookups.
   */
  clearAllCache(): void {
    this.cache.clear();
    this.cacheSignature.clear();
  }

  /**
   * Refresh a cached lookup.
   */
  async refresh(request: LookupRequest): Promise<LookupItem[]> {
    return this.get({ ...request, forceRefresh: true });
  }

  /**
   * Find display value for a key.
   */
  getDisplayValue(lookupKey: string, itemKey: string | number | boolean): string {
    const items = this.cache.get(lookupKey);
    if (!items) return String(itemKey);

    const item = items.find((i) => i.key === itemKey);
    return item?.value ?? String(itemKey);
  }

  /**
   * Create a static lookup from an object.
   */
  createStatic(key: string, values: Record<string, string>): void {
    const items: LookupItem[] = Object.entries(values).map(([k, v]) => ({
      key: k,
      value: v,
    }));
    this.cache.set(key, items);
  }

  private async fetchLookup(
    endpoint: string,
    transform: (response: unknown) => LookupItem[]
  ): Promise<LookupItem[]> {
    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.resolveUrl(endpoint)));
      return transform(response);
    } catch (error) {
      console.error(`LookupService: Failed to fetch ${endpoint}`, error);
      return [];
    }
  }

  private resolveUrl(url: string): string {
    const resolved = this.resolvePlaceholders(url);
    if (/^https?:\/\//i.test(resolved)) return resolved;
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const path = resolved.startsWith('/') ? resolved : `/${resolved}`;
    return `${base}${path}`;
  }

  private resolvePlaceholders(url: string): string {
    if (!url.includes('{tenantId}')) return url;
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) return url;
    return url.replaceAll('{tenantId}', encodeURIComponent(tenantId));
  }

  private buildSignature(
    endpoint: string,
    displayField?: string,
    valueField?: string
  ): string {
    const absolute = this.resolveUrl(endpoint);
    return `${absolute}|${displayField ?? ''}|${valueField ?? ''}`;
  }
}

function extractItems(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) {
    const records = response.filter(isRecord);
    if (records.length > 0) return records;
    return response.map((value) => ({ key: value, value: String(value) }));
  }

  if (!isRecord(response)) {
    return [];
  }

  const directCandidates = ['items', 'content', 'results'];
  for (const key of directCandidates) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  const data = response['data'];
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  if (isRecord(data)) {
    for (const key of directCandidates) {
      const nested = data[key];
      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  const embedded = response['_embedded'];
  if (isRecord(embedded)) {
    const embeddedArray = findFirstRecordArray(embedded, 0, 3);
    if (embeddedArray) return embeddedArray;
  }

  const deepArray = findFirstRecordArray(response, 0, 3);
  if (deepArray) return deepArray;

  if (looksLikeEntityRecord(response)) {
    return [response];
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function looksLikeEntityRecord(value: Record<string, unknown>): boolean {
  return ['id', 'code', 'name', 'label', 'value', 'key'].some((k) => value[k] !== undefined);
}

function findFirstRecordArray(
  value: unknown,
  depth: number,
  maxDepth: number
): Record<string, unknown>[] | null {
  if (depth > maxDepth || !isRecord(value)) {
    return null;
  }

  for (const candidate of Object.values(value)) {
    if (Array.isArray(candidate)) {
      const records = candidate.filter(isRecord);
      if (records.length > 0) return records;
      if (candidate.length === 0) return [];
    }
  }

  for (const candidate of Object.values(value)) {
    if (isRecord(candidate)) {
      const found = findFirstRecordArray(candidate, depth + 1, maxDepth);
      if (found) return found;
    }
  }

  return null;
}

function withQueryParams(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });

  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}${query.toString()}`;
}

function isEmptyLookupResponse(response: unknown): boolean {
  if (response == null) return true;
  if (Array.isArray(response)) return response.length === 0;
  if (!isRecord(response)) return false;

  const candidates = ['items', 'content', 'results'];
  for (const key of candidates) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
  }

  const total = response['total'] ?? response['totalElements'];
  if (typeof total === 'number' && total === 0) {
    return true;
  }

  return false;
}
