import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '@lib/anatomy';

import { TYPES_DOSSIER_DOCUMENT } from '@app/etudes/models';
import type { DossierDocument, TypeDossierDocument } from '@app/etudes/models';

import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';

/**
 * Dépôt des pièces du marché — étape Bordereau.
 *
 * Branche le `POST …/documents` déjà disponible côté back. La structuration du bordereau
 * (extraction → articles DPGF) arrive au lot 3 ; ici on stocke et on liste les originaux.
 */
@Component({
  selector: 'app-pieces-marche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './pieces-marche.component.html',
  styleUrl: './pieces-marche.component.scss',
})
export class PiecesMarcheComponent {
  private readonly api = inject(DossierEtudeApiService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);

  /** Émis après dépôt ou suppression — le parent recharge les gates. */
  readonly change = output<void>();

  readonly pieces = signal<DossierDocument[]>([]);
  readonly chargement = signal(false);
  readonly envoi = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly typeChoisi = signal<TypeDossierDocument>('BORDEREAU');
  readonly types = TYPES_DOSSIER_DOCUMENT;

  private readonly labelsParType = Object.fromEntries(
    TYPES_DOSSIER_DOCUMENT.map((t) => [t.value, t.label]),
  ) as Record<string, string>;

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.charger(id);
    });
  }

  libelleType(type: string): string {
    return this.labelsParType[type] ?? type;
  }

  async onFichierChoisi(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement | null;
    const file = inputEl?.files?.[0];
    if (!file || !this.modifiable()) return;

    this.envoi.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.deposerDocument(this.dossierId(), file, this.typeChoisi());
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.envoi.set(false);
      if (inputEl) inputEl.value = '';
    }
  }

  async supprimer(piece: DossierDocument): Promise<void> {
    if (!this.modifiable()) return;
    this.erreur.set(undefined);
    try {
      await this.api.supprimerDocument(this.dossierId(), piece.id);
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  private async charger(dossierId: string): Promise<void> {
    this.chargement.set(true);
    try {
      this.pieces.set(await this.api.listerDocuments(dossierId));
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  private messageErreur(e: unknown): string {
    const err = e as { status?: number; error?: { message?: string; code?: string } };
    if (err?.status === 403) {
      return "Vous n'avez pas la permission de déposer des pièces.";
    }
    return err?.error?.message ?? err?.error?.code ?? 'Échec du dépôt du document.';
  }
}
