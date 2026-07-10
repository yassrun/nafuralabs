import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button';

/**
 * Confirm dialog options.
 */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  icon?: string;
}

/**
 * Confirm Dialog Component
 *
 * Confirmation prompt (opened via ConfirmDialogService).
 */
@Component({
  selector: 'nf-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-confirm-dialog">
      <div class="nf-confirm-dialog__header">
        @if (data.icon) {
          <mat-icon
            class="nf-confirm-dialog__icon"
            [class.nf-confirm-dialog__icon--danger]="data.variant === 'danger'"
          >{{ data.icon }}</mat-icon>
        }
        <h2 class="nf-confirm-dialog__title">{{ data.title | translate }}</h2>
      </div>

      <div class="nf-confirm-dialog__body">
        <p class="nf-confirm-dialog__message">{{ data.message | translate }}</p>
      </div>

      <div class="nf-confirm-dialog__footer">
        <nf-button
          variant="secondary"
          (clicked)="onCancel()"
        >{{ (data.cancelLabel || 'Cancel') | translate }}</nf-button>
        <nf-button
          [variant]="data.variant === 'danger' ? 'danger' : 'primary'"
          (clicked)="onConfirm()"
        >{{ (data.confirmLabel || 'Confirm') | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-confirm-dialog {
      width: 400px;
      max-width: 100%;
    }

    .nf-confirm-dialog__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0;
    }

    .nf-confirm-dialog__icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--nf-color-primary, #1976d2);
    }

    .nf-confirm-dialog__icon--danger {
      color: var(--nf-color-danger, #d32f2f);
    }

    .nf-confirm-dialog__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-confirm-dialog__body {
      padding: 16px 24px;
    }

    .nf-confirm-dialog__message {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #666);
      line-height: 1.5;
    }

    .nf-confirm-dialog__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
    }
  `],
})
export class ConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
