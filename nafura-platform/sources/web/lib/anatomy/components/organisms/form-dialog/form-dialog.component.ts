import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button';
import type { FormFieldConfig } from '../../../types';
import { FormComponent } from '../form';

export interface FormDialogData {
  title: string;
  fields: FormFieldConfig[];
  values?: Record<string, unknown>;
}

/** A configured form in a dialog; closes with the values, or nothing on cancel. Opened by ConfirmDialogService.form(). */
@Component({
  selector: 'nf-form-dialog',
  standalone: true,
  imports: [MatDialogModule, TranslateModule, FormComponent],
  template: `
    <div class="nf-form-dialog" [class.nf-form-dialog--wide]="columns > 1">
      <h2 class="nf-form-dialog__title">{{ data.title | translate }}</h2>
      <nf-form [fields]="data.fields" [values]="values" [columns]="columns" (submit)="dialogRef.close($event)" (cancel)="dialogRef.close()" />
    </div>
  `,
  styles: [`
    .nf-form-dialog { width: 480px; max-width: 100%; max-height: calc(100dvh - 4rem); overflow-y: auto; padding: 24px; box-sizing: border-box; }
    .nf-form-dialog--wide { width: 720px; }
    .nf-form-dialog__title { margin: 0 0 20px; font-size: 1.25rem; font-weight: 600; color: var(--nf-text-primary, #111827); }
  `],
})
export class FormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<FormDialogComponent>);
  readonly data = inject<FormDialogData>(MAT_DIALOG_DATA);
  readonly values = this.data.values ?? {};
  /** Long forms use two columns so the actions stay within reach. */
  readonly columns = this.data.fields.length > 6 ? 2 : 1;
}

export interface SecretDialogData {
  title: string;
  message: string;
  value: string;
}

/** Shows a secret once (API key, signing secret) with a copy button. Opened by ConfirmDialogService.reveal(). */
@Component({
  selector: 'nf-secret-dialog',
  standalone: true,
  imports: [MatDialogModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-form-dialog">
      <h2 class="nf-form-dialog__title">{{ data.title | translate }}</h2>
      <p class="nf-secret-dialog__message">{{ data.message | translate }}</p>
      <code class="nf-secret-dialog__value">{{ data.value }}</code>
      <div class="nf-secret-dialog__footer">
        <nf-button variant="secondary" icon="copy" (clicked)="copy()">{{ (copied() ? 'Copied' : 'Copy') | translate }}</nf-button>
        <nf-button variant="primary" (clicked)="dialogRef.close()">{{ 'Close' | translate }}</nf-button>
      </div>
    </div>
  `,
  styles: [`
    .nf-form-dialog { width: 480px; max-width: 100%; padding: 24px; box-sizing: border-box; }
    .nf-form-dialog__title { margin: 0 0 12px; font-size: 1.25rem; font-weight: 600; color: var(--nf-text-primary, #111827); }
    .nf-secret-dialog__message { margin: 0 0 16px; color: var(--nf-color-warning-800, #92400e); font-size: 0.875rem; }
    .nf-secret-dialog__value {
      display: block; padding: 12px; border-radius: 8px; word-break: break-all; white-space: pre-wrap; max-height: 50vh; overflow: auto;
      background: var(--nf-surface-subtle, #f3f4f6); font-family: var(--nf-font-family-mono, ui-monospace, monospace); font-size: 0.875rem;
    }
    .nf-secret-dialog__footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `],
})
export class SecretDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SecretDialogComponent>);
  readonly data = inject<SecretDialogData>(MAT_DIALOG_DATA);
  readonly copied = signal(false);

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.data.value);
    this.copied.set(true);
  }
}
