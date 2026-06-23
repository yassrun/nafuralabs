import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

import type { BudgetLigne, BudgetRubrique, ChantierBudget } from '../models';

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

export interface ApiBudgetUpsert {
  previsionnelHt?: number;
  reviseHt?: number;
  lignes: Array<{
    id?: string;
    rubrique: string;
    label: string;
    lot?: string;
    previsionnelHt: number;
    reviseHt: number;
    engageHt?: number;
    realiseHt?: number;
    posteBudgetaireId?: string;
    ordre?: number;
  }>;
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

export function chantierBudgetToApiUpsert(budget: ChantierBudget): ApiBudgetUpsert {
  return {
    previsionnelHt: budget.budgetInitialHt,
    reviseHt: budget.budgetReviseHt,
    lignes: budget.lignes.map((line, index) => ({
      rubrique: line.rubrique,
      label: line.label,
      lot: line.lot,
      previsionnelHt: line.initialHt,
      reviseHt: line.reviseHt,
      engageHt: line.engageHt,
      realiseHt: line.realiseHt,
      ordre: index + 1,
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class BudgetApiService extends FeatureApiService<ApiBudgetChantier> {
  protected override basePath = '/api/v1/chantiers';

  async getByChantierId(chantierId: string): Promise<ApiBudgetChantier> {
    return this.get<ApiBudgetChantier>(`${this.basePath}/${encodeURIComponent(chantierId)}/budget`);
  }

  async upsert(chantierId: string, body: ApiBudgetUpsert): Promise<ApiBudgetChantier> {
    return this.post<ApiBudgetChantier>(`${this.basePath}/${encodeURIComponent(chantierId)}/budget`, body);
  }
}
