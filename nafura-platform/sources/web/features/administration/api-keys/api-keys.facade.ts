import { Injectable, computed, inject, signal } from '@angular/core';

import {
  ApiKeyItem,
  ApiKeysApiService,
  CreateApiKeyPayload,
  CreateApiKeyResponse,
} from './api-keys-api.service';

@Injectable({ providedIn: 'root' })
export class ApiKeysFacade {
  private readonly api = inject(ApiKeysApiService);

  private readonly _items = signal<ApiKeyItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasItems = computed(() => this._items().length > 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const page = await this.api.list(0, 100);
      this._items.set(page.content ?? []);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load API keys');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async create(payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
    const created = await this.api.create(payload);
    await this.load();
    return created;
  }

  async revoke(id: string): Promise<void> {
    await this.api.revoke(id);
    await this.load();
  }
}
