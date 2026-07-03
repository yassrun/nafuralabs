import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { HseKpiResponse } from '@applications/erp/pages/hse/tableau-bord-hse/services/hse-kpi-api.service';

export interface ChantiersKpiResponse {
  nbActifs: number;
  totalCA: number;
  totalMarges: number;
  alertesBudget: number;
  alertesRetard: number;
}

export interface VentesKpiResponse {
  caCumule: number;
  caEncaisse: number;
  creancesOuvertes: number;
  facturesEnRetard: number;
  nbDevisGagnes: number;
}

export interface AchatsKpiResponse {
  volumeAchatsYTD: number;
  nbBcEnCours: number;
  dependanceTop3: number;
  economiesYTD: number;
}

export interface FinanceKpiResponse {
  tresorerieCourante: number;
  ratioLiquidite: number;
  bfr: number;
  dettesFournisseurs: number;
}

export interface RhKpiResponse {
  effectifs: number;
  masseSalarialeYTD: number;
  absenteisme: number;
  rotationAnnuelle: number;
}

export interface StockKpiResponse {
  valorisationStock: number;
  rotation: number;
  valoMagasinChantier: number;
}

export interface MarchesKpiResponse {
  nbContratsActifs: number;
  cumulSituations: number;
  cumulRG: number;
  cautionsExpirant30j: number;
}

export interface DashboardAllKpis {
  chantiers: ChantiersKpiResponse;
  ventes: VentesKpiResponse;
  achats: AchatsKpiResponse;
  finance: FinanceKpiResponse;
  rh: RhKpiResponse;
  hse: HseKpiResponse;
  stock: StockKpiResponse;
  marches: MarchesKpiResponse;
}

export interface DashboardKpiDateRange {
  from: string;
  to: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class DashboardKpiApiService extends FeatureApiService<unknown, unknown, unknown> {
  protected override basePath = '/api/v1';

  async fetchAll(params: DashboardKpiDateRange): Promise<DashboardAllKpis> {
    const query = this.buildQueryParams(params);
    const settled = await Promise.allSettled([
      this.get<ChantiersKpiResponse>(`${this.basePath}/chantiers/kpis`),
      this.get<VentesKpiResponse>(`${this.basePath}/ventes/kpis`, query),
      this.get<AchatsKpiResponse>(`${this.basePath}/achats/kpis`, query),
      this.get<FinanceKpiResponse>(`${this.basePath}/finance/kpis`),
      this.get<RhKpiResponse>(`${this.basePath}/rh/kpis`),
      this.get<HseKpiResponse>(`${this.basePath}/hse/kpis`, query),
      this.get<StockKpiResponse>(`${this.basePath}/stock/kpis`),
      this.get<MarchesKpiResponse>(`${this.basePath}/marches/kpis`),
    ]);

    const pick = <T>(index: number, fallback: T): T => {
      const result = settled[index];
      if (result?.status === 'fulfilled') {
        return result.value as T;
      }
      return fallback;
    };

    return {
      chantiers: pick(0, {
        nbActifs: 0,
        totalCA: 0,
        totalMarges: 0,
        alertesBudget: 0,
        alertesRetard: 0,
      }),
      ventes: pick(1, {
        caCumule: 0,
        caEncaisse: 0,
        creancesOuvertes: 0,
        facturesEnRetard: 0,
        nbDevisGagnes: 0,
      }),
      achats: pick(2, {
        volumeAchatsYTD: 0,
        nbBcEnCours: 0,
        dependanceTop3: 0,
        economiesYTD: 0,
      }),
      finance: pick(3, {
        tresorerieCourante: 0,
        ratioLiquidite: 0,
        bfr: 0,
        dettesFournisseurs: 0,
      }),
      rh: pick(4, {
        effectifs: 0,
        masseSalarialeYTD: 0,
        absenteisme: 0,
        rotationAnnuelle: 0,
      }),
      hse: pick(5, {
        tf1: 0,
        tf2: 0,
        tg: 0,
        joursSansAccident: 0,
        pyramideBird: {
          incidents: 0,
          presquAccidents: 0,
          at: 0,
          atAvecArret: 0,
          ratioPresquAccidentParAt: 0,
          ratioIncidentParAt: 0,
        },
        evolutionMensuelle: [],
      } as HseKpiResponse),
      stock: pick(6, {
        valorisationStock: 0,
        rotation: 0,
        valoMagasinChantier: 0,
      }),
      marches: pick(7, {
        nbContratsActifs: 0,
        cumulSituations: 0,
        cumulRG: 0,
        cautionsExpirant30j: 0,
      }),
    };
  }
}
