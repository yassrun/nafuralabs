import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthFacade } from '../../core/security/services/auth.facade';
import { TenantContextService } from '../../core/tenant/tenant.context';
import { PlatformNotificationsApiService, resolveNotificationRoute } from './notifications-api.service';
import type { NotificationInboxView, NotificationPreferenceSetting } from './notifications-api.types';
import {
  PlatformNotificationStreamService,
  type PlatformNotificationStreamPayload,
} from './notification-stream.service';
import { PlatformNotification } from './notifications.types';
import { notificationSourceLabel } from './notification-source';

@Injectable()
export class PlatformNotificationsService {
  private readonly api = inject(PlatformNotificationsApiService);
  private readonly router = inject(Router);
  private readonly stream = inject(PlatformNotificationStreamService);
  private readonly auth = inject(AuthFacade);
  private readonly tenant = inject(TenantContextService);

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly view = signal<NotificationInboxView>('unread');
  readonly source = signal<string>('');
  readonly eventOptions = signal<readonly NotificationPreferenceSetting[]>([]);
  readonly notifications = signal<readonly PlatformNotification[]>([]);
  readonly totalElements = signal(0);
  readonly lastPage = signal(true);
  /** Unread total from the API — independent of the active view filter. */
  readonly unreadCount = signal(0);
  /** Bumped when a live notification arrives — drives the bell pulse. */
  readonly livePulse = signal(0);

  private initialized = false;
  private page = 0;
  private streamUnsub: (() => void) | null = null;

  readonly hasMore = computed(() => !this.lastPage());

  constructor() {
    this.streamUnsub = this.stream.subscribe((payload) => this.onStream(payload));
    effect(() => {
      const token = this.auth.accessToken();
      const tenantId = this.tenant.tenantId() ?? this.auth.currentTenant()?.tenant.id ?? null;
      untracked(() => {
        if (token && tenantId) {
          this.stream.connect();
          this.initialize();
        } else {
          this.stream.disconnect();
          this.resetLocal();
        }
      });
    });
  }

  setNotifications(notifications: readonly PlatformNotification[]): void {
    this.notifications.set(notifications);
  }

  add(notification: PlatformNotification): void {
    this.notifications.update((current) => {
      if (current.some((item) => item.id === notification.id)) {
        return current;
      }
      return [notification, ...current];
    });
    if (!notification.read) {
      this.unreadCount.update((count) => count + 1);
    }
  }

  initialize(): void {
    if (!this.initialized) void this.load();
  }

  async setView(view: NotificationInboxView): Promise<void> {
    if (this.view() === view && this.initialized) return;
    this.view.set(view);
    await this.load();
  }

  async setSource(source: string): Promise<void> {
    const next = source || '';
    if (this.source() === next && this.initialized) return;
    this.source.set(next);
    await this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.page = 0;
    try {
      const query = {
        page: 0,
        view: this.view(),
        source: this.source() || undefined,
      };
      const [result] = await Promise.all([
        firstValueFrom(this.api.list(query)),
        this.refreshUnread(),
        this.refreshEvents(),
      ]);
      this.notifications.set(result.items);
      this.totalElements.set(result.totalElements);
      this.lastPage.set(result.last);
      this.initialized = true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger les notifications.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (this.loading() || this.loadingMore() || this.lastPage()) return;
    this.loadingMore.set(true);
    this.error.set(null);
    try {
      const next = this.page + 1;
      const result = await firstValueFrom(
        this.api.list({ page: next, view: this.view(), source: this.source() || undefined }),
      );
      this.page = next;
      this.notifications.update((current) => [...current, ...result.items]);
      this.totalElements.set(result.totalElements);
      this.lastPage.set(result.last);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger les notifications.');
    } finally {
      this.loadingMore.set(false);
    }
  }

  async refreshUnread(): Promise<void> {
    try {
      this.unreadCount.set(await firstValueFrom(this.api.unreadCount()));
    } catch {
      /* bell stays on the last known count */
    }
  }

  private async refreshEvents(): Promise<void> {
    if (this.eventOptions().length) return;
    try {
      this.eventOptions.set(await firstValueFrom(this.api.preferences()));
    } catch {
      /* filter stays empty until the next load */
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.api.markAllRead());
      this.notifications.update((current) => current.map((notification) => ({ ...notification, read: true })));
      this.unreadCount.set(0);
      this.error.set(null);
      if (this.view() === 'unread') {
        this.notifications.set([]);
        this.totalElements.set(0);
        this.lastPage.set(true);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de marquer les notifications.');
    }
  }

  async markRead(id: string): Promise<void> {
    const wasUnread = this.notifications().some((notification) => notification.id === id && !notification.read);
    try {
      await firstValueFrom(this.api.markRead(id));
      this.notifications.update((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
      if (wasUnread) {
        this.unreadCount.update((count) => Math.max(0, count - 1));
      }
      this.error.set(null);
      if (this.view() === 'unread') {
        this.notifications.update((current) => current.filter((notification) => notification.id !== id));
        this.totalElements.update((total) => Math.max(0, total - 1));
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de marquer la notification.');
    }
  }

  /** Mark read, then open the target (explicit URL or record declared by the business contexts). */
  async open(notification: PlatformNotification): Promise<void> {
    if (!notification.read) {
      await this.markRead(notification.id);
    }
    const route =
      notification.route ??
      resolveNotificationRoute({
        id: notification.id,
        title: notification.title,
        actionUrl: notification.actionUrl,
        entityType: notification.entityType,
        entityId: notification.entityId,
      });
    if (route) {
      await this.router.navigateByUrl(route);
    }
  }

  private onStream(payload: PlatformNotificationStreamPayload): void {
    if (payload.type === 'new_notification' && payload.id) {
      if (this.notifications().some((item) => item.id === payload.id)) {
        return;
      }
      const notification = this.fromStream(payload);
      this.unreadCount.update((count) => count + 1);
      this.livePulse.update((n) => n + 1);
      if (this.fitsCurrentView(notification)) {
        this.addWithoutUnreadBump(notification);
      }
      return;
    }
    if (payload.type === 'refresh') {
      void this.refreshUnread();
    }
  }

  private fitsCurrentView(notification: PlatformNotification): boolean {
    if (this.view() === 'read') return false;
    const sourceFilter = this.source();
    if (sourceFilter && notification.source !== sourceFilter) return false;
    return true;
  }

  private addWithoutUnreadBump(notification: PlatformNotification): void {
    let added = false;
    this.notifications.update((current) => {
      if (current.some((item) => item.id === notification.id)) {
        return current;
      }
      added = true;
      return [notification, ...current];
    });
    if (added) {
      this.totalElements.update((total) => total + 1);
    }
  }

  private fromStream(payload: PlatformNotificationStreamPayload): PlatformNotification {
    const dto = {
      id: payload.id!,
      title: payload.title ?? '',
      body: payload.body,
      isRead: payload.isRead ?? false,
      sentAt: payload.sentAt,
      actionUrl: payload.actionUrl || undefined,
      entityType: payload.entityType || undefined,
      entityId: payload.entityId || undefined,
      source: payload.source,
    };
    return {
      id: dto.id,
      title: dto.title,
      message: dto.body,
      read: dto.isRead ?? false,
      createdAt: dto.sentAt,
      entityType: dto.entityType,
      entityId: dto.entityId,
      actionUrl: dto.actionUrl,
      source: dto.source,
      sourceLabel: notificationSourceLabel(dto.source),
      route: resolveNotificationRoute(dto),
    };
  }

  private resetLocal(): void {
    this.initialized = false;
    this.notifications.set([]);
    this.unreadCount.set(0);
    this.totalElements.set(0);
    this.lastPage.set(true);
    this.error.set(null);
  }
}
