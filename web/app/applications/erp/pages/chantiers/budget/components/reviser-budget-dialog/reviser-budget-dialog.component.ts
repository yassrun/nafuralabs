import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, NfInputComponent, NfTextareaComponent } from '@lib/anatomy';

import type { BudgetRevisionDraft, ChantierBudget } from '../../models';

interface ReviserBudgetDialogData {
  chantier: ChantierBudget;
}

@Component({
  selector: 'app-reviser-budget-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MadCurrencyPipe,
    MatDialogModule,
    ButtonComponent,
    NfInputComponent,
    NfTextareaComponent,
    TranslateModule,
  ],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <p>{{ 'chantiers.budget.reviser.title' | translate }}</p>
          <h2>{{ data.chantier.code }} · {{ data.chantier.name }}</h2>
        </div>
        <nf-button variant="ghost" icon="x" (clicked)="close()" [attr.aria-label]="'common.close' | translate"></nf-button>
      </header>

      <section class="grid">
        <div class="row row--head">
          <span>Rubrique</span>
          <span>{{ 'chantiers.budget.reviser.before' | translate }}</span>
          <span>{{ 'chantiers.budget.reviser.after' | translate }}</span>
        </div>
        @for (line of lines(); track line.rubrique) {
          <div class="row">
            <span>{{ line.label }}</span>
            <strong>{{ line.before | mad }}</strong>
            <input type="number" min="0" class="row-input" [ngModel]="line.after" (ngModelChange)="updateValue(line.rubrique, $event)" />
          </div>
        }
      </section>

      <div class="delta">{{ 'chantiers.budget.reviser.deltaTotal' | translate }} {{ delta() | mad }}</div>

      <nf-textarea
        label="Motif *"
        [rows]="3"
        [ngModel]="motif()"
        (ngModelChange)="motif.set($event)">
      </nf-textarea>

      <nf-input
        [label]="'chantiers.budget.reviser.piece' | translate"
        placeholder="avenant.pdf"
        [ngModel]="pieceName()"
        (ngModelChange)="pieceName.set($event)">
      </nf-input>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">{{ 'chantiers.budget.reviser.cancel' | translate }}</nf-button>
        <nf-button variant="primary" [disabled]="!canSave()" (clicked)="save()">{{ 'chantiers.budget.reviser.save' | translate }}</nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(52rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header p { margin: 0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.08em; color: var(--nf-color-text-secondary); }
    header h2 { margin: 0.35rem 0 0; color: var(--nf-text-primary); }
    .grid { display: grid; gap: 0.5rem; }
    .row { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem; align-items: center; }
    .row--head { font-size: 0.78rem; text-transform: uppercase; color: var(--nf-color-text-secondary); letter-spacing: 0.08em; }
    .row-input { width: 100%; border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 0.7rem 0.85rem; }
    .delta { padding: 0.85rem 1rem; border-radius: 0.75rem; background: var(--nf-color-bg-muted); color: var(--nf-text-primary); font-weight: 700; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
  `],
})
export class ReviserBudgetDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ReviserBudgetDialogComponent, BudgetRevisionDraft | null>);
  readonly data = inject<ReviserBudgetDialogData>(MAT_DIALOG_DATA);

  readonly lines = signal(
    this.data.chantier.lignes.map((line) => ({
      rubrique: line.rubrique,
      label: line.label,
      before: line.reviseHt,
      after: line.reviseHt,
    }))
  );
  readonly motif = signal('');
  readonly pieceName = signal('');

  delta(): number {
    return this.lines().reduce((sum, line) => sum + (line.after - line.before), 0);
  }

  canSave(): boolean {
    return this.motif().trim().length > 0;
  }

  updateValue(rubrique: string, value: number | string | null): void {
    const nextValue = Number(value ?? 0);
    this.lines.update((current) => current.map((line) => line.rubrique === rubrique ? { ...line, after: nextValue } : line));
  }

  save(): void {
    this.dialogRef.close({
      chantierId: this.data.chantier.id,
      motif: this.motif().trim(),
      pieceName: this.pieceName().trim() || undefined,
      lignes: this.lines().map((line) => ({ rubrique: line.rubrique, reviseHt: line.after })),
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
