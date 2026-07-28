import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import {
  ButtonComponent,
  NfInputComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@lib/anatomy';

import type { DpuComposantType } from '@app/features/etudes/models';
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

const SOURCES: NfSelectOption[] = [
  { value: 'MANUEL', label: 'Manuel' },
  { value: 'CONSULTE', label: 'Consulté (offre / catalogue)' },
  { value: 'CATALOGUE', label: 'Catalogue fournisseur' },
  { value: 'BIBLIOTHEQUE', label: 'Bibliothèque de prix' },
];

const TYPES: NfSelectOption[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'MAIN_DOEUVRE', label: 'Main-d’œuvre' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
];

@Component({
  selector: 'app-sous-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    ButtonComponent,
    NfSelectComponent,
    NfInputComponent,
  ],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ title }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <nf-select
        label="Type"
        name="type"
        [options]="types"
        [(ngModel)]="type"
        [required]="true"
      />

      <nf-input
        id="sous-detail-designation"
        label="Désignation"
        name="designation"
        [(ngModel)]="designation"
        autocomplete="off"
        [required]="true"
        placeholder="Ex. Béton C25/30"
      />

      <div class="grid-3">
        <nf-select
          label="Unité"
          name="unite"
          [options]="uniteSelectOptions"
          [(ngModel)]="unite"
          [required]="true"
        />
        <nf-input
          label="Quantité"
          name="quantite"
          type="number"
          [(ngModel)]="quantite"
          [required]="true"
        />
        <nf-input
          label="Prix unitaire"
          name="prixUnitaire"
          type="number"
          [(ngModel)]="prixUnitaire"
          [required]="true"
        />
      </div>

      <nf-select
        label="Source du prix"
        name="sourcePrix"
        [options]="sources"
        [(ngModel)]="sourcePrix"
      />

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

  readonly types = TYPES;
  readonly sources = SOURCES;
  readonly uniteSelectOptions: NfSelectOption[] = [
    { value: '', label: '—' },
    ...this.data.uniteOptions.map((u) => ({ value: u.code, label: u.code })),
  ];

  type: string = this.data.initial?.type ?? 'MATIERE';
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
    // Focus désignation (évite les pièges CVA / autoFocus Material sur le select).
    queueMicrotask(() => document.getElementById('sous-detail-designation')?.focus());
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
      type: this.type as DpuComposantType,
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
