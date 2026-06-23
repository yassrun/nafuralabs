import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { MotifMouvement, TxType } from '../models';

export type MotifMouvementCreate = Omit<MotifMouvement, 'id'>;
export type MotifMouvementUpdate = Partial<MotifMouvementCreate>;

@Injectable({ providedIn: 'root' })
export class MotifsApiService extends FeatureApiService<
  MotifMouvement,
  MotifMouvementCreate,
  MotifMouvementUpdate
> {
  protected override basePath = '/api/v1/motifs';
  protected override searchFields = ['code', 'name'];

  async listByTxType(txType: TxType): Promise<MotifMouvement[]> {
    const params = new HttpParams().set('txType', txType);
    return (await this.get<MotifMouvement[]>(this.basePath, params)) ?? [];
  }
}
