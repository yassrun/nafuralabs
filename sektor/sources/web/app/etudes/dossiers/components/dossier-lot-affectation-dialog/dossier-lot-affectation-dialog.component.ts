import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';
import { AuthFacade } from '@platform/core/security/services/auth.facade';

import {
  DossierEtudeApiService,
  type ChargeEtudeCandidat,
} from '../../services/dossier-etude-api.service';
import { idsActeurEgaux } from '../../utils/dossier-responsables.util';

export interface DossierLotAffectationDialogData {
  lotLibelle: string;
  chargeLotUserId?: string | null;
  utilisateurCourantId?: string | null;
  utilisateurCourantEmail?: string | null;
}

export interface DossierLotAffectationDialogResult {
  userId: string | null;
  nom?: string | null;
}

@Component({
  selector: 'app-dossier-lot-affectation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, ButtonComponent, NfSelectComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Affecter le lot</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <p class="hint">
        {{ data.lotLibelle }} — sans affectation, vous chiffrez ce lot (défaut). Déléguer à un
        autre ingénieur lui réserve le chiffrage ; retirez l’affectation pour le reprendre.
      </p>
      <nf-select
        name="chargeLot"
        label="Ingénieur BTP"
        placeholder="Sélectionner"
        [options]="options()"
        [selectedLabel]="labelSelection()"
        [disabled]="busy()"
        [ngModel]="userId()"
        (ngModelChange)="userId.set($event || '')"
      />
      @if (erreur()) {
        <p class="error" role="alert">{{ erreur() }}</p>
      }
      <footer>
        <nf-button variant="ghost" (clicked)="close()">Annuler</nf-button>
        @if (data.chargeLotUserId) {
          <nf-button variant="ghost" [disabled]="busy()" (clicked)="retirer()">Retirer</nf-button>
        }
        <nf-button variant="primary" [disabled]="!userId() || busy()" (clicked)="confirmer()">
          Affecter
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
export class DossierLotAffectationDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DossierLotAffectationDialogComponent, DossierLotAffectationDialogResult>,
  );
  private readonly api = inject(DossierEtudeApiService);
  private readonly auth = inject(AuthFacade);
  readonly data = inject<DossierLotAffectationDialogData>(MAT_DIALOG_DATA);

  readonly options = signal<NfSelectOption[]>([]);
  readonly ingenieurs = signal<ChargeEtudeCandidat[]>([]);
  readonly userId = signal('');
  readonly busy = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  constructor() {
    void this.charger();
  }

  labelSelection(): string {
    const id = this.userId();
    return this.options().find((o) => o.value === id)?.label ?? '';
  }

  close(): void {
    this.dialogRef.close();
  }

  retirer(): void {
    this.dialogRef.close({ userId: null });
  }

  confirmer(): void {
    const id = this.userId();
    if (!id) return;
    const ing = this.ingenieurs().find((c) => c.userId === id);
    this.dialogRef.close({
      userId: id,
      nom: ing?.displayName ?? ing?.email,
    });
  }

  private async charger(): Promise<void> {
    this.busy.set(true);
    try {
      const list = await this.api.listIngenieurs();
      const meId = (this.data.utilisateurCourantId ?? this.auth.user()?.id ?? '').trim();
      const meEmail = (this.data.utilisateurCourantEmail ?? this.auth.user()?.email ?? '')
        .trim()
        .toLowerCase();
      const moi =
        list.find((c) => meId && idsActeurEgaux(c.userId, meId)) ??
        list.find((c) => meEmail && c.email.toLowerCase() === meEmail) ??
        null;
      const tries = moi
        ? [moi, ...list.filter((c) => c.userId !== moi.userId)]
        : list;
      this.ingenieurs.set(tries);
      this.options.set(
        tries.map((ing) => ({
          value: ing.userId,
          label:
            moi && ing.userId === moi.userId
              ? `Moi — ${ing.displayName} (défaut, tous les lots)`
              : `${ing.displayName} — ${ing.email}`,
        })),
      );
      const already = (this.data.chargeLotUserId ?? '').trim();
      const preselect =
        (already && tries.find((c) => idsActeurEgaux(c.userId, already))) || moi || null;
      this.userId.set(preselect?.userId ?? '');
    } catch {
      this.erreur.set('Impossible de charger les ingénieurs.');
    } finally {
      this.busy.set(false);
    }
  }
}
