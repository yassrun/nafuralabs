import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent } from '@platform/lib/anatomy';

/**
 * AC-13 — ce que l'humain complète pour convertir : code chantier, date de démarrage, durée.
 *
 * <p>Aucun de ces champs ne suppose un planning, et le zonage n'y figure pas : la conversion
 * aboutit sans qu'aucune zone soit saisie (palier 1).
 *
 * <p>AC-8 / AC-10 rappelés à l'écran : le chantier naît en préparation, et aucun marché n'est
 * créé — le marché naît à la notification.
 */
export interface ConversionChantierDialogData {
  /** Libellé proposé par défaut : l'objet de l'étude. */
  defaultLabel?: string;
  /** Date d'attribution de l'étude, proposée comme date de démarrage. */
  defaultDateDemarrage?: string;
}

export interface ConversionChantierDialogResult {
  chantierCode?: string;
  chantierLabel: string;
  dateDemarrage?: string;
  dureeMois?: number;
}

@Component({
  selector: 'app-conversion-chantier-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Créer le chantier</h2>
      </header>

      <p class="hint">
        Le chantier naît <strong>en préparation</strong> : c'est l'ordre de service qui le démarre.
        Aucun marché n'est créé ici — le marché naît à la notification. La référence de vente reste
        le devis validé.
      </p>

      <nf-input
        label="Libellé du chantier"
        [required]="true"
        [ngModel]="chantierLabel()"
        (ngModelChange)="chantierLabel.set($event)">
      </nf-input>

      <nf-input
        label="Code chantier"
        [ngModel]="chantierCode()"
        (ngModelChange)="chantierCode.set($event)">
      </nf-input>
      <p class="hint hint--muted">Facultatif — généré si vide.</p>

      <div class="grid-2">
        <div>
          <nf-input
            label="Date de démarrage"
            type="date"
            [ngModel]="dateDemarrage()"
            (ngModelChange)="dateDemarrage.set($event)">
          </nf-input>
          <p class="hint hint--muted">Facultatif — avant l'OS.</p>
        </div>

        <div>
          <nf-input
            label="Durée (mois)"
            type="number"
            [ngModel]="dureeMois()"
            (ngModelChange)="dureeMois.set($event)">
          </nf-input>
          <p class="hint hint--muted">Facultatif — avant l'OS.</p>
        </div>
      </div>

      <p class="hint hint--muted">
        Le zonage est facultatif : la conversion aboutit sans qu'aucune zone soit saisie.
      </p>

      <footer>
        <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!canConvert()" (clicked)="save()">Convertir</nf-button>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(34rem, 92vw); }
      header h2 { margin: 0; font-size: 1.125rem; color: var(--nf-text-primary); }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .hint { margin: 0; font-size: 0.8125rem; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
      .hint--muted { font-style: italic; margin-top: -0.5rem; }
      footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
    `,
  ],
})
export class ConversionChantierDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<ConversionChantierDialogComponent, ConversionChantierDialogResult | null>);
  readonly data = inject<ConversionChantierDialogData>(MAT_DIALOG_DATA);

  readonly chantierCode = signal('');
  readonly chantierLabel = signal(this.data.defaultLabel ?? '');
  readonly dateDemarrage = signal(this.data.defaultDateDemarrage ?? '');
  readonly dureeMois = signal('');

  readonly canConvert = computed(() => !!this.chantierLabel().trim());

  save(): void {
    const label = this.chantierLabel().trim();
    if (!label) return;

    const duree = Number.parseInt(this.dureeMois(), 10);
    this.dialogRef.close({
      chantierCode: this.chantierCode().trim() || undefined,
      chantierLabel: label,
      dateDemarrage: this.dateDemarrage().trim() || undefined,
      dureeMois: Number.isFinite(duree) ? duree : undefined,
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
