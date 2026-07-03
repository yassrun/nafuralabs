import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type { RetenueGarantie } from '../../models';

import { ButtonComponent, NfInputComponent, NfSelectComponent } from '@lib/anatomy';

export interface CautionBancaireDialogData {
  retenue: RetenueGarantie;
  banques: { id: string; nom: string }[];
}

export interface CautionBancaireDialogResult {
  banqueId: string;
  banque: string;
  montant: number;
  numero: string;
}

@Component({
  selector: 'app-caution-bancaire-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MadCurrencyPipe, MatDialogModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <p>Substitution par caution bancaire</p>
          <h2>{{ data.retenue.chantierCode }} · {{ data.retenue.clientName }}</h2>
        </div>
        <nf-button variant="ghost" icon="x" iconLibrary="lucide" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <div class="recap">
        <div class="recap__cell">
          <span class="recap__label">Retenue à substituer</span>
          <strong>{{ data.retenue.resteARelibererHt | mad }}</strong>
        </div>
      </div>

      <section class="form">
        <nf-select
          label="Banque *"
          [options]="banqueSelectOptions"
          [ngModel]="banqueId()"
          (ngModelChange)="onBanqueChange($event)" />

        <nf-input
          label="N° caution bancaire *"
          [ngModel]="numero()"
          (ngModelChange)="numero.set($event)"
          placeholder="CRG-BMCE-2026-0042" />

        <nf-input
          class="form__full"
          type="number"
          label="Montant (MAD) *"
          [ngModel]="montant()"
          (ngModelChange)="montant.set(toNumber($event))" />
      </section>

      <p class="hint">
        La retenue restera enregistrée mais sera marquée comme couverte par une caution bancaire.
        La libération à échéance déclenchera la restitution de la caution.
      </p>

      <footer>
        <nf-button (clicked)="close()" variant="secondary">Annuler</nf-button>
        <nf-button [disabled]="!canSave()" (clicked)="save()" variant="primary">
          Enregistrer la caution
        </nf-button>
      </footer>
    </div>
  `,
  styles: [
    `
      .dialog-shell {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        min-width: min(46rem, 92vw);
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      header p {
        margin: 0;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        color: var(--nf-color-text-secondary);
      }
      header h2 {
        margin: 0.35rem 0 0;
        color: var(--nf-text-primary);
        font-size: 1.1rem;
      }
      .recap {
        padding: 0.75rem;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
      }
      .recap__label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--nf-color-text-secondary);
        letter-spacing: 0.06em;
      }
      .recap__cell strong {
        font-size: 18px;
        color: var(--nf-color-primary-700);
        display: block;
        margin-top: 4px;
      }
      .form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .form__full {
        grid-column: 1 / -1;
      }
      .hint {
        margin: 0;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `,
  ],
})
export class CautionBancaireDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CautionBancaireDialogComponent, CautionBancaireDialogResult | null>,
  );
  readonly data = inject<CautionBancaireDialogData>(MAT_DIALOG_DATA);

  readonly banqueSelectOptions = this.data.banques.map((b) => ({ value: b.id, label: b.nom }));

  readonly banqueId = signal(this.data.retenue.cautionBanqueId ?? '');
  readonly numero = signal(this.data.retenue.cautionNumero ?? '');
  readonly montant = signal<number>(
    this.data.retenue.cautionMontant ?? this.data.retenue.resteARelibererHt,
  );

  toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  onBanqueChange(value: string): void {
    this.banqueId.set(value);
  }

  banqueNom(): string {
    return this.data.banques.find((b) => b.id === this.banqueId())?.nom ?? '';
  }

  canSave(): boolean {
    return (
      this.banqueId().length > 0 &&
      this.numero().trim().length > 0 &&
      this.montant() > 0
    );
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      banqueId: this.banqueId(),
      banque: this.banqueNom(),
      montant: this.montant(),
      numero: this.numero().trim(),
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
