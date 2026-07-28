import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

import { DpuService } from '@app/features/etudes/services/dpu.service';

export interface PosteChiffrageDialogData {
  deboursSec: number;
  fraisGenerauxPercent: number;
  margePercent: number;
}

export interface PosteChiffrageDialogResult {
  fraisGenerauxPercent: number;
  margePercent: number;
}

@Component({
  selector: 'app-poste-chiffrage-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Paramètres de chiffrage</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <p class="hint">
        Les frais généraux et la marge s’appliquent au déboursé du poste, jamais aux sous-détails
        individuellement.
      </p>

      <div class="grid-2">
        <nf-input
          id="poste-chiffrage-fg"
          label="Frais généraux (%)"
          name="fg"
          type="number"
          [(ngModel)]="fg"
          [required]="true"
        />
        <nf-input
          label="Marge (%)"
          name="marge"
          type="number"
          [(ngModel)]="marge"
          [required]="true"
        />
      </div>

      <dl class="preview" aria-live="polite">
        <div>
          <dt>Déboursé sec</dt>
          <dd>{{ data.deboursSec | number: '1.2-2' }} MAD</dd>
        </div>
        <div>
          <dt>FG</dt>
          <dd>{{ fgAmount | number: '1.2-2' }} MAD</dd>
        </div>
        <div>
          <dt>Marge</dt>
          <dd>{{ margeAmount | number: '1.2-2' }} MAD</dd>
        </div>
        <div class="preview__total">
          <dt>Prix de vente HT</dt>
          <dd>{{ prixVente | number: '1.2-2' }} MAD</dd>
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
    .hint {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .preview {
      margin: 0;
      display: grid;
      gap: 0.5rem;
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
      padding-top: 0.5rem;
      border-top: 1px solid var(--nf-color-border);
      font-size: 1rem !important;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
})
export class PosteChiffrageDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(
    MatDialogRef<PosteChiffrageDialogComponent, PosteChiffrageDialogResult | null>,
  );
  private readonly dpuMath = inject(DpuService);
  readonly data = inject<PosteChiffrageDialogData>(MAT_DIALOG_DATA);

  fg = String(this.data.fraisGenerauxPercent ?? 0);
  marge = String(this.data.margePercent ?? 0);

  ngAfterViewInit(): void {
    queueMicrotask(() => document.getElementById('poste-chiffrage-fg')?.focus());
  }

  get prixVente(): number {
    return this.dpuMath.computePrixVenteHt(
      this.data.deboursSec,
      this.parseNumber(this.fg),
      this.parseNumber(this.marge),
    );
  }

  get fgAmount(): number {
    return Math.round(this.data.deboursSec * (this.parseNumber(this.fg) / 100) * 100) / 100;
  }

  get margeAmount(): number {
    return Math.round(this.data.deboursSec * (this.parseNumber(this.marge) / 100) * 100) / 100;
  }

  canSave(): boolean {
    const fg = this.parseNumber(this.fg);
    const mg = this.parseNumber(this.marge);
    return Number.isFinite(fg) && fg >= 0 && Number.isFinite(mg) && mg >= 0;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      fraisGenerauxPercent: this.parseNumber(this.fg),
      margePercent: this.parseNumber(this.marge),
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
