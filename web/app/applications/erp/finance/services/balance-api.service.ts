import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import { type ApiBalanceResponse, balanceToUi } from './comptabilite-finance.mapper';
import type { BalanceLigne, BalanceQuery, BalanceTotaux } from '../models';

@Injectable({ providedIn: 'root' })
export class BalanceApiService extends FeatureApiService<BalanceLigne, never, never> {
  protected override basePath = '/api/v1/balance';

  async getBalance(query: BalanceQuery = {}): Promise<{
    lignes: BalanceLigne[];
    totaux: BalanceTotaux;
  }> {
    let params = new HttpParams();
    if (query.dateDebut) params = params.set('from', query.dateDebut);
    if (query.dateFin) params = params.set('to', query.dateFin);
    if (query.classe != null) params = params.set('classe', String(query.classe));
    if (query.type) params = params.set('type', query.type);
    if (query.axeAnalytique) params = params.set('axeAnalytique', query.axeAnalytique);
    const response = await this.get<ApiBalanceResponse>(this.basePath, params);
    return balanceToUi(response);
  }
}
