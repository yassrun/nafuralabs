import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ButtonComponent, ScreenComponent, WizardShellComponent, StatusActionBarComponent, NfSelectComponent, MapPickerComponent, VilleMaSelectComponent, type LookupSearchFn, type NfSelectOption } from '@platform/lib/anatomy';
import { DossierEtude, type DossierDocument, type NoeudDPGF } from '@app/etudes/models';
import { normalizeStatutDossier } from '@app/etudes/dossiers/utils/dossier-status.util';
import { DossierEtudeApiService, PostesOrphelinsError, type ConversionRequest, type PlacementPosteOrphelin } from '@app/etudes/dossiers/services/dossier-etude-api.service';
import { PostesOrphelinsDialogComponent } from '@app/etudes/dossiers/components/postes-orphelins-dialog/postes-orphelins-dialog.component';
import { ErpLookupService, partnerSelectOptions } from '@app/socle/shared/services/erp-lookup.service';
import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@app/socle/shared/config/attachment-detail.config';
import type { Marche } from '@app/marches/models';
import { ContratMarcheApiService } from '@app/marches/contrats/services/contrat-marche-api.service';
import { ChantierApiService } from '../services/chantier-api.service';
import { ChantierWorkflowApiService, type ChantierBdp, type ChantierWorkflow, type WorkflowReserve, type WorkflowGarantie } from '../services/chantier-workflow-api.service';
import type { ChantierType } from '@app/chantiers/models';
import { chantierToUi } from '../services/chantier.mapper';
import { ChantierEquipeTabComponent } from '../components/chantier-equipe-tab/chantier-equipe-tab.component';
import { ChantierLotsTabComponent } from '../components/chantier-lots-tab/chantier-lots-tab.component';
import { chantierToMarcheDraft } from '../chantier-detail/chantier-marche-draft';
import { DocumentsApiService } from '../documents/services/documents-api.service';
import { DocumentChantier } from '../documents/models';
import { DpgfApiService } from '@app/etudes/services/dpgf-api.service';
import {
  ACTION_LABELS, BDP_MANQUE_LABELS, BLOCKER_LABELS, CHANTIER_LIFECYCLE_STEPS, CHANTIER_PREPARATION_STEPS,
  CHANTIER_STATUS_BAR, CHANTIER_STATUS_LABELS, enPreparation, lifecycleStep, preparationStep,
} from './chantier-workflow.config';
import {
  CADRAGE_PIECE_SLOTS, DEFAULT_EXTRA_SLOTS, KNOWN_PIECE_TAGS, PREPARATION_PIECE_SLOTS, type ChantierPieceSlot,
} from './chantier-piece-slots';
import { ChantierPiecesComponent, type StudyDocRef } from './chantier-pieces.component';

const REQUIRED_EQUIPE_ROLES = ['BTP_CONDUCTEUR_TRAVAUX', 'BTP_CHEF_CHANTIER'];
const ETUDE_CONVERTIBLE_STATUS = 'FINAL_APPROVED';
const ETUDE_HORS_STATUT_MSG =
  'Cette étude n’est pas en validation finale. Seules les études validées définitivement peuvent préremplir un chantier. Choisissez-en une autre, ou continuez sans étude.';
const CHANTIER_TYPE_OPTIONS: NfSelectOption[] = [
  { value: 'BATIMENT', label: 'Bâtiment' },
  { value: 'TP', label: 'Travaux publics' },
  { value: 'VRD', label: 'VRD' },
  { value: 'GO', label: 'Gros œuvre' },
  { value: 'TCE', label: 'Tous corps d’état' },
  { value: 'REHABILITATION', label: 'Réhabilitation' },
];

interface StudyBdpRow {
  type: 'LOT' | 'SOUS_LOT' | 'ARTICLE';
  depth: number;
  code: string;
  libelle: string;
  quantite?: number;
  unite?: string;
  prixUnitaire?: number;
  total?: number;
}

interface StudyBdpPreview {
  totalHt: number;
  nombreArticles: number;
  nombreLots: number;
  rows: StudyBdpRow[];
}

/**
 * Un chantier se prépare en quatre temps — cadrage et documents, BDP chiffré, équipe, démarrage —
 * puis se suit dans son cycle de vie après le démarrage.
 *
 * L'étude est facultative et ne sert qu'à préremplir : elle préremplit les informations du chantier
 * et, à la conversion, les lignes du bordereau avec leurs quantités et leurs prix. Le chantier
 * dépose ensuite ses propres pièces : celles de l'étude ne sont jamais reprises automatiquement.
 */
@Component({
  selector: 'app-chantier-onboarding', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent, ScreenComponent, WizardShellComponent, StatusActionBarComponent, ChantierEquipeTabComponent, ChantierLotsTabComponent, ChantierPiecesComponent, NfSelectComponent, MapPickerComponent, VilleMaSelectComponent],
  templateUrl: './chantier-onboarding.page.html',
  styleUrl: './chantier-onboarding.page.scss',
})
export class ChantierOnboardingPage {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly studiesApi = inject(DossierEtudeApiService);
  private readonly api = inject(ChantierWorkflowApiService);
  private readonly documentsApi = inject(DocumentsApiService);
  private readonly chantiersApi = inject(ChantierApiService);
  private readonly contratsApi = inject(ContratMarcheApiService);
  private readonly lookup = inject(ErpLookupService);
  private readonly attachments = inject(AttachmentApiService);
  private readonly auth = inject(AuthFacade);
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dialog = inject(MatDialog);

  readonly onboardingMode = input(false);
  readonly created = output<{ name: string }>();

  readonly actionLabels = ACTION_LABELS; readonly blockerLabels = BLOCKER_LABELS;
  readonly bdpManqueLabels = BDP_MANQUE_LABELS; readonly statusLabels = CHANTIER_STATUS_LABELS;
  readonly statusBar = CHANTIER_STATUS_BAR;
  readonly preparationSteps = CHANTIER_PREPARATION_STEPS;
  readonly cadrageSlots = CADRAGE_PIECE_SLOTS;
  readonly preparationSlots = PREPARATION_PIECE_SLOTS;
  readonly requiredEquipeRoles = REQUIRED_EQUIPE_ROLES;
  readonly typeOptions = CHANTIER_TYPE_OPTIONS;

  readonly loading = signal(false); readonly saving = signal(false);
  readonly error = signal(''); readonly notice = signal('');
  readonly workflow = signal<ChantierWorkflow | null>(null);
  readonly bdp = signal<ChantierBdp | null>(null);
  readonly marches = signal<Marche[]>([]);
  readonly selected = signal<DossierEtude | null>(null);
  readonly selectingStudy = signal(false);
  readonly studyOptions = signal<NfSelectOption[]>([]);
  readonly clientOptions = signal<NfSelectOption[]>([]);
  readonly documents = signal<DocumentChantier[]>([]);
  readonly extraSlots = signal<ChantierPieceSlot[]>([...DEFAULT_EXTRA_SLOTS]);
  readonly studyDocuments = signal<DossierDocument[]>([]);
  readonly studyBdpPreview = signal<StudyBdpPreview | null>(null);
  readonly step = signal(0);
  readonly pendingAction = signal('');
  readonly pendingFiles = signal<Record<string, File>>({});
  readonly dragOver = signal('');
  readonly form = signal<Record<string, any>>({});
  readonly osReference = signal('');
  readonly osDateEffet = signal('');
  readonly savingCadrage = signal(false);
  private readonly uploadedFiles = new Map<File, string>();
  private studyVersion = 0;

  draft = {
    label: '', clientId: '', clientName: '', ville: '', adresse: '',
    description: '', type: 'BATIMENT' as ChantierType,
    latitude: null as number | null, longitude: null as number | null,
    dureeMois: null as number | null, date: '', dateFinPrevue: '', montant: null as number | null,
    marcheNumero: '',
  };
  private savedDraft = JSON.stringify(this.draft);

  canLeave(): boolean {
    return this.saving() ? false
      : (JSON.stringify(this.draft) === this.savedDraft && !Object.keys(this.pendingFiles()).length)
        || window.confirm('Des modifications ou fichiers ne sont pas enregistrés. Quitter cette page ?');
  }

  constructor() { void this.load(); }

  // ── État dérivé ────────────────────────────────────────────────────────────
  readonly status = computed(() => this.workflow()?.chantier.status ?? 'EN_PREPARATION');
  readonly phasePreparation = computed(() => enPreparation(this.status()));
  readonly steps = computed(() => this.phasePreparation() ? CHANTIER_PREPARATION_STEPS : CHANTIER_LIFECYCLE_STEPS);
  readonly statusContext = computed(() => ({ status: this.status(), availableActions: this.workflow()?.availableActions ?? [] }));
  readonly blockers = computed(() => this.workflow()?.blockers ?? []);
  readonly bdpManques = computed(() => this.workflow()?.bdpManques ?? []);
  readonly header = computed(() => ({
    title: this.workflow()?.chantier.name ?? this.workflow()?.chantier.label ?? 'Préparer un chantier',
    subtitle: this.workflow()
      ? `${this.workflow()!.chantier.code} · ${this.workflow()!.chantier.clientName ?? ''}`
      : 'Cadrez le chantier, chiffrez son bordereau, affectez l’équipe, préparez le démarrage — avec ou sans étude.',
    breadcrumbs: [{ label: 'Chantiers', route: '/chantiers' }, { label: this.workflow() ? 'Cycle de vie' : 'Nouveau chantier' }],
  }));
  readonly openReserves = computed(() => this.workflow()?.data.reserves.filter(r => r.status !== 'LEVEE').length ?? 0);
  readonly activeGaranties = computed(() => this.workflow()?.data.garanties.filter(g => !['LIBEREE', 'EXPIREE'].includes(g.status)).length ?? 0);
  readonly history = computed(() => [...(this.workflow()?.data.history ?? [])].reverse());
  readonly statusHistory = computed(() => this.history().map((e, i) => ({ id: String(i), fromStatus: e.from, toStatus: e.to, action: this.actionLabels[e.action], actor: e.actor, at: e.recordedAt, motif: e.motif })));
  readonly dueGaranties = computed(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return this.workflow()?.data.garanties.filter(g => g.echeance <= today && !['LIBEREE', 'EXPIREE'].includes(g.status)) ?? [];
  });

  /**
   * Étape atteinte, en index de l'étape affichée (préparation ou cycle de vie). La vérité vient des
   * blocages du serveur, jamais de la navigation.
   */
  readonly reachedStep = computed(() => {
    const w = this.workflow();
    if (!w) return 0;
    if (!this.phasePreparation()) return lifecycleStep(this.status()) - CHANTIER_PREPARATION_STEPS.length;
    if (this.status() === 'PRET_A_DEMARRER') return 3;
    return preparationStep(w.blockers);
  });
  /** Jalons validés : le cadrage est complet, le BDP vérifié, la préparation validée. */
  readonly completedSteps = computed(() => {
    const w = this.workflow();
    if (!w) return [];
    if (!this.phasePreparation()) return Array.from({ length: this.reachedStep() }, (_, i) => i);
    const cadrageComplet = !w.blockers.some(c => ['identite_client', 'identite_chantier', 'cps', 'bdp'].includes(c));
    const bdpVerifie = !w.blockers.includes('bdp_chiffre');
    const equipeComplete = !w.blockers.includes('responsables');
    const preparationValidee = this.status() === 'PRET_A_DEMARRER';
    return [0, 1, 2, 3].filter(i =>
      (i === 0 && cadrageComplet) || (i === 1 && bdpVerifie) || (i === 2 && equipeComplete) || (i === 3 && preparationValidee));
  });

  readonly editableCadrage = computed(() => !this.workflow() || this.allowed('SAVE_PREPARATION'));
  readonly editableBdp = computed(() => this.allowed('VALIDATE_BDP'));
  /** Étude liée : l’arbre du BDP est repris, donc lecture seule jusqu’à la validation d’empreinte. */
  readonly etudeLiee = computed(() => !!this.selected() || !!this.workflow()?.chantier.dossierEtudeId);
  readonly bdpLectureSeule = computed(() => this.etudeLiee());
  readonly chiffrageOuvert = computed(() => this.editableBdp() && this.phasePreparation() && !this.etudeLiee());
  readonly sansEtude = computed(() => !this.workflow()?.chantier.dossierEtudeId && !this.workflow()?.chantier.sourceVente);
  readonly bdpLignes = computed(() => this.bdp()?.lignes.filter(l => l.nature === 'VENDU') ?? []);
  readonly bdpTotalHt = computed(() => this.bdpLignes().reduce((sum, l) => sum + (l.montantHt ?? 0), 0));
  readonly bdpValide = computed(() => !!this.workflow()?.data.bdp && !this.blockers().includes('bdp_chiffre'));
  readonly bdpValidable = computed(() => this.editableBdp() && this.bdpManques().length === 0 && this.bdpLignes().length > 0);
  readonly today = new Date().toLocaleDateString('en-CA');
  /**
   * La fin prévisionnelle découle du délai retenu. Méthode et non `computed` : la saisie vit dans
   * `draft`, un objet ordinaire que les signaux ne suivent pas.
   */
  datesCoherentes(): boolean {
    if (!this.draft.date || !this.draft.dateFinPrevue) return false;
    if (this.draft.dureeMois == null || this.draft.dureeMois <= 0) return this.draft.dateFinPrevue > this.draft.date;
    return this.draft.dateFinPrevue === this.addMonths(this.draft.date, this.draft.dureeMois);
  }
  readonly cpsDepose = computed(() => this.documentFor('CPS'));
  readonly bdpDepose = computed(() => this.documentFor('BDP'));
  readonly marcheSigne = computed(() => this.documentFor('MARCHE_SIGNE'));
  readonly documentOs = computed(() => this.documentFor('ORDRE_SERVICE'));
  readonly osEnregistre = computed(() => !!this.workflow()?.chantier['osReference']);

  // ── Chargement ─────────────────────────────────────────────────────────────
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const w = await this.api.load(id);
        this.apply(w);
        this.step.set(this.reachedStep());
        await Promise.all([this.loadDocuments(), this.loadBdp(), this.loadMarches(), this.loadStudySource(w)]);
      } else {
        const source = this.route.snapshot.queryParamMap.get('etudeId');
        if (source) { this.step.set(0); await this.selectStudy(source); }
      }
    } catch (e) { this.error.set(this.message(e)); } finally { this.loading.set(false); }
  }

  readonly searchStudies: LookupSearchFn = async q => {
    // Fail-closed : le lookup ne propose que la validation finale, même si l’API ignore le filtre.
    const result = await this.studiesApi.getAll({
      search: q, status: ETUDE_CONVERTIBLE_STATUS, pageSize: 20,
    });
    const options = result.items
      .filter((s) => this.estEtudeConvertible(s))
      .map((s) => ({ value: s.id, label: `${s.numero} · ${s.objet}`, description: s.clientNom }));
    this.studyOptions.set(options);
    return options;
  };

  readonly searchClients: LookupSearchFn = async q => {
    const options = partnerSelectOptions(await this.lookup.partnersByRole('CLIENT', q));
    this.clientOptions.set(options); return options;
  };

  onClientChange(id: string): void {
    this.draft.clientId = id;
    this.draft.clientName = this.clientOptions().find(c => c.value === id)?.label ?? '';
  }

  onMapLat(value: number | null): void { this.draft.latitude = value; }
  onMapLng(value: number | null): void { this.draft.longitude = value; }
  onMapAddress(value: string): void { this.draft.adresse = value; }
  onMapCity(value: string): void { if (value.trim()) this.draft.ville = value; }

  /** L'étude préremplit le cadrage. Elle ne crée rien et ne valide jamais le BDP à notre place. */
  async selectStudy(id: string | null): Promise<void> {
    if (this.saving() || this.workflow()) return;
    const version = ++this.studyVersion;
    if (!id) {
      this.clearStudySelection();
      this.selectingStudy.set(false);
      return;
    }
    this.selectingStudy.set(true); this.error.set('');
    try {
      const study = await this.studiesApi.getById(id);
      if (version !== this.studyVersion) return;
      if (!this.estEtudeConvertible(study)) {
        this.clearStudySelection();
        this.error.set(ETUDE_HORS_STATUT_MSG);
        return;
      }
      if ((this.draft.label || this.draft.clientId || this.draft.ville)
        && !window.confirm('Préremplir le nom, le client et la ville avec cette étude ? Un pin déjà posé sur la carte est conservé.')) return;
      this.selected.set(study);
      this.studyOptions.set([{ value: study.id, label: `${study.numero} · ${study.objet}` }]);
      const keepGeo = this.draft.latitude != null && this.draft.longitude != null;
      this.draft = {
        ...this.draft,
        label: study.objet,
        clientId: study.clientId ?? '',
        clientName: study.clientNom ?? '',
        ville: keepGeo && this.draft.ville ? this.draft.ville : (study.aoVille ?? this.draft.ville),
      };
      await this.loadStudyPreview(study);
    } catch (e) { if (version === this.studyVersion) this.error.set(this.message(e)); }
    finally { if (version === this.studyVersion) this.selectingStudy.set(false); }
  }

  private estEtudeConvertible(study: { status?: string } | null | undefined): boolean {
    return normalizeStatutDossier(study?.status) === ETUDE_CONVERTIBLE_STATUS;
  }

  private clearStudySelection(): void {
    this.selected.set(null);
    this.studyDocuments.set([]);
    this.studyBdpPreview.set(null);
    this.studyOptions.set([]);
  }

  private async loadStudyPreview(study: DossierEtude): Promise<void> {
    const [docs, syn] = await Promise.all([
      this.studiesApi.listerDocuments(study.id).catch(() => [] as DossierDocument[]),
      this.studiesApi.synthese(study.id).catch(() => null),
    ]);
    this.studyDocuments.set(docs);
    const arbre = study.dpgfId
      ? await this.dpgfApi.getArbre(study.dpgfId).catch(() => null)
      : null;
    const collected = this.collectStudyBdp(arbre?.hierarchie ?? []);
    this.studyBdpPreview.set({
      totalHt: collected.totalHt || syn?.totalHt || arbre?.totalHT || 0,
      nombreArticles: collected.nombreArticles || syn?.nombreArticles || 0,
      nombreLots: collected.nombreLots,
      rows: collected.rows,
    });
  }

  private collectStudyBdp(nodes: NoeudDPGF[]): {
    rows: StudyBdpRow[];
    nombreLots: number;
    nombreArticles: number;
    totalHt: number;
  } {
    const rows: StudyBdpRow[] = [];
    let nombreLots = 0;
    let nombreArticles = 0;
    let totalHt = 0;
    const walk = (list: NoeudDPGF[], depth: number): void => {
      for (const n of list) {
        const total = n.total ?? (
          n.quantite != null && n.prixUnitaire != null ? n.quantite * n.prixUnitaire : undefined
        );
        if (n.type === 'LOT' || n.type === 'SOUS_LOT') {
          if (n.type === 'LOT') nombreLots += 1;
          rows.push({ type: n.type, depth, code: n.code, libelle: n.libelle, total: n.total ?? total });
          if (n.enfants?.length) walk(n.enfants, depth + 1);
          continue;
        }
        if (n.type === 'ARTICLE') {
          nombreArticles += 1;
          rows.push({
            type: 'ARTICLE', depth, code: n.code, libelle: n.libelle,
            quantite: n.quantite, unite: n.unite, prixUnitaire: n.prixUnitaire, total,
          });
          totalHt += total ?? 0;
        }
        if (n.enfants?.length) walk(n.enfants, depth + 1);
      }
    };
    walk(nodes, 0);
    return { rows, nombreLots, nombreArticles, totalHt };
  }

  private async loadStudySource(w: ChantierWorkflow): Promise<void> {
    const id = w.chantier.dossierEtudeId;
    if (!id) {
      this.studyDocuments.set([]);
      return;
    }
    this.studyDocuments.set(await this.studiesApi.listerDocuments(id).catch(() => [] as DossierDocument[]));
  }

  // ── Cadrage : création du chantier ────────────────────────────────────────
  /**
   * Enregistrer le cadrage crée la fiche en préparation. Avec une étude, la conversion existante
   * fait le travail : verrou anti-doublon, contrôles commerciaux, et copie des lignes du bordereau
   * avec leurs quantités et leurs prix — c'est le préremplissage du BDP chiffré.
   */
  async saveCadrage(): Promise<void> {
    if (this.saving() || this.selectingStudy() || this.workflow()) return;
    const study = this.selected();
    if (!this.draft.label.trim()) { this.error.set('Renseignez le nom du chantier. L’étude est facultative.'); return; }
    if (study && !this.estEtudeConvertible(study)) {
      this.error.set(ETUDE_HORS_STATUT_MSG);
      return;
    }
    if (!study && !this.draft.clientId) { this.error.set('Renseignez le client, ou choisissez une étude pour le préremplir.'); return; }
    this.savingCadrage.set(true); this.saving.set(true); this.error.set('');
    try {
      const chantierId = study ? await this.convertirEtude(study) : await this.creerChantierSansEtude();
      // Garder l'identifiant tout de suite : un envoi de pièce en échec ne doit pas créer un second chantier.
      this.workflow.set({
        chantier: {
          id: chantierId, code: '', label: this.draft.label, clientId: this.draft.clientId,
          clientName: this.draft.clientName, ville: this.draft.ville, adresse: this.draft.adresse,
          description: this.draft.description, type: this.draft.type,
          latitude: this.draft.latitude ?? undefined, longitude: this.draft.longitude ?? undefined,
          status: 'EN_PREPARATION',
        },
        revision: 0, blockers: [], bdpManques: [], availableActions: [], canEdit: true,
        data: { history: [], reserves: [], garanties: [] },
      } as ChantierWorkflow);
      this.savedDraft = JSON.stringify(this.draft);
      await this.persistDocuments();
      await this.recordCadrage(chantierId);
      this.apply(await this.api.load(chantierId));
      await Promise.all([this.loadDocuments(), this.loadBdp(), this.loadMarches()]);
      if (this.onboardingMode()) { this.created.emit({ name: this.draft.label }); return; }
      await this.router.navigate(['/chantiers', chantierId, 'workflow']);
      this.step.set(this.reachedStep());
    } catch (e) {
      this.error.set(this.workflow()
        ? 'Le chantier a été créé. Les fichiers restants sont conservés : revenez au cadrage pour réessayer leur envoi.'
        : this.message(e));
      if (this.workflow()) this.step.set(0);
    } finally { this.savingCadrage.set(false); this.saving.set(false); }
  }

  private async creerChantierSansEtude(): Promise<string> {
    const created = await this.chantiersApi.create({
      name: this.draft.label.trim(), clientId: this.draft.clientId, clientName: this.draft.clientName,
      ville: this.draft.ville, adresse: this.draft.adresse, status: 'EN_PREPARATION',
      description: this.draft.description || undefined, type: this.draft.type,
      latitude: this.draft.latitude ?? undefined, longitude: this.draft.longitude ?? undefined,
    });
    return created.id;
  }

  /** Conversion de l'étude en chantier : les postes orphelins se placent devant l'humain, pas en silence. */
  private async convertirEtude(study: DossierEtude): Promise<string> {
    if (!this.estEtudeConvertible(study)) {
      throw new Error(ETUDE_HORS_STATUT_MSG);
    }
    const body: ConversionRequest = {
      chantierLabel: this.draft.label.trim(),
      chantierVille: this.draft.ville || undefined,
      dureeMois: this.draft.dureeMois ?? undefined,
    };
    for (;;) {
      try {
        const result = await this.studiesApi.convertir(study.id, body);
        return result.chantierId;
      } catch (e) {
        if (!(e instanceof PostesOrphelinsError)) throw e;
        const placements = await firstValueFrom(this.dialog
          .open<PostesOrphelinsDialogComponent, unknown, PlacementPosteOrphelin[] | null>(
            PostesOrphelinsDialogComponent,
            { data: { postes: e.postes, lotsDisponibles: e.lotsDisponibles }, autoFocus: 'first-tabbable' })
          .afterClosed());
        if (!placements) throw new Error('Conversion abandonnée : rien n’a été créé, l’étude reste gagnée.');
        body.placementsPostesOrphelins = [...(body.placementsPostesOrphelins ?? []), ...placements];
      }
    }
  }

  private identityPayload(): Record<string, unknown> {
    return {
      label: this.draft.label.trim(),
      ville: this.draft.ville,
      adresse: this.draft.adresse,
      description: this.draft.description,
      chantierType: this.draft.type,
      latitude: this.draft.latitude,
      longitude: this.draft.longitude,
      dureeMois: this.draft.dureeMois,
    };
  }

  /** Le délai d'exécution est un champ du cadrage : il se pose après la création, sans dates. */
  private async recordCadrage(chantierId: string): Promise<void> {
    try {
      await this.api.command(chantierId, {
        revision: 0, action: 'SAVE_PREPARATION', ...this.identityPayload(),
      });
    } catch { /* la sauvegarde reste possible depuis l'étape Préparation */ }
  }

  // ── BDP chiffré ───────────────────────────────────────────────────────────
  async validateBdp(): Promise<void> {
    if (!this.bdpValidable()) { this.error.set('Complétez le bordereau avant de le valider.'); return; }
    await this.execute('VALIDATE_BDP', {});
    await this.loadBdp();
  }

  private async loadBdp(): Promise<void> {
    const id = this.workflow()?.chantier.id;
    if (!id) { this.bdp.set(null); return; }
    try { this.bdp.set(await this.api.lireBdp(id)); } catch { this.bdp.set(null); }
  }

  // ── Préparation ───────────────────────────────────────────────────────────
  async saveInformations(): Promise<void> {
    await this.execute('SAVE_PREPARATION', {
      ...this.identityPayload(),
      marcheNumero: this.draft.marcheNumero,
      date: this.draft.date, dateFinPrevue: this.draft.dateFinPrevue,
    });
  }

  async validatePreparation(): Promise<void> {
    await this.execute('VALIDATE_PREPARATION', {});
  }

  /** L'OS s'enregistre avec sa référence, son document et sa date d'effet — sans démarrer. */
  async saveOs(): Promise<void> {
    const document = this.documentOs();
    if (!this.osReference().trim() || !this.osDateEffet() || !document) {
      this.error.set('Renseignez la référence de l’OS, sa date d’effet et déposez le document.');
      return;
    }
    await this.execute('SAVE_OS', { reference: this.osReference().trim(), date: this.osDateEffet(), documentId: document.id });
  }

  async demarrer(): Promise<void> {
    await this.execute('START', {});
  }

  // ── Marché ────────────────────────────────────────────────────────────────
  private async loadMarches(): Promise<void> {
    const id = this.workflow()?.chantier.id;
    if (!id) { this.marches.set([]); return; }
    try { this.marches.set((await this.contratsApi.getAll({ chantierId: id })).items); } catch { this.marches.set([]); }
  }

  /** Créer le marché depuis le chantier : c'est le rattachement explicite attendu ici. */
  async creerMarche(): Promise<void> {
    const w = this.workflow();
    if (!w || this.saving()) return;
    this.saving.set(true); this.error.set('');
    try {
      const chantier = chantierToUi(w.chantier);
      await this.contratsApi.create({
        ...chantierToMarcheDraft(chantier),
        numero: this.draft.marcheNumero.trim() || `MAR-${chantier.code}`,
      });
      await this.loadMarches();
      this.notice.set('Marché créé et rattaché au chantier.');
    } catch (e) { this.error.set(this.message(e)); } finally { this.saving.set(false); }
  }

  // ── Dates ─────────────────────────────────────────────────────────────────
  /** La fin prévisionnelle découle du délai retenu : elle se recalcule, elle ne se devine pas. */
  syncFinPrevue(): void {
    if (this.draft.date && this.draft.dureeMois != null && this.draft.dureeMois > 0) {
      this.draft.dateFinPrevue = this.addMonths(this.draft.date, this.draft.dureeMois);
    }
  }

  private addMonths(iso: string, months: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return '';
    const date = new Date(Date.UTC(y, m - 1 + months, d));
    return date.toISOString().slice(0, 10);
  }

  // ── Pièces du dossier ─────────────────────────────────────────────────────
  documentFor(tag: string): DocumentChantier | undefined {
    return this.documents().find(d => d.tags?.includes(tag) && !!d.storageKey);
  }

  chooseFile(tag: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.queueFile(tag, input.files?.[0]);
    input.value = '';
  }

  onPieceChosen(event: { tag: string; file: File }): void {
    this.queueFile(event.tag, event.file);
  }

  addExtraSlot(slot: ChantierPieceSlot): void {
    this.extraSlots.update((slots) => [...slots, slot]);
  }

  removeExtraSlot(tag: string): void {
    this.extraSlots.update((slots) => slots.filter((s) => s.tag !== tag));
    this.removePending(tag);
  }

  async repriseStudyDoc(ref: StudyDocRef): Promise<void> {
    const studyId = this.selected()?.id ?? this.workflow()?.chantier.dossierEtudeId;
    if (!studyId || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const blob = await this.studiesApi.telechargerDocument(studyId, ref.doc.id);
      const nom = ref.doc.nomFichier || 'document';
      const typed = blob.type && blob.type !== 'application/octet-stream'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });
      this.queueFile(ref.tag, new File([typed], nom, { type: typed.type || 'application/pdf' }));
    } catch (e) {
      this.error.set(this.message(e));
    } finally {
      this.saving.set(false);
    }
  }

  dropFile(tag: string, event: DragEvent): void {
    event.preventDefault(); this.dragOver.set(''); this.queueFile(tag, event.dataTransfer?.files[0]);
  }

  private queueFile(tag: string, file?: File): void {
    if (!file || this.saving() || (this.workflow() && !this.phasePreparation())) return;
    this.pendingFiles.update(files => ({ ...files, [tag]: file }));
  }

  removePending(tag: string): void {
    this.pendingFiles.update(files => { const next = { ...files }; delete next[tag]; return next; });
  }

  openDocument(doc: DocumentChantier): void {
    if (doc.storageKey) window.open(this.attachments.getAttachmentDownloadUrl(doc.storageKey), '_blank', 'noopener,noreferrer');
  }

  hasPendingFiles(): boolean { return Object.keys(this.pendingFiles()).length > 0; }

  async saveDocuments(): Promise<void> {
    if (!this.workflow() || this.saving()) return;
    this.saving.set(true); this.error.set('');
    try { await this.persistDocuments(); await this.refresh(); this.notice.set('Pièces enregistrées.'); }
    catch { this.error.set('Envoi incomplet. Les fichiers restants sont conservés ; réessayez leur envoi.'); }
    finally { this.saving.set(false); }
  }

  private async persistDocuments(): Promise<void> {
    const id = this.workflow()!.chantier.id;
    for (const slot of [...this.cadrageSlots, ...this.preparationSlots, ...this.extraSlots()]) {
      const file = this.pendingFiles()[slot.tag]; if (!file) continue;
      let storageKey = this.uploadedFiles.get(file);
      if (!storageKey) {
        const uploaded = await firstValueFrom(this.attachments.uploadAttachment(ERP_ATTACHMENT_ENTITY_TYPES.CHANTIER, id, file));
        storageKey = uploaded?.fileUrl;
        if (!storageKey) throw new Error('Fichier non enregistré');
        this.uploadedFiles.set(file, storageKey);
      }
      const doc = await this.documentsApi.createForChantier(id, {
        type: slot.type, titre: slot.label, fichier: file.name, storageKey, taille: file.size,
        uploadedAt: new Date().toLocaleDateString('en-CA'), uploadedPar: this.auth.displayName(), tags: [slot.tag],
      });
      this.documents.update(docs => [doc, ...docs]);
      this.removePending(slot.tag); this.uploadedFiles.delete(file);
    }
    await this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    const id = this.workflow()?.chantier.id;
    if (id) {
      const docs = await this.documentsApi.getByChantierId(id);
      this.documents.set(docs);
      this.restoreExtraSlots(docs);
    }
  }

  private restoreExtraSlots(docs: DocumentChantier[]): void {
    const extras: ChantierPieceSlot[] = [];
    for (const doc of docs) {
      const tag = doc.tags?.find((t) => !KNOWN_PIECE_TAGS.has(t));
      if (!tag || extras.some((s) => s.tag === tag)) continue;
      extras.push({ tag, type: doc.type, label: doc.titre, hint: '', required: false });
    }
    for (const slot of this.extraSlots()) {
      if (!extras.some((s) => s.tag === slot.tag)) extras.push(slot);
    }
    this.extraSlots.set(extras);
  }

  async refresh(): Promise<void> {
    const id = this.workflow()?.chantier.id;
    if (!id) return;
    try {
      this.apply(await this.api.load(id));
      const w = this.workflow();
      await Promise.all([this.loadDocuments(), this.loadBdp(), this.loadMarches(), w ? this.loadStudySource(w) : Promise.resolve()]);
    } catch (e) { this.error.set(this.message(e)); }
  }

  // ── Navigation dans le parcours ───────────────────────────────────────────
  goTo(index: number): void {
    if (index < 0 || index >= this.steps().length) return;
    this.error.set('');
    this.step.set(index);
  }

  // ── Actions de cycle de vie ───────────────────────────────────────────────
  allowed(action: string): boolean { return this.workflow()?.availableActions.includes(action) ?? false; }

  openAction(action: string): void {
    if (!this.allowed(action) || this.saving()) return;
    if (Object.keys(this.pendingFiles()).length) { this.error.set('Enregistrez les pièces avant de poursuivre.'); this.step.set(this.reachedStep()); return; }
    this.pendingAction.set(action); this.form.set({ kind: 'CAUTION' }); this.error.set('');
    setTimeout(() => document.querySelector('.action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  setField(key: string, value: unknown): void { this.form.update(f => ({ ...f, [key]: value })); }
  async submitAction(): Promise<void> { await this.execute(this.pendingAction(), this.form()); }

  async execute(action: string, fields: Record<string, unknown>): Promise<void> {
    const w = this.workflow(); if (!w || this.saving()) return;
    this.saving.set(true); this.error.set(''); this.notice.set('');
    try {
      const payload = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v === '' ? null : v]));
      const updated = await this.api.command(w.chantier.id, { ...payload, revision: w.revision, action });
      this.apply(updated);
      this.pendingAction.set(''); this.notice.set('Enregistré');
      if (updated.chantier.status !== w.chantier.status || action !== 'SAVE_PREPARATION') this.step.set(this.reachedStep());
      await Promise.all([this.loadBdp(), this.loadMarches()]);
    } catch (e) { this.error.set(this.message(e)); } finally { this.saving.set(false); }
  }

  editReserve(r: WorkflowReserve, status: string): void {
    this.openAction('UPDATE_RESERVE'); this.form.set({ itemId: r.id, status });
  }

  editGarantie(g: WorkflowGarantie): void {
    const next: Record<string, string> = { A_CONSTITUER: 'ACTIVE', ACTIVE: g.kind === 'CAUTION' ? 'LIBERATION_A_DEMANDER' : 'EXPIREE', LIBERATION_A_DEMANDER: 'LIBERATION_DEMANDEE', LIBERATION_DEMANDEE: 'LIBEREE' };
    this.openAction('UPDATE_GARANTIE'); this.form.set({ itemId: g.id, status: next[g.status] });
  }

  itemStatus(s: string): string {
    return ({ OUVERTE: 'Ouverte', A_VERIFIER: 'À vérifier', LEVEE: 'Levée', A_CONSTITUER: 'À constituer', ACTIVE: 'Active', LIBERATION_A_DEMANDER: 'Libération à demander', LIBERATION_DEMANDEE: 'Libération demandée', LIBEREE: 'Libérée', EXPIREE: 'Expirée' } as Record<string, string>)[s] ?? s;
  }

  needsDate(): boolean { return ['SAVE_OS', 'SUSPEND', 'RESUME', 'RESUME_WORK', 'FINISH_WORK', 'PROVISIONAL_RECEPTION', 'FINAL_RECEPTION', 'ADD_GARANTIE'].includes(this.pendingAction()); }
  needsReference(): boolean { return ['SAVE_OS', 'PROVISIONAL_RECEPTION', 'FINAL_RECEPTION'].includes(this.pendingAction()); }
  needsDocument(): boolean { return ['SAVE_OS', 'PROVISIONAL_RECEPTION', 'FINAL_RECEPTION', 'ADD_GARANTIE', 'UPDATE_GARANTIE', 'SUSPEND', 'RESUME'].includes(this.pendingAction()); }

  message(e: unknown): string {
    const err = e as { status?: number; message?: string; error?: { detail?: string; message?: string; code?: string } };
    if (err.status === 409) return 'Le dossier a changé. Actualisez les contrôles avant de réessayer ; votre saisie est conservée.';
    const code = err.error?.code ?? err.error?.message ?? err.message;
    if (code === 'etudes.dossier.convertir_hors_etat' || code === ETUDE_HORS_STATUT_MSG) {
      return ETUDE_HORS_STATUT_MSG;
    }
    return err.error?.detail ?? err.error?.message ?? err.error?.code ?? err.message ?? 'Impossible de terminer cette opération. Vérifiez les informations et réessayez.';
  }

  private apply(w: ChantierWorkflow): void {
    this.workflow.set(w);
    this.draft = {
      label: w.chantier.name ?? w.chantier.label ?? '',
      clientId: w.chantier.clientId ?? '', clientName: w.chantier.clientName ?? '',
      ville: w.chantier.ville ?? '', adresse: w.chantier.adresse ?? '',
      description: w.chantier.description ?? '',
      type: (w.chantier.type ?? w.chantier.chantierType ?? 'BATIMENT') as ChantierType,
      latitude: w.chantier.latitude ?? null, longitude: w.chantier.longitude ?? null,
      dureeMois: w.chantier.dureeMois ?? null,
      date: w.data.dateDebutPrevue ?? w.chantier.dateDemarrage ?? '',
      dateFinPrevue: w.chantier.dateFinPrevue ?? '',
      montant: w.chantier.debourseInitialHt == null ? null : Number(w.chantier.debourseInitialHt),
      marcheNumero: w.chantier.marcheReference ?? w.chantier.marcheNumero ?? '',
    };
    this.osReference.set(w.chantier.osReference ?? '');
    this.osDateEffet.set(w.chantier.osDateEffet ?? '');
    this.savedDraft = JSON.stringify(this.draft);
  }
}
