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
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent } from '../data-table';
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
import type { ColumnConfig } from '../../../types';
import { matchesFilters, matchesSearch } from './listing-query.util';
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
    TranslateModule,
    MatMenuModule,
    LucideAngularModule,
    ButtonComponent,
    ActionMenuComponent,
    FilterBuilderComponent,
    FilterChipsComponent,
    ListingActionsComponent,
    DataTableComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-listing-flat" [class.nf-listing-flat--split]="layout() === 'split'">
      <!-- Row 1: Search + Filter Add + Filter Chips (starts left, flows right) -->
      @if (features().search || features().filters) {
        <div class="nf-listing-flat__filters">
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
          @if (features().filters) {
            <div class="nf-listing-flat__chips">
              @if ((config().filters ?? []).length > 0) {
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
                      [filters]="config().filters ?? []"
                      [values]="filterValues()"
                      [openCount]="filterMenuOpenCount()"
                      (apply)="onFilterApply($event)"
                      (clear)="onFilterClear()"
                    />
                  </div>
                </mat-menu>
              }
              <nf-filter-chips
                [fields]="config().filters ?? []"
                [values]="filterValues()"
                (remove)="onRemoveFilter($event)"
              />
            </div>
          }
        </div>
      }

      <!-- Row 2: Selection Pill (LEFT) ➔ Table Controls + Action Buttons (RIGHT) -->
      <div class="nf-listing-flat__actions-row">
        <!-- Left: Selection indicator & contextual bulk message -->
        <div class="nf-listing-flat__actions-left">
          @if (selection().length > 0) {
            <span class="nf-listing-flat__selcount">
              {{ selection().length }} {{ 'selected' | translate }}
            </span>
          }
        </div>

        <!-- Right: Table Controls (Columns / Multi-select) · Separator · Action Buttons -->
        <div class="nf-listing-flat__actions-right">
          @if (features().columnToggle || features().selectionToggle) {
            <div class="nf-listing-flat__table-controls">
              <ng-container [ngTemplateOutlet]="controlsTpl" />
            </div>
            @if (hasActions()) {
              <div class="nf-listing-flat__actions-sep"></div>
            }
          }

          <ng-content />

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
              <nf-listing-actions
                [actions]="resolvedActions()"
                [selectionActions]="visibleSelectionActions()"
                size="xs"
                (actionClick)="handleActionClick($event)"
              />
            }
          }
        </div>
      </div>

      <div class="nf-listing-flat__view">
        <nf-data-table
          [items]="pageItems()"
          [columns]="visibleColumns()"
          [paginateAfter]="0"
          [rowClickable]="true"
          [selectable]="tableSelectable()"
          [selection]="selection()"
          [emptyMessage]="config().emptyMessage ?? 'No items'"
          [loading]="loading()"
          (selectionChange)="onTableSelectionChange($event)"
          (rowClick)="onRowClick($event)"
          (rowDblClick)="rowDblClick.emit($event)"
        />
      </div>

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

      @if (features().pagination && filteredItems().length > 0) {
        <div class="nf-listing-flat__pager">
          <nf-pagination
            [total]="filteredItems().length"
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
              (clicked)="toggleSelectionOn.update((v) => !v)"
            />
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
      }
      .nf-listing-flat {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        gap: 8px;
      }

      /* ── Row 1: Search + Filter Chips ───────────────────────────────── */
      .nf-listing-flat__filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
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
        overflow-x: auto;
        scrollbar-width: none;
        flex: 1 1 auto;
      }
      .nf-listing-flat__chips::-webkit-scrollbar {
        display: none;
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

      /* ── Row 2: actions row (Left: Selection Info · Right: Controls & Actions) ── */
      .nf-listing-flat__actions-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 0 0 auto;
      }
      /* Left side: selection count pill */
      .nf-listing-flat__actions-left {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 26px;
      }
      /* Right side: Table Controls (Columns, Multi-select) · Separator · Action buttons */
      .nf-listing-flat__actions-right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-left: auto;
      }
      .nf-listing-flat__table-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .nf-listing-flat__actions-sep {
        width: 1px;
        height: 16px;
        background: var(--nf-border-default, #e5e7eb);
        margin: 0 2px;
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
          width: max-content !important;
          min-width: 0 !important;
          max-width: min(560px, calc(100vw - 24px));
          height: auto;
          max-height: min(80vh, 640px);
          overflow-x: hidden;
          overflow-y: auto;

          .mat-mdc-menu-content {
            padding: 0 !important;
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

      /* ── Mobile: compact 2-line header, horizontal scrolling actions ── */
      @media (max-width: 600px) {
        .nf-listing-flat {
          gap: 6px;
        }

        .nf-listing-flat__search {
          flex: 1 1 auto !important;
          min-width: 120px !important;
        }
        .nf-listing-flat__chips {
          flex: 1 1 100% !important;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .nf-listing-flat__actions-row {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: nowrap !important;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
          -webkit-overflow-scrolling: touch;
        }
        .nf-listing-flat__actions-right {
          display: flex !important;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap !important;
          margin-left: auto;
        }
        .nf-listing-flat__actions-right > * {
          flex: 0 0 auto !important;
        }

        /* Split layout on mobile: sticky bottom action bar (thumb zone) */
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
      @media (max-width: 640px) {
        :host ::ng-deep .mat-mdc-menu-panel.nf-listing-flat-menu--filter {
          width: calc(100vw - 24px) !important;
          max-width: calc(100vw - 24px);
        }
      }
      @media (max-width: 640px) {
        :host ::ng-deep .mat-mdc-menu-panel.nf-listing-flat-menu--filter {
          width: calc(100vw - 24px) !important;
          max-width: calc(100vw - 24px);
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

  readonly rowClick = output<T>();
  readonly rowDblClick = output<T>();
  readonly actionClick = output<string>();
  readonly selectionChange = output<T[]>();
  readonly exportClick = output<void>();

  readonly search = signal('');
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly toggleSelectionOn = signal(false);
  readonly selection = signal<T[]>([]);
  readonly controlColumns = signal<ListingControlsColumn[]>([]);
  /** Incremented each time the filter menu opens; builder syncs from values. */
  readonly filterMenuOpenCount = signal(0);

  @ViewChild('filterMenuTrigger') private filterMenuTrigger?: MatMenuTrigger;

  readonly features = computed(() => ({
    ...DEFAULT_LISTING_FLAT_FEATURES,
    ...this.config().features,
  }));

  /** Toolbar layout: 'chips' (A, default) or 'split' (C). */
  readonly layout = computed(() => this.config().toolbarLayout ?? 'chips');

  readonly selectionKind = computed(() => this.features().selection);

  readonly tableSelectable = computed((): false | 'single' | 'multiple' => {
    const sel = this.selectionKind();
    if (sel === 'single' || sel === 'multiple') return sel;
    if (this.features().selectionToggle && this.toggleSelectionOn()) return 'multiple';
    return false;
  });

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia('(max-width: 600px)');
      this.isMobile.set(mql.matches);
      mql.addEventListener('change', (e) => this.isMobile.set(e.matches));
    }

    effect(() => {
      const cols = this.config().columns;
      this.controlColumns.set(
        cols.map((c) => ({
          key: c.key,
          label: c.label,
          visible: true,
        }))
      );
    });
    effect(() => {
      this.pageSize.set(this.config().pageSize ?? 20);
      this.page.set(1);
    });
    effect(() => {
      this.selectionKind();
      this.toggleSelectionOn.set(false);
      this.setSelection([]);
    });
  }

  /** Apply initialFilters only when its content actually changes (config is rebuilt often). */
  private lastInitialFilters = '';
  readonly initialFiltersEffect = effect(() => {
    const init = this.config().initialFilters;
    const key = JSON.stringify(init ?? null);
    if (key === this.lastInitialFilters) return;
    this.lastInitialFilters = key;
    this.filterValues.set({ ...(init ?? {}) });
    this.page.set(1);
  });

  readonly pageSizeOptions = computed(
    () => this.config().pageSizeOptions ?? [10, 20, 50, 100]
  );

  readonly filterActive = computed(() => Object.keys(this.filterValues()).length > 0);
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
    return (this.config().selectionActions ?? []).filter((a) => {
      if (a.visible === false) return false;
      const scope = a.scope ?? 'single+bulk';
      const min =
        scope === 'single' ? 1 : scope === 'bulk' ? (a.minSelection ?? 2) : (a.minSelection ?? 1);
      const max = scope === 'single' ? 1 : a.maxSelection;
      if (count < min) return false;
      if (max != null && count > max) return false;
      return true;
    });
  });

  /** True below 600px — the toolbar condenses to primary action + ⋯ overflow. */
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

  readonly visibleColumns = computed((): ColumnConfig[] => {
    const visible = new Set(
      this.controlColumns()
        .filter((c) => c.visible)
        .map((c) => c.key)
    );
    return this.config().columns.filter((c) => visible.has(c.key));
  });

  readonly filteredItems = computed(() => {
    const searchFields =
      this.config().searchFields ?? this.config().columns.map((c) => c.field || c.key);
    return this.items().filter(
      (item) =>
        matchesSearch(item, this.search(), searchFields) &&
        matchesFilters(item, this.filterValues())
    );
  });

  readonly pageItems = computed(() => {
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
  }

  showAllColumns(): void {
    this.controlColumns.update((cols) => cols.map((c) => ({ ...c, visible: true })));
  }

  resetDefaultColumns(): void {
    this.controlColumns.update((cols) => cols.map((c) => ({ ...c, visible: true })));
  }

  onFilterMenuOpened(): void {
    this.filterMenuOpenCount.update((c) => c + 1);
  }

  onFilterApply(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.page.set(1);
    this.filterMenuTrigger?.closeMenu();
  }

  onFilterClear(): void {
    this.filterValues.set({});
    this.page.set(1);
    this.filterMenuTrigger?.closeMenu();
  }

  onRemoveFilter(key: string): void {
    this.filterValues.update((values) => {
      const next = { ...values };
      delete next[key];
      return next;
    });
    this.page.set(1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onPageChange(ev: { page: number; pageSize: number }): void {
    this.page.set(ev.page);
    this.pageSize.set(ev.pageSize);
  }

  handleActionClick(id: string): void {
    if (id === 'export') {
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
    if (this.selectionKind() === 'single') {
      const next = this.selection().includes(item) ? [] : [item];
      this.setSelection(next);
    }
    this.rowClick.emit(item);
  }

  onTableSelectionChange(items: T[]): void {
    this.setSelection(items);
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
      confirm: a.id === 'delete',
    };
  }
}
