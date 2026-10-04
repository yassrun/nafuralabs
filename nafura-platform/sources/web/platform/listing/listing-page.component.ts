import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { PermissionService } from '../../core/security/services/permission.service';
import { ListingBoardComponent, type ListingBoardColumn, type ListingBoardMove } from '../../lib/anatomy/components/organisms/listing-board';
import { ListingFlatComponent, type ListingFlatConfig } from '../../lib/anatomy/components/organisms/listing-flat';
import { listingQueryToParams, paramsToListingQuery } from '../../lib/anatomy/components/organisms/listing-flat/listing-query-url.util';
import { ListingTreeComponent, type ListingTreeAction, type ListingTreeConfig } from '../../lib/anatomy/components/organisms/listing-tree';
import type { NfTreeNode } from '../../lib/anatomy/components/organisms/tree-table';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { BadgeVariant, ColumnConfig, FormFieldConfig, ListingQueryState } from '../../lib/anatomy/types';
import { effectivePaging } from '../page-action';
import { serverQueryParams } from './listing-server-query';
import type { ListingAction, ListingPageConfig, Row } from './listing-page.types';

const ACTION_PREFIX = 'listing:';

interface LifecycleState {
  id: string;
  label: string;
  tone?: BadgeVariant;
}
interface LifecycleTransition {
  id: string;
  label?: string;
  from: string[];
  to: string;
  permission?: string;
  system?: boolean;
  requires?: string[];
  approval?: { title?: string } | null;
}
interface LifecycleDeclaration {
  entity?: string;
  states: LifecycleState[];
  transitions?: LifecycleTransition[];
}
interface PageBody {
  content?: unknown;
  items?: unknown;
  totalElements?: number;
}

/**
 * A whole listing screen from a `ListingPageConfig` (input `listing` or route data `listing`):
 * header, rows loaded from the API, nf-listing-flat (or nf-listing-tree, or nf-listing-board), and the actions.
 * `embedded`: no screen frame — a related list inside a record.
 */
@Component({
  selector: 'nf-listing-page',
  standalone: true,
  imports: [NgTemplateOutlet, TranslateModule, ScreenComponent, ListingFlatComponent, ListingTreeComponent, ListingBoardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (embedded()) {
      <ng-container [ngTemplateOutlet]="body" />
    } @else {
      <nf-screen [header]="header()">
        <ng-container [ngTemplateOutlet]="body" />
      </nf-screen>
    }
    <ng-template #body>
      @if (showViews()) {
        <div class="nf-listing-page__views" role="tablist">
          <button type="button" role="tab" [attr.aria-selected]="view() === 'table'" (click)="setView('table')">{{ 'Table' | translate }}</button>
          <button type="button" role="tab" [attr.aria-selected]="view() === 'board'" (click)="setView('board')">{{ 'Board' | translate }}</button>
        </div>
      }
      @if (treeConfig(); as tree) {
        <nf-listing-tree
          [config]="tree"
          [nodes]="nodes()"
          [loading]="loading()"
          [readonly]="!canCreateInTree()"
          [selectedKey]="selectedKey()"
          (rowClick)="selectRow($event)"
          (rowDblClick)="editInTree($event)"
          (action)="onTreeAction($event)" />
      } @else if (view() === 'board') {
        <nf-listing-board
          [columns]="boardColumns()"
          [card]="boardCard()"
          [pendingIds]="pending()"
          [moves]="moves()"
          [promptId]="promptId()"
          (open)="open($event)"
          (dragRow)="onDrag($event)"
          (dropOn)="onDrop($event)"
          (move)="fireMove($event.row, $event.transition)"
          (ask)="onAsk($event)"
          (more)="more($event)" />
      } @else {
        <nf-listing-flat
          [config]="flat()"
          [items]="items()"
          [loading]="loading()"
          [error]="errorText()"
          [remote]="server()"
          [remoteTotal]="server() ? total() : undefined"
          [query]="server() ? query() : undefined"
          (load)="onLoad($event)"
          (retry)="reload()"
          (actionClick)="run($event)"
          (selectionChange)="selection.set($event)"
          (rowClick)="config().open ? open($event) : null"
          (rowDblClick)="open($event)" />
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .nf-listing-page__views { display: flex; gap: 8px; margin-bottom: 12px; }
    .nf-listing-page__views button {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-card, #fff);
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
    }
    .nf-listing-page__views button[aria-selected='true'] {
      background: var(--nf-color-primary-50, #eef2ff);
      border-color: var(--nf-color-primary-500, #6366f1);
    }
  `,
})
export class ListingPageComponent {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly routeConfig = inject(ActivatedRoute).snapshot.data['listing'] as ListingPageConfig | undefined;

  readonly listing = input<ListingPageConfig>();
  readonly embedded = input(false);
  readonly config = computed(() => {
    const config = this.listing() ?? this.routeConfig;
    if (!config) throw new Error('nf-listing-page needs a ListingPageConfig (input or route data "listing").');
    return config;
  });

  readonly items = signal<Row[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly errorText = signal<string | null>(null);
  readonly selection = signal<Row[]>([]);
  readonly query = signal<ListingQueryState | undefined>(undefined);
  readonly view = signal<'table' | 'board'>('table');
  readonly lifecycle = signal<LifecycleDeclaration | null>(null);
  readonly boardColumns = signal<ListingBoardColumn<Row>[]>([]);
  readonly pending = signal<string[]>([]);
  readonly moves = signal<ListingBoardMove[]>([]);
  readonly promptId = signal<string | null>(null);
  private dragged: Row | null = null;

  readonly header = computed(() => {
    const { title, subtitle, icon } = this.config();
    return { title, subtitle, icon };
  });

  readonly server = computed(() => effectivePaging(this.config()) === 'server');
  readonly showViews = computed(() => !!this.config().board && !this.config().tree && this.config().columns.length > 0);

  private readonly allowed = computed(() =>
    (this.config().actions ?? []).filter((action) => !action.permission || this.permissions.hasPermission(action.permission)),
  );

  readonly flat = computed((): ListingFlatConfig => {
    const config = this.config();
    const button = ({ id, label, icon, variant }: ListingAction) => ({ id: ACTION_PREFIX + id, label, icon, variant });
    const rowActions = this.allowed().filter((action) => action.row);
    return {
      columns: this.columns(),
      filters: config.filters,
      segments: config.segments,
      defaultSegment: config.defaultSegment,
      searchFields: config.searchFields,
      emptyMessage: config.emptyMessage,
      emptyState: config.emptyState,
      pageSize: config.pageSize ?? 25,
      actions: this.allowed().filter((action) => !action.row).map(button),
      selectionActions: rowActions.map((action) => ({
        ...button(action),
        scope: 'single' as const,
        when: action.when as ((item: unknown) => boolean) | undefined,
      })),
      features: {
        filters: !!config.filters?.length,
        columnToggle: false,
        ...(config.open ? { rowClick: 'open' as const, selection: rowActions.length ? ('multiple' as const) : ('none' as const) } : {}),
        ...config.features,
      },
    };
  });

  readonly boardCard = computed(() => this.config().board?.card ?? { title: 'id' });

  /** Status badges read their label and tone from the lifecycle when the column asks for it. */
  readonly columns = computed((): ColumnConfig[] => {
    const states = this.lifecycle()?.states;
    return this.config().columns.map((column) => {
      if (!column.lifecycle || !states?.length) return column;
      return {
        ...column,
        type: column.type ?? 'badge',
        transform: (status: unknown) => states.find((state) => state.id === status)?.label ?? String(status ?? ''),
        badgeVariant: (status: unknown) => states.find((state) => state.id === status)?.tone ?? 'default',
      };
    });
  });

  readonly treeConfig = computed((): ListingTreeConfig<Row> | null => {
    const config = this.config();
    if (!config.tree) return null;
    return {
      columns: config.columns.map((column) => ({ key: column.key, label: column.label, field: column.field })),
      treeColumnKey: config.columns[0].key,
      searchFields: config.searchFields,
      emptyMessage: config.emptyMessage,
      initialExpand: 'all',
      features: { search: true, filters: false, columnToggle: false, treeActions: true, bulkSelect: false },
      actionLabels: config.tree.labels,
    };
  });

  readonly selectedKey = signal<string | null>(null);

  readonly nodes = computed((): NfTreeNode<Row>[] => {
    const parentField = this.config().tree?.parentField;
    if (!parentField) return [];
    const byId = new Map<string, NfTreeNode<Row>>();
    for (const row of this.items()) byId.set(String(row['id']), { key: String(row['id']), data: row, children: [], expanded: true });
    const roots: NfTreeNode<Row>[] = [];
    for (const node of byId.values()) {
      const parent = node.data[parentField] != null ? byId.get(String(node.data[parentField])) : undefined;
      (parent ? parent.children! : roots).push(node);
    }
    return roots;
  });

  readonly canCreateInTree = computed(() => {
    const create = this.config().tree?.create;
    return !!create && this.allowed().some((action) => action.id === create);
  });

  constructor() {
    effect(() => {
      const config = this.config();
      untracked(() => {
        const params = Object.fromEntries(this.route.snapshot.queryParamMap.keys.map((key) => [key, this.route.snapshot.queryParamMap.get(key) ?? '']));
        const initial = paramsToListingQuery(params, { pageSize: config.pageSize ?? 25 });
        if (config.defaultSegment && !initial.segment) initial.segment = config.defaultSegment;
        this.query.set(initial);
        const asked = params['view'];
        const fallback = config.board?.defaultView ?? 'board';
        const wantsBoard = !!config.board && asked !== 'table' && (asked === 'board' || fallback === 'board');
        this.view.set(wantsBoard ? 'board' : 'table');
        void this.reload();
      });
    });
  }

  async reload(): Promise<void> {
    if (this.needsLifecycle()) void this.loadLifecycle();
    if (this.view() === 'board' && this.config().board) {
      await this.loadBoard();
      return;
    }
    await this.loadTable();
  }

  onLoad(query: ListingQueryState): void {
    this.query.set(query);
    this.remember(query);
    void this.loadTable();
  }

  setView(view: 'table' | 'board'): void {
    this.view.set(view);
    this.remember(this.query());
    void this.reload();
  }

  open(item: Row): void {
    const route = this.config().open?.(item);
    if (route) void this.router.navigateByUrl(route);
  }

  selectRow(row: Row): void {
    this.selectedKey.set(String(row['id']));
    this.selection.set([row]);
  }

  editInTree(row: Row): void {
    const action = this.allowed().find((candidate) => candidate.id === this.config().tree?.edit);
    if (action) void this.execute(action, row);
  }

  async onTreeAction(event: ListingTreeAction): Promise<void> {
    const tree = this.config().tree!;
    const create = this.allowed().find((action) => action.id === tree.create);
    if (event.id === 'add-node' && create) {
      await this.execute(create, undefined, { [tree.parentField]: null });
    } else if (event.id === 'add-child' && create && event.selectedId) {
      await this.execute(create, undefined, { [tree.parentField]: event.selectedId });
    } else if (event.id === 'delete' && event.selectedId) {
      try {
        await firstValueFrom(this.http.delete(this.url(`${this.config().endpoint}/${encodeURIComponent(event.selectedId)}`)));
        if (tree.deleted) this.toast.success(this.translate.instant(tree.deleted));
      } catch {
        this.toast.error(this.translate.instant('Action failed'));
      }
      await this.reload();
    }
  }

  async run(id: string): Promise<void> {
    const action = this.allowed().find((candidate) => ACTION_PREFIX + candidate.id === id);
    if (!action) return;
    const item = action.row ? this.selection()[0] : undefined;
    if (action.row && !item) return;
    await this.execute(action, item);
  }

  onDrag(row: Row | null): void {
    this.dragged = row;
    const status = String(row?.['status'] ?? '');
    this.boardColumns.update((columns) => columns.map((column) => ({ ...column, reachable: !!row && this.reachable(status, column.id).length > 0 })));
  }

  onDrop(event: { row: Row; to: string }): void {
    const choices = this.reachable(String(event.row['status'] ?? ''), event.to);
    if (choices.length === 0) return;
    if (choices.length === 1) {
      void this.fireMove(event.row, choices[0].id);
      return;
    }
    this.moves.set(choices);
    this.promptId.set(String(event.row['id']));
  }

  onAsk(row: Row): void {
    const targets = (this.lifecycle()?.transitions ?? [])
      .filter((transition) => this.canFire(transition, String(row['status'] ?? '')))
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
    this.moves.set(targets);
    this.promptId.set(String(row['id']));
  }

  async more(state: string): Promise<void> {
    const column = this.boardColumns().find((item) => item.id === state);
    if (!column) return;
    const page = Math.ceil(column.rows.length / (this.config().pageSize ?? 25));
    const body = await this.fetchPage({ status: state, page: String(page) });
    const rows = rowsOf(body);
    this.boardColumns.update((columns) =>
      columns.map((item) =>
        item.id === state
          ? { ...item, rows: [...item.rows, ...rows], total: body.totalElements ?? item.total, hasMore: item.rows.length + rows.length < (body.totalElements ?? 0) }
          : item,
      ),
    );
  }

  async fireMove(row: Row, transitionId: string): Promise<void> {
    this.promptId.set(null);
    this.moves.set([]);
    const transition = this.lifecycle()?.transitions?.find((item) => item.id === transitionId);
    try {
      const updated = await firstValueFrom(this.http.post<Row>(this.url(`${this.config().endpoint}/${row['id']}/transitions/${transitionId}`), {}));
      if (transition?.approval && updated['status'] === transition.to) {
        this.pending.update((ids) => [...new Set([...ids, String(updated['id'])])]);
      }
      this.toast.success(this.translate.instant('record.transitioned', { state: '' }));
      await this.loadBoard();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 422 && transition?.requires?.length) {
        const filled = await this.askRequired(row, transition.requires);
        if (!filled) {
          await this.loadBoard();
          return;
        }
        try {
          await firstValueFrom(this.http.put(this.url(`${this.config().endpoint}/${row['id']}`), { ...row, ...filled }));
          await firstValueFrom(this.http.post(this.url(`${this.config().endpoint}/${row['id']}/transitions/${transitionId}`), {}));
          this.toast.success(this.translate.instant('record.transitioned', { state: '' }));
        } catch (again) {
          this.toast.error(this.message(again));
        }
      } else {
        this.toast.error(this.message(error));
      }
      await this.loadBoard();
    }
  }

  private async loadTable(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    this.errorText.set(null);
    try {
      const query = this.query();
      const params = this.server() && query
        ? serverQueryParams(query, { fixed: this.config().query, segments: this.config().segments })
        : { ...this.config().query, page: '0', size: '500' };
      const response = await firstValueFrom(this.http.get<unknown>(this.url(this.config().endpoint), { params }));
      this.items.set(rowsOf(response));
      this.total.set(totalOf(response));
    } catch (error) {
      this.items.set([]);
      this.total.set(0);
      this.failed.set(true);
      const text = error instanceof HttpErrorResponse ? (error.error as { message?: string } | null)?.message : undefined;
      this.errorText.set(text || this.translate.instant('Unable to load data'));
    } finally {
      this.selection.set([]);
      this.loading.set(false);
    }
  }

  private async loadBoard(): Promise<void> {
    this.loading.set(true);
    const lifecycle = await this.loadLifecycle();
    const hidden = new Set(this.config().board?.hide ?? []);
    const states = (lifecycle?.states ?? []).filter((state) => !hidden.has(state.id));
    const query = this.query();
    const columns = await Promise.all(
      states.map(async (state) => {
        const body = await this.fetchPage({ status: state.id, page: '0' }, query);
        const rows = rowsOf(body);
        const total = body.totalElements ?? rows.length;
        return {
          id: state.id,
          label: state.label,
          tone: state.tone,
          total,
          rows,
          reachable: false,
          hasMore: rows.length < total,
        } satisfies ListingBoardColumn<Row>;
      }),
    );
    this.boardColumns.set(columns);
    this.loading.set(false);
  }

  private async fetchPage(extra: Record<string, string>, query = this.query()): Promise<PageBody> {
    const params = serverQueryParams(query ?? { page: 1, pageSize: this.config().pageSize ?? 25, filters: [] }, {
      fixed: this.config().query,
      segments: this.config().segments,
      extra,
    });
    try {
      return await firstValueFrom(this.http.get<PageBody>(this.url(this.config().endpoint), { params }));
    } catch {
      return { content: [], totalElements: 0 };
    }
  }

  private async loadLifecycle(): Promise<LifecycleDeclaration | null> {
    if (!this.needsLifecycle()) return this.lifecycle();
    if (this.lifecycle()) return this.lifecycle();
    try {
      const declaration = await firstValueFrom(this.http.get<LifecycleDeclaration>(this.url(`${this.config().endpoint}/lifecycle`)));
      this.lifecycle.set(declaration);
      return declaration;
    } catch {
      return null;
    }
  }

  private needsLifecycle(): boolean {
    return !!this.config().board || this.config().columns.some((column) => column.lifecycle);
  }

  private reachable(from: string, to: string): ListingBoardMove[] {
    return (this.lifecycle()?.transitions ?? [])
      .filter((transition) => this.canFire(transition, from) && transition.to === to)
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
  }

  private canFire(transition: LifecycleTransition, from: string): boolean {
    return !transition.system && (transition.from ?? []).includes(from) && !!transition.permission && this.permissions.hasPermission(transition.permission);
  }

  private async askRequired(row: Row, fields: string[]): Promise<Record<string, unknown> | null> {
    const form: FormFieldConfig[] = fields.map((field) => ({
      key: field,
      field,
      label: field,
      type: typeof row[field] === 'number' || /amount|progress/i.test(field) ? 'number' : 'text',
      required: true,
    }));
    const values = await this.dialogs.form({ title: this.translate.instant('record.requiredFields', { fields: fields.join(', ') }), fields: form });
    return values;
  }

  private remember(query?: ListingQueryState): void {
    if (this.embedded() || !query) return;
    const params = listingQueryToParams(query);
    if (this.showViews()) params['view'] = this.view();
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, replaceUrl: true });
  }

  private async execute(action: ListingAction, item?: Row, defaults: Row = {}): Promise<void> {
    if (action.route) {
      void this.router.navigateByUrl(typeof action.route === 'string' ? action.route : action.route(item!));
      return;
    }
    if (action.confirm) {
      const { title, message, confirmLabel, danger } = action.confirm;
      const confirmed = await this.dialogs.confirm({ title, message, confirmLabel, variant: danger ? 'danger' : 'default' });
      if (!confirmed) return;
    }
    let body: unknown;
    if (action.form) {
      const values = await this.dialogs.form({ title: action.form.title, fields: action.form.fields, values: action.form.values?.(item) });
      if (!values) return;
      const filled = { ...defaults, ...values };
      body = action.form.body ? action.form.body(filled, item) : item && action.request?.method === 'PUT' ? { ...item, ...filled } : filled;
    }
    if (!action.request) return;

    try {
      const url = (action.request.url ?? this.config().endpoint + (item ? '/{id}' : '')).replace('{id}', encodeURIComponent(String(item?.['id'] ?? '')));
      const response = await firstValueFrom(this.http.request<Row>(action.request.method, this.url(url), { body }));
      if (action.reveal) {
        const { field, title, message } = action.reveal;
        await this.dialogs.reveal({ title, message, value: String(response?.[field] ?? '') });
      }
      if (response && action.failed?.(response)) {
        this.toast.error(this.translate.instant(action.failure ?? 'Action failed'));
      } else if (action.success) {
        this.toast.success(this.translate.instant(action.success));
      }
    } catch {
      this.toast.error(this.translate.instant('Action failed'));
    }
    await this.reload();
  }

  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const text = (error.error as { message?: string } | null)?.message;
      if (text) return text;
      if (error.status === 400) return this.translate.instant('Action failed');
    }
    return this.failed() || error ? this.translate.instant('Unable to load data') : this.translate.instant('Action failed');
  }

  private url(path: string): string {
    return this.api.getApiBaseUrl().replace(/\/+$/, '') + path;
  }
}

/** Rows of a list response: the array itself, a Spring page (`content`) or `{ items }`. */
export function rowsOf(response: unknown): Row[] {
  if (Array.isArray(response)) return response as Row[];
  const body = (response ?? {}) as PageBody;
  if (Array.isArray(body.content)) return body.content as Row[];
  if (Array.isArray(body.items)) return body.items as Row[];
  return [];
}

function totalOf(response: unknown): number {
  if (Array.isArray(response)) return response.length;
  const total = (response as PageBody | null)?.totalElements;
  return typeof total === 'number' ? total : rowsOf(response).length;
}
