import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import {
  ButtonComponent,
  NfInputComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@lib/anatomy';

import type { UniteOption } from '../../utils/unite-options.util';

export type BordereauNoeudType = 'LOT' | 'SOUS_LOT' | 'ARTICLE';
export type BordereauNoeudMode = 'create' | 'edit';
export type BordereauNoeudPlacement = 'root' | 'child' | 'sibling';

export interface BordereauNoeudDialogData {
  mode: BordereauNoeudMode;
  placement: BordereauNoeudPlacement;
  /** Types autorisés pour le sélecteur (create) ou type figé (edit). */
  allowedTypes: BordereauNoeudType[];
  defaultType: BordereauNoeudType;
  uniteOptions: UniteOption[];
  initial?: {
    type?: string;
    code?: string;
    libelle?: string;
    unite?: string | null;
    quantite?: number | null;
  };
}

export interface BordereauNoeudDialogResult {
  type: BordereauNoeudType;
  code: string;
  libelle: string;
  unite?: string | null;
  quantite?: number | null;
}

@Component({
  selector: 'app-bordereau-noeud-dialog',
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

      @if (data.mode === 'create' && data.allowedTypes.length > 1) {
        <nf-select
          label="Type"
          name="type"
          [options]="typeOptions"
          [(ngModel)]="type"
          [required]="true"
        />
      } @else {
        <p class="type-badge">{{ typeLabel(type) }}</p>
      }

      <nf-input
        label="Code"
        name="code"
        [(ngModel)]="code"
        autocomplete="off"
        [required]="true"
      />

      <nf-input
        label="Libellé"
        name="libelle"
        [(ngModel)]="libelle"
        autocomplete="off"
        [required]="true"
      />

      @if (type === 'ARTICLE') {
        <div class="grid-2">
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
        </div>
      } @else {
        <p class="hint">Nœud de regroupement — sans unité ni quantité.</p>
      }

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
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .type-badge {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--nf-color-text-secondary);
    }
    .hint {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary);
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
  `,
})
export class BordereauNoeudDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<BordereauNoeudDialogComponent, BordereauNoeudDialogResult | null>,
  );
  readonly data = inject<BordereauNoeudDialogData>(MAT_DIALOG_DATA);

  /** nf-select values are strings — keep as string union via assignment. */
  type: string =
    (this.data.initial?.type?.toUpperCase() as BordereauNoeudType) ?? this.data.defaultType;
  code = this.data.initial?.code ?? '';
  libelle = this.data.initial?.libelle ?? '';
  unite = this.data.initial?.unite ?? '';
  quantite = this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '';

  readonly typeOptions: NfSelectOption[] = this.data.allowedTypes.map((t) => ({
    value: t,
    label: this.typeLabel(t),
  }));

  readonly uniteSelectOptions: NfSelectOption[] = [
    { value: '', label: '—' },
    ...this.data.uniteOptions.map((u) => ({ value: u.code, label: u.code })),
  ];

  get title(): string {
    if (this.data.mode === 'edit') return 'Modifier le nœud';
    switch (this.data.placement) {
      case 'child':
        return 'Ajouter un nœud enfant';
      case 'sibling':
        return 'Ajouter un nœud au même niveau';
      default:
        return 'Ajouter un lot';
    }
  }

  typeLabel(t: string): string {
    switch (t) {
      case 'LOT':
        return 'Lot';
      case 'SOUS_LOT':
        return 'Sous-lot';
      default:
        return 'Article';
    }
  }

  canSave(): boolean {
    if (!this.code.trim() || !this.libelle.trim()) return false;
    if (this.type === 'ARTICLE') {
      if (!this.unite.trim()) return false;
      const q = this.parseNumber(this.quantite);
      if (!Number.isFinite(q) || q <= 0) return false;
    }
    return true;
  }

  save(): void {
    if (!this.canSave()) return;
    const isArticle = this.type === 'ARTICLE';
    this.dialogRef.close({
      type: this.type as BordereauNoeudType,
      code: this.code.trim(),
      libelle: this.libelle.trim(),
      unite: isArticle ? this.unite.trim() : null,
      quantite: isArticle ? this.parseNumber(this.quantite) : null,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}

/** Types autorisés pour un enfant du parent donné. */
export function childTypesFor(parentType: string | undefined): BordereauNoeudType[] {
  const t = (parentType ?? '').toUpperCase();
  if (t === 'LOT' || t === 'SOUS_LOT') return ['SOUS_LOT', 'ARTICLE'];
  return [];
}

/** Type par défaut pour un enfant. */
export function defaultChildType(parentType: string | undefined): BordereauNoeudType {
  return (parentType ?? '').toUpperCase() === 'LOT' ? 'SOUS_LOT' : 'ARTICLE';
}

/** Types pour un sibling (même niveau). */
export function siblingTypesFor(currentType: string | undefined): BordereauNoeudType[] {
  const t = (currentType ?? 'ARTICLE').toUpperCase() as BordereauNoeudType;
  if (t === 'LOT') return ['LOT'];
  if (t === 'SOUS_LOT') return ['SOUS_LOT', 'ARTICLE'];
  return ['ARTICLE', 'SOUS_LOT'];
}
