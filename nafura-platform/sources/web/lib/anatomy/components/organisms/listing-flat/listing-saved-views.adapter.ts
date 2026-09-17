import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { ListingQueryState } from '../../../types';

export interface ListingSavedView {
  id: string;
  resourceKey: string;
  name: string;
  isDefault: boolean;
  query: ListingQueryState;
}

export interface ListingSavedViewInput {
  resourceKey: string;
  name: string;
  isDefault: boolean;
  query: ListingQueryState;
}

export interface ListingSavedViewsAdapter {
  list(resourceKey: string): Promise<ListingSavedView[]>;
  create(input: ListingSavedViewInput): Promise<ListingSavedView>;
  update(id: string, input: Omit<ListingSavedViewInput, 'resourceKey'>): Promise<ListingSavedView>;
  delete(id: string): Promise<void>;
}

export const LISTING_SAVED_VIEWS_ADAPTER = new InjectionToken<ListingSavedViewsAdapter>(
  'LISTING_SAVED_VIEWS_ADAPTER'
);

function parseView(raw: {
  id: string;
  resourceKey: string;
  name: string;
  isDefault: boolean;
  queryJson: string;
}): ListingSavedView {
  return {
    id: raw.id,
    resourceKey: raw.resourceKey,
    name: raw.name,
    isDefault: raw.isDefault,
    query: JSON.parse(raw.queryJson) as ListingQueryState,
  };
}

function serializeQuery(query: ListingQueryState): string {
  return JSON.stringify(query);
}

@Injectable({ providedIn: 'root' })
export class HttpListingSavedViewsAdapter implements ListingSavedViewsAdapter {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LISTING_SAVED_VIEWS_API_BASE, { optional: true }) ?? '/api/v1/listing-views';

  async list(resourceKey: string): Promise<ListingSavedView[]> {
    const params = new HttpParams().set('resourceKey', resourceKey);
    const rows = await firstValueFrom(
      this.http.get<
        Array<{
          id: string;
          resourceKey: string;
          name: string;
          isDefault: boolean;
          queryJson: string;
        }>
      >(this.baseUrl, { params })
    );
    return rows.map(parseView);
  }

  async create(input: ListingSavedViewInput): Promise<ListingSavedView> {
    const body = {
      resourceKey: input.resourceKey,
      name: input.name,
      isDefault: input.isDefault,
      queryJson: serializeQuery(input.query),
    };
    const row = await firstValueFrom(
      this.http.post<{
        id: string;
        resourceKey: string;
        name: string;
        isDefault: boolean;
        queryJson: string;
      }>(this.baseUrl, body)
    );
    return parseView(row);
  }

  async update(id: string, input: Omit<ListingSavedViewInput, 'resourceKey'>): Promise<ListingSavedView> {
    const body = {
      name: input.name,
      isDefault: input.isDefault,
      queryJson: serializeQuery(input.query),
    };
    const row = await firstValueFrom(
      this.http.put<{
        id: string;
        resourceKey: string;
        name: string;
        isDefault: boolean;
        queryJson: string;
      }>(`${this.baseUrl}/${id}`, body)
    );
    return parseView(row);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}

export const LISTING_SAVED_VIEWS_API_BASE = new InjectionToken<string>('LISTING_SAVED_VIEWS_API_BASE');

/** Browser persistence for sandbox / offline demos (same interface as HTTP API). */
export class LocalStorageListingSavedViewsAdapter implements ListingSavedViewsAdapter {
  constructor(
    private readonly storageKeyPrefix = 'nf-listing-saved-views',
    private readonly userKey = 'sandbox'
  ) {}

  private storageKey(resourceKey: string): string {
    return `${this.storageKeyPrefix}:${this.userKey}:${resourceKey}`;
  }

  private read(resourceKey: string): ListingSavedView[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey(resourceKey));
      if (!raw) return [];
      return JSON.parse(raw) as ListingSavedView[];
    } catch {
      return [];
    }
  }

  private write(resourceKey: string, views: ListingSavedView[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey(resourceKey), JSON.stringify(views));
  }

  async list(resourceKey: string): Promise<ListingSavedView[]> {
    return this.read(resourceKey).sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: ListingSavedViewInput): Promise<ListingSavedView> {
    const views = this.read(input.resourceKey);
    if (input.isDefault) {
      for (const v of views) v.isDefault = false;
    }
    const created: ListingSavedView = {
      id: crypto.randomUUID(),
      resourceKey: input.resourceKey,
      name: input.name,
      isDefault: input.isDefault,
      query: input.query,
    };
    views.push(created);
    this.write(input.resourceKey, views);
    return created;
  }

  async update(id: string, input: Omit<ListingSavedViewInput, 'resourceKey'>): Promise<ListingSavedView> {
    const resourceKey = this.findResourceKey(id);
    const views = this.read(resourceKey);
    const idx = views.findIndex((v) => v.id === id);
    if (idx < 0) throw new Error(`Saved view ${id} not found`);
    if (input.isDefault) {
      for (const v of views) v.isDefault = false;
    }
    views[idx] = {
      ...views[idx],
      name: input.name,
      isDefault: input.isDefault,
      query: input.query,
    };
    this.write(resourceKey, views);
    return views[idx];
  }

  async delete(id: string): Promise<void> {
    const resourceKey = this.findResourceKey(id);
    const views = this.read(resourceKey).filter((v) => v.id !== id);
    this.write(resourceKey, views);
  }

  private findResourceKey(id: string): string {
    if (typeof localStorage === 'undefined') throw new Error('Saved view not found');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.storageKeyPrefix)) continue;
      try {
        const views = JSON.parse(localStorage.getItem(key) ?? '[]') as ListingSavedView[];
        if (views.some((v) => v.id === id)) {
          const parts = key.split(':');
          return parts[parts.length - 1] ?? '';
        }
      } catch {
        /* skip */
      }
    }
    throw new Error(`Saved view ${id} not found`);
  }
}
