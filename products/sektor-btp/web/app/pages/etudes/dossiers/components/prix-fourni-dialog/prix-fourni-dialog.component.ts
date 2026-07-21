import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

export interface PrixFourniDialogData {
  code: string;
  libelle: string;
  unite?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
}

export interface PrixFourniDialogResult {
  prixUnitaire: number;
}

@Component({
  selector: 'app-prix-fourni-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Prix de vente du poste</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <p class="meta">
        <strong>{{ data.code }}</strong> — {{ data.libelle }}
      </p>
      <p class="hint">
        Saisissez un prix unitaire HT sans décomposition. Les frais généraux et la marge ne
        s’appliquent pas dans ce mode.
      </p>

      <nf-input
        label="Prix unitaire HT (MAD) *"
        type="number"
        [ngModel]="prix()"
        (ngModelChange)="prix.set($event)"
        required
      />

      <dl class="preview" aria-live="polite">
        <div>
          <dt>Quantité</dt>
          <dd>{{ data.quantite ?? '—' }} {{ data.unite || '' }}</dd>
        </div>
        <div class="preview__total">
          <dt>Total ligne HT</dt>
          <dd>{{ totalLigne() | number: '1.2-2' }} MAD</dd>
        </div>
      </dl>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canSave()" (clicked)="save()">Enregistrer</nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(28rem, 92vw);
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
      margin: 0;
      font-size: 0.875rem;
      overflow-wrap: anywhere;
    }
    .hint {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary);
    }
    .preview {
      margin: 0;
      display: grid;
      gap: 0.45rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      background: var(--nf-color-bg-subtle);
      font-variant-numeric: tabular-nums;
    }
    .preview div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.875rem;
    }
    .preview dt {
      margin: 0;
      color: var(--nf-color-text-secondary);
    }
    .preview dd {
      margin: 0;
      font-weight: 600;
    }
    .preview__total {
      padding-top: 0.45rem;
      border-top: 1px solid var(--nf-color-border);
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
})
export class PrixFourniDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<PrixFourniDialogComponent, PrixFourniDialogResult | null>,
  );
  readonly data = inject<PrixFourniDialogData>(MAT_DIALOG_DATA);

  readonly prix = signal(
    this.data.prixUnitaire != null && this.data.prixUnitaire > 0
      ? String(this.data.prixUnitaire)
      : '',
  );

  readonly totalLigne = computed(() => {
    const pu = this.parseNumber(this.prix());
    const q = Number(this.data.quantite ?? 0);
    if (!Number.isFinite(pu) || !Number.isFinite(q)) return 0;
    return Math.round(Math.max(0, pu) * Math.max(0, q) * 100) / 100;
  });

  canSave(): boolean {
    const pu = this.parseNumber(this.prix());
    return Number.isFinite(pu) && pu > 0;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({ prixUnitaire: this.parseNumber(this.prix()) });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
