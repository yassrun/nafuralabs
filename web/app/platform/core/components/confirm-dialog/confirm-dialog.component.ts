/**
 * Confirm Dialog Component
 * 
 * A reusable Angular Material confirmation dialog with different variants:
 * - info: For informational messages (blue)
 * - warning: For warning messages (orange)
 * - danger: For destructive actions (red)
 * - success: For success messages (green)
 */

import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDialogVariant = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmDialogData {
  /** Dialog variant/type */
  variant?: ConfirmDialogVariant;
  /** Dialog title */
  title: string;
  /** Dialog message (supports multiple lines) */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Custom icon (Material icon name) - overrides default variant icon */
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog" [class]="'confirm-dialog--' + variant">
      <!-- Header -->
      <div class="confirm-dialog__header">
        <div class="confirm-dialog__icon-wrapper" [class]="'confirm-dialog__icon-wrapper--' + variant">
          <mat-icon class="confirm-dialog__icon">{{ iconName }}</mat-icon>
        </div>
        <h2 class="confirm-dialog__title">{{ data.title }}</h2>
      </div>

      <!-- Content -->
      <mat-dialog-content class="confirm-dialog__content">
        <p class="confirm-dialog__message">{{ data.message }}</p>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions class="confirm-dialog__actions" align="end">
        @if (data.showCancel !== false) {
          <button 
            mat-button 
            class="confirm-dialog__btn confirm-dialog__btn--cancel"
            (click)="onCancel()"
          >
            {{ data.cancelText || 'Cancel' }}
          </button>
        }
        <button 
          mat-flat-button 
          class="confirm-dialog__btn confirm-dialog__btn--confirm"
          [class]="'confirm-dialog__btn--' + variant"
          (click)="onConfirm()"
          cdkFocusInitial
        >
          {{ data.confirmText || 'OK' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 320px;
      max-width: 480px;
      padding: 24px;

      &__header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      &__icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &--info {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        &--warning {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        &--danger {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        &--success {
          background-color: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
      }

      &__icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      &__title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.3;
      }

      &__content {
        padding: 0 !important;
        margin: 0 0 24px 0;
        overflow: visible;
      }

      &__message {
        margin: 0;
        font-size: 0.95rem;
        color: #6b7280;
        line-height: 1.6;
        white-space: pre-line;
      }

      &__actions {
        padding: 0 !important;
        margin: 0;
        gap: 12px;
      }

      &__btn {
        min-width: 100px;
        font-weight: 500;

        &--cancel {
          color: #6b7280;
        }

        &--info {
          background-color: #3b82f6;
          color: white;

          &:hover {
            background-color: #2563eb;
          }
        }

        &--warning {
          background-color: #f59e0b;
          color: white;

          &:hover {
            background-color: #d97706;
          }
        }

        &--danger {
          background-color: #ef4444;
          color: white;

          &:hover {
            background-color: #dc2626;
          }
        }

        &--success {
          background-color: #22c55e;
          color: white;

          &:hover {
            background-color: #16a34a;
          }
        }
      }
    }

    // Dark mode support
    :host-context(.dark-mode) {
      .confirm-dialog {
        &__title {
          color: #f3f4f6;
        }

        &__message {
          color: #9ca3af;
        }

        &__btn--cancel {
          color: #9ca3af;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly variant: ConfirmDialogVariant;
  readonly iconName: string;

  private readonly defaultIcons: Record<ConfirmDialogVariant, string> = {
    info: 'info',
    warning: 'warning',
    danger: 'error',
    success: 'check_circle',
  };

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.variant = data.variant || 'info';
    this.iconName = data.icon || this.defaultIcons[this.variant];
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
