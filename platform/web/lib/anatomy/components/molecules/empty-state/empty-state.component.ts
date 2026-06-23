import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../atoms/button';

/**
 * Empty State Component
 *
 * Placeholder when no data.
 *
 * @example
 * <nf-empty-state
 *   icon="inventory_2"
 *   title="No items found"
 *   message="Create your first item to get started"
 *   actionLabel="Create Item"
 *   (action)="onCreate()">
 * </nf-empty-state>
 */
@Component({
  selector: 'nf-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  template: `
    <div class="nf-empty-state">
      @if (icon()) {
        <mat-icon class="nf-empty-state__icon">{{ icon() }}</mat-icon>
      }
      <h3 class="nf-empty-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="nf-empty-state__message">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <nf-button
          variant="primary"
          (clicked)="action.emit()"
        >{{ actionLabel() }}</nf-button>
      }
    </div>
  `,
  styles: [`
    .nf-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .nf-empty-state__icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--nf-color-text-disabled, #bdbdbd);
      margin-bottom: 16px;
    }

    .nf-empty-state__title {
      margin: 0 0 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-empty-state__message {
      margin: 0 0 24px;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
      max-width: 400px;
    }
  `],
})
export class EmptyStateComponent {
  // Inputs
  icon = input<string | undefined>(undefined);
  title = input.required<string>();
  message = input<string | undefined>(undefined);
  actionLabel = input<string | undefined>(undefined);

  // Outputs
  action = output<void>();
}
