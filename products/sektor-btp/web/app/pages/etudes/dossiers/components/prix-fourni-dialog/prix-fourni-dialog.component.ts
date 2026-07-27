import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

export interface PrixFourniDialogData {
  code: string;
  libelle: string;
  unite?: string | null;
  quantite?: number | null;
  prixFourniBase?: number | null;
  fraisGenerauxPercent: number;
  margePercent: number;
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
        <h2>Coût fourni du poste</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <p class="meta">
        <strong>{{ data.code }}</strong> — {{ data.libelle }}
      </p>
      <p class="hint">
        Saisissez le coût unitaire fourni. Les frais généraux et la marge sont ensuite appliqués
        pour calculer le prix de vente HT.
      </p>

      <nf-input
        id="prix-fourni-input"
        label="Coût unitaire fourni (MAD)"
        name="prix"
        type="number"
        [(ngModel)]="prix"
        [required]="true"
      />

      <dl class="preview" aria-live="polite">
        <div>
          <dt>Coût fourni</dt>
          <dd>{{ coutFourni | number: '1.2-2' }} MAD</dd>
        </div>
        <div>
          <dt>Frais généraux ({{ data.fraisGenerauxPercent | number: '1.0-2' }} %)</dt>
          <dd>{{ fraisGeneraux | number: '1.2-2' }} MAD</dd>
        </div>
        <div>
          <dt>Marge ({{ data.margePercent | number: '1.0-2' }} %)</dt>
          <dd>{{ marge | number: '1.2-2' }} MAD</dd>
        </div>
        <div>
          <dt>Prix de vente unitaire HT</dt>
          <dd>{{ prixVenteHt | number: '1.2-2' }} MAD</dd>
        </div>
        <div class="preview__total">
          <dt>Total ligne HT</dt>
          <dd>{{ totalLigne | number: '1.2-2' }} MAD</dd>
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
export class PrixFourniDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(
    MatDialogRef<PrixFourniDialogComponent, PrixFourniDialogResult | null>,
  );
  readonly data = inject<PrixFourniDialogData>(MAT_DIALOG_DATA);

  prix =
    this.data.prixFourniBase != null && this.data.prixFourniBase > 0
      ? String(this.data.prixFourniBase)
      : '';

  ngAfterViewInit(): void {
    queueMicrotask(() => document.getElementById('prix-fourni-input')?.focus());
  }

  get coutFourni(): number {
    const value = this.parseNumber(this.prix);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  get fraisGeneraux(): number {
    return Math.round(this.coutFourni * (Math.max(0, this.data.fraisGenerauxPercent) / 100) * 100) / 100;
  }

  get marge(): number {
    return Math.round(this.coutFourni * (Math.max(0, this.data.margePercent) / 100) * 100) / 100;
  }

  get prixVenteHt(): number {
    return Math.round((this.coutFourni + this.fraisGeneraux + this.marge) * 100) / 100;
  }

  get totalLigne(): number {
    const q = Number(this.data.quantite ?? 0);
    if (!Number.isFinite(q)) return 0;
    return Math.round(this.prixVenteHt * Math.max(0, q) * 100) / 100;
  }

  canSave(): boolean {
    const pu = this.parseNumber(this.prix);
    return Number.isFinite(pu) && pu > 0;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({ prixUnitaire: this.parseNumber(this.prix) });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
