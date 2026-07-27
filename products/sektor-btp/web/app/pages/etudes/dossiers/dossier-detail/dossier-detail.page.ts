import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ConfirmDialogService, WizardShellComponent } from '@lib/anatomy';
import type { WizardStepConfig } from '@lib/anatomy';

import type { DossierEtude, ProblemeGate, ResultatGate } from '@app/etudes/models';

import { DecompositionWorkspaceComponent } from '../components/decomposition-workspace/decomposition-workspace.component';
import { DossierSummaryHeaderComponent } from '../components/dossier-summary-header/dossier-summary-header.component';
import { GateBlocageComponent } from '../components/gate-blocage/gate-blocage.component';
import { PiecesMarcheComponent } from '../components/pieces-marche/pieces-marche.component';
import { SyntheseValidationPanelComponent } from '../components/synthese-validation-panel/synthese-validation-panel.component';
import {
  DossierEtudeApiService,
  type DossierEtudeSynthese,
} from '../services/dossier-etude-api.service';
import type { ClientPartnerSelection } from '@app/shared/components/client-partner-select/client-partner-select.component';
import {
  backendGateEtapesForUi,
  backendToUiEtape,
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
  ],
  templateUrl: './dossier-detail.page.html',
  styleUrl: './dossier-detail.page.scss',
})
export class DossierDetailPage {
  private readonly api = inject(DossierEtudeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly decomposition = viewChild(DecompositionWorkspaceComponent);

  readonly dossier = signal<DossierEtude | undefined>(undefined);
  readonly synthese = signal<DossierEtudeSynthese | undefined>(undefined);
  readonly gates = signal<ResultatGate[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | undefined>(undefined);
  readonly posteDirty = signal(false);
  readonly clientSaving = signal(false);
  /** Navigation locale en lecture seule (le backend refuse `allerAEtape`). */
  readonly etapeUiLecture = signal<number | undefined>(undefined);
  readonly focusNoeudId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('noeudId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('noeudId') },
  );

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
        const key = `${p.noeudId ?? ''}|${p.message ?? ''}|${p.codeArticle ?? ''}`;
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

  readonly peutContinuer = computed(() => {
    const gate = this.gateCourant();
    if (!gate) return true;
    return !gate.bloquant || gate.problemes.length === 0;
  });

  readonly modifiable = computed(() => {
    const statut = this.dossier()?.status;
    return statut === 'BROUILLON' || statut === 'EN_ETUDE';
  });

  readonly statutLabel = computed(() => labelStatutDossier(this.dossier()?.status));

  /** CTA « Soumettre » uniquement tant que le dossier reste éditable. */
  readonly peutSoumettre = computed(() => this.modifiable());

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

  /** Hint complémentaire — les gates s’affichent déjà en une ligne compacte. */
  readonly blocageHint = computed(() => {
    if (!this.modifiable()) return undefined;
    if (this.posteDirty() && this.etapeUi() === 3) {
      return 'Enregistrez le poste courant avant de continuer';
    }
    return undefined;
  });

  onPosteDirty(dirty: boolean): void {
    this.posteDirty.set(dirty);
  }

  constructor() {
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
    const cible = nextBackendEtape(this.etapeUi());
    if (cible == null) return;
    if (!(await this.confirmerSiPosteDirty())) return;
    await this.changerEtape(cible);
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

  async onClientChange(sel: ClientPartnerSelection): Promise<void> {
    const dossier = this.dossier();
    if (!dossier || !this.modifiable() || this.clientSaving()) return;
    const currentId = dossier.clientId ?? null;
    const nextId = sel.clientId;
    if (currentId === nextId) return;

    this.clientSaving.set(true);
    this.erreur.set(undefined);
    try {
      const maj = await this.api.update(dossier.id, {
        clientId: nextId ?? '',
        version: dossier.version,
      });
      this.dossier.set(maj);
      await this.refreshSynthese(dossier.id);
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
      await this.refreshSynthese(dossier.id);
    } finally {
      this.clientSaving.set(false);
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
        case 'SOUMETTRE_STRUCTURE':
          await this.changerEtape(3);
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
          const values = await this.confirmDialog.prompt({
            title: 'Refuser le dossier',
            fields: [
              {
                key: 'motif',
                label: 'Motif du refus',
                required: true,
              },
            ],
            confirmLabel: 'Refuser',
            cancelLabel: 'Annuler',
          });
          const motif = values?.['motif']?.trim();
          if (!motif) return;
          this.dossier.set(await this.api.refuser(dossier.id, motif));
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
          this.dossier.set(await this.api.genererDevis(dossier.id));
          await this.refreshSynthese(dossier.id);
          break;
        case 'VOIR_DEVIS': {
          const devisId = this.synthese()?.devisGenereId ?? dossier.devisGenereId;
          if (devisId) {
            void this.nav.navigate(['/etudes/devis', devisId]);
          }
          break;
        }
        case 'CORRIGER_BORDEREAU':
          await this.changerEtape(2);
          break;
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
    if (
      probleme.message === 'etudes.gate.chiffrage.client_manquant' ||
      probleme.message === 'etudes.client.introuvable' ||
      probleme.message === 'etudes.client.role_invalide'
    ) {
      // Le sélecteur client est dans l'entête — on reste sur l'étape courante.
      document.getElementById('dossier-header-client')?.focus();
      return;
    }
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
      error?: { message?: string; code?: string; gate?: ResultatGate };
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
    this.erreur.set(this.messageErreur(e));
  }

  private messageErreur(e: unknown): string {
    const err = e as { status?: number; error?: { message?: string; code?: string } };
    if (err?.status === 409) {
      return "Ce dossier a été modifié entre-temps par quelqu'un d'autre. Rechargez la page avant de reprendre — vos modifications n'ont pas été enregistrées.";
    }
    if (err?.status === 403) {
      return "Vous n'avez pas la permission nécessaire pour cette action.";
    }
    const code = err?.error?.code;
    if (code === 'etudes.bordereau.remplacement_non_confirme') {
      return 'Confirmez le remplacement du bordereau existant (structure et chiffrage seront effacés).';
    }
    if (code === 'etudes.bordereau.structure_verrouillee') {
      return 'La structure est figée. Réouvrez le bordereau pour modifier lots et postes.';
    }
    return err?.error?.message ?? err?.error?.code ?? 'Une erreur est survenue.';
  }
}
