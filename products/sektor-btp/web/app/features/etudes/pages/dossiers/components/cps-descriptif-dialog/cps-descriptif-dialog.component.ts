import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@lib/anatomy';

export interface CpsDescriptifDialogData {
  code: string;
  libelle: string;
  texte: string;
  confiance?: number;
  sectionSourceId?: string | null;
}

@Component({
  selector: 'app-cps-descriptif-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <h2>Descriptif CPS — {{ data.code || '—' }}</h2>
          <p class="meta">{{ data.libelle }}</p>
          @if (data.confiance != null) {
            <p class="confiance">Confiance {{ (data.confiance * 100) | number: '1.0-0' }} %</p>
          }
        </div>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <div class="body" role="document">
        <pre>{{ data.texte }}</pre>
      </div>

      <footer>
        <nf-button variant="primary" (clicked)="close()">Fermer</nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(42rem, 92vw);
      max-width: 48rem;
      background: var(--nf-color-surface, #fff);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }
    header h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .meta {
      margin: 0.35rem 0 0;
      color: var(--nf-color-text-secondary, #6b7280);
      font-size: 0.875rem;
    }
    .confiance {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary, #6b7280);
    }
    .body {
      max-height: min(50vh, 28rem);
      overflow: auto;
      padding: 0.9rem 1rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      background: var(--nf-color-bg-subtle, #f8fafc);
    }
    .body pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font: inherit;
      font-size: 0.875rem;
      line-height: 1.45;
    }
    footer {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class CpsDescriptifDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CpsDescriptifDialogComponent, void>);
  readonly data = inject<CpsDescriptifDialogData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
