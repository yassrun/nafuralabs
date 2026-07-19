import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@lib/anatomy';

import type { ConsultationNoeud, NoeudCreate, NoeudType, NoeudUpdate } from '../../models';

export interface NoeudFormDialogData {
  mode: 'add' | 'edit';
  type: NoeudType;
  parentId?: string | null;
  noeud?: ConsultationNoeud;
}

export type NoeudFormResult = (NoeudCreate | NoeudUpdate) & { type?: NoeudType };

const TYPE_LABELS: Record<NoeudType, string> = {
  LOT: 'Lot',
  SOUS_LOT: 'Sous-lot',
  POSTE: 'Poste',
};

@Component({
  selector: 'app-noeud-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>
          {{ data.mode === 'edit' ? 'Modifier' : 'Ajouter' }}
          {{ typeLabel }}
        </h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <label class="field">
        <span>Libellé *</span>
        <input type="text" [(ngModel)]="libelle" autocomplete="off" />
      </label>

      <div class="grid-2">
        <label class="field">
          <span>Code</span>
          <input type="text" [(ngModel)]="code" autocomplete="off" />
        </label>
        @if (data.type === 'POSTE') {
          <label class="field">
            <span>Unité</span>
            <input type="text" [(ngModel)]="unite" autocomplete="off" placeholder="m3, kg…" />
          </label>
        }
      </div>

      @if (data.type === 'POSTE') {
        <label class="field">
          <span>Quantité</span>
          <input type="number" [(ngModel)]="quantite" step="any" />
        </label>
        <label class="field">
          <span>Descriptif</span>
          <textarea rows="4" [(ngModel)]="descriptif" placeholder="Descriptif technique du poste…"></textarea>
        </label>
      }

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!libelle.trim()" (clicked)="save()">
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
    .field input, .field textarea {
      padding: 0.625rem 0.75rem; border: 1px solid var(--nf-color-border);
      border-radius: 8px; font: inherit; background: var(--nf-color-surface);
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `],
})
export class NoeudFormDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<NoeudFormDialogComponent, NoeudFormResult | null>);
  readonly data = inject<NoeudFormDialogData>(MAT_DIALOG_DATA);

  readonly typeLabel = TYPE_LABELS[this.data.type];
  libelle = this.data.noeud?.libelle ?? '';
  code = this.data.noeud?.code ?? '';
  unite = this.data.noeud?.unite ?? '';
  quantite = this.data.noeud?.quantite != null ? String(this.data.noeud.quantite) : '';
  descriptif = this.data.noeud?.descriptif ?? '';

  save(): void {
    if (!this.libelle.trim()) return;
    const base = {
      libelle: this.libelle.trim(),
      code: this.code.trim() || undefined,
      unite: this.data.type === 'POSTE' ? this.unite.trim() || undefined : undefined,
      quantite:
        this.data.type === 'POSTE' && this.quantite !== ''
          ? Number(this.quantite)
          : undefined,
      descriptif:
        this.data.type === 'POSTE' ? this.descriptif.trim() || undefined : undefined,
    };
    if (this.data.mode === 'add') {
      this.dialogRef.close({
        ...base,
        type: this.data.type,
        parentId: this.data.parentId ?? null,
      });
    } else {
      this.dialogRef.close(base);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
