import { Injectable, signal } from '@angular/core';

import type { RecentItem as RecentItemPayload, SearchResult } from './command-palette.types';

const STORAGE_KEY = 'nf-recent-items';
const MAX_ITEMS = 10;

@Injectable({ providedIn: 'root' })
export class RecentItemsService {
  private readonly _items = signal<SearchResult[]>(this.loadFromStorage());

  readonly items = this._items.asReadonly();

  getRecent(): SearchResult[] {
    return this._items();
  }

  /**
   * Track a visit. Accepts either a full SearchResult (e.g. from palette navigation)
   * or a RecentItem payload (e.g. from ConfigDrivenDetailPage).
   * Dedupes by entityType+entityId when both present, otherwise by route.
   */
  trackVisit(item: SearchResult | RecentItemPayload): void {
    const visitedAt = new Date().toISOString();
    const isPayload = 'entityType' in item && 'entityId' in item && 'title' in item;
    const normalized: SearchResult = isPayload
      ? {
          id: `${(item as RecentItemPayload).entityType}:${(item as RecentItemPayload).entityId}`,
          label: (item as RecentItemPayload).title,
          icon: 'file',
          route: (item as RecentItemPayload).route,
          subtitle: (item as RecentItemPayload).subtitle,
          category: 'recent',
          entityType: (item as RecentItemPayload).entityType,
          entityId: (item as RecentItemPayload).entityId,
          visitedAt,
        }
      : { ...item, category: 'recent', visitedAt };

    const dedupeKey =
      normalized.entityType != null && normalized.entityId != null
        ? `${normalized.entityType}:${normalized.entityId}`
        : normalized.route;
    const next = [normalized, ...this._items().filter((existing) => getDedupeKey(existing) !== dedupeKey)]
      .slice(0, MAX_ITEMS)
      .map((entry) => ({ ...entry, category: 'recent' as const }));

    this._items.set(next);
    this.persist(next);
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadFromStorage(): SearchResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as SearchResult[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item) => !!item && typeof item.route === 'string')
        .slice(0, MAX_ITEMS)
        .map((item) => ({ ...item, category: 'recent' }));
    } catch {
      return [];
    }
  }

  private persist(items: SearchResult[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch {
      // Ignore storage failures (quota/private mode).
    }
  }
}

function getDedupeKey(entry: SearchResult): string {
  return entry.entityType != null && entry.entityId != null
    ? `${entry.entityType}:${entry.entityId}`
    : entry.route;
}
