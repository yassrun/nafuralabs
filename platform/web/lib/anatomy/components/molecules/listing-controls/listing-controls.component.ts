import { Component, input, output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button';
import { FilterBuilderComponent } from '../filter-builder';
import { ViewModeSwitcherComponent } from '../../organisms/entity-listing/view-mode-switcher.component';
import type { FilterFieldConfig, LookupContext, ViewMode } from '../../../types';

/** Column item for hide/show columns popup (key, label, visible). */
export interface ListingControlsColumn {
  key: string;
  label: string;
  visible: boolean;
}

/**
 * Listing Controls Component (nf-listing-controls)
 *
 * Left-aligned listing toolbar: optional multi-select toggle, columns visibility, filter, sort, search.
 * - Multi-select (first): when showSelectionToggle, toggles table selection mode.
 * - Columns (eye): active when hiddenColumnsCount > 0.
 * - Filter: active when filterActive is true.
 * - Sort: active when sortActive is true.
 */
@Component({
  selector: 'nf-listing-controls',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FilterBuilderComponent,
    ViewModeSwitcherComponent,
    LucideAngularModule,
    MatMenuModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  templateUrl: './listing-controls.component.html',
  styleUrl: './listing-controls.component.scss',
})
export class ListingControlsComponent {
  /** When true, show the multi-select toggle as the first button (before columns). */
  showSelectionToggle = input<boolean>(false);
  /** When true, table is in selection mode — multi-select button shows active and "Cancel" icon. */
  selectionModeActive = input<boolean>(false);

  /** Column definitions for hide/show popup. When empty, columns button still opens an empty list. */
  columns = input<ListingControlsColumn[]>([]);
  /** Number of columns currently hidden. When > 0, columns button shows active. */
  hiddenColumnsCount = input<number>(0);
  /** When true, at least one filter is applied — filter button shows active. */
  filterActive = input<boolean>(false);
  /** Filter fields for the filter builder popup. When provided (length > 0), filter button opens a menu with the builder. */
  filterFields = input<FilterFieldConfig[]>([]);
  /** Current filter values (for the filter builder form). */
  filterValues = input<Record<string, unknown>>({});
  /** Lookups for filter options (e.g. roles for member role filter). */
  lookups = input<LookupContext>({});
  /** When true, show the sort button. Default true. */
  showSortButton = input<boolean>(true);
  /** When true, sort is applied (different from default) — sort button shows active. */
  sortActive = input<boolean>(false);
  /** Current search term (one-way; parent owns value). */
  search = input<string>('');

  // ─── View Mode ─────────────────────────────────────────────────────────────
  /** When true, show the view mode switcher. */
  showViewModeSwitcher = input<boolean>(false);
  /** Available view modes. */
  viewModes = input<ViewMode[]>([]);
  /** Current view mode. */
  currentViewMode = input<ViewMode>('table');

  /** Emitted when the multi-select toggle is clicked (parent should toggle selection mode). */
  selectionToggleClick = output<void>();
  columnsChange = output<ListingControlsColumn[]>();
  /** Emitted when filter button is clicked and no filter builder is configured. */
  filterClick = output<void>();
  /** Emitted when user applies or clears filters in the filter builder. */
  filterChange = output<Record<string, unknown>>();
  sortClick = output<void>();
  searchChange = output<string>();
  /** Emitted when the view mode changes. */
  viewModeChange = output<ViewMode>();

  /** Incremented each time the filter menu opens; filter builder uses this to sync from current values. */
  readonly filterMenuOpenCount = signal(0);

  @ViewChild('filterMenuTrigger') filterMenuTrigger?: MatMenuTrigger;

  onSearchInput(value: string): void {
    this.searchChange.emit(value);
  }

  setColumnVisibility(key: string, visible: boolean): void {
    const next = this.columns().map((c) =>
      c.key === key ? { ...c, visible } : c
    );
    this.columnsChange.emit(next);
  }

  onFilterClick(): void {
    if (this.filterFields().length === 0) {
      this.filterClick.emit();
    }
  }

  onFilterMenuOpened(): void {
    this.filterMenuOpenCount.update((c) => c + 1);
  }

  onFilterMenuClosed(): void {
    // no-op; openCount is used so builder syncs on next open
  }

  onFilterApply(values: Record<string, unknown>): void {
    this.filterChange.emit(values);
    this.filterMenuTrigger?.closeMenu();
  }

  onFilterClear(): void {
    this.filterChange.emit({});
    this.filterMenuTrigger?.closeMenu();
  }

  onSortClick(): void {
    this.sortClick.emit();
  }

  onSelectionToggleClick(): void {
    this.selectionToggleClick.emit();
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewModeChange.emit(mode);
  }
}
