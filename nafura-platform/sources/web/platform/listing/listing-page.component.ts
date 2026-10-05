import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { PermissionService } from '../../core/security/services/permission.service';
import { ListingBoardComponent, type ListingBoardColumn, type ListingBoardMove } from '../../lib/anatomy/components/organisms/listing-board';
import { ListingCalendarComponent, type ListingCalendarItem } from '../../lib/anatomy/components/organisms/listing-calendar';
import { ListingFlatComponent, type ListingFlatConfig } from '../../lib/anatomy/components/organisms/listing-flat';
import { listingQueryToParams, paramsToListingQuery } from '../../lib/anatomy/components/organisms/listing-flat/listing-query-url.util';
import { ListingTreeComponent, type ListingTreeAction, type ListingTreeConfig } from '../../lib/anatomy/components/organisms/listing-tree';
import type { NfTreeNode } from '../../lib/anatomy/components/organisms/tree-table';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { FilterFieldConfig, FilterGroup, FormFieldConfig, ListingQueryState } from '../../lib/anatomy/types';
import { isFilterGroup } from '../../lib/anatomy/types';
import { effectivePaging } from '../page-action';
import {
  allOf,
  columnsOf,
  filterFields,
  filterTargets,
  formatValue,
  listParams,
  toRecordFilter,
  type RecordFilter,
  type RecordProperties,
} from './listing-properties';
import type { ListingAction, ListingPageConfig, ListingView, Row } from './listing-page.types';

const ACTION_PREFIX = 'listing:';
const DRAWN = new Set(['table', 'board', 'calendar', 'tree']);
const ALL = 500;

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
interface PageBody {
  content?: unknown;
  items?: unknown;
  totalElements?: number;
}
interface Aggregates {
  sum?: Record<string, number>;
  avg?: Record<string, number>;
  count?: Record<string, number>;
}

/**
 * A whole listing screen from a `ListingPageConfig` (input `listing` or route data `listing`): the record's properties
 * (`GET {endpoint}/properties`), one tab per view, the toolbar of nf-listing-flat (search, quick filters, « + Filtre »)
 * for every layout, and the rows as a table, a board, a calendar or a tree. `embedded`: no screen frame.
 */
@Component({
  selector: 'nf-listing-page',
  standalone: true,
  imports: [NgTemplateOutlet, TranslateModule, ScreenComponent, ListingFlatComponent, ListingTreeComponent, ListingBoardComponent, ListingCalendarComponent],
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
      @if (view().layout === 'tree') {
        <nf-listing-tree
          [config]="treeConfig()!"
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
          [error]="errorText()"
          [remote]="true"
          [remoteTotal]="total()"
          [query]="query()"
          (load)="onLoad($event)"
          (retry)="reload()"
          (actionClick)="run($event)"
          (selectionChange)="selection.set($event)"
          (rowClick)="config().open ? open($event) : null"
          (rowDblClick)="open($event)" />
        @switch (view().layout) {
          @case ('board') {
            <nf-listing-board
              [columns]="boardColumns()"
              [card]="boardCard"
              [pendingIds]="pending()"
              [moves]="moves()"
              [promptId]="promptId()"
              (open)="open($event)"
              (dragRow)="onDrag($event)"
              (dropOn)="onDrop($event)"
              (move)="fireMove($event.row, $event.transition)"
              (ask)="onAsk($event)"
              (more)="more($event)" />
          }
          @case ('calendar') {
            <nf-listing-calendar [month]="month()" [items]="calendarItems()" (open)="open($event)" (monthChange)="setMonth($event)" />
          }
          @case ('table') {
            @if (footer().length > 0) {
              <div class="nf-listing-page__footer" role="status">
                @for (total of footer(); track total.key) {
                  <span><span class="nf-listing-page__footer-label">{{ total.label }}</span> {{ total.value }}</span>
                }
              </div>
            }
          }
        }
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; height: 100%; }
    /* Board and calendar: below the toolbar of nf-listing-flat, scrolling on their own. */
    nf-listing-calendar, nf-listing-board { flex: 1 1 auto; min-height: 0; overflow: auto; }
    .nf-listing-page__footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 16px;
      padding: 8px 12px;
      margin-top: 8px;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .nf-listing-page__footer-label { font-weight: 400; color: var(--nf-text-secondary, #6b7280); }
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
    if (!config.views?.length) throw new Error(`Listing ${config.endpoint} declares no view.`);
    const undrawn = config.views.find((view) => !DRAWN.has(view.layout));
    if (undrawn) throw new Error(`Listing ${config.endpoint}: layout "${undrawn.layout}" of view "${undrawn.id}" is not built yet.`);
    return config;
  });

  readonly properties = signal<RecordProperties>({});
  private readonly targets = signal<Record<string, RecordProperties>>({});
  private readonly relationOptions = signal<Record<string, Array<{ label: string; value: unknown }>>>({});

  readonly items = signal<Row[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly errorText = signal<string | null>(null);
  readonly selection = signal<Row[]>([]);
  readonly query = signal<ListingQueryState | undefined>(undefined);
  private readonly viewId = signal<string | null>(null);
  private readonly transitions = signal<LifecycleTransition[]>([]);
  readonly boardColumns = signal<ListingBoardColumn<Row>[]>([]);
  readonly pending = signal<string[]>([]);
  readonly moves = signal<ListingBoardMove[]>([]);
  readonly promptId = signal<string | null>(null);
  readonly month = signal(firstOfMonth(new Date()));
  readonly calendarItems = signal<ListingCalendarItem<Row>[]>([]);
  private readonly aggregates = signal<Aggregates | null>(null);

  readonly boardCard = { title: '__title', subtitle: '__subtitle', badge: '__badge', meta: '__meta' };

  readonly header = computed(() => {
    const { title, subtitle, icon } = this.config();
    return { title, subtitle, icon };
  });

  readonly view = computed((): ListingView => {
    const views = this.config().views;
    return views.find((view) => view.id === this.viewId()) ?? views[0];
  });

  private readonly allowed = computed(() =>
    (this.config().actions ?? []).filter((action) => !action.permission || this.permissions.hasPermission(action.permission)),
  );

  /** Quick filters not hidden on the current view. */
  private readonly quickFilters = computed(() => {
    const hidden = new Set(this.view().hideQuickFilters ?? []);
    return (this.config().quickFilters ?? []).filter((quick) => !hidden.has('id' in quick ? quick.id : quick.property));
  });

  private readonly builderFields = computed(() => filterFields(this.properties(), this.targets(), this.relationOptions()));

  /** Builder fields, plus the pinned dropdowns of the quick filters. */
  private readonly fields = computed((): FilterFieldConfig[] => {
    const pinned = new Map<string, FilterFieldConfig>();
    for (const quick of this.quickFilters()) {
      if ('id' in quick) continue;
      const key = quick.on ? `${quick.property}.${quick.on}` : quick.property;
      const field = this.builderFields().find((item) => item.key === key);
      if (!field) continue;
      pinned.set(key, {
        ...field,
        label: quick.label ?? field.label,
        type: quick.operator === 'in' ? 'multiselect' : field.type,
        pinned: true,
      });
    }
    return this.builderFields().map((field) => pinned.get(field.key) ?? field);
  });

  readonly flat = computed((): ListingFlatConfig => {
    const config = this.config();
    const view = this.view();
    const button = ({ id, label, icon, variant }: ListingAction) => ({ id: ACTION_PREFIX + id, label, icon, variant });
    const rowActions = this.allowed().filter((action) => action.row);
    const table = view.layout === 'table';
    const show = view.show ?? Object.keys(this.properties());
    return {
      columns: columnsOf(show, this.properties(), (key, value, row) => this.translate.instant(formatValue(this.properties()[key], value, row as Row))),
      filters: this.fields(),
      segments: config.views.length > 1 ? config.views.map(({ id, label }) => ({ id, label })) : undefined,
      defaultSegment: config.views[0].id,
      presets: this.quickFilters().flatMap((quick) => ('id' in quick ? [{ id: quick.id, label: quick.label }] : [])),
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
        filters: this.fields().length > 0,
        columnToggle: false,
        table,
        pagination: effectivePaging(config, view) === 'server',
        ...(config.open ? { rowClick: 'open' as const, selection: rowActions.length ? ('multiple' as const) : ('none' as const) } : {}),
        ...config.features,
      },
    };
  });

  /** Totals of the whole filtered result, under the table (`view.footer`). */
  readonly footer = computed(() => {
    const totals = this.aggregates();
    return Object.entries(this.view().footer ?? {}).map(([key, aggregate]) => {
      const property = this.properties()[key];
      const value = totals?.[aggregate]?.[key];
      return {
        key,
        label: `${this.translate.instant(`listing.${aggregate}`)} · ${property?.label ?? key}`,
        value: value == null ? '…' : aggregate === 'count' ? String(value) : formatValue(property, value),
      };
    });
  });

  readonly treeConfig = computed((): ListingTreeConfig<Row> | null => {
    const view = this.view();
    if (view.layout !== 'tree' || !view.tree) return null;
    const columns = columnsOf(view.show ?? Object.keys(this.properties()), this.properties(), (key, value, row) =>
      this.translate.instant(formatValue(this.properties()[key], value, row as Row)),
    );
    return {
      columns: columns.map((column) => ({ key: column.key, label: column.label, field: column.field })),
      treeColumnKey: columns[0]?.key ?? 'id',
      emptyMessage: this.config().emptyMessage,
      initialExpand: 'all',
      features: { search: true, filters: false, columnToggle: false, treeActions: true, bulkSelect: false },
      actionLabels: view.tree.labels,
    };
  });

  readonly selectedKey = signal<string | null>(null);

  readonly nodes = computed((): NfTreeNode<Row>[] => {
    const parentField = this.view().tree?.parentField;
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
    const create = this.view().tree?.create;
    return !!create && this.allowed().some((action) => action.id === create);
  });

  constructor() {
    effect(() => {
      const config = this.config();
      untracked(() => {
        const params = Object.fromEntries(this.route.snapshot.queryParamMap.keys.map((key) => [key, this.route.snapshot.queryParamMap.get(key) ?? '']));
        const initial = paramsToListingQuery(params, { pageSize: config.pageSize ?? 25 });
        const asked = config.views.find((view) => view.id === (params['view'] || initial.segment));
        initial.segment = (asked ?? config.views[0]).id;
        this.viewId.set(initial.segment);
        this.query.set(initial);
        void this.start();
      });
    });
  }

  private async start(): Promise<void> {
    await this.loadProperties();
    await this.reload();
  }

  async reload(): Promise<void> {
    switch (this.view().layout) {
      case 'board':
        await this.loadBoard();
        break;
      case 'calendar':
        await this.loadCalendar();
        break;
      default:
        await this.loadRows();
    }
  }

  onLoad(query: ListingQueryState): void {
    const changedView = query.segment != null && query.segment !== this.viewId();
    this.query.set(query);
    if (changedView) {
      this.viewId.set(query.segment!);
      this.aggregates.set(null);
    }
    this.remember(query);
    void this.reload();
  }

  setMonth(month: string): void {
    this.month.set(month);
    void this.loadCalendar();
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
    const action = this.allowed().find((candidate) => candidate.id === this.view().tree?.edit);
    if (action) void this.execute(action, row);
  }

  async onTreeAction(event: ListingTreeAction): Promise<void> {
    const tree = this.view().tree!;
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
    const targets = this.transitions()
      .filter((transition) => this.movesByStatus() && this.canFire(transition, String(row['status'] ?? '')))
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
    this.moves.set(targets);
    this.promptId.set(String(row['id']));
  }

  async more(value: string): Promise<void> {
    const column = this.boardColumns().find((item) => item.id === value);
    if (!column) return;
    const page = Math.ceil(column.rows.length / (this.config().pageSize ?? 25));
    const body = await this.fetch(allOf(this.filter(), { [this.view().groupBy!]: { is: value } }), page);
    const rows = rowsOf(body).map((row) => this.card(row));
    this.boardColumns.update((columns) =>
      columns.map((item) =>
        item.id === value
          ? { ...item, rows: [...item.rows, ...rows], total: body.totalElements ?? item.total, hasMore: item.rows.length + rows.length < (body.totalElements ?? 0) }
          : item,
      ),
    );
  }

  async fireMove(row: Row, transitionId: string): Promise<void> {
    this.promptId.set(null);
    this.moves.set([]);
    const transition = this.transitions().find((item) => item.id === transitionId);
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
          await firstValueFrom(this.http.put(this.url(`${this.config().endpoint}/${row['id']}`), { ...plain(row), ...filled }));
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

  /** The list's fixed filter, the view's, the active pills and the user's builder, as one filter of the grammar. */
  private filter(): RecordFilter | null {
    const query = this.query();
    const active = new Set(query?.presets ?? []);
    const pills = this.quickFilters().flatMap((quick) => ('id' in quick && active.has(quick.id) ? [quick.filter] : []));
    const shown = new Set(this.fields().map((field) => field.key));
    const group = query?.filterGroup ? onlyFields(query.filterGroup, shown) : undefined;
    return allOf(this.config().filter, this.view().filter, ...pills, toRecordFilter(group, filterTargets(this.properties(), this.targets())));
  }

  private sorted(query: ListingQueryState | undefined): ListingQueryState | undefined {
    if (query?.sort?.field) return query;
    const first = this.view().sort?.[0];
    if (!first) return query;
    const [field, direction] = Object.entries(first)[0];
    return { ...(query ?? { page: 1, pageSize: this.config().pageSize ?? 25, filters: [] }), sort: { field, direction } };
  }

  private async loadProperties(): Promise<void> {
    try {
      const properties = await firstValueFrom(this.http.get<RecordProperties>(this.url(`${this.config().endpoint}/properties`)));
      this.properties.set(properties);
      const targets: Record<string, RecordProperties> = {};
      const options: Record<string, Array<{ label: string; value: unknown }>> = {};
      await Promise.all(
        Object.entries(properties)
          .filter(([, property]) => property.filterable && property.endpoint && property.target)
          .map(async ([key, property]) => {
            const [target, values] = await Promise.all([
              firstValueFrom(this.http.get<RecordProperties>(this.url(`${property.endpoint}/properties`))).catch(() => ({})),
              property.type === 'relation' && property.options
                ? firstValueFrom(this.http.get<Array<{ value: unknown; label: unknown }>>(this.url(property.options))).catch(() => [])
                : Promise.resolve([]),
            ]);
            targets[property.target!] = target;
            if (property.type === 'relation') options[key] = values.map((option) => ({ value: option.value, label: String(option.label ?? option.value) }));
          }),
      );
      this.targets.set(targets);
      this.relationOptions.set(options);
    } catch (error) {
      this.errorText.set(this.message(error));
    }
    if (this.properties()['status']?.type === 'status') void this.loadTransitions();
  }

  private async loadTransitions(): Promise<void> {
    try {
      const lifecycle = await firstValueFrom(this.http.get<{ transitions?: LifecycleTransition[] }>(this.url(`${this.config().endpoint}/lifecycle`)));
      this.transitions.set(lifecycle.transitions ?? []);
    } catch {
      this.transitions.set([]);
    }
  }

  private async loadRows(): Promise<void> {
    this.loading.set(true);
    this.errorText.set(null);
    const view = this.view();
    const all = effectivePaging(this.config(), view) === 'client';
    const filter = this.filter();
    try {
      const query = this.sorted(this.query());
      const params = listParams(all ? { ...(query ?? { filters: [] }), page: 1, pageSize: ALL } as ListingQueryState : query, filter, this.config().pageSize ?? 25);
      const response = await firstValueFrom(this.http.get<unknown>(this.url(this.config().endpoint), { params }));
      this.items.set(rowsOf(response));
      this.total.set(totalOf(response));
      if (view.layout === 'table' && view.footer) void this.loadAggregates(filter, view);
    } catch (error) {
      this.items.set([]);
      this.total.set(0);
      this.errorText.set(this.message(error));
    } finally {
      this.selection.set([]);
      this.loading.set(false);
    }
  }

  private async loadAggregates(filter: RecordFilter | null, view: ListingView): Promise<void> {
    const params: Record<string, string | string[]> = {};
    const search = this.query()?.search?.trim();
    if (search) params['q'] = search;
    if (filter) params['filter'] = JSON.stringify(filter);
    for (const [key, aggregate] of Object.entries(view.footer ?? {})) {
      params[aggregate] = [...((params[aggregate] as string[] | undefined) ?? []), key];
    }
    try {
      this.aggregates.set(await firstValueFrom(this.http.get<Aggregates>(this.url(`${this.config().endpoint}/aggregate`), { params })));
    } catch {
      this.aggregates.set(null);
    }
  }

  private async loadBoard(): Promise<void> {
    this.loading.set(true);
    this.items.set([]);
    this.total.set(0);
    const view = this.view();
    const property = this.properties()[view.groupBy ?? ''];
    const hidden = new Set(view.hide ?? []);
    const values = (property?.values ?? []).filter((value) => !hidden.has(value.id));
    const filter = this.filter();
    const columns = await Promise.all(
      values.map(async (value) => {
        const body = await this.fetch(allOf(filter, { [view.groupBy!]: { is: value.id } }), 0);
        const rows = rowsOf(body).map((row) => this.card(row));
        const total = body.totalElements ?? rows.length;
        return { id: value.id, label: value.label, tone: value.tone, total, rows, reachable: false, hasMore: rows.length < total } satisfies ListingBoardColumn<Row>;
      }),
    );
    this.boardColumns.set(columns);
    this.total.set(columns.reduce((sum, column) => sum + column.total, 0));
    this.loading.set(false);
  }

  private async loadCalendar(): Promise<void> {
    this.loading.set(true);
    const view = this.view();
    const date = view.date!;
    const start = this.month();
    const end = lastOfMonth(start);
    const body = await this.fetch(allOf(this.filter(), { [date]: { between: [start, end] } }), 0, ALL);
    const rows = rowsOf(body);
    const card = view.card ?? [];
    this.calendarItems.set(
      rows
        .filter((row) => row[date] != null)
        .map((row) => ({
          id: String(row['id']),
          date: String(row[date]).slice(0, 10),
          title: this.text(card[0], row) || String(row['id']),
          subtitle: card[1] ? this.text(card[1], row) : undefined,
          row,
        })),
    );
    this.total.set(totalOf(body));
    this.loading.set(false);
  }

  private async fetch(filter: RecordFilter | null, page: number, size = this.config().pageSize ?? 25): Promise<PageBody> {
    const query = this.sorted(this.query());
    const params = listParams({ ...(query ?? { filters: [] }), page: page + 1, pageSize: size } as ListingQueryState, filter, size);
    try {
      return await firstValueFrom(this.http.get<PageBody>(this.url(this.config().endpoint), { params }));
    } catch (error) {
      this.toast.error(this.message(error));
      return { content: [], totalElements: 0 };
    }
  }

  /** A board card: the row plus its formatted texts (title, subtitle, badge, meta). */
  private card(row: Row): Row {
    const [title, subtitle, badge, meta] = this.view().card ?? [];
    return {
      ...row,
      __title: this.text(title, row) || String(row['id']),
      __subtitle: subtitle ? this.text(subtitle, row) : undefined,
      __badge: badge ? this.text(badge, row) : undefined,
      __meta: meta ? this.text(meta, row) : undefined,
    };
  }

  private text(key: string | undefined, row: Row): string {
    if (!key) return '';
    return this.translate.instant(formatValue(this.properties()[key], row[key], row));
  }

  private movesByStatus(): boolean {
    return this.view().layout === 'board' && this.view().groupBy === 'status';
  }

  private reachable(from: string, to: string): ListingBoardMove[] {
    if (!this.movesByStatus()) return [];
    return this.transitions()
      .filter((transition) => this.canFire(transition, from) && transition.to === to)
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
  }

  private canFire(transition: LifecycleTransition, from: string): boolean {
    return !transition.system && (transition.from ?? []).includes(from) && !!transition.permission && this.permissions.hasPermission(transition.permission);
  }

  private async askRequired(row: Row, fields: string[]): Promise<Record<string, unknown> | null> {
    const form: FormFieldConfig[] = fields.map((field) => {
      const property = this.properties()[field];
      const numeric = property?.type === 'number' || property?.type === 'money';
      return {
        key: field,
        field,
        label: property?.label ?? field,
        type: numeric ? 'number' : property?.type === 'date' ? 'date' : 'text',
        required: true,
      } as FormFieldConfig;
    });
    const labels = form.map((field) => field.label).join(', ');
    return this.dialogs.form({ title: this.translate.instant('record.requiredFields', { fields: labels }), fields: form });
  }

  private remember(query?: ListingQueryState): void {
    if (this.embedded() || !query) return;
    const params = listingQueryToParams({ ...query, segment: undefined });
    if (this.config().views.length > 1) params['view'] = this.view().id;
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
    }
    return this.translate.instant('Unable to load data');
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

/** The builder's tree without clauses on fields this view does not offer (a hidden quick filter). */
function onlyFields(group: FilterGroup, keys: Set<string>): FilterGroup {
  return {
    combinator: group.combinator,
    children: group.children
      .map((child) => (isFilterGroup(child) ? onlyFields(child, keys) : child))
      .filter((child) => (isFilterGroup(child) ? child.children.length > 0 : keys.has(child.field))),
  };
}

/** A row without the board's formatted texts, to send back to the API. */
function plain(row: Row): Row {
  const { __title, __subtitle, __badge, __meta, ...rest } = row;
  return rest;
}

function firstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function lastOfMonth(first: string): string {
  const date = new Date(`${first}T00:00:00`);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}
