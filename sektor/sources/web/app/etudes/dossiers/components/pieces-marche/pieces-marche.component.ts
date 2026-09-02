import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ButtonComponent,
  ConfirmDialogService,
  IconComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@platform/lib/anatomy';

import { TYPES_DOSSIER_DOCUMENT } from '@app/etudes/models';
import type {
  DossierDocument,
  DossierPieceAttendue,
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

export type PiecesMarcheMode = 'documents' | 'bordereau' | 'destination';
export type ExtractionPhase = 'idle' | 'running' | 'review' | 'saving' | 'error';

export function slotMatchesMode(type: string | undefined, mode: PiecesMarcheMode): boolean {
  const t = (type ?? '').toUpperCase();
  if (mode === 'documents') return t === 'CPS' || t === 'CPS_ET_BORDEREAU';
  if (mode === 'bordereau') return t === 'BORDEREAU' || t === 'CPS_ET_BORDEREAU';
  return t !== 'CPS' && t !== 'BORDEREAU' && t !== 'CPS_ET_BORDEREAU';
}

/**
 * Étape 1 — CPS optionnel (préremplit le cadrage).
 * Étape 2 — dépôt BDP + construction de l'arbre.
 * Étape 4 — pièces de destination (caution, plans…) détectées par le CPS.
 */
@Component({
  selector: 'app-pieces-marche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    IconComponent,
    NfSelectComponent,
    BordereauArbreComponent,
    FormsModule,
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
  /** Focus nœud (gate « Voir dans l’arbre »). */
  readonly focusNoeudId = input<string | null>(null);
  readonly focusCode = input<string | null>(null);
  readonly focusToken = input(0);
  /**
   * CPS déjà déposé : plus de remplacement une fois le cadrage quitté
   * (statut autre que BROUILLON).
   */
  readonly figeFichiersDeposes = input(false);

  readonly change = output<void>();

  private readonly arbre = viewChild(BordereauArbreComponent);

  readonly acceptFiles =
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  readonly typesAjout = TYPES_DOSSIER_DOCUMENT.filter(
    (t) => t.value !== 'CPS_ET_BORDEREAU' && t.value !== 'DEVIS_FOURNISSEUR',
  );

  readonly ajoutTypeOptions: NfSelectOption[] = [
    ...this.typesAjout
      .filter((t) => t.value !== 'BORDEREAU' && t.value !== 'CPS')
      .map((t) => ({ value: t.value, label: t.label })),
    { value: 'CAUTION', label: 'Caution' },
    { value: 'ATTESTATION', label: 'Attestation' },
  ];

  readonly pieces = signal<DossierDocument[]>([]);
  readonly slotsAttendus = signal<DossierPieceAttendue[]>([]);
  readonly chargement = signal(false);
  readonly envoiSlot = signal<string | null>(null);
  readonly dragOverSlot = signal<string | null>(null);
  readonly initManuel = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly info = signal<string | undefined>(undefined);

  readonly banner = computed(
    (): { tone: 'error' | 'info'; message: string } | undefined => {
      if (this.erreur()) return { tone: 'error', message: this.erreur()! };
      if (this.info()) return { tone: 'info', message: this.info()! };
      const arbreErr = this.arbre()?.erreur();
      if (arbreErr) return { tone: 'error', message: arbreErr };
      return undefined;
    },
  );
  readonly dpgfIdLocal = signal<string | undefined>(undefined);

  readonly phase = signal<ExtractionPhase>('idle');
  readonly jobCourant = signal<ExtractionJobDto | null>(null);
  readonly pieceExtraction = signal<DossierDocument | null>(null);
  readonly draftArbre = signal<ImportNoeudPreview[] | null>(null);
  readonly draftToken = signal(0);
  readonly progressPercent = signal(0);
  readonly progressStep = signal<string | null>(null);

  readonly propositionBusy = signal(false);
  readonly ajoutOuvert = signal(false);
  readonly ajoutType = signal<string>('REGLEMENT');
  readonly ajoutLibelle = signal('');
  readonly ajoutObligatoire = signal(false);

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

  readonly slotsVisibles = computed(() =>
    this.slotsAttendus().filter((s) => slotMatchesMode(s.type, this.mode())),
  );

  readonly montreZones = computed(() => {
    const m = this.mode();
    return m === 'documents' || m === 'destination' || m === 'bordereau';
  });

  readonly titre = computed(() => {
    switch (this.mode()) {
      case 'bordereau':
        return 'Bordereau';
      case 'destination':
        return 'Pièces de destination — rappel N+1';
      default:
        return 'Importer le CPS';
    }
  });

  readonly aide = computed(() => {
    switch (this.mode()) {
      case 'bordereau':
        return 'Déposez un BDP pour extraire l’arbre, ou construisez-le à la main.';
      case 'destination':
        return 'Documents détectés dans le CPS (règlement, plans, caution…). À joindre ici, y compris après soumission, avant la validation N+1.';
      default:
        return 'Optionnel — préremplit le cadrage. Remplaçable tant que le dossier est en brouillon.';
    }
  });

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

  /** Fichier BDP source (1er bordereau déposé) — provenance de l’extraction. */
  readonly sourceBordereauNom = computed(() => {
    const piece = this.piecesBordereau()[0];
    if (!piece) return null;
    const nom = this.nomFichierAffiche(piece.nomFichier);
    return nom || null;
  });

  readonly sourceBordereauPiece = computed(() => this.piecesBordereau()[0] ?? null);

  readonly aDejaUnArbre = computed(() => {
    if (this.enRevue()) return true;
    if (this.bordereauDocumentId()) return true;
    const arbre = this.arbre();
    if (!arbre) return false;
    return arbre.nodes().length > 0 || arbre.compteArticles() > 0;
  });

  revelerNoeud(id?: string | null, code?: string | null): void {
    this.arbre()?.revelerNoeud(id, code);
  }

  readonly peutExtraire = computed(
    () =>
      this.mode() === 'bordereau' &&
      this.modifiable() &&
      !this.structureVerrouillee() &&
      !this.enRevue() &&
      !!this.sourceBordereauPiece(),
  );

  readonly labelExtraction = computed(() => (this.aDejaUnArbre() ? 'Ré-extraire' : 'Extraire'));

  fichierDeposeFige(piece: DossierDocument | undefined): boolean {
    return this.mode() === 'documents' && this.figeFichiersDeposes() && !!piece;
  }

  /** Arbre toujours éditable, sauf structure figée après chiffrage. */
  readonly editionStructure = computed(
    () =>
      !this.enRevue() &&
      !this.extractionEnCours() &&
      !this.structureVerrouillee(),
  );

  private readonly labelsParType = Object.fromEntries(
    TYPES_DOSSIER_DOCUMENT.map((t) => [t.value, t.label]),
  ) as Record<string, string>;

  constructor() {
    effect(() => {
      const id = this.dossierId();
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

  /** Corrige le mojibake fréquent UTF-8 lu en Latin-1 (ex. NÂ° → N°). */
  nomFichierAffiche(nom: string | null | undefined): string {
    if (!nom) return '';
    const patched = nom
      .normalize('NFC')
      .replace(/Â°/g, '°')
      .replace(/A\u0302°/g, '°')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è');
    if (!/Â.|Ã./.test(patched)) return patched;
    try {
      const bytes = Uint8Array.from(patched, (c) => c.charCodeAt(0) & 0xff);
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return patched;
    }
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

  onDragOver(event: DragEvent, slotKey: string): void {
    if (!this.modifiable() || this.envoiSlot()) return;
    const slot = this.slotsAttendus().find((s) => s.id === slotKey);
    if (slot && this.fichierDeposeFige(this.documentPourSlot(slot))) return;
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
    if (this.fichierDeposeFige(existante)) return;
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
        void this.capturerDestinationSilencieux();
      }
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
      try {
        await this.charger(this.dossierId());
      } catch {
        /* l'erreur de dépôt prime */
      }
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

  private capturedForCps = '';

  private async capturerDestinationSilencieux(): Promise<void> {
    if (this.mode() !== 'documents') return;
    const cps = this.pieceCps();
    if (!cps?.id || this.capturedForCps === cps.id) return;
    this.capturedForCps = cps.id;
    for (const delay of [0, 2500, 5000, 8000]) {
      if (delay) await this.sleep(delay);
      if (this.pieceCps()?.id !== cps.id) return;
      try {
        const prop = await this.api.proposerMarche(this.dossierId(), cps.id);
        const meta = prop?.metadonnees;
        const hasMeta =
          !!meta && Object.values(meta).some((v) => v != null && String(v).trim() !== '');
        const dest = (prop?.piecesAttendues ?? []).filter((p) =>
          slotMatchesMode(p.type, 'destination'),
        );
        if (!hasMeta && dest.length === 0) continue;
        await this.api.appliquerPropositionMarche(this.dossierId(), {
          metadonnees: hasMeta ? meta : undefined,
          piecesAttendues: dest.length ? dest : undefined,
        });
        this.slotsAttendus.set(await this.api.listerPiecesAttendues(this.dossierId()));
        this.change.emit();
        return;
      } catch {
        /* index CPS async — retry silencieux */
      }
    }
    this.capturedForCps = '';
  }

  async extraire(piece?: DossierDocument): Promise<void> {
    if (!this.modifiable() || !piece || this.extractionEnCours()) return;

    if (this.dpgfEffectif() && this.aDejaUnArbre()) {
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
          } — ${saved.articlesIgnores} à corriger (unité ou quantité manquante). Les lignes restent dans l’arbre, marquées « incomplet ». Cliquez « ${saved.articlesIgnores} à corriger » pour les voir.`,
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

  voirLignesACorriger(): void {
    this.arbre()?.revelerIncomplets();
  }

  /** Polling jusqu'à terminal (SUCCEEDED / FAILED / CANCELLED). Vision multi-pages = long. */
  private async attendreJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    const deadline = Date.now() + 20 * 60_000;
    let job = await this.api.statutExtractionJob(dossierId, jobId);
    this.jobCourant.set(job);
    this.progressPercent.set(job.progressPercent ?? 0);
    this.progressStep.set(this.libelleProgress(job.progressStep));
    while (!this.estTerminal(job.status) && Date.now() < deadline) {
      // Poll rapide pour refléter le % page/page pendant la vision.
      await this.sleep(job.status === 'RUNNING' ? 900 : 1200);
      job = await this.api.statutExtractionJob(dossierId, jobId);
      this.jobCourant.set(job);
      this.progressPercent.set(job.progressPercent ?? 0);
      this.progressStep.set(this.libelleProgress(job.progressStep));
    }
    if (!this.estTerminal(job.status)) {
      throw new Error('EXTRACTION_TIMEOUT');
    }
    return job;
  }

  private libelleProgress(step: string | null | undefined): string | null {
    if (!step) return null;
    const legacy: Record<string, string> = {
      queued: 'Mise en file…',
      loading: 'Chargement du document…',
      extracting: 'Extraction…',
      mapping: 'Assemblage…',
      indexing: 'Indexation…',
      linking: 'Liaison…',
      done: 'Terminé',
      failed: 'Échec',
      retry_scheduled: 'Nouvelle tentative…',
    };
    return legacy[step] ?? step;
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
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.initManuel.set(false);
    }
  }

  private async assurerArbreVide(): Promise<void> {
    if (!this.modifiable() || this.structureVerrouillee()) return;
    if (this.dpgfEffectif() || this.initManuel()) return;
    if (this.enRevue() || this.extractionEnCours()) return;
    await this.demarrerManuel();
  }

  async supprimer(piece: DossierDocument): Promise<void> {
    if (!this.modifiable() || this.envoiSlot()) return;
    if (this.fichierDeposeFige(piece)) return;
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
        void this.capturerDestinationSilencieux();
      }
      if (this.mode() === 'bordereau') {
        void this.assurerArbreVide();
      }
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  private messageErreur(e: unknown): string {
    const err = e as {
      status?: number;
      statusText?: string;
      message?: string;
      name?: string;
      error?: { message?: string; code?: string; error?: string } | string;
    };
    // Backend coupé / CORS / network (status 0 seulement — pas les 4xx/5xx Angular « Http failure »).
    if (
      err?.status === 0 ||
      (err?.name === 'HttpErrorResponse' && (err.status === undefined || err.status === 0))
    ) {
      return 'Connexion au serveur perdue — vérifiez que l’API tourne, puis Relancer.';
    }
    if (err?.status != null && err.status >= 500) {
      return 'Erreur serveur lors de l’opération — réessayez. Si ça persiste, contactez le support.';
    }
    if (err?.status === 403) {
      return "Vous n'avez pas la permission de déposer des pièces.";
    }
    const body = err?.error;
    const fromBody =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object'
          ? (body.code ?? body.message ?? body.error)
          : undefined;
    const domain =
      typeof body === 'object' && body && typeof body.message === 'string' && body.message.startsWith('etudes.')
        ? body.message
        : typeof fromBody === 'string' && fromBody.startsWith('etudes.')
          ? fromBody
          : undefined;
    if (err?.status === 413 || fromBody === 'PAYLOAD_TOO_LARGE') {
      return 'Fichier trop volumineux — utilisez un PDF de moins de 50 Mo.';
    }
    const code = domain ?? fromBody;
    if (code === 'etudes.bordereau.aucune_piece_stockee') {
      return 'Aucun BDP déposé à l’étape Bordereau. Déposez le fichier ici, ou passez en saisie manuelle.';
    }
    if (code === 'etudes.document.telechargement_impossible') {
      return 'Le fichier n’a pas pu être relu dans le stockage. Retirez-le et déposez-le à nouveau.';
    }
    if (code === 'etudes.document.lecture_impossible') {
      return 'Impossible de lire le fichier déposé — réessayez avec un PDF.';
    }
    if (code === 'etudes.bordereau.aucun_article_exploitable') {
      return 'Aucun article exploitable après validation — chaque article doit avoir une unité et une quantité > 0.';
    }
    if (code === 'etudes.bordereau.arbre_vide') {
      return 'Arbre vide — ajoutez au moins un lot et un article.';
    }
    if (code === 'etudes.dossier.verrouille') {
      return 'Ce dossier est verrouillé — les pièces ne peuvent plus être modifiées.';
    }
    if (err?.status === 409) {
      return 'Ce dossier a été modifié entre-temps. Rechargez la page, puis réessayez.';
    }
    const raw = (typeof code === 'string' ? code : '') || '';
    if (raw.toUpperCase() === 'CONFLICT') {
      return 'Ce dossier a été modifié entre-temps. Rechargez la page, puis réessayez.';
    }
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
    return (typeof code === 'string' ? code : undefined) ?? 'Échec de l’opération.';
  }
}
