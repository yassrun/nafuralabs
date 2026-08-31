import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import type {
  LotDaccueilPossible,
  PlacementPosteOrphelin,
  PosteOrphelin,
} from '../../services/dossier-etude-api.service';

export interface PostesOrphelinsDialogData {
  postes: PosteOrphelin[];
  lotsDisponibles: LotDaccueilPossible[];
}

/** Une ligne d'écran : un poste nommé, et la décision que l'humain prend pour lui. */
interface LignePlacement {
  poste: PosteOrphelin;
  /** Code du lot existant choisi, ou `__nouveau__`, ou vide tant que rien n'est décidé. */
  choix: string;
  nouveauCode: string;
  nouvelleDesignation: string;
}

const NOUVEAU = '__nouveau__';

/**
 * AC-12 — un arbre bancal se répare devant l'humain, jamais en silence.
 *
 * <p>La conversion s'est arrêtée <strong>avant de rien créer</strong>. Ces postes du devis n'ont
 * pas de lot parent : ils sont nommés ici, un par un. L'humain place chacun — un lot existant du
 * devis, ou un lot d'accueil qu'il crée. Rien n'est rattaché par défaut : tant qu'un poste n'a
 * pas de décision, on ne repart pas.
 *
 * <p>Abandonner ferme le dialogue sans rien créer : ni chantier, ni arbre, ni budget. L'étude
 * reste gagnée et la conversion reste rejouable.
 */
@Component({
  selector: 'app-postes-orphelins-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Placer les postes sans lot</h2>
      </header>

      <p class="hint">
        La conversion s'est arrêtée : rien n'a été créé. {{ data.postes.length }} poste(s) du devis
        n'ont pas de lot parent. Placez chacun d'eux, puis relancez. Si vous abandonnez, rien n'est
        créé et l'étude reste gagnée.
      </p>

      <ul class="lignes">
        @for (ligne of lignes(); track ligne.poste.posteId) {
          <li class="ligne">
            <div class="ligne__poste">
              <strong>{{ ligne.poste.code }}</strong>
              <span>{{ ligne.poste.designation }}</span>
            </div>

            <nf-select
              label="Lot d'accueil"
              [options]="lotOptions"
              [ngModel]="ligne.choix"
              (ngModelChange)="setChoix(ligne.poste.posteId, $event)"
            />

            @if (ligne.choix === NOUVEAU) {
              <div class="grid-2">
                <nf-input
                  label="Code du lot"
                  [ngModel]="ligne.nouveauCode"
                  (ngModelChange)="setNouveauCode(ligne.poste.posteId, $event)">
                </nf-input>
                <nf-input
                  label="Désignation"
                  [ngModel]="ligne.nouvelleDesignation"
                  (ngModelChange)="setNouvelleDesignation(ligne.poste.posteId, $event)">
                </nf-input>
              </div>
              <p class="hint hint--muted">
                Un lot que vous créez ici ne vient pas du devis : il est interne.
              </p>
            }
          </li>
        }
      </ul>

      <footer>
        <nf-button variant="secondary" (clicked)="abandonner()">Abandonner</nf-button>
        <nf-button variant="primary" [disabled]="!toutEstPlace()" (clicked)="valider()">
          Placer et convertir
        </nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(42rem, 94vw); }
      header h2 { margin: 0; font-size: 1.125rem; color: var(--nf-text-primary); }
      .hint { margin: 0; font-size: 0.8125rem; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
      .hint--muted { font-style: italic; }
      .lignes { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; max-height: 26rem; overflow-y: auto; }
      .ligne { display: grid; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--nf-border-default); border-radius: 8px; }
      .ligne__poste { display: flex; gap: 0.5rem; align-items: baseline; }
      .field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
      .field select {
        padding: 0.625rem 0.75rem; border: 1px solid var(--nf-border-default);
        border-radius: 8px; font: inherit; background: var(--nf-color-surface);
      }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
    `,
  ],
})
export class PostesOrphelinsDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<PostesOrphelinsDialogComponent, PlacementPosteOrphelin[] | null>);
  readonly data = inject<PostesOrphelinsDialogData>(MAT_DIALOG_DATA);

  readonly NOUVEAU = NOUVEAU;

  readonly lotOptions: NfSelectOption[] = [
    { value: '', label: '— Choisir —' },
    ...this.data.lotsDisponibles.map((lot) => ({
      value: lot.code,
      label: `${lot.code} · ${lot.designation}`,
    })),
    { value: NOUVEAU, label: "Créer un lot d'accueil…" },
  ];

  readonly lignes = signal<LignePlacement[]>(
    this.data.postes.map((poste) => ({
      poste,
      choix: '',
      nouveauCode: '',
      nouvelleDesignation: '',
    })),
  );

  /** Rien n'est rattaché par défaut : chaque poste doit porter une décision complète. */
  readonly toutEstPlace = computed(() =>
    this.lignes().every((ligne) =>
      ligne.choix === NOUVEAU
        ? !!ligne.nouveauCode.trim() && !!ligne.nouvelleDesignation.trim()
        : !!ligne.choix,
    ),
  );

  setChoix(posteId: string, choix: string): void {
    this.patch(posteId, (ligne) => ({ ...ligne, choix }));
  }

  setNouveauCode(posteId: string, nouveauCode: string): void {
    this.patch(posteId, (ligne) => ({ ...ligne, nouveauCode }));
  }

  setNouvelleDesignation(posteId: string, nouvelleDesignation: string): void {
    this.patch(posteId, (ligne) => ({ ...ligne, nouvelleDesignation }));
  }

  valider(): void {
    if (!this.toutEstPlace()) return;
    this.dialogRef.close(
      this.lignes().map((ligne) =>
        ligne.choix === NOUVEAU
          ? {
              posteId: ligne.poste.posteId,
              nouveauLotCode: ligne.nouveauCode.trim(),
              nouveauLotDesignation: ligne.nouvelleDesignation.trim(),
            }
          : { posteId: ligne.poste.posteId, lotCode: ligne.choix },
      ),
    );
  }

  /** Abandonner : rien n'est créé, l'étude reste gagnée. */
  abandonner(): void {
    this.dialogRef.close(null);
  }

  private patch(posteId: string, fn: (ligne: LignePlacement) => LignePlacement): void {
    this.lignes.set(
      this.lignes().map((ligne) => (ligne.poste.posteId === posteId ? fn(ligne) : ligne)),
    );
  }
}
