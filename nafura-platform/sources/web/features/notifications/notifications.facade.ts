import { Injectable, computed, inject, signal } from '@angular/core';

import {
  NotificationFilters,
  NotificationItem,
  NotificationsApiService,
} from './notifications-api.service';
import { NotificationUnreadService } from '../collaboration/notification/services/notification-unread.service';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  private readonly api = inject(NotificationsApiService);
  private readonly unreadStore = inject(NotificationUnreadService);

  private readonly _items = signal<NotificationItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedIds = signal<Set<string>>(new Set());

  readonly filters = signal<NotificationFilters>({
    source: 'all',
    status: 'all',
    dateRange: '7d',
  });

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();
  readonly unreadCount = this.unreadStore.count;
  readonly hasSelection = computed(() => this._selectedIds().size > 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const page = await this.api.list(this.filters(), 0, 100);
      this._items.set(page.content ?? []);
      await this.unreadStore.refresh();
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load notifications');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  setFilters(next: NotificationFilters): void {
    this.filters.set(next);
  }

  toggleSelection(id: string): void {
    this._selectedIds.update((state) => {
      const next = new Set(state);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  async markRead(id: string): Promise<void> {
    await this.api.markRead(id);
    await this.load();
  }

  async markAllRead(): Promise<void> {
    await this.api.markAllRead();
    await this.load();
  }

  async markSelectedRead(): Promise<void> {
    const ids = Array.from(this._selectedIds());
    if (ids.length === 0) {
      return;
    }
    await this.api.bulkMarkRead(ids);
    this.clearSelection();
    await this.load();
  }

  async clearOldRead(days = 30): Promise<void> {
    const before = new Date();
    before.setDate(before.getDate() - days);
    await this.api.deleteReadBefore(before.toISOString());
    await this.load();
  }
}
