import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

export type PiecesMarcheMode = 'documents' | 'bordereau';

/**
 * Dépôt des pièces — étape Documents, ou re-import bordereau — étape Bordereau.
 *
 * Un fichier de type BORDEREAU / CPS_ET_BORDEREAU déclenche l'extraction côté back et crée
 * les articles DPGF ; c'est ce qui débloque le bouton Suivant de l'étape 2.
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
  readonly mode = input<PiecesMarcheMode>('documents');

  /** Émis après dépôt ou suppression — le parent recharge les gates. */
  readonly change = output<void>();

  readonly pieces = signal<DossierDocument[]>([]);
  readonly chargement = signal(false);
  readonly envoi = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly typeChoisi = signal<TypeDossierDocument>('BORDEREAU');

  readonly types = computed(() => {
    if (this.mode() === 'bordereau') {
      return TYPES_DOSSIER_DOCUMENT.filter(
        (t) => t.value === 'BORDEREAU' || t.value === 'CPS_ET_BORDEREAU',
      );
    }
    return TYPES_DOSSIER_DOCUMENT;
  });

  readonly titre = computed(() =>
    this.mode() === 'bordereau' ? 'Importer le bordereau' : 'Pièces du marché',
  );

  readonly aide = computed(() =>
    this.mode() === 'bordereau'
      ? 'Déposez le fichier BPU / DQE (Excel ou PDF). L’extraction crée les articles du bordereau — ensuite vous pourrez continuer.'
      : 'Déposez le CPS et le bordereau. Le CPS est indexé tout de suite ; le bordereau sera structuré à l’étape suivante (ou ici si vous choisissez le type Bordereau).',
  );

  private readonly labelsParType = Object.fromEntries(
    TYPES_DOSSIER_DOCUMENT.map((t) => [t.value, t.label]),
  ) as Record<string, string>;

  constructor() {
    effect(() => {
      const id = this.dossierId();
      const mode = this.mode();
      this.typeChoisi.set(mode === 'bordereau' ? 'BORDEREAU' : 'CPS');
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
