import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { DPGF } from '@applications/erp/etudes/models';

export interface DpgfLotTotal {
  code: string;
  libelle: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DpgfApiService extends FeatureApiService<DPGF> {
  protected override basePath = '/api/v1/etudes/dpgf';
  protected override searchFields = ['numero', 'projetNom'];

  async listByMetre(metreId: string): Promise<DPGF[]> {
    const params = new HttpParams().set('metreId', metreId);
    return this.get<DPGF[]>(this.basePath, params);
  }

  async getArbre(id: string): Promise<DPGF> {
    return this.get<DPGF>(`${this.basePath}/${id}/arbre`);
  }

  async createFromMetre(metreId: string, tvaTaux = 20): Promise<DPGF> {
    const params = new HttpParams()
      .set('fromMetreId', metreId)
      .set('tvaTaux', String(tvaTaux));
    return firstValueFrom(
      this.http.post<DPGF>(this.resolveUrl(this.basePath), {}, { params }),
    );
  }

  async getTotauxByLot(id: string): Promise<DpgfLotTotal[]> {
    return this.get<DpgfLotTotal[]>(`${this.basePath}/${id}/totaux`);
  }
}
