import { CommonModule } from '@angular/common';
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
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ConfirmDialogService } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import type { ComposantDPU, PrixDPU } from '@app/etudes/models';
import { DpuService } from '@app/etudes/services/dpu.service';
import { DpuApiService } from '@app/pages/etudes/bibliotheque-prix/services/dpu-api.service';
import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';
import { DpgfApiService } from '../../../metres/services/dpgf-api.service';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import { toUniteOptions, type UniteOption } from '../../utils/unite-options.util';
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

@Component({
  selector: 'app-poste-decomposition-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, MadCurrencyPipe],
  templateUrl: './poste-decomposition-panel.component.html',
  styleUrl: './poste-decomposition-panel.component.scss',
})
export class PosteDecompositionPanelComponent {
  private readonly dpuApi = inject(DpuApiService);
  private readonly dpuMath = inject(DpuService);
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly poste = input<BordereauTreeRow | null>(null);
  readonly modifiable = input(true);
  readonly fgDefaut = input(10);
  readonly margeDefaut = input(17.5);
  readonly tvaDefaut = input(20);

  readonly change = output<void>();
  readonly closeMobile = output<void>();

  readonly dpu = signal<PrixDPU | null>(null);
  readonly prixFourni = signal<number | null>(null);
  readonly modeLocal = signal<'FOURNI' | 'DECOMPOSE' | null>(null);
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly sauvegarde = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly statut = signal<'idle' | 'saved'>('idle');

  readonly composants = computed(() => this.dpu()?.composants ?? []);
  readonly estDecompose = computed(
    () => this.modeLocal() === 'DECOMPOSE' || this.composants().length > 0,
  );
  readonly estFourni = computed(
    () => this.modeLocal() === 'FOURNI' || (!this.estDecompose() && (this.prixFourni() ?? 0) > 0),
  );
  readonly deboursSec = computed(() => this.dpu()?.deboursSec ?? 0);
  readonly fgPct = computed(() => this.dpu()?.fraisGenerauxPercent ?? this.fgDefaut());
  readonly margePct = computed(() => this.dpu()?.margeBeneficiairePercent ?? this.margeDefaut());
  readonly prixVenteHt = computed(() => {
    if (this.estDecompose()) return this.dpu()?.prixVenteHT ?? 0;
    return this.prixFourni() ?? this.poste()?.prixUnitaire ?? 0;
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
      const poste = this.poste();
      if (poste?.id && poste.type === 'ARTICLE') {
        this.prixFourni.set(poste.prixUnitaire ?? null);
        this.modeLocal.set(
          poste.mode === 'FOURNI' || poste.mode === 'DECOMPOSE' ? poste.mode : null,
        );
        void this.chargerDpu(poste.id);
      } else {
        this.dpu.set(null);
        this.prixFourni.set(null);
        this.modeLocal.set(null);
        this.erreur.set(undefined);
      }
    });
  }

  typeLabel(type: ComposantDPU['type']): string {
    return TYPE_LABELS[type] ?? type;
  }

  async saisirPrixFourni(): Promise<void> {
    if (!this.modifiable()) return;
    const poste = this.poste();
    if (!poste?.id) return;
    if (this.composants().length > 0) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Passer en prix fourni',
        message:
          'Ce poste a déjà une décomposition. Le prix fourni remplacera le prix calculé pour le bordereau. Continuer ?',
        variant: 'danger',
        confirmLabel: 'Continuer',
      });
      if (!confirmed) return;
    }

    const ref = this.dialog.open(PrixFourniDialogComponent, {
      width: '28rem',
      data: {
        code: poste.code,
        libelle: poste.libelle,
        unite: poste.unite,
        quantite: poste.quantite,
        prixUnitaire: this.prixVenteHt() || poste.prixUnitaire,
      },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as PrixFourniDialogResult | null;
    if (!result) return;

    this.sauvegarde.set(true);
    this.erreur.set(undefined);
    try {
      await this.dpgfApi.updateNoeud(poste.id, {
        prixUnitaire: result.prixUnitaire,
        mode: 'FOURNI',
      });
      this.prixFourni.set(result.prixUnitaire);
      this.modeLocal.set('FOURNI');
      this.statut.set('saved');
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    } finally {
      this.sauvegarde.set(false);
    }
  }

  async ajouterSousDetail(): Promise<void> {
    if (!this.modifiable()) return;
    const result = await this.openSousDetailDialog('create');
    if (!result) return;
    const dpu = await this.assurerDpu();
    if (!dpu?.id) return;
    await this.persistComposants(dpu.id, [
      ...this.composants(),
      {
        id: crypto.randomUUID(),
        type: result.type,
        articleOuPosteId: result.designation,
        quantite: result.quantite,
        unite: result.unite,
        prixUnitaire: result.prixUnitaire,
        total: result.total,
      },
    ]);
  }

  async modifierSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.modifiable()) return;
    const result = await this.openSousDetailDialog('edit', row);
    if (!result || !this.dpu()?.id) return;
    await this.persistComposants(
      this.dpu()!.id!,
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
            }
          : c,
      ),
    );
  }

  async dupliquerSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.modifiable() || !this.dpu()?.id) return;
    await this.persistComposants(this.dpu()!.id!, [
      ...this.composants(),
      { ...row, id: crypto.randomUUID() },
    ]);
  }

  async supprimerSousDetail(row: ComposantDPU): Promise<void> {
    if (!this.modifiable() || !this.dpu()?.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le sous-détail',
      message: `Supprimer « ${row.articleOuPosteId} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    await this.persistComposants(
      this.dpu()!.id!,
      this.composants().filter((c) => c.id !== row.id),
    );
  }

  async ouvrirChiffrage(): Promise<void> {
    if (!this.modifiable()) return;
    const dpu = await this.assurerDpu();
    if (!dpu?.id) return;
    const ref = this.dialog.open(PosteChiffrageDialogComponent, {
      width: '28rem',
      data: {
        deboursSec: this.deboursSec(),
        fraisGenerauxPercent: this.fgPct(),
        margePercent: this.margePct(),
      },
    });
    const result = (await firstValueFrom(ref.afterClosed())) as PosteChiffrageDialogResult | null;
    if (!result) return;
    await this.persistTaux(dpu.id, result.fraisGenerauxPercent, result.margePercent);
  }

  private async openSousDetailDialog(
    mode: 'create' | 'edit',
    row?: ComposantDPU,
  ): Promise<SousDetailDialogResult | null> {
    const ref = this.dialog.open(SousDetailDialogComponent, {
      width: '32rem',
      data: {
        mode,
        uniteOptions: this.uniteOptions(),
        initial: row
          ? {
              type: row.type,
              designation: row.articleOuPosteId,
              unite: row.unite,
              quantite: row.quantite,
              prixUnitaire: row.prixUnitaire,
            }
          : {
              unite: this.poste()?.unite ?? this.uniteOptions()[0]?.code ?? 'U',
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
      this.applyDpu(created);
      this.modeLocal.set('DECOMPOSE');
      return this.dpu();
    } catch (e) {
      this.erreur.set(this.msg(e));
      return null;
    }
  }

  private async persistComposants(dpuId: string, composants: ComposantDPU[]): Promise<void> {
    this.sauvegarde.set(true);
    this.erreur.set(undefined);
    try {
      const recomputed = this.dpuMath.recomputeTotals(composants);
      const updated = await this.dpuApi.update(dpuId, {
        composants: recomputed.map((c) => ({
          id: c.id,
          type: c.type,
          articleOuPosteId: c.articleOuPosteId,
          quantite: c.quantite,
          unite: c.unite,
          prixUnitaire: c.prixUnitaire,
          total: c.total,
        })),
      });
      this.applyDpu(updated);
      this.modeLocal.set('DECOMPOSE');
      this.statut.set('saved');
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    } finally {
      this.sauvegarde.set(false);
    }
  }

  private async persistTaux(dpuId: string, fg: number, marge: number): Promise<void> {
    this.sauvegarde.set(true);
    this.erreur.set(undefined);
    try {
      const updated = await this.dpuApi.update(dpuId, {
        fraisGenerauxPercent: fg,
        margeBeneficiairePercent: marge,
      });
      this.applyDpu(updated);
      this.modeLocal.set('DECOMPOSE');
      this.statut.set('saved');
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    } finally {
      this.sauvegarde.set(false);
    }
  }

  private async chargerDpu(noeudId: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    this.statut.set('idle');
    try {
      const list = await this.dpuApi.listByNoeud(noeudId);
      if (list[0]) {
        this.applyDpu(list[0]);
        if ((list[0].composants?.length ?? 0) > 0) this.modeLocal.set('DECOMPOSE');
      } else {
        this.dpu.set(null);
      }
    } catch (e) {
      this.dpu.set(null);
      this.erreur.set(this.msg(e));
    } finally {
      this.chargement.set(false);
    }
  }

  private applyDpu(raw: PrixDPU): void {
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
  }

  private normalizeComposants(list: ComposantDPU[]): ComposantDPU[] {
    return this.dpuMath.recomputeTotals(
      list.map((c) => ({
        id: c.id || crypto.randomUUID(),
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

  private msg(e: unknown): string {
    const err = e as { error?: { message?: string; code?: string } };
    return err?.error?.message ?? err?.error?.code ?? 'Impossible d’enregistrer la décomposition.';
  }
}
