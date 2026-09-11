import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import { AuthFacade } from '@platform/core/security/services/auth.facade';

import {
  DossierEtudeApiService,
  type ChargeEtudeCandidat,
} from '../../services/dossier-etude-api.service';

export interface DossierGoDialogData {
  dossierId: string;
  createdBy?: string | null;
  chargeEtudeUserId?: string | null;
  responsableExecutionUserId?: string | null;
}

export interface DossierGoDialogResult {
  chargeEtudeUserId: string;
  chargeEtudeNom?: string;
  responsableExecutionUserId: string;
  responsableExecutionNom?: string;
}

@Component({
  selector: 'app-dossier-go-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Affecter l’étude</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <p class="hint">
        Deux ingénieurs BTP : l’étude et l’exécution. S’ils sont la même personne, l’avis
        d’exécution n’apparaît pas. S’ils diffèrent, l’exécution tranche après Chiffrage terminé.
      </p>
      <nf-select
        name="chargeGo"
        label="Responsable d’étude"
        placeholder="Sélectionner"
        [required]="true"
        [options]="options()"
        [ngModel]="chargeId()"
        (ngModelChange)="onChargeChange($event || '')"
      />
      <nf-select
        name="execGo"
        label="Responsable d’exécution"
        placeholder="Même que l’étude"
        [required]="true"
        [options]="options()"
        [ngModel]="execId()"
        (ngModelChange)="execId.set($event || '')"
      />
      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }
      <footer>
        <nf-button variant="ghost" (clicked)="close()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="!chargeId() || !execId() || busy()" (clicked)="confirmer()">
          {{ busy() ? 'Enregistrement…' : 'Affecter' }}
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
    nf-select + nf-select {
      display: block;
      margin-top: 0.85rem;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .error {
      color: var(--nf-color-danger, #b42318);
      font-size: 0.85rem;
    }
  `,
})
export class DossierGoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DossierGoDialogComponent, DossierGoDialogResult>);
  private readonly api = inject(DossierEtudeApiService);
  private readonly auth = inject(AuthFacade);
  readonly data = inject<DossierGoDialogData>(MAT_DIALOG_DATA);

  readonly options = signal<NfSelectOption[]>([]);
  readonly ingenieurs = signal<ChargeEtudeCandidat[]>([]);
  readonly chargeId = signal('');
  readonly execId = signal('');
  readonly busy = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  constructor() {
    void this.charger();
  }

  close(): void {
    this.dialogRef.close();
  }

  onChargeChange(id: string): void {
    const prev = this.chargeId();
    this.chargeId.set(id);
    if (!this.execId() || this.execId() === prev) {
      this.execId.set(id);
    }
  }

  confirmer(): void {
    const id = this.chargeId();
    const exec = this.execId() || id;
    if (!id) return;
    const ing = this.ingenieurs().find((c) => c.userId === id);
    const execIng = this.ingenieurs().find((c) => c.userId === exec);
    this.dialogRef.close({
      chargeEtudeUserId: id,
      chargeEtudeNom: ing?.displayName ?? ing?.email,
      responsableExecutionUserId: exec,
      responsableExecutionNom: execIng?.displayName ?? execIng?.email,
    });
  }

  private async charger(): Promise<void> {
    this.busy.set(true);
    try {
      const list = await this.api.listIngenieurs();
      this.ingenieurs.set(list);
      this.options.set(
        list.map((ing) => ({
          value: ing.userId,
          label: `${ing.displayName} — ${ing.email}`,
        })),
      );
      const created = (this.data.createdBy ?? '').trim();
      const already = (this.data.chargeEtudeUserId ?? '').trim();
      const meId = (this.auth.user()?.id ?? '').trim();
      const meEmail = (this.auth.user()?.email ?? '').trim().toLowerCase();
      const moi =
        list.find((c) => meId && c.userId === meId)
        ?? list.find((c) => meEmail && c.email.toLowerCase() === meEmail)
        ?? null;
      const defaut =
        (already && list.find((c) => c.userId === already)) ||
        moi ||
        (created &&
          list.find(
            (c) => c.userId === created || c.email.toLowerCase() === created.toLowerCase(),
          )) ||
        null;
      this.chargeId.set(defaut?.userId ?? '');
      const alreadyExec = (this.data.responsableExecutionUserId ?? '').trim();
      const execDefaut =
        (alreadyExec && list.find((c) => c.userId === alreadyExec)) || defaut || null;
      this.execId.set(execDefaut?.userId ?? defaut?.userId ?? '');
    } catch {
      this.erreur.set('Impossible de charger les ingénieurs.');
    } finally {
      this.busy.set(false);
    }
  }
}
