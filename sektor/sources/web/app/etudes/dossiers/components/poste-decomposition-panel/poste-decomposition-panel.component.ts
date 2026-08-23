import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ConfirmDialogService, ToastService } from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';
import { safeRandomUUID } from '@platform/core/util/uuid';

import type { ComposantDPU, DpuComposantType, PrixDPU, SourcePrixComposant } from '@app/etudes/models';
import { DpuService } from '@app/etudes/services/dpu.service';
import {
  composantLibelle,
  composantPrixSourceLabel,
  estComposantItem,
  normalizeComposantDpu,
  toComposantDpuWrite,
} from '@app/etudes/utils/composant-reference.util';
import { DpuApiService } from '@app/catalogue/bibliotheque-prix/services/dpu-api.service';
import { ItemsApiService } from '@app/catalogue/services/items-api.service';
import { openConsultationDecompoDialog } from '../consultation-decompo-dialog/consultation-decompo-dialog.component';
import { UnitOfMeasuresApiService } from '@app/catalogue/configuration/unit-of-measures/services/unit-of-measure-api.service';
import { DpgfApiService } from '../../../services/dpgf-api.service';
import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';
import type { DecompositionComposantMatched, DecompositionPropose } from '../../services/dossier-etude-api.service';
import { DecompositionProposeCache } from '../../services/decomposition-propose.cache';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import {
  computeCoutRevient,
  computePrixVenteDepuisCout,
  deduceCoutDepuisPrixVente,
  ecartEstimationPercent,
  origineUi,
  resolveOrigineCout,
  type EstimationSaisieEnUi,
  type OrigineCoutUi,
} from '../../utils/poste-chiffrage-mode.util';
import { buildComposantDirtyKey } from '../../utils/poste-dirty.util';
import { toUniteOptions, type UniteOption } from '../../utils/unite-options.util';
import { CpsDescriptifDialogComponent } from '../cps-descriptif-dialog/cps-descriptif-dialog.component';
import {
  CatalogItemPickDialogComponent,
  type CatalogItemPickDialogResult,
} from '../catalog-item-pick-dialog/catalog-item-pick-dialog.component';
import { dpuTypeToNature } from '@app/catalogue/components/article-picker/article-picker.component';
import {
  CreateMissingItemDialogComponent,
  type CreateMissingItemDialogResult,
} from '../create-missing-item-dialog/create-missing-item-dialog.component';
import {
  DecompositionSuggestionDialogComponent,
  type DecompositionSuggestionDialogResult,
} from '../decomposition-suggestion-dialog/decomposition-suggestion-dialog.component';
import {
  PosteChiffrageDialogComponent,
  type PosteChiffrageDialogResult,
} from '../poste-chiffrage-dialog/poste-chiffrage-dialog.component';
import {
  SousDetailDialogComponent,
  type SousDetailDialogResult,
} from '../sous-detail-dialog/sous-detail-dialog.component';

const TYPE_LABELS: Record<ComposantDPU['type'], string> = {
  MATIERE: 'Matière',
  MAIN_DOEUVRE: 'Main-d’œuvre',
  MATERIEL: 'Matériel',
  SOUS_TRAITANCE: 'Sous-traitance',
};

const SOURCE_LABELS: Record<string, string> = {
  MANUEL: 'Manuel',
  CATALOGUE: 'Catalogue',
  TARIF: 'Catalogue',
  CONSULTE: 'Consulté',
  BIBLIOTHEQUE: 'Bibliothèque',
};

/** Snapshot renvoyé après save — pour patcher l’arbre immédiatement à la fermeture. */
export interface PosteSaveSnapshot {
  noeudId: string;
  prixUnitaire: number | null;
  total: number | null;
  mode: string | null;
  origineCout?: string | null;
  estimationSaisieEn?: string | null;
  coutDeduit?: boolean;
  prixFourniBase?: number | null;
  coutUnitaire?: number | null;
  fraisGenerauxPercent?: number | null;
  margePercent?: number | null;
  descriptif?: string | null;
}

@Component({
  selector: 'app-poste-decomposition-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    MadCurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './poste-decomposition-panel.component.html',
  styleUrl: './poste-decomposition-panel.component.scss',
})
export class PosteDecompositionPanelComponent {
  private readonly dpuApi = inject(DpuApiService);
  private readonly dpuMath = inject(DpuService);
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly proposeCache = inject(DecompositionProposeCache);
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly itemsApi = inject(ItemsApiService);

  readonly poste = input<BordereauTreeRow | null>(null);
  readonly dossierId = input<string | null>(null);
  /** Présent uniquement si le CPS a été indexé — sinon le bouton magique est masqué. */
  readonly cpsDocumentId = input<string | null>(null);
  readonly modifiable = input(true);
  readonly fgDefaut = input(10);
  readonly margeDefaut = input(17.5);
  readonly tvaDefaut = input(20);
  /** true dans le drawer : chrome identité / save géré par le shell. */
  readonly embedded = input(false);
  /** Portail invité : DPU déjà dans le snapshot, pas d’appel authentifié. */
  readonly externalDpu = input<PrixDPU | null>(null);
  readonly guestReadOnly = input(false);
  /** Texte CPS déjà résolu (portail invité) — pas d’appel authentifié. */
  readonly externalDescriptifCps = input<string | null>(null);

  readonly change = output<void>();
  readonly dirtyChange = output<boolean>();
  readonly origineChange = output<OrigineCoutUi>();

  readonly dpu = signal<PrixDPU | null>(null);
  /** Coût unitaire saisi (ESTIME / FORFAIT) — avant FG et marge. */
  readonly prixFourni = signal<number | null>(null);
  /** Prix de vente saisi quand estimationSaisieEn = VENTE. */
  readonly venteSaisie = signal<number | null>(null);
  readonly estimationSaisieEn = signal<EstimationSaisieEnUi>('COUT');
  /** Repère conservé lors du passage ESTIME → DECOMPOSE. */
  readonly estimationRepere = signal<number | null>(null);
  readonly forfaitPartnerId = signal<string | null>(null);
  readonly forfaitOffreId = signal<string | null>(null);
  readonly fgFourniLocal = signal<number | null>(null);
  readonly margeFourniLocal = signal<number | null>(null);
  readonly composantsBrouillon = signal<ComposantDPU[]>([]);
  readonly fgDecomposeBrouillon = signal<number | null>(null);
  readonly margeDecomposeBrouillon = signal<number | null>(null);
  readonly commentaire = signal('');
  readonly commentInitial = signal('');
  readonly origineLocal = signal<OrigineCoutUi | null>(null);
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly sauvegarde = signal(false);
  readonly propositionCps = signal(false);
  readonly extractionComposants = signal(false);
  readonly rafraichissementPrix = signal(false);
  readonly composantsIaIds = signal<Set<string>>(new Set());
  readonly composantsLabels = signal<Map<string, string>>(new Map());
  readonly erreur = signal<string | undefined>(undefined);
  readonly statut = signal<'idle' | 'saved'>('idle');

  /** Dirty DPU (mode / composants / FG) — mis à jour uniquement sur mutations structurées. */
  private dpuSnapshotInitial = '';
  private readonly dpuDirty = signal(false);
  private loadSeq = 0;
  private savedTimer: ReturnType<typeof setTimeout> | undefined;
  /** Poste déjà chargé — évite de réinitialiser le brouillon sur un simple re-render. */
  private loadedPosteId: string | null = null;

  readonly composants = computed(() => this.composantsBrouillon());
  readonly hasComposants = computed(() => this.composants().length > 0);
  /** Origine affichée : null persisté → Décomposé (défaut UX). */
  readonly origineActif = computed(() => origineUi(this.origineLocal()));
  readonly estDecompose = computed(() => this.origineActif() === 'DECOMPOSE');
  readonly estEstime = computed(() => this.origineActif() === 'ESTIME');
  readonly estForfait = computed(() => this.origineActif() === 'FORFAIT');
  /** ESTIME ou FORFAIT — saisie coût simple (sans table composants active). */
  readonly estSaisieSimple = computed(() => this.estEstime() || this.estForfait());
  readonly peutProposerCps = computed(
    () => !!this.dossierId() && !!this.cpsDocumentId() && this.modifiable(),
  );
  readonly descriptifGuest = computed(() => {
    const cps = this.externalDescriptifCps()?.trim();
    if (cps) return cps;
    return this.commentaire().trim();
  });
  /** L5 — au moins un ITEM gelé → CTA refresh dispo si étude modifiable. */
  readonly peutRafraichirPrix = computed(
    () =>
      this.modifiable() &&
      this.estDecompose() &&
      !!this.dpu()?.id &&
      this.composants().some((c) => estComposantItem(c)),
  );

  readonly commentDirty = computed(
    () => this.commentaire().trim() !== this.commentInitial().trim(),
  );
  readonly modificationsEnAttente = computed(() => this.commentDirty() || this.dpuDirty());

  readonly deboursSec = computed(() =>
    this.estSaisieSimple()
      ? this.coutUnitaireActif()
      : this.dpuMath.computeDeboursSec(this.composants()),
  );

  /** Coût unitaire actif (plancher). */
  readonly coutUnitaireActif = computed(() => {
    if (this.estEstime() && this.estimationSaisieEn() === 'VENTE') {
      return deduceCoutDepuisPrixVente(
        this.venteSaisie() ?? 0,
        this.fgPct(),
        this.margePct(),
      );
    }
    if (this.estSaisieSimple()) {
      return Math.max(0, this.prixFourni() ?? 0);
    }
    return this.dpuMath.computeDeboursSec(this.composants());
  });

  readonly fgPct = computed(() =>
    this.estSaisieSimple()
      ? (this.fgFourniLocal() ?? this.fgDefaut())
      : (this.fgDecomposeBrouillon() ?? this.fgDefaut()),
  );
  readonly margePct = computed(() =>
    this.estSaisieSimple()
      ? (this.margeFourniLocal() ?? this.margeDefaut())
      : (this.margeDecomposeBrouillon() ?? this.margeDefaut()),
  );

  readonly coutRevient = computed(() =>
    computeCoutRevient(this.coutUnitaireActif(), this.fgPct()),
  );

  readonly prixVenteHt = computed(() => {
    if (this.estEstime() && this.estimationSaisieEn() === 'VENTE') {
      return Math.max(0, this.venteSaisie() ?? 0);
    }
    if (this.estSaisieSimple()) {
      return computePrixVenteDepuisCout(
        this.coutUnitaireActif(),
        this.fgPct(),
        this.margePct(),
      );
    }
    // DECOMPOSE — formule additive (R2)
    return this.dpuMath.computePrixVenteHt(
      this.deboursSec(),
      this.fgPct(),
      this.margePct(),
    );
  });

  readonly coutDeduit = computed(
    () => this.estEstime() && this.estimationSaisieEn() === 'VENTE',
  );

  /** Coût / prix de vente réellement saisi (> 0) — évite le plancher « 0 MAD » trompeur. */
  readonly hasCoutSaisi = computed(() => {
    if (this.estEstime() && this.estimationSaisieEn() === 'VENTE') {
      const v = this.venteSaisie();
      return v != null && Number.isFinite(v) && v > 0;
    }
    if (this.estSaisieSimple()) {
      const c = this.prixFourni();
      return c != null && Number.isFinite(c) && c > 0;
    }
    return this.hasComposants() && this.deboursSec() > 0;
  });

  /** Invite footer drawer : saisie simple sans coût. */
  readonly attenteSaisieCout = computed(
    () => this.modifiable() && this.estSaisieSimple() && !this.hasCoutSaisi(),
  );

  readonly plancherPret = computed(() => {
    if (this.estSaisieSimple()) return this.hasCoutSaisi();
    if (this.estDecompose()) return this.hasComposants();
    return this.hasCoutSaisi();
  });

  readonly ecartVsEstimation = computed(() => {
    if (!this.estDecompose()) return null;
    const repere = this.estimationRepere();
    if (repere == null || repere <= 0) return null;
    const decompo = this.deboursSec();
    const pct = ecartEstimationPercent(repere, decompo);
    if (pct == null) return null;
    return { repere, decompo, pct };
  });

  readonly totalLigne = computed(() => {
    const q = Number(this.poste()?.quantite ?? 0);
    const pu = this.prixVenteHt();
    return Math.round(Math.max(0, q) * Math.max(0, pu) * 100) / 100;
  });
  readonly fgAmount = computed(
    () => Math.round((this.coutRevient() - this.coutUnitaireActif()) * 100) / 100,
  );
  readonly margeAmount = computed(
    () => Math.round((this.prixVenteHt() - this.coutRevient()) * 100) / 100,
  );

  constructor() {
    effect(() => {
      if (this.guestReadOnly() || this.externalDpu()) return;
      untracked(() => void this.chargerUnites());
    });
    effect(() => {
      this.dirtyChange.emit(this.modificationsEnAttente());
    });
    effect(() => {
      this.origineChange.emit(this.origineActif());
    });
    effect(() => {
      const poste = this.poste();
      // `untracked` obligatoire : `chargerDpu()` traverse les intercepteurs HTTP,
      // qui lisent des signaux globaux (token, tenant). Sans ça l’effet s’y abonne
      // et se relance au moindre refresh ailleurs dans la page — écrasant le
      // brouillon en cours d’édition et remettant le dirty à false.
      untracked(() => this.chargerPoste(poste));
    });
  }

  /** (Re)initialise le brouillon pour un poste — une seule fois par poste. */
  private chargerPoste(poste: BordereauTreeRow | null): void {
    const posteId = poste?.type === 'ARTICLE' ? (poste.id ?? null) : null;
    // Même poste déjà chargé : ne jamais réécraser l’édition en cours.
    if (posteId !== null && posteId === this.loadedPosteId) return;
    this.loadedPosteId = posteId;

    if (this.savedTimer) {
      clearTimeout(this.savedTimer);
      this.savedTimer = undefined;
    }
    if (poste && posteId) {
      this.prixFourni.set(poste.coutUnitaire ?? poste.prixFourniBase ?? poste.prixUnitaire ?? null);
      this.venteSaisie.set(
        poste.estimationSaisieEn === 'VENTE' ? (poste.prixUnitaire ?? null) : null,
      );
      this.estimationSaisieEn.set(
        poste.estimationSaisieEn === 'VENTE' ? 'VENTE' : 'COUT',
      );
      this.estimationRepere.set(
        poste.origineCout === 'ESTIME' || poste.estimationSaisieEn
          ? (poste.coutUnitaire ?? poste.prixFourniBase ?? null)
          : (poste.coutUnitaire ?? null),
      );
      this.forfaitPartnerId.set(poste.forfaitPartnerId ?? null);
      this.forfaitOffreId.set(poste.forfaitOffreId ?? null);
      this.fgFourniLocal.set(poste.fraisGenerauxPercent ?? null);
      this.margeFourniLocal.set(poste.margePercent ?? null);
      const comment = poste.descriptif ?? '';
      this.commentaire.set(comment);
      this.commentInitial.set(comment);
      this.composantsBrouillon.set([]);
      this.composantsIaIds.set(new Set());
      this.composantsLabels.set(new Map());
      this.fgDecomposeBrouillon.set(null);
      this.margeDecomposeBrouillon.set(null);
      this.origineLocal.set(
        resolveOrigineCout({
          origineCout: poste.origineCout,
          mode: poste.mode,
          prixUnitaire: poste.prixUnitaire,
        }),
      );
      this.propositionCps.set(false);
      this.extractionComposants.set(false);
      this.rafraichissementPrix.set(false);
      void this.chargerDpu(posteId);
    } else {
      this.loadSeq++;
      this.dpu.set(null);
      this.prixFourni.set(null);
      this.venteSaisie.set(null);
      this.estimationSaisieEn.set('COUT');
      this.estimationRepere.set(null);
      this.forfaitPartnerId.set(null);
      this.forfaitOffreId.set(null);
      this.fgFourniLocal.set(null);
      this.margeFourniLocal.set(null);
      this.commentaire.set('');
      this.commentInitial.set('');
      this.composantsBrouillon.set([]);
      this.composantsIaIds.set(new Set());
      this.composantsLabels.set(new Map());
      this.fgDecomposeBrouillon.set(null);
      this.margeDecomposeBrouillon.set(null);
      this.origineLocal.set(null);
      this.erreur.set(undefined);
      this.chargement.set(false);
      this.propositionCps.set(false);
      this.extractionComposants.set(false);
      this.rafraichissementPrix.set(false);
      this.statut.set('idle');
      this.captureDpuInitial();
    }
  }

  typeLabel(type: ComposantDPU['type']): string {
    return TYPE_LABELS[type] ?? type;
  }

  sourceLabel(source?: SourcePrixComposant | null): string {
    if (!source) return SOURCE_LABELS['MANUEL'];
    return SOURCE_LABELS[source] ?? source;
  }

  /** Libellé de gel (L5) — ex. « Catalogue Lafarge — 12/06/2026 ». */
  prixSourceDetail(row: ComposantDPU): string | null {
    return composantPrixSourceLabel(row);
  }

  onCommentaireChange(value: string): void {
    this.commentaire.set(value);
  }

  onPrixFourniChange(raw: string | number): void {
    if (!this.canMutate() || !this.estSaisieSimple()) return;
    const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
    this.prixFourni.set(Number.isFinite(value) ? Math.max(0, value) : 0);
    if (this.estEstime()) this.estimationRepere.set(this.prixFourni());
    this.markDpuDirty();
  }

  onVenteSaisieChange(raw: string | number): void {
    if (!this.canMutate() || !this.estEstime()) return;
    const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
    this.venteSaisie.set(Number.isFinite(value) ? Math.max(0, value) : 0);
    this.estimationSaisieEn.set('VENTE');
    this.markDpuDirty();
  }

  setEstimationSaisieEn(value: EstimationSaisieEnUi): void {
    if (!this.canMutate() || !this.estEstime()) return;
    if (this.estimationSaisieEn() === value) return;
    if (value === 'VENTE') {
      if (this.venteSaisie() == null) {
        this.venteSaisie.set(this.prixVenteHt());
      }
    } else if (this.prixFourni() == null) {
      this.prixFourni.set(this.coutUnitaireActif());
    }
    this.estimationSaisieEn.set(value);
    this.markDpuDirty();
  }

  onFgFourniChange(raw: string | number): void {
    if (!this.canMutate() || !this.estSaisieSimple()) return;
    const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
    this.fgFourniLocal.set(Number.isFinite(value) ? Math.max(0, value) : 0);
    this.markDpuDirty();
  }

  onMargeFourniChange(raw: string | number): void {
    if (!this.canMutate() || !this.estSaisieSimple()) return;
    const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
    this.margeFourniLocal.set(Number.isFinite(value) ? Math.max(0, value) : 0);
    this.markDpuDirty();
  }

  onForfaitPartnerChange(value: string): void {
    if (!this.canMutate() || !this.estForfait()) return;
    this.forfaitPartnerId.set(value.trim() || null);
    this.markDpuDirty();
  }

  onForfaitOffreChange(value: string): void {
    if (!this.canMutate() || !this.estForfait()) return;
    this.forfaitOffreId.set(value.trim() || null);
    this.markDpuDirty();
  }

  /** Switch origine depuis le toggle drawer. */
  async setOrigineUi(target: OrigineCoutUi): Promise<boolean> {
    if (!this.canMutate()) return false;
    if (this.origineActif() === target) return true;
    if (target === 'DECOMPOSE') return this.passerEnDecomposition();
    if (target === 'FORFAIT') return this.passerEnForfait();
    return this.passerEnEstime();
  }

  /** @deprecated compat — mappe FOURNI → ESTIME */
  async setModeUi(target: 'FOURNI' | 'DECOMPOSE'): Promise<boolean> {
    return this.setOrigineUi(target === 'FOURNI' ? 'ESTIME' : 'DECOMPOSE');
  }

  async proposerDepuisCps(): Promise<void> {
    if (!this.peutProposerCps() || this.propositionCps() || this.sauvegarde()) return;
    const poste = this.poste();
    const dossierId = this.dossierId();
    const cpsDocumentId = this.cpsDocumentId();
    if (!poste?.id || !dossierId || !cpsDocumentId) return;

    this.propositionCps.set(true);
    this.erreur.set(undefined);
    try {
      const propose = await this.dossierApi.proposerDescriptif(
        dossierId,
        cpsDocumentId,
        poste.id,
      );
      const texte = propose?.texte?.trim() ?? '';
      if (!texte) {
        this.toast.info(
          'Pas de descriptif CPS pour cet article — ce n’est pas bloquant. Extraire les composants se fait depuis le libellé.',
        );
        return;
      }

      this.dialog.open(CpsDescriptifDialogComponent, {
        width: 'min(42rem, 94vw)',
        autoFocus: false,
        restoreFocus: true,
        data: {
          code: poste.code ?? '',
          libelle: poste.libelle ?? '',
          texte,
          confiance: propose?.confiance,
          sectionSourceId: propose?.sectionSourceId,
        },
      });
    } catch (e) {
      this.erreur.set(
        this.msg(e, 'Impossible de proposer un descriptif depuis le CPS.'),
      );
    } finally {
      this.propositionCps.set(false);
    }
  }

  async extraireComposants(): Promise<void> {
    if (!this.modifiable() || this.extractionComposants() || this.sauvegarde()) return;
    const poste = this.poste();
    const dossierId = this.dossierId();
    if (!poste?.id || !dossierId) return;
    const articleId = poste.id;

    this.extractionComposants.set(true);
    this.erreur.set(undefined);
    try {
      const cpsId = this.cpsDocumentId();
      const loader = () =>
        this.dossierApi.proposerDecomposition(dossierId, articleId, cpsId);
      let propose = await this.proposeCache.getOrLoad(dossierId, articleId, cpsId, loader);
      if (!propose || !this.hasProposeRows(propose)) {
        propose = await this.proposeCache.refresh(dossierId, articleId, cpsId, loader);
      }
      if (!propose || !this.hasProposeRows(propose)) {
        this.toast.info(
          'Aucun composant détecté à partir du libellé. Ajoutez-les à la main, ou saisissez un descriptif puis réessayez.',
        );
        return;
      }

      // Revue humaine : Extraire n'écrit pas tout seul (deux seaux + incertain).
      this.extractionComposants.set(false);
      while (propose && this.hasProposeRows(propose)) {
        const ref = this.dialog.open(DecompositionSuggestionDialogComponent, {
          width: 'min(46rem, 94vw)',
          autoFocus: false,
          restoreFocus: true,
          data: {
            code: poste.code ?? '',
            libelle: poste.libelle ?? '',
            propose,
            uniteOptions: this.uniteOptions(),
          },
        });
        const result = (await firstValueFrom(ref.afterClosed())) as
          | DecompositionSuggestionDialogResult
          | null;
        if (!result) {
          return;
        }
        if (result.regenerate) {
          propose = await this.proposeCache.refresh(dossierId, articleId, cpsId, loader);
          if (!this.hasProposeRows(propose)) {
            this.toast.info(
              'Aucun composant détecté à partir du libellé. Ajoutez-les à la main, ou saisissez un descriptif puis réessayez.',
            );
            return;
          }
          continue;
        }
        if (result.selected?.length) {
          await this.appliquerSuggestions(result.selected, true);
          const saved = await this.sauvegarderPoste();
          if (!saved) {
            this.toast.info(
              'Composants Extraire en brouillon — enregistrez le poste pour la synthèse.',
            );
          }
        }
        return;
      }
    } catch (e) {
      this.erreur.set(this.msg(e, 'Impossible d’extraire les composants.'));
    } finally {
      this.extractionComposants.set(false);
    }
  }

  private hasProposeRows(propose: DecompositionPropose | null | undefined): boolean {
    return !!propose && (
      (propose.matched?.length ?? 0) > 0 ||
      (propose.missing?.length ?? 0) > 0 ||
      (propose.uncertain?.length ?? 0) > 0
    );
  }

  private async appliquerSuggestions(
    rows: DecompositionComposantMatched[],
    depuisIa = false,
  ): Promise<void> {
    if (!rows.length) return;
    if (!this.estDecompose()) {
      const ok = await this.passerEnDecomposition({ skipConfirm: true });
      if (!ok) return;
    }
    const existing = this.composants();
    const existingKeys = new Set(
      existing
        .map((c) => composantLibelle(c).toLowerCase())
        .filter(Boolean),
    );
    const added: ComposantDPU[] = [];
    const iaIds = new Set(this.composantsIaIds());
    const labels = new Map(this.composantsLabels());
    for (const row of rows) {
      const key = (row.itemId || row.name || '').trim();
      if (!key) continue;
      if (existingKeys.has(key.toLowerCase()) || existingKeys.has((row.name || '').trim().toLowerCase())) {
        continue;
      }
      const quantite = Number(row.rendement ?? 1);
      const prixUnitaire = Number(row.prixUnitaire ?? 0);
      const id = safeRandomUUID();
      const libelle = row.name || key;
      added.push({
        id,
        type: (row.type as ComposantDPU['type']) || 'MATIERE',
        referenceType: row.itemId ? 'ITEM' : 'LIBRE',
        itemId: row.itemId || null,
        ouvrageId: null,
        libelle,
        articleOuPosteId: libelle,
        quantite,
        unite: row.unite || this.poste()?.unite || 'U',
        prixUnitaire,
        total: Math.round(Math.max(0, quantite) * Math.max(0, prixUnitaire) * 100) / 100,
        sourcePrix: (row.sourcePrix as SourcePrixComposant) || (row.itemId ? 'TARIF' : 'MANUEL'),
        offreFournisseurId: null,
        prixSourceRefId: row.prixSourceRefId ?? null,
        prixDateSource: row.prixDateSource ?? null,
        prixCurrencyId: row.prixCurrencyId ?? null,
        prixLibelleSource: row.prixLibelleSource ?? null,
      });
      if (depuisIa || row.suggereParIa) iaIds.add(id);
      labels.set(id, libelle);
      existingKeys.add(libelle.toLowerCase());
    }
    if (!added.length) {
      this.toast.info('Ces composants sont déjà présents dans la décomposition.');
      return;
    }
    this.composantsBrouillon.set(this.dpuMath.recomputeTotals([...existing, ...added]));
    this.composantsIaIds.set(iaIds);
    this.composantsLabels.set(labels);
    this.markDpuDirty();
    this.toast.success(
      `${added.length} composant${added.length > 1 ? 's' : ''} ajouté${added.length > 1 ? 's' : ''}.`,
    );
  }

  estSuggereParIa(row: ComposantDPU): boolean {
    return this.composantsIaIds().has(row.id);
  }

  libelleComposant(row: ComposantDPU): string {
    return this.composantsLabels().get(row.id) ?? composantLibelle(row);
  }

  estComposantCatalogue(row: ComposantDPU): boolean {
    return estComposantItem(row);
  }

  async ajouterAConsultation(row: ComposantDPU): Promise<void> {
    const dossierId = this.dossierId();
    if (!dossierId || !row.itemId) return;
    try {
      const [item, dossier] = await Promise.all([
        this.itemsApi.getById(row.itemId),
        this.dossierApi.getById(dossierId),
      ]);
      const dpgfId = dossier.dpgfId;
      if (!dpgfId) {
        this.toast.info('Aucun bordereau pour ouvrir une consultation.');
        return;
      }
      const cle = (item.cleStable || item.code || '').trim();
      if (!cle) {
        this.toast.info('Ce composant n’a pas encore de cle_stable.');
        return;
      }
      const ok = await openConsultationDecompoDialog(this.dialog, {
        dossierId,
        dpgfId,
        preselectedCles: [cle],
        articleLibelle: item.name || cle,
      });
      if (ok) this.change.emit();
    } catch {
      this.toast.error('Impossible d’ouvrir la consultation.');
    }
  }

  async ajouterComposantAuCatalogue(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || this.estComposantCatalogue(row)) return;
    const ref = this.dialog.open(CreateMissingItemDialogComponent, {
      width: '28rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        designation: composantLibelle(row),
        type: row.type,
        unite: row.unite,
        rendement: row.quantite,
        prixUnitaire: row.prixUnitaire,
        uniteOptions: this.uniteOptions(),
        mode: 'catalogue',
      },
    });
    const result = (await firstValueFrom(
      ref.afterClosed(),
    )) as CreateMissingItemDialogResult | null;
    if (!result?.itemId) return;

    this.composantsBrouillon.set(
      this.dpuMath.recomputeTotals(
        this.composants().map((component) =>
          component.id === row.id
            ? {
                ...component,
                referenceType: 'ITEM' as const,
                itemId: result.itemId!,
                ouvrageId: null,
                libelle: composantLibelle(component),
                articleOuPosteId: composantLibelle(component),
                type: result.type,
                unite: result.unite,
                prixUnitaire: result.prixUnitaire,
                sourcePrix: result.sourcePrix,
                // Force re-résolution au prochain save (L5)
                prixSourceRefId: null,
                prixDateSource: null,
                prixCurrencyId: null,
                prixLibelleSource: null,
              }
            : component,
        ),
      ),
    );
    this.composantsLabels.update((current) => {
      const next = new Map(current);
      next.set(row.id, result.name);
      return next;
    });
    this.markDpuDirty();
    const saved = await this.sauvegarderPoste();
    if (saved) {
      this.toast.success('Composant créé dans le catalogue et lié au poste.');
    } else {
      this.toast.info(
        'Article créé — enregistrez le poste pour le retirer des composants non rattachés.',
      );
    }
  }

  private async passerEnEstime(): Promise<boolean> {
    if (!this.canMutate()) return false;
    const poste = this.poste();
    if (!poste?.id) return false;

    if (this.estDecompose() && this.hasComposants()) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en estimation',
        message:
          'L’estimation devient le prix actif. La décomposition est conservée en brouillon. Continuer ?',
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return false;
    }

    if (this.prixFourni() == null) {
      this.prixFourni.set(poste.coutUnitaire ?? poste.prixFourniBase ?? poste.prixUnitaire ?? 0);
    }
    if (this.fgFourniLocal() == null) this.fgFourniLocal.set(this.fgDefaut());
    if (this.margeFourniLocal() == null) this.margeFourniLocal.set(this.margeDefaut());
    this.estimationSaisieEn.set('COUT');
    this.estimationRepere.set(this.prixFourni());
    this.origineLocal.set('ESTIME');
    this.markDpuDirty();
    return true;
  }

  private async passerEnForfait(): Promise<boolean> {
    if (!this.canMutate()) return false;
    const poste = this.poste();
    if (!poste?.id) return false;

    if (this.estDecompose() && this.hasComposants()) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en forfait',
        message:
          'Le forfait devient le prix actif. La décomposition est conservée en brouillon. Continuer ?',
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return false;
    }

    if (this.prixFourni() == null) {
      this.prixFourni.set(poste.coutUnitaire ?? poste.prixFourniBase ?? poste.prixUnitaire ?? 0);
    }
    if (this.fgFourniLocal() == null) this.fgFourniLocal.set(this.fgDefaut());
    if (this.margeFourniLocal() == null) this.margeFourniLocal.set(this.margeDefaut());
    this.origineLocal.set('FORFAIT');
    this.markDpuDirty();
    return true;
  }

  async passerEnDecomposition(opts?: { skipConfirm?: boolean }): Promise<boolean> {
    if (!this.canMutate()) return false;
    const poste = this.poste();
    if (!poste?.id) return false;

    if (!opts?.skipConfirm && this.estSaisieSimple()) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en décomposition',
        message: this.hasComposants()
          ? 'Vous réactivez la décomposition brouillon. L’estimation / forfait reste un repère. Continuer ?'
          : 'Vous construirez le prix via des composants. L’estimation actuelle est conservée comme repère. Continuer ?',
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return false;
    }

    if (this.estEstime() && this.prixFourni() != null) {
      this.estimationRepere.set(this.coutUnitaireActif());
    }
    this.origineLocal.set('DECOMPOSE');
    if (this.fgDecomposeBrouillon() == null) this.fgDecomposeBrouillon.set(this.fgPct());
    if (this.margeDecomposeBrouillon() == null) this.margeDecomposeBrouillon.set(this.margePct());
    this.markDpuDirty();
    return true;
  }

  async ajouterSousDetail(): Promise<void> {
    if (!this.canMutate()) return;
    if (!this.estDecompose()) {
      const ok = await this.passerEnDecomposition({ skipConfirm: true });
      if (!ok) return;
    }
    const result = await this.openSousDetailDialog('create');
    if (!result) return;
    this.composantsBrouillon.set(
      this.dpuMath.recomputeTotals([
        ...this.composants(),
        {
          id: safeRandomUUID(),
          type: result.type,
          referenceType: 'LIBRE',
          libelle: result.designation,
          articleOuPosteId: result.designation,
          quantite: result.quantite,
          unite: result.unite,
          prixUnitaire: result.prixUnitaire,
          total: result.total,
          sourcePrix: result.sourcePrix ?? 'MANUEL',
          offreFournisseurId: result.offreFournisseurId ?? null,
        },
      ]),
    );
    this.markDpuDirty();
  }

  async ajouterDepuisCatalogue(ligneType?: DpuComposantType): Promise<void> {
    if (!this.canMutate()) return;
    if (!this.estDecompose()) {
      const ok = await this.passerEnDecomposition({ skipConfirm: true });
      if (!ok) return;
    }
    const result = (await firstValueFrom(
      this.dialog
        .open(CatalogItemPickDialogComponent, {
          width: '40rem',
          autoFocus: false,
          restoreFocus: true,
          data: {
            uniteOptions: this.uniteOptions(),
            context: 'dpu',
            presetNature: dpuTypeToNature(ligneType),
          },
        })
        .afterClosed(),
    )) as CatalogItemPickDialogResult | null;
    if (!result?.itemId) return;
    if (this.composants().some((c) => c.itemId === result.itemId)) {
      this.toast.info('Ce composant catalogue est déjà dans le poste.');
      return;
    }
    const id = safeRandomUUID();
    this.composantsBrouillon.set(
      this.dpuMath.recomputeTotals([
        ...this.composants(),
        {
          id,
          type: result.type,
          referenceType: 'ITEM',
          itemId: result.itemId,
          ouvrageId: null,
          libelle: result.name,
          articleOuPosteId: result.name,
          quantite: result.quantite,
          unite: result.unite,
          prixUnitaire: result.prixUnitaire,
          total: Math.round(result.quantite * result.prixUnitaire * 100) / 100,
          sourcePrix: result.sourcePrix,
        },
      ]),
    );
    this.composantsLabels.update((current) => {
      const next = new Map(current);
      next.set(id, result.name);
      return next;
    });
    this.markDpuDirty();
    this.toast.success('Composant ajouté depuis le catalogue — enregistrez le poste.');
  }

  async modifierSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || !this.estDecompose()) return;
    const result = await this.openSousDetailDialog('edit', row);
    if (!result) return;
    this.composantsBrouillon.set(
      this.dpuMath.recomputeTotals(
        this.composants().map((c) =>
          c.id === row.id
            ? {
                ...c,
                type: result.type,
                referenceType: 'LIBRE' as const,
                itemId: null,
                ouvrageId: null,
                libelle: result.designation,
                articleOuPosteId: result.designation,
                quantite: result.quantite,
                unite: result.unite,
                prixUnitaire: result.prixUnitaire,
                total: result.total,
                sourcePrix: result.sourcePrix ?? c.sourcePrix ?? 'MANUEL',
                offreFournisseurId: result.offreFournisseurId ?? c.offreFournisseurId ?? null,
                prixSourceRefId: null,
                prixDateSource: null,
                prixCurrencyId: null,
                prixLibelleSource: null,
              }
            : c,
        ),
      ),
    );
    this.markDpuDirty();
  }

  /** L5 — re-résout les prix ITEM gelés (étude non validée). */
  async rafraichirPrix(): Promise<void> {
    if (!this.peutRafraichirPrix() || this.rafraichissementPrix() || this.modificationsEnAttente()) {
      if (this.modificationsEnAttente()) {
        this.toast.info('Enregistrez ou annulez les modifications avant de rafraîchir les prix.');
      }
      return;
    }
    const dpuId = this.dpu()?.id;
    if (!dpuId) return;
    this.rafraichissementPrix.set(true);
    this.erreur.set(undefined);
    try {
      const updated = await this.dpuApi.refreshPrices(dpuId);
      this.applyDpu(updated);
      this.captureDpuInitial();
      this.toast.success('Prix catalogue rafraîchis.');
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e, 'Impossible de rafraîchir les prix.'));
    } finally {
      this.rafraichissementPrix.set(false);
    }
  }

  async dupliquerSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || !this.estDecompose()) return;
    this.composantsBrouillon.set([
      ...this.composants(),
      { ...row, id: safeRandomUUID() },
    ]);
    this.markDpuDirty();
  }

  async supprimerSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || !this.estDecompose()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le composant',
      message: `Supprimer « ${composantLibelle(row)} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    this.composantsBrouillon.set(this.composants().filter((c) => c.id !== row.id));
    this.markDpuDirty();
  }

  async ouvrirChiffrage(): Promise<void> {
    if (!this.canMutate() || !this.estDecompose()) return;
    const ref = this.dialog.open(PosteChiffrageDialogComponent, {
      width: '28rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        deboursSec: this.deboursSec(),
        fraisGenerauxPercent: this.fgPct(),
        margePercent: this.margePct(),
      },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as PosteChiffrageDialogResult | null;
    if (!result) return;
    if (this.estSaisieSimple()) {
      this.fgFourniLocal.set(result.fraisGenerauxPercent);
      this.margeFourniLocal.set(result.margePercent);
    } else {
      this.fgDecomposeBrouillon.set(result.fraisGenerauxPercent);
      this.margeDecomposeBrouillon.set(result.margePercent);
    }
    this.markDpuDirty();
  }

  /**
   * Persiste le poste.
   * @returns snapshot serveur pour rafraîchir l’arbre sans attendre un reload partiel.
   */
  async sauvegarderPoste(): Promise<PosteSaveSnapshot | null> {
    if (!this.modificationsEnAttente()) {
      const poste = this.poste();
      if (!poste?.id) return null;
      return {
        noeudId: poste.id,
        prixUnitaire: this.prixVenteHt(),
        total: this.totalLigne(),
        mode: this.estDecompose() ? 'DECOMPOSE' : 'FOURNI',
        origineCout: this.origineActif(),
        estimationSaisieEn: this.estEstime() ? this.estimationSaisieEn() : null,
        coutDeduit: this.coutDeduit(),
        prixFourniBase: this.coutUnitaireActif(),
        coutUnitaire: this.coutUnitaireActif(),
        fraisGenerauxPercent: this.fgPct(),
        margePercent: this.margePct(),
        descriptif: this.commentaire().trim(),
      };
    }
    if (!this.canMutate()) {
      this.erreur.set(
        this.chargement()
          ? 'Chargement du poste en cours — réessayez dans un instant.'
          : 'Enregistrement impossible pour le moment.',
      );
      return null;
    }
    const poste = this.poste();
    if (!poste?.id) return null;
    this.sauvegarde.set(true);
    this.erreur.set(undefined);
    try {
      let savedNoeud: {
        prixUnitaire?: number | null;
        total?: number | null;
        mode?: string | null;
        origineCout?: string | null;
        estimationSaisieEn?: string | null;
        coutDeduit?: boolean;
        coutUnitaire?: number | null;
        prixFourniBase?: number | null;
        fraisGenerauxPercent?: number | null;
        margePercent?: number | null;
        descriptif?: string | null;
      } | null = null;

      if (this.estDecompose()) {
        this.origineLocal.set('DECOMPOSE');
        const dpu = await this.assurerDpu();
        if (!dpu?.id) {
          this.erreur.set('Impossible de créer la décomposition du poste.');
          return null;
        }
        const updated = await this.dpuApi.update(dpu.id, {
          fraisGenerauxPercent: this.fgPct(),
          margeBeneficiairePercent: this.margePct(),
          composants: this.composants().map((c) => toComposantDpuWrite(c)),
        });
        this.applyDpu(updated);
        savedNoeud = await this.dpgfApi.updateNoeud(poste.id, {
          prixUnitaire: this.prixVenteHt(),
          coutUnitaire: this.coutUnitaireActif(),
          fraisGenerauxPercent: this.fgPct(),
          margePercent: this.margePct(),
          descriptif: this.commentaire().trim(),
          origineCout: 'DECOMPOSE',
          mode: 'DECOMPOSE',
        });
      } else if (this.estForfait()) {
        savedNoeud = await this.dpgfApi.updateNoeud(poste.id, {
          prixUnitaire: this.prixVenteHt(),
          coutUnitaire: this.coutUnitaireActif(),
          prixFourniBase: this.coutUnitaireActif(),
          fraisGenerauxPercent: this.fgPct(),
          margePercent: this.margePct(),
          descriptif: this.commentaire().trim(),
          origineCout: 'FORFAIT',
          forfaitPartnerId: this.forfaitPartnerId(),
          forfaitOffreId: this.forfaitOffreId(),
          mode: 'FOURNI',
        });
      } else if (this.estEstime()) {
        savedNoeud = await this.dpgfApi.updateNoeud(poste.id, {
          prixUnitaire: this.prixVenteHt(),
          coutUnitaire: this.coutUnitaireActif(),
          prixFourniBase: this.coutUnitaireActif(),
          fraisGenerauxPercent: this.fgPct(),
          margePercent: this.margePct(),
          descriptif: this.commentaire().trim(),
          origineCout: 'ESTIME',
          estimationSaisieEn: this.estimationSaisieEn(),
          mode: 'FOURNI',
        });
      } else {
        savedNoeud = await this.dpgfApi.updateNoeud(poste.id, {
          descriptif: this.commentaire().trim(),
        });
      }
      const trimmed = this.commentaire().trim();
      this.commentaire.set(trimmed);
      this.commentInitial.set(trimmed);
      this.captureDpuInitial();
      this.markSaved();
      return {
        noeudId: poste.id,
        prixUnitaire: savedNoeud?.prixUnitaire ?? this.prixVenteHt(),
        total: savedNoeud?.total ?? this.totalLigne(),
        mode: savedNoeud?.mode ?? (this.estDecompose() ? 'DECOMPOSE' : 'FOURNI'),
        origineCout: savedNoeud?.origineCout ?? this.origineActif(),
        estimationSaisieEn: savedNoeud?.estimationSaisieEn ?? (this.estEstime() ? this.estimationSaisieEn() : null),
        coutDeduit: savedNoeud?.coutDeduit ?? this.coutDeduit(),
        prixFourniBase: savedNoeud?.coutUnitaire ?? savedNoeud?.prixFourniBase ?? this.coutUnitaireActif(),
        coutUnitaire: savedNoeud?.coutUnitaire ?? this.coutUnitaireActif(),
        fraisGenerauxPercent: savedNoeud?.fraisGenerauxPercent ?? this.fgPct(),
        margePercent: savedNoeud?.margePercent ?? this.margePct(),
        descriptif: trimmed,
      };
    } catch (e) {
      this.erreur.set(this.msg(e));
      return null;
    } finally {
      this.sauvegarde.set(false);
    }
  }

  private canMutate(): boolean {
    return (
      this.modifiable() &&
      !this.chargement() &&
      !this.sauvegarde() &&
      !this.propositionCps() &&
      !this.extractionComposants() &&
      !this.rafraichissementPrix()
    );
  }

  private markSaved(): void {
    this.statut.set('saved');
    this.change.emit();
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => {
      if (this.statut() === 'saved') this.statut.set('idle');
    }, 2500);
  }

  private markDpuDirty(): void {
    this.dpuDirty.set(this.buildDpuSnapshot() !== this.dpuSnapshotInitial);
  }

  private captureDpuInitial(): void {
    this.dpuSnapshotInitial = this.buildDpuSnapshot();
    this.dpuDirty.set(false);
  }

  private buildDpuSnapshot(): string {
    return JSON.stringify({
      origine: this.origineActif(),
      saisieEn: this.estimationSaisieEn(),
      prixFourni: this.prixFourni(),
      venteSaisie: this.venteSaisie(),
      forfaitPartnerId: this.forfaitPartnerId(),
      forfaitOffreId: this.forfaitOffreId(),
      fgFourni: this.fgFourniLocal(),
      margeFourni: this.margeFourniLocal(),
      fgDecompose: this.fgDecomposeBrouillon(),
      margeDecompose: this.margeDecomposeBrouillon(),
      composants: buildComposantDirtyKey(this.composants()),
    });
  }

  private async openSousDetailDialog(
    mode: 'create' | 'edit',
    row?: ComposantDPU,
  ): Promise<SousDetailDialogResult | null> {
    const ref = this.dialog.open(SousDetailDialogComponent, {
      width: '32rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        mode,
        premier: mode === 'create' && this.composants().length === 0,
        uniteOptions: this.uniteOptions(),
        initial: row
          ? {
              type: row.type,
              designation: composantLibelle(row),
              unite: row.unite,
              quantite: row.quantite,
              prixUnitaire: row.prixUnitaire,
              sourcePrix: row.sourcePrix ?? 'MANUEL',
              offreFournisseurId: row.offreFournisseurId ?? null,
            }
          : {
              unite: this.poste()?.unite ?? this.uniteOptions()[0]?.code ?? 'U',
              sourcePrix: 'MANUEL',
            },
      },
    });
    return (await firstValueFrom(ref.afterClosed())) ?? null;
  }

  private async assurerDpu(): Promise<PrixDPU | null> {
    const existing = this.dpu();
    if (existing?.id) return existing;
    const poste = this.poste();
    if (!poste?.id) return null;
    try {
      const created = await this.dpuApi.getOrCreateForNoeud(poste.id, {
        fraisGenerauxPercent: this.fgDefaut(),
        margeBeneficiairePercent: this.margeDefaut(),
        tvaTaux: this.tvaDefaut(),
      });
      this.applyDpu(created, true);
      return this.dpu();
    } catch (e) {
      this.erreur.set(this.msg(e));
      return null;
    }
  }

  private async chargerDpu(noeudId: string): Promise<void> {
    const external = this.externalDpu();
    if (external || this.guestReadOnly()) {
      const seq = ++this.loadSeq;
      this.chargement.set(true);
      this.erreur.set(undefined);
      this.statut.set('idle');
      try {
        if (external) this.applyDpu(external);
        else this.dpu.set(null);
      } finally {
        if (seq === this.loadSeq) {
          this.chargement.set(false);
          this.captureDpuInitial();
        }
      }
      return;
    }
    const seq = ++this.loadSeq;
    this.chargement.set(true);
    this.erreur.set(undefined);
    this.statut.set('idle');
    try {
      const list = await this.dpuApi.listByNoeud(noeudId);
      if (seq !== this.loadSeq) return;
      if (list[0]) {
        this.applyDpu(list[0]);
      } else {
        this.dpu.set(null);
        this.composantsBrouillon.set([]);
        this.fgDecomposeBrouillon.set(this.fgDefaut());
        this.margeDecomposeBrouillon.set(this.margeDefaut());
      }
    } catch (e) {
      if (seq !== this.loadSeq) return;
      this.dpu.set(null);
      this.erreur.set(this.msg(e));
    } finally {
      if (seq === this.loadSeq) {
        this.chargement.set(false);
        this.captureDpuInitial();
      }
    }
  }

  private applyDpu(raw: PrixDPU, preserveBrouillon = false): void {
    const composants = this.normalizeComposants(raw.composants ?? []);
    const deboursSec = Number(raw.deboursSec ?? this.dpuMath.computeDeboursSec(composants));
    const fg = Number(raw.fraisGenerauxPercent ?? this.fgDefaut());
    const marge = Number(raw.margeBeneficiairePercent ?? this.margeDefaut());
    this.dpu.set({
      ...raw,
      composants,
      deboursSec,
      fraisGenerauxPercent: fg,
      margeBeneficiairePercent: marge,
      prixVenteHT: Number(
        raw.prixVenteHT ?? this.dpuMath.computePrixVenteHt(deboursSec, fg, marge),
      ),
      prixVenteTTC: Number(raw.prixVenteTTC ?? 0),
      tvaTaux: Number(raw.tvaTaux ?? this.tvaDefaut()),
    });
    if (!preserveBrouillon) {
      this.composantsBrouillon.set(composants);
      this.fgDecomposeBrouillon.set(fg);
      this.margeDecomposeBrouillon.set(marge);
    }
  }

  private normalizeComposants(list: ComposantDPU[]): ComposantDPU[] {
    return this.dpuMath.recomputeTotals(list.map((c) => normalizeComposantDpu(c, safeRandomUUID())));
  }

  private async chargerUnites(): Promise<void> {
    try {
      const page = await this.uomApi.getAll({ page: 0, pageSize: 500, sortBy: 'code' });
      this.uniteOptions.set(toUniteOptions(page.items ?? []));
    } catch {
      this.uniteOptions.set(toUniteOptions([]));
    }
  }

  private msg(e: unknown, fallback = 'Impossible d’enregistrer la décomposition.'): string {
    const err = e as { error?: { message?: string; code?: string } };
    return err?.error?.message ?? err?.error?.code ?? fallback;
  }
}
