import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import type { ListQuery, ListResponse, LoadingState, LookupContext } from '@lib/anatomy/types';
import type {
  WorkflowTemplate,
  WorkflowTemplateCreate,
  WorkflowTemplateUpdate,
} from '../models';
import { WorkflowTemplatesApiService } from './workflow-templates-api.service';

@Injectable({ providedIn: 'root' })
export class WorkflowsFacade {
  private readonly api = inject(WorkflowTemplatesApiService);

  protected readonly _items = signal<WorkflowTemplate[]>([]);
  protected readonly _total = signal<number>(0);
  protected readonly _loadingState = signal<LoadingState>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _lookups = signal<LookupContext>({});
  protected readonly _current = signal<WorkflowTemplate | null>(null);

  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loadingState = this._loadingState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lookups = this._lookups.asReadonly();
  readonly current = this._current.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');
  readonly isEmpty = computed(() => this._items().length === 0);

  private _lookupsLoaded = false;

  async loadItems(query?: ListQuery): Promise<ListResponse<WorkflowTemplate>> {
    if (!this._lookupsLoaded) {
      await this.loadLookups();
      this._lookupsLoaded = true;
    }
    this._loadingState.set('loading');
    this._error.set(null);
    try {
      const response = await this.api.getList(query);
      this._items.set(response.items);
      this._total.set(response.total);
      this._loadingState.set('success');
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load workflow templates';
      this._error.set(message);
      this._loadingState.set('error');
      throw e;
    }
  }

  async loadOne(id: string): Promise<WorkflowTemplate | null> {
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

  async create(data: WorkflowTemplateCreate): Promise<WorkflowTemplate> {
    return this.api.create(data);
  }

  async update(id: string, data: WorkflowTemplateUpdate): Promise<WorkflowTemplate> {
    const updated = await this.api.update(id, data);
    this._current.set(updated);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    await this.api.delete(id);
    if (this._current()?.id === id) this._current.set(null);
  }

  async setActive(id: string, active: boolean): Promise<WorkflowTemplate> {
    return this.api.setActive(id, active);
  }

  async loadLookups(): Promise<void> {
    const [entityTypes] = await Promise.all([this.api.getEntityTypes().catch(() => [])]);
    this._lookups.set({
      entityTypes: entityTypes.map((et) => ({ key: et, value: et })),
    });
  }
}
