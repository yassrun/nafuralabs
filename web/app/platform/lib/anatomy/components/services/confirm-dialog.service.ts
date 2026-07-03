import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../organisms/confirm-dialog';
import { PromptDialogComponent, PromptDialogData, PromptField } from '../organisms/prompt-dialog';

/**
 * Prompt options (design-system replacement for native window.prompt).
 */
export interface PromptOptions {
  title: string;
  fields: PromptField[];
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
}

/**
 * Confirm options.
 */
export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  icon?: string;
}

/**
 * Confirm Dialog Service
 *
 * Service for showing confirmation dialogs.
 *
 * @example
 * const confirmed = await this.confirmDialog.confirm({
 *   title: 'Delete Item',
 *   message: 'Are you sure you want to delete this item? This action cannot be undone.',
 *   confirmLabel: 'Delete',
 *   variant: 'danger',
 *   icon: 'delete'
 * });
 *
 * if (confirmed) {
 *   await this.facade.deleteItem(id);
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  /**
   * Show a confirmation dialog.
   * @returns Promise that resolves to true if confirmed, false if cancelled.
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const config: MatDialogConfig<ConfirmDialogData> = {
      data: {
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        variant: options.variant,
        icon: options.icon,
      },
      disableClose: false,
      autoFocus: false,
      panelClass: 'nf-confirm-dialog-panel',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, config);
    const result = await firstValueFrom(dialogRef.afterClosed());

    return result === true;
  }

  /**
   * Show a prompt dialog with one or more text fields.
   * Design-system replacement for native window.prompt().
   * @returns Record of field values on confirm, or null on cancel.
   */
  async prompt(options: PromptOptions): Promise<Record<string, string> | null> {
    const config: MatDialogConfig<PromptDialogData> = {
      data: {
        title: options.title,
        fields: options.fields,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        icon: options.icon,
      },
      disableClose: false,
      autoFocus: true,
      panelClass: 'nf-confirm-dialog-panel',
    };

    const dialogRef = this.dialog.open(PromptDialogComponent, config);
    const result = await firstValueFrom(dialogRef.afterClosed());

    return result && typeof result === 'object' ? (result as Record<string, string>) : null;
  }

  /**
   * Show a delete confirmation dialog.
   * Convenience method for common delete confirmations.
   */
  async confirmDelete(itemName: string = 'this item'): Promise<boolean> {
    return this.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      icon: 'delete',
    });
  }

  /**
   * Show a discard changes confirmation dialog.
   * Convenience method for unsaved changes confirmations.
   */
  async confirmDiscard(): Promise<boolean> {
    return this.confirm({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmLabel: 'Discard',
      variant: 'danger',
      icon: 'warning',
    });
  }
}
