import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, input, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { PermissionService } from '../../core/security/services/permission.service';
import { ListingFlatComponent, type ListingFlatConfig } from '../../lib/anatomy/components/organisms/listing-flat';
import { ListingQueryStore } from '../../lib/anatomy/components/organisms/listing-flat/listing-query.store';
import { listingQueryToParams, paramsToListingQuery } from '../../lib/anatomy/components/organisms/listing-flat/listing-query-url.util';
import { ListingToolbarComponent } from '../../lib/anatomy/components/organisms/listing-flat/toolbar/listing-toolbar.component';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { FilterFieldConfig, FilterGroup, ListingQueryState, LookupContext } from '../../lib/anatomy/types';
import { isFilterGroup } from '../../lib/anatomy/types';
import { effectivePaging } from '../page-action';
import { ListingBoardViewComponent } from './listing-board-view.component';
import { ListingCalendarViewComponent } from './listing-calendar-view.component';
import { LISTING_PAGE, rowsOf, totalOf, type ListingPageContext, type PageBody } from './listing-page.context';
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
import { ListingTreeViewComponent } from './listing-tree-view.component';

const ACTION_PREFIX = 'listing:';
const DRAWN = new Set(['table', 'board', 'calendar', 'tree']);
const ALL = 500;

interface Aggregates {
  sum?: Record<string, number>;
  avg?: Record<string, number>;
  count?: Record<string, number>;
}

/**
 * A whole listing screen from a `ListingPageConfig` (input `listing` or route data `listing`): the record's properties
 * (`GET {endpoint}/properties`), one tab per view, the toolbar of nf-listing-flat (search, quick filters, « + Filtre »)
 * for every layout, and the rows as a table, a board, a calendar or a tree. `embedded`: no screen frame.
 * The table is nf-listing-flat; the board, the calendar and the tree are views loaded on demand, which share the
 * page's configuration, filter and actions through `LISTING_PAGE`.
 */
@Component({
  selector: 'nf-listing-page',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    TranslateModule,
    ScreenComponent,
    ListingFlatComponent,
    ListingToolbarComponent,
    ListingTreeViewComponent,
    ListingBoardViewComponent,
    ListingCalendarViewComponent,
  ],
  providers: [ListingQueryStore, { provide: LISTING_PAGE, useExisting: forwardRef(() => ListingPageComponent) }],
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
      @if (bar()) {
        <div class="nf-listing-page__bar">
          <div class="nf-listing-page__bar-rows">
            <nf-listing-toolbar (actionClick)="run($event)" />
          </div>
        </div>
      }
      @switch (view().layout) {
        @case ('tree') {
          @defer (on immediate) {
            <nf-listing-tree-view />
          }
        }
        @case ('board') {
          @defer (on immediate) {
            <nf-listing-board-view />
          }
        }
        @case ('calendar') {
          @defer (on immediate) {
            <nf-listing-calendar-view />
          }
        }
        @default {
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
          @if (footer().length > 0) {
            <div class="nf-listing-page__footer" role="status">
              @for (total of footer(); track total.key) {
                <span><span class="nf-listing-page__footer-label">{{ total.label }}</span> {{ total.value }}</span>
              }
            </div>
          }
        }
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; height: 100%; }
    /* Toolbar alone above a board or a calendar; the container the toolbar's responsive rules look at. */
    .nf-listing-page__bar { container-type: inline-size; }
    .nf-listing-page__bar-rows { display: flex; flex-direction: column; gap: 8px; }
    @container (max-width: 600px) {
      .nf-listing-page__bar-rows { gap: 6px; }
    }
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
export class ListingPageComponent implements ListingPageContext {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly store = inject(ListingQueryStore);
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
  readonly loadTick = signal(0);
  private readonly viewId = signal<string | null>(null);
  private readonly aggregates = signal<Aggregates | null>(null);

  readonly header = computed(() => {
    const { title, subtitle, icon } = this.config();
    return { title, subtitle, icon };
  });

  readonly view = computed((): ListingView => {
    const views = this.config().views;
    return views.find((view) => view.id === this.viewId()) ?? views[0];
  });

  /** Board and calendar: the toolbar alone, the view draws the rows. */
  protected readonly bar = computed(() => this.view().layout === 'board' || this.view().layout === 'calendar');

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

  constructor() {
    // The query state of the toolbar shown alone; the table's own nf-listing-flat has its store.
    this.store.connect({
      config: this.flat,
      lookups: signal<LookupContext>({}),
      query: this.query,
      remote: signal(true),
      resourceKey: signal(undefined),
      emit: (query) => {
        if (this.bar()) this.onLoad(query);
      },
    });

    effect(() => {
      const config = this.config();
      untracked(() => {
        const params = Object.fromEntries(this.route.snapshot.queryParamMap.keys.map((key) => [key, this.route.snapshot.queryParamMap.get(key) ?? '']));
        const initial = paramsToListingQuery(params, { pageSize: config.pageSize ?? 25 });
        const asked = config.views.find((view) => view.id === (params['view'] || initial.segment));
        initial.segment = (asked ?? config.views[0]).id;
        this.viewId.set(initial.segment);
        this.query.set(initial);
        this.loadTick.set(0);
        void this.start();
      });
    });
  }

  private async start(): Promise<void> {
    await this.loadProperties();
    await this.reload();
  }

  async reload(): Promise<void> {
    if (this.bar()) {
      this.loadTick.update((tick) => tick + 1);
      return;
    }
    await this.loadRows();
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

  open(item: Row): void {
    const route = this.config().open?.(item);
    if (route) void this.router.navigateByUrl(route);
  }

  action(id: string | undefined): ListingAction | undefined {
    return id === undefined ? undefined : this.allowed().find((action) => action.id === id);
  }

  async run(id: string): Promise<void> {
    const action = this.allowed().find((candidate) => ACTION_PREFIX + candidate.id === id);
    if (!action) return;
    const item = action.row ? this.selection()[0] : undefined;
    if (action.row && !item) return;
    await this.execute(action, item);
  }

  /** The list's fixed filter, the view's, the active pills and the user's builder, as one filter of the grammar. */
  filter(): RecordFilter | null {
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

  async fetchPage(filter: RecordFilter | null, page: number, size = this.config().pageSize ?? 25): Promise<PageBody> {
    const query = this.sorted(this.query());
    const params = listParams({ ...(query ?? { filters: [] }), page: page + 1, pageSize: size } as ListingQueryState, filter, size);
    try {
      return await firstValueFrom(this.http.get<PageBody>(this.url(this.config().endpoint), { params }));
    } catch (error) {
      this.toast.error(this.message(error));
      return { content: [], totalElements: 0 };
    }
  }

  text(key: string | undefined, row: Row): string {
    if (!key) return '';
    return this.translate.instant(formatValue(this.properties()[key], row[key], row));
  }

  private remember(query?: ListingQueryState): void {
    if (this.embedded() || !query) return;
    const params = listingQueryToParams({ ...query, segment: undefined });
    if (this.config().views.length > 1) params['view'] = this.view().id;
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, replaceUrl: true });
  }

  async execute(action: ListingAction, item?: Row, defaults: Row = {}): Promise<void> {
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

  message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const text = (error.error as { message?: string } | null)?.message;
      if (text) return text;
    }
    return this.translate.instant('Unable to load data');
  }

  url(path: string): string {
    return this.api.getApiBaseUrl().replace(/\/+$/, '') + path;
  }
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
