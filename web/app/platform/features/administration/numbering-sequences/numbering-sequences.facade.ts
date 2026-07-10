import { Injectable, computed, inject, signal } from '@angular/core';

import {
  NumberingSequenceItem,
  NumberingSequencePayload,
  NumberingSequencesApiService,
} from './numbering-sequences-api.service';

@Injectable({ providedIn: 'root' })
export class NumberingSequencesFacade {
  private readonly api = inject(NumberingSequencesApiService);

  private readonly _items = signal<NumberingSequenceItem[]>([]);
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
      const page = await this.api.list();
      this._items.set(page.content ?? []);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load numbering sequences');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: NumberingSequencePayload, id?: string | null): Promise<void> {
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
}
