import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent } from '@platform/lib/anatomy';

import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';
import type { GuestPurpose } from '../../services/guest-access-api.service';

export interface ShareGuestLinkDialogData {
  dossierId: string;
  numero: string;
  objet: string;
  suggestedEmail?: string | null;
}

@Component({
  selector: 'app-share-guest-link-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Partager le dossier</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <p class="hint">{{ data.numero }} — {{ data.objet }}</p>
      <p class="hint">Le destinataire ouvre le lien sans compte Sektor. Valide 24 heures.</p>

      <label class="field">
        <span>E-mail du destinataire *</span>
        <input name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
      </label>

      <fieldset class="field">
        <legend>Usage</legend>
        <label class="radio">
          <input type="radio" name="purpose" [(ngModel)]="purpose" value="CLIENT_VIEW" />
          Vue client (arbre, décomposition, commentaires)
        </label>
        <label class="radio">
          <input type="radio" name="purpose" [(ngModel)]="purpose" value="FOURNISSEUR_UPLOAD" />
          Dépôt devis fournisseur
        </label>
      </fieldset>

      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }
      @if (copied()) {
        <p class="ok" role="status">Lien copié. Envoyez-le par e-mail.</p>
      }

      <footer>
        <nf-button variant="ghost" (clicked)="close()">Fermer</nf-button>
        <nf-button variant="primary" [disabled]="busy() || !email.trim()" (clicked)="createAndCopy()">
          {{ busy() ? 'Création…' : 'Créer et copier le lien' }}
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
      margin: 0.35rem 0 0;
      color: #64748b;
      font-size: 0.8rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.85rem;
      border: 0;
      padding: 0;
    }
    input[type='email'],
    input[type='number'] {
      padding: 0.45rem 0.55rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
    }
    .radio {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .error {
      color: #b91c1c;
    }
    .ok {
      color: #166534;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `,
})
export class ShareGuestLinkDialogComponent {
  readonly data = inject<ShareGuestLinkDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ShareGuestLinkDialogComponent, void>);
  private readonly api = inject(DossierEtudeApiService);

  email = this.data.suggestedEmail?.trim() ?? '';
  purpose: GuestPurpose = 'CLIENT_VIEW';
  readonly busy = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly copied = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  async createAndCopy(): Promise<void> {
    this.busy.set(true);
    this.erreur.set(undefined);
    this.copied.set(false);
    try {
      const created = await this.api.createGuestLink(this.data.dossierId, {
        email: this.email.trim(),
        purpose: this.purpose,
      });
      const prefix = created.purpose === 'FOURNISSEUR_UPLOAD' ? 'f' : 'c';
      const url = `${window.location.origin}/p/${prefix}/${created.token}`;
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
    } catch (e) {
      this.erreur.set(this.message(e));
    } finally {
      this.busy.set(false);
    }
  }

  private message(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const code = (e.error as { code?: string } | null)?.code;
      if (code === 'etudes.dossier.introuvable') return 'Dossier introuvable.';
      if (e.status === 403) return 'Vous ne pouvez pas partager ce dossier.';
    }
    return 'Création du lien impossible.';
  }
}
