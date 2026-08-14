import { Component, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '../atoms/button';
import type { ButtonVariant } from '../atoms/button';

// ─── Dialog Data ─────────────────────────────────────────────────────────────

export interface StatusTransitionDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ButtonVariant;
  requireNote: boolean;
  notePlaceholder: string;
}

export interface StatusTransitionDialogResult {
  confirmed: boolean;
  note?: string;
}

// ─── Dialog Component ─────────────────────────────────────────────────────────

@Component({
  selector: 'nf-status-transition-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="nf-std">
      <div class="nf-std__header">
        <h2 class="nf-std__title">{{ data.title }}</h2>
      </div>

      <div class="nf-std__body">
        <p class="nf-std__message">{{ data.message }}</p>

        @if (data.requireNote) {
          <div class="nf-std__note">
            <label class="nf-std__note-label" for="transitionNote">
              Motif / Note <span class="nf-std__required">*</span>
            </label>
            <textarea
              id="transitionNote"
              class="nf-std__textarea"
              [(ngModel)]="note"
              [placeholder]="data.notePlaceholder"
              rows="3">
            </textarea>
          </div>
        }
      </div>

      <div class="nf-std__footer">
        <nf-button variant="ghost" (clicked)="onCancel()">
          {{ data.cancelLabel }}
        </nf-button>
        <nf-button
          [variant]="data.variant"
          [disabled]="data.requireNote && !note.trim()"
          (clicked)="onConfirm()">
          {{ data.confirmLabel }}
        </nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-std {
      width: 440px;
      max-width: 100%;
      padding: 0;
    }
    .nf-std__header {
      padding: 20px 24px 0;
    }
    .nf-std__title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--nf-text-primary);
    }
    .nf-std__body {
      padding: 12px 24px 16px;
    }
    .nf-std__message {
      margin: 0 0 16px;
      color: var(--nf-text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .nf-std__note {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nf-std__note-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--nf-text-primary);
    }
    .nf-std__required {
      color: var(--nf-color-danger);
      margin-left: 2px;
    }
    .nf-std__textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card);
      resize: vertical;
      outline: none;
      transition: border-color 0.15s;
    }
    .nf-std__textarea:focus {
      border-color: var(--nf-color-primary);
    }
    .nf-std__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 24px 20px;
      border-top: 1px solid var(--nf-border-subtle);
    }
  `],
})
export class StatusTransitionDialogComponent {
  readonly data: StatusTransitionDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StatusTransitionDialogComponent, StatusTransitionDialogResult>);

  note = '';

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true, note: this.note.trim() || undefined });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface StatusTransitionDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  requireNote?: boolean;
  notePlaceholder?: string;
}

/**
 * Status Transition Dialog Service
 *
 * Opens a confirmation dialog (with optional note/reason field)
 * for status transition actions. Status changes must never go through
 * the PATCH update route — they require user intent.
 *
 * @example
 * const result = await this.statusTransitionDialog.open({
 *   title: 'Valider la réception ?',
 *   message: 'Le stock sera mis à jour.',
 *   confirmLabel: 'Valider',
 *   variant: 'primary',
 * });
 * if (result.confirmed) {
 *   await facade.executeTransition(id, 'validate', { note: result.note });
 * }
 */
@Injectable({ providedIn: 'root' })
export class StatusTransitionDialogService {
  private readonly dialog = inject(MatDialog);

  async open(options: StatusTransitionDialogOptions): Promise<StatusTransitionDialogResult> {
    const data: StatusTransitionDialogData = {
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Confirmer',
      cancelLabel: options.cancelLabel ?? 'Annuler',
      variant: options.variant ?? 'primary',
      requireNote: options.requireNote ?? false,
      notePlaceholder: options.notePlaceholder ?? 'Saisissez un motif...',
    };

    const config: MatDialogConfig<StatusTransitionDialogData> = {
      data,
      disableClose: true,
      autoFocus: false,
      panelClass: 'nf-status-transition-dialog-panel',
    };

    const dialogRef = this.dialog.open<
      StatusTransitionDialogComponent,
      StatusTransitionDialogData,
      StatusTransitionDialogResult
    >(StatusTransitionDialogComponent, config);

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result ?? { confirmed: false };
  }
}
