import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';

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
import { ShareGuestLinkDialogComponent } from '../components/share-guest-link-dialog/share-guest-link-dialog.component';
import { PiecesMarcheComponent } from '../components/pieces-marche/pieces-marche.component';
import { SyntheseValidationPanelComponent } from '../components/synthese-validation-panel/synthese-validation-panel.component';
import { DossierAgentPanelComponent } from '../components/dossier-agent-panel/dossier-agent-panel.component';
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
import {
  backendGateEtapesForUi,
  backendToUiEtape,
  estAlerteQualiteChiffrage,
  ETAPES_UI_DOSSIER,
  nextBackendEtape,
  prevBackendEtape,
  uiEtapePourGate,
  uiToBackendEtape,
} from '../utils/dossier-etape.util';
import { labelStatutDossier } from '../utils/dossier-status.util';

/**
 * Parcours d'étude en quatre étapes métier (backend 1..5 projeté).
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
    DossierSummaryHeaderComponent,
    DossierAgentPanelComponent,
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
  private readonly decomposition = viewChild(DecompositionWorkspaceComponent);

  readonly dossier = signal<DossierEtude | undefined>(undefined);
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
  /** Incrémente pour forcer le mode Manuel sur l’étape Bordereau. */
  readonly forceVoieManuelToken = signal(0);
  readonly bordereauVoie = signal<'auto' | 'manuel'>('auto');
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

  /** Étape métier UI (1..4). */
  readonly etapeUi = computed(() => {
    if (!this.modifiable()) {
      return this.etapeUiLecture() ?? backendToUiEtape(this.etapeBackend());
    }
    return backendToUiEtape(this.etapeBackend());
  });
  readonly indexCourant = computed(() => this.etapeUi() - 1);

  /** Arbre validé en mode Auto (lecture seule structure). */
  readonly structureAutoReadOnly = computed(
    () =>
      this.bordereauVoie() === 'auto' &&
      !!this.dossier()?.dpgfId &&
      !(this.synthese()?.structureVerrouillee ?? false),
  );

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
    const bloquant = relevant.some((g) => g.bloquant && g.problemes.length > 0);
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
    if (!this.modifiable()) return true;
    if (this.etapeUi() === 3 && this.gatePresentation() === 'soft') return true;
    if (this.etapeUi() === 3 && this.gatePresentation() === 'ok') return true;
    return this.peutContinuer();
  });

  readonly modifiable = computed(() => {
    const statut = this.dossier()?.status;
    return statut === 'BROUILLON' || statut === 'EN_ETUDE';
  });

  readonly statutLabel = computed(() => labelStatutDossier(this.dossier()?.status));

  /** CTA « Soumettre » : footer wizard (dernier step) + header — seulement à la Synthèse. */
  readonly peutSoumettre = computed(() => this.modifiable() && this.etapeUi() === 4);

  /** Partager : dossier existant (portail invité déjà branché). Plus « always disabled ». */
  readonly peutPartager = computed(() => !!this.dossier()?.id);

  readonly messageVerrou = computed(() => {
    const statut = this.dossier()?.status;
    switch (statut) {
      case 'EN_VALIDATION':
        return 'Dossier transmis — en attente de validation. Les pièces, le bordereau et le chiffrage sont verrouillés.';
      case 'VALIDEE':
        return 'Dossier validé — consultation seule.';
      case 'DEVIS_GENERE':
        return 'Devis généré — consultation seule.';
      case 'ANNULE':
        return 'Dossier annulé — consultation seule.';
      default:
        return 'Ce dossier est en lecture seule à ce stade du parcours.';
    }
  });

  readonly nextLabel = computed(() => {
    const ui = this.etapeUi();
    return ETAPES_UI_DOSSIER.find((e) => e.ui === ui)?.nextLabel ?? 'Suivant';
  });

  readonly backLabel = computed(() => 'Précédent');

  /**
   * Hint complémentaire — les gates s’affichent déjà en une ligne compacte.
   * Ne jamais afficher le dirty poste ici : ça décale l’arbre à chaque frappe dans le drawer.
   * Le dirty est géré par confirm à la navigation (suivant / quitter).
   */
  readonly blocageHint = computed(() => undefined);

  onPosteDirty(dirty: boolean): void {
    this.posteDirty.set(dirty);
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
    if (!this.modifiable()) {
      const ui = this.etapeUi();
      if (ui < 4) this.etapeUiLecture.set(ui + 1);
      return;
    }
    // Coût soft → Continuer révèle le hard sans naviguer.
    if (this.etapeUi() === 3 && !this.peutContinuer()) {
      this.gateHardReveal.set(true);
      return;
    }
    const cible = nextBackendEtape(this.etapeUi());
    if (cible == null) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    this.gateHardReveal.set(false);
    await this.changerEtape(cible);
  }

  /** CTA soft « Vérifier le chiffrage » → bannière hard. */
  revealGateHard(): void {
    this.gateHardReveal.set(true);
  }

  async precedent(): Promise<void> {
    if (!this.modifiable()) {
      const ui = this.etapeUi();
      if (ui > 1) this.etapeUiLecture.set(ui - 1);
      return;
    }
    const cible = prevBackendEtape(this.etapeUi());
    if (cible == null) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    await this.changerEtape(cible);
  }

  /** Stepper cliquable — index 0-based vers une étape UI déjà atteinte. */
  async allerAEtapeUi(index: number): Promise<void> {
    const ui = index + 1;
    if (ui < 1 || ui > 4 || ui === this.etapeUi()) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    if (!this.modifiable()) {
      this.etapeUiLecture.set(ui);
      return;
    }
    const maxUi = backendToUiEtape(this.etapeBackend());
    if (ui > maxUi) {
      // Voie manuelle : DPGF déjà créé à l’étape Documents — le stepper peut viser le bordereau.
      if (!(ui === 2 && this.dossier()?.dpgfId)) return;
    }
    await this.changerEtape(uiToBackendEtape(ui));
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
      this.dossier.set(maj);
      await this.refreshSynthese(dossier.id);
      this.posteDirty.set(false);
    } catch (e) {
      this.appliquerErreurTransition(e);
    }
  }

  async soumettre(): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || !this.modifiable()) return;
    this.erreur.set(undefined);
    try {
      this.dossier.set(await this.api.soumettre(dossier.id));
      await this.refreshSynthese(dossier.id);
      this.etapeUiLecture.set(4);
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
          // Même chemin que le footer — pas allerAEtapeUi(3) (maxUi bloque tant que backend < 5).
          await this.suivant();
          break;
        case 'SOUMETTRE_CHIFFRAGE':
          await this.soumettre();
          break;
        case 'VALIDER_N1':
        case 'VALIDER_N2':
          this.dossier.set(await this.api.valider(dossier.id));
          await this.refreshSynthese(dossier.id);
          this.etapeUiLecture.set(4);
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
          // AC-3 — le gain approuve le devis lié ; le montant attribué est pré-rempli du total
          // devis et doit lui correspondre. AC-4 — une marge négative demande un motif réservé.
          const synthese = this.synthese();
          const devisId = synthese?.devisGenereId ?? dossier.devisGenereId;
          if (!devisId) {
            this.erreur.set('Aucun devis lié : générez d’abord le devis (AC-2).');
            return;
          }
          const totalDevis = synthese?.totalHt ?? 0;
          const dateRaw = window.prompt(
            "Date d'attribution (AAAA-MM-JJ) :",
            new Date().toISOString().slice(0, 10),
          );
          if (!dateRaw?.trim()) return;
          const referenceMarche = window.prompt('Référence marché (optionnel) :') ?? undefined;
          const montantRaw =
            window.prompt(
              `Montant attribué HT — doit égaler le total devis ${totalDevis.toLocaleString('fr-FR')} MAD (AC-3) :`,
              String(totalDevis),
            ) ?? undefined;
          const montantAttribue =
            montantRaw?.trim() && !Number.isNaN(Number(montantRaw))
              ? Number(montantRaw)
              : undefined;
          if (montantAttribue === undefined) {
            this.erreur.set('Le montant attribué est obligatoire (AC-3).');
            return;
          }
          const motifDerogation =
            montantAttribue < totalDevis
              ? (window.prompt(
                  'Marge négative : motif de dérogation (réservé owner / dg, AC-4) :',
                ) ?? undefined)
              : undefined;
          if (montantAttribue < totalDevis && !motifDerogation?.trim()) {
            this.erreur.set('Motif de dérogation obligatoire pour une marge négative (AC-4).');
            return;
          }
          this.dossier.set(
            await this.api.marquerGagne(dossier.id, {
              dateAttribution: dateRaw.trim(),
              referenceMarche: referenceMarche?.trim() || undefined,
              devisId,
              montantAttribue,
              motifDerogation: motifDerogation?.trim() || undefined,
            }),
          );
          await this.refreshSynthese(dossier.id);
          break;
        }
        case 'MARQUER_PERDU': {
          const motif = window.prompt(
            'Motif (PRIX | DELAI | TECHNIQUE | ADMINISTRATIF | SANS_SUITE) :',
            'PRIX',
          );
          if (!motif?.trim()) return;
          const concurrentRetenu =
            window.prompt('Concurrent retenu (optionnel) :') ?? undefined;
          this.dossier.set(
            await this.api.marquerPerdu(dossier.id, {
              motif: motif.trim().toUpperCase(),
              concurrentRetenu: concurrentRetenu?.trim() || undefined,
            }),
          );
          await this.refreshSynthese(dossier.id);
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
      if (!probleme.noeudId) return;
      void this.nav.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { noeudId: probleme.noeudId },
        queryParamsHandling: 'merge',
      });
    };

    if (dossier && backendToUiEtape(dossier.currentStep) !== uiCible) {
      void this.changerEtape(backendCible).then(goFocus);
      return;
    }
    goFocus();
  }

  passerBordereauManuel(): void {
    this.forceVoieManuelToken.update((n) => n + 1);
    this.bordereauVoie.set('manuel');
  }

  onBordereauVoieChange(voie: 'auto' | 'manuel'): void {
    this.bordereauVoie.set(voie);
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
      this.gates.update((all) => {
        const others = all.filter((g) => g.etape !== tagged.etape);
        return [...others, tagged];
      });
      this.erreur.set(
        tagged.problemes.length > 0
          ? `${tagged.problemes.length} point(s) empêchent de continuer — voir la liste ci-dessous.`
          : (err.error.code ?? 'Étape non franchie.'),
      );
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

/** Format monétaire MAD pour les messages d'erreur du gain (AC-3/AC-4). */
function formatMontant(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return 'indisponible';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`;
}
