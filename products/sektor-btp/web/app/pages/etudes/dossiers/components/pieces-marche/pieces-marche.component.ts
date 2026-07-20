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
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@lib/anatomy';

import { TYPES_DOSSIER_DOCUMENT } from '@app/etudes/models';
import type { DossierDocument, TypeDossierDocument } from '@app/etudes/models';

import {
  BordereauPreviewDialogComponent,
  type BordereauPreviewDialogResult,
} from '../bordereau-preview-dialog/bordereau-preview-dialog.component';
import { BordereauArbreComponent } from '../bordereau-arbre/bordereau-arbre.component';
import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';

export type PiecesMarcheMode = 'documents' | 'bordereau';

/**
 * Étape 1 — dépôt BDP/CPS sans extraction.
 * Étape 2 — choix manuel / auto pour construire l'arbre bordereau.
 */
@Component({
  selector: 'app-pieces-marche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, BordereauArbreComponent],
  templateUrl: './pieces-marche.component.html',
  styleUrl: './pieces-marche.component.scss',
})
export class PiecesMarcheComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly dialog = inject(MatDialog);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);
  readonly mode = input<PiecesMarcheMode>('documents');
  readonly dpgfId = input<string | undefined>(undefined);

  readonly change = output<void>();

  readonly pieces = signal<DossierDocument[]>([]);
  readonly chargement = signal(false);
  readonly envoi = signal(false);
  readonly extraction = signal(false);
  readonly initManuel = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly typeChoisi = signal<TypeDossierDocument>('BORDEREAU');
  readonly voie = signal<'auto' | 'manuel'>('auto');
  readonly dpgfIdLocal = signal<string | undefined>(undefined);

  readonly dpgfEffectif = computed(() => this.dpgfIdLocal() ?? this.dpgfId());

  readonly types = computed(() => {
    if (this.mode() === 'bordereau') {
      return TYPES_DOSSIER_DOCUMENT.filter(
        (t) => t.value === 'BORDEREAU' || t.value === 'CPS_ET_BORDEREAU',
      );
    }
    return TYPES_DOSSIER_DOCUMENT;
  });

  readonly piecesBordereau = computed(() =>
    this.pieces().filter((p) => p.type === 'BORDEREAU' || p.type === 'CPS_ET_BORDEREAU'),
  );

  readonly titre = computed(() =>
    this.mode() === 'bordereau' ? 'Bordereau' : 'Pièces du marché',
  );

  readonly aide = computed(() =>
    this.mode() === 'bordereau'
      ? 'Construisez l’arbre du bordereau : extraction automatique depuis le BDP déjà déposé, ou saisie manuelle.'
      : 'Déposez le BDP (bordereau) et le CPS — sans extraction. La structuration se fait à l’étape suivante.',
  );

  private readonly labelsParType = Object.fromEntries(
    TYPES_DOSSIER_DOCUMENT.map((t) => [t.value, t.label]),
  ) as Record<string, string>;

  constructor() {
    effect(() => {
      const id = this.dossierId();
      this.typeChoisi.set('BORDEREAU');
      if (id) void this.charger(id);
    });
    effect(() => {
      const fromParent = this.dpgfId();
      if (fromParent) this.dpgfIdLocal.set(fromParent);
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

  async extraire(piece?: DossierDocument): Promise<void> {
    if (!this.modifiable() || !piece) return;
    this.extraction.set(true);
    this.erreur.set(undefined);
    try {
      const preview = await this.api.previsualiserBordereau(this.dossierId(), piece.id);
      const result = await firstValueFrom(
        this.dialog
          .open(BordereauPreviewDialogComponent, {
            width: '94vw',
            maxWidth: '1100px',
            maxHeight: '90vh',
            autoFocus: false,
            data: {
              arbre: preview.arbre,
              articleCount: preview.articleCount,
              fileName: piece.nomFichier,
              pieceId: piece.id,
            },
          })
          .afterClosed(),
      ) as BordereauPreviewDialogResult | undefined;

      if (!result?.confirmed) {
        return;
      }

      const saved = await this.api.validerBordereau(
        this.dossierId(),
        result.arbre,
        result.pieceId,
      );
      this.dpgfIdLocal.set(saved.dpgfId);
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.extraction.set(false);
    }
  }

  async demarrerManuel(): Promise<void> {
    if (!this.modifiable()) return;
    this.initManuel.set(true);
    this.erreur.set(undefined);
    try {
      const res = await this.api.initBordereauManuel(this.dossierId());
      this.dpgfIdLocal.set(res.dpgfId);
      this.voie.set('manuel');
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.initManuel.set(false);
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
    const code = err?.error?.code ?? err?.error?.message;
    if (code === 'etudes.bordereau.aucune_piece_stockee') {
      return 'Aucun BDP stocké à l’étape Documents. Revenez en arrière et déposez le bordereau.';
    }
    if (code === 'etudes.document.telechargement_impossible') {
      return 'Ce fichier a été déposé avant le stockage MinIO — retirez-le et déposez-le à nouveau à l’étape Documents.';
    }
    const raw = code ?? '';
    if (
      raw.includes('EXTRACTION_TIMEOUT') ||
      raw.includes('EOF') ||
      raw.includes('LLM_PROVIDER_ERROR')
    ) {
      return 'Extraction trop longue ou coupée par le fournisseur IA — réessayez (PDF volumineux).';
    }
    return code ?? 'Échec de l’opération.';
  }
}
