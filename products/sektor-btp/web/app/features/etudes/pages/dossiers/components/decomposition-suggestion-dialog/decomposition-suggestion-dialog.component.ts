import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@lib/anatomy';

import type {
  DecompositionComposantMatched,
  DecompositionComposantMissing,
  DecompositionPropose,
} from '../../services/dossier-etude-api.service';
import {
  CreateMissingItemDialogComponent,
  type CreateMissingItemDialogResult,
} from '../create-missing-item-dialog/create-missing-item-dialog.component';

export interface DecompositionSuggestionDialogData {
  code: string;
  libelle: string;
  propose: DecompositionPropose;
  uniteOptions: { code: string; id?: string }[];
}

export interface DecompositionSuggestionDialogResult {
  selected: DecompositionComposantMatched[];
}

@Component({
  selector: 'app-decomposition-suggestion-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <div>
          <h2>Composants proposés — {{ data.code || '—' }}</h2>
          <p class="meta">{{ data.libelle }}</p>
        </div>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      @if (matched().length === 0 && missing().length === 0) {
        <p class="empty">Aucun composant exploitable détecté pour ce poste.</p>
      }

      @if (matched().length > 0) {
        <section aria-labelledby="matched-title">
          <h3 id="matched-title">Catalogue (consultables)</h3>
          <ul class="list">
            @for (row of matched(); track row.itemId + row.name; let i = $index) {
              <li>
                <label class="row">
                  <input
                    type="checkbox"
                    [ngModel]="selected()[i]"
                    (ngModelChange)="toggle(i, $event)"
                  />
                  <span class="main">
                    <strong>{{ row.name }}</strong>
                    <span class="sub">
                      {{ row.type }} · {{ row.rendement | number: '1.2-4' }}
                      {{ row.unite }} · {{ row.prixUnitaire | number: '1.2-2' }} MAD
                      ({{ row.sourcePrix }})
                    </span>
                  </span>
                </label>
              </li>
            }
          </ul>
        </section>
      }

      @if (missing().length > 0) {
        <section aria-labelledby="missing-title">
          <h3 id="missing-title">Absents du catalogue</h3>
          <p class="hint">
            Créez l’article et renseignez un prix avant de pouvoir l’ajouter à la décomposition.
          </p>
          <ul class="list">
            @for (row of missing(); track row.designation + $index; let i = $index) {
              <li class="missing-row">
                <span class="main">
                  <strong>{{ row.designation }}</strong>
                  <span class="sub">
                    {{ row.type }} · {{ row.rendement | number: '1.2-4' }} {{ row.unite }}
                  </span>
                </span>
                <nf-button variant="secondary" size="sm" (clicked)="creerManquant(i)">
                  Créer dans le catalogue
                </nf-button>
              </li>
            }
          </ul>
        </section>
      }

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button
          variant="primary"
          [disabled]="selectedCount() === 0"
          (clicked)="confirm()"
        >
          Ajouter {{ selectedCount() }} composant{{ selectedCount() > 1 ? 's' : '' }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(40rem, 94vw);
      max-width: 46rem;
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
    .meta,
    .hint,
    .empty {
      margin: 0.35rem 0 0;
      color: var(--nf-color-text-secondary, #6b7280);
      font-size: 0.875rem;
    }
    h3 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .row,
    .missing-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.7rem 0.8rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
    }
    .missing-row {
      justify-content: space-between;
      align-items: center;
    }
    .main {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }
    .sub {
      font-size: 0.8rem;
      color: var(--nf-color-text-secondary, #6b7280);
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
})
export class DecompositionSuggestionDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<
      DecompositionSuggestionDialogComponent,
      DecompositionSuggestionDialogResult | null
    >,
  );
  private readonly dialog = inject(MatDialog);
  readonly data = inject<DecompositionSuggestionDialogData>(MAT_DIALOG_DATA);

  readonly matched = signal<DecompositionComposantMatched[]>([...(this.data.propose.matched ?? [])]);
  readonly missing = signal<DecompositionComposantMissing[]>([...(this.data.propose.missing ?? [])]);
  readonly selected = signal<boolean[]>(this.matched().map(() => true));

  selectedCount(): number {
    return this.selected().filter(Boolean).length;
  }

  toggle(index: number, value: boolean): void {
    const next = [...this.selected()];
    next[index] = value;
    this.selected.set(next);
  }

  async creerManquant(index: number): Promise<void> {
    const row = this.missing()[index];
    if (!row) return;
    const ref = this.dialog.open(CreateMissingItemDialogComponent, {
      width: '28rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        designation: row.designation,
        type: row.type,
        unite: row.unite,
        rendement: row.rendement,
        uniteOptions: this.data.uniteOptions,
      },
    });
    const created = (await firstValueFrom(ref.afterClosed())) as CreateMissingItemDialogResult | null;
    if (!created) return;

    const added: DecompositionComposantMatched = {
      type: created.type,
      itemId: created.itemId,
      code: created.code,
      name: created.name,
      unite: created.unite,
      rendement: row.rendement,
      prixUnitaire: created.prixUnitaire,
      sourcePrix: created.sourcePrix,
      confiance: row.confiance,
      suggereParIa: true,
    };
    this.matched.update((list) => [...list, added]);
    this.selected.update((flags) => [...flags, true]);
    this.missing.update((list) => list.filter((_, i) => i !== index));
  }

  confirm(): void {
    const selected = this.matched().filter((_, i) => this.selected()[i]);
    if (!selected.length) return;
    this.dialogRef.close({ selected });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
