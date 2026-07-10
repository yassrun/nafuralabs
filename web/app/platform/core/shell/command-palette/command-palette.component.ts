import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, from, of, switchMap } from 'rxjs';

import type { SearchResult } from './command-palette.types';
import { GlobalSearchApiService } from './global-search-api.service';
import { RecentItemsService } from './recent-items.service';
import { SidebarRegistry } from '../../navigation/sidebar.registry';
import { SidebarNode } from '../../navigation/sidebar.types';
import { PermissionService } from '../../security/services/permission.service';
import { CommandPaletteService } from './command-palette.service';

interface PaletteDisplayItem {
  id: string;
  kind: 'header' | 'item';
  label: string;
  category?: 'recent' | 'pages' | 'records' | 'actions';
  result?: SearchResult;
}

const STATIC_PAGES: SearchResult[] = [
  {
    id: 'page:user-settings',
    label: 'core.topbar.mySettings',
    icon: 'settings',
    route: '/user-settings',
    category: 'pages',
    breadcrumb: '',
  },
  {
    id: 'page:app-settings',
    label: 'core.topbar.appSettings',
    icon: 'sliders-horizontal',
    route: '/administration/settings',
    category: 'pages',
    breadcrumb: 'Administration',
  },
  {
    id: 'page:notifications',
    label: 'notifications.center.title',
    icon: 'search',
    route: '/notifications',
    category: 'pages',
    breadcrumb: '',
  },
];

const STATIC_PALETTE_ACTIONS: SearchResult[] = [
  {
    id: 'action:chantier-new',
    label: 'core.search.actions.newChantier',
    icon: 'file',
    route: '/chantiers/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:bc-new',
    label: 'core.search.actions.newBc',
    icon: 'file',
    route: '/achats/commandes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:da-new',
    label: 'core.search.actions.newDa',
    icon: 'file',
    route: '/achats/demandes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:employe-new',
    label: 'core.search.actions.newEmploye',
    icon: 'file',
    route: '/rh/employes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:facture-vente-new',
    label: 'core.search.actions.newFactureVente',
    icon: 'file',
    route: '/ventes/factures/new',
    category: 'actions',
    breadcrumb: '',
  },
];

@Component({
  selector: 'nf-command-palette',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  template: `
    <div class="nf-command-palette__backdrop" (click)="close()"></div>
    <section class="nf-command-palette__dialog" role="dialog" aria-modal="true">
      <header class="nf-command-palette__header">
        <input
          #searchInput
          type="text"
          class="nf-command-palette__input"
          [placeholder]="'core.search.placeholder' | translate"
          [value]="query()"
          (input)="onSearch($event)"
          (keydown.arrowDown)="moveSelection(1); $event.preventDefault()"
          (keydown.arrowUp)="moveSelection(-1); $event.preventDefault()"
          (keydown.enter)="navigateToSelected(); $event.preventDefault()"
          (keydown.escape)="close(); $event.preventDefault()" />
        <button type="button" class="nf-command-palette__close" (click)="close()">
          {{ 'ai.assistant.close' | translate }}
        </button>
      </header>

      <ul class="nf-command-palette__results" role="listbox">
        <ng-container *ngFor="let item of displayItems(); let i = index">
          <li *ngIf="item.kind === 'header'" class="nf-command-palette__section">
            <span>{{ item.label | translate }}</span>
            <span *ngIf="item.category === 'recent'" class="nf-command-palette__section-action">
              <button type="button" class="nf-command-palette__clear-recent" (click)="clearRecent(); $event.stopPropagation()">
                {{ 'core.search.clearRecent' | translate }}
              </button>
            </span>
            <span *ngIf="item.category === 'records' && recordsLoading()">
              {{ 'core.search.loading' | translate }}
            </span>
          </li>
          <li
            *ngIf="item.kind === 'item' && item.result as result"
            class="nf-command-palette__result"
            [class.nf-command-palette__result--active]="selectedIndex() === i"
            (click)="navigateTo(result)"
            (mouseenter)="selectedIndex.set(i)"
            role="option">
            <lucide-icon
              [name]="paletteIconName(result)"
              [size]="16"
              class="nf-command-palette__icon"></lucide-icon>
            <div class="nf-command-palette__text">
              <span class="nf-command-palette__label">{{ result.label | translate }}</span>
              <span *ngIf="result.breadcrumb || result.subtitle" class="nf-command-palette__breadcrumb">
                {{ result.breadcrumb || result.subtitle }}
              </span>
            </div>
          </li>
        </ng-container>
      </ul>

      <footer class="nf-command-palette__footer" *ngIf="showNoResults()">
        {{ query().trim().length < 2 ? ('core.search.minChars' | translate) : ('core.search.noResults' | translate) }}
      </footer>
    </section>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .nf-command-palette__backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 9998;
      }
      .nf-command-palette__dialog {
        position: fixed;
        top: 14%;
        left: 50%;
        transform: translateX(-50%);
        width: min(720px, 94vw);
        background: var(--nf-color-surface, #fff);
        border-radius: 14px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        z-index: 9999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 78vh;
      }
      .nf-command-palette__header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
        padding: 0.6rem;
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .nf-command-palette__input {
        width: 100%;
        padding: 0.65rem 0.8rem;
        font-size: 0.95rem;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 10px;
        outline: none;
      }
      .nf-command-palette__close {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: transparent;
        border-radius: 10px;
        padding: 0 0.75rem;
      }
      .nf-command-palette__results {
        list-style: none;
        margin: 0;
        padding: 0.4rem 0;
        overflow-y: auto;
      }
      .nf-command-palette__section {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0.9rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--nf-text-muted, #6b7280);
        text-transform: uppercase;
      }
      .nf-command-palette__result {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.9rem;
        cursor: pointer;
      }
      .nf-command-palette__result:hover,
      .nf-command-palette__result--active {
        background: var(--nf-surface-hover, #f3f4f6);
      }
      .nf-command-palette__icon {
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-command-palette__text {
        display: grid;
        min-width: 0;
      }
      .nf-command-palette__label {
        font-weight: 500;
      }
      .nf-command-palette__breadcrumb {
        font-size: 0.78rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-command-palette__footer {
        padding: 0.6rem 0.9rem;
        border-top: 1px solid var(--nf-border-default, #e5e7eb);
        font-size: 0.82rem;
        color: var(--nf-text-muted, #6b7280);
      }
      @media (max-width: 768px) {
        .nf-command-palette__dialog {
          inset: 0;
          top: 0;
          left: 0;
          transform: none;
          width: 100vw;
          max-height: 100vh;
          border-radius: 0;
        }
      }
    `,
  ],
})
export class CommandPaletteComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly commandPalette = inject(CommandPaletteService);
  private readonly sidebarRegistry = inject(SidebarRegistry);
  private readonly permissionService = inject(PermissionService);
  private readonly globalSearchApi = inject(GlobalSearchApiService);
  private readonly recentItems = inject(RecentItemsService);
  private readonly translateSvc = inject(TranslateService);

  private readonly recordsQuery$ = new Subject<string>();

  readonly searchInput = viewChild<HTMLInputElement>('searchInput');
  readonly query = signal('');
  readonly selectedIndex = signal(0);
  readonly recordsLoading = signal(false);
  readonly recordResults = signal<SearchResult[]>([]);

  private readonly pageItems = computed(() => {
    const nodes = this.sidebarRegistry.getAllNodes();
    const flattened = this.flattenNodes(nodes)
      .filter((item) => this.hasPermission(item.node))
      .map(({ node, breadcrumb }) => ({
        id: `page:${node.id}`,
        label: node.label || node.id,
        icon: typeof node.icon === 'string' ? node.icon : 'file',
        route: node.route?.startsWith('/') ? node.route : `/${node.route}`,
        breadcrumb,
        category: 'pages' as const,
      }))
      .filter((item) => !!item.route);
    return [...STATIC_PAGES, ...flattened];
  });

  readonly recentResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.recentItems
      .items()
      .filter((item) => !q || this.matchesSearchItem(item, q))
      .slice(0, 5)
      .map((item) => ({ ...item, category: 'recent' as const }));
  });

  readonly pageResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.pageItems()
      .filter((item) => !q || this.matchesSearchItem(item, q))
      .slice(0, 10);
  });

  readonly paletteActionResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    return STATIC_PALETTE_ACTIONS.filter((item) => !q || this.matchesSearchItem(item, q));
  });

  readonly displayItems = computed<PaletteDisplayItem[]>(() => {
    const q = this.query().trim();
    const items: PaletteDisplayItem[] = [];

    const recent = this.recentResults();
    if (recent.length > 0) {
      items.push({ id: 'header-recent', kind: 'header', label: 'core.search.recent', category: 'recent' });
      items.push(
        ...recent.map((result) => ({
          id: `recent-${result.id}`,
          kind: 'item' as const,
          label: result.label,
          result,
        }))
      );
    }

    const pages = this.pageResults();
    if (pages.length > 0) {
      items.push({ id: 'header-pages', kind: 'header', label: 'core.search.pages', category: 'pages' });
      items.push(
        ...pages.map((result) => ({
          id: `page-${result.id}`,
          kind: 'item' as const,
          label: result.label,
          result,
        }))
      );
    }

    const actions = this.paletteActionResults();
    if (actions.length > 0) {
      items.push({ id: 'header-actions', kind: 'header', label: 'core.search.sectionActions', category: 'actions' });
      items.push(
        ...actions.map((result) => ({
          id: `action-${result.id}`,
          kind: 'item' as const,
          label: result.label,
          result,
        }))
      );
    }

    if (q.length >= 2) {
      items.push({ id: 'header-records', kind: 'header', label: 'core.search.records', category: 'records' });
      items.push(
        ...this.recordResults().map((result) => ({
          id: `record-${result.id}`,
          kind: 'item' as const,
          label: result.label,
          result,
        }))
      );
    }

    return items;
  });

  readonly showNoResults = computed(() => {
    const hasAnyItem = this.displayItems().some((item) => item.kind === 'item');
    return !this.recordsLoading() && !hasAnyItem;
  });

  constructor() {
    this.recordsQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();
          if (trimmed.length < 2) {
            this.recordsLoading.set(false);
            return of<SearchResult[]>([]);
          }
          this.recordsLoading.set(true);
          return from(this.globalSearchApi.search(trimmed, 10)).pipe(
            catchError(() => of<SearchResult[]>([])),
            finalize(() => this.recordsLoading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        this.recordResults.set(results);
      });

    effect(() => {
      if (!this.commandPalette.open()) {
        return;
      }
      this.query.set('');
      this.recordResults.set([]);
      this.selectedIndex.set(0);
      this.recordsQuery$.next('');
      queueMicrotask(() => this.searchInput()?.focus());
    });

    effect(() => {
      const items = this.displayItems();
      if (items.length === 0) {
        this.selectedIndex.set(0);
        return;
      }
      const current = this.selectedIndex();
      if (current >= items.length || !this.isSelectable(items[current])) {
        this.selectedIndex.set(this.findNextSelectableIndex(0, 1));
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.selectedIndex.set(this.findNextSelectableIndex(0, 1));
    this.recordsQuery$.next(value);
  }

  moveSelection(delta: number): void {
    const items = this.displayItems();
    if (items.length === 0) {
      return;
    }
    let next = this.selectedIndex();
    for (let i = 0; i < items.length; i += 1) {
      next += delta;
      if (next < 0) {
        next = items.length - 1;
      } else if (next >= items.length) {
        next = 0;
      }
      if (this.isSelectable(items[next])) {
        this.selectedIndex.set(next);
        return;
      }
    }
  }

  navigateToSelected(): void {
    const selected = this.displayItems()[this.selectedIndex()];
    if (!selected || selected.kind !== 'item' || !selected.result) {
      return;
    }
    this.navigateTo(selected.result);
  }

  navigateTo(result: SearchResult): void {
    this.recentItems.trackVisit(result);
    void this.router.navigateByUrl(result.route);
    this.commandPalette.hide();
  }

  close(): void {
    this.commandPalette.hide();
  }

  clearRecent(): void {
    this.recentItems.clear();
  }

  private isSelectable(item: PaletteDisplayItem | undefined): boolean {
    return !!item && item.kind === 'item';
  }

  private findNextSelectableIndex(start: number, step: 1 | -1): number {
    const items = this.displayItems();
    if (items.length === 0) {
      return 0;
    }
    let index = start;
    for (let i = 0; i < items.length; i += 1) {
      if (index < 0) {
        index = items.length - 1;
      } else if (index >= items.length) {
        index = 0;
      }
      if (this.isSelectable(items[index])) {
        return index;
      }
      index += step;
    }
    return 0;
  }

  private matchesSearchItem(
    item: Pick<SearchResult, 'label' | 'route' | 'breadcrumb' | 'subtitle'>,
    q: string,
  ): boolean {
    if (!q) return true;
    const translated = this.translateSvc.instant(item.label);
    const haystack = [item.label, translated, item.route, item.breadcrumb ?? '', item.subtitle ?? '']
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');
    return this.textMatchesQuery(haystack, q);
  }

  private textMatchesQuery(haystackRaw: string, qRaw: string): boolean {
    const haystack = this.normalizeForMatch(haystackRaw);
    const q = this.normalizeForMatch(qRaw);
    if (!q) return true;
    if (haystack.includes(q)) return true;
    return this.fuzzySubsequence(haystack, q);
  }

  private normalizeForMatch(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}+/gu, '');
  }

  /** Subsequence fuzzy match (lightweight alternative to fuse.js / fuzzysort). */
  private fuzzySubsequence(s: string, query: string): boolean {
    let i = 0;
    for (let ci = 0; ci < query.length; ci += 1) {
      const ch = query[ci]!;
      const idx = s.indexOf(ch, i);
      if (idx === -1) return false;
      i = idx + 1;
    }
    return query.length > 0;
  }

  paletteIconName(result: SearchResult): string {
    if (result.category === 'recent') return 'clock-3';
    return result.icon || 'file';
  }

  private flattenNodes(
    nodes: SidebarNode[],
    breadcrumb = ''
  ): Array<{ node: SidebarNode; breadcrumb: string }> {
    const out: Array<{ node: SidebarNode; breadcrumb: string }> = [];
    for (const node of nodes) {
      const label = node.label || node.id || '';
      const nextBreadcrumb = breadcrumb ? `${breadcrumb} > ${label}` : label;
      if (node.route) {
        out.push({ node, breadcrumb });
      }
      if (node.children?.length) {
        out.push(...this.flattenNodes(node.children, nextBreadcrumb));
      }
    }
    return out;
  }

  private hasPermission(node: SidebarNode): boolean {
    if (node.permissionsAny?.length) {
      return this.permissionService.hasAnyPermission(node.permissionsAny);
    }
    if (node.permissions?.length) {
      return this.permissionService.hasAllPermissions(node.permissions);
    }
    return true;
  }
}
