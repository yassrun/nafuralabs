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
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ConfirmDialogService, ToastService } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { safeRandomUUID } from '@core/util/uuid';

import type { ComposantDPU, PrixDPU, SourcePrixComposant } from '@app/etudes/models';
import { DpuService } from '@app/etudes/services/dpu.service';
import { DpuApiService } from '@app/pages/etudes/bibliotheque-prix/services/dpu-api.service';
import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';
import { DpgfApiService } from '../../../metres/services/dpgf-api.service';
import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';
import type { DecompositionComposantMatched } from '../../services/dossier-etude-api.service';
import { DecompositionProposeCache } from '../../services/decomposition-propose.cache';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import {
  prixVenteHtActif,
  resolvePosteChiffrageMode,
  type PosteChiffrageMode,
} from '../../utils/poste-chiffrage-mode.util';
import { buildComposantDirtyKey } from '../../utils/poste-dirty.util';
import { toUniteOptions, type UniteOption } from '../../utils/unite-options.util';
import { CpsDescriptifDialogComponent } from '../cps-descriptif-dialog/cps-descriptif-dialog.component';
import {
  CreateMissingItemDialogComponent,
  type CreateMissingItemDialogResult,
} from '../create-missing-item-dialog/create-missing-item-dialog.component';
import {
  PosteChiffrageDialogComponent,
  type PosteChiffrageDialogResult,
} from '../poste-chiffrage-dialog/poste-chiffrage-dialog.component';
import {
  PrixFourniDialogComponent,
  type PrixFourniDialogResult,
} from '../prix-fourni-dialog/prix-fourni-dialog.component';
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
  CONSULTE: 'Consulté',
  BIBLIOTHEQUE: 'Bibliothèque',
};

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

  readonly poste = input<BordereauTreeRow | null>(null);
  readonly dossierId = input<string | null>(null);
  /** Présent uniquement si le CPS a été indexé — sinon le bouton magique est masqué. */
  readonly cpsDocumentId = input<string | null>(null);
  readonly modifiable = input(true);
  readonly fgDefaut = input(10);
  readonly margeDefaut = input(17.5);
  readonly tvaDefaut = input(20);

  readonly change = output<void>();
  readonly closeMobile = output<void>();
  readonly dirtyChange = output<boolean>();
  readonly beforeSelectRequest = output<void>();

  readonly dpu = signal<PrixDPU | null>(null);
  /** En mode FOURNI, ce signal contient le coût de base avant FG et marge. */
  readonly prixFourni = signal<number | null>(null);
  readonly fgFourniLocal = signal<number | null>(null);
  readonly margeFourniLocal = signal<number | null>(null);
  readonly composantsBrouillon = signal<ComposantDPU[]>([]);
  readonly fgDecomposeBrouillon = signal<number | null>(null);
  readonly margeDecomposeBrouillon = signal<number | null>(null);
  readonly commentaire = signal('');
  readonly commentInitial = signal('');
  readonly modeLocal = signal<PosteChiffrageMode>(null);
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly sauvegarde = signal(false);
  readonly propositionCps = signal(false);
  readonly extractionComposants = signal(false);
  readonly composantsIaIds = signal<Set<string>>(new Set());
  readonly composantsLabels = signal<Map<string, string>>(new Map());
  readonly erreur = signal<string | undefined>(undefined);
  readonly statut = signal<'idle' | 'saved'>('idle');

  /** Dirty DPU (mode / composants / FG) — mis à jour uniquement sur mutations structurées. */
  private dpuSnapshotInitial = '';
  private readonly dpuDirty = signal(false);
  private loadSeq = 0;
  private savedTimer: ReturnType<typeof setTimeout> | undefined;

  readonly composants = computed(() => this.composantsBrouillon());
  readonly hasComposants = computed(() => this.composants().length > 0);
  readonly estFourni = computed(() => this.modeLocal() === 'FOURNI');
  readonly estDecompose = computed(() => this.modeLocal() === 'DECOMPOSE');
  readonly sansMode = computed(() => this.modeLocal() == null);
  readonly peutProposerCps = computed(
    () => !!this.dossierId() && !!this.cpsDocumentId() && this.modifiable(),
  );

  readonly commentDirty = computed(
    () => this.commentaire().trim() !== this.commentInitial().trim(),
  );
  readonly modificationsEnAttente = computed(() => this.commentDirty() || this.dpuDirty());

  readonly deboursSec = computed(() =>
    this.estFourni()
      ? (this.prixFourni() ?? 0)
      : this.dpuMath.computeDeboursSec(this.composants()),
  );
  readonly fgPct = computed(() =>
    this.estFourni()
      ? (this.fgFourniLocal() ?? this.fgDefaut())
      : (this.fgDecomposeBrouillon() ?? this.fgDefaut()),
  );
  readonly margePct = computed(() =>
    this.estFourni()
      ? (this.margeFourniLocal() ?? this.margeDefaut())
      : (this.margeDecomposeBrouillon() ?? this.margeDefaut()),
  );
  readonly prixVenteHt = computed(() => {
    if (this.estFourni() || this.estDecompose()) {
      return this.dpuMath.computePrixVenteHt(this.deboursSec(), this.fgPct(), this.margePct());
    }
    return prixVenteHtActif({
      mode: this.modeLocal(),
      prixFourni: this.prixFourni(),
      prixDecompose: this.dpu()?.prixVenteHT,
      prixPoste: this.poste()?.prixUnitaire,
    });
  });
  readonly totalLigne = computed(() => {
    const q = Number(this.poste()?.quantite ?? 0);
    const pu = this.prixVenteHt();
    return Math.round(Math.max(0, q) * Math.max(0, pu) * 100) / 100;
  });
  readonly fgAmount = computed(
    () => Math.round(this.deboursSec() * (this.fgPct() / 100) * 100) / 100,
  );
  readonly margeAmount = computed(
    () => Math.round(this.deboursSec() * (this.margePct() / 100) * 100) / 100,
  );

  constructor() {
    void this.chargerUnites();
    effect(() => {
      this.dirtyChange.emit(this.modificationsEnAttente());
    });
    effect(() => {
      const poste = this.poste();
      if (this.savedTimer) {
        clearTimeout(this.savedTimer);
        this.savedTimer = undefined;
      }
      if (poste?.id && poste.type === 'ARTICLE') {
        this.prixFourni.set(poste.prixFourniBase ?? poste.prixUnitaire ?? null);
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
        this.modeLocal.set(
          resolvePosteChiffrageMode({
            mode: poste.mode,
            prixUnitaire: poste.prixUnitaire,
          }),
        );
        this.propositionCps.set(false);
        this.extractionComposants.set(false);
        void this.chargerDpu(poste.id);
      } else {
        this.loadSeq++;
        this.dpu.set(null);
        this.prixFourni.set(null);
        this.fgFourniLocal.set(null);
        this.margeFourniLocal.set(null);
        this.commentaire.set('');
        this.commentInitial.set('');
        this.composantsBrouillon.set([]);
        this.composantsIaIds.set(new Set());
        this.composantsLabels.set(new Map());
        this.fgDecomposeBrouillon.set(null);
        this.margeDecomposeBrouillon.set(null);
        this.modeLocal.set(null);
        this.erreur.set(undefined);
        this.chargement.set(false);
        this.propositionCps.set(false);
        this.extractionComposants.set(false);
        this.statut.set('idle');
        this.captureDpuInitial();
      }
    });
  }

  typeLabel(type: ComposantDPU['type']): string {
    return TYPE_LABELS[type] ?? type;
  }

  sourceLabel(source?: SourcePrixComposant | null): string {
    if (!source) return SOURCE_LABELS['MANUEL'];
    return SOURCE_LABELS[source] ?? source;
  }

  onCommentaireChange(value: string): void {
    this.commentaire.set(value);
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
        this.toast.info('Aucune section CPS pertinente pour cet article.');
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
      const propose = await this.proposeCache.getOrLoad(dossierId, articleId, cpsId, loader);
      if (!propose || (!(propose.matched?.length) && !(propose.missing?.length))) {
        this.toast.info('Aucun composant détecté pour cet article.');
        return;
      }

      const suggestions: DecompositionComposantMatched[] = [
        ...(propose.matched ?? []),
        ...(propose.missing ?? []).map((row) => ({
          type: row.type,
          name: row.designation,
          unite: row.unite,
          rendement: row.rendement,
          prixUnitaire: 0,
          sourcePrix: 'MANUEL',
          confiance: row.confiance,
          suggereParIa: true,
        })),
      ];
      // L'application des suggestions passe le poste en mode DECOMPOSE.
      // Ne pas laisser le verrou "extraction en cours" bloquer cette mutation interne.
      this.extractionComposants.set(false);
      await this.appliquerSuggestions(suggestions, true);
    } catch (e) {
      this.erreur.set(this.msg(e, 'Impossible d’extraire les composants.'));
    } finally {
      this.extractionComposants.set(false);
    }
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
      existing.map((c) => String(c.articleOuPosteId ?? '').trim().toLowerCase()).filter(Boolean),
    );
    const added: ComposantDPU[] = [];
    const iaIds = new Set(this.composantsIaIds());
    const labels = new Map(this.composantsLabels());
    for (const row of rows) {
      const key = (row.itemId || row.name || '').trim();
      if (!key) continue;
      if (existingKeys.has(key.toLowerCase())) continue;
      const quantite = Number(row.rendement ?? 1);
      const prixUnitaire = Number(row.prixUnitaire ?? 0);
      const id = safeRandomUUID();
      added.push({
        id,
        type: (row.type as ComposantDPU['type']) || 'MATIERE',
        articleOuPosteId: key,
        quantite,
        unite: row.unite || this.poste()?.unite || 'U',
        prixUnitaire,
        total: Math.round(Math.max(0, quantite) * Math.max(0, prixUnitaire) * 100) / 100,
        sourcePrix: (row.sourcePrix as SourcePrixComposant) || (row.itemId ? 'TARIF' : 'MANUEL'),
        offreFournisseurId: null,
      });
      if (depuisIa || row.suggereParIa) iaIds.add(id);
      labels.set(id, row.name || key);
      existingKeys.add(key.toLowerCase());
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
      `${added.length} composant${added.length > 1 ? 's' : ''} ajouté${added.length > 1 ? 's' : ''} — enregistrez le poste.`,
    );
  }

  estSuggereParIa(row: ComposantDPU): boolean {
    return this.composantsIaIds().has(row.id);
  }

  libelleComposant(row: ComposantDPU): string {
    return this.composantsLabels().get(row.id) ?? row.articleOuPosteId;
  }

  estComposantCatalogue(row: ComposantDPU): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(row.articleOuPosteId);
  }

  async ajouterComposantAuCatalogue(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || this.estComposantCatalogue(row)) return;
    const ref = this.dialog.open(CreateMissingItemDialogComponent, {
      width: '28rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        designation: row.articleOuPosteId,
        type: row.type,
        unite: row.unite,
        rendement: row.quantite,
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
                articleOuPosteId: result.itemId!,
                type: result.type,
                unite: result.unite,
                prixUnitaire: result.prixUnitaire,
                sourcePrix: result.sourcePrix,
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
    this.toast.success('Composant créé dans le catalogue et lié au poste.');
  }

  async saisirPrixFourni(): Promise<void> {
    if (!this.canMutate()) return;
    const poste = this.poste();
    if (!poste?.id) return;

    if (this.estDecompose() && this.hasComposants()) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en prix fourni',
        message:
          'Le prix fourni devient le prix actif du bordereau. La décomposition est conservée en brouillon et pourra être reprise plus tard. Continuer ?',
        variant: 'danger',
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return;
    }

    const fgRate =
      (this.fgFourniLocal() ?? 0) > 0 ? this.fgPct() : this.fgDefaut();
    const margeRate =
      (this.margeFourniLocal() ?? 0) > 0 ? this.margePct() : this.margeDefaut();

    const ref = this.dialog.open(PrixFourniDialogComponent, {
      width: '28rem',
      autoFocus: false,
      restoreFocus: true,
      data: {
        code: poste.code,
        libelle: poste.libelle,
        unite: poste.unite,
        quantite: poste.quantite,
        prixFourniBase: this.prixFourni(),
        fraisGenerauxPercent: fgRate,
        margePercent: margeRate,
        appliquerFgMarge:
          (this.fgFourniLocal() ?? 0) > 0 || (this.margeFourniLocal() ?? 0) > 0,
      },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as PrixFourniDialogResult | null;
    if (!result) return;

    this.prixFourni.set(result.prixUnitaire);
    if (result.appliquerFgMarge) {
      this.fgFourniLocal.set(fgRate);
      this.margeFourniLocal.set(margeRate);
    } else {
      this.fgFourniLocal.set(0);
      this.margeFourniLocal.set(0);
    }
    this.modeLocal.set('FOURNI');
    this.markDpuDirty();
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

  async passerEnDecomposition(opts?: { skipConfirm?: boolean }): Promise<boolean> {
    if (!this.canMutate()) return false;
    const poste = this.poste();
    if (!poste?.id) return false;

    if (!opts?.skipConfirm && this.estFourni()) {
      const message = this.hasComposants()
        ? 'Vous allez réactiver la décomposition brouillon. Le prix fourni ne sera plus actif pour le bordereau. Continuer ?'
        : 'Le prix fourni ne sera plus actif pour ce poste. Vous construirez le prix via des composants. Continuer ?';
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en décomposition',
        message,
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return false;
    }

    this.modeLocal.set('DECOMPOSE');
    if (this.fgDecomposeBrouillon() == null) this.fgDecomposeBrouillon.set(this.fgPct());
    if (this.margeDecomposeBrouillon() == null) this.margeDecomposeBrouillon.set(this.margePct());
    this.markDpuDirty();
    return true;
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
                articleOuPosteId: result.designation,
                quantite: result.quantite,
                unite: result.unite,
                prixUnitaire: result.prixUnitaire,
                total: result.total,
                sourcePrix: result.sourcePrix ?? c.sourcePrix ?? 'MANUEL',
                offreFournisseurId: result.offreFournisseurId ?? c.offreFournisseurId ?? null,
              }
            : c,
        ),
      ),
    );
    this.markDpuDirty();
  }

  async marquerConsulte(row: ComposantDPU): Promise<void> {
    if (!this.canMutate() || !this.estDecompose()) return;
    this.composantsBrouillon.set(
      this.composants().map((c) =>
        c.id === row.id ? { ...c, sourcePrix: 'CONSULTE' as const } : c,
      ),
    );
    this.markDpuDirty();
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
      message: `Supprimer « ${row.articleOuPosteId} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    this.composantsBrouillon.set(this.composants().filter((c) => c.id !== row.id));
    this.markDpuDirty();
  }

  async ouvrirChiffrage(): Promise<void> {
    if (!this.canMutate() || this.sansMode()) return;
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
    if (this.estFourni()) {
      this.fgFourniLocal.set(result.fraisGenerauxPercent);
      this.margeFourniLocal.set(result.margePercent);
    } else {
      this.fgDecomposeBrouillon.set(result.fraisGenerauxPercent);
      this.margeDecomposeBrouillon.set(result.margePercent);
    }
    this.markDpuDirty();
  }

  async sauvegarderPoste(): Promise<void> {
    if (!this.canMutate() || !this.modificationsEnAttente()) return;
    const poste = this.poste();
    if (!poste?.id) return;
    this.sauvegarde.set(true);
    this.erreur.set(undefined);
    try {
      if (this.estDecompose()) {
        const dpu = await this.assurerDpu();
        if (!dpu?.id) return;
        const updated = await this.dpuApi.update(dpu.id, {
          fraisGenerauxPercent: this.fgPct(),
          margeBeneficiairePercent: this.margePct(),
          composants: this.composants().map((c) => ({
            id: c.id,
            type: c.type,
            articleOuPosteId: c.articleOuPosteId,
            quantite: c.quantite,
            unite: c.unite,
            prixUnitaire: c.prixUnitaire,
            total: c.total,
            sourcePrix: c.sourcePrix ?? 'MANUEL',
            offreFournisseurId: c.offreFournisseurId ?? null,
          })),
        });
        this.applyDpu(updated);
        await this.dpgfApi.updateNoeud(poste.id, { descriptif: this.commentaire().trim() });
      } else if (this.estFourni()) {
        await this.dpgfApi.updateNoeud(poste.id, {
          prixUnitaire: this.prixVenteHt(),
          prixFourniBase: this.prixFourni() ?? 0,
          fraisGenerauxPercent: this.fgPct(),
          margePercent: this.margePct(),
          descriptif: this.commentaire().trim(),
          mode: 'FOURNI',
        });
      } else {
        await this.dpgfApi.updateNoeud(poste.id, { descriptif: this.commentaire().trim() });
      }
      const trimmed = this.commentaire().trim();
      this.commentaire.set(trimmed);
      this.commentInitial.set(trimmed);
      this.captureDpuInitial();
      this.markSaved();
    } catch (e) {
      this.erreur.set(this.msg(e));
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
      !this.extractionComposants()
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
      mode: this.modeLocal(),
      prixFourni: this.prixFourni(),
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
              designation: row.articleOuPosteId,
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
    return this.dpuMath.recomputeTotals(
      list.map((c) => ({
        id: c.id || safeRandomUUID(),
        type: c.type,
        articleOuPosteId: c.articleOuPosteId,
        quantite: Number(
          (c as ComposantDPU & { rendement?: number }).quantite ??
            (c as { rendement?: number }).rendement ??
            0,
        ),
        unite: c.unite,
        prixUnitaire: Number(c.prixUnitaire ?? 0),
        total: Number(c.total ?? 0),
        sourcePrix: c.sourcePrix ?? 'MANUEL',
        offreFournisseurId: c.offreFournisseurId ?? null,
      })),
    );
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
