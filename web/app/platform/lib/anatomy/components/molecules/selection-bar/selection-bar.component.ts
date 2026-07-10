import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button';

/**
 * Selection action configuration.
 */
export interface SelectionAction {
  /** Unique identifier */
  id: string;
  /** Button label */
  label: string;
  /** Material icon name */
  icon?: string;
  /** Button variant */
  variant?: 'secondary' | 'ghost' | 'danger';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Selection Bar Component
 *
 * Contextual bar for bulk operations in listings.
 * Shows count + action buttons. Actions disabled when count = 0.
 *
 * UX Design:
 * - Shows minimal text: "0 selected", "1 selected", "N selected"
 * - No verbose instructions (e.g., "Select products to perform bulk actions")
 * - Actions disabled when count = 0, enabled when > 0
 * - Cancel button always available to exit selection mode
 *
 * @example
 * <nf-selection-bar
 *   [count]="selectedCount()"
 *   [actions]="bulkActions"
 *   (actionClick)="onBulkAction($event)"
 *   (clear)="exitSelectionMode()">
 * </nf-selection-bar>
 */
@Component({
  selector: 'nf-selection-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-selection-bar" [class.nf-selection-bar--empty]="count() === 0">
      <div class="nf-selection-bar__info">
        <mat-icon class="nf-selection-bar__icon">{{ statusIcon() }}</mat-icon>
        <span class="nf-selection-bar__count">{{ count() }} {{ 'selected' | translate }}</span>
      </div>

      <div class="nf-selection-bar__actions">
        @for (action of actions(); track action.id) {
          <nf-button
            [variant]="action.variant ?? 'secondary'"
            size="sm"
            [icon]="action.icon"
            [disabled]="(action.disabled ?? false) || count() === 0"
            (clicked)="onActionClick(action)">
            {{ action.label }}
          </nf-button>
        }
        <ng-content></ng-content>
        <nf-button variant="ghost" size="sm" (clicked)="onClear()">{{ 'Cancel' | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-selection-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--nf-space-4, 16px);
      padding: var(--nf-space-2, 8px) var(--nf-space-3, 12px);
      /* White surface + blue border - lighter than selected rows */
      background-color: var(--nf-selection-bar-bg, var(--nf-color-surface, #ffffff));
      border: var(--nf-selection-bar-border, 1px solid var(--nf-color-primary-300, #93c5fd));
      border-radius: var(--nf-selection-bar-radius, var(--nf-radius-md, 6px));
      min-height: 40px;

      /* Smooth animation */
      animation: slideIn 0.15s ease-out;
    }

    /* Has selection: subtle left accent to indicate active context */
    .nf-selection-bar:not(.nf-selection-bar--empty) {
      border-left-width: 3px;
      border-left-color: var(--nf-primary, #3b82f6);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .nf-selection-bar__info {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 8px);
    }

    .nf-selection-bar__icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--nf-selection-bar-icon-color, var(--nf-primary, #3b82f6));
      transition: color 0.15s ease;
    }

    /* Empty state: muted styling */
    .nf-selection-bar--empty .nf-selection-bar__icon {
      color: var(--nf-selection-bar-icon-color-empty, var(--nf-text-muted, #6b7280));
    }

    .nf-selection-bar--empty .nf-selection-bar__count {
      color: var(--nf-text-secondary, #4b5563);
    }

    .nf-selection-bar__count {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-medium, 500);
      color: var(--nf-text-primary, #111827);
    }

    .nf-selection-bar__actions {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 8px);
    }

    /* Responsive: stack on narrow screens */
    @media (max-width: 640px) {
      .nf-selection-bar {
        flex-direction: column;
        align-items: stretch;
        gap: var(--nf-space-2, 8px);
      }

      .nf-selection-bar__actions {
        justify-content: flex-end;
      }
    }
  `],
})
export class SelectionBarComponent {
  /** Number of selected items */
  count = input.required<number>();

  /** Bulk actions to display */
  actions = input<SelectionAction[]>([]);

  // Outputs
  /** Emitted when an action button is clicked */
  actionClick = output<SelectionAction>();

  /** Emitted when clear button is clicked */
  clear = output<void>();

  // Computed
  /** Icon changes based on selection state */
  statusIcon = computed(() => this.count() > 0 ? 'check_box' : 'check_box_outline_blank');

  // Event handlers
  onActionClick(action: SelectionAction): void {
    this.actionClick.emit(action);
  }

  onClear(): void {
    this.clear.emit();
  }
}
