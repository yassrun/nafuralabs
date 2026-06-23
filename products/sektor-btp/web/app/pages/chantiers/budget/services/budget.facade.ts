import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import {
  type BudgetFilters,
  type BudgetRevisionDraft,
  type BudgetRubrique,
  type ChantierBudget,
  type ChantierBudgetStatus,
} from '../models';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { ChantierApiService } from '../../services/chantier-api.service';

import {
  apiBudgetToChantierBudget,
  BudgetApiService,
  chantierBudgetToApiUpsert,
} from './budget-api.service';

/**
 * Input describing a stock outflow validated for a chantier. The Budget facade
 * uses it to increment the "réalisé HT" of the matching rubrique (or article
 * drilldown row when an `articleId` is provided).
 */
export interface ConsommationChantierInput {
  /** Chantier id (preferred) or chantier code — both are matched. */
  chantierId: string;
  /** Rubrique target (MATERIAUX, MO, SOUS_TRAITANCE, …). */
  rubrique: string;
  /** Montant HT (qte × prixPMP) à incrémenter dans réalisé. */
  montantHt: number;
  /** Optional article id to update the drilldown row. */
  articleId?: string;
  /** Optional article label, used to display the drilldown row. */
  articleLabel?: string;
  /** Optional unit. */
  unite?: string;
  /** Quantité consommée (incrémente `qteConsommee` du drilldown). */
  qte?: number;
  /** Source mouvement (référence pour audit). */
  reference?: string;
  /** Origine métier : traçabilité colonne « réalisé matière stock ». */
  origin?: 'STOCK' | 'MANUAL';
}

const DEFAULT_FILTERS: BudgetFilters = {
  statuses: ['EN_COURS', 'SUSPENDU'],
  consommationRange: 'TOUS',
  margeRange: 'TOUS',
  enAlerte: false,
};

function computeDerived(chantier: ChantierBudget): ChantierBudget {
  const budgetReviseHt = chantier.lignes.length
    ? chantier.lignes.reduce((sum, line) => sum + line.reviseHt, 0)
    : chantier.budgetReviseHt;
  const budgetInitialHt = chantier.lignes.length
    ? chantier.lignes.reduce((sum, line) => sum + line.initialHt, 0)
    : chantier.budgetInitialHt;
  const engageHt = chantier.lignes.length
    ? chantier.lignes.reduce((sum, line) => sum + line.engageHt, 0)
    : chantier.engageHt;
  const realiseHt = chantier.lignes.length
    ? chantier.lignes.reduce((sum, line) => sum + line.realiseHt, 0)
    : chantier.realiseHt;
  const resteAEngagerHt = budgetReviseHt - engageHt;
  const consommationPercent = budgetReviseHt ? Number((((engageHt + realiseHt) / budgetReviseHt) * 100).toFixed(1)) : 0;
  const margeProjeteePercent = chantier.situationsNetApayerHt
    ? Number((((chantier.situationsNetApayerHt - realiseHt) / chantier.situationsNetApayerHt) * 100).toFixed(1))
    : 0;
  return {
    ...chantier,
    budgetInitialHt,
    budgetReviseHt,
    engageHt,
    realiseHt,
    resteAEngagerHt,
    consommationPercent,
    margeProjeteePercent,
  };
}

function matchesConsommation(filter: BudgetFilters['consommationRange'], value: number): boolean {
  switch (filter) {
    case 'LOW':
      return value < 70;
    case 'MID':
      return value >= 70 && value <= 90;
    case 'HIGH':
      return value > 90 && value <= 100;
    case 'OVER':
      return value > 100;
    default:
      return true;
  }
}

function matchesMarge(filter: BudgetFilters['margeRange'], value: number): boolean {
  switch (filter) {
    case 'NEGATIVE':
      return value < 0;
    case 'LOW':
      return value >= 0 && value < 8;
    case 'HEALTHY':
      return value >= 8;
    default:
      return true;
  }
}

@Injectable({ providedIn: 'root' })
export class BudgetFacade {
  private readonly audit = inject(ErpAuditService, { optional: true });
  private readonly budgetApi = inject(BudgetApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly locale = inject(LOCALE_ID);
  private readonly budgetsState = signal<ChantierBudget[]>([]);
  private readonly filtersState = signal<BudgetFilters>(DEFAULT_FILTERS);

  readonly filters = this.filtersState.asReadonly();
  readonly budgets = computed(() => this.budgetsState());
  readonly filteredBudgets = computed(() => {
    const filters = this.filtersState();
    return this.budgetsState().filter((budget) => {
      const statusAllowed = filters.statuses.length === 0 || filters.statuses.includes(budget.status);
      const consommationAllowed = matchesConsommation(filters.consommationRange, budget.consommationPercent);
      const margeAllowed = matchesMarge(filters.margeRange, budget.margeProjeteePercent);
      const alertAllowed = !filters.enAlerte || budget.alerte;
      return statusAllowed && consommationAllowed && margeAllowed && alertAllowed;
    });
  });
  readonly kpis = computed(() => {
    const budgets = this.filteredBudgets();
    const totals = budgets.reduce(
      (acc, budget) => {
        acc.initial += budget.budgetInitialHt;
        acc.revise += budget.budgetReviseHt;
        acc.engage += budget.engageHt;
        acc.realise += budget.realiseHt;
        acc.alerts += budget.alerte ? 1 : 0;
        return acc;
      },
      { initial: 0, revise: 0, engage: 0, realise: 0, alerts: 0 }
    );
    return {
      ...totals,
      resteAEngager: totals.revise - totals.engage,
      marge: totals.revise ? Number((((totals.revise - totals.realise) / totals.revise) * 100).toFixed(1)) : 0,
    };
  });

  setFilters(patch: Partial<BudgetFilters>): void {
    this.filtersState.update((current) => ({ ...current, ...patch }));
  }

  toggleStatus(status: ChantierBudgetStatus, checked: boolean): void {
    this.filtersState.update((current) => ({
      ...current,
      statuses: checked ? [...new Set([...current.statuses, status])] : current.statuses.filter((value) => value !== status),
    }));
  }

  getBudgetById(id: string): ChantierBudget | undefined {
    return this.budgetsState().find((budget) => budget.id === id);
  }

  async loadBudgetFromApi(chantierId: string): Promise<ChantierBudget | undefined> {
    try {
      const api = await this.budgetApi.getByChantierId(chantierId);
      const mapped = apiBudgetToChantierBudget(api);
      this.budgetsState.update((current) => {
        const index = current.findIndex((budget) => budget.id === mapped.id);
        if (index < 0) {
          return [...current, mapped];
        }
        const next = [...current];
        next[index] = mapped;
        return next;
      });
      return mapped;
    } catch {
      return this.getBudgetById(chantierId);
    }
  }

  async loadListingFromApi(chantierId?: string): Promise<void> {
    try {
      const { items: allChantiers } = await this.chantierApi.getAll();
      const chantiers = chantierId
        ? allChantiers.filter((c) => c.id === chantierId || c.code === chantierId)
        : allChantiers;
      const budgets = await Promise.all(
        chantiers.map(async (chantier) => {
          try {
            const api = await this.budgetApi.getByChantierId(chantier.id);
            return apiBudgetToChantierBudget(api);
          } catch {
            return undefined;
          }
        }),
      );
      const loaded = budgets.filter((budget): budget is ChantierBudget => Boolean(budget));
      if (loaded.length > 0) {
        this.budgetsState.set(loaded.map(computeDerived));
      }
    } catch {
      // API unavailable — keep current state.
    }
  }

  /**
   * Agrège le réalisé matière (quantités / montants issus des sorties stock) par ligne de drilldown.
   */
  realisesMatieresParPoste(chantierId: string): Array<{
    rubrique: BudgetRubrique;
    drillId: string;
    label: string;
    unite: string;
    qteStock: number;
    montantStockHt: number;
    articleId?: string;
  }> {
    const budget = this.budgetsState().find(
      (b) =>
        b.id === chantierId ||
        b.code === chantierId ||
        b.code === chantierId.toUpperCase(),
    );
    if (!budget) return [];
    const rows: Array<{
      rubrique: BudgetRubrique;
      drillId: string;
      label: string;
      unite: string;
      qteStock: number;
      montantStockHt: number;
      articleId?: string;
    }> = [];
    for (const line of budget.lignes) {
      for (const d of line.drilldown ?? []) {
        const qteStock = d.qteRealiseeStock ?? 0;
        const montantStockHt = d.montantRealiseMatiereStockHt ?? 0;
        if (qteStock <= 0 && montantStockHt <= 0) continue;
        rows.push({
          rubrique: line.rubrique,
          drillId: d.id,
          label: d.label,
          unite: d.unite,
          qteStock,
          montantStockHt,
          articleId: d.articleId,
        });
      }
    }
    return rows;
  }

  /**
   * Top chantiers dont la rubrique matériaux dépasse fortement le réalisé stock / révisé (mock pilotage).
   */
  topChantiersSurconsoMatiere(limit = 3): Array<{
    id: string;
    code: string;
    name: string;
    ratioStockVsRevise: number;
  }> {
    return this.budgetsState()
      .map((b) => {
        const mat = b.lignes.find((l) => l.rubrique === 'MATERIAUX');
        const stockHt = mat?.realiseMatiereStockHt ?? 0;
        const revise = mat?.reviseHt ?? 0;
        const ratioStockVsRevise = revise ? stockHt / revise : 0;
        return { id: b.id, code: b.code, name: b.name, ratioStockVsRevise };
      })
      .filter((row) => row.ratioStockVsRevise > 0.85)
      .sort((a, b) => b.ratioStockVsRevise - a.ratioStockVsRevise)
      .slice(0, limit);
  }

  /**
   * Increment the "réalisé HT" of a chantier budget when a stock outflow is
   * validated. Updates the drilldown row when `articleId` is provided. Recomputes
   * derived KPIs (consommation %, marge, alertes) at the end.
   *
   * Returns true if the chantier was found and updated, false otherwise.
   */
  recordConsommation(input: ConsommationChantierInput): boolean {
    let anyUpdated = false;
    const fromStock = input.origin !== 'MANUAL';
    this.budgetsState.update((current) =>
      current.map((budget) => {
        const matches =
          budget.id === input.chantierId ||
          budget.code === input.chantierId ||
          budget.code === input.chantierId.toUpperCase();
        if (!matches) return budget;

        let touchedThisBudget = false;
        const lignes = budget.lignes.map((line) => {
          if (line.rubrique !== input.rubrique) return line;

          touchedThisBudget = true;
          const realiseHt = line.realiseHt + input.montantHt;
          const realiseMatiereStockHt = fromStock
            ? (line.realiseMatiereStockHt ?? 0) + input.montantHt
            : (line.realiseMatiereStockHt ?? 0);

          const articleMatch = (d: { id: string; articleId?: string }) =>
            Boolean(input.articleId && (d.id === input.articleId || d.articleId === input.articleId));

          const drilldown = line.drilldown
            ? line.drilldown.map((d) => {
                if (!articleMatch(d)) return d;
                const next = {
                  ...d,
                  qteConsommee: (d.qteConsommee ?? 0) + (input.qte ?? 0),
                  montantRealiseHt: (d.montantRealiseHt ?? 0) + input.montantHt,
                  ...(fromStock
                    ? {
                        qteRealiseeStock: (d.qteRealiseeStock ?? 0) + (input.qte ?? 0),
                        montantRealiseMatiereStockHt:
                          (d.montantRealiseMatiereStockHt ?? 0) + input.montantHt,
                      }
                    : {}),
                };
                return next;
              })
            : line.drilldown;

          const finalDrilldown =
            input.articleId && drilldown && !drilldown.some((d) => articleMatch(d))
              ? [
                  ...drilldown,
                  {
                    id: input.articleId,
                    articleId: input.articleId,
                    label: input.articleLabel ?? input.articleId,
                    unite: input.unite ?? '',
                    qteBudget: 0,
                    qteCommande: 0,
                    qteLivree: 0,
                    qteConsommee: input.qte ?? 0,
                    montantRealiseHt: input.montantHt,
                    qteRealiseeStock: fromStock ? (input.qte ?? 0) : 0,
                    montantRealiseMatiereStockHt: fromStock ? input.montantHt : 0,
                  },
                ]
              : drilldown;

          return {
            ...line,
            realiseHt,
            realiseMatiereStockHt,
            resteHt: line.reviseHt - line.engageHt - 0,
            ecartHt: line.reviseHt - realiseHt,
            ecartPercent: line.reviseHt
              ? Number((((line.reviseHt - realiseHt) / line.reviseHt) * 100).toFixed(1))
              : 0,
            drilldown: finalDrilldown,
          };
        });

        if (!touchedThisBudget) return budget;

        anyUpdated = true;
        return computeDerived({
          ...budget,
          lignes,
        });
      }),
    );

    if (anyUpdated) {
      this.audit?.log(
        'UPDATE',
        'CONSOMMATION',
        input.chantierId,
        input.reference ?? `Sortie stock ${input.chantierId}`,
        `${input.rubrique} +${input.montantHt.toLocaleString(this.locale)} MAD${
          input.qte ? ` (${input.qte} ${input.unite ?? ''})` : ''
        }`,
      );
    }
    return anyUpdated;
  }

  saveRevision(draft: BudgetRevisionDraft): void {
    this.budgetsState.update((current) =>
      current.map((budget) => {
        if (budget.id !== draft.chantierId) return budget;

        const previousTotal = budget.budgetReviseHt;
        const lignes = budget.lignes.map((line) => {
          const next = draft.lignes.find((item) => item.rubrique === line.rubrique);
          if (!next) return line;
          const reviseHt = next.reviseHt;
          return {
            ...line,
            reviseHt,
            resteHt: reviseHt - line.engageHt,
            ecartHt: reviseHt - line.realiseHt,
            ecartPercent: reviseHt ? Number((((reviseHt - line.realiseHt) / reviseHt) * 100).toFixed(1)) : 0,
          };
        });

        const nextBudget = computeDerived({
          ...budget,
          lignes,
          revisions: [
            {
              id: `r-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              ancienBudgetTotal: previousTotal,
              nouveauBudgetTotal: lignes.reduce((sum, line) => sum + line.reviseHt, 0),
              motif: draft.motif,
              pieceName: draft.pieceName,
            },
            ...budget.revisions,
          ],
        });

        const updated = {
          ...nextBudget,
          alerte: nextBudget.consommationPercent > 90 || nextBudget.margeProjeteePercent < 5,
          alertMessage:
            nextBudget.consommationPercent > 100
              ? 'Le niveau de consommation depasse le budget revise.'
              : nextBudget.margeProjeteePercent < 5
                ? 'La marge projetee est sous le seuil de vigilance.'
                : budget.alertMessage,
        };

        void this.budgetApi
          .upsert(draft.chantierId, chantierBudgetToApiUpsert(updated))
          .then((api) => apiBudgetToChantierBudget(api))
          .catch(() => undefined);

        return updated;
      })
    );
  }
}
