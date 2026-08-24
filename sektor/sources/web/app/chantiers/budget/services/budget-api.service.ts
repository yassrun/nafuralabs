import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';

import type {
  BudgetArbre,
  BudgetLigne,
  BudgetRubrique,
  ChantierBudget,
  CoutReelDraft,
  DebourseNoeudDraft,
} from '../models';

export interface ApiBudgetLigne {
  id?: string;
  rubrique: BudgetRubrique | string;
  label: string;
  lot?: string;
  initialHt: number;
  reviseHt: number;
  engageHt?: number;
  realiseHt?: number;
  resteHt?: number;
  ecartHt?: number;
  ecartPercent?: number;
  posteBudgetaireId?: string;
  ordre?: number;
}

export interface ApiBudgetChantier {
  id: string;
  chantierId: string;
  code?: string;
  name?: string;
  client?: string;
  budgetInitialHt: number;
  budgetReviseHt: number;
  engageHt?: number;
  realiseHt?: number;
  resteAEngagerHt?: number;
  lignes: ApiBudgetLigne[];
}

export function apiBudgetToChantierBudget(api: ApiBudgetChantier): ChantierBudget {
  const lignes: BudgetLigne[] = (api.lignes ?? []).map((line) => ({
    rubrique: line.rubrique as BudgetRubrique,
    label: line.label,
    initialHt: Number(line.initialHt ?? 0),
    reviseHt: Number(line.reviseHt ?? 0),
    engageHt: Number(line.engageHt ?? 0),
    realiseHt: Number(line.realiseHt ?? 0),
    resteHt: Number(line.resteHt ?? line.reviseHt - (line.engageHt ?? 0)),
    ecartHt: Number(line.ecartHt ?? line.reviseHt - (line.realiseHt ?? 0)),
    ecartPercent: Number(line.ecartPercent ?? 0),
    lot: line.lot ?? '',
  }));

  const budgetInitialHt = Number(api.budgetInitialHt ?? 0);
  const budgetReviseHt = Number(api.budgetReviseHt ?? 0);
  const engageHt = Number(api.engageHt ?? lignes.reduce((sum, line) => sum + line.engageHt, 0));
  const realiseHt = Number(api.realiseHt ?? lignes.reduce((sum, line) => sum + line.realiseHt, 0));
  const resteAEngagerHt = Number(api.resteAEngagerHt ?? budgetReviseHt - engageHt);
  const consommationPercent = budgetReviseHt
    ? Number((((engageHt + realiseHt) / budgetReviseHt) * 100).toFixed(1))
    : 0;

  return {
    id: api.chantierId,
    code: api.code ?? api.chantierId,
    name: api.name ?? '',
    client: api.client ?? '',
    status: 'EN_COURS',
    budgetVenteHt: budgetReviseHt,
    situationsNetApayerHt: 0,
    budgetInitialHt,
    budgetReviseHt,
    engageHt,
    realiseHt,
    resteAEngagerHt,
    resteAExecuterHt: budgetReviseHt - realiseHt,
    consommationPercent,
    margeProjeteePercent: 0,
    alerte: consommationPercent > 90,
    lignes,
    engagements: [],
    revisions: [],
    evolutionMensuelle: [],
  };
}

@Injectable({ providedIn: 'root' })
export class BudgetApiService extends FeatureApiService<ApiBudgetChantier> {
  protected override basePath = '/api/v1/chantiers';
  private readonly postesPath = '/api/v1/postes-budgetaires';

  /**
   * Vue par rubrique du chantier — **calculée** par le serveur depuis l'arbre. Il n'existe plus
   * d'écriture jumelle : le budget par rubrique n'est plus stocké nulle part.
   */
  async getByChantierId(chantierId: string): Promise<ApiBudgetChantier> {
    return this.get<ApiBudgetChantier>(`${this.basePath}/${encodeURIComponent(chantierId)}/budget`);
  }

  /** L'arbre du chantier avec, à chaque étage, déboursé, marge, avancement et écart. */
  async getArbre(chantierId: string): Promise<BudgetArbre> {
    return this.get<BudgetArbre>(`${this.basePath}/${encodeURIComponent(chantierId)}/budget-arbre`);
  }

  /** Saisie du déboursé d'un noeud interne — refusée sur un noeud vendu, dont le prévu est copié. */
  async saisirDebourse(draft: DebourseNoeudDraft): Promise<void> {
    await this.put<unknown>(`${this.postesPath}/${encodeURIComponent(draft.noeudId)}/debourse`, {
      rubriques: draft.rubriques.map((r) => ({ rubrique: r.rubrique, montantHt: r.montantHt })),
    });
  }

  /** Révision d'un noeud : elle se pose à côté du prévu, elle ne le réécrit jamais. */
  async reviserDebourse(draft: DebourseNoeudDraft): Promise<void> {
    await this.put<unknown>(
      `${this.postesPath}/${encodeURIComponent(draft.noeudId)}/debourse/revision`,
      { rubriques: draft.rubriques.map((r) => ({ rubrique: r.rubrique, montantHt: r.montantHt })) },
    );
  }

  /** Imputation d'un coût réel. Sans noeud, il tombe sur « Frais de chantier ». */
  async imputerCoutReel(chantierId: string, draft: CoutReelDraft): Promise<void> {
    await this.post<unknown>(`${this.basePath}/${encodeURIComponent(chantierId)}/couts-reels`, {
      posteId: draft.noeudId,
      rubrique: draft.rubrique,
      montantHt: draft.montantHt,
      dateCout: draft.dateCout,
      libelle: draft.libelle,
      source: draft.source,
    });
  }
}
