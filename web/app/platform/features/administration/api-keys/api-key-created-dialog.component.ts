import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ToastService } from '@lib/anatomy';

@Component({
  selector: 'app-api-key-created-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="api-key-created">
      <h3>{{ 'administration.apiKeys.created.title' | translate }}</h3>
      <p class="api-key-created__warning">
        {{ 'administration.apiKeys.created.warning' | translate }}
      </p>

      <div class="api-key-created__field">
        <code>{{ plainKey() }}</code>
      </div>

      <div class="api-key-created__actions">
        <button type="button" (click)="copy()">{{ 'administration.apiKeys.created.copy' | translate }}</button>
        <button type="button" (click)="done.emit()">{{ 'administration.apiKeys.created.done' | translate }}</button>
      </div>
    </div>
  `,
  styles: [
    `
      .api-key-created {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .api-key-created__warning {
        margin: 0;
        color: var(--nf-color-warning-700, #92400e);
      }
      .api-key-created__field {
        border: 1px dashed var(--nf-border-default, #d1d5db);
        padding: 0.5rem;
        border-radius: 8px;
        overflow: auto;
      }
      .api-key-created__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      code {
        font-family: var(--nf-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      }
    `,
  ],
})
export class ApiKeyCreatedDialogComponent {
  readonly plainKey = input.required<string>();
  readonly done = output<void>();

  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  copy(): void {
    const value = this.plainKey();
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      this.toast.success(this.translate.instant('administration.apiKeys.created.copied'));
    });
  }
}
