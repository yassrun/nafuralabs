import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@platform/lib/anatomy';

import type {
  DecompositionComposantIncertain,
  DecompositionComposantMatched,
  DecompositionComposantMissing,
  DecompositionPropose,
} from '../../services/dossier-etude-api.service';
import {
  CreateMissingItemDialogComponent,
  type CreateMissingItemDialogResult,
  type CreateMissingItemMode,
} from '../create-missing-item-dialog/create-missing-item-dialog.component';

export interface DecompositionSuggestionDialogData {
  code: string;
  libelle: string;
  propose: DecompositionPropose;
  uniteOptions: { code: string; id?: string }[];
}

export interface DecompositionSuggestionDialogResult {
  selected: DecompositionComposantMatched[];
  regenerate?: boolean;
}

@Component({
  selector: 'app-decomposition-suggestion-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="decomp-suggest">
      <header class="decomp-suggest__header">
        <div>
          <h2>Composants proposés — {{ data.code || '—' }}</h2>
          <p class="decomp-suggest__meta">{{ data.libelle }}</p>
        </div>
        <div class="decomp-suggest__header-actions">
          <nf-button variant="ghost" size="sm" (clicked)="regenerate()">
            Actualiser IA
          </nf-button>
          <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
        </div>
      </header>

      <div class="decomp-suggest__body">
        @if (matched().length === 0 && missing().length === 0 && uncertain().length === 0) {
          <p class="decomp-suggest__empty">Aucun composant exploitable détecté pour ce poste.</p>
        }

        @if (matched().length > 0) {
          <section aria-labelledby="matched-title">
            <h3 id="matched-title">Déjà sur le tenant</h3>
            <p class="decomp-suggest__hint">Identité déjà liée — pas de création.</p>
            <ul class="decomp-suggest__list">
              @for (row of matched(); track trackMatched($index, row); let i = $index) {
                <li>
                  <label class="decomp-suggest__matched">
                    <input
                      type="checkbox"
                      [ngModel]="selected()[i]"
                      (ngModelChange)="toggle(i, $event)"
                    />
                    <span class="decomp-suggest__info">
                      <strong>{{ row.name }}</strong>
                      <span class="decomp-suggest__sub">
                        {{ row.type }} · {{ row.rendement | number: '1.2-4' }}
                        {{ row.unite }}
                        @if (row.cleStable) {
                          · {{ row.cleStable }}
                        }
                        @if (row.prixUnitaire != null) {
                          · {{ row.prixUnitaire | number: '1.2-2' }} MAD ({{ row.sourcePrix }})
                        } @else {
                          · identité liée, sans tarif
                        }
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
            <h3 id="missing-title">À créer</h3>
            <p class="decomp-suggest__hint">
              Proposition seulement — Extraire n’écrit pas tout seul. Confirmez pour créer, ou ajoutez au poste.
            </p>
            <ul class="decomp-suggest__list">
              @for (row of missing(); track row.designation + $index; let i = $index) {
                <li class="decomp-suggest__card">
                  <div class="decomp-suggest__info">
                    <strong>{{ row.designation }}</strong>
                    <span class="decomp-suggest__sub">
                      {{ row.type }} · {{ row.rendement | number: '1.2-4' }} {{ row.unite }}
                      @if (row.cleStable) {
                        · identité {{ row.cleStable }}
                      }
                    </span>
                  </div>
                  <div class="decomp-suggest__actions">
                    <nf-button variant="secondary" size="sm" (clicked)="ajouterAuPoste(i)">
                      Ajouter au poste
                    </nf-button>
                    <nf-button variant="ghost" size="sm" (clicked)="creerCatalogue(i)">
                      Créer dans le catalogue
                    </nf-button>
                  </div>
                </li>
              }
            </ul>
          </section>
        }

        @if (uncertain().length > 0) {
          <section aria-labelledby="uncertain-title">
            <h3 id="uncertain-title">Identité incertaine</h3>
            <p class="decomp-suggest__hint">
              Plusieurs identités possibles — pas de lien ni de création automatique.
            </p>
            <ul class="decomp-suggest__list">
              @for (row of uncertain(); track row.designation + $index) {
                <li class="decomp-suggest__card">
                  <div class="decomp-suggest__info">
                    <strong>{{ row.designation }}</strong>
                    <span class="decomp-suggest__sub">
                      {{ row.type }} · {{ row.rendement | number: '1.2-4' }} {{ row.unite }}
                      @if (row.identitesCandidates?.length) {
                        · {{ row.identitesCandidates.join(', ') }}
                      }
                    </span>
                  </div>
                </li>
              }
            </ul>
          </section>
        }
      </div>

      <footer class="decomp-suggest__footer">
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button
          variant="primary"
          [disabled]="pendingCount() === 0"
          (clicked)="confirm()"
        >
          Ajouter {{ pendingCount() }} composant{{ pendingCount() > 1 ? 's' : '' }}
        </nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .decomp-suggest {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(40rem, 94vw);
      max-width: 46rem;
      max-height: min(85vh, 44rem);
      background: var(--nf-color-surface, #fff);
      box-sizing: border-box;
    }
    .decomp-suggest__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }
    .decomp-suggest__header h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .decomp-suggest__header-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    .decomp-suggest__meta,
    .decomp-suggest__hint,
    .decomp-suggest__empty {
      margin: 0.35rem 0 0;
      color: var(--nf-color-text-secondary, #6b7280);
      font-size: 0.875rem;
    }
    .decomp-suggest__body {
      overflow: auto;
      min-height: 0;
      display: grid;
      gap: 1rem;
      padding-right: 0.25rem;
    }
    .decomp-suggest__body h3 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }
    .decomp-suggest__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: block;
    }
    .decomp-suggest__list > li {
      display: block;
      margin: 0 0 0.5rem;
    }
    .decomp-suggest__matched {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.7rem 0.8rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
    }
    /* Toujours 2 rangées : infos puis actions — jamais côte à côte */
    .decomp-suggest__card {
      display: block;
      padding: 0.7rem 0.8rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 8px;
      box-sizing: border-box;
    }
    .decomp-suggest__info {
      display: block;
      width: 100%;
    }
    .decomp-suggest__info strong {
      display: block;
      font-weight: 600;
    }
    .decomp-suggest__sub {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.8rem;
      color: var(--nf-color-text-secondary, #6b7280);
    }
    .decomp-suggest__actions {
      display: block;
      width: 100%;
      margin-top: 0.65rem;
    }
    .decomp-suggest__actions nf-button {
      display: inline-flex;
      margin-right: 0.4rem;
      margin-bottom: 0.25rem;
      vertical-align: middle;
    }
    .decomp-suggest__footer {
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
  readonly uncertain = signal<DecompositionComposantIncertain[]>([
    ...(this.data.propose.uncertain ?? []),
  ]);
  readonly selected = signal<boolean[]>(this.matched().map(() => true));

  selectedCount(): number {
    return this.selected().filter(Boolean).length;
  }

  /** Matched cochés + « à créer » encore manuels (poste only, pas d’article). */
  pendingCount(): number {
    return this.selectedCount() + this.missing().length;
  }

  trackMatched(index: number, row: DecompositionComposantMatched): string {
    return `${row.itemId ?? 'manual'}:${row.name}:${index}`;
  }

  toggle(index: number, value: boolean): void {
    const next = [...this.selected()];
    next[index] = value;
    this.selected.set(next);
  }

  async ajouterAuPoste(index: number): Promise<void> {
    await this.resoudreManquant(index, 'poste');
  }

  async creerCatalogue(index: number): Promise<void> {
    await this.resoudreManquant(index, 'catalogue');
  }

  private async resoudreManquant(index: number, mode: CreateMissingItemMode): Promise<void> {
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
        cleStable: row.cleStable,
        uniteOptions: this.data.uniteOptions,
        mode,
      },
    });
    const created = (await firstValueFrom(ref.afterClosed())) as CreateMissingItemDialogResult | null;
    if (!created) return;

    const added: DecompositionComposantMatched = {
      type: created.type,
      itemId: created.itemId ?? '',
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
    const leftoverLibre: DecompositionComposantMatched[] = this.missing().map((row) => ({
      type: row.type,
      itemId: '',
      name: row.designation,
      unite: row.unite,
      rendement: row.rendement,
      sourcePrix: 'MANUEL',
      confiance: row.confiance,
      suggereParIa: true,
    }));
    const all = [...selected, ...leftoverLibre];
    if (!all.length) return;
    this.dialogRef.close({ selected: all });
  }

  regenerate(): void {
    this.dialogRef.close({ selected: [], regenerate: true });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
