/**
 * Breadcrumb Service
 *
 * Manages breadcrumb navigation state.
 */

import { Injectable, Signal, signal, computed } from '@angular/core';

import { BreadcrumbItem } from '../types';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);

  readonly breadcrumbs: Signal<BreadcrumbItem[]> = this._breadcrumbs.asReadonly();
  readonly hasBreadcrumbs: Signal<boolean> = computed(() => this._breadcrumbs().length > 0);
  readonly count: Signal<number> = computed(() => this._breadcrumbs().length);

  /**
   * Set breadcrumbs (replaces existing).
   */
  set(items: BreadcrumbItem[]): void {
    this._breadcrumbs.set(items);
  }

  /**
   * Push a breadcrumb item to the end.
   */
  push(item: BreadcrumbItem): void {
    this._breadcrumbs.update((current) => [...current, item]);
  }

  /**
   * Pop the last breadcrumb item.
   */
  pop(): BreadcrumbItem | undefined {
    const current = this._breadcrumbs();
    if (current.length === 0) return undefined;

    const removed = current[current.length - 1];
    this._breadcrumbs.set(current.slice(0, -1));
    return removed;
  }

  /**
   * Update the last breadcrumb item.
   */
  updateLast(updates: Partial<BreadcrumbItem>): void {
    this._breadcrumbs.update((current) => {
      if (current.length === 0) return current;
      const updated = [...current];
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...updates };
      return updated;
    });
  }

  /**
   * Clear all breadcrumbs.
   */
  clear(): void {
    this._breadcrumbs.set([]);
  }

  /**
   * Set breadcrumbs from route segments.
   */
  fromSegments(segments: [string, string?][]): void {
    const items: BreadcrumbItem[] = segments.map(([label, route]) => ({
      label,
      route,
    }));
    this.set(items);
  }
}
