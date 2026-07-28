import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import type { EffetCommerce, EffetCommerceStatus } from '../models';
import { type ApiTradeEffect, effetToUi } from './effet-commerce-finance.mapper';

@Injectable({ providedIn: 'root' })
export class EffetCommerceApiService extends FeatureApiService<EffetCommerce, never, never> {
  protected override basePath = '/api/v1/effets';

  async listEffets(status?: EffetCommerceStatus): Promise<EffetCommerce[]> {
    let params: HttpParams | undefined;
    if (status) params = new HttpParams().set('status', status);
    const rows = await this.get<ApiTradeEffect[]>(this.basePath, params);
    return (rows ?? []).map(effetToUi);
  }

  async remiseEncaissement(id: string): Promise<EffetCommerce> {
    const row = await this.post<ApiTradeEffect>(`${this.basePath}/${id}/remise-encaissement`, {});
    return effetToUi(row);
  }

  async escompte(id: string, frais?: number): Promise<EffetCommerce> {
    const url =
      frais != null
        ? `${this.basePath}/${id}/escompte?frais=${encodeURIComponent(String(frais))}`
        : `${this.basePath}/${id}/escompte`;
    const row = await this.post<ApiTradeEffect>(url, {});
    return effetToUi(row);
  }

  async impaye(id: string): Promise<EffetCommerce> {
    const row = await this.post<ApiTradeEffect>(`${this.basePath}/${id}/impaye`, {});
    return effetToUi(row);
  }
}
