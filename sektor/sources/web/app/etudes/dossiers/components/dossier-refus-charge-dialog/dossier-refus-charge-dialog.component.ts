import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

export interface DossierRefusChargeResult {
  type: string;
  motif: string;
}

@Component({
  selector: 'app-dossier-refus-charge-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Rejeter l’affectation</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <p class="hint">
        Le dossier passera en Rejeté par le chiffrage. Le motif est obligatoire.
      </p>
      <nf-select
        name="typeRefus"
        label="Type de motif"
        placeholder="Sélectionner"
        [required]="true"
        [options]="types"
        [ngModel]="type()"
        (ngModelChange)="type.set($event || '')"
      />
      <label class="motif">
        <span>Motif</span>
        <textarea
          rows="6"
          [ngModel]="motif()"
          (ngModelChange)="motif.set($event || '')"
          placeholder="Précisez les documents ou chapitres manquants…"
        ></textarea>
      </label>
      <footer>
        <nf-button variant="ghost" (clicked)="close()">Annuler</nf-button>
        <nf-button
          variant="danger"
          [disabled]="!type() || !motif().trim()"
          (clicked)="confirmer()"
        >
          Rejeter
        </nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      min-width: min(28rem, 92vw);
      padding: 1rem 1.1rem 1.1rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 1.05rem;
    }
    .hint {
      margin: 0.6rem 0 1rem;
      color: var(--nf-color-text-muted, #5b6472);
      font-size: 0.875rem;
    }
    .motif {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 0.85rem;
      font-size: 0.85rem;
    }
    textarea {
      width: 100%;
      resize: vertical;
      min-height: 7rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--nf-color-border, #d0d5dd);
      border-radius: 6px;
      font: inherit;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `,
})
export class DossierRefusChargeDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DossierRefusChargeDialogComponent, DossierRefusChargeResult>,
  );

  readonly types: NfSelectOption[] = [
    { value: 'CPS_INCOMPLET', label: 'CPS incomplet' },
    { value: 'DOC_MANQUANT', label: 'Document manquant' },
    { value: 'AUTRE', label: 'Autre' },
  ];
  readonly type = signal('');
  readonly motif = signal('');

  close(): void {
    this.dialogRef.close();
  }

  confirmer(): void {
    const motif = this.motif().trim();
    const type = this.type();
    if (!type || !motif) return;
    this.dialogRef.close({ type, motif });
  }
}
