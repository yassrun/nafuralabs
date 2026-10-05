/**
 * nf-listing-flat — presentation for a flat collection.
 *
 * Toolbar layout (proposal A « chips-first »):
 * - Row 1: active filters as removable chips + « + Filtre » (filter-builder
 *   popup) on the left, search on the right.
 * - Row 2: table controls on the left (selection toggle, columns visibility),
 *   listing actions on the right (size xs — compact 26px buttons).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent } from '../data-table';
import { ColumnTemplateDirective } from '../entity-listing/column-template.directive';
import { PaginationComponent } from '../pagination';
import { ButtonComponent } from '../../atoms/button';
import {
  ActionMenuComponent,
  type ActionMenuNode,
} from '../../molecules/action-menu';
import { FilterBuilderComponent } from '../../molecules/filter-builder';
import { FilterChipsComponent } from '../../molecules/filter-chips';
import {
  ListingActionsComponent,
  type ListingActionItem,
} from '../../molecules/listing-actions';
import type { ListingControlsColumn } from '../../molecules/listing-controls';
import { DataStateComponent } from '../../molecules/data-state';
import { EmptyStateComponent } from '../../molecules/empty-state';
import type {
  ColumnConfig,
  FilterFieldConfig,
  FilterGroup,
  ListingQueryState,
  LookupContext,
} from '../../../types';
import {
  matchesFilterGroup,
  matchesSearch,
  matchesSegment,
} from './listing-query.util';
import {
  clausesToGroup,
  emptyFilterGroup,
  filterGroupToPinnedValues,
  filterValuesToClauses,
  listingQuerySnapshotEqual,
  mergeListingQuery,
  removeLeafAt,
  resolveFilterGroup,
  sortItemsLocally,
  upsertPinnedClause,
  withSyncedFilters,
  collectLeaves,
  columnStateFromControls,
  controlColumnsFromQuery,
  createDefaultListingQuery,
} from './listing-query-state.util';
import {
  LISTING_SAVED_VIEWS_ADAPTER,
  type ListingSavedView,
  type ListingSavedViewsAdapter,
} from './listing-saved-views.adapter';
import type { SortChangeEvent } from '../data-table';
import { CsvService } from '../../services/csv.service';
import {
  DEFAULT_LISTING_FLAT_FEATURES,
  type ListingFlatConfig,
} from './listing-flat.types';

@Component({
  selector: 'nf-listing-flat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatMenuModule,
    LucideAngularModule,
    ButtonComponent,
    ActionMenuComponent,
    FilterBuilderComponent,
    FilterChipsComponent,
    ListingActionsComponent,
    DataTableComponent,
    DataStateComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-listing-flat" [class.nf-listing-flat--split]="layout() === 'split'" [class.nf-listing-flat--bar]="!features().table">
      @if (config().segments?.length) {
        <div class="nf-listing-flat__segments" role="tablist">
          @for (segment of config().segments; track segment.id) {
            <button
              type="button"
              role="tab"
              class="nf-listing-flat__segment"
              [class.nf-listing-flat__segment--active]="activeSegment()?.id === segment.id"
              [attr.aria-selected]="activeSegment()?.id === segment.id"
              (click)="selectSegment(segment.id)"
            >
              {{ segment.label | translate }}
            </button>
          }
        </div>
      }
      <!-- Row 1: Search + Filter Add + Filter Chips (starts left, flows right) -->
      @if (features().search || features().filters || presets().length > 0) {
        <div class="nf-listing-flat__filters">
          <div class="nf-listing-flat__filters-row nf-listing-flat__filters-row--top">
            @if (features().search) {
              <div class="nf-listing-flat__search">
                <lucide-icon name="search" [size]="14" class="nf-listing-flat__search-icon" />
                <input
                  type="text"
                  class="nf-listing-flat__search-input"
                  [placeholder]="'Search' | translate"
                  [value]="search()"
                  (input)="onSearchChange($any($event.target).value)"
                  [attr.aria-label]="'Search' | translate"
                />
              </div>
            }
            @if (presets().length > 0) {
              <div class="nf-listing-flat__presets">
                @for (preset of presets(); track preset.id) {
                  <button
                    type="button"
                    class="nf-listing-flat__preset"
                    [class.nf-listing-flat__preset--active]="presetActive(preset.id)"
                    [attr.aria-pressed]="presetActive(preset.id)"
                    (click)="togglePreset(preset.id)"
                  >
                    {{ preset.label | translate }}
                  </button>
                }
              </div>
            }
            @if (features().filters && pinnedFilters().length > 0) {
              <div class="nf-listing-flat__pinned-filters">
                @for (filter of pinnedFilters(); track filter.key) {
                  <div class="nf-listing-flat__pinned-filter">
                    <label class="nf-listing-flat__pinned-filter-label" [for]="'filter-' + filter.key">
                      {{ filter.label | translate }}
                    </label>
                    @switch (filter.type) {
                      @case ('select') {
                        <select
                          [id]="'filter-' + filter.key"
                          class="nf-listing-flat__pinned-filter-control nf-listing-flat__pinned-filter-control--select"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                        >
                          <option [ngValue]="null">{{ (filter.placeholder ?? 'All') | translate }}</option>
                          @for (opt of filter.options ?? []; track opt.value) {
                            <option [ngValue]="opt.value">{{ opt.label | translate }}</option>
                          }
                        </select>
                      }
                      @case ('text') {
                        <input
                          [id]="'filter-' + filter.key"
                          type="text"
                          class="nf-listing-flat__pinned-filter-control"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                          [placeholder]="(filter.placeholder ?? filter.label) | translate"
                        />
                      }
                      @case ('number') {
                        <input
                          [id]="'filter-' + filter.key"
                          type="number"
                          class="nf-listing-flat__pinned-filter-control"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event != null && $event !== '' ? +$event : null)"
                          [placeholder]="(filter.placeholder ?? filter.label) | translate"
                        />
                      }
                      @case ('date') {
                        <input
                          [id]="'filter-' + filter.key"
                          type="date"
                          class="nf-listing-flat__pinned-filter-control"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                        />
                      }
                      @case ('boolean') {
                        <select
                          [id]="'filter-' + filter.key"
                          class="nf-listing-flat__pinned-filter-control nf-listing-flat__pinned-filter-control--select"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                        >
                          <option [ngValue]="null">{{ (filter.placeholder ?? 'All') | translate }}</option>
                          <option [ngValue]="true">{{ 'Yes' | translate }}</option>
                          <option [ngValue]="false">{{ 'No' | translate }}</option>
                        </select>
                      }
                      @case ('multiselect') {
                        <select
                          [id]="'filter-' + filter.key"
                          class="nf-listing-flat__pinned-filter-control nf-listing-flat__pinned-filter-control--select"
                          multiple
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                        >
                          @for (opt of filter.options ?? []; track opt.value) {
                            <option [ngValue]="opt.value">{{ opt.label | translate }}</option>
                          }
                        </select>
                      }
                      @case ('daterange') {
                        <div class="nf-listing-flat__pinned-range">
                          <input
                            type="date"
                            class="nf-listing-flat__pinned-filter-control"
                            [ngModel]="rangePart(filter.key, 0)"
                            (ngModelChange)="setRangePart(filter.key, 0, $event)"
                          />
                          <span>—</span>
                          <input
                            type="date"
                            class="nf-listing-flat__pinned-filter-control"
                            [ngModel]="rangePart(filter.key, 1)"
                            (ngModelChange)="setRangePart(filter.key, 1, $event)"
                          />
                        </div>
                      }
                      @default {
                        <input
                          [id]="'filter-' + filter.key"
                          type="text"
                          class="nf-listing-flat__pinned-filter-control"
                          [ngModel]="getFilterValue(filter.key)"
                          (ngModelChange)="setFilterValue(filter.key, $event)"
                          [placeholder]="(filter.placeholder ?? filter.label) | translate"
                        />
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>
          <div class="nf-listing-flat__filters-row nf-listing-flat__filters-row--bottom">
            <div class="nf-listing-flat__chips">
              @if (popupFilters().length > 0) {
                <button
                  type="button"
                  class="nf-listing-flat__add-filter"
                  [class.nf-listing-flat__add-filter--active]="filterActive()"
                  [matMenuTriggerFor]="filterMenu"
                  #filterMenuTrigger="matMenuTrigger"
                  (menuOpened)="onFilterMenuOpened()"
                >
                  <lucide-icon name="plus" [size]="12" />
                  {{ 'Filter' | translate }}
                </button>
                <mat-menu
                  #filterMenu="matMenu"
                  class="nf-listing-flat-menu nf-listing-flat-menu--filter"
                  xPosition="after"
                  yPosition="below"
                >
                  <div (click)="$event.stopPropagation()">
                    <nf-filter-builder
                      [filters]="resolvedFilters()"
                      [advanced]="config().filterMode !== 'simple'"
                      [group]="activeFilterGroup()"
                      [openCount]="filterMenuOpenCount()"
                      (apply)="onFilterApply($event)"
                      (clear)="onFilterClear()"
                    />
                  </div>
                </mat-menu>
              }
              <nf-filter-chips
                [fields]="resolvedFilters()"
                [group]="activeFilterGroup()"
                (removeLeaf)="onRemoveFilterLeaf($event)"
              />
            </div>
          </div>
        </div>
      }

      <!-- Row 2: Selection pill + table controls (LEFT) ➔ Action buttons (RIGHT) -->
      <div class="nf-listing-flat__actions-row">
        <!-- Left: Selection indicator + table controls -->
        <div class="nf-listing-flat__actions-left">
          @if (selectionKind() === 'multiple' && selection().length > 0) {
            <span class="nf-listing-flat__selcount">
              {{ selection().length }} {{ 'selected' | translate }}
            </span>
          }
          @if (features().columnToggle || features().selectionToggle || savedViewsEnabled()) {
            <div class="nf-listing-flat__table-controls">
              <ng-container [ngTemplateOutlet]="controlsTpl" />
            </div>
          }
        </div>

        <!-- Right: Action buttons -->
        <div class="nf-listing-flat__actions-right">
          <!--
            Projected extras (Status, Import magique, …) stay in the bar.
            Below the compact container breakpoint they go icon-only — same
            density concept as primary / ⋯, instead of wrapping as a fat label.
          -->
          <div class="nf-listing-flat__projected-actions">
            <ng-content />
          </div>

          @if (hasActions()) {
            @if (isMobile()) {
              <!-- Mobile: primary action icon-only + everything else in ⋯ -->
              @if (primaryAction(); as primary) {
                <nf-button
                  [variant]="primary.variant ?? 'primary'"
                  size="xs"
                  [icon]="primary.icon"
                  [tooltip]="(primary.label ?? primary.id) | translate"
                  [attr.aria-label]="(primary.label ?? primary.id) | translate"
                  (clicked)="handleActionClick(primary.id)"
                />
              }
              @if (mobileMenuNodes().length > 0) {
                <nf-action-menu
                  size="xs"
                  [nodes]="mobileMenuNodes()"
                  (actionClick)="handleActionClick($event)"
                />
              }
            } @else {
              <div class="nf-listing-flat__actions-wide">
                <nf-listing-actions
                  [actions]="resolvedActions()"
                  [selectionActions]="visibleSelectionActions()"
                  size="xs"
                  (actionClick)="handleActionClick($event)"
                />
              </div>
              <div class="nf-listing-flat__actions-compact">
                @if (visibleSelectionActions().length > 0) {
                  <nf-listing-actions
                    [selectionActions]="visibleSelectionActions()"
                    size="xs"
                    (actionClick)="handleActionClick($event)"
                  />
                }
                @if (primaryAction(); as primary) {
                  <nf-button
                    class="nf-listing-flat__compact-primary-label"
                    [variant]="primary.variant ?? 'primary'"
                    size="xs"
                    [icon]="primary.icon"
                    [tooltip]="(primary.label ?? primary.id) | translate"
                    (clicked)="handleActionClick(primary.id)"
                  >
                    {{ (primary.label ?? primary.id) | translate }}
                  </nf-button>
                }
                @if (compactMenuNodes().length > 0) {
                  <nf-action-menu
                    size="xs"
                    [nodes]="compactMenuNodes()"
                    (actionClick)="handleActionClick($event)"
                  />
                }
              </div>
            }
          }
        </div>
      </div>

      @if (features().table) {
      <div class="nf-listing-flat__view">
        @if (error(); as message) {
          <nf-data-state state="error" [errorMessage]="message | translate" (retry)="retry.emit()" />
        } @else if (emptyState(); as empty) {
          <nf-empty-state
            [icon]="empty.icon ?? 'inbox'"
            [title]="empty.title | translate"
            [message]="empty.message ? (empty.message | translate) : undefined"
            [actionLabel]="empty.actionLabel ? (empty.actionLabel | translate) : undefined"
            (action)="actionClick.emit(empty.actionId ?? 'create')"
          />
        } @else {
          <nf-data-table
            [items]="pageItems()"
            [columns]="visibleColumns()"
            [cellTemplates]="resolvedCellTemplates()"
            [activeRowId]="activeRowId()"
            [paginateAfter]="0"
            [rowClickable]="true"
            [selectable]="tableSelectable()"
            [selection]="selection()"
            [sortColumn]="sortColumn()"
            [sortDirection]="sortDirection()"
            [emptyMessage]="narrowed() ? 'No results' : (config().emptyMessage ?? 'No items')"
            [loading]="loading()"
            (selectionChange)="onTableSelectionChange($event)"
            (sortChange)="onSortChange($event)"
            (rowClick)="onRowClick($event)"
            (rowDblClick)="rowDblClick.emit($event)"
          />
        }
      </div>
      }

      <!-- Export Configuration Dialog (Anatomy Modal) -->
      @if (exportDialogOpen()) {
        <div class="nf-export-backdrop" (click)="closeExportDialog()">
          <div class="nf-export-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <div class="nf-export-dialog__header">
              <div class="nf-export-dialog__header-left">
                <div class="nf-export-dialog__icon-wrap">
                  <lucide-icon name="download" [size]="16" />
                </div>
                <div>
                  <h3 class="nf-export-dialog__title">{{ 'Export data' | translate }}</h3>
                  <p class="nf-export-dialog__subtitle">{{ 'Configure the export scope and column selection' | translate }}</p>
                </div>
              </div>
              <button
                type="button"
                class="nf-export-dialog__close"
                (click)="closeExportDialog()"
                [attr.aria-label]="'Close' | translate"
              >
                <lucide-icon name="x" [size]="16" />
              </button>
            </div>

            <div class="nf-export-dialog__body">
              <!-- Scope Selection -->
              <div class="nf-export-dialog__section">
                <span class="nf-export-dialog__section-title">{{ 'Export scope' | translate }}</span>
                <div class="nf-export-dialog__scope-list">
                  <label class="nf-export-dialog__scope-card" [class.nf-export-dialog__scope-card--active]="exportScope() === 'all'">
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      class="nf-export-dialog__radio"
                      [checked]="exportScope() === 'all'"
                      (change)="exportScope.set('all')"
                    />
                    <div class="nf-export-dialog__scope-info">
                      <span class="nf-export-dialog__scope-name">{{ 'All filtered rows' | translate }}</span>
                      <span class="nf-export-dialog__scope-desc">{{ filteredItems().length }} {{ 'records matching active filters' | translate }}</span>
                    </div>
                  </label>

                  <label class="nf-export-dialog__scope-card" [class.nf-export-dialog__scope-card--active]="exportScope() === 'page'">
                    <input
                      type="radio"
                      name="exportScope"
                      value="page"
                      class="nf-export-dialog__radio"
                      [checked]="exportScope() === 'page'"
                      (change)="exportScope.set('page')"
                    />
                    <div class="nf-export-dialog__scope-info">
                      <span class="nf-export-dialog__scope-name">{{ 'Current page only' | translate }}</span>
                      <span class="nf-export-dialog__scope-desc">{{ pageItems().length }} {{ 'records on page' | translate }} {{ page() }}</span>
                    </div>
                  </label>

                  @if (selection().length > 0) {
                    <label class="nf-export-dialog__scope-card" [class.nf-export-dialog__scope-card--active]="exportScope() === 'selection'">
                      <input
                        type="radio"
                        name="exportScope"
                        value="selection"
                        class="nf-export-dialog__radio"
                        [checked]="exportScope() === 'selection'"
                        (change)="exportScope.set('selection')"
                      />
                      <div class="nf-export-dialog__scope-info">
                        <span class="nf-export-dialog__scope-name">{{ 'Selected rows' | translate }}</span>
                        <span class="nf-export-dialog__scope-desc">{{ selection().length }} {{ 'currently selected rows' | translate }}</span>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Columns Selection -->
              <div class="nf-export-dialog__section">
                <div class="nf-export-dialog__section-header">
                  <span class="nf-export-dialog__section-title">
                    {{ 'Columns' | translate }} ({{ selectedExportColumnsCount() }}/{{ exportColumns().length }})
                  </span>
                  <div class="nf-export-dialog__column-actions">
                    <button type="button" class="nf-export-dialog__action-link" (click)="toggleAllExportColumns(true)">
                      {{ 'Select all' | translate }}
                    </button>
                    <span class="nf-export-dialog__sep">·</span>
                    <button type="button" class="nf-export-dialog__action-link" (click)="toggleAllExportColumns(false)">
                      {{ 'Deselect all' | translate }}
                    </button>
                  </div>
                </div>

                <div class="nf-export-dialog__columns-grid">
                  @for (col of exportColumns(); track col.key) {
                    <label class="nf-export-dialog__column-item">
                      <input
                        type="checkbox"
                        class="nf-columns-menu__checkbox"
                        [checked]="col.selected"
                        (change)="toggleExportColumn(col.key, $any($event.target).checked)"
                      />
                      <span class="nf-export-dialog__column-label">{{ col.label | translate }}</span>
                    </label>
                  }
                </div>
              </div>

              <!-- Format note -->
              <div class="nf-export-dialog__format-note">
                <lucide-icon name="file-spreadsheet" [size]="14" />
                <span>{{ 'Format: CSV (UTF-8 with BOM, compatible with Excel, Google Sheets and Calc)' | translate }}</span>
              </div>
            </div>

            <div class="nf-export-dialog__footer">
              <span class="nf-export-dialog__footer-count">
                {{ exportTargetCount() }} {{ 'rows to be exported' | translate }}
              </span>
              <div class="nf-export-dialog__footer-btns">
                <nf-button variant="secondary" size="xs" (clicked)="closeExportDialog()">
                  {{ 'Cancel' | translate }}
                </nf-button>
                <nf-button
                  variant="primary"
                  size="xs"
                  iconLibrary="lucide"
                  icon="download"
                  [disabled]="selectedExportColumnsCount() === 0 || exportTargetCount() === 0"
                  (clicked)="confirmExport()"
                >
                  {{ 'Download CSV' | translate }}
                </nf-button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (features().table && features().pagination && pagerTotal() > 0) {
        <div class="nf-listing-flat__pager">
          <nf-pagination
            [total]="pagerTotal()"
            [page]="page()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="pageSizeOptions()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }

      <!-- Table controls: columns visibility and multi-selection -->
      <ng-template #controlsTpl>
        <div class="nf-listing-flat__controls">
          @if (features().selectionToggle) {
            <nf-button
              variant="secondary"
              size="xs"
              iconLibrary="lucide"
              [icon]="toggleSelectionOn() ? 'x' : 'list-checks'"
              [active]="toggleSelectionOn()"
              [tooltip]="(toggleSelectionOn() ? 'Cancel selection' : 'Select rows') | translate"
              [attr.aria-label]="
                (toggleSelectionOn() ? 'Cancel selection' : 'Select rows') | translate
              "
              (clicked)="toggleSelectionMode()"
            />
          }
          @if (savedViewsEnabled()) {
            <nf-button
              variant="secondary"
              size="xs"
              iconLibrary="lucide"
              icon="bookmark"
              [active]="viewDirty()"
              [matMenuTriggerFor]="viewsMenu"
              [tooltip]="'Saved views' | translate"
              [attr.aria-label]="'Saved views' | translate"
            >
              {{ 'Views' | translate }}
              @if (viewDirty()) {
                <span class="nf-listing-flat__dirty-dot" aria-hidden="true">•</span>
              }
            </nf-button>
            <mat-menu #viewsMenu="matMenu" class="nf-listing-flat-menu nf-listing-flat-menu--views">
              <div class="nf-views-menu" (click)="$event.stopPropagation()">
                @if (savedViews().length === 0) {
                  <p class="nf-views-menu__empty">{{ 'No saved views yet' | translate }}</p>
                }
                @for (view of savedViews(); track view.id) {
                  <button type="button" class="nf-views-menu__item" (click)="applySavedView(view)">
                    <span>{{ view.name }}</span>
                    @if (view.isDefault) {
                      <span class="nf-views-menu__badge">{{ 'Default' | translate }}</span>
                    }
                    @if (activeSavedViewId() === view.id) {
                      <span class="nf-views-menu__active">{{ 'Active' | translate }}</span>
                    }
                  </button>
                }
                <div class="nf-views-menu__actions">
                  <button type="button" class="nf-views-menu__action" (click)="promptSaveView(false)">
                    {{ 'Save current' | translate }}
                  </button>
                  @if (activeSavedViewId()) {
                    <button type="button" class="nf-views-menu__action" (click)="promptSaveView(true)">
                      {{ 'Update view' | translate }}
                    </button>
                    <button type="button" class="nf-views-menu__action nf-views-menu__action--danger" (click)="deleteActiveView()">
                      {{ 'Delete view' | translate }}
                    </button>
                  }
                </div>
              </div>
            </mat-menu>
          }
          @if (features().columnToggle) {
            <nf-button
              variant="secondary"
              size="xs"
              iconLibrary="lucide"
              [icon]="hiddenCount() > 0 ? 'eye-off' : 'columns'"
              [active]="hiddenCount() > 0"
              [matMenuTriggerFor]="columnsMenu"
              [tooltip]="'Customize columns' | translate"
              [attr.aria-label]="'Customize columns' | translate"
            >{{ 'Columns' | translate }}</nf-button>
            <mat-menu
              #columnsMenu="matMenu"
              class="nf-listing-flat-menu nf-listing-flat-menu--columns"
              xPosition="before"
              yPosition="below"
            >
              <div class="nf-columns-menu" (click)="$event.stopPropagation()">
                <div class="nf-columns-menu__header">
                  <span class="nf-columns-menu__title">{{ 'Columns' | translate }}</span>
                  <div class="nf-columns-menu__actions">
                    <button
                      type="button"
                      class="nf-columns-menu__action-btn"
                      (click)="showAllColumns()"
                    >
                      {{ 'Show all' | translate }}
                    </button>
                    <span class="nf-columns-menu__sep">·</span>
                    <button
                      type="button"
                      class="nf-columns-menu__action-btn"
                      (click)="resetDefaultColumns()"
                    >
                      {{ 'Reset' | translate }}
                    </button>
                  </div>
                </div>
                <div class="nf-columns-menu__list">
                  @for (col of controlColumns(); track col.key) {
                    <label class="nf-columns-menu__item">
                      <input
                        type="checkbox"
                        class="nf-columns-menu__checkbox"
                        [checked]="col.visible"
                        (change)="setColumnVisibility(col.key, $any($event.target).checked)"
                      />
                      <span class="nf-columns-menu__label">{{ col.label | translate }}</span>
                    </label>
                  }
                </div>
              </div>
            </mat-menu>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        /* Host is the query container so \`.nf-listing-flat\` itself can respond too. */
        container-type: inline-size;
      }
      .nf-listing-flat {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        gap: 8px;
      }
      /* Toolbar only (table: false): its own height; the host draws the rows below. */
      :host:has(.nf-listing-flat--bar),
      .nf-listing-flat--bar {
        height: auto;
        flex: 0 0 auto;
      }

      /* ── Ready-made filters (presets) ─────────────────────────────────────── */
      .nf-listing-flat__presets {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .nf-listing-flat__preset {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-card, #fff);
        color: var(--nf-text-secondary, #4b5563);
        border-radius: 999px;
        padding: 3px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .nf-listing-flat__preset:hover {
        border-color: var(--nf-color-primary-300, #a5b4fc);
      }
      .nf-listing-flat__preset--active {
        background: var(--nf-color-primary-50, #eef2ff);
        border-color: var(--nf-color-primary-500, #6366f1);
        color: var(--nf-color-primary-700, #4338ca);
      }

      /* ── Quick views (segments) ───────────────────────────────────────────── */
      .nf-listing-flat__segments {
        display: flex;
        gap: 2px;
        flex: 0 0 auto;
        overflow-x: auto;
        scrollbar-width: none;
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .nf-listing-flat__segment {
        flex: 0 0 auto;
        margin-bottom: -1px;
        padding: 6px 10px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: none;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        white-space: nowrap;
        color: var(--nf-text-secondary, #4b5563);
        cursor: pointer;
      }
      .nf-listing-flat__segment:hover {
        color: var(--nf-text-primary, #111827);
      }
      .nf-listing-flat__segment:focus-visible {
        outline: 2px solid var(--nf-primary, #2563eb);
        outline-offset: -2px;
        border-radius: 4px;
      }
      .nf-listing-flat__segment--active {
        font-weight: 600;
        color: var(--nf-primary, #2563eb);
        border-bottom-color: var(--nf-primary, #2563eb);
      }

      /* ── Row 1: Search + Filter Chips ───────────────────────────────── */
      .nf-listing-flat__filters {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        flex: 0 0 auto;
      }
      .nf-listing-flat__filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0;
      }
      .nf-listing-flat__filters-row--top {
        align-items: flex-end;
      }
      .nf-listing-flat__filters-row--bottom {
        align-items: center;
      }
      .nf-listing-flat__search {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 26px;
        padding: 0 9px;
        border-radius: 6px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-section, #fff);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
        flex: 0 1 220px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .nf-listing-flat__search:focus-within {
        border-color: var(--nf-primary, #2563eb);
        box-shadow: 0 0 0 2px var(--nf-primary-light, #eff6ff);
      }
      .nf-listing-flat__chips {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        flex: 1 1 auto;
        flex-wrap: wrap;
      }
      .nf-listing-flat__add-filter {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 26px;
        padding: 0 9px;
        border-radius: 6px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-section, #fff);
        color: var(--nf-text-secondary, #4b5563);
        font-size: 0.75rem;
        font-weight: 500;
        font-family: inherit;
        white-space: nowrap;
        cursor: pointer;
        flex: 0 0 auto;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
        transition: all 0.1s ease;
      }
      .nf-listing-flat__add-filter:hover {
        background: var(--nf-surface-hover, #f9fafb);
        border-color: var(--nf-color-gray-300, #d1d5db);
        color: var(--nf-text-primary, #111827);
      }
      .nf-listing-flat__add-filter--active {
        background: var(--nf-primary-light, #eff6ff);
        border-color: var(--nf-primary, #2563eb);
        color: var(--nf-primary, #2563eb);
      }
      .nf-listing-flat__controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* ── Selection count pill ────────────────────────── */
      .nf-listing-flat__selcount {
        display: inline-flex;
        align-items: center;
        height: 26px;
        padding: 0 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        color: var(--nf-primary, #2563eb);
        border: 1px solid var(--nf-primary-200, #bfdbfe);
        background: var(--nf-primary-light, #eff6ff);
      }
      .nf-listing-flat__search-icon {
        display: inline-flex;
        color: var(--nf-text-muted, #9ca3af);
        flex-shrink: 0;
      }
      .nf-listing-flat__search-input {
        flex: 1;
        min-width: 60px;
        padding: 0;
        font-size: 0.75rem;
        font-family: inherit;
        color: var(--nf-text-primary, #111827);
        background: none;
        border: none;
        outline: none;
      }
      .nf-listing-flat__search-input::placeholder {
        color: var(--nf-input-placeholder-color, var(--nf-text-muted, #9ca3af));
      }

      .nf-listing-flat__pinned-filters {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 8px;
        min-width: 0;
        flex: 1 1 auto;
      }

      .nf-listing-flat__pinned-filter {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 160px;
        flex: 0 1 200px;
      }

      .nf-listing-flat__pinned-filter-label {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--nf-text-muted, #6b7280);
        line-height: 1.1;
      }

      .nf-listing-flat__pinned-filter-control {
        width: 100%;
        height: 26px;
        padding: 0 8px;
        border-radius: 6px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-section, #fff);
        font: inherit;
        font-size: 0.75rem;
        color: var(--nf-text-primary, #111827);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
        box-sizing: border-box;
      }

      .nf-listing-flat__pinned-filter-control--select {
        appearance: none;
        padding-right: 24px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-position: right 8px center;
        background-repeat: no-repeat;
      }

      .nf-listing-flat__pinned-range {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .nf-listing-flat__pinned-range span {
        font-size: 0.6875rem;
        color: var(--nf-text-muted, #6b7280);
      }

      .nf-listing-flat__dirty-dot {
        color: var(--nf-warning, #d97706);
        margin-left: 2px;
      }

      .nf-views-menu {
        min-width: 220px;
        padding: 8px;
      }
      .nf-views-menu__empty {
        margin: 0 0 8px;
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-views-menu__item {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        border: none;
        background: transparent;
        padding: 6px 8px;
        border-radius: 6px;
        font: inherit;
        font-size: 0.8125rem;
        text-align: left;
        cursor: pointer;
      }
      .nf-views-menu__item:hover {
        background: var(--nf-surface-hover, #f9fafb);
      }
      .nf-views-menu__badge,
      .nf-views-menu__active {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--nf-primary, #2563eb);
      }
      .nf-views-menu__actions {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .nf-views-menu__action {
        border: none;
        background: transparent;
        padding: 4px 8px;
        font: inherit;
        font-size: 0.75rem;
        text-align: left;
        color: var(--nf-primary, #2563eb);
        cursor: pointer;
        border-radius: 4px;
      }
      .nf-views-menu__action:hover {
        background: var(--nf-primary-light, #eff6ff);
      }
      .nf-views-menu__action--danger {
        color: var(--nf-danger, #dc2626);
      }

      /* ── Row 2: actions row (Left: Selection Info · Right: Controls & Actions) ── */
      .nf-listing-flat__actions-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 0 0 auto;
      }
      /* Left side: selection count pill + table controls */
      .nf-listing-flat__actions-left {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 26px;
      }
      /* Right side: action buttons */
      .nf-listing-flat__actions-right {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        min-width: 0;
      }
      .nf-listing-flat__projected-actions {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
        min-width: 0;
      }
      .nf-listing-flat__projected-actions:empty {
        display: none;
      }
      .nf-listing-flat__actions-wide,
      .nf-listing-flat__actions-compact {
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
      }
      .nf-listing-flat__actions-wide {
        display: flex;
      }
      .nf-listing-flat__actions-compact {
        display: none;
      }
      .nf-listing-flat__actions-compact > * {
        flex: 0 0 auto;
      }
      @container (max-width: 1000px) {
        .nf-listing-flat__actions-wide {
          display: none;
        }
        .nf-listing-flat__actions-compact {
          display: flex;
        }
        /*
          Same compact concept as primary→icon / secondary→⋯ :
          projected triggers (Import magique, Status, …) drop their labels.
        */
        .nf-listing-flat__projected-actions ::ng-deep .nf-button__content {
          display: none !important;
        }
        .nf-listing-flat__projected-actions ::ng-deep button {
          width: 26px;
          min-width: 26px;
          padding-inline: 0;
        }
      }
      @container (max-width: 700px) {
        .nf-listing-flat__compact-primary-label ::ng-deep .nf-button__content {
          display: none;
        }
        .nf-listing-flat__compact-primary-label ::ng-deep button {
          width: 26px;
          min-width: 26px;
          padding-inline: 0;
        }
      }
      .nf-listing-flat__table-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .nf-listing-flat__view {
        /* Hug content: pager sits right under the table; shrinks + scrolls when space is tight. */
        flex: 0 1 auto;
        min-height: 0;
        overflow: auto;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-md, 8px);
        background: var(--nf-surface-section, #fff);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      }
      .nf-listing-flat__pager {
        flex: 0 0 auto;
      }

      /* ── Columns Menu (Anatomy custom styling) ──────────────────── */
      .nf-columns-menu {
        min-width: 190px;
        max-width: 260px;
      }
      .nf-columns-menu__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-section, #ffffff);
      }
      .nf-columns-menu__title {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-columns-menu__actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .nf-columns-menu__action-btn {
        background: none;
        border: none;
        padding: 1px 4px;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--nf-primary, #2563eb);
        cursor: pointer;
        border-radius: 3px;
        line-height: 1.2;
        transition: background 0.1s ease;

        &:hover {
          background: var(--nf-primary-light, #eff6ff);
        }
      }
      .nf-columns-menu__sep {
        color: var(--nf-border-default, #d1d5db);
        font-size: 0.6875rem;
      }
      .nf-columns-menu__list {
        padding: 4px;
        max-height: 280px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .nf-columns-menu__item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 5px;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.1s ease;

        &:hover {
          background-color: var(--nf-surface-hover, #f9fafb);
        }
      }
      .nf-columns-menu__checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 15px;
        height: 15px;
        margin: 0;
        border: 1.5px solid var(--nf-border-default, #d1d5db);
        border-radius: 4px;
        background-color: var(--nf-surface-section, #ffffff);
        cursor: pointer;
        display: inline-grid;
        place-content: center;
        transition: all 0.12s ease-in-out;
        flex-shrink: 0;

        &:hover {
          border-color: var(--nf-primary, #2563eb);
        }

        &:checked {
          background-color: var(--nf-primary, #2563eb);
          border-color: var(--nf-primary, #2563eb);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.2 4.8L6.5 10.5L3.8 7.8' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: 11px 11px;
          background-position: center;
          background-repeat: no-repeat;
        }

        &:focus-visible {
          outline: 2px solid var(--nf-primary, #2563eb);
          outline-offset: 1px;
        }
      }
      .nf-columns-menu__label {
        font-size: 0.8125rem;
        color: var(--nf-text-primary, #111827);
        font-weight: 400;
        line-height: 1.2;
      }

      /* Overlay panels live outside :host — pierce so sizing rules apply */
      :host ::ng-deep {
        .mat-mdc-menu-panel.nf-listing-flat-menu--columns,
        .mat-mdc-menu-panel.nf-listing-flat-menu--filter {
          background: var(--nf-surface-section, #fff);
          border: 1px solid var(--nf-border-default, #e5e7eb);
          border-radius: var(--nf-radius-md, 8px);
          box-shadow: var(--nf-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.12));
        }
        .mat-mdc-menu-panel.nf-listing-flat-menu--columns {
          min-width: 190px !important;
          max-width: 260px !important;

          .mat-mdc-menu-content {
            padding: 0 !important;
          }
        }
        .mat-mdc-menu-panel.nf-listing-flat-menu--filter {
          /* Beat Material's default ~280px max-width so daterange fits. */
          width: max-content !important;
          min-width: 320px !important;
          max-width: min(560px, calc(100vw - 24px)) !important;
          height: auto !important;
          max-height: min(80vh, 640px) !important;
          overflow-x: visible !important;
          overflow-y: auto !important;

          .mat-mdc-menu-content {
            padding: 0 !important;
            overflow: visible !important;
          }
        }
      }

      /* ── Export Modal Dialog ────────────────────────────────────────── */
      .nf-export-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
        animation: nfFadeIn 0.15s ease-out;
      }
      .nf-export-dialog {
        background: var(--nf-surface-section, #ffffff);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-lg, 12px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: nfSlideUp 0.15s ease-out;
      }
      .nf-export-dialog__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .nf-export-dialog__header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .nf-export-dialog__icon-wrap {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--nf-primary-light, #eff6ff);
        color: var(--nf-primary, #2563eb);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .nf-export-dialog__title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--nf-text-primary, #111827);
      }
      .nf-export-dialog__subtitle {
        margin: 2px 0 0;
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-export-dialog__close {
        background: none;
        border: none;
        padding: 4px;
        border-radius: 6px;
        color: var(--nf-text-muted, #6b7280);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.12s ease;

        &:hover {
          background: var(--nf-surface-hover, #f3f4f6);
          color: var(--nf-text-primary, #111827);
        }
      }
      .nf-export-dialog__body {
        padding: 16px 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .nf-export-dialog__section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .nf-export-dialog__section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .nf-export-dialog__section-title {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-export-dialog__column-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .nf-export-dialog__action-link {
        background: none;
        border: none;
        padding: 0;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--nf-primary, #2563eb);
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
      .nf-export-dialog__sep {
        color: var(--nf-border-default, #d1d5db);
        font-size: 0.6875rem;
      }
      .nf-export-dialog__scope-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .nf-export-dialog__scope-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.12s ease;

        &:hover {
          background: var(--nf-surface-hover, #f9fafb);
          border-color: var(--nf-color-gray-300, #d1d5db);
        }

        &--active {
          border-color: var(--nf-primary, #2563eb);
          background: var(--nf-primary-light, #eff6ff);
        }
      }
      .nf-export-dialog__radio {
        appearance: none;
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        margin: 0;
        border: 1.5px solid var(--nf-border-default, #d1d5db);
        border-radius: 50%;
        cursor: pointer;
        display: grid;
        place-content: center;
        flex-shrink: 0;

        &:checked {
          border-color: var(--nf-primary, #2563eb);

          &::before {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--nf-primary, #2563eb);
          }
        }
      }
      .nf-export-dialog__scope-info {
        display: flex;
        flex-direction: column;
      }
      .nf-export-dialog__scope-name {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--nf-text-primary, #111827);
      }
      .nf-export-dialog__scope-desc {
        font-size: 0.6875rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-export-dialog__columns-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        max-height: 160px;
        overflow-y: auto;
        padding: 4px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        background: var(--nf-surface-hover, #f9fafb);
      }
      .nf-export-dialog__column-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        border-radius: 6px;
        background: var(--nf-surface-section, #ffffff);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        cursor: pointer;
        user-select: none;
        transition: border-color 0.12s ease;

        &:hover {
          border-color: var(--nf-primary, #2563eb);
        }
      }
      .nf-export-dialog__column-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--nf-text-primary, #111827);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .nf-export-dialog__format-note {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f8fafc;
        border-radius: 6px;
        font-size: 0.6875rem;
        color: var(--nf-text-secondary, #475569);
      }
      .nf-export-dialog__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-surface-section, #ffffff);
      }
      .nf-export-dialog__footer-count {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-export-dialog__footer-btns {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      @keyframes nfFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes nfSlideUp {
        from { transform: translateY(10px) scale(0.98); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }

      /* ── Narrow container (≤720px): stacked search + tidy filter grid ── */
      @container (max-width: 720px) {
        .nf-listing-flat__filters-row--top {
          flex-direction: column;
          /* nowrap is required: column+wrap breaks the grid's intrinsic height. */
          flex-wrap: nowrap;
          align-items: stretch;
        }
        .nf-listing-flat__search {
          flex: 1 1 auto;
        }
        .nf-listing-flat__pinned-filters {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          align-items: end;
          align-content: start;
          flex: none;
          gap: 8px;
        }
        .nf-listing-flat__pinned-filter {
          min-width: 0;
          flex: none;
        }
      }

      /* ── Compact container (≤600px): dense toolbar, scrolling chips & actions ── */
      @container (max-width: 600px) {
        .nf-listing-flat {
          gap: 6px;
        }
        .nf-listing-flat__chips {
          flex-wrap: nowrap;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .nf-listing-flat__chips::-webkit-scrollbar {
          display: none;
        }
        .nf-listing-flat__actions-row {
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 2px 0;
        }
        .nf-listing-flat__actions-row::-webkit-scrollbar {
          display: none;
        }
        .nf-listing-flat__actions-left,
        .nf-listing-flat__actions-right,
        .nf-listing-flat__actions-right > * {
          flex: 0 0 auto;
        }
        .nf-listing-flat__projected-actions ::ng-deep .nf-button__content {
          display: none !important;
        }
        .nf-listing-flat__projected-actions ::ng-deep button {
          width: 26px;
          min-width: 26px;
          padding-inline: 0;
        }

        /* Split layout: sticky bottom action bar (thumb zone) */
        .nf-listing-flat--split .nf-listing-flat__actions-row {
          order: 10;
          position: sticky;
          bottom: 0;
          z-index: 10;
          padding: 8px 10px;
          background: var(--nf-surface-section, #fff);
          border-top: 1px solid var(--nf-border-default, #e5e7eb);
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
        }
      }

      /* Overlay panels are viewport-positioned → media query stays correct here. */
      @media (max-width: 640px) {
        :host ::ng-deep .mat-mdc-menu-panel.nf-listing-flat-menu--filter {
          width: calc(100vw - 24px) !important;
          min-width: 0 !important;
          max-width: calc(100vw - 24px) !important;
        }
      }

      /* Export dialog on small viewports: bottom-sheet presentation. */
      @media (max-width: 520px) {
        .nf-export-backdrop {
          padding: 0;
          align-items: flex-end;
        }
        .nf-export-dialog {
          max-width: none;
          max-height: 92dvh;
          border-radius: var(--nf-radius-lg, 12px) var(--nf-radius-lg, 12px) 0 0;
          border-bottom: none;
        }
        .nf-export-dialog__columns-grid {
          grid-template-columns: 1fr;
        }
        .nf-export-dialog__footer {
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    `,
  ],
})
export class ListingFlatComponent<T = unknown> {
  private readonly csvService = inject(CsvService);

  readonly config = input.required<ListingFlatConfig>();
  readonly items = input<T[]>([]);
  readonly loading = input<boolean>(false);
  /** Controlled listing query (URL / parent / saved view). */
  readonly query = input<ListingQueryState | undefined>();
  /** When true, items are already filtered/paged server-side — skip client refilter. */
  readonly remote = input<boolean>(false);
  readonly remoteTotal = input<number | undefined>(undefined);
  readonly resourceKey = input<string | undefined>();
  /** Options of filters declared with `lookupKey`. */
  readonly lookups = input<LookupContext>({});
  /** Custom cells by column key (`<ng-template nfColumn="key" let-value let-item="item">`). */
  readonly cellTemplates = input<Record<string, TemplateRef<unknown>>>({});
  private readonly projectedCells = contentChildren(ColumnTemplateDirective);
  readonly resolvedCellTemplates = computed(() => ({
    ...Object.fromEntries(this.projectedCells().map((cell) => [cell.nfColumn, cell.templateRef])),
    ...this.cellTemplates(),
  }));
  /** Row highlighted as open (master–detail). */
  readonly activeRowId = input<string | null>(null);
  /** Load failure: replaces the table with a retry state. */
  readonly error = input<string | null>(null);

  readonly queryChange = output<ListingQueryState>();
  readonly load = output<ListingQueryState>();
  readonly retry = output<void>();

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<string>();
  readonly selectionChange = output<T[]>();
  readonly exportClick = output<void>();

  private readonly savedViewsAdapter = inject(LISTING_SAVED_VIEWS_ADAPTER, { optional: true });

  private readonly listingQuery = signal<ListingQueryState>(createDefaultListingQuery());
  private readonly suppressQueryEmit = signal(false);

  readonly toggleSelectionOn = signal(false);
  readonly selection = signal<T[]>([]);
  readonly controlColumns = signal<ListingControlsColumn[]>([]);
  readonly filterMenuOpenCount = signal(0);
  readonly savedViews = signal<ListingSavedView[]>([]);
  readonly activeSavedViewId = signal<string | null>(null);
  readonly activeSavedViewQuery = signal<ListingQueryState | null>(null);

  readonly search = computed(() => this.listingQuery().search ?? '');
  readonly activeFilterGroup = computed(() => resolveFilterGroup(this.listingQuery()));
  readonly filterValues = computed(() => filterGroupToPinnedValues(this.activeFilterGroup()));
  readonly page = computed(() => this.listingQuery().page);
  readonly pageSize = computed(() => this.listingQuery().pageSize);
  readonly sortColumn = computed(() => this.listingQuery().sort?.field);
  readonly sortDirection = computed(() => this.listingQuery().sort?.direction);

  @ViewChild('filterMenuTrigger') private filterMenuTrigger?: MatMenuTrigger;

  readonly features = computed(() => ({
    ...DEFAULT_LISTING_FLAT_FEATURES,
    ...this.config().features,
  }));

  /** Toolbar layout: 'chips' (A, default) or 'split' (C). */
  readonly layout = computed(() => this.config().toolbarLayout ?? 'chips');

  readonly selectionKind = computed(() => this.features().selection);

  /** Lookup options resolved; « All » placeholders dropped (the listing offers its own). */
  readonly resolvedFilters = computed((): FilterFieldConfig[] => {
    const lookups = this.lookups();
    return (this.config().filters ?? []).map((f) => {
      const options =
        f.options ??
        (f.lookupKey ? (lookups[f.lookupKey] ?? []).map((l) => ({ value: l.key, label: l.value })) : undefined);
      return options ? { ...f, options: options.filter((o) => o.value !== '' && o.value != null) } : f;
    });
  });
  readonly pinnedFilters = computed(() => this.resolvedFilters().filter((f) => f.pinned === true));
  readonly popupFilters = computed(() => this.resolvedFilters().filter((f) => !f.pinned));

  readonly emptyState = computed(() => {
    const empty = this.config().emptyState;
    if (!empty || this.loading() || this.items().length > 0) return null;
    return this.narrowed() ? null : empty;
  });

  /** Search, filters or a filtering segment hide part of the rows. */
  readonly narrowed = computed(
    () =>
      !!this.search() ||
      this.filterActive() ||
      (this.listingQuery().presets?.length ?? 0) > 0 ||
      Object.keys(this.activeSegment()?.filters ?? {}).length > 0
  );

  readonly tableSelectable = computed((): false | 'single' | 'multiple' => {
    const sel = this.selectionKind();
    if (sel === 'none') return false;
    if (this.features().selectionToggle) return this.toggleSelectionOn() ? 'multiple' : 'single';
    return sel;
  });

  readonly savedViewsEnabled = computed(
    () => !!this.resourceKey() && this.config().savedViews !== false && !!this.savedViewsAdapter
  );

  readonly viewDirty = computed(() => {
    const baseline = this.activeSavedViewQuery();
    if (!baseline) return false;
    return !listingQuerySnapshotEqual(this.listingQuery(), baseline, { ignorePage: true });
  });

  constructor() {
    // Container-driven (not viewport-driven): the listing adapts to the pane
    // it lives in (split layouts, drawers, dashboards), like the CSS container queries.
    if (typeof ResizeObserver !== 'undefined') {
      const zone = inject(NgZone);
      const host = inject(ElementRef).nativeElement as HTMLElement;
      const observer = new ResizeObserver((entries) => {
        const width = entries.at(-1)?.contentRect.width ?? 0;
        const mobile = width > 0 && width < 600;
        if (mobile !== this.isMobile()) {
          zone.run(() => this.isMobile.set(mobile));
        }
      });
      observer.observe(host);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }

    effect(() => {
      const cols = this.config().columns;
      const fromQuery = controlColumnsFromQuery(
        cols,
        this.listingQuery().columns,
        this.config().defaultVisibleColumns
      );
      this.controlColumns.set(fromQuery);
    });

    effect(() => {
      const external = this.query();
      if (external) {
        this.suppressQueryEmit.set(true);
        this.listingQuery.set(external);
        this.controlColumns.set(
          controlColumnsFromQuery(
            this.config().columns,
            external.columns,
            this.config().defaultVisibleColumns
          )
        );
        this.suppressQueryEmit.set(false);
      }
    });

    effect(() => {
      if (this.query()) return;
      const init = this.config().initialFilters;
      const key = JSON.stringify(init ?? null);
      if (key === this.lastInitialFilters) return;
      this.lastInitialFilters = key;
      if (!init || Object.keys(init).length === 0) return;
      const fields = this.config().filters ?? [];
      const clauses = filterValuesToClauses(init, fields);
      this.patchQuery(
        {
          filterGroup: clausesToGroup(clauses),
          filters: clauses,
          page: 1,
        },
        false
      );
    });

    // Only a config change resets the page size; the user's pick stays.
    effect(() => {
      const size = this.config().pageSize ?? 20;
      untracked(() => {
        if (this.listingQuery().pageSize !== size) {
          this.patchQuery({ pageSize: size, page: 1 });
        }
      });
    });

    effect(() => {
      const selection = this.selectionKind();
      const selectionToggleDefaultActive = this.features().selectionToggleDefaultActive ?? false;
      this.toggleSelectionOn.set(selection !== 'none' && selectionToggleDefaultActive);
      this.setSelection([]);
    });

    // New data (reload, delete): the selection keeps only rows still listed.
    effect(() => {
      const items = this.items();
      const selected = untracked(this.selection);
      if (selected.length && selected.some((item) => !items.includes(item))) {
        untracked(() => this.setSelection(selected.filter((item) => items.includes(item))));
      }
    });

    effect(() => {
      const key = this.resourceKey();
      if (!key || !this.savedViewsAdapter) {
        this.savedViews.set([]);
        return;
      }
      void this.refreshSavedViews(key);
    });
  }

  private async refreshSavedViews(resourceKey: string): Promise<void> {
    const adapter = this.savedViewsAdapter;
    if (!adapter) return;
    const views = await adapter.list(resourceKey);
    this.savedViews.set(views);
    const defaultView = views.find((v) => v.isDefault);
    if (defaultView && !this.activeSavedViewId() && !this.query()) {
      this.applySavedView(defaultView, false);
    }
  }

  private emitQueryChange(): void {
    if (this.suppressQueryEmit()) return;
    const q = this.listingQuery();
    this.queryChange.emit(q);
    if (this.remote()) {
      this.load.emit(q);
    }
  }

  private patchQuery(patch: Partial<ListingQueryState>, resetPage = false): void {
    this.listingQuery.update((current) => {
      const next = mergeListingQuery(current, patch);
      if (resetPage) next.page = 1;
      return next;
    });
    this.emitQueryChange();
  }

  /**
   * Replace the full filter group (Notion builder Apply / Clear / chip remove).
   */
  private replaceFilterGroup(group: FilterGroup, resetPage = true): void {
    this.patchQuery(withSyncedFilters({ ...this.listingQuery(), filterGroup: group }), resetPage);
  }

  /** @deprecated initialFilters — kept via effect; use query input instead. */
  private lastInitialFilters = '';

  readonly pageSizeOptions = computed(
    () => this.config().pageSizeOptions ?? [10, 20, 50, 100]
  );

  readonly filterActive = computed(() => collectLeaves(this.activeFilterGroup()).length > 0);

  readonly activeSegment = computed(() => {
    const segments = this.config().segments ?? [];
    const id = this.listingQuery().segment ?? this.config().defaultSegment;
    return segments.find((s) => s.id === id) ?? segments[0];
  });

  selectSegment(id: string): void {
    this.patchQuery({ segment: id }, true);
  }

  readonly presets = computed(() => this.config().presets ?? []);

  presetActive(id: string): boolean {
    return this.listingQuery().presets?.includes(id) ?? false;
  }

  togglePreset(id: string): void {
    const active = this.listingQuery().presets ?? [];
    this.patchQuery({ presets: active.includes(id) ? active.filter((item) => item !== id) : [...active, id] }, true);
  }
  readonly hiddenCount = computed(
    () => this.controlColumns().filter((c) => !c.visible).length
  );
  readonly resolvedActions = computed((): ListingActionItem[] => {
    const configured = this.config().actions ?? [];
    if (!this.features().export) {
      return configured;
    }
    // If feature export is true and not already explicitly added, auto-insert Export action
    const hasExport = configured.some((a) => a.id === 'export');
    if (hasExport) {
      return configured;
    }
    const exportItem: ListingActionItem = {
      id: 'export',
      label: 'Export',
      variant: 'secondary',
      icon: 'download',
    };
    // Place Export before primary (e.g. New) if present, or at the end
    const primaryIdx = configured.findIndex((a) => a.variant === 'primary');
    if (primaryIdx >= 0) {
      return [
        ...configured.slice(0, primaryIdx),
        exportItem,
        ...configured.slice(primaryIdx),
      ];
    }
    return [...configured, exportItem];
  });

  readonly hasActions = computed(() => {
    const actions = this.resolvedActions();
    return (
      actions.some((a) => a.visible !== false) ||
      this.visibleSelectionActions().length > 0 ||
      this.config().projectedActions === true
    );
  });

  /** Selection-scoped actions: shown when selection count matches the action scope. */
  readonly visibleSelectionActions = computed(() => {
    const count = this.selection().length;
    if (count === 0) return [];
    const selection = this.selection();
    return (this.config().selectionActions ?? []).filter((a) => {
      if (a.visible === false) return false;
      if (a.when && !selection.every((item) => a.when!(item))) return false;
      if (a.visibleFor && !a.visibleFor(selection)) return false;
      const scope = a.scope ?? 'single+bulk';
      const min =
        scope === 'single' ? 1 : scope === 'bulk' ? (a.minSelection ?? 2) : (a.minSelection ?? 1);
      const max = scope === 'single' ? 1 : a.maxSelection;
      if (count < min) return false;
      if (max != null && count > max) return false;
      return true;
    }).map((a) => (a.disabledFor?.(selection) ? { ...a, disabled: true } : a));
  });

  /** True when the host container is below 600px — toolbar condenses to primary action + ⋯ overflow. */
  readonly isMobile = signal(false);

  /** First visible primary action — stays a button on mobile. */
  readonly primaryAction = computed(() =>
    this.resolvedActions().find(
      (a) => a.visible !== false && a.variant === 'primary'
    )
  );

  /** Mobile ⋯ menu: selection actions first, then non-primary bar actions. */
  readonly mobileMenuNodes = computed((): ActionMenuNode[] => {
    const primary = this.primaryAction();
    const bar = this.resolvedActions().filter(
      (a) => a.visible !== false && a !== primary
    );
    const nodes: ActionMenuNode[] = [];
    for (const a of this.visibleSelectionActions()) {
      nodes.push(this.toMenuNode(a));
    }
    if (nodes.length > 0 && bar.length > 0) {
      nodes.push({ kind: 'divider' });
    }
    for (const a of bar) {
      nodes.push(this.toMenuNode(a));
    }
    return nodes;
  });

  /** Constrained desktop ⋯ menu: secondary actions; selection actions stay visible. */
  readonly compactMenuNodes = computed((): ActionMenuNode[] => {
    const primary = this.primaryAction();
    return this.resolvedActions()
      .filter((action) => action.visible !== false && action !== primary)
      .map((action) => this.toMenuNode(action));
  });

  readonly visibleColumns = computed((): ColumnConfig[] => {
    const visible = new Set(
      this.controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    return this.config().columns.filter((c) => visible.has(c.key));
  });

  readonly pagerTotal = computed(() =>
    this.remote() ? (this.remoteTotal() ?? this.items().length) : this.filteredItems().length
  );

  readonly filteredItems = computed(() => {
    if (this.remote()) return this.items();
    const q = this.listingQuery();
    const searchFields =
      this.config().searchFields ?? this.config().columns.map((c) => c.field || c.key);
    let rows = this.items().filter(
      (item) =>
        matchesSearch(item, q.search ?? '', searchFields) &&
        matchesFilterGroup(item, resolveFilterGroup(q)) &&
        matchesSegment(item, this.activeSegment()?.filters)
    );
    rows = sortItemsLocally(rows, q.sort, this.config().columns);
    return rows;
  });

  readonly pageItems = computed(() => {
    if (this.remote()) return this.items();
    const rows = this.filteredItems();
    if (!this.features().pagination) return rows;
    const size = this.pageSize();
    const start = (this.page() - 1) * size;
    return rows.slice(start, start + size);
  });

  setColumnVisibility(key: string, visible: boolean): void {
    this.controlColumns.update((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible } : c))
    );
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) }, false);
  }

  showAllColumns(): void {
    this.controlColumns.update((cols) => cols.map((c) => ({ ...c, visible: true })));
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) }, false);
  }

  resetDefaultColumns(): void {
    this.controlColumns.set(
      controlColumnsFromQuery(this.config().columns, undefined, this.config().defaultVisibleColumns)
    );
    this.patchQuery({ columns: columnStateFromControls(this.controlColumns()) }, false);
  }

  onFilterMenuOpened(): void {
    this.filterMenuOpenCount.update((c) => c + 1);
  }

  onFilterApply(group: FilterGroup): void {
    this.replaceFilterGroup(group);
    this.filterMenuTrigger?.closeMenu();
  }

  onFilterClear(): void {
    this.replaceFilterGroup(emptyFilterGroup());
    this.filterMenuTrigger?.closeMenu();
  }

  onRemoveFilterLeaf(leafIndex: number): void {
    const next = removeLeafAt(this.activeFilterGroup(), leafIndex);
    this.replaceFilterGroup(next);
  }

  getFilterValue(key: string): unknown {
    return this.filterValues()[key] ?? null;
  }

  setFilterValue(key: string, value: unknown): void {
    const field = this.pinnedFilters().find((f) => f.key === key)
      ?? this.resolvedFilters().find((f) => f.key === key);
    if (!field) return;
    const next = upsertPinnedClause(this.activeFilterGroup(), field, value);
    this.replaceFilterGroup(next);
  }

  rangePart(key: string, index: 0 | 1): string {
    const value = this.getFilterValue(key);
    if (!Array.isArray(value)) return '';
    return value[index] != null ? String(value[index]) : '';
  }

  setRangePart(key: string, index: 0 | 1, part: string): void {
    const current = this.getFilterValue(key);
    const next: [string, string] = [
      Array.isArray(current) && current[0] != null ? String(current[0]) : '',
      Array.isArray(current) && current[1] != null ? String(current[1]) : '',
    ];
    next[index] = part ?? '';
    if (!next[0] && !next[1]) {
      this.setFilterValue(key, null);
      return;
    }
    this.setFilterValue(key, next);
  }

  private searchTimer?: ReturnType<typeof setTimeout>;

  /** Remote lists reload once typing pauses (300 ms), not on every key. */
  onSearchChange(value: string): void {
    if (!this.remote()) {
      this.patchQuery({ search: value }, true);
      return;
    }
    this.listingQuery.update((current) => ({ ...mergeListingQuery(current, { search: value }), page: 1 }));
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.emitQueryChange(), 300);
  }

  onPageChange(ev: { page: number; pageSize: number }): void {
    this.patchQuery({ page: ev.page, pageSize: ev.pageSize }, false);
  }

  onSortChange(ev: SortChangeEvent): void {
    this.patchQuery(
      {
        sort: ev.direction ? { field: ev.column, direction: ev.direction } : null,
      },
      true
    );
  }

  applySavedView(view: ListingSavedView, markActive = true): void {
    this.suppressQueryEmit.set(true);
    this.listingQuery.set({ ...view.query, page: view.query.page ?? 1 });
    this.controlColumns.set(
      controlColumnsFromQuery(
        this.config().columns,
        view.query.columns,
        this.config().defaultVisibleColumns
      )
    );
    this.suppressQueryEmit.set(false);
    if (markActive) {
      this.activeSavedViewId.set(view.id);
      this.activeSavedViewQuery.set(view.query);
    }
    this.emitQueryChange();
  }

  async promptSaveView(update: boolean): Promise<void> {
    const adapter = this.savedViewsAdapter;
    const resourceKey = this.resourceKey();
    if (!adapter || !resourceKey) return;
    const defaultName = update
      ? this.savedViews().find((v) => v.id === this.activeSavedViewId())?.name ?? 'My view'
      : 'My view';
    const name = window.prompt(update ? 'Update view name' : 'Save view as', defaultName);
    if (!name?.trim()) return;
    const query = { ...this.listingQuery(), page: 1 };
    const isDefault = window.confirm('Set as your default view for this list?');
    if (update && this.activeSavedViewId()) {
      await adapter.update(this.activeSavedViewId()!, {
        name: name.trim(),
        isDefault,
        query,
      });
    } else {
      const created = await adapter.create({
        resourceKey,
        name: name.trim(),
        isDefault,
        query,
      });
      this.activeSavedViewId.set(created.id);
      this.activeSavedViewQuery.set(created.query);
    }
    await this.refreshSavedViews(resourceKey);
  }

  async deleteActiveView(): Promise<void> {
    const adapter = this.savedViewsAdapter;
    const resourceKey = this.resourceKey();
    const id = this.activeSavedViewId();
    if (!adapter || !resourceKey || !id) return;
    if (!window.confirm('Delete this saved view?')) return;
    await adapter.delete(id);
    this.activeSavedViewId.set(null);
    this.activeSavedViewQuery.set(null);
    await this.refreshSavedViews(resourceKey);
  }

  handleActionClick(id: string): void {
    if (id === 'export' && this.features().export) {
      this.openExportDialog();
      return;
    }
    this.actionClick.emit(id);
  }

  // ── Export Modal State & Logic ──────────────────────────────────────────
  readonly exportDialogOpen = signal(false);
  readonly exportScope = signal<'all' | 'page' | 'selection'>('all');
  readonly exportColumns = signal<{ key: string; label: string; field: string; selected: boolean }[]>([]);

  readonly selectedExportColumnsCount = computed(
    () => this.exportColumns().filter((c) => c.selected).length
  );

  readonly exportTargetCount = computed(() => {
    switch (this.exportScope()) {
      case 'selection':
        return this.selection().length;
      case 'page':
        return this.pageItems().length;
      case 'all':
      default:
        return this.filteredItems().length;
    }
  });

  openExportDialog(): void {
    // Default scope: 'selection' if rows are selected, otherwise 'all'
    this.exportScope.set(this.selection().length > 0 ? 'selection' : 'all');

    // Initialize columns from config, defaulting to currently visible columns
    const visibleKeys = new Set(this.visibleColumns().map((c) => c.key));
    this.exportColumns.set(
      this.config().columns.map((c) => ({
        key: c.key,
        label: c.label,
        field: c.field ?? c.key,
        selected: visibleKeys.has(c.key),
      }))
    );

    this.exportDialogOpen.set(true);
  }

  closeExportDialog(): void {
    this.exportDialogOpen.set(false);
  }

  toggleExportColumn(key: string, selected: boolean): void {
    this.exportColumns.update((cols) =>
      cols.map((c) => (c.key === key ? { ...c, selected } : c))
    );
  }

  toggleAllExportColumns(select: boolean): void {
    this.exportColumns.update((cols) =>
      cols.map((c) => ({ ...c, selected: select }))
    );
  }

  confirmExport(): void {
    let rows: Record<string, unknown>[] = [];
    switch (this.exportScope()) {
      case 'selection':
        rows = this.selection() as Record<string, unknown>[];
        break;
      case 'page':
        rows = this.pageItems() as Record<string, unknown>[];
        break;
      case 'all':
      default:
        rows = this.filteredItems() as Record<string, unknown>[];
        break;
    }

    const columns = this.exportColumns()
      .filter((c) => c.selected)
      .map((c) => ({
        field: c.field,
        label: c.label,
      }));

    if (columns.length === 0 || rows.length === 0) {
      this.closeExportDialog();
      return;
    }

    const filename = this.config().exportFilename ?? 'export';
    this.csvService.exportToCsv(rows, columns, filename);
    this.exportClick.emit();
    this.actionClick.emit('export');
    this.closeExportDialog();
  }

  exportFilteredData(): void {
    this.openExportDialog();
  }

  /** Single mode: row click toggles the selected row (highlight, no checkboxes). */
  onRowClick(item: T): void {
    if (this.features().rowClick !== 'open' && this.tableSelectable() === 'single') {
      const next = this.selection().includes(item) ? [] : [item];
      this.setSelection(next);
    }
    this.rowClick.emit(item);
  }

  onTableSelectionChange(items: T[]): void {
    this.setSelection(items);
  }

  toggleSelectionMode(): void {
    this.toggleSelectionOn.update((v) => !v);
    this.setSelection([]);
  }

  private setSelection(items: T[]): void {
    this.selection.set(items);
    this.selectionChange.emit(items);
  }

  private toMenuNode(a: ListingActionItem): ActionMenuNode {
    return {
      id: a.id,
      label: a.label ?? a.id,
      icon: a.icon,
      danger: a.variant === 'danger',
      disabled: a.disabled,
      tooltip: a.tooltip,
    };
  }
}
