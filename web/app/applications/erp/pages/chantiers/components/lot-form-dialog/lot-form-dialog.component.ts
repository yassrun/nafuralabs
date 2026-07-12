import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';
import type { LotChantier } from '@applications/erp/chantiers/models';
import { BPU_UNITS } from '../../constants/bpu-units';

export type LotFormMode = 'rootLot' | 'sousLot' | 'poste';

export interface LotFormDialogData {
  mode: LotFormMode;
  lots: LotChantier[];
  defaultParentLotId?: string;
  defaultTargetLotId?: string;
}

export interface LotFormDialogResult {
  mode: LotFormMode;
  code: string;
  designation: string;
  quantite?: number;
  unite?: string;
  prixUnitaireHt?: number;
  parentLotId?: string;
  targetLotId?: string;
}

@Component({
  selector: 'app-lot-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ titleKey() | translate }}</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" [attr.aria-label]="'common.close' | translate"></nf-button>
      </header>

      @if (data.mode === 'sousLot') {
        <label class="field">
          <span>{{ 'chantiers.chantier.detail.lots.formParentLot' | translate }} *</span>
          <select [ngModel]="parentLotId()" (ngModelChange)="parentLotId.set($event)">
            <option value="">{{ 'chantiers.chantier.detail.lots.formParentLotPlaceholder' | translate }}</option>
            @for (lot of rootLots(); track lot.id) {
              <option [value]="lot.id">{{ lot.code }} — {{ lot.designation }}</option>
            }
          </select>
        </label>
      }

      @if (data.mode === 'poste') {
        <label class="field">
          <span>{{ 'chantiers.chantier.detail.lots.formTargetLot' | translate }} *</span>
          <select [ngModel]="targetLotId()" (ngModelChange)="targetLotId.set($event)">
            <option value="">{{ 'chantiers.chantier.detail.lots.formTargetLotPlaceholder' | translate }}</option>
            @for (lot of allLots(); track lot.id) {
              <option [value]="lot.id">{{ lotLabel(lot) }}</option>
            }
          </select>
        </label>
      }

      <nf-input
        [label]="'chantiers.chantier.detail.lots.promptCode' | translate"
        [ngModel]="code()"
        (ngModelChange)="code.set($event)"
        required>
      </nf-input>

      <nf-input
        [label]="'chantiers.chantier.detail.lots.promptDesignation' | translate"
        [ngModel]="designation()"
        (ngModelChange)="designation.set($event)"
        required>
      </nf-input>

      @if (data.mode === 'poste') {
        <div class="grid-2">
          <nf-input
            [label]="'chantiers.chantier.detail.lots.promptQuantite' | translate"
            type="number"
            [ngModel]="quantite()"
            (ngModelChange)="quantite.set($event)"
            required>
          </nf-input>

          <label class="field">
            <span>{{ 'chantiers.chantier.detail.lots.formUnite' | translate }} *</span>
            <select [ngModel]="unite()" (ngModelChange)="unite.set($event)">
              @for (unit of units; track unit) {
                <option [value]="unit">{{ unit }}</option>
              }
            </select>
          </label>
        </div>

        <nf-input
          [label]="'chantiers.chantier.detail.lots.promptPrixUnitaireHt' | translate"
          type="number"
          [ngModel]="prixUnitaireHt()"
          (ngModelChange)="prixUnitaireHt.set($event)"
          required>
        </nf-input>
      } @else {
        <p class="form-hint">{{ 'chantiers.chantier.detail.lots.groupHint' | translate }}</p>
      }

      <footer>
        <nf-button variant="secondary" (clicked)="close()">{{ 'chantiers.chantier.detail.cancel' | translate }}</nf-button>
        <nf-button variant="primary" [disabled]="!canSave()" (clicked)="save()">
          {{ 'chantiers.chantier.detail.lots.addAction' | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(32rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header h2 { margin: 0; font-size: 1.125rem; color: var(--nf-text-primary); }
    .field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .field select {
      padding: 0.625rem 0.75rem; border: 1px solid var(--nf-border-default);
      border-radius: 8px; font: inherit; background: var(--nf-color-surface);
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-hint { margin: 0; font-size: 0.8125rem; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
  `],
})
export class LotFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LotFormDialogComponent, LotFormDialogResult | null>);
  readonly data = inject<LotFormDialogData>(MAT_DIALOG_DATA);

  readonly units = BPU_UNITS;

  readonly code = signal('');
  readonly designation = signal('');
  readonly quantite = signal('');
  readonly unite = signal<string>('U');
  readonly prixUnitaireHt = signal('');
  readonly parentLotId = signal(this.data.defaultParentLotId ?? '');
  readonly targetLotId = signal(this.data.defaultTargetLotId ?? '');

  readonly rootLots = computed(() =>
    [...this.data.lots]
      .filter((lot) => !lot.parentLotId)
      .sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code)),
  );

  readonly allLots = computed(() =>
    [...this.data.lots].sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code)),
  );

  readonly titleKey = computed(() => {
    switch (this.data.mode) {
      case 'sousLot':
        return 'chantiers.chantier.detail.lots.addSousLotTitle';
      case 'poste':
        return 'chantiers.chantier.detail.lots.addPosteTitle';
      default:
        return 'chantiers.chantier.detail.lots.addTitle';
    }
  });

  lotLabel(lot: LotChantier): string {
    const prefix = lot.parentLotId ? '↳ ' : '';
    return `${prefix}${lot.code} — ${lot.designation}`;
  }

  canSave(): boolean {
    // Common: a code and a designation are always required.
    if (!this.code().trim() || !this.designation().trim()) return false;

    if (this.data.mode === 'sousLot' && !this.parentLotId()) return false;

    // Quantité / unité / prix are only meaningful for a poste (article).
    // A lot or sous-lot is a grouping whose amount is the sum of its postes.
    if (this.data.mode === 'poste') {
      if (!this.targetLotId()) return false;
      if (!this.unite().trim()) return false;
      const q = this.parseNumber(this.quantite());
      const pu = this.parseNumber(this.prixUnitaireHt());
      if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(pu) || pu < 0) return false;
    }

    return true;
  }

  save(): void {
    if (!this.canSave()) return;
    const isPoste = this.data.mode === 'poste';
    this.dialogRef.close({
      mode: this.data.mode,
      code: this.code().trim(),
      designation: this.designation().trim(),
      quantite: isPoste ? this.parseNumber(this.quantite()) : undefined,
      unite: isPoste ? this.unite().trim() : undefined,
      prixUnitaireHt: isPoste ? this.parseNumber(this.prixUnitaireHt()) : undefined,
      parentLotId: this.data.mode === 'sousLot' ? this.parentLotId() : undefined,
      targetLotId: isPoste ? this.targetLotId() : undefined,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private parseNumber(value: string): number {
    return Number.parseFloat(String(value).replace(',', '.'));
  }
}
