/**
 * Confirm Dialog Service
 * 
 * A service to easily open confirmation dialogs throughout the application.
 * Provides convenient methods for common dialog types (confirm, info, warning, success).
 * 
 * @example
 * // Confirmation with danger variant
 * const confirmed = await this.confirmDialog.confirm({
 *   title: 'Delete Item',
 *   message: 'Are you sure you want to delete this item?',
 *   confirmText: 'Delete',
 * });
 * 
 * @example
 * // Simple info dialog
 * await this.confirmDialog.info('Success', 'Your changes have been saved.');
 * 
 * @example
 * // Warning dialog
 * const proceed = await this.confirmDialog.warning(
 *   'Unsaved Changes',
 *   'You have unsaved changes. Discard them?'
 * );
 */

import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogVariant } from './confirm-dialog.component';

export interface ConfirmOptions {
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button text (default: 'Confirm') */
  confirmText?: string;
  /** Cancel button text (default: 'Cancel') */
  cancelText?: string;
  /** Dialog variant (default: 'danger' for confirm) */
  variant?: ConfirmDialogVariant;
  /** Custom icon (Material icon name) */
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open a custom confirmation dialog
   * @returns Promise<boolean> - true if confirmed, false if cancelled
   */
  async open(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'confirm-dialog-panel',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }

  /**
   * Show a confirmation dialog (danger variant by default)
   * Use for destructive or important actions requiring user confirmation.
   * 
   * @param options - Dialog configuration
   * @returns Promise<boolean> - true if user confirms, false if cancelled
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    return this.open({
      variant: options.variant || 'danger',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      showCancel: true,
      icon: options.icon,
    });
  }

  /**
   * Show an info dialog (info variant)
   * Use for informational messages that only need acknowledgment.
   * 
   * @param title - Dialog title
   * @param message - Dialog message
   * @param confirmText - Button text (default: 'OK')
   */
  async info(title: string, message: string, confirmText: string = 'OK'): Promise<void> {
    await this.open({
      variant: 'info',
      title,
      message,
      confirmText,
      showCancel: false,
    });
  }

  /**
   * Show a warning dialog (warning variant)
   * Use for warnings that may need user decision.
   * 
   * @param title - Dialog title
   * @param message - Dialog message
   * @param confirmText - Confirm button text (default: 'Proceed')
   * @param cancelText - Cancel button text (default: 'Cancel')
   * @returns Promise<boolean> - true if user proceeds, false if cancelled
   */
  async warning(title: string, message: string, confirmText: string = 'Proceed', cancelText: string = 'Cancel'): Promise<boolean> {
    return this.open({
      variant: 'warning',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
    });
  }

  /**
   * Show a success dialog (success variant)
   * Use to confirm successful operations.
   * 
   * @param title - Dialog title
   * @param message - Dialog message
   * @param confirmText - Button text (default: 'OK')
   */
  async success(title: string, message: string, confirmText: string = 'OK'): Promise<void> {
    await this.open({
      variant: 'success',
      title,
      message,
      confirmText,
      showCancel: false,
    });
  }

  /**
   * Show a danger/error dialog (danger variant)
   * Use for error messages or critical warnings.
   * 
   * @param title - Dialog title
   * @param message - Dialog message
   * @param confirmText - Button text (default: 'OK')
   */
  async danger(title: string, message: string, confirmText: string = 'OK'): Promise<void> {
    await this.open({
      variant: 'danger',
      title,
      message,
      confirmText,
      showCancel: false,
    });
  }
}
