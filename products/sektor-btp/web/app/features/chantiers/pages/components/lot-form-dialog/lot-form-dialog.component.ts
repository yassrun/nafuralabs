import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, NfInputComponent, NfSelectComponent, type NfSelectOption } from '@lib/anatomy';
import type { LotChantier } from '@app/features/chantiers/models';
import { BPU_UNITS } from '../../constants/bpu-units';
import { lotDepth, MAX_LOT_DEPTH } from '../../utils/lot-hierarchy.util';

export type LotFormMode = 'rootLot' | 'sousLot' | 'poste';

export interface LotFormDialogData {
  mode: LotFormMode;
  lots: LotChantier[];
  defaultParentLotId?: string;
  defaultTargetLotId?: string;
  isEdit?: boolean;
  initial?: {
    code?: string;
    designation?: string;
    quantite?: number;
    unite?: string;
    prixUnitaireHt?: number;
  };
}

export interface LotFormDialogResult {
  mode: LotFormMode;
  /** Technical code — omitted on create so the backend generates it. */
  code?: string;
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
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ titleKey() | translate }}</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" [attr.aria-label]="'common.close' | translate"></nf-button>
      </header>

      @if (data.mode === 'sousLot' && !data.isEdit) {
        <nf-select
          [label]="('chantiers.chantier.detail.lots.formParentLot' | translate) + ' *'"
          [placeholder]="'chantiers.chantier.detail.lots.formParentLotPlaceholder' | translate"
          [options]="parentLotOptions()"
          [ngModel]="parentLotId()"
          (ngModelChange)="parentLotId.set($event)"
        />
      }

      @if (data.mode === 'poste' && !data.isEdit) {
        <nf-select
          [label]="('chantiers.chantier.detail.lots.formTargetLot' | translate) + ' *'"
          [placeholder]="'chantiers.chantier.detail.lots.formTargetLotPlaceholder' | translate"
          [options]="targetLotOptions()"
          [ngModel]="targetLotId()"
          (ngModelChange)="targetLotId.set($event)"
        />
      }

      @if (data.isEdit && code()) {
        <nf-input
          [label]="'chantiers.chantier.detail.lots.promptCode' | translate"
          [ngModel]="code()"
          [disabled]="true">
        </nf-input>
        <p class="form-hint">{{ 'chantiers.chantier.detail.lots.technicalCodeHint' | translate }}</p>
      }

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

          <nf-select
            [label]="('chantiers.chantier.detail.lots.formUnite' | translate) + ' *'"
            [options]="uniteOptions"
            [ngModel]="unite()"
            (ngModelChange)="unite.set($event)"
          />
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
          {{ (data.isEdit ? 'chantiers.chantier.detail.lots.saveAction' : 'chantiers.chantier.detail.lots.addAction') | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(32rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header h2 { margin: 0; font-size: 1.125rem; color: var(--nf-text-primary); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-hint { margin: 0; font-size: 0.8125rem; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
  `],
})
export class LotFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LotFormDialogComponent, LotFormDialogResult | null>);
  readonly data = inject<LotFormDialogData>(MAT_DIALOG_DATA);

  readonly units = BPU_UNITS;
  readonly uniteOptions: NfSelectOption[] = BPU_UNITS.map((unit) => ({ value: unit, label: unit }));

  readonly code = signal(this.data.initial?.code ?? '');
  readonly designation = signal(this.data.initial?.designation ?? '');
  readonly quantite = signal(this.data.initial?.quantite != null ? String(this.data.initial.quantite) : '');
  readonly unite = signal<string>(this.data.initial?.unite ?? 'U');
  readonly prixUnitaireHt = signal(this.data.initial?.prixUnitaireHt != null ? String(this.data.initial.prixUnitaireHt) : '');
  readonly parentLotId = signal(this.data.defaultParentLotId ?? '');
  readonly targetLotId = signal(this.data.defaultTargetLotId ?? '');

  private readonly lotsById = computed(() => {
    const map = new Map<string, LotChantier>();
    for (const lot of this.data.lots) {
      map.set(lot.id, lot);
    }
    return map;
  });

  /** Parents allowed for a new sous-lot: any grouping node shallower than max depth. */
  readonly parentCandidates = computed(() => {
    const byId = this.lotsById();
    return [...this.data.lots]
      .filter((lot) => lotDepth(lot, byId) < MAX_LOT_DEPTH)
      .sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));
  });

  readonly allLots = computed(() =>
    [...this.data.lots].sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code)),
  );

  readonly parentLotOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: '—' },
    ...this.parentCandidates().map((lot) => ({ value: lot.id, label: this.lotLabel(lot) })),
  ]);

  readonly targetLotOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: '—' },
    ...this.allLots().map((lot) => ({ value: lot.id, label: this.lotLabel(lot) })),
  ]);

  readonly titleKey = computed(() => {
    if (this.data.isEdit) {
      switch (this.data.mode) {
        case 'sousLot':
          return 'chantiers.chantier.detail.lots.editSousLotTitle';
        case 'poste':
          return 'chantiers.chantier.detail.lots.editPosteTitle';
        default:
          return 'chantiers.chantier.detail.lots.editTitle';
      }
    }
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
    const depth = lotDepth(lot, this.lotsById());
    const prefix = depth > 0 ? `${' '.repeat(depth)}↳ ` : '';
    return `${prefix}${lot.designation}`;
  }

  canSave(): boolean {
    if (!this.designation().trim()) return false;

    if (this.data.mode === 'sousLot' && !this.data.isEdit && !this.parentLotId()) return false;

    if (this.data.mode === 'poste') {
      if (!this.data.isEdit && !this.targetLotId()) return false;
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
    const trimmedCode = this.code().trim();
    this.dialogRef.close({
      mode: this.data.mode,
      code: this.data.isEdit && trimmedCode ? trimmedCode : undefined,
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
