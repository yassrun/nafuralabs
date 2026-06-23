import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ToastComponent, ToastVariant, ToastData } from '../organisms/toast';

/**
 * Toast options.
 */
export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

/**
 * Toast Service
 *
 * Service for showing notification toasts.
 *
 * @example
 * this.toast.success('Item created successfully');
 * this.toast.error('Failed to save changes');
 * this.toast.show({
 *   message: 'Item deleted',
 *   variant: 'info',
 *   action: { label: 'Undo', callback: () => this.undo() }
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  /**
   * Show a toast with custom options.
   */
  show(options: ToastOptions): void {
    const config = this.buildConfig(options);
    const data: ToastData = {
      message: options.message,
      variant: options.variant || 'info',
      action: options.action,
    };

    this.snackBar.openFromComponent(ToastComponent, {
      ...config,
      data,
    });
  }

  /**
   * Show a success toast.
   */
  success(message: string, duration?: number): void {
    this.show({ message, variant: 'success', duration });
  }

  /**
   * Show an error toast.
   */
  error(message: string, duration?: number): void {
    this.show({ message, variant: 'danger', duration: duration || 5000 });
  }

  /**
   * Show a warning toast.
   */
  warning(message: string, duration?: number): void {
    this.show({ message, variant: 'warning', duration });
  }

  /**
   * Show an info toast.
   */
  info(message: string, duration?: number): void {
    this.show({ message, variant: 'info', duration });
  }

  /**
   * Dismiss all toasts.
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  private buildConfig(options: ToastOptions): MatSnackBarConfig {
    const config: MatSnackBarConfig = {
      duration: options.duration || 3000,
      panelClass: ['nf-toast-container'],
    };

    // Position mapping
    const position = options.position || 'bottom-right';

    switch (position) {
      case 'top-right':
        config.horizontalPosition = 'end';
        config.verticalPosition = 'top';
        break;
      case 'top-center':
        config.horizontalPosition = 'center';
        config.verticalPosition = 'top';
        break;
      case 'bottom-center':
        config.horizontalPosition = 'center';
        config.verticalPosition = 'bottom';
        break;
      case 'bottom-right':
      default:
        config.horizontalPosition = 'end';
        config.verticalPosition = 'bottom';
        break;
    }

    return config;
  }
}
