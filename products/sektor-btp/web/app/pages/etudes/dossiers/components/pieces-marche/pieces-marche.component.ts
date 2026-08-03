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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ButtonComponent, ConfirmDialogService } from '@lib/anatomy';

import { TYPES_DOSSIER_DOCUMENT } from '@app/etudes/models';
import type {
  DossierDocument,
  DossierPieceAttendue,
  MarchePropose,
  TypeDossierDocument,
} from '@app/etudes/models';

import { BordereauArbreComponent } from '../bordereau-arbre/bordereau-arbre.component';
import {
  DossierEtudeApiService,
  type ExtractionJobDto,
  type ValiderBordereauResult,
} from '../../services/dossier-etude-api.service';
import {
  countExploitableArticles,
  countIgnoredArticles,
  type ImportNoeudPreview,
} from '../../utils/bordereau-tree.util';

export type PiecesMarcheMode = 'documents' | 'bordereau';
export type ExtractionPhase = 'idle' | 'running' | 'review' | 'saving' | 'error';

/**
 * Étape 1 — slots dynamiques (pièces attendues) + dépôt.
 * Étape 2 — choix manuel / auto pour construire l'arbre bordereau.
 */
@Component({
  selector: 'app-pieces-marche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    BordereauArbreComponent,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './pieces-marche.component.html',
  styleUrl: './pieces-marche.component.scss',
})
export class PiecesMarcheComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);
  readonly mode = input<PiecesMarcheMode>('documents');
  readonly dpgfId = input<string | undefined>(undefined);
  /** Document source déjà rattaché — sert à déduire le mode initial. */
  readonly bordereauDocumentId = input<string | undefined>(undefined);
  /** Structure figée (chiffrage démarré) — empêche édition / réimport. */
  readonly structureVerrouillee = input(false);

  readonly change = output<void>();

  readonly acceptFiles =
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  readonly typesAjout = TYPES_DOSSIER_DOCUMENT.filter(
    (t) => t.value !== 'CPS_ET_BORDEREAU',
  );

  readonly pieces = signal<DossierDocument[]>([]);
  readonly slotsAttendus = signal<DossierPieceAttendue[]>([]);
  readonly chargement = signal(false);
  readonly envoiSlot = signal<string | null>(null);
  readonly dragOverSlot = signal<string | null>(null);
  readonly initManuel = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly info = signal<string | undefined>(undefined);
  readonly voie = signal<'auto' | 'manuel'>('auto');
  readonly dpgfIdLocal = signal<string | undefined>(undefined);
  readonly voieInitialisee = signal(false);

  readonly phase = signal<ExtractionPhase>('idle');
  readonly jobCourant = signal<ExtractionJobDto | null>(null);
  readonly pieceExtraction = signal<DossierDocument | null>(null);
  readonly draftArbre = signal<ImportNoeudPreview[] | null>(null);
  readonly draftToken = signal(0);
  readonly progressPercent = signal(0);
  readonly progressStep = signal<string | null>(null);

  readonly proposition = signal<MarchePropose | null>(null);
  readonly propositionBusy = signal(false);
  readonly ajoutOuvert = signal(false);
  readonly ajoutType = signal<string>('REGLEMENT');
  readonly ajoutLibelle = signal('');
  readonly ajoutObligatoire = signal(true);

  readonly dpgfEffectif = computed(() => this.dpgfIdLocal() ?? this.dpgfId());

  readonly pieceBordereau = computed(() =>
    this.pieces().find((p) => p.type === 'BORDEREAU' || p.type === 'CPS_ET_BORDEREAU'),
  );

  readonly pieceCps = computed(() =>
    this.pieces().find((p) => p.type === 'CPS' || p.type === 'CPS_ET_BORDEREAU'),
  );

  readonly piecesBordereau = computed(() =>
    this.pieces().filter((p) => p.type === 'BORDEREAU' || p.type === 'CPS_ET_BORDEREAU'),
  );

  readonly documentParId = computed(() => {
    const map = new Map<string, DossierDocument>();
    for (const p of this.pieces()) map.set(p.id, p);
    return map;
  });

  readonly titre = computed(() =>
    this.mode() === 'bordereau' ? 'Bordereau' : 'Pièces du marché',
  );

  readonly aide = computed(() =>
    this.mode() === 'bordereau'
      ? 'Construisez l’arbre du bordereau : extraction automatique depuis le BDP déjà déposé, ou saisie manuelle.'
      : 'Déposez chaque pièce attendue. BDP et CPS sont obligatoires ; d’autres slots peuvent venir du CPS (à valider) ou être ajoutés manuellement.',
  );

  readonly enRevue = computed(() => this.phase() === 'review' || this.phase() === 'saving');
  readonly extractionEnCours = computed(() => this.phase() === 'running');

  readonly articlesExploitables = computed(() =>
    this.draftArbre() ? countExploitableArticles(this.draftArbre()!) : 0,
  );
  readonly articlesIgnores = computed(() =>
    this.draftArbre() ? countIgnoredArticles(this.draftArbre()!) : 0,
  );

  /** Arbre persisté visible uniquement hors revue, selon le mode. */
  readonly showPersistedTree = computed(
    () => !!this.dpgfEffectif() && !this.enRevue() && this.mode() === 'bordereau',
  );

  /** Édition structurelle seulement en mode manuel et structure non figée. */
  readonly editionStructure = computed(
    () =>
      this.voie() === 'manuel' &&
      !this.enRevue() &&
      !this.extractionEnCours() &&
      !this.structureVerrouillee(),
  );

  private readonly labelsParType = Object.fromEntries(
    TYPES_DOSSIER_DOCUMENT.map((t) => [t.value, t.label]),
  ) as Record<string, string>;

  private proposeTentePour = '';

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.charger(id);
    });
    effect(() => {
      const fromParent = this.dpgfId();
      if (fromParent) this.dpgfIdLocal.set(fromParent);
    });
    effect(() => {
      if (this.mode() !== 'bordereau' || this.voieInitialisee()) return;
      const dpgf = this.dpgfId() ?? this.dpgfIdLocal();
      const source = this.bordereauDocumentId();
      if (dpgf && !source) {
        this.voie.set('manuel');
      } else {
        this.voie.set('auto');
      }
      this.voieInitialisee.set(true);
    });
  }

  libelleType(type: string): string {
    return this.labelsParType[type] ?? type;
  }

  confiancePct(c: number): number {
    return Math.round(c * 100);
  }

  badgeSlot(slot: DossierPieceAttendue): string {
    if (slot.type === 'BORDEREAU') return 'BDP';
    if (slot.type === 'CPS') return 'CPS';
    return slot.type.slice(0, 6);
  }

  documentPourSlot(slot: DossierPieceAttendue): DossierDocument | undefined {
    if (slot.dossierDocumentId) {
      return this.documentParId().get(slot.dossierDocumentId);
    }
    if (slot.type === 'BORDEREAU') return this.pieceBordereau();
    if (slot.type === 'CPS') return this.pieceCps();
    return this.pieces().find((p) => p.type === slot.type);
  }

  async setVoie(next: 'auto' | 'manuel'): Promise<void> {
    if (next === this.voie()) return;
    if (this.enRevue() || this.extractionEnCours()) {
      const ok = await this.confirmDialog.confirm({
        title: 'Changer de mode',
        message:
          'Une extraction est en cours ou en revue. Abandonner le brouillon et changer de mode ?',
        variant: 'danger',
        confirmLabel: 'Changer de mode',
      });
      if (!ok) return;
      this.resetExtractionState();
    }
    this.voie.set(next);
    this.erreur.set(undefined);
    this.info.set(undefined);
  }

  onDragOver(event: DragEvent, slotKey: string): void {
    if (!this.modifiable() || this.envoiSlot()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragOverSlot.set(slotKey);
  }

  onDragLeave(event: DragEvent, slotKey: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.dragOverSlot() === slotKey) this.dragOverSlot.set(null);
  }

  async onDrop(event: DragEvent, slot: DossierPieceAttendue): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverSlot.set(null);
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.deposer(file, slot);
  }

  async onFichierChoisi(event: Event, slot: DossierPieceAttendue): Promise<void> {
    const inputEl = event.target as HTMLInputElement | null;
    const file = inputEl?.files?.[0];
    if (file) await this.deposer(file, slot);
    if (inputEl) inputEl.value = '';
  }

  private async deposer(file: File, slot: DossierPieceAttendue): Promise<void> {
    if (!this.modifiable() || this.envoiSlot()) return;

    const existante = this.documentPourSlot(slot);
    if (existante) {
      const ok = await this.confirmDialog.confirm({
        title: 'Remplacer le fichier',
        message: `Remplacer « ${existante.nomFichier || existante.documentId} » par « ${file.name} » ?`,
        variant: 'danger',
        confirmLabel: 'Remplacer',
      });
      if (!ok) return;
    }

    this.envoiSlot.set(slot.id);
    this.erreur.set(undefined);
    try {
      if (existante) {
        await this.api.supprimerDocument(this.dossierId(), existante.id);
      }
      const typeDepot = (slot.type === 'BORDEREAU' || slot.type === 'CPS'
        ? slot.type
        : slot.type) as TypeDossierDocument;
      const doc = await this.api.deposerDocument(this.dossierId(), file, typeDepot);
      if (slot.id && doc?.id) {
        try {
          await this.api.lierPieceAttendue(this.dossierId(), slot.id, doc.id);
        } catch {
          /* liaison auto côté back au dépôt */
        }
      }
      await this.charger(this.dossierId());
      this.change.emit();
      if (slot.type === 'CPS' || typeDepot === 'CPS') {
        void this.essayerPropositionApresCps();
      }
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.envoiSlot.set(null);
    }
  }

  async ajouterPiece(): Promise<void> {
    const type = this.ajoutType().trim().toUpperCase();
    const libelle = this.ajoutLibelle().trim() || this.libelleType(type);
    if (!type || this.propositionBusy()) return;
    this.propositionBusy.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.creerPieceAttendue(this.dossierId(), {
        type,
        libelle,
        obligatoire: this.ajoutObligatoire(),
      });
      this.ajoutOuvert.set(false);
      this.ajoutLibelle.set('');
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.propositionBusy.set(false);
    }
  }

  async basculerObligatoire(slot: DossierPieceAttendue): Promise<void> {
    if (!this.modifiable() || slot.type === 'BORDEREAU' || slot.type === 'CPS') return;
    try {
      await this.api.updatePieceAttendue(this.dossierId(), slot.id, {
        obligatoire: !slot.obligatoire,
      });
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  async retirerSlot(slot: DossierPieceAttendue): Promise<void> {
    if (!this.modifiable() || slot.type === 'BORDEREAU' || slot.type === 'CPS') return;
    const ok = await this.confirmDialog.confirm({
      title: 'Retirer la pièce attendue',
      message: `Retirer « ${slot.libelle} » de la checklist ?`,
      variant: 'danger',
      confirmLabel: 'Retirer',
    });
    if (!ok) return;
    try {
      await this.api.supprimerPieceAttendue(this.dossierId(), slot.id);
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  discardProposition(): void {
    this.proposition.set(null);
  }

  async applyProposition(): Promise<void> {
    const prop = this.proposition();
    if (!prop || this.propositionBusy()) return;
    this.propositionBusy.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.appliquerPropositionMarche(this.dossierId(), {
        metadonnees: prop.metadonnees ?? undefined,
        piecesAttendues: prop.piecesAttendues,
      });
      this.proposition.set(null);
      this.info.set('Propositions CPS appliquées — vérifiez les slots et les métadonnées.');
      await this.charger(this.dossierId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.propositionBusy.set(false);
    }
  }

  private async essayerPropositionApresCps(): Promise<void> {
    const cps = this.pieceCps();
    if (!cps?.id || this.proposition()) return;
    // Index CPS async : quelques tentatives espacées.
    for (const delay of [1500, 3000, 5000]) {
      await this.sleep(delay);
      try {
        const prop = await this.api.proposerMarche(this.dossierId(), cps.id);
        if (prop?.piecesAttendues?.length) {
          this.proposition.set(prop);
          return;
        }
      } catch {
        /* retry */
      }
    }
  }

  private async tenterPropositionSiCps(): Promise<void> {
    const cps = this.pieceCps();
    if (!cps?.id || this.proposition() || this.proposeTentePour === cps.id) return;
    this.proposeTentePour = cps.id;
    try {
      const prop = await this.api.proposerMarche(this.dossierId(), cps.id);
      if (prop?.piecesAttendues?.length) {
        this.proposition.set(prop);
      }
    } catch {
      /* fallback manuel silencieux */
    }
  }

  async extraire(piece?: DossierDocument): Promise<void> {
    if (!this.modifiable() || !piece || this.extractionEnCours()) return;

    if (this.dpgfEffectif()) {
      const ok = await this.confirmDialog.confirm({
        title: 'Remplacer le bordereau',
        message:
          'Un arbre existe déjà. L’extraction validée remplacera entièrement la structure actuelle (lots, articles et chiffrages). Continuer ?',
        variant: 'danger',
        confirmLabel: 'Continuer l’extraction',
      });
      if (!ok) return;
    }

    this.phase.set('running');
    this.erreur.set(undefined);
    this.info.set(undefined);
    this.pieceExtraction.set(piece);
    this.draftArbre.set(null);
    this.progressPercent.set(0);
    this.progressStep.set('Mise en file…');

    try {
      let job = await this.api.demarrerExtractionBordereau(this.dossierId(), piece.id);
      this.jobCourant.set(job);
      this.progressPercent.set(job.progressPercent ?? 0);
      this.progressStep.set(job.progressStep ?? 'Extraction…');
      job = await this.attendreJob(this.dossierId(), job.id);

      if (job.status === 'FAILED') {
        this.phase.set('error');
        this.erreur.set(
          job.errorMessage || job.errorCode || 'Échec de l’extraction du bordereau.',
        );
        return;
      }

      const arbre = job.result?.arbre;
      if (!arbre?.length) {
        this.phase.set('error');
        this.erreur.set('Aucun poste extrait — vérifiez le document source.');
        return;
      }

      this.jobCourant.set(job);
      this.draftArbre.set(structuredClone(arbre));
      this.draftToken.update((n) => n + 1);
      this.phase.set('review');
      this.progressPercent.set(100);
      this.progressStep.set('Revue');
    } catch (e) {
      this.phase.set('error');
      this.erreur.set(this.messageErreur(e));
    }
  }

  onDraftChange(arbre: ImportNoeudPreview[]): void {
    // Mise à jour sans changer draftToken — évite de re-seeder l'arbre à chaque édition.
    this.draftArbre.set(arbre);
  }

  async validerExtraction(): Promise<void> {
    const arbre = this.draftArbre();
    const piece = this.pieceExtraction();
    if (!arbre?.length || !piece || this.phase() === 'saving') return;

    if (this.articlesExploitables() === 0) {
      this.erreur.set(
        'Aucun article exploitable (unité + quantité > 0). Corrigez les lignes marquées « incomplet ».',
      );
      return;
    }

    if (this.structureVerrouillee()) {
      this.erreur.set(
        'La structure est figée. Réouvrez le bordereau depuis l’entête pour remplacer l’arbre.',
      );
      return;
    }

    const hasExisting = !!(this.dpgfIdLocal() || this.dpgfId());
    if (hasExisting) {
      const ok = await this.confirmDialog.confirm({
        title: 'Remplacer le bordereau existant',
        message:
          'L’arbre actuel et le chiffrage associé seront supprimés, puis remplacés par l’extraction. Cette action est irréversible.',
        variant: 'danger',
        confirmLabel: 'Remplacer',
      });
      if (!ok) return;
    }

    this.phase.set('saving');
    this.erreur.set(undefined);
    try {
      const saved: ValiderBordereauResult = await this.api.validerBordereau(
        this.dossierId(),
        arbre,
        piece.id,
        hasExisting,
      );
      this.dpgfIdLocal.set(saved.dpgfId);
      this.resetExtractionState();
      if (saved.articlesIgnores > 0) {
        this.info.set(
          `${saved.articlesAcceptes} article${saved.articlesAcceptes > 1 ? 's' : ''} importé${
            saved.articlesAcceptes > 1 ? 's' : ''
          } — ${saved.articlesIgnores} ignoré${saved.articlesIgnores > 1 ? 's' : ''} (unité ou quantité manquante).`,
        );
      } else {
        this.info.set(
          `${saved.articlesAcceptes} article${saved.articlesAcceptes > 1 ? 's' : ''} importé${
            saved.articlesAcceptes > 1 ? 's' : ''
          }.`,
        );
      }
      this.change.emit();
    } catch (e) {
      this.phase.set('review');
      this.erreur.set(this.messageErreur(e));
    }
  }

  async relancerExtraction(): Promise<void> {
    const job = this.jobCourant();
    const piece = this.pieceExtraction();
    if (!this.modifiable()) return;

    if (job && (job.status === 'FAILED' || this.phase() === 'error')) {
      this.phase.set('running');
      this.erreur.set(undefined);
      try {
        let next = await this.api.relancerExtractionJob(this.dossierId(), job.id);
        this.jobCourant.set(next);
        next = await this.attendreJob(this.dossierId(), next.id);
        if (next.status === 'FAILED') {
          this.phase.set('error');
          this.erreur.set(
            next.errorMessage || next.errorCode || 'Échec de l’extraction du bordereau.',
          );
          return;
        }
        const arbre = next.result?.arbre;
        if (!arbre?.length) {
          this.phase.set('error');
          this.erreur.set('Aucun poste extrait — vérifiez le document source.');
          return;
        }
        this.jobCourant.set(next);
        this.draftArbre.set(structuredClone(arbre));
        this.draftToken.update((n) => n + 1);
        this.phase.set('review');
      } catch (e) {
        this.phase.set('error');
        this.erreur.set(this.messageErreur(e));
      }
      return;
    }

    if (piece) {
      this.resetExtractionState();
      await this.extraire(piece);
    }
  }

  annulerExtraction(): void {
    this.resetExtractionState();
    this.info.set(undefined);
  }

  /** Polling avec backoff jusqu'à terminal (SUCCEEDED / FAILED / CANCELLED). */
  private async attendreJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    const delays = [800, 1200, 2000, 3000, 4000, 5000];
    let delayIdx = 0;
    const deadline = Date.now() + 6 * 60_000;
    let job = await this.api.statutExtractionJob(dossierId, jobId);
    this.jobCourant.set(job);
    this.progressPercent.set(job.progressPercent ?? 0);
    this.progressStep.set(job.progressStep ?? null);
    while (!this.estTerminal(job.status) && Date.now() < deadline) {
      await this.sleep(delays[Math.min(delayIdx, delays.length - 1)]);
      delayIdx += 1;
      job = await this.api.statutExtractionJob(dossierId, jobId);
      this.jobCourant.set(job);
      this.progressPercent.set(job.progressPercent ?? 0);
      this.progressStep.set(job.progressStep ?? null);
    }
    if (!this.estTerminal(job.status)) {
      throw new Error('EXTRACTION_TIMEOUT');
    }
    return job;
  }

  private estTerminal(status: string): boolean {
    return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resetExtractionState(): void {
    this.phase.set('idle');
    this.jobCourant.set(null);
    this.pieceExtraction.set(null);
    this.draftArbre.set(null);
    this.draftToken.set(0);
    this.progressPercent.set(0);
    this.progressStep.set(null);
  }

  async demarrerManuel(): Promise<void> {
    if (!this.modifiable()) return;
    if (this.enRevue() || this.extractionEnCours()) {
      this.resetExtractionState();
    }
    this.initManuel.set(true);
    this.erreur.set(undefined);
    this.info.set(undefined);
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
    if (!this.modifiable() || this.envoiSlot()) return;
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
      const [docs, slots] = await Promise.all([
        this.api.listerDocuments(dossierId),
        this.api.listerPiecesAttendues(dossierId),
      ]);
      this.pieces.set(docs);
      this.slotsAttendus.set(slots);
      if (this.mode() === 'documents') {
        void this.tenterPropositionSiCps();
      }
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
    if (err?.status === 413 || err?.error?.code === 'PAYLOAD_TOO_LARGE') {
      return 'Fichier trop volumineux — utilisez un PDF de moins de 50 Mo.';
    }
    const code = err?.error?.code ?? err?.error?.message;
    if (code === 'etudes.bordereau.aucune_piece_stockee') {
      return 'Aucun BDP stocké à l’étape Documents. Revenez en arrière et déposez le bordereau.';
    }
    if (code === 'etudes.document.telechargement_impossible') {
      return 'Ce fichier a été déposé avant le stockage MinIO — retirez-le et déposez-le à nouveau à l’étape Documents.';
    }
    if (code === 'etudes.bordereau.aucun_article_exploitable') {
      return 'Aucun article exploitable après validation — chaque article doit avoir une unité et une quantité > 0.';
    }
    if (code === 'etudes.bordereau.arbre_vide') {
      return 'Arbre vide — ajoutez au moins un lot et un article.';
    }
    const raw = code ?? '';
    if (
      raw.includes('EXTRACTION_TIMEOUT') ||
      raw.includes('EOF') ||
      raw.includes('LLM_PROVIDER_ERROR')
    ) {
      return 'Extraction trop longue ou coupée — réessayez (PDF volumineux).';
    }
    if (e instanceof Error && e.message === 'EXTRACTION_TIMEOUT') {
      return 'Extraction encore en cours après plusieurs minutes — réessayez plus tard.';
    }
    return code ?? 'Échec de l’opération.';
  }
}
