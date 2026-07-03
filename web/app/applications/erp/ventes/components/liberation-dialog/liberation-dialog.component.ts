import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type { RetenueGarantie } from '../../models';

import { ButtonComponent, NfInputComponent, NfTextareaComponent } from '@lib/anatomy';

export interface LiberationDialogData {
  retenue: RetenueGarantie;
  /** "demande" : passage en LIBERATION_DEMANDEE, "marquer" : passage en LIBEREE */
  action: 'demande' | 'marquer';
}

export interface LiberationDialogResult {
  notes?: string;
  dateLiberation?: string;
}

@Component({
  selector: 'app-liberation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MadCurrencyPipe, MatDialogModule, ButtonComponent, NfInputComponent, NfTextareaComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <p>{{ action === 'demande' ? 'Demande de libération' : 'Marquer libérée' }}</p>
          <h2>{{ data.retenue.chantierCode }} · {{ data.retenue.clientName }}</h2>
        </div>
        <nf-button variant="ghost" icon="x" iconLibrary="lucide" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <div class="recap">
        <div class="recap__cell">
          <span class="recap__label">Retenue cumulée</span>
          <strong>{{ data.retenue.cumulRetenueHt | mad }}</strong>
        </div>
        <div class="recap__cell">
          <span class="recap__label">Déjà libéré</span>
          <strong>{{ data.retenue.cumulLibereHt | mad }}</strong>
        </div>
        <div class="recap__cell recap__cell--accent">
          <span class="recap__label">Reste à libérer</span>
          <strong>{{ data.retenue.resteARelibererHt | mad }}</strong>
        </div>
      </div>

      @if (action === 'marquer') {
        <nf-input
          type="date"
          label="Date de libération *"
          [ngModel]="dateLiberation()"
          (ngModelChange)="dateLiberation.set($event)" />
      }

      <nf-textarea
        label="Notes / commentaire"
        rows="3"
        [ngModel]="notes()"
        (ngModelChange)="notes.set($event)"
        [placeholder]="action === 'demande' ? 'Référence demande, pièce jointe…' : 'Référence virement, échéance…'" />

      <p class="hint">
        @if (action === 'demande') {
          Un document de demande de libération sera généré automatiquement et adressé au maître d'ouvrage.
        } @else {
          La libération sera enregistrée et déclenchera le mouvement comptable correspondant (mock V1).
        }
      </p>

      <footer>
        <nf-button (clicked)="close()" variant="secondary">Annuler</nf-button>
        <nf-button [disabled]="!canSave()" (clicked)="save()" variant="primary">
          {{ action === 'demande' ? 'Émettre la demande' : 'Marquer libérée' }}
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
export class LiberationDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<LiberationDialogComponent, LiberationDialogResult | null>,
  );
  readonly data = inject<LiberationDialogData>(MAT_DIALOG_DATA);
  readonly action = this.data.action;

  readonly notes = signal('');
  readonly dateLiberation = signal(new Date().toISOString().slice(0, 10));

  canSave(): boolean {
    if (this.action === 'marquer') {
      return this.dateLiberation().length > 0;
    }
    return true;
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({
      notes: this.notes().trim() || undefined,
      dateLiberation:
        this.action === 'marquer' ? this.dateLiberation() : undefined,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
