import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Toast variant types.
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Toast data.
 */
export interface ToastData {
  message: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Toast Component
 *
 * Notification toast (opened via ToastService).
 */
@Component({
  selector: 'nf-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div [class]="toastClasses">
      <mat-icon class="nf-toast__icon">{{ icon }}</mat-icon>
      <span class="nf-toast__message">{{ data.message }}</span>
      @if (data.action) {
        <button
          mat-button
          class="nf-toast__action"
          (click)="onAction()"
        >{{ data.action.label }}</button>
      }
      <button
        mat-icon-button
        class="nf-toast__close"
        aria-label="Dismiss"
        (click)="dismiss()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nf-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
    }

    // Variants
    .nf-toast--info {
      background-color: var(--nf-color-info, #0288d1);
    }

    .nf-toast--success {
      background-color: var(--nf-color-success, #388e3c);
    }

    .nf-toast--warning {
      background-color: var(--nf-color-warning, #f57c00);
    }

    .nf-toast--danger {
      background-color: var(--nf-color-danger, #d32f2f);
    }

    .nf-toast__icon {
      flex-shrink: 0;
    }

    .nf-toast__message {
      flex: 1;
      font-size: 0.875rem;
    }

    .nf-toast__action {
      color: white;
      font-weight: 500;
    }

    .nf-toast__close {
      flex-shrink: 0;
      margin: -8px -8px -8px 0;
      color: white;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  `],
})
export class ToastComponent {
  private snackBarRef = inject(MatSnackBarRef<ToastComponent>);
  data = inject<ToastData>(MAT_SNACK_BAR_DATA);

  private icons: Record<ToastVariant, string> = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    danger: 'error',
  };

  get toastClasses(): string {
    return `nf-toast nf-toast--${this.data.variant || 'info'}`;
  }

  get icon(): string {
    return this.icons[this.data.variant || 'info'];
  }

  onAction(): void {
    if (this.data.action?.callback) {
      this.data.action.callback();
    }
    this.dismiss();
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
