import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import type { AffectationEmploye } from '../../pointage/models';

export interface PlanningEntry {
  employeId: string;
  employeNom: string;
  dateJour: string;
  chantierId?: string | null;
  chantierCode?: string | null;
  pointageHeures: number;
  congeType?: string;
  mode?: string;
}

export interface PlanningResult {
  entries: PlanningEntry[];
  affectations: AffectationEmploye[];
}

export interface PlanningQuery {
  from: string;
  to: string;
  chantierId?: string;
  employeId?: string;
}

@Injectable({ providedIn: 'root' })
export class PlanningApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  async getPlanning(query: PlanningQuery): Promise<PlanningResult> {
    let params = new HttpParams().set('from', query.from).set('to', query.to);
    if (query.chantierId) params = params.set('chantierId', query.chantierId);
    if (query.employeId) params = params.set('employeId', query.employeId);

    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const url = `${base}/api/v1/rh/planning`;
    return firstValueFrom(this.http.get<PlanningResult>(url, { params }));
  }
}
