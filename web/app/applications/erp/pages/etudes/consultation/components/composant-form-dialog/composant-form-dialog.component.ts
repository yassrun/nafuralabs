import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@lib/anatomy';

import type { ComposantInput, ConsultationComposant } from '../../models';

export interface ComposantFormDialogData {
  mode: 'add' | 'edit';
  composant?: ConsultationComposant;
}

const TYPES = ['MATERIAU', 'SERVICE', 'LOCATION', 'MO', 'SOUS_TRAITANCE'];

@Component({
  selector: 'app-composant-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ data.mode === 'edit' ? 'Modifier le composant' : 'Ajouter un composant' }}</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <label class="field">
        <span>Désignation *</span>
        <input type="text" [(ngModel)]="designation" autocomplete="off" />
      </label>

      <div class="grid-2">
        <label class="field">
          <span>Type</span>
          <select [(ngModel)]="type">
            @for (tp of types; track tp) {
              <option [value]="tp">{{ tp }}</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Unité</span>
          <input type="text" [(ngModel)]="unite" />
        </label>
      </div>

      <div class="grid-2">
        <label class="field">
          <span>Quantité</span>
          <input type="number" [(ngModel)]="quantite" step="any" />
        </label>
        <label class="field">
          <span>Prix unitaire</span>
          <input type="number" [(ngModel)]="prixUnitaire" step="any" />
        </label>
      </div>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!designation.trim()" (clicked)="save()">
          {{ data.mode === 'edit' ? 'Enregistrer' : 'Ajouter' }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(32rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header h2 { margin: 0; font-size: 1.125rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .field input, .field select {
      padding: 0.625rem 0.75rem; border: 1px solid var(--nf-color-border);
      border-radius: 8px; font: inherit; background: var(--nf-color-surface);
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `],
})
export class ComposantFormDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<ComposantFormDialogComponent, ComposantInput | null>);
  readonly data = inject<ComposantFormDialogData>(MAT_DIALOG_DATA);

  readonly types = TYPES;
  designation = this.data.composant?.designation ?? '';
  type = this.data.composant?.type ?? 'MATERIAU';
  unite = this.data.composant?.unite ?? '';
  quantite =
    this.data.composant?.quantite != null
      ? String(this.data.composant.quantite)
      : this.data.composant?.quantiteIndicative != null
        ? String(this.data.composant.quantiteIndicative)
        : '';
  prixUnitaire =
    this.data.composant?.prixUnitaire != null ? String(this.data.composant.prixUnitaire) : '';

  save(): void {
    if (!this.designation.trim()) return;
    const q = this.quantite !== '' ? Number(this.quantite) : undefined;
    this.dialogRef.close({
      designation: this.designation.trim(),
      type: this.type,
      unite: this.unite.trim() || undefined,
      quantite: q,
      quantiteIndicative: q,
      prixUnitaire: this.prixUnitaire !== '' ? Number(this.prixUnitaire) : undefined,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
