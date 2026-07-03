import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Alert variant types.
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Alert Component
 *
 * Inline notification/banner.
 *
 * @example
 * <nf-alert variant="warning" title="Attention" message="This action cannot be undone" dismissible></nf-alert>
 */
@Component({
  selector: 'nf-alert',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div [class]="alertClasses()" role="alert">
      <mat-icon class="nf-alert__icon">{{ resolvedIcon() }}</mat-icon>
      <div class="nf-alert__content">
        @if (title()) {
          <strong class="nf-alert__title">{{ title() }}</strong>
        }
        <span class="nf-alert__message">{{ message() }}</span>
      </div>
      @if (dismissible()) {
        <button
          mat-icon-button
          class="nf-alert__close"
          aria-label="Dismiss"
          (click)="onDismiss()"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .nf-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid transparent;
    }

    // Variants
    .nf-alert--info {
      background-color: var(--nf-color-info-light, #e3f2fd);
      border-color: var(--nf-color-info, #0288d1);
      color: var(--nf-color-info-dark, #01579b);
    }

    .nf-alert--success {
      background-color: var(--nf-color-success-light, #e8f5e9);
      border-color: var(--nf-color-success, #388e3c);
      color: var(--nf-color-success-dark, #1b5e20);
    }

    .nf-alert--warning {
      background-color: var(--nf-color-warning-light, #fff3e0);
      border-color: var(--nf-color-warning, #f57c00);
      color: var(--nf-color-warning-dark, #e65100);
    }

    .nf-alert--danger {
      background-color: var(--nf-color-danger-light, #ffebee);
      border-color: var(--nf-color-danger, #d32f2f);
      color: var(--nf-color-danger-dark, #b71c1c);
    }

    .nf-alert__icon {
      flex-shrink: 0;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nf-alert__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 2px;
    }

    .nf-alert__title {
      font-weight: 600;
    }

    .nf-alert__message {
      font-size: 0.875rem;
    }

    .nf-alert__close {
      flex-shrink: 0;
      margin: -8px -8px -8px 0;
      color: inherit;
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }
    }
  `],
})
export class AlertComponent {
  // Inputs
  variant = input<AlertVariant>('info');
  title = input<string | undefined>(undefined);
  message = input.required<string>();
  dismissible = input<boolean>(false);
  icon = input<string | undefined>(undefined);

  // Outputs
  dismissed = output<void>();

  // Default icons by variant
  private defaultIcons: Record<AlertVariant, string> = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    danger: 'error',
  };

  // Computed
  resolvedIcon = computed(() => {
    return this.icon() || this.defaultIcons[this.variant()];
  });

  alertClasses = computed(() => {
    return `nf-alert nf-alert--${this.variant()}`;
  });

  onDismiss(): void {
    this.dismissed.emit();
  }
}
