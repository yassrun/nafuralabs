import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import type { ListQuery, ListResponse, LoadingState, LookupContext } from '@lib/anatomy/types';
import type { AuditLogEntry } from '../models';
import { AuditLogApiService } from './audit-log-api.service';

@Injectable({ providedIn: 'root' })
export class AuditLogFacade {
  private readonly api = inject(AuditLogApiService);

  protected readonly _items = signal<AuditLogEntry[]>([]);
  protected readonly _total = signal<number>(0);
  protected readonly _loadingState = signal<LoadingState>('idle');
  protected readonly _error = signal<string | null>(null);
  protected readonly _lookups = signal<LookupContext>({});

  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loadingState = this._loadingState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lookups = this._lookups.asReadonly();
  readonly isLoading = computed(() => this._loadingState() === 'loading');
  readonly isEmpty = computed(() => this._items().length === 0);

  private _lastQuery = signal<ListQuery | undefined>(undefined);
  private _lookupsLoaded = false;

  async loadItems(query?: ListQuery): Promise<ListResponse<AuditLogEntry>> {
    if (!this._lookupsLoaded) {
      await this.loadLookups();
      this._lookupsLoaded = true;
    }
    this._lastQuery.set(query);
    this._loadingState.set('loading');
    this._error.set(null);
    try {
      const response = await this.api.getLog(query);
      this._items.set(response.items);
      this._total.set(response.total);
      this._loadingState.set('success');
      return response;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load audit log';
      this._error.set(message);
      this._loadingState.set('error');
      throw e;
    }
  }

  /** Return current filtered view (max 10,000 rows) for client-side CSV generation. */
  async exportRows(): Promise<AuditLogEntry[]> {
    const query = this._lastQuery();
    const exportQuery: ListQuery = {
      ...query,
      page: 1,
      pageSize: 10_000,
    };
    const response = await this.api.getLog(exportQuery);
    return response.items;
  }

  async loadLookups(): Promise<void> {
    const [entityTypes] = await Promise.all([
      this.api.getEntityTypes().catch(() => []),
    ]);
    this._lookups.set({
      actions: [
        { key: 'create', value: 'Create' },
        { key: 'update', value: 'Update' },
        { key: 'delete', value: 'Delete' },
        { key: 'status_change', value: 'Status change' },
        { key: 'publish', value: 'Publish' },
        { key: 'approve', value: 'Approve' },
        { key: 'reject', value: 'Reject' },
      ],
      entityTypes: entityTypes.map((et) => ({ key: et, value: et })),
    });
  }
}
