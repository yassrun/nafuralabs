import { Injectable, computed, inject, signal } from '@angular/core';

import {
  WebhookConfigItem,
  WebhookDeliveryItem,
  WebhookUpsertPayload,
  WebhooksApiService,
} from './webhooks-api.service';

@Injectable({ providedIn: 'root' })
export class WebhooksFacade {
  private readonly api = inject(WebhooksApiService);

  private readonly _items = signal<WebhookConfigItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _selectedWebhook = signal<WebhookConfigItem | null>(null);
  private readonly _deliveries = signal<WebhookDeliveryItem[]>([]);
  private readonly _deliveriesTotal = signal(0);
  private readonly _deliveriesLoading = signal(false);
  private readonly _deliveriesError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedWebhook = this._selectedWebhook.asReadonly();

  readonly deliveries = this._deliveries.asReadonly();
  readonly deliveriesTotal = this._deliveriesTotal.asReadonly();
  readonly deliveriesLoading = this._deliveriesLoading.asReadonly();
  readonly deliveriesError = this._deliveriesError.asReadonly();

  readonly hasItems = computed(() => this._items().length > 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const page = await this.api.list(0, 100);
      this._items.set(page.content ?? []);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load webhooks');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: WebhookUpsertPayload, id?: string | null): Promise<void> {
    if (id) {
      await this.api.update(id, payload);
    } else {
      await this.api.create(payload);
    }
    await this.load();
  }

  async remove(id: string): Promise<void> {
    await this.api.remove(id);
    await this.load();
  }

  async test(id: string): Promise<{ success: boolean; responseCode: number | null }> {
    return this.api.test(id);
  }

  setSelectedWebhook(webhook: WebhookConfigItem | null): void {
    this._selectedWebhook.set(webhook);
  }

  async loadDeliveries(
    id: string,
    page = 0,
    size = 20
  ): Promise<{ content: WebhookDeliveryItem[]; totalElements: number }> {
    this._deliveriesLoading.set(true);
    this._deliveriesError.set(null);
    try {
      const result = await this.api.deliveries(id, page, size);
      this._deliveries.set(result.content ?? []);
      this._deliveriesTotal.set(result.totalElements ?? 0);
      return result;
    } catch (error) {
      this._deliveriesError.set(
        error instanceof Error ? error.message : 'Failed to load deliveries'
      );
      throw error;
    } finally {
      this._deliveriesLoading.set(false);
    }
  }
}
