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
  FileSlotsComponent,
  NfSelectComponent,
  type FileSlotDensity,
  type FileSlotFileEvent,
  type FileSlotIdEvent,
  type FileSlotModel,
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

const TYPES_CADRAGE = new Set([
  'CPS',
  'BORDEREAU',
  'CPS_ET_BORDEREAU',
  'PLAN',
  'PLA',
  'AUTRE',
  'REGLEMENT',
  'CPT',
]);

const TYPES_CADRAGE_PRINCIPAUX = new Set(['CPS', 'BORDEREAU', 'CPS_ET_BORDEREAU']);

export function estSlotCadragePrincipal(type: string | undefined): boolean {
  return TYPES_CADRAGE_PRINCIPAUX.has((type ?? '').toUpperCase());
}

export function slotMatchesMode(type: string | undefined, mode: PiecesMarcheMode): boolean {
  const t = (type ?? '').toUpperCase();
  if (mode === 'documents') return TYPES_CADRAGE.has(t);
  if (mode === 'bordereau') return t === 'BORDEREAU' || t === 'CPS_ET_BORDEREAU';
  return !TYPES_CADRAGE.has(t);
}

/**
 * Étape 1 — table de consultation : CPS, BDP, PLA, custom.
 * Étape 2 — extraire le BDP déjà déposé, ou saisie manuelle.
 * Étape 4 — pièces de destination (caution, attestations…).
 */
@Component({
  selector: 'app-pieces-marche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    NfSelectComponent,
    FileSlotsComponent,
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
  readonly peutAffecterLots = input(false);
  readonly vueLotsAffectes = input(false);

  readonly change = output<void>();
  readonly dpgfPret = output<string>();

  private readonly arbre = viewChild(BordereauArbreComponent);

  readonly acceptFiles =
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  readonly typesAjout = TYPES_DOSSIER_DOCUMENT.filter(
    (t) => t.value !== 'CPS_ET_BORDEREAU' && t.value !== 'DEVIS_FOURNISSEUR',
  );

  readonly ajoutTypeOptions: NfSelectOption[] = [
    { value: 'PLAN', label: 'PLA / Plans' },
    { value: 'REGLEMENT', label: 'Règlement de consultation' },
    { value: 'CPT', label: 'CPT' },
    { value: 'AUTRE', label: 'Custom' },
    { value: 'CAUTION', label: 'Caution' },
    { value: 'ATTESTATION', label: 'Attestation' },
  ];

  readonly ajoutTypeCadrageOptions: NfSelectOption[] = [
    { value: 'PLAN', label: 'PLA / Plans' },
    { value: 'REGLEMENT', label: 'Règlement de consultation' },
    { value: 'CPT', label: 'CPT' },
    { value: 'AUTRE', label: 'Custom' },
  ];

  readonly pieces = signal<DossierDocument[]>([]);
  readonly slotsAttendus = signal<DossierPieceAttendue[]>([]);
  readonly chargement = signal(false);
  readonly ouvertureId = signal<string | null>(null);
  readonly envoiSlot = signal<string | null>(null);
  readonly initManuel = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly info = signal<string | undefined>(undefined);
  readonly arbreTick = signal(0);

  readonly banner = computed(
    (): { tone: 'error' | 'info'; message: string } | undefined => {
      this.arbreTick();
      if (this.erreur()) return { tone: 'error', message: this.erreur()! };
      const arbreErr = this.arbre()?.erreur();
      if (arbreErr) return { tone: 'error', message: arbreErr };
      if (this.mode() === 'bordereau' && !this.enRevue()) {
        const arbre = this.arbre();
        if (arbre) {
          const ignores = arbre.compteIgnores();
          if (ignores > 0) {
            return {
              tone: 'info',
              message: this.messageArticlesACorriger(arbre.compteExploitables(), ignores),
            };
          }
          return undefined;
        }
      }
      if (this.info()) return { tone: 'info', message: this.info()! };
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

  readonly fileSlots = computed((): FileSlotModel[] =>
    this.slotsVisibles().map((slot) => this.toFileSlot(slot)),
  );

  readonly slotsDensity = computed((): FileSlotDensity =>
    this.mode() === 'destination' ? 'comfortable' : 'compact',
  );

  readonly slotsColumns = computed(() => (this.mode() === 'destination' ? 2 : 1));

  readonly autresOuverts = signal(false);

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
        return 'Documents de la consultation';
    }
  });

  readonly aide = computed(() => {
    switch (this.mode()) {
      case 'bordereau':
        return 'Le BDP se dépose au cadrage. Ici : extraire l’arbre, ou le saisir à la main.';
      case 'destination':
        return 'Documents détectés dans le CPS (règlement, caution…). À joindre ici, y compris après soumission, avant la validation N+1.';
      default:
        return 'CPS et BDP d’abord. Les autres pièces se plient dessous — elles ne bloquent pas l’affectation.';
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

  /** Dépôt / remplacement / suppression : cadrage seulement, pas l’étape Bordereau. */
  readonly slotsReadonly = computed(
    () => !this.modifiable() || this.mode() === 'bordereau',
  );

  fichierDeposeFige(piece: DossierDocument | undefined): boolean {
    if (!piece) return false;
    if (this.mode() === 'bordereau') return true;
    return this.mode() === 'documents' && this.figeFichiersDeposes();
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
      this.modifiable();
      this.mode();
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

  libelleSlot(slot: DossierPieceAttendue): string {
    const lib = (slot.libelle ?? '').trim();
    if (lib) return lib;
    return this.libelleType(slot.type);
  }

  /** Corrige le mojibake fréquent UTF-8 lu en Latin-1 (ex. NÂ° → N°). */
  async ouvrir(piece: DossierDocument): Promise<void> {
    if (!piece?.id || this.ouvertureId()) return;
    this.erreur.set(undefined);
    this.ouvertureId.set(piece.id);
    try {
      const blob = await this.api.telechargerDocument(this.dossierId(), piece.id);
      const nom = this.nomFichierAffiche(piece.nomFichier) || 'document';
      const typed =
        blob.type && blob.type !== 'application/octet-stream' && blob.type !== 'application/json'
          ? blob
          : new Blob([blob], { type: this.mimeDepuisNom(nom) });
      if (typed.size === 0) {
        throw new Error('etudes.document.telechargement_impossible');
      }
      const url = URL.createObjectURL(typed);
      const consultable =
        typed.type.startsWith('application/pdf') || typed.type.startsWith('image/');
      if (consultable) {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          this.declencherTelechargement(url, nom);
        }
      } else {
        this.declencherTelechargement(url, nom);
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      this.erreur.set(await this.messageOuverture(e));
    } finally {
      this.ouvertureId.set(null);
    }
  }

  private declencherTelechargement(url: string, nom: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    a.rel = 'noopener';
    a.click();
  }

  private mimeDepuisNom(nom: string): string {
    const lower = nom.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  }

  private async messageOuverture(e: unknown): Promise<string> {
    const err = e as { status?: number; error?: Blob | { code?: string; message?: string } };
    if (err?.error instanceof Blob) {
      try {
        const parsed = JSON.parse(await err.error.text()) as { code?: string; message?: string };
        return this.messageErreur({ ...err, error: parsed });
      } catch {
        /* ignore */
      }
    }
    return this.messageErreur(e);
  }

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
    if (slot.type === 'PLAN' || slot.type === 'PLA') return 'PLA';
    if (slot.type === 'AUTRE') return 'Custom';
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

  private toFileSlot(slot: DossierPieceAttendue): FileSlotModel {
    const piece = this.documentPourSlot(slot);
    const grouped = this.mode() === 'documents' && !estSlotCadragePrincipal(slot.type);
    const locked = this.fichierDeposeFige(piece);
    const extractable =
      !!piece &&
      this.peutExtraire() &&
      (slot.type === 'BORDEREAU' || slot.type === 'CPS_ET_BORDEREAU');
    return {
      id: slot.id,
      type: this.badgeSlot(slot),
      label:
        grouped || this.mode() === 'destination' ? this.libelleSlot(slot) : undefined,
      required: !!slot.obligatoire,
      grouped,
      fileId: piece?.id,
      fileName: piece
        ? this.nomFichierAffiche(piece.nomFichier) || piece.documentId
        : null,
      busy: this.envoiSlot() === slot.id,
      opening: !!piece && this.ouvertureId() === piece.id,
      locked,
      lockedLabel:
        locked && this.mode() === 'documents' ? 'Figé après cadrage' : undefined,
      dropLabel: this.dropLabel(slot),
      emptyStatus: this.modifiable() ? 'À déposer' : 'Non déposé',
      hint: slot.source === 'IA' ? 'IA' : undefined,
      dismissible:
        this.modifiable() &&
        (this.mode() === 'destination' || (this.mode() === 'documents' && grouped)),
      extract:
        extractable && piece
          ? {
              label: this.labelExtraction(),
              loading: this.extractionEnCours() && this.pieceExtraction()?.id === piece.id,
              disabled: this.extractionEnCours() || this.phase() === 'saving',
              icon: 'sparkles',
            }
          : undefined,
    };
  }

  private dropLabel(slot: DossierPieceAttendue): string {
    if (slot.type === 'BORDEREAU') return 'Déposer un BDP';
    if (slot.type === 'PLAN' || slot.type === 'PLA') return 'Déposer les plans (PLA)';
    if (this.mode() === 'documents') return 'Déposer le fichier';
    if (this.mode() === 'bordereau') return 'Déposer un BDP';
    return 'Glissez-déposez le fichier ici';
  }

  onSlotFile(event: FileSlotFileEvent): void {
    const slot = this.slotsAttendus().find((s) => s.id === event.slotId);
    if (slot) void this.deposer(event.file, slot);
  }

  onSlotOpen(event: FileSlotIdEvent): void {
    const slot = this.slotsAttendus().find((s) => s.id === event.slotId);
    const piece = slot ? this.documentPourSlot(slot) : undefined;
    if (piece) void this.ouvrir(piece);
  }

  onSlotRemove(event: FileSlotIdEvent): void {
    const slot = this.slotsAttendus().find((s) => s.id === event.slotId);
    const piece = slot ? this.documentPourSlot(slot) : undefined;
    if (piece) void this.supprimer(piece);
  }

  onSlotExtract(event: FileSlotIdEvent): void {
    const slot = this.slotsAttendus().find((s) => s.id === event.slotId);
    const piece = slot ? this.documentPourSlot(slot) : undefined;
    if (piece) void this.extraire(piece);
  }

  onSlotDismiss(event: FileSlotIdEvent): void {
    const slot = this.slotsAttendus().find((s) => s.id === event.slotId);
    if (slot) void this.retirerSlot(slot);
  }

  private async deposer(file: File, slot: DossierPieceAttendue): Promise<void> {
    if (!this.modifiable() || this.envoiSlot() || this.mode() === 'bordereau') return;

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
      this.autresOuverts.set(true);
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
    const indexed = await this.attendreIndexCpsPourDestination(cps.id);
    if (!indexed) {
      this.capturedForCps = '';
      return;
    }
    try {
      const prop = await this.api.proposerMarche(this.dossierId(), cps.id);
      const dest = (prop?.piecesAttendues ?? []).filter((p) =>
        slotMatchesMode(p.type, 'destination'),
      );
      if (dest.length) {
        await this.api.appliquerPropositionMarche(this.dossierId(), {
          piecesAttendues: dest,
        });
        this.slotsAttendus.set(await this.api.listerPiecesAttendues(this.dossierId()));
      }
      this.change.emit();
    } catch {
      this.capturedForCps = '';
    }
  }

  private async attendreIndexCpsPourDestination(cpsDocumentId: string): Promise<boolean> {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      let jobs: ExtractionJobDto[] = [];
      try {
        jobs = await this.api.listExtractionJobs(this.dossierId());
      } catch {
        jobs = [];
      }
      const job = jobs
        .filter((j) => j.jobType === 'CPS_INDEX' && j.dossierDocumentId === cpsDocumentId)
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
      if (job?.status === 'SUCCEEDED') return true;
      if (job?.status === 'FAILED' || job?.status === 'CANCELLED') return false;
      try {
        const prop = await this.api.proposerMarche(this.dossierId(), cpsDocumentId);
        const meta = prop?.metadonnees;
        const hasMeta =
          !!meta && Object.values(meta).some((v) => v != null && String(v).trim() !== '');
        const dest = (prop?.piecesAttendues ?? []).filter((p) =>
          slotMatchesMode(p.type, 'destination'),
        );
        if (hasMeta || dest.length) return true;
      } catch {
        /* 204 */
      }
      await this.sleep(job?.status === 'RUNNING' ? 1500 : 2000);
    }
    return false;
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

  onArbrePersisteChange(): void {
    this.arbreTick.update((n) => n + 1);
    this.change.emit();
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
      this.info.set(
        saved.articlesIgnores > 0
          ? this.messageArticlesACorriger(saved.articlesAcceptes, saved.articlesIgnores)
          : undefined,
      );
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
      if (res?.dpgfId) {
        this.dpgfIdLocal.set(res.dpgfId);
        this.dpgfPret.emit(res.dpgfId);
      }
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
    if (!this.modifiable() || this.envoiSlot() || this.mode() === 'bordereau') return;
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
        await this.assurerArbreVide();
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

  private messageArticlesACorriger(exploitables: number, ignores: number): string {
    const art = `${exploitables} article${exploitables > 1 ? 's' : ''}`;
    return `${art} — ${ignores} à corriger (unité ou quantité manquante). Les lignes restent dans l’arbre, marquées « incomplet ». Cliquez « ${ignores} à corriger » pour les voir.`;
  }
}
