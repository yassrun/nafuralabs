import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import type { ListQuery, ListResponse, LoadingState } from '@lib/anatomy/types';
import type { EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate } from '../models';
import { EmailTemplatesApiService } from './email-templates-api.service';

@Injectable({ providedIn: 'root' })
export class EmailTemplatesFacade {
  private readonly api = inject(EmailTemplatesApiService);

  protected readonly _items = signal<EmailTemplate[]>([]);
  protected readonly _total = signal<number>(0);
  protected readonly _loadingState = signal<LoadingState>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _current = signal<EmailTemplate | null>(null);

  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loadingState = this._loadingState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly current = this._current.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');
  readonly isEmpty = computed(() => this._items().length === 0);

  async loadItems(query?: ListQuery): Promise<ListResponse<EmailTemplate>> {
    this._loadingState.set('loading');
    this._error.set(null);
    try {
      const response = await this.api.getList(query);
      this._items.set(response.items);
      this._total.set(response.total);
      this._loadingState.set('success');
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load email templates';
      this._error.set(message);
      this._loadingState.set('error');
      throw e;
    }
  }

  async loadOne(id: string): Promise<EmailTemplate | null> {
    this._loadingState.set('loading');
    this._error.set(null);
    try {
      const one = await this.api.getById(id);
      this._current.set(one);
      this._loadingState.set('success');
      return one;
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Failed to load template');
      this._loadingState.set('error');
      this._current.set(null);
      return null;
    }
  }

  clearCurrent(): void {
    this._current.set(null);
  }

  async create(data: EmailTemplateCreate): Promise<EmailTemplate> {
    return this.api.create(data);
  }

  async update(id: string, data: EmailTemplateUpdate): Promise<EmailTemplate> {
    const updated = await this.api.update(id, data);
    this._current.set(updated);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    await this.api.delete(id);
    if (this._current()?.id === id) this._current.set(null);
  }

  async preview(id: string, variables?: Record<string, unknown>) {
    return this.api.preview(id, variables);
  }
}
