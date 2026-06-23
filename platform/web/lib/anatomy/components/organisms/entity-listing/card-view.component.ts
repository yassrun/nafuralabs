/**
 * Card View Component
 *
 * Displays items as cards with optional images.
 * Used when entities have visual content (products, users, etc.)
 */

import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BadgeComponent } from '../../atoms/badge';
import { SpinnerComponent } from '../../atoms/spinner';
import type { CardViewConfig } from '../../../types';

@Component({
  selector: 'nf-card-view',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, BadgeComponent, SpinnerComponent],
  template: `
    <div class="nf-card-view" [class.nf-card-view--loading]="loading()">
      @if (loading()) {
        <div class="nf-card-view__loading-overlay">
          <nf-spinner size="md"></nf-spinner>
        </div>
      }

      <div class="nf-card-view__grid">
        @for (item of items(); track trackItem(item)) {
          <div
            class="nf-card-view__card"
            [class.nf-card-view__card--selected]="isSelected(item)"
            [class.nf-card-view__card--selectable]="isSelectable()"
            (click)="onCardClick(item)"
            (dblclick)="onCardDblClick(item)">

            <!-- Selection Checkbox (multiple mode) -->
            @if (selectable() === 'multiple') {
              <div class="nf-card-view__checkbox" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="isSelected(item)"
                  (change)="toggleSelection(item)">
                </mat-checkbox>
              </div>
            }

            <!-- Image -->
            @if (config().imageField) {
              <div class="nf-card-view__image">
                @if (getFieldValue(item, config().imageField!)) {
                  <img
                    [src]="getFieldValue(item, config().imageField!)"
                    [alt]="getFieldValue(item, config().titleField)"
                    loading="lazy" />
                } @else {
                  <div class="nf-card-view__image-placeholder">
                    @if (config().placeholderImage) {
                      <img [src]="config().placeholderImage" alt="No image" />
                    } @else {
                      <span class="nf-card-view__image-icon">image</span>
                    }
                  </div>
                }
              </div>
            }

            <!-- Content -->
            <div class="nf-card-view__content">
              <!-- Badge -->
              @if (config().badgeField && getFieldValue(item, config().badgeField!)) {
                <nf-badge variant="default" class="nf-card-view__badge">
                  {{ getFieldValue(item, config().badgeField!) }}
                </nf-badge>
              }

              <!-- Title -->
              <h3 class="nf-card-view__title">
                {{ getFieldValue(item, config().titleField) }}
              </h3>

              <!-- Subtitle -->
              @if (config().subtitleField) {
                <p class="nf-card-view__subtitle">
                  {{ getFieldValue(item, config().subtitleField!) }}
                </p>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .nf-card-view {
      position: relative;
    }

    .nf-card-view--loading {
      min-height: 200px;
    }

    .nf-card-view__loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }

    .nf-card-view__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--nf-space-4, 16px);
    }

    .nf-card-view__card {
      position: relative;
      display: flex;
      flex-direction: column;
      background-color: var(--nf-bg-surface, #fff);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 12px);
      overflow: hidden;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .nf-card-view__card--selectable {
      cursor: pointer;

      &:hover {
        box-shadow: var(--nf-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      }
    }

    .nf-card-view__card--selected {
      border-color: var(--nf-color-primary, #3b82f6);
      box-shadow: 0 0 0 1px var(--nf-color-primary, #3b82f6);
    }

    .nf-card-view__checkbox {
      position: absolute;
      top: var(--nf-space-2, 8px);
      left: var(--nf-space-2, 8px);
      z-index: 5;
      background-color: var(--nf-bg-surface, #fff);
      border-radius: var(--nf-radius-sm, 4px);
    }

    .nf-card-view__image {
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background-color: var(--nf-bg-subtle, #f9fafb);
    }

    .nf-card-view__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nf-card-view__image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--nf-text-tertiary, #9ca3af);
    }

    .nf-card-view__image-icon {
      font-family: 'Material Icons';
      font-size: 48px;
    }

    .nf-card-view__content {
      padding: var(--nf-space-3, 12px);
    }

    .nf-card-view__badge {
      margin-bottom: var(--nf-space-2, 8px);
    }

    .nf-card-view__title {
      margin: 0;
      font-size: var(--nf-text-base, 1rem);
      font-weight: var(--nf-font-medium, 500);
      color: var(--nf-text-primary);
      line-height: 1.4;
    }

    .nf-card-view__subtitle {
      margin: var(--nf-space-1, 4px) 0 0;
      font-size: var(--nf-text-sm, 0.875rem);
      color: var(--nf-text-secondary, #6b7280);
      line-height: 1.4;
    }
  `],
})
export class CardViewComponent<T = unknown> {
  /** Items to display */
  items = input.required<T[]>();

  /** Card view configuration */
  config = input.required<CardViewConfig>();

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

  onCardClick(item: T): void {
    if (this.isSelectable()) {
      this.toggleSelection(item);
    }
    this.itemClick.emit(item);
  }

  onCardDblClick(item: T): void {
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
