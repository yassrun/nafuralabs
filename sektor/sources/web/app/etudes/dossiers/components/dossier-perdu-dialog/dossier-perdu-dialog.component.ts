import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfInputComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

export interface DossierPerduDialogResult {
  motif: string;
  concurrentRetenu?: string;
}

@Component({
  selector: 'app-dossier-perdu-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Marquer l’affaire perdue</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <p class="hint">Le motif est obligatoire. Le concurrent retenu est facultatif.</p>
      <nf-select
        name="motifPerdu"
        label="Motif"
        placeholder="Sélectionner"
        [required]="true"
        [options]="motifs"
        [ngModel]="motif()"
        (ngModelChange)="motif.set($event || '')"
      />
      <nf-input
        label="Concurrent retenu"
        [ngModel]="concurrent()"
        (ngModelChange)="concurrent.set($event || '')"
      />
      <footer>
        <nf-button variant="ghost" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="danger" [disabled]="!motif()" (clicked)="confirmer()">
          Marquer perdu
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
    nf-input {
      display: block;
      margin-top: 0.85rem;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `,
})
export class DossierPerduDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DossierPerduDialogComponent, DossierPerduDialogResult>,
  );

  readonly motifs: NfSelectOption[] = [
    { value: 'PRIX', label: 'Prix' },
    { value: 'DELAI', label: 'Délai' },
    { value: 'TECHNIQUE', label: 'Technique' },
    { value: 'ADMINISTRATIF', label: 'Administratif' },
    { value: 'SANS_SUITE', label: 'Sans suite' },
  ];

  readonly motif = signal('PRIX');
  readonly concurrent = signal('');

  close(): void {
    this.dialogRef.close();
  }

  confirmer(): void {
    const motif = this.motif();
    if (!motif) return;
    this.dialogRef.close({
      motif,
      concurrentRetenu: this.concurrent().trim() || undefined,
    });
  }
}
