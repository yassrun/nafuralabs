import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import {
  ConfirmDialogService,
  PrintDialogService,
  WizardShellComponent,
} from '@platform/lib/anatomy';
import type { WizardStepConfig } from '@platform/lib/anatomy';

import type { DossierEtude, ProblemeGate, ResultatGate } from '@app/etudes/models';
import { PartnersApiService } from '@app/socle/shared/services/partners-api.service';
import { safeRandomUUID } from '@platform/core/util/uuid';

import {
  GateBlocageComponent,
  type GatePresentation,
} from '../components/gate-blocage/gate-blocage.component';
import { openGateProblemesDialog } from '../components/gate-blocage/gate-problemes-dialog.component';
import { DecompositionWorkspaceComponent } from '../components/decomposition-workspace/decomposition-workspace.component';
import { DossierSummaryHeaderComponent } from '../components/dossier-summary-header/dossier-summary-header.component';
import { DossierIdentitePanelComponent } from '../components/dossier-identite-panel/dossier-identite-panel.component';
import { ShareGuestLinkDialogComponent } from '../components/share-guest-link-dialog/share-guest-link-dialog.component';
import { PiecesMarcheComponent } from '../components/pieces-marche/pieces-marche.component';
import { SyntheseValidationPanelComponent } from '../components/synthese-validation-panel/synthese-validation-panel.component';
import { DossierPlanningPanelComponent } from '../components/dossier-planning-panel/dossier-planning-panel.component';
import { DossierRessourcesPanelComponent } from '../components/dossier-ressources-panel/dossier-ressources-panel.component';
import { DossierAgentPanelComponent } from '../components/dossier-agent-panel/dossier-agent-panel.component';
import {
  EtudeBannerComponent,
  type EtudeBannerTone,
} from '../components/etude-banner/etude-banner.component';
import {
  DossierEtudeApiService,
  PostesOrphelinsError,
  type ConversionRequest,
  type DossierEtudeSynthese,
  type PlacementPosteOrphelin,
} from '../services/dossier-etude-api.service';
import {
  ConversionChantierDialogComponent,
  type ConversionChantierDialogResult,
} from '../components/conversion-chantier-dialog/conversion-chantier-dialog.component';
import { PostesOrphelinsDialogComponent } from '../components/postes-orphelins-dialog/postes-orphelins-dialog.component';
import { DossierGoDialogComponent } from '../components/dossier-go-dialog/dossier-go-dialog.component';
import { DossierRefusChargeDialogComponent } from '../components/dossier-refus-charge-dialog/dossier-refus-charge-dialog.component';
import {
  DossierGagneDialogComponent,
  type DossierGagneDialogResult,
} from '../components/dossier-gagne-dialog/dossier-gagne-dialog.component';
import {
  DossierPerduDialogComponent,
  type DossierPerduDialogResult,
} from '../components/dossier-perdu-dialog/dossier-perdu-dialog.component';
import {
  backendGateEtapesForUi,
  backendToUiEtape,
  estAlerteQualiteChiffrage,
  estAnomaliePieceHorsCadrage,
  estEtapeUiLocale,
  ETAPES_UI_DOSSIER,
  incompleteUiStepIndexes,
  nextBackendEtape,
  prevBackendEtape,
  UI_ETAPE_MAX,
  uiEtapePourGate,
  uiToBackendEtape,
} from '../utils/dossier-etape.util';
import { labelStatutDossier } from '../utils/dossier-status.util';
import { exigeAvisExecution, idsActeurEgaux } from '../utils/dossier-responsables.util';

/**
 * Parcours d'étude en cinq étapes métier (backend 1..5 projeté ; 4–5 locales).
 *
 * <p>1. Aucune règle de gate n'est rejouée ici — l'état vient de `GET /gates`.
 * <p>2. Pas de rechargement global de l'arbre DPGF après une transition.
 */
@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WizardShellComponent,
    GateBlocageComponent,
    PiecesMarcheComponent,
    DecompositionWorkspaceComponent,
    SyntheseValidationPanelComponent,
    DossierPlanningPanelComponent,
    DossierRessourcesPanelComponent,
    DossierSummaryHeaderComponent,
    DossierIdentitePanelComponent,
    DossierAgentPanelComponent,
    EtudeBannerComponent,
  ],
  templateUrl: './dossier-detail.page.html',
  styleUrl: './dossier-detail.page.scss',
})
export class DossierDetailPage {
  private readonly api = inject(DossierEtudeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly printDialog = inject(PrintDialogService);
  private readonly translate = inject(TranslateService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly auth = inject(AuthFacade);
  private readonly decomposition = viewChild(DecompositionWorkspaceComponent);
  private readonly identite = viewChild(DossierIdentitePanelComponent);
  private readonly piecesPanels = viewChildren(PiecesMarcheComponent);
  private readonly synthesePanel = viewChild(SyntheseValidationPanelComponent);

  readonly dossier = signal<DossierEtude | undefined>(undefined);
  /** En-tête : durée d’exécution lue sur le formulaire de cadrage dès qu’elle est connue. */
  readonly dossierPourEntete = computed((): DossierEtude | undefined => {
    const d = this.dossier();
    if (!d) return undefined;
    const live = this.identite()?.delaiExecutionJours();
    if (live == null || live === d.aoDelaiExecutionJours) return d;
    return { ...d, aoDelaiExecutionJours: live };
  });
  readonly synthese = signal<DossierEtudeSynthese | undefined>(undefined);
  readonly gates = signal<ResultatGate[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | undefined>(undefined);
  readonly posteDirty = signal(false);
  /** Navigation locale en lecture seule (le backend refuse `allerAEtape`). */
  readonly etapeUiLecture = signal<number | undefined>(undefined);
  readonly focusNoeudId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('noeudId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('noeudId') },
  );
  readonly focusNoeudCode = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('noeudCode'))),
    { initialValue: this.route.snapshot.queryParamMap.get('noeudCode') },
  );
  /** Incrémenté à chaque « Voir dans l’arbre » pour re-scroller le même nœud. */
  readonly focusTick = signal(0);
  /**
   * Étape Coût : soft par défaut ; passe en hard après Continuer / Vérifier.
   * Reset au changement d’étape ou quand plus aucun problème.
   */
  readonly gateHardReveal = signal(false);

  readonly etapes: WizardStepConfig[] = ETAPES_UI_DOSSIER.map((e) => ({
    id: String(e.ui),
    label: e.libelle,
  }));

  /** Étape technique backend (1..5) persistée. */
  readonly etapeBackend = computed(() => this.dossier()?.currentStep ?? 1);

  /** Étape métier UI (1..5). Lecture locale prioritaire (planning+ressources / synthèse). */
  readonly etapeUi = computed(() => {
    if (this.etapeUiLecture() != null) return this.etapeUiLecture()!;
    const statut = this.dossier()?.status;
    if (
      this.etapeBackend() >= 5 &&
      (statut === 'COMPLETED' ||
        statut === 'FINANCIALLY_APPROVED' ||
        statut === 'FINANCIALLY_REJECTED' ||
        statut === 'FINAL_APPROVED' ||
        statut === 'FINAL_REJECTED')
    ) {
      return UI_ETAPE_MAX;
    }
    return backendToUiEtape(this.etapeBackend());
  });
  readonly indexCourant = computed(() => this.etapeUi() - 1);

  readonly incompleteStepIndexes = computed(() =>
    incompleteUiStepIndexes(this.etapeUi(), this.gates()),
  );

  /** L’arbre bordereau est toujours éditable à cette étape. */
  readonly structureAutoReadOnly = computed(() => false);

  /** Anomalies bloquantes de l’étape UI courante (pas le total multi-gates). */
  readonly anomaliesEtapeCourante = computed(() => {
    const gate = this.gateCourant();
    if (!gate) return 0;
    // Soft Coût : on affiche quand même le compteur (pas « 0 » trompeur).
    if (!gate.bloquant && this.etapeUi() !== 3) return 0;
    return gate.problemes.length;
  });

  /** Gates fusionnées pour l'étape UI courante (ex. 3+4+5 sur Décomposition). */
  readonly gateCourant = computed((): ResultatGate | undefined => {
    const ui = this.etapeUi();
    const etapes = backendGateEtapesForUi(ui);
    const relevant = this.gates().filter((g) => etapes.includes(g.etape));
    if (relevant.length === 0) return undefined;

    const seen = new Set<string>();
    const problemes: ProblemeGate[] = [];
    for (const g of relevant) {
      for (const p of g.problemes) {
        // Coût : l’alerte « trop estimé » n’est pas un poste manquant (→ Synthèse).
        if (ui === 3 && estAlerteQualiteChiffrage(p.message)) {
          continue;
        }
        if (ui === 1 && estAnomaliePieceHorsCadrage(p)) {
          continue;
        }
        // Un nœud = une ligne (évite cout_unitaire + prix_absent en double).
        const key =
          p.noeudId != null && String(p.noeudId).length > 0
            ? `n:${p.noeudId}`
            : `m:${p.message ?? ''}|${p.codeArticle ?? ''}|${p.libelle ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        problemes.push({ ...p, etape: g.etape });
      }
    }
    const bloquant = problemes.length > 0 && relevant.some((g) => g.bloquant);
    return {
      etape: uiToBackendEtape(ui),
      bloquant,
      problemes,
    };
  });

  /** Soft / hard / ok — ton d’affichage UI (backend inchangé). */
  readonly gatePresentation = computed((): GatePresentation => {
    const ui = this.etapeUi();
    const gate = this.gateCourant();
    const n = gate?.problemes.length ?? 0;
    if (ui === 3) {
      if (n === 0) return 'ok';
      return this.gateHardReveal() ? 'hard' : 'soft';
    }
    if (n === 0) return 'hidden';
    return gate?.bloquant ? 'hard' : 'soft';
  });

  readonly peutContinuer = computed(() => {
    const gate = this.gateCourant();
    if (!gate) return true;
    return !gate.bloquant || gate.problemes.length === 0;
  });

  /**
   * Soft Coût : Continuer reste cliquable pour révéler le hard.
   * Hard / autres étapes : suit la vérité gate.
   */
  readonly peutContinuerUi = computed(() => {
    if (this.dossier()?.status === 'STUDY_REJECTED') return false;
    if (!this.modifiable()) return true;
    if (estEtapeUiLocale(this.etapeUi())) return true;
    if (this.etapeUi() === 1 && this.identite()?.cpsBlocking()) return false;
    if (this.etapeUi() === 3) return true;
    return this.peutContinuer();
  });

  readonly cadrageEditable = computed(() => this.dossier()?.status === 'DRAFT');

  readonly piecesModifiables = computed(() => {
    const statut = this.dossier()?.status;
    return statut === 'DRAFT' || statut === 'PENDING_ASSIGNMENT' || statut === 'STUDY_REJECTED';
  });

  readonly modifiable = computed(() => {
    const statut = this.dossier()?.status;
    if (statut === 'DRAFT' || statut === 'PENDING_ASSIGNMENT') {
      return true;
    }
    if (statut === 'IN_PROGRESS') return this.peutSaisirApresGo();
    return false;
  });

  readonly statutLabel = computed(() => labelStatutDossier(this.dossier()?.status));

  readonly peutEnregistrer = computed(() => this.etapeUi() === 1 && this.cadrageEditable());

  readonly cadrageSaving = computed(
    () => (this.identite()?.saving() ?? false) || (this.identite()?.cpsBlocking() ?? false),
  );

  /** Partager : dossier existant (portail invité déjà branché). Plus « always disabled ». */
  readonly peutPartager = computed(() => !!this.dossier()?.id);

  readonly messageVerrou = computed(() => {
    const statut = this.dossier()?.status;
    switch (statut) {
      case 'COMPLETED':
        return 'Dossier transmis — en attente de validation. Les pièces, le bordereau et le chiffrage sont verrouillés.';
      case 'FINANCIALLY_APPROVED':
        return 'Validé financièrement — en attente de validation définitive.';
      case 'FINAL_APPROVED':
        return 'Validé définitivement — le workflow Étude est terminé.';
      case 'ARCHIVED':
        return 'Dossier archivé — consultation seule.';
      case 'ASSIGNED':
        return this.dossier()?.chargeEtudeNom
          ? `Affecté à ${this.dossier()?.chargeEtudeNom} — en attente de prise en charge.`
          : 'Affecté — le chargé d’étude doit prendre en charge ou rejeter.';
      case 'IN_PROGRESS':
        return this.dossier()?.chargeEtudeNom
          ? `En cours — seul ${this.dossier()?.chargeEtudeNom} (ou le responsable) peut terminer ou suspendre.`
          : 'En cours — le chargé d’étude peut terminer ou suspendre.';
      case 'SUSPENDED':
        return 'Étude suspendue — Reprendre pour continuer.';
      case 'REJECTED':
        return this.dossier()?.motifNoGo
          ? `Rejeté — ${this.dossier()?.motifNoGo}`
          : 'Rejeté — ce dossier ne sera pas étudié.';
      case 'STUDY_REJECTED':
        return 'Refusé par l’étude — corrigez les pièces puis Reprendre.';
      case 'FINANCIALLY_REJECTED':
      case 'FINAL_REJECTED':
        return this.dossier()?.motifRefus
          ? `Refus — ${this.dossier()?.motifRefus}`
          : 'Refus de validation — Reprendre pour corriger.';
      default:
        return 'Ce dossier est en lecture seule à ce stade du parcours.';
    }
  });

  readonly enAttenteGo = computed(() => {
    const s = this.dossier()?.status;
    return s === 'DRAFT' || s === 'PENDING_ASSIGNMENT';
  });

  readonly enAttenteAccept = computed(() => this.dossier()?.status === 'ASSIGNED');

  readonly peutDeciderGo = computed(
    () =>
      this.auth.hasPermission('etude.go') ||
      this.auth.hasRole('BTP_DG') ||
      this.auth.hasRole('OWNER') ||
      this.auth.hasRole('BTP_ADMIN_ETUDE'),
  );

  /** DAF / owner — pas l’ingénieur d’exécution. */
  readonly peutValiderFinancier = computed(
    () =>
      this.auth.hasPermission('etude.approve') ||
      this.auth.hasRole('BTP_DAF') ||
      this.auth.hasRole('OWNER'),
  );

  readonly peutValiderDefinitif = computed(
    () =>
      this.auth.hasPermission('etude.go') ||
      this.auth.hasRole('BTP_DG') ||
      this.auth.hasRole('BTP_ADMIN_ETUDE') ||
      this.auth.hasRole('OWNER'),
  );

  /** Personne nommée chargé d’étude — seule à prendre en charge / rejeter l’affectation. */
  readonly estChargeEtude = computed(() => {
    const charge = this.dossier()?.chargeEtudeUserId;
    const me = this.auth.user()?.id;
    const email = this.auth.user()?.email;
    return idsActeurEgaux(charge, me) || idsActeurEgaux(charge, email);
  });

  readonly peutSaisirApresGo = computed(() => this.peutDeciderGo() || this.estChargeEtude());

  readonly peutRenvoyerAffectation = computed(
    () =>
      this.auth.hasPermission('etude.update') ||
      this.auth.hasPermission('etude.create') ||
      this.peutDeciderGo(),
  );

  readonly chargeDejaDesigne = computed(
    () => !!(this.dossier()?.chargeEtudeUserId ?? '').trim(),
  );

  /** Ingénieur BTP qui n’est pas le chargé : voit / chiffre seulement ses lots. */
  readonly estIngenieurLotSeulement = computed(
    () => !this.peutSaisirApresGo() && this.auth.hasRole('BTP_INGENIEUR'),
  );

  readonly peutChiffrerLots = computed(
    () =>
      this.peutSaisirApresGo() ||
      (this.dossier()?.status === 'IN_PROGRESS' && this.estIngenieurLotSeulement()),
  );

  readonly peutAvisExecution = computed(() => {
    if (this.peutDeciderGo()) return true;
    const exec = this.dossier()?.responsableExecutionUserId;
    const me = this.auth.user()?.id;
    const email = this.auth.user()?.email;
    return idsActeurEgaux(exec, me) || idsActeurEgaux(exec, email);
  });

  readonly afficherAvisPoste = computed(() => exigeAvisExecution(this.dossier()));

  readonly nextLabel = computed(() => {
    const ui = this.etapeUi();
    return ETAPES_UI_DOSSIER.find((e) => e.ui === ui)?.nextLabel ?? 'Suivant';
  });

  readonly backLabel = computed(() => 'Précédent');

  readonly wizardBanners = computed((): { tone: EtudeBannerTone; message: string }[] => {
    const banners: { tone: EtudeBannerTone; message: string }[] = [];
    const seen = new Set<string>();
    const add = (tone: EtudeBannerTone, message?: string | null) => {
      const m = (message ?? '').trim();
      if (!m || seen.has(m)) return;
      seen.add(m);
      banners.push({ tone, message: m });
    };
    add('error', this.erreur());
    if (!this.modifiable()) add('info', this.messageVerrou());
    if (this.enAttenteGo() && !this.peutDeciderGo()) {
      add(
        'info',
        this.dossier()?.status === 'PENDING_ASSIGNMENT'
          ? 'En attente d’affectation — le responsable d’études affecte un ingénieur ou rejette le dossier.'
          : this.chargeDejaDesigne()
            ? 'Brouillon — corrigez le cadrage si besoin, puis Reprendre avec l’affectation existante.'
            : 'Brouillon — saisissez le cadrage, puis Soumettre pour affectation.',
      );
    }
    if (this.enAttenteAccept() && !this.estChargeEtude() && !this.peutDeciderGo()) {
      add('info', 'Affecté — en attente de prise en charge par le chargé d’étude.');
    }
    if (this.dossier()?.status === 'IN_PROGRESS' && this.estIngenieurLotSeulement()) {
      add('info', 'Vous voyez uniquement les lots qui vous sont affectés.');
    }
    const avisRetour = this.dossier()?.avisExecutionCommentaire?.trim();
    if (avisRetour && this.dossier()?.status === 'IN_PROGRESS' && this.dossier()?.avisExecutionDossier === 'RETOUR') {
      add('warning', `Avis d’exécution — retour au chiffrage : ${avisRetour}`);
    }
    const refus = this.dossier()?.motifRefusCharge?.trim();
    if (refus && this.dossier()?.status === 'STUDY_REJECTED') {
      const type = this.dossier()?.motifRefusChargeType;
      const typeLabel =
        type === 'CPS_INCOMPLET'
          ? 'CPS incomplet'
          : type === 'DOC_MANQUANT'
            ? 'Document manquant'
            : 'Refus ingénieur';
      add('warning', `${typeLabel} — ${refus}`);
    }
    const identite = this.identite()?.banner();
    if (identite) add(identite.tone, identite.message);
    for (const panel of this.piecesPanels()) {
      const b = panel.banner();
      if (b) add(b.tone, b.message);
    }
    add('error', this.decomposition()?.arbreErreur());
    const syn = this.synthesePanel()?.banner();
    if (syn && (syn.tone === 'error' || this.modifiable())) {
      add(syn.tone, syn.message);
    }
    return banners;
  });

  onPosteDirty(dirty: boolean): void {
    this.posteDirty.set(dirty);
  }

  onDpgfPret(dpgfId: string): void {
    const dossier = this.dossier();
    if (!dossier || !dpgfId || dossier.dpgfId === dpgfId) return;
    this.dossier.set({ ...dossier, dpgfId });
  }

  constructor() {
    effect(() => {
      this.etapeUi();
      untracked(() => this.gateHardReveal.set(false));
    });
    effect(() => {
      const n = this.gateCourant()?.problemes.length ?? 0;
      if (n === 0) untracked(() => this.gateHardReveal.set(false));
    });
    effect(() => {
      const ui = this.etapeUi();
      const d = this.dossier();
      if (ui !== 2 || !d || d.dpgfId || d.status !== 'IN_PROGRESS') return;
      void this.assurerArbreBordereau();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.charger(id);
    } else {
      this.chargement.set(false);
      this.erreur.set('Identifiant de dossier manquant.');
    }
  }

  private async charger(id: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [dossier, gates, synthese] = await Promise.all([
        this.api.getById(id),
        this.api.gates(id),
        this.api.synthese(id),
      ]);
      this.dossier.set(dossier);
      this.gates.set(gates);
      this.synthese.set(synthese);
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  async suivant(): Promise<void> {
    const ui = this.etapeUi();
    if (ui >= UI_ETAPE_MAX) return;
    if (this.peutEnregistrer()) {
      const ok = await this.identite()?.enregistrer();
      if (ok === false) return;
    }
    if (!(await this.confirmerSiPosteDirty())) return;
    this.gateHardReveal.set(false);

    if (this.estIngenieurLotSeulement()) {
      this.etapeUiLecture.set(Math.min(ui + 1, UI_ETAPE_MAX));
      return;
    }
    if (ui === 3) {
      const cible = nextBackendEtape(3);
      if (this.modifiable() && this.peutContinuer() && cible != null) {
        await this.changerEtape(cible);
      }
      this.etapeUiLecture.set(4);
      return;
    }
    if (estEtapeUiLocale(ui)) {
      this.etapeUiLecture.set(Math.min(ui + 1, UI_ETAPE_MAX));
      return;
    }

    const cible = nextBackendEtape(ui);
    if (cible == null) {
      this.etapeUiLecture.set(ui + 1);
      return;
    }
    await this.changerEtape(cible);
    this.etapeUiLecture.set(undefined);
  }

  /** CTA soft « Vérifier le chiffrage » → bannière hard. */
  revealGateHard(): void {
    this.gateHardReveal.set(true);
  }

  async precedent(): Promise<void> {
    const ui = this.etapeUi();
    if (ui <= 1) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    if (this.estIngenieurLotSeulement() || estEtapeUiLocale(ui)) {
      this.etapeUiLecture.set(ui - 1);
      return;
    }
    const cible = prevBackendEtape(ui);
    if (cible == null) {
      this.etapeUiLecture.set(ui - 1);
      return;
    }
    await this.changerEtape(cible);
    this.etapeUiLecture.set(undefined);
  }

  /** Stepper cliquable — index 0-based vers une étape UI déjà atteinte. */
  async allerAEtapeUi(index: number): Promise<void> {
    const ui = index + 1;
    if (ui < 1 || ui > UI_ETAPE_MAX || ui === this.etapeUi()) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    if (this.peutEnregistrer()) {
      const ok = await this.identite()?.enregistrer();
      if (ok === false) return;
    }
    if (this.estIngenieurLotSeulement()) {
      this.etapeUiLecture.set(ui);
      return;
    }
    if (estEtapeUiLocale(ui)) {
      if (this.etapeBackend() < 3) return;
      this.etapeUiLecture.set(ui);
      return;
    }
    const maxUi = backendToUiEtape(this.etapeBackend());
    if (ui > maxUi) {
      if (!(ui === 2 && this.dossier()?.dpgfId)) return;
    }
    await this.changerEtape(uiToBackendEtape(ui));
    this.etapeUiLecture.set(undefined);
  }

  private async confirmerSiPosteDirty(): Promise<boolean> {
    if (!this.posteDirty() || this.etapeUi() !== 3) return true;
    const workspace = this.decomposition();
    if (workspace) {
      const ok = await workspace.confirmerQuitterSiDirty();
      if (!ok) return false;
      this.posteDirty.set(false);
      return true;
    }
    return this.confirmDialog.confirm({
      title: 'Modifications non enregistrées',
      message: 'Enregistrez le poste courant ou abandonnez les modifications avant de continuer.',
      variant: 'danger',
      confirmLabel: 'Abandonner et continuer',
    });
  }

  private async changerEtape(etape: number): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || etape < 1 || etape > 5) return;
    this.erreur.set(undefined);
    try {
      const maj = await this.api.allerAEtape(dossier.id, etape);
      this.dossier.set(conserverAoListing(dossier, maj));
      await this.refreshSynthese(dossier.id);
      this.posteDirty.set(false);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  async soumettre(): Promise<void> {
    const dossier = this.dossier();
    const statut = dossier?.status;
    if (!dossier || statut !== 'IN_PROGRESS') return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.soumettre(dossier.id));
      await this.refreshSynthese(dossier.id);
      this.etapeUiLecture.set(UI_ETAPE_MAX);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  async onHeaderAction(action: string): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    this.erreur.set(undefined);
    try {
      switch (action) {
        case 'ENREGISTRER':
          await this.identite()?.enregistrer();
          break;
        case 'DECIDER_GO':
          if (this.etapeUi() === 1 && this.cadrageEditable()) {
            const ok = await this.identite()?.enregistrer();
            if (ok === false) return;
          }
          await this.ouvrirGo();
          break;
        case 'RENVOYER_AFFECTATION':
          await this.renvoyerAuCharge();
          break;
        case 'SOUMETTRE_GO':
          if (this.peutEnregistrer()) {
            const ok = await this.identite()?.enregistrer();
            if (ok === false) return;
          }
          await this.soumettreAuDg();
          break;
        case 'ACCEPTER_AFFECTATION':
          await this.accepterAffectation();
          break;
        case 'NO_GO':
          await this.confirmerNoGo();
          break;
        case 'REVENIR_DRAFT':
          await this.revenirAuDraft();
          break;
        case 'ARCHIVER':
          await this.archiverDossier();
          break;
        case 'REFUSER_AFFECTATION':
          await this.ouvrirRefusCharge();
          break;
        case 'PARTAGER':
          if (!this.peutPartager()) return;
          this.dialog.open(ShareGuestLinkDialogComponent, {
            data: {
              dossierId: dossier.id,
              numero: dossier.numero,
              objet: dossier.objet,
              suggestedEmail: undefined,
            },
          });
          break;
        case 'IMPRIMER_BORDEREAU':
          if (!dossier.dpgfId) {
            this.erreur.set('Aucun bordereau (DPGF) lié à ce dossier.');
            return;
          }
          await this.printDialog.open(
            'dossier_etude_bordereau',
            dossier.id,
            dossier.numero,
          );
          break;
        case 'IMPRIMER_SYNTHESE':
          await this.printDialog.open(
            'dossier_etude_synthese',
            dossier.id,
            dossier.numero,
          );
          break;
        case 'SOUMETTRE_STRUCTURE':
          await this.changerEtape(3);
          break;
        case 'VOIR_SYNTHESE':
          await this.allerAEtapeUi(UI_ETAPE_MAX - 1);
          break;
        case 'SOUMETTRE_CHIFFRAGE':
          await this.soumettre();
          break;
        case 'AVIS_EXECUTION_FAVORABLE':
          this.dossier.set(await this.api.avisExecutionFavorable(dossier.id));
          await this.refreshSynthese(dossier.id);
          this.etapeUiLecture.set(UI_ETAPE_MAX);
          break;
        case 'AVIS_EXECUTION_RETOUR': {
          const motif = window.prompt('Avis d’exécution — motif du retour au chiffrage :');
          if (!motif?.trim()) return;
          this.dossier.set(await this.api.avisExecutionRetour(dossier.id, motif.trim()));
          await this.refreshSynthese(dossier.id);
          this.etapeUiLecture.set(3);
          break;
        }
        case 'SUSPENDRE_CHIFFRAGE':
          await this.suspendreChiffrage();
          break;
        case 'REPRENDRE_CHIFFRAGE':
          await this.reprendreChiffrage();
          break;
        case 'VALIDER_N1':
        case 'VALIDER_N2':
        case 'VALIDER_FINANCIER':
        case 'VALIDER_DEFINITIF':
          this.dossier.set(await this.api.valider(dossier.id));
          await this.refreshSynthese(dossier.id);
          this.etapeUiLecture.set(UI_ETAPE_MAX);
          break;
        case 'REFUSER': {
          const motif = window.prompt('Motif du refus (obligatoire) :');
          if (!motif?.trim()) return;
          this.dossier.set(await this.api.refuser(dossier.id, motif.trim()));
          await this.refreshSynthese(dossier.id);
          break;
        }
        case 'REOUVRIR_BORDEREAU': {
          const ok = await this.confirmDialog.confirm({
            title: 'Réouvrir le bordereau',
            message:
              'La structure redevient éditable. Les prix existants restent en base mais devront être revus.',
            variant: 'danger',
            confirmLabel: 'Réouvrir',
          });
          if (!ok) return;
          this.dossier.set(await this.api.reouvrirBordereau(dossier.id));
          await this.refreshSynthese(dossier.id);
          break;
        }
        case 'GENERER_DEVIS':
          await this.genererDevisOuCreerClient(dossier);
          break;
        case 'VOIR_DEVIS': {
          const devisId = this.synthese()?.devisGenereId ?? dossier.devisGenereId;
          if (devisId) {
            void this.nav.navigate(['/etudes/devis', devisId]);
          }
          break;
        }
        case 'MARQUER_GAGNE': {
          await this.ouvrirGagne(dossier);
          break;
        }
        case 'MARQUER_PERDU': {
          await this.ouvrirPerdu(dossier);
          break;
        }
        case 'CONVERTIR': {
          const chantierId = await this.convertirEnChantier(dossier);
          await this.refreshSynthese(dossier.id);
          if (chantierId) {
            void this.nav.navigate(['/chantiers', chantierId]);
          }
          break;
        }
        case 'VOIR_CHANTIER': {
          const chantierId = this.synthese()?.chantierGenereId;
          if (chantierId) {
            void this.nav.navigate(['/chantiers', chantierId]);
          }
          break;
        }
        case 'CORRIGER_BORDEREAU': {
          if (!dossier.dpgfId) {
            await this.api.initBordereauManuel(dossier.id);
            await this.rechargerApresPieces();
          }
          await this.changerEtape(2);
          break;
        }
        case 'CORRIGER_CHIFFRAGE':
          await this.changerEtape(3);
          break;
        default:
          break;
      }
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  /** Ouvre l'article fautif — étape UI selon la gate d'origine. */
  corriger(probleme: ProblemeGate): void {
    const gateEtape = probleme.etape ?? this.gateCourant()?.etape ?? 3;
    const uiCible = uiEtapePourGate(gateEtape);
    const backendCible = uiToBackendEtape(uiCible);
    const dossier = this.dossier();

    const goFocus = () => {
      if (!probleme.noeudId && !probleme.codeArticle) return;
      this.focusTick.update((n) => n + 1);
      void this.nav
        .navigate(['.'], {
          relativeTo: this.route,
          queryParams: {
            ...(probleme.noeudId ? { noeudId: probleme.noeudId } : {}),
            ...(probleme.codeArticle ? { noeudCode: probleme.codeArticle } : {}),
          },
          queryParamsHandling: 'merge',
        })
        .then(() => {
          setTimeout(() => {
            for (const panel of this.piecesPanels()) {
              panel.revelerNoeud(probleme.noeudId, probleme.codeArticle);
            }
            this.decomposition()?.revelerNoeud(probleme.noeudId, probleme.codeArticle);
          }, 0);
        });
    };

    if (this.etapeUi() !== uiCible) {
      if (estEtapeUiLocale(uiCible)) {
        this.etapeUiLecture.set(uiCible);
        goFocus();
        return;
      }
      void this.changerEtape(backendCible).then(() => {
        this.etapeUiLecture.set(undefined);
        goFocus();
      });
      return;
    }
    goFocus();
  }

  passerBordereauManuel(): void {
    /* L’arbre est toujours éditable — plus de bascule Auto / Manuel. */
  }

  onIdentiteSaved(maj: DossierEtude): void {
    this.dossier.set(maj);
    const id = maj.id;
    void this.refreshSynthese(id);
  }

  private async ouvrirGagne(dossier: DossierEtude): Promise<void> {
    const synthese = this.synthese();
    const devisId = synthese?.devisGenereId ?? dossier.devisGenereId;
    if (!devisId) {
      this.erreur.set('Aucun devis lié : générez d’abord le devis (AC-2).');
      return;
    }
    const picked = await firstValueFrom(
      this.dialog
        .open<DossierGagneDialogComponent, unknown, DossierGagneDialogResult | undefined>(
          DossierGagneDialogComponent,
          {
            data: {
              dossierId: dossier.id,
              devisId,
              devisNumero: synthese?.devisNumero,
              totalHt: synthese?.totalHt ?? 0,
              peutDeroger:
                this.auth.hasRole('OWNER') ||
                this.auth.hasRole('BTP_DG') ||
                this.auth.isSuperAdmin(),
            },
            autoFocus: 'first-tabbable',
          },
        )
        .afterClosed(),
    );
    if (!picked?.dateAttribution) return;
    this.erreur.set(undefined);
    this.dossier.set(
      await this.api.marquerGagne(dossier.id, {
        dateAttribution: picked.dateAttribution,
        referenceMarche: picked.referenceMarche,
        devisId,
        montantAttribue: picked.montantAttribue,
        motifDerogation: picked.motifDerogation,
        acceptWarnings: picked.acceptWarnings,
      }),
    );
    await this.refreshSynthese(dossier.id);
  }

  private async ouvrirPerdu(dossier: DossierEtude): Promise<void> {
    const picked = await firstValueFrom(
      this.dialog
        .open<DossierPerduDialogComponent, unknown, DossierPerduDialogResult | undefined>(
          DossierPerduDialogComponent,
          { autoFocus: 'first-tabbable' },
        )
        .afterClosed(),
    );
    if (!picked?.motif) return;
    this.erreur.set(undefined);
    this.dossier.set(
      await this.api.marquerPerdu(dossier.id, {
        motif: picked.motif,
        concurrentRetenu: picked.concurrentRetenu,
      }),
    );
    await this.refreshSynthese(dossier.id);
  }

  private async ouvrirGo(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    const ref = this.dialog.open(DossierGoDialogComponent, {
      data: {
        dossierId: dossier.id,
        createdBy: dossier.createdBy,
        chargeEtudeUserId: dossier.chargeEtudeUserId,
        responsableExecutionUserId: dossier.responsableExecutionUserId,
      },
    });
    const picked = await firstValueFrom(ref.afterClosed());
    if (!picked?.chargeEtudeUserId) return;
    this.erreur.set(undefined);
    try {
      const body = {
        chargeEtudeUserId: picked.chargeEtudeUserId,
        chargeEtudeNom: picked.chargeEtudeNom,
        responsableExecutionUserId: picked.responsableExecutionUserId,
        responsableExecutionNom: picked.responsableExecutionNom,
      };
      const maj = await this.api.deciderGo(dossier.id, body);
      this.dossier.set(conserverAoListing(dossier, maj));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async renvoyerAuCharge(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || !this.peutRenvoyerAffectation()) return;
    if (!(dossier.chargeEtudeUserId ?? '').trim()) {
      if (this.peutDeciderGo()) {
        await this.ouvrirGo();
        return;
      }
      this.erreur.set('Aucun chargé d’étude nommé. Le DG doit d’abord affecter.');
      return;
    }
    this.erreur.set(undefined);
    try {
      const maj = await this.api.affecter(dossier.id);
      this.dossier.set(conserverAoListing(dossier, maj));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async revenirAuDraft(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    if (dossier.status === 'STUDY_REJECTED') {
      const ok = window.confirm(
        'Réinitialiser le cadrage ? Le dossier repasse en Draft. Le chargé d’étude déjà nommé est conservé.',
      );
      if (!ok) return;
    }
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.revenirAuDraft(dossier.id));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async archiverDossier(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    const ok = await this.confirmDialog.confirm({
      title: 'Archiver le dossier',
      message: 'Le dossier passera en Archivé. Cette action est définitive.',
      variant: 'danger',
      confirmLabel: 'Archiver',
    });
    if (!ok) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.annuler(dossier.id));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async soumettreAuDg(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.soumettreAuDg(dossier.id));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async accepterAffectation(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || !this.estChargeEtude()) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.accepterAffectation(dossier.id));
      await this.refreshSynthese(dossier.id);
      await this.assurerArbreBordereau();
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async suspendreChiffrage(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.suspendreChiffrage(dossier.id));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async reprendreChiffrage(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.reprendreChiffrage(dossier.id));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async ouvrirRefusCharge(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || !this.estChargeEtude()) return;
    const ref = this.dialog.open(DossierRefusChargeDialogComponent);
    const picked = await firstValueFrom(ref.afterClosed());
    if (!picked?.type || !picked.motif) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.refuserAffectation(dossier.id, picked));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  private async confirmerNoGo(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    const motif = window.prompt('Motif du rejet (optionnel) :');
    if (motif === null) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.deciderNoGo(dossier.id, motif));
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  focusPremierProblemeGate(): void {
    const problemes = this.gateCourant()?.problemes ?? [];
    if (problemes.length === 0) {
      if (this.structureAutoReadOnly()) this.passerBordereauManuel();
      return;
    }
    void openGateProblemesDialog(this.dialog, problemes).then((picked) => {
      if (picked) this.corriger(picked);
    });
  }

  private async assurerArbreBordereau(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier?.id || dossier.dpgfId) return;
    if (dossier.status !== 'IN_PROGRESS' && dossier.status !== 'DRAFT') return;
    try {
      const res = await this.api.initBordereauManuel(dossier.id);
      if (res?.dpgfId) this.onDpgfPret(res.dpgfId);
    } catch {
      /* le panneau Bordereau affiche le fallback manuel */
    }
  }

  async rechargerApresPieces(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier) return;
    try {
      const [maj, gates, synthese] = await Promise.all([
        this.api.getById(dossier.id),
        this.api.gates(dossier.id),
        this.api.synthese(dossier.id),
      ]);
      this.dossier.set(maj);
      this.gates.set(gates);
      this.synthese.set(synthese);
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    }
  }

  /**
   * Sans Partner : demander si on crée le client (raison sociale = MOA si présente),
   * puis POST partners + générer. Annuler = pas de devis, bandeau conservé.
   */
  private async genererDevisOuCreerClient(dossier: DossierEtude): Promise<void> {
    const syn = this.synthese();
    const clientIdExistant = (syn?.clientId ?? dossier.clientId)?.trim();
    if (clientIdExistant) {
      this.dossier.set(await this.api.genererDevis(dossier.id));
      await this.refreshSynthese(dossier.id);
      return;
    }

    const moa = (syn?.clientNom ?? dossier.clientNom ?? '').trim();
    const values = await this.confirmDialog.prompt({
      title: 'Créer le client Partner',
      confirmLabel: 'Créer et générer',
      cancelLabel: 'Annuler',
      icon: 'person_add',
      fields: [
        {
          key: 'raisonSociale',
          label: 'Raison sociale',
          required: true,
          initial: moa,
        },
      ],
    });
    if (!values) return;

    const raison = values['raisonSociale']?.trim();
    if (!raison) {
      this.erreur.set('Indiquez la raison sociale du client.');
      return;
    }

    const created = await this.partnersApi.create({
      code: this.newPartnerCode(),
      raisonSociale: raison,
      roles: ['CLIENT'],
    });
    this.dossier.set(await this.api.genererDevis(dossier.id, { clientId: created.id }));
    await this.refreshSynthese(dossier.id);
  }

  private newPartnerCode(): string {
    const suffix = safeRandomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `CLI-${suffix}`;
  }

  /**
   * AC-13 — l'écran demande code chantier, date de démarrage et durée, puis convertit.
   * AC-12 — si le devis contient des postes sans lot parent, le serveur s'arrête avant de rien
   * créer et les nomme ; on les affiche, l'humain les place, et on rejoue. S'il abandonne, on
   * n'appelle plus : rien n'est créé et l'étude reste gagnée.
   *
   * @returns l'identifiant du chantier créé, ou `null` si l'humain a abandonné.
   */
  private async convertirEnChantier(dossier: DossierEtude): Promise<string | null> {
    const saisie = await firstValueFrom(
      this.dialog
        .open<
          ConversionChantierDialogComponent,
          unknown,
          ConversionChantierDialogResult | null
        >(ConversionChantierDialogComponent, {
          // Laissé vide, le serveur retombe sur la date d'attribution de l'étude.
          data: { defaultLabel: dossier.objet },
          autoFocus: 'first-tabbable',
        })
        .afterClosed(),
    );
    if (!saisie) return null;

    const body: ConversionRequest = { ...saisie };
    for (;;) {
      try {
        const result = await this.api.convertir(dossier.id, body);
        return result.chantierId;
      } catch (err) {
        if (!(err instanceof PostesOrphelinsError)) throw err;
        const placements = await firstValueFrom(
          this.dialog
            .open<
              PostesOrphelinsDialogComponent,
              unknown,
              PlacementPosteOrphelin[] | null
            >(PostesOrphelinsDialogComponent, {
              data: { postes: err.postes, lotsDisponibles: err.lotsDisponibles },
              autoFocus: 'first-tabbable',
            })
            .afterClosed(),
        );
        // Abandon : rien n'a été créé côté serveur, l'étude reste GAGNE.
        if (!placements) return null;
        body.placementsPostesOrphelins = [
          ...(body.placementsPostesOrphelins ?? []),
          ...placements,
        ];
      }
    }
  }

  private async refreshSynthese(id: string): Promise<void> {
    const [gates, synthese] = await Promise.all([this.api.gates(id), this.api.synthese(id)]);
    this.gates.set(gates);
    this.synthese.set(synthese);
  }

  /** @deprecated use rechargerApresPieces */
  async rechargerGates(): Promise<void> {
    await this.rechargerApresPieces();
  }

  private appliquerErreurTransition(e: unknown): void {
    const err = e as {
      status?: number;
      error?: {
        message?: string;
        code?: string;
        gate?: ResultatGate;
        totalDevis?: number;
        montantAttribue?: number;
        debourseInitial?: number;
      };
    };
    if (err?.status === 422 && err.error?.gate) {
      const gate = err.error.gate;
      const tagged: ResultatGate = {
        ...gate,
        problemes: gate.problemes.map((p) => ({ ...p, etape: gate.etape })),
      };
      const destOnlyCadrage =
        tagged.etape === 1 &&
        tagged.problemes.length > 0 &&
        tagged.problemes.every((p) => estAnomaliePieceHorsCadrage(p));
      if (destOnlyCadrage) {
        this.erreur.set(undefined);
        return;
      }
      this.gates.update((all) => {
        const others = all.filter((g) => g.etape !== tagged.etape);
        return [...others, tagged];
      });
      this.erreur.set(undefined);
      const visibles =
        tagged.etape === 1
          ? tagged.problemes.filter((p) => !estAnomaliePieceHorsCadrage(p))
          : tagged.problemes;
      if (visibles.length > 0) {
        void openGateProblemesDialog(this.dialog, visibles);
      }
      return;
    }
    // AC-3 — l'attribution diffère du total devis : montrer les deux montants, ne rien réécrire.
    if (err?.status === 422 && err.error?.code === 'etudes.dossier.attribution_differente_du_devis') {
      const total = err.error.totalDevis;
      const attribue = err.error.montantAttribue;
      this.erreur.set(
        `Le montant attribué (${formatMontant(attribue)}) ne correspond pas au total du devis (${formatMontant(total)}). Corrigez la version du devis avant le gain (AC-3) — rien n'a été modifié.`,
      );
      return;
    }
    // AC-4 — marge négative refusée aux rôles ordinaires ; les montants expliquent le refus.
    if (err?.status === 422 && err.error?.code === 'etudes.dossier.marge_negative_refusee') {
      const attribue = err.error.montantAttribue;
      const debourse = err.error.debourseInitial;
      this.erreur.set(
        `Marge initiale négative : vente ${formatMontant(attribue)} < déboursé initial ${formatMontant(debourse)}. Seul owner ou dg peut déroger, avec un motif (AC-4).`,
      );
      return;
    }
    if (err?.status === 422 && err.error?.code === 'etudes.dossier.warnings_non_acceptes') {
      this.erreur.set(
        'Des avertissements commerciaux restent à accepter, avec un motif, avant de marquer gagné.',
      );
      return;
    }
    if (err?.status === 422 && err.error?.code === 'ETU-GATE') {
      this.erreur.set(
        'Le chiffrage n’est pas assez établi pour marquer l’affaire gagnée. Revenez au chiffrage pour poser les coûts.',
      );
      return;
    }
    this.erreur.set(this.messageErreur(e));
  }

  private messageErreur(e: unknown): string {
    const err = e as {
      status?: number;
      message?: string;
      error?: { message?: string; code?: string } | string;
    };
    if (err?.status === 403) {
      return "Vous n'avez pas la permission nécessaire pour cette action.";
    }
    const code = typeof err?.error === 'object' ? err?.error?.code : undefined;
    const apiMsg = typeof err?.error === 'object' ? err?.error?.message : typeof err?.error === 'string' ? err.error : undefined;
    const domain =
      (apiMsg?.startsWith('etudes.') ? apiMsg : undefined) ??
      (code?.startsWith('etudes.') ? code : undefined);
    if (domain === 'etudes.bordereau.remplacement_non_confirme') {
      return 'Confirmez le remplacement du bordereau existant (structure et chiffrage seront effacés).';
    }
    if (domain === 'etudes.bordereau.structure_verrouillee') {
      return 'La structure est figée. Réouvrez le bordereau pour modifier lots et postes.';
    }
    if (domain === 'etudes.dossier.revenir_draft_hors_etat') {
      return 'Seul un dossier rejeté peut être renvoyé en brouillon.';
    }
    if (domain === 'etudes.dossier.renvoi_hors_etat') {
      return 'Seuls un brouillon déjà affecté, ou un dossier à reprendre, peuvent être renvoyés au chargé.';
    }
    if (domain === 'etudes.dossier.archive_hors_etat') {
      return 'Ce dossier ne peut pas être archivé dans son état actuel.';
    }
    if (domain === 'etudes.dossier.go_requis') {
      return 'Le responsable d’études doit d’abord affecter un ingénieur.';
    }
    if (domain === 'etudes.dossier.go_reserve_dg') {
      return 'Seul le responsable d’études (ou l’owner) peut affecter ou rejeter.';
    }
    if (domain === 'etudes.dossier.warnings_non_acceptes') {
      return 'Des avertissements commerciaux restent à accepter, avec un motif, avant de marquer gagné.';
    }
    if (domain === 'etudes.dossier.derogation_motif_requis') {
      return 'Motif de dérogation obligatoire pour une marge négative.';
    }
    if (domain === 'etudes.dossier.gagne_hors_etat') {
      return 'Le devis doit d’abord être généré avant de marquer l’affaire gagnée.';
    }
    if (domain === 'etudes.charge_etude.requis') {
      return 'Choisissez un ingénieur d’étude pour l’affectation.';
    }
    if (domain === 'etudes.dossier.saisie_reservee_charge') {
      return 'Après prise en compte, seul le chargé d’étude affecté peut saisir le bordereau.';
    }
    if (domain === 'etudes.dossier.accept_reserve_charge' || domain === 'etudes.dossier.refus_reserve_charge') {
      return 'Seul le chargé d’étude affecté peut prendre en charge ou rejeter ce dossier.';
    }
    if (domain) {
      return this.libelleErreur(domain) ?? domain;
    }
    if (err?.status === 409) {
      return "Ce dossier a été modifié entre-temps par quelqu'un d'autre. Rechargez la page avant de reprendre — vos modifications n'ont pas été enregistrées.";
    }
    return this.libelleErreur(apiMsg) ?? this.libelleErreur(code) ?? err?.message ?? 'Une erreur est survenue.';
  }

  private libelleErreur(key: string | undefined): string | undefined {
    if (!key) return undefined;
    if (!key.startsWith('etudes.')) return key;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : key;
  }
}

/** PUT /etape ne renvoyait pas l’enrichissement AOC — on ne perd pas le cadrage déjà sauvé. */
function conserverAoListing(prev: DossierEtude, maj: DossierEtude): DossierEtude {
  return {
    ...maj,
    appelOffreClientId: maj.appelOffreClientId ?? prev.appelOffreClientId,
    aoType: maj.aoType ?? prev.aoType,
    aoDateLimiteDepot: maj.aoDateLimiteDepot ?? prev.aoDateLimiteDepot,
    aoReference: maj.aoReference ?? prev.aoReference,
    aoVille: maj.aoVille ?? prev.aoVille,
    aoDateOuverturePlis: maj.aoDateOuverturePlis ?? prev.aoDateOuverturePlis,
    aoDelaiExecutionJours: maj.aoDelaiExecutionJours ?? prev.aoDelaiExecutionJours,
    aoEstimationMoaHt: maj.aoEstimationMoaHt ?? prev.aoEstimationMoaHt,
    aoCautionProvisoire: maj.aoCautionProvisoire ?? prev.aoCautionProvisoire,
  };
}

/** Format monétaire MAD pour les messages d'erreur du gain (AC-3/AC-4). */
function formatMontant(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return 'indisponible';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`;
}
