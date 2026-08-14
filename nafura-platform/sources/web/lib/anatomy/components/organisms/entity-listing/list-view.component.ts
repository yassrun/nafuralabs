/**
 * List View Component
 *
 * Displays items in a single-line list format.
 * Efficient for scanning large datasets with minimal visual noise.
 * Uses CDK virtual scroll when row count exceeds {@link ListViewComponent.virtualizeAt}.
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SpinnerComponent } from '../../atoms/spinner';
import { AvatarComponent } from '../../atoms/avatar';
import type { ListViewConfig } from '../../../types';

@Component({
  selector: 'nf-list-view',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, ScrollingModule, SpinnerComponent, AvatarComponent],
  template: `
    <div class="nf-list-view" [class.nf-list-view--loading]="loading()">
      @if (loading()) {
        <div class="nf-list-view__loading-overlay">
          <nf-spinner size="md"></nf-spinner>
        </div>
      }

      @if (useVirtualScroll()) {
        <cdk-virtual-scroll-viewport
          class="nf-list-view__viewport"
          [itemSize]="virtualItemSize()"
          minBufferPx="200"
          maxBufferPx="400">
          <div
            *cdkVirtualFor="let item of items(); trackBy: virtualTrackBy"
            [style.height.px]="virtualItemSize()"
            class="nf-list-view__virtual-slot">
            <ng-container *ngTemplateOutlet="itemRow; context: { $implicit: item }"></ng-container>
          </div>
        </cdk-virtual-scroll-viewport>
      } @else {
        <div class="nf-list-view__list">
          @for (item of items(); track trackItem(item)) {
            <ng-container *ngTemplateOutlet="itemRow; context: { $implicit: item }"></ng-container>
          }
        </div>
      }

      <ng-template #itemRow let-item>
        <div
          class="nf-list-view__item"
          [class.nf-list-view__item--selected]="isSelected(item)"
          [class.nf-list-view__item--selectable]="isSelectable()"
          (click)="onItemClick(item)"
          (dblclick)="onItemDblClick(item)">
          @if (selectable() === 'multiple') {
            <div class="nf-list-view__checkbox" (click)="$event.stopPropagation()">
              <mat-checkbox
                [checked]="isSelected(item)"
                (change)="toggleSelection(item)">
              </mat-checkbox>
            </div>
          }

          @if (config().avatarField) {
            <nf-avatar
              [src]="getFieldValue(item, config().avatarField!)"
              [name]="getFieldValue(item, config().primaryField)"
              size="sm">
            </nf-avatar>
          }

          <div class="nf-list-view__content">
            <span class="nf-list-view__primary">
              {{ getFieldValue(item, config().primaryField) }}
            </span>
            @if (config().secondaryField) {
              <span class="nf-list-view__secondary">
                {{ getFieldValue(item, config().secondaryField!) }}
              </span>
            }
          </div>

          @if (config().tertiaryField) {
            <span class="nf-list-view__tertiary">
              {{ getFieldValue(item, config().tertiaryField!) }}
            </span>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
      height: 100%;
    }

    .nf-list-view {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
    }

    .nf-list-view--loading {
      min-height: 200px;
    }

    .nf-list-view__loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }

    .nf-list-view__viewport {
      flex: 1;
      min-height: 200px;
      width: 100%;
    }

    .nf-list-view__virtual-slot {
      box-sizing: border-box;
    }

    .nf-list-view__list {
      display: flex;
      flex-direction: column;
    }

    .nf-list-view__item {
      display: flex;
      align-items: center;
      gap: var(--nf-space-3, 12px);
      padding: var(--nf-space-3, 12px) var(--nf-space-4, 16px);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      background-color: var(--nf-bg-surface, #fff);
      transition: background-color 0.15s ease;
      box-sizing: border-box;
      height: 100%;
    }

    .nf-list-view__list .nf-list-view__item:last-child {
      border-bottom: none;
    }

    .nf-list-view__item--selectable {
      cursor: pointer;

      &:hover {
        background-color: var(--nf-bg-hover, #f9fafb);
      }
    }

    .nf-list-view__item--selected {
      background-color: var(--nf-bg-primary-subtle, #eff6ff);

      &:hover {
        background-color: var(--nf-bg-primary-subtle, #eff6ff);
      }
    }

    .nf-list-view__checkbox {
      flex-shrink: 0;
    }

    .nf-list-view__content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nf-list-view__primary {
      font-size: var(--nf-text-base, 1rem);
      font-weight: var(--nf-font-medium, 500);
      color: var(--nf-text-primary);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nf-list-view__secondary {
      font-size: var(--nf-text-sm, 0.875rem);
      color: var(--nf-text-secondary, #6b7280);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nf-list-view__tertiary {
      flex-shrink: 0;
      font-size: var(--nf-text-sm, 0.875rem);
      color: var(--nf-text-tertiary, #9ca3af);
    }
  `],
})
export class ListViewComponent<T = unknown> {
  /** Items to display */
  items = input.required<T[]>();

  /** List view configuration */
  config = input.required<ListViewConfig>();

  /** Selection mode */
  selectable = input<boolean | 'single' | 'multiple'>(false);

  /** Currently selected items */
  selection = input<T[]>([]);

  /** Loading state */
  loading = input<boolean>(false);

  /** Track function for items */
  trackBy = input<(item: T) => unknown>((item: T) => item);

  /** Minimum row count to enable CDK virtual scroll (spec: &gt; 50). */
  virtualizeAt = input(51);

  /** Fixed row height passed to `cdk-virtual-scroll-viewport` (px). */
  virtualItemSize = input(56);

  /** Emitted when selection changes */
  selectionChange = output<T[]>();

  /** Emitted when item is clicked */
  itemClick = output<T>();

  /** Emitted when item is double-clicked */
  itemDblClick = output<T>();

  readonly useVirtualScroll = computed(
    () => this.items().length >= this.virtualizeAt(),
  );

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

  /** CDK `trackBy` signature (index + item). */
  readonly virtualTrackBy = (_index: number, item: T): unknown => this.trackBy()(item);

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
