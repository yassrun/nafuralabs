import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import type { UniteOption } from '../../utils/unite-options.util';

export interface SousDetailDialogData {
  mode: 'create' | 'edit';
  uniteOptions: UniteOption[];
  initial?: {
    type?: DpuComposantType;
    designation?: string;
    unite?: string;
    quantite?: number;
    prixUnitaire?: number;
  };
}

export interface SousDetailDialogResult {
  type: DpuComposantType;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

const TYPES: { value: DpuComposantType; label: string }[] = [
  { value: 'MATIERE', label: 'Matière' },
  { value: 'MAIN_DOEUVRE', label: 'Main-d’œuvre' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
];

@Component({
  selector: 'app-sous-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ data.mode === 'edit' ? 'Modifier le sous-détail' : 'Ajouter un sous-détail' }}</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <label class="field">
        <span>Type *</span>
        <select [ngModel]="type()" (ngModelChange)="type.set($event)">
          @for (t of types; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
      </label>

      <nf-input
        label="Désignation *"
        [ngModel]="designation()"
        (ngModelChange)="designation.set($event)"
        required
      />

      <div class="grid-3">
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
        <nf-input
          label="Prix unitaire *"
          type="number"
          [ngModel]="prixUnitaire()"
          (ngModelChange)="prixUnitaire.set($event)"
          required
        />
      </div>

      <p class="total" aria-live="polite">
        Montant
        <strong>{{ total() | number: '1.2-2' }} MAD</strong>
      </p>

      @if (erreur(); as message) {
        <p class="erreur" role="alert">{{ message }}</p>
      }

      <footer>
        <nf-button variant="secondary" [disabled]="saving()" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canSave() || saving()" (clicked)="save()">
          {{ saving() ? 'Enregistrement…' : data.mode === 'edit' ? 'Enregistrer' : 'Ajouter' }}
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
      background: var(--nf-color-bg-subtle);
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
    }
    .erreur {
      margin: 0;
      padding: 0.65rem 0.8rem;
      border: 1px solid var(--nf-color-danger-600);
      border-radius: 6px;
      font-size: 0.8125rem;
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
export class SousDetailDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<SousDetailDialogComponent, SousDetailDialogResult | null>,
  );
  readonly data = inject<SousDetailDialogData>(MAT_DIALOG_DATA);

  readonly types = TYPES;
  readonly type = signal<DpuComposantType>(this.data.initial?.type ?? 'MATIERE');
  readonly designation = signal(this.data.initial?.designation ?? '');
  readonly unite = signal(this.data.initial?.unite ?? this.data.uniteOptions[0]?.code ?? '');
  readonly quantite = signal(
    this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '1',
  );
  readonly prixUnitaire = signal(
    this.data.initial?.prixUnitaire != null ? String(this.data.initial.prixUnitaire) : '0',
  );
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly total = computed(() => {
    const q = this.parseNumber(this.quantite());
    const pu = this.parseNumber(this.prixUnitaire());
    if (!Number.isFinite(q) || !Number.isFinite(pu)) return 0;
    return Math.round(Math.max(0, q) * Math.max(0, pu) * 100) / 100;
  });

  canSave(): boolean {
    if (!this.designation().trim() || !this.unite().trim()) return false;
    const q = this.parseNumber(this.quantite());
    const pu = this.parseNumber(this.prixUnitaire());
    return Number.isFinite(q) && q > 0 && Number.isFinite(pu) && pu >= 0;
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    this.dialogRef.close({
      type: this.type(),
      designation: this.designation().trim(),
      unite: this.unite().trim(),
      quantite: this.parseNumber(this.quantite()),
      prixUnitaire: this.parseNumber(this.prixUnitaire()),
      total: this.total(),
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
