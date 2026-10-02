import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { PermissionService } from '../../core/security/services/permission.service';
import { ListingFlatComponent, type ListingFlatConfig } from '../../lib/anatomy/components/organisms/listing-flat';
import { ListingTreeComponent, type ListingTreeAction, type ListingTreeConfig } from '../../lib/anatomy/components/organisms/listing-tree';
import type { NfTreeNode } from '../../lib/anatomy/components/organisms/tree-table';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { ListingAction, ListingPageConfig, Row } from './listing-page.types';

const ACTION_PREFIX = 'listing:';

/**
 * A whole listing screen from a `ListingPageConfig` (input `listing` or route data `listing`):
 * header, rows loaded from the API, nf-listing-flat (or nf-listing-tree), and the actions (confirm, form, request, toast).
 * `embedded`: no screen frame — a related list inside a record.
 */
@Component({
  selector: 'nf-listing-page',
  standalone: true,
  imports: [NgTemplateOutlet, ScreenComponent, ListingFlatComponent, ListingTreeComponent],
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
      } @else {
        <nf-listing-flat
          [config]="flat()"
          [items]="items()"
          [loading]="loading()"
          [error]="failed() ? 'Unable to load data' : null"
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
  `,
})
export class ListingPageComponent {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);
  private readonly router = inject(Router);
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
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly selection = signal<Row[]>([]);

  readonly header = computed(() => {
    const { title, subtitle, icon } = this.config();
    return { title, subtitle, icon };
  });

  private readonly allowed = computed(() =>
    (this.config().actions ?? []).filter((action) => !action.permission || this.permissions.hasPermission(action.permission)),
  );

  readonly flat = computed((): ListingFlatConfig => {
    const config = this.config();
    // Prefixed ids: a configured `delete`/`export` must not trigger nf-listing-flat's built-in behaviour.
    const button = ({ id, label, icon, variant }: ListingAction) => ({ id: ACTION_PREFIX + id, label, icon, variant });
    const rowActions = this.allowed().filter((action) => action.row);
    return {
      columns: config.columns,
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
        // A row that opens on click is selected with its checkbox.
        ...(config.open ? { rowClick: 'open' as const, selection: rowActions.length ? ('multiple' as const) : ('none' as const) } : {}),
        ...config.features,
      },
    };
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

  /** Rows nested by `tree.parentField`; a row whose parent is missing is a root. */
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
      this.config();
      untracked(() => void this.reload());
    });
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const params = { ...this.config().query, page: 0, size: 500 };
      const response = await firstValueFrom(this.http.get<unknown>(this.url(this.config().endpoint), { params }));
      this.items.set(rowsOf(response));
    } catch {
      this.items.set([]);
      this.failed.set(true);
    } finally {
      this.selection.set([]);
      this.loading.set(false);
    }
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

  /** Route, confirm, form, request, reveal, toast, reload. `defaults` pre-fill a creation (e.g. the parent of a tree node). */
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
      // A replacement (PUT) keeps the fields the form does not show.
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

  private url(path: string): string {
    return this.api.getApiBaseUrl().replace(/\/+$/, '') + path;
  }
}

/** Rows of a list response: the array itself, a Spring page (`content`) or `{ items }`. */
export function rowsOf(response: unknown): Row[] {
  if (Array.isArray(response)) return response as Row[];
  const body = (response ?? {}) as { content?: unknown; items?: unknown };
  if (Array.isArray(body.content)) return body.content as Row[];
  if (Array.isArray(body.items)) return body.items as Row[];
  return [];
}
