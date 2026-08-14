import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

export interface HseKpiPyramideBird {
  incidents: number;
  presquAccidents: number;
  at: number;
  atAvecArret: number;
  ratioPresquAccidentParAt: number;
  ratioIncidentParAt: number;
}

export interface HseKpiEvolutionMensuelle {
  mois: string;
  at: number;
  atAvecArret: number;
  joursArret: number;
}

export interface HseKpiResponse {
  tf1: number;
  tf2: number;
  tg: number;
  joursSansAccident: number;
  pyramideBird: HseKpiPyramideBird;
  evolutionMensuelle: HseKpiEvolutionMensuelle[];
  heuresTravaillees?: number;
}

@Injectable({ providedIn: 'root' })
export class HseKpiApiService extends FeatureApiService<unknown, unknown, unknown> {
  protected override basePath = '/api/v1/hse/kpis';

  async getKpis(params: {
    from: string;
    to: string;
    chantierId?: string;
  }): Promise<HseKpiResponse> {
    const query = this.buildQueryParams(params);
    return this.get<HseKpiResponse>(this.basePath, query);
  }
}
