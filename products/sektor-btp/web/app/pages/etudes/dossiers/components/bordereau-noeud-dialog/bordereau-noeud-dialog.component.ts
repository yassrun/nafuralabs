import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

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
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ title() }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      @if (data.mode === 'create' && data.allowedTypes.length > 1) {
        <label class="field">
          <span>Type *</span>
          <select [ngModel]="type()" (ngModelChange)="onTypeChange($event)">
            @for (t of data.allowedTypes; track t) {
              <option [value]="t">{{ typeLabel(t) }}</option>
            }
          </select>
        </label>
      } @else {
        <p class="type-badge">{{ typeLabel(type()) }}</p>
      }

      <nf-input
        label="Code *"
        [ngModel]="code()"
        (ngModelChange)="code.set($event)"
        required
      />

      <nf-input
        label="Libellé *"
        [ngModel]="libelle()"
        (ngModelChange)="libelle.set($event)"
        required
      />

      @if (type() === 'ARTICLE') {
        <div class="grid-2">
          <label class="field">
            <span>Unité *</span>
            <select [ngModel]="unite()" (ngModelChange)="unite.set($event)">
              <option value="">—</option>
              @for (u of data.uniteOptions; track u.code) {
                <option [value]="u.code">{{ u.code }}</option>
              }
            </select>
          </label>
          <nf-input
            label="Quantité *"
            type="number"
            [ngModel]="quantite()"
            (ngModelChange)="quantite.set($event)"
            required
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
    .field select {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--nf-color-border, var(--nf-border-default));
      border-radius: 8px;
      font: inherit;
      background: var(--nf-color-bg-subtle, var(--nf-color-surface));
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

  readonly type = signal<BordereauNoeudType>(
    (this.data.initial?.type?.toUpperCase() as BordereauNoeudType) ?? this.data.defaultType,
  );
  readonly code = signal(this.data.initial?.code ?? '');
  readonly libelle = signal(this.data.initial?.libelle ?? '');
  readonly unite = signal(this.data.initial?.unite ?? '');
  readonly quantite = signal(
    this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '',
  );

  readonly title = computed(() => {
    if (this.data.mode === 'edit') return 'Modifier le nœud';
    switch (this.data.placement) {
      case 'child':
        return 'Ajouter un nœud enfant';
      case 'sibling':
        return 'Ajouter un nœud au même niveau';
      default:
        return 'Ajouter un lot';
    }
  });

  typeLabel(t: BordereauNoeudType): string {
    switch (t) {
      case 'LOT':
        return 'Lot';
      case 'SOUS_LOT':
        return 'Sous-lot';
      default:
        return 'Article';
    }
  }

  onTypeChange(value: string): void {
    this.type.set(value as BordereauNoeudType);
  }

  canSave(): boolean {
    if (!this.code().trim() || !this.libelle().trim()) return false;
    if (this.type() === 'ARTICLE') {
      if (!this.unite().trim()) return false;
      const q = this.parseNumber(this.quantite());
      if (!Number.isFinite(q) || q <= 0) return false;
    }
    return true;
  }

  save(): void {
    if (!this.canSave()) return;
    const isArticle = this.type() === 'ARTICLE';
    this.dialogRef.close({
      type: this.type(),
      code: this.code().trim(),
      libelle: this.libelle().trim(),
      unite: isArticle ? this.unite().trim() : null,
      quantite: isArticle ? this.parseNumber(this.quantite()) : null,
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
