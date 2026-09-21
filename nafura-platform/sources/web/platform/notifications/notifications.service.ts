import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PlatformNotificationsApiService } from './notifications-api.service';
import { PlatformNotification } from './notifications.types';

@Injectable()
export class PlatformNotificationsService {
  private readonly api = inject(PlatformNotificationsApiService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private initialized = false;
  readonly notifications = signal<readonly PlatformNotification[]>([]);
  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.read).length,
  );

  setNotifications(notifications: readonly PlatformNotification[]): void {
    this.notifications.set(notifications);
  }

  add(notification: PlatformNotification): void {
    this.notifications.update((current) => [notification, ...current]);
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const notifications = await firstValueFrom(this.api.list());
      this.notifications.set(notifications);
      this.initialized = true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger les notifications.');
    } finally {
      this.loading.set(false);
    }
  }

  initialize(): void {
    if (!this.initialized) void this.load();
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.api.markAllRead());
      this.markAllReadLocally();
      this.error.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de marquer les notifications.');
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.markRead(id));
      this.markReadLocally(id);
      this.error.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de marquer la notification.');
    }
  }

  private markAllReadLocally(): void {
    this.notifications.update((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  private markReadLocally(id: string): void {
    this.notifications.update((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }
}
