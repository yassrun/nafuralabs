/**
 * Grid View Component
 *
 * Displays items in a compact grid layout.
 * Useful for visual browsing with minimal info per item.
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SpinnerComponent } from '../../atoms/spinner';
import type { GridViewConfig } from '../../../types';

@Component({
  selector: 'nf-grid-view',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, SpinnerComponent],
  template: `
    <div class="nf-grid-view" [class.nf-grid-view--loading]="loading()">
      @if (loading()) {
        <div class="nf-grid-view__loading-overlay">
          <nf-spinner size="md"></nf-spinner>
        </div>
      }

      <div class="nf-grid-view__grid" [style.--grid-columns]="gridColumns()">
        @for (item of items(); track trackItem(item)) {
          <div
            class="nf-grid-view__item"
            [class.nf-grid-view__item--selected]="isSelected(item)"
            [class.nf-grid-view__item--selectable]="isSelectable()"
            [style.aspect-ratio]="config().aspectRatio ?? '1'"
            (click)="onItemClick(item)"
            (dblclick)="onItemDblClick(item)">

            <!-- Selection Checkbox (multiple mode) -->
            @if (selectable() === 'multiple') {
              <div class="nf-grid-view__checkbox" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="isSelected(item)"
                  (change)="toggleSelection(item)">
                </mat-checkbox>
              </div>
            }

            <!-- Content Overlay -->
            <div class="nf-grid-view__content">
              <span class="nf-grid-view__title">
                {{ getFieldValue(item, config().titleField) }}
              </span>
              @if (config().subtitleField) {
                <span class="nf-grid-view__subtitle">
                  {{ getFieldValue(item, config().subtitleField!) }}
                </span>
              }
            </div>

            <!-- Selection Indicator -->
            @if (isSelected(item)) {
              <div class="nf-grid-view__selected-indicator"></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .nf-grid-view {
      position: relative;
    }

    .nf-grid-view--loading {
      min-height: 200px;
    }

    .nf-grid-view__loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }

    .nf-grid-view__grid {
      display: grid;
      grid-template-columns: repeat(var(--grid-columns, 4), 1fr);
      gap: var(--nf-space-2, 8px);
    }

    @media (max-width: 1200px) {
      .nf-grid-view__grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .nf-grid-view__grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .nf-grid-view__item {
      position: relative;
      display: flex;
      align-items: flex-end;
      background-color: var(--nf-bg-subtle, #f9fafb);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-md, 8px);
      overflow: hidden;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .nf-grid-view__item--selectable {
      cursor: pointer;

      &:hover {
        box-shadow: var(--nf-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      }
    }

    .nf-grid-view__item--selected {
      border-color: var(--nf-color-primary, #3b82f6);
    }

    .nf-grid-view__checkbox {
      position: absolute;
      top: var(--nf-space-1, 4px);
      left: var(--nf-space-1, 4px);
      z-index: 5;
      background-color: var(--nf-bg-surface, #fff);
      border-radius: var(--nf-radius-sm, 4px);
    }

    .nf-grid-view__content {
      width: 100%;
      padding: var(--nf-space-2, 8px);
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
      color: #fff;
    }

    .nf-grid-view__title {
      display: block;
      font-size: var(--nf-text-sm, 0.875rem);
      font-weight: var(--nf-font-medium, 500);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nf-grid-view__subtitle {
      display: block;
      font-size: var(--nf-text-xs, 0.75rem);
      opacity: 0.8;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nf-grid-view__selected-indicator {
      position: absolute;
      top: var(--nf-space-1, 4px);
      right: var(--nf-space-1, 4px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--nf-color-primary, #3b82f6);
    }
  `],
})
export class GridViewComponent<T = unknown> {
  /** Items to display */
  items = input.required<T[]>();

  /** Grid view configuration */
  config = input.required<GridViewConfig>();

  /** Selection mode */
  selectable = input<boolean | 'single' | 'multiple'>(false);

  /** Currently selected items */
  selection = input<T[]>([]);

  /** Loading state */
  loading = input<boolean>(false);

  /** Track function for items */
  trackBy = input<(item: T) => unknown>((item: T) => item);

  /** Emitted when selection changes */
  selectionChange = output<T[]>();

  /** Emitted when item is clicked */
  itemClick = output<T>();

  /** Emitted when item is double-clicked */
  itemDblClick = output<T>();

  gridColumns = computed(() => {
    const cols = this.config().columns;
    if (cols === 'auto' || cols === undefined) return 4;
    return cols;
  });

  isSelectable(): boolean {
    const mode = this.selectable();
    return mode === true || mode === 'single' || mode === 'multiple';
  }

  isSelected(item: T): boolean {
    return this.selection().includes(item);
  }

  trackItem(item: T): unknown {
    return this.trackBy()(item);
  }

  getFieldValue(item: T, field: string): string {
    const parts = field.split('.');
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return '';
      value = (value as Record<string, unknown>)[part];
    }
    return value != null ? String(value) : '';
  }

  onItemClick(item: T): void {
    if (this.isSelectable()) {
      this.toggleSelection(item);
    }
    this.itemClick.emit(item);
  }

  onItemDblClick(item: T): void {
    this.itemDblClick.emit(item);
  }

  toggleSelection(item: T): void {
    const mode = this.selectable();
    const current = this.selection();
    const isCurrentlySelected = current.includes(item);

    let newSelection: T[];

    if (mode === 'single') {
      newSelection = isCurrentlySelected ? [] : [item];
    } else if (mode === 'multiple' || mode === true) {
      if (isCurrentlySelected) {
        newSelection = current.filter((i) => i !== item);
      } else {
        newSelection = [...current, item];
      }
    } else {
      return;
    }

    this.selectionChange.emit(newSelection);
  }
}
