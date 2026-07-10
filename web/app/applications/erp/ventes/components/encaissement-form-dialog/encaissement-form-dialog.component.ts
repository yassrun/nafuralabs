import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type { Encaissement, FactureClient, ModeEncaissement } from '../../models';

import { ButtonComponent, IconComponent, NfInputComponent, NfSelectComponent, NfTextareaComponent } from '@lib/anatomy';

export interface EncaissementDialogData {
  facture: FactureClient;
  banques: { id: string; nom: string }[];
}

export type EncaissementDialogResult = Omit<
  Encaissement,
  'id' | 'factureId'
> | null;

const TODAY = new Date().toISOString().slice(0, 10);

const MODE_PAIEMENT_OPTIONS: { value: ModeEncaissement; label: string }[] = [
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'EFFET', label: 'Effet' },
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'COMPENSATION', label: 'Compensation' },
];

@Component({
  selector: 'app-encaissement-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MadCurrencyPipe, MatDialogModule, ButtonComponent, IconComponent, NfInputComponent, NfSelectComponent, NfTextareaComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <p>Enregistrer un encaissement</p>
          <h2>{{ data.facture.numero }} · {{ data.facture.clientName }}</h2>
        </div>
        <nf-button variant="ghost" icon="x" iconLibrary="lucide" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <div class="recap">
        <div class="recap__cell">
          <span class="recap__label">Net TTC</span>
          <strong>{{ data.facture.netAPayerTtc | mad:2 }}</strong>
        </div>
        <div class="recap__cell">
          <span class="recap__label">Déjà encaissé</span>
          <strong>{{ data.facture.cumulEncaisseTtc | mad:2 }}</strong>
        </div>
        <div class="recap__cell recap__cell--accent">
          <span class="recap__label">Reste TTC</span>
          <strong>{{ data.facture.resteTtc | mad:2 }}</strong>
        </div>
      </div>

      <section class="form">
        <nf-input
          type="date"
          label="Date encaissement *"
          [ngModel]="dateEncaissement()"
          (ngModelChange)="dateEncaissement.set($event)" />

        <nf-select
          label="Mode paiement *"
          [options]="modePaiementOptions"
          [ngModel]="modePaiement()"
          (ngModelChange)="modePaiement.set($event)" />

        <nf-input
          label="Référence (n° chèque, virement…)"
          [ngModel]="reference()"
          (ngModelChange)="reference.set($event)"
          placeholder="VIR-2026-0001" />

        <nf-select
          label="Banque"
          [options]="banqueSelectOptions"
          [ngModel]="banque()"
          (ngModelChange)="banque.set($event)" />

        <nf-input
          type="number"
          label="Montant TTC (MAD) *"
          [ngModel]="montantTtc()"
          (ngModelChange)="montantTtc.set(toNumber($event))" />

        <nf-textarea
          class="form__notes"
          label="Notes"
          rows="2"
          [ngModel]="notes()"
          (ngModelChange)="notes.set($event)" />
      </section>

      @if (warning()) {
        <div class="warning">
          <nf-icon name="warning-amber"></nf-icon>
          <span>{{ warning() }}</span>
        </div>
      }

      <footer>
        <nf-button (clicked)="close()" variant="secondary">Annuler</nf-button>
        <nf-button [disabled]="!canSave()" (clicked)="save()" variant="primary">
          Enregistrer
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
        min-width: min(48rem, 92vw);
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
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
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
      }
      .recap__cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .recap__label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--nf-color-text-secondary);
        letter-spacing: 0.06em;
      }
      .recap__cell--accent strong {
        color: var(--nf-color-primary-700);
      }
      .form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .form__notes {
        grid-column: 1 / -1;
      }
      .warning {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.75rem;
        border-radius: 6px;
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-700);
        font-size: 13px;
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `,
  ],
})
export class EncaissementFormDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<EncaissementFormDialogComponent, EncaissementDialogResult>,
  );
  readonly data = inject<EncaissementDialogData>(MAT_DIALOG_DATA);
  private readonly locale = inject(LOCALE_ID);

  readonly modePaiementOptions = MODE_PAIEMENT_OPTIONS;
  readonly banqueSelectOptions = [
    { value: '', label: '—' },
    ...this.data.banques.map((b) => ({ value: b.nom, label: b.nom })),
  ];

  readonly dateEncaissement = signal(TODAY);
  readonly modePaiement = signal<ModeEncaissement>('VIREMENT');
  readonly reference = signal('');
  readonly banque = signal('');
  readonly montantTtc = signal<number>(this.data.facture.resteTtc);
  readonly notes = signal('');

  toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  canSave(): boolean {
    return (
      this.dateEncaissement().length > 0 &&
      this.montantTtc() > 0 &&
      !!this.modePaiement()
    );
  }

  warning(): string | null {
    if (this.montantTtc() <= 0) return null;
    if (this.montantTtc() > this.data.facture.resteTtc) {
      return `Le montant saisi dépasse le reste à encaisser (${this.data.facture.resteTtc.toLocaleString(this.locale)} MAD).`;
    }
    return null;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      dateEncaissement: this.dateEncaissement(),
      modePaiement: this.modePaiement(),
      reference: this.reference().trim() || undefined,
      banque: this.banque().trim() || undefined,
      montantTtc: this.montantTtc(),
      notes: this.notes().trim() || undefined,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
