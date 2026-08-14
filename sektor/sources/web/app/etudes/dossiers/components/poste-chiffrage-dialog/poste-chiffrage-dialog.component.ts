import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@platform/lib/anatomy';

import { DpuService } from '@app/etudes/services/dpu.service';

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
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
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
        <label class="field">
          <span>Frais généraux (%) *</span>
          <input #fgInput name="fg" type="number" step="any" min="0" [(ngModel)]="fg" required />
        </label>
        <label class="field">
          <span>Marge (%) *</span>
          <input name="marge" type="number" step="any" min="0" [(ngModel)]="marge" required />
        </label>
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.875rem;
    }
    .field input {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
    }
    .field input:focus {
      outline: none;
      border-color: var(--nf-color-primary-600, #0b6e7a);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 18%, transparent);
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
  private readonly fgInput = viewChild<ElementRef<HTMLInputElement>>('fgInput');

  fg = String(this.data.fraisGenerauxPercent ?? 0);
  marge = String(this.data.margePercent ?? 0);

  ngAfterViewInit(): void {
    queueMicrotask(() => this.fgInput()?.nativeElement?.focus());
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
