import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@platform/lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import type { UniteOption } from '../../utils/unite-options.util';

export interface SousDetailDialogData {
  mode: 'create' | 'edit';
  /** Premier composant d’une décomposition encore vide — libellé du titre adapté. */
  premier?: boolean;
  uniteOptions: UniteOption[];
  initial?: {
    type?: DpuComposantType;
    designation?: string;
    unite?: string;
    quantite?: number;
    prixUnitaire?: number;
    sourcePrix?: string;
    offreFournisseurId?: string | null;
  };
}

export interface SousDetailDialogResult {
  type: DpuComposantType;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  sourcePrix?: string;
  offreFournisseurId?: string | null;
}

const SOURCES: { value: string; label: string }[] = [
  { value: 'MANUEL', label: 'Manuel' },
  { value: 'CONSULTE', label: 'Consulté (offre / catalogue)' },
  { value: 'CATALOGUE', label: 'Catalogue fournisseur' },
  { value: 'BIBLIOTHEQUE', label: 'Bibliothèque de prix' },
];

const TYPES: { value: DpuComposantType; label: string }[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'MAIN_DOEUVRE', label: 'Main-d’œuvre' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
];

@Component({
  selector: 'app-sous-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ title }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <label class="field">
        <span>Type *</span>
        <select name="type" [(ngModel)]="type">
          @for (t of types; track t.value) {
            <option [ngValue]="t.value">{{ t.label }}</option>
          }
        </select>
      </label>

      <label class="field">
        <span>Désignation *</span>
        <input
          #designationInput
          name="designation"
          type="text"
          [(ngModel)]="designation"
          autocomplete="off"
          required
          placeholder="Ex. Béton C25/30"
        />
      </label>

      <div class="grid-3">
        <label class="field">
          <span>Unité *</span>
          <select name="unite" [(ngModel)]="unite">
            <option value="">—</option>
            @for (u of data.uniteOptions; track u.code) {
              <option [ngValue]="u.code">{{ u.code }}</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Quantité *</span>
          <input name="quantite" type="number" step="any" min="0" [(ngModel)]="quantite" required />
        </label>
        <label class="field">
          <span>Prix unitaire *</span>
          <input
            name="prixUnitaire"
            type="number"
            step="any"
            min="0"
            [(ngModel)]="prixUnitaire"
            required
          />
        </label>
      </div>

      <label class="field">
        <span>Source du prix</span>
        <select name="sourcePrix" [(ngModel)]="sourcePrix">
          @for (s of sources; track s.value) {
            <option [ngValue]="s.value">{{ s.label }}</option>
          }
        </select>
      </label>

      <p class="total" aria-live="polite">
        Montant
        <strong>{{ montant | number: '1.2-2' }} MAD</strong>
      </p>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canSave()" (clicked)="save()">
          {{ data.mode === 'edit' ? 'Enregistrer' : 'Ajouter' }}
        </nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(32rem, 92vw);
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
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.875rem;
    }
    .field input,
    .field select {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-surface, #fff);
      color: var(--nf-color-text-primary, #1a1a1a);
    }
    .field input:focus,
    .field select:focus {
      outline: none;
      border-color: var(--nf-color-primary-600, #0b6e7a);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--nf-color-primary-600, #0b6e7a) 18%, transparent);
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.75rem;
    }
    .total {
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      background: var(--nf-color-bg-subtle, #f3f4f6);
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .grid-3 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SousDetailDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(
    MatDialogRef<SousDetailDialogComponent, SousDetailDialogResult | null>,
  );
  readonly data = inject<SousDetailDialogData>(MAT_DIALOG_DATA);
  private readonly designationInput = viewChild<ElementRef<HTMLInputElement>>('designationInput');

  readonly types = TYPES;
  readonly sources = SOURCES;
  type: DpuComposantType = this.data.initial?.type ?? 'MATIERE';
  designation = this.data.initial?.designation ?? '';
  unite = this.data.initial?.unite ?? this.data.uniteOptions[0]?.code ?? '';
  quantite = this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '1';
  prixUnitaire =
    this.data.initial?.prixUnitaire != null ? String(this.data.initial.prixUnitaire) : '0';
  sourcePrix = this.data.initial?.sourcePrix ?? 'MANUEL';
  offreFournisseurId = this.data.initial?.offreFournisseurId ?? null;

  get title(): string {
    if (this.data.mode === 'edit') return 'Modifier le composant';
    return this.data.premier ? 'Premier composant' : 'Ajouter un composant';
  }

  ngAfterViewInit(): void {
    // Focus natif (évite les pièges CVA / autoFocus Material sur le select).
    queueMicrotask(() => this.designationInput()?.nativeElement?.focus());
  }

  get montant(): number {
    const q = this.parseNumber(this.quantite);
    const pu = this.parseNumber(this.prixUnitaire);
    if (!Number.isFinite(q) || !Number.isFinite(pu)) return 0;
    return Math.round(Math.max(0, q) * Math.max(0, pu) * 100) / 100;
  }

  canSave(): boolean {
    if (!this.designation.trim() || !this.unite.trim()) return false;
    const q = this.parseNumber(this.quantite);
    const pu = this.parseNumber(this.prixUnitaire);
    return Number.isFinite(q) && q > 0 && Number.isFinite(pu) && pu >= 0;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      type: this.type,
      designation: this.designation.trim(),
      unite: this.unite.trim(),
      quantite: this.parseNumber(this.quantite),
      prixUnitaire: this.parseNumber(this.prixUnitaire),
      total: this.montant,
      sourcePrix: this.sourcePrix,
      offreFournisseurId: this.offreFournisseurId,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
