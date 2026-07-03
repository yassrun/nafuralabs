import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button';

/**
 * One text field of a prompt dialog.
 */
export interface PromptField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  initial?: string;
}

/**
 * Prompt dialog options.
 */
export interface PromptDialogData {
  title: string;
  fields: PromptField[];
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
}

/**
 * Prompt Dialog Component
 *
 * Design-system replacement for native window.prompt(). Opened via
 * ConfirmDialogService.prompt(). Returns a Record of field values on confirm,
 * or null on cancel.
 */
@Component({
  selector: 'nf-prompt-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-prompt-dialog">
      <div class="nf-prompt-dialog__header">
        @if (data.icon) {
          <mat-icon class="nf-prompt-dialog__icon">{{ data.icon }}</mat-icon>
        }
        <h2 class="nf-prompt-dialog__title">{{ data.title | translate }}</h2>
      </div>

      <div class="nf-prompt-dialog__body">
        @for (f of data.fields; track f.key) {
          <label class="nf-prompt-dialog__label" [attr.for]="'nf-pf-' + f.key">{{ f.label | translate }}</label>
          <input
            class="nf-prompt-dialog__input"
            [id]="'nf-pf-' + f.key"
            [(ngModel)]="values[f.key]"
            [placeholder]="(f.placeholder || '') | translate"
            (keyup.enter)="onConfirm()"
          />
        }
      </div>

      <div class="nf-prompt-dialog__footer">
        <nf-button variant="secondary" (clicked)="onCancel()">{{ (data.cancelLabel || 'Cancel') | translate }}</nf-button>
        <nf-button variant="primary" (clicked)="onConfirm()">{{ (data.confirmLabel || 'OK') | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-prompt-dialog { width: 420px; max-width: 100%; }
    .nf-prompt-dialog__header {
      display: flex; align-items: center; gap: 12px; padding: 24px 24px 0;
    }
    .nf-prompt-dialog__icon {
      font-size: 28px; width: 28px; height: 28px; color: var(--nf-color-primary, #1b3fae);
    }
    .nf-prompt-dialog__title {
      margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--nf-text-primary, #111827);
    }
    .nf-prompt-dialog__body {
      padding: 16px 24px; display: flex; flex-direction: column; gap: 6px;
    }
    .nf-prompt-dialog__label {
      font-size: 0.8125rem; font-weight: 500; color: var(--nf-text-secondary, #6b7280); margin-top: 8px;
    }
    .nf-prompt-dialog__input {
      width: 100%; height: 38px; padding: 0 12px; font-size: 0.875rem;
      border: 1px solid var(--nf-border-default, #e5e7eb); border-radius: 8px;
      background: var(--nf-color-surface, #fff); color: var(--nf-text-primary, #111827);
      box-sizing: border-box;
    }
    .nf-prompt-dialog__input:focus {
      outline: none; border-color: var(--nf-color-primary, #1b3fae);
      box-shadow: 0 0 0 3px var(--nf-color-primary-100, #dce2f6);
    }
    .nf-prompt-dialog__footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 24px;
    }
  `],
})
export class PromptDialogComponent {
  private dialogRef = inject(MatDialogRef<PromptDialogComponent>);
  data = inject<PromptDialogData>(MAT_DIALOG_DATA);
  values: Record<string, string> = {};

  constructor() {
    for (const f of this.data.fields) {
      this.values[f.key] = f.initial ?? '';
    }
  }

  private isValid(): boolean {
    return this.data.fields.every((f) => !f.required || (this.values[f.key] || '').trim().length > 0);
  }

  onConfirm(): void {
    if (!this.isValid()) return;
    const out: Record<string, string> = {};
    for (const f of this.data.fields) {
      out[f.key] = (this.values[f.key] || '').trim();
    }
    this.dialogRef.close(out);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
