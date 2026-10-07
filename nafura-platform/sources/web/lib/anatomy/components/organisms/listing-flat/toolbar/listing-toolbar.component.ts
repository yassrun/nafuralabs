/**
 * nf-listing-toolbar — everything above the rows of a list: view tabs, search, quick filters, pinned filters,
 * « + Filtre » with its chips, selection, table controls and actions.
 *
 * Internal to nf-listing-flat (and to nf-listing-page for a board or a calendar): not exported, not in the catalog.
 * It reads and writes the `ListingQueryStore` provided by its owner. The host is `display: contents` so the rows
 * join the owner's flex column; the container queries and the width of the mobile layout come from the owner.
 */
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../../atoms/button';
import { NfSelectComponent } from '../../../atoms/select';
import { ActionMenuComponent, type ActionMenuNode } from '../../../molecules/action-menu';
import { FilterBuilderComponent } from '../../../molecules/filter-builder';
import { FilterChipsComponent } from '../../../molecules/filter-chips';
import { ListingActionsComponent, type ListingActionItem } from '../../../molecules/listing-actions';
import type { FilterGroup } from '../../../../types';
import { emptyFilterGroup, removeLeafAt } from '../listing-query-state.util';
import { ListingQueryStore } from '../listing-query.store';
import { ListingSavedViewsComponent } from './listing-saved-views.component';

@Component({
  selector: 'nf-listing-toolbar',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    MatMenuModule,
    LucideAngularModule,
    ButtonComponent,
    NfSelectComponent,
    ActionMenuComponent,
    FilterBuilderComponent,
    FilterChipsComponent,
    ListingActionsComponent,
    ListingSavedViewsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listing-toolbar.component.html',
  styleUrl: './listing-toolbar.component.scss',
})
export class ListingToolbarComponent {
  protected readonly store = inject(ListingQueryStore);

  /** Rows selected in the table (none for a board or a calendar). */
  readonly selection = input<readonly unknown[]>([]);
  readonly toggleSelectionOn = input(false);

  readonly actionClick = output<string>();
  readonly toggleSelection = output<void>();

  @ViewChild('filterMenuTrigger') private filterMenuTrigger?: MatMenuTrigger;

  protected readonly filterMenuOpenCount = signal(0);
  /** True when the container is below 600px — the actions condense to the primary action + ⋯ overflow. */
  protected readonly isMobile = signal(false);

  protected readonly config = this.store.config;
  protected readonly features = this.store.features;
  protected readonly selectionKind = computed(() => this.features().selection);
  protected readonly splitLayout = computed(() => this.config().toolbarLayout === 'split');

  protected readonly resolvedActions = computed((): ListingActionItem[] => {
    const configured = this.config().actions ?? [];
    if (!this.features().export) return configured;
    if (configured.some((a) => a.id === 'export')) return configured;
    const exportItem: ListingActionItem = { id: 'export', label: 'Export', variant: 'secondary', icon: 'download' };
    // Export goes before the primary action (e.g. New) if present, or at the end.
    const primaryIdx = configured.findIndex((a) => a.variant === 'primary');
    if (primaryIdx >= 0) return [...configured.slice(0, primaryIdx), exportItem, ...configured.slice(primaryIdx)];
    return [...configured, exportItem];
  });

  /** Selection-scoped actions: shown when the selection count matches the action scope. */
  protected readonly visibleSelectionActions = computed(() => {
    const selection = this.selection();
    const count = selection.length;
    if (count === 0) return [];
    return (this.config().selectionActions ?? [])
      .filter((a) => {
        if (a.visible === false) return false;
        if (a.when && !selection.every((item) => a.when!(item))) return false;
        if (a.visibleFor && !a.visibleFor([...selection])) return false;
        const scope = a.scope ?? 'single+bulk';
        const min = scope === 'single' ? 1 : scope === 'bulk' ? (a.minSelection ?? 2) : (a.minSelection ?? 1);
        const max = scope === 'single' ? 1 : a.maxSelection;
        if (count < min) return false;
        if (max != null && count > max) return false;
        return true;
      })
      .map((a) => (a.disabledFor?.([...selection]) ? { ...a, disabled: true } : a));
  });

  protected readonly hasActions = computed(
    () =>
      this.resolvedActions().some((a) => a.visible !== false) ||
      this.visibleSelectionActions().length > 0 ||
      this.config().projectedActions === true
  );

  /** First visible primary action — stays a button on mobile. */
  protected readonly primaryAction = computed(() =>
    this.resolvedActions().find((a) => a.visible !== false && a.variant === 'primary')
  );

  /** Mobile ⋯ menu: selection actions first, then non-primary bar actions. */
  protected readonly mobileMenuNodes = computed((): ActionMenuNode[] => {
    const primary = this.primaryAction();
    const bar = this.resolvedActions().filter((a) => a.visible !== false && a !== primary);
    const nodes: ActionMenuNode[] = this.visibleSelectionActions().map((a) => toMenuNode(a));
    if (nodes.length > 0 && bar.length > 0) nodes.push({ kind: 'divider' });
    for (const a of bar) nodes.push(toMenuNode(a));
    return nodes;
  });

  /** Constrained desktop ⋯ menu: secondary actions; selection actions stay visible. */
  protected readonly compactMenuNodes = computed((): ActionMenuNode[] => {
    const primary = this.primaryAction();
    return this.resolvedActions()
      .filter((action) => action.visible !== false && action !== primary)
      .map((action) => toMenuNode(action));
  });

  constructor() {
    // Container-driven (not viewport-driven): the toolbar adapts to the pane the list lives in.
    if (typeof ResizeObserver === 'undefined') return;
    const zone = inject(NgZone);
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const container = host.parentElement;
      if (!container) return;
      const observer = new ResizeObserver((entries) => {
        const width = entries.at(-1)?.contentRect.width ?? 0;
        const mobile = width > 0 && width < 600;
        if (mobile !== this.isMobile()) zone.run(() => this.isMobile.set(mobile));
      });
      observer.observe(container);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onFilterMenuOpened(): void {
    this.filterMenuOpenCount.update((count) => count + 1);
  }

  protected onFilterApply(group: FilterGroup): void {
    this.store.replaceFilterGroup(group);
    this.filterMenuTrigger?.closeMenu();
  }

  protected onFilterClear(): void {
    this.store.replaceFilterGroup(emptyFilterGroup());
    this.filterMenuTrigger?.closeMenu();
  }

  protected onRemoveFilterLeaf(leafIndex: number): void {
    this.store.replaceFilterGroup(removeLeafAt(this.store.activeFilterGroup(), leafIndex));
  }

  protected onNumberFilter(key: string, value: unknown): void {
    this.store.setFilterValue(key, value != null && value !== '' ? +value : null);
  }

  protected isSortFieldTaken(field: string, exceptIndex: number): boolean {
    return this.store.sorts().some((s, i) => i !== exceptIndex && s.field === field);
  }

  protected onSortFieldChange(index: number, field: string): void {
    this.store.updateSortLevel(index, { field });
  }

  protected onSortDirectionChange(index: number, direction: 'asc' | 'desc'): void {
    this.store.updateSortLevel(index, { direction });
  }
}

function toMenuNode(a: ListingActionItem): ActionMenuNode {
  return {
    id: a.id,
    label: a.label ?? a.id,
    icon: a.icon,
    danger: a.variant === 'danger',
    disabled: a.disabled,
    tooltip: a.tooltip,
  };
}
